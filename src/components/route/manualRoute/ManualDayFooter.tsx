import { useState } from 'react'
import type { DayPlan, Route } from '../../../lib/types'
import { isEmptyDay } from '../../../lib/freeDays'
import { useExcursionsStore } from '../../../store/useExcursionsStore'
import { Icono } from '../../ui/Icono'
import { ManualAddStopsScreen } from './ManualAddStopsScreen'

const BUTTON = 'flex h-12 w-full items-center justify-center gap-2 rounded-2xl border-[1.5px] border-dashed border-text/25 text-[14px] font-medium text-text/70 transition-colors hover:bg-bg-hover'

/**
 * Lo que hay al final de un día de una ruta a mano (Tanda 6y, parte C). Es el único camino para meter cosas en el día; la app no pone nada sola.
 *  - Día en blanco: [Añadir parada] y [Añadir excursión].
 *  - Día con paradas (o con una excursión de medio día): solo [Añadir parada]. [Añadir excursión] solo sale en los días en blanco.
 * [Añadir parada] abre EXPLORAR en el modo de elegir varios sitios (los marcados van a este día, en el orden en que se marcan); [Añadir excursión] abre la página de
 * excursiones de siempre y la que se elige va a este día como día de excursión.
 */
export function ManualDayFooter({ route, day }: { route: Route; day: DayPlan }) {
  const [picking, setPicking] = useState(false)
  const openExcursionsForDay = useExcursionsStore((state) => state.openPageForDay)
  const empty = isEmptyDay(day)

  return (
    <div className="pt-2">
      <div className={empty ? 'grid grid-cols-2 gap-2' : ''}>
        <button type="button" onClick={() => setPicking(true)} className={BUTTON}>
          <Icono nombre="anadir" size={16} />
          Añadir parada
        </button>
        {empty && (
          <button type="button" onClick={() => openExcursionsForDay(day.id)} className={BUTTON}>
            <Icono nombre="excursion" size={16} />
            Añadir excursión
          </button>
        )}
      </div>
      {picking && <ManualAddStopsScreen route={route} dayId={day.id} onClose={() => setPicking(false)} />}
    </div>
  )
}
