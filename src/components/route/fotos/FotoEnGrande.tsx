import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { FotoViaje } from '../../../lib/fotosViaje'
import { Icono } from '../../ui/Icono'

/**
 * Una foto del viaje en grande (Tanda 6z6): la grande («foto.url») solo se descarga aquí, al abrirla; las listas enseñan la copia pequeña. Un toque (o Escape) la cierra.
 */
export function FotoEnGrande({ foto, onCerrar }: { foto: FotoViaje | null; onCerrar: () => void }) {
  useEffect(() => {
    if (!foto) return
    const alTeclear = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') onCerrar()
    }
    window.addEventListener('keydown', alTeclear)
    return () => window.removeEventListener('keydown', alTeclear)
  }, [foto, onCerrar])
  if (!foto || !foto.url) return null
  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#1C2230]/90 p-3" role="dialog" aria-modal="true" aria-label="Foto en grande" onClick={onCerrar}>
      <img src={foto.url} alt={foto.stopName ?? 'Foto del viaje'} className="max-h-full max-w-full rounded-xl object-contain" />
      <button type="button" onClick={onCerrar} aria-label="Cerrar" className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-[#FFFDF8] text-[#1C2230]">
        <Icono nombre="cerrar" size={16} />
      </button>
    </div>,
    document.body,
  )
}
