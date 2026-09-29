import { useState } from 'react'
import { DayPicker, type DateRange as PickerRange } from 'react-day-picker'
import 'react-day-picker/style.css'
import { es } from 'date-fns/locale'
import type { DateRange } from '../../lib/types'
import { daysBetweenInclusive, formatHeaderDateRangeEs, formatHeaderDateRangeShortEs, isoToLocalDate, localDateToIso, todayIso } from '../../lib/dateRange'

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
    <div className="absolute left-1/2 top-3.5 z-10 -translate-x-1/2">
      <button
        type="button"
        onClick={() => setShowCalendar((value) => !value)}
        className="flex flex-col items-center gap-[3px] rounded-[22px] border-[1.5px] border-accent bg-bg-card px-[22px] pb-[10px] pt-[9px] text-center shadow-[0_10px_28px_-10px_rgba(28,34,48,.35)] transition-colors hover:bg-bg-hover max-[479px]:h-[38px] max-[479px]:flex-row max-[479px]:gap-1.5 max-[479px]:rounded-full max-[479px]:px-3.5 max-[479px]:py-0"
      >
        {/* En el móvil, una línea: "Roma · 9 – 12 jun", sin tapar el mapa (decisión del usuario, 2026-09-29). */}
        <p className="whitespace-nowrap font-display text-[26px] leading-none text-text max-[479px]:text-[20px]">{destination}</p>
        {dateRange ? (
          <>
            <p className="whitespace-nowrap text-[12px] font-medium text-accent max-[479px]:hidden">{formatHeaderDateRangeEs(dateRange.start, dateRange.end)}</p>
            <p className="hidden whitespace-nowrap text-[12px] font-medium text-accent max-[479px]:block">· {formatHeaderDateRangeShortEs(dateRange.start, dateRange.end)}</p>
          </>
        ) : (
          <p className="text-[12px] font-medium text-accent">Añadir fechas</p>
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
