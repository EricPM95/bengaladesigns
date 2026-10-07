/** El aviso al pasar a Roma con la excursión reservada: la reserva sigue en Civitatis (Tanda 6g). */
interface SwitchToRomaWarningProps {
  excursionName: string
  code: string | null
  onConfirm: () => void
  onCancel: () => void
}

export function SwitchToRomaWarning({ excursionName, code, onConfirm, onCancel }: SwitchToRomaWarningProps) {
  const codeText = code ? ` (${code})` : ''
  return (
    <div
      role="alertdialog"
      aria-label="Cambiar a Roma"
      onClick={(e) => e.stopPropagation()}
      className="flex flex-col gap-2.5 rounded-2xl border border-accent/30 bg-accent-soft/70 p-3.5"
    >
      <span className="text-[13.5px] leading-[1.5] text-text">
        Tienes reservada la excursión a {excursionName}
        {codeText}. Si cambias a Roma, la reserva sigue en Civitatis: si no vas a ir, cancélala allí
      </span>
      <span className="flex gap-2">
        <button type="button" onClick={onConfirm} className="min-h-[44px] flex-1 rounded-full bg-text px-3 text-[13px] font-semibold text-bg-card">
          Cambiar a Roma
        </button>
        <button type="button" onClick={onCancel} className="min-h-[44px] flex-1 rounded-full border border-text/20 bg-bg-card px-3 text-[13px] font-semibold text-text">
          Seguir con la excursión
        </button>
      </span>
    </div>
  )
}
