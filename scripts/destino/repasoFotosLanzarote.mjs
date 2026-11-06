// Genera docs/dias/REPASO_FOTOS_LANZAROTE.html: todas las paradas de Lanzarote con su foto puesta (la de Eric, la de Commons que se queda o «sin foto»), con casillas, y las capturas de móvil
// de los días martes 10 y jueves 12 del viaje de Eric.   node scripts/destino/repasoFotosLanzarote.mjs
import fs from 'node:fs'
import sharp from 'sharp'
import { photosFor, ownPhotoFile } from '../../server/engine/writtenDays.js'

const tabla = photosFor('lanzarote')
const datos = JSON.parse(fs.readFileSync('data/pipeline_v2/lanzarote.json', 'utf8'))
const ruta = JSON.parse(fs.readFileSync('docs/dias/_hoy3_ruta_eric.json', 'utf8')).route
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')

// Las paradas: las de nuestros datos y las de la ruta de Eric (los nombres con los que la app las pide).
const nombres = []
for (const n of [...datos.places.map((p) => p.name), ...ruta.days.flatMap((d) => d.stops.map((s) => s.name))]) if (!nombres.includes(n)) nombres.push(n)
const enRuta = new Set(ruta.days.flatMap((d) => d.stops.map((s) => s.name)))
const filas = nombres.map((n) => {
  const f = ownPhotoFile(tabla, n, null)
  return { nombre: n, f }
})
const deEric = filas.filter((x) => x.f?.origen === 'Eric').length
const deCommons = filas.filter((x) => x.f && x.f.origen !== 'Eric').length
const sin = filas.filter((x) => !x.f).length
const revisar = tabla.fotos.filter((f) => f.derechos && f.derechos !== 'libre')

// Miniaturas pequeñas dentro de docs/dias (así el REPASO se ve también fuera de este ordenador).
fs.mkdirSync('docs/dias/capturas_jutrip/lz_fotos', { recursive: true })
for (const x of filas) if (x.f) await sharp(`public/fotos/lanzarote/${x.f.archivo.replace(/.jpg$/, '_p.jpg')}`).resize({ width: 360 }).jpeg({ quality: 70 }).toFile(`docs/dias/capturas_jutrip/lz_fotos/${x.f.archivo.replace(/.jpg$/, '_m.jpg')}`)
const miniatura = (f) => `capturas_jutrip/lz_fotos/${f.archivo.replace(/.jpg$/, '_m.jpg')}`
const tarjetas = filas
  .map((x, i) => {
    const origen = !x.f ? '⚪ Sin foto (fondo de color)' : x.f.origen === 'Eric' ? `📷 De Eric${x.f.derechos !== 'libre' ? ' · ⚠️ derechos por revisar antes del lanzamiento' : ''}` : '🖼️ De Commons (se queda la de antes)'
    const img = x.f ? `<img src="${esc(miniatura(x.f))}" alt="" loading="lazy">` : '<div class="nada">sin foto</div>'
    return `<label class="p"><input type="checkbox" data-k="p${i}"><span><b>${esc(x.nombre)}</b>${enRuta.has(x.nombre) ? ' <small>(en el viaje de Eric)</small>' : ''}<br><em>${esc(origen)}</em>${x.f ? `<br><small>${esc(x.f.archivo)}</small>` : ''}<br>${img}</span></label>`
  })
  .join('')
const capturas = fs.readdirSync('docs/dias/capturas_jutrip').filter((f) => /^fotos_lz_/.test(f) && f.endsWith('.jpg')).sort()
const galeria = capturas.map((f) => `<figure><img src="capturas_jutrip/${f}" alt="" loading="lazy"><figcaption>${esc(f.replace(/\.jpg$/, ''))}</figcaption></figure>`).join('')
const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Repaso de las fotos de Lanzarote · Ruta</title>
<style>
:root{--bg:#FBF6EC;--tx:#1C2230;--oro:#6F4E37}
@media (prefers-color-scheme:dark){:root{--bg:#1C2230;--tx:#FFFDF8;--oro:#E9C77A}}
body{margin:0;padding:16px;background:var(--bg);color:var(--tx);font:15px/1.5 system-ui,sans-serif;max-width:560px;margin-inline:auto}
h1{font:400 30px/1.1 Georgia,serif}h2{font:400 21px/1.2 Georgia,serif;margin-top:26px;color:var(--oro)}
label.p{display:flex;gap:10px;align-items:flex-start;padding:12px 0;border-bottom:1px solid rgba(128,128,128,.2)}
label.p input{margin-top:5px;width:22px;height:22px;flex:none}label.p small{opacity:.7}label.p em{opacity:.85;font-size:13px}
label.p img{width:100%;max-width:300px;border-radius:12px;border:1px solid rgba(128,128,128,.3);margin-top:6px;display:block}
.nada{width:100%;max-width:300px;height:120px;border-radius:12px;background:#E9DCC3;display:flex;align-items:center;justify-content:center;margin-top:6px;opacity:.7}
figure{margin:14px 0}figure img{width:100%;max-width:390px;border-radius:16px;border:1px solid rgba(128,128,128,.3);display:block}figcaption{font-size:12.5px;opacity:.7}
#cuenta{position:sticky;top:0;background:var(--bg);padding:6px 0;font-weight:600}
</style></head><body>
<h1>Repaso de las fotos de Lanzarote</h1>
<p>${filas.length} paradas: <b>${deEric}</b> con la foto de Eric, <b>${deCommons}</b> con la de Commons que se queda y <b>${sin}</b> sin foto (fondo de color; nunca la de Wikipedia).</p>
<p><small>Derechos por revisar antes del lanzamiento: ${esc(revisar.map((f) => f.lugares[0]).join(' · '))}.</small></p>
<div id="cuenta"></div>
${tarjetas}
<h2>El viaje de Eric: martes 10 y jueves 12 (móvil)</h2>
${galeria}
<script>
(function(){var cs=[].slice.call(document.querySelectorAll('input[data-k]'));var cu=document.getElementById('cuenta');var K='repasofotoslanzarote';var s={};
try{s=JSON.parse(localStorage.getItem(K)||'{}')}catch(e){}
function pinta(){var n=cs.filter(function(c){return c.checked}).length;cu.textContent=n+' de '+cs.length+' comprobadas'}
cs.forEach(function(c){c.checked=!!s[c.dataset.k];c.addEventListener('change',function(){s[c.dataset.k]=c.checked;try{localStorage.setItem(K,JSON.stringify(s))}catch(e){}pinta()})});pinta()})();
</script></body></html>`
fs.writeFileSync('docs/dias/REPASO_FOTOS_LANZAROTE.html', html)
console.log(`docs/dias/REPASO_FOTOS_LANZAROTE.html (${filas.length} paradas: ${deEric} de Eric, ${deCommons} de Commons, ${sin} sin foto; ${capturas.length} capturas)`)
