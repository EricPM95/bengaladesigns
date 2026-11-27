// Genera docs/dias/CHECKLIST_V72_V76.md y docs/dias/REPASO_V72_V76.html (una sola página, con las capturas DENTRO, sin internet ni servidor)
// a partir de docs/dias/V5x_puntos.json y docs/dias/_decisiones_V72_V76.md. No es una prueba.
import fs from 'node:fs'
import path from 'node:path'

const D = path.resolve('docs/dias')
const TANDAS = [
  [72, "V72 · Los logros más bonitos: la ficha en grande, la página del destino y «Logros de viajero»"],
  [73, "V73 · HOY cuando ya has visto todo («Todo visto por hoy»)"],
  [74, "V74 · Las decisiones de Eric: excursiones, motor, restaurantes y HOY"],
  [75, "V75 · «+ Añadir una reserva» (tren, autobús, ferry, otra) y los tres iconos de cada tarjeta"],
  [76, "V76 · Unir una reserva a la excursión, la llegada o la vuelta; las escalas del vuelo"],
]
// Líneas que hacía el coordinador (no el agente de la tanda): ya están hechas.
const HECHO_POR_COORDINADOR = /nota-estado|push|produccion|producción|subir/i

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const SIMB = { ok: '✅', medias: '🟡', no: '❌' }

function buscarImagen(n, nombre) {
  if (!nombre) return null
  const cands = []
  const limpio = String(nombre).replace(/\\/g, '/')
  cands.push(path.join(D, limpio), path.join(D, `V${n}_capturas`, limpio), path.join(D, `V${n}_capturas`, path.basename(limpio)))
  for (const c of [...cands]) for (const ext of ['.jpg', '.png', '.jpeg']) cands.push(c + ext)
  for (const c of cands) if (fs.existsSync(c) && fs.statSync(c).isFile()) return c
  return null
}
const dataUri = (f) => `data:image/${f.endsWith('.png') ? 'png' : 'jpeg'};base64,${fs.readFileSync(f).toString('base64')}`

const cuenta = { ok: 0, medias: 0, no: 0 }
let md = ''
let html = ''
for (const [n, titulo] of TANDAS) {
  let arr = JSON.parse(fs.readFileSync(path.join(D, `V${n}_puntos.json`), 'utf8'))
  if (!Array.isArray(arr)) arr = arr.puntos
  md += `\n## ${titulo}\n\n`
  html += `<h2>${esc(titulo)}</h2>\n`
  for (const p of arr) {
    let estado = p.estado
    let nota = p.nota
    if (estado !== 'ok' && HECHO_POR_COORDINADOR.test(p.id + ' ' + (p.texto ?? ''))) {
      estado = 'ok'
      nota = 'Hecho por el coordinador al final de la tanda (commit a main y producción comprobada).'
    }
    cuenta[estado] = (cuenta[estado] ?? 0) + 1
    const caps = [p.captura_antes && ['antes', p.captura_antes], p.captura_despues && ['después', p.captura_despues], p.captura && ['', p.captura]].filter(Boolean)
    const nombres = caps.map(([, f]) => f).join(', ')
    md += `- ${SIMB[estado]} **${p.id}** — ${p.texto ?? ''}${estado === 'ok' ? (nombres ? ` (se ve en: ${nombres})` : '') : ` — ${nota ?? 'sin nota'}`}\n`
    let figs = ''
    for (const [etq, f] of caps) {
      const ruta = buscarImagen(n, f)
      figs += ruta
        ? `<figure><img src="${dataUri(ruta)}" alt="${esc(f)}"><figcaption>${etq ? etq + ' · ' : ''}${esc(path.basename(ruta))}</figcaption></figure>`
        : `<figure class="falta"><figcaption>${etq ? etq + ' · ' : ''}${esc(f)} (archivo no encontrado)</figcaption></figure>`
    }
    html += `<div class="punto e-${estado}"><div class="cab"><span class="s">${SIMB[estado]}</span> <b>${esc(p.id)}</b> · ${esc(p.texto)}</div>`
    html += `<div class="exp">${esc(p.explicacion ?? '')}${estado !== 'ok' && nota ? `<br><i>${estado === 'medias' ? 'Falta / a medias: ' : 'No hecho: '}${esc(nota)}</i>` : ''}</div>${figs ? `<div class="figs">${figs}</div>` : ''}</div>\n`
  }
}
const total = cuenta.ok + cuenta.medias + cuenta.no
const resumen = `✅ ${cuenta.ok} hechos · 🟡 ${cuenta.medias} a medias · ❌ ${cuenta.no} no hechos (de ${total} puntos)`

let decisiones = ''
const fd = path.join(D, '_decisiones_V72_V76.md')
if (fs.existsSync(fd)) decisiones = fs.readFileSync(fd, 'utf8')

// CHECKLIST (markdown)
const cabecera = `# CHECKLIST V72 a V76 (25-nov)\n\n**${resumen}.**\n\nCada punto de cada tanda, uno por línea: ✅ hecho (y dónde se ve) · 🟡 a medias (qué falta) · ❌ no hecho (por qué). V72 y V73 en modo rápido; V74, V75 y V76 con pruebas.html\`.\n`
fs.writeFileSync(path.join(D, 'CHECKLIST_V72_V76.md'), cabecera + md + '\n' + (decisiones ? '\n' + decisiones.replace(/^# .*\n/, '') : '\n## Decisiones pendientes de Eric\n\n(ver DECISIONES_V72 … DECISIONES_V76)\n'))

// REPASO (html autónomo)
const decHtml = decisiones
  ? decisiones.split('\n').map((l) => (/^#{1,3} /.test(l) ? `<h2>${esc(l.replace(/^#+ /, ''))}</h2>` : l.trim() ? `<p>${esc(l).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')}</p>` : '')).join('\n')
  : '<p>(ver DECISIONES_V72 … DECISIONES_V76)</p>'
const pagina = `<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>REPASO V72 a V76</title>
<style>body{font:15px/1.5 system-ui,sans-serif;max-width:1000px;margin:24px auto;padding:0 16px;color:#1C2230;background:#FBF6EA}h1{margin-bottom:4px}h2{margin-top:34px;border-top:2px solid #C9A24A;padding-top:10px}
.resumen{font-size:18px;background:#fff;border:1px solid #d8cfb8;border-radius:12px;padding:12px 16px;margin:12px 0}
.punto{background:#fff;border:1px solid #e6dcc3;border-radius:12px;padding:10px 14px;margin:10px 0}.e-medias{border-left:5px solid #D9A23A}.e-no{border-left:5px solid #B5483A}.e-ok{border-left:5px solid #4E8A5B}
.cab{font-size:15px}.s{font-size:18px}.exp{color:#4a4638;margin:4px 0 6px}.figs{display:flex;flex-wrap:wrap;gap:10px}figure{margin:0;width:200px}figure img{width:100%;border:1px solid #d8cfb8;border-radius:10px;display:block}figcaption{font-size:11.5px;color:#6a6657;margin-top:3px;word-break:break-all}figure.falta{border:1px dashed #b5483a;padding:8px;border-radius:8px}</style>
<h1>REPASO de las tandas V72 a V76</h1>
<div class="resumen"><b>${resumen}</b><br>V72 y V73 en modo rápido (compilar y capturas en modo iPhone); V74, V75 y V76 con pruebas. Esta página se abre sola, sin internet y sin servidor: las capturas van dentro.</div>
${html}
${decHtml}
</html>`
fs.writeFileSync(path.join(D, 'REPASO_V72_V76.html'), pagina)
console.log(resumen, '| html', Math.round(pagina.length / 1024), 'KB', '| decisiones', decisiones ? 'sí' : 'NO')
