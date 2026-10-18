import { lazy, Suspense, type ReactNode } from 'react'

/**
 * La insignia de una colección, cargada solo cuando se dibuja (Tanda 8B2). Lleva el dibujo de las 11 colecciones (unos 60 KB): por eso la hoja del Visto, que va en el paquete
 * de la app al abrir, importa SOLO este archivo (no `dibujos/index.tsx`, que arrastraría los sellos, los emblemas y la medalla). Mientras llega, un hueco gris del mismo tamaño.
 */
const InsigniaDibujo = lazy(() => import('./Insignia').then((m) => ({ default: m.InsigniaDibujo })))

export function Insignia({ coleccion, ganados = [], completa = false, tam = 120, animada = false }: { coleccion: string; ganados?: string[]; completa?: boolean; tam?: number; animada?: boolean }): ReactNode {
  return (
    <Suspense fallback={<span data-hueco-insignia="1" style={{ display: 'inline-block', width: tam * 0.86, height: tam * 0.86, margin: tam * 0.07, borderRadius: '28%', background: 'rgba(28,34,48,.1)' }} aria-hidden="true" />}>
      <InsigniaDibujo coleccion={coleccion} ganados={ganados} completa={completa} tam={tam} animada={animada} />
    </Suspense>
  )
}
