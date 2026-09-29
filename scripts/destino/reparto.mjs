// El reparto de lugares de los días escritos: en qué día, mitad, versión, variante, experiencia o sitio del pool va cada
// lugar de nivel 1 y 2 (y los de nivel 3 que salen), y los que no tienen sitio. Lee data/dias/<destino>/.
//   node scripts/destino/reparto.mjs [out=docs/REPARTO_ROMA.md]
import { writeFileSync } from 'node:fs'
import { findPipelineV2Data } from '../../server/routeAlgorithm.js'
import { writtenDaysFor } from '../../server/engine/writtenDays.js'

const a = Object.fromEntries(process.argv.slice(2).map((x) => x.split('=')))
const D = findPipelineV2Data('Roma')
const written = writtenDaysFor('roma')
const sites = new Map()
const add = (name, where) => {
  if (!name) return
  sites.set(name, [...(sites.get(name) ?? []), where])
}
const describe = (stop) => (stop.modo && stop.modo !== 'parada' ? ` (${stop.modo})` : '')
const walkOps = (ops, prefix) => {
  for (const [target, op] of Object.entries(ops ?? {})) {
    if (!op || typeof op !== 'object' || target.startsWith('_')) continue
    for (const stop of op.paradas ?? []) add(stop.lugar, `${prefix} ${target}${describe(stop)}`)
    for (const stop of Object.values(op.cambiar ?? {})) add(stop.lugar, `${prefix} ${target}${describe(stop)}`)
    for (const insert of op.insertar ?? []) add(insert.parada?.lugar, `${prefix} ${target}${describe(insert.parada ?? {})}`)
  }
}
for (const day of Object.values(written.days)) {
  for (const stop of day.manana?.paradas ?? []) add(stop.lugar, `${day.id} mañana${stop.tipo === 'opcional' ? ' (opcional)' : ''}${describe(stop)}`)
  for (const v of ['A', 'B', 'C', 'D']) {
    const version = day.tarde?.[v]
    if (!version || typeof version === 'string' || typeof version.paradas === 'string') continue
    for (const stop of version.paradas) add(stop.lugar, `${day.id} tarde ${v}${describe(stop)}${stop.si_dia ? ` (si el viaje tiene ${stop.si_dia.join('/')})` : ''}`)
  }
  for (const [key, ops] of Object.entries(day.variantes ?? {})) walkOps(ops, `${day.id} variante ${key}:`)
  for (const [key, ops] of Object.entries(day.experiencias ?? {})) walkOps(ops, `${day.id} experiencia ${key}:`)
}
for (const [name, entry] of Object.entries(written.destino?.pool ?? {})) {
  if (name.startsWith('_')) continue
  for (const site of entry.sitios ?? []) walkOps(site.cambios, `pool «${name}» en ${site.dia}:`)
}
const nights = new Set((D.night_experiences ?? []).flatMap((entry) => entry.conflicts_with ?? []))
const tour = new Set(D.default_free_tour?.covers ?? [])
const lines = ['# Reparto de lugares (días escritos de Roma)', '', 'Generado por `scripts/destino/reparto.mjs` desde `data/dias/roma/`. Cada lugar, dónde va escrito.', '']
for (const level of [1, 2, 3]) {
  const places = (D.places ?? []).filter((place) => place.level === level).sort((x, y) => x.name.localeCompare(y.name, 'es'))
  const without = places.filter((place) => !sites.has(place.name))
  lines.push(`## Nivel ${level} (${places.length} lugares, ${without.length} sin sitio escrito)`, '')
  for (const place of places) {
    const list = sites.get(place.name)
    const extra = [nights.has(place.name) ? 'de noche' : null, tour.has(place.name) ? 'en el Free Tour' : null].filter(Boolean)
    if (list) {
      const uniq = [...new Set(list)]
      lines.push(`- **${place.name}**: ${uniq.slice(0, 8).join(' · ')}${uniq.length > 8 ? ` · y ${uniq.length - 8} más` : ''}${extra.length ? ` · también ${extra.join(' y ')}` : ''}`)
    } else if (written.destino?.solo_explorar?.[place.name]) lines.push(`- **${place.name}**: solo en Explorar, a propósito: ${written.destino.solo_explorar[place.name]}`)
    else if (level <= 2) lines.push(`- **${place.name}**: ⚠ SIN SITIO${extra.length ? ` (solo ${extra.join(' y ')})` : ''}`)
    else lines.push(`- ${place.name}: Explorar y sugerencias${extra.length ? ` · ${extra.join(' y ')}` : ''}`)
  }
  lines.push('')
}
writeFileSync(a.out ?? 'docs/REPARTO_ROMA.md', lines.join('\n') + '\n')
console.log('sin sitio:', (D.places ?? []).filter((place) => place.level <= 2 && !sites.has(place.name) && !written.destino?.solo_explorar?.[place.name]).map((place) => place.name).join(', ') || 'ninguno')
