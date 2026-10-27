/**
 * LA CAMPANITA DE AVISOS (cuentas parte 3, punto 4). Una tabla de avisos en el servidor, de cada persona, con leídos y sin leer (migración 0026: `avisos`). Los avisos de las personas
 * (te recomiendan un cambio, han aceptado el tuyo, alguien se ha unido) los crean disparadores de la base de datos; los avisos CON FECHA (en 10 días empieza tu viaje, tu resumen está
 * listo, te quedan 3 días para reclamar tus sorpresas) los prepara este archivo, cada uno una sola vez y NUNCA DE NOCHE: solo entre las 9:00 y las 21:00 de la hora de quien los recibe.
 *
 *   GET  /api/avisos                la lista (lo más nuevo arriba) con su texto, y cuántos hay sin leer
 *   POST /api/avisos/leidos         { ids?: [], todos?: true }
 *   GET  /api/avisos/push/clave     la clave pública para pedir el permiso del móvil (solo con PUSH_ACTIVO)
 *   POST /api/avisos/enviar         manda al móvil los avisos pendientes (idempotente: cada aviso sale una vez); la app lo pide justo después de una acción
 *   GET  /api/cron/avisos           la tarea programada de Vercel (con CRON_SECRET): prepara los avisos con fecha de todos y manda los pendientes
 *
 * El aviso en el móvil va con `PUSH_ACTIVO=true` (y las claves VAPID); con ello apagado la campanita funciona igual y el móvil no recibe nada. El email para quien no dé permiso
 * está preparado y apagado (hace falta el servicio de correos, que necesita el dominio, que espera al nombre de la app).
 * Todo lo que toca la base de datos son funciones de la 0026, que solo puede llamar el servidor.
 */

import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { quienEs, tokenDe } from './cuentas.js'
import { detalleDelAviso, franjaDelAviso, ponerTablaDeArticulos, quienDelAviso, textoDelAviso, textoDelPush } from '../shared/avisos/textos.js'

const AQUI = dirname(fileURLToPath(import.meta.url))
// (Tanda 10N3 §2.2) Los avisos que nombran un sitio («ha añadido la Fontana de Trevi al sábado 28») llevan su artículo, de la misma tabla que los logros.
try {
  const tablas = JSON.parse(readFileSync(join(AQUI, '..', 'data', 'logros', 'articulos.json'), 'utf8'))
  ponerTablaDeArticulos(Object.assign({}, ...Object.entries(tablas).filter(([k]) => !k.startsWith('_')).map(([, v]) => v)))
} catch {
  /* sin tabla: los nombres salen sin artículo */
}
const verdadero = (v) => String(v ?? '').toLowerCase() === 'true'

export const pushEncendido = (env = process.env) => verdadero(env.PUSH_ACTIVO)
/** El correo para quien no da permiso: preparado y APAGADO (falta el servicio de correos, que necesita el dominio). */
export const emailDeAvisosEncendido = (env = process.env) => verdadero(env.AVISOS_EMAIL_ACTIVO) && Boolean(env.CORREO_API_KEY)

/** La ventana en la que se puede avisar: de las 9:00 a las 21:00 (la hora de quien lo recibe). */
export const VENTANA = { desde: 9, hasta: 21 }

const ZONA_POR_DEFECTO = 'Europe/Madrid'
const zonaValida = (z) => {
  try {
    new Intl.DateTimeFormat('es', { timeZone: z })
    return true
  } catch {
    return false
  }
}

/** La fecha (aaaa-mm-dd) y la hora de ese instante en esa zona. */
export function partesLocales(instante, zona) {
  const z = zonaValida(zona) ? zona : ZONA_POR_DEFECTO
  const f = new Intl.DateTimeFormat('en-CA', { timeZone: z, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
  const p = Object.fromEntries(f.formatToParts(instante).map((x) => [x.type, x.value]))
  return { fecha: `${p.year}-${p.month}-${p.day}`, hora: Number(p.hour), minuto: Number(p.minute) }
}

/** ¿Es hora de avisar? Entre las 9:00 y las 21:00 de esa zona (nunca de noche). */
export function dentroDeLaVentana(instante, zona, ventana = VENTANA) {
  const { hora } = partesLocales(instante, zona)
  return hora >= ventana.desde && hora < ventana.hasta
}

const dias = (a, b) => Math.round((Date.UTC(+b.slice(0, 4), +b.slice(5, 7) - 1, +b.slice(8, 10)) - Date.UTC(+a.slice(0, 4), +a.slice(5, 7) - 1, +a.slice(8, 10))) / 86400000)
const marcaDe = () => JSON.parse(readFileSync(join(AQUI, '../data/marca.json'), 'utf8'))

/**
 * @param {object} o
 * @param {object} o.admin     cliente de Supabase con la clave de servicio (`.auth.getUser` y `.rpc`)
 * @param {Record<string,{timezone?:string,destino?:string}>} [o.destinos]  los destinos con logros (la hora de cada uno, de data/logros)
 * @param {() => Date} [o.ahora]
 */
export function crearServicioAvisos({ admin, destinos = {}, ahora = () => new Date(), env = process.env, cargarWebPush = () => import('web-push'), log = console, marca = marcaDe }) {
  const rpc = async (nombre, args = {}) => {
    const { data, error } = await admin.rpc(nombre, args)
    if (error) throw new Error(`${nombre}: ${error.message}`)
    return data
  }
  const zonaDelDestino = (nombre) => Object.values(destinos).find((d) => String(d.destino ?? '').toLowerCase() === String(nombre ?? '').toLowerCase())?.timezone ?? ZONA_POR_DEFECTO

  /** Prepara los avisos con fecha de una persona (una sola vez cada uno, y solo entre las 9:00 y las 21:00 de su hora). Devuelve cuántos ha creado. */
  async function prepararDeUsuario(uid, instante = ahora()) {
    let creados = 0
    const viajes = (await rpc('viajes_para_avisos', { p_uid: uid })) ?? []
    const propios = viajes.filter((v) => !v.guardado && v.inicio && v.fin)
    // 1. «En 10 días empieza tu viaje a Roma».
    let pases = null
    for (const v of propios) {
      const zona = v.zona || zonaDelDestino(v.destino)
      const { fecha } = partesLocales(instante, zona)
      const faltan = dias(fecha, v.inicio)
      if (faltan < 1 || faltan > 10 || !dentroDeLaVentana(instante, zona)) continue
      pases ??= (await rpc('pases_de', { p_uid: uid })) ?? []
      const conPase = pases.some((p) => p.estado === 'activo' && String(p.destino).toLowerCase() === String(v.destino).toLowerCase())
      const otro = propios.find((x) => x.id !== v.id && String(x.destino).toLowerCase() === String(v.destino).toLowerCase() && x.inicio <= v.fin && v.inicio <= x.fin)
      const hecho = await rpc('crear_aviso', {
        p_uid: uid,
        p_tipo: 'd10',
        p_clave: `d10:${v.id}`,
        p_payload: { trip_id: v.id, destino: v.destino, inicio: v.inicio, fin: v.fin, dias: faltan, con_pase: conPase, otro: otro ? { id: otro.id, inicio: otro.inicio, fin: otro.fin } : null },
      })
      if (hecho) creados++
    }
    // 2. El resumen del viaje y «te quedan N días para reclamar tus sorpresas»: la cola de los logros, cuando ya les toca.
    const vencidos = (await rpc('logro_avisos_vencidos', { p_uid: uid, p_ahora: instante.toISOString() })) ?? []
    for (const la of vencidos) {
      const zona = viajes.find((x) => x.id === la.trip_id)?.zona || zonaDelDestino(la.payload?.destino)
      if (!dentroDeLaVentana(instante, zona)) continue
      const tipo = la.tipo === 'quedan_dias' ? 'sorpresas' : 'resumen'
      const hecho = await rpc('crear_aviso', { p_uid: uid, p_tipo: tipo, p_clave: `logro:${la.id}`, p_payload: { trip_id: la.trip_id, texto: la.payload?.texto ?? null, dias: la.payload?.dias ?? null, destino: la.payload?.destino ?? null } })
      await rpc('logro_aviso_en_campanita', { p_id: la.id })
      if (hecho) creados++
    }
    return creados
  }

  /** (Tanda 10P) Lo que se mira justo antes de leer la campanita de una persona (el servicio de logros lo pone: si ya cumple el sorteo, su aviso dorado se crea ahora). Sin logros, nada. */
  let antesDeListar = null

  /** La lista de la campanita de una persona: prepara lo que ya toca y devuelve los avisos con su texto. */
  async function listar(uid) {
    try {
      await prepararDeUsuario(uid)
    } catch (error) {
      log.warn?.('[avisos] no se pudieron preparar los avisos con fecha:', error.message)
    }
    try {
      await antesDeListar?.(uid)
    } catch (error) {
      log.warn?.('[avisos] no se pudo mirar lo de los logros:', error.message)
    }
    const todos = (await rpc('avisos_de', { p_uid: uid })) ?? []
    // (Tanda 10N4 §2) «Mañana empieza tu viaje a Roma» salía aunque las fechas del viaje ya fueran otras: el aviso de los 10 días se crea UNA vez (con las fechas de ese momento) y se quedaba para siempre.
    // Ahora solo vale si ese viaje sigue existiendo, sigue empezando el mismo día, y de verdad faltan de 1 a 10 días (en la hora del destino); y su «mañana» / «en N días» se cuenta con la fecha de hoy.
    const instanteDeHoy = ahora()
    let viajesDeAhora = null
    const vigenteD10 = async (a) => {
      try {
        viajesDeAhora ??= (await rpc('viajes_para_avisos', { p_uid: uid })) ?? []
      } catch {
        return a
      }
      const v = viajesDeAhora.find((x) => x.id === a.payload?.trip_id)
      if (!v || !v.inicio || v.inicio !== a.payload?.inicio) return null
      const faltan = dias(partesLocales(instanteDeHoy, v.zona || zonaDelDestino(v.destino)).fecha, v.inicio)
      if (faltan < 1 || faltan > 10) return null
      return { ...a, payload: { ...a.payload, dias: faltan, fin: v.fin ?? a.payload.fin } }
    }
    const avisos = []
    for (const a of todos) {
      if (a.tipo !== 'd10') {
        avisos.push(a)
        continue
      }
      const vigente = await vigenteD10(a)
      if (vigente) avisos.push(vigente)
    }
    // (Tanda 10N, apartado 9) Los avisos «quiere añadir al presupuesto» llevan los botones dentro: cómo está hoy cada gasto (pendiente, aceptado, rechazado o retirado). Sin la migración 0037, todos quedan como pendientes.
    const estadoDeGasto = new Map()
    const idsDeGasto = avisos.filter((a) => a.tipo === 'gasto_pendiente' && a.payload?.gasto_id).map((a) => a.payload.gasto_id)
    if (idsDeGasto.length > 0) {
      try {
        for (const g of (await rpc('gastos_de_avisos', { p_ids: idsDeGasto })) ?? []) estadoDeGasto.set(g.id, g.estado)
      } catch (error) {
        log.warn?.('[avisos] no se pudo mirar el estado de los gastos:', error.message)
        for (const id of idsDeGasto) estadoDeGasto.set(id, 'pendiente')
      }
    }
    const etiquetaDeGasto = (a) => {
      if (a.tipo !== 'gasto_pendiente') return null
      const estado = estadoDeGasto.get(a.payload?.gasto_id) ?? 'retirado'
      return estado === 'pendiente' ? null : estado === 'aceptado' ? 'Aceptado' : estado === 'rechazado' ? 'Rechazado' : 'Retirado'
    }
    const lista = avisos.map((a) => ({
      id: a.id,
      tipo: a.tipo,
      texto: textoDelAviso(a),
      franja: franjaDelAviso(a),
      quien: quienDelAviso(a),
      creado_en: a.creado_en,
      leido: a.leido,
      payload: a.tipo === 'gasto_pendiente' ? { ...a.payload, gasto_estado: estadoDeGasto.get(a.payload?.gasto_id) ?? 'retirado' } : a.payload,
      detalle: detalleDelAviso(a),
      // AV3: una recomendación ya contestada queda «Aceptada» o «No aceptada» (la contesta el administrador desde R2).
      etiqueta: a.tipo === 'recomendacion' && a.estado_rec && a.estado_rec !== 'pendiente' ? (a.estado_rec === 'aceptada' ? 'Aceptada' : 'No aceptada') : etiquetaDeGasto(a),
    }))
    return { ok: true, avisos: lista, sin_leer: lista.filter((a) => !a.leido && !a.etiqueta).length }
  }

  async function marcarLeidos(uid, ids) {
    const n = await rpc('marcar_avisos_leidos', { p_uid: uid, p_ids: ids && ids.length ? ids : null })
    return { ok: true, marcados: n }
  }

  // (Tanda 10N4 §2) «Marcar como no leído» y «Eliminar» / «Deshacer» (migración 0046). Sin ella, la app lo recuerda en el propio móvil: aquí se responde que no hay y no pasa nada.
  async function marcarNoLeidos(uid, ids) {
    if (!ids?.length) return { ok: true, marcados: 0 }
    try {
      return { ok: true, marcados: await rpc('marcar_avisos_no_leidos', { p_uid: uid, p_ids: ids }) }
    } catch (error) {
      log.warn?.('[avisos] sin la migración 0046 (no leído):', error.message)
      return { ok: false, sin_migracion: true }
    }
  }

  async function ocultar(uid, ids, ocultarlos) {
    if (!ids?.length) return { ok: true, ocultados: 0 }
    try {
      return { ok: true, ocultados: await rpc('ocultar_avisos', { p_uid: uid, p_ids: ids, p_ocultar: ocultarlos !== false }) }
    } catch (error) {
      log.warn?.('[avisos] sin la migración 0046 (eliminar):', error.message)
      return { ok: false, sin_migracion: true }
    }
  }

  /**
   * Manda al móvil los avisos que faltan: solo con PUSH_ACTIVO, las claves VAPID y el paquete; solo a quien dio permiso (tiene suscripción); solo entre las 9:00 y las 21:00 de su hora;
   * cada aviso una sola vez. Un fallo con un móvil no para a los demás; una suscripción caducada se borra.
   * @returns {{ enviados: number, motivo?: string }}
   */
  async function enviarPush({ instante = ahora() } = {}) {
    if (!pushEncendido(env)) return { enviados: 0, motivo: 'apagado' }
    const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_CONTACTO } = env
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !VAPID_CONTACTO) return { enviados: 0, motivo: 'faltan_claves_vapid' }
    let webpush
    try {
      const modulo = await cargarWebPush()
      webpush = modulo.default ?? modulo
    } catch {
      return { enviados: 0, motivo: 'falta_el_paquete_web_push' }
    }
    webpush.setVapidDetails(VAPID_CONTACTO, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
    const titulo = marca().nombre
    let enviados = 0
    for (const a of (await rpc('avisos_para_push', { p_limite: 200 })) ?? []) {
      if (!dentroDeLaVentana(instante, a.zona || ZONA_POR_DEFECTO)) continue // de noche no: se manda en cuanto sea de día
      let alguno = false
      for (const sub of a.subs ?? []) {
        try {
          await webpush.sendNotification({ endpoint: sub.endpoint, keys: sub.claves }, JSON.stringify({ titulo, cuerpo: textoDelPush(a), url: `/?aviso=${a.id}` }))
          alguno = true
        } catch (error) {
          if (error?.statusCode === 404 || error?.statusCode === 410) await rpc('borrar_suscripcion', { p_endpoint: sub.endpoint }).catch(() => undefined)
        }
      }
      if (alguno) {
        await rpc('marcar_push', { p_id: a.id })
        enviados++
      }
    }
    return { enviados }
  }

  /** La tarea programada: prepara los avisos con fecha de todas las personas a las que toca mirar y manda los pendientes. */
  async function tareaProgramada(instante = ahora()) {
    // (Tanda 10N5 §6e) Una vez al día: los avisos eliminados hace más de 30 días y los de más de un año se borran de verdad (sin la migración 0048 no pasa nada).
    let limpieza = null
    try {
      limpieza = await rpc('purgar_avisos', { p_ahora: instante.toISOString() })
    } catch (error) {
      log.warn?.('[avisos] sin la migración 0048 (borrado de avisos viejos):', error.message)
    }
    const desde = partesLocales(new Date(instante.getTime() - 86400000), ZONA_POR_DEFECTO).fecha
    const hasta = partesLocales(new Date(instante.getTime() + 12 * 86400000), ZONA_POR_DEFECTO).fecha
    const personas = (await rpc('usuarios_para_avisos', { p_desde: desde, p_hasta: hasta })) ?? []
    let creados = 0
    for (const uid of personas) {
      try {
        creados += await prepararDeUsuario(uid, instante)
      } catch (error) {
        log.warn?.('[avisos] no se pudo preparar a una persona:', error.message)
      }
    }
    const push = await enviarPush({ instante })
    return { ok: true, personas: personas.length, creados, ...(limpieza ? { limpieza } : {}), ...push }
  }

  const crearAviso = async (uid, tipo, claveDelAviso, payload) => Boolean(await rpc('crear_aviso', { p_uid: uid, p_tipo: tipo, p_clave: claveDelAviso, p_payload: payload }))

  return { crearAviso, alListar: (fn) => { antesDeListar = fn }, prepararDeUsuario, listar, marcarLeidos, marcarNoLeidos, ocultar, enviarPush, tareaProgramada, clavePublica: () => (pushEncendido(env) && env.VAPID_PUBLIC_KEY ? env.VAPID_PUBLIC_KEY : null) }
}

export function registrarRutasAvisos(app, { admin, servicio, env = process.env }) {
  const conUsuario = (manejador) => async (req, res) => {
    if (!admin) return res.status(503).json({ ok: false, error: 'Los avisos todavía no están preparados en el servidor.' })
    try {
      const usuario = await quienEs(admin, tokenDe(req))
      if (!usuario) return res.status(401).json({ ok: false, error: 'Tu sesión no es válida. Entra otra vez.' })
      if (usuario.is_anonymous === true) return res.status(403).json({ ok: false, error: 'Los avisos se guardan en tu cuenta: primero crea tu cuenta.' })
      await manejador(req, res, usuario)
    } catch (error) {
      console.error('[avisos]', error)
      res.status(500).json({ ok: false, error: 'No se han podido cargar los avisos.' })
    }
  }
  app.get('/api/avisos', conUsuario(async (_req, res, u) => res.json(await servicio.listar(u.id))))
  app.post('/api/avisos/leidos', conUsuario(async (req, res, u) => res.json(await servicio.marcarLeidos(u.id, Array.isArray(req.body?.ids) ? req.body.ids.map(String) : null))))
  app.post('/api/avisos/no-leidos', conUsuario(async (req, res, u) => res.json(await servicio.marcarNoLeidos(u.id, Array.isArray(req.body?.ids) ? req.body.ids.map(String) : []))))
  app.post('/api/avisos/ocultar', conUsuario(async (req, res, u) => res.json(await servicio.ocultar(u.id, Array.isArray(req.body?.ids) ? req.body.ids.map(String) : [], req.body?.ocultar !== false))))
  // Tanda 10N: el día antes del viaje, la app avisa de que quien solo recomienda tiene cambios sin enviar. Se comprueba que está en ese viaje y el aviso sale una sola vez al día.
  app.post('/api/avisos/sin-enviar', conUsuario(async (req, res, u) => {
    const tripId = String(req.body?.tripId ?? '')
    const n = Math.min(99, Math.max(0, Math.floor(Number(req.body?.n) || 0)))
    if (!tripId || n === 0) return res.status(400).json({ ok: false })
    const { data: miembro } = await admin.from('trip_members').select('user_id').eq('trip_id', tripId).eq('user_id', u.id).maybeSingle()
    if (!miembro) return res.status(403).json({ ok: false })
    const { data: viaje } = await admin.from('trips').select('traveler_id, route').eq('id', tripId).maybeSingle()
    const { data: dueno } = viaje ? await admin.from('travelers').select('nombre').eq('id', viaje.traveler_id).maybeSingle() : { data: null }
    const nombre = String(dueno?.nombre ?? '').trim().split(' ')[0] || null
    const hoy = new Date().toISOString().slice(0, 10)
    const hecho = await servicio.crearAviso(u.id, 'sin_enviar', `sin_enviar:${tripId}:${hoy}`, { trip_id: tripId, n, admin: nombre, destino: viaje?.route?.destination ?? null })
    res.json({ ok: true, creado: hecho })
  }))
  app.get('/api/avisos/push/clave', (_req, res) => {
    const clave = servicio.clavePublica()
    res.json({ ok: Boolean(clave), clave })
  })
  let ultimoEnvio = 0
  app.post('/api/avisos/enviar', conUsuario(async (_req, res) => {
    if (Date.now() - ultimoEnvio < 3000) return res.json({ ok: true, enviados: 0, motivo: 'reciente' })
    ultimoEnvio = Date.now()
    res.json({ ok: true, ...(await servicio.enviarPush()) })
  }))
  // La tarea programada de Vercel manda `Authorization: Bearer <CRON_SECRET>`. Sin CRON_SECRET en el servidor, la ruta no existe.
  app.get('/api/cron/avisos', async (req, res) => {
    if (!env.CRON_SECRET || tokenDe(req) !== env.CRON_SECRET) return res.status(404).json({ ok: false })
    try {
      res.json(await servicio.tareaProgramada())
    } catch (error) {
      console.error('[avisos/cron]', error)
      res.status(500).json({ ok: false })
    }
  })
}
