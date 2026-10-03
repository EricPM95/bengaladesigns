import { useState } from 'react'
import type { Route } from '../../../lib/types'
import { buildEntryRows, buildExcursionRow, dayLineOf, hasEnoughDaysForExcursions, reservedLine, type EntryRow } from '../../../lib/bookings'
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
}: {
  kind: 'entrada' | 'excursion'
  label: string
  subtitle: string
  reserved: boolean
  bookHref: string | null
  onAdd: () => void
}) {
  return <ReservaCard kind={kind} name={label} subtitle={subtitle || undefined} resolved={reserved} resolvedLabel="✓ Reservado" onAdd={onAdd} bookAction={{ label: 'Reservar', href: bookHref }} />
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

  const { main, more } = buildEntryRows(route, info.entradas, reservations)
  const excursionsAvailable = info.excursions.length > 0 && hasEnoughDaysForExcursions(route, info.fromDays)
  const excursionRow = excursionsAvailable ? buildExcursionRow(route, reservations) : null

  const entryRow = (row: EntryRow) => (
    <ReservaRow
      key={row.id}
      kind="entrada"
      label={row.name}
      subtitle={row.reservation ? reservedLine(route, row.reservation) : row.day ? dayLineOf(route, row.day) : ''}
      reserved={Boolean(row.reservation)}
      bookHref={buildActivitySearchUrl(`${row.name} ${route.destination}`)}
      onAdd={() => setTarget({ kind: 'entrada', refId: row.id, name: row.name, placeNames: row.placeNames, currentDayId: row.day?.id ?? null })}
    />
  )

  const ratingLine = info.rating ? `${info.excursions.length} excursiones · ${info.rating.percent} % de valoración media` : `${info.excursions.length} excursiones`

  if (main.length === 0 && more.length === 0 && !excursionsAvailable) return null

  return (
    <>
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
