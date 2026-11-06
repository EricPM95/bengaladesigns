import type { Route } from '../../../lib/types'
import { ciudadDeSalida } from '../../../lib/billete'
import { enlaceBuscarVuelos } from '../../../lib/enlacesAfiliado'
import { Icono } from '../../ui/Icono'

/**
 * [Buscar vuelos] (Eric, 6-nov): como el alojamiento tiene su [Buscar alojamiento], el vuelo sin reservar lleva su botón. Abre el buscador de vuelos con el origen, el destino y las fechas del viaje
 * (BCN → ACE, 8-13 nov) por el enlace de afiliado de `enlacesAfiliado.ts`. El texto del botón nunca lleva el nombre de la web.
 */
export function BuscarVuelos({ route, className = '' }: { route: Route; className?: string }) {
  const href = enlaceBuscarVuelos({ origen: ciudadDeSalida(route), destino: route.destination, ida: route.answers.dateRange?.start ?? null, vuelta: route.answers.dateRange?.end ?? null })
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      data-buscar-vuelos
      className={`flex h-12 items-center justify-center gap-2 rounded-full btn-champan text-[14.5px] font-semibold no-underline transition-transform active:scale-[.98] ${className || 'w-full'}`}
    >
      <Icono nombre="lupa" size={15} />
      Buscar vuelos
    </a>
  )
}
