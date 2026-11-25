import { create } from 'zustand'

/**
 * V45 §6: el aviso de un documento que no cuadra (una tarjeta de embarque de otro día que el vuelo) NO es una ventana ni un aviso que se va: es una línea naranja DENTRO de esa tarjeta, junto al QR,
 * con [Es correcta]. Se queda hasta cambiar el documento o pulsar [Es correcta]. Se guarda en el móvil (localStorage, por viaje y documento): 0 KB de red.
 * `clave`: qué documento es («arrival», «departure», el id de una entrada o de una excursión…).
 */
const K = (viaje: string | null, clave: string) => `jutrip:aviso-documento:${viaje ?? 'sin-viaje'}:${clave}`
const useCambios = create<{ v: number }>(() => ({ v: 0 }))
const avisar = () => useCambios.setState((s) => ({ v: s.v + 1 }))

/**
 * (V64 §2) El final de TODAS las líneas naranjas: «… Si no es la buena, súbela otra vez o cambia los datos a mano.» (antes: «Revisa que sea la buena»). Se aplica al leer, así también a los avisos ya guardados en el móvil.
 */
export const FINAL_DEL_AVISO = 'Si no es la buena, súbela otra vez o cambia los datos a mano.'
const conFinalNuevo = (texto: string | null): string | null => (texto ? texto.replace(/\.?\s*Revisa que sea la buena\.?\s*$/i, `. ${FINAL_DEL_AVISO}`) : texto)

export function leerAvisoDeDocumento(viaje: string | null, clave: string): string | null {
  try {
    return conFinalNuevo(window.localStorage.getItem(K(viaje, clave)))
  } catch {
    return conFinalNuevo(memoria.get(K(viaje, clave)) ?? null)
  }
}
const memoria = new Map<string, string>()

export function ponerAvisoDeDocumento(viaje: string | null, clave: string, texto: string): void {
  try {
    window.localStorage.setItem(K(viaje, clave), texto)
  } catch {
    memoria.set(K(viaje, clave), texto)
  }
  avisar()
}

export function quitarAvisoDeDocumento(viaje: string | null, clave: string): void {
  try {
    window.localStorage.removeItem(K(viaje, clave))
  } catch {
    memoria.delete(K(viaje, clave))
  }
  avisar()
}

/** El aviso de ese documento (se repinta al cambiar). */
export function useAvisoDeDocumento(viaje: string | null, clave: string): string | null {
  useCambios((s) => s.v)
  return leerAvisoDeDocumento(viaje, clave)
}
