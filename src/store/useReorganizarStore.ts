import { create } from 'zustand'
import type { NoCabe, PropuestaDeVuelos } from '../lib/adaptarVuelos'

/**
 * EL BOTÓN «REORGANIZAR» DEL PASE (Tanda 10S7, apartado 2; `Piezas/Reorganizar` R1-R3). Estado de pantalla (no se guarda con el viaje):
 *  - `dias`: los días en los que reorganizar CAMBIARÍA algo (ya calculado). Con alguno, sale el botón flotante.
 *  - `alerta`: la alerta «¿Reorganizamos tu día?» abierta.
 *  - `iluminadas`: los ids de las paradas que se acaban de mover (se iluminan un momento).
 * «Ahora no» y el botón de la alerta lo dejan todo a cero: el botón no vuelve hasta el próximo cambio que de verdad lo pida.
 */
interface ReorganizarState {
  dias: string[]
  alerta: boolean
  trabajando: boolean
  iluminadas: string[]
  /** (10S7b) La alerta «¿Adaptamos tu primer y tu último día a tus vuelos?» abierta, con los días que cambiarían. null = no hay. */
  vuelos: PropuestaDeVuelos | null
  /** (10S7c) Los imprescindibles que no caben tras adaptar un día al vuelo: se avisan debajo de la franja con [Pasarlo a otro día]. Solo cuenta el que SIGUE en «Si te sobra tiempo» de su día (Deshacer o pasarlo lo quita solo). */
  noCaben: NoCabe[]
  ponerNoCaben: (lista: NoCabe[]) => void
  quitarNoCaben: (stopId: string) => void
  /** (10S8) [Ver] de «Y N sitios más pasan a “Si te sobra tiempo”.»: el día cuya sección «Si te sobra tiempo» hay que abrir (la propia sección lo recoge y lo borra). */
  verSobraTiempoDe: string | null
  verSobraTiempo: (dayId: string | null) => void
  proponerVuelos: (propuesta: PropuestaDeVuelos) => void
  cerrarVuelos: () => void
  /** Un cambio nuevo ha calculado estos días: se suman los que cambian y se quitan los que ya están bien. */
  poner: (cambian: string[], revisados: string[]) => void
  abrirAlerta: () => void
  cerrarAlerta: () => void
  /** «Ahora no»: el botón se esconde hasta el próximo cambio. */
  ahoraNo: () => void
  fijarTrabajando: (trabajando: boolean) => void
  iluminar: (ids: string[]) => void
  limpiarIluminadas: () => void
  reiniciar: () => void
  /** Reorganizado: el botón y la alerta se van, pero lo movido sigue iluminado un momento. */
  terminar: () => void
}

export const useReorganizarStore = create<ReorganizarState>((set) => ({
  dias: [],
  alerta: false,
  trabajando: false,
  iluminadas: [],
  vuelos: null,
  noCaben: [],
  ponerNoCaben: (lista) => set({ noCaben: lista }),
  quitarNoCaben: (stopId) => set((state) => ({ noCaben: state.noCaben.filter((item) => item.stopId !== stopId) })),
  verSobraTiempoDe: null,
  verSobraTiempo: (dayId) => set({ verSobraTiempoDe: dayId }),
  proponerVuelos: (propuesta) => set({ vuelos: propuesta }),
  cerrarVuelos: () => set({ vuelos: null }),
  poner: (cambian, revisados) =>
    set((state) => {
      const resto = state.dias.filter((id) => !revisados.includes(id))
      const dias = [...new Set([...resto, ...cambian])]
      return dias.length === state.dias.length && dias.every((id, i) => id === state.dias[i]) ? state : { dias, alerta: dias.length === 0 ? false : state.alerta }
    }),
  abrirAlerta: () => set({ alerta: true }),
  cerrarAlerta: () => set({ alerta: false }),
  ahoraNo: () => set({ alerta: false, dias: [] }),
  fijarTrabajando: (trabajando) => set({ trabajando }),
  iluminar: (ids) => set({ iluminadas: ids }),
  limpiarIluminadas: () => set({ iluminadas: [] }),
  reiniciar: () => set({ dias: [], alerta: false, trabajando: false, iluminadas: [], vuelos: null, noCaben: [] }),
  terminar: () => set({ dias: [], alerta: false, trabajando: false }),
}))
