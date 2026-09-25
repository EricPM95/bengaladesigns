import type { Coordinates, DayPlan, MealSlot, Restaurant, Stop, ExperienceCategoryId } from './types'
import { hasRealCoordinates } from './distanceMock'
import { getRoutedDistance } from './mapboxDirections'
import { minutesToTime } from './time'

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
      taxiPriceLabel: '50-55€ (tarifa fija aeropuerto-centro)',
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
      taxiPriceLabel: '30-35€ (tarifa fija aeropuerto-centro)',
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
    taxiPriceLabel: '25-35€ orientativo',
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
  /** Ver Stop.tags en types.ts — píldoras de color en StopAccordion/StopDetailSheet (ver tagColors.ts). */
  tags?: string[]
  /** Ver Stop.scheduleText en types.ts. */
  scheduleText?: string | null
  /** Ver Stop.hoursCard / Stop.reservation en types.ts. */
  hoursCard?: string | null
  reservation?: string | null
  /** Ver Stop.hoursWarning en types.ts. */
  hoursWarning?: string | null
  /** Ver Stop.experience en types.ts. */
  experience?: ExperienceCategoryId | null
  /** Ver Stop.why en types.ts. */
  why?: string | null
  /** Ver Stop.ticketInfo en types.ts. */
  ticketInfo?: string[] | null
  /** Ver Stop.isRevisit — segunda visita al mismo sitio a otra hora, con su motivo. */
  isRevisit?: boolean
  revisitReason?: string
}

type StopTemplate = (city: string, rand: () => number) => MockStopDetail

const STOP_TEMPLATES: StopTemplate[] = [
  (city) => ({
    id: 'casco-historico',
    name: `Casco histórico de ${city}`,
    category: 'Paseo urbano',
    hours: null,
    durationMinutes: 120,
    photoUrl: `https://picsum.photos/seed/${encodeURIComponent(city)}-casco/600/400`,
    description: `El corazón antiguo de ${city} — calles estrechas, plazas con terrazas y la mejor forma de hacerse una idea de cómo vivía la ciudad antes de convertirse en destino turístico. Se recorre bien sin prisa, parando donde apetezca.`,
    tips: ['Ve a primera hora de la mañana o al atardecer — a mediodía se llena de grupos y pierde parte de la magia.'],
    purchase: {
      lugar: `Casco histórico de ${city}`,
      afiliacion_disponible: true,
      entradas: [],
      tours: [
        { nombre: 'Free tour a pie (propina voluntaria)', precio: 0, imagen: `https://picsum.photos/seed/${encodeURIComponent(city)}-freetour/300/200` },
        { nombre: 'Visita guiada en pequeño grupo', precio: 22, imagen: `https://picsum.photos/seed/${encodeURIComponent(city)}-guiada/300/200` },
      ],
    },
  }),
  (city) => ({
    id: 'catedral',
    name: `Catedral de ${city}`,
    category: 'Monumento religioso',
    hours: '09:00–19:00',
    durationMinutes: 60,
    photoUrl: `https://picsum.photos/seed/${encodeURIComponent(city)}-catedral/600/400`,
    description: `La catedral principal de ${city}, con siglos de historia superpuestos en su propia arquitectura. Merece la pena tanto por el interior (altares, vidrieras, cripta) como por las vistas desde su torre o cúpula.`,
    tips: ['La entrada a la torre/cúpula suele agotarse por franjas — resérvala con antelación si no quieres quedarte sin sitio.'],
    purchase: {
      lugar: `Catedral de ${city}`,
      afiliacion_disponible: true,
      entradas: [
        {
          nombre: 'Entrada general',
          nota: 'Acceso a la nave principal',
          precio: 5,
          imagen: `https://picsum.photos/seed/${encodeURIComponent(city)}-catedral-general/300/200`,
        },
        {
          nombre: 'Entrada + torre/cúpula',
          nota: 'Incluye subida con vistas panorámicas',
          precio: 12,
          imagen: `https://picsum.photos/seed/${encodeURIComponent(city)}-catedral-torre/300/200`,
        },
      ],
      tours: [{ nombre: 'Visita guiada con acceso a zonas restringidas', precio: 28, imagen: `https://picsum.photos/seed/${encodeURIComponent(city)}-catedral-tour/300/200` }],
    },
  }),
  (city) => ({
    id: 'museo-arte',
    name: `Museo de Arte de ${city}`,
    category: 'Museo de arte',
    hours: '10:00–18:00 (cerrado lunes)',
    durationMinutes: 120,
    photoUrl: `https://picsum.photos/seed/${encodeURIComponent(city)}-museo/600/400`,
    description: `Una de las colecciones de referencia de ${city}, con obras que abarcan varios siglos repartidas en salas temáticas. No hace falta ser experto en arte para disfrutarlo — el recorrido está pensado para que cada sala cuente una época distinta.`,
    sections: [
      {
        heading: 'Cómo verlo bien',
        body: 'Calcula 2 horas si quieres ver lo esencial, o media jornada si te gusta detenerte. Empieza por las salas del segundo piso (suelen tener menos gente a primera hora) y baja hacia la planta principal según avanza la mañana.',
      },
      {
        heading: 'Qué no te puedes perder',
        body: 'La sala central de la primera planta reúne las piezas más conocidas de la colección — es el punto donde más se llena a partir de las 12:00, así que si solo tienes tiempo para una sala, que sea esa y a primera hora.',
      },
    ],
    tips: [
      'La entrada combinada con otros museos de la ciudad suele salir más barata si vas a visitar más de uno — consúltalo en taquilla antes de comprar por separado.',
    ],
    purchase: {
      lugar: `Museo de Arte de ${city}`,
      afiliacion_disponible: true,
      entradas: [
        {
          nombre: 'Entrada general',
          nota: 'Acceso a la colección permanente',
          precio: 12,
          imagen: `https://picsum.photos/seed/${encodeURIComponent(city)}-museo-general/300/200`,
        },
        {
          nombre: 'Entrada sin colas',
          nota: 'Mismo acceso, evita la fila de taquilla',
          precio: 18,
          imagen: `https://picsum.photos/seed/${encodeURIComponent(city)}-museo-sincolas/300/200`,
        },
      ],
      tours: [{ nombre: 'Visita guiada temática (1h30)', precio: 25, imagen: `https://picsum.photos/seed/${encodeURIComponent(city)}-museo-tour/300/200` }],
    },
  }),
  (city) => ({
    id: 'mirador',
    name: `Mirador de ${city}`,
    category: 'Mirador panorámico',
    hours: null,
    durationMinutes: 45,
    photoUrl: `https://picsum.photos/seed/${encodeURIComponent(city)}-mirador/600/400`,
    description: `El mejor punto elevado de ${city} para ver la ciudad de un vistazo — especialmente recomendable al atardecer, cuando la luz baja da un color distinto a los tejados.`,
    tips: ['Llega unos 30 minutos antes de la puesta de sol para hacerte con un buen sitio sin agobios de última hora.'],
    purchase: null,
  }),
  (city, rand) => ({
    id: 'mercado',
    name: `Mercado Central de ${city}`,
    category: 'Mercado local',
    hours: '08:00–15:00',
    durationMinutes: 60,
    photoUrl: `https://picsum.photos/seed/${encodeURIComponent(city)}-mercado/600/400`,
    description: `Mercado de toda la vida donde compra parte de la propia ciudad — buena parada para probar producto local, desayunar algo distinto o simplemente ver el ritmo diario de ${city} sin filtro turístico.`,
    tips: ['Va perdiendo puestos abiertos según se acerca el mediodía — ve por la mañana si quieres verlo en su mejor momento.'],
    purchase: {
      lugar: `Mercado Central de ${city}`,
      afiliacion_disponible: false,
      entradas: rand() > 0.5 ? [{ nombre: 'Entrada', nota: 'Acceso libre al mercado', precio: 0 }] : [],
    },
  }),
  (city) => ({
    id: 'yacimiento',
    name: `Yacimiento arqueológico de ${city}`,
    category: 'Yacimiento arqueológico',
    hours: '09:00–17:00',
    durationMinutes: 90,
    photoUrl: `https://picsum.photos/seed/${encodeURIComponent(city)}-yacimiento/600/400`,
    description: `Restos arqueológicos que documentan la historia más antigua de ${city}, hoy integrados en el propio paisaje urbano. Un recorrido pausado permite reconstruir mentalmente cómo era la zona hace siglos.`,
    sections: [
      {
        heading: 'Cómo verlo bien',
        body: 'El recorrido señalizado dura entre 45 y 60 minutos — merece la pena seguir el orden marcado, ya que los paneles explicativos están pensados como una secuencia, no como puntos sueltos.',
      },
    ],
    tips: ['Hay poca sombra en todo el recorrido — evita ir en las horas centrales del día en verano.'],
    purchase: {
      lugar: `Yacimiento arqueológico de ${city}`,
      afiliacion_disponible: true,
      entradas: [
        {
          nombre: 'Entrada general',
          nota: 'Acceso al recorrido señalizado',
          precio: 10,
          imagen: `https://picsum.photos/seed/${encodeURIComponent(city)}-yacimiento-general/300/200`,
        },
        {
          nombre: 'Entrada + audioguía',
          nota: 'Incluye explicación punto por punto',
          precio: 16,
          imagen: `https://picsum.photos/seed/${encodeURIComponent(city)}-yacimiento-audio/300/200`,
        },
      ],
      tours: [{ nombre: 'Visita guiada con arqueólogo local', precio: 35, imagen: `https://picsum.photos/seed/${encodeURIComponent(city)}-yacimiento-tour/300/200` }],
    },
  }),
]

/** 2-3 paradas mock para este día, deterministas por `day.id` — vacío para el día sintético de vuelta (isReturnLeg). */
export function buildMockStopsForDay(day: DayPlan): MockStopDetail[] {
  if (day.isReturnLeg) return []

  const rand = seededRandom(day.id)
  const count = 2 + Math.floor(rand() * 2) // 2 o 3
  const indices = [...STOP_TEMPLATES.keys()]
  // Baraja determinista (Fisher-Yates con el mismo rand seedeado por día)
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[indices[i], indices[j]] = [indices[j], indices[i]]
  }

  return indices.slice(0, count).map((templateIndex) => {
    const detail = STOP_TEMPLATES[templateIndex](day.city, rand)
    return { ...detail, id: `${day.id}-${detail.id}` }
  })
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
    tags: stop.tags,
    scheduleText: stop.scheduleText,
    hoursCard: stop.hoursCard ?? null,
    reservation: stop.reservation ?? null,
    hoursWarning: stop.hoursWarning ?? null,
    experience: stop.experience ?? null,
    why: stop.why ?? null,
    ticketInfo: stop.ticketInfo ?? null,
    isRevisit: stop.isRevisit,
    revisitReason: stop.revisitReason,
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
 * Paradas a mostrar para un día — la plantilla mock por defecto MIENTRAS `day.stops` esté vacío
 * (nunca se ha editado nada todavía); en cuanto `day.stops` tiene contenido (tras cualquier
 * inserción/edición vía el "+" o el menú "..." de una parada, ver DayDetailPanel.tsx), pasa a ser
 * la fuente de verdad — conservando el contenido rico de las paradas de plantilla originales que
 * sigan presentes (mismo id) y usando un "shell" más simple para las nuevas.
 */
export function resolveDisplayStops(day: DayPlan): MockStopDetail[] {
  // Prompt 4: un día LIBRE está vacío a propósito — el viajero lo monta él. El pool de plantilla es
  // para días que aún no se han editado, no para días que se han vaciado queriendo.
  if (day.dayType === 'manual') return day.stops.map((stop) => shellFromStop(stop))
  const templatePool = buildMockStopsForDay(day)
  if (day.stops.length === 0) return templatePool
  const richById = new Map(templatePool.map((stop) => [stop.id, stop]))
  // La marca de revisita es dato de la RUTA, no de la plantilla: si la parada resuelve a su
  // versión rica, se le vuelve a pegar encima o se perdería el badge.
  return day.stops.map((stop) => {
    const rich = richById.get(stop.id)
    if (!rich) return shellFromStop(stop)
    return stop.isRevisit ? { ...rich, isRevisit: true, revisitReason: stop.revisitReason } : rich
  })
}

/** Minutos a pie entre paradas de plantilla cuando se cristalizan (sin coordenadas reales todavía, así que no hay conector real que consultar) — mismo valor de reserva que el resto del cálculo horario de la app, ver DEFAULT_WALK_MINUTES en DayDetailPanel.tsx. */
const TEMPLATE_WALK_GAP_MINUTES = 15

/**
 * "Cristaliza" el pool de plantilla en `Stop[]` reales — la primera vez que se edita algo en un día
 * sin ediciones previas, para que la edición tenga algo real sobre lo que operar en el store. La
 * hora de cada parada se acumula desde las 09:00 usando la duración REAL de su plantilla (antes
 * quedaba en franjas fijas de 1h por posición, "09:00, 10:00, 11:00...", ignorando que p. ej. un
 * museo dura 120 min) — así el horario no da un salto raro justo al hacer la primera edición de un
 * día, sea cual sea el sitio desde el que venía mostrándose (DayDetailPanel.tsx usa este mismo
 * cálculo mientras el día sigue siendo 100% plantilla).
 */
export function seedStopsFromTemplate(day: DayPlan): Stop[] {
  const details = buildMockStopsForDay(day)
  let cursor = 9 * 60
  return details.map((detail) => {
    const time = minutesToTime(cursor)
    cursor += detail.durationMinutes + TEMPLATE_WALK_GAP_MINUTES
    return {
      id: detail.id,
      time,
      name: detail.name,
      description: detail.description,
      durationMinutes: detail.durationMinutes,
      coordinates: { lat: 0, lng: 0 },
      photoUrl: detail.photoUrl,
      // El horario del lugar viaja con la parada. Sin esto, cristalizar un día lo borraba: la
      // tarjeta lo seguía enseñando (lo saca del pool de plantilla), pero todo lo que opera sobre
      // `Stop` —el aviso al reordenar, el menú, la ficha— veía `hours: undefined` y se quedaba
      // mudo sin dar ningún error.
      hours: detail.hours,
      scheduleText: detail.scheduleText ?? null,
      hoursCard: detail.hoursCard ?? null,
      reservation: detail.reservation ?? null,
      hoursWarning: detail.hoursWarning ?? null,
      experience: detail.experience ?? null,
      why: detail.why ?? null,
      ticketInfo: detail.ticketInfo ?? null,
      tags: detail.tags,
      isRevisit: detail.isRevisit,
      revisitReason: detail.revisitReason,
      isNightExperience: detail.isNightExperience,
    }
  })
}

// ── Conectores entre paradas ──────────────────────────────────

export type TransportMode = 'walking' | 'transit' | 'driving'

export const TRANSPORT_MODE_LABEL: Record<TransportMode, string> = {
  driving: 'Conducción',
  transit: 'Transporte público',
  walking: 'Caminar',
}

export interface TransportModeOption {
  mode: TransportMode
  durationLabel: string
  distanceLabel: string
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
  /** true si el transporte público ahorra tiempo real puerta a puerta (ver TRANSIT_MIN_SAVING_MINUTES):
      si no, el tramo va a pie y la opción de transporte no se enseña. */
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
  const transitMinutes = transitDoorToDoorMinutes(driveMinutes)
  const transitSavesTime = walkMinutes - transitMinutes >= TRANSIT_MIN_SAVING_MINUTES

  const modeOptions: TransportModeOption[] = [
    { mode: 'driving', durationLabel: `${driveMinutes} min`, distanceLabel: `${(meters / 1000).toFixed(1)} km` },
    ...(transitSavesTime ? [{ mode: 'transit' as const, durationLabel: `${transitMinutes} min`, distanceLabel: `${(meters / 1000).toFixed(1)} km` }] : []),
    { mode: 'walking', durationLabel: `${walkMinutes} min`, distanceLabel: `${meters} m` },
  ]

  return {
    hasRealDisplacement: true,
    transitSavesTime,
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
export async function refineConnectorWithRealDistance(fromCoords: Coordinates | undefined, toCoords: Coordinates | undefined): Promise<ConnectorInfo | null> {
  if (!hasRealCoordinates(fromCoords) || !hasRealCoordinates(toCoords)) return null

  const [walking, driving] = await Promise.all([
    getRoutedDistance('walking', fromCoords, toCoords),
    getRoutedDistance('driving', fromCoords, toCoords),
  ])
  if (!walking || !driving) return null

  const transitMinutes = transitDoorToDoorMinutes(driving.minutes)
  const transitSavesTime = walking.minutes - transitMinutes >= TRANSIT_MIN_SAVING_MINUTES

  const modeOptions: TransportModeOption[] = [
    { mode: 'driving', durationLabel: `${driving.minutes} min`, distanceLabel: formatMeters(driving.meters) },
    ...(transitSavesTime ? [{ mode: 'transit' as const, durationLabel: `${transitMinutes} min`, distanceLabel: formatMeters(driving.meters) }] : []),
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

/**
 * Conector que toca un alojamiento real (noche anterior → primera parada, o última parada → noche
 * de hoy) — sustituye al punto genérico del centro de la ciudad en cuanto se conoce el alojamiento.
 * `seed` debe incorporar el nombre del hotel (no solo el día) para que el resultado sea estable por
 * alojamiento, no solo por día — ver DayDetailPanel.tsx. Recálculo silencioso: nunca decide si este
 * conector se muestra o no (eso ya lo decide quien llama), solo genera su distancia/tiempo mock.
 *
 * A diferencia de `buildConnectorInfo` (parada↔parada), este SIEMPRE se queda en mock — los
 * hoteles (`mockAffiliateData.ts`) son 100% ficticios (nombres de plantilla, sin integración real
 * de Booking/Expedia todavía) y no llevan coordenadas propias, así que no hay ninguna ubicación
 * real a la que pedirle una ruta a Mapbox. El día que haya alojamiento real con coordenadas, esto
 * puede refinarse igual que `refineConnectorWithRealDistance`.
 */
export function buildAccommodationConnectorInfo(seed: string): ConnectorInfo {
  return buildRealDisplacement(seed)
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
    priceRange: rand() > 0.5 ? '15-25€' : '8-15€',
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
