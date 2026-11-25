// NOCHE (agente HOY): SOLO capturas de los dibujos de Design (cada tablero de 375x812 por separado). Por la cola:
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/noche_hoy_dibujos.mjs
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'

const RAIZ = path.resolve('docs/diseno/proyecto')
const SAL = path.resolve('docs/dias/NOCHE_HOY_capturas')
fs.mkdirSync(SAL, { recursive: true })
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const PIEZAS = [['Parada Tarjeta.dc.html', 'parada'], ['Lugares Pendientes.dc.html', 'pendientes'], ['Aviso Cierre.dc.html', 'aviso'], ['Billete QR.dc.html', 'billete'], ['Piezas/Hoy Recorrido.dc.html', 'recorrido']]
const solo = process.argv[2]
const servidor = http.createServer((req, res) => {
  const ruta = path.join(RAIZ, decodeURIComponent((req.url ?? '/').split('?')[0]))
  if (!ruta.startsWith(RAIZ) || !fs.existsSync(ruta) || fs.statSync(ruta).isDirectory()) { res.writeHead(404); res.end(); return }
  res.writeHead(200, { 'Content-Type': TIPOS[path.extname(ruta)] ?? 'application/octet-stream' })
  fs.createReadStream(ruta).pipe(res)
})
await new Promise((r) => servidor.listen(0, '127.0.0.1', r))
const puerto = servidor.address().port
try {
  const a = await abrirApp(`http://127.0.0.1:${puerto}`, { ancho: 1500, alto: 1000, ruta: '/', sinEsperarRoot: true, sinEsperarRuta: true, baseFija: true, esperaFija: 3 })
  for (const [f, n] of PIEZAS) {
    if (solo && solo !== n) continue
    await a.evaluar(`location.href = ${JSON.stringify('/' + f.split('/').map(encodeURIComponent).join('/'))}; true`)
    await a.esp(9000)
    const res = JSON.parse(await a.evaluar(`(() => {
      const todos = []
      const andar = (raiz) => { for (const e of raiz.querySelectorAll('*')) { todos.push(e); if (e.shadowRoot) andar(e.shadowRoot) } }
      andar(document)
      const out = []
      for (const d of todos) {
        const s = d.getAttribute('style') || ''
        if (!(/width:\s*375px/.test(s) && /height:\s*812px/.test(s))) continue
        const r = d.getBoundingClientRect()
        const et = d.previousElementSibling
        out.push({ x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height, id: (et?.textContent || '').trim().slice(0, 70) })
      }
      return JSON.stringify({ n: todos.length, out, iframes: document.querySelectorAll('iframe').length, texto: document.body.innerText.slice(0, 80) })
    })()`))
    console.log(n, 'elementos', res.n, 'iframes', res.iframes, JSON.stringify(res.texto))
    const cajas = res.out
    console.log(n, 'tableros', cajas.length)
    let i = 0
    for (const c of cajas) {
      i++
      const r = await a.cdp('Page.captureScreenshot', { format: 'jpeg', quality: 80, captureBeyondViewport: true, clip: { x: c.x, y: c.y, width: c.w, height: c.h, scale: 1 } })
      const slug = (c.id.split('·')[0] || String(i)).trim().replace(/[^A-Za-z0-9]+/g, '_')
      fs.writeFileSync(path.join(SAL, `dibujo_${n}_${String(i).padStart(2, '0')}_${slug}.jpg`), Buffer.from(r.data, 'base64'))
      console.log('  ', i, c.id)
    }
  }
  a.cerrar()
} finally { servidor.close() }
