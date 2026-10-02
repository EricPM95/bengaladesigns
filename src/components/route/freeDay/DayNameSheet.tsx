import { useState } from 'react'
import { createPortal } from 'react-dom'
import { FREE_DAY_NAME_MAX } from '../../../lib/freeDays'

/**
 * La ventana del nombre del día (decisión del usuario, 2026-09-28): solo el título, el campo y el botón. Vacío, el día se
 * llama "Día libre". La misma ventana cambia el nombre de un día libre.
 */
export function DayNameSheet({ title, initialName = '', example, confirmLabel, onConfirm, onClose }: { title: string; initialName?: string; example?: string | null; confirmLabel: string; onConfirm: (name: string) => void; onClose: () => void }) {
  const [name, setName] = useState(initialName)
  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-end justify-center md:items-center" role="dialog" aria-modal="true" aria-labelledby="day-name-heading">
      <div className="trazo-notice-backdrop absolute inset-0 bg-text/25 backdrop-blur-[6px]" onClick={onClose} />
      <form
        onSubmit={(event) => {
          event.preventDefault()
          onConfirm(name)
        }}
        className="trazo-notice-panel relative w-full rounded-t-[28px] bg-bg-card px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-6 shadow-[0_-8px_40px_-12px_rgba(28,34,48,.35)] md:w-[420px] md:rounded-[28px]"
      >
        <h2 id="day-name-heading" className="font-display text-[24px] leading-[1.15] text-text">
          {title}
        </h2>
        <label className="mt-4 block">
          <span className="text-[12px] font-medium text-text-soft">Nombre del día</span>
          <input
            autoFocus
            value={name}
            maxLength={FREE_DAY_NAME_MAX}
            onChange={(event) => setName(event.target.value)}
            placeholder={example ? `Por ejemplo: ${example}` : undefined}
            className="mt-1 h-12 w-full rounded-xl border border-text/15 bg-bg px-3.5 text-[15px] text-text placeholder:text-text-muted"
          />
        </label>
        <button type="submit" className="mt-5 h-12 w-full rounded-full bg-text text-[15px] font-medium text-bg transition-transform active:scale-[.98]">
          {confirmLabel}
        </button>
      </form>
    </div>,
    document.body,
  )
}

/** El botón grande de debajo del último día: borde discontinuo terracota, círculo terracota con el "+". */
export function AddDayButton({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex min-h-[68px] w-full items-center justify-center gap-3 rounded-3xl border-[1.5px] border-dashed border-accent/70 bg-transparent px-4 py-3 text-accent transition-colors hover:bg-accent-soft/60 disabled:cursor-not-allowed disabled:opacity-40"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-[22px] leading-none text-white" aria-hidden="true">
        +
      </span>
      <span className="font-display text-[20px] leading-none">{disabled ? 'Máximo 14 días' : 'Añadir día'}</span>
    </button>
  )
}
