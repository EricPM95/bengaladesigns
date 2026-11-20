/**
 * «CUÉNTANOS» (V20): lo que el viajero manda desde la app (un restaurante, un lugar, un destino, una foto, un dato mal, un consejo, algo que no funciona, una idea). Tabla `avisos_de_viajeros`
 * (supabase/migrations/0085_avisos_de_viajeros.sql). Todo lo que toca la base son funciones de esa migración, que solo puede llamar el servidor (clave de servicio).
 *
 *   POST  /api/avisos/subida                          {cuantas:1..3, clase:'foto'|'captura'|'foto_entera'} → {ok, subidas:[{ruta, url}]}  direcciones firmadas de SUBIDA al almacén privado `avisos-viajeros`
 *   POST  /api/avisos-viajeros                        el aviso (ver `normalizarAviso`)                    → {ok, id, guardado}
 *   GET   /api/admin/avisos-viajeros?tipo=&destino=&estado=&limite=   → {ok, items:[{..., fotos_urls, captura_url}], nuevos}   (solo administrador)
 *   PATCH /api/admin/avisos-viajeros/:id              {estado:'visto'|'hecho'|'descartado'|'usada', texto?} → {ok, avisado}
 *   GET   /api/admin/avisos-viajeros/destinos         → [{destino, cuantos, pendientes, primero, ultimo, avisables}]
 *   POST  /api/admin/avisos-viajeros/destinos/ya-esta {destino, texto?} → {ok, avisados}
 *   POST  /api/admin/avisos-viajeros/:id/usar-foto    {sitio, destino, credito?} → {ok, url_publica, avisado}
 *   GET   /api/fotos-de-viajeros?destino=             (público, solo lectura) → [{sitio, url, credito_texto}]
 *
 * PRIVACIDAD: sin cuenta, con sesión anónima o con `avisame` apagado NO se guarda user_id (ni IP, ni nada de la persona). Con cuenta de verdad Y avisame = true se guarda el user_id para escribirle en la campana
 * («gracias_viajero») cuando el administrador lo marque como hecho. El freno por persona usa un hash salado que SOLO vive en memoria (la IP no se guarda en ningún sitio). Se tachan correos, tokens y claves (`limpiarTexto`).
 */
import { createHash, randomBytes, randomUUID } from 'node:crypto'
import { limpiarTexto, crearFreno } from './errores.js'
import { quienEs, tokenDe } from './cuentas.js'
import { esAdmin } from './logros/rutas.js'
import { crearCorreo } from './correo.js'
import { crearAvisoInterno } from './panel/avisoInterno.js'

export const BUCKET_AVISOS = 'avisos-viajeros'
export const BUCKET_FOTOS_PUBLICAS = 'fotos-de-viajeros'
export const TIPOS = ['restaurante', 'lugar', 'destino', 'foto', 'dato_mal', 'consejo', 'no_funciona', 'idea']
export const ESTADOS = ['visto', 'hecho', 'descartado', 'usada']
const CLASES = { foto: 'foto', captura: 'captura', foto_entera: 'entera' }
const POR_HORA = 10
const SUBIDAS_POR_HORA = 30
const RUTA_FOTO = /^(foto|entera)\/[A-Za-z0-9-]{8,64}$/
const RUTA_CAPTURA = /^captura\/[A-Za-z0-9-]{8,64}$/
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const MIN = 2

const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {})
const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null)
/** Una cadena corta con solo letras, números, guiones y puntos (ids de viaje y de sitio: no son datos de nadie y no deben tacharse como si fueran un UUID). */
const idSimple = (v, max = 64) => String(v ?? '').trim().slice(0, max).replace(/[^\w.-]/g, '')
/** Sin mayúsculas, sin tildes y sin espacios de más (la forma en que se comparan dos destinos). */
export const normalizarDestino = (t) =>
  String(t ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
const slug = (t) => normalizarDestino(t).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'sitio'

/** Pura: valida y limpia `datos` según el tipo. Devuelve { datos } o { error }. */
export function validarDatos(tipo, crudo) {
  const d = obj(crudo)
  const t = (v, max) => limpiarTexto(v, max)
  const falta = (que) => ({ error: `Falta ${que}.` })
  switch (tipo) {
    case 'restaurante': {
      const nombre = t(d.nombre, 120)
      if (nombre.length < MIN) return falta('el nombre del restaurante')
      return { datos: { nombre, precio: ['€', '€€', '€€€'].includes(d.precio) ? d.precio : null, bueno: t(d.bueno, 500) } }
    }
    case 'lugar': {
      const nombre = t(d.nombre, 120)
      if (nombre.length < MIN) return falta('el nombre del lugar')
      return { datos: { nombre, porque: t(d.porque, 500) } }
    }
    case 'dato_mal': {
      const sitio = t(d.sitio, 120)
      if (sitio.length < MIN) return falta('el sitio')
      const falla = ['horario', 'precio', 'cerrado', 'ubicacion', 'foto', 'otro'].includes(d.falla) ? d.falla : null
      if (!falla) return falta('qué falla')
      return { datos: { sitio, sitio_id: idSimple(d.sitio_id, 80) || null, falla, mas: t(d.mas, 600) } }
    }
    case 'consejo': {
      const sitio = t(d.sitio, 120)
      const consejo = t(d.consejo, 800)
      if (sitio.length < MIN) return falta('el sitio')
      if (consejo.length < MIN) return falta('el consejo')
      return { datos: { sitio, consejo } }
    }
    case 'no_funciona': {
      const que = t(d.que, 800)
      if (que.length < MIN) return falta('qué no funciona')
      return { datos: { que } }
    }
    case 'idea': {
      const texto = t(d.texto, 1000)
      if (texto.length < MIN) return falta('la idea')
      return { datos: { texto } }
    }
    case 'destino': {
      const destino = t(d.destino, 80)
      if (destino.length < MIN) return falta('el destino')
      const cuando = ['este_ano', 'el_ano_que_viene', 'algun_dia'].includes(d.cuando) ? d.cuando : 'algun_dia'
      return { datos: { destino, cuando, mas: t(d.mas, 500) } }
    }
    case 'foto': {
      const sitio = t(d.sitio, 120)
      const nombre = t(d.nombre_en_foto, 80)
      if (d.acepta !== true) return { error: 'Hay que aceptar que podemos usar la foto.' }
      if (sitio.length < MIN) return falta('el sitio')
      if (nombre.length < MIN) return falta('el nombre para el crédito')
      return { datos: { sitio, nombre_en_foto: nombre, acepta: true } }
    }
    default:
      return { error: 'Tipo de aviso no válido.' }
  }
}

/** Pura: del cuerpo que llega saca la fila que se guarda (limpia y recortada, SIN user_id), o { error }. */
export function normalizarAviso(cuerpo) {
  const b = obj(cuerpo)
  if (!TIPOS.includes(b.tipo)) return { error: 'Tipo de aviso no válido.' }
  const v = validarDatos(b.tipo, b.datos)
  if (v.error) return { error: v.error }
  let fotos = []
  if (b.fotos != null) {
    if (!Array.isArray(b.fotos)) return { error: 'Las fotos no son válidas.' }
    if (b.fotos.length > 3) return { error: 'Como máximo 3 fotos.' }
    fotos = b.fotos.map((x) => String(x ?? ''))
    if (!fotos.every((x) => RUTA_FOTO.test(x))) return { error: 'Las fotos no son válidas.' }
  }
  if (b.tipo === 'foto' && fotos.length < 1) return { error: 'Falta la foto.' }
  const captura = b.captura == null || b.captura === '' ? null : String(b.captura)
  if (captura !== null && !RUTA_CAPTURA.test(captura)) return { error: 'La captura no es válida.' }
  const hora = typeof b.hora === 'string' && !Number.isNaN(Date.parse(b.hora)) ? new Date(b.hora).toISOString() : null
  const p = obj(b.punto)
  const lat = num(p.lat)
  const lng = num(p.lng)
  const punto = lat !== null && lng !== null && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? { lat, lng, ...(p.direccion ? { direccion: limpiarTexto(p.direccion, 200) } : {}) } : null
  const errores = Array.isArray(b.errores) ? b.errores.slice(0, 10).map((x) => limpiarTexto(x, 300)).filter(Boolean) : null
  return {
    fila: {
      tipo: b.tipo,
      datos: v.datos,
      destino: limpiarTexto(b.destino, 80),
      trip_id: idSimple(b.trip_id),
      pantalla: limpiarTexto(b.pantalla, 80),
      pestana: limpiarTexto(b.pestana, 40),
      parada: limpiarTexto(b.parada, 80),
      dia: limpiarTexto(b.dia, 20),
      version_app: limpiarTexto(b.version, 40),
      dispositivo: limpiarTexto(b.dispositivo, 120),
      navegador: limpiarTexto(b.navegador, 200),
      hora_cliente: hora,
      punto,
      fotos,
      captura,
      errores: errores && errores.length ? errores : null,
      avisame: b.avisame === true,
    },
  }
}

/** El texto que se pone en la clave del freno: lo principal que escribió (para frenar al que manda lo mismo muchas veces). */
const textoClave = (fila) => normalizarDestino(Object.values(fila.datos).find((x) => typeof x === 'string' && x.length > 1) ?? '').slice(0, 80)

/** Un máximo de peticiones por clave y hora, en memoria. */
function limitadorPorHora(maximo, ahora) {
  const cuentas = new Map()
  return (clave) => {
    const t = ahora()
    const previos = (cuentas.get(clave) ?? []).filter((x) => t - x < 3600_000)
    if (previos.length >= maximo) {
      cuentas.set(clave, previos)
      return false
    }
    previos.push(t)
    cuentas.set(clave, previos)
    if (cuentas.size > 5000) for (const [k, v] of cuentas) if (!v.some((x) => t - x < 3600_000)) cuentas.delete(k)
    return true
  }
}

export function registrarRutasAvisosViajeros(app, { admin = null, env = process.env, consola = console, ahora = () => Date.now(), correo = crearCorreo({ apiKey: env.RESEND_API_KEY }) } = {}) {
  // (V33) El aviso interno a soporte@ cuando entra un reporte (como mucho uno cada 15 minutos; sin RESEND_API_KEY no hace nada).
  const avisoInterno = admin ? crearAvisoInterno({ admin, correo, env, ahora: () => new Date(ahora()), consola }) : null
  const frena = crearFreno(ahora)
  const frenaSubidas = crearFreno(ahora)
  const porHora = limitadorPorHora(POR_HORA, ahora)
  const subidasPorHora = limitadorPorHora(SUBIDAS_POR_HORA, ahora)
  // La sal solo vive en memoria: ni la IP ni la huella se guardan en ningún sitio.
  const sal = randomBytes(16)
  const huella = (...partes) => createHash('sha256').update(sal).update(partes.join('|')).digest('hex').slice(0, 24)
  const huellaDeDispositivo = (req) => huella('h', req.ip ?? req.headers?.['x-forwarded-for'] ?? '', req.get?.('user-agent') ?? '')

  const rpc = async (nombre, args = {}) => {
    const { data, error } = await admin.rpc(nombre, args)
    if (error) throw new Error(`${nombre}: ${error.message}`)
    return data
  }
  const quien = async (req) => {
    const token = tokenDe(req)
    if (!admin || !token) return null
    try {
      return await quienEs(admin, token)
    } catch {
      return null
    }
  }
  const falloInterno = (res, e, etiqueta) => {
    try {
      consola.error(`[avisos-viajeros] ${etiqueta}:`, e?.message ?? e)
    } catch {
      /* nada más que hacer */
    }
    return res.status(500).json({ ok: false, error: 'No hemos podido hacerlo. Inténtalo más tarde.' })
  }
  const conAdmin = (manejador) => async (req, res) => {
    try {
      if (!admin) return res.status(503).json({ ok: false, error: 'Falta la clave de servicio de Supabase.' })
      const u = await quien(req)
      if (!u) return res.status(401).json({ ok: false, error: 'Tu sesión no es válida. Entra otra vez.' })
      if (!esAdmin(u, env)) return res.status(403).json({ ok: false, error: 'Solo para el administrador.' })
      return await manejador(req, res, u)
    } catch (e) {
      return falloInterno(res, e, 'admin')
    }
  }

  // 1. Direcciones firmadas de subida (el móvil sube el archivo directo al almacén privado: Vercel limita el cuerpo a 4,5 MB).
  app.post('/api/avisos/subida', async (req, res) => {
    try {
      const b = obj(req.body)
      const cuantas = Number(b.cuantas)
      const carpeta = CLASES[b.clase]
      if (!carpeta || !Number.isInteger(cuantas) || cuantas < 1 || cuantas > 3) return res.status(400).json({ ok: false, error: 'Petición no válida.' })
      const u = await quien(req)
      const clave = u && u.is_anonymous !== true ? huella('u', u.id) : huellaDeDispositivo(req)
      if (!frenaSubidas(clave) || !subidasPorHora(clave)) return res.status(429).json({ ok: false, error: 'Demasiadas subidas seguidas. Inténtalo más tarde.' })
      if (!admin) return res.status(200).json({ ok: true, subidas: [], sin_almacen: true })
      const subidas = []
      for (let i = 0; i < cuantas; i++) {
        const ruta = `${carpeta}/${randomUUID()}`
        const { data, error } = await admin.storage.from(BUCKET_AVISOS).createSignedUploadUrl(ruta)
        if (error || !data?.signedUrl) throw new Error(error?.message ?? 'sin dirección de subida')
        subidas.push({ ruta, url: data.signedUrl })
      }
      return res.status(200).json({ ok: true, subidas })
    } catch (e) {
      return falloInterno(res, e, 'subida')
    }
  })

  // 2. El aviso.
  app.post('/api/avisos-viajeros', async (req, res) => {
    try {
      const r = normalizarAviso(req.body)
      if (r.error) return res.status(400).json({ ok: false, error: r.error })
      const fila = r.fila
      const u = await quien(req)
      const deVerdad = Boolean(u) && u.is_anonymous !== true
      const clave = deVerdad ? huella('u', u.id) : huellaDeDispositivo(req)
      if (!frena(`${fila.tipo}|${textoClave(fila)}`) || !porHora(clave)) return res.status(429).json({ ok: false, error: 'Demasiados avisos seguidos. Inténtalo más tarde.' })
      consola.log('[avisos-viajeros]', JSON.stringify({ tipo: fila.tipo, destino: fila.destino, pantalla: fila.pantalla }))
      if (!admin) return res.status(200).json({ ok: true, id: null, guardado: false })
      // La captura solo se guarda si existe de verdad en el almacén.
      if (fila.captura) {
        const [carpeta, nombre] = fila.captura.split('/')
        const { data } = await admin.storage.from(BUCKET_AVISOS).list(carpeta, { limit: 20, search: nombre })
        if (!(data ?? []).some((x) => x.name === nombre)) fila.captura = null
      }
      // Solo con cuenta de verdad Y avisame se guarda quién es; en cualquier otro caso, nada de la persona.
      const user_id = deVerdad && fila.avisame ? u.id : null
      const id = await rpc('aviso_viajero_guardar', { p: { ...fila, user_id } })
      if (avisoInterno) await avisoInterno.intentar()
      return res.status(200).json({ ok: true, id, guardado: true })
    } catch (e) {
      return falloInterno(res, e, 'guardar')
    }
  })

  // 3. El administrador.
  const firmar = async (bucket, rutas) => {
    const mapa = new Map()
    const unicas = [...new Set(rutas.filter(Boolean))]
    if (unicas.length === 0) return mapa
    const { data } = await admin.storage.from(bucket).createSignedUrls(unicas, 3600)
    for (const x of data ?? []) if (x?.signedUrl) mapa.set(x.path, x.signedUrl)
    return mapa
  }
  app.get('/api/admin/avisos-viajeros', conAdmin(async (req, res) => {
    const tipo = TIPOS.includes(req.query.tipo) ? req.query.tipo : null
    const estado = ['nuevo', ...ESTADOS].includes(req.query.estado) ? req.query.estado : null
    const limite = Math.max(1, Math.min(Number.parseInt(String(req.query.limite ?? ''), 10) || 100, 500))
    const lista = await rpc('avisos_viajeros_listar', { p_tipo: tipo, p_destino: limpiarTexto(req.query.destino, 80) || null, p_estado: estado, p_limite: limite })
    const items = lista?.items ?? []
    const urls = await firmar(BUCKET_AVISOS, items.flatMap((i) => [...(i.fotos ?? []), i.captura]))
    return res.json({
      ok: true,
      items: items.map((i) => ({ ...i, fotos_urls: (i.fotos ?? []).map((f) => urls.get(f) ?? null).filter(Boolean), captura_url: i.captura ? (urls.get(i.captura) ?? null) : null })),
      nuevos: Number(lista?.nuevos ?? 0),
    })
  }))

  // (Estas dos van antes que las de :id.)
  app.get('/api/admin/avisos-viajeros/destinos', conAdmin(async (_req, res) => res.json(await rpc('avisos_viajeros_destinos'))))
  app.post('/api/admin/avisos-viajeros/destinos/ya-esta', conAdmin(async (req, res) => {
    const destino = limpiarTexto(obj(req.body).destino, 80)
    if (destino.length < MIN) return res.status(400).json({ ok: false, error: 'Falta el destino.' })
    const texto = limpiarTexto(obj(req.body).texto, 300) || `¡${destino} ya está en JUTRIP! Tú lo pediste.`
    const avisados = await rpc('avisos_viajeros_ya_esta', { p_destino: destino, p_texto: texto })
    return res.json({ ok: true, avisados: Number(avisados) || 0 })
  }))

  app.patch('/api/admin/avisos-viajeros/:id', conAdmin(async (req, res) => {
    const id = String(req.params.id)
    const estado = obj(req.body).estado
    if (!UUID.test(id) || !ESTADOS.includes(estado)) return res.status(400).json({ ok: false, error: 'Petición no válida.' })
    const r = await rpc('aviso_viajero_marcar', { p_id: id, p_estado: estado, p_texto: limpiarTexto(obj(req.body).texto, 300) || null })
    if (!r?.encontrado) return res.status(404).json({ ok: false, error: 'Ese aviso no existe.' })
    return res.json({ ok: true, avisado: r.avisado === true })
  }))

  app.post('/api/admin/avisos-viajeros/:id/usar-foto', conAdmin(async (req, res) => {
    const id = String(req.params.id)
    const sitio = limpiarTexto(obj(req.body).sitio, 120)
    const destino = limpiarTexto(obj(req.body).destino, 80)
    if (!UUID.test(id) || sitio.length < MIN || destino.length < MIN) return res.status(400).json({ ok: false, error: 'Falta el sitio o el destino.' })
    const fila = await rpc('aviso_viajero_obtener', { p_id: id })
    if (!fila) return res.status(404).json({ ok: false, error: 'Ese aviso no existe.' })
    if (fila.tipo !== 'foto' || !fila.fotos?.length) return res.status(400).json({ ok: false, error: 'Ese aviso no es una foto.' })
    // Se copia del almacén privado al público (solo la primera foto).
    const origen = fila.fotos[0]
    const bajada = await admin.storage.from(BUCKET_AVISOS).download(origen)
    if (bajada.error || !bajada.data) throw new Error(`no se pudo leer la foto: ${bajada.error?.message ?? 'vacía'}`)
    const contenido = Buffer.from(await bajada.data.arrayBuffer())
    const destinoRuta = `${slug(destino)}/${slug(sitio)}-${id.slice(0, 8)}`
    const subida = await admin.storage.from(BUCKET_FOTOS_PUBLICAS).upload(destinoRuta, contenido, { contentType: bajada.data.type || 'image/jpeg', upsert: true })
    if (subida.error) throw new Error(`no se pudo copiar la foto: ${subida.error.message}`)
    const url = admin.storage.from(BUCKET_FOTOS_PUBLICAS).getPublicUrl(destinoRuta)?.data?.publicUrl
    const credito = limpiarTexto(obj(req.body).credito, 120) || `Foto: ${fila.datos?.nombre_en_foto ?? ''}`.trim()
    const r = await rpc('aviso_viajero_foto_usada', { p_id: id, p_aprobada: { sitio, destino, url_publica: url, credito_texto: credito } })
    return res.json({ ok: true, url_publica: url, avisado: r?.avisado === true })
  }))

  // 4. Las fotos aprobadas (público, solo lectura): para el servidor de fotos.
  app.get('/api/fotos-de-viajeros', async (req, res) => {
    try {
      res.set('Cache-Control', 'public, max-age=60')
      if (!admin) return res.json([])
      return res.json((await rpc('fotos_de_viajeros', { p_destino: limpiarTexto(req.query.destino, 80) || null })) ?? [])
    } catch (e) {
      return falloInterno(res, e, 'fotos')
    }
  })
}
