/**
 * EL COBRO DEL PASE (cuentas, parte 3, punto 2). Todo detrás de `PASES_COBRO_ACTIVO=true` Y de que haya con qué cobrar (las claves de Stripe, o el pago de mentira en desarrollo).
 * Sin eso las rutas ni existen y la app es la de hoy: todo abierto, sin hoja de compra.
 *
 *   GET  /api/pase/config           { cobro, modo, moneda, precios }     (público: la app decide si enseña la hoja de compra)
 *   POST /api/pago/crear            { destino, plan, personas?, trip_id? } → { ok, url, sesion, precio }   (cuenta de verdad; EL PRECIO LO PONE SIEMPRE EL SERVIDOR)
 *   POST /api/pago/webhook          el aviso de Stripe: la firma se comprueba con el cuerpo tal cual; el pase lo crea SOLO el servidor al confirmarse el pago
 *   GET  /api/pago/estado?sesion=   { listo, rechazado?, pase? }        (la app lo pregunta al volver del pago hasta que el aviso llega)
 *   GET  /api/pases/mios            «Mis pases»
 *   GET  /api/pases/recibo?pase=    { url }                              el recibo de Stripe (se pide la primera vez y se guarda)
 *   POST /api/pago/mentira/resolver { sesion, resultado: 'bueno'|'rechazado'|'devuelto' }   solo con el pago de mentira (desarrollo y pruebas, nunca en producción)
 *
 * Stripe se llama con `fetch` y sin su paquete: no pesa nada, y el móvil no carga código de Stripe (Checkout es una página suya; se llega con un enlace).
 * Todo lo que toca la base de datos son funciones de la migración 0026 (`registrar_pago`, `devolver_pago`, `pases_de`…), que solo puede llamar el servidor.
 * Los registros de los cobros NO se borran al borrar la cuenta (Hacienda pide guardarlos): ver `pagos_registro` en la 0026.
 */

import crypto from 'node:crypto'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { quienEs, tokenDe } from './cuentas.js'
import { cobroActivo, precioDelPase } from './logros/pase.js'

/** El nombre de la app (data/marca.json, un solo sitio): sale en el nombre del pase que se ve al pagar. */
const nombreDeLaApp = () => {
  try {
    return JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../data/marca.json'), 'utf8')).nombre
  } catch {
    return 'JUTRIP'
  }
}

/* ------------------------------------------------------------------ */
/* Los interruptores                                                   */
/* ------------------------------------------------------------------ */

const verdadero = (v) => String(v ?? '').toLowerCase() === 'true'

export const stripeLista = (env = process.env) => Boolean(env.STRIPE_SECRET_KEY && env.STRIPE_WEBHOOK_SECRET)
/** El pago de mentira solo existe fuera de producción (ni en Vercel ni con NODE_ENV=production): así no puede cobrar nunca «de mentira» a nadie de verdad. */
export const mentiraPermitida = (env = process.env) => verdadero(env.PAGO_DE_MENTIRA) && !env.VERCEL && env.NODE_ENV !== 'production'
/** Cómo se cobra: 'mentira' (pruebas), 'stripe' o null (no hay con qué cobrar). */
export const modoDePago = (env = process.env) => (mentiraPermitida(env) ? 'mentira' : stripeLista(env) ? 'stripe' : null)
/** ¿Se cobra de verdad? Solo con el interruptor encendido Y con algo con qué cobrar. Si no, todo abierto. */
export const cobroListo = (env = process.env) => cobroActivo(env) && modoDePago(env) !== null

/* ------------------------------------------------------------------ */
/* Stripe: la firma del aviso (pura, para poder probarla)              */
/* ------------------------------------------------------------------ */

/** La cabecera `Stripe-Signature` es `t=1700000000,v1=abc…,v1=def…`; la firma buena es HMAC-SHA256 de `${t}.${cuerpo}` con el secreto del aviso. */
export function firmarAvisoStripe(cuerpo, secreto, tSegundos) {
  const v1 = crypto.createHmac('sha256', secreto).update(`${tSegundos}.${cuerpo}`, 'utf8').digest('hex')
  return `t=${tSegundos},v1=${v1}`
}

/** Comprueba la firma con el cuerpo TAL CUAL llegó (no reconstruido) y que no sea vieja (5 minutos). Devuelve el aviso ya leído, o lanza. */
export function verificarAvisoStripe(cuerpo, cabecera, secreto, { toleranciaS = 300, ahoraS = Math.floor(Date.now() / 1000) } = {}) {
  if (!secreto) throw new Error('Falta el secreto del aviso.')
  if (cuerpo == null || (Buffer.isBuffer(cuerpo) ? cuerpo.length === 0 : String(cuerpo).length === 0)) throw new Error('El aviso llegó sin cuerpo.')
  const texto = Buffer.isBuffer(cuerpo) ? cuerpo.toString('utf8') : String(cuerpo)
  const partes = String(cabecera ?? '').split(',').map((p) => p.trim().split('='))
  const t = partes.find(([k]) => k === 't')?.[1]
  const firmas = partes.filter(([k]) => k === 'v1').map(([, v]) => v)
  if (!t || firmas.length === 0 || !/^\d+$/.test(t)) throw new Error('La firma del aviso no es válida.')
  if (Math.abs(ahoraS - Number(t)) > toleranciaS) throw new Error('La firma del aviso es demasiado vieja.')
  const buena = crypto.createHmac('sha256', secreto).update(`${t}.${texto}`, 'utf8').digest()
  const coincide = firmas.some((f) => {
    const dada = Buffer.from(f, 'hex')
    return dada.length === buena.length && crypto.timingSafeEqual(dada, buena)
  })
  if (!coincide) throw new Error('La firma del aviso no es válida.')
  return JSON.parse(texto)
}

/** Aplana un objeto a la forma que pide Stripe (`line_items[0][quantity]=1`). */
export function aFormularioStripe(objeto) {
  const pares = []
  const recorrer = (valor, clave) => {
    if (valor == null) return
    if (Array.isArray(valor)) valor.forEach((v, i) => recorrer(v, `${clave}[${i}]`))
    else if (typeof valor === 'object') for (const [k, v] of Object.entries(valor)) recorrer(v, clave ? `${clave}[${k}]` : k)
    else pares.push([clave, String(valor)])
  }
  recorrer(objeto, '')
  return new URLSearchParams(pares)
}

/* ------------------------------------------------------------------ */
/* Las dos pasarelas: Stripe y la de mentira                           */
/* ------------------------------------------------------------------ */

export function pasarelaStripe({ clave, secretoAviso, fetchFn = fetch }) {
  const base = 'https://api.stripe.com/v1'
  const cabeceras = { Authorization: `Bearer ${clave}`, 'Content-Type': 'application/x-www-form-urlencoded' }
  return {
    nombre: 'stripe',
    async crearSesion({ importe_cent, moneda, producto, email, uid, metadata, exito, cancelado }) {
      const cuerpo = aFormularioStripe({
        mode: 'payment',
        success_url: exito,
        cancel_url: cancelado,
        locale: 'es',
        client_reference_id: uid,
        customer_email: email || undefined,
        line_items: [{ quantity: 1, price_data: { currency: moneda, unit_amount: importe_cent, product_data: { name: producto } } }],
        metadata,
        payment_intent_data: { metadata },
      })
      const r = await fetchFn(`${base}/checkout/sessions`, { method: 'POST', headers: cabeceras, body: cuerpo })
      const datos = await r.json().catch(() => null)
      if (!r.ok || !datos?.url) throw new Error(`Stripe no creó el pago (${r.status}): ${datos?.error?.message ?? 'sin detalle'}`)
      return { id: datos.id, url: datos.url }
    },
    verificarAviso: (cuerpo, firma, opciones) => verificarAvisoStripe(cuerpo, firma, secretoAviso, opciones),
    /** El recibo de un pago (su dirección pública, con el email del comprador en la página de Stripe). */
    async recibo(intencionRef) {
      const r = await fetchFn(`${base}/payment_intents/${encodeURIComponent(intencionRef)}?expand[]=latest_charge`, { headers: { Authorization: `Bearer ${clave}` } })
      const datos = await r.json().catch(() => null)
      return r.ok ? (datos?.latest_charge?.receipt_url ?? null) : null
    },
  }
}

/** El pago de mentira (desarrollo y pruebas): las mismas formas de aviso que Stripe, sin red. Las sesiones viven en memoria. */
export function pasarelaDeMentira({ origen = 'http://localhost:5173' } = {}) {
  const sesiones = new Map()
  let n = 0
  return {
    nombre: 'mentira',
    sesiones,
    async crearSesion({ importe_cent, moneda, producto, uid, metadata }) {
      const id = `mock_cs_${Date.now().toString(36)}_${++n}`
      sesiones.set(id, { id, importe_cent, moneda, producto, uid, metadata, estado: 'pendiente', intencion: `mock_pi_${id.slice(8)}` })
      return { id, url: `${origen.replace(/\/+$/, '')}/?pago=mentira&sesion=${id}` }
    },
    verificarAviso() {
      throw new Error('El pago de mentira no usa avisos firmados.')
    },
    async recibo(intencionRef) {
      return `https://recibo.invalid/${encodeURIComponent(intencionRef)}`
    },
    /** El aviso que mandaría Stripe para ese resultado (o null si es un rechazo: Stripe no avisa de un pago que no se hizo). */
    eventoDe(sesionId, resultado) {
      const s = sesiones.get(sesionId)
      if (!s) return null
      if (resultado === 'rechazado') {
        s.estado = 'rechazado'
        return null
      }
      if (resultado === 'bueno') {
        s.estado = 'pagado'
        return { id: `evt_${sesionId}_pagado`, type: 'checkout.session.completed', data: { object: { id: s.id, payment_status: 'paid', amount_total: s.importe_cent, currency: s.moneda, payment_intent: s.intencion, metadata: s.metadata, client_reference_id: s.uid } } }
      }
      if (resultado === 'devuelto') {
        s.estado = 'devuelto'
        return { id: `evt_${sesionId}_devuelto`, type: 'charge.refunded', data: { object: { id: `mock_ch_${s.id}`, payment_intent: s.intencion, refunded: true, amount: s.importe_cent, amount_refunded: s.importe_cent, metadata: s.metadata } } }
      }
      return null
    },
  }
}

/* ------------------------------------------------------------------ */
/* El servicio                                                         */
/* ------------------------------------------------------------------ */

const SIN_PASARELA = 'El cobro todavía no está preparado.'

/**
 * @param {object} o
 * @param {object} o.admin      el cliente de Supabase con la clave de servicio (solo se llama a `.auth.getUser` y `.rpc`)
 * @param {object} o.precios    data/pase/precios.json
 * @param {string[]} o.destinos los destinos que se pueden comprar (los que tienen logros: «Roma»)
 * @param {object} o.pasarela   la pasarela (Stripe o la de mentira)
 */
export function crearServicioPagos({ admin, precios, destinos, pasarela, env = process.env, log = console }) {
  const destinoValido = (texto) => destinos.find((d) => d.toLowerCase() === String(texto ?? '').trim().toLowerCase()) ?? null
  const planDe = (body) => {
    const plan = String(body?.plan ?? '')
    if (!['uno', 'duo', 'grupo'].includes(plan)) return null
    const personas = plan === 'uno' ? 1 : plan === 'duo' ? 2 : Number(body?.personas)
    const precio = precioDelPase(precios, plan, personas)
    return precio ? { plan, personas: precio.personas, precio } : null
  }
  const rpc = async (nombre, args) => {
    const { data, error } = await admin.rpc(nombre, args)
    if (error) throw new Error(`${nombre}: ${error.message}`)
    return data
  }

  const config = () => ({ ok: true, cobro: pasarela != null, modo: pasarela?.nombre ?? null, moneda: precios.moneda, destinos, precios: { planes: precios.planes, se_paga_una_vez: precios.se_paga_una_vez } })

  /** Crea el cobro. EL PRECIO LO PONE EL SERVIDOR: del móvil solo llegan qué pase y cuántas personas; cualquier importe que mande se ignora. */
  async function crearPago(usuario, body, origen) {
    if (!pasarela) return { estado: 503, cuerpo: { ok: false, error: SIN_PASARELA } }
    if (!usuario || usuario.is_anonymous === true) return { estado: 403, cuerpo: { ok: false, error: 'Primero crea tu cuenta.' } }
    const destino = destinoValido(body?.destino)
    if (!destino) return { estado: 400, cuerpo: { ok: false, error: 'Ese destino no tiene pase.' } }
    const p = planDe(body)
    if (!p) return { estado: 400, cuerpo: { ok: false, error: 'Ese pase no es válido.' } }
    if (!origen) return { estado: 500, cuerpo: { ok: false, error: 'Falta la dirección de la app en el servidor (APP_URL).' } }
    const tengo = await rpc('pases_de', { p_uid: usuario.id })
    if ((tengo ?? []).some((x) => x.estado === 'activo' && String(x.destino).toLowerCase() === destino.toLowerCase())) {
      return { estado: 409, cuerpo: { ok: false, ya_tienes: true, error: `Ya tienes el Pase de ${destino}.` } }
    }
    const importe = Math.round(p.precio.total * 100)
    const nombrePlan = p.plan === 'uno' ? '1 persona' : p.plan === 'duo' ? 'Pase Dúo, 2 personas' : `Pase Grupo, ${p.personas} personas`
    const metadata = { pase: '1', uid: usuario.id, destino, plan: p.plan, personas: String(p.personas), trip_id: body?.trip_id ? String(body.trip_id) : '' }
    const sesion = await pasarela.crearSesion({
      importe_cent: importe,
      moneda: String(precios.moneda ?? 'EUR').toLowerCase(),
      producto: `${nombreDeLaApp()} · Pase de ${destino} · ${nombrePlan}`,
      email: usuario.email ?? '',
      uid: usuario.id,
      metadata,
      exito: `${origen.replace(/\/+$/, '')}/?pago=ok&sesion={CHECKOUT_SESSION_ID}`,
      cancelado: `${origen.replace(/\/+$/, '')}/?pago=cancelado`,
    })
    return { estado: 200, cuerpo: { ok: true, url: sesion.url, sesion: sesion.id, precio: { total: p.precio.total, por_persona: p.precio.por_persona, personas: p.personas, plan: p.plan } } }
  }

  /** El aviso de Stripe (ya con la firma comprobada). Si llega dos veces, un solo pase. */
  async function procesarEvento(evento) {
    const tipo = evento?.type
    const o = evento?.data?.object ?? {}
    if (tipo === 'checkout.session.completed' || tipo === 'checkout.session.async_payment_succeeded') {
      if (o.payment_status !== 'paid') return { ok: true, accion: 'esperando_el_pago' }
      const m = o.metadata ?? {}
      if (m.pase !== '1') return { ok: true, accion: 'no_es_un_pase' }
      const destino = destinoValido(m.destino)
      const p = planDe({ plan: m.plan, personas: m.personas })
      if (!destino || !p || !m.uid) {
        log.error?.('[pagos] aviso de pago con datos que no valen', o.id)
        return { ok: true, accion: 'datos_no_validos' }
      }
      const r = await rpc('registrar_pago', {
        p_pago_ref: o.id,
        p_intencion_ref: o.payment_intent ?? null,
        p_proveedor: pasarela?.nombre === 'mentira' ? 'mentira' : 'stripe',
        p_comprador: m.uid,
        p_destino: destino,
        p_plan: p.plan,
        p_personas: p.personas,
        p_importe_cent: Number.isInteger(o.amount_total) ? o.amount_total : Math.round(p.precio.total * 100),
        p_moneda: o.currency ?? 'eur',
        p_trip: m.trip_id || null,
      })
      return { ok: true, accion: r?.repetido ? 'repetido' : r?.sin_comprador ? 'sin_comprador' : 'pase_creado', pase_id: r?.pase_id ?? null }
    }
    if (tipo === 'charge.refunded') {
      // Solo la devolución completa anula el pase.
      const entera = o.refunded === true || (Number.isInteger(o.amount) && Number.isInteger(o.amount_refunded) && o.amount_refunded >= o.amount)
      if (!entera) return { ok: true, accion: 'devolucion_parcial' }
      const r = await rpc('devolver_pago', { p_ref: o.payment_intent ?? o.id })
      if (!r?.encontrado) {
        // Si el cobro es nuestro y aún no se ha registrado (el aviso de devolución llegó antes que el de pago), se pide que Stripe lo repita.
        if (o.metadata?.pase === '1') return { ok: false, reintentar: true, accion: 'cobro_aun_no_registrado' }
        return { ok: true, accion: 'no_es_nuestro' }
      }
      return { ok: true, accion: 'pase_anulado', pases_anulados: r.pases_anulados }
    }
    return { ok: true, accion: 'ignorado' }
  }

  async function estadoDeSesion(usuario, sesion) {
    const pases = (await rpc('pases_de', { p_uid: usuario.id })) ?? []
    const pase = pases.find((x) => x.pago_ref === sesion) ?? null
    const s = pasarela?.sesiones?.get?.(sesion)
    return { ok: true, listo: Boolean(pase) && pase.estado === 'activo', rechazado: s?.estado === 'rechazado', devuelto: pase?.estado === 'anulado', pase: pase ? quitarInterno(pase) : null }
  }
  const quitarInterno = (p) => {
    const { pago_ref: _pago, ...resto } = p
    return resto
  }

  async function pasesDe(usuario) {
    const lista = (await rpc('pases_de', { p_uid: usuario.id })) ?? []
    return { ok: true, pases: lista.map((p) => ({ ...quitarInterno(p), tiene_recibo: p.es_mio && Boolean(p.pago_ref) })) }
  }

  async function recibo(usuario, paseId) {
    if (!pasarela) return { estado: 503, cuerpo: { ok: false, error: SIN_PASARELA } }
    const lista = (await rpc('pases_de', { p_uid: usuario.id })) ?? []
    const pase = lista.find((x) => x.id === paseId && x.es_mio)
    if (!pase?.pago_ref) return { estado: 404, cuerpo: { ok: false, error: 'No encontramos ese recibo.' } }
    const intencion = await rpc('intencion_de_pago', { p_pago_ref: pase.pago_ref })
    const url = await pasarela.recibo(intencion ?? pase.pago_ref)
    if (!url) return { estado: 404, cuerpo: { ok: false, error: 'El recibo todavía no está disponible.' } }
    await rpc('guardar_recibo', { p_pago_ref: pase.pago_ref, p_url: url })
    return { estado: 200, cuerpo: { ok: true, url } }
  }

  return { config, crearPago, procesarEvento, estadoDeSesion, pasesDe, recibo, pasarela, env }
}

/* ------------------------------------------------------------------ */
/* Las rutas                                                           */
/* ------------------------------------------------------------------ */

/** La dirección de la app para volver del pago: la del servidor (APP_URL) o, en desarrollo, la de localhost. Nunca una que mande el móvil sin comprobar. */
export function origenSeguro(env, req) {
  if (env.APP_URL) return String(env.APP_URL)
  const origen = String(req.headers?.origin ?? '')
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origen) ? origen : null
}

export function registrarRutasPagos(app, { admin, servicio, env = process.env }) {
  const conUsuario = (manejador) => async (req, res) => {
    if (!admin) return res.status(503).json({ ok: false, error: SIN_PASARELA })
    try {
      const usuario = await quienEs(admin, tokenDe(req))
      if (!usuario) return res.status(401).json({ ok: false, error: 'Tu sesión no es válida. Entra otra vez.' })
      await manejador(req, res, usuario)
    } catch (error) {
      console.error('[pagos]', error)
      res.status(500).json({ ok: false, error: 'No se ha podido completar. Inténtalo de nuevo.' })
    }
  }
  const responder = (res, { estado, cuerpo }) => res.status(estado).json(cuerpo)

  app.get('/api/pase/config', (_req, res) => res.json(servicio.config()))
  app.post('/api/pago/crear', conUsuario(async (req, res, u) => responder(res, await servicio.crearPago(u, req.body ?? {}, origenSeguro(env, req)))))
  app.get('/api/pago/estado', conUsuario(async (req, res, u) => res.json(await servicio.estadoDeSesion(u, String(req.query.sesion ?? '')))))
  app.get('/api/pases/mios', conUsuario(async (_req, res, u) => res.json(await servicio.pasesDe(u))))
  app.get('/api/pases/recibo', conUsuario(async (req, res, u) => responder(res, await servicio.recibo(u, String(req.query.pase ?? '')))))

  // El aviso de Stripe. Sin sesión de usuario: manda la firma. El cuerpo se comprueba TAL CUAL llegó (`req.rawBody`, que guarda el lector de JSON de index.js).
  app.post('/api/pago/webhook', async (req, res) => {
    const pasarela = servicio.pasarela
    if (!pasarela || pasarela.nombre !== 'stripe') return res.status(404).json({ ok: false })
    let evento
    try {
      evento = pasarela.verificarAviso(req.rawBody, req.get?.('stripe-signature') ?? req.headers?.['stripe-signature'])
    } catch (error) {
      console.warn('[pagos] aviso rechazado:', error.message)
      return res.status(400).json({ ok: false, error: 'Firma no válida.' })
    }
    try {
      const r = await servicio.procesarEvento(evento)
      res.status(r.ok ? 200 : 500).json(r) // (un 500 hace que Stripe lo repita más tarde)
    } catch (error) {
      console.error('[pagos] aviso sin procesar:', error)
      res.status(500).json({ ok: false })
    }
  })

  // Solo el pago de mentira: lo que haría el servicio de pago al terminar. Nunca existe en producción (`mentiraPermitida`).
  app.post('/api/pago/mentira/resolver', async (req, res) => {
    const pasarela = servicio.pasarela
    if (!pasarela || pasarela.nombre !== 'mentira' || !mentiraPermitida(env)) return res.status(404).json({ ok: false })
    try {
      const evento = pasarela.eventoDe(String(req.body?.sesion ?? ''), String(req.body?.resultado ?? ''))
      const r = evento ? await servicio.procesarEvento(evento) : { ok: true, accion: 'sin_aviso' }
      res.json(r)
    } catch (error) {
      console.error('[pagos/mentira]', error)
      res.status(500).json({ ok: false })
    }
  })
}
