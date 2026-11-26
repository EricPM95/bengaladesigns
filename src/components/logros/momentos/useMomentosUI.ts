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
  /** (V59) De qué día es el resumen que se enseña (null = el de hoy) y si sale a la mañana siguiente («Tu día de ayer en Roma»). */
  resumenDe: { iso: string; manana: boolean } | null
  resumenViaje: boolean
  hojaLogros: boolean
  compartir: QueCompartir | null
  primerDia: boolean
  /** (V6) Al acabar la última animación de lo reclamado (o al tocar [Saltar todo]), se abre la hoja de logros con todo puesto. */
  hojaAlFinal: boolean
  pedirHojaAlFinal: () => void
  saltarTodoYAbrirLogros: () => void
  /** La fila de lo que ocupa la pantalla (ver `fila.ts`): de uno en uno. */
  fila: Fila
  empezarRonda: (m: Momento[], exp?: ExpDeRespuesta | null) => void
  terminarRonda: () => void
  abrirResumenDia: (de?: { iso: string; manana: boolean }) => void
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
  resumenDe: null,
  resumenViaje: false,
  hojaLogros: false,
  compartir: null,
  primerDia: false,
  fila: filaVacia(),
  hojaAlFinal: false,
  pedirHojaAlFinal: () => set({ hojaAlFinal: true }),
  saltarTodoYAbrirLogros: () => {
    useLogrosStore.setState({ exp: null, momentos: [] })
    set({ ronda: null, rondaExp: null, hojaAlFinal: true })
  },
  empezarRonda: (m, exp = null) => set({ ronda: m, rondaExp: exp }),
  terminarRonda: () => set({ ronda: null, rondaExp: null }),
  abrirResumenDia: (de) => set({ resumenDia: true, resumenDe: de ?? null }),
  cerrarResumenDia: () => set({ resumenDia: false, resumenDe: null }),
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
// (V71 §2) Se espera un respiro (450 ms) antes de soltar la fila: entre una hoja que se cierra y la siguiente que se abre (la hoja de la foto → la cámara → lo ganado) no se cuela el resumen del día. Y si hay sorpresas por enseñar, la ronda se pide ANTES de soltar: primero las pantallas de logros, el resumen al final.
let relojDeLaFila = 0
useLogrosStore.subscribe((e, previo) => {
  if (!previo.hojaAbierta && e.hojaAbierta) window.clearTimeout(relojDeLaFila)
  if (previo.hojaAbierta && !e.hojaAbierta) {
    window.clearTimeout(relojDeLaFila)
    relojDeLaFila = window.setTimeout(() => {
      if (bloqueado()) return
      const hay = useLogrosStore.getState().momentos.length > 0 && !useMomentosUI.getState().ronda
      useMomentosUI.setState((u) => ({ fila: repartir(hay && !u.fila.esperan.includes('ronda') && u.fila.mostrando !== 'ronda' ? { ...u.fila, esperan: [...u.fila.esperan, 'ronda'] } : u.fila, false) }))
    }, 450)
  }
})
useMomentosUI.subscribe((e, previo) => {
  if (previo.compartir !== null && e.compartir === null) useMomentosUI.setState((u) => ({ fila: repartir(u.fila, bloqueado()) }))
})


// (V6) Cuando acaba todo lo que se estaba enseñando (las sorpresas y la EXP del final), si se pidió, se abre la hoja de logros. Se espera un momento: entre la ronda y la EXP hay un respiro.
let relojHoja = 0
function comprobarHojaAlFinal(): void {
  window.clearTimeout(relojHoja)
  if (!useMomentosUI.getState().hojaAlFinal) return
  relojHoja = window.setTimeout(() => {
    const u = useMomentosUI.getState()
    const l = useLogrosStore.getState()
    if (!u.hojaAlFinal || u.ronda || u.fila.mostrando || u.fila.esperan.length > 0 || l.momentos.length > 0 || l.exp) return
    useMomentosUI.setState({ hojaAlFinal: false })
    u.abrirHojaLogros()
  }, 2600)
}
useMomentosUI.subscribe(comprobarHojaAlFinal)
useLogrosStore.subscribe(comprobarHojaAlFinal)
