/**
 * LAS RUTAS DE LOS LOGROS (Tanda 8A). Solo se montan con el interruptor encendido (`LOGROS_ACTIVOS=true` Y las cuentas encendidas): apagado, no existen y la app es la de hoy.
 * Todas piden la cabecera Authorization: Bearer <token de la cuenta>. Lo decide el servidor, nunca el móvil.
 *
 *   POST /api/logros/visto        { trip_id, sitio?, stop_id?, instante, ubicacion? }                       → { ok, cuenta, ubic, aviso, nuevos[] }
 *   POST /api/logros/foto         { trip_id, sitio, origen:'app'|'galeria', tomada_en, con_camara, ubicacion?, foto_id? } → { ok, valida, mensaje?, nuevos[] }
 *   POST /api/logros/deshacer     { trip_id, sitio?, stop_id? }                                             → { ok, quitados[] } (no si ya hay foto)
 *   GET  /api/logros/estado?trip_id        sellos, colecciones (en orden), secretos («3 de 12»), lo pendiente y el puntito
 *   GET  /api/logros/ficha?trip_id&sitio   las colecciones de un sitio (la pestaña de la ficha)
 *   GET  /api/logros/lo-de-ayer?trip_id    las paradas de días anteriores que aún no tienen su pedazo o su emblema, y los días que quedan
 *   GET  /api/logros/resumen?trip_id[&dia] el resumen del día o del viaje
 *   GET  /api/logros/viajero               los logros de viajero que se ven hoy (solo los de la Versión 1)
 *   GET  /api/logros/exp                   la EXP de esta cuenta: total, nivel, rango, EXP dentro del nivel y la que falta (8C1; nunca baja)
 *   GET  /api/logros/pasaporte             «Tus países» y «Por descubrir», con los números
 *   GET  /api/logros/sorteo                el billete y la página del sorteo de esta cuenta: edición, estado (sin_nivel · falta_viaje · dentro), lo que le falta y sus dos condiciones (10P)
 *   GET  /api/logros/vitrina · PUT /api/logros/vitrina { balda, clave, quitar? } o { titulo }
 *   PUT  /api/logros/previos      { paises:[], dias }   los países de antes: solo pintan el globo y los números, no dan logros
 *   POST /api/logros/animacion-vista { claves:[{destino,logro,escalon}] }  (el puntito del botón)
 *   POST /api/logros/recalcular   vuelve a calcular todo desde los hechos y pone lo que falte
 *   POST /api/logros/avisos/preparar · POST /api/logros/push/suscribir { endpoint, keys }
 *   GET  /api/pase/estado?trip_id           si HOY se puede usar, el pase y la prueba (una por cuenta, para siempre); si no, la tarjeta del pase
 *   POST /api/pase/prueba/usar   { trip_id }          usar HOY de verdad sin [Visto] («Cómo llegar»): gasta la prueba o hace la pregunta de las 12:00
 *   POST /api/pase/prueba/responder { trip_id, respuesta: 'hoy'|'manana' }   la respuesta a «Te queda medio día…»
 *   GET  /api/pase/precios · POST /api/pase/precio { plan, personas }   los precios (data/pase/precios.json); paga todo el que compra
 *   GET  /api/pase/sin-pase           si «Verme como viajero sin pase» está encendido (solo el administrador lo ve encendido)
 *   GET  /api/admin/empezar-de-cero/puede   si esta cuenta ve el botón [Empezar de cero] (solo el administrador; lo decide el servidor)
 *   POST /api/admin/empezar-de-cero  { confirmar:true }   deja la cuenta de administrador como recién creada (Tanda 10J; solo su cuenta)
 *   /api/admin/logros/*           solo para la cuenta de administrador (LOGROS_ADMIN_EMAILS en el servidor)
 */

import { quienEs, archivosDe } from '../cuentas.js'
import { cargarCatalogo, validarDatos } from './datos.js'
import { simular } from './servicio.js'
import { edicionVigente } from './exp.js'
import { logrosYVisibilidad, llevarAVitrina } from './vistas.js'
import { enviarAvisosPendientes, pushActivo } from './avisos.js'
import { registrarPantallas } from './pantallas/index.js'
import { reiniciarMisPruebas, empezarDeCero } from './reiniciar.js'

export function logrosActivos(env = process.env) {
  const on = (v) => String(v ?? '').toLowerCase() === 'true'
  return on(env.LOGROS_ACTIVOS) && (on(env.CUENTAS_ACTIVAS) || on(env.VITE_CUENTAS_ACTIVAS))
}

const tokenDe = (req) => {
  const cabecera = String(req.get?.('authorization') ?? req.headers?.authorization ?? '')
  return cabecera.startsWith('Bearer ') ? cabecera.slice(7).trim() || null : null
}

/** La cuenta de administrador: por una variable del servidor, nunca un email escrito en el código. */
export function esAdmin(usuario, env = process.env) {
  const lista = String(env.LOGROS_ADMIN_EMAILS ?? '').split(',').map((x) => x.trim().toLowerCase()).filter(Boolean)
  const ids = String(env.LOGROS_ADMIN_IDS ?? '').split(',').map((x) => x.trim()).filter(Boolean)
  return Boolean(usuario) && usuario.is_anonymous !== true && (lista.includes(String(usuario.email ?? '').toLowerCase()) || ids.includes(usuario.id))
}

export function registrarRutasLogros(app, { admin, servicio, repo, env = process.env, ahora = () => new Date() }) {
  if (!logrosActivos(env)) return false
  const { datos, catalogos } = servicio

  const conUsuario = (manejador) => async (req, res) => {
    if (!admin) return res.status(503).json({ ok: false, error: 'Los logros todavía no están preparados en el servidor (falta la clave de servicio de Supabase).' })
    try {
      const usuario = await quienEs(admin, tokenDe(req))
      if (!usuario) return res.status(401).json({ ok: false, error: 'Tu sesión no es válida. Entra otra vez.' })
      if (usuario.is_anonymous === true) return res.status(403).json({ ok: false, error: 'Los logros se guardan en tu cuenta: primero crea tu cuenta.' })
      return await manejador(req, res, usuario)
    } catch (error) {
      console.error('[logros]', error)
      return res.status(500).json({ ok: false, error: 'No se ha podido hacer. Vuelve a probar.' })
    }
  }
  const conAdmin = (manejador) =>
    conUsuario(async (req, res, usuario) => {
      if (!esAdmin(usuario, env)) return res.status(403).json({ ok: false, error: 'Solo para el administrador.' })
      return manejador(req, res, usuario)
    })

  // (8C2) Lo que piden las pantallas de la 8C2 (server/logros/pantallas/): cada archivo suyo registra sus rutas.
  registrarPantallas(app, { conUsuario, servicio, repo, datos, catalogos, ahora })

  app.get('/api/logros/interruptor', (_req, res) => res.json({ activos: true }))
  // La clave PÚBLICA de los avisos al móvil (la pública es pública por diseño: la necesita el móvil para suscribirse). La privada no sale nunca del servidor.
  app.get('/api/logros/push/clave', (_req, res) => res.json({ ok: pushActivo(env) && Boolean(env.VAPID_PUBLIC_KEY), clave: pushActivo(env) ? (env.VAPID_PUBLIC_KEY ?? null) : null }))

  app.post('/api/logros/visto', conUsuario(async (req, res, u) => res.json(await servicio.visto(u.id, req.body ?? {}))))
  app.post('/api/logros/foto', conUsuario(async (req, res, u) => res.json(await servicio.foto(u.id, req.body ?? {}))))
  app.post('/api/logros/deshacer', conUsuario(async (req, res, u) => res.json(await servicio.deshacer(u.id, req.body ?? {}))))
  app.get('/api/logros/estado', conUsuario(async (req, res, u) => res.json(await servicio.estado(u.id, String(req.query.trip_id ?? '')))))
  app.get('/api/logros/ficha', conUsuario(async (req, res, u) => res.json(await servicio.ficha(u.id, String(req.query.trip_id ?? ''), String(req.query.sitio ?? '')))))
  app.get('/api/logros/lo-de-ayer', conUsuario(async (req, res, u) => res.json(await servicio.loDeAyer(u.id, String(req.query.trip_id ?? '')))))
  app.get('/api/logros/resumen', conUsuario(async (req, res, u) => res.json(await servicio.resumenDe(u.id, String(req.query.trip_id ?? ''), { dia: req.query.dia ? String(req.query.dia) : null }))))
  app.get('/api/logros/viajero', conUsuario(async (_req, res, u) => res.json(await servicio.logrosDeViajero(u.id))))
  app.get('/api/logros/exp', conUsuario(async (_req, res, u) => res.json(await servicio.expDe(u.id))))
  app.get('/api/logros/sorteo', conUsuario(async (_req, res, u) => res.json(await servicio.sorteoDeCuenta(u.id))))
  app.get('/api/logros/pasaporte', conUsuario(async (_req, res, u) => res.json(await servicio.pasaporteDe(u.id))))
  app.get('/api/logros/vitrina', conUsuario(async (_req, res, u) => res.json(await servicio.vitrinaDe(u.id))))

  app.put('/api/logros/vitrina', conUsuario(async (req, res, u) => {
    const perfil = await repo.perfilDe(u.id)
    let guardada = perfil.vitrina
    const { balda, clave: claveNueva, quitar, titulo } = req.body ?? {}
    if (titulo !== undefined) guardada = { ...guardada, titulo: titulo || null }
    if (balda && claveNueva) {
      const r = llevarAVitrina(guardada, String(balda), String(claveNueva), quitar ?? null)
      if (!r.ok) return res.json({ ok: false, motivo: r.motivo, elegir_entre: r.elegir_entre })
      guardada = r.guardada
    }
    await repo.guardarPerfil(u.id, { vitrina: guardada })
    return res.json({ ok: true, ...(await servicio.vitrinaDe(u.id)) })
  }))

  app.put('/api/logros/previos', conUsuario(async (req, res, u) => {
    const paises = Array.isArray(req.body?.paises) ? req.body.paises.map(String).slice(0, 300) : []
    const dias = Number.isFinite(Number(req.body?.dias)) ? Math.max(0, Math.min(36500, Math.round(Number(req.body.dias)))) : 0
    // Se guardan aparte de lo ganado con la app: no dan ningún logro, ni sello, ni colección.
    await repo.guardarPerfil(u.id, { previos: { paises, dias } })
    return res.json({ ok: true })
  }))

  app.post('/api/logros/animacion-vista', conUsuario(async (req, res, u) => {
    const claves = Array.isArray(req.body?.claves) ? req.body.claves.filter((c) => c?.logro) : []
    await repo.marcarAnimacion(u.id, claves, req.body?.vista !== false)
    return res.json({ ok: true })
  }))

  app.post('/api/logros/recalcular', conUsuario(async (_req, res, u) => res.json({ ok: true, ...(await servicio.recalcular(u.id)) })))
  app.post('/api/logros/avisos/preparar', conUsuario(async (_req, res, u) => res.json({ ok: true, puestos: (await servicio.prepararAvisos(u.id)).length })))
  app.post('/api/logros/push/suscribir', conUsuario(async (req, res, u) => {
    if (!pushActivo(env)) return res.json({ ok: false, motivo: 'apagado' })
    const { endpoint, keys } = req.body ?? {}
    if (!endpoint || !keys) return res.status(400).json({ ok: false, error: 'Faltan datos.' })
    await repo.guardarSuscripcion(u.id, String(endpoint), keys)
    return res.json({ ok: true })
  }))

  /* ── El pase y la prueba de HOY ── */
  app.get('/api/pase/estado', conUsuario(async (req, res, u) => res.json(await servicio.estadoDelPase(u.id, req.query.trip_id ? String(req.query.trip_id) : null))))
  // «Verme como viajero sin pase» (Tanda 10B): el móvil solo LEE si está encendido (y solo para el administrador); quien lo enciende es la ruta de administrador, y solo su propia cuenta.
  app.get('/api/pase/sin-pase', conUsuario(async (_req, res, u) => {
    const eraAdmin = esAdmin(u, env)
    res.json({ ok: true, es_admin: eraAdmin, activo: eraAdmin && repo.sinPaseDe ? await repo.sinPaseDe(u.id) : false })
  }))
  app.post('/api/pase/prueba/usar', conUsuario(async (req, res, u) => res.json(await servicio.usarHoy(u.id, req.body ?? {}))))
  app.post('/api/pase/prueba/responder', conUsuario(async (req, res, u) => res.json(await servicio.responderPrueba(u.id, req.body ?? {}))))
  app.get('/api/pase/precios', (_req, res) => res.json({ ok: true, ...datos.pase.precios }))
  app.post('/api/pase/precio', (req, res) => res.json(servicio.precioDe(String(req.body?.plan ?? ''), req.body?.personas ?? null)))

  /* ── El panel de Eric ── */
  app.get('/api/admin/logros/datos', conAdmin(async (_req, res) => {
    const catalogosTodos = Object.fromEntries(Object.keys(datos.destinos).map((k) => [k, cargarCatalogo(k)]))
    const personas = await repo.contarLogros()
    res.json({
      ok: true,
      destinos: datos.destinos,
      avisos: validarDatos(datos, catalogosTodos),
      viajero: logrosYVisibilidad(datos, ahora()),
      viajero_apagados: datos.viajero.logros_apagados ?? [],
      ajustes: datos.ajustes,
      personas,
      interruptores: { logros: true, push: pushActivo(env), cobro: String(env.PASES_COBRO_ACTIVO ?? '') === 'true' },
    })
  }))
  app.post('/api/admin/logros/simular', conAdmin(async (req, res) => {
    const b = req.body ?? {}
    const destino = String(b.destino ?? 'roma')
    if (!datos.destinos[destino]) return res.status(400).json({ ok: false, error: 'Ese destino no tiene logros.' })
    res.json({ ok: true, pasos: simular({ datos, catalogos, destino, inicio: b.inicio, fin: b.fin, pasos: Array.isArray(b.pasos) ? b.pasos.slice(0, 200) : [], con_quien: b.con_quien ?? null, salida: b.salida ?? null, alta_cuenta: b.alta_cuenta ?? null }) })
  }))
  app.post('/api/admin/logros/probador', conAdmin(async (req, res) => {
    const objetivo = req.body?.user_id ? { id: String(req.body.user_id) } : await repo.usuarioPorEmail(String(req.body?.email ?? ''))
    if (!objetivo) return res.status(404).json({ ok: false, error: 'No hay ninguna cuenta con ese email.' })
    await repo.darProbador(objetivo.id, ahora().toISOString())
    res.json({ ok: true })
  }))
  // Reiniciar MIS pruebas (tanda 9): solo el administrador y solo su propia cuenta (el `uid` sale de la sesión; si el cuerpo trae otro, se ignora). Pide confirmar.
  app.post('/api/admin/logros/reiniciar-mis-pruebas', conAdmin(async (req, res, usuario) => {
    if (req.body?.confirmar !== true) return res.status(400).json({ ok: false, error: 'Falta confirmar.' })
    const r = await reiniciarMisPruebas(admin, usuario.id)
    res.status(r.ok ? 200 : 500).json(r)
  }))
  // EMPEZAR DE CERO (Tanda 10J): solo el administrador y solo su propia cuenta (el `uid` sale de la sesión; un `user_id` en el cuerpo se ignora). Pide confirmar. No borra la cuenta ni toca Stripe.
  app.get('/api/admin/empezar-de-cero/puede', conUsuario(async (_req, res, usuario) => res.json({ ok: true, puede: esAdmin(usuario, env) })))
  app.post('/api/admin/empezar-de-cero', conAdmin(async (req, res, usuario) => {
    if (req.body?.confirmar !== true) return res.status(400).json({ ok: false, error: 'Falta confirmar.' })
    const r = await empezarDeCero(admin, usuario, { archivosDe })
    res.status(r.ok ? 200 : 500).json(r)
  }))
  // «Verme como viajero sin pase»: el `uid` sale de la sesión (si el cuerpo trae otro, se ignora) y solo con la cuenta de administrador.
  app.post('/api/admin/logros/sin-pase', conAdmin(async (req, res, usuario) => {
    if (typeof req.body?.activo !== 'boolean') return res.status(400).json({ ok: false, error: 'Falta decir si se enciende o se apaga.' })
    const r = repo.ponerSinPase ? await repo.ponerSinPase(usuario.id, req.body.activo) : { ok: false, error: 'sin repo' }
    if (!r.ok) return res.status(500).json({ ok: false, error: 'No se ha podido guardar. ¿Está aplicada la migración 0030?' })
    return res.json({ ok: true, activo: req.body.activo })
  }))
  // El sorteo del año (10P): nivel mínimo y al menos un viaje acabado usando HOY la mitad de los días o más, con el cierre del 31 de agosto. Sin nombres ni correos: solo el id de cada cuenta.
  app.get('/api/admin/logros/sorteo', conAdmin(async (req, res) => {
    const anio = Number(req.query.anio) || edicionVigente(datos.exp, ahora().toISOString().slice(0, 10)).anio
    const cuentas = repo.cuentasConHechos ? await repo.cuentasConHechos() : []
    res.json({ ...(await servicio.sorteoDe(anio, cuentas)), regla: datos.exp.sorteo })
  }))
  app.post('/api/admin/logros/enviar-avisos', conAdmin(async (_req, res) => res.json({ ok: true, ...(await enviarAvisosPendientes({ repo, ahora: ahora(), env })) })))
  return true
}
