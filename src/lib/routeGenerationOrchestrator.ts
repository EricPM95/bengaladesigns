import type { QuestionnaireAnswers, Route, TransportContext } from './types'
import { mapGeneratedRouteToRoute, type GeneratedRouteResponse, type GeneratedDay } from './mapGeneratedRoute'

/**
 * Verificado en vivo (2026-09-02): un bloque de 4 días tardó 210s, uno de 2 días 146s, y uno de UN
 * SOLO día 71s — el coste escala con el volumen de contenido pedido (tips, entry_options,
 * restaurantes reales...), muy por encima de lo que las llamadas ligeras (anclas 12s, esqueleto 7s)
 * tardan. BLOCK_SIZE se queda en 1 día — sigue siendo el tamaño más cómodo bajo el límite de función
 * serverless (ver vercel.json maxDuration) — pero desde 2026-09-03 los bloques ya no se generan en
 * serie: se lanzan todos a la vez (ver el bucle de Promise más abajo) porque la continuidad entre
 * días ya no depende de ver el contenido escrito del bloque anterior, sino de un resumen calculado
 * de antemano en generate-skeleton (zone_focus/experience_focus/anchor_names/must_include_names por
 * día, ver SKELETON_SYSTEM_PROMPT en server/index.js). Con 3 días esto bajó el tiempo total de
 * ~230s (anclas+esqueleto+3 bloques en serie) a el tiempo del bloque más lento, no la suma de todos.
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
  /** Sub-zona/tema del día (ver SKELETON_SYSTEM_PROMPT) — solo para que los días no se solapen entre sí; no se usa para nada más en el cliente. */
  zone_focus?: string
  experience_focus?: string[]
  /** Nombres de anclas asignadas a ESTE día concreto (no a la ciudad entera) — ver anchorsForBlockDays más abajo. */
  anchor_names?: string[]
  /** Igual que anchor_names pero para must_include_places (Wishlist del usuario, casi obligatorios). */
  must_include_names?: string[]
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

// ── SISTEMA DE CACHÉ INTELIGENTE DE RUTAS ───────────────────────────────────────────────────
//
// Antes del pipeline completo (anclas → esqueleto → bloques), se busca una ruta ya generada para
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
      const result = await postJson<{ days: GeneratedDay[] }>('/api/generate-day-block', {
        destination,
        answers,
        block_days: [blockDay],
        anchors_for_block: [],
        must_include_for_block: [],
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
    new_experiences: answers.experiences,
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
  const lookup = await lookupRouteCache(destination, answers.days, answers.experiences, answers.pace)
  if (lookup.level === 'none' || !lookup.entry) return null
  // El pipeline de redistribución cubre TODOS los días en una sola llamada (ver el límite en
  // regenerate-route-redistribute) — para un viaje más largo no compensa el riesgo, se cae al
  // pipeline normal como si no hubiera habido coincidencia.
  if (lookup.level === 'medium' && answers.days > 7) return null

  const cached = lookup.entry

  // Checkpoint "instantáneo": no hubo llamadas de anclas/esqueleto reales, pero LoadingScreen.tsx
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
  await onCheckpoint({ phase: 'skeleton', params, anchors: [], skeleton, generated: cached.route_data, completedBlocks: 0, totalBlocks: 1 })

  const generated =
    lookup.level === 'high'
      ? await applyHighMatchReuse(destination, answers, transportContext, cached)
      : await applyMediumMatchRedistribute(destination, answers, transportContext, cached)

  touchRouteCache(cached.id)
  await onCheckpoint({ phase: 'done', params, anchors: [], skeleton, generated, completedBlocks: 1, totalBlocks: 1 })

  const finalRoute = mapGeneratedRouteToRoute(generated, destination, answers, transportContext, [])
  saveRouteCache(destination, answers.days, answers.experiences, answers.pace, generated)
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
  }
}

function chunkDays(days: SkeletonDay[], size: number): SkeletonDay[][] {
  const chunks: SkeletonDay[][] = []
  for (let i = 0; i < days.length; i += size) chunks.push(days.slice(i, i + size))
  return chunks
}

/** Anclas asignadas a los días concretos de este bloque (ver anchor_names por día en generate-skeleton) — ya no se reparten por ciudad entera, así dos días de la misma ciudad no reciben las mismas anclas y no compiten por ellas al generarse en paralelo. */
function anchorsForBlockDays(anchors: Anchor[], block: SkeletonDay[]): Anchor[] {
  const names = new Set(block.flatMap((day) => (day.anchor_names ?? []).map((name) => name.toLowerCase())))
  if (names.size === 0) return []
  return anchors.filter((anchor) => names.has(anchor.name.toLowerCase()))
}

/** Igual que anchorsForBlockDays pero para must_include_places (ver must_include_names por día) — cada lugar de la Wishlist del usuario se asigna a un único día en el esqueleto, con reparto garantizado por topUpUnassignedNames en el servidor (ningún lugar se queda sin día). */
function mustIncludeForBlockDays(mustIncludePlaces: string[], block: SkeletonDay[]): string[] {
  const names = new Set(block.flatMap((day) => day.must_include_names ?? []).map((name) => name.toLowerCase()))
  if (names.size === 0) return []
  return mustIncludePlaces.filter((name) => names.has(name.toLowerCase()))
}

function toLightDaySummary(day: SkeletonDay): LightDaySummary {
  return { day_number: day.day_number, city: day.city, zone_focus: day.zone_focus, experience_focus: day.experience_focus }
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
      return { ...day, ...blockDay, city: day.city, country_code: day.country_code, type: day.type, phase_type: day.phase_type }
    }),
    not_included: [...(generated.not_included ?? []), ...(notIncluded ?? [])],
    excursions_available: [...(generated.excursions_available ?? []), ...(excursions ?? [])],
  }
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
  // Al reanudar, un bloque ya generado (day.stops.length > 0 en `generated`) no se vuelve a pedir —
  // esto reemplaza al índice `completedBlocks` como mecanismo de "qué falta", porque con bloques en
  // paralelo ya no hay garantía de que se completen en orden.
  const pendingBlocks = blocks.filter((block) => block.some((day) => !isDayAlreadyGenerated(generated, day.day_number)))
  completedBlocks = totalBlocks - pendingBlocks.length

  if (pendingBlocks.length > 0) {
    const allDaysLight = skeleton.days.map(toLightDaySummary)

    // Las peticiones se disparan TODAS aquí, de golpe (sin ningún await entre una y otra) — la
    // concurrencia real ocurre en este `.map`, no en cómo se procesan los resultados después.
    // Procesarlos uno a uno en el orden del array (en vez de con Promise.all) evita que dos bloques
    // que terminan casi a la vez pisen el checkpoint de Supabase del otro (ver
    // saveGenerationCheckpoint en tripPersistence.ts) — el coste en tiempo de esto es mínimo, porque
    // el fetch de todos ya está en marcha desde el principio; el tiempo total pasa a ser el del
    // bloque más lento, no la suma de todos.
    const blockPromises = pendingBlocks.map((block) => {
      const promise = postJson<{
        days: GeneratedDay[]
        not_included: GeneratedRouteResponse['not_included']
        excursions_available: GeneratedRouteResponse['excursions_available']
      }>('/api/generate-day-block', {
        destination,
        answers,
        block_days: block,
        anchors_for_block: anchorsForBlockDays(anchors, block),
        must_include_for_block: mustIncludeForBlockDays(mustIncludePlaces, block),
        all_days: allDaysLight,
        is_first_block_of_trip: block.some((day) => day.day_number === 1),
        ...transportContext,
      })
      // Si otro bloque falla primero y abortamos el bucle de abajo antes de llegar a este `await`,
      // esta promesa sigue en marcha en segundo plano — este catch mudo solo evita el warning de
      // "unhandled rejection" si también termina fallando; el error real se sigue propagando a
      // través del `await blockPromise` correspondiente más abajo.
      promise.catch(() => {})
      return promise
    })

    for (const blockPromise of blockPromises) {
      const result = await blockPromise
      generated = mergeBlockDaysIntoGenerated(generated, result.days, result.not_included, result.excursions_available)
      completedBlocks += 1
      const done = completedBlocks >= totalBlocks
      await onCheckpoint({ phase: done ? 'done' : 'blocks', params, anchors, skeleton, generated, completedBlocks, totalBlocks })
    }
  }

  // Ruta generada de cero — se guarda como entrada nueva de route_cache para que futuras peticiones
  // parecidas (mismo destino/experiencias/ritmo/días) puedan reutilizarla vía tryRouteCacheReuse en
  // vez de pasar por el pipeline completo otra vez. Fire-and-forget, nunca bloquea la ruta actual.
  saveRouteCache(destination, answers.days, answers.experiences, answers.pace, generated)

  return mapGeneratedRouteToRoute(
    generated,
    destination,
    answers,
    transportContext,
    anchors.map((anchor) => anchor.name),
  )
}
