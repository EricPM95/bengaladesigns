// V68 apartado 1-3: reproduce los casos de Eric (viaje de Roma del 13 al 15 de julio de 2027, de cero) y vuelca la ruta antes y después de cada reserva.
//   APP_URL=http://localhost:5173 node scripts/destino/capturasV68_a0_repro.mjs [caso]     caso: vaticanos | coliseo | freetour | recuperar | todos (por defecto)
// Un solo Chrome, que se cierra al acabar. Escribe docs/dias/V68_log_a0.json con las listas de paradas de cada caso.
import fs from 'node:fs'
import { abrirApp } from './_enLaApp.mjs'

const SOLO = process.argv[2] ?? 'todos'
const R = "(await import('/src/store/useRouteStore.ts')).useRouteStore"
const ANTES = fs.readFileSync('scripts/destino/pruebaV43.mjs', 'utf8').match(/const ANTES = `([\s\S]*?)`/)[1]
const a = await abrirApp(process.env.APP_URL ?? 'http://localhost:5173', { ruta: '/?cuentas=off&logros=off&apertura=0&hoy2=on&version=pago', antes: ANTES, ancho: 390, alto: 844 })
const ev = (e) => a.evaluar('(async () => (' + e + '))()')
const log = {}
const LISTA = `(async () => { const r = (${R}).getState().route; return r.days.map((d) => ({ id: d.id, n: d.dayNumber, titulo: d.curatedTitle || d.title, leg: !!d.isReturnLeg, paradas: d.stops.map((s) => (s.time || '--') + ' ' + s.name + (s.reservedId ? ' [R]' : '') + (s.isFreeTour ? ' [FT]' : '') + (s.visitMode === 'fuera' ? ' (fuera)' : '')) })) })()`
try {
  for (let i = 0; i < 80 && !(await a.evaluar("typeof window.__rutaPrueba === 'function'").catch(() => false)); i++) await a.esp(500)
  await a.evaluar('window.__rutaPrueba().then(() => true)')
  for (let i = 0; i < 300 && !(await ev(`${R}.getState().route ? true : false`).catch(() => false)); i++) await a.esp(1000)
  // El viaje de Eric: Roma, 13-15 de julio de 2027, creado de cero con la misma generación.
  await a.evaluar(`(async () => {
    const st = ${R}
    const base = st.getState().route
    const { runGeneration } = await import('/src/lib/routeGenerationOrchestrator.ts')
    const { mapGeneratedRouteToRoute } = await import('/src/lib/mapGeneratedRoute.ts')
    const respuestas = { ...base.answers, origin: 'Madrid', days: 3, dateRange: { start: '2027-07-13', end: '2027-07-15' }, month: 6, companion: 'couple', experiences: [], experiencesPositive: ['imprescindibles'], experiencesNegative: [], chronotype: 'normal', budgetLevel: 'comfortable' }
    let final = null
    await runGeneration({ destination: 'Roma', answers: respuestas, transportContext: base.transportContext, mustIncludePlaces: [] }, null, async (cp) => { if (cp.phase === 'done') final = cp })
    const ruta = mapGeneratedRouteToRoute(final.generated, 'Roma', respuestas, base.transportContext)
    ruta.id = base.id; ruta.createdAt = base.createdAt
    for (const d of ruta.days) if (!d.countryCode) d.countryCode = 'it'
    st.setState({ route: ruta, reservations: [], dev_simulated_today_iso: '2027-07-01' })
    window.__base = JSON.stringify(ruta)
    await (await import('/src/lib/destinationExcursions.ts')).fetchDestinationExcursions('Roma')
    return true })()`)
  await a.esp(1500)
  log.base = await ev(LISTA)
  console.log('BASE', JSON.stringify(log.base, null, 1))

  const reset = async () => {
    await a.evaluar(`(async () => { ${R}.setState({ route: JSON.parse(window.__base), reservations: [] }); return true })()`)
    await a.esp(500)
  }
  const reservar = async (caso, { refId, name, placeNames, dateIso, time, free, ft }) => {
    await reset()
    if (ft) {
      await a.evaluar(`(async () => (await import('/src/lib/rebuildDay.ts')).aplicarFreeTour({ franja: ${JSON.stringify(ft.franja)}, hora: ${JSON.stringify(ft.hora)} }))()`)
      await a.esp(1500)
      log[caso + '_base'] = await ev(LISTA)
    }
    await a.evaluar(`(async () => {
      const st = ${R}
      const r = { id: 'res-' + Date.now(), kind: 'entrada', refId: ${JSON.stringify(refId)}, name: ${JSON.stringify(name)}, placeNames: ${JSON.stringify(placeNames)}, dateIso: ${JSON.stringify(dateIso)}, dayNumber: null, time: ${JSON.stringify(time)}, paraQuien: null }
      ${free ? "st.getState().setFreeTourChoice && 0" : ''}
      st.getState().addReservation(r, undefined, undefined)
      return true })()`)
    await a.esp(9000)
    log[caso] = await ev(LISTA)
    console.log(caso, JSON.stringify(log[caso], null, 1))
  }
  if (SOLO === 'todos' || SOLO === 'vaticanos') await reservar('vaticanos', { refId: 'Museos Vaticanos', name: 'Museos Vaticanos y Capilla Sixtina', placeNames: ['Museos Vaticanos y Capilla Sixtina'], dateIso: '2027-07-14', time: '15:00' })
  if (SOLO === 'todos' || SOLO === 'coliseo') await reservar('coliseo', { refId: 'Coliseo, Foro y Palatino', name: 'Coliseo, Foro y Palatino', placeNames: ['Coliseo', 'Foro Romano y Palatino'], dateIso: '2027-07-13', time: '13:00' })
  const FTN = ['Free Tour por Roma']
  if (SOLO === 'todos' || SOLO === 'freetour') await reservar('freetour', { refId: 'Free Tour', name: 'Free Tour por Roma', placeNames: FTN, dateIso: '2027-07-14', time: '15:00', free: true, ft: { franja: 'manana', hora: '10:00' } })
  if (SOLO === 'todos' || SOLO === 'freetour10') await reservar('freetour10', { refId: 'Free Tour', name: 'Free Tour por Roma', placeNames: FTN, dateIso: '2027-07-14', time: '10:00', free: true, ft: { franja: 'tarde', hora: '15:00' } })
  fs.writeFileSync('docs/dias/V68_log_a0.json', JSON.stringify(log, null, 1))
} finally {
  await a.cerrar()
}
process.exit(0)
