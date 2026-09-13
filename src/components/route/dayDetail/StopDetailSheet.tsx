import { useEffect, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Coordinates } from '../../../lib/types'
import type { MockStopDetail } from '../../../lib/mockDayDetail'
import { formatDuration } from '../../../lib/format'
import { formatShortDateEs } from '../../../lib/dateRange'
import { computeStopHoursTag } from '../../../lib/stopHoursTag'
import { describeStop, type StopDescription } from '../../../lib/describeStopApi'
import { fetchAnchorTips, type StopTip } from '../../../lib/anchorTipsApi'
import { buildMockStopTickets } from '../../../lib/mockStopTickets'
import { StopsMapView, type StopsMapMarker } from '../../map/StopsMapView'
import { StopTicketCard } from './StopTicketCard'
import { HowToGetThereSheet } from '../today/HowToGetThereSheet'
import { TipBox } from './TipBox'
import { LocalSecretBox } from './LocalSecretBox'
import { Spinner } from '../../ui/Spinner'

// Mismos límites que el tirador de RouteView.tsx (mapa arriba + panel abajo) — ninguno de los dos
// lados puede llegar a desaparecer del todo.
const MAP_MIN_VH = 15
const MAP_MAX_VH = 75
const DEFAULT_MAP_VH = 32

const MUTED_MARKER_BG = '#E5E7EB'
const MUTED_MARKER_TEXT = '#6B7280'
const ACTIVE_MARKER_BG = 'rgb(var(--accent))'
const ACTIVE_MARKER_TEXT = '#ffffff'

export interface DayStopRef {
  id: string
  name: string
  coordinates: Coordinates
  photoUrl?: string
}

type Tab = 'resumen' | 'tickets' | 'tips'

interface StopDetailSheetProps {
  /** null = cerrado. */
  stop: MockStopDetail | null
  city: string
  dayNumber: number
  /** Fecha ISO de este día si el viajero fijó fechas exactas — null = "Día X" sin fecha (ver formatShortDateEs). */
  dateIso: string | null
  /** Todas las paradas REALES del día (con coordenadas), en orden — la actual se resalta, el resto se muestra en gris de contexto. */
  dayStops: DayStopRef[]
  /** true si este lugar es una ancla (Paso 1 del pipeline, ver Route.anchorNames) — decide si los tips vienen del caché con búsqueda web (tips_anclas) o del `localTip` simple de describeStopApi.ts. */
  isAnchor: boolean
  onClose: () => void
}

function GlobeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18Z" />
    </svg>
  )
}

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0">
      <path d="M12 21s-7-6.1-7-11a7 7 0 0 1 14 0c0 4.9-7 11-7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  )
}

/**
 * Ficha de una parada — pantalla completa con el mismo patrón mapa arriba + panel deslizable abajo
 * (tirador gris) ya usado en DIAS (ver RouteView.tsx), sustituye al acordeón inline que expandía
 * contenido bajo la tarjeta en la lista. El mapa muestra TODAS las paradas del día (contexto, en
 * gris) con la actual resaltada (color sólido + escala 1.2 vía activeStopId, ver StopsMapView.tsx).
 * "Resumen" es contenido real de Claude bajo demanda (describeStopApi.ts, con cache); "Tickets &
 * Entradas" sigue siendo mock (mockStopTickets.ts) hasta conectar Civitatis/GetYourGuide reales.
 */
export function StopDetailSheet({ stop, city, dayNumber, dateIso, dayStops, isAnchor, onClose }: StopDetailSheetProps) {
  const [tab, setTab] = useState<Tab>('resumen')
  const [mapVh, setMapVh] = useState(DEFAULT_MAP_VH)
  const [description, setDescription] = useState<StopDescription | null>(null)
  const [descLoading, setDescLoading] = useState(false)
  const [descFailed, setDescFailed] = useState(false)
  const [anchorTips, setAnchorTips] = useState<StopTip[]>([])
  const [directionsOpen, setDirectionsOpen] = useState(false)

  useEffect(() => {
    if (!stop) return
    setTab('resumen')
    setDescription(null)
    setDescFailed(false)
    setDescLoading(true)
    let cancelled = false
    describeStop(stop.name, city, stop.category).then((result) => {
      if (cancelled) return
      setDescLoading(false)
      if (result) setDescription(result)
      else setDescFailed(true)
    })
    return () => {
      cancelled = true
    }
  }, [stop?.id, stop?.name, stop?.category, city])

  // Tips de ancla — llamada aparte (caché en Supabase + búsqueda web, ver anchorTipsApi.ts), solo
  // para lugares obligatorios del destino. Las paradas normales no llaman aquí: su tip (si lo hay)
  // ya viene incluido en `description.localTip`, sin coste ni caché aparte.
  useEffect(() => {
    if (!stop || !isAnchor) {
      setAnchorTips([])
      return
    }
    let cancelled = false
    fetchAnchorTips(city, stop.name).then((tips) => {
      if (!cancelled) setAnchorTips(tips)
    })
    return () => {
      cancelled = true
    }
  }, [stop?.id, stop?.name, isAnchor, city])

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

  const markers: StopsMapMarker[] = dayStops.map((dayStop, index) => {
    const isActive = dayStop.id === stop?.id
    return {
      id: dayStop.id,
      name: dayStop.name,
      coordinates: dayStop.coordinates,
      number: index + 1,
      bg: isActive ? ACTIVE_MARKER_BG : MUTED_MARKER_BG,
      text: isActive ? ACTIVE_MARKER_TEXT : MUTED_MARKER_TEXT,
      photoUrl: dayStop.photoUrl,
    }
  })

  const hoursTag = stop ? computeStopHoursTag(stop.hours, new Date().getHours() * 60 + new Date().getMinutes()) : null
  // Solo los lugares con afiliación de tours (ver mockDayDetail.ts) tienen sentido con
  // Civitatis/GetYourGuide — un mercado local con solo entrada libre (afiliacion_disponible:false)
  // no debe mostrar tarjetas de tours inventadas. En real, esto será "la API de afiliación devolvió
  // 0 resultados para este lugar" — mismo efecto: sin tickets, sin pestaña (ver hasTickets abajo).
  const tickets = stop?.purchase?.afiliacion_disponible ? buildMockStopTickets(stop.id, stop.name) : []
  const hasTickets = tickets.length > 0
  // Ancla: tips reales con búsqueda web (0-2, práctico/secreto). Parada normal: el `localTip` de
  // describeStopApi.ts, si Claude encontró algo genuinamente bueno — siempre tipo "secreto" (es el
  // mismo espíritu "esto no lo sabe todo el mundo", solo que sin caché ni búsqueda web).
  const tips: StopTip[] = isAnchor ? anchorTips : description?.localTip ? [{ tipo: 'secreto', texto: description.localTip }] : []
  const hasTips = tips.length > 0

  const visibleTabs: Tab[] = ['resumen', ...(hasTickets ? (['tickets'] as const) : []), ...(hasTips ? (['tips'] as const) : [])]
  // Si el tab guardado quedó en uno que ya no está visible (p.ej. se abrió otro lugar sin ese
  // contenido), cae a "resumen".
  const activeTab: Tab = visibleTabs.includes(tab) ? tab : 'resumen'
  const dayPillLabel = `Día ${dayNumber}${dateIso ? ` · ${formatShortDateEs(dateIso)}` : ''}`

  return (
    <AnimatePresence>
      {stop && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-bg">
          <div className="relative shrink-0" style={{ height: `${mapVh}vh` }}>
            <StopsMapView markers={markers} activeStopId={stop.id} />

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
                <img src={stop.photoUrl} alt="" className="h-16 w-16 shrink-0 rounded-xl object-cover" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <h1 className="font-display text-h2 font-semibold text-text">{stop.name}</h1>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="rounded-full bg-accent-soft px-2 py-0.5 text-caption font-medium text-accent-hover">
                      ⏳ {formatDuration(stop.durationMinutes)}
                    </span>
                    {hoursTag && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-caption font-medium ${
                          hoursTag.variant === 'closed' ? 'bg-accent-red/15 text-accent-red' : 'bg-accent-soft text-accent-hover'
                        }`}
                      >
                        🕐 {hoursTag.label}
                      </span>
                    )}
                    <span className="rounded-full bg-bg-hover px-2 py-0.5 text-caption font-medium text-text-muted">{stop.category}</span>
                  </div>
                </div>
              </div>

              {visibleTabs.length > 1 && (
                <div className="flex gap-1 rounded-xl bg-bg-hover p-1">
                  {(
                    [
                      { id: 'resumen', label: 'Resumen' },
                      { id: 'tickets', label: 'Tickets & Entradas' },
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
                  {descLoading ? (
                    <p className="flex items-center gap-2 text-small italic text-text-soft">
                      <Spinner className="text-accent" />
                      Preparando información de {stop.name}...
                    </p>
                  ) : description ? (
                    <div className="space-y-3">
                      <p className="text-small text-text-soft">{description.description}</p>
                      {description.whatYoullSee && (
                        <div className="space-y-1">
                          <h3 className="text-body font-semibold text-text">Qué vas a ver</h3>
                          <p className="text-small text-text-soft">{description.whatYoullSee}</p>
                        </div>
                      )}
                      {description.whyRecommended && (
                        <div className="space-y-1">
                          <h3 className="text-body font-semibold text-text">Por qué te lo recomendamos</h3>
                          <p className="text-small text-text-soft">{description.whyRecommended}</p>
                        </div>
                      )}
                    </div>
                  ) : descFailed ? (
                    <p className="text-small text-text-soft">{stop.description}</p>
                  ) : null}

                  <div className="space-y-2 border-t border-border pt-3">
                    {description?.address && (
                      <div className="flex items-center justify-between gap-3">
                        <span className="flex items-center gap-1.5 text-small text-text">
                          <PinIcon />
                          {description.address}
                        </span>
                        <button
                          type="button"
                          onClick={() => setDirectionsOpen(true)}
                          className="shrink-0 text-small font-semibold text-accent-hover hover:text-accent"
                        >
                          Cómo llegar →
                        </button>
                      </div>
                    )}
                    {description?.officialWebsite && (
                      <a
                        href={
                          description.officialWebsite.startsWith('http') ? description.officialWebsite : `https://${description.officialWebsite}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-small text-accent-hover hover:text-accent"
                      >
                        <GlobeIcon />
                        {description.officialWebsite.replace(/^https?:\/\//, '')}
                      </a>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'tickets' && (
                <div className="space-y-3">
                  {tickets.map((ticket, index) => (
                    <StopTicketCard key={`${ticket.proveedor}-${index}`} ticket={ticket} />
                  ))}
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

          <HowToGetThereSheet open={directionsOpen} onClose={() => setDirectionsOpen(false)} destination={description?.address ?? stop.name} />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
