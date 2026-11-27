// MEDIDA (no es una prueba): lo que baja de Supabase cada llamada del servidor en un día de viaje, con el RELOJ AVANZANDO (finde, paso 5). Sin claves ni producción: un Supabase de mentira que mide.
//   node scripts/destino/medirFindePaso5.mjs
import fs from 'node:fs'
import path from 'node:path'
import express from 'express'
import { cargarDatos, cargarCatalogo, datosVisiblesPara } from '../../server/logros/datos.js'
import { crearServicioLogros } from '../../server/logros/servicio.js'
import { repoSupabase, olvidarViajesEnMemoria } from '../../server/logros/repo.js'
import { registrarRutasPanel } from '../../server/panel/index.js'
import { crearCorreo } from '../../server/correo.js'
import { crearMedidor, destinoDe, esDesarrollo, medirSupabase } from '../../server/medidorSupabase.js'
const kb = (b) => Math.round((b / 1024) * 10) / 10
/* ───────── El cliente de Supabase de mentira que MIDE ───────── */
function crearBaseDeMentira(tablas, { rpcs = {}, usuarios = [] } = {}) {
  const medida = { consultas: 0, bytes: 0, filas: 0, porTabla: new Map() }
  const sumar = (nombre, data) => {
    const filas = Array.isArray(data) ? data.length : data ? 1 : 0
    const bytes = JSON.stringify(data ?? null).length
    medida.consultas++
    medida.bytes += bytes
    medida.filas += filas
    const x = medida.porTabla.get(nombre) ?? { consultas: 0, bytes: 0 }
    x.consultas++
    x.bytes += bytes
    medida.porTabla.set(nombre, x)
  }
  const proyectar = (fila, columnas) => {
    if (!columnas || columnas === '*') return fila
    const salida = {}
    for (const c of String(columnas).split(',').map((x) => x.trim()).filter(Boolean)) {
      const nombre = c.includes(':') ? c.split(':')[0] : c
      salida[nombre] = fila[nombre]
    }
    return salida
  }
  const from = (tabla) => {
    let filas = tablas[tabla]
    const filtros = []
    let columnas = '*'
    let tope = null
    let desde = 0
    let cuenta = false
    let orden = null
    let accion = 'select'
    let carga = null
    const q = {
      select(c, o) {
        columnas = c ?? '*'
        if (o?.head) cuenta = true
        return q
      },
      eq: (k, v) => (filtros.push((f) => f[k] === v), q),
      neq: (k, v) => (filtros.push((f) => f[k] !== v), q),
      in: (k, vs) => (filtros.push((f) => vs.includes(f[k])), q),
      is: (k, v) => (filtros.push((f) => (v === null ? f[k] == null : f[k] === v)), q),
      not: (k, op, v) => (filtros.push((f) => !(op === 'is' && v === null ? f[k] == null : f[k] === v)), q),
      lte: (k, v) => (filtros.push((f) => f[k] <= v), q),
      or: () => q,
      order: (k, o) => ((orden = [k, o?.ascending !== false]), q),
      limit: (n) => ((tope = n), q),
      range: (d, h) => ((desde = d), (tope = h - d + 1), q),
      insert: (f) => ((accion = 'insert'), (carga = f), q),
      upsert: (f) => ((accion = 'insert'), (carga = f), q),
      update: () => ((accion = 'update'), q),
      delete: () => ((accion = 'delete'), q),
      single: () => q.maybeSingle(),
      async maybeSingle() {
        const r = await q.then((x) => x)
        return { data: Array.isArray(r.data) ? (r.data[0] ?? null) : r.data, error: null }
      },
      then(ok, no) {
        try {
          if (filas === undefined) return ok({ data: null, error: { message: `relation "${tabla}" does not exist` } })
          if (accion !== 'select') {
            if (accion === 'insert') for (const f of [].concat(carga)) filas.push({ id: `n${filas.length}`, ...f })
            sumar(tabla, null)
            return ok({ data: null, error: null })
          }
          let r = filas.filter((f) => filtros.every((x) => x(f)))
          if (orden) r = [...r].sort((a, b) => (a[orden[0]] < b[orden[0]] ? -1 : a[orden[0]] > b[orden[0]] ? 1 : 0) * (orden[1] ? 1 : -1))
          r = r.slice(desde, tope === null ? undefined : desde + tope)
          if (cuenta) {
            sumar(tabla, null)
            return ok({ count: r.length, data: null, error: null })
          }
          const data = r.map((f) => proyectar(f, columnas))
          sumar(tabla, data)
          return ok({ data, error: null })
        } catch (e) {
          return no ? no(e) : ok({ data: null, error: { message: e.message } })
        }
      },
    }
    return q
  }
  const admin = {
    from,
    rpc: async (nombre, args) => {
      if (!(nombre in rpcs)) return { data: null, error: { message: `function public.${nombre} does not exist` } }
      const data = await rpcs[nombre](args)
      sumar(`rpc:${nombre}`, data)
      return { data, error: null }
    },
    auth: {
      getUser: async (token) => (token === 'T-admin' ? { data: { user: { id: 'ADMIN', is_anonymous: false, email: 'admin@x.es' } }, error: null } : { data: { user: null }, error: { message: 'no' } }),
      admin: {
        listUsers: async ({ page = 1 } = {}) => {
          const lista = page === 1 ? usuarios : []
          sumar('auth.users', lista)
          return { data: { users: lista }, error: null }
        },
      },
    },
    storage: { from: () => ({ createSignedUrls: async () => ({ data: [] }) }) },
  }
  return { admin, medida, reiniciar: () => ((medida.consultas = 0), (medida.bytes = 0), (medida.filas = 0), medida.porTabla.clear()) }
}


/* ───────── El día de un viajero: la ruta pesa 200 KB; el reloj avanza de verdad ───────── */
const datos = datosVisiblesPara(cargarDatos(), new Set(['lanzarote']), false)
const catalogos = Object.fromEntries(Object.keys(datos.destinos).map((k) => [k, cargarCatalogo(k)]))
const nombreDe = (id) => catalogos.roma.places.find((p) => p.id === id)?.name ?? id
const ID_VIAJE = 'trip-1'
const UID = 'user-1'
const PESO_RUTA_KB = Number(process.env.RUTA_KB || 200)
const rutaRoma = {
  destination: 'Roma',
  answers: { dateRange: { start: '2026-11-08', end: '2026-11-13' }, companion: 'couple' },
  days: [1, 2, 3, 4, 5, 6].map((n) => ({ id: `d${n}`, dayNumber: n, stops: ['coliseo', 'foro_romano_y_palatino', 'fontana_de_trevi', 'panteon'].map((id, j) => ({ id: `d${n}s${j}`, name: nombreDe(id) })) })),
  relleno: 'x'.repeat(PESO_RUTA_KB * 1024),
}
const NHECHOS = Number(process.env.HECHOS || 60)
const NGANADOS = Number(process.env.GANADOS || 90)
const ganados = Array.from({ length: NGANADOS }, (_, i) => ({ user_id: UID, destino: 'roma', logro: `pedazo:c${i % 9}:s${i}`, escalon: '', trip_id: ID_VIAJE, ganado_en: '2026-11-08T10:00:00Z', frase: 'Una frase de ejemplo de unos cien caracteres para que la fila pese lo que pesa una de verdad en la base de datos.', detalle: { origen: 'visto', sitio: `s${i}` }, animacion_vista: true }))
const hechos = Array.from({ length: NHECHOS }, (_, i) => ({ id: `h${i}`, user_id: UID, trip_id: ID_VIAJE, destino: 'roma', tipo: 'visto', sitio: `s${i}`, stop_id: `d1s${i}`, instante: '2026-11-08T10:00:00Z', recibido_en: '2026-11-08T10:00:01Z', ubic: 'cerca', valido: true, motivo: null, foto_id: null, sitios: null, deshecho_en: null }))
const tablas = () => ({
  trips: [{ id: ID_VIAJE, traveler_id: UID, route: rutaRoma, updated_at: '2026-11-08T08:00:00Z' }],
  trip_members: [], trip_invitations: [], passes: [], pass_members: [],
  logro_hechos: hechos, achievements: ganados,
  travelers: [{ id: UID, nombre: 'Eric', alta_cuenta: '2026-10-01T10:00:00Z' }],
  app_config: [], logro_perfil: [{ user_id: UID, previos: { paises: [], dias: 0 }, vitrina: { baldas: {}, titulo: null }, exp_max: 0 }], logro_referidos: [], hoy_prueba: [],
})
const b = crearBaseDeMentira(tablas(), { rpcs: { logro_orden_pionero: async () => null } })
olvidarViajesEnMemoria()
const repo = repoSupabase(b.admin, { destinosConPionero: ['roma'] })
let reloj = new Date('2026-11-09T08:00:00Z').getTime()
const realNow = Date.now
Date.now = () => reloj
const servicio = crearServicioLogros({ repo, datos, catalogos, ahora: () => new Date(reloj), cobro: false, azar: () => 0 })
const avanzar = (s) => { reloj += s * 1000 }
const medir = async (nombre, veces, cadaSeg, fn) => {
  b.reiniciar()
  for (let i = 0; i < veces; i++) { await fn(i); avanzar(cadaSeg) }
  const t = b.medida
  const porTabla = [...t.porTabla.entries()].sort((a, c) => c[1].bytes - a[1].bytes).slice(0, 4).map(([k, v]) => `${k} ${v.consultas}x ${kb(v.bytes)}KB`).join(' | ')
  console.log(`${nombre.padEnd(44)} ${String(veces).padStart(4)} llamadas · ${String(t.consultas).padStart(5)} consultas · ${String(kb(t.bytes)).padStart(8)} KB (${kb(t.bytes / veces)} KB/llamada) · ${porTabla}`)
  return { consultas: t.consultas, bytes: t.bytes }
}
const pedir = { trip_id: ID_VIAJE, ubicacion: { lat: 41.89, lng: 12.4922 }, sitios_hoy: ['Coliseo'] }
console.log(`Ruta de ${PESO_RUTA_KB} KB, ${NHECHOS} hechos, ${NGANADOS} logros ganados. Reloj avanzando.`)
await medir('cerca cada 75 s durante 8 h (HOY, GPS)', 384, 75, () => servicio.cerca(UID, pedir))
olvidarViajesEnMemoria()
await medir('cerca cada 5 min (HOY quieto, a la vista)', 96, 300, () => servicio.cerca(UID, pedir))
await medir('estado (abrir app / pestaña Logros) x10', 10, 600, () => servicio.estado(UID, ID_VIAJE))
