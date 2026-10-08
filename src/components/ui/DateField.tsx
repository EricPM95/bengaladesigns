import { useState, type CSSProperties } from 'react'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/style.css'
import { es } from 'date-fns/locale'
import { isoToLocalDate, localDateToIso } from '../../lib/dateRange'
import { FIELD_BUTTON_CLASS, PickerSheet } from './PickerSheet'

const LONG = new Intl.DateTimeFormat('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })

/** «jue 31 dic». */
export function formatDateField(iso: string): string {
  return LONG.format(isoToLocalDate(iso)).replace(/\./g, '')
}

/** Los colores de la app para el calendario (react-day-picker 10 los lee de estas variables). */
const CALENDAR_STYLE = {
  '--rdp-accent-color': 'rgb(var(--accent))',
  '--rdp-accent-background-color': 'rgb(var(--accent-soft))',
  '--rdp-today-color': 'rgb(var(--accent))',
  '--rdp-day_button-border-radius': '999px',
  color: 'rgb(var(--text))',
} as CSSProperties

/**
 * El selector de fecha de toda la app (Tanda 6k, punto 8): un botón que abre una hoja desde abajo con el mismo calendario que el formulario («Añadir fechas»),
 * con los colores de la app. `min` / `max` (ISO) dejan tocar solo los días del viaje: los demás, en gris. Sustituye al campo de fecha del sistema.
 */
export function DateField({
  value,
  onChange,
  title = 'Elige el día',
  min,
  max,
  placeholder = 'Elige el día',
  format = formatDateField,
  className = FIELD_BUTTON_CLASS,
  ariaLabel,
}: {
  value: string
  onChange: (iso: string) => void
  title?: string
  min?: string
  max?: string
  placeholder?: string
  /** Cómo se escribe la fecha elegida en el botón («Día 2 · mar 12 ene · aquí está ahora»). */
  format?: (iso: string) => string
  className?: string
  ariaLabel?: string
}) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<string>(value)
  const disabled = [...(min ? [{ before: isoToLocalDate(min) }] : []), ...(max ? [{ after: isoToLocalDate(max) }] : [])]
  const close = () => setOpen(false)
  return (
    <>
      <button
        type="button"
        aria-label={ariaLabel ?? title}
        className={className}
        onClick={() => {
          setDraft(value)
          setOpen(true)
        }}
      >
        <span className={value ? '' : 'text-text-muted'}>{value ? format(value) : placeholder}</span>
        <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-text-soft" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="4" y="5" width="16" height="15" rx="2" />
          <path d="M4 10h16M9 3v4M15 3v4" />
        </svg>
      </button>
      {open && (
        <PickerSheet
          title={title}
          onClose={close}
          doneDisabled={!draft}
          onDone={() => {
            if (draft) onChange(draft)
            close()
          }}
        >
          <div className="calendar-scope flex justify-center" style={CALENDAR_STYLE}>
            <DayPicker
              mode="single"
              selected={draft ? isoToLocalDate(draft) : undefined}
              onSelect={(date) => date && setDraft(localDateToIso(date))}
              defaultMonth={draft ? isoToLocalDate(draft) : min ? isoToLocalDate(min) : undefined}
              disabled={disabled.length > 0 ? disabled : undefined}
              locale={es}
              weekStartsOn={1}
              showOutsideDays
              numberOfMonths={1}
            />
          </div>
        </PickerSheet>
      )}
    </>
  )
}
