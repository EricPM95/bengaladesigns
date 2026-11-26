// V69 (apartado 1, hoja de Reorganizar): SOLO capturas (no es una prueba) en modo iPhone (390x844). Un solo Chrome por vez, que se cierra al acabar.
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/capturasV69_a1.mjs <coliseo|vuelo> [Roma|Lanzarote] [dia=2] [hora=16:30|vuelo=17:00]
// «coliseo» = una entrada del Coliseo a las 16:30 guardada en el día `dia`; «vuelo» = el vuelo de ida aterriza a la hora dada. Guarda docs/dias/V69_capturas/a1_<caso>[_lanzarote].jpg y escribe el texto de la hoja.
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'

const CAP = path.resolve('docs/dias/V69_capturas')
fs.mkdirSync(CAP, { recursive: true })
const CASO = process.argv[2] ?? 'coliseo'
const DESTINO = process.argv[3] && !/=/.test(process.argv[3]) ? process.argv[3] : 'Roma'
const arg = (k, def) => (process.argv.find((x) => x.startsWith(k + '=')) ?? `${k}=${def}`).slice(k.length + 1)
const DIA = Number(arg('dia', 2))
const HORA = arg('hora', CASO === 'vuelo' ? '17:00' : '16:30')
const lanza = DESTINO === 'Lanzarote'
const nombre = `a1_${CASO}${CASO === 'vuelo' ? HORA.replace(':', '') : ''}${lanza ? '_lanzarote' : ''}`

const R = "(await import('/src/store/useRouteStore.ts')).useRouteStore"
const RUTA = '/?cuentas=off&logros=off&apertura=0&hoy2=on&version=pago'
const a = await abrirApp(process.env.APP_URL ?? 'http://localhost:5173', { ruta: RUTA, ancho: 390, alto: 844 })
const ev = (e) => a.evaluar('(async () => (' + e + '))()')
try {
  for (let i = 0; i < 80 && !(await a.evaluar(`typeof window.${lanza ? '__rutaLanzarote' : '__rutaPrueba'} === 'function'`).catch(() => false)); i++) await a.esp(500)
  await a.evaluar(lanza ? "window.__rutaLanzarote({ zona: 'costa_teguise', coche: 'alquiler', hoy: '2026-11-27' }).then(() => true)" : 'window.__rutaPrueba().then(() => true)')
  for (let i = 0; i < 300 && !(await ev(`${R}.getState().route ? true : false`).catch(() => false)); i++) await a.esp(1000)
  await a.esp(2500)
  for (let i = 0; i < 4; i++) {
    const h = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale|Cerrar)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
    if (!h) break
    await a.esp(600)
  }
  // El viaje sale el viernes 27 de noviembre (ANTES del viaje: nunca «hoy»).
  await a.evaluar(`(async () => {
    const st = ${R}
    const r = JSON.parse(JSON.stringify(st.getState().route))
    r.answers = { ...r.answers, dateRange: { start: '2027-07-13', end: '2027-07-16' } }
    ${CASO === 'vuelo' ? `r.arrivalFlightTime = '${HORA}'; ${lanza ? '' : "r.arrivalPointId = 'cia'"}` : ''}
    st.setState({ route: r, reservations: [], screen: 'route', dev_simulated_today_iso: '2027-07-01' })
    st.getState().setActiveDayId(null); st.getState().setMode('explore')
    return true
  })()`)
  await a.esp(1500)
  console.log('viaje', await ev(`JSON.stringify(${R}.getState().route.days.map((d) => ({ n: d.dayNumber, ret: !!d.isReturnLeg, stops: d.stops.map((s) => (s.time || '--') + ' ' + s.name + (s.reservedId ? ' [R]' : '')) })))`))
  if (CASO === 'coliseo') {
    await a.evaluar(`(async () => {
      const st = ${R}; const B = await import('/src/lib/bookings.ts')
      const r = st.getState().route
      const res = { id: 'res-v69', kind: 'entrada', refId: 'Coliseo', name: 'Coliseo', placeNames: ['Coliseo'], dateIso: B.dateOfDay(r, r.days.find((x) => x.dayNumber === ${DIA})), dayNumber: null, time: '${HORA}', paraQuien: null }
      st.getState().addReservation(res, undefined, undefined)
      return true })()`)
    await a.esp(4000)
    console.log('despues de la reserva', await ev(`JSON.stringify(${R}.getState().route.days.map((d) => ({ n: d.dayNumber, stops: d.stops.map((s) => (s.time || '--') + ' ' + s.name + (s.reservedId ? ' [R]' : '')) })))`))
  }
  const cuantos = await a.evaluar(`(async () => {
    const st = ${R}
    const r = st.getState().route
    const ids = r.days.filter((d) => !d.isReturnLeg).map((d) => d.id)
    const sr = (await import('/src/store/useReorganizarStore.ts')).useReorganizarStore.getState()
    const c = await (await import('/src/lib/reorganizarDia.ts')).diasQueCambian(ids)
    sr.reiniciar()
    sr.poner(c.map((x) => x.dayId), ids, c)
    sr.abrirAlerta()
    return c.length
  })()`)
  console.log('días que cambian:', cuantos)
  for (let i = 0; i < 40 && !(await a.evaluar("!!document.querySelector('[data-hoja=\"reorganizar\"]')").catch(() => false)); i++) await a.esp(1000)
  await a.esp(2000)
  console.log('texto:', await a.evaluar("(document.querySelector('[data-hoja=\"reorganizar\"]')?.innerText ?? 'SIN HOJA').split(String.fromCharCode(10)).join(' | ')"))
  console.log('tarjetas:', await a.evaluar("Array.from(document.querySelectorAll('[data-tarjeta-del-sitio]')).map((e) => e.innerText.split(String.fromCharCode(10)).join(' · ')).join(' || ')"))
  await a.captura(path.join(CAP, `${nombre}.jpg`))
} finally {
  a.cerrar()
}
