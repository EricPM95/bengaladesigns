// Capturas de la V40B: la apertura (en su segundo 2) y la hoja del sello de Roma con su diamante nuevo.
//   node scripts/destino/_conCola.mjs node scripts/destino/capturasV40B.mjs
import fs from 'node:fs'
import { abrirApp } from './_enLaApp.mjs'

const dir = 'docs/dias/V40B_capturas'
fs.mkdirSync(dir, { recursive: true })
const foto = async (app, n) => {
  const r = await app.cdp('Page.captureScreenshot', { format: 'png' })
  fs.writeFileSync(`${dir}/${n}.png`, Buffer.from(r.result.data, 'base64'))
}
const a = await abrirApp(process.env.APP_URL ?? 'http://localhost:5173', { ruta: '/?cuentas=off&apertura=1', sinEsperarRuta: true, escala: 2 })
try {
  for (let i = 0; i < 400; i++) {
    if (await a.evaluar('Boolean(window.__ap && window.__ap.cb)')) break
    await a.esp(250)
  }
  await a.evaluar("(() => { const ap = document.getElementById('apertura'); const h = ap.innerHTML; ap.innerHTML = ''; void ap.offsetWidth; ap.innerHTML = h; window.__ap.t0 = performance.now(); return true })()")
  await a.esp(2000)
  await foto(a, 'apertura_segundo_2')
  await a.esp(2500)
  await a.evaluar("document.getElementById('apertura').remove()")
  await a.evaluar("import('/src/dev/escaparate.ts').then(() => window.__escaparate.abrir('1a'))")
  await a.esp(3500)
  await foto(a, 'hoja_sello_roma')
} finally {
  a.cerrar()
}
