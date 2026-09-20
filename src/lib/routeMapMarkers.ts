import type { Coordinates, DayPlan } from './types'
import type { StopsMapMarker, StopsMapMarkerLine } from '../components/map/StopsMapView'
import { dayColor, dayColorPastel, dayColorStrong } from './dayColors'
import { hasRealCoordinates } from './distanceMock'

/** Opacidad de los PINES de un día NO activo en "Ver todo" (Ronda 9, Mejora 1C) — atenuado, nunca
    oculto, conservando el color propio del día en vez de neutralizarlo. Ronda 10: era 0.4, y a esa
    opacidad el número y su borde blanco prácticamente no se leían sobre el mapa — un pin que no se
    puede leer no aporta nada. Se compensa haciéndolos más PEQUEÑOS que los del día activo (ver
    `small` en StopsMapView), que es lo que de verdad distingue una cosa de otra de un vistazo. */
const DIMMED_MARKER_OPACITY = 0.85
/** Igual para las LÍNEAS de ruta de un día no activo — solo "un pelín" más fuertes que el 0.4
    anterior: la línea sí puede quedarse tenue (no hay nada que leer en ella) y el grosor ya la
    separa del día activo. */
const DIMMED_LINE_OPACITY = 0.55

/** Metros por debajo de los cuales 2 paradas se consideran "el mismo punto" a efectos de separar
    visualmente sus pines (Ronda 9, Mejora 1D) — p.ej. Fontana di Trevi como visita normal un día y
    como experiencia nocturna otro comparten coordenadas exactas. ~15m es sensiblemente menos que
    cualquier distancia real entre paradas distintas, así que no atrapa falsos positivos. */
const OVERLAP_METERS = 15
/** Separación aplicada a cada pin superpuesto adicional — ~12m en latitud, perceptible al nivel de
    zoom típico de este mapa (14-15) sin desplazar el pin a una manzana de distancia. */
const OFFSET_DEGREES = 0.00011

function metersBetween(a: Coordinates, b: Coordinates): number {
  const R = 6371000
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

/** Desplaza en círculo cada coordenada que caiga a menos de OVERLAP_METERS de una ya vista —
    determinista (mismo orden de entrada, mismo resultado), nunca se pierde ningún pin, solo se hace
    visible por separado. */
function spreadOverlappingCoords<T extends { coordinates: Coordinates }>(items: T[]): T[] {
  const seen: Coordinates[] = []
  return items.map((item) => {
    const collisions = seen.filter((c) => metersBetween(c, item.coordinates) < OVERLAP_METERS).length
    seen.push(item.coordinates)
    if (collisions === 0) return item
    const angle = (collisions * 2 * Math.PI) / 6
    return {
      ...item,
      coordinates: {
        lat: item.coordinates.lat + OFFSET_DEGREES * Math.cos(angle),
        lng: item.coordinates.lng + OFFSET_DEGREES * Math.sin(angle),
      },
    }
  })
}

function realStops(day: DayPlan) {
  return day.stops.filter((stop) => hasRealCoordinates(stop.coordinates))
}

/**
 * Marcadores de UN SOLO día — vista por defecto de DIAS (Ronda 9, Mejora 1A: antes el mapa mostraba
 * siempre todos los días a la vez, sin distinguir cuál se está mirando). Color propio del día
 * (dayColorPastel/dayColorStrong, mismo criterio que el círculo numerado de StopAccordion.tsx),
 * opacidad completa siempre — para eso es la vista "solo este día".
 */
export function buildSingleDayMarkers(day: DayPlan, dayIndex: number): StopsMapMarker[] {
  return realStops(day).map((stop, stopIndex) => ({
    id: stop.id,
    name: stop.name,
    coordinates: stop.coordinates,
    number: stopIndex + 1,
    bg: dayColorPastel(dayIndex),
    text: dayColorStrong(dayIndex),
    photoUrl: stop.photoUrl,
  }))
}

/** Línea recta uniendo las paradas de un día en orden — ver `buildSingleDayMarkers`. */
export function buildSingleDayLine(day: DayPlan, dayIndex: number): StopsMapMarkerLine[] {
  const coordinates = realStops(day).map((stop) => stop.coordinates)
  if (coordinates.length < 2) return []
  return [{ id: day.id, coordinates, color: dayColor(dayIndex), width: 3 }]
}

/**
 * Marcadores de TODOS los días del viaje a la vez ("Ver todo", Ronda 9 Mejora 1C — antes era el
 * ÚNICO modo que existía, ahora es el modo opcional), coloreados por día (mismo criterio que el
 * círculo numerado de cada parada en StopAccordion.tsx) — nunca solo el día activo (BLOQUE B,
 * feedback de calidad: "el mapa de DIAS solo marca un lugar"). `highlightDayId` es opcional: si se
 * da, los marcadores de ese día mantienen opacidad completa y el resto se atenúa (antes se
 * neutralizaban a gris — Ronda 9 Mejora 1C: mismo color del día, solo más tenue, para poder seguir
 * distinguiendo qué día es qué de un vistazo). Sin `highlightDayId`, todos los días se muestran a
 * opacidad completa. Los pines que comparten coordenadas casi exactas con otro día (p.ej. Fontana di
 * Trevi visitada un día y su versión nocturna otro) se separan ligeramente (Mejora 1D) para que
 * ambos colores sigan siendo visibles.
 */
export function buildCombinedDaysMarkers(days: DayPlan[], highlightDayId?: string | null): StopsMapMarker[] {
  const withDuplicatesFlat = days
    .filter((day) => !day.isReturnLeg)
    .flatMap((day, dayIndex) => {
      const isHighlighted = !highlightDayId || day.id === highlightDayId
      return realStops(day).map(
        (stop, stopIndex): StopsMapMarker => ({
          id: stop.id,
          name: stop.name,
          coordinates: stop.coordinates,
          number: stopIndex + 1,
          bg: dayColorPastel(dayIndex),
          text: dayColorStrong(dayIndex),
          photoUrl: stop.photoUrl,
          opacity: isHighlighted ? 1 : DIMMED_MARKER_OPACITY,
          small: !isHighlighted,
        }),
      )
    })
  return spreadOverlappingCoords(withDuplicatesFlat)
}

/** Líneas de ruta de todos los días a la vez — una por día, en su color, atenuada igual que sus
    pines cuando no es el día resaltado (ver `buildCombinedDaysMarkers`). El día activo se dibuja más
    grueso para que destaque sobre el resto. */
export function buildCombinedDaysLines(days: DayPlan[], highlightDayId?: string | null): StopsMapMarkerLine[] {
  return days
    .filter((day) => !day.isReturnLeg)
    .flatMap((day, dayIndex) => {
      const coordinates = realStops(day).map((stop) => stop.coordinates)
      if (coordinates.length < 2) return []
      const isHighlighted = !highlightDayId || day.id === highlightDayId
      return [{ id: day.id, coordinates, color: dayColor(dayIndex), opacity: isHighlighted ? 1 : DIMMED_LINE_OPACITY, width: isHighlighted ? 4 : 2.5 }]
    })
}
