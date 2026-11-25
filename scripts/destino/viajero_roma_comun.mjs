// Ayudante de los scripts del viajero de prueba «Roma» (solo observa y captura; no arregla nada). Por la cola:
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/viajero_roma_<x>.mjs
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'

export const CAP = path.resolve('docs/dias/VIAJEROS_capturas')
fs.mkdirSync(CAP, { recursive: true })
export const png = (n) => path.join(CAP, `roma_${n}.jpg`)
export const R = "(await import('/src/store/useRouteStore.ts')).useRouteStore"
export const ANTES = fs.readFileSync('scripts/destino/pruebaV43.mjs', 'utf8').match(/const ANTES = `([\s\S]*?)`/)[1]

export async function abrir(extra = {}) {
  const a = await abrirApp(process.env.APP_URL ?? 'http://localhost:5173', { ruta: '/?cuentas=off&logros=on&logrosDemo=1&apertura=0&hoy2=on&version=pago', antes: ANTES, ancho: 390, alto: 844, ...extra })
  const ev = (e) => a.evaluar('(async () => (' + e + '))()')
  for (let i = 0; i < 80 && !(await a.evaluar("typeof window.__rutaPrueba === 'function'").catch(() => false)); i++) await a.esp(500)
  await a.evaluar('window.__rutaPrueba().then(() => true)')
  for (let i = 0; i < 240 && !(await ev(`${R}.getState().route ? true : false`).catch(() => false)); i++) await a.esp(1000)
  await a.esp(2500)
  for (let i = 0; i < 4; i++) {
    const h = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale|Cerrar)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
    if (!h) break
    await a.esp(600)
  }
  return { a, ev }
}

/** Vuelo, alojamiento, una entrada (Coliseo 18 oct 10:00) y la excursión (Pompeya 19 oct 08:00). */
export async function ponerReservas({ a }) {
  return a.evaluar(`(async () => {
    const st = ${R}; const s = st.getState(); const r = s.route
    const d1 = r.days.find((d) => !d.isReturnLeg)
    st.setState({
      route: { ...r, origin: 'Madrid', arrivalFlightTime: '11:15', departureFlightTime: '19:40', arrivalCodigo: 'VY6102' },
      transportBookings: { ...s.transportBookings, [d1.id]: { operator: 'Vueling', dateTime: '2026-10-17T11:15', precio: null, locator: 'ABC123', codigo: 'VY6102' } },
      accommodationSelections: { ...s.accommodationSelections, [d1.id]: { name: 'Hotel Quirinale', precio: null } },
    })
    const exc = { id: 'pompeya', title: 'Excursión a Pompeya y Sorrento', durationHours: 12, durationLabel: '12 h', meetingPoint: null, halfDay: false, priceLabel: '', page: null }
    st.getState().addReservation({ id: 'v-entrada-coliseo', kind: 'entrada', refId: 'Coliseo, Foro y Palatino', name: 'Coliseo, Foro y Palatino', placeNames: ['Coliseo'], dateIso: '2026-10-18', dayNumber: null, time: '10:00' })
    st.getState().addReservation({ id: 'v-exc-pompeya', kind: 'excursion', refId: 'pompeya', name: 'Excursión a Pompeya y Sorrento', placeNames: [], dateIso: '2026-10-19', dayNumber: null, time: '08:00', excursionId: 'pompeya', excursionData: exc }, exc)
    return JSON.stringify({ dias: st.getState().route.days.map((d) => ({ n: d.dayNumber, ret: !!d.isReturnLeg, tipo: d.dayType, stops: d.stops.map((x) => x.time + ' ' + x.name) })), res: st.getState().reservations.length })
  })()`)
}

export const hoy = async ({ a, ev }, iso, min) => {
  await a.evaluar(`(async () => {
    const st = ${R}
    try { Object.keys(localStorage).filter((k) => k.startsWith('jutrip:avisos-dichos:')).forEach((k) => localStorage.removeItem(k)); localStorage.setItem('trazo:logros:permisos-vistos', '1') } catch {}
    window.__horaFalsa = ${min}; window.__pos = null; window.__perm = 'denied'
    st.getState().setDevSimulatedTodayIso('${iso}'); st.getState().setActiveDayId(null); st.getState().setMode('explore')
    return true })()`)
  await a.esp(600)
  await ev(`${R}.getState().setMode('today')`)
  await a.esp(2800)
}
export const modo = async ({ a, ev }, m, ms = 2200) => {
  await ev(`${R}.getState().setMode('${m}')`)
  await a.esp(ms)
}
export const texto = (a, max = 1500) => a.evaluar(`(document.body.innerText ?? '').replace(/\\s+/g, ' ').slice(0, ${max})`)
export const clicTexto = (a, re) => a.evaluar(`(() => { const b = Array.from(document.querySelectorAll('button, [role=button]')).find((x) => ${re}.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()`)
export const botones = (a) => a.evaluar(`JSON.stringify(Array.from(document.querySelectorAll('button')).map((b) => (b.textContent || b.getAttribute('aria-label') || '').replace(/\\s+/g, ' ').trim().slice(0, 40)).filter(Boolean))`)
