import { useEffect, useState } from 'react'
import type { DayPlan, Stop } from '../../../lib/types'
import { parseTimeToMinutes } from '../../../lib/time'
import { hasRealCoordinates } from '../../../lib/distanceMock'
import { fetchHourlyRain, rainsInHours, type HourlyRain } from '../../../lib/rainForecast'
import { haParadoDeLlover } from '../../../lib/avisosDelTiempo'
import type { Propuesta } from '../../../lib/hoyCambiarPlan'
import { aplicarPropuesta } from '../../../lib/hoyCambiarPlanAplicar'
import { proponerSiLlueveRoma, proponerVolverAlPlan } from '../../../lib/hoyLluvia'
import { useRouteStore } from '../../../store/useRouteStore'
import { AvisoDeHoy, D_AVISO, FilaDeAviso, useAvisoCerrado } from '../hoy/v2/AvisosHoy'
import { HojaPropuesta, useContexto } from '../hoy/v2/CambiarPlan'
import { useAhoraMin } from '../hoy/v2/ParadaHoy'

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
  const [part, setPart] = useState<'manana' | 'tarde' | 'noche' | 'dia' | null>(null)
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
  const ahoraMin = useAhoraMin()

  // (V43 §8) El aviso no sale si esa parte del día ya ha pasado: hoy solo cuentan las paradas que aún no han terminado.
  const sinTerminar = (stop: Stop) => !/^\d{1,2}:\d{2}$/.test(stop.time ?? '') || parseTimeToMinutes(stop.time) + Math.max(30, stop.durationMinutes || 60) > ahoraMin
  const relevantStops = (when === 'hoy' ? day.stops.filter((stop) => !stop.checkedInAt && !stop.saltada && sinTerminar(stop)) : day.stops).filter((stop) => !stop.isArrival && !stop.isBreak)
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
      // (V66, 16) mañana hasta las 13:00, tarde hasta las 20:00, después noche.
      setPart(wet.every((hour) => hour < 13) ? 'manana' : wet.every((hour) => hour >= 13 && hour < 20) ? 'tarde' : wet.every((hour) => hour >= 20) ? 'noche' : 'dia')
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

  const when_ = part === 'manana' ? (when === 'hoy' ? 'esta mañana' : 'mañana por la mañana') : part === 'tarde' ? (when === 'hoy' ? 'esta tarde' : 'mañana por la tarde') : part === 'noche' ? (when === 'hoy' ? 'esta noche' : 'mañana por la noche') : when === 'hoy' ? 'hoy' : 'mañana'
  const canApply = Boolean(day.rainPlan && (day.rainPlan.remove.length > 0 || day.rainPlan.add.length > 0))
  const abrir = (cual: 'plan' | 'vuelta') => {
    setPropuestas(cual === 'plan' ? proponerSiLlueveRoma({ day, ctx }) : proponerVolverAlPlan({ day, ctx }))
    setIndice(0)
    setHoja(cual)
  }

  return (
    <AvisoDeHoy id="tiempo:lluvia" prio={1.5}>
      {/* (V54; Design «Avisos Hoy Compactos» V1) La fila azul del tiempo: «Va a llover esta tarde · Tenemos un plan a cubierto» [Ver plan]. Solo si hay plan de verdad (si no, sin botón) y mientras «esta tarde» no haya pasado. */}
      <FilaDeAviso
        tono="azul"
        icono={D_AVISO.nube}
        titulo={applied ? (paro ? 'Ha parado de llover' : 'Estás usando el plan de lluvia') : `Va a llover ${when_}`}
        sub={applied ? undefined : canApply ? 'Tenemos un plan a cubierto' : 'Lleva paraguas o chubasquero'}
        boton={applied ? { texto: paro ? 'Ver plan' : 'Volver al plan', onClick: () => abrir('vuelta'), datos: { 'data-ver-plan': '1' } } : canApply ? { texto: 'Ver plan', onClick: () => abrir('plan'), datos: { 'data-ver-alternativa': '1' } } : undefined}
        onIrse={applied ? (paro ? cerrarParo : undefined) : cerrar}
        datos={{ 'data-aviso-lluvia': '1', 'data-aviso-lluvia-estado': applied ? (paro ? 'paro' : 'usando') : 'aviso' }}
      />
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
          onCerrar={() => setHoja(null)}
        />
      )}
    </AvisoDeHoy>
  )
}
