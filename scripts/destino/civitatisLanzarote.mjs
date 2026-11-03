// LZ1 (agente D): resuelve en la API de Civitatis (sandbox) los enlaces en español de Lanzarote y mira el calendario de los Free Tour.
//   node scripts/destino/civitatisLanzarote.mjs
// Deja data/civitatis/lanzarote_resolver.json (enlace -> número de actividad) y lo que dice el calendario del Free Tour de Teguise y de Arrecife.
// Necesita CIVITATIS_API_USER y CIVITATIS_API_PASSWORD en .env.local (nunca se enseñan). El sandbox solo funciona de 7:00 a 2:00 (España).
import fs from 'node:fs'
import { config } from 'dotenv'
import { crearClienteCivitatis } from '../../server/civitatis/cliente.js'

config({ path: '.env.local' })
const cliente = crearClienteCivitatis()
console.log(`Entorno: ${cliente.entorno} · claves: ${cliente.tieneClaves ? 'sí' : 'NO'}`)
if (!cliente.tieneClaves) process.exit(2)

const civ = JSON.parse(fs.readFileSync('data/dias/lanzarote/_civitatis.json', 'utf8'))
const lista = [...civ.excursiones, ...civ.free_tours]
const salida = []
for (const e of lista) {
  const r = await cliente.pedir('/activities/resolve', { consulta: { url: e.url } })
  const id = r.ok ? (r.datos?.activity_id ?? null) : null
  salida.push({ id: e.id, url: e.url, ok: r.ok, activity_id: id, motivo: r.ok ? null : r.motivo, estado: r.estado ?? null })
  console.log(`${r.ok ? 'SI ' : 'NO '} ${e.id} -> ${id ?? r.motivo}`)
}
const calendarios = {}
const hoy = new Date().toISOString().slice(0, 10)
const hasta = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10)
for (const s of salida.filter((x) => x.activity_id && /free_tour/.test(x.id))) {
  const r = await cliente.pedir(`/calendar/activities/${s.activity_id}`, { consulta: { dateFrom: hoy, dateTo: hasta, currency: 'EUR' } })
  calendarios[s.id] = r.ok ? r.datos : { motivo: r.motivo }
}
fs.writeFileSync('data/civitatis/lanzarote_resolver.json', `${JSON.stringify({ fecha: hoy, resueltos: salida, calendarios_free_tour: calendarios }, null, 1)}\n`)
console.log(`Resueltos: ${salida.filter((x) => x.ok).length} de ${salida.length}`)
