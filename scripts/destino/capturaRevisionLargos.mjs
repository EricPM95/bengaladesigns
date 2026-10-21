// Abre docs/dias/RUTAS_REVISION_LARGOS.html en un Chrome sin ventana (escritorio y móvil), comprueba que carga, que los selectores, las marcas y «siguiente» funcionan y saca dos capturas.
//   node scripts/destino/capturaRevisionLargos.mjs
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((f) => fs.existsSync(f))
if (!CHROME) throw new Error('No encuentro Chrome.')
const puerto = 9300 + Math.floor(Math.random() * 600)
const perfil = fs.mkdtempSync(path.join(os.tmpdir(), 'capRev-'))
const chrome = spawn(CHROME, [`--remote-debugging-port=${puerto}`, `--user-data-dir=${perfil}`, '--headless=new', '--no-first-run', 'about:blank'], { stdio: 'ignore' })
const esp = (ms) => new Promise((r) => setTimeout(r, ms))
let url
for (let i = 0; i < 60 && !url; i++) {
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
const errs = []
ws.onmessage = (m) => {
  const d = JSON.parse(m.data)
  if (d.id && pend.has(d.id)) {
    pend.get(d.id)(d.result ?? d.error)
    pend.delete(d.id)
  } else if (d.method === 'Runtime.exceptionThrown') errs.push(d.params.exceptionDetails.exception?.description ?? d.params.exceptionDetails.text)
  else if (d.method === 'Runtime.consoleAPICalled' && d.params.type === 'error') errs.push('console: ' + d.params.args.map((a) => a.value ?? a.description).join(' '))
}
const cdp = (method, params = {}) => new Promise((o) => {
  const id = ++n
  pend.set(id, o)
  ws.send(JSON.stringify({ id, method, params }))
})
const ev = async (js) => (await cdp('Runtime.evaluate', { expression: js, awaitPromise: true, returnByValue: true })).result?.value
await cdp('Page.enable')
await cdp('Runtime.enable')
const archivo = 'file:///' + path.resolve('docs/dias/RUTAS_REVISION_LARGOS.html').split(path.sep).join('/')
const abrir = async (w, h, hash) => {
  await cdp('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: w < 700 })
  await cdp('Page.navigate', { url: 'about:blank' })
  await esp(300)
  await cdp('Page.navigate', { url: archivo + hash })
  await esp(1800)
}
const carpeta = path.resolve('docs/dias/capturas_revision_rutas')
fs.mkdirSync(carpeta, { recursive: true })
const foto = async (nombre) => {
  const r = await cdp('Page.captureScreenshot', { format: 'jpeg', quality: 70 })
  fs.writeFileSync(path.join(carpeta, nombre), Buffer.from(r.data, 'base64'))
  console.log('captura', nombre)
}
let fallos = 0
const debe = (c, t) => {
  console.log(`  ${c ? '✓' : '✗'} ${t}`)
  if (!c) fallos++
}
await abrir(1280, 900, '')
debe((await ev("document.querySelectorAll('.dia').length")) === 5, 'por defecto 5 días, día 4 en Roma, combinación A, lunes: 5 tarjetas de día')
debe((await ev("document.querySelectorAll('.chip').length")) === 6, 'los 5 tipos de marca y «siguiente marca» están arriba')
debe((await ev("Array.from(document.querySelectorAll('#dias option')).map((o) => o.value).join()")) === '4,5,6', 'el selector de días: 4, 5 y 6')
debe((await ev("Array.from(document.querySelectorAll('#dia4 option')).map((o) => o.value).join()")) === 'roma,excursion', 'el selector «Día 4»: Roma y Excursión')
debe((await ev("document.querySelectorAll('.parada').length")) > 50, 'las paradas salen en orden, una tras otra')
await foto('largos_escritorio.jpg')
await ev("document.getElementById('dias').value='4';document.getElementById('dias').onchange()")
await esp(300)
debe((await ev("Array.from(document.querySelectorAll('#dia4 option')).map((o) => o.value).join()")) === 'excursion', 'con 4 días, el día 4 solo puede ser excursión')
debe((await ev("document.querySelectorAll('.dia').length")) === 4 && /Excursión desde Roma/.test(await ev("document.querySelectorAll('.dia')[3].innerText")), 'con 4 días, el cuarto es la excursión')
await ev("document.getElementById('dias').value='6';document.getElementById('dias').onchange();document.getElementById('dia4').value='excursion';document.getElementById('dia4').onchange()")
await esp(300)
debe((await ev("document.querySelectorAll('.dia').length")) === 6 && /Excursión desde Roma/.test(await ev("document.querySelectorAll('.dia')[3].innerText")), '6 días con excursión: 6 tarjetas, la cuarta es la excursión')
await ev("document.querySelector('.chip.repetida').click()")
await esp(900)
debe(await ev("!!document.querySelector('.actual')"), '[siguiente] salta a una parada con esa marca (queda resaltada)')
await ev("document.getElementById('combo').value='D';document.getElementById('combo').onchange()")
await esp(300)
debe((await ev("document.querySelectorAll('.parada.entra').length")) > 0, 'en D se ve en verde lo que entra respecto a la base')
debe(/Lo que sale/.test(await ev("document.querySelector('.sale').innerText")), 'y al final, la lista de lo que sale')
await abrir(390, 844, '#6-excursion-F-2026-11-15')
debe((await ev("document.querySelectorAll('.dia').length")) === 6, 'móvil, 6 días con excursión, F, domingo: 6 tarjetas (se deslizan de lado)')
debe((await ev("document.getElementById('dia4').value")) === 'excursion' && (await ev("document.getElementById('combo').value")) === 'F', 'el enlace con # abre justo esa ruta')
debe((await ev('document.documentElement.scrollWidth')) <= 400, 'sin desbordar a lo ancho en el móvil')
await foto('largos_movil.jpg')
debe(errs.length === 0, `sin errores en la consola (${errs.slice(0, 2).join(' | ')})`)
chrome.kill()
try {
  fs.rmSync(perfil, { recursive: true, force: true })
} catch {
  /* en Windows tarda en soltarse */
}
console.log(fallos === 0 ? '\nLa página carga y se maneja bien.' : `\n${fallos} fallo(s).`)
process.exit(fallos ? 1 : 0)
