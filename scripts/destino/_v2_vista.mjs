// Una captura de HOY (V2) de un viaje de pruebas: Roma a pie (`destino=roma`) o Lanzarote en coche (`destino=lanzarote`).
//   APP_URL=http://localhost:5199 node scripts/destino/_conCola.mjs node scripts/destino/_v2_vista.mjs destino=roma hoy=2026-10-17 salida=docs/dias/capturas_v2/x.jpg [aqui=1] [alto=844] [js="..."] [scroll=800]
// `aqui=1`: pone la ubicación de mentira en la coordenada de la siguiente parada (sale «YA ESTÁS AQUÍ»).
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'

const arg = (k, d) => process.argv.find((a) => a.startsWith(k + '='))?.slice(k.length + 1) ?? d
const destino = arg('destino', 'roma')
const hoy = arg('hoy', destino === 'roma' ? '2026-10-17' : '2026-11-09')
const ruta = arg('ruta', '/?cuentas=on&logros=on&logrosDemo=1&apertura=0&version=completa&hoy2=on')
const a = await abrirApp(process.env.APP_URL || 'http://localhost:5199', { ruta, ancho: 390, alto: Number(arg('alto', '844')) })
try {
  const ev = (js) => a.evaluar(js)
  const fn = destino === 'lanzarote' ? '__rutaLanzarote' : '__rutaPrueba'
  for (let i = 0; i < 360 && !(await ev(`typeof window.${fn} === 'function'`).catch(() => false)); i++) await a.esp(500)
  await ev(destino === 'lanzarote' ? `window.__rutaLanzarote({ zona: 'costa_teguise', coche: 'alquiler', hoy: '${hoy}' }).then(() => true)` : `Promise.resolve(window.__rutaPrueba()).then(() => true)`)
  await a.esp(3000)
  await ev(`(async () => { const R = await import('/src/store/useRouteStore.ts'); R.useRouteStore.setState({ dev_simulated_today_iso: '${hoy}' }); R.useRouteStore.getState().setMode('today'); return true })()`)
  await a.esp(2500)
  for (let i = 0; i < 6; i++) {
    const cerrado = await ev("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale|Ahora no)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
    if (!cerrado) break
    await a.esp(700)
  }
  if (arg('aqui', '') === '1') {
    await ev(`(async () => { const R = await import('/src/store/useRouteStore.ts'); const T = await import('/src/lib/todayMode.ts'); const r = R.useRouteStore.getState().route; const h = T.getTodayTripContext(r, '${hoy}'); const s = T.resolveRealStops(h.day).find((x) => !x.checkedInAt && !x.saltada && x.coordinates && (x.coordinates.lat || x.coordinates[0])); const c = s.coordinates; window.__hoy1Ubicacion = { lat: c.lat ?? c[0], lng: c.lng ?? c[1] }; window.dispatchEvent(new Event('trazo:hoy1-repreguntar')); return true })()`)
    await a.esp(3500)
  }
  const extra = arg('js', '')
  if (extra) {
    await ev(extra)
    await a.esp(1500)
  }
  const sc = Number(arg('scroll', '0'))
  if (sc) {
    await ev(`(() => { const e = document.querySelector('[data-hoy]'); if (e) e.scrollTop = ${sc}; return true })()`)
    await a.esp(800)
  }
  await a.captura(path.resolve(arg('salida', 'docs/dias/capturas_v2/vista.jpg')))
  if (arg('texto', '') === '1') console.log((await ev("document.querySelector('[data-hoy]')?.innerText ?? document.body.innerText")).slice(0, 2500))
} finally {
  await a.cerrar()
}
