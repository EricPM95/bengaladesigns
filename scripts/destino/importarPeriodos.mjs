/**
 * Importa horarios POR PERIODO a un destino (kit de nuevo destino; Estaciones, Parte 2).
 *
 *   node scripts/destino/importarPeriodos.mjs roma docs/roma_horarios_por_periodo.json
 *
 * Formato de entrada (ver su `_formato`): `places` es un objeto por nombre de lugar con
 *   - `by_period`: [{ from: "MM-DD", to: "MM-DD", windows: [...], last_entry: "HH:MM" | null }] que
 *     cubre el año entero (un periodo puede cruzar el año). `windows` admite "sunset" como hora.
 *   - `closed_dates`: ["12-25", ...] (solo se aplican con fechas), `closed_on` (días de la semana).
 *   - `confianza`, `fuente`, `_nota`.
 *   `_formato.fecha_auditoria`: la fecha de la auditoría (validar.mjs avisa si el viaje es de otro año).
 *
 * En el JSON del destino:
 *   - `by_period` y `closed_dates` se guardan tal cual; `closed_on` también si viene.
 *   - `by_season` NO se borra: se queda de reserva para destinos o motores sin periodos.
 *   - `confianza`, `fuente` y `_nota` van en `hours_audit` ({ confianza, fuente, nota, fecha }), para
 *     que salgan en cualquier export de horarios.
 *   - Un lugar con `by_period: null` (no se pudo verificar) NO se toca.
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..')
const [destino, inputPath] = process.argv.slice(2)
if (!destino || !inputPath) {
  console.error('Uso: node scripts/destino/importarPeriodos.mjs <destino> <horarios_por_periodo.json>')
  process.exit(2)
}
const destPath = join(ROOT, `data/pipeline_v2/${destino.toLowerCase()}.json`)
const raw = readFileSync(destPath, 'utf8')
const D = JSON.parse(raw)
const audit = JSON.parse(readFileSync(join(ROOT, inputPath), 'utf8'))
const auditDate = audit._formato?.fecha_auditoria ?? null

const report = { updated: [], skipped: [], notFound: [] }
for (const [name, entry] of Object.entries(audit.places ?? {})) {
  const place = D.places.find((p) => p.name === name)
  if (!place) {
    report.notFound.push(name)
    continue
  }
  if (!Array.isArray(entry.by_period)) {
    report.skipped.push(`${name} (${entry._nota ?? 'sin by_period'})`)
    continue
  }
  place.by_period = entry.by_period.map((period) => ({ from: period.from, to: period.to, windows: period.windows, last_entry: period.last_entry ?? null }))
  if (Array.isArray(entry.closed_dates)) place.closed_dates = entry.closed_dates
  if (Array.isArray(entry.closed_on)) place.closed_on = entry.closed_on
  place.hours_audit = { confianza: entry.confianza ?? null, fuente: entry.fuente ?? null, nota: entry._nota ?? null, fecha: auditDate }
  report.updated.push({ name, periods: place.by_period.length, closed: place.closed_dates ?? [], confianza: entry.confianza })
}

let out = JSON.stringify(D, null, 2) + (raw.endsWith('\n') ? '\n' : '')
if (raw.includes('\r\n')) out = out.replace(/\n/g, '\r\n')
writeFileSync(destPath, out)

console.log(`${report.updated.length} lugares con horario por periodo en ${destPath}`)
for (const row of report.updated) console.log(`  · ${row.name.padEnd(40)} ${row.periods} periodos${row.closed.length ? `, cierra ${row.closed.join(', ')}` : ''} [${row.confianza}]`)
if (report.skipped.length) console.log(`\nSin tocar: ${report.skipped.join(' | ')}`)
if (report.notFound.length) console.log(`\nSin lugar en el destino: ${report.notFound.join(', ')}`)
