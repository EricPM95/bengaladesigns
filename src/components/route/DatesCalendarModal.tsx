import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { DateRange } from '../../lib/types'
import { seasonOfMonth } from '../../lib/season'
import { isoToLocalDate, rangoCompleto } from '../../lib/dateRange'
import { useDatesCalendarStore } from '../../store/useDatesCalendarStore'
import { TrazoCalendar } from '../trazo/TrazoCalendar'
import { ACCENT, Em, GhostButton, INK, MONO, SEASON_FX, SeasonFx, THEME, Title } from '../trazo/trazoUi'
import '../trazo/trazo.css'

/** Z-index del calendario: por encima de la cabecera, la barra de abajo, las hojas, los selectores (120) y los avisos. */
export const DATES_CALENDAR_Z = 130

const PARTS = Array.from({ length: 26 }, () => [Math.random(), Math.random(), Math.random(), Math.random()])

interface DatesCalendarModalProps {
  destination: string
  dateRange: DateRange | undefined
  onChangeDateRange: (dateRange: DateRange | undefined) => void
}

/**
 * El calendario de cambiar las fechas del viaje, a pantalla completa (Tanda 6y4). Es el MISMO calendario del paso de las fechas del formulario (`TrazoCalendar`:
 * sus colores, su letra y el ambiente de su temporada), pintado en el `body` con un portal —como los tips— para que ni la cabecera, ni la barra de abajo, ni
 * ningún panel lo tapen. Se abre solo, sin cambiar de pestaña, desde todos los sitios (`useDatesCalendarStore.request()`); al guardar o cerrar, vuelve a donde estaba.
 * Hace lo mismo que el anterior: elegir el rango (llegada y vuelta) y «Quitar fechas».
 */
export function DatesCalendarModal(props: DatesCalendarModalProps) {
  const open = useDatesCalendarStore((state) => state.open)
  if (!open || typeof document === 'undefined') return null
  return createPortal(<DatesCalendarBody {...props} />, document.body)
}

export function DatesCalendarBody({ destination, dateRange, onChangeDateRange }: DatesCalendarModalProps) {
  const close = useDatesCalendarStore((state) => state.close)
  const [start, setStart] = useState<number | null>(dateRange ? isoToLocalDate(dateRange.start).getTime() : null)
  const [previewMonth, setPreviewMonth] = useState<number | null>(null)
  const [dateError, setDateError] = useState<string | null>(null)
  const city = destination.split(',')[0].trim()

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [close])

  const month = previewMonth ?? (start !== null ? new Date(start).getMonth() : dateRange ? isoToLocalDate(dateRange.start).getMonth() : null)
  const season = month !== null ? seasonOfMonth(month) : null

  // (Tanda 6y5) Sin botón [Guardar]: se guarda al tocar el segundo día. Si se equivoca, vuelve a tocar las fechas y las cambia.
  const save = (from: number | null, to: number | null) => {
    if (from === null || to === null) return
    const rango = rangoCompleto({ start: from, end: to })
    if (!rango) {
      setDateError('La fecha de fin debe ser posterior a la de inicio.')
      return
    }
    close()
    onChangeDateRange(rango)
  }
  const clear = () => {
    close()
    onChangeDateRange(undefined)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="dates-calendar-title"
      data-dates-calendar
      className="trazo-root fixed inset-0 flex flex-col overflow-y-auto"
      style={{ zIndex: DATES_CALENDAR_Z, background: `linear-gradient(180deg,${THEME.page1} 0%,${THEME.page2} 100%)`, color: INK }}
    >
      {(['spring', 'summer', 'autumn', 'winter'] as const).map((k) => (
        <div key={k} aria-hidden="true" style={{ position: 'fixed', inset: 0, background: SEASON_FX[k].gradient, opacity: season === k ? THEME.amb : 0, transition: 'opacity 1.3s ease', pointerEvents: 'none' }} />
      ))}
      <div aria-hidden="true" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', opacity: season ? 0.6 : 0, transition: 'opacity 1.2s' }}>
        {(['spring', 'summer', 'autumn', 'winter'] as const).map((k) => (
          <SeasonFx key={k} season={k} visible={season === k ? 1 : 0} parts={PARTS} />
        ))}
      </div>

      <div className="relative mx-auto flex w-full max-w-[460px] flex-1 flex-col px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]">
        <div className="flex items-center justify-between">
          <span style={{ font: `500 11px/1 ${MONO}`, letterSpacing: '.14em', color: ACCENT, textTransform: 'uppercase' }}>Tus fechas</span>
          <button
            type="button"
            onClick={close}
            aria-label="Cerrar el calendario"
            className="flex h-10 w-10 items-center justify-center rounded-full"
            style={{ border: '1px solid rgba(28,34,48,.12)', background: 'rgba(255,255,255,.7)', color: INK, cursor: 'pointer', font: "400 18px 'Geist'" }}
          >
            ✕
          </button>
        </div>
        <span id="dates-calendar-title" className="sr-only">
          Cambiar las fechas del viaje a {city}
        </span>
        <Title size={36}>
          ¿Cuándo estás en <Em>{city}</Em>?
        </Title>
        {/* (Tanda 6y7) El calendario va justo debajo del título, arriba; «Quitar fechas» debajo del calendario. El formulario (StepDates) sí lo deja abajo, junto a su «Continuar». */}
        <div style={{ height: 16 }} />
        <TrazoCalendar
          dateRange={dateRange}
          onSelect={(from, to) => {
            setStart(from)
            setDateError(null)
            save(from, to)
          }}
          onPreviewMonth={setPreviewMonth}
        />
        {dateError && <p style={{ margin: '8px 4px 0', font: "400 13px 'Geist'", color: '#B3261E' }}>{dateError}</p>}
        <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
          {dateRange ? (
            <GhostButton onClick={clear} style={{ flex: 1 }}>
              Quitar fechas
            </GhostButton>
          ) : (
            <GhostButton onClick={close} style={{ flex: 1 }}>
              Cerrar
            </GhostButton>
          )}
        </div>
      </div>
    </div>
  )
}
