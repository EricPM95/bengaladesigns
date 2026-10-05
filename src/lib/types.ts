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
  /** Mes del viaje (0-11). Sin fechas es obligatorio; con fechas sale de ellas. El motor usa el día 15
      de ese mes para horarios y puesta de sol (shared/routeEngine/tripCalendar.js). */
  month?: number
  /** Temporada, DEDUCIDA del mes (se guarda para mostrarla y para lo que aún la lee, como los
      mercadillos navideños). Los viajes antiguos solo traen esto: pasan a su mes central. */
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
  chronotype: Chronotype
  budgetLevel: BudgetLevel
  /** Free Tour de tarde o de noche, con su hora (el viaje usa el Día de la Roma antigua con el tour a esa hora). Lo rellenará quien conozca la hora; el motor ya lo lee. */
  freeTourDespues?: { franja: 'manana' | 'tarde' | 'noche'; hora: string }
  /** Viaje de 1,5 días: el medio día cae por la tarde (llegada) o por la mañana (salida). */
  mediaJornada?: { franja: 'manana' | 'tarde'; llegada?: string; salida?: string; /** Dónde cae el medio día: 'primero' (llegada) o 'ultimo' (salida); sin él, la tarde es la llegada y la mañana la salida. */ posicion?: 'primero' | 'ultimo' }
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
  /** true cuando la siguiente parada cambió (se quitó la de en medio) y el tramo hasta ella aún no
      se ha recalculado: DayDetailPanel lo pide a Mapbox y lo guarda con `setLegToNext`. */
  nextLegPending?: boolean
  isRevisit?: boolean
  /** La reserva que fija esta parada (su entrada): tiene fecha y hora fijas y nada del motor ni del viajero la mueve (PARA_CODE_RESERVAS, 6). */
  reservedId?: string | null
  /** Parada opcional (PROMPT_QUITAR_RITMOS): lleva la etiqueta «Opcional» para que el viajero sepa qué puede saltarse. */
  optional?: boolean
  /** Por qué merece la pena volver — lo escribe el motor (ver revisits.js en el servidor). */
  revisitReason?: string
  isFreeTime?: boolean
  /** «Pasea y piérdete por {zona}» (PARA_CODE_TODO_2026-10-01, paso 5): el rato libre antes de cenar o a mitad de día, con nombre, foto de su zona y etiqueta «Paseo libre». */
  isFreeWalk?: boolean
  /** La foto propia ya la lleva otra tarjeta de ese día: esta pide la de siempre (Unsplash o Wikipedia), no la propia. */
  noOwnPhoto?: boolean
  /** El consejo del aperitivo (un spritz en una terraza): va dentro de la ficha, en Tips, de este paseo o de la parada que se alarga en su lugar. */
  aperitivoTip?: string | null
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
  /** Nocturna antes de cenar (invierno): el rato libre del día va justo antes de ella. */
  beforeDinner?: boolean
  /** La ha añadido el viajero ("Añadida por ti"). */
  addedByUser?: boolean
  /** Los campos de horario del lugar (DestinationPlace.hours_data), para "Hoy cierra" en un día libre aunque el día cambie de fecha. */
  hoursData?: Record<string, unknown> | null
  /** Mirador del atardecer (el motor lo ajusta a la puesta de sol): tarjeta melocotón en DIAS. */
  isSunset?: boolean
  /** Mirador que llega ya de noche ("Roma iluminada a tus pies"): tarjeta azul noche en DIAS. */
  isNightView?: boolean
  /** Su nombre de experiencia nocturna: "Roma iluminada desde el Janículo". */
  nightViewTitle?: string
  /** Un monumento con interior: se visita por dentro o se ve por fuera (con su motivo en `outsideReason`). */
  visitMode?: 'dentro' | 'fuera'
  /** Por qué va por fuera: cerrado ese día, ya cerrado a esa hora o no cabe (solo este deja pedir "Quiero entrar"). */
  outsideKind?: 'cerrado' | 'ya_cerrado' | 'no_abre' | 'no_cabe' | 'al_lado' | 'a_proposito'
  /** Free Tour: "El tour acaba en Piazza Navona: te hemos buscado la comida por esa zona…". */
  freeTourEnd?: string
  /** El tramo hasta aquí lo hace el día en bus o metro: "🚌 Bus 118, unos 25 min". */
  transitLabel?: string
  /** Monumento que ese día no se visita (va de paso por delante): sale "Por fuera" con este motivo ("hoy no toca
      entrar", "a esta hora ya ha cerrado", "cerrado hoy"). Sin él, lo de paso es "Por el camino". */
  outsideReason?: string | null
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
  /** De temporada con fechas aproximadas, en el margen de 15 días: "Es probable que algunos mercadillos
      aún no hayan abierto." (Estaciones, Parte 4). */
  seasonNotice?: string | null
  /** La línea de temporada de la ficha (PROMPT_ROMA_NAVIDAD 3): «En Navidad, la escalinata tiene su árbol…». Arriba del Resumen, destacada. */
  seasonLine?: string | null
  /** El icono de esa línea: «navidad» (por defecto) o «religioso» (el Ángelus de los domingos). */
  seasonLineIcon?: string | null
  /** Sitio de acceso libre: sin pestaña «Entradas», salvo que vaya en un Free Tour (`inFreeTour`). */
  freeAccess?: boolean
  /** El Free Tour que recorre este sitio: va en su pestaña «Entradas». */
  inFreeTour?: { name: string; durationMinutes: number | null; meetingPoint: string | null; url: string | null } | null
  /** La ficha lleva solo nuestro texto: no se pide el de la IA. */
  noAiText?: boolean
  /** El texto del lugar para su ficha (el nuestro), cuando no tiene ficha ampliada: va debajo del «por qué» de la ruta. */
  placeText?: string | null
  /** Imprescindible cerrado ese día que se enseña por fuera, o el grupo cuya ancla cierra todo el viaje: "El
      Coliseo está cerrado el 25 de diciembre por Navidad: te lo enseñamos por fuera, merece la pena igual." */
  closedNotice?: string | null
  /** Una calle: no es una parada, sale como "Pasas por…" sin número (Parte A, regla 4). */
  passThrough?: boolean
  /** Entró por una experiencia elegida (motor v3, Paso 3): la parada lleva su etiqueta ("Arte y Museos"). */
  experience?: ExperienceCategoryId | null
  /** Por qué está en la ruta (motor v3, Paso 6): una línea fija según el motivo — "Uno de los
      imprescindibles de Roma.", "Elegido según tus gustos: Arte y Museos."… */
  why?: string | null
  /** Precio y condiciones de entrada ("Entrada ~15€.") — solo se enseñan en la pestaña Tickets. */
  ticketInfo?: string[] | null
  /** Una pausa con nombre del día curado (el desayuno romano): no es un lugar. Se pinta como la comida (BreakCard),
      sin foto, horario, etiquetas ni ficha, y nunca pide nada a Claude. */
  isBreak?: boolean
  /** Solo isBreak: el icono de la pausa ("☕"). */
  breakIcon?: string | null
  /** Solo isBreak: cafés cercanos de los restaurantes del destino. */
  breakSuggestions?: { name: string; walkMinutes: number; address?: string | null }[]
  /** Nocturnas: el nombre del paseo nocturno curado al que pertenece ("El centro iluminado"). */
  nightWalkName?: string | null
  /** Foto: buscar la de este otro lugar en vez de la del nombre de la parada (el Free Tour usa la de Piazza Navona). */
  photoName?: string | null
  /** «Pasea y piérdete por…»: otros lugares de la zona cuya foto lleva el paseo si la de `photoName` ya sale en otra tarjeta del día. */
  photoAlternatives?: string[]
  /** «Por el camino»: calles y recomendaciones de paso dentro de la ficha. `unaVez`: sale una sola vez por viaje (Venchi). */
  porElCamino?: { texto: string; unaVez?: string }[]
  /** Foto propia fija (la del Free Tour, cuando la haya): se usa tal cual, sin buscar. */
  fixedPhotoUrl?: string | null
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
  /** Navidad y Año Nuevo (días escritos): «Con reserva», «Con reserva: menú de Nochevieja» o «En Navidad, reserva con antelación». */
  reservationNote?: string | null
  /** Motor v3, comida: fin de la franja ("14:30"); `time` es su inicio. La franja incluye llegar al
      restaurante, comer y andar a la siguiente parada. */
  windowEnd?: string
  /** Motor v3: dónde está el restaurante elegido para esta comida (ancla de la búsqueda). */
  coordinates?: Coordinates
  /** El restaurante que ha elegido el viajero para esta comida o cena (sustituye a la zona). */
  chosenRestaurant?: ChosenRestaurant | null
  /** El restaurante curado que pone el motor (decisión del usuario, 2026-09-28); el viajero lo puede cambiar. */
  recommendedRestaurant?: ChosenRestaurant | null
}

/** Un restaurante elegido por el viajero: no es una parada, va en su comida o su cena. */
export interface ChosenRestaurant {
  name: string
  coordinates: Coordinates
  zone?: string | null
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
  /** Con qué se busca su foto (del JSON del destino, en inglés: "Pompeii ruins"). */
  photoName?: string | null
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
  /** La más reservada del destino: solo si el dato es real (PARA_CODE_EXCURSIONES, 2). */
  bestSeller?: boolean
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
  /**
   * Dónde ha dejado el viajero la comida y la cena al arrastrarlas (PROMPT_UI_REPASO_3, 3): detrás de qué parada del día
   * (su posición; -1 = antes de la primera). Un restaurante no es una parada del motor: solo cambia el orden en el que se ve.
   */
  mealAfter?: { lunch?: number; dinner?: number }
  id: string
  dayNumber: number
  city: string
  /** Solo multidestino_mixto_o_circuito: tipo de la fase actual — condiciona qué transporte se ofrece hacia la siguiente y el copy de movilidad local (Grab, etc.). */
  phaseType?: PhaseType
  title: string
  /** Nombre del día curado del destino ("Roma Antigua y el centro barroco") — el título en DIAS. */
  curatedTitle?: string
  transport?: TransportSegment
  hotel?: HotelSection
  stops: Stop[]
  meals: MealSlot[]
  excursions?: Excursion[]
  didntMakeCut?: DidntMakeCutItem[]
  /** Lo marcado en el pool que no ha cabido en este día, con su motivo ("No hemos podido incluir X porque…"). */
  poolNotices?: { name: string; reason: string }[]
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
  /** Viaje sin excursión (Roma en 4 días): el día en que se ofrece cambiarlo por una, con su título y texto, sin precios. */
  excursionOffer?: { title: string; text: string } | null
  /** Solo días de excursión que tenían ruta curada — ver CuratedAlternative. */
  curatedAlternative?: CuratedAlternative | null
  /** El día tal como lo dio el motor, antes del primer cambio del viajero (decisión del usuario, 2026-09-28): "Volver a
      la ruta original" lo recupera EXACTAMENTE, sin regenerar. Solo en los días nuestros; se guarda con el viaje. */
  originalSnapshot?: DayPlan | null
  /** Día libre (lo organiza el viajero) sin horas: las paradas en orden y el paseo entre ellas ("Sin hora"). */
  untimed?: boolean
  /** Día que el viajero ha añadido al final del viaje ("+ Añadir día"): el motor no lo toca nunca y se puede quitar. */
  userAdded?: boolean
  /** El color del día (índice de la paleta de dayColors.ts), fijado al crear el viaje: va con el día, no con su
      posición — si el viajero lo mueve, su franja y sus pines se mueven con él (PROMPT_UI, Parte 1). */
  colorIndex?: number
  /** Excursión que el motor deja ya marcada en un día de excursión — la más popular del destino. */
  excursionPreselectedId?: string | null
  /** Frase de prueba social del destino, del JSON. Ver destination_config. */
  excursionSocialProof?: string | null
  /** El viajero dijo que no a la excursión de este día: no se le vuelve a proponer sola. */
  excursionDeclined?: boolean
  /**
   * Por qué este día empieza antes de su hora ("Hoy empezamos a las 07:30 para que te dé tiempo a
   * ver X"). Null en el resto.
   */
  dayNotice?: string | null
  /** Motor v3: traslado de más de 25 min andando entre la mañana y la tarde, con cómo moverse. */
  transferNotice?: string | null
  /** Minutos andando desde la última visita hasta el sitio de la cena (motor v3). Sirve para saber cuánto tiempo LIBRE queda antes de cenar, ver FreeTimeBlock. */
  dinnerWalkMinutes?: number | null
  /** Solo días de revisitas: la excursión de medio día que ocupa la mañana. Ver HalfDayExcursionSlot. */
  halfDayExcursion?: HalfDayExcursionSlot | null
  /** Motor v3: los ratos con nombre y contenido propio (el descanso de después de comer, el paseo de antes del mirador).
      Ya no existe el «Tiempo libre» ni el «Aperitivo» (paso 5, 2026-10-01): lo que sobra es una parada, un «Pasea y piérdete
      por…» o horas recolocadas. `before`/`after` pueden ser "la comida". */
  freeTimes?: { minutes: number; after: string; before: string; suggestions: { name: string; walkMinutes: number; requiresTicket: boolean }[]; hint?: string | null; title?: string | null }[] | null
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
  /** El medio de la vuelta si es distinto del de la ida (mismos ids que transport_option: 'flight', 'train'…); ausente = el mismo. */
  returnTransportOptionId?: string | null
  /** El punto de llegada y el de salida elegidos en la ficha (ids de _llegada.json: 'fco', 'cia'…); ausente = el primero. */
  arrivalPointId?: string | null
  departurePointId?: string | null
  /** Lo que eligió el viajero al poner la hora del vuelo (ventana «¿Ajustamos tu ruta a tu vuelo?»): `auto` = ajustar el primer y el último día a sus horas, `manual` = la ruta se queda como está. Ausente = aún no ha elegido. */
  flightAdjust?: 'auto' | 'manual' | null
  /** Ver TripDefaultTransport. Ausente en rutas generadas antes de este campo y en las rutas dev/manuales — quien lo lee cae a 'public'. */
  defaultTransport?: TripDefaultTransport
  /** Nombres de las anclas (Paso 1 del pipeline, /api/generate-anchors) usadas para generar esta ruta — permite a StopDetailSheet saber si una parada es una "ancla" (lugar obligatorio del destino, con tip cacheado + búsqueda web en tips_anclas) o una parada normal del pool (tip simple, sin caché). Vacío en rutas dev/manuales, que no pasan por ese paso. */
  anchorNames?: string[]
  /** Motor v3: el banner de contexto de la ruta (por qué es como es), ya rellenado — ContextBanner.tsx. */
  contextBanner?: string | null
  /** El viajero lo cerró con la X: no vuelve a salir en este viaje. */
  contextBannerDismissed?: boolean
  /** Nota de temporada (decisión del usuario, 2026-09-28): arriba de la ruta, con el efecto de temporada; se cierra. */
  /** (`icon: 'navidad'`: la nota navideña, en lugar de la de invierno.) */
  /** La tarjeta de temporada (PROMPT_TARJETA_TEMPORADA): `season` primavera, verano, otono, invierno o navidad; `title`, «Primavera en Roma». */
  seasonNote?: { season: string; text: string; icon?: string; title?: string } | null
  seasonNoteDismissed?: boolean
  /** Motor v3: avisos de fechas especiales (festivos, cierres, eventos) — DateNoticesModal.tsx. */
  dateNotices?: DateNotice[]
  /** La firma de los avisos que el viajero ya vio (dateNoticesKey): si la ruta se regenera y cambian, vuelven a salir. */
  dateNoticesSeenKey?: string | null
  /** "Quiero entrar": las paradas que el viajero ha pedido ver por dentro (el motor las pone por dentro y obligatorias). */
  insideNames?: string[]
  /** El viajero ha cambiado la ruta a mano (añadir, quitar, mover, cambiar horas…): antes de rehacerla por fechas se pregunta. */
  editedManually?: boolean
  /** La ruta tal como se le dio al crear el viaje (días, orden, paradas, horas y restaurantes, y sus respuestas): "Volver a
      mi ruta original" la recupera sin recalcular nada. Se guarda al crearla y no cambia al editar (PROMPT_UI, Parte 1). */
  originalRoute?: { days: DayPlan[]; answers: Route['answers'] } | null
  /** Lo que el viajero marcó del pool al generarla: para rehacerla igual (fechas, "Quiero entrar") aunque se abra otro día. */
  mustIncludePlaces?: string[]
}

/** Icono ilustrado de un aviso de fecha (DateNoticeIcons.tsx); 'cierre' = cierre resuelto por el motor. */
export type DateNoticeIcon = 'fiesta' | 'religioso' | 'fuegos' | 'luz' | 'navidad' | 'bandera' | 'musica' | 'calma' | 'cierre' | 'entrada'

/** Una tarjeta de la ventana de fechas especiales: lo que hemos hecho por un cierre y/o lo que hay ese día. */
export interface DateNotice {
  id: string
  /** El día del viaje al que va su etiqueta; null sin fechas (solo el mes). */
  dayNumber: number | null
  dateIso: string | null
  icon: DateNoticeIcon
  title: string
  /** La etiqueta pequeña de la cabecera del día ("Todos los Santos"). */
  tag: string
  texts: string[]
  kind: 'auto' | 'curado' | 'mixto'
}
