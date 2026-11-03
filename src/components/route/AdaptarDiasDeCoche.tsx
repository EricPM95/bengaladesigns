import { useEffect } from 'react'
import { useRouteStore } from '../../store/useRouteStore'
import { adaptarDiasDeCoche } from '../../lib/adaptarVuelos'
import { usePagoActivo } from '../../lib/pago'

/** (LZ2a) Al abrir un viaje de Lanzarote con pase y con zona elegida, cada día se adapta a la zona (si aún no lo está). No pinta nada. */
export function AdaptarDiasDeCoche() {
  const zona = useRouteStore((s) => s.route?.accommodationZone ?? null)
  const destino = useRouteStore((s) => s.route?.destination ?? null)
  const pago = usePagoActivo()
  const hayDias = useRouteStore((s) => (s.route?.days.length ?? 0) > 0)
  useEffect(() => {
    if (!zona || !destino || !hayDias || !pago) return
    void adaptarDiasDeCoche()
  }, [zona, destino, hayDias, pago])
  return null
}
