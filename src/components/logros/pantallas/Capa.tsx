import { createContext, useContext, useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

/**
 * La capa de una pantalla completa de los logros (8C2): se pinta en el `body` por encima del Perfil (z-80) y de la barra de abajo, y por debajo de las películas y los avisos de lo ganado.
 * Con `oscura` el fondo es el de la vitrina; si no, el papel de la app. Las pantallas ponen dentro su propia cabecera y su [‹ Volver] (mínimo 44 px de toque).
 */
/** La pila lo pone a true en las pantallas que quedan debajo de la de arriba: siguen montadas (guardan su sitio en la lista) pero no se ven. */
export const CapaOculta = createContext(false)

export function Capa({ children, etiqueta, oscura = false, fondo }: { children: ReactNode; etiqueta: string; oscura?: boolean; fondo?: string }): ReactNode {
  const oculta_ = useContext(CapaOculta)
  useEffect(() => {
    const previo = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previo
    }
  }, [])
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={etiqueta}
      data-pantalla-logros={etiqueta}
      className="fixed inset-0 z-[80] flex flex-col"
      style={{ background: fondo ?? (oscura ? 'radial-gradient(circle at 50% 0%,#1E2648 0%,#0B0E1C 80%)' : '#F4EEE3'), color: oscura ? '#FFFDF8' : '#1C2230', fontFamily: "'Geist',system-ui,sans-serif", paddingTop: 'env(safe-area-inset-top)', display: oculta_ ? 'none' : 'flex' }}
    >
      {children}
    </div>,
    document.body,
  )
}
