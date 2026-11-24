// Genera docs/dias/REPASO_V44.html con las capturas de docs/dias/V44_capturas y lo que hay que mirar.
import fs from 'node:fs'
const hay = (n) => fs.existsSync(`docs/dias/V44_capturas/${n}.jpg`)
const fig = (n, texto) => (hay(n) ? `<figure><img src="V44_capturas/${n}.jpg" alt="${texto}"><figcaption>${texto}</figcaption></figure>` : `<p class="falta">(Sin captura: ${texto})</p>`)
const resultados = fs.existsSync('docs/dias/_pruebasV44.txt') ? fs.readFileSync('docs/dias/_pruebasV44.txt', 'utf8') : ''
const html = `<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>REPASO V44</title><style>body{font:15px/1.5 system-ui,sans-serif;max-width:760px;margin:24px auto;padding:0 16px;color:#1c2230}h1{font-size:26px}h2{margin-top:36px;border-top:1px solid #ddd;padding-top:18px}figure{display:inline-block;margin:8px 10px 8px 0;vertical-align:top;max-width:230px}img{width:230px;border:1px solid #ccc;border-radius:14px}figcaption{font-size:12px;color:#555}.falta{color:#999;font-size:13px}code{background:#f2ecde;padding:1px 4px;border-radius:4px}pre{background:#f6f2e6;padding:10px;border-radius:8px;overflow:auto;font-size:12px}li{margin:3px 0}</style>
<h1>V44 · Lo que Eric vio en el móvil tras la V43</h1>
<p>Lo que NO he podido hacer o necesita una decisión tuya está en <code>docs/dias/DECISIONES_V44.md</code> (el billete con QR, los sitios nuevos de Roma y el mapa del alojamiento).</p>

<h2>1 · La ubicación lejos del destino (lo importante)</h2>
<p><b>Qué pasaba:</b> con la ubicación en Barcelona y el viaje en Roma, HOY mandaba el Coliseo y el Foro a «Lugares pendientes» («Ya ha cerrado» a las 8:30) y ponía «A pie · 10407 min»: sumaba el camino desde donde estabas. Le habría pasado a cualquiera en su casa o en el aeropuerto.</p>
<p><b>Qué pasa ahora:</b> el GPS solo cuenta para minutos y cierres si estás <b>en la ruta</b> (a 30 minutos andando de la parada). Si no, HOY cuenta con el <b>tiempo del plan</b>: «19 min · Del alojamiento al Coliseo» o «Del Panteón a la Fontana de Trevi». Si estás a más de 50 km del viaje, la caja dice «—» y «Estás lejos», con el recuadro «Estás lejos de Roma. Cuando llegues, contaremos desde donde estés.» (sin botones ni «Ya he llegado»). Nada se va a pendientes ni sale vacío por estar lejos. La app se entera sola al acercarte.</p>
${fig('v44_lejos', 'Con la ubicación en Barcelona')}
${fig('v44_aeropuerto', 'En el aeropuerto: el tiempo del plan')}
${fig('v44_en_la_ruta', 'En la ruta: «Desde ti», [Actualizar] y «¿Ya estás aquí?»')}
${fig('v44_sin_ubicacion', 'Sin ubicación: el tiempo del plan y el recuadro punteado')}

<h2>2 · La tarjeta de la parada</h2>
<p>Dos cajas una al lado de otra: «HORARIO» (con «Cerrado ahora · abre a las 9:00») y la de minutos. «Escucha su historia por el camino · 3 min» va en <b>azul oscuro desde el principio</b>; al darle al play solo cambia ▶ por ❚❚ y se mueven las ondas.</p>

<h2>3 · Los avisos con [Deshacer]</h2>
<p>«Parada saltada» ya lleva [Deshacer] y sale abajo, sobre el menú. Todo lo que cambia la ruta lo lleva (saltar, quitar, pasar a otro día, pasar todos, recuperar hoy, ya lo visité). Juntar avisos es solo para los de arriba. Al saltar se mira todo el día de golpe: un solo aviso («Han cerrado A y B»).</p>
${fig('v44_saltar_con_deshacer', 'Saltar: aviso abajo con [Deshacer]')}

<h2>4 · «Lugares pendientes» › «···»</h2>
<p>El «···» abre la misma hoja que el de una parada en DÍAS: «PARADA» y el nombre, y tarjetas grandes con icono, título y subtítulo (Recuperar hoy, solo si sigue abierto; Ya lo visité; Quitar, en rojo).</p>
${fig('v44_pendientes_menu', 'El «···» de una parada pendiente')}

<h2>5 · «Comer cerca de ti»</h2>
<p>El título según la hora: «Desayunar cerca de ti» (hasta las 11:30, con [Café] marcado), «Comer…» (hasta las 17:00) y «Cenar…». Sin ubicación: «No tienes la ubicación activada · Usar mi ubicación», sin nombrar ningún sitio; lista y mapa desde la parada de ahora. Debajo del nombre, el tipo («Cafetería», «Trattoria»). Si no hay nada abierto, nunca vacío: «A esta hora aún no han abierto. Los más cercanos:» con «Abre a las 7:30». Abajo, [Ver todos en Explorar] (con el subfiltro).</p>
${fig('v44_desayunar', 'Desayunar cerca de ti')}
${fig('v44_aun_no_han_abierto', 'A esta hora aún no han abierto')}
${fig('v44_anadir_sin_ubicacion', 'Añadir un sitio cercano, sin ubicación')}

<h2>7 · Otros arreglos de HOY</h2>
<ul>
<li><b>El mejor día</b> ya no tiene tope de 7 visitas: cuenta el tiempo (que quepa sin quitar nada).</li>
<li><b>«Activa tu ubicación»</b> sin pasos: «Para guiarte en tu viaje necesitamos saber dónde estás. Activa la ubicación para jutrip.app en los ajustes de tu móvil o de tu navegador, y vuelve a esta página.» con [Entendido].</li>
</ul>

<h2>8 · El alojamiento</h2>
<p>El mapa para confirmar el pin <b>no está hecho</b>: según las condiciones de Mapbox los resultados de búsqueda son temporales y no se pueden guardar. Lo que sí: «Cómo llegar» y «Volver al alojamiento» llevan ahora la <b>ciudad del viaje</b> en la dirección, para que Google no la ponga en Mataró. Decisión tuya en <code>DECISIONES_V44.md</code>.</p>

<h2>9 · El globo y DÍAS</h2>
<ul>
<li><b>Globo grande › [Ver destino]:</b> la página se abre <b>encima</b> del globo y, al cerrarla, vuelves al globo.</li>
<li><b>ExtraDaySheet:</b> «A partir de aquí, el viaje lo eliges tú: monta cada día a tu gusto.»</li>
<li><b>Día montado por el viajero</b> (a mano, «Crear mi propio día», más allá de los escritos): nunca «Hora de comer» ni «Hora de cenar» automáticas.</li>
<li><b>Día en blanco más allá de los escritos:</b> solo [Elegir mis sitios], en azul oscuro, y el título «Día por organizar».</li>
<li><b>Franjas blancas</b> de las filas de un día: ya no se salen de la tarjeta.</li>
<li><b>Las pruebas viejas que fallaban</b> (V36_cliente, Fase6y_manual, 10N10_explorar, 10N_propuesta) pasan: eran las pruebas las que estaban atrasadas, no la app.</li>
</ul>
${fig('v44_globo_ver_destino', 'La página del destino encima del globo')}
${fig('v44_dias_franjas', 'DÍAS: las filas de un día dentro de su tarjeta')}

<h2>Lista de comprobación de ESTA tanda (en el iPhone)</h2>
<ul>
<li>[ ] Con la ubicación en tu casa (lejos del viaje): HOY no manda nada a pendientes, sale «—» y «Estás lejos», ninguna cifra rara.</li>
<li>[ ] En el aeropuerto: «19 min · Del alojamiento al…» (el tiempo del plan).</li>
<li>[ ] En la ruta: «12 min · Desde ti», [Actualizar] en la caja y «¿Ya estás aquí?».</li>
<li>[ ] La caja HORARIO dice «Cerrado ahora · abre a las…» si lo está.</li>
<li>[ ] «Escucha su historia por el camino» en azul oscuro desde el principio; ▶ ↔ ❚❚ al tocarlo.</li>
<li>[ ] Saltar una parada: aviso ABAJO con [Deshacer]. Lo mismo al quitar, pasar a otro día, pasar todos, recuperar hoy y ya lo visité.</li>
<li>[ ] Lugares pendientes › «···»: la hoja grande con icono, título y subtítulo.</li>
<li>[ ] Cambiar plan › Quiero comer ahora: «Desayunar/Comer/Cenar cerca de ti», sin ubicación «No tienes la ubicación activada».</li>
<li>[ ] «Activa tu ubicación» (con la ubicación denegada): texto sin pasos y [Entendido].</li>
<li>[ ] Globo grande › Ver destino: la página se abre encima; al cerrarla vuelve el globo (con y sin viaje, desde los dos globos).</li>
<li>[ ] DÍAS: día en blanco más allá de los escritos con solo [Elegir mis sitios]; ninguna franja blanca fuera de la tarjeta; un día montado por ti sin «Hora de comer».</li>
</ul>

<h2>Pruebas</h2>
<pre>${resultados.replace(/</g, '&lt;')}</pre>
`
fs.writeFileSync('docs/dias/REPASO_V44.html', html)
console.log('REPASO_V44.html escrito')
