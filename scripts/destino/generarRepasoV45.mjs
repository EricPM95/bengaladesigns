// Genera docs/dias/REPASO_V45.html con las capturas de docs/dias/V45_capturas (app, tamaño iPhone) y de docs/dias/V45_design (los dibujos de Design) y lo que hay que mirar.
import fs from 'node:fs'
const hay = (n) => fs.existsSync(`docs/dias/V45_capturas/${n}.jpg`)
const fig = (n, texto) => (hay(n) ? `<figure><img src="V45_capturas/${n}.jpg" alt="${texto}"><figcaption>${texto}</figcaption></figure>` : `<p class="falta">(Sin captura: ${texto})</p>`)
const par = (a, d, texto) => `<div class="par">${fig(a, 'Antes')}${fig(d, 'Después')}</div><p class="peq">${texto}</p>`
const dib = (n, texto) => (fs.existsSync(`docs/dias/V45_design/${n}.jpg`) ? `<figure class="ancha"><img src="V45_design/${n}.jpg" alt="${texto}"><figcaption>${texto}</figcaption></figure>` : '')
const resultados = ['a', 'd', 'e', 'f', 'g', 'h', 'i'].map((x) => (fs.existsSync(`docs/dias/_pruebasV45_${x}.txt`) ? fs.readFileSync(`docs/dias/_pruebasV45_${x}.txt`, 'utf8') : '')).join('')
const html = `<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>REPASO V45</title><style>body{font:15px/1.5 system-ui,sans-serif;max-width:980px;margin:24px auto;padding:0 16px;color:#1C2230;background:#FBF6EA}h1{font-size:26px}h2{margin-top:34px;border-top:2px solid #C9A24A;padding-top:12px}figure{margin:10px 14px 10px 0;display:inline-block;vertical-align:top;max-width:300px}figure img{width:100%;border:1px solid #d8cfb8;border-radius:10px}figure.ancha{max-width:100%;display:block}figcaption{font-size:12.5px;color:#6a6657}.par{display:flex;gap:10px;flex-wrap:wrap}.peq{font-size:13px;color:#555}.falta{color:#a33}pre{background:#fff;padding:12px;border-radius:8px;overflow:auto;font-size:12px}li{margin:4px 0}</style>
<h1>V45 · RESERVAS (vuelo, alojamiento, entradas y excursiones) y los avisos de toda la app</h1>
<p>Lo que no he podido hacer o necesita una decisión tuya está en <code>docs/dias/DECISIONES_V45.md</code>. Capturas en tamaño iPhone (390 × 844). Los dibujos de Design (ULTIMO) están copiados en <code>docs/diseno/proyecto/</code>.</p>

<h2>Tu lista de comprobación de esta tanda</h2>
<ol>
<li>RESERVAS › Llegada y vuelta: cada vuelo guardado se ve <b>abierto</b>, con el QR gris «+» y «+ Añade tu tarjeta de embarque».</li>
<li>Con la vuelta sin poner: una línea «Falta añadir la vuelta» (sin QR) que abre la hoja en «Vuelta».</li>
<li>Una tarjeta de embarque de otro día: línea naranja <b>dentro de la tarjeta</b> con [Es correcta]; no sale ventana ni aviso que se va.</li>
<li>Entrada, excursión y alojamiento guardados: icono gris con «+» junto al lápiz y botón de borde «+ Sube tu entrada» / «+ Sube tu reserva» / «+ Añade tu reserva».</li>
<li>La hoja «Elige día y hora»: sin [Añadir tu entrada] ni «Rellenar desde el email o el PDF»; en grupo, dos pasos («Casi lista»).</li>
<li>El contador «X de Y reservadas» sube al <b>guardar</b>, no al subir el documento.</li>
<li>Excursiones y actividades: [Ver todas] abre la página de <b>todas</b> (no EXPLORAR); en Lanzarote están las 7 del carrusel y más.</li>
<li>El mapa del alojamiento: «Pon tu alojamiento en el mapa», la búsqueda solo de la ciudad y el mapa pequeño con la dirección y [Cambiar].</li>
<li>HOY: a las 22:35 la comida del mediodía ya no sale en «Tu día».</li>
</ol>

<h2>1 · El vuelo</h2>
<p>Antes la ida salía plegada en una línea y no se veía [Añadir tarjeta de embarque]. Ahora cada vuelo guardado se ve abierto: las horas grandes, el trayecto, el lápiz, el QR y, sin tarjeta, «+ Añade tu tarjeta de embarque».</p>
${fig('v45_vuelo', 'Ida y vuelta abiertas, con el QR gris')}
${fig('v45_sin_vuelta', 'Sin vuelta: «Falta añadir la vuelta», sin QR')}
${fig('v45_aviso_fecha', 'Tarjeta de otro día: línea naranja dentro de la tarjeta')}

<h2>2 · Entradas, excursiones y alojamiento</h2>
<p>El mismo patrón en las tres: icono del documento junto al lápiz (gris con «+» si falta, dorado si está) y un botón de borde abajo mientras falta. Primero se guarda, después se sube.</p>
${fig('v45_entrada', 'Entrada guardada')}
${fig('v45_excursion', 'Excursión guardada')}
${fig('v45_alojamiento', 'Alojamiento: «Listo» con hotel y fechas, y «+ Añade tu reserva»')}

<h2>3 · La hoja «Elige día y hora»</h2>
<p>Viajando solo: días, hora, precio y [Guardar la entrada]. En grupo, dos pasos: días y hora [Siguiente]; después «Casi lista» con «¿A qué cuenta lo sumamos?» y, solo con la cuenta conjunta o del grupo, «¿Quién la ha pagado?».</p>
${fig('v45_hoja_solo', 'Una persona sola')}
${fig('v45_hoja_grupo_paso1', 'En grupo, paso 1')}
${fig('v45_hoja_grupo_paso2', 'En grupo, paso 2')}

<h2>4 · Excursiones y actividades: [Ver todas]</h2>
<p>Antes [Ver todas] abría EXPLORAR con 3 excursiones. Ahora abre la página de todas, con filtros por tipo.</p>
${fig('v45_ver_todas', 'La página de todas las excursiones y actividades (Lanzarote)')}

<h2>5 · El mapa del alojamiento</h2>
<p>Búsqueda con Photon (OpenStreetMap): solo cuando dejas de escribir, solo en la ciudad del viaje. El punto se guarda en el viaje y HOY y «Cómo llegar» cuentan desde ahí. Con la hoja larga del pase, el bloque de dirección queda más abajo que en el dibujo (se ve haciendo scroll).</p>
${fig('v45_mapa_m1_hoja', 'M1 · la hoja con el botón')}
${fig('v45_mapa_m2_busqueda', 'M2 · buscando')}
${fig('v45_mapa_m2_elegido', 'M2 · elegido')}
${fig('v45_mapa_m3_hoja', 'M3 · la hoja con el mapa pequeño')}
${fig('v45_mapa_m3_reservas', 'M3 · la tarjeta de RESERVAS')}

<h2>6 · Lo de la V44 comparado con los dibujos (antes y después)</h2>
<p>Ahora que veo Design, comparé la tarjeta de la parada, el «···» de pendientes y «Activa tu ubicación». La tarjeta de la parada ya coincidía en lo importante (dos cajas, el recuadro punteado, el reproductor azul oscuro). Ajusté el <b>«···» de pendientes</b> (textos y colores del dibujo: Recuperar hoy en verde, Ya lo visité en dorado, Quitar en rojo, sin flechas) y el <b>texto de «Activa tu ubicación»</b>. Una diferencia que dejo: el dibujo tiene [Abrir Ajustes], que una web no puede hacer; se queda [Entendido].</p>
${par('antes_pendientes_menu', 'despues_pendientes_menu', 'El «···» de una parada pendiente')}
${par('antes_sin_ubicacion', 'despues_sin_ubicacion', 'Parada sin ubicación (igual: ya coincidía)')}
${par('antes_lejos', 'despues_lejos', 'Con la ubicación lejos (igual)')}
${par('antes_en_la_ruta', 'despues_en_la_ruta', 'En la ruta (igual)')}
${dib('parada_tarjeta', 'Design: la tarjeta de la parada (T1-T5)')}
${dib('lugares_pendientes', 'Design: lugares pendientes (L1-L4)')}

<h2>7 · El billete con QR (HOY y DÍAS) y lo demás</h2>
<ul>
<li><b>El billete de HOY y DÍAS</b> (Design «Billete QR», Q1-Q4): hecho (QR dorado / gris con «+», franja «Tarjeta de embarque guardada» / «Añade tu tarjeta de embarque»). <b>No he conseguido capturarlo en pantalla</b> (su sitio es el último día de DÍAS y la tarjeta de vuelta de HOY); está verificado por tipos y por la prueba de código.</li>
<li><b>Sitios nuevos de Roma:</b> La Licata, Oppio Caffè y Ciuri Ciuri (coordenadas de OpenStreetMap). El horario de Oppio no es de italia.it (no tiene ficha): decisión tuya.</li>
<li><b>HOY:</b> lo que ya pasó y no es una visita (la comida del mediodía a las 22:35) sale de «Tu día».</li>
</ul>
${dib('billete_qr', 'Design: el billete con su QR a mano')}

<h2>Pruebas</h2>
<pre>${resultados.replace(/</g, '&lt;')}</pre>
</html>`
fs.writeFileSync('docs/dias/REPASO_V45.html', html)
console.log('REPASO_V45.html escrito')
