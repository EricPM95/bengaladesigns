// REPASO de la Tanda V38C: solo suena lo que se está animando; la ficha de un logro de viajero conseguido.
import fs from 'node:fs'
import { TABLA } from './tablaSonidosV38C.mjs'
const li = (x) => `<ul>${x.map((i) => `<li>${i}</li>`).join('')}</ul>`
const filas = TABLA.map((f) => `<tr${f.cambiado ? ' style="background:#FFF7DC"' : ''}><td><code>${f.archivo.replace('src/', '')}</code></td><td>${f.sonido}</td><td>${f.donde}</td><td>${f.animacion}</td><td>${f.cambiado ? `<b>CAMBIADO</b><br>${f.antes ?? ''}${f.ahora ? `<br>Ahora: ${f.ahora}` : ''}` : 'Sin cambio'}</td></tr>`).join('')
const comprob = [
  'Abre el Resumen del viaje de Lanzarote por PRIMERA vez (con un viaje terminado): las cifras (días, paradas, km, fotos) suben de 0 a su valor y suena el tic de los números con el brillo al final.',
  'Ciérralo y ábrelo otra vez (desde el viaje, LOGROS o el Perfil): las cifras ya están puestas, quieto y en silencio. Ya no suena como un premio.',
  'Toca «Todos a bordo» en ese resumen: la ficha dice «Conseguido el…» y «1 viaje en familia» (o los que sean), y habla de «Maletas para todos», no de sí misma.',
  'Abre la ficha de cualquier otro logro de viajero que tengas: nunca «0» ni «te falta» para lo que ya tienes.',
  'Abre la vitrina, «Todos mis logros» y la hoja de logros: silencio.',
  'En /admin/sonidos todo sigue sonando al pulsar ▶, como antes.',
]
const html = `<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>REPASO V38C</title><style>body{font:15px/1.5 system-ui,sans-serif;max-width:1300px;margin:0 auto;padding:16px;color:#1C2230}table{border-collapse:collapse;width:100%;font-size:13px}th,td{border:1px solid #ddd;padding:6px 8px;text-align:left;vertical-align:top}th{background:#f3ecd9}code{background:#f3ecd9;padding:1px 4px;border-radius:4px}.eric{background:#FFF7DC;border:1px solid #D8BE84;border-radius:10px;padding:4px 16px}</style>
<h1>V38C · Solo suena lo que se está animando</h1>
<p><b>La regla (Eric):</b> un sonido solo suena a la vez que una animación que se ve en ese momento y cuadrado con ella; una pantalla quieta no suena nunca; volver a ver algo ya visto, en silencio (salvo repetir la animación entera, como «ver otra vez» en un emblema).</p>
<h2>Qué pasaba con el Resumen del viaje</h2>
<p>La V35B puso el sonido <code>dia_completo</code> (los tics de números que suben y el brillo) al abrir el resumen. Pero en el resumen las cifras <b>nunca subían</b>: salían puestas. Sonaba un premio sobre una pantalla quieta, y cada vez que se abría. Ahora las cifras suben de verdad (1,2 s, con un tic cada vez) y el sonido las acompaña, <b>solo la primera vez</b>; abierto otra vez, todo puesto y en silencio. La marca de «ya se vio» es una por viaje en el móvil (<code>trazo:logros:resumenviaje:&lt;viaje&gt;</code>), con la misma forma que la que ya tenía el resumen del día. Con «Reducir movimiento» no suben ni suenan.</p>
<h2>Todos los sonidos de la app: dónde suenan y con qué animación</h2>
<table><thead><tr><th>Archivo</th><th>Sonido</th><th>Dónde suena</th><th>Con qué animación</th><th>Estado</th></tr></thead><tbody>${filas}</tbody></table>
<p>La prueba <code>pruebaV38C</code> falla si aparece una llamada a un sonido que no está en esta tabla, o si una ficha, vitrina, lista u hoja de logros llama a alguno.</p>
<h2>La ficha de «Todos a bordo»: de dónde salía el 0</h2>
${li([
  'El logro se <b>da una vez y se queda</b> (por eso dice «Conseguido el 9 nov»). Pero el número de la ficha («viajes en familia») se <b>vuelve a contar cada vez</b> con los viajes que hay ahora, mirando el «con quién» de cada viaje.',
  'Si desde que se dio el logro cambió el «con quién» de ese viaje (o el viaje ya no está entre los que cuentan, o se deshizo un [Visto]), la cuenta de ahora da 0 aunque el logro siga ganado. La ficha, al ver 0, decía «Te falta 1 para Todos a bordo»: el escalón que ya tenías.',
  '<b>No he podido mirar tu cuenta real</b> (no tengo acceso a los datos de producción), así que no sé cuál de esas causas fue en la tuya; las tres dan el mismo síntoma y las tres quedan arregladas.',
  '<b>Arreglo (<code>server/logros/pantallas/ganados.js</code>):</b> quien tiene un escalón lleva, como mínimo, los de ese escalón: la ficha cuenta lo mismo que dio el logro. Ya conseguido, habla del siguiente escalón («Te faltan 2 para Maletas para todos») o no dice nada si era el último. Un logro de un solo golpe conseguido nunca enseña un avance por debajo de su objetivo.',
  '<b>Revisado:</b> todos los logros de viajero (cómo viajas, viajes, países, estaciones, meses, Navidad…), escalón a escalón: ninguno conseguido dice 0 ni «te falta» para sí mismo (pruebaV38C, sin el arreglo falla con esos mismos síntomas).',
])}
<h2>Tu lista de comprobación de esta tanda</h2>${li(comprob)}
<div class="eric"><h2>PARA ERIC</h2>${li([
  'Reiniciado el api-server (la ficha corregida sale del servidor).',
  'Si en tu cuenta el viaje de Lanzarote ya tenía la marca de «ya se vio» antes de esta versión, no habrá marca: la primera vez que lo abras con esta versión suben las cifras y suena una vez; después, en silencio.',
  'Las cifras que suben son nuevas (antes salían puestas): dime si la duración (1,2 s) te gusta.',
  'No he oído el sonido en un iPhone real.',
])}</div></html>`
fs.writeFileSync('docs/dias/REPASO_V38C.html', html)
console.log('ok')
