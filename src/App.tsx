import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useRouteStore } from './store/useRouteStore'
import { useSyncStore } from './store/useSyncStore'
import { LandingScreen } from './components/destination/LandingScreen'
import { PlacesPoolScreen } from './components/destination/PlacesPoolScreen'
import { Questionnaire } from './components/questionnaire/Questionnaire'
import { LoadingScreen } from './components/loading/LoadingScreen'
import { runGeneration, type GenerationParams, type GenerationResumeState } from './lib/routeGenerationOrchestrator'
import { mapGeneratedRouteToRoute } from './lib/mapGeneratedRoute'
import { applyRealStopSchedule } from './lib/stopScheduling'
import { enrichRoutePhotos } from './lib/placePhoto'
import { saveGenerationCheckpoint } from './lib/tripPersistence'
import type { QuestionnaireAnswers } from './lib/types'
import { RouteView } from './components/route/RouteView'
import { Layout } from './components/layout/Layout'
import { decodeTripFromUrl } from './lib/shareUrl'
import { DevQuickRouteScreen } from './components/dev/DevQuickRouteScreen'
import { TripSync } from './components/sync/TripSync'
import { SyncStatusBanner } from './components/sync/SyncStatusBanner'
import { MyTripsScreen } from './components/myTrips/MyTripsScreen'

function QuestionnaireScreen() {
  return (
    <motion.div
      key="questionnaire"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -24 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="min-h-dvh bg-bg text-text"
    >
      <Questionnaire />
    </motion.div>
  )
}

function LoadingScreenContainer() {
  const destination = useRouteStore((state) => state.destination)
  const archetype = useRouteStore((state) => state.archetype)
  const isRegion = useRouteStore((state) => state.is_region)
  const transportOption = useRouteStore((state) => state.transport_option)
  const vehicleType = useRouteStore((state) => state.vehicle_type)
  const vehicleOwnership = useRouteStore((state) => state.vehicle_ownership)
  const accommodationMode = useRouteStore((state) => state.accommodation_mode)
  const travelMode = useRouteStore((state) => state.travel_mode)
  const paseDominante = useRouteStore((state) => state.pase_dominante)
  const vehiculoAltamenteRecomendado = useRouteStore((state) => state.vehiculo_altamente_recomendado)
  const travelPassConfirmed = useRouteStore((state) => state.travel_pass_confirmed)
  const answers = useRouteStore((state) => state.answers)
  const suggestedPlaces = useRouteStore((state) => state.suggested_places)
  const selectedPlaceIds = useRouteStore((state) => state.selected_place_ids)
  const setRoute = useRouteStore((state) => state.setRoute)
  const setScreen = useRouteStore((state) => state.setScreen)
  const pendingResume = useSyncStore((state) => state.pendingResume)
  const setPendingResume = useSyncStore((state) => state.setPendingResume)
  const travelerId = useSyncStore((state) => state.travelerId)
  const generationComplete = useSyncStore((state) => state.generationComplete)
  const setGenerationComplete = useSyncStore((state) => state.setGenerationComplete)

  const [status, setStatus] = useState<'loading' | 'done' | 'error'>('loading')
  const [checkpoint, setCheckpoint] = useState<GenerationResumeState | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined)
  const [route, setLocalRoute] = useState<ReturnType<typeof useRouteStore.getState>['route']>(null)
  const [attempt, setAttempt] = useState(0)
  // Progreso ya alcanzado EN ESTA sesión de pantalla — un "Reintentar" tras un fallo a medio camino
  // retoma desde aquí (no desde cero), igual que retomaría una generación cargada de Supabase.
  const lastCheckpointRef = useRef<GenerationResumeState | null>(null)
  // Últimos `params` usados para generar — el listener de `visibilitychange` de más abajo los
  // necesita para poder reintentar `finalizeRoute` fuera del efecto de generación (BUG 2).
  const paramsRef = useRef<GenerationParams | null>(null)

  // Remate compartido entre el propio callback de checkpoint y el listener de `visibilitychange`
  // de más abajo (BUG 2) — mapear + calcular el horario real (Mapbox) es trabajo async que puede
  // quedarse colgado si el navegador congela la pestaña en segundo plano justo mientras corre; si
  // eso pasa, `generationComplete` (persistente en el store, ver useSyncStore.ts) sigue siendo
  // true y el listener puede reintentar exactamente este mismo remate al volver a primer plano, en
  // vez de esperar a que la promesa suspendida se reanude por su cuenta.
  const finalizeRoute = async (finalCheckpoint: GenerationResumeState, params: GenerationParams) => {
    const mapped = mapGeneratedRouteToRoute(finalCheckpoint.generated, destination, params.answers, params.transportContext)
    // Horario real por parada (hora de inicio + colchón según ritmo + tiempo a pie real, ver
    // stopScheduling.ts) — sustituye al suggested_time/travel_to_next de Claude, que es solo una
    // estimación de la propia IA sin verificar contra Mapbox. Se hace aquí, tras mapear pero antes
    // de mostrar la ruta, para que el viajero nunca vea el horario "en bruto" de la IA.
    const scheduled = await applyRealStopSchedule(mapped, params.answers.pace ?? 'balanced')
    // Mejor esfuerzo, nunca bloquea: sustituye el placeholder aleatorio de picsum por una foto real
    // de Wikipedia cuando la encuentra (ver placePhoto.ts) — si falla o tarda, la ruta sigue con el
    // placeholder tal cual, nunca se queda colgada por esto.
    await enrichRoutePhotos(scheduled).catch(() => {})
    return scheduled
  }

  useEffect(() => {
    if (!destination) return
    let cancelled = false
    setStatus('loading')
    setGenerationComplete(false)

    const resumeState = lastCheckpointRef.current ?? pendingResume
    if (pendingResume) setPendingResume(null)

    const params: GenerationParams = resumeState
      ? resumeState.params
      : {
          destination,
          answers: answers as QuestionnaireAnswers,
          transportContext: {
            archetype,
            is_region: isRegion,
            transport_option: transportOption,
            vehicle_type: vehicleType,
            vehicle_ownership: vehicleOwnership,
            accommodation_mode: accommodationMode,
            travel_mode: travelMode,
            pase_dominante: paseDominante,
            vehiculo_altamente_recomendado: vehiculoAltamenteRecomendado,
            travel_pass_confirmed: travelPassConfirmed,
          },
          mustIncludePlaces: suggestedPlaces.filter((place) => selectedPlaceIds.includes(place.id)).map((place) => place.name),
        }

    paramsRef.current = params
    setCheckpoint(resumeState)

    runGeneration(params, resumeState, async (nextCheckpoint) => {
      if (cancelled) return
      lastCheckpointRef.current = nextCheckpoint
      setCheckpoint(nextCheckpoint)
      if (travelerId) {
        try {
          const tripId = useSyncStore.getState().activeTripId
          const savedId = await saveGenerationCheckpoint(travelerId, tripId, nextCheckpoint)
          // Primer checkpoint guardado de un viaje nuevo (insert) — los siguientes actualizan esta
          // misma fila en vez de crear una nueva cada vez (ver saveGenerationCheckpoint).
          if (!tripId && savedId) useSyncStore.getState().setActiveTripId(savedId)
        } catch {
          // El guardado de progreso falló (sin conexión, etc.) — no se aborta la generación, sigue
          // en memoria; TripSync ya cubre el aviso discreto de guardado en general.
        }
      }
      // La navegación se decide AQUÍ, en cuanto el checkpoint dice que ya está todo generado — no
      // se espera a que además se resuelva la promesa que envuelve runGeneration en memoria. Si el
      // móvil pierde el foco/la conexión a mitad de generación, esa promesa puede quedarse colgada
      // aunque los checkpoints (y el guardado en Supabase) sigan llegando bien al reconectar — antes
      // la navegación dependía solo del `.then()` de abajo, así que se quedaba parada en la pantalla
      // de carga con todos los pasos ya en verde. La pregunta correcta es "¿está todo el contenido
      // ya generado (y guardado)?", que es justo lo que este checkpoint confirma.
      if (nextCheckpoint.phase === 'done' && !cancelled) {
        // Marcado en el store ANTES del remate async (BUG 2) — si la pestaña se congela justo
        // aquí, el flag ya quedó puesto y el listener de `visibilitychange` de más abajo puede
        // reintentar `finalizeRoute` al volver a primer plano, sin depender de que esta misma
        // promesa se reanude por su cuenta.
        setGenerationComplete(true)
        const scheduled = await finalizeRoute(nextCheckpoint, params)
        if (cancelled) return
        setLocalRoute(scheduled)
        setStatus('done')
      }
    }).catch((error: unknown) => {
      if (cancelled) return
      setErrorMessage(error instanceof Error ? error.message : 'No se pudo generar la ruta con IA.')
      setStatus('error')
    })

    return () => {
      cancelled = true
    }
    // `attempt` solo cambia para forzar un reintento (retoma desde lastCheckpointRef si ya se avanzó
    // algo). El resto de dependencias son deliberadamente solo del primer render — un cambio a media
    // generación no debe reiniciarla.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destination, attempt])

  // BUG 2 (feedback de calidad): si el navegador congela la ejecución de JS de la pestaña en
  // segundo plano (cambio de pestaña, app minimizada en móvil) justo mientras `finalizeRoute`
  // estaba en marcha tras el checkpoint final, esa promesa puede quedarse colgada sin completar —
  // la pantalla se queda con todos los pasos en verde pero nunca redirige. Al volver a primer
  // plano, si `generationComplete` (persistente en el store, sobrevive aunque la pestaña se haya
  // congelado) ya es true pero esta pantalla no llegó a `status === 'done'`, se reintenta el
  // remate con el último checkpoint/params conocidos en vez de depender de que la promesa
  // original se reanude por su cuenta.
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible') return
      if (!generationComplete || status === 'done' || route) return
      const finalCheckpoint = lastCheckpointRef.current
      const params = paramsRef.current
      if (!finalCheckpoint || finalCheckpoint.phase !== 'done' || !params) return
      finalizeRoute(finalCheckpoint, params).then((scheduled) => {
        setLocalRoute(scheduled)
        setStatus('done')
      })
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generationComplete, status, route])

  if (!destination) return null

  const handleFinish = () => {
    if (!route) return
    setRoute(route)
    setScreen('route')
  }

  const handleRetry = () => setAttempt((value) => value + 1)

  const completedDayNumbers = (checkpoint?.generated.days ?? []).filter((day) => day.stops.length > 0).map((day) => day.day_number)

  return (
    <LoadingScreen
      origin={answers.origin ?? ''}
      destination={destination}
      status={status}
      phase={checkpoint?.phase ?? 'skeleton'}
      totalBlocks={checkpoint?.totalBlocks ?? 0}
      skeletonDays={checkpoint?.skeleton?.days ?? []}
      completedDayNumbers={completedDayNumbers}
      tripStartIso={answers.dateRange?.start}
      errorMessage={errorMessage}
      onFinish={handleFinish}
      onRetry={handleRetry}
    />
  )
}

function RouteScreen() {
  return (
    <motion.div
      key="route"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="h-dvh"
    >
      <RouteView />
    </motion.div>
  )
}

function App() {
  const screen = useRouteStore((state) => state.screen)
  const setDestination = useRouteStore((state) => state.setDestination)
  const setArchetype = useRouteStore((state) => state.setArchetype)
  const setTransportOption = useRouteStore((state) => state.setTransportOption)
  const setVehicleOwnership = useRouteStore((state) => state.setVehicleOwnership)
  const setTravelMode = useRouteStore((state) => state.setTravelMode)
  const setTravelPassConfirmed = useRouteStore((state) => state.setTravelPassConfirmed)
  const updateAnswers = useRouteStore((state) => state.updateAnswers)
  const setScreen = useRouteStore((state) => state.setScreen)

  useEffect(() => {
    const sharedTrip = decodeTripFromUrl()
    if (sharedTrip) {
      // El enlace compartido ya lleva todo lo decidido en la fase de transporte — se restaura
      // tal cual, sin volver a clasificar el destino ni volver a preguntar nada.
      setDestination(sharedTrip.destination)
      updateAnswers(sharedTrip.answers)
      setArchetype(
        sharedTrip.transportContext.archetype,
        sharedTrip.transportContext.is_region,
        undefined,
        sharedTrip.transportContext.pase_dominante,
        sharedTrip.transportContext.vehiculo_altamente_recomendado,
      )
      setTransportOption(sharedTrip.transportContext.transport_option)
      setVehicleOwnership(sharedTrip.transportContext.vehicle_ownership)
      setTravelMode(sharedTrip.transportContext.travel_mode)
      setTravelPassConfirmed(sharedTrip.transportContext.travel_pass_confirmed)
      setScreen('loading')
    }
  }, [])

  return (
    <Layout>
      <TripSync />
      <SyncStatusBanner />
      <AnimatePresence mode="wait">
        {screen === 'destination' && <LandingScreen />}
        {screen === 'myTrips' && <MyTripsScreen key="myTrips" />}
        {screen === 'placesPool' && <PlacesPoolScreen />}
        {screen === 'questionnaire' && <QuestionnaireScreen />}
        {screen === 'loading' && <LoadingScreenContainer key="loading" />}
        {screen === 'route' && <RouteScreen />}
        {screen === 'devQuickRoute' && import.meta.env.DEV && <DevQuickRouteScreen />}
      </AnimatePresence>
    </Layout>
  )
}

export default App
