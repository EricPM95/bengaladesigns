import type { QuestionnaireAnswers, Route, TransportContext } from './types'
import { mapGeneratedRouteToRoute, type GeneratedRouteResponse, type GeneratedDay } from './mapGeneratedRoute'

/**
 * Verificado en vivo (2026-09-02): un bloque de 4 días tardó 210s, uno de 2 días 146s, y uno de UN
 * SOLO día 71s — el coste NO escala limpiamente con el número de días, hay un coste fijo grande
 * (~60-70s) en cualquier llamada que pida el contenido detallado de paradas/comidas (tips,
 * entry_options, restaurantes reales...), muy por encima de lo que las llamadas ligeras (anclas 20s,
 * esqueleto 13s) tardan. Por eso el tamaño de bloque se bajó de los 3-4 días pedidos originalmente a
 * 1 — es el único tamaño que se acerca a estar cómodamente por debajo de un límite de función
 * serverless típico; 2+ días ya se va a 150s+. Revisar si algún día el modelo/backend cambia de
 * forma que un bloque mayor vuelva a ser viable.
 */
const BLOCK_SIZE = 1

export interface Anchor {
  name: string
  city: string
  category: string
  reason: string
}

export interface SkeletonDay {
  day_number: number
  type: string
  city: string
  country_code: string | null
  phase_type?: string
}

export interface SkeletonResponse {
  summary: string
  estimated_budget?: GeneratedRouteResponse['estimated_budget']
  days: SkeletonDay[]
  city_transitions?: GeneratedRouteResponse['city_transitions']
  phase_transitions?: GeneratedRouteResponse['phase_transitions']
}

interface ContinuitySummary {
  lastCity: string
  lastStopNames: string[]
  usedCategoryCounts: Record<string, number>
  usedPlaceNames: string[]
}

export type GenerationPhase = 'anchors' | 'skeleton' | 'blocks' | 'done'

export interface GenerationParams {
  destination: string
  answers: QuestionnaireAnswers
  transportContext: TransportContext
  mustIncludePlaces: string[]
}

/**
 * Todo lo necesario para retomar una generación a medias exactamente donde se dejó — se persiste en
 * Supabase tras cada fase/bloque (ver tripPersistence.ts `generation_state`) y se recupera al volver
 * a abrir la app (TripSync.tsx), sin tener que rehacer llamadas ya completadas ni pedirle nada al
 * usuario.
 */
export interface GenerationResumeState {
  phase: GenerationPhase
  params: GenerationParams
  anchors: Anchor[]
  skeleton: SkeletonResponse | null
  generated: GeneratedRouteResponse
  completedBlocks: number
  totalBlocks: number
}

export type OnCheckpoint = (state: GenerationResumeState) => void | Promise<void>

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as { error?: string } | null
    throw new Error(errorBody?.error || 'No se pudo generar la ruta con IA.')
  }
  return response.json() as Promise<T>
}

/** Objeto GeneratedRouteResponse "vacío" con los días del esqueleto ya en su sitio (sin paradas todavía) — cada bloque completado va sustituyendo sus días por la versión rellena, ver mergeBlockDaysIntoGenerated. */
function initialGeneratedFromSkeleton(skeleton: SkeletonResponse): GeneratedRouteResponse {
  return {
    destination: '',
    origin: '',
    summary: skeleton.summary,
    estimated_budget: skeleton.estimated_budget,
    days: skeleton.days.map(
      (day): GeneratedDay => ({
        day_number: day.day_number,
        title: '',
        type: day.type,
        city: day.city,
        country_code: day.country_code ?? undefined,
        phase_type: day.phase_type,
        stops: [],
        meals: [],
      }),
    ),
    not_included: [],
    excursions_available: [],
    city_transitions: skeleton.city_transitions,
    phase_transitions: skeleton.phase_transitions,
  }
}

function chunkDays(days: SkeletonDay[], size: number): SkeletonDay[][] {
  const chunks: SkeletonDay[][] = []
  for (let i = 0; i < days.length; i += size) chunks.push(days.slice(i, i + size))
  return chunks
}

function anchorsForCities(anchors: Anchor[], cities: Set<string>): Anchor[] {
  return anchors.filter((anchor) => cities.has(anchor.city))
}

/** must_include_places no llevan ciudad propia — se infiere por si coinciden con el nombre de un ancla ya ubicada; si no hay forma de saberlo, se incluyen en todos los bloques (mejor repetir la instrucción que perder el lugar). */
function placesForCities(mustIncludePlaces: string[], allAnchors: Anchor[], cities: Set<string>): string[] {
  const anchorCityByName = new Map(allAnchors.map((anchor) => [anchor.name.toLowerCase(), anchor.city]))
  return mustIncludePlaces.filter((name) => {
    const city = anchorCityByName.get(name.toLowerCase())
    return !city || cities.has(city)
  })
}

/** Resumen de lo ya escrito hasta ahora — para que el siguiente bloque mantenga continuidad geográfica y variedad sin necesitar ver el viaje completo (ver formatContinuity en server/index.js). */
function buildContinuity(generated: GeneratedRouteResponse): ContinuitySummary | null {
  const writtenDays = generated.days.filter((day) => day.stops.length > 0)
  if (writtenDays.length === 0) return null

  const lastDay = writtenDays[writtenDays.length - 1]
  const usedCategoryCounts: Record<string, number> = {}
  const usedPlaceNames: string[] = []
  for (const day of writtenDays) {
    for (const stop of day.stops) {
      if (stop.category) usedCategoryCounts[stop.category] = (usedCategoryCounts[stop.category] ?? 0) + 1
      usedPlaceNames.push(stop.name)
    }
    for (const meal of day.meals) {
      for (const option of meal.options) usedPlaceNames.push(option.name)
    }
  }

  return {
    lastCity: lastDay.city ?? '',
    lastStopNames: lastDay.stops.slice(-3).map((stop) => stop.name),
    usedCategoryCounts,
    usedPlaceNames: usedPlaceNames.slice(-30),
  }
}

function mergeBlockDaysIntoGenerated(
  generated: GeneratedRouteResponse,
  blockDays: GeneratedDay[],
  notIncluded: GeneratedRouteResponse['not_included'],
  excursions: GeneratedRouteResponse['excursions_available'],
): GeneratedRouteResponse {
  const byDayNumber = new Map(blockDays.map((day) => [day.day_number, day]))
  return {
    ...generated,
    days: generated.days.map((day) => byDayNumber.get(day.day_number) ?? day),
    not_included: [...(generated.not_included ?? []), ...(notIncluded ?? [])],
    excursions_available: [...(generated.excursions_available ?? []), ...(excursions ?? [])],
  }
}

/** Paso (2-5) de LoadingScreen.tsx que corresponde al checkpoint actual — cada uno refleja una llamada que de verdad ha terminado (o está a punto de empezar), nunca un temporizador. */
export function computeLoadingStep(state: Pick<GenerationResumeState, 'phase' | 'completedBlocks' | 'totalBlocks'>): number {
  if (state.phase === 'anchors') return 2
  if (state.phase === 'skeleton') return 3
  if (state.phase === 'done') return 5
  const fraction = state.totalBlocks > 0 ? state.completedBlocks / state.totalBlocks : 0
  return fraction < 0.5 ? 4 : 5
}

/**
 * Genera (o retoma) una ruta encadenando llamadas pequeñas: anclas → esqueleto → bloques de
 * BLOCK_SIZE días. `onCheckpoint` se llama tras CADA fase/bloque completado — el llamador lo usa
 * para actualizar el paso visible en LoadingScreen.tsx y persistir el progreso en Supabase, así que
 * si se cierra la pestaña a mitad, la próxima apertura retoma justo donde se dejó (ver TripSync.tsx)
 * sin repetir llamadas ya hechas ni preguntarle nada al usuario. Solo construye el `Route` final
 * (mapGeneratedRouteToRoute) una vez completado el último bloque.
 */
export async function runGeneration(params: GenerationParams, resumeFrom: GenerationResumeState | null, onCheckpoint: OnCheckpoint): Promise<Route> {
  const { destination, answers, transportContext, mustIncludePlaces } = params

  let anchors: Anchor[] = resumeFrom?.anchors ?? []
  let skeleton: SkeletonResponse | null = resumeFrom?.skeleton ?? null
  let generated: GeneratedRouteResponse = resumeFrom?.generated ?? { destination: '', origin: '', days: [] }
  let completedBlocks = resumeFrom?.completedBlocks ?? 0
  let phase: GenerationPhase = resumeFrom?.phase ?? 'anchors'

  if (phase === 'anchors') {
    const result = await postJson<{ anchors: Anchor[] }>('/api/generate-anchors', {
      destination,
      answers,
      must_include_places: mustIncludePlaces,
      ...transportContext,
    })
    anchors = result.anchors
    phase = 'skeleton'
    await onCheckpoint({ phase, params, anchors, skeleton, generated, completedBlocks, totalBlocks: 0 })
  }

  if (phase === 'skeleton') {
    const result = await postJson<SkeletonResponse>('/api/generate-skeleton', {
      destination,
      answers,
      anchors,
      must_include_places: mustIncludePlaces,
      ...transportContext,
    })
    skeleton = result
    generated = initialGeneratedFromSkeleton(result)
    phase = 'blocks'
    const totalBlocks = chunkDays(result.days, BLOCK_SIZE).length
    await onCheckpoint({ phase, params, anchors, skeleton, generated, completedBlocks: 0, totalBlocks })
  }

  if (!skeleton) throw new Error('Falta el esqueleto del viaje — no se puede continuar.')

  const blocks = chunkDays(skeleton.days, BLOCK_SIZE)
  const totalBlocks = blocks.length

  for (let index = completedBlocks; index < blocks.length; index++) {
    const block = blocks[index]
    const cities = new Set(block.map((day) => day.city))
    const continuity = buildContinuity(generated)

    const result = await postJson<{
      days: GeneratedDay[]
      not_included: GeneratedRouteResponse['not_included']
      excursions_available: GeneratedRouteResponse['excursions_available']
    }>('/api/generate-day-block', {
      destination,
      answers,
      block_days: block,
      anchors_for_block: anchorsForCities(anchors, cities),
      must_include_for_block: placesForCities(mustIncludePlaces, anchors, cities),
      continuity,
      is_first_block_of_trip: index === 0,
      ...transportContext,
    })

    generated = mergeBlockDaysIntoGenerated(generated, result.days, result.not_included, result.excursions_available)
    completedBlocks = index + 1
    const done = completedBlocks >= totalBlocks
    await onCheckpoint({ phase: done ? 'done' : 'blocks', params, anchors, skeleton, generated, completedBlocks, totalBlocks })
  }

  return mapGeneratedRouteToRoute(generated, destination, answers, transportContext)
}
