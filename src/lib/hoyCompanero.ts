import { create } from 'zustand'
import type { RespuestaCerca } from '../components/route/hoy/useCercaDeAqui'

/**
 * (HOY2b, E) LO QUE EL COMPAÑERO SABE POR DONDE ESTÁS, compartido en HOY: `AvisosDeCerca` pregunta al servidor (cada 45 s, una sola vez) y deja aquí la respuesta, para que el reto del día
 * (que sale debajo de la tarjeta principal, todo el día) y [¿Qué hago ahora?] no pregunten otra vez ni repitan el sitio que el aviso de fuera de ruta (H8b) ya ofrece.
 */
interface Estado {
  cerca: RespuestaCerca | null
  /** El nombre del sitio que el aviso de «Estás en… / Estás junto a…» ofrece ahora (o null). */
  ofrecido: string | null
  poner: (cerca: RespuestaCerca | null, ofrecido: string | null) => void
}

export const useCompaneroStore = create<Estado>((set) => ({ cerca: null, ofrecido: null, poner: (cerca, ofrecido) => set({ cerca, ofrecido }) }))
