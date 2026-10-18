import { create } from 'zustand'
import { cargarAvisos, marcarAvisosLeidos, type AvisoDeCuenta } from '../lib/avisos'

/**
 * Los avisos de la cuenta y si la campanita está abierta (cuentas parte 3). La lista viene del servidor; «leído» se guarda allí. `abierta` y `enAviso` hacen que el aviso del móvil, al
 * tocarlo, abra la app con la campanita abierta justo en ese aviso (AV6).
 */
interface AvisosState {
  avisos: AvisoDeCuenta[]
  sinLeer: number
  cargados: boolean
  abierta: boolean
  enAviso: string | null
  cargar: () => Promise<void>
  marcarLeidos: (ids: string[] | null) => Promise<void>
  abrir: (avisoId?: string | null) => void
  cerrar: () => void
  poner: (avisos: AvisoDeCuenta[]) => void
}

const cuentaSinLeer = (avisos: AvisoDeCuenta[]) => avisos.filter((a) => !a.leido && !a.etiqueta).length

export const useAvisosStore = create<AvisosState>((set, get) => ({
  avisos: [],
  sinLeer: 0,
  cargados: false,
  abierta: false,
  enAviso: null,
  cargar: async () => {
    const r = await cargarAvisos()
    if (r) set({ avisos: r.avisos, sinLeer: r.sinLeer, cargados: true })
  },
  poner: (avisos) => set({ avisos, sinLeer: cuentaSinLeer(avisos), cargados: true }),
  marcarLeidos: async (ids) => {
    const { avisos } = get()
    const marcadas = avisos.map((a) => (ids == null || ids.includes(a.id) ? { ...a, leido: true } : a))
    set({ avisos: marcadas, sinLeer: cuentaSinLeer(marcadas) })
    await marcarAvisosLeidos(ids)
  },
  abrir: (avisoId = null) => set({ abierta: true, enAviso: avisoId }),
  cerrar: () => set({ abierta: false, enAviso: null }),
}))

if (import.meta.env.DEV && typeof window !== 'undefined') (window as unknown as { __avisos: typeof useAvisosStore }).__avisos = useAvisosStore
