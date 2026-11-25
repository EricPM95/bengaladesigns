import { useEffect, useState } from 'react'
import { fetchHourlyRain, type HourlyRain } from '../lib/rainForecast'
import type { Coordinates } from '../lib/types'

/**
 * (V63 §7) La previsión por horas del día de hoy (lluvia y nubes), para no invitar a ver el atardecer con el cielo cubierto.
 * Se pide a NUESTRO servidor (/api/tiempo/horas) UNA vez por lugar y día (se guarda 3 h en memoria; el servidor, otro tanto); baja unos 24 números por serie (< 2 KB). Nada en bucle, nada en segundo plano.
 */
export function usePrevisionDeHoy(at: Coordinates | null | undefined, dateIso: string, activa: boolean): HourlyRain | null {
  const [prevision, setPrevision] = useState<HourlyRain | null>(null)
  const lat = at?.lat
  const lng = at?.lng
  useEffect(() => {
    if (!activa || lat == null || lng == null) return
    let cancelado = false
    fetchHourlyRain({ lat, lng }, dateIso).then((r) => { if (!cancelado) setPrevision(r) })
    return () => { cancelado = true }
  }, [activa, lat, lng, dateIso])
  return prevision
}
