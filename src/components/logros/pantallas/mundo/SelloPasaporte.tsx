import { useId, type ReactNode } from 'react'
import { TINTAS, corto, monumentoDe, type FormaDeSello } from './selloDatos'

/**
 * EL SELLO DEL PASAPORTE (8C2), de `Piezas/Sello.dc.html`: redondo, ovalado o rectangular, con el nombre del sitio, su fecha y el dibujo de su monumento, en tinta (con el
 * borde roto de un sello de verdad) o vacío y punteado («Por conseguir»). Los dibujos de monumento son los del diseño; el sitio que no tiene uno sale solo con su nombre.
 */

export function SelloPasaporte({ forma, sitio, fecha = '', tinta = TINTAS[0], vacio = false, tam = 140 }: { forma: FormaDeSello; sitio: string; fecha?: string; tinta?: string; vacio?: boolean; tam?: number }): ReactNode {
  const id = useId().replace(/:/g, '')
  const col = vacio ? 'rgba(28,34,48,.4)' : tinta
  const lugar = corto(sitio).toUpperCase()
  const mon = vacio ? '' : monumentoDe(sitio)
  const base = { fontFamily: "'Geist Mono',monospace", fontWeight: 600, fill: col, stroke: 'none', textAnchor: 'middle' as const }
  const dash = vacio ? '3 5' : 'none'
  const nombre = (y: number, size: number, ls: number) => (
    <text {...base} x={80} y={y} fontSize={size} letterSpacing={ls}>
      {lugar}
    </text>
  )
  const fechaTxt = (y: number, size: number) => (
    <text {...base} x={80} y={y} fontSize={size} letterSpacing={1.6}>
      {fecha}
    </text>
  )
  return (
    <svg width={tam} height={tam} viewBox="0 0 160 160" style={{ display: 'block', overflow: 'visible', opacity: vacio ? 1 : 0.9 }} role="img" aria-label={vacio ? `Sello de ${sitio}, por conseguir` : `Sello de ${sitio}${fecha ? `, ${fecha}` : ''}`}>
      <defs>
        <filter id={`${id}t`} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="4" result="w" />
          <feDisplacementMap in="SourceGraphic" in2="w" scale="2.6" result="d" />
          <feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="1" seed="11" result="n" />
          <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -3.2 0 0 0 2.35" result="m" />
          <feComposite in="d" in2="m" operator="in" />
        </filter>
        <path id={`${id}a`} d="M24 80 A56 56 0 0 1 136 80" />
        <path id={`${id}b`} d="M16 80 A64 64 0 0 0 144 80" />
      </defs>
      <g filter={vacio ? undefined : `url(#${id}t)`} stroke={col} fill="none" strokeLinecap="round" strokeLinejoin="round">
        {forma === 'round' && (
          <>
            <circle cx="80" cy="80" r="76" strokeWidth="3.2" strokeDasharray={dash} />
            <circle cx="80" cy="80" r="70" strokeWidth="1.2" strokeDasharray={dash} />
            <text {...base} fontSize={12.5} letterSpacing={2.4}>
              <textPath href={`#${id}a`} startOffset="50%">
                {lugar}
              </textPath>
            </text>
            {!vacio && (
              <>
                <circle cx="80" cy="80" r="49" strokeWidth="1.2" />
                <circle cx="18" cy="80" r="2" fill={col} stroke="none" />
                <circle cx="142" cy="80" r="2" fill={col} stroke="none" />
                <text {...base} fontSize={11} letterSpacing={1.6}>
                  <textPath href={`#${id}b`} startOffset="50%">
                    {fecha}
                  </textPath>
                </text>
                {mon && (
                  <g transform="translate(50 60)" strokeWidth="1.8">
                    <path d={mon} />
                  </g>
                )}
              </>
            )}
          </>
        )}
        {forma === 'rect' && (
          <>
            <rect x="10" y="24" width="140" height="112" rx="8" strokeWidth="3.2" strokeDasharray={dash} />
            <rect x="16" y="30" width="128" height="100" rx="4" strokeWidth="1.2" strokeDasharray={dash} />
            {nombre(vacio ? 86 : 50, 13, 2.6)}
            {!vacio && (
              <>
                <path d="M30 108 H130" strokeWidth="1" />
                {mon && (
                  <g transform="translate(50 60)" strokeWidth="1.8">
                    <path d={mon} />
                  </g>
                )}
                {fechaTxt(122, 11)}
              </>
            )}
          </>
        )}
        {forma === 'oval' && (
          <>
            <ellipse cx="80" cy="80" rx="76" ry="58" strokeWidth="3.2" strokeDasharray={dash} />
            <ellipse cx="80" cy="80" rx="69" ry="51" strokeWidth="1.2" strokeDasharray={dash} />
            {nombre(vacio ? 85 : 48, 12.5, 2.4)}
            {!vacio && (
              <>
                {mon && (
                  <g transform="translate(50 56)" strokeWidth="1.8">
                    <path d={mon} />
                  </g>
                )}
                {fechaTxt(112, 10.5)}
              </>
            )}
          </>
        )}
      </g>
    </svg>
  )
}
