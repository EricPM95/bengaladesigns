// Genera docs/dias/REPASO_V3.html (con las capturas de móvil de docs/dias/V3_capturas/ incrustadas). Se corre después de pruebaV3:
//   node scripts/destino/generarRepasoV3.mjs
import fs from 'node:fs'

const CAP = 'docs/dias/V3_capturas'
const img = (f, pie) => {
  const p = `${CAP}/${f}`
  if (!fs.existsSync(p)) return ''
  return `<figure><img alt="${pie}" src="data:image/jpeg;base64,${fs.readFileSync(p).toString('base64')}"><figcaption>${pie}</figcaption></figure>`
}
const fila = (...x) => `<div class="fila">${x.join('')}</div>`
const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Repaso de la tanda V3 · Escenas de Lanzarote y momentos de uno en uno</title>
<style>:root{--bg:#FBF6EC;--tx:#1C2230}@media (prefers-color-scheme:dark){:root{--bg:#1C2230;--tx:#FFFDF8}}body{margin:0;padding:16px;background:var(--bg);color:var(--tx);font:15px/1.5 system-ui,sans-serif;max-width:640px;margin-inline:auto}h1{font:400 28px/1.1 Georgia,serif}h2{font:400 20px/1.2 Georgia,serif;margin-top:26px}label{display:block;padding:7px 0}code{font-size:12.5px}.fila{display:flex;gap:8px;overflow-x:auto;padding:6px 0}figure{margin:0;flex:none;width:170px}img{width:170px;border-radius:12px;display:block}figcaption{font-size:12px;opacity:.75;padding-top:4px}</style></head><body>
<h1>Escenas de Lanzarote y momentos de uno en uno</h1>
<p>Probado con <code>pruebaV3</code> (nueva), <code>pruebaJutrip</code>, las de logros de Roma y Lanzarote, las pantallas 8b y 8c y la muestra de 60 de Roma (idéntica). Ninguna prueba toca el Supabase de producción.</p>

<h2>1. Las 11 escenas de Lanzarote</h2>
<p>Una por emblema, tal cual Design (<code>Emblemas Lanza Cine</code>): frase de suspense → el sitio dibujándose con sus dos frases → el emblema con su nombre y su línea. La primera vez, con la frase de suspense de Design; al tocar uno guardado, directo al sitio. Cada escena se baja solo al abrirla.</p>
${fila(img('01_timanfaya_a_mitad.jpg', 'Timanfaya, a mitad'), img('01_timanfaya_final.jpg', 'Timanfaya, al final'), img('02_jameos_a_mitad.jpg', 'Jameos, a mitad'), img('02_jameos_final.jpg', 'Jameos, al final'))}
${fila(img('08_la_graciosa_a_mitad.jpg', 'La Graciosa, a mitad'), img('08_la_graciosa_final.jpg', 'La Graciosa, al final'))}

<h2>2. Los momentos, de uno en uno</h2>
<ul>
<li>Una sola fila para todo lo que ocupa la pantalla: sorpresas, resumen del día, subida de nivel o de rango, «Hoy empiezas…», resumen del viaje y hoja de logros. Nunca dos a la vez; al cerrar uno sale el siguiente.</li>
<li><b>La «+EXP» ya no es una pantalla aparte:</b> va como una línea pequeña («+405 EXP») dentro de la primera pantalla de las sorpresas. Si no hay sorpresas, queda el cartel pequeño de 4 s.</li>
<li><b>La subida de nivel o de rango</b> sale solo si suben, justo después, con su ✕.</li>
<li><b>El resumen del día ya no sale tras cada foto.</b> Sale una vez al final del día: al marcar o saltar la última parada o, si el día acaba sin marcarla, la primera vez que abres la app esa noche (desde las 21 h) o al día siguiente.</li>
<li>Los pedazos de una misma colección salen juntos; cada colección, su pantalla. Orden: lo del sitio (pedazo, emblema) y luego lo general (colección completa, sello, reto).</li>
</ul>
${fila(img('fila_1_pedazos_con_exp.jpg', 'Los 2 pedazos, con su +EXP'), img('fila_2_nivel.jpg', 'Después, la subida de nivel (con ✕)'), img('resumen_del_dia_al_saltar.jpg', 'El resumen del día, al saltar la última parada'))}

<h2>Lista de comprobación de ESTA tanda</h2>
<label><input type="checkbox"> En Lanzarote, ganar un emblema (p. ej. Timanfaya) la primera vez: sale la frase de suspense y luego la escena entera, con su nombre y su línea</label>
<label><input type="checkbox"> Tocar ese emblema ya guardado (hoja de logros): va directo a la escena</label>
<label><input type="checkbox"> Con una foto que da 2 pedazos de la misma colección: una pantalla, con «+N EXP» abajo, y ninguna más después (sin resumen del día)</label>
<label><input type="checkbox"> Si esa foto sube de nivel: la subida de nivel sale justo después, con su ✕</label>
<label><input type="checkbox"> Saltar la última parada del día: sale el resumen del día una sola vez</label>
<label><input type="checkbox"> Un día que acaba sin marcar la última parada: al abrir la app esa noche o al día siguiente sale el resumen, una sola vez</label>
<label><input type="checkbox"> Nunca dos pantallas a la vez en todo el viaje</label>
</body></html>`
fs.writeFileSync('docs/dias/REPASO_V3.html', html)
console.log(`REPASO_V3.html: ${Math.round(html.length / 1024)} kB`)
