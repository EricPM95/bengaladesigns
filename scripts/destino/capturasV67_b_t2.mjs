// V67 (apartado 3, T2): SOLO captura (no es una prueba) de DÍAS en Lanzarote (iPhone 390x844): el trayecto «En coche · 3 min · 1 km» en una línea con «+ Añadir parada».
//   APP_URL=http://localhost:5173 node scripts/destino/capturasV67_b_t2.mjs   (la API con DESTINOS_OCULTOS='-')
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'
const CAP = path.resolve('docs/dias/V67_capturas')
fs.mkdirSync(CAP, { recursive: true })
const R = "(await import('/src/store/useRouteStore.ts')).useRouteStore"
const ANTES = fs.readFileSync('scripts/destino/pruebaV43.mjs', 'utf8').match(/const ANTES = `([\s\S]*?)`/)[1]
const a = await abrirApp(process.env.APP_URL ?? 'http://localhost:5173', { ruta: '/?cuentas=off&logros=off&apertura=0&hoy2=on&version=completa', antes: ANTES, ancho: 390, alto: 844 })
const ev = (e) => a.evaluar('(async () => (' + e + '))()')
try {
  for (let i = 0; i < 80 && !(await a.evaluar("typeof window.__rutaLanzarote === 'function'").catch(() => false)); i++) await a.esp(500)
  await a.evaluar("window.__rutaLanzarote({ zona: 'costa_teguise', coche: 'alquiler', hoy: '2026-11-10' }).then(() => true)")
  for (let i = 0; i < 300 && !(await ev(`${R}.getState().route ? true : false`).catch(() => false)); i++) await a.esp(1000)
  await a.esp(3000)
  for (let i = 0; i < 4; i++) { const h = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale|Cerrar)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()"); if (!h) break; await a.esp(600) }
  const id = await ev(`${R}.getState().route.days.find((d) => d.dayNumber === 3).id`)
  await ev(`(${R}.getState().setMode('days'), ${R}.getState().setActiveDayId(${JSON.stringify(id)}), true)`)
  await a.esp(4000)
  const r = await a.evaluar(`(() => { const f = [...document.querySelectorAll('[data-trayecto-coche]')]; window.__dbg = f.map((x) => { const u = x.lastElementChild.getBoundingClientRect(); const e = x.getBoundingClientRect(); return [Math.round(e.left), Math.round(e.right), Math.round(u.left), Math.round(u.right), x.lastElementChild.tagName, x.parentElement.className.slice(0, 40)] }); f[1]?.scrollIntoView({ block: 'center' }); return JSON.stringify(f.map((x) => ({ forma: x.getAttribute('data-trayecto-forma'), texto: x.innerText.replace(/\s+/g, ' '), alto: Math.round(x.getBoundingClientRect().height), ancho: Math.round(x.getBoundingClientRect().width), sc: x.scrollWidth, cl: x.clientWidth }))) })()`)
  console.log(r); console.log(JSON.stringify(await a.evaluar('window.__dbg')))
  await a.esp(800)
  await a.captura(path.join(CAP, 'T2_despues.jpg'))
} finally { a.cerrar() }
process.exit(0)
