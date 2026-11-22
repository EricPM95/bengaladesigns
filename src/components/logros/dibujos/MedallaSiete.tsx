/**
 * LA MEDALLA NUEVA DE LAS 7 MARAVILLAS (Tanda 8B5): «Medalla Siete» de Design (Piezas/Medalla Siete.dc.html), en quieto. Un disco dorado con las 7 monedas alrededor y, en el
 * centro, cuántas lleva («2» sobre «DE 7»). Las que el viajero tiene, en oro, con su emblema; las que le faltan, en plata y apagadas. Sin ninguna animación (la del destello
 * y la del final de las 7 son de las pantallas de los momentos): aquí todo se queda quieto, también el brillo interno de los emblemas.
 * Las 7 juntas siguen siendo la medalla de siempre (`Medalla.tsx`), como en Design.
 * (V39B) Con `gana` (el id de la maravilla que se acaba de conseguir) es «Una maravilla nueva» (Design `Maravilla Nueva`, la pieza con `gain` y `gainDelay`): las demás, ya encendidas; la nueva, apagada hasta `retraso` s; entonces baja girando,
 * encaja, se enciende y el número del centro cuenta una más. Es la ÚNICA forma animada de esta medalla fuera del final de las 7 (que es `FinalSieteMaravillas`); sin `gana` sigue quieta.
 */
import { lazy, Suspense, useEffect, useId, useMemo, useState, type CSSProperties } from 'react'
import './MedallaSiete.css'
import { TIEMPOS_DE_MARAVILLA_NUEVA } from '../../../lib/sonidos/tiempos'

const EmblemaOro = lazy(() => import('./piezas/EmblemaOro'))

/** ids de `viajero.json › maravillas` → clave del emblema, en el orden de las monedas (como en Design: arriba y en el sentido de las agujas del reloj). */
const MONEDAS: { id: string; k: string; nombre: string }[] = [
  { id: 'coliseo', k: 'coliseo', nombre: 'Coliseo' },
  { id: 'gran_muralla', k: 'muralla', nombre: 'Gran Muralla China' },
  { id: 'petra', k: 'petra', nombre: 'Petra' },
  { id: 'cristo_redentor', k: 'cristo', nombre: 'Cristo Redentor' },
  { id: 'machu_picchu', k: 'machu', nombre: 'Machu Picchu' },
  { id: 'chichen_itza', k: 'chichen', nombre: 'Chichén Itzá' },
  { id: 'taj_mahal', k: 'taj', nombre: 'Taj Mahal' },
]
export const IDS_MARAVILLAS = MONEDAS.map((m) => m.id)

export function MedallaSiete({ encendidas = [], tam = 112, gana, retraso = TIEMPOS_DE_MARAVILLA_NUEVA.llega }: { encendidas?: string[]; tam?: number; gana?: string; retraso?: number }) {
  const u = useId().replace(/[^a-zA-Z0-9]/g, '')
  const k = tam / 340
  const animada = Boolean(gana)
  const sinMovimiento = typeof window !== 'undefined' && Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
  // (V39B) Antes de `retraso` la moneda nueva está apagada (plata) y el número lleva una menos; a `retraso` baja, encaja y se enciende. (solo desarrollo) `window.__retrasoMaravilla = 99` la deja apagada para capturar el principio.
  const espera = import.meta.env.DEV ? ((window as unknown as { __retrasoMaravilla?: number }).__retrasoMaravilla ?? retraso) : retraso
  const [llego, setLlego] = useState(!animada || sinMovimiento)
  useEffect(() => {
    if (!animada || sinMovimiento) return
    const h = window.setTimeout(() => setLlego(true), espera * 1000)
    return () => window.clearTimeout(h)
  }, [animada, sinMovimiento, espera])
  const iGana = gana ? MONEDAS.findIndex((m) => m.id === gana) : -1
  const esta = (m: { id: string }) => encendidas.includes(m.id) && (m.id !== gana || llego)
  const cnt = MONEDAS.filter(esta).length
  const grietas = useMemo(
    () =>
      Array.from({ length: 120 }, (_, i) => {
        const a = (i / 120) * Math.PI * 2
        return `M${(170 + 158 * Math.cos(a)).toFixed(1)} ${(170 + 158 * Math.sin(a)).toFixed(1)}L${(170 + 167 * Math.cos(a)).toFixed(1)} ${(170 + 167 * Math.sin(a)).toFixed(1)}`
      }),
    [],
  )
  const chispas = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2
        const r = 40 + (i % 3) * 12
        return { dx: `${(Math.cos(a) * r).toFixed(0)}px`, dy: `${(Math.sin(a) * r).toFixed(0)}px`, s: 5 + (i % 3) * 2, c: i % 2 ? '#FFF3D0' : '#F3D59A' }
      }),
    [],
  )
  const pos = (i: number) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / 7
    return { a, cx: 170 + 104 * Math.cos(a), cy: 170 + 104 * Math.sin(a) }
  }
  const tip = animada && llego && iGana >= 0 ? { l: pos(iGana).cx, t: pos(iGana).cy - 41 - 26, nombre: MONEDAS[iGana].nombre } : null
  return (
    <span className={animada ? undefined : 'ms-quieta'} data-maravilla-nueva={animada ? (llego ? 'llego' : 'espera') : undefined} role="img" aria-label={`Medalla de las 7 maravillas: ${cnt} de 7`} style={{ position: 'relative', display: 'inline-block', width: tam, height: (tam * 400) / 340, flex: 'none' }}>
      <span style={{ position: 'absolute', left: 0, top: 0, width: 340, height: 400, transform: `scale(${k})`, transformOrigin: '0 0' }}>
        <span style={{ position: 'absolute', inset: 0, animation: animada && llego && iGana >= 0 ? `${iGana % 2 ? 'm7ThudA' : 'm7ThudB'} .45s 1.05s ease both` : 'none' }}>
          {animada && (
            <>
              <span aria-hidden className="mo-con-mov" style={{ position: 'absolute', left: -40, top: -40, width: 420, height: 420, borderRadius: '50%', background: `repeating-conic-gradient(rgba(255,220,150,${(0.06 + cnt * 0.03).toFixed(2)}) 0 2.4deg,transparent 2.4deg 13deg)`, WebkitMask: `radial-gradient(circle,#000 30%,transparent ${46 + cnt * 3}%)`, mask: `radial-gradient(circle,#000 30%,transparent ${46 + cnt * 3}%)`, animation: 'm7Rays 60s linear infinite' }} />
              <span aria-hidden style={{ position: 'absolute', left: -10, top: -10, width: 360, height: 360, borderRadius: '50%', background: `radial-gradient(circle,rgba(255,214,140,${(0.12 + cnt * 0.05).toFixed(2)}),transparent 66%)` }} />
            </>
          )}
          <svg width="340" height="400" viewBox="0 0 340 400" style={{ position: 'absolute', inset: 0, overflow: 'visible' }} aria-hidden>
            <defs>
              <linearGradient id={`${u}rm`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFF1C6" /><stop offset=".5" stopColor="#A97E34" /><stop offset="1" stopColor="#F3D58E" /></linearGradient>
              <radialGradient id={`${u}gd`} cx=".38" cy=".32" r=".8"><stop offset="0" stopColor="#FBE8B4" /><stop offset=".5" stopColor="#D6AE5E" /><stop offset="1" stopColor="#94692A" /></radialGradient>
              <radialGradient id={`${u}ct`} cx=".4" cy=".35" r=".8"><stop offset="0" stopColor="#FFF6D8" /><stop offset=".55" stopColor="#DDB466" /><stop offset="1" stopColor="#8A6424" /></radialGradient>
              <linearGradient id={`${u}rb`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#F6DC98" /><stop offset="1" stopColor="#B08638" /></linearGradient>
              {animada && (
                <>
                  <filter id={`${u}br`} x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.012 0.95" numOctaves="2" seed="7" /><feColorMatrix type="matrix" values="0 0 0 0 .32  0 0 0 0 .22  0 0 0 0 .06  0 0 0 1.3 -.55" /></filter>
                  <clipPath id={`${u}cc`}><circle cx="170" cy="170" r="152" /></clipPath>
                </>
              )}
            </defs>
            <circle cx="170" cy="170" r="168" fill={`url(#${u}rm)`} />
            {grietas.map((g, i) => <path key={i} d={g} stroke="rgba(110,78,26,.5)" strokeWidth="1.4" />)}
            <circle cx="170" cy="170" r="156" fill={`url(#${u}gd)`} stroke="#8A6424" strokeWidth="2" />
            {animada && <g clipPath={`url(#${u}cc)`}><rect x="10" y="10" width="320" height="320" filter={`url(#${u}br)`} opacity=".5" /></g>}
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
            const on = esta(m)
            const { a, cx, cy } = pos(i)
            const nueva = animada && llego && i === iGana
            const gd = `${(i * 0.37).toFixed(2)}s`
            const estilo = {
              position: 'absolute', left: cx - 41, top: cy - 41, width: 82, height: 82,
              '--dx': `${(-104 * Math.cos(a)).toFixed(1)}px`, '--dy': `${(-104 * Math.sin(a)).toFixed(1)}px`, '--jx': `${(-(cx - 170) * 0.6).toFixed(0)}px`,
              animation: nueva ? 'm7Join 1.5s cubic-bezier(.3,.1,.3,1) both' : 'none',
            } as CSSProperties
            return (
              <span key={m.id}>
                {nueva && <span aria-hidden className="mo-con-mov" style={{ position: 'absolute', left: cx, top: cy - 41, width: 6, height: 82, marginLeft: -3, background: 'linear-gradient(180deg,transparent,rgba(255,236,190,.9))', borderRadius: 3, filter: 'blur(1.5px)', opacity: 0, animation: 'm7Trail 1.1s ease-in both' }} />}
                <span data-moneda={m.k} data-encendida={on ? 'oro' : 'plata'} data-nueva={nueva ? '' : undefined} style={estilo}>
                  {animada && on && <span aria-hidden style={{ position: 'absolute', inset: -14, borderRadius: '50%', background: 'radial-gradient(circle,rgba(255,224,150,.75),transparent 68%)', animation: `m7Glow 2.6s ${gd} ease-in-out infinite` }} />}
                  <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: on ? 'linear-gradient(135deg,#FFF1C6,#B48A3E 45%,#F6DC98 70%,#8A6424)' : 'linear-gradient(135deg,#E8ECF2,#8A93A2 45%,#D6DCE6 70%,#6E7686)', boxShadow: on ? '0 0 0 1px rgba(255,246,216,.7) inset,0 6px 14px -4px rgba(60,40,10,.6)' : '0 0 0 1px rgba(0,0,0,.35) inset,0 4px 10px -4px rgba(0,0,0,.6)' }} />
                  <span style={{ position: 'absolute', left: 5, top: 5, width: 72, height: 72, borderRadius: '50%', overflow: 'hidden', filter: on ? 'none' : 'grayscale(1) brightness(.78) contrast(1.05)', animation: nueva ? 'm7Lit 1.4s .95s ease both' : 'none' }}>
                    <span style={{ position: 'absolute', left: -14, top: -25, pointerEvents: 'none' }}>
                      <Suspense fallback={null}><EmblemaOro won kind={m.k} size={100} interactive={false} tilt={false} /></Suspense>
                    </span>
                    {animada && on && <span aria-hidden className="mo-con-mov" style={{ position: 'absolute', top: '-20%', bottom: '-20%', left: 0, width: '30%', background: 'linear-gradient(90deg,transparent,rgba(255,250,230,.75),transparent)', animation: `m7Sheen 5s ${gd} ease-in-out infinite` }} />}
                  </span>
                  {!on && <span style={{ position: 'absolute', inset: 5, borderRadius: '50%', background: 'radial-gradient(circle at 35% 28%,rgba(255,255,255,.18),rgba(30,36,52,.28) 70%)' }} />}
                  {nueva && (
                    <>
                      <span aria-hidden className="mo-con-mov" style={{ position: 'absolute', inset: -20, borderRadius: '50%', background: 'radial-gradient(circle,#FFFFFF,rgba(255,236,190,.6) 35%,transparent 70%)', opacity: 0, animation: 'm7Flash 1.1s 1.05s ease-out both' }} />
                      <span aria-hidden className="mo-con-mov" style={{ position: 'absolute', inset: -4, borderRadius: '50%', border: '2.5px solid #FFF3D0', boxShadow: '0 0 12px #FFD58A', opacity: 0, animation: 'm7Shock .9s 1.05s ease-out both' }} />
                      <span aria-hidden className="mo-con-mov" style={{ position: 'absolute', inset: -4, borderRadius: '50%', border: '1.5px solid #F3D59A', opacity: 0, animation: 'm7Shock 1.3s 1.2s ease-out both' }} />
                      {chispas.map((q, j) => (
                        <span key={j} aria-hidden className="mo-con-mov" style={{ position: 'absolute', left: 38, top: 38, width: q.s, height: q.s, background: q.c, clipPath: 'polygon(50% 0,62% 38%,100% 50%,62% 62%,50% 100%,38% 62%,0 50%,38% 38%)', ['--dx' as string]: q.dx, ['--dy' as string]: q.dy, opacity: 0, animation: 'm7Spk .9s 1.05s cubic-bezier(.2,.7,.3,1) both' } as CSSProperties} />
                      ))}
                    </>
                  )}
                </span>
              </span>
            )
          })}
        </span>
        {tip && <span data-etiqueta-moneda="" style={{ position: 'absolute', left: tip.l, top: tip.t, transform: 'translateX(-50%)', height: 30, padding: '0 12px', borderRadius: 999, background: '#1C2230', color: '#FFFDF8', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap', font: "500 12.5px 'Geist'", boxShadow: '0 8px 18px -8px rgba(0,0,0,.6)', zIndex: 5 }}>{tip.nombre}</span>}
      </span>
    </span>
  )
}
