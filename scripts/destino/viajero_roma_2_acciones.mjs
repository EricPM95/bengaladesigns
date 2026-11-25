// Viajero Roma 2: acciones en HOY del día 2 (llegar, saltar, cambiar plan, llegar tarde) y las otras pestañas.
import { abrir, ponerReservas, hoy, modo, texto, botones, clicTexto, png } from './viajero_roma_comun.mjs'
const c = await abrir()
const { a, ev } = c
const paso = async (nombre, fn) => {
  try {
    await fn()
  } catch (e) {
    console.log(`!! ${nombre}:`, String(e?.message ?? e).slice(0, 200))
  }
}
const ver = async (n, extra = '') => {
  console.log(`### ${n} ${extra}`, await texto(a, 1100))
  console.log('   BOTONES', await botones(a))
  await a.captura(png(n))
}
try {
  await ponerReservas(c)
  await paso('d2 09:00', async () => {
    await hoy(c, '2026-10-18', 9 * 60)
    await ver('acc_d2_0900')
    await a.evaluar("window.__pos = { lat: 41.8902, lng: 12.4922 }; window.__perm = 'granted'; true")
    await clicTexto(a, /Ya he llegado/)
    await a.esp(2500)
    await ver('acc_d2_0900_llegado')
  })
  await paso('d2 11:30 tarde', async () => {
    await hoy(c, '2026-10-18', 11 * 60 + 30)
    await ver('acc_d2_1130_tarde')
    await clicTexto(a, /Cambiar plan/)
    await a.esp(1200)
    await ver('acc_d2_cambiar_plan')
  })
  await paso('cambiar: retraso', async () => {
    const ok = await clicTexto(a, /retraso|Voy tarde|tarde/i)
    console.log('retraso click', ok)
    await a.esp(1500)
    await ver('acc_d2_retraso')
  })
  await paso('d2 12:30 saltar', async () => {
    await hoy(c, '2026-10-18', 12 * 60 + 30)
    const ok = await clicTexto(a, /Saltar|Quitar|Pasar de esta/i)
    console.log('saltar click', ok)
    await a.esp(1500)
    await ver('acc_d2_saltar')
  })
  await paso('d2 14:00 comer', async () => {
    await hoy(c, '2026-10-18', 14 * 60)
    await clicTexto(a, /Cambiar plan/)
    await a.esp(1000)
    await clicTexto(a, /comer|hambre|Comida/i)
    await a.esp(1500)
    await ver('acc_d2_comer')
  })
  await paso('d2 17:00 otro dia', async () => {
    await hoy(c, '2026-10-18', 17 * 60)
    await clicTexto(a, /Cambiar plan/)
    await a.esp(1000)
    await clicTexto(a, /otro día/i)
    await a.esp(1500)
    await ver('acc_d2_otrodia')
  })
  await paso('DIAS', async () => {
    await hoy(c, '2026-10-18', 12 * 60)
    await modo(c, 'days', 3000)
    await ver('acc_dias')
  })
  await paso('RESERVAS', async () => {
    await modo(c, 'bookings', 3000)
    await ver('acc_reservas')
  })
  await paso('EXPLORAR', async () => {
    await modo(c, 'explore', 3000)
    await ver('acc_explorar')
  })
  await paso('RUTA', async () => {
    await modo(c, 'route', 3000)
    await ver('acc_ruta')
  })
  await paso('PERFIL', async () => {
    await modo(c, 'today', 2000)
    await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /perfil|cuenta|avatar|ajustes/i.test(x.getAttribute('aria-label') || '')); if (b) { b.click(); return true } const hs = Array.from(document.querySelectorAll('header button')); hs[hs.length-1]?.click(); return false })()")
    await a.esp(2500)
    await ver('acc_perfil')
  })
} finally {
  a.cerrar()
}
console.log('listo')
