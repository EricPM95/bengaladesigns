import type { StopTicket } from '../../../lib/mockStopTickets'
import { Button } from '../../ui/Button'
import { HourglassIcon } from '../../ui/TimeIcons'

/**
 * Estilo por proveedor — borde de la tarjeta + fondo del badge, un color propio por proveedor para
 * distinguir de un vistazo quién vende cada ticket sin tener que leer el badge. Añadir un proveedor
 * nuevo el día que se conecte una API real es solo una entrada más aquí.
 */
const PROVIDER_STYLE: Record<StopTicket['proveedor'], { label: string; border: string; badgeBg: string }> = {
  civitatis: { label: 'Civitatis', border: '#EC1561', badgeBg: '#EC1561' },
  getyourguide: { label: 'GetYourGuide', border: '#FF5A00', badgeBg: '#FF5A00' },
}

function formatPrice(precio: number, moneda: string): string {
  const symbol = moneda === 'EUR' ? '€' : moneda
  return `${precio.toLocaleString('es-ES')} ${symbol}`
}

interface StopTicketCardProps {
  ticket: StopTicket
}

export function StopTicketCard({ ticket }: StopTicketCardProps) {
  const style = PROVIDER_STYLE[ticket.proveedor]

  return (
    <div className="relative overflow-hidden rounded-xl border-2 bg-bg-card p-3" style={{ borderColor: style.border }}>
      <span
        className="absolute right-3 top-3 rounded-full px-2 py-0.5 text-caption font-semibold text-white"
        style={{ backgroundColor: style.badgeBg }}
      >
        {style.label}
      </span>

      <div className="flex gap-3 pr-16">
        <img src={ticket.imagen} alt="" className="h-16 w-16 shrink-0 rounded-lg object-cover" />
        <p className="line-clamp-2 text-body font-semibold text-text">{ticket.nombre}</p>
      </div>

      <p className="mt-2 text-small text-text">
        <span aria-hidden="true">⭐</span> {ticket.valoracion.toFixed(1)}/{ticket.escala_valoracion} · {ticket.num_opiniones.toLocaleString('es-ES')}{' '}
        opiniones
      </p>

      <p className="mt-1 flex items-center gap-3 text-caption text-text-soft">
        <span className="flex items-center gap-1">
          <HourglassIcon /> {ticket.duracion}
        </span>
        <span className="flex items-center gap-1">
          <span aria-hidden="true">🗣️</span> {ticket.idioma}
        </span>
      </p>

      <div className="mt-2 flex items-center justify-between">
        <span className="text-body font-bold text-text">{formatPrice(ticket.precio, ticket.moneda)}</span>
        <a href={ticket.url_afiliado} target="_blank" rel="noopener noreferrer">
          <Button className="font-bold shadow-sm">Reservar</Button>
        </a>
      </div>
    </div>
  )
}
