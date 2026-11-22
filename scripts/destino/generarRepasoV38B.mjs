// REPASO de la Tanda V38B: pedazos uno detrás de otro, emblemas iguales por destino y dos detalles.
import fs from 'node:fs'
const D = 'docs/dias/V38B_capturas'
const img = (f) => (fs.existsSync(`${D}/${f}.jpg`) ? `<img src="V38B_capturas/${f}.jpg" alt="${f}">` : '<i>(sin captura)</i>')
const li = (x) => `<ul>${x.map((i) => `<li>${i}</li>`).join('')}</ul>`
const filas = [
  ['1', 'Pedazos con varias colecciones', 'Cada insignia empezaba 1,6 s después de la anterior y el pedazo sonaba una sola vez.', 'Una detrás de otra: la siguiente empieza cuando la anterior ha acabado del todo (animación 2,0 s y sonido 3,3 s) más 0,2 s: hueco de 2,6 s. Cada insignia hace sonar su pedazo; la 2.ª +1 semitono y la 3.ª +2 (tope +4). [Seguir] sale al acabar la última. El hueco sale de <code>tiempos.ts</code>, no de un 1,6 fijo, y sigue al sonido que Eric guarde en el estudio.', ['pedazo_despues', 'pedazo_dos_despues', 'pedazo_tres_despues']],
  ['2', 'Fontana de Trevi', 'Rompía la regla: dim 8,1 · fl 8,45 · x 9,9…', 'Como el resto de Roma: dim 7,6 · fl 8 · x por defecto. Su dibujo (moneda, brillo y apagado) se adelantó 0,45 s para seguir. Fotogramas a los 4,5 · 6,8 · 7,7 · 8,4 y 9,8 s:', ['fontana_f1_baja', 'fontana_f2_brilla', 'fontana_f3_antes_del_estallido', 'fontana_f4_estalla', 'fontana_f5_emblema']],
  ['2b', 'Estudio: emblemas', 'Una tarjeta por emblema (Panteón, Coliseo, Escena de Roma, Escena de Lanzarote).', 'Tres: «Emblema de Roma», «Emblema de Lanzarote» y «Coliseo». Con «Ver otra escena» miras cualquiera de las 13 de Roma o las 11 de Lanzarote dentro de su tarjeta, sin guardar aparte.', []],
  ['3a', 'Coliseo «por fuera» en un día propio', 'Salía «por fuera» sin decir por qué.', 'Dice «Por fuera · ya lo ves por dentro el día 2» (el día real, en la tarjeta y en la ficha). Si el viaje no lo ve por dentro ningún otro día, sale por dentro. Vale para cualquier sitio que pasa a verse por fuera por esa regla.', []],
  ['3b', 'Pines de Explorar en Roma tras pasar por DÍAS', 'Todos los pines salían ocultos.', 'Era un fallo real, un viajero podía verlo (DÍAS → Explorar). Un pintado del mapa compartido llegaba después de desmontarse la pantalla y dejaba pines «zombi» ocultos, y la pantalla viva esperaba un aviso del mapa que no volvía. Arreglado en <code>StopsMapView.tsx</code> (pintado cancelable; los pines no esperan al estilo del mapa).', ['dias_explorar_despues']],
]
const tabla = filas.map(([n, t, a, d, i]) => `<tr><td><b>${n}</b></td><td><b>${t}</b></td><td>${a}</td><td>${d}</td><td>${i.map(img).join('')}</td></tr>`).join('')
const comprob = [
  'Estudio de sonidos → «Pedazos nuevos (tres colecciones a la vez)»: suenan tres pedazos, uno por insignia, cada uno un poco más agudo, sin pisarse; [Seguir] sale al final.',
  'Estudio → «Emblema de Roma» → «Ver otra escena» → Fontana de Trevi: el dibujo acaba bien y el golpe cae cuando estalla la luz.',
  'Estudio → «Emblema de Lanzarote» y «Coliseo»: cada una con su tarjeta.',
  'Roma de 6 días con un día propio con el Coliseo en el día 4: la parada dice «Por fuera · ya lo ves por dentro el día N».',
  'Roma → DÍAS → Explorar → Atracciones: se ven los pines (también tras estar un rato en DÍAS).',
]
const html = `<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>REPASO V38B</title><style>body{font:15px/1.5 system-ui,sans-serif;max-width:1300px;margin:0 auto;padding:16px;color:#1C2230}table{border-collapse:collapse;width:100%;font-size:13px}th,td{border:1px solid #ddd;padding:6px 8px;text-align:left;vertical-align:top}th{background:#f3ecd9}img{max-width:190px;border:1px solid #ddd;border-radius:8px;margin:4px 6px 0 0}code{background:#f3ecd9;padding:1px 4px;border-radius:4px}.eric{background:#FFF7DC;border:1px solid #D8BE84;border-radius:10px;padding:4px 16px}</style>
<h1>V38B · Pedazos uno detrás de otro, emblemas iguales por destino</h1>
<p>La migración <b>0092 ya está aplicada</b> (Eric pasó el COMPROBAR con todo en true).</p>
<table><thead><tr><th>#</th><th>Qué</th><th>Antes</th><th>Después</th><th>Capturas</th></tr></thead><tbody>${tabla}</tbody></table>
<h2>Tu lista de comprobación de esta tanda</h2>${li(comprob)}
<div class="eric"><h2>PARA ERIC</h2>${li([
  '<b>Tu guardado del estudio no se ha tocado.</b> Si guardaste algo en «Escena de Roma» o «Escena de Lanzarote», ahora se enseña en «Emblema de Roma» / «Emblema de Lanzarote» (si esas no tenían guardado propio); el guardado viejo sigue intacto en tu navegador.',
  'El sonido de pedazo que guardes en el estudio se aplicará cuando Code lo aplique; el hueco entre insignias ya lo sigue solo.',
  'Los avisos de viajes ya creados no cambian; los viajes nuevos con un sitio «por fuera» por verse por dentro otro día ya traen el texto nuevo.',
  'Reiniciado el api-server al final de la tanda.',
])}</div></html>`
fs.writeFileSync('docs/dias/REPASO_V38B.html', html)
console.log('ok')
