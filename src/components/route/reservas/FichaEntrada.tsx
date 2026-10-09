import { createPortal } from 'react-dom'
import type { Route } from '../../../lib/types'
import { dateOfDay, type BloqueEntrada } from '../../../lib/bookings'
import { resolveDisplayStops, type MockStopDetail } from '../../../lib/mockDayDetail'
import { useDestinationPool } from '../../../lib/useDestinationPool'
import { StopDetailSheet, type DayStopRef } from '../dayDetail/StopDetailSheet'

/**
 * La ficha del sitio de una entrada, abierta en su pestaña «Entradas» (la de la 6n: Resumen · Entradas · Tips), donde están todas sus entradas con su [Reservar] (Tanda 6v). Es lo mismo que hace
 * la pestañita naranja de la tarjeta en DÍAS. Si el sitio va en la ruta del viajero, es su parada de verdad (con su día); si no (las de «Ver más»), un lugar del destino sin día. El Free Tour es su propia parada.
 * Va en el body (como las fichas de DÍAS): dentro del panel de RESERVAS quedaría por debajo de la cabecera de la app.
 */
export function FichaEntrada({ route, item, onClose }: { route: Route; item: BloqueEntrada; onClose: () => void }) {
  const { places } = useDestinationPool(route.destination, true)
  const nombre = item.isFreeTour ? item.name : item.placeNames[0]
  // La parada de la ruta: la que cubre la entrada (por dentro) o, en el Free Tour, la del Free Tour.
  const enRuta = route.days
    .flatMap((day) => day.stops.map((stop) => ({ day, stop })))
    .find(({ stop }) => !stop.passThrough && (item.isFreeTour ? stop.isFreeTour : item.placeNames.includes(stop.name) && !stop.isFreeTour && stop.visitMode !== 'fuera'))
  const lugar = places.find((place) => place.name === nombre) ?? null
  const parada: MockStopDetail = enRuta
    ? (resolveDisplayStops(enRuta.day).find((candidate) => candidate.id === enRuta.stop.id) as MockStopDetail)
    : {
        id: `entrada-${nombre}`,
        name: nombre,
        category: item.isFreeTour ? 'Free Tour' : (lugar?.type ?? 'Lugar'),
        hours: lugar?.schedule ?? null,
        hoursCard: lugar?.hours_card ?? null,
        reservation: lugar?.reservation ?? null,
        ticketInfo: lugar?.ticket_info ?? null,
        durationMinutes: lugar?.duration_min ?? (item.isFreeTour ? 150 : 60),
        photoUrl: '',
        description: '',
        tips: [],
        purchase: null,
        ...(item.isFreeTour ? { isFreeTour: true } : {}),
      }
  const dayStops: DayStopRef[] = enRuta
    ? enRuta.day.stops.filter((stop) => !stop.passThrough).map((stop) => ({ id: stop.id, name: stop.name, coordinates: stop.coordinates, photoUrl: stop.photoUrl || undefined }))
    : lugar
      ? [{ id: parada.id, name: parada.name, coordinates: lugar.coordinates }]
      : []
  return createPortal(
    <StopDetailSheet
      stop={parada}
      initialTab="tickets"
      city={enRuta?.day.city ?? route.days[0]?.city ?? route.destination}
      dayNumber={enRuta?.day.dayNumber ?? null}
      dateIso={enRuta ? dateOfDay(route, enRuta.day) : null}
      dayStops={dayStops}
      isAnchor={false}
      onClose={onClose}
    />,
    document.body,
  )
}
