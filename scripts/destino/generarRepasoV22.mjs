// Genera docs/dias/REPASO_V22.html (después de pruebaV22, que saca las capturas en docs/dias/V22_capturas): node scripts/destino/generarRepasoV22.mjs
import fs from 'node:fs'

const img = (n) => (fs.existsSync(`docs/dias/V22_capturas/${n}.jpg`) ? `data:image/jpeg;base64,${fs.readFileSync(`docs/dias/V22_capturas/${n}.jpg`).toString('base64')}` : null)
const fig = (n, pie) => `<figure>${img(n) ? `<img alt="${pie}" src="${img(n)}" style="max-width:230px;border-radius:12px">` : '<div>sin captura</div>'}<figcaption>${pie}</figcaption></figure>`
const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Repaso de la tanda V22 · Seguro y eSIM</title>
<style>:root{--bg:#FBF6EC;--tx:#1C2230}@media (prefers-color-scheme:dark){:root{--bg:#1C2230;--tx:#FFFDF8}}body{margin:0;padding:16px;background:var(--bg);color:var(--tx);font:16px/1.5 system-ui,sans-serif;max-width:800px}h1{font-size:24px}h2{font-size:19px;margin-top:28px}code{font-size:13px}label{display:block;margin:6px 0}figure{display:inline-block;margin:8px 10px 8px 0;vertical-align:top}figcaption{font-size:12.5px;opacity:.7;max-width:230px}</style></head><body>
<h1>El seguro de viaje y la eSIM en «X de Y listo» (V22)</h1>
<p>Probado con <code>pruebaV22</code> (nueva, 40 comprobaciones), <code>pruebaJutrip</code> y las de RESERVAS (las que contaban las fichas se han puesto al día: ahora son «x de 4»).</p>

<h2>1. El seguro de viaje</h2>
<ul><li>La tarjeta clara de arriba de RESERVAS lleva una ficha más, <b>«Seguro de viaje»</b>, <b>siempre</b> (con pase y sin pase), <b>al final</b> (después de las de siempre). Cuenta en «X de Y»: lo que antes era «0 de 3 listo» ahora es «0 de 4 listo».</li>
<li><b>Al tocarla</b> baja a la tarjeta del seguro en «Útil para el viaje» y la abre (la hoja «Añádelo a tu viaje»), como las demás fichas.</li>
<li><b>Queda en verde con ✓</b> si lo has comprado con nuestro enlace y lo has añadido, o si tocas <b>«Ya tengo seguro»</b> (nuevo, bajo [Comprar] y [Añadir]): solo pregunta «¿Cuál?», opcional, sin precio. Su tarjeta dice «Lo tienes · El de mi tarjeta».</li></ul>
${fig('seguro_ya_tengo', 'Ya tengo seguro: ficha en verde')}

<h2>2. La eSIM, solo si hace falta</h2>
<ul><li><b>La regla</b> (<code>src/lib/esimRegla.ts</code>; la lista de países, en <code>data/esim/roaming.json</code>, para cambiarla sin tocar el código): <b>no hace falta</b> si el origen y el destino son el mismo país (Madrid → Lanzarote) o si los dos están en la UE o el EEE («roaming como en casa»: España → Italia, Alemania → Lanzarote); <b>sí hace falta</b> en todo lo demás (México → Roma, Argentina → Lanzarote, Estados Unidos → Roma) y también <b>Reino Unido → UE</b> (el Reino Unido no está en la lista). Con varios países de destino se mira cada uno por separado.</li>
<li><b>El origen</b> es el país de la ciudad de salida del formulario (<code>answers.originPlace</code>). <b>Si no hay, la eSIM sale como hoy, sin contar en «X de Y» y sin dar nada por hecho.</b> (No hay un «país de la cuenta» guardado en la app, así que ese segundo respaldo no existe hoy: si lo quieres, hay que pedirlo en el perfil.)</li>
<li><b>Si hace falta:</b> ficha «eSIM» en «X de Y» (una por país que la necesite) y, en verde con ✓, cuando la ha comprado o toca «Ya la tengo».</li>
<li><b>Si NO hace falta:</b> no sale la ficha, y en «Útil para el viaje» la tarjeta dice «No la necesitas: tu tarifa vale en Italia» (o el país que toque), en pequeño y sin botón de comprar.</li></ul>
${fig('ue_madrid_roma', 'Madrid → Roma (UE): sin ficha, «No la necesitas»')}${fig('fuera_ue_mexico_roma', 'México → Roma: con ficha de eSIM')}${fig('sin_origen', 'Sin origen: la eSIM como hoy, sin contar')}

<h2>3. Lo que no cambia</h2>
<p>Los enlaces de afiliado del seguro y de la eSIM, como están (<code>enlacesUtil</code>), con su «5 % dto.». El orden: las fichas de ahora y, al final, Seguro y eSIM.</p>

<h2>Lista de comprobación de ESTA tanda</h2>
<label><input type="checkbox"> RESERVAS: «Seguro de viaje» sale entre las fichas de arriba (con y sin pase) y cuenta en «X de Y»</label>
<label><input type="checkbox"> Tocar la ficha del seguro baja a su tarjeta y la abre</label>
<label><input type="checkbox"> «Ya tengo seguro» pide solo «¿Cuál?» y deja la ficha en verde</label>
<label><input type="checkbox"> Madrid → Roma y Madrid → Lanzarote: sin ficha de eSIM y la tarjeta dice «No la necesitas…»</label>
<label><input type="checkbox"> México → Roma y Londres → Roma: ficha de eSIM; «Ya la tengo» la pone en verde</label>
<label><input type="checkbox"> Un viaje sin ciudad de salida: la eSIM no cuenta</label>
</body></html>`
fs.writeFileSync('docs/dias/REPASO_V22.html', html)
console.log('docs/dias/REPASO_V22.html', Math.round(html.length / 1024), 'KB')
