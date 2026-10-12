import { useEffect, useState } from 'react'

/**
 * El horario de un sitio en una fecha, para la rueda de la hora de una reserva (Tanda 6y9). ADAPTADOR FINO: hoy lo contesta el servidor
 * (`POST /api/reservation-hours` -> `horasDeEntrada` en server/engine/reservationPlan.js). Cuando el agente A deje `horarioDeLaFecha(sitio, fecha|mes)`
 * -> { abre, cierra, ultimaEntrada, tramo } y `turnosDeReserva(sitio, fecha)`, solo hay que hacer que `horasDeEntrada` del servidor las llame y
 * devuelva el mismo contrato de aquí (`HorarioDeEntrada`): la pantalla no cambia.
 *
 * Contrato: `ventanas` = tramos de entrada del día, cada uno de la apertura a la ÚLTIMA ENTRADA oficial (no al cierre) en el tramo de esa fecha
 * (sin fechas, el del mes que eligió el viajero); `turnos` = las horas de reserva que existen de verdad (si las hay, la rueda solo lleva esas);
 * `cerrado` = ese día no abre.
 */
export interface HorarioDeEntrada {
  cerrado: boolean
  ventanas: { desde: string; hasta: string }[]
  turnos?: string[] | null
}

/** El aviso de debajo de la rueda y de la hoja del Free Tour. */
export const AVISO_DISPONIBILIDAD = 'Recuerda revisar la disponibilidad antes de añadirlo a tu ruta.'

const asMin = (hhmm: string) => Number(hhmm.split(':')[0]) * 60 + Number(hhmm.split(':')[1])
const two = (n: number) => String(n).padStart(2, '0')

/** Las horas de la rueda: los turnos del sitio o, de la apertura a la última entrada, de 15 en 15 (sin datos, de 8:00 a 19:45). La hora de la reserva que ya hay siempre está. */
export function horasDeLaRueda(horario: HorarioDeEntrada | null, propia: string | null = null): string[] {
  const conPropia = (list: string[]) => (propia && !list.includes(propia) ? [...list, propia].sort((x, y) => asMin(x) - asMin(y)) : list)
  if (horario?.turnos && horario.turnos.length > 0) return conPropia(horario.turnos)
  const ventanas = horario && !horario.cerrado && horario.ventanas.length > 0 ? horario.ventanas : [{ desde: '08:00', hasta: '19:45' }]
  const out: string[] = []
  for (const ventana of ventanas) for (let m = Math.ceil(asMin(ventana.desde) / 15) * 15; m <= asMin(ventana.hasta); m += 15) out.push(`${two(Math.floor(m / 60))}:${two(m % 60)}`)
  return conPropia(out.length > 0 ? out : ['09:00'])
}

/** Pide al servidor el horario de ese sitio en esa fecha (o en el mes/estación del viaje si no hay fecha). `clave` null = no se pide nada. */
export function useHorarioDeEntrada(opts: { destination: string; place: string | null; dateIso: string | null; month: number | null; season: string | null }, clave: string | null): HorarioDeEntrada | null {
  const [horario, setHorario] = useState<HorarioDeEntrada | null>(null)
  const { destination, place, dateIso, month, season } = opts
  useEffect(() => {
    if (!clave || !place) {
      setHorario(null)
      return
    }
    let cancelled = false
    fetch('/api/reservation-hours', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ destination, place, date_iso: dateIso, month, season }),
    })
      .then((response) => (response.ok ? (response.json() as Promise<HorarioDeEntrada>) : null))
      .then((body) => {
        if (!cancelled) setHorario(body)
      })
      .catch(() => {
        if (!cancelled) setHorario(null)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave])
  return horario
}
