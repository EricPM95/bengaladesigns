// Captura cada pantalla (A1–A9, H1–H8) de las piezas «Hoy Aqui» y «Hoy Entero» de Design en docs/dias/V2_capturas/design_<id>.jpg (para el REPASO_V2).
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'
const RAIZ = path.resolve('docs/diseno/proyecto')
const SALIDA = path.resolve('docs/dias/V2_capturas')
const srv = http.createServer((q, r) => { const p = path.join(RAIZ, decodeURIComponent(q.url.split('?')[0])); if (!p.startsWith(RAIZ) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.writeHead(404); r.end(); return } r.writeHead(200, { 'Content-Type': p.endsWith('.html') ? 'text/html; charset=utf-8' : p.endsWith('.js') ? 'text/javascript' : 'application/octet-stream' }); fs.createReadStream(p).pipe(r) })
await new Promise((r) => srv.listen(0, '127.0.0.1', r))
try {
  for (const pieza of ['Piezas/Hoy Aqui.dc.html', 'Piezas/Hoy Entero.dc.html']) {
    const a = await abrirApp(`http://127.0.0.1:${srv.address().port}`, { ancho: 1600, alto: 1000, ruta: '/' + pieza.split('/').map(encodeURIComponent).join('/'), sinEsperarRoot: true, baseFija: true, esperaFija: 7 })
    try {
      const cajas = JSON.parse(await a.evaluar(`(() => { const out = []; const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) { const t = n.textContent.trim(); const m = /^(A[1-9]|H[1-8]b?) ·/.exec(t); if (m) { const r = n.parentElement.parentElement.getBoundingClientRect(); out.push({ id: m[1], x: r.x + scrollX, y: r.y + scrollY, w: r.width, h: r.height }) } } return JSON.stringify(out) })()`))
      for (const c of cajas) {
        const r = await a.cdp('Page.captureScreenshot', { format: 'jpeg', quality: 80, captureBeyondViewport: true, clip: { x: c.x, y: c.y, width: c.w, height: c.h, scale: 1 } })
        fs.writeFileSync(path.join(SALIDA, `design_${c.id}.jpg`), Buffer.from(r.result.data, 'base64'))
        console.log('design', c.id, Math.round(c.w) + 'x' + Math.round(c.h))
      }
    } finally { await a.cerrar() }
  }
} finally { srv.close() }
