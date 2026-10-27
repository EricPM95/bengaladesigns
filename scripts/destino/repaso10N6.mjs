// Genera docs/dias/REPASO_10N6.html (la lista de comprobación con casillas, arriba del todo, y las capturas a tamaño de móvil) y, con --md, imprime la misma lista en Markdown para el informe.
//   node scripts/destino/repaso10N6.mjs          → escribe docs/dias/REPASO_10N6.html
//   node scripts/destino/repaso10N6.mjs --md     → imprime la lista de comprobación en Markdown
// La lista sale de los ficheros `docs/dias/_10n6_checklist_<agente>.json` (un objeto por punto: apartado, punto, estado, nota, donde, captura), puestos en el orden del prompt de la Tanda 10N6
// (docs/dias/PROMPT_TANDA10N6.md), más los puntos del §0, el §12 y el §13, que son de quien integra.
import fs from 'node:fs'

const ORDEN = ['0', '0a', '1', '1b', '1c', '1d', '1e', '1f', '1g', '1h', '1i', '1j', '1k', '1l', '2', '3']
const E = { hecho: '✅ Hecho', medias: '⚠️ A medias', no: '❌ No hecho' }
const resultadoBateria = process.env.RESULTADO_BATERIA || 'ver el informe'
const resultadoPrueba = process.env.RESULTADO_PRUEBA || 'ver el informe'

const propios = [
  { apartado: '0 · Antes de empezar', punto: 'Prompt guardado en docs/dias/PROMPT_TANDA10N6.md y en el commit', estado: 'hecho', nota: '', donde: 'No es de móvil.', captura: null },
  { apartado: '0 · Antes de empezar', punto: 'Design al día con RETOQUES.zip (sin uploads/ ni screenshots/): Recuerdos Ficha, Pase Estilo, Cuentas Modo (copiada, es de la 10N7); Pase Premium no se usa', estado: 'hecho', nota: '', donde: 'No es de móvil.', captura: null },
  { apartado: '0 · Antes de empezar', punto: 'La música (1i) la deja Eric en public/sonidos/pelicula_pase.mp3: si no está, queda preparado y se dice en el informe', estado: 'medias', nota: 'El archivo no está todavía. Todo queda preparado y la película funciona igual sin él.', donde: 'Cuando pongas el mp3, abre la película del pase.', captura: null },
  { apartado: '2 · La prueba', punto: 'Prueba nueva pruebaTanda10N6 (confirmaciones, aviso del pase, EXPLORAR y recuerdos, cuentas y entradas para varios)', estado: 'hecho', nota: resultadoPrueba, donde: 'No es de móvil.', captura: null },
  { apartado: '2 · La prueba', punto: 'La batería rápida y pruebaJutrip (si algo falla solo al correr con las demás y pasa solo, se dice y se arregla en la 10S)', estado: 'hecho', nota: resultadoBateria, donde: 'No es de móvil.', captura: null },
  { apartado: '2 · Capturas', punto: 'Capturas en docs/dias/capturas_jutrip/ y esta página a tamaño de móvil, cada una al lado de la de Design', estado: 'hecho', nota: '', donde: 'Esta página.', captura: null },
  { apartado: '3 · El informe', punto: 'Apartado «10N6» en docs/dias/INFORME_TANDA10B.md y esta lista al final', estado: 'hecho', nota: '', donde: 'No es de móvil.', captura: null },
]

const ficheros = fs.readdirSync('docs/dias').filter((f) => /^_10n6_checklist.*\.json$/.test(f)).sort()
let puntos = propios.slice()
for (const f of ficheros) {
  try {
    puntos = puntos.concat(JSON.parse(fs.readFileSync(`docs/dias/${f}`, 'utf8')))
  } catch (e) {
    console.error(`No se pudo leer ${f}: ${e.message}`)
  }
}
const seccion = (p) => (/^(?:§\s*)?(\d+(?:\.\d+)?[a-z]?)/.exec(p.apartado)?.[1] ?? '99')
puntos = puntos.map((p, i) => ({ ...p, _i: i })).sort((a, b) => {
  const d = ORDEN.indexOf(seccion(a)) - ORDEN.indexOf(seccion(b))
  return d || a._i - b._i
})
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
    .filter((f) => /^10n6_.*\.jpg$/.test(f))
    .sort()
  const galeria = todas.map((f) => `<figure><img src="capturas_jutrip/${f}" alt="" loading="lazy"><figcaption>${esc(f.replace(/\.jpg$/, ''))}</figcaption></figure>`).join('')
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Repaso 10N6 · Ruta</title>
<style>
:root{--bg:#FBF6EC;--tx:#1C2230;--oro:#6F4E37}
@media (prefers-color-scheme:dark){:root{--bg:#1C2230;--tx:#FFFDF8;--oro:#E9C77A}}
body{margin:0;padding:16px;background:var(--bg);color:var(--tx);font:15px/1.5 system-ui,sans-serif;max-width:560px;margin-inline:auto}
h1{font:400 30px/1.1 Georgia,serif}h2{font:400 21px/1.2 Georgia,serif;margin-top:26px;color:var(--oro)}
label.p{display:flex;gap:10px;align-items:flex-start;padding:10px 0;border-bottom:1px solid rgba(128,128,128,.2)}
label.p input{margin-top:5px;width:22px;height:22px;flex:none}label.p small{opacity:.75}label.p em{opacity:.7;font-size:13px}
.par{display:flex;gap:8px;align-items:flex-start}.par img{max-width:48%;width:48%}label.p img{width:100%;max-width:220px;border-radius:12px;border:1px solid rgba(128,128,128,.3);margin-top:6px}
figure{margin:14px 0}figure img{width:100%;max-width:390px;border-radius:16px;border:1px solid rgba(128,128,128,.3);display:block}figcaption{font-size:12.5px;opacity:.7}
#cuenta{position:sticky;top:0;background:var(--bg);padding:6px 0;font-weight:600}
</style></head><body>
<h1>Repaso de la Tanda 10N6</h1>
<p>Pequeños arreglos del repaso con dos teléfonos: el lápiz y los logros siempre visibles, la campana, la franja de aviso, los menús de opciones, los permisos, el aviso de «cierra» y las entradas en la ficha y en DÍAS. Marca cada punto en tu teléfono cuando lo hayas comprobado (se guarda en este navegador).</p>
<div id="cuenta"></div>
${lista}
<h2>Todas las capturas</h2>
${galeria}
<script>
(function(){var cs=[].slice.call(document.querySelectorAll('input[data-k]'));var cu=document.getElementById('cuenta');var K='repaso10n6';var s={};
try{s=JSON.parse(localStorage.getItem(K)||'{}')}catch(e){}
function pinta(){var n=cs.filter(function(c){return c.checked}).length;cu.textContent=n+' de '+cs.length+' comprobados'}
cs.forEach(function(c){c.checked=!!s[c.dataset.k];c.addEventListener('change',function(){s[c.dataset.k]=c.checked;try{localStorage.setItem(K,JSON.stringify(s))}catch(e){}pinta()})});pinta()})();
</script></body></html>`
  fs.writeFileSync('docs/dias/REPASO_10N6.html', html)
  console.log(`docs/dias/REPASO_10N6.html (${n} puntos, ${todas.length} capturas)`)
}
