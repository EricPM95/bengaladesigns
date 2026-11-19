import { useEffect, useState, type ReactNode } from 'react'
import { ESTILO_FLOTANTE, useFlotantes } from '../flotantes/flotantes'
import { abrirCuentanos, useCuentanosStore } from '../../store/useCuentanosStore'

/**
 * (V20, Design «Botones Flotantes» B1) EL TERCER BOTÓN FLOTANTE, «Cuéntanos»: igual que la cámara y el trofeo (crema con aro dorado), con el icono de aviso, ENCIMA de los demás (de la cámara,
 * del trofeo, del lápiz y de «Reorganizar»). En todas las pestañas y destinos, también sin viaje y sin cuenta. Se coloca midiendo dónde están los otros botones flotantes (los que llevan `data-flotante`),
 * así nunca los tapa aunque haya uno más o uno menos.
 */
const AVISO = 'M10.3 3.9L2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0zM12 9.5v4.5M12 17.2h.01'
const AIRE = 12

export function BotonCuentanos(): ReactNode {
  const { debajo } = useFlotantes()
  const abierto = useCuentanosStore((s) => s.abierto)
  const [bottom, setBottom] = useState<number | null>(null)
  useEffect(() => {
    const medir = () => {
      const vh = window.innerHeight
      const arriba = Array.from(document.querySelectorAll('[data-flotante]'))
        .map((e) => e.getBoundingClientRect())
        .filter((r) => r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < vh)
        .map((r) => r.top)
      setBottom(arriba.length ? Math.round(vh - Math.min(...arriba) + AIRE) : null)
    }
    medir()
    const reloj = window.setInterval(medir, 400)
    window.addEventListener('resize', medir)
    return () => {
      window.clearInterval(reloj)
      window.removeEventListener('resize', medir)
    }
  }, [])
  if (abierto) return null
  return (
    <button
      type="button"
      data-boton-cuentanos="1"
      data-cuentanos="boton"
      aria-label="Cuéntanos"
      onClick={() => abrirCuentanos()}
      className="zona-toque"
      style={{ ...ESTILO_FLOTANTE, position: 'fixed', right: 21, bottom: bottom !== null ? `${bottom}px` : 'calc(env(safe-area-inset-bottom,0px) + 88px)', zIndex: debajo ? 30 : 99, cursor: 'pointer' }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7A5A1E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d={AVISO} />
      </svg>
    </button>
  )
}
