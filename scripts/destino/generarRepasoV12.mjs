// Genera docs/dias/REPASO_V12.html (después de pruebaV12, que saca las capturas en docs/dias/V12_capturas): node scripts/destino/generarRepasoV12.mjs
import fs from 'node:fs'

const img = (n) => (fs.existsSync(`docs/dias/V12_capturas/${n}.jpg`) ? `data:image/jpeg;base64,${fs.readFileSync(`docs/dias/V12_capturas/${n}.jpg`).toString('base64')}` : null)
const fig = (n, pie) => `<figure>${img(n) ? `<img alt="${pie}" src="${img(n)}">` : '<div class="no">sin captura</div>'}<figcaption>${pie}</figcaption></figure>`
const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Repaso de la tanda V12 · Arreglos</title>
<style>:root{--bg:#FBF6EC;--tx:#1C2230;--bd:rgba(28,34,48,.15)}@media (prefers-color-scheme:dark){:root{--bg:#1C2230;--tx:#FFFDF8;--bd:rgba(255,253,248,.2)}}body{margin:0;padding:16px;background:var(--bg);color:var(--tx);font:15px/1.5 system-ui,sans-serif;max-width:900px;margin-inline:auto}h1{font:400 30px/1.1 Georgia,serif}h2{font:400 22px/1.2 Georgia,serif;margin-top:28px;border-top:1px solid var(--bd);padding-top:14px}figure{margin:8px 10px 8px 0;display:inline-block;vertical-align:top;max-width:300px}img{max-width:100%;height:auto;border:1px solid var(--bd);border-radius:10px}figcaption{font-size:12px;opacity:.7}.no{padding:30px;border:1px dashed var(--bd)}label{display:block;margin:6px 0}code{font-size:12.5px;background:rgba(127,127,127,.15);padding:1px 4px;border-radius:4px}li{margin:3px 0}</style></head><body>
<h1>Arreglos que ha visto Eric (V12)</h1>
<p>Probado con <code>pruebaV12</code> (nueva, 61 comprobaciones: servidor, código y pantalla en Chrome), <code>pruebaJutrip</code>, <code>pruebaV8</code>, <code>pruebaV9</code>, <code>pruebaV10</code>, <code>pruebaV11</code> y las del Perfil. Ninguna prueba toca el Supabase de producción. Design: <code>Perfil Viajes</code> (P1 y P2) puesto al día en <code>docs/diseno/proyecto/</code>.</p>

<h2>1. Abrir un viaje del Perfil (fallo de la V8)</h2>
<p><b>Ahora:</b> tocar la tarjeta (foto, nombre, cualquier parte) abre el viaje en RUTA, esté por empezar, en curso o terminado. En lugar de la flecha hay un botón redondo de álbum (el mismo sitio) que abre los recuerdos, en todas las tarjetas; la cámara de arriba sigue igual. La lista «Ver todos» también abre el viaje. Un solo abridor (<code>abrirViajeEnRuta</code>) para todo, que además pide el viaje entero si en la lista solo estaba el resumen.</p>
${fig('perfil_tarjetas', 'Tarjetas: etiqueta fina, crédito arriba, «5 días · 43 paradas» y el botón de recuerdos')}
<h2>2. Los recuerdos de un viaje</h2>
<ul><li>«Tus días» y «Tus fotos» (antes «Sus»). Tocar un día abre ESE día del viaje. [Abrir el viaje ›] oscuro, de 54 px, debajo de la portada.</li>
<li><b>El «7 días»</b> salía de contar los días de la ruta guardada (con la vuelta incluida) en vez de los días de las fechas. Ahora <code>diasDelViaje</code> usa las fechas del viaje cuando las hay (del 8 al 13, 6) y todo lo que escribe días (tarjeta, recuerdos, resumen, pasaporte, Hoy) pasa por ahí.</li>
<li><b>Foto repetida:</b> al subir, si ya hay una con el mismo tamaño exacto y la misma fecha y hora de cámara, dice «Esta foto ya está en tu viaje.» y no la duplica. Si la foto no trae fecha de cámara, basta el tamaño exacto. Cualquier fallo de red = se sube como siempre.</li>
<li><b>Portadas pixeladas:</b> la de los recuerdos usaba la miniatura de 400 px estirada. Ahora usa la foto grande (<code>urlGrande</code>). Revisado todo el uso de <code>urlParaMostrar</code>: el resto son miniaturas de cuadrículas o fichas de 32–150 px, que se quedan con la pequeña. Las portadas de las tarjetas ya usaban la grande (o la propia de 640 px del destino).</li></ul>
${fig('recuerdos', 'Los recuerdos de Lanzarote')}
<h2>3. La vitrina</h2>
<p>Con algún logro, el «+» ya no ocupa un hueco (tapaba al del medio): es pequeño (28 px) en la cabecera, junto a «N logros». Sin logros, sigue en el hueco vacío del medio, como Design.</p>
${fig('vitrina', 'Vitrina con los tres huecos llenos')}
<h2>4. Hojas de logros</h2>
<ul><li>Más aire: unos 12 px entre la etiqueta y el título, ~22 hasta [Reclamar con tus fotos] y ~24 entre «Puedes reclamar hasta…» y la tarjeta de la medalla.</li>
<li><b>[Ver el resumen del viaje]</b> salía aplastado porque, dentro de una columna que se encoge, un botón con alto fijo también se encogía. Ahora no se encoge (<code>flex: none</code>) y es el de Design: oscuro, 52 px, icono dorado, texto y «›».</li>
<li>El bloque de emblemas: «EMBLEMAS OCULTOS» y «3 de 11 secretos encontrados» (con ninguno, «Lanzarote esconde 11 secretos»).</li></ul>
${fig('hoja_arriba', 'Hoja con más aire')}${fig('hoja_resumen_boton', 'El botón del resumen y el bloque de emblemas')}
<h2>5. Los logros de viajero, todos del mismo tamaño</h2>
<p>Cada uno en una caja cuadrada igual; el dibujo se mide (la unión de sus trazos visibles, sin brillos) y se escala y centra para llenar el 90 % de la caja. Los exclusivos (capas de CSS en 3D, no medibles) llenan toda su caja, así que se escalan al 90 %. Cada uno conserva su dibujo y su marco. Vale en el resumen, «Todos mis logros», la vitrina, la hoja de cada logro y el momento de ganarlo.</p>
${fig('resumen_viajero', 'En el resumen')}${fig('todos_viajero', 'En «Todos mis logros»')}
<h2>6. Una X en todas las hojas</h2>
<p><b>No tenían X y ahora sí</b> (la misma X redonda de «Tus logros en …», <code>CruzDeHoja</code>): «Te quedan N sorpresas por reclamar»; las 3 hojas del pasaporte (países, «Aún no has estado en…», «Tu sello aún no está»); «¿Empezar un viaje nuevo?»; «Quiero entrar»; nombre de un día libre; «Tus fechas» (cambio de fechas); quitar una reserva; la hoja de la hora; los avisos de fechas; la tarjeta de temporada; «Propuesta enviada»; el resumen del día y «Hoy empiezas a ganar logros».</p>
<p><b>No llevan X a propósito</b> (decisión por confirmar): las escenas de logros, que avanzan tocando y tienen «Saltar todo»; las pantallas con flecha ‹ que vuelven a la anterior (Créditos, ficha de un viaje, cuentas, las pantallas de logros apiladas); la pantalla de entrar y el aviso de instalar (un banner con su botón).</p>
${fig('sorpresas', 'La hoja de sorpresas, con X y sus dos-en-uno en filas separadas')}
<p><b>Dos en uno:</b> «Haría y la Casa-Museo César Manrique» sale ahora en dos filas, «Haría» y «Casa-Museo César Manrique», cada una con su colección (igual «El Golfo» y «Charco de los Clicos»). «Te quedan N sorpresas» cuenta sitios.</p>
<h2>7. El sello con 3 sitios</h2>
<p>El sello del viaje terminado pide <b>3</b> sitios vistos (antes 5), para todos los destinos; cuentan igual los vistos con la app, los reclamados con fotos y los de «Yo también estaba». El texto dice «Te faltan 2 sitios para tu sello». Quien ya tenga 3 o más en un viaje terminado tiene su sello listo (se calcula de los hechos).</p>
<h2>8. Lo que quedó pendiente de la cola</h2>
<ul><li><b>Globo:</b> al abrir la página de un país, si el viaje está a más de 1.000 km del centro del país (Lanzarote, en España), el globo se acerca a la ciudad del viaje y se ven las Canarias.</li>
<li><b>Textos con {…}:</b> inventario de todos los huecos de los textos de datos (<code>scripts/destino/_buscarLlaves.mjs</code>): 11 distintos, todos con su sitio donde rellenarlos; la prueba recorre además las respuestas del servidor (estado, resumen, sorpresas) y las pantallas (hoja, recuerdos, resumen, «Todos mis logros») sin encontrar ninguno suelto.</li>
<li><b>Pruebas viejas que fallaban:</b> ver el informe (<code>docs/dias/INFORME_TANDA10B.md</code>, sección V12).</li>
<li><b>Logros contra el Supabase de verdad:</b> no se ha medido: hace falta la sesión de Eric en producción y nada de esto toca producción sin su sí. Queda un script listo (ver «PARA ERIC»).</li></ul>
<h2>Lista de comprobación de ESTA tanda</h2>
<label><input type="checkbox"> En el Perfil, tocar un viaje terminado, uno en curso y uno por empezar abre siempre RUTA con ese viaje</label>
<label><input type="checkbox"> El botón de álbum de cada tarjeta abre los recuerdos y [Abrir el viaje ›] lleva a RUTA</label>
<label><input type="checkbox"> «Tus días» / «Tus fotos»; del 8 al 13 pone «6 días»; tocar un día abre ese día</label>
<label><input type="checkbox"> Subir dos veces la misma foto avisa «Esta foto ya está en tu viaje.»</label>
<label><input type="checkbox"> La portada de los recuerdos se ve nítida</label>
<label><input type="checkbox"> Con la vitrina llena, el «+» pequeño de arriba no tapa ningún logro</label>
<label><input type="checkbox"> La hoja de logros tiene aire y el botón [Ver el resumen del viaje] es oscuro y de buen tamaño</label>
<label><input type="checkbox"> Los logros de viajero del resumen tienen todos el mismo tamaño</label>
<label><input type="checkbox"> «Te quedan N sorpresas por reclamar» tiene X y «Haría» y «Casa-Museo César Manrique» van cada uno en su fila</label>
<label><input type="checkbox"> Con un viaje terminado y 3 sitios vistos, [Estampar mi sello] estampa; con 2, dice «Te falta 1 sitio»</label>
<label><input type="checkbox"> El globo del pasaporte de España muestra las Canarias</label>
</body></html>`
fs.writeFileSync('docs/dias/REPASO_V12.html', html)
console.log('docs/dias/REPASO_V12.html', Math.round(html.length / 1024), 'KB')
