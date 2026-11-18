// Mide cuántas «rondas» al servidor de datos tarda en leer lo que hace falta para `GET /api/logros/estado` (Tanda V9, apartado 1): el servicio de verdad (`servicio.estado`) con el repo de verdad
// (`server/logros/repo.js`) contra un cliente de datos FALSO que tarda LATENCIA ms en contestar cada pregunta (no toca ningún Supabase). Con tres viajes (uno propio y dos de miembro).
//   node scripts/destino/_v9_tiempos.mjs [latencia_ms]
import { cargarDatos, cargarCatalogo } from '../../server/logros/datos.js'
import { crearServicioLogros } from '../../server/logros/servicio.js'
import { repoSupabase as crearRepoLogros } from '../../server/logros/repo.js'

const LATENCIA = Number(process.argv[2] ?? 150)
const datos = cargarDatos()
const catalogos = { roma: cargarCatalogo('roma'), lanzarote: cargarCatalogo('lanzarote') }
// Un viaje de Roma con la forma que guarda la app (se saca de uno de los de prueba, si hay).
const ruta = { destination: 'Roma', answers: { dateRange: { start: '2026-10-17', end: '2026-10-20' }, companion: 'couple' }, days: [{ dayNumber: 1, stops: [{ id: 's1', name: 'Coliseo' }] }] }

let preguntas = 0
const tablas = {
  trips: [{ id: 't1', traveler_id: 'U', route: ruta }, { id: 't2', traveler_id: 'X', route: ruta }, { id: 't3', traveler_id: 'X', route: ruta }],
  trip_members: [{ trip_id: 't2', user_id: 'U' }, { trip_id: 't3', user_id: 'U' }],
  trip_invitations: [],
}
const consulta = (tabla) => {
  let filtro = () => true
  const q = {
    select: () => q,
    eq: (c, v) => { const f = filtro; filtro = (r) => f(r) && r[c] === v; return q },
    in: (c, vs) => { const f = filtro; filtro = (r) => f(r) && vs.includes(r[c]); return q },
    not: () => q, is: () => q, order: () => q, limit: () => q, gte: () => q, lte: () => q,
    maybeSingle: () => Object.assign(q, { _uno: true }),
    single: () => Object.assign(q, { _uno: true }),
    then: (resolver, rechazar) => {
      preguntas++
      return new Promise((r) => setTimeout(r, LATENCIA)).then(() => {
        const filas = (tablas[tabla] ?? []).filter(filtro)
        return { data: q._uno ? (filas[0] ?? null) : filas, error: null }
      }).then(resolver, rechazar)
    },
  }
  return q
}
const admin = { from: (t) => consulta(t), rpc: () => consulta('rpc') }
const repo = crearRepoLogros(admin)
const servicio = crearServicioLogros({ repo, datos, catalogos, ahora: () => new Date('2026-10-18T10:00:00Z') })
const t0 = Date.now()
const r = await servicio.estado('U', 't1')
const ms = Date.now() - t0
console.log(JSON.stringify({ latencia_ms: LATENCIA, preguntas, ms, rondas: Math.round(ms / LATENCIA * 10) / 10, ok: r.ok, motivo: r.motivo ?? null }))
