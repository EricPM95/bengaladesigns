// La hoja de contactos de las fotos de un destino (3-oct-2026): docs/FOTOS_ROMA_REVISION.html + docs/fotos_revision/.
//   node scripts/destino/fotosRevision.mjs [destino=roma]
// SOLO MIRA: no cambia ninguna foto, no escribe en la caché y no llama a Unsplash. Para cada lugar sigue el mismo orden que /api/place-photo:
//   sin_foto → foto propia (_fotos.json) → «(noche)» con su caché «noche:» → caché compartida (Unsplash / Wikipedia / «none»).
// Lo que no está en la caché todavía se marca «sin consultar»: la app lo busca la primera vez que alguien lo abre.
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join } from 'node:path'
import { ownPhotoFile, photosFor } from '../../server/engine/writtenDays.js'

const key = (process.argv[2] ?? 'roma').split('=').pop()
const data = JSON.parse(readFileSync(`data/pipeline_v2/${key}.json`, 'utf8'))
const table = photosFor(key)
const OUT_DIR = 'docs/fotos_revision'
mkdirSync(OUT_DIR, { recursive: true })

// ── la caché compartida (solo lectura, con la misma clave pública que usa la app) ─────────────────────────────────────────────
const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split(/\r?\n/)
    .filter((line) => line.includes('=') && !line.startsWith('#'))
    .map((line) => [line.slice(0, line.indexOf('=')).trim(), line.slice(line.indexOf('=') + 1).trim()]),
)
const cache = new Map()
for (let from = 0; ; from += 1000) {
  const response = await fetch(`${env.VITE_SUPABASE_URL}/rest/v1/place_photo_cache?city=eq.${key}&select=place_name,photo_source,photo_url,unsplash_small,unsplash_regular,unsplash_photographer&order=place_name`, {
    headers: { apikey: env.VITE_SUPABASE_ANON_KEY, Authorization: `Bearer ${env.VITE_SUPABASE_ANON_KEY}`, Range: `${from}-${from + 999}` },
  })
  if (!response.ok) throw new Error(`caché ${response.status}`)
  const rows = await response.json()
  for (const row of rows) cache.set(row.place_name, row)
  if (rows.length < 1000) break
}

// ── los nombres, tal como los pide la app ───────────────────────────────────────────────────────────────────────────────────
const entries = new Map() // nombre → { nombre, categoria, pide?, nota? }
const add = (nombre, categoria, extra = {}) => {
  if (!nombre || entries.has(nombre)) return
  entries.set(nombre, { nombre, categoria, ...extra })
}
const CATEGORY_OF_FILTER = { monumentos: 'Paradas · Monumentos', museos_arte: 'Paradas · Museos y arte', iglesias: 'Paradas · Iglesias', miradores: 'Miradores' }
for (const place of data.places) add(place.name, CATEGORY_OF_FILTER[place.filter_category] ?? 'Paradas · Otras')
for (const restaurant of data.restaurants ?? []) add(restaurant.name, 'Restaurantes')
for (const option of data.excursions?.options ?? []) add(option.photo_name ?? option.name, 'Excursiones', { titulo: option.name, pide: option.photo_name ?? option.name })
for (const night of data.night_experiences ?? []) add(night.name, 'Nocturnas')
for (const walk of Object.values(data.night_walks ?? {})) for (const name of walk.recorrido ?? []) add(name, 'Nocturnas')
for (const walk of data.zone_walks ?? []) add(walk.name, 'Paseos')

// Los días escritos: «De camino» (modo camino) y cualquier lugar que no esté en el catálogo.
const diasDir = `data/dias/${key}`
const camino = new Set()
const lugaresDias = new Set()
const walkDays = (node) => {
  if (Array.isArray(node)) return node.forEach(walkDays)
  if (node && typeof node === 'object') {
    if (typeof node.lugar === 'string') {
      lugaresDias.add(node.lugar)
      if (node.modo === 'camino') camino.add(node.lugar)
    }
    for (const value of Object.values(node)) walkDays(value)
  }
}
for (const file of readdirSync(diasDir)) if (/^D.*\.json$/.test(file)) walkDays(JSON.parse(readFileSync(join(diasDir, file), 'utf8')))
// «De camino» manda sobre la categoría de parada: es como la ve el viajero (una mini-tarjeta con foto redonda).
for (const name of camino) {
  const previous = entries.get(name)
  entries.set(name, { nombre: name, categoria: 'De camino', ...(previous ? { tambien: previous.categoria } : {}) })
}
for (const name of lugaresDias) add(name, 'Otros lugares de los días')

// Las tarjetas de Explorar (la foto de cada una).
const attractions = data.places.filter((p) => ['monumentos', 'museos_arte', 'iglesias'].includes(p.filter_category))
const bestLevel = (list) => [...list].sort((a, b) => (a.level ?? 9) - (b.level ?? 9))[0]
const cards = [
  ['Explorar · Atracciones', bestLevel(attractions)?.name],
  ['Explorar · Miradores', bestLevel(data.places.filter((p) => p.filter_category === 'miradores'))?.name],
  ['Explorar · Entradas', bestLevel(data.places.filter((p) => p.ticket_info || p.reservation))?.name],
  ['Explorar · Restaurantes', 'Trattoria'],
  ['Explorar · Baños', 'Baños públicos'],
  ['Explorar · Fuentes', 'Nasoni de Roma'],
  ['Explorar · Excursiones', data.excursions?.options?.[0]?.photo_name ?? data.excursions?.options?.[0]?.name],
]
const cardNotes = []
for (const [label, name] of cards) {
  if (!name) continue
  cardNotes.push({ label, name })
  const previous = entries.get(name)
  if (previous) entries.set(name, { ...previous, tarjetaExplorar: label })
  else entries.set(name, { nombre: name, categoria: 'Tarjetas de Explorar', tarjetaExplorar: label })
}

// Otros nombres con foto propia que ninguna lista de arriba trae (nocturnas de Navidad, «Trastevere de noche»…).
for (const foto of table?.fotos ?? []) for (const name of foto.lugares ?? []) add(name, 'Otros nombres con foto propia')

// ── de dónde sale la foto de cada uno ──────────────────────────────────────────────────────────────────────────────────────
const hidden = new Set(table?.sin_foto ?? [])
const nightBase = (name) => {
  const match = String(name).match(/^(.*?)(?:\s*\(noche\)|\s+de noche)$/i)
  if (!match) return null
  const base = match[1].trim()
  if (data.places.some((p) => p.name === base)) return base
  return (data.night_experiences ?? []).find((n) => n.name === name)?.conflicts_with?.[0] ?? base
}
const fromRow = (row) => {
  if (!row || row.photo_source === 'none') return { fuente: 'sin', detalle: 'se buscó y no hay (color neutro)' }
  if (row.photo_source === 'unsplash') return { fuente: 'unsplash', tarjeta: row.unsplash_small ?? row.photo_url, ficha: row.unsplash_regular ?? row.photo_url, detalle: row.photo_url, autor: row.unsplash_photographer }
  if (row.photo_source === 'wikipedia') return { fuente: 'wikipedia', tarjeta: row.photo_url, ficha: row.photo_url, detalle: row.photo_url }
  return { fuente: 'otra', detalle: row.photo_source }
}
const resolve = (name) => {
  if (hidden.has(name)) return { fuente: 'sin', detalle: 'va sin foto a propósito (sin_foto en _fotos.json)' }
  const own = ownPhotoFile(table, name, null)
  if (own) return { fuente: 'propia', archivo: own.archivo, tarjeta: `public/fotos/${key}/${own.archivo.replace(/\.jpg$/, '_p.jpg')}`, ficha: `public/fotos/${key}/${own.archivo}`, detalle: `public/fotos/${key}/${own.archivo}`, noche: own.cuando === 'noche' }
  const base = nightBase(name)
  if (base) {
    const row = cache.get(`noche:${base}`)
    if (row) return { ...fromRow(row), via: `caché «noche:${base}»` }
    return { fuente: 'sin consultar', detalle: `la app la busca al abrirla (noche de ${base})` }
  }
  if (!cache.has(name)) return { fuente: 'sin consultar', detalle: 'la app la busca la primera vez que alguien la abre' }
  return fromRow(cache.get(name))
}

// ── las fotos pequeñas en docs/fotos_revision/ ─────────────────────────────────────────────────────────────────────────────
const safe = (name) => name.replace(/[\\/:*?"<>|]/g, ' ').replace(/\s+/g, ' ').trim()
const resizeScript = 'scripts/destino/redimensionar.ps1'
const smallFile = async (name, info) => {
  if (!info.tarjeta) return null
  const target = `${OUT_DIR}/${safe(name)}.jpg`
  if (existsSync(target)) return target
  let source = info.tarjeta
  if (/^https?:/.test(source)) {
    const response = await fetch(source, { headers: { 'user-agent': 'route-planner-contact-sheet/1.0' } })
    if (!response.ok) return null
    const tmp = `${OUT_DIR}/_tmp_${Date.now()}.jpg`
    writeFileSync(tmp, Buffer.from(await response.arrayBuffer()))
    source = tmp
  }
  try {
    execFileSync('powershell', ['-NoProfile', '-File', resizeScript, source, target, '400'], { stdio: 'ignore' })
  } catch {
    copyFileSync(source, target)
  }
  return target
}

const rows = []
for (const entry of entries.values()) {
  const info = resolve(entry.nombre)
  const small = await smallFile(entry.nombre, info)
  rows.push({ ...entry, ...info, small })
}
// los _tmp
for (const file of readdirSync(OUT_DIR)) if (file.startsWith('_tmp_')) (await import('node:fs')).unlinkSync(join(OUT_DIR, file))

// ── la página ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
const ORDER = [
  'Paradas · Monumentos',
  'Paradas · Museos y arte',
  'Paradas · Iglesias',
  'Paradas · Otras',
  'Miradores',
  'De camino',
  'Restaurantes',
  'Excursiones',
  'Nocturnas',
  'Paseos',
  'Tarjetas de Explorar',
  'Otros lugares de los días',
  'Otros nombres con foto propia',
]
const esc = (text) => String(text ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const LABEL = { propia: 'Foto propia', unsplash: 'Unsplash', wikipedia: 'Wikipedia', sin: 'Sin foto', 'sin consultar': 'Sin consultar', otra: 'Otra' }
const asset = (path) => (path.startsWith('http') ? path : encodeURI(path.startsWith('fotos_revision/') ? path : `../${path}`))
const card = (row) => {
  const tag = LABEL[row.fuente] ?? row.fuente
  const detail = row.fuente === 'propia' ? row.archivo : row.detalle
  const link = /^https?:/.test(row.detalle ?? '') ? `<a href="${esc(row.detalle)}" target="_blank" rel="noopener">enlace</a>` : esc(detail)
  const thumb = (src, label) => (src ? `<figure><img loading="lazy" src="${esc(asset(src))}" alt=""><figcaption>${label}</figcaption></figure>` : `<figure class="empty"><span>sin foto</span><figcaption>${label}</figcaption></figure>`)
  const smallSrc = row.small ? row.small.replace(/^docs\//, '') : null
  return `<article class="card f-${row.fuente.replace(' ', '-')}">
  <h3>${esc(row.nombre)}</h3>
  ${row.titulo ? `<p class="sub">${esc(row.titulo)}</p>` : ''}
  ${row.tarjetaExplorar ? `<p class="sub">Tarjeta de ${esc(row.tarjetaExplorar)}</p>` : ''}
  ${row.tambien ? `<p class="sub">También es: ${esc(row.tambien)}</p>` : ''}
  <div class="thumbs">${thumb(smallSrc, 'tarjeta')}${thumb(row.ficha, 'ficha')}</div>
  <p class="src"><b class="tag">${tag}</b>${row.noche ? ' · de noche' : ''}${row.autor ? ` · ${esc(row.autor)}` : ''}</p>
  <p class="det">${link}${row.via ? ` · ${esc(row.via)}` : ''}</p>
</article>`
}
const byCategory = new Map()
for (const row of rows) {
  if (!byCategory.has(row.categoria)) byCategory.set(row.categoria, [])
  byCategory.get(row.categoria).push(row)
}
const counts = { total: rows.length, propia: 0, unsplash: 0, wikipedia: 0, sin: 0, 'sin consultar': 0, otra: 0 }
for (const row of rows) counts[row.fuente] = (counts[row.fuente] ?? 0) + 1
const sections = ORDER.filter((c) => byCategory.has(c))
  .concat([...byCategory.keys()].filter((c) => !ORDER.includes(c)))
  .map((category) => {
    const list = byCategory.get(category).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
    return `<section><h2>${esc(category)} <small>${list.length}</small></h2><div class="grid">${list.map(card).join('\n')}</div></section>`
  })
  .join('\n')

const html = `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Fotos de ${esc(data.destination)} · revisión</title>
<style>
  :root{--ink:#1c2230;--muted:#6b7280;--line:#e5ddcc;--bg:#f5efe4}
  *{box-sizing:border-box}body{margin:0;font:14px/1.4 system-ui,sans-serif;color:var(--ink);background:var(--bg);padding:24px}
  h1{font:400 34px Georgia,serif;margin:0 0 6px}h2{font:400 24px Georgia,serif;margin:34px 0 12px;border-bottom:1px solid var(--line);padding-bottom:6px}h2 small{font:600 12px system-ui;color:var(--muted);margin-left:8px}
  .resumen{display:flex;flex-wrap:wrap;gap:10px;margin:14px 0}.resumen span{background:#fff;border:1px solid var(--line);border-radius:999px;padding:6px 12px}
  .nota{color:var(--muted);max-width:760px}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px}
  .card{background:#fff;border:1px solid var(--line);border-radius:14px;padding:12px;display:flex;flex-direction:column;gap:6px}
  .card h3{margin:0;font:400 18px Georgia,serif}.sub{margin:0;color:var(--muted);font-size:12px}
  .thumbs{display:flex;gap:8px}.thumbs figure{margin:0;flex:1;min-width:0}.thumbs img{width:100%;height:96px;object-fit:cover;border-radius:8px;display:block;background:#eee}
  .thumbs figcaption{font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-top:2px}
  .empty span{display:flex;align-items:center;justify-content:center;height:96px;border-radius:8px;background:#ece7dc;color:var(--muted);font-size:12px}
  .src,.det{margin:0;font-size:12px;word-break:break-all}.det{color:var(--muted)}
  .tag{border-radius:999px;padding:2px 9px;background:#eee}
  .f-propia .tag{background:#dff0e0}.f-unsplash .tag{background:#e0eaf6}.f-wikipedia .tag{background:#f3ecd2}.f-sin .tag{background:#f6d9d6}.f-sin-consultar .tag{background:#ece7dc}
</style></head><body>
<h1>Fotos de ${esc(data.destination)} · revisión</h1>
<p class="nota">Hoja de contactos generada el ${new Date().toISOString().slice(0, 10)} con <code>node scripts/destino/fotosRevision.mjs</code>. Solo para mirar: no cambia ninguna foto. En cada lugar, a la izquierda la foto de la tarjeta y a la derecha la de la ficha, tal como las enseña hoy la app. «Sin consultar» = todavía no está en la caché compartida; la app la busca la primera vez que alguien la abre.</p>
<div class="resumen"><span><b>${counts.total}</b> lugares</span><span><b>${counts.propia}</b> foto propia</span><span><b>${counts.unsplash}</b> Unsplash</span><span><b>${counts.wikipedia}</b> Wikipedia</span><span><b>${counts.sin}</b> sin foto</span><span><b>${counts['sin consultar']}</b> sin consultar</span></div>
${sections}
</body></html>
`
writeFileSync('docs/FOTOS_ROMA_REVISION.html', html)
console.log(JSON.stringify(counts))
console.log([...byCategory].map(([c, l]) => `${c}: ${l.length}`).join('\n'))
