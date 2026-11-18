// Temporal (V15b): repasa paso a paso lo que hace el servidor para Alicia y para Eric con las filas REALES del CSV del SQL de diagnóstico.
//   node scripts/destino/_repasoCsvAlicia.mjs "<ruta del CSV>"
import fs from 'node:fs'
import { cargarDatos, cargarCatalogo } from '../../server/logros/datos.js'
import { crearServicioLogros } from '../../server/logros/servicio.js'

const csv = fs.readFileSync(process.argv[2], 'utf8')
const bloque = (nombre) => {
  const i = csv.indexOf(`\n${nombre},`)
  const resto = csv.slice(i + nombre.length + 2)
  const fin = resto.search(/\n\d+ [a-z]/)
  let t = (fin < 0 ? resto : resto.slice(0, fin)).trim()
  if (t.startsWith('"')) t = t.slice(1, -1).replace(/""/g, '"')
  return JSON.parse(t)
}
const viajes = bloque('1 viajes a Lanzarote')
const miembros = bloque('2 miembros')
const logros = bloque('3 logros de Lanzarote')
const ERIC = '6d87ffe1-7ff3-496c-8a14-21c32f94670a'
const ALICIA = '2e7dc316-b9a8-4ac7-8b85-d9fbbf51688c'
const COMPARTIDO = '4d3e6c59-2c9f-4570-8afa-2c597895b5e1'
const COPIA = '3157cdb3-a24c-4862-b8bf-9037d7b1a8cc'
const OTRA = '1a54ced6-e592-450d-afdc-25e6863408a8'
const nombre = (u) => (u === ERIC ? 'Eric' : u === ALICIA ? 'Alicia' : u)
const filaViaje = (v) => ({ id: v.trip_id, traveler_id: v.dueno, route: { destination: 'Lanzarote', answers: { dateRange: v.rango_de_fechas, companion: 'couple' }, days: Array.from({ length: v.dias_en_la_ruta }, (_, i) => ({ dayNumber: i + 1, stops: [] })) } })
const filas = viajes.map(filaViaje)
const repo = {
  hechosDe: async () => [],
  insertarHecho: async () => ({}), deshacerHecho: async () => {},
  viajesDe: async (u) => filas.filter((f) => f.traveler_id === u || (f.id === COMPARTIDO && miembros.some((m) => m.user_id === u))).map((f) => ({ ...f, es_duo: false })),
  logrosDe: async (u) => logros.filter((l) => l.user_id === u).map((l) => ({ ...l, destino: 'lanzarote', detalle: l.origen ? { origen: l.origen } : null })),
  insertarLogros: async () => [], borrarLogros: async () => {}, cuentaDe: async () => ({ alta_cuenta: '2026-10-01T10:00:00.000Z', salida: null }), ordenPionero: async () => ({}), probadorDe: async () => null, ultimaFrase: async () => null,
  sinPaseDe: async () => false, pasesDe: async () => [], pruebaDe: async () => null, guardarPrueba: async () => {},
  perfilDe: async () => ({ previos: { paises: [], dias: 0 }, vitrina: { baldas: {}, titulo: null }, exp_max: 0 }), guardarPerfil: async () => {}, referidosDe: async () => [], invitadorDe: async () => null, marcarAnimacion: async () => {},
  fotoUrl: async () => null,
  miembrosDe: async (t) => {
    const f = filas.find((x) => x.id === t)
    if (!f) return []
    return [{ user_id: f.traveler_id, desde: null }, ...miembros.filter((m) => m.trip_id === t).map((m) => ({ user_id: m.user_id, desde: m.desde }))]
  },
  nombresDe: async (ids) => new Map(ids.map((i) => [i, nombre(i)])),
}
const datos = cargarDatos()
const catalogos = { roma: cargarCatalogo('roma'), lanzarote: cargarCatalogo('lanzarote') }
const reloj = new Date(process.env.AHORA ?? '2026-11-18T23:33:00Z')
const servicio = crearServicioLogros({ repo, datos, catalogos, ahora: () => reloj, cobro: false, azar: () => 0 })

for (const [quien, trip, que] of [[ALICIA, COMPARTIDO, 'el de Eric'], [ALICIA, COPIA, 'su copia del 9'], [ALICIA, OTRA, 'su otra copia (8-13)'], [ERIC, COMPARTIDO, 'el suyo']]) {
  console.log(`\n=== ${nombre(quien)} con ${que} (${trip.slice(0, 8)}) ===`)
  const c = await servicio.cargar(quien)
  console.log('  viajes que encuentra:', Object.entries(c.viajes).map(([k, v]) => `${k.slice(0, 8)} ${v.inicio}→${v.fin}`).join(' | '), '| ids extra (copias):', Object.getOwnPropertyNames(c.viajes).filter((k) => !Object.keys(c.viajes).includes(k)).map((k) => k.slice(0, 8)).join(',') || '—')
  const v = c.viajes[trip]
  console.log('  el viaje pedido:', v ? `${v.id.slice(0, 8)} ${v.inicio}→${v.fin}` : 'NO LO ENCUENTRA (viaje_sin_fechas)')
  const mm = v ? await repo.miembrosDe(v.id) : []
  console.log('  miembros:', mm.map((m) => `${nombre(m.user_id)}(${m.desde ? String(m.desde).slice(0, 10) : 'dueño'})`).join(', '))
  console.log('  mis logros de Lanzarote:', c.logros.filter((l) => l.logro === 'pedazo').length, 'pedazos;', 'trips de mis logros:', [...new Set(c.logros.map((l) => String(l.trip_id).slice(0, 8)))].join(','))
  const r = await servicio.companeroPendientes(quien, trip)
  console.log('  respuesta:', JSON.stringify({ ok: r.ok, motivo: r.motivo, fuera_de_fechas: r.fuera_de_fechas, sin_pase: r.sin_pase, pendientes: r.pendientes.map((p) => `${p.sitio}←${p.de_nombre}`) }))
}
