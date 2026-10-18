import { create } from 'zustand'
import type { ExpDeRespuesta, Momento, RespuestaDeHecho } from '../lib/logros'

/**
 * LO ÚLTIMO QUE HA GANADO LA PERSONA (Tanda 8A). Aquí caen las respuestas del servidor tras un Visto o una foto: la lista de momentos, en orden, y el último aviso
 * («Activa tu ubicación o haz una foto…», «Parece que no estás en…»). Las pantallas de los momentos (8b) los leen de aquí y los quitan al enseñarlos.
 * Sin pantallas todavía, solo se acumulan. Con el interruptor apagado nunca se llena.
 */
interface LogrosState {
  momentos: Momento[]
  aviso: string | null
  /** La pregunta de las 12:00 («Te queda medio día…» con [Hoy] y [Mañana]), si toca contestarla. Las pantallas la enseñan y llaman a `responderPregunta`. */
  pregunta: { texto: string; opciones: { id: string; texto: string }[] } | null
  /** Hay algo ganado cuya animación no se vio (el puntito del botón flotante). */
  puntito: boolean
  /** Hay una hoja del Visto abierta (la del pedazo, la de la foto…): las sorpresas esperan a que se cierre para salir. Lo pone quien abre y cierra esas hojas. */
  hojaAbierta: boolean
  /** (8C2) La EXP ganada que aún no se ha enseñado, ya sumada («+405 EXP»): la cuenta siempre el servidor. Se enseña una sola vez, cuando acaban las sorpresas y las películas (`ExpHost`). */
  exp: ExpDeRespuesta | null
  tomarExp: () => ExpDeRespuesta | null
  ponerHojaAbierta: (abierta: boolean) => void
  recibir: (respuesta: RespuestaDeHecho | null) => void
  tomarMomentos: () => Momento[]
  limpiarAviso: () => void
  limpiarPregunta: () => void
  ponerPuntito: (hay: boolean) => void
}

export const useLogrosStore = create<LogrosState>((set, get) => ({
  momentos: [],
  aviso: null,
  pregunta: null,
  puntito: false,
  hojaAbierta: false,
  exp: null,
  tomarExp: () => {
    const e = get().exp
    set({ exp: null })
    return e
  },
  ponerHojaAbierta: (abierta) => set({ hojaAbierta: abierta }),
  recibir: (r) => {
    if (!r) return
    set((s) => ({
      momentos: r.nuevos?.length ? [...s.momentos, ...r.nuevos] : s.momentos,
      aviso: r.aviso ?? r.mensaje ?? s.aviso,
      pregunta: r.motivo === 'pregunta_medio_dia' && r.pregunta ? r.pregunta : s.pregunta,
      puntito: s.puntito || Boolean(r.nuevos?.length),
      // La EXP se suma: lo de antes es del primero y lo de después, del último (la barra sale del nivel de antes al de después).
      exp: r.exp && r.exp.ganada > 0 ? (s.exp ? { ...r.exp, ganada: s.exp.ganada + r.exp.ganada, antes: s.exp.antes, sube_de_nivel: s.exp.sube_de_nivel || r.exp.sube_de_nivel } : r.exp) : s.exp,
    }))
  },
  tomarMomentos: () => {
    const m = get().momentos
    set({ momentos: [] })
    return m
  },
  limpiarAviso: () => set({ aviso: null }),
  limpiarPregunta: () => set({ pregunta: null }),
  ponerPuntito: (hay) => set({ puntito: hay }),
}))
