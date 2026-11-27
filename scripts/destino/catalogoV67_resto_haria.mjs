// V67: SOLO captura (no es una prueba) en modo iPhone (390x844) de Haría en la ruta de Lanzarote: las dos paradas (el pueblo, sin horario; la Casa-Museo, con el suyo).
//   (API normal)  APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/capturasV67_a_haria.mjs
// Un solo Chrome, que se cierra al acabar. Guarda docs/dias/catalogo/_tmp/haria_app.jpg y escribe docs/dias/catalogo/_tmp/log_haria_haria.json.
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'

const CAP = path.resolve('docs/dias/catalogo/_tmp')
fs.mkdirSync(CAP, { recursive: true })
const R = "(await import('/src/store/useRouteStore.ts')).useRouteStore"
const a = await abrirApp(process.env.APP_URL ?? 'http://localhost:5173', { ruta: '/?cuentas=off&logros=off&apertura=0&hoy2=on&version=pago', ancho: 390, alto: 844 })
const ev = (e) => a.evaluar("(async () => (" + e + "))()")
const log = {}
try {
  for (let i = 0; i < 80 && !(await a.evaluar("typeof window.__rutaLanzarote === 'function'").catch(() => false)); i++) await a.esp(500)
  await a.evaluar("window.__rutaLanzarote({ zona: 'costa_teguise', coche: 'alquiler', hoy: '2026-11-08' }).then(() => true)")
  for (let i = 0; i < 300 && !(await ev(`${R}.getState().route ? true : false`).catch(() => false)); i++) await a.esp(1000)
  await a.esp(2500)
  for (let i = 0; i < 4; i++) {
    const h = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale|Cerrar)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
    if (!h) break
    await a.esp(600)
  }
  log.paradas = await ev(`${R}.getState().route.days.flatMap((d) => d.stops.filter((s) => /Har[ií]a|Casa-Museo/.test(s.name)).map((s) => ({ dia: d.dayNumber, id: d.id, name: s.name, time: s.time, min: s.durationMinutes, hours: s.hours ?? null, scheduleText: s.scheduleText ?? null, freeAccess: s.freeAccess ?? null, outsideKind: s.outsideKind ?? null, closedThisDay: s.closedThisDay ?? null, trayecto: s.trayectoCoche?.texto ?? s.trayectoCoche ?? null })))`)
  const dia = log.paradas?.[0]?.id
  if (dia) {
    await ev(`(async () => { const st = ${R}.getState(); st.setActiveDayId(${JSON.stringify(dia)}); st.setMode('days'); return true })()`)
    await a.esp(2500)
    // baja hasta la parada de Haría
    await a.evaluar("(() => { const t = [...document.querySelectorAll('*')].find((e) => e.children.length < 4 && /^Haría/.test((e.textContent || '').trim()) && e.getBoundingClientRect().height > 0); if (t) t.scrollIntoView({ block: 'center' }); return !!t })()")
    await a.esp(1200)
    await a.captura(path.join(CAP, 'haria_app.jpg'))
  }
} finally {
  fs.writeFileSync('docs/dias/catalogo/_tmp/log_haria_haria.json', JSON.stringify(log, null, 2))
  await a.cerrar()
}
console.log(JSON.stringify(log, null, 1))
