import { GROSOR_ICONO, ICONOS, type NombreIcono } from '../../lib/iconos'

/** Un icono de la app (la familia de `src/lib/iconos.ts`): de línea, 1,7 de grosor, puntas redondeadas, del color del texto (`currentColor`). */
export function Icono({ nombre, size = 20, grosor = GROSOR_ICONO, className }: { nombre: NombreIcono; size?: number; grosor?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={grosor} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d={ICONOS[nombre]} />
    </svg>
  )
}
