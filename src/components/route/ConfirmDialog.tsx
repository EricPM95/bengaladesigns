import { createPortal } from 'react-dom'

/**
 * Una pregunta antes de algo que no se deshace (retocar la ruta, decisión del usuario 2026-09-28): volver a la ruta
 * original, regenerar un día con cambios. El mismo panel que "Quiero entrar" y las fechas (diseño Trazo), en el body.
 */
export function ConfirmDialog({ eyebrow, text, detail, confirmLabel, cancelLabel = 'Mejor no', onConfirm, onCancel }: { eyebrow: string; text: string; detail?: string; confirmLabel: string; cancelLabel?: string; onConfirm: () => void; onCancel: () => void }) {
  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center md:items-center" role="dialog" aria-modal="true" aria-labelledby="confirm-heading">
      <div className="trazo-notice-backdrop absolute inset-0 bg-text/25 backdrop-blur-[6px]" onClick={onCancel} />
      <div className="trazo-notice-panel relative w-full rounded-t-[28px] bg-bg-card px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-6 shadow-[0_-8px_40px_-12px_rgba(28,34,48,.35)] md:w-[420px] md:rounded-[28px]">
        <p className="font-mono text-[10.5px] font-medium uppercase tracking-[.16em] text-accent">{eyebrow}</p>
        <h2 id="confirm-heading" className="mt-2 font-display text-[24px] leading-[1.15] text-text">
          {text}
        </h2>
        {detail && <p className="mt-2 text-[14.5px] leading-snug text-text-soft">{detail}</p>}
        <div className="mt-5 flex gap-2">
          <button type="button" onClick={onCancel} className="h-12 flex-1 rounded-full border border-text/15 text-[15px] font-medium text-text transition-colors hover:bg-bg-hover">
            {cancelLabel}
          </button>
          <button type="button" onClick={onConfirm} className="h-12 flex-1 rounded-full bg-text text-[15px] font-medium text-bg transition-transform active:scale-[.98]">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

/** "el día 2" / "el día 2 y el día 3": los días con cambios del viajero. */
export function changedDaysText(dayNumbers: number[]): string {
  const parts = dayNumbers.map((n) => `el día ${n}`)
  return parts.length <= 1 ? (parts[0] ?? '') : `${parts.slice(0, -1).join(', ')} y ${parts.at(-1)}`
}
