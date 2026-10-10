import { createPortal } from 'react-dom'
import { Icono } from '../../ui/Icono'

/**
 * «¿Ajustamos tu ruta a tu vuelo?»: sube desde abajo al poner la hora de llegada o de salida, con el mismo estilo que «+ Añadir día».
 * La primera opción hace lo que la app ya hacía con «Optimizar ruta» en los días con oportunidad; la segunda deja la ruta como está.
 */
export function FlightAdjustSheet({ onAuto, onManual, onClose }: { onAuto: () => void; onManual: () => void; onClose: () => void }) {
  return createPortal(
    <div className="fixed inset-0 z-[95] flex items-end justify-center md:items-center" role="dialog" aria-modal="true" aria-labelledby="flight-adjust-heading">
      <div className="trazo-notice-backdrop absolute inset-0 bg-text/25 backdrop-blur-[6px]" onClick={onClose} />
      <div className="trazo-notice-panel relative w-full rounded-t-[28px] bg-bg-card px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-2.5 shadow-[0_-8px_40px_-12px_rgba(28,34,48,.35)] md:w-[420px] md:rounded-[28px]">
        <div className="flex justify-center" aria-hidden="true">
          <span className="h-1 w-[42px] rounded-full bg-text/20" />
        </div>
        <button type="button" onClick={onClose} aria-label="Cerrar" className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full text-text-soft hover:bg-bg-hover">
          <Icono nombre="cerrar" className="h-5 w-5" />
        </button>
        <p className="mt-4 font-mono text-[10.5px] font-medium uppercase tracking-[.16em] text-accent">Tu vuelo</p>
        <h2 id="flight-adjust-heading" className="mt-1.5 max-w-[calc(100%-2.5rem)] font-display text-[26px] leading-[1.15] text-text">
          ¿Ajustamos tu ruta a tu vuelo?
        </h2>
        <div className="mt-5 flex flex-col gap-2.5">
          <button type="button" onClick={onAuto} className="flex items-center gap-3.5 rounded-2xl border border-text/[.12] px-3.5 py-3 text-left transition-colors hover:bg-bg-hover">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
              <Icono nombre="reorg" className="h-6 w-6" />
            </span>
            <span className="min-w-0">
              <span className="block font-display text-[19px] leading-tight text-text">Sí, ajústala por mí</span>
              <span className="block text-[13px] text-text-soft">Movemos tu primer y tu último día a tus horas.</span>
            </span>
          </button>
          <button type="button" onClick={onManual} className="flex items-center gap-3.5 rounded-2xl border border-text/[.12] px-3.5 py-3 text-left transition-colors hover:bg-bg-hover">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E4EEDF] text-[#3F6B45]">
              <Icono nombre="lapiz" className="h-6 w-6" />
            </span>
            <span className="min-w-0">
              <span className="block font-display text-[19px] leading-tight text-text">No, lo hago yo</span>
              <span className="block text-[13px] text-text-soft">Tu ruta se queda como está. Arriba ves el tiempo que tienes cada día.</span>
            </span>
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
