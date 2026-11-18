// Genera docs/dias/REPASO_V7.html (después de pruebaV7 y _v7_design_pantallas, que sacan las capturas en docs/dias/V7_capturas): node scripts/destino/generarRepasoV7.mjs
import fs from 'node:fs'

const img = (n) => (fs.existsSync(`docs/dias/V7_capturas/${n}.jpg`) ? `data:image/jpeg;base64,${fs.readFileSync(`docs/dias/V7_capturas/${n}.jpg`).toString('base64')}` : null)
const fig = (n, pie) => `<figure>${img(n) ? `<img alt="${pie}" src="${img(n)}">` : '<div class="no">sin captura</div>'}<figcaption>${pie}</figcaption></figure>`
const par = (app, design, pie) => `<div class="par"><div>${fig(app, 'App · ' + pie)}</div><div>${fig(design, 'Design · ' + pie)}</div></div>`
const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Repaso de la tanda V7 · Yo también estaba</title>
<style>:root{--bg:#FBF6EC;--tx:#1C2230;--bd:rgba(28,34,48,.15)}@media (prefers-color-scheme:dark){:root{--bg:#1C2230;--tx:#FFFDF8;--bd:rgba(255,253,248,.2)}}body{margin:0;padding:16px;background:var(--bg);color:var(--tx);font:15px/1.5 system-ui,sans-serif;max-width:860px;margin-inline:auto}h1{font:400 30px/1.1 Georgia,serif}h2{font:400 22px/1.2 Georgia,serif;margin-top:28px;border-top:1px solid var(--bd);padding-top:14px}figure{margin:8px 10px 8px 0;display:inline-block;vertical-align:top;max-width:210px}.par{display:flex;gap:12px;flex-wrap:wrap}img{max-width:100%;height:auto;border:1px solid var(--bd);border-radius:10px}figcaption{font-size:12px;opacity:.7}.no{padding:30px;border:1px dashed var(--bd)}label{display:block;margin:6px 0}code{font-size:12.5px;background:rgba(127,127,127,.15);padding:1px 4px;border-radius:4px}.nota{font-size:12.5px;opacity:.7}</style></head><body>
<h1>«Yo también estaba» en los viajes compartidos (V7)</h1>
<p>Probado con <code>pruebaV7</code> (nueva: 46 comprobaciones del servidor, de los textos y de la app en Chrome), <code>pruebaJutrip</code>, <code>pruebaV3</code>, <code>pruebaV5</code>, <code>pruebaV6</code> y las de logros. Ninguna prueba toca el Supabase de producción.</p>
<h2>Lo que hace</h2>
<p><b>Cuándo sale:</b> solo con el viaje ya terminado y dentro de los 30 días siguientes. Durante el viaje, nada (no se avisa a nadie de lo que ganó el otro). Lo que sale es lo que un compañero del viaje ganó (pedazo o emblema oculto de un sitio) y tú no.</p>
<p><b>Tarjeta (Y0)</b> en la hoja «Tus logros en …», debajo del plazo de Reclamar: «Eric consiguió N sitios donde estabais juntos». Sin nada pendiente, no sale. Con un sitio abre Y1; con varios, Y2.</p>
<p><b>[Yo también estaba]</b> (Y1 uno, Y2 uno por uno o en todos) gana lo del compañero y sale por la fila de la V6 (Y3: pedazo, emblema oculto). <b>[Subir mi foto] / [Subir mis fotos]</b>: la galería para ese sitio; si la foto vale, gana con SU foto. La foto del compañero nunca va a tus recuerdos. <b>Aviso (Y5):</b> punto en el botón de logros y aviso en la campana. Sin pase: el candado pequeño lleva al pase.</p>
<p><b>Sin migración:</b> el hecho se guarda como un hecho de foto de galería con motivo «compañero», y el logro lleva <code>detalle.origen = 'companero'</code>; lo pendiente se calcula comparando los logros de los miembros del viaje. No hay tabla nueva, así que no hace falta SQL ni tocar «Empezar de cero».</p>
${par('Y0_tarjeta', 'design_Y0', 'La tarjeta en la hoja de logros')}
${par('Y1_un_sitio', 'design_Y1', 'Un solo sitio')}
${par('Y2_varios', 'design_Y2', 'Varios sitios')}
${par('Y3_momento', 'design_Y3b', 'El momento (emblema)')}
${par('Y0_sin_pase', 'design_Y0b', 'Sin pase (candado)')}
<p class="nota"><b>Texto pedido por Eric:</b> «Esta foto no está hecha con tu móvil» en toda la app, también en la pieza de Design <code>Visto Fotos</code> (que traía «Ha perdido sus datos»).</p>
<h2>Lista de comprobación de ESTA tanda</h2>
<label><input type="checkbox"> Con un viaje compartido ya terminado, la tarjeta sale en la hoja de logros del que NO ganó el sitio</label>
<label><input type="checkbox"> Durante el viaje (o pasados 30 días) no sale nada</label>
<label><input type="checkbox"> [Yo también estaba en todos] gana todo y sale el momento con las colecciones que avanzan</label>
<label><input type="checkbox"> [Subir mi foto] con una foto tuya de ese sitio gana con TU foto; la del compañero no aparece en tus recuerdos</label>
<label><input type="checkbox"> Sin pase, el candado lleva al pase y no se gana nada</label>
</body></html>`
fs.writeFileSync('docs/dias/REPASO_V7.html', html)
console.log('docs/dias/REPASO_V7.html', Math.round(html.length / 1024), 'KB')
