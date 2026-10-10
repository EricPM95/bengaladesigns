import type { Coordinates, DayPlan, Route } from './types'
import type { SavedTrip } from './tripPersistence'
import type { FotoViaje } from './fotosViaje'
import { buildDestinationSegments, segmentCentroid } from './destinationSegments'
import { formatHeaderDateRangeShortEs, todayIso } from './dateRange'
import { getTodayTripStatus } from './todayMode'
import { mesDelViaje } from './resumenViaje'
import { numberedStopsOf } from './stopKind'

/**
 * Los viajes del Perfil (Tanda 6z6): de los viajes guardados en este dispositivo salen la lista («Roma · 13 – 16 oct 2026 · 4 días»), las chinchetas del globo (una por destino)
 * y la ficha de cada uno. Todo se decide aquí; las pantallas solo lo pintan.
 *
 * El id de un viaje es SIEMPRE el de su ruta (`route.id`): es con el que se guardan las fotos y con el que `usePerfilUi.abrirAlbum` abre el álbum.
 */

export interface DestinoDeViaje {
  ciudad: string
  coordenadas: Coordinates
}

export interface ResumenViaje {
  /** `route.id`. */
  id: string
  route: Route
  /** El viaje tal como está guardado (para abrirlo); ausente si es solo el que está abierto y aún no se ha guardado. */
  guardado: SavedTrip | null
  destino: string
  /** Un destino por tramo de la ruta (Roma y Florencia = dos); solo los que tienen coordenadas reales. */
  destinos: DestinoDeViaje[]
  inicioIso: string | null
  dias: number
  paradas: number
  /** «13 – 16 oct 2026», o el mes («octubre») si no hay fechas; '' si no hay ni eso. */
  cuando: string
  /** «Roma · 13 – 16 oct 2026 · 4 días». */
  rotulo: string
  /** «4 días · 23 paradas». */
  resumen: string
  fase: 'proximo' | 'hecho'
}

const esReal = (c: Coordinates | undefined) => Boolean(c) && (c!.lat !== 0 || c!.lng !== 0)

export const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`

/** Un destino por tramo de la ruta, en el centro de sus paradas (las que aún no tienen sitio real —0,0— no cuentan). */
export function destinosDeRuta(route: Route): DestinoDeViaje[] {
  const dias: DayPlan[] = route.days.map((day) => ({ ...day, stops: day.stops.filter((stop) => esReal(stop.coordinates)) }))
  return buildDestinationSegments(route.days).flatMap((segmento) => {
    const centro = segmentCentroid(segmento, dias)
    return centro ? [{ ciudad: segmento.city, coordenadas: centro }] : []
  })
}

export function resumenDeViaje(route: Route, guardado: SavedTrip | null, hoyIso: string = todayIso()): ResumenViaje {
  const dias = route.days.filter((day) => !day.isReturnLeg)
  const paradas = dias.reduce((suma, day) => suma + numberedStopsOf(day).length, 0)
  const rango = route.answers.dateRange
  const inicioIso = rango?.start && rango?.end ? rango.start : null
  const cuando = rango?.start && rango?.end ? `${formatHeaderDateRangeShortEs(rango.start, rango.end)} ${rango.end.slice(0, 4)}` : (mesDelViaje(route) ?? '')
  const estado = getTodayTripStatus(route, hoyIso)
  const nDias = dias.length || (route.answers.days ?? 0)
  return {
    id: route.id,
    route,
    guardado,
    destino: route.destination,
    destinos: destinosDeRuta(route),
    inicioIso,
    dias: nDias,
    paradas,
    cuando,
    rotulo: [route.destination, cuando, plural(nDias, 'día', 'días')].filter(Boolean).join(' · '),
    resumen: `${plural(nDias, 'día', 'días')} · ${plural(paradas, 'parada', 'paradas')}`,
    fase: estado?.phase === 'after' ? 'hecho' : 'proximo',
  }
}

/** Cuándo cuenta un viaje para ordenar: su primer día; sin fechas, el día 1 de su mes (este año, o el que viene si ya pasó); sin nada, al final. */
function claveDeOrden(viaje: ResumenViaje, hoyIso: string): string {
  if (viaje.inicioIso) return viaje.inicioIso
  const mes = viaje.route.answers.month
  if (typeof mes === 'number' && mes >= 0 && mes <= 11) {
    const anio = Number(hoyIso.slice(0, 4))
    const delAnio = `${anio}-${String(mes + 1).padStart(2, '0')}-01`
    return delAnio >= `${hoyIso.slice(0, 7)}-01` ? delAnio : `${anio + 1}-${String(mes + 1).padStart(2, '0')}-01`
  }
  return '9999-12-31'
}

/** Los que vienen primero (el más cercano arriba), luego los hechos (el más reciente arriba). */
export function ordenarViajes(viajes: ResumenViaje[], hoyIso: string = todayIso()): ResumenViaje[] {
  const proximos = viajes.filter((v) => v.fase === 'proximo').sort((a, b) => claveDeOrden(a, hoyIso).localeCompare(claveDeOrden(b, hoyIso)))
  const hechos = viajes.filter((v) => v.fase === 'hecho').sort((a, b) => claveDeOrden(b, hoyIso).localeCompare(claveDeOrden(a, hoyIso)))
  return [...proximos, ...hechos]
}

/** Todos los viajes de este dispositivo ya ordenados; el que está abierto entra aunque aún no esté guardado. */
export function viajesDelPerfil(guardados: SavedTrip[], rutaAbierta: Route | null, hoyIso: string = todayIso()): ResumenViaje[] {
  const lista = guardados.map((viaje) => resumenDeViaje(viaje.route, viaje, hoyIso))
  if (rutaAbierta && !lista.some((v) => v.id === rutaAbierta.id)) lista.push(resumenDeViaje(rutaAbierta, null, hoyIso))
  return ordenarViajes(lista, hoyIso)
}

/** Busca un viaje por su id de ruta (o, por si acaso, por el de su fila guardada). */
export function viajePorId(viajes: ResumenViaje[], id: string | null): ResumenViaje | null {
  if (!id) return null
  return viajes.find((v) => v.id === id) ?? viajes.find((v) => v.guardado?.id === id) ?? null
}

/* ------------------------------------------------------------------ */
/* El globo: una chincheta por destino de cada viaje                   */
/* ------------------------------------------------------------------ */

/** El mapa de mis viajes es una bola del mundo (globo de Mapbox), distinta al mapa plano del resto de la app. */
export const PROYECCION_MAPA_VIAJES = 'globe'

/** La caja del mapa de mis viajes en un móvil de 375: unos 335 de ancho por 220 de alto (Tanda 6z6b). */
export const CAJA_MAPA_VIAJES = { ancho: 335, alto: 220 } as const
/** El aire que se deja entre el borde de la bola y el borde de la caja, en píxeles (por cada lado). */
const AIRE_GLOBO_PX = 20

/**
 * El zoom en que la bola ENTERA cabe en la caja, con su borde curvo a la vista. En Mapbox la vuelta al mundo por el ecuador mide 512·2^zoom píxeles, así que el diámetro de la esfera es
 * 512·2^zoom / π. Se pide que ese diámetro quepa en el lado corto de la caja menos el aire de los dos lados. (Un solo sitio: lo usa el mapa y lo comprueba la prueba.)
 */
export function zoomGloboEntero(ancho: number = CAJA_MAPA_VIAJES.ancho, alto: number = CAJA_MAPA_VIAJES.alto): number {
  const libre = Math.max(40, Math.min(ancho, alto) - AIRE_GLOBO_PX * 2)
  return Math.log2((libre * Math.PI) / 512)
}

/** El diámetro en píxeles de la bola a ese zoom (lo inverso de `zoomGloboEntero`). */
export function diametroGlobo(zoom: number): number {
  return (512 * 2 ** zoom) / Math.PI
}

/**
 * Dónde se centra la bola: la media de las chinchetas (hecha sobre la esfera, para que dos viajes a un lado y otro de la línea de fecha no den el medio del océano contrario);
 * sin chinchetas, un punto cualquiera con tierra a la vista (Europa y África).
 */
export function centroDelGlobo(chinchetas: Chincheta[]): { lat: number; lng: number } {
  if (chinchetas.length === 0) return { lat: 25, lng: 15 }
  const rad = Math.PI / 180
  let x = 0
  let y = 0
  let z = 0
  for (const c of chinchetas) {
    const lat = c.coordenadas.lat * rad
    const lng = c.coordenadas.lng * rad
    x += Math.cos(lat) * Math.cos(lng)
    y += Math.cos(lat) * Math.sin(lng)
    z += Math.sin(lat)
  }
  const largo = Math.hypot(x, y, z)
  if (largo < 1e-6) return { lat: chinchetas[0].coordenadas.lat, lng: chinchetas[0].coordenadas.lng }
  return { lat: Math.atan2(z, Math.hypot(x, y)) / rad, lng: Math.atan2(y, x) / rad }
}

/** Los textos que Mapbox enseña al querer mover el mapa con un dedo (en español): con un dedo se baja la página; con dos, se mueve el mapa. */
export const TEXTOS_MAPA_VIAJES = {
  'ScrollZoomBlocker.CtrlMessage': 'Usa Ctrl + rueda para acercar el mapa',
  'ScrollZoomBlocker.CmdMessage': 'Usa Cmd + rueda para acercar el mapa',
  'TouchPanBlocker.Message': 'Usa dos dedos para mover el mapa',
} as const

export interface Chincheta {
  /** `${viaje}:${n}` — única por destino. */
  id: string
  viajeId: string
  ciudad: string
  coordenadas: Coordinates
  fase: ResumenViaje['fase']
}

/** Un viaje a Roma y Florencia da dos chinchetas; las dos abren la ficha del mismo viaje. */
export function chinchetasDeViajes(viajes: ResumenViaje[]): Chincheta[] {
  return viajes.flatMap((viaje) => viaje.destinos.map((destino, n) => ({ id: `${viaje.id}:${n}`, viajeId: viaje.id, ciudad: destino.ciudad, coordenadas: destino.coordenadas, fase: viaje.fase })))
}

/* ------------------------------------------------------------------ */
/* El álbum: las fotos por días y, dentro de cada día, por parada      */
/* ------------------------------------------------------------------ */

/** Los nombres de las paradas del día, en el orden de la ruta, sin repetir. */
export function paradasDelDia(day: DayPlan): string[] {
  return [...new Set(numberedStopsOf(day).map((stop) => stop.name))]
}

export interface GrupoDeFotos {
  /** null: fotos del día sin parada. */
  parada: string | null
  fotos: FotoViaje[]
}
export interface DiaDeFotos {
  dayNumber: number
  grupos: GrupoDeFotos[]
}

/** Por días (de menor a mayor); en cada día, por parada en el orden de la ruta, luego las de un nombre que ya no está, y al final las del día sin parada. */
export function agruparFotos(fotos: FotoViaje[], route: Route): DiaDeFotos[] {
  const numeros = [...new Set(fotos.map((f) => f.dayNumber))].sort((a, b) => a - b)
  return numeros.map((dayNumber) => {
    const delDia = fotos.filter((f) => f.dayNumber === dayNumber).sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    const dia = route.days.find((d) => d.dayNumber === dayNumber)
    const enRuta = dia ? paradasDelDia(dia) : []
    const otras = [...new Set(delDia.map((f) => f.stopName).filter((n): n is string => !!n && !enRuta.includes(n)))]
    const grupos: GrupoDeFotos[] = [...enRuta, ...otras]
      .map((parada) => ({ parada: parada as string | null, fotos: delDia.filter((f) => f.stopName === parada) }))
      .concat([{ parada: null, fotos: delDia.filter((f) => !f.stopName) }])
      .filter((g) => g.fotos.length > 0)
    return { dayNumber, grupos }
  })
}
