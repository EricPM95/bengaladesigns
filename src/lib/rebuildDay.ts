import { mapSingleGeneratedDay, type GeneratedDay } from './mapGeneratedRoute'
import { enrichRoutePhotos } from './placePhoto'
import { reservasParaMotor } from './engineReservas'

/**
 * «Prefiero quedarme en Roma» → «Organízame este día» (Tanda 3): el día de excursión pasa a ser el día de ciudad escrito que toca (D6 en 5 días, D7 en 6). El servidor monta el día con el
 * viaje sin excursión (los demás días se quedan como están) y el viaje se acuerda de que ya no lleva excursión. Devuelve false si no se pudo (sin conexión o sin respuesta).
 */
export async function organizarDiaEnCiudad(dayId: string): Promise<boolean> {
  const { useRouteStore } = await import('../store/useRouteStore')
  const { route, reservations } = useRouteStore.getState()
  const day = route?.days.find((other) => other.id === dayId)
  if (!route || !day) return false
  try {
    const response = await fetch('/api/rebuild-day', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        destination: route.destination,
        answers: { ...route.answers, sinExcursion: true },
        all_days: route.days.filter((other) => !other.isReturnLeg).map((other) => ({ day_number: other.dayNumber, city: other.city })),
        day_number: day.dayNumber,
        must_include_places: route.mustIncludePlaces ?? [],
        inside_names: route.insideNames ?? [],
        reservas: reservasParaMotor(reservations),
      }),
    })
    if (!response.ok) return false
    const body = (await response.json()) as { day?: GeneratedDay }
    if (!body.day) return false
    const next = mapSingleGeneratedDay(route.destination, body.day, day)
    await enrichRoutePhotos({ ...route, days: [next] }).catch(() => {})
    useRouteStore.getState().replaceExcursionWithCityDay(dayId, next)
    return true
  } catch {
    return false
  }
}

/**
 * Rehace un día con las reservas del viajero (5-oct-2026): el motor corre las horas con los márgenes alrededor de la hora que puso.
 * Un día que el viajero ya ha cambiado a mano no se toca (lo suyo manda; la reserva ya se coloca en su sitio). Sin conexión o en un
 * destino sin días escritos, no hace nada y el día se queda como está.
 */
export async function rehacerDiaConReservas(dayId: string): Promise<void> {
  const { useRouteStore } = await import('../store/useRouteStore')
  const { route, reservations } = useRouteStore.getState()
  const day = route?.days.find((other) => other.id === dayId)
  if (!route || !day || day.originalSnapshot || day.isReturnLeg) return
  try {
    const response = await fetch('/api/rebuild-day', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        destination: route.destination,
        answers: route.answers,
        all_days: route.days.filter((other) => !other.isReturnLeg).map((other) => ({ day_number: other.dayNumber, city: other.city })),
        day_number: day.dayNumber,
        must_include_places: route.mustIncludePlaces ?? [],
        inside_names: route.insideNames ?? [],
        reservas: reservasParaMotor(reservations),
      }),
    })
    if (!response.ok) return
    const body = (await response.json()) as { day?: GeneratedDay }
    if (!body.day) return
    const next = mapSingleGeneratedDay(route.destination, body.day, day)
    await enrichRoutePhotos({ ...route, days: [next] }).catch(() => {})
    // (El viajero pudo tocar el día mientras llegaba la respuesta: entonces no se pisa.)
    const actual = useRouteStore.getState().route?.days.find((other) => other.id === dayId)
    if (!actual || actual.originalSnapshot) return
    useRouteStore.getState().replaceDayRebuilt(dayId, next)
  } catch {
    // Sin respuesta del servidor: el día se queda como está.
  }
}
