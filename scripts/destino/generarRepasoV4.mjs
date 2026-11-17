// Genera docs/dias/REPASO_V4.html. Se corre después de pruebaV4 (que escribe docs/dias/_v4_tabla.json) y de _v4_repaso_capturas.mjs:
//   node scripts/destino/generarRepasoV4.mjs
import fs from 'node:fs'

const img = (f, tipo = 'png') => (fs.existsSync(f) ? `data:image/${tipo};base64,${fs.readFileSync(f).toString('base64')}` : null)
const tabla = JSON.parse(fs.readFileSync('docs/dias/_v4_tabla.json', 'utf8'))
const L = JSON.parse(fs.readFileSync('data/logros/lanzarote.json', 'utf8'))
const resultados = fs.existsSync('docs/dias/_v4_resultados.json') ? JSON.parse(fs.readFileSync('docs/dias/_v4_resultados.json', 'utf8')) : []
const colecciones = L.colecciones
const nombreDe = (id) => L.sitios_extra?.[id]?.name ?? id
const fig = (src, pie) => (src ? `<figure><img alt="${pie}" src="${src}"><figcaption>${pie}</figcaption></figure>` : `<figure><div class="no">sin captura</div><figcaption>${pie}</figcaption></figure>`)
const fila = (c) => `<tr><td>${c.nombre}</td><td>${c.sitios.length}</td><td>${c.sitios.map((s) => nombreDe(s)).join(' · ')}</td></tr>`
const radios = tabla.radios.map((r) => `<tr><td>${r.nombre}</td><td>${r.radio_m} m</td><td>${r.lat.toFixed(5)}, ${r.lng.toFixed(5)}</td><td>${(L.sitios[r.id].motivo_radio ?? '').replace(/</g, '&lt;')}</td></tr>`).join('')
const sinCol = tabla.sin_coleccion.map((p) => `<li><b>${p.nombre}</b> <span class="nota">(${p.id}, ${p.tipo})</span></li>`).join('')
const lista = resultados.map((r) => `<tr><td>${r.nombre}</td><td>${r.comprobaciones ?? ''}</td><td>${r.fallos}</td></tr>`).join('')

const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Repaso de la tanda V4 · Las colecciones de Lanzarote</title>
<style>:root{--bg:#FBF6EC;--tx:#1C2230;--bd:rgba(28,34,48,.15)}@media (prefers-color-scheme:dark){:root{--bg:#1C2230;--tx:#FFFDF8;--bd:rgba(255,253,248,.2)}}body{margin:0;padding:16px;background:var(--bg);color:var(--tx);font:15px/1.5 system-ui,sans-serif;max-width:860px;margin-inline:auto}h1{font:400 30px/1.1 Georgia,serif}h2{font:400 22px/1.2 Georgia,serif;margin-top:28px;border-top:1px solid var(--bd);padding-top:14px}table{border-collapse:collapse;width:100%;font-size:13px}td,th{border:1px solid var(--bd);padding:5px 7px;text-align:left;vertical-align:top}.nota{font-size:12.5px;opacity:.7}figure{margin:8px 0;display:inline-block;vertical-align:top;max-width:100%}img{max-width:100%;height:auto;border:1px solid var(--bd);border-radius:10px}figcaption{font-size:12px;opacity:.7}.dos{display:flex;flex-wrap:wrap;gap:14px}.no{padding:30px;border:1px dashed var(--bd)}label{display:block;margin:6px 0}code{font-size:12.5px;background:rgba(127,127,127,.15);padding:1px 4px;border-radius:4px}pre{background:rgba(127,127,127,.12);padding:10px;border-radius:8px;overflow:auto;font-size:12px}</style></head><body>
<h1>Las colecciones de Lanzarote, bien hechas (V4)</h1>
<p>Probado con <code>pruebaV4</code> (nueva), <code>pruebaJutrip</code>, las pruebas de logros de Roma y de Lanzarote y la muestra de 60 de Roma (idéntica). Ninguna prueba toca el Supabase de producción.</p>
${resultados.length ? `<table><tr><th>Prueba</th><th>Comprobaciones</th><th>Fallos</th></tr>${lista}</table>` : ''}

<h2>Las 7 colecciones</h2>
<table><tr><th>Colección</th><th>Sitios</th><th>Cuáles</th></tr>${colecciones.map(fila).join('')}</table>
<p class="nota">Ninguna con menos de 3 sitios. Todo está en <code>data/logros/lanzarote.json</code>; las paradas de los días no se han tocado.</p>

<h2>1. «Entre viñas de ceniza»: de 1 a 3 sitios</h2>
<p>Ahora tiene <b>La Geria y sus bodegas</b> (el paisaje, 3.000 m), <b>Bodega La Geria</b> y <b>Bodega El Grifo</b> (250 m cada una). Los tres gajos de la insignia, uno por sitio: volcán = La Geria y sus bodegas, muro de piedra = Bodega La Geria, viñas = Bodega El Grifo (Design no dice qué trozo es cada bodega: lo he puesto yo, se cambia en <code>gajosColecciones.ts</code> si prefieres otro orden).</p>
<p><b>Radio de La Geria:</b> Bodega La Geria cae <i>dentro</i> de los 3.000 m (a unos 630 m de su centro); El Grifo queda fuera (a unos 9 km). Para que una foto en la bodega no dé La Geria sin querer no he tocado el radio de La Geria: las bodegas llevan <code>aparta_de</code> y, si estás en el radio de una bodega, La Geria no cuenta para esa foto (la prueba lo comprueba, también con la bodega ya ganada). Una foto en el paisaje de La Geria, lejos de las bodegas, sigue dando La Geria y su emblema «Viñas en la ceniza».</p>
<p><b>Ojo:</b> la ruta no tiene ninguna parada llamada «Bodega…»: las bodegas son puntos de aparcar. Un <b>Visto</b> en la parada «La Geria y sus bodegas» da solo La Geria; las dos bodegas se ganan con una <b>foto hecha en ellas</b> (con ubicación). Si prefieres que el Visto de esa parada dé también Bodega La Geria, se cambia en <code>sitios_de_parada</code>. Las coordenadas de las dos bodegas son aproximadas (las de los puntos de aparcar, marcados «verificar»): por eso 250 m y no 200.</p>
${fig(img('docs/dias/V4_capturas/app_entre_vinas_de_ceniza.png'), 'La insignia de «Entre viñas de ceniza» en la app: 0, 3 y 3 de 3 gajos')}

<h2>2. Los «dos en uno» separados</h2>
<p>La parada de los días sigue siendo una (no se separa); lo que se separa es el sitio de logro. Una <b>foto con ubicación</b> vale solo para el sitio donde estás; el <b>Visto en la parada</b> vale para los dos; una foto sin ubicación hecha desde la parada, también para los dos.</p>
<table><tr><th>Sitio</th><th>Radio</th><th>Coordenadas</th><th>Por qué ese radio</th></tr>${radios}</table>
<p class="nota">Caleta y Playa de Famara, y El Golfo y el Charco, no se solapan. Haría y la Casa-Museo sí (están a unos 100 m): ahí manda el sitio más cercano. El Charco usa la coordenada que ya tenía la parada (OpenStreetMap la pone a 75 m); El Golfo (pueblo) sale de Mapbox.</p>
<p><b>El emblema «El charco verde»</b> va con el Charco de los Clicos: una foto en el pueblo de El Golfo ya no lo da, una en el Charco sí.</p>
<p><b>Lo ya ganado no se pierde.</b> Por la parte del servidor, un hecho (Visto o foto) con el id viejo vale para los dos sitios nuevos, con la misma fecha: la prueba lo comprueba con el motor. Por la parte de la base de datos, la migración <code>0079_lanzarote_sitios_separados.sql</code> convierte cada pedazo viejo en el nuevo de su colección (misma fecha y viaje, animación ya vista, sin duplicar) y borra el viejo; probada en PGlite con la migración real, también repetida. <b>No he podido contar cuántos pedazos se convierten en producción:</b> mi intento de leer Supabase con la clave de servicio fue denegado por el sistema de permisos, y no lo he rodeado. En su lugar, <code>docs/dias/COMPROBAR_0079.sql</code> trae la consulta que cuenta, por colección y sitio, las filas viejas (pégala antes de aplicar la 0079) y la que dice «Aplicada»/«FALTA» (después). Lanzarote está oculto para quien no es administrador, así que lo normal es que sean muy pocas o ninguna.</p>
<p><b>Fotos:</b> Caleta y Playa de Famara usan la misma foto (la de su parada, de Eric, con «revisar antes del lanzamiento»); El Golfo y el Charco también; Haría y la Casa-Museo, cada una la suya. <b>Faltan fotos propias</b> de Bodega El Grifo y Bodega La Geria (salen con el fondo de color, nunca con Wikipedia).</p>

<h2>3. Puerto del Carmen en «Pueblos con alma» (de 5 a 6)</h2>
<p>Nuevo sitio <b>Puerto del Carmen (Puerto Viejo)</b>, 400 m, con su foto del paseo marítimo (<code>puerto_del_carmen_puerto_viejo.jpg</code>, foto propia de Eric, anotada como «libre» en <code>docs/dias/_fotos_eric.json</code>; ya no figura en «sin foto»). La pieza nueva de la insignia (la ventana blanca con las contraventanas verdes) es el sexto gajo y va con el Puerto Viejo. <b>Ojo, Design:</b> en la imagen final (<code>assets/lanza/col6.png</code>, la que usa la app) esa ventana está a la <i>derecha</i>, justo detrás del campanario; en la captura <code>col6-new.png</code> está arriba a la izquierda. He seguido la imagen (es lo que se pinta). El orden de los gajos, desde las 12 en sentido horario: campanario = Teguise, ventana = Puerto del Carmen, puerta verde = Arrecife, piedra negra = El Golfo, palmera = Haría, casas blancas = Caleta de Famara. <code>docs/diseno/proyecto/</code> al día: <code>Piezas/Insignia Lanza Pro</code>, <code>Colecciones Lanza</code>, <code>Dashboard</code> y <code>screenshots/col6-new.png</code>; además, la imagen <code>assets/lanza/col6.png</code> y <code>.thumbnail</code> también venían cambiadas en el zip (sin <code>uploads/</code> ni <code>Archivo/</code>). La tarjeta: «6 sitios · La isla de verdad» (sale de los datos: 6 sitios y su frase al completarla).</p>
<div class="dos">${fig(img('docs/dias/V4_capturas/app_pueblos_con_alma.png'), 'La app: Pueblos con alma con 0, 3 y 6 de 6 gajos')}${fig(img('docs/diseno/proyecto/screenshots/col6-new.png'), 'Design (col6-new.png)')}</div>

<h2>4. Repaso de las colecciones</h2>
<p>Ninguna colección con menos de 3 sitios (la más pequeña es Entre viñas, con 3). <b>Paradas sin colección</b> (no las he metido; decide Eric):</p>
<ul>${sinCol}</ul>
<p class="nota">Las tres últimas (Órzola, Puerto de Playa Blanca y el aeropuerto) no son sitios que visitar, sino puntos de salida y llegada.</p>
<p><b>Caldera Blanca</b> está en «Tierra de fuego», pero no es parada de ninguna ruta de las normales: solo entra en la variante <code>volcanes</code> del día 5 (en lugar del Volcán del Cuervo, «~10 km y 3 h desde Mancha Blanca»). Un viajero la consigue así: (1) con esa variante, como parada del día (Visto en el sitio de salida, en la iglesia de Los Dolores de Mancha Blanca, que es su coordenada); (2) con una foto a menos de 800 m de ese punto. <b>Ojo:</b> el cráter queda a unos 3 km de la salida, así que una foto <i>en el cráter</i> no cuenta con el radio actual (800 m). Si quieres que cuente, hay que subir el radio (por ejemplo a 3.000 m) o poner un segundo punto; no lo he tocado.</p>

<h2>Lista de comprobación de ESTA tanda</h2>
<label><input type="checkbox"> «Entre viñas de ceniza» sale con 3 sitios y su insignia de 3 piezas, no «0 de 1»</label>
<label><input type="checkbox"> Una foto en Bodega La Geria da solo la bodega (no La Geria ni «Viñas en la ceniza»)</label>
<label><input type="checkbox"> Una foto en Bodega El Grifo da solo El Grifo</label>
<label><input type="checkbox"> Una foto en la Caleta de Famara da solo «Pueblos con alma»; en la Playa, solo «Playas y charcos»</label>
<label><input type="checkbox"> Una foto en el Charco de los Clicos da «El charco verde»; en el pueblo de El Golfo, no</label>
<label><input type="checkbox"> Una foto en la Casa-Museo da «La Lanzarote de César Manrique»; en el pueblo de Haría, «Pueblos con alma»</label>
<label><input type="checkbox"> «Pueblos con alma» sale con 6 sitios y la insignia de 6 piezas (la ventana con contraventanas verdes es el Puerto Viejo)</label>
<label><input type="checkbox"> El Puerto Viejo sale con la foto de Eric</label>
<label><input type="checkbox"> Pegar <code>COMPROBAR_0079.sql</code> (primera consulta) y decidir si se aplica la 0079</label>
<label><input type="checkbox"> Decidir sobre las 9 paradas sin colección y sobre el radio de Caldera Blanca</label>
<label><input type="checkbox"> Mirar las coordenadas de las dos bodegas (aproximadas) y poner fotos a las bodegas</label>
</body></html>`
fs.writeFileSync('docs/dias/REPASO_V4.html', html)
console.log('docs/dias/REPASO_V4.html', Math.round(html.length / 1024), 'KB')
