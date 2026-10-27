import type { Route } from '../../../lib/types'
import { isManualRoute } from '../../../lib/manualPlan'
import { useRouteStore } from '../../../store/useRouteStore'
import { useDestinationPool } from '../../../lib/useDestinationPool'
import { FREE_TOUR_REF } from '../../../lib/freeTourManual'
import { AddReservationSheet } from './AddReservationSheet'

import { FreeTourDiaSheet } from './FreeTourDiaSheet'

/** ¿La ruta ya lleva un Free Tour? Sirve para enseñar «Añadido» y ofrecer quitarlo. */
export function routeHasFreeTour(route: Route): boolean {
  return route.days.some((day) => day.stops.some((stop) => stop.isFreeTour)) || Boolean(route.answers.freeTourDespues) || (route.answers.experiencesPositive ?? []).includes('free_tour')
}

/** El Free Tour solo se ofrece en destinos con días escritos y con al menos 2 días de ciudad (el de 1 día no lo lleva). */
export function freeTourAvailable(route: Route): boolean {
  // Ruta a mano (Tanda 6y2): el Free Tour se añade como una reserva más, en cualquier día de ciudad; no hace falta que haya días escritos.
  if (isManualRoute(route)) return route.days.some((day) => !day.isReturnLeg)
  return route.days.filter((day) => !day.isReturnLeg && day.curatedId).length >= 2
}

/**
 * «Free Tour» desde EXPLORAR, su ficha y «+ Añadir parada»: (10N5) pregunta el DÍA («¿A qué día lo añadimos?», `FreeTourDiaSheet`), no la hora; el Free Tour queda a la hora de nuestro día escrito.
 * En una ruta a mano, la hoja de reservas de siempre (AddReservationSheet).
 */
export function FreeTourSheet({ route, onClose }: { route: Route; onClose: () => void }) {
  return isManualRoute(route) ? <FreeTourComoReserva route={route} onClose={onClose} /> : <FreeTourDiaSheet route={route} onClose={onClose} />
}

/**
 * El Free Tour en una ruta a mano (Tanda 6y2, pregunta 6): sin motor que rehaga días, se añade como cualquier reserva —la misma hoja de «Entrada · elige día y hora»— y va al día de su fecha como una parada más, con su hora y sin precio.
 * Si el viaje ya lleva su reserva del Free Tour, la hoja sale con ella para cambiarla o quitarla.
 */
function FreeTourComoReserva({ route, onClose }: { route: Route; onClose: () => void }) {
  const reservations = useRouteStore((state) => state.reservations)
  const { freeTourEntry, resolved } = useDestinationPool(route.destination, true)
  if (!resolved) return null
  const nombre = freeTourEntry?.name ?? 'Free Tour'
  const existing = reservations.find((item) => item.kind === 'entrada' && item.refId === FREE_TOUR_REF) ?? null
  const currentDay = route.days.find((day) => day.stops.some((stop) => stop.isFreeTour)) ?? null
  return <AddReservationSheet route={route} target={{ kind: 'entrada', refId: FREE_TOUR_REF, name: nombre, placeNames: [nombre], currentDayId: currentDay?.id ?? null, existing }} onClose={onClose} />
}
