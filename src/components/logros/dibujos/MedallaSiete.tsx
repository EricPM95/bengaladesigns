/**
 * LA MEDALLA NUEVA DE LAS 7 MARAVILLAS (Tanda 8B5): «Medalla Siete» de Design (Piezas/Medalla Siete.dc.html), en quieto. Un disco dorado con las 7 monedas alrededor y, en el
 * centro, cuántas lleva («2» sobre «DE 7»). Las que el viajero tiene, en oro, con su emblema; las que le faltan, en plata y apagadas. Sin ninguna animación (la del destello
 * y la del final de las 7 son de las pantallas de los momentos): aquí todo se queda quieto, también el brillo interno de los emblemas.
 * Las 7 juntas siguen siendo la medalla de siempre (`Medalla.tsx`), como en Design.
 */
import { lazy, Suspense, useId, useMemo } from 'react'
import './MedallaSiete.css'

const EmblemaOro = lazy(() => import('./piezas/EmblemaOro'))

/** ids de `viajero.json › maravillas` → clave del emblema, en el orden de las monedas (como en Design: arriba y en el sentido de las agujas del reloj). */
const MONEDAS: { id: string; k: string }[] = [
  { id: 'coliseo', k: 'coliseo' },
  { id: 'gran_muralla', k: 'muralla' },
  { id: 'petra', k: 'petra' },
  { id: 'cristo_redentor', k: 'cristo' },
  { id: 'machu_picchu', k: 'machu' },
  { id: 'chichen_itza', k: 'chichen' },
  { id: 'taj_mahal', k: 'taj' },
]
export const IDS_MARAVILLAS = MONEDAS.map((m) => m.id)

export function MedallaSiete({ encendidas = [], tam = 112 }: { encendidas?: string[]; tam?: number }) {
  const u = useId().replace(/[^a-zA-Z0-9]/g, '')
  const k = tam / 340
  const cnt = MONEDAS.filter((m) => encendidas.includes(m.id)).length
  const grietas = useMemo(
    () =>
      Array.from({ length: 120 }, (_, i) => {
        const a = (i / 120) * Math.PI * 2
        return `M${(170 + 158 * Math.cos(a)).toFixed(1)} ${(170 + 158 * Math.sin(a)).toFixed(1)}L${(170 + 167 * Math.cos(a)).toFixed(1)} ${(170 + 167 * Math.sin(a)).toFixed(1)}`
      }),
    [],
  )
  return (
    <span className="ms-quieta" role="img" aria-label={`Medalla de las 7 maravillas: ${cnt} de 7`} style={{ position: 'relative', display: 'inline-block', width: tam, height: (tam * 400) / 340, flex: 'none' }}>
      <span style={{ position: 'absolute', left: 0, top: 0, width: 340, height: 400, transform: `scale(${k})`, transformOrigin: '0 0' }}>
        <svg width="340" height="400" viewBox="0 0 340 400" style={{ position: 'absolute', inset: 0, overflow: 'visible' }} aria-hidden>
          <defs>
            <linearGradient id={`${u}rm`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFF1C6" /><stop offset=".5" stopColor="#A97E34" /><stop offset="1" stopColor="#F3D58E" /></linearGradient>
            <radialGradient id={`${u}gd`} cx=".38" cy=".32" r=".8"><stop offset="0" stopColor="#FBE8B4" /><stop offset=".5" stopColor="#D6AE5E" /><stop offset="1" stopColor="#94692A" /></radialGradient>
            <radialGradient id={`${u}ct`} cx=".4" cy=".35" r=".8"><stop offset="0" stopColor="#FFF6D8" /><stop offset=".55" stopColor="#DDB466" /><stop offset="1" stopColor="#8A6424" /></radialGradient>
            <linearGradient id={`${u}rb`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#F6DC98" /><stop offset="1" stopColor="#B08638" /></linearGradient>
          </defs>
          <circle cx="170" cy="170" r="168" fill={`url(#${u}rm)`} />
          {grietas.map((g, i) => <path key={i} d={g} stroke="rgba(110,78,26,.5)" strokeWidth="1.4" />)}
          <circle cx="170" cy="170" r="156" fill={`url(#${u}gd)`} stroke="#8A6424" strokeWidth="2" />
          <circle cx="170" cy="170" r="148" fill="none" stroke="rgba(255,246,216,.55)" strokeWidth="1.2" />
          <circle cx="170" cy="170" r="104" fill="none" stroke="rgba(110,78,26,.45)" strokeWidth="1" strokeDasharray="2 4" />
          <circle cx="170" cy="170" r="54" fill={`url(#${u}ct)`} stroke="#8A6424" strokeWidth="1.6" />
          <circle cx="170" cy="170" r="48" fill="none" stroke="rgba(255,246,216,.6)" strokeWidth="1" />
          <g fill="none" stroke="#6E4E1A" strokeWidth="1" opacity=".55"><ellipse cx="170" cy="170" rx="40" ry="40" /><ellipse cx="170" cy="170" rx="18" ry="40" /><path d="M130 170H210M134 152H206M134 188H206M170 130V210" /></g>
          <text x="170" y="198" textAnchor="middle" fontFamily="Geist Mono" fontWeight="600" fontSize="7.5" letterSpacing="1.6" fill="#5A3E14">DE 7</text>
          <g transform="translate(0 4)">
            <path d="M52 326L36 336L52 346L44 356H86V316H44Z" fill="#9C7634" /><path d="M288 326L304 336L288 346L296 356H254V316H296Z" fill="#9C7634" />
            <path d="M70 312Q170 300 270 312V352Q170 340 70 352Z" fill={`url(#${u}rb)`} stroke="#7A5420" strokeWidth="1.4" />
            <path d="M78 318Q170 307 262 318" fill="none" stroke="rgba(255,246,216,.6)" strokeWidth="1" />
            <text x="170" y="337" textAnchor="middle" fontFamily="Geist Mono" fontWeight="700" fontSize="12" letterSpacing="2.6" fill="#3A2608">LAS 7 MARAVILLAS</text>
          </g>
        </svg>
        <span data-ms-cuenta="" style={{ position: 'absolute', left: 110, top: 140, width: 120, textAlign: 'center', font: "400 40px/1 'Instrument Serif',serif", color: '#3A2608', textShadow: '0 1px 0 rgba(255,246,216,.7)' }}>{cnt}</span>
        {MONEDAS.map((m, i) => {
          const a = -Math.PI / 2 + (i * 2 * Math.PI) / 7
          const on = encendidas.includes(m.id)
          return (
            <span key={m.id} data-moneda={m.k} data-encendida={on ? 'oro' : 'plata'} style={{ position: 'absolute', left: 170 + 104 * Math.cos(a) - 41, top: 170 + 104 * Math.sin(a) - 41, width: 82, height: 82 }}>
              <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: on ? 'linear-gradient(135deg,#FFF1C6,#B48A3E 45%,#F6DC98 70%,#8A6424)' : 'linear-gradient(135deg,#E8ECF2,#8A93A2 45%,#D6DCE6 70%,#6E7686)', boxShadow: on ? '0 0 0 1px rgba(255,246,216,.7) inset,0 6px 14px -4px rgba(60,40,10,.6)' : '0 0 0 1px rgba(0,0,0,.35) inset,0 4px 10px -4px rgba(0,0,0,.6)' }} />
              <span style={{ position: 'absolute', left: 5, top: 5, width: 72, height: 72, borderRadius: '50%', overflow: 'hidden', filter: on ? 'none' : 'grayscale(1) brightness(.78) contrast(1.05)' }}>
                <span style={{ position: 'absolute', left: -14, top: -25, pointerEvents: 'none' }}>
                  <Suspense fallback={null}><EmblemaOro won kind={m.k} size={100} interactive={false} tilt={false} /></Suspense>
                </span>
              </span>
              {!on && <span style={{ position: 'absolute', inset: 5, borderRadius: '50%', background: 'radial-gradient(circle at 35% 28%,rgba(255,255,255,.18),rgba(30,36,52,.28) 70%)' }} />}
            </span>
          )
        })}
      </span>
    </span>
  )
}
