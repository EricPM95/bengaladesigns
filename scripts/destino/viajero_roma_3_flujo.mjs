// Viajero Roma 3: el flujo del día 1 con GPS (llegar, terminar, saltar), DÍAS del día 3 (excursión) y las tarjetas de RESERVAS abiertas.
import { abrir, ponerReservas, hoy, modo, texto, botones, clicTexto, png, R } from './viajero_roma_comun.mjs'
const c = await abrir()
const { a, ev } = c
const paso = async (n, fn) => {
  try {
    await fn()
  } catch (e) {
    console.log(`!! ${n}:`, String(e?.message ?? e).slice(0, 200))
  }
}
const ver = async (n) => {
  console.log(`### ${n}`, await texto(a, 1000))
  console.log('   BOTONES', await botones(a))
  await a.captura(png(n))
}
try {
  await ponerReservas(c)
  await paso('d1 15:00 GPS', async () => {
    await hoy(c, '2026-10-17', 15 * 60)
    await clicTexto(a, /Dejarlo como está/)
    await a.evaluar("window.__pos = { lat: 41.8992, lng: 12.4731 }; window.__perm = 'granted'; true")
    await a.esp(2500)
    await ver('flu_d1_1500_gps')
    await clicTexto(a, /Ya he llegado/)
    await a.esp(2500)
    await ver('flu_d1_1500_llegado')
    await clicTexto(a, /He terminado/)
    await a.esp(3000)
    await ver('flu_d1_terminado')
    await clicTexto(a, /Saltar parada/)
    await a.esp(2500)
    await ver('flu_d1_saltar')
  })
  await paso('d1 lejos 10:00 (aeropuerto)', async () => {
    await hoy(c, '2026-10-17', 12 * 60)
    await a.evaluar("window.__pos = { lat: 41.8003, lng: 12.2389 }; window.__perm = 'granted'; true")
    await a.esp(3000)
    await ver('flu_d1_1200_aeropuerto')
  })
  await paso('d1 20:30 llegar tarde', async () => {
    await hoy(c, '2026-10-17', 20 * 60 + 30)
    await a.evaluar("window.__pos = { lat: 41.9009, lng: 12.4833 }; window.__perm = 'granted'; true")
    await a.esp(3000)
    await ver('flu_d1_2030_fontana')
  })
  await paso('DIAS dia 3', async () => {
    await ev(`(() => { const st = ${R}.getState(); const d = st.route.days.find((x) => x.dayNumber === 3); st.setActiveDayId(d.id); st.setMode('days'); return true })()`)
    await a.esp(3000)
    await ver('flu_dias_d3')
  })
  await paso('DIAS dia 4', async () => {
    await ev(`(() => { const st = ${R}.getState(); const d = st.route.days.find((x) => x.isReturnLeg); st.setActiveDayId(d.id); st.setMode('days'); return true })()`)
    await a.esp(3000)
    await ver('flu_dias_d4')
  })
  await paso('RESERVAS abiertas', async () => {
    await modo(c, 'bookings', 2500)
    await clicTexto(a, /Llegada y vuelta/)
    await a.esp(1500)
    await ver('flu_res_llegada')
    await clicTexto(a, /Llegada y vuelta/)
    await a.esp(600)
    await clicTexto(a, /Entradas y Free Tour/)
    await a.esp(1500)
    await ver('flu_res_entradas')
  })
  await paso('RESERVAS excursiones', async () => {
    await modo(c, 'bookings', 2500)
    await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button, [role=button]')).find((x) => /^Excursiones y actividades/.test((x.textContent || '').trim())); b?.click(); b?.scrollIntoView?.(); return !!b })()")
    await a.esp(1500)
    await ver('flu_res_excursiones')
  })
} finally {
  a.cerrar()
}
console.log('listo')
