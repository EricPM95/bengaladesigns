import { create } from 'zustand'
import type { CambioDeVuelo } from '../lib/cambioDeVuelo'
import type { ItemDeResumen } from '../lib/resumenDeVuelo'
import { useRouteStore } from './useRouteStore'

/**
 * Estado de pantalla del rehacer por un cambio de vuelo (Tanda 7): qué cambios están esperando a que acabe el rehacer en segundo plano, y la hoja del resumen que sale al acabar.
 * No se guarda con el viaje.
 *  - `pendiente`: los cambios que puso en marcha el rehacer en curso (`generacion` es el `rehacerGeneracion` de ese rehacer: «gana el último» lo cambia y el pendiente de antes deja de valer).
 *  - `hoja`: la UNICA hoja del resumen abierta. Se cierra con [De acuerdo], con la cruz, o sola si el viajero pulsa [Deshacer] de lo que la causó.
 */
interface PendienteDeVuelo {
  generacion: number
  cambios: CambioDeVuelo[]
}

interface ResumenVueloState {
  pendiente: PendienteDeVuelo | null
  hoja: { items: ItemDeResumen[]; id: number } | null
  /** Anota los cambios del rehacer que va a empezar (`generacion`). Si había uno en marcha, sus cambios se juntan con estos (gana el último, pero la hoja cuenta todo). */
  iniciar: (cambio: CambioDeVuelo, generacion: number, enMarchaConGeneracion: number | null) => void
  limpiarPendiente: () => void
  mostrar: (items: ItemDeResumen[]) => void
  cerrar: () => void
}

// Solo en desarrollo: para mirar la ruta y los avisos de los vuelos desde la consola del navegador (window.__ruta.getState().route). Como `__notices` de la campana.
if (import.meta.env.DEV && typeof window !== 'undefined') (window as unknown as { __ruta: typeof useRouteStore }).__ruta = useRouteStore

export const useResumenVueloStore = create<ResumenVueloState>((set) => ({
  pendiente: null,
  hoja: null,
  iniciar: (cambio, generacion, enMarchaConGeneracion) =>
    set((state) => ({
      pendiente: {
        generacion,
        cambios: state.pendiente && enMarchaConGeneracion !== null && state.pendiente.generacion === enMarchaConGeneracion ? [...state.pendiente.cambios, cambio] : [cambio],
      },
    })),
  limpiarPendiente: () => set({ pendiente: null }),
  mostrar: (items) => set({ hoja: items.length > 0 ? { items, id: Date.now() } : null }),
  cerrar: () => set({ hoja: null }),
}))
