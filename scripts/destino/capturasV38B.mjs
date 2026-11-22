// Capturas de la Fontana de Trevi con los tiempos de Roma (la luz estalla a los 8 s), para el REPASO de la V38B.
import { abrirApp } from './_enLaApp.mjs'
const APP = process.env.APP_URL ?? 'http://localhost:5173'
const MOCK = "const f = window.fetch.bind(window); window.fetch = (u, i) => String(u).includes('/api/admin/avisos-viajeros') ? Promise.resolve(new Response(JSON.stringify({ ok: true, nuevos: 0, avisos: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } })) : f(u, i);"
const a = await abrirApp(APP, { ruta: '/?cuentas=off&logros=on&logrosDemo=1&admin=sonidos&apertura=0', ancho: 1280, alto: 1000, sinEsperarRoot: true, esperaFija: 5, antes: MOCK })
const toque = async (sel) => {
  const r = JSON.parse(await a.evaluar(`(() => { const e = document.querySelector('${sel}'); e.scrollIntoView({ block: 'center' }); const b = e.getBoundingClientRect(); return JSON.stringify({ x: b.left + b.width / 2, y: b.top + b.height / 2 }) })()`))
  for (const type of ['mouseMoved', 'mousePressed', 'mouseReleased']) await a.cdp('Input.dispatchMouseEvent', { type, x: r.x, y: r.y, button: 'left', clickCount: 1 })
}
try {
  for (let i = 0; i < 80 && !(await a.evaluar("Boolean(document.querySelector('[data-visor-iframe]')?.contentWindow?.__estudioVisor?.listo)").catch(() => false)); i++) await a.esp(250)
  await toque('[data-animacion-tarjeta="emblema"]')
  await a.esp(800)
  await toque('[data-ver-escena="fontana_de_trevi"]')
  await a.esp(2500)
  for (const [s, n] of [[4.5, 'f1_baja'], [6.8, 'f2_brilla'], [7.7, 'f3_antes_del_estallido'], [8.4, 'f4_estalla'], [9.8, 'f5_emblema']]) {
    // Se detiene la escena y se lleva cada animación al segundo pedido (la misma línea de tiempo para todo): así el fotograma es exacto.
    await a.evaluar(`(() => { const w = document.querySelector('[data-visor-iframe]').contentWindow; for (const x of w.document.getAnimations()) { try { x.pause(); x.currentTime = ${s} * 1000 } catch {} } return true })()`)
    await a.esp(400)
    await a.evaluar("document.querySelector('[data-marco-iphone]').scrollIntoView({ block: 'center' }); true")
    await a.captura(`docs/dias/V38B_capturas/fontana_${n}.jpg`)
  }
} finally { a.cerrar() }
