// Genera docs/dias/REPASO_V28c.html: node scripts/destino/generarRepasoV28c.mjs
import fs from 'node:fs'
const img = (n, ancho) => (fs.existsSync(`docs/dias/V28_capturas/${n}.jpg`) ? `<img alt="${n}" src="data:image/jpeg;base64,${fs.readFileSync(`docs/dias/V28_capturas/${n}.jpg`).toString('base64')}" style="max-width:${ancho}px;border-radius:12px">` : 'sin captura')
const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Repaso de la tanda V28c · El trozo en su círculo</title>
<style>:root{--bg:#FBF6EC;--tx:#1C2230}@media (prefers-color-scheme:dark){:root{--bg:#1C2230;--tx:#FFFDF8}}body{margin:0;padding:16px;background:var(--bg);color:var(--tx);font:16px/1.5 system-ui,sans-serif;max-width:860px}h1{font-size:24px}h2{font-size:19px;margin-top:26px}label{display:block;margin:6px 0}code{font-size:13px}</style></head><body>
<h1>V28c · La baldosa de cada sitio, entera, derecha y grande</h1>
<p>Probado con <code>pruebaV28</code> (53 comprobaciones, 0 fallos), <code>pruebaV9</code>, <code>pruebaJutrip</code> y las de logros en 0.</p>
<h2>Qué estaba mal</h2>
<p>El recorte de la V28 era la «porción de pizza» entera, <b>del centro al borde</b>: la baldosa se dibuja hasta el centro y la medalla crema va pintada encima, así que el círculo enseñaba medio trozo, con el crema del centro, pequeño y en diagonal.</p>
<h2>Qué hace ahora</h2>
<ul><li>Solo la baldosa de color de ese sitio, <b>desde el borde de la medalla (o del octógono de la estrella) hacia fuera</b>: nada del centro crema ni de los vecinos.</li>
<li><b>Derecha:</b> cada baldosa gira para que su lado de fuera quede arriba (las 8 se ven iguales, como un escudito). <b>El icono va derecho</b> (los Imprescindibles y las 4 joyas llevan un icono por sitio y se dibujan aparte).</li>
<li><b>Grande:</b> llena el círculo con un margen del 4 % (los cuadrados de las 4 joyas, a ras). Sin ganar: la misma baldosa en gris.</li>
<li>La baldosa que se ilumina al tocar la tarjeta es la misma (sin el pedazo del centro). Las de burbujas y las de una pieza, como estaban.</li>
<li>La prueba comprueba las 18: ningún punto dentro del centro, entera dentro del círculo, al menos el 70 % del ancho, derecha, y el icono presente.</li></ul>
<h2>Los Imprescindibles de Roma (móvil)</h2>${img('coleccion_baldosas_enteras', 260)}
<h2>Las 18 insignias: todas sus baldosas en su círculo, ganadas (arriba) y sin ganar</h2>${img('baldosas_18', 780)}
<h2>Lista de comprobación de ESTA tanda</h2>
<label><input type="checkbox"> «Ver la colección»: cada círculo enseña su baldosa entera, derecha, grande y con su icono</label>
<label><input type="checkbox"> Sin ganar: la misma baldosa en gris</label>
<label><input type="checkbox"> Tocar una tarjeta: se ilumina solo esa baldosa en la insignia grande</label>
</body></html>`
fs.writeFileSync('docs/dias/REPASO_V28c.html', html)
console.log('docs/dias/REPASO_V28c.html', Math.round(html.length / 1024), 'KB')
