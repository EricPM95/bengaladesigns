import { useMemo } from 'react'
import { StopsMapView } from '../map/StopsMapView'
import { tripModes, useArrivalInfo } from '../../lib/arrivalReturn'
import { construirMapaDeDestinos, deducirMedio } from '../../lib/rutaMapaDestinos'
import type { Coordinates, Route } from '../../lib/types'

/**
 * El mapa de la pestaña RUTA con un solo destino (Tanda 10B): el destino y los puntos por donde se llega según el medio elegido; sin las paradas
 * (el mapa de DÍAS no se toca). Los puntos y su construcción: `src/lib/rutaMapaDestinos.ts`.
 */
export function MapaDeRuta({ route, centro: centroDeParadas }: { route: Route; centro: Coordinates }) {
  // El centro de la ciudad de verdad (el del destino); sin él, la media de las paradas.
  const centro = route.destinationCoordinates ?? centroDeParadas
  const info = useArrivalInfo(route.destination, route.days[0]?.city ?? route.destination, route.origin)
  const { departure } = tripModes(route)
  // El medio con el que llega: el que eligió; si no, el que se deduce de su origen; si no se puede, el punto donde conecta todo.
  const arrival = deducirMedio({ opcionElegida: route.transportContext.transport_option?.id ?? null, origen: route.answers.originPlace?.coordinates ?? null, destino: centro })
  const { markers, resaltados } = useMemo(
    () =>
      construirMapaDeDestinos({
        ciudad: route.destination,
        centro,
        modo: arrival,
        info,
        puntoLlegadaId: route.arrivalPointId,
        puntoSalidaId: route.departurePointId,
        modoVuelta: departure,
      }),
    [route.destination, route.arrivalPointId, route.departurePointId, centro, arrival, departure, info],
  )
  return <StopsMapView markers={markers} center={centro} ringIds={resaltados} focusCenter={markers.length === 1 ? centro : null} focusZoom={11.5} encuadre={{ top: 96, bottom: 70, left: 50, right: 50 }} />
}
