// La página de revisión de fotos de Roma (PROMPT_UI, Parte 2): cada lugar con su foto de día y, si sale de noche en
// alguna ruta (nocturnas y miradores), su foto de noche. Pide las fotos a la API local (la clave de Unsplash se queda en
// el servidor) y escribe docs/FOTOS_ROMA.html.
//   node scripts/destino/fotosRoma.mjs [api=http://localhost:8787] [out=docs/FOTOS_ROMA.html]
import { readFileSync, writeFileSync } from 'node:fs'

const a = Object.fromEntries(process.argv.slice(2).map((x) => x.split('=')))
const api = a.api ?? 'http://localhost:8787'
const out = a.out ?? 'docs/FOTOS_ROMA.html'
const D = JSON.parse(readFileSync('data/pipeline_v2/roma.json', 'utf8'))

const photo = async (name, force = false) => {
  try {
    const response = await fetch(`${api}/api/place-photo`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, city: 'Roma', force }) })
    return await response.json()
  } catch {
    return { photo_source: 'none' }
  }
}

// Lo que sale de noche: las nocturnas y los miradores (que al atardecer o después se ven de noche).
const nightNames = new Map()
for (const night of D.night_experiences ?? []) {
  const base = night.name.replace(/\s*\(noche\)$|\s+de noche$/i, '')
  const place = (D.places ?? []).some((candidate) => candidate.name === base) ? base : night.conflicts_with?.[0] ?? base
  nightNames.set(place, night.name)
}
for (const place of D.places ?? []) if ((place.tags ?? []).includes('mirador') && !nightNames.has(place.name)) nightNames.set(place.name, `${place.name} (noche)`)

const esc = (text) => String(text ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const cell = (result, fallbackNote) => {
  // (Las fotos propias viven en public/fotos/: desde docs/, con la ruta relativa.)
  const url = result?.photo_source === 'propia' ? `../public${result.photo_small ?? result.photo_url}` : result?.unsplash_small ?? result?.photo_url
  if (!url) return '<div class="none">Sin foto</div>'
  const source = result.photo_source === 'unsplash' ? 'Unsplash' : result.photo_source === 'wikipedia' ? 'Wikipedia' : result.photo_source === 'propia' ? 'Foto propia' : result.photo_source
  const note = result.photo_night === false ? fallbackNote : ''
  return `<img src="${esc(url)}" loading="lazy" alt=""><div class="src">${esc(source)}${note ? ` · <b>${esc(note)}</b>` : ''}</div>`
}

const rows = []
const places = [...(D.places ?? [])].sort((x, y) => (x.level ?? 3) - (y.level ?? 3) || x.name.localeCompare(y.name, 'es'))
for (const place of places) {
  const day = await photo(place.name)
  const nightName = nightNames.get(place.name)
  // (La de noche, buscada de nuevo: la caché podía tener la de día de antes de esta regla.)
  const night = nightName ? await photo(nightName, true) : null
  rows.push(`<tr><td><div class="name">${esc(place.name)}</div><div class="lvl">Nivel ${place.level ?? 3}${nightName ? ` · de noche: ${esc(nightName)}` : ''}</div></td><td>${cell(day, '')}</td><td>${nightName ? cell(night, 'sin foto de noche: la de día del mismo lugar') : '<div class="none">No sale de noche</div>'}</td></tr>`)
  process.stdout.write('.')
}

const html = `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Fotos de Roma</title>
<style>
:root{--bg:#F5EFE4;--card:#FFFDF8;--ink:#1C2230;--soft:#6B6F7A;--accent:#B64E10}
body{margin:0;background:var(--bg);color:var(--ink);font:14px/1.4 system-ui,sans-serif;padding:16px}
h1{font:400 30px Georgia,serif;margin:0 0 4px}p{color:var(--soft);margin:0 0 16px}
table{width:100%;border-collapse:separate;border-spacing:0 10px}
td{background:var(--card);padding:10px;vertical-align:top}td:first-child{border-radius:14px 0 0 14px;width:30%}td:last-child{border-radius:0 14px 14px 0}
.name{font:400 18px Georgia,serif}.lvl{color:var(--soft);font-size:12px;margin-top:2px}
img{width:100%;max-width:320px;aspect-ratio:4/3;object-fit:cover;border-radius:10px;display:block}
.src{font-size:11px;color:var(--soft);margin-top:4px}.src b{color:var(--accent);font-weight:600}
.none{color:var(--soft);font-size:12px;padding:20px 0}
th{text-align:left;font:600 11px monospace;letter-spacing:.12em;text-transform:uppercase;color:var(--accent);padding:0 10px}
</style></head><body>
<h1>Fotos de Roma</h1>
<p>Cada lugar con su foto de día y, si sale de noche en alguna ruta (nocturnas y miradores), la de noche. Si no hay foto de noche, se usa la de día del mismo lugar, nunca la de otro sitio. Generado el ${new Date().toISOString().slice(0, 10)} con <code>scripts/destino/fotosRoma.mjs</code>.</p>
<table><thead><tr><th>Lugar</th><th>De día</th><th>De noche</th></tr></thead><tbody>
${rows.join('\n')}
</tbody></table></body></html>
`
writeFileSync(out, html)
console.log(`\n${out}: ${rows.length} lugares, ${nightNames.size} con foto de noche`)
