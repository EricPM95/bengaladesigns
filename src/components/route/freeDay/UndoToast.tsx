import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useAddFlowStore } from '../../../store/useAddFlowStore'
import { usePropuestaStore } from '../../../store/usePropuestaStore'
import { mensajeDePropuesta } from '../../../lib/propuesta'

const TOAST_MS = 6000
/** Sin «Deshacer» (una confirmación sola, «Añadido al Día 3 ✓»): se va antes. */
const CONFIRM_MS = 3000

/** El aviso corto de abajo ("Añadido al Día 3 · Compras"), con "Deshacer". Se va solo a los pocos segundos. */
export function UndoToast() {
  const toast = useAddFlowStore((state) => state.toast)
  const dismiss = useAddFlowStore((state) => state.dismissToast)
  const undo = useAddFlowStore((state) => state.undo)
  // Tanda 10N: quien solo recomienda no cambia SU ruta, cambia su propuesta, y el aviso lo dice.
  const enPropuesta = usePropuestaStore((state) => state.activa)

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(dismiss, toast.previous ? TOAST_MS : CONFIRM_MS)
    return () => window.clearTimeout(timer)
  }, [toast, dismiss])

  if (!toast) return null
  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 bottom-[max(1rem,env(safe-area-inset-bottom))] z-[95] flex justify-center px-4">
      <div role="status" className="pointer-events-auto flex w-full max-w-[420px] items-center gap-3 rounded-2xl bg-text px-4 py-3 text-bg shadow-[0_18px_40px_-12px_rgba(28,34,48,.5)]">
        <p className="min-w-0 flex-1 truncate text-[14px] font-medium"><span data-aviso-propuesta={enPropuesta ? '1' : undefined}>{enPropuesta ? mensajeDePropuesta(toast.message) : toast.message}</span></p>
        {toast.previous && (
          <button type="button" onClick={undo} className="shrink-0 text-[14px] font-semibold text-accent-gold">
            Deshacer
          </button>
        )}
      </div>
    </div>,
    document.body,
  )
}
