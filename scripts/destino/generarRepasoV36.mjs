// REPASO de la Tanda V36 (la fuga de datos de Supabase): la tabla antes/después, qué era la fuga, la lista de comprobación y PARA ERIC.
//   node scripts/destino/generarRepasoV36.mjs
import fs from 'node:fs'
const li = (x) => `<ul>${x.map((i) => `<li>${i}</li>`).join('')}</ul>`
const ol = (x) => `<ol>${x.map((i) => `<li>${i}</li>`).join('')}</ol>`
const tabla = (cabecera, filas) => `<table><thead><tr>${cabecera.map((c) => `<th>${c}</th>`).join('')}</tr></thead><tbody>${filas.map((f) => `<tr>${f.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`
const leer = (f) => (fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : '')

const antesDespues = tabla(
  ['Caso (un viajero)', 'Antes', 'Después', 'Cómo se midió'],
  [
    ['HOY 8 h: «cerca de aquí» al servidor (lecturas de logros)', '7.681 consultas · 81.924 KB', '5 consultas · 103 KB', 'servidor de mentira que mide filas y bytes (pruebaV36_servidor)'],
    ['HOY 8 h, el móvil: peticiones a Supabase', '≈ 3.100 peticiones · el viaje entero ≈ 48 veces (4,6–7,7 MB) · ≈ 240 guardados de 97 KB (23–38 MB que bajaba el otro móvil)', '562 peticiones · 30 KB bajados · 292 KB subidos (los 3 guardados reales) · 0 viajes enteros', 'Chrome de verdad con Supabase de mentira y tamaños reales (pruebaV36_cliente); «antes» calculado con los relojes viejos'],
    ['App abierta sin tocar, 10 min', '≈ 40 peticiones y 2 guardados de 97 KB', '11 peticiones · 0,4 KB · 0 guardados', 'pruebaV36_cliente'],
    ['App en segundo plano, 30 min', 'seguían /api/tiempo y la renovación de sesión', '0 peticiones', 'pruebaV36_cliente'],
    ['Panel de administrador, 12 clics (400 cuentas, 1.500 logros)', '93 consultas · 3.413 KB', '21 consultas · 488 KB', 'pruebaV36_servidor'],
    ['Avisos del viaje (tarea cada minuto)', '1.440 lecturas al día de la RUTA ENTERA de cada viaje en curso (115–500 MB por viaje y día)', 'ninguna ruta entera: solo ids y los avisos que tocan (cada 5 min)', 'ya arreglado el 15-nov con la 0077 (código + migración); ver PARA ERIC'],
  ],
)
const fuga = [
  '<b>La causa más probable (con prueba en el código y en las fechas):</b> la tarea de avisos del viaje que se dejó el 5-nov (tanda HOY3). Supabase la llamaba CADA MINUTO y cada vez bajaba la ruta entera y las reservas de cada viaje en curso (80–350 KB) solo para ver que aún no tocaba ningún aviso: 1.440 veces al día por viaje, de 115 a 500 MB por viaje y día. Empezó el 7-nov, se disparó el 8 con el viaje a Lanzarote (8 al 13) y se apagó sola el 12-13, porque solo corría con un viaje en curso. Ya estaba corregida el 15-nov (migración 0077: plan guardado en la base y tarea cada 5 minutos); <b>los 10 GB son la herencia de esos días.</b>',
  '<b>Además, el móvil de HOY gastaba de más:</b> (1) el viaje ENTERO se bajaba cada 20–45 s (la ruta guardada lleva dentro una copia de sí misma, `originalRoute`: 49 KB pasan a 97 KB); (2) cada «cerca de aquí» hacía que el servidor leyera las rutas de todos los viajes y 12 consultas de logros; (3) cada toque de pestaña guardaba el viaje entero; (4) <b>hallazgo nuevo:</b> el administrador guardaba el viaje entero (97 KB) cada 2 minutos sin que cambiara nada y el otro móvil lo bajaba cada vez (causa: una lista nueva con las mismas personas en cada recarga).',
  'Esta tanda arregla lo del móvil y el servidor (tabla de arriba) y deja un contador en desarrollo y una prueba que falla si vuelve.',
]
const lista = [
  'Inventario con números del cliente (docs/dias/V36_INVENTARIO_CLIENTE.md) y del servidor (docs/dias/V36_INVENTARIO_SERVIDOR.md), con las 5 que más gastan arriba.',
  'El móvil: un guardado idéntico a lo último de la nube ya no se manda; el sello del viaje caduca a las 3 h; «cerca de aquí» no repregunta si el viajero está quieto; sin `getUser()` de red (se lee la sesión del móvil); relojes de avisos y viaje compartido a 5 min y de gastos, propuestas y «lo suyo» a 10 min, todos solo con la pantalla visible; la lista de fotos una vez por viaje.',
  'El servidor: «cerca de aquí» lee solo viajes y logros y lo guarda 30 s; el panel guarda su lectura 60 s y la comparte entre peticiones; la pestaña Logros del panel la reutiliza.',
  'Contador de peticiones en desarrollo (móvil: window.__supabaseContador y consola cada minuto con aviso en rojo; servidor: server/medidorSupabase.js). En producción no hace nada y no pesa.',
  'Ninguna tarea programada corre contra producción desde el servidor de desarrollo (los crons viven en Vercel y en pg_cron de Supabase).',
  'CLAUDE.md: «toda consulta nueva a Supabase dice cada cuánto se hace y cuánto baja; nada en bucle».',
  'pruebaV36_cliente y pruebaV36_servidor: fallan si el día simulado de HOY baja más de 5 MB, si la app quieta hace peticiones o si el segundo plano hace alguna.',
  'Sin migración nueva (la 0092 queda libre).',
]
const paraEric = [
  '<b>LO PRIMERO (2 minutos):</b> en el SQL editor de Supabase pega <code>select jobname, schedule from cron.job;</code>. La fila <code>avisos-viaje</code> tiene que decir <code>*/5 * * * *</code> (cada 5 minutos). Si dice <code>* * * * *</code> (cada minuto), la fuga SIGUE VIVA: pega <code>supabase/migrations/0077_avisos_programados.sql</code> entera (se puede pegar dos veces) y luego <code>docs/dias/COMPROBAR_0077.sql</code>.',
  'Comprueba también que están aplicadas la 0078 (lista ligera de viajes) y la 0087 (aviso pequeño de Realtime) pegando <code>docs/dias/COMPROBAR_0078.sql</code> y <code>docs/dias/COMPROBAR_0087.sql</code>. Sin la 0087 el otro móvil se entera por el respaldo de 5 min.',
  '<b>Cambia la contraseña de Civitatis:</b> un agente la vio en pantalla al leer <code>.env.local</code> por error (no se escribió en ningún archivo ni informe). Por prudencia, rótala y actualiza <code>.env.local</code> y Vercel.',
  'Cuando se despliegue (ya está en main), mira Supabase › Usage › Egress por días, filtrando por PostgREST. Esperado: casi cero los días sin viaje y <b>por debajo de 50 MB por persona y día</b> los días de viaje (antes ~500 MB). El ciclo termina el 2-dic; el total del ciclo no baja de lo ya gastado, pero no debe seguir subiendo. Si algún día pasa de 100 MB sin que nadie esté de viaje, avísame con la fecha.',
  'Lo primero que cambiaría el número: abre la app en el móvil 5 minutos sin tocar y mira en Usage a la mañana siguiente; debe verse un día casi plano.',
  '<b>Decisión pendiente tuya:</b> quitar `originalRoute` de la ruta guardada. Recortaría a la mitad cada bajada o subida del viaje (49 KB → ~25 KB en Lanzarote, ~160 KB → ~80 KB en Roma), pero toca el modelo de datos y el servidor: dime si lo hago en otra tanda.',
  'El servidor de tu PC (la API en 8787) ya no puede gastar de tu cuota con tareas programadas, pero SÍ usa la clave de producción si abres la app local con tu cuenta real; el contador de la consola avisa en rojo si pasa de límite.',
]
const noVerificado = [
  'Si la 0077, la 0078 y la 0087 están aplicadas en producción (se ve con el SQL de «PARA ERIC»).',
  'Los KB de las llamadas /api/* desde el móvil son supuestos (el móvil solo mide cuántas veces pregunta); los del servidor sí se midieron con un Supabase de mentira.',
  'No se puede demostrar en local el reparto exacto de los 10 GB entre las causas: es una hipótesis razonada con las medidas.',
  'Fallos que no son de esta tanda: pruebaTanda10N10_avisos (3), pruebaFase6y4_perfil (3), pruebaTanda6z6b (1), pruebaTanda10S2 (1) (no se comparó contra un checkout limpio).',
]
const html = `<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>REPASO V36 · la fuga de datos de Supabase</title><style>body{font:15px/1.5 system-ui,sans-serif;max-width:1100px;margin:0 auto;padding:16px;color:#1C2230}table{border-collapse:collapse;width:100%;font-size:13.5px}th,td{border:1px solid #ddd;padding:6px 8px;text-align:left;vertical-align:top}th{background:#f3ecd9}.eric{background:#fff8e6;border:1.5px solid #d8be84;border-radius:12px;padding:8px 18px}code{background:#f3ecd9;padding:1px 4px;border-radius:4px}</style>
<h1>V36 · La fuga de datos de Supabase</h1>
<h2>Qué era la fuga, en palabras sencillas</h2>${li(fuga)}
<h2>Antes y después</h2>${antesDespues}
<h2>Lista de comprobación de esta tanda</h2>${li(lista)}
<h2 class="eric">PARA ERIC</h2><div class="eric">${ol(paraEric)}</div>
<h2>Lo que no se pudo verificar</h2>${li(noVerificado)}
<h2>Los inventarios completos</h2><p>Ver <code>docs/dias/V36_INVENTARIO_CLIENTE.md</code> y <code>docs/dias/V36_INVENTARIO_SERVIDOR.md</code> (tabla de cada consulta: archivo, cada cuánto, KB y suma al día).</p>
${leer('docs/dias/V36_INVENTARIO_SERVIDOR.md') ? '' : ''}
</html>`
fs.writeFileSync('docs/dias/REPASO_V36.html', html)
console.log('REPASO_V36.html escrito')
