// Genera docs/dias/REPASO_V31.html: node scripts/destino/generarRepasoV31.mjs
import fs from 'node:fs'
import { cargarDatos } from '../../server/logros/datos.js'
import { paginaDeDestino } from '../../server/logros/pantallas/destino.js'
import { leerDestinosCurados } from '../../server/destinosCurados.js'
import { paginaDelDestino } from '../../server/paginaDestino.js'

const datos = cargarDatos()
const curados = leerDestinosCurados('data', { esAdmin: true })
const hoteles = (d) => JSON.parse(fs.readFileSync(`data/dias/${d}/_hoteles.json`, 'utf8')).hoteles.filter((h) => !h.pendiente)
const filas = ['roma', 'lanzarote'].map((d) => {
  const r = paginaDeDestino({ datos, destino: d, items: new Map(), viaje: null, hoy: '2026-11-20' })
  const c = curados.find((x) => x.clave === d)
  const pag = paginaDelDestino({ raiz: '.', destination: d, datosDestino: fs.existsSync(`data/pipeline_v2/${d}.json`) ? JSON.parse(fs.readFileSync(`data/pipeline_v2/${d}.json`, 'utf8')) : null })
  const nAct = pag.actividades.filter((a) => /civitatis.com/.test(a.url)).length
  return { d, nombre: c.nombre, sellos: r.sellos.map((s) => s.nombre).join(' + '), nSellos: r.sellos.length, cols: r.colecciones.length, sitios: r.colecciones.map((x) => x.total).join('·'), emb: r.emblemas.total, hot: hoteles(d).length, hotN: hoteles(d).map((h) => h.nombre).join(', '), act: nAct, portada: Boolean(c.portada && fs.existsSync('public' + c.portada)), linea: c.linea, pais: c.pais, iso: c.iso }
})
const ok = (b) => (b ? '✓' : '✗')
const tabla = `<table><tr><th>Destino</th><th>Medalla / sello</th><th>Colecciones (sitios)</th><th>Emblemas secretos</th><th>Hoteles</th><th>Actividades (aid=5206)</th><th>Portada · país · línea</th></tr>${filas
  .map((f) => `<tr><td><b>${f.nombre}</b></td><td>${ok(f.nSellos > 0)} ${f.nSellos}: ${f.sellos}</td><td>${ok(f.cols > 0)} ${f.cols} (${f.sitios})</td><td>${ok(f.emb > 0)} ${f.emb}</td><td>${ok(f.hot > 0)} ${f.hot}: ${f.hotN}</td><td>${ok(f.act > 0)} ${f.act} de Civitatis (la app les pone aid=5206 al abrirlas)</td><td>${ok(f.portada)} ${f.pais} · «${f.linea}» · bandera ${f.iso}</td></tr>`)
  .join('')}</table>`
const img = (f, ancho = 200) => (fs.existsSync(`docs/dias/V31_capturas/${f}.jpg`) ? `<img alt="${f}" src="data:image/jpeg;base64,${fs.readFileSync(`docs/dias/V31_capturas/${f}.jpg`).toString('base64')}" style="max-width:${ancho}px;border-radius:12px;margin:4px;border:1px solid #ccc">` : `<p>(falta ${f})</p>`)
const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Repaso de la tanda V31 · La primera vez</title>
<style>:root{--bg:#FBF6EC;--tx:#1C2230}@media (prefers-color-scheme:dark){:root{--bg:#1C2230;--tx:#FFFDF8}}body{margin:0;padding:16px;background:var(--bg);color:var(--tx);font:16px/1.5 system-ui,sans-serif;max-width:900px}h1{font-size:24px}table{border-collapse:collapse;font-size:12.5px}td,th{border:1px solid #9994;padding:3px 6px;text-align:left;vertical-align:top}label{display:block;margin:6px 0}code{font-size:13px}pre{background:#9992;padding:8px;overflow:auto;font-size:12px}</style></head><body>
<h1>V31 · La primera vez que alguien abre JUTRIP</h1>
<p>Probado con <code>pruebaV31</code> (64 comprobaciones, 0 fallos), <code>pruebaJutrip</code>, <code>pruebaTanda10J</code>, <code>pruebaV28</code>, <code>pruebaV30</code>, <code>pruebaV13</code> y <code>pruebaV3</code> en 0. <b>La muestra de 60 de Roma no se ha tocado</b> (el motor de rutas no cambia en esta tanda). <code>pruebaTanda10N8_perfil</code> sigue con el mismo fallo de la V30 («pastilla del pase»), que no tiene que ver.</p>
<h2>1. Qué hace, en palabras sencillas</h2>
<ul>
<li><b>Solo para el viajero nuevo:</b> una cuenta (no anónima) sin ningún viaje, ni propio ni compartido. Quien ya tiene viajes no ve nada nuevo.</li>
<li><b>Las 4 preguntas, una sola vez por cuenta</b> (las contestes o las saltes): ¿Cada cuánto viajas?, ¿Con quién sueles viajar?, ¿Cómo te gusta viajar? (+ «¿Qué te gusta ver?») y ¿En qué año naciste? (de 1920 al año actual, <b>sin ninguno marcado</b>; si no se toca, no se guarda). Una por pantalla, con la barra de progreso, «Saltar» y [Continuar]. La pantalla «Listo» no va: al acabar, directo al Perfil.</li>
<li><b>Se guardan SOLO tres cosas:</b> cada cuánto viaja, con quién suele viajar y el año de nacimiento. El ritmo y lo que le gusta ver (pregunta 3) salen igual pero <b>no se guardan nada</b>. Las respuestas no se usan para los viajes: el cuestionario de crear viaje sale como siempre, sin rellenar.</li>
<li><b>El Perfil del viajero nuevo:</b> es el Perfil de siempre (el bloque del viajero, la vitrina y el pasaporte) con, en el sitio de «Mis viajes», el mapa «¿A dónde te apetece ir?»: el mundo dibujado en SVG (nunca Mapbox), que se gira con un dedo y se acerca con dos, con los destinos tocables (también en Europa: la lista de debajo, por continentes y con bandera, es la otra puerta). Fuera el botón grande [Crear mi viaje]; queda el «+» flotante. En cuanto tiene su primer viaje, el Perfil vuelve a ser el de siempre.</li>
<li><b>Los destinos</b> salen de <code>data/primera_vez/destinos.json</code> (Eric lo puede cambiar sin tocar código): 11 de salida (de ellos solo salen los que ya tienen sus datos en la app: hoy Roma, y Lanzarote para administradores) y 3 «Próximamente» (Florencia, Berlín y Cartagena de Indias), siempre en gris.</li>
<li><b>La tarjeta de un destino:</b> foto, nombre, «Lo que te puedes llevar» con sus números reales, [Ver destino] y [Crear viaje]. Un «Próximamente»: «Lo estamos preparando. Te lo contamos en cuanto esté» y [Avísame], que guarda el aviso en la cuenta (el correo de la cuenta, en la tabla de avisos de destino que ya existía) y pasa a «Te avisaremos ✓».</li>
<li><b>[Crear viaje]</b> (en la tarjeta y en [Crear mi viaje a …] de la página del destino) abre la pantalla de ORIGEN y DESTINO de siempre con el destino ya elegido (Roma, Lanzarote…) y el origen vacío; se puede cambiar.</li>
<li><b>[Ver destino] sin viaje:</b> la página del destino de siempre, con el país y la línea corta (en los datos de cada destino: «Italia · La ciudad eterna», «España · Isla de volcanes»), las mismas actividades y alojamientos, <b>sin «Tu alojamiento»</b> ni «Ver todos en el mapa», «Lo que te puedes llevar» con las medallas en su tarjeta oscura, las colecciones con su insignia de verdad (con unos pedazos en color de adelanto) y los emblemas como siluetas con «?», y [Crear mi viaje a …] fijo abajo sin tapar el final. La ✕ va en una barra que aparece al bajar. Dentro de un viaje, la página no cambia.</li>
<li><b>El «+» flotante:</b> el de siempre y sin texto, con la versión C de Design (oro, brillo, un reflejo que lo cruza cada 4,5 s y una chispa; quieto con «reducir movimiento»). Se esconde con la tarjeta de un destino abierta y en la página del destino. La hoja «¿Qué quieres hacer?» no cambia.</li>
<li><b>El sorteo sigue escondido</b> (comprobado: ni rastro en el Perfil).</li>
</ul>
<h2>2. Tabla de revisión, destino por destino (todo sale de los datos de la app, nada del prototipo)</h2>
${tabla}
<p>Nota: en Roma son <b>14</b> emblemas secretos y 11 colecciones (el prototipo decía 12): manda el dato real. En el prototipo, Lanzarote tenía hoteles inventados («Hotel Costa Teguise»…); aquí son los 5 nuestros. Las medallas se enseñan en su grado más alto como adelanto (la principal en diamante, la otra en oro).</p>
<h2>3. Capturas de móvil</h2>
<p>Al lado de Design: el diseño está en <code>docs/diseno/proyecto/Primera Vez.dc.html</code> (tablero «APP · LA PRIMERA VEZ»: Q1-Q4, P1-P4, D1 y D2); ábrelo en el navegador para compararlo con estas capturas (no he podido sacar capturas del propio archivo de Design).</p>
<p><b>Las 4 preguntas</b><br>${['Q1', 'Q2', 'Q3', 'Q4'].map((n) => img(n)).join('')}</p>
<p><b>Perfil del viajero nuevo, tarjeta de Roma, de Lanzarote y «Próximamente»</b><br>${['P1_perfil_nuevo', 'P2_tarjeta_roma', 'P2_tarjeta_lanzarote', 'P3_tarjeta_proximamente'].map((n) => img(n)).join('')}</p>
<p><b>[Ver destino] de Roma (arriba y abajo) y de Lanzarote, y crear viaje con Roma elegida</b><br>${['D1_ver_destino_roma', 'D1_ver_destino_roma_abajo', 'D2_ver_destino_lanzarote', 'crear_viaje_con_roma'].map((n) => img(n)).join('')}</p>
<p>(En la demo del Perfil el bloque de arriba —«Hola, Viajero · Nivel 8»— son datos de ejemplo de la demo; la cuenta nueva real sale con nivel 0.)</p>
<h2>4. Para Eric: el SQL y lo legal</h2>
<p>Está en <code>docs/dias/RESUMEN_COLA_V30_V33.md</code> (lista «PARA ERIC»): la migración <b>0089</b> (<code>supabase/migrations/0089_viajero_primera_vez.sql</code>, con su <code>docs/dias/COMPROBAR_0089.sql</code> de una sola fila), qué datos nuevos se guardan, qué añadir a la política de privacidad y lo de los menores de 14 años.</p>
<h2>Lista de comprobación de ESTA tanda</h2>
<label><input type="checkbox"> Pegar la 0089 en el SQL editor de Supabase y pasar el COMPROBAR_0089 (una fila: «Aplicada»)</label>
<label><input type="checkbox"> Entrar con una cuenta nueva (sin viajes): salen las 4 preguntas, una vez, y luego el Perfil con el mapa</label>
<label><input type="checkbox"> En el iPhone, tocar los destinos del mapa (y de la lista) con el dedo; girar y acercar el mapa</label>
<label><input type="checkbox"> Tocar Roma → [Ver destino] y [Crear viaje]: la pantalla de crear viaje sale con Roma ya puesta</label>
<label><input type="checkbox"> Tocar Florencia → [Avísame] → «Te avisaremos ✓»</label>
<label><input type="checkbox"> Con un viaje ya creado, el Perfil es el de siempre (sin mapa)</label>
<label><input type="checkbox"> «Empezar de cero» (cuenta de administrador) borra las respuestas y los avisos</label>
<label><input type="checkbox"> Pasar lo legal por el gestor (política de privacidad; menores de 14 años)</label>
</body></html>`
fs.writeFileSync('docs/dias/REPASO_V31.html', html)
console.log('docs/dias/REPASO_V31.html', Math.round(html.length / 1024), 'KB')
