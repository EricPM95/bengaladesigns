import { useState } from 'react'

interface DayMenuProps {
  onRegenerate: () => void
}

const menuItemClass = 'w-full rounded-lg px-2 py-1.5 text-left text-small text-text hover:bg-bg-hover'

/**
 * Menú "..." de CABECERA de un día completo (a diferencia de StopMenu.tsx, que es por parada) —
 * por ahora solo "Regenerar este día" (ver DayList.tsx), estructurado como menú por si se añaden
 * más acciones a nivel de día más adelante.
 */
export function DayMenu({ onRegenerate }: DayMenuProps) {
  const [open, setOpen] = useState(false)

  const close = () => setOpen(false)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation()
          setOpen((value) => !value)
        }}
        title="Más opciones del día"
        aria-label="Más opciones del día"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border bg-bg-card text-text-muted shadow-sm hover:bg-bg-hover"
      >
        ⋯
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={(event) => (event.stopPropagation(), close())} />
          <div
            onClick={(event) => event.stopPropagation()}
            className="absolute right-0 top-8 z-30 w-56 rounded-xl border border-border bg-bg-card p-2 shadow-md"
          >
            <button
              type="button"
              onClick={() => {
                close()
                onRegenerate()
              }}
              className={menuItemClass}
            >
              🔄 Regenerar este día
            </button>
          </div>
        </>
      )}
    </div>
  )
}
