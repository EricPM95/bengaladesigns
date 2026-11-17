import { getTodayTripStatus } from '../../lib/todayMode'
import { usePagoActivo } from '../../lib/pago'
import { useRouteStore } from '../../store/useRouteStore'
import { BotonCamaraViaje } from './hoy/CamaraViaje'

/**
 * (V5, 4b) LA CÁMARA DE VIAJE EN TODAS LAS PANTALLAS DEL VIAJE (Ruta, Días, Explorar, Reservas y HOY): el mismo botón, en el mismo sitio y con lo mismo que hace en HOY, antes, durante y después del viaje.
 * Se monta una vez en `RouteScreen`, encima del botón de los logros (los dos miden lo mismo). Con pase, fotos sin límite y con recompensas; sin pase, solo fotos (una por parada, sin logros).
 */
export function CamaraDeViajeGlobal() {
  const route = useRouteStore((s) => s.route)
  const simulada = useRouteStore((s) => s.dev_simulated_today_iso)
  const conAcceso = usePagoActivo()
  if (!route) return null
  const estado = getTodayTripStatus(route, simulada ?? undefined)
  const day = estado?.phase === 'during' ? estado.context.day : null
  return <BotonCamaraViaje route={route} fase={estado?.phase ?? null} conAcceso={conAcceso} day={day} />
}
