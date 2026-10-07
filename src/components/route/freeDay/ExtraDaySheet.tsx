import { createPortal } from 'react-dom'

/**
 * «Ya has visto lo mejor de Roma» (Tanda 6g): la hoja del día 7 en adelante y de los destinos sin días escritos. Sube desde abajo con su
 * tirador y su cruz. «Elegir mis sitios» abre EXPLORAR en modo elegir varios (lo cablea quien la use).
 */
export function ExtraDaySheet({ destination, onChoose, onClose }: { destination: string; onChoose: () => void; onClose: () => void }) {
  return createPortal(
    <div className="fixed inset-0 z-[95] flex items-end justify-center md:items-center" role="dialog" aria-modal="true" aria-labelledby="extra-day-heading">
      <div className="trazo-notice-backdrop absolute inset-0 bg-text/25 backdrop-blur-[6px]" onClick={onClose} />
      <div className="trazo-notice-panel relative flex max-h-[88dvh] w-full flex-col rounded-t-[28px] bg-bg-card shadow-[0_-8px_40px_-12px_rgba(28,34,48,.35)] md:w-[440px] md:rounded-[28px]">
        <div className="flex shrink-0 justify-center pt-2.5" aria-hidden="true">
          <span className="h-1 w-[42px] rounded-full bg-text/20" />
        </div>
        <button type="button" onClick={onClose} aria-label="Cerrar" className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full text-text-soft hover:bg-bg-hover">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
        <div className="overflow-y-auto px-6 pt-5">
          <h2 id="extra-day-heading" className="max-w-[calc(100%-2.5rem)] font-display text-[32px] leading-[1.1] text-text">
            Ya has visto lo mejor de {destination}
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-text-soft">
            A partir de aquí, el viaje lo eliges tú: te enseñamos los sitios que aún no has visto para que montes cada día a tu gusto.
          </p>
        </div>
        <div className="px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-6">
          <button type="button" onClick={onChoose} className="h-12 w-full rounded-full bg-text text-[15px] font-medium text-bg transition-transform active:scale-[.98]">
            Elegir mis sitios
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
