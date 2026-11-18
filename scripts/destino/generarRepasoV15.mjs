// Genera docs/dias/REPASO_V15.html (después de pruebaV15, que saca las capturas en docs/dias/V15_capturas): node scripts/destino/generarRepasoV15.mjs
import fs from 'node:fs'

const img = (n) => (fs.existsSync(`docs/dias/V15_capturas/${n}.jpg`) ? `data:image/jpeg;base64,${fs.readFileSync(`docs/dias/V15_capturas/${n}.jpg`).toString('base64')}` : null)
const fig = (n, pie) => `<figure>${img(n) ? `<img alt="${pie}" src="${img(n)}">` : '<div class="no">sin captura</div>'}<figcaption>${pie}</figcaption></figure>`
const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Repaso de la tanda V15 · Cerrar logros y Perfil</title>
<style>:root{--bg:#FBF6EC;--tx:#1C2230;--bd:rgba(28,34,48,.15)}@media (prefers-color-scheme:dark){:root{--bg:#1C2230;--tx:#FFFDF8;--bd:rgba(255,253,248,.2)}}body{margin:0;padding:16px;background:var(--bg);color:var(--tx);font:15px/1.5 system-ui,sans-serif;max-width:900px;margin-inline:auto}h1{font:400 30px/1.1 Georgia,serif}h2{font:400 22px/1.2 Georgia,serif;margin-top:28px;border-top:1px solid var(--bd);padding-top:14px}figure{margin:8px 10px 8px 0;display:inline-block;vertical-align:top;max-width:300px}img{max-width:100%;height:auto;border:1px solid var(--bd);border-radius:10px}figcaption{font-size:12px;opacity:.7}.no{padding:30px;border:1px dashed var(--bd)}label{display:block;margin:6px 0}code{font-size:12.5px;background:rgba(127,127,127,.15);padding:1px 4px;border-radius:4px}li{margin:3px 0}</style></head><body>
<h1>Cerrar lo que queda de logros y del Perfil (V15)</h1>
<p>Probado con <code>pruebaV15</code> (nueva: servidor, código y pantalla), <code>pruebaJutrip</code>, <code>pruebaV7</code>, <code>pruebaV11</code>, <code>pruebaV14</code> y las de Perfil y logros que tocan portada y fechas. Ninguna prueba toca el Supabase de producción.</p>

<h2>1. El sello, estampado una sola vez, guardado en la cuenta</h2>
<p>Antes «ya estampado» se apuntaba solo en el móvil. Ahora también en la cuenta: <code>travelers.sellos_estampados</code> (migración <b>0081</b>; es una columna de una tabla que ya existe, no una tabla nueva, así que <code>empezar_de_cero</code> no cambia). Al abrir la app con cuenta se <b>juntan</b> las dos listas: lo de la cuenta pasa al móvil (en otro móvil sale [Ver mi sello]) y lo que solo estaba en el móvil, también lo estampado antes con la lista vieja de la V14, <b>se sube solo</b>. Sin la migración, sigue como antes (solo en el móvil).</p>

<h2>2. «Yo también estaba» no le salía a Alicia — lo que encontré</h2>
<p><b>Aviso:</b> no he leído la base de datos de producción (no tengo tu sesión y no uso la clave de servicio): lo que sigue sale del <b>código</b> y de una prueba con los dos compañeros. Para confirmarlo con los datos reales, <code>docs/dias/DIAGNOSTICO_YO_TAMBIEN.sql</code> (solo <code>select</code>, para pegar en Supabase).</p>
<ul>
<li><b>¿Es miembro y desde qué día?</b> La app lo saca de <code>trip_members.created_at</code> (el dueño no lleva fecha): el día en que la persona se <i>unió</i> al viaje compartido.</li>
<li><b>¿Qué fecha de fin usa el servidor?</b> <code>dateRange.end</code> del viaje (para Lanzarote, el 13), no el 14 de la tarjeta (ver punto 3).</li>
<li><b>¿Por qué no salía nada, en las dos direcciones?</b> La regla de la V7 decía «solo cuentan los compañeros que ya estaban cuando acabó el viaje». Si Alicia se unió el 18-nov (después del 13), el servidor la dejaba fuera: ni ella veía lo de Eric ni Eric veía lo de ella, y la respuesta era una lista vacía sin decir por qué. Encaja con lo que viste.</li>
<li><b>¿Cuenta el pase?</b> No para <i>ver</i> lo pendiente; solo para <i>ganarlo</i>. Con el cobro apagado y sin ningún pase, se gana igual (comprobado en la prueba).</li>
<li><b>Lo que he cambiado</b> (con tu OK): cuenta cualquier miembro del viaje, entrara cuando entrara, dentro de los 30 días de plazo. La prueba reproduce el caso (Eric: Montañas del Fuego; Alicia, que se une el 18: Cueva de los Verdes) y sale en las dos direcciones.</li>
</ul>

<h2>2b. El «09 NOV» y los «5 días» de Alicia — y «Yo también estaba»</h2>
<p><b>Lo que encontré (en el código; sin leer producción):</b> el servidor trabaja con UN viaje por id. Si Alicia, además del viaje compartido de Eric, tiene en su cuenta <b>su propia copia</b> del viaje a Lanzarote (con sus propias fechas, p. ej. del 9 al 13) y lo que ganó lo guardó con el id de esa copia, pasaban tres cosas a la vez: su sello salía con las fechas de la copia («09 NOV 2026», «5 días viajando»), su pasaporte decía «Tu sello aún no está… llevas 0» (porque el viaje compartido no tenía nada suyo con ese id y el de la copia no se miraba) y «Yo también estaba» no cruzaba lo suyo con lo de Eric (la comparación pedía el mismo id de viaje). Eso encaja con TODO lo que viste, en las dos direcciones. El 9 <b>no</b> sale de «el día en que entró»: el servidor nunca usa esa fecha para el sello.</p>
<p><b>Qué he hecho:</b> <b>un viaje compartido y la copia propia de la misma persona son el mismo viaje</b>: lo que ganó en la copia cuenta en el compartido y las fechas son siempre las del viaje compartido (las del dueño: 8 – 13, 6 días, «08 NOV 2026»). Además, «Yo también estaba» ya no depende solo del id: también cuenta lo del compañero del mismo destino y de los días del viaje. La prueba reproduce el caso (Alicia con su copia 9 – 13 y tres sitios) y sale: sello «08 NOV 2026», ni «aún no está» ni «llevas 0», y lo de cada uno le sale al otro. Para confirmarlo con los datos reales: puntos 6 y 7 del SQL de diagnóstico.</p>
<p><b>«5 sitios» en el aviso:</b> el texto sale de lo que dice el servidor (<code>paradas_minimas</code> = 3 desde la V12). Un «5» solo puede venir de una respuesta vieja guardada en ese móvil: se renueva en cuanto el servidor contesta; con el arreglo de arriba, además, el aviso ya no sale si el sello está hecho.</p>

<h2>3. Las fechas del viaje no coincidían — de dónde sale el 14</h2>
<p>La etiqueta del mapa usa las fechas del viaje (<code>dateRange</code>: 8 – 13 nov). La tarjeta de RUTA, en cambio, <b>sumaba los días de la ruta guardada</b> y, en el último tramo, añadía además «el día de vuelta»: por eso acababa en el <b>14</b> («7 días · 6 noches · 08 – 14 nov»).</p>
<p><b>Ahora</b> el último tramo acaba el día que acaba el viaje: «6 días · 5 noches · 08 nov – 13 nov». El resumen, los recuerdos, el pasaporte, los logros y los plazos ya usaban las fechas del viaje, así que coinciden.</p>
<p><b>¿Cuántos viajes llevan un día de más vacío?</b> No lo puedo contar sin leer producción: el punto 5 del SQL de diagnóstico lo cuenta. <b>Cómo se arregla sin perder nada:</b> no hace falta tocar los datos, porque lo que se muestra ya sigue al calendario; si se quisiera limpiar la ruta, solo se quitaría el último día cuando no tiene ninguna parada (con una copia antes).</p>
${fig('ruta_fechas', 'RUTA: etiqueta y tarjeta, las dos 8 – 13 nov')}

<h2>4. La portada del Perfil ya no cambia al abrir</h2>
<p>La tarjeta salía primero con la foto del destino (Papagayo) y, al llegar las fotos del viaje, cambiaba a la tuya. Ahora la última portada que se vio de cada viaje se <b>guarda en el móvil</b> (una miniatura, porque las direcciones firmadas caducan) y sale ya al abrir; se renueva si la regla da otra. Y la regla es <b>una sola para toda la app</b> (la de la V14): una foto hecha en el destino, mejor de un sitio con logro; si no hay, la del destino. La usan el Perfil, el resumen y los recuerdos. (La primera vez en un móvil, sin nada guardado, aún puede verse el cambio una vez.)</p>
${fig('perfil_portada', 'La tarjeta de Lanzarote con su portada')}

<h2>5. «Ver el resumen del viaje» al momento</h2>
<p>«Preparando tu resumen…» solo la primera vez en un móvil: lo último que se vio de cada viaje (estado, resumen y logros de viajero) se guarda en el móvil y el resumen abre ya con eso mientras llega lo nuevo (la misma idea que la hoja de logros de la V9).</p>

<h2>6. Un punto de más en el globo</h2>
<p>Cada país visitado llevaba un punto dorado en su CENTRO (en España, cerca de Madrid). Quitados todos: ahora solo hay puntos en las <b>ciudades con viaje</b> (hechos, llenos; por hacer, huecos), nunca en el centro de un país. Tocar un punto lleva a la página de su país.</p>
${fig('globo_un_punto', 'España con un solo viaje: un punto, en Lanzarote')}

<h2>Lo que queda sin hacer o por mirar</h2>
<ul><li>Aplicar la migración <b>0081</b> (<code>supabase/migrations/0081_sellos_estampados.sql</code>; comprobación en <code>docs/dias/COMPROBAR_0081.sql</code>).</li>
<li>Pasar el SQL de diagnóstico (puntos 2 y 3) con datos reales: confirmará la fecha de alta de Alicia y cuántos viajes llevan un día de más.</li></ul>

<h2>Lista de comprobación de ESTA tanda</h2>
<label><input type="checkbox"> Estampar un sello en un móvil y, en otro con la misma cuenta, que el botón diga [Ver mi sello]</label>
<label><input type="checkbox"> El sello y el pasaporte de Alicia: «08 NOV 2026», 6 días, sin «aún no está» ni «llevas 0»</label>
<label><input type="checkbox"> «Ver el resumen del viaje»: sin «Preparando tu resumen…» a partir de la segunda vez</label>
<label><input type="checkbox"> El globo del pasaporte: solo puntos en las ciudades con viaje; ninguno en el centro de España</label>
<label><input type="checkbox"> A Alicia le sale la tarjeta «Eric consiguió N sitios…», el punto en el botón de logros y el aviso en la campana (y a Eric lo de Alicia)</label>
<label><input type="checkbox"> [Yo también estaba] funciona sin pase con el cobro apagado</label>
<label><input type="checkbox"> RUTA: «6 días · 5 noches · 08 nov – 13 nov» igual que la etiqueta del mapa</label>
<label><input type="checkbox"> Perfil, resumen, recuerdos y pasaporte con las mismas fechas (8 – 13 nov, «08 NOV 2026»)</label>
<label><input type="checkbox"> Abrir el Perfil: la tarjeta de Lanzarote sale ya con tu foto, sin pasar por Papagayo</label>
</body></html>`
fs.writeFileSync('docs/dias/REPASO_V15.html', html)
console.log('docs/dias/REPASO_V15.html', Math.round(html.length / 1024), 'KB')
