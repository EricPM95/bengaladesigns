import type { DayPlan, Route } from '../../../lib/types'
import { excursionReservationOf, viewedExcursion } from '../../../lib/dayInterruptor'
import { useRouteStore } from '../../../store/useRouteStore'
import { TuExcursionEnHoy } from '../hoy/TuExcursionEnHoy'
import { TarjetaDeExcursionConTransporte } from '../hoy/v2/TarjetaDeTransporteHoy'
import { unidasAUnaExcursion } from '../../../lib/reservasUnidas'
import { excursionDeUnDia } from '../../../lib/bookings'

/**
 * HOY el día de excursión (Tanda 6g, punto 6): sale la excursión, su nombre y su hora de salida, con el código si está confirmada. Nada más. Si es de medio día, después salen los lugares
 * que el viajero haya añadido a la tarde.
 */
export function TodayExcursion({ route, day }: { route: Route; day: DayPlan }) {
  const reservations = useRouteStore((state) => state.reservations)
  const excursion = viewedExcursion(day)
  const reservation = excursionReservationOf(route, reservations, day)
  // (V57) Un día de excursión (dayType) sin la excursión elegida en los datos (La Graciosa sin elegir, o solo con su reserva) sale igual como día de excursión: nunca «Hoy libre».
  const page = excursion?.page
  const nombre = excursion?.title ?? reservation?.name ?? day.curatedTitle ?? `Excursión desde ${day.city}`
  const departure = reservation?.time ?? page?.stops[0]?.time ?? null
  const afterwards = day.stops.filter((stop) => !stop.isNightExperience)
  // (V76, R9) La excursión por tu cuenta con su ferry, tren o autobús UNIDO: la tarjeta de la excursión con una fila por billete (SALIDA · Órzola…). Sin excursión organizada (sin reserva propia), sustituye a la tarjeta de siempre.
  const excursionDelDia = excursion ?? excursionDeUnDia(day)
  const unidas = excursionDelDia ? unidasAUnaExcursion(reservations, excursionDelDia.id) : []
  return (
    <div className="mx-4 space-y-3">
      {unidas.length > 0 && <TarjetaDeExcursionConTransporte route={route} day={day} excursion={excursionDelDia} unidas={unidas} />}
      {(unidas.length === 0 || reservation) && (
      <div className="rounded-2xl border border-text/[.08] bg-bg-card p-4 shadow-[0_1px_2px_rgba(28,34,48,.05)]">
        <p className="font-mono text-[10.5px] font-medium uppercase tracking-[.14em] text-accent">Excursión del día</p>
        <p className="mt-1.5 font-display text-[26px] leading-[1.1] text-text">
          {page ? (
            <>
              {page.nameBefore} <em className="text-accent-grande">{page.nameDestination}</em>
              {page.nameAfter}
            </>
          ) : (
            nombre
          )}
        </p>
        {departure && (
          <p className="mt-3 text-[14px] text-text">
            Salida a las <span className="font-mono font-semibold">{departure}</span>
            {excursion?.meetingPoint ? <span className="text-text-soft"> · {excursion.meetingPoint}</span> : null}
          </p>
        )}
        {reservation && <p className="mt-2 text-[13px] font-medium text-accent-green">✓ Reservada{reservation.locator ? ` · ${reservation.locator}` : ''}</p>}
      </div>
      )}
      {/* (10R §4) Con el pase: «Tu excursión» con su código y [Cómo llegar al punto de encuentro]. */}
      <TuExcursionEnHoy route={route} reserva={reservation} puntoDeEncuentro={excursion?.meetingPoint ?? null} />
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
