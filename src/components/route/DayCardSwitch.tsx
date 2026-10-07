import type { DayPlan, Route } from '../../lib/types'
import type { Reservation } from '../../lib/bookings'
import { excursionReservationOf, viewedExcursion } from '../../lib/dayInterruptor'
import { useInterruptorUiStore } from '../../store/useInterruptorUiStore'
import { DayInterruptorSwitch } from './dayDetail/excursion/DayInterruptorSwitch'
import { SwitchToRomaWarning } from './dayDetail/excursion/SwitchToRomaWarning'

/**
 * El interruptor [Roma | Excursión] en la tarjeta del día 4 (Tanda 6g): debajo del título, a lo ancho de la tarjeta y a la vista aunque esté plegada. Con la excursión confirmada, pasar a Roma
 * saca antes el aviso de que la reserva sigue en Civitatis. El día se rehace aparte (src/lib/dayInterruptor.ts); aquí solo se pide.
 */
export function DayCardSwitch({ day, route, reservations }: { day: DayPlan; route: Route; reservations: Reservation[] }) {
  const sw = day.interruptor
  const pedir = useInterruptorUiStore((state) => state.pedir)
  const confirmarRoma = useInterruptorUiStore((state) => state.confirmarRoma)
  const cancelarAviso = useInterruptorUiStore((state) => state.cancelarAviso)
  const warn = useInterruptorUiStore((state) => state.warnDayId === day.id)
  const busy = useInterruptorUiStore((state) => state.busyDayId === day.id)
  const failed = useInterruptorUiStore((state) => state.failedDayId === day.id)
  if (!sw) return null
  const viewed = viewedExcursion(day)
  const reservation = excursionReservationOf(route, reservations, day)
  return (
    <div className="px-3.5 pb-3.5">
      <DayInterruptorSwitch mode={sw.mode} onChange={(target) => void pedir(day.id, target)} excursionColor={viewed?.page?.color ?? null} excursionPhotoUrl={viewed?.page?.photoUrl ?? null} busy={busy} />
      {failed && <p className="mt-2 px-1 text-[12.5px] leading-[1.4] text-text/60">No hemos podido cambiar el día. Prueba otra vez.</p>}
      {warn && reservation && (
        <div className="mt-3">
          <SwitchToRomaWarning excursionName={reservation.name.replace(/^Excursión (a la|a los|a las|al|a)\s+/i, '')} code={reservation.locator ?? null} onConfirm={() => void confirmarRoma(day.id)} onCancel={cancelarAviso} />
        </div>
      )}
    </div>
  )
}
