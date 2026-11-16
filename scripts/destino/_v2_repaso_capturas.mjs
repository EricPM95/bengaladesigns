// Capturas de la app (móvil 390) que faltan para el REPASO_V2: HOY entero (H1), reto del día (H3), «Lugares pendientes» cerrado (H6), hoja de Gasolineras (H7), «Cerca de ti» en Roma (H8) y la historia sonando (A4).
import { abrirApp } from './_enLaApp.mjs'
const SAL = 'docs/dias/V2_capturas'
const nueva = async (destino, hoy, alto = 844) => {
  const app = await abrirApp(process.env.APP_URL || 'http://localhost:5199', { ruta: '/?cuentas=on&logros=on&logrosDemo=1&apertura=0&version=completa&hoy2=on', ancho: 390, alto })
  const fn = destino === 'lanzarote' ? '__rutaLanzarote' : '__rutaPrueba'
  for (let i = 0; i < 360 && !(await app.evaluar(`typeof window.${fn} === 'function'`).catch(() => false)); i++) await app.esp(500)
  await app.evaluar(destino === 'lanzarote' ? `window.__rutaLanzarote({ zona: 'costa_teguise', coche: 'alquiler', hoy: '${hoy}' }).then(() => true)` : `Promise.resolve(window.__rutaPrueba()).then(() => true)`)
  await app.esp(3000)
  await app.evaluar(`(async () => { const R = await import('/src/store/useRouteStore.ts'); R.useRouteStore.setState({ dev_simulated_today_iso: '${hoy}' }); R.useRouteStore.getState().setMode('today'); return true })()`)
  await app.esp(2500)
  for (let i = 0; i < 6; i++) { const c = await app.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale|Ahora no)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()"); if (!c) break; await app.esp(700) }
  await app.hasta("Boolean(document.querySelector('[data-hoy-siguiente]'))", { segundos: 40 })
  return app
}
const clic = (app, re) => app.evaluar(`(() => { const b = Array.from(document.querySelectorAll('button, a')).find((x) => ${re}.test((x.textContent || '').trim() + ' ' + (x.getAttribute('aria-label') || ''))); if (!b) return false; b.click(); return true })()`)
const fin = (app) => app.evaluar("(() => { const e = document.querySelector('[data-hoy]'); if (e) e.scrollTop = e.scrollHeight; return true })()")
// Roma (a pie, con paradas, historia y reto): H1, A1, A4, H3, H6, H8. Lanzarote (coche): H7.
{
  const app = await nueva('roma', '2026-10-17', 2000)
  try {
    await app.evaluar("document.querySelector('[data-hoy-ya-he-llegado]')?.click()")
    await app.esp(2000)
    await app.captura(SAL + '/app_H1.jpg')
  } finally { await app.cerrar() }
}
{
  const app = await nueva('roma', '2026-10-17')
  try {
    await app.evaluar("document.querySelector('[data-hoy-ya-he-llegado]')?.click()")
    await app.esp(1800)
    await app.captura(SAL + '/app_A1_roma.jpg')
    await app.evaluar("Array.from(document.querySelectorAll('[data-hoy-icono]')).find((b) => /Escuchar/i.test(b.getAttribute('aria-label') || ''))?.click()")
    await app.esp(2500)
    await app.captura(SAL + '/app_A4.jpg')
    await app.evaluar("document.querySelector('[data-escuchar-barra] button')?.click()")
  } finally { await app.cerrar() }
}
{
  const app = await nueva('roma', '2026-10-17')
  try {
    await app.evaluar("(() => { const e = document.querySelector('[data-hoy]'); const r = Array.from(document.querySelectorAll('*')).find((x) => x.children.length < 8 && /RETO DEL D/i.test(x.textContent || '') && (x.textContent || '').length < 200); r?.scrollIntoView({ block: 'center' }); return Boolean(r) })()")
    await app.esp(1200)
    await app.captura(SAL + '/app_H3.jpg')
    await app.evaluar("(() => { const e = document.querySelector('[data-hoy]'); if (e) e.scrollTop = 0; document.querySelector('[data-hoy-ya-he-llegado]')?.click(); return true })()")
    await app.esp(1500)
    await app.evaluar("document.querySelector('[data-hoy-saltar-parada]')?.click()")
    await app.esp(7500)
    await fin(app)
    await app.esp(800)
    await app.captura(SAL + '/app_H6.jpg')
    await clic(app, /Baños/)
    await app.esp(2500)
    await app.captura(SAL + '/app_H8.jpg')
  } finally { await app.cerrar() }
}
{
  const app = await nueva('lanzarote', '2026-11-09')
  try {
    await fin(app)
    await app.esp(800)
    await clic(app, /Gasolineras/)
    await app.esp(2500)
    await app.captura(SAL + '/app_H7.jpg')
  } finally { await app.cerrar() }
}
console.log('listo')
