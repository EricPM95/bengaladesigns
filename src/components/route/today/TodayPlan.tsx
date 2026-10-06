import { useEffect, useState } from 'react'
import type { Coordinates, DayPlan, Stop } from '../../../lib/types'
import { minutesToTime, parseTimeToMinutes } from '../../../lib/time'
import { displayStopName } from '../../../lib/format'
import { legLabelBetween, walkMinutesBetween } from '../../../lib/legLabel'
import { adjustDay, type AdjustMode } from '../../../lib/adjustDay'
import { Button } from '../../ui/Button'

/** Icono lineal fino de andar / trayecto, gris (regla de iconos del proyecto). */
function LegIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0" aria-hidden="true">
      <circle cx="13" cy="4.5" r="1.8" />
      <path d="M9 21l2.5-6.5L9.5 12l1-4.5 3 1.5 2 3.5M11.5 14.5L14 18l.5 3" />
    </svg>
  )
}

/**
 * El trayecto hasta una parada («8 min andando», «Taxi, 15 min», «Bus 23, 20 min»): desde `from` si se conoce y, si la parada
 * llega en bus o metro, eso. Sin dato real no sale nada (nunca un número inventado).
 */
export function LegLine({ from, to, className = '' }: { from?: Coordinates; to: Stop; className?: string }) {
  const [label, setLabel] = useState<string | null>(null)
  useEffect(() => {
    let cancelled = false
    legLabelBetween(from, to).then((value) => {
      if (!cancelled) setLabel(value)
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from?.lat, from?.lng, to.id, to.transitLabel])
  if (!label) return null
  return (
    <p className={`flex items-center gap-1.5 text-caption text-text-muted ${className}`}>
      <LegIcon />
      {label}
    </p>
  )
}

/** Lo que hoy puede salir mal en lo que falta: cierres y avisos de horario de las paradas pendientes. */
export function TodayClosureNotices({ stops }: { stops: Stop[] }) {
  const lines: { id: string; name: string; text: string }[] = []
  for (const stop of stops) {
    if (stop.checkedInAt || stop.isArrival) continue
    const closedOutside = stop.visitMode === 'fuera' && (stop.outsideKind === 'cerrado' || stop.outsideKind === 'ya_cerrado' || stop.outsideKind === 'no_abre')
    const text = stop.closedNotice ?? stop.hoursWarning ?? (closedOutside ? stop.outsideReason : null)
    if (text) lines.push({ id: stop.id, name: displayStopName(stop.name), text })
  }
  if (lines.length === 0) return null
  return (
    <div className="mx-4 space-y-2 rounded-2xl border border-accent-gold/40 bg-accent-gold/10 p-4">
      <p className="text-caption font-semibold uppercase tracking-wide text-text-muted">Avisos de hoy</p>
      <ul className="space-y-1.5">
        {lines.map((line) => (
          <li key={line.id} className="text-small leading-snug text-text">
            <span className="font-semibold">{line.name}.</span> {line.text}
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * Cuenta atrás de las reservas: «Tu entrada en el Coliseo es a las 12:00. Sal de aquí a las 11:15». La hora de salir es la de la
 * reserva menos el trayecto desde donde estás menos la llegada previa («Llegada a…»), si el día la lleva.
 */
export function ReservationCountdown({ stops, nowMin }: { stops: Stop[]; nowMin: number }) {
  const pending = stops
    .map((stop, index) => ({ stop, index }))
    .filter(({ stop }) => stop.reservationTime && !stop.checkedInAt && /^\d{1,2}:\d{2}$/.test(stop.reservationTime))
  const key = pending.map(({ stop }) => stop.id).join('|')
  const [walks, setWalks] = useState<Record<string, number | null>>({})

  useEffect(() => {
    let cancelled = false
    for (const { stop, index } of pending) {
      // Desde donde estarás: la parada de antes (saltando la tarjeta de llegada).
      let before = index - 1
      if (stops[before]?.isArrival) before--
      const origin = before >= 0 ? stops[before].coordinates : undefined
      walkMinutesBetween(origin, stop.coordinates).then((minutes) => {
        if (!cancelled) setWalks((prev) => ({ ...prev, [stop.id]: minutes }))
      })
    }
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  if (pending.length === 0) return null
  return (
    <div className="mx-4 space-y-3 rounded-2xl border border-border bg-bg-card p-4">
      {pending.map(({ stop, index }) => {
        const at = parseTimeToMinutes(stop.reservationTime!)
        const arrivalMargin = stops[index - 1]?.isArrival ? stops[index - 1].durationMinutes : 0
        const walk = walks[stop.id]
        const name = displayStopName(stop.name)
        const lead = stop.isFreeTour ? `Tu Free Tour sale a las ${stop.reservationTime}` : `Tu entrada en ${name} es a las ${stop.reservationTime}`
        if (walk == null) {
          return (
            <p key={stop.id} className="text-small leading-snug text-text">
              {lead}.{arrivalMargin > 0 ? ` Llega unos ${arrivalMargin} min antes.` : ''}
            </p>
          )
        }
        const leaveAt = at - walk - arrivalMargin
        const late = nowMin >= leaveAt
        return (
          <p key={stop.id} className="text-small leading-snug text-text">
            {lead}. {late ? <span className="font-semibold text-accent-red">Es hora de salir.</span> : <>Sal de aquí a las <span className="font-semibold">{minutesToTime(leaveAt)}</span>.</>}
            <span className="block text-caption text-text-muted">
              {walk} min andando{arrivalMargin > 0 ? ` y ${arrivalMargin} min de margen para llegar` : ''}
            </span>
          </p>
        )
      })}
    </div>
  )
}

/** «Voy con retraso» y «Estoy cansado»: el servidor recalcula el día (lo de menos importancia pasa a «Si te sobra tiempo»). */
export function TodayAdjust({ day, nowMin }: { day: DayPlan; nowMin: number }) {
  const [busy, setBusy] = useState<AdjustMode | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const run = async (mode: AdjustMode) => {
    setBusy(mode)
    setMessage(null)
    const result = await adjustDay(day.id, mode, nowMin)
    setBusy(null)
    setMessage(
      result.ok
        ? `Hemos ajustado tu día para que no pierdas lo importante.${result.newSpare > 0 ? ' Lo que ha salido está en «Si te sobra tiempo», en la pestaña Días.' : ''}`
        : 'Ahora mismo no hemos podido ajustar tu día. Inténtalo de nuevo en un momento.',
    )
  }

  return (
    <div className="mx-4 space-y-2">
      <div className="flex gap-2">
        <Button variant="secondary" disabled={busy !== null} onClick={() => run('retraso')} className="flex-1 !px-3">
          {busy === 'retraso' ? 'Ajustando…' : 'Voy con retraso'}
        </Button>
        <Button variant="secondary" disabled={busy !== null} onClick={() => run('cansado')} className="flex-1 !px-3">
          {busy === 'cansado' ? 'Ajustando…' : 'Estoy cansado'}
        </Button>
      </div>
      {message && <p className="text-small leading-snug text-text-soft">{message}</p>}
    </div>
  )
}
