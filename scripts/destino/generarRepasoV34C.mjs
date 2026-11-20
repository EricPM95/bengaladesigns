// Genera docs/dias/REPASO_V34C.html: node scripts/destino/generarRepasoV34C.mjs
import fs from 'node:fs'
const img = (f, ancho = 420) => (fs.existsSync(`docs/dias/V34C_capturas/${f}.jpg`) ? `<img alt="${f}" src="data:image/jpeg;base64,${fs.readFileSync(`docs/dias/V34C_capturas/${f}.jpg`).toString('base64')}" style="max-width:${ancho}px;border-radius:12px;margin:4px;border:1px solid #ccc">` : `<p>(falta ${f})</p>`)
const mf = JSON.parse(fs.readFileSync('public/sonidos/v30/manifiesto.json', 'utf8'))
const cuantos = Object.entries(mf).map(([id, v]) => `<tr><td><code>${id}</code></td><td>${Object.keys(v).join(' · ')}</td></tr>`).join('')
const informe = fs.existsSync('docs/dias/V34C_capturas/_informe.json') ? JSON.parse(fs.readFileSync('docs/dias/V34C_capturas/_informe.json', 'utf8')) : { soloUno: [] }
const solos = informe.soloUno.filter((x) => x[1]).map((x) => `<li><code>${x[0]}</code>: ${x[1]}</li>`).join('')
const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Repaso de la tanda V34C · El estudio de sonidos</title>
<style>:root{--bg:#FBF6EC;--tx:#1C2230}@media (prefers-color-scheme:dark){:root{--bg:#1C2230;--tx:#FFFDF8}}body{margin:0;padding:16px;background:var(--bg);color:var(--tx);font:16px/1.5 system-ui,sans-serif;max-width:980px}h1{font-size:24px}table{border-collapse:collapse;font-size:13px}td,th{border:1px solid #9994;padding:4px 8px;text-align:left;vertical-align:top}label{display:block;margin:6px 0}code{font-size:13px}</style></head><body>
<h1>V34C · El estudio de sonidos (<code>/admin/sonidos</code>)</h1>
<p>Solo la página de probar: <b>no cambia ningún sonido de la app</b>. Probado con <code>pruebaV34C</code> (84 y 0), <code>pruebaJutrip</code>, <code>pruebaV33</code>, <code>pruebaV34</code> y <code>pruebaEntrarUnaVez</code> en 0; <code>pruebaV29</code> y <code>pruebaV30</code> adaptadas a la página nueva y en 0.</p>
<h2>1. Qué hay</h2>
<ul>
<li><b>Una tarjeta por animación con sonido</b> (24): las 4 medallas, colección, emblema, emblema maravilla (el Coliseo), final de las 7 maravillas, país nuevo, sello del pasaporte, el pedazo que entra en su círculo, patrimonio, logro de viajero, las escenas de Roma (Fontana de Trevi) y de Lanzarote (Timanfaya), los fuegos, resumen del día, resumen del viaje, la apertura y los sonidos cortos (Visto, campanita del aviso, tic, toque) más el vuelo de lo ganado. <b>Añadidas por mí a la tuya:</b> patrimonio, logro de viajero y el vuelo.</li>
<li><b>Cada animación se ve dentro de un marco de iPhone de 393 × 852</b>: el marco es la propia app (<code>/?visor-sonidos=1</code>) con una sola animación; ahí dentro los <code>100vh</code> y las pantallas completas son las de un iPhone de verdad, y las piezas son las mismas (<code>Reproductor</code>, las escenas, <code>ResumenDia</code>, <code>ResumenViaje</code>, la apertura, los fuegos). Si mañana cambia una animación, aquí se ve el cambio.</li>
<li><b>Su partitura de verdad</b>: el sonido lo pone el mismo motor de la app, cada sonido en su instante y el golpe cuando acaba la animación. La prueba lo comprueba en las 24: cada sonido de la partitura se programa en su instante (a menos de 2 ms de lo que dice la partitura).</li>
<li><b>[▶ Ver con sonido] y [Repetir]</b>. Debajo, los candidatos A a E de cada sonido de esa animación (el principal primero, p. ej. «golpe de la medalla de oro», y luego «redoble»…); al tocar uno, la animación se repite con ese sonido. El volumen de cada sonido, con su barra.</li>
<li><b>En el iPhone suena a la primera:</b> el audio es de la página (se desbloquea con tu toque) y el marco lo usa; la prueba lo mide con un toque de verdad.</li>
<li><b>[Probar con mi sonido]</b> abre el selector de archivos (mp3, m4a, wav, ogg). El archivo se lee y se descodifica <b>en el navegador</b>; no hay código de red en la página y la prueba mira que ninguna petición lleve su nombre ni envíe datos. La animación se reproduce con tu archivo en el sitio del sonido que sustituye (por defecto, el golpe principal; puedes elegir otro en «Sustituye a»).</li>
<li><b>Adelantar ‹ › Atrasar</b> de −1000 a +1000 ms, de 10 en 10, con el número a la vista («+40 ms») y botones −10 / 0 / +10. La prueba comprueba que con +200 ms tu sonido empieza 200 ms más tarde y con −300 ms, 300 ms antes. Al soltar la barra, la animación se repite.</li>
<li><b>Volumen propio</b> con su barra y <b>la onda</b> de tu sonido con una raya roja donde acaba la animación (el golpe tiene que caer ahí).</li>
<li><b>[Quitar mi sonido]</b> vuelve al candidato elegido.</li>
<li><b>«Lo elegido»</b>: una línea por animación («Medalla de oro → candidato B · volumen 1,00» o «Medalla de oro → MI SONIDO: campana_bonita.wav · −300 ms · volumen 0,70»), el botón [Copiar] y el aviso fijo: «Los sonidos tuyos: guárdalos en Descargas › sonidos_jutrip con el nombre de la animación (por ejemplo, medalla_oro.mp3) y pasa esta lista a Claude. En la siguiente tanda se recortan, se igualan de volumen y se ponen en la app».</li>
<li><b>Solo administradores</b>: sin serlo, la página no enseña nada (ni el marco), el propio marco abierto a mano tampoco, y el servidor da 401/403 en la ruta que lo comprueba.</li>
</ul>
<h2>2. Lo que me pediste que te dijera</h2>
<h3>Qué animaciones no tienen todavía sonido</h3>
<ul>
<li><b>Tu primer día</b> («Hoy empiezas a ganar logros»): no tiene partitura ni sonido.</li>
<li><b>Resumen del día y resumen del viaje</b>: la partitura existe (los números que suben con tic y un brillo al acabar) pero <b>la app todavía no la hace sonar</b> al abrir esos resúmenes; aquí suena como estaba pensada.</li>
<li><b>El vuelo de lo ganado</b> (al botón o al Perfil): su partitura existe, pero la app no la dispara sola; aquí suena como sonido suelto.</li>
<li><b>La apertura de JUTRIP</b>: tiene partitura, pero en la web no suena (el navegador no deja sonar antes del primer toque); queda lista para la app de las tiendas.</li>
</ul>
<h3>Cuáles tienen un solo sonido (sin candidatos para elegir)</h3>
<ul>${solos}</ul>
<p>Los cuatro están hechos por código y fijos (decisión tuya de la V30). Para probarlos con un sonido tuyo, «Probar con mi sonido» sí funciona en ellos.</p>
<h3>Candidatos de los sonidos grabados</h3>
<table><tr><th>Sonido</th><th>Candidatos</th></tr>${cuantos}</table>
<h2>3. Capturas</h2>
<p><b>Ordenador:</b> la tarjeta abierta (medalla de oro) y con un sonido propio cargado.</p>
<p>${img('ordenador_abierta', 520)}${img('ordenador_propio', 520)}</p>
<p>${img('ordenador_apertura', 520)}${img('ordenador_resumen_dia', 520)}</p>
<p><b>iPhone (390 de ancho):</b></p>
<p>${img('iphone_abierta', 230)}${img('iphone_tarjetas', 230)}</p>
<h2>4. Límites</h2>
<ul>
<li>No puedo oír: lo que sí está comprobado es CUÁNDO se programa cada sonido y que el audio de la página y el del marco son el mismo; si «suena bien» lo decides tú.</li>
<li>El resumen del viaje lleva los datos de TU cuenta (el último viaje); sin viajes, se ve casi vacío.</li>
<li>La escena de cada sitio pone, además de su propia partitura, el golpe del emblema (como en la app): puede cortarse con fundido, igual que en la app.</li>
<li>En producción, comprobado tras el despliegue (ver el resumen de la tanda).</li>
</ul>
<h2>Lista de comprobación de ESTA tanda</h2>
<label><input type="checkbox"> Abrir <code>/admin/sonidos</code> en el iPhone: la tarjeta abierta se ve entera, el marco enseña la animación y [▶ Ver con sonido] suena a la primera</label>
<label><input type="checkbox"> Tocar las demás tarjetas: cada animación se ve a pantalla completa dentro del marco</label>
<label><input type="checkbox"> Tocar «Sonido B», «C»… de la medalla de oro: la animación se repite con ese sonido</label>
<label><input type="checkbox"> [Probar con mi sonido] con un mp3 tuyo: se abre el selector, suena en la animación y la onda sale</label>
<label><input type="checkbox"> Mover Adelantar/Atrasar hasta que el golpe caiga con el final de la animación (la raya roja de la onda)</label>
<label><input type="checkbox"> «Lo elegido» sale bien y [Copiar] funciona</label>
<label><input type="checkbox"> Guardar tus sonidos en Descargas › sonidos_jutrip con el nombre de la animación y pasarme la lista</label>
</body></html>`
fs.writeFileSync('docs/dias/REPASO_V34C.html', html)
console.log('docs/dias/REPASO_V34C.html', Math.round(html.length / 1024), 'KB')
