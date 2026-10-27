// Ayudante de pruebaRevisionRutas.mjs: abre la app (npm run dev) en un Chrome sin ventana, crea el viaje con la generación de la app, lo abre en DÍAS y lee lo que enseña la pantalla.
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

/** `opciones`: `ancho`/`alto` (por defecto 390 x 844), `ruta` (lo que va tras el origen, por defecto `/?cuentas=off`), `oscuro` (modo noche del sistema) y `antes` (un texto de JavaScript que se pone antes de que cargue la página). */
export async function abrirApp(baseIn = 'http://localhost:5173', opciones = {}) {
  // (Tanda 10M: la batería arranca su propio Vite y lo dice en APP_URL; así ninguna prueba depende de un Vite abierto desde hace horas.)
  const base = opciones.baseFija ? baseIn : process.env.APP_URL || baseIn
  const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((f) => fs.existsSync(f))
  if (!CHROME) throw new Error('No encuentro Chrome.')
  const puerto = 9300 + Math.floor(Math.random() * 600)
  const perfil = fs.mkdtempSync(path.join(os.tmpdir(), 'enLaApp-'))
  const chrome = spawn(CHROME, [`--remote-debugging-port=${puerto}`, `--user-data-dir=${perfil}`, '--headless=new', '--mute-audio', '--no-first-run', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', 'about:blank'], { stdio: 'ignore' })
  const esp = (ms) => new Promise((r) => setTimeout(r, ms))
  let url
  for (let i = 0; i < 80 && !url; i++) {
    try {
      url = (await (await fetch(`http://127.0.0.1:${puerto}/json/list`)).json()).find((x) => x.type === 'page')?.webSocketDebuggerUrl
    } catch {
      /* arrancando */
    }
    await esp(250)
  }
  const ws = new WebSocket(url)
  await new Promise((o) => (ws.onopen = o))
  let n = 0
  const pend = new Map()
  /** Las direcciones que ha pedido la página (para ver que el mapa no sale a internet). */
  const peticiones = []
  ws.onmessage = (m) => {
    const d = JSON.parse(m.data)
    if (d.method === 'Network.requestWillBeSent') peticiones.push(d.params.request.url)
    if (d.id && pend.has(d.id)) {
      pend.get(d.id)(d)
      pend.delete(d.id)
    }
  }
  const cdp = (method, params = {}) => new Promise((o) => {
    const id = ++n
    pend.set(id, o)
    ws.send(JSON.stringify({ id, method, params }))
  })
  const evaluar = async (js) => {
    const r = await cdp('Runtime.evaluate', { expression: js, awaitPromise: true, returnByValue: true })
    if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description ?? r.result.exceptionDetails.text)
    return r.result?.result?.value
  }
  await cdp('Page.enable')
  await cdp('Network.enable')
  await cdp('Emulation.setFocusEmulationEnabled', { enabled: true })
  await cdp('Runtime.enable')
  await cdp('Emulation.setDeviceMetricsOverride', { width: opciones.ancho ?? 390, height: opciones.alto ?? 844, deviceScaleFactor: opciones.escala ?? 1, mobile: (opciones.ancho ?? 390) < 700 })
  if (opciones.oscuro) await cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'dark' }] })
  if (opciones.antes) await cdp('Page.addScriptToEvaluateOnNewDocument', { source: opciones.antes })
  await cdp('Page.navigate', { url: `${base}${opciones.ruta ?? '/?cuentas=off'}` })
  for (let i = 0; i < 240; i++) {
    await esp(500)
    // (Tanda 10N4: una página que no es la app —una pieza de Design servida aparte— no tiene #root: se espera un rato fijo y se sigue.)
    if (opciones.sinEsperarRoot) {
      if (i >= (opciones.esperaFija ?? 8)) break
      continue
    }
    try {
      if (await evaluar("Boolean(document.getElementById('root') && document.getElementById('root').children.length > 0)")) break
    } catch {
      /* cargando */
    }
  }
  const cerrar = () => {
    try {
      chrome.kill()
    } catch {
      /* ya parado */
    }
    try {
      fs.rmSync(perfil, { recursive: true, force: true })
    } catch {
      /* Windows tarda en soltarlo */
    }
  }
  /** Una captura (JPG) del estado de ahora. */
  const captura = async (archivo, calidad = 80) => {
    const r = await cdp('Page.captureScreenshot', { format: 'jpeg', quality: calidad })
    fs.mkdirSync(path.dirname(archivo), { recursive: true })
    fs.writeFileSync(archivo, Buffer.from(r.result.data, 'base64'))
  }
  /** Escribe en el campo que cumple el selector (con el teclado de verdad, para que React se entere). */
  const escribir = async (selector, texto) => {
    await evaluar(`(() => { const e = document.querySelector(${JSON.stringify(selector)}); e.focus(); e.select?.(); return true })()`)
    await cdp('Input.insertText', { text: texto })
  }
  return { evaluar, esp, cerrar, cdp, captura, escribir, peticiones }
}
