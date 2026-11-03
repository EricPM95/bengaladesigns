import { useRouteStore } from '../store/useRouteStore'

/**
 * (LZ1) El nombre del destino del viaje abierto para los textos de la interfaz que decían «Roma» a mano («Vuelves a Roma», «Cambiar a Roma», el interruptor del día 4…).
 * Sale de los datos del viaje (`route.destination`); sin viaje, «Roma» como siempre.
 */
export function useNombreDelDestino(): string {
  return useRouteStore((s) => s.route?.destination) || 'Roma'
}
