import { useState } from 'react'

/** Las acciones de un día libre (decisión del usuario, 2026-09-28). Sin ellas, el menú es el de un día nuestro. */
export interface FreeDayMenuActions {
  onAddPlaces: () => void
  onRename: () => void
  onMoveBefore: (() => void) | null
  onMoveAfter: (() => void) | null
  /** Solo en los días que ha añadido el viajero: los nuestros no se quitan. */
  onRemove: (() => void) | null
}

interface DayMenuProps {
  onRegenerate?: () => void
  freeDay?: FreeDayMenuActions
}

/** Menú oscuro del diseño "Trazo Itinerario". */
const menuItemClass = 'flex h-[42px] w-full items-center rounded-[10px] px-3 text-left text-[14px] font-medium text-[#F3EEE4] hover:bg-[#F3EEE4]/[.08] disabled:cursor-not-allowed disabled:opacity-40'

/**
 * Menú "..." de CABECERA de un día completo (a diferencia de StopMenu.tsx, que es por parada): "Regenerar este día" en
 * los días nuestros; en un día libre, añadir lugares, cambiar el nombre, moverlo y quitarlo.
 */
export function DayMenu({ onRegenerate, freeDay }: DayMenuProps) {
  const [open, setOpen] = useState(false)

  const close = () => setOpen(false)
  const item = (label: string, action: (() => void) | null | undefined, danger = false) =>
    action === undefined ? null : (
      <button
        key={label}
        type="button"
        disabled={action === null}
        onClick={() => {
          close()
          action?.()
        }}
        className={menuItemClass}
      >
        {danger ? <span className="text-[oklch(0.75_0.15_25)]">{label}</span> : label}
      </button>
    )

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
            className="absolute right-0 top-[44px] z-30 flex min-w-[210px] flex-col rounded-2xl bg-[#1C2230] p-1.5 shadow-[0_18px_40px_-12px_rgba(28,34,48,.5)]"
          >
            {freeDay ? (
              <>
                {item('Añadir lugares', freeDay.onAddPlaces)}
                {item('Cambiar el nombre', freeDay.onRename)}
                {item('Mover el día antes', freeDay.onMoveBefore)}
                {item('Mover el día después', freeDay.onMoveAfter)}
                {freeDay.onRemove && item('Quitar este día', freeDay.onRemove, true)}
              </>
            ) : (
              item('Regenerar este día', onRegenerate)
            )}
          </div>
        </>
      )}
    </div>
  )
}
