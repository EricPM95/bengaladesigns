import { create } from 'zustand'
import { borradorVacio, type Borrador, type Punto, type TipoAviso } from '../lib/cuentanos/tipos'

/**
 * (V20) «Cuéntanos»: qué pantalla está abierta (U1 el menú, un formulario, el mapa para elegir el sitio, el gracias) y lo que el viajero lleva escrito (se guarda mientras va al mapa y vuelve).
 * Se abre desde el botón flotante (menú), desde una ficha («Un dato está mal» con el sitio ya puesto) o desde donde se proponía un sitio (U2b con el nombre ya escrito).
 */
export interface AperturaCuentanos {
  tipo?: TipoAviso
  /** El sitio ya puesto (viene de una ficha). */
  sitio?: { nombre: string; id?: string }
  /** El nombre ya escrito (restaurante o lugar). */
  nombre?: string
  origen?: string
  parada?: string | null
  dia?: string | null
}

export type PantallaCuentanos = { t: 'menu' } | { t: 'form'; tipo: TipoAviso } | { t: 'mapa'; tipo: TipoAviso } | { t: 'gracias'; tipo: TipoAviso; enCola: boolean }

interface Estado {
  abierto: boolean
  pantalla: PantallaCuentanos
  apertura: AperturaCuentanos
  borrador: Borrador
  /** Las fotos elegidas (se guardan aquí para que no se pierdan al ir al mapa y volver). */
  fotos: File[]
  setFotos: (f: File[]) => void
  abrir: (apertura?: AperturaCuentanos) => void
  cerrar: () => void
  ir: (pantalla: PantallaCuentanos) => void
  cambiar: (parte: Partial<Borrador>) => void
  ponerPunto: (punto: Punto | null) => void
}

export const useCuentanosStore = create<Estado>((set) => ({
  abierto: false,
  pantalla: { t: 'menu' },
  apertura: {},
  borrador: borradorVacio(),
  fotos: [],
  setFotos: (fotos) => set({ fotos }),
  abrir: (apertura = {}) =>
    set({
      abierto: true,
      apertura,
      borrador: { ...borradorVacio(), nombre: apertura.nombre?.trim() ?? '', sitio: apertura.sitio ?? null },
      fotos: [],
      pantalla: apertura.tipo ? { t: 'form', tipo: apertura.tipo } : { t: 'menu' },
    }),
  cerrar: () => set({ abierto: false, pantalla: { t: 'menu' }, apertura: {}, borrador: borradorVacio(), fotos: [] }),
  ir: (pantalla) => set({ pantalla }),
  cambiar: (parte) => set((s) => ({ borrador: { ...s.borrador, ...parte } })),
  ponerPunto: (punto) => set((s) => ({ borrador: { ...s.borrador, punto } })),
}))

/** Abre «Cuéntanos» desde donde sea (fuera de React). */
export function abrirCuentanos(apertura?: AperturaCuentanos): void {
  useCuentanosStore.getState().abrir(apertura)
}
