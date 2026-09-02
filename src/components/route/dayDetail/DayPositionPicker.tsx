import { useState } from 'react'
import type { Route, Stop } from '../../../lib/types'
import { useRouteStore } from '../../../store/useRouteStore'
import { resolveDisplayStops, seedStopsFromTemplate } from '../../../lib/mockDayDetail'
import { Modal } from '../../ui/Modal'

interface DayPositionPickerProps {
  route: Route
  /** El `Stop` ya elegido (por el pool o el buscador) — este panel solo decide DÓNDE va, no QUÉ es. `null` = cerrado. */
  stop: Stop | null
  onClose: () => void
  onInserted: () => void
}

/**
 * "¿En qué día y en qué punto?" — usado por EXPLORAR (pestaña global, sin día ya fijado) tras
 * elegir una tarjeta. El "+" entre paradas de DIAS NO necesita este paso (ya sabe día+posición por
 * el conector en el que se pulsó) — ambos acaban en la misma acción de store, `insertStopAt`.
 */
export function DayPositionPicker({ route, stop, onClose, onInserted }: DayPositionPickerProps) {
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null)
  const insertStopAt = useRouteStore((state) => state.insertStopAt)
  const seedDayStops = useRouteStore((state) => state.seedDayStops)

  const selectedDay = selectedDayId ? (route.days.find((day) => day.id === selectedDayId) ?? null) : null
  const displayStops = selectedDay ? resolveDisplayStops(selectedDay) : []

  const handleClose = () => {
    setSelectedDayId(null)
    onClose()
  }

  const handleInsertAt = (index: number) => {
    if (!selectedDay || !stop) return
    if (selectedDay.stops.length === 0) seedDayStops(selectedDay.id, seedStopsFromTemplate(selectedDay))
    insertStopAt(selectedDay.id, index, stop)
    setSelectedDayId(null)
    onInserted()
  }

  return (
    <Modal open={stop !== null} onClose={handleClose}>
      <div className="space-y-4">
        <h2 className="font-display text-h2 font-semibold text-text">¿Dónde añadimos "{stop?.name}"?</h2>

        {!selectedDay ? (
          <div className="space-y-1.5">
            <p className="text-small text-text-soft">Elige el día</p>
            {route.days
              .filter((day) => !day.isReturnLeg)
              .map((day) => (
                <button
                  key={day.id}
                  type="button"
                  onClick={() => setSelectedDayId(day.id)}
                  className="block w-full rounded-lg border border-border px-3 py-2 text-left text-small text-text hover:bg-bg-hover"
                >
                  Día {day.dayNumber} — {day.city}
                </button>
              ))}
          </div>
        ) : (
          <div className="space-y-1.5">
            <button type="button" onClick={() => setSelectedDayId(null)} className="text-caption text-text-muted hover:text-text">
              ← Elegir otro día
            </button>
            <p className="text-small text-text-soft">Elige en qué punto del Día {selectedDay.dayNumber}</p>
            <button
              type="button"
              onClick={() => handleInsertAt(0)}
              className="block w-full rounded-lg border border-dashed border-border px-3 py-2 text-left text-small text-text-soft hover:bg-bg-hover"
            >
              Al principio del día
            </button>
            {displayStops.map((stopDetail, index) => (
              <button
                key={stopDetail.id}
                type="button"
                onClick={() => handleInsertAt(index + 1)}
                className="block w-full rounded-lg border border-dashed border-border px-3 py-2 text-left text-small text-text-soft hover:bg-bg-hover"
              >
                Después de "{stopDetail.name}"
              </button>
            ))}
          </div>
        )}
      </div>
    </Modal>
  )
}
