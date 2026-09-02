import { create } from 'zustand'
import type { GenerationResumeState } from '../lib/routeGenerationOrchestrator'

export type SyncStatus = 'idle' | 'loading' | 'saving' | 'saved' | 'error' | 'disabled'

interface SyncStoreState {
  status: SyncStatus
  travelerId: string | null
  lastError: string | null
  /** Generación a medias encontrada al cargar el viaje guardado (TripSync.tsx) — LoadingScreenContainer (App.tsx) la consume una vez para retomarla y la limpia; null en cualquier otro caso. */
  pendingResume: GenerationResumeState | null
  setStatus: (status: SyncStatus) => void
  setTravelerId: (id: string | null) => void
  /** message = intento fallido (pone status en 'error'); null = limpia el error. */
  setError: (message: string | null) => void
  setPendingResume: (state: GenerationResumeState | null) => void
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
  setStatus: (status) => set({ status }),
  setTravelerId: (id) => set({ travelerId: id }),
  setError: (message) => set({ lastError: message, status: message ? 'error' : 'idle' }),
  setPendingResume: (state) => set({ pendingResume: state }),
}))
