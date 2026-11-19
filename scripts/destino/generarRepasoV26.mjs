// Genera docs/dias/REPASO_V26.html: node scripts/destino/generarRepasoV26.mjs
import fs from 'node:fs'

const img = (n) => (fs.existsSync(`docs/dias/V25_capturas/${n}.jpg`) ? `data:image/jpeg;base64,${fs.readFileSync(`docs/dias/V25_capturas/${n}.jpg`).toString('base64')}` : null)
const fig = (n, pie) => `<figure>${img(n) ? `<img alt="${pie}" src="${img(n)}" style="max-width:230px;border-radius:12px">` : '<div>sin captura</div>'}<figcaption>${pie}</figcaption></figure>`
const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Repaso de la tanda V26 · Gasto de Supabase</title>
<style>:root{--bg:#FBF6EC;--tx:#1C2230}@media (prefers-color-scheme:dark){:root{--bg:#1C2230;--tx:#FFFDF8}}body{margin:0;padding:16px;background:var(--bg);color:var(--tx);font:16px/1.5 system-ui,sans-serif;max-width:800px}h1{font-size:24px}h2{font-size:19px;margin-top:28px}code{font-size:13px}label{display:block;margin:6px 0}figure{display:inline-block;margin:8px 10px 8px 0;vertical-align:top}figcaption{font-size:12.5px;opacity:.7;max-width:230px}table{border-collapse:collapse;font-size:14px}td,th{border:1px solid rgba(128,128,128,.35);padding:4px 8px;text-align:left}</style></head><body>
<h1>El gasto de Supabase (V26) y el arreglo de «logros congelados»</h1>
<p>Probado con <code>pruebaV26</code> (40 comprobaciones), <code>pruebaV25_congelado</code> (20), <code>pruebaJutrip</code> y las de logros. <b>Ninguna prueba toca producción</b>: las medidas salen de bases de datos y almacenes de mentira que cuentan los bytes, y del peso de una ruta de verdad medido en local. <b>Lo que no he podido hacer:</b> medir el gasto real en producción (no hay permiso para ello desde las pruebas) ni leer el uso por días o por servicio (hace falta entrar al panel de Supabase: ver «PARA ERIC»).</p>

<h2>1. Qué gastaba más (en palabras sencillas)</h2>
<ol><li><b>El servidor bajaba la ruta ENTERA de todos los viajes de la persona en cada llamada de logros.</b> La ruta de un viaje pesa decenas de KB (la de pruebas, 4 días y 48 paradas: 79 KB) y la guarda <code>repo.viajesDe</code>, que usan más de 20 llamadas de logros (la hoja, «cerca de aquí», el Visto, las fotos, el resumen, el Perfil…). HOY pregunta «cerca de aquí» cada 45 segundos, en cada móvil, mientras está abierto. Es lo que explica los ~2 GB al día de Eric y Alicia en Lanzarote: cada móvil bajaba unos 150 KB cada 45 segundos, sin parar, y todo sin caché (es tráfico del servidor a Supabase).</li>
<li><b>Las fotos se volvían a bajar enteras.</b> Cada vez que la app listaba las fotos del viaje (al abrir RUTA, DÍAS, HOY, el resumen, tras cada subida…) pedía una dirección firmada NUEVA para cada foto; como la firma va dentro de la dirección, el móvil la tomaba por una foto distinta y la bajaba otra vez. Y la caché de las fotos era la de por defecto (1 hora).</li>
<li><b>Relojes de 20 a 45 segundos</b> preguntando «por si ha cambiado» (los gastos compartidos cada 20 s, el viaje compartido cada 30 s, las propuestas cada 45 s, los avisos cada minuto…), cada uno por su cuenta y sin juntarse aunque lo pidieran varias pantallas.</li></ol>

<h2>2. Qué he arreglado</h2>
<ul><li><b>La ruta ya no se baja si no ha cambiado:</b> el servidor pregunta primero solo por lo ligero (id y <code>updated_at</code>, ~100 bytes por viaje) y guarda la última ruta en memoria; solo la baja si el viaje cambió (o tiene más de 15 minutos).</li>
<li><b>Fotos:</b> la dirección firmada de cada foto se guarda (memoria y móvil) y se reutiliza 6 días (se renueva cuando le queda menos de uno): misma foto, misma dirección, el móvil la guarda. Las fotos nuevas se suben con caché de <b>un año</b>. Las listas siguen pidiendo la miniatura; la grande solo sale a pantalla completa (comprobado). Las que ya estaban subidas: ver «Las fotos viejas».</li>
<li><b>Preguntas repetidas</b> (<code>src/lib/sondeo.ts</code>): se preguntan una sola vez aunque las pidan varias pantallas, nunca con la app en segundo plano, al abrir, al volver a la app y después de un cambio; y el reloj de respaldo se espacia: viaje compartido 45 s (solo el sello; los cambios llegan <b>al momento por Realtime</b>), gastos 2 min, propuestas 2 min, avisos 3 min, lo suyo del viaje 2 min, «cerca de aquí» 75 s.</li></ul>

<h2>3. Medida: antes y después (una persona, un día de viaje de 10 h, viaje compartido con dos móviles)</h2>
<p><code>node scripts/destino/medidaV26.mjs</code> ejecuta el código REAL de la app (guardar, sondear, refrescar) contra un Supabase de mentira que cuenta bytes; <b>no toca producción</b>. <b>Medido:</b> el viaje compartido y las llamadas de logros. <b>Estimado (con los supuestos escritos en el script):</b> las fotos, porque no se puede medir la red real de un móvil desde aquí.</p>
<table><tr><th>Qué</th><th>Antes</th><th>Después</th><th>Medido o estimado</th></tr>
<tr><td>Llamadas de logros (HOY abierto 10 h, 2 viajes de 79 KB)</td><td>~130 MB</td><td>~1,4 MB</td><td>medido</td></tr>
<tr><td>Viaje compartido: 60 toques de pestaña o día</td><td>~17 MB (cada toque guardaba la ruta entera y Realtime la mandaba a los 2 móviles)</td><td>0 (ya no se guarda nada al abrir una pestaña o un día)</td><td>medido</td></tr>
<tr><td>Viaje compartido: 15 cambios reales</td><td>~4,3 MB</td><td>~4,3 MB (la ruta que cambia tiene que viajar; el propio móvil reconoce su eco con 100 bytes)</td><td>medido</td></tr>
<tr><td>Viaje compartido: reloj de respaldo, app quieta</td><td>0,13 MB (cada 30 s)</td><td>0,09 MB (cada 45 s, 100 bytes por pregunta)</td><td>medido</td></tr>
<tr><td>Fotos de logros: abrir colecciones, el Visto, el pasaporte (20 veces × 15 fotos)</td><td>~24 MB (con fotos de hasta 300 KB, ~90 MB): la foto GRANDE para un cuadrito, con firma nueva cada vez</td><td>~0,3 MB (miniatura, misma dirección 6 días)</td><td>estimado</td></tr>
<tr><td>Fotos del viaje: listarlas 40 veces con 40 fotos</td><td>~31 MB (firma nueva cada vez: el móvil las bajaba otra vez)</td><td>~0,8 MB (una vez)</td><td>estimado</td></tr>
<tr><th>Una persona, un día</th><th>~207 MB</th><th>~7 MB</th><th></th></tr>
<tr><th>1.000 personas, viaje de 5 días al mes</th><th>~1.013 GB al mes</th><th>~34 GB al mes (el plan Pro incluye 250 GB)</th><th></th></tr></table>
<p><b>Lo que no cuadra todavía, dicho claro:</b> mi cuenta de «antes» sale en ~200 MB por persona y día (hasta ~275 MB con fotos de 300 KB), no en ~1 GB. Faltan unos 700 MB que no sé explicar sin ver el desglose real del panel de Supabase (Reports → Egress, por servicio: Storage, Realtime, API). Mi sospecha principal sigue siendo Storage (fotos) y Realtime, pero es una sospecha, no una medida. Por eso lo primero tras subirlo es mirar ese panel (ver «PARA ERIC»). Los números de «después» son por persona; con una persona sola el viaje compartido cuesta la mitad.</p>

<h2>3b. Las tres preguntas concretas</h2>
<ul>
<li><b>Fotos del álbum y de los logros: ¿la grande en vez de la pequeña? ¿Se bajan en los dos móviles cada vez?</b> El álbum y todas las listas del viaje ya usaban la miniatura (la grande solo sale a pantalla completa: comprobado en <code>pruebaV26</code>). <b>Pero las fotos de los logros SÍ se firmaban en grande</b>, con una firma de 1 hora nueva en cada llamada: el móvil las bajaba enteras cada vez que se abría una colección. Arreglado: miniatura y misma dirección durante 6 días. Y las fotos del viaje (RUTA, DÍAS, HOY…) pedían una firma nueva en cada listado y se bajaban otra vez: arreglado (la dirección se reutiliza). En los dos móviles se baja la primera vez cada uno, no «cada vez».</li>
<li><b>Sincronización del viaje: ¿se baja la ruta entera en cada cambio?</b> Cuando cambia una persona, la otra baja el viaje entero una vez (necesario: la ruta cambió). El móvil que guarda ya no lo baja de vuelta: apunta el sello de su guardado y reconoce el eco con 100 bytes. Lo que sí pasaba: <b>cada toque en una pestaña o un día guardaba el viaje entero</b> (74 KB hacia arriba y el eco a los dos móviles). Ya no se guarda nada al abrir una pestaña o un día.</li>
<li><b>Tiempo real: ¿manda el viaje entero en cada aviso?</b> Sí, y es cosa de Supabase: <code>postgres_changes</code> manda la fila entera (ruta incluida) a cada móvil suscrito en cada cambio (~148 KB por cambio con 2 móviles y 74 KB de ruta). No se puede recortar desde la app. Lo que he hecho: que haya muchos menos cambios (ni pestañas ni días) y que el aviso no baje nada si el cambio es el propio. Para recortarlo de verdad haría falta una tabla pequeña de avisos (<code>trip_cambios</code>), con migración y SQL tuyos: queda como decisión tuya.</li>
</ul>


<h2>4. Las fotos viejas (caché de un año)</h2>
<p>Supabase no deja cambiar ese dato de un archivo que ya existe: hay que volver a escribirlo. <code>scripts/destino/cacheDeLasFotosViejas.mjs</code> lo hace desde aquí (no desde los móviles), con la misma ruta, y comprueba que el tamaño no cambia. Antes de aplicarlo enseña la lista de lo que reescribiría.</p>

<h2>5. «Logros congelados» (20:00, Eric y Alicia en Lanzarote)</h2>
<ul><li><b>Qué era:</b> lo de logros se carga por partes; si una parte no se podía bajar (red que falla o una versión nueva publicada con la app abierta), <code>React.lazy</code> se acordaba del fallo para siempre y la pieza que envolvía todo lo de logros se quedaba muerta y en blanco hasta cerrar la app. Encaja con que se congelase solo logros y que cerrar y abrir lo arreglase. No he podido comprobarlo con los registros de Vercel.</li>
<li><b>Ahora:</b> una pieza que falla dice «No se ha podido cargar, vuelve a probar» con [Reintentar] y vuelve a funcionar al tocarlo; la hoja no se queda en el esqueleto (a los 10 s lo dice igual); ninguna llamada de logros ni la sesión esperan sin fin (8 y 15 s); y si hay versión nueva, <b>no se recarga sola</b>: sale «Hay una versión nueva · [Actualizar]» y solo se recarga al tocarlo (o la próxima vez que se abra la app).</li></ul>
${fig('congelado_aviso', 'Una pieza de logros que falla')}${fig('congelado_hoja_sin_cargar', 'La hoja cuando la respuesta no llega')}

<h2>Lista de comprobación de ESTA tanda</h2>
<label><input type="checkbox"> Dos móviles en un viaje compartido: lo que cambia uno lo ve el otro en pocos segundos</label>
<label><input type="checkbox"> Las fotos del viaje salen al instante la segunda vez (y con la app cerrada y abierta)</label>
<label><input type="checkbox"> Logros: abrir → «Yo también estaba» → cerrar → abrir, varias veces, sin congelarse</label>
<label><input type="checkbox"> Tras publicar una versión con la app abierta: aparece «Hay una versión nueva» y no se recarga sola</label>
<label><input type="checkbox"> En Supabase (Reports → Egress): el gráfico baja en los días siguientes</label>
</body></html>`
fs.writeFileSync('docs/dias/REPASO_V26.html', html)
console.log('docs/dias/REPASO_V26.html', Math.round(html.length / 1024), 'KB')
