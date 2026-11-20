import { create } from 'zustand'

/** (V35A) El título grande de la pantalla del panel, cuando no es el nombre de la sección (p. ej. la ficha de una persona: «Laura García», como en Design P6c). `null` = el de siempre. */
export const useTituloDelPanel = create<{ titulo: string | null; poner: (t: string | null) => void }>((set) => ({ titulo: null, poner: (titulo) => set({ titulo }) }))
