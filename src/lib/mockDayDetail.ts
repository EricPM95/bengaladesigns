import type { DayPlan, MealSlot, Restaurant, Stop } from './types'

/**
 * Contenido "rico" de un día en la pestaña DIAS — acordeón de llegada/vuelta y acordeones de
 * parada, con su sección de compra (entradas/tours). Todo mock por ahora (no hay integración real
 * de afiliación ni generación de Claude a nivel de parada) — determinista por `day.id` para que no
 * cambie en cada render. El día en que se conecte una API real, solo cambia el ORIGEN de estos
 * datos (esta forma de datos, `PlacePurchaseInfo`/`MockStopDetail`/`ArrivalDepartureDetail`, es la
 * que debe seguir consumiendo el componente visual).
 */

function seededRandom(seed: string) {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return () => {
    h = (h * 1103515245 + 12345) >>> 0
    return (h % 1000) / 1000
  }
}

// ── Llegada / vuelta ─────────────────────────────────────────

export interface TransitOption {
  name: string
  durationLabel: string
  /** Duración en minutos — para comparar contra el traslado privado y decidir el copy del CTA (ver buildPrivateTransferCta). */
  durationMinutes: number
  price: number
  /** Nº de trasbordos — 0 = directo. */
  transfers: number
  /** Parada/línea concreta SOLO cuando se conoce con fiabilidad (ej. "Termini") — si no, se omite, nunca se inventa. */
  stopName?: string
}

export interface HotelZoneDistance {
  zone: string
  durationLabel: string
  price?: number
  /** Parada/línea concreta SOLO cuando se conoce con fiabilidad (ej. "Línea A, parada Ottaviano") — si no, se omite. */
  stopName?: string
}

export interface AirportOption {
  code: string
  name: string
  transitOptions: TransitOption[]
  hotelZoneDistances: HotelZoneDistance[]
  /** Duración estimada del traslado privado, en minutos — usada solo para calcular el ahorro del CTA (ver buildPrivateTransferCta), nunca se muestra literal. */
  privateTransferMinutes: number
  tip: string
  officialLinkLabel: string
}

export interface ArrivalDepartureDetail {
  kind: 'arrival' | 'departure'
  cityName: string
  headline: string
  subtitle: string
  whyRecommendation: string
  disclaimer: string
  airports: AirportOption[]
}

/**
 * Copy persuasivo del CTA de traslado privado, adaptado al contexto real del trayecto — nunca un
 * texto fijo. Prioridad: hora de vuelo conocida y de madrugada > trayecto con trasbordos (mejor
 * para familias/equipaje) > ahorro de tiempo significativo (≥30 min) frente a la opción pública
 * más lenta > copy de confort genérico si ninguna de las anteriores aplica.
 */
export function buildPrivateTransferCta(transitOptions: TransitOption[], privateTransferMinutes: number, flightHour?: number | null): string {
  if (flightHour != null && (flightHour < 6 || flightHour >= 22)) {
    return 'Evita esperas de madrugada — te recogen a la hora exacta de tu vuelo'
  }

  const hasTransfers = transitOptions.some((option) => option.transfers > 0)
  if (hasTransfers) {
    return 'Ideal si vais en familia o con maletas — sin trasbordos, puerta a puerta'
  }

  const slowest = transitOptions.reduce((max, option) => (option.durationMinutes > max.durationMinutes ? option : max), transitOptions[0])
  const savedMinutes = slowest ? slowest.durationMinutes - privateTransferMinutes : 0
  if (slowest && savedMinutes >= 30) {
    const savedLabel = savedMinutes >= 60 ? `${Math.round((savedMinutes / 60) * 2) / 2}h` : `${savedMinutes} min`
    return `Ahorra ${savedLabel} frente a ${slowest.name.replace(/\s*\(.*\)$/, '')} — llegas directo`
  }

  return 'Viaja cómodo y sin esperas — te recogen y te llevan directo a tu alojamiento'
}

/** Únicos destinos con más de un aeropuerto conocido en este mock — el resto cae al genérico de un solo punto de llegada. */
const MULTI_AIRPORT_CITIES: Record<string, AirportOption[]> = {
  roma: [
    {
      code: 'FCO',
      name: 'Fiumicino',
      transitOptions: [
        { name: 'Leonardo Express (tren directo)', durationLabel: '32 min', durationMinutes: 32, price: 14, transfers: 0, stopName: 'Roma Termini' },
        { name: 'Tren regional FL1', durationLabel: '48 min', durationMinutes: 48, price: 8, transfers: 0, stopName: 'Roma Tiburtina' },
        { name: 'Autobús lanzadera', durationLabel: '55 min', durationMinutes: 55, price: 6, transfers: 0, stopName: 'Roma Termini' },
      ],
      hotelZoneDistances: [
        { zone: 'Centro histórico', durationLabel: '10 min a pie desde Termini', price: 0 },
        { zone: 'Trastevere', durationLabel: '15 min en tranvía', price: 1.5, stopName: 'Tranvía 8, parada Trastevere/Mastai' },
        { zone: 'Vaticano', durationLabel: '20 min en metro (línea A)', price: 1.5, stopName: 'Línea A, parada Ottaviano' },
      ],
      privateTransferMinutes: 25,
      tip: 'El billete del tren regional FL1 vale también para el metro/autobús durante 100 minutos desde la validación — no hace falta comprar otro para el último tramo hasta el hotel.',
      officialLinkLabel: 'Horarios y precios oficiales (Trenitalia)',
    },
    {
      code: 'CIA',
      name: 'Ciampino',
      transitOptions: [
        { name: 'Autobús directo a Termini', durationLabel: '40 min', durationMinutes: 40, price: 6, transfers: 0, stopName: 'Roma Termini' },
        { name: 'Autobús + metro', durationLabel: '55 min', durationMinutes: 55, price: 7.5, transfers: 1 },
      ],
      hotelZoneDistances: [
        { zone: 'Centro histórico', durationLabel: '10 min a pie desde Termini', price: 0 },
        { zone: 'Trastevere', durationLabel: '15 min en tranvía', price: 1.5, stopName: 'Tranvía 8, parada Trastevere/Mastai' },
        { zone: 'Vaticano', durationLabel: '20 min en metro (línea A)', price: 1.5, stopName: 'Línea A, parada Ottaviano' },
      ],
      privateTransferMinutes: 35,
      tip: 'Ciampino no tiene estación de tren propia — todas las opciones pasan por autobús hasta Termini, así que compra el billete combinado si vas a moverte más ese mismo día.',
      officialLinkLabel: 'Horarios y precios oficiales (Trenitalia)',
    },
  ],
}

function genericAirport(cityName: string): AirportOption {
  return {
    code: '',
    name: cityName,
    transitOptions: [
      { name: 'Tren/autobús directo al centro', durationLabel: '35-45 min', durationMinutes: 40, price: 10, transfers: 0 },
      { name: 'Taxi compartido', durationLabel: '25-30 min', durationMinutes: 28, price: 25, transfers: 0 },
    ],
    hotelZoneDistances: [
      { zone: 'Centro histórico', durationLabel: '10-15 min desde la estación principal', price: 1.5 },
      { zone: 'Zona de negocios/moderna', durationLabel: '15-20 min desde la estación principal', price: 1.5 },
    ],
    privateTransferMinutes: 30,
    tip: 'Guarda el billete hasta salir de la estación — en varias ciudades europeas hay controles aleatorios y la multa por no llevarlo es bastante más cara que el billete.',
    officialLinkLabel: 'Horarios y precios oficiales del operador local',
  }
}

export function buildArrivalDepartureDetail(cityName: string, originName: string, kind: 'arrival' | 'departure'): ArrivalDepartureDetail {
  const airports = MULTI_AIRPORT_CITIES[cityName.trim().toLowerCase()] ?? [genericAirport(cityName)]

  if (kind === 'arrival') {
    return {
      kind,
      cityName,
      headline: `Llegada a ${cityName}`,
      subtitle: `Cómo llegar al centro desde tu punto de entrada en ${cityName}`,
      whyRecommendation:
        'Recomendamos ir primero a la estación/punto principal de la ciudad porque es donde conecta el resto del transporte urbano (metro, tranvía, autobuses) — desde ahí, cualquier zona de alojamiento queda a un solo trasbordo.',
      disclaimer:
        'Esto no está ajustado a la hora exacta de tu vuelo — es la mejor forma de moverte una vez aterrices. Si añades tu vuelo en Reservas, podremos afinar los horarios.',
      airports,
    }
  }

  return {
    kind,
    cityName,
    headline: `Vuelta a ${originName}`,
    subtitle: `Cómo llegar a tu punto de salida en ${cityName} con margen de sobra`,
    whyRecommendation:
      'Igual que a la llegada, el punto de salida principal es donde conecta todo el transporte urbano — desde cualquier zona de alojamiento llegas con un solo trasbordo, sin depender de tráfico impredecible.',
    disclaimer:
      'Esto no está ajustado a la hora exacta de tu vuelo de vuelta — calcula tu margen sobre la hora de salida real. Si añades tu vuelo en Reservas, podremos afinar los horarios.',
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
  photoUrl: string
  description: string
  sections?: StopSection[]
  tips: string[]
  purchase: PlacePurchaseInfo | null
}

type StopTemplate = (city: string, rand: () => number) => MockStopDetail

const STOP_TEMPLATES: StopTemplate[] = [
  (city) => ({
    id: 'casco-historico',
    name: `Casco histórico de ${city}`,
    category: 'Paseo urbano',
    hours: null,
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

/** Convierte una parada real (`Stop`, añadida/editada por el usuario) en la forma rica que consume StopAccordion — sin tips ni sección de compra, ese contenido curado es exclusivo de las 6 plantillas fijas de arriba, no algo que un lugar recién añadido tenga. */
export function shellFromStop(stop: Stop): MockStopDetail {
  return {
    id: stop.id,
    name: stop.name,
    category: stop.categoryLabel ?? 'Añadido por ti',
    hours: null,
    photoUrl: stop.photoUrl,
    description: stop.description,
    tips: [],
    purchase: null,
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
  const templatePool = buildMockStopsForDay(day)
  if (day.stops.length === 0) return templatePool
  const richById = new Map(templatePool.map((stop) => [stop.id, stop]))
  return day.stops.map((stop) => richById.get(stop.id) ?? shellFromStop(stop))
}

/** "Cristaliza" el pool de plantilla en `Stop[]` reales — la primera vez que se edita algo en un día sin ediciones previas, para que la edición tenga algo real sobre lo que operar en el store. */
export function seedStopsFromTemplate(day: DayPlan): Stop[] {
  return buildMockStopsForDay(day).map((detail, index) => ({
    id: detail.id,
    time: `${String(9 + index).padStart(2, '0')}:00`,
    name: detail.name,
    description: detail.description,
    durationMinutes: 60,
    coordinates: { lat: 0, lng: 0 },
    photoUrl: detail.photoUrl,
  }))
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

export interface ConnectorInfo {
  hasRealDisplacement: boolean
  /** Solo cuando NO hay desplazamiento real — texto simple, sin icono ni selector de modo. */
  label: string
  /** Presente solo cuando hasRealDisplacement=true — una opción por modo, mismo orden siempre (driving, transit, walking). */
  modeOptions?: TransportModeOption[]
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
  const transitMinutes = Math.max(3, Math.round(walkMinutes * 0.6) + 4) // incluye espera media

  const modeOptions: TransportModeOption[] = [
    { mode: 'driving', durationLabel: `${driveMinutes} min`, distanceLabel: `${(meters / 1000).toFixed(1)} km` },
    { mode: 'transit', durationLabel: `${transitMinutes} min`, distanceLabel: `${(meters / 1000).toFixed(1)} km` },
    { mode: 'walking', durationLabel: `${walkMinutes} min`, distanceLabel: `${meters} m` },
  ]

  return {
    hasRealDisplacement: true,
    label: `${walkMinutes} min a pie · ${meters} m`,
    modeOptions,
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

/**
 * Conector que toca un alojamiento real (noche anterior → primera parada, o última parada → noche
 * de hoy) — sustituye al punto genérico del centro de la ciudad en cuanto se conoce el alojamiento.
 * `seed` debe incorporar el nombre del hotel (no solo el día) para que el resultado sea estable por
 * alojamiento, no solo por día — ver DayDetailPanel.tsx. Recálculo silencioso: nunca decide si este
 * conector se muestra o no (eso ya lo decide quien llama), solo genera su distancia/tiempo mock.
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
  }
}
