// ── App flow ──────────────────────────────────────────────

export type AppScreen = 'destination' | 'questionnaire' | 'loading' | 'route' | 'devQuickRoute'

export type RouteMode = 'today' | 'route' | 'days' | 'bookings' | 'explore'

// ── Questionnaire ─────────────────────────────────────────

/** Modo de transporte del segmento de un día ya generado en la ruta (TransportSegment) — no confundir con TransportOption. */
export type TransportMode = 'flight' | 'car' | 'train' | 'bus' | 'ferry' | 'multimodal' | 'campervan' | 'transfer'

/** Tipo de fase de un tramo del viaje — solo multidestino_mixto_o_circuito (ciudad/naturaleza/isla, transporte distinto según el par). */
export type PhaseType = 'urbana' | 'naturaleza' | 'isla'

export type CarOwnership = 'own' | 'rental'

/**
 * Arquetipo del destino, clasificado por Claude al elegir destino (ver /api/classify-destination).
 * Condiciona toda la lógica de transporte en destino y alojamiento — nunca se mezcla con
 * el transporte de llegada (fase 1).
 */
export type DestinationArchetype =
  | 'roadtrip_exclusivo'
  | 'base_y_excursiones'
  | 'urbano_clasico'
  | 'multidestino_tren_o_vuelo'
  | 'multidestino_mixto_o_circuito'
  | 'expedicion_o_crucero'

/**
 * Opción de transporte de llegada elegida (o asumida) — construida en el frontend a partir de
 * los hechos de viabilidad que devuelve Claude, nunca redactada por Claude directamente. Nunca
 * describe cómo moverse YA en destino más allá de si esa opción implica llegar con vehículo
 * propio, o si el vehículo se decide en un paso posterior.
 */
/** Vehículo con el que el viajero se mueve en destino (no confundir con el modo de llegada). */
export type VehicleType = 'car' | 'camper'

export interface TransportOption {
  id: string
  icon: string
  title: string
  description: string
  subtitle: string
  estimated_duration: string
  estimated_price: string
  recommended: boolean
  includes_vehicle: boolean
  vehicle_type: VehicleType | null
  accommodation_type: 'hotel' | 'camping'
}

/** Si el vehículo de la opción de transporte elegida es propio o de alquiler. */
export type VehicleOwnership = 'own' | 'rental'

/** Solo para base_y_excursiones: un único alojamiento con excursiones circulares, o cambiar de zona. */
export type TravelMode = 'base_fija' | 'itinerante'

/** Derivado automáticamente del vehículo de la opción de transporte elegida. */
export type AccommodationMode = 'hotel' | 'camping'

/**
 * Banco fijo de 18 experiencias seleccionables — Claude filtra 4-8 relevantes para el destino
 * concreto (ver /api/suggest-experiences); el usuario elige libremente entre esas. Solo
 * icono+título son visibles — las definiciones que desambiguan overlaps (atracciones vs
 * naturaleza vs paisajes/miradores vs trekking) viven únicamente en el prompt del backend.
 */
export type ExperienceId =
  | 'atracciones'
  | 'arte_cultura'
  | 'paseos_encanto'
  | 'trekking_outdoor'
  | 'playas_calas'
  | 'paseos_barco'
  | 'gastronomia'
  | 'bienestar'
  | 'nieve'
  | 'paisajes_miradores'
  | 'compras'
  | 'ocio'
  | 'fenomenos_naturales'
  | 'parques'
  | 'resorts'
  | 'turismo_rural'
  | 'naturaleza'
  | 'joyas_ocultas'

/**
 * Un lugar concreto y real del destino, sugerido por Claude tras elegir experiencias (ver
 * /api/suggest-places) — no una de las 18 categorías del banco, sino un sitio con nombre propio
 * (ej. "Coliseo", "Mercado de Testaccio"). `category` es la categoría del banco de 18 a la que
 * mejor encaja, usada solo para ordenar la lista (ver placeOrdering.ts), nunca mostrada como filtro.
 */
export interface PlaceCandidate {
  id: string
  name: string
  description: string
  category: ExperienceId
  coordinates: Coordinates
  /** true para los imprescindibles objetivos del destino (ej. Coliseo/Fontana di Trevi en Roma) — mismo criterio que las anclas del pipeline de generación, ver PlaceSelector.tsx. */
  isMainAttraction: boolean
}

export type TripPace = 'zen' | 'balanced' | 'nonstop'

export type Chronotype = 'sunrise' | 'normal' | 'nightowl'

export type BudgetLevel = 'backpacker' | 'comfortable' | 'treatMyself'

export type Companion = 'solo' | 'couple' | 'family' | 'group'

export type Season = 'spring' | 'summer' | 'autumn' | 'winter'

/** Rango de fechas exactas en formato ISO (yyyy-mm-dd). */
export interface DateRange {
  start: string
  end: string
}

export interface QuestionnaireAnswers {
  origin: string
  originPlace?: Place
  days: number
  /** Fechas exactas del viaje, si el usuario las fijó. Cuando existen, determinan `days`. */
  dateRange?: DateRange
  /** Momento del año, usado cuando no hay fechas exactas. Si tampoco se elige, se aplica la estación actual. */
  season?: Season
  companion: Companion
  /** Solo companion='family' (Aventura en tribu): número de adultos del grupo. */
  companionAdults?: number
  /** Solo companion='family': edad de cada niño, un valor por niño — su longitud es el número de niños. */
  companionChildrenAges?: number[]
  /** Solo companion='group' (Con mi crew): total de personas del grupo, sin desglose. */
  companionGroupSize?: number
  /** Selección final del banco de 18 experiencias (+ el pseudo-id bloqueado si aplica) — el "ADN" de la ruta. */
  experiences: ExperienceId[]
  pace: TripPace
  chronotype: Chronotype
  budgetLevel: BudgetLevel
}

/** Todo lo decidido en la fase de transporte — se pasa tal cual al prompt de generación de ruta. */
export interface TransportContext {
  archetype: DestinationArchetype | null
  is_region: boolean | null
  transport_option: TransportOption | null
  vehicle_type: VehicleType | null
  vehicle_ownership: VehicleOwnership | null
  accommodation_mode: AccommodationMode | null
  travel_mode: TravelMode | null
  /** Solo para multidestino_tren_o_vuelo: nombre del pase de transporte dominante del destino, o null si no hay ninguno. */
  pase_dominante: string | null
  /** Respuesta del viajero a "¿Vas a viajar con {pase_dominante}?" — null mientras no se ha preguntado o no aplica. */
  travel_pass_confirmed: boolean | null
}

// ── Shared primitives ─────────────────────────────────────

export interface Coordinates {
  lat: number
  lng: number
}

/** Lugar resuelto vía Mapbox Geocoding: nombre corto, nombre completo y coordenadas. */
export interface Place {
  name: string
  /** Formato limpio "{Ciudad}, {País}" (con región intercalada solo si hace falta desambiguar). */
  fullName: string
  coordinates: Coordinates
  /** Código ISO de país en minúsculas (ej. "es"), para la bandera del desplegable — null si no se pudo determinar. */
  countryCode: string | null
}

export interface TicketOption {
  id: string
  label: string
  price: number
  bookUrl?: string
}

export type PriceTier = '€' | '€€' | '€€€'

// ── Stops ─────────────────────────────────────────────────

export type StopCategory = 'sight' | 'landmark' | 'nature' | 'shopping' | 'experience' | 'vibes'

export interface Stop {
  id: string
  time: string
  name: string
  fullName?: string
  description: string
  durationMinutes: number
  coordinates: Coordinates
  photoUrl: string
  category?: StopCategory
  /** Etiqueta de categoría del banco de 18 experiencias (ej. "Gastronomía") — solo en paradas añadidas desde el pool de EXPLORAR/el "+" entre paradas, para la píldora de categoría del acordeón en DIAS. Independiente de `category` (StopCategory), que sirve para otra cosa (pines del mapa en RUTA). */
  categoryLabel?: string
  priceInfo?: string
  insiderTip?: string
  ticketOptions?: TicketOption[]
  walkingTimeToNextMinutes?: number
  nextStopNote?: string
  isRevisit?: boolean
  isFreeTime?: boolean
  detail?: PlaceDetail
  /** Modo Hoy: instante real (ISO) en que el viajero pulsó "Ya he estado aquí" / "Ya terminé, seguir" — null/undefined mientras no se ha hecho check-in. Vive en el Stop porque es un hecho de esa visita concreta, no del día. */
  checkedInAt?: string | null
  /** Modo Hoy: instante real (ISO) en que el viajero pulsó "Sí, dame más tiempo" en el aviso "¿Sigues aquí?" — solo anota el retraso, no cambia nada más; se usa para no volver a preguntar de inmediato. */
  delayNotedAt?: string | null
}

/**
 * Un lugar que el viajero guardó por su cuenta desde el buscador (pestaña Wishlist del panel
 * Pool/Wishlist/Buscar) — a diferencia del Pool (candidatos que YA conoce la app), estos entran
 * solo porque el usuario los buscó explícitamente, sepa Claude de ellos o no. Vive fuera de
 * cualquier día concreto hasta que se añade como Stop a uno.
 */
export interface WishlistItem {
  id: string
  name: string
  fullName: string
  coordinates: Coordinates
  photoUrl: string
  addedAt: string
}

// ── Place detail modal ────────────────────────────────────

export interface PlaceDetail {
  whatIsIt: string
  hours: string
  closedDates?: string
  prices: string[]
  howToGetThere: string[]
  insiderTips: string[]
  ticketsAndTours: TicketOption[]
  bestForPhotos: {
    exterior?: string
    interior?: string
  }
}

// ── Transport & hotel ─────────────────────────────────────

/** Una alternativa real a la que se puede cambiar un TransportSegment (ej. Vuelo en vez de Tren para el mismo tramo). */
export interface TransportSegmentAlternative {
  mode: TransportMode
  durationLabel: string
  priceLabel: string
  /** Enlace de búsqueda genérico (no es una integración de afiliación real) — ver FLUJO_TRANSPORTE.md. */
  searchUrl?: string
  /** Solo modo 'car'/'campervan' en multidestino_mixto_o_circuito: en qué ciudad se recoge el vehículo de alquiler. */
  rentalPickupCity?: string
  /** Solo modo 'car'/'campervan' en multidestino_mixto_o_circuito: en qué ciudad se devuelve — puede implicar cargo por devolución en ciudad distinta ("one-way fee"), sin resolver todavía. */
  rentalReturnCity?: string
}

export interface TransportSegment {
  id: string
  fromCity: string
  toCity: string
  /** Modo actualmente elegido/resuelto para este tramo. */
  mode: TransportMode
  durationLabel: string
  priceLabel: string
  searchUrl?: string
  /** true cuando ya hay un modo resuelto (elegido manualmente, o forzado por un pase/fallback) — false mientras se muestran `alternatives` para elegir. */
  confirmed: boolean
  /** Resto de vías reales para este tramo, a las que se puede cambiar mientras no hay elección forzada. Vacío cuando el modo viene forzado (pase o fallback de autobús). */
  alternatives: TransportSegmentAlternative[]
  /** Nombre del pase de transporte que cubre este tramo automáticamente (ej. "JR Pass"), si aplica. */
  coveredByPass?: string
  /** true cuando hay un pase activo para el viaje pero este tramo concreto no lo cubre bien — se avisa en vez de ocultarlo, con vuelo como alternativa. */
  passException?: boolean
  /** Motivo cuando el modo viene forzado (fallback de autobús sin tren/vuelo con sentido, o excepción de pase) — se muestra siempre, nunca se oculta el porqué. */
  forcedReason?: string
  /** Solo modo 'car'/'campervan' en multidestino_mixto_o_circuito: en qué ciudad se recoge el vehículo de alquiler. */
  rentalPickupCity?: string
  /** Solo modo 'car'/'campervan' en multidestino_mixto_o_circuito: en qué ciudad se devuelve — puede implicar cargo por devolución en ciudad distinta ("one-way fee"), sin resolver todavía. */
  rentalReturnCity?: string
}

export interface HotelOption {
  id: string
  name: string
  stars: number
  pricePerNight: number
  bookUrl?: string
}

export interface HotelSection {
  city: string
  recommendedArea: string
  options: HotelOption[]
  browseUrl?: string
  confirmed: boolean
  nights: number
}

// ── Meals ─────────────────────────────────────────────────

export interface Restaurant {
  id: string
  name: string
  cuisine: string
  priceTier: PriceTier
  /** No siempre disponible — la IA no siempre tiene datos de reseñas agregadas. */
  rating?: number
  reviewCount?: number
  priceRange: string
  /** Qué pedir y por qué, cuando la IA lo sugiere. */
  description?: string
}

export interface MealSlot {
  id: string
  time: string
  label: string
  nearbyNote: string
  restaurants: Restaurant[]
}

// ── Excursions ────────────────────────────────────────────

export type ExcursionLength = 'half-day' | 'full-day'

export interface Excursion {
  id: string
  title: string
  length: ExcursionLength
  durationLabel: string
  price: number
  rating?: number
  reviewCount?: number
  bookUrl?: string
}

// ── Didn't make the cut ───────────────────────────────────

export interface DidntMakeCutItem {
  id: string
  name: string
  reason: string
  suggestion: string
  added: boolean
  coordinates?: Coordinates
  priceToAdd?: number
}

// ── Rain plan B ───────────────────────────────────────────

export interface RainPlanB {
  note: string
  alternativeStopIds?: string[]
}

// ── Day plan ──────────────────────────────────────────────

export interface DayPlan {
  id: string
  dayNumber: number
  city: string
  /** Solo multidestino_mixto_o_circuito: tipo de la fase actual — condiciona qué transporte se ofrece hacia la siguiente y el copy de movilidad local (Grab, etc.). */
  phaseType?: PhaseType
  title: string
  transport?: TransportSegment
  hotel?: HotelSection
  stops: Stop[]
  meals: MealSlot[]
  excursions?: Excursion[]
  didntMakeCut?: DidntMakeCutItem[]
  rainPlanB?: RainPlanB
  isExcursionDay?: boolean
  isRelaxedDay?: boolean
  /** Código ISO de país en minúsculas (ej. "it") de la ciudad de este día — para la bandera en la pestaña RUTA. */
  countryCode?: string | null
  /** true solo para el día sintético de vuelta a origen añadido al final del viaje (ver appendReturnLegDay) — no representa una noche real, se excluye del recuento de noches en buildDestinationSegments. */
  isReturnLeg?: boolean
}

// ── Budget ────────────────────────────────────────────────

export type BudgetSourceType = 'flight' | 'hotel' | 'tour' | 'meal' | 'other'

export interface BudgetItem {
  id: string
  icon: string
  label: string
  amount: number
  category: 'route' | 'extra'
  sourceType?: BudgetSourceType
  refId?: string
}

export interface Budget {
  items: BudgetItem[]
  total: number
}

// ── Route (top level) ─────────────────────────────────────

export interface Route {
  id: string
  destination: string
  country: string
  origin: string
  days: DayPlan[]
  answers: QuestionnaireAnswers
  transportContext: TransportContext
  budget: Budget
  intensity: number
  createdAt: string
  isPreview?: boolean
  /** true para rutas creadas desde la pantalla de acceso rápido de desarrollo (sin Claude) — DIAS/RESERVAS muestran un estado vacío. */
  isDevQuickRoute?: boolean
  /** Hora del vuelo de llegada en formato "HH:MM", introducida en Reservas — null/undefined si no se ha registrado. Dispara la comprobación de oportunidad de recálculo del primer día (ver flightOpportunity.ts). */
  arrivalFlightTime?: string | null
  /** Hora del vuelo de salida en formato "HH:MM", introducida en Reservas — null/undefined si no se ha registrado. Dispara la comprobación de oportunidad de recálculo del último día. */
  departureFlightTime?: string | null
}
