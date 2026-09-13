import { useEffect, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Coordinates } from '../../../lib/types'
import type { ArrivalDepartureDetail } from '../../../lib/mockDayDetail'
import { formatShortDateEs } from '../../../lib/dateRange'
import { fetchAnchorTips, type StopTip } from '../../../lib/anchorTipsApi'
import { ARRIVAL_MARKER_BG, ARRIVAL_MARKER_TEXT, arrivalIconFor } from '../../../lib/arrivalIcon'
import { resolveArrivalPointCoordinates } from '../../../lib/arrivalPointGeocoding'
import { StopsMapView, type StopsMapMarker } from '../../map/StopsMapView'
import type { DayStopRef } from './StopDetailSheet'
import { TipBox } from './TipBox'
import { LocalSecretBox } from './LocalSecretBox'
import { Button } from '../../ui/Button'

const MAP_MIN_VH = 15
const MAP_MAX_VH = 75
const DEFAULT_MAP_VH = 32
const MARKER_BG = 'rgb(var(--accent))'
const MARKER_TEXT = '#ffffff'

type Tab = 'resumen' | 'traslados' | 'tips'

interface ArrivalDetailSheetProps {
  /** null = cerrado. */
  detail: ArrivalDepartureDetail | null
  dayNumber: number
  dateIso: string | null
  dayStops: DayStopRef[]
  /** 'flight'|'ferry'|'train'|... (TransportOption.id / TransportSegment.mode) — decide el icono del pin morado del punto de llegada. null si no se conoce (rutas dev/manuales). */
  transportModeId: string | null
  onClose: () => void
}

function PlaneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2.5 1.5V22L12 21l4.5 1.5V20.5L14 19v-5.5l7 2.5z" />
    </svg>
  )
}

function formatPrice(precio: number, moneda: string): string {
  const symbol = moneda === 'EUR' ? '€' : moneda
  return `${precio.toLocaleString('es-ES')} ${symbol}`
}

/**
 * Ficha de llegada/vuelta — mismo patrón mapa arriba + panel deslizable abajo que StopDetailSheet.tsx,
 * sustituye al acordeón inline (ArrivalDepartureAccordion.tsx, ahora sin uso). El mapa muestra las
 * paradas del día como contexto, sin ninguna resaltada (aquí no hay "una parada", es el día entero).
 * "Resumen" es información fija del aeropuerto (independiente de la hora exacta de vuelo), con
 * sub-pestañas por aeropuerto si el destino tiene más de uno; "Traslados" solo existe si ESE
 * aeropuerto concreto tiene traslado privado en venta; "Tips" reutiliza el mismo caché con búsqueda
 * web que las anclas (anchorTipsApi.ts, kind:'airport'), una fila más en la misma tabla Supabase.
 */
export function ArrivalDetailSheet({ detail, dayNumber, dateIso, dayStops, transportModeId, onClose }: ArrivalDetailSheetProps) {
  const [tab, setTab] = useState<Tab>('resumen')
  const [airportIndex, setAirportIndex] = useState(0)
  const [mapVh, setMapVh] = useState(DEFAULT_MAP_VH)
  const [tips, setTips] = useState<StopTip[]>([])
  const [arrivalPointCoords, setArrivalPointCoords] = useState<Coordinates | null>(null)

  const airport = detail?.airports[airportIndex] ?? null

  useEffect(() => {
    if (!detail) return
    setTab('resumen')
    setAirportIndex(0)
  }, [detail?.kind, detail?.cityName])

  // Coordenadas REALES del punto de llegada (no una aproximación) — para el pin morado del mapa.
  // Fijas para los aeropuertos ya conocidos (ver arrivalPointGeocoding.ts), geocoding real vía
  // Mapbox en cualquier otro caso, re-resuelto cada vez que cambia el aeropuerto seleccionado.
  useEffect(() => {
    if (!detail || !airport) {
      setArrivalPointCoords(null)
      return
    }
    let cancelled = false
    const knownKey = airport.code ? `${airport.name} (${airport.code})` : undefined
    resolveArrivalPointCoordinates(detail.cityName, transportModeId, knownKey).then((coords) => {
      if (!cancelled) setArrivalPointCoords(coords)
    })
    return () => {
      cancelled = true
    }
  }, [detail?.cityName, airport?.code, airport?.name, transportModeId])

  useEffect(() => {
    if (!detail || !airport) {
      setTips([])
      return
    }
    let cancelled = false
    fetchAnchorTips(detail.cityName, airport.code ? `${airport.name} (${airport.code})` : airport.name, 'airport').then((result) => {
      if (!cancelled) setTips(result)
    })
    return () => {
      cancelled = true
    }
  }, [detail?.cityName, airport?.code, airport?.name])

  const handleDragStart = (event: ReactPointerEvent) => {
    event.preventDefault()
    const startY = event.clientY
    const startVh = mapVh
    const vhUnit = window.innerHeight / 100
    const clampedVh = (clientY: number) => Math.min(MAP_MAX_VH, Math.max(MAP_MIN_VH, startVh + (clientY - startY) / vhUnit))
    const onPointerMove = (moveEvent: PointerEvent) => setMapVh(clampedVh(moveEvent.clientY))
    const onPointerUp = (upEvent: PointerEvent) => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      setMapVh(clampedVh(upEvent.clientY))
    }
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
  }

  const markers: StopsMapMarker[] = dayStops.map((dayStop, index) => ({
    id: dayStop.id,
    name: dayStop.name,
    coordinates: dayStop.coordinates,
    number: index + 1,
    bg: MARKER_BG,
    text: MARKER_TEXT,
    photoUrl: dayStop.photoUrl,
  }))

  if (airport && arrivalPointCoords) {
    markers.push({
      id: `arrival-point-${airport.code || airport.name}`,
      name: airport.name,
      coordinates: arrivalPointCoords,
      number: 0,
      bg: ARRIVAL_MARKER_BG,
      text: ARRIVAL_MARKER_TEXT,
      icon: arrivalIconFor(transportModeId),
    })
  }

  const hasTraslados = Boolean(airport?.privateTransfer)
  const hasTips = tips.length > 0
  const visibleTabs: Tab[] = ['resumen', ...(hasTraslados ? (['traslados'] as const) : []), ...(hasTips ? (['tips'] as const) : [])]
  const activeTab: Tab = visibleTabs.includes(tab) ? tab : 'resumen'
  const dayPillLabel = `Día ${dayNumber}${dateIso ? ` · ${formatShortDateEs(dateIso)}` : ''}`

  return (
    <AnimatePresence>
      {detail && airport && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-bg">
          <div className="relative shrink-0" style={{ height: `${mapVh}vh` }}>
            <StopsMapView markers={markers} />

            <button
              type="button"
              onClick={onClose}
              aria-label="Volver"
              title="Volver"
              className="absolute left-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 border-accent bg-bg-card text-text shadow-md transition-colors hover:bg-bg-hover"
            >
              ←
            </button>

            <span className="absolute right-4 top-4 z-10 rounded-full bg-bg-card px-3 py-1.5 text-caption font-semibold text-text shadow-md">
              {dayPillLabel}
            </span>
          </div>

          <div onPointerDown={handleDragStart} className="flex shrink-0 cursor-row-resize touch-none items-center justify-center bg-bg-card py-2">
            <span className="h-1.5 w-10 rounded-full bg-border" />
          </div>

          <div className="flex-1 overflow-y-auto bg-bg-card">
            <div className="mx-auto w-full max-w-lg space-y-4 px-4 pb-8 pt-2">
              <div className="flex items-start gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent-hover text-white" aria-hidden="true">
                  <PlaneIcon />
                </span>
                <div className="min-w-0 flex-1 space-y-1">
                  <h1 className="font-display text-h2 font-semibold text-text">{detail.headline}</h1>
                  <p className="text-small text-text-soft">{detail.subtitle}</p>
                </div>
              </div>

              {visibleTabs.length > 1 && (
                <div className="flex gap-1 rounded-xl bg-bg-hover p-1">
                  {(
                    [
                      { id: 'resumen', label: 'Resumen' },
                      { id: 'traslados', label: 'Traslados' },
                      { id: 'tips', label: 'Tips' },
                    ] as const
                  )
                    .filter((item) => visibleTabs.includes(item.id))
                    .map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setTab(item.id)}
                        className={`flex-1 rounded-lg py-1.5 text-caption font-semibold transition-colors ${
                          activeTab === item.id ? 'bg-bg-card text-accent shadow-sm' : 'text-text-soft hover:text-text'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                </div>
              )}

              {activeTab === 'resumen' && (
                <div className="space-y-4">
                  {detail.airports.length > 1 && (
                    <div className="flex flex-wrap gap-1.5">
                      {detail.airports.map((option, index) => (
                        <button
                          key={option.code}
                          type="button"
                          onClick={() => setAirportIndex(index)}
                          className={`rounded-lg border px-2.5 py-1 text-caption font-semibold transition-colors ${
                            index === airportIndex ? 'border-accent text-accent' : 'border-border text-text-soft hover:border-border-accent'
                          }`}
                        >
                          {option.name} {option.code && `(${option.code})`}
                        </button>
                      ))}
                    </div>
                  )}

                  <div>
                    <p className="text-body font-semibold text-text">
                      {airport.name} {airport.code && `(${airport.code})`}
                    </p>
                    <p className="text-small text-text-soft">{airport.distanceToCenterLabel}</p>
                  </div>

                  <p className="text-small text-text-soft">{detail.whyRecommendation}</p>

                  <div className="space-y-1.5">
                    <h4 className="text-caption font-semibold uppercase tracking-wide text-text-muted">Transporte público</h4>
                    <div className="divide-y divide-border rounded-lg border border-border">
                      {airport.transitOptions.map((option) => (
                        <div key={option.name} className="flex items-center justify-between gap-3 px-3 py-2.5">
                          <div className="min-w-0">
                            <p className="text-small text-text">
                              {option.name}
                              {option.stopName && <span className="text-text-muted"> · {option.stopName}</span>}
                            </p>
                            <p className="text-caption font-medium text-text-soft">
                              {option.durationLabel} · {option.price === 0 ? 'Gratis' : `${option.price}€`}
                            </p>
                          </div>
                          {option.affiliateTicket && (
                            <a href={option.affiliateTicket.url_afiliado} target="_blank" rel="noopener noreferrer" className="shrink-0">
                              <Button className="text-caption font-bold shadow-sm">Comprar</Button>
                            </a>
                          )}
                        </div>
                      ))}
                      <div className="flex items-center justify-between gap-3 px-3 py-2.5">
                        <p className="text-small text-text-soft">🚕 Taxi</p>
                        <p className="shrink-0 text-caption font-medium text-text-muted">{airport.taxiPriceLabel}</p>
                      </div>
                    </div>
                  </div>

                  <a href="#" className="block text-small font-medium text-accent-hover underline underline-offset-2 hover:text-accent">
                    {airport.officialLinkLabel}
                  </a>
                </div>
              )}

              {activeTab === 'traslados' && airport.privateTransfer && (
                <div className="space-y-3">
                  <p className="text-small text-text-soft">
                    Si vais en familia, en grupo, o simplemente preferís no complicaros con trasbordos ni cargar maletas, un traslado privado os
                    recoge y os lleva directos, puerta a puerta.
                  </p>
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-bg-card p-3">
                    <div>
                      <p className="text-body font-semibold text-text">Traslado privado puerta a puerta</p>
                      <p className="text-caption text-text-soft">Directo a tu alojamiento — sin trasbordos ni esperas.</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="mb-1 text-body font-bold text-text">{formatPrice(airport.privateTransfer.precio, airport.privateTransfer.moneda)}</p>
                      <a href={airport.privateTransfer.url_afiliado} target="_blank" rel="noopener noreferrer">
                        <Button className="text-caption font-bold shadow-sm">Reservar</Button>
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'tips' && (
                <div className="space-y-2">
                  {tips.map((tip, index) =>
                    tip.tipo === 'practico' ? (
                      <TipBox key={index}>{tip.texto}</TipBox>
                    ) : (
                      <LocalSecretBox key={index}>{tip.texto}</LocalSecretBox>
                    ),
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
