import { useEffect, useRef } from 'react'
import type { Route } from '../../lib/types'
import { useRouteStore } from '../../store/useRouteStore'

/**
 * La tarjeta de temporada (PROMPT_TARJETA_TEMPORADA, INVARIANTES 415): todos los viajes, al abrir la ruta por primera vez,
 * empiezan con ella; después salen los avisos de fechas (DateNoticesModal.tsx). Copia el diseño de
 * docs/diseno/tarjeta_temporada/Navidad Modal.dc.html: 390 px, la escena de la época arriba (el cielo, la silueta del
 * destino y lo que cae, que se desvanece antes del texto), «Hemos preparado tu viaje para estas fechas», el título, el texto
 * del motor (server/engine/seasonNote.js: solo lo que la ruta hace) y «Entendido». En Navidad, la 1a («Noche en Roma»).
 * Con «reducir movimiento», no cae nada. Se cierra con «Entendido» y no vuelve a salir en ese viaje.
 */

type CardSeason = 'primavera' | 'verano' | 'otono' | 'invierno' | 'navidad'

interface Scene {
  sky: string
  glow: string
  glowTop: number
  glowSize: number
  skyline: string
  eyebrow: string
  title: string
  titleShadow?: string
  titleSize: number
  fx: { n: number; type?: 'petal' | 'leaf' | 'mote'; col?: string; cols?: string[]; speed?: number; drift?: number }
}

const SCENES: Record<CardSeason, Scene> = {
  primavera: {
    sky: 'linear-gradient(180deg,#F3C9D2 0%,#F8DCD8 50%,#FBE9DE 80%,#FFFDF8 100%)',
    glow: 'radial-gradient(circle,rgba(255,255,255,.7),transparent 65%)',
    glowTop: 70,
    glowSize: 280,
    skyline: '#C99AA8',
    eyebrow: '#8E3F5A',
    title: '#4A2233',
    titleSize: 48,
    fx: { n: 34, type: 'petal', cols: ['#F6B8C8', '#FAD3DC', '#FFFFFF', '#EFA3B7'], speed: 0.7, drift: 0.7 },
  },
  verano: {
    sky: 'linear-gradient(180deg,#F7B267 0%,#FAC98A 45%,#FDE3BD 80%,#FFFDF8 100%)',
    glow: 'radial-gradient(circle,oklch(0.97 0.08 90) 0 22%,oklch(0.92 0.12 80 / .55) 30%,transparent 66%)',
    glowTop: 70,
    glowSize: 280,
    skyline: '#C46A3E',
    eyebrow: '#7A3514',
    title: '#3E1C0C',
    titleSize: 56,
    fx: { n: 40, type: 'mote', cols: ['#FFF4C8', '#FFE08A', '#FFFFFF'] },
  },
  otono: {
    sky: 'linear-gradient(180deg,#4A2C24 0%,#8E4A2C 42%,#D08A4E 72%,#FFFDF8 100%)',
    glow: 'radial-gradient(circle,oklch(0.85 0.13 65 / .45),transparent 65%)',
    glowTop: 70,
    glowSize: 280,
    skyline: '#3A2018',
    eyebrow: 'rgba(255,228,196,.85)',
    title: '#FFF1DE',
    titleSize: 56,
    fx: { n: 26, type: 'leaf', cols: ['#D9772F', '#B8451F', '#E6A93A', '#8E3A1C'], speed: 0.8, drift: 0.9 },
  },
  invierno: {
    sky: 'linear-gradient(180deg,#A9BCCF 0%,#C9D6E2 45%,#E6ECF1 78%,#FFFDF8 100%)',
    glow: 'radial-gradient(circle,rgba(255,255,255,.75),transparent 62%)',
    glowTop: 70,
    glowSize: 280,
    skyline: '#7F93A8',
    eyebrow: '#3E5670',
    title: '#1F2E42',
    titleSize: 56,
    fx: { n: 110, col: '#ffffff', speed: 0.8 },
  },
  navidad: {
    sky: 'linear-gradient(180deg,#0E1A33 0%,#1D3050 55%,#3C4F6E 82%,#FFFDF8 100%)',
    glow: 'radial-gradient(circle,oklch(0.85 0.12 75 / .38),transparent 65%)',
    glowTop: 84,
    glowSize: 260,
    skyline: '#101B30',
    eyebrow: 'rgba(255,240,215,.85)',
    title: '#FFF6E6',
    titleShadow: '0 2px 20px rgba(255,200,120,.35)',
    titleSize: 56,
    fx: { n: 90, col: '#ffffff' },
  },
}

const SKYLINE =
  'M0 120V92h26v-8h14v8h20V70h8v-6h6v6h8v22h30V78h40V60l6-4v-8h4v8l6 4v18h24c0-34 16-52 34-58v-8h3v-6h2v6h3v8c18 6 34 24 34 58h30V84h16v-6h10v6h18V96H400V120z'
const NAME: Record<CardSeason, string> = { primavera: 'Primavera', verano: 'Verano', otono: 'Otoño', invierno: 'Invierno', navidad: 'Navidad' }
/** Las ventanas encendidas y la guirnalda de la Navidad (1a). */
const WINDOWS = Array.from({ length: 14 }, (_, i) => ({ mb: [4, 18, 8, 28, 12, 2, 34, 22, 6, 16, 26, 10, 3, 14][i], d: 2 + ((i * 7) % 5) * 0.6 }))
const BULBS = Array.from({ length: 12 }, (_, i) => {
  const x = i / 11
  const y = 4 + Math.sin(x * Math.PI * 1.9 + 0.3) * 10 + 10 * (1 - Math.abs(x - 0.5) * 2) * 0.6
  return { x: x * 96 + 2, y, d: 1.4 + ((i * 5) % 4) * 0.5 }
})
/** Lo que cae se desvanece antes de llegar al texto (la escena mide 300 px). */
const FADE_Y = 330

function cardSeasonOf(route: Route): CardSeason {
  const note = route.seasonNote
  if (note?.icon === 'navidad' || note?.season === 'navidad') return 'navidad'
  const season = note?.season
  return season === 'primavera' || season === 'verano' || season === 'otono' || season === 'invierno' ? season : 'primavera'
}

/** Lo que cae (pétalos, motas de sol, hojas o nieve), en un canvas encima de la tarjeta. Nada con «reducir movimiento». */
function useFalling(canvasRef: React.RefObject<HTMLCanvasElement>, fx: Scene['fx'], active: boolean) {
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !active) return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const size = { width: 1, height: 1 }
    const fit = () => {
      const box = canvas.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      size.width = box.width
      size.height = box.height
      canvas.width = box.width * dpr
      canvas.height = box.height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    fit()
    const observer = window.ResizeObserver ? new ResizeObserver(fit) : null
    observer?.observe(canvas.parentElement ?? canvas)
    const particles = Array.from({ length: fx.n }, (_, i) => ({
      x: Math.random() * 390,
      y: Math.random() * 560,
      s: 0.6 + Math.random() * 2.4,
      v: 0.25 + Math.random() * 0.7,
      p: Math.random() * 6.28,
      r: Math.random() * 6.28,
      vr: (Math.random() - 0.5) * 0.04,
      c: fx.cols ? fx.cols[i % fx.cols.length] : fx.col ?? '#ffffff',
    }))
    const up = fx.type === 'mote'
    let raf = 0
    const draw = (t: number) => {
      ctx.clearRect(0, 0, size.width, size.height)
      for (const q of particles) {
        if (up) {
          q.y -= q.v * 0.5
          q.x += Math.sin(t / 1800 + q.p) * 0.25
          if (q.y < -6) {
            q.y = size.height + 6
            q.x = Math.random() * size.width
          }
        } else {
          q.y += q.v * (q.s / 2 + 0.4) * (fx.speed ?? 1)
          q.x += Math.sin(t / 1400 + q.p) * (fx.drift ?? 0.3)
          if (q.y > size.height + 10) {
            q.y = -10
            q.x = Math.random() * size.width
          }
        }
        q.r += q.vr
        const fade = Math.max(0, Math.min(1, (FADE_Y - q.y) / 60 + 0.15))
        ctx.globalAlpha = (fx.type ? 0.55 + q.s / 6 : 0.35 + q.s / 4) * fade
        ctx.fillStyle = q.c
        ctx.save()
        ctx.translate(q.x, q.y)
        ctx.rotate(q.r)
        ctx.beginPath()
        if (fx.type === 'petal') ctx.ellipse(0, 0, q.s * 2.2, q.s * 1.3, 0, 0, 6.28)
        else if (fx.type === 'leaf') {
          const L = q.s * 3.4
          ctx.moveTo(-L, 0)
          ctx.quadraticCurveTo(0, -L * 0.7, L, 0)
          ctx.quadraticCurveTo(0, L * 0.7, -L, 0)
        } else if (fx.type === 'mote') {
          ctx.shadowColor = q.c
          ctx.shadowBlur = 8
          ctx.arc(0, 0, q.s * 0.9, 0, 6.28)
        } else ctx.arc(0, 0, q.s, 0, 6.28)
        ctx.fill()
        ctx.restore()
      }
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(raf)
      observer?.disconnect()
    }
  }, [canvasRef, fx, active])
}

export function SeasonCard({ route }: { route: Route }) {
  const dismissSeasonNote = useRouteStore((state) => state.dismissSeasonNote)
  const note = route.seasonNote
  const open = Boolean(note?.text) && !route.seasonNoteDismissed
  const season = cardSeasonOf(route)
  const scene = SCENES[season]
  const city = route.destination.split(',')[0].trim()
  const title = note?.title ?? `${NAME[season]} en ${city}`
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useFalling(canvasRef, scene.fx, open)

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') dismissSeasonNote()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, dismissSeasonNote])

  if (!open || !note) return null
  return (
    <div className="fixed inset-0 z-[85] flex items-center justify-center px-4" role="dialog" aria-modal="true" aria-labelledby="season-card-title">
      <div className="trazo-notice-backdrop absolute inset-0 bg-text/25 backdrop-blur-[6px]" onClick={dismissSeasonNote} />
      <div className="trazo-notice-panel relative w-full max-w-[390px] overflow-hidden rounded-[30px] bg-[#FFFDF8] shadow-[0_30px_70px_-30px_rgba(40,25,5,.45)]">
        <div className="relative h-[300px]" style={{ background: scene.sky }}>
          <div
            className="absolute left-1/2 rounded-full"
            style={{ top: scene.glowTop, width: scene.glowSize, height: scene.glowSize, marginLeft: -scene.glowSize / 2, background: scene.glow }}
          />
          <svg viewBox="0 0 390 120" preserveAspectRatio="none" className="absolute bottom-[34px] left-[-2px] h-[120px] w-[calc(100%+4px)]" aria-hidden="true">
            <path d={SKYLINE} fill={scene.skyline} />
          </svg>
          <div className="absolute inset-x-0 bottom-0 h-10" style={{ background: `linear-gradient(180deg,${scene.skyline} 0%,#FFFDF8 100%)` }} />
          {season === 'navidad' && (
            <>
              <div className="absolute inset-x-0 bottom-[36px] flex h-[70px] items-end justify-around px-[18px] pb-3" aria-hidden="true">
                {WINDOWS.map((w, i) => (
                  <span
                    key={i}
                    className="season-card-glow"
                    style={{ width: 3, height: 4, borderRadius: 1, background: 'oklch(0.86 0.13 80)', boxShadow: '0 0 6px oklch(0.86 0.13 80)', marginBottom: w.mb, animationDuration: `${w.d}s` }}
                  />
                ))}
              </div>
              <svg viewBox="0 0 390 40" preserveAspectRatio="none" className="absolute inset-x-0 top-[18px] h-10 w-full overflow-visible" aria-hidden="true">
                <path d="M-10 4 Q 100 36 195 14 T 400 6" fill="none" stroke="rgba(255,240,210,.35)" strokeWidth="1" />
              </svg>
              <div className="absolute inset-x-0 top-3 h-10" aria-hidden="true">
                {BULBS.map((b, i) => (
                  <span
                    key={i}
                    className="season-card-glow absolute rounded-full"
                    style={{ left: `${b.x}%`, top: b.y, width: 5, height: 5, background: 'oklch(0.88 0.12 80)', boxShadow: '0 0 10px 2px oklch(0.85 0.14 75 / .8)', animationDuration: `${b.d}s` }}
                  />
                ))}
              </div>
            </>
          )}
          <p className="absolute inset-x-0 top-16 text-center font-mono text-[11px] font-medium uppercase tracking-[.2em]" style={{ color: scene.eyebrow }}>
            Hemos preparado tu viaje para estas fechas
          </p>
          <h2
            id="season-card-title"
            className="absolute inset-x-0 top-[88px] whitespace-nowrap text-center font-display italic leading-none"
            style={{ fontSize: title.length > 18 ? Math.min(scene.titleSize, 48) : scene.titleSize, color: scene.title, textShadow: scene.titleShadow }}
          >
            {title}
          </h2>
        </div>
        <div className="relative z-[2] flex flex-col gap-5 px-7 pb-[26px] pt-1.5">
          <p className="m-0 text-center text-[15px] leading-[1.6] text-[rgba(28,34,48,.72)] [text-wrap:pretty]">{note.text}</p>
          <button type="button" onClick={dismissSeasonNote} className="h-14 rounded-full bg-[#1C2230] text-[16px] font-semibold text-[#FFFDF8] transition-transform active:scale-[.98]" autoFocus>
            Entendido
          </button>
        </div>
        <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 z-[3] h-full w-full" aria-hidden="true" />
      </div>
    </div>
  )
}
