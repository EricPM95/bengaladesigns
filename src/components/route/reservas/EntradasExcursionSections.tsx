import { useState } from 'react'
import type { Route } from '../../../lib/types'
import { buildEntryRows, buildExcursionRow, dayLineOf, hasEnoughDaysForExcursions, reservedLine, type EntryRow } from '../../../lib/bookings'
import { buildActivitySearchUrl } from '../../../lib/affiliateLinks'
import { useDestinationExcursions } from '../../../lib/destinationExcursions'
import { useRouteStore } from '../../../store/useRouteStore'
import { useExcursionsStore } from '../../../store/useExcursionsStore'
import { CheckIcon, ReadinessKindIcon } from './ReadinessIcons'
import { AddReservationSheet, type ReservationTarget } from './AddReservationSheet'

const rowBorder = 'border-l-[3px] py-3 pl-3 pr-2'

/** Una fila de «ENTRADAS» o «EXCURSIÓN»: icono, nombre, línea pequeña, «Añadir» y «Reservar»; reservada, en verde con su check y sin botones. */
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
  if (reserved) {
    return (
      <div className={`flex w-full items-center gap-3 ${rowBorder} !border-accent-green`}>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-green-soft text-accent-green">
          <ReadinessKindIcon kind={kind} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-small font-semibold text-text">{label}</p>
          <p className="flex items-center gap-1 truncate text-caption font-medium text-accent-green">
            <CheckIcon className="h-3 w-3 shrink-0" />
            <span className="truncate">{subtitle}</span>
          </p>
        </div>
      </div>
    )
  }
  return (
    <div className={`flex w-full items-center gap-3 ${rowBorder} !border-text-muted`}>
      <button type="button" onClick={onAdd} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-bg-hover text-text-muted">
          <ReadinessKindIcon kind={kind} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-small font-semibold text-text">{label}</p>
          <p className="truncate text-caption text-text-soft">{subtitle}</p>
        </div>
      </button>
      <div className="flex w-28 shrink-0 flex-col items-stretch gap-1.5">
        <button type="button" onClick={onAdd} className="rounded-lg py-1 text-center text-caption font-semibold text-text-soft transition-colors hover:text-text">
          Añadir
        </button>
        {bookHref && (
          <a href={bookHref} target="_blank" rel="noopener noreferrer">
            <span className="block rounded-lg border border-accent/30 bg-accent-soft py-1 text-center text-caption font-semibold text-accent-hover transition-colors hover:bg-accent-soft/70">Reservar</span>
          </a>
        )}
      </div>
    </div>
  )
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
          <h3 className="text-caption font-semibold uppercase tracking-wide text-text-muted">Entradas</h3>
          <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-bg-card">
            {main.map(entryRow)}
            {showMore && more.map(entryRow)}
            {more.length > 0 && (
              <button type="button" onClick={() => setShowMore((value) => !value)} className="flex w-full items-center justify-between px-3.5 py-3 text-left text-caption font-semibold text-accent-hover transition-colors hover:bg-bg-hover">
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
          <h3 className="text-caption font-semibold uppercase tracking-wide text-text-muted">Excursión</h3>
          <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-bg-card">
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
              <div className={`flex w-full items-center gap-3 ${rowBorder} !border-text-muted`}>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-bg-hover text-text-muted">
                  <ReadinessKindIcon kind="excursion" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-small font-semibold text-text">Excursiones desde {route.destination}</p>
                  <p className="text-caption text-text-soft">{ratingLine}</p>
                </div>
                <button type="button" onClick={() => openExcursions(false)} className="shrink-0 rounded-lg border border-accent/30 bg-accent-soft px-3 py-1.5 text-caption font-semibold text-accent-hover transition-colors hover:bg-accent-soft/70">
                  Ver excursiones
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {target && <AddReservationSheet route={route} target={target} onClose={() => setTarget(null)} />}
    </>
  )
}
