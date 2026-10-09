import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useRouteStore } from './store/useRouteStore'
import { TrazoFlow } from './components/trazo/TrazoFlow'
import { LoadingScreen } from './components/loading/LoadingScreen'
import { useRouteGeneration } from './lib/useRouteGeneration'
import { RouteView } from './components/route/RouteView'
import { Layout } from './components/layout/Layout'
import { decodeTripFromUrl } from './lib/shareUrl'
import { DevQuickRouteScreen } from './components/dev/DevQuickRouteScreen'
import { TripSync } from './components/sync/TripSync'
import { CampaignLinks } from './components/sync/CampaignLinks'
import { MyTripsScreen } from './components/myTrips/MyTripsScreen'
import { AvisoSolape } from './components/route/reservas/AvisoSolape'
import { AlojamientoHost } from './components/route/alojamiento/AlojamientoHost'

function LoadingScreenContainer() {
  const destination = useRouteStore((state) => state.destination)
  const answers = useRouteStore((state) => state.answers)
  const setRoute = useRouteStore((state) => state.setRoute)
  const setScreen = useRouteStore((state) => state.setScreen)
  // Enlaces compartidos y generaciones a medias que se retoman: la misma generación que el resumen del
  // formulario Trazo (ver useRouteGeneration.ts), con la pantalla de carga de siempre.
  const { status, checkpoint, route, errorMessage, retry } = useRouteGeneration(true)

  if (!destination) return null

  const handleFinish = () => {
    if (!route) return
    setRoute(route)
    setScreen('route')
  }

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
      onRetry={retry}
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
      <AvisoSolape />
      <AlojamientoHost />
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
      <CampaignLinks />
      <AnimatePresence mode="wait">
        {/* Formulario de creación de viaje (diseño "Trazo App"): sustituye a LandingScreen + Questionnaire. */}
        {(screen === 'destination' || screen === 'questionnaire') && <TrazoFlow key="trazo" />}
        {screen === 'myTrips' && <MyTripsScreen key="myTrips" />}
        {screen === 'loading' && <LoadingScreenContainer key="loading" />}
        {screen === 'route' && <RouteScreen />}
        {screen === 'devQuickRoute' && import.meta.env.DEV && <DevQuickRouteScreen />}
      </AnimatePresence>
    </Layout>
  )
}

export default App
