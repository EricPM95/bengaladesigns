import { useRef, type CSSProperties, type ReactNode } from 'react'

/**
 * V45 §6 (regla en CLAUDE.md): el aviso que SOLO INFORMA («Enlace copiado», «Foto guardada») va ARRIBA, bajo la cabecera, y se va solo a los 5 s o deslizándolo. Los que llevan [Deshacer] van ABAJO tapando el menú
 * (`AvisoSobreLaBarra`). Es la misma pieza que usa HOY (`AvisoDeAbajoHost`, que además junta los que coinciden): aquí, para el resto de la app. Quien lo pinta se encarga de quitarlo a los 5 s (`onIrse` al deslizarlo).
 */
export function AvisoArriba({ children, z = 85, datos, estilo, onIrse }: { children: ReactNode; z?: number; datos?: Record<string, string>; estilo?: CSSProperties; onIrse?: () => void }) {
  const inicio = useRef<{ x: number; y: number } | null>(null)
  const cabecera = typeof document !== 'undefined' ? document.querySelector('header')?.getBoundingClientRect().bottom : null
  return (
    <div className="pointer-events-none fixed inset-x-0 px-[14px]" style={{ zIndex: z, top: Math.max(cabecera ?? 0, 56) + 8 }}>
      <div
        role="status"
        data-aviso-arriba="1"
        {...datos}
        onTouchStart={(e) => {
          inicio.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
        }}
        onTouchEnd={(e) => {
          const i = inicio.current
          inicio.current = null
          if (!i) return
          if (Math.abs(e.changedTouches[0].clientX - i.x) > 50 || e.changedTouches[0].clientY - i.y < -30) onIrse?.()
        }}
        className="pointer-events-auto flex min-h-12 w-full items-center gap-2 rounded-[15px] px-3.5 py-2.5 text-[13px] font-medium leading-[1.35]"
        style={{ background: '#1C2230', color: '#FBF3E2', boxShadow: '0 14px 22px -14px rgba(28,34,48,.6)', ...estilo }}
      >
        {children}
      </div>
    </div>
  )
}
