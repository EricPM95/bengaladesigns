// Genera docs/dias/REPASO_V21.html (después de pruebaV21, que saca las capturas en docs/dias/V21_capturas): node scripts/destino/generarRepasoV21.mjs
import fs from 'node:fs'

const img = (n) => (fs.existsSync(`docs/dias/V21_capturas/${n}.jpg`) ? `data:image/jpeg;base64,${fs.readFileSync(`docs/dias/V21_capturas/${n}.jpg`).toString('base64')}` : null)
const fig = (n, pie) => `<figure>${img(n) ? `<img alt="${pie}" src="${img(n)}" style="max-width:230px;border-radius:12px">` : '<div>sin captura</div>'}<figcaption>${pie}</figcaption></figure>`
const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Repaso de la tanda V21 · Página del destino</title>
<style>:root{--bg:#FBF6EC;--tx:#1C2230}@media (prefers-color-scheme:dark){:root{--bg:#1C2230;--tx:#FFFDF8}}body{margin:0;padding:16px;background:var(--bg);color:var(--tx);font:16px/1.5 system-ui,sans-serif;max-width:800px}h1{font-size:24px}h2{font-size:19px;margin-top:28px}code{font-size:13px}label{display:block;margin:6px 0}figure{display:inline-block;margin:8px 10px 8px 0;vertical-align:top}figcaption{font-size:12.5px;opacity:.7;max-width:230px}table{border-collapse:collapse;font-size:14px}td,th{border:1px solid rgba(128,128,128,.35);padding:4px 8px;text-align:left}</style></head><body>
<h1>La página del destino, con actividades y hoteles (V21)</h1>
<p>Probado con <code>pruebaV21</code> (39 comprobaciones), <code>pruebaJutrip</code> y las de RUTA, alojamiento y Civitatis que tocaban la página.</p>

<h2>1. El fallo de «3 noches» (del 25 al 29)</h2>
<p>La página decía «3 noches (Mié, 25 nov – Dom, 29 nov)»: usaba <code>segment.nights</code> (los días que tiene guardados la ruta, que podía llevar uno de menos), mientras que la tarjeta de RUTA cuenta desde la V15 con las fechas del viaje. <b>Ahora las dos usan la misma función</b> (<code>resumenDelTramo</code> en <code>RouteOverview.tsx</code>): del 25 al 29 sale <b>«5 días · 4 noches · 25 nov – 29 nov»</b> en la tarjeta y en la página (probado). <b>Otros sitios con su propia cuenta:</b> RESERVAS, el presupuesto y «Tu alojamiento» usan <code>segment.nights</code> para las <i>noches de alojamiento por tramo</i> (otra cosa: noches que se pagan en cada sitio); las dejo como están. La tarjeta y la página ya no pueden decir cosas distintas.</p>

<h2>2. La página nueva (D1 a D3)</h2>
<ul><li><b>D1:</b> foto grande (la del destino o, si no hay, la de su primera parada o el degradado), bandera, nombre y «5 días · 4 noches · 25 nov – 29 nov».</li>
<li><b>D2 «Actividades en …»:</b> las de Civitatis del destino, <b>de más a menos opiniones</b>, solo de nota 8,5 o más y sin repetir el tipo; cada una con foto, nota, opiniones, duración y «desde X €» o «Gratis»; <b>toda la tarjeta se toca</b> (se hunde un poco) y abre la actividad en Civitatis con nuestro enlace de afiliado, fuera de la app; al final [Ver todas las actividades].</li>
<li><b>D3 «Alojamientos en …»:</b> «Tu alojamiento» arriba si ya lo tienes (y las actividades pasan a lista, como D2 de Design), «Otras opciones» con los hoteles (uno por zona, con zona, nota, opiniones y «Mejor nota de …», sin precio y sin botón: toda la tarjeta abre ese hotel con su enlace de Stay22) y al final [Ver todos en el mapa] (la pantalla de alojamiento de siempre).</li>
<li>Fuera los botones azul Booking y rojo Civitatis de esta página (comprobado).</li></ul>
${fig('D1_pagina', 'D1 · arriba y actividades')}${fig('D3_hoteles', 'D3 · dónde dormir')}${fig('D2_con_alojamiento', 'Con alojamiento')}
<p><b>Capturas al lado de Design:</b> el diseño está en <code>docs/diseno/proyecto/Destino Pagina.dc.html</code> (ábrelo en el navegador para ponerlo al lado; no he podido sacar su captura desde aquí).</p>

<h2>3. Los hoteles (<code>data/dias/&lt;destino&gt;/_hoteles.json</code>)</h2>
<table><tr><th>Zona</th><th>Hotel</th><th>Nota de hoy (Booking, 19-nov)</th></tr>
<tr><td>Centro Histórico</td><td>Torre Argentina Relais</td><td>9,3 · 1.552</td></tr>
<tr><td>Trastevere</td><td>Nikis Collection Trastevere</td><td>9,1 · 1.039</td></tr>
<tr><td>Prati – Vaticano</td><td>Polinari Rooms San Pietro</td><td>9,4 · 534</td></tr>
<tr><td>Monti</td><td>Casa Cleo</td><td>9,6 · 835</td></tr>
<tr><td>Plaza de España</td><td>Spagna Boutique</td><td>9,6 · 932</td></tr>
<tr><td>Zona Coliseo</td><td>Colosseo Relais</td><td>9,2 · 874</td></tr>
<tr><td>Termini</td><td>Evergreen</td><td>9,2 · 618</td></tr>
<tr><td>Puerto del Carmen (Lanzarote)</td><td>La Isla y el Mar, Hotel Boutique</td><td>9,1 · 744</td></tr>
<tr><td>Puerto del Carmen (Lanzarote)</td><td>SENTIDO Aequora Lanzarote Suites</td><td><b>8,7 · 1.649 (baja de 9: aviso)</b></td></tr></table>
<ul><li><b>Notas de hoy:</b> entré en la ficha de Booking de cada hotel y puse la nota y las opiniones de hoy. <b>El script</b> <code>node scripts/destino/notasHoteles.mjs</code> las vuelve a mirar (abre cada ficha con un Chrome sin ventana, una a una) y avisa si algún hotel baja de 9: pásalo antes de cada tanda de destino. Todos los de Roma siguen en 9 o más.</li>
<li><b>Lanzarote: solo he podido identificar 2 de los 5.</b> Los enlaces de Stay22 <b>2</b> (La Isla y el Mar) y <b>5</b> (Aequora) abren la ficha de su hotel; el <b>1</b> (Playa Blanca), el <b>3</b> (Costa Teguise) y el <b>4</b> solo abren una <i>búsqueda por zona</i> de Booking y no dicen qué hotel es. Quedan guardados con <code>pendiente: true</code> y <b>no salen en la página</b> hasta que me digas cuáles son (ver «PARA ERIC»).</li></ul>

<h2>4. Los enlaces de afiliado y las fotos</h2>
<ul><li><b>Hoteles:</b> tus enlaces de Stay22 tal cual. <b>Stay22 SÍ deja añadir las fechas y las personas</b> al enlace corto (probado: <code>?checkin=…&amp;checkout=…&amp;adults=2</code> llega a Booking como <code>checkin</code>, <code>checkout</code> y <code>group_adults</code>): la app los añade con las fechas del tramo del viaje (y 1 o 2 personas si viaja solo o en pareja; si no se sabe, sin personas).</li>
<li><b>Actividades:</b> enlaces de Civitatis con nuestro afiliado de siempre (aid 5206).</li>
<li><b>Fotos:</b> las actividades llevan su foto de Civitatis. <b>Los hoteles no llevan foto todavía:</b> las de Booking no se pueden copiar y no he podido comprobar desde aquí si Stay22 las da con permiso; mientras, cada tarjeta sale con un degradado. En <code>_hoteles.json</code> cada hotel lleva <code>foto: null</code> y <code>permiso: pendiente</code>.</li></ul>

<h2>5. Lo que no ha cabido</h2>
<ul><li><b>Roma solo tiene 5 actividades que cumplan la regla</b> (nota 8,5 o más y sin repetir tipo): Tívoli, Florencia y Pisa, Nápoles y Pompeya, Venecia y Ostia Antica. Los datos de Roma de entradas y visitas no traen nota ni opiniones, y con la API de consulta encendida habría más. Lanzarote sale con 7.</li></ul>

<h2>Para ti (Eric)</h2>
<ul><li>Decirme <b>qué hoteles son</b> los enlaces 1, 3 y 4 de Lanzarote (o generar el enlace desde la ficha del hotel).</li>
<li><b>Aequora</b> está en 8,7: ¿lo dejo?</li>
<li><b>Fotos de los hoteles:</b> mirar con Stay22 si dan las fotos con permiso; si no, pedir permiso a cada hotel para usar la foto de su web (lista de los 9 hoteles en «PARA ERIC» del resumen).</li></ul>

<h2>Lista de comprobación de ESTA tanda</h2>
<label><input type="checkbox"> Con el viaje del 25 al 29: la tarjeta de RUTA y la página del destino dicen «5 días · 4 noches»</label>
<label><input type="checkbox"> La página de Roma enseña actividades de más a menos opiniones, todas de 8,5 o más</label>
<label><input type="checkbox"> Tocar una actividad abre Civitatis fuera de la app y la página sigue donde estaba</label>
<label><input type="checkbox"> Los 7 hoteles de Roma abren su enlace de Stay22 (con las fechas del viaje)</label>
<label><input type="checkbox"> Con alojamiento puesto: «Tu alojamiento» arriba y «Otras opciones»</label>
<label><input type="checkbox"> No hay botones azul ni rojo en la página</label>
</body></html>`
fs.writeFileSync('docs/dias/REPASO_V21.html', html)
console.log('docs/dias/REPASO_V21.html', Math.round(html.length / 1024), 'KB')
