// Genera docs/dias/REPASO_V42.html con las capturas de docs/dias/V42_capturas y lo que hay que mirar.
import fs from 'node:fs'
const peso = JSON.parse(fs.readFileSync('docs/dias/_pesoFotosV42.json', 'utf8'))
const hay = (n) => fs.existsSync(`docs/dias/V42_capturas/${n}.jpg`)
const fig = (n, texto) => (hay(n) ? `<figure><img src="V42_capturas/${n}.jpg" alt="${texto}"><figcaption>${texto}</figcaption></figure>` : '')
const mb = (kb) => (kb >= 1024 ? `${(kb / 1024).toFixed(1).replace('.', ',')} MB` : `${kb} KB`)
const html = `<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>REPASO V42</title><style>body{font:15px/1.5 system-ui,sans-serif;max-width:980px;margin:0 auto;padding:16px;color:#1C2230}img{max-width:300px;border:1px solid #ddd;border-radius:10px;margin:6px 8px 6px 0}figure{display:inline-block;margin:0 10px 10px 0;font-size:12px;vertical-align:top}code{background:#f3ecd9;padding:1px 4px;border-radius:4px}.eric{background:#FFF7DC;border:1px solid #D8BE84;border-radius:10px;padding:4px 16px}table{border-collapse:collapse}td,th{border:1px solid #ddd;padding:4px 10px;text-align:right}th:first-child,td:first-child{text-align:left}</style>
<h1>V42 · Arreglos que vio Eric en el móvil</h1>

<h2>1 · EXPLORAR: los filtros que «dejaban de verse»</h2>
<h3>Qué pasaba, en palabras sencillas</h3>
<p>Los puntos <b>no desaparecían</b>: seguían todos en el mapa. Lo que pasaba es que, al ir sumando filtros, <b>los puntos se montaban unos encima de otros</b> y los últimos tapaban a los primeros:</p>
<ul>
<li>El filtro <b>Excursiones</b> aleja la cámara hasta ver Italia entera (Pompeya, Florencia…). Con el mapa tan lejos, <b>todo Roma cabía en un punto</b>: las atracciones, los miradores y los restaurantes quedaban hechos una sola mancha.</li>
<li>Los filtros de <b>Baños y Fuentes</b> suman <b>más de mil puntos</b> (las fuentes de Roma son unas 925). Se pintaban encima de todo lo demás y tapaban los primeros filtros.</li>
<li>Por dentro no había ningún error ni tope de puntos: el filtro «sustituir al anterior» tampoco. Lo comprobé uno a uno en Roma (el total nunca bajaba), pero a la vista parecía que faltaban.</li>
</ul>
<h3>Cómo está arreglado</h3>
<p>Los puntos que se pisan se recogen en una <b>burbuja oscura con un número</b> («47»: hay 47 puntos ahí). <b>Tocas la burbuja y el mapa se acerca</b> hasta que se separan. Nada desaparece: los puntos sueltos más los que van dentro de las burbujas suman siempre todos los que están activos. Los números del día, el punto que tocaste y los de «En tu ruta» no se agrupan.</p>
${fig('1_filtros_todos', 'Roma con todos los filtros activos: puntos sueltos y burbujas con su número')}

<h2>2 · RESERVAS: «Excursiones y actividades», siempre</h2>
<ul>
<li>Se llama <b>«Excursiones y actividades»</b> y sale <b>en todos los viajes</b> (también en uno de 2 días: ya no depende de <code>excursiones_desde_dias</code>).</li>
<li>Dentro enseña el <b>mismo carrusel</b> que «Actividades en {destino}» de la página del destino: mismas tarjetas y mismo orden (la prueba compara los dos con la respuesta del servidor). Arriba, las ya reservadas en verde; abajo [Ver todas] (abre EXPLORAR en Excursiones) y «¿Ya tienes una? Añádela», una sola vez.</li>
<li>El «0 de X» <b>no cuenta</b> excursiones ni actividades que no estén en la ruta (en el viaje de prueba de 2 días: «0 de 3», que son llegada y vuelta, alojamiento y seguro). El día de excursión sigue saliendo encima.</li>
<li>Cada destino puede poner su orden en sus datos: una lista <code>orden_actividades</code> (ids) en <code>excursions</code> del JSON del destino o en su <code>_civitatis.json</code>. Las de la lista van primero y en ese orden; Roma y Lanzarote no la tienen y quedan como hoy. (Madrid la usará.)</li>
</ul>
${fig('2_reservas_excursiones_y_actividades', 'RESERVAS en un viaje de 2 días: «Excursiones y actividades» con el carrusel')}

<h2>3 · Las fotos de las excursiones, más nítidas</h2>
<p>Civitatis solo guarda cada foto en tres tamaños: <code>-list</code> (230 px), <code>-grid</code> (640 px, igual que <code>-m</code>) y la original (2.950 a 4.240 px, de 220 a 714 KB). Con la original las 8 de Roma pesaban 6,8 MB, así que (decisión de Eric) las tarjetas grandes usan <b><code>-grid</code> (640 px, ~25 KB)</b>, con <code>loading="lazy"</code>; las listas pequeñas, <code>-list</code>. 640 px son 1,8 veces el ancho de la tarjeta en un iPhone (358 px): casi el doble.</p>
<table><tr><th>Peso de las fotos de la página de excursiones</th><th>Antes (pequeñas)</th><th>Después, todas</th><th>Después, las 3 primeras (lo que baja al abrirla)</th></tr>
<tr><td>Roma (${peso.Roma.fotos} excursiones)</td><td>${mb(peso.Roma.antesKB)}</td><td>${mb(peso.Roma.despuesTodasKB)}</td><td>${mb(peso.Roma.despuesPrimerasTresKB)}</td></tr>
<tr><td>Lanzarote (${peso.Lanzarote.fotos} excursiones)</td><td>${mb(peso.Lanzarote.antesKB)}</td><td>${mb(peso.Lanzarote.despuesTodasKB)}</td><td>${mb(peso.Lanzarote.despuesPrimerasTresKB)}</td></tr></table>
<p>(Medido con las cabeceras de Civitatis. En Lanzarote «antes» ya eran las de 640 px; ahí solo cambia de tamaño la tarjeta de Roma.)</p>
${fig('3_fotos_excursiones', 'La página de todas las excursiones con las fotos nuevas')}

<h2>4 · El Perfil y el globo</h2>
<ul>
<li>«¿A dónde te apetece ir?»: <b>fuera la lista de destinos</b> del bloque (ya está en el globo grande). Quedan el título y el globo pequeño con su botón de abrir, con <b>más espacio por arriba</b> (el mismo que entre los demás bloques del Perfil).</li>
<li><b>El tirador de la hoja del globo grande</b>: ahora <b>sigue al dedo</b> mientras arrastras (antes esperaba a pasar un umbral y daba un salto) y al soltar se queda en una de sus <b>dos posiciones</b> (según hacia dónde ibas); <b>tocarlo</b> también la cambia. Coge el puntero (<code>setPointerCapture</code>) y no deja pasar el toque al globo: arrastrar la hoja no gira el globo. Todo el encabezado de la hoja (el asa y el título) es tirador. La lista de abajo se desplaza sola (<code>pan-y</code>) y no mueve la hoja.</li>
</ul>
<p>No he podido enseñar capturas del Perfil ni del globo en producción: piden cuenta. Las pruebas del globo (<code>pruebaV41_globo</code>, toques y arrastres reales con el Chrome de pruebas) y la del Perfil (<code>pruebaV39_bola</code>) están al día.</p>

<h2>5 · DÍAS</h2>
<h3>1. Viaje «lo hago yo»</h3>
<ul>
<li>Un día sin paradas se llama <b>«Día por organizar»</b>, con <b>«Añade tus sitios»</b> debajo. El de llegada y el de vuelta sin paradas, <b>«Día de viaje»</b> (con su trayecto; el de vuelta ya no sale «Día libre»).</li>
<li>Lo de «Centro histórico» en el día de llegada (Roma, 26-29 nov): <b>no he podido reproducirlo</b>. Construí el viaje a mano de Roma con esas fechas, con y sin hora de vuelo, y todos los días salían «Día libre» (ahora «Día por organizar»); en un viaje a mano ningún título sale de los datos del destino salvo que el viajero ponga paradas. Si le vuelve a pasar, dime qué había en ese día (¿una parada, un vuelo, una reserva?).</li>
</ul>
${fig('5_1_dias_a_mano', 'Viaje a mano: Día de viaje · Día por organizar · Día por organizar · Día de viaje')}
<h3>2. «Crear mi propio día»</h3>
<ul>
<li>Quitado <b>[+ Añadir lugares]</b> (hacía lo mismo que [Buscar lugares]) en el día en blanco; con paradas puestas, el botón de abajo sigue.</li>
<li>El título pasa de «La Graciosa (excursión)» a <b>«Día por organizar»</b> (la causa: al pasar el día a «propio» se quedaba con el nombre de la excursión).</li>
<li>Los textos llevan el destino: <b>«explora Lanzarote o haz una excursión»</b> y <b>«Desde Lanzarote»</b> (en Roma: «explora Roma…», «Desde Roma»).</li>
</ul>
${fig('5_2_crear_mi_propio_dia', 'El día de excursión pasado a «Crear mi propio día»')}
<h3>3. Lanzarote (8-13 nov): el día de La Graciosa solo enseñaba «Crear mi propio día»</h3>
<p><b>No es porque no quede ningún día sin usar: es un hueco.</b> Para 5 días de ruta, el motor del coche reparte <code>D1, D2, D3, DG (La Graciosa), D4</code>; <b>el día «D5 · Volcanes y Famara» y sus variantes quedan sin usar</b>. Pero el día de La Graciosa no lleva guardada ninguna ruta de alternativa (la que sí llevan los días de Roma), y por eso la regla de la V41 (solo ofrecer «Organízame este día» si hay ruta) no la ofrece. <b>No lo he arreglado aquí</b>: hace falta que el motor del coche monte el día D5 al quitar La Graciosa (una petición nueva al servidor y volver a pintar el día), que es una pieza propia. Te lo dejo propuesto como tarea aparte.</p>
<h3>4. La tarjeta del alojamiento, con él puesto (Design «02 · Días · con alojamiento»)</h3>
<ul>
<li>Borde y cama <b>en verde</b>, con el <b>✓ verde</b> en la esquina del icono.</li>
<li>Arriba, en verde y pequeño, <b>«ALOJAMIENTO · {ZONA}»</b> con el nombre corto («Centro (Panteón, Trevi, Navona)» → «CENTRO»); si no cabe, «…» antes del botón.</li>
<li>Debajo, el nombre y <b>la dirección con el pin</b>, tal como la puso el viajero.</li>
<li>A la derecha, <b>el botón redondo oscuro con la flecha</b> (sin la palabra «Ir»), solo si hay dirección.</li>
</ul>
${fig('5_4_alojamiento', 'La tarjeta del alojamiento')}

<h2>6 · Botones flotantes (regla para toda la app, apuntada en CLAUDE.md)</h2>
<ul>
<li>La columna de la derecha es fija: <b>Avisos, Cámara y Logros</b>.</li>
<li><b>Reorganizar</b> y el <b>lápiz de la propuesta</b> miden ahora lo mismo (44 px; Reorganizar medía 56) y van <b>a la izquierda</b>: el primero, junto a Logros; el segundo, junto a la Cámara; el tercero, junto a Avisos. Ya no se montan sobre la Cámara ni sobre Logros, y la Cámara ya no se sube por ellos. El color no cambia (azul oscuro con dorado).</li>
<li><b>La columna de la derecha es fija y quieta:</b> en HOY estaba más arriba que en las demás pestañas (HOY usaba 120 px de suelo y el resto 88) y Avisos se medía a posteriori, por eso saltaba al cambiar de pestaña. Ahora los tres tienen su sitio fijo (a 88, 144 y 200 px del borde) en las cinco pestañas; <code>pruebaV42</code> mide los tres en RUTA, DÍAS, EXPLORAR, RESERVAS y HOY y durante el cambio de una a otra.</li>
</ul>
${fig('6_flotantes', 'Reorganizar a la izquierda de Logros; Avisos, Cámara y Logros a la derecha')}

<h2>La prueba</h2>
<ul>
<li><code>pruebaV42</code> (62): con todos los filtros, siguen todos los puntos (sueltos + burbujas); «Excursiones y actividades» en un viaje de 2 días y el «0 de 3» sin ellas; fotos grandes con al menos el doble del ancho; viaje a mano; «Crear mi propio día» sin [+ Añadir lugares] y con el título cambiado; la tarjeta del alojamiento (verde, dirección, flecha, nada se tapa); ningún botón flotante encima de otro.</li>
<li>Pruebas de lo tocado y <code>pruebaJutrip</code>: ver el resultado en el informe final. <b>Lanzarote:</b> con la API local arrancada con <code>DESTINOS_OCULTOS='-'</code>, <code>pruebaV38_dias</code> (118) y <code>pruebaV18</code> (55) crean el viaje de Lanzarote de punta a punta en 0 fallos: el «Not found» de antes era el guardián de destinos ocultos, no un fallo.</li>
</ul>

<h2>Tu lista de comprobación de esta tanda</h2>
<ul>
<li>EXPLORAR de Roma: enciende todos los filtros uno a uno; los puntos siguen ahí (sueltos o en burbujas con número); toca una burbuja y el mapa se acerca.</li>
<li>RESERVAS en un viaje corto (2 días): sale «Excursiones y actividades»; ábrelo: el carrusel es el mismo que el de la página del destino; «Ver todas» abre EXPLORAR.</li>
<li>La página de todas las excursiones y el día de excursión: las fotos se ven nítidas.</li>
<li>Perfil: «¿A dónde te apetece ir?» sin lista, con aire por arriba; abre el globo: arrastra el tirador despacio (te sigue) y suéltalo a medias (se queda en una de las dos posiciones); toca el tirador; arrastra la hoja y comprueba que el globo no gira; desplaza la lista sin que se cierre.</li>
<li>Viaje «lo hago yo»: «Día de viaje», «Día por organizar» + «Añade tus sitios», «Día de viaje».</li>
<li>Día de excursión → «Crear mi propio día»: título «Día por organizar», sin [+ Añadir lugares], con «explora {destino}» y «Desde {destino}».</li>
<li>Alojamiento puesto: tarjeta verde con ✓, «ALOJAMIENTO · ZONA», dirección con pin y flecha redonda.</li>
<li>Reorganizar (con pase): a la izquierda de Logros, del mismo tamaño; nada encima de nada.</li>
</ul>

<div class="eric"><h2>PARA ERIC</h2><ul>
<li><b>Fotos:</b> hecho con la opción A (-grid, 640 px): Roma pasa de ${mb(peso.Roma.antesKB)} a ${mb(peso.Roma.despuesTodasKB)} la página entera.</li>
<li><b>La Graciosa en Lanzarote:</b> es un hueco (queda el día D5 sin usar), no un fallo de la V41. Lo dejo propuesto como tarea aparte.</li>
<li><b>«Centro histórico» en el día de llegada de tu viaje a mano:</b> no pude reproducirlo (ver arriba).</li>
<li><b>Burbujas del mapa:</b> agrupan los puntos que quedan a menos de 44 px; si prefieres otra distancia, es un número.</li>
<li>No he podido probar el tirador del globo en un iPhone real; sí con toques y arrastres de verdad en el Chrome de pruebas.</li>
</ul></div></html>`
fs.writeFileSync('docs/dias/REPASO_V42.html', html)
console.log('REPASO_V42.html escrito')
