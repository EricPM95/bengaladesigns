// REPASO de la Tanda V38D: el golpe del emblema, solo donde toca.
import fs from 'node:fs'
const D = 'docs/dias/V38D_capturas'
const img = (f) => (fs.existsSync(`${D}/${f}.jpg`) ? `<img src="V38D_capturas/${f}.jpg" alt="${f}">` : '<i>(sin captura)</i>')
const li = (x) => `<ul>${x.map((i) => `<li>${i}</li>`).join('')}</ul>`
const html = `<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>REPASO V38D</title><style>body{font:15px/1.5 system-ui,sans-serif;max-width:1100px;margin:0 auto;padding:16px;color:#1C2230}table{border-collapse:collapse;width:100%;font-size:13px}th,td{border:1px solid #ddd;padding:6px 8px;text-align:left;vertical-align:top}th{background:#f3ecd9}img{max-width:100%;border:1px solid #ddd;border-radius:8px}code{background:#f3ecd9;padding:1px 4px;border-radius:4px}.eric{background:#FFF7DC;border:1px solid #D8BE84;border-radius:10px;padding:4px 16px}</style>
<h1>V38D · El golpe del emblema, solo donde toca</h1>
<h2>Lo que pasaba</h2>
<p>En «Emblema de Roma» el mismo archivo <code>emblema</code> sonaba <b>dos veces</b>: al estallar la luz tras los latidos (3,6 s, partitura <code>emblema</code>) y al aparecer el emblema (8 s, partitura <code>escena</code>). Como era un solo archivo con una sola fila, el golpe que Eric eligió para el final también sonaba, desentonando, al acabar el suspense. Lo mismo pasaba en Lanzarote y en el Coliseo (comparten partituras).</p>
<h2>Lo que hay ahora</h2>
${li([
  '<b>«Estallido del suspense»</b> (nuevo archivo <code>estallido</code>): suena cuando la luz estalla tras los latidos. Suave y corto: de momento el candidato A es el brillo más corto que ya había (0,63 s); B, C y D son los «vuuush» del vuelo; E, otro brillo. Con su fila en el estudio: candidatos, [Silenciar], volumen, ms, «Empieza…» y [Editar].',
  '<b>«Golpe del emblema»</b> (el de siempre): suena <b>solo una vez, cuando aparece el emblema</b> (a los 8 s en Roma, a los 9,9 s en Lanzarote; el Coliseo, en el suyo).',
  'Silenciar uno no silencia el otro; cada uno tiene su candidato, su volumen y sus ms.',
  'Lo mismo en Roma, Lanzarote y el Coliseo (las tres tarjetas llevan las dos filas).',
])}
<h2>Capturas</h2>${img('estudio_dos_filas')}
<h2>Otros archivos que sonaban en dos momentos de una misma animación</h2>
<table><thead><tr><th>Animación</th><th>Archivo</th><th>Qué pasaba</th><th>Qué he hecho</th></tr></thead><tbody>
<tr><td>Emblema (Roma, Lanzarote, Coliseo)</td><td><code>emblema</code></td><td>Dos momentos distintos: el estallido del suspense y la aparición del emblema.</td><td><b>Separado</b>: <code>estallido</code> y <code>emblema</code>.</td></tr>
<tr><td>Tu primer día</td><td><code>brillo</code></td><td>Dos momentos distintos: al entrar el título (0,3 s) y al acabar (1,4 s), con una sola fila.</td><td><b>Separado</b>: <code>brillo_titulo</code> (el del título, con los mismos candidatos que el brillo) y <code>brillo</code> (el del final).</td></tr>
<tr><td>Tu primer día</td><td><code>clic</code> ×3</td><td>Un clic por cada fila que aparece.</td><td>Sin cambio: es el mismo suceso repetido, no tres momentos distintos.</td></tr>
<tr><td>Los fuegos</td><td><code>brillo</code> ×2</td><td>Dos brillos que caen detrás del estallido.</td><td>Sin cambio: es el mismo suceso repetido.</td></tr>
<tr><td>Pedazos nuevos (varias colecciones)</td><td><code>pedazo</code> ×n</td><td>Cada insignia hace sonar su pedazo (V38B).</td><td>Sin cambio: el mismo suceso en cada insignia.</td></tr>
<tr><td>El pedazo y «Lo ganado que vuela»</td><td><code>vuelo</code></td><td>El mismo archivo en dos tarjetas distintas.</td><td>Sin cambio (lo dijiste tú: son tarjetas distintas).</td></tr>
</tbody></table>
<p><code>pruebaV38D</code> revisa las 27 tarjetas: ningún archivo suena en dos momentos de una misma animación sin fila propia (salvo los «mismo suceso repetido» de arriba, escritos en la prueba a la vista).</p>
<h2>Tu lista de comprobación de esta tanda</h2>${li([
  '/admin/sonidos → «Emblema de Roma» → ▶ Ver con sonido: tras los latidos suena un destello suave y corto (no el golpe); el golpe solo cae al aparecer el emblema.',
  'En la tarjeta hay dos filas: «golpe del emblema» y «estallido del suspense». Silencia una: la otra sigue sonando.',
  'Tu «golpe del emblema» guardado (candidato B, tus ms…) sigue ahí, solo en el golpe del final.',
  '«Tu primer día»: ahora tiene su fila «brillo del título» aparte del «brillo» del final.',
  'Lo mismo en «Emblema de Lanzarote» y «Coliseo».',
])}
<div class="eric"><h2>PARA ERIC</h2>${li([
  '<b>Tu guardado no se ha tocado.</b> Lo guardado en «golpe del emblema» se queda en el golpe del final. El estallido empieza con el sonido por defecto (candidato A).',
  'Ojo: antes, un movimiento (ms) o un volumen del «golpe del emblema» se aplicaba a los DOS momentos a la vez; ahora solo al del final (lo que veías «perfecto»).',
  'En «Tu primer día», lo que tuvieras guardado en «brillo» se queda en el brillo del FINAL; el del título empieza con el de siempre.',
  'La referencia «En el golpe» de las tarjetas de emblema sigue en 3,6 s (la del estallido, como antes): así lo que guardaste con «En el golpe» no se mueve.',
  'Cuando elijas los sonidos del estallido, guarda y descarga el zip como siempre; Code lo aplica.',
  'Reiniciado el api-server al final de la tanda.',
])}</div></html>`
fs.writeFileSync('docs/dias/REPASO_V38D.html', html)
console.log('ok')
