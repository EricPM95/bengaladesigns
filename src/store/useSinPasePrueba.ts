import { create } from 'zustand'

/**
 * «VERME COMO VIAJERO SIN PASE» (Tanda 10B, solo pruebas del administrador). Lo decide SIEMPRE el servidor (`GET /api/pase/sin-pase`: solo dice «encendido» a una cuenta de administrador que lo
 * encendió); aquí solo se recuerda lo que contestó. Encendido, `pagoActivo()` es falso (lo de pago, cerrado) y el servidor contesta a HOY como a quien no compró el pase.
 */
interface Estado {
  activo: boolean
  poner: (activo: boolean) => void
}

export const useSinPasePrueba = create<Estado>((set) => ({ activo: false, poner: (activo) => set({ activo }) }))

export const sinPasePruebaActivo = (): boolean => useSinPasePrueba.getState().activo
