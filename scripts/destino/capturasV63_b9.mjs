// V63 (cosa 9): SOLO captura (no es una prueba) de HOY en Lanzarote (coche), 390x844: la tarjeta de la siguiente parada dice desde dónde cuenta los minutos.
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/capturasV63_b9.mjs [dia=2] [paradasHechas=1] [nombre=lanzarote_9]
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'

const CAP = path.resolve('docs/dias/V63_capturas')
fs.mkdirSync(CAP, { recursive: true })
const DIA = Number(process.argv[2] ?? 2)
const HECHAS = Number(process.argv[3] ?? 1)
const NOMBRE = process.argv[4] ?? 'lanzarote_9'
const R = "(await import('/src/store/useRouteStore.ts')).useRouteStore"
const ANTES = fs.readFileSync('scripts/destino/pruebaV43.mjs', 'utf8').match(/const ANTES = `([\s\S]*?)`/)[1]
const a = await abrirApp(process.env.APP_URL ?? 'http://localhost:5173', { ruta: '/?cuentas=off&logros=off&apertura=0&hoy2=on&version=pago', antes: ANTES, ancho: 390, alto: 844 })
const ev = (e) => a.evaluar('(async () => (' + e + '))()')
try {
  for (let i = 0; i < 80 && !(await a.evaluar("typeof window.__rutaLanzarote === 'function'").catch(() => false)); i++) await a.esp(500)
  await a.evaluar("window.__rutaLanzarote({ zona: 'costa_teguise', coche: 'alquiler', hoy: '2026-11-08' }).then(() => true)")
  for (let i = 0; i < 300 && !(await ev(`${R}.getState().route ? true : false`).catch(() => false)); i++) await a.esp(1000)
  await a.esp(2500)
  console.log(await ev(`JSON.stringify(${R}.getState().route.days.map((d) => ({ n: d.dayNumber, stops: d.stops.map((s) => (s.isBreak ? '[descanso] ' : '') + s.name.slice(0, 22) + (s.trayectoCoche ? ' (' + s.trayectoCoche.minutos + ' desde ' + (s.trayectoCoche.desde?.nombre ?? '?') + ')' : '')) })))`))
  const iso = '2026-11-' + String(7 + DIA).padStart(2, '0')
  await a.evaluar(`(async () => {
    const st = ${R}
    st.getState().setDevSimulatedTodayIso('${iso}')
    const r = JSON.parse(JSON.stringify(st.getState().route))
    const d = r.days.find((x) => x.dayNumber === ${DIA}); let n = 0
    for (const s of d.stops) { if (n >= ${HECHAS}) break; if (s.isArrival || s.isBreak) continue; s.checkedInAt = '${iso}T09:30:00.000Z'; n++ }
    st.setState({ route: r, reservations: [], screen: 'route' })
    window.__horaFalsa = 11 * 60; window.__pos = null; window.__perm = 'denied'
    try { localStorage.setItem('trazo:logros:permisos-vistos', '1') } catch {}
    st.getState().setActiveDayId(null); st.getState().setMode('today')
    return true })()`)
  await a.esp(5000)
  await a.captura(path.join(CAP, `${NOMBRE}.jpg`))
  console.log((await a.evaluar("document.body.innerText.replace(/\s+/g, ' ').slice(0, 1200)")))
} finally {
  await a.cerrar()
}
