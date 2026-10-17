import { Suspense, useEffect } from 'react'
import { Cargando, pantallaPerezosa } from './components/layout/PantallaPerezosa'
import { AnimatePresence } from 'framer-motion'
import { useRouteStore } from './store/useRouteStore'
import { TrazoFlow } from './components/trazo/TrazoFlow'
import { useRouteGeneration } from './lib/useRouteGeneration'
import { Layout } from './components/layout/Layout'
import { decodeTripFromUrl } from './lib/shareUrl'
import { TripSync } from './components/sync/TripSync'
import { PuertaDeCuenta } from './components/cuenta/PuertaDeCuenta'
import { VistosPorPersona } from './components/cuenta/VistosPorPersona'
import { LogrosPorVisto } from './components/logros/LogrosPorVisto'
import { MomentosHost } from './components/logros/momentos/MomentosHost'
import { AvisoInstalar } from './components/logros/AvisoInstalar'
import { CampaignLinks } from './components/sync/CampaignLinks'
import { PrecioVuela } from './components/route/presupuesto/PrecioVuela'
import { FotoVuela } from './components/perfil/FotoVuela'
import { RehacerRuta } from './components/route/RehacerRuta'
import { HojaResumenVuelo } from './components/route/reservas/HojaResumenVuelo'
import { AvisosDeVueloWatcher } from './components/route/AvisosDeVueloWatcher'

// Lo que no es de la primera pantalla se carga cuando se abre (Tanda 8A3): la ruta con todas sus pestañas y mapas, Mis viajes, «Preparando tu viaje…» y la pantalla de desarrollo.
const cargarRouteScreen = () => import('./components/route/RouteScreen')
const RouteScreen = pantallaPerezosa(cargarRouteScreen)
const MyTripsScreen = pantallaPerezosa(() => import('./components/myTrips/MyTripsScreen').then((m) => ({ default: m.MyTripsScreen })))
const PreparandoViaje = pantallaPerezosa(() => import('./components/loading/PreparandoViaje').then((m) => ({ default: m.PreparandoViaje })))
const DevQuickRouteScreen = pantallaPerezosa(() => import('./components/dev/DevQuickRouteScreen').then((m) => ({ default: m.DevQuickRouteScreen })))


function PreparandoViajeContainer() {
  const destination = useRouteStore((state) => state.destination)
  const setRoute = useRouteStore((state) => state.setRoute)
  const setScreen = useRouteStore((state) => state.setScreen)
  // Enlaces compartidos y generaciones a medias que se retoman: la misma generación que el resumen del
  // formulario Trazo (ver useRouteGeneration.ts), con «Preparando tu viaje…» (Tanda 6y7: ya no la pantalla vieja de carga).
  const { status, route, errorMessage, retry } = useRouteGeneration(true)

  if (!destination) return null

  const handleFinish = () => {
    if (!route) return
    setRoute(route)
    setScreen('route')
  }

  return (
    <PreparandoViaje status={status} errorMessage={errorMessage} onFinish={handleFinish} onRetry={retry} />
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

  // Mientras se prepara el viaje (tarda un buen rato), ya se va bajando la pantalla de la ruta: cuando termina, está lista.
  useEffect(() => {
    if (screen === 'loading' || screen === 'myTrips') void cargarRouteScreen()
  }, [screen])

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
      <PuertaDeCuenta />
      <VistosPorPersona />
      <LogrosPorVisto />
      <MomentosHost />
      <AvisoInstalar />
      <PrecioVuela />
      <FotoVuela />
      <CampaignLinks />
      <RehacerRuta />
      <HojaResumenVuelo />
      <AvisosDeVueloWatcher />
      <AnimatePresence mode="wait">
        {/* Formulario de creación de viaje (diseño "Trazo App"): sustituye a LandingScreen + Questionnaire. */}
        {(screen === 'destination' || screen === 'questionnaire') && <TrazoFlow key="trazo" />}
        {screen === 'myTrips' && (
          <Suspense key="myTrips" fallback={<Cargando />}>
            <MyTripsScreen />
          </Suspense>
        )}
        {screen === 'loading' && (
          <Suspense key="loading" fallback={<Cargando />}>
            <PreparandoViajeContainer />
          </Suspense>
        )}
        {screen === 'route' && (
          <Suspense key="route" fallback={<Cargando />}>
            <RouteScreen />
          </Suspense>
        )}
        {screen === 'devQuickRoute' && import.meta.env.DEV && (
          <Suspense key="dev" fallback={<Cargando />}>
            <DevQuickRouteScreen />
          </Suspense>
        )}
      </AnimatePresence>
    </Layout>
  )
}

export default App
