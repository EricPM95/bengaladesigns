import { useState } from 'react'
import type { DayPlan, Route } from '../../../lib/types'
import { buildEntryRows, buildExcursionRow, dateOfDay, dayLineOf, dayOfReservation, hasEnoughDaysForExcursions, reservedLine, shortDateEs, type EntryRow } from '../../../lib/bookings'
import { buildActivitySearchUrl } from '../../../lib/affiliateLinks'
import { useDestinationExcursions } from '../../../lib/destinationExcursions'
import { useRouteStore } from '../../../store/useRouteStore'
import { useExcursionsStore } from '../../../store/useExcursionsStore'
import { ReservaCard } from './ReservasItemRow'
import { EntradaCard } from './EntradaCard'
import { AddReservationSheet, type ReservationTarget } from './AddReservationSheet'

/** Una tarjeta de «ENTRADAS» o «EXCURSIÓN»: la misma de todo Reservas (ReservaCard); reservada, en verde con «✓ Reservado». */
function ReservaRow({
  kind,
  label,
  subtitle,
  reserved,
  bookHref,
  onAdd,
  notes,
}: {
  kind: 'entrada' | 'excursion'
  label: string
  subtitle: string
  reserved: boolean
  bookHref: string | null
  onAdd: () => void
  notes?: { text: string; warn?: boolean }[]
}) {
  return <ReservaCard kind={kind} name={label} subtitle={subtitle || undefined} notes={notes} resolved={reserved} resolvedLabel="✓ Reservado" priority="gray" onAdd={onAdd} bookAction={{ label: 'Reservar', href: bookHref }} />
}

/**
 * «ENTRADAS» y «EXCURSIÓN» de la pantalla de Reservas (PARA_CODE_RESERVAS, 1): dos secciones debajo de lo de siempre, con el mismo formato de filas.
 * Se calculan siempre desde la ruta y los datos del destino, así que siguen a la pestaña Días (si se mueven los días cambia la línea; si se quita la
 * parada, la fila desaparece) y nunca pueden decir un día, una parada o una excursión distintos de los de Días.
 */
export function EntradasExcursionSections({ route }: { route: Route }) {
  const reservations = useRouteStore((state) => state.reservations)
  const openExcursions = useExcursionsStore((state) => state.openPage)
  const info = useDestinationExcursions(route.destination)
  const [showMore, setShowMore] = useState(false)
  const [target, setTarget] = useState<ReservationTarget | null>(null)
  // El Free Tour solo sale si está en el viaje (lo marcó en Experiencias o lo añadió desde la app): va como las demás entradas (Tanda 6j, 9b.1).
  const freeTourDay = route.days.find((day) => day.stops.some((stop) => stop.isFreeTour))
  const freeTourStop = freeTourDay?.stops.find((stop) => stop.isFreeTour) ?? null
  const freeTourReservation = reservations.find((reservation) => reservation.kind === 'entrada' && reservation.refId === 'Free Tour') ?? null

  const { main, more } = buildEntryRows(route, info.entradas, reservations)
  const excursionsAvailable = info.excursions.length > 0 && hasEnoughDaysForExcursions(route, info.fromDays)
  const excursionRow = excursionsAvailable ? buildExcursionRow(route, reservations) : null

  /** «Día 1» sin fechas; con fechas, «Mar 12 ene». */
  const whenOf = (day: DayPlan | null): string => {
    if (!day) return ''
    const iso = route.answers.dateRange ? dateOfDay(route, day) : null
    if (!iso) return `Día ${day.dayNumber}`
    const text = shortDateEs(iso)
    return text.charAt(0).toUpperCase() + text.slice(1)
  }

  const entryRow = (row: EntryRow) => {
    const notes: { text: string; warn?: boolean }[] = []
    if (row.reservation?.aviso) notes.push({ text: row.reservation.aviso })
    const target = { kind: 'entrada' as const, refId: row.id, name: row.name, placeNames: row.placeNames, currentDayId: row.day?.id ?? null }
    return (
      <EntradaCard
        key={row.id}
        when={whenOf((row.reservation ? dayOfReservation(route, row.reservation) : null) ?? row.day)}
        name={row.name}
        reservedTime={row.reservation ? row.reservation.time : null}
        buyHref={buildActivitySearchUrl(`${row.name} ${route.destination}`)}
        notes={notes}
        onAdd={() => setTarget(target)}
        onChange={() => setTarget({ ...target, existing: row.reservation })}
      />
    )
  }

  const ratingLine = info.rating ? `${info.excursions.length} excursiones · ${info.rating.percent} % de valoración media` : `${info.excursions.length} excursiones`

  if (main.length === 0 && more.length === 0 && !excursionsAvailable && !freeTourStop) return null

  return (
    <>
      {freeTourStop && freeTourDay && (
        <div className="space-y-2">
          <h3 className="text-text/55" style={{ font: "600 10.5px 'Geist Mono',monospace", letterSpacing: '.14em', textTransform: 'uppercase' }}>Free Tour</h3>
          <EntradaCard
            when={whenOf((freeTourReservation ? dayOfReservation(route, freeTourReservation) : null) ?? freeTourDay)}
            name="Free Tour"
            buyLabel="Reservar Free Tour"
            buyHref={buildActivitySearchUrl(`Free Tour ${route.destination}`)}
            reservedTime={freeTourReservation ? freeTourReservation.time : null}
            onAdd={() => setTarget({ kind: 'entrada' as const, refId: 'Free Tour', name: 'Free Tour', placeNames: [freeTourStop.name], currentDayId: freeTourDay.id })}
            onChange={() => setTarget({ ...{ kind: 'entrada' as const, refId: 'Free Tour', name: 'Free Tour', placeNames: [freeTourStop.name], currentDayId: freeTourDay.id }, existing: freeTourReservation })}
          />
        </div>
      )}

      {(main.length > 0 || more.length > 0) && (
        <div className="space-y-2">
          <h3 className="text-text/55" style={{ font: "600 10.5px 'Geist Mono',monospace", letterSpacing: '.14em', textTransform: 'uppercase' }}>Entradas</h3>
          <div className="space-y-2.5">
            {main.map(entryRow)}
            {showMore && more.map(entryRow)}
            {more.length > 0 && (
              <button type="button" onClick={() => setShowMore((value) => !value)} className="flex w-full items-center justify-between rounded-[18px] border border-text/[.08] bg-white px-4 py-3 text-left text-caption font-semibold text-accent-hover transition-colors hover:bg-bg-hover">
                {showMore ? 'Ver menos' : `Ver ${more.length} ${more.length === 1 ? 'entrada más' : 'entradas más'} de tu ruta`}
                <span aria-hidden="true" className={`transition-transform ${showMore ? 'rotate-90' : ''}`}>
                  ›
                </span>
              </button>
            )}
          </div>
        </div>
      )}

      {excursionsAvailable && excursionRow && (
        <div className="space-y-2">
          <h3 className="text-text/55" style={{ font: "600 10.5px 'Geist Mono',monospace", letterSpacing: '.14em', textTransform: 'uppercase' }}>Excursión</h3>
          <div className="space-y-2.5">
            {excursionRow.excursion && excursionRow.day ? (
              <ReservaRow
                kind="excursion"
                label={excursionRow.excursion.title}
                subtitle={excursionRow.reservation ? reservedLine(route, excursionRow.reservation) : dayLineOf(route, excursionRow.day)}
                reserved={Boolean(excursionRow.reservation)}
                bookHref={excursionRow.excursion.bookUrl ?? null}
                onAdd={() =>
                  setTarget({ kind: 'excursion', refId: excursionRow.excursion!.id, name: excursionRow.excursion!.title, placeNames: [], excursion: excursionRow.excursion, currentDayId: excursionRow.day?.id ?? null })
                }
              />
            ) : (
              <ReservaCard
                kind="excursion"
                name={`Excursiones desde ${route.destination}`}
                subtitle={ratingLine}
                resolved={false}
                onAdd={() => openExcursions(false)}
                trailing={
                  <button type="button" onClick={() => openExcursions(false)} className="whitespace-nowrap" style={{ height: 30, padding: '0 12px', borderRadius: 999, border: '1.5px solid oklch(0.8 0.1 50)', background: 'oklch(0.93 0.06 55)', color: 'oklch(0.48 0.15 40)', font: "600 12px 'Geist'" }}>
                    Ver excursiones
                  </button>
                }
              />
                          )}
          </div>
        </div>
      )}

      {target && <AddReservationSheet route={route} target={target} onClose={() => setTarget(null)} />}
    </>
  )
}
