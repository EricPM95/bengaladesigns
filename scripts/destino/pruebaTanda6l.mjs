// La prueba de la Tanda 6l (PARA_CODE_TANDA6L.md, puntos 1 y 5), con el motor tal como lo usa el servidor.
//   node scripts/destino/pruebaTanda6l.mjs [paso=30] [out=docs/dias/PRUEBA_TANDA6L.md] [fallos=ruta.txt]
//   1. Regla 7: 0 sitios pasados a «por fuera» por llegar 40 min o menos antes de que abran (todos los días escritos, con y sin Free Tour, con fechas y los 12 meses sin ellas).
//      El Panteón del D3 entra por dentro a las 9:00, sin nada en rojo, y el Free Tour sigue marcando las 10:00.
import fs from 'node:fs'
import { buildDayBlockV3 } from '../../server/engine/index.js'
import { findPipelineV2Data } from '../../server/routeAlgorithm.js'
import { straightLineMeters } from '../../shared/routeEngine/travelTimes.js'

const args = Object.fromEntries(process.argv.slice(2).map((x) => x.split(/=(.*)/s).slice(0, 2)))
const D = findPipelineV2Data('Roma')
const paso = Number(args.paso ?? 30)
const out = args.out ?? 'docs/dias/PRUEBA_TANDA6L.md'
const addDays = (iso, n) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10)
const toMin = (hhmm) => Number(String(hhmm).split(':')[0]) * 60 + Number(String(hhmm).split(':')[1])
const fechas = []
for (let d = 0; d < 365; d += paso) fechas.push(addDays('2027-01-01', d))
const fallos = []
const info = new Map()
const porRegla = new Map()
const falla = (regla, texto) => { fallos.push({ regla, texto }); porRegla.set(regla, (porRegla.get(regla) ?? 0) + 1) }
const apunta = (regla, texto) => {
  const v = info.get(regla) ?? { n: 0, ejemplos: [] }
  v.n++
  if (texto && v.ejemplos.length < 8) v.ejemplos.push(texto)
  info.set(regla, v)
}

let viajes = 0
let dias = 0
let esperas = 0
async function revisa({ dias: n, inicio = null, mes = null, ft = false, medio = null, donde }) {
  for (let d = 1; d <= n; d++) {
    let day
    try {
      day = await buildDayBlockV3(D, n + 1, ft, d, null, inicio ?? undefined, [], ft ? ['imprescindibles', 'free_tour'] : ['imprescindibles'], { city: 'Roma', scheduler: 'v3', engine: 'v4', mediaJornada: medio, month: inicio ? null : mes, season: null, diaCuatro: n >= 4 ? 'roma' : null })
    } catch (error) { falla('error', `${donde} día ${d}: ${error.message}`); continue }
    if (!day?.stops) continue
    dias++
    const dondeDia = `${donde} · día ${d} ${day.curated_day?.id ?? ''}`
    for (const [i, s] of day.stops.entries()) {
      // 1. por fuera por llegar poco antes de que abra
      if (s.outside_kind === 'no_abre' && /aún no ha abierto \(abre a las (\d{2}:\d{2})\)/.test(s.outside_reason ?? '')) {
        const abre = toMin(/abre a las (\d{2}:\d{2})/.exec(s.outside_reason)[1])
        const llega = toMin(s.suggested_time)
        // La regla 7: hasta 15 min se espera siempre; hasta 40 si lo de antes es una plaza o un sitio al aire libre justo al lado (a 5 min andando o menos).
        const previa = day.stops.slice(0, i).reverse().find((x) => !x.is_arrival)
        const tipoPrevia = D.places.find((p) => p.name === previa?.name)?.type
        const alLado = Boolean(previa) && (previa.visit_mode === 'fuera' || tipoPrevia === 'exterior') && Number.isFinite(previa.latitude) && Number.isFinite(s.latitude) && (straightLineMeters([previa.latitude, previa.longitude], [s.latitude, s.longitude]) * 1.3) / 80 <= 5
        if (abre - llega <= 15 || (abre - llega <= 40 && alLado)) falla('no_espera_a_que_abra', `${dondeDia}: «${s.name}» llega a las ${s.suggested_time}, abre a las ${String(Math.floor(abre / 60)).padStart(2, '0')}:${String(abre % 60).padStart(2, '0')} (${abre - llega} min) y se ve por fuera`)
        else apunta('por_fuera_con_mas_de_40_min_de_espera')
      }
    }
    for (const log of day.engine_log ?? []) if (log.que === 'hora' && /se espera/.test(log.causa)) esperas++
    // El Panteón del D3
    if (day.curated_day?.id === 'D3') {
      const p = day.stops.find((s) => s.name === 'Panteón')
      const t = day.stops.find((s) => s.isFreeTour || /Free Tour/.test(s.name))
      if (p && p.visit_mode === 'fuera' && !/Panteón/.test(String(p.outside_reason ?? '')) === false && p.outside_kind === 'no_abre') falla('d3_panteon_por_fuera', `${dondeDia}: el Panteón por fuera (${p.outside_reason})`)
      else if (p && p.visit_mode === 'dentro') apunta('d3_panteon_por_dentro_ok')
      if (t && t.reservation_time !== '10:00') falla('d3_free_tour_hora', `${dondeDia}: el Free Tour sale a las ${t.reservation_time}`)
    }
  }
  viajes++
}

for (const forma of [{ dias: 1 }, { dias: 2 }, { dias: 3 }, { dias: 4 }, { dias: 5 }, { dias: 6 }, { dias: 2, ft: true }, { dias: 3, ft: true }, { dias: 4, ft: true }, { dias: 6, ft: true }, { dias: 2, medio: { franja: 'tarde' } }, { dias: 3, medio: { franja: 'manana' } }]) {
  for (const inicio of fechas) await revisa({ ...forma, inicio, donde: `${forma.dias} días${forma.ft ? ' con Free Tour' : ''}${forma.medio ? ' con medio día' : ''} · inicio ${inicio}` })
  for (let mes = 0; mes < 12; mes++) await revisa({ ...forma, mes, donde: `sin fechas · mes ${mes + 1} · ${forma.dias} días${forma.ft ? ' con Free Tour' : ''}${forma.medio ? ' con medio día' : ''}` })
}

const lineas = [
  '# Prueba de la Tanda 6l',
  '',
  `${viajes} viajes y ${dias} días montados con el motor del servidor (${fechas.length} fechas de 2027 y los 12 meses sin fechas). Esperas a que abra un sitio: ${esperas}.`,
  '',
  `**Fallos: ${fallos.length}.**`,
  '',
  '## Por regla',
  '',
  ...(porRegla.size === 0 ? ['Ninguna.'] : [...porRegla].map(([regla, n]) => `- ${regla}: ${n}`)),
  '',
  '## Lo que se apunta (no es un fallo)',
  '',
  ...[...info].flatMap(([regla, v]) => [`- ${regla}: ${v.n}`, ...v.ejemplos.map((e) => `  - ${e}`)]),
  '',
  '## Primeros fallos de cada regla',
  '',
  ...[...porRegla.keys()].flatMap((regla) => [`### ${regla} (${porRegla.get(regla)})`, '', ...fallos.filter((f) => f.regla === regla).slice(0, 15).map((f) => `- ${f.texto}`), '']),
]
fs.writeFileSync(out, lineas.join('\n'))
if (args.fallos) fs.writeFileSync(args.fallos, fallos.map((f) => `[${f.regla}] ${f.texto}`).join('\n'))
console.log(JSON.stringify({ viajes, dias, esperas, fallos: fallos.length, porRegla: Object.fromEntries(porRegla), info: Object.fromEntries([...info].map(([k, v]) => [k, v.n])) }))
