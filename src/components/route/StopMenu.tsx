import { useState } from 'react'
import type { DayPlan, Stop } from '../../lib/types'
import { useRouteStore } from '../../store/useRouteStore'
import { TimeField } from '../ui/TimeField'
import { diaCorto } from '../../lib/nombreDeDia'
import { Icono } from '../ui/Icono'

interface StopMenuProps {
  stop: Stop
  dayId: string
  days: DayPlan[]
}

type MenuView = 'menu' | 'remove' | 'move' | 'time' | 'swap'

const menuItemClass = 'w-full rounded-lg px-2 py-1.5 text-left text-small text-text hover:bg-bg-hover'

export function StopMenu({ stop, dayId, days }: StopMenuProps) {
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<MenuView>('menu')
  const [time, setTime] = useState(stop.time)
  const [swapName, setSwapName] = useState('')

  const route = useRouteStore((state) => state.route)
  const removeStop = useRouteStore((state) => state.removeStop)
  const moveStopToDay = useRouteStore((state) => state.moveStopToDay)
  const updateStopTime = useRouteStore((state) => state.updateStopTime)
  const replaceStop = useRouteStore((state) => state.replaceStop)

  const close = () => {
    setOpen(false)
    setView('menu')
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="Más opciones"
        className="rounded-lg px-1 py-0.5 text-text-muted hover:bg-bg-hover"
      >
        ⋯
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={close} />
          <div className="absolute right-0 top-7 z-20 w-56 rounded-xl border border-border bg-bg-card p-2 shadow-md">
            {view === 'menu' && (
              <div className="space-y-0.5">
                <button type="button" onClick={() => setView('swap')} className={menuItemClass}>
                  <Icono nombre="reorg" size={15} className="mr-1.5 inline-block align-[-3px]" />Cambiar por otro sitio
                </button>
                <button type="button" onClick={() => setView('remove')} className={menuItemClass}>
                  <Icono nombre="cerrar" size={15} className="mr-1.5 inline-block align-[-3px]" />Quitar de la ruta
                </button>
                <button type="button" onClick={() => setView('move')} className={menuItemClass}>
                  ↕ Mover a otro día
                </button>
                <button type="button" onClick={() => setView('time')} className={menuItemClass}>
                  <Icono nombre="reloj" size={15} className="mr-1.5 inline-block align-[-3px]" />Cambiar hora
                </button>
              </div>
            )}

            {view === 'remove' && (
              <div className="space-y-2 p-1">
                <p className="text-small text-text">¿Quitar {stop.name} de tu ruta?</p>
                <div className="flex gap-2">
                  <button type="button" onClick={close} className="flex-1 rounded-lg bg-bg-hover py-1 text-small text-text">
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      removeStop(dayId, stop.id)
                      close()
                    }}
                    className="flex-1 rounded-lg bg-accent-warm/15 py-1 text-small font-medium text-accent-warm"
                  >
                    Quitar
                  </button>
                </div>
              </div>
            )}

            {view === 'move' && (
              <div className="space-y-1 p-1">
                <p className="px-1 text-caption font-semibold uppercase tracking-wide text-text-muted">Mover a</p>
                {days
                  .filter((day) => day.id !== dayId)
                  .map((day) => (
                    <button
                      key={day.id}
                      type="button"
                      onClick={() => {
                        moveStopToDay(stop.id, dayId, day.id)
                        close()
                      }}
                      className={menuItemClass}
                    >
                      {diaCorto(route, day.dayNumber)} — {day.title}
                    </button>
                  ))}
              </div>
            )}

            {view === 'swap' && (
              <div className="space-y-2 p-1">
                <p className="text-small text-text-soft">Reemplazar con otro lugar:</p>
                {/* Búsqueda libre por ahora. Aquí se conectará el autocompletado de Mapbox Geocoding. */}
                <input
                  value={swapName}
                  onChange={(event) => setSwapName(event.target.value)}
                  placeholder="Busca un lugar..."
                  autoFocus
                  autoComplete="off"
                  className="w-full rounded-lg border border-border bg-bg px-2 py-1.5 text-small text-text"
                />
                <button
                  type="button"
                  disabled={!swapName.trim()}
                  onClick={() => {
                    replaceStop(dayId, stop.id, { name: swapName.trim(), description: 'Añadido por ti', detail: undefined, ticketOptions: undefined })
                    setSwapName('')
                    close()
                  }}
                  className="w-full rounded-lg bg-accent py-1.5 text-small font-medium text-white hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Reemplazar
                </button>
              </div>
            )}

            {view === 'time' && (
              <div className="space-y-2 p-1">
                <TimeField value={time} onChange={setTime} title="Hora de la parada" className="flex h-9 w-full items-center justify-between rounded-lg border border-border bg-bg px-2 text-left text-small text-text" />
                <button
                  type="button"
                  onClick={() => {
                    updateStopTime(dayId, stop.id, time)
                    close()
                  }}
                  className="w-full rounded-lg bg-accent py-1.5 text-small font-medium text-white hover:bg-accent-hover"
                >
                  Guardar
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
