// 10S4 (agente F): capturas de móvil del presupuesto: vuelo 150 € (ida 100 + vuelta 50), alojamiento 280 €, Coliseo 50 €.
//   APP_URL=http://localhost:5173 API_URL=http://localhost:8787 node scripts/destino/_conCola.mjs node scripts/destino/capturaPresupuesto10S4.mjs
// Salida: 10s4_presupuesto_390.jpg y _375.jpg (sin pase) y 10s4_presupuesto_pase_390.jpg (con pase). Un solo Chrome a la vez, cerrado al acabar cada uno.
import path from 'node:path'
import { conViaje, esp, modulo, SALIDA } from './_10n5_comun.mjs'

const foto = (n) => path.join(SALIDA, `10s4_${n}.jpg`)
const store = modulo('/src/store/useRouteStore.ts')
const ui = modulo('/src/store/usePresupuestoUi.ts')
let fallos = 0

async function una({ version, ancho, archivo }) {
  const a = await conViaje({ version, ancho, alto: 844 })
  try {
    const eur = (amount) => `{ amount: ${amount}, currency: 'EUR' }`
    const r = await a.evaluar(`${store}.then((s) => {
      const st = s.useRouteStore.getState()
      const route = { ...st.route, origin: 'Barcelona', transportContext: { ...st.route.transportContext, transport_option: { ...(st.route.transportContext?.transport_option ?? {}), id: 'flight' } }, arrivalPrecio: ${eur(100)}, departurePrecio: ${eur(50)} }
      const d1 = route.days[0]
      s.useRouteStore.setState({
        route,
        accommodationSelections: { [d1.id]: { name: 'Hotel Roma', precio: ${eur(280)} } },
        reservations: [{ id: 'r10s4', kind: 'entrada', refId: 'Coliseo', name: 'Coliseo', placeNames: ['Coliseo'], dateIso: route.answers?.dateRange?.start ?? '2027-03-10', dayNumber: null, time: '10:00', precio: ${eur(50)} }],
      })
      return true
    })`)
    await a.evaluar(`${ui}.then((m) => { m.usePresupuestoUi.getState().abrir(); return true })`)
    await esp(2500)
    const info = await a.evaluar(`(() => { const l = document.querySelector('[data-leyenda]'); if (!l) return null; const r = l.getBoundingClientRect(); const it = [...l.querySelectorAll('[data-leyenda-item]')].map((x) => { const b = x.getBoundingClientRect(); return { t: x.textContent.replace(/\\s+/g, ' ').trim(), izq: Math.round(b.left), der: Math.round(b.right), sw: x.scrollWidth, cw: x.clientWidth } }); return { vw: window.innerWidth, izq: Math.round(r.left), der: Math.round(r.right), sw: l.scrollWidth, cw: l.clientWidth, it, texto: l.innerText.replace(/\\s+/g, ' '), bloque: /Transporte y alojamiento/.test(document.body.innerText) } })()`)
    console.log(archivo, JSON.stringify(info), 'estado:', r)
    if (!info) fallos++
    else {
      const corta = info.sw > info.cw + 1 || info.der > info.vw || info.it.some((x) => x.der > info.vw || x.sw > x.cw + 1)
      console.log(`  ${archivo}: leyenda ${corta ? 'SE CORTA' : 'cabe'} (ancho ${info.vw})`)
    }
    await a.captura(foto(archivo))
    // segunda captura más abajo (leyenda + bloque Transporte y alojamiento) si la pantalla desplaza
    await a.evaluar(`(() => { const e = Array.from(document.querySelectorAll('*')).find((x) => x.children.length === 0 && /Transporte y alojamiento/.test(x.textContent || '')); e?.scrollIntoView({ block: 'center' }); return true })()`)
    await esp(600)
    for (let i = 0; i < 3; i++) { try { await a.captura(foto(`${archivo}_abajo`)); break } catch (e) { console.log("  reintento captura abajo", e.message); await esp(1500) } }
  } finally {
    a.cerrar()
  }
}

await una({ version: 'gratis', ancho: 390, archivo: 'presupuesto_390' })
await una({ version: 'gratis', ancho: 375, archivo: 'presupuesto_375' })
await una({ version: 'pago', ancho: 390, archivo: 'presupuesto_pase_390' })
process.exit(fallos ? 1 : 0)
