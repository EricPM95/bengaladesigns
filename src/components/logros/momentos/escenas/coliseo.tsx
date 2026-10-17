import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { Emblema } from '../../dibujos'
import { Destellos, Fuegos } from '../Fuegos'
import { estiloBoton, estiloSaltar, Lienzo, sinMovimiento, TEXTOS } from './cine'
import '../momentos.css'

/**
 * LA PELÍCULA DEL COLISEO (Tanda 8B), «Emblema Maravilla C» del diseño. ~28 s: «Casi 2.000 años esperándote…», un segundo frase, y desde la oscuridad cientos de
 * partículas de oro vuelan y forman el Coliseo, que se vuelve sólido, se enciende y recibe un destello; el oro se junta en un punto, late y estalla en el
 * emblema con fuegos artificiales; al final sale «Tu primera maravilla». SIEMPRE se ve entera (también al volver a verla). Se salta tocando (va al emblema).
 * Todo en SVG y CSS; los tiempos son los del diseño (`T`, `T0`, `TL`) restando `--off`, que es lo que se salta.
 */
const FRASE = 'Casi 2.000 años esperándote…'
const FRASE2 = 'El anfiteatro más grande jamás construido.'
const SALTO = 23.4
const rnd = (k: number) => {
  const x = Math.sin(k * 12.9898 + 78.233) * 43758.5453
  return x - Math.floor(x)
}
const S = (v: number) => (v >= 6.2 ? v + 1.6 : v)
const F = (t: number) => t + (t >= 3 ? 7.9 : 0) + (t >= 9 ? 3.1 : 0)
const T = (t: number) => `calc(${F(S(t)).toFixed(3)}s - var(--off))`
const T0 = (t: number) => `calc(${F(t).toFixed(3)}s - var(--off))`
const TL = (t: number) => `calc(${t.toFixed(3)}s - var(--off))`
const tNum = (t: number) => F(S(t))

interface Trazo {
  d: string
  dl: string
  l: string
  w: number
}

function construir() {
  const draw: Trazo[] = []
  const arches: { p: string; d: string }[] = []
  const pts: [number, number][] = []
  const D = (d: string, dl: number, l = 0.9, w = 1.6) => draw.push({ d, dl: T(dl), l: `${l.toFixed(2)}s`, w })
  const linea = (P: [number, number][], paso: number) => {
    for (let i = 1; i < P.length; i++) {
      const [x1, y1] = P[i - 1]
      const [x2, y2] = P[i]
      const L = Math.hypot(x2 - x1, y2 - y1)
      const m = Math.max(1, Math.round(L / paso))
      for (let k = 0; k < m; k++) pts.push([x1 + ((x2 - x1) * k) / m, y1 + ((y2 - y1) * k) / m])
    }
  }
  D('M8 620H382', 6.3, 1, 2.4)
  D('M25 620V360Q160 344 300 352', 6.4, 1.3, 2.6)
  D('M300 352V380L318 384V420L334 424V470L350 474V520L365 524V620', 6.55, 1.1, 2.2)
  linea([[8, 620], [382, 620]], 9)
  linea([[25, 620], [25, 360]], 9)
  for (let x = 25; x <= 300; x += 9) {
    const t = (x - 25) / 275
    pts.push([x, (1 - t) * (1 - t) * 360 + 2 * (1 - t) * t * 344 + t * t * 352])
  }
  linea([[300, 352], [300, 380], [318, 384], [318, 420], [334, 424], [334, 470], [350, 474], [350, 520], [365, 524], [365, 620]], 9)
  ;[[560, 365], [500, 350], [440, 334], [380, 300]].forEach(([y, xr], i) => {
    D(`M25 ${y}H${xr}`, 6.7 + i * 0.12, 0.8, 1.4)
    linea([[25, y], [xr, y]], 12)
  })
  const TIERS: [number, number, number, number, number, string][] = [[566, 616, 25, 365, 8, 'a'], [506, 556, 25, 350, 8, 'a'], [446, 496, 25, 334, 7, 'a'], [386, 432, 25, 300, 6, 'w']]
  let ai = 0
  TIERS.forEach(([yt, yb, x0, x1, nn, kind], r) => {
    const w = (x1 - x0) / nn
    for (let i = 0; i < nn; i++) {
      const x = x0 + i * w
      const px = x + w * 0.16
      const pw = w * 0.68
      const rr = pw / 2
      const p =
        kind === 'a'
          ? `M${px.toFixed(1)} ${yb}V${(yt + rr).toFixed(1)}A${rr.toFixed(1)} ${rr.toFixed(1)} 0 0 1 ${(px + pw).toFixed(1)} ${(yt + rr).toFixed(1)}V${yb}Z`
          : `M${(px + 3).toFixed(1)} ${yb - 8}V${yt + 10}H${(px + pw - 3).toFixed(1)}V${yb - 8}Z`
      D(p, 6.8 + r * 0.14 + i * 0.03, 0.7, 1.2)
      if (i > 0) D(`M${x.toFixed(1)} ${yt - 4}V${yb}`, 6.7 + r * 0.14 + i * 0.03, 0.5, 0.9)
      arches.push({ p, d: TL(16.8 + ai++ * 0.14) })
      if (kind === 'a') {
        for (let k = 0; k <= 6; k++) {
          const an = Math.PI + (k / 6) * Math.PI
          pts.push([px + rr + rr * Math.cos(an), yt + rr + rr * Math.sin(an)])
        }
        pts.push([px, yb - 6], [px + pw, yb - 6])
      } else pts.push([px + 3, yt + 10], [px + pw - 3, yt + 10], [px + 3, yb - 8], [px + pw - 3, yb - 8])
    }
  })
  const COLS = ['#FFE7B0', '#F3D59A', '#FFFFFF', '#E9C77A']
  const parts = pts.map(([x, y], k) => {
    const a = rnd(k + 1) * Math.PI * 2
    const r = 260 + rnd(k + 2) * 320
    const s = 1.6 + rnd(k + 3) * 2.2
    return { x, y, s, c: COLS[k % 4], sx: Math.cos(a) * r, sy: Math.sin(a) * r, l: 1.9 + rnd(k + 4) * 0.9, d: T0(3.4 + ((620 - y) / 276) * 3.3 + ((x - 8) / 374) * 0.5 + rnd(k + 5) * 0.35), cd: T(9.75 + rnd(k + 6) * 0.35), tw: k % 3 === 0, tl: 1.2 + rnd(k + 7) * 1.6, td: rnd(k + 8) * 2 }
  })
  const motes = Array.from({ length: 30 }, (_, i) => ({ x: rnd(i + 600) * 390, y: rnd(i + 601) * 844, s: 1 + rnd(i + 602) * 2, mx: (rnd(i + 603) - 0.5) * 40, my: -10 - rnd(i + 604) * 30, a: T(3.1 + rnd(i + 605) * 1.5), l: 5 + rnd(i + 606) * 4, dd: rnd(i + 607) * 3 }))
  const palabras = (txt: string, base: number, paso: number) => {
    let i = 0
    return txt.split(' ').map((w) => {
      const c = [...w].map((ch) => ({ ch, d: TL(base + i++ * paso) }))
      i++
      return c
    })
  }
  const words = palabras(FRASE, 0.3, 0.088)
  const words2 = palabras(FRASE2, 5.4, 0.068)
  return { draw, arches, parts, motes, words, words2 }
}

const HAPTICOS: [number, number][] = [[5.6, 10], [8.4, 24], [10.2, 10], [10.55, 14], [10.95, 50], [12.2, 16], [12.8, 20], [13.4, 26], [13.75, 60]]

interface Props {
  nombre?: string | null
  linea?: string | null
  onSeguir: () => void
  onSaltarTodo?: (() => void) | null
}

export default function PeliculaColiseo({ nombre, linea, onSeguir, onSaltarTodo }: Props): ReactNode {
  const datos = useMemo(construir, [])
  const t = TEXTOS.coliseo
  const reducido = useMemo(sinMovimiento, [])
  const [off, setOff] = useState(0)
  const [tick, setTick] = useState(0)
  const t0 = useRef(performance.now())
  const timers = useRef<number[]>([])

  const hapticos = (desde: number) => {
    timers.current.forEach(clearTimeout)
    timers.current = []
    for (const [tt, ms] of HAPTICOS) {
      const tabs = F(S(tt))
      if (tabs >= desde)
        timers.current.push(
          window.setTimeout(() => {
            try {
              if (navigator.userActivation?.hasBeenActive !== false) navigator.vibrate?.(ms)
            } catch {
              /* sin vibración */
            }
          }, (tabs - desde) * 1000),
        )
    }
  }
  useEffect(() => {
    if (!reducido) hapticos(0)
    return () => timers.current.forEach(clearTimeout)
  }, [reducido])

  const saltar = () => {
    const transcurrido = (performance.now() - t0.current) / 1000 + off
    if (transcurrido < SALTO) {
      setOff(SALTO - (performance.now() - t0.current) / 1000)
      setTick((x) => x + 1)
      hapticos(SALTO)
    }
  }
  const tEmb = 23.6
  const tTextos = 24
  const tFuera = 26.6
  const tCard = 26.9
  const tBoton = 27.6
  const [verBoton, setVerBoton] = useState(reducido)
  useEffect(() => {
    if (reducido) return undefined
    const restante = Math.max(0, tBoton - off - (performance.now() - t0.current) / 1000)
    const h = window.setTimeout(() => setVerBoton(true), restante * 1000)
    return () => window.clearTimeout(h)
  }, [off, reducido])

  const root = { ['--off' as string]: `${off.toFixed(2)}s` } as CSSProperties
  const dorado = 'linear-gradient(135deg,#FFF4D6,#D9B26A 45%,#FFE6A6)'
  return (
    <div className="mo" role="dialog" aria-modal="true" aria-label="Emblema: una maravilla del mundo" onClick={saltar} style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'radial-gradient(circle at 50% 48%,#141826 0%,#06070C 72%)', color: '#FFFDF8', fontFamily: "'Geist',system-ui,sans-serif", textAlign: 'center', cursor: 'pointer', userSelect: 'none', overflow: 'hidden', ...root }}>
      <Lienzo>
        {/* Con «reducir movimiento»: solo el emblema y sus textos, quietos */}
        <div className="mo-sin-mov" style={{ position: 'absolute', inset: 0 }}>
          <div data-vuelo="logros" style={{ position: 'absolute', left: 95, top: 147, width: 200, height: 250 }}><Emblema id="coliseo" tam={200} /></div>
          <Textos nombre={nombre ?? t.nombre} linea={linea ?? t.linea} quieto />
        </div>
        <div className="mo-con-mov" key={tick} style={{ position: 'absolute', inset: 0 }}>
          {datos.motes.map((d, i) => (
            <span key={i} style={{ position: 'absolute', left: d.x, top: d.y, width: d.s, height: d.s, borderRadius: '50%', background: '#F3D59A', boxShadow: '0 0 6px rgba(243,213,154,.8)', ['--mx' as string]: `${d.mx}px`, ['--my' as string]: `${d.my}px`, opacity: 0, animation: `mcIn 1.6s ${d.a} ease both, mcDrift ${d.l}s ${d.dd}s ease-in-out infinite` } as CSSProperties} />
          ))}
          <div style={{ position: 'absolute', inset: 0, transformOrigin: '195px 480px', animation: `mcPush 4s calc(20.2s - var(--off)) ease-out both` }}>
            <div style={{ position: 'absolute', inset: 0, animation: `mcFadeOut .9s calc(22.3s - var(--off)) ease forwards` }}>
              <svg width="390" height="844" viewBox="0 0 390 844" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', inset: 0, overflow: 'visible', filter: 'drop-shadow(0 0 9px rgba(255,214,140,.45))' }}>
                <defs><linearGradient id="mcg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFF4D6" /><stop offset=".45" stopColor="#D9B26A" /><stop offset="1" stopColor="#FFE6A6" /></linearGradient></defs>
                {datos.arches.map((a, i) => (
                  <path key={i} d={a.p} stroke="none" style={{ fill: '#FFD98C', fillOpacity: 0, animation: `mcLit .9s ${a.d} ease both` }} />
                ))}
                {datos.draw.map((p, i) => (
                  <path key={i} d={p.d} pathLength={100} stroke="url(#mcg)" strokeWidth={p.w} style={{ strokeDasharray: 100, strokeDashoffset: 100, animation: `mcDraw ${p.l} ${p.dl} cubic-bezier(.4,0,.2,1) both` }} />
                ))}
              </svg>
              <div style={{ position: 'absolute', left: 18, top: 336, width: 356, height: 290, overflow: 'hidden', pointerEvents: 'none', mixBlendMode: 'screen' }}>
                <span style={{ position: 'absolute', top: -40, bottom: -40, left: 0, width: 90, background: 'linear-gradient(90deg,transparent,rgba(255,250,235,.9),transparent)', filter: 'blur(6px)', opacity: 0.9, animation: 'mcSheen 1.4s calc(21.1s - var(--off)) cubic-bezier(.5,0,.4,1) both' }} />
              </div>
            </div>
            {datos.parts.map((p, i) => (
              <span key={i} style={{ position: 'absolute', left: p.x, top: p.y, width: p.s, height: p.s, margin: -p.s / 2, borderRadius: '50%', background: p.c, boxShadow: `0 0 6px ${p.c}`, ['--sx' as string]: `${p.sx}px`, ['--sy' as string]: `${p.sy}px`, ['--cx' as string]: `${195 - p.x}px`, ['--cy' as string]: `${300 - p.y}px`, opacity: 0, animation: `mcGather ${p.l.toFixed(2)}s ${p.d} cubic-bezier(.16,.8,.24,1) both, mcCollapse 1s ${p.cd} cubic-bezier(.6,0,.9,.5) forwards` } as CSSProperties}>
                {p.tw && <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'inherit', animation: `mcTw ${p.tl.toFixed(1)}s ${p.td.toFixed(1)}s ease-in-out infinite` }} />}
              </span>
            ))}
          </div>
          <span style={{ position: 'absolute', left: 135, top: 240, width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle,#FFFFFF 0%,#FFE7A8 30%,rgba(255,200,120,.3) 55%,transparent 72%)', opacity: 0, animation: `mcCore 1.1s calc(22.5s - var(--off)) ease-in both, mcFadeOut .3s calc(23.6s - var(--off)) ease forwards` }} />
          <span style={{ position: 'absolute', left: 105, top: 210, width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle,#FFFFFF,rgba(255,236,190,.7) 30%,transparent 70%)', opacity: 0, animation: `mcFlash 1.3s calc(23.55s - var(--off)) ease-out both` }} />
          <span style={{ position: 'absolute', left: 120, top: 225, width: 150, height: 150, borderRadius: '50%', border: '2.5px solid #F3D59A', opacity: 0, animation: `mcShock 1.6s calc(23.6s - var(--off)) ease-out both` }} />
          <Fuegos desde={tNum(12.2) - off} />
          {/* El emblema */}
          <div style={{ position: 'absolute', inset: 0, opacity: 0, animation: `mcEmb 1.1s calc(${tEmb}s - var(--off)) cubic-bezier(.2,.8,.2,1) both` }}>
            <span style={{ position: 'absolute', left: 45, top: 150, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle,rgba(255,214,140,.5),transparent 68%)', animation: `mcHalo 3.4s calc(24.6s - var(--off)) ease-in-out infinite` }} />
            <span style={{ position: 'absolute', left: 61, top: 166, width: 268, height: 268, borderRadius: '50%', animation: `mcRing 14s calc(23.6s - var(--off)) linear infinite` }}>
              <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'conic-gradient(from 0deg,transparent 0 8%,#F3D59A 18%,transparent 30%,transparent 50%,#FFF3D0 62%,transparent 74%)', WebkitMask: 'radial-gradient(circle,transparent 63%,#000 64%,#000 66.5%,transparent 67.5%)', mask: 'radial-gradient(circle,transparent 63%,#000 64%,#000 66.5%,transparent 67.5%)' }} />
              <span style={{ position: 'absolute', inset: 7, borderRadius: '50%', border: '1.5px dashed rgba(243,213,154,.55)' }} />
            </span>
            <div data-vuelo="logros" style={{ position: 'absolute', left: 95, top: 147, width: 200, height: 250, filter: 'drop-shadow(0 0 26px rgba(255,214,140,.6))' }}>
              <Emblema id="coliseo" animado tam={200} />
            </div>
          </div>
          <Textos nombre={nombre ?? t.nombre} linea={linea ?? t.linea} desde={tTextos} hasta={tFuera} />
          <Destellos desde={tNum(13.85) - off} n={44} />
          {/* «Y además… Tu primera maravilla» */}
          <div data-vuelo="perfil" style={{ position: 'absolute', left: 50, right: 50, top: 604, height: 84, borderRadius: 22, background: 'rgba(255,253,248,.1)', border: '1px solid rgba(243,213,154,.4)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', gap: 14, padding: '0 16px 0 12px', textAlign: 'left', opacity: 0, animation: `mcPop .7s calc(${tCard}s - var(--off)) cubic-bezier(.2,.8,.2,1) both` }}>
            <span style={{ position: 'relative', width: 60, height: 60, flex: 'none', borderRadius: '50%', background: 'radial-gradient(circle at 35% 28%,#FFF6DC,#D9B86A 55%,#9C7634)', boxShadow: 'inset 0 0 0 3px rgba(255,255,255,.35),0 6px 14px -6px rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5A4012' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 20h18M5 20V9M19 20V9M5 9a7 3 0 0 1 14 0M8 20v-8M12 20v-8M16 20v-8" /></svg>
              <span style={{ position: 'absolute', bottom: -6, height: 16, padding: '0 6px', borderRadius: 999, background: '#2A1D10', color: '#F3D59A', font: "700 9px/16px 'Geist Mono',monospace" }}>1/7</span>
            </span>
            <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ font: "600 9.5px 'Geist Mono',monospace", letterSpacing: '.16em', textTransform: 'uppercase', color: '#F3D59A' }}>Y además…</span>
              <span style={{ font: "400 22px/1.05 'Instrument Serif',serif" }}>Tu primera maravilla</span>
              <span style={{ font: "400 11.5px 'Geist'", color: 'rgba(255,253,248,.65)' }}>Las 7 maravillas del mundo · 1 de 7</span>
            </span>
          </div>
          {/* La oscuridad y las dos frases del principio */}
          <div style={{ position: 'absolute', inset: 0, background: '#000', animation: 'mcOut .9s calc(10.9s - var(--off)) ease both', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', left: 24, right: 24, top: 330, font: "italic 400 42px/1.15 'Instrument Serif',serif", color: '#F3E3B8', textWrap: 'balance', animation: 'mcOut .6s calc(4.7s - var(--off)) ease both' }}>
            {datos.words.map((w, i) => (
              <span key={i} style={{ display: 'inline-block', whiteSpace: 'nowrap', margin: '0 .14em' }}>
                {w.map((c, j) => (
                  <span key={j} style={{ display: 'inline-block', opacity: 0, animation: `mcLetter 1s ${c.d} ease both` }}>{c.ch}</span>
                ))}
              </span>
            ))}
          </div>
          <div style={{ position: 'absolute', left: 28, right: 28, top: 312, font: "italic 400 36px/1.2 'Instrument Serif',serif", color: '#F3E3B8', textWrap: 'balance', animation: 'mcOut .6s calc(10.3s - var(--off)) ease forwards' }}>
            {datos.words2.map((w, i) => (
              <span key={i} style={{ display: 'inline-block', whiteSpace: 'nowrap', margin: '0 .13em' }}>
                {w.map((c, j) => (
                  <span key={j} style={{ display: 'inline-block', opacity: 0, animation: `mcLetter 1s ${c.d} ease both` }}>{c.ch}</span>
                ))}
              </span>
            ))}
          </div>
        </div>
      </Lienzo>
      {onSaltarTodo && (
        <button type="button" onClick={(e) => { e.stopPropagation(); onSaltarTodo() }} style={estiloSaltar}>Saltar todo</button>
      )}
      <span aria-hidden className="mo-con-mov" style={{ position: 'absolute', left: 0, right: 0, bottom: 14, font: "400 11.5px 'Geist'", color: 'rgba(255,253,248,.4)', pointerEvents: 'none', opacity: verBoton ? 0 : 1 }}>Toca para ir al emblema</span>
      {verBoton && (
        <button type="button" onClick={(e) => { e.stopPropagation(); onSeguir() }} style={{ ...estiloBoton, background: dorado, animation: 'ecUp .7s ease both' }}>Seguir</button>
      )}
    </div>
  )
}

function Textos({ nombre, linea, desde = 0, hasta = 0, quieto = false }: { nombre: string; linea: string; desde?: number; hasta?: number; quieto?: boolean }): ReactNode {
  const an = (dt: number) => (quieto ? 'none' : `mcUp .7s calc(${(desde + dt).toFixed(2)}s - var(--off)) ease both`)
  const op = quieto ? 1 : 0
  return (
    <div style={{ position: 'absolute', left: 44, right: 44, top: 600, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, animation: quieto ? 'none' : `mcOut .5s calc(${hasta}s - var(--off)) ease forwards` }}>
      <span style={{ font: "600 10.5px 'Geist Mono',monospace", letterSpacing: '.2em', textTransform: 'uppercase', color: '#F3D59A', opacity: op, animation: an(0) }}>¡Has descubierto un Emblema Oculto!</span>
      <span style={{ font: "400 36px/1.05 'Instrument Serif',serif", textWrap: 'balance', opacity: op, animation: an(0.15) }}>{nombre}</span>
      <span style={{ maxWidth: 290, font: "italic 400 18px/1.35 'Instrument Serif',serif", color: 'rgba(255,253,248,.82)', textWrap: 'balance', opacity: op, animation: an(0.3) }}>{linea}</span>
    </div>
  )
}
