/**
 * LOS AVISOS DEL VIAJE CON EL MÓVIL BLOQUEADO (tanda HOY3, 5-nov). Los avisos que dependen de la HORA (no de dónde estás) llegan al móvil como notificación (web push), a su hora en la hora del destino:
 * la mañana, «Sal ahora para tu turno», el tiempo de la noche antes, el atardecer, la llegada y la vuelta. Las cuentas están en `shared/avisos/avisosDelViaje.js` (módulo puro, probado con reloj de mentira); aquí solo
 * está lo que toca la base de datos, la previsión del tiempo y el envío.
 *
 *   GET|POST /api/cron/avisos-viaje     la tarea de CADA 5 MINUTOS (con CRON_SECRET en `Authorization: Bearer …`); la dispara `pg_cron` + `pg_net` de Supabase (migraciones 0075 y 0077), porque el plan gratis de Vercel solo deja un cron al día.
 *                                       (V1, 15-nov) Lee lo MÍNIMO: el plan de cada viaje vive en `avisos_programados` (0077) y solo se rehace cuando el viaje cambia o cada 6 h; cada vuelta lee solo los avisos que tocan (nunca la ruta entera).
 *   POST     /api/admin/avisos-viaje/prueba   [Enviarme un aviso de prueba] (Ajustes, solo el administrador): manda un aviso al móvil de quien lo pide.
 *
 * Cómo no se repite nada: cada aviso se «reserva» ANTES de mandarse en `avisos_viaje_enviados` (clave única por persona, viaje y aviso; migración 0074): si ya estaba, no se manda. Si no se pudo entregar a ningún móvil, se libera y se
 * reintenta al minuto siguiente (hasta 30 min tarde: pasado eso el aviso ya no vale). Si el viajero cambia la ruta, la huella del viaje cambia y la vuelta siguiente rehace su plan (V1: antes se recalculaba entero en cada minuto).
 * (V1b) Con el cobro apagado (PASES_COBRO_ACTIVO=false) reciben todos los que tengan «Avisos en el móvil» activado. Con el cobro encendido: el dueño del viaje, con el pase de ese destino (o el administrador, o el día de prueba, y solo ese día), con el interruptor «Avisos en el móvil» encendido (= tiene una suscripción) y con PUSH_ACTIVO=true.
 */
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { tokenDe, quienEs } from './cuentas.js'
import { cobroActivo, cobroSoloAdmins } from './logros/pase.js'
import { pushEncendido } from './avisos.js'
import { tiempoPorHoras, coordenadasValidas } from './tiempo.js'
import { addDias, avisosDebidos, localDe, MAX_RETRASO_MIN, planDelViaje, TIEMPO_NOCHE_MIN, ZONA_POR_DEFECTO } from '../shared/avisos/avisosDelViaje.js'

const AQUI = dirname(fileURLToPath(import.meta.url))
const leer = (ruta) => JSON.parse(readFileSync(join(AQUI, '..', ruta), 'utf8'))
const marcaDe = () => leer('data/marca.json')
/** Los datos que usa el módulo puro: los umbrales del tiempo y los sitios de atardecer (los mismos archivos que usa la app). */
// Los sitios de atardecer viven en src/ y Vercel solo sube lo que se le dice (vercel.json › includeFiles). Si faltara, NUNCA se cae toda la API (5-nov: se cayó): el aviso de atardecer se queda sin sitio y lo demás sigue.
const leerSiExiste = (ruta, porDefecto) => {
  try {
    return leer(ruta)
  } catch (e) {
    console.warn(`[avisos-viaje] no se pudo leer ${ruta}: ${e?.code ?? e?.message}`)
    return porDefecto
  }
}
export const cargarDatosDeAvisos = () => ({ tiempo: leer('data/hoy/avisos_tiempo.json'), atardecer: leerSiExiste('src/data/sitiosDeAtardecer.json', {}) })

/** Adónde mirar el tiempo de un día: la primera parada con coordenadas de verdad, adonde va el coche o el centro de la isla. */
const CENTRO_POR_DESTINO = { lanzarote: { lat: 29.0, lng: -13.6 } }
function coordenadasDelDia(day, destino) {
  const real = (c) => c && Number.isFinite(c.lat) && Number.isFinite(c.lng) && !(c.lat === 0 && c.lng === 0)
  const parada = (day?.stops ?? []).find((s) => real(s.coordinates))?.coordinates
  const ida = day?.coche?.ida?.destino
  return coordenadasValidas(...(parada ? [parada.lat, parada.lng] : real(ida) ? [ida.lat, ida.lng] : [CENTRO_POR_DESTINO[String(destino).toLowerCase()]?.lat, CENTRO_POR_DESTINO[String(destino).toLowerCase()]?.lng]))
}

export function crearServicioAvisosViaje({ admin, destinos = {}, ahora = () => new Date(), env = process.env, cargarWebPush = () => import('web-push'), tiempo = tiempoPorHoras, datos = cargarDatosDeAvisos(), esAdminDeCuenta = async () => false, log = console, marca = marcaDe }) {
  const rpc = async (nombre, args = {}) => {
    const { data, error } = await admin.rpc(nombre, args)
    if (error) throw new Error(`${nombre}: ${error.message}`)
    return data
  }
  const zonaDelDestino = (nombre) => Object.values(destinos).find((d) => String(d.destino ?? '').toLowerCase() === String(nombre ?? '').toLowerCase())?.timezone ?? null

  /** web-push listo, o el motivo de que no. */
  async function prepararEnvio() {
    if (!pushEncendido(env)) return { motivo: 'apagado' }
    const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_CONTACTO } = env
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !VAPID_CONTACTO) return { motivo: 'faltan_claves_vapid' }
    try {
      const modulo = await cargarWebPush()
      const webpush = modulo.default ?? modulo
      webpush.setVapidDetails(VAPID_CONTACTO, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
      return { webpush }
    } catch {
      return { motivo: 'falta_el_paquete_web_push' }
    }
  }

  /** Manda un texto a todos los móviles de una persona. Devuelve a cuántos llegó. Una suscripción caducada se borra. */
  async function mandar(webpush, subs, cuerpo, { tag, url = '/?hoy=1' } = {}) {
    const titulo = marca().nombre
    let llegados = 0
    for (const sub of subs) {
      try {
        await webpush.sendNotification({ endpoint: sub.endpoint, keys: sub.claves }, JSON.stringify({ titulo, cuerpo, url, tag }))
        llegados++
      } catch (error) {
        if (error?.statusCode === 404 || error?.statusCode === 410) await rpc('borrar_suscripcion', { p_endpoint: sub.endpoint }).catch(() => undefined)
      }
    }
    return llegados
  }

  const suscripcionesDe = async (uid) => {
    const { data, error } = await admin.from('push_suscripciones').select('endpoint, claves').eq('user_id', uid)
    if (error) throw new Error(`push_suscripciones: ${error.message}`)
    return data ?? []
  }

  /** Los compañeros de cada viaje compartido (trip_id → [user_id]). Sin la tabla o con un fallo, nadie más: el dueño sigue recibiendo los suyos. */
  const miembrosDeLosViajes = async (ids) => {
    const porViaje = new Map()
    if (ids.length === 0) return porViaje
    try {
      const { data, error } = await admin.from('trip_members').select('trip_id, user_id').in('trip_id', ids)
      if (error) throw new Error(error.message)
      for (const m of data ?? []) porViaje.set(m.trip_id, [...(porViaje.get(m.trip_id) ?? []), m.user_id])
    } catch (error) {
      log.warn?.('[avisos-viaje] no se pudieron leer los compañeros de los viajes:', error.message)
    }
    return porViaje
  }

  /** ¿Con qué días se avisa a esta persona en este viaje? null = a ninguno; [] = todos; [fecha] = solo el día de prueba. */
  async function diasConAviso(uid, viaje, caches) {
    // (V1b, 15-nov; la regla del 7-nov) Con PASES_COBRO_ACTIVO=false todo está abierto menos leer documentos: los avisos también. Con el cobro encendido, como siempre: pase del destino, administrador o día de prueba.
    if (!cobroActivo(env)) return []
    // (V19) Con el cobro solo para administradores, las demás cuentas están como con el cobro apagado: todos los avisos.
    if (cobroSoloAdmins(env)) {
      if (!caches.admins.has(uid)) caches.admins.set(uid, Boolean(await esAdminDeCuenta(uid).catch(() => false)))
      if (!caches.admins.get(uid)) return []
    }
    const destino = String(viaje.route?.destination ?? '').toLowerCase()
    if (!caches.pases.has(uid)) caches.pases.set(uid, (await rpc('pases_de', { p_uid: uid }).catch(() => [])) ?? [])
    if (caches.pases.get(uid).some((p) => p.estado === 'activo' && String(p.destino).toLowerCase() === destino)) return []
    if (!caches.admins.has(uid)) caches.admins.set(uid, Boolean(await esAdminDeCuenta(uid).catch(() => false)))
    if (caches.admins.get(uid)) return []
    // Sin pase: solo el día de prueba de HOY (una por cuenta), si es de este viaje.
    const { data } = await admin.from('hoy_prueba').select('fecha, trip_id').eq('user_id', uid).maybeSingle()
    if (data?.fecha && (!data.trip_id || data.trip_id === viaje.trip_id)) return [String(data.fecha).slice(0, 10)]
    return null
  }

  /**
   * (V1, 15-nov) Rehace el plan de los viajes que lo necesitan: los que han cambiado (huella distinta), los que no tienen plan y los que lo tienen de hace más de 6 h (el tiempo). Es lo ÚNICO que baja la ruta entera,
   * y solo la de ese viaje. El plan se guarda en `avisos_programados` (migración 0077): una fila pequeña por aviso, con su texto ya hecho (incluida la frase del tiempo de hoy y de mañana).
   */
  async function planificar(instante) {
    const hoyUtc = instante.toISOString().slice(0, 10)
    const lista = (await rpc('avisos_viajes_por_planificar', { p_desde: addDias(hoyUtc, -1), p_hasta: addDias(hoyUtc, 1) })) ?? []
    let replanificados = 0
    for (const item of lista) {
      try {
        const viaje = await rpc('avisos_viaje_para_plan', { p_trip: item.trip_id })
        const route = viaje?.route
        let filas = []
        if (route?.answers?.dateRange?.start) {
          const zona = route.days?.find((d) => d.zonaHorariaDia)?.zonaHorariaDia ?? zonaDelDestino(route.destination) ?? ZONA_POR_DEFECTO
          const entrada = { route, reservations: viaje.bookings?.reservations ?? [], zona, datos }
          // La previsión del tiempo de hoy y de mañana (hora del destino), una sola vez por plan.
          const local = localDe(instante, zona)
          const previsiones = new Map()
          for (const fecha of [local.fecha, addDias(local.fecha, 1)]) {
            const dia = route.days?.find((d) => addDias(route.answers.dateRange.start, d.dayNumber - 1) === fecha)
            const coords = dia ? coordenadasDelDia(dia, route.destination) : null
            if (coords) previsiones.set(fecha, (await tiempo(coords, fecha).catch(() => null))?.value ?? null)
          }
          filas = planDelViaje({ ...entrada, meteo: (f) => previsiones.get(f) ?? null }).map((a) => ({ clave: a.clave, tipo: a.tipo, para: a.instante.toISOString(), dia_fecha: a.diaFecha, texto: a.texto }))
        }
        await rpc('avisos_programados_guardar', { p_trip: item.trip_id, p_huella: viaje?.huella ?? item.huella, p_filas: filas })
        replanificados++
      } catch (error) {
        log.warn?.('[avisos-viaje] no se pudo hacer el plan de un viaje:', error.message)
      }
    }
    return replanificados
  }

  /** La tarea de cada 5 minutos: rehace los planes que toquen y manda los avisos que tocan ahora (leyendo solo esos avisos, nunca los viajes enteros). */
  async function tick(instante = ahora()) {
    const envio = await prepararEnvio()
    if (!envio.webpush) return { ok: true, enviados: 0, motivo: envio.motivo }
    const replanificados = await planificar(instante)
    const debidos = (await rpc('avisos_programados_debidos', { p_ahora: instante.toISOString(), p_retraso_min: MAX_RETRASO_MIN })) ?? []
    const caches = { pases: new Map(), admins: new Map(), subs: new Map() }
    let enviados = 0
    let revisados = 0
    // (Arreglo, 6-nov; decisión de Eric) Los compañeros de un viaje compartido reciben los avisos igual que el dueño, cada uno en su móvil, con su pase y con SU interruptor «Avisos en el móvil» (su suscripción): cada uno puede apagarlos en Ajustes.
    const miembros = await miembrosDeLosViajes([...new Set(debidos.map((a) => a.trip_id))])
    const subsDe = async (uid) => {
      if (!caches.subs.has(uid)) caches.subs.set(uid, await suscripcionesDe(uid))
      return caches.subs.get(uid)
    }
    for (const aviso of debidos) {
      let terminado = true
      for (const uid of [...new Set([aviso.user_id, ...(miembros.get(aviso.trip_id) ?? [])])]) {
        try {
          const subs = await subsDe(uid)
          if (subs.length === 0) continue // el interruptor «Avisos en el móvil» está apagado (o nunca se encendió)
          const soloDias = await diasConAviso(uid, { route: { destination: aviso.destino }, trip_id: aviso.trip_id }, caches)
          if (soloDias === null) continue // sin pase
          revisados++
          if (soloDias.length && !soloDias.includes(String(aviso.dia_fecha).slice(0, 10))) continue // el día de prueba: solo los avisos de ese día
          const clave = `${aviso.trip_id}|${aviso.clave}`
          const nuevo = await rpc('avisos_viaje_reservar', { p_uid: uid, p_trip: aviso.trip_id, p_clave: clave, p_tipo: aviso.tipo, p_para: new Date(aviso.para).toISOString() })
          if (!nuevo) continue // ya se mandó (o lo está mandando otra vuelta de la tarea)
          const llegados = await mandar(envio.webpush, subs, aviso.texto, { tag: clave })
          if (llegados > 0) enviados++
          else {
            await rpc('avisos_viaje_liberar', { p_uid: uid, p_clave: clave }) // no llegó a ningún móvil: se reintenta en la vuelta siguiente
            terminado = false
          }
        } catch (error) {
          terminado = false
          log.warn?.('[avisos-viaje] no se pudo mandar un aviso:', error.message)
        }
      }
      if (terminado) await rpc('avisos_programados_listo', { p_trip: aviso.trip_id, p_clave: aviso.clave }).catch(() => undefined)
    }
    return { ok: true, viajes: replanificados, avisos: debidos.length, revisados, enviados }
  }

  /** [Enviarme un aviso de prueba] (Ajustes, administrador): un aviso de verdad al móvil de quien lo pide. */
  async function prueba(uid) {
    const envio = await prepararEnvio()
    if (!envio.webpush) return { ok: false, motivo: envio.motivo }
    const subs = await suscripcionesDe(uid)
    if (subs.length === 0) return { ok: false, motivo: 'sin_suscripcion' }
    const llegados = await mandar(envio.webpush, subs, 'Esto es un aviso de prueba. Si lo ves con el móvil bloqueado, los avisos del viaje te van a llegar.', { tag: `prueba:${Date.now()}` })
    return { ok: llegados > 0, enviados: llegados, ...(llegados > 0 ? {} : { motivo: 'no_ha_llegado' }) }
  }

  return { tick, prueba }
}

export function registrarRutasAvisosViaje(app, { admin, servicio, esAdmin, env = process.env }) {
  const cron = async (req, res) => {
    if (!env.CRON_SECRET || tokenDe(req) !== env.CRON_SECRET) return res.status(404).json({ ok: false })
    try {
      res.json(await servicio.tick())
    } catch (error) {
      console.error('[avisos-viaje/cron]', error)
      res.status(500).json({ ok: false })
    }
  }
  app.get('/api/cron/avisos-viaje', cron)
  app.post('/api/cron/avisos-viaje', cron)
  app.post('/api/admin/avisos-viaje/prueba', async (req, res) => {
    if (!admin) return res.status(503).json({ ok: false, error: 'Los avisos todavía no están preparados en el servidor.' })
    try {
      const usuario = await quienEs(admin, tokenDe(req))
      if (!usuario) return res.status(401).json({ ok: false, error: 'Tu sesión no es válida. Entra otra vez.' })
      if (!esAdmin(usuario, env)) return res.status(403).json({ ok: false })
      res.json(await servicio.prueba(usuario.id))
    } catch (error) {
      console.error('[avisos-viaje/prueba]', error)
      res.status(500).json({ ok: false })
    }
  })
}
