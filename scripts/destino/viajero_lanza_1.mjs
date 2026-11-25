// Viajero Lanzarote 1: crea el viaje, vuelca el plan y recorre HOY por dias y horas (captura + texto). Solo observa.
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'
const SAL = path.resolve('docs/dias/VIAJEROS_capturas')
const OUT = path.resolve('docs/dias/_viajero_lanza_1.json')
const R = "(await import('/src/store/useRouteStore.ts')).useRouteStore"
const ANTES = /const ANTES = `([\s\S]*?)`\n/.exec(fs.readFileSync(new URL('./pruebaTandaHOY1_A.mjs', import.meta.url), 'utf8'))[1]
const log = { plan: null, estados: [] }
let a
const ev = (e) => a.evaluar('(async () => (' + e + '))()')
async function abrir() {
  a = await abrirApp('http://localhost:5173', { ruta: '/?cuentas=off&logros=on&logrosDemo=1&apertura=0&hoy2=on&version=completa', antes: ANTES })
  for (let i = 0; i < 60 && !(await a.evaluar("typeof window.__rutaLanzarote === 'function'")); i++) await a.esp(500)
  const r = await a.evaluar(`window.__rutaLanzarote({ zona: 'costa_teguise', coche: 'alquiler', hoy: '2026-11-08', vuelos: { llegada: '09:30', vuelta: '18:05' } }).then(() => 'ok').catch((e) => 'ERROR ' + String((e && e.message) || e))`)
  console.log('crear:', r)
  if (r !== 'ok') throw new Error(r)
  await a.esp(2500)
  for (let i = 0; i < 4; i++) {
    const h = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Entendido|Vale|Cerrar|Siguiente)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
    if (!h) break
    await a.esp(600)
  }
}
async function ir(dia, min, pos = null) {
  await a.evaluar(`(async () => {
    const st = ${R}
    window.__horaFalsa = ${min}; window.__pos = ${JSON.stringify(pos)}; window.__perm = ${pos ? "'granted'" : "'denied'"}
    const r = st.getState().route
    const d = new Date(r.answers.dateRange.start + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + ${dia})
    st.getState().setDevSimulatedTodayIso(d.toISOString().slice(0, 10)); st.getState().setActiveDayId(null); st.getState().setMode('explore')
    return true })()`)
  await a.esp(600)
  await ev(`${R}.getState().setMode('today')`)
  await a.esp(2800)
}
const hhmm = (m) => String(Math.floor(m / 60)).padStart(2, '0') + String(m % 60).padStart(2, '0')
try {
  await abrir()
  log.plan = await ev(`(async () => { const { numberedStopsOf } = await import('/src/lib/stopKind.ts'); const r = ${R}.getState().route; return { dest: r.destination, flights: [r.arrivalFlightTime, r.departureFlightTime], acc: r.accommodationZone, days: r.days.map((d, i) => ({ i, title: d.title ?? d.label, theme: d.theme, kind: d.kind, stops: numberedStopsOf(d).map((s) => ({ n: s.name, t: s.time, dur: s.durationMinutes, opt: !!s.optional, sunset: !!s.isSunset, cat: s.category ?? s.kind })), meals: (d.meals ?? d.mealSlots ?? null) })) } })()`)
  fs.writeFileSync(OUT, JSON.stringify(log, null, 1))
  const dias = [0, 1, 2, 3, 4, 5]
  const horas = [7 * 60 + 30, 10 * 60, 13 * 60, 16 * 60, 19 * 60, 22 * 60]
  for (const dia of dias) for (const min of horas) {
    try {
      await ir(dia, min)
      const t = await a.evaluar("(document.querySelector('[data-hoy]')?.innerText ?? document.body.innerText).replace(/\s+/g,' ')")
      const f = `lanza_d${dia + 1}_${hhmm(min)}.jpg`
      await a.captura(path.join(SAL, f))
      log.estados.push({ dia, min, f, t })
      console.log(f, '|', t.slice(0, 160))
    } catch (e) { log.estados.push({ dia, min, err: String(e.message || e) }); console.log('ERR', dia, min, e.message) }
    fs.writeFileSync(OUT, JSON.stringify(log, null, 1))
  }
} finally { try { a?.cerrar() } catch {} }
