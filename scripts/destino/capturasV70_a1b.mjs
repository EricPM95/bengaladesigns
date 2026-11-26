// V70 (apartado 1b): SOLO capturas (no es una prueba) en modo iPhone (390x844) del buscador de las hojas de la moneda y del país de Ajustes. Un solo Chrome por vez, que se cierra al acabar. Por la cola:
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/capturasV70_a1b.mjs
// Guarda docs/dias/V70_capturas/BUSCADOR_<caso>_app.jpg y escribe docs/dias/V70_log_a1b.json con lo que se lee de cada hoja.
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'

const CAP = path.resolve('docs/dias/V70_capturas')
fs.mkdirSync(CAP, { recursive: true })
const R = "(await import('/src/store/useRouteStore.ts')).useRouteStore"
const ANTES = fs.readFileSync('scripts/destino/pruebaV43.mjs', 'utf8').match(/const ANTES = `([\s\S]*?)`/)[1]
const RUTA = '/?cuentas=on&logros=off&apertura=0&hoy2=on&version=pago'
const SOLO = process.argv[2] ?? null

const a = await abrirApp(process.env.APP_URL ?? 'http://localhost:5173', { ruta: RUTA, antes: ANTES, ancho: 390, alto: 844 })
const ev = (e) => a.evaluar('(async () => (' + e + '))()')
const log = {}
const botones = () => a.evaluar("JSON.stringify([...document.querySelectorAll('button')].map((b) => (b.getAttribute('aria-label') || b.textContent || '').trim().slice(0, 40)).filter(Boolean).slice(0, 200))")
const clic = (texto) => a.evaluar(`(() => { const b = Array.from(document.querySelectorAll('button, [role=button]')).filter((x) => (x.getAttribute('aria-label') || x.textContent || '').trim().startsWith(${JSON.stringify(texto)})).sort((p, q) => (p.textContent || '').length - (q.textContent || '').length)[0]; if (!b) return false; b.click(); return true })()`)
const escribirBusqueda = async (texto) => {
  await a.evaluar(`(() => { const i = document.querySelector('[data-hoja-opciones] input'); const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set; set.call(i, ${JSON.stringify(texto)}); i.dispatchEvent(new Event('input', { bubbles: true })); return true })()`)
  await a.esp(600)
}
const hoja = () => a.evaluar("(document.querySelector('[data-hoja-opciones]') ?? document.body).innerText.replace(/\\s+/g, ' ').slice(0, 500)")
try {
  for (let i = 0; i < 80 && !(await a.evaluar("typeof window.__rutaPrueba === 'function'").catch(() => false)); i++) await a.esp(500)
  await a.evaluar('window.__rutaPrueba().then(() => true)')
  for (let i = 0; i < 300 && !(await ev(`${R}.getState().route ? true : false`).catch(() => false)); i++) await a.esp(1000)
  await a.esp(2500)
  for (let i = 0; i < 4; i++) {
    const h = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale|Cerrar)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
    if (!h) break
    await a.esp(600)
  }
  await ev(`${R}.getState().setMode('explore')`)
  await a.esp(1500)
  // Ajustes: el icono de la cuenta (arriba a la derecha) y «Ajustes».
  console.log('perfil', await a.evaluar("(() => { const b = document.querySelector('[aria-label*=\"Perfil\" i], [aria-label*=\"cuenta\" i], [data-perfil], header button:last-of-type'); if (!b) return false; b.click(); return true })()"))
  await a.esp(2000)
  console.log('botones', await botones())
  const toque = async (x, y) => { for (const t of ['mousePressed', 'mouseReleased']) await a.cdp('Input.dispatchMouseEvent', { type: t, x, y, button: 'left', clickCount: 1 }) }
  await ev("(await import('/src/store/useAjustesUi.ts')).useAjustesUi.getState().abrir()")
  await a.esp(2000)
  console.log('botones2', (await botones()).slice(900, 2400)); await a.captura(path.join(CAP, 'BUSCADOR_debug_app.jpg'))
  console.log('ajustes abierto', await a.evaluar("Boolean(document.querySelector('[data-ajustes-pantalla]'))"))
  console.log('moneda', await clic('Moneda'))
  await a.esp(1500)
  if (!SOLO || SOLO === 'moneda') {
    await a.captura(path.join(CAP, 'BUSCADOR_moneda_sin_escribir_app.jpg'))
    log.moneda_vacia = await hoja()
    await escribirBusqueda('Colombia')
    await a.captura(path.join(CAP, 'BUSCADOR_moneda_colombia_app.jpg'))
    log.moneda_colombia = await hoja()
    await escribirBusqueda('cop')
    log.moneda_cop = await hoja()
    await escribirBusqueda('zzzz')
    await a.captura(path.join(CAP, 'BUSCADOR_moneda_sin_resultados_app.jpg'))
    log.moneda_nada = await hoja()
    await a.evaluar("(() => { const b = document.querySelector('[data-hoja-cerrar]'); if (b) b.click(); return true })()")
    await a.esp(800)
    console.log('pais', await a.evaluar("(() => { const b = document.querySelector('[data-pais-vive]') ?? [...document.querySelectorAll('button')].find((x) => /País donde vives/.test(x.textContent || '')); if (!b) return false; b.click(); return true })()"))
    await a.esp(1500)
    await a.captura(path.join(CAP, 'BUSCADOR_pais_sin_escribir_app.jpg'))
    await escribirBusqueda('MEXICO')
    await a.captura(path.join(CAP, 'BUSCADOR_pais_mexico_app.jpg'))
    log.pais_mexico = await hoja()
    await escribirBusqueda('zzzz')
    log.pais_nada = await hoja()
    console.log(JSON.stringify(log, null, 1))
  }
  fs.writeFileSync('docs/dias/V70_log_a1b.json', JSON.stringify(log, null, 2))
} finally {
  a.cerrar()
}
process.exit(0)
