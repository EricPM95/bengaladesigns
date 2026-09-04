import { useEffect } from 'react'
import { searchPlaces } from '../../../lib/mapboxGeocoding'
import { searchNearbyPlaces, type NearbyPlaceResult } from '../../../lib/nearbyPlacesSearch'
import { buildAppleMapsUrlFromHere, buildGoogleMapsUrlFromHere } from '../../../lib/mapsLinks'
import { type StopsMapMarker } from '../../map/StopsMapView'

interface NearbyPlacesViewProps {
  city: string
  categoryLabel: string
  /** Categorías canónicas de la Search Box API de Mapbox (ver nearbyPlacesSearch.ts) — ej. ['restaurant', 'cafe']. */
  categoryIds: string[]
  onBack: () => void
  results: NearbyPlaceResult[] | null
  onResultsChange: (results: NearbyPlaceResult[] | null) => void
  activeId: string | null
  onSelectId: (id: string | null) => void
}

const MARKER_BG = 'rgb(var(--accent))'
const MARKER_TEXT = '#ffffff'

/** Mismo color fijo/numerado-por-posición que DIAS (ver buildSingleDayMarkers en RouteView.tsx) — aquí no hay concepto de "día", solo la lista de resultados en el orden mostrado. */
export function toMarker(place: NearbyPlaceResult, index: number): StopsMapMarker {
  return { id: place.id, name: place.name, coordinates: place.coordinates, number: index + 1, bg: MARKER_BG, text: MARKER_TEXT, photoUrl: place.photoUrl }
}

/**
 * Panel de EXPLORAR para "Comer y beber"/"Miradores y fotos" — SOLO la lista (sin mapa propio ni
 * botón "volver" flotante): el mapa de arriba y el tirador/botón de colapsar los pone RouteView.tsx
 * compartiendo el mismo mapa+panel que ya usa DIAS (ver `exploreMarkers` ahí), así que este
 * componente solo publica sus resultados hacia arriba vía `onResultsChange` y recibe cuál está
 * activo como prop controlada, en vez de dueño de su propio mapa. Nombre/ubicación son reales vía
 * Mapbox (mismo proveedor que el resto de la app); sin estrellas ni valoraciones (decisión: solo
 * Mapbox, sin duplicar proveedor de mapas con Google Places).
 */
export function NearbyPlacesView({ city, categoryLabel, categoryIds, onBack, results, onResultsChange, activeId, onSelectId }: NearbyPlacesViewProps) {
  useEffect(() => {
    let cancelled = false
    onResultsChange(null)

    searchPlaces(city).then((places) => {
      if (cancelled) return
      const center = places[0]?.coordinates
      if (!center) {
        onResultsChange([])
        return
      }
      searchNearbyPlaces(categoryIds, center, categoryLabel).then((found) => {
        if (cancelled) return
        onResultsChange(found)
      })
    })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city, categoryIds.join(','), categoryLabel])

  const failed = results !== null && results.length === 0

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 items-center gap-3 border-b border-border px-4 pb-3">
        <button type="button" onClick={onBack} className="text-caption font-semibold text-accent hover:text-accent-hover">
          ← Volver
        </button>
      </div>

      <div className="shrink-0 border-b border-border px-4 py-3">
        <h2 className="font-display text-h2 font-semibold text-text">{categoryLabel}</h2>
        <p className="text-small text-text-soft">Cerca de {city}</p>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {results === null && <p className="py-6 text-center text-small text-text-soft">Buscando {categoryLabel.toLowerCase()}…</p>}
        {failed && <p className="py-6 text-center text-small text-text-soft">No hemos encontrado resultados cerca de {city} ahora mismo.</p>}

        {results?.map((place, index) => {
          const expanded = activeId === place.id
          return (
            <div key={place.id} className={`overflow-hidden rounded-xl border transition-colors ${expanded ? 'border-accent bg-accent-soft/40' : 'border-border hover:border-border-accent'}`}>
              <button type="button" onClick={() => onSelectId(expanded ? null : place.id)} className="flex w-full items-center gap-3 p-2 text-left">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-caption font-semibold text-white">{index + 1}</span>
                <img src={place.photoUrl} alt="" className="h-16 w-16 shrink-0 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-small font-semibold text-text">{place.name}</p>
                  <p className="text-caption text-text-muted">{place.categoryLabel}</p>
                  <p className="truncate text-caption text-text-soft">{place.address}</p>
                </div>
              </button>

              {expanded && (
                <div className="space-y-2 border-t border-border p-3">
                  <p className="text-small text-text-soft">{place.address}</p>
                  <div className="flex gap-2">
                    <a
                      href={buildAppleMapsUrlFromHere(place.address || place.name)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 rounded-lg border border-border bg-bg-card px-3 py-2 text-center text-caption font-semibold text-text transition-colors hover:bg-bg-hover"
                    >
                      Apple Maps
                    </a>
                    <a
                      href={buildGoogleMapsUrlFromHere(place.address || place.name)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 rounded-lg border border-border bg-bg-card px-3 py-2 text-center text-caption font-semibold text-text transition-colors hover:bg-bg-hover"
                    >
                      Google Maps
                    </a>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
