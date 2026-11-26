// V68: lo que devuelve el MOTOR (sin la colocación del cliente) para una reserva. Uso: node scripts/destino/_v68_motor_crudo.mjs <json de la reserva>
import fs from 'node:fs'
import { abrirApp } from './_enLaApp.mjs'
const R = "(await import('/src/store/useRouteStore.ts')).useRouteStore"
const ANTES = fs.readFileSync('scripts/destino/pruebaV43.mjs', 'utf8').match(/const ANTES = `([\s\S]*?)`/)[1]
const a = await abrirApp('http://localhost:5173', { ruta: '/?cuentas=off&logros=off&apertura=0&hoy2=on&version=pago', antes: ANTES, ancho: 390, alto: 844 })
const ev = (e) => a.evaluar('(async () => (' + e + '))()')
try {
  const log = JSON.parse(fs.readFileSync('docs/dias/V68_log_a0.json', 'utf8'))
  void log
  for (let i = 0; i < 80 && !(await a.evaluar("typeof window.__rutaPrueba === 'function'").catch(() => false)); i++) await a.esp(500)
  await a.evaluar('window.__rutaPrueba().then(() => true)')
  const res = JSON.parse(process.argv[2])
  const out = await a.evaluar(`(async () => {
    const st = ${R}
    const base = st.getState().route
    const { runGeneration } = await import('/src/lib/routeGenerationOrchestrator.ts')
    const { mapGeneratedRouteToRoute } = await import('/src/lib/mapGeneratedRoute.ts')
    const respuestas = { ...base.answers, origin: 'Madrid', days: 3, dateRange: { start: '2027-07-13', end: '2027-07-15' }, month: 6, companion: 'couple', experiences: [], experiencesPositive: ['imprescindibles'], experiencesNegative: [], chronotype: 'normal', budgetLevel: 'comfortable' }
    let final = null
    await runGeneration({ destination: 'Roma', answers: respuestas, transportContext: base.transportContext, mustIncludePlaces: [] }, null, async (cp) => { if (cp.phase === 'done') final = cp })
    const ruta = mapGeneratedRouteToRoute(final.generated, 'Roma', respuestas, base.transportContext)
    ruta.id = base.id
    for (const d of ruta.days) if (!d.countryCode) d.countryCode = 'it'
    await (await import('/src/lib/destinationExcursions.ts')).fetchDestinationExcursions('Roma')
    st.setState({ route: ruta, reservations: [{ id: 'x1', kind: 'entrada', dayNumber: null, paraQuien: null, ...${JSON.stringify(res)} }] })
    const ok = await (await import('/src/lib/rebuildDay.ts')).rehacerDiasSinTocar(null)
    const r = st.getState().route
    return JSON.stringify({ ok, dias: r.days.map((d) => d.dayNumber + ' ' + (d.curatedTitle || d.title) + ' | ' + d.stops.map((s) => (s.time || '--') + ' ' + s.name).join(' ; ')) })
  })()`)
  console.log(JSON.parse(out).ok, '\n' + JSON.parse(out).dias.join('\n'))
} finally {
  await a.cerrar()
}
process.exit(0)
