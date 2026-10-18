// Saca las capturas de las pantallas de las cuentas, parte 3 (A1 a A4, I1, I2, P1 a P9, RS, R, RW, RM, RV, R2, AV…) con un Chrome sin ventana, a tamaño de móvil (390 x 844). Cada captura sale de SU escaparate (src/dev/escaparate.ts):
//   node scripts/destino/capturasCuentas3.mjs A1 P6 R2a                 (los escaparates por su nombre del diseño; en la app llevan delante c3-)
//   node scripts/destino/capturasCuentas3.mjs --todas                  (todos los que haya)
//   opciones: --url=http://localhost:5173   --salida=docs/dias/capturas_cuentas3   --dpr=2
// Hace falta el servidor de desarrollo (npm run dev). No usa el panel del navegador de la app: cada ejecución lleva su propio Chrome, su propio perfil y su propio puerto, así que
// dos personas sacando capturas a la vez NO se pisan (el panel comparte la carpeta y mezclaba las capturas).
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const args = process.argv.slice(2)
const opcion = (n, def) => args.find((a) => a.startsWith(`--${n}=`))?.split('=').slice(1).join('=') ?? def
const base = opcion('url', 'http://localhost:5173')
const salida = opcion('salida', 'docs/dias/capturas_cuentas3')
const dpr = Number(opcion('dpr', '2'))
const ids = args.filter((a) => !a.startsWith('--')).map((a) => (a.startsWith("c3-") ? a : "c3-" + a))
const todas = args.includes('--todas')
const prefijo = 'c3-'
const extra = opcion('params', '')
const nombreDe = (id) => id.replace(/^c3-/, '')

const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find((f) => fs.existsSync(f))
if (!CHROME) throw new Error('No encuentro Chrome ni Edge.')
fs.mkdirSync(salida, { recursive: true })

const puerto = 9300 + Math.floor(Math.random() * 600)
const perfil = fs.mkdtempSync(path.join(os.tmpdir(), 'capturasCuentas3-'))
const chrome = spawn(CHROME, [`--remote-debugging-port=${puerto}`, `--user-data-dir=${perfil}`, '--headless=new', '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', 'about:blank'], { stdio: 'ignore' })
const parar = () => {
  try {
    chrome.kill()
  } catch {
    /* ya parado */
  }
  try {
    fs.rmSync(perfil, { recursive: true, force: true })
  } catch {
    /* en Windows puede tardar en soltarse */
  }
}
process.on('exit', parar)

const espera = (ms) => new Promise((r) => setTimeout(r, ms))
async function conectar() {
  for (let i = 0; i < 80; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${puerto}/json/list`)
      const pestanas = await r.json()
      const p = pestanas.find((x) => x.type === 'page')
      if (p) return p.webSocketDebuggerUrl
    } catch {
      /* aún arrancando */
    }
    await espera(250)
  }
  throw new Error('Chrome no ha arrancado.')
}

const ws = new WebSocket(await conectar())
await new Promise((ok, no) => {
  ws.onopen = ok
  ws.onerror = no
})
let n = 0
const pendientes = new Map()
const consola = []
ws.onmessage = (m) => {
  const d = JSON.parse(m.data)
  if (d.id && pendientes.has(d.id)) {
    const { ok, no } = pendientes.get(d.id)
    pendientes.delete(d.id)
    d.error ? no(new Error(d.error.message)) : ok(d.result)
  } else if (d.method === 'Runtime.exceptionThrown') consola.push(d.params.exceptionDetails.exception?.description ?? d.params.exceptionDetails.text)
  else if (d.method === 'Runtime.consoleAPICalled' && d.params.type === 'error') consola.push(d.params.args.map((a) => a.value ?? a.description ?? '').join(' '))
}
const cdp = (metodo, params = {}) =>
  new Promise((ok, no) => {
    const id = ++n
    pendientes.set(id, { ok, no })
    ws.send(JSON.stringify({ id, method: metodo, params }))
  })
const evaluar = async (js) => {
  const r = await cdp('Runtime.evaluate', { expression: js, awaitPromise: true, returnByValue: true })
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text)
  return r.result.value
}

await cdp('Page.enable')
await cdp('Runtime.enable')
const fotografiar = async (nombre) => {
  const r = await cdp('Page.captureScreenshot', { format: 'jpeg', quality: 78 })
  fs.writeFileSync(path.join(salida, `${nombre}.jpg`), Buffer.from(r.data, 'base64'))
  console.log(`   ✓ ${nombre}.jpg`)
}

async function paginaNueva(id, reducir) {
  await cdp('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: dpr, mobile: true })
  await cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: reducir ? 'reduce' : 'no-preference' }] })
  await cdp('Page.navigate', { url: `${base}/?logrosDemo=1&logros=on&escaparate=${encodeURIComponent(id)}${extra ? "&" + extra : ""}` })
  for (let i = 0; i < 1200; i++) {
    await espera(250)
    try {
      if (await evaluar('Boolean(window.__escaparate)')) return
    } catch {
      /* la página aún carga */
    }
  }
  throw new Error('La app no ha cargado (¿está encendido `npm run dev`?).')
}

let lista = ids
if (todas || lista.length === 0) {
  await paginaNueva('', false)
  lista = (await evaluar('window.__escaparate.ids()')).filter((x) => x.startsWith(prefijo))
}
let fallos = 0
const errores = []
for (const id of lista) {
  console.log(`· ${id}`)
  // Los demás ayudantes editan a la vez y Vite recarga la página: si pasa a mitad de una captura, se repite (hasta 4 veces).
  for (let intento = 1; intento <= 4; intento++) {
  try {
    await paginaNueva(id, false)
    const info = await evaluar(`window.__escaparate.info(${JSON.stringify(id)})`)
    if (!info) throw new Error('no existe ese escaparate')
    if (info.reducirMovimiento) await paginaNueva(id, true)
    consola.length = 0
    await evaluar(`window.__escaparate.abrir(${JSON.stringify(id)})`)
    const t0 = Date.now()
    const nombres = info.capturas.length === 1 ? [nombreDe(id)] : info.capturas.map((_, i) => `${nombreDe(id)}-${i + 1}-${['principio', 'mitad', 'final'][Math.min(i, 2)] ?? 'f' + (i + 1)}`)
    for (let i = 0; i < info.capturas.length; i++) {
      const falta = info.capturas[i] - (Date.now() - t0)
      if (falta > 0) await espera(falta)
      await fotografiar(nombres[i])
    }
    // Los fallos de siempre del entorno sin servidor (Mapbox, Supabase sin claves, el mapa 404) no cuentan; todo lo demás sí.
    const mios = consola.filter((c) => !/mapbox|supabase|404|400|Failed to load resource|net::ERR|api\//i.test(c))
    if (mios.length) errores.push(`${id}: ${mios.slice(0, 3).join(' | ')}`)
    break
  } catch (e) {
    if (intento < 4 && /navigated or closed|Execution context|Target closed/.test(e.message)) {
      console.log(`   (la página se recargó; otra vez)`)
      continue
    }
    fallos++
    console.log(`   ✗ ${id}: ${e.message}`)
    break
  }
  }
}
if (errores.length) console.log('\nErrores de consola:\n' + errores.join('\n'))
else console.log('\nSin errores de consola.')
ws.close()
parar()
process.exit(fallos ? 1 : 0)
