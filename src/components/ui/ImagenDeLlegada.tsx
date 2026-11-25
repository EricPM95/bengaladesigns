/**
 * (V62; Design «Piezas/Imagen Llegada») LA imagen fija de la llegada a un destino, en lugar de una foto: avión, tren (también autobús y barco) o coche. Cielo azul que se vuelve arena, el rastro punteado y el icono del medio en claro.
 * Una sola pieza para la tarjeta de llegada de HOY (con o sin billete). Modelo: `ImagenComida`. Llena su contenedor (`absolute inset-0`) o, con `tam`, es un cuadrado.
 */
export type TipoDeLlegada = 'avion' | 'tren' | 'coche'

const PL = 'M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z'
const CAR = 'M5 11l1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11M3 11h18v6H3zM6 17v2M18 17v2M7.5 14h.01M16.5 14h.01'
const TR = 'M7 3h10a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3zM4 11h16M8 21l2-3M16 21l-2-3M8.5 14.5h.01M15.5 14.5h.01'

export function ImagenDeLlegada({ tipo, tam, className = '', redondeo }: { tipo: TipoDeLlegada; /** Un cuadrado de este lado (px). Sin él, llena el contenedor. */ tam?: number; className?: string; redondeo?: number }) {
  const caja = tam ? { width: tam, height: tam, position: 'relative' as const, flex: 'none' as const, borderRadius: redondeo ?? 14 } : { position: 'absolute' as const, inset: 0 }
  return (
    <span data-imagen-llegada={tipo} aria-hidden="true" className={`block overflow-hidden ${className}`} style={{ ...caja, background: 'linear-gradient(160deg,#BFD4EA 0%,#E8D3B0 55%,#E39A58 100%)' }}>
      <span className="absolute inset-0" style={{ background: 'radial-gradient(60% 80% at 50% 40%,rgba(255,244,214,.55),transparent 70%)' }} />
      <span className="absolute inset-0" style={{ background: 'repeating-linear-gradient(135deg,rgba(255,255,255,.05) 0 2px,transparent 2px 16px)' }} />
      <svg viewBox="0 0 120 80" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 h-full w-full" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 66h108" stroke="#FFF6E2" strokeOpacity=".55" strokeWidth="1" strokeDasharray="1 4" />
        <g transform="translate(84 38) scale(1.45)" stroke="#FFF6E2" strokeWidth="1.7" opacity=".97">
          <path d={tipo === 'coche' ? CAR : tipo === 'tren' ? TR : PL} />
        </g>
        <path d={tipo === 'tren' ? 'M8 52h32' : 'M10 56C28 52 40 46 54 40'} stroke="#FFF6E2" strokeOpacity=".5" strokeWidth="1.4" strokeDasharray="2 4" />
      </svg>
    </span>
  )
}
