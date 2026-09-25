import { useEffect, useState } from 'react'
import { DayPicker, type DateRange as PickerRange } from 'react-day-picker'
import 'react-day-picker/style.css'
import { es } from 'date-fns/locale'
import type { DateRange, QuestionnaireAnswers } from '../../lib/types'
import { daysBetweenInclusive, isoToLocalDate, localDateToIso, todayIso } from '../../lib/dateRange'
import { MONTH_ROWS, MONTH_SHORT, SEASON_META, seasonOfMonth } from '../../lib/season'

interface DurationSelectorProps {
  days?: number
  dateRange?: DateRange
  /** Mes del viaje (0-11): obligatorio sin fechas; con fechas sale de ellas. */
  month?: number
  onChange: (partial: Partial<Pick<QuestionnaireAnswers, 'days' | 'dateRange' | 'season' | 'month'>>) => void
}

const QUICK_DAY_OPTIONS = [3, 5, 7, 10, 14]
const MAX_DAYS = 21

function formatRangeEs(range: DateRange): string {
  const formatter = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short' })
  const start = formatter.format(new Date(`${range.start}T00:00:00`))
  const end = formatter.format(new Date(`${range.end}T00:00:00`))
  return `${start} → ${end}`
}

export function DurationSelector({ days, dateRange, month, onChange }: DurationSelectorProps) {
  const [customDraft, setCustomDraft] = useState(days !== undefined ? String(days) : '')
  const [showCalendar, setShowCalendar] = useState(false)
  // Rango a medio elegir (solo "Inicio" clicado, "Fin" todavía no) — el propio DayPicker se
  // encarga de resaltarlo visualmente mientras tanto; solo se aplica de verdad (onChange) al
  // completarse con las dos fechas.
  const [draftRange, setDraftRange] = useState<PickerRange | undefined>(
    dateRange ? { from: isoToLocalDate(dateRange.start), to: isoToLocalDate(dateRange.end) } : undefined,
  )
  const [dateError, setDateError] = useState<string | null>(null)
  // Al abrir "¿ya tienes fecha?" ocultamos la época hasta que el usuario vuelva a elegir
  // días de forma explícita (botón rápido o campo "otro") — evita mostrar dos preguntas
  // de tiempo contradictorias a la vez.
  const [seasonHidden, setSeasonHidden] = useState(false)

  useEffect(() => {
    setCustomDraft(days !== undefined ? String(days) : '')
  }, [days])

  const hasDateRange = Boolean(dateRange)

  const selectQuickDays = (value: number) => {
    onChange({ days: value })
    setSeasonHidden(false)
  }

  const handleCustomDaysInput = (raw: string) => {
    const digitsOnly = raw.replace(/\D/g, '').slice(0, 2)
    if (!digitsOnly) {
      setCustomDraft('')
      return
    }
    const clamped = Math.min(Number(digitsOnly), MAX_DAYS)
    setCustomDraft(String(clamped))
    if (clamped >= 1) {
      onChange({ days: clamped })
      setSeasonHidden(false)
    }
  }

  const handleCustomDaysBlur = () => {
    if (!customDraft || Number(customDraft) < 1) {
      setCustomDraft(days !== undefined ? String(days) : '')
    }
  }

  const applyDateRange = (start: string, end: string) => {
    const spanDays = daysBetweenInclusive(start, end)
    if (spanDays === null) {
      setDateError('La fecha de fin debe ser posterior a la de inicio.')
      return
    }
    if (spanDays > MAX_DAYS) {
      setDateError(`El rango no puede superar ${MAX_DAYS} días.`)
      return
    }
    setDateError(null)
    // Con fechas, el mes (y la temporada) salen de ellas: no se pregunta.
    const startMonth = Number(start.slice(5, 7)) - 1
    onChange({ dateRange: { start, end }, days: spanDays, month: startMonth, season: seasonOfMonth(startMonth) })
  }

  const handleRangeSelect = (range: PickerRange | undefined) => {
    setDraftRange(range)
    if (range?.from && range?.to) {
      applyDateRange(localDateToIso(range.from), localDateToIso(range.to))
    }
  }

  const clearDateRange = () => {
    onChange({ dateRange: undefined })
    setDraftRange(undefined)
    setShowCalendar(false)
    setDateError(null)
    setSeasonHidden(false)
  }

  if (hasDateRange && dateRange) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3 rounded-onb-md border border-onb-accent/40 bg-onb-accent-light px-4 py-3">
          <div>
            <p className="font-dmsans text-body font-medium text-onb-text">📅 {formatRangeEs(dateRange)}</p>
            <p className="font-dmsans text-small text-onb-text-soft">{days} días exactos</p>
          </div>
          <button type="button" onClick={clearDateRange} className="shrink-0 font-dmsans text-caption font-medium text-onb-accent hover:text-onb-accent-hover">
            Quitar fechas
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-5 gap-2">
        {QUICK_DAY_OPTIONS.map((option) => {
          const active = days === option
          return (
            <button
              key={option}
              type="button"
              onClick={() => selectQuickDays(option)}
              className={`rounded-onb-sm border py-2.5 text-center font-dmsans text-body font-medium transition-colors ${
                active ? 'border-onb-accent bg-onb-accent-light text-onb-accent-hover' : 'border-onb-border bg-onb-card text-onb-text hover:border-onb-accent/50'
              }`}
            >
              {option}
            </button>
          )
        })}
      </div>

      <div className="flex items-center gap-2">
        <span className="font-dmsans text-small text-onb-text-soft">Otro:</span>
        <input
          type="number"
          inputMode="numeric"
          min={1}
          max={MAX_DAYS}
          value={customDraft}
          onChange={(event) => handleCustomDaysInput(event.target.value)}
          onBlur={handleCustomDaysBlur}
          placeholder="9"
          className="w-16 rounded-onb-sm border border-onb-border bg-onb-card px-3 py-2 font-dmsans text-body text-onb-text focus:border-onb-accent focus:outline-none"
        />
        <span className="font-dmsans text-caption text-onb-text-muted">días (máx. {MAX_DAYS})</span>
      </div>

      <button
        type="button"
        onClick={() =>
          setShowCalendar((value) => {
            const next = !value
            if (next) setSeasonHidden(true)
            return next
          })
        }
        className="flex items-center gap-2 font-dmsans text-caption font-medium text-onb-accent hover:text-onb-accent-hover"
      >
        <span className="text-2xl leading-none">📅</span>
        {showCalendar ? 'Ocultar fechas exactas' : '¿Ya tienes fecha para tu viaje?'}
      </button>

      {showCalendar && (
        <div className="space-y-2 rounded-onb-md border border-onb-border bg-onb-card p-3">
          <div className="calendar-scope flex justify-center">
            <DayPicker
              mode="range"
              selected={draftRange}
              onSelect={handleRangeSelect}
              disabled={{ before: isoToLocalDate(todayIso()) }}
              resetOnSelect
              numberOfMonths={1}
              locale={es}
              weekStartsOn={1}
              showOutsideDays
            />
          </div>
          <p className="font-dmsans text-caption text-onb-text-soft">
            Con fechas exactas, cruzamos el itinerario con estacionalidad, clima, festivos, cierres y eventos especiales.
          </p>
          {dateError && <p className="font-dmsans text-caption text-red-500">{dateError}</p>}
        </div>
      )}

      {days !== undefined && !seasonHidden && (
        <div className="space-y-2 pt-1">
          <p className="font-dmsans text-caption font-semibold uppercase tracking-wide text-onb-text-muted">¿Qué mes viajas?</p>
          {/* 12 meses en 4 filas por temporada (Estaciones, Parte 1): el mes decide horarios y
              puesta de sol; la temporada se deduce. Obligatorio sin fechas. */}
          <div className="space-y-1.5">
            {MONTH_ROWS.map((row) => (
              <div key={row.season} className="grid grid-cols-[6.5rem_repeat(3,1fr)] items-center gap-2">
                <span className="font-dmsans text-caption text-onb-text-soft">{SEASON_META[row.season].label}</span>
                {row.months.map((value) => {
                  const active = month === value
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => onChange({ month: value, season: seasonOfMonth(value) })}
                      className={`rounded-onb-sm border py-2 text-center font-dmsans text-body transition-colors ${
                        active ? 'border-onb-accent bg-onb-accent-light text-onb-accent-hover' : 'border-onb-border bg-onb-card text-onb-text hover:border-onb-accent/50'
                      }`}
                    >
                      {MONTH_SHORT[value]}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
