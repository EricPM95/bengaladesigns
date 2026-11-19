// Genera docs/dias/REPASO_V24.html (después de pruebaV24, que saca las capturas en docs/dias/V24_capturas): node scripts/destino/generarRepasoV24.mjs [antes] [despues]
//   «antes» y «despues»: lo que da medirDiasV24.mjs, como texto corto (p. ej. «3» y «4» días a la vista).
import fs from 'node:fs'

const antes = process.argv[2] ?? '?'
const despues = process.argv[3] ?? '?'
const img = (n) => (fs.existsSync(`docs/dias/V24_capturas/${n}.jpg`) ? `data:image/jpeg;base64,${fs.readFileSync(`docs/dias/V24_capturas/${n}.jpg`).toString('base64')}` : null)
const fig = (n, pie) => `<figure>${img(n) ? `<img alt="${pie}" src="${img(n)}" style="max-width:230px;border-radius:12px">` : '<div>sin captura</div>'}<figcaption>${pie}</figcaption></figure>`
const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Repaso de la tanda V24 · Días</title>
<style>:root{--bg:#FBF6EC;--tx:#1C2230}@media (prefers-color-scheme:dark){:root{--bg:#1C2230;--tx:#FFFDF8}}body{margin:0;padding:16px;background:var(--bg);color:var(--tx);font:16px/1.5 system-ui,sans-serif;max-width:800px}h1{font-size:24px}h2{font-size:19px;margin-top:28px}code{font-size:13px}label{display:block;margin:6px 0}figure{display:inline-block;margin:8px 10px 8px 0;vertical-align:top}figcaption{font-size:12.5px;opacity:.7;max-width:230px}table{border-collapse:collapse;font-size:14px}td,th{border:1px solid rgba(128,128,128,.35);padding:4px 8px;text-align:left}</style></head><body>
<h1>DÍAS con el alojamiento arriba y los días que ya pasaron (V24)</h1>
<p>Probado con <code>pruebaV24</code> (42 comprobaciones), <code>pruebaJutrip</code> y las de DÍAS, HOY y alojamiento. La muestra de 60 viajes de Roma no se ha vuelto a pasar: no se ha tocado el motor de rutas.</p>

<h2>1. El alojamiento y el vehículo, arriba (Design «Alojamiento Aviso»)</h2>
<ul><li><b>Sin alojamiento:</b> bloque con borde de puntos, la cama, «Añade tu alojamiento», debajo «Para ajustar tu ruta a tu zona» y el botón redondo dorado [+] (lleva a RESERVAS › Alojamiento, como antes).</li>
<li><b>Con alojamiento:</b> «TU ALOJAMIENTO · PRATI» (la zona; sin el pase, la ciudad), el nombre, la dirección y [Ir] (el mapa del móvil con el camino hasta el hotel: el mismo enlace de siempre, <code>direccionAlojamiento.ts</code>). Se queda siempre. Sin el pase, [Ir] lleva el candado y abre el aviso del pase.</li>
<li><b>Vehículo</b> (solo si el viaje lleva uno de alquiler: el coche como en Lanzarote o la autocaravana): mismo bloque de puntos, su icono, «Añade tu vehículo de alquiler» y debajo <b>«Necesario para todo tu viaje»</b>, y [+]. <b>Reservado, su bloque desaparece de DÍAS</b> (ya sale en RESERVAS). Con autocaravana no sale el alojamiento (se duerme en ella), como antes.</li>
<li><b>Varios destinos:</b> los bloques de cada destino van encima de sus días (el del vehículo, una sola vez, arriba del todo).</li>
<li><b>Qué había dentro de los días y dónde:</b> en el <b>día 1</b> iba el alojamiento (y debajo, el coche de alquiler o la autocaravana); en el <b>primer día de cada destino</b> (cada estancia) iba también su alojamiento. Todo eso estaba en <code>DayDetailPanel.tsx</code> (acordeón del día abierto); <b>ya no está ahí</b>. El día 1 se queda con la tarjeta de llegada («LLEGADA · DESDE …»).</li>
<li><b>Dónde se ve:</b> en todos los destinos y en el móvil de un compañero de viaje (cada uno ve su alojamiento, o el «para todos» del administrador, porque el dato es el mismo de siempre).</li></ul>
${fig('dias_sin_alojamiento', 'Sin alojamiento')}${fig('dias_con_alojamiento', 'Con alojamiento')}${fig('dias_con_vehiculo', 'Con vehículo sin reservar')}

<h2>2. Las tarjetas de los días, más estrechas</h2>
<table><tr><th>Qué</th><th>Antes</th><th>Ahora (como Design)</th></tr>
<tr><td>Alto mínimo de la fila</td><td>80 px</td><td>60 px</td></tr>
<tr><td>Relleno arriba / abajo</td><td>12 px / 12 px</td><td>8 px / 8 px (4 px menos cada lado)</td></tr>
<tr><td>Relleno izquierda / derecha</td><td>16 / 12 px</td><td>14 / 10 px</td></tr>
<tr><td>Hueco entre cuadrado y título</td><td>14 px</td><td>12 px</td></tr>
<tr><td>Título del día</td><td>22 px</td><td>18 px</td></tr>
<tr><td>Número del cuadradito (y día de la semana)</td><td>22 px (9 px)</td><td>19 px (8,5 px)</td></tr></table>
<p><b>La zona de tocar</b> no baja de 44 px (la fila entera es el botón y mide 60 como poco). <b>Días a la vista de una vez</b> en un iPhone (375 × 812): antes <b>${antes}</b>, ahora <b>${despues}</b> (medido con <code>medirDiasV24.mjs</code>, con los bloques de arriba incluidos).</p>

<h2>3. Los días que ya pasaron (Design P1 y P2)</h2>
<ul><li>Durante el viaje, los días anteriores a hoy salen <b>en gris suave</b>, con el nombre que se lee bien, <b>un ✓ verde pequeño</b> en lugar del «…», debajo <b>«Hecho · 12 fotos»</b> (las fotos de ese día) o <b>«Hecho · Ver tu día»</b> si no hay, y <b>sin el asa</b> de arrastrar.</li>
<li><b>Sin etiqueta «HOY»</b> en el día de hoy (quitada).</li>
<li><b>No se cambian:</b> ni mover ni borrar el día, ni añadir, quitar o mover paradas dentro, ni arrastrar otro día delante. Está hecho <b>en el almacén</b> (aunque HOY, una propuesta o otro sitio lo pidan, no pasa) y la pantalla además esconde las herramientas.</li>
<li><b>Se abren para verlos:</b> sus paradas, sin herramientas de cambiar (la fotos de ese día siguen en su sitio de siempre).</li>
<li><b>El día de hoy sí se cambia</b> y lo de DÍAS sale al momento en HOY, y al revés: <b>sí, ya funcionaba</b> (el mismo dato; probado: una parada añadida hoy en DÍAS sale en HOY).</li>
<li><b>El día cambia a medianoche en el destino</b>, no en el móvil: <code>todayIso(zona)</code> con la zona de Roma o de Lanzarote (la tabla de <code>zonaHoraria.ts</code>); HOY usa la misma.</li>
<li><b>Viaje terminado:</b> todos los días en «Hecho». <b>Antes de empezar:</b> ninguno. <b>Viaje compartido:</b> igual para todos (la regla sale de las fechas y del almacén, no de quién mira).</li>
<li><b>Interruptor [Roma | Excursión]:</b> en un día pasado no sale (no se cambia).</li></ul>
${fig('dias_dia1_hecho', 'El día 1 en «Hecho», estando en el día 2')}${fig('dias_dia1_abierto', 'Abierto para verlo')}${fig('hoy_con_la_parada', 'Lo añadido hoy sale en HOY')}

<h2>Lista de comprobación de ESTA tanda</h2>
<label><input type="checkbox"> DÍAS: el alojamiento arriba, de puntos si no hay y con nombre y [Ir] si hay</label>
<label><input type="checkbox"> El día 1 abierto no repite el alojamiento</label>
<label><input type="checkbox"> Lanzarote: el vehículo de alquiler arriba y, al reservarlo, desaparece</label>
<label><input type="checkbox"> Las tarjetas de los días caben más; tocarlas sigue siendo fácil</label>
<label><input type="checkbox"> Durante el viaje: los días pasados en gris con ✓ y «Hecho · …», sin asa</label>
<label><input type="checkbox"> Un día pasado se abre pero no deja cambiar nada</label>
<label><input type="checkbox"> El día de hoy sin etiqueta «HOY» y lo que se añade sale en HOY</label>
<label><input type="checkbox"> [Ir] del alojamiento abre el mapa del móvil con el camino</label>
</body></html>`
fs.writeFileSync('docs/dias/REPASO_V24.html', html)
console.log('docs/dias/REPASO_V24.html', Math.round(html.length / 1024), 'KB')
