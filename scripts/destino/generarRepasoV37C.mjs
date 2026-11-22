// REPASO de la Tanda V37C (la colección y el pedazo, bien en el estudio de sonidos): antes y después de cada tarjeta arreglada, lo que se encontró, tu lista de comprobación y PARA ERIC.
//   node scripts/destino/generarRepasoV37C.mjs   (lee las capturas y docs/dias/V37C_capturas/informe.json, que escribe pruebaV37C)
import fs from 'node:fs'
const D = 'docs/dias/V37C_capturas'
const inf = JSON.parse(fs.readFileSync(`${D}/informe.json`, 'utf8'))
const coma = (x, d = 2) => Number(x).toFixed(d).replace('.', ',')
const li = (x) => `<ul>${x.map((i) => `<li>${i}</li>`).join('')}</ul>`
const TARJETAS = [
  ['coleccion', 'Colección completa (Las 4 joyas de Roma)', 'Salía «0 DE 0 · COMPLETA» y la insignia sin lo que ya tenías: no volaba ningún pedazo.', 'Entra con 3 de 4; el 4.º vuela, encaja, se enciende el círculo y sale «4 DE 4 · COMPLETA» con su frase.'],
  ['coleccion_imprescindibles', 'Colección completa (Los imprescindibles) · NUEVA', 'No existía.', '7 de 8 → 8 de 8: «8 DE 8 · COMPLETA».'],
  ['pedazo', 'Pedazo nuevo (Los miradores)', 'Ponía «2 DE 3» desde el principio y la insignia sin nada de lo que ya tenías (el Janículo se llamaba «janiculo», un nombre que no está en los datos).', 'Entra con 1 de 3 («1 DE 3»); el Janículo vuela, encaja y sale «2 DE 3».'],
  ['pedazo_dos', 'Pedazos nuevos (dos colecciones a la vez) · NUEVA', 'No existía.', 'El Coliseo encaja en «Los imprescindibles» (1 → 2 de 8) y 1,6 s después en «La Roma antigua» (1 → 2 de 6).'],
]
const filas = TARJETAS.map(([id, nombre, antes, ahora]) => `<tr><td><b>${nombre}</b><br><code>${id}</code></td><td>${antes}<br>${fs.existsSync(`${D}/${id}_antes.jpg`) ? `<img src="V37C_capturas/${id}_antes.jpg" alt="${id} antes">` : ''}</td><td>${ahora}<br><img src="V37C_capturas/${id}_despues.jpg" alt="${id} después"></td></tr>`)
const t = inf.pedazoTiempos
const lista = [
  '<b>La causa:</b> la demo del estudio (`estudio.ts`) daba los momentos pero no el `estado` (lo que el viajero ya había visto en cada colección). En la app el estado lo pide el reproductor al servidor; en el estudio no había servidor ni cuenta, así que la insignia salía vacía.',
  '<b>El arreglo:</b> `src/lib/sonidos/ejemploEstado.ts` da un estado de ejemplo por tarjeta con las colecciones REALES de Roma (`data/logros/roma.json`). El visor lo pone al empezar la tarjeta y lo quita al parar. Vive SOLO en el estudio: no se pide a ninguna cuenta ni a la base de datos (la prueba comprueba que no sale ni una petición a Supabase ni a /api/logros).',
  '<b>Dos tarjetas nuevas</b> (la lista pasa de 25 a 27): «Colección completa (Los imprescindibles)» y «Pedazos nuevos (dos colecciones a la vez)». Las dos que ya había (<code>coleccion</code>, <code>pedazo</code>) conservan su id: lo que ya hayas elegido o guardado sigue valiendo.',
  '<b>Revisadas las demás tarjetas:</b> solo dependían del estado la colección, el pedazo y el resumen del día. El resumen del día pedía el estado a la cuenta de quien mira (salía «Tu día» sin ciudad y sin secretos); ahora sale «Tu día en Roma», con su medalla, «Roma aún esconde 13 secretos.» y «Te quedan 27 días para reclamar tus 2 sorpresas de Roma». El resto (medallas, emblemas, escenas, país, patrimonio, viajero, fuegos, primer día, resumen del viaje, apertura y el sello del pasaporte) no usan el estado y se ven llenas (la prueba recorre las 27).',
  `<b>Un descuadre real del sonido del pedazo (en la app también):</b> la pantalla «Pedazo nuevo» empezaba la insignia a los 0,6 s con un número escrito a mano, y el sonido (la partitura, que lee <code>RETRASO_DEL_PEDAZO</code> = 0,9 s) caía 0,3 s tarde: el clic llegaba cuando el pedazo ya había encajado. Ahora la pantalla usa la misma constante que el sonido: el pedazo encaja a los ${coma(t.encaja)} s y el clic cae a los ${coma(t.clic)} s; el color a los ${coma(t.color)} s y el brillo a los ${coma(t.brillo)} s. Es el ÚNICO cambio en el código de la app (una línea, para que sonido y animación vayan juntos); la insignia, el diseño y los textos no se tocan. La «Colección completa» ya iba bien (el golpe cae a los 3,0 s, cuando se cierra el círculo).`,
  '<b>Un detalle del reproductor:</b> con un estado puesto a mano (la demo de logros y el estudio) la insignia sale ya con lo que tenías, sin un primer fotograma vacío. Con la app de verdad no cambia nada: sigue pidiéndolo al servidor.',
]
const compr = [
  'Abre /admin/sonidos → «Colección completa»: el marco enseña la insignia de las 4 joyas con 3 trozos; el 4.º vuela y encaja; sale «4 DE 4 · COMPLETA» y suena el golpe al cerrarse el círculo.',
  'Prueba «Colección completa (Los imprescindibles)»: 7 de 8 → 8 de 8.',
  '«Pedazo que entra en su círculo»: «1 DE 3» → el Janículo encaja → «2 DE 3»; el clic suena justo cuando encaja.',
  '«Pedazos nuevos (dos colecciones a la vez)»: el Coliseo encaja en las dos, una detrás de otra.',
  '«Resumen del día»: sale «Tu día en Roma» con su medalla y la línea de secretos.',
  'Dale a [Ver con sonido] en cada una y elige tu candidato: ahora sí ves y oyes la animación de verdad.',
]
const html = `<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>REPASO V37C · la colección y el pedazo en el estudio</title><style>body{font:15px/1.5 system-ui,sans-serif;max-width:1300px;margin:0 auto;padding:16px;color:#1C2230}table{border-collapse:collapse;width:100%;font-size:13px}th,td{border:1px solid #ddd;padding:6px 8px;text-align:left;vertical-align:top}th{background:#f3ecd9}img{max-width:560px;width:100%;border:1px solid #ddd;border-radius:8px;margin-top:6px}code{background:#f3ecd9;padding:1px 4px;border-radius:4px}.eric{background:#FFF7DC;border:1px solid #D8BE84;border-radius:10px;padding:4px 16px}</style>
<h1>V37C · La colección y el pedazo, bien en el estudio de sonidos</h1>
<h2>Lo que se encontró y se arregló</h2>${li(lista)}
<h2>Antes y después de cada tarjeta</h2><table><thead><tr><th>Tarjeta</th><th>Antes</th><th>Después</th></tr></thead><tbody>${filas.join('')}</tbody></table>
<h2>Tu lista de comprobación de esta tanda</h2>${li(compr)}
<div class="eric"><h2>PARA ERIC</h2>${li([
  '<b>La migración 0092 (la ruta original entre aparatos) sigue SIN APLICAR.</b> Pégala en el SQL editor de Supabase (<code>supabase/migrations/0092_route_original.sql</code>) y luego pasa <code>docs/dias/COMPROBAR_0092.sql</code>: debe salir una fila con <code>todo = true</code>. Hasta entonces la app funciona (guarda sin esa columna) y la ruta original solo vive en el móvil donde se creó la ruta.',
  'Esta tanda no toca la base de datos ni pide ningún SQL nuevo.',
  'El estudio no suena igual que antes para el «Pedazo»: si ya habías elegido un sonido, sigue elegido; lo que cambia es que el clic y el brillo caen a la vez que la animación (0,3 s antes que antes).',
])}</div>
</html>`
fs.writeFileSync('docs/dias/REPASO_V37C.html', html)
console.log('REPASO_V37C.html escrito')
