import { useEffect } from 'react'
import { useRouteStore } from '../../store/useRouteStore'
import { useRouteGeneration } from '../../lib/useRouteGeneration'
import { ActualizandoRuta } from '../ui/ActualizandoRuta'

/**
 * (Tanda 6y7) Rehacer la ruta SIN pantalla de carga: cuando el viajero cambia las fechas de un destino curado (`regenerateRouteForDates` pone `rehaciendoRuta`), la ruta se rehace en segundo plano
 * con la misma generación de siempre (`useRouteGeneration`) y, al acabar, se pone con `setRoute` (que conserva reservas, wishlist, días libres y días añadidos). El viajero se queda en la pantalla
 * en la que estaba; solo ve la barrita fina de `ActualizandoRuta`. Se monta una vez en `App`; fuera de un rehacer no pinta nada ni hace nada.
 */
export function RehacerRuta() {
  const activo = useRouteStore((state) => state.rehaciendoRuta)
  return activo ? <RehacerRutaEnMarcha /> : null
}

function RehacerRutaEnMarcha() {
  const setRoute = useRouteStore((state) => state.setRoute)
  const dejarRutaComoEstaba = useRouteStore((state) => state.dejarRutaComoEstaba)
  const { status, route, errorMessage, retry } = useRouteGeneration(true)

  useEffect(() => {
    if (status === 'done' && route) setRoute(route)
  }, [status, route, setRoute])

  return <ActualizandoRuta error={status === 'error' ? (errorMessage ?? 'error') : undefined} onReintentar={retry} onDejarla={dejarRutaComoEstaba} />
}
