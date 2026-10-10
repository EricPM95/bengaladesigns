import { useEffect, useState } from 'react'
import type { DayPlan, Stop } from '../../../lib/types'
import { parseTimeToMinutes } from '../../../lib/time'
import { hasRealCoordinates } from '../../../lib/distanceMock'
import { fetchHourlyRain, rainsInHours } from '../../../lib/rainForecast'
import { displayStopName } from '../../../lib/format'
import { useRouteStore } from '../../../store/useRouteStore'
import { Modal } from '../../ui/Modal'
import { Button } from '../../ui/Button'
import { Icono } from '../../ui/Icono'

interface RainAlertProps {
  day: DayPlan
  dateIso: string
  /** 'hoy': solo cuenta lo que falta por hacer; 'manana': la víspera, todo el día. */
  when: 'hoy' | 'manana'
}

/** Las horas (0-23) que ocupan las paradas, para mirar solo la lluvia de esas horas. */
function hoursOf(stops: Stop[]): number[] {
  const hours = new Set<number>()
  for (const stop of stops) {
    if (!/^\d{1,2}:\d{2}$/.test(stop.time ?? '')) continue
    const start = parseTimeToMinutes(stop.time)
    const end = start + Math.max(30, stop.durationMinutes || 60)
    for (let hour = Math.floor(start / 60); hour <= Math.floor((end - 1) / 60); hour++) if (hour >= 0 && hour <= 23) hours.add(hour)
  }
  return [...hours]
}

function PlanList({ title, names }: { title: string; names: string[] }) {
  if (names.length === 0) return null
  return (
    <div className="space-y-1">
      <p className="text-caption font-semibold uppercase tracking-wide text-text-muted">{title}</p>
      <ul className="space-y-0.5 text-small text-text">
        {names.map((name) => (
          <li key={name}>{name}</li>
        ))}
      </ul>
    </div>
  )
}

/**
 * Aviso de lluvia (Tanda 6, HOY): mira la previsión de Open-Meteo para las horas de las paradas que quedan; si hay lluvia en
 * una franja, lo dice y ofrece «Ver alternativa» (la línea «Si llueve» del día). NUNCA cambia el día solo: el viajero decide
 * («Usar esta alternativa») y puede volver al plan original.
 */
export function RainAlert({ day, dateIso, when }: RainAlertProps) {
  const applyRainPlan = useRouteStore((state) => state.applyRainPlan)
  const revertRainPlan = useRouteStore((state) => state.revertRainPlan)
  const [part, setPart] = useState<'manana' | 'tarde' | 'dia' | null>(null)
  const [open, setOpen] = useState(false)
  const note = day.rainPlan?.text ?? day.rainPlanB?.note ?? null

  const relevantStops = (when === 'hoy' ? day.stops.filter((stop) => !stop.checkedInAt) : day.stops).filter((stop) => !stop.isArrival && !stop.isBreak)
  const hoursKey = hoursOf(relevantStops).join(',')
  const at = day.stops.find((stop) => hasRealCoordinates(stop.coordinates))?.coordinates

  useEffect(() => {
    if (!note || !at) {
      setPart(null)
      return
    }
    let cancelled = false
    const hours = hoursKey ? hoursKey.split(',').map(Number) : []
    fetchHourlyRain(at, dateIso).then((rain) => {
      if (cancelled) return
      if (!rain || hours.length === 0) return setPart(null)
      const wet = hours.filter((hour) => rainsInHours(rain, [hour]))
      if (wet.length === 0) return setPart(null)
      setPart(wet.every((hour) => hour < 14) ? 'manana' : wet.every((hour) => hour >= 14) ? 'tarde' : 'dia')
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note, at?.lat, at?.lng, dateIso, hoursKey])

  // Ya aplicada: se queda el aviso con el camino de vuelta al plan original, llueva o no.
  const applied = Boolean(day.rainBackup)
  if (!note || (!part && !applied)) return null

  const when_ = part === 'manana' ? (when === 'hoy' ? 'esta mañana' : 'mañana por la mañana') : part === 'tarde' ? (when === 'hoy' ? 'esta tarde' : 'mañana por la tarde') : when === 'hoy' ? 'hoy' : 'mañana'
  const plan = day.rainPlan
  const canApply = Boolean(plan && (plan.remove.length > 0 || plan.add.length > 0))

  return (
    <div className="mx-4 rounded-2xl border border-accent/30 bg-accent-soft/40 p-4">
      <div className="flex items-start gap-2.5">
        <Icono nombre="lluvia" size={18} className="mt-0.5 shrink-0 text-text/60" />
        <div className="min-w-0 flex-1 space-y-2">
          {applied ? (
            <p className="text-small font-medium text-text">Estás usando la alternativa para la lluvia.</p>
          ) : (
            <p className="text-small font-medium text-text">Hay previsión de lluvia {when_}. Si llueve, aquí tienes una alternativa.</p>
          )}
          <div className="flex flex-wrap gap-2">
            {!applied && (
              <Button variant="secondary" onClick={() => setOpen(true)}>
                Ver alternativa
              </Button>
            )}
            {applied && (
              <Button variant="secondary" onClick={() => revertRainPlan(day.id)}>
                Volver al plan original
              </Button>
            )}
          </div>
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)}>
        <div className="space-y-4">
          <h2 className="font-display text-h2 font-semibold text-text">Si llueve</h2>
          <p className="text-small leading-relaxed text-text-soft">{note}</p>
          {plan && <PlanList title="Sale o se acorta" names={plan.remove.map(displayStopName)} />}
          {plan && <PlanList title="Entra" names={plan.add.map((stop) => displayStopName(stop.name))} />}
          <p className="text-caption text-text-muted">No cambiamos nada solos: tú decides.</p>
          <div className="flex flex-col gap-2">
            {canApply && (
              <Button
                onClick={() => {
                  applyRainPlan(day.id)
                  setOpen(false)
                }}
              >
                Usar esta alternativa
              </Button>
            )}
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Seguir con el plan original
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
