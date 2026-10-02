import { buildDayBlockV3 } from '../../server/engine/index.js'
import { findPipelineV2Data } from '../../server/routeAlgorithm.js'
const D = findPipelineV2Data('Roma')
const add = (iso, n) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10)
let bad = 0, n = 0
for (let i = 0; i < 365; i += 3) {
  const fecha = add('2027-01-01', i)
  for (const dias of [1, 2, 3, 4, 5]) for (const pool of [[], ['Coliseo']]) {
    for (let d = 1; d <= dias; d++) {
      let day
      try { day = await buildDayBlockV3(D, dias + 1, false, d, null, fecha, pool, ['imprescindibles'], { city: 'Roma', scheduler: 'v3', month: null, engine: 'v4' }) } catch (e) { console.log('ERR', fecha, dias, e.message.slice(0, 80)); continue }
      n++
      for (const s of day?.stops ?? []) if (/Museos Vaticanos|Cúpula de San Pedro/.test(s.name) && (s.visit_mode === 'fuera' || s.is_pass_by || s.pass_through)) { bad++; if (bad < 15) console.log('MALO', fecha, dias, 'día', d, s.name, s.visit_mode) }
      for (const t of [day?.day_notice, ...(day?.not_included ?? []).map((x) => x.reason)]) if (/Vaticanos[^.]{0,40}por fuera/i.test(String(t ?? ''))) { bad++; if (bad < 15) console.log('TEXTO', fecha, dias, d, t) }
    }
  }
}
console.log({ dias_construidos: n, malos: bad })
