import { create } from 'zustand'
import type { GenerationResumeState } from '../lib/routeGenerationOrchestrator'
import type { SavedTrip } from '../lib/tripPersistence'

export type SyncStatus = 'idle' | 'loading' | 'saving' | 'saved' | 'error' | 'disabled'

interface SyncStoreState {
  status: SyncStatus
  travelerId: string | null
  lastError: string | null
  /** Generación a medias encontrada al cargar los viajes guardados (TripSync.tsx) — LoadingScreenContainer (App.tsx) la consume una vez para retomarla y la limpia; null en cualquier otro caso. */
  pendingResume: GenerationResumeState | null
  /** Fila de `trips` que corresponde al viaje actualmente abierto — null mientras aún no se ha guardado por primera vez (recién creado) o mientras no hay ningún viaje abierto (pantalla "Mis viajes"). El autoguardado (TripSync.tsx) y el guardado de checkpoints (App.tsx) lo usan para saber si deben ACTUALIZAR esta fila o INSERTAR una nueva. */
  activeTripId: string | null
  /** Lista completa de viajes guardados de este traveler, cargada una vez al arrancar (TripSync.tsx) y usada por la pantalla "Mis viajes" — null mientras no se ha cargado todavía (o Supabase no está configurado). */
  savedTrips: SavedTrip[] | null
  setStatus: (status: SyncStatus) => void
  setTravelerId: (id: string | null) => void
  /** message = intento fallido (pone status en 'error'); null = limpia el error. */
  setError: (message: string | null) => void
  setPendingResume: (state: GenerationResumeState | null) => void
  setActiveTripId: (id: string | null) => void
  setSavedTrips: (trips: SavedTrip[] | null) => void
  /** Quita un viaje de la lista en memoria tras borrarlo en Supabase — sin recargar toda la lista. */
  removeSavedTrip: (id: string) => void
}

/**
 * Estado de sincronización con Supabase, separado de useRouteStore a propósito — es infraestructura
 * de guardado, no datos del viaje. Consumido por TripSync.tsx (quien lo actualiza) y
 * SyncStatusBanner.tsx (aviso discreto cuando status es 'error').
 */
export const useSyncStore = create<SyncStoreState>((set) => ({
  status: 'idle',
  travelerId: null,
  lastError: null,
  pendingResume: null,
  activeTripId: null,
  savedTrips: null,
  setStatus: (status) => set({ status }),
  setTravelerId: (id) => set({ travelerId: id }),
  setError: (message) => set({ lastError: message, status: message ? 'error' : 'idle' }),
  setPendingResume: (state) => set({ pendingResume: state }),
  setActiveTripId: (id) => set({ activeTripId: id }),
  setSavedTrips: (trips) => set({ savedTrips: trips }),
  removeSavedTrip: (id) => set((state) => ({ savedTrips: state.savedTrips?.filter((trip) => trip.id !== id) ?? null })),
}))
