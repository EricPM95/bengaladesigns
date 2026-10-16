import { create } from 'zustand'
import type { Momento, RespuestaDeHecho } from '../lib/logros'

/**
 * LO ÚLTIMO QUE HA GANADO LA PERSONA (Tanda 8A). Aquí caen las respuestas del servidor tras un Visto o una foto: la lista de momentos, en orden, y el último aviso
 * («Activa tu ubicación o haz una foto…», «Parece que no estás en…»). Las pantallas de los momentos (8b) los leen de aquí y los quitan al enseñarlos.
 * Sin pantallas todavía, solo se acumulan. Con el interruptor apagado nunca se llena.
 */
interface LogrosState {
  momentos: Momento[]
  aviso: string | null
  /** Hay algo ganado cuya animación no se vio (el puntito del botón flotante). */
  puntito: boolean
  recibir: (respuesta: RespuestaDeHecho | null) => void
  tomarMomentos: () => Momento[]
  limpiarAviso: () => void
  ponerPuntito: (hay: boolean) => void
}

export const useLogrosStore = create<LogrosState>((set, get) => ({
  momentos: [],
  aviso: null,
  puntito: false,
  recibir: (r) => {
    if (!r) return
    set((s) => ({
      momentos: r.nuevos?.length ? [...s.momentos, ...r.nuevos] : s.momentos,
      aviso: r.aviso ?? r.mensaje ?? s.aviso,
      puntito: s.puntito || Boolean(r.nuevos?.length),
    }))
  },
  tomarMomentos: () => {
    const m = get().momentos
    set({ momentos: [] })
    return m
  },
  limpiarAviso: () => set({ aviso: null }),
  ponerPuntito: (hay) => set({ puntito: hay }),
}))
