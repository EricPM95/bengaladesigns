import { useEffect, useMemo, useState } from 'react'
import type { DayPlan, Excursion, Route, Stop } from '../../../lib/types'
import type { DestinationPlace } from '../../../lib/destinationPlacesApi'
import { fetchPlacePhoto } from '../../../lib/placePhoto'
import { hasFullDayExcursion, isEmptyDay } from '../../../lib/freeDays'
import { useRouteStore } from '../../../store/useRouteStore'
import { alDia, diaConFecha, ElDia, fechaDelDia } from '../../../lib/nombreDeDia'
import { tituloSimpleDelDia } from '../../../lib/tituloDelDia'
import { cierraElSitio } from '../../../lib/articulos'
import { mejorHuecoEnElDia } from '../../../lib/mejorHueco'
import { placeholderPhoto, stopFromPlace } from '../placeExplorer/PlaceExplorerScreen'
import { HojaDia, filasDeDias } from '../../ui/HojaDia'
import { ponerParadaEnElDia } from '../../../lib/cambiarParada'
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

/**
 * Por qué no se puede elegir ese día (null = se puede). (10N8, 3g) Al AÑADIR un sitio nunca se bloquea un día: no se mueve ningún día entero. Solo el día entero de una excursión (no hay paradas donde ponerlo) y, para una
 * excursión (que SÍ convierte el día entero), un día que ya tiene cosas. Y poder tener el mismo sitio dos veces: ya no se dice «Ya lo tienes ese día».
 */
export function blockedReason(route: Route, item: AddItem, day: DayPlan): string | null {
  if (hasFullDayExcursion(day)) return `${ElDia(route, day.dayNumber)} es el día de tu excursión.`
  if (item.kind === 'excursion') return isEmptyDay(day) ? null : 'Este día ya tiene cosas.'
  return null
}

/**
 * La ventana de "+ Añadir" (decisión del usuario, 2026-09-28): a qué día. Desde la Tanda 10O ya no pide la hora ni los minutos: la app lo coloca ese día (10N8, 3f: sin pase, de primero; con pase, donde mejor
 * encaja: `dondeQueda`). Es la hoja de elegir día de la app (`HojaDia`, `Piezas/Hoja Dia` 03). Si ese día cierra, lo dice debajo de la lista con un aviso en rojo (sin botones ni bloqueo). Nunca se niega nada.
 */
export function AddToDaySheet({ route, item, initialDayId, onClose, onAdded }: AddToDaySheetProps) {
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
  // (Tanda 10O2: ya no se pregunta cuánto se tarda en verlo: el tiempo de cada sitio es su `duration_minutes` de roma.json, que la app usa por dentro.)
  const minutes = Math.max(5, draft?.durationMinutes ?? 60)

  // Si ese día el sitio cierra (Tanda 10O): la línea roja de la 10N4, sin bloquear nada.
  const dateIso = day ? fechaDelDia(route, day.dayNumber) : null
  const colocacion = useMemo(() => (day && draft && place && !isRestaurant ? mejorHuecoEnElDia(day, draft, place, dateIso, minutes) : null), [day, draft, place, isRestaurant, dateIso, minutes])
  const warnings: string[] = []
  if (colocacion?.cierra && place && day) warnings.push(`${ElDia(route, day.dayNumber)} ${cierraElSitio(place.name)}.`)
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

  /** Lo añade a ese día donde dice `dondeQueda` (10N8, 3f), sin la franja de otro día. */
  const anadirAlDia = (destino: DayPlan) => {
    if (!draft || !place) return
    const stop = { ...draft, durationMinutes: minutes, addedByUser: true }
    ponerParadaEnElDia(destino.id, stop)
    onAdded({ dayId: destino.id, stopId: stop.id })
  }

  return (
    <HojaDia
      etiqueta={name}
      titulo={item.kind === 'excursion' ? '¿A qué día la añadimos?' : '¿A qué día lo añadimos?'}
      filas={filasDeDias(route, days, (candidate) => blockedReason(route, item, candidate))}
      elegido={dayId}
      onElegir={setDayId}
      boton={day ? `Añadir ${alDia(route, day.dayNumber)}` : 'Ningún día libre para esto'}
      onConfirmar={confirm}
      onCerrar={onClose}
      datos="add-to-day"
    >
      {isRestaurant && (
        <div className="flex gap-2">
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
      {(warnings.length > 0 || bookingNote) && (
        <div className="space-y-1">
          {warnings.map((warning) => (
            <p key={warning} data-aviso-cierra="1" className="text-[12.5px] leading-snug text-accent-red">
              {warning}
            </p>
          ))}
          {bookingNote && <p className="text-[12.5px] leading-snug text-text-soft">{bookingNote}</p>}
        </div>
      )}
      {/* Una excursión que no cabe en ningún día (Tanda 6y10): debajo, las dos salidas, cada una con su «Deshacer». */}
      {item.kind === 'excursion' && !firstFree && <ExcursionSinHueco route={route} excursion={item.excursion} onClose={onClose} />}
    </HojaDia>
  )
}
