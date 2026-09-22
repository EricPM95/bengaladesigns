import type { ReactNode } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripIcon } from './dayDetail/SortableStop'

interface SortableDayProps {
  id: string
  /** Un día que no se puede mover: llegada, traslado, vuelta. Se pinta igual, pero sin asa. */
  disabled?: boolean
  /** La fila del día. Recibe el asa ya montada para colocarla donde encaje en su maquetación. */
  children: (handle: ReactNode) => ReactNode
}

/**
 * Un día entero que se puede arrastrar para cambiarlo de sitio en el viaje.
 *
 * Hermano de SortableStop, pero con el asa por render prop en vez de flotando a la izquierda: la
 * fila del día es una tarjeta blanca sobre fondo gris, y un asa en posición absoluta fuera de ella
 * quedaría suelta en el fondo. Aquí el asa vive DENTRO de la fila, junto al menú "⋯".
 *
 * El arrastre va por el asa y no por la fila entera por el mismo motivo que en las paradas: tocar
 * la fila ya significa "abre este día", y mezclar los dos gestos convierte cada toque en una
 * lotería.
 */
export function SortableDay({ id, disabled, children }: SortableDayProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id, disabled })

  const handle = disabled ? null : (
    <button
      ref={setActivatorNodeRef}
      type="button"
      {...attributes}
      {...listeners}
      onClick={(event) => event.stopPropagation()}
      aria-label="Mover este día"
      title="Mover este día"
      className="shrink-0 cursor-grab touch-none rounded-lg p-1 text-text-muted transition-colors hover:text-text-soft active:cursor-grabbing"
    >
      <GripIcon />
    </button>
  )

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={isDragging ? 'relative z-10 opacity-60' : ''}
    >
      {children(handle)}
    </div>
  )
}
