import { create } from 'zustand'
import type { Momento } from '../../../lib/logros'

/**
 * Lo que está abierto de los momentos (Tanda 8B), aparte del almacén de logros (`useLogrosStore`, que solo recibe lo ganado).
 * Cualquier pantalla puede abrir cosas con `useMomentosUI.getState().abrirResumenDia()`, etc.
 */
export type QueCompartir = { tipo: 'logro'; momento: Momento } | { tipo: 'viaje' }

interface MomentosUI {
  /** La ronda de sorpresas que se está enseñando (null = ninguna). */
  ronda: Momento[] | null
  /** Se sigue con el resumen del día por sí solo, sin sorpresas antes (al acabar la ruta). */
  resumenDia: boolean
  resumenViaje: boolean
  hojaLogros: boolean
  compartir: QueCompartir | null
  primerDia: boolean
  empezarRonda: (m: Momento[]) => void
  terminarRonda: () => void
  abrirResumenDia: () => void
  cerrarResumenDia: () => void
  abrirResumenViaje: () => void
  cerrarResumenViaje: () => void
  abrirHojaLogros: () => void
  cerrarHojaLogros: () => void
  abrirCompartir: (q: QueCompartir) => void
  cerrarCompartir: () => void
  ponerPrimerDia: (v: boolean) => void
}

export const useMomentosUI = create<MomentosUI>((set) => ({
  ronda: null,
  resumenDia: false,
  resumenViaje: false,
  hojaLogros: false,
  compartir: null,
  primerDia: false,
  empezarRonda: (m) => set({ ronda: m }),
  terminarRonda: () => set({ ronda: null }),
  abrirResumenDia: () => set({ resumenDia: true }),
  cerrarResumenDia: () => set({ resumenDia: false }),
  abrirResumenViaje: () => set({ resumenViaje: true }),
  cerrarResumenViaje: () => set({ resumenViaje: false }),
  abrirHojaLogros: () => set({ hojaLogros: true }),
  cerrarHojaLogros: () => set({ hojaLogros: false }),
  abrirCompartir: (q) => set({ compartir: q }),
  cerrarCompartir: () => set({ compartir: null }),
  ponerPrimerDia: (v) => set({ primerDia: v }),
}))
