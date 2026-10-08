import { useAddFlowStore } from '../../../store/useAddFlowStore'

const ROSE = 'oklch(0.55 0.17 5)'
const ROSE_DEEP = 'oklch(0.52 0.17 5)'
const GREEN = 'oklch(0.55 0.11 150)'
const GREEN_INK = 'oklch(0.45 0.11 150)'

function TicketIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 8a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2v-2a2 2 0 0 0 0-4zM10 6v12" />
    </svg>
  )
}

/**
 * La tarjeta de cada entrada en RESERVAS (Tanda 6m, diseño «Entrada Tarjeta»). Sin reservar, en rosa: «ENTRADA · Día 1» (con fechas, «Mar 12 ene»), el nombre entero, el botón
 * grande [Reservar entrada] (abre el enlace de compra, con un aviso corto; nunca el nombre del proveedor) y «¿Ya la tienes? Añádela». Reservada, en verde: «✓ Reservada · 14:00 · Cambiar».
 * Del diseño se copia lo visual; los datos y las reglas son los de la app.
 */
export function EntradaCard({
  when,
  name,
  reservedTime,
  buyLabel = 'Reservar entrada',
  buyHref,
  onAdd,
  onChange,
  notes = [],
}: {
  /** «Día 1» o «Mar 12 ene». */
  when: string
  name: string
  /** La hora de la reserva, si ya está reservada. */
  reservedTime: string | null
  buyLabel?: string
  buyHref: string | null
  /** «Añádela»: abre la hoja de la hora. */
  onAdd: () => void
  /** «Cambiar»: la misma hoja, con la reserva y «Eliminar reserva». */
  onChange: () => void
  notes?: { text: string; warn?: boolean }[]
}) {
  const reserved = reservedTime != null
  const accent = reserved ? GREEN : ROSE
  const buy = () => {
    useAddFlowStore.setState({ toast: { message: 'Abriendo la tienda de entradas…', previous: null, id: Date.now() } })
    if (buyHref) window.open(buyHref, '_blank', 'noopener,noreferrer')
  }
  return (
    <div
      className="relative flex min-h-[112px] w-full bg-white"
      style={{
        borderRadius: 18,
        border: `1px solid ${reserved ? 'oklch(0.55 0.11 150 / .4)' : 'rgba(28,34,48,.08)'}`,
        boxShadow: '0 1px 2px rgba(28,34,48,.05),0 12px 26px -18px rgba(28,34,48,.4)',
      }}
    >
      <div className="relative w-[74px] shrink-0 overflow-hidden text-white" style={{ borderRadius: '17px 0 0 17px' }}>
        <span aria-hidden="true" className="absolute inset-0" style={{ clipPath: 'polygon(0 0,100% 0,calc(100% - 22px) 100%,0 100%)', background: accent, transition: 'background .35s' }} />
        <span aria-hidden="true" className="absolute bottom-0 left-0 top-0 flex w-[58px] items-center justify-center">
          <TicketIcon />
        </span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-[5px] py-3 pl-2.5 pr-3.5">
        <span className="flex items-center gap-1.5 text-text/50" style={{ font: "600 9.5px 'Geist Mono',monospace", letterSpacing: '.14em', textTransform: 'uppercase' }}>
          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full" style={{ background: reserved ? GREEN : 'rgba(28,34,48,.35)' }} />
          Entrada
          <span className="opacity-50">·</span>
          <span className="text-text/65" style={{ letterSpacing: '.04em', textTransform: 'none', fontWeight: 500 }}>
            {when}
          </span>
        </span>
        <span className="font-display text-text [overflow-wrap:anywhere]" style={{ fontSize: 18, lineHeight: 1.08 }}>
          {name}
        </span>
        {notes.map((note) => (
          <span key={note.text} className={note.warn ? 'text-accent-red' : 'text-text/60'} style={{ font: "400 11.5px 'Geist'", lineHeight: 1.3 }}>
            {note.text}
          </span>
        ))}
        {reserved ? (
          <span className="mt-0.5 flex items-center gap-1.5 whitespace-nowrap text-text/65" style={{ font: "400 12px 'Geist'" }}>
            <span className="inline-flex items-center gap-1 font-semibold" style={{ color: GREEN_INK }}>
              ✓ Reservada
            </span>
            <span>·</span>
            <span className="text-text" style={{ font: "600 12px 'Geist Mono',monospace" }}>
              {reservedTime}
            </span>
            <span>·</span>
            <button type="button" onClick={onChange} className="text-text underline underline-offset-[3px]" style={{ font: "italic 400 15px 'Instrument Serif',serif" }}>
              Cambiar
            </button>
          </span>
        ) : (
          <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1.5">
            <button
              type="button"
              onClick={buy}
              className="h-8 whitespace-nowrap rounded-full px-3.5 text-white transition-transform active:scale-[.97]"
              style={{ background: ROSE, boxShadow: `0 8px 16px -8px ${ROSE_DEEP}`, font: "600 12.5px 'Geist'" }}
            >
              {buyLabel}
            </button>
            <span className="text-text/55" style={{ font: "400 11px 'Geist'" }}>
              ¿Ya la tienes?{' '}
              <button type="button" onClick={onAdd} className="font-semibold text-text underline underline-offset-2">
                Añádela
              </button>
            </span>
          </span>
        )}
      </div>
    </div>
  )
}
