import { useState } from 'react'
import type { Stop } from '../../../lib/types'
import { useRouteStore } from '../../../store/useRouteStore'
import { ConfirmDeleteButton } from '../../ui/ConfirmDeleteButton'
import { PlaceFinderPanel } from '../placeFinder/PlaceFinderPanel'

interface StopMenuProps {
  dayId: string
  city: string
  stop: Stop
  index: number
  /** Paradas reales del día YA sembradas (o listas para sembrarse) del pool de plantilla, en el mismo orden que se muestran — para "Mover antes/después" (reordenar) y "Mover a otro día" (encontrar el resto de paradas al sembrar). */
  realStops: Stop[]
  otherDays: { id: string; dayNumber: number; city: string }[]
}

type MenuView = 'menu' | 'remove' | 'move-day' | 'change-time'

const menuItemClass = 'w-full rounded-lg px-2 py-1.5 text-left text-small text-text hover:bg-bg-hover disabled:cursor-not-allowed disabled:opacity-40'

/**
 * Menú "..." por parada — Cambiar / Quitar / Mover a otro día / Mover antes / Mover después /
 * Cambiar hora, todo gratuito (sin restricción de plan). Cada acción "cristaliza" primero el pool
 * de plantilla del día en `Stop[]` reales vía `seedDayStops` (no-op si el día ya tiene paradas
 * reales) — necesario porque DIAS muestra contenido mock hasta la primera edición, ver
 * mockDayDetail.ts `resolveDisplayStops`. Los conectores se recalculan solos: derivan del ORDEN e
 * ÍNDICE de las paradas, así que cualquier acción que cambie el orden ya los actualiza sin lógica
 * extra.
 */
export function StopMenu({ dayId, city, stop, index, realStops, otherDays }: StopMenuProps) {
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<MenuView>('menu')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [time, setTime] = useState(stop.time)

  const seedDayStops = useRouteStore((state) => state.seedDayStops)
  const removeStop = useRouteStore((state) => state.removeStop)
  const reorderStops = useRouteStore((state) => state.reorderStops)
  const moveStopToDay = useRouteStore((state) => state.moveStopToDay)
  const updateStopTime = useRouteStore((state) => state.updateStopTime)
  const replaceStop = useRouteStore((state) => state.replaceStop)

  /** No-op si el día ya tiene paradas reales — `realStops` ya es esa misma lista en ese caso. */
  const ensureSeeded = () => seedDayStops(dayId, realStops)

  const close = () => {
    setOpen(false)
    setView('menu')
  }

  const handleReorder = (direction: 'before' | 'after') => {
    ensureSeeded()
    const ids = realStops.map((s) => s.id)
    const targetIndex = direction === 'before' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= ids.length) return
    ;[ids[index], ids[targetIndex]] = [ids[targetIndex], ids[index]]
    reorderStops(dayId, ids)
    close()
  }

  const handleMoveToDay = (targetDayId: string) => {
    ensureSeeded()
    moveStopToDay(stop.id, dayId, targetDayId)
    close()
  }

  const handleSaveTime = () => {
    ensureSeeded()
    updateStopTime(dayId, stop.id, time)
    close()
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation()
          setOpen((value) => !value)
        }}
        title="Más opciones"
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border bg-bg-card text-text-muted shadow-sm hover:bg-bg-hover"
      >
        ⋯
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={(event) => (event.stopPropagation(), close())} />
          <div
            onClick={(event) => event.stopPropagation()}
            className="absolute right-0 top-7 z-30 w-60 rounded-xl border border-border bg-bg-card p-2 shadow-md"
          >
            {view === 'menu' && (
              <div className="space-y-0.5">
                <button type="button" onClick={() => setPickerOpen(true)} className={menuItemClass}>
                  🔄 Cambiar
                </button>
                <button type="button" onClick={() => setView('remove')} className={menuItemClass}>
                  ✕ Quitar
                </button>
                <button type="button" onClick={() => setView('move-day')} disabled={otherDays.length === 0} className={menuItemClass}>
                  📅 Mover a otro día
                </button>
                <button type="button" onClick={() => handleReorder('before')} disabled={index === 0} className={menuItemClass}>
                  ↑ Mover antes
                </button>
                <button type="button" onClick={() => handleReorder('after')} disabled={index === realStops.length - 1} className={menuItemClass}>
                  ↓ Mover después
                </button>
                <button type="button" onClick={() => setView('change-time')} className={menuItemClass}>
                  ⏱ Cambiar hora
                </button>
              </div>
            )}

            {view === 'remove' && (
              <div className="p-1">
                <ConfirmDeleteButton
                  itemLabel={`"${stop.name}"`}
                  onConfirm={() => {
                    ensureSeeded()
                    removeStop(dayId, stop.id)
                    close()
                  }}
                />
              </div>
            )}

            {view === 'move-day' && (
              <div className="space-y-1 p-1">
                <p className="px-1 text-caption font-semibold uppercase tracking-wide text-text-muted">Mover a</p>
                {otherDays.map((day) => (
                  <button key={day.id} type="button" onClick={() => handleMoveToDay(day.id)} className={menuItemClass}>
                    Día {day.dayNumber} — {day.city}
                  </button>
                ))}
              </div>
            )}

            {view === 'change-time' && (
              <div className="space-y-2 p-1">
                <input
                  type="time"
                  value={time}
                  onChange={(event) => setTime(event.target.value)}
                  className="w-full rounded-lg border border-border bg-bg px-2 py-1.5 text-small text-text"
                />
                <button
                  type="button"
                  onClick={handleSaveTime}
                  className="w-full rounded-lg bg-accent py-1.5 text-small font-medium text-white hover:bg-accent-hover"
                >
                  Guardar
                </button>
              </div>
            )}
          </div>
        </>
      )}

      <PlaceFinderPanel
        open={pickerOpen}
        city={city}
        excludeStopIds={realStops.map((s) => s.id)}
        onPick={(newStop) => {
          ensureSeeded()
          replaceStop(dayId, stop.id, newStop)
          setPickerOpen(false)
          close()
        }}
        onClose={() => setPickerOpen(false)}
      />
    </div>
  )
}
