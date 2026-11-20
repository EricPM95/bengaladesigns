// Genera docs/dias/REPASO_V28b.html: node scripts/destino/generarRepasoV28b.mjs
import fs from 'node:fs'
const img = (n) => (fs.existsSync(`docs/dias/V28b_capturas/${n}.jpg`) ? `<figure style="display:inline-block;margin:8px 10px 8px 0;vertical-align:top"><img alt="${n}" src="data:image/jpeg;base64,${fs.readFileSync(`docs/dias/V28b_capturas/${n}.jpg`).toString('base64')}" style="max-width:230px;border-radius:12px"><figcaption style="font-size:12.5px;opacity:.7;max-width:230px">${n.replace(/_/g, ' ')}</figcaption></figure>` : 'sin captura')
const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Repaso de la tanda V28b · Cuéntanos solo en el viaje</title>
<style>:root{--bg:#FBF6EC;--tx:#1C2230}@media (prefers-color-scheme:dark){:root{--bg:#1C2230;--tx:#FFFDF8}}body{margin:0;padding:16px;background:var(--bg);color:var(--tx);font:16px/1.5 system-ui,sans-serif;max-width:800px}h1{font-size:24px}h2{font-size:19px;margin-top:26px}label{display:block;margin:6px 0}code{font-size:13px}</style></head><body>
<h1>V28b · «Cuéntanos» solo donde salen la cámara y el trofeo</h1>
<p>Probado con <code>pruebaV28b</code> (20 comprobaciones, 0 fallos), <code>pruebaV20</code> (56, 0; cambié dos comprobaciones que pedían el botón sin viaje: ahora piden lo contrario) y <code>pruebaJutrip</code>.</p>
<h2>Qué cambia</h2>
<ul><li>El botón flotante (el triángulo de aviso) ya no se monta en toda la app: está en <code>RouteScreen</code>, justo después de la cámara y del trofeo, encima de los dos. Sale en RUTA, DÍAS, EXPLORAR, RESERVAS y HOY, en todos los destinos y en todas las fases del viaje.</li>
<li>No sale al abrir la app, ni en el inicio, Mis viajes, el Perfil, el login, Crear viaje, la página del destino ni el pasaporte. Con una hoja abierta se esconde debajo igual que los otros dos.</li>
<li>La hoja «¿Qué quieres contarnos?» sigue montada en App: «¿Algún dato mal?» de la ficha y «Proponer un sitio» la abren como antes.</li>
<li>El reloj de 400 ms vive dentro del botón: solo corre mientras el botón está en pantalla.</li></ul>
${img('inicio_sin_boton')}${img('ruta_con_tres_botones')}
<h2>Lista de comprobación de ESTA tanda</h2>
<label><input type="checkbox"> Al abrir la app y en el inicio no sale el triángulo</label>
<label><input type="checkbox"> Dentro del viaje salen los tres botones, el triángulo arriba</label>
<label><input type="checkbox"> «¿Algún dato mal?» de una ficha abre la hoja</label>
</body></html>`
fs.writeFileSync('docs/dias/REPASO_V28b.html', html)
console.log('docs/dias/REPASO_V28b.html', Math.round(html.length / 1024), 'KB')
