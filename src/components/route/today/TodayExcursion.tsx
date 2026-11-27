import type { Coordinates, DayPlan, Route } from '../../../lib/types'
import { viewedExcursion } from '../../../lib/dayInterruptor'
import { excursionDeUnDia } from '../../../lib/bookings'
import { ExcursionHoy, useDatosDeExcursion } from '../hoy/v2/ExcursionHoy'
import type { ReactNode } from 'react'

/**
 * HOY el día de excursión (Tanda 6g, punto 6; rehecho en la V80 con Design «Día de excursión en HOY», EX1-EX6): la excursión paso a paso (`ExcursionHoy`), por tu cuenta u organizada. Si es de medio día, después salen los
 * lugares que el viajero haya añadido a la tarde. El «Tu excursión» con el código (10R §4) es ahora la fila de la reserva dentro de la tarjeta de la excursión organizada.
 */
export function TodayExcursion({ route, day, dateIso = '', ubicacion = null, ahoraMin = 0, enCoche = false, desde = null, pieDeTarjeta }: { route: Route; day: DayPlan; dateIso?: string; ubicacion?: Coordinates | null; ahoraMin?: number; enCoche?: boolean; desde?: Coordinates | null; pieDeTarjeta?: ReactNode }) {
  const excursion = viewedExcursion(day)
  const page = excursion?.page
  const afterwards = day.stops.filter((stop) => !stop.isNightExperience)
  // (V57) Un día de excursión (dayType) sin la excursión elegida en los datos sale igual como día de excursión: nunca «Hoy libre».
  const excursionDelDia = excursion ?? excursionDeUnDia(day)
  const datos = useDatosDeExcursion(route.destination, excursionDelDia?.id ?? null, day.diaEscritoId)
  return (
    <div className="mx-4 space-y-3">
      {datos.cargado && <ExcursionHoy route={route} day={day} dateIso={dateIso} ubicacion={ubicacion} ahoraMin={ahoraMin} enCoche={enCoche} desde={desde} pieDeTarjeta={pieDeTarjeta} datos={datos} />}
      {page?.halfDay && afterwards.length > 0 && (
        <div className="rounded-2xl border border-text/[.08] bg-bg-card p-4">
          <p className="font-mono text-[10.5px] font-medium uppercase tracking-[.14em] text-text-muted">Tu tarde</p>
          <ul className="mt-2 space-y-1.5">
            {afterwards.map((stop) => (
              <li key={stop.id} className="flex items-baseline gap-3 text-[14px] text-text">
                <span className="w-11 shrink-0 font-mono text-[12px] text-text-soft">{stop.time}</span>
                <span>{stop.name}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
