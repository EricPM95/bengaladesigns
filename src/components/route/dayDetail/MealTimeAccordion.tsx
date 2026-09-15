import { useEffect, useState } from 'react'
import type { Coordinates } from '../../../lib/types'
import { hasRealCoordinates } from '../../../lib/distanceMock'
import { reverseGeocodeZone } from '../../../lib/mapboxReverseGeocode'
import { fetchCuratedRestaurants, type CuratedRestaurant } from '../../../lib/mealRecommendationsApi'
import { searchNearbyPlaces, type NearbyPlaceResult } from '../../../lib/nearbyPlacesSearch'
import { fetchZonaTuristica } from '../../../lib/zonaTuristicaApi'
import { buildGoogleMapsUrlFromHere } from '../../../lib/mapsLinks'
import { Spinner } from '../../ui/Spinner'

const GOLD_BG = '#FDF3E2'
const GOLD_BORDER = '#F3DDA9'

/** ~15-20 min caminando (BLOQUE C, feedback de calidad: el radio por defecto de searchNearbyPlaces se sentía demasiado estrecho, de ahí el "no hemos podido valorar bien los restaurantes de la zona") — desplazamiento razonable para ir a comer sin ser absurdo. */
const NEARBY_RESTAURANT_RADIUS_METERS = 1400

interface MealTimeAccordionProps {
  /** Nombre del destino — clave del caché junto con `zona`/`franja` (route.destination). */
  destino: string
  /** Ciudad del día — título/búsqueda de reserva mientras la zona real (barrio) no ha resuelto todavía, y fallback si nunca resuelve. */
  city: string
  /** Coordenadas de la parada tras la que cae esta franja — ancla tanto para geocodificar el barrio como para "Rápido y cerca". */
  coordinates: Coordinates
  franja: 'comida' | 'cena'
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`h-4 w-4 shrink-0 text-text-muted transition-transform ${open ? 'rotate-180' : ''}`}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

function CuratedCard({ restaurant }: { restaurant: CuratedRestaurant }) {
  return (
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
          className="inline-block text-caption font-medium text-accent-hover underline underline-offset-2"
        >
          Cómo llegar
        </a>
      </div>
    </div>
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
 * Acordeón especial (fondo/borde dorado, diferenciado del resto de tarjetas de la ruta) que aparece
 * en el timeline de un día justo cuando cruza la franja de comida o cena — ver
 * `findMealInsertionIndex` en DayDetailPanel.tsx. Dos bloques bien distintos, nunca una lista plana:
 * "Nuestra selección" (2-3 restaurantes curados con búsqueda web real, cacheados en Supabase por
 * zona+franja — ver mealRecommendationsApi.ts, mismo patrón que fetchAnchorTips) y "Rápido y cerca"
 * (búsqueda en vivo de Mapbox por categoría/proximidad a la parada, sin curar ni cachear — ver
 * nearbyPlacesSearch.ts, ya usado por EXPLORAR "Comer y beber").
 *
 * El barrio se resuelve por geocodificación inversa de las coordenadas de la parada
 * (reverseGeocodeZone) en cuanto monta — ligero, así que no espera a que se abra el acordeón. Pero
 * ese resultado es un barrio/rione ADMINISTRATIVO (ej. en Roma: "Sant'Eustachio", "Ponte" — nombres
 * que solo conocen los locales), así que antes de mostrarlo se traduce a un nombre que un turista
 * reconocería vía /api/zona-turistica (zonaTuristicaApi.ts, cacheado por destino+zona en bruto) —
 * BLOQUE C del feedback de calidad. El TÍTULO solo muestra ese nombre turístico (`zonaMostrada`):
 * si ninguno aplica, se omite del todo ("Hora de comer" a secas, nunca un rione desconocido ni el
 * nombre genérico de la ciudad). El barrio en bruto (`zonaBusqueda`) SÍ se seguye usando como ancla
 * geográfica para la búsqueda de restaurantes (más preciso que el nombre de la ciudad), cae a `city`
 * mientras nada ha resuelto o si las coordenadas son de plantilla/mock. La generación curada (con
 * búsqueda web, más lenta/cara) es perezosa: solo se pide la primera vez que el viajero abre el
 * acordeón, nunca al montar.
 */
export function MealTimeAccordion({ destino, city, coordinates, franja }: MealTimeAccordionProps) {
  const [open, setOpen] = useState(false)
  const [zonaBusqueda, setZonaBusqueda] = useState(city)
  const [zonaMostrada, setZonaMostrada] = useState<string | null>(null)
  const [curated, setCurated] = useState<CuratedRestaurant[] | null>(null)
  const [nearby, setNearby] = useState<NearbyPlaceResult[] | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setZonaMostrada(null)
    if (!hasRealCoordinates(coordinates)) return
    let cancelled = false
    reverseGeocodeZone(coordinates).then((zonaBruta) => {
      if (cancelled || !zonaBruta) return
      setZonaBusqueda(zonaBruta)
      fetchZonaTuristica(destino, zonaBruta).then((zonaTuristica) => {
        if (!cancelled) setZonaMostrada(zonaTuristica)
      })
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coordinates.lat, coordinates.lng, destino])

  useEffect(() => {
    if (!open || curated !== null) return
    let cancelled = false
    setLoading(true)
    Promise.all([
      fetchCuratedRestaurants(destino, zonaBusqueda, franja),
      hasRealCoordinates(coordinates)
        ? searchNearbyPlaces(['restaurant'], coordinates, 'Restaurante cercano', undefined, NEARBY_RESTAURANT_RADIUS_METERS)
        : Promise.resolve([]),
    ]).then(([curatedResult, nearbyResult]) => {
      if (cancelled) return
      setCurated(curatedResult)
      setNearby(nearbyResult.slice(0, 3))
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const franjaLabel = franja === 'cena' ? 'Hora de cenar' : 'Hora de comer'

  return (
    <div className="overflow-hidden rounded-xl border" style={{ backgroundColor: GOLD_BG, borderColor: GOLD_BORDER }}>
      <button type="button" onClick={() => setOpen((value) => !value)} className="flex w-full items-center gap-3 p-3 text-left">
        <span
          aria-hidden="true"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-body"
          style={{ backgroundColor: GOLD_BORDER }}
        >
          🍽️
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-body font-semibold text-text">{zonaMostrada ? `${franjaLabel} en ${zonaMostrada}` : franjaLabel}</p>
          <p className="text-caption text-text-soft">Recomendaciones de restaurantes cerca</p>
        </div>
        <ChevronIcon open={open} />
      </button>

      {open && (
        <div className="space-y-4 border-t px-3 pb-3 pt-1" style={{ borderColor: GOLD_BORDER }}>
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
              {curated.map((restaurant) => (
                <CuratedCard key={restaurant.nombre} restaurant={restaurant} />
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
      )}
    </div>
  )
}
