import { mapSingleGeneratedDay, type GeneratedDay } from './mapGeneratedRoute'
import { enrichRoutePhotos } from './placePhoto'
import { reservasParaMotor } from './engineReservas'

/**
 * Añade (o quita) el Free Tour desde la app (Tanda 6f, 5): el viaje se acuerda de la franja y cada día de ciudad se rehace con las reglas de siempre
 * (D3, D1-FT o DM-medio con Free Tour; los días normales sin él). Un día que el viajero ya cambió a mano no se toca. Devuelve false si no se pudo.
 */
export async function aplicarFreeTour(choice: { franja: 'manana' | 'tarde' | 'noche'; hora: string } | null): Promise<boolean> {
  const { useRouteStore } = await import('../store/useRouteStore')
  const antes = useRouteStore.getState().route
  if (!antes) return false
  useRouteStore.getState().setFreeTourChoice(choice)
  return rehacerDiasSinTocar(null)
}

/**
 * Rehace cada día de ciudad con lo que el viaje recuerda ahora (el Free Tour, el interruptor del día 4…): lo que el viajero ya ha cambiado a mano, la excursión, un día suyo y los días
 * que ha añadido no se tocan. `except`: los días que ya vienen rehechos. Devuelve false si algún día no se pudo rehacer (sin conexión o sin respuesta).
 */
export async function rehacerDiasSinTocar(except: string | string[] | null): Promise<boolean> {
  const exceptIds = new Set([except].flat().filter((id): id is string => Boolean(id)))
  const { useRouteStore } = await import('../store/useRouteStore')
  const { route, reservations } = useRouteStore.getState()
  if (!route) return false
  const cityDays = route.days.filter((day) => !day.isReturnLeg)
  let ok = true
  for (const day of cityDays) {
    if (exceptIds.has(day.id) || day.originalSnapshot || day.dayType === 'excursion' || day.userAdded || day.ownDay) continue
    try {
      const response = await fetch('/api/rebuild-day', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: route.destination,
          answers: useRouteStore.getState().route?.answers ?? route.answers,
          all_days: cityDays.map((other) => ({ day_number: other.dayNumber, city: other.city })),
          day_number: day.dayNumber,
          must_include_places: route.mustIncludePlaces ?? [],
          inside_names: route.insideNames ?? [],
          reservas: reservasParaMotor(reservations),
        }),
      })
      if (!response.ok) {
        ok = false
        continue
      }
      const body = (await response.json()) as { day?: GeneratedDay }
      if (!body.day) {
        ok = false
        continue
      }
      const next = mapSingleGeneratedDay(route.destination, body.day, day)
      await enrichRoutePhotos({ ...route, days: [next] }).catch(() => {})
      const actual = useRouteStore.getState().route?.days.find((other) => other.id === day.id)
      if (!actual || actual.originalSnapshot) continue
      useRouteStore.getState().replaceDayRebuilt(day.id, next)
    } catch {
      ok = false
    }
  }
  return ok
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
