import { create } from 'zustand'

/**
 * El Perfil (la hoja con el mapa de mis viajes, la lista de viajes y el álbum de cada uno): UN solo almacén para abrirlo desde donde haga falta (la cabecera, «Ver mis recuerdos» de HOY,
 * «Guarda tus recuerdos» de RUTA…). Tanda 6z6.
 */
interface PerfilUiState {
  abierto: boolean
  /** El viaje cuyo álbum está abierto (su id); null: no hay álbum abierto. */
  albumDe: string | null
  abrir: () => void
  /** Abre el Perfil directamente en el álbum de ese viaje. */
  abrirAlbum: (viajeId: string) => void
  cerrarAlbum: () => void
  cerrar: () => void
}

export const usePerfilUi = create<PerfilUiState>((set) => ({
  abierto: false,
  albumDe: null,
  abrir: () => set({ abierto: true }),
  abrirAlbum: (viajeId) => set({ abierto: true, albumDe: viajeId }),
  cerrarAlbum: () => set({ albumDe: null }),
  cerrar: () => set({ abierto: false, albumDe: null }),
}))
