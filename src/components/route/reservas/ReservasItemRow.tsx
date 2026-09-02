import type { ReadinessItemKind } from '../../../lib/readiness'
import { CheckIcon, PlusIcon, ReadinessKindIcon } from './ReadinessIcons'

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
}

const rowBaseClass = 'flex w-full items-center gap-3 border-l-[3px] py-3 pl-3 pr-2 text-left transition-colors hover:bg-bg-hover'
const labelBlockClass = 'min-w-0 flex-1'

function iconSlotClass(resolved: boolean) {
  return `flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
    resolved ? 'bg-accent-soft text-accent' : 'bg-bg-hover text-text-muted'
  }`
}

function RowIconAndLabel({ kind, label, subtitle, resolved }: { kind: ReadinessItemKind; label: string; subtitle?: string; resolved: boolean }) {
  return (
    <>
      <span className={iconSlotClass(resolved)}>
        <ReadinessKindIcon kind={kind} />
      </span>
      <div className={labelBlockClass}>
        <p className="truncate text-small font-semibold text-text">{label}</p>
        {subtitle && <p className="truncate text-caption text-text-soft">{subtitle}</p>}
      </div>
    </>
  )
}

/**
 * Fila compartida para cualquier ítem de RESERVAS (transporte, alojamiento, seguro, N26, vehículo
 * de alquiler, eSIM) — mismo estilo en toda la app: pestaña RESERVAS, panel rápido del %
 * (TripReadinessQuickPanel.tsx vía ReadinessBreakdownRow), no hay una variante distinta. Fila plana
 * (sin fondo de color ni tarjeta propia) pensada para vivir dentro de una lista con `divide-y` — el
 * único acento de color es el borde izquierdo de 3px (rojo pendiente / verde añadido).
 *
 * Sin resolver y con `bookAction`: dos acciones en la misma fila — "Añadir" (abre la ficha manual,
 * `onClick`, texto discreto sin caja) y la vía de compra real (`bookAction`, botón pastel verde
 * suave, para no competir visualmente con el resto de CTAs de la app). Sin `bookAction` (no debería
 * pasar ya que todos los ítems lo tienen, pero queda de red de seguridad), cae al texto único
 * "Añadir +". Resuelto: toda la fila es un único botón "✓ Añadido" (texto, sin caja) que reabre la
 * ficha para editar.
 */
export function ReservasItemRow({ kind, label, resolved, subtitle, onClick, bookAction }: ReservasItemRowProps) {
  const accentBorderClass = resolved ? 'border-accent' : 'border-accent-red'

  if (resolved) {
    return (
      <button type="button" onClick={onClick} className={`${rowBaseClass} ${accentBorderClass}`}>
        <RowIconAndLabel kind={kind} label={label} subtitle={subtitle} resolved />
        <span className="flex shrink-0 items-center gap-1 text-caption font-semibold text-accent-hover">
          <CheckIcon />
          Añadido
        </span>
      </button>
    )
  }

  if (bookAction) {
    return (
      <div className={`flex w-full items-center gap-3 border-l-[3px] ${accentBorderClass} py-3 pl-3 pr-2`}>
        <button type="button" onClick={onClick} className="flex min-w-0 flex-1 items-center gap-3 text-left">
          <RowIconAndLabel kind={kind} label={label} subtitle={subtitle} resolved={false} />
        </button>
        <div className="flex w-28 shrink-0 flex-col items-stretch gap-1.5">
          <button
            type="button"
            onClick={onClick}
            className="rounded-lg py-1 text-center text-caption font-semibold text-text-soft transition-colors hover:text-text"
          >
            Añadir
          </button>
          <a href={bookAction.href} target="_blank" rel="noopener noreferrer" onClick={bookAction.onGet}>
            <span className="block rounded-lg border border-accent/30 bg-accent-soft py-1 text-center text-caption font-semibold text-accent-hover transition-colors hover:bg-accent-soft/70">
              {bookAction.label}
            </span>
          </a>
        </div>
      </div>
    )
  }

  return (
    <button type="button" onClick={onClick} className={`${rowBaseClass} ${accentBorderClass}`}>
      <RowIconAndLabel kind={kind} label={label} subtitle={subtitle} resolved={false} />
      <span className="flex shrink-0 items-center gap-1 text-caption font-semibold text-text-soft">
        Añadir
        <PlusIcon />
      </span>
    </button>
  )
}
