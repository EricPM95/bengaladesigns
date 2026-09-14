import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Coordinates, Route, Stop } from '../../../lib/types'
import { searchAttractions, type AttractionSearchResult } from '../../../lib/mapboxAttractionsSearch'
import { searchPlaces } from '../../../lib/mapboxGeocoding'
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
  /** Modo de un solo lugar (por defecto) — tocar un resultado lo añade y cierra la pantalla de inmediato (una "+" = una parada insertada en ese punto exacto). */
  onPick?: (stop: Stop) => void
  /** Modo de selección libre — checkboxes en vez de tocar-para-añadir-y-cerrar, con un botón "Confirmar" al final (ver DayMenu.tsx "Regenerar este día"). Mutuamente excluyente con `onPick`, sigue siendo la pantalla completa con acordeón de siempre — no la ficha de búsqueda rediseñada de abajo, que es solo para el caso de un lugar cada vez. */
  multiSelect?: MultiSelectConfig
  /** Por defecto "Añadir una parada" — EXPLORAR pasa "🏛️ Atracciones en {city}" para mantener su copy anterior. */
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

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 shrink-0 text-text-muted">
      <path d="M12 21s-7-6.1-7-11a7 7 0 0 1 14 0c0 4.9-7 11-7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
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
    categoryLabel: result.category || undefined,
    durationMinutes: 60,
    coordinates: result.coordinates,
    photoUrl: result.photoUrl,
  }
}

/**
 * Buscador de lugares — dos formas muy distintas según el modo:
 * - Un solo lugar (`onPick`, sin `multiSelect`): pantalla completa (sin mapa — solo buscador +
 *   lista, ocupando toda la pantalla), foco automático, resultados en vivo vía Mapbox Search Box
 *   API (sin pestañas de "Pool"/"Buscar" separadas — todo en una sola lista) con sesgo de
 *   `proximity` centrado en el destino del viaje (geocodificado una vez por `city` al abrir, ver
 *   `proximity` más abajo) para que un homónimo lejano no se cuele por delante del lugar real del
 *   viaje. Etiqueta "En la lista" para lo que ya está en la ruta (en cualquier día, no solo el
 *   actual — ver routeStopsIndex.ts) SIN impedir añadirlo de nuevo. Tocar cualquier resultado lo
 *   añade y cierra al momento. Usado en el "+" entre paradas de DIAS, "Atracciones" de EXPLORAR y
 *   "Añadir yo mismo" de RESERVAS/Modo Hoy.
 * - Selección libre (`multiSelect`): pantalla completa con acordeón "ya en tu ruta" + checkboxes +
 *   botón "Confirmar", sin tocar — ver DayMenu.tsx "Regenerar este día".
 */
export function AttractionsFinder({ route, city, open, onClose, onPick, multiSelect, title }: AttractionsFinderProps) {
  const [accordionOpen, setAccordionOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<AttractionSearchResult[] | null>(null)
  const [searching, setSearching] = useState(false)
  const [searchFailed, setSearchFailed] = useState(false)
  const [selected, setSelected] = useState<Map<string, Stop>>(new Map())
  const [proximity, setProximity] = useState<Coordinates | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

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

  // Coordenadas del destino actual (geocodificadas una vez por ciudad, no en cada tecleo) — sesgo
  // de proximidad para la búsqueda de abajo, ver mapboxAttractionsSearch.ts. null si la ciudad no
  // resuelve (deja la búsqueda sin sesgo, nunca bloquea).
  useEffect(() => {
    if (!open) return
    let cancelled = false
    searchPlaces(city).then((places) => {
      if (!cancelled) setProximity(places[0]?.coordinates ?? null)
    })
    return () => {
      cancelled = true
    }
  }, [open, city])

  // Foco automático en el buscador del modo "un solo lugar" — con un pequeño margen para que la
  // animación de entrada ya haya montado el input antes de intentar enfocarlo.
  useEffect(() => {
    if (!open || multiSelect) return
    const timer = window.setTimeout(() => inputRef.current?.focus(), 50)
    return () => window.clearTimeout(timer)
  }, [open, multiSelect])

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
      searchAttractions(trimmed, proximity).then((found) => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, proximity])

  const pick = (result: AttractionSearchResult) => {
    const stop = stopFromResult(result)
    if (multiSelect) {
      toggleSelected(stop)
      return
    }
    onPick?.(stop)
    onClose()
  }

  const sortedResults = results
    ? [...results].sort((a, b) => Number(isNameAlreadyInRoute(b.name, stopEntries)) - Number(isNameAlreadyInRoute(a.name, stopEntries)))
    : []

  const selectedCount = selected.size
  const showTightWarning = Boolean(multiSelect) && selectedCount > (multiSelect?.tightWarningThreshold ?? Infinity)

  // ── Modo selección libre — pantalla completa sin cambios, ver DayMenu.tsx "Regenerar este día" ──
  if (multiSelect) {
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

                {selectedCount > 0 && (
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
                    {showTightWarning && <p className="text-caption text-accent-hover">Este día queda bastante apretado — pero es tu elección.</p>}
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
                          <button
                            type="button"
                            onClick={() => toggleSelected(entry.stop)}
                            className={`shrink-0 rounded-lg px-2.5 py-1.5 text-caption font-semibold transition-colors ${
                              selected.has(entry.stop.id) ? 'bg-accent text-white' : 'bg-accent-soft text-accent-hover hover:bg-border'
                            }`}
                          >
                            {selected.has(entry.stop.id) ? '✓ Incluido' : '+ Incluir'}
                          </button>
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
                  {!searching && searchFailed && (
                    <p className="py-4 text-center text-small text-text-soft">No hemos encontrado ese lugar. Prueba con otro nombre.</p>
                  )}

                  {!searching &&
                    sortedResults.map((result) => {
                      const isSelected = selected.has(`stop-${result.id}`)
                      return (
                        <div key={result.id} className="flex items-center gap-3 rounded-xl border border-border p-2">
                          <img src={result.photoUrl} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-small font-semibold text-text">{result.name}</p>
                            <p className="truncate text-caption text-text-soft">{result.address}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => pick(result)}
                            className={`shrink-0 rounded-lg px-2.5 py-1.5 text-caption font-semibold transition-colors ${
                              isSelected ? 'bg-accent text-white' : 'bg-accent-soft text-accent-hover hover:bg-border'
                            }`}
                          >
                            {isSelected ? '✓ Añadido' : '+ Añadir'}
                          </button>
                        </div>
                      )
                    })}
                </div>
              </div>
            </div>

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
          </motion.div>
        )}
      </AnimatePresence>
    )
  }

  // ── Modo un solo lugar — pantalla completa, sin mapa: solo buscador + lista ─────────────────────
  const trimmedQuery = query.trim()

  const resultRow = (result: AttractionSearchResult) => {
    const alreadyInRoute = isNameAlreadyInRoute(result.name, stopEntries)
    return (
      <button
        key={result.id}
        type="button"
        onClick={() => pick(result)}
        className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-colors hover:bg-bg-hover"
      >
        <PinIcon />
        <div className="min-w-0 flex-1">
          <p className="truncate text-small font-semibold text-text">{result.name}</p>
          <p className="truncate text-caption text-text-soft">{result.address}</p>
        </div>
        {alreadyInRoute && <span className="shrink-0 rounded-full bg-accent-soft px-2 py-1 text-caption font-semibold text-accent-hover">En la lista</span>}
      </button>
    )
  }

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
            <h2 className="font-display text-h2 font-semibold text-text">{title ?? 'Añadir una parada'}</h2>
          </div>

          <div className="shrink-0 px-4 pt-3">
            <div className="mx-auto flex w-full max-w-lg items-center gap-2 rounded-xl border border-border bg-bg-card px-3 py-2.5">
              <SearchIcon />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Busca un lugar..."
                autoComplete="off"
                className="w-full bg-transparent text-body text-text outline-none placeholder:text-text-muted"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('')
                    inputRef.current?.focus()
                  }}
                  aria-label="Borrar búsqueda"
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-bg-hover text-text-muted hover:text-text"
                >
                  <XIcon />
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 pt-2">
            <div className="mx-auto w-full max-w-lg space-y-1">
              {!trimmedQuery && <p className="py-6 text-center text-small text-text-soft">Escribe para buscar un lugar.</p>}

              {trimmedQuery && searching && (
                <p className="flex items-center gap-2 py-4 text-small text-text-soft">
                  <Spinner className="text-accent" />
                  Buscando...
                </p>
              )}

              {trimmedQuery && !searching && searchFailed && (
                <p className="py-4 text-center text-small text-text-soft">No hemos encontrado ese lugar. Prueba con otro nombre.</p>
              )}

              {trimmedQuery && !searching && sortedResults.map(resultRow)}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
