// V67 (apartado 3, P2/P3): SOLO capturas (no es una prueba) en iPhone 390x844 de RUTA (la tarjeta del viaje y su fila de botones) y del Perfil (la tarjeta del viaje con foto).
//   APP_URL=http://localhost:5173 node scripts/destino/capturasV67_b_ruta.mjs <etiqueta: antes|despues> [lanza|roma]   (Lanzarote: la API con DESTINOS_OCULTOS='-')
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'
const CAP = path.resolve('docs/dias/V67_capturas')
fs.mkdirSync(CAP, { recursive: true })
const ETIQ = process.argv[2] ?? 'antes'
const LANZA = (process.argv[3] ?? 'lanza') === 'lanza'
const R = "(await import('/src/store/useRouteStore.ts')).useRouteStore"
const ANTES = fs.readFileSync('scripts/destino/pruebaV43.mjs', 'utf8').match(/const ANTES = `([\s\S]*?)`/)[1]
const a = await abrirApp(process.env.APP_URL ?? 'http://localhost:5173', { ruta: '/?cuentas=off&logros=off&apertura=0&hoy2=on&version=completa', antes: ANTES, ancho: 390, alto: 844 })
const ev = (e) => a.evaluar('(async () => (' + e + '))()')
try {
  const f = LANZA ? '__rutaLanzarote' : '__rutaPrueba'
  for (let i = 0; i < 80 && !(await a.evaluar(`typeof window.${f} === 'function'`).catch(() => false)); i++) await a.esp(500)
  await a.evaluar(LANZA ? "window.__rutaLanzarote({ zona: 'costa_teguise', coche: 'alquiler', hoy: '2026-11-10' }).then(() => true)" : 'window.__rutaPrueba().then(() => true)')
  for (let i = 0; i < 300 && !(await ev(`${R}.getState().route ? true : false`).catch(() => false)); i++) await a.esp(1000)
  await a.esp(3000)
  for (let i = 0; i < 4; i++) { const h = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale|Cerrar)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()"); if (!h) break; await a.esp(600) }
  await ev(`${R}.getState().setMode('route')`)
  await a.esp(4000)
  await a.captura(path.join(CAP, `P2_${ETIQ}.jpg`))
  const info = await a.evaluar(`(() => { const filas = [...document.querySelectorAll('button')].filter((b) => { const r = b.getBoundingClientRect(); return r.right > 380 || r.left < 0 }).map((b) => (b.getAttribute('aria-label') || b.textContent || '').trim().slice(0, 30) + '@' + Math.round(b.getBoundingClientRect().left) + '-' + Math.round(b.getBoundingClientRect().right)); return JSON.stringify({ ancho: document.documentElement.scrollWidth, cortados: filas }) })()`)
  console.log('P2', info)
} finally { a.cerrar() }
process.exit(0)
