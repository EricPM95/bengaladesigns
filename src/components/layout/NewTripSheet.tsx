import { createPortal } from 'react-dom'

/**
 * El «+» de la cabecera: antes de empezar un viaje nuevo se pregunta, con el mismo estilo que «+ Añadir día» (sube desde abajo).
 * El viaje que se tiene abierto no se toca: se guarda tal cual y se puede volver a él desde la cruz del formulario o desde «Mis viajes».
 */
export function NewTripSheet({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-end justify-center md:items-center" role="dialog" aria-modal="true" aria-labelledby="new-trip-heading">
      <div className="trazo-notice-backdrop absolute inset-0 bg-text/25 backdrop-blur-[6px]" onClick={onCancel} />
      <div className="trazo-notice-panel relative w-full rounded-t-[28px] bg-bg-card px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-2.5 shadow-[0_-8px_40px_-12px_rgba(28,34,48,.35)] md:w-[420px] md:rounded-[28px]">
        <div className="flex justify-center" aria-hidden="true">
          <span className="h-1 w-[42px] rounded-full bg-text/20" />
        </div>
        <p className="mt-4 font-mono text-[10.5px] font-medium uppercase tracking-[.16em] text-accent">Nuevo viaje</p>
        <h2 id="new-trip-heading" className="mt-1.5 font-display text-[26px] leading-[1.15] text-text">
          ¿Empezar un viaje nuevo?
        </h2>
        <p className="mt-2 text-[13.5px] leading-snug text-text-soft">Tu viaje de ahora se queda guardado: lo tendrás en «Mis viajes», en tu Perfil.</p>
        <div className="mt-5 flex flex-col gap-2.5">
          <button type="button" onClick={onConfirm} className="h-12 rounded-2xl bg-accent font-semibold text-white transition-colors hover:bg-accent-hover">
            Crear viaje nuevo
          </button>
          <button type="button" onClick={onCancel} className="h-12 rounded-2xl border border-text/[.12] font-semibold text-text transition-colors hover:bg-bg-hover">
            Cancelar
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
