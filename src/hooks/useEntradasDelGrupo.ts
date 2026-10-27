import { useEffect, useMemo } from 'react'
import { usePermisosDelViaje } from './usePermisosDelViaje'
import { useViajeCompartido, nombreDe, type Persona } from '../store/useViajeCompartido'
import { useSyncStore } from '../store/useSyncStore'
import { useMisReservas } from '../store/useMisReservas'
import { useRouteStore } from '../store/useRouteStore'
import { useLoSuyo } from '../store/useLoSuyo'
import type { Reservation } from '../lib/bookings'
import { esViajeCompartido, incluyeA } from '../lib/reservasGrupo'
import { meCubre, quienesLaTienen, todasLasEntradas, type EntradaDeAlguien } from '../lib/entradasDelGrupo'

/**
 * QUIÉN MIRA Y QUÉ ENTRADAS SON SUYAS (Tanda 10N §8; 10N6 §1l: las compre quien las compre). Una sola fuente para RESERVAS, DÍAS, la ficha y la campana:
 *   - `esInvitado`: no es el dueño. Ve el viaje del dueño (llegada, vuelta y alojamiento en gris) y compra sus entradas.
 *   - `compartido`: el viaje tiene a otra persona además del dueño (sin eso no hay «¿Para quién es?» ni avisos de grupo).
 *   - `mias`: las entradas que ha comprado esta persona (solo si es invitada: son suyas y no salen en el RESERVAS del dueño).
 *   - `reservasDelDueno`: las del viaje (`reservations`). Para el dueño son las suyas; para un invitado, las que el dueño compra.
 *   - `deOtros` (10N6): las entradas que han reservado OTRAS personas del viaje (el dueño, si miro como invitado; los invitados, siempre), cada una con su comprador. Las personales no llegan.
 * `meIncluye(reserva)`: ¿la entrada de otro me cubre a mí?
 */
export interface EntradasDelGrupo {
  esInvitado: boolean
  esAdmin: boolean
  compartido: boolean
  nombreAdmin: string
  gente: Persona[]
  yoId: string | null
  mias: Reservation[]
  reservasDelDueno: Reservation[]
  /** (10N6 §1l) Lo que han reservado los demás, con quién lo reservó. */
  deOtros: EntradaDeAlguien[]
  /** ¿La entrada de otro cubre a esta persona? */
  meIncluye: (reserva: Reservation) => boolean
  /** Los nombres de quienes tienen esta entrada. */
  nombresDe: (x: EntradaDeAlguien) => string[]
}

export function useEntradasDelGrupo(): EntradasDelGrupo {
  const { esInvitado, esAdmin, nombreAdmin } = usePermisosDelViaje()
  const gente = useViajeCompartido((s) => s.gente)
  const tripId = useSyncStore((s) => s.activeTripId)
  const lista = useMisReservas((s) => s.lista)
  const reservasDelDueno = useRouteStore((s) => s.reservations)
  const entradasInv = useLoSuyo((s) => s.entradas)
  useEffect(() => {
    if (esInvitado) void useMisReservas.getState().cargar(tripId)
  }, [esInvitado, tripId])
  const yoId = gente.find((p) => p.esYo)?.id ?? null
  const admin = gente.find((p) => p.esAdmin)
  const adminId = admin?.id ?? null
  const mias = esInvitado ? lista : []
  const deOtros = useMemo(() => {
    // Las del dueño solo cuentan como «de otro» si miro como invitado; las de los invitados, las de los demás (las mías están en `mias`).
    const todas = todasLasEntradas({ adminId: esInvitado ? adminId : null, reservasDelDueno, entradasInv: entradasInv.filter((g) => g.userId !== yoId) })
    return todas.filter((x) => !mias.some((m) => m.id === x.reserva.id))
  }, [esInvitado, adminId, reservasDelDueno, entradasInv, yoId, mias])
  return {
    esInvitado,
    esAdmin,
    compartido: esViajeCompartido(gente),
    nombreAdmin: nombreAdmin || nombreDe(admin),
    gente,
    yoId,
    mias,
    reservasDelDueno,
    deOtros,
    meIncluye: (reserva) => {
      const x = deOtros.find((d) => d.reserva.id === reserva.id)
      return x ? meCubre(x, yoId) : incluyeA(reserva, gente, yoId)
    },
    nombresDe: (x) => quienesLaTienen(x).map((id) => nombreDe(gente.find((p) => p.id === id)) || 'Alguien'),
  }
}

/**
 * Las reservas tal como las ve ESTA persona (para contar «x de 4 reservadas», pintar las líneas verdes y saber qué falta): las suyas y las que otros han comprado también para ella (el dueño o un invitado).
 * Lo que otro compró solo para otras personas no cuenta como suyo (esa entrada le sale «Comprar entrada»).
 */
export function useReservasParaMi(): Reservation[] {
  const g = useEntradasDelGrupo()
  const propias = g.esInvitado ? g.mias : g.reservasDelDueno
  const cubiertas = g.deOtros.filter((x) => meCubre(x, g.yoId) && !propias.some((m) => m.kind === x.reserva.kind && m.refId === x.reserva.refId)).map((x) => x.reserva)
  return [...propias, ...cubiertas]
}

/** La entrada de otro que cubre esta fila (por su nombre o por los sitios que cubre), si la hay: lo que se enseña a quien aún no tiene la suya. */
export function reservaDelDuenoDe(reservas: readonly Reservation[], item: { name: string; placeNames: string[]; isFreeTour: boolean }): Reservation | null {
  return reservas.find((r) => r.kind === 'entrada' && (item.isFreeTour ? r.refId === 'Free Tour' : r.refId === item.name || r.placeNames.some((p) => item.placeNames.includes(p)))) ?? null
}
