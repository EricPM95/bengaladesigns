import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Route, Stop } from '../../../lib/types'
import { searchAttractions, type AttractionSearchResult } from '../../../lib/mapboxAttractionsSearch'
import { buildRouteStopEntries, isNameAlreadyInRoute } from '../../../lib/routeStopsIndex'
import { Spinner } from '../../ui/Spinner'

interface MultiSelectConfig {
  /** Paradas ya marcadas al abrir — "Regenerar este día" (DayMenu.tsx) precarga las paradas actuales del día, así el viajero parte de lo que ya tenía y añade/quita libremente. */
  initialSelected: Stop[]
  onConfirm: (stops: Stop[]) => void
  confirmLabel?: string
  /** Nº de paradas a partir del cual se muestra el aviso discreto de "día apretado" — nunca bloquea, solo avisa. */
  tightWarningThreshold: number
}

interface AttractionsFinderProps {
  route: Route
  city: string
  open: boolean
  onClose: () => void
  /** Modo de un solo lugar (por defecto) — cada "+ Añadir" llama esto directamente y no cierra la pantalla, para poder seguir añadiendo. */
  onPick?: (stop: Stop) => void
  /** Modo de selección libre — checkboxes en vez de "+ Añadir" instantáneo, con un botón "Confirmar" al final (ver DayMenu.tsx "Regenerar este día"). Mutuamente excluyente con `onPick`. */
  multiSelect?: MultiSelectConfig
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
 * Componente ÚNICO reutilizado en 4 sitios: la categoría "Atracciones" de EXPLORAR, el "+" entre
 * paradas de DIAS, "Añadir yo mismo" en RESERVAS (los 3 en modo `onPick`, un lugar a la vez, sin
 * cerrar la pantalla) y "Regenerar este día" (DayMenu.tsx, modo `multiSelect`: checkboxes + botón
 * "Confirmar" con todo lo marcado a la vez) — cada llamador decide qué hacer con el resultado, este
 * componente no lo sabe ni le importa.
 */
export function AttractionsFinder({ route, city, open, onClose, onPick, multiSelect, title }: AttractionsFinderProps) {
  const [accordionOpen, setAccordionOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<AttractionSearchResult[] | null>(null)
  const [searching, setSearching] = useState(false)
  const [searchFailed, setSearchFailed] = useState(false)
  const [selected, setSelected] = useState<Map<string, Stop>>(new Map())

  const stopEntries = buildRouteStopEntries(route)
  const cityStops = stopEntries.filter((entry) => entry.city === city)

  useEffect(() => {
    if (!open) return
    setAccordionOpen(false)
    setQuery('')
    setResults(null)
    setSearchFailed(false)
    setSelected(new Map((multiSelect?.initialSelected ?? []).map((stop) => [stop.id, stop])))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const toggleSelected = (stop: Stop) => {
    setSelected((prev) => {
      const next = new Map(prev)
      if (next.has(stop.id)) next.delete(stop.id)
      else next.set(stop.id, stop)
      return next
    })
  }

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
    const stop = stopFromResult(result)
    if (multiSelect) {
      toggleSelected(stop)
      return
    }
    onPick?.(stop)
    setQuery('')
    setResults(null)
  }

  const sortedResults = results
    ? [...results].sort((a, b) => Number(isNameAlreadyInRoute(b.name, stopEntries)) - Number(isNameAlreadyInRoute(a.name, stopEntries)))
    : []

  const selectedCount = selected.size
  const showTightWarning = Boolean(multiSelect) && selectedCount > (multiSelect?.tightWarningThreshold ?? Infinity)

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="map-cover-overlay fixed inset-0 z-50 flex flex-col overflow-hidden bg-bg"
        >
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

              {multiSelect && selectedCount > 0 && (
                <div className="space-y-2 rounded-xl border border-accent/30 bg-accent-soft/40 p-3">
                  <p className="text-caption font-semibold uppercase tracking-wide text-accent-hover">Seleccionados ({selectedCount})</p>
                  <div className="flex flex-wrap gap-1.5">
                    {[...selected.values()].map((stop) => (
                      <span key={stop.id} className="flex items-center gap-1 rounded-full bg-bg-card py-1 pl-2.5 pr-1.5 text-caption font-medium text-text">
                        {stop.name}
                        <button
                          type="button"
                          onClick={() => toggleSelected(stop)}
                          aria-label={`Quitar ${stop.name}`}
                          className="flex h-4 w-4 items-center justify-center rounded-full text-text-muted hover:bg-bg-hover hover:text-text"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                  {showTightWarning && (
                    <p className="text-caption text-accent-hover">Este día queda bastante apretado — pero es tu elección.</p>
                  )}
                </div>
              )}

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
                        {multiSelect && (
                          <button
                            type="button"
                            onClick={() => toggleSelected(entry.stop)}
                            className={`shrink-0 rounded-lg px-2.5 py-1.5 text-caption font-semibold transition-colors ${
                              selected.has(entry.stop.id) ? 'bg-accent text-white' : 'bg-accent-soft text-accent-hover hover:bg-border'
                            }`}
                          >
                            {selected.has(entry.stop.id) ? '✓ Incluido' : '+ Incluir'}
                          </button>
                        )}
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
                    const isSelected = selected.has(`stop-${result.id}`)
                    return (
                      <div key={result.id} className="flex items-center gap-3 rounded-xl border border-border p-2">
                        <img src={result.photoUrl} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-small font-semibold text-text">{result.name}</p>
                          <p className="truncate text-caption text-text-soft">{result.address}</p>
                        </div>
                        {multiSelect ? (
                          <button
                            type="button"
                            onClick={() => pick(result)}
                            className={`shrink-0 rounded-lg px-2.5 py-1.5 text-caption font-semibold transition-colors ${
                              isSelected ? 'bg-accent text-white' : 'bg-accent-soft text-accent-hover hover:bg-border'
                            }`}
                          >
                            {isSelected ? '✓ Añadido' : '+ Añadir'}
                          </button>
                        ) : alreadyInRoute ? (
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

          {multiSelect && (
            <div className="shrink-0 border-t border-border bg-bg-card p-4">
              <div className="mx-auto w-full max-w-lg">
                <button
                  type="button"
                  onClick={() => multiSelect.onConfirm([...selected.values()])}
                  className="w-full rounded-xl bg-accent py-2.5 text-body font-semibold text-white transition-colors hover:bg-accent-hover"
                >
                  {multiSelect.confirmLabel ?? `Confirmar (${selectedCount})`}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
