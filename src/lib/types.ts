// ── App flow ──────────────────────────────────────────────

export type AppScreen = 'destination' | 'myTrips' | 'questionnaire' | 'loading' | 'route' | 'devQuickRoute'

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
  /** Pseudo-id fuera del banco de 18 — siempre seleccionable (no depende del filtrado por destino de Claude), ver FREE_TOUR_EXPERIENCE en experienceBank.ts. */
  | 'free_tour'

/**
 * "Elige tus experiencias" v2 (punto 4 del prompt DEFINITIVO) — 6 categorías fijas + una condicional
 * de invierno, con clasificación Me interesa (máx. 3) / No me lo recomiendes (máx. 2) / neutra, ver
 * ExperienceCategorySelector.tsx. Reemplaza la cara visible del banco de 18 de arriba SOLO para el
 * pipeline de destinos curados (server: EXPERIENCE_CATEGORY_BANK) — "Elige lugares"/suggest-places
 * siguen recibiendo ExperienceId del banco de 18 tal cual, derivados de estas categorías (ver
 * deriveLegacyExperienceIds en experienceCategoryBank.ts) para no tener que tocar ese otro sistema.
 */
export type ExperienceCategoryId =
  | 'imprescindibles'
  | 'barrios_sabores'
  | 'arte_museos'
  | 'naturaleza_vistas'
  | 'free_tour'
  /** Solo visible/seleccionable cuando `answers.season === 'winter'`, ver EXPERIENCE_CATEGORY_BANK. */
  | 'mercadillos_navidenos'

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
  /** Categorías en "Me interesa" (máx. 3, siempre incluye 'imprescindibles' salvo que el usuario la arrastre a neutra) — ver ExperienceCategorySelector.tsx. Fuente de verdad del pipeline curado y de la clave de route_cache; `experiences` de arriba se sigue derivando de esto para "Elige lugares". */
  experiencesPositive: ExperienceCategoryId[]
  /** Categorías en "No me lo recomiendes" (máx. 2, nunca incluye 'imprescindibles'). */
  experiencesNegative: ExperienceCategoryId[]
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
  /** Solo para base_y_excursiones: true si un vehículo propio mejora sustancialmente la experiencia (transporte público/organizado limitado) — decide el color ámbar/gris de "Vehículo de alquiler" en RESERVAS (ver readiness.ts). */
  vehiculo_altamente_recomendado: boolean
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
  /**
   * Prompt 6 — esto no es una visita, es un paseo por la zona sugerido para tapar un hueco hasta la
   * cena. Se pinta distinto (icono de paseo, sin ficha ampliada, con botón de quitar), no lleva pin
   * en el mapa ni entra en la línea del día, y no cuenta como lugar visitado. Ver `zone_walks` en
   * el JSON del destino y buildZoneWalkStop en routeAlgorithm.js.
   */
  isZoneWalk?: boolean
  /** Artículo de Wikipedia del que sacar la foto real, con prefijo de idioma opcional
      ("en:Colosseum") — solo lo traen los lugares donde la búsqueda por nombre falla, ver
      placePhoto.ts y `wikipedia_title` en data/pipeline_v2/<destino>.json. */
  wikipediaTitle?: string | null
  category?: StopCategory
  /** Etiqueta específica del tipo de lugar (ej. "Anfiteatro histórico", "Museo de arte", "Gastronomía") para la píldora de categoría del acordeón en DIAS — nunca el bucket genérico de `category` (StopCategory, que sirve para otra cosa: pines del mapa en RUTA). Viene de Claude (`category_label`, ver mapStop en mapGeneratedRoute.ts) para paradas generadas por IA, o del banco de 18 experiencias para paradas añadidas desde EXPLORAR/el "+" entre paradas. shellFromStop (mockDayDetail.ts) cae a "Punto de interés" solo si esto falta. */
  categoryLabel?: string
  /** Horario real "HH:MM–HH:MM" si el lugar tiene interior visitable con horario (museo, monumento con acceso, iglesia con horario) — null/undefined si es un sitio siempre accesible al aire libre (fuente, plaza, arco, mirador). Viene de Claude (`hours`, ver mapStop) para paradas generadas por IA; StopDetailSheet.tsx (computeStopHoursTag) muestra "Acceso libre" cuando falta. */
  hours?: string | null
  priceInfo?: string
  insiderTip?: string
  ticketOptions?: TicketOption[]
  walkingTimeToNextMinutes?: number
  nextStopNote?: string
  isRevisit?: boolean
  /** Por qué merece la pena volver — lo escribe el motor (ver revisits.js en el servidor). */
  revisitReason?: string
  isFreeTime?: boolean
  detail?: PlaceDetail
  /** Modo Hoy: instante real (ISO) en que el viajero pulsó "Ya he estado aquí" / "Ya terminé, seguir" — null/undefined mientras no se ha hecho check-in. Vive en el Stop porque es un hecho de esa visita concreta, no del día. */
  checkedInAt?: string | null
  /** Modo Hoy: instante real (ISO) en que el viajero pulsó "Sí, dame más tiempo" en el aviso "¿Sigues aquí?" — solo anota el retraso, no cambia nada más; se usa para no volver a preguntar de inmediato. */
  delayNotedAt?: string | null
  /** true solo para la parada de Free Tour generada por el pipeline (ver FREE TOUR en DAY_BLOCK_SYSTEM_PROMPT, server/index.js) — StopAccordion/StopDetailSheet le dan un tratamiento especial: icono propio y ficha con contenido nativo del pipeline (freeTour*) en vez de pedir descripción bajo demanda. */
  isFreeTour?: boolean
  /** Solo isFreeTour: punto de encuentro real donde arrancan los free tours de este destino. */
  freeTourMeetingPoint?: string
  /** Solo isFreeTour: lugares reales que este free tour recorre por fuera, para que el viajero sepa qué esperar y sepa que volverá a visitarlos con calma otro día del viaje. */
  freeTourHighlights?: string[]
  /** Solo isFreeTour: exactamente 3 tips (persuasivo/propina/práctico) — a diferencia del resto de paradas, generados directamente por el pipeline, nunca bajo demanda. */
  freeTourTips?: string[]
  /** true solo para paradas de "experiencia nocturna" del pipeline v2 (ver night_experience en routeAlgorithm.js — un lugar ya visitado de día, revisitado de noche otro día del viaje). StopAccordion/StopDetailSheet le dan un tratamiento visual oscuro diferenciado (gradiente noche + icono de luna) en vez de la tarjeta normal. */
  isNightExperience?: boolean
  /** Ronda 5: categorías temáticas del lugar (ver `tags` en data/pipeline_v2/roma.json — "museo", "mirador", "iglesia"...) — solo el pipeline v2 las trae hoy; StopAccordion/StopDetailSheet las pintan como píldoras de color (ver tagColors.ts). Ausente/vacío no oculta nada más, solo no hay píldoras. */
  tags?: string[]
  /** Ronda 5: horario de apertura tal cual lo trae el JSON curado (p.ej. "Lun-Sáb 09:00-19:00, Dom 09:00-18:00") — distinto de `hours` (rango calculado para ESTA visita); es informativo, general del lugar, y siempre se muestra con el disclaimer "orientativo" (ver StopDetailSheet). Solo el pipeline v2 lo trae hoy. */
  scheduleText?: string | null
  /** Horario auditado del lugar en texto largo (días, épocas, festivos, última entrada): la sección
      "Horario" de la ficha. Solo destinos curados con horarios auditados. */
  hoursCard?: string | null
  /** Reserva: "obligatoria" | "recomendada" | "no" (horarios auditados). */
  reservation?: string | null
  /** Viaje SIN fechas: aviso de los días de la semana en que, a la hora de la visita, está cerrado
      (misas, cierres de fin de semana) o que cierra entero. Con fechas no hay: el horario ya es el
      real de ese día. */
  hoursWarning?: string | null
  /** Entró por una experiencia elegida (motor v3, Paso 3): la parada lleva su etiqueta ("Arte y Museos"). */
  experience?: ExperienceCategoryId | null
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
  /** 'breakfast'|'lunch'|'dinner' — para encontrar el MealSlot correcto por franja sin comparar contra `label` (texto ya traducido). */
  mealTime: 'breakfast' | 'lunch' | 'dinner'
  /** Barrio curado a mano (ver `meal_zones[...].options[0]` en el JSON del pipeline v2, routeAlgorithm.js) — cuando existe, se usa directamente como zona de BÚSQUEDA de restaurantes en vez de geocodificar en vivo con Mapbox+Claude (ver useZonaTuristica/useMealRecommendations). null/undefined = comportamiento de siempre (geocodificación en vivo). No confundir con `curatedZoneDisplay` (solo para el título). */
  curatedZone?: string | null
  /** Texto legible curado a mano para el TÍTULO del bloque ("en el Centro Histórico", ver `meal_zones[...].display`, Regla E) — nunca se usa para buscar restaurantes, solo para componer "Hora de comer/cenar {esto}". null/undefined = el título cae al formato genérico con `curatedZone`/zona geocodificada. */
  curatedZoneDisplay?: string | null
  /** Motor v3, comida: fin de la franja ("14:30"); `time` es su inicio. La franja incluye llegar al
      restaurante, comer y andar a la siguiente parada. */
  windowEnd?: string
  /** Motor v3: dónde está el restaurante elegido para esta comida (ancla de la búsqueda). */
  coordinates?: Coordinates
}

// ── Excursions ────────────────────────────────────────────

export type ExcursionLength = 'half-day' | 'full-day'

/**
 * Prompt 4 — qué es este día. 'normal' es la ruta de zonas de siempre; 'excursion' propone salir de
 * la ciudad; 'smart_route' es la ruta ampliada del día siguiente a una excursión; 'manual' es un día
 * en blanco que monta el viajero. Lo propone el algoritmo (ver getDayType en routeAlgorithm.js) y lo
 * puede cambiar el viajero desde la ficha del día — el algoritmo propone, el viajero dispone.
 */
export type DayType = 'normal' | 'excursion' | 'smart_route' | 'manual'

/** Cuánto se ve la opción de excursión en un día: un link al final, un banner sobre la ruta, el
    contenido entero del día, o nada (destinos sin excursiones). */
export type ExcursionProminence = 'none' | 'subtle' | 'prominent' | 'primary'

/** La ruta escrita a mano que un día de excursión tenía antes de serlo — se ofrece como alternativa
    con un adelanto de sus primeras paradas, para que volver a ella sea un toque. */
export interface CuratedAlternative {
  title: string
  places: string[]
}

export interface Excursion {
  id: string
  title: string
  length: ExcursionLength
  durationLabel: string
  price: number
  /** Qué se hace en la excursión — de la IA, ver GeneratedExcursion.description en mapGeneratedRoute.ts. */
  description?: string
  /** Cómo llegar/volver sugerido por la IA (tren/bus/tour organizado), ver A5 en server/index.js — nunca una integración real de compra, solo texto informativo. */
  transportSuggestion?: string
  rating?: number
  reviewCount?: number
  bookUrl?: string
  /** Emoji curado de la excursión, del JSON del destino — la tarjeta lo usa en vez de un icono genérico. */
  emoji?: string | null
  /** Horas de puerta a puerta, para el "Xh" de la tarjeta. */
  durationHours?: number | null
  /** A dónde se va: el marcador del mapa del día cuando esta excursión está seleccionada. */
  destinationCoords?: Coordinates | null
  /** Precio tal cual viene del JSON ("65€"). Es un PLACEHOLDER hasta integrar las APIs de afiliados
      (Civitatis/GYG) — nunca se presenta como precio real cerrado. */
  priceLabel?: string | null
  /** Dónde arranca la excursión, tal cual lo publica el operador. */
  meetingPoint?: string | null
  /** El precio y la nota de esta excursión están puestos a mano, no vienen de la API del operador. */
  provisionalPricing?: boolean
}

/**
 * Una excursión de MEDIO DÍA colocada en la mañana de un día de revisitas.
 *
 * El día sigue siendo un día de ciudad —tiene sus paradas de tarde— así que no es un `dayType`
 * nuevo: es un bloque que ocupa la mañana. Las horas vienen resueltas del motor (ver
 * HALF_DAY_EXCURSION_* en server/engine/modeConfig.js) para que la UI no las recalcule distinto.
 */
export interface HalfDayExcursionSlot {
  /** Id de la excursión dentro de `day.excursions`. */
  id: string
  /** "08:00" */
  startsAt: string
  /** "14:00" */
  endsAt: string
  /** "16:00" — a partir de aquí empiezan las paradas del día. */
  routeStartsAt: string
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

// ── Segunda visita recomendada (double_visit del JSON curado) ─────────────

/**
 * Un lugar con `double_visit: true` en data/destinations.json (ver generate-day-places, Fase 1) ya
 * aparece una vez como parada real de este día — esto NO es otra parada, es una sugerencia aparte
 * ("vale la pena volver de noche") con su propio botón "Añadir como parada" para que el viajero
 * decida por su cuenta, en vez de forzarla en el itinerario. Solo lo rellenan los destinos curados
 * (destinos sin JSON siempre devuelven un array vacío, ver /api/generate-day-places).
 */
export interface RecommendedRevisit {
  name: string
  reason: string
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
  recommendedRevisits?: RecommendedRevisit[]
  rainPlanB?: RainPlanB
  isExcursionDay?: boolean
  /** Prompt 4 — ver DayType. Ausente = 'normal' (todos los días anteriores a esta función). */
  dayType?: DayType
  /** Solo días de excursión: la que eligió el viajero, o null si todavía no ha elegido. */
  selectedExcursionId?: string | null
  /** Solo destinos donde las excursiones son parte del viaje, no un extra (excursions.essential). */
  excursionEssential?: boolean
  /** Ver ExcursionProminence. Ausente = 'none' (destinos sin excursiones y días anteriores a esto). */
  excursionProminence?: ExcursionProminence
  /** Solo días prominentes: las 2-3 destacadas del banner. */
  excursionHighlights?: Excursion[]
  /** Solo días de excursión que tenían ruta curada — ver CuratedAlternative. */
  curatedAlternative?: CuratedAlternative | null
  /** Excursión que el motor deja ya marcada en un día de excursión — la más popular del destino. */
  excursionPreselectedId?: string | null
  /** Frase de prueba social del destino, del JSON. Ver destination_config. */
  excursionSocialProof?: string | null
  /** El viajero dijo que no a la excursión de este día: no se le vuelve a proponer sola. */
  excursionDeclined?: boolean
  /**
   * Por qué este día empieza antes de lo que dice el ritmo ("Hoy empezamos a las 08:00 para que te
   * dé tiempo a ver X"). Solo cuando un imprescindible no cabía con el horario del ritmo tranquilo y
   * el motor pasó ese día al horario normal. Null en el resto.
   */
  paceNotice?: string | null
  /** Minutos andando desde la última visita hasta el sitio de la cena (motor v3). Sirve para saber cuánto tiempo LIBRE queda antes de cenar, ver FreeTimeBlock. */
  dinnerWalkMinutes?: number | null
  /** Solo días de revisitas: la excursión de medio día que ocupa la mañana. Ver HalfDayExcursionSlot. */
  halfDayExcursion?: HalfDayExcursionSlot | null
  /** El viajero quitó la excursión de medio día: la mañana queda suya y no se le vuelve a proponer. */
  halfDayExcursionDeclined?: boolean
  /** Día en blanco porque el viaje pasa de `max_auto_days` del destino — no porque el viajero lo
      convirtiera a libre. Solo el primero explica por qué. */
  beyondAutoDays?: boolean
  maxAutoDays?: number | null
  /**
   * Foto de las paradas de este día ANTES de convertirlo en excursión o día libre. Existe para que
   * "el algoritmo propone, el viajero dispone" no cueste contenido: volver a la ruta es restaurar
   * esto, sin regenerar nada ni volver a llamar a la IA.
   */
  stopsBeforeConversion?: Stop[]
  isRelaxedDay?: boolean
  /** Código ISO de país en minúsculas (ej. "it") de la ciudad de este día — para la bandera en la pestaña RUTA. */
  countryCode?: string | null
  /** true solo para el día sintético de vuelta a origen añadido al final del viaje (ver appendReturnLegDay) — no representa una noche real, se excluye del recuento de noches en buildDestinationSegments. */
  isReturnLeg?: boolean
  /** true solo para días del pipeline v2 (ver routeAlgorithm.js) — sus horas ya son definitivas y sus paradas de relleno no llevan `isNightExperience` aunque caigan de noche, así que DayDetailPanel.tsx no debe usar la hora como criterio de la sección "NOCHE" para este día (solo el flag). Los días de la ruta Claude-driven (todos los demás destinos) siguen clasificando "NOCHE" por hora, comportamiento de siempre. */
  timesAreFinal?: boolean
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

/** Cómo se mueve el viajero en este destino cuando ir a pie deja de tener sentido (ver default_transport en los JSON de destino y resolveDefaultTransport en server/index.js). */
export type TripDefaultTransport = 'public' | 'car'

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
  /** Ver TripDefaultTransport. Ausente en rutas generadas antes de este campo y en las rutas dev/manuales — quien lo lee cae a 'public'. */
  defaultTransport?: TripDefaultTransport
  /** Nombres de las anclas (Paso 1 del pipeline, /api/generate-anchors) usadas para generar esta ruta — permite a StopDetailSheet saber si una parada es una "ancla" (lugar obligatorio del destino, con tip cacheado + búsqueda web en tips_anclas) o una parada normal del pool (tip simple, sin caché). Vacío en rutas dev/manuales, que no pasan por ese paso. */
  anchorNames?: string[]
}
