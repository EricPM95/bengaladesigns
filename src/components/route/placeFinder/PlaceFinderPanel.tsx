import { useEffect, useState, type ReactNode } from 'react'
import type { Place, Stop, WishlistItem } from '../../../lib/types'
import { categoryIcon, categoryLabel } from '../../../lib/explorePool'
import { buildCombinedPool, type PoolEntry } from '../../../lib/poolEntries'
import { searchPlaces } from '../../../lib/mapboxGeocoding'
import { getDistanceToStop } from '../../../lib/distanceMock'
import { formatDuration } from '../../../lib/format'
import { useRouteStore } from '../../../store/useRouteStore'
import { Modal } from '../../ui/Modal'
import { Button } from '../../ui/Button'
import { Badge } from '../../ui/Badge'

type Tab = 'pool' | 'search'

interface PlaceFinderPanelProps {
  open: boolean
  onClose: () => void
  city: string
  /** ids de `Stop` ya presentes en el día — para no repetir un candidato ya añadido. */
  excludeStopIds: string[]
  onPick: (stop: Stop) => void
  /** Modo Hoy: ordena "No están" por cercanía real (GPS) en vez del orden por defecto. */
  sortByProximity?: boolean
}

function wishlistItemFromSearchResult(result: Place): WishlistItem {
  return {
    id: `wishlist-${Date.now()}`,
    name: result.name,
    fullName: result.fullName,
    coordinates: result.coordinates,
    photoUrl: `https://picsum.photos/seed/${encodeURIComponent(result.name)}-${Date.now()}/600/400`,
    addedAt: new Date().toISOString(),
  }
}

function stopFromSearchResult(result: Place): Stop {
  return {
    id: `stop-custom-${Date.now()}`,
    time: '12:00',
    name: result.name,
    description: 'Añadido por ti',
    durationMinutes: 60,
    coordinates: result.coordinates,
    photoUrl: `https://picsum.photos/seed/${encodeURIComponent(result.name)}-${Date.now()}/600/400`,
  }
}

const TABS: { id: Tab; label: string }[] = [
  { id: 'pool', label: 'Pool' },
  { id: 'search', label: 'Buscar' },
]

function PoolEntryCard({ entry, walkMinutes, action }: { entry: PoolEntry; walkMinutes?: number; action: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <img src={entry.photoUrl} alt="" className="h-24 w-full object-cover" />
      <div className="space-y-1 p-2">
        <div className="flex items-start justify-between gap-1">
          <p className="line-clamp-2 text-caption font-medium text-text">{entry.name}</p>
          {entry.source === 'user' && (
            <span className="shrink-0">
              <Badge variant="accent">Tu selección</Badge>
            </span>
          )}
        </div>
        {entry.category && (
          <p className="flex items-center gap-1 text-caption text-text-muted">
            <span aria-hidden="true">{categoryIcon(entry.category)}</span>
            {categoryLabel(entry.category)}
          </p>
        )}
        {walkMinutes != null ? (
          <p className="text-caption text-text-muted">a {formatDuration(walkMinutes)} andando</p>
        ) : (
          entry.reason && <p className="line-clamp-2 text-caption italic text-text-muted">{entry.reason}</p>
        )}
        {action}
      </div>
    </div>
  )
}

/**
 * Panel compartido para elegir UN lugar — reutilizado por el "+"/"Cambiar" de DIAS (ver StopMenu.tsx
 * y DayDetailPanel.tsx) y por Modo Hoy (ver TodayView.tsx). Dos pestañas:
 * - Pool (por defecto): candidatos de la app + Wishlist + selección de "Elige lugares", fundidos en
 *   un único pool con dos bloques — "Ya está en tu ruta" (con "Quitar", reutiliza `removeStop`) y
 *   "No están" (con motivo específico/genérico, y "Añadir") — ver poolEntries.ts. Los marcados por
 *   el propio viajero llevan la etiqueta "Tu selección" para distinguirlos de los que sugiere la
 *   app, sin pestaña ni pantalla aparte.
 * - Buscar: buscador Mapbox de respaldo si el sitio no está en el Pool — cada resultado se puede
 *   añadir directo al día O guardar en la Wishlist para más tarde (♡), sin insertarlo ahora; ese
 *   guardado es justamente lo que lo hace aparecer luego en el Pool de esta misma pantalla.
 * Emite el `Stop` ya listo vía `onPick` — el llamador decide si eso significa insertar o
 * reemplazar; este panel no lo sabe ni le importa.
 */
export function PlaceFinderPanel({ open, onClose, city, excludeStopIds, onPick, sortByProximity = false }: PlaceFinderPanelProps) {
  const route = useRouteStore((state) => state.route)
  const wishlist = useRouteStore((state) => state.wishlist)
  const suggestedPlaces = useRouteStore((state) => state.suggested_places)
  const selectedPlaceIds = useRouteStore((state) => state.selected_place_ids)
  const addToWishlist = useRouteStore((state) => state.addToWishlist)
  const removeStop = useRouteStore((state) => state.removeStop)

  const [tab, setTab] = useState<Tab>('pool')
  const [walkMinutesById, setWalkMinutesById] = useState<Record<string, number> | null>(null)
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<Place[]>([])
  const [searchError, setSearchError] = useState(false)

  useEffect(() => {
    if (open) setTab('pool')
  }, [open])

  const poolData =
    open && route
      ? (() => {
          const combined = buildCombinedPool(route, city, wishlist, suggestedPlaces, selectedPlaceIds)
          const withoutExcluded = (list: PoolEntry[]) => list.filter((entry) => !excludeStopIds.includes(entry.stop.id))
          return { inRoute: withoutExcluded(combined.inRoute), notInRoute: withoutExcluded(combined.notInRoute) }
        })()
      : null

  useEffect(() => {
    if (!sortByProximity || !poolData) {
      setWalkMinutesById(null)
      return
    }
    let cancelled = false
    Promise.all(poolData.notInRoute.map((entry) => getDistanceToStop(entry.id, entry.stop.coordinates))).then((distances) => {
      if (cancelled) return
      setWalkMinutesById(Object.fromEntries(poolData.notInRoute.map((entry, index) => [entry.id, distances[index].walkMinutes])))
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortByProximity, poolData?.notInRoute.map((entry) => entry.id).join(',')])

  const resetSearch = () => {
    setQuery('')
    setSearchResults([])
    setSearchError(false)
  }

  const handleClose = () => {
    resetSearch()
    onClose()
  }

  const handleSearch = async () => {
    if (!query.trim()) return
    setSearching(true)
    setSearchError(false)
    try {
      const results = await searchPlaces(query.trim())
      setSearchResults(results)
      setSearchError(results.length === 0)
    } catch {
      setSearchError(true)
    } finally {
      setSearching(false)
    }
  }

  const pick = (stop: Stop) => {
    onPick(stop)
    resetSearch()
  }

  const notInRouteSorted = walkMinutesById
    ? [...(poolData?.notInRoute ?? [])].sort((a, b) => (walkMinutesById[a.id] ?? 0) - (walkMinutesById[b.id] ?? 0))
    : (poolData?.notInRoute ?? [])

  return (
    <Modal open={open} onClose={handleClose}>
      <div className="space-y-4">
        <h2 className="font-display text-h2 font-semibold text-text">Añadir una parada</h2>

        <div className="flex gap-1 rounded-xl bg-bg-hover p-1">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`flex-1 rounded-lg py-1.5 text-caption font-semibold transition-colors ${
                tab === item.id ? 'bg-bg-card text-accent shadow-sm' : 'text-text-soft hover:text-text'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {tab === 'pool' &&
          (poolData === null ? (
            <p className="py-6 text-center text-small text-text-soft">Cargando…</p>
          ) : poolData.inRoute.length === 0 && poolData.notInRoute.length === 0 ? (
            <p className="py-6 text-center text-small text-text-soft">No hay más candidatos del pool para {city}.</p>
          ) : (
            <div className="space-y-4">
              {poolData.inRoute.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-caption font-semibold uppercase tracking-wide text-text-muted">✓ Ya está en tu ruta</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {poolData.inRoute.map((entry) => (
                      <PoolEntryCard
                        key={entry.id}
                        entry={entry}
                        action={
                          <button
                            type="button"
                            onClick={() => entry.location && removeStop(entry.location.dayId, entry.location.stopId)}
                            className="w-full rounded-lg bg-bg-hover px-2 py-1.5 text-caption font-semibold text-text-soft transition-colors hover:bg-border hover:text-accent-red"
                          >
                            Quitar
                          </button>
                        }
                      />
                    ))}
                  </div>
                </div>
              )}

              {poolData.notInRoute.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-caption font-semibold uppercase tracking-wide text-text-muted">No están</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {notInRouteSorted.map((entry) => (
                      <PoolEntryCard
                        key={entry.id}
                        entry={entry}
                        walkMinutes={walkMinutesById?.[entry.id]}
                        action={
                          <button
                            type="button"
                            onClick={() => pick(entry.stop)}
                            className="w-full rounded-lg bg-accent-soft px-2 py-1.5 text-caption font-semibold text-accent-hover transition-colors hover:bg-border"
                          >
                            Añadir
                          </button>
                        }
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

        {tab === 'search' && (
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Busca un lugar..."
                autoFocus
                autoComplete="off"
                className="flex-1 rounded-lg border border-border bg-bg px-2 py-1.5 text-small text-text"
              />
              <Button onClick={handleSearch} disabled={!query.trim() || searching}>
                {searching ? 'Buscando...' : 'Buscar'}
              </Button>
            </div>
            {searchError && <p className="text-caption text-text-muted">No hemos encontrado ese lugar. Prueba con otro nombre.</p>}
            {searchResults.map((result) => (
              <div key={result.fullName} className="flex items-center gap-2 rounded-lg bg-bg-hover px-3 py-2">
                <div className="min-w-0 flex-1">
                  <span className="block text-small font-medium text-text">{result.name}</span>
                  <span className="block truncate text-caption text-text-soft">{result.fullName}</span>
                </div>
                <button
                  type="button"
                  onClick={() => pick(stopFromSearchResult(result))}
                  className="shrink-0 rounded-lg bg-accent-soft px-2 py-1.5 text-caption font-semibold text-accent-hover transition-colors hover:bg-border"
                >
                  Añadir
                </button>
                <button
                  type="button"
                  onClick={() => addToWishlist(wishlistItemFromSearchResult(result))}
                  aria-label={`Guardar ${result.name} en la wishlist`}
                  title="Guardar en la wishlist"
                  className="shrink-0 text-text-muted hover:text-accent"
                >
                  ♡
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  )
}
