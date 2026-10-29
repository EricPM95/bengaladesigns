// Tanda 10N5 §6d · «Añadir gasto» en la app de verdad (Chrome sin ventana): capturas docs/dias/capturas_jutrip/10n5_gastos_hoja_ana.jpg y, al lado, la pieza de Design.
//   APP_URL=http://localhost:5184 API_URL=http://localhost:8854 node scripts/destino/pruebaTanda10N5_gastos_enLaApp.mjs
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'
import { capturarDesign } from './capturaDesign.mjs'

const APP = process.env.APP_URL ?? 'http://localhost:5173'
const fallos = []
let comprobaciones = 0
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) fallos.push({ regla, texto })
}
const SALIDA = path.resolve('docs/dias/capturas_jutrip')
fs.mkdirSync(SALIDA, { recursive: true })

const a = await abrirApp(APP, { ruta: '/?cuentas=off&logros=on&logrosDemo=1&version=pago&apertura=0' })
const ev = (js) => a.evaluar(js)
try {
  for (let i = 0; i < 360 && !(await ev("typeof window.__rutaPrueba === 'function'").catch(() => false)); i++) await a.esp(500)
  await ev('window.__rutaPrueba().then(() => true)')
  for (let i = 0; i < 90 && !(await ev("window.__ruta?.getState().route != null").catch(() => false)); i++) await a.esp(1000)
  await a.esp(3000)
  for (let i = 0; i < 6; i++) {
    const h = await ev("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale|Cerrar)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
    if (!h) break
    await a.esp(600)
  }
  await ev("import('/src/dev/gastosFalsos.ts').then(() => true)").catch(() => false)
  await ev("window.__gastosFalsos.reiniciar(); window.__modoCuentas?.poner('cada_uno'); window.__gastosFalsos.usar('ana', ['eric', 'ana', 'luis']).then(() => true)")
  await a.esp(900)
  await ev("(() => { const b = Array.from(document.querySelectorAll('[data-cartera]')).find((x) => x.offsetParent !== null) ?? document.querySelector('[data-cartera]'); b?.click(); return true })()")
  await a.esp(1200)
  // (10N10 §5b y §6) Las cuentas están en la pestaña común; Ana solo recomienda: «Enviar a Eric».
  await ev("document.querySelector('[data-pestana-cuenta=\"comun\"]')?.click(); true")
  await a.esp(500)
  await ev("document.querySelector('[data-anadir-gasto]')?.scrollIntoView({block:'center'}); document.querySelector('[data-anadir-gasto]')?.click(); true")
  await a.esp(1000)
  await a.escribir('[data-gasto-nombre]', 'Taxi')
  await a.escribir('input[aria-label="¿Cuánto ha costado en total?"]', '25')
  await a.esp(500)
  const t = await ev("(document.querySelector('[aria-labelledby=\"hoja-anadir-gasto\"]')?.innerText ?? 'SIN HOJA; botones: ' + document.querySelectorAll('[data-anadir-gasto]').length).replace(/\\s+/g, ' ')")
  debe(/Añadir a la cuenta del grupo/.test(t) && /¿Quién lo ha pagado?/.test(t) && !/¿Para quién es?/.test(t), '6', `la hoja dice «Añadir a la cuenta del grupo» y «¿Quién lo ha pagado?», sin «¿Para quién es?» (${t.slice(0, 120)})`)
  const pagan = await ev("Array.from(document.querySelectorAll('[data-personas-cuadradas=\"pagado\"] [data-persona-cuadrada]')).map((p) => p.getAttribute('data-persona-cuadrada') + ':' + p.getAttribute('data-elegida')).join()")
  debe(/^ana:1/.test(pagan) && (pagan.match(/:1/g) ?? []).length === 1, '6d-2', `en cuadrados, quien añade va primero y es el único marcado (${pagan})`)
  debe(/Se lo enviamos a Eric/.test(t) && /Enviar a Eric/.test(t), '6', 'quien solo recomienda: «Se lo enviamos a Eric» y el botón «Enviar a Eric» (' + t.slice(0, 400) + ')')
  await a.captura(path.join(SALIDA, '10n5_gastos_hoja_ana.jpg'))
  const sep = await ev("(() => { const q = document.querySelector('[data-quien-lo-ha-pagado]'); const e = document.querySelector('[data-linea-destino]'); return Math.round(e.getBoundingClientRect().top - q.getBoundingClientRect().bottom) })()")
  debe(sep >= 18, '6d-4', `entre «¿Quién lo ha pagado?» y la línea de abajo hay ${sep} px de aire`)
} finally {
  a.cerrar()
}
await capturarDesign('Piezas/Presupuesto Compartido.dc.html', path.join(SALIDA, '10n5_design_gastos_hoja.jpg'), { despues: "(() => { const e = Array.from(document.querySelectorAll('span')).find((s) => /^03 ·/.test(s.textContent || '')); e?.scrollIntoView({ block: 'start' }); return true })()" }).catch((e) => console.log('  (sin captura de Design)', e.message))

console.log(`\n${comprobaciones} comprobaciones, ${fallos.length} fallos`)
for (const f of fallos) console.log('  ✗', f.regla, '·', f.texto)
process.exit(fallos.length ? 1 : 0)
