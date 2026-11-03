// Genera docs/dias/REPASO_LZ1.html (la lista de comprobación con casillas, arriba del todo, y las capturas a tamaño de móvil) y, con --md, imprime la misma lista en Markdown para el informe.
//   node scripts/destino/repasoLZ1.mjs          → escribe docs/dias/REPASO_LZ1.html
//   node scripts/destino/repasoLZ1.mjs --md     → imprime la lista de comprobación en Markdown
// La lista sale de los ficheros `docs/dias/_10s9_checklist_<agente>.json` (un objeto por punto: apartado, punto, estado, nota, donde, captura), puestos en el orden del prompt de la Tanda LZ1
// (docs/dias/PROMPT_TANDALZ1.md), más los puntos del §0, el §12 y el §13, que son de quien integra.
import fs from 'node:fs'

const ORDEN = ['0', '1', '2', '3', '4', '5', '6', '7']
const E = { hecho: '✅ Hecho', medias: '⚠️ A medias', no: '❌ No hecho' }
const P = (apartado, punto, estado, nota, donde, captura = null, captura_design = null) => ({ apartado, punto, estado, nota, donde, captura, captura_design })
let puntos = JSON.parse(fs.readFileSync('docs/dias/_lz1_puntos.json', 'utf8'))
const seccion = (p) => (/^(?:§s*)?(d+(?:.d+)?[a-z]?)/.exec(p.apartado)?.[1] ?? '99')
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')
const estado = (p) => E[p.estado] ?? p.estado

if (process.argv.includes('--md')) {
  let apartado = ''
  const salida = []
  for (const p of puntos) {
    if (p.apartado !== apartado) {
      apartado = p.apartado
      salida.push('', `**${apartado}**`, '')
    }
    salida.push(`- ${estado(p)} — ${p.punto}${p.nota ? ` ${p.nota}` : ''}  \n  *Dónde:* ${p.donde}${p.captura ? `  *Captura:* \`${p.captura}\`` : ''}`)
  }
  console.log(salida.join('\n'))
} else {
  const grupos = []
  for (const p of puntos) {
    let g = grupos.find((x) => x.ap === p.apartado)
    if (!g) grupos.push((g = { ap: p.apartado, puntos: [] }))
    g.puntos.push(p)
  }
  let n = 0
  const lista = grupos
    .map(
      (g) =>
        `<h2>${esc(g.ap)}</h2>` +
        g.puntos
          .map((p) => {
            n++
            return `<label class="p"><input type="checkbox" data-k="p${n}"><span><b>${esc(estado(p))}</b> — ${esc(p.punto)}${p.nota ? `<br><small>${esc(p.nota)}</small>` : ''}<br><em>Dónde: ${esc(p.donde)}</em>${p.captura || p.captura_design ? `<br><span class="par">${p.captura ? `<a href="capturas_jutrip/${esc(p.captura)}"><img src="capturas_jutrip/${esc(p.captura)}" alt="app" loading="lazy"></a>` : ""}${p.captura_design ? `<a href="capturas_jutrip/${esc(p.captura_design)}"><img src="capturas_jutrip/${esc(p.captura_design)}" alt="Design" loading="lazy"></a>` : ""}</span>` : ""}</span></label>`
          })
          .join(''),
    )
    .join('')
  const todas = fs
    .readdirSync('docs/dias/capturas_jutrip')
    .filter((f) => /^lz1_.*\.jpg$/.test(f))
    .sort()
  const fotos = JSON.parse(fs.readFileSync('data/dias/lanzarote/_fotos.json', 'utf8'))
  const portadas = (fotos.portadas_candidatas ?? []).map((c) => '<figure><img src="../../' + esc(c.ruta_tarjeta ?? c.ruta) + '" alt="" loading="lazy"><figcaption><b>Opción ' + esc(c.opcion) + '</b> · ' + esc(c.que) + '<br>' + esc(c.autor) + ', ' + esc(c.licencia) + (c.opcion === 3 ? ' · ELEGIDA por Eric (4-nov)' : '') + '</figcaption></figure>').join('')
  const filaFoto = (id, v) => '<tr><td>' + esc(id) + '</td><td>' + esc(v.autor ?? '') + ' · ' + esc(v.licencia ?? '') + '</td></tr>'
  const sinFoto = (fotos.sin_foto ?? []).map((x) => '<li>' + esc(typeof x === 'string' ? x : JSON.stringify(x)) + '</li>').join('')
  const tablaHtml = '<h2>Portada de Lanzarote (elegida: la 3, Papagayo)</h2><p>Cinco candidatas con licencia libre y su crédito. Elegida por Eric el 4-nov: la 3 (Papagayo).</p>' + portadas + '<h2>Sitios sin foto libre</h2><ul>' + (sinFoto || '<li>(ver el informe)</li>') + '</ul><h2>Los días con los tiempos de Mapbox</h2><p>Un informe por día, medido desde las 6 zonas de alojamiento, en <code>docs/destinos/lanzarote/INFORME_DIAS_MAPBOX.md</code>. Resumen: todos los días caben salvo el día 3 completo (la Casa-Museo del Campesino se alcanza a las 17:21 y cierra a las 18:00, con los dos opcionales) y el día 4 desde El norte (3 h 09).</p>'
  const galeria = todas.map((f) => `<figure><img src="capturas_jutrip/${f}" alt="" loading="lazy"><figcaption>${esc(f.replace(/\.jpg$/, ''))}</figcaption></figure>`).join('')
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Repaso LZ1 · Ruta</title>
<style>
:root{--bg:#FBF6EC;--tx:#1C2230;--oro:#6F4E37}
@media (prefers-color-scheme:dark){:root{--bg:#1C2230;--tx:#FFFDF8;--oro:#E9C77A}}
body{margin:0;padding:16px;background:var(--bg);color:var(--tx);font:15px/1.5 system-ui,sans-serif;max-width:560px;margin-inline:auto}
h1{font:400 30px/1.1 Georgia,serif}h2{font:400 21px/1.2 Georgia,serif;margin-top:26px;color:var(--oro)}
label.p{display:flex;gap:10px;align-items:flex-start;padding:10px 0;border-bottom:1px solid rgba(128,128,128,.2)}
label.p input{margin-top:5px;width:22px;height:22px;flex:none}label.p small{opacity:.75}label.p em{opacity:.7;font-size:13px}
.par{display:flex;gap:8px;align-items:flex-start}.par img{max-width:48%;width:48%}label.p img{width:100%;max-width:220px;border-radius:12px;border:1px solid rgba(128,128,128,.3);margin-top:6px}
figure{margin:14px 0}figure img{width:100%;max-width:390px;border-radius:16px;border:1px solid rgba(128,128,128,.3);display:block}figcaption{font-size:12.5px;opacity:.7}
table{border-collapse:collapse;width:100%;font-size:13px}td{border-bottom:1px solid rgba(128,128,128,.25);padding:4px 6px;vertical-align:top}h3{font:600 15px system-ui;margin:14px 0 4px}
#cuenta{position:sticky;top:0;background:var(--bg);padding:6px 0;font-weight:600}
</style></head><body>
<h1>Repaso de la Tanda LZ1</h1>
<p>Lanzarote, primer destino nuevo (parte 1 de 2): lo atado a Roma, los datos, los tiempos en coche con Mapbox y Civitatis en español. Lanzarote sigue OCULTO (solo administrador); Roma no cambia. Marca cada punto en tu teléfono cuando lo hayas comprobado (se guarda en este navegador). Abajo, las portadas candidatas para que elijas.</p>
<div id="cuenta"></div>
${lista}
${tablaHtml}
<h2>Todas las capturas</h2>
${galeria}
<script>
(function(){var cs=[].slice.call(document.querySelectorAll('input[data-k]'));var cu=document.getElementById('cuenta');var K='repasolz1';var s={};
try{s=JSON.parse(localStorage.getItem(K)||'{}')}catch(e){}
function pinta(){var n=cs.filter(function(c){return c.checked}).length;cu.textContent=n+' de '+cs.length+' comprobados'}
cs.forEach(function(c){c.checked=!!s[c.dataset.k];c.addEventListener('change',function(){s[c.dataset.k]=c.checked;try{localStorage.setItem(K,JSON.stringify(s))}catch(e){}pinta()})});pinta()})();
</script></body></html>`
  fs.writeFileSync('docs/dias/REPASO_LZ1.html', html)
  console.log(`docs/dias/REPASO_LZ1.html (${n} puntos, ${todas.length} capturas)`)
}
