import type { TarjetaVuelvesInfo } from '../../../lib/types'
import { CajaBlanca } from './piezas'

/**
 * RANURA de la tarjeta «Hoy vuelves a casa» (Tanda 7, punto 9) en HOY. La tarjeta de verdad la crea y documenta el agente H como componente reutilizable (la misma que sale en DÍAS); mientras no esté integrada,
 * HOY monta esta ranura con los mismos datos del motor (`day.returnDay.tarjeta`): el título, el texto y [Ver cómo ir]. Al integrar H, se cambia el cuerpo de este componente por el suyo y HOY no se toca:
 * HOY solo pasa la tarjeta y la acción de abrir la ficha de vuelta. Ninguna hora aquí: el texto ya viene escrito por el motor con la hora del viajero.
 */
export function SlotVuelvesACasa({ tarjeta, onVerComoIr }: { tarjeta: TarjetaVuelvesInfo; onVerComoIr: () => void }) {
  return (
    <CajaBlanca data-hoy-vuelves-a-casa="1">
      <span className="pl-1" style={{ font: "400 26px/1.1 'Instrument Serif',serif", textWrap: 'balance' as never }}>
        {tarjeta.titulo}
      </span>
      <p className="pl-1 text-[13.5px] leading-[1.45] text-text/75">{tarjeta.texto}</p>
      {tarjeta.desdeTuZona && <p className="pl-1 text-[13px] leading-[1.45] text-text/60">{tarjeta.desdeTuZona.texto}</p>}
      {tarjeta.verComoIr && (
        <button type="button" onClick={onVerComoIr} className="flex h-12 w-full items-center justify-center rounded-full bg-[#1C2230] text-[14px] font-semibold text-[#FFFDF8]">
          Ver cómo ir
        </button>
      )}
      {tarjeta.despedida && <p className="pl-1 text-[12.5px] leading-[1.4] text-text/55">{tarjeta.despedida}</p>}
    </CajaBlanca>
  )
}
