import { createElement, type ReactNode } from 'react'
import type { NodoIcono } from '../../lib/listaDelPase'

/** El dibujo de una fila de la lista del pase (el de Design, tal cual), con el color y el tamaño que pida cada sitio. */
export function IconoDeLista({ icono, size = 22, color, grosor }: { icono: NodoIcono | null; size?: number; color?: string; grosor?: number }) {
  if (!icono) return null
  const pinta = (n: NodoIcono | string, k: number): ReactNode => {
    if (typeof n === 'string') return n
    const props: Record<string, unknown> = { ...n.a, key: k }
    if (n.t === 'svg') {
      props.width = size
      props.height = size
      if (color) props.stroke = color
      if (grosor) props.strokeWidth = grosor
      delete props.style
      props.style = { flex: 'none' }
    }
    return createElement(n.t, props, ...(n.c ?? []).map(pinta))
  }
  return pinta(icono, 0) as JSX.Element
}
