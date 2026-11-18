// Genera docs/dias/REPASO_V10.html (después de pruebaV10 y _v10_design_pantallas, que sacan las capturas en docs/dias/V10_capturas): node scripts/destino/generarRepasoV10.mjs
import fs from 'node:fs'

const img = (n) => (fs.existsSync(`docs/dias/V10_capturas/${n}.jpg`) ? `data:image/jpeg;base64,${fs.readFileSync(`docs/dias/V10_capturas/${n}.jpg`).toString('base64')}` : null)
const fig = (n, pie) => `<figure>${img(n) ? `<img alt="${pie}" src="${img(n)}">` : '<div class="no">sin captura</div>'}<figcaption>${pie}</figcaption></figure>`
const par = (app, design, pie) => `<div class="par">${fig(app, 'App · ' + pie)}${design ? fig(design, 'Design · ' + pie) : ''}</div>`
const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Repaso de la tanda V10 · Todos mis logros</title>
<style>:root{--bg:#FBF6EC;--tx:#1C2230;--bd:rgba(28,34,48,.15)}@media (prefers-color-scheme:dark){:root{--bg:#1C2230;--tx:#FFFDF8;--bd:rgba(255,253,248,.2)}}body{margin:0;padding:16px;background:var(--bg);color:var(--tx);font:15px/1.5 system-ui,sans-serif;max-width:900px;margin-inline:auto}h1{font:400 30px/1.1 Georgia,serif}h2{font:400 22px/1.2 Georgia,serif;margin-top:28px;border-top:1px solid var(--bd);padding-top:14px}figure{margin:8px 10px 8px 0;display:inline-block;vertical-align:top;max-width:300px}.par{display:flex;gap:12px;flex-wrap:wrap}img{max-width:100%;height:auto;border:1px solid var(--bd);border-radius:10px}figcaption{font-size:12px;opacity:.7}.no{padding:30px;border:1px dashed var(--bd)}label{display:block;margin:6px 0}code{font-size:12.5px;background:rgba(127,127,127,.15);padding:1px 4px;border-radius:4px}.nota{font-size:12.5px;opacity:.7}</style></head><body>
<h1>«Todos mis logros» (V10)</h1>
<p>Probado con <code>pruebaV10</code> (nueva, 16 comprobaciones), <code>pruebaJutrip</code> y las de logros de Roma y de Lanzarote, de pantallas y del Perfil. La muestra de 60 viajes de Roma sale idéntica. Ninguna prueba toca el Supabase de producción.</p>
<h2>1. «Por destino»</h2>
<p><b>Un solo destino:</b> su tarjeta ocupa todo el ancho (con la foto más alta). <b>Varios:</b> en fila con scroll de lado, y el siguiente asoma. <b>«Destinos · Países»:</b> el selector pequeño de dos opciones de Design (la elegida, en pastilla oscura; ya no son dos palabras con un subrayado). <b>La tarjeta lleva la FOTO del destino</b> (la propia de la app —Roma, Lanzarote— o la del servidor de fotos; mientras llega, el degradado), igual que «Mis viajes».</p>
<p><b>Los números, claros:</b> «2 colecciones empezadas · 3 pedazos · 2 secretos» (solo lo que hay; «Aún sin pedazos» si nada) y el % del destino ENTERO: (pedazos + emblemas ganados) ÷ (pedazos + emblemas que hay). El servidor manda ahora <code>colecciones.empezadas</code>, <code>pedazos</code> y ese <code>avance</code> (antes era colecciones completas ÷ total, y por eso decía «0 de 7 · 0%» a quien ya tenía pedazos).</p>
<p><b>«Sello de plata» frente a «Primeros pasos · Bronce»:</b> son la misma cosa, la medalla del destino (el sello principal). La tarjeta escribía «Sello de {grado}» con una palabra genérica y, sin grado todavía, ponía «bronce» por defecto, mientras la hoja de logros dice el nombre de la medalla y su grado. Ahora la tarjeta dice lo mismo que la hoja: «Bronce · Primeros pasos en Roma» (y «Por conseguir» si aún no hay). El «sello del viaje» (el que se estampa en el pasaporte al acabar) es otra cosa y no aparece aquí.</p>
${par('todos_1_destino', 'design_todos_T1', 'Un destino: tarjeta a todo el ancho, con foto')}
${par('todos_2_destinos', 'design_todos_T2', 'Dos destinos: en fila y el segundo asoma')}
<h2>2. «Logros de viajero»</h2>
<p>Todos del mismo tamaño (120 × 156) y un poco más grandes (el dibujo, de 64 a 72), cada uno con su dibujo y su marco de siempre.</p>
${par('todos_viajero', null, 'Los logros de viajero')}
<h2>3. El resto, como Design (T1, T2, G1)</h2>
<p>La tarjeta de arriba es oscura (#1C2230) con «N logros conseguidos» y el título de viajero elegido debajo (el mismo del Perfil: se lee de la misma cuenta, así que si se cambia en uno cambia en el otro). «Países»: una tarjeta por país con sus destinos y medallas (el Vaticano «dentro del viaje a Roma»). «Las 7 maravillas» y «Exclusivos» ya estaban como Design. Al tocar un destino, su página (G1) lleva ahora la foto del destino arriba en vez del degradado. Más aire entre bloques (22 px; Design deja 12).</p>
${par('pagina_destino', 'design_todos_G1', 'La página del destino')}
<h2>Lista de comprobación de ESTA tanda</h2>
<label><input type="checkbox"> Con un solo destino, su tarjeta ocupa todo el ancho; con dos o más, en fila y el siguiente asoma</label>
<label><input type="checkbox"> La tarjeta lleva la foto del destino y dice «N colecciones empezadas · N pedazos · N secretos» con el % del destino entero</label>
<label><input type="checkbox"> La medalla de la tarjeta dice lo mismo que la hoja de logros del destino («Bronce · Primeros pasos en …»)</label>
<label><input type="checkbox"> «Destinos · Países» es un selector de dos opciones y «Países» enseña una tarjeta por país</label>
<label><input type="checkbox"> Los logros de viajero tienen todos el mismo tamaño y su dibujo y marco de siempre</label>
<label><input type="checkbox"> El título de viajero de la tarjeta oscura es el mismo que el del Perfil (cambiarlo en uno lo cambia en el otro)</label>
</body></html>`
fs.writeFileSync('docs/dias/REPASO_V10.html', html)
console.log('docs/dias/REPASO_V10.html', Math.round(html.length / 1024), 'KB')
