// Genera docs/dias/REPASO_V5.html. Se corre después de pruebaV5 (que saca las capturas en docs/dias/V5_capturas):
//   node scripts/destino/generarRepasoV5.mjs
import fs from 'node:fs'

const img = (f) => (fs.existsSync(f) ? `data:image/jpeg;base64,${fs.readFileSync(f).toString('base64')}` : null)
const C = (n) => img(`docs/dias/V5_capturas/${n}.jpg`)
const fig = (n, pie) => { const s = C(n); return `<figure>${s ? `<img alt="${pie}" src="${s}">` : '<div class="no">sin captura</div>'}<figcaption>${pie}</figcaption></figure>` }
const resultados = fs.existsSync('docs/dias/_v5_resultados.json') ? JSON.parse(fs.readFileSync('docs/dias/_v5_resultados.json', 'utf8')) : []
const filas = resultados.map((r) => `<tr><td>${r.nombre}</td><td>${r.comprobaciones ?? ''}</td><td>${r.fallos}</td></tr>`).join('')

const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Repaso de la tanda V5 · Reclamar con tus fotos</title>
<style>:root{--bg:#FBF6EC;--tx:#1C2230;--bd:rgba(28,34,48,.15)}@media (prefers-color-scheme:dark){:root{--bg:#1C2230;--tx:#FFFDF8;--bd:rgba(255,253,248,.2)}}body{margin:0;padding:16px;background:var(--bg);color:var(--tx);font:15px/1.5 system-ui,sans-serif;max-width:860px;margin-inline:auto}h1{font:400 30px/1.1 Georgia,serif}h2{font:400 22px/1.2 Georgia,serif;margin-top:28px;border-top:1px solid var(--bd);padding-top:14px}table{border-collapse:collapse;width:100%;font-size:13px}td,th{border:1px solid var(--bd);padding:5px 7px;text-align:left;vertical-align:top}.nota{font-size:12.5px;opacity:.7}figure{margin:8px 10px 8px 0;display:inline-block;vertical-align:top;max-width:230px}img{max-width:100%;height:auto;border:1px solid var(--bd);border-radius:10px}figcaption{font-size:12px;opacity:.7}.no{padding:30px;border:1px dashed var(--bd)}label{display:block;margin:6px 0}code{font-size:12.5px;background:rgba(127,127,127,.15);padding:1px 4px;border-radius:4px}</style></head><body>
<h1>Reclamar con tus fotos (V5)</h1>
<p>Probado con <code>pruebaV5</code> (nueva), <code>pruebaJutrip</code>, <code>pruebaV3</code>, las pruebas de logros de Roma y de Lanzarote y las de HOY. La muestra de 60 viajes de Roma sale idéntica. Ninguna prueba toca el Supabase de producción.</p>
${filas ? `<table><tr><th>Prueba</th><th>Comprobaciones</th><th>Fallos</th></tr>${filas}</table>` : ''}

<h2>Cómo reclama Eric ahora sus sitios de Lanzarote</h2>
<p><b>Abre el viaje, toca el botón de los logros y pulsa [Reclamar con tus fotos]: elige de la galería todas las fotos del viaje a la vez.</b> La app las comprueba una a una; las que traen ubicación ganan solas el sitio donde se hicieron (esté o no en la ruta) y, para las que no la traen, te pregunta de qué sitio son. Puedes hacerlo hasta 30 días después del último día del viaje, y solo con el pase (como la cámara de los logros).</p>

<h2>0. Lo que he comprobado primero</h2>
<p><b>El iPhone y la galería (NO he podido probarlo).</b> No tengo un iPhone aquí, así que no he podido comprobar con fotos reales si Safari (y la app instalada) quita la ubicación, la fecha o la marca y modelo al elegir de la galería. Lo que sé: la app solo lee EXIF de JPEG (marca, modelo, fecha de la toma y GPS), y las fotos de la galería de iPhone suelen llegar como JPEG con la fecha y el modelo; la ubicación es lo que más fácilmente se pierde (en el selector de fotos de iOS hay que dejar activada la opción de ubicación). Por eso el diseño aguanta que falte: <b>sin ubicación pregunta de qué sitio es la foto</b>. Lo que sí rompería todo es que quitara la <i>marca y modelo</i>: entonces cada foto saldría en la lista de «no cuentan» con «no parece de la cámara de tu móvil». <b>Prueba de 1 minuto para Eric:</b> con 3 fotos reales del iPhone (una con ubicación, una sin y una captura de pantalla), pulsa [Reclamar con tus fotos]: si las dos primeras no salen como «no cuentan», la marca y la fecha llegan bien; si no pide sitio para la segunda, la ubicación llega.</p>
<p><b>Cómo se ganan hoy los emblemas con fotos de la galería</b> (lo he comprobado en el servidor con datos reales): la hora que cuenta es la <b>hora de la toma</b> de la foto (la fecha EXIF, leída como hora del destino), no la de cuando se sube. Madrugador (Lanzarote, <code>lz_madrugador</code>) sale con una foto de antes de las 08:00 en cualquier sitio; el <code>atardecer_atlantico</code>, con una foto desde una hora antes de la puesta de sol hasta un cuarto de hora después, en uno de sus 8 sitios de la costa oeste; el <code>madrugador</code> de Roma, con una foto antes de las 08:00 en uno de los imprescindibles. Todo ello vale por la galería <b>si hay sitio</b> (por su ubicación o porque la persona lo elige). Y como cualquier foto válida de un sitio da su emblema, la del Coliseo da el emblema del Coliseo. Los Vistos sin foto nunca dan emblemas.</p>
<p><b>Migración:</b> no hace falta ninguna (no hay tablas nuevas): todo usa lo que ya hay. <b>Lo ganado sin pase:</b> hoy una foto sin pase no deja ningún hecho en el servidor (se descarta antes), así que <b>nunca</b> da pedazos, ni si luego compra el pase; el pase cuenta desde que se compra, y lo que se reclame con la galería ya con el pase sí cuenta.</p>

<h2>1. Un sitio fijo: [Reclamar con tus fotos]</h2>
<p>En la hoja de logros del viaje, fijo bajo la cabecera, con el plazo debajo («Puedes reclamar hasta el 13 de diciembre»). Sale durante el viaje y hasta que acaba el plazo. Sin pase, con el candado pequeño y lleva al pase. «Lo de ayer también cuenta» sigue saliendo y dice «Ayer tenías en tu ruta: …» durante el viaje y «En tu viaje tenías: …» después, con el botón [Reclamar con tus fotos].</p>
${fig('boton_reclamar', 'El botón con el pase')}${fig('boton_reclamar_sin_pase', 'Sin pase: con el candado pequeño')}

<h2>2. Elegir varias fotos a la vez y 3. el resumen</h2>
<p>Cada foto pasa por el servidor (<code>evaluarFoto</code>: cámara del móvil y días del viaje). Con ubicación cuenta para CADA sitio con logro en cuyo radio cae (si cae en dos, para los dos; varias del mismo sitio cuentan una vez). Sin ubicación, al final pregunta «¿De qué sitio es esta foto?» (primero las paradas de ese día sin su pedazo, luego el resto con buscador; se puede saltar). Lo que no vale va a una lista corta con el motivo. Las que valen van también a los recuerdos de su día. Si se corta la red, la foto queda en la cola del móvil y se comprueba sola al volver la señal. Al acabar: «Has ganado N pedazos y M emblemas», con los sitios y sus fotos; las sorpresas pasan por la fila de momentos de la V3 de una en una, y si son más de 6, [Ver todo en Logros].</p>
${fig('subiendo', 'Comprobando N de 10…')}${fig('pregunta', '¿De qué sitio es esta foto?')}${fig('resumen', 'El resumen')}${fig('resumen_no_valen', 'Las que no cuentan, con su motivo')}

<h2>4. El mismo día y la cámara flotante</h2>
<p>La hoja «Parece que no estás en…» ahora pregunta «¿Ya has estado hoy en …? Sube una foto que hiciste allí y gana tu pedazo.» con [Elegir de la galería]. La cámara flotante, con pase y durante el viaje, ofrece [Hacer foto] y [Subir de la galería] (esta última, lo del reclamo).</p>

<h2>4b. La cámara, en todas las pantallas del viaje</h2>
<p>Ruta, Días, Explorar, Reservas y HOY: el mismo botón en el mismo sitio, justo encima del de logros. Sin pase ya no lleva candado: solo hace fotos, <b>una por parada</b> (donde estás, o la del momento del día), al álbum y <b>sin logros</b>; la segunda en la misma parada pregunta «Sin el Pase, una foto por lugar. ¿Cambias la que tenías?». Con pase, sin límite y con recompensas. Mientras la hoja de «Tu cámara de viaje» y el segundo párrafo del pase son los de Eric (con candado pequeño y enlace al pase sin pase).</p>
${fig('hoja_camara_con_pase', 'La hoja, con pase')}${fig('hoja_camara_sin_pase', 'La hoja, sin pase')}${fig('camara_ruta', 'La cámara en Ruta')}${fig('camara_hoy', 'La cámara en HOY')}

<h2>4c. El botón de los logros</h2>
<p>Mide lo mismo que la cámara (52 px; antes 58), uno encima del otro, en las mismas pantallas. Sin nada ganado ya no es un círculo blanco casi vacío: lleva el trofeo en oro sobre un fondo crema. Con logros, como antes.</p>
${fig('flotantes_sin_logros', 'Los dos flotantes, sin logros')}

<h2>Lo que no he podido comprobar</h2>
<ul><li>El iPhone real (ver el punto 0).</li><li>Con una cuenta real y Supabase: las pruebas usan la demo y el servicio de verdad sobre un repositorio en memoria, nunca producción.</li><li>El «Elegir de la galería» y la subida a los recuerdos con un álbum real (necesita Supabase).</li></ul>

<h2>Lista de comprobación de ESTA tanda</h2>
<label><input type="checkbox"> Con 3 fotos reales del iPhone (con ubicación, sin ella y una captura), [Reclamar con tus fotos] se comporta como en este repaso</label>
<label><input type="checkbox"> El botón sale en la hoja de logros durante el viaje y hasta el último día del plazo, con la frase «Puedes reclamar hasta el …»</label>
<label><input type="checkbox"> Sin pase, el botón lleva el candado pequeño y abre el aviso del pase</label>
<label><input type="checkbox"> Elegir muchas fotos a la vez y ver «Comprobando N de M…»</label>
<label><input type="checkbox"> Una foto sin ubicación pregunta de qué sitio es (primero los de ese día), con buscador y se puede saltar</label>
<label><input type="checkbox"> El resumen dice «Has ganado N pedazos y M emblemas», con los sitios; lo que no vale sale en una lista corta con el motivo</label>
<label><input type="checkbox"> Con más de 6 sorpresas, sale [Ver todo en Logros] en vez de una pantalla por sorpresa</label>
<label><input type="checkbox"> «Lo de ayer también cuenta» dice «Ayer tenías en tu ruta…» durante el viaje y «En tu viaje tenías…» después, con su botón</label>
<label><input type="checkbox"> «¿Ya has estado hoy en …?» con [Elegir de la galería]</label>
<label><input type="checkbox"> La cámara sale igual en Ruta, Días, Explorar, Reservas y HOY, sin tapar la barra ni los botones del mapa</label>
<label><input type="checkbox"> Sin pase: una foto por parada, la segunda pregunta si cambias la primera, y nada de pedazos ni emblemas</label>
<label><input type="checkbox"> El botón de logros mide lo mismo que la cámara y, sin nada ganado, se ve dorado y vivo</label>
</body></html>`
fs.writeFileSync('docs/dias/REPASO_V5.html', html)
console.log('docs/dias/REPASO_V5.html', Math.round(html.length / 1024), 'KB')
