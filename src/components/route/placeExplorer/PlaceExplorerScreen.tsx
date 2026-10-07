import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import type { Coordinates, Excursion, Route, Stop } from '../../../lib/types'
import { isOsmPoint, type DestinationPlace } from '../../../lib/destinationPlacesApi'
import {
  PLACE_FILTER_CHIPS,
  RESTAURANT_SUB_CATEGORIES,
  categoriesForFilters,
  findPlaceCategoryChip,
  findRestaurantSubCategory,
  type PlaceFilterId,
  type RestaurantSubCategory,
} from '../../../lib/placeCategories'
import { fetchPlaceLikes, togglePlaceLike, EMPTY_PLACE_LIKES, type PlaceLikes } from '../../../lib/placeLikesApi'
import { fetchPlacePhoto } from '../../../lib/placePhoto'
import { buildRouteStopEntries, isNameAlreadyInRoute } from '../../../lib/routeStopsIndex'
import { haversineMeters, hasRealCoordinates } from '../../../lib/distanceMock'
import { formatDuration } from '../../../lib/format'
import { StopsMapView, type StopsMapMarker, type StopsMapMarkerLine } from '../../map/StopsMapView'
import { StopDetailSheet, type DayStopRef } from '../dayDetail/StopDetailSheet'
import { RestaurantDetailSheet } from './RestaurantDetailSheet'
import { Spinner } from '../../ui/Spinner'
import { CIVITATIS_RED } from '../../../lib/affiliateLinks'
import { placeHoursOnDate } from '../../../lib/placeHoursOnDate'
import { CARD_STYLE, CATEGORY_STYLE, EXPLORE_ICONS, solidOf, type ExploreIconName } from '../../../lib/exploreStyle'

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
  /** Las líneas de la ruta del día (y el hueco marcado), como en el mapa de la ruta. */
  dayLines?: StopsMapMarkerLine[]
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
  /** Abrir el mapa centrado aquí (a escala de barrio) en vez de encuadrar toda la ciudad — lo usa el bloque de tiempo libre antes de cenar: "todo lo que hay cerca" de donde está el viajero. */
  focusCoordinates?: Coordinates | null
  /** Presente = modo "añadir": la ficha del lugar muestra el CTA "Añadir a mi ruta". Ausente = solo explorar. */
  onPick?: (stop: Stop) => void
  /** Modo añadir del viaje ("+ Añadir día", Explorar): cada sitio lleva su "+ Añadir", que abre la ventana del día. */
  onQuickAdd?: (place: DestinationPlace) => void
  onQuickAddExcursion?: (excursion: Excursion) => void
  /** Con él, el chip "Hoteles": los hoteles no van dentro de los días, llevan a Booking. */
  hotelsUrl?: string | null
  /** "Cambiar" restaurante de una comida o cena: los de esta zona van primero, con "Recomendado". */
  recommendedZone?: string | null
  /** Texto del botón de cada sitio ("+ Añadir" por defecto; "Elegir" al cambiar un restaurante). */
  quickAddLabel?: string
  /** Con él, los baños públicos (OpenStreetMap) entran como un filtro más: solo desde Explorar (no se pueden añadir a un día). */
  toiletsEnabled?: boolean
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

export function placeholderPhoto(name: string): string {
  return `https://picsum.photos/seed/${encodeURIComponent(name)}/600/400`
}

export function stopFromPlace(place: DestinationPlace, photoUrl: string): Stop {
  const chip = findPlaceCategoryChip(place.filter_category)
  return {
    id: `stop-pool-${normalize(place.name).replace(/\s+/g, '-')}-${Date.now()}`,
    // Hora de relleno: la posición real en el día se la da el store al insertarla, que es quien
    // recalcula SOLO el tramo con la parada anterior y redondea al cuarto más cercano (ver
    // timeForStopAfter en useRouteStore.ts). Desde aquí no sabemos dónde va a caer.
    time: '12:00',
    name: place.name,
    description: place.booking_note ?? 'Añadido por ti',
    categoryLabel: chip?.label ?? place.type ?? 'Lugar',
    durationMinutes: place.duration_min ?? 60,
    coordinates: place.coordinates,
    photoUrl,
    hours: withBookingNote(place),
    scheduleText: withBookingNote(place),
    hoursCard: place.hours_card ?? null,
    reservation: place.reservation ?? null,
    ticketInfo: place.ticket_info ?? null,
    tags: place.tags,
    hoursData: place.hours_data ?? null,
  }
}


/** El horario con la nota de reserva delante si la tiene: "Solo vie-dom, visita guiada con reserva · 09:00-16:30". */
function withBookingNote(place: DestinationPlace): string | null {
  if (!place.booking_note) return place.schedule
  return place.schedule ? `${place.booking_note} · ${place.schedule}` : place.booking_note
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
 * La foto de una fila en el diseño «Trazo Explorar»: una franja con el borde izquierdo en diagonal. Misma foto y misma carga perezosa
 * que PlaceThumb; si no hay foto se queda el degradado del color de la categoría con su icono.
 */
function PlacePhotoPanel({ place, city, color, icon }: { place: DestinationPlace; city: string; color: string; icon: ExploreIconName }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [inView, setInView] = useState(false)
  const [photo, setPhoto] = useState<string | null>(null)
  const toilet = isOsmPoint(place)
  useEffect(() => {
    if (inView || toilet || !ref.current) return
    const observer = new IntersectionObserver((entries) => entries.some((entry) => entry.isIntersecting) && setInView(true), { rootMargin: '200px' })
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [inView, toilet])
  useEffect(() => {
    if (!inView) return
    let cancelled = false
    fetchPlacePhoto(place.name, city, place.wikipedia_title).then((url) => !cancelled && setPhoto(url))
    return () => {
      cancelled = true
    }
  }, [inView, place.name, place.wikipedia_title, city])
  return (
    <span ref={ref} className="relative block shrink-0" style={{ width: 100, margin: '-1px 0 -1px -1px' }}>
      <span
        aria-hidden="true"
        className="absolute inset-0 flex items-center justify-center text-white"
        style={{
          borderRadius: '18px 0 0 18px',
          clipPath: 'polygon(0 0,100% 0,calc(100% - 22px) 100%,0 100%)',
          background: photo ? `url("${photo}") center/cover, ${color}` : `linear-gradient(135deg,${color},rgba(28,34,48,.35))`,
        }}
      >
        {!photo && (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" opacity=".9">
            <path d={EXPLORE_ICONS[icon]} />
          </svg>
        )}
      </span>
    </span>
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
function ExcursionResultCard({ excursion, open, onToggle, onAdd }: { excursion: Excursion; open: boolean; onToggle: () => void; onAdd?: () => void }) {
  return (
    <div className={`rounded-xl border transition-colors ${open ? 'border-accent bg-accent-soft' : 'border-border'}`}>
      <div className="flex items-center gap-2 pr-2.5">
      <button type="button" onClick={onToggle} aria-expanded={open} className="flex min-w-0 flex-1 items-center gap-3 p-2.5 text-left">
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
      {onAdd && (
        <button type="button" onClick={onAdd} className="shrink-0 rounded-full border border-accent px-2.5 py-1 text-caption font-semibold text-accent transition-colors hover:bg-accent-soft">
          + Añadir
        </button>
      )}
      </div>

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
              Reservar
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
  places: allPlaces,
  title,
  subtitle,
  dayMarkers = [],
  dayLines = [],
  dayNumber = null,
  dateIso = null,
  route = null,
  initialFilters = [],
  excursions = [],
  initialQuery,
  focusCoordinates = null,
  onPick,
  onQuickAdd,
  onQuickAddExcursion,
  hotelsUrl = null,
  recommendedZone = null,
  quickAddLabel = '+ Añadir',
  toiletsEnabled = false,
  onClose,
}: PlaceExplorerScreenProps) {
  // Los baños solo entran si quien abre la pantalla los quiere (Explorar): en el «+» de los días no se enseñan.
  const places = useMemo(() => (toiletsEnabled ? allPlaces : allPlaces.filter((place) => place.kind !== 'toilet')), [allPlaces, toiletsEnabled])
  const mainZone = (label: string | null | undefined) => String(label ?? '').split('/')[0].trim()
  /** De la zona de la comida o la cena que se está cambiando. */
  const isRecommended = (place: DestinationPlace) => Boolean(recommendedZone) && place.kind === 'restaurant' && mainZone(place.zone_label) === mainZone(recommendedZone)
  /** Cierra el día que se mira (solo con fechas): en gris y con "Hoy cierra". */
  const closedToday = (place: DestinationPlace) => Boolean(dateIso && placeHoursOnDate(place.hours_data, dateIso)?.closed)
  const [hotelsActive, setHotelsActive] = useState(false)
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
  /** Un baño tocado en el mapa o en la lista: se resalta, pero no abre ficha (no tiene) ni se puede añadir a un día. */
  const [selectedToilet, setSelectedToilet] = useState<string | null>(null)
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)
  const [position, setPosition] = useState<Coordinates | null>(null)
  const [geoStatus, setGeoStatus] = useState<GeoStatus>('idle')
  const chipsRowRef = useRef<HTMLDivElement>(null)
  /** El mapa grande (por defecto) o pequeño: el tirador de la hoja lo cambia. */
  const [mapH, setMapH] = useState(() => Math.round(window.innerHeight * 0.38))
  const [draggingSheet, setDraggingSheet] = useState(false)
  const dragRef = useRef<{ startY: number; startH: number; moved: boolean } | null>(null)
  const clampMapH = (value: number) => Math.max(Math.round(window.innerHeight * 0.14), Math.min(Math.round(window.innerHeight * 0.62), value))
  /** El mapa recogido a mano (como en Días): queda una franja para volver a abrirlo. */
  const [mapCollapsed, setMapCollapsed] = useState(false)
  /** Tocar un baño o una fuente de la lista acerca el mapa hasta él. */
  const [flyTarget, setFlyTarget] = useState<{ coordinates: Coordinates; key: number } | null>(null)
  /** El botón de localizarte pide la ubicación (con el mismo permiso de «Cerca de ti») y centra el mapa. */
  const [locateRequested, setLocateRequested] = useState(false)
  const [recenterKey, setRecenterKey] = useState(0)

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
    // Baños y Fuentes se abren en «Cerca de ti» (los más cercanos primero); el resto, en «Recomendados».
    setTab(initialFiltersKey === 'banos' || initialFiltersKey === 'fuentes' ? 'nearby' : 'recommended')
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
    if (!open || (tab !== 'nearby' && !locateRequested) || position || geoStatus === 'asking' || geoStatus === 'denied') return
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
  }, [open, tab, position, geoStatus, locateRequested])

  // Pulsado el botón de localizarte y llegada la ubicación: el mapa vuela hasta ahí.
  useEffect(() => {
    if (locateRequested && position) {
      setRecenterKey((value) => value + 1)
      setLocateRequested(false)
    }
  }, [locateRequested, position])

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

  /** Al apagar Excursiones el mapa vuelve de lejos: se encuadra lo que queda a la vista (o, si no hay nada, Roma). Se guarda al apagar para no mover la cámara después. */
  const [recenterIds, setRecenterIds] = useState<string[] | null>(null)

  const toggleFilter = (id: PlaceFilterId) => {
    if (id === 'excursiones') {
      if (activeFilters.includes('excursiones')) {
        const shown = [...visiblePinIds]
        // Sin nada a la vista: la ciudad entera (los lugares de nuestro catálogo), no el último destino de excursión.
        const cityIds = poiPlaces.filter((place) => place.kind === 'place').map((place) => poiId(place))
        setRecenterIds(shown.length > 0 ? shown : cityIds)
      } else setRecenterIds(null)
    }
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
  const toiletsActive = activeFilters.includes('banos')
  const fountainsActive = activeFilters.includes('fuentes')
  /** Un baño o una fuente solo entra en la lista y el mapa con su propio filtro encendido. */
  const osmShown = (place: DestinationPlace) => (place.kind === 'toilet' ? toiletsActive : place.kind === 'fountain' ? fountainsActive : true)
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
        .filter((place) => osmShown(place))
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
        (osmShown(place)) &&
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
      const zoneDiff = Number(isRecommended(b)) - Number(isRecommended(a))
      if (zoneDiff !== 0) return zoneDiff
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
  }, [places, needle, queryTooShort, activeFilters, activeSubCategory, tab, position, likes, recommendedZone])

  // Prompt 3 (bug 1): el mapa recibe SIEMPRE el catálogo entero, pase lo que pase con los filtros,
  // y lo que cambia al marcar un chip es únicamente qué pines están ocultos. Antes se le pasaba solo
  // el subconjunto visible, y como StopsMapView se reconstruye entero cuando cambia el conjunto de
  // marcadores, cada chip reseteaba la cámara: nuevo fitBounds, nuevo zoom, el mapa saltando bajo el
  // dedo. Ahora la vista del viajero no se toca y los pines entran y salen con un fundido.
  // Más pequeños que los números de las paradas del día, para que la ruta siga destacando.
  const poiPlaces = useMemo(() => places.filter((place) => hasRealCoordinates(place.coordinates)), [places])
  const ticketId = (place: DestinationPlace) => `${poiId(place)}#entrada`
  /** El id del pin de un lugar: los baños no tienen nombre propio, van por su id de OpenStreetMap. */
  const poiId = (place: DestinationPlace) => (isOsmPoint(place) ? `toilet-${place.osm_id ?? place.coordinates.lat}` : `poi-${place.name}`)

  // "También te puede interesar" (Paso 3): lo de las experiencias que eligió el viajero que no está en
  // la ruta —lo que se quedó fuera por el máximo de la experiencia o porque no cabía—. Solo al añadir
  // una parada y sin búsqueda ni filtros, arriba de la lista.
  const chosenThemes = useMemo(() => new Set<string>(route?.answers?.experiencesPositive ?? []), [route])
  const alsoInteresting = useMemo(() => {
    if (!onPick || chosenThemes.size === 0) return []
    return places
      .filter((place) => place.kind === 'place' && (place.themes ?? []).some((theme) => chosenThemes.has(theme)) && !isNameAlreadyInRoute(place.name, stopEntries))
      .sort((a, b) => (a.level ?? 9) - (b.level ?? 9) || a.name.localeCompare(b.name, 'es'))
      .slice(0, 8)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [places, chosenThemes, onPick, stopEntries])

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
          bg: solidOf(CARD_STYLE.excursiones.color),
          text: '#FFFFFF',
          iconPath: EXPLORE_ICONS.bus,
          size: 28,
        })),
    [excursions],
  )

  const markers: StopsMapMarker[] = useMemo(() => {
    const poiMarkers: StopsMapMarker[] = poiPlaces.map((place) => {
      const style = place.filter_category ? CATEGORY_STYLE[place.filter_category] : null
      return {
        id: poiId(place),
        name: place.name,
        coordinates: place.coordinates,
        number: 0,
        bg: solidOf(style?.color ?? '#6B7280'),
        text: '#FFFFFF',
        iconPath: EXPLORE_ICONS[style?.icon ?? 'temple'],
        size: 28,
        ...(closedToday(place) ? { opacity: 0.35 } : {}),
      }
    })
    // Los sitios que cobran entrada llevan además su propio pin con el icono de entrada: se enciende con el filtro Entradas.
    const ticketMarkers: StopsMapMarker[] = poiPlaces
      .filter((place) => place.requires_ticket && !isOsmPoint(place))
      .map((place) => ({
        id: ticketId(place),
        name: place.name,
        coordinates: place.coordinates,
        number: 0,
        bg: solidOf(CARD_STYLE.entradas.color),
        text: '#FFFFFF',
        iconPath: EXPLORE_ICONS.ticket,
        size: 28,
        ...(closedToday(place) ? { opacity: 0.35 } : {}),
      }))
    return [...dayMarkers, ...poiMarkers, ...ticketMarkers, ...excursionMarkers]
  }, [dayMarkers, poiPlaces, excursionMarkers])

  /** Nombres que SÍ se ven en el mapa ahora mismo — mismo criterio que la lista: sin ningún filtro
      ni búsqueda, el mapa no enseña el catálogo entero, solo las paradas del día; durante una
      búsqueda enseña lo encontrado, aunque los chips activos no lo incluyan. */
  const visiblePinIds = useMemo(() => {
    const ids = new Set<string>()
    if (queryTooShort) return ids
    if (needle) {
      for (const place of results) ids.add(poiId(place))
      return ids
    }
    // Cada filtro enciende SUS pines, aparte de la lista: Atracciones los de categoría, Entradas los del icono de entrada (un mismo sitio puede llevar los dos).
    const categoryFilters = activeFilters.filter((id) => id !== 'entradas' && id !== 'excursiones')
    const categoriesOn = categoryFilters.flatMap((id) => categoriesForFilters([id]))
    for (const place of poiPlaces) {
      const categoryOn = place.filter_category !== null && categoriesOn.includes(place.filter_category) && (place.kind !== 'restaurant' || activeSubCategory === null || place.sub_category === activeSubCategory)
      if (categoryOn) ids.add(poiId(place))
      if (ticketsActive && place.requires_ticket && !isOsmPoint(place)) ids.add(ticketId(place))
    }
    return ids
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results, needle, queryTooShort, activeFilters, activeSubCategory, ticketsActive, poiPlaces])

  /** Cuánto se corre cada pin cuando un sitio lleva dos a la vez (Coliseo con Atracciones y Entradas): uno a cada lado, sin taparse. */
  const pinOffsets = useMemo(() => {
    const offsets: Record<string, [number, number]> = {}
    for (const place of poiPlaces) {
      if (visiblePinIds.has(poiId(place)) && visiblePinIds.has(ticketId(place))) {
        offsets[poiId(place)] = [-15, 0]
        offsets[ticketId(place)] = [15, 0]
      }
    }
    return offsets
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visiblePinIds, poiPlaces])

  const hiddenMarkerIds = useMemo(
    () => [
      ...poiPlaces.flatMap((place) => [poiId(place), ticketId(place)]).filter((id) => !visiblePinIds.has(id)),
      // Mismo truco que con los lugares (Prompt 3): los pines de excursión están SIEMPRE en el mapa
      // y lo que cambia al marcar el chip es solo cuáles se ven — así la cámara no se resetea.
      ...(excursionsActive ? [] : excursionMarkers.map((marker) => marker.id)),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [poiPlaces, visiblePinIds, excursionsActive, excursionMarkers],
  )
  /** Los pines de lo que ya está en la ruta llevan el aro dorado (el contador «En tu ruta · n» de encima del mapa). */
  const inRouteIds = useMemo(
    () => [
      ...poiPlaces
        .filter((place) => !isOsmPoint(place) && isNameAlreadyInRoute(place.name, stopEntries))
        .flatMap((place) => [poiId(place), ticketId(place)]),
      // Una excursión que ya está en la ruta (la elegida en su día) lleva el aro igual.
      ...excursions.filter((excursion) => route?.days.some((day) => day.selectedExcursionId === excursion.id)).map((excursion) => `excursion-${excursion.id}`),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [poiPlaces, stopEntries, excursions, route],
  )
  const visibleMarkerCount = dayMarkers.length + visiblePinIds.size + (excursionsActive ? excursionMarkers.length : 0)
  // Con Excursiones encendido el mapa se aleja lo justo para ver los destinos (a veces lejos de la ciudad); si hay más filtros, también sus pines.
  const fitIds = !excursionsActive ? recenterIds : excursionsActive ? [...excursionMarkers.map((marker) => marker.id), ...(placeFiltersActive ? [...visiblePinIds] : [])] : null

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

  // En el body y por encima de todo (el menú de arriba y la barra flotante incluidos), con su cruz para cerrar (paso 6.4).
  // Aspecto del diseño «Trazo Explorar» (3-oct-2026): cabecera con la cruz en círculo y «Explorar <Roma>», pastillas de filtro con icono y número,
  // el mapa con su píldora «En tu ruta» y el botón de localizarte, y la hoja de abajo con el buscador, el selector y las tarjetas. Solo cambia
  // cómo se ve: los filtros, el buscador, los likes, «en ruta / no en ruta» y lo que pasa al añadir son los de siempre.
  const titleMatch = /^(Explorar )(.+)$/.exec(title)
  const chipCount = (id: PlaceFilterId): number => {
    if (id === 'excursiones') return excursions.length
    if (id === 'entradas') return places.filter((place) => place.requires_ticket && !isOsmPoint(place)).length
    const categories = categoriesForFilters([id])
    return places.filter((place) => place.filter_category !== null && categories.includes(place.filter_category)).length
  }
  const inRouteCount = route ? places.filter((place) => place.kind === 'place' && isNameAlreadyInRoute(place.name, stopEntries)).length : 0
  const toiletsAvailable = toiletsEnabled && places.some((place) => isOsmPoint(place))
  const fountainsAvailable = toiletsEnabled && places.some((place) => place.kind === 'fountain')
  const chipRow = PLACE_FILTER_CHIPS.filter((chip) => (chip.id !== 'excursiones' || excursions.length > 0) && (chip.id !== 'banos' || toiletsAvailable) && (chip.id !== 'fuentes' || fountainsAvailable))
  const iconBox = (name: ExploreIconName, size = 15) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={EXPLORE_ICONS[name]} />
    </svg>
  )
  const chipIcon: Record<PlaceFilterId, ExploreIconName> = { atracciones: 'museum', miradores: 'sunset', restaurantes: 'fork', entradas: 'ticket', excursiones: 'bus', banos: 'toilet', fuentes: 'drop' }
  const warm = 'oklch(0.55 0.15 45)'

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="map-cover-overlay fixed inset-0 z-[90] flex flex-col overflow-hidden bg-bg"
      >
        <header className="grid shrink-0 items-center px-4 pb-2.5 pt-1" style={{ gridTemplateColumns: '44px 1fr 44px' }}>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            title="Cerrar"
            className="flex h-[42px] w-[42px] items-center justify-center rounded-full bg-bg-card text-accent"
            style={{ border: `1.5px solid ${warm}` }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d={EXPLORE_ICONS.close} />
            </svg>
          </button>
          <div className="flex min-w-0 flex-col items-center gap-[3px]">
            <span className="max-w-full truncate font-display text-text" style={{ fontSize: 28, lineHeight: 1 }}>
              {titleMatch ? (
                <>
                  {titleMatch[1]}
                  <em className="text-accent">{titleMatch[2]}</em>
                </>
              ) : (
                title
              )}
            </span>
            {subtitle && (
              <span className="max-w-full truncate text-text-muted" style={{ font: "500 10px 'Geist Mono',monospace", letterSpacing: '.16em', textTransform: 'uppercase' }}>
                {subtitle}
              </span>
            )}
          </div>
          <span aria-hidden="true" />
        </header>

        {/* Filtros de categoría — encima del mapa, scrollables, todos apagados al abrir (salvo los que traiga EXPLORAR). */}
        <div className="flex shrink-0 items-center gap-1.5 px-4 pb-3">
          <div ref={chipsRowRef} className="flex flex-1 items-center gap-1.5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {chipRow.map((chip) => {
              const active = activeFilters.includes(chip.id)
              return (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => toggleFilter(chip.id)}
                  aria-pressed={active}
                  data-active={active}
                  className="flex shrink-0 items-center gap-2 rounded-full transition-colors"
                  style={{
                    height: 38,
                    padding: '0 14px 0 6px',
                    border: `1px solid ${active ? 'rgb(var(--text))' : 'rgba(28,34,48,.12)'}`,
                    background: active ? 'rgb(var(--text))' : '#FFFDF8',
                    color: active ? '#FFFDF8' : 'rgb(var(--text))',
                    font: "500 14px 'Geist'",
                  }}
                >
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-full transition-colors"
                    style={{ background: active ? 'oklch(0.74 0.16 65)' : '#EFE7D8', color: active ? 'rgb(var(--text))' : 'rgba(28,34,48,.7)' }}
                  >
                    {iconBox(chipIcon[chip.id])}
                  </span>
                  {chip.label}
                  <span style={{ font: "500 11px 'Geist Mono',monospace", opacity: 0.6 }}>{chipCount(chip.id)}</span>
                </button>
              )
            })}
            {hotelsUrl && (
              <button
                type="button"
                onClick={() => setHotelsActive((value) => !value)}
                aria-pressed={hotelsActive}
                className="flex shrink-0 items-center gap-2 rounded-full transition-colors"
                style={{
                  height: 38,
                  padding: '0 14px 0 6px',
                  border: `1px solid ${hotelsActive ? 'rgb(var(--text))' : 'rgba(28,34,48,.12)'}`,
                  background: hotelsActive ? 'rgb(var(--text))' : '#FFFDF8',
                  color: hotelsActive ? '#FFFDF8' : 'rgb(var(--text))',
                  font: "500 14px 'Geist'",
                }}
              >
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-full"
                  style={{ background: hotelsActive ? 'oklch(0.74 0.16 65)' : '#EFE7D8', color: hotelsActive ? 'rgb(var(--text))' : 'rgba(28,34,48,.7)' }}
                >
                  {iconBox('hotel')}
                </span>
                Hoteles
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setActiveFilters([])}
            aria-label="Quitar todos los filtros"
            title="Quitar todos los filtros"
            className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full transition-opacity"
            style={{ border: '1px solid rgba(28,34,48,.12)', background: '#FFFDF8', color: 'rgba(28,34,48,.6)', opacity: activeFilters.length > 0 ? 1 : 0.35 }}
          >
            {iconBox('close')}
          </button>
        </div>

        {/* Segunda fila, solo con Restaurantes activo: sub-categorías excluyentes. */}
        {restaurantsActive && (
          <div className="flex shrink-0 gap-2 overflow-x-auto px-4 pb-3" style={{ scrollbarWidth: 'none' }}>
            {[{ id: null, label: 'Todos', icon: null }, ...RESTAURANT_SUB_CATEGORIES].map((chip) => {
              const active = activeSubCategory === chip.id
              return (
                <button
                  key={chip.id ?? 'all'}
                  type="button"
                  onClick={() => setActiveSubCategory(chip.id as RestaurantSubCategory | null)}
                  aria-pressed={active}
                  className={`flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-caption font-medium transition-colors ${
                    active ? 'border-text bg-text text-bg' : 'border-border bg-bg-card text-text-soft hover:text-text'
                  }`}
                >
                  {chip.icon && <span aria-hidden="true">{chip.icon}</span>}
                  {chip.label}
                </button>
              )
            })}
          </div>
        )}

        {mapCollapsed ? (
          <button
            type="button"
            onClick={() => setMapCollapsed(false)}
            aria-label="Mostrar mapa"
            title="Mostrar mapa"
            className="flex h-8 w-full shrink-0 items-center justify-center border-y border-text/10 bg-bg-card text-text-soft transition-colors hover:bg-bg-hover"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        ) : (
        <div className="relative shrink-0" style={{ height: mapH, transition: draggingSheet ? 'none' : 'height .35s cubic-bezier(.2,.8,.2,1)' }}>
          {visibleMarkerCount > 0 || markers.length > 0 ? (
            <StopsMapView
              markers={markers}
              lines={dayLines}
              hiddenMarkerIds={hiddenMarkerIds}
              ringIds={inRouteIds}
              userPosition={position}
              recenterKey={recenterKey}
              // Solo al mirar excursiones y nada más: los destinos están fuera de la ciudad y hay
              // que abrir el mapa para verlos. Con cualquier filtro de lugares activo la cámara se
              // queda donde el viajero la dejó, como siempre.
              fitToMarkerIds={fitIds}
              offsets={pinOffsets}
              flyTo={flyTarget}
              persistKey="explore"
              focusCenter={focusCoordinates}
              activeStopId={selected ? poiId(selected) : selectedToilet}
              onSelectStop={(id) => {
                const place = places.find((candidate) => poiId(candidate) === id.replace(/#entrada$/, ''))
                if (place) {
                  if (isOsmPoint(place)) setSelectedToilet(id)
                  else setSelected(place)
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
          <button
            type="button"
            onClick={() => setMapCollapsed(true)}
            aria-label="Ocultar mapa"
            title="Ocultar mapa"
            className="absolute right-3.5 top-3.5 z-[6] flex h-10 w-10 items-center justify-center rounded-full border-[1.5px] border-accent bg-bg-card text-accent shadow-[0_8px_20px_-8px_rgba(28,34,48,.3)] transition-colors hover:bg-bg-hover"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <polyline points="18 15 12 9 6 15" />
            </svg>
          </button>
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 z-[4]" style={{ height: 22, background: 'linear-gradient(180deg,rgba(245,239,228,.9),rgba(245,239,228,0))' }} />
          {route && (
            <div
              className="absolute left-3.5 z-[5] flex items-center gap-[7px] rounded-full backdrop-blur"
              style={{ bottom: 36, height: 30, padding: '0 12px', background: 'rgba(255,253,248,.92)', font: "500 12px 'Geist'", boxShadow: '0 6px 16px -8px rgba(28,34,48,.35)' }}
            >
              <span className="h-2.5 w-2.5 rounded-full bg-white" style={{ boxShadow: '0 0 0 2.5px oklch(0.74 0.16 65)' }} />
              En tu ruta · {inRouteCount}
            </div>
          )}
          <button
            type="button"
            onClick={() => {
              if (position) setRecenterKey((value) => value + 1)
              else {
                setGeoStatus((status) => (status === 'denied' ? 'idle' : status))
                setLocateRequested(true)
              }
            }}
            aria-label="Mi ubicación"
            title="Mi ubicación"
            className="absolute right-3.5 z-[5] flex h-[42px] w-[42px] items-center justify-center rounded-full text-text"
            style={{ bottom: 36, background: '#FFFDF8', boxShadow: '0 8px 20px -8px rgba(28,34,48,.4)' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d={EXPLORE_ICONS.locate} />
              <circle cx="12" cy="12" r="2" fill="currentColor" />
            </svg>
          </button>
        </div>

        )}

        <div className="relative z-10 flex min-h-0 flex-1 flex-col bg-bg" style={{ marginTop: mapCollapsed ? 0 : -22, borderRadius: '26px 26px 0 0', boxShadow: '0 -10px 30px -18px rgba(28,34,48,.3)' }}>
          <button
            type="button"
            aria-label="Arrastrar panel"
            className="flex h-[26px] shrink-0 cursor-grab touch-none items-center justify-center active:cursor-grabbing"
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId)
              dragRef.current = { startY: event.clientY, startH: mapH, moved: false }
              setDraggingSheet(true)
            }}
            onPointerMove={(event) => {
              const drag = dragRef.current
              if (!drag) return
              if (Math.abs(event.clientY - drag.startY) > 4) drag.moved = true
              setMapH(clampMapH(drag.startH + (event.clientY - drag.startY)))
            }}
            onPointerUp={() => {
              const drag = dragRef.current
              dragRef.current = null
              setDraggingSheet(false)
              // Un toque sin arrastrar alterna entre mapa grande y pequeño.
              if (drag && !drag.moved) setMapH(drag.startH > window.innerHeight * 0.3 ? clampMapH(window.innerHeight * 0.18) : clampMapH(window.innerHeight * 0.45))
            }}
          >
            <span className="h-1 w-[42px] rounded bg-text/20" />
          </button>
          <div className="flex shrink-0 flex-col gap-2.5 px-4">
            <label className="flex h-12 cursor-text items-center gap-2.5 px-3.5" style={{ borderRadius: 16, background: '#FFFDF8', border: '1px solid rgba(28,34,48,.1)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(28,34,48,.55)" strokeWidth="1.8" strokeLinecap="round">
                <path d={EXPLORE_ICONS.search} />
              </svg>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={`Buscar en ${destination}…`}
                autoComplete="off"
                className="min-w-0 flex-1 border-none bg-transparent text-text outline-none placeholder:text-text/45"
                style={{ font: "400 15px 'Geist'" }}
              />
              {trimmedQuery && (
                <button type="button" onClick={() => setQuery('')} aria-label="Borrar búsqueda" className="h-[26px] w-[26px] rounded-full bg-text/[0.08] text-text">
                  ×
                </button>
              )}
            </label>
            {!trimmedQuery && (
              <div className="relative grid grid-cols-2" style={{ height: 42, borderRadius: 14, background: '#EDE4D3', padding: 4 }}>
                <span
                  aria-hidden="true"
                  className="absolute"
                  style={{
                    top: 4,
                    bottom: 4,
                    left: 4,
                    width: 'calc(50% - 4px)',
                    borderRadius: 10,
                    background: '#FFFDF8',
                    boxShadow: '0 2px 6px -2px rgba(28,34,48,.2)',
                    transform: tab === 'nearby' ? 'translateX(100%)' : 'none',
                    transition: 'transform .4s cubic-bezier(.2,.8,.2,1)',
                  }}
                />
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
                    className="relative"
                    style={{ border: 'none', background: 'transparent', font: `${tab === item.id ? 600 : 500} 14px 'Geist'`, color: tab === item.id ? warm : 'rgba(28,34,48,.55)' }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto" style={{ padding: '12px 16px 40px', scrollbarWidth: 'none' }}>
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

            {hotelsActive && hotelsUrl && (
              <div className="mb-3 flex items-center gap-3 rounded-[18px] border border-text/[0.08] bg-white p-2.5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-bg-hover text-xl" aria-hidden="true">🛏️</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-small font-semibold text-text">Hoteles en {destination}</span>
                  <span className="block text-caption text-text-soft">No van dentro de los días: se reservan aparte.</span>
                </span>
                <a href={hotelsUrl} target="_blank" rel="noopener noreferrer" className="shrink-0 rounded-full border border-accent px-2.5 py-1 text-caption font-semibold text-accent transition-colors hover:bg-accent-soft">
                  Ver hoteles
                </a>
              </div>
            )}

            {needle && results.length === 0 && (
              <p className="py-10 text-center font-display text-text/55" style={{ fontSize: 22, lineHeight: 1.2 }}>
                No hay lugares con ese nombre
              </p>
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
                    onAdd={onQuickAddExcursion ? () => onQuickAddExcursion(excursion) : undefined}
                  />
                ))}
              </div>
            )}

            {onPick && !trimmedQuery && activeFilters.length === 0 && alsoInteresting.length > 0 && (
              <div className="mb-3">
                <p className="mb-1.5 text-caption font-semibold uppercase tracking-wide text-text-soft">También te puede interesar</p>
                <div className="flex flex-wrap gap-1.5">
                  {alsoInteresting.map((place) => {
                    const chip = findPlaceCategoryChip(place.filter_category)
                    return (
                      <button
                        key={place.name}
                        type="button"
                        onClick={() => setSelected(place)}
                        className="rounded-full border border-border px-2.5 py-1 text-caption font-medium text-text transition-colors hover:bg-bg-hover"
                      >
                        {chip?.icon ? `${chip.icon} ` : ''}
                        {place.name}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2.5">
              {results.map((place, index) => {
                const style = place.filter_category ? CATEGORY_STYLE[place.filter_category] : null
                const color = solidOf(style?.color ?? '#6B7280')
                const toilet = isOsmPoint(place)
                const likeCount = likes.counts.get(place.name) ?? 0
                const liked = likes.mine.has(place.name)
                const alreadyInRoute = !toilet && isNameAlreadyInRoute(place.name, stopEntries)
                const distance = position && hasRealCoordinates(place.coordinates) ? haversineMeters(position, place.coordinates) : null
                const active = toilet ? selectedToilet === poiId(place) : selected?.name === place.name
                const addLabel = alreadyInRoute && quickAddLabel === '+ Añadir' ? '✓ En ruta' : quickAddLabel
                const addDone = addLabel === '✓ En ruta'
                return (
                  <div
                    key={toilet ? poiId(place) : place.name}
                    className="relative flex h-[88px] shrink-0 bg-white transition-[border-color,box-shadow]"
                    style={{
                      borderRadius: 18,
                      border: `1px solid ${active ? color : 'rgba(28,34,48,.08)'}`,
                      boxShadow: active ? `0 14px 28px -16px ${color}` : '0 1px 2px rgba(28,34,48,.05),0 10px 24px -18px rgba(28,34,48,.35)',
                      animation: `explore-pop .4s cubic-bezier(.2,.8,.2,1) ${Math.min(index, 8) * 30}ms both`,
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        if (!toilet) return setSelected(place)
                        setSelectedToilet(poiId(place))
                        // Baños y fuentes no tienen ficha: el mapa se acerca hasta él (y se abre primero si estaba escondido).
                        setMapCollapsed(false)
                        setFlyTarget({ coordinates: place.coordinates, key: Date.now() })
                      }}
                      className={`flex min-w-0 flex-1 text-left ${closedToday(place) ? 'opacity-50' : ''}`}
                    >
                      <PlacePhotoPanel place={place} city={destination} color={color} icon={style?.icon ?? 'temple'} />
                      <span className="flex min-w-0 flex-1 flex-col justify-center gap-1" style={{ padding: '10px 0 10px 18px' }}>
                        <span className="truncate font-display text-text" style={{ fontSize: 18, lineHeight: 1.1 }}>
                          {place.name}
                        </span>
                        {(isRecommended(place) || closedToday(place)) && (
                          <span className="flex items-center gap-1.5">
                            {isRecommended(place) && <span className="rounded-full bg-accent-soft px-1.5 py-0.5 text-caption font-semibold text-accent-hover">Recomendado</span>}
                            {closedToday(place) && <span className="text-caption font-semibold text-text-muted">Hoy cierra</span>}
                          </span>
                        )}
                        <span className="flex items-center gap-1.5 overflow-hidden whitespace-nowrap text-text/60" style={{ font: "400 11.5px 'Geist'" }}>
                          {/* Un restaurante se elige por tipo y precio, no por cuánto se tarda en
                              verlo: donde una atracción pone su duración, este pone su sub-categoría
                              y su rango de precio. Un baño, si es de pago y si es accesible. */}
                          {place.kind === 'fountain' ? (
                            <>
                              <span className="shrink-0">Agua potable</span>
                              <span>·</span>
                              <span className="shrink-0">Gratis</span>
                            </>
                          ) : toilet ? (
                            <>
                              <span className="shrink-0">{place.de_pago === true ? 'De pago' : place.de_pago === false ? 'Gratis' : 'Precio sin dato'}</span>
                              <span>·</span>
                              <span className="shrink-0">{place.accesible === 'si' ? 'Accesible' : place.accesible === 'limitado' ? 'Acceso limitado' : place.accesible === 'no' ? 'No accesible' : 'Acceso sin dato'}</span>
                              {place.zone_label && (
                                <>
                                  <span>·</span>
                                  <span className="truncate">{place.zone_label}</span>
                                </>
                              )}
                            </>
                          ) : place.kind === 'restaurant' ? (
                            <>
                              {findRestaurantSubCategory(place.sub_category)?.label && <span className="shrink-0">{findRestaurantSubCategory(place.sub_category)?.label}</span>}
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
                                  <span className="inline-flex shrink-0 items-center gap-[3px]">
                                    <TicketIcon className="h-3 w-3" />
                                    Entrada
                                  </span>
                                </>
                              )}
                            </>
                          )}
                          {distance !== null && (
                            <>
                              <span>·</span>
                              <span className="shrink-0" style={{ font: "500 11px 'Geist Mono',monospace", color: warm }}>
                                {formatDistance(distance)}
                              </span>
                            </>
                          )}
                        </span>
                      </span>
                    </button>

                    {!toilet && (
                      <div className="flex shrink-0 flex-col items-end justify-between" style={{ padding: '6px 10px 9px 4px' }}>
                        <button
                          type="button"
                          onClick={() => onToggleLike(place)}
                          aria-pressed={liked}
                          aria-label={liked ? `Quitar me gusta de ${place.name}` : `Me gusta ${place.name}`}
                          className="flex h-[30px] min-w-[30px] items-center gap-[3px] px-1 transition-colors"
                          style={{ color: liked ? 'oklch(0.6 0.2 25)' : 'rgba(28,34,48,.55)', font: "500 12px 'Geist'" }}
                        >
                          <svg width="17" height="17" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
                            <path d={EXPLORE_ICONS.heart} />
                          </svg>
                          {likeCount > 0 && <span className="tabular-nums">{likeCount}</span>}
                        </button>
                        {onQuickAdd ? (
                          <button
                            type="button"
                            onClick={() => onQuickAdd(place)}
                            aria-label={`Añadir ${place.name}`}
                            className="whitespace-nowrap transition-colors"
                            style={{
                              height: 32,
                              padding: '0 11px',
                              borderRadius: 999,
                              border: `1.5px solid ${addDone ? 'rgb(var(--text))' : warm}`,
                              background: addDone ? 'rgb(var(--text))' : 'transparent',
                              color: addDone ? '#FFFDF8' : 'oklch(0.52 0.15 45)',
                              font: "600 12.5px 'Geist'",
                            }}
                          >
                            {addLabel}
                          </button>
                        ) : (
                          <span style={{ height: 32 }} />
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {(toiletsActive || fountainsActive) && !trimmedQuery && (
              <p className="pt-4 text-center text-text-muted" style={{ font: "400 11px 'Geist'" }}>
                {toiletsActive && fountainsActive ? 'Baños y fuentes' : fountainsActive ? 'Fuentes' : 'Baños públicos'} de{' '}
                <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="underline">
                  © OpenStreetMap
                </a>
                .
              </p>
            )}
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
              hours: withBookingNote(selected),
              hoursCard: selected.hours_card ?? null,
              reservation: selected.reservation ?? null,
              ticketInfo: selected.ticket_info ?? null,
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
            footerAction={onPick ? { label: dayNumber ? `Añadir a Día ${dayNumber} →` : 'Añadir a mi ruta →', onClick: addSelected } : onQuickAdd ? { label: '+ Añadir', onClick: () => onQuickAdd(selected) } : undefined}
            onClose={() => setSelected(null)}
          />
        )}
      </motion.div>
    </AnimatePresence>,
    document.body,
  )
}
