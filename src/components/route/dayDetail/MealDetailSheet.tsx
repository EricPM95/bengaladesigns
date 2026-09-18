import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Coordinates } from '../../../lib/types'
import { hasRealCoordinates } from '../../../lib/distanceMock'
import { useZonaTuristica } from '../../../lib/useZonaTuristica'
import { useMealRecommendations } from '../../../lib/useMealRecommendations'
import type { CuratedRestaurant } from '../../../lib/mealRecommendationsApi'
import type { NearbyPlaceResult } from '../../../lib/nearbyPlacesSearch'
import { buildGoogleMapsUrlFromHere } from '../../../lib/mapsLinks'
import { StopsMapView, type StopsMapMarker } from '../../map/StopsMapView'
import type { DayStopRef } from './StopDetailSheet'
import { Spinner } from '../../ui/Spinner'

// Mismos límites/valor por defecto que StopDetailSheet.tsx — el mapa ocupa aprox. el tercio
// superior de la pantalla, con el mismo tirador arrastrable para agrandarlo/encogerlo.
const MAP_MIN_VH = 15
const MAP_MAX_VH = 75
const DEFAULT_MAP_VH = 33

const GOLD_BORDER = '#F3DDA9'

/** Paradas del día: contexto geográfico neutro — lo importante en esta pantalla son los restaurantes, no ellas (mismo gris "atenuado" que StopDetailSheet.tsx usa para las paradas que NO son la actual). */
const STOP_MARKER_BG = '#E5E7EB'
const STOP_MARKER_TEXT = '#6B7280'
/** Restaurantes — color e icono deliberadamente distintos de cualquier color de día/parada, para que se distingan de un vistazo (feedback de calidad: "marcadores diferenciados, ej. marcador rojo o icono de cubiertos"). */
const RESTAURANT_MARKER_BG = '#DC2626'
const RESTAURANT_MARKER_TEXT = '#ffffff'
const RESTAURANT_ICON = '🍴'

interface MealDetailSheetProps {
  /** null = cerrado. */
  open: boolean
  destino: string
  city: string
  /** Coordenadas de la parada tras la que cae esta franja — ancla de zona/búsqueda, ver useZonaTuristica/useMealRecommendations. */
  coordinates: Coordinates
  /** Barrio curado a mano (ver MealSlot.curatedZone) — cuando existe, se usa tal cual en vez de geocodificar en vivo, igual que MealTimeAccordion (alimenta la búsqueda de restaurantes). */
  curatedZone?: string | null
  /** Texto legible curado a mano para el TÍTULO (ver MealSlot.curatedZoneDisplay, Regla E) — solo para mostrar, nunca para buscar (la búsqueda sigue usando `curatedZone`/`zonaBusqueda`). */
  curatedZoneDisplay?: string | null
  franja: 'comida' | 'cena'
  /** Todas las paradas REALES del día (con coordenadas), para el mapa de contexto. */
  dayStops: DayStopRef[]
  onClose: () => void
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}

interface CuratedCardProps {
  id: string
  restaurant: CuratedRestaurant
  selectable: boolean
  active: boolean
  justHighlighted: boolean
  onSelect: () => void
  cardRef: (el: HTMLElement | null) => void
}

function CuratedCard({ restaurant, selectable, active, justHighlighted, onSelect, cardRef }: CuratedCardProps) {
  const content = (
    <div className="flex gap-3 rounded-xl border bg-white p-2.5" style={{ borderColor: GOLD_BORDER }}>
      <img src={restaurant.foto} alt="" className="h-16 w-16 shrink-0 rounded-lg object-cover" />
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <p className="min-w-0 truncate text-small font-semibold text-text">{restaurant.nombre}</p>
          <span className="shrink-0 text-caption font-semibold text-text-muted">{restaurant.presupuesto}</span>
        </div>
        <p className="text-caption text-text-soft">{restaurant.motivo}</p>
        <a
          href={buildGoogleMapsUrlFromHere(restaurant.nombre)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(event) => event.stopPropagation()}
          className="inline-block text-caption font-medium text-accent-hover underline underline-offset-2"
        >
          Cómo llegar
        </a>
      </div>
    </div>
  )

  if (!selectable) return <div ref={cardRef as (el: HTMLDivElement | null) => void}>{content}</div>

  return (
    <button
      ref={cardRef as (el: HTMLButtonElement | null) => void}
      type="button"
      onClick={onSelect}
      className={`w-full rounded-xl text-left transition-shadow ${active || justHighlighted ? 'ring-2 ring-accent' : ''}`}
    >
      {content}
    </button>
  )
}

function NearbyRow({ place }: { place: NearbyPlaceResult }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-bg-card p-2">
      <img src={place.photoUrl} alt="" className="h-11 w-11 shrink-0 rounded-lg object-cover" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-small font-medium text-text">{place.name}</p>
        <p className="truncate text-caption text-text-soft">{place.address}</p>
      </div>
      <a
        href={buildGoogleMapsUrlFromHere(place.address || place.name)}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 text-caption font-semibold text-accent-hover underline underline-offset-2"
      >
        Ir
      </a>
    </div>
  )
}

/**
 * Pantalla completa del bloque de comida/cena — mismo patrón mapa arriba + tirador + panel
 * deslizable que StopDetailSheet.tsx, ya no un acordeón inline (ver feedback de calidad, "Nueva
 * ventana para bloques de comida y cena"). El mapa combina TRES fuentes de marcadores que ya
 * existen en el store/estado del padre, sin pedir nada nuevo: las paradas del día (contexto, gris),
 * "Nuestra selección" (curados, rojo) y "Rápido y cerca" (Mapbox en vivo, rojo también) — el
 * `fitBounds` inicial de StopsMapView ya encuadra todo junto porque simplemente recibe el array
 * combinado.
 *
 * Interacción mapa↔lista: tocar un restaurante de "Nuestra selección" activa `activeRestaurantId`
 * (vuela la cámara a su marcador y lo escala, ver `flyToActiveStop` en StopsMapView.tsx; tocarlo de
 * nuevo lo deselecciona y la cámara vuelve al encuadre general). Tocar su marcador en el mapa hace
 * lo mismo en sentido inverso, con scroll automático de la lista hasta su tarjeta.
 */
export function MealDetailSheet({ open, destino, city, coordinates, curatedZone, curatedZoneDisplay, franja, dayStops, onClose }: MealDetailSheetProps) {
  const [mapVh, setMapVh] = useState(DEFAULT_MAP_VH)
  const [activeRestaurantId, setActiveRestaurantId] = useState<string | null>(null)
  const [justHighlighted, setJustHighlighted] = useState<string | null>(null)
  const cardRefs = useRef<Map<string, HTMLElement>>(new Map())

  const { zonaBusqueda, zonaMostrada } = useZonaTuristica(destino, city, coordinates, curatedZone)
  const { curated, nearby, loading } = useMealRecommendations(open, destino, zonaBusqueda, franja, coordinates)

  // Se resetea cada vez que la pantalla se cierra — reabrir siempre empieza en el encuadre general.
  useEffect(() => {
    if (!open) setActiveRestaurantId(null)
  }, [open])

  useEffect(() => {
    if (!activeRestaurantId) return
    cardRefs.current.get(activeRestaurantId)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    setJustHighlighted(activeRestaurantId)
    const timeout = setTimeout(() => setJustHighlighted(null), 1200)
    return () => clearTimeout(timeout)
  }, [activeRestaurantId])

  const handleDragStart = (event: ReactPointerEvent) => {
    event.preventDefault()
    const startY = event.clientY
    const startVh = mapVh
    const vhUnit = window.innerHeight / 100
    const clampedVh = (clientY: number) => Math.min(MAP_MAX_VH, Math.max(MAP_MIN_VH, startVh + (clientY - startY) / vhUnit))
    const onPointerMove = (moveEvent: PointerEvent) => setMapVh(clampedVh(moveEvent.clientY))
    const onPointerUp = (upEvent: PointerEvent) => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      setMapVh(clampedVh(upEvent.clientY))
    }
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
  }

  // Paradas de plantilla/mock sin generar todavía llevan coordenadas (0,0) (ver hasRealCoordinates
  // en distanceMock.ts) — incluirlas reventaría el encuadre del mapa igual que en el mapa combinado
  // de RUTA/DIAS (ver routeMapMarkers.ts), así que se filtran aquí también.
  const dayStopMarkers: StopsMapMarker[] = dayStops
    .filter((stop) => hasRealCoordinates(stop.coordinates))
    .map((stop, index) => ({
      id: stop.id,
      name: stop.name,
      coordinates: stop.coordinates,
      number: index + 1,
      bg: STOP_MARKER_BG,
      text: STOP_MARKER_TEXT,
      photoUrl: stop.photoUrl,
    }))

  const curatedWithId = (curated ?? []).map((restaurant, index) => ({ id: `curated-${index}`, restaurant }))
  const curatedMarkers: StopsMapMarker[] = curatedWithId
    .filter(({ restaurant }) => restaurant.latitude != null && restaurant.longitude != null)
    .map(({ id, restaurant }) => ({
      id,
      name: restaurant.nombre,
      coordinates: { lat: restaurant.latitude as number, lng: restaurant.longitude as number },
      number: 0,
      icon: RESTAURANT_ICON,
      bg: RESTAURANT_MARKER_BG,
      text: RESTAURANT_MARKER_TEXT,
      photoUrl: restaurant.foto,
    }))
  const curatedMarkerIds = new Set(curatedMarkers.map((marker) => marker.id))

  const nearbyMarkers: StopsMapMarker[] = (nearby ?? []).map((place) => ({
    id: place.id,
    name: place.name,
    coordinates: place.coordinates,
    number: 0,
    icon: RESTAURANT_ICON,
    bg: RESTAURANT_MARKER_BG,
    text: RESTAURANT_MARKER_TEXT,
    photoUrl: place.photoUrl,
  }))

  const markers: StopsMapMarker[] = [...dayStopMarkers, ...curatedMarkers, ...nearbyMarkers]

  const handleSelectCurated = (id: string) => {
    setActiveRestaurantId((prev) => (prev === id ? null : id))
  }

  const handleMarkerSelect = (id: string) => {
    if (curatedMarkerIds.has(id)) setActiveRestaurantId(id)
  }

  const franjaLabel = franja === 'cena' ? 'Hora de cenar' : 'Hora de comer'
  // Regla E: título con la zona curada ya formateada ("en el Centro Histórico") si existe; si no,
  // el fallback geocodificado en vivo de siempre. La línea "Buscando los mejores sitios de..." más
  // abajo sigue usando `zonaMostrada` sin este prefijo — es una zona de búsqueda, no un título.
  const zoneText = curatedZoneDisplay ?? (zonaMostrada ? `en ${zonaMostrada}` : null)

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-bg">
          <div className="relative shrink-0" style={{ height: `${mapVh}vh` }}>
            <StopsMapView markers={markers} activeStopId={activeRestaurantId} onSelectStop={handleMarkerSelect} flyToActiveStop />

            <button
              type="button"
              onClick={onClose}
              aria-label="Volver"
              title="Volver"
              className="absolute left-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 border-accent bg-bg-card/80 text-text shadow-md backdrop-blur transition-colors hover:bg-bg-hover"
            >
              <BackIcon />
            </button>
          </div>

          <div onPointerDown={handleDragStart} className="flex shrink-0 cursor-row-resize touch-none items-center justify-center bg-bg-card py-2">
            <span className="h-1.5 w-10 rounded-full bg-border" />
          </div>

          <div className="flex-1 overflow-y-auto bg-bg-card">
            <div className="mx-auto w-full max-w-lg space-y-4 px-4 pb-8 pt-2">
              <div>
                <h1 className="font-display text-h2 font-semibold text-text">{zoneText ? `${franjaLabel} ${zoneText}` : franjaLabel}</h1>
                <p className="text-small text-text-soft">Recomendaciones de restaurantes cerca</p>
              </div>

              {loading && (
                <p className="flex items-center gap-2 py-3 text-small text-text-soft">
                  <Spinner className="text-accent" />
                  {zonaMostrada ? `Buscando los mejores sitios de ${zonaMostrada}...` : 'Buscando los mejores sitios cercanos...'}
                </p>
              )}

              {!loading && curated && (
                <div className="space-y-2">
                  <p className="text-caption font-semibold uppercase tracking-wide text-text-muted">Nuestra selección</p>
                  {curated.length === 0 && <p className="text-small text-text-soft">No hemos podido verificar recomendaciones fiables en esta zona todavía.</p>}
                  {curatedWithId.map(({ id, restaurant }) => (
                    <CuratedCard
                      key={id}
                      id={id}
                      restaurant={restaurant}
                      selectable={curatedMarkerIds.has(id)}
                      active={activeRestaurantId === id}
                      justHighlighted={justHighlighted === id}
                      onSelect={() => handleSelectCurated(id)}
                      cardRef={(el) => {
                        if (el) cardRefs.current.set(id, el)
                        else cardRefs.current.delete(id)
                      }}
                    />
                  ))}
                </div>
              )}

              {!loading && nearby && nearby.length > 0 && (
                <div className="space-y-2">
                  <p className="text-caption font-semibold uppercase tracking-wide text-text-muted">Rápido y cerca</p>
                  {nearby.map((place) => (
                    <NearbyRow key={place.id} place={place} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
