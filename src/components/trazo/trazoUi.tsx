import type { CSSProperties, ReactNode } from 'react'
import type { Season } from '../../lib/types'

/** Paleta y tipografías del diseño "Trazo App Piscina" (tema Día: el agua clara). */
/** Relleno de acento: botones, barra de avance, puntos y fechas elegidas (azul marino del diseño). */
export const AMBER = '#0B2A5B'
/** Acento en letra: cursivas, etiquetas pequeñas y lo elegido (azul verdoso del diseño). */
export const ACCENT = 'oklch(0.5 0.13 225)'
export const INK = '#1C2230'
export const INK2 = 'rgba(28,34,48,.7)'
/** La letra sobre un relleno de acento: blanca. */
export const DARK = '#FFFFFF'
export const THEME = {
  page1: '#E4FBFA',
  page2: '#B9E9EE',
  bg: '#BDEEF3',
  bgrgb: '189 238 243',
  land: '#FFFDF5',
  landS: 'rgba(0,110,140,.25)',
  route: 'oklch(0.78 0.16 80 / .85)',
  dot: 'rgba(28,34,48,.28)',
  dot2: 'rgba(28,34,48,.6)',
  track: 'rgba(28,34,48,.14)',
  amb: 0.3,
}
export const SERIF = "'Instrument Serif', serif"
export const MONO = "'Geist Mono', monospace"

export const SEASON_FX: Record<Season, { name: string; gradient: string; swatch: string }> = {
  spring: {
    name: 'Primavera',
    gradient: 'linear-gradient(180deg,oklch(0.34 0.06 165) 0%,oklch(0.42 0.07 120) 45%,oklch(0.55 0.1 15) 100%)',
    swatch: 'linear-gradient(135deg,oklch(0.8 0.1 150),oklch(0.82 0.09 10))',
  },
  summer: {
    name: 'Verano',
    gradient: 'linear-gradient(180deg,oklch(0.4 0.1 50) 0%,oklch(0.55 0.15 50) 50%,oklch(0.64 0.16 38) 100%)',
    swatch: 'linear-gradient(135deg,oklch(0.88 0.14 90),oklch(0.7 0.17 40))',
  },
  autumn: {
    name: 'Otoño',
    gradient: 'linear-gradient(180deg,oklch(0.28 0.05 40) 0%,oklch(0.38 0.09 45) 50%,oklch(0.5 0.13 42) 100%)',
    swatch: 'linear-gradient(135deg,oklch(0.72 0.15 55),oklch(0.45 0.1 30))',
  },
  winter: {
    name: 'Invierno',
    gradient: 'linear-gradient(180deg,oklch(0.26 0.04 255) 0%,oklch(0.36 0.05 245) 50%,oklch(0.52 0.05 235) 100%)',
    swatch: 'linear-gradient(135deg,oklch(0.92 0.02 230),oklch(0.55 0.07 250))',
  },
}

export function Eyebrow({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span className="trazo-eyebrow" style={{ font: `500 11px/1 ${MONO}`, letterSpacing: '.14em', color: ACCENT, textTransform: 'uppercase' }}>{children}</span>
      {right}
    </div>
  )
}

export function Title({ children, size = 44 }: { children: ReactNode; size?: number }) {
  return <h1 className="trazo-title" style={{ color: INK, margin: '12px 0 0', font: `400 ${size}px/1.02 ${SERIF}`, letterSpacing: '-.01em', textWrap: 'balance' }}>{children}</h1>
}

export const Em = ({ children }: { children: ReactNode }) => <em style={{ color: ACCENT }}>{children}</em>

export const panelStyle: CSSProperties = {
  background: 'rgba(255,255,255,0.88)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(28,34,48,.1)',
  borderRadius: 24,
}

export function Cta({ children, onClick, enabled = true, light = false, style }: { children: ReactNode; onClick: () => void; enabled?: boolean; light?: boolean; style?: CSSProperties }) {
  return (
    <button
      type="button"
      className="trazo-press"
      onClick={enabled ? onClick : undefined}
      disabled={!enabled}
      style={{
        height: 58,
        flex: 'none',
        border: 'none',
        borderRadius: 999,
        background: light ? INK : AMBER,
        color: DARK,
        font: "600 16px 'Geist'",
        cursor: enabled ? 'pointer' : 'default',
        opacity: enabled ? 1 : 0.3,
        transition: 'opacity .35s,transform .2s',
        ...style,
      }}
    >
      {children}
    </button>
  )
}

export function GhostButton({ children, onClick, style }: { children: ReactNode; onClick: () => void; style?: CSSProperties }) {
  return (
    <button
      type="button"
      className="trazo-hover"
      onClick={onClick}
      style={{ height: 58, borderRadius: 999, border: '1px solid rgba(28,34,48,.2)', background: 'rgba(255,255,255,0.80)', color: INK, font: "500 15px 'Geist'", cursor: 'pointer', ...style }}
    >
      {children}
    </button>
  )
}

/** Una opción de radio del prototipo (preguntas de vehículo, compañía…). */
export function RadioRow({ label, description, active, onClick }: { label: string; description?: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: 'calc(100% + 20px)',
        margin: '0 -10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        padding: '11px 10px',
        minHeight: 44,
        border: 'none',
        borderRadius: 14,
        background: active ? 'rgba(255,190,30,.08)' : 'transparent',
        color: active ? ACCENT : INK,
        textAlign: 'left',
        cursor: 'pointer',
        transition: 'background .35s,color .35s',
      }}
    >
      <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ font: "500 15px 'Geist'" }}>{label}</span>
        {description && <span style={{ font: "400 12px/1.3 'Geist'", color: 'rgba(28,34,48,.62)' }}>{description}</span>}
      </span>
      <span
        style={{
          width: 18,
          height: 18,
          flex: 'none',
          borderRadius: '50%',
          border: `1.5px solid ${active ? AMBER : 'rgba(28,34,48,.4)'}`,
          background: active ? AMBER : 'transparent',
          boxShadow: 'inset 0 0 0 3px #FFFFFF',
          transition: 'background .3s,border-color .3s',
        }}
      />
    </button>
  )
}

/** Tarjeta de respuesta confirmada ("Para llegar: Avión ✓  Cambiar"). */
export function ConfirmedCard({ label, value, onChange }: { label: string; value: string; onChange?: () => void }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        marginTop: 10,
        padding: '12px 14px',
        minHeight: 48,
        borderRadius: 16,
        background: 'rgba(255,190,30,.1)',
        border: '1px solid rgba(255,190,30,.35)',
        animation: 'trazo-chipIn .45s cubic-bezier(.2,.8,.2,1) both',
      }}
    >
      <span style={{ flex: 1, minWidth: 0, font: "400 15px 'Geist'", color: INK }}>
        {label}: <strong style={{ fontWeight: 600 }}>{value}</strong> <span style={{ color: ACCENT }}>✓</span>
      </span>
      {onChange && (
        <button
          type="button"
          onClick={onChange}
          style={{ border: 'none', background: 'transparent', padding: '6px 0', font: `italic 400 17px ${SERIF}`, color: INK, textDecoration: 'underline', textUnderlineOffset: 3, cursor: 'pointer' }}
        >
          Cambiar
        </button>
      )}
    </div>
  )
}

/** Hoja inferior del prototipo (días flexibles, detalle de familia o grupo). */
export function Sheet({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 8, pointerEvents: open ? 'auto' : 'none' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(28,34,48,.35)', opacity: open ? 1 : 0, transition: 'opacity .45s' }} />
      <div
        style={{
          color: INK,
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          maxHeight: '92%',
          overflowY: 'auto',
          background: '#FFFFFF',
          backdropFilter: 'blur(22px)',
          WebkitBackdropFilter: 'blur(22px)',
          borderRadius: '30px 30px 0 0',
          borderTop: '1px solid rgba(28,34,48,.12)',
          padding: '12px 20px 24px',
          transform: open ? 'none' : 'translateY(105%)',
          transition: 'transform .6s cubic-bezier(.2,.8,.2,1)',
        }}
        className="trazo-noscroll"
      >
        <div style={{ width: 40, height: 4, borderRadius: 4, background: 'rgba(28,34,48,.2)', margin: '0 auto 18px' }} />
        {children}
      </div>
    </div>
  )
}

/** Partículas de estación del prototipo: nieve, pétalos, hojas o chispas de verano. */
export function SeasonFx({ season, visible, parts }: { season: Season; visible: number; parts: number[][] }) {
  let kids: ReactNode[] = []
  if (season === 'winter')
    kids = parts.map((r, i) => (
      <div key={i} style={{ position: 'absolute', left: `${r[0] * 100}%`, top: 0, animation: `trazo-fall ${11 + r[1] * 9}s linear ${-r[2] * 20}s infinite` }}>
        <div style={{ width: 2 + r[3] * 4, height: 2 + r[3] * 4, borderRadius: '50%', background: '#fff', opacity: 0.45 + r[3] * 0.45, animation: `trazo-sway ${3 + r[1] * 3}s ease-in-out infinite` }} />
      </div>
    ))
  if (season === 'spring')
    kids = parts.slice(0, 16).map((r, i) => (
      <div key={i} style={{ position: 'absolute', left: `${r[0] * 100}%`, top: 0, animation: `trazo-fall ${13 + r[1] * 8}s linear ${-r[2] * 20}s infinite` }}>
        <div style={{ width: 7 + r[3] * 4, height: 10 + r[3] * 4, borderRadius: '60% 40% 60% 40%', background: i % 3 ? 'oklch(0.88 0.06 10)' : 'oklch(0.93 0.04 90)', opacity: 0.75, animation: `trazo-sway ${4 + r[1] * 3}s ease-in-out infinite` }} />
      </div>
    ))
  if (season === 'autumn')
    kids = parts.slice(0, 18).map((r, i) => (
      <div key={i} style={{ position: 'absolute', left: `${r[0] * 100}%`, top: 0, animation: `trazo-fall ${9 + r[1] * 7}s linear ${-r[2] * 16}s infinite` }}>
        <div
          style={{
            width: 12 + r[3] * 6,
            height: 8 + r[3] * 4,
            borderRadius: '0 100% 0 100%',
            background: ['oklch(0.7 0.15 50)', 'oklch(0.6 0.14 35)', 'oklch(0.78 0.13 80)'][i % 3],
            opacity: 0.85,
            animation: `trazo-sway ${2.5 + r[1] * 2.5}s ease-in-out infinite`,
          }}
        />
      </div>
    ))
  if (season === 'summer') {
    kids = parts.slice(0, 18).map((r, i) => (
      <div
        key={i}
        style={{ position: 'absolute', left: `${r[0] * 100}%`, top: 0, width: 2 + r[3] * 3, height: 2 + r[3] * 3, borderRadius: '50%', background: 'oklch(0.95 0.08 90)', animation: `trazo-rise ${8 + r[1] * 8}s linear ${-r[2] * 14}s infinite` }}
      />
    ))
    kids.push(
      <div
        key="sun"
        style={{ position: 'absolute', right: -90, top: 70, width: 340, height: 340, borderRadius: '50%', background: 'radial-gradient(circle,oklch(0.92 0.12 85 / .6),transparent 65%)', animation: 'trazo-breathe 7s ease-in-out infinite' }}
      />,
    )
  }
  return <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', opacity: visible, transition: 'opacity 1.2s', pointerEvents: 'none' }}>{kids}</div>
}

/** Las siluetas de la tarjeta de compañía. */
export function Figures({ heights, gap, active, together }: { heights: number[]; gap: number; active: boolean; together: boolean }) {
  const cols = [INK, AMBER, 'oklch(0.78 0.08 230)', 'oklch(0.76 0.12 25)']
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: active && together ? 0 : gap + 4, opacity: active ? 1 : 0.55, transition: 'opacity .4s, gap .6s' }}>
      {heights.map((h, i) => (
        <div
          key={i}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: h * 0.06, animation: active ? `trazo-bob ${1.1 + i * 0.17}s ease-in-out ${i * 0.13}s infinite` : 'none' }}
        >
          <div style={{ width: h * 0.34, height: h * 0.34, borderRadius: '50%', background: cols[i % 4] }} />
          <div style={{ width: h * 0.5, height: h * 0.58, borderRadius: `${h * 0.25}px ${h * 0.25}px ${h * 0.07}px ${h * 0.07}px`, background: cols[i % 4], opacity: 0.9 }} />
        </div>
      ))}
    </div>
  )
}

/** Stepper numérico (adultos, niños, tamaño de grupo). */
export function Stepper({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (value: number) => void }) {
  const btn: CSSProperties = { width: 40, height: 40, borderRadius: '50%', border: '1px solid rgba(28,34,48,.16)', background: 'transparent', color: INK, font: "500 18px 'Geist'", cursor: 'pointer' }
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0' }}>
      <span style={{ font: "400 15px 'Geist'", color: INK }}>{label}</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <button type="button" style={{ ...btn, opacity: value <= min ? 0.3 : 1 }} onClick={() => value > min && onChange(value - 1)} aria-label={`Menos ${label}`}>
          −
        </button>
        <span style={{ font: `400 28px ${SERIF}`, minWidth: 28, textAlign: 'center', color: ACCENT }}>{value}</span>
        <button type="button" style={{ ...btn, opacity: value >= max ? 0.3 : 1 }} onClick={() => value < max && onChange(value + 1)} aria-label={`Más ${label}`}>
          +
        </button>
      </span>
    </div>
  )
}
