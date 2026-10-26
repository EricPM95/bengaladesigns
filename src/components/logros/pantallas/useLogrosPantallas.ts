import { create } from 'zustand'

/**
 * LAS PANTALLAS DE LOS LOGROS (Tanda 8C2): una pila de pantallas completas (Todos mis logros, un destino, una colección por dentro, la ficha de un logro, Mi colección, un viaje, «¿Dónde has
 * estado ya?», el pasaporte). Cualquier sitio las abre con `useLogrosPantallas.getState().abrir({ t: 'destino', destino: 'roma' })` y ellas vuelven con `volver()`; `cerrarTodo()` las cierra todas.
 * Las dibuja `PantallasHost` (montado una vez en App), que carga cada una cuando se abre.
 */
export type Pantalla =
  /** Mi vitrina y Todos mis logros: una pantalla con dos pestañas. `pestana` es la que se abre (por defecto la vitrina). `grupo` (opcional): el grupo de logros de viajero que se quiere ver. */
  | { t: 'todos'; pestana?: 'vitrina' | 'todos' }
  /** La ficha de un logro (la clave es la del servidor: `destino|logro|escalon`). */
  | { t: 'ficha'; clave: string }
  /** «Mi colección» de logros de viajero, página a página; `grupo` es el que se abre. */
  | { t: 'mi_coleccion'; grupo?: string }
  /** La página de un destino (sus sellos, sus colecciones, sus emblemas). */
  | { t: 'destino'; destino: string; /** El sello que sale marcado «Estás aquí» (p. ej. el del Vaticano dentro de Roma). */ resaltar?: string }
  /** Una colección por dentro (el álbum). */
  | { t: 'coleccion'; destino: string; coleccion: string }
  /** Un viaje guardado (Mis viajes → un viaje). */
  | { t: 'viaje'; tripId: string }
  /** «¿Dónde has estado ya?» (J1, J2, J3). */
  | { t: 'previos' }
  /** Mi pasaporte; `pagina` es el país o la vista que se abre. */
  | { t: 'pasaporte'; pagina?: string }
  /** La página del sorteo anual (Tanda 10P): el premio, cuándo se sortea, quién entra y cómo se entra. Se abre desde el billete del Perfil y desde el aviso de la campana. */
  | { t: 'sorteo' }

interface PilaDePantallas {
  pila: Pantalla[]
  abrir: (p: Pantalla) => void
  /** Sustituye la de arriba por otra (por ejemplo, al cambiar de pestaña sin apilar). */
  cambiar: (p: Pantalla) => void
  volver: () => void
  cerrarTodo: () => void
}

export const useLogrosPantallas = create<PilaDePantallas>((set) => ({
  pila: [],
  abrir: (p) => set((s) => ({ pila: [...s.pila, p] })),
  cambiar: (p) => set((s) => ({ pila: s.pila.length ? [...s.pila.slice(0, -1), p] : [p] })),
  volver: () => set((s) => ({ pila: s.pila.slice(0, -1) })),
  cerrarTodo: () => set({ pila: [] }),
}))

export type PantallaDe<T extends Pantalla['t']> = Extract<Pantalla, { t: T }>
