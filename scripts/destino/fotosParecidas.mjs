// ¿Dos paradas que pueden salir el mismo día llevan fotos iguales o muy parecidas? (3-oct-2026)
//   node scripts/destino/fotosParecidas.mjs [umbral=12]
// Usa las fotos pequeñas de docs/fotos_revision/ (las deja fotosRevision.mjs) y sus huellas (docs/_huellas.json, de huellas.ps1): la huella de una
// foto son 64 bits; cuantos menos bits distintos, más se parecen (0 = iguales, ≤ 10 = casi la misma). «El mismo día» = salen en el mismo día escrito
// (data/dias/<destino>/D*.json), con cualquiera de sus variantes: es lo más estricto que cabe.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const threshold = Number((process.argv.find((a) => a.startsWith('umbral=')) ?? 'umbral=12').split('=')[1])
execFileSync('powershell', ['-NoProfile', '-File', 'scripts/destino/huellas.ps1', 'docs/fotos_revision', 'docs/_huellas.json'], { stdio: 'ignore' })
const hashes = JSON.parse(readFileSync('docs/_huellas.json', 'utf8').replace(/^﻿/, ''))
const safe = (name) => name.replace(/[\/:*?"<>|]/g, ' ').replace(/\s+/g, ' ').trim()
const hashOf = (name) => hashes[`${safe(name)}.jpg`]
const distance = (a, b) => [...a].reduce((sum, bit, i) => sum + (bit === b[i] ? 0 : 1), 0)

const names = new Set(Object.keys(hashes).map((file) => file.replace(/\.jpg$/, '')))
const strings = (node, out) => {
  if (typeof node === 'string') out.add(node)
  else if (Array.isArray(node)) node.forEach((item) => strings(item, out))
  else if (node && typeof node === 'object') Object.values(node).forEach((item) => strings(item, out))
  return out
}
const days = []
for (const file of readdirSync('data/dias/roma').filter((f) => /^D.*\.json$/.test(f))) {
  const all = strings(JSON.parse(readFileSync(`data/dias/roma/${file}`, 'utf8')), new Set())
  days.push({ file, names: [...all].filter((s) => names.has(safe(s))).map(safe) })
}
const NEW = (process.argv.find((a) => a.startsWith('nuevas=')) ?? '').split('=')[1]?.split('|').map(safe) ?? [...names]
const found = []
for (const day of days) {
  for (const a of day.names) {
    if (!NEW.includes(a)) continue
    for (const b of day.names) {
      if (a >= b && NEW.includes(b)) continue
      if (a === b) continue
      const d = distance(hashOf(a), hashOf(b))
      if (d <= threshold) found.push({ dia: day.file, a, b, d })
    }
  }
}
const seen = new Set()
const unique = found.filter((f) => {
  const key = [f.a, f.b].sort().join('||')
  if (seen.has(key)) return false
  seen.add(key)
  return true
}).sort((x, y) => x.d - y.d)
writeFileSync('docs/_fotos_parecidas.json', JSON.stringify(unique, null, 1))
console.log(`${unique.length} parejas con huella a ${threshold} bits o menos:`)
for (const f of unique) console.log(`${String(f.d).padStart(2)} bits · ${f.a}  ↔  ${f.b}  (${f.dia})`)
