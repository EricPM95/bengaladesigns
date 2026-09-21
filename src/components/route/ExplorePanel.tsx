import { useEffect, useState } from 'react'
import type { Route, Stop } from '../../lib/types'
import { buildDestinationSegments } from '../../lib/destinationSegments'
import type { StopsMapMarker } from '../map/StopsMapView'
import type { NearbyPlaceResult } from '../../lib/nearbyPlacesSearch'
import { AttractionsFinder } from './attractionsFinder/AttractionsFinder'
import { DayPositionPicker } from './dayDetail/DayPositionPicker'
import { NearbyPlacesView, toMarker } from './explore/NearbyPlacesView'
import { PlaceExplorerScreen } from './placeExplorer/PlaceExplorerScreen'
import { useDestinationPool } from '../../lib/useDestinationPool'
import { categoriesForFilters, type PlaceFilterId } from '../../lib/placeCategories'
import { BOOKING_BLUE, buildHotelSearchUrl } from '../../lib/affiliateLinks'

interface ExplorePanelProps {
  route: Route
  /** Ciudad del día activo — punto de partida por defecto al entrar desde DIAS ("pestaña global del día activo"). */
  defaultCity: string
  /** El mapa compartido de RouteView.tsx (mismo mapa+tirador+botón de colapsar que DIAS) — mientras "Comer y beber"/"Miradores y fotos" está activo, sus resultados sustituyen a las paradas del día en ese mapa; null lo devuelve a mostrar el día activo. */
  onMarkersChange: (markers: StopsMapMarker[] | null) => void
  activeResultId: string | null
  onSelectResultId: (id: string | null) => void
  /** true mientras la pantalla de lugares (con su propio mapa) está abierta a pantalla completa — RouteView desmonta el mapa compartido mientras tanto (ver exploreFullScreen ahí). */
  onFullScreenChange: (open: boolean) => void
}

/**
 * Las seis tarjetas de EXPLORAR. Cinco abren la pantalla de lugares con su filtro ya puesto — el
 * mismo componente y el mismo catálogo que el "+" de DIAS, para que el viajero vea exactamente los
 * mismos sitios busque desde donde busque. La sexta (hoteles) es la única que sale de la app.
 *
 * 'hotels' no es un filtro de la pantalla de lugares y por eso no está en PLACE_FILTER_CHIPS: un
 * hotel no es un sitio que visitar, y en "Añadir parada" no pintaría nada.
 */
type ExploreCardId = PlaceFilterId | 'hotels'

const EXPLORE_CARDS: { id: ExploreCardId; icon: string; label: string }[] = [
  { id: 'atracciones', icon: '🏛️', label: 'Atracciones' },
  { id: 'miradores', icon: '📸', label: 'Miradores' },
  { id: 'restaurantes', icon: '🍽️', label: 'Restaurantes' },
  { id: 'entradas', icon: '🎟️', label: 'Entradas' },
  { id: 'excursiones', icon: '🚌', label: 'Excursiones' },
  { id: 'hotels', icon: '🏨', label: 'Hoteles' },
]

/**
 * Destinos SIN catálogo curado: ahí no hay lugares que filtrar, así que las tarjetas siguen cayendo
 * en los buscadores de siempre (Mapbox para comer y miradores, AttractionsFinder para atracciones).
 * Las tarjetas que no tienen equivalente sin catálogo (entradas, excursiones) no se pintan.
 */
const LEGACY_FALLBACK: Partial<Record<ExploreCardId, 'food' | 'viewpoints' | 'attractions'>> = {
  restaurantes: 'food',
  miradores: 'viewpoints',
  atracciones: 'attractions',
}

/**
 * Pestaña EXPLORAR — seis tarjetas en rejilla de dos columnas, cada una con su contador real (no
 * hay número inventado: sale del catálogo del destino que ya está cargado). Sin catálogo curado se
 * cae a los buscadores de siempre y la rejilla se queda en las tres tarjetas que sí saben qué hacer.
 */
export function ExplorePanel({ route, defaultCity, onMarkersChange, activeResultId, onSelectResultId, onFullScreenChange }: ExplorePanelProps) {
  const cities = [...new Set(buildDestinationSegments(route.days).map((segment) => segment.city))]
  const [city, setCity] = useState(cities.includes(defaultCity) ? defaultCity : (cities[0] ?? defaultCity))
  const [activeCard, setActiveCard] = useState<ExploreCardId | null>(null)
  const [pendingStop, setPendingStop] = useState<Stop | null>(null)
  const [results, setResults] = useState<NearbyPlaceResult[] | null>(null)

  // El catálogo se pide al entrar en la pestaña, no al pulsar una tarjeta: los contadores salen de
  // él y tienen que estar ya en la rejilla. Es una sola petición por destino y sesión (se cachea).
  const { places: curatedPool, excursions, resolved: curatedPoolResolved } = useDestinationPool(city, true)
  const hasCuratedCatalog = curatedPoolResolved && curatedPool.length > 0
  const legacyCategory = activeCard ? LEGACY_FALLBACK[activeCard] : undefined

  // Solo los buscadores viejos publican marcadores hacia el mapa compartido — al salir de esa
  // categoría el mapa vuelve a mostrar el día activo, como siempre.
  useEffect(() => {
    if (hasCuratedCatalog || (legacyCategory !== 'food' && legacyCategory !== 'viewpoints')) {
      onMarkersChange(null)
      return
    }
    onMarkersChange(results ? results.map(toMarker) : [])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [legacyCategory, hasCuratedCatalog, results])

  useEffect(() => {
    // Al desmontar EXPLORAR entero (cambio de pestaña), devuelve el mapa compartido a su estado normal.
    return () => onMarkersChange(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const placeExplorerOpen = activeCard !== null && activeCard !== 'hotels' && hasCuratedCatalog

  // Avisa a RouteView de que hay una pantalla con mapa propio encima, para que desmonte el mapa
  // compartido mientras tanto (ver exploreFullScreen ahí).
  useEffect(() => {
    onFullScreenChange(placeExplorerOpen)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placeExplorerOpen])

  useEffect(() => {
    return () => onFullScreenChange(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const backToCards = () => {
    setActiveCard(null)
    setResults(null)
    onSelectResultId(null)
  }

  /** Cuántos elementos hay detrás de cada tarjeta. Null = no se cuenta (hoteles no es un catálogo nuestro). */
  const countFor = (id: ExploreCardId): number | null => {
    if (id === 'hotels') return null
    if (id === 'excursiones') return excursions.length
    if (id === 'entradas') return curatedPool.filter((place) => place.requires_ticket).length
    const categories = categoriesForFilters([id])
    return curatedPool.filter((place) => place.filter_category !== null && categories.includes(place.filter_category)).length
  }

  const countLabel = (id: ExploreCardId): string => {
    if (id === 'hotels') return 'Buscar hotel'
    const count = countFor(id)
    if (count === null) return ''
    if (id === 'excursiones') return `${count} ${count === 1 ? 'opción' : 'opciones'}`
    if (id === 'entradas') return `${count} con entrada`
    if (id === 'restaurantes') return `${count} ${count === 1 ? 'sitio' : 'sitios'}`
    return `${count} ${count === 1 ? 'lugar' : 'lugares'}`
  }

  // Destino curado: las tarjetas abren la pantalla compartida de lugares, sin acción de añadir
  // (desde EXPLORAR solo se consulta; para meter algo en la ruta se usa el "+" del día, que es quien
  // sabe en qué hueco va). Los destinos sin catálogo siguen con la búsqueda de Mapbox de siempre.
  if (placeExplorerOpen && activeCard) {
    return (
      <PlaceExplorerScreen
        open
        destination={city}
        places={curatedPool}
        excursions={excursions}
        title={`Explorar ${city}`}
        subtitle={EXPLORE_CARDS.find((card) => card.id === activeCard)?.label ?? null}
        route={route}
        initialFilters={[activeCard]}
        onClose={backToCards}
      />
    )
  }

  // Aún no se sabe si esta ciudad tiene catálogo — un render sin nada antes que enseñar el buscador
  // viejo medio segundo y cambiarlo por la pantalla nueva.
  if (activeCard !== null && activeCard !== 'hotels' && !curatedPoolResolved) return null

  if (!hasCuratedCatalog && (legacyCategory === 'food' || legacyCategory === 'viewpoints')) {
    return (
      <NearbyPlacesView
        city={city}
        categoryLabel={legacyCategory === 'food' ? 'Comer y beber' : 'Miradores y fotos'}
        categoryIds={legacyCategory === 'food' ? ['restaurant', 'cafe'] : ['viewpoint']}
        onBack={backToCards}
        results={results}
        onResultsChange={setResults}
        activeId={activeResultId}
        onSelectId={onSelectResultId}
      />
    )
  }

  const visibleCards = hasCuratedCatalog
    ? EXPLORE_CARDS.filter((card) => card.id !== 'excursiones' || excursions.length > 0)
    : EXPLORE_CARDS.filter((card) => LEGACY_FALLBACK[card.id] !== undefined || card.id === 'hotels')

  return (
    <div className="flex-1 space-y-5 overflow-y-auto p-4">
      <div>
        <h2 className="font-display text-h2 font-semibold text-text">Explorar {city}</h2>
        <p className="mt-1 text-small text-text-soft">Elige qué quieres descubrir.</p>
      </div>

      {cities.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {cities.map((candidate) => (
            <button
              key={candidate}
              type="button"
              onClick={() => setCity(candidate)}
              className={`rounded-full px-3 py-1.5 text-caption font-semibold transition-colors ${
                candidate === city ? 'bg-accent text-white' : 'bg-bg-hover text-text-soft hover:bg-border'
              }`}
            >
              {candidate}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {visibleCards.map((card) => {
          const label = countLabel(card.id)
          // Hoteles sale de la app: es un enlace de verdad, no un botón que finge serlo (así el
          // viajero puede abrirlo en otra pestaña si quiere). Ver affiliateLinks.ts.
          if (card.id === 'hotels') {
            return (
              <a
                key={card.id}
                href={buildHotelSearchUrl(city, route.answers.dateRange?.start, route.answers.dateRange?.end)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-start gap-1.5 rounded-2xl border border-border p-4 text-left transition-colors hover:border-border-accent hover:bg-bg-hover"
              >
                <span className="text-2xl" aria-hidden="true">
                  {card.icon}
                </span>
                <span className="text-small font-semibold text-text">{card.label}</span>
                <span className="text-caption font-medium" style={{ color: BOOKING_BLUE }}>
                  {label} ↗
                </span>
              </a>
            )
          }
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => setActiveCard(card.id)}
              className="flex flex-col items-start gap-1.5 rounded-2xl border border-border p-4 text-left transition-colors hover:border-border-accent hover:bg-bg-hover"
            >
              <span className="text-2xl" aria-hidden="true">
                {card.icon}
              </span>
              <span className="text-small font-semibold text-text">{card.label}</span>
              {/* El contador solo aparece cuando hay catálogo del que sacarlo — nunca un número inventado. */}
              <span className="text-caption text-text-muted">{hasCuratedCatalog ? label : 'Buscar'}</span>
            </button>
          )
        })}
      </div>

      {!hasCuratedCatalog && legacyCategory === 'attractions' && (
        <AttractionsFinder
          route={route}
          city={city}
          open
          title={`🏛️ Atracciones en ${city}`}
          onPick={setPendingStop}
          onClose={backToCards}
        />
      )}

      <DayPositionPicker route={route} stop={pendingStop} onClose={() => setPendingStop(null)} onInserted={() => setPendingStop(null)} />
    </div>
  )
}
