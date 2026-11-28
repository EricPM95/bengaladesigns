// Genera docs/dias/REPASO_FINDE.html (autónomo, capturas dentro) desde INFORME_FINDE.md. No es una prueba.
import fs from 'node:fs'
import path from 'node:path'
const D = path.resolve('docs/dias')
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const inline = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/`(.+?)`/g, '<code>$1</code>')
let html = ''
let tabla = false
for (const l of fs.readFileSync(path.join(D, 'INFORME_FINDE.md'), 'utf8').split(/\r?\n/)) {
  if (l.startsWith('|')) {
    if (/^\|[-| ]+\|$/.test(l)) continue
    if (!tabla) { html += '<table>'; tabla = true }
    html += '<tr>' + l.split('|').slice(1, -1).map((c) => `<td>${inline(c.trim())}</td>`).join('') + '</tr>'
    continue
  }
  if (tabla) { html += '</table>'; tabla = false }
  if (l.startsWith('# ')) html += `<h1>${inline(l.slice(2))}</h1>`
  else if (l.startsWith('## ')) html += `<h2>${inline(l.slice(3))}</h2>`
  else if (/^\d+\. /.test(l) || l.startsWith('- ')) html += `<p class="li">${inline(l)}</p>`
  else if (l.trim()) html += `<p>${inline(l)}</p>`
}
if (tabla) html += '</table>'
const dir = path.join(D, 'FINDE_capturas')
let figs = ''
for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.jpg')).sort()) {
  figs += `<figure><img src="data:image/jpeg;base64,${fs.readFileSync(path.join(dir, f)).toString('base64')}"><figcaption>${f}</figcaption></figure>`
}
const pag = `<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>REPASO del finde</title>
<style>body{font:15px/1.5 system-ui,sans-serif;max-width:1000px;margin:24px auto;padding:0 16px;color:#1C2230;background:#FBF6EA}h2{margin-top:30px;border-top:2px solid #C9A24A;padding-top:10px}table{border-collapse:collapse;background:#fff;margin:8px 0}td{border:1px solid #e6dcc3;padding:4px 10px}code{background:#efe6cf;padding:0 4px}.li{margin:3px 0 3px 12px}.figs{display:flex;flex-wrap:wrap;gap:10px}figure{margin:0;width:190px}figure img{width:100%;border:1px solid #d8cfb8;border-radius:10px}figcaption{font-size:11px;color:#6a6657;word-break:break-all}</style>
${html}<h2>Capturas</h2><div class="figs">${figs}</div></html>`
fs.writeFileSync(path.join(D, 'REPASO_FINDE.html'), pag)
console.log('REPASO_FINDE.html', Math.round(pag.length / 1024), 'KB')
