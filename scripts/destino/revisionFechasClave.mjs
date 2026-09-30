/**
 * Revisión de las fechas clave de los viajeros españoles (docs/METODO_DESTINOS.md): el viaje típico de cada puente y
 * festivo del curso, con y sin Free Tour, parada a parada y con horas, para revisarlos como un local. Las fechas salen
 * del calendario real (fechasClave.mjs). Navidad y Reyes tienen su propia revisión (revisionNavidad.mjs).
 *   node scripts/destino/revisionFechasClave.mjs [curso=2026] [docs/revision/FECHAS_CLAVE_ROMA.md]
 */
import { fechasClaveDelCurso } from './fechasClave.mjs'

const curso = Number((process.argv.find((arg) => arg.startsWith('curso=')) ?? 'curso=2026').split('=')[1])
const out = process.argv.slice(2).find((arg) => !arg.includes('=')) ?? 'docs/revision/FECHAS_CLAVE_ROMA.md'
globalThis.__REVISION_VIAJES = fechasClaveDelCurso(curso).flatMap((item) => item.viajes.flatMap((viaje) => [false, true].map((ft) => ({ dias: viaje.dias, ft, exps: [], fecha: viaje.fecha, nota: viaje.nota }))))
globalThis.__REVISION_SCRIPT = 'scripts/destino/revisionFechasClave.mjs'
globalThis.__REVISION_TITULO = `# Roma en las fechas clave de los viajeros españoles (curso ${curso}-${String(curso + 1).slice(2)}): ${globalThis.__REVISION_VIAJES.length} viajes para revisar como un local`
if (process.env.ROUTE_ENGINE && process.env.ROUTE_ENGINE.toLowerCase() !== 'v4') throw new Error(`ROUTE_ENGINE=${process.env.ROUTE_ENGINE}: esta revisión es de v4`)
process.argv[2] = out
await import('./revision20.mjs')
