import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import type { DayPlan, Excursion, Route, Stop } from '../../../lib/types'
import type { DestinationPlace } from '../../../lib/destinationPlacesApi'
import { fetchPlacePhoto } from '../../../lib/placePhoto'
import { addDaysToIso } from '../../../lib/dateRange'
import { minutesToTime, parseTimeToMinutes } from '../../../lib/time'
import { closedWeekdaysFromSchedule, formatDaySessions, nextOpenMinutes, parseClosingMinutes } from '../../../lib/stopHoursTag'
import { hasFullDayExcursion, isEmptyDay, isFreeDay, suggestedTimeFor } from '../../../lib/freeDays'
import { placeHoursOnDate } from '../../../lib/placeHoursOnDate'
import { useRouteStore } from '../../../store/useRouteStore'
import { placeholderPhoto, stopFromPlace } from '../placeExplorer/PlaceExplorerScreen'

/** Lo que se añade: un lugar, un restaurante (va como comida o cena) o una excursión. */
export type AddItem = { kind: 'place'; place: DestinationPlace } | { kind: 'excursion'; excursion: Excursion }

export interface AddedResult {
  dayId: string
  /** La parada nueva (para desplazarse hasta ella); null en comidas y excursiones. */
  stopId: string | null
}

interface AddToDaySheetProps {
  route: Route
  item: AddItem
  /** El día del que se viene: ya sale marcado. */
  initialDayId: string | null
  onClose: () => void
  onAdded: (result: AddedResult) => void
}

const WEEKDAY = new Intl.DateTimeFormat('es-ES', { weekday: 'short' })
const MONTH = new Intl.DateTimeFormat('es-ES', { month: 'short' })

/** "sáb 17 oct" */
function shortDate(dateIso: string): string {
  const date = new Date(`${dateIso}T00:00:00`)
  return `${WEEKDAY.format(date).replace('.', '')} ${date.getDate()} ${MONTH.format(date).replace('.', '')}`
}

export const dayName = (day: DayPlan): string => day.curatedTitle ?? day.title ?? day.city

/** "Día 3 · sáb 17 oct · Compras" (sin fechas, sin la fecha). */
export function dayOptionLabel(route: Route, day: DayPlan): string {
  const start = route.answers.dateRange?.start
  return [`Día ${day.dayNumber}`, start ? shortDate(addDaysToIso(start, day.dayNumber - 1)) : null, dayName(day)].filter(Boolean).join(' · ')
}

/** Por qué no se puede elegir ese día (null = se puede). */
function blockedReason(item: AddItem, day: DayPlan): string | null {
  if (hasFullDayExcursion(day)) return 'Tiene una excursión de día entero'
  if (item.kind === 'excursion') return isEmptyDay(day) ? null : 'Este día ya tiene cosas'
  if (item.place.kind !== 'restaurant' && day.stops.some((stop) => stop.name === item.place.name)) return 'Ya está en este día'
  return null
}

/**
 * La ventana de "+ Añadir" (decisión del usuario, 2026-09-28): a qué día, con la hora y los minutos ya sugeridos, y
 * solo los avisos que pasan (cerrado a esa hora, se pisa con otra parada, reserva). Se puede añadir igual.
 */
export function AddToDaySheet({ route, item, initialDayId, onClose, onAdded }: AddToDaySheetProps) {
  const addPlaceToDay = useRouteStore((state) => state.addPlaceToDay)
  const setMealRestaurant = useRouteStore((state) => state.setMealRestaurant)
  const addExcursionToDay = useRouteStore((state) => state.addExcursionToDay)

  const days = route.days.filter((day) => !day.isReturnLeg)
  const firstFree = days.find((day) => !blockedReason(item, day))
  const [dayId, setDayId] = useState<string | null>(
    initialDayId && days.some((day) => day.id === initialDayId && !blockedReason(item, day)) ? initialDayId : (firstFree?.id ?? null),
  )
  const day = days.find((candidate) => candidate.id === dayId) ?? null
  const isRestaurant = item.kind === 'place' && item.place.kind === 'restaurant'
  const [meal, setMeal] = useState<'lunch' | 'dinner'>('lunch')
  const [photo, setPhoto] = useState<string | null>(null)
  const place = item.kind === 'place' ? item.place : null

  useEffect(() => {
    if (!place || place.kind === 'restaurant') return
    let cancelled = false
    fetchPlacePhoto(place.name, route.destination, place.wikipedia_title).then((url) => {
      if (!cancelled && url) setPhoto(url)
    })
    return () => {
      cancelled = true
    }
  }, [place, route.destination])

  const draft: Stop | null = useMemo(() => (place && !isRestaurant ? stopFromPlace(place, photo ?? placeholderPhoto(place.name)) : null), [place, isRestaurant, photo])
  const suggested = day && draft ? suggestedTimeFor(day, draft) : '09:30'
  const [time, setTime] = useState(suggested)
  const [minutes, setMinutes] = useState(draft?.durationMinutes ?? 60)
  // Día libre (decisión del usuario, 2026-09-28): solo paradas, sin hora; la pone el viajero después si quiere.
  const freeDay = Boolean(day && isFreeDay(day))
  // Al cambiar de día, la hora sugerida es la de ese día.
  useEffect(() => {
    setTime(suggested)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayId])

  const dateIso = day && route.answers.dateRange ? addDaysToIso(route.answers.dateRange.start, day.dayNumber - 1) : null
  const warnings: string[] = []
  // En un día libre, solo el dato del sitio: si ese día cierra.
  if (freeDay && place && dateIso && placeHoursOnDate(place.hours_data, dateIso)?.closed) warnings.push('Ese día está cerrado.')
  if (!freeDay && draft && place && day) {
    const start = parseTimeToMinutes(time)
    // Con fechas, el horario de ese día y de esa época (el mismo cálculo que el motor); sin fechas, el general.
    const onDate = dateIso ? placeHoursOnDate(place.hours_data, dateIso) : null
    const schedule = onDate ? onDate.schedule : place.schedule
    const sessions = formatDaySessions(schedule)
    const closedToday = onDate ? onDate.closed : dateIso ? closedWeekdaysFromSchedule(schedule).includes(new Date(`${dateIso}T00:00:00`).getDay()) : false
    const closing = parseClosingMinutes(schedule)
    if (closedToday) warnings.push('Ese día está cerrado.')
    else if (!Number.isNaN(start) && sessions && (nextOpenMinutes(schedule, start) !== start || (closing !== null && start + minutes > closing))) {
      warnings.push(`A esa hora está cerrado: abre de ${sessions.replace(/–/g, ' a ').replace(/\b0(\d):/g, '$1:')}.`)
    }
    const end = start + minutes
    const clash = day.stops.find((stop) => {
      const other = parseTimeToMinutes(stop.time)
      return !stop.isNightExperience && !Number.isNaN(other) && start < other + stop.durationMinutes && other < end
    })
    if (clash) {
      const from = parseTimeToMinutes(clash.time)
      warnings.push(`Se pisa con ${clash.name} (${clash.time}–${minutesToTime(from + clash.durationMinutes)}).`)
    }
  }
  const bookingNote = place && !isRestaurant ? (place.booking_note ?? (place.reservation ? 'Se entra con reserva.' : null)) : null

  const name = item.kind === 'excursion' ? item.excursion.title : item.place.name

  const confirm = () => {
    if (!day) return
    if (item.kind === 'excursion') {
      addExcursionToDay(day.id, item.excursion)
      onAdded({ dayId: day.id, stopId: null })
      return
    }
    if (isRestaurant) {
      setMealRestaurant(day.id, meal, { name: item.place.name, coordinates: item.place.coordinates, zone: item.place.zone_label ?? null })
      onAdded({ dayId: day.id, stopId: null })
      return
    }
    if (!draft) return
    const stop = { ...draft, durationMinutes: Math.max(5, minutes) }
    addPlaceToDay(day.id, stop, freeDay ? null : time)
    onAdded({ dayId: day.id, stopId: stop.id })
  }

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-end justify-center md:items-center" role="dialog" aria-modal="true" aria-labelledby="add-to-day-heading">
      <div className="trazo-notice-backdrop absolute inset-0 bg-text/25 backdrop-blur-[6px]" onClick={onClose} />
      <div className="trazo-notice-panel relative flex max-h-[88dvh] w-full flex-col rounded-t-[28px] bg-bg-card shadow-[0_-8px_40px_-12px_rgba(28,34,48,.35)] md:w-[440px] md:rounded-[28px]">
        <div className="flex shrink-0 justify-center pt-2.5" aria-hidden="true">
          <span className="h-1 w-[42px] rounded-full bg-text/20" />
        </div>
        <button type="button" onClick={onClose} aria-label="Cerrar" className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full text-text-soft hover:bg-bg-hover">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
        <div className="overflow-y-auto px-6 pt-4">
          <p className="max-w-[calc(100%-2.5rem)] font-mono text-[10.5px] font-medium uppercase tracking-[.12em] text-accent">{name}</p>
          <h2 id="add-to-day-heading" className="mt-1.5 font-display text-[26px] leading-[1.15] text-text">
            {item.kind === 'excursion' ? '¿A qué día la añades?' : '¿A qué día lo añades?'}
          </h2>

          <div className="mt-4 flex flex-col gap-1.5">
            {days.map((candidate) => {
              const reason = blockedReason(item, candidate)
              const active = candidate.id === dayId
              return (
                <button
                  key={candidate.id}
                  type="button"
                  disabled={Boolean(reason)}
                  onClick={() => setDayId(candidate.id)}
                  className={`rounded-2xl border px-3.5 py-2.5 text-left transition-colors disabled:cursor-not-allowed ${active ? 'border-accent bg-accent-soft' : 'border-text/[.12] hover:bg-bg-hover'} ${reason ? 'opacity-50' : ''}`}
                >
                  <span className="block text-[14px] font-medium text-text">{dayOptionLabel(route, candidate)}</span>
                  {reason && <span className="block text-[12px] text-text-muted">{reason}</span>}
                </button>
              )
            })}
          </div>

          {isRestaurant && (
            <div className="mt-5 flex gap-2">
              {(['lunch', 'dinner'] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setMeal(option)}
                  className={`h-11 flex-1 rounded-full border text-[14px] font-medium transition-colors ${meal === option ? 'border-accent bg-accent-soft text-text' : 'border-text/15 text-text hover:bg-bg-hover'}`}
                >
                  {option === 'lunch' ? 'Para comer' : 'Para cenar'}
                </button>
              ))}
            </div>
          )}

          {draft && day && (
            <div className="mt-5 space-y-4">
              {!freeDay && (
                <label className="block">
                  <span className="block text-[14px] font-semibold text-text">Hora</span>
                  <input type="time" value={time} onChange={(event) => setTime(event.target.value)} className="mt-1.5 h-12 w-full rounded-xl border border-text/15 bg-bg px-3.5 text-[15px] text-text" />
                </label>
              )}
              <label className="block">
                <span className="block text-[14px] font-semibold text-text">Minutos</span>
                <span className="mt-0.5 block text-[12.5px] text-text-muted">¿Cuánto tiempo quieres visitarlo?</span>
                <input type="number" inputMode="numeric" min={5} step={5} value={minutes} onChange={(event) => setMinutes(Number(event.target.value) || 0)} className="mt-1.5 h-12 w-full rounded-xl border border-text/15 bg-bg px-3.5 text-[15px] text-text" />
              </label>
            </div>
          )}

          {(warnings.length > 0 || bookingNote) && (
            <div className="mt-3 space-y-1">
              {warnings.map((warning) => (
                <p key={warning} className="text-[12.5px] leading-snug text-accent-red">
                  {warning}
                </p>
              ))}
              {bookingNote && <p className="text-[12.5px] leading-snug text-text-soft">{bookingNote}</p>}
            </div>
          )}
        </div>

        <div className="px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">
          <button
            type="button"
            disabled={!day}
            onClick={confirm}
            className="h-12 w-full rounded-full bg-text text-[15px] font-medium text-bg transition-transform active:scale-[.98] disabled:opacity-40"
          >
            {day ? `Añadir al Día ${day.dayNumber}` : 'Ningún día libre para esto'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
