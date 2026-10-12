import { buildActivitySearchUrl } from '../../../lib/affiliateLinks'
import { useDestinationExcursions } from '../../../lib/destinationExcursions'
import { openTicketShop } from './EntradaCard'
import { FREE_TOUR_KEY } from './useStopEntradas'

/**
 * [Ver disponibilidad] (Tanda 6y9): abre la página del Free Tour en la tienda con NUESTRO enlace (el mismo `openTicketShop` de [Reservar]: código de afiliado, código del viaje y el aviso
 * «Abriendo…»), sin nombre de empresa en ningún texto. El enlace es el de la entrada «Free Tour» de los datos del destino; sin él, la búsqueda del Free Tour de ese destino.
 */
export function VerDisponibilidadFreeTour({ destination }: { destination: string }) {
  const info = useDestinationExcursions(destination)
  const entrada = info.entradasPorSitio[FREE_TOUR_KEY]?.[0] ?? null
  const href = entrada?.url ?? buildActivitySearchUrl(`Free Tour ${destination}`)
  return (
    <button type="button" onClick={() => openTicketShop(href, 'Abriendo…')} className="mt-4 h-12 w-full whitespace-nowrap rounded-full bg-accent text-small font-semibold text-white active:scale-[.97]">
      Ver disponibilidad
    </button>
  )
}
