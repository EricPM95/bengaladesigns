import { useEffect, useState } from 'react'
import type { Route, Stop } from '../../../lib/types'
import type { MealWindowKind } from '../../../lib/todayMode'
import {
  FREE_GAP_THRESHOLD_MINUTES,
  computeFreeGapMinutes,
  findCurrentStopIndex,
  findGeneratedMealForWindow,
  getMealWindowAtForDay,
  getStopPlannedWindow,
  getStopRuntimeState,
  getTodayTripStatus,
  minutesSinceMidnight,
  resolveRealStops,
} from '../../../lib/todayMode'
import { buildMockMealForWindow, resolveDisplayStops } from '../../../lib/mockDayDetail'
import { cancelLocalNotification, ensureNotificationPermission, scheduleLocalNotification } from '../../../lib/localNotifications'
import { useRouteStore } from '../../../store/useRouteStore'
import { TodayHeader } from './TodayHeader'
import { TodayProgressBar } from './TodayProgressBar'
import { TodayEmptyState } from './TodayEmptyState'
import { DevDateSimulator } from './DevDateSimulator'
import { CurrentStopCard } from './CurrentStopCard'
import { NextStopPreview } from './NextStopPreview'
import { MealRecommendationCard } from './MealRecommendationCard'
import { FreeTimeBanner } from './FreeTimeBanner'
import { PlaceFinderPanel } from '../placeFinder/PlaceFinderPanel'
import { PaceWandPrompt } from './PaceWandPrompt'
import { RainAlert } from './RainAlert'
import { ReservationCountdown, TodayAdjust, TodayClosureNotices, TodayTimeCheck } from './TodayPlan'
import { RestCard } from '../dayDetail/RestCard'
import { checkTime, type CheckTimeResult } from '../../../lib/checkTime'
import { addDaysToIso, todayIso } from '../../../lib/dateRange'

const CLOCK_TICK_MS = 30_000

interface TodayViewProps {
  route: Route
}

/**
 * Modo Hoy — se monta siempre que la ruta tiene fechas exactas (ver RouteView/ModeSwitcher), pero
 * el contenido real (parada actual/check-in, 3 estados, preview de "a continuación", avisos de
 * margen libre/"varita mágica") solo se renderiza cuando `getTodayTripStatus` dice que el viaje
 * está "during" — antes/después del viaje se muestra TodayEmptyState en su lugar, nunca junto al
 * contenido. `dev_simulated_today_iso` (ver DevDateSimulator.tsx) deja probar cualquier fase sin
 * tocar el reloj del sistema — solo visible en desarrollo (import.meta.env.DEV).
 */
export function TodayView({ route }: TodayViewProps) {
  const seedDayStops = useRouteStore((state) => state.seedDayStops)
  const insertStopAt = useRouteStore((state) => state.insertStopAt)
  const checkInStop = useRouteStore((state) => state.checkInStop)
  const noteStopDelay = useRouteStore((state) => state.noteStopDelay)
  const compressStopsFrom = useRouteStore((state) => state.compressStopsFrom)
  const removeStop = useRouteStore((state) => state.removeStop)
  const devSimulatedTodayIso = useRouteStore((state) => state.dev_simulated_today_iso)
  const setDevSimulatedTodayIso = useRouteStore((state) => state.setDevSimulatedTodayIso)

  const [now, setNow] = useState(() => new Date())
  const [wandPace, setWandPace] = useState<'early' | 'late' | null>(null)
  const [wandStopId, setWandStopId] = useState<string | null>(null)
  const [wandMealWindow, setWandMealWindow] = useState<MealWindowKind | null>(null)
  const [poolOpen, setPoolOpen] = useState(false)
  const [timeCheck, setTimeCheck] = useState<CheckTimeResult | null>(null)
  const [suggestOpen, setSuggestOpen] = useState(false)
  const addSuggestedStop = useRouteStore((state) => state.addSuggestedStop)
  const setMealRestaurant = useRouteStore((state) => state.setMealRestaurant)

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), CLOCK_TICK_MS)
    return () => clearInterval(id)
  }, [])

  const tripStatus = getTodayTripStatus(route, devSimulatedTodayIso ?? undefined)
  if (!tripStatus) return null

  const devSimulator = import.meta.env.DEV && <DevDateSimulator value={devSimulatedTodayIso} onChange={setDevSimulatedTodayIso} />

  if (tripStatus.phase !== 'during') {
    return (
      <div className="flex-1 space-y-4 overflow-y-auto pb-6 pt-4">
        {devSimulator}
        <TodayEmptyState phase={tripStatus.phase} startIso={tripStatus.startIso} />
        {/* La víspera: si el viaje empieza mañana y hay lluvia prevista, ya se avisa (Tanda 6). */}
        {tripStatus.phase === 'before' && route.days[0] && tripStatus.startIso === addDaysToIso(devSimulatedTodayIso ?? todayIso(), 1) && <RainAlert day={route.days[0]} dateIso={tripStatus.startIso} when="manana" />}
      </div>
    )
  }

  const { day, dateIso } = tripStatus.context
  // La víspera (desde las 18:00): el día de mañana, por si hay lluvia prevista.
  const tomorrowDay = route.days[tripStatus.context.dayIndex + 1]
  const eveRain = now.getHours() >= 18 && tomorrowDay && !tomorrowDay.isReturnLeg ? <RainAlert day={tomorrowDay} dateIso={addDaysToIso(dateIso, 1)} when="manana" /> : null
  const nowMin = minutesSinceMidnight(now)
  const realStops = resolveRealStops(day)
  const displayStops = resolveDisplayStops(day)
  const otherDays = route.days.filter((candidate) => !candidate.isReturnLeg && candidate.id !== day.id).map((candidate) => ({ id: candidate.id, dayNumber: candidate.dayNumber, city: candidate.city }))

  const currentIndex = findCurrentStopIndex(realStops, nowMin)
  const total = realStops.length

  const ensureSeeded = () => {
    if (day.stops.length === 0) seedDayStops(day.id, realStops)
  }

  const handleCheckIn = (stop: Stop, stopIndex: number) => {
    ensureSeeded()
    cancelLocalNotification(`today-${day.id}-${stop.id}`)

    checkInStop(day.id, stop.id)
    setWandMealWindow(null)
    setWandPace(null)
    setWandStopId(null)
    // Tanda 6b: cómo va de tiempo («Vas bien de tiempo» / «Vas justo»); el viajero decide siempre.
    setTimeCheck(null)
    setSuggestOpen(false)
    void checkTime(day.id, nowMin).then(setTimeCheck)

    const next = realStops[stopIndex + 1]
    if (!next) return
    ensureNotificationPermission().then((permission) => {
      if (permission !== 'granted') return
      const { endMin } = getStopPlannedWindow(next)
      const delayMs = (endMin - nowMin) * 60_000
      if (delayMs <= 0) return
      scheduleLocalNotification({
        id: `today-${day.id}-${next.id}`,
        title: 'Terminas por aquí',
        body: '¿Tienes tiempo para algo cerca?',
        delayMs,
      })
    })
  }

  const handleNoteDelay = (stop: Stop) => {
    ensureSeeded()
    noteStopDelay(day.id, stop.id)
  }

  const handleRecheck = () => {
    setSuggestOpen(false)
    void checkTime(day.id, minutesSinceMidnight(new Date())).then(setTimeCheck)
  }

  const handleAddSuggestion = (stop: Stop, afterIndex: number) => {
    ensureSeeded()
    addSuggestedStop(day.id, stop, afterIndex)
    if (stop.mealChange) setMealRestaurant(day.id, stop.mealChange.mealTime, stop.mealChange.restaurant)
    setTimeCheck((prev) => (prev ? { ...prev, suggestions: prev.suggestions.filter((other) => other.id !== stop.id) } : prev))
  }

  const handleWandAddSomething = () => {
    const mealWindow = getMealWindowAtForDay(nowMin, day)
    if (mealWindow) setWandMealWindow(mealWindow)
    else setPoolOpen(true)
    setWandPace(null)
  }

  const handleCompress = () => {
    if (wandStopId) compressStopsFrom(day.id, wandStopId, nowMin)
    setWandPace(null)
    setWandStopId(null)
  }

  const handlePickNearby = (stop: Stop, afterIndex: number) => {
    ensureSeeded()
    insertStopAt(day.id, afterIndex + 1, stop)
  }

  const handleDropLowestPriority = () => {
    // Heurística simple y determinista: la última parada pendiente del día — la más fácil de
    // recortar sin desmontar el resto del plan. Requiere confirmación explícita (ver PaceWandPrompt).
    const pending = realStops.filter((stop) => !stop.checkedInAt)
    const target = pending[pending.length - 1]
    ensureSeeded()
    if (target) removeStop(day.id, target.id)
    setWandPace(null)
    setWandStopId(null)
  }

  const allDone = currentIndex === -1
  const timeBlock = (
    <>
      <TodayTimeCheck
        day={day}
        nowMin={nowMin}
        result={timeCheck}
        suggestOpen={suggestOpen}
        onSuggestOpen={setSuggestOpen}
        onRecheck={handleRecheck}
        onAdd={(stop) => handleAddSuggestion(stop, allDone ? realStops.length - 1 : currentIndex)}
        onResolved={() => setTimeCheck(null)}
      />
      {/* Tanda 6b: la tarjeta de descanso, cuando solo queda lo de la noche; con tiempo de sobra, «¿Quieres ver algo más?». */}
      {day.restCard && realStops.every((stop) => stop.checkedInAt || stop.franja === 'noche') && (
        <div className="mx-4">
          <RestCard card={day.restCard}>
            {timeCheck?.status === 'bien' && (
              <button type="button" onClick={() => setSuggestOpen(true)} className="mt-2 text-[13px] font-semibold text-accent">
                ¿Quieres ver algo más?
              </button>
            )}
          </RestCard>
        </div>
      )}
    </>
  )
  const currentRealStop = allDone ? null : realStops[currentIndex]
  const currentDisplayStop = allDone ? null : displayStops[currentIndex]
  // El siguiente índice SIN check-in, no simplemente currentIndex+1 — una parada insertada desde
  // DIAS puede colarse antes de una que ya se marcó como visitada (ver StopMenu "Mover antes").
  const nextIndex = allDone ? -1 : realStops.findIndex((stop, index) => index > currentIndex && !stop.checkedInAt)
  const nextRealStop = nextIndex === -1 ? undefined : realStops[nextIndex]
  const nextDisplayStop = nextIndex === -1 ? undefined : displayStops[nextIndex]
  const runtimeState = currentRealStop ? getStopRuntimeState(currentRealStop, nowMin) : null

  const gapMinutes = runtimeState === 'upcoming' ? computeFreeGapMinutes(realStops, currentIndex, nowMin) : null
  const mealWindow = getMealWindowAtForDay(nowMin, day)
  const showFreeGapBlock = gapMinutes !== null && gapMinutes >= FREE_GAP_THRESHOLD_MINUTES
  const passiveMeal = showFreeGapBlock && mealWindow ? (findGeneratedMealForWindow(day, mealWindow) ?? buildMockMealForWindow(day, mealWindow)) : null

  // El aviso de "varita mágica" tras un check-in fuera de lo normal se muestra tanto en el flujo
  // normal como cuando ese check-in era el de la última parada del día — el margen del check-in no
  // depende de si queda otra parada después.
  const wandBlock = (
    <>
      {wandPace === 'early' && <PaceWandPrompt kind="early" onAddSomething={handleWandAddSomething} onDismiss={() => setWandPace(null)} />}
      {wandPace === 'late' && (
        <PaceWandPrompt kind="late" onCompress={handleCompress} onDropLowestPriority={handleDropLowestPriority} onDismiss={() => setWandPace(null)} />
      )}
      {wandMealWindow && (
        <div className="mx-4">
          <MealRecommendationCard meal={findGeneratedMealForWindow(day, wandMealWindow) ?? buildMockMealForWindow(day, wandMealWindow)} />
        </div>
      )}
    </>
  )

  if (allDone || !currentRealStop || !currentDisplayStop || !runtimeState) {
    return (
      <div className="flex-1 space-y-4 overflow-y-auto pb-6">
        <TodayHeader dayId={day.id} dateIso={dateIso} city={day.city} />
        {devSimulator}
        <div className="mx-4 rounded-2xl border border-border bg-bg-card p-6 text-center">
          <p className="text-body font-semibold text-text">Has completado todas las paradas de hoy 🎉</p>
          <p className="mt-1 text-small text-text-soft">Buen ritmo — puedes revisar el resto del día en la pestaña Días.</p>
        </div>
        {timeBlock}
        {wandBlock}
        {eveRain}
        <PlaceFinderPanel
          open={poolOpen}
          onClose={() => setPoolOpen(false)}
          city={day.city}
          excludeStopIds={realStops.map((stop) => stop.id)}
          onPick={(stop) => handlePickNearby(stop, realStops.length - 1)}
          sortByProximity
        />
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 overflow-y-auto pb-6">
      <TodayHeader dayId={day.id} dateIso={dateIso} city={day.city} />
      {devSimulator}
      <TodayProgressBar current={currentIndex + 1} total={total} />

      <RainAlert day={day} dateIso={dateIso} when="hoy" />
      {eveRain}

      <CurrentStopCard
        day={day}
        index={currentIndex}
        realStop={currentRealStop}
        displayStop={currentDisplayStop}
        state={runtimeState}
        nowMin={nowMin}
        realStops={realStops}
        otherDays={otherDays}
        previousStop={currentIndex > 0 ? realStops[currentIndex - 1] : undefined}
        onCheckIn={() => handleCheckIn(currentRealStop, currentIndex)}
        onNoteDelay={() => handleNoteDelay(currentRealStop)}
      />

      {timeBlock}

      <ReservationCountdown stops={realStops} nowMin={nowMin} />
      <TodayClosureNotices stops={realStops} />

      {wandBlock}

      {nextRealStop && nextDisplayStop && <NextStopPreview realStop={nextRealStop} displayStop={nextDisplayStop} from={currentRealStop.coordinates} />}

      {showFreeGapBlock && (
        <div className="mx-4">
          {passiveMeal ? <MealRecommendationCard meal={passiveMeal} /> : <FreeTimeBanner minutes={gapMinutes!} onAddNearby={() => setPoolOpen(true)} />}
        </div>
      )}

      <TodayAdjust day={day} nowMin={nowMin} />

      <PlaceFinderPanel
        open={poolOpen}
        onClose={() => setPoolOpen(false)}
        city={day.city}
        excludeStopIds={realStops.map((stop) => stop.id)}
        onPick={(stop) => handlePickNearby(stop, currentIndex)}
        sortByProximity
      />
    </div>
  )
}
