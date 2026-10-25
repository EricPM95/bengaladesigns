import { useEffect, useRef } from 'react'
import type { Route } from '../../lib/types'
import { cardSeasonOfNote, type CardSeason } from '../../lib/seasonCard'
import { useRouteStore } from '../../store/useRouteStore'

/**
 * Las tarjetas especiales (PROMPT_TARJETA_TEMPORADA, INVARIANTES 415; Tanda 10M): Navidad, Semana Santa y el cumpleaños de la ciudad. Una sola
 * por viaje y con un solo texto (el del motor, `route.seasonNote`). Al abrir la ruta por primera vez salen antes que los avisos de fechas
 * (DateNoticesModal.tsx). Copian el diseño de docs/diseno/tarjeta_temporada/Navidad Modal.dc.html: 390 px, la escena arriba (el cielo, la
 * silueta del destino y su detalle; lo que cae o sube se desvanece antes del texto), «Hemos preparado tu viaje para estas fechas», el título,
 * el texto y «Entendido».
 *   · Navidad: la noche azul, la silueta de Roma con ventanas y la guirnalda de luces.
 *   · Semana Santa: el amanecer (cielo de malva a rosa y oro), la cúpula y la columnata de San Pedro con el sol saliendo detrás.
 *   · El cumpleaños de Roma: la luz dorada de la tarde, el Coliseo con sus arcos encendidos y una guirnalda de banderines.
 * Con «reducir movimiento», no se mueve nada. Se cierra con «Entendido» y no vuelve a salir en ese viaje.
 */

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
  fx: { n: number; type?: 'mote'; col?: string; cols?: string[]; speed?: number; drift?: number }
}

const SCENES: Record<CardSeason, Scene> = {
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
  semana_santa: {
    sky: 'linear-gradient(180deg,#4B3F7A 0%,#B9729B 32%,#F0A08E 58%,#FACB9C 80%,#FFFDF8 100%)',
    glow: 'radial-gradient(circle,oklch(0.93 0.1 85 / .85) 0 18%,oklch(0.85 0.13 60 / .45) 34%,transparent 66%)',
    glowTop: 78,
    glowSize: 300,
    skyline: '#3C2A4C',
    eyebrow: 'rgba(255,240,222,.9)',
    title: '#FFF6E6',
    titleShadow: '0 2px 20px rgba(80,30,70,.4)',
    titleSize: 56,
    fx: { n: 34, type: 'mote', cols: ['#FFE9C2', '#FFD08A', '#FFC0B5', '#FFFFFF'] },
  },
  cumpleanos: {
    sky: 'linear-gradient(180deg,#6E3552 0%,#D2694D 30%,#F2A24F 56%,#FBD58A 80%,#FFFDF8 100%)',
    glow: 'radial-gradient(circle,oklch(0.95 0.1 90 / .8) 0 16%,oklch(0.86 0.14 70 / .45) 34%,transparent 66%)',
    glowTop: 72,
    glowSize: 300,
    skyline: '#4E2330',
    eyebrow: 'rgba(255,240,214,.92)',
    title: '#FFF6E6',
    titleShadow: '0 2px 20px rgba(90,30,30,.4)',
    titleSize: 56,
    fx: { n: 40, type: 'mote', cols: ['#FFF0B8', '#FFD36B', '#FFB25E', '#FFFFFF'] },
  },
}

const SKYLINE =
  'M0 120V92h26v-8h14v8h20V70h8v-6h6v6h8v22h30V78h40V60l6-4v-8h4v8l6 4v18h24c0-34 16-52 34-58v-8h3v-6h2v6h3v8c18 6 34 24 34 58h30V84h16v-6h10v6h18V96H400V120z'
const NAME: Record<CardSeason, string> = { navidad: 'Navidad', semana_santa: 'Semana Santa', cumpleanos: 'El cumpleaños' }
/** Las ventanas encendidas y la guirnalda de la Navidad. */
const WINDOWS = Array.from({ length: 14 }, (_, i) => ({ mb: [4, 18, 8, 28, 12, 2, 34, 22, 6, 16, 26, 10, 3, 14][i], d: 2 + ((i * 7) % 5) * 0.6 }))
const BULBS = Array.from({ length: 12 }, (_, i) => {
  const x = i / 11
  const y = 4 + Math.sin(x * Math.PI * 1.9 + 0.3) * 10 + 10 * (1 - Math.abs(x - 0.5) * 2) * 0.6
  return { x: x * 96 + 2, y, d: 1.4 + ((i * 5) % 4) * 0.5 }
})
/** Las últimas estrellas del amanecer (Semana Santa). */
const STARS = [
  [6, 12, 2.4],
  [14, 36, 3.1],
  [26, 20, 2.0],
  [40, 8, 3.4],
  [63, 14, 2.6],
  [78, 30, 2.2],
  [88, 10, 3.0],
  [95, 26, 2.5],
].map(([x, y, d]) => ({ x, y, d }))
/** Los banderines del cumpleaños: una guirnalda que cuelga arriba, de lado a lado. */
const FLAG_COLORS = ['#FFD36B', '#E0623F', '#FFF2D6', '#F29BB0', '#7FB7A4']
const FLAGS = Array.from({ length: 14 }, (_, i) => {
  const t = (i + 0.5) / 14
  const x = (1 - t) ** 2 * -10 + 2 * (1 - t) * t * 195 + t ** 2 * 400
  const y = (1 - t) ** 2 * 6 + 2 * (1 - t) * t * 52 + t ** 2 * 6
  return { x, y, c: FLAG_COLORS[i % FLAG_COLORS.length] }
})
/** El Coliseo: el muro (su perfil roto a la derecha) y las filas de arcos, que se encienden. */
const COLISEO_WALL = 'M40 104V54H250L262 64L280 76L300 88L312 98V104Z'
const COLISEO_TOPE: [number, number][] = [
  [250, 54],
  [262, 64],
  [280, 76],
  [300, 88],
  [312, 98],
]
const topeEn = (x: number) => {
  if (x <= 250) return 54
  for (let i = 1; i < COLISEO_TOPE.length; i++) if (x <= COLISEO_TOPE[i][0]) return COLISEO_TOPE[i][1]
  return 98
}
const ARCOS = (() => {
  const salida: { x: number; y: number; h: number; d: number }[] = []
  const filas = [
    { y: 60, h: 10 },
    { y: 75, h: 10 },
    { y: 90, h: 10 },
  ]
  filas.forEach((fila, r) => {
    for (let k = 0; k < 15; k++) {
      const x = 48 + k * 14
      if (x + 8 > 308) continue
      if (fila.y < topeEn(x + 8) + 3) continue
      salida.push({ x, y: fila.y, h: fila.h, d: 1.6 + ((k * 3 + r * 5) % 7) * 0.45 })
    }
  })
  return salida
})()
/** Lo que cae se desvanece antes de llegar al texto (la escena mide 300 px). */
const FADE_Y = 330

function SvgBase({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 390 120" preserveAspectRatio="none" className="absolute bottom-[34px] left-[-2px] h-[120px] w-[calc(100%+4px)]" aria-hidden="true">
      {children}
    </svg>
  )
}

/** San Pedro: la cúpula con su linterna y su cruz, la fachada y las dos columnatas, con unas casas bajas. */
function SkylineSanPedro({ fill }: { fill: string }) {
  const columnas = Array.from({ length: 10 }, (_, i) => i)
  return (
    <SvgBase>
      <g fill={fill}>
        <rect x="0" y="104" width="390" height="16" />
        <rect x="6" y="94" width="26" height="12" />
        <rect x="36" y="89" width="16" height="17" />
        <rect x="334" y="96" width="16" height="10" />
        <rect x="354" y="91" width="22" height="15" />
        <rect x="56" y="82" width="78" height="4" />
        <rect x="256" y="82" width="78" height="4" />
        {columnas.map((i) => (
          <rect key={`l${i}`} x={58 + i * 8} y="86" width="3" height="20" />
        ))}
        {columnas.map((i) => (
          <rect key={`r${i}`} x={258 + i * 8} y="86" width="3" height="20" />
        ))}
        <rect x="136" y="84" width="118" height="22" />
        <rect x="150" y="76" width="90" height="8" />
        <rect x="165" y="62" width="60" height="14" />
        <path d="M163 64C163 36 227 36 227 64Z" />
        <rect x="192" y="32" width="6" height="12" />
        <path d="M190 33h10l-5-7z" />
        <rect x="194" y="12" width="2" height="14" />
        <rect x="191" y="16" width="8" height="2" />
      </g>
      {[172, 184, 196, 208].map((x, i) => (
        <rect key={x} x={x} y="66" width="3" height="6" rx="1" fill="oklch(0.88 0.12 80)" className="season-card-glow" style={{ filter: 'drop-shadow(0 0 3px oklch(0.88 0.12 80))', animationDuration: `${2 + i * 0.5}s` }} />
      ))}
    </SvgBase>
  )
}

/** El Coliseo: el muro roto a la derecha, tres filas de arcos encendidos y unas columnas sueltas delante. */
function SkylineColiseo({ fill }: { fill: string }) {
  return (
    <SvgBase>
      <g fill={fill}>
        <rect x="0" y="104" width="390" height="16" />
        <path d={COLISEO_WALL} />
        <rect x="8" y="88" width="3.5" height="16" />
        <rect x="18" y="80" width="3.5" height="24" />
        <rect x="16" y="78" width="8" height="3" />
        <rect x="334" y="82" width="4" height="22" />
        <rect x="331" y="80" width="10" height="3" />
        <rect x="350" y="90" width="3.5" height="14" />
        <rect x="364" y="94" width="14" height="10" />
      </g>
      {ARCOS.map((arco, i) => (
        <path
          key={i}
          d={`M${arco.x} ${arco.y + arco.h}V${arco.y + 4}a4 4 0 0 1 8 0V${arco.y + arco.h}Z`}
          fill="oklch(0.88 0.13 78)"
          className="season-card-glow"
          style={{ animationDuration: `${arco.d}s` }}
        />
      ))}
    </SvgBase>
  )
}

/** La guirnalda de banderines del cumpleaños. */
function Banderines() {
  return (
    <svg viewBox="0 0 390 70" preserveAspectRatio="none" className="absolute inset-x-0 top-[6px] h-[70px] w-full overflow-visible" aria-hidden="true">
      <path d="M-10 6 Q 195 52 400 6" fill="none" stroke="rgba(255,240,210,.55)" strokeWidth="1" />
      {FLAGS.map((flag, i) => (
        <path key={i} d={`M${flag.x - 7} ${flag.y}L${flag.x + 7} ${flag.y}L${flag.x} ${flag.y + 15}Z`} fill={flag.c} opacity=".92" className="season-card-glow" style={{ animationDuration: `${3 + (i % 4) * 0.7}s` }} />
      ))}
    </svg>
  )
}

/** Lo que sube o cae (motas de luz o nieve), en un canvas encima de la tarjeta. Nada con «reducir movimiento». */
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
        if (fx.type === 'mote') {
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
  // (Tanda 10M: tres tarjetas —Navidad, Semana Santa y el cumpleaños—; una `season` de las de antes no saca ninguna.)
  const season = cardSeasonOfNote(note)
  const open = season !== null && !route.seasonNoteDismissed
  const scene = SCENES[season ?? 'navidad']
  const city = route.destination.split(',')[0].trim()
  const title = note?.title ?? (season === 'cumpleanos' ? `El cumpleaños de ${city}` : `${NAME[season ?? 'navidad']} en ${city}`)
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

  if (!open || !note || !season) return null
  return (
    <div className="fixed inset-0 z-[85] flex items-center justify-center px-4" role="dialog" aria-modal="true" aria-labelledby="season-card-title" data-tarjeta-especial={season}>
      <div className="trazo-notice-backdrop absolute inset-0 bg-text/25 backdrop-blur-[6px]" onClick={dismissSeasonNote} />
      <div className="trazo-notice-panel relative w-full max-w-[390px] overflow-hidden rounded-[30px] bg-[#FFFDF8] shadow-[0_30px_70px_-30px_rgba(40,25,5,.45)]">
        <div className="relative h-[300px]" style={{ background: scene.sky }}>
          <div
            className="absolute left-1/2 rounded-full"
            style={{ top: scene.glowTop, width: scene.glowSize, height: scene.glowSize, marginLeft: -scene.glowSize / 2, background: scene.glow }}
          />
          {season === 'semana_santa' && (
            <div className="absolute inset-x-0 top-0 h-14" aria-hidden="true">
              {STARS.map((star, i) => (
                <span key={i} className="season-card-glow absolute rounded-full bg-white" style={{ left: `${star.x}%`, top: star.y, width: 2, height: 2, boxShadow: '0 0 4px 1px rgba(255,255,255,.7)', animationDuration: `${star.d}s` }} />
              ))}
            </div>
          )}
          {season === 'navidad' && (
            <svg viewBox="0 0 390 120" preserveAspectRatio="none" className="absolute bottom-[34px] left-[-2px] h-[120px] w-[calc(100%+4px)]" aria-hidden="true">
              <path d={SKYLINE} fill={scene.skyline} />
            </svg>
          )}
          {season === 'semana_santa' && <SkylineSanPedro fill={scene.skyline} />}
          {season === 'cumpleanos' && <SkylineColiseo fill={scene.skyline} />}
          <div className="absolute inset-x-0 bottom-0 h-10" style={{ background: `linear-gradient(180deg,${scene.skyline} 0%,#FFFDF8 100%)` }} />
          {season === 'cumpleanos' && <Banderines />}
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
          <p className="absolute inset-x-0 top-16 whitespace-nowrap text-center font-mono text-[11px] font-medium uppercase tracking-[.2em] max-[420px]:text-[10px] max-[420px]:tracking-[.1em]" style={{ color: scene.eyebrow }}>
            Hemos preparado tu viaje para estas fechas
          </p>
          <h2
            id="season-card-title"
            className="absolute inset-x-0 top-[88px] whitespace-nowrap text-center font-display italic leading-none"
            style={{ fontSize: title.length > 18 ? Math.min(48, Math.floor(340 / (title.length * 0.4))) : scene.titleSize, color: scene.title, textShadow: scene.titleShadow }}
          >
            {title}
          </h2>
        </div>
        <div className="relative z-[2] flex flex-col gap-5 px-7 pb-[26px] pt-1.5">
          <p data-tarjeta-texto className="m-0 text-center text-[15px] leading-[1.6] text-[rgba(28,34,48,.72)] [text-wrap:pretty]">{note.text}</p>
          <button type="button" onClick={dismissSeasonNote} className="h-14 rounded-full btn-champan text-[16px] font-semibold transition-transform active:scale-[.98]" autoFocus>
            Entendido
          </button>
        </div>
        <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 z-[3] h-full w-full" aria-hidden="true" />
      </div>
    </div>
  )
}
