// LEER UN BILLETE (10S5, M): la parte del servidor. El billete (PDF, foto o captura de una tarjeta de embarque o de un billete de tren, autobús o barco) se lee con IA y se devuelve ya y
// sin más: NO se guarda en ningún sitio (ni caché, ni base de datos) y NO se escribe su contenido en ningún registro (solo el coste, por `logCallCost`). La clave de Claude vive aquí, nunca en el cliente.
// El nombre del pasajero NO se pide ni se devuelve: no hace falta para nada.

import { LEER_ALOJAMIENTO_SISTEMA, limpiarLecturaAlojamiento } from './lecturaAlojamiento.js'

export const LEER_BILLETE_SISTEMA = `Lees billetes (tarjetas de embarque, billetes de tren, autobús o barco; en PDF, foto o captura de pantalla, casi siempre en español, inglés, italiano, francés o alemán) para una app de viajes. Devuelves SOLO un JSON, sin texto alrededor, con estos campos (lo que no aparezca claro: null):
{"modo": "avion"|"tren"|"bus"|"ferry"|null,
 "numero": número de vuelo con la compañía y un espacio ("VY 6102") o número de tren sin la palabra "Tren" ("03180", "Frecciarossa 9612" -> "9612"), o null,
 "compania": nombre de la compañía ("Vueling", "Trenitalia", "Renfe", "Iryo") o null,
 "localizador": código de reserva (PNR, "Localizador", "Booking reference", "Codice prenotazione") o null,
 "fecha": "YYYY-MM-DD" del día de SALIDA o null (si no trae el año, usa el que te indico),
 "fecha_llegada": "YYYY-MM-DD" solo si la llegada es otro día, si no null,
 "hora_salida": "HH:MM" 24 h, hora LOCAL de salida, o null,
 "hora_llegada": "HH:MM" 24 h, hora LOCAL de llegada, o null,
 "origen":  {"ciudad": texto|null, "codigo": código IATA de 3 letras del aeropuerto si lo trae (o null; en tren, null), "nombre": nombre tal cual del aeropuerto o estación, "terminal": solo el número o la letra ("1", "2B"; sin la palabra Terminal)|null, "puerta": texto|null},
 "destino": {"ciudad": texto|null, "codigo": ..., "nombre": ..., "terminal": ..., "puerta": ...},
 "asiento": "14C" o null,
 "coche": en tren, el coche o vagón ("003") o null,
 "codigo_caja": si en la imagen o en alguna página se ve el código de barras 2D (QR, Aztec o PDF417) que escanean al embarcar: {"pagina": número de página empezando en 1 (1 si es una imagen), "x0": 0..1, "y0": 0..1, "x1": 0..1, "y1": 0..1} como fracciones del ancho y del alto de esa página, ajustado al código; si no se ve ninguno, null}
No inventes nada. No devuelvas el nombre del pasajero.`

export const LEER_ENTRADA_SISTEMA = `Lees entradas (a museos, monumentos, visitas, Free Tour y excursiones; en PDF, foto o captura de pantalla, casi siempre en español, inglés, italiano, francés o alemán) para una app de viajes. Devuelves SOLO un JSON, sin texto alrededor, con estos campos (lo que no aparezca claro: null):
{"fecha": "YYYY-MM-DD" del día de la visita o null (si no trae el año, usa el que te indico),
 "hora": "HH:MM" 24 h, hora de entrada o de inicio de la visita, o null,
 "personas": número entero de personas o entradas que cubre este documento (adultos + niños), o null si no se ve,
 "localizador": código de reserva ("Localizador", "Booking reference", "Codice prenotazione", "Order number") o null,
 "codigo_caja": si en la imagen o en alguna página se ve el código de barras 2D (QR, Aztec o PDF417) que escanean al entrar: {"pagina": número de página empezando en 1 (1 si es una imagen), "x0": 0..1, "y0": 0..1, "x1": 0..1, "y1": 0..1} como fracciones del ancho y del alto de esa página, ajustado al código; si no se ve ninguno, null}
No inventes nada. No devuelvas el nombre de ninguna persona.`

const HORA = /^([01]?\d|2[0-3]):[0-5]\d$/
const FECHA = /^\d{4}-\d{2}-\d{2}$/

const texto = (v, max = 80) => (typeof v === 'string' && v.replace(/\s+/g, ' ').trim() ? v.replace(/\s+/g, ' ').trim().slice(0, max) : null)

function punto(p) {
  const codigo = texto(p?.codigo, 5)?.toUpperCase() ?? null
  return {
    ciudad: texto(p?.ciudad),
    codigo: codigo && /^[A-Z]{3}$/.test(codigo) ? codigo : null,
    nombre: texto(p?.nombre, 100),
    terminal: texto(p?.terminal, 20)?.replace(/^terminal\s*/i, '').replace(/^t(?=\d)/i, '') || null,
    puerta: texto(p?.puerta, 20),
  }
}

/** Limpia lo que devuelve la IA: solo campos con la forma buena; el resto, null. Sin datos del pasajero aunque la IA los hubiera puesto. */
export function limpiarLecturaBillete(crudo) {
  const c = crudo && typeof crudo === 'object' ? crudo : {}
  const hora = (v) => { const t = texto(v, 5); return t && HORA.test(t) ? t.padStart(5, '0') : null }
  const fecha = (v) => { const t = texto(v, 10); return t && FECHA.test(t) ? t : null }
  const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : null)
  const caja = c.codigo_caja && typeof c.codigo_caja === 'object' ? c.codigo_caja : null
  const caja4 = caja ? { x0: num(caja.x0), y0: num(caja.y0), x1: num(caja.x1), y1: num(caja.y1) } : null
  const cajaBuena = caja4 && Object.values(caja4).every((v) => v != null) && caja4.x1 > caja4.x0 && caja4.y1 > caja4.y0
  return {
    modo: ['avion', 'tren', 'bus', 'ferry'].includes(c.modo) ? c.modo : null,
    numero: texto(c.numero, 20),
    compania: texto(c.compania, 60),
    localizador: texto(c.localizador, 30),
    fecha: fecha(c.fecha),
    fecha_llegada: fecha(c.fecha_llegada),
    hora_salida: hora(c.hora_salida),
    hora_llegada: hora(c.hora_llegada),
    origen: punto(c.origen),
    destino: punto(c.destino),
    asiento: texto(c.asiento, 8)?.toUpperCase() ?? null,
    coche: texto(c.coche, 8),
    codigo_caja: cajaBuena ? { pagina: Number.isInteger(caja.pagina) && caja.pagina >= 1 && caja.pagina <= 20 ? caja.pagina : 1, ...caja4 } : null,
  }
}

/** Limpia lo que devuelve la IA al leer una entrada: solo campos con la forma buena; el resto, null. */
export function limpiarLecturaEntrada(crudo) {
  const c = crudo && typeof crudo === 'object' ? crudo : {}
  const base = limpiarLecturaBillete({ fecha: c.fecha, hora_salida: c.hora, localizador: c.localizador, codigo_caja: c.codigo_caja })
  const n = typeof c.personas === 'number' ? Math.round(c.personas) : typeof c.personas === 'string' && /^\d{1,2}$/.test(c.personas.trim()) ? Number(c.personas) : null
  return {
    fecha: base.fecha,
    hora: base.hora_salida,
    personas: n != null && n >= 1 && n <= 50 ? n : null,
    localizador: base.localizador,
    codigo_caja: base.codigo_caja,
  }
}

// ── Quién puede leer, cuánto y de qué tamaño (10S8 §1) ───────────────────────────────────────────────────────────────────────────────────
// Cada lectura cuesta dinero (una llamada a Claude). Antes de leer el cuerpo —que puede pesar decenas de MB— se mira, solo con la cabecera: sesión de una cuenta (no anónima),
// pase (de esa persona o el de grupo del viaje, que `pases_de` ya cuenta) y el límite del día. Sin sesión o sin pase se responde con error y NO se llama a Claude.
export const MAX_LECTURAS_AL_DIA = 10
export const MAX_ARCHIVO_BYTES = 10 * 1024 * 1024
export const TEXTO_SIN_SESION = 'Entra en tu cuenta para leer documentos. Puedes añadir los datos a mano.'
export const TEXTO_SIN_PASE = 'Leer documentos es parte del Pase Roma. Puedes añadir los datos a mano.'
export const TEXTO_LIMITE = 'Has leído muchos documentos hoy. Puedes añadir los datos a mano.'
export const TEXTO_GRANDE = 'El archivo es demasiado grande. Prueba con una captura.'
export const TEXTO_NO_DISPONIBLE = 'Ahora mismo no podemos leer documentos. Puedes añadir los datos a mano.'
/** El modelo que lee los documentos (10S8: prueba Haiku frente a Sonnet, ver docs/dias/INFORME_TANDA10B.md › 10S8). */
export const MODELO_LECTURA = 'claude-haiku-4-5'

const hoyUtc = (ahora) => ahora().toISOString().slice(0, 10)
const bytesDeBase64 = (b64) => Math.floor((b64.length * 3) / 4) - (b64.endsWith('==') ? 2 : b64.endsWith('=') ? 1 : 0)

/** ¿Tiene esta cuenta un pase que vale hoy? `pases_de` (migración 0026) trae los suyos y los de grupo en los que está. Un pase anulado o ya terminado no vale para AÑADIR documentos (lo ya guardado se sigue viendo). */
export async function tienePaseVigente(admin, uid, hoy) {
  const { data, error } = await admin.rpc('pases_de', { p_uid: uid })
  if (error) throw new Error(`pases_de: ${error.message}`)
  const lista = Array.isArray(data) ? data : []
  return lista.some((p) => p?.estado === 'activo' && !(p.viaje?.fin && hoy > p.viaje.fin))
}

/**
 * POST /api/read-ticket  {file: {media_type, data(base64)}, mode?, year_hint?, tipo?}  →  la lectura limpia.
 * `deps`: { anthropic, MODEL, logCallCost, extractJsonText, logAnthropicError } (los de index.js) y, de 10S8: `express`, `admin` (Supabase con la clave de servicio), `quienEs`, `tokenDe`,
 * `ahora` y `lecturas` (el contador del día; en memoria del servidor: un reinicio lo pone a cero y en Vercel es por instancia).
 * El pase se exige SIEMPRE, también con el cobro apagado (Eric, 31-oct: leer cuesta dinero). Sin la clave de servicio no se puede comprobar nada y NO se lee (cierra, no abre).
 */
export function registrarLeerBillete(app, deps) {
  const { anthropic, MODEL, logCallCost, extractJsonText, logAnthropicError, admin = null, quienEs, tokenDe, ahora = () => new Date(), lecturas = new Map(), express } = deps
  const modeloLectura = deps.modeloLectura ?? MODELO_LECTURA ?? MODEL
  const clave = (uid) => `${uid}|${hoyUtc(ahora)}`
  // El contador del día: en la tabla `lecturas_de_documentos` (migración 0073; vale en Vercel y tras reinicios) y, si la 0073 aún no está aplicada (o la base falla), en memoria del servidor SIN romper nada.
  const enMemoria = {
    reservar: (uid) => {
      for (const k of [...lecturas.keys()]) if (!k.endsWith(`|${hoyUtc(ahora)}`)) lecturas.delete(k) // (se tiran los días pasados)
      if ((lecturas.get(clave(uid)) ?? 0) >= MAX_LECTURAS_AL_DIA) return false
      lecturas.set(clave(uid), (lecturas.get(clave(uid)) ?? 0) + 1)
      return true
    },
    liberar: (uid) => lecturas.set(clave(uid), Math.max(0, (lecturas.get(clave(uid)) ?? 1) - 1)),
  }
  const reservar = async (uid) => {
    try {
      const { data, error } = await admin.rpc('registrar_lectura', { p_uid: uid, p_limite: MAX_LECTURAS_AL_DIA })
      if (!error && typeof data === 'boolean') return { puede: data, tabla: true }
      if (!avisadoSinTabla) { avisadoSinTabla = true; console.warn('[read-ticket] sin la tabla de lecturas (¿falta aplicar la 0073?): contador en memoria.', error?.message ?? '') }
    } catch (e) {
      console.warn('[read-ticket] contador en la base caído, contador en memoria:', e?.message ?? e)
    }
    return { puede: enMemoria.reservar(uid), tabla: false }
  }
  const liberar = async (uid, tabla) => {
    if (tabla) await Promise.resolve(admin.rpc('devolver_lectura', { p_uid: uid })).catch(() => {})
    else enMemoria.liberar(uid)
  }
  let avisadoSinTabla = false

  // 1. La puerta: sin leer el cuerpo.
  const puerta = async (req, res, next) => {
    try {
      if (!admin || !quienEs || !tokenDe) return res.status(503).json({ error: TEXTO_NO_DISPONIBLE, codigo: 'no_disponible' })
      const usuario = await quienEs(admin, tokenDe(req))
      if (!usuario || usuario.is_anonymous === true) return res.status(401).json({ error: TEXTO_SIN_SESION, codigo: 'sin_sesion' })
      if (!(await tienePaseVigente(admin, usuario.id, hoyUtc(ahora)))) return res.status(403).json({ error: TEXTO_SIN_PASE, codigo: 'sin_pase' })
      const { puede, tabla } = await reservar(usuario.id) // se apunta ya (atómico: dos peticiones a la vez no se cuelan); se devuelve si al final no se llama a Claude
      if (!puede) return res.status(429).json({ error: TEXTO_LIMITE, codigo: 'limite' })
      req.usuarioLectura = usuario
      req.lecturaEnTabla = tabla
      next()
    } catch (error) {
      console.error('[read-ticket] puerta:', error?.message ?? error)
      res.status(503).json({ error: TEXTO_NO_DISPONIBLE, codigo: 'no_disponible' })
    }
  }
  // 2. El cuerpo, con tope propio (el general de index.js se salta esta ruta): pasa solo quien ha entrado.
  const cuerpo = (req, res, next) =>
    express.json({ limit: '24mb' })(req, res, (error) => {
      if (!error) return next()
      void liberar(req.usuarioLectura.id, req.lecturaEnTabla)
      const grande = error.status === 413 || error.type === 'entity.too.large'
      res.status(grande ? 413 : 400).json(grande ? { error: TEXTO_GRANDE, codigo: 'grande' } : { error: 'Falta el archivo del billete.' })
    })

  app.post('/api/read-ticket', puerta, cuerpo, async (req, res) => {
    const uid = req.usuarioLectura.id
    const devolver = () => liberar(uid, req.lecturaEnTabla)
    const { file, mode, year_hint: yearHint, tipo } = req.body ?? {}
    const esEntrada = tipo === 'entrada'
    const esAlojamiento = tipo === 'alojamiento' // 10S7 §5: la reserva de un hotel (server/billete/lecturaAlojamiento.js)
    const hayArchivo = file && typeof file.data === 'string' && ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'].includes(file.media_type)
    if (!hayArchivo) {
      await devolver()
      res.status(400).json({ error: 'Falta el archivo del billete.' })
      return
    }
    if (bytesDeBase64(file.data) > MAX_ARCHIVO_BYTES) {
      await devolver()
      res.status(413).json({ error: TEXTO_GRANDE, codigo: 'grande' })
      return
    }
    try {
      const intro = `Año por defecto: ${Number.isInteger(yearHint) ? yearHint : new Date().getFullYear()}.${esEntrada || esAlojamiento ? '' : ['avion', 'tren', 'bus', 'ferry'].includes(mode) ? ` Es un billete de ${{ avion: 'avión', tren: 'tren', bus: 'autobús', ferry: 'barco' }[mode]}.` : ''}`
      const contenido = [
        file.media_type === 'application/pdf'
          ? { type: 'document', source: { type: 'base64', media_type: file.media_type, data: file.data } }
          : { type: 'image', source: { type: 'base64', media_type: file.media_type, data: file.data } },
        { type: 'text', text: intro },
      ]
      const respuesta = await anthropic.messages.create({ model: modeloLectura, max_tokens: 700, system: esAlojamiento ? LEER_ALOJAMIENTO_SISTEMA : esEntrada ? LEER_ENTRADA_SISTEMA : LEER_BILLETE_SISTEMA, messages: [{ role: 'user', content: contenido }] })
      // (El coste de CADA lectura sale en el registro: `[cost] … read-ticket / read-entry-ticket / read-lodging-booking`, con el modelo.)
      logCallCost(esAlojamiento ? 'read-lodging-booking' : esEntrada ? 'read-entry-ticket' : 'read-ticket', respuesta, modeloLectura)
      const bloque = respuesta.content.find((b) => b.type === 'text')
      if (!bloque) throw new Error('Respuesta de Claude sin bloque de texto')
      const crudo = JSON.parse(extractJsonText(bloque.text))
      res.json(esAlojamiento ? limpiarLecturaAlojamiento(crudo) : esEntrada ? limpiarLecturaEntrada(crudo) : limpiarLecturaBillete(crudo))
    } catch (error) {
      logAnthropicError('read-ticket', error)
      res.status(502).json({ error: 'No hemos podido leer el billete. Puedes añadirlo a mano.' })
    }
  })
}
