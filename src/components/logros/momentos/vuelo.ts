/**
 * «Al conseguir algo, su dibujo vuela a donde se guarda» (Tanda 8B). Hermano de `fotoVuela.ts`: en vez de dibujar una miniatura, clona el dibujo que se estaba
 * viendo y lo lleva (≈ 0,8 s) hasta el botón de destino, que da un latido. Con «reducir movimiento», solo el latido.
 * Destinos: `[data-boton-logros]` (el botón flotante) y `[data-boton-perfil]` (el Perfil de la cabecera, el mismo de las fotos).
 */
export type DestinoVuelo = 'logros' | 'perfil'
const SELECTOR: Record<DestinoVuelo, string> = { logros: '[data-boton-logros]', perfil: '[data-boton-perfil]' }

const sinMovimiento = () => typeof window !== 'undefined' && Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)

export function botonVisible(destino: DestinoVuelo): HTMLElement | null {
  let mejor: HTMLElement | null = null
  let area = 0
  for (const el of Array.from(document.querySelectorAll<HTMLElement>(SELECTOR[destino]))) {
    const c = el.getBoundingClientRect()
    const a = Math.max(0, Math.min(c.right, window.innerWidth) - Math.max(c.left, 0)) * Math.max(0, Math.min(c.bottom, window.innerHeight) - Math.max(c.top, 0))
    if (a > area) {
      area = a
      mejor = el
    }
  }
  return mejor
}

export function latir(el: HTMLElement) {
  try {
    el.animate?.([{ transform: 'scale(1)' }, { transform: 'scale(1.32)', offset: 0.35 }, { transform: 'scale(.94)', offset: 0.7 }, { transform: 'scale(1)' }], { duration: 420, easing: 'ease-out' })
  } catch {
    /* sin animaciones */
  }
}

/** Lleva una copia de `origen` hasta el botón de destino. Nunca lanza. Devuelve cuánto dura (ms). */
export function volar(origen: HTMLElement | null, destino: DestinoVuelo): number {
  try {
    const boton = botonVisible(destino)
    if (!boton) return 0
    if (!origen || sinMovimiento() || typeof origen.animate !== 'function') {
      latir(boton)
      return 0
    }
    const a = origen.getBoundingClientRect()
    const b = boton.getBoundingClientRect()
    if (a.width === 0) {
      latir(boton)
      return 0
    }
    const copia = origen.cloneNode(true) as HTMLElement
    copia.style.cssText += `;position:fixed;left:${a.left}px;top:${a.top}px;width:${a.width}px;height:${a.height}px;margin:0;z-index:2147483000;pointer-events:none;transform-origin:center`
    document.body.appendChild(copia)
    const dx = b.left + b.width / 2 - (a.left + a.width / 2)
    const dy = b.top + b.height / 2 - (a.top + a.height / 2)
    const escala = Math.max(0.12, Math.min(0.4, b.width / a.width))
    const anim = copia.animate(
      [
        { transform: 'translate(0,0) scale(1)', opacity: 1 },
        { transform: `translate(${dx}px,${dy}px) scale(${escala})`, opacity: 0.25 },
      ],
      { duration: 800, easing: 'cubic-bezier(.5,0,.7,.4)', fill: 'forwards' },
    )
    anim.onfinish = () => {
      copia.remove()
      latir(boton)
    }
    window.setTimeout(() => copia.remove(), 1500)
    return 800
  } catch {
    return 0
  }
}
