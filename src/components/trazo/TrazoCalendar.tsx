import { useState } from 'react'
import type { DateRange } from '../../lib/types'
import { isoToLocalDate, tocarDiaDelRango } from '../../lib/dateRange'
import { textoDeDuracion } from '../../lib/duracionViaje'
import { ACCENT, INK, MONO, SERIF, panelStyle } from './trazoUi'

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
const MS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
/** Como mucho 21 días de viaje. */
export const CALENDAR_MAX_DAYS = 21

interface TrazoCalendarProps {
  /** Las fechas con las que se abre (el mes que se ve es el de la llegada). */
  dateRange: DateRange | undefined
  /** Cada vez que cambia lo elegido: la llegada y la vuelta en milisegundos (null = sin elegir). */
  onSelect: (start: number | null, end: number | null) => void
  /** En cuanto se elige el día de llegada: su mes, para el ambiente de estación de fondo. */
  onPreviewMonth?: (month: number | null) => void
}

/**
 * EL calendario de la app (Tanda 6y4): el del paso de las fechas del formulario, sacado a un componente para que el formulario
 * (StepDates) y los cambios de fechas de dentro de la app (DatesCalendarModal) usen el MISMO, sin duplicarlo. Rango de ida y
 * vuelta, de 21 días como mucho, sin días pasados, con el resumen «3 jun → 9 jun · 7 días» debajo.
 */
export function TrazoCalendar({ dateRange, onSelect, onPreviewMonth }: TrazoCalendarProps) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const initial = dateRange ? isoToLocalDate(dateRange.start) : today
  const [cy, setCy] = useState(initial.getFullYear())
  const [cm, setCm] = useState(initial.getMonth())
  const [start, setStart] = useState<number | null>(dateRange ? isoToLocalDate(dateRange.start).getTime() : null)
  const [end, setEnd] = useState<number | null>(dateRange ? isoToLocalDate(dateRange.end).getTime() : null)

  const first = new Date(cy, cm, 1)
  const offset = (first.getDay() + 6) % 7
  const daysInMonth = new Date(cy, cm + 1, 0).getDate()
  const atMin = cy === today.getFullYear() && cm === today.getMonth()
  const maxEnd = start ? start + (CALENDAR_MAX_DAYS - 1) * 864e5 : null

  const clickDay = (ts: number) => {
    const next = tocarDiaDelRango({ start, end }, ts, CALENDAR_MAX_DAYS)
    if (!next) return
    setStart(next.start)
    setEnd(next.end)
    onSelect(next.start, next.end)
    // En cuanto se elige el día de llegada, sale al momento el efecto de esa temporada.
    if (next.end === null) onPreviewMonth?.(new Date(ts).getMonth())
  }

  const fd = (t: number) => {
    const x = new Date(t)
    return `${x.getDate()} ${MS[x.getMonth()]}`
  }
  const nights = start && end ? Math.round((end - start) / 864e5) : 0
  const summary = start && end ? `${fd(start)} → ${fd(end)}` : start ? `${fd(start)} → elige la vuelta` : 'Toca el día de salida'

  const cells: { key: string; label: string; ts: number | null }[] = []
  for (let i = 0; i < offset; i++) cells.push({ key: `e${i}`, label: '', ts: null })
  for (let i = 1; i <= daysInMonth; i++) cells.push({ key: `d${i}`, label: String(i), ts: new Date(cy, cm, i).getTime() })

  const navBtn = { width: 40, height: 40, borderRadius: '50%', border: '1px solid rgba(28,34,48,.12)', background: 'transparent', color: INK, cursor: 'pointer' }

  return (
    <div data-trazo-calendar style={{ ...panelStyle, background: 'rgba(255,255,255,0.90)', padding: '16px 14px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px 12px' }}>
        <button
          type="button"
          aria-label="Mes anterior"
          onClick={() => {
            if (atMin) return
            if (cm === 0) {
              setCm(11)
              setCy(cy - 1)
            } else setCm(cm - 1)
          }}
          style={{ ...navBtn, opacity: atMin ? 0.3 : 1 }}
        >
          ‹
        </button>
        <span style={{ font: `400 26px ${SERIF}`, color: INK }}>
          {MONTHS[cm]} {cy}
        </span>
        <button
          type="button"
          aria-label="Mes siguiente"
          onClick={() => {
            if (cm === 11) {
              setCm(0)
              setCy(cy + 1)
            } else setCm(cm + 1)
          }}
          style={navBtn}
        >
          ›
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,minmax(0,1fr))', gap: 3, font: `500 10px ${MONO}`, letterSpacing: '.1em', color: 'rgba(28,34,48,.5)', textAlign: 'center', paddingBottom: 6 }}>
        {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,minmax(0,1fr))', gap: 3 }}>
        {cells.map((cell) => {
          if (cell.ts == null) return <span key={cell.key} />
          const ts = cell.ts
          const past = ts < today.getTime()
          const tooFar = Boolean(start && !end && maxEnd && ts > maxEnd)
          const disabled = past || tooFar
          const isEdge = ts === start || ts === end
          const inRange = Boolean(start && end && ts > start && ts < end)
          return (
            <button className="zona-toque"
              key={cell.key}
              type="button"
              disabled={disabled}
              onClick={() => clickDay(ts)}
              style={{
                height: 42,
                border: 'none',
                borderRadius: inRange ? 6 : 12,
                background: isEdge ? INK : inRange ? 'rgba(166,124,82,.16)' : 'transparent',
                color: isEdge ? '#FFFFFF' : INK,
                font: `${isEdge ? 600 : 400} 14px 'Geist'`,
                cursor: disabled ? 'default' : 'pointer',
                opacity: disabled ? 0.28 : 1,
                transition: 'background .25s,color .25s',
              }}
            >
              {cell.label}
            </button>
          )
        })}
      </div>
      <div
        style={{
          marginTop: 12,
          padding: '12px 4px 0',
          borderTop: '1px solid rgba(28,34,48,.08)',
          font: "400 14px 'Geist'",
          color: start ? INK : 'rgba(28,34,48,.6)',
          display: 'flex',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <span>{summary}</span>
        <span style={{ font: `500 12px ${MONO}`, color: ACCENT }}><span data-duracion-del-calendario="1">{start && end ? textoDeDuracion(nights + 1) : ''}</span></span>
      </div>
    </div>
  )
}
