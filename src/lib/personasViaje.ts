import { supabase } from './supabaseClient'
import { useRouteStore } from '../store/useRouteStore'
import { useSyncStore } from '../store/useSyncStore'
import { useViajeCompartido, type Permiso } from '../store/useViajeCompartido'

/**
 * LAS PERSONAS DEL VIAJE (Tanda 10N §4a): cambiar el permiso de alguien, quitarlo y salir. Todo pasa por funciones de la base de datos (migración 0036), que son las que comprueban quién puede qué.
 * Sin la 0036 aplicada cada llamada devuelve un aviso en palabras sencillas y no cambia nada.
 */
export const textoDelPermiso: Record<Permiso, string> = { admin: 'Administrador', editar: 'Puede editar', recomendar: 'Solo recomendar' }
export const lineaDelPermiso: Record<Permiso, string> = {
  admin: 'Todo, y es el único que invita, quita gente y cambia permisos.',
  editar: 'Toca la ruta y acepta propuestas. No invita ni cambia fechas, vuelo o alojamiento.',
  recomendar: 'Propone cambios y otros los aceptan.',
}

const SIN_LA_0036 = 'Esto necesita la actualización del servidor (migración 0036). Todavía no está aplicada.'
const SIN_NUBE = 'Necesita conexión con el servidor.'

const mensajeDe = (error: { message?: string; code?: string } | null | undefined, porDefecto: string): string => {
  const texto = error?.message ?? ''
  if (/PGRST202|42883|does not exist|Could not find the function/i.test(`${error?.code ?? ''} ${texto}`)) return SIN_LA_0036
  return /^(Hace falta|Solo el administrador|El administrador|No estás|Ese permiso)/.test(texto) ? texto : porDefecto
}

export interface InfoQuitar {
  nombre: string | null
  plaza: { pass_id: string; tipo: 'uno' | 'duo' | 'grupo'; usos_usados: number; usos_max: number } | null
}

export async function infoQuitar(tripId: string, userId: string): Promise<InfoQuitar | null> {
  if (!supabase) return null
  const { data, error } = await supabase.rpc('info_quitar', { p_trip: tripId, p_user: userId })
  return error || !data ? null : (data as InfoQuitar)
}

export async function cambiarPermiso(tripId: string, userId: string, permiso: Exclude<Permiso, 'admin'>): Promise<string | null> {
  if (!supabase) return SIN_NUBE
  const { error } = await supabase.rpc('cambiar_permiso', { p_trip: tripId, p_user: userId, p_permiso: permiso })
  return error ? mensajeDe(error, 'No se ha podido cambiar el permiso. Inténtalo de nuevo.') : null
}

export async function quitarDelViaje(tripId: string, userId: string): Promise<string | null> {
  if (!supabase) return SIN_NUBE
  const { error } = await supabase.rpc('quitar_del_viaje', { p_trip: tripId, p_user: userId })
  return error ? mensajeDe(error, 'No se ha podido quitar a esa persona. Inténtalo de nuevo.') : null
}

/** [Salir del viaje]: igual que si te quitaran (la plaza del pase vuelve a quien la compró). Sin la 0036, la salida de siempre (se borra tu fila de invitada). */
export async function salirDelViaje(tripId: string): Promise<string | null> {
  if (!supabase) return SIN_NUBE
  const { error } = await supabase.rpc('salir_del_viaje', { p_trip: tripId })
  if (!error) return null
  if (mensajeDe(error, '') === SIN_LA_0036) {
    const { data: sesion } = await supabase.auth.getUser()
    const uid = sesion.user?.id
    if (!uid) return 'Hace falta una sesión.'
    const { error: e2 } = await supabase.from('trip_members').delete().eq('trip_id', tripId).eq('user_id', uid)
    return e2 ? 'No se ha podido salir del viaje. Inténtalo de nuevo.' : null
  }
  return mensajeDe(error, 'No se ha podido salir del viaje. Inténtalo de nuevo.')
}

/**
 * Deja de enseñar un viaje en esta pantalla: lo quita de la lista y, si era el abierto, abre otro o vuelve a la primera pantalla. Lo usa [Salir del viaje] y el aviso en directo de
 * «Ya no formas parte del viaje» (te han quitado con el viaje abierto). No toca la nube.
 */
export function dejarDeVerElViaje(tripId: string): void {
  const sync = useSyncStore.getState()
  const quedan = (sync.savedTrips ?? []).filter((t) => t.id !== tripId)
  if (sync.savedTrips) sync.setSavedTrips(quedan)
  useViajeCompartido.getState().poner({ tripId: null, gente: [], recomendaciones: [] })
  if (sync.activeTripId !== tripId) return
  const siguiente = quedan.find((t) => !t.generationState && !t.guardadoEn) ?? null
  sync.setResumeTrip(null)
  if (siguiente) {
    sync.setActiveTripId(siguiente.id)
    useRouteStore.getState().hydrateTrip(siguiente)
    return
  }
  sync.setActiveTripId(null)
  useRouteStore.setState({ route: null })
  useRouteStore.getState().resetQuestionnaire()
  useRouteStore.getState().setScreen('destination')
}
