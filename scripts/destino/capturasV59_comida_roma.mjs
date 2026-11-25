// V59 §3 Roma: la tarjeta de la comida y de la cena (C1, C2, C3, C5). Solo observa y captura (iPhone 390x844). Por la cola:
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/capturasV59_comida_roma.mjs
import fs from 'node:fs'
import path from 'node:path'
import { abrir, hoy as hoyBase, texto } from './viajero_roma_comun.mjs'

const CAP = path.resolve('docs/dias/V59_capturas')
fs.mkdirSync(CAP, { recursive: true })
const png = (n) => path.join(CAP, `${n}_app.jpg`)
const log = {}
const limpiar = async (a) => { for (let i = 0; i < 3; i++) { const h = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Continuar|Entendido|Ahora no)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()"); if (!h) break; await a.esp(800) } }
const hoy = async (c, iso, min) => { await hoyBase(c, iso, min); for (let k = 0; k < 14; k++) { await c.a.esp(1200); await limpiar(c.a); const hay = await c.a.evaluar("(() => { const h = document.querySelector('[data-visto^=\"hoja-\"]'); if (!h) return false; const w = h.parentElement?.parentElement ?? document; const b = Array.from(w.querySelectorAll('button')).find((x) => /cerrar/i.test(x.getAttribute('aria-label') || '')); if (b) b.click(); return true })()"); if (!hay && k > 1) break } await c.a.esp(600) }
const c = await abrir()
const { a, ev } = c
const R = "(await import('/src/store/useRouteStore.ts')).useRouteStore"
const paso = async (n, fn) => {
  try {
    await fn()
  } catch (e) {
    console.log('!!', n, String(e?.message ?? e).slice(0, 300))
  }
}
const tarjeta = () => a.evaluar("(() => { const e = document.querySelector('[data-hoy-comida]'); return e ? e.getAttribute('data-hoy-comida-estado') + ' | ' + e.innerText.replace(/\\s+/g, ' ') : null })()")
const diario = () => ev(`(async () => { const r = ${R}.getState().route; return JSON.stringify(r.days.map((d) => ({ n: d.dayNumber, ret: !!d.isReturnLeg, meals: d.meals.map((m) => [m.mealTime, m.time, m.windowEnd, (m.chosenRestaurant ?? m.recommendedRestaurant)?.name ?? null]), stops: d.stops.map((s) => s.time + ' ' + s.name)})).slice(0, 3)) })()`)
// Marca como vistas las paradas del día hasta (e incluida) la que lleva ese nombre: así la siguiente es la que viene después de la comida.
const vistasHasta = (iso, nombre) => ev(`(async () => { const st = ${R}; const r = st.getState().route; const d = r.days.find((x) => x.date === '${iso}' || x.dateIso === '${iso}') ?? r.days[2]; let ok = true; const stops = d.stops.map((s) => { if (!ok) return { ...s, checkedInAt: null }; if (s.name === '${nombre}') ok = false; return { ...s, checkedInAt: new Date().toISOString() } }); st.setState({ route: { ...r, days: r.days.map((x) => (x.id === d.id ? { ...d, stops } : x)) } }); return d.id })()`)
const cuando = process.argv[2] ?? ''
try {
  log.dias = await diario()
  console.log(log.dias)
  if (cuando === 'diag') process.exit(0)
  const iso = process.env.DIA ?? '2026-10-19'
  const horaComer = Number(process.env.HC ?? 14 * 60)
  const horaCenar = Number(process.env.HN ?? 20 * 60 + 30)
  await paso('C1', async () => {
    await vistasHasta(iso, 'Altar de la Patria')
    await hoy(c, iso, horaComer)
    log.c1 = await tarjeta()
    await a.captura(png('C1'))
  })
  await paso('C5', async () => {
    const ok = await a.evaluar("(() => { const b = document.querySelector('[data-hoy-ya-he-llegado]'); if (!b) return false; b.click(); return true })()")
    log.c5_clic = ok
    await a.esp(900)
    log.c5 = await tarjeta()
    await a.captura(png('C5'))
  })
  await paso('C2', async () => {
    await vistasHasta(iso, 'Piazza Navona')
    await hoy(c, iso, horaCenar)
    log.c2 = await tarjeta()
    await a.captura(png('C2'))
  })
  await paso('C3', async () => {
    // Sin restaurante en la comida (como al llegar): se le quita el que lleva.
    await ev(`(async () => { const st = ${R}; const r = st.getState().route; st.setState({ route: { ...r, days: r.days.map((d) => ({ ...d, meals: d.meals.map((m) => ({ ...m, chosenRestaurant: null, recommendedRestaurant: null })) })) } }); return true })()`)
    await vistasHasta(iso, 'Altar de la Patria')
    await hoy(c, iso, horaComer)
    log.c3 = await tarjeta()
    await a.captura(png('C3'))
  })
  fs.writeFileSync(path.join(CAP, '_log_comida_roma.json'), JSON.stringify(log, null, 1))
  console.log(JSON.stringify(log, null, 1))
} finally {
  a.cerrar()
}
