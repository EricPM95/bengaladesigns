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
import type { PlaceFilterCategory } from '../../lib/placeCategories'

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

type ExploreCategory = 'food' | 'viewpoints' | 'attractions'

const CATEGORIES: { id: ExploreCategory; icon: string; label: string }[] = [
  { id: 'food', icon: '🍽️', label: 'Comer y beber' },
  { id: 'viewpoints', icon: '📸', label: 'Miradores y fotos' },
  { id: 'attractions', icon: '🏛️', label: 'Atracciones' },
]

/** En destinos con catálogo curado, cada botón de EXPLORAR abre la MISMA pantalla que el "+" de DIAS
    con su filtro ya puesto — el viajero ve exactamente los mismos lugares busque desde donde busque. */
const CURATED_FILTER: Record<ExploreCategory, PlaceFilterCategory> = {
  food: 'restaurantes',
  viewpoints: 'miradores',
  attractions: 'monumentos',
}

/**
 * Pestaña EXPLORAR — 3 categorías, cada una con su propio formato (nunca un cuarto recuadro):
 * "Comer y beber"/"Miradores y fotos" reutilizan el mapa+tirador+botón de colapsar que ya comparte
 * DIAS (ver RouteView.tsx) — este panel solo publica sus resultados hacia ese mapa vía
 * `onMarkersChange`, sin mapa ni botón "volver" propios. "Atracciones" abre AttractionsFinder a
 * pantalla completa — acordeón "ya en tu ruta" + buscador libre, el mismo componente reutilizado
 * también en el "+" de DIAS y en RESERVAS.
 */
export function ExplorePanel({ route, defaultCity, onMarkersChange, activeResultId, onSelectResultId, onFullScreenChange }: ExplorePanelProps) {
  const cities = [...new Set(buildDestinationSegments(route.days).map((segment) => segment.city))]
  const [city, setCity] = useState(cities.includes(defaultCity) ? defaultCity : (cities[0] ?? defaultCity))
  const [activeCategory, setActiveCategory] = useState<ExploreCategory | null>(null)
  const [pendingStop, setPendingStop] = useState<Stop | null>(null)
  const [results, setResults] = useState<NearbyPlaceResult[] | null>(null)

  // Solo food/viewpoints publican marcadores hacia el mapa compartido — al salir de esa categoría
  // (o entrar en el selector/Atracciones) el mapa vuelve a mostrar el día activo, como siempre.
  useEffect(() => {
    if (activeCategory !== 'food' && activeCategory !== 'viewpoints') {
      onMarkersChange(null)
      return
    }
    onMarkersChange(results ? results.map(toMarker) : [])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory, results])

  useEffect(() => {
    // Al desmontar EXPLORAR entero (cambio de pestaña), devuelve el mapa compartido a su estado normal.
    return () => onMarkersChange(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const { places: curatedPool, resolved: curatedPoolResolved } = useDestinationPool(city, activeCategory !== null)
  const placeExplorerOpen = activeCategory !== null && curatedPoolResolved && curatedPool.length > 0

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

  const backToCategories = () => {
    setActiveCategory(null)
    setResults(null)
    onSelectResultId(null)
  }

  // Destino curado: las 3 categorías abren la pantalla compartida de lugares, sin acción de añadir
  // (desde EXPLORAR solo se consulta; para meter algo en la ruta se usa el "+" del día, que es quien
  // sabe en qué hueco va). Los destinos sin catálogo siguen con la búsqueda de Mapbox de siempre.
  if (placeExplorerOpen && activeCategory) {
    return (
      <PlaceExplorerScreen
        open
        destination={city}
        places={curatedPool}
        title={`Explorar ${city}`}
        subtitle={CATEGORIES.find((category) => category.id === activeCategory)?.label ?? null}
        route={route}
        initialCategories={[CURATED_FILTER[activeCategory]]}
        onClose={backToCategories}
      />
    )
  }

  // Aún no se sabe si esta ciudad tiene catálogo — un render sin nada antes que enseñar el buscador
  // viejo medio segundo y cambiarlo por la pantalla nueva.
  if (activeCategory !== null && !curatedPoolResolved) return null

  if (activeCategory === 'food' || activeCategory === 'viewpoints') {
    return (
      <NearbyPlacesView
        city={city}
        categoryLabel={activeCategory === 'food' ? 'Comer y beber' : 'Miradores y fotos'}
        categoryIds={activeCategory === 'food' ? ['restaurant', 'cafe'] : ['viewpoint']}
        onBack={backToCategories}
        results={results}
        onResultsChange={setResults}
        activeId={activeResultId}
        onSelectId={onSelectResultId}
      />
    )
  }

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

      <div className="grid grid-cols-3 gap-3">
        {CATEGORIES.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => setActiveCategory(category.id)}
            className="flex flex-col items-center gap-2 rounded-2xl border border-border p-4 text-center transition-colors hover:border-border-accent hover:bg-bg-hover"
          >
            <span className="text-3xl" aria-hidden="true">
              {category.icon}
            </span>
            <span className="text-caption font-semibold text-text">{category.label}</span>
          </button>
        ))}
      </div>

      {activeCategory === 'attractions' && (
        <AttractionsFinder
          route={route}
          city={city}
          open
          title={`🏛️ Atracciones en ${city}`}
          onPick={setPendingStop}
          onClose={() => setActiveCategory(null)}
        />
      )}

      <DayPositionPicker route={route} stop={pendingStop} onClose={() => setPendingStop(null)} onInserted={() => setPendingStop(null)} />
    </div>
  )
}
