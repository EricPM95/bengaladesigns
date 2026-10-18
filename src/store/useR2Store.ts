import { create } from 'zustand'
import type { Recomendacion } from '../lib/aplicarRecomendacion'

/** Qué recomendación tiene abierta el administrador en R2 (la hoja de «Laura te recomienda…»). Se abre desde la etiqueta de un día o desde la campanita. */
interface R2State {
  abierta: Recomendacion | null
  abrir: (rec: Recomendacion) => void
  cerrar: () => void
}

export const useR2Store = create<R2State>((set) => ({
  abierta: null,
  abrir: (rec) => set({ abierta: rec }),
  cerrar: () => set({ abierta: null }),
}))

if (import.meta.env.DEV && typeof window !== 'undefined') (window as unknown as { __r2: typeof useR2Store }).__r2 = useR2Store
