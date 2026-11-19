// Genera docs/dias/REPASO_V23.html (después de pruebaV23 y pruebaV23_entradas, que sacan las capturas en docs/dias/V23_capturas): node scripts/destino/generarRepasoV23.mjs
import fs from 'node:fs'

const img = (n) => (fs.existsSync(`docs/dias/V23_capturas/${n}.jpg`) ? `data:image/jpeg;base64,${fs.readFileSync(`docs/dias/V23_capturas/${n}.jpg`).toString('base64')}` : null)
const fig = (n, pie) => `<figure>${img(n) ? `<img alt="${pie}" src="${img(n)}" style="max-width:230px;border-radius:12px">` : '<div>sin captura</div>'}<figcaption>${pie}</figcaption></figure>`
const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Repaso de la tanda V23 · Arreglos sueltos</title>
<style>:root{--bg:#FBF6EC;--tx:#1C2230}@media (prefers-color-scheme:dark){:root{--bg:#1C2230;--tx:#FFFDF8}}body{margin:0;padding:16px;background:var(--bg);color:var(--tx);font:16px/1.5 system-ui,sans-serif;max-width:800px}h1{font-size:24px}h2{font-size:19px;margin-top:28px}code{font-size:13px}label{display:block;margin:6px 0}figure{display:inline-block;margin:8px 10px 8px 0;vertical-align:top}figcaption{font-size:12.5px;opacity:.7;max-width:230px}</style></head><body>
<h1>Crear un viaje, la foto de Lanzarote y la pestaña Entradas (V23)</h1>
<p>Probado con <code>pruebaV23</code> (26 comprobaciones), <code>pruebaV23_entradas</code> (16), <code>pruebaJutrip</code> (130) y las de crear un viaje y de la ficha. La muestra de 60 viajes de Roma no se ha vuelto a pasar porque no se ha tocado el motor de rutas.</p>

<h2>1. Crear un viaje: el campo que desaparece</h2>
<ul><li><b>La causa (por lo que se ve en el código; en un iPhone de verdad no he podido probarlo):</b> al tocar ORIGEN o DESTINO, la tarjeta sube a lo alto de la pantalla (colocada con <code>top</code> fijo), y a la vez Safari desplaza la página para dejar el campo encima del teclado. Si coinciden, la tarjeta queda fuera de lo que se ve. La app medía el alto de lo visible (<code>visualViewport.height</code>) pero no cuánto había desplazado el iPhone (<code>offsetTop</code>).</li>
<li><b>Arreglo:</b> la tarjeta se coloca sumando ese desplazamiento (se mueve con lo que se ve) y, mientras se escribe, la página se sujeta arriba (si el iPhone la mueve, se devuelve a 0 y la página no se desplaza).</li>
<li><b>«Autorrellenar contacto»:</b> los dos campos llevan ahora <code>autocomplete="off"</code>, <code>autocorrect="off"</code>, <code>autocapitalize="off"</code>, <code>spellcheck="false"</code>, <code>enterkeyhint="search"</code> y un nombre propio (<code>trazo-buscar-ciudad-…</code>, que no parece de dirección). <b>No puedo asegurar que Safari lo respete</b> (a veces ignora <code>autocomplete="off"</code>): hay que mirarlo en el iPhone.</li>
<li><b>Los demás campos de texto</b> (buscadores): Explorar, Añadir parada, Buscar lugar, Otra reserva, el buscador de ruta y «Cuéntanos» llevan ya <code>autocomplete="off"</code> (casi todos lo tenían; añadí «sin autocorrección» y «buscar» al teclado). El fallo de la tarjeta que sube era solo de la primera pantalla.</li>
<li><b>La prueba:</b> en Chrome con tamaño de iPhone y el alto del teclado quitado, tocar ORIGEN y DESTINO 20 veces (10 y 10, cerrando entre una y otra) y 10 más seguidas sin cerrar: la tarjeta y el campo se ven siempre. <b>Playwright con WebKit no está instalado aquí</b> (no he descargado nada), así que no es el Safari real: no reproduce el desplazamiento de iOS.</li></ul>
${fig('ciudad_teclado_origen', 'Tocar ORIGEN, con el teclado')}${fig('ciudad_teclado_destino', 'Tocar DESTINO')}

<h2>2. Lanzarote sin foto</h2>
<ul><li><code>_mapa.json</code> de Lanzarote tenía <code>portada: null</code>: ahora lleva <b>Papagayo</b> (<code>/fotos/lanzarote/playas_de_papagayo.jpg</code> y <code>_p.jpg</code>, la que eligió Eric el 4-nov). Quitada la nota vieja.</li>
<li>Los demás sitios (la tarjeta del viaje, la página del destino) ya usaban Papagayo por otro camino (<code>PORTADAS_PROPIAS</code>); la primera pantalla era la única que leía el <code>_mapa.json</code>.</li>
<li><b>Que no vuelva a pasar:</b> la prueba falla si un destino con <code>_mapa.json</code> no tiene portada o si su archivo no existe.</li>
<li><b>¿Sigue oculto Lanzarote?</b> Sí: <code>DESTINOS_OCULTOS</code> vale <code>lanzarote</code> por defecto (<code>server/destinosCurados.js</code>) y solo lo ve el administrador. Para abrirlo a todos: poner <code>DESTINOS_OCULTOS=</code> (vacío) en Vercel y en el api-server, o quitarlo de esa lista. No lo he cambiado: lo decide Eric.</li></ul>

<h2>3. La pestaña Entradas, como Design</h2>
<ul><li><b>Por qué salía todo abierto:</b> no se perdió en ninguna tanda: la ficha de datos reales (<code>DatosDeLaActividad</code>) se hizo en la API de consulta parte 1 como «provisional hasta que Design dibuje la suya» y nunca se sustituyó.</li>
<li><b>Ahora, cada opción cerrada y estrecha</b> (foto pequeña a la izquierda; nombre, ★ nota y opiniones, dos etiquetas —«Cancelación gratis», «Con audioguía», o los idiomas—, duración y «desde X €»). Tres a la vez caben en una pantalla.</li>
<li><b>Al tocar una,</b> se abre con incluye, no incluye, punto de encuentro (con «Ver en el mapa ↗»), cancelación, hasta cuándo se reserva, «La hora que te recomendamos» (un recuadro suave, que no parece botón) y un solo botón <b>[Ver horas y reservar ↗]</b> (la flechita es un icono de la familia, no un carácter).</li>
<li><b>Arreglado:</b> el «€» suelto (sin precio no sale nada) y «24EUR» → «24 €». El precio siempre «desde».</li>
<li><b>La foto (unos 4 s):</b> la foto se pedía solo al montar la pestaña, después de tener los datos. Ahora: foto pequeña (no se pide la grande), empieza a cargarse al <b>abrir la ficha</b> (no al tocar la pestaña), fondo suave del tamaño de la foto mientras llega (no salta nada) y queda en la caché del móvil. <b>Medido</b> con tamaño de iPhone y la red lenta de Chrome (Slow 4G, 400 ms): la segunda vez, ~470 ms (objetivo &lt; 1 s). El «antes» de los 4 s no lo he podido medir aquí: con la API de actividades apagada no hay foto de actividad que cargar.</li>
<li><b>Falta de esta pieza:</b> «Últimas plazas», «Ese día no quedan plazas», sitio gratis, reserva obligatoria, ya reservada y Free Tour siguen como estaban en la pestaña (esas piezas ya existían); no las he rehecho una a una contra Design.</li></ul>
${fig('entradas_cerradas', 'Las opciones, cerradas y estrechas')}${fig('entradas_abierta', 'Una abierta, con detalles y un solo botón')}

<h2>Los enlaces de reservar</h2>
<ul><li><b>Número de afiliado:</b> <code>aid=5206</code> (<code>shared/affiliate/civitatis.js</code>). <b>Eric: confirma que es el tuyo.</b></li>
<li><b>Lanzarote:</b> comprobadas 5 excursiones (y las 23 llevan su página propia): el botón abre la página de ESA excursión, con <code>aid=5206</code> y la campaña del viaje.</li>
<li><b>Roma: solo 1 de 22 entradas</b> (el Free Tour) tiene página propia en los datos; las otras 21 abren <b>la búsqueda de ese sitio</b> con nuestro aid (no es un buscador de otra cosa, pero no es la página directa de la actividad). Con la API de actividades encendida, el botón usaría la página que ella devuelve. Hace falta buscar a mano la página de cada entrada de Roma: ver «PARA ERIC».</li></ul>

<h2>Lista de comprobación de ESTA tanda</h2>
<label><input type="checkbox"> En el iPhone: tocar ORIGEN y DESTINO muchas veces; la tarjeta se ve siempre, arriba</label>
<label><input type="checkbox"> En el iPhone: ¿sigue saliendo «Autorrellenar contacto» sobre el teclado?</label>
<label><input type="checkbox"> Primera pantalla (como administrador): Lanzarote con la foto de Papagayo</label>
<label><input type="checkbox"> Ficha del Coliseo → Entradas: opciones cerradas, estrechas, sin «€» suelto</label>
<label><input type="checkbox"> Tocar una: detalles y [Ver horas y reservar ↗] abre la página</label>
<label><input type="checkbox"> La foto de la entrada sale rápido la segunda vez</label>
<label><input type="checkbox"> 5 entradas de Roma y 5 excursiones de Lanzarote: ¿el enlace abre lo que debe?</label>
</body></html>`
fs.writeFileSync('docs/dias/REPASO_V23.html', html)
console.log('docs/dias/REPASO_V23.html', Math.round(html.length / 1024), 'KB')
