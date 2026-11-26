// V63 (cosas 9 y 11): SOLO capturas (no es una prueba) en modo iPhone (390x844). Un solo Chrome, que se cierra al acabar.
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/capturasV63_b.mjs roma|lanza <nombre> [dia]
// Guarda docs/dias/catalogo/_tmp/<nombre>.jpg: la pestaña DÍAS del día pedido (por defecto el 2) y escribe el texto de las tarjetas.
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'

const CAP = path.resolve('docs/dias/catalogo/_tmp')
fs.mkdirSync(CAP, { recursive: true })
const MODO = process.argv[2] ?? 'roma'
const NOMBRE = process.argv[3] ?? `dias_${MODO}`
const DIA = Number(process.argv[4] ?? 2)
const lanza = MODO === 'lanza'
const R = "(await import('/src/store/useRouteStore.ts')).useRouteStore"
const a = await abrirApp(process.env.APP_URL ?? 'http://localhost:5173', { ruta: '/?cuentas=off&logros=off&apertura=0&hoy2=on&version=pago', ancho: 390, alto: 844 })
const ev = (e) => a.evaluar('(async () => (' + e + '))()')
try {
  for (let i = 0; i < 80 && !(await a.evaluar(`typeof window.${lanza ? '__rutaLanzarote' : '__rutaPrueba'} === 'function'`).catch(() => false)); i++) await a.esp(500)
  await a.evaluar(lanza ? "window.__rutaLanzarote({ zona: 'costa_teguise', coche: 'alquiler', hoy: '2026-11-08' }).then(() => true)" : 'window.__rutaPrueba().then(() => true)')
  for (let i = 0; i < 300 && !(await ev(`${R}.getState().route ? true : false`).catch(() => false)); i++) await a.esp(1000)
  await a.esp(2500)
  for (let i = 0; i < 4; i++) {
    const h = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale|Cerrar)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
    if (!h) break
    await a.esp(600)
  }
  await ev(`(${R}.getState().setMode('days'), ${R}.getState().setActiveDayId(${R}.getState().route.days.find((d) => d.dayNumber === ${DIA}).id), true)`)
  await a.esp(5000)
  // Se lleva la lista a las primeras tarjetas de parada (para que se vean varias con su línea de tiempo y horario).
  await a.evaluar("(() => { const t = document.querySelectorAll('[data-stop-id]'); const e = t[Math.min(2, t.length - 1)]; if (e) e.scrollIntoView({ block: 'start' }); return t.length })()")
  await a.esp(1500)
  await a.captura(path.join(CAP, `${NOMBRE}.jpg`))
  const texto = await a.evaluar("document.body.innerText.replace(/\s+/g, ' ').slice(0, 2500)")
  console.log(texto)
} finally {
  await a.cerrar()
}
