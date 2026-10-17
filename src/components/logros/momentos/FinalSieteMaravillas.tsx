import { lazy, Suspense, useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import { MedallaMaravillas } from '../dibujos'
import './FinalSieteMaravillas.css'

const EmblemaOro = lazy(() => import('../dibujos/piezas/EmblemaOro'))

/**
 * «EL FINAL DE LAS 7 MARAVILLAS» (Tanda 8B4), Momentos Grandes · 02 del diseño (Piezas/Medalla Siete). Es la ÚNICA animación de la medalla: sale solo al conseguir la séptima maravilla.
 * Las 7 monedas, ya encendidas en círculo, se juntan en el centro, un núcleo late cada vez más rápido, un fogonazo blanco, la medalla entra girando y estallan los fuegos artificiales.
 * Mismas medidas y tiempos que el diseño (lienzo de 340 × 400). `onLista` avisa cuando termina (para dejar ver la medalla quieta).
 */
const KS = ['coliseo', 'muralla', 'petra', 'cristo', 'machu', 'chichen', 'taj'] as const
const NOMBRES: Record<(typeof KS)[number], string> = { coliseo: 'Coliseo', muralla: 'Gran Muralla China', petra: 'Petra', cristo: 'Cristo Redentor', machu: 'Machu Picchu', chichen: 'Chichén Itzá', taj: 'Taj Mahal' }
const TODAS = ['coliseo', 'gran_muralla', 'petra', 'cristo_redentor', 'machu_picchu', 'chichen_itza', 'taj_mahal']
const INICIO_FIN = 1.8 // segundos que las 7 monedas se quedan quietas antes de juntarse
const rnd = (q: number) => {
  const x = Math.sin(q * 12.9898 + 78.233) * 43758.5453
  return x - Math.floor(x)
}
const COL = ['#F3D59A', '#FFFFFF', 'oklch(0.8 0.14 70)']
const px = (n: number | string) => `${n}px`

/** Todo lo que no cambia entre pintados, calculado una vez. */
function precalcular() {
  const monedas = KS.map((k, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / 7
    const cx = 170 + 104 * Math.cos(a)
    const cy = 170 + 104 * Math.sin(a)
    return { k, i, l: cx - 41, t: cy - 41, dx: -104 * Math.cos(a), dy: -104 * Math.sin(a) }
  })
  const grietas = Array.from({ length: 120 }, (_, i) => {
    const a = (i / 120) * Math.PI * 2
    return `M${(170 + 158 * Math.cos(a)).toFixed(1)} ${(170 + 158 * Math.sin(a)).toFixed(1)}L${(170 + 167 * Math.cos(a)).toFixed(1)} ${(170 + 167 * Math.sin(a)).toFixed(1)}`
  })
  const estallidos = ([[40, 40, 90, 16, 6.2], [300, 30, 100, 18, 6.6], [-10, 230, 90, 16, 7], [350, 250, 100, 18, 7.4], [90, -20, 100, 18, 7.8], [260, 330, 90, 16, 8.1], [60, 330, 90, 16, 8.4], [170, 150, 340, 44, 8.9]] as const).map(([x, y, R, nn, t], bi) => {
    const grande = bi === 7
    const cs = grande ? 200 : 100
    return {
      x, y, d: t, cs,
      p: Array.from({ length: nn }, (_, j) => {
        const a = (j / nn) * Math.PI * 2 + rnd(bi * 50 + j) * 0.2
        const dist = R * (0.7 + rnd(bi * 90 + j) * 0.35)
        const sz = grande ? 6 : 4 + (j % 2)
        return { dx: Math.cos(a) * dist, dy: Math.sin(a) * dist, c: COL[(j + bi) % 3], s: sz, l: (grande ? 1.9 : 1.4) + rnd(j + bi) * 0.3 }
      }),
    }
  })
  const brillos = Array.from({ length: 40 }, (_, i) => ({ x: -20 + rnd(i * 3 + 1) * 380, y: -30 + rnd(i * 7 + 2) * 200, s: 5 + Math.round(rnd(i) * 5), c: i % 3 ? '#F3D59A' : '#FFF3D0', dx: (rnd(i + 9) - 0.5) * 60, dy: 260 + rnd(i + 4) * 220, l: 3 + rnd(i + 5) * 1.5, d: 9 + rnd(i + 11) * 1.2 }))
  const atraidos = Array.from({ length: 30 }, (_, i) => {
    const a = rnd(i + 300) * Math.PI * 2
    const r = 220 + rnd(i + 301) * 160
    return { sx: Math.cos(a) * r, sy: Math.sin(a) * r, l: 1.1 + rnd(i + 302) * 0.6, d: 2.1 + rnd(i + 303) * 1.4 }
  })
  const chispas = Array.from({ length: 12 }, (_, i) => ({ dx: Math.cos((i / 12) * Math.PI * 2) * (40 + (i % 3) * 12), dy: Math.sin((i / 12) * Math.PI * 2) * (40 + (i % 3) * 12), s: 5 + (i % 3) * 2, c: i % 2 ? '#FFF3D0' : '#F3D59A' }))
  return { monedas, grietas, estallidos, brillos, atraidos, chispas }
}

const ONDAS_LATIDO: [number, string, number][] = [[2.1, '1.5px', 1], [2.6, '2px', 0.9], [3, '2.5px', 0.75], [3.3, '3px', 0.6], [3.55, '3.5px', 0.5], [3.72, '4px', 0.4]]
const ONDAS_CHOQUE: [string, string, number, number][] = [['3px', '#FFFFFF', 1.4, 3.8], ['2.5px', '#F3D59A', 1.8, 3.9], ['2px', 'oklch(0.8 0.14 70)', 2.2, 4.05]]

export function FinalSieteMaravillas({ tam = 340 }: { tam?: number }): ReactNode {
  const d = useMemo(precalcular, [])
  const [fin, setFin] = useState(false)
  const reducido = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  useEffect(() => {
    // (solo desarrollo) `window.__finalSiete = { espera: 99 }` deja las 7 monedas quietas para capturar el principio.
    const espera = import.meta.env.DEV ? ((window as unknown as { __finalSiete?: { espera?: number } }).__finalSiete?.espera ?? INICIO_FIN) : INICIO_FIN
    const h = window.setTimeout(() => setFin(true), espera * 1000)
    return () => window.clearTimeout(h)
  }, [])
  const k = tam / 340
  if (reducido) return <MedallaMaravillas encendidas={TODAS} tam={tam * 0.9} animada={false} />
  return (
    <div style={{ position: 'relative', width: tam, height: (tam * 400) / 340, flex: 'none' }} data-final7={fin ? 'fin' : 'quieto'}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: 340, height: 400, transform: `scale(${k})`, transformOrigin: '0 0' }}>
        <div style={{ position: 'absolute', inset: 0, animation: fin ? 'm7Base 3.9s ease both' : 'none' }}>
          <span className="mo-con-mov" style={{ position: 'absolute', left: -40, top: -40, width: 420, height: 420, borderRadius: '50%', background: 'repeating-conic-gradient(rgba(255,220,150,.27) 0 2.4deg,transparent 2.4deg 13deg)', WebkitMask: 'radial-gradient(circle,#000 30%,transparent 67%)', mask: 'radial-gradient(circle,#000 30%,transparent 67%)', animation: 'm7Rays 60s linear infinite' }} />
          <span style={{ position: 'absolute', left: -10, top: -10, width: 360, height: 360, borderRadius: '50%', background: 'radial-gradient(circle,rgba(255,214,140,.47),transparent 66%)' }} />
          <svg width="340" height="400" viewBox="0 0 340 400" style={{ position: 'absolute', inset: 0, overflow: 'visible' }} aria-hidden>
            <defs>
              <linearGradient id="m7frm" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFF1C6" /><stop offset=".5" stopColor="#A97E34" /><stop offset="1" stopColor="#F3D58E" /></linearGradient>
              <radialGradient id="m7fgd" cx=".38" cy=".32" r=".8"><stop offset="0" stopColor="#FBE8B4" /><stop offset=".5" stopColor="#D6AE5E" /><stop offset="1" stopColor="#94692A" /></radialGradient>
              <radialGradient id="m7fct" cx=".4" cy=".35" r=".8"><stop offset="0" stopColor="#FFF6D8" /><stop offset=".55" stopColor="#DDB466" /><stop offset="1" stopColor="#8A6424" /></radialGradient>
              <linearGradient id="m7frb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#F6DC98" /><stop offset="1" stopColor="#B08638" /></linearGradient>
            </defs>
            <circle cx="170" cy="170" r="168" fill="url(#m7frm)" />
            {d.grietas.map((g, i) => <path key={i} d={g} stroke="rgba(110,78,26,.5)" strokeWidth="1.4" />)}
            <circle cx="170" cy="170" r="156" fill="url(#m7fgd)" stroke="#8A6424" strokeWidth="2" />
            <circle cx="170" cy="170" r="148" fill="none" stroke="rgba(255,246,216,.55)" strokeWidth="1.2" />
            <circle cx="170" cy="170" r="104" fill="none" stroke="rgba(110,78,26,.45)" strokeWidth="1" strokeDasharray="2 4" />
            <circle cx="170" cy="170" r="54" fill="url(#m7fct)" stroke="#8A6424" strokeWidth="1.6" />
            <circle cx="170" cy="170" r="48" fill="none" stroke="rgba(255,246,216,.6)" strokeWidth="1" />
            <text x="170" y="198" textAnchor="middle" fontFamily="Geist Mono" fontWeight="600" fontSize="7.5" letterSpacing="1.6" fill="#5A3E14">DE 7</text>
            <g transform="translate(0 4)">
              <path d="M52 326L36 336L52 346L44 356H86V316H44Z" fill="#9C7634" /><path d="M288 326L304 336L288 346L296 356H254V316H296Z" fill="#9C7634" />
              <path d="M70 312Q170 300 270 312V352Q170 340 70 352Z" fill="url(#m7frb)" stroke="#7A5420" strokeWidth="1.4" />
              <path d="M78 318Q170 307 262 318" fill="none" stroke="rgba(255,246,216,.6)" strokeWidth="1" />
              <text x="170" y="337" textAnchor="middle" fontFamily="Geist Mono" fontWeight="700" fontSize="12" letterSpacing="2.6" fill="#3A2608">LAS 7 MARAVILLAS</text>
            </g>
          </svg>
          <span style={{ position: 'absolute', left: 130, top: 140, width: 80, textAlign: 'center', font: "400 40px/1 'Instrument Serif',serif", color: '#3A2608', textShadow: '0 1px 0 rgba(255,246,216,.7)' }}>7</span>
          {d.monedas.map((c) => (
            <div key={c.k} data-moneda={c.k} style={{ position: 'absolute', left: c.l, top: c.t, width: 82, height: 82, ['--dx' as string]: px(c.dx.toFixed(1)), ['--dy' as string]: px(c.dy.toFixed(1)), animation: fin ? `m7Chase .5s ${(c.i * 0.13).toFixed(2)}s ease both,m7Gather 1.5s ${(1.15 + c.i * 0.06).toFixed(2)}s cubic-bezier(.6,0,.4,1) both` : 'none' } as CSSProperties}>
              <span className="mo-con-mov" style={{ position: 'absolute', inset: -14, borderRadius: '50%', background: 'radial-gradient(circle,rgba(255,224,150,.75),transparent 68%)', animation: `m7Glow 2.6s ${(c.i * 0.37).toFixed(2)}s ease-in-out infinite` }} />
              <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'linear-gradient(135deg,#FFF1C6,#B48A3E 45%,#F6DC98 70%,#8A6424)', boxShadow: '0 0 0 1px rgba(255,246,216,.7) inset,0 6px 14px -4px rgba(60,40,10,.6)' }} />
              <div style={{ position: 'absolute', left: 5, top: 5, width: 72, height: 72, borderRadius: '50%', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', left: -14, top: -25, pointerEvents: 'none' }}>
                  <Suspense fallback={null}><EmblemaOro won kind={c.k} size={100} interactive={false} tilt={false} /></Suspense>
                </div>
                <span className="mo-con-mov" style={{ position: 'absolute', top: '-20%', bottom: '-20%', left: 0, width: '30%', background: 'linear-gradient(90deg,transparent,rgba(255,250,230,.75),transparent)', animation: `m7Sheen 5s ${(c.i * 0.37).toFixed(2)}s ease-in-out infinite` }} />
              </div>
            </div>
          ))}
        </div>
        {fin && (
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            <span style={{ position: 'absolute', left: 110, top: 110, width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle,#FFFFFF 0%,#FFE7A8 32%,rgba(255,200,120,.3) 56%,transparent 72%)', opacity: 0, animation: 'm7Core 1.9s 1.90s ease-in both,m7Big .3s 3.80s ease forwards' }} />
            {ONDAS_LATIDO.map(([t, w, l], i) => <span key={i} style={{ position: 'absolute', left: 120, top: 120, width: 100, height: 100, borderRadius: '50%', border: `${w} solid #F3D59A`, boxShadow: '0 0 14px rgba(243,213,154,.7)', opacity: 0, animation: `m7Beat ${l}s ${t}s ease-out both` }} />)}
            <span className="mo-con-mov" style={{ position: 'absolute', left: -120, top: -120, width: 580, height: 580, borderRadius: '50%', background: 'repeating-conic-gradient(rgba(255,230,170,.32) 0 3deg,transparent 3deg 15deg)', WebkitMask: 'radial-gradient(circle,#000 14%,transparent 64%)', mask: 'radial-gradient(circle,#000 14%,transparent 64%)', opacity: 0, animation: 'm7GodR 6s 3.90s ease-out both,m7Ring 50s 9.90s linear infinite' }} />
            <span style={{ position: 'absolute', left: -30, top: -30, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle,rgba(255,214,140,.6),transparent 66%)', opacity: 0, animation: 'm7Rise 1.2s 3.90s ease both,m7Halo 3.4s 5.10s ease-in-out infinite' }} />
            <div data-medalla-final="" style={{ position: 'absolute', left: 0, top: 2, opacity: 0, animation: 'm7SpinIn 2.2s 3.85s cubic-bezier(.2,.8,.2,1) both' }}>
              <MedallaMaravillas encendidas={TODAS} tam={340} animada={false} />
            </div>
            {d.atraidos.map((q, i) => <span key={i} style={{ position: 'absolute', left: 167, top: 167, width: 6, height: 6, borderRadius: '50%', background: '#FFE7B0', boxShadow: '0 0 8px #FFD58A', ['--sx' as string]: px(q.sx.toFixed(0)), ['--sy' as string]: px(q.sy.toFixed(0)), opacity: 0, animation: `m7Pull ${q.l.toFixed(2)}s ${q.d.toFixed(2)}s cubic-bezier(.5,0,.8,.6) both` } as CSSProperties} />)}
            {ONDAS_CHOQUE.map(([w, c, l, dd], i) => <span key={i} style={{ position: 'absolute', left: 95, top: 95, width: 150, height: 150, borderRadius: '50%', border: `${w} solid ${c}`, opacity: 0, animation: `m7Shock ${l}s ${dd}s ease-out both` }} />)}
            <span style={{ position: 'absolute', left: 0, top: 0, width: 340, height: 400, overflow: 'hidden', mixBlendMode: 'screen', pointerEvents: 'none' }}>
              <span style={{ position: 'absolute', top: -40, bottom: -40, left: 0, width: 110, background: 'linear-gradient(90deg,transparent,rgba(255,250,232,.85),transparent)', filter: 'blur(6px)', opacity: 0, animation: 'm7Sweep 1.3s 5.9s cubic-bezier(.5,0,.4,1) both' }} />
            </span>
            {d.estallidos.map((b, bi) => (
              <span key={bi} className="mo-con-mov" style={{ position: 'absolute', left: b.x, top: b.y, width: 0, height: 0 }}>
                <span style={{ position: 'absolute', left: -b.cs / 2, top: -b.cs / 2, width: b.cs, height: b.cs, borderRadius: '50%', background: 'radial-gradient(circle,#FFFFFF,rgba(255,226,160,.6) 35%,transparent 70%)', opacity: 0, animation: `m7FwC .9s ${b.d}s ease-out both` }} />
                {b.p.map((q, j) => <span key={j} style={{ position: 'absolute', left: -q.s / 2, top: -q.s / 2, width: q.s, height: q.s, borderRadius: '50%', background: q.c, boxShadow: `0 0 8px ${q.c}`, ['--dx' as string]: px(q.dx.toFixed(0)), ['--dy' as string]: px(q.dy.toFixed(0)), opacity: 0, animation: `m7Fw ${q.l.toFixed(2)}s ${b.d}s cubic-bezier(.15,.7,.3,1) both` } as CSSProperties} />)}
              </span>
            ))}
            {d.brillos.map((g, i) => <span key={i} className="mo-con-mov" style={{ position: 'absolute', left: g.x, top: g.y, width: g.s, height: g.s, background: g.c, clipPath: 'polygon(50% 0,62% 38%,100% 50%,62% 62%,50% 100%,38% 62%,0 50%,38% 38%)', ['--dx' as string]: px(g.dx.toFixed(0)), ['--dy' as string]: px(g.dy.toFixed(0)), opacity: 0, animation: `m7Glit ${g.l.toFixed(2)}s ${g.d.toFixed(2)}s cubic-bezier(.3,.1,.6,1) both` } as CSSProperties} />)}
            <span style={{ position: 'absolute', left: -200, top: -200, width: 740, height: 800, background: 'radial-gradient(circle at 50% 46%,#FFFFFF 0%,rgba(255,244,214,.85) 30%,transparent 62%)', opacity: 0, animation: 'm7White 1s 3.70s ease-out both' }} />
          </div>
        )}
      </div>
    </div>
  )
}

export { INICIO_FIN, NOMBRES }
