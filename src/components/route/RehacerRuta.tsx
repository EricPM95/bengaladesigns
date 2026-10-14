import { useEffect } from 'react'
import { useRouteStore } from '../../store/useRouteStore'
import { useRouteGeneration } from '../../lib/useRouteGeneration'
import { terminarRehacer } from '../../lib/cambioDeVuelo'
import { ActualizandoRuta } from '../ui/ActualizandoRuta'

/**
 * (Tanda 6y7) Rehacer la ruta SIN pantalla de carga: cuando el viajero cambia las fechas de un destino curado (`regenerateRouteForDates` pone `rehaciendoRuta`), la ruta se rehace en segundo plano
 * con la misma generación de siempre (`useRouteGeneration`) y, al acabar, se pone con `setRoute` (que conserva reservas, wishlist, días libres y días añadidos). El viajero se queda en la pantalla
 * en la que estaba; solo ve la barrita fina de `ActualizandoRuta`. Se monta una vez en `App`; fuera de un rehacer no pinta nada ni hace nada.
 * (Tanda 7) Lo mismo si lo pone en marcha un cambio de vuelo (`rehacerPorCambioDeVuelo`): al acabar se dejan como estaban los días que el viajero cambió a mano y sale la hoja del resumen.
 */
export function RehacerRuta() {
  const activo = useRouteStore((state) => state.rehaciendoRuta)
  const generacion = useRouteStore((state) => state.rehacerGeneracion)
  // (P7, Tanda 6y9: con otra `key` el rehacer de antes se desmonta y se cancela, porque `useRouteGeneration` ignora su resultado; gana el último cambio de fechas.)
  return activo ? <RehacerRutaEnMarcha key={generacion} generacion={generacion} /> : null
}

function RehacerRutaEnMarcha({ generacion }: { generacion: number }) {
  const dejarRutaComoEstaba = useRouteStore((state) => state.dejarRutaComoEstaba)
  const { status, route, errorMessage, retry } = useRouteGeneration(true)

  useEffect(() => {
    if (status === 'done' && route) terminarRehacer(route, generacion)
  }, [status, route, generacion])

  return <ActualizandoRuta error={status === 'error' ? (errorMessage ?? 'error') : undefined} onReintentar={retry} onDejarla={dejarRutaComoEstaba} />
}
