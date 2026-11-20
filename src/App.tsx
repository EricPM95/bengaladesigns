import { Suspense, useEffect } from 'react'
import { AvisoDeVersionNueva } from './components/AvisoDeVersionNueva'
import { reintentarLogros, soltarLaFilaDeLogros } from './components/logros/momentos/reintentarLogros'
import { Cargando, pantallaPerezosa } from './components/layout/PantallaPerezosa'
import { CargandoApp } from './components/layout/CargandoApp'
import { useSyncStore } from './store/useSyncStore'
import { AnimatePresence } from 'framer-motion'
import { useRouteStore } from './store/useRouteStore'
import { TrazoFlow } from './components/trazo/TrazoFlow'
import { useRouteGeneration } from './lib/useRouteGeneration'
import { Layout } from './components/layout/Layout'
import { decodeTripFromUrl } from './lib/shareUrl'
import { TripSync } from './components/sync/TripSync'
import { PuertaDeCuenta } from './components/cuenta/PuertaDeCuenta'
import { UnirseHost } from './components/cuenta/HojaUnirse'
import { useInvitacionEnMarcha } from './hooks/useInvitacionEnMarcha'
import { CompartidoHost } from './components/compartir/CompartidoHost'
import { PagoHost } from './components/pase/PagoHost'
import { ListaDelPaseHost } from './components/pase/ListaDelPaseHost'
import { AvisoPaseHost } from './components/pase/AvisoPase'
import { SinPasePrueba } from './components/pase/SinPasePrueba'
import { useSinPasePrueba } from './store/useSinPasePrueba'
import { PropuestaHost } from './components/propuesta/PropuestaHost'
import { CuentanosHost } from './components/cuentanos/Cuentanos'
import { encenderLaCola, instalarRegistroDeErrores } from './lib/cuentanos/envio'
import { AvisosHost } from './components/avisos/AvisosHost'
import { GastosCompartidosHost } from './components/presupuesto/GastosCompartidosHost'
import { ModoCuentasHost } from './components/route/presupuesto/CuentaModo'
import { AjustesHosts } from './components/ajustes/AjustesHosts'
import { VistosPorPersona } from './components/cuenta/VistosPorPersona'
import { LogrosPorVisto } from './components/logros/LogrosPorVisto'
import { MomentosHost } from './components/logros/momentos/MomentosHost'
import { PantallasHost } from './components/logros/pantallas/PantallasHost'
import { AvisoInstalar } from './components/logros/AvisoInstalar'
import { PrimeraVezArranque } from './components/primeraVez/PrimeraVezArranque'
import { EliminarViajeHost } from './components/perfil/EliminarViajeHost'
import { JuntarViajeHost } from './components/perfil/JuntarViajeHost'
import { CampaignLinks } from './components/sync/CampaignLinks'
import { PrecioVuela } from './components/route/presupuesto/PrecioVuela'
import { PiezaSegura } from './components/PiezaSegura'
import { FotoVuela } from './components/perfil/FotoVuela'
import { RehacerRuta } from './components/route/RehacerRuta'
import { HojaResumenVuelo } from './components/route/reservas/HojaResumenVuelo'
import { AvisosDeVueloWatcher } from './components/route/AvisosDeVueloWatcher'

// Lo que no es de la primera pantalla se carga cuando se abre (Tanda 8A3): la ruta con todas sus pestañas y mapas, Mis viajes, «Preparando tu viaje…» y la pantalla de desarrollo.
const cargarRouteScreen = () => import('./components/route/RouteScreen')
const RouteScreen = pantallaPerezosa(cargarRouteScreen)
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
  // (Con «Verme como viajero sin pase» encendido, todo lo de pago se vuelve a pintar cerrado.)
  useSinPasePrueba((state) => state.activo)
  const invitacionEnMarcha = useInvitacionEnMarcha()
  const screen = useRouteStore((state) => state.screen)
  // (10S10 §8) Mientras no se sabe si hay viaje guardado, la pantalla de carga (el logo), nunca la de crear viaje. Tope de seguridad: si la lectura se cuelga, a los 12 s se enseña la de siempre.
  const cargaHecha = useSyncStore((state) => state.cargaInicialHecha)
  useEffect(() => {
    if (cargaHecha) return
    // (V1, 15-nov) Con el servidor sin contestar y una cuenta, NO se saca el formulario a los 12 s: el logo se queda y TripSync reintenta (o abre lo guardado en el móvil).
    const aviso = window.setTimeout(() => {
      if (useSyncStore.getState().sinServidor) return
      useSyncStore.getState().setCargaInicialHecha(true)
    }, 12000)
    return () => window.clearTimeout(aviso)
  }, [cargaHecha])
  const setDestination = useRouteStore((state) => state.setDestination)
  const setArchetype = useRouteStore((state) => state.setArchetype)
  const setTransportOption = useRouteStore((state) => state.setTransportOption)
  const setVehicleOwnership = useRouteStore((state) => state.setVehicleOwnership)
  const setTravelMode = useRouteStore((state) => state.setTravelMode)
  const setTravelPassConfirmed = useRouteStore((state) => state.setTravelPassConfirmed)
  const updateAnswers = useRouteStore((state) => state.updateAnswers)
  const setScreen = useRouteStore((state) => state.setScreen)

  // Mientras se prepara el viaje (tarda un buen rato), ya se va bajando la pantalla de la ruta: cuando termina, está lista.
  // (V20) «Cuéntanos»: el registro de los últimos errores y la cola de avisos sin red.
  useEffect(() => {
    instalarRegistroDeErrores()
    encenderLaCola()
  }, [])

  useEffect(() => {
    if (screen === 'loading') void cargarRouteScreen()
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
      <PiezaSegura nombre="TripSync">
        <TripSync />
      </PiezaSegura>
      <PiezaSegura nombre="PuertaDeCuenta">
        <PuertaDeCuenta />
      </PiezaSegura>
      <PiezaSegura nombre="UnirseHost">
        <UnirseHost />
      </PiezaSegura>
      <PiezaSegura nombre="CompartidoHost">
        <CompartidoHost />
      </PiezaSegura>
      <PiezaSegura nombre="PagoHost">
        <PagoHost />
      </PiezaSegura>
      <PiezaSegura nombre="ListaDelPaseHost">
        <ListaDelPaseHost />
      </PiezaSegura>
      <PiezaSegura nombre="AvisoPaseHost">
        <AvisoPaseHost />
      </PiezaSegura>
      <PiezaSegura nombre="SinPasePrueba">
        <SinPasePrueba />
      </PiezaSegura>
      <PiezaSegura nombre="CuentanosHost">
        <CuentanosHost />
      </PiezaSegura>
      {/* (V28b) El botón flotante «Cuéntanos» ya no es de toda la app: sale junto a la cámara y el trofeo, dentro del viaje (RouteScreen). La hoja (CuentanosHost) sigue aquí. */}
      <PiezaSegura nombre="PropuestaHost">
        <PropuestaHost />
      </PiezaSegura>
      <PiezaSegura nombre="AvisosHost">
        <AvisosHost />
      </PiezaSegura>
      <PiezaSegura nombre="GastosCompartidosHost">
        <GastosCompartidosHost />
      </PiezaSegura>
      <PiezaSegura nombre="ModoCuentasHost">
        <ModoCuentasHost />
      </PiezaSegura>
      <PiezaSegura nombre="AjustesHosts">
        <AjustesHosts />
      </PiezaSegura>
      <PiezaSegura nombre="VistosPorPersona">
        <VistosPorPersona />
      </PiezaSegura>
      <PiezaSegura nombre="LogrosPorVisto">
        <LogrosPorVisto />
      </PiezaSegura>
      <AvisoDeVersionNueva />
      <PiezaSegura nombre="MomentosHost" reintentable alReintentar={reintentarLogros} alFallar={soltarLaFilaDeLogros}>
        <MomentosHost />
      </PiezaSegura>
      <PiezaSegura nombre="PantallasHost" reintentable alReintentar={reintentarLogros}>
        <PantallasHost />
      </PiezaSegura>
      <PiezaSegura nombre="PrimeraVezArranque">
        <PrimeraVezArranque />
      </PiezaSegura>
      <PiezaSegura nombre="AvisoInstalar">
        <AvisoInstalar />
      </PiezaSegura>
      <PiezaSegura nombre="EliminarViajeHost">
        <EliminarViajeHost />
      </PiezaSegura>
      <PiezaSegura nombre="JuntarViajeHost">
        <JuntarViajeHost />
      </PiezaSegura>
      <PiezaSegura nombre="PrecioVuela">
        <PrecioVuela />
      </PiezaSegura>
      <PiezaSegura nombre="FotoVuela">
        <FotoVuela />
      </PiezaSegura>
      <PiezaSegura nombre="CampaignLinks">
        <CampaignLinks />
      </PiezaSegura>
      <PiezaSegura nombre="RehacerRuta">
        <RehacerRuta />
      </PiezaSegura>
      <PiezaSegura nombre="HojaResumenVuelo">
        <HojaResumenVuelo />
      </PiezaSegura>
      <PiezaSegura nombre="AvisosDeVueloWatcher">
        <AvisosDeVueloWatcher />
      </PiezaSegura>
      <AnimatePresence mode="wait">
        {/* Formulario de creación de viaje (diseño "Trazo App"): sustituye a LandingScreen + Questionnaire. */}
        {/* (Tanda 10N §5: con un enlace de invitación en marcha NO sale «Crear viaje», ni al abrirlo ni al tocar [Unirme].) */}
        {(screen === 'destination' || screen === 'questionnaire') && !invitacionEnMarcha && !cargaHecha && <CargandoApp key="cargando-app" />}
        {(screen === 'destination' || screen === 'questionnaire') && !invitacionEnMarcha && cargaHecha && <TrazoFlow key="trazo" />}
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
