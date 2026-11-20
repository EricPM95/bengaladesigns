// Captura cada pantalla del diseño del panel (PANEL.zip, servido en /_diseno_panel/ y NO subido a git) en docs/dias/V35A_capturas/diseno_<id>.jpg y deja su texto en _diseno_textos.json.
//   APP_URL=http://localhost:5173 node scripts/destino/capturasDisenoPanel.mjs [P1 M1 …]   (sin ids: todas)
import fs from 'node:fs'
import { abrirApp } from './_enLaApp.mjs'

const APP = process.env.APP_URL ?? 'http://localhost:5173'
const CAP = 'docs/dias/V35A_capturas'
fs.mkdirSync(CAP, { recursive: true })
const pedidas = process.argv.slice(2)
const a = await abrirApp(APP, { ruta: '/_diseno_panel/Panel%20Jutrip.dc.html', ancho: 1600, alto: 1000, sinEsperarRuta: true, sinEsperarRoot: true, esperaFija: 5 })
try {
  for (let i = 0; i < 60 && !(await a.evaluar("document.body.innerText.includes('P1 · Inicio')").catch(() => false)); i++) await a.esp(500)
  await a.esp(2500)
  const tableros = JSON.parse(await a.evaluar(`JSON.stringify([...document.querySelectorAll('span')].filter((s) => /^[PM]\\d+[a-z]? · /.test(s.textContent.trim()) && s.nextElementSibling).map((s) => { const caja = s.nextElementSibling; const r = caja.getBoundingClientRect(); return { id: s.textContent.trim().split(' · ')[0], cap: s.textContent.trim(), x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height, texto: caja.innerText.replace(/\\n+/g, ' | ') } }))`))
  const textos = {}
  for (const t of tableros) {
    textos[t.id] = { cap: t.cap, w: t.w, h: t.h, texto: t.texto }
    if (pedidas.length && !pedidas.includes(t.id)) continue
    const r = await a.cdp('Page.captureScreenshot', { format: 'jpeg', quality: 80, captureBeyondViewport: true, clip: { x: t.x, y: t.y, width: t.w, height: t.h, scale: 1 } })
    fs.writeFileSync(`${CAP}/diseno_${t.id}.jpg`, Buffer.from(r.result.data, 'base64'))
  }
  fs.writeFileSync(`${CAP}/_diseno_textos.json`, JSON.stringify(textos, null, 1))
  console.log(`${tableros.length} pantallas de Design`, tableros.map((t) => `${t.id}(${Math.round(t.w)}x${Math.round(t.h)})`).join(' '))
} finally {
  a.cerrar()
}
