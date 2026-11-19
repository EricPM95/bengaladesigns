// Genera docs/dias/REPASO_V16.html (después de pruebaV16, que saca las capturas en docs/dias/V16_capturas): node scripts/destino/generarRepasoV16.mjs
import fs from 'node:fs'

const img = (n) => (fs.existsSync(`docs/dias/V16_capturas/${n}.jpg`) ? `data:image/jpeg;base64,${fs.readFileSync(`docs/dias/V16_capturas/${n}.jpg`).toString('base64')}` : null)
const fig = (n, pie) => `<figure>${img(n) ? `<img alt="${pie}" src="${img(n)}">` : '<div class="no">sin captura</div>'}<figcaption>${pie}</figcaption></figure>`
const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Repaso de la tanda V16 · Fotos de logros, El Golfo y Famara</title>
<style>:root{--bg:#FBF6EC;--tx:#1C2230;--bd:rgba(28,34,48,.15)}@media (prefers-color-scheme:dark){:root{--bg:#1C2230;--tx:#FFFDF8;--bd:rgba(255,253,248,.2)}}body{margin:0;padding:16px;background:var(--bg);color:var(--tx);font:15px/1.5 system-ui,sans-serif;max-width:900px;margin-inline:auto}h1{font:400 30px/1.1 Georgia,serif}h2{font:400 22px/1.2 Georgia,serif;margin-top:28px;border-top:1px solid var(--bd);padding-top:14px}figure{margin:8px 10px 8px 0;display:inline-block;vertical-align:top;max-width:300px}img{max-width:100%;height:auto;border:1px solid var(--bd);border-radius:10px}figcaption{font-size:12px;opacity:.7}.no{padding:30px;border:1px dashed var(--bd)}label{display:block;margin:6px 0}code{font-size:12.5px;background:rgba(127,127,127,.15);padding:1px 4px;border-radius:4px}li{margin:3px 0}</style></head><body>
<h1>Las fotos de los logros, «Yo también estaba» y El Golfo y Famara (V16)</h1>
<p>Probado con <code>pruebaV16</code> (nueva), <code>pruebaJutrip</code>, <code>pruebaV7</code>, <code>pruebaV14</code>, <code>pruebaV15</code> y las de Lanzarote que nombran estos sitios. Ninguna prueba toca el Supabase de producción.</p>

<h2>1. Por qué no salían tus fotos (lo que he comprobado en el código)</h2>
<ul>
<li><b>Es como pensabas:</b> el servidor guarda la foto de cada hecho en <code>foto_id</code>, pero la app <b>nunca lo mandaba</b> (<code>enviarFotoDeGaleria</code> y <code>enviarFotoDeLaCamara</code> lo aceptan y ninguna llamada se lo pasa). Todos los hechos con foto se guardaban con <code>foto_id = null</code>.</li>
<li><b>Las fotos sí se guardan, pero aparte:</b> [Reclamar con tus fotos] y la cámara las suben al álbum del viaje (<code>trip_photos</code>, las «6 fotos») <b>después</b> de mandar el hecho (la de la cámara, desde una cola del móvil). Nunca se unían.</li>
<li><b>Dónde más se usa <code>foto_id</code>:</b> (1) <code>fotosDeSitios</code> → la pantalla de la colección por dentro, la pestaña «Logros» de la ficha y la portada del resumen («un sitio con logro»), todas por <code>/api/logros/coleccion</code>; (2) <code>companeroPendientes</code> (la foto del compañero, ya quitada). No hay más.</li>
<li><b>Los números de producción</b> (cuántos hechos con foto, cuántos con <code>foto_id</code>, cuántos se podrán unir): no los he leído (no tengo tu sesión). Los da <code>docs/dias/DIAGNOSTICO_FOTOS_V16.sql</code> (solo <code>select</code>, una fila).</li>
</ul>

<h2>2. El arreglo</h2>
<p><b>Unir cada hecho con su foto, en el servidor</b> (<code>unirFotos</code>): para cada hecho con foto sin <code>foto_id</code>, se busca la foto de la <b>misma persona</b> cuya fecha y hora de cámara (<code>trip_photo_meta.taken_at</code>) coincide con la del hecho (el instante del hecho <i>es</i> la hora de toma de esa foto). Se une <b>solo si hay UNA</b> foto que cuadre; si hay dudas (dos fotos con la misma hora) o ninguna, se queda sin unir. Varios hechos de una misma foto la comparten. Una foto de otra cuenta nunca se une. Se hace sola: al abrir la app, justo después de subir una foto al álbum (galería, [Reclamar con tus fotos], cámara) y al pedir las fotos de una colección. Es lo que une también <b>los hechos que ya había</b>, sin SQL. La misma foto subida dos veces no se duplica (regla de la V12): la unión va por la fecha de cámara, así que apunta a la que ya estaba.</p>
<p><b>Dónde se enseña lo tuyo:</b> la colección por dentro, la pestaña «Logros» de la ficha y la portada del resumen usan tu foto si lo ganaste con foto; si no, la del sitio de nuestros datos (la misma regla de la V9 y la V14), nunca un cuadrado liso.</p>

<h2>2b. «Yo también estaba»: siempre la foto del sitio de la app</h2>
<p>Ya no se enseña la foto del compañero. El servidor <b>deja de pedirla</b> (ni <code>repo.fotoUrl</code> ni direcciones firmadas de fotos de otra cuenta) y manda la ciudad del destino; la app pone la foto del sitio de nuestros datos en la tarjeta Y0, en Y1 (la foto grande) y en Y2 (la lista). Fuera «Foto de Alice».</p>
${fig('y0_tarjeta', 'Y0: la tarjeta')}${fig('y2_lista', 'Y2: la lista')}${fig('y1_sitio', 'Y1: la foto grande, sin «Foto de …»')}

<h2>3. El panel, solo para administradores</h2>
<p><code>?admin=logros</code>, <code>/api/logros/version</code> y <code>?pasos=1</code> solo para los correos de administrador. Con cualquier otra cuenta: el panel no se abre (vuelve a la app) y el parámetro no existe.</p>

<h2>3b. El Golfo y Famara, otra vez UN solo sitio cada uno</h2>
<ul>
<li><b>El id:</b> el de la parada (<code>el_golfo_y_el_charco_de_los_clicos</code>, <code>caleta_de_famara_y_playa_de_famara</code>): es el que dio menos trabajo (el nombre, la foto y la coordenada de la parada ya existían).</li>
<li><b>Cada uno sigue en TODAS sus colecciones, en el hueco que tenía cada parte:</b> El Golfo en Imprescindibles, Playas y charcos y Pueblos con alma; Famara en Playas y charcos y Pueblos con alma. Ninguna insignia cambia de número de trozos (Imprescindibles 7, Playas y charcos 7, Pueblos 6); las insignias por partes de la V13 se regeneran y siguen cuadrando.</li>
<li><b>El radio:</b> cada sitio mide desde el <b>punto medio</b> de sus dos partes (700 m el Golfo, 990 m Famara), así que vale una foto hecha en el pueblo, en el charco o en la playa. <b>Un Visto en la parada</b> da el sitio entero. El emblema «El charco verde» sigue en El Golfo.</li>
<li><b>Lo que ya tenga alguien</b> de los ids viejos pasa al sitio nuevo sin perder ni duplicar: <code>supabase/migrations/0082_golfo_y_famara_un_sitio.sql</code> (una sola fila de resultado) y <code>docs/dias/COMPROBAR_0082.sql</code> (todo a 0). Un «Visto» sin parada con dos ids viejos del mismo viaje no se puede juntar (chocaría con su índice único): se queda como está y el resultado lo cuenta.</li>
<li><b>Repasado:</b> los datos de logros (sitios, colecciones, emblema, momentos, <code>sitios_extra</code>, <code>sitios_de_parada</code>), <code>partes.ts</code> y las pruebas que nombraban los ids viejos.</li>
</ul>

<h2>Lo que queda por hacer o por mirar</h2>
<ul><li>Aplicar la migración <b>0082</b> y pasar su COMPROBAR.</li>
<li>Pasar <code>DIAGNOSTICO_FOTOS_V16.sql</code>: dirá cuántos hechos viejos se unen solos y cuántos se quedan sin unir.</li></ul>

<h2>Lista de comprobación de ESTA tanda</h2>
<label><input type="checkbox"> Reclamar con tus fotos y, después, la colección por dentro enseña TU foto en los sitios ganados</label>
<label><input type="checkbox"> La pestaña «Logros» de una parada: tu foto o la del sitio, nunca un cuadrado liso</label>
<label><input type="checkbox"> «Yo también estaba»: tarjeta, hoja de un sitio y lista con la foto del sitio de la app; sin «Foto de …»</label>
<label><input type="checkbox"> El panel <code>?admin=logros</code> no se abre con la cuenta de Alicia</label>
<label><input type="checkbox"> El Golfo y Famara: un solo sitio en la colección, que se gana con una foto en el pueblo, en el charco o en la playa</label>
<label><input type="checkbox"> Las insignias de Lanzarote siguen con 7, 7 y 6 trozos</label>
</body></html>`
fs.writeFileSync('docs/dias/REPASO_V16.html', html)
console.log('docs/dias/REPASO_V16.html', Math.round(html.length / 1024), 'KB')
