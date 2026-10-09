import { rangoImporte } from './dinero'
import { findTransitOption } from './transitLines'
import type { Coordinates, DayPlan, MealSlot, Restaurant, Stop, ExperienceCategoryId } from './types'
import { hasRealCoordinates } from './distanceMock'
import { getRoutedDistance } from './mapboxDirections'

/**
 * Contenido "rico" de un día en la pestaña DIAS — acordeón de llegada/vuelta y acordeones de
 * parada, con su sección de compra (entradas/tours). Todo mock por ahora (no hay integración real
 * de afiliación ni generación de Claude a nivel de parada) — determinista por `day.id` para que no
 * cambie en cada render. El día en que se conecte una API real, solo cambia el ORIGEN de estos
 * datos (esta forma de datos, `PlacePurchaseInfo`/`MockStopDetail`/`ArrivalDepartureDetail`, es la
 * que debe seguir consumiendo el componente visual).
 */

export function seededRandom(seed: string) {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return () => {
    h = (h * 1103515245 + 12345) >>> 0
    return (h % 1000) / 1000
  }
}

// ── Llegada / vuelta ─────────────────────────────────────────

export interface AffiliateTicketInfo {
  proveedor: 'civitatis' | 'getyourguide'
  precio: number
  moneda: string
  url_afiliado: string
}

export interface TransitOption {
  name: string
  durationLabel: string
  durationMinutes: number
  price: number
  /** Nº de trasbordos — 0 = directo. */
  transfers: number
  /** Parada/línea concreta SOLO cuando se conoce con fiabilidad (ej. "Termini") — si no, se omite, nunca se inventa. */
  stopName?: string
  /** Solo si Civitatis/GetYourGuide venden billete para ESTA vía concreta — si falta, ArrivalDetailSheet.tsx la muestra igual pero sin botón de compra, puramente informativa. */
  affiliateTicket?: AffiliateTicketInfo
}

export interface PrivateTransferInfo {
  proveedor: 'civitatis' | 'getyourguide'
  precio: number
  moneda: string
  url_afiliado: string
}

export interface AirportOption {
  code: string
  name: string
  /** "32 km al centro" — dato fijo del aeropuerto en sí, independiente de la hora de vuelo. */
  distanceToCenterLabel: string
  transitOptions: TransitOption[]
  /** Precio orientativo del taxi — nunca lleva botón de compra/venta, no hay afiliado que lo monetice. */
  taxiPriceLabel: string
  /** undefined = Civitatis/GetYourGuide no venden traslado privado para este aeropuerto — la pestaña "Traslados" de ArrivalDetailSheet.tsx no se muestra en absoluto. */
  privateTransfer?: PrivateTransferInfo
  officialLinkLabel: string
}

export interface ArrivalDepartureDetail {
  kind: 'arrival' | 'departure'
  cityName: string
  headline: string
  subtitle: string
  whyRecommendation: string
  airports: AirportOption[]
}

/** Nombre real de la estación/hub principal de la ciudad, tomado de los propios transitOptions ya
    conocidos (ej. "Roma Termini") — nunca "la estación principal" a secas. null cuando no se conoce
    ninguno con fiabilidad (aeropuerto genérico sin datos concretos). */
function primaryHubName(airports: AirportOption[]): string | null {
  for (const airport of airports) {
    const withStop = airport.transitOptions.find((option) => option.stopName)
    if (withStop?.stopName) return withStop.stopName
  }
  return null
}

/** Únicos destinos con más de un aeropuerto conocido en este mock — el resto cae al genérico de un solo punto de llegada. */
const MULTI_AIRPORT_CITIES: Record<string, AirportOption[]> = {
  roma: [
    {
      code: 'FCO',
      name: 'Fiumicino',
      distanceToCenterLabel: '32 km al centro',
      transitOptions: [
        {
          name: 'Leonardo Express (tren directo)',
          durationLabel: '32 min',
          durationMinutes: 32,
          price: 14,
          transfers: 0,
          stopName: 'Roma Termini',
          affiliateTicket: { proveedor: 'civitatis', precio: 14, moneda: 'EUR', url_afiliado: '#' },
        },
        { name: 'Tren regional FL1', durationLabel: '48 min', durationMinutes: 48, price: 8, transfers: 0, stopName: 'Roma Tiburtina' },
        { name: 'Autobús lanzadera', durationLabel: '55 min', durationMinutes: 55, price: 6, transfers: 0, stopName: 'Roma Termini' },
      ],
      taxiPriceLabel: `${rangoImporte(50, 55, 'EUR')} (tarifa fija aeropuerto-centro)`,
      privateTransfer: { proveedor: 'getyourguide', precio: 45, moneda: 'EUR', url_afiliado: '#' },
      officialLinkLabel: 'Horarios y precios oficiales (Trenitalia)',
    },
    {
      code: 'CIA',
      name: 'Ciampino',
      distanceToCenterLabel: '15 km al centro',
      transitOptions: [
        { name: 'Autobús directo a Termini', durationLabel: '40 min', durationMinutes: 40, price: 6, transfers: 0, stopName: 'Roma Termini' },
        { name: 'Autobús + metro', durationLabel: '55 min', durationMinutes: 55, price: 7.5, transfers: 1 },
      ],
      taxiPriceLabel: `${rangoImporte(30, 35, 'EUR')} (tarifa fija aeropuerto-centro)`,
      officialLinkLabel: 'Horarios y precios oficiales (Trenitalia)',
    },
  ],
}

function genericAirport(cityName: string): AirportOption {
  const rand = seededRandom(`${cityName}-airport`)
  return {
    code: '',
    name: `Aeropuerto de ${cityName}`,
    distanceToCenterLabel: '20-30 km al centro',
    transitOptions: [
      {
        name: 'Tren/autobús directo al centro',
        durationLabel: '35-45 min',
        durationMinutes: 40,
        price: 10,
        transfers: 0,
        ...(rand() > 0.5 ? { affiliateTicket: { proveedor: 'civitatis' as const, precio: 10, moneda: 'EUR', url_afiliado: '#' } } : {}),
      },
    ],
    taxiPriceLabel: `${rangoImporte(25, 35, 'EUR')} orientativo`,
    ...(rand() > 0.4 ? { privateTransfer: { proveedor: 'getyourguide' as const, precio: 40, moneda: 'EUR', url_afiliado: '#' } } : {}),
    officialLinkLabel: 'Horarios y precios oficiales del operador local',
  }
}

export function buildArrivalDepartureDetail(cityName: string, originName: string, kind: 'arrival' | 'departure'): ArrivalDepartureDetail {
  const airports = MULTI_AIRPORT_CITIES[cityName.trim().toLowerCase()] ?? [genericAirport(cityName)]
  const hubName = primaryHubName(airports)
  // Con hub conocido (ej. "Roma Termini"): lo nombra directamente, como pide el ejemplo. Sin él
  // (aeropuerto genérico sin datos concretos): referencia el propio aeropuerto por su nombre real en
  // vez de inventar un hub que no conocemos — nunca "la estación/punto principal" a secas.
  const hubReference = hubName ? `${hubName}, el punto de conexión principal de ${cityName}` : `${airports[0].name}`

  if (kind === 'arrival') {
    return {
      kind,
      cityName,
      headline: `Llegada a ${cityName}`,
      subtitle: `Cómo llegar al centro desde tu punto de entrada en ${cityName}`,
      whyRecommendation: `Recomendamos ir primero a ${hubReference} — desde ahí conecta el metro, el tranvía y los autobuses urbanos, así que cualquier zona de tu alojamiento queda a un solo trasbordo.`,
      airports,
    }
  }

  return {
    kind,
    cityName,
    headline: `Vuelta a ${originName}`,
    subtitle: `Cómo llegar a tu punto de salida en ${cityName} con margen de sobra`,
    whyRecommendation: `Igual que a la llegada, ${hubReference} es donde conecta todo el transporte urbano — desde cualquier zona de tu alojamiento llegas con un solo trasbordo, sin depender de tráfico impredecible.`,
    airports,
  }
}

// ── Paradas del día ───────────────────────────────────────────

export interface PurchaseTicket {
  nombre: string
  nota?: string
  precio: number
  /** Solo necesaria cuando afiliacion_disponible=true (carrusel unificado de tarjetas) — la sección "Tickets" (sin afiliación) no la usa, es solo lista+precio. */
  imagen?: string
}

export interface PurchaseTour {
  nombre: string
  precio: number
  imagen: string
}

export interface PlacePurchaseInfo {
  lugar: string
  afiliacion_disponible: boolean
  entradas: PurchaseTicket[]
  tours?: PurchaseTour[]
}

export interface StopSection {
  heading: string
  body: string
}

export interface MockStopDetail {
  id: string
  name: string
  category: string
  hours: string | null
  /** Duración estimada de la visita, en minutos — pill "⏳" de StopDetailSheet (ver format.ts formatDuration). */
  durationMinutes: number
  photoUrl: string
  description: string
  sections?: StopSection[]
  tips: string[]
  purchase: PlacePurchaseInfo | null
  /** Ver Stop.isFreeTour/freeTour* en types.ts — StopDetailSheet le da un tratamiento especial (ficha con contenido nativo del pipeline en vez de describeStop bajo demanda). */
  isFreeTour?: boolean
  freeTourMeetingPoint?: string
  freeTourHighlights?: string[]
  freeTourTips?: string[]
  /** Ver Stop.isNightExperience en types.ts — StopAccordion/StopDetailSheet le dan un tratamiento visual oscuro diferenciado. */
  isNightExperience?: boolean
  /** Ver Stop.isFreeWalk / Stop.aperitivoTip: «Pasea y piérdete por…» y el consejo del aperitivo. */
  isFreeWalk?: boolean
  noOwnPhoto?: boolean
  aperitivoTip?: string | null
  /** Ver Stop.reservedId: la reserva que fija esta parada. */
  reservedId?: string | null
  /** Ver Stop.porElCamino: «Por el camino» dentro de la ficha. */
  porElCamino?: { texto: string; unaVez?: string }[]
  /** Ver Stop.isSunset / Stop.isNightView: mirador del atardecer y mirador de noche. */
  isSunset?: boolean
  isNightView?: boolean
  nightViewTitle?: string
  visitMode?: 'dentro' | 'fuera'
  freeTourEnd?: string
  outsideReason?: string | null
  /** Ver Stop.outsideKind: solo 'no_cabe' deja pedir "Quiero entrar"; 'cerrado' y 'ya_cerrado' van en rojo. */
  outsideKind?: 'cerrado' | 'ya_cerrado' | 'no_abre' | 'no_cabe' | 'al_lado' | 'a_proposito'
  /** Ver Stop.tags en types.ts — píldoras de color en StopAccordion/StopDetailSheet (ver tagColors.ts). */
  tags?: string[]
  /** Ver Stop.scheduleText en types.ts. */
  scheduleText?: string | null
  /** Ver Stop.hoursCard / Stop.reservation en types.ts. */
  hoursCard?: string | null
  reservation?: string | null
  /** Ver Stop.hoursWarning en types.ts. */
  hoursWarning?: string | null
  /** Ver Stop.seasonNotice en types.ts. */
  seasonNotice?: string | null
  /** Ver Stop.seasonLine en types.ts. */
  seasonLine?: string | null
  seasonLineIcon?: string | null
  /** Ver Stop.freeAccess, Stop.inFreeTour y Stop.noAiText en types.ts. */
  freeAccess?: boolean
  inFreeTour?: { name: string; durationMinutes: number | null; meetingPoint: string | null; url: string | null } | null
  noAiText?: boolean
  placeText?: string | null
  /** Ver Stop.closedNotice en types.ts. */
  closedNotice?: string | null
  /** Ver Stop.passThrough en types.ts. */
  passThrough?: boolean
  /** Ver Stop.isArrival en types.ts. */
  isArrival?: boolean
  arrivalText?: string | null
  /** Ver Stop.orientativeTime / reservationTime en types.ts. */
  orientativeTime?: boolean
  reservationTime?: string | null
  /** Ver Stop.recommendedTurn en types.ts. */
  recommendedTurn?: string | null
  /** Ver Stop.waitOpensAt / waitHint en types.ts. */
  waitOpensAt?: string | null
  arrivalNote?: string | null
  arrivalTime?: string | null
  arrivalMinutes?: number | null
  visitedDay?: number | null
  waitHint?: string | null
  /** Ver Stop.experience en types.ts. */
  experience?: ExperienceCategoryId | null
  /** Ver Stop.why en types.ts. */
  why?: string | null
  /** Ver Stop.ticketInfo en types.ts. */
  ticketInfo?: string[] | null
  /** Ver Stop.isRevisit — segunda visita al mismo sitio a otra hora, con su motivo. */
  isRevisit?: boolean
  /** Ver Stop.optional. */
  optional?: boolean
  revisitReason?: string
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
  /** Foto propia fija (la del Free Tour, cuando la haya): se usa tal cual, sin buscar. */
  fixedPhotoUrl?: string | null
}

/**
 * Convierte una parada real (`Stop`) en la forma rica que consume StopAccordion. Cubre dos casos
 * distintos con el mismo tipo de entrada:
 * - Parada generada por Claude (pipeline de generación, ver mapStop en mapGeneratedRoute.ts): SÍ
 *   trae tip real (`insiderTip`) y entradas reales (`ticketOptions`, de `entry_options` del
 *   prompt) — hay que conservarlos, no son mock. Sin `afiliacion_disponible` (no hay integración
 *   de afiliación a nivel de parada individual todavía), así que cae en el modo "Tickets" simple
 *   de PurchaseSection (lista + enlace a la web oficial), no en el carrusel.
 * - Parada añadida/editada a mano por el usuario (EXPLORAR/el "+" entre paradas): no tiene tip ni
 *   entradas propias — `insiderTip`/`ticketOptions` vienen `undefined` en ese caso y el resultado
 *   es el shell vacío de siempre.
 */
export function shellFromStop(stop: Stop): MockStopDetail {
  return {
    id: stop.id,
    name: stop.name,
    category: stop.categoryLabel ?? 'Punto de interés',
    hours: stop.hours ?? null,
    durationMinutes: stop.durationMinutes,
    photoUrl: stop.photoUrl,
    description: stop.description,
    tips: stop.insiderTip ? [stop.insiderTip] : [],
    purchase: mapStopTicketsToPurchase(stop),
    isFreeTour: stop.isFreeTour,
    freeTourMeetingPoint: stop.freeTourMeetingPoint,
    freeTourHighlights: stop.freeTourHighlights,
    freeTourTips: stop.freeTourTips,
    isNightExperience: stop.isNightExperience,
    isFreeWalk: stop.isFreeWalk,
    noOwnPhoto: stop.noOwnPhoto,
    aperitivoTip: stop.aperitivoTip ?? null,
    reservedId: stop.reservedId ?? null,
    ...(stop.porElCamino?.length ? { porElCamino: stop.porElCamino } : {}),
    isSunset: stop.isSunset,
    isNightView: stop.isNightView,
    nightViewTitle: stop.nightViewTitle,
    visitMode: stop.visitMode,
    freeTourEnd: stop.freeTourEnd,
    outsideReason: stop.outsideReason ?? null,
    outsideKind: stop.outsideKind,
    tags: stop.tags,
    scheduleText: stop.scheduleText,
    hoursCard: stop.hoursCard ?? null,
    reservation: stop.reservation ?? null,
    hoursWarning: stop.hoursWarning ?? null,
    seasonNotice: stop.seasonNotice ?? null,
    seasonLine: stop.seasonLine ?? null,
    seasonLineIcon: stop.seasonLineIcon ?? null,
    freeAccess: stop.freeAccess,
    inFreeTour: stop.inFreeTour ?? null,
    noAiText: stop.noAiText,
    placeText: stop.placeText ?? null,
    closedNotice: stop.closedNotice ?? null,
    passThrough: stop.passThrough ?? false,
    ...(stop.isArrival ? { isArrival: true, arrivalText: stop.arrivalText ?? null } : {}),
    ...(stop.orientativeTime ? { orientativeTime: true } : {}),
    ...(stop.reservationTime ? { reservationTime: stop.reservationTime } : {}),
    ...(stop.recommendedTurn ? { recommendedTurn: stop.recommendedTurn } : {}),
    ...(stop.waitOpensAt ? { waitOpensAt: stop.waitOpensAt, waitHint: stop.waitHint ?? null } : {}),
    ...(stop.arrivalNote ? { arrivalNote: stop.arrivalNote, arrivalTime: stop.arrivalTime ?? null, arrivalMinutes: stop.arrivalMinutes ?? null } : {}),
    ...(stop.visitedDay ? { visitedDay: stop.visitedDay } : {}),
    experience: stop.experience ?? null,
    why: stop.why ?? null,
    ticketInfo: stop.ticketInfo ?? null,
    isRevisit: stop.isRevisit,
    optional: stop.optional,
    revisitReason: stop.revisitReason,
    isBreak: stop.isBreak,
    breakIcon: stop.breakIcon ?? null,
    breakSuggestions: stop.breakSuggestions,
    nightWalkName: stop.nightWalkName ?? null,
    photoName: stop.photoName ?? null,
    fixedPhotoUrl: stop.fixedPhotoUrl ?? null,
  }
}

function mapStopTicketsToPurchase(stop: Stop): PlacePurchaseInfo | null {
  if (!stop.ticketOptions || stop.ticketOptions.length === 0) return null
  return {
    lugar: stop.name,
    afiliacion_disponible: false,
    entradas: stop.ticketOptions.map((option) => ({ nombre: option.label, precio: option.price })),
  }
}

/**
 * Paradas a mostrar para un día: las del propio día. (Hasta la Tanda 6g, un día sin paradas enseñaba una plantilla de mentira —los dos sitios de mentira del generador,
 * «Hora de comer»—; ya no hay plantillas: un día vacío está vacío.)
 */
export function resolveDisplayStops(day: DayPlan): MockStopDetail[] {
  return day.stops.map((stop) => shellFromStop(stop))
}

/** Las paradas del día tal cual (antes cristalizaba la plantilla de mentira; ya no la hay). */
export function seedStopsFromTemplate(day: DayPlan): Stop[] {
  return day.stops
}

// ── Conectores entre paradas ──────────────────────────────────

export type TransportMode = 'walking' | 'transit' | 'driving'

export const TRANSPORT_MODE_LABEL: Record<TransportMode, string> = {
  driving: 'Taxi',
  transit: 'Transporte público',
  walking: 'Andando',
}

export interface TransportModeOption {
  mode: TransportMode
  durationLabel: string
  distanceLabel: string
  /** Tiempo estimado (sin datos reales de la línea): se enseña con «~» y «estimado». (Desde la Tanda 6f ya no hay estimaciones de transporte público: solo hay una opción si existe una línea de verdad.) */
  estimated?: boolean
  /** Solo en el transporte público: la línea real que une los dos sitios («Tranvía 8», «Metro A», «Bus 40»). */
  line?: string
}

/**
 * Transporte público PUERTA A PUERTA (revisión del 2026-09-24): andar hasta la parada, esperar, el
 * trayecto y andar desde la parada de bajada. Sin API de transporte real, el trayecto se estima del
 * tiempo en coche (el bus va más lento y para); lo demás son tiempos fijos típicos de ciudad.
 */
const TRANSIT_WALK_TO_STOP_MINUTES = 5
const TRANSIT_WAIT_MINUTES = 6
const TRANSIT_WALK_FROM_STOP_MINUTES = 5
const TRANSIT_RIDE_FACTOR = 1.4
/** El transporte solo se enseña si ahorra de verdad: al menos esto frente a ir andando. */
export const TRANSIT_MIN_SAVING_MINUTES = 5

export function transitDoorToDoorMinutes(drivingMinutes: number): number {
  return TRANSIT_WALK_TO_STOP_MINUTES + TRANSIT_WAIT_MINUTES + Math.round(drivingMinutes * TRANSIT_RIDE_FACTOR) + TRANSIT_WALK_FROM_STOP_MINUTES
}

export interface ConnectorInfo {
  hasRealDisplacement: boolean
  /** true si hay una línea de transporte público real entre los dos sitios (Tanda 6f); si no, la opción no se enseña. */
  transitSavesTime?: boolean
  /** Solo cuando NO hay desplazamiento real — texto simple, sin icono ni selector de modo. */
  label: string
  /** Presente solo cuando hasRealDisplacement=true — una opción por modo, mismo orden siempre (driving, transit, walking). */
  modeOptions?: TransportModeOption[]
  /** Distancia a pie en metros, presente solo cuando hasRealDisplacement=true — para el resumen "X km a pie" de DayDetailPanel.tsx, sin tener que parsear distanceLabel. */
  meters?: number
  /** Minutos a pie, presente solo cuando hasRealDisplacement=true — para calcular la hora de inicio real de cada parada en DayDetailPanel.tsx, sin tener que parsear durationLabel. */
  walkMinutes?: number
}

const TEXT_ONLY_CONNECTORS = [
  'Después de instalarte, empieza la ruta por el centro.',
  'Tómate un respiro antes de seguir con la siguiente parada.',
  'Buen momento para parar a comer algo por la zona.',
]

function buildRealDisplacement(seed: string): ConnectorInfo {
  const rand = seededRandom(seed)
  const walkMinutes = 3 + Math.floor(rand() * 12)
  const meters = walkMinutes * (60 + Math.floor(rand() * 40))
  const driveMinutes = Math.max(2, Math.round(walkMinutes / 3.5))

  const modeOptions: TransportModeOption[] = [
    { mode: 'driving', durationLabel: `${driveMinutes} min`, distanceLabel: `${(meters / 1000).toFixed(1)} km` },
    { mode: 'walking', durationLabel: `${walkMinutes} min`, distanceLabel: `${meters} m` },
  ]

  return {
    hasRealDisplacement: true,
    transitSavesTime: false,
    label: `${walkMinutes} min a pie · ${meters} m`,
    modeOptions,
    meters,
    walkMinutes,
  }
}

/** `seedIndex` marca la posición del conector dentro del día — el primero (tras la llegada) siempre es de texto, sin desplazamiento que calcular, SALVO que se conozca el alojamiento de la noche anterior (ver `buildAccommodationConnectorInfo`, que sustituye a este cuando aplica). */
export function buildConnectorInfo(daySeed: string, seedIndex: number): ConnectorInfo {
  if (seedIndex === 0) {
    const rand = seededRandom(`${daySeed}-connector-0`)
    return { hasRealDisplacement: false, label: TEXT_ONLY_CONNECTORS[Math.floor(rand() * TEXT_ONLY_CONNECTORS.length)] }
  }

  return buildRealDisplacement(`${daySeed}-connector-${seedIndex}`)
}

function formatMeters(meters: number): string {
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${meters} m`
}

/**
 * Progresivo: refina un conector ya mostrado (el mock instantáneo de `buildConnectorInfo`, arriba)
 * con distancias/tiempos REALES de la Directions API de Mapbox, en cuanto ambas paradas tienen
 * coordenadas reales (paradas generadas por IA o añadidas a mano — nunca paradas de plantilla, que
 * llevan (0,0), ver hasRealCoordinates) — quien llama (DayDetailPanel.tsx) sigue enseñando el mock
 * hasta que esto resuelve y lo sustituye en su sitio, sin bloquear el render con un spinner.
 * Caminar y conducir son reales (dos perfiles de Mapbox); "transporte público" no tiene equivalente
 * real en la Directions API, así que se deriva del tiempo real en coche + un margen fijo de
 * espera/trasbordo — sigue siendo una estimación, pero ya no un número aleatorio sin relación con
 * el trayecto real. Devuelve null (el llamador se queda con el mock) si falta alguna coordenada
 * real o si la API falla.
 */
export async function refineConnectorWithRealDistance(fromCoords: Coordinates | undefined, toCoords: Coordinates | undefined, city?: string): Promise<ConnectorInfo | null> {
  if (!hasRealCoordinates(fromCoords) || !hasRealCoordinates(toCoords)) return null

  const [walking, driving] = await Promise.all([
    getRoutedDistance('walking', fromCoords, toCoords),
    getRoutedDistance('driving', fromCoords, toCoords),
  ])
  if (!walking || !driving) return null

  // El transporte público solo si existe una línea de verdad entre los dos sitios (con su número); el taxi siempre está en las opciones.
  const transit = city ? findTransitOption(city, fromCoords, toCoords) : null
  const transitSavesTime = Boolean(transit)

  const modeOptions: TransportModeOption[] = [
    { mode: 'driving', durationLabel: `${driving.minutes} min`, distanceLabel: formatMeters(driving.meters) },
    ...(transit ? [{ mode: 'transit' as const, durationLabel: `${transit.line} · ${transit.minutes} min`, distanceLabel: formatMeters(driving.meters), line: transit.line }] : []),
    { mode: 'walking', durationLabel: `${walking.minutes} min`, distanceLabel: formatMeters(walking.meters) },
  ]

  return {
    hasRealDisplacement: true,
    transitSavesTime,
    label: `${walking.minutes} min a pie · ${formatMeters(walking.meters)}`,
    modeOptions,
    meters: walking.meters,
    walkMinutes: walking.minutes,
  }
}

// ── Recomendación de comida/cena (Modo Hoy) ────────────────────

const MEAL_WINDOW_META: Record<'lunch' | 'dinner', { time: string; label: string }> = {
  lunch: { time: '13:30', label: 'Comida' },
  dinner: { time: '20:30', label: 'Cena' },
}

const CUISINES = ['Cocina local', 'Mediterránea', 'De mercado', 'Casera']
const RESTAURANT_NAME_TEMPLATES = ['Taberna de {city}', 'Bistró {city}', 'La Cocina de {city}']

/**
 * Recomendación de restaurante para Modo Hoy cuando `day.meals` todavía no tiene ninguno generado
 * por Claude para esta franja (rutas dev/preview) — mismo formato reducido que MealSection, solo
 * que sintetizado aquí en vez de venir del pipeline real. Determinista por día+franja.
 */
export function buildMockMealForWindow(day: DayPlan, window: 'lunch' | 'dinner'): MealSlot {
  const meta = MEAL_WINDOW_META[window]
  const rand = seededRandom(`${day.id}-meal-${window}`)
  const restaurants: Restaurant[] = RESTAURANT_NAME_TEMPLATES.slice(0, 2).map((template, index) => ({
    id: `${day.id}-meal-${window}-${index}`,
    name: template.replace('{city}', day.city),
    cuisine: CUISINES[Math.floor(rand() * CUISINES.length)],
    priceTier: rand() > 0.5 ? '€€' : '€',
    priceRange: rand() > 0.5 ? rangoImporte(15, 25, 'EUR') : rangoImporte(8, 15, 'EUR'),
  }))

  return {
    id: `${day.id}-meal-${window}-mock`,
    time: meta.time,
    label: meta.label,
    nearbyNote: 'Cerca de donde estás ahora.',
    restaurants,
    mealTime: window,
  }
}
