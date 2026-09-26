import { useState } from 'react'
import type { DateRange, QuestionnaireAnswers } from '../../lib/types'
import { seasonOfMonth } from '../../lib/season'
import { daysBetweenInclusive, isoToLocalDate, localDateToIso } from '../../lib/dateRange'
import { AMBER, Cta, Em, GhostButton, INK, MONO, SERIF, SEASON_FX, Sheet, Title, panelStyle } from './trazoUi'

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
const MS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
/** Como hasta ahora: como mucho 21 días. */
const MAX_DAYS = 21

interface StepDatesProps {
  destinationName: string
  days: number | undefined
  dateRange: DateRange | undefined
  month: number | undefined
  onChange: (partial: Partial<QuestionnaireAnswers>) => void
  /** Mes que se está eligiendo en la hoja (para el ambiente de estación de fondo). */
  onPreviewMonth: (month: number | null) => void
  onNext: () => void
}

/**
 * 03 — Fechas: calendario de ida y vuelta, o "Aún no sé mis fechas" (hoja con cuántos días y qué mes).
 * Guarda lo mismo que antes: dateRange + days + month + season, o days + month + season sin fechas.
 */
export function StepDates({ destinationName, days, dateRange, month, onChange, onPreviewMonth, onNext }: StepDatesProps) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const initial = dateRange ? isoToLocalDate(dateRange.start) : today
  const [cy, setCy] = useState(initial.getFullYear())
  const [cm, setCm] = useState(initial.getMonth())
  const [start, setStart] = useState<number | null>(dateRange ? isoToLocalDate(dateRange.start).getTime() : null)
  const [end, setEnd] = useState<number | null>(dateRange ? isoToLocalDate(dateRange.end).getTime() : null)
  const [sheet, setSheet] = useState(false)
  const [flexDays, setFlexDays] = useState(!dateRange && days ? days : 5)
  const [flexMonth, setFlexMonth] = useState<number | null>(!dateRange && month !== undefined ? month : null)

  const first = new Date(cy, cm, 1)
  const offset = (first.getDay() + 6) % 7
  const daysInMonth = new Date(cy, cm + 1, 0).getDate()
  const atMin = cy === today.getFullYear() && cm === today.getMonth()
  const maxEnd = start ? start + (MAX_DAYS - 1) * 864e5 : null

  const clickDay = (ts: number) => {
    if (!start || end || ts < start) {
      setStart(ts)
      setEnd(null)
      return
    }
    if (ts === start) return
    if (maxEnd && ts > maxEnd) return
    setEnd(ts)
  }

  const fd = (t: number) => {
    const x = new Date(t)
    return `${x.getDate()} ${MS[x.getMonth()]}`
  }
  const nights = start && end ? Math.round((end - start) / 864e5) : 0
  const summary = start && end ? `${fd(start)} → ${fd(end)}` : start ? `${fd(start)} → elige la vuelta` : 'Toca el día de salida'

  const confirmRange = () => {
    if (!start || !end) return
    const startIso = localDateToIso(new Date(start))
    const endIso = localDateToIso(new Date(end))
    const span = daysBetweenInclusive(startIso, endIso) ?? nights + 1
    const startMonth = new Date(start).getMonth()
    onChange({ dateRange: { start: startIso, end: endIso }, days: span, month: startMonth, season: seasonOfMonth(startMonth) })
    onNext()
  }
  const confirmFlex = () => {
    if (flexMonth == null) return
    onChange({ dateRange: undefined, days: flexDays, month: flexMonth, season: seasonOfMonth(flexMonth) })
    setSheet(false)
    onPreviewMonth(null)
    setTimeout(onNext, 250)
  }

  const cells: { key: string; label: string; ts: number | null }[] = []
  for (let i = 0; i < offset; i++) cells.push({ key: `e${i}`, label: '', ts: null })
  for (let i = 1; i <= daysInMonth; i++) cells.push({ key: `d${i}`, label: String(i), ts: new Date(cy, cm, i).getTime() })

  const navBtn = { width: 40, height: 40, borderRadius: '50%', border: '1px solid rgba(243,238,228,.12)', background: 'transparent', color: INK, cursor: 'pointer' }

  return (
    <>
      <div style={{ font: `500 11px/1 ${MONO}`, letterSpacing: '.14em', color: AMBER, textTransform: 'uppercase' }}>03 — Fechas</div>
      <Title size={40}>
        ¿Cuándo llegas a <Em>{destinationName}</Em>?
      </Title>
      <div style={{ flex: 1, minHeight: 12 }} />
      <div style={{ ...panelStyle, background: 'rgba(12,16,26,.8)', padding: '16px 14px 14px' }}>
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,minmax(0,1fr))', gap: 3, font: `500 10px ${MONO}`, letterSpacing: '.1em', color: 'rgba(243,238,228,.5)', textAlign: 'center', paddingBottom: 6 }}>
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
              <button
                key={cell.key}
                type="button"
                disabled={disabled}
                onClick={() => clickDay(ts)}
                style={{
                  height: 42,
                  border: 'none',
                  borderRadius: inRange ? 6 : 12,
                  background: isEdge ? AMBER : inRange ? 'rgba(242,181,68,.16)' : 'transparent',
                  color: isEdge ? '#17120a' : INK,
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
            borderTop: '1px solid rgba(243,238,228,.08)',
            font: "400 14px 'Geist'",
            color: start ? INK : 'rgba(243,238,228,.6)',
            display: 'flex',
            justifyContent: 'space-between',
            gap: 8,
          }}
        >
          <span>{summary}</span>
          <span style={{ font: `500 12px ${MONO}`, color: AMBER }}>{nights ? `${nights + 1} días` : ''}</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
        <GhostButton onClick={() => setSheet(true)} style={{ flex: 1 }}>
          Aún no sé mis fechas
        </GhostButton>
        <Cta onClick={confirmRange} enabled={Boolean(start && end)} style={{ flex: 1 }}>
          Continuar
        </Cta>
      </div>

      <Sheet
        open={sheet}
        onClose={() => {
          setSheet(false)
          onPreviewMonth(null)
        }}
      >
        <div style={{ font: `500 11px/1 ${MONO}`, letterSpacing: '.14em', color: AMBER, textTransform: 'uppercase' }}>Fechas flexibles</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, marginTop: 10 }}>
          <h2 style={{ margin: 0, font: `400 32px/1.02 ${SERIF}`, maxWidth: 190 }}>¿Cuántos días?</h2>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ font: `400 84px/.8 ${SERIF}`, color: AMBER }}>{flexDays}</span>
            <span style={{ font: "400 15px 'Geist'", color: 'rgba(243,238,228,.75)' }}>{flexDays === 1 ? 'día' : 'días'}</span>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,minmax(0,1fr))', gap: 4, marginTop: 20 }}>
          {Array.from({ length: MAX_DAYS }, (_, i) => i + 1).map((n) => {
            const sel = n === flexDays
            const under = n < flexDays
            return (
              <button
                key={n}
                type="button"
                onClick={() => setFlexDays(n)}
                style={{
                  height: 34,
                  border: 'none',
                  borderRadius: sel ? '50%' : 10,
                  background: sel ? AMBER : under ? 'rgba(242,181,68,.16)' : 'rgba(243,238,228,.04)',
                  color: sel ? '#17120a' : INK,
                  font: `${sel ? 600 : 400} 14px 'Geist'`,
                  cursor: 'pointer',
                  transition: 'background .25s,color .25s',
                }}
              >
                {n}
              </button>
            )
          })}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(243,238,228,.08)' }}>
          <h2 style={{ margin: 0, font: `400 26px/1 ${SERIF}` }}>¿Qué mes?</h2>
          <span style={{ font: `500 11px ${MONO}`, letterSpacing: '.1em', textTransform: 'uppercase', color: AMBER }}>
            {flexMonth != null ? `${MONTHS[flexMonth]} · ${SEASON_FX[seasonOfMonth(flexMonth)].name}` : ''}
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
          {(
            [
              ['winter', [11, 0, 1]],
              ['spring', [2, 3, 4]],
              ['summer', [5, 6, 7]],
              ['autumn', [8, 9, 10]],
            ] as const
          ).map(([season, months]) => {
            const on = flexMonth != null && (months as readonly number[]).includes(flexMonth)
            return (
              <div key={season} style={{ display: 'grid', gridTemplateColumns: '92px repeat(3,minmax(0,1fr))', gap: 6, alignItems: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, font: `500 10px ${MONO}`, letterSpacing: '.1em', textTransform: 'uppercase', color: on ? INK : 'rgba(243,238,228,.6)', transition: 'color .3s' }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', flex: 'none', background: SEASON_FX[season].swatch }} />
                  {SEASON_FX[season].name}
                </span>
                {months.map((m) => {
                  const active = flexMonth === m
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        setFlexMonth(m)
                        onPreviewMonth(m)
                      }}
                      style={{
                        height: 38,
                        borderRadius: 12,
                        border: `1px solid ${active ? AMBER : 'rgba(243,238,228,.08)'}`,
                        background: active ? AMBER : 'rgba(243,238,228,.04)',
                        color: active ? '#17120a' : INK,
                        font: `${active ? 600 : 400} 14px 'Geist'`,
                        cursor: 'pointer',
                        transition: 'background .25s,color .25s,border-color .25s',
                      }}
                    >
                      {MS[m][0].toUpperCase() + MS[m].slice(1)}
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          <GhostButton
            onClick={() => {
              setSheet(false)
              onPreviewMonth(null)
            }}
            style={{ flex: 1, height: 56, background: 'transparent' }}
          >
            Cancelar
          </GhostButton>
          <Cta onClick={confirmFlex} enabled={flexMonth != null} style={{ flex: 1.4, height: 56 }}>
            Continuar
          </Cta>
        </div>
      </Sheet>
    </>
  )
}
