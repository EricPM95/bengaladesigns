import { buildActivitySearchUrl } from '../../../lib/affiliateLinks'
import { useDestinationExcursions } from '../../../lib/destinationExcursions'
import { openTicketShop } from './EntradaCard'
import { FREE_TOUR_KEY } from './useStopEntradas'

/** El enlace de [Ver disponibilidad] del Free Tour: el de la entrada «Free Tour» de los datos del destino o, sin él, la búsqueda del Free Tour de ese destino. Lo usan la hoja del Free Tour y la hoja del resumen de los vuelos. */
export function useEnlaceDelFreeTour(destination: string): string {
  const info = useDestinationExcursions(destination)
  const entrada = info.entradasPorSitio[FREE_TOUR_KEY]?.[0] ?? null
  return entrada?.url ?? buildActivitySearchUrl(`Free Tour ${destination}`)
}

/**
 * [Ver disponibilidad] (Tanda 6y9): abre la página del Free Tour en la tienda con NUESTRO enlace (el mismo `openTicketShop` de [Reservar]: código de afiliado, código del viaje y el aviso
 * «Abriendo…»), sin nombre de empresa en ningún texto. El enlace es el de la entrada «Free Tour» de los datos del destino; sin él, la búsqueda del Free Tour de ese destino.
 */
export function VerDisponibilidadFreeTour({ destination }: { destination: string }) {
  const href = useEnlaceDelFreeTour(destination)
  return (
    <button type="button" onClick={() => openTicketShop(href, 'Abriendo…')} className="mt-4 h-12 w-full whitespace-nowrap rounded-full btn-champan text-small font-semibold active:scale-[.97]">
      Ver disponibilidad
    </button>
  )
}
