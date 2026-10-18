/** Ayudas para los escaparates (Tanda 8C2, solo desarrollo): pintar un trozo de React suelto encima de la app y quitarlo. */
import type { ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'

const montajes = new Map<string, { raiz: Root; caja: HTMLElement }>()

export function montarEnBody(id: string, nodo: ReactNode): void {
  desmontar(id)
  const caja = document.createElement('div')
  caja.dataset.escaparate = id
  caja.style.cssText = 'position:fixed;inset:0;z-index:9500;overflow:auto'
  document.body.appendChild(caja)
  const raiz = createRoot(caja)
  raiz.render(nodo)
  montajes.set(id, { raiz, caja })
}

export function desmontar(id: string): void {
  const m = montajes.get(id)
  if (!m) return
  m.raiz.unmount()
  m.caja.remove()
  montajes.delete(id)
}

export const espera = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms))
