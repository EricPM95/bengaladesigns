import { useEffect } from 'react'
import { useRouteStore } from '../store/useRouteStore'
import { useAvisosVueloStore } from '../store/useAvisosVueloStore'
import { datosParaMotor } from '../lib/llegadaVuelta'
import { fetchArrivalInfo } from '../lib/arrivalReturn'
import { reservasParaMotor } from '../lib/engineReservas'
import { pagoActivo } from '../lib/pago'
import type { Reservation } from '../lib/bookings'
import type { Route } from '../lib/types'

/**
 * Pregunta a los motores (Tanda 7, punto 14) qué reservas del viajero no cuadran con su hora de llegada o de vuelta, y deja los avisos en `useAvisosVueloStore` para la campana. Se vuelve a preguntar
 * cuando cambia lo que importa: una reserva (o su hora o su día), la hora o el punto de la llegada o de la vuelta, la zona, las fechas o el medio. «Gana el último»: lo que tarde más que una pregunta
 * posterior se ignora. Solo de pago; en la gratis, sin vuelos puestos o sin ruta, no hay avisos. La ruta a mano también los tiene: no rehace ningún día, pero sus reservas se comparan con el vuelo.
 * No hay Claude en esto, ni se devuelve ningún día.
 */
export function claveDeLosAvisos(route: Route | null, reservations: Reservation[]): string {
  if (!route) return ''
  return JSON.stringify({
    d: route.destination,
    m: route.planMode ?? 'auto',
    a: [route.arrivalFlightTime ?? null, route.arrivalPointId ?? null],
    v: [route.departureFlightTime ?? null, route.departurePointId ?? null, route.returnTransportOptionId ?? null],
    t: route.transportContext?.transport_option?.id ?? null,
    z: route.accommodationZone ?? null,
    r: route.answers.dateRange ?? null,
    n: [route.answers.days ?? null, route.days.length],
    res: reservations.map((reserva) => [reserva.kind, reserva.refId, reserva.dateIso, reserva.dayNumber, reserva.time, reserva.returnTime ?? null, reserva.noMueve ?? false]),
  })
}

export function useAvisosDeVuelo(): void {
  const route = useRouteStore((state) => state.route)
  const reservations = useRouteStore((state) => state.reservations)
  const clave = claveDeLosAvisos(route, reservations)

  useEffect(() => {
    const { poner, vaciar } = useAvisosVueloStore.getState()
    if (!clave || !pagoActivo()) {
      vaciar()
      return
    }
    let vivo = true
    const temporizador = window.setTimeout(async () => {
      const estado = useRouteStore.getState()
      const ruta = estado.route
      if (!ruta) return vaciar()
      const info = await fetchArrivalInfo(ruta.destination).catch(() => null)
      const datos = datosParaMotor(ruta, estado.reservations, info, { paraAvisos: true })
      if (!datos.llegada && !datos.vuelta) return vivo ? vaciar() : undefined
      try {
        const respuesta = await fetch('/api/avisos-de-vuelo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            destination: ruta.destination,
            answers: ruta.answers,
            all_days: ruta.days.filter((day) => !day.isReturnLeg).map((day) => ({ day_number: day.dayNumber, city: day.city })),
            must_include_places: ruta.mustIncludePlaces ?? [],
            inside_names: ruta.insideNames ?? [],
            reservas: reservasParaMotor(estado.reservations),
            ...datos,
          }),
        })
        if (!vivo) return
        if (!respuesta.ok) return vaciar()
        const cuerpo = (await respuesta.json()) as { llegada?: unknown; vuelta?: unknown }
        if (!vivo) return
        poner({ llegada: Array.isArray(cuerpo.llegada) ? cuerpo.llegada : [], vuelta: Array.isArray(cuerpo.vuelta) ? cuerpo.vuelta : [] })
      } catch {
        // Sin respuesta: sin avisos (nunca se inventa uno).
        if (vivo) vaciar()
      }
    }, 350)
    return () => {
      vivo = false
      window.clearTimeout(temporizador)
    }
  }, [clave])
}
