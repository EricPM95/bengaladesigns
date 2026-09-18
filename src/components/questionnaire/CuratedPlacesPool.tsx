import { useEffect, useState } from 'react'
import { fetchPoolLevel, type PoolPlace } from '../../lib/placePoolCache'
import { fetchPlacePhoto } from '../../lib/placePhoto'
import { Spinner } from '../ui/Spinner'

const LEVEL_TITLE: Record<1 | 2 | 3, string> = {
  1: 'Imprescindibles',
  2: 'Más lugares recomendados',
  3: 'Para quien quiere ver todavía más',
}

interface CuratedPlacesPoolProps {
  destination: string
  level1: PoolPlace[]
  selectedNames: string[]
  onToggle: (name: string) => void
}

/**
 * Punto 6 del prompt DEFINITIVO, reescrito: YA NO es una pantalla aparte de solo consulta — es el
 * propio último paso "Elige lugares" del cuestionario, para destinos curados. Nivel 1 llega ya
 * cargado (ver Questionnaire.tsx, que lo pide en cuanto se conoce el destino); Nivel 2/3 bajo demanda
 * con "Ver más lugares". A diferencia de la versión anterior, aquí SÍ se selecciona a mano — lo
 * marcado entra en la generación como obligatorio (must_include_places, ver App.tsx), igual que ya
 * hacía "Elige lugares" con las sugerencias de Claude para destinos no curados (PlaceSelector.tsx).
 * Si no se marca nada, el pipeline decide solo según ritmo/experiencias, como siempre.
 */
export function CuratedPlacesPool({ destination, level1, selectedNames, onToggle }: CuratedPlacesPoolProps) {
  const [levels, setLevels] = useState<Partial<Record<1 | 2 | 3, PoolPlace[]>>>({ 1: level1 })
  const [photos, setPhotos] = useState<Record<string, string>>({})
  const [loadingLevel, setLoadingLevel] = useState<2 | 3 | null>(null)

  useEffect(() => {
    setLevels({ 1: level1 })
    loadPhotos(destination, level1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destination, level1])

  function loadPhotos(destinationName: string, places: PoolPlace[]) {
    for (const place of places) {
      fetchPlacePhoto(place.name, destinationName).then((url) => {
        if (url) setPhotos((prev) => ({ ...prev, [place.name]: url }))
      })
    }
  }

  const loadMore = (level: 2 | 3) => {
    if (levels[level] || loadingLevel) return
    setLoadingLevel(level)
    fetchPoolLevel(destination, level).then((result) => {
      setLoadingLevel(null)
      if (!result.found) return
      setLevels((prev) => ({ ...prev, [level]: result.places }))
      loadPhotos(destination, result.places)
    })
  }

  const level2 = levels[2]
  const level3 = levels[3]

  return (
    <div className="space-y-4">
      <p className="font-dmsans text-small text-onb-text-soft">
        {selectedNames.length > 0
          ? `${selectedNames.length} marcado${selectedNames.length === 1 ? '' : 's'} — entran seguro en tu ruta`
          : 'Marca los que quieras ver seguro — el resto los elegimos según tu ritmo y experiencias'}
      </p>

      <PoolLevelSection title={LEVEL_TITLE[1]} places={level1} photos={photos} selectedNames={selectedNames} onToggle={onToggle} />

      {!level2 && (
        <button
          type="button"
          onClick={() => loadMore(2)}
          disabled={loadingLevel === 2}
          className="mx-auto flex items-center gap-2 rounded-onb-full border border-onb-border bg-onb-card px-5 py-2.5 font-dmsans text-small font-semibold text-onb-text transition-colors hover:border-onb-accent/50 disabled:opacity-60"
        >
          {loadingLevel === 2 ? <Spinner className="text-onb-accent" /> : null}
          Ver más lugares
        </button>
      )}

      {level2 && <PoolLevelSection title={LEVEL_TITLE[2]} places={level2} photos={photos} selectedNames={selectedNames} onToggle={onToggle} />}

      {level2 && !level3 && (
        <button
          type="button"
          onClick={() => loadMore(3)}
          disabled={loadingLevel === 3}
          className="mx-auto flex items-center gap-2 rounded-onb-full border border-onb-border bg-onb-card px-5 py-2.5 font-dmsans text-small font-semibold text-onb-text transition-colors hover:border-onb-accent/50 disabled:opacity-60"
        >
          {loadingLevel === 3 ? <Spinner className="text-onb-accent" /> : null}
          Ver más lugares
        </button>
      )}

      {level3 && <PoolLevelSection title={LEVEL_TITLE[3]} places={level3} photos={photos} selectedNames={selectedNames} onToggle={onToggle} />}
    </div>
  )
}

function PoolLevelSection({
  title,
  places,
  photos,
  selectedNames,
  onToggle,
}: {
  title: string
  places: PoolPlace[]
  photos: Record<string, string>
  selectedNames: string[]
  onToggle: (name: string) => void
}) {
  if (places.length === 0) return null
  return (
    <div className="space-y-2">
      <p className="font-dmsans text-caption font-semibold uppercase tracking-wide text-onb-text-muted">{title}</p>
      <div className="grid grid-cols-2 gap-3">
        {places.map((place) => {
          const selected = selectedNames.includes(place.name)
          return (
            <button
              key={place.name}
              type="button"
              onClick={() => onToggle(place.name)}
              className={`relative overflow-hidden rounded-onb-md border text-left transition-colors ${
                selected ? 'border-onb-accent' : 'border-onb-border hover:border-onb-accent/50'
              }`}
            >
              <span
                className={`absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 text-caption font-bold ${
                  selected ? 'border-onb-accent bg-onb-accent text-white' : 'border-white bg-black/30 text-transparent'
                }`}
                aria-hidden="true"
              >
                ✓
              </span>
              <img
                src={photos[place.name] ?? `https://picsum.photos/seed/${encodeURIComponent(place.name)}/400/280`}
                alt=""
                className="h-24 w-full object-cover"
              />
              <div className={`space-y-0.5 p-2 ${selected ? 'bg-onb-accent-light' : 'bg-onb-card'}`}>
                <p className="line-clamp-2 font-dmsans text-caption font-medium text-onb-text">{place.name}</p>
                <p className="line-clamp-1 font-dmsans text-caption text-onb-text-muted">
                  {[place.category, place.duration_min ? `~${place.duration_min}min` : null].filter(Boolean).join(' · ')}
                </p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
