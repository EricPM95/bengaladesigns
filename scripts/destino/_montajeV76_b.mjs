// V76 (apartados 2 y 4): el montaje común de la prueba y de las capturas (Chrome de prueba en iPhone 390x844 + un viaje de Roma o de Lanzarote con vuelos, escalas, trenes unidos y billetes).
// No toca el Supabase de producción (cuentas=off, sin sesión). Un solo Chrome, que cierra `a.cerrar()`.
import fs from 'node:fs'
import { abrirApp } from './_enLaApp.mjs'

export const R = "(await import('/src/store/useRouteStore.ts')).useRouteStore"
export const B = "(await import('/src/store/useBilleteStore.ts')).useBilleteStore"
const ANTES = fs.readFileSync('scripts/destino/pruebaV43.mjs', 'utf8').match(/const ANTES = `([\s\S]*?)`/)[1]
export const RUTA = '/?cuentas=off&logros=off&apertura=0&hoy2=on&version=pago'
const qr = (relleno) => `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 21 21"><rect width="21" height="21" fill="#fff"/><path fill="${relleno}" d="M1 1h7v7H1zM13 1h7v7h-7zM1 13h7v7H1zM3 3h3v3H3zM15 3h3v3h-3zM3 15h3v3H3zM10 1h1v2h-1zM10 5h2v1h-2zM9 9h3v1H9zM13 10h2v2h-2zM17 12h3v1h-3zM10 14h2v3h-2zM14 15h3v1h-3zM18 17h2v3h-2zM13 18h3v2h-3z"/></svg>`)}`
/** Códigos de mentira DISTINTOS (para ver cuál es el que sale en HOY): negro, azul, rojo. */
export const QR_NEGRO = qr('#111111')
export const QR_AZUL = qr('#1144cc')
export const QR_ROJO = qr('#cc1122')

export async function abrir(lanza) {
  const a = await abrirApp(process.env.APP_URL ?? 'http://localhost:5173', { ruta: RUTA, antes: ANTES, ancho: 390, alto: 844 })
  const ev = (e) => a.evaluar(`(async () => (${e}))()`)
  const IDA = lanza ? '2026-11-08' : '2026-10-17'
  const VUELTA = lanza ? '2026-11-13' : '2026-10-20'
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
  const clic = (texto) => a.evaluar(`(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => (x.textContent || '').trim().startsWith(${JSON.stringify(texto)})); if (!b) return false; b.click(); return true })()`)
  const clicSel = (sel) => a.evaluar(`(() => { const b = document.querySelector(${JSON.stringify(sel)}); if (!b) return false; b.click(); return true })()`)
  const poner = (sel, valor) => a.evaluar(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return false; Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(e, ${JSON.stringify(valor)}); e.dispatchEvent(new Event('input', { bubbles: true })); return true })()`)
  const hora = async (sel) => {
    await clicSel(sel)
    await a.esp(700)
    await clicSel('[data-hoja-de-hora-guardar]')
    await a.esp(450)
  }
  const VUELO = {
    arrivalFlightTime: lanza ? '08:25' : '11:15', arrivalCodigo: 'VY 6102', arrivalCompania: 'Vueling', arrivalOtroPunto: 'Barcelona (El Prat)', arrivalOtraHora: lanza ? '06:30' : '08:35', arrivalPointId: lanza ? 'ace' : 'fco',
    departureFlightTime: '19:30', departureCodigo: 'VY 6105', departureCompania: 'Vueling', departureOtroPunto: 'Barcelona (El Prat)', departureOtraHora: lanza ? '22:05' : '21:45', departurePointId: lanza ? 'ace' : 'fco',
    arrivalRetraso: null, departureRetraso: null, arrivalEscalas: null, departureEscalas: null,
  }
  /**
   * Pone el viaje: la ruta con sus vuelos (`ruta` los cambia: escalas…), las reservas, los billetes guardados y el día y la hora simulados; abre RESERVAS (`modo: 'bookings'`) o HOY (`modo: 'today'`, en el día de la `ida` o de la `vuelta`).
   * `billetes`: [{ clave: 'arrival' | 'departure' | 'escala:arrival:0' | '<id de una reserva>', qr: <data uri> }].
   */
  const montar = async ({ modo = 'bookings', dia = 'ida', min = 9 * 60, ruta = {}, reservas = [], billetes = [], coche = null, alojamiento = true }) => {
    await a.evaluar(`(async () => {
      const st = ${R}
      try { sessionStorage.clear() } catch {}
      st.getState().setDevSimulatedTodayIso('${dia === 'ida' ? IDA : VUELTA}')
      const r = JSON.parse(window.__base)
      Object.assign(r, ${JSON.stringify({ ...VUELO, ...ruta })})
      r.departureFechaVista = r.answers?.dateRange?.end ?? null
      const seg = (await import('/src/lib/tuAlojamiento.ts')).estanciasDelViaje(r)[0]
      st.setState({ route: r, reservations: ${JSON.stringify(reservas)}, screen: 'route', accommodationSelections: ${alojamiento} && seg ? { [seg.segmentDayId]: { name: ${JSON.stringify(lanza ? 'The Colors House' : 'Hotel Quirinale')}, precio: null } } : {}, rentalVehicleBooking: ${JSON.stringify(coche)} })
      const m = await import('/src/lib/adaptarVuelos.ts'); const s0 = st.getState()
      const p = await m.propuestaDeVuelos(s0.route, s0.reservations)
      if (p) s0.ponerPlanes(p.planes)
      const b = ${B}
      const tid = (await import('/src/store/useSyncStore.ts')).useSyncStore.getState().activeTripId
      try { localStorage.removeItem('trazo:billete:v1:' + (tid ?? 'local')) } catch {}
      b.setState({ datos: {}, tripId: tid ?? null })
      for (const x of ${JSON.stringify(billetes)}) {
        const codigo = { texto: 'M1', formato: 'qr', imagen: null, dibujo: x.qr }
        if (x.clave === 'arrival' || x.clave === 'departure') b.getState().poner(tid ?? null, x.clave, { horaRoma: x.clave === 'arrival' ? r.arrivalFlightTime : r.departureFlightTime, localizador: null, terminal: x.terminal ?? null, asiento: x.asiento ?? null, coche: null, codigo, dueno: null })
        else b.getState().ponerExcursion(tid ?? null, x.clave, { personas: null, localizador: null, codigo, dueno: null })
      }
      window.__pruebaDelPase = undefined
      try { Object.keys(localStorage).filter((k) => k.startsWith('trazo:hoy') || k.startsWith('jutrip:avisos-dichos:')).forEach((k) => localStorage.removeItem(k)); localStorage.setItem('trazo:logros:permisos-vistos', '1') } catch {}
      window.__horaFalsa = ${min}; window.__pos = null; window.__perm = 'denied'
      const V = await import('/src/store/useViajeCompartido.ts')
      V.useViajeCompartido.getState().poner({ gente: [] })
      st.getState().setActiveDayId(null); st.getState().setMode('explore')
      return true })()`)
    await a.esp(700)
    await ev(`${R}.getState().setMode('${modo}')`)
    await a.esp(modo === 'today' ? 4500 : 2500)
    for (let i = 0; i < 3; i++) {
      const h = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Continuar|Entendido)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
      if (!h) break
      await a.esp(700)
    }
  }
  /** Abre el bloque «Llegada y vuelta» de RESERVAS (la cabecera). */
  const abrirLlegadaYVuelta = async () => {
    await a.evaluar("(() => { const c = document.querySelector('[data-llegada-cabecera]'); if (c) c.click(); return true })()")
    await a.esp(900)
  }
  return { a, ev, clic, clicSel, poner, hora, montar, abrirLlegadaYVuelta, IDA, VUELTA, lanza }
}
