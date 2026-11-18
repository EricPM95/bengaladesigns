// Genera docs/dias/REPASO_V6.html (después de pruebaV6, que saca las capturas en docs/dias/V6_capturas): node scripts/destino/generarRepasoV6.mjs
import fs from 'node:fs'

const img = (n) => (fs.existsSync(`docs/dias/V6_capturas/${n}.jpg`) ? `data:image/jpeg;base64,${fs.readFileSync(`docs/dias/V6_capturas/${n}.jpg`).toString('base64')}` : null)
const fig = (n, pie) => `<figure>${img(n) ? `<img alt="${pie}" src="${img(n)}">` : '<div class="no">sin captura</div>'}<figcaption>${pie}</figcaption></figure>`
const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Repaso de la tanda V6 · Ver lo que has ganado</title>
<style>:root{--bg:#FBF6EC;--tx:#1C2230;--bd:rgba(28,34,48,.15)}@media (prefers-color-scheme:dark){:root{--bg:#1C2230;--tx:#FFFDF8;--bd:rgba(255,253,248,.2)}}body{margin:0;padding:16px;background:var(--bg);color:var(--tx);font:15px/1.5 system-ui,sans-serif;max-width:860px;margin-inline:auto}h1{font:400 30px/1.1 Georgia,serif}h2{font:400 22px/1.2 Georgia,serif;margin-top:28px;border-top:1px solid var(--bd);padding-top:14px}figure{margin:8px 10px 8px 0;display:inline-block;vertical-align:top;max-width:210px}img{max-width:100%;height:auto;border:1px solid var(--bd);border-radius:10px}figcaption{font-size:12px;opacity:.7}.no{padding:30px;border:1px dashed var(--bd)}label{display:block;margin:6px 0}code{font-size:12.5px;background:rgba(127,127,127,.15);padding:1px 4px;border-radius:4px}.nota{font-size:12.5px;opacity:.7}</style></head><body>
<h1>Ver lo que has ganado, con sus animaciones agrupadas (V6)</h1>
<p>Probado con <code>pruebaV6</code> (nueva), <code>pruebaJutrip</code>, <code>pruebaV3</code>, <code>pruebaV5</code>, las de logros de Roma y de Lanzarote y las de pantallas de logros. La muestra de 60 viajes de Roma sale idéntica. Ninguna prueba toca el Supabase de producción.</p>
<h2>Lo que cambia</h2>
<p><b>1. Al acabar de reclamar:</b> el botón dorado del resumen es <b>[Ver lo que has ganado]</b> (ya no hay «más de 6 → Ver todo en Logros»). Al tocarlo empiezan las animaciones y, al terminar la última (o con <b>[Saltar todo]</b>), se abre la hoja «Tus logros en …» con todo puesto.</p>
<p><b>2. La fila, agrupada</b> (vale para reclamar, la cámara y el Visto, para todos los destinos): <b>una sola pantalla con TODAS las colecciones que avanzan sin completarse</b> (cada insignia con su trozo nuevo y su «N de M»); luego <b>cada colección completa</b>, sola; luego <b>cada emblema oculto</b>, solo; luego el <b>sello</b>; y lo último, <b>lo del viajero</b>: los <b>puntos de experiencia y la subida de nivel en una sola pantalla</b> («+120 EXP», la barra se llena y, si llega, «¡Subes a nivel 3 · Explorador!»; si no, «Te faltan 80 EXP para el nivel 3»), después el cambio de rango (marco nuevo) si lo hay. La EXP ya no va como línea dentro de la primera pantalla. Un Visto que solo da EXP sigue con el cartel pequeño de 4 segundos. Un Visto con 2 pedazos de 2 colecciones sale en 1 pantalla.</p>
${fig('1_pedazos_varias', 'Las insignias que avanzan, juntas')}${fig('2_coleccion_completa', 'La colección completa, sola')}${fig('3_emblema', 'El emblema, solo')}${fig('4_sello', 'El sello')}${fig('5_exp_y_nivel', 'La EXP y el nivel, juntos')}${fig('6_hoja_logros_al_final', 'La hoja de logros (con [Saltar todo])')}
<p class="nota"><b>Design:</b> el zip trae «Yo también estaba» (V7) pero no una pantalla con varias insignias ni la de la EXP con el nivel. Las he hecho con el estilo de las pantallas vecinas (la pantalla de pedazos que ya existía admite varias insignias en fila o en cuadrícula; la de EXP y nivel es nueva, con la barra y los textos de Eric). Está dicho aquí para que Design la mire.</p>
<h2>Textos cambiados (a petición de Eric, en toda la app)</h2>
<p>«Esta foto no está hecha con una cámara» y «Ha perdido sus datos» pasan a <b>«Esta foto no está hecha con tu móvil»</b> (datos de los logros, la demo, las pruebas y la pieza de Design <code>Visto Fotos</code>). La hoja «no estás aquí» ahora pregunta «¿Ya has estado hoy en …? Sube una foto que hiciste allí y gana tu pedazo.» (V5).</p>
<h2>Lista de comprobación de ESTA tanda</h2>
<label><input type="checkbox"> Reclamar con 3 fotos: el resumen dice [Ver lo que has ganado] y al tocarlo salen primero las insignias juntas</label>
<label><input type="checkbox"> Cada colección completa sale sola, y cada emblema, solo, con su frase de suspense la primera vez</label>
<label><input type="checkbox"> La EXP y la subida de nivel salen en UNA pantalla al final (con «Te faltan N EXP…» si no sube)</label>
<label><input type="checkbox"> [Saltar todo] lleva directo a la hoja «Tus logros en …»</label>
<label><input type="checkbox"> Un solo [Visto] sin nada más que EXP sigue con el cartel pequeño</label>
</body></html>`
fs.writeFileSync('docs/dias/REPASO_V6.html', html)
console.log('docs/dias/REPASO_V6.html', Math.round(html.length / 1024), 'KB')
