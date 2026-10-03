import type { ReactNode } from 'react'
import type { ReadinessItemKind, ReadinessPriority } from '../../../lib/readiness'
import { ReadinessKindIcon } from './ReadinessIcons'

export interface ReservasBookAction {
  /** "Reservar" para la mayoría de ítems, "Obtener con 5% dto." para eSIM/Seguro de viaje. */
  label: string
  href: string
  /** Marca el ítem como resuelto — se dispara al pulsar el enlace, no hay forma de confirmar que la compra externa se completó de verdad (mismo principio que el resto de afiliación mock de la app). */
  onGet: () => void
}

interface ReservasItemRowProps {
  kind: ReadinessItemKind
  label: string
  resolved: boolean
  /** Ej. "Italia" bajo "eSIM", o "Falta un tramo (50%)" bajo "Vuelos". */
  subtitle?: string
  onClick: () => void
  /** Vía de compra real, sin pasar por la ficha manual — "Añadir" (registro manual) y esta acción conviven en la misma fila cuando el ítem no está resuelto. */
  bookAction?: ReservasBookAction
  /** Antes pintaba el borde izquierdo según la urgencia (rojo/ámbar/gris). Con el diseño nuevo (3-oct-2026) las filas son tarjetas sin ese borde; se conserva la propiedad por si vuelve a hacer falta. */
  priority: ReadinessPriority
}

/** El color del bloque en diagonal de cada tipo y la palabra pequeña de encima del nombre (diseño «Trazo Reservas», pantalla 13). */
const KIND_STYLE: Record<ReadinessItemKind, { color: string; eyebrow: string }> = {
  transport: { color: 'oklch(0.68 0.14 60)', eyebrow: 'Transporte' },
  accommodation: { color: 'oklch(0.62 0.14 45)', eyebrow: 'Alojamiento' },
  insurance: { color: 'oklch(0.6 0.19 25)', eyebrow: 'Imprescindible' },
  n26: { color: 'oklch(0.45 0.03 250)', eyebrow: 'Pagos sin comisión' },
  'rental-vehicle': { color: 'oklch(0.55 0.12 295)', eyebrow: 'Vehículo' },
  esim: { color: 'oklch(0.56 0.1 220)', eyebrow: 'Datos móviles' },
  entrada: { color: 'oklch(0.6 0.18 10)', eyebrow: 'Entrada' },
  excursion: { color: 'oklch(0.56 0.1 220)', eyebrow: 'Excursión' },
}

/** El color del puntito de urgencia: los mismos que tenía el borde de la izquierda (rojo solo el seguro, ámbar lo muy recomendado, gris el resto). */
const PRIORITY_DOT: Record<ReadinessPriority, string> = { red: 'rgb(var(--accent-red))', yellow: 'rgb(var(--accent-gold))', gray: 'rgba(28,34,48,.35)' }

const GREEN = 'oklch(0.55 0.13 150 / .45)'

/**
 * La tarjeta de una reserva (diseño «Trazo Reservas», 3-oct-2026): un bloque de color en diagonal con el icono del tipo, la palabra pequeña
 * de la categoría, el nombre en Instrument Serif y, a la derecha, «Añadir» y el botón en píldora. Reservada, el borde se pone verde y el botón
 * pasa a «✓ Añadido» en oscuro (reabre la ficha, como antes). Se usa en Reservas, en el panel rápido del % y en Entradas y Excursión.
 * `trailing` sustituye a la columna de botones (p. ej. «Ver excursiones»).
 */
export function ReservaCard({
  kind,
  eyebrow,
  name,
  subtitle,
  resolved,
  onAdd,
  bookAction,
  resolvedLabel = '✓ Añadido',
  trailing,
  priority,
}: {
  kind: ReadinessItemKind
  eyebrow?: string
  name: string
  subtitle?: string
  resolved: boolean
  onAdd: () => void
  bookAction?: ReservasBookAction | { label: string; href: string | null; onGet?: () => void }
  resolvedLabel?: string
  trailing?: ReactNode
  /** El puntito de urgencia junto a la categoría (rojo, ámbar o gris) mientras no está reservado. */
  priority?: ReadinessPriority
}) {
  const style = KIND_STYLE[kind]
  return (
    <div
      className="relative flex min-h-[84px] w-full bg-white transition-colors"
      style={{
        borderRadius: 18,
        border: `1px solid ${resolved ? GREEN : 'rgba(28,34,48,.08)'}`,
        boxShadow: '0 1px 2px rgba(28,34,48,.05),0 10px 24px -18px rgba(28,34,48,.35)',
      }}
    >
      <button type="button" onClick={onAdd} aria-label={name} className="relative w-[74px] shrink-0 overflow-hidden text-white" style={{ borderRadius: '17px 0 0 17px' }}>
        <span aria-hidden="true" className="absolute inset-0" style={{ clipPath: 'polygon(0 0,100% 0,calc(100% - 18px) 100%,0 100%)', background: style.color }} />
        <span aria-hidden="true" className="absolute bottom-0 left-0 top-0 flex w-[58px] items-center justify-center">
          <ReadinessKindIcon kind={kind} className="h-[22px] w-[22px]" />
        </span>
      </button>
      <button type="button" onClick={onAdd} className="flex min-w-0 flex-1 flex-col justify-center gap-[3px] py-2 pl-2.5 pr-2 text-left">
        <span className="flex items-center gap-1.5 text-text/50" style={{ font: "500 10px 'Geist Mono',monospace", letterSpacing: '.1em', textTransform: 'uppercase' }}>
          {priority && !resolved && <span aria-hidden="true" title="Urgencia" className="h-[7px] w-[7px] shrink-0 rounded-full" style={{ background: PRIORITY_DOT[priority] }} />}
          {eyebrow ?? style.eyebrow}
        </span>
        <span className="truncate font-display text-text" style={{ fontSize: 18, lineHeight: 1.1 }}>
          {name}
        </span>
        {subtitle && <span className="truncate text-text/55" style={{ font: "400 11.5px 'Geist'" }}>{subtitle}</span>}
      </button>
      {trailing ? (
        <div className="flex shrink-0 items-center pr-3">{trailing}</div>
      ) : (
        <div className="flex shrink-0 flex-col items-end justify-center gap-[5px] pr-3">
          {resolved ? (
            <button
              type="button"
              onClick={onAdd}
              className="whitespace-nowrap"
              style={{ height: 30, padding: '0 12px', borderRadius: 999, border: '1.5px solid #1C2230', background: '#1C2230', color: '#FFFDF8', font: "600 12px 'Geist'" }}
            >
              {resolvedLabel}
            </button>
          ) : (
            <>
              <button type="button" onClick={onAdd} className="text-text/55" style={{ font: "500 11px 'Geist'" }}>
                Añadir
              </button>
              {bookAction && bookAction.href ? (
                <a
                  href={bookAction.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={bookAction.onGet}
                  className="flex items-center whitespace-nowrap"
                  style={{ height: 30, padding: '0 12px', borderRadius: 999, border: '1.5px solid oklch(0.8 0.1 50)', background: 'oklch(0.93 0.06 55)', color: 'oklch(0.48 0.15 40)', font: "600 12px 'Geist'" }}
                >
                  {bookAction.label}
                </a>
              ) : (
                <button
                  type="button"
                  onClick={onAdd}
                  className="whitespace-nowrap"
                  style={{ height: 30, padding: '0 12px', borderRadius: 999, border: '1.5px solid oklch(0.8 0.1 50)', background: 'oklch(0.93 0.06 55)', color: 'oklch(0.48 0.15 40)', font: "600 12px 'Geist'" }}
                >
                  Añadir +
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Fila compartida para cualquier ítem de RESERVAS (transporte, alojamiento, seguro, N26, vehículo de alquiler, eSIM) — mismo estilo en toda la app:
 * pestaña RESERVAS y panel rápido del % (TripReadinessQuickPanel.tsx vía ReadinessBreakdownRow). Sin resolver y con `bookAction`: «Añadir» (abre la
 * ficha manual, `onClick`) y la vía de compra real (`bookAction`) conviven en la misma tarjeta. Resuelto: «✓ Añadido», que reabre la ficha para editar.
 */
export function ReservasItemRow({ kind, label, resolved, subtitle, onClick, bookAction, priority }: ReservasItemRowProps) {
  return <ReservaCard kind={kind} name={label} subtitle={subtitle} resolved={resolved} onAdd={onClick} bookAction={bookAction} priority={priority} />
}
