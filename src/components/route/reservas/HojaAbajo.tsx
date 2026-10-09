import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

/**
 * La hoja que sube desde abajo de RESERVAS (Tanda 6s): con su tirador y su cruz, igual que la hoja de la hora de las entradas. En el ordenador, centrada.
 * `titleId` es el id del título que lleva (para los lectores de pantalla); `onClose` también al pulsar fuera o Escape.
 */
export function HojaAbajo({ titleId, onClose, children, ancha = false, capa = 90 }: { titleId: string; onClose: () => void; children: ReactNode; ancha?: boolean; capa?: number }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return createPortal(
    <div className="fixed inset-0 flex items-end justify-center md:items-center" style={{ zIndex: capa }} role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <div className="trazo-notice-backdrop absolute inset-0 bg-text/25 backdrop-blur-[6px]" onClick={onClose} />
      <div className={`trazo-notice-panel relative flex max-h-[92dvh] w-full flex-col rounded-t-[28px] bg-bg-card shadow-[0_-8px_40px_-12px_rgba(28,34,48,.35)] md:rounded-[28px] ${ancha ? 'md:w-[560px]' : 'md:w-[440px]'}`}>
        <div className="flex shrink-0 justify-center pt-2.5" aria-hidden="true">
          <span className="h-1 w-[42px] rounded-full bg-text/20" />
        </div>
        <button type="button" onClick={onClose} aria-label="Cerrar" className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-[#F1EADC] text-text hover:bg-bg-hover">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">{children}</div>
      </div>
    </div>,
    document.body,
  )
}

/** La etiqueta pequeña de arriba de una hoja (mono, mayúsculas). */
export const ojoStyle = { font: "600 10px 'Geist Mono',monospace", letterSpacing: '.14em', textTransform: 'uppercase' as const }
