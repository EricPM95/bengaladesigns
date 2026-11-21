// REPASO de la Tanda V36C (cada tarjeta, su animación): la tabla de las tarjetas, lo corregido, los candidatos que faltan y «sello o medalla» (para Eric).
//   node scripts/destino/generarRepasoV36C.mjs   (lee docs/dias/V36C_tabla.json, que escribe pruebaV36C)
import fs from 'node:fs'
const D = 'docs/dias/V36C_capturas'
const imgs = fs.existsSync(D) ? fs.readdirSync(D).filter((f) => /\.(jpg|png)$/.test(f)).sort() : []
const tabla = JSON.parse(fs.readFileSync('docs/dias/V36C_tabla.json', 'utf8'))
const li = (x) => `<ul>${x.map((i) => `<li>${i}</li>`).join('')}</ul>`
const coma = (x, d = 1) => x.toFixed(d).replace('.', ',')
const NOMBRE_TIPO = { sello: 'la pantalla de la medalla (el «sello» de ciudad de los logros)', coleccion: 'la pantalla de colección completa', emblema: 'la escena del sitio (emblema secreto)', final7: 'el final de las 7 maravillas', pais: 'el sellado del pasaporte de país nuevo', pedazos: 'el pedazo entrando en su círculo', patrimonio: 'la pantalla de patrimonio', viajero: 'la pantalla de logro de viajero', ademas: 'el resumen del día' }
const AHORA = {
  fuegos: 'La pieza de los fuegos (`Fuegos`) sola, sobre fondo oscuro: es el trozo de la escena del Coliseo donde estallan, no una escena propia.',
  resumen_dia: 'La pantalla `ResumenDia` de la app con tres logros de ejemplo.',
  resumen_viaje: 'La pantalla `ResumenViaje` de la app con un viaje de ejemplo (Roma).',
  primer_dia: 'La pantalla `PrimerDia` de la app.',
  apertura: 'La apertura de JUTRIP (la misma pieza que la app).',
  visto: 'Una pantalla de muestra con el botón [Visto] (el gesto): el [Visto] real vive dentro de la ficha de un sitio de DÍAS, que necesita un viaje entero.',
  aviso: 'Una pantalla de muestra con el botón «Llega un aviso» (el gesto): la campana real vive en la cabecera de la app.',
  tic: 'Solo el sonido (no tiene animación propia: suena dentro del resumen del día).',
  toque: 'Solo el sonido (no tiene animación propia: suena en [Visto] y en los latidos del emblema).',
  vuelo: 'Solo el sonido (el vuelo de lo ganado se ve al pasar de pantalla en cualquier logro).',
  sello: '<b>El sello que se estampa en la hoja del pasaporte</b>: la hoja de Italia de la app (`PasaporteScreen`) con un pasaporte de ejemplo; el sello de Roma cae y se estampa.',
}
const ANTES = { sello: '<b style="color:#A33A2A">La medalla de bronce de Roma («Tu sello de Roma · Bronce · Primeros pasos en Roma»): la pantalla de logros, no el pasaporte.</b>' }
const filas = tabla.filas.map((f) => {
  const mal = f.id === 'sello'
  const ahora = AHORA[f.id] ?? `${NOMBRE_TIPO[f.tipos?.[0]] ?? 'su pantalla'}${f.grado ? ` (${f.grado})` : ''}, con la pieza de la app (plan de pantallas de la app: ${JSON.stringify(f.tipos)})`
  const antes = ANTES[f.id] ?? 'Lo mismo que ahora'
  const cand = Object.entries(f.candidatos).map(([id, l]) => `${id}: ${l.split('').join(' ')}`).join(' · ') || '—'
  return `<tr${mal ? ' style="background:#FDECEA"' : ''}><td><b>${f.nombre}</b><br><code>${f.id}</code></td><td>${antes}</td><td>${ahora}</td><td>${coma(f.dura)} s</td><td>${f.suena.join(', ')}<br><small>${f.notas.join(' · ')}</small></td><td>${cand}</td><td>${mal ? '<b>MAL → corregida</b>' : 'bien'}</td></tr>`
})
const tablaHtml = `<table><thead><tr><th>Tarjeta</th><th>Qué enseñaba</th><th>Qué enseña ahora</th><th>Duración</th><th>Sonidos (partitura)</th><th>Candidatos</th><th></th></tr></thead><tbody>${filas.join('')}</tbody></table>`
const lista = [
  '<b>Eran 25 tarjetas</b> (las 24 de siempre y «Tu primer día», que se añadió en la V35B). Se revisaron una a una contra el plan de pantallas de la propia app (`planificar` y `sonidoDePantalla`) y contra la lista de la partitura, no contra nombres parecidos.',
  '<b>Solo estaba mal «Sello del pasaporte»:</b> montaba el momento «sello», que en la app es la MEDALLA (la pantalla «Tu sello de Roma · Bronce»), igual que «Medalla de bronce». Ahora monta la hoja del pasaporte de la app (`PasaporteScreen`) con un pasaporte de ejemplo y el sello de Roma que se estampa, y su partitura nueva (`sello_pasaporte`) cae con el golpe real (a los 2,05 s: el sello toca la hoja al 88 % de la animación) y dura lo que el sello (3,7 s, hasta el último anillo de tinta).',
  'El sello del pasaporte, en la app, <b>se estampa SIN sonido</b>: la partitura vieja «sello» no la usa ninguna pantalla (la medalla usa «medalla_bronce»…). Lo dejo así (esta tanda no cambia la app) y te lo digo por si quieres que suene.',
  '<b>Candidatos del «clic»: A, B, C y E.</b> La D no se perdió: se descartó al prepararlos. El script de candidatos (`prepararCandidatos.mjs`) tiene definido el D del clic («UI Button Analog Vintage Double Click», un doble clic de interfaz) y descarta solos los candidatos que no pasan la forma de onda, la duración (el clic tiene que durar entre 0,03 y 0,3 s) o el peso; un doble clic es lo más probable que se pasara de duración. El motivo exacto no se guardó (el script solo lo escribe en pantalla). Para recuperarla habría que volver a correr el script (baja de Sonniss) y mirar por qué se descartó: dímelo si la quieres.',
  'Lo mismo pasa en otros sonidos: faltan letras en `vuelo` (A), `emblema` (A), `coleccion`, `maravilla`, `medalla_oro` y `medalla_diamante` (E): son candidatos descartados al prepararlos, no un fallo de las pantallas.',
  'Las tarjetas de «solo sonido» (tic, toque, vuelo) y las de gesto ([Visto], campanita) no tienen animación propia y lo dicen; los fuegos son la pieza suelta de la escena del Coliseo. Ninguna enseña la animación de otra.',
]
const sello = [
  '<b>Cuántos textos de la app dicen «sello» queriendo decir medalla: unos 19</b> (más los de desarrollo, que no se ven).',
  '<b>Animaciones (2):</b> `pantallas.tsx`: «Tu sello de Roma, bronce» (etiqueta de la pantalla) y «TU SELLO DE ROMA · BRONCE» (el rótulo que viste).',
  '<b>Resumen del día y del viaje (2):</b> `textosResumen.ts`: «Tu sello sube a {grado}» y «Tu sello {de Roma}, en {grado}».',
  '<b>Página del destino y lista «Todos» (4):</b> `PaginaDeDestino.tsx`: título «Sellos de ciudad» y cada fila «Sello de Roma»; `todos/formato.ts`: «Sello de ciudad · {grado}»; el servidor (`server/logros/pantallas/ganados.js`): «Sello de Roma / del …» en la lista de lo ganado.',
  '<b>Logros de viajero (7 textos, `data/logros/viajero.json`):</b> el nivel «Primer sello» y las descripciones de «Consigue un sello de diamante…», «Consigue el sello de oro en 3 ciudades» y «…de diamante en 3 ciudades» (cada una con su texto corto).',
  '<b>Lista del pase y aviso del pase (3):</b> `disenoLista.ts` «Los sellos de Roma y del Vaticano» y «Consigue el sello de cada sitio que visitas»; `avisoPaseTextos.ts` «consigues el sello de cada sitio que visitas». (`listaDelPase.ts` ya dice «Sellos y medallas».)',
  '<b>Ambiguo (1):</b> `EliminarViajeHost.tsx` «Tus logros, sellos y EXP».',
  '<b>Los que DEBEN seguir siendo «sello» (son los del pasaporte):</b> `PasaporteScreen`, `TarjetaPasaporte`, `AntesDelViaje` («Tu sello en el pasaporte de Roma»), `ResumenViaje` («Estampar mi sello» / «Ver mi sello»), `HoyAntesV2` («llena tu pasaporte de sellos»), «Se va llenando de sellos con cada viaje» (lista del pase).',
  '<b>El nombre interno sí confundió:</b> en el código `sello` es la medalla (el momento «sello», la partitura «sello», `Sello.tsx`, el logro `sello` de la base de datos, `ciudades_sello`) y el sello del pasaporte se llama `selloEstampado`/`sellado`. Al montar el estudio, la tarjeta «Sello del pasaporte» se hizo con el momento «sello» y por eso enseñaba la medalla. Los nombres internos no se tocan (cambiarlos obliga a migrar datos): si decides «medalla», solo se cambian los textos de arriba.',
  '<b>Para que decidas:</b> si todos pasan a «medalla», son esos ~19 textos y el nombre «Sello de ciudad» de la lista y de la página del destino; los del pasaporte se quedan.',
]
const html = `<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>REPASO V36C · cada tarjeta, su animación</title><style>body{font:15px/1.5 system-ui,sans-serif;max-width:1300px;margin:0 auto;padding:16px;color:#1C2230}table{border-collapse:collapse;width:100%;font-size:12.5px}th,td{border:1px solid #ddd;padding:5px 7px;text-align:left;vertical-align:top}th{background:#f3ecd9}img{max-width:420px;border:1px solid #ddd;border-radius:8px}figure{display:inline-block;margin:8px 12px 8px 0}figcaption{font-size:12px;color:#667}code{background:#f3ecd9;padding:1px 4px;border-radius:4px}small{color:#667}</style>
<h1>V36C · Cada tarjeta del estudio, su animación</h1>
<h2>Lo que se encontró y se arregló</h2>${li(lista)}
<h2>Las ${tabla.filas.length} tarjetas</h2>${tablaHtml}
<h2>Capturas</h2>${imgs.map((f) => `<figure><img src="V36C_capturas/${f}" alt="${f}"><figcaption>${f}</figcaption></figure>`).join('')}
<h2>«Sello» o «Medalla» (para Eric: no se ha cambiado nada)</h2>${li(sello)}
</html>`
fs.writeFileSync('docs/dias/REPASO_V36C.html', html)
fs.writeFileSync('docs/dias/V36C_SELLO_O_MEDALLA.md', ['# V36C · «Sello» o «Medalla» (para que Eric decida; no se ha cambiado nada)', '', ...sello.map((x) => `- ${x.replace(/<\/?b>/g, '**').replace(/<[^>]+>/g, '')}`), ''].join('\n'))
console.log(`REPASO_V36C.html escrito (${tabla.filas.length} tarjetas, ${imgs.length} capturas)`)
