import { useState } from 'react'
import type { Stop } from '../../../lib/types'
import { useRouteStore } from '../../../store/useRouteStore'
import { ConfirmDeleteButton } from '../../ui/ConfirmDeleteButton'
import { PlaceFinderPanel } from '../placeFinder/PlaceFinderPanel'
import { withUndo } from '../../../store/useAddFlowStore'
import { hasOwnTime } from '../../../lib/freeDays'
import { RemoveReservationDialog } from '../reservas/ReservedMarks'
import { TimeField } from '../../ui/TimeField'

interface StopMenuProps {
  dayId: string
  city: string
  stop: Stop
  index: number
  /** Paradas reales del día YA sembradas (o listas para sembrarse) del pool de plantilla, en el mismo orden que se muestran — para "Mover antes/después" (reordenar) y "Mover a otro día" (encontrar el resto de paradas al sembrar). */
  realStops: Stop[]
  otherDays: { id: string; dayNumber: number; city: string }[]
  /** Día libre (decisión del usuario, 2026-09-28): Poner / Cambiar / Quitar hora, Mover a otro día, Subir, Bajar y Quitar del día, con "Deshacer". */
  freeDay?: boolean
}

type MenuView = 'menu' | 'remove' | 'move-day' | 'change-time'

/** Menú oscuro del diseño "Trazo Itinerario". */
const menuItemClass = 'flex h-[42px] w-full items-center rounded-[10px] px-3 text-left text-[14px] font-medium text-[#F3EEE4] hover:bg-[#F3EEE4]/[.08] disabled:cursor-not-allowed disabled:opacity-40'
/** Lista de días de "Mover a…", dentro de la cajita clara. */
const lightItemClass = 'w-full rounded-lg px-2 py-1.5 text-left text-small text-text hover:bg-bg-hover disabled:cursor-not-allowed disabled:opacity-40'

/**
 * Menú "..." por parada — Cambiar / Quitar / Mover a otro día / Mover antes / Mover después /
 * Cambiar hora, todo gratuito (sin restricción de plan). Cada acción "cristaliza" primero el pool
 * de plantilla del día en `Stop[]` reales vía `seedDayStops` (no-op si el día ya tiene paradas
 * reales) — necesario porque DIAS muestra contenido mock hasta la primera edición, ver
 * mockDayDetail.ts `resolveDisplayStops`. Los conectores se recalculan solos: derivan del ORDEN e
 * ÍNDICE de las paradas, así que cualquier acción que cambie el orden ya los actualiza sin lógica
 * extra.
 */
export function StopMenu({ dayId, city, stop, index, realStops, otherDays, freeDay = false }: StopMenuProps) {
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
  // Una parada reservada está fijada: solo se quita con «Quitar del viaje» (PARA_CODE_RESERVAS, 6).
  const removeReservation = useRouteStore((state) => state.removeReservation)
  const [removingReservation, setRemovingReservation] = useState(false)

  /** No-op si el día ya tiene paradas reales — `realStops` ya es esa misma lista en ese caso. */
  const ensureSeeded = () => seedDayStops(dayId, realStops)

  const close = () => {
    setOpen(false)
    setView('menu')
  }

  const undoable = (message: string, change: () => void) => (freeDay ? withUndo(message, change) : change())

  const handleReorder = (direction: 'before' | 'after') => {
    ensureSeeded()
    const ids = realStops.map((s) => s.id)
    const targetIndex = direction === 'before' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= ids.length) return
    ;[ids[index], ids[targetIndex]] = [ids[targetIndex], ids[index]]
    undoable(direction === 'before' ? `${stop.name}: sube` : `${stop.name}: baja`, () => reorderStops(dayId, ids))
    close()
  }

  const handleMoveToDay = (targetDayId: string) => {
    ensureSeeded()
    const target = otherDays.find((day) => day.id === targetDayId)
    undoable(`Movida al Día ${target?.dayNumber ?? ''}`, () => moveStopToDay(stop.id, dayId, targetDayId))
    close()
  }

  const handleSaveTime = () => {
    ensureSeeded()
    undoable(`${stop.name} a las ${time}`, () => updateStopTime(dayId, stop.id, time))
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
        aria-label="Opciones de la parada"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-text/[.14] bg-bg-card text-[12px] font-bold leading-none tracking-[1px] text-text/60 hover:bg-bg-hover"
      >
        ···
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={(event) => (event.stopPropagation(), close())} />
          <div
            onClick={(event) => event.stopPropagation()}
            className="absolute right-0 top-[34px] z-30 flex min-w-[190px] flex-col rounded-2xl bg-[#1C2230] p-1.5 text-[#F3EEE4] shadow-[0_18px_40px_-12px_rgba(28,34,48,.5)]"
          >
            {view === 'menu' && stop.reservedId && (
              <div className="space-y-0.5">
                <p className="px-3 pb-1 pt-1.5 text-[12px] text-[#F3EEE4]/60">Reservada · fijada</p>
                <button
                  type="button"
                  onClick={() => {
                    setRemovingReservation(true)
                    close()
                  }}
                  className={menuItemClass}
                >
                  <span className="text-[oklch(0.75_0.15_25)]">Quitar del viaje</span>
                </button>
              </div>
            )}

            {view === 'menu' && !stop.reservedId && freeDay && (
              <div className="space-y-0.5">
                {/* Día libre: la hora es solo la que pone el viajero (decisión del usuario, 2026-09-28). */}
                <button type="button" onClick={() => setView('change-time')} className={menuItemClass}>
                  {hasOwnTime(stop) ? 'Cambiar hora' : 'Poner hora'}
                </button>
                {hasOwnTime(stop) && (
                  <button
                    type="button"
                    onClick={() => {
                      undoable(`${stop.name}: sin hora`, () => updateStopTime(dayId, stop.id, ''))
                      close()
                    }}
                    className={menuItemClass}
                  >
                    Quitar hora
                  </button>
                )}
                <button type="button" onClick={() => setView('move-day')} disabled={otherDays.length === 0} className={menuItemClass}>
                  Mover a otro día
                </button>
                <button type="button" onClick={() => handleReorder('before')} disabled={index === 0} className={menuItemClass}>
                  Subir
                </button>
                <button type="button" onClick={() => handleReorder('after')} disabled={index === realStops.length - 1} className={menuItemClass}>
                  Bajar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    ensureSeeded()
                    undoable(`Quitada del día: ${stop.name}`, () => removeStop(dayId, stop.id))
                    close()
                  }}
                  className={menuItemClass}
                >
                  <span className="text-[oklch(0.75_0.15_25)]">Quitar del día</span>
                </button>
              </div>
            )}

            {view === 'menu' && !stop.reservedId && !freeDay && (
              <div className="space-y-0.5">
                <button type="button" onClick={() => setPickerOpen(true)} className={menuItemClass}>
                  Cambiar parada
                </button>
                <button type="button" onClick={() => setView('remove')} className={menuItemClass}>
                  <span className="text-[oklch(0.75_0.15_25)]">Quitar parada</span>
                </button>
                <button type="button" onClick={() => setView('move-day')} disabled={otherDays.length === 0} className={menuItemClass}>
                  Mover a otro día
                </button>
                <button type="button" onClick={() => handleReorder('before')} disabled={index === 0} className={menuItemClass}>
                  Mover antes
                </button>
                <button type="button" onClick={() => handleReorder('after')} disabled={index === realStops.length - 1} className={menuItemClass}>
                  Mover después
                </button>
                <button type="button" onClick={() => setView('change-time')} className={menuItemClass}>
                  Cambiar hora
                </button>
              </div>
            )}

            {view === 'remove' && (
              <div className="rounded-xl bg-bg-card p-1">
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
              <div className="space-y-1 rounded-xl bg-bg-card p-1">
                <p className="px-1 text-caption font-semibold uppercase tracking-wide text-text-muted">Mover a</p>
                {otherDays.map((day) => (
                  <button key={day.id} type="button" onClick={() => handleMoveToDay(day.id)} className={lightItemClass}>
                    Día {day.dayNumber} — {day.city}
                  </button>
                ))}
              </div>
            )}

            {view === 'change-time' && (
              <div className="space-y-2 rounded-xl bg-bg-card p-1">
                <TimeField value={time} onChange={setTime} title="Hora de la parada" className="flex h-9 w-full items-center justify-between rounded-lg border border-border bg-bg px-2 text-left text-small text-text" />
                <button
                  type="button"
                  disabled={!time}
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
      {removingReservation && stop.reservedId && (
        <RemoveReservationDialog
          name={stop.name}
          onCancel={() => setRemovingReservation(false)}
          onConfirm={() => {
            removeReservation(stop.reservedId as string)
            setRemovingReservation(false)
          }}
        />
      )}
    </div>
  )
}
