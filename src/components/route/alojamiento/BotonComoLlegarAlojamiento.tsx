import type { CSSProperties } from 'react'
import { enlaceComoLlegarAlojamiento } from '../../../lib/direccionAlojamiento'
import { pagoActivo } from '../../../lib/pago'
import { Icono } from '../../ui/Icono'
import { Candado } from '../../pase/Candado'

interface BotonComoLlegarAlojamientoProps {
  /**
   * La dirección del alojamiento (`route.accommodationAddress`). SIN ella (vacía, solo espacios, null o undefined) el botón NO SALE NUNCA: ni con el nombre del hotel ni con la zona.
   * Quien lo pone lee la dirección de la ruta (o usa `direccionDelAlojamiento(route)`) y se la pasa.
   */
  direccion: string | null | undefined
  /** `completo`: botón ancho de la ficha de llegada y de HOY. `pequeno`: la línea corta (para sitios con poco espacio). Por defecto, `completo`. */
  variante?: 'completo' | 'pequeno'
  className?: string
  style?: CSSProperties
}

/**
 * [Cómo llegar a tu alojamiento] (Tanda 7, de pago): abre Google Maps con la dirección que el viajero puso en RESERVAS › Alojamiento, en una pestaña nueva. Es la pieza compartida: la ficha de
 * llegada, HOY (al acabar cada día y el día de llegada después de «Llegada a {punto}») y cualquier pantalla que lo necesite ponen ESTE componente, no un botón propio.
 * Solo sale de pago (`pagoActivo()`) y solo con dirección. Icono fino gris sin relleno; el texto, el de la pantalla donde esté.
 */
export function BotonComoLlegarAlojamiento({ direccion, variante = 'completo', className = '', style }: BotonComoLlegarAlojamientoProps) {
  const enlace = enlaceComoLlegarAlojamiento(direccion)
  if (!enlace) return null
  // (Tanda 10G: sin el pase, cerrado y a la vista.)
  if (!pagoActivo()) return <Candado datos="como-llegar-alojamiento" texto="Con el pase, cada día empieza cerca de donde duermes"><span style={{ font: "500 14px 'Geist'" }}>Cómo llegar a tu alojamiento</span></Candado>
  return (
    <a
      href={enlace}
      target="_blank"
      rel="noopener noreferrer"
      data-como-llegar-alojamiento
      style={style}
      className={
        variante === 'completo'
          ? `flex h-12 w-full items-center justify-center gap-2 rounded-full border border-text/20 bg-white px-4 text-[14.5px] font-semibold text-text transition-transform active:scale-[.98] ${className}`
          : `inline-flex items-center gap-1.5 text-[13px] font-semibold text-text underline underline-offset-2 ${className}`
      }
    >
      <Icono nombre="ubicacion" size={variante === 'completo' ? 16 : 14} style={{ color: 'rgba(28,34,48,.6)' }} />
      Cómo llegar a tu alojamiento
    </a>
  )
}
