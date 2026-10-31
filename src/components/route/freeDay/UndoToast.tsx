import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useAddFlowStore } from '../../../store/useAddFlowStore'
import { usePropuestaStore } from '../../../store/usePropuestaStore'
import { AvisoSobreLaBarra } from '../../ui/AvisoSobreLaBarra'
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
    <AvisoSobreLaBarra z={95}>
      <>
        {/* (10S7, R3) «Hemos reorganizado tu día»: el círculo dorado con el ✓ de Design. */}
        {toast.message.startsWith('Hemos reorganizado') && (
          <span aria-hidden="true" data-aviso-reorganizado="1" style={{ width: 34, height: 34, flex: 'none', borderRadius: '50%', background: '#B58A2E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#1C2230" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7" /></svg>
          </span>
        )}
        <p className="min-w-0 flex-1 truncate text-[14px] font-medium"><span data-aviso-propuesta={enPropuesta ? '1' : undefined}>{enPropuesta ? mensajeDePropuesta(toast.message) : toast.message}</span></p>
        {toast.previous && (
          <button type="button" onClick={undo} className="shrink-0 text-[14px] font-semibold text-accent-gold">
            Deshacer
          </button>
        )}
      </>
    </AvisoSobreLaBarra>,
    document.body,
  )
}
