import type { ReactNode } from 'react'

/**
 * (V25, sacada a su sitio en la V34) LAS SILUETAS DE LOS SECRETOS de Design (`Logros Antes Viaje`): cada emblema oculto es una silueta oscura con «?». La usan la hoja de logros de antes del viaje y «Lo que te puedes llevar»
 * del destino (la tarjeta y la página sin viaje): UNA sola pieza, para que se vean igual en los dos sitios. `k` es la posición del hueco (la forma sale de ahí, siempre la misma para el mismo hueco).
 */
export const SILUETAS: { cp: string; br: string }[] = [
  { cp: 'polygon(25% 5%,75% 5%,100% 50%,75% 95%,25% 95%,0 50%)', br: '0' },
  { cp: 'none', br: '50%' },
  { cp: 'polygon(50% 0,100% 20%,100% 65%,50% 100%,0 65%,0 20%)', br: '0' },
  { cp: 'none', br: '18px' },
  { cp: 'polygon(30% 0,70% 0,100% 30%,100% 70%,70% 100%,30% 100%,0 70%,0 30%)', br: '0' },
  { cp: 'none', br: '50% 50% 14px 14px' },
  { cp: 'polygon(50% 0,100% 50%,50% 100%,0 50%)', br: '0' },
  { cp: 'none', br: '30%' },
  { cp: 'polygon(0 100%,0 40%,50% 0,100% 40%,100% 100%)', br: '0' },
  { cp: 'none', br: '30%' },
  { cp: 'polygon(50% 0,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)', br: '0' },
]

export function SiluetaDeEmblema({ k, tam = 66 }: { k: number; tam?: number }): ReactNode {
  const sil = SILUETAS[k % SILUETAS.length]
  return (
    <span aria-hidden data-hueco-emblema="1" style={{ width: tam, height: tam, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(145deg,#394168,#12172A)', clipPath: sil.cp, borderRadius: sil.br, boxShadow: 'inset 0 0 0 1.5px rgba(243,213,154,.25)' }}>
      <span style={{ font: `400 ${Math.round(tam * 0.42)}px/1 'Instrument Serif',serif`, color: 'rgba(243,213,154,.75)' }}>?</span>
    </span>
  )
}
