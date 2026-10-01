// ¿Qué días repiten foto entre sus tarjetas? (PARA_CODE_TODO_2026-10-01, 5.2): TODAS las fuentes —propias, Unsplash y Wikipedia—,
// pidiendo las fotos a la API local. La regla: nunca la misma foto en dos tarjetas del mismo día.
//   node scripts/destino/fotosRepetidas.mjs [api=http://localhost:8787] [dias=2,3,4,5,6,7] [paso=1]
import { buildDayBlockV3 } from '../../server/engine/index.js'
import { findPipelineV2Data } from '../../server/routeAlgorithm.js'

const a = Object.fromEntries(process.argv.slice(2).map((x) => x.split('=')))
const api = a.api ?? 'http://localhost:8787'
const step = Number(a.paso ?? 1)
const lengths = (a.dias ?? '2,3,4,5,6,7').split(',').map(Number)
const D = findPipelineV2Data('Roma')
const addDays = (iso, n) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10)
const memo = new Map()
const photoUrl = async (name, date, excludeOwn = false) => {
  const key = `${name}|${excludeOwn ? 'sin_propia' : ''}|${date.slice(5, 7) >= '12' || date.slice(5, 7) === '01' ? date.slice(5) : 'x'}`
  // (La ventana de Navidad cambia la foto; el resto del año, no: se pide una vez por nombre y, en diciembre y enero, por fecha.)
  if (memo.has(key)) return memo.get(key)
  const result = await fetch(`${api}/api/place-photo`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, city: 'Roma', date, ...(excludeOwn ? { exclude_own: true } : {}) }) }).then((r) => r.json()).catch(() => ({}))
  const url = result.photo_source === 'none' ? null : result.photo_url ?? result.unsplash_small ?? null
  memo.set(key, url)
  return url
}
const found = new Map()
let days = 0
for (const dias of lengths) {
  for (let offset = 0; offset < 365; offset += step) {
    const fecha = addDays('2027-01-01', offset)
    for (let n = 1; n <= dias; n++) {
      let day
      try {
        day = await buildDayBlockV3(D, dias + 1, false, n, null, fecha, [], [], { city: 'Roma', scheduler: 'v3', month: null, engine: 'v4' })
      } catch {
        continue
      }
      if (!day?.stops) continue
      days++
      const date = addDays(fecha, n - 1)
      const urls = new Map()
      for (const stop of day.stops) {
        if (stop.is_break || (stop.is_free_walk && !stop.photo_name)) continue
        const base = stop.photo_name ?? stop.name
        const asked = stop.is_night_experience && !/\(noche\)$|\sde noche$/i.test(base) ? `${base} (noche)` : base
        const url = await photoUrl(asked, date, Boolean(stop.no_own_photo))
        if (!url) continue
        if (urls.has(url)) {
          const key = `${urls.get(url)} = ${stop.name}`
          const list = found.get(key) ?? []
          list.push(`${fecha} · ${dias} días, día ${n}`)
          found.set(key, list)
        } else urls.set(url, stop.name)
      }
    }
  }
}
console.log(`${days} días mirados; ${[...found.values()].reduce((sum, list) => sum + list.length, 0)} repeticiones`)
for (const [key, list] of [...found.entries()].sort((x, y) => y[1].length - x[1].length)) console.log(`${String(list.length).padStart(5)}  ${key}  ← ${list.slice(0, 2).join(' | ')}`)
