// 10S3b (agente E): captura de la hoja del TREN (ida) y de la tarjeta de HOY con el billete «BCN 08:30 → FCO 11:15», con la pieza de Design 02c al lado.
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/capturaTren10S3b.mjs
import path from 'node:path'
import { conViaje, esp, modulo } from './_10n5_comun.mjs'
import { capturarDesign } from './capturaDesign.mjs'

const SALIDA = path.resolve('docs/dias/capturas_jutrip')
const foto = (n) => path.join(SALIDA, `10s3b_${n}.jpg`)
const store = modulo('/src/store/useRouteStore.ts')
const poner = (a, js) => a.evaluar(`${store}.then((s) => { const e = s.useRouteStore.getState(); ${js}; return true })`)
let fallos = 0

const a = await conViaje({ version: 'pago', ancho: 390, alto: 844 })
try {
  // Tren: el medio de la ida y de la vuelta, sin horas.
  await poner(a, `s.useRouteStore.setState((st) => ({ route: { ...st.route, origin: 'Barcelona', originPlace: undefined, transportContext: { ...st.route.transportContext, transport_option: { ...(st.route.transportContext.transport_option ?? {}), id: 'train' } }, returnTransportOptionId: 'train', arrivalFlightTime: null, departureFlightTime: null, arrivalPointId: null, departurePointId: null, arrivalOtroPunto: null, arrivalOtraHora: null, departureOtroPunto: null, departureOtraHora: null } }))`)
  await poner(a, `e.setMode('bookings')`)
  await esp(2200)
  const abre = await a.evaluar(`(() => { const b = document.querySelector('[data-blk="llegada"] [class*="cursor-pointer"]'); if (!b) return false; b.click(); return true })()`)
  await esp(1800)
  const texto = await a.evaluar("document.querySelector('[role=\"dialog\"]')?.innerText.replace(/\\s+/g, ' ') ?? null")
  console.log('hoja abierta:', abre, '|', (texto ?? '').slice(0, 260))
  if (!abre || !texto) fallos++
  await a.captura(foto('tren_hoja'))
} finally {
  a.cerrar()
}
if (process.env.SIN_DESIGN !== '1') {
  const ir = `(() => { const e = Array.from(document.querySelectorAll('span')).find((s) => /^02c ·/.test(s.textContent || '')); e?.scrollIntoView({ block: 'start' }); window.scrollBy(0, -12); return true })()`
  await capturarDesign('Piezas/Vuelo Reservas.dc.html', foto('tren_hoja_design'), { despues: ir }).catch((e) => console.log('  (sin captura de Design)', e.message))
}
process.exit(fallos ? 1 : 0)
