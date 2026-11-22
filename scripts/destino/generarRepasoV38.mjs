// REPASO de la Tanda V38: arreglos de DÍAS, «Crear mi propio día» y Explorar. Capturas de antes y después (iPhone), tu lista de comprobación, lo del punto 5 en palabras sencillas y PARA ERIC.
//   node scripts/destino/generarRepasoV38.mjs
import fs from 'node:fs'
const D = 'docs/dias/V38_capturas'
const img = (f) => (fs.existsSync(`${D}/${f}.jpg`) ? `<img src="V38_capturas/${f}.jpg" alt="${f}">` : '<i>(sin captura)</i>')
const li = (x) => `<ul>${x.map((i) => `<li>${i}</li>`).join('')}</ul>`
const FILAS = [
  ['1', 'Aviso de cerrado (hoja de fechas)', 'Decía «Hemos preparado tu ruta para que disfrutes de todo lo que está abierto…»: parecía que habíamos quitado los museos.', 'Dice lo que se ha hecho de verdad: «Los domingos cierran los Museos Vaticanos. Por eso los hemos puesto el sábado 5, para que los disfrutes con calma.» (el día real), o, si no cabe en ningún día: «Ese día los Museos Vaticanos están cerrados, así que no entran en tu ruta. Si cambias las fechas, te los ponemos.» Vale para todos los sitios y destinos.', ['titulo_fechas_antes', 'titulo_fechas_despues']],
  ['1b', 'Título «Hemos preparado tu viaje para estas fechas»', 'Se cortaba por debajo de la X en 320, 375 y 375×600.', 'Va en dos líneas, con hueco para la X: no choca en 320, 375, 390 ni 430.', []],
  ['2', 'DÍAS: el asa para mover', 'A la derecha, junto al «···».', 'A la izquierda, asomando sobre la franja de color de cada día, como antes de la V27.', ['dias_asa_antes', 'dias_asa_despues']],
  ['3a', '«Crear mi propio día»: el mapa', 'Se quedaba donde lo dejó el viaje anterior (Roma después de Lanzarote enseñaba Lanzarote).', 'Se abre siempre en el destino del viaje. Lo mismo en Explorar y en añadir parada (comparten mapa).', ['propio_mapa_lanzarote_antes', 'propio_mapa_lanzarote_despues']],
  ['3b', '«Crear mi propio día»: comida y cena', 'Ponía comida y cena solas.', 'No las pone (las añade quien quiera desde Explorar). Los días curados no cambian.', []],
  ['3c', 'Excursión de medio día', '«Vuelves a Roma a las 11:00. La tarde es para ti.»', '«…La tarde es para ti: añade los sitios que quieras con "Añadir lugares".»', []],
  ['4', 'Explorar: icono y color del filtro en el mapa', '«Playas y charcos» tenía su ola en el filtro pero en el mapa salía el edificio de monumento.', 'Cada punto lleva el icono y el color de su filtro (una sola fuente para el filtro y el mapa), en todos los destinos.', ['explorar_iconos_lanzarote_antes', 'explorar_iconos_lanzarote_despues']],
  ['4b', 'Sorpresas por reclamar', 'La X salía cortada arriba y muy sutil.', 'X entera, con contraste, en su sitio, y el título con hueco para ella.', ['sorpresas_antes', 'sorpresas_despues']],
  ['4b', 'Resumen del viaje: logros de viajero', 'Al tocar un logro de viajero no pasaba nada.', 'Se abre su ficha (la misma pieza que la pestaña Logros): dibujo, grupo, nombre y frase, «Conseguido el…» y [Compartir].', ['ficha_logro_viajero_antes', 'ficha_logro_viajero_despues']],
]
const filas = FILAS.map(([n, t, a, d, imgs]) => `<tr><td><b>${n}</b></td><td><b>${t}</b></td><td>${a}</td><td>${d}</td><td>${imgs.map(img).join('')}</td></tr>`)
const comprobacion = [
  'Crea un viaje de Roma de 4 días que incluya un domingo: la hoja de fechas dice a qué día se han pasado los Museos Vaticanos (y ese día están en la ruta).',
  'Crea un viaje de un solo día en domingo: dice que no entran y que, si cambias las fechas, te los ponemos.',
  'En un iPhone con la barra de Safari visible, abre la hoja de fechas: el título no choca con la X.',
  'DÍAS: las tres rayas están a la izquierda de cada día y arrastran.',
  'Abre un viaje de Roma después de uno de Lanzarote → «Crear mi propio día»: el mapa abre en Roma. Monta un día: no sale comida ni cena.',
  'Explorar Lanzarote → «Playas y charcos»: las olas azules también en el mapa. Mira Volcanes, Manrique y Miradores.',
  'Sorpresas por reclamar: la X se ve entera. Resumen del viaje: toca «Todos a bordo» y mira la ficha.',
]
const punto5 = [
  '<b>«Día 8» en el cuarto día.</b> Un día de «Crear mi propio día» se llama «Mi día en Roma», nunca «Día N». Donde sí sale «Día N · fecha» es en la hoja de sorpresas: ese número lo guardaba el servidor al registrar el viaje y no se recalculaba si cambiaban las fechas (de ahí un «Día 8» en un domingo 29). <b>Arreglado:</b> el número se calcula con las fechas del viaje de ahora; un título que sea solo «Día N» con un N que no es el del día ya no se enseña; un día propio sin nombre se llama «Tu día en {ciudad}». Si el «Día 8» lo viste en otra pantalla, dime cuál y lo sigo.',
  '<b>El Coliseo con «20 min».</b> No es un fallo de cálculo: la app solo deja ver un sitio POR DENTRO una vez en el viaje. Si el Coliseo ya está dentro en otro día, en el día propio pasa a «por fuera» y dura 20 min (por dentro son 90). <b>No lo he cambiado.</b> Propuesta: que la parada diga «Por fuera: ya lo ves por dentro el día N», o dejar elegir «verlo por dentro» ese día. Decides tú.',
  '<b>«Cena · Osteria dell\'Angelo · 62 min andando desde Coliseo».</b> La cena NO se elige cerca del alojamiento (nunca se mira). En los días curados la fija el día escrito, junto a donde acaba el día: medí 51 cenas y la peor está a 8 min de la última parada (ninguna pasa de 25). En el día propio la ponía el motor tras el Coliseo aunque el restaurante quedara lejos: de ahí el «62 min». Con el punto 3 (el día propio ya no lleva comida ni cena) no sale. No he puesto «cerca de tu alojamiento» porque no sería verdad.',
]
const html = `<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>REPASO V38 · días, crear mi día y explorar</title><style>body{font:15px/1.5 system-ui,sans-serif;max-width:1300px;margin:0 auto;padding:16px;color:#1C2230}table{border-collapse:collapse;width:100%;font-size:13px}th,td{border:1px solid #ddd;padding:6px 8px;text-align:left;vertical-align:top}th{background:#f3ecd9}img{max-width:200px;border:1px solid #ddd;border-radius:8px;margin:4px 6px 0 0}code{background:#f3ecd9;padding:1px 4px;border-radius:4px}.eric{background:#FFF7DC;border:1px solid #D8BE84;border-radius:10px;padding:4px 16px}</style>
<h1>V38 · Arreglos de DÍAS, «Crear mi propio día» y Explorar</h1>
<h2>Antes y después (capturas de iPhone)</h2><table><thead><tr><th>#</th><th>Qué</th><th>Antes</th><th>Después</th><th>Capturas (antes · después)</th></tr></thead><tbody>${filas.join('')}</tbody></table>
<h2>Lo que vi en las capturas (punto 5), en palabras sencillas</h2>${li(punto5)}
<h2>Tu lista de comprobación de esta tanda</h2>${li(comprobacion)}
<div class="eric"><h2>PARA ERIC</h2>${li([
  '<b>Reinicia el api-server para que recoja el cambio de «Crear mi propio día» sin comida ni cena y los avisos nuevos</b> (ya lo he reiniciado yo al final de la tanda).',
  '<b>La migración 0092 (la ruta original entre aparatos) sigue SIN APLICAR.</b> Pégala en el SQL editor de Supabase (<code>supabase/migrations/0092_route_original.sql</code>) y luego pasa <code>docs/dias/COMPROBAR_0092.sql</code>: debe salir una fila con <code>todo = true</code>.',
  '<b>Un hallazgo que NO es de esta tanda (te lo cuento por si lo has visto):</b> en las pruebas, si se pasa por DÍAS y luego se abre Explorar en Roma, los pines del mapa salen todos ocultos. Pasa también con el código de antes de la V38. En una pasada normal (crear viaje → Explorar) se ven bien. Si te pasa en el iPhone, dímelo y lo miramos en otra tanda.',
  '<b>«Ver mi sello»</b> del Resumen del viaje se queda tal cual (el del pasaporte).',
  'Los avisos de los viajes que ya existen no cambian solos: el texto se genera al crear la ruta. Los viajes nuevos ya salen con el aviso bueno.',
])}</div>
</html>`
fs.writeFileSync('docs/dias/REPASO_V38.html', html)
console.log('REPASO_V38.html escrito')
