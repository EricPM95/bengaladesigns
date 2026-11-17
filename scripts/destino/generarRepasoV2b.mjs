// Genera docs/dias/REPASO_V2b.html. Se corre después de _v2b_repaso_capturas.mjs y de _v2b_sonda.mjs:
//   node scripts/destino/generarRepasoV2b.mjs
import fs from 'node:fs'

const b64 = (f) => (fs.existsSync(f) ? `data:image/jpeg;base64,${fs.readFileSync(f).toString('base64')}` : null)
const D = (id) => b64(`docs/dias/V2_capturas/design_${id}.jpg`)
const A = (f) => b64(`docs/dias/V2b_capturas/${f}`)
const par = (id, titulo, design, app, nota) => `<section class="par"><h3>${id} · ${titulo}</h3><div class="dos"><figure>${design ? `<img alt="Design ${id}" src="${design}">` : '<div class="no">sin captura</div>'}<figcaption>Design</figcaption></figure><figure>${app ? `<img alt="App ${id}" src="${app}">` : '<div class="no">sin captura de la app</div>'}<figcaption>La app</figcaption></figure></div>${nota ? `<p class="nota">${nota}</p>` : ''}</section>`
const lista = (xs) => `<ul class="cols">${xs.map((x) => `<li>${x}</li>`).join('')}</ul>`
const sinFoto = JSON.parse(fs.readFileSync('docs/dias/V2b_sitios_sin_foto.json', 'utf8'))
const pedazos = JSON.parse(fs.readFileSync('docs/dias/V2b_pedazos_por_sitio.json', 'utf8'))
const fin = A('app_fin_del_dia.jpg')

const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Repaso de la tanda V2b · Retoques del nuevo HOY</title>
<style>:root{--bg:#FBF6EC;--tx:#1C2230;--bd:rgba(28,34,48,.15)}@media (prefers-color-scheme:dark){:root{--bg:#1C2230;--tx:#FFFDF8;--bd:rgba(255,253,248,.2)}}body{margin:0;padding:16px;background:var(--bg);color:var(--tx);font:15px/1.5 system-ui,sans-serif;max-width:900px;margin-inline:auto}h1{font:400 28px/1.15 Georgia,serif}h2{font:400 22px Georgia,serif;margin-top:32px}h3{font-size:15px;margin:0 0 8px}.par{border-top:1px solid var(--bd);padding:16px 0}.dos{display:grid;grid-template-columns:1fr 1fr;gap:12px}figure{margin:0}img{width:100%;height:auto;border-radius:12px;border:1px solid var(--bd)}figcaption{font-size:12px;opacity:.65;text-align:center}.no{border:1px dashed var(--bd);border-radius:12px;min-height:160px;display:flex;align-items:center;justify-content:center;opacity:.6;font-size:13px}.nota{font-size:13.5px;opacity:.85}label{display:block;margin:8px 0}code{font-size:12.5px}.cols{columns:2;font-size:13px;padding-left:18px}details{margin:8px 0}summary{cursor:pointer;font-weight:600}@media (max-width:560px){.cols{columns:1}}</style></head><body>
<h1>Retoques del nuevo HOY (V2b)</h1>
<p>Probado con <code>pruebaV2Hoy</code> (ahora con los controles de esta tanda), <code>pruebaJutrip</code>, <code>pruebaV3</code>, las pruebas de HOY adaptadas y la muestra de 60 de Roma (idéntica). Ninguna prueba toca el Supabase de producción.</p>

<h2>0. ¿Está HOY v2 encendido en producción?</h2>
<p><b>Sí.</b> No he abierto Vercel (no tengo acceso a su panel desde aquí): lo he leído en lo que está desplegado. El trozo de la pantalla de ruta que sirve <code>bengaladesigns.vercel.app</code> lleva el interruptor compilado con <code>entorno:"true"</code>, es decir, <code>VITE_HOY_V2=true</code> cuando se hizo el último despliegue. No hay que cambiar nada.</p>

<h2>1. El aviso de arriba («A este ritmo llegarías…»)</h2>
<p><b>Por qué salía un aviso de un sitio que no estaba entre las paradas de hoy:</b> fue un fallo mío de la V2. Cuando la siguiente parada ya ha cerrado (o habrá cerrado al llegar), la V2 la pasa sola a «Lugares pendientes»: la tarjeta, «Tu día» y el contador ya no la cuentan. Pero el aviso de horario seguía calculando con el día completo de la ruta, donde esa parada seguía como «por hacer»: avisaba de los Museos Vaticanos (en Roma) o de los Jameos del Agua (en Lanzarote) que acababan de pasar a «Lugares pendientes». Y con el día terminado («Todo visto por hoy») seguía habiendo paradas que la ruta daba por no hechas.</p>
<p><b>Arreglo:</b> el aviso, la tarjeta de horarios de la mañana y su cuenta del ritmo miran ahora el día <i>sin</i> lo hecho, lo saltado ni lo que ha pasado a «Lugares pendientes». Solo puede hablar de paradas de hoy que aún se pueden hacer; con el día terminado no sale. Y es una tarjeta pequeña en ámbar, con su icono, el texto en una o dos líneas, su X y [Ver solución] como enlace pequeño dentro (como H2 de Design).</p>

<h2>2. «Ya estás aquí»: la línea de los pedazos</h2>
<p><b>La Plaza de San Pedro sí da 2 pedazos</b> («El país más pequeño del mundo» y «La Roma de Bernini»): lo comprobé con los datos reales del servidor, sitio por sitio (en Roma y en Lanzarote el servidor devuelve, para cada sitio con colección, justo sus colecciones). <b>No salía en mis capturas porque la demo de desarrollo no tiene servidor que conteste</b> a esa pregunta (la línea la pide el móvil al servidor con la coordenada de la parada). En una cuenta real sale. Para poder verlo y probarlo, la prueba ahora pone la respuesta real del servidor para esa parada (ayuda solo de desarrollo, <code>__pedazosDemo</code>) y comprueba el texto exacto.</p>
<p><b>En qué sitios sale y en cuáles no:</b> sale en los que están en alguna colección y con el pedazo aún por ganar (y solo mientras no lo has ganado); los emblemas ocultos nunca se nombran. Roma: ${pedazos.roma.con_pedazo.length} sitios con pedazo y ${pedazos.roma.sin_pedazo.length} sin. Lanzarote: ${pedazos.lanzarote.con_pedazo.length} con y ${pedazos.lanzarote.sin_pedazo.length} sin.</p>
<details><summary>Roma · con línea de pedazos (${pedazos.roma.con_pedazo.length})</summary>${lista(pedazos.roma.con_pedazo.map((x) => `${x.nombre} (${x.colecciones.length})`))}</details>
<details><summary>Roma · sin línea (no están en ninguna colección: ${pedazos.roma.sin_pedazo.length})</summary>${lista(pedazos.roma.sin_pedazo)}</details>
<details><summary>Lanzarote · con línea de pedazos (${pedazos.lanzarote.con_pedazo.length})</summary>${lista(pedazos.lanzarote.con_pedazo.map((x) => `${x.nombre} (${x.colecciones.length})`))}</details>
<details><summary>Lanzarote · sin línea (${pedazos.lanzarote.sin_pedazo.length})</summary>${lista(pedazos.lanzarote.sin_pedazo)}</details>
<p class="nota">Entre paréntesis, en cuántas colecciones está. «Mirador de los Helechos», por ejemplo, no está en ninguna colección de Lanzarote, así que no tiene línea de pedazos: no es un fallo.</p>

<h2>3. El reto del día</h2>
<p><b>No salía por lo mismo que los pedazos:</b> la demo de desarrollo no contesta a esa pregunta, así que no había retos que enseñar. Lo que dije («en la ruta de pruebas no hay colecciones que avancen hoy») estaba mal. Con los datos reales de ese día de Roma el servidor da retos (por ejemplo «El alma de Trastevere», «La Roma de Bernini», «El país más pequeño del mundo»…).</p>
<p><b>Y sí había un fallo de verdad en el servidor:</b> el reto único incluía colecciones que no avanzan hoy (sin ningún sitio en tu ruta de hoy, solo cerca de la zona), y «Y N colecciones más avanzan hoy» las contaba. Ahora solo entran las colecciones que se completan hoy o con algún sitio de hoy por ganar.</p>

<h2>4. «Lugares pendientes», como Design</h2>
<p>Cada sitio con su foto (a todo color; antes salía apagada y, además, sin cargar), el nombre, la pastilla con el motivo («Saltada hoy», «Ya ha cerrado») y los botones en dos filas, mitad y mitad, cada uno con su icono: [Pasar a otro día] en oro y [Recuperar hoy] arriba; [Ya lo visité] y [Quitar] abajo.</p>

<h2>5. Textos</h2>
<p>Al acabar el día: «Lo que dejaste para luego está abajo, en «Lugares pendientes»». Cambiados también los textos de HOY que mandaban lo quitado a «Si te sobra tiempo» cuando en realidad va a «Lugares pendientes»: «Una solución» del peligro y del horario, «¿Cómo vais?», la comida y «Pasar a otro día». (Los de otros días siguen diciendo «Si te sobra tiempo»: ahí sí es esa lista.)</p>
${fin ? `<figure style="max-width:300px"><img alt="Final del día" src="${fin}"><figcaption>El final del día</figcaption></figure>` : ''}

<h2>6. «Tus fotos de hoy»</h2>
<p>Solo sale si hay fotos de hoy, con la fila de fotos como Design (etiqueta y miniaturas de 88 px). Sin fotos, no sale, y se acabó el [+ Foto] (para hacer fotos está la cámara flotante).</p>

<h2>7. Sitios sin foto en nuestros datos</h2>
<p>San Pietro in Montorio y el Tempietto salen con un cuadrado de color porque <b>no tienen foto propia</b> en <code>data/dias/roma/_fotos.json</code> (no era un cruce fallido: el nombre del sitio coincide con el de la ruta). Sin foto propia, la app intenta Unsplash o Wikipedia y, si nada menciona el sitio, deja el color. La lista para completar:</p>
<details open><summary>Roma · sin foto propia (${sinFoto.roma.sin_foto_propia.length} de ${sinFoto.roma.total})</summary>${lista(sinFoto.roma.sin_foto_propia.map((x) => x.nombre))}</details>
<details open><summary>Lanzarote · sin foto propia (${sinFoto.lanzarote.sin_foto_propia.length} de ${sinFoto.lanzarote.total})</summary>${lista(sinFoto.lanzarote.sin_foto_propia.map((x) => x.nombre))}</details>
<p class="nota">En Lanzarote los tres están sin foto a propósito (en Commons no hay una buena con licencia libre). La lista completa, con el motivo de cada uno, en <code>docs/dias/V2b_sitios_sin_foto.json</code>.</p>

<h2>Pantallas al lado de Design</h2>
${par('A1', 'Ya estás aquí (Plaza de San Pedro, con sus 2 pedazos)', D('A1'), A('app_A1.jpg'), 'La línea «Aquí ganas 2 pedazos: «El país más pequeño del mundo» y «La Roma de Bernini»» (respuesta real del servidor, puesta a mano en la demo).')}
${par('A8', '«Lugares pendientes» abierto', D('A8'), A('app_A8.jpg'), 'Foto, nombre, pastilla y los 4 botones en dos filas.')}
${par('H1', 'HOY entero en «Ya estás aquí»', D('H1'), A('app_H1.jpg'), null)}
${par('H2', 'Con un aviso arriba', D('H2'), A('app_H2.jpg'), 'Un aviso de horario de verdad (a las 17:52 los Museos Vaticanos están a punto de cerrar), tarjeta pequeña en ámbar.')}
${par('H3', 'El reto del día', D('H3'), A('app_H3.jpg'), 'Un solo reto, con los datos reales de ese día de Roma.')}
${par('H3', 'La lista de «Y N colecciones más»', D('H3'), A('app_H3_lista.jpg'), null)}
${par('H6', '«Lugares pendientes» cerrado', D('H6'), A('app_H6.jpg'), null)}

<h2>Lista de comprobación de ESTA tanda</h2>
<label><input type="checkbox"> El aviso «A este ritmo llegarías…» nunca habla de una parada que no esté en «Tu día» de hoy (ni de una saltada, ni de «Lugares pendientes», ni con el día terminado)</label>
<label><input type="checkbox"> Es una tarjeta pequeña en ámbar, con icono, X y [Ver solución] como enlace pequeño</label>
<label><input type="checkbox"> En la Plaza de San Pedro (con una cuenta real): «Aquí ganas 2 pedazos: «El país más pequeño del mundo» y «La Roma de Bernini»»</label>
<label><input type="checkbox"> En un sitio sin colección (p. ej. Mirador de los Helechos) no sale la línea de pedazos</label>
<label><input type="checkbox"> Sale un solo reto del día, con «Y N colecciones más avanzan hoy ›» y su lista abierta; ninguna colección que no avance hoy</label>
<label><input type="checkbox"> «Lugares pendientes»: foto a todo color, nombre, pastilla con el motivo y 4 botones en dos filas con su icono</label>
<label><input type="checkbox"> Al acabar el día, la tarjeta dice «…está abajo, en «Lugares pendientes»»</label>
<label><input type="checkbox"> Ningún texto de HOY manda lo saltado a «Si te sobra tiempo»</label>
<label><input type="checkbox"> «Tus fotos de hoy» solo sale si hay fotos (y sin [+ Foto])</label>
<label><input type="checkbox"> Lista de sitios sin foto: decidir cuáles se completan</label>
</body></html>`
fs.writeFileSync('docs/dias/REPASO_V2b.html', html)
console.log(`REPASO_V2b.html: ${Math.round(html.length / 1024)} kB`)
