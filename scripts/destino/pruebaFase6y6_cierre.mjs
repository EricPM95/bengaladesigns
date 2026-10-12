// Prueba de la Tanda 6y6 (respuestas de Eric a la 6y5):
//   node scripts/destino/pruebaFase6y6_cierre.mjs [paso=3]
// 1. El miércoles del Vaticano: los Museos como siempre y solo la Plaza y la Basílica a la tarde (documento, datos y motor dicen lo mismo).
// 2. El tope del pool con 1 día baja a 2 (2 con 1 día, 3 con 2 días, 6 con 3 o más).
// 3. Fontana de Trevi, secretos: una sola frase para la costumbre, sin repetir la historia.
// 4. La guía y la ida y la vuelta (el tramo sigue abierto al guardar la hora).
import fs from 'node:fs'
import { planListasTrip } from '../../shared/routeEngine/listasTrip.js'
import { findPipelineV2Data } from '../../server/routeAlgorithm.js'
import { writtenDaysFor } from '../../server/engine/writtenDays.js'
import { travelTimesFor } from '../../server/engine/buildDayV3.js'

const args = Object.fromEntries(process.argv.slice(2).map((x) => x.split(/=(.*)/s).slice(0, 2)))
const PASO = Number(args.paso ?? 3)
const fallos = []
let comprobaciones = 0
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) fallos.push({ regla, texto })
}
const leer = (p) => fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n')
const add = (iso, n) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10)
const MUSEOS = 'Museos Vaticanos y Capilla Sixtina'
const PLAZA = 'Plaza de San Pedro'
const BASILICA = 'Basílica de San Pedro'

// ═══ 1. El miércoles de los Museos ═══
console.log('1. El miércoles del Vaticano')
{
  const doc = leer('docs/dias/DIAS_ROMA_PARADAS.md')
  // (Tanda 6y7: el miércoles se escribe de otra manera —solo si no se puede cambiar el día, y con la Plaza y la Basílica nunca antes de comer—; el detalle va en pruebaFase6y7_motor.mjs, parte 1.)
  debe(/\*\*el miércoles, si no se puede cambiar el día\*\*.*los Museos abren: van como siempre, a su hora, y no se quitan nunca por ser miércoles/.test(doc), '1 doc', 'el documento no dice lo de Eric sobre el miércoles')
  debe(!/el miércoles sin Museos\*\* el día empieza a su hora/.test(doc), '1 doc', 'el documento sigue con la variante vieja «el miércoles sin Museos»')
  const listas = JSON.parse(fs.readFileSync('data/dias/roma/listas.json', 'utf8'))
  const texto = JSON.stringify(listas)
  debe(texto.includes('Sin reserva, o con los Museos reservados hasta las 11:30:') && !texto.includes('"doc":"el miércoles sin Museos"') && !texto.includes('"doc": "el miércoles sin Museos"'), '1 datos', 'listas.json no lleva la variante nueva del miércoles (¿falta pasar listasConvertir.mjs?)')
  // En los datos: la variante quita la Plaza y la Basílica de la mañana y las pone al principio de la tarde; nunca quita los Museos.
  const halladas = []
  const recorre = (o) => {
    if (o && typeof o === 'object') {
      if (o.id === 'miercoles_audiencia' && /Sin reserva, o con los Museos/.test(o.doc ?? '')) halladas.push(o)
      for (const v of Object.values(o)) recorre(v)
    }
  }
  recorre(listas)
  debe(halladas.length === 1, '1 datos', `hay ${halladas.length} variantes «el miércoles» del D2 y debería haber 1`)
  const v = halladas[0]
  const quitar = v?.ops?.manana?.quitar ?? []
  debe(quitar.includes(PLAZA) && quitar.includes(BASILICA) && quitar.length === 2 && !JSON.stringify(v?.ops ?? {}).includes(`"quitar":["${MUSEOS}`), '1 datos', 'la variante del miércoles quita algo más que la Plaza y la Basílica de la mañana')
  const ins = v?.ops?.tarde?.insertar?.[0]
  debe(ins?.al_principio === true && (ins.parada ?? []).map((p) => p.lugar).join('|') === `${PLAZA}|${BASILICA}`, '1 datos', 'la Plaza y la Basílica no van al principio de la tarde')

  // En el motor, en todo el año: cada día del Vaticano que cae en miércoles (sin reserva de los Museos) lleva los Museos por la mañana y la Plaza y la Basílica después de comer.
  const D = findPipelineV2Data('Roma')
  const written = writtenDaysFor('roma')
  const travel = travelTimesFor('roma')
  const FORMAS = [{ dias: 1 }, { dias: 2 }, { dias: 3 }, { dias: 4, diaCuatro: 'roma' }, { dias: 5, diaCuatro: 'roma' }, { dias: 6, diaCuatro: 'roma' }]
  let miercoles = 0
  let normales = 0
  for (const forma of FORMAS) {
    for (let d = 0; d < 365; d += PASO) {
      const inicio = add('2027-01-01', d)
      // (Sin reserva, y con el Coliseo reservado a las 10:00 en cada día del viaje: así se fuerza un Vaticano en miércoles, que el motor evita cuando puede.)
      for (let k = 0; k <= forma.dias; k++) {
      const reserva = k === 0 ? {} : { entradas: { Coliseo: '10:00', 'Foro Romano y Palatino': '10:00' }, reservasGrandes: [{ name: 'Coliseo', dateIso: add(inicio, k - 1), dayNumber: k, time: '10:00' }] }
      const plan = planListasTrip({ destData: D, written, totalDays: forma.dias + 1, hasFreeTour: false, poolNames: [], experiencesPositive: [], dateRangeStartIso: inicio, travel, diaCuatro: forma.diaCuatro ?? null, entradas: {}, ...reserva })
      if (!plan) continue
      for (const dia of plan.days.filter((x) => x.curatedDay?.id === 'D2')) {
        const filas = (dia.escritoRows ?? []).filter((r) => r.tipo === 'parada' && r.lugar && !r.llegada)
        const hoja = `${forma.dias} días · ${inicio}${k ? ` + Coliseo 10:00 el día ${k}` : ''}`
        const conVariante = (dia.curatedDay.variantes ?? []).includes('miercoles_audiencia')
        const franja = (lugar) => filas.find((r) => r.lugar === lugar)?.franja
        const hayMuseos = filas.some((r) => r.lugar === MUSEOS)
        if (conVariante) {
          miercoles++
          debe(dia.hours?.weekday === 'miércoles', '1 motor', `${hoja}: la variante del miércoles en un ${dia.hours?.weekday}`)
          debe(hayMuseos && franja(MUSEOS) === 'manana', '1 motor', `${hoja}: el miércoles los Museos no están por la mañana`)
          debe(franja(PLAZA) === 'tarde' && franja(BASILICA) === 'tarde', '1 motor', `${hoja}: el miércoles la Plaza y la Basílica no van por la tarde (${franja(PLAZA)} / ${franja(BASILICA)})`)
          const todas = dia.escritoRows ?? []
          const iComida = todas.findIndex((r) => r.tipo === 'comida')
          const iPlaza = todas.findIndex((r) => r.lugar === PLAZA)
          debe(iComida >= 0 && iPlaza > iComida, '1 motor', `${hoja}: el miércoles la Plaza no va después de la comida`)
          debe(!(dia.escritoLog ?? []).some((l) => l.que === 'quitada' && l.sitio === MUSEOS), '1 motor', `${hoja}: el miércoles se quitó los Museos`)
        } else if (hayMuseos && dia.hours?.weekday !== 'miércoles') {
          normales++
          debe(franja(PLAZA) === 'manana', '1 motor', `${hoja}: un día del Vaticano normal ya no lleva la Plaza por la mañana`)
        }
      }
      }
    }
  }
  debe(miercoles > 0, '1 motor', 'no ha salido ningún miércoles del Vaticano para comprobar (la prueba no mide nada)')
  debe(normales > 0, '1 motor', 'no ha salido ningún día del Vaticano normal para comprobar')
  console.log(`   miércoles del Vaticano comprobados: ${miercoles}; días normales: ${normales}`)
}

// ═══ 2. El tope del pool ═══
console.log('2. El tope del pool')
{
  const fuente = leer('src/components/questionnaire/CuratedPlacesPool.tsx')
  const cuerpo = fuente.slice(fuente.indexOf('export function poolSelectionLimit'), fuente.indexOf('interface CuratedPlacesPoolProps'))
  debe(/if \(days === 1\) return 0/.test(cuerpo) && /days <= 2\) return 3/.test(cuerpo) && /return 6/.test(cuerpo), '2 tope', 'poolSelectionLimit no da 0 con 1 día (el pool no sale), 3 con 2 días y 6 con 3 o más')
  // (La función se prueba entera en pruebaFase6y4_formulario.mjs, con la tabla de 1 a 21 días; la medida de «No incluido» con ese tope va en pruebaFase6y5_motor.mjs, parte tope.)
  const motor = leer('scripts/destino/pruebaFase6y5_motor.mjs')
  debe(/const n = dias === 1 \? 2 : dias === 2 \? 3 : 6/.test(motor), '2 tope', 'la medida del «No incluido» no usa el tope de 2 con 1 día')
}

// ═══ 3. Fontana de Trevi, secretos ═══
console.log('3. Fontana de Trevi')
{
  const zona = JSON.parse(fs.readFileSync('data/pipeline_v2/detalle/roma/centro_historico.json', 'utf8'))
  const trevi = zona.places.find((p) => /Trevi/.test(p.name))
  const secretos = (trevi.secrets ?? []).join(' ')
  debe(/Antes de la moneda, la costumbre era beber de su agua para volver a Roma\. La película de 1954 hizo famosa la moneda\./.test(secretos), '3 trevi', 'los secretos de Trevi no llevan la frase de Eric')
  debe(!/La tradición original no era una moneda/.test(secretos) && !/echar monedas al agua es mucho más antiguo/.test(secretos), '3 trevi', 'los secretos de Trevi siguen con las dos frases que se contradicen')
  debe((secretos.match(/costumbre/g) ?? []).length === 1, '3 trevi', 'la costumbre de la moneda sale más de una vez en los secretos')
  // Sin repetir la historia: ninguna secuencia de 8 palabras seguidas en común.
  const palabras = (t) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]+/g, ' ').split(/\s+/).filter(Boolean)
  const historia = palabras(trevi.historia ?? '')
  const sec = palabras(secretos)
  const ocho = new Set()
  for (let i = 0; i + 8 <= historia.length; i++) ocho.add(historia.slice(i, i + 8).join(' '))
  let repetida = null
  for (let i = 0; i + 8 <= sec.length && !repetida; i++) if (ocho.has(sec.slice(i, i + 8).join(' '))) repetida = sec.slice(i, i + 8).join(' ')
  debe(Boolean(trevi.historia) && !repetida, '3 trevi', `los secretos de Trevi repiten la historia: «${repetida}»`)
}

// ═══ 4. La guía y la ida y la vuelta ═══
console.log('4. La guía y la ida y la vuelta')
{
  const guia = leer('docs/dias/GUIA_NUEVOS_DESTINOS.md')
  debe(/Lo de pago no se enseña con candados:\*\* simplemente no sale, salvo "Escuchar historia", que lleva candado en la versión gratis\./.test(guia), '4 guía', 'la guía no dice lo del candado de «Escuchar historia»')
  const tramo = leer('src/components/route/reservas/LlegadaYVuelta.tsx')
  const desde = tramo.indexOf('onSave={(time) => {')
  const guardar = tramo.slice(desde, tramo.indexOf('onGuardada()', desde))
  debe(/onMitad\(hoja\.leg\)/.test(guardar) && !/onMitad\(undefined\)/.test(guardar), '4 tramo', 'al guardar la hora el tramo no se queda abierto')
  debe(/onClick=\{\(\) => \{\s*onMitad\(undefined\)\s*onToggle\(\)\s*\}\}/.test(tramo), '4 tramo', 'al tocar la cabecera no se cierra el tramo abierto')
}

console.log(`\n${comprobaciones} comprobaciones, ${fallos.length} fallos`)
for (const f of fallos.slice(0, 40)) console.log(`  ✗ [${f.regla}] ${f.texto}`)
process.exitCode = fallos.length === 0 ? 0 : 1
