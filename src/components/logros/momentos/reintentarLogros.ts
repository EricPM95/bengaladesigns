import { reintentarCargas } from '../../../lib/cargaSegura'
import { useLogrosStore } from '../../../store/useLogrosStore'
import { filaVacia } from './fila'
import { useMomentosUI } from './useMomentosUI'

/**
 * (V25) Lo que se hace al tocar [Reintentar] cuando una parte de logros no se pudo cargar: vuelve a bajarse y la fila de pantallas (la que decide qué sale de uno en uno) se vacía para que nada se quede esperando
 * a una pantalla que ya no está. La hoja de logros, si estaba pedida, vuelve a pedirse sola.
 */
export function soltarLaFilaDeLogros(): void {
  const queriaLaHoja = useMomentosUI.getState().hojaLogros
  useMomentosUI.setState({ ronda: null, rondaExp: null, fila: filaVacia(), hojaLogros: queriaLaHoja })
  useLogrosStore.setState({ momentos: [], exp: null })
}

export function reintentarLogros(): void {
  soltarLaFilaDeLogros()
  reintentarCargas()
  if (useMomentosUI.getState().hojaLogros) useMomentosUI.getState().pedir('hojaLogros')
}
