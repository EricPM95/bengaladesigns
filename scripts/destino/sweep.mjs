// Barrido: todas las combinaciones habituales. Salida JSON con los problemas por viaje (out=ruta.json; por defecto, en la carpeta temporal).
//   node scripts/destino/sweep.mjs dias=2,3 ritmo=completo ft=no exp=ninguna meses=0,6 pool="Galería Borghese|Trastevere"
import { writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { buildDayBlockV3 } from '../../server/engine/index.js'
import { findPipelineV2Data } from '../../server/routeAlgorithm.js'
import { tituloQueNoSeCumple } from './textChecks.mjs'
import { auditarViaje } from './auditoria.mjs'
import { travelTimesFor } from '../../server/engine/buildDayV3.js'
const travel = travelTimesFor('roma')
const legBetween = (a, b) => (a && b ? travel.leg(a, b)?.minutes ?? null : null)
const D = findPipelineV2Data('Roma')
const t2m = (s) => { const [h, m] = String(s).split(':').map(Number); return h * 60 + m }
const addDays = (iso, n) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10)
const lvl1 = (D.places ?? []).filter((p) => p.level === 1).map((p) => p.name)
/** Verano: el tiempo libre con nombre antes del atardecer no es hueco hasta aquí; de más, sí (decisión del 2026-09-27). */
const VERANO_ANTES_DEL_SOL_MAX = 150
const EXPS = { ninguna: [], arte: ['arte_museos'], naturaleza: ['naturaleza_vistas'], barrios: ['barrios_sabores'] }
const args = Object.fromEntries(process.argv.slice(2).map((a) => a.split('=')))
const DIAS = (args.dias ?? '2,3,4,5,6,7').split(',').map(Number)
const RITMOS = (args.ritmo ?? 'completo,tranquilo').split(',')
const FTS = (args.ft ?? 'no,si').split(',')
const EX = (args.exp ?? 'ninguna,arte,naturaleza,barrios').split(',')
const MESES = (args.meses ?? '0,1,2,3,4,5,6,7,8,9,10,11').split(',').map(Number)
const POOL = args.pool ? args.pool.split('|') : []
const out = []
let k = 0
for (const dias of DIAS) for (const ritmo of RITMOS) for (const ft of FTS) for (const ex of EX) for (const mes of MESES) {
  k++
  const y = mes >= 9 ? 2026 : 2027
  const fecha = `${y}-${String(mes + 1).padStart(2, '0')}-${String(8 + (k % 7)).padStart(2, '0')}`
  const exps = [...(ft === 'si' ? ['free_tour'] : []), ...EXPS[ex]]
  const pos = exps.length ? ['imprescindibles', ...exps] : []
  const trip = { dias, ritmo, ft, ex, mes, fecha, pool: POOL, problemas: [], dias_out: [] }
  const seenDay = new Set(), count = new Map(), fuera = new Map()
  const builtDays = []
  for (let n = 1; n <= dias; n++) {
    let day
    try { day = await buildDayBlockV3(D, dias + 1, ft === 'si', n, ritmo === 'completo' ? 'nonstop' : 'tranquilo', null, fecha, POOL, pos, { city: 'Roma', scheduler: 'v3', month: null }) }
    catch (e) { trip.problemas.push({ n, tipo: 'error', txt: String(e.message).slice(0, 120) }); continue }
    if (!day) continue
    builtDays.push(day)
    for (const it of day.not_included ?? []) fuera.set(it.name, { n, reason: it.reason })
    const cd = day.curated_day?.id ?? (day.type === 'excursion' || (day.excursion_options?.length && !day.stops?.length) ? 'EXC' : null)
    trip.dias_out.push(cd + (day.half_day_excursion ? '+' + day.half_day_excursion.id : ''))
    if (!day.stops?.length) continue
    const stops = day.stops.filter((s) => !s.is_night_experience)
    const last = n === dias
    const lim = ritmo === 'completo' ? 90 : 120
    const libres = [...(day.free_times ?? []).map((f) => ({ m: f.minutes, before: f.before })), ...(day.aperitivo ? [{ m: day.aperitivo.minutes, before: 'cena (aperitivo)', winter: day.aperitivo.winter }] : []), ...(day.free_afternoon ? [{ m: day.free_afternoon.minutes, before: 'cena (tarde libre)', winter: day.free_afternoon.winter }] : [])]
    for (const f of libres) {
      if (f.m <= lim) continue
      // Invierno (B3.1): paseo iluminado y aperitivo de hasta 2 h, amarillo; de más, pendiente (Parte C.1).
      // Verano: el tiempo libre con nombre antes del atardecer (lo que no cabe en las estirables, con su tope) no es
      // un hueco (PROMPT_AJUSTES_20_RUTAS B.4), igual que en la revisión.
      const antesDelSol = f.m <= VERANO_ANTES_DEL_SOL_MAX && [5, 6, 7].includes(mes) && stops.some((s) => (s.place_name ?? s.name) === f.before && s.sunset_minutes != null)
      const tipo = f.winter ? (f.m <= 120 ? 'aperitivo_invierno' : 'aperitivo_invierno_largo') : antesDelSol ? 'libre_atardecer_verano' : 'hueco'
      trip.problemas.push({ n, d: cd, tipo, txt: `${f.m} min antes de ${f.before}`, m: f.m })
    }
    for (const s of stops) {
      const name = s.place_name ?? s.name
      count.set(name, (count.get(name) ?? 0) + 1)
      if (!s.pass_through && !s.is_pass_by) seenDay.add(name)
      for (const x of [...(s.free_tour_covers ?? []), ...(s.outside_of ?? [])]) seenDay.add(x)
      if (s.pass_through || s.is_pass_by) seenDay.add(name)
      // El mirador que llega de noche sale como experiencia nocturna (decisión del 2026-09-27): se apunta, no es fallo.
      if (s.night_view && ![11, 0, 1].includes(mes)) trip.problemas.push({ n, d: cd, tipo: 'mirador_noche', txt: `${name} ${s.suggested_time}` })
    }
    for (const s of day.stops.filter((s) => s.is_night_experience)) { const l = String(s.place_name ?? s.name).replace(/\s*\(noche\)$/, ''); count.set(l, (count.get(l) ?? 0) + 1); seenDay.add(l) }
    const u = stops.at(-1)
    for (const aviso of tituloQueNoSeCumple(day)) trip.problemas.push({ n, d: cd, tipo: 'titulo_hora', txt: aviso })
    if (!last && !day.half_day_excursion && u && t2m(u.suggested_time) + u.duration_minutes < 17 * 60) trip.problemas.push({ n, d: cd, tipo: 'acaba_pronto', txt: `${u.suggested_time}` })
    if (day.pace_notice && /comida es más corta/.test(day.pace_notice)) trip.problemas.push({ n, d: cd, tipo: 'comida_corta', txt: day.pace_notice.slice(0, 90) })
  }
  for (const [name, v] of fuera) {
    const pl = (D.places ?? []).find((p) => p.name === name)
    trip.problemas.push({ n: v.n, tipo: pl?.level === 1 ? 'pierde_nivel1' : 'pierde', txt: `${name} (${v.reason})` })
  }
  const miss = lvl1.filter((x) => !seenDay.has(x))
  if (miss.length) trip.problemas.push({ tipo: 'falta_nivel1', txt: miss.join(', ') })
  for (const [name, c] of count) if (c > 2) trip.problemas.push({ tipo: 'repite', txt: `${name} ×${c}` })
  // La auditoría automática (punto 14): cada caso cuenta con su tipo, prefijo `audit_`.
  for (const caso of auditarViaje(D, builtDays, { startIso: fecha, poolNames: POOL, leg: legBetween })) trip.problemas.push({ tipo: `audit_${caso.tipo}`, txt: `${caso.donde} ${caso.detalle}`.trim() })
  out.push(trip)
}
writeFileSync(args.out ?? join(tmpdir(), 'sweep.json'), JSON.stringify(out))
const tipos = {}
for (const t of out) for (const p of t.problemas) tipos[p.tipo] = (tipos[p.tipo] ?? 0) + 1
const limpios = out.filter((t) => !t.problemas.some((p) => ['hueco', 'pierde_nivel1', 'falta_nivel1', 'error', 'acaba_pronto'].includes(p.tipo))).length
console.log(JSON.stringify({ viajes: out.length, limpios, tipos }))
