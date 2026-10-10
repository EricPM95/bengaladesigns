/**
 * El tiempo desde nuestro servidor (Tanda 6z6c, punto 3). Fuente: Open-Meteo (gratis, sin clave). La app NUNCA llama al proveedor:
 * pide a /api/tiempo/horas y /api/tiempo/dias, y el servidor guarda cada respuesta en memoria por coordenadas REDONDEADAS (2 decimales)
 * y fechas, compartida por todos los viajeros. Las peticiones iguales en vuelo se juntan en una sola. Un fallo del proveedor no se guarda.
 */
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast'
/** Cuánto vale una respuesta guardada antes de volver a pedirla al proveedor. */
export const TIEMPO_TTL_MS = 3 * 60 * 60 * 1000
/** Máximo de respuestas guardadas; al llenarse se tiran las caducadas y, si hace falta, las más antiguas. */
export const TIEMPO_MAX_ENTRADAS = 2000
const TIMEOUT_MS = 8000
const ISO = /^\d{4}-\d{2}-\d{2}$/
/** La caché de Vercel (CDN, la misma para todos los viajeros y todas las instancias): 3 horas fresca y, pasadas, se sirve la vieja mientras se renueva. Solo en respuestas buenas. */
export const TIEMPO_CACHE_CONTROL = `public, max-age=0, s-maxage=${TIEMPO_TTL_MS / 1000}, stale-while-revalidate=${TIEMPO_TTL_MS / 1000}`

const guardado = new Map() // clave → { at, value }
const enVuelo = new Map() // clave → Promise
export const estadisticas = { pedidasAlProveedor: 0, desdeCache: 0, fallos: 0 }

/** lat/lng numéricos y en rango → redondeados a 2 decimales; si no, null. */
export function coordenadasValidas(latRaw, lngRaw) {
  if (latRaw === undefined || lngRaw === undefined || latRaw === '' || lngRaw === '') return null
  const lat = Number(latRaw)
  const lng = Number(lngRaw)
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) return null
  return { lat: Number(lat.toFixed(2)), lng: Number(lng.toFixed(2)) }
}

/** Fecha ISO real (AAAA-MM-DD, existente) o null. */
export function fechaValida(texto) {
  if (typeof texto !== 'string' || !ISO.test(texto)) return null
  const fecha = new Date(`${texto}T00:00:00Z`)
  return Number.isNaN(fecha.getTime()) || fecha.toISOString().slice(0, 10) !== texto ? null : texto
}

function podar(ahora) {
  if (guardado.size < TIEMPO_MAX_ENTRADAS) return
  for (const [clave, entrada] of guardado) if (ahora - entrada.at >= TIEMPO_TTL_MS) guardado.delete(clave)
  while (guardado.size >= TIEMPO_MAX_ENTRADAS) guardado.delete(guardado.keys().next().value)
}

/** Caché + deduplicación. `pedir` devuelve el valor o null si falla (y entonces no se guarda). */
async function conCache(clave, pedir) {
  const ahora = Date.now()
  const hit = guardado.get(clave)
  if (hit && ahora - hit.at < TIEMPO_TTL_MS) {
    estadisticas.desdeCache += 1
    return { value: hit.value, cache: true }
  }
  let promesa = enVuelo.get(clave)
  if (!promesa) {
    promesa = (async () => {
      try {
        const value = await pedir()
        if (value) {
          podar(Date.now())
          guardado.set(clave, { at: Date.now(), value })
        } else estadisticas.fallos += 1
        return value
      } catch {
        estadisticas.fallos += 1
        return null
      } finally {
        enVuelo.delete(clave)
      }
    })()
    enVuelo.set(clave, promesa)
  }
  return { value: await promesa, cache: false }
}

async function pedirProveedor(parametros, pedir) {
  const url = new URL(FORECAST_URL)
  for (const [clave, valor] of Object.entries(parametros)) url.searchParams.set(clave, String(valor))
  url.searchParams.set('timezone', 'auto')
  estadisticas.pedidasAlProveedor += 1
  console.log(`[tiempo] proveedor: ${parametros.latitude},${parametros.longitude} ${parametros.start_date}..${parametros.end_date} (${parametros.hourly ? 'horas' : 'dias'})`)
  const respuesta = await pedir(url.toString(), { signal: AbortSignal.timeout(TIMEOUT_MS) })
  if (!respuesta.ok) return null
  return respuesta.json()
}

/** Probabilidad (%) y precipitación (mm) de cada hora 0-23 de un día; null si el proveedor no da datos. */
export async function tiempoPorHoras(coords, fecha, pedir = fetch) {
  return conCache(`h|${coords.lat},${coords.lng}|${fecha}`, async () => {
    const data = await pedirProveedor({ latitude: coords.lat, longitude: coords.lng, hourly: 'precipitation_probability,precipitation', start_date: fecha, end_date: fecha }, pedir)
    const times = data?.hourly?.time
    if (!Array.isArray(times)) return null
    const probability = new Array(24).fill(0)
    const precipitation = new Array(24).fill(0)
    times.forEach((time, index) => {
      const hour = Number(String(time).slice(11, 13))
      if (Number.isNaN(hour) || hour < 0 || hour > 23) return
      probability[hour] = data.hourly.precipitation_probability?.[index] ?? 0
      precipitation[hour] = data.hourly.precipitation?.[index] ?? 0
    })
    return { probability, precipitation }
  })
}

/** Temperaturas y lluvia máxima de cada día entre dos fechas; null si no hay. */
export async function tiempoPorDias(coords, desde, hasta, pedir = fetch) {
  return conCache(`d|${coords.lat},${coords.lng}|${desde}|${hasta}`, async () => {
    const data = await pedirProveedor({ latitude: coords.lat, longitude: coords.lng, daily: 'temperature_2m_max,temperature_2m_min,precipitation_probability_max', start_date: desde, end_date: hasta }, pedir)
    const times = data?.daily?.time
    if (!Array.isArray(times) || times.length === 0) return null
    return times.map((time, index) => ({
      dateIso: time,
      maxima: data.daily.temperature_2m_max?.[index] ?? null,
      minima: data.daily.temperature_2m_min?.[index] ?? null,
      lluvia: data.daily.precipitation_probability_max?.[index] ?? null,
    }))
  })
}

/** Registra las dos rutas en la app de Express. */
export function registrarRutasTiempo(app, pedir = fetch) {
  app.get('/api/tiempo/horas', async (req, res) => {
    const coords = coordenadasValidas(req.query.lat, req.query.lng)
    const fecha = fechaValida(req.query.fecha)
    if (!coords || !fecha) return res.status(400).set('Cache-Control', 'no-store').json({ ok: false, error: 'lat, lng (rango válido) y fecha (AAAA-MM-DD) son obligatorios.' })
    const { value, cache } = await tiempoPorHoras(coords, fecha, pedir)
    if (!value) return res.status(502).set('Cache-Control', 'no-store').json({ ok: false })
    res.set('Cache-Control', TIEMPO_CACHE_CONTROL).set('X-Tiempo-Cache', cache ? 'HIT' : 'MISS').json({ ok: true, ...value })
  })
  app.get('/api/tiempo/dias', async (req, res) => {
    const coords = coordenadasValidas(req.query.lat, req.query.lng)
    const desde = fechaValida(req.query.desde)
    const hasta = fechaValida(req.query.hasta)
    // Open-Meteo da hasta 16 días: más allá no tiene sentido pedir (y evita claves infinitas en la caché).
    if (!coords || !desde || !hasta || hasta < desde || (Date.parse(hasta) - Date.parse(desde)) / 86400000 > 31) {
      return res.status(400).set('Cache-Control', 'no-store').json({ ok: false, error: 'lat, lng, desde y hasta (AAAA-MM-DD, hasta >= desde, máximo 31 días) son obligatorios.' })
    }
    const { value, cache } = await tiempoPorDias(coords, desde, hasta, pedir)
    if (!value) return res.status(502).set('Cache-Control', 'no-store').json({ ok: false })
    res.set('Cache-Control', TIEMPO_CACHE_CONTROL).set('X-Tiempo-Cache', cache ? 'HIT' : 'MISS').json({ ok: true, dias: value })
  })
}
