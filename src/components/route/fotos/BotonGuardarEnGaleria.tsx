import { useState } from 'react'
import { guardarEnGaleria } from '../../../lib/guardarEnGaleria'

/** El icono de «guardar»: una flecha hacia abajo sobre una bandeja, de trazo fino, sin relleno. */
const GUARDAR = 'M12 4v11M7.5 10.5L12 15l4.5-4.5M5 19h14'

/**
 * (HOY2b 7) [Guardar en mi galería]: junto a «Guardada en los recuerdos de hoy» y en cada foto en grande del álbum. `foto`: el archivo o la dirección de la foto. Si falla, lo dice en el propio botón.
 * (iPhone: la hoja de compartir con «Guardar imagen»; Android: se descarga. Ver `src/lib/guardarEnGaleria.ts`.)
 */
export function BotonGuardarEnGaleria({ foto, oscuro = true, className = '' }: { foto: Blob | string; oscuro?: boolean; className?: string }) {
  const [estado, setEstado] = useState<'libre' | 'guardando' | 'hecho' | 'error'>('libre')
  const tocar = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setEstado('guardando')
    const r = await guardarEnGaleria(foto)
    setEstado(r === 'error' ? 'error' : r === 'cancelada' ? 'libre' : 'hecho')
  }
  return (
    <button
      type="button"
      onClick={(e) => void tocar(e)}
      disabled={estado === 'guardando'}
      data-guardar-en-galeria={estado}
      className={`flex min-h-11 flex-none items-center gap-1.5 rounded-full px-3 text-[12.5px] font-semibold ${className}`}
      style={{ color: oscuro ? 'rgba(251,243,226,.85)' : 'rgba(28,34,48,.7)', border: `1px solid ${oscuro ? 'rgba(251,243,226,.35)' : 'rgba(28,34,48,.25)'}`, background: 'transparent' }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d={GUARDAR} />
      </svg>
      {estado === 'hecho' ? 'Hecho' : estado === 'error' ? 'No se ha podido guardar' : 'Guardar en mi galería'}
    </button>
  )
}
