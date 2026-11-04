// Mira rápida de la HOY1 (agente B): abre HOY en Lanzarote o Roma y saca una captura. Un Chrome por la cola.
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/_hoy1_B_vista.mjs destino=lanzarote hoy=2026-11-09 salida=docs/dias/capturas_jutrip/hoy1_x.jpg
import path from 'node:path'
const arg = (k, d) => process.argv.find((a) => a.startsWith(k + '='))?.slice(k.length + 1) ?? d
const { abrirApp } = await import('./_enLaApp.mjs')
const APP = process.env.APP_URL ?? 'http://localhost:5173'
const destino = arg('destino', 'lanzarote')
const hoy = arg('hoy', '2026-11-09')
const ruta = arg('ruta', '/?cuentas=off&logros=off&apertura=0&version=completa&hoy2=on')
const a = await abrirApp(APP, { ruta, ancho: 390, alto: 844 })
try {
  const ev = (js) => a.evaluar(js)
  const fn = destino === 'lanzarote' ? '__rutaLanzarote' : '__rutaPrueba'
  for (let i = 0; i < 360 && !(await ev(`typeof window.${fn} === 'function'`).catch(() => false)); i++) await a.esp(500)
  await ev(destino === 'lanzarote' ? `window.__rutaLanzarote({ zona: 'costa_teguise', coche: 'alquiler', hoy: '${hoy}' }).then(() => true)` : `Promise.resolve(window.__rutaPrueba()).then(() => true)`)
  await a.esp(3000)
  await ev(`(async () => { const R = await import('/src/store/useRouteStore.ts'); R.useRouteStore.setState({ dev_simulated_today_iso: '${hoy}' }); R.useRouteStore.getState().setMode('today'); return true })()`)
  await a.esp(3500)
  const extra = arg('js', '')
  if (extra) {
    await ev(extra)
    await a.esp(1500)
  }
  await a.captura(path.resolve(arg('salida', 'docs/dias/capturas_jutrip/hoy1_vista.jpg')))
  console.log(await ev("document.querySelector('[data-hoy]')?.getAttribute('data-hoy') + ' | botones: ' + [...document.querySelectorAll('[data-camara-viaje]')].map((e) => e.getAttribute('data-camara-viaje')).join(',')"))
} finally {
  await a.cerrar()
}
