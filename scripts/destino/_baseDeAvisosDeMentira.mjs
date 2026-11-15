/**
 * La base de datos de mentira de las pruebas de los avisos del viaje (HOY3 y V1): hace lo mismo que las funciones de las migraciones 0074 y 0077 (viajes por planificar con huella, plan guardado en filas pequeñas,
 * avisos que tocan, reservar/liberar) y CUENTA los bytes que el servidor lee de ella (lo que en Supabase es la salida de datos, el «egress»).
 */
import { createHash } from 'node:crypto'

const huellaDe = (v) => createHash('md5').update(JSON.stringify(v.route ?? '') + '|' + JSON.stringify(v.bookings ?? '')).digest('hex')

export function crearBaseDeAvisos({ viajes, pases = [{ estado: 'activo', destino: 'Lanzarote' }], subs = [{ endpoint: 'https://push.example.test/1', claves: { p256dh: 'a', auth: 'b' } }], prueba = null, miembros = [], usuarios = {} }) {
  const reservados = new Set()
  const borradas = []
  const planes = new Map() // trip_id → { huella, en }
  const filas = new Map() // `${trip}|${clave}` → fila
  const estado = { reloj: new Date(), bytes: 0, llamadas: [], bytesPorLlamada: new Map() }
  const cuenta = (nombre, valor) => {
    const n = JSON.stringify(valor ?? null).length
    estado.bytes += n
    estado.llamadas.push(nombre)
    estado.bytesPorLlamada.set(nombre, (estado.bytesPorLlamada.get(nombre) ?? 0) + n)
    return valor
  }
  const hayAlguien = (v) => (Array.isArray(subs) ? subs.length > 0 : true) || miembros.some((m) => m.trip_id === v.trip_id)
  const enCurso = (v, desde, hasta) => {
    const ini = v.route?.answers?.dateRange?.start
    const fin = v.route?.answers?.dateRange?.end ?? ini
    return Boolean(ini && fin) && ini <= hasta && fin >= desde
  }
  const rpcs = {
    pases_de: () => pases,
    avisos_viajes_por_planificar: (a) =>
      viajes
        .filter((v) => hayAlguien(v) && enCurso(v, a.p_desde, a.p_hasta))
        .map((v) => ({ trip_id: v.trip_id, user_id: v.user_id, huella: huellaDe(v), plan: planes.get(v.trip_id) }))
        .filter((v) => !v.plan || v.plan.huella !== v.huella || estado.reloj.getTime() - v.plan.en > 6 * 3600 * 1000)
        .map(({ plan, ...resto }) => resto),
    avisos_viaje_para_plan: (a) => {
      const v = viajes.find((x) => x.trip_id === a.p_trip)
      return v ? { trip_id: v.trip_id, user_id: v.user_id, route: v.route, bookings: v.bookings, huella: huellaDe(v) } : null
    },
    avisos_programados_guardar: (a) => {
      const nuevas = new Set(a.p_filas.map((f) => `${a.p_trip}|${f.clave}`))
      for (const [k, f] of filas) if (f.trip_id === a.p_trip && !f.listo && !nuevas.has(k)) filas.delete(k)
      for (const f of a.p_filas) {
        const k = `${a.p_trip}|${f.clave}`
        const ya = filas.get(k)
        if (!ya) filas.set(k, { trip_id: a.p_trip, ...f, listo: false })
        else if (!ya.listo) filas.set(k, { ...ya, ...f })
      }
      planes.set(a.p_trip, { huella: a.p_huella, en: estado.reloj.getTime() })
      return a.p_filas.length
    },
    avisos_programados_debidos: (a) => {
      const t = new Date(a.p_ahora).getTime()
      return [...filas.values()]
        .filter((f) => !f.listo && Date.parse(f.para) <= t && Date.parse(f.para) >= t - a.p_retraso_min * 60000)
        .map((f) => ({ trip_id: f.trip_id, user_id: viajes.find((v) => v.trip_id === f.trip_id)?.user_id, destino: viajes.find((v) => v.trip_id === f.trip_id)?.route?.destination, clave: f.clave, tipo: f.tipo, para: f.para, dia_fecha: f.dia_fecha, texto: f.texto }))
    },
    avisos_programados_listo: (a) => {
      const f = filas.get(`${a.p_trip}|${a.p_clave}`)
      if (f) f.listo = true
      return null
    },
    avisos_viaje_reservar: (a) => {
      const k = `${a.p_uid}|${a.p_clave}`
      if (reservados.has(k)) return false
      reservados.add(k)
      return true
    },
    avisos_viaje_liberar: (a) => {
      reservados.delete(`${a.p_uid}|${a.p_clave}`)
      return null
    },
    borrar_suscripcion: (a) => {
      borradas.push(a.p_endpoint)
      return null
    },
  }
  const builder = (tabla) => {
    const b = {
      select: () => b,
      eq: () => b,
      in: () => b,
      maybeSingle: async () => ({ data: tabla === 'hoy_prueba' ? cuenta('hoy_prueba', prueba) : null, error: null }),
      then: (ok) => ok({ data: cuenta(tabla, tabla === 'push_suscripciones' ? subs : tabla === 'trip_members' ? miembros : []), error: null }),
    }
    return b
  }
  const admin = {
    rpc: async (n, a) => {
      if (!rpcs[n]) throw new Error(`la base de mentira no conoce ${n}`)
      return { data: cuenta(n, rpcs[n](a)), error: null }
    },
    from: builder,
    auth: {
      getUser: async (t) => (usuarios[t] ? { data: { user: usuarios[t] } } : { data: { user: null }, error: { message: 'no' } }),
    },
  }
  /** Lo que hace `avisos_viaje_hay_que_mirar` DENTRO de la base de datos (no sale ni un byte): ¿hay un plan que rehacer o un aviso que toca? Si no, el planificador no llama a la API. */
  const hayQueMirar = (instante) => {
    estado.reloj = instante
    const hoy = instante.toISOString().slice(0, 10)
    const dia = (n) => new Date(Date.parse(`${hoy}T00:00:00Z`) + n * 86400000).toISOString().slice(0, 10)
    const porPlanificar = viajes
      .filter((v) => hayAlguien(v) && enCurso(v, dia(-1), dia(1)))
      .some((v) => { const p = planes.get(v.trip_id); return !p || p.huella !== huellaDe(v) || instante.getTime() - p.en > 6 * 3600 * 1000 })
    const t = instante.getTime()
    const tocan = [...filas.values()].some((f) => !f.listo && Date.parse(f.para) <= t && Date.parse(f.para) >= t - 30 * 60000)
    return porPlanificar || tocan
  }
  return { admin, reservados, borradas, planes, filas, estado, hayAlguien, hayQueMirar }
}
