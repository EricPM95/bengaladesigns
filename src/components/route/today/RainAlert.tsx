import { useEffect, useState } from 'react'
import type { DayPlan, Stop } from '../../../lib/types'
import { parseTimeToMinutes } from '../../../lib/time'
import { hasRealCoordinates } from '../../../lib/distanceMock'
import { fetchHourlyRain, rainsInHours, type HourlyRain } from '../../../lib/rainForecast'
import { haParadoDeLlover } from '../../../lib/avisosDelTiempo'
import type { Propuesta } from '../../../lib/hoyCambiarPlan'
import { aplicarPropuesta, volverALaRutaOriginal } from '../../../lib/hoyCambiarPlanAplicar'
import { proponerSiLlueveRoma, proponerVolverAlPlan } from '../../../lib/hoyLluvia'
import { useRouteStore } from '../../../store/useRouteStore'
import { Icono } from '../../ui/Icono'
import { AvisoDeHoy, CruzDeAviso, useAvisoCerrado } from '../hoy/v2/AvisosHoy'
import { HojaPropuesta, useContexto } from '../hoy/v2/CambiarPlan'

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

/**
 * Aviso de lluvia (Tanda 6, HOY): mira la previsión de Open-Meteo para las horas de las paradas que quedan; si hay lluvia en
 * una franja, lo dice y ofrece «Ver alternativa» (la línea «Si llueve» del día). NUNCA cambia el día solo: el viajero decide
 * («Usar esta alternativa») y puede volver al plan original.
 */
export function RainAlert({ day, dateIso, when }: RainAlertProps) {
  const route = useRouteStore((state) => state.route)
  const [part, setPart] = useState<'manana' | 'tarde' | 'dia' | null>(null)
  const [rain, setRain] = useState<HourlyRain | null>(null)
  // (HOY2, C) [Ver alternativa] abre «Plan de lluvia» con el formato común de las propuestas (Cambia… / Se mantiene… / [Aplicar] / [Ver otra opción] / «Volver a mi ruta original»); al parar de llover, «¿Volvemos al plan?».
  const [hoja, setHoja] = useState<'plan' | 'vuelta' | null>(null)
  const [propuestas, setPropuestas] = useState<Propuesta[]>([])
  const [indice, setIndice] = useState(0)
  const ctx = useContexto(route as NonNullable<typeof route>, false)
  // (HOY2) La X: el aviso cerrado no vuelve ese día (salvo si se usa la alternativa: entonces sale «Volver al plan original»).
  const [cerrado, cerrar] = useAvisoCerrado(`${day.id}:${dateIso}`, `lluvia-${when}`)
  const [cerradoParo, cerrarParo] = useAvisoCerrado(`${day.id}:${dateIso}`, `lluvia-paro-${when}`)
  // (HOY1, apartado 6) En Lanzarote la lluvia la cuentan los avisos del tiempo en directo (AvisosDelTiempo), no este aviso: así no salen dos.
  const enLanzarote = (route?.destination ?? '').toLowerCase().includes('lanzarote')
  const note = enLanzarote ? null : (day.rainPlan?.text ?? day.rainPlanB?.note ?? null)

  const relevantStops = (when === 'hoy' ? day.stops.filter((stop) => !stop.checkedInAt && !stop.saltada) : day.stops).filter((stop) => !stop.isArrival && !stop.isBreak)
  const hoursKey = hoursOf(relevantStops).join(',')
  const at = day.stops.find((stop) => hasRealCoordinates(stop.coordinates))?.coordinates

  useEffect(() => {
    if (!note || !at) {
      setPart(null)
      return
    }
    let cancelled = false
    const hours = hoursKey ? hoursKey.split(',').map(Number) : []
    fetchHourlyRain(at, dateIso).then((lluvia) => {
      if (cancelled) return
      setRain(lluvia)
      if (!lluvia || hours.length === 0) return setPart(null)
      const wet = hours.filter((hour) => rainsInHours(lluvia, [hour]))
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
  if (!route || !note || (!part && !applied)) return null
  if (cerrado && !applied) return null
  const paro = applied && rain != null && haParadoDeLlover(rain, new Date().getHours())
  if (applied && paro && cerradoParo) return null

  const when_ = part === 'manana' ? (when === 'hoy' ? 'esta mañana' : 'mañana por la mañana') : part === 'tarde' ? (when === 'hoy' ? 'esta tarde' : 'mañana por la tarde') : when === 'hoy' ? 'hoy' : 'mañana'
  const canApply = Boolean(day.rainPlan && (day.rainPlan.remove.length > 0 || day.rainPlan.add.length > 0))
  const abrir = (cual: 'plan' | 'vuelta') => {
    setPropuestas(cual === 'plan' ? proponerSiLlueveRoma({ day, ctx }) : proponerVolverAlPlan({ day, ctx }))
    setIndice(0)
    setHoja(cual)
  }

  return (
    <AvisoDeHoy id="tiempo:lluvia" prio={2}>
      <div data-aviso-lluvia data-aviso-lluvia-estado={applied ? (paro ? 'paro' : 'usando') : 'aviso'} className="flex flex-none flex-col gap-1 rounded-[18px] py-2 pl-3.5 pr-2" style={{ background: '#E7EEF6', border: '1px solid rgba(28,34,48,.1)' }}>
        <div className="flex items-start gap-2.5">
          <span className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-full" style={{ background: '#FFFDF8' }}>
            <Icono nombre="lluvia" size={18} className="shrink-0 text-text/60" />
          </span>
          <span className="min-w-0 flex-1 pt-1 text-[13.5px] font-medium leading-[1.35]">
            {applied ? (paro ? 'Ha parado de llover.' : 'Estás usando la alternativa para la lluvia.') : `Hay previsión de lluvia ${when_}. Si llueve, aquí tienes una alternativa.`}
          </span>
          {(!applied || paro) && <CruzDeAviso onClick={applied ? cerrarParo : cerrar} />}
        </div>
        {!applied && canApply && (
          <button type="button" data-ver-alternativa onClick={() => abrir('plan')} className="mb-1 ml-[48px] flex h-11 flex-none items-center self-start rounded-full px-4 text-[12px] font-bold" style={{ background: '#1C2230', color: '#F3D88F' }}>
            Ver alternativa
          </button>
        )}
        {applied && (
          <button type="button" data-ver-plan onClick={() => abrir('vuelta')} className="mb-1 ml-[48px] flex h-11 flex-none items-center self-start rounded-full px-4 text-[12px] font-bold" style={{ background: '#1C2230', color: '#F3D88F' }}>
            {paro ? 'Ver plan' : 'Volver al plan original'}
          </button>
        )}
      </div>
      {hoja && (
        <HojaPropuesta
          titulo={hoja === 'plan' ? 'Plan de lluvia' : '¿Volvemos al plan?'}
          propuestas={propuestas}
          indice={indice}
          vacio="No hay nada que cambiar: tu día sigue igual."
          onOtra={() => setIndice((i) => (i + 1) % propuestas.length)}
          onAplicar={(pr) => {
            aplicarPropuesta(route.id, dateIso, pr)
            setHoja(null)
          }}
          onOriginal={() => {
            volverALaRutaOriginal()
            setHoja(null)
          }}
          onCerrar={() => setHoja(null)}
        />
      )}
    </AvisoDeHoy>
  )
}
