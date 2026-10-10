import { useEffect } from 'react'
import type { Route } from '../../../lib/types'
import { dayOnDate, type SaleMatch } from '../../../lib/bookings'
import { useDestinationExcursions } from '../../../lib/destinationExcursions'
import { fetchTripSales, matchSale } from '../../../lib/tripSales'
import { useRouteStore } from '../../../store/useRouteStore'

const WEEKDAY_LONG = new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })

/**
 * Las ventas del afiliado unidas a este viaje (PARA_CODE_RESERVAS, 5): al abrir el viaje se piden las que llegaron con su código de campaña y,
 * arriba de Días, sale una tarjeta por cada una: «Hemos visto que has reservado {x} el {día} a las {hora}. ¿La ponemos en tu ruta, ese día?» con
 * «Sí, ponla» y «Ahora no». Si se cancela una ya unida: «Tu reserva de {x} se ha cancelado» con «Quitar del viaje».
 */
export function SaleCards({ route }: { route: Route }) {
  const campaignCode = useRouteStore((state) => state.campaignCode)
  const sales = useRouteStore((state) => state.sales)
  const reservations = useRouteStore((state) => state.reservations)
  const receiveSale = useRouteStore((state) => state.receiveSale)
  const resolveSale = useRouteStore((state) => state.resolveSale)
  const info = useDestinationExcursions(route.destination)

  // Al abrir el viaje (y cuando llegan los datos del destino): las ventas de este código, unidas a su fila.
  useEffect(() => {
    if (!campaignCode || info.excursions.length + info.entradas.length === 0) return
    let alive = true
    void fetchTripSales(campaignCode).then((raw) => {
      if (!alive) return
      for (const sale of raw) {
        const matched = matchSale(sale, route, info)
        if (!matched) continue
        const linked = reservations.find((reservation) => reservation.refId === matched.refId && (!matched.locator || reservation.locator === matched.locator))
        // Una cancelación solo avisa si esa reserva está en el viaje; una venta nueva, si todavía no lo está.
        if (sale.status === 'cancelled') {
          if (linked) receiveSale({ ...matched, id: `${sale.id}:cancelada`, status: 'cancelada' })
        } else if (!linked) receiveSale({ ...matched, status: 'nueva' })
      }
    })
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignCode, info.excursions.length, info.entradas.length, route.destination])

  const pending = sales.filter((sale) => sale.status === 'nueva' || sale.status === 'cancelada')
  if (pending.length === 0) return null

  const excursionFor = (sale: SaleMatch) => info.excursions.find((option) => option.id === sale.excursionId) ?? null

  return (
    <div className="flex flex-col gap-2.5 pb-1">
      {pending.map((sale) => {
        const day = dayOnDate(route, sale.dateIso)
        const when = WEEKDAY_LONG.format(new Date(`${sale.dateIso}T00:00:00`))
        if (sale.status === 'cancelada') {
          return (
            <div key={sale.id} className="rounded-2xl border border-accent-red/30 bg-accent-red/[.07] p-4">
              <p className="text-[14.5px] leading-snug text-text">Tu reserva de {sale.name} se ha cancelado.</p>
              <div className="mt-3 flex gap-2">
                <button type="button" onClick={() => resolveSale(sale.id, 'remove')} className="h-10 flex-1 rounded-full bg-text text-[14px] font-medium text-bg">
                  Quitar del viaje
                </button>
                <button type="button" onClick={() => resolveSale(sale.id, 'dismiss')} className="h-10 flex-1 rounded-full border border-text/15 text-[14px] font-medium text-text">
                  Ahora no
                </button>
              </div>
            </div>
          )
        }
        return (
          <div key={sale.id} className="rounded-2xl border border-accent/40 bg-accent-soft/60 p-4">
            <p className="text-[14.5px] leading-snug text-text">
              Hemos visto que has reservado <strong>{sale.name}</strong> el {when}
              {sale.time ? ` a las ${sale.time}` : ''}.{day ? ' ¿La ponemos en tu ruta, ese día?' : ' Es una fecha fuera de las de tu viaje.'}
            </p>
            <div className="mt-3 flex gap-2">
              {day && (
                <button type="button" onClick={() => resolveSale(sale.id, 'accept', excursionFor(sale))} className="h-10 flex-1 rounded-full bg-text text-[14px] font-medium text-bg">
                  Sí, ponla
                </button>
              )}
              <button type="button" onClick={() => resolveSale(sale.id, 'dismiss')} className="h-10 flex-1 rounded-full border border-text/15 text-[14px] font-medium text-text">
                Ahora no
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
