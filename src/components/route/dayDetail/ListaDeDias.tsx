import { useRouteStore } from '../../../store/useRouteStore'
import { diaCorto } from '../../../lib/nombreDeDia'

/** Una fila de la lista de días de «Mover a otro día». */
export const FILA_DE_DIA = 'w-full rounded-lg px-2 py-1.5 text-left text-small text-text hover:bg-bg-hover disabled:cursor-not-allowed disabled:opacity-40'

/**
 * La lista de días a los que se puede mover una parada («Mover a otro día»): «martes 14 — Roma». La única que hay: la usan el menú «···»
 * de cada parada en DÍAS (StopMenu) y el aviso «Saltada» de HOY («Pasarla a otro día»).
 */
export function ListaDeDias({ dias, onElegir, filaClassName = FILA_DE_DIA }: { dias: { id: string; dayNumber: number; city: string }[]; onElegir: (dayId: string) => void; filaClassName?: string }) {
  const route = useRouteStore((state) => state.route)
  return (
    <>
      {dias.map((day) => (
        <button key={day.id} type="button" onClick={() => onElegir(day.id)} className={filaClassName}>
          {diaCorto(route, day.dayNumber)} — {day.city}
        </button>
      ))}
    </>
  )
}
