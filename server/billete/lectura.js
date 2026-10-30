// LEER UN BILLETE (10S5, M): la parte del servidor. El billete (PDF, foto o captura de una tarjeta de embarque o de un billete de tren, autobús o barco) se lee con IA y se devuelve ya y
// sin más: NO se guarda en ningún sitio (ni caché, ni base de datos) y NO se escribe su contenido en ningún registro (solo el coste, por `logCallCost`). La clave de Claude vive aquí, nunca en el cliente.
// El nombre del pasajero NO se pide ni se devuelve: no hace falta para nada.

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

/**
 * POST /api/read-ticket  {file: {media_type, data(base64)}, mode?, year_hint?}  →  la lectura limpia.
 * `deps`: { anthropic, MODEL, logCallCost, extractJsonText, logAnthropicError } (los de index.js).
 */
export function registrarLeerBillete(app, deps) {
  const { anthropic, MODEL, logCallCost, extractJsonText, logAnthropicError } = deps
  app.post('/api/read-ticket', async (req, res) => {
    const { file, mode, year_hint: yearHint } = req.body ?? {}
    const hayArchivo = file && typeof file.data === 'string' && ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'].includes(file.media_type)
    if (!hayArchivo) {
      res.status(400).json({ error: 'Falta el archivo del billete.' })
      return
    }
    try {
      const intro = `Año por defecto: ${Number.isInteger(yearHint) ? yearHint : new Date().getFullYear()}.${['avion', 'tren', 'bus', 'ferry'].includes(mode) ? ` Es un billete de ${{ avion: 'avión', tren: 'tren', bus: 'autobús', ferry: 'barco' }[mode]}.` : ''}`
      const contenido = [
        file.media_type === 'application/pdf'
          ? { type: 'document', source: { type: 'base64', media_type: file.media_type, data: file.data } }
          : { type: 'image', source: { type: 'base64', media_type: file.media_type, data: file.data } },
        { type: 'text', text: intro },
      ]
      const respuesta = await anthropic.messages.create({ model: MODEL, max_tokens: 700, system: LEER_BILLETE_SISTEMA, messages: [{ role: 'user', content: contenido }] })
      logCallCost('read-ticket', respuesta)
      const bloque = respuesta.content.find((b) => b.type === 'text')
      if (!bloque) throw new Error('Respuesta de Claude sin bloque de texto')
      res.json(limpiarLecturaBillete(JSON.parse(extractJsonText(bloque.text))))
    } catch (error) {
      logAnthropicError('read-ticket', error)
      res.status(502).json({ error: 'No hemos podido leer el billete. Puedes añadirlo a mano.' })
    }
  })
}
