// Lista todo lo que el viajero puede ver en Roma y se queda sin foto (paradas de los días escritos, paseos, nocturnas, pool, excursiones).
//   node scripts/destino/auditarFotos.mjs [api=http://localhost:8787] [destino=roma]
import { readFileSync, readdirSync } from 'node:fs'

const a = Object.fromEntries(process.argv.slice(2).map((x) => x.split('=')))
const api = a.api ?? 'http://localhost:8787'
const dest = a.destino ?? 'roma'
const data = JSON.parse(readFileSync(`data/pipeline_v2/${dest}.json`, 'utf8'))
const city = data.destination ?? 'Roma'
const names = new Map() // nombre → de dónde sale
const add = (name, where) => {
  if (typeof name !== 'string' || !name.trim()) return
  if (!names.has(name)) names.set(name, new Set())
  names.get(name).add(where)
}
const walk = (node, where) => {
  if (Array.isArray(node)) node.forEach((x) => walk(x, where))
  else if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) {
      if (k === 'lugar' && typeof v === 'string') add(v, where)
      else walk(v, where)
    }
  }
}
for (const file of readdirSync(`data/dias/${dest}`).filter((f) => /^D\w+\.json$/.test(f))) walk(JSON.parse(readFileSync(`data/dias/${dest}/${file}`, 'utf8')), `día ${file.replace('.json', '')}`)
for (const place of data.places ?? []) add(place.name, place.is_filler ? 'paseo' : 'pool')
for (const w of Object.values(data.night_walks ?? {})) for (const stop of w.recorrido ?? []) add(stop, 'paseo nocturno')
for (const n of data.night_experiences ?? []) add(n.name, 'nocturna')
for (const zone of Object.values(data.destination_config?.paseo_libre?.zonas ?? {})) add(zone.foto, 'foto de «Pasea y piérdete»')
for (const o of data.excursions?.options ?? []) add(o.photo_name ?? o.name, 'excursión')
const pool = new Set((data.places ?? []).map((p) => p.name))

const missing = []
for (const [name, where] of names) {
  const res = await fetch(`${api}/api/place-photo`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, city }) }).then((r) => r.json()).catch(() => ({}))
  if (!res.photo_url) missing.push({ name, where: [...where].join(', '), source: res.photo_source ?? 'error', inPool: pool.has(name) })
}
console.log(`${names.size} nombres revisados, ${missing.length} sin foto:`)
for (const m of missing) console.log(`- ${m.name} [${m.where}] → ${m.source}`)
