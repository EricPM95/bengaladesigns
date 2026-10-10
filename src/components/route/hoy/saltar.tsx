import { Icono } from '../../ui/Icono'
import { PickerSheet } from '../../ui/PickerSheet'
import { ListaDeDias } from '../dayDetail/ListaDeDias'

/**
 * «No me da tiempo» en HOY (Tanda 6z5, solo de pago, durante el viaje): las tres piezas que lo rodean. El botón vive en la tarjeta oscura de
 * «Siguiente parada» (HoyDurante); aquí están el aviso de una parada con la entrada reservada, el aviso «Saltada» con [Deshacer] y
 * [Pasarla a otro día] y la hoja con los días. La app no propone otra parada ni calcula nada: decide el viajero.
 */

/** El botón de la tarjeta oscura, con el aspecto de [✓ Visto] pero de ancho entero (debajo de los otros dos, para que quepa a 375 px). */
export function BotonNoMeDaTiempo({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex h-11 w-full items-center justify-center gap-[7px] rounded-full border-[1.5px] border-[#FFFDF8]/25 text-[14px] font-semibold text-[#FFFDF8]/85 hover:bg-[#FFFDF8]/10">
      <Icono nombre="reloj" size={15} grosor={1.8} />
      No me da tiempo
    </button>
  )
}

/** Dentro de la tarjeta oscura, en lugar de los botones: la parada tiene la entrada reservada, así que antes de saltarla se pregunta. */
export function AvisoEntradaReservada({ hora, onSaltarIgual, onCancelar }: { hora: string; onSaltarIgual: () => void; onCancelar: () => void }) {
  return (
    <div className="flex flex-col gap-2.5 px-2 pt-0.5" role="alert">
      <span className="text-[14px] font-medium leading-[1.35] text-[#FFFDF8]">Tienes la entrada reservada a las {hora}</span>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={onCancelar} className="flex h-12 items-center justify-center rounded-full bg-[#FFFDF8] text-[14px] font-semibold text-[#1C2230]">
          Cancelar
        </button>
        <button type="button" onClick={onSaltarIgual} className="flex h-12 items-center justify-center rounded-full border-[1.5px] border-[#FFFDF8]/40 text-[14px] font-semibold text-[#FFFDF8] hover:bg-[#FFFDF8]/10">
          Saltar igual
        </button>
      </div>
    </div>
  )
}

/** El aviso corto de debajo de la tarjeta oscura: «Saltada» con [Deshacer] y [Pasarla a otro día] (esta última no sale en lo reservado: la entrada fija el día). */
export function AvisoSaltada({ nombre, onDeshacer, onOtroDia }: { nombre: string; onDeshacer: () => void; onOtroDia: (() => void) | null }) {
  return (
    <div className="flex flex-none flex-col gap-2 rounded-2xl bg-white px-3.5 py-2.5" style={{ border: '1px solid rgba(28,34,48,.08)' }} role="status">
      <span className="min-w-0 truncate text-[13px] text-text/70">
        <span className="font-semibold text-text">Saltada</span> · {nombre}
      </span>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={onDeshacer} className="flex h-10 items-center gap-1.5 rounded-full border border-text/15 px-3.5 text-[13px] font-semibold text-text">
          <Icono nombre="recuperar" size={15} grosor={1.8} />
          Deshacer
        </button>
        {onOtroDia && (
          <button type="button" onClick={onOtroDia} className="flex h-10 items-center gap-1.5 rounded-full border border-text/15 px-3.5 text-[13px] font-semibold text-text">
            <Icono nombre="adelante" size={15} grosor={1.8} />
            Pasarla a otro día
          </button>
        )}
      </div>
    </div>
  )
}

/** La hoja con los días a los que pasar la parada: la misma lista que «Mover a otro día» del menú de cada parada en DÍAS (ListaDeDias). */
export function HojaPasarAOtroDia({ dias, onElegir, onCerrar }: { dias: { id: string; dayNumber: number; city: string }[]; onElegir: (dayId: string) => void; onCerrar: () => void }) {
  return (
    <PickerSheet title="Pasarla a otro día" onClose={onCerrar} onDone={onCerrar} doneLabel="Cancelar">
      <div className="flex flex-col gap-1">
        <ListaDeDias dias={dias} onElegir={onElegir} filaClassName="w-full rounded-xl px-3 py-3 text-left text-[15px] text-text hover:bg-bg-hover" />
      </div>
    </PickerSheet>
  )
}
