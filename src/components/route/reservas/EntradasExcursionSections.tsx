import { useMemo, useState } from 'react'
import type { Route } from '../../../lib/types'
import { BIG_RESERVATION_PLACES, buildEntryRows, buildExcursionRow, dayLineOf, hasEnoughDaysForExcursions, reservedLine, type EntryRow } from '../../../lib/bookings'
import { bestHoursLine, useBestHours, type BestHoursItem } from '../../../lib/bestHours'
import { buildActivitySearchUrl } from '../../../lib/affiliateLinks'
import { useDestinationExcursions } from '../../../lib/destinationExcursions'
import { useRouteStore } from '../../../store/useRouteStore'
import { useExcursionsStore } from '../../../store/useExcursionsStore'
import { ReservaCard } from './ReservasItemRow'
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
  // Las mejores horas para reservar un sitio grande, solo mientras no está reservado (9b.3).
  const bigOf = (row: EntryRow) => row.placeNames.find((name) => BIG_RESERVATION_PLACES.includes(name)) ?? null
  const bestItems = useMemo<BestHoursItem[]>(
    () => [...main, ...more].filter((row) => !row.reservation && bigOf(row) && row.day?.curatedId).map((row) => ({ curatedId: row.day!.curatedId!, place: bigOf(row)! })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [route, reservations],
  )
  const bestHours = useBestHours(route.destination, bestItems)
  const excursionsAvailable = info.excursions.length > 0 && hasEnoughDaysForExcursions(route, info.fromDays)
  const excursionRow = excursionsAvailable ? buildExcursionRow(route, reservations) : null

  const entryRow = (row: EntryRow) => {
    const big = bigOf(row)
    const stop = row.day?.stops.find((candidate) => row.placeNames.includes(candidate.name))
    const notes: { text: string; warn?: boolean }[] = []
    if (row.reservation?.aviso) notes.push({ text: row.reservation.aviso })
    if (!row.reservation && stop?.reservationRequiredNow) notes.push({ text: 'Reserva obligatoria en estas fechas', warn: true })
    const best = !row.reservation && big && row.day?.curatedId ? bestHoursLine(bestHours[`${row.day.curatedId}|${big}`]) : null
    if (best) notes.push({ text: best })
    return (
    <ReservaRow
      key={row.id}
      kind="entrada"
      label={row.name}
      notes={notes}
      subtitle={row.reservation ? reservedLine(route, row.reservation) : row.day ? dayLineOf(route, row.day) : ''}
      reserved={Boolean(row.reservation)}
      bookHref={buildActivitySearchUrl(`${row.name} ${route.destination}`)}
      onAdd={() => setTarget({ kind: 'entrada', refId: row.id, name: row.name, placeNames: row.placeNames, currentDayId: row.day?.id ?? null })}
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
          <ReservaCard
            kind="excursion"
            name="Free Tour"
            subtitle={freeTourReservation ? reservedLine(route, freeTourReservation) : dayLineOf(route, freeTourDay)}
            resolved={Boolean(freeTourReservation)}
            resolvedLabel="✓ Reservado"
            priority="gray"
            onAdd={() => setTarget({ kind: 'entrada', refId: 'Free Tour', name: 'Free Tour', placeNames: [freeTourStop.name], currentDayId: freeTourDay.id })}
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
