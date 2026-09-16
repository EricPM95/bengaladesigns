import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Coordinates, Route, Stop } from '../../../lib/types'
import type { StopDescription } from '../../../lib/describeStopApi'
import { searchAttractions, type AttractionSearchResult } from '../../../lib/mapboxAttractionsSearch'
import { searchNearbyPlaces, buildBoundingBox, type NearbyPlaceResult } from '../../../lib/nearbyPlacesSearch'
import { searchPlaces } from '../../../lib/mapboxGeocoding'
import { fetchPoiContent, type PoiContent } from '../../../lib/poiContentApi'
import { buildRouteStopEntries, isNameAlreadyInRoute } from '../../../lib/routeStopsIndex'
import { haversineMeters, estimateWalkMinutes, hasRealCoordinates } from '../../../lib/distanceMock'
import { formatDuration } from '../../../lib/format'
import { POI_CATEGORY_CHIPS, MAX_ACTIVE_POI_FILTERS, findPoiCategoryChip } from '../../../lib/poiCategories'
import { StopsMapView, type StopsMapMarker } from '../../map/StopsMapView'
import { StopDetailSheet, type DayStopRef } from '../dayDetail/StopDetailSheet'
import { Spinner } from '../../ui/Spinner'

/** Radio de búsqueda de categorías/bbox del buscador alrededor del centro del destino del día. */
const CITY_SEARCH_RADIUS_METERS = 6000

interface PoiCandidate {
  id: string
  name: string
  address: string
  coordinates: Coordinates
  categoryLabel: string
  photoUrl: string
  rating: number
  reviewCount: number
}

interface AddStopScreenProps {
  open: boolean
  route: Route
  city: string
  dayNumber: number
  /** Nombre de la parada justo antes del hueco donde se pulsó "+" — null si es el primer hueco del día. Solo para el título/contexto, no bloquea nada. */
  beforeStopName: string | null
  /** Nombre de la parada justo después del hueco — null si es el último hueco del día. */
  afterStopName: string | null
  /** Coordenadas de la parada anterior al hueco — ancla para ordenar "Cerca de ti" por proximidad real y para centrar el mapa; null si no hay parada previa (usa el centro del destino en su lugar). */
  anchorCoordinates: Coordinates | null
  /** Paradas YA existentes del día, numeradas igual que en DIAS — se pintan en el mapa como contexto. */
  dayMarkers: StopsMapMarker[]
  /** Precarga el buscador con este texto y dispara la búsqueda al abrir — usado por la tarjeta de "segunda visita recomendada" (RecommendedRevisit) para que el lugar ya salga sin que el viajero tenga que escribirlo. */
  initialQuery?: string
  onPick: (stop: Stop) => void
  onClose: () => void
}

function seededRatingFor(seed: string): { rating: number; reviewCount: number } {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  const rand = () => {
    h = (h * 1103515245 + 12345) >>> 0
    return (h % 1000) / 1000
  }
  return { rating: Math.round((3.6 + rand() * 1.3) * 10) / 10, reviewCount: 20 + Math.floor(rand() * 1400) }
}

function candidateFromSearchResult(result: AttractionSearchResult): PoiCandidate {
  const { rating, reviewCount } = seededRatingFor(result.id)
  return {
    id: result.id,
    name: result.name,
    address: result.address,
    coordinates: result.coordinates,
    categoryLabel: result.category || 'Lugar',
    photoUrl: result.photoUrl,
    rating,
    reviewCount,
  }
}

function candidateFromNearbyResult(result: NearbyPlaceResult): PoiCandidate {
  return {
    id: result.id,
    name: result.name,
    address: result.address,
    coordinates: result.coordinates,
    categoryLabel: result.categoryLabel,
    photoUrl: result.photoUrl,
    rating: result.rating,
    reviewCount: result.reviewCount,
  }
}

/** Duración estimada de visita SOLO a partir de la categoría (heurística, sin Claude) — para la mini-ficha instantánea; la ficha completa (bajo demanda) sustituye esto por la duración real que genera poi-content. */
function estimatedVisitMinutes(categoryLabel: string): number {
  const lower = categoryLabel.toLowerCase()
  if (lower.includes('restaur') || lower.includes('caf')) return 75
  if (lower.includes('mirador') || lower.includes('viewpoint') || lower.includes('lookout')) return 25
  if (lower.includes('tienda') || lower.includes('mercado') || lower.includes('shop') || lower.includes('market')) return 45
  return 60
}

function stopFromCandidate(candidate: PoiCandidate): Stop {
  return {
    id: `stop-${candidate.id}-${Date.now()}`,
    time: '12:00',
    name: candidate.name,
    description: 'Añadido por ti',
    categoryLabel: candidate.categoryLabel,
    durationMinutes: estimatedVisitMinutes(candidate.categoryLabel),
    coordinates: candidate.coordinates,
    photoUrl: candidate.photoUrl,
  }
}

function poiContentToStopDescription(poi: PoiContent): StopDescription {
  return {
    description: poi.summary,
    whatYoullSee: '',
    whyRecommended: '',
    address: null,
    officialWebsite: poi.officialUrl,
    hoursDetail: poi.hoursDetail,
    tips: poi.tips.map((texto) => ({ tipo: 'practico' as const, texto })),
  }
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0">
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5 shrink-0 text-accent-gold">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26" />
    </svg>
  )
}

/**
 * Pantalla completa de "Añadir parada" — REDISEÑO COMPLETO del feedback de calidad. Sustituye a
 * AttractionsFinder.tsx SOLO en el "+" de huecos de DIAS (ver DayDetailPanel.tsx); EXPLORAR,
 * RESERVAS y Modo Hoy siguen usando AttractionsFinder tal cual, sin tocar. Buscador (Mapbox Search
 * Box con proximity+bbox al destino) + mapa con chips de categoría (hasta 3 activos, POIs reales de
 * Mapbox, nunca Claude) + panel inferior "Cerca de ti"/"Recomendados" + mini-ficha instantánea al
 * tocar un resultado + ficha completa bajo demanda (StopDetailSheet reutilizado, contenido de
 * poiContentApi.ts con caché PERMANENTE en Supabase — ver place_content_cache).
 */
export function AddStopScreen({
  open,
  route,
  city,
  dayNumber,
  beforeStopName,
  afterStopName,
  anchorCoordinates,
  dayMarkers,
  initialQuery,
  onPick,
  onClose,
}: AddStopScreenProps) {
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<PoiCandidate[] | null>(null)
  const [activeFilters, setActiveFilters] = useState<string[]>([])
  const [filterWarning, setFilterWarning] = useState(false)
  const [categoryResults, setCategoryResults] = useState<Record<string, PoiCandidate[]>>({})
  const [categoryLoading, setCategoryLoading] = useState<Set<string>>(new Set())
  const [cityCenter, setCityCenter] = useState<Coordinates | null>(null)
  const [selected, setSelected] = useState<PoiCandidate | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [poiContent, setPoiContent] = useState<PoiContent | null>(null)
  const [poiContentLoading, setPoiContentLoading] = useState(false)
  const [bottomTab, setBottomTab] = useState<'nearby' | 'recommended'>('nearby')
  const searchInputRef = useRef<HTMLInputElement>(null)

  const stopEntries = useMemo(() => buildRouteStopEntries(route), [route])

  useEffect(() => {
    if (!open) return
    setQuery(initialQuery ?? '')
    setSearchResults(null)
    setActiveFilters([])
    setCategoryResults({})
    setSelected(null)
    setDetailOpen(false)
    setPoiContent(null)
    setBottomTab('nearby')
  }, [open])

  // Centro del destino — una vez por ciudad al abrir, usado como centro inicial del mapa, sesgo de
  // `proximity` y `bbox` del buscador, y ancla de "Cerca de ti" cuando no hay parada anterior al hueco.
  useEffect(() => {
    if (!open) return
    let cancelled = false
    searchPlaces(city).then((places) => {
      if (!cancelled) setCityCenter(places[0]?.coordinates ?? null)
    })
    return () => {
      cancelled = true
    }
  }, [open, city])

  // Buscador — acotado con proximity+bbox al destino (CRÍTICO, feedback de calidad: "museos" en
  // Roma nunca debe devolver resultados de otra ciudad).
  useEffect(() => {
    const trimmed = query.trim()
    if (!trimmed) {
      setSearchResults(null)
      return
    }
    let cancelled = false
    setSearching(true)
    const timer = window.setTimeout(() => {
      const bbox = cityCenter ? buildBoundingBox(cityCenter, CITY_SEARCH_RADIUS_METERS) : undefined
      searchAttractions(trimmed, cityCenter, undefined, bbox).then((results) => {
        if (cancelled) return
        setSearchResults(results.map(candidateFromSearchResult))
        setSearching(false)
      })
    }, 300)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [query, cityCenter])

  const toggleFilter = (chipId: string) => {
    setFilterWarning(false)
    setActiveFilters((prev) => {
      if (prev.includes(chipId)) return prev.filter((id) => id !== chipId)
      if (prev.length >= MAX_ACTIVE_POI_FILTERS) {
        setFilterWarning(true)
        return prev
      }
      return [...prev, chipId]
    })
  }

  // Carga los POIs reales de cada filtro activo que todavía no se hayan pedido — nunca a Claude,
  // solo Mapbox (ver POI_CATEGORY_CHIPS).
  useEffect(() => {
    if (!open || !cityCenter) return
    const pending = activeFilters.filter((id) => !(id in categoryResults))
    if (pending.length === 0) return
    setCategoryLoading((prev) => new Set([...prev, ...pending]))
    pending.forEach((chipId) => {
      const chip = findPoiCategoryChip(chipId)
      if (!chip) return
      searchNearbyPlaces(chip.mapboxCategoryIds, cityCenter, chip.label, undefined, CITY_SEARCH_RADIUS_METERS).then((results) => {
        setCategoryResults((prev) => ({ ...prev, [chipId]: results.map(candidateFromNearbyResult) }))
        setCategoryLoading((prev) => {
          const next = new Set(prev)
          next.delete(chipId)
          return next
        })
      })
    })
  }, [open, cityCenter, activeFilters, categoryResults])

  const activePois = useMemo(() => {
    const seen = new Set<string>()
    const merged: PoiCandidate[] = []
    for (const chipId of activeFilters) {
      for (const candidate of categoryResults[chipId] ?? []) {
        if (seen.has(candidate.id)) continue
        seen.add(candidate.id)
        merged.push(candidate)
      }
    }
    return merged
  }, [activeFilters, categoryResults])

  // Coordenadas (0,0) = parada de plantilla/mock todavía sin generar (ver hasRealCoordinates) —
  // usarlas como ancla de proximidad daría distancias absurdas (Roma está a miles de km de "Null
  // Island"), así que se tratan igual que "no hay parada anterior": cae al centro del destino.
  const anchor = anchorCoordinates && hasRealCoordinates(anchorCoordinates) ? anchorCoordinates : cityCenter
  const nearbySorted = useMemo(() => {
    if (!anchor) return activePois
    return [...activePois].sort((a, b) => haversineMeters(anchor, a.coordinates) - haversineMeters(anchor, b.coordinates))
  }, [activePois, anchor])

  const markers: StopsMapMarker[] = useMemo(() => {
    const poiMarkers: StopsMapMarker[] = (query.trim() ? (searchResults ?? []) : activePois).map((candidate) => ({
      id: `poi-${candidate.id}`,
      name: candidate.name,
      coordinates: candidate.coordinates,
      number: 0,
      icon: '📍',
      bg: isNameAlreadyInRoute(candidate.name, stopEntries) ? '#9CA3AF' : '#2A9D8F',
      text: '#FFFFFF',
      photoUrl: candidate.photoUrl,
    }))
    return [...dayMarkers, ...poiMarkers]
  }, [dayMarkers, activePois, searchResults, query, stopEntries])

  const selectCandidate = (candidate: PoiCandidate) => {
    setSelected(candidate)
    setPoiContent(null)
  }

  const openDetail = (candidate: PoiCandidate) => {
    setSelected(candidate)
    setDetailOpen(true)
    setPoiContentLoading(true)
    fetchPoiContent(candidate.name, city).then((content) => {
      setPoiContent(content)
      setPoiContentLoading(false)
    })
  }

  const addCandidate = (candidate: PoiCandidate) => {
    onPick(stopFromCandidate(candidate))
  }

  if (!open) return null

  const title = beforeStopName && afterStopName ? `Entre ${beforeStopName} y ${afterStopName}` : beforeStopName ? `Después de ${beforeStopName}` : afterStopName ? `Antes de ${afterStopName}` : `Día ${dayNumber}`

  const listToShow = query.trim() ? (searchResults ?? []) : nearbySorted
  const anyCategoryLoading = activeFilters.some((id) => categoryLoading.has(id))

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="map-cover-overlay fixed inset-0 z-50 flex flex-col overflow-hidden bg-bg"
      >
        {/* Barra superior */}
        <div className="flex shrink-0 items-center gap-3 border-b border-border bg-bg-card px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            aria-label="Volver"
            title="Volver"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-bg-card text-text transition-colors hover:bg-bg-hover"
          >
            ←
          </button>
          <div className="min-w-0 flex-1 text-center">
            <p className="truncate text-body font-semibold text-text">Añadir parada — Día {dayNumber}</p>
            <p className="truncate text-caption text-text-muted">{title}</p>
          </div>
          <span className="h-9 w-9 shrink-0" aria-hidden="true" />
        </div>

        {/* Buscador fijo */}
        <div className="shrink-0 border-b border-border bg-bg-card px-4 py-2.5">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-bg px-3 py-2">
            <SearchIcon />
            <input
              ref={searchInputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={`Buscar lugares en ${city}...`}
              autoComplete="off"
              className="w-full bg-transparent text-small text-text outline-none placeholder:text-text-muted"
            />
            {searching && <Spinner className="text-accent" />}
          </div>
        </div>

        {/* Mapa + filtros */}
        <div className="relative shrink-0" style={{ height: '42vh' }}>
          <StopsMapView markers={markers} activeStopId={selected ? `poi-${selected.id}` : null} onSelectStop={() => {}} />

          <div className="pointer-events-none absolute inset-x-0 top-2 flex gap-2 overflow-x-auto px-3 pb-1">
            {POI_CATEGORY_CHIPS.map((chip) => {
              const active = activeFilters.includes(chip.id)
              return (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => toggleFilter(chip.id)}
                  className={`pointer-events-auto flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-caption font-semibold shadow-sm transition-colors ${
                    active ? 'border-transparent text-white' : 'border-border bg-bg-card text-text'
                  }`}
                  style={active ? { backgroundColor: chip.color } : undefined}
                >
                  <span aria-hidden="true">{chip.icon}</span>
                  {chip.label}
                </button>
              )
            })}
          </div>

          {filterWarning && (
            <div className="pointer-events-none absolute inset-x-0 top-12 flex justify-center px-3">
              <span className="rounded-full bg-bg-card px-3 py-1 text-caption font-medium text-text-soft shadow-md">
                Desactiva un filtro para ver mejor el mapa
              </span>
            </div>
          )}

          {/* Mini-ficha flotante al seleccionar un POI */}
          {selected && !detailOpen && (
            <div className="absolute inset-x-3 bottom-3 z-10 flex gap-3 rounded-xl bg-bg-card p-3 shadow-lg">
              <img src={selected.photoUrl} alt="" className="h-16 w-16 shrink-0 rounded-lg object-cover" />
              <div className="min-w-0 flex-1 space-y-1">
                <p className="truncate text-small font-semibold text-text">{selected.name}</p>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-caption text-text-soft">
                  <span className="flex items-center gap-0.5">
                    <StarIcon />
                    {selected.rating.toFixed(1)} ({selected.reviewCount})
                  </span>
                  <span>·</span>
                  <span>{formatDuration(estimatedVisitMinutes(selected.categoryLabel))}</span>
                  <span>·</span>
                  <span>Acceso libre</span>
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => openDetail(selected)}
                    className="rounded-lg bg-bg-hover px-2.5 py-1.5 text-caption font-semibold text-text transition-colors hover:bg-border"
                  >
                    Ver detalle
                  </button>
                  <button
                    type="button"
                    onClick={() => addCandidate(selected)}
                    className="rounded-lg bg-accent px-2.5 py-1.5 text-caption font-semibold text-white transition-colors hover:bg-accent-hover"
                  >
                    Añadir a Día {dayNumber} →
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                aria-label="Cerrar"
                className="h-6 w-6 shrink-0 rounded-full text-text-muted hover:bg-bg-hover hover:text-text"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Tirador */}
        <div className="flex shrink-0 items-center justify-center bg-bg-card py-1.5">
          <span className="h-1.5 w-10 rounded-full bg-border" />
        </div>

        {/* Panel inferior */}
        <div className="flex-1 overflow-y-auto bg-bg-card">
          <div className="mx-auto w-full max-w-lg px-4 pb-6 pt-2">
            <div className="mb-3 flex gap-1 rounded-xl bg-bg-hover p-1">
              {(
                [
                  { id: 'nearby', label: 'Cerca de ti' },
                  { id: 'recommended', label: 'Recomendados' },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setBottomTab(item.id)}
                  className={`flex-1 rounded-lg py-1.5 text-caption font-semibold transition-colors ${
                    bottomTab === item.id ? 'bg-bg-card text-accent shadow-sm' : 'text-text-soft hover:text-text'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {bottomTab === 'recommended' && (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <span className="text-3xl" aria-hidden="true">
                  🌟
                </span>
                <p className="text-body font-semibold text-text">Próximamente</p>
                <p className="max-w-xs text-small text-text-soft">Descubre lugares recomendados por otros viajeros.</p>
              </div>
            )}

            {bottomTab === 'nearby' && (
              <div className="space-y-2">
                {!query.trim() && activeFilters.length === 0 && (
                  <p className="py-6 text-center text-small text-text-soft">Activa una categoría del mapa o busca un lugar por nombre.</p>
                )}
                {!query.trim() && activeFilters.length > 0 && anyCategoryLoading && listToShow.length === 0 && (
                  <p className="flex items-center justify-center gap-2 py-6 text-small text-text-soft">
                    <Spinner className="text-accent" />
                    Buscando lugares cerca...
                  </p>
                )}
                {query.trim() && !searching && listToShow.length === 0 && (
                  <p className="py-6 text-center text-small text-text-soft">No hemos encontrado ese lugar. Prueba con otro nombre.</p>
                )}

                {listToShow.map((candidate) => {
                  const alreadyInRoute = isNameAlreadyInRoute(candidate.name, stopEntries)
                  const distanceLabel = anchor ? formatDuration(estimateWalkMinutes(haversineMeters(anchor, candidate.coordinates))) : null
                  return (
                    <button
                      key={candidate.id}
                      type="button"
                      onClick={() => selectCandidate(candidate)}
                      className={`flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition-colors ${
                        selected?.id === candidate.id ? 'border-accent bg-accent-soft' : 'border-border hover:bg-bg-hover'
                      }`}
                    >
                      <img src={candidate.photoUrl} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover" />
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-small font-semibold text-text">{candidate.name}</p>
                          {alreadyInRoute && (
                            <span className="shrink-0 rounded-full bg-accent-soft px-1.5 py-0.5 text-caption font-semibold text-accent-hover">
                              En tu ruta
                            </span>
                          )}
                        </div>
                        <p className="flex items-center gap-1.5 text-caption text-text-soft">
                          <span className="flex items-center gap-0.5">
                            <StarIcon />
                            {candidate.rating.toFixed(1)}
                          </span>
                          <span>·</span>
                          <span className="truncate">{candidate.categoryLabel}</span>
                          {distanceLabel && (
                            <>
                              <span>·</span>
                              <span className="shrink-0">a {distanceLabel}</span>
                            </>
                          )}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Ficha completa bajo demanda — mismo componente que las paradas de la ruta, contenido de poiContentApi.ts (caché permanente) en vez de describeStopApi.ts. */}
        {selected && (
          <StopDetailSheet
            stop={
              detailOpen
                ? {
                    id: selected.id,
                    name: selected.name,
                    category: poiContent?.category ?? selected.categoryLabel,
                    hours: poiContent?.hoursShort ?? null,
                    durationMinutes: poiContent?.visitDurationMin ?? estimatedVisitMinutes(selected.categoryLabel),
                    photoUrl: selected.photoUrl,
                    description: poiContent?.summary ?? '',
                    tips: poiContent?.tips ?? [],
                    purchase: null,
                  }
                : null
            }
            city={city}
            dayNumber={dayNumber}
            dateIso={null}
            dayStops={dayMarkers.map((marker): DayStopRef => ({ id: marker.id, name: marker.name, coordinates: marker.coordinates, photoUrl: marker.photoUrl }))}
            isAnchor={false}
            externalContent={{ description: poiContent ? poiContentToStopDescription(poiContent) : null, loading: poiContentLoading }}
            footerAction={{ label: `Añadir a Día ${dayNumber} →`, onClick: () => addCandidate(selected) }}
            onClose={() => setDetailOpen(false)}
          />
        )}
      </motion.div>
    </AnimatePresence>
  )
}
