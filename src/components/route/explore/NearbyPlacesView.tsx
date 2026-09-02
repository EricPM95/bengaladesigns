import { useEffect, useState } from 'react'
import type { Stop } from '../../../lib/types'
import { searchPlaces } from '../../../lib/mapboxGeocoding'
import { searchNearbyPlaces, type NearbyPlaceResult } from '../../../lib/nearbyPlacesSearch'
import { formatReviewCount } from '../../../lib/format'
import { MapPlaceholder } from '../../map/MapPlaceholder'

interface NearbyPlacesViewProps {
  city: string
  categoryLabel: string
  /** Categorías canónicas de la Search Box API de Mapbox (ver nearbyPlacesSearch.ts) — ej. ['restaurant', 'cafe']. */
  categoryIds: string[]
  onClose: () => void
}

function toMapStop(place: NearbyPlaceResult): Stop {
  return {
    id: place.id,
    time: '',
    name: place.name,
    description: '',
    durationMinutes: 0,
    coordinates: place.coordinates,
    photoUrl: place.photoUrl,
  }
}

/**
 * Vista de EXPLORAR para "Comer y beber"/"Miradores y fotos" — mismo patrón mapa arriba + panel
 * inferior ya usado en DIAS (aquí sin tirador arrastrable, solo visual, para no duplicar toda la
 * máquina de estados de resize de RouteView.tsx). Nombre/ubicación de cada resultado son REALES vía
 * Mapbox (mismo proveedor que el resto de la app, ver nearbyPlacesSearch.ts); valoración/reseñas son
 * mock — ninguna API ya integrada en la app expone esos datos.
 */
export function NearbyPlacesView({ city, categoryLabel, categoryIds, onClose }: NearbyPlacesViewProps) {
  const [results, setResults] = useState<NearbyPlaceResult[] | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    setResults(null)
    setFailed(false)

    searchPlaces(city).then((places) => {
      if (cancelled) return
      const center = places[0]?.coordinates
      if (!center) {
        setFailed(true)
        return
      }
      searchNearbyPlaces(categoryIds, center, categoryLabel).then((found) => {
        if (cancelled) return
        setResults(found)
        if (found.length === 0) setFailed(true)
      })
    })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city, categoryIds.join(','), categoryLabel])

  const activePlace = results?.find((place) => place.id === activeId) ?? null

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-bg md:flex-row">
      <div className="relative h-[45vh] shrink-0 md:h-auto md:flex-1">
        <MapPlaceholder destination={city} stops={(results ?? []).map(toMapStop)} activeStopId={activeId} onSelectStop={setActiveId} />
        <button
          type="button"
          onClick={onClose}
          className="absolute left-3 top-3 z-10 flex items-center gap-1.5 rounded-full bg-bg-card/90 px-3 py-2 text-caption font-semibold text-text shadow-md backdrop-blur-sm hover:bg-bg-card"
        >
          ← Volver
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:w-96 md:flex-none">
        <div className="flex shrink-0 items-center justify-center py-2 md:hidden">
          <span className="h-1.5 w-10 rounded-full bg-border" />
        </div>

        <div className="shrink-0 border-b border-border px-4 pb-3">
          <h2 className="font-display text-h2 font-semibold text-text">{categoryLabel}</h2>
          <p className="text-small text-text-soft">Cerca de {city}</p>
        </div>

        <div className="flex-1 space-y-2 overflow-y-auto p-3">
          {results === null && !failed && <p className="py-6 text-center text-small text-text-soft">Buscando {categoryLabel.toLowerCase()}…</p>}
          {failed && <p className="py-6 text-center text-small text-text-soft">No hemos encontrado resultados cerca de {city} ahora mismo.</p>}

          {results?.map((place) => (
            <button
              key={place.id}
              type="button"
              onClick={() => setActiveId(place.id)}
              className={`flex w-full items-center gap-3 rounded-xl border p-2 text-left transition-colors ${
                activePlace?.id === place.id ? 'border-accent bg-accent-soft/40' : 'border-border hover:border-border-accent'
              }`}
            >
              <img src={place.photoUrl} alt="" className="h-16 w-16 shrink-0 rounded-lg object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-small font-semibold text-text">{place.name}</p>
                <p className="text-caption text-text-muted">
                  ★{place.rating} ({formatReviewCount(place.reviewCount)})
                </p>
                <p className="truncate text-caption text-text-soft">{place.address}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
