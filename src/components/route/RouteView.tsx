import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react'
import { useRouteStore } from '../../store/useRouteStore'
import { buildDestinationSegments } from '../../lib/destinationSegments'
import { buildCombinedDaysLines, buildCombinedDaysMarkers } from '../../lib/routeMapMarkers'
import { ConfirmDialog } from './ConfirmDialog'
import { useAddFlowStore, withUndo } from '../../store/useAddFlowStore'
import { useArrivalMarkers } from '../../lib/useArrivalMarkers'
import { getTodayTripContext } from '../../lib/todayMode'
import { Header } from '../layout/Header'
import { BottomBar } from '../layout/BottomBar'
import { StopsMapView, type StopsMapMarker } from '../map/StopsMapView'
import { DayList } from './DayList'
import type { DayMapView } from './dayDetail/DayDetailPanel'
import { ExplorePanel } from './ExplorePanel'
import { MapDestinationHeader } from './MapDestinationHeader'
import { ModeSwitcher } from './ModeSwitcher'
import { ReservasPanel } from './ReservasPanel'
import { RouteOverview } from './RouteOverview'
import { DateNoticesModal } from './DateNoticesModal'
import { useDatesChange } from './DatesChangeDialog'
import { RouteOverviewMap } from './RouteOverviewMap'
import { TodayView } from './today/TodayView'
import { AddToTripScreen } from './freeDay/AddToTripScreen'
import { UndoToast } from './freeDay/UndoToast'

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

export function RouteView() {
  const route = useRouteStore((state) => state.route)
  const mode = useRouteStore((state) => state.mode)
  const setMode = useRouteStore((state) => state.setMode)
  const activeDayId = useRouteStore((state) => state.activeDayId)
  const setActiveDayId = useRouteStore((state) => state.setActiveDayId)
  const panelSplit = useRouteStore((state) => state.panelSplit)
  const setPanelSplit = useRouteStore((state) => state.setPanelSplit)
  const devSimulatedTodayIso = useRouteStore((state) => state.dev_simulated_today_iso)
  // Fechas desde el mapa: en los curados, la ruta se rehace (y se pregunta si ya estaba editada a mano).
  const { onChangeDateRange: setRouteDateRange, dialog: datesDialog } = useDatesChange(route)

  const containerRef = useRef<HTMLDivElement>(null)
  const [activeStopId, setActiveStopId] = useState<string | null>(null)
  const [mapCollapsed, setMapCollapsed] = useState(false)
  // Publicado por ExplorePanel mientras "Comer y beber"/"Miradores y fotos" está activo — sustituye
  // a las paradas del día activo en este mismo mapa compartido (null = mapa normal de DIAS/Hoy).
  const [exploreMarkers, setExploreMarkers] = useState<StopsMapMarker[] | null>(null)
  const [exploreActiveId, setExploreActiveId] = useState<string | null>(null)
  // EXPLORAR abre su pantalla de lugares (PlaceExplorerScreen) con su PROPIO mapa por encima de
  // todo esto — mismo motivo que dayDetailOpen más abajo: mientras esté abierta, el mapa compartido
  // de aquí no se monta, o se cuela por encima del overlay que se supone que lo tapa.
  const [exploreFullScreen, setExploreFullScreen] = useState(false)
  // DIAS con un día abierto (acordeón, diseño "Trazo Itinerario"): el mapa de aquí arriba enseña lo
  // que publica ese día (DayDetailPanel), y se desmonta mientras una pantalla suya con mapa propio
  // (ficha, comida, llegada, añadir parada) está abierta encima.
  const [dayMap, setDayMap] = useState<DayMapView | null>(null)
  const [dayOverlayOpen, setDayOverlayOpen] = useState(false)
  // "Ver todo": todos los días a la vez en vez de solo el abierto (Ronda 9, Mejora 1C).
  const [showAllDaysOnMap, setShowAllDaysOnMap] = useState(false)
  // "Volver a mi ruta original": la pregunta, y si la varita ya se vio con su texto (luego va sola).
  const restoreOriginalRoute = useRouteStore((state) => state.restoreOriginalRoute)
  const [askRestoreRoute, setAskRestoreRoute] = useState(false)
  // Los tips del viaje (la bombilla de la cabecera, PROMPT_UI_REPASO_2 3).
  const [tipsOpen, setTipsOpen] = useState(false)
  void tipsOpen // (la ventana de los tips llega en la parte 3)
  /** La varita: con cambios, pregunta si se vuelve a la original; sin cambios, lo dice (PROMPT_UI_REPASO 3). */
  const onWand = () => {
    if (route?.editedManually && route.originalRoute) setAskRestoreRoute(true)
    else useAddFlowStore.setState({ toast: { message: 'Tu ruta está tal como te la preparamos', previous: null, id: Date.now() } })
  }

  // Altura del mapa en móvil (vh) cuando ni mapa ni panel están a pantalla completa — controlada
  // por el tirador gris (ver handleMobilePanelDragStart). En desktop no se usa (el layout pasa a
  // fila y el ancho se controla con panelSplit/handleDragStart). Por defecto cerca del mínimo — el
  // panel inferior (contenido real) es el protagonista; arrastrar el tirador hacia abajo agranda el
  // mapa si hace falta.
  // Diseño "Trazo Itinerario": el mapa abierto mide ~270 px en un móvil de 812 (un tercio de pantalla).
  const [mobileMapVh, setMobileMapVh] = useState(33)

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
  const mapHidden = (canCollapseMap && mapCollapsed) || (dayDetailOpen && dayOverlayOpen) || (mode === 'explore' && exploreFullScreen)

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
      <Header onTips={() => setTipsOpen(true)} onWand={onWand} />

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
            ) : dayDetailOpen && dayMap ? (
              <>
                <StopsMapView markers={dayMap.markers} lines={dayMap.lines} center={dayMap.center} activeStopId={activeStopId} onSelectStop={setActiveStopId} />
                <MapDestinationHeader destination={route.destination} dateRange={route.answers.dateRange} onChangeDateRange={setRouteDateRange} />
                {/* Alterna "solo este día" (por defecto) y todos los días a la vez. */}
                <button
                  type="button"
                  onClick={() => setShowAllDaysOnMap((prev) => !prev)}
                  className="absolute bottom-8 left-3 z-10 rounded-full border border-text/10 bg-bg-card/90 px-3 py-1.5 text-[12px] font-medium text-text/60 shadow-sm backdrop-blur-sm transition-colors hover:text-text"
                >
                  {showAllDaysOnMap ? 'Solo este día' : 'Ver todo'}
                </button>
              </>
            ) : (
              <>
                <StopsMapView
                  markers={buildCombinedDaysMarkers(route.days, activeDayId)}
                  lines={buildCombinedDaysLines(route.days, activeDayId)}
                  activeStopId={activeStopId}
                  onSelectStop={setActiveStopId}
                />
                {/* Ronda 10: la cabecera destino + fechas no es solo de RUTA — se ve también aquí
                    (pestaña DIAS) y en el mapa de cada día (DayDetailPanel.tsx), para que el destino
                    y las fechas estén a la vista desde cualquier mapa de la app. */}
                <MapDestinationHeader destination={route.destination} dateRange={route.answers.dateRange} onChangeDateRange={setRouteDateRange} />
              </>
            )}
            {canCollapseMap && (
              <button
                type="button"
                onClick={() => setMapCollapsed(true)}
                aria-label="Ocultar mapa"
                title="Ocultar mapa"
                className="absolute right-3.5 top-[22px] z-10 flex h-10 w-10 items-center justify-center rounded-full border-[1.5px] border-accent bg-bg-card text-accent shadow-[0_8px_20px_-8px_rgba(28,34,48,.3)] transition-colors hover:bg-bg-hover"
              >
                <CollapseMapIcon />
              </button>
            )}
          </div>
        )}

        {!mapHidden && (
          <div onMouseDown={handleDragStart} className="hidden w-1.5 shrink-0 cursor-col-resize bg-border transition-colors hover:bg-accent md:block" />
        )}

        <div
          className={`relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden bg-bg ${mapHidden ? 'md:w-full' : 'max-md:-mt-[22px] max-md:rounded-t-[26px] max-md:shadow-[0_-10px_30px_-18px_rgba(28,34,48,.3)] md:w-[var(--split-w)]'}`}
        >
          {/* (Sin «Mostrar mapa»: el mapa se abre desde la barra de abajo, PROMPT_UI_REPASO_2 1.) */}
          {mapHidden ? null : (
            <div
              onPointerDown={handleMobilePanelDragStart}
              className="flex h-5 shrink-0 cursor-row-resize touch-none items-center justify-center md:hidden"
            >
              <span className="h-1 w-[42px] rounded-full bg-text/20" />
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
              onFullScreenChange={setExploreFullScreen}
            />
          )}

          {/* La barra de abajo, flotando sobre la lista (PROMPT_UI_REPASO_2 1). */}
          <BottomBar onMap={() => (mapHidden && canCollapseMap ? setMapCollapsed(false) : setMode('route'))} />

          {mode === 'days' && (
            <>
              {route.isPreview && (
                <div className="mx-4 mt-4 shrink-0 rounded-xl bg-accent-soft px-4 py-3 text-small text-accent-hover">
                  🚧 Las rutas generadas por IA llegan muy pronto — esto es una vista previa con datos de ejemplo.
                </div>
              )}
              <DayList
                route={route}
                activeDayId={activeDayId}
                onSelectDay={(dayId) => {
                  setActiveDayId(dayId)
                  if (dayId === null) setDayMap(null)
                }}
                onDayMapChange={setDayMap}
                onDayOverlayChange={setDayOverlayOpen}
                showAllDaysOnMap={showAllDaysOnMap}
              />
            </>
          )}
        </div>
      </div>

      {/* Avisos de fechas especiales: la primera vez que se abre la ruta, y al tocar la etiqueta de un día. */}
      <DateNoticesModal route={route} />
      {/* "+ Añadir día" / "+ Añadir lugares": la pantalla de añadir del viaje y el aviso con "Deshacer". */}
      <AddToTripScreen route={route} />
      <UndoToast />
      {askRestoreRoute && (
        <ConfirmDialog
          eyebrow="Ruta original"
          text="¿Volver a tu ruta original? Tus días quedarán tal como te los preparamos y se perderán los cambios que has hecho."
          confirmLabel="Volver a la original"
          cancelLabel="Cancelar"
          onCancel={() => setAskRestoreRoute(false)}
          onConfirm={() => {
            setAskRestoreRoute(false)
            setDayMap(null)
            withUndo('Ruta original recuperada', () => restoreOriginalRoute())
          }}
        />
      )}
      {datesDialog}
    </div>
  )
}
