// Genera docs/dias/REPASO_V14.html (después de pruebaV14, que saca las capturas en docs/dias/V14_capturas): node scripts/destino/generarRepasoV14.mjs
import fs from 'node:fs'

const img = (n) => (fs.existsSync(`docs/dias/V14_capturas/${n}.jpg`) ? `data:image/jpeg;base64,${fs.readFileSync(`docs/dias/V14_capturas/${n}.jpg`).toString('base64')}` : null)
const fig = (n, pie) => `<figure>${img(n) ? `<img alt="${pie}" src="${img(n)}">` : '<div class="no">sin captura</div>'}<figcaption>${pie}</figcaption></figure>`
const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Repaso de la tanda V14 · Más arreglos</title>
<style>:root{--bg:#FBF6EC;--tx:#1C2230;--bd:rgba(28,34,48,.15)}@media (prefers-color-scheme:dark){:root{--bg:#1C2230;--tx:#FFFDF8;--bd:rgba(255,253,248,.2)}}body{margin:0;padding:16px;background:var(--bg);color:var(--tx);font:15px/1.5 system-ui,sans-serif;max-width:900px;margin-inline:auto}h1{font:400 30px/1.1 Georgia,serif}h2{font:400 22px/1.2 Georgia,serif;margin-top:28px;border-top:1px solid var(--bd);padding-top:14px}figure{margin:8px 10px 8px 0;display:inline-block;vertical-align:top;max-width:300px}img{max-width:100%;height:auto;border:1px solid var(--bd);border-radius:10px}figcaption{font-size:12px;opacity:.7}.no{padding:30px;border:1px dashed var(--bd)}label{display:block;margin:6px 0}code{font-size:12.5px;background:rgba(127,127,127,.15);padding:1px 4px;border-radius:4px}li{margin:3px 0}</style></head><body>
<h1>Más arreglos que ha visto Eric (V14)</h1>
<p>Probado con <code>pruebaV14</code> (nueva, 52 comprobaciones: servidor, código y pantalla en Chrome), <code>pruebaTanda10S4_H</code> (arreglada, en 0) y las de siempre de lo tocado: <code>pruebaJutrip</code>, <code>pruebaV9</code>, <code>pruebaV11</code>, <code>pruebaV12</code>, <code>pruebaV13</code> y las de logros y Perfil. Ninguna prueba toca el Supabase de producción.</p>

<h2>1. La hoja «Tus logros en …»</h2>
<p><b>La lista se queda.</b> Tocar una colección la despliega (✓ lo que tienes, ○ lo que falta) y no se cierra al tocar dentro. <b>Al final, «Ver la colección ›»</b> abre la pantalla de la colección de la V9 (cada sitio con su foto y su trozo de la insignia). Es la MISMA lista (<code>ListaDeColeccion</code>) en la hoja de logros, en el resumen del viaje, en la página de un destino de «Todos mis logros» (antes, tocar una colección saltaba directo a su pantalla) y en la pestaña «Logros» de la ficha.</p>
<p><b>La cabecera ya no tapa.</b> Lo único fijo es una barra fina (52 px) con el título y la X. La etiqueta de fase, [Reclamar con tus fotos], la tarjeta del compañero y la medalla se mueven juntos con el scroll.</p>
${fig('hoja_arriba', 'Arriba: barra fina fija')}${fig('hoja_lista', 'La lista abierta, con foto, Visto / Por ver, marca y «Ver la colección ›»')}${fig('coleccion_de_la_v9', 'Lo que abre el enlace')}${fig('destino_lista', 'En la página de un destino')}

<h2>1a. La pestaña «Logros» de la ficha</h2>
<p><b>Sale al instante:</b> arranca con lo último que se vio de ese viaje (lo guardado en el móvil, o lo que ya cargó la hoja de logros: es la misma caché) y lo nuevo llega por detrás; solo cambia lo que cambie. Antes pedía todo al servidor cada vez (unos 2 s).</p>
<p><b>Las fotos:</b> cada sitio lleva su foto: la tuya si lo ganaste con una foto; si no, la de nuestros datos (en gris suave si está por ver). Antes usaba una miniatura que a veces no existía y quedaba el cuadrado beige. La regla es la de la pantalla de la colección de la V9.</p>

<h2>1b. El resumen del viaje</h2>
<p><b>De dónde salía cada número de fotos.</b> El Perfil cuenta las fotos con el id de la <i>ruta</i> (<code>route.id</code>, con el que se guardan en <code>trip_photos</code>). El resumen las contaba con el id del <i>viaje en la nube</i> (<code>activeTripId</code>), que es otro: por eso decía «2 fotos» donde el Perfil decía «6». Ahora el resumen usa el mismo id y el mismo contador: las dos cuentan TODAS las fotos del viaje.</p>
<p><b>La portada</b> ya no es «la primera foto» (la de casa haciendo la maleta). Ahora: lo que elija el viajero; si no, una foto hecha EN el destino (con la ubicación que se leyó al subirla, dentro de la zona de las paradas del viaje) y, mejor, la de un sitio con logro; y si no hay ninguna, la del destino de nuestros datos.</p>
${fig('resumen_arriba', 'Portada de un sitio con logro y «6 FOTOS»')}${fig('resumen_lista', 'Tocar una colección del resumen')}

<h2>2. El pasaporte</h2>
<p><b>El mapa con islas.</b> El de siempre (110 m) no tiene Lanzarote ni casi ninguna isla pequeña: por eso el punto salía en el mar. Ahora el pasaporte usa el de 50 m (Canarias, Baleares, las griegas…), <code>tierra50.json</code> (830 KB, 270 KB comprimido), que se baja <b>solo al abrir el pasaporte</b>; el Perfil sigue con el ligero. Al abrir, primero sale el de siempre al instante y, al llegar el otro, se cambia.</p>
<p><b>El sello nuevo de Design</b> (<code>Piezas/Perfil</code> del zip V14): ovalado, tinta de lava, el volcán y «LANZAROTE»; para Lanzarote. <b>La fecha es la del PRIMER día</b> del viaje, con dos cifras («08 NOV 2026»), también en los ya estampados. <b>3 sellos por página</b>: el 1.º arriba a la izquierda, el 2.º arriba a la derecha y el 3.º abajo en el centro, cada uno girado; llena la página y pasa a la siguiente. <b>[Estampar mi sello] → [Ver mi sello]</b>: el sello se estampa una sola vez por viaje (se apunta en el móvil) y desde entonces el botón abre el pasaporte en su página sin estampar.</p>
${fig('pasaporte_lanzarote', 'Lanzarote con su isla, su punto y su sello')}${fig('pasaporte_3_sellos', 'Tres sellos en su sitio')}${fig('sello_ver', '[Ver mi sello]: la página, sin estampar')}

<h2>2b. En el Perfil</h2>
<p><b>Mi vitrina:</b> los 3 logros a 96 px (antes 74), llenando su hueco. <b>La tarjeta «Mi pasaporte»:</b> solo los últimos sellos de verdad (como mucho 2; sin sellos, la página vacía; fuera el «Roma · 13 OCT» de muestra); el globo se mueve con el dedo, <b>arrastrar no abre el pasaporte y tocar sí</b>, y guarda su última posición en el móvil y en la cuenta (<code>travelers.globo_pasaporte</code>, migración <b>0080</b>, sin aplicar: la aplica Eric; sin ella se guarda solo en el móvil).</p>
${fig('perfil_vitrina', 'Vitrina con los 3 logros grandes')}${fig('perfil_tarjeta', 'Tarjeta del pasaporte con su globo')}

<h2>2c. «Mi vitrina» (la de dentro)</h2>
<p>Los logros de viajero, los emblemas secretos y las colecciones (y sus huecos vacíos) llenan su hueco como los «Sellos de ciudad» (cada dibujo ocupa un poco distinto de su caja, así que el tamaño de cada balda lo compensa: 80, 66, 74 y 90 px; huecos vacíos de 68). Más aire arriba: 16 px a los lados y 20 por debajo de la cabecera, también en «Todos mis logros».</p>
${fig('mi_vitrina', 'Mi vitrina, arriba')}${fig('mi_vitrina_abajo', 'Las baldas, del mismo tamaño')}${fig('todos_mis_logros', 'Todos mis logros')}

<h2>3. La prueba que fallaba</h2>
<p><code>pruebaTanda10S4_H</code> fallaba por la <b>prueba</b>, no por la app: abría el bloque «Entradas y Free Tour» pulsando un <code>button</code> que ya no existe (desde la 10S9 la cabecera es un <code>div</code> tocable). Corregida; en 0 (43 comprobaciones).</p>

<h2>Lo que queda sin hacer o por mirar</h2>
<ul><li>La migración <b>0080</b> hay que aplicarla (SQL en <code>supabase/migrations/0080_globo_del_pasaporte.sql</code>, comprobación en <code>docs/dias/COMPROBAR_0080.sql</code>). Hasta entonces, el globo recuerda su posición solo en cada móvil.</li>
<li>«Estampado una sola vez» se apunta en el móvil (no en la cuenta): en otro móvil, el botón volverá a decir [Estampar mi sello] una vez.</li>
<li>Los puntos de los viajes en el globo salen para Roma y Lanzarote (las coordenadas de cada destino están en el código del pasaporte; un destino nuevo necesita las suyas).</li></ul>

<h2>Lista de comprobación de ESTA tanda</h2>
<label><input type="checkbox"> Hoja «Tus logros en …»: tocar una colección despliega la lista (✓ / ○, con foto) y se queda; al final, «Ver la colección ›»</label>
<label><input type="checkbox"> Lo mismo en el resumen del viaje y en la página de un destino de «Todos mis logros»</label>
<label><input type="checkbox"> Al bajar en la hoja, solo queda fija la barra con el título y la X; la medalla se mueve con el resto</label>
<label><input type="checkbox"> Pestaña «Logros» de una parada: sale al momento y cada sitio con su foto</label>
<label><input type="checkbox"> El resumen y el Perfil cuentan las mismas fotos; la portada es una foto del destino</label>
<label><input type="checkbox"> Pasaporte: al abrir España con Lanzarote se ve la isla con su punto</label>
<label><input type="checkbox"> Sello de Lanzarote nuevo, con «08 NOV 2026» (primer día) y 3 por página: arriba izquierda, arriba derecha, abajo centro</label>
<label><input type="checkbox"> [Estampar mi sello] la primera vez; después, [Ver mi sello] sin estampar</label>
<label><input type="checkbox"> Perfil: los 3 logros de la vitrina, grandes; la tarjeta del pasaporte solo con sellos de verdad</label>
<label><input type="checkbox"> El globo de la tarjeta se mueve con el dedo, no abre el pasaporte al arrastrar, sí al tocar, y recuerda su posición</label>
<label><input type="checkbox"> «Mi vitrina» (dentro): logros, emblemas y colecciones del mismo tamaño que los sellos de ciudad; más aire arriba</label>
</body></html>`
fs.writeFileSync('docs/dias/REPASO_V14.html', html)
console.log('docs/dias/REPASO_V14.html', Math.round(html.length / 1024), 'KB')
