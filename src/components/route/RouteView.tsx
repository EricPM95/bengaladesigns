import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react'
import { useRouteStore } from '../../store/useRouteStore'
import { buildDestinationSegments } from '../../lib/destinationSegments'
import { getTodayTripContext } from '../../lib/todayMode'
import { Header } from '../layout/Header'
import { FloatingBudget } from '../layout/FloatingBudget'
import { MapPlaceholder } from '../map/MapPlaceholder'
import { CombinedDaysMapView } from './CombinedDaysMapView'
import { DaySelector } from './DaySelector'
import { DayList } from './DayList'
import { ExplorePanel } from './ExplorePanel'
import { FloatingCombinedMapButton } from './FloatingCombinedMapButton'
import { MissingAccommodationBanner } from './MissingAccommodationBanner'
import { ModeSwitcher } from './ModeSwitcher'
import { ReservasPanel } from './ReservasPanel'
import { RouteOverview } from './RouteOverview'
import { RouteOverviewMap } from './RouteOverviewMap'
import { TodayView } from './today/TodayView'

export function RouteView() {
  const route = useRouteStore((state) => state.route)
  const mode = useRouteStore((state) => state.mode)
  const activeDayId = useRouteStore((state) => state.activeDayId)
  const setActiveDayId = useRouteStore((state) => state.setActiveDayId)
  const panelSplit = useRouteStore((state) => state.panelSplit)
  const setPanelSplit = useRouteStore((state) => state.setPanelSplit)
  const devSimulatedTodayIso = useRouteStore((state) => state.dev_simulated_today_iso)

  const containerRef = useRef<HTMLDivElement>(null)
  const [mapFullscreen, setMapFullscreen] = useState(false)
  const [itineraryFullscreen, setItineraryFullscreen] = useState(false)
  const [activeStopId, setActiveStopId] = useState<string | null>(null)
  const [combinedMapOpen, setCombinedMapOpen] = useState(false)

  // Altura del mapa en móvil (vh) cuando ni mapa ni panel están a pantalla completa — controlada
  // por el tirador gris (ver handleMobilePanelDragStart). En desktop no se usa (el layout pasa a
  // fila y el ancho se controla con panelSplit/handleDragStart).
  const [mobileMapVh, setMobileMapVh] = useState(30)

  useEffect(() => {
    if (window.innerWidth >= 768 && window.innerWidth < 1024) setPanelSplit(40)
  }, [])

  if (!route) return null

  const hasTripDates = Boolean(route.answers.dateRange)
  const todayContext = getTodayTripContext(route, devSimulatedTodayIso ?? undefined)
  const activeDay = (mode === 'today' && todayContext ? todayContext.day : route.days.find((day) => day.id === activeDayId)) ?? route.days[0]
  const segments = buildDestinationSegments(route.days)

  const handleDragStart = () => {
    const onMouseMove = (event: MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return
      const pct = ((event.clientX - rect.left) / rect.width) * 100
      setPanelSplit(Math.min(70, Math.max(25, pct)))
    }
    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  // Tirador gris del panel inferior en móvil: arrastrar hacia arriba encoge el mapa (y hace el
  // panel pantalla completa si se suelta cerca del tope), arrastrar hacia abajo lo agranda (y lo
  // hace pantalla completa si se suelta cerca del máximo). Basado en clientY, no en el ancho del
  // contenedor — por eso usa vh en vez del pct de `handleDragStart`.
  const handleMobilePanelDragStart = (event: ReactPointerEvent) => {
    event.preventDefault()
    const startY = event.clientY
    const startVh = mapFullscreen ? 85 : itineraryFullscreen ? 10 : mobileMapVh
    const vhUnit = window.innerHeight / 100

    const clampedVh = (clientY: number) => Math.min(85, Math.max(10, startVh + (clientY - startY) / vhUnit))

    const onPointerMove = (moveEvent: PointerEvent) => {
      setMobileMapVh(clampedVh(moveEvent.clientY))
      setMapFullscreen(false)
      setItineraryFullscreen(false)
    }
    const onPointerUp = (upEvent: PointerEvent) => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      const finalVh = clampedVh(upEvent.clientY)
      if (finalVh >= 83) setMapFullscreen(true)
      else if (finalVh <= 12) setItineraryFullscreen(true)
      else setMobileMapVh(finalVh)
    }
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
  }

  const splitStyle = {
    '--split-w': `${panelSplit}%`,
    '--map-w': `${100 - panelSplit}%`,
    '--mobile-map-h': `${mobileMapVh}vh`,
  } as CSSProperties

  return (
    <div className="flex h-screen flex-col bg-bg text-text">
      <Header />

      <div ref={containerRef} style={splitStyle} className="flex flex-1 flex-col overflow-hidden md:flex-row">
        {!itineraryFullscreen && (
          <div
            className={`relative shrink-0 md:h-auto ${
              mapFullscreen ? 'h-full flex-1' : 'max-md:h-[var(--mobile-map-h)] md:flex-none md:w-[var(--map-w)]'
            }`}
          >
            {mode === 'route' ? (
              <RouteOverviewMap segments={segments} days={route.days} />
            ) : (
              <MapPlaceholder destination={route.destination} stops={activeDay.stops} activeStopId={activeStopId} onSelectStop={setActiveStopId} />
            )}
          </div>
        )}

        {!mapFullscreen && !itineraryFullscreen && (
          <div onMouseDown={handleDragStart} className="hidden w-1.5 shrink-0 cursor-col-resize bg-border transition-colors hover:bg-accent md:block" />
        )}

        {!mapFullscreen && (
          <div className={`relative flex min-h-0 flex-col overflow-hidden ${itineraryFullscreen ? 'flex-1' : 'flex-1 md:w-[var(--split-w)]'}`}>
            <div
              onPointerDown={handleMobilePanelDragStart}
              className="flex shrink-0 cursor-row-resize touch-none items-center justify-center py-2 md:hidden"
            >
              <span className="h-1.5 w-10 rounded-full bg-border" />
            </div>
            <ModeSwitcher showToday={hasTripDates} />

            {mode === 'today' && hasTripDates && <TodayView route={route} />}

            {mode === 'route' && <RouteOverview route={route} />}

            {mode === 'explore' && <ExplorePanel route={route} defaultCity={activeDay.city} />}

            {mode === 'bookings' && <ReservasPanel route={route} />}

            {mode === 'days' && (
              <>
                <DaySelector days={route.days} activeDayId={activeDayId} onSelect={setActiveDayId} tripStartIso={route.answers.dateRange?.start} />
                <MissingAccommodationBanner route={route} />
                {route.isPreview && (
                  <div className="mx-4 mt-4 shrink-0 rounded-xl bg-accent-soft px-4 py-3 text-small text-accent-hover">
                    🚧 Las rutas generadas por IA llegan muy pronto — esto es una vista previa con datos de ejemplo.
                  </div>
                )}
                <DayList route={route} activeDayId={activeDayId} onSelectDay={setActiveDayId} />
              </>
            )}
          </div>
        )}
      </div>

      <FloatingCombinedMapButton onClick={() => setCombinedMapOpen(true)} />
      {combinedMapOpen && <CombinedDaysMapView route={route} onClose={() => setCombinedMapOpen(false)} />}

      <FloatingBudget />
    </div>
  )
}
