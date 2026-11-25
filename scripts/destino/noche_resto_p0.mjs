// NOCHE (24-25 nov) · agente RESTO · punto 0: SOLO capturas del cuadrado de la fecha en DÍAS y en las hojas de elegir día. Por la cola:
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/noche_resto_p0.mjs
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'

const CAP = path.resolve('docs/dias/NOCHE_RESTO_capturas')
fs.mkdirSync(CAP, { recursive: true })
const png = (n) => path.join(CAP, `${n}.jpg`)
const R = "(await import('/src/store/useRouteStore.ts')).useRouteStore"
const ANTES = fs.readFileSync('scripts/destino/pruebaV43.mjs', 'utf8').match(/const ANTES = `([\s\S]*?)`/)[1]

const a = await abrirApp(process.env.APP_URL ?? 'http://localhost:5173', { ruta: '/?cuentas=off&logros=on&logrosDemo=1&apertura=0&hoy2=on&version=pago', antes: ANTES, ancho: 375, alto: 812 })
const ev = (e) => a.evaluar('(async () => (' + e + '))()')
try {
  for (let i = 0; i < 80 && !(await a.evaluar("typeof window.__rutaPrueba === 'function'").catch(() => false)); i++) await a.esp(500)
  await a.evaluar('window.__rutaPrueba().then(() => true)')
  for (let i = 0; i < 240 && !(await ev(`${R}.getState().route ? true : false`).catch(() => false)); i++) await a.esp(1000)
  await a.esp(2500)
  for (let i = 0; i < 4; i++) {
    const h = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale|Cerrar)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
    if (!h) break
    await a.esp(600)
  }
  await ev(`${R}.getState().setMode('days')`)
  await a.esp(2500)
  const dias = await a.evaluar("Array.from(document.querySelectorAll('[data-day-id]')).length")
  console.log('días en la lista', dias)
  // un día abierto
  await a.evaluar("(() => { const d = document.querySelectorAll('[data-day-id]')[1]; d?.querySelector('[role=button]')?.click(); return true })()")
  await a.esp(1500)
  await a.evaluar("(() => { document.querySelectorAll('[data-day-id]')[0]?.scrollIntoView({ block: 'start' }); return true })()")
  await a.esp(600)
  console.log('cuadrados', await a.evaluar("JSON.stringify(Array.from(document.querySelectorAll('[data-cuadrado-fecha]')).map((e) => e.getAttribute('data-cuadrado-fecha') + ':' + e.textContent))"))
  await a.captura(png('dias_cuadrados_despues'))
} finally {
  a.cerrar()
}
