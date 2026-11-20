import type { ReactNode } from 'react'
import { usePrimeraVezUi } from '../../lib/primeraVez'

/**
 * (V31, Design «Boton Mas» versión C: «Oro con reflejo que pasa y una chispa») EL «+» FLOTANTE del Perfil: el de siempre, SIN texto (abre «¿Qué quieres hacer?»: crear un viaje, unirse con un código y lo demás), más
 * vistoso: oro con un brillo arriba, un reflejo que lo cruza de vez en cuando (cada 4,5 s, no sin parar) y una chispa. Con «reducir movimiento», quieto. Se esconde con la tarjeta de un destino abierta y en la
 * página del destino (en el prototipo tapa los botones).
 */
const CSS = `
@keyframes bmShine{0%,62%{transform:translateX(-120%) skewX(-20deg)}100%{transform:translateX(220%) skewX(-20deg)}}
@keyframes bmSpark{0%,70%,100%{opacity:0;transform:scale(.3)}80%{opacity:1;transform:scale(1)}90%{opacity:0;transform:scale(.4)}}
@media (prefers-reduced-motion: reduce){[data-boton-mas] *{animation:none!important}[data-boton-mas] [data-chispa]{display:none}}
`

export function BotonMas({ onClick }: { onClick: () => void }): ReactNode {
  const escondido = usePrimeraVezUi((s) => Boolean(s.tarjeta || s.pagina))
  if (escondido) return null
  return (
    <div className="pointer-events-none absolute inset-x-0 z-[5] flex justify-center" style={{ bottom: 'calc(28px + env(safe-area-inset-bottom))' }}>
      <style>{CSS}</style>
      <div data-boton-mas style={{ position: 'relative', width: 72, height: 72 }} className="pointer-events-none">
        <button
          type="button"
          onClick={onClick}
          aria-label="Añadir un viaje"
          data-anadir-viaje
          className="pointer-events-auto flex items-center justify-center rounded-full"
          style={{ position: 'relative', overflow: 'hidden', width: 72, height: 72, border: 'none', background: 'linear-gradient(145deg,#F6E8BE 0%,#E2C070 40%,#C99A44 75%,#EBCF86 100%)', color: '#4A3510', boxShadow: '0 0 0 6px rgba(246,239,224,.9),0 16px 28px -8px rgba(110,80,24,.85),inset 0 2px 0 rgba(255,255,255,.7),inset 0 -3px 6px rgba(150,105,30,.35)' }}
        >
          <span aria-hidden style={{ position: 'absolute', left: '12%', right: '12%', top: '5%', height: '42%', borderRadius: '50%', background: 'linear-gradient(180deg,rgba(255,255,255,.7),rgba(255,255,255,0))' }} />
          <span aria-hidden data-reflejo style={{ position: 'absolute', top: '-10%', bottom: '-10%', width: '34%', background: 'linear-gradient(90deg,transparent,rgba(255,255,255,.75),transparent)', animation: 'bmShine 4.5s ease-in-out infinite' }} />
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#4A3510" strokeWidth="2.6" strokeLinecap="round" style={{ position: 'relative', flex: 'none' }} aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
        <svg data-chispa width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" style={{ position: 'absolute', right: -4, top: -4, animation: 'bmSpark 4.5s ease-in-out infinite', pointerEvents: 'none' }}>
          <path d="M12 1l2.2 8.8L23 12l-8.8 2.2L12 23l-2.2-8.8L1 12l8.8-2.2z" fill="#FFF3C4" />
        </svg>
      </div>
    </div>
  )
}
