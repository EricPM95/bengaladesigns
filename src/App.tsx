import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useRouteStore } from './store/useRouteStore'
import { DestinationInput } from './components/destination/DestinationInput'
import { RouteSearch, type ConfirmedRoute } from './components/destination/RouteSearch'
import { Questionnaire } from './components/questionnaire/Questionnaire'
import { LoadingScreen } from './components/loading/LoadingScreen'
import { useRouteGenerator } from './hooks/useRouteGenerator'
import type { Place, QuestionnaireAnswers, TransportContext } from './lib/types'
import { RouteView } from './components/route/RouteView'
import { Layout } from './components/layout/Layout'
import { decodeTripFromUrl } from './lib/shareUrl'
import { classifyInBackground } from './lib/classifyInBackground'
import { suggestExperiencesInBackground } from './lib/suggestExperiencesInBackground'
import { DevQuickRouteScreen } from './components/dev/DevQuickRouteScreen'
import { TripSync } from './components/sync/TripSync'
import { SyncStatusBanner } from './components/sync/SyncStatusBanner'

function DestinationScreen() {
  const setDestination = useRouteStore((state) => state.setDestination)
  const setArchetype = useRouteStore((state) => state.setArchetype)
  const setKnownCamperAccess = useRouteStore((state) => state.setKnownCamperAccess)
  const setScreen = useRouteStore((state) => state.setScreen)

  const handleSelectPlace = (place: Place) => {
    setDestination(place.name, place)
    classifyInBackground(place.name)
    suggestExperiencesInBackground(place.name)
    setScreen('questionnaire')
  }

  // Rutas panorámicas confirmadas ("¿No encuentras tu destino?") son inherentemente
  // roadtrip_exclusivo — se fija el arquetipo directo, sin pasar por /api/classify-destination.
  const handleConfirmRoute = (route: ConfirmedRoute) => {
    setDestination(route.name, route.startPlace)
    setArchetype('roadtrip_exclusivo', true)
    setKnownCamperAccess(route.camperAccess)
    suggestExperiencesInBackground(route.name)
    setScreen('questionnaire')
  }

  return (
    <motion.div
      key="destination"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, y: -24 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex min-h-[100svh] flex-col items-center justify-center bg-white px-6"
    >
      <div className="flex w-full max-w-xl flex-col items-center gap-6">
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="text-center font-display text-4xl font-bold leading-[1.1] text-text sm:text-5xl"
        >
          Tu próxima aventura
          <br />
          <span className="text-accent">empieza aquí.</span>
        </motion.h1>

        <div className="w-full space-y-2">
          <DestinationInput onSubmit={handleSelectPlace} />
          <RouteSearch onConfirm={handleConfirmRoute} />
        </div>

        {import.meta.env.DEV && (
          <button
            type="button"
            onClick={() => setScreen('devQuickRoute')}
            className="text-caption font-medium text-text-muted underline hover:text-text-soft"
          >
            🧪 Dev: ruta rápida (sin IA)
          </button>
        )}
      </div>
    </motion.div>
  )
}

function QuestionnaireScreen() {
  return (
    <motion.div
      key="questionnaire"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -24 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="min-h-screen bg-bg text-text"
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
  const travelPassConfirmed = useRouteStore((state) => state.travel_pass_confirmed)
  const answers = useRouteStore((state) => state.answers)
  const suggestedPlaces = useRouteStore((state) => state.suggested_places)
  const selectedPlaceIds = useRouteStore((state) => state.selected_place_ids)
  const setRoute = useRouteStore((state) => state.setRoute)
  const setScreen = useRouteStore((state) => state.setScreen)
  const { generateRoute } = useRouteGenerator()

  const [status, setStatus] = useState<'loading' | 'done' | 'error'>('loading')
  const [step, setStep] = useState(2)
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined)
  const [route, setLocalRoute] = useState<ReturnType<typeof useRouteStore.getState>['route']>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!destination) return
    let cancelled = false
    setStatus('loading')
    setStep(2)

    const transportContext: TransportContext = {
      archetype,
      is_region: isRegion,
      transport_option: transportOption,
      vehicle_type: vehicleType,
      vehicle_ownership: vehicleOwnership,
      accommodation_mode: accommodationMode,
      travel_mode: travelMode,
      pase_dominante: paseDominante,
      travel_pass_confirmed: travelPassConfirmed,
    }

    const mustIncludePlaces = suggestedPlaces.filter((place) => selectedPlaceIds.includes(place.id)).map((place) => place.name)

    generateRoute(destination, answers as QuestionnaireAnswers, transportContext, mustIncludePlaces, (nextStep) => {
      if (!cancelled) setStep(nextStep)
    })
      .then((generated) => {
        if (cancelled) return
        setLocalRoute(generated)
        setStatus('done')
      })
      .catch((error: unknown) => {
        if (cancelled) return
        setErrorMessage(error instanceof Error ? error.message : 'No se pudo generar la ruta con IA.')
        setStatus('error')
      })

    return () => {
      cancelled = true
    }
    // `attempt` solo cambia para forzar un reintento con la misma llamada.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destination, attempt])

  if (!destination) return null

  const handleFinish = () => {
    if (!route) return
    setRoute(route)
    setScreen('route')
  }

  const handleRetry = () => setAttempt((value) => value + 1)

  return (
    <LoadingScreen destination={destination} status={status} step={step} errorMessage={errorMessage} onFinish={handleFinish} onRetry={handleRetry} />
  )
}

function RouteScreen() {
  return (
    <motion.div
      key="route"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="h-screen"
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
        {screen === 'destination' && <DestinationScreen />}
        {screen === 'questionnaire' && <QuestionnaireScreen />}
        {screen === 'loading' && <LoadingScreenContainer key="loading" />}
        {screen === 'route' && <RouteScreen />}
        {screen === 'devQuickRoute' && import.meta.env.DEV && <DevQuickRouteScreen />}
      </AnimatePresence>
    </Layout>
  )
}

export default App
