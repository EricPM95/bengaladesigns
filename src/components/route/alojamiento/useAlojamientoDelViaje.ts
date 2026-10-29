import { useRouteStore } from '../../../store/useRouteStore'
import { useDestinationExcursions } from '../../../lib/destinationExcursions'
import { direccionDelAlojamiento } from '../../../lib/direccionAlojamiento'
import { estanciasDelViaje } from '../../../lib/tuAlojamiento'

/**
 * LO QUE SE SABE DEL ALOJAMIENTO DEL VIAJE (Tanda 10N11, apartado 3): el nombre del hotel (gratis), y la zona y la dirección (del pase), que se guardan en el viaje
 * (`route.accommodationZone`, `route.accommodationAddress`). La usan la tarjeta del día 1 en DÍAS y la tarjeta [Cómo llegar a tu alojamiento] de HOY.
 * Un viaje tiene UNA zona y UNA dirección: son las de la primera estancia.
 */
export function useAlojamientoDelViaje() {
  const route = useRouteStore((state) => state.route)
  const selections = useRouteStore((state) => state.accommodationSelections)
  const info = useDestinationExcursions(route?.destination ?? '')
  const primera = route ? (estanciasDelViaje(route)[0] ?? null) : null
  const hotel = primera ? (selections[primera.segmentDayId] ?? null) : null
  const zona = route?.accommodationZone ? (info.zonasAlojamiento.find((z) => z.id === route.accommodationZone) ?? null) : null
  return {
    primeraEstanciaId: primera?.segmentDayId ?? null,
    ciudad: primera?.city ?? route?.days[0]?.city ?? route?.destination ?? '',
    nombre: (hotel?.name ?? '').trim() || null,
    zonaNombre: zona?.nombre ?? null,
    direccion: direccionDelAlojamiento(route),
  }
}
