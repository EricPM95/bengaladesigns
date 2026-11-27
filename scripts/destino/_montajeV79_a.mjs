// V79 (apartado 1): el montaje de la prueba con navegador de «Cerrar mi viaje» (el de capturasV79_a_vuelta.mjs, que viene del de capturasV70_a1.mjs): un viaje de Roma o de Lanzarote con el vuelo de vuelta guardado como lo guarda RESERVAS y el día simulado.
import fs from 'node:fs'
import { abrirApp } from './_enLaApp.mjs'
const R = "(await import('/src/store/useRouteStore.ts')).useRouteStore"
const B = "(await import('/src/store/useBilleteStore.ts')).useBilleteStore"
const ANTES = fs.readFileSync('scripts/destino/pruebaV43.mjs', 'utf8').match(/const ANTES = `([\s\S]*?)`/)[1]
const RUTA = '/?cuentas=off&logros=on&logrosDemo=1&apertura=0&hoy2=on&version=pago'
const QR = `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 21 21"><rect width="21" height="21" fill="#fff"/><path fill="#111" d="M1 1h7v7H1zM13 1h7v7h-7zM1 13h7v7H1zM3 3h3v3H3zM15 3h3v3h-3zM3 15h3v3H3zM10 1h1v2h-1zM10 5h2v1h-2zM9 9h3v1H9zM13 10h2v2h-2zM17 12h3v1h-3zM10 14h2v3h-2zM14 15h3v1h-3zM18 17h2v3h-2zM13 18h3v2h-3z"/></svg>')}`
export const ABRIR = async (lanza) => {
  const VUELTA = lanza ? '2026-11-13' : '2026-10-20'
  const a = await abrirApp(process.env.APP_URL ?? 'http://localhost:5173', { ruta: RUTA, antes: ANTES, ancho: 390, alto: 844 })
  const ev = (e) => a.evaluar('(async () => (' + e + '))()')
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
  console.log('viaje', await ev(`JSON.stringify(${R}.getState().route.days.map((d) => ({ n: d.dayNumber, ret: !!d.isReturnLeg, stops: d.stops.length })))`))

  /** El vuelo de vuelta como lo guarda el viajero en RESERVAS (la ruta + el billete guardado) y el día simulado a esa hora. `pos`: GPS; `salio`: minutos a los que «ya salió». */
  const montar = async ({ hora = '19:30', min = 10 * 60, billete = { terminal: 'T3', asiento: '12A', localizador: 'K7M2QX', qr: true }, pos = null, salio = null, ruta = {}, coche = null, paradas = 0 }) => {
    await a.evaluar(`(async () => {
      const st = ${R}
      try { sessionStorage.clear() } catch {}
      st.getState().setDevSimulatedTodayIso('${VUELTA}')
      const r = JSON.parse(window.__base)
      Object.assign(r, ${JSON.stringify(ruta)})
      Object.assign(r, { departureFlightTime: '${hora}', departureFechaVista: '${VUELTA}', departureRetraso: null, departureCodigo: 'VY6105', departureCompania: 'Vueling', departureOtroPunto: 'Barcelona (El Prat)', departureOtraHora: '${lanza ? '22:05' : '21:45'}', departurePointId: '${lanza ? 'ace' : 'fco'}', arrivalFlightTime: '${lanza ? '08:25' : '11:15'}' })
      const dc = r.days.filter((d) => !d.isReturnLeg).at(-1); const dv = r.days.find((d) => d.isReturnLeg)
      if (dv) dv.stops = ${paradas} > 0 ? dc.stops.slice(0, ${paradas}).map((s, i) => ({ ...JSON.parse(JSON.stringify(s)), id: 'v70-' + i, time: ['09:30', '11:15'][i], durationMinutes: 60, checkedInAt: null, saltada: false })) : []
      const seg = (await import('/src/lib/tuAlojamiento.ts')).estanciasDelViaje(r)[0]
      st.setState({ route: r, reservations: [], screen: 'route', accommodationSelections: seg ? { [seg.segmentDayId]: { name: ${JSON.stringify(lanza ? 'The Colors House' : 'Hotel Quirinale')}, precio: null } } : {}, rentalVehicleBooking: ${JSON.stringify(coche)} })
      const m = await import('/src/lib/adaptarVuelos.ts'); const s0 = st.getState()
      const p = await m.propuestaDeVuelos(s0.route, s0.reservations)
      if (p) s0.ponerPlanes(p.planes)
      const b = ${B}
      const tid = (await import('/src/store/useSyncStore.ts')).useSyncStore.getState().activeTripId
      try { localStorage.removeItem('trazo:billete:v1:' + (tid ?? 'local')) } catch {}
      b.setState({ datos: {}, tripId: tid ?? null })
      ${billete ? `b.getState().poner(tid ?? null, 'departure', { horaRoma: '${hora}', localizador: ${JSON.stringify(billete.localizador ?? null)}, terminal: ${JSON.stringify(billete.terminal ?? null)}, asiento: ${JSON.stringify(billete.asiento ?? null)}, coche: null, codigo: ${billete.qr ? `{ texto: 'M1', formato: 'qr', imagen: null, dibujo: ${JSON.stringify(QR)} }` : 'null'}, dueno: null })` : ''}
      window.__pruebaDelPase = undefined
      try { Object.keys(localStorage).filter((k) => k.startsWith('trazo:hoy') || k.startsWith('jutrip:avisos-dichos:')).forEach((k) => localStorage.removeItem(k)); localStorage.setItem('trazo:logros:permisos-vistos', '1') } catch {}
      ${salio != null ? `try { localStorage.setItem('trazo:hoy:salio:' + st.getState().route.id + ':${VUELTA}', '${salio}') } catch {}` : ''}
      window.__horaFalsa = ${min}; window.__pos = ${pos ? JSON.stringify(pos) : 'null'}; window.__perm = ${pos ? "'granted'" : "'denied'"}
      st.getState().setActiveDayId(null); st.getState().setMode('explore')
      return true })()`)
    await a.esp(700)
    await ev(`${R}.getState().setMode('today')`)
    await a.esp(4500)
    for (let i = 0; i < 3; i++) {
      const h = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Continuar|Entendido)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
      if (!h) break
      await a.esp(700)
    }
  }
  const clic = (texto) => a.evaluar(`(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => (x.textContent || '').trim().startsWith(${JSON.stringify(texto)})); if (!b) return false; b.click(); return true })()`)
  return { a, ev, montar, clic, R, VUELTA }
}
