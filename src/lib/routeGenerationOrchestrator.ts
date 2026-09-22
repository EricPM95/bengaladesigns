import type { QuestionnaireAnswers, Route, TransportContext, TripDefaultTransport } from './types'
import { mapGeneratedRouteToRoute, type GeneratedRouteResponse, type GeneratedDay } from './mapGeneratedRoute'
import { encodeExperienceCategories } from './experienceCategoryBank'

/** Misma clave que espera route_cache/computeRouteCacheMatch en server/index.js — ver encodeExperienceCategories. */
function routeCacheExperiences(answers: QuestionnaireAnswers): string[] {
  return encodeExperienceCategories(answers.experiencesPositive ?? ['imprescindibles'], answers.experiencesNegative ?? [])
}

/**
 * Verificado en vivo (2026-09-02): un bloque de 4 días tardó 210s, uno de 2 días 146s, y uno de UN
 * SOLO día 71s — el coste escala con el volumen de contenido pedido (tips, entry_options,
 * restaurantes reales...), muy por encima de lo que las llamadas ligeras (esqueleto 7s, lugares de
 * la Fase 1 unos segundos más) tardan. BLOCK_SIZE se queda en 1 día — sigue siendo el tamaño más
 * cómodo bajo el límite de función serverless (ver vercel.json maxDuration) — los bloques no se
 * generan en serie: se lanzan todos a la vez (ver el bucle de Promise más abajo) porque cada día ya
 * recibe, antes de escribirse, su lista EXACTA de lugares (ver generate-day-places, Fase 1) y un
 * resumen ligero de zone_focus/experience_focus del resto de días (ver generate-skeleton), así que no
 * necesita ver el contenido ya escrito de ningún otro bloque para no solaparse con ellos.
 */
const BLOCK_SIZE = 1

export interface SkeletonDay {
  day_number: number
  type: string
  city: string
  country_code: string | null
  phase_type?: string
  /** Sub-zona/tema del día (ver SKELETON_SYSTEM_PROMPT) — guía tanto a generate-day-places (Fase 1) como al resumen de "otros días" que recibe cada bloque. */
  zone_focus?: string
  experience_focus?: string[]
}

/** Un lugar concreto elegido en la Fase 1 (generate-day-places) — ver DAY_PLACES_SYSTEM_PROMPT en server/index.js. Sin horario/descripción/tips todavía, eso lo añade generate-day-block (Fase 2) a partir de esta lista exacta. */
export interface DayPlace {
  name: string
  type: 'interior_largo' | 'interior_corto' | 'exterior'
  duration_min: number
}

/** La lista de lugares de UN día, tal y como la devuelve /api/generate-day-places. */
export interface DayPlaces {
  day_number: number
  places: DayPlace[]
}

/** Sugerencia de segunda visita (double_visit del JSON curado) para un día concreto — ver RecommendedRevisit en types.ts, esta es la forma "en bruto" tal cual la devuelve /api/generate-day-places (con day_number, sin agrupar por día todavía). */
export interface RawRecommendedRevisit {
  name: string
  day_number: number
  reason: string
}

/** Vista ligera de un día para el "resumen de otros días" que recibe cada bloque — ver formatTripOverview en server/index.js. */
export interface LightDaySummary {
  day_number: number
  city: string
  zone_focus?: string
  experience_focus?: string[]
}

export interface SkeletonResponse {
  summary: string
  estimated_budget?: GeneratedRouteResponse['estimated_budget']
  days: SkeletonDay[]
  city_transitions?: GeneratedRouteResponse['city_transitions']
  phase_transitions?: GeneratedRouteResponse['phase_transitions']
  /** true solo cuando generate-skeleton resolvió con el algoritmo JS puro (pipeline v2, ver
   * routeAlgorithm.js en el servidor) en vez de Claude — esas rutas ya traen horarios reales
   * definitivos (franjas/night experiences/evening blocks/Mapbox), así que App.tsx se salta
   * applyRealStopSchedule para ellas en vez de recalcular la hora de cada parada desde cero. */
  times_are_final?: boolean
  /** Ver resolveDefaultTransport en server/index.js — viaja hasta Route.defaultTransport vía initialGeneratedFromSkeleton. */
  default_transport?: TripDefaultTransport
}

export type GenerationPhase = 'skeleton' | 'places' | 'blocks' | 'done'

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
  dayPlaces: DayPlaces[]
  recommendedRevisits: RawRecommendedRevisit[]
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

// ── SISTEMA DE CACHÉ INTELIGENTE DE RUTAS ───────────────────────────────────────────────────
//
// Antes del pipeline completo (esqueleto → lugares → bloques), se busca una ruta ya generada para
// el mismo destino con parámetros parecidos (ver computeRouteCacheMatch en server/index.js: destino
// obligatorio + experiencias 50% + ritmo 25% + días 25%, acompañantes NUNCA forman parte de la
// clave). ≥75% → solo se ajustan las paradas que cambian (regenerate-route-experiences); 50-74% →
// se redistribuye el pool completo de paradas conocidas contra el nuevo día/ritmo
// (regenerate-route-redistribute); <75%/<50%/sin Supabase/cualquier fallo → se cae al pipeline
// normal de siempre, SIN excepción y SIN bloquear al viajero — todo esto es puramente una
// optimización de coste, nunca debe poder impedir que la ruta se genere.

interface RouteCacheEntry {
  id: string
  days: number
  experiences: string[]
  pace: string
  route_data: GeneratedRouteResponse
}

interface RouteCacheLookupResponse {
  level: 'high' | 'medium' | 'none'
  match_pct: number
  entry: RouteCacheEntry | null
}

async function lookupRouteCache(destination: string, days: number, experiences: string[], pace: string): Promise<RouteCacheLookupResponse> {
  try {
    return await postJson<RouteCacheLookupResponse>('/api/route-cache/lookup', { destination, days, experiences, pace })
  } catch {
    return { level: 'none', match_pct: 0, entry: null }
  }
}

/** Fire-and-forget a propósito — ni bumpear hit_count ni guardar una entrada nueva debe poder retrasar o romper la generación de la ruta que el viajero ya está viendo. */
function touchRouteCache(id: string): void {
  postJson('/api/route-cache/touch', { id }).catch(() => {})
}

function saveRouteCache(destination: string, days: number, experiences: string[], pace: string, routeData: GeneratedRouteResponse): void {
  postJson('/api/route-cache/save', { destination, days, experiences, pace, route_data: routeData }).catch(() => {})
}

interface RegenerateExperiencesResponse {
  removed_stop_ids: string[]
  new_stops: (GeneratedDay['stops'][number] & { day_number: number })[]
}

/** ≥75%: mismo día a día de la ruta cacheada, solo se quitan las paradas que ya no encajan con las experiencias elegidas y se añaden las que faltan — nunca toca "meals", nunca reescribe un día entero. */
async function applyHighMatchReuse(
  destination: string,
  answers: QuestionnaireAnswers,
  transportContext: TransportContext,
  cached: RouteCacheEntry,
): Promise<GeneratedRouteResponse> {
  let days = cached.route_data.days.map((day) => ({ ...day, stops: [...day.stops] }))

  // Ajuste de días (el peso de "días" en el match permite hasta ±2 y seguir contando como
  // coincidencia parcial) — de más días sobra recortar por el final; de menos, se piden los días
  // que faltan con el MISMO endpoint de bloques de siempre (ver generate-day-block), no algo nuevo.
  if (answers.days < days.length) {
    days = days.slice(0, answers.days)
  } else if (answers.days > days.length) {
    const lastDay = days[days.length - 1]
    for (let dayNumber = days.length + 1; dayNumber <= answers.days; dayNumber += 1) {
      const blockDay = { day_number: dayNumber, type: 'city', city: lastDay?.city ?? destination, country_code: lastDay?.country_code }
      // Este día extra no pasó por generate-skeleton (viene de estirar una ruta cacheada) — hay que
      // elegir su lista de lugares (Fase 1) antes de poder pedirle a generate-day-block que la
      // enriquezca, igual que hace el pipeline normal para cada bloque.
      const placesResult = await postJson<{ days: DayPlaces[] }>('/api/generate-day-places', {
        destination,
        answers,
        must_include_places: [],
        skeleton_days: [blockDay],
        ...transportContext,
      })
      const result = await postJson<{ days: GeneratedDay[] }>('/api/generate-day-block', {
        destination,
        answers,
        block_days: [blockDay],
        places_for_block: placesResult.days,
        all_days: days.map((day) => ({ day_number: day.day_number, city: day.city })),
        is_first_block_of_trip: false,
        ...transportContext,
      })
      days = [...days, ...result.days]
    }
  }

  const diff = await postJson<RegenerateExperiencesResponse>('/api/regenerate-route-experiences', {
    destination,
    days,
    old_experiences: cached.experiences,
    new_experiences: routeCacheExperiences(answers),
  })

  const removedIds = new Set(diff.removed_stop_ids)
  const byDayNumber = new Map(days.map((day) => [day.day_number, day]))
  for (const day of days) {
    day.stops = day.stops.filter((stop) => !removedIds.has(stop.id))
  }
  for (const newStop of diff.new_stops) {
    const { day_number: dayNumber, ...stopFields } = newStop
    const day = byDayNumber.get(dayNumber)
    if (!day) continue
    day.stops = [...day.stops, stopFields].sort((a, b) => (a.suggested_time ?? '').localeCompare(b.suggested_time ?? ''))
  }

  return { ...cached.route_data, days }
}

interface RegenerateRedistributeResponse {
  days: GeneratedDay[]
  not_included: GeneratedRouteResponse['not_included']
  excursions_available: GeneratedRouteResponse['excursions_available']
}

/** 50-74%: el pool de paradas YA conocidas de la ruta cacheada (de cualquier acompañante/ritmo previo para este destino) se le da a Claude como base preferente para reconstruir la distribución día a día contra el nuevo total de días/ritmo/experiencias — un único call en vez de esqueleto+N bloques. */
async function applyMediumMatchRedistribute(
  destination: string,
  answers: QuestionnaireAnswers,
  transportContext: TransportContext,
  cached: RouteCacheEntry,
): Promise<GeneratedRouteResponse> {
  const seenNames = new Set<string>()
  const pool = cached.route_data.days
    .flatMap((day) => day.stops)
    .filter((stop) => {
      const key = stop.name.trim().toLowerCase()
      if (seenNames.has(key)) return false
      seenNames.add(key)
      return true
    })

  const result = await postJson<RegenerateRedistributeResponse>('/api/regenerate-route-redistribute', {
    destination,
    answers,
    known_stops: pool,
    ...transportContext,
  })

  return {
    ...cached.route_data,
    days: result.days,
    not_included: result.not_included,
    excursions_available: result.excursions_available,
  }
}

/**
 * Intenta reutilizar una ruta cacheada en vez del pipeline completo — devuelve null (nunca lanza)
 * si no hay caché disponible, el mejor candidato coincide por debajo del 50%, o cualquier paso falla
 * por el camino: en TODOS esos casos el llamador simplemente sigue con el pipeline normal de
 * siempre, como si esta función no existiera.
 */
async function tryRouteCacheReuse(params: GenerationParams, onCheckpoint: OnCheckpoint): Promise<Route | null> {
  const { destination, answers, transportContext } = params
  const lookup = await lookupRouteCache(destination, answers.days, routeCacheExperiences(answers), answers.pace)
  if (lookup.level === 'none' || !lookup.entry) return null
  // El pipeline de redistribución cubre TODOS los días en una sola llamada (ver el límite en
  // regenerate-route-redistribute) — para un viaje más largo no compensa el riesgo, se cae al
  // pipeline normal como si no hubiera habido coincidencia.
  if (lookup.level === 'medium' && answers.days > 7) return null

  const cached = lookup.entry

  // Checkpoint "instantáneo": no hubo llamadas de esqueleto/lugares reales, pero LoadingScreen.tsx
  // solo necesita ver las fases avanzar para pintar sus checks — un único "bloque" representa todo
  // el ajuste de la ruta cacheada, sea cual sea el nivel de coincidencia.
  const skeletonDays: SkeletonDay[] = cached.route_data.days.map((day) => ({
    day_number: day.day_number,
    type: day.type ?? 'city',
    city: day.city ?? destination,
    country_code: day.country_code ?? null,
  }))
  const skeleton: SkeletonResponse = {
    summary: cached.route_data.summary ?? '',
    days: skeletonDays,
    city_transitions: cached.route_data.city_transitions,
    phase_transitions: cached.route_data.phase_transitions,
  }
  await onCheckpoint({ phase: 'blocks', params, dayPlaces: [], recommendedRevisits: [], skeleton, generated: cached.route_data, completedBlocks: 0, totalBlocks: 1 })

  const generated =
    lookup.level === 'high'
      ? await applyHighMatchReuse(destination, answers, transportContext, cached)
      : await applyMediumMatchRedistribute(destination, answers, transportContext, cached)

  touchRouteCache(cached.id)
  await onCheckpoint({ phase: 'done', params, dayPlaces: [], recommendedRevisits: [], skeleton, generated, completedBlocks: 1, totalBlocks: 1 })

  // applyHighMatchReuse/applyMediumMatchRedistribute devuelven `{ ...cached.route_data, ... }`, así
  // que recommended_revisits (guardado dentro del blob por saveRouteCache) sobrevive el reparto
  // intacto salvo que uno de esos días haya cambiado de verdad — no hay forma barata de saber si la
  // recomendación seguía siendo válida tras el ajuste, así que se conserva tal cual (mismo criterio
  // que el resto de contenido reutilizado en un match alto/medio).
  const finalRoute = mapGeneratedRouteToRoute(generated, destination, answers, transportContext, [], generated.recommended_revisits ?? [])
  saveRouteCache(destination, answers.days, routeCacheExperiences(answers), answers.pace, generated)
  return finalRoute
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
    default_transport: skeleton.default_transport,
  }
}

function chunkDays(days: SkeletonDay[], size: number): SkeletonDay[][] {
  const chunks: SkeletonDay[][] = []
  for (let i = 0; i < days.length; i += size) chunks.push(days.slice(i, i + size))
  return chunks
}

/** Lista de lugares (Fase 1, generate-day-places) de los días concretos de este bloque — ver REQUIRED PLACES en DAY_BLOCK_SYSTEM_PROMPT. */
function placesForBlockDays(dayPlaces: DayPlaces[], block: SkeletonDay[]): DayPlaces[] {
  const blockDayNumbers = new Set(block.map((day) => day.day_number))
  return dayPlaces.filter((entry) => blockDayNumbers.has(entry.day_number))
}

function toLightDaySummary(day: SkeletonDay): LightDaySummary {
  return { day_number: day.day_number, city: day.city, zone_focus: day.zone_focus, experience_focus: day.experience_focus }
}

interface DayBlockResult {
  days: GeneratedDay[]
  not_included: GeneratedRouteResponse['not_included']
  excursions_available: GeneratedRouteResponse['excursions_available']
}

// Encontrado en vivo (Vercel, 2026-09-17): un bloque de un solo día se quedó colgado a mitad de
// respuesta de Claude (primer byte a 1.2s, luego silencio total) hasta que Vercel mató la función a
// los 200s en seco — un cuelgue puntual de la API, no un bug de max_tokens ni del JSON curado. Antes
// de este reintento, ESE bloque hacía fallar la generación entera; ahora se reintenta él solo (hasta
// 2 veces más) antes de darse por vencido, sin tocar los demás bloques.
const DAY_BLOCK_MAX_ATTEMPTS = 3

async function requestDayBlockWithRetry(
  destination: string,
  answers: QuestionnaireAnswers,
  block: SkeletonDay[],
  dayPlaces: DayPlaces[],
  allDaysLight: LightDaySummary[],
  transportContext: TransportContext,
  mustIncludePlaces: string[],
): Promise<DayBlockResult> {
  const dayNumbers = block.map((day) => day.day_number).join(',')
  let lastError: unknown
  for (let attempt = 1; attempt <= DAY_BLOCK_MAX_ATTEMPTS; attempt++) {
    try {
      return await postJson<DayBlockResult>('/api/generate-day-block', {
        destination,
        answers,
        block_days: block,
        places_for_block: placesForBlockDays(dayPlaces, block),
        all_days: allDaysLight,
        is_first_block_of_trip: block.some((day) => day.day_number === 1),
        // BUG 14 (ronda 5): el camino pipeline v2 (buildDayBlockV2) recalcula la colocación de
        // must_include_places de forma determinista por su cuenta (ver planMustIncludePlacement en
        // routeAlgorithm.js) — necesita la lista aquí, no solo en generate-day-places, porque este
        // endpoint relee zone_distribution desde cero y no confía en `places_for_block`.
        must_include_places: mustIncludePlaces,
        ...transportContext,
      })
    } catch (error) {
      lastError = error
      const willRetry = attempt < DAY_BLOCK_MAX_ATTEMPTS
      console.warn(
        `[day-block-retry] día(s) ${dayNumbers} — intento ${attempt}/${DAY_BLOCK_MAX_ATTEMPTS} falló${willRetry ? ', reintentando' : ', sin más intentos'}:`,
        error,
      )
    }
  }
  throw lastError
}

/** Un día ya generado (con contenido real) no se vuelve a pedir al reanudar una generación a medias — ver el filtro de pendingBlocks más abajo. */
function isDayAlreadyGenerated(generated: GeneratedRouteResponse, dayNumber: number): boolean {
  const day = generated.days.find((candidate) => candidate.day_number === dayNumber)
  return Boolean(day && day.stops.length > 0)
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
    // El bloque (DAY_BLOCK_SYSTEM_PROMPT) solo devuelve day_number/title/stops/meals/rainy_alternative
    // — city/country_code/type/phase_type los decidió el esqueleto y no vienen en esta respuesta.
    // Sustituir el día ENTERO por el del bloque (como antes) los perdía: country_code se quedaba
    // siempre undefined → sin bandera en RUTA (ni en single-city ni en multi-city). Se combinan los
    // dos, reafirmando explícitamente los campos del esqueleto para que ganen aunque el bloque
    // devolviera alguno de esos campos por su cuenta.
    days: generated.days.map((day) => {
      const blockDay = byDayNumber.get(day.day_number)
      if (!blockDay) return day
      // El TIPO es la excepción: si el bloque trae uno, manda el bloque. Lo devuelve el motor de
      // rutas curadas, que decide dónde cae la excursión a partir de `core_days`/`max_auto_days`
      // del destino; el esqueleto lo decidía con el `day_pattern` viejo y le ganaba, así que un día
      // de ciudad con excursión de media jornada llegaba a la ficha pintado como día de excursión
      // entero. Los días que genera Claude no traen tipo y siguen usando el del esqueleto.
      return { ...day, ...blockDay, city: day.city, country_code: day.country_code, type: blockDay.type ?? day.type, phase_type: day.phase_type }
    }),
    not_included: [...(generated.not_included ?? []), ...(notIncluded ?? [])],
    excursions_available: [...(generated.excursions_available ?? []), ...(excursions ?? [])],
  }
}

type BlockOutcome = { block: SkeletonDay[]; status: 'ok'; result: DayBlockResult } | { block: SkeletonDay[]; status: 'error'; error: unknown }

interface SettlePendingBlocksArgs {
  destination: string
  answers: QuestionnaireAnswers
  pendingBlocks: SkeletonDay[][]
  dayPlaces: DayPlaces[]
  allDaysLight: LightDaySummary[]
  transportContext: TransportContext
  generated: GeneratedRouteResponse
  completedBlocks: number
  totalBlocks: number
  params: GenerationParams
  recommendedRevisits: RawRecommendedRevisit[]
  skeleton: SkeletonResponse
  onCheckpoint: OnCheckpoint
}

/**
 * Dispara TODOS los bloques pendientes de golpe (cada uno con su propio reintento interno, ver
 * requestDayBlockWithRetry) y los procesa por orden de finalización REAL, no por el orden en que se
 * listaron — un bloque que necesita sus 2 reintentos (hasta ~10min en el peor caso) no debe bloquear
 * que uno más rápido, ya resuelto con éxito, se fusione y checkpointee. Así, si el Día 2 se cuelga
 * pero el Día 1 y el Día 3 ya terminaron, esos dos quedan guardados en el checkpoint aunque el Día 2
 * tarde mucho más o acabe fallando del todo — un "Reintentar" posterior solo repetirá el Día 2 (ver
 * isDayAlreadyGenerated), nunca los que ya se generaron bien.
 *
 * NOTA sobre `status: 'ok' | 'error'`: la primera versión usaba `ok: true | false` (booleano) como
 * discriminante — TypeScript 5.9 dejaba de estrechar el tipo con ese patrón exacto (`.then().catch()`
 * devolviendo un literal booleano, consumido después vía `Promise.race`), aunque el mismo código
 * aislado en un archivo aparte SÍ estrechaba bien; nunca se aisló la causa exacta. Cambiar el
 * discriminante a un literal de texto (`'ok'`/`'error'`) lo arregló sin tocar nada más — si se toca
 * este tipo en el futuro, mejor mantenerlo como string en vez de volver a boolean.
 */
async function settlePendingBlocks(args: SettlePendingBlocksArgs): Promise<{ generated: GeneratedRouteResponse; completedBlocks: number }> {
  const { destination, answers, pendingBlocks, dayPlaces, allDaysLight, transportContext, params, recommendedRevisits, skeleton, onCheckpoint, totalBlocks } = args
  let { generated, completedBlocks } = args

  interface SettleEntry {
    index: number
    promise: Promise<BlockOutcome>
  }
  let settleQueue: SettleEntry[] = pendingBlocks.map((block, index) => ({
    index,
    promise: requestDayBlockWithRetry(destination, answers, block, dayPlaces, allDaysLight, transportContext, params.mustIncludePlaces)
      .then((result): BlockOutcome => ({ block, status: 'ok', result }))
      .catch((error): BlockOutcome => ({ block, status: 'error', error })),
  }))

  let firstFailure: { block: SkeletonDay[]; error: unknown } | null = null
  while (settleQueue.length > 0) {
    const winnerIndex = await Promise.race(settleQueue.map((entry) => entry.promise.then(() => entry.index)))
    const winner = settleQueue.find((entry) => entry.index === winnerIndex)!
    settleQueue = settleQueue.filter((entry) => entry.index !== winnerIndex)
    const outcome: BlockOutcome = await winner.promise

    if (outcome.status === 'error') {
      const failedBlock = outcome.block
      const failedError = outcome.error
      if (!firstFailure) firstFailure = { block: failedBlock, error: failedError }
      continue
    }
    generated = mergeBlockDaysIntoGenerated(generated, outcome.result.days, outcome.result.not_included, outcome.result.excursions_available)
    completedBlocks += 1
    const done = completedBlocks >= totalBlocks
    await onCheckpoint({ phase: done ? 'done' : 'blocks', params, dayPlaces, recommendedRevisits, skeleton, generated, completedBlocks, totalBlocks })
  }

  // Se lanza DESPUÉS de procesar (y checkpointear) todos los bloques que sí tuvieron éxito — nunca
  // antes, o se perdería el progreso real de los demás bloques por culpa de uno solo.
  if (firstFailure) {
    const dayNumbers = firstFailure.block.map((day) => day.day_number).join(',')
    throw firstFailure.error instanceof Error ? firstFailure.error : new Error(`No se pudo generar el día ${dayNumbers} del viaje con IA.`)
  }

  return { generated, completedBlocks }
}

/**
 * Genera (o retoma) una ruta encadenando llamadas pequeñas: esqueleto (forma) → lugares (Fase 1,
 * UNA vez para todo el viaje) → bloques de BLOCK_SIZE días (Fase 2, enriquecimiento). `onCheckpoint`
 * se llama tras CADA fase/bloque completado — el llamador lo usa para actualizar el paso visible en
 * LoadingScreen.tsx y persistir el progreso en Supabase, así que si se cierra la pestaña a mitad, la
 * próxima apertura retoma justo donde se dejó (ver TripSync.tsx) sin repetir llamadas ya hechas ni
 * preguntarle nada al usuario. Solo construye el `Route` final (mapGeneratedRouteToRoute) una vez
 * completado el último bloque.
 */
export async function runGeneration(params: GenerationParams, resumeFrom: GenerationResumeState | null, onCheckpoint: OnCheckpoint): Promise<Route> {
  const { destination, answers, transportContext, mustIncludePlaces } = params

  // Solo se intenta en un arranque limpio — una generación que se está RETOMANDO (resumeFrom) ya
  // decidió su camino la primera vez que se lanzó; no tiene sentido reconsiderar la caché a mitad.
  if (!resumeFrom) {
    const cachedRoute = await tryRouteCacheReuse(params, onCheckpoint).catch((error: unknown) => {
      // Nunca debe bloquear la generación — pero un catch mudo hace imposible diagnosticar por qué
      // un camino de caché falló (se descubrió así: un bug real en el conteo de días quedaba
      // invisible, cayendo al pipeline completo sin ningún rastro). Un console.warn no interrumpe
      // nada, solo deja huella.
      console.warn('[route-cache] no se pudo reutilizar la ruta cacheada, generando de cero:', error)
      return null
    })
    if (cachedRoute) return cachedRoute
  }

  let dayPlaces: DayPlaces[] = resumeFrom?.dayPlaces ?? []
  let recommendedRevisits: RawRecommendedRevisit[] = resumeFrom?.recommendedRevisits ?? []
  let skeleton: SkeletonResponse | null = resumeFrom?.skeleton ?? null
  let generated: GeneratedRouteResponse = resumeFrom?.generated ?? { destination: '', origin: '', days: [] }
  let completedBlocks = resumeFrom?.completedBlocks ?? 0
  let phase: GenerationPhase = resumeFrom?.phase ?? 'skeleton'

  if (phase === 'skeleton') {
    const result = await postJson<SkeletonResponse>('/api/generate-skeleton', {
      destination,
      answers,
      ...transportContext,
    })
    skeleton = result
    generated = initialGeneratedFromSkeleton(result)
    phase = 'places'
    await onCheckpoint({ phase, params, dayPlaces, recommendedRevisits, skeleton, generated, completedBlocks, totalBlocks: 0 })
  }

  if (!skeleton) throw new Error('Falta el esqueleto del viaje — no se puede continuar.')

  if (phase === 'places') {
    // UNA sola llamada para TODO el viaje (no por bloque) — ver DAY_PLACES_SYSTEM_PROMPT en
    // server/index.js: necesita ver el viaje completo de una vez para no dejarse imprescindibles ni
    // repetir zonas entre días, algo que los bloques en paralelo de más abajo no pueden garantizar
    // por sí solos (cada uno ve el suyo en aislamiento).
    const result = await postJson<{ days: DayPlaces[]; recommended_revisits: RawRecommendedRevisit[] }>('/api/generate-day-places', {
      destination,
      answers,
      must_include_places: mustIncludePlaces,
      skeleton_days: skeleton.days,
      ...transportContext,
    })
    dayPlaces = result.days
    recommendedRevisits = result.recommended_revisits ?? []
    phase = 'blocks'
    const totalBlocks = chunkDays(skeleton.days, BLOCK_SIZE).length
    await onCheckpoint({ phase, params, dayPlaces, recommendedRevisits, skeleton, generated, completedBlocks: 0, totalBlocks })
  }

  const blocks = chunkDays(skeleton.days, BLOCK_SIZE)
  const totalBlocks = blocks.length
  // Al reanudar, un bloque ya generado (day.stops.length > 0 en `generated`) no se vuelve a pedir —
  // esto reemplaza al índice `completedBlocks` como mecanismo de "qué falta", porque con bloques en
  // paralelo ya no hay garantía de que se completen en orden.
  const pendingBlocks = blocks.filter((block) => block.some((day) => !isDayAlreadyGenerated(generated, day.day_number)))
  completedBlocks = totalBlocks - pendingBlocks.length

  if (pendingBlocks.length > 0) {
    const allDaysLight = skeleton.days.map(toLightDaySummary)
    const settled = await settlePendingBlocks({
      destination,
      answers,
      pendingBlocks,
      dayPlaces,
      allDaysLight,
      transportContext,
      generated,
      completedBlocks,
      totalBlocks,
      params,
      recommendedRevisits,
      skeleton,
      onCheckpoint,
    })
    generated = settled.generated
    completedBlocks = settled.completedBlocks
  }

  // Ruta generada de cero — se guarda como entrada nueva de route_cache para que futuras peticiones
  // parecidas (mismo destino/experiencias/ritmo/días) puedan reutilizarla vía tryRouteCacheReuse en
  // vez de pasar por el pipeline completo otra vez. Fire-and-forget, nunca bloquea la ruta actual.
  // recommendedRevisits viaja anidado dentro del propio blob cacheado (recommended_revisits, ver su
  // comentario en GeneratedRouteResponse) — si no se guardara aquí, una ruta servida desde caché
  // perdería para siempre sus tarjetas de "segunda visita recomendada" (bug real encontrado en vivo:
  // tryRouteCacheReuse llamaba a mapGeneratedRouteToRoute sin ese argumento en absoluto).
  saveRouteCache(destination, answers.days, routeCacheExperiences(answers), answers.pace, { ...generated, recommended_revisits: recommendedRevisits })

  // anchorNames alimenta el caché de tips con búsqueda web (ver StopDetailSheet.tsx/anchor-tips) —
  // antes solo cubría 2-3 "anclas" sueltas por día, ahora cubre la lista completa de lugares elegida
  // en la Fase 1 (deduplicada, por si un lugar aparece dos veces por una segunda visita legítima).
  const anchorNames = [...new Set(dayPlaces.flatMap((day) => day.places.map((place) => place.name)))]

  return mapGeneratedRouteToRoute(generated, destination, answers, transportContext, anchorNames, recommendedRevisits)
}
