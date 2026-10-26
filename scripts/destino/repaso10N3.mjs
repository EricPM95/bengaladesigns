// Genera docs/dias/REPASO_10N3.html (la lista de comprobación con casillas, arriba del todo, y las capturas a tamaño de móvil) y, con --md, imprime la misma lista en Markdown para el informe.
//   node scripts/destino/repaso10N3.mjs          → escribe docs/dias/REPASO_10N3.html
//   node scripts/destino/repaso10N3.mjs --md     → imprime la lista de comprobación en Markdown
// La lista sale de los ficheros `docs/dias/_10n3_checklist_<agente>.json` (un objeto por punto: apartado, punto, estado, nota, donde, captura), puestos en el orden del prompt de la Tanda 10N3
// (docs/dias/PROMPT_TANDA10N3.md), más los puntos del §0, el §12 y el §13, que son de quien integra.
import fs from 'node:fs'

const ORDEN = ['0', '1', '2', '2b', '3', '3b', '4', '5']
const E = { hecho: '✅ Hecho', medias: '⚠️ A medias', no: '❌ No hecho' }
const resultadoBateria = process.env.RESULTADO_BATERIA || 'ver el informe'
const resultadoPrueba = process.env.RESULTADO_PRUEBA || 'ver el informe'

const propios = [
  { apartado: '§0 · Antes de empezar', punto: 'Prompt guardado en docs/dias/PROMPT_TANDA10N3.md y en el commit', estado: 'hecho', nota: '', donde: 'No es de móvil.', captura: null },
  { apartado: '§2 · Duda 1', punto: 'Los menús de tres puntitos: la hoja clara está bien', estado: 'hecho', nota: 'Se queda la hoja clara.', donde: 'DÍAS › tres puntitos de un día o de una parada.', captura: null },
  { apartado: '§2 · Duda 4', punto: '«Mover a» y el Arco de Constantino: donde menos desvío haya, sin quedar en medio de una visita larga', estado: 'hecho', nota: 'Usa la misma lógica que añadir un sitio (mejorHuecoEnElDia: nunca el primero de un día con paradas). Lo de «en medio de una visita larga» sale de ese cálculo; no hay una regla aparte para las visitas largas.', donde: 'DÍAS › tres puntitos de una parada › Mover a (cualquier cuenta que pueda editar).', captura: null },
  { apartado: '§2 · Duda 5', punto: 'El Free Tour del invitado: Eric lo prueba y dice; mientras, se deja como está', estado: 'hecho', nota: 'Sin cambios. Pendiente de que Eric abra su viaje como invitado y diga si falta.', donde: 'EXPLORAR › Entradas, con la cuenta del invitado.', captura: null },
  { apartado: '§2 · Duda 6', punto: 'La ✕ para quitar un gasto: se queda', estado: 'hecho', nota: 'Se queda tal como estaba.', donde: 'RUTA › cartera › Extras, con la cuenta que añadió el gasto o con el administrador.', captura: null },
  { apartado: '§4 · La prueba', punto: 'Contra Supabase real, con dos cuentas: invitar, cambiar un permiso, quitar, un gasto [Para todos] aceptado y uno rechazado, una propuesta aceptada, y el directo con dos navegadores abiertos', estado: 'medias', nota: 'Hecho con tres cuentas anónimas de prueba (que se borraron al acabar): permisos, quitar, salir, avisos, propuesta aceptada y el directo con dos clientes. NO se pudo contra Supabase real: crear y canjear una invitación (exigen cuenta de verdad, no anónima), la plaza del pase que vuelve (necesita un cobro real), los gastos aceptado y rechazado, ni el directo con dos NAVEGADORES (solo dos clientes). Las migraciones 0041 a 0045 son nuevas y están SIN aplicar.', donde: 'No es de móvil.', captura: null },
  { apartado: '§4 · La prueba', punto: 'Prueba nueva pruebaTanda10N3 (editar, avisos, reservas, cuentas, apertura y perfil; y la prueba contra Supabase real con dos cuentas)', estado: 'hecho', nota: resultadoPrueba, donde: 'No es de móvil.', captura: null },
  { apartado: '§4 · La prueba', punto: 'La batería rápida y pruebaJutrip (Eric pidió no pasar la batería completa en esta tanda)', estado: 'hecho', nota: resultadoBateria, donde: 'No es de móvil.', captura: null },
  { apartado: '§4 · Capturas', punto: 'Capturas en docs/dias/capturas_jutrip/ y esta página a tamaño de móvil', estado: 'hecho', nota: '', donde: 'Esta página.', captura: null },
  { apartado: '§5 · El informe', punto: 'Apartado «10N3» en docs/dias/INFORME_TANDA10B.md, con esta lista al final', estado: 'hecho', nota: '', donde: 'No es de móvil.', captura: null },
]

const ficheros = fs.readdirSync('docs/dias').filter((f) => /^_10n3_checklist.*\.json$/.test(f)).sort()
let puntos = propios.slice()
for (const f of ficheros) {
  try {
    puntos = puntos.concat(JSON.parse(fs.readFileSync(`docs/dias/${f}`, 'utf8')))
  } catch (e) {
    console.error(`No se pudo leer ${f}: ${e.message}`)
  }
}
const seccion = (p) => (/^§(\d+[a-z]?)/.exec(p.apartado)?.[1] ?? '99')
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
            return `<label class="p"><input type="checkbox" data-k="p${n}"><span><b>${esc(estado(p))}</b> — ${esc(p.punto)}${p.nota ? `<br><small>${esc(p.nota)}</small>` : ''}<br><em>Dónde: ${esc(p.donde)}</em>${p.captura ? `<br><a href="capturas_jutrip/${esc(p.captura)}"><img src="capturas_jutrip/${esc(p.captura)}" alt="" loading="lazy"></a>` : ''}</span></label>`
          })
          .join(''),
    )
    .join('')
  const todas = fs
    .readdirSync('docs/dias/capturas_jutrip')
    .filter((f) => /^10n3_.*\.jpg$/.test(f))
    .sort()
  const galeria = todas.map((f) => `<figure><img src="capturas_jutrip/${f}" alt="" loading="lazy"><figcaption>${esc(f.replace(/\.jpg$/, ''))}</figcaption></figure>`).join('')
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Repaso 10N3 · Ruta</title>
<style>
:root{--bg:#FBF6EC;--tx:#1C2230;--oro:#6F4E37}
@media (prefers-color-scheme:dark){:root{--bg:#1C2230;--tx:#FFFDF8;--oro:#E9C77A}}
body{margin:0;padding:16px;background:var(--bg);color:var(--tx);font:15px/1.5 system-ui,sans-serif;max-width:560px;margin-inline:auto}
h1{font:400 30px/1.1 Georgia,serif}h2{font:400 21px/1.2 Georgia,serif;margin-top:26px;color:var(--oro)}
label.p{display:flex;gap:10px;align-items:flex-start;padding:10px 0;border-bottom:1px solid rgba(128,128,128,.2)}
label.p input{margin-top:5px;width:22px;height:22px;flex:none}label.p small{opacity:.75}label.p em{opacity:.7;font-size:13px}
label.p img{width:100%;max-width:220px;border-radius:12px;border:1px solid rgba(128,128,128,.3);margin-top:6px}
figure{margin:14px 0}figure img{width:100%;max-width:390px;border-radius:16px;border:1px solid rgba(128,128,128,.3);display:block}figcaption{font-size:12.5px;opacity:.7}
#cuenta{position:sticky;top:0;background:var(--bg);padding:6px 0;font-weight:600}
</style></head><body>
<h1>Repaso de la Tanda 10N3</h1>
<p>Lo que quedó a medias de la 10N: «Puede editar» en la pantalla, avisos, reservas, cuentas, la película de la apertura, el perfil y las portadas. Marca cada punto en tu teléfono cuando lo hayas comprobado (se guarda en este navegador).</p>
<div id="cuenta"></div>
${lista}
<h2>Todas las capturas</h2>
${galeria}
<script>
(function(){var cs=[].slice.call(document.querySelectorAll('input[data-k]'));var cu=document.getElementById('cuenta');var K='repaso10n3';var s={};
try{s=JSON.parse(localStorage.getItem(K)||'{}')}catch(e){}
function pinta(){var n=cs.filter(function(c){return c.checked}).length;cu.textContent=n+' de '+cs.length+' comprobados'}
cs.forEach(function(c){c.checked=!!s[c.dataset.k];c.addEventListener('change',function(){s[c.dataset.k]=c.checked;try{localStorage.setItem(K,JSON.stringify(s))}catch(e){}pinta()})});pinta()})();
</script></body></html>`
  fs.writeFileSync('docs/dias/REPASO_10N3.html', html)
  console.log(`docs/dias/REPASO_10N3.html (${n} puntos, ${todas.length} capturas)`)
}
