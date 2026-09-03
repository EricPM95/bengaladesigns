import type { ExperienceId, PlaceCandidate } from '../../lib/types'
import { orderPlacesByExperience } from '../../lib/placeOrdering'
import { Spinner } from '../ui/Spinner'
import { Button } from '../ui/Button'

interface PlaceSelectorProps {
  destinationName: string
  places: PlaceCandidate[]
  loading: boolean
  failed: boolean
  selectedIds: string[]
  experiences: ExperienceId[]
  onToggle: (placeId: string) => void
  onToggleAll: () => void
  onRetry: () => void
}

/**
 * Lista amplia de lugares concretos (ver /api/suggest-places), tarjetas seleccionables con
 * checkbox — los afines a las experiencias ya elegidas salen primero, intercalados entre
 * categorías (ver orderPlacesByExperience). Los marcados aquí entran en la generación como anclas
 * de alta prioridad, no como sugerencia genérica.
 *
 * /api/suggest-places transmite los lugares por streaming (NDJSON, uno en cuanto Claude lo termina
 * de escribir) en vez de esperar a los 18-30 completos — así que `loading` y `places.length > 0`
 * pueden ser true a la vez (siguen llegando más) y el criterio de "aún no hay nada que mostrar" ya
 * no es solo `loading`, sino `loading && places.length === 0`. Mismo razonamiento para `failed`: con
 * 0 lugares es un fallo real (con su botón Reintentar); con algunos ya en pantalla, un aviso
 * discreto de que no llegaron más basta, no hace falta ocultar lo que sí se consiguió.
 */
export function PlaceSelector({ destinationName, places, loading, failed, selectedIds, experiences, onToggle, onToggleAll, onRetry }: PlaceSelectorProps) {
  if (places.length === 0) {
    if (loading) {
      return (
        <p className="flex items-center gap-2 text-small italic text-text-soft">
          <Spinner className="text-accent" />
          Buscando lugares en {destinationName}...
        </p>
      )
    }

    if (failed) {
      return (
        <div className="space-y-2">
          <p className="text-small text-text-soft">No hemos podido sugerir lugares para {destinationName} ahora mismo.</p>
          <Button onClick={onRetry}>Reintentar</Button>
        </div>
      )
    }
  }

  const mainAttractions = places.filter((place) => place.isMainAttraction)
  const ordered = orderPlacesByExperience(
    places.filter((place) => !place.isMainAttraction),
    experiences,
  )
  const allSelected = places.length > 0 && selectedIds.length === places.length

  const renderCard = (place: PlaceCandidate, highlighted: boolean) => {
    const selected = selectedIds.includes(place.id)
    return (
      <button
        key={place.id}
        type="button"
        onClick={() => onToggle(place.id)}
        className={`relative overflow-hidden rounded-xl border text-left transition-colors ${
          selected ? 'border-accent' : highlighted ? 'border-accent-gold' : 'border-border hover:border-border-accent'
        }`}
      >
        {highlighted && (
          <span className="absolute left-2 top-2 z-10 rounded-full bg-accent-gold px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
            ⭐ Imprescindible
          </span>
        )}
        <span
          className={`absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 text-caption font-bold ${
            selected ? 'border-accent bg-accent text-white' : 'border-white bg-black/30 text-transparent'
          }`}
          aria-hidden="true"
        >
          ✓
        </span>
        <img src={`https://picsum.photos/seed/${encodeURIComponent(place.id)}/400/280`} alt="" className="h-24 w-full object-cover" />
        <div className={`space-y-0.5 p-2 ${selected ? 'bg-accent-soft' : ''}`}>
          <p className="line-clamp-2 text-caption font-medium text-text">{place.name}</p>
          <p className="line-clamp-2 text-caption text-text-muted">{place.description}</p>
        </div>
      </button>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-caption text-text-muted">
          Marcados: {selectedIds.length}/{places.length}
        </p>
        <button type="button" onClick={onToggleAll} className="text-caption font-semibold text-accent hover:text-accent-hover">
          {allSelected ? 'Quitar todo' : 'Selecciona todo'}
        </button>
      </div>

      {mainAttractions.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-caption font-semibold uppercase tracking-wide text-text-muted">Atracciones principales de {destinationName}</p>
          <div className="grid grid-cols-2 gap-3">{mainAttractions.map((place) => renderCard(place, true))}</div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">{ordered.map((place) => renderCard(place, false))}</div>

      {loading && (
        <p className="flex items-center gap-2 text-caption italic text-text-soft">
          <Spinner className="text-accent" />
          Buscando más lugares en {destinationName}...
        </p>
      )}

      {!loading && failed && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-bg-card px-3 py-2">
          <p className="text-caption text-text-soft">No hemos podido cargar más lugares.</p>
          <button type="button" onClick={onRetry} className="shrink-0 text-caption font-semibold text-accent hover:text-accent-hover">
            Reintentar
          </button>
        </div>
      )}
    </div>
  )
}
