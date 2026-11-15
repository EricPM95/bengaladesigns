import { create } from 'zustand'
import type { ExpDeRespuesta, Momento } from '../../../lib/logros'
import { useLogrosStore } from '../../../store/useLogrosStore'
import { filaVacia, pedir as pedirFila, repartir, soltar as soltarFila, type Fila, type PantallaDeMomentos } from './fila'

/**
 * Lo que está abierto de los momentos (Tanda 8B), aparte del almacén de logros (`useLogrosStore`, que solo recibe lo ganado).
 * Cualquier pantalla puede abrir cosas con `useMomentosUI.getState().abrirResumenDia()`, etc.
 */
export type QueCompartir = { tipo: 'logro'; momento: Momento } | { tipo: 'viaje' }

interface MomentosUI {
  /** La ronda de sorpresas que se está enseñando (null = ninguna). */
  ronda: Momento[] | null
  /** La EXP ganada que se enseña como una línea dentro de la primera pantalla de la ronda (V3: la «+EXP» ya no es una pantalla aparte). */
  rondaExp: ExpDeRespuesta | null
  /** Se sigue con el resumen del día por sí solo, sin sorpresas antes (al acabar la ruta). */
  resumenDia: boolean
  resumenViaje: boolean
  hojaLogros: boolean
  compartir: QueCompartir | null
  primerDia: boolean
  /** La fila de lo que ocupa la pantalla (ver `fila.ts`): de uno en uno. */
  fila: Fila
  empezarRonda: (m: Momento[], exp?: ExpDeRespuesta | null) => void
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
  /** Pide su turno / lo suelta (ver `fila.ts`). */
  pedir: (k: PantallaDeMomentos) => void
  soltar: (k: PantallaDeMomentos) => void
}

export const useMomentosUI = create<MomentosUI>((set) => ({
  ronda: null,
  rondaExp: null,
  resumenDia: false,
  resumenViaje: false,
  hojaLogros: false,
  compartir: null,
  primerDia: false,
  fila: filaVacia(),
  empezarRonda: (m, exp = null) => set({ ronda: m, rondaExp: exp }),
  terminarRonda: () => set({ ronda: null, rondaExp: null }),
  abrirResumenDia: () => set({ resumenDia: true }),
  cerrarResumenDia: () => set({ resumenDia: false }),
  abrirResumenViaje: () => set({ resumenViaje: true }),
  cerrarResumenViaje: () => set({ resumenViaje: false }),
  abrirHojaLogros: () => set({ hojaLogros: true }),
  cerrarHojaLogros: () => set({ hojaLogros: false }),
  abrirCompartir: (q) => set({ compartir: q }),
  cerrarCompartir: () => set({ compartir: null }),
  ponerPrimerDia: (v) => set({ primerDia: v }),
  pedir: (k) => set((e) => ({ fila: pedirFila(e.fila, k, bloqueado()) })),
  soltar: (k) => set((e) => ({ fila: soltarFila(e.fila, k, bloqueado()) })),
}))

/** La hoja del Visto o un «Compartir» abiertos por la persona: mientras estén, no sale nada de la fila. */
const bloqueado = (): boolean => useLogrosStore.getState().hojaAbierta || useMomentosUI.getState().compartir !== null
// Al cerrarse la hoja del Visto o un «Compartir», sale lo que esperaba.
useLogrosStore.subscribe((e, previo) => {
  if (previo.hojaAbierta && !e.hojaAbierta) useMomentosUI.setState((u) => ({ fila: repartir(u.fila, bloqueado()) }))
})
useMomentosUI.subscribe((e, previo) => {
  if (previo.compartir !== null && e.compartir === null) useMomentosUI.setState((u) => ({ fila: repartir(u.fila, bloqueado()) }))
})

