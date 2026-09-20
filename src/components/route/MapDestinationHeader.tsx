import { useState } from 'react'
import { DayPicker, type DateRange as PickerRange } from 'react-day-picker'
import 'react-day-picker/style.css'
import { es } from 'date-fns/locale'
import type { DateRange } from '../../lib/types'
import { daysBetweenInclusive, formatHeaderDateRangeEs, isoToLocalDate, localDateToIso, todayIso } from '../../lib/dateRange'

interface MapDestinationHeaderProps {
  destination: string
  dateRange?: DateRange
  onChangeDateRange: (dateRange: DateRange | undefined) => void
}

/**
 * Cabecera flotante centrada sobre el mapa de RUTA (Ronda 9, Mejora 2) — destino + fechas exactas del
 * viaje si existen, o "Añadir fechas" clicable si no (abre este mismo calendario). Las fechas viven en
 * `route.answers.dateRange`, la misma fuente que ya usan DayList.tsx (fecha real de cada día) y
 * destinationSegments.ts (rango de cada tramo) — fijarlas aquí las propaga automáticamente a toda la
 * app sin tocar nada más. No cambia el número de días de la ruta ya generada, solo le da fecha real.
 */
export function MapDestinationHeader({ destination, dateRange, onChangeDateRange }: MapDestinationHeaderProps) {
  const [showCalendar, setShowCalendar] = useState(false)
  const [draftRange, setDraftRange] = useState<PickerRange | undefined>(
    dateRange ? { from: isoToLocalDate(dateRange.start), to: isoToLocalDate(dateRange.end) } : undefined,
  )
  const [dateError, setDateError] = useState<string | null>(null)

  const handleRangeSelect = (range: PickerRange | undefined) => {
    setDraftRange(range)
    if (!range?.from || !range?.to) return
    const start = localDateToIso(range.from)
    const end = localDateToIso(range.to)
    const spanDays = daysBetweenInclusive(start, end)
    if (spanDays === null) {
      setDateError('La fecha de fin debe ser posterior a la de inicio.')
      return
    }
    setDateError(null)
    onChangeDateRange({ start, end })
    setShowCalendar(false)
  }

  return (
    <div className="absolute left-1/2 top-3 z-10 -translate-x-1/2">
      <button
        type="button"
        onClick={() => setShowCalendar((value) => !value)}
        className="rounded-full border-2 border-accent bg-bg-card px-4 py-2 text-center shadow-md transition-colors hover:bg-bg-hover"
      >
        <p className="text-body font-bold leading-tight text-text">{destination}</p>
        {dateRange ? (
          <p className="text-caption text-text-soft">{formatHeaderDateRangeEs(dateRange.start, dateRange.end)}</p>
        ) : (
          <p className="text-caption font-medium text-accent">Añadir fechas</p>
        )}
      </button>

      {showCalendar && (
        <div className="calendar-scope absolute left-1/2 top-full mt-2 -translate-x-1/2 rounded-xl border border-border bg-bg-card p-3 shadow-lg">
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
          {dateError && <p className="px-2 pb-1 text-caption text-red-500">{dateError}</p>}
          {dateRange && (
            <button
              type="button"
              onClick={() => {
                onChangeDateRange(undefined)
                setDraftRange(undefined)
                setShowCalendar(false)
                setDateError(null)
              }}
              className="w-full pt-1 text-center text-caption font-medium text-accent hover:text-accent-hover"
            >
              Quitar fechas
            </button>
          )}
        </div>
      )}
    </div>
  )
}
