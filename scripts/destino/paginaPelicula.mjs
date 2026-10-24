// Añade a docs/dias/GRATIS_REVISION.html el apartado «La película del pase» (Tanda 10I): el vídeo de la película entera y las capturas de lo que ve quien abre el pase.
// Las capturas salen de scripts/destino/pruebaTanda10I.mjs (pelicula_*.jpg), de grabarPelicula.mjs (pelicula_escena_N.jpg y pelicula_del_pase.webm) y de capturasGratis.mjs (HOY sin pase).
//   node scripts/destino/paginaPelicula.mjs
import fs from 'node:fs'
import path from 'node:path'

const DIR = 'docs/dias/capturas_jutrip'
const img = (f) => `data:image/jpeg;base64,${fs.readFileSync(path.join(DIR, f)).toString('base64')}`
const datos = fs.existsSync(path.join(DIR, 'pelicula_del_pase.json')) ? JSON.parse(fs.readFileSync(path.join(DIR, 'pelicula_del_pase.json'), 'utf8')) : null
const MARCA_INI = '<!-- pelicula-del-pase:inicio -->'
const MARCA_FIN = '<!-- pelicula-del-pase:fin -->'

const piezas = [
  ['pelicula_01_principio.jpg', 'La primera vez: la película entera', 'Se abre con el botón [Saltar] y la barra de arriba, que marca por qué escena va (7 tramos).'],
  ['pelicula_escena_1.jpg', 'Escena 1 · Tu vuelo y tu alojamiento', 'Tal cual el archivo de Design.'],
  ['pelicula_escena_2.jpg', 'Escena 2 · Tu compañero de viaje', ''],
  ['pelicula_escena_3.jpg', 'Escena 3 · Cada ciudad esconde secretos', ''],
  ['pelicula_escena_4.jpg', 'Escena 4 · Cada sitio que ves, suma', ''],
  ['pelicula_escena_5.jpg', 'Escena 5 · Rellena tu pasaporte', ''],
  ['pelicula_escena_6.jpg', 'Escena 6 · Tu viaje, guardado para siempre', 'La tarjeta del resumen lleva «Tu viaje a {Destino}» (el dato del destino); lo demás es el ejemplo de Roma.'],
  ['pelicula_02_final_sin_pase.jpg', 'El final, sin el pase', '«Se paga una vez y no caduca», [Elegir mi pase] y [Ver todo lo que incluye]. El ✕ cierra y vuelve a donde se estaba.'],
  ['pelicula_03_cuantos_1.jpg', '«¿Cuántos sois?» con 1 persona', 'Pase de 1 persona, 6,99 €.'],
  ['pelicula_04_cuantos_2.jpg', '«¿Cuántos sois?» con 2 personas', 'Pase Dúo 10,99 €, tachado 13,98 €, «Ahorras 2,99 €».'],
  ['pelicula_05_cuantos_4.jpg', '«¿Cuántos sois?» con 4 personas', 'Pase Grupo 19,96 €, tachado 27,96 €, «Ahorras 8,00 €». Los precios salen de data/pase/precios.json.'],
  ['pelicula_07_todo_incluye.jpg', '«Todo lo que incluye»', 'La misma lista que el final: los mismos nombres, las mismas líneas y el mismo orden.'],
  ['pelicula_08_final_con_pase.jpg', 'El final, con el pase comprado', '«✓ Tu Pase de Roma está activo», [Verla otra vez] y [Ver todo lo que incluye]. Sin precio y sin hoja de compra.'],
  ['pelicula_09_escena_6_lisboa.jpg', 'Con otro destino (Lisboa)', '«TU VIAJE A LISBOA» en la tarjeta; el nombre del final sale como «Pase de Lisboa».'],
  ['pelicula_10_hoy_sin_pase_lista.jpg', 'HOY sin pase: «Con el pase tendrás»', 'Los nombres, las líneas y los iconos son los de la lista del final de la película (se sacan del mismo sitio).'],
]
const faltan = piezas.filter(([f]) => !fs.existsSync(path.join(DIR, f))).map(([f]) => f)
if (faltan.length) throw new Error(`Faltan capturas: ${faltan.join(', ')}`)

const video = fs.existsSync(path.join(DIR, 'pelicula_del_pase.webm'))
  ? `<section class="video"><h2>La película entera</h2><p>De principio a fin, sin pase, a tamaño de móvil${datos ? ` (dura ${Math.floor(datos.duracion_s / 60)} min ${Math.round(datos.duracion_s % 60)} s hasta el final)` : ''}. Está en <code>capturas_jutrip/pelicula_del_pase.webm</code>.</p><video controls playsinline preload="metadata" src="capturas_jutrip/pelicula_del_pase.webm" style="width:100%;max-width:390px;border-radius:18px;background:#14161C"></video></section>`
  : ''
const figuras = piezas.map(([f, t, d]) => `<figure data-h10i><img src="${img(f)}" alt="${t}" loading="lazy"><figcaption><strong>${t}</strong>${d ? `<span>${d}</span>` : ''}</figcaption></figure>`).join('\n')
const bloque = `${MARCA_INI}
<h2 style="max-width:1100px;margin:28px auto 0;padding:0 16px;font:400 28px/1.1 'Instrument Serif',Georgia,serif">La película del pase</h2>
${video}
<main>
${figuras}
</main>
${MARCA_FIN}`

let html = fs.readFileSync('docs/dias/GRATIS_REVISION.html', 'utf8')
html = html.replace(new RegExp(`${MARCA_INI}[\\s\\S]*?${MARCA_FIN}\\n?`), '')
html = html.replace('</body>', `${bloque}\n</body>`)
if (!/\.video\{/.test(html)) html = html.replace('</style>', '.video{max-width:1100px;margin:0 auto;padding:12px 16px}.video p{margin:0 0 10px;color:rgba(28,34,48,.7)}\n</style>')
fs.writeFileSync('docs/dias/GRATIS_REVISION.html', html)
console.log(`GRATIS_REVISION.html: «La película del pase» con ${piezas.length} capturas${video ? ' y el vídeo' : ''}`)
