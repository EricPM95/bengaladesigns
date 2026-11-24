// Genera docs/dias/REPASO_V46.html con las capturas de docs/dias/V46_capturas (tamaño iPhone) y de docs/dias/V46_design (el dibujo 26a) y lo que hay que mirar.
import fs from 'node:fs'
const hay = (n) => fs.existsSync(`docs/dias/V46_capturas/${n}.jpg`)
const fig = (n, texto) => (hay(n) ? `<figure><img src="V46_capturas/${n}.jpg" alt="${texto}"><figcaption>${texto}</figcaption></figure>` : `<p class="falta">(Sin captura: ${texto})</p>`)
const dib = (n, texto) => (fs.existsSync(`docs/dias/V46_design/${n}.jpg`) ? `<figure class="ancha"><img src="V46_design/${n}.jpg" alt="${texto}"><figcaption>${texto}</figcaption></figure>` : '')
const resultados = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map((x) => (fs.existsSync(`docs/dias/_pruebasV46_${x}.txt`) ? fs.readFileSync(`docs/dias/_pruebasV46_${x}.txt`, 'utf8') : '')).join('')
const html = `<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>REPASO V46</title><style>body{font:15px/1.5 system-ui,sans-serif;max-width:980px;margin:24px auto;padding:0 16px;color:#1C2230;background:#FBF6EA}h1{font-size:26px}h2{margin-top:34px;border-top:2px solid #C9A24A;padding-top:12px}figure{margin:10px 14px 10px 0;display:inline-block;vertical-align:top;max-width:300px}figure img{width:100%;border:1px solid #d8cfb8;border-radius:10px}figure.ancha{max-width:100%;display:block}figcaption{font-size:12.5px;color:#6a6657}.falta{color:#a33}pre{background:#fff;padding:12px;border-radius:8px;overflow:auto;font-size:12px}li{margin:4px 0}</style>
<h1>V46 · Cinco arreglos tras la V45</h1>
<p>Lo que queda por decidir o no se ha podido hacer está en <code>docs/dias/DECISIONES_V46.md</code>. Capturas en tamaño iPhone (390 × 844).</p>

<h2>Tu lista de comprobación de esta tanda</h2>
<ol>
<li>Un viaje de cuatro: en una entrada, [Siguiente] → «Casi lista» trae «¿A qué cuenta lo sumamos?», «¿Para quién son las entradas?» y «¿Quién la ha pagado?».</li>
<li>Quien la añade sale marcado, pero lo puedes desmarcar; siempre queda alguien marcado.</li>
<li>Una entrada para Eric y Ana: sale en su ruta y no en la de Luis ni Marta; el gasto solo entre ellos.</li>
<li>En vuelo, alojamiento y coche sigue «¿Para quién es…?».</li>
<li>HOY › Cambiar plan › Pasar a otro día: ningún día pasado ni el de hoy.</li>
<li>El día recomendado, en su tarjeta con borde dorado y «Te lo recomendamos» encima; los cerrados, en gris con «Cerrado ese día».</li>
<li>La tarjeta de la parada: el recuadro de la ubicación entre las cajas y «Escucha su historia»; la caja HORARIO siempre (en una plaza, «Abierto»).</li>
<li>La caja de minutos: «Desde el alojamiento» (primera parada), «Desde el Panteón» (las demás), «Desde ti» (con ubicación en la ruta); sin ubicación van los minutos del plan, nunca «—» (la raya es solo para «lejos del destino»).</li>
<li>La caja HORARIO: el horario en negro, «Abierto» en verde, «Cerrado» en rojo.</li>
<li>Al llegar a una parada, «Aquí ganas 1 pedazo» sale a la vez que la tarjeta, sin empujar lo de debajo.</li>
</ol>

<h2>1 · «¿Para quién es?» devuelto</h2>
<p>La V45 lo quitó porque no estaba en el dibujo; era un error. Ahora está en «Casi lista», con quien la añade marcado (y desmarcable). Si de cuatro amigos solo dos van al Vaticano, la entrada sale solo en la ruta de esos dos y el gasto se reparte solo entre ellos.</p>
${fig('v46_casi_lista_cuatro', 'Casi lista, cuatro viajeros: Eric marcado')}
${fig('v46_casi_lista_dos', 'Para dos (Eric y Ana), cuenta del grupo y «¿Quién la ha pagado?»')}

<h2>2 · «Pasar a otro día»</h2>
<p>Antes salía el lunes 23 siendo martes 24. Ahora solo salen días posteriores a hoy. El recomendado va como el dibujo 26a.</p>
${fig('v46_pasar_a_otro_dia_tercer_dia', 'Hoy es el tercer día: no sale ni el 17, ni el 18, ni el de hoy')}
${fig('v46_pasar_a_otro_dia_recomendado', 'El recomendado, en su tarjeta con borde dorado')}
${fig('v46_pasar_a_otro_dia_primer_dia', 'Un día cerrado (el Vaticano cierra el domingo): en gris con «Cerrado ese día»')}
${dib('p26a', 'Design: 26a')}

<h2>3 · La tarjeta de la parada</h2>
<p>Sin ubicación: <b>18 min · Desde el centro</b> (este viaje de pruebas no tiene alojamiento, así que se cuenta desde el centro de su zona; con alojamiento pone «Desde el alojamiento»). Antes ponía «—» y «Del alojamiento a la Plaza del Campidoglio». «Abierto» en verde; el horario real va en negro y «Cerrado» en rojo.</p>
${fig('v46_parada_plaza', 'En una plaza: HORARIO «Abierto» (verde), minutos del plan y el recuadro de la ubicación encima de la historia')}

<h2>4 · «Aquí ganas 1 pedazo»</h2>
<p><b>De dónde venía el retraso:</b> la línea sale de una pregunta al servidor que solo se hacía al llegar; hasta que contestaba, la línea no existía y luego empujaba lo de debajo. Ahora se pregunta en cuanto la parada es la siguiente y se guarda en memoria, así que al llegar sale a la vez que la tarjeta. (No hay captura: depende del tiempo de red; lo vigila la prueba de código.)</p>

<h2>Pruebas</h2>
<pre>${resultados.replace(/</g, '&lt;')}</pre>
</html>`
fs.writeFileSync('docs/dias/REPASO_V46.html', html)
console.log('REPASO_V46.html escrito')
