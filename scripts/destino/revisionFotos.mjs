// La hoja de contactos de las fotos de Roma (PARA_CODE_TODO_2026-10-01, paso 5.6): TODAS las fotos —cada lugar, de día y de
// noche— con el nombre de la parada, cuándo sale (de día, de noche, Navidad) y de dónde viene (propia, Unsplash,
// Wikipedia…). Primero van las que se buscaron solas y nadie ha revisado a ojo (Unsplash y Wikipedia); las propias, que
// el usuario eligió a mano, van después. Pide las fotos a la API local y escribe docs/revision_fotos_roma.html.
//   node scripts/destino/revisionFotos.mjs [api=http://localhost:8787] [out=docs/revision_fotos_roma.html] [json=ruta]
import { readFileSync, writeFileSync } from 'node:fs'

const a = Object.fromEntries(process.argv.slice(2).map((x) => x.split('=')))
const api = a.api ?? 'http://localhost:8787'
const out = a.out ?? 'docs/revision_fotos_roma.html'
const D = JSON.parse(readFileSync('data/pipeline_v2/roma.json', 'utf8'))
const OWN = JSON.parse(readFileSync('data/dias/roma/_fotos.json', 'utf8'))

const photo = async (name, date) => {
  try {
    const response = await fetch(`${api}/api/place-photo`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, city: 'Roma', ...(date ? { date } : {}) }) })
    return await response.json()
  } catch {
    return { photo_source: 'none' }
  }
}

// Qué lugares salen de noche (las experiencias nocturnas, con su nombre) y los paseos por barrio.
const items = []
for (const place of D.places ?? []) items.push({ name: place.name, kind: 'Parada (de día)', level: place.level ?? 3 })
for (const night of D.night_experiences ?? []) items.push({ name: night.name, kind: 'Experiencia nocturna', level: night.level ?? 2 })
for (const walk of D.zone_walks ?? []) items.push({ name: walk.name ?? walk.title, kind: 'Paseo por barrio', level: 3 })

// Las fotos propias, con cuándo salen: sus fechas (Navidad) y si esperan a que se compruebe que ese año hay lo que se ve.
const ownByName = new Map()
for (const foto of OWN.fotos ?? []) for (const lugar of foto.lugares ?? []) ownByName.set(lugar, [...(ownByName.get(lugar) ?? []), foto])
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
const md = (text) => `${Number(text.slice(3))} ${MONTHS[Number(text.slice(0, 2)) - 1]}`

const rows = []
for (const item of items) {
  const normal = await photo(item.name)
  const own = ownByName.get(item.name) ?? []
  const christmas = own.filter((foto) => foto.fechas)
  const xmas = []
  for (const foto of christmas) {
    const probe = await photo(item.name, `2026-${foto.fechas.desde}`)
    xmas.push({ foto, probe, verificar: Boolean(foto.verificar) })
  }
  rows.push({ ...item, normal, xmas })
  process.stdout.write('.')
}

const NOTES = OWN.notas_revision ?? {}
const esc = (text) => String(text ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const origin = (result) => (result?.photo_source === 'propia' ? 'Propia (elegida a mano)' : result?.photo_source === 'unsplash' ? 'Unsplash (buscada sola)' : result?.photo_source === 'wikipedia' ? 'Wikipedia (buscada sola)' : 'Sin foto')
const urlOf = (result) => (result?.photo_source === 'propia' ? `../public${result.photo_small ?? result.photo_url}` : result?.unsplash_small ?? result?.photo_url ?? '')
const reviewed = (row) => row.normal?.photo_source === 'propia'

const cell = (result, extra = '') => {
  const url = urlOf(result)
  if (!url) return '<div class="none">Sin foto: color neutro de la app</div>'
  return `<img src="${esc(url)}" loading="lazy" alt=""><div class="src">${esc(origin(result))}${extra}</div>`
}
const when = (row) => {
  const parts = []
  parts.push(row.kind === 'Experiencia nocturna' ? 'De noche (la foto puede ser de noche)' : 'De día (nunca una foto de noche)')
  for (const x of row.xmas) parts.push(`Navidad ${md(x.foto.fechas.desde)}–${md(x.foto.fechas.hasta)}${x.verificar ? ' (no sale: por verificar)' : ''}`)
  return parts.join('<br>')
}

const sorted = [...rows].sort((x, y) => Number(reviewed(x)) - Number(reviewed(y)) || x.kind.localeCompare(y.kind) || x.level - y.level || x.name.localeCompare(y.name, 'es'))
const tr = (row) =>
  `<tr class="${reviewed(row) ? 'rev' : 'sin'}"><td><div class="name">${esc(row.name)}</div><div class="lvl">${esc(row.kind)} · nivel ${row.level}</div>${NOTES[row.name] ? `<div class="nota">${esc(NOTES[row.name])}</div>` : ''}<div class="when">${when(row)}</div></td><td>${cell(row.normal)}</td><td>${row.xmas.map((x) => cell(x.probe, ` · ${esc(x.foto.archivo)}`)).join('') || '<div class="none">—</div>'}</td></tr>`

const sinRevisar = sorted.filter((row) => !reviewed(row))
const revisadas = sorted.filter(reviewed)
const html = `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Revisión de fotos de Roma</title>
<style>
:root{--bg:#F5EFE4;--card:#FFFDF8;--ink:#1C2230;--soft:#6B6F7A;--accent:#B64E10}
body{margin:0;background:var(--bg);color:var(--ink);font:14px/1.4 system-ui,sans-serif;padding:16px}
h1{font:400 30px Georgia,serif;margin:0 0 4px}h2{font:400 22px Georgia,serif;margin:28px 0 4px}p{color:var(--soft);margin:0 0 12px}
table{width:100%;border-collapse:separate;border-spacing:0 10px}
td{background:var(--card);padding:10px;vertical-align:top}td:first-child{border-radius:14px 0 0 14px;width:28%}td:last-child{border-radius:0 14px 14px 0}
tr.sin td:first-child{border-left:5px solid var(--accent)}
.name{font:400 18px Georgia,serif}.lvl{color:var(--soft);font-size:12px;margin-top:2px}.when{font-size:12px;margin-top:6px}.nota{font-size:12px;margin-top:6px;color:var(--accent);font-weight:600}
img{width:100%;max-width:300px;aspect-ratio:4/3;object-fit:cover;border-radius:10px;display:block;margin-top:6px}
.src{font-size:11px;color:var(--soft);margin-top:4px}.none{color:var(--soft);font-size:12px;padding:20px 0}
th{text-align:left;font:600 11px monospace;letter-spacing:.12em;text-transform:uppercase;color:var(--accent);padding:0 10px}
</style></head><body>
<h1>Revisión de fotos de Roma</h1>
<p>${rows.length} fotos. Las ${sinRevisar.length} de arriba (borde naranja) se buscaron solas, en Unsplash o Wikipedia, y nadie las ha visto a ojo; las ${revisadas.length} de abajo son propias y las elegiste tú. Dime cuáles cambiar. Una parada normal lleva siempre foto de día; la de noche, solo las experiencias nocturnas (y las de Navidad, en sus fechas). Generado el ${new Date().toISOString().slice(0, 10)} con <code>scripts/destino/revisionFotos.mjs</code>.</p>
<h2>Buscadas solas, sin revisar (${sinRevisar.length})</h2>
<table><thead><tr><th>Parada y cuándo sale</th><th>Foto</th><th>En Navidad</th></tr></thead><tbody>
${sinRevisar.map(tr).join('\n')}
</tbody></table>
<h2>Propias (${revisadas.length})</h2>
<table><thead><tr><th>Parada y cuándo sale</th><th>Foto</th><th>En Navidad</th></tr></thead><tbody>
${revisadas.map(tr).join('\n')}
</tbody></table></body></html>
`
writeFileSync(out, html)
if (a.json) writeFileSync(a.json, JSON.stringify(rows.map((row) => ({ name: row.name, kind: row.kind, source: row.normal?.photo_source, url: urlOf(row.normal) })), null, 1))
console.log(`\n${out}: ${rows.length} fotos (${sinRevisar.length} sin revisar, ${revisadas.length} propias)`)
