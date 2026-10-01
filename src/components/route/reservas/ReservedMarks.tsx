import { useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import type { Excursion } from '../../../lib/types'
import type { Reservation } from '../../../lib/bookings'
import { useRouteStore } from '../../../store/useRouteStore'
import { AddReservationSheet, type ReservationTarget } from './AddReservationSheet'

/** La reserva de una excursión de este viaje (null si no está reservada). */
export function useExcursionReservation(excursionId: string | null | undefined): Reservation | null {
  return useRouteStore((state) => (excursionId ? (state.reservations.find((reservation) => reservation.kind === 'excursion' && reservation.refId === excursionId) ?? null) : null))
}

function LockIcon({ className = 'h-3.5 w-3.5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  )
}

/** Las dos marcas de lo reservado: «Reservada ✓» en verde y un candado con «Fijada» (PARA_CODE_RESERVAS, 6). */
export function ReservedMarks({ className = '' }: { className?: string }) {
  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      <span className="inline-flex items-center gap-1 rounded-full bg-accent-green px-2.5 py-1 text-[12px] font-semibold text-white">
        <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        Reservada
      </span>
      <span className="inline-flex items-center gap-1 rounded-full border border-text/20 bg-bg-card px-2.5 py-1 text-[12px] font-semibold text-text-soft">
        <LockIcon className="h-3 w-3" />
        Fijada
      </span>
    </div>
  )
}

/** Los datos de lo reservado: la hora (de recogida o de entrada), el punto de encuentro si lo hay y el número de reserva. */
export function ReservedDetails({ reservation, timeLabel }: { reservation: Reservation; timeLabel: string }) {
  return (
    <dl className="mt-2 space-y-0.5 text-caption text-text-soft">
      <div className="flex gap-1.5">
        <dt className="font-semibold text-text">{timeLabel}</dt>
        <dd>{reservation.time}</dd>
      </div>
      {reservation.returnTime && (
        <div className="flex gap-1.5">
          <dt className="font-semibold text-text">Vuelta</dt>
          <dd>{reservation.returnTime}</dd>
        </div>
      )}
      {reservation.meetingPoint && (
        <div className="flex gap-1.5">
          <dt className="font-semibold text-text">Punto de encuentro</dt>
          <dd>{reservation.meetingPoint}</dd>
        </div>
      )}
      {reservation.locator && (
        <div className="flex gap-1.5">
          <dt className="font-semibold text-text">N.º de reserva</dt>
          <dd>{reservation.locator}</dd>
        </div>
      )}
    </dl>
  )
}

/**
 * «¿Quitar {nombre} de tu viaje?»: quitar lo reservado no cancela la reserva fuera, y la ventana lo dice antes de nada (PARA_CODE_RESERVAS, 6). Para
 * cambiarla, el viajero la quita y la vuelve a crear.
 */
export function RemoveReservationDialog({ name, onCancel, onConfirm }: { name: string; onCancel: () => void; onConfirm: () => void }) {
  return createPortal(
    <div className="fixed inset-0 z-[95] flex items-end justify-center md:items-center" role="dialog" aria-modal="true" aria-labelledby="remove-reservation-heading">
      <div className="trazo-notice-backdrop absolute inset-0 bg-text/25 backdrop-blur-[6px]" onClick={onCancel} />
      <div className="trazo-notice-panel relative w-full rounded-t-[28px] bg-bg-card px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-6 shadow-[0_-8px_40px_-12px_rgba(28,34,48,.35)] md:w-[420px] md:rounded-[28px]">
        <h2 id="remove-reservation-heading" className="font-display text-[24px] leading-[1.15] text-text">
          ¿Quitar {name} de tu viaje?
        </h2>
        <p className="mt-4 rounded-2xl border border-accent-gold/50 bg-accent-gold/15 px-4 py-3 text-[14.5px] leading-snug text-text">
          Quitarla de tu viaje no cancela tu reserva. <strong>Cancela primero tu reserva</strong> y después quítala aquí.
        </p>
        <div className="mt-5 flex gap-2">
          <button type="button" onClick={onCancel} className="h-12 flex-1 rounded-full border border-text/15 text-[15px] font-medium text-text transition-colors hover:bg-bg-hover">
            Cancelar
          </button>
          <button type="button" onClick={onConfirm} className="h-12 flex-1 rounded-full bg-text text-[15px] font-medium text-bg transition-transform active:scale-[.98]">
            Quitar del viaje
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

/** Las dos marcas arriba de la tarjeta de una excursión reservada (nada si no lo está). */
export function ExcursionReservedTop({ excursion }: { excursion: Excursion }) {
  const reservation = useExcursionReservation(excursion.id)
  return reservation ? <ReservedMarks className="mb-2" /> : null
}

/**
 * Lo que va debajo de la tarjeta de una excursión en Días: sin reservar, los botones de siempre y «¿Ya la has reservado? Añade tu confirmación»;
 * reservada, sus datos (las marcas van arriba) y «Quitar del viaje» (sin «Reservar» ni «¿Ya la has reservado?»).
 */
export function ExcursionBookArea({ excursion, children }: { excursion: Excursion; children?: ReactNode }) {
  const route = useRouteStore((state) => state.route)
  const reservation = useExcursionReservation(excursion.id)
  const removeReservation = useRouteStore((state) => state.removeReservation)
  const [adding, setAdding] = useState(false)
  const [removing, setRemoving] = useState(false)
  if (!route) return <>{children}</>
  const target: ReservationTarget = { kind: 'excursion', refId: excursion.id, name: excursion.title, placeNames: [], excursion, currentDayId: route.days.find((day) => day.selectedExcursionId === excursion.id)?.id ?? null }

  if (reservation) {
    return (
      <div className="mt-3">
        <ReservedDetails reservation={reservation} timeLabel="Recogida" />
        <button type="button" onClick={() => setRemoving(true)} className="mt-3 w-full text-center text-caption text-text-muted underline transition-colors hover:text-text-soft">
          Quitar del viaje
        </button>
        {removing && (
          <RemoveReservationDialog
            name={excursion.title}
            onCancel={() => setRemoving(false)}
            onConfirm={() => {
              removeReservation(reservation.id)
              setRemoving(false)
            }}
          />
        )}
      </div>
    )
  }

  return (
    <>
      {children}
      <button type="button" onClick={() => setAdding(true)} className="mt-2 w-full rounded-xl border border-text/15 bg-bg-card py-2 text-center text-caption font-semibold text-text-soft transition-colors hover:bg-bg-hover">
        ¿Ya la has reservado? Añade tu confirmación
      </button>
      {adding && <AddReservationSheet route={route} target={target} onClose={() => setAdding(false)} />}
    </>
  )
}
