import { useState } from 'react'

interface DayMenuProps {
  onRegenerate: () => void
}

/** Menú oscuro del diseño "Trazo Itinerario". */
const menuItemClass = 'flex h-[42px] w-full items-center rounded-[10px] px-3 text-left text-[14px] font-medium text-[#F3EEE4] hover:bg-[#F3EEE4]/[.08] disabled:cursor-not-allowed disabled:opacity-40'

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
        className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full border border-text/[.14] bg-bg-card text-[14px] font-bold leading-none tracking-[1px] text-text/60 hover:bg-bg-hover"
      >
        ···
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={(event) => (event.stopPropagation(), close())} />
          <div
            onClick={(event) => event.stopPropagation()}
            className="absolute right-0 top-[44px] z-30 flex min-w-[190px] flex-col rounded-2xl bg-[#1C2230] p-1.5 shadow-[0_18px_40px_-12px_rgba(28,34,48,.5)]"
          >
            <button
              type="button"
              onClick={() => {
                close()
                onRegenerate()
              }}
              className={menuItemClass}
            >
              Regenerar este día
            </button>
          </div>
        </>
      )}
    </div>
  )
}
