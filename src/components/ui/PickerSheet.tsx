import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Icono } from './Icono'

/**
 * La hoja desde abajo de los selectores de fecha y de hora (Tanda 6k, punto 8): la misma para toda la app. Se cierra con el fondo, con Escape
 * y con la «x»; `onDone` es el botón de abajo.
 */
export function PickerSheet({ title, children, onClose, onDone, doneLabel = 'Listo', doneDisabled = false }: { title: string; children: ReactNode; onClose: () => void; onDone: () => void; doneLabel?: string; doneDisabled?: boolean }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onClose()
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [onClose])
  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-end justify-center md:items-center" role="dialog" aria-modal="true" aria-label={title}>
      <div className="trazo-notice-backdrop absolute inset-0 bg-text/25 backdrop-blur-[6px]" onClick={onClose} />
      <div className="trazo-notice-panel relative flex max-h-[92dvh] w-full flex-col rounded-t-[28px] bg-bg-card shadow-[0_-8px_40px_-12px_rgba(28,34,48,.35)] md:w-[400px] md:rounded-[28px]">
        <div className="flex shrink-0 justify-center pt-2.5" aria-hidden="true">
          <span className="h-1 w-[42px] rounded-full bg-text/20" />
        </div>
        <button type="button" onClick={onClose} aria-label="Cerrar" className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full text-text-soft hover:bg-bg-hover">
          <Icono nombre="cerrar" className="h-5 w-5" />
        </button>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-2 pt-4">
          <h2 className="max-w-[calc(100%-2.5rem)] font-display text-[24px] leading-[1.15] text-text">{title}</h2>
          <div className="mt-4">{children}</div>
        </div>
        <div className="px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3">
          <button type="button" disabled={doneDisabled} onClick={onDone} className="h-12 w-full rounded-full bg-text text-[15px] font-medium text-bg transition-transform active:scale-[.98] disabled:opacity-40">
            {doneLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

/** El aspecto del botón que abre una hoja de fecha o de hora: el mismo que tenían los campos del sistema. */
export const FIELD_BUTTON_CLASS = 'mt-1 flex h-11 w-full items-center justify-between rounded-xl border border-text/15 bg-bg px-3 text-left text-[15px] text-text'
