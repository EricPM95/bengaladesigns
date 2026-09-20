import type {
  Budget,
  DayPlan,
  DidntMakeCutItem,
  Excursion,
  MealSlot,
  PhaseType,
  PriceTier,
  QuestionnaireAnswers,
  RecommendedRevisit,
  Restaurant,
  Route,
  Stop,
  StopCategory,
  TicketOption,
  TransportContext,
  TransportSegment,
  TripDefaultTransport,
} from './types'
import { buildTransportSegment, type CityTransitionFact } from './cityTransitionTransport'
import { buildPhaseTransportSegment, type PhaseTransitionFact } from './phaseTransitionTransport'
import { appendReturnLegDay } from './tripDays'

// ── Tipos de la respuesta cruda de Claude (ver ROUTE_SYSTEM_PROMPT en server/index.js) ──

interface GeneratedEntryOption {
  name: string
  price: string
  description: string
}

interface GeneratedTravelToNext {
  method: string
  duration_minutes: number
  distance: string
  description: string
}

interface GeneratedStop {
  id: string
  name: string
  description: string
  tip?: string
  suggested_time: string
  duration_minutes: number
  latitude: number
  longitude: number
  category?: string
  /** Tipo de lugar específico (ej. "Anfiteatro histórico") — ver BLOQUE B, categoryLabel en Stop (types.ts). */
  category_label?: string
  /** "HH:MM–HH:MM" si tiene horario real, null si es de acceso libre — ver BLOQUE B, Stop.hours. */
  hours?: string | null
  entry_fee?: string
  entry_options?: GeneratedEntryOption[]
  travel_to_next?: GeneratedTravelToNext
  /** Ver FREE TOUR en DAY_BLOCK_SYSTEM_PROMPT (server/index.js) — Stop.isFreeTour/freeTour* en types.ts. */
  is_free_tour?: boolean
  free_tour_meeting_point?: string
  free_tour_highlights?: string[]
  free_tour_tips?: string[]
  /** Solo pipeline v2 (ver routeAlgorithm.js) — Stop.isNightExperience en types.ts. */
  is_night_experience?: boolean
  /** Solo pipeline v2 — Stop.tags en types.ts. */
  tags?: string[]
  /** Solo pipeline v2, algunos lugares — Stop.scheduleText en types.ts. */
  schedule?: string | null
}

interface GeneratedMealOption {
  name: string
  price_level: string
  cuisine: string
  description?: string
  price_range: string
  latitude?: number
  longitude?: number
}

interface GeneratedMeal {
  time: 'breakfast' | 'lunch' | 'dinner'
  options: GeneratedMealOption[]
  /** Solo presente en rutas del pipeline v2 (ver routeAlgorithm.js, meal_zones) — barrio curado a mano, usado para BUSCAR restaurantes (ver MealSlot.curatedZone) — no confundir con `zone_display`. */
  zone?: string | null
  /** Solo pipeline v2 — texto legible para el título ("en el Centro Histórico", Regla E), ver MealSlot.curatedZoneDisplay. Nunca se usa para buscar. */
  zone_display?: string | null
}

export interface GeneratedDay {
  day_number: number
  title: string
  type?: string
  /** Solo difiere del destino global en arquetipos multi-ciudad (ej. multidestino_tren_o_vuelo, multidestino_mixto_o_circuito). */
  city?: string
  /** ISO alpha-2 en minúsculas — para la bandera en la pestaña RUTA (ver destinationSegments.ts). */
  country_code?: string
  /** Solo multidestino_mixto_o_circuito — ver buildArchetypeContext en server/index.js. */
  phase_type?: string
  stops: GeneratedStop[]
  meals: GeneratedMeal[]
  rainy_alternative?: string
  /** Solo pipeline v2 (ver routeAlgorithm.js) — DayPlan.timesAreFinal en types.ts. */
  times_are_final?: boolean
}

interface GeneratedFeasibilityLeg {
  feasible?: boolean
  duration_label?: string
  price_label?: string
}

/** Solo presente para multidestino_tren_o_vuelo — ver buildArchetypeContext en server/index.js. */
interface GeneratedCityTransition {
  day_number: number
  from_city: string
  to_city: string
  train?: GeneratedFeasibilityLeg
  flight?: GeneratedFeasibilityLeg
  bus?: GeneratedFeasibilityLeg
  recommended?: string
  pass_covers_leg?: boolean
}

/** Solo presente para multidestino_mixto_o_circuito — ver buildArchetypeContext en server/index.js. */
interface GeneratedPhaseTransition {
  day_number: number
  from_phase: string
  to_phase: string
  from_phase_type?: string
  to_phase_type?: string
  train?: GeneratedFeasibilityLeg
  flight?: GeneratedFeasibilityLeg
  bus?: GeneratedFeasibilityLeg
  ferry?: GeneratedFeasibilityLeg
  transfer_organizado?: GeneratedFeasibilityLeg
  roadtrip_alquiler?: GeneratedFeasibilityLeg & { apto_camper_autocaravana?: boolean }
  recommended?: string
}

interface GeneratedNotIncluded {
  name: string
  reason: string
  where_it_fits: string
  latitude?: number
  longitude?: number
}

interface GeneratedExcursion {
  name: string
  duration: 'half_day' | 'full_day'
  description: string
  /** Cómo llegar/volver sugerido por la IA (tren/bus/tour organizado) — ver EXCURSION DAYS en DAY_BLOCK_SYSTEM_PROMPT (server/index.js). */
  transport_suggestion?: string
  estimated_price: string
  suggested_day?: number
}

export interface GeneratedRouteResponse {
  destination: string
  origin: string
  summary?: string
  total_stops?: number
  estimated_budget?: {
    accommodation_per_night?: string
    meals_per_day?: string
    total_estimate?: string
  }
  days: GeneratedDay[]
  not_included?: GeneratedNotIncluded[]
  excursions_available?: GeneratedExcursion[]
  city_transitions?: GeneratedCityTransition[]
  phase_transitions?: GeneratedPhaseTransition[]
  /** Solo transporta el dato a través de route_cache (ver saveRouteCache/tryRouteCacheReuse en
   * routeGenerationOrchestrator.ts) — no lo usa nada de mapGeneratedRouteToRoute directamente, que
   * sigue recibiendo recommendedRevisits como su propio parámetro aparte. */
  recommended_revisits?: { name: string; day_number: number; reason: string }[]
  /** Cómo se mueve el viajero en este destino cuando ir a pie deja de tener sentido — llega desde generate-skeleton (ver resolveDefaultTransport en server/index.js) y acaba en Route.defaultTransport. */
  default_transport?: TripDefaultTransport
}

// ── Helpers ───────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Extrae el primer (o los dos primeros) número(s) de un texto tipo "€120-€180" y devuelve su media. */
function parseEuroMidpoint(text?: string): number {
  if (!text) return 0
  const numbers = text.match(/\d+(\.\d+)?/g)?.map(Number) ?? []
  if (numbers.length === 0) return 0
  return Math.round(numbers.reduce((sum, n) => sum + n, 0) / numbers.length)
}

const CATEGORY_MAP: Record<string, StopCategory> = {
  temple: 'sight',
  museum: 'sight',
  nature: 'nature',
  viewpoint: 'sight',
  neighborhood: 'vibes',
  market: 'experience',
  park: 'nature',
  landmark: 'landmark',
  experience: 'experience',
  beach: 'nature',
}

const TRAVEL_METHOD_META: Record<string, { icon: string; label: string }> = {
  walk: { icon: '🚶', label: 'A pie' },
  metro: { icon: '🚇', label: 'Metro' },
  train: { icon: '🚆', label: 'Tren' },
  bus: { icon: '🚌', label: 'Autobús' },
  taxi: { icon: '🚕', label: 'Taxi' },
  car: { icon: '🚗', label: 'Coche' },
  ferry: { icon: '⛴', label: 'Ferry' },
}

const MEAL_TIME_META: Record<GeneratedMeal['time'], { time: string; label: string }> = {
  breakfast: { time: '08:00', label: 'Desayuno' },
  lunch: { time: '13:30', label: 'Comida' },
  dinner: { time: '20:30', label: 'Cena' },
}

function mapTravelToNext(travel?: GeneratedTravelToNext): Pick<Stop, 'walkingTimeToNextMinutes' | 'nextStopNote'> {
  if (!travel) return {}
  const meta = TRAVEL_METHOD_META[travel.method] ?? { icon: '➡️', label: travel.method }
  const parts = [meta.label, travel.distance, travel.description].filter(Boolean)
  return {
    walkingTimeToNextMinutes: travel.duration_minutes,
    nextStopNote: `${meta.icon} ${parts.join(' · ')}`,
  }
}

function mapEntryOptions(stopId: string, options?: GeneratedEntryOption[]): TicketOption[] | undefined {
  if (!options || options.length === 0) return undefined
  return options.map((option, index) => ({
    id: `ticket-${stopId}-${index}`,
    label: `${option.name}${option.description ? ` — ${option.description}` : ''}`,
    price: parseEuroMidpoint(option.price),
  }))
}

/** Placeholder determinista mientras no hay ninguna foto real — se sustituye asíncronamente por un
    thumbnail real de Wikipedia si lo hay, ver enrichRoutePhotos en placePhoto.ts (App.tsx la llama
    tras mapear la ruta). picsum.photos NO busca por contenido, solo asigna una imagen de stock
    aleatoria a partir del hash de la seed — por eso este placeholder es solo un último recurso, no
    un intento real de mostrar el lugar correcto. */
function buildPlaceholderPhotoUrl(id: string, name: string): string {
  return `https://picsum.photos/seed/${encodeURIComponent(id || name)}/600/400`
}

function mapStop(dayNumber: number, generated: GeneratedStop): Stop {
  return {
    id: generated.id || `stop-${dayNumber}-${slugify(generated.name)}`,
    time: generated.suggested_time,
    name: generated.name,
    description: generated.description,
    durationMinutes: generated.duration_minutes,
    coordinates: { lat: generated.latitude, lng: generated.longitude },
    photoUrl: buildPlaceholderPhotoUrl(generated.id, generated.name),
    category: (generated.category && CATEGORY_MAP[generated.category]) || 'sight',
    categoryLabel: generated.category_label,
    hours: generated.hours ?? null,
    priceInfo: generated.entry_fee,
    insiderTip: generated.tip,
    ticketOptions: mapEntryOptions(generated.id || slugify(generated.name), generated.entry_options),
    ...mapTravelToNext(generated.travel_to_next),
    ...(generated.is_free_tour
      ? {
          isFreeTour: true,
          freeTourMeetingPoint: generated.free_tour_meeting_point,
          freeTourHighlights: generated.free_tour_highlights,
          freeTourTips: generated.free_tour_tips,
        }
      : {}),
    ...(generated.is_night_experience ? { isNightExperience: true } : {}),
    ...(generated.tags && generated.tags.length > 0 ? { tags: generated.tags } : {}),
    ...(generated.schedule ? { scheduleText: generated.schedule } : {}),
  }
}

function mapRestaurant(dayNumber: number, mealTime: string, index: number, option: GeneratedMealOption): Restaurant {
  return {
    id: `restaurant-${dayNumber}-${mealTime}-${index}`,
    name: option.name,
    cuisine: option.cuisine,
    priceTier: (option.price_level as PriceTier) || '€€',
    priceRange: option.price_range,
    description: option.description,
  }
}

function mapMeal(dayNumber: number, generated: GeneratedMeal): MealSlot {
  const meta = MEAL_TIME_META[generated.time] ?? { time: '13:00', label: generated.time }
  return {
    id: `meal-${dayNumber}-${generated.time}`,
    time: meta.time,
    label: meta.label,
    nearbyNote: '',
    restaurants: generated.options.map((option, index) => mapRestaurant(dayNumber, generated.time, index, option)),
    mealTime: generated.time,
    curatedZone: generated.zone ?? null,
    curatedZoneDisplay: generated.zone_display ?? null,
  }
}

function mapDidntMakeCut(items?: GeneratedNotIncluded[]): DidntMakeCutItem[] | undefined {
  if (!items || items.length === 0) return undefined
  return items.map((item, index) => ({
    id: `cut-${slugify(item.name)}-${index}`,
    name: item.name,
    reason: item.reason,
    suggestion: item.where_it_fits,
    added: false,
    coordinates: item.latitude != null && item.longitude != null ? { lat: item.latitude, lng: item.longitude } : undefined,
  }))
}

/** Enlace de búsqueda genérico (no es una integración de afiliación real, mismo espíritu que buildSearchUrl en cityTransitionTransport.ts) — ni Civitatis ni GetYourGuide están conectados de verdad todavía. */
function buildExcursionSearchUrl(name: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(`${name} excursión reserva Civitatis GetYourGuide`)}`
}

function mapExcursionsByDay(excursions?: GeneratedExcursion[]): Map<number, Excursion[]> {
  const byDay = new Map<number, Excursion[]>()
  for (const [index, excursion] of (excursions ?? []).entries()) {
    const dayNumber = excursion.suggested_day ?? 1
    const mapped: Excursion = {
      id: `excursion-${slugify(excursion.name)}-${index}`,
      title: excursion.name,
      length: excursion.duration === 'half_day' ? 'half-day' : 'full-day',
      durationLabel: excursion.duration === 'half_day' ? 'Medio día' : 'Día completo',
      price: parseEuroMidpoint(excursion.estimated_price),
      description: excursion.description,
      transportSuggestion: excursion.transport_suggestion,
      bookUrl: buildExcursionSearchUrl(excursion.name),
    }
    byDay.set(dayNumber, [...(byDay.get(dayNumber) ?? []), mapped])
  }
  return byDay
}

function sanitizeFeasibilityLeg(leg?: GeneratedFeasibilityLeg): { feasible: boolean; duration_label: string; price_label: string } {
  return {
    feasible: Boolean(leg?.feasible),
    duration_label: typeof leg?.duration_label === 'string' ? leg.duration_label : '',
    price_label: typeof leg?.price_label === 'string' ? leg.price_label : '',
  }
}

/** Solo relevante para multidestino_tren_o_vuelo — hechos crudos, sin decidir todavía el TransportSegment final (ver buildTransportSegment). */
function mapCityTransitionFacts(transitions?: GeneratedCityTransition[]): CityTransitionFact[] {
  if (!transitions) return []
  const facts: CityTransitionFact[] = []
  for (const raw of transitions) {
    if (!raw?.from_city || !raw?.to_city || typeof raw.day_number !== 'number') continue
    const recommended = raw.recommended === 'train' || raw.recommended === 'flight' || raw.recommended === 'bus' ? raw.recommended : null
    facts.push({
      dayNumber: raw.day_number,
      fromCity: raw.from_city,
      toCity: raw.to_city,
      train: sanitizeFeasibilityLeg(raw.train),
      flight: sanitizeFeasibilityLeg(raw.flight),
      bus: sanitizeFeasibilityLeg(raw.bus),
      recommended,
      pass_covers_leg: raw.pass_covers_leg !== false,
    })
  }
  return facts
}

const PHASE_TYPES: PhaseType[] = ['urbana', 'naturaleza', 'isla']

function asPhaseType(value?: string): PhaseType | undefined {
  return PHASE_TYPES.includes(value as PhaseType) ? (value as PhaseType) : undefined
}

/** Solo relevante para multidestino_mixto_o_circuito — hechos crudos, sin decidir todavía el TransportSegment final (ver buildPhaseTransportSegment). */
function mapPhaseTransitionFacts(transitions?: GeneratedPhaseTransition[]): PhaseTransitionFact[] {
  if (!transitions) return []
  const RECOMMENDED_VALUES = ['train', 'flight', 'bus', 'ferry', 'transfer', 'roadtrip']
  const facts: PhaseTransitionFact[] = []
  for (const raw of transitions) {
    const fromPhaseType = asPhaseType(raw?.from_phase_type)
    const toPhaseType = asPhaseType(raw?.to_phase_type)
    if (!raw?.from_phase || !raw?.to_phase || typeof raw.day_number !== 'number' || !fromPhaseType || !toPhaseType) continue
    const recommended = RECOMMENDED_VALUES.includes(raw.recommended ?? '') ? (raw.recommended as PhaseTransitionFact['recommended']) : null
    facts.push({
      dayNumber: raw.day_number,
      fromPhase: raw.from_phase,
      toPhase: raw.to_phase,
      fromPhaseType,
      toPhaseType,
      train: sanitizeFeasibilityLeg(raw.train),
      flight: sanitizeFeasibilityLeg(raw.flight),
      bus: sanitizeFeasibilityLeg(raw.bus),
      ferry: sanitizeFeasibilityLeg(raw.ferry),
      transferOrganizado: sanitizeFeasibilityLeg(raw.transfer_organizado),
      roadtripAlquiler: { ...sanitizeFeasibilityLeg(raw.roadtrip_alquiler), aptoCamperAutocaravana: Boolean(raw.roadtrip_alquiler?.apto_camper_autocaravana) },
      recommended,
    })
  }
  return facts
}

function mapDay(
  destination: string,
  generated: GeneratedDay,
  excursionsByDay: Map<number, Excursion[]>,
  transportByDay: Map<number, TransportSegment>,
  didntMakeCut?: DidntMakeCutItem[],
  recommendedRevisitsByDay?: Map<number, RecommendedRevisit[]>,
): DayPlan {
  return {
    id: `day-${generated.day_number}`,
    dayNumber: generated.day_number,
    city: generated.city || destination,
    countryCode: generated.country_code ? generated.country_code.toLowerCase() : null,
    phaseType: asPhaseType(generated.phase_type),
    title: generated.title,
    transport: transportByDay.get(generated.day_number),
    stops: generated.stops.map((stop) => mapStop(generated.day_number, stop)),
    meals: generated.meals.map((meal) => mapMeal(generated.day_number, meal)),
    excursions: excursionsByDay.get(generated.day_number),
    didntMakeCut: generated.day_number === 1 ? didntMakeCut : undefined,
    recommendedRevisits: recommendedRevisitsByDay?.get(generated.day_number),
    rainPlanB: generated.rainy_alternative ? { note: generated.rainy_alternative } : undefined,
    isExcursionDay: generated.type === 'excursion',
    isRelaxedDay: generated.type === 'relax',
    timesAreFinal: generated.times_are_final,
  }
}

function mapBudget(estimated?: GeneratedRouteResponse['estimated_budget']): Budget {
  const amount = parseEuroMidpoint(estimated?.total_estimate)
  if (amount === 0) return { items: [], total: 0 }
  const items = [
    {
      id: 'budget-ai-estimate',
      icon: '🤖',
      label: 'Estimación de la IA (alojamiento + comidas)',
      amount,
      category: 'route' as const,
      sourceType: 'other' as const,
    },
  ]
  return { items, total: amount }
}

/**
 * Red de seguridad server-side ya existe para "el Free Tour siempre va primero dentro de un día"
 * (enforceFreeTourFirst, server/index.js) — pero ninguna capa protegía contra un Free Tour
 * DUPLICADO en dos días distintos del mismo viaje. Encontrado en vivo: con BLOCK_SIZE=1 cada día se
 * genera con su propia llamada aislada a Claude, sin ver el contenido de los demás — si el esqueleto
 * deja el día 1 y, por ejemplo, el día 3 como los únicos días "city" de Roma (con una excursión en
 * medio), la llamada del día 3 también decidía añadir su propio Free Tour por su cuenta. Se corrigió
 * el texto del prompt (FREE TOUR en DAY_BLOCK_SYSTEM_PROMPT) para que solo el día 1 pueda tenerlo,
 * pero esto es el cinturón de seguridad: si aun así llegara un segundo, se elimina aquí, quedándose
 * siempre con el del día con menor `day_number` (day 1, o el más cercano si el 1 no lo tiene).
 */
function dedupeFreeTour(days: DayPlan[]): void {
  let kept = false
  for (const day of days) {
    if (!kept) {
      if (day.stops.some((stop) => stop.isFreeTour)) kept = true
      continue
    }
    day.stops = day.stops.filter((stop) => !stop.isFreeTour)
  }
}

export function mapGeneratedRouteToRoute(
  generated: GeneratedRouteResponse,
  destination: string,
  answers: QuestionnaireAnswers,
  transportContext: TransportContext,
  anchorNames: string[] = [],
  recommendedRevisits: { name: string; day_number: number; reason: string }[] = [],
): Route {
  const didntMakeCut = mapDidntMakeCut(generated.not_included)
  const excursionsByDay = mapExcursionsByDay(generated.excursions_available)
  const recommendedRevisitsByDay = new Map<number, RecommendedRevisit[]>()
  for (const entry of recommendedRevisits) {
    const list = recommendedRevisitsByDay.get(entry.day_number) ?? []
    list.push({ name: entry.name, reason: entry.reason })
    recommendedRevisitsByDay.set(entry.day_number, list)
  }

  const transportByDay = new Map<number, TransportSegment>()
  for (const fact of mapCityTransitionFacts(generated.city_transitions)) {
    transportByDay.set(fact.dayNumber, buildTransportSegment(fact, transportContext.pase_dominante, transportContext.travel_pass_confirmed))
  }
  for (const fact of mapPhaseTransitionFacts(generated.phase_transitions)) {
    transportByDay.set(fact.dayNumber, buildPhaseTransportSegment(fact))
  }

  // El array de días generado representa NOCHES ("1 día generado = 1 noche"); appendReturnLegDay
  // añade un día final de "vuelta" que no es noche. El pipeline (server/index.js, contentDaysFor)
  // ya pide exactamente `answers.days - 1` noches para que sumando el día de vuelta el total
  // coincida con lo que el viajero eligió — este chequeo es el invariante que lo garantiza: solo
  // añade el día de vuelta si con los días ya generados NO se alcanza el total pedido (evita
  // duplicar el +1 si algo más arriba cambia y ya llegan `answers.days` días completos).
  const mappedDays = generated.days.map((day) =>
    mapDay(destination, day, excursionsByDay, transportByDay, didntMakeCut, recommendedRevisitsByDay),
  )
  dedupeFreeTour(mappedDays)
  const days = mappedDays.length < answers.days ? appendReturnLegDay(mappedDays) : mappedDays

  return {
    id: `route-${slugify(destination)}-${Date.now()}`,
    destination,
    country: '',
    origin: answers.origin,
    days,
    answers,
    transportContext,
    budget: mapBudget(generated.estimated_budget),
    intensity: answers.pace === 'zen' ? 1 : answers.pace === 'nonstop' ? 5 : 3,
    createdAt: new Date().toISOString(),
    defaultTransport: generated.default_transport,
    anchorNames,
  }
}
