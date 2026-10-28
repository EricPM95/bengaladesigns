import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'

/**
 * (Tanda 10N8 §8b-h) EL AVISO DE ABAJO OCUPA EXACTAMENTE EL SITIO DEL MENÚ DE ABAJO (Hoy · Ruta · Días · Explorar · Reservas): mismo alto, mismo ancho y mismas esquinas (las del menú: ninguna),
 * tapándolo entero mientras se ve, sin trozos del menú por encima. La regla vale para CUALQUIER aviso de abajo de la app (Deshacer, «Viaje eliminado», «marcada como visto», «Enlace copiado»…): usan este componente.
 * Se mide el propio menú (`nav[aria-label="Barra del viaje"]`), así vale en Safari, con la app añadida a la pantalla de inicio (otra zona de abajo del iPhone) y si cambia el alto del menú. Sin menú a la vista
 * (pantallas que lo tapan), se pone pegado al borde de abajo con el alto de un menú normal.
 */
const MENU = 'nav[aria-label="Barra del viaje"]'

export function useRectDelMenu(): { left: number; top: number; width: number; height: number } | null {
  const [r, setR] = useState<{ left: number; top: number; width: number; height: number } | null>(null)
  useEffect(() => {
    const medir = () => {
      const nav = document.querySelector(MENU)
      if (!nav) return setR(null)
      const b = nav.getBoundingClientRect()
      if (b.width === 0 || b.height === 0) return setR(null)
      setR((a) => (a && a.left === b.left && a.top === b.top && a.width === b.width && a.height === b.height ? a : { left: b.left, top: b.top, width: b.width, height: b.height }))
    }
    medir()
    const nav = document.querySelector(MENU)
    const ro = typeof ResizeObserver !== 'undefined' && nav ? new ResizeObserver(medir) : null
    if (nav && ro) ro.observe(nav)
    window.addEventListener('resize', medir)
    window.addEventListener('orientationchange', medir)
    window.visualViewport?.addEventListener('resize', medir)
    return () => {
      ro?.disconnect()
      window.removeEventListener('resize', medir)
      window.removeEventListener('orientationchange', medir)
      window.visualViewport?.removeEventListener('resize', medir)
    }
  }, [])
  return r
}

export function AvisoSobreLaBarra({ children, z = 95, estilo, className = '', datos, soloLeer = false }: { children: ReactNode; z?: number; estilo?: CSSProperties; className?: string; datos?: Record<string, string>; soloLeer?: boolean }) {
  const r = useRectDelMenu()
  const caja: CSSProperties = r
    ? { position: 'fixed', left: r.left, top: r.top, width: r.width, height: r.height }
    : { position: 'fixed', left: 0, right: 0, bottom: 0, height: 'calc(72px + env(safe-area-inset-bottom))' }
  return (
    <div
      role="status"
      data-aviso-sobre-barra="1"
      {...datos}
      className={`flex items-center gap-3 px-4 text-[#FBF3E2] ${className}`}
      style={{ ...caja, zIndex: z, background: '#1C2230', boxSizing: 'border-box', borderRadius: 0, paddingBottom: 'env(safe-area-inset-bottom)', pointerEvents: soloLeer ? 'none' : 'auto', ...estilo }}
    >
      {children}
    </div>
  )
}
