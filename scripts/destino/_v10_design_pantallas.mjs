// Captura las pantallas de Design de la V9 (Hoja Logros Destino H1-H4, Coleccion Lanza Detalle C1-C4, Resumen Viaje R/…) en docs/dias/V10_capturas/design_<pieza>_<id>.jpg (para el REPASO_V10).
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'
const RAIZ = path.resolve('docs/diseno/proyecto')
const SALIDA = path.resolve('docs/dias/V10_capturas')
const CAJAS = fs.readFileSync('scripts/destino/_v10_cajas.txt', 'utf8').trim()
const srv = http.createServer((q, r) => {
  const p = path.join(RAIZ, decodeURIComponent(q.url.split('?')[0]))
  if (!p.startsWith(RAIZ) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.writeHead(404); r.end(); return }
  r.writeHead(200, { 'Content-Type': p.endsWith('.html') ? 'text/html; charset=utf-8' : p.endsWith('.js') ? 'text/javascript' : 'application/octet-stream' })
  fs.createReadStream(p).pipe(r)
})
await new Promise((r) => srv.listen(0, '127.0.0.1', r))
try {
  for (const [pieza, corto] of [['Piezas/Mi Vitrina.dc.html', 'todos']]) {
    const a = await abrirApp(`http://127.0.0.1:${srv.address().port}`, { ancho: 3200, alto: 1000, ruta: '/' + pieza.split('/').map(encodeURIComponent).join('/'), sinEsperarRoot: true, baseFija: true, esperaFija: 7 })
    try {
      const cajas = JSON.parse(await a.evaluar(CAJAS))
      for (const c of cajas) {
        const r = await a.cdp('Page.captureScreenshot', { format: 'jpeg', quality: 80, captureBeyondViewport: true, clip: { x: c.x, y: c.y, width: c.w, height: c.h, scale: 1 } })
        fs.writeFileSync(path.join(SALIDA, `design_${corto}_${c.id}.jpg`), Buffer.from(r.result.data, 'base64'))
        console.log('design', corto, c.id, Math.round(c.w) + 'x' + Math.round(c.h))
      }
    } finally { await a.cerrar() }
  }
} finally { srv.close() }
