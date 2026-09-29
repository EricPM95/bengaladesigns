import type { ReactNode } from 'react'
import { KIND_ICON, KIND_STYLE, PERIOD_STYLE, type DayPeriod, type StopKind } from '../../../lib/stopKind'

/**
 * Piezas del día abierto en DIAS con el diseño "Trazo Itinerario": UNA sola tarjeta para todo lo que
 * pasa en el día (paradas, comidas, llegada), alargada, con la franja izquierda del color de su tipo;
 * la cabecera de cada franja del día; y la fila discreta de lo que no lleva tarjeta ni número ("de
 * paso", tiempo libre). Solo aspecto: el contenido lo decide quien las usa.
 */

function Icon({ d, size = 13, className = '' }: { d: string; size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 ${className}`}>
      <path d={d} />
    </svg>
  )
}

export type CardVariant = 'normal' | 'sunset' | 'night'

export interface CardMeta {
  icon?: keyof typeof KIND_ICON
  text: string
  /** Aviso (cerrado, temporada…): en rojo, en la misma línea. */
  warn?: boolean
}

interface TrazoCardProps {
  kind: StopKind
  variant?: CardVariant
  /** El número del mapa; sin número (comida, llegada) no hay círculo. */
  number?: number | null
  /** "09:00", "13:00 – 14:30"… */
  time?: string | null
  name: string
  /** Línea opcional bajo el nombre (por qué está, el paseo nocturno…). */
  sub?: string | null
  /** Línea de horario, duración y notas (reserva, atardecer…). */
  meta?: CardMeta[]
  /** Píldoras de tipo de lugar (del JSON curado). */
  tags?: { label: string; kind: StopKind }[]
  photoUrl?: string | null
  /** Sin foto de verdad (comida, llegada): la franja de color se alarga y el hueco va en degradado. */
  noPhoto?: boolean
  /** Icono propio en vez del del tipo (Free Tour, pausa…). */
  iconPath?: string
  dashed?: boolean
  onOpen?: () => void
  /** Menú "···", arriba a la derecha dentro de la tarjeta. */
  menu?: ReactNode
  /** Contenido extra al final (sugerencias de la pausa…). */
  children?: ReactNode
  /** Un control propio abajo a la derecha, fuera del botón de abrir ("Quiero entrar"). */
  action?: ReactNode
  /** El número en el color del día (PROMPT_UI, Parte 2): relleno claro, número fuerte y borde blanco. */
  numberColors?: { bg: string; text: string }
}

const SUNSET_PANEL = 'linear-gradient(170deg, oklch(0.78 0.15 70), oklch(0.62 0.19 22))'
const NIGHT_PANEL = 'linear-gradient(160deg, oklch(0.45 0.13 285), oklch(0.3 0.09 270))'
const SUNSET_CARD = 'linear-gradient(115deg, #FFF4E6, #FBDCCB)'
const NIGHT_CARD = 'linear-gradient(135deg, oklch(0.27 0.06 275), oklch(0.21 0.04 265))'

export function TrazoCard({ kind, variant = 'normal', number, time, name, sub, meta = [], tags = [], photoUrl, noPhoto, iconPath, dashed, onOpen, menu, children, action, numberColors }: TrazoCardProps) {
  const style = KIND_STYLE[kind]
  const night = variant === 'night'
  const sunset = variant === 'sunset'
  const panel = sunset ? SUNSET_PANEL : night ? NIGHT_PANEL : style.color
  const photoBg = sunset
    ? 'linear-gradient(180deg, oklch(0.8 0.12 60), oklch(0.66 0.17 25))'
    : night
      ? 'linear-gradient(180deg, oklch(0.3 0.08 275), oklch(0.45 0.1 60))'
      : `linear-gradient(135deg, ${style.color.replace(')', ' / .45)')}, ${style.color.replace(')', ' / .15)')})`
  const ink = night ? '#F3EEE4' : undefined
  const ink2 = night ? 'rgba(243,238,228,.72)' : undefined
  const timeColor = night ? 'oklch(0.82 0.1 285)' : sunset ? 'oklch(0.5 0.17 35)' : style.ink
  const badge = sunset ? 'oklch(0.64 0.18 30)' : night ? 'oklch(0.42 0.13 285)' : style.color

  const body = (
    <>
      {/* Franja de color con el icono + la foto en paralelogramo (diseño "Trazo Itinerario"). */}
      <div className="relative w-[104px] shrink-0 overflow-hidden rounded-l-[17px] max-[479px]:w-[84px]" style={{ marginRight: -14 }}>
        <div className="absolute inset-0" style={{ clipPath: 'polygon(0 0, 58px 0, 32px 100%, 0 100%)', background: panel }} />
        <span className="absolute bottom-0 left-0 top-0 flex w-9 items-center justify-center text-white">
          <Icon d={iconPath ?? style.icon} size={20} />
        </span>
        <div className="absolute bottom-0 left-[30px] right-0 top-0" style={{ clipPath: 'polygon(26px 0, 100% 0, calc(100% - 20px) 100%, 0 100%)', background: photoBg }}>
          {photoUrl && !noPhoto && <img src={photoUrl} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />}
        </div>
      </div>
      <div className={`flex min-w-0 flex-1 flex-col justify-center gap-[3px] pl-[18px] pr-9 pt-[11px] text-left max-[479px]:gap-[2px] max-[479px]:pt-2 ${action ? 'pb-10' : 'pb-[11px] max-[479px]:pb-2'}`}>
        {time && (
          <span className="font-mono text-[10.5px] font-semibold tracking-[.04em] max-[479px]:text-[11px]" style={{ color: timeColor }}>
            {time}
          </span>
        )}
        {/* El nombre en una línea si cabe; si no, la tarjeta crece (nunca se corta). */}
        <span className="line-clamp-2 font-display text-[17px] leading-[1.12] [overflow-wrap:anywhere]">{name}</span>
        {sub && (
          <span title={sub} className={`line-clamp-2 text-[11px] leading-[1.3] max-[479px]:text-[12px] ${night ? '' : 'text-text/60'}`} style={{ color: ink2 }}>
            {sub}
          </span>
        )}
        {meta.length > 0 && (
          <span className="flex flex-wrap items-center gap-x-[9px] gap-y-0.5">
            {meta.map((item, index) => (
              <span
                key={`${item.text}-${index}`}
                className={`flex items-center gap-1 text-[11px] leading-[1.3] ${item.warn ? 'text-accent-red' : night ? '' : 'text-text/60'}`}
                style={item.warn ? undefined : { color: ink2 }}
              >
                {item.icon && <Icon d={KIND_ICON[item.icon]} />}
                {item.text}
              </span>
            ))}
          </span>
        )}
        {tags.length > 0 && (
          <span className="mt-0.5 flex flex-wrap gap-1">
            {tags.map((tag) => (
              <span
                key={tag.label}
                className="inline-flex h-[19px] items-center rounded-full px-2 text-[10.5px] font-medium"
                style={night ? { background: 'rgba(200,190,255,.16)', color: 'oklch(0.88 0.07 285)' } : { background: KIND_STYLE[tag.kind].soft, color: KIND_STYLE[tag.kind].ink }}
              >
                {tag.label}
              </span>
            ))}
          </span>
        )}
        {children}
      </div>
    </>
  )

  return (
    <div
      className={`relative flex min-h-[116px] w-full rounded-[18px] border ${dashed ? 'border-dashed' : ''} ${night ? 'border-white/[.06]' : 'border-text/[.08]'} ${!night && !sunset ? 'bg-white dark:bg-bg-hover' : ''}`}
      style={{
        background: night ? NIGHT_CARD : sunset ? SUNSET_CARD : undefined,
        color: ink,
        boxShadow: night ? '0 14px 30px -16px rgba(30,20,80,.6)' : '0 1px 2px rgba(28,34,48,.05), 0 10px 24px -18px rgba(28,34,48,.35)',
      }}
    >
      {onOpen ? (
        <button type="button" onClick={onOpen} className="flex w-full min-w-0 text-left">
          {body}
        </button>
      ) : (
        <div className="flex w-full min-w-0">{body}</div>
      )}
      {number != null && (
        <span
          className="absolute -left-[9px] -top-[9px] z-[2] flex h-6 w-6 items-center justify-center rounded-full border-[2.5px] border-white text-[11px] font-semibold text-white"
          style={numberColors ? { background: numberColors.bg, color: numberColors.text } : { background: badge }}
        >
          {number}
        </span>
      )}
      {menu && <div className="absolute right-2 top-2 z-20">{menu}</div>}
      {action && <div className="absolute bottom-2.5 right-3 z-20">{action}</div>}
    </div>
  )
}

/** Cabecera de una franja del día: "MAÑANA · 08:00 — 12:30". */
export function PeriodHeader({ period, range }: { period: DayPeriod; range?: string | null }) {
  const style = PERIOD_STYLE[period]
  return (
    <div className="flex items-center gap-2 pl-0.5 pt-1">
      <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full" style={{ background: style.soft, color: style.color }}>
        <Icon d={style.icon} />
      </span>
      <span className="font-mono text-[11px] font-semibold uppercase tracking-[.12em] text-text/60">
        {style.label}
        {range ? ` · ${range}` : ''}
      </span>
    </div>
  )
}

/** Lo que no lleva tarjeta ni número: "de paso" y el tiempo libre. Una fila discreta con la hora. */
export function TimelineNote({ time, children, onClick, photoUrl }: { time?: string | null; children: ReactNode; onClick?: () => void; photoUrl?: string | null }) {
  const content = (
    <>
      <span className="absolute -left-[19px] top-[13px] h-[9px] w-[9px] rounded-full border-[1.5px] border-text/30 bg-bg-card" aria-hidden="true" />
      {time && <span className="shrink-0 font-mono text-[11px] font-semibold text-text/50">{time}</span>}
      <span className="min-w-0 flex-1 text-[12.5px] leading-[1.4] text-text/65">{children}</span>
      {photoUrl && <img src={photoUrl} alt="" loading="lazy" className="h-9 w-9 shrink-0 rounded-lg object-cover" />}
    </>
  )
  return onClick ? (
    <button type="button" onClick={onClick} className="relative flex w-full items-start gap-2 py-2 text-left">
      {content}
    </button>
  ) : (
    <div className="relative flex w-full items-start gap-2 py-2">{content}</div>
  )
}

/**
 * La comida, la cena y el desayuno (PROMPT_UI, Parte 2: "Comidas A · Mesa"): una tarjeta terracota suave, sin foto ni
 * número. Arriba, "COMIDA · 13:15 – 14:15" en mono; el restaurante en grande (Instrument Serif); debajo, a cuántos
 * minutos está; a la derecha, "Cambiar". El desayuno, en pequeño: más baja, el nombre en letra normal y "Cambiar" como
 * enlace.
 */
export function MealCard({ label, timeRange, name, sub, iconPath, onOpen, onChange, small = false, menu }: {
  label: string
  timeRange?: string | null
  name: string
  sub?: string | null
  iconPath: string
  onOpen?: () => void
  onChange?: () => void
  small?: boolean
  menu?: ReactNode
}) {
  const change = onChange ? (
    small ? (
      <button type="button" onClick={(event) => (event.stopPropagation(), onChange())} className="shrink-0 text-[12.5px] font-semibold text-accent underline underline-offset-2 hover:text-accent-hover">
        Cambiar
      </button>
    ) : (
      <button type="button" onClick={(event) => (event.stopPropagation(), onChange())} className="shrink-0 rounded-full border-[1.5px] border-accent px-3.5 py-1.5 text-[12.5px] font-semibold text-accent transition-colors hover:bg-accent-soft max-[479px]:px-2.5 max-[479px]:py-1 max-[479px]:text-[11.5px]">
        Cambiar
      </button>
    )
  ) : null
  const content = (
    <>
      <span className={`flex shrink-0 items-center justify-center rounded-full bg-accent text-white ${small ? 'h-8 w-8' : 'h-10 w-10 max-[479px]:h-8 max-[479px]:w-8'}`}>
        <Icon d={iconPath} size={small ? 15 : 18} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5 text-left">
        <span className="whitespace-nowrap font-mono text-[10.5px] font-semibold uppercase tracking-[.08em] text-accent max-[479px]:text-[10px] max-[479px]:tracking-[.04em]">
          {label}
          {timeRange ? ` · ${timeRange}` : ''}
        </span>
        <span className={small ? 'text-[14px] font-medium leading-[1.25] text-text [overflow-wrap:anywhere]' : 'line-clamp-2 font-display text-[22px] leading-[1.1] text-text [overflow-wrap:anywhere] max-[479px]:text-[18px]'}>{name}</span>
        {sub && <span className="line-clamp-2 text-[12px] leading-[1.3] text-text/60">{sub}</span>}
      </span>
    </>
  )
  return (
    <div className={`relative flex w-full items-center gap-3 rounded-[18px] border border-[#F1D6C9] bg-[#FCEFE8] max-[479px]:gap-2.5 ${small ? 'px-3 py-2.5' : 'px-3.5 py-3.5 max-[479px]:px-3 max-[479px]:py-2.5'}`}>
      {onOpen ? (
        <button type="button" onClick={onOpen} className="flex min-w-0 flex-1 items-center gap-3">
          {content}
        </button>
      ) : (
        <div className="flex min-w-0 flex-1 items-center gap-3">{content}</div>
      )}
      {change}
      {menu && <div className="shrink-0">{menu}</div>}
    </div>
  )
}

/**
 * "De camino" (PROMPT_UI, Parte 2: "De camino B · Mini-tarjeta"): lo que se pilla andando de una parada a otra sin
 * desviarse (una calle, una fuente pequeña, una plaza). Sin número ni hora, no suma tiempo: una tarjeta baja con borde
 * discontinuo, un poco metida a la derecha, con su foto redonda, "DE CAMINO · SIN DESVÍO", el nombre y "Ver ›".
 */
export function OnTheWayCard({ name, photoUrl, onOpen, menu }: { name: string; photoUrl?: string | null; onOpen?: () => void; menu?: ReactNode }) {
  return (
    <div className="relative ml-4 flex min-h-[60px] items-center gap-3 rounded-[16px] border-[1.5px] border-dashed border-text/[.18] bg-[#FFFEFB] py-1 pl-2 pr-2 max-[479px]:min-h-[52px] max-[479px]:gap-2.5">
      <button type="button" onClick={onOpen} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        <span className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-bg-hover max-[479px]:h-9 max-[479px]:w-9">
          {photoUrl && <img src={photoUrl} alt="" loading="lazy" className="h-full w-full object-cover" />}
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="whitespace-nowrap font-mono text-[9.5px] font-semibold uppercase tracking-[.12em] text-text/50 max-[479px]:tracking-[.06em]">De camino · sin desvío</span>
          <span className="line-clamp-2 font-display text-[17px] leading-[1.15] text-text max-[479px]:text-[16px]">{name}</span>
        </span>
        <span className="shrink-0 pr-1 text-[12.5px] font-semibold text-accent">Ver ›</span>
      </button>
      {menu && <div className="shrink-0">{menu}</div>}
    </div>
  )
}
