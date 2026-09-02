import type { ExperienceId, Route, TripPace } from './types'
import { EXPERIENCE_BANK } from './experienceBank'
import { buildDestinationSegments } from './destinationSegments'
import type { MockStopDetail } from './mockDayDetail'

/**
 * Catálogo mock de lugares "candidatos" por destino — representa conceptualmente el pool del Paso
 * 3 del pipeline de generación (anclas + experiencias traducidas que no entraron en la ruta final)
 * y, a la vez, el catálogo completo que muestra la pestaña EXPLORAR. Mismo pool, mismo mecanismo de
 * inserción para ambos (ver StopPickerPanel.tsx / DayPositionPicker.tsx) — determinista por ciudad
 * (mismo seed ⇒ mismos resultados), sin llamada real a Claude todavía (mismo estado que el resto de
 * la app, ver mockDayDetail.ts/mockAffiliateData.ts).
 */
export interface PoolPlace {
  id: string
  name: string
  category: ExperienceId
  /** Motivo breve de por qué no entró en la ruta final — solo tiene sentido narrativo en el contexto del "+" entre paradas; EXPLORAR lo ignora. */
  reason: string
  photoUrl: string
}

function seededRandom(seed: string) {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return () => {
    h = (h * 1103515245 + 12345) >>> 0
    return (h % 1000) / 1000
  }
}

const REASONS = [
  'No había tiempo suficiente en esta ruta.',
  'Se solapaba con otra parada cercana en el itinerario.',
  'Quedaba un poco alejado del resto de paradas del día.',
  'Encajaba mejor como alternativa que como parada fija.',
]

const CATEGORY_TEMPLATES: Partial<Record<ExperienceId, string[]>> = {
  atracciones: ['Monumento histórico de {city}', 'Plaza principal de {city}', 'Torre emblemática de {city}'],
  gastronomia: ['Trattoria local de {city}', 'Mercado gastronómico de {city}', 'Bodega histórica de {city}'],
  paisajes_miradores: ['Mirador este de {city}', 'Terraza panorámica de {city}', 'Balcón de {city}'],
  joyas_ocultas: ['Callejón secreto de {city}', 'Patio escondido de {city}', 'Rincón poco conocido de {city}'],
  arte_cultura: ['Galería de arte contemporáneo de {city}', 'Centro cultural de {city}'],
  paseos_encanto: ['Barrio con encanto de {city}', 'Paseo junto al río de {city}'],
  ocio: ['Bar de coctelería de {city}', 'Zona de ambiente de {city}'],
  compras: ['Mercadillo vintage de {city}', 'Calle comercial de {city}'],
  naturaleza: ['Parque natural de {city}', 'Jardín botánico de {city}'],
}

const POOL_CATEGORIES = Object.keys(CATEGORY_TEMPLATES) as ExperienceId[]

/** ~2 candidatos por categoría del banco cubierta arriba (unos 14-16 en total), deterministas por ciudad. */
export function buildPoolForCity(city: string): PoolPlace[] {
  const rand = seededRandom(`pool-${city}`)
  const places: PoolPlace[] = []

  for (const category of POOL_CATEGORIES) {
    const templates = CATEGORY_TEMPLATES[category] ?? []
    templates.forEach((template, index) => {
      const id = `pool-${city}-${category}-${index}`
      places.push({
        id,
        name: template.replace('{city}', city),
        category,
        reason: REASONS[Math.floor(rand() * REASONS.length)],
        photoUrl: `https://picsum.photos/seed/${encodeURIComponent(id)}/300/200`,
      })
    })
  }

  return places
}

export function categoryLabel(category: ExperienceId): string {
  return EXPERIENCE_BANK.find((entry) => entry.id === category)?.title ?? category
}

export function categoryIcon(category: ExperienceId): string {
  return EXPERIENCE_BANK.find((entry) => entry.id === category)?.icon ?? '📍'
}

// ── Estado en la ruta (pestaña EXPLORAR / "Pool") ──────────────────────────

/** Id determinista del Stop que resultaría de añadir este lugar del pool — mismo id en todos los sitios que insertan desde el pool (PlaceFinderPanel, ExplorePanel...). */
export function stopIdForPoolPlace(place: PoolPlace): string {
  return `stop-${place.id}`
}

export interface PoolPlaceStatus extends PoolPlace {
  /** Presente solo si el lugar YA es un Stop real en algún día de la ruta. */
  location: { dayId: string; stopId: string } | null
  /** null cuando el lugar SÍ está en la ruta (no hace falta motivo). */
  reason: string | null
}

const PACE_LABEL: Record<TripPace, string> = { zen: 'ritmo tranquilo', balanced: 'ritmo equilibrado', nonstop: 'ritmo sin parar' }

/**
 * Motivo específico cuando se puede calcular a partir del contexto real de la ruta (ritmo elegido
 * + ciudad desde la que se llega a `city`, ej. "No entra con tu ritmo tranquilo desde Roma") — el
 * motivo genérico ya generado en `place.reason` sirve de respaldo cuando no hay ritmo conocido o
 * la ciudad no tiene una anterior (primer destino del viaje).
 */
function specificReason(route: Route, city: string): string | null {
  const pace = route.answers.pace
  if (!pace) return null
  const segments = buildDestinationSegments(route.days)
  const segmentIndex = segments.findIndex((segment) => segment.city === city)
  if (segmentIndex <= 0) return null
  const previousCity = segments[segmentIndex - 1].city
  if (previousCity === city) return null
  return `No entra con tu ${PACE_LABEL[pace]} desde ${previousCity}.`
}

/**
 * El pool de una ciudad, ya resuelto contra la ruta real: cada lugar sabe si ya es un Stop en
 * algún día (con dónde) o, si no, su motivo — específico cuando `specificReason` puede calcularlo,
 * el genérico determinista de siempre si no. Determinista por lugar (el mismo id de lugar siempre
 * cae en específico o genérico igual), para que no cambie de un render a otro.
 */
export function buildPoolStatusForCity(route: Route, city: string): PoolPlaceStatus[] {
  const stopLocations = new Map<string, { dayId: string; stopId: string }>()
  for (const day of route.days) {
    for (const stop of day.stops) {
      stopLocations.set(stop.id, { dayId: day.id, stopId: stop.id })
    }
  }

  return buildPoolForCity(city).map((place) => {
    const stopId = stopIdForPoolPlace(place)
    const location = stopLocations.get(stopId) ?? null
    if (location) return { ...place, location, reason: null }

    const rand = seededRandom(`${place.id}-reason-kind`)
    const specific = rand() > 0.4 ? specificReason(route, city) : null
    return { ...place, location: null, reason: specific ?? place.reason }
  })
}

const ATTRACTION_TIPS = [
  'Ve a primera hora o al final de la tarde — a mediodía suele llenarse de grupos.',
  'Consulta el horario actualizado antes de ir, sobre todo si viajas fuera de temporada alta.',
  'Merece la pena acercarse aunque solo sea para verlo por fuera, sin entrar.',
]

/**
 * Ficha de detalle para una tarjeta del Pool (ver EXPLORAR "Atracciones") — mismo formato
 * `MockStopDetail` que consume StopAccordion.tsx en DIAS (descripción, tips, sin tickets porque el
 * Pool no tiene ese dato, a diferencia de las plantillas de mockDayDetail.ts). Determinista por
 * lugar, contenido genérico pero coherente con su categoría.
 */
export function buildPoolPlaceDetail(place: PoolPlace): MockStopDetail {
  const rand = seededRandom(`${place.id}-detail`)
  const label = categoryLabel(place.category).toLowerCase()
  return {
    id: place.id,
    name: place.name,
    category: categoryLabel(place.category),
    hours: null,
    photoUrl: place.photoUrl,
    description: `${place.name} es una de las opciones de ${label} más recomendadas de la zona — vale la pena añadirlo a tu ruta si te encaja el hueco.`,
    tips: [ATTRACTION_TIPS[Math.floor(rand() * ATTRACTION_TIPS.length)]],
    purchase: null,
  }
}
