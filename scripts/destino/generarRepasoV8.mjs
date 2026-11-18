// Genera docs/dias/REPASO_V8.html (después de pruebaV8 y _v8_design_pantallas, que sacan las capturas en docs/dias/V8_capturas): node scripts/destino/generarRepasoV8.mjs
import fs from 'node:fs'

const img = (n) => (fs.existsSync(`docs/dias/V8_capturas/${n}.jpg`) ? `data:image/jpeg;base64,${fs.readFileSync(`docs/dias/V8_capturas/${n}.jpg`).toString('base64')}` : null)
const fig = (n, pie) => `<figure>${img(n) ? `<img alt="${pie}" src="${img(n)}">` : '<div class="no">sin captura</div>'}<figcaption>${pie}</figcaption></figure>`
const par = (app, design, pie) => `<div class="par">${fig(app, 'App · ' + pie)}${fig(design, 'Design · ' + pie)}</div>`
const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Repaso de la tanda V8 · Retoques del Perfil</title>
<style>:root{--bg:#FBF6EC;--tx:#1C2230;--bd:rgba(28,34,48,.15)}@media (prefers-color-scheme:dark){:root{--bg:#1C2230;--tx:#FFFDF8;--bd:rgba(255,253,248,.2)}}body{margin:0;padding:16px;background:var(--bg);color:var(--tx);font:15px/1.5 system-ui,sans-serif;max-width:860px;margin-inline:auto}h1{font:400 30px/1.1 Georgia,serif}h2{font:400 22px/1.2 Georgia,serif;margin-top:28px;border-top:1px solid var(--bd);padding-top:14px}figure{margin:8px 10px 8px 0;display:inline-block;vertical-align:top;max-width:300px}.par{display:flex;gap:12px;flex-wrap:wrap}img{max-width:100%;height:auto;border:1px solid var(--bd);border-radius:10px}figcaption{font-size:12px;opacity:.7}.no{padding:30px;border:1px dashed var(--bd)}label{display:block;margin:6px 0}code{font-size:12.5px;background:rgba(127,127,127,.15);padding:1px 4px;border-radius:4px}.nota{font-size:12.5px;opacity:.7}</style></head><body>
<h1>Retoques del Perfil (V8)</h1>
<p>Probado con <code>pruebaV8</code> (nueva), <code>pruebaJutrip</code> y las pruebas del Perfil. Las pruebas viejas que decían «Hecho», «[Abrir este viaje]» o «[Editar]» con texto se han puesto al día con el diseño nuevo. Ninguna prueba toca el Supabase de producción.</p>
<h2>Lo que cambia</h2>
<p><b>Regla de Eric, aire entre bloques:</b> entre el bloque del viajero y «Mis viajes» hay 40 px y entre «Mis viajes» y «Mi vitrina» otros 40 (Design deja 14); lo demás de la vitrina para abajo, 22.</p>
<p><b>El bloque del viajero</b>, en una tarjeta blanca: el avatar con su marco, «Hola, Alice», «Nivel 2 · Soñador», el título como distintivo pequeño con su chapa (sin la flecha de desplegable) y, dentro, la barra con «285 / 900» a la izquierda y «Te faltan 615 EXP para el nivel 3» a la derecha. Sin títulos ganados, no sale el distintivo. Al tocarlo, la hoja «Elige tu título» (cada título con su chapa, su línea y la marca del elegido); lo elegido queda guardado también al volver a abrir el Perfil.</p>
<p><b>«Mis viajes»:</b> el lápiz redondo junto al título (hace lo de «Editar»; en el modo editar pasa a una marca) y «Ver todos (3) ›». Las tarjetas: sin la etiqueta «Hecho» (el en curso y el próximo conservan la suya), la foto con el nombre y las fechas, la cámara arriba a la derecha y, debajo, «11 paradas · 5 fotos» con una flecha redonda pequeña. <b>Toda la tarjeta abre el viaje</b>, como el botón de antes: un viaje ya hecho, por dentro (su álbum o sus logros); los demás, en la app.</p>
<p><b>«Mi vitrina»:</b> el «+» pequeño de 38 px en el primer hueco libre; sin logros, hueco con borde de puntos, «+», hueco con borde de puntos.</p>
${par('perfil_con_titulo', 'design_01', 'El Perfil, entero')}
${par('hoja_titulos', 'design_02', 'Al tocar el título')}
${par('perfil_nivel_1', 'design_03', 'Nivel 1, sin título')}
<p class="nota"><b>Diferencias con Design:</b> las fotos y los números son los de la demo (Design pone fotos y números de muestra); el aire entre bloques es mayor a propósito. Con tres logros en la vitrina no hay hueco para el «+» (Design lo pone en el medio con dos piezas): sale en cuanto hay un hueco libre.</p>
<h2>Lista de comprobación de ESTA tanda</h2>
<label><input type="checkbox"> El Perfil abre con el bloque del viajero en una tarjeta blanca y con aire hasta «Mis viajes» y la vitrina</label>
<label><input type="checkbox"> El distintivo del título abre «Elige tu título»; cambiar uno lo cambia y, al cerrar y volver a abrir el Perfil, sigue</label>
<label><input type="checkbox"> Una cuenta sin títulos ganados no ve el distintivo</label>
<label><input type="checkbox"> El lápiz de «Mis viajes» enseña las papeleras y vuelve con la marca</label>
<label><input type="checkbox"> Las tarjetas no dicen «Hecho»; tocar cualquier parte de la tarjeta (salvo la cámara) abre el viaje</label>
<label><input type="checkbox"> Sin logros, la vitrina enseña tres huecos de puntos con el «+» pequeño en medio</label>
</body></html>`
fs.writeFileSync('docs/dias/REPASO_V8.html', html)
console.log('docs/dias/REPASO_V8.html', Math.round(html.length / 1024), 'KB')
