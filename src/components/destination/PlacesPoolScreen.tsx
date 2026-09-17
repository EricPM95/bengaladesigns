import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useRouteStore } from '../../store/useRouteStore'
import { fetchPoolLevel, type PoolPlace } from '../../lib/placePoolCache'
import { fetchPlacePhoto } from '../../lib/placePhoto'
import { Spinner } from '../ui/Spinner'

const LEVEL_TITLE: Record<1 | 2 | 3, string> = {
  1: 'Imprescindibles',
  2: 'Más lugares recomendados',
  3: 'Para quien quiere ver todavía más',
}

/**
 * "Pool de lugares" (punto 6 del prompt DEFINITIVO) — se muestra al confirmar destino, ANTES del
 * cuestionario/generación. Puramente de CONSULTA: el viajero ve lo que hay en el destino, no
 * selecciona nada aquí (eso ya existe en "Elige lugares", un paso distinto dentro del cuestionario,
 * ver PlaceSelector.tsx). Nivel 1 se pide en cuanto se monta la pantalla; Nivel 2/3 solo bajo
 * demanda ("Ver más lugares"). Si el destino no está en el JSON curado, esta pantalla se salta sola
 * (found:false en el primer fetch) sin que el viajero llegue a verla.
 */
export function PlacesPoolScreen() {
  const destination = useRouteStore((state) => state.destination)
  const setScreen = useRouteStore((state) => state.setScreen)

  const [levels, setLevels] = useState<Partial<Record<1 | 2 | 3, PoolPlace[]>>>({})
  const [photos, setPhotos] = useState<Record<string, string>>({})
  const [loadingLevel, setLoadingLevel] = useState<1 | 2 | 3 | null>(1)
  const [notCurated, setNotCurated] = useState(false)

  const continueToQuestionnaire = () => setScreen('questionnaire')

  useEffect(() => {
    if (!destination) return
    let cancelled = false
    setLoadingLevel(1)
    fetchPoolLevel(destination, 1).then((result) => {
      if (cancelled) return
      setLoadingLevel(null)
      if (!result.found) {
        setNotCurated(true)
        return
      }
      setLevels((prev) => ({ ...prev, 1: result.places }))
      loadPhotos(destination, result.places)
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destination])

  // Destino no curado — no hay nada que mostrar aquí, se pasa directo al cuestionario sin que el
  // viajero llegue a ver esta pantalla (ver regla del punto 6: "si el destino NO está en el JSON
  // curado, esta pantalla no se muestra").
  useEffect(() => {
    if (notCurated) continueToQuestionnaire()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notCurated])

  function loadPhotos(destinationName: string, places: PoolPlace[]) {
    for (const place of places) {
      fetchPlacePhoto(place.name, destinationName).then((url) => {
        if (url) setPhotos((prev) => ({ ...prev, [place.name]: url }))
      })
    }
  }

  const loadMore = (level: 2 | 3) => {
    if (!destination || levels[level] || loadingLevel) return
    setLoadingLevel(level)
    fetchPoolLevel(destination, level).then((result) => {
      setLoadingLevel(null)
      if (!result.found) return
      setLevels((prev) => ({ ...prev, [level]: result.places }))
      loadPhotos(destination, result.places)
    })
  }

  if (!destination || notCurated) return null

  const level1 = levels[1]
  const level2 = levels[2]
  const level3 = levels[3]

  return (
    <motion.div
      key="places-pool"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -24 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex min-h-[100svh] flex-col bg-onb-bg px-6 pb-8 pt-10"
    >
      <div className="mx-auto w-full max-w-md flex-1">
        <div className="text-center">
          <h1 className="font-playfair text-3xl font-bold text-onb-text">Lugares de {destination}</h1>
          <p className="mt-2 font-dmsans text-body text-onb-text-soft">Un vistazo a lo que te espera, antes de armar tu ruta</p>
        </div>

        <div className="mt-6 space-y-6">
          {!level1 && loadingLevel === 1 && (
            <p className="flex items-center justify-center gap-2 text-small italic text-onb-text-soft">
              <Spinner className="text-onb-accent" />
              Cargando lugares de {destination}...
            </p>
          )}

          {level1 && <PoolLevelSection title={LEVEL_TITLE[1]} places={level1} photos={photos} />}

          {level1 && !level2 && (
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

          {level2 && <PoolLevelSection title={LEVEL_TITLE[2]} places={level2} photos={photos} />}

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

          {level3 && <PoolLevelSection title={LEVEL_TITLE[3]} places={level3} photos={photos} />}
        </div>
      </div>

      <div className="mx-auto mt-8 w-full max-w-md">
        <button
          type="button"
          onClick={continueToQuestionnaire}
          className="w-full rounded-onb-full bg-onb-accent py-3.5 font-dmsans text-body font-semibold text-white transition-colors hover:bg-onb-accent-hover"
        >
          Continuar →
        </button>
      </div>
    </motion.div>
  )
}

function PoolLevelSection({ title, places, photos }: { title: string; places: PoolPlace[]; photos: Record<string, string> }) {
  if (places.length === 0) return null
  return (
    <div className="space-y-2">
      <p className="font-dmsans text-caption font-semibold uppercase tracking-wide text-onb-text-muted">{title}</p>
      <div className="grid grid-cols-2 gap-3">
        {places.map((place) => (
          <div key={place.name} className="overflow-hidden rounded-onb-md border border-onb-border bg-onb-card">
            <img
              src={photos[place.name] ?? `https://picsum.photos/seed/${encodeURIComponent(place.name)}/400/280`}
              alt=""
              className="h-24 w-full object-cover"
            />
            <div className="space-y-0.5 p-2">
              <p className="line-clamp-2 font-dmsans text-caption font-medium text-onb-text">{place.name}</p>
              <p className="line-clamp-1 font-dmsans text-caption text-onb-text-muted">
                {[place.category, place.duration_min ? `~${place.duration_min}min` : null].filter(Boolean).join(' · ')}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
