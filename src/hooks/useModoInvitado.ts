import { useViajeCompartido, nombreDe, type Permiso, type Persona } from '../store/useViajeCompartido'
import { usePropuestaStore } from '../store/usePropuestaStore'
import { useSyncStore } from '../store/useSyncStore'

/**
 * ¿Es este un viaje de otra persona al que estoy invitada? (cuentas parte 3). Con eso: la app deja de ofrecer las herramientas de editar (`soloVer`) y ofrece recomendar; dentro del modo
 * recomendación (`propuestaActiva`) las herramientas vuelven, pero sobre una copia. Con las cuentas apagadas nunca hay invitados y todo es como siempre.
 * (Tanda 10N3 §1) `soloVer` solo vale para quien SOLO RECOMIENDA: quien «Puede editar» toca la ruta como el administrador (sin lápiz ni propuesta).
 * En desarrollo, `sessionStorage['trazo:invitado'] = '1'` lo finge (capturas y pruebas a mano).
 */
export interface ModoInvitado {
  esInvitado: boolean
  propuestaActiva: boolean
  /** Invitada que solo recomienda y fuera del modo recomendación: solo mirar y recomendar. Quien puede editar nunca está en «solo ver». */
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

/** En desarrollo, `sessionStorage['trazo:permiso'] = 'editar' | 'recomendar'` finge el permiso junto con `trazo:invitado`. */
export function permisoFingido(): Permiso | null {
  if (!import.meta.env.DEV) return null
  try {
    const v = window.sessionStorage.getItem('trazo:permiso')
    return v === 'editar' || v === 'recomendar' ? v : null
  } catch {
    return null
  }
}

/** Mi permiso en el viaje abierto: el administrador si el viaje es mío; si no, el que me dieron (sin dato, solo recomendar). */
export function permisoDe(esInvitado: boolean, gente: readonly Persona[]): Permiso {
  if (!esInvitado) return 'admin'
  const yo = gente.find((p) => p.esYo)
  return permisoFingido() ?? (yo?.permiso && yo.permiso !== 'admin' ? yo.permiso : 'recomendar')
}

/** Lo mismo que `useModoInvitado().esInvitado`, para código que no es un componente (un almacén, un evento). */
export function esInvitadoAhora(): boolean {
  const { activeTripId: tripId, savedTrips } = useSyncStore.getState()
  return esInvitadoFingido() || (Boolean(tripId) && Boolean(savedTrips?.some((v) => v.id === tripId && v.esInvitado)))
}

/** Mi permiso AHORA (fuera de un componente). */
export function miPermisoAhora(): Permiso {
  return permisoDe(esInvitadoAhora(), useViajeCompartido.getState().gente)
}

export function useModoInvitado(): ModoInvitado {
  const tripId = useSyncStore((s) => s.activeTripId)
  const guardados = useSyncStore((s) => s.savedTrips)
  const gente = useViajeCompartido((s) => s.gente)
  const propuestaActiva = usePropuestaStore((s) => s.activa)
  const esInvitado = esInvitadoFingido() || (Boolean(tripId) && Boolean(guardados?.some((v) => v.id === tripId && v.esInvitado)))
  const admin = gente.find((p) => p.esAdmin) ?? null
  const soloRecomienda = esInvitado && permisoDe(esInvitado, gente) === 'recomendar'
  return { esInvitado, propuestaActiva, soloVer: soloRecomienda && !propuestaActiva, admin, nombreAdmin: nombreDe(admin) }
}
