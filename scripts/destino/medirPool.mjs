// Lo que pide la pantalla del pool de lugares (paso 7 de PARA_CODE_TODO_2026-10-01): peticiones, bytes y tiempos, la primera vez y la
// segunda, contra la API local. Con `4g=1`, además, lo que tardaría en un móvil con 4G (1,6 Mbps de bajada y 150 ms por petición, de
// seis en seis).
//   node scripts/destino/medirPool.mjs [antes|despues] [api=http://localhost:8787] [web=http://localhost:5173] [4g=1]
// antes:   una petición por foto (lo que hacía la pantalla) y nada guardado entre una vez y la siguiente.
// despues: la lista y las fotos ligeras en una petición cada una, guardadas en el navegador; la segunda vez, solo preguntar si cambió la
//          versión de los datos (pocos bytes) y las fotos salen del navegador.
const args = process.argv.slice(2)
const mode = args.includes('antes') ? 'antes' : 'despues'
const a = Object.fromEntries(args.filter((x) => x.includes('=')).map((x) => x.split('=')))
const api = a.api ?? 'http://localhost:8787'
const web = a.web ?? 'http://localhost:5173'
const post = async (path, body) => {
  const t0 = performance.now()
  const res = await fetch(`${api}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  const text = await res.text()
  return { ms: performance.now() - t0, bytes: Buffer.byteLength(text), json: JSON.parse(text) }
}
const size = async (url) => {
  try {
    const res = await fetch(url.startsWith('http') ? url : `${web}${url}`, { headers: { Range: 'bytes=0-0' } })
    const range = res.headers.get('content-range')
    return range ? Number(range.split('/')[1]) : Number(res.headers.get('content-length') ?? 0)
  } catch {
    return 0
  }
}
const report = (label, count, total, photoBytes, ms) => {
  const t4g = (count * 150) / 6 + ((total * 8) / 1_600_000) * 1000
  console.log(`${label}: ${count} peticiones · ${(total / 1024).toFixed(0)} KB (fotos ${(photoBytes / 1024).toFixed(0)} KB) · local ${ms.toFixed(0)} ms${a['4g'] ? ` · en 4G ≈ ${(t4g / 1000).toFixed(1)} s` : ''}`)
}

const t0 = performance.now()
const pool = await post('/api/curated-places-pool', { destination: 'Roma', level: 'pool' })
const names = pool.json.places.map((place) => place.name)
let count = 1
let total = pool.bytes
let photoBytes = 0

if (mode === 'antes') {
  const photos = await Promise.all(names.map(async (name) => ({ name, r: await post('/api/place-photo', { name, city: 'Roma' }) })))
  for (const { r } of photos) {
    count++
    total += r.bytes
    const url = r.json.photo_source === 'propia' ? r.json.photo_small ?? r.json.photo_url : r.json.unsplash_small ?? r.json.photo_url
    if (url) {
      photoBytes += await size(url)
      count++
    }
  }
  total += photoBytes
  report(`ANTES · 1.ª vez (${names.length} lugares)`, count, total, photoBytes, performance.now() - t0)
  report('ANTES · 2.ª vez (la lista guardada; las fotos, otra vez)', count - 1, total - pool.bytes, photoBytes, performance.now() - t0)
} else {
  const batch = await post('/api/pool-photos', { destination: 'Roma', names })
  count++
  total += batch.bytes
  for (const entry of Object.values(batch.json.photos)) {
    photoBytes += await size(entry.url)
    count++
  }
  total += photoBytes
  report(`DESPUÉS · 1.ª vez (${names.length} lugares; las fotos, mientras se rellenan los pasos de antes)`, count, total, photoBytes, performance.now() - t0)
  const t1 = performance.now()
  const revalidate = await post('/api/curated-places-pool', { destination: 'Roma', level: 'pool', have_version: pool.json.data_version })
  report('DESPUÉS · 2.ª vez (lista y fotos del navegador; solo se pregunta si cambió)', 1, revalidate.bytes, 0, performance.now() - t1)
  console.log(`  (la pantalla del pool, al llegar a ella: 0 peticiones, ${Object.keys(batch.json.photos).length}/${names.length} fotos ya guardadas)`)
}
