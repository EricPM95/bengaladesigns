import type { CSSProperties } from 'react'
import { GROSOR_ICONO, ICONOS, type NombreIcono } from '../../lib/iconos'

/**
 * Un icono de la app (la familia de `src/lib/iconos.ts`): de línea, 1,7 de grosor, puntas redondeadas, del color del texto (`currentColor`).
 * `relleno` solo lo usan los que se marcan (el corazón de «me gusta»). `style` sirve para darle un color suelto (`{ color }`).
 */
export function Icono({
  nombre,
  size = 20,
  grosor = GROSOR_ICONO,
  className,
  style,
  relleno = false,
}: {
  nombre: NombreIcono
  size?: number
  grosor?: number
  className?: string
  style?: CSSProperties
  relleno?: boolean
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={relleno ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={grosor} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className} style={style}>
      <path d={ICONOS[nombre]} />
    </svg>
  )
}

/** Lo mismo, para los sitios que reciben el trazo ya elegido (las tarjetas de DÍAS, los pines): el `path` sale siempre de `src/lib/iconos.ts`. */
export function IconoRuta({ d, size = 13, className, grosor = GROSOR_ICONO }: { d: string; size?: number; className?: string; grosor?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={grosor} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d={d} />
    </svg>
  )
}
