// Genera docs/dias/CATALOGO_AVISOS.html (una sola página, con las capturas DENTRO: se abre sin internet ni servidor)
// a partir de docs/dias/catalogo/hoy.json y resto.json y sus imágenes. No es una prueba.
import fs from 'node:fs'
import path from 'node:path'

const D = path.resolve('docs/dias/catalogo')
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const uri = (f) => `data:image/jpeg;base64,${fs.readFileSync(f).toString('base64')}`

function bloque(nombreJson, titulo) {
  const arr = JSON.parse(fs.readFileSync(path.join(D, nombreJson), 'utf8'))
  let html = `<h2>${esc(titulo)} <small>(${arr.length})</small></h2>\n`
  let sinImagen = 0
  for (const e of arr) {
    const f = e.imagen ? path.join(D, e.imagen) : ''
    const hay = f && fs.existsSync(f)
    if (!hay) sinImagen++
    html += `<div class="ficha"><div class="foto">${hay ? `<img src="${uri(f)}" alt="${esc(e.titulo)}">` : '<div class="sin">Sin captura</div>'}</div>`
    html += `<div class="texto"><h3>${esc(e.titulo)}</h3>`
    html += `<p><b>Cuándo sale:</b> ${esc(e.cuando)}</p><p><b>Cuántas veces:</b> ${esc(e.veces)}</p><p><b>Suena:</b> ${esc(e.suena)}</p>`
    if (e.nota) html += `<p class="nota"><b>Ojo:</b> ${esc(e.nota)}</p>`
    html += `</div></div>\n`
  }
  return { html, total: arr.length, sinImagen }
}

const a = bloque('hoy.json', 'HOY: avisos, hojas y momentos')
const b = bloque('resto.json', 'La llegada, Reorganizar, RESERVAS y DÍAS')
const total = a.total + b.total
const sin = a.sinImagen + b.sinImagen
const pagina = `<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Catálogo de avisos</title>
<style>body{font:15px/1.5 system-ui,sans-serif;max-width:900px;margin:24px auto;padding:0 16px;color:#1C2230;background:#FBF6EA}h1{margin-bottom:4px}h2{margin-top:36px;border-top:2px solid #C9A24A;padding-top:10px}h2 small{color:#6a6657;font-weight:400}
.resumen{background:#fff;border:1px solid #d8cfb8;border-radius:12px;padding:12px 16px;margin:12px 0}
.ficha{display:flex;gap:18px;background:#fff;border:1px solid #e6dcc3;border-radius:12px;padding:12px;margin:14px 0;align-items:flex-start}
.foto{flex:0 0 230px}.foto img{width:230px;border:1px solid #d8cfb8;border-radius:12px;display:block}.sin{width:230px;height:120px;border:1px dashed #b5483a;border-radius:12px;display:flex;align-items:center;justify-content:center;color:#b5483a}
.texto{flex:1;min-width:0}.texto h3{margin:0 0 6px;font-size:16px}.texto p{margin:4px 0}.nota{color:#8a5a1f;background:#fbf0d8;border-radius:8px;padding:6px 8px}
@media(max-width:640px){.ficha{flex-direction:column}.foto,.foto img{flex:none;width:100%;max-width:300px}}</style>
<h1>Catálogo de avisos, hojas y momentos</h1>
<div class="resumen"><b>${total} pantallas</b> (${total - sin} con captura en modo iPhone${sin ? `, ${sin} sin captura: la entrada dice por qué` : ''}). Cada una dice cuándo sale, cuántas veces y si suena. Las capturas usan viajes de prueba de Roma y Lanzarote y datos de ejemplo. Esta página se abre sola, sin internet y sin servidor.</div>
${a.html}${b.html}
</html>`
fs.writeFileSync(path.resolve('docs/dias/CATALOGO_AVISOS.html'), pagina)
console.log('catálogo:', total, 'entradas,', sin, 'sin captura,', Math.round(pagina.length / 1024), 'KB')
