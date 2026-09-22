import type { ReactNode } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

/**
 * Una parada que se puede arrastrar para cambiarla de sitio dentro de su día.
 *
 * El arrastre va por un ASA propia, no por la tarjeta entera. La tarjeta ya tiene un gesto: tocarla
 * abre la ficha del lugar. Si el arrastre viviera en toda la tarjeta, cada intento de abrir una
 * parada en un móvil sería una lotería entre abrir y mover — el fallo clásico de meter drag donde
 * ya hay tap.
 *
 * El asa aparece al pasar por encima en escritorio y está siempre visible en táctil (no hay hover
 * que valga en un dedo). `touch-none` es obligatorio: sin él, el navegador se queda el gesto para
 * hacer scroll y el arrastre no llega a empezar.
 */
export function SortableStop({ id, disabled, children }: { id: string; disabled?: boolean; children: ReactNode }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id, disabled })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={`group relative ${isDragging ? 'z-10 opacity-60' : ''}`}
    >
      {!disabled && (
        <button
          ref={setActivatorNodeRef}
          type="button"
          {...attributes}
          {...listeners}
          aria-label="Mover esta parada"
          title="Mover esta parada"
          className="absolute -left-1 top-1/2 z-10 -translate-y-1/2 cursor-grab touch-none rounded-lg p-1 text-text-muted opacity-0 transition-opacity hover:text-text-soft focus-visible:opacity-100 group-hover:opacity-100 active:cursor-grabbing max-[768px]:opacity-60"
        >
          <GripIcon />
        </button>
      )}
      {children}
    </div>
  )
}

/**
 * Trazo fino y gris, sin relleno — regla de iconos funcionales del proyecto.
 *
 * Líneas y no los seis puntos del asa habitual: a 16 px cada punto mide punto y medio y el asa
 * quedaba invisible sobre blanco. Estas tres líneas se leen igual de finas y sí se ven.
 */
export function GripIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="h-4 w-4">
      <path d="M5 8h14M5 12h14M5 16h14" />
    </svg>
  )
}
