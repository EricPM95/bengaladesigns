import { useRouteStore } from '../../../store/useRouteStore'
import { LineaDelPase } from '../../pase/Candado'
import { reservaNoCuadraConSuFranja } from '../../../lib/reservaFueraDeFranja'
import type { DayPeriod } from '../../../lib/stopKind'

/**
 * (Tanda 10S3, apartado 6) Debajo de una parada reservada cuya hora no cuadra con su franja (Mañana hasta las 14:00, Tarde hasta las 20:00, Noche después): la línea gris del pase.
 * `LineaDelPase` solo se pinta sin pase; con pase, de momento, nada nuevo (la parada se queda donde está).
 */
export function LineaReservaFueraDeFranja({ reservedId, periodo }: { reservedId: string | null | undefined; periodo: DayPeriod }) {
  const hora = useRouteStore((state) => (reservedId ? (state.reservations.find((reserva) => reserva.id === reservedId && !reserva.fueraDeRuta)?.time ?? null) : null))
  if (!reservedId || !reservaNoCuadraConSuFranja(periodo, hora)) return null
  return <LineaDelPase clave="reservas" datos="reserva-fuera-de-franja" className="mx-1 mt-2" texto="Con el {pase}, tus reservas se colocan solas a su hora." />
}
