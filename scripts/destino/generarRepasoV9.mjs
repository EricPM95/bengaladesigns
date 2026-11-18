// Genera docs/dias/REPASO_V9.html (después de pruebaV9 y _v9_design_pantallas, que sacan las capturas en docs/dias/V9_capturas): node scripts/destino/generarRepasoV9.mjs
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'

const img = (n) => (fs.existsSync(`docs/dias/V9_capturas/${n}.jpg`) ? `data:image/jpeg;base64,${fs.readFileSync(`docs/dias/V9_capturas/${n}.jpg`).toString('base64')}` : null)
const fig = (n, pie) => `<figure>${img(n) ? `<img alt="${pie}" src="${img(n)}">` : '<div class="no">sin captura</div>'}<figcaption>${pie}</figcaption></figure>`
const par = (app, design, pie) => `<div class="par">${fig(app, 'App · ' + pie)}${design ? fig(design, 'Design · ' + pie) : ''}</div>`

// La tabla «qué trozo de la insignia es de cada sitio» (Roma y Lanzarote): sale de la misma regla que dibuja la insignia (`piezaDeInsignia`), por muestreo (`trozoDeInsignia`).
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'trozo-'))
fs.copyFileSync('src/components/logros/momentos/hoja/piezaDeInsignia.ts', path.join(tmp, 'piezaDeInsignia.ts'))
fs.writeFileSync(path.join(tmp, 'trozo.ts'), fs.readFileSync('src/components/logros/pantallas/destino/trozo.ts', 'utf8').replace("'../../momentos/hoja/piezaDeInsignia'", "'./piezaDeInsignia.ts'"))
const { trozoDeInsignia } = await import(pathToFileURL(path.join(tmp, 'trozo.ts')).href)
const DIRS = ['arriba', 'arriba a la derecha', 'derecha', 'abajo a la derecha', 'abajo', 'abajo a la izquierda', 'izquierda', 'arriba a la izquierda']
const dondeEsta = (t) => {
  if (!t) return '—'
  const dx = t.centro[0] - 0.5
  const dy = t.centro[1] - 0.5
  if (Math.hypot(dx, dy) < 0.06) return 'centro'
  const g = (Math.atan2(dx, -dy) * 180) / Math.PI // 0 = arriba, sentido de las agujas del reloj
  return DIRS[Math.round(((g + 360) % 360) / 45) % 8]
}
const tablas = ['roma', 'lanzarote']
  .map((d) => {
    const datos = JSON.parse(fs.readFileSync(`data/logros/${d}.json`, 'utf8'))
    const nombres = JSON.parse(fs.readFileSync(`data/pipeline_v2/${d}.json`, 'utf8'))
    const nombreDe = (id) => {
      const lista = Array.isArray(nombres) ? nombres : (nombres.places ?? [])
      return lista.find((p) => p.id === id)?.name ?? id.replace(/_/g, ' ')
    }
    const filas = (datos.colecciones ?? []).map((c) => `<tr><td>${c.nombre}</td><td>${c.sitios.map((s, k) => `${k + 1}. ${nombreDe(s)} → <b>${dondeEsta(trozoDeInsignia(c.id, c.sitios.length, k))}</b>`).join('<br>')}</td></tr>`)
    return `<h3>${d === 'roma' ? 'Roma' : 'Lanzarote'}</h3><table>${filas.join('')}</table>`
  })
  .join('')

const tiempos = JSON.parse(execFileSync('node', ['scripts/destino/_v9_tiempos.mjs', '150'], { encoding: 'utf8' }).trim().split('\n').pop())
const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Repaso de la tanda V9 · Los logros</title>
<style>:root{--bg:#FBF6EC;--tx:#1C2230;--bd:rgba(28,34,48,.15)}@media (prefers-color-scheme:dark){:root{--bg:#1C2230;--tx:#FFFDF8;--bd:rgba(255,253,248,.2)}}body{margin:0;padding:16px;background:var(--bg);color:var(--tx);font:15px/1.5 system-ui,sans-serif;max-width:900px;margin-inline:auto}h1{font:400 30px/1.1 Georgia,serif}h2{font:400 22px/1.2 Georgia,serif;margin-top:28px;border-top:1px solid var(--bd);padding-top:14px}h3{font:600 15px system-ui;margin:18px 0 6px}figure{margin:8px 10px 8px 0;display:inline-block;vertical-align:top;max-width:300px}.par{display:flex;gap:12px;flex-wrap:wrap}img{max-width:100%;height:auto;border:1px solid var(--bd);border-radius:10px}figcaption{font-size:12px;opacity:.7}.no{padding:30px;border:1px dashed var(--bd)}label{display:block;margin:6px 0}code{font-size:12.5px;background:rgba(127,127,127,.15);padding:1px 4px;border-radius:4px}.nota{font-size:12.5px;opacity:.7}table{border-collapse:collapse;width:100%;font-size:13px}td{border:1px solid var(--bd);padding:4px 8px;vertical-align:top}</style></head><body>
<h1>Los logros (V9)</h1>
<p>Probado con <code>pruebaV9</code> (nueva), <code>pruebaJutrip</code> y las de logros de Roma y Lanzarote, de pantallas y de añadir parada. La muestra de 60 viajes de Roma sale idéntica. Ninguna prueba toca el Supabase de producción.</p>
<h2>1. Logros abre al instante</h2>
<p><b>Antes:</b> cada vez que se tocaba el botón, la hoja volvía a pedir todo y no enseñaba nada hasta que contestaba el servidor (~2 s con «Un momento…»). <b>Ahora:</b> lo último que se vio (por viaje y en «Todos mis logros» / la vitrina) se guarda en el móvil y en memoria y se enseña al instante; lo nuevo llega por detrás y solo cambia lo que cambie (sin parpadeos). Al abrir el viaje se piden ya, por detrás, el estado y «Todos mis logros». «Un momento…» ya no existe: la primera vez en un móvil nuevo sale el esqueleto gris. Se borra al cerrar sesión. Vale para todos los destinos.</p>
<p><b>Por qué tardaba (medido):</b> el servidor hacía unas <b>6 rondas seguidas</b> a la base de datos (cada una ~150-300 ms): primero los viajes (propios → de miembro → ajenos → invitaciones, una detrás de otra), luego el perfil y los referidos, luego la invitación. <b>Ahora son ~2 rondas</b>: todo se lee a la vez (<code>cargar</code>) y los viajes piden propios+miembro a la vez y luego ajenos+invitaciones a la vez.</p>
<p><b>Antes y después</b> (el servicio y el repo de verdad contra un cliente de datos falso que tarda 150 ms en cada pregunta; <b>no se ha medido contra el Supabase real</b>, no se toca producción): <b>antes 6,4 rondas ≈ 960 ms; después ${tiempos.rondas} rondas ≈ ${tiempos.ms} ms</b> (con 250 ms por pregunta: ~1.600 → ~520 ms). Script: <code>scripts/destino/_v9_tiempos.mjs</code>.</p>
<h2>2. La hoja «Tus logros en …»</h2>
<p>Fuera «Para tu próximo viaje a …». Arriba, las colecciones con algún pedazo (insignia de 76, nombre, «HOY» si es de hoy, barra y «1 de 7»); al final, las que están a 0, juntas y plegadas en «Más colecciones de Lanzarote (5) ›» (al abrirlas, las mismas filas; si todas están a 0, sin plegar). La medalla, su barra y «Te quedan 2 para la plata · 6 para el diamante» en una sola tarjeta oscura. Arriba, [Reclamar con tus fotos] con su plazo también durante el viaje y la tarjeta «Yo también estaba». Más aire entre bloques (18 px; Design deja 10).</p>
${par('hoja_arriba', 'design_hoja_H1', 'La hoja, con 2-3 colecciones empezadas y el resto plegado')}
${par('hoja_emblemas', 'design_hoja_H2', 'Las colecciones a 0 abiertas y los emblemas ocultos (4 columnas, sin cortes)')}
<h2>3. La colección por dentro</h2>
<p>Cada sitio, una tarjeta con foto: ganado en color (la foto con la que se ganó; si fue con un Visto o «Yo también estaba», la del sitio de nuestros datos) con la marca y la fecha; sin ganar, la foto en gris suave; en las dos, su trozo de la insignia pequeño en una esquina. Sin ganar: durante el viaje y en la ruta, el día y [Cómo llegar]; si no está en la ruta, [Añadir a mi viaje]; con el viaje terminado, nada. Primero los ganados. Al tocar una tarjeta, su trozo late y brilla en la insignia grande. Los emblemas ocultos nunca salen.</p>
${par('coleccion', 'design_coleccion_C1', 'La colección (Roma, demo)')}
${par('coleccion_tocada', 'design_coleccion_C3', 'Una tarjeta tocada: su trozo se ilumina')}
<h3>Qué trozo de la insignia va con cada sitio (por el orden de la colección)</h3>
${tablas}
<p class="nota">Cada trozo es el sitio que ocupa ese lugar en la lista de la colección (<code>data/logros/&lt;destino&gt;.json</code>). La posición sale de la regla con la que se dibuja la insignia (octógono de 8, escudo, cuatro joyas, cinta o cuñas); en Lanzarote las insignias de «gajos» se recortan con las mismas cuñas.</p>
<h2>4. [Añadir a mi viaje]: el mejor día y el mejor hueco</h2>
<p>Desde la colección y desde EXPLORAR el sitio ya no va de primero del día: la hoja «¿A qué día?» marca con «Te pilla de camino» el día cuya ruta pasa más cerca del sitio y al que aún le cabe (≤ 8 paradas, con hueco en que el sitio esté abierto); solo días que quedan (los pasados salen bloqueados; si el viaje entero ya pasó la regla no se aplica); y en el día elegido va entre las dos paradas más cercanas con el menor rodeo (si a esa hora está cerrado, en el siguiente hueco abierto). Las comidas y lo de hora fija no se mueven: solo se inserta. Después, como antes: te lleva al día, ilumina la parada y avisa abajo. El Free Tour sigue de primero.</p>
<h2>5. Emblemas ocultos</h2>
<p>La cuadrícula de la hoja pasa a 4 columnas que caben enteras a lo ancho (Lanzarote, 11; Roma, 14), sin cortes. En el resumen no hay cuadrícula (solo los descubiertos en el viaje). <b>El emblema «El calor de la tierra» (timanfaya):</b> en la app se dibuja bien (hexágono con las Montañas del Fuego y el calor que sube, el «gl» de <code>Emblema Secreto</code>); el aro vacío es de la pieza <code>Emblema Lanza</code> de Design, que no trae el kind «1». No he tocado el archivo de Design (la app no depende de él); los 11 emblemas de Lanzarote salen con su dibujo (se comprueba en <code>pruebaV9</code> y <code>pruebaTandaLZ3b</code>).</p>
<h2>6. El resumen del viaje, rehecho</h2>
<p>Foto grande del viaje (una suya; si no, la del destino) con «Lo que te llevas de Lanzarote» y días, paradas, km (suma de las rectas entre paradas) y fotos; la medalla grande sin barra («Has conseguido el bronce de Lanzarote»); colecciones solo las que suman en este viaje («+2»); emblemas solo los descubiertos con su dibujo y nombre y «+9 secretos por descubrir»; logros de viajero nuevos de 3 en 3 del mismo tamaño y cada uno con SU dibujo y marco. <b>Fallos de hoy arreglados:</b> «{ciudad} {anio}» se rellena («Lanzarote 2026») y la moneda lleva el nombre del destino y su dibujo (Roma, el Coliseo; Lanzarote, las Montañas del Fuego; París, su torre; otros, un monumento en una estrella hasta que Design dibuje el suyo), con el nombre siempre dentro de la moneda y entero (el tamaño de la letra se ajusta a las letras).</p>
${par('resumen_1', 'design_resumen_R1', 'El resumen')}
<p><b>«Te quedan N sorpresas por reclamar»:</b> ahora es una tarjeta que se toca y abre la hoja con CUÁLES son. N es exactamente la lista: los sitios de la ruta que dan algún pedazo de colección y aún no se tiene (antes contaba paradas con un emblema pendiente, y por eso no cuadraba). Cada uno con su foto, su nombre, su día («Día 3 · mié 11») y lo que da («Los imprescindibles de Lanzarote»), [Subir foto] y abajo [Reclamar con tus fotos]. Los emblemas ocultos nunca se nombran: un sitio que solo esconde un emblema no sale y, si queda alguno por descubrir, una línea final «Y quizá algún secreto…». Sin plazo o sin nada que reclamar, no sale.</p>
${par('sorpresas', 'design_resumen_R2', 'La hoja de sorpresas')}
<h2>Lo que queda fuera o por mirar</h2>
<p>«Busca en toda la app más textos con {…} sin rellenar»: lo he comprobado en la hoja, la colección y el resumen (y <code>pruebaV9</code> lo vigila ahí); no he recorrido las demás pantallas una a una. No he podido probar nada contra el Supabase real (las pruebas no lo tocan): el tiempo del servidor está medido con un cliente falso.</p>
<h2>Lista de comprobación de ESTA tanda</h2>
<label><input type="checkbox"> Tocar el botón de logros abre la hoja al momento (la segunda vez y siguientes), sin «Un momento…»</label>
<label><input type="checkbox"> Tras ganar un pedazo nuevo, la hoja se actualiza sola al abrirla</label>
<label><input type="checkbox"> Las colecciones a 0 van plegadas en «Más colecciones de …» y no sale «Para tu próximo viaje»</label>
<label><input type="checkbox"> La medalla y «Te quedan N para la plata · M para el diamante» van en una sola tarjeta</label>
<label><input type="checkbox"> En una colección, cada sitio es una tarjeta con foto y su trozo; al tocarla, el trozo brilla en la insignia</label>
<label><input type="checkbox"> Con el viaje terminado, las tarjetas sin ganar no llevan [Cómo llegar] ni «Día 3»</label>
<label><input type="checkbox"> [Añadir a mi viaje] desde la colección y desde EXPLORAR: el día «Te pilla de camino», el sitio entre dos paradas cercanas, nunca en un día pasado</label>
<label><input type="checkbox"> Los emblemas encontrados salen todos con su dibujo y la cuadrícula cabe sin cortes (Roma y Lanzarote)</label>
<label><input type="checkbox"> El resumen: foto arriba, medalla grande, «+N» en colecciones, emblemas con nombre, «Lanzarote 2026» con su moneda y el nombre dentro</label>
<label><input type="checkbox"> «Te quedan N sorpresas por reclamar» se toca y lista los sitios; ningún emblema se nombra</label>
</body></html>`
fs.writeFileSync('docs/dias/REPASO_V9.html', html)
console.log('docs/dias/REPASO_V9.html', Math.round(html.length / 1024), 'KB')
