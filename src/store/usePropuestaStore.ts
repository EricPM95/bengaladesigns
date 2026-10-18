import { create } from 'zustand'
import { construirRecomendacion, deshacerCambio, type CambioPropuesto } from '../lib/propuesta'
import { recomendar } from '../lib/recomendacionesViaje'
import type { Route } from '../lib/types'
import { useRouteStore } from './useRouteStore'
import { useSyncStore } from './useSyncStore'

/**
 * EL MODO RECOMENDACIÓN (cuentas parte 3, diseño «Ruta y días · 07»: RM, RV, RSent). Una persona invitada pide hacer cambios con las herramientas de siempre; se hacen sobre una COPIA
 * de la ruta del administrador y nada cambia de verdad hasta [Enviar]. Al enviar, la copia se tira y la persona vuelve a ver la ruta del administrador.
 *   ámbito   `parada` (desde el menú «···» de una parada, RW1), `dia` (desde su cabecera, RW2) o `ruta` (desde RUTA, RW3): solo cambia desde dónde se entra; lo que se manda lo decide
 *            lo que ha cambiado de verdad (una parada, un día o la ruta entera: `construirRecomendacion`).
 *   base     la ruta del administrador al empezar (no se toca).
 */
export type AmbitoDePropuesta = 'parada' | 'dia' | 'ruta'

interface PropuestaState {
  activa: boolean
  ambito: AmbitoDePropuesta | null
  base: Route | null
  /** RV: la lista de los cambios abierta. */
  verAbierto: boolean
  /** RSent: «Se lo hemos mandado a …». */
  enviada: boolean
  enviando: boolean
  error: string | null
  empezar: (ambito: AmbitoDePropuesta) => void
  /** Sale del modo y devuelve la ruta del administrador (descarta los cambios). */
  cancelar: () => void
  deshacer: (cambio: CambioPropuesto) => void
  verLista: (abierta: boolean) => void
  enviar: () => Promise<boolean>
  cerrarEnviada: () => void
}

const copia = (route: Route): Route => JSON.parse(JSON.stringify(route)) as Route

export const usePropuestaStore = create<PropuestaState>((set, get) => ({
  activa: false,
  ambito: null,
  base: null,
  verAbierto: false,
  enviada: false,
  enviando: false,
  error: null,
  empezar: (ambito) => {
    const route = useRouteStore.getState().route
    if (!route) return
    set({ activa: true, ambito, base: copia(route), verAbierto: false, enviada: false, error: null })
  },
  cancelar: () => {
    const { base } = get()
    if (base) useRouteStore.setState({ route: copia(base) })
    set({ activa: false, ambito: null, base: null, verAbierto: false, error: null })
  },
  deshacer: (cambio) => {
    const { base } = get()
    const route = useRouteStore.getState().route
    if (!base || !route) return
    useRouteStore.setState({ route: deshacerCambio(route, base, cambio) })
  },
  verLista: (abierta) => set({ verAbierto: abierta }),
  enviar: async () => {
    const { base } = get()
    const route = useRouteStore.getState().route
    const tripId = useSyncStore.getState().activeTripId
    if (!base || !route || !tripId) return false
    const paquete = construirRecomendacion(base, route)
    if (!paquete) {
      set({ error: 'Todavía no has cambiado nada.' })
      return false
    }
    set({ enviando: true, error: null })
    const error = await recomendar(tripId, paquete.tipo, paquete.payload)
    if (error) {
      set({ enviando: false, error })
      return false
    }
    // Mandada: la copia se tira y se vuelve a la ruta del administrador.
    useRouteStore.setState({ route: copia(base) })
    set({ activa: false, ambito: null, base: null, verAbierto: false, enviada: true, enviando: false, error: null })
    return true
  },
  cerrarEnviada: () => set({ enviada: false }),
}))

// Solo desarrollo: para abrir el modo desde la consola (window.__propuesta.getState().empezar('ruta')).
if (import.meta.env.DEV && typeof window !== 'undefined') (window as unknown as { __propuesta: typeof usePropuestaStore }).__propuesta = usePropuestaStore
