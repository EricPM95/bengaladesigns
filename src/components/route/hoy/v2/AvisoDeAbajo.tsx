import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useAvisoDeAbajo } from '../../../../store/useAvisoDeAbajo'
import { AvisoSobreLaBarra } from '../../../ui/AvisoSobreLaBarra'

const TINTA = '#1C2230'
const MARFIL = '#FBF3E2'
const ORO_CLARO = '#F3D88F'

/**
 * Los avisos de HOY (V43 §6, regla en CLAUDE.md). Los pone cualquiera con `avisarAbajo(...)`; los pinta este host, montado una sola vez en HOY.
 *  · CON [Deshacer]: exactamente como el resto de la app, TAPANDO el menú de abajo y todos en el mismo sitio (`AvisoSobreLaBarra`). 12 s.
 *  · SIN [Deshacer]: arriba, bajo la cabecera. Se van solos a los 5 s, o deslizándolos. Nunca más de uno: si hay varios, se juntan en uno (lo hace el almacén).
 * El texto dice qué ha pasado («Piazza Navona, añadida a tu día»).
 */
export function AvisoDeAbajoHost() {
  const actual = useAvisoDeAbajo((s) => s.actual)
  const siguiente = useAvisoDeAbajo((s) => s.siguiente)
  const inicio = useRef<{ x: number; y: number } | null>(null)
  useEffect(() => {
    if (!actual) return undefined
    const id = window.setTimeout(siguiente, actual.ms ?? (actual.accion ? 12000 : 5000))
    return () => window.clearTimeout(id)
  }, [actual, siguiente])
  // Al salir de HOY no quedan avisos esperando para la próxima vez.
  useEffect(() => () => useAvisoDeAbajo.getState().vaciar(), [])
  if (!actual) return null
  if (actual.accion) {
    const accion = actual.accion
    return createPortal(
      <AvisoSobreLaBarra z={95} datos={{ 'data-aviso-de-abajo': actual.id }}>
        <span className="flex-1 text-[13.5px] font-medium leading-[1.35]">{actual.texto}</span>
        <button
          type="button"
          data-aviso-de-abajo-accion
          onClick={() => {
            accion.alTocar()
            siguiente()
          }}
          className="flex h-11 items-center pl-3 text-[14px] font-bold"
          style={{ color: ORO_CLARO }}
        >
          {accion.etiqueta}
        </button>
      </AvisoSobreLaBarra>,
      document.body,
    )
  }
  const cabecera = typeof document !== 'undefined' ? document.querySelector('header')?.getBoundingClientRect().bottom : null
  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 z-[80] px-[14px]" style={{ top: Math.max(cabecera ?? 0, 56) + 8 }}>
      <div
        data-aviso-de-abajo={actual.id}
        data-aviso-arriba="1"
        role="status"
        onTouchStart={(e) => {
          inicio.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
        }}
        onTouchEnd={(e) => {
          const i = inicio.current
          inicio.current = null
          if (!i) return
          const dx = e.changedTouches[0].clientX - i.x
          const dy = e.changedTouches[0].clientY - i.y
          if (Math.abs(dx) > 50 || dy < -30) siguiente()
        }}
        className="pointer-events-auto flex min-h-12 w-full items-center rounded-[15px] px-3.5 py-2.5 text-[13px] font-medium leading-[1.35]"
        style={{ background: TINTA, color: MARFIL, boxShadow: '0 14px 22px -14px rgba(28,34,48,.6)' }}
      >
        <span className="flex-1">{actual.texto}</span>
      </div>
    </div>,
    document.body,
  )
}
