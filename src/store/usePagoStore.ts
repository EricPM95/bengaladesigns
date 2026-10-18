import { create } from 'zustand'
import type { PaseMio } from '../lib/pagoPase'
import type { ViajeDeLaPareja } from '../lib/viajesQueSePisan'

/**
 * Qué hoja del pase está abierta (cuentas parte 3). Una sola a la vez.
 *   compra     la hoja de compra (P6)
 *   volviendo  al volver de la página de pago: se espera a que llegue el aviso y se crea el pase
 *   listo      el pase ya está (un pase individual: «Ya tienes tu Pase de Roma»)
 *   invitar    la hoja del enlace y el código: P7 (compartir el pase) o RS2 (compartir el viaje)
 *   mentira    la página de pruebas del pago de mentira (solo desarrollo)
 *   dosViajes  P8b (el aviso de los 10 días) o P9 (el primer día): dos viajes al mismo destino que se pisan, ¿cuál se hace?
 */
export type HojaDelPase =
  | { tipo: 'compra'; destino: string; tripId: string | null }
  | { tipo: 'volviendo'; sesion: string }
  | { tipo: 'listo'; pase: PaseMio }
  | { tipo: 'invitar'; modo: 'pase' | 'viaje'; destino: string; tripId: string | null; pase: PaseMio | null; codigoInicial?: string | null }
  | { tipo: 'mentira'; sesion: string }
  | { tipo: 'dosViajes'; modo: 'p8b' | 'p9'; destino: string; actual: ViajeDeLaPareja; otro: ViajeDeLaPareja; etiquetaDia?: string }

interface PagoState {
  hoja: HojaDelPase | null
  abrir: (hoja: HojaDelPase) => void
  cerrar: () => void
}

export const usePagoStore = create<PagoState>((set) => ({
  hoja: null,
  abrir: (hoja) => set({ hoja }),
  cerrar: () => set({ hoja: null }),
}))

// Solo desarrollo: para abrir las hojas desde la consola (window.__pago.getState().abrir({ tipo: 'compra', destino: 'Roma', tripId: null })).
if (import.meta.env.DEV && typeof window !== 'undefined') (window as unknown as { __pago: typeof usePagoStore }).__pago = usePagoStore
