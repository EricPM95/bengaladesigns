// V69 (apartado 1b, todas las hojas de propuesta): SOLO capturas (no es una prueba), modo iPhone 390x844, un Chrome que se cierra al acabar.
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/capturasV69_b1.mjs <viento|nubes|lluvia>
// Lanzarote (domingo 8 de noviembre, HOY), el aviso del tiempo → [Ver cambio] → la hoja de propuesta. Hace falta la API con `DESTINOS_OCULTOS='-'` (Lanzarote está oculto).
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'

const CAP = path.resolve('docs/dias/V69_capturas')
fs.mkdirSync(CAP, { recursive: true })
const QUE = process.argv[2] ?? 'viento'
const por = (fn) => Array.from({ length: 24 }, (_, h) => fn(h))
const SECO = { probability: por(() => 0), precipitation: por(() => 0), cloud: por(() => 10), gust: por(() => 15) }
const METEO = { viento: { gust: por((h) => (h >= 15 ? 70 : 20)) }, nubes: { cloud: por((h) => (h >= 9 ? 95 : 10)) }, lluvia: { probability: por((h) => (h >= 14 && h <= 19 ? 90 : 0)), precipitation: por((h) => (h >= 14 && h <= 19 ? 1.2 : 0)) } }[QUE]
const a = await abrirApp(process.env.APP_URL ?? 'http://localhost:5173', { ruta: '/?cuentas=off&logros=off&apertura=0&version=completa&hoy2=on', ancho: 390, alto: 844 })
const ev = (js) => a.evaluar(js)
try {
  await a.hasta("typeof window.__rutaLanzarote === 'function'", { segundos: 240, lanzar: 'no está la ruta de prueba' })
  await ev("(() => { for (const k of Object.keys(localStorage)) if (k.startsWith('trazo:hoy')) localStorage.removeItem(k); return true })()")
  await ev(`window.__hoy1Tiempo = ${JSON.stringify(SECO)}; window.__hoy1HoraLocal = 11; true`)
  await ev("window.__rutaLanzarote({ zona: 'costa_teguise', coche: 'alquiler', hoy: '2026-11-08' }).then(() => true)")
  await a.esp(2500)
  await ev("(async () => { const R = await import('/src/store/useRouteStore.ts'); R.useRouteStore.setState({ dev_simulated_today_iso: '2026-11-08' }); R.useRouteStore.getState().setMode('today'); return true })()")
  await a.hasta("Boolean(document.querySelector('[data-hoy]'))", { segundos: 40, lanzar: 'no sale HOY' })
  await a.esp(1800)
  await ev(`window.__hoy1HoraLocal = 11; window.__hoy1Tiempo = ${JSON.stringify({ ...SECO, ...METEO })}; window.dispatchEvent(new Event('hoy1-tiempo')); true`)
  await a.esp(900)
  await ev("(() => { document.querySelector('[data-hoy-aviso-mas]')?.click(); return true })()")
  await a.esp(400)
  console.log('aviso:', await ev("(document.querySelector('[data-aviso-tiempo]')?.innerText ?? 'SIN AVISO').split(String.fromCharCode(10)).join(' | ')"))
  await ev("(() => { document.querySelector('[data-ver-alternativa]')?.click(); return true })()")
  await a.esp(2500)
  console.log('hoja:', await ev("(document.querySelector('[data-cambiar-hoja=propuesta]')?.innerText ?? 'SIN HOJA').split(String.fromCharCode(10)).join(' | ')"))
  console.log('fotos:', await ev("Array.from(document.querySelectorAll('[data-tarjeta-del-sitio]')).map((e) => e.querySelector('img') ? 'foto' : (e.getAttribute('data-tarjeta-comida') ? 'comida' : 'SIN FOTO')).join(', ')"))
  console.log('imgs:', await ev("Array.from(document.querySelectorAll('[data-tarjeta-del-sitio] img')).map((i) => i.getAttribute('src') + ' ok=' + i.complete + '/' + i.naturalWidth + ' disp=' + i.style.display).join(' || ')"))
  await a.captura(path.join(CAP, `b1_${QUE}_lanzarote.jpg`))
} finally {
  a.cerrar()
}
