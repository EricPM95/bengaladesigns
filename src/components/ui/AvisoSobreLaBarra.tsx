import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'

/**
 * (Tanda 10N8 §8b-h) EL AVISO DE ABAJO OCUPA EXACTAMENTE EL SITIO DEL MENÚ DE ABAJO (Hoy · Ruta · Días · Explorar · Reservas): mismo alto, mismo ancho y mismas esquinas (las del menú: ninguna),
 * tapándolo entero mientras se ve, sin trozos del menú por encima. La regla vale para CUALQUIER aviso de abajo de la app (Deshacer, «Viaje eliminado», «Has visto …», «Enlace copiado»…): usan este componente.
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
    // (V63 §2) El menú de abajo no siempre ha acabado de colocarse cuando sale el aviso (una hoja que se cierra, la barra de Safari…): se vuelve a medir cada fotograma mientras el aviso está a la vista
    // (un solo `getBoundingClientRect`, sin repintar si no cambia), así el aviso nunca se queda más abajo que el menú ni deja ver un trozo de él.
    let raf = 0
    const vigilar = () => {
      medir()
      raf = window.requestAnimationFrame(vigilar)
    }
    raf = window.requestAnimationFrame(vigilar)
    const nav = document.querySelector(MENU)
    const ro = typeof ResizeObserver !== 'undefined' && nav ? new ResizeObserver(medir) : null
    if (nav && ro) ro.observe(nav)
    window.addEventListener('resize', medir)
    window.addEventListener('orientationchange', medir)
    window.visualViewport?.addEventListener('resize', medir)
    return () => {
      window.cancelAnimationFrame(raf)
      ro?.disconnect()
      window.removeEventListener('resize', medir)
      window.removeEventListener('orientationchange', medir)
      window.visualViewport?.removeEventListener('resize', medir)
    }
  }, [])
  return r
}

/**
 * (V63 §1) Mientras hay un aviso de abajo a la vista, las hojas (`[role=dialog][aria-modal]`) empiezan justo ENCIMA de él (regla en `src/index.css`, con `--aviso-alto`): nunca un aviso tapa un botón de una hoja.
 * Se cuentan los avisos a la vista y, cuando se va el último, la hoja baja a su sitio.
 */
let avisosAbiertos = 0
function ponerAlturaDeAviso(alto: number | null) {
  const el = document.documentElement
  if (alto == null) {
    el.removeAttribute('data-aviso-abajo')
    el.style.removeProperty('--aviso-alto')
  } else {
    el.setAttribute('data-aviso-abajo', '1')
    el.style.setProperty('--aviso-alto', `${Math.max(0, Math.round(alto))}px`)
  }
}

/**
 * (V63 §3) La línea de tiempo: en el borde de arriba del aviso, una línea dorada fina que se acorta de derecha a izquierda mientras dura el aviso (`total` ms; `transcurrido` ms si ya llevaba un rato a la vista).
 * Solo dibuja el plazo que ya tenía cada aviso: no lo cambia. Silenciosa (sin sonido).
 */
export interface LineaDeTiempo {
  total: number
  transcurrido?: number
  /** Para reiniciarla cuando sale otro aviso en el mismo sitio. */
  clave?: string | number
}

export function AvisoSobreLaBarra({ children, z = 95, estilo, className = '', datos, soloLeer = false, linea }: { children: ReactNode; z?: number; estilo?: CSSProperties; className?: string; datos?: Record<string, string>; soloLeer?: boolean; linea?: LineaDeTiempo }) {
  const r = useRectDelMenu()
  const caja: CSSProperties = r
    ? { position: 'fixed', left: r.left, top: r.top, width: r.width, height: r.height }
    : { position: 'fixed', left: 0, right: 0, bottom: 0, height: 'calc(66px + max(0.625rem, env(safe-area-inset-bottom)))' }
  const altoDeLaHoja = r ? window.innerHeight - r.top : 76
  useEffect(() => {
    avisosAbiertos += 1
    return () => {
      avisosAbiertos = Math.max(0, avisosAbiertos - 1)
      if (avisosAbiertos === 0) ponerAlturaDeAviso(null)
    }
  }, [])
  useEffect(() => {
    ponerAlturaDeAviso(altoDeLaHoja)
  }, [altoDeLaHoja])
  return (
    <div
      role="status"
      data-aviso-sobre-barra="1"
      {...datos}
      className={`flex items-center gap-3 px-4 text-[#FBF3E2] ${className}`}
      style={{ ...caja, zIndex: z, background: '#1C2230', boxSizing: 'border-box', borderRadius: 0, paddingBottom: 'env(safe-area-inset-bottom)', pointerEvents: soloLeer ? 'none' : 'auto', ...estilo }}
    >
      {linea && linea.total > 0 && (
        <span
          key={linea.clave ?? 'linea'}
          aria-hidden="true"
          data-aviso-linea="1"
          style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: 2, background: '#E9C77A', transformOrigin: '0 50%', pointerEvents: 'none', animation: `avisoLinea ${linea.total}ms linear ${-Math.min(linea.total, Math.max(0, linea.transcurrido ?? 0))}ms both` }}
        />
      )}
      {children}
    </div>
  )
}
