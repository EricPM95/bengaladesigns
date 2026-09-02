import { useState } from 'react'
import type { Route } from '../../lib/types'
import { buildDestinationSegments } from '../../lib/destinationSegments'
import { AttractionsPoolView } from './explore/AttractionsPoolView'
import { NearbyPlacesView } from './explore/NearbyPlacesView'

interface ExplorePanelProps {
  route: Route
  /** Ciudad del día activo — punto de partida por defecto al entrar desde DIAS ("pestaña global del día activo"). */
  defaultCity: string
}

type ExploreCategory = 'food' | 'viewpoints' | 'attractions'

const CATEGORIES: { id: ExploreCategory; icon: string; label: string }[] = [
  { id: 'food', icon: '🍽️', label: 'Comer y beber' },
  { id: 'viewpoints', icon: '📸', label: 'Miradores y fotos' },
  { id: 'attractions', icon: '🏛️', label: 'Atracciones' },
]

/**
 * Pestaña EXPLORAR — 3 categorías, cada una con su propio formato (nunca un cuarto recuadro):
 * "Comer y beber"/"Miradores y fotos" abren NearbyPlacesView (mapa + lista real vía Mapbox,
 * valoraciones mock); "Atracciones" abre el Pool ya implementado (AttractionsPoolView), filtrado a
 * esa única categoría del banco de 18.
 */
export function ExplorePanel({ route, defaultCity }: ExplorePanelProps) {
  const cities = [...new Set(buildDestinationSegments(route.days).map((segment) => segment.city))]
  const [city, setCity] = useState(cities.includes(defaultCity) ? defaultCity : (cities[0] ?? defaultCity))
  const [activeCategory, setActiveCategory] = useState<ExploreCategory | null>(null)

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

      {activeCategory === 'food' && (
        <NearbyPlacesView city={city} categoryLabel="Comer y beber" categoryIds={['restaurant', 'cafe']} onClose={() => setActiveCategory(null)} />
      )}
      {activeCategory === 'viewpoints' && (
        <NearbyPlacesView city={city} categoryLabel="Miradores y fotos" categoryIds={['viewpoint']} onClose={() => setActiveCategory(null)} />
      )}
      {activeCategory === 'attractions' && <AttractionsPoolView route={route} city={city} onClose={() => setActiveCategory(null)} />}
    </div>
  )
}
