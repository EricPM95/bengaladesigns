import type { Reservation } from '../../../lib/bookings'
import { entranceTargetFor } from '../../../lib/bookings'
import { useDestinationExcursions } from '../../../lib/destinationExcursions'
import type { StopEntrada } from '../../../lib/types'
import { useRouteStore } from '../../../store/useRouteStore'
import type { ReservationTarget } from './AddReservationSheet'
import { useEntradasDelGrupo } from '../../../hooks/useEntradasDelGrupo'
import { cubreElSitio, porCuando, cuantosLaTienen as contar, meCubre, quienesLaTienen, textoLaTienen } from '../../../lib/entradasDelGrupo'

/** La clave del Free Tour en `_entradas.json` y el `refId` de su reserva. */
export const FREE_TOUR_KEY = 'Free Tour'

export interface StopEntradas {
  entradas: StopEntrada[]
  /** El sitio ya está en algún día del viaje (sin eso no se puede añadir la entrada: «Añádela» no sale). */
  inTrip: boolean
  /** La reserva que cubre este sitio (Coliseo y Foro comparten la misma). */
  reservation: Reservation | null
  /** La hora que se enseña: solo en el primer sitio de la entrada (el Coliseo); el Foro lleva el ✓ sin hora. */
  shownTime: string | null
  /** Lo que se abre en la hoja de la hora («Añádela» o «Cambiar»). */
  target: ReservationTarget
  /** Tanda 10N §8: la entrada que el dueño tiene para este sitio y que NO cubre a quien mira (su «Comprar entrada» lleva el día y la hora del dueño). */
  delGrupo: Reservation | null
  /** Quien mira ve la reserva del dueño porque le cubre («Reservada ✓» sin «Cambiar»: no es suya para cambiarla). */
  cubiertaPorElDueno: boolean
  /** Viaje de varias personas: la etiqueta de la parada es la corta («Reservada ✓» / «Comprar entrada»). */
  compartido: boolean
  nombreAdmin: string
  /** Tanda 10N4: cuántas personas del viaje tienen ya la entrada que tú no tienes (el numerito del botón de la parada). 0 si nadie, o si la tienes tú. */
  cuantosLaTienen: number
  /** (10N6 §1l) Lo mismo en palabras, en plural y con los nombres: «Eric y Ana la tienen para el jueves 12 · 9:15» o «Eric la tiene a las 9:15 · Ana a las 11:00». Vacío si no la tiene nadie más. */
  textoLaTienen: string
  /** (10N6 §1l) Lo mismo por separado (quiénes, día y hora): una sola fila = una sola hora. */
  laTienen: { nombres: string[]; dia: string; hora: string }[]
  /** (10N6 §1l) Quién reservó la que me cubre (o la del grupo): para «a la misma hora que …». */
  quienLaTiene: string
}

/**
 * Las entradas de un sitio y si están reservadas (Tanda 6n y 6o): la pestañita de la tarjeta de DÍAS y la pestaña «Entradas» de cualquier ficha (la de un día,
 * EXPLORAR o «+ Añadir parada») leen lo mismo de aquí, de las entradas del destino (`_entradas.json`). Null si los datos no dan entradas de ese sitio: sin
 * entradas, ni pestaña ni pestañita. El Free Tour es una entrada más (clave «Free Tour»).
 */
export function useStopEntradas(stop: { id: string; name: string; isFreeTour?: boolean } | null | undefined): StopEntradas | null {
  const route = useRouteStore((state) => state.route)
  const reservations = useRouteStore((state) => state.reservations)
  const info = useDestinationExcursions(route?.destination)
  const grupo = useEntradasDelGrupo()
  if (!stop || !route) return null
  const entradas = info.entradasPorSitio[stop.isFreeTour ? FREE_TOUR_KEY : stop.name]
  if (!entradas?.length) return null
  // En el viaje: la parada con ese id, o una con ese nombre (la ficha de EXPLORAR no tiene el id de la ruta). Lo «de paso» no es una visita.
  const day = route.days.find((candidate) => candidate.stops.some((item) => item.id === stop.id || (!item.passThrough && !item.isFreeTour === !stop.isFreeTour && item.name === stop.name))) ?? null
  const cubre = (item: Reservation) => cubreElSitio(item, stop)
  // (10N6 §1l) Las entradas se miran igual lo compre quien lo compre: la mía (la que reservé yo), la que me cubre (otro la reservó también para mí) y las de otros que no me cubren (azul con dorado).
  const delOtros = grupo.deOtros.filter((x) => cubre(x.reserva))
  const propia = grupo.esInvitado ? (grupo.mias.find(cubre) ?? null) : (reservations.find(cubre) ?? null)
  const cubiertaPor = !propia ? (delOtros.find((x) => meCubre(x, grupo.yoId)) ?? null) : null
  const cubiertaPorElDueno = cubiertaPor != null
  const reservation = propia ?? cubiertaPor?.reserva ?? null
  const sinMia = !propia && !cubiertaPor
  const noMeCubren = sinMia ? delOtros : []
  const delGrupo = noMeCubren[0]?.reserva ?? null
  const quienLaTiene = cubiertaPor ?? noMeCubren[0] ?? null
  const paraTexto = noMeCubren.map((x) => ({ nombres: grupo.nombresDe(x), reserva: x.reserva }))
  const base = reservation
    ? { refId: reservation.refId, name: reservation.name, placeNames: reservation.placeNames }
    : stop.isFreeTour
      ? { refId: FREE_TOUR_KEY, name: stop.name, placeNames: [stop.name] }
      : entranceTargetFor(stop.name, info.entradas)
  return {
    entradas,
    inTrip: day != null,
    reservation,
    shownTime: reservation && (stop.isFreeTour || reservation.placeNames[0] === stop.name) ? reservation.time : null,
    target: { kind: 'entrada', ...base, currentDayId: day?.id ?? null, existing: cubiertaPorElDueno ? null : reservation },
    delGrupo,
    cubiertaPorElDueno,
    compartido: grupo.compartido,
    nombreAdmin: grupo.nombreAdmin,
    cuantosLaTienen: contar(noMeCubren.map((x) => ({ nombres: quienesLaTienen(x) }))),
    laTienen: route ? porCuando(route, paraTexto) : [],
    textoLaTienen: route && paraTexto.length > 0 ? textoLaTienen(route, paraTexto) : '',
    quienLaTiene: quienLaTiene ? grupo.nombresDe(quienLaTiene).join(', ') : '',
  }
}
