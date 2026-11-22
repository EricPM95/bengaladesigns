// La prueba de la Tanda V38, parte AVISOS DE CERRADO: el aviso de «Hemos preparado tu viaje para estas fechas» dice lo que se ha hecho DE VERDAD con cada sitio cerrado
// (a qué día lo hemos pasado, o que no cabe), para todos los sitios y todos los destinos. Usa el motor de verdad (buildDayBlockV3), sin navegador ni servidor.
//   node scripts/destino/pruebaV38_avisos.mjs
import fs from 'node:fs'
import { buildDayBlockV3 } from '../../server/engine/index.js'
import { findPipelineV2Data } from '../../server/routeAlgorithm.js'

let comprobaciones = 0
const fallos = []
const debe = (c, regla, texto) => {
  comprobaciones++
  if (!c) {
    fallos.push({ regla, texto })
    console.log(`  FALLO [${regla}] ${texto}`)
  }
}
const D = findPipelineV2Data('Roma')
const sumar = (iso, n) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10)
const palabras = (t) => String(t).trim().split(/\s+/).length
const GENERICA = /Hemos preparado tu ruta para que disfrutes/
async function viaje(destData, ciudad, inicio, total) {
  const dias = []
  for (let n = 1; n <= total - 1; n++) dias.push(await buildDayBlockV3(destData, total, false, n, null, inicio, [], ['imprescindibles'], { city: ciudad, scheduler: 'v3', month: null }))
  // (El motor numera los días; la fecha de cada uno es la salida más su número.)
  return { avisos: dias.find((d) => d?.date_notices)?.date_notices ?? [], dias: dias.filter(Boolean).map((d) => ({ ...d, iso: sumar(inicio, d.day_number - 1) })) }
}
/** Los nombres de las paradas de visita (no por fuera) de cada fecha del viaje. */
const paradasPorFecha = (v) => {
  const m = new Map()
  for (const d of v.dias) m.set(d.iso, (d.stops ?? []).map((x) => x.name))
  return m
}

/* ───────── 1. Los Museos Vaticanos del domingo ───────── */
console.log('1. El domingo cierran los Museos Vaticanos')
{
  // Sábado 5 a martes 8 de diciembre de 2026 (5 días con el de vuelta): el domingo 6 cierran; los hemos puesto otro día.
  const v = await viaje(D, 'Roma', '2026-12-04', 5)
  const dom = v.avisos.find((a) => a.date_iso === '2026-12-06' && /Vaticanos/.test(a.title))
  debe(Boolean(dom), 'moved', 'sale el aviso del domingo 6 con los Museos Vaticanos')
  const m = /^Los domingos cierran los Museos Vaticanos\. Por eso los hemos puesto el ([a-zéá]+) (\d+), para que los disfrutes con calma\.$/.exec(dom?.texts[0] ?? '')
  debe(Boolean(m), 'moved', `dice «Por eso los hemos puesto el <día>…» (${dom?.texts[0]})`)
  if (m) {
    const dia = `${new Date(Date.parse(`2026-12-${m[2].padStart(2, '0')}T12:00:00Z`)).toLocaleDateString('es-ES', { weekday: 'long', timeZone: 'UTC' })}`
    debe(dia === m[1], 'moved', `el día dicho existe en el calendario (el ${m[1]} ${m[2]} de diciembre de 2026 es ${dia})`)
    const por = paradasPorFecha(v)
    const iso = `2026-12-${m[2].padStart(2, '0')}`
    debe((por.get(iso) ?? []).some((n) => /Museos Vaticanos/.test(n)), 'moved', `y es verdad: ese día (${iso}) los Museos Vaticanos están en la ruta (paradas: ${(por.get(iso) ?? []).join(' · ').slice(0, 120)})`)
    debe(!(por.get('2026-12-06') ?? []).some((n) => /Museos Vaticanos/.test(n)), 'moved', 'y el domingo no los lleva')
  }
  debe(!GENERICA.test(dom?.texts[0] ?? ''), 'moved', 'ya no sale «Hemos preparado tu ruta para que disfrutes de todo lo que está abierto…»')
  debe(palabras(dom?.texts[0] ?? '') <= 35, 'moved', 'cabe en 35 palabras')
}

/* ───────── 2. No cabe en ningún otro día ───────── */
console.log('2. Un viaje de un solo día, en domingo: no cabe')
{
  const v = await viaje(D, 'Roma', '2026-12-06', 2)
  const dom = v.avisos.find((a) => a.date_iso === '2026-12-06' && /Vaticanos/.test(a.title))
  debe(dom?.texts[0] === 'Los domingos cierran los Museos Vaticanos. Ese día los Museos Vaticanos están cerrados, así que no entran en tu ruta. Si cambias las fechas, te los ponemos.', 'no_cabe', `«Ese día los Museos Vaticanos están cerrados, así que no entran en tu ruta. Si cambias las fechas, te los ponemos.» (${dom?.texts[0]})`)
  const por = paradasPorFecha(v)
  debe(![...por.values()].flat().some((n) => /Museos Vaticanos/.test(n)), 'no_cabe', 'y es verdad: los Museos Vaticanos no están en la ruta')
}

/* ───────── 3. Todos los sitios y todos los destinos ───────── */
console.log('3. Todos los destinos y fechas: ningún aviso de cerrado esconde lo que se ha hecho')
{
  const DESTINOS = [['Roma', D, 'Roma'], ['Lanzarote', findPipelineV2Data('Lanzarote'), 'Lanzarote']]
  const SALIDAS = ['2026-11-05', '2026-11-22', '2026-12-04', '2026-12-23', '2026-12-30', '2027-01-05', '2027-04-02', '2027-05-29', '2027-08-13', '2027-10-30']
  let tarjetas = 0
  let conCierre = 0
  const genericas = []
  const sinDia = []
  const largas = []
  const incoherentes = []
  for (const [nombre, datos, ciudad] of DESTINOS) {
    for (const salida of SALIDAS) {
      for (const total of [2, 3, 5]) {
        const v = await viaje(datos, ciudad, salida, total)
        const fechas = new Set(v.dias.map((d) => d.iso))
        for (const a of v.avisos) {
          tarjetas++
          // (Un «cierran antes» o un horario especial no es un cierre: no se pasa a otro día.)
          const cierra = /cierra|cierran/.test(a.que_pasa ?? '') && !/ antes|horario/i.test(a.que_pasa ?? '') && a.cierran.length > 0
          if (!cierra) continue
          conCierre++
          const t = a.texts[0]
          if (GENERICA.test(t) && !/horario/i.test(a.que_pasa ?? '')) genericas.push(`${nombre} ${salida}/${total} ${a.id}`)
          // Dice lo que se ha hecho: pasado a un día (con su fecha), por fuera, se queda, o no cabe.
          if (!/hemos (puesto|repartido)|no entra|por fuera|En tu viaje no hay otro día|Hemos puesto/.test(t)) sinDia.push(`${nombre} ${salida}/${total} ${a.id}: ${t.slice(0, 90)}`)
          if (palabras(t) > 35 && !/por fuera|En tu viaje no hay otro día/.test(t)) largas.push(`${nombre} ${salida}/${total} ${a.id} (${palabras(t)})`)
          // Si dice «el <día> N», ese día es una fecha del viaje.
          for (const m of t.matchAll(/ el (lunes|martes|miércoles|jueves|viernes|sábado|domingo) (\d{1,2})(?: de (\w+))?/g)) {
            const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
            const dia = Number(m[2])
            const ok = [...fechas].some((f) => Number(f.slice(8, 10)) === dia && (!m[3] || meses[Number(f.slice(5, 7)) - 1] === m[3]) && new Date(`${f}T12:00:00Z`).toLocaleDateString('es-ES', { weekday: 'long', timeZone: 'UTC' }) === m[1])
            if (!ok && a.date_iso && !/cierra el|cierran el|cierra el/.test(t.slice(Math.max(0, m.index - 12), m.index + 1))) incoherentes.push(`${nombre} ${salida}/${total} ${a.id}: «${m[0].trim()}»`)
          }
        }
      }
    }
  }
  debe(tarjetas > 50 && conCierre > 20, 'barrido', `el barrido mira de verdad (${tarjetas} avisos, ${conCierre} con un sitio cerrado)`)
  debe(genericas.length === 0, 'barrido', `ningún aviso con un sitio cerrado acaba en la frase general (${genericas.slice(0, 3).join(' | ') || 'ninguno'})`)
  debe(sinDia.length === 0, 'barrido', `todos dicen qué se hizo (pasado a un día, por fuera, se queda o no cabe) (${sinDia.slice(0, 3).join(' | ') || 'todos'})`)
  debe(largas.length === 0, 'barrido', `ninguno pasa de 35 palabras (${largas.slice(0, 3).join(' | ') || 'ninguno'})`)
  debe(incoherentes.length === 0, 'barrido', `todo día que nombran es una fecha del viaje (${incoherentes.slice(0, 3).join(' | ') || 'todos'})`)
}

/* ───────── 4. El código ───────── */
console.log('4. El código')
{
  const src = fs.readFileSync('server/engine/dateNotices.js', 'utf8')
  debe(/movido:/.test(src) && /no_cabe:/.test(src) && /movedTo/.test(src), 'codigo', 'el motor tiene las frases «movido» y «no_cabe» y busca el día real')
  const roma = JSON.parse(fs.readFileSync('data/pipeline_v2/roma.json', 'utf8'))
  debe(roma.fechas_especiales.frases.hecho.startsWith('Hemos preparado'), 'codigo', 'la frase general sigue en los datos, solo para un cambio de horario')
}

console.log(`\nPrueba V38 · avisos de cerrado: ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
process.exit(fallos.length ? 1 : 0)
