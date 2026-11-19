// Genera docs/dias/REPASO_V28.html: node scripts/destino/generarRepasoV28.mjs
import fs from 'node:fs'
const img = (n) => (fs.existsSync(`docs/dias/V28_capturas/${n}.jpg`) ? `data:image/jpeg;base64,${fs.readFileSync(`docs/dias/V28_capturas/${n}.jpg`).toString('base64')}` : null)
const fig = (n, pie) => `<figure>${img(n) ? `<img alt="${pie}" src="${img(n)}" style="max-width:230px;border-radius:12px">` : '<div>sin captura</div>'}<figcaption>${pie}</figcaption></figure>`
const esc = (t) => String(t ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
const enl = JSON.parse(fs.readFileSync('data/dias/roma/_enlaces_civitatis.json', 'utf8'))
const filas = enl.entradas.map((e) => `<tr><td>${esc(e.lugar)}</td><td>${esc(e.variante)}</td><td>${e.confianza === 'alta' ? `<a href="${e.url}">${esc(e.url.replace('https://www.civitatis.com/es/', ''))}</a>` : '<b>sin página propia todavía</b>'}</td><td>${esc(e.confianza)}</td></tr>`).join('')
const dudosas = enl.entradas.filter((e) => e.confianza !== 'alta').map((e) => `<li><b>${esc(e.lugar)} · ${esc(e.variante)}</b>: ${esc(e.comentario ?? '')} ${(e.candidatas ?? []).map((c) => `<br>· candidata: <a href="${c.url}">${esc(c.titulo ?? c.url)}</a> ${esc(c.motivo ?? c.por_que ?? '')}`).join('')}</li>`).join('')
const hot = ['roma', 'lanzarote'].flatMap((d) => JSON.parse(fs.readFileSync(`data/dias/${d}/_hoteles.json`, 'utf8')).hoteles.map((h) => `<tr><td>${esc(d)}</td><td>${esc(h.nombre)}</td><td>${esc(h.zona)}</td><td>${h.nota} · ${h.opiniones}</td><td><a href="${h.booking}">Booking</a></td></tr>`)).join('')
const web = fs.existsSync('docs/dias/V28_hoteles_web.md') ? esc(fs.readFileSync('docs/dias/V28_hoteles_web.md', 'utf8')) : ''
const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Repaso de la tanda V28 · Página del destino y enlaces</title>
<style>:root{--bg:#FBF6EC;--tx:#1C2230}@media (prefers-color-scheme:dark){:root{--bg:#1C2230;--tx:#FFFDF8}}body{margin:0;padding:16px;background:var(--bg);color:var(--tx);font:16px/1.5 system-ui,sans-serif;max-width:860px}h1{font-size:24px}h2{font-size:19px;margin-top:28px}code{font-size:13px}label{display:block;margin:6px 0}figure{display:inline-block;margin:8px 10px 8px 0;vertical-align:top}figcaption{font-size:12.5px;opacity:.7;max-width:230px}table{border-collapse:collapse;font-size:13px}td,th{border:1px solid rgba(128,128,128,.35);padding:4px 8px;text-align:left}pre{font-size:11.5px;overflow:auto;max-height:300px;background:rgba(128,128,128,.12);padding:10px;border-radius:8px}a{color:inherit}</style></head><body>
<h1>V28 · La página del destino y los enlaces de las entradas</h1>
<p>Probado con <code>pruebaV28</code> (50 comprobaciones, 0 fallos), <code>pruebaJutrip</code>, <code>pruebaV21</code>, <code>pruebaV23</code>, <code>pruebaV9</code> y las de logros en 0. Para la parte de la app de Lanzarote la API va con <code>DESTINOS_OCULTOS=</code> vacío (Lanzarote está oculto en la normal). Ninguna prueba toca producción.</p>
<h2>1. Hoteles</h2>
<ul><li><b>Los 5 de Lanzarote</b> salen (Princesa Yaiza 8,8 · Isla y el Mar 9,1 · Oasis Lanz Beach Mate 8,9 · Sandos Papagayo 8,3 · SENTIDO Aequora 8,7), con su nota y opiniones de Booking de hoy. Los tres que faltaban ya abren su ficha desde el enlace de Stay22 y coinciden con lo que dijo Eric.</li>
<li><b>Sin etiqueta</b> en ningún hotel de ningún destino (fuera «Mejor nota de …»): foto, nombre, zona, nota y opiniones.</li>
<li><b>Las 12 fotos</b> (7 de Roma, 5 de Lanzarote) son la foto principal de la ficha de Booking de cada hotel, en <code>public/fotos/&lt;destino&gt;/hoteles/</code> (640 px y 320 px), con de dónde sale y «permiso: pendiente» en <code>_hoteles.json</code>. Cuatro originales son verticales y pequeños (la tarjeta los recorta).</li>
<li><b>Tu alojamiento:</b> con la foto de nuestro hotel si lo añadiste de ahí; si no, el icono de la cama en grande.</li></ul>
${fig('pagina_roma_arriba', 'Roma: actividades en carrusel')}${fig('pagina_lanzarote_hoteles', 'Lanzarote: hoteles con foto y sin etiqueta')}${fig('pagina_roma_tu_alojamiento', 'Tu alojamiento · The colors house (cama)')}
<h2>2. Actividades en carrusel (todos los destinos)</h2>
<ul><li>Siempre en carrusel (también en Lanzarote, que las tenía una debajo de otra cuando había alojamiento puesto).</li>
<li><b>Fotos rápidas:</b> la tarjeta de Roma pedía la foto GRANDE de Civitatis (~730 KB) en vez de la pequeña (~7 KB, <code>-list.jpg</code>): ahora la pequeña. Empiezan a bajar al abrir la página (las primeras antes), con fondo suave del tamaño de la foto (sin saltos) y las de Civitatis llevan caché de un año. Medido con red lenta (80 KB/s, 300 ms): la segunda vez, las primeras fotos listas en ~0,1–0,2 s (menos de 1 s).</li>
<li><b>Free tour por Arrecife:</b> la foto era la plaza de la iglesia de San Ginés (de Arrecife; se parece a Teguise: iglesia blanca, torre, palmeras) y es la que Civitatis pone a esa actividad. Para que no haya dudas he puesto otra foto de la misma ficha de Civitatis: el Charco de San Ginés (barcas y casas de Arrecife). Si prefieres la de antes, es <code>free-tour-arrecife-m.jpg</code>.</li></ul>
<h2>3. Los enlaces de las entradas (aid=5206)</h2>
<p>De las 22 entradas de Roma, <b>9 abren ahora su página exacta</b> en Civitatis (antes solo el Free Tour): las de confianza «alta» (misma entrada y contenido). El enlace lleva nuestro <code>aid=5206</code> y la campaña del viaje al abrirlo (el Free Tour ya no lleva la campaña «Routy» escrita a mano). Las excursiones de Roma (8) y las de Lanzarote (23 + 2 free tours) se comprobaron una a una: todas llegan a su página. La prueba abre los 9 enlaces de Roma y cada uno llega a una página de actividad.</p>
<table><tr><th>Lugar</th><th>Variante</th><th>Página</th><th>Confianza</th></tr>${filas}</table>
<h2>Las que no se encontraron con seguridad (PARA ERIC, con candidatas — no se adivina)</h2><ul>${dudosas}</ul>
<h2>Hoteles y su web</h2>
<table><tr><th>Destino</th><th>Hotel</th><th>Zona</th><th>Nota · opiniones</th><th>Ficha</th></tr>${hot}</table>
<pre>${web}</pre>
<h2>3b. La colección por dentro</h2>
<p>El círculo blanco de cada sitio lleva ahora SOLO su trozo, entero, con su forma exacta (la baldosa de la insignia), centrado y a escala para que quepa con margen; en color si lo tiene, en gris si no. Antes era un recorte aproximado que dejaba pedazos en diagonal de los vecinos. La prueba comprueba las 18 insignias: ningún trozo se sale del círculo ni pisa a otro. La misma forma exacta ilumina el trozo al tocar la tarjeta.</p>
${fig('coleccion_trozo_entero', 'Los imprescindibles de Roma')}
<h2>Lista de comprobación de ESTA tanda</h2>
<label><input type="checkbox"> Lanzarote: la página enseña los 5 hoteles con foto, sin etiquetas</label>
<label><input type="checkbox"> Roma y Lanzarote: las actividades en carrusel y las fotos salen enseguida (también la segunda vez)</label>
<label><input type="checkbox"> Una entrada de Roma (por ejemplo el Panteón) abre su página en Civitatis</label>
<label><input type="checkbox"> Tu alojamiento sin foto sale con la cama grande</label>
<label><input type="checkbox"> Colección por dentro: cada círculo con su trozo entero</label>
<label><input type="checkbox"> Mirar la lista de dudosas y elegir candidata</label>
</body></html>`
fs.writeFileSync('docs/dias/REPASO_V28.html', html)
console.log('docs/dias/REPASO_V28.html', Math.round(html.length / 1024), 'KB')
