import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AvisoArriba } from '../../ui/AvisoArriba'

/**
 * (V63 §12) El aviso de arriba (solo informa, 5 s, sin [Deshacer]: la parada ya está añadida) cuando se añade un sitio a un día en que cierra. Pieza común de la app: `AvisoArriba`.
 */
export function AvisoDeCierreAlAnadir({ texto, onIrse }: { texto: string; onIrse: () => void }) {
  useEffect(() => {
    const t = window.setTimeout(onIrse, 5000)
    return () => window.clearTimeout(t)
  }, [texto]) // eslint-disable-line react-hooks/exhaustive-deps
  return createPortal(
    <AvisoArriba z={95} datos={{ 'data-aviso-cierre-al-anadir': '' }} onIrse={onIrse}>
      {texto}
    </AvisoArriba>,
    document.body,
  )
}
