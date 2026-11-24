import { BOTON_ORO } from '../../../ui/botonesOro'
import { HojaV2 } from './HojasV2'
import { Titulo } from './CambiarPlan'

/**
 * «Activa tu ubicación» (V44 §7). Sale cuando el viajero dijo que NO a la ubicación y toca [Usar mi ubicación]. SIN pasos: los de Safari que había (V43) no coincidían con el iPhone de Eric,
 * y cada navegador y cada versión los cambia. Solo se dice qué hace falta y dónde (los ajustes del móvil o del navegador) y [Entendido].
 */
export function HojaActivaUbicacion({ onCerrar }: { onCerrar: () => void; /** (se conserva por compatibilidad; ya no hay botón de reintentar: la app lo nota sola al volver a la página) */ onReintentar?: () => void }) {
  return (
    <HojaV2 onCerrar={onCerrar} etiqueta="Activa tu ubicación" fondo="#FBF3E2">
      <div data-hoy-activa-ubicacion className="flex flex-col gap-3">
        <Titulo texto="Activa tu ubicación" onCerrar={onCerrar} />
        <span className="text-[14.5px] font-medium leading-[1.4]">Para ver lo que tienes cerca, Jutrip necesita tu ubicación. Actívala en los ajustes de tu móvil o de tu navegador: solo se usa mientras usas la app.</span>
        <button type="button" onClick={onCerrar} data-activa-ubicacion-entendido className="flex h-[50px] items-center justify-center rounded-2xl text-[15px] font-bold" style={BOTON_ORO}>
          Entendido
        </button>
      </div>
    </HojaV2>
  )
}
