// Ayudante de pruebaRevisionRutas.mjs: abre la app (npm run dev) en un Chrome sin ventana, crea el viaje con la generación de la app, lo abre en DÍAS y lee lo que enseña la pantalla.
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

export async function abrirApp(base = 'http://localhost:5173') {
  const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((f) => fs.existsSync(f))
  if (!CHROME) throw new Error('No encuentro Chrome.')
  const puerto = 9300 + Math.floor(Math.random() * 600)
  const perfil = fs.mkdtempSync(path.join(os.tmpdir(), 'enLaApp-'))
  const chrome = spawn(CHROME, [`--remote-debugging-port=${puerto}`, `--user-data-dir=${perfil}`, '--headless=new', '--no-first-run', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', 'about:blank'], { stdio: 'ignore' })
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
  ws.onmessage = (m) => {
    const d = JSON.parse(m.data)
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
  await cdp('Runtime.enable')
  await cdp('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true })
  await cdp('Page.navigate', { url: `${base}/?cuentas=off` })
  for (let i = 0; i < 240; i++) {
    await esp(500)
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
  return { evaluar, esp, cerrar }
}
