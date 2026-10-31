import { usePagoActivo } from '../../lib/pago'
import { useRouteStore } from '../../store/useRouteStore'
import { useReorganizarStore } from '../../store/useReorganizarStore'
import { usePermisosDelViaje } from '../../hooks/usePermisosDelViaje'

/**
 * (Tanda 10S7, apartado 2) ¿Se ve el botón flotante «Reorganizar»? Solo con pase, solo para quien puede editar la ruta (el que solo recomienda no cambia la ruta: tiene su lápiz), solo en las pantallas
 * del viaje y solo si ya se ha calculado que reorganizar cambiaría algo (`useReorganizarStore.dias`).
 */
export function useBotonReorganizarVisible(): boolean {
  const conPase = usePagoActivo()
  const { puedeEditar } = usePermisosDelViaje()
  const hayDias = useReorganizarStore((s) => s.dias.length > 0)
  const pantalla = useRouteStore((s) => s.screen)
  return conPase && puedeEditar && hayDias && pantalla === 'route'
}
