// Genera docs/dias/REPASO_V27.html: node scripts/destino/generarRepasoV27.mjs
import fs from 'node:fs'
const img = (n) => (fs.existsSync(`docs/dias/V27_capturas/${n}.jpg`) ? `data:image/jpeg;base64,${fs.readFileSync(`docs/dias/V27_capturas/${n}.jpg`).toString('base64')}` : null)
const fig = (n, pie) => `<figure>${img(n) ? `<img alt="${pie}" src="${img(n)}" style="max-width:230px;border-radius:12px">` : '<div>sin captura</div>'}<figcaption>${pie}</figcaption></figure>`
const sql = fs.readFileSync('supabase/migrations/0088_plaza_del_pase_a_quien_ya_esta.sql', 'utf8').replace(/&/g, '&amp;').replace(/</g, '&lt;')
const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Repaso de la tanda V27 · El Dúo y el móvil de Eric</title>
<style>:root{--bg:#FBF6EC;--tx:#1C2230}@media (prefers-color-scheme:dark){:root{--bg:#1C2230;--tx:#FFFDF8}}body{margin:0;padding:16px;background:var(--bg);color:var(--tx);font:16px/1.5 system-ui,sans-serif;max-width:800px}h1{font-size:24px}h2{font-size:19px;margin-top:28px}code{font-size:13px}label{display:block;margin:6px 0}figure{display:inline-block;margin:8px 10px 8px 0;vertical-align:top}figcaption{font-size:12.5px;opacity:.7;max-width:230px}pre{font-size:11.5px;overflow:auto;max-height:340px;background:rgba(128,128,128,.12);padding:10px;border-radius:8px}</style></head><body>
<h1>V27 · El Dúo de Alicia y lo que vio Eric en su móvil</h1>
<p>Probado con <code>pruebaV27</code> (39 comprobaciones, 0 fallos: la base de datos real con todas las migraciones, las reglas y la app en móvil de 375 px), <code>pruebaJutrip</code>, <code>pruebaV17</code>, <code>V18</code>, <code>V19</code>, <code>V24</code> y las del pase en 0. Ninguna prueba toca producción.</p>
<h2>1. Por qué no le llegó el Dúo a Alicia</h2>
<p><b>La causa (comprobada en <code>canjear_invitacion</code>, migración 0047):</b> Alicia YA estaba en el viaje. La función mira primero «¿ya estás en el viaje?» y, si sí, devolvía <code>ya_estaba</code> y se iba <b>sin meterla en el pase</b>, aunque la invitación llevara el pase. Por eso le salió «Lo de ayer también cuenta» pero siguió con los candados, y a Eric le salía «Plaza libre».</p>
<p><b>Lo que hace ahora:</b> si ya estás en el viaje y el código lleva un pase con plaza libre, te mete en el pase (y gasta una plaza); si ya estás en el pase, o eres quien lo compró, no hace nada (no se duplica: Eric ya la había metido a mano y consta 2 de 2). Además, <b>sin código</b>: en «Mis pases» y en la hoja del pase sale «Dar la plaza a…» con las personas del viaje que aún no tienen plaza, y un toque. A su móvil le llega el pase sin cerrar la app (aviso pequeño del viaje + vuelve a preguntar al volver a la app).</p>
<p><b>No se confunden:</b> el código de la plaza del pase va en el azul oscuro y dorado del pase (código, botón [Compartir la plaza] y el mensaje «Eric te regala una plaza de su Pase Lanzarote»); el código para unirse a un viaje sigue con los colores de siempre.</p>
${fig('hoja_invitar_azul', 'La hoja del pase')}${fig('mis_pases_azul', 'Mis pases')}${fig('invitacion_recibida_azul', 'Lo que ve quien recibe el enlace')}
<h2>Las dos pantallas que no tocaban</h2>
<ul><li><b>«Lo de ayer también cuenta»</b> ya no sale sola con el viaje terminado, y nunca enseña huecos de colores vacíos (solo las paradas con foto).</li>
<li><b>«Guarda un recuerdo de Cueva de los Verdes»</b> se abría sola porque un [Visto] que llegaba del móvil de Eric (viaje compartido) se trataba como un toque de Alicia. Ahora lo que llega de otro móvil no abre nada, y con el viaje terminado tampoco.</li></ul>
<h2>2. Lo que vio Eric en el móvil de Alicia</h2>
<ol><li><b>Días «Hecho» sin gris:</b> solo el ✓ verde y «Hecho · …».</li>
<li><b>Alineados:</b> el asa ya no asoma por la izquierda (va dentro de la tarjeta, junto al menú): todos los días tienen el mismo borde y ancho que el alojamiento y el vehículo (14 px y 347 px, medido).</li>
<li><b>Sin «Sin reservar»</b> en un día «Hecho».</li>
<li><b>El jueves 12:</b> en la ruta guardada eran DOS días de excursión, el 4 (miércoles 11) y el 5 (jueves 12), los dos con <code>diaEscritoId: DG</code> y el nombre «La Graciosa (excursión)»; el 6 (viernes 13) es un día a mano «Dia 2 Lunes». El jueves es un día cambiado por la excursión sin ninguna elegida. Ahora el segundo se llama «Excursión desde Arrecife».</li>
<li><b>El «9 – 13 NOV»:</b> salía de una de las dos copias propias de Alicia (id 3157cdb3, fechas 9–13 nov, 5 días), que la 0084 ya borró (queda copia en <code>respaldo_v17_trips</code>). El viaje compartido es del 8 al 13.</li>
<li><b>La Graciosa sin foto:</b> los viajes guardados llevaban las excursiones solo con el nombre (foto vacía, precio 0). Ahora se completan con la ficha real de Civitatis (foto, desde 74 €, 9,1/10, 2.332 opiniones, cancelación) y, si no hay, con nuestra <code>la_graciosa.jpg</code>; nunca el degradado vacío. Igual en Roma (<code>public/datos/excursiones.json</code>).</li>
<li><b>La franja blanca:</b> era el hueco entre una parada y la comida que solo llevaba «+ Añadir parada»; con el día «Hecho» (o para quien solo mira) ese botón se esconde y quedaba la franja vacía. Ahora el hueco desaparece con su botón.</li></ol>
${fig('dias_hecho_alineados', 'Días «Hecho» alineados, sin gris')}${fig('dia_excursion_abierto', 'La excursión con foto, desde, nota y opiniones')}
<h2>El SQL que tienes que pegar (en este orden, cada una entera)</h2>
<p>0087 (avisos pequeños, ya subida) y después esta 0088. Su comprobación, en un solo resultado: <code>docs/dias/COMPROBAR_0088.sql</code> (tiene que decir «Aplicada»).</p>
<pre>${sql}</pre>
<h2>Lista de comprobación de ESTA tanda</h2>
<label><input type="checkbox"> Pegada la 0088 y su comprobación dice «Aplicada»</label>
<label><input type="checkbox"> Alicia (ya en el pase): sus candados abiertos sin cerrar la app</label>
<label><input type="checkbox"> En «Mis pases»: «Dar la plaza a…» con alguien del viaje sin plaza, en azul y dorado</label>
<label><input type="checkbox"> Un viaje terminado: no salen «Lo de ayer…» ni «Guarda un recuerdo…»</label>
<label><input type="checkbox"> Días «Hecho» sin gris, alineados con el alojamiento, sin «Sin reservar»</label>
<label><input type="checkbox"> La Graciosa con foto; el jueves 12 ya no se llama como el miércoles</label>
<label><input type="checkbox"> Sin franja blanca entre «Mirador del Río» y «Comida»</label>
</body></html>`
fs.writeFileSync('docs/dias/REPASO_V27.html', html)
console.log('docs/dias/REPASO_V27.html', Math.round(html.length / 1024), 'KB')
