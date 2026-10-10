import { useEffect, useMemo, useState } from 'react'
import type { Route } from '../../../lib/types'
import { useRouteStore } from '../../../store/useRouteStore'
import { useFaltaPorReservar } from '../../../hooks/useFaltaPorReservar'
import { getTodayTripStatus } from '../../../lib/todayMode'
import { addDaysToIso, formatShortDateEs, todayIso } from '../../../lib/dateRange'
import { fetchDailyWeather, RAIN_PROBABILITY_THRESHOLD, type DiaDeTiempo } from '../../../lib/rainForecast'
import { hasRealCoordinates } from '../../../lib/distanceMock'
import { mesDelViaje } from '../../../lib/resumenViaje'
import { diaCorto } from '../../../lib/nombreDeDia'
import { Icono } from '../../ui/Icono'
import { ojoMono, TarjetaOscura } from '../hoy/piezas'

/** Cuándo sale la previsión del tiempo: faltando este número de días (o menos). */
const DIAS_DE_PREVISION = 5

/** Los días que faltan para el viaje (de la fecha de hoy a la del primer día); nunca negativo. */
export function diasHastaElViaje(startIso: string, hoyIso: string): number {
  const dia = 24 * 60 * 60 * 1000
  return Math.max(0, Math.round((new Date(`${startIso}T00:00:00`).getTime() - new Date(`${hoyIso}T00:00:00`).getTime()) / dia))
}

/** La previsión de cada día del viaje, desde 5 días antes de que empiece, si la hay. Antes de eso (o sin datos), nada. */
function usePrevisionDelViaje(route: Route, dias: number | null, startIso: string | null): DiaDeTiempo[] | null {
  const [prevision, setPrevision] = useState<DiaDeTiempo[] | null>(null)
  const punto = useMemo(() => route.days.flatMap((day) => day.stops).find((stop) => hasRealCoordinates(stop.coordinates))?.coordinates ?? null, [route])
  const toca = dias !== null && dias <= DIAS_DE_PREVISION && startIso !== null && punto !== null
  const fin = startIso ? addDaysToIso(startIso, Math.max(0, route.days.filter((day) => !day.isReturnLeg).length - 1)) : null
  useEffect(() => {
    if (!toca || !startIso || !fin || !punto) return
    let vivo = true
    void fetchDailyWeather(punto, startIso, fin).then((datos) => vivo && setPrevision(datos))
    return () => {
      vivo = false
    }
  }, [toca, startIso, fin, punto])
  return toca && prevision && prevision.length > 0 ? prevision : null
}

/** «Te faltan 3 cosas por reservar» o, si no falta nada, «Lo tienes todo listo ✓» en verde. */
export function textoDeLoQueFalta(faltan: number): string {
  if (faltan <= 0) return 'Lo tienes todo listo ✓'
  return faltan === 1 ? 'Te falta 1 cosa por reservar' : `Te faltan ${faltan} cosas por reservar`
}

/**
 * LA TARJETA DE ARRIBA DE RESERVAS (Tanda 6z6, decidido por Eric el 10-oct-2026; gratis y de pago). Sustituye a la cuenta atrás que estaba en HOY. Una tarjeta oscura que cambia con el momento del viaje:
 *  - antes, con fechas: «Tu viaje a Roma empieza en» y «12 días»; sin fechas: «Tu viaje a Roma · octubre» y [Pon tus fechas];
 *  - durante: «Estás en Roma · lun 13 · 2 de 4» (con fechas el día se llama por su fecha, nunca «Día n»);
 *  - después: no sale.
 * Debajo, siempre, una línea: «Te faltan 3 cosas por reservar» (lo que sale como «Falta» en los bloques de abajo) o «Lo tienes todo listo ✓». La previsión del tiempo (desde 5 días antes) va dentro, en pequeño.
 */
export function TarjetaCuentaAtras({ route, onPonFechas }: { route: Route; onPonFechas: () => void }) {
  const simulada = useRouteStore((state) => state.dev_simulated_today_iso)
  const faltan = useFaltaPorReservar(route)
  const estado = getTodayTripStatus(route, simulada ?? undefined)
  const hoyIso = simulada ?? todayIso()
  const dias = estado?.phase === 'before' ? diasHastaElViaje(estado.startIso, hoyIso) : null
  const prevision = usePrevisionDelViaje(route, dias, estado?.phase === 'before' ? estado.startIso : null)
  if (estado?.phase === 'after') return null

  const mes = mesDelViaje(route)
  const total = route.days.filter((day) => !day.isReturnLeg).length
  const lineaDeFaltas = (
    <span className="relative mt-3 flex items-center gap-2 text-[13.5px] font-medium" data-faltan={faltan} style={{ color: faltan <= 0 ? 'oklch(0.82 0.1 150)' : 'rgba(255,253,248,.9)' }}>
      {faltan > 0 && <Icono nombre="reservas" size={15} className="flex-none" />}
      {textoDeLoQueFalta(faltan)}
    </span>
  )

  return (
    <TarjetaOscura>
      {estado?.phase === 'during' ? (
        <>
          <span className="relative text-[#FFFDF8]/60" style={ojoMono}>
            Durante el viaje
          </span>
          <span className="relative mt-1.5" style={{ font: "400 32px/1.05 'Instrument Serif',serif" }}>
            Estás en <em style={{ color: 'oklch(0.78 0.11 15)' }}>{estado.context.day.city || route.destination}</em>
          </span>
          <span className="relative text-[#FFFDF8]/80" style={{ font: "500 13px 'Geist Mono',monospace" }}>
            {diaCorto(route, estado.context.day.dayNumber)} · {Math.min(estado.context.day.dayNumber, total)} de {total}
          </span>
        </>
      ) : estado?.phase === 'before' && dias !== null ? (
        <>
          <span className="relative text-[#FFFDF8]/60" style={ojoMono}>
            Antes del viaje
          </span>
          <span className="relative mt-1.5 text-[#FFFDF8]/90" style={{ font: "400 22px/1.1 'Instrument Serif',serif" }}>
            Tu viaje a {route.destination} empieza en
          </span>
          <span className="relative flex items-baseline gap-2.5">
            <span style={{ font: "400 72px/.95 'Instrument Serif',serif" }}>{dias}</span>
            <em style={{ font: "italic 400 32px/1 'Instrument Serif',serif", color: 'oklch(0.78 0.11 15)' }}>{dias === 1 ? 'día' : 'días'}</em>
          </span>
        </>
      ) : (
        <>
          <span className="relative text-[#FFFDF8]/60" style={ojoMono}>
            Antes del viaje
          </span>
          <span className="relative mt-1.5" style={{ font: "400 30px/1.05 'Instrument Serif',serif" }}>
            Tu viaje a <em style={{ color: 'oklch(0.78 0.11 15)' }}>{route.destination}</em>
            {mes ? ` · ${mes}` : ''}
          </span>
          <button type="button" onClick={onPonFechas} className="relative mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#FFFDF8] text-[14.5px] font-semibold text-[#1C2230]">
            <Icono nombre="dias" size={17} />
            Pon tus fechas
          </button>
        </>
      )}
      {lineaDeFaltas}
      {prevision && (
        <div className="relative mt-3 flex flex-col gap-1 border-t border-[#FFFDF8]/12 pt-2.5" data-prevision="1">
          <span className="text-[#FFFDF8]/55" style={ojoMono}>
            El tiempo en {route.destination}
          </span>
          {prevision.map((dia) => (
            <div key={dia.dateIso} className="flex items-center gap-2.5 text-[12px] text-[#FFFDF8]/85">
              <span className="w-[70px] flex-none">{formatShortDateEs(dia.dateIso).replace(',', '')}</span>
              <Icono nombre={(dia.lluvia ?? 0) >= RAIN_PROBABILITY_THRESHOLD ? 'lluvia' : 'hoy'} size={14} />
              <span className="flex-1" style={{ font: "500 11.5px 'Geist Mono',monospace" }}>
                {dia.maxima !== null ? `${Math.round(dia.maxima)}°` : '–'} / {dia.minima !== null ? `${Math.round(dia.minima)}°` : '–'}
              </span>
              {dia.lluvia !== null && dia.lluvia >= RAIN_PROBABILITY_THRESHOLD && <span>lluvia {Math.round(dia.lluvia)} %</span>}
            </div>
          ))}
        </div>
      )}
    </TarjetaOscura>
  )
}
