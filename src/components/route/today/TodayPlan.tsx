import { useEffect, useState } from 'react'
import type { Coordinates, DayPlan, Stop } from '../../../lib/types'
import { minutesToTime, parseTimeToMinutes } from '../../../lib/time'
import { displayStopName } from '../../../lib/format'
import { legLabelBetween, walkMinutesBetween } from '../../../lib/legLabel'
import { adjustDay } from '../../../lib/adjustDay'
import { Button } from '../../ui/Button'
import type { CheckTimeResult } from '../../../lib/checkTime'

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

/** «Estoy cansado»: el servidor recalcula el día (lo de menos importancia pasa a «Si te sobra tiempo»). */
export function TodayAdjust({ day, nowMin }: { day: DayPlan; nowMin: number }) {
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const run = async () => {
    setBusy(true)
    setMessage(null)
    const result = await adjustDay(day.id, 'cansado', nowMin)
    setBusy(false)
    setMessage(
      result.ok
        ? `Tu día, con lo importante primero.${result.newSpare > 0 ? ' Lo demás está en «Si te sobra tiempo», en la pestaña Días.' : ''}`
        : 'Ahora mismo no hemos podido ajustar tu día. Inténtalo de nuevo en un momento.',
    )
  }

  return (
    <div className="mx-4 space-y-2">
      <Button variant="secondary" disabled={busy} onClick={run} className="w-full !px-3">
        {busy ? 'Ajustando…' : 'Estoy cansado'}
      </Button>
      {message && <p className="text-small leading-snug text-text-soft">{message}</p>}
    </div>
  )
}

interface TodayTimeCheckProps {
  day: DayPlan
  nowMin: number
  /** Lo último que dijo /api/check-time tras marcar «Visto» (null = nada que decir). */
  result: CheckTimeResult | null
  /** Las sugerencias están abiertas (también las abre «¿Quieres ver algo más?» de la tarjeta de descanso). */
  suggestOpen: boolean
  onSuggestOpen: (open: boolean) => void
  /** «Voy al restaurante»: vuelve a calcular con la hora de ahora. */
  onRecheck: () => void
  /** Una sugerencia entra en el día tras la parada actual. */
  onAdd: (stop: Stop) => void
  /** Se acepta o rechaza dejar algo para después: el aviso se cierra. */
  onResolved: () => void
}

/**
 * HOY (Tanda 6b): «Vas bien de tiempo» / «Vas justo». El viajero decide siempre; nunca cambia nada solo.
 */
export function TodayTimeCheck({ day, nowMin, result, suggestOpen, onSuggestOpen, onRecheck, onAdd, onResolved }: TodayTimeCheckProps) {
  const [adjusting, setAdjusting] = useState(false)
  const [error, setError] = useState(false)
  const [askedMeal, setAskedMeal] = useState(false)
  if (!result || result.status === 'normal') return null

  if (result.status === 'justo') {
    const drop = result.drop
    return (
      <div className="mx-4 space-y-3 rounded-2xl border border-accent-gold/40 bg-accent-gold/10 p-4">
        <p className="text-body font-semibold text-text">Vas justo</p>
        <p className="text-small leading-snug text-text-soft">{drop ? `¿Dejamos ${drop.name} para si te sobra tiempo?` : result.message}</p>
        {drop?.reason && <p className="text-caption text-text-muted">{drop.reason}</p>}
        {drop && (
          <div className="flex gap-2">
            <Button
              disabled={adjusting}
              className="flex-1 !px-3"
              onClick={async () => {
                setAdjusting(true)
                setError(false)
                const done = await adjustDay(day.id, 'justo', nowMin, [drop.name])
                setAdjusting(false)
                if (done.ok) onResolved()
                else setError(true)
              }}
            >
              {adjusting ? 'Ajustando…' : 'Sí, déjalo'}
            </Button>
            <Button variant="secondary" disabled={adjusting} className="flex-1 !px-3" onClick={onResolved}>
              No, sigo con todo
            </Button>
          </div>
        )}
        {error && <p className="text-small text-text-soft">Ahora mismo no hemos podido ajustar tu día. Inténtalo de nuevo en un momento.</p>}
      </div>
    )
  }

  const showQuestion = result.beforeMeal && !suggestOpen && !askedMeal
  return (
    <div className="mx-4 space-y-3 rounded-2xl border border-accent-green/40 bg-accent-green-soft p-4">
      <p className="text-body font-semibold text-text">{result.status === 'hueco' ? result.message : 'Vas bien de tiempo'}</p>
      {result.status !== 'hueco' && result.message && <p className="text-small leading-snug text-text-soft">{result.message}</p>}
      {showQuestion && (
        <>
          <p className="text-small leading-snug text-text">¿Vas ya al restaurante o quieres ver algo más?</p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="flex-1 !px-3"
              onClick={() => {
                setAskedMeal(true)
                onRecheck()
              }}
            >
              Voy al restaurante
            </Button>
            <Button className="flex-1 !px-3" onClick={() => onSuggestOpen(true)}>
              Ver algo más
            </Button>
          </div>
        </>
      )}
      {(suggestOpen || (!result.beforeMeal && result.suggestions.length > 0)) && (
        <ul className="divide-y divide-text/[.08]">
          {result.suggestions.map((stop) => (
            <li key={stop.id} className="flex items-center gap-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="font-display text-[16px] leading-[1.2] text-text [overflow-wrap:anywhere]">{displayStopName(stop.name)}</p>
                <p className="mt-0.5 text-[12px] leading-[1.35] text-text/60">
                  {stop.durationMinutes} min{stop.addNote ? ` · ${stop.addNote}` : ''}
                </p>
              </div>
              <button type="button" onClick={() => onAdd(stop)} className="shrink-0 rounded-full border-[1.5px] border-accent px-3.5 py-1.5 text-[12.5px] font-semibold text-accent transition-colors hover:bg-accent-soft">
                Añadir
              </button>
            </li>
          ))}
          {result.suggestions.length === 0 && <li className="py-2 text-small text-text-soft">Por ahora no tenemos nada más cerca que proponerte.</li>}
        </ul>
      )}
    </div>
  )
}
