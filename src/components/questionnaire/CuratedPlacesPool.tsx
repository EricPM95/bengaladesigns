import { useEffect, useState } from 'react'
import type { PoolPlace } from '../../lib/placePoolCache'
import { fetchPlacePhoto } from '../../lib/placePhoto'

/**
 * Ronda 10 — cuántos lugares del pool puede marcar el viajero, según lo que dure su viaje. El pool
 * tiene prioridad ABSOLUTA en la generación (ver planMustIncludePlacement en routeAlgorithm.js:
 * entra antes que los Imprescindibles y puede desplazar contenido curado para hacerse sitio), así
 * que el tope no es un capricho de interfaz — es lo que impide que un viaje de 2 días marque 15
 * lugares obligatorios y la ruta deje de tener forma. Al llegar al tope, el resto de tarjetas se
 * desactivan: sin alertas, sin popups, simplemente no se pueden marcar más.
 */
export function poolSelectionLimit(days: number | undefined): number {
  if (days === undefined) return 7
  if (days <= 2) return 5
  if (days <= 5) return 7
  return 10
}

interface CuratedPlacesPoolProps {
  destination: string
  places: PoolPlace[]
  selectedNames: string[]
  /** Tope de selección de ESTE viaje — ver poolSelectionLimit (lo calcula Questionnaire.tsx con `answers.days`). */
  limit: number
  onToggle: (name: string) => void
}

/**
 * Último paso "¿Cuáles te hacen ilusión?" del cuestionario, para destinos curados. Ronda 10: ya no
 * son tres niveles con botones "Ver más lugares" — es UN SOLO bloque de ~20 lugares (los
 * Imprescindibles del destino y los mejores del Nivel 2, ver CURATED_POOL_MAX_PLACES en
 * server/index.js) con un contador visible y un tope de selección por duración del viaje. Lo marcado
 * entra en la generación como obligatorio (must_include_places, ver App.tsx) con prioridad sobre
 * todo lo demás. Si no se marca nada, el pipeline decide solo según ritmo/experiencias, como siempre.
 *
 * Esto NO es "Añadir parada" (feature futura): allí se verán TODOS los lugares del destino, sin
 * tope, para insertarlos a mano en una ruta YA generada. Aquí se influye en la generación, antes.
 */
export function CuratedPlacesPool({ destination, places, selectedNames, limit, onToggle }: CuratedPlacesPoolProps) {
  const [photos, setPhotos] = useState<Record<string, string>>({})

  useEffect(() => {
    for (const place of places) {
      fetchPlacePhoto(place.name, destination).then((url) => {
        if (url) setPhotos((prev) => ({ ...prev, [place.name]: url }))
      })
    }
  }, [destination, places])

  const atLimit = selectedNames.length >= limit

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="font-dmsans text-small text-onb-text-soft">
          {atLimit ? 'Ya tienes tu lista — estos entran seguro en tu ruta' : 'Marca los que te apetezcan: esos entran seguro, el resto los elegimos nosotros'}
        </p>
        <span
          className={`shrink-0 rounded-onb-full px-2.5 py-1 font-dmsans text-caption font-semibold tabular-nums ${
            atLimit ? 'bg-onb-accent text-white' : 'bg-onb-card text-onb-text-soft'
          }`}
        >
          {selectedNames.length}/{limit}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {places.map((place) => {
          const selected = selectedNames.includes(place.name)
          // Al llegar al tope el resto se apaga visualmente y deja de ser clicable — pero los YA
          // marcados siguen activos, para poder desmarcar uno y cambiarlo por otro.
          const disabled = atLimit && !selected
          return (
            <button
              key={place.name}
              type="button"
              onClick={() => onToggle(place.name)}
              disabled={disabled}
              aria-pressed={selected}
              className={`relative overflow-hidden rounded-onb-md border text-left transition-all ${
                selected ? 'border-onb-accent' : 'border-onb-border hover:border-onb-accent/50'
              } ${disabled ? 'cursor-not-allowed opacity-40 grayscale' : ''}`}
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
