import { useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import type { ArrivalMode } from '../../../lib/arrivalReturn'
import { EXPLORE_ICONS } from '../../../lib/exploreStyle'

/**
 * Los billetes de Reservas y la tarjeta «Tu primer y último día» (diseño «Trazo Reservas», pantalla 13, 3-oct-2026).
 * Solo cambia cómo se ven: las horas, los puntos de llegada y salida y los tiempos son los de siempre (arrivalReturn.ts / _llegada.json).
 */

const ACCENT = 'oklch(0.62 0.15 45)'
const DAY_START = 8 * 60
const DAY_END = 24 * 60

export const hhmmToMinutes = (value: string | null | undefined): number | null => {
  if (!value) return null
  const [hours, minutes] = value.split(':').map(Number)
  return Number.isFinite(hours) && Number.isFinite(minutes) ? hours * 60 + minutes : null
}
const fmt = (minutes: number) => {
  const m = Math.max(0, Math.min(24 * 60 - 1, minutes))
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}
const pc = (minutes: number) => `${((Math.max(DAY_START, Math.min(DAY_END, minutes)) - DAY_START) / (DAY_END - DAY_START)) * 100}%`

/** «Jue · 20 oct» de una fecha ISO. */
export function ticketDate(iso: string | undefined | null): string {
  if (!iso) return ''
  const date = new Date(`${iso}T12:00:00`)
  if (Number.isNaN(date.getTime())) return ''
  const weekday = date.toLocaleDateString('es-ES', { weekday: 'short' }).replace('.', '')
  const rest = date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }).replace('.', '')
  return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)} · ${rest}`
}

const MODE_WORD: Record<ArrivalMode, string> = { avion: 'vuelo', tren: 'tren', bus: 'autobús', ferry: 'ferry', crucero: 'crucero', coche: 'coche' }
export const modeWord = (mode: ArrivalMode) => MODE_WORD[mode]

/** Un punto de la curva del billete (Bézier cuadrática del diseño) en t = 0..1. */
function arcPoint(t: number): [number, number] {
  const u = 1 - t
  return [u * u * 4 + 2 * u * t * 50 + t * t * 96, u * u * 32 + 2 * u * t * -6 + t * t * 32]
}

export function FlightTicket({
  kind,
  mode,
  label,
  date,
  fromBig,
  fromSmall,
  toBig,
  toSmall,
  value,
  inputId,
  onChange,
  onCommit,
  extra,
}: {
  kind: 'arrival' | 'departure'
  mode: ArrivalMode
  label: string
  date: string
  fromBig: string
  fromSmall?: string
  toBig: string
  toSmall?: string
  value: string | null | undefined
  inputId: string
  onChange: (value: string) => void
  /** Al salir del campo de la hora, con la hora ya puesta: abre la ventana «¿Ajustamos tu ruta a tu vuelo?». */
  onCommit: () => void
  extra?: ReactNode
}) {
  const set = Boolean(value)
  /** La ventana de ajustar solo sale si el viajero ha cambiado la hora (no por tocar el campo y salirse sin más). */
  const changed = useRef(false)
  const [x, y] = arcPoint(set ? 0.98 : 0.02)
  const icon = mode === 'avion' ? EXPLORE_ICONS.plane : EXPLORE_ICONS.bus
  const big = (text: string) => (text.length > 8 ? 24 : text.length > 5 ? 28 : 34)
  return (
    <div
      className="relative flex-none"
      style={{
        borderRadius: 22,
        background: '#FFFDF8',
        border: `1px solid ${set ? 'oklch(0.62 0.15 45 / .5)' : 'rgba(28,34,48,.08)'}`,
        boxShadow: '0 1px 2px rgba(28,34,48,.05),0 14px 30px -20px rgba(28,34,48,.4)',
        transition: 'border-color .4s',
      }}
    >
      <div className="grid items-center gap-2.5" style={{ padding: '14px 16px 12px', gridTemplateColumns: 'auto minmax(0,1fr) auto' }}>
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="font-display" style={{ fontSize: big(fromBig), lineHeight: 1 }}>{fromBig}</span>
          {fromSmall && <span className="text-text/55" style={{ font: "400 11px 'Geist'" }}>{fromSmall}</span>}
        </div>
        <div className="relative h-10">
          <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
            <path d="M4 32 Q50 -6 96 32" fill="none" stroke="rgba(28,34,48,.3)" strokeWidth="1.3" strokeDasharray="2 4" vectorEffect="non-scaling-stroke" />
            <path
              d="M4 32 Q50 -6 96 32"
              fill="none"
              stroke={ACCENT}
              strokeWidth="2"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              style={{ opacity: set ? 1 : 0, transition: 'opacity 1.2s cubic-bezier(.4,0,.2,1)' }}
            />
          </svg>
          <span
            aria-hidden="true"
            className="absolute flex h-6 w-6 items-center justify-center rounded-full text-white"
            style={{
              left: `${x}%`,
              top: `${(y / 40) * 100}%`,
              transform: `translate(-50%,-50%) rotate(${set ? 35 : -35}deg)`,
              background: set ? ACCENT : 'rgba(28,34,48,.35)',
              transition: 'left 1.2s cubic-bezier(.4,0,.2,1),top 1.2s cubic-bezier(.4,0,.2,1),background .4s,transform 1.2s',
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d={icon} transform={mode === 'avion' ? 'rotate(90 12 12)' : undefined} />
            </svg>
          </span>
        </div>
        <div className="flex min-w-0 flex-col items-end gap-0.5">
          <span className="font-display" style={{ fontSize: big(toBig), lineHeight: 1 }}>{toBig}</span>
          {toSmall && <span className="text-text/55" style={{ font: "400 11px 'Geist'" }}>{toSmall}</span>}
        </div>
      </div>

      <div className="relative mx-3.5 h-0" style={{ borderTop: '1.5px dashed rgba(28,34,48,.14)' }}>
        <span aria-hidden="true" className="absolute -left-6 -top-2.5 h-5 w-5 rounded-full bg-bg" style={{ boxShadow: 'inset -1px 0 0 rgba(28,34,48,.08)' }} />
        <span aria-hidden="true" className="absolute -right-6 -top-2.5 h-5 w-5 rounded-full bg-bg" style={{ boxShadow: 'inset 1px 0 0 rgba(28,34,48,.08)' }} />
      </div>

      <div className="grid items-end gap-3" style={{ padding: '12px 16px 14px', gridTemplateColumns: 'minmax(0,1fr) auto' }}>
        <div className="flex min-w-0 flex-col gap-1.5">
          <span style={{ font: "600 13px 'Geist'", color: '#1C2230' }}>{label}</span>
          <span className="text-text/50" style={{ font: "500 10.5px 'Geist Mono',monospace", letterSpacing: '.08em', textTransform: 'uppercase' }}>{date}</span>
        </div>
        <label
          htmlFor={inputId}
          className="flex cursor-pointer items-center gap-2"
          style={{
            height: 52,
            minWidth: 150,
            borderRadius: 14,
            padding: '0 10px 0 12px',
            background: set ? 'oklch(0.8 0.14 70 / .16)' : '#F1EADC',
            border: `1.5px solid ${set ? ACCENT : 'transparent'}`,
            transition: 'background .3s,border-color .3s',
          }}
        >
          <span className="text-text/50" style={{ font: "500 10px 'Geist Mono',monospace", letterSpacing: '.08em', textTransform: 'uppercase' }}>
            {kind === 'arrival' ? 'Llega' : 'Sale'}
          </span>
          <input
            id={inputId}
            type="time"
            value={value ?? ''}
            onChange={(event) => {
              changed.current = true
              onChange(event.target.value)
            }}
            onBlur={() => {
              if (!changed.current) return
              changed.current = false
              if (set) onCommit()
            }}
            className="min-w-0 flex-1 border-none bg-transparent font-display text-text outline-none"
            style={{ fontSize: 26, lineHeight: 1, colorScheme: 'light' }}
          />
        </label>
      </div>
      {extra && <div className="px-4 pb-3.5">{extra}</div>}
    </div>
  )
}

/**
 * «Tu primer y último día»: la barra de 08h a 24h de cada día. Rayado lo que no está libre, claro lo que sí, con la hora de empezar o de acabar.
 * Día 1: libre desde la hora en el centro (aterrizaje + traslado del punto). Último día: libre hasta la hora de salir (despegue − lo que hay que salir antes).
 * Los dos tiempos son los de la app (centerMinutesOf / leaveMinutesOf, con los de _llegada.json); aquí solo se dibujan.
 */
export function FirstLastDayCard({
  adjustLabel,
  adjusted,
  first,
  last,
}: {
  adjustLabel: string
  adjusted: boolean
  first: { day: string; flightTime: string | null; startMinutes: number | null }
  last: { day: string; flightTime: string | null; endMinutes: number | null }
}) {
  const bars = [
    {
      day: first.day,
      pin: hhmmToMinutes(first.flightTime),
      from: first.startMinutes,
      to: null as number | null,
      text:
        first.startMinutes == null
          ? 'Añade tu hora de llegada'
          : first.startMinutes >= DAY_END
            ? 'Sin tiempo libre'
            : `Libre desde las ${fmt(first.startMinutes)}`,
      on: first.startMinutes != null,
    },
    {
      day: last.day,
      pin: hhmmToMinutes(last.flightTime),
      from: null as number | null,
      to: last.endMinutes,
      text:
        last.endMinutes == null ? 'Añade tu hora de salida' : last.endMinutes <= DAY_START ? 'Sin tiempo libre' : `Libre hasta las ${fmt(last.endMinutes)}`,
      on: last.endMinutes != null,
    },
  ]
  return (
    <div className="flex flex-none flex-col gap-3.5 text-[#F3EEE4]" style={{ borderRadius: 22, background: '#1C2230', padding: '16px 16px 14px' }}>
      <div className="flex items-center justify-between">
        <span className="font-display" style={{ fontSize: 22, lineHeight: 1 }}>Tu primer y último día</span>
        <span style={{ font: "500 10px 'Geist Mono',monospace", letterSpacing: '.1em', textTransform: 'uppercase', color: adjusted ? 'oklch(0.8 0.14 70)' : 'rgba(243,238,228,.5)' }}>{adjustLabel}</span>
      </div>
      {bars.map((bar) => {
        const left = bar.from != null ? pc(bar.from) : '0%'
        const width = bar.from != null ? `calc(100% - ${pc(bar.from)})` : bar.to != null ? pc(bar.to) : '100%'
        return (
          <div key={bar.day} className="flex flex-col gap-[7px]">
            <div className="flex items-baseline justify-between gap-2">
              <span style={{ font: "500 11px 'Geist Mono',monospace", letterSpacing: '.08em', textTransform: 'uppercase', color: 'rgba(243,238,228,.6)' }}>{bar.day}</span>
              <span className="text-right" style={{ font: "400 13px 'Geist'", color: bar.on ? '#F3EEE4' : 'rgba(243,238,228,.55)' }}>{bar.text}</span>
            </div>
            <div className="relative mt-3 h-[30px] rounded-[9px]" style={{ background: 'repeating-linear-gradient(135deg,rgba(243,238,228,.12) 0 1px,transparent 1px 7px)' }}>
              <span
                className="absolute bottom-0 top-0 rounded-[9px]"
                style={{ left, width, background: 'linear-gradient(90deg,oklch(0.8 0.14 70),oklch(0.7 0.16 45))', opacity: bar.on ? 1 : 0.12, transition: 'left .9s cubic-bezier(.2,.8,.2,1),width .9s cubic-bezier(.2,.8,.2,1),opacity .4s' }}
              />
              {bar.pin != null && (
                <>
                  <span aria-hidden="true" className="absolute -bottom-[5px] -top-[5px] w-0.5 -translate-x-1/2 bg-[#F3EEE4]" style={{ left: pc(bar.pin), transition: 'left .9s cubic-bezier(.2,.8,.2,1)' }} />
                  <span aria-hidden="true" className="absolute -top-[18px] -translate-x-1/2 whitespace-nowrap text-[#F3EEE4]" style={{ left: pc(bar.pin), font: "600 10px 'Geist Mono',monospace", transition: 'left .9s cubic-bezier(.2,.8,.2,1)' }}>
                    ✈ {fmt(bar.pin)}
                  </span>
                </>
              )}
            </div>
            <div className="flex justify-between" style={{ font: "500 9.5px 'Geist Mono',monospace", color: 'rgba(243,238,228,.45)' }}>
              <span>08h</span>
              <span>12h</span>
              <span>16h</span>
              <span>20h</span>
              <span>24h</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/**
 * «¿Ajustamos tu ruta a tu vuelo?»: sube desde abajo al poner la hora de llegada o de salida, con el mismo estilo que «+ Añadir día».
 * La primera opción hace lo que la app ya hacía con «Optimizar ruta» en los días con oportunidad; la segunda deja la ruta como está.
 */
export function FlightAdjustSheet({ onAuto, onManual, onClose }: { onAuto: () => void; onManual: () => void; onClose: () => void }) {
  return createPortal(
    <div className="fixed inset-0 z-[95] flex items-end justify-center md:items-center" role="dialog" aria-modal="true" aria-labelledby="flight-adjust-heading">
      <div className="trazo-notice-backdrop absolute inset-0 bg-text/25 backdrop-blur-[6px]" onClick={onClose} />
      <div className="trazo-notice-panel relative w-full rounded-t-[28px] bg-bg-card px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-2.5 shadow-[0_-8px_40px_-12px_rgba(28,34,48,.35)] md:w-[420px] md:rounded-[28px]">
        <div className="flex justify-center" aria-hidden="true">
          <span className="h-1 w-[42px] rounded-full bg-text/20" />
        </div>
        <button type="button" onClick={onClose} aria-label="Cerrar" className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full text-text-soft hover:bg-bg-hover">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
        <p className="mt-4 font-mono text-[10.5px] font-medium uppercase tracking-[.16em] text-accent">Tu vuelo</p>
        <h2 id="flight-adjust-heading" className="mt-1.5 max-w-[calc(100%-2.5rem)] font-display text-[26px] leading-[1.15] text-text">
          ¿Ajustamos tu ruta a tu vuelo?
        </h2>
        <div className="mt-5 flex flex-col gap-2.5">
          <button type="button" onClick={onAuto} className="flex items-center gap-3.5 rounded-2xl border border-text/[.12] px-3.5 py-3 text-left transition-colors hover:bg-bg-hover">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 19L17 7M14 4l1 2 2 1-2 1-1 2-1-2-2-1 2-1zM19 12l.7 1.3L21 14l-1.3.7L19 16l-.7-1.3L17 14l1.3-.7z" />
              </svg>
            </span>
            <span className="min-w-0">
              <span className="block font-display text-[19px] leading-tight text-text">Sí, ajústala por mí</span>
              <span className="block text-[13px] text-text-soft">Movemos tu primer y tu último día a tus horas.</span>
            </span>
          </button>
          <button type="button" onClick={onManual} className="flex items-center gap-3.5 rounded-2xl border border-text/[.12] px-3.5 py-3 text-left transition-colors hover:bg-bg-hover">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E4EEDF] text-[#3F6B45]">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 20l1-4L16.5 4.5a2 2 0 0 1 3 3L8 19l-4 1z" />
              </svg>
            </span>
            <span className="min-w-0">
              <span className="block font-display text-[19px] leading-tight text-text">No, lo hago yo</span>
              <span className="block text-[13px] text-text-soft">Tu ruta se queda como está. Arriba ves el tiempo que tienes cada día.</span>
            </span>
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
