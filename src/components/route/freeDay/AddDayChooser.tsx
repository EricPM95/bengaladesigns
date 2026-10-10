import { createPortal } from 'react-dom'
import { BusLineIcon } from '../../ui/LineIcons'
import { useRouteStore } from '../../../store/useRouteStore'
import { diaCorto } from '../../../lib/nombreDeDia'

/**
 * «+ Añadir día», primero qué quieres hacer (PARA_CODE_EXCURSIONES, 5): sube una ventana con su tirador y su cruz con dos opciones grandes,
 * cada una con su icono en un cuadrado de color. «Añadir lugares» sigue como hasta ahora (pide el nombre del día y abre Explorar);
 * «Añadir una excursión» abre la página de excursiones y la excursión va directa al día nuevo. Sin excursiones en el destino, esta ventana
 * no sale (se pide el nombre directamente).
 */
export function AddDayChooser({ dayNumber, examples, onPlaces, onExcursion, onClose }: { dayNumber: number; examples: string | null; onPlaces: () => void; onExcursion: () => void; onClose: () => void }) {
  const route = useRouteStore((state) => state.route)
  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-end justify-center md:items-center" role="dialog" aria-modal="true" aria-labelledby="add-day-chooser-heading">
      <div className="trazo-notice-backdrop absolute inset-0 bg-text/25 backdrop-blur-[6px]" onClick={onClose} />
      <div className="trazo-notice-panel relative w-full rounded-t-[28px] bg-bg-card px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-2.5 shadow-[0_-8px_40px_-12px_rgba(28,34,48,.35)] md:w-[420px] md:rounded-[28px]">
        <div className="flex justify-center" aria-hidden="true">
          <span className="h-1 w-[42px] rounded-full bg-text/20" />
        </div>
        <button type="button" onClick={onClose} aria-label="Cerrar" className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full text-text-soft hover:bg-bg-hover">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
        <p className="mt-4 font-mono text-[10.5px] font-medium uppercase tracking-[.16em] text-accent">{diaCorto(route, dayNumber)} · Nuevo</p>
        <h2 id="add-day-chooser-heading" className="mt-1.5 max-w-[calc(100%-2.5rem)] font-display text-[26px] leading-[1.15] text-text">
          ¿Qué quieres hacer este día?
        </h2>

        <div className="mt-5 flex flex-col gap-2.5">
          <button type="button" onClick={onPlaces} className="flex items-center gap-3.5 rounded-2xl border border-text/[.12] px-3.5 py-3 text-left transition-colors hover:bg-bg-hover">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E4EEDF] text-[#3F6B45]">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z" />
                <circle cx="12" cy="10" r="2.3" />
              </svg>
            </span>
            <span className="min-w-0">
              <span className="block font-display text-[19px] leading-tight text-text">Añadir lugares</span>
              <span className="block text-[13px] text-text-soft">Monumentos, barrios, miradores…</span>
            </span>
          </button>
          <button type="button" onClick={onExcursion} className="flex items-center gap-3.5 rounded-2xl border border-text/[.12] px-3.5 py-3 text-left transition-colors hover:bg-bg-hover">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
              <BusLineIcon className="h-6 w-6" />
            </span>
            <span className="min-w-0">
              <span className="block font-display text-[19px] leading-tight text-text">Añadir una excursión</span>
              {examples && <span className="block text-[13px] text-text-soft">{examples}</span>}
            </span>
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
