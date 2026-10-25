import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import type { DayPlan, Excursion, Route, Stop } from '../../../lib/types'
import type { DestinationPlace } from '../../../lib/destinationPlacesApi'
import { fetchPlacePhoto } from '../../../lib/placePhoto'
import { hasFullDayExcursion, isEmptyDay, isFreeDay } from '../../../lib/freeDays'
import { useRouteStore } from '../../../store/useRouteStore'
import { alDia, diaConFecha, ElDia, elDia, fechaDelDia, tieneFechas, tuDia } from '../../../lib/nombreDeDia'
import { tituloSimpleDelDia } from '../../../lib/tituloDelDia'
import { elSitio } from '../../../lib/articulos'
import { mejorHuecoEnElDia, otroDiaAbierto } from '../../../lib/mejorHueco'
import { placeholderPhoto, stopFromPlace } from '../placeExplorer/PlaceExplorerScreen'
import { Icono } from '../../ui/Icono'
import { ExcursionSinHueco } from '../excursions/ExcursionSinHueco'

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

/** El nombre del día (tanda 6y7: el mismo que en DÍAS y HOY, ver src/lib/tituloDelDia.ts). */
export const dayName = (route: Route, day: DayPlan): string => tituloSimpleDelDia(route, day)

/** «Jue 26 Nov · Roma antigua y Centro histórico»; sin fechas, «Día 3 · Compras» (Tanda 10O: el día de la semana y el mes con mayúscula; con fechas el día se llama por su fecha: tanda 6z3, punto 5). */
export function dayOptionLabel(route: Route, day: DayPlan): string {
  return [diaConFecha(route, day.dayNumber), dayName(route, day)].filter(Boolean).join(' · ')
}

/** Por qué no se puede elegir ese día (null = se puede). */
function blockedReason(route: Route, item: AddItem, day: DayPlan): string | null {
  if (hasFullDayExcursion(day)) return 'Tiene una excursión de día entero'
  if (item.kind === 'excursion') return isEmptyDay(day) ? null : 'Este día ya tiene cosas'
  if (item.place.kind !== 'restaurant' && day.stops.some((stop) => stop.name === item.place.name)) return tieneFechas(route) ? `Ya lo tienes ${elDia(route, day.dayNumber)}` : `En ${tuDia(route, day.dayNumber)}`
  return null
}

/**
 * La ventana de "+ Añadir" (decisión del usuario, 2026-09-28): a qué día y cuántos minutos. Desde la Tanda 10O ya no pide la hora: la app lo coloca ese día donde mejor encaje (donde menos
 * hay que andar de más, y con el sitio abierto: `mejorHuecoEnElDia`). Si ese día cierra, lo dice en la misma hoja y propone el siguiente en que abre. Nunca se niega nada.
 */
export function AddToDaySheet({ route, item, initialDayId, onClose, onAdded }: AddToDaySheetProps) {
  const addPlaceToDay = useRouteStore((state) => state.addPlaceToDay)
  const insertStopAt = useRouteStore((state) => state.insertStopAt)
  const setMealRestaurant = useRouteStore((state) => state.setMealRestaurant)
  const addExcursionToDay = useRouteStore((state) => state.addExcursionToDay)

  const days = route.days.filter((day) => !day.isReturnLeg)
  const firstFree = days.find((day) => !blockedReason(route, item, day))
  const [dayId, setDayId] = useState<string | null>(
    initialDayId && days.some((day) => day.id === initialDayId && !blockedReason(route, item, day)) ? initialDayId : (firstFree?.id ?? null),
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
  const [minutes, setMinutes] = useState(draft?.durationMinutes ?? 60)

  // Dónde lo pone la app ese día y si ese día cierra (Tanda 10O).
  const dateIso = day ? fechaDelDia(route, day.dayNumber) : null
  const colocacion = useMemo(() => (day && draft && place && !isRestaurant ? mejorHuecoEnElDia(day, draft, place, dateIso, Math.max(5, minutes)) : null), [day, draft, place, isRestaurant, dateIso, minutes])
  const otroDia = useMemo(() => (colocacion?.cierra && day && draft && place ? otroDiaAbierto(route, day, draft, place, Math.max(5, minutes)) : null), [colocacion, day, draft, place, route, minutes])
  const warnings: string[] = []
  // Cierra ese día y no hay otro día mejor: se dice y se puede añadir igual.
  if (colocacion?.cierra && !otroDia && place && day) warnings.push(`${ElDia(route, day.dayNumber)} ${elSitio(place.name)} cierra.`)
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
    anadirAlDia(day)
  }

  /** Lo añade a ese día en su mejor hueco: entre las paradas, donde menos hay que andar de más y con el sitio abierto (Tanda 10O). */
  const anadirAlDia = (destino: DayPlan) => {
    if (!draft || !place) return
    const stop = { ...draft, durationMinutes: Math.max(5, minutes), addedByUser: true }
    if (isFreeDay(destino)) addPlaceToDay(destino.id, stop, null)
    else insertStopAt(destino.id, mejorHuecoEnElDia(destino, stop, place, fechaDelDia(route, destino.dayNumber), stop.durationMinutes).hueco.indice, stop)
    onAdded({ dayId: destino.id, stopId: stop.id })
  }

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-end justify-center md:items-center" role="dialog" aria-modal="true" aria-labelledby="add-to-day-heading">
      <div className="trazo-notice-backdrop absolute inset-0 bg-text/25 backdrop-blur-[6px]" onClick={onClose} />
      <div className="trazo-notice-panel relative flex max-h-[88dvh] w-full flex-col rounded-t-[28px] bg-bg-card shadow-[0_-8px_40px_-12px_rgba(28,34,48,.35)] md:w-[440px] md:rounded-[28px]">
        <div className="flex shrink-0 justify-center pt-2.5" aria-hidden="true">
          <span className="h-1 w-[42px] rounded-full bg-text/20" />
        </div>
        <button type="button" onClick={onClose} aria-label="Cerrar" className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full text-text-soft hover:bg-bg-hover">
          <Icono nombre="cerrar" className="h-5 w-5" />
        </button>
        <div className="overflow-y-auto px-6 pt-4">
          <p className="max-w-[calc(100%-2.5rem)] font-mono text-[10.5px] font-medium uppercase tracking-[.12em] text-accent">{name}</p>
          <h2 id="add-to-day-heading" className="mt-1.5 font-display text-[26px] leading-[1.15] text-text">
            {item.kind === 'excursion' ? '¿A qué día la añadimos?' : '¿A qué día lo añadimos?'}
          </h2>

          <div className="mt-4 flex flex-col gap-1.5">
            {days.map((candidate) => {
              const reason = blockedReason(route, item, candidate)
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
                  className={`h-11 flex-1 rounded-full border text-[14px] font-medium transition-colors ${meal === option ? 'border-text bg-text text-white' : 'border-text/15 text-text hover:bg-bg-hover'}`}
                >
                  {option === 'lunch' ? 'Para comer' : 'Para cenar'}
                </button>
              ))}
            </div>
          )}

          {draft && day && (
            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="block text-[14px] font-semibold text-text">Minutos</span>
                <span className="mt-0.5 block text-[12.5px] text-text-muted">¿Cuánto tiempo quieres visitarlo?</span>
                <input type="number" inputMode="numeric" min={5} step={5} value={minutes} onChange={(event) => setMinutes(Number(event.target.value) || 0)} className="mt-1.5 h-12 w-full rounded-xl border border-text/15 bg-bg px-3.5 text-[15px] text-text" />
              </label>
            </div>
          )}

          {colocacion?.cierra && otroDia && place && day && (
            <div data-aviso-cierra="1" className="mt-3 space-y-2 rounded-2xl border border-text/[.12] bg-bg p-3.5">
              <p className="text-[13.5px] leading-snug text-text">
                {ElDia(route, day.dayNumber)} {elSitio(place.name)} cierra. ¿Lo ponemos {elDia(route, otroDia.day.dayNumber)}?
              </p>
              <button type="button" data-poner-otro-dia="1" onClick={() => anadirAlDia(otroDia.day)} className="h-11 w-full rounded-full btn-champan text-[14px] font-medium transition-transform active:scale-[.98]">
                Ponerlo {elDia(route, otroDia.day.dayNumber)}
              </button>
              <button type="button" data-dejarlo-igual="1" onClick={confirm} className="h-11 w-full rounded-full border border-text/15 text-[14px] font-medium text-text transition-colors hover:bg-bg-hover">
                Dejarlo {elDia(route, day.dayNumber)} igual
              </button>
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
          {!(colocacion?.cierra && otroDia) && (
            <button
              type="button"
              disabled={!day}
              onClick={confirm}
              className="h-12 w-full rounded-full btn-champan text-[15px] font-medium transition-transform active:scale-[.98] disabled:opacity-40"
            >
              {day ? `Añadir ${alDia(route, day.dayNumber)}` : 'Ningún día libre para esto'}
            </button>
          )}
          {/* Una excursión que no cabe en ningún día (Tanda 6y10): debajo, las dos salidas, cada una con su «Deshacer». */}
          {item.kind === 'excursion' && !firstFree && <ExcursionSinHueco route={route} excursion={item.excursion} onClose={onClose} />}
        </div>
      </div>
    </div>,
    document.body,
  )
}
