/**
 * Importa horarios auditados a un destino (kit de nuevo destino).
 *
 *   node scripts/destino/importarHorarios.mjs roma C:/ruta/roma_horarios_auditados.json
 *
 * Formato de entrada (ver su `_formato`): por lugar, `windows` (franjas válidas todos los días que
 * abre, todo el año: el valor prudente), `by_season`, `by_day`, `last_entry` ("HH:MM" o un objeto
 * por época / por franja), `closed_on`, `reservation` (obligatoria | recomendada | no), `card_text`
 * (texto para la ficha) y `other_field_changes`.
 *
 * En el JSON del destino:
 *   - `windows`, `by_season`, `by_day`, `last_entry`, `closed_on`, `reservation`, `card_text` se
 *     guardan tal cual. `by_season` y `by_day` todavía no los usa el motor (los usará cuando sepa la
 *     época y las fechas del viaje).
 *   - `schedule` (el texto que leen el motor y la app) pasa a ser las `windows` unidas. Un sitio
 *     abierto siempre ("00:00-24:00") se queda sin `schedule`: acceso libre.
 *   - `other_field_changes.requires_ticket = false` -> `is_free_access: true` (requires_ticket es
 *     derivado, ver invariante 24).
 * Los lugares se buscan por nombre y, si no, por id (el nombre sin tildes en minúsculas con "_").
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..')
const [destino, inputPath] = process.argv.slice(2)
if (!destino || !inputPath) {
  console.error('Uso: node scripts/destino/importarHorarios.mjs <destino> <horarios.json>')
  process.exit(2)
}
const destPath = join(ROOT, `data/pipeline_v2/${destino.toLowerCase()}.json`)
const D = JSON.parse(readFileSync(destPath, 'utf8'))
const audit = JSON.parse(readFileSync(inputPath, 'utf8'))

const idOf = (name) =>
  String(name)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')

const ALWAYS_OPEN = /^00:00\s*-\s*24:00$/
const report = { updated: [], notFound: [] }
for (const entry of audit.places ?? []) {
  const place = D.places.find((p) => p.name === entry.name) ?? D.places.find((p) => idOf(p.name) === entry.id)
  if (!place) {
    report.notFound.push(entry.id)
    continue
  }
  const before = place.schedule ?? null
  const windows = Array.isArray(entry.windows) ? entry.windows : []
  place.windows = windows
  if (windows.length === 0 || windows.every((w) => ALWAYS_OPEN.test(w))) delete place.schedule
  else place.schedule = windows.join(', ')
  for (const key of ['by_season', 'by_day']) {
    if (entry[key]) place[key] = entry[key]
    else delete place[key]
  }
  if (entry.last_entry) place.last_entry = entry.last_entry
  else delete place.last_entry
  place.closed_on = Array.isArray(entry.closed_on) ? entry.closed_on : []
  if (entry.reservation) place.reservation = entry.reservation
  if (entry.card_text) place.card_text = entry.card_text
  if (entry.other_field_changes?.requires_ticket === false) place.is_free_access = true
  if (entry.other_field_changes?.requires_ticket === true) place.is_free_access = false
  report.updated.push({ name: place.name, before, after: place.schedule ?? '(siempre abierto)', last_entry: place.last_entry ?? null, confidence: entry.confidence })
}
writeFileSync(destPath, JSON.stringify(D, null, 2))

console.log(`${report.updated.length} lugares actualizados en ${destPath}`)
for (const row of report.updated) {
  const changed = row.before !== row.after
  console.log(`${changed ? '·' : ' '} ${row.name.padEnd(48)} ${String(row.before ?? '—').slice(0, 60).padEnd(60)} → ${row.after}${row.last_entry ? ` (últ. ${JSON.stringify(row.last_entry)})` : ''} [${row.confidence}]`)
}
if (report.notFound.length) console.log(`\nSin lugar en el destino: ${report.notFound.join(', ')}`)
