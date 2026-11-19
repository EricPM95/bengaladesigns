// Genera docs/dias/REPASO_V25.html (después de pruebaV25, que saca las capturas en docs/dias/V25_capturas): node scripts/destino/generarRepasoV25.mjs
import fs from 'node:fs'

const img = (n) => (fs.existsSync(`docs/dias/V25_capturas/${n}.jpg`) ? `data:image/jpeg;base64,${fs.readFileSync(`docs/dias/V25_capturas/${n}.jpg`).toString('base64')}` : null)
const fig = (n, pie) => `<figure>${img(n) ? `<img alt="${pie}" src="${img(n)}" style="max-width:230px;border-radius:12px">` : '<div>sin captura</div>'}<figcaption>${pie}</figcaption></figure>`
const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Repaso de la tanda V25 · Logros antes del viaje</title>
<style>:root{--bg:#FBF6EC;--tx:#1C2230}@media (prefers-color-scheme:dark){:root{--bg:#1C2230;--tx:#FFFDF8}}body{margin:0;padding:16px;background:var(--bg);color:var(--tx);font:16px/1.5 system-ui,sans-serif;max-width:800px}h1{font-size:24px}h2{font-size:19px;margin-top:28px}code{font-size:13px}label{display:block;margin:6px 0}figure{display:inline-block;margin:8px 10px 8px 0;vertical-align:top}figcaption{font-size:12.5px;opacity:.7;max-width:230px}</style></head><body>
<h1>La hoja de logros antes del viaje, el sorteo escondido y los filtros de EXPLORAR (V25)</h1>
<p>Probado con <code>pruebaV25</code> (89 comprobaciones), <code>pruebaJutrip</code> y las de logros, el Perfil y el pase. La muestra de 60 viajes de Roma no se ha vuelto a pasar: no se ha tocado el motor de rutas. Las capturas salen de la demo de logros (viaje de ejemplo con fechas fijas), no de producción.</p>

<h2>1. Las tres fases de la hoja (cómo se decide cuál es)</h2>
<ul><li><b>El momento (antes, durante, después) se calcula con las fechas del viaje y «hoy» en la zona del destino</b> (el servidor da <code>viaje.hoy</code>; la app usa la misma regla, <code>faseDelViaje</code>). Una captura anterior decía «ANTES DEL VIAJE · 29 OCT – 1 NOV» porque la demo lleva un viaje de ejemplo del 29 oct al 1 nov con «hoy» puesto el 20 oct: <b>era un dato de la demo, no la app</b>.</li>
<li><b>ANTES</b> (hoy es anterior al primer día): la hoja NUEVA de Design. Sin «Reclamar con tus fotos», sin «Puedes reclamar hasta…» y sin «Yo también estaba» (no se ha visitado nada). Lleva: las dos medallas, «Lo que te puedes llevar», los secretos con sus siluetas, la franja de colecciones y, sin pase, el bloque que vende el pase.</li>
<li><b>DURANTE y DESPUÉS</b> (hasta el fin del plazo de reclamar): la hoja de siempre, con su etiqueta («En curso · …» / «Viaje terminado · …»), [Reclamar con tus fotos] y «Puedes reclamar hasta…», «Yo también estaba», la medalla con su avance y las colecciones. De la V25 solo llevan: el Vaticano con la misma tarjeta que Roma, el sello de la ciudad en la medalla, sin la etiqueta negra, las colecciones que se abren con sus lugares y fotos y las siluetas de los secretos. <b>No llevan «Lo que te puedes llevar».</b></li></ul>
${fig('fase_antes_arriba', 'ANTES · arriba')}${fig('fase_antes_medio', 'ANTES · secretos y franja')}${fig('fase_durante_arriba', 'DURANTE · arriba')}${fig('fase_durante_medio', 'DURANTE · colecciones')}${fig('fase_despues_arriba', 'DESPUÉS · arriba')}${fig('fase_despues_medio', 'DESPUÉS · colecciones')}

<h2>2. La hoja de antes del viaje (Design «Logros Antes Viaje»)</h2>
<ul><li><b>Medallas:</b> Roma y el Vaticano con <b>la misma tarjeta oscura y del mismo tamaño</b> (también durante y después). Sin «Por conseguir» repetido: arriba «POR CONSEGUIR · 0 DE 8 IMPRESCINDIBLES» y de título «Empieza en bronce: 1 sitio». El sello de la ciudad (Coliseo, cúpula, volcán) ya iba en la medalla; los cuatro puntitos de colores del dibujo de Design no estaban en la app y no se han puesto.</li>
<li><b>Sin frases</b> de «tu primer pedazo te espera en…», «un país entero te espera», etc. (en la app no estaban: eran del dibujo). Sin el recuadro «Todo listo» ni «Toca para ver tus colecciones» (tampoco estaban en la app).</li>
<li><b>Secretos:</b> «0 DE 12 SECRETOS ENCONTRADOS» (el número lo manda el servidor) y cada emblema oculto como silueta oscura con «?», en una fila que se desliza de lado y solo de lado.</li>
<li><b>La franja</b> «Con tu ruta puedes completar 7 de las 11 colecciones»: dorada, sus insignias a medio rellenar en dos filas de dos, sin texto de «toca». Al tocarla salen <b>una a una, todas cerradas</b>, primero las de tu ruta: insignia de 56 px, nombre completo (hasta 2 líneas), «0 de 8», «Se completa con tu ruta» y un candadito si no hay pase. Cada una se abre al tocarla y enseña sus lugares con su foto y «En tu ruta · jueves 26» o «Fuera de tu ruta», y «Ver la colección ›».</li>
<li><b>Sin pase:</b> el bloque «Los logros vienen con el Pase Roma» con lo que incluye y [Conseguir el pase · 6,99 €]; el precio sale de <code>/api/pase/config</code>, nunca escrito a mano, y el botón abre la hoja de compra de siempre. <b>Con pase</b> (o con el cobro apagado o solo para administradores): la misma hoja sin ese bloque, sin candados ni precio.</li></ul>
${fig('gratis_01_arriba', 'Sin pase · arriba')}${fig('gratis_02_franja', 'Sin pase · la franja')}${fig('gratis_03_colecciones_cerradas', 'Colecciones cerradas')}${fig('gratis_04_coleccion_abierta', 'Una abierta, con fotos')}${fig('gratis_05_vende_el_pase', 'Vende el pase')}

<h2>3. Colecciones: sin etiqueta negra y que se abran</h2>
<ul><li><b>La etiqueta negra</b> con el nombre de un sitio («Plaza de España») era un aviso que salía 2 segundos al tocar un trozo de la insignia de una colección (<code>piezaDeInsignia</code>). Quitada en todas las fases.</li>
<li>Al tocar una colección se despliega la lista de sus sitios (✓ o ○; antes del viaje «En tu ruta · …») con «Ver la colección ›», también antes del viaje.</li></ul>

<h2>3b. El sorteo, escondido (decisión de Eric)</h2>
<ul><li><b>Interruptor:</b> servidor <code>SORTEO_VISIBLE</code> y móvil <code>VITE_SORTEO_VISIBLE</code> (apagado salvo «true»). No se ha borrado nada.</li>
<li><b>Dónde salía «sorteo» y qué hace ahora:</b> el billete dorado del Perfil (<code>CuerpoConLogros</code>); la página del sorteo (se llegaba desde el billete y desde el aviso: sin ellos no se abre; <code>/api/logros/sorteo</code> responde 404); el aviso dorado «¡Ya estás en el sorteo de 2027!» en la campana (el servidor ya no lo crea ni lo da, y el móvil lo filtra); la línea del pase «Sube de nivel y entra en el sorteo de cada año» (y «Experiencia, niveles y sorteo anual» del bloque de venta): ahora «Sube de nivel con cada viaje» y «Experiencia y niveles». La hoja de logros, la vitrina y la pantalla del pase no lo nombraban. <b>Sigue visible solo en el panel de administrador</b> (pestaña «Sorteo»), que no ven los viajeros.</li></ul>

<h2>3c. EXPLORAR</h2>
<ul><li><b>Filas quietas en vertical:</b> la fila de temas, la de secretos y todas las que se deslizan de lado (regla global en <code>index.css</code> y las de estilo en línea) llevan <code>overflow-y: hidden</code>: solo van de lado, sin rebotar arriba y abajo. <b>No lo he podido probar en un iPhone ni un Android de verdad:</b> Chrome de escritorio no rebota igual.</li>
<li><b>Varios temas a la vez:</b> cada botón se enciende o se apaga al tocarlo; el mapa y la lista enseñan los sitios de todos los marcados sin repetir; el subtítulo no cambia; sin ninguno marcado se ve todo el destino; al entrar desde una tarjeta, solo ese tema. Mezclar un tema de Lanzarote (p. ej. Volcanes) con Restaurantes o Excursiones aplica los filtros sobre la lista de Lanzarote: es el único caso raro que queda.</li></ul>
${fig('explorar_dos_temas', 'Dos temas marcados')}

<h2>Lista de comprobación de ESTA tanda</h2>
<label><input type="checkbox"> Roma antes del viaje: sin «Reclamar con tus fotos» ni «Yo también estaba»; medallas, «Lo que te puedes llevar», secretos y franja</label>
<label><input type="checkbox"> Durante y después: la hoja de siempre, con su etiqueta y [Reclamar…]</label>
<label><input type="checkbox"> Roma y el Vaticano, la misma tarjeta en las tres fases</label>
<label><input type="checkbox"> Sin pase y antes del viaje: [Conseguir el pase · 6,99 €] abre la compra; con pase, sin ese bloque</label>
<label><input type="checkbox"> La franja abre las colecciones una a una, cerradas; una colección abierta enseña lugares con foto</label>
<label><input type="checkbox"> Ni «sorteo» ni billete dorado en el Perfil, el pase ni la campana</label>
<label><input type="checkbox"> EXPLORAR: la fila de temas no se mueve de arriba abajo (iPhone y Android) y se pueden marcar varios</label>
</body></html>`
fs.writeFileSync('docs/dias/REPASO_V25.html', html)
console.log('docs/dias/REPASO_V25.html', Math.round(html.length / 1024), 'KB')
