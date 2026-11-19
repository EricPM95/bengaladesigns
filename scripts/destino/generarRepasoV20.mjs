// Genera docs/dias/REPASO_V20.html (después de pruebaV20 y _capturaPanelV20, que sacan las capturas en docs/dias/V20_capturas): node scripts/destino/generarRepasoV20.mjs
import fs from 'node:fs'

const img = (n) => (fs.existsSync(`docs/dias/V20_capturas/${n}.jpg`) ? `data:image/jpeg;base64,${fs.readFileSync(`docs/dias/V20_capturas/${n}.jpg`).toString('base64')}` : null)
const fig = (n, pie, ancho = 200) => `<figure>${img(n) ? `<img alt="${pie}" src="${img(n)}" style="max-width:${ancho}px;border-radius:12px">` : '<div>sin captura</div>'}<figcaption>${pie}</figcaption></figure>`
const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Repaso de la tanda V20 · Cuéntanos</title>
<style>:root{--bg:#FBF6EC;--tx:#1C2230}@media (prefers-color-scheme:dark){:root{--bg:#1C2230;--tx:#FFFDF8}}body{margin:0;padding:16px;background:var(--bg);color:var(--tx);font:16px/1.5 system-ui,sans-serif;max-width:800px}h1{font-size:24px}h2{font-size:19px;margin-top:28px}code{font-size:13px}label{display:block;margin:6px 0}figure{display:inline-block;margin:8px 10px 8px 0;vertical-align:top}figcaption{font-size:12.5px;opacity:.7;max-width:200px}</style></head><body>
<h1>El botón «Cuéntanos», al estilo de Waze (V20)</h1>
<p>Probado con <code>pruebaV20</code> (app: 56 comprobaciones), <code>pruebaV20_servidor</code> (servidor y base de datos de verdad: 149), <code>pruebaTanda10J</code>, <code>pruebaCuentas3</code>, <code>pruebaJutrip</code> y la de «Propón un sitio» (10S5 K).</p>

<h2>1. El botón</h2>
<p>El <b>tercer botón flotante</b>, con el icono de aviso de Design, <b>igual que la cámara y el trofeo</b> (44 px, crema con aro dorado) y <b>encima de todos</b> (cámara, trofeo, lápiz y «Reorganizar»): se coloca midiendo dónde están los otros, así nunca los tapa. Sale en todas las pestañas y destinos, también <b>sin viaje y sin cuenta</b> (comprobado). ${''}</p>
${fig('boton', 'El botón, encima de los otros')}${fig('U1_menu', 'U1 · ¿Qué quieres contarnos?')}

<h2>2. Las pantallas (U1 a U4)</h2>
<ul><li>U1 con los 8 botones; U2a restaurante, U2b lugar, U2c/U2d dato mal (con el sitio ya puesto desde una ficha, o con buscador), U2e consejo, U2f algo no funciona (con la <b>captura ya puesta y su ×</b> y la línea pequeña), U2g idea, U2h el mapa con el pin fijo, U2i destino (con «Avísame cuando esté»), U2j comparte tu foto (<b>casilla obligatoria</b>) y U3 el gracias.</li>
<li><b>«Un dato está mal» desde una ficha:</b> la ficha de cada sitio lleva «¿Hay algún dato mal? Cuéntanoslo» y abre U2c con el sitio puesto.</li>
<li><b>«Propón un sitio»</b> ya no es una hoja aparte: es U2b con el nombre ya escrito. Todo lo que la abría (Añadir otra reserva) abre U2b.</li>
<li>«Avísame cuando lo revisemos» sale encendido en todas (en U2i, «Avísame cuando esté»; en «Comparte tu foto» no hay interruptor: siempre se avisa si la elige).</li></ul>
${fig('U2a_restaurante', 'U2a')}${fig('U2h_mapa', 'U2h · el mapa')}${fig('U3_gracias', 'U3')}${fig('U2b_lugar', 'U2b')}${fig('U2c_dato_mal', 'U2c')}${fig('U2d_dato_mal_buscador', 'U2d')}${fig('U2e_consejo', 'U2e')}${fig('U2f_no_funciona', 'U2f')}${fig('U2g_idea', 'U2g')}${fig('U2i_destino', 'U2i')}${fig('U2j_foto', 'U2j')}
<p><b>Capturas al lado de Design:</b> el diseño está en <code>docs/diseno/proyecto/Cuentanos Boton.dc.html</code> (ábrelo en el navegador y ponlo al lado; no he podido sacar su captura desde aquí).</p>

<h2>3. Lo que se manda solo</h2>
<p>Siempre: el destino y el viaje, la pantalla y la pestaña, la parada o el día si viene de ahí, la versión de la app (el commit del despliegue), el modelo de móvil y el navegador, y la hora. En «Algo no funciona», además, los últimos 5 errores de la app (limpios con <code>tacharLlaves</code>: sin correos, tokens ni claves) y la captura, solo si no la quita. Las fotos van <b>reducidas</b> (lado largo 1.280 px); en «Comparte tu foto» va <b>entera</b>, con el sí a la casilla, la fecha y el nombre. <b>Sin conexión</b> se guarda en el móvil (también las fotos) y se manda solo al volver la red (probado). <b>Freno:</b> 30 por minuto en total, 5 por minuto del mismo texto y 10 por hora por cuenta o por dispositivo (sin guardar la IP).</p>

<h2>4. Dónde se guarda y quién lo ve</h2>
<ul>
<li><b>Tabla nueva <code>avisos_de_viajeros</code></b> (no amplío <code>propuestas_de_sitio</code>: esta guarda cosas distintas —punto, fotos, captura, estado, quién pidió el aviso— y dejarlas separadas es más limpio; la vieja queda sin usar). Migraciones <b>0085</b> (tabla, almacén privado de fotos y capturas, almacén público de las fotos elegidas y un tipo nuevo de aviso de la campana) y <b>0086</b> (<code>empezar_de_cero</code> con la tabla en su inventario; partida de la última versión, que era la 0074, y comprobada con <code>diff</code>). Cada una con su <code>COMPROBAR</code> en un solo resultado.</li>
<li>Con cuenta y «Avísame» encendido se guarda quién es, solo para avisarle; sin cuenta, o con «Avísame» apagado, <b>nada de la persona</b> (probado). Es una tabla con datos de una persona: las tres cosas de CLAUDE.md hechas (migración 0086, inventario de <code>pruebaTanda10J</code> con una fila sembrada, y esa prueba en 0).</li>
<li><b>Panel de administrador</b> (pestaña «Avisos de viajeros», con el número de nuevos): lista con filtro por tipo, destino y estado; cada aviso con todo lo que mandó, su captura, sus fotos y el punto en un mapa pequeño; [Visto], [Hecho y avisar] (con el texto editable) y [Descartar]; «Destinos más pedidos» con [Ya está] (avisa a todos los que lo pidieron, uno por persona) y las fotos con [Usar en la app] (la copia a un almacén público con «Foto: nombre»).</li>
<li>Los avisos de la campana (U4): «Gracias a ti, ya está arreglado: …», «Hemos añadido … ¡Gracias!», «¡Lisboa ya está en JUTRIP! Tú lo pediste.».</li></ul>
${fig('panel_avisos', 'El panel con avisos de prueba', 380)}

<h2>5. ¿Se puede mandar un correo a Eric con cada aviso nuevo?</h2>
<p><b>Sí.</b> Hoy la app no tiene ningún servicio de correo. Haría falta: (1) una cuenta en un servicio de envío (Resend, Brevo…); (2) su clave en Vercel (<code>RESEND_API_KEY</code>), que tienes que poner tú, y un correo de envío verificado; (3) tu correo de destino en una variable; y (4) unas 20 líneas en <code>server/avisosViajeros.js</code> que lo mandan al guardar un aviso nuevo (con freno, para que no te inunden). Alternativa sin correo: un aviso al móvil con el sistema de avisos que ya existe (<code>web-push</code>), o mirar el número de nuevos del panel.</p>

<h2>6. Privacidad</h2>
<p>La pantalla de «Privacidad y condiciones» dice ya qué manda «Cuéntanos» y para qué (apartado «Para qué lo usamos»). Los textos legales del resto siguen «pendientes» (ya está en la lista PARA ERIC de la V19).</p>

<h2>Para ti (Eric)</h2>
<ul><li>Pegar las migraciones <b>0085</b> y <b>0086</b> (en ese orden) y sus <code>COMPROBAR_0085.sql</code> y <code>COMPROBAR_0086.sql</code>. Sin ellas, los avisos se reciben pero no se guardan (el servidor lo dice y lo apunta en su registro).</li>
<li>Decidir si quieres el correo por cada aviso nuevo.</li></ul>

<h2>Lista de comprobación de ESTA tanda</h2>
<label><input type="checkbox"> El botón «Cuéntanos» sale encima de la cámara y el trofeo, en RUTA, DÍAS, HOY… y también sin viaje</label>
<label><input type="checkbox"> Abre «¿Qué quieres contarnos?» con los 8 botones</label>
<label><input type="checkbox"> Añadir un restaurante con «Buscar en el mapa»: el pin y la dirección</label>
<label><input type="checkbox"> «Un dato está mal» desde la ficha de un sitio: el sitio ya viene puesto</label>
<label><input type="checkbox"> «Algo no funciona»: la captura sale puesta y se puede quitar</label>
<label><input type="checkbox"> «Comparte tu foto» no deja enviar sin marcar la casilla</label>
<label><input type="checkbox"> Sin red: sale «Lo mandamos en cuanto vuelva la conexión» y llega al volver</label>
<label><input type="checkbox"> En el panel: ver el aviso, [Hecho y avisar] y que llegue a la campana de esa persona</label>
</body></html>`
fs.writeFileSync('docs/dias/REPASO_V20.html', html)
console.log('docs/dias/REPASO_V20.html', Math.round(html.length / 1024), 'KB')
