import { useEffect, useState } from 'react'
import { DayPicker, type DateRange as PickerRange } from 'react-day-picker'
import 'react-day-picker/style.css'
import { es } from 'date-fns/locale'
import type { DateRange, QuestionnaireAnswers, Season } from '../../lib/types'
import { daysBetweenInclusive, todayIso } from '../../lib/dateRange'
import { SEASON_META, getCurrentSeason } from '../../lib/season'
import { ChoiceButton } from './ChoiceButton'

interface DurationSelectorProps {
  days?: number
  dateRange?: DateRange
  season?: Season
  onChange: (partial: Partial<Pick<QuestionnaireAnswers, 'days' | 'dateRange' | 'season'>>) => void
}

const QUICK_DAY_OPTIONS = [3, 5, 7, 10, 14]
const MAX_DAYS = 21

function formatRangeEs(range: DateRange): string {
  const formatter = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short' })
  const start = formatter.format(new Date(`${range.start}T00:00:00`))
  const end = formatter.format(new Date(`${range.end}T00:00:00`))
  return `${start} → ${end}`
}

/** Fecha ISO (yyyy-mm-dd) → Date en huso horario local, sin el desfase de `new Date(iso)` (que la interpreta en UTC). */
function isoToLocalDate(iso: string): Date {
  return new Date(`${iso}T00:00:00`)
}

/** Date → fecha ISO (yyyy-mm-dd) usando los componentes LOCALES — nunca `.toISOString()`, que desplaza el día según el huso horario. */
function localDateToIso(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function DurationSelector({ days, dateRange, season, onChange }: DurationSelectorProps) {
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
    onChange({ dateRange: { start, end }, days: spanDays, season: undefined })
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
        <div className="flex items-center justify-between gap-3 rounded-xl border border-accent/40 bg-accent-soft px-4 py-3">
          <div>
            <p className="text-body font-medium text-text">📅 {formatRangeEs(dateRange)}</p>
            <p className="text-small text-text-soft">{days} días exactos</p>
          </div>
          <button type="button" onClick={clearDateRange} className="shrink-0 text-caption font-medium text-accent hover:text-accent-hover">
            Quitar fechas
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-5 gap-2">
        {QUICK_DAY_OPTIONS.map((option) => (
          <ChoiceButton key={option} label={String(option)} selected={days === option} onClick={() => selectQuickDays(option)} />
        ))}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-small text-text-soft">Otro:</span>
        <input
          type="number"
          inputMode="numeric"
          min={1}
          max={MAX_DAYS}
          value={customDraft}
          onChange={(event) => handleCustomDaysInput(event.target.value)}
          onBlur={handleCustomDaysBlur}
          placeholder="9"
          className="w-16 rounded-xl border border-border bg-bg px-3 py-2 text-body text-text focus:border-accent focus:outline-none"
        />
        <span className="text-caption text-text-muted">días (máx. {MAX_DAYS})</span>
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
        className="flex items-center gap-2 text-caption font-medium text-accent hover:text-accent-hover"
      >
        <span className="text-2xl leading-none">📅</span>
        {showCalendar ? 'Ocultar fechas exactas' : '¿Ya tienes fecha para tu viaje?'}
      </button>

      {showCalendar && (
        <div className="space-y-2 rounded-xl border border-border bg-bg-card p-3">
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
          <p className="text-caption text-text-soft">
            Con fechas exactas, cruzamos el itinerario con estacionalidad, clima, festivos, cierres y eventos especiales.
          </p>
          {dateError && <p className="text-caption text-red-500">{dateError}</p>}
        </div>
      )}

      {days !== undefined && !seasonHidden && (
        <div className="space-y-2 pt-1">
          <p className="text-caption font-semibold uppercase tracking-wide text-text-muted">¿En qué época viajas? (opcional)</p>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(SEASON_META) as Season[]).map((key) => (
              <ChoiceButton
                key={key}
                icon={SEASON_META[key].icon}
                label={SEASON_META[key].label}
                selected={season === key}
                onClick={() => onChange({ season: key })}
              />
            ))}
          </div>
          <p className="text-caption text-text-muted">
            Si no eliges, usaremos la estación actual ({SEASON_META[getCurrentSeason()].label.toLowerCase()}) para que la ruta tenga sentido.
          </p>
        </div>
      )}
    </div>
  )
}
