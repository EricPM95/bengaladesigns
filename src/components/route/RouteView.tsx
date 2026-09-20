import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react'
import { useRouteStore } from '../../store/useRouteStore'
import { buildDestinationSegments } from '../../lib/destinationSegments'
import { buildCombinedDaysMarkers } from '../../lib/routeMapMarkers'
import { useArrivalMarkers } from '../../lib/useArrivalMarkers'
import { getTodayTripContext } from '../../lib/todayMode'
import { Header } from '../layout/Header'
import { FloatingBudget } from '../layout/FloatingBudget'
import { StopsMapView, type StopsMapMarker } from '../map/StopsMapView'
import { DayList } from './DayList'
import { ExplorePanel } from './ExplorePanel'
import { FloatingCombinedMapButton } from './FloatingCombinedMapButton'
import { MapDestinationHeader } from './MapDestinationHeader'
import { ModeSwitcher } from './ModeSwitcher'
import { ReservasPanel } from './ReservasPanel'
import { RouteOverview } from './RouteOverview'
import { RouteOverviewMap } from './RouteOverviewMap'
import { TodayView } from './today/TodayView'

// Límites del tirador gris (móvil) entre mapa y panel inferior — ninguno de los dos lados puede
// llegar a desaparecer del todo: el mapa siempre deja al menos MOBILE_MAP_MIN_VH visible, y el
// panel (con su tirador y la barra de pestañas) siempre deja al menos 100-MOBILE_MAP_MAX_VH.
const MOBILE_MAP_MIN_VH = 15
const MOBILE_MAP_MAX_VH = 75

function CollapseMapIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}

function ExpandMapIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M3 3h7v7H3z" />
      <path d="M14 14h7v7h-7z" />
    </svg>
  )
}

export function RouteView() {
  const route = useRouteStore((state) => state.route)
  const mode = useRouteStore((state) => state.mode)
  const setMode = useRouteStore((state) => state.setMode)
  const activeDayId = useRouteStore((state) => state.activeDayId)
  const setActiveDayId = useRouteStore((state) => state.setActiveDayId)
  const panelSplit = useRouteStore((state) => state.panelSplit)
  const setPanelSplit = useRouteStore((state) => state.setPanelSplit)
  const devSimulatedTodayIso = useRouteStore((state) => state.dev_simulated_today_iso)
  const setRouteDateRange = useRouteStore((state) => state.setRouteDateRange)

  const containerRef = useRef<HTMLDivElement>(null)
  const [activeStopId, setActiveStopId] = useState<string | null>(null)
  const [mapCollapsed, setMapCollapsed] = useState(false)
  // Publicado por ExplorePanel mientras "Comer y beber"/"Miradores y fotos" está activo — sustituye
  // a las paradas del día activo en este mismo mapa compartido (null = mapa normal de DIAS/Hoy).
  const [exploreMarkers, setExploreMarkers] = useState<StopsMapMarker[] | null>(null)
  const [exploreActiveId, setExploreActiveId] = useState<string | null>(null)

  // Altura del mapa en móvil (vh) cuando ni mapa ni panel están a pantalla completa — controlada
  // por el tirador gris (ver handleMobilePanelDragStart). En desktop no se usa (el layout pasa a
  // fila y el ancho se controla con panelSplit/handleDragStart). Por defecto cerca del mínimo — el
  // panel inferior (contenido real) es el protagonista; arrastrar el tirador hacia abajo agranda el
  // mapa si hace falta.
  const [mobileMapVh, setMobileMapVh] = useState(MOBILE_MAP_MIN_VH + 3)

  useEffect(() => {
    if (window.innerWidth >= 768 && window.innerWidth < 1024) setPanelSplit(40)
  }, [])

  // Calculado ya aquí (antes de los `return` condicionales de abajo) porque useArrivalMarkers es un
  // hook — debe llamarse siempre, en el mismo orden, en cada render (reglas de los hooks).
  const segmentsForArrivalMarkers = buildDestinationSegments(route?.days ?? [])
  const arrivalMarkers = useArrivalMarkers(route, segmentsForArrivalMarkers)

  if (!route) return null

  // RESERVAS es su propia pantalla completa (mismo patrón ✕ que RUTA/EXPLORAR, ver
  // ReservasPanel.tsx) — no comparte el mapa/tirador/panel partido del resto de pestañas, así que
  // se resuelve aquí antes de montar ese layout en absoluto. Cerrar vuelve siempre a RUTA, mismo
  // criterio que DestinationDetailModal/AttractionsFinder.
  if (mode === 'bookings') {
    return <ReservasPanel route={route} onClose={() => setMode('route')} />
  }

  const hasTripDates = Boolean(route.answers.dateRange)
  const todayContext = getTodayTripContext(route, devSimulatedTodayIso ?? undefined)
  const activeDay = (mode === 'today' && todayContext ? todayContext.day : route.days.find((day) => day.id === activeDayId)) ?? route.days[0]
  const segments = segmentsForArrivalMarkers
  const showRouteStyleMap = mode === 'route'
  // El botón de colapsar mapa aplica a DIAS y a EXPLORAR (mismo patrón mapa+tirador+colapsar en
  // ambas, pedido explícitamente para EXPLORAR también) — el resto de pestañas se quedan con el
  // comportamiento normal.
  const canCollapseMap = mode === 'days' || mode === 'explore'
  // Con un día abierto, DayDetailPanel (y StopDetailSheet dentro de él) ya cubren TODA la pantalla
  // como overlay fixed — el mapa compartido de aquí debajo no se ve, así que desmontarlo mientras
  // tanto no es solo una optimización: un <canvas> WebGL de Mapbox GL puede componerse en su propia
  // capa GPU y "filtrarse" por encima de un overlay aunque el z-index/orden del DOM ya sean
  // correctos (mismo problema ya documentado para los controles de atribución, ver
  // body:has(.map-cover-overlay) en index.css — ahí la solución es ocultar el control porque el
  // mapa de encima SÍ debe seguir viéndose; aquí, como no debe verse nada del mapa de abajo en
  // absoluto, la solución robusta es no renderizarlo mientras el día esté abierto).
  const dayDetailOpen = mode === 'days' && activeDayId !== null
  const mapHidden = (canCollapseMap && mapCollapsed) || dayDetailOpen

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

  // Tirador gris del panel inferior en móvil — arrastrar hacia arriba encoge el mapa, hacia abajo
  // lo agranda; siempre clampado entre MOBILE_MAP_MIN_VH y MOBILE_MAP_MAX_VH, así que ni el mapa ni
  // el panel (con su propio tirador, siempre dentro de él) pueden llegar a desaparecer del todo.
  // Basado en clientY, no en el ancho del contenedor — por eso usa vh en vez del pct de
  // `handleDragStart`.
  const handleMobilePanelDragStart = (event: ReactPointerEvent) => {
    event.preventDefault()
    const startY = event.clientY
    const startVh = mobileMapVh
    const vhUnit = window.innerHeight / 100

    const clampedVh = (clientY: number) => Math.min(MOBILE_MAP_MAX_VH, Math.max(MOBILE_MAP_MIN_VH, startVh + (clientY - startY) / vhUnit))

    const onPointerMove = (moveEvent: PointerEvent) => setMobileMapVh(clampedVh(moveEvent.clientY))
    const onPointerUp = (upEvent: PointerEvent) => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      setMobileMapVh(clampedVh(upEvent.clientY))
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
    <div className="flex h-dvh flex-col bg-bg text-text">
      <Header />

      <div ref={containerRef} style={splitStyle} className="flex flex-1 flex-col overflow-hidden md:flex-row">
        {!mapHidden && (
          <div className="relative shrink-0 max-md:h-[var(--mobile-map-h)] md:h-auto md:flex-none md:w-[var(--map-w)]">
            {showRouteStyleMap ? (
              <>
                {segments.length <= 1 ? (
                  <StopsMapView markers={[...buildCombinedDaysMarkers(route.days), ...arrivalMarkers]} />
                ) : (
                  <RouteOverviewMap segments={segments} days={route.days} arrivalMarkers={arrivalMarkers} />
                )}
                <MapDestinationHeader destination={route.destination} dateRange={route.answers.dateRange} onChangeDateRange={setRouteDateRange} />
              </>
            ) : mode === 'explore' && exploreMarkers !== null ? (
              <StopsMapView markers={exploreMarkers} activeStopId={exploreActiveId} onSelectStop={setExploreActiveId} />
            ) : (
              <StopsMapView
                markers={buildCombinedDaysMarkers(route.days, activeDayId)}
                activeStopId={activeStopId}
                onSelectStop={setActiveStopId}
              />
            )}
            {canCollapseMap && (
              <button
                type="button"
                onClick={() => setMapCollapsed(true)}
                aria-label="Ocultar mapa"
                title="Ocultar mapa"
                className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border-2 border-accent bg-bg-card text-text-soft shadow-md transition-colors hover:bg-bg-hover"
              >
                <CollapseMapIcon />
              </button>
            )}
          </div>
        )}

        {!mapHidden && (
          <div onMouseDown={handleDragStart} className="hidden w-1.5 shrink-0 cursor-col-resize bg-border transition-colors hover:bg-accent md:block" />
        )}

        <div className={`relative flex min-h-0 flex-1 flex-col overflow-hidden ${mapHidden ? 'md:w-full' : 'md:w-[var(--split-w)]'}`}>
          {mapHidden ? (
            <button
              type="button"
              onClick={() => setMapCollapsed(false)}
              className="mx-4 mt-3 flex shrink-0 items-center justify-center gap-1.5 self-start rounded-full border-2 border-accent bg-bg-card px-3 py-1.5 text-caption font-semibold text-text shadow-sm transition-colors hover:bg-bg-hover"
            >
              <ExpandMapIcon />
              Mostrar mapa
            </button>
          ) : (
            <div
              onPointerDown={handleMobilePanelDragStart}
              className="flex shrink-0 cursor-row-resize touch-none items-center justify-center py-2 md:hidden"
            >
              <span className="h-1.5 w-10 rounded-full bg-border" />
            </div>
          )}
          <ModeSwitcher showToday={hasTripDates} />

          {mode === 'today' && hasTripDates && <TodayView route={route} />}

          {mode === 'route' && <RouteOverview route={route} />}

          {mode === 'explore' && (
            <ExplorePanel
              route={route}
              defaultCity={activeDay.city}
              onMarkersChange={setExploreMarkers}
              activeResultId={exploreActiveId}
              onSelectResultId={setExploreActiveId}
            />
          )}

          {mode === 'days' && (
            <>
              {route.isPreview && (
                <div className="mx-4 mt-4 shrink-0 rounded-xl bg-accent-soft px-4 py-3 text-small text-accent-hover">
                  🚧 Las rutas generadas por IA llegan muy pronto — esto es una vista previa con datos de ejemplo.
                </div>
              )}
              <DayList route={route} activeDayId={activeDayId} onSelectDay={setActiveDayId} />
            </>
          )}
        </div>
      </div>

      {/* Ocultos en la pantalla completa de detalle de un día (DayDetailPanel, ver DayList.tsx): ya tiene su propio mini-mapa arriba, y el presupuesto no aplica en ese contexto — solo visibles en las pantallas principales. */}
      {!(mode === 'days' && activeDayId) && (
        <>
          <FloatingCombinedMapButton onClick={() => setMode('route')} />
          <FloatingBudget />
        </>
      )}
    </div>
  )
}
