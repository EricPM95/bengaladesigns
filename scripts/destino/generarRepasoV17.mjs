// Genera docs/dias/REPASO_V17.html (después de pruebaV17 --navegador, que saca las capturas en docs/dias/capturas_jutrip): node scripts/destino/generarRepasoV17.mjs
import fs from 'node:fs'

const img = (n) => (fs.existsSync(`docs/dias/capturas_jutrip/${n}.jpg`) ? `data:image/jpeg;base64,${fs.readFileSync(`docs/dias/capturas_jutrip/${n}.jpg`).toString('base64')}` : null)
const fig = (n, pie) => `<figure>${img(n) ? `<img alt="${pie}" src="${img(n)}" style="max-width:260px;border-radius:12px">` : '<div>sin captura</div>'}<figcaption>${pie}</figcaption></figure>`
const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Repaso de la tanda V17 · Alicia y Mis viajes</title>
<style>:root{--bg:#FBF6EC;--tx:#1C2230;--bd:rgba(28,34,48,.15)}@media (prefers-color-scheme:dark){:root{--bg:#1C2230;--tx:#FFFDF8;--bd:rgba(255,253,248,.2)}}body{margin:0;padding:16px;background:var(--bg);color:var(--tx);font:16px/1.5 system-ui,sans-serif;max-width:760px}h1{font-size:24px}h2{font-size:19px;margin-top:28px}code{font-size:13px}label{display:block;margin:6px 0}figure{display:inline-block;margin:8px 12px 8px 0;vertical-align:top}figcaption{font-size:13px;opacity:.7}</style></head><body>
<h1>Alicia y «Mis viajes» (V17)</h1>
<p>Probado con <code>pruebaV17</code> (nueva, 46 comprobaciones, 0 fallos: base de datos de verdad, reglas de apertura, código y un Chrome), <code>pruebaJutrip</code>, <code>pruebaV12</code>, <code>pruebaV15</code>, <code>pruebaV16</code> y las viejas que nombraban la pantalla quitada (10F, 10K, Logros2, Pantallas8b, Tanda7_mover).</p>

<h2>1. Con todos los viajes hechos, la app abre el Perfil</h2>
<ul>
<li><b>Antes:</b> si todos los viajes ya habían pasado, la app abría la pantalla vieja «Mis viajes». <b>Ahora abre el Perfil</b> (sobre el último viaje que tocó), con <b>«Crear un viaje»</b> en un botón grande marrón justo debajo del título «Mis viajes» (solo sale cuando no hay ningún viaje por delante; el «+» de siempre sigue).</li>
<li><b>Caminos que abrían la pantalla vieja: uno solo</b> (<code>TripSync.tsx</code>, la rama «todos sus viajes ya pasaron»). Eliminar un viaje, salir de uno o no tener red no la abrían: usan el Perfil y la pantalla de crear viaje. Como ya no la abría nadie más, <b>la he quitado</b> (<code>MyTripsScreen</code> y su <code>TripCard</code>) y también el tipo «myTrips»; ningún archivo de <code>src/</code> la nombra.</li>
<li>Las reglas 0 (generación a medias), 1 (hoy es día de viaje), 2 (viaje por delante) y 4 (ningún viaje) no han cambiado: la prueba las comprueba.</li>
</ul>
${fig('v17_perfil_todo_hecho', 'El Perfil con todos los viajes hechos')}

<h2>2. Los tres viajes de Alicia a Lanzarote (lo que se sabe, sin leer producción)</h2>
<ul>
<li><b>El compartido</b> <code>4d3e6c59…</code>: es el viaje de Eric; Alicia es miembro (invitada) desde el 7 de noviembre.</li>
<li><b>Dos copias suyas</b> (<code>3157cdb3…</code>, del 9 al 13, y <code>1a54ced6…</code>, del 8 al 13): son viajes PROPIOS de Alicia al mismo destino, con fechas que se pisan con el compartido. Cada copia tiene su propio id de ruta, así que sus fotos, Vistos y logros quedaron colgando de <b>su copia</b> y no del compartido: por eso veía tres viajes y «Yo también estaba» y las fotos se repartían entre ellos.</li>
<li><b>Cuándo y cómo se crearon, y qué tiene cada uno:</b> no lo puedo leer (no tengo sesión de producción). Pega <code>docs/dias/V17_ALICIA_DETALLE.sql</code> (solo lectura): da, de los tres, el último cambio, las fechas y cuántas fotos, hechos, logros, Vistos y gente invitada tiene cada uno.</li>
<li><b>Papelera del compartido:</b> un miembro que toca la papelera del viaje compartido <b>solo sale</b> (se quita su fila de miembro, «Salir de este viaje»); el viaje de Eric sigue entero. Probado con la base de datos de verdad, y la base no deja borrar la fila de otro dueño aunque se intentase.</li>
</ul>

<h2>3. El arreglo de Alicia (SQL, para que lo pegues tú)</h2>
<ul>
<li><b>Migración 0083</b> (<code>juntar_viaje_propio</code>): dos funciones. Es lo que usa también la pregunta de la parte 4.</li>
<li><b>Migración 0084</b> (<code>alicia_un_solo_viaje</code>): primero guarda una <b>copia de seguridad</b> (tablas <code>respaldo_v17_*</code>: los 3 viajes y las fotos, hechos, logros y Vistos de las copias); luego pasa lo de Alicia de sus dos copias al compartido <b>sin duplicar</b> (la foto que esté en las dos copias o el Visto repetido se quitan; cada foto cae en el <b>mismo día por fecha</b> del compartido) y borra <b>solo sus dos copias</b>, nunca el compartido. Todo en una transacción.</li>
<li><b>Si hay duda, PARA y no toca nada</b> (error con el motivo): copias con invitados, gastos, billetes personales o reservas de invitado, o una foto en un día que el compartido no tiene.</li>
<li><b>Orden:</b> 0083, su <code>COMPROBAR_0083.sql</code>, 0084, su <code>COMPROBAR_0084.sql</code> (una fila: viajes a Lanzarote de Alicia = 1, copias que quedan = 0, nada perdido). Los archivos de las fotos repetidas se quedan sin fila y los recoge la limpieza.</li>
<li>Probado con la base de datos de verdad: el SQL de la 0084, con los ids cambiados por los de la prueba, corre entero y su COMPROBAR sale bien.</li>
</ul>

<h2>4. Al unirte con un viaje propio que se pisa: «¿Lo juntamos?»</h2>
<p>Al unirte a un viaje compartido (con código o con enlace), si ya tienes un viaje <b>propio</b> al mismo destino con algún día en común, sale: «Ya tienes un viaje a Lanzarote en esas fechas. ¿Lo juntamos con el de Eric?». <b>[Juntarlos]</b> pasa tus fotos y logros al compartido y quita tu copia; <b>[Dejarlos separados]</b> no toca nada y no vuelve a preguntar por ese par.</p>
${fig('v17_juntar', 'La pregunta')}
<p><b>Cuántas cuentas más están como Alicia:</b> no lo puedo leer. Pega <code>docs/dias/V17_CUANTAS_CUENTAS.sql</code> (solo lectura): da el número de cuentas y el detalle.</p>

<h2>Lo que queda por hacer</h2>
<ul><li>Pegar <b>0083</b> + COMPROBAR_0083, mirar con <code>V17_ALICIA_DETALLE.sql</code>, pegar <b>0084</b> + COMPROBAR_0084 y pasar <code>V17_CUANTAS_CUENTAS.sql</code>.</li><li>Sin aplicar la 0083, [Juntarlos] avisa de que no se ha podido y no cambia nada.</li></ul>

<h2>Lista de comprobación de ESTA tanda</h2>
<label><input type="checkbox"> Una cuenta con todos los viajes hechos abre en el Perfil, con «Crear un viaje» a la vista</label>
<label><input type="checkbox"> «Crear un viaje» lleva a elegir destino</label>
<label><input type="checkbox"> Papelera de un viaje compartido: «Salir de este viaje»; el viaje de Eric sigue</label>
<label><input type="checkbox"> Al unirte a un viaje con uno tuyo que se pisa: sale la pregunta con [Juntarlos] y [Dejarlos separados]</label>
<label><input type="checkbox"> Tras [Juntarlos]: queda un solo viaje y están tus fotos y logros</label>
<label><input type="checkbox"> Alicia: tras 0083 y 0084, un solo viaje a Lanzarote y todas sus fotos</label>
</body></html>`
fs.writeFileSync('docs/dias/REPASO_V17.html', html)
console.log('docs/dias/REPASO_V17.html', Math.round(html.length / 1024), 'KB')
