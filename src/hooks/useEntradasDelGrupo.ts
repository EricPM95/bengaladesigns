import { useEffect } from 'react'
import { usePermisosDelViaje } from './usePermisosDelViaje'
import { useViajeCompartido, nombreDe, type Persona } from '../store/useViajeCompartido'
import { useSyncStore } from '../store/useSyncStore'
import { useMisReservas } from '../store/useMisReservas'
import { useRouteStore } from '../store/useRouteStore'
import type { Reservation } from '../lib/bookings'
import { esViajeCompartido, incluyeA } from '../lib/reservasGrupo'

/**
 * QUIÉN MIRA Y QUÉ ENTRADAS SON SUYAS (Tanda 10N §8). Una sola fuente para RESERVAS, DÍAS, la ficha y la campana:
 *   - `esInvitado`: no es el dueño. Ve el viaje del dueño (llegada, vuelta y alojamiento en gris) y compra sus entradas.
 *   - `compartido`: el viaje tiene a otra persona además del dueño (sin eso no hay «¿Para quién es?» ni avisos de grupo).
 *   - `mias`: las entradas que ha comprado esta persona (solo si es invitada: son suyas y no salen en el RESERVAS del dueño).
 *   - `reservasDelDueno`: las del viaje (`reservations`). Para el dueño son las suyas; para un invitado, las que el dueño compra.
 * `estadoDe(reserva)` dice cómo ve esta persona una entrada del dueño: 'mia' (el dueño la ha comprado también para ella), 'otra' (es solo del dueño o de otros: la suya aún no está) o 'propia' (el dueño mirando la suya).
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
  /** ¿La entrada del dueño cubre a esta persona? */
  meIncluye: (reserva: Reservation) => boolean
}

export function useEntradasDelGrupo(): EntradasDelGrupo {
  const { esInvitado, esAdmin, nombreAdmin } = usePermisosDelViaje()
  const gente = useViajeCompartido((s) => s.gente)
  const tripId = useSyncStore((s) => s.activeTripId)
  const lista = useMisReservas((s) => s.lista)
  const reservasDelDueno = useRouteStore((s) => s.reservations)
  useEffect(() => {
    if (esInvitado) void useMisReservas.getState().cargar(tripId)
  }, [esInvitado, tripId])
  const yoId = gente.find((p) => p.esYo)?.id ?? null
  const admin = gente.find((p) => p.esAdmin)
  return {
    esInvitado,
    esAdmin,
    compartido: esViajeCompartido(gente),
    nombreAdmin: nombreAdmin || nombreDe(admin),
    gente,
    yoId,
    mias: esInvitado ? lista : [],
    reservasDelDueno,
    meIncluye: (reserva) => incluyeA(reserva, gente, yoId),
  }
}

/**
 * Las reservas tal como las ve ESTA persona (para contar «x de 4 reservadas», pintar las líneas verdes y saber qué falta): para el dueño, las del viaje; para un invitado, las suyas y las que el dueño
 * ha comprado también para él. Lo que el dueño compró solo para otros no cuenta como suyo (esa entrada le sale «Comprar entrada»).
 */
export function useReservasParaMi(): Reservation[] {
  const g = useEntradasDelGrupo()
  if (!g.esInvitado) return g.reservasDelDueno
  const propias = g.mias
  const delDueno = g.reservasDelDueno.filter((r) => g.meIncluye(r) && !propias.some((m) => m.kind === r.kind && m.refId === r.refId))
  return [...propias, ...delDueno]
}

/** La entrada del dueño que cubre esta fila (por su nombre o por los sitios que cubre), si la hay: lo que se enseña a quien aún no tiene la suya. */
export function reservaDelDuenoDe(reservas: readonly Reservation[], item: { name: string; placeNames: string[]; isFreeTour: boolean }): Reservation | null {
  return reservas.find((r) => r.kind === 'entrada' && (item.isFreeTour ? r.refId === 'Free Tour' : r.refId === item.name || r.placeNames.some((p) => item.placeNames.includes(p)))) ?? null
}
