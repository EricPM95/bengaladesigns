// REPASO de la Tanda V38E: el estudio con la animación entera en la línea de tiempo.
import fs from 'node:fs'
const D = 'docs/dias/V38E_capturas'
const img = (f) => (fs.existsSync(`${D}/${f}.jpg`) ? `<img src="V38E_capturas/${f}.jpg" alt="${f}">` : '<i>(sin captura)</i>')
const li = (x) => `<ul>${x.map((i) => `<li>${i}</li>`).join('')}</ul>`
const html = `<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>REPASO V38E</title><style>body{font:15px/1.5 system-ui,sans-serif;max-width:1100px;margin:0 auto;padding:16px;color:#1C2230}table{border-collapse:collapse;width:100%;font-size:13px}th,td{border:1px solid #ddd;padding:6px 8px;text-align:left;vertical-align:top}th{background:#f3ecd9}img{max-width:100%;border:1px solid #ddd;border-radius:8px;margin:6px 0}code{background:#f3ecd9;padding:1px 4px;border-radius:4px}.eric{background:#FFF7DC;border:1px solid #D8BE84;border-radius:10px;padding:4px 16px}</style>
<h1>V38E · El estudio con la animación entera en la línea de tiempo</h1>
<p><b>Solo el estudio de sonidos (/admin/sonidos); la app no cambia.</b></p>
<h2>Lo que pasaba</h2>
<p>La tarjeta del Coliseo decía «4,2 s» y las barras de ms llegaban a +4.200 ms: la duración salía de la partitura del suspense (los latidos), no de la animación que se ve (unos 24 s de película). Así Eric no podía llevar el riser de 12 s ni el destello donde quería: se le amontonaba todo al principio.</p>
<h2>Lo que hay ahora</h2>
${li([
  '<b>«dura X s» es la animación entera, de principio a [Seguir]</b>, sacada de los mismos números que la propia animación (y comparada con ellos en la prueba): Coliseo 25,6 s; emblema de Roma 13,7 s (3,6 de espera + 10,1 de escena); emblema de Lanzarote 13,4 s; final de las 7 maravillas 10,4 s; medallas 2,4 / 4,4 s; colección 4,2 s; pedazos según cuántos…',
  '<b>La línea de tiempo enseña esa duración entera</b>, con una <b>regla de segundos</b> y las <b>marcas de los momentos clave con su rótulo</b>: latidos, la luz que estalla, empieza la escena, aparece el emblema, el nombre, [Seguir]; en el Coliseo sus momentos propios («Casi 2.000 años esperándote…», segunda frase, vuelan las partículas de oro, se dibuja el Coliseo, se enciende, el oro se junta, estalla el destello, los textos, [Seguir]); en las 7 maravillas las monedas quietas, el choque, la medalla que gira y para, el barrido.',
  '<b>Zoom (+ / −)</b> ×1, ×2, ×4, ×8: la línea se amplía y se desliza de lado.',
  '<b>Cada sonido en su segundo de la animación entera</b>: los de la escena (que empieza a los 3,6 s en Roma) ya salen en su sitio, no al principio.',
  '<b>Las barras de ms de TODOS los sonidos</b> (de Code y de Eric) van de −duración a +duración (en el Coliseo, ±25.600 ms).',
  '<b>Arrastrar</b> funciona en toda la longitud. <b>Un campo debajo de cada sonido</b>: «empieza en 12,40 s», desde el principio de la animación (con coma o punto; se aplica al salir del campo o con Intro). Arrastrar y escribir el mismo segundo dan lo mismo.',
  '<b>[▶ desde aquí]</b>: toca la línea de tiempo (sale una raya azul con el segundo) y pulsa el botón: la animación salta a ese punto y suenan solo los sonidos que caen después (los que ya pasaron no; uno que está sonando entra a mitad). Si el punto cae después del suspense de un emblema, se salta la espera.',
])}
<h2>Capturas</h2>
${img('coliseo_linea_de_tiempo')}
${img('maravillas_linea_de_tiempo')}
${img('emblema_desde_8')}
<h2>Al aplicar el zip</h2>
<p>El <code>estudio.json</code> del zip lleva ahora, de cada animación, su duración entera y en qué segundo empieza cada parte (<code>tramos</code>: p. ej. la escena de Roma a los 3,6 s). El lector (<code>aplicarEstudio.mjs</code>) lo valida y lo enseña en palabras: «empieza en el segundo 18,00 de la animación» y «Partes: «escena» empieza en el segundo 3,60». El motor (<code>motor.ts</code>) ya cuenta «desde el principio» y «desde el golpe» desde el principio de la animación entera (opción <code>inicio</code>): con eso cada sonido cae en su segundo exacto. <b>La app todavía no lee ese zip</b> (lo aplicará Code cuando lo pidas); la prueba comprueba el motor y el lector.</p>
<h2>Tu lista de comprobación de esta tanda</h2>${li([
  '/admin/sonidos → «Coliseo»: dice «dura 25,6 s (hasta [Seguir])»; la línea de tiempo llega a los 25,6 s con la regla y sus marcas.',
  'Mueve el riser (el redoble) hasta los 18 s, arrastrándolo y escribiendo «18,00»: suena a los 18 s al darle a ▶ Ver con sonido.',
  'Toca la línea de tiempo cerca de los 20 s y pulsa [▶ desde aquí]: la película salta ahí y solo suena lo que viene después.',
  'Prueba el zoom (+ / −) en la línea de tiempo.',
  'Mira «Emblema de Roma» (13,7 s: el suspense y la escena), «Emblema de Lanzarote» y «Las 7 maravillas».',
  'Tus sonidos guardados siguen donde estaban.',
])}
<div class="eric"><h2>PARA ERIC</h2>${li([
  '<b>Tu guardado no se ha tocado:</b> cada sonido se queda donde estaba. Con una salvedad lógica: en los emblemas de Roma, un sonido de la escena movido «desde el principio» ahora se cuenta desde el principio de la animación entera (antes, desde el principio de la escena); si tenías alguno así, se verá 3,6 s más tarde.',
  'Las tarjetas son 27, no 25 (se han ido sumando).',
  'Los emblemas de Lanzarote y el Coliseo no tienen pantalla de suspense aparte, pero la app les hace sonar los latidos y el estallido igual: sus latidos suenan sobre la película. Te lo dejo señalado en las marcas; no lo he cambiado porque pediste que la app no cambie.',
  'Si quieres que la línea de tiempo de las demás tarjetas lleve más marcas (la colección, el pedazo…), dímelo.',
  'Reiniciado el api-server al final de la tanda.',
])}</div></html>`
fs.writeFileSync('docs/dias/REPASO_V38E.html', html)
console.log('ok')
