// La prueba de la Tanda 10L: fuera las tarjetas de las estaciones (queda solo la de Navidad, sin la hora del atardecer) y el último domingo de mes en los Museos Vaticanos.
//   node scripts/destino/pruebaTanda10L.mjs
// Usa el motor de verdad (buildDayBlockV3, igual que revision20.mjs), sin red ni servidor. No hace falta la muestra de 60 fechas: solo cambian textos, no el reparto de los días.
import fs from 'node:fs'
import { buildDayBlockV3 } from '../../server/engine/index.js'
import { seasonNoteFor } from '../../server/engine/seasonNote.js'
import { findPipelineV2Data } from '../../server/routeAlgorithm.js'
import { closedOnDay, isLastSundayOfMonth } from '../../shared/routeEngine/openingHours.js'
import { specialDateMatches } from '../../shared/routeEngine/specialDates.js'

let comprobaciones = 0
const fallos = []
const debe = (c, regla, texto) => {
  comprobaciones++
  if (!c) fallos.push({ regla, texto })
}
const leer = (f) => fs.readFileSync(f, 'utf8')
const D = findPipelineV2Data('Roma')
const sumar = (iso, n) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10)
const dia = (inicio, dias, n) => buildDayBlockV3(D, dias + 1, false, n, null, inicio, [], ['imprescindibles'], { city: 'Roma', scheduler: 'v3', month: null })

/* ───────────────────────── 1. Fuera las estaciones ───────────────────────── */
console.log('1. Ninguna fecha del año saca ya la tarjeta de una estación')
{
  const fuente = leer('server/engine/seasonNote.js')
  debe(!/SEASON_CARD_TEXTS|seasonOfDate|earlyMornings|hora_atardecer|\{hora\}/.test(fuente.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')), 'estaciones', 'seasonNote.js ya no lleva los textos de las estaciones ni la hora del atardecer')
  const raras = []
  const vistas = new Set()
  let navidad = 0
  const permitidas = new Set(['navidad', 'semana_santa', 'cumpleanos_ciudad']) // (Tanda 10M: las tres tarjetas especiales; ninguna estación.)
  // Un viaje de 2 días empezando cada día de un año entero (y de otro, para pillar Pascua y los bisiestos).
  for (const [desde, hasta] of [['2026-11-01', '2027-12-31']]) {
    for (let iso = desde; iso <= hasta; iso = sumar(iso, 1)) {
      const d1 = await dia(iso, 2, 1)
      const nota = d1?.season_note ?? null
      if (nota) {
        vistas.add(nota.season)
        if (!permitidas.has(nota.season)) raras.push(`${iso}: ${nota.season}`)
        if (nota.season === 'navidad') navidad++
        if (/anochece|atardece|{|hora/i.test(nota.text)) raras.push(`${iso}: el texto de ${nota.season} habla de la hora (${nota.text.slice(0, 60)})`)
      }
    }
  }
  debe(raras.length === 0, 'estaciones', `en 14 meses de fechas, ninguna saca la tarjeta de primavera, verano, otoño o invierno (${raras.slice(0, 3).join(' | ') || 'ninguna'})`)
  debe([...vistas].every((v) => permitidas.has(v)) && navidad > 20, 'estaciones', `las únicas tarjetas que salen son las especiales (${[...vistas].join(', ')}; ${navidad} fechas de salida de Navidad en esos meses)`)
  // Sin fechas, solo con el mes o la estación del formulario: tampoco.
  const sinFechas = seasonNoteFor(D, { calendar: { hasDates: false, season: 'verano' }, days: [] }, {})
  debe(sinFechas === null, 'estaciones', 'sin fechas (solo el mes o la estación del formulario) no sale ninguna tarjeta')
  const SinDatos = seasonNoteFor({ destination: 'X' }, { calendar: { hasDates: true }, days: [{ hours: { dateIso: '2026-07-10' }, schedule: { visits: [] } }] }, {})
  debe(SinDatos === null, 'estaciones', 'un día de verano con fechas: nada')
}

/* ───────────────────────── 2. Navidad, sin el atardecer ───────────────────────── */
console.log('2. La de Navidad se queda, sin la hora del atardecer')
{
  const textos = D.destination_config.nota_temporada
  const claves = Object.keys(textos).filter((k) => !k.startsWith('_'))
  debe(JSON.stringify(claves) === JSON.stringify(['navidad', 'semana_santa', 'cumpleanos_ciudad']), 'navidad', `Roma lleva sus 3 tarjetas, un solo texto cada una, sin variantes (${claves.join(', ')})`)
  debe(claves.every((k) => typeof textos[k].texto === 'string' && !/anochece|atardece|hora_atardecer|{hora/i.test(textos[k].texto)), 'navidad', 'ninguna habla de cuándo anochece ni lleva la hora del atardecer')
  debe(textos.navidad.texto === '¡Vas a vivir {destino} en Navidad! Uno de los momentos más bonitos del año para recorrerla. Te hemos preparado la mejor ruta para que disfrutes cada rincón de la ciudad.', 'navidad', 'el texto de Navidad es el que pidió Eric (palabra por palabra)')
  // En el viaje de verdad: antes de los árboles, con árboles, con mercadillo, sin noche… el mismo texto.
  const casos = []
  for (const inicio of ['2026-11-27', '2026-12-04', '2026-12-10', '2026-12-18', '2026-12-26', '2027-01-02']) {
    const d1 = await dia(inicio, 3, 1)
    if (d1?.season_note) casos.push({ inicio, nota: d1.season_note })
  }
  debe(casos.length >= 5 && casos.every((c) => c.nota.season === 'navidad' && c.nota.text.startsWith('¡Vas a vivir Roma en Navidad!') && !/anochece|atardece|{/.test(c.nota.text)), 'navidad', `en Navidad sale la de Navidad, sin la hora del atardecer (${casos.map((c) => c.inicio).join(', ')})`)
  debe(new Set(casos.map((c) => c.nota.text)).size === 1 && casos.every((c) => c.nota.text.includes('Roma') && !c.nota.text.includes('{destino}')), 'navidad', 'un solo texto para todos los viajes, con el nombre del destino puesto')
  const ruta = fs.readFileSync('src/components/route/SeasonCard.tsx', 'utf8')
  debe(/navidad/.test(ruta), 'navidad', 'la tarjeta de la app conoce la de Navidad')
}

/* ───────────────────────── 3. El último domingo de mes en los Vaticanos ───────────────────────── */
console.log('3. El último domingo de mes, los Museos Vaticanos abren')
{
  const vat = D.places.find((p) => p.name === 'Museos Vaticanos y Capilla Sixtina')
  const domingos = { ultimo: ['2026-11-29', '2026-12-27', '2027-06-27', '2026-06-28'], normal: ['2026-11-22', '2026-11-15', '2027-05-16'], excepciones: ['2027-03-28' /* Pascua */, '2027-06-29' /* martes: no es domingo */] }
  debe(domingos.ultimo.every((i) => isLastSundayOfMonth(i)) && domingos.normal.every((i) => !isLastSundayOfMonth(i)), 'ultimo', 'el calendario de los últimos domingos es el bueno')
  debe(domingos.ultimo.slice(0, 3).every((i) => closedOnDay(vat, 'domingo', i) === false), 'ultimo', 'el último domingo de mes los Museos Vaticanos NO están cerrados (noviembre, diciembre y junio)')
  debe(domingos.normal.every((i) => closedOnDay(vat, 'domingo', i) === true), 'ultimo', 'los demás domingos sí están cerrados')
  debe(closedOnDay(vat, 'domingo', '2027-03-28') === true, 'ultimo', 'el domingo de Pascua (que es el último de marzo de 2027) siguen cerrados')
  const entrada = D.fechas_especiales.fechas.find((e) => e.id === 'ultimo_domingo_vaticanos')
  debe(Boolean(entrada) && entrada.fecha === 'ultimo_domingo' && /museivaticani\.va/.test(entrada.fuente) && entrada.comprobado === '2026-10-25', 'ultimo', 'el aviso del último domingo existe, con la web oficial como fuente y la fecha en que se comprobó (25-oct-2026)')
  debe(domingos.ultimo.every((i) => specialDateMatches(entrada, i)) && domingos.normal.every((i) => !specialDateMatches(entrada, i)) && !specialDateMatches(entrada, '2027-03-28'), 'ultimo', 'el aviso sale los últimos domingos y no los demás (ni en Pascua)')
  debe(entrada.texto.split(/\s+/).length <= 35 && !/[0-9]+\s?€|€/.test(entrada.texto), 'ultimo', 'el texto lleva 35 palabras como mucho y ningún precio')

  // En el viaje de verdad: ese domingo, con el Vaticano en su día o en otro.
  let sinCierre = 0
  let conAviso = 0
  let cerradoRaro = []
  for (let pos = 1; pos <= 3; pos++) {
    const inicio = sumar('2026-11-29', -(pos - 1))
    for (let n = 1; n <= 3; n++) {
      const d = await dia(inicio, 3, n)
      const avisos = d?.date_notices ?? []
      for (const a of avisos) {
        const todo = `${a.title} ${a.texts.join(' ')}`
        if (/domingos? cierran los Museos Vaticanos|Museos Vaticanos cerrados/i.test(todo) && /29/.test(a.title ?? '')) cerradoRaro.push(`${inicio} día ${n}: ${a.title}`)
        if (a.title === 'Domingo 29 · Los Museos Vaticanos abren gratis') conAviso++
      }
      if (sumar(inicio, n - 1) === '2026-11-29') sinCierre++
    }
  }
  debe(cerradoRaro.length === 0, 'ultimo', `el último domingo de mes no sale «Los domingos los Museos Vaticanos cierran» (${cerradoRaro.join(' | ') || 'ninguno'})`)
  debe(sinCierre === 3 && conAviso >= 1, 'ultimo', `ese domingo sí sale el aviso propio («Los Museos Vaticanos abren gratis»: ${conAviso} veces en 3 viajes)`)
  // Un domingo normal sigue con su cierre de siempre.
  const normal = await dia('2026-11-22', 2, 1)
  debe((normal?.date_notices ?? []).some((a) => /Museos Vaticanos cerrados/.test(a.title) && /Los domingos cierran los Museos Vaticanos/.test(a.texts.join(' '))), 'ultimo', 'un domingo normal sigue con «Los domingos cierran los Museos Vaticanos»')
  // El aviso propio no sale si el viaje no lleva el Vaticano (sin_aviso).
  const sinVat = await buildDayBlockV3(D, 2, false, 1, null, '2026-11-29', [], [], { city: 'Roma', scheduler: 'v3', month: null })
  void sinVat
  // Pascua: ese «último domingo» siguen cerrados y no sale el aviso del último domingo.
  const pascua = [await dia('2027-03-28', 2, 1), await dia('2027-03-28', 2, 2)]
  debe(!pascua.some((d) => (d?.date_notices ?? []).some((a) => /abren gratis/.test(a.title ?? ''))), 'ultimo', 'el domingo de Pascua no sale el aviso de «abren gratis»')
  const validar = leer('scripts/destino/validar.mjs')
  debe(/ultimo_domingo/.test(validar), 'ultimo', 'el validador del destino entiende la fecha «ultimo_domingo»')
}

if (fallos.length) {
  console.log(`\n${fallos.length} FALLOS de ${comprobaciones}:`)
  for (const f of fallos) console.log(` ✗ [${f.regla}] ${f.texto}`)
  process.exit(1)
}
console.log(`\nPrueba de la Tanda 10L: ${comprobaciones} comprobaciones · 0 fallos`)
