import { create } from 'zustand'
import type { TipoExtra } from '../lib/reservasExtra'

/**
 * (V75) Qué hoja de «+ Añadir una reserva» está abierta. Estado de pantalla: no se guarda con el viaje.
 *  · `menu`: la hoja «Añade una reserva» (R2, las nueve casillas).
 *  · `vuelos`: «Ya tienes tus vuelos. ¿Quieres cambiar alguno?» (R7a).
 *  · `formulario`: la hoja de ferry, tren, autobús u otra (`tipo`); con `editar` (el id de la reserva), la misma hoja con lo guardado (el lápiz).
 * Los botones, y las pruebas (`window.__anadirReserva`), la abren y la cierran desde aquí.
 */
export type HojaDeAnadir = { hoja: 'menu' } | { hoja: 'vuelos' } | { hoja: 'formulario'; tipo: TipoExtra; editar?: string }

interface AnadirReservaState {
  abierta: HojaDeAnadir | null
  abrirMenu: () => void
  abrirVuelos: () => void
  abrirFormulario: (tipo: TipoExtra, editar?: string) => void
  cerrar: () => void
}

export const useAnadirReservaStore = create<AnadirReservaState>((set) => ({
  abierta: null,
  abrirMenu: () => set({ abierta: { hoja: 'menu' } }),
  abrirVuelos: () => set({ abierta: { hoja: 'vuelos' } }),
  abrirFormulario: (tipo, editar) => set({ abierta: { hoja: 'formulario', tipo, ...(editar ? { editar } : {}) } }),
  cerrar: () => set({ abierta: null }),
}))

// Solo desarrollo: window.__anadirReserva.getState().abrirFormulario('ferry') para probar sin tocar la pantalla.
if (import.meta.env.DEV && typeof window !== 'undefined') (window as unknown as { __anadirReserva: typeof useAnadirReservaStore }).__anadirReserva = useAnadirReservaStore
