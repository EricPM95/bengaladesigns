// Genera docs/dias/REPASO_V16b.html: node scripts/destino/generarRepasoV16b.mjs
import fs from 'node:fs'
const img = (n) => (fs.existsSync(`docs/dias/V16b_capturas/${n}.jpg`) ? `data:image/jpeg;base64,${fs.readFileSync(`docs/dias/V16b_capturas/${n}.jpg`).toString('base64')}` : null)
const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Repaso de la tanda V16b · Fotos de Lanzarote y Roma</title>
<style>:root{--bg:#FBF6EC;--tx:#1C2230;--bd:rgba(28,34,48,.15)}@media (prefers-color-scheme:dark){:root{--bg:#1C2230;--tx:#FFFDF8;--bd:rgba(255,253,248,.2)}}body{margin:0;padding:16px;background:var(--bg);color:var(--tx);font:15px/1.5 system-ui,sans-serif;max-width:900px;margin-inline:auto}h1{font:400 30px/1.1 Georgia,serif}h2{font:400 22px/1.2 Georgia,serif;margin-top:28px;border-top:1px solid var(--bd);padding-top:14px}img{max-width:100%;height:auto;border:1px solid var(--bd);border-radius:10px}label{display:block;margin:6px 0}code{font-size:12.5px;background:rgba(127,127,127,.15);padding:1px 4px;border-radius:4px}li{margin:3px 0}</style></head><body>
<h1>Las fotos de Lanzarote y de Roma (V16b)</h1>
<p>Probado con <code>pruebaV16b</code> (nueva, 108 comprobaciones) y las de fotos y Explorar. Ninguna prueba toca el Supabase de producción.</p>

<h2>1. Lo que se ha puesto</h2>
<ul>
<li><b>Lanzarote (4):</b> Bodega El Grifo, Bodega La Geria y Mirador del Bosquecillo (origen «Eric», derechos «revisar antes del lanzamiento»); y Playa de La Garita, de turismoharia.com con su permiso (crédito visible «Foto: Turismo de Haría», derechos «con permiso del autor»). En <code>public/fotos/lanzarote/</code>, cada una con su <code>_p.jpg</code> (640 px) y su línea en <code>_fotos.json</code>.</li>
<li><b>Roma, las 8 de Eric:</b> Iglesia del Gesù (sustituye a la anterior), San Ignacio de Loyola, Via del Babuino (la bajé de 3840 a 1920 px: pesaba 2 MB), Via dei Coronari (y sale de «fotos rechazadas»), Testaccio, Via di Ripetta, Terraza de Largo Gaetana Agnesi y Cripta de los Capuchinos (también sale de «rechazadas»).</li>
<li><b>Ponte Sisto:</b> la foto principal de es.wikipedia (<code>Ponte_Sisto_Roma.jpg</code>, Livioandronico2013, CC BY-SA 4.0): <b>es una fotografía del puente</b> (no un grabado), la puse.</li>
<li><b>Plaza del Quirinal:</b> <code>Quirinale_palazzo_e_obelisco_con_dioscuri_Roma.jpg</code> (Wolfgang Moroder, CC BY 2.5) en lugar del grabado. Ya no se sirven de Wikipedia: fuera sus líneas dinámicas de <code>_fotos_wikimedia.json</code> y su crédito va en <code>_fotos.json</code>.</li>
</ul>
<img alt="Las 14 fotos nuevas, como salen en una tarjeta" src="${img('fotos_nuevas')}">

<h2>2. Las pequeñas, solo en tarjetas y miniaturas — y dónde salen en grande</h2>
<p>Salen en grande en: la <b>ficha de la parada</b> (la foto de arriba y, al tocarla, el visor a pantalla completa), las paradas de <b>HOY</b> y la foto grande de <b>«Yo también estaba»</b> (Y1). Para las cuatro pequeñas (El Grifo 800 px, La Garita 675, el Gesù 850, Largo Gaetana Agnesi 1000; marcadas <code>solo_tarjetas</code>) el servidor ahora da como «grande» <b>la misma versión pequeña</b> (640 px): nunca se estiran a pantalla completa. Las demás salen en grande como siempre.</p>

<h2>3. Roma: lo que he comprobado</h2>
<p>Los 37 sitios de logro de Roma y los 29 de Lanzarote (los que son parada) devuelven foto por el servidor, <b>ninguno repite la de otro</b>. En Lanzarote, las 29 son propias. Quedan <b>4 paradas sin ninguna foto</b> (Lungotevere, Borgo Pio, Mirador de San Pietro in Montorio y Colle Oppio): la página para elegir está lista.</p>

<h2>4. PARA ERIC: elige las 4 fotos que faltan</h2>
<p><b>Abre <code>docs/dias/V16_fotos/elegir.html</code> en el móvil</b>: cada sitio con 3 candidatas (A, B, C) de Wikimedia Commons con licencia libre (CC BY, CC BY-SA), su autor y su enlace. Dime la letra de cada una (o «ninguna»). Las fotos se ponen en la tanda siguiente.</p>
<p>Para ninguna de las cuatro me quedé sin candidatas buenas. Si ninguna te convence, dímelo y busco otras.</p>

<h2>Lista de comprobación de ESTA tanda</h2>
<label><input type="checkbox"> Las 4 de Lanzarote salen en su sitio (tarjeta, ficha, Explorar y hoja de logros); La Garita con «Foto: Turismo de Haría»</label>
<label><input type="checkbox"> Las 10 de Roma salen en su sitio; Ponte Sisto y el Quirinal con su crédito</label>
<label><input type="checkbox"> Las pequeñas no se ven pixeladas a pantalla completa</label>
<label><input type="checkbox"> La página <code>elegir.html</code> se ve bien en el móvil</label>
</body></html>`
fs.writeFileSync('docs/dias/REPASO_V16b.html', html)
console.log('docs/dias/REPASO_V16b.html', Math.round(html.length / 1024), 'KB')
