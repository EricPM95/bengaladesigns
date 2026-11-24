// Genera docs/dias/REPASO_V43.html con las capturas de docs/dias/V43_capturas y lo que hay que mirar.
import fs from 'node:fs'
const hay = (n) => fs.existsSync(`docs/dias/V43_capturas/${n}.jpg`)
const fig = (n, texto) => (hay(n) ? `<figure><img src="V43_capturas/${n}.jpg" alt="${texto}"><figcaption>${texto}</figcaption></figure>` : `<p class="falta">(Sin captura: ${texto})</p>`)
const resultados = fs.existsSync('docs/dias/_pruebasV43.txt') ? fs.readFileSync('docs/dias/_pruebasV43.txt', 'utf8') : ''
const html = `<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>REPASO V43</title><style>body{font:15px/1.5 system-ui,sans-serif;max-width:760px;margin:24px auto;padding:0 16px;color:#1c2230}h1{font-size:26px}h2{margin-top:36px;border-top:1px solid #ddd;padding-top:18px}figure{display:inline-block;margin:8px 10px 8px 0;vertical-align:top;max-width:230px}img{width:230px;border:1px solid #ccc;border-radius:14px}figcaption{font-size:12px;color:#555}.falta{color:#999;font-size:13px}code{background:#f2ecde;padding:1px 4px;border-radius:4px}pre{background:#f6f2e6;padding:10px;border-radius:8px;overflow:auto;font-size:12px}li{margin:3px 0}</style>
<h1>V43 · HOY, «Cambiar plan» y los avisos</h1>
<p>Todo lo que sigue es lo que cambia en la pantalla HOY. Detrás de cada cosa hay una frase en palabras sencillas de <b>qué pasaba</b> y <b>qué pasa ahora</b>. Lo que NO he podido hacer o dejé a medias está en <code>docs/dias/DECISIONES_V43.md</code> (para hablarlo mañana).</p>

<h2>1 · Todas las hojas de «Cambiar plan» ahora son iguales</h2>
<p><b>Antes:</b> cada hoja tenía dos filas («Cambia: …» y «Se mantiene: …»), un botón que decía «Aplicar» y otro de «Volver a mi ruta original». <b>Ahora:</b> el texto de arriba, <b>una sola caja suave</b> (no se pulsa) con una línea e icono por cada cambio, el <b>botón dorado que dice lo que hace</b> («Pasarlo al domingo 18») y, abajo y pequeño, «Dejarlo como está». Nunca se protege una entrada cuya hora ya ha pasado y nunca se quita algo si se puede pasar a otro día.</p>
${fig('v43_menu_cambiar_plan', 'El menú de «Cambiar plan» con los subtítulos nuevos')}
${fig('v43_retraso', '«Voy con retraso» con el formato nuevo')}

<h2>2 · «Voy con retraso» y «Hoy ya no da tiempo a todo»</h2>
<p><b>Qué pasaba:</b> a las 21:19 la app proponía quitar el Panteón para llegar a una entrada de las 10:00 que ya había pasado. <b>Ahora:</b> esa entrada no cuenta; primero se pasa lo que no cabe <b>al mejor día donde quepa</b> (abierto, cerca, sin llenarlo) y con su nombre («Pasamos el Panteón al domingo 18»); con «Ver otra opción», quitarlo (con «Mejor pasarlo al domingo 18»); y si no cabe en ningún día, solo quitarlo («no cabe en ningún otro día de tu viaje»). Con más de una hora de retraso, o al abrir HOY con la mañana pasada sin nada hecho, sale <b>una vez</b> la hoja «Hoy ya no da tiempo a todo».</p>
${fig('v43_ya_no_da_tiempo', '«Hoy ya no da tiempo a todo»')}

<h2>3 · «Quiero comer / cenar ahora»</h2>
<p>El título dice «cenar» desde las 17:00; arriba los filtros de restaurantes de EXPLORAR (<b>Todos</b> enseña solo sitios para comer; gelato, café y aperitivo, solo con su filtro); «Cerca de ti» o «Sin tu ubicación, contamos desde {sitio}»; cada tarjeta con su número, cocina, minutos, precio y «Abierto hasta las 23:00» o «Cierra pronto» en naranja; el botón pasa de «Ir aquí» a «Elegir».</p>
${fig('v43_comer', 'Quiero cenar ahora')}

<h2>4 · Saltar una parada y pasarla a otro día</h2>
<p>Subtítulos nuevos en el menú. Saltar una parada con <b>reserva por llegar</b> pregunta («Tienes reserva a las 10:00 para… Si te lo saltas, puedes perderla.» con «No, lo mantengo» y «Saltarlo igual»); si la reserva ya pasó, no pregunta. «Pasar a otro día» enseña la lista de días con el mejor arriba («Te lo recomendamos») y los días cerrados en gris («Cerrado ese día»), y después solo la mejor forma en ese día, con «Pasarlo al {día}» y «Elegir otro día». <b>Respuesta a tu pregunta:</b> [Ver otra opción] NO cambiaba de día: cambiaba entre «cabe» y «al final, en Si te sobra tiempo» del mismo día. Ahora ya no está ahí.</p>
${fig('v43_pasar_dia', 'La lista de días con el recomendado')}

<h2>5 · «Añadir un sitio cercano»</h2>
<p><b>Qué pasaba:</b> ofrecía sitios que ya estaban ese día (la Piazza Navona salía repetida), sin fotos y a veces cerrados a las 23:50. <b>Ahora:</b> se compara el sitio, no el nombre; solo sale lo abierto ahora según los horarios de los datos (de noche, lo al aire libre que no cierra y lo nocturno); mapa, número, foto, minutos y estado en cada fila; «Contiene recompensa» solo aquí y primero; si hay menos de 3, escalones: sitios de otros días del viaje («Lo tienes el lunes 19», se añaden hoy y el otro día no se toca), más lejos, y de noche los al aire libre; y si no hay nada, «A esta hora no queda nada abierto cerca.» con «Volver al alojamiento» y «Ver Explorar».</p>
${fig('v43_anadir', 'Añadir un sitio cercano: número, foto, minutos y estado')}

<h2>6 · Los avisos</h2>
<p><b>Qué pasaba:</b> «Panteón ya ha cerrado…» se repetía cada vez que cambiabas de pestaña. <b>Ahora:</b> cada aviso sale <b>una vez por viaje, día y sitio</b> (se apunta en el móvil). Los que llevan «Deshacer» tapan el menú de abajo y salen todos en el mismo sitio, con el texto de lo que ha pasado («Piazza Navona, añadida a tu día»); los que no llevan «Deshacer» salen <b>arriba</b>, bajo la cabecera, se van solos a los 5 segundos o deslizándolos, y si hay varios se juntan en uno.</p>
${fig('v43_aviso_cerrado', 'El aviso de «ya ha cerrado» arriba')}
${fig('v43_aviso_deshacer', 'Un aviso con «Deshacer» tapando el menú')}

<h2>7 · «Lugares pendientes»</h2>
<p>Filas compactas con <b>[Otro día]</b> y <b>«···»</b> (Recuperar hoy solo si sigue abierto, Ya lo visité y Quitar en rojo con «Deshacer»). <b>[Pasar todos a otros días]</b>, en azul oscuro con dorado a propósito, enseña antes el resumen: cada uno a su mejor día; los que no caben se quedan en pendientes.</p>
${fig('v43_pendientes', 'Lugares pendientes, filas compactas')}

<h2>8 · La tarjeta de la parada, la ubicación y la lluvia</h2>
<p>El horario dice «Cerrado ahora · abre a las 8:30» si lo está. Con ubicación: «A pie · 12 min desde ti» y «¿Ya estás aquí? Ya he llegado · Actualizar». Sin ubicación: «… desde tu alojamiento» y el recuadro «Sin tu ubicación no sabemos cuándo llegas» con [Usar mi ubicación] y [Ya he llegado]. «Escucha su historia por el camino» es ahora un reproductor (botón dorado de play y ondas). Si el viajero dijo que no a la ubicación, [Usar mi ubicación] abre «Activa tu ubicación» con los pasos de Safari o de Chrome. La lluvia: «aquí tienes una alternativa» solo si el día tiene plan de lluvia; si no, «Lleva paraguas o chubasquero»; y el aviso no sale si esa parte del día ya ha pasado.</p>
${fig('v43_hoy_parada', 'La tarjeta de la parada sin ubicación')}

<h2>9 · Un solo botón dorado</h2>
<p>El dorado de Design (135°, sin borde) se escribe <b>una sola vez</b> (<code>src/components/ui/botonesOro.ts</code>) y todos los botones de HOY lo usan. La prueba falla si algún botón lleva el borde <code>#9A7228</code>.</p>

<h2>Lista de comprobación de ESTA tanda (en el iPhone)</h2>
<ul>
<li>[ ] HOY → Cambiar plan → <b>Voy con retraso</b>: el botón dorado dice lo que hace y no sale «Aplicar», «Cambia:» ni «Volver a mi ruta original».</li>
<li>[ ] A última hora del día, con la mañana sin hacer: sale <b>«Hoy ya no da tiempo a todo»</b> UNA vez (cambia de pestaña y vuelve: no repite).</li>
<li>[ ] <b>Quiero comer/cenar ahora</b>: filtros arriba, números, «Abierto hasta» / «Cierra pronto», botón «Elegir».</li>
<li>[ ] <b>Añadir un sitio cercano</b>: nada repetido de hoy, todo con foto y estado; de noche solo lo abierto o al aire libre.</li>
<li>[ ] <b>Pasar a otro día</b>: el mejor día arriba con «Te lo recomendamos», los cerrados en gris.</li>
<li>[ ] El aviso «ya ha cerrado» sale <b>una sola vez</b> tras HOY → DÍAS → HOY → RUTA → HOY.</li>
<li>[ ] Un aviso con «Deshacer» (por ejemplo al añadir un sitio) tapa el menú de abajo, siempre en el mismo sitio.</li>
<li>[ ] <b>Lugares pendientes</b>: filas compactas, «···», «Pasar todos a otros días» con su resumen, la lista entera se baja con la página.</li>
<li>[ ] Tarjeta de la parada: «Cerrado ahora · abre a las…», recuadro de «Sin tu ubicación…», reproductor de la historia; con la ubicación denegada, [Usar mi ubicación] abre «Activa tu ubicación» (<b>probar los pasos de Safari</b>).</li>
<li>[ ] Lluvia: con plan de lluvia sale [Ver alternativa]; sin plan, el texto no promete nada.</li>
</ul>

<h2>Pruebas</h2>
<pre>${resultados.replace(/</g, '&lt;')}</pre>
`
fs.writeFileSync('docs/dias/REPASO_V43.html', html)
console.log('REPASO_V43.html escrito')
