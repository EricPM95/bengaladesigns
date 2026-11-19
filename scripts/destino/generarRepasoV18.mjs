// Genera docs/dias/REPASO_V18.html (después de pruebaV18, que saca las capturas en docs/dias/V18_capturas): node scripts/destino/generarRepasoV18.mjs
import fs from 'node:fs'

const img = (n) => (fs.existsSync(`docs/dias/V18_capturas/${n}.jpg`) ? `data:image/jpeg;base64,${fs.readFileSync(`docs/dias/V18_capturas/${n}.jpg`).toString('base64')}` : null)
const fig = (n, pie) => `<figure>${img(n) ? `<img alt="${pie}" src="${img(n)}" style="max-width:240px;border-radius:12px">` : '<div>sin captura</div>'}<figcaption>${pie}</figcaption></figure>`
const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Repaso de la tanda V18</title>
<style>:root{--bg:#FBF6EC;--tx:#1C2230}@media (prefers-color-scheme:dark){:root{--bg:#1C2230;--tx:#FFFDF8}}body{margin:0;padding:16px;background:var(--bg);color:var(--tx);font:16px/1.5 system-ui,sans-serif;max-width:780px}h1{font-size:24px}h2{font-size:19px;margin-top:28px}code{font-size:13px}label{display:block;margin:6px 0}figure{display:inline-block;margin:8px 12px 8px 0;vertical-align:top}figcaption{font-size:13px;opacity:.7;max-width:240px}</style></head><body>
<h1>EXPLORAR, logros al instante, la excursión, los flotantes y los nombres (V18)</h1>
<p>Probado con <code>pruebaV18</code> (nueva, 55 comprobaciones), <code>pruebaJutrip</code>, <code>pruebaV9</code>, <code>pruebaV14</code> y las de EXPLORAR, DÍAS, flotantes y pase que tocaban estas pantallas.</p>

<h2>1. EXPLORAR: los botones de arriba son los temas de las tarjetas</h2>
<ul><li>Dentro de un tema (Volcanes) los botones de arriba son <b>los mismos temas que las tarjetas</b>, en el mismo orden, con su icono y su color, <b>sin «Hoteles»</b> (la tarjeta «Hoteles» sigue abriendo el mapa de alojamientos). El tocado sale marcado; al tocar otro cambian el mapa, la lista y el subtítulo (VOLCANES → PUEBLOS) sin salir. Vale para todos los destinos con catálogo (en Roma: Atracciones, Miradores, Restaurantes, Entradas, Excursiones, y Baños y Fuentes si el pase los abre).</li>
<li><b>¿Algo que solo se hacía con los botones viejos?</b> Sí: <b>sumar filtros</b> (por ejemplo Atracciones y Entradas a la vez) y el botón de <b>quitar todos los filtros</b>. Ahora cada tema es uno solo, como en las tarjetas. Los restaurantes siguen con sus sub-filtros (pizza, café…) dentro del tema «Restaurantes». El «+» de DÍAS (añadir parada) conserva sus filtros de siempre.</li></ul>
${fig('explorar_volcanes', 'Volcanes: temas arriba')}${fig('explorar_bodegas', 'Bodegas: los tres sitios')}

<h2>2. Bodegas con sus tres sitios</h2>
<ul><li>Bodegas enseña <b>La Geria y sus bodegas, Bodega El Grifo y Bodega La Geria</b>, cada uno con su punto en el mapa, su ficha («por qué te lo recomendamos») y su foto (las de la V16b). Las dos bodegas se han añadido a los datos de Lanzarote como sitios «solo de EXPLORAR» (<code>lugares_solo_lista</code>: la ruta no los ve), con la coordenada aproximada de los datos (por comprobar).</li>
<li><b>Repaso de los demás temas:</b> en Lanzarote, de los sitios de logro, ninguno falta en los temas salvo tres que no son sitios sueltos de EXPLORAR: <b>La Graciosa</b> (solo existe para ganar su emblema, no es parada), y <b>Haría (pueblo)</b> y <b>Casa-Museo César Manrique</b> (partes de «Haría y la Casa-Museo César Manrique», que ya sale en César Manrique y Pueblos). En Roma, todos los sitios de logro del catálogo tienen categoría y salen.</li></ul>

<h2>3. Las pantallas de logros, al instante</h2>
<ul><li><code>useCarga</code> (usada por «Mi colección», la colección por dentro y la página de destino) ya guarda lo último que vio, en memoria y en el móvil (como la hoja de la V9): la primera vez, «Un momento…»; las siguientes, al instante y lo nuevo llega por detrás sin parpadeo. También la lista de colección de la página de destino.</li>
<li><b>Repaso de TODAS las pantallas:</b> ya salían al instante desde la V9 el pasaporte, la vitrina, «Todos mis logros», la ficha de un logro y el resumen del viaje. <b>Tenían «Un momento…» cada vez:</b> «Mi colección», la colección por dentro, la página de cada destino y la lista de la colección dentro de la página de destino. Sigue con «Un momento…» la página del sorteo (no es de las de logros).</li></ul>

<h2>4. «Mi colección»: todos del mismo tamaño</h2>
<p>«Las cuatro estaciones» se encogía porque sus copos y destellos se salían de la caja y la medida automática la reducía; ahora llena su círculo como «Los 12 meses» (y las demás). Los puntitos de avance van <b>en una sola fila</b> (más pequeños si son muchos) y su hueco queda reservado aunque no haya, así todos los nombres quedan a la misma altura. En las 5 páginas.</p>
${fig('mi_coleccion_tiempo', 'El tiempo: cuatro estaciones y 12 meses')}

<h2>5. El día de excursión (Design E1 a E5)</h2>
<ul><li>Bloque nuevo (<code>ExcursionBloque.tsx</code>): E1 sin reservar, E2 reservada («✓ Reservada · mié 11» con el día de ese bloque, «Salida a las 08:15», código y [Cambiar]), E3 «¿Qué hacemos con este día?» con «<b>Una ruta por Lanzarote, hecha a tu medida</b>» (con el nombre de cada destino), E4 la hoja «Más excursiones» con [Elegir esta], E5 el día cerrado con «● Sin reservar» (rojo) o «● Reservada · salida 08:15» (verde).</li>
<li><b>Datos de verdad:</b> la foto de Civitatis, el «desde» real (Graciosa: 74 €), la nota 9,1 y las 2.332 opiniones, «Cancelación gratuita» solo si lo es. Salen de <code>_civitatis.json</code> (campo nuevo <code>civitatis_id</code> en las tres excursiones de Lanzarote; Roma no cambia). Las <b>etiquetas</b> (duración, recogida en el hotel, comida incluida, entradas, con guía) salen <b>solo si la ficha del operador lo dice</b>: «comida no incluida», «sin recogida» o un «verificar» no dan etiqueta.</li>
<li>Los viajes ya generados guardan sus excursiones tal como estaban: los datos nuevos salen al generar un viaje nuevo o rehacer la ruta.</li></ul>
${fig('E1_sin_reservar', 'E1')}${fig('E3_que_hacemos', 'E3')}${fig('E4_mas_excursiones', 'E4')}${fig('E2_reservada', 'E2')}${fig('E5_dia_cerrado', 'E5')}
<p><b>Capturas al lado de Design:</b> el diseño está en <code>docs/diseno/proyecto/Excursion Bloque.dc.html</code> y <code>Botones Flotantes.dc.html</code> (ábrelos en el navegador para ponerlos al lado de estas capturas; no he podido sacar su captura desde aquí).</p>

<h2>5b. Flotantes iguales y pase en verde</h2>
<ul><li>La cámara y el trofeo, <b>iguales</b>: 44 px, fondo crema con aro dorado, la cámara arriba y el trofeo abajo, en la misma columna. El <b>punto de aviso</b> del trofeo se queda; el aro de avance y la medalla se han quitado (Design no los pone). Los botones de encima (lápiz, «Reorganizar») suben lo que toca por el nuevo tamaño.</li>
<li><b>Pase comprado:</b> «✓ Pase Roma» (o el destino que toque) en <b>verde pastel</b>, con [Compartir] al lado; sin pase, como hoy. Es una sola pieza (<code>PastillaPase</code>). Los colores, el ✓ y el texto son los de Design; la altura se queda en 30 px (la misma con y sin pase) para que la tarjeta no salte al llegar la respuesta del servidor.</li></ul>
${fig('flotantes', 'Los dos flotantes')}${fig('pase_verde', 'Pase en verde')}

<h2>6. «Dia 2 Lunes» en el jueves 12</h2>
<ul><li><b>De dónde sale (solo leyendo):</b> ningún sitio del código escribe «Dia 2 Lunes» (sin tilde y con «Lunes» en mayúscula): la app siempre pone «Día n» o «Lunes 13 oct». Lo más probable es un título escrito por Claude en un viaje generado con IA, o un texto puesto desde «Ponle nombre» o «Añadir día» sin la marca de «lo escribió el viajero». Sea cual sea, el número (2) y el día (lunes) no son los del jueves 12.</li>
<li><b>Arreglo:</b> la app ya no enseña un nombre «Día N día-de-la-semana» que no es el de ese día (número o día de la semana que no cuadran con su posición y su fecha); el día se nombra como si no tuviera nombre propio. <b>Nunca toca un nombre con la marca del viajero.</b> No cambia nada guardado: se corrige al enseñarlo.</li>
<li><b>Cuántos viajes lo tienen:</b> no puedo leer producción. Pega <code>docs/dias/V18_NOMBRES_DE_DIA.sql</code> (solo lectura): da el número de viajes y los días. Se arreglan solos al abrirlos, sin tocar los nombres que el viajero escribió.</li></ul>

<h2>Lo que queda</h2>
<ul><li>Pegar <code>V18_NOMBRES_DE_DIA.sql</code> para saber cuántos viajes tienen un nombre así.</li><li>Las coordenadas de las dos bodegas están por comprobar (aproximadas).</li></ul>

<h2>Lista de comprobación de ESTA tanda</h2>
<label><input type="checkbox"> EXPLORAR › Volcanes: arriba salen los mismos temas que las tarjetas (sin Hoteles); tocar Pueblos cambia todo sin salir</label>
<label><input type="checkbox"> Bodegas: tres sitios con punto, ficha y foto</label>
<label><input type="checkbox"> «Mi colección», una colección por dentro y la página de un destino: la segunda vez al instante</label>
<label><input type="checkbox"> «Mi colección › El tiempo»: cuatro estaciones y 12 meses del mismo tamaño; puntitos en una fila</label>
<label><input type="checkbox"> Día de excursión en DÍAS: foto, precio, nota y etiquetas reales; E2 con «Reservada · mié 11»; la hoja «Más excursiones»; «Una ruta por Lanzarote, hecha a tu medida»</label>
<label><input type="checkbox"> La cámara y el trofeo, iguales y con el punto de aviso</label>
<label><input type="checkbox"> Con pase: «✓ Pase Roma» en verde</label>
<label><input type="checkbox"> Tu viaje a Lanzarote: el jueves 12 ya no se llama «Dia 2 Lunes»</label>
</body></html>`
fs.writeFileSync('docs/dias/REPASO_V18.html', html)
console.log('docs/dias/REPASO_V18.html', Math.round(html.length / 1024), 'KB')
