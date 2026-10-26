import { viajeEmpezado } from '../lib/viajeEmpezado'
import { useRouteStore } from '../store/useRouteStore'
import { usePermisosDelViaje } from './usePermisosDelViaje'

/**
 * ¿PUEDE ESTA PERSONA CAMBIAR LA RUTA AHORA? (Tanda 10N, apartado 6)
 *   · El administrador y quien puede editar, siempre (tocan la ruta directamente).
 *   · Quien solo recomienda, ANTES del viaje: sí, y cada cambio va a su propuesta (`propone`).
 *   · Quien solo recomienda, DESDE el primer día del viaje (hora del destino): no (`puede` = false). Sigue viendo la ruta, las fichas, sus logros, HOY, RESERVAS y las fotos.
 */
export function usePuedeCambiarLaRuta(): { puede: boolean; propone: boolean; enViaje: boolean; soloRecomienda: boolean } {
  const permisos = usePermisosDelViaje()
  const route = useRouteStore((s) => s.route)
  const simulada = useRouteStore((s) => s.dev_simulated_today_iso)
  const soloRecomienda = permisos.esInvitado && permisos.soloRecomienda
  const enViaje = viajeEmpezado(route, new Date(), simulada)
  return { puede: !soloRecomienda || !enViaje, propone: soloRecomienda && !enViaje, enViaje, soloRecomienda }
}
