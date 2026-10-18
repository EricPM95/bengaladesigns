import { create } from 'zustand'
import type { Recomendacion } from '../lib/aplicarRecomendacion'
import { listarRecomendaciones } from '../lib/recomendacionesViaje'
import { supabase } from '../lib/supabaseClient'
import { useSyncStore } from './useSyncStore'

/**
 * LO SOCIAL DEL VIAJE ABIERTO (cuentas parte 3): quién está en el viaje (el administrador y sus invitados, con el nombre de pila y la foto) y las recomendaciones que hay.
 * El administrador ve todas las pendientes; cada invitado, las suyas. Lo carga `ViajeCompartidoHost` al abrir el viaje y cada poco mientras la app está a la vista.
 * Con las cuentas apagadas no se carga nada y todo queda vacío.
 */
export interface Persona {
  id: string
  nombre: string | null
  foto: string | null
  esAdmin: boolean
}

interface ViajeCompartidoState {
  tripId: string | null
  gente: Persona[]
  recomendaciones: Recomendacion[]
  cargar: (tripId: string | null) => Promise<void>
  poner: (datos: { tripId?: string | null; gente?: Persona[]; recomendaciones?: Recomendacion[] }) => void
}

export const useViajeCompartido = create<ViajeCompartidoState>((set) => ({
  tripId: null,
  gente: [],
  recomendaciones: [],
  cargar: async (tripId) => {
    if (!tripId || !supabase) {
      set({ tripId, gente: [], recomendaciones: [] })
      return
    }
    const [gente, recomendaciones] = await Promise.all([gentePorRpc(tripId), listarRecomendaciones(tripId)])
    // (Si mientras tanto se abrió otro viaje, esta respuesta ya no vale.)
    if (useSyncStore.getState().activeTripId !== tripId) return
    set({ tripId, gente, recomendaciones })
  },
  poner: (datos) => set((s) => ({ ...s, ...datos, tripId: datos.tripId ?? s.tripId })),
}))

async function gentePorRpc(tripId: string): Promise<Persona[]> {
  try {
    const { data, error } = await supabase!.rpc('gente_del_viaje', { p_trip: tripId })
    if (error || !Array.isArray(data)) return []
    return (data as { id: string; nombre: string | null; foto: string | null; es_admin: boolean }[]).map((p) => ({ id: p.id, nombre: p.nombre, foto: p.foto, esAdmin: p.es_admin }))
  } catch {
    return []
  }
}

/** El nombre que se enseña: el de pila, o «Viajero» mientras no se haya puesto uno. */
export const nombreDe = (p: Pick<Persona, 'nombre'> | null | undefined): string => p?.nombre?.trim() || 'Viajero'

/** La inicial para el círculo cuando no hay foto. */
export const inicialDe = (p: Pick<Persona, 'nombre'> | null | undefined): string => (nombreDe(p)[0] ?? 'V').toUpperCase()

// Solo desarrollo: window.__viaje.getState().poner({ gente: [...] }) para probar las pantallas sin servidor.
if (import.meta.env.DEV && typeof window !== 'undefined') (window as unknown as { __viaje: typeof useViajeCompartido }).__viaje = useViajeCompartido
