import { create } from 'zustand'
import { anunciarAvisosNuevos } from './useFranjaStore'
import { cargarAvisos, marcarAvisosLeidos, marcarAvisosNoLeidos, ocultarAvisos, type AvisoDeCuenta } from '../lib/avisos'

/**
 * Los avisos de la cuenta y si la campanita está abierta (cuentas parte 3). La lista viene del servidor; «leído» se guarda allí. `abierta` y `enAviso` hacen que el aviso del móvil, al
 * tocarlo, abra la app con la campanita abierta justo en ese aviso (AV6).
 *
 * (Tanda 10N4 §2, «Gestionar los avisos») Eliminar y «marcar como no leído» se guardan en el servidor (migración 0046) y TAMBIÉN en el propio móvil (`ocultos`, `noLeidos`):
 * así funcionan aunque la migración no esté aplicada. Abrir la campana ya no marca nada como leído.
 */
interface AvisosState {
  avisos: AvisoDeCuenta[]
  sinLeer: number
  cargados: boolean
  abierta: boolean
  enAviso: string | null
  ocultos: string[]
  noLeidos: string[]
  cargar: () => Promise<void>
  marcarLeidos: (ids: string[] | null) => Promise<void>
  marcarNoLeidos: (ids: string[]) => Promise<void>
  /** «Eliminar»: los quita de la campana de esta persona (se pueden devolver con `devolver`). */
  eliminar: (ids: string[]) => Promise<void>
  devolver: (ids: string[]) => Promise<void>
  abrir: (avisoId?: string | null) => void
  cerrar: () => void
  poner: (avisos: AvisoDeCuenta[]) => void
}

const CLAVE_OCULTOS = 'trazo:avisos-ocultos:v1'
const CLAVE_NO_LEIDOS = 'trazo:avisos-no-leidos:v1'

function leerLista(clave: string): string[] {
  try {
    const crudo = localStorage.getItem(clave)
    const lista = crudo ? JSON.parse(crudo) : []
    return Array.isArray(lista) ? lista.filter((x): x is string => typeof x === 'string') : []
  } catch {
    return []
  }
}
function guardarLista(clave: string, ids: string[]) {
  try {
    localStorage.setItem(clave, JSON.stringify(ids.slice(-300)))
  } catch {
    /* sin almacenamiento: vale solo mientras esté abierta */
  }
}

const visibles = (avisos: AvisoDeCuenta[], ocultos: string[], noLeidos: string[]) =>
  avisos.filter((a) => !ocultos.includes(a.id)).map((a) => (a.leido && noLeidos.includes(a.id) ? { ...a, leido: false } : a))

const cuentaSinLeer = (avisos: AvisoDeCuenta[]) => avisos.filter((a) => !a.leido && !a.etiqueta).length

export const useAvisosStore = create<AvisosState>((set, get) => {
  /** Pone la lista del servidor aplicando lo que esta persona ha eliminado o dejado como no leído en este móvil. */
  const aplicar = (crudos: AvisoDeCuenta[]) => {
    const { ocultos, noLeidos } = get()
    const avisos = visibles(crudos, ocultos, noLeidos)
    set({ avisos, sinLeer: cuentaSinLeer(avisos), cargados: true })
  }
  // (La lista sin tocar del servidor, para volver a aplicar lo local si cambia.)
  let crudos: AvisoDeCuenta[] = []
  return {
    avisos: [],
    sinLeer: 0,
    cargados: false,
    abierta: false,
    enAviso: null,
    ocultos: leerLista(CLAVE_OCULTOS),
    noLeidos: leerLista(CLAVE_NO_LEIDOS),
    cargar: async () => {
      const r = await cargarAvisos()
      if (!r) return
      const antes = crudos
      const yaHabiaLista = get().cargados
      crudos = r.avisos
      aplicar(crudos)
      // (10N4 §4b) Un aviso que llega con la app abierta (no el primero que se carga al empezar): franja de arriba y sonido, además de la campana.
      if (yaHabiaLista) anunciarAvisosNuevos(antes, crudos, get().ocultos)
    },
    poner: (avisos) => {
      const antes = crudos
      const yaHabiaLista = get().cargados
      crudos = avisos
      aplicar(crudos)
      if (yaHabiaLista) anunciarAvisosNuevos(antes, crudos, get().ocultos)
    },
    marcarLeidos: async (ids) => {
      const { avisos, noLeidos } = get()
      const nuevosNoLeidos = ids == null ? [] : noLeidos.filter((x) => !ids.includes(x))
      guardarLista(CLAVE_NO_LEIDOS, nuevosNoLeidos)
      crudos = crudos.map((a) => (ids == null || ids.includes(a.id) ? { ...a, leido: true } : a))
      const marcadas = avisos.map((a) => (ids == null || ids.includes(a.id) ? { ...a, leido: true } : a))
      set({ avisos: marcadas, noLeidos: nuevosNoLeidos, sinLeer: cuentaSinLeer(marcadas) })
      await marcarAvisosLeidos(ids)
    },
    marcarNoLeidos: async (ids) => {
      if (ids.length === 0) return
      const noLeidos = [...new Set([...get().noLeidos, ...ids])]
      guardarLista(CLAVE_NO_LEIDOS, noLeidos)
      const marcadas = get().avisos.map((a) => (ids.includes(a.id) ? { ...a, leido: false } : a))
      set({ avisos: marcadas, noLeidos, sinLeer: cuentaSinLeer(marcadas) })
      await marcarAvisosNoLeidos(ids)
    },
    eliminar: async (ids) => {
      if (ids.length === 0) return
      const ocultos = [...new Set([...get().ocultos, ...ids])]
      guardarLista(CLAVE_OCULTOS, ocultos)
      const avisos = get().avisos.filter((a) => !ids.includes(a.id))
      set({ avisos, ocultos, sinLeer: cuentaSinLeer(avisos) })
      await ocultarAvisos(ids, true)
    },
    devolver: async (ids) => {
      if (ids.length === 0) return
      const ocultos = get().ocultos.filter((x) => !ids.includes(x))
      guardarLista(CLAVE_OCULTOS, ocultos)
      set({ ocultos })
      aplicar(crudos.some((a) => ids.includes(a.id)) ? crudos : get().avisos)
      await ocultarAvisos(ids, false)
      // (Si el servidor ya los había quitado de la lista, se vuelven a pedir.)
      const r = await cargarAvisos()
      if (r) {
        crudos = r.avisos
        aplicar(crudos)
      }
    },
    abrir: (avisoId = null) => set({ abierta: true, enAviso: avisoId }),
    cerrar: () => set({ abierta: false, enAviso: null }),
  }
})

if (import.meta.env.DEV && typeof window !== 'undefined') (window as unknown as { __avisos: typeof useAvisosStore }).__avisos = useAvisosStore
