import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Coordinates, Excursion, Route, Stop } from '../../../lib/types'
import type { DestinationPlace } from '../../../lib/destinationPlacesApi'
import {
  PLACE_FILTER_CHIPS,
  RESTAURANT_SUB_CATEGORIES,
  categoriesForFilters,
  findPlaceCategoryChip,
  findRestaurantSubCategory,
  type PlaceCategoryChip,
  type PlaceFilterId,
  type RestaurantSubCategory,
} from '../../../lib/placeCategories'
import { fetchPlaceLikes, togglePlaceLike, EMPTY_PLACE_LIKES, type PlaceLikes } from '../../../lib/placeLikesApi'
import { fetchPlacePhoto } from '../../../lib/placePhoto'
import { buildRouteStopEntries, isNameAlreadyInRoute } from '../../../lib/routeStopsIndex'
import { haversineMeters, hasRealCoordinates } from '../../../lib/distanceMock'
import { formatDuration } from '../../../lib/format'
import { StopsMapView, type StopsMapMarker } from '../../map/StopsMapView'
import { StopDetailSheet, type DayStopRef } from '../dayDetail/StopDetailSheet'
import { RestaurantDetailSheet } from './RestaurantDetailSheet'
import { Spinner } from '../../ui/Spinner'
import { CIVITATIS_RED } from '../../../lib/affiliateLinks'

const EXCURSION_CHIP = PLACE_FILTER_CHIPS.find((chip) => chip.id === 'excursiones') ?? null

/** Por encima de esta distancia el "a N min a pie" deja de tener sentido (el viajero todavía no está
    en la ciudad) y se muestra la distancia en kilómetros. */
const WALKABLE_METERS = 2500
const METERS_PER_WALKING_MINUTE = 80

type BottomTab = 'recommended' | 'nearby'
type GeoStatus = 'idle' | 'asking' | 'ready' | 'denied'

interface PlaceExplorerScreenProps {
  open: boolean
  /** Ciudad del catálogo curado — la misma clave con la que se pidió el pool y con la que se guardan los likes. */
  destination: string
  /** Catálogo completo del destino (ver useDestinationPool) — este componente no lo pide, lo recibe ya cargado. */
  places: DestinationPlace[]
  title: string
  subtitle?: string | null
  /** Paradas ya existentes del día, numeradas igual que en DIAS — contexto en el mapa. Vacío desde EXPLORAR (no se está mirando ningún día concreto). */
  dayMarkers?: StopsMapMarker[]
  /** Solo para el texto del CTA "Añadir a Día N" y la ficha; null desde EXPLORAR. */
  dayNumber?: number | null
  dateIso?: string | null
  /** Ruta actual — solo para marcar "En tu ruta" en la lista. */
  route?: Route | null
  /** Filtros ya activos al abrir — EXPLORAR entra con el suyo puesto; el "+" de DIAS entra sin ninguno. */
  initialFilters?: PlaceFilterId[]
  /** Las excursiones del destino, para el filtro "Excursiones" (ver useDestinationPool). Vacío en un
      destino sin catálogo curado — el chip entonces ni se pinta. */
  excursions?: Excursion[]
  /** Precarga el buscador con este texto al abrir — lo usa el botón "Añadir como parada" de una tarjeta de segunda visita recomendada, para que el lugar ya salga sin tener que escribirlo. */
  initialQuery?: string
  /** Presente = modo "añadir": la ficha del lugar muestra el CTA "Añadir a mi ruta". Ausente = solo explorar. */
  onPick?: (stop: Stop) => void
  onClose: () => void
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
}

function formatDistance(meters: number): string {
  if (meters <= WALKABLE_METERS) return `a ${formatDuration(Math.max(1, Math.round(meters / METERS_PER_WALKING_MINUTE)))} a pie`
  return `a ${(meters / 1000).toFixed(1)} km`
}

function placeholderPhoto(name: string): string {
  return `https://picsum.photos/seed/${encodeURIComponent(name)}/600/400`
}

function stopFromPlace(place: DestinationPlace, photoUrl: string): Stop {
  const chip = findPlaceCategoryChip(place.filter_category)
  return {
    id: `stop-pool-${normalize(place.name).replace(/\s+/g, '-')}-${Date.now()}`,
    // Hora de relleno: la posición real en el día se la da el store al insertarla, que es quien
    // recalcula SOLO el tramo con la parada anterior y redondea al cuarto más cercano (ver
    // timeForStopAfter en useRouteStore.ts). Desde aquí no sabemos dónde va a caer.
    time: '12:00',
    name: place.name,
    description: 'Añadido por ti',
    categoryLabel: chip?.label ?? place.type ?? 'Lugar',
    durationMinutes: place.duration_min ?? 60,
    coordinates: place.coordinates,
    photoUrl,
    hours: place.schedule,
    scheduleText: place.schedule,
    tags: place.tags,
  }
}

/**
 * Prompt 3 (bug 3): el buscador mira SOLO el catálogo curado del destino, nunca la búsqueda de POIs
 * de Mapbox — que devuelve los nombres en inglés ("Colosseum"), busca en todo el mundo y encuentra
 * fatal los monumentos. Cuatro niveles, de más a menos literal: empieza por el nombre, empieza por
 * un alias, lo contiene el nombre, lo contiene un alias. Los alias (ver `search_aliases` en el JSON
 * del destino) son los que hacen que valgan el nombre en italiano, el inglés, la forma corta y el
 * nombre que el lugar tenía antes del renombrado a español.
 */
function searchScore(place: DestinationPlace, needle: string): number {
  const name = normalize(place.name)
  if (name.startsWith(needle)) return 100
  const aliases = (place.search_aliases ?? []).map(normalize)
  if (aliases.some((alias) => alias.startsWith(needle))) return 90
  if (name.includes(needle)) return 70
  if (aliases.some((alias) => alias.includes(needle))) return 60
  return 0
}

/** Mínimo de letras antes de buscar: con una sola, media ciudad coincide y la lista no dice nada. */
const MIN_QUERY_LENGTH = 2
const SEARCH_DEBOUNCE_MS = 150
const MAX_SEARCH_RESULTS = 8

/**
 * Prompt 3 (bug 2): foto real del lugar en vez del icono genérico de categoría — se reconoce de un
 * vistazo y anima a puntuar. Sale del mismo sitio que las fotos de las paradas (Wikipedia en
 * español por nombre, ver placePhoto.ts, que ya cachea por nombre+ciudad para toda la sesión).
 *
 * La foto se pide solo cuando la fila ENTRA EN PANTALLA: el catálogo de un destino son 100+ lugares
 * y resolverlos todos al abrir serían 100 llamadas a Wikipedia para ver ocho. Si no hay foto (o
 * Wikipedia falla, o tarda), se queda el icono de categoría de siempre — nunca un hueco vacío.
 */
function PlaceThumb({ name, city, chip, wikipediaTitle }: { name: string; city: string; chip: PlaceCategoryChip | null; wikipediaTitle?: string | null }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [inView, setInView] = useState(false)
  const [photo, setPhoto] = useState<string | null>(null)

  useEffect(() => {
    if (inView || !ref.current) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) setInView(true)
      },
      // Margen generoso: la foto empieza a cargarse justo antes de que la fila asome, para que no
      // se vea el salto de icono a foto mientras se hace scroll.
      { rootMargin: '200px' },
    )
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [inView])

  useEffect(() => {
    if (!inView) return
    let cancelled = false
    fetchPlacePhoto(name, city, wikipediaTitle).then((url) => {
      if (!cancelled) setPhoto(url)
    })
    return () => {
      cancelled = true
    }
  }, [inView, name, city, wikipediaTitle])

  return (
    <span
      ref={ref}
      className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg text-xl"
      style={{ backgroundColor: chip?.activeBg ?? 'rgb(var(--bg-hover))' }}
      aria-hidden="true"
    >
      {photo ? (
        <img
          src={photo}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover"
          // Wikipedia puede devolver una URL que luego no carga (imagen retirada, hotlink
          // bloqueado). Sin esto quedaría un cuadro vacío, que es peor que el icono de categoría.
          onError={() => setPhoto(null)}
        />
      ) : (
        (chip?.icon ?? '📍')
      )}
    </span>
  )
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0">
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

/** Corazón de "me gusta": trazo fino y gris sin relleno mientras no se ha pulsado; relleno solo
    cuando ESTE viajero ya le ha dado like, que es lo único que el relleno debe significar. */
function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 shrink-0"
    >
      <path d="M12 20s-7-4.6-7-9.3A4.2 4.2 0 0 1 12 8a4.2 4.2 0 0 1 7 2.7C19 15.4 12 20 12 20Z" />
    </svg>
  )
}

function LocationIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-text-muted">
      <path d="M12 21s-7-6.1-7-11a7 7 0 0 1 14 0c0 4.9-7 11-7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  )
}

/** Trazo fino y gris, sin relleno — regla de iconos funcionales del proyecto. */
function TicketIcon({ className = 'h-3 w-3' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 9.5V7a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v2.5a2.5 2.5 0 0 0 0 5V17a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-2.5a2.5 2.5 0 0 0 0-5Z" />
      <path d="M14 6v2M14 11v2M14 16v2" />
    </svg>
  )
}

/**
 * Una excursión en la lista de resultados. NO es una parada: no se puede añadir a un día (un día
 * entero fuera de la ciudad no cabe en un hueco de la tarde), no tiene ficha ampliada y no se le
 * puede dar like. Lo único que hace es contar de qué va y mandar a reservarla fuera.
 *
 * Precio y valoración son PLACEHOLDER del JSON del destino hasta integrar Civitatis/GYG — por eso
 * el precio va como "desde" y nunca como tarifa cerrada.
 */
function ExcursionResultCard({ excursion, open, onToggle }: { excursion: Excursion; open: boolean; onToggle: () => void }) {
  return (
    <div className={`rounded-xl border transition-colors ${open ? 'border-accent bg-accent-soft' : 'border-border'}`}>
      <button type="button" onClick={onToggle} aria-expanded={open} className="flex w-full items-center gap-3 p-2.5 text-left">
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-xl"
          style={{ backgroundColor: EXCURSION_CHIP?.activeBg ?? '#E0F2F1' }}
          aria-hidden="true"
        >
          {excursion.emoji ?? EXCURSION_CHIP?.icon ?? '🚌'}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-small font-semibold text-text">{excursion.title}</span>
          <span className="flex flex-wrap items-center gap-x-1.5 text-caption text-text-soft">
            <span className="shrink-0">{excursion.durationLabel}</span>
            {excursion.priceLabel && (
              <>
                <span>·</span>
                <span className="shrink-0">desde {excursion.priceLabel}</span>
              </>
            )}
            {excursion.rating !== undefined && (
              <>
                <span>·</span>
                <span className="shrink-0">
                  ★ {excursion.rating.toFixed(1)}
                  {excursion.reviewCount ? ` (${excursion.reviewCount.toLocaleString('es-ES')})` : ''}
                </span>
              </>
            )}
          </span>
        </span>
      </button>

      {open && (
        <div className="space-y-2 px-2.5 pb-2.5">
          {excursion.description && <p className="text-caption leading-relaxed text-text-soft">{excursion.description}</p>}
          {excursion.bookUrl && (
            <a
              href={excursion.bookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full rounded-xl py-2 text-center text-small font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: CIVITATIS_RED }}
            >
              Ver en Civitatis
            </a>
          )}
          <p className="text-caption text-text-muted">Precio orientativo: se reserva fuera de la app.</p>
        </div>
      )}
    </div>
  )
}

/**
 * Pantalla compartida de lugares del destino — mapa del día arriba con filtros por categoría, y
 * tirador abajo con buscador, "Recomendados"/"Cerca de ti" y la lista de resultados.
 *
 * La usan los DOS sitios donde el viajero busca un lugar concreto del destino: el "+" de DIAS (con
 * `onPick`, que lo añade a la ruta) y EXPLORAR (sin `onPick` y con los filtros ya puestos, solo
 * consulta). Es el mismo componente a propósito: eran dos buscadores distintos, con resultados
 * distintos, para la misma pregunta.
 *
 * Solo se usa en destinos con catálogo curado (`places`): el pool es el JSON del destino, no una
 * búsqueda de POIs de Mapbox. Los destinos sin catálogo siguen con AddStopScreen/AttractionsFinder,
 * que buscan contra Mapbox y funcionan en cualquier ciudad.
 */
export function PlaceExplorerScreen({
  open,
  destination,
  places,
  title,
  subtitle,
  dayMarkers = [],
  dayNumber = null,
  dateIso = null,
  route = null,
  initialFilters = [],
  excursions = [],
  initialQuery,
  onPick,
  onClose,
}: PlaceExplorerScreenProps) {
  const [activeFilters, setActiveFilters] = useState<PlaceFilterId[]>(initialFilters)
  /** La excursión abierta en su tarjeta. No usa `selected` (que es un lugar del catálogo) porque no
      comparte nada con él: no tiene ficha ampliada, ni likes, ni "Añadir a mi ruta". */
  const [selectedExcursion, setSelectedExcursion] = useState<Excursion | null>(null)
  /** null = "Todos" (la sub-categoría es excluyente: una o ninguna). Solo aplica a restaurantes. */
  const [activeSubCategory, setActiveSubCategory] = useState<RestaurantSubCategory | null>(null)
  const [query, setQuery] = useState(initialQuery ?? '')
  const [tab, setTab] = useState<BottomTab>('recommended')
  const [likes, setLikes] = useState<PlaceLikes>(EMPTY_PLACE_LIKES)
  const [selected, setSelected] = useState<DestinationPlace | null>(null)
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)
  const [position, setPosition] = useState<Coordinates | null>(null)
  const [geoStatus, setGeoStatus] = useState<GeoStatus>('idle')
  const chipsRowRef = useRef<HTMLDivElement>(null)

  const initialFiltersKey = initialFilters.join(',')

  // EXPLORAR entra con un filtro ya puesto, y en móvil los chips no caben: "Restaurantes" es el
  // cuarto y se queda fuera de la pantalla, así que se veían tres chips apagados y una lista
  // filtrada sin explicación visible. Al abrir, el chip activo se trae a la vista.
  useEffect(() => {
    if (!open) return
    const active = chipsRowRef.current?.querySelector('[data-active="true"]')
    active?.scrollIntoView({ block: 'nearest', inline: 'center' })
  }, [open, initialFiltersKey])

  useEffect(() => {
    if (!open) return
    setActiveFilters(initialFiltersKey ? (initialFiltersKey.split(',') as PlaceFilterId[]) : [])
    setActiveSubCategory(null)
    setQuery(initialQuery ?? '')
    setTab('recommended')
    setSelected(null)
    setSelectedExcursion(null)
    setSelectedPhoto(null)
  }, [open, initialFiltersKey, initialQuery])

  useEffect(() => {
    if (!open) return
    let cancelled = false
    fetchPlaceLikes(destination).then((found) => {
      if (!cancelled) setLikes(found)
    })
    return () => {
      cancelled = true
    }
  }, [open, destination])

  // La ubicación se pide SOLO al entrar en "Cerca de ti", nunca al abrir la pantalla: el permiso del
  // navegador es una interrupción, y pedirlo sin que el viajero haya pedido nada cercano es justo lo
  // que hace que lo deniegue para siempre.
  useEffect(() => {
    if (!open || tab !== 'nearby' || position || geoStatus === 'asking' || geoStatus === 'denied') return
    if (!navigator.geolocation) {
      setGeoStatus('denied')
      return
    }
    setGeoStatus('asking')
    navigator.geolocation.getCurrentPosition(
      (result) => {
        setPosition({ lat: result.coords.latitude, lng: result.coords.longitude })
        setGeoStatus('ready')
      },
      () => setGeoStatus('denied'),
      { timeout: 8000, maximumAge: 5 * 60 * 1000 },
    )
  }, [open, tab, position, geoStatus])

  // Foto real (Wikipedia) solo del lugar abierto, no de los 61 de la lista: la lista usa el icono de
  // su categoría, que se pinta al instante y no gasta 61 peticiones cada vez que se abre la pantalla.
  useEffect(() => {
    // Los restaurantes no pasan por aquí: su ficha no lleva foto, y Wikipedia no tiene página de una
    // trattoria — lo que devolvería sería una foto de otra cosa.
    if (!selected || selected.kind === 'restaurant') return
    let cancelled = false
    setSelectedPhoto(null)
    fetchPlacePhoto(selected.name, destination).then((url) => {
      if (!cancelled && url) setSelectedPhoto(url)
    })
    return () => {
      cancelled = true
    }
  }, [selected, destination])

  const stopEntries = useMemo(() => (route ? buildRouteStopEntries(route) : []), [route])

  const toggleFilter = (id: PlaceFilterId) => {
    setActiveFilters((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
      // Al apagar Restaurantes su sub-filtro deja de tener sentido (y de verse): si se volviera a
      // encender, seguir arrastrando "Gelato" de hace dos pantallas sería una lista vacía sin motivo
      // aparente.
      if (id === 'restaurantes' && !next.includes('restaurantes')) setActiveSubCategory(null)
      // Al apagar Excursiones se cierra la tarjeta que hubiera abierta: si no, se queda una
      // excursión encima de una lista que ya no la contiene.
      if (id === 'excursiones' && !next.includes('excursiones')) setSelectedExcursion(null)
      return next
    })
  }

  const restaurantsActive = activeFilters.includes('restaurantes')
  // "Entradas" no es una categoría sino una propiedad: no sustituye a las demás, las acota. Con
  // "Atracciones + Entradas" salen las atracciones de pago; ella sola, todo lo que cobra entrada.
  const ticketsActive = activeFilters.includes('entradas')
  const excursionsActive = activeFilters.includes('excursiones')
  const activeCategories = categoriesForFilters(activeFilters)
  // Solo-Excursiones no es "ningún filtro": el catálogo de lugares tiene que quedarse vacío, o
  // saldrían los 67 pines de Roma debajo de las 6 excursiones.
  const placeFiltersActive = activeCategories.length > 0 || ticketsActive
  const trimmedQuery = query.trim()

  // Se busca sobre el texto ya reposado, no sobre cada tecla: reordenar y volver a pintar la lista
  // (y con ella los pines del mapa) en cada pulsación se notaba al escribir.
  const [debouncedQuery, setDebouncedQuery] = useState(trimmedQuery)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(trimmedQuery), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [trimmedQuery])
  const needle = debouncedQuery.length >= MIN_QUERY_LENGTH ? normalize(debouncedQuery) : null
  const queryTooShort = trimmedQuery.length > 0 && trimmedQuery.length < MIN_QUERY_LENGTH

  const results = useMemo(() => {
    // La sub-categoría solo filtra restaurantes: con "Monumentos + Restaurantes + Pizza" activos, los
    // monumentos siguen enteros y son las pizzerías las que se acotan.
    const matchesSubCategory = (place: DestinationPlace) =>
      place.kind !== 'restaurant' || activeSubCategory === null || place.sub_category === activeSubCategory

    // Buscar por nombre IGNORA los chips de categoría a propósito: quien escribe "coli" quiere el
    // Coliseo, y que no apareciera por tener activo solo "Restaurantes" se lee como que la app no lo
    // tiene. Los chips acotan lo que se explora, no lo que se busca por su nombre.
    // Ordenado por lo bien que encaja el texto (ver searchScore) y recortado — ocho resultados es lo
    // que se puede elegir de un vistazo.
    if (needle) {
      return places
        .map((place) => ({ place, score: searchScore(place, needle) }))
        .filter((entry) => entry.score > 0)
        .sort((a, b) => b.score - a.score || a.place.name.localeCompare(b.place.name, 'es'))
        .slice(0, MAX_SEARCH_RESULTS)
        .map((entry) => entry.place)
    }
    if (queryTooShort) return []
    // Solo "Excursiones" activo: la lista es únicamente de excursiones. Sin esto caería en el caso
    // de "ningún filtro de lugares", que enseña el catálogo entero — los 67 lugares de Roma colgando
    // debajo de las 6 excursiones, como si fueran resultados de lo que se ha pedido.
    if (excursionsActive && !placeFiltersActive) return []

    const filtered = places.filter(
      (place) =>
        matchesSubCategory(place) &&
        (activeCategories.length === 0 || (place.filter_category !== null && activeCategories.includes(place.filter_category))) &&
        // "Entradas" acota, no sustituye: se cruza con lo que ya hubiera activo (ver ticketsActive).
        (!ticketsActive || place.requires_ticket),
    )

    if (tab === 'nearby') {
      if (!position) return filtered
      return [...filtered].sort((a, b) => haversineMeters(position, a.coordinates) - haversineMeters(position, b.coordinates))
    }

    // Recomendados: los más votados primero. Sin likes todavía (o con empate) manda el nivel curado
    // del destino, que es exactamente "lo imprescindible primero" — nunca un orden arbitrario.
    return [...filtered].sort((a, b) => {
      const likeDiff = (likes.counts.get(b.name) ?? 0) - (likes.counts.get(a.name) ?? 0)
      if (likeDiff !== 0) return likeDiff
      const levelDiff = (a.level ?? 9) - (b.level ?? 9)
      if (levelDiff !== 0) return levelDiff
      // Sin nivel curado (los restaurantes) manda el orden del JSON, que es editorial; el alfabético
      // solo entra donde no hay ni una cosa ni la otra.
      if (a.order !== undefined && b.order !== undefined) return a.order - b.order
      return a.name.localeCompare(b.name, 'es')
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [places, needle, queryTooShort, activeFilters, activeSubCategory, tab, position, likes])

  // Prompt 3 (bug 1): el mapa recibe SIEMPRE el catálogo entero, pase lo que pase con los filtros,
  // y lo que cambia al marcar un chip es únicamente qué pines están ocultos. Antes se le pasaba solo
  // el subconjunto visible, y como StopsMapView se reconstruye entero cuando cambia el conjunto de
  // marcadores, cada chip reseteaba la cámara: nuevo fitBounds, nuevo zoom, el mapa saltando bajo el
  // dedo. Ahora la vista del viajero no se toca y los pines entran y salen con un fundido.
  // Más pequeños que los números de las paradas del día, para que la ruta siga destacando.
  const poiPlaces = useMemo(() => places.filter((place) => hasRealCoordinates(place.coordinates)), [places])

  /** A dónde se va en cada excursión — Pompeya, Tívoli… Fuera de la ciudad, así que el mapa se abre
      mucho cuando se encienden: es justo la información ("esto es un día entero de viaje"). */
  const excursionMarkers: StopsMapMarker[] = useMemo(
    () =>
      excursions
        .filter((excursion) => excursion.destinationCoords)
        .map((excursion) => ({
          id: `excursion-${excursion.id}`,
          name: excursion.title,
          coordinates: excursion.destinationCoords as Coordinates,
          number: 0,
          icon: EXCURSION_CHIP?.icon ?? '🚌',
          bg: EXCURSION_CHIP?.color ?? '#00897B',
          text: '#FFFFFF',
          small: true,
        })),
    [excursions],
  )

  const markers: StopsMapMarker[] = useMemo(() => {
    const poiMarkers: StopsMapMarker[] = poiPlaces.map((place) => {
      const chip = findPlaceCategoryChip(place.filter_category)
      return {
        id: `poi-${place.name}`,
        name: place.name,
        coordinates: place.coordinates,
        number: 0,
        icon: chip?.icon ?? '📍',
        bg: chip?.color ?? '#6B7280',
        text: '#FFFFFF',
        small: true,
      }
    })
    return [...dayMarkers, ...poiMarkers, ...excursionMarkers]
  }, [dayMarkers, poiPlaces, excursionMarkers])

  /** Nombres que SÍ se ven en el mapa ahora mismo — mismo criterio que la lista: sin ningún filtro
      ni búsqueda, el mapa no enseña el catálogo entero, solo las paradas del día; durante una
      búsqueda enseña lo encontrado, aunque los chips activos no lo incluyan. */
  const visiblePoiNames = useMemo(() => {
    const shown = needle || placeFiltersActive ? results : []
    return new Set(shown.map((place) => place.name))
  }, [results, needle, placeFiltersActive])

  const hiddenMarkerIds = useMemo(
    () => [
      ...poiPlaces.filter((place) => !visiblePoiNames.has(place.name)).map((place) => `poi-${place.name}`),
      // Mismo truco que con los lugares (Prompt 3): los pines de excursión están SIEMPRE en el mapa
      // y lo que cambia al marcar el chip es solo cuáles se ven — así la cámara no se resetea.
      ...(excursionsActive ? [] : excursionMarkers.map((marker) => marker.id)),
    ],
    [poiPlaces, visiblePoiNames, excursionsActive, excursionMarkers],
  )
  const visibleMarkerCount = dayMarkers.length + visiblePoiNames.size + (excursionsActive ? excursionMarkers.length : 0)

  const onToggleLike = async (place: DestinationPlace) => {
    const next = !likes.mine.has(place.name)
    // Optimista: el corazón responde al instante y solo se revierte si Supabase dice que no.
    const applyLocally = (liked: boolean) =>
      setLikes((prev) => {
        const counts = new Map(prev.counts)
        const mine = new Set(prev.mine)
        counts.set(place.name, Math.max(0, (counts.get(place.name) ?? 0) + (liked ? 1 : -1)))
        if (liked) mine.add(place.name)
        else mine.delete(place.name)
        return { counts, mine }
      })

    applyLocally(next)
    const confirmed = await togglePlaceLike(destination, place.name, next)
    if (confirmed === null) applyLocally(!next)
  }

  const addSelected = () => {
    if (!selected || !onPick) return
    onPick(stopFromPlace(selected, selectedPhoto ?? placeholderPhoto(selected.name)))
  }

  if (!open) return null

  const selectedChip = selected ? findPlaceCategoryChip(selected.filter_category) : null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="map-cover-overlay fixed inset-0 z-50 flex flex-col overflow-hidden bg-bg"
      >
        <div className="flex shrink-0 items-center gap-3 border-b border-border bg-bg-card px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            aria-label="Volver"
            title="Volver"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-bg-card text-text transition-colors hover:bg-bg-hover"
          >
            ←
          </button>
          <div className="min-w-0 flex-1 text-center">
            <p className="truncate text-body font-semibold text-text">{title}</p>
            {subtitle && <p className="truncate text-caption text-text-muted">{subtitle}</p>}
          </div>
          <span className="h-9 w-9 shrink-0" aria-hidden="true" />
        </div>

        {/* Filtros de categoría — encima del mapa, scrollables, todos apagados al abrir (salvo los que traiga EXPLORAR). */}
        <div className="flex shrink-0 items-center gap-2 border-b border-border bg-bg-card px-3 py-2">
          <div ref={chipsRowRef} className="flex flex-1 gap-2 overflow-x-auto">
            {PLACE_FILTER_CHIPS.filter((chip) => chip.id !== 'excursiones' || excursions.length > 0).map((chip) => {
              const active = activeFilters.includes(chip.id)
              return (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => toggleFilter(chip.id)}
                  aria-pressed={active}
                  data-active={active}
                  className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-caption font-semibold transition-colors ${
                    active ? 'text-white' : 'border-border bg-bg text-text-soft hover:bg-bg-hover'
                  }`}
                  style={active ? { backgroundColor: chip.color, borderColor: chip.color } : undefined}
                >
                  <span aria-hidden="true">{chip.icon}</span>
                  {chip.label}
                </button>
              )
            })}
          </div>
          {activeFilters.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveFilters([])}
              aria-label="Quitar todos los filtros"
              title="Quitar todos los filtros"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border bg-bg text-text-muted transition-colors hover:bg-bg-hover hover:text-text"
            >
              ✕
            </button>
          )}
        </div>

        {/* Segunda fila, solo con Restaurantes activo: sub-categorías excluyentes. */}
        {restaurantsActive && (
          <div className="flex shrink-0 gap-2 overflow-x-auto border-b border-border bg-bg-card px-3 pb-2">
            {[{ id: null, label: 'Todos', icon: null }, ...RESTAURANT_SUB_CATEGORIES].map((chip) => {
              const active = activeSubCategory === chip.id
              return (
                <button
                  key={chip.id ?? 'all'}
                  type="button"
                  onClick={() => setActiveSubCategory(chip.id as RestaurantSubCategory | null)}
                  aria-pressed={active}
                  className={`flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-caption font-medium transition-colors ${
                    active ? 'border-text-soft bg-bg-hover text-text' : 'border-border bg-bg text-text-muted hover:text-text-soft'
                  }`}
                >
                  {chip.icon && <span aria-hidden="true">{chip.icon}</span>}
                  {chip.label}
                </button>
              )
            })}
          </div>
        )}

        <div className="relative shrink-0" style={{ height: '38vh' }}>
          {visibleMarkerCount > 0 ? (
            <StopsMapView
              markers={markers}
              hiddenMarkerIds={hiddenMarkerIds}
              // Solo al mirar excursiones y nada más: los destinos están fuera de la ciudad y hay
              // que abrir el mapa para verlos. Con cualquier filtro de lugares activo la cámara se
              // queda donde el viajero la dejó, como siempre.
              fitToMarkerIds={excursionsActive && !placeFiltersActive ? excursionMarkers.map((marker) => marker.id) : null}
              activeStopId={selected ? `poi-${selected.name}` : null}
              onSelectStop={(id) => {
                const place = places.find((candidate) => `poi-${candidate.name}` === id)
                if (place) {
                  setSelected(place)
                  return
                }
                const excursion = excursions.find((candidate) => `excursion-${candidate.id}` === id)
                if (excursion) setSelectedExcursion(excursion)
              }}
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-bg-hover px-8 text-center">
              <p className="text-small text-text-soft">Activa una categoría para ver sus lugares en el mapa.</p>
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center justify-center bg-bg-card py-1.5">
          <span className="h-1.5 w-10 rounded-full bg-border" />
        </div>

        <div className="flex min-h-0 flex-1 flex-col bg-bg-card">
          <div className="shrink-0 px-4 pb-2">
            <div className="flex items-center gap-2 rounded-xl border border-border bg-bg px-3 py-2">
              <SearchIcon />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={`Buscar en ${destination}...`}
                autoComplete="off"
                className="w-full bg-transparent text-small text-text outline-none placeholder:text-text-muted"
              />
              {trimmedQuery && (
                <button type="button" onClick={() => setQuery('')} aria-label="Borrar búsqueda" className="shrink-0 text-text-muted hover:text-text">
                  ✕
                </button>
              )}
            </div>
          </div>

          {!trimmedQuery && (
            <div className="shrink-0 px-4 pb-2">
              <div className="flex gap-1 rounded-xl bg-bg-hover p-1">
                {(
                  [
                    { id: 'recommended', label: 'Recomendados' },
                    { id: 'nearby', label: 'Cerca de ti' },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTab(item.id)}
                    className={`flex-1 rounded-lg py-1.5 text-caption font-semibold transition-colors ${
                      tab === item.id ? 'bg-bg-card text-accent shadow-sm' : 'text-text-soft hover:text-text'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6">
            {!trimmedQuery && tab === 'nearby' && geoStatus === 'asking' && (
              <p className="flex items-center justify-center gap-2 py-8 text-small text-text-soft">
                <Spinner className="text-accent" />
                Buscando tu ubicación…
              </p>
            )}

            {!trimmedQuery && tab === 'nearby' && geoStatus === 'denied' && (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <LocationIcon />
                <p className="text-body font-semibold text-text">Activa tu ubicación para ver lugares cercanos</p>
                <p className="max-w-xs text-small text-text-soft">Mientras tanto los ves ordenados por recomendación.</p>
                <button
                  type="button"
                  onClick={() => setGeoStatus('idle')}
                  className="mt-1 rounded-lg bg-bg-hover px-3 py-1.5 text-caption font-semibold text-text transition-colors hover:bg-border"
                >
                  Reintentar
                </button>
              </div>
            )}

            {queryTooShort && <p className="py-8 text-center text-small text-text-soft">Escribe al menos {MIN_QUERY_LENGTH} letras para buscar.</p>}

            {needle && results.length === 0 && (
              <p className="py-8 text-center text-small text-text-soft">No encontramos este lugar en nuestra selección de {destination}.</p>
            )}

            {!trimmedQuery && results.length === 0 && !(excursionsActive && !placeFiltersActive) && (
              <p className="py-8 text-center text-small text-text-soft">
                {activeSubCategory !== null
                  ? `Todavía no tenemos ${findRestaurantSubCategory(activeSubCategory)?.label.toLowerCase()} seleccionados en ${destination}.`
                  : restaurantsActive && activeFilters.length === 1
                    ? `Todavía no tenemos restaurantes seleccionados en ${destination}.`
                    : ticketsActive && activeCategories.length > 0
                      ? 'Ninguno de estos lugares cobra entrada.'
                      : 'No hay lugares en las categorías seleccionadas.'}
              </p>
            )}

            {/* Las excursiones van ARRIBA del todo y en su propio bloque: no son lugares de la
                ciudad, son días enteros fuera de ella, y mezclarlas en la misma lista que el
                Panteón las haría parecer una parada más. */}
            {excursionsActive && !trimmedQuery && excursions.length > 0 && (
              <div className="mb-3 space-y-2">
                {excursions.map((excursion) => (
                  <ExcursionResultCard
                    key={excursion.id}
                    excursion={excursion}
                    open={selectedExcursion?.id === excursion.id}
                    onToggle={() => setSelectedExcursion((prev) => (prev?.id === excursion.id ? null : excursion))}
                  />
                ))}
              </div>
            )}

            <div className="space-y-2">
              {results.map((place) => {
                const chip = findPlaceCategoryChip(place.filter_category)
                const likeCount = likes.counts.get(place.name) ?? 0
                const liked = likes.mine.has(place.name)
                const alreadyInRoute = isNameAlreadyInRoute(place.name, stopEntries)
                const distance = position && hasRealCoordinates(place.coordinates) ? haversineMeters(position, place.coordinates) : null
                return (
                  <div
                    key={place.name}
                    className={`flex items-center gap-3 rounded-xl border p-2.5 transition-colors ${
                      selected?.name === place.name ? 'border-accent bg-accent-soft' : 'border-border'
                    }`}
                  >
                    <button type="button" onClick={() => setSelected(place)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                      <PlaceThumb name={place.name} city={destination} chip={chip} wikipediaTitle={place.wikipedia_title} />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5">
                          <span className="truncate text-small font-semibold text-text">{place.name}</span>
                          {alreadyInRoute && (
                            <span className="shrink-0 rounded-full bg-accent-soft px-1.5 py-0.5 text-caption font-semibold text-accent-hover">En tu ruta</span>
                          )}
                        </span>
                        <span className="flex flex-wrap items-center gap-x-1.5 text-caption text-text-soft">
                          {/* Un restaurante se elige por tipo y precio, no por cuánto se tarda en
                              verlo: donde una atracción pone su duración, este pone su sub-categoría
                              y su rango de precio. */}
                          {place.kind === 'restaurant' ? (
                            <>
                              {findRestaurantSubCategory(place.sub_category)?.label && (
                                <span className="shrink-0">{findRestaurantSubCategory(place.sub_category)?.label}</span>
                              )}
                              {place.price_range && (
                                <>
                                  <span>·</span>
                                  <span className="shrink-0">{place.price_range}</span>
                                </>
                              )}
                              {place.zone_label && (
                                <>
                                  <span>·</span>
                                  <span className="truncate">{place.zone_label}</span>
                                </>
                              )}
                            </>
                          ) : (
                            <>
                              {place.zone_label && <span className="truncate">{place.zone_label}</span>}
                              {place.duration_min !== null && (
                                <>
                                  {place.zone_label && <span>·</span>}
                                  <span className="shrink-0">{formatDuration(place.duration_min)}</span>
                                </>
                              )}
                              {/* Si cobra entrada se dice aquí y no solo al filtrar: es lo que el
                                  viajero necesita saber para ir reservando con tiempo. */}
                              {place.requires_ticket && (
                                <>
                                  <span>·</span>
                                  <span className="flex shrink-0 items-center gap-1 text-text-muted">
                                    <TicketIcon />
                                    Entrada
                                  </span>
                                </>
                              )}
                            </>
                          )}
                          {distance !== null && (
                            <>
                              <span>·</span>
                              <span className="shrink-0">{formatDistance(distance)}</span>
                            </>
                          )}
                        </span>
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onToggleLike(place)}
                      aria-pressed={liked}
                      aria-label={liked ? `Quitar me gusta de ${place.name}` : `Me gusta ${place.name}`}
                      className={`flex shrink-0 items-center gap-1 rounded-full px-2 py-1.5 text-caption font-semibold transition-colors ${
                        liked ? 'text-accent' : 'text-text-muted hover:text-text-soft'
                      }`}
                    >
                      <HeartIcon filled={liked} />
                      {likeCount > 0 && <span className="tabular-nums">{likeCount}</span>}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Ficha del lugar — el mismo componente de 3 pestañas de la ruta, que ya carga por su cuenta
            la ficha ampliada curada por (destino, nombre); desde aquí solo se le añade el CTA. */}
        {/* Un restaurante abre SU ficha (corta, con "Cómo llegar"), nunca la de 3 pestañas de una
            parada: no tiene qué ver, ni entradas, ni sitio en el itinerario. */}
        <RestaurantDetailSheet
          restaurant={selected?.kind === 'restaurant' ? selected : null}
          likeCount={selected ? (likes.counts.get(selected.name) ?? 0) : 0}
          liked={selected ? likes.mine.has(selected.name) : false}
          onToggleLike={() => selected && onToggleLike(selected)}
          onClose={() => setSelected(null)}
        />

        {selected && selected.kind !== 'restaurant' && (
          <StopDetailSheet
            stop={{
              id: `pool-${selected.name}`,
              name: selected.name,
              category: selectedChip?.label ?? selected.type ?? 'Lugar',
              hours: selected.schedule,
              durationMinutes: selected.duration_min ?? 60,
              photoUrl: selectedPhoto ?? placeholderPhoto(selected.name),
              description: '',
              tips: [],
              purchase: null,
            }}
            city={destination}
            dayNumber={dayNumber}
            dateIso={dateIso}
            // El lugar que se está mirando todavía no es una parada del día, así que se añade al
            // final de la lista del mapa de la ficha: así sale resaltado en su sitio real y, cuando
            // se abre desde el "+", se ve dónde cae respecto a las paradas que ya hay. Desde
            // EXPLORAR no hay ninguna y queda él solo (si no, el mapa saldría vacío).
            dayStops={[
              ...dayMarkers.map((marker): DayStopRef => ({ id: marker.id, name: marker.name, coordinates: marker.coordinates, photoUrl: marker.photoUrl })),
              { id: `pool-${selected.name}`, name: selected.name, coordinates: selected.coordinates, photoUrl: selectedPhoto ?? undefined },
            ]}
            isAnchor={false}
            footerAction={onPick ? { label: dayNumber ? `Añadir a Día ${dayNumber} →` : 'Añadir a mi ruta →', onClick: addSelected } : undefined}
            onClose={() => setSelected(null)}
          />
        )}
      </motion.div>
    </AnimatePresence>
  )
}
