import { useRouteStore } from '../store/useRouteStore'
import type { Momento } from './logros'

/**
 * LA DEMO DE «RECLAMAR CON TUS FOTOS» (Tanda V5, solo desarrollo). Responde a `POST /api/logros/foto` con `libre` + `origen: 'galeria'` y a `GET /api/logros/sitios` con una versión pequeña de las reglas del
 * servidor (las de verdad están en `server/logros/servicio.js › fotoLibreDeGaleria`, que prueba `pruebaV5` con datos reales): cámara del móvil, fechas del viaje y ubicación dentro del radio de un sitio.
 * `window.__reclamarSitios` cambia los sitios de la demo.
 */
interface SitioDemo {
  sitio: string
  nombre: string
  lat: number
  lng: number
  radio: number
}
const SITIOS: SitioDemo[] = [
  { sitio: 'coliseo', nombre: 'Coliseo', lat: 41.8902, lng: 12.4922, radio: 200 },
  { sitio: 'foro_romano_y_palatino', nombre: 'Foro Romano y Palatino', lat: 41.8925, lng: 12.4853, radio: 250 },
  { sitio: 'fontana_de_trevi', nombre: 'Fontana de Trevi', lat: 41.9009, lng: 12.4833, radio: 150 },
  { sitio: 'panteon', nombre: 'Panteón', lat: 41.8986, lng: 12.4769, radio: 150 },
  { sitio: 'piazza_navona', nombre: 'Piazza Navona', lat: 41.8992, lng: 12.4731, radio: 200 },
  { sitio: 'plaza_de_espana', nombre: 'Plaza de España', lat: 41.9059, lng: 12.4823, radio: 150 },
]
const sitios = (): SitioDemo[] => (window as unknown as { __reclamarSitios?: SitioDemo[] }).__reclamarSitios ?? SITIOS

const metros = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
  const R = 6371000
  const rad = (x: number) => (x * Math.PI) / 180
  const dLat = rad(b.lat - a.lat)
  const dLng = rad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

const ganados = new Set<string>()
const pedazo = (s: SitioDemo): Momento => ({ tipo: 'suma', nombre: 'Los imprescindibles de Roma', linea: `${ganados.size} de 8`, primera_vez: true, clave: `pedazo|${s.sitio}`, sitios: [s.sitio] })

export function responder(ruta: string, url: URL, c: Record<string, unknown>): unknown {
  if (ruta === '/api/logros/sitios') {
    const dias = (useRouteStore.getState().route?.days ?? []).map((d) => d.dayNumber)
    const inicio = useRouteStore.getState().route?.answers?.dateRange?.start ?? '2026-10-12'
    const fechaDe = (n: number) => new Date(Date.parse(`${inicio}T12:00:00Z`) + (n - 1) * 86400000).toISOString().slice(0, 10)
    return { ok: true, destino: 'roma', inicio, fin: '', sitios: sitios().map((s, i) => ({ sitio: s.sitio, nombre: s.nombre, dias: dias.length ? [fechaDe(dias[i % dias.length])] : [], pendiente: !ganados.has(s.sitio) })) }
  }
  if (ruta !== '/api/logros/foto' || c.origen !== 'galeria') return undefined
  void url
  const rango = useRouteStore.getState().route?.answers?.dateRange
  const tomada = typeof c.tomada_en === 'string' ? c.tomada_en : null
  // Un sitio elegido a mano (foto sin ubicación): el pedazo de ese sitio.
  if (c.sitio && !c.libre) {
    const s = sitios().find((x) => x.sitio === c.sitio)
    if (!s) return { ok: true, valida: true, cuenta: false, motivo: 'sin_logro_aqui', nuevos: [] }
    const nuevo = !ganados.has(s.sitio)
    ganados.add(s.sitio)
    return { ok: true, valida: true, cuenta: true, sitios: [{ sitio: s.sitio, nombre: s.nombre }], nuevos: nuevo ? [pedazo(s)] : [] }
  }
  if (!c.libre) return undefined
  if (!c.con_camara) return { ok: true, valida: false, motivo: 'no_camara', mensaje: 'Esta foto no parece de la cámara de tu móvil (las capturas y las fotos recibidas no valen).', nuevos: [] }
  if (!tomada) return { ok: true, valida: false, motivo: 'sin_fecha', mensaje: 'Esta foto no trae la fecha en que se hizo.', nuevos: [] }
  const fecha = tomada.slice(0, 10)
  if (rango?.start && rango?.end && (fecha < rango.start || fecha > rango.end)) return { ok: true, valida: false, motivo: 'otra_fecha', mensaje: `Esta foto es del ${Number(fecha.slice(8, 10))}/${Number(fecha.slice(5, 7))}: no es de los días de tu viaje.`, nuevos: [] }
  const u = c.ubicacion as { lat: number; lng: number } | null
  if (!u) return { ok: true, valida: true, cuenta: false, motivo: 'sin_ubicacion', nuevos: [] }
  const dentro = sitios().filter((s) => metros(u, s) <= s.radio)
  if (dentro.length === 0) return { ok: true, valida: true, cuenta: false, motivo: 'sin_logro_aqui', nuevos: [] }
  const nuevos: Momento[] = []
  for (const s of dentro) if (!ganados.has(s.sitio)) (ganados.add(s.sitio), nuevos.push(pedazo(s)))
  return { ok: true, valida: true, cuenta: true, sitios: dentro.map((s) => ({ sitio: s.sitio, nombre: s.nombre })), nuevos }
}
