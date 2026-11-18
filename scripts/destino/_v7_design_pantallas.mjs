// Captura cada pantalla Y0–Y5 de la pieza «Visto Fotos» (modo «yo») de Design en docs/dias/V7_capturas/design_<id>.jpg (para el REPASO_V7).
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'
const RAIZ = path.resolve('docs/diseno/proyecto')
const SALIDA = path.resolve('docs/dias/V7_capturas')
const CAJAS = fs.readFileSync('scripts/destino/_v7_cajas.txt', 'utf8').trim()
const srv = http.createServer((q, r) => {
  const p = path.join(RAIZ, decodeURIComponent(q.url.split('?')[0]))
  if (!p.startsWith(RAIZ) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.writeHead(404); r.end(); return }
  r.writeHead(200, { 'Content-Type': p.endsWith('.html') ? 'text/html; charset=utf-8' : p.endsWith('.js') ? 'text/javascript' : 'application/octet-stream' })
  if (p.endsWith('Visto Fotos.dc.html')) r.end(fs.readFileSync(p, 'utf8').split("this.props.mode||'hoy'").join("this.props.mode||'yo'").split('&quot;default&quot;:&quot;hoy&quot;').join('&quot;default&quot;:&quot;yo&quot;'))
  else fs.createReadStream(p).pipe(r)
})
await new Promise((r) => srv.listen(0, '127.0.0.1', r))
try {
  const a = await abrirApp(`http://127.0.0.1:${srv.address().port}`, { ancho: 3200, alto: 1000, ruta: '/' + 'Piezas/Visto Fotos.dc.html'.split('/').map(encodeURIComponent).join('/'), sinEsperarRoot: true, baseFija: true, esperaFija: 7 })
  try {
    console.log(JSON.stringify((await a.evaluar('document.body.innerText')).split(String.fromCharCode(10)).filter((l) => /^Y[0-5]/.test(l)))); const cajas = JSON.parse(await a.evaluar(CAJAS))
    for (const c of cajas) {
      const r = await a.cdp('Page.captureScreenshot', { format: 'jpeg', quality: 80, captureBeyondViewport: true, clip: { x: c.x, y: c.y, width: c.w, height: c.h, scale: 1 } })
      fs.writeFileSync(path.join(SALIDA, `design_${c.id}.jpg`), Buffer.from(r.result.data, 'base64'))
      console.log('design', c.id, Math.round(c.w) + 'x' + Math.round(c.h))
    }
  } finally { await a.cerrar() }
} finally { srv.close() }
