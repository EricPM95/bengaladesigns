// (V16b) Genera docs/dias/V16_fotos/elegir.html (y elegir.json): para cada uno de los 4 sitios de Roma sin foto, 3 candidatas de Wikimedia Commons con licencia libre para que Eric elija en el móvil.
//   node scripts/destino/generarElegirV16b.mjs <candidatas.json de candidatasV16b.mjs>
import fs from 'node:fs'
const todas = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'))
const ELEGIDAS = {
  lungotevere: { que: 'La calle junto al río (el muro y el paseo del Tíber)', n: [1, 6, 3] },
  borgo_pio: { que: 'La calle peatonal detrás del Vaticano, con sus terrazas', n: [5, 6, 10] },
  mirador_san_pietro_in_montorio: { que: 'La terraza con vistas de Roma, en el Gianícolo', n: [2, 7, 8] },
  colle_oppio: { que: 'El parque sobre el Coliseo', n: [6, 3, 10] },
}
const LETRAS = ['A', 'B', 'C']
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')
const salida = {}
let cuerpo = ''
for (const [id, e] of Object.entries(ELEGIDAS)) {
  const s = todas[id]
  const lista = e.n.map((n, i) => ({ letra: LETRAS[i], ...s.candidatas[n - 1] }))
  salida[id] = { sitio: s.nombre, candidatas: lista.map(({ letra, titulo, licencia, autor, pagina, ancho, alto }) => ({ letra, archivo: titulo, licencia, autor, pagina, ancho, alto })) }
  cuerpo += `<section><h2>${esc(s.nombre)}</h2><p class="que">${esc(e.que)}</p>${lista.map((c) => `<figure><img loading="lazy" src="${esc(c.miniatura)}" alt="${esc(s.nombre)}, candidata ${c.letra}"><figcaption><b>${c.letra}</b> · ${esc(c.titulo)}<br><small>${esc(c.autor || 'autor en la página')} · ${esc(c.licencia)} · <a href="${esc(c.pagina)}">ver en Commons</a></small></figcaption></figure>`).join('')}<p class="elige">¿Cuál? <b>A</b>, <b>B</b>, <b>C</b> o «ninguna».</p></section>`
}
const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Elegir las 4 fotos que faltan en Roma</title>
<style>:root{--bg:#FBF6EC;--tx:#1C2230;--bd:rgba(28,34,48,.15)}@media (prefers-color-scheme:dark){:root{--bg:#1C2230;--tx:#FFFDF8;--bd:rgba(255,253,248,.2)}}*{box-sizing:border-box}body{margin:0;padding:16px;background:var(--bg);color:var(--tx);font:16px/1.45 system-ui,sans-serif;max-width:640px;margin-inline:auto}h1{font:400 28px/1.1 Georgia,serif}h2{font:400 24px/1.15 Georgia,serif;margin:30px 0 2px;border-top:1px solid var(--bd);padding-top:16px}.que{margin:0 0 12px;opacity:.7}figure{margin:0 0 16px}img{width:100%;height:auto;border-radius:12px;border:1px solid var(--bd);display:block;background:rgba(127,127,127,.12)}figcaption{margin-top:6px;font-size:14px}small{opacity:.7}a{color:inherit}.elige{margin:4px 0 0;font-size:17px}</style></head><body>
<h1>Elige la foto de cada sitio</h1>
<p>Roma tiene 37 sitios de logro, todos con foto. Faltan estas <b>4 paradas</b>. Para cada una, 3 fotos de Wikimedia Commons con licencia libre (con su crédito). Dime la letra de la que prefieres (o «ninguna»). Las fotos se ponen en la tanda siguiente.</p>
${cuerpo}
</body></html>`
fs.mkdirSync('docs/dias/V16_fotos', { recursive: true })
fs.writeFileSync('docs/dias/V16_fotos/elegir.html', html)
fs.writeFileSync('docs/dias/V16_fotos/elegir.json', JSON.stringify(salida, null, 2))
console.log('docs/dias/V16_fotos/elegir.html', Math.round(html.length / 1024), 'KB')
