import { flagStripesGradient } from '../../lib/flagColors'

/**
 * La bandera de un destino: el cuadrado de esquinas redondeadas con los colores de su país en franjas inclinadas. UN solo componente: lo usan la tarjeta del destino de la pestaña RUTA
 * (`RouteOverview`) y cada viaje de «Mis viajes» en el Perfil, para que sea la misma en los dos sitios.
 */
export function BanderaDestino({ countryCode, className = '', recta = false }: { countryCode: string | null | undefined; className?: string; recta?: boolean }) {
  return (
    <span
      aria-hidden="true"
      data-bandera-destino
      // (Tanda 10G, el diseño P0c y P0d de RUTA: `recta` = más grande. Las franjas van siempre derechas, no inclinadas.)
      className={`${recta ? 'h-14 w-14 rounded-2xl' : 'h-10 w-10 rounded-xl'} shrink-0 shadow-[inset_0_0_0_1px_rgba(28,34,48,.08)] ${className}`}
      style={{ background: flagStripesGradient(countryCode).replace('106deg', '90deg') }}
    />
  )
}
