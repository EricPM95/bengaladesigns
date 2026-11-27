import { useReservasParaMi } from './useEntradasDelGrupo'
import type { Reservation } from '../lib/bookings'
import { unidasA, type MitadDelViaje } from '../lib/escalasYUnion'

/**
 * (V76) El tren o autobús UNIDO a la llegada o a la vuelta (el primero por hora), o null. Sale de la MISMA lista de reservas de RESERVAS (regla V62: HOY lee, nunca copia).
 * Consultas a Supabase: ninguna.
 */
export function useTrenUnido(kind: MitadDelViaje): Reservation | null {
  return unidasA(useReservasParaMi(), kind)[0] ?? null
}
