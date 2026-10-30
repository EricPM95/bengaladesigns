import type { TarjetaHoyVuelvesDato } from '../../../lib/types'
import { Icono } from '../../ui/Icono'

export interface TarjetaHoyVuelvesProps {
  /** La tarjeta tal cual la da el motor (`Route.planVuelta.tarjeta`; con salida de madrugada, `Route.planVuelta.tarjetaUltimoDia`; ver `tarjetaHoyVuelvesDelDia`). Todos los textos vienen hechos: aquí solo se dibujan. */
  tarjeta: TarjetaHoyVuelvesDato
  /** [Ver cómo ir]: abre la ficha de vuelta. */
  onVerComoIr: () => void
  /** [Explorar monumentos]: abre EXPLORAR › Monumentos (el chip «Atracciones» de hoy) con «Cerca de mí». */
  onExplorarMonumentos: () => void
  className?: string
}

/**
 * LA TARJETA «HOY VUELVES A CASA» (Tanda 7, punto 9; de pago): el día de vuelta sin paradas, en DÍAS y en HOY (HOY la pone con este mismo componente). También, con una salida de madrugada (vuelo de 0:00 a 4:59),
 * al final del último día de ruta («Tu vuelo sale esta noche…»). De arriba abajo: el título, el texto de su medio (avión, tren, autobús o barco), «Desde tu zona ({zona}): {su mejor opción}» con el tiempo de CADA tramo
 * (nunca un total) y [Ver cómo ir], «¿Crees que te da tiempo a ver algo?…» con [Explorar monumentos] y la despedida. Ninguna hora que calcule la app: solo la del viajero.
 */
export function TarjetaHoyVuelves({ tarjeta, onVerComoIr, onExplorarMonumentos, className = '' }: TarjetaHoyVuelvesProps) {
  return (
    <div data-tarjeta-hoy-vuelves={tarjeta.madrugada ? 'madrugada' : 'dia'} className={`flex flex-col gap-3 rounded-2xl border border-text/10 bg-bg-card p-4 ${className}`}>
      <h3 data-hoy-vuelves-titulo className="font-display text-[24px] leading-[1.1] text-text">
        {tarjeta.titulo}
      </h3>
      <p data-hoy-vuelves-texto className="text-[13.5px] leading-[1.45] text-text/75">
        {tarjeta.texto}
      </p>
      {tarjeta.desde_tu_zona && (
        <div data-hoy-vuelves-zona className="flex flex-col gap-2 rounded-xl border border-text/[.08] bg-bg p-3">
          <p className="flex items-start gap-2 text-[13px] leading-[1.45] text-text">
            <Icono nombre="ubicacion" size={16} className="mt-0.5 flex-none text-text/55" />
            <span>{tarjeta.desde_tu_zona.texto}</span>
          </p>
          {tarjeta.desde_tu_zona.aviso && <p className="text-[12.5px] leading-[1.45] text-text/65">{tarjeta.desde_tu_zona.aviso}</p>}
          <button
            type="button"
            onClick={onVerComoIr}
            data-hoy-vuelves="ver-como-ir"
            className="zona-toque h-10 self-start rounded-full border border-text/20 bg-white px-4 text-[13px] font-semibold text-text transition-transform active:scale-[.98]"
          >
            {tarjeta.ver_como_ir.texto}
          </button>
        </div>
      )}
      {!tarjeta.desde_tu_zona && (
        <button type="button" onClick={onVerComoIr} data-hoy-vuelves="ver-como-ir" className="zona-toque h-10 self-start rounded-full border border-text/20 bg-white px-4 text-[13px] font-semibold text-text transition-transform active:scale-[.98]">
          {tarjeta.ver_como_ir.texto}
        </button>
      )}
      <div className="flex flex-col gap-2">
        <p data-hoy-vuelves-explorar className="text-[13.5px] leading-[1.45] text-text/75">
          {tarjeta.explorar.texto}
        </p>
        <button
          type="button"
          onClick={onExplorarMonumentos}
          data-hoy-vuelves="explorar-monumentos"
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full btn-champan text-[14.5px] font-semibold transition-transform active:scale-[.98]"
        >
          {tarjeta.explorar.boton}
        </button>
      </div>
      <p data-hoy-vuelves-despedida className="pt-1 text-center font-display text-[18px] italic leading-snug text-text/60">
        {tarjeta.despedida}
      </p>
    </div>
  )
}
