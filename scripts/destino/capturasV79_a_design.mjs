// V79 (apartados 1-2): captura VL6, VL7a y VL7b de «La vuelta en HOY copy.dc.html» (Design) para ponerlas al lado de la app.
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'
const RAIZ = path.resolve('docs/diseno/proyecto')
const srv = http.createServer((req, res) => {
  const ruta = path.join(RAIZ, decodeURIComponent((req.url ?? '/').split('?')[0]))
  if (!ruta.startsWith(RAIZ) || !fs.existsSync(ruta) || fs.statSync(ruta).isDirectory()) { res.writeHead(404); res.end(); return }
  res.writeHead(200, { 'Content-Type': ruta.endsWith('.html') ? 'text/html; charset=utf-8' : ruta.endsWith('.js') ? 'text/javascript; charset=utf-8' : 'application/octet-stream' })
  fs.createReadStream(ruta).pipe(res)
})
await new Promise((r) => srv.listen(0, '127.0.0.1', r))
const puerto = srv.address().port
try {
  const a = await abrirApp(`http://127.0.0.1:${puerto}`, { ancho: 2600, alto: 3000, ruta: `/${encodeURIComponent('La vuelta en HOY copy.dc.html')}`, sinEsperarRoot: true, baseFija: true, esperaFija: 6 })
  await a.esp(1500)
  for (const id of ['VL6', 'VL7a', 'VL7b']) {
    const r = await a.evaluar(`(()=>{const t=[...document.querySelectorAll('*')].filter(e=>/^${id} ·/.test((e.innerText||'').trim())).pop();if(!t)return null;const f=t.parentElement.getBoundingClientRect();return [f.x,f.y+scrollY,f.width,f.height]})()`)
    console.log(id, r)
    if (!r) continue
    const [x, y, w, h] = r
    const s = await a.cdp('Page.captureScreenshot', { format: 'jpeg', quality: 85, captureBeyondViewport: true, clip: { x, y, width: Math.min(w, 460), height: Math.min(Math.max(h, 1100), 2600), scale: 1 } })
    fs.writeFileSync(`docs/dias/V79_capturas/design_${id}.jpg`, Buffer.from(s.result.data, 'base64'))
  }
  a.cerrar()
} finally { srv.close() }
