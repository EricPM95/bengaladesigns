// V57: SOLO capturas (no es una prueba) en modo iPhone (390x844). Un solo Chrome por vez, que se cierra al acabar. Por la cola:
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/capturasV57.mjs roma|lanza [caso]
// Guarda docs/dias/V57_capturas/<nombre>.jpg y escribe docs/dias/V57_log_<destino>.json con el texto de cada pantalla. Lanzarote pide la API con DESTINOS_OCULTOS='-'.
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'

const CAP = path.resolve('docs/dias/V57_capturas')
fs.mkdirSync(CAP, { recursive: true })
const DEST = process.argv[2] === 'lanza' ? 'lanza' : 'roma'
const SOLO = process.argv[3] ?? null
const R = "(await import('/src/store/useRouteStore.ts')).useRouteStore"
const ANTES = fs.readFileSync('scripts/destino/pruebaV43.mjs', 'utf8').match(/const ANTES = `([\s\S]*?)`/)[1]
const RUTA = '/?cuentas=off&logros=on&logrosDemo=1&apertura=0&hoy2=on&version=pago'
const lanza = DEST === 'lanza'
const IDA = lanza ? '2026-11-08' : '2026-10-17'
const VUELTA = lanza ? '2026-11-13' : '2026-10-20'

const a = await abrirApp(process.env.APP_URL ?? 'http://localhost:5173', { ruta: RUTA, antes: ANTES, ancho: 390, alto: 844 })
const ev = (e) => a.evaluar('(async () => (' + e + '))()')
const log = {}
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
  await a.evaluar(`(async () => { window.__base = JSON.stringify(${R}.getState().route); return true })()`)
  console.log('viaje', await ev(`JSON.stringify(${R}.getState().route.days.map((d) => ({ n: d.dayNumber, ret: !!d.isReturnLeg, tipo: d.dayType ?? null, int: d.interruptor?.mode ?? null, stops: d.stops.length, t: d.curatedTitle ?? d.title })))`))
  console.log('vuelta', await ev(`JSON.stringify({ dep: ${R}.getState().route.departureFlightTime ?? null, arr: ${R}.getState().route.arrivalFlightTime ?? null, plan: !!${R}.getState().route.planVuelta })`))

  /** Pone el viaje base y le aplica `setup` (JS asíncrono con `st` y `r`), luego el día simulado. */
  const montar = async ({ setup = '', min, iso, sinPase = false }) => {
    await a.evaluar(`(async () => {
      const st = ${R}
      try { (await import('/src/components/logros/momentos/useMomentosUI.ts')).useMomentosUI.getState().cerrarResumenViaje(); sessionStorage.clear() } catch {}
      st.getState().setDevSimulatedTodayIso('${iso}')
      const r = JSON.parse(window.__base)
      st.setState({ route: r, reservations: [], screen: 'route' })
      window.__pruebaDelPase = ${sinPase ? "{ cobro: true, conPase: false, puede: false, pruebaGastada: true, prueba: { estado: 'gastada' } }" : 'undefined'}
      ${setup}
      try { Object.keys(localStorage).filter((k) => k.startsWith('trazo:hoy') || k.startsWith('jutrip:avisos-dichos:') || k.startsWith('trazo:hoy2')).forEach((k) => localStorage.removeItem(k)); localStorage.setItem('trazo:logros:permisos-vistos', '1') } catch {}
      try { (await import('/src/lib/hoyCambiarPlanAplicar.ts')).useCambiarPlanStore.setState({ rutaId: null, fecha: null, historial: [], aviso: null }) } catch {}
      window.__horaFalsa = ${min}; window.__pos = null; window.__perm = 'denied'
      st.getState().setActiveDayId(null); st.getState().setMode('explore')
      return true })()`)
    await a.esp(700)
    await ev(`${R}.getState().setMode('today')`)
    await a.esp(4000)
    for (let i = 0; i < 3; i++) {
      const h = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Continuar|Entendido)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
      if (!h) break
      await a.esp(700)
    }
  }
  const sacar = async (nombre) => {
    await a.esp(1200)
    await a.captura(path.join(CAP, `${nombre}.jpg`))
    log[nombre] = await a.evaluar("document.body.innerText.replace(/\\s+/g, ' ').slice(0, 1400)")
    log[nombre + '__plan'] = await ev(`JSON.stringify({ pv: ${R}.getState().route.planVuelta ?? null, coche: ${R}.getState().route.days.find((d) => d.isReturnLeg)?.coche?.vuelta ?? null })`)
    console.log('captura', nombre, '|', String(log[nombre]).slice(0, 260))
  }
  // El vuelo como lo guarda el viajero en RESERVAS (hora + planes que da el motor); `reorganizado`: además «Sí, adaptarlos».
  const vuelo = (hora, { reorganizado = false } = {}) => `
      st.setState({ route: { ...st.getState().route, departureFlightTime: '${hora}', departureFechaVista: '${VUELTA}'${lanza ? ", arrivalFlightTime: '08:25'" : ", arrivalFlightTime: '11:15'"} } })
      const m = await import('/src/lib/adaptarVuelos.ts'); const s0 = st.getState()
      const p = await m.propuestaDeVuelos(s0.route, s0.reservations)
      if (p) { s0.ponerPlanes(p.planes); ${reorganizado ? 'm.ponerDiasAdaptados(p.dias)' : ''} }`
  const sinVuelo = "st.setState({ route: { ...st.getState().route, departureFlightTime: null, planVuelta: null } })"
  // Un viaje de verdad con paradas el día de vuelta que no caben: las del último día de ciudad, a partir de las 9:30.
  const conParadas = `
      const rr = JSON.parse(JSON.stringify(st.getState().route)); const dv = rr.days.find((d) => d.isReturnLeg); const dc = rr.days.filter((d) => !d.isReturnLeg).at(-1)
      if (dv && dv.stops.length === 0) { dv.stops = dc.stops.slice(0, 3).map((s, i) => ({ ...JSON.parse(JSON.stringify(s)), id: 'v57-' + i, time: ['09:30', '11:15', '13:30'][i], durationMinutes: 75 })) }
      st.setState({ route: rr })`

  const CASOS = [
    ['con_vuelo_primera_hora', { setup: vuelo('19:40'), min: 8 * 60 + 15, iso: VUELTA }],
    ['con_vuelo_reorganizado', { setup: vuelo('19:40', { reorganizado: true }), min: 10 * 60, iso: VUELTA }],
    ['con_vuelo_mediodia', { setup: vuelo('19:40'), min: 12 * 60, iso: VUELTA }],
    ['con_vuelo_media_tarde', { setup: vuelo('19:40'), min: 16 * 60 + 30, iso: VUELTA }],
    ['sin_vuelo', { setup: sinVuelo, min: 10 * 60, iso: VUELTA }],
    ['sin_reorganizar_sin_tiempo', { setup: conParadas + vuelo('13:30'), min: 8 * 60 + 40, iso: VUELTA }],
    ['sin_pase', { setup: vuelo('19:40'), min: 10 * 60, iso: VUELTA, sinPase: true }],
    ['ya_salio_vuelo', { setup: vuelo('18:05'), min: 19 * 60, iso: VUELTA }],
    ['ya_salio_vuelo_noche', { setup: vuelo('18:05'), min: 22 * 60, iso: VUELTA }],
  ]
  for (const [n, c] of CASOS) {
    if (SOLO && SOLO !== n) continue
    await montar(c)
    await sacar(`vuelta_${DEST === 'roma' ? 'roma' : 'lanza'}_${n}`)
  }
  // La excursión: Roma, Pompeya el lunes 19 (la reserva como la crea la app; el día lo pone la reserva); Lanzarote, La Graciosa (el día de excursión que trae el viaje).
  if (!SOLO || SOLO === 'excursion') {
    if (!lanza) {
      await montar({ iso: '2026-10-19', min: 10 * 60, setup: `
        const exc = { id: 'pompeya', title: 'Excursión a Pompeya y Sorrento', durationHours: 12, durationLabel: '12 h', meetingPoint: null, halfDay: false, priceLabel: '', page: null }
        st.getState().addReservation({ id: 'v-exc-pompeya', kind: 'excursion', refId: 'pompeya', name: 'Excursión a Pompeya y Sorrento', placeNames: [], dateIso: '2026-10-19', dayNumber: null, time: '08:00', excursionId: 'pompeya', excursionData: exc }, exc)` })
      console.log('dia3', await ev(`JSON.stringify(${R}.getState().route.days.map((d) => ({ n: d.dayNumber, tipo: d.dayType ?? null, int: d.interruptor?.mode ?? null, stops: d.stops.length })))`))
    } else {
      const n = await ev(`${R}.getState().route.days.find((d) => d.dayType === 'excursion')?.dayNumber ?? 4`)
      const d = new Date(IDA + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + Number(n) - 1)
      await montar({ iso: d.toISOString().slice(0, 10), min: 10 * 60 })
    }
    await sacar(`excursion_${lanza ? 'lanza' : 'roma'}`)
  }
  fs.writeFileSync(`docs/dias/V57_log_${DEST}.json`, JSON.stringify(log, null, 1))
} finally {
  a.cerrar()
}
