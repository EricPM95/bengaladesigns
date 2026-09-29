import { useEffect, useState } from 'react'
import type { MealSlot, Route } from './types'
import { buildArrivalDepartureDetail } from './mockDayDetail'
import * as rules from '../../shared/arrival/arrivalRules.js'

/**
 * La llegada y la vuelta (PROMPT_UI, Parte 3): los datos de cada destino (data/dias/<destino>/_llegada.json, servidos por
 * /api/arrival-info), qué medio usa cada tramo, las horas clave y los textos de la barra. Vale para todos los destinos y
 * para avión, tren, autobús, ferry, crucero o coche; sin datos del destino, los de siempre (mockDayDetail).
 */

export type ArrivalMode = 'avion' | 'tren' | 'bus' | 'ferry' | 'crucero' | 'coche'

export interface ArrivalOption {
  nombre: string
  mas_comodo?: boolean
  tiempo?: string
  frecuencia?: string
  precio?: string
  nota?: string
  fuente?: string | null
  comprobado?: string
}

export interface ArrivalPoint {
  id: string
  nombre: string
  codigo?: string
  /** Lo que sale en la barra ("FIUMICINO"). */
  barra: string
  /** Con qué se busca su foto (las llegadas del aeropuerto o la estación). */
  foto?: string
  /** La foto fija del punto (comprobada a mano: es ese sitio) y su autor; sin ella se busca con `foto`. */
  foto_url?: string
  foto_credito?: string
  /** Del punto de llegada al centro, en minutos: la hora "EN EL CENTRO". */
  al_centro_min: number
  distancia?: string
  al_centro: ArrivalOption[]
  a_la_salida?: ArrivalOption[]
  privado?: { proveedor: string; precio: number; moneda: string; url_afiliado: string }
}

export interface ArrivalTip {
  titulo: string
  texto: string
  fuente?: string | null
}

export interface ArrivalMedio {
  textos: { llegada_titulo: string; llegada_sub: string; llegada_por_que: string; vuelta_titulo: string; vuelta_sub: string; vuelta_por_que: string }
  /** Cuánto antes de la salida hay que dejar la ciudad (avión 180, tren y bus 45, ferry 120 + el trayecto). */
  salir_antes_min?: number
  /** Ferry y crucero: de Roma al puerto. */
  trayecto_min?: number
  /** Crucero: margen antes de la hora de a bordo. */
  margen_min?: number
  puntos: ArrivalPoint[]
  tips_llegada: ArrivalTip[]
  tips_vuelta: ArrivalTip[]
}

export interface ArrivalInfoBlock {
  titulo?: string
  texto: string
  fuente?: string
  comprobado?: string
}

export interface ArrivalInfo {
  ciudad: string
  despedida: string
  medios: Partial<Record<ArrivalMode, ArrivalMedio>>
  estacion_alojamiento?: ArrivalInfoBlock
  consigna?: ArrivalInfoBlock
  ultima_tarde?: ArrivalInfoBlock
  maleta?: ArrivalInfoBlock
  ultima_hora?: { nombre: string; texto: string }[]
}

/** El medio del formulario ('flight', 'train'…) en el de la llegada; un ferry de un solo día es un crucero. */
export const arrivalModeOf: (optionId: string | null | undefined, contentDays: number) => ArrivalMode = rules.arrivalModeOf

/** El medio de cada tramo: la vuelta puede ser distinta de la ida (llegar en avión y volver en tren). */
export function tripModes(route: Route): { arrival: ArrivalMode; departure: ArrivalMode } {
  const contentDays = route.days.filter((day) => !day.isReturnLeg).length
  const arrival = arrivalModeOf(route.transportContext.transport_option?.id, contentDays)
  const departure = route.returnTransportOptionId ? arrivalModeOf(route.returnTransportOptionId, contentDays) : arrival
  return { arrival, departure }
}

const toMinutes: (hhmm: string | null | undefined) => number | null = rules.hhmmToMinutes
const toHHMM: (minutes: number) => string = rules.minutesToHHMM
export const minutesToHHMM = toHHMM

/** La hora en el centro: la llegada más el traslado del punto, de 5 en 5 (shared/arrival/arrivalRules.js). */
export const centerMinutesOf: (arrivalTime: string | null | undefined, point: ArrivalPoint | null) => number | null = rules.centerMinutesOf

/** La hora de salir, de 5 en 5 hacia abajo, según el medio (shared/arrival/arrivalRules.js). */
export const leaveMinutesOf: (departureTime: string | null | undefined, mode: ArrivalMode, medio: ArrivalMedio | null) => number | null = rules.leaveMinutesOf

export interface ArrivalBarText {
  /** "LLEGADA · VUELO 11:30 · FIUMICINO" */
  data: string
  /** A la derecha: "EN EL CENTRO 12:30", "SAL A LAS 16:30", "OJO CON LA ZTL"… */
  key: string | null
  /** Sin reserva: "+ AÑADIR VUELO" (lleva a Reservas). */
  add: string | null
}

/** Los textos de la barra, con reserva o sin ella, según el medio. */
export const barTextOf: (input: { kind: 'llegada' | 'vuelta'; mode: ArrivalMode; point: ArrivalPoint | null; origin: string; time: string | null; keyMinutes: number | null }) => ArrivalBarText =
  rules.barTextOf

// ── Los datos del destino ────────────────────────────────────────────────────────────────────────────────────────

const infoCache = new Map<string, ArrivalInfo | null>()
const inFlight = new Map<string, Promise<ArrivalInfo | null>>()

async function fetchArrivalInfo(destination: string): Promise<ArrivalInfo | null> {
  const key = destination.trim().toLowerCase()
  if (infoCache.has(key)) return infoCache.get(key) ?? null
  const pending = inFlight.get(key)
  if (pending) return pending
  const job = fetch('/api/arrival-info', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ destination }) })
    .then((response) => (response.ok ? response.json() : { info: null }))
    .then((body: { info: ArrivalInfo | null }) => body.info ?? null)
    .catch(() => null)
    .then((info) => {
      infoCache.set(key, info)
      inFlight.delete(key)
      return info
    })
  inFlight.set(key, job)
  return job
}

/**
 * Sin datos del destino: los de siempre (el aeropuerto de mockDayDetail) como un medio "avión" con sus puntos, para que la
 * barra y la ventana salgan igual en cualquier destino.
 */
export function fallbackArrivalInfo(city: string, origin: string): ArrivalInfo {
  const arrival = buildArrivalDepartureDetail(city, origin, 'arrival')
  const departure = buildArrivalDepartureDetail(city, origin, 'departure')
  const puntos: ArrivalPoint[] = arrival.airports.map((airport) => ({
    id: airport.code || airport.name,
    nombre: airport.name,
    codigo: airport.code || undefined,
    barra: (airport.code ? airport.name : airport.name).toUpperCase(),
    foto: `${airport.name} airport`,
    al_centro_min: 60,
    distancia: airport.distanceToCenterLabel,
    al_centro: [
      ...airport.transitOptions.map((option, index) => ({ nombre: option.name, mas_comodo: index === 0, tiempo: option.durationLabel })),
      { nombre: 'Taxi', tiempo: airport.taxiPriceLabel },
    ],
    ...(airport.privateTransfer ? { privado: airport.privateTransfer } : {}),
  }))
  const medio: ArrivalMedio = {
    textos: {
      llegada_titulo: arrival.headline,
      llegada_sub: arrival.subtitle,
      llegada_por_que: arrival.whyRecommendation,
      vuelta_titulo: departure.headline,
      vuelta_sub: departure.subtitle,
      vuelta_por_que: departure.whyRecommendation,
    },
    salir_antes_min: 180,
    puntos,
    tips_llegada: [],
    tips_vuelta: [],
  }
  return { ciudad: city, despedida: '', medios: { avion: medio } }
}

/** Los datos de llegada y vuelta del destino (o los de siempre mientras llegan o si no los tiene). */
export function useArrivalInfo(destination: string, city: string, origin: string): ArrivalInfo {
  const [info, setInfo] = useState<ArrivalInfo | null>(() => infoCache.get(destination.trim().toLowerCase()) ?? null)
  useEffect(() => {
    let alive = true
    fetchArrivalInfo(destination).then((result) => alive && setInfo(result))
    return () => {
      alive = false
    }
  }, [destination])
  return info ?? fallbackArrivalInfo(city, origin)
}

/** El medio de ese tramo en los datos: el suyo o, si el destino no lo tiene, el primero que haya. */
export function medioOf(info: ArrivalInfo, mode: ArrivalMode): ArrivalMedio | null {
  return info.medios[mode] ?? (mode === 'crucero' ? info.medios.ferry : undefined) ?? Object.values(info.medios)[0] ?? null
}

const BOOKING_WORD: Record<ArrivalMode, { arrival: string; departure: string }> = {
  avion: { arrival: 'Vuelo de llegada', departure: 'Vuelo de salida' },
  tren: { arrival: 'Tren de llegada', departure: 'Tren de salida' },
  bus: { arrival: 'Autobús de llegada', departure: 'Autobús de salida' },
  ferry: { arrival: 'Ferry de llegada', departure: 'Ferry de salida' },
  crucero: { arrival: 'Llegada del crucero', departure: 'Hora de a bordo' },
  coche: { arrival: 'Llegada en coche', departure: 'Salida en coche' },
}

/** Los textos de Reservas para las dos horas, según el medio de cada tramo ("Vuelos" si los dos son en avión). */
export function bookingLabelsOf(modes: { arrival: ArrivalMode; departure: ArrivalMode }): { heading: string; arrival: string; departure: string } {
  return {
    heading: modes.arrival === 'avion' && modes.departure === 'avion' ? 'Vuelos' : 'Llegada y vuelta',
    arrival: BOOKING_WORD[modes.arrival].arrival,
    departure: BOOKING_WORD[modes.departure].departure,
  }
}

/**
 * Después de «Ajustar este día a tu llegada / vuelta»: las comidas siguen a las paradas. Una comida que empieza mientras
 * una parada sigue abierta se corre detrás de ella (de 5 en 5, con su misma duración); una que acaba antes de llegar al
 * centro o empieza después de la hora de salir se quita (la varita lo devuelve). Nunca inventa una comida.
 */
export function fitMealsToStops(
  meals: MealSlot[],
  stops: { time?: string | null; durationMinutes: number }[],
  bounds: { from?: number | null; until?: number | null },
): MealSlot[] {
  const spans = stops
    .map((stop) => {
      const start = toMinutes(stop.time)
      return start == null ? null : { start, end: start + stop.durationMinutes }
    })
    .filter((span): span is { start: number; end: number } => span != null)
  return meals.flatMap((meal) => {
    const start = toMinutes(meal.time)
    if (start == null || meal.mealTime === 'breakfast') return [meal]
    const windowEnd = toMinutes(meal.windowEnd)
    const length = windowEnd != null && windowEnd > start ? windowEnd - start : meal.mealTime === 'dinner' ? 90 : 75
    let newStart = start
    for (const span of spans) if (span.start < newStart && span.end > newStart) newStart = Math.ceil(span.end / 5) * 5
    if (bounds.from != null && newStart + length <= bounds.from) return []
    if (bounds.from != null && newStart < bounds.from) newStart = Math.ceil(bounds.from / 5) * 5
    if (bounds.until != null && newStart >= bounds.until) return []
    if (newStart === start) return [meal]
    return [{ ...meal, time: toHHMM(newStart), ...(meal.windowEnd ? { windowEnd: toHHMM(newStart + length) } : {}) }]
  })
}
