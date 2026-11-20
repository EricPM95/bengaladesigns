// Genera docs/dias/REPASO_V30.html: node scripts/destino/generarRepasoV30.mjs
import fs from 'node:fs'
const mf = JSON.parse(fs.readFileSync('public/sonidos/v30/manifiesto.json', 'utf8'))
const filas = Object.entries(mf)
  .flatMap(([id, v]) => Object.entries(v).map(([l, d]) => `<tr><td>${id}</td><td>${l}</td><td>${(d.fuentes ?? []).join(' + ')}</td><td>Sonniss GDC · uso comercial, sin citar</td><td>${d.dura.toFixed(2)} s</td><td>${(d.bytes / 1024).toFixed(0)} KB</td></tr>`))
  .join('')
const todos = Object.values(mf).flatMap((v) => Object.values(v))
const total = todos.reduce((n, d) => n + d.bytes, 0)
const cuantos = todos.length
const img = (f, ancho = 220) => (fs.existsSync(`docs/dias/V30_capturas/${f}.jpg`) ? `<img alt="${f}" src="data:image/jpeg;base64,${fs.readFileSync(`docs/dias/V30_capturas/${f}.jpg`).toString('base64')}" style="max-width:${ancho}px;border-radius:12px;margin:4px;border:1px solid #ccc">` : `<p>(falta ${f})</p>`)
const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Repaso de la tanda V30 · Sonidos de verdad</title>
<style>:root{--bg:#FBF6EC;--tx:#1C2230}@media (prefers-color-scheme:dark){:root{--bg:#1C2230;--tx:#FFFDF8}}body{margin:0;padding:16px;background:var(--bg);color:var(--tx);font:16px/1.5 system-ui,sans-serif;max-width:900px}h1{font-size:24px}table{border-collapse:collapse;font-size:12.5px}td,th{border:1px solid #9994;padding:3px 6px;text-align:left}label{display:block;margin:6px 0}code{font-size:13px}</style></head><body>
<h1>V30 · Sonidos de verdad, estilo juego</h1>
<p>Probado con <code>pruebaV30</code> (537 comprobaciones, 0 fallos), <code>pruebaV29</code>, <code>pruebaV28</code> y <code>pruebaJutrip</code> en 0.</p>
<p><b>Importante, dicho claro:</b> yo <b>no puedo oír</b>. Elegí los candidatos por nombre y etiquetas, y los descarté por su forma de onda. Lo comprobado es la duración, el peso, el volumen, la saturación, el silencio de delante y que el golpe cae en su sitio. <b>Cómo suenan lo decides tú</b>, en <code>/admin/sonidos</code>.</p>
<h2>1. Lo que se queda y lo que cambia</h2>
<ul><li><b>Se queda (fijo, hecho por código):</b> el toque y el brillo pequeño de [Visto], la campanita del aviso y el tic de los números. Ya no se pueden cambiar en la página: están en la versión A que elegiste.</li>
<li><b>Cambia por sonidos grabados de verdad (${cuantos} candidatos, ${(total / 1024).toFixed(0)} KB en total, menos de 1 MB):</b> el clic al encajar, el redoble, el brillo (fuera de Visto), el vuuush del vuelo, las 4 medallas, la colección, el emblema, la maravilla, el país y la apertura. Formato m4a (AAC) a 44,1 kHz, que vale en Safari y en Android. Se bajan solo al hacer falta, desde Vercel, nunca desde Supabase.</li>
<li>El volumen general queda fijado en <b>0,80</b>.</li></ul>
<h2>2. De dónde salen y qué dice la licencia (en palabras sencillas)</h2>
<p>Todos salen del <b>Sonniss «GDC Game Audio Bundle»</b> (gratis, sonidos profesionales de videojuegos). Su licencia: <b>se pueden usar en un producto comercial</b> (una app que se vende, sí), <b>no hace falta citar al autor</b>, y lo que <b>no</b> se puede es revender o regalar los sonidos tal cual (como una biblioteca de sonidos) ni registrarlos como tuyos en sistemas de reconocimiento de contenido. Como los he mezclado en capas y recortado para este uso, vale. No he usado nada de Pixabay ni de Kenney (la descarga de Kenney pide un navegador, y no la he esquivado). No hay ningún sonido de Clash Royale ni de otro juego: solo el estilo (alegre, con golpe, monedas, campanas, metales).</p>
<p>Los paquetes enteros se han borrado del PC; en el repositorio solo están los ${cuantos} candidatos.</p>
<h2>3. Tabla de candidatos</h2>
<table><tr><th>Momento</th><th>Letra</th><th>Fuente (capas)</th><th>Licencia</th><th>Dura</th><th>Peso</th></tr>${filas}</table>
<p>Faltan algunas letras (E del vuelo, A del emblema…) porque la forma de onda las descartó (ruido de fondo o saturación): por eso hay 3 o 4 candidatos en algunos momentos, no 5.</p>
<h2>4. Lo que se ha hecho además</h2>
<ul>
<li><b>El golpe de cada premio cae a menos de 30 ms del final de su animación</b>, medido de verdad: los tiempos de la medalla, el sello, la colección y el pasaporte salen ahora a <code>tiempos.ts</code> y la pantalla y su sonido leen el mismo número. El redoble acaba con su golpe y nunca se estira.</li>
<li><b>Las escenas de cada sitio</b> (Roma, el Coliseo y Lanzarote) tienen su partitura propia: redoble, golpe cuando estalla la luz, clic y brillo al entrar el emblema y su nombre.</li>
<li><b>Las baldosas de las 18 insignias, derechas:</b> las de 4 trozos (Trastevere, Miguel Ángel) quedan con sus lados rectos horizontales y verticales (antes salían como rombos); las de 3 (país más pequeño, Caravaggio, Miradores, «Entre viñas de ceniza») quedan simétricas con su borde de fuera arriba, no en diagonal. Llenan el círculo igual. Hoja abajo.</li>
<li><b>Animaciones a pantalla completa:</b> la escena se agranda hasta llenar el ancho y el alto sin deformarse (recorta más cielo que suelo; en un ordenador se ajusta como antes). Capturas antes/después de iPhone con barra, iPhone completo, iPhone SE y Android abajo.</li>
<li><b>Fuera el aviso «Añádela a tu pantalla de inicio»</b> (interruptor <code>AVISO_INSTALAR_VISIBLE</code> en <code>src/lib/instalar.ts</code>; para encenderlo, <code>VITE_AVISO_INSTALAR_VISIBLE=true</code>). Salía en <b>dos sitios</b>: el recuadro con los 3 pasos al entrar (una vez) y la tarjeta de HOY el primer día del viaje en iPhone. Los dos están apagados; el código sigue. El texto de Ajustes que explica por qué no se pueden encender los avisos en iPhone sin la pantalla de inicio no invita a instalar y se queda.</li></ul>
<h2>5. La página de sonidos</h2>
<p><code>/admin/sonidos</code>: los 4 fijos marcados «FIJO»; cada candidato con ▶, su fuente, su duración y su peso; <b>«Con su animación»</b> abre la pantalla de verdad (medalla, colección, emblema, país, apertura) con ese candidato; «Lo elegido» para copiarme el resumen.</p>
<h2>Baldosas de las 18 insignias</h2>${img('baldosas_18', 780)}
<h2>Pantalla completa: antes y después</h2>
<p>${['iphone_safari', 'iphone_completo', 'iphone_se', 'android'].map((n) => `<span><b>${n}</b><br>${img('antes_' + n, 170)}${img('despues_' + n, 170)}</span>`).join(' ')}</p>
<h2>Lo que NO está hecho / queda para Eric</h2>
<ul><li>Las <b>4 fotos de Roma</b> (Lungotevere, Borgo Pio, mirador de San Pietro in Montorio, Colle Oppio): Wikimedia sigue limitando la velocidad. Las que han entrado están puestas; el resto en la lista PARA ERIC del resumen.</li>
<li>No puedo oír: <b>elegir los sonidos es cosa tuya</b>. Ni probar en un iPhone o un Android reales (modo silencio, barra de abajo, muesca).</li>
<li>La zona de la barra de estado del iPhone con la app añadida a la pantalla de inicio (<code>apple-mobile-web-app-status-bar-style</code>) sigue en «default»: cambiarla a «black-translucent» deja la escena bajo la hora y la batería, pero afecta a TODA la app; no lo he tocado sin que lo decidas.</li></ul>
<h2>Lista de comprobación de ESTA tanda</h2>
<label><input type="checkbox"> Abrir <code>/admin/sonidos</code> con tu cuenta y oír los candidatos de cada momento</label>
<label><input type="checkbox"> Pulsar «Con su animación» en medalla, colección, emblema, país y apertura: el golpe cae al acabar el movimiento</label>
<label><input type="checkbox"> Elegir y pasarme el resumen de «Lo elegido»</label>
<label><input type="checkbox"> En el iPhone (Safari y la app de inicio) y en Android: ver una escena de un sitio y comprobar que llena la pantalla sin franjas</label>
<label><input type="checkbox"> Ver una colección de 3 o 4 baldosas (Trastevere, Caravaggio): baldosas derechas</label>
<label><input type="checkbox"> Entrar con el correo: ya no sale «Añádela a tu pantalla de inicio»</label>
<label><input type="checkbox"> Sonidos apagados en Ajustes: no suena nada; en modo silencio del iPhone tampoco</label>
</body></html>`
fs.writeFileSync('docs/dias/REPASO_V30.html', html)
console.log('docs/dias/REPASO_V30.html', Math.round(html.length / 1024), 'KB')
