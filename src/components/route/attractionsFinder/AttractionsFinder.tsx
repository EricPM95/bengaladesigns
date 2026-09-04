import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Route, Stop } from '../../../lib/types'
import { searchAttractions, type AttractionSearchResult } from '../../../lib/mapboxAttractionsSearch'
import { buildRouteStopEntries, isNameAlreadyInRoute } from '../../../lib/routeStopsIndex'
import { Spinner } from '../../ui/Spinner'

interface AttractionsFinderProps {
  route: Route
  city: string
  open: boolean
  onClose: () => void
  onPick: (stop: Stop) => void
  /** Por defecto "Añadir un lugar en {city}" — EXPLORAR pasa "🏛️ Atracciones en {city}" para mantener su copy anterior. */
  title?: string
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0">
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
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

function stopFromResult(result: AttractionSearchResult): Stop {
  return {
    id: `stop-${result.id}`,
    time: '12:00',
    name: result.name,
    description: 'Añadido por ti',
    durationMinutes: 60,
    coordinates: result.coordinates,
    photoUrl: result.photoUrl,
  }
}

/**
 * Buscador de lugares a pantalla completa — acordeón "ya en tu ruta" (cerrado por defecto) +
 * buscador libre vía Mapbox Search Box API (sin restricción geográfica, autocompletado en vivo).
 * Componente ÚNICO reutilizado en 3 sitios: la categoría "Atracciones" de EXPLORAR, el "+" entre
 * paradas de DIAS, y "Añadir yo mismo" en RESERVAS — cada llamador decide qué hacer con el `Stop`
 * que sale de `onPick` (insertar en un hueco ya elegido, o abrir su propio selector de día/posición),
 * este componente no lo sabe ni le importa.
 */
export function AttractionsFinder({ route, city, open, onClose, onPick, title }: AttractionsFinderProps) {
  const [accordionOpen, setAccordionOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<AttractionSearchResult[] | null>(null)
  const [searching, setSearching] = useState(false)
  const [searchFailed, setSearchFailed] = useState(false)

  const stopEntries = buildRouteStopEntries(route)
  const cityStops = stopEntries.filter((entry) => entry.city === city)

  useEffect(() => {
    if (!open) return
    setAccordionOpen(false)
    setQuery('')
    setResults(null)
    setSearchFailed(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    const trimmed = query.trim()
    if (!trimmed) {
      setResults(null)
      setSearchFailed(false)
      return
    }
    let cancelled = false
    setSearching(true)
    const timer = window.setTimeout(() => {
      searchAttractions(trimmed).then((found) => {
        if (cancelled) return
        setResults(found)
        setSearchFailed(found.length === 0)
        setSearching(false)
      })
    }, 300)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [query])

  const pick = (result: AttractionSearchResult) => {
    onPick(stopFromResult(result))
    setQuery('')
    setResults(null)
  }

  const sortedResults = results
    ? [...results].sort((a, b) => Number(isNameAlreadyInRoute(b.name, stopEntries)) - Number(isNameAlreadyInRoute(a.name, stopEntries)))
    : []

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-bg">
          <div className="flex shrink-0 items-center gap-3 border-b border-border p-4 pl-16">
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              title="Cerrar"
              className="fixed left-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 border-accent bg-bg-card text-text shadow-md transition-colors hover:bg-bg-hover"
            >
              ✕
            </button>
            <h2 className="font-display text-h2 font-semibold text-text">{title ?? `Añadir un lugar en ${city}`}</h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="mx-auto w-full max-w-lg space-y-4">
              <div className="flex items-center gap-2 rounded-xl border border-border bg-bg-card px-3 py-2">
                <SearchIcon />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Busca un lugar..."
                  autoFocus
                  autoComplete="off"
                  className="w-full bg-transparent text-small text-text outline-none placeholder:text-text-muted"
                />
              </div>

              <div className="overflow-hidden rounded-xl border border-border">
                <button
                  type="button"
                  onClick={() => setAccordionOpen((value) => !value)}
                  className="flex w-full items-center justify-between gap-2 bg-bg-card px-3 py-2.5 text-left"
                >
                  <span className="text-caption font-semibold uppercase tracking-wide text-text-muted">Lugares que ya están en tu ruta a {city}</span>
                  <ChevronIcon open={accordionOpen} />
                </button>
                {accordionOpen && (
                  <div className="divide-y divide-border border-t border-border">
                    {cityStops.length === 0 && <p className="p-3 text-small text-text-soft">Todavía no has añadido ninguna parada en {city}.</p>}
                    {cityStops.map((entry) => (
                      <div key={entry.stop.id} className="flex items-center gap-3 p-3">
                        <img src={entry.stop.photoUrl} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
                        <p className="min-w-0 flex-1 truncate text-small font-medium text-text">{entry.stop.name}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                {searching && (
                  <p className="flex items-center gap-2 py-4 text-small text-text-soft">
                    <Spinner className="text-accent" />
                    Buscando...
                  </p>
                )}
                {!searching && searchFailed && <p className="py-4 text-center text-small text-text-soft">No hemos encontrado ese lugar. Prueba con otro nombre.</p>}

                {!searching &&
                  sortedResults.map((result) => {
                    const alreadyInRoute = isNameAlreadyInRoute(result.name, stopEntries)
                    return (
                      <div key={result.id} className="flex items-center gap-3 rounded-xl border border-border p-2">
                        <img src={result.photoUrl} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-small font-semibold text-text">{result.name}</p>
                          <p className="truncate text-caption text-text-soft">{result.address}</p>
                        </div>
                        {alreadyInRoute ? (
                          <span className="shrink-0 rounded-full bg-accent-soft px-2 py-1 text-caption font-semibold text-accent-hover">✓ Ya en ruta</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => pick(result)}
                            className="shrink-0 rounded-lg bg-accent-soft px-2.5 py-1.5 text-caption font-semibold text-accent-hover transition-colors hover:bg-border"
                          >
                            + Añadir
                          </button>
                        )}
                      </div>
                    )
                  })}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
