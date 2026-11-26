// V68 (apartados 1-3): capturas en modo iPhone (390 de ancho) ANTES y DESPUÉS de los casos de Eric: Museos Vaticanos 15:00, «Coliseo, Foro y Palatino» 13:00, Free Tour 15:00 y «Recuperar el día». Un solo Chrome, que se cierra al acabar.
//   APP_URL=http://localhost:5173 node scripts/destino/capturasV68_a_casos.mjs roma|lanza [vaticanos|coliseo|freetour|recuperar]
// «Antes» = el código VIEJO de `placeReservedEntrance` (bookings.ts de HEAD, copiado un momento a src/lib/_bookings_old_v68.ts: lo hace este script y lo borra al acabar) y la recuperación vieja (solo el día). «Después» = el camino de verdad de la app
// (`addReservation` con el motor, y `recuperarElDia`). Guarda docs/dias/V68_capturas/a_<caso>_antes.jpg / _despues.jpg (+ `_origen` del día del que sale) y docs/dias/V68_log_a_<modo>.json.
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'

const CAP = path.resolve('docs/dias/V68_capturas')
fs.mkdirSync(CAP, { recursive: true })
const MODO = process.argv[2] ?? 'roma'
const SOLO = process.argv[3] ?? null
const quiere = (id) => !SOLO || SOLO === id
const lanza = MODO === 'lanza'
const R = "(await import('/src/store/useRouteStore.ts')).useRouteStore"
const ANTES = fs.readFileSync('scripts/destino/pruebaV43.mjs', 'utf8').match(/const ANTES = `([\s\S]*?)`/)[1]
const RUTA = '/?cuentas=off&logros=off&apertura=0&hoy2=on&version=pago'
const VIEJO = 'src/lib/_bookings_old_v68.ts'
fs.writeFileSync(VIEJO, execSync('git show HEAD:src/lib/bookings.ts', { maxBuffer: 20e6 }).toString('utf8'))
const a = await abrirApp(process.env.APP_URL ?? 'http://localhost:5173', { ruta: RUTA, antes: ANTES, ancho: 390, alto: 3300 })
const ev = (e) => a.evaluar('(async () => (' + e + '))()')
const log = {}
const LISTA = `(async () => { const r = (${R}).getState().route; return r.days.map((d) => ({ n: d.dayNumber, titulo: d.curatedTitle || d.title, paradas: d.stops.map((s) => (s.time || '--') + ' ' + s.name + (s.reservedId ? ' [R]' : '') + (s.isFreeTour ? ' [FT]' : '')) })) })()`
try {
  for (let i = 0; i < 80 && !(await a.evaluar(`typeof window.${lanza ? '__rutaLanzarote' : '__rutaPrueba'} === 'function'`).catch(() => false)); i++) await a.esp(500)
  await a.evaluar(lanza ? "window.__rutaLanzarote({ zona: 'costa_teguise', coche: 'alquiler', hoy: '2026-11-08' }).then(() => true)" : 'window.__rutaPrueba().then(() => true)')
  for (let i = 0; i < 300 && !(await ev(`${R}.getState().route ? true : false`).catch(() => false)); i++) await a.esp(1000)
  await a.esp(2500)
  for (let i = 0; i < 4; i++) {
    const h = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale|Cerrar)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
    if (!h) break
    await a.esp(600)
  }
  if (!lanza) {
    // El viaje de Eric: Roma, 13-15 de julio de 2027, creado de cero.
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
      await (await import('/src/lib/destinationExcursions.ts')).fetchDestinationExcursions('Roma')
      window.__base = JSON.stringify(ruta)
      return true })()`)
  } else {
    await a.evaluar(`(async () => { await (await import('/src/lib/destinationExcursions.ts')).fetchDestinationExcursions('Lanzarote'); window.__base = JSON.stringify(${R}.getState().route); return true })()`)
  }
  await a.esp(2000)
  log.base = await ev(LISTA)

  const reset = async () => {
    await a.evaluar(`(async () => { const st = ${R}; st.setState({ route: JSON.parse(window.__base), reservations: [] }); (await import('/src/store/useReorganizarStore.ts')).useReorganizarStore.getState().reiniciar(); return true })()`)
    await a.esp(600)
  }
  /** Abre el día `n` en DIAS y lo captura (la ventana es alta: se ve el día entero). */
  const sacarDia = async (id, n) => {
    await a.evaluar(`(async () => { const st = ${R}; const d = st.getState().route.days.find((x) => x.dayNumber === ${n}); st.getState().setMode('days'); st.getState().setActiveDayId(d ? d.id : null); return true })()`)
    await a.esp(2500)
    await a.captura(path.join(CAP, `${id}.jpg`))
    console.log('captura', id)
  }
  const diaDe = (cond) => `(() => { const r = JSON.parse(window.__base); return r.days.find((d) => !d.isReturnLeg && d.stops.some((s) => ${cond})) })()`
  /** Una reserva en el día `diaN` (su fecha) del sitio dado. `ctx`: lo que cambia de un caso a otro. */
  const caso = async (id, { nombres, nombre, refId, hora, diaN, antesDia, despuesDia = diaN, origenN = null }) => {
    const J = JSON.stringify
    const res = `{ id: 'res-v68', kind: 'entrada', refId: ${J(refId)}, name: ${J(nombre)}, placeNames: ${J(nombres)}, dateIso: B.dateOfDay(r, r.days.find((x) => x.dayNumber === ${diaN})), dayNumber: null, time: ${J(hora)}, paraQuien: null }`
    // ANTES: el código viejo.
    await reset()
    await a.evaluar(`(async () => {
      const st = ${R}; const B = await import('/src/lib/bookings.ts'); const V = await import('/src/lib/_bookings_old_v68.ts')
      const r = st.getState().route; const res = ${res}
      st.setState({ reservations: [res], route: V.placeReservedEntrance(r, res) })
      st.getState().setActiveDayId(null); st.getState().setMode('days')
      return true })()`)
    await a.esp(800)
    log[id + '_antes'] = await ev(LISTA)
    await sacarDia(`a_${id}_antes`, antesDia ?? diaN)
    if (origenN) await sacarDia(`a_${id}_antes_origen`, origenN)
    // DESPUÉS: el camino de verdad.
    await reset()
    await a.evaluar(`(async () => {
      const st = ${R}; const B = await import('/src/lib/bookings.ts')
      const r = st.getState().route; const res = ${res}
      st.getState().addReservation(res, undefined, undefined)
      return true })()`)
    for (let i = 0; i < 24 && !log[id + '_aviso']; i++) {
      await a.esp(500)
      log[id + '_aviso'] = await a.evaluar("(async () => { const t = (await import('/src/store/useAddFlowStore.ts')).useAddFlowStore.getState().toast; return t ? t.message : null })()")
    }
    await a.esp(1500)
    log[id + '_despues'] = await ev(LISTA)
    await sacarDia(`a_${id}_despues`, despuesDia)
    if (origenN) await sacarDia(`a_${id}_despues_origen`, origenN)
    console.log(id, JSON.stringify(log[id + '_aviso']))
  }
  const n1 = (re) => `(s) => /${re}/i.test(s.name)`
  void n1
  if (!lanza) {
    if (quiere('vaticanos')) await caso('vaticanos', { nombres: ['Museos Vaticanos y Capilla Sixtina'], nombre: 'Museos Vaticanos y Capilla Sixtina', refId: 'Museos Vaticanos y Capilla Sixtina', hora: '15:00', diaN: 2, origenN: 1 })
    if (quiere('coliseo')) await caso('coliseo', { nombres: ['Coliseo', 'Foro Romano y Palatino'], nombre: 'Coliseo, Foro y Palatino', refId: 'Coliseo, Foro y Palatino', hora: '13:00', diaN: 1, origenN: 2 })
    if (quiere('freetour')) {
      // El Free Tour ya está en la ruta (a las 10:00 del día 1) y se reserva para el día 2 a las 15:00.
      await reset(); await a.evaluar(`(async () => { await (await import('/src/lib/rebuildDay.ts')).aplicarFreeTour({ franja: 'manana', hora: '10:00' }); window.__base = JSON.stringify(${R}.getState().route); return true })()`)
      await a.esp(1500)
      log.freetour_base = await ev(LISTA)
      await caso('freetour', { nombres: ['Free Tour por Roma'], nombre: 'Free Tour por Roma', refId: 'Free Tour', hora: '15:00', diaN: 2, origenN: 1 })
    }
    if (quiere('recuperar')) {
      // El día 1 (con Free Tour) se cambia a mano: el Free Tour pasa al día 2; se recupera el día 1.
      await reset(); await a.evaluar(`(async () => { await (await import('/src/lib/rebuildDay.ts')).aplicarFreeTour({ franja: 'manana', hora: '10:00' }); window.__base = JSON.stringify(${R}.getState().route); return true })()`)
      await a.esp(1500)
      const preparar = `(async () => {
        const st = ${R}; await (async () => {})()
        st.setState({ route: JSON.parse(window.__base), reservations: [] })
        const r = st.getState().route
        const d1 = r.days.find((d) => d.stops.some((s) => s.isFreeTour))
        const d2 = r.days.find((d) => !d.isReturnLeg && d.id !== d1.id)
        const ft = d1.stops.find((s) => s.isFreeTour)
        st.getState().moveStopToDay(ft.id, d1.id, d2.id)
        return JSON.stringify({ d1: d1.dayNumber, d2: d2.dayNumber })
      })()`
      // ANTES: la recuperación vieja (solo el día).
      const ids = JSON.parse(await a.evaluar(preparar))
      await a.evaluar(`(async () => { const st = ${R}; const r = st.getState().route; st.setState({ route: { ...r, days: r.days.map((d) => (d.dayNumber === ${ids.d1} && d.originalSnapshot ? { ...d.originalSnapshot, id: d.id, dayNumber: d.dayNumber, colorIndex: d.colorIndex, originalSnapshot: null } : d)) } }); return true })()`)
      await a.esp(800)
      log.recuperar_antes = await ev(LISTA)
      await sacarDia('a_recuperar_antes', ids.d2)
      // DESPUÉS: recuperar de verdad, sin Reorganizar.
      await a.evaluar(preparar)
      await a.esp(500)
      await a.evaluar(`(async () => { (await import('/src/lib/recuperarElDia.ts')).recuperarElDia((${R}).getState().route.days.find((d) => d.dayNumber === ${ids.d1}).id); return true })()`)
      await a.esp(2500)
      log.recuperar_despues = await ev(LISTA)
      log.recuperar_boton = await a.evaluar("(async () => (await import('/src/store/useReorganizarStore.ts')).useReorganizarStore.getState().dias)()")
      log.recuperar_repetidos = await a.evaluar(`(async () => (await import('/src/lib/sinSitiosRepetidos.ts')).sitiosRepetidos(${R}.getState().route).map((x) => x.nombre))()`)
      await sacarDia('a_recuperar_despues', ids.d2)
      console.log('recuperar: boton', JSON.stringify(log.recuperar_boton), 'repetidos', JSON.stringify(log.recuperar_repetidos))
    }
  } else {
    // Lanzarote (en coche): una entrada a su hora en otro día, con el código nuevo.
    await a.evaluar(`(async () => {
      const st = ${R}; const B = await import('/src/lib/bookings.ts')
      const r = st.getState().route
      const origen = r.days.find((d) => !d.isReturnLeg && d.stops.length > 2)
      const otro = r.days.find((d) => !d.isReturnLeg && d.id !== origen.id && d.stops.length > 2)
      const s = origen.stops.find((x) => !x.isBreak && !x.passThrough && x.name)
      window.__ls = { s: s.name, d1: origen.dayNumber, d2: otro.dayNumber }
      const res = { id: 'res-v68l', kind: 'entrada', refId: s.name, name: s.name, placeNames: [s.name], dateIso: B.dateOfDay(r, otro), dayNumber: null, time: '15:00', paraQuien: null }
      st.getState().addReservation(res, undefined, undefined)
      return true })()`)
    await a.esp(12000)
    log.lanza = await ev(LISTA)
    log.lanza_sitio = await a.evaluar('JSON.stringify(window.__ls)')
    log.lanza_repetidos = await a.evaluar(`(async () => (await import('/src/lib/sinSitiosRepetidos.ts')).sitiosRepetidos(${R}.getState().route).map((x) => x.nombre))()`)
    const ls = JSON.parse(log.lanza_sitio)
    await sacarDia('a_lanzarote_despues', ls.d2)
    console.log('lanzarote', log.lanza_sitio, JSON.stringify(log.lanza_repetidos))
  }
} finally {
  fs.writeFileSync(path.resolve(`docs/dias/V68_log_a_${MODO}.json`), JSON.stringify(log, null, 1))
  try { fs.unlinkSync(VIEJO) } catch {}
  await a.cerrar()
}
process.exit(0)
