import { create } from 'zustand'

/**
 * (V35B) El interruptor «Sin cuentas de prueba» de arriba del panel (encendido por defecto): las cuentas de prueba y las de administrador no cuentan en las cifras y gráficos de Inicio, Ventas, Usuarios y Logros.
 * Se acuerda en este navegador. Apagado, `pedir` añade `sin_pruebas=0` a esas peticiones (las de administrador no cuentan nunca; eso lo decide el servidor).
 */
const CLAVE = 'jutrip.panel.sin_pruebas'
const leer = (): boolean => {
  try {
    return window.localStorage.getItem(CLAVE) !== '0'
  } catch {
    return true
  }
}

interface Estado {
  on: boolean
  poner: (on: boolean) => void
}
export const useSinPruebas = create<Estado>((set) => ({
  on: leer(),
  poner: (on) => {
    try {
      window.localStorage.setItem(CLAVE, on ? '1' : '0')
    } catch {
      /* sin almacenamiento */
    }
    set({ on })
  },
}))

const CON_FILTRO = /^\/api\/admin\/(inicio|ventas|usuarios|logros-panel\/resumen)/
/** Pura: la dirección con `sin_pruebas=0` si el interruptor está apagado y la petición lo usa. */
export const conFiltroDePruebas = (ruta: string, on: boolean): string => (on || !CON_FILTRO.test(ruta) ? ruta : `${ruta}${ruta.includes('?') ? '&' : '?'}sin_pruebas=0`)
