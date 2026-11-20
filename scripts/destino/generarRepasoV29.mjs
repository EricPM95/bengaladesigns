// Genera docs/dias/REPASO_V29.html: node scripts/destino/generarRepasoV29.mjs
import fs from 'node:fs'
const mf = JSON.parse(fs.readFileSync('public/sonidos/premio/manifiesto.json', 'utf8'))
const filas = Object.entries(mf).map(([id, v]) => `<tr><td>${id}</td><td>${v.A.golpe.toFixed(2)} s</td><td>${v.A.dura.toFixed(2)} s</td><td>${(v.A.bytes / 1024).toFixed(1)} · ${(v.B.bytes / 1024).toFixed(1)} · ${(v.C.bytes / 1024).toFixed(1)} KB</td></tr>`).join('')
const img = fs.existsSync('docs/dias/V29_capturas/pagina_de_sonidos.jpg') ? `<img alt="Página de sonidos" src="data:image/jpeg;base64,${fs.readFileSync('docs/dias/V29_capturas/pagina_de_sonidos.jpg').toString('base64')}" style="max-width:240px;border-radius:12px">` : ''
const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Repaso de la tanda V29 · Sonidos</title>
<style>:root{--bg:#FBF6EC;--tx:#1C2230}@media (prefers-color-scheme:dark){:root{--bg:#1C2230;--tx:#FFFDF8}}body{margin:0;padding:16px;background:var(--bg);color:var(--tx);font:16px/1.5 system-ui,sans-serif;max-width:820px}h1{font-size:24px}h2{font-size:19px;margin-top:26px}label{display:block;margin:6px 0}code{font-size:13px}table{border-collapse:collapse;font-size:13.5px}td,th{border:1px solid rgba(128,128,128,.35);padding:4px 8px;text-align:left}</style></head><body>
<h1>V29 · Los sonidos encajan con cada animación</h1>
<p>Probado con <code>pruebaV29</code> (170 comprobaciones, 0 fallos), <code>pruebaJutrip</code>, <code>pruebaV9</code>, <code>pruebaV13</code>, <code>pruebaLogros2</code> y <code>pruebaTanda10N4_franja</code> (al día: el aviso ahora es una partitura). Ninguna prueba toca producción y ningún sonido se pide a Supabase.</p>
<p><b>Importante:</b> los sonidos los he hecho yo y <b>no los he podido OÍR</b> (no tengo altavoces): lo comprobado es cuándo caen, cuánto pesan y que suenan igual de fuerte, no cómo suenan. Eso lo decides tú con la página de sonidos.</p>
<h2>1. Cómo está hecho</h2>
<ul><li><b>Partituras</b> (<code>src/lib/sonidos/partituras.ts</code>): cada animación lleva su lista de sonidos con el instante exacto de cada uno. Los instantes salen de <code>src/lib/sonidos/tiempos.ts</code>, las MISMAS constantes que usan las animaciones (el pedazo que encaja, el emblema, el final de las siete y la apertura): si una dura más, su sonido la sigue solo (la prueba lo cambia y lo comprueba).</li>
<li><b>Motor</b> (<code>motor.ts</code>): programa cada sonido con el reloj de audio (no con temporizadores). El golpe de un archivo de premio cae en el milisegundo en que acaba la animación (el motor arranca el archivo antes). Saltar la animación corta con un fundido de 140 ms; un premio nuevo corta al anterior (nunca dos golpes finales a la vez); con «reducir movimiento» las animaciones y sus sonidos se acortan.</li>
<li><b>Se queda todo lo de antes:</b> suena solo tras un toque, respeta el modo silencio del iPhone, el interruptor «Sonidos: sí / no» (en Ajustes, desde el Perfil), el sonido pendiente tras volver de segundo plano y la vibración en Android. Con el sonido apagado o antes del primer toque no se programa nada (comprobado).</li>
<li><b>Sonidos pequeños, por código en el móvil</b> (<code>sintesis.ts</code>): toque, clic, redoble (dura lo que dura el giro), brillo, vuuush del vuelo, tic y campanita, cada uno en 3 versiones A, B y C.</li>
<li><b>Sonidos de premio, hechos en el PC</b> (<code>scripts/destino/generarSonidosPremio.mjs</code>: campanas, celesta o arpa en arpegio que sube hasta el golpe, brillo, golpe grave suave y reverberación), 9 sonidos × 3 versiones: bronce &lt; plata &lt; oro &lt; diamante (más notas, más campanas, cola más larga; lo comprueba la prueba), colección, emblema, maravilla, país y la apertura. Todos a la misma sonoridad (menos de 2,5 dB de diferencia).</li></ul>
<p><b>Formato, una desviación que debes saber:</b> los archivos son WAV mono de 11.025 Hz (todos menos de 40 KB y los 9 elegidos juntos ~321 KB, menos de 400 KB), NO m4a ni mp3: sin instalar un codificador no puedo generarlos (mi intento de instalarlo lo bloqueó el permiso de la sesión). Suenan en Safari y Android. Si quieres m4a, hay que permitir instalar un codificador (<code>lamejs</code>) o usar <code>ffmpeg</code>. A 11 kHz los agudos por encima de 5 kHz no están: es lo que da un sonido de campana más cálido, pero compruébalo al oído.</p>
<table><tr><th>Sonido de premio</th><th>Golpe a los</th><th>Dura</th><th>Peso A · B · C</th></tr>${filas}</table>
<h2>2. Las animaciones y su partitura, en palabras</h2>
<ul>
<li><b>La medalla (bronce, plata, oro, diamante):</b> redoble desde que empieza a girar (1,4 s) y golpe de premio en el mismo instante en que para; cada grado suena a más.</li>
<li><b>El pedazo que encaja:</b> vuuush desde que llega volando hasta que encaja, clic al encajar (1,2 s tras empezar), brillo al llenarse de color, tic cuando sube el número.</li>
<li><b>El emblema secreto:</b> un latido por cada aro de luz, cada vez más seguidos (0,75 → 2,82 s) y el golpe cuando la luz estalla (3,6 s).</li>
<li><b>Final de las siete maravillas:</b> latidos (2,1 → 3,72 s), redoble durante todo el giro de la medalla (3,85 s, 2,2 s) y golpe final cuando para (6,05 s).</li>
<li><b>La colección completa</b> y <b>país / destino nuevo / continente:</b> redoble o vuuush que sube hasta el golpe del premio.</li>
<li><b>El sello:</b> baja con vuuush, estampa con clic y brillo. <b>Patrimonio, viajero y resumen:</b> tics de los números que suben y brillo final.</li>
<li><b>Lo ganado que vuela:</b> vuuush de lo que dura el vuelo. <b>[Visto]:</b> toque y brillo pequeño. <b>Aviso de la campana:</b> campanita de dos notas.</li>
<li><b>La apertura:</b> la firma de la app, que cae cuando la estrella salta sobre la I (60 % de los 3,5 s). <b>En la web sigue en silencio</b> (el navegador no deja sonar antes del primer toque; nada de trucos); queda lista para la app de las tiendas.</li></ul>
<h2>Lo que NO está hecho (dicho claro)</h2>
<ul><li><b>Las escenas de cada sitio</b> (<code>momentos/escenas</code>, Roma y Lanzarote), <b>los fuegos</b> y los tics exactos del <b>resumen del día y del viaje</b> no tienen partitura propia: sus tiempos viven en CSS dentro de cada escena y habría que sacarlos a <code>tiempos.ts</code> uno a uno. Suenan con el sonido de su tipo (emblema, sello…), sin ir al ritmo de su escena.</li>
<li>La página de sonidos enseña cada animación como <b>línea de tiempo con su sonido</b> (▶), no la animación real de la pantalla.</li>
<li>No he podido oír nada: elegir A, B o C es cosa tuya.</li></ul>
<h2>3. La página para elegir (en tu iPhone)</h2>
<p><code>/admin/sonidos</code> (o <code>/?admin=sonidos</code>), solo para administradores (la comprueba el servidor, igual que /admin/logros; quien no lo es ve «Esta página es solo para administradores»). Volumen general; cada animación con ▶ y su línea de tiempo; cada sonido con ▶ A / B / C, ● para elegir y «más alto / más bajo»; y al final «Lo elegido» para copiar y pasármelo.</p>${img}
<h2>4. Que no pese ni gaste</h2>
<p>Los archivos se bajan solo al hacer falta, desde Vercel con caché larga (<code>/sonidos/*</code>), nunca desde Supabase.</p>
<h2>Lista de comprobación de ESTA tanda</h2>
<label><input type="checkbox"> Abrir <code>/admin/sonidos</code> con tu cuenta y oír cada sonido A, B y C</label>
<label><input type="checkbox"> Elegir y pasarme el resumen de «Lo elegido»</label>
<label><input type="checkbox"> Ver una medalla y una colección con sonido: el golpe cae justo al acabar</label>
<label><input type="checkbox"> Saltar una animación: el sonido se corta suave</label>
<label><input type="checkbox"> Con el interruptor «Sonidos» apagado no suena nada; en modo silencio del iPhone tampoco</label>
</body></html>`
fs.writeFileSync('docs/dias/REPASO_V29.html', html)
console.log('docs/dias/REPASO_V29.html', Math.round(html.length / 1024), 'KB')
