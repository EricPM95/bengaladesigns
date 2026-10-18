import { useViajeCompartido, nombreDe, type Persona } from '../store/useViajeCompartido'
import { usePropuestaStore } from '../store/usePropuestaStore'
import { useSyncStore } from '../store/useSyncStore'

/**
 * ¿Es este un viaje de otra persona al que estoy invitada? (cuentas parte 3). Con eso: la app deja de ofrecer las herramientas de editar (`soloVer`) y ofrece recomendar; dentro del modo
 * recomendación (`propuestaActiva`) las herramientas vuelven, pero sobre una copia. Con las cuentas apagadas nunca hay invitados y todo es como siempre.
 * En desarrollo, `sessionStorage['trazo:invitado'] = '1'` lo finge (capturas y pruebas a mano).
 */
export interface ModoInvitado {
  esInvitado: boolean
  propuestaActiva: boolean
  /** Invitada y fuera del modo recomendación: solo mirar y recomendar. */
  soloVer: boolean
  admin: Persona | null
  nombreAdmin: string
}

export function esInvitadoFingido(): boolean {
  if (!import.meta.env.DEV) return false
  try {
    return window.sessionStorage.getItem('trazo:invitado') === '1'
  } catch {
    return false
  }
}

export function useModoInvitado(): ModoInvitado {
  const tripId = useSyncStore((s) => s.activeTripId)
  const guardados = useSyncStore((s) => s.savedTrips)
  const gente = useViajeCompartido((s) => s.gente)
  const propuestaActiva = usePropuestaStore((s) => s.activa)
  const esInvitado = esInvitadoFingido() || (Boolean(tripId) && Boolean(guardados?.some((v) => v.id === tripId && v.esInvitado)))
  const admin = gente.find((p) => p.esAdmin) ?? null
  return { esInvitado, propuestaActiva, soloVer: esInvitado && !propuestaActiva, admin, nombreAdmin: nombreDe(admin) }
}
