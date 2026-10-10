import { useEffect, useMemo, useState } from 'react'
import type { Route } from '../../../lib/types'
import { useRouteStore } from '../../../store/useRouteStore'
import { useAlojamientoUi } from '../../../store/useAlojamientoUi'
import { useReservasFocusStore } from '../../../store/useReservasFocusStore'
import { buildDestinationSegments } from '../../../lib/destinationSegments'
import { buildEntradasBloque, type BloqueEntrada } from '../../../lib/bookings'
import { useDestinationExcursions } from '../../../lib/destinationExcursions'
import { legsOf } from '../../../lib/reservasLegs'
import { useArrivalInfo } from '../../../lib/arrivalReturn'
import { pagoActivo } from '../../../lib/pago'
import { countryDisplayName } from '../../../lib/readiness'
import { ENLACE_ESIM, ENLACE_SEGURO } from '../../../lib/enlacesUtil'
import { addDaysToIso, formatShortDateEs } from '../../../lib/dateRange'
import { fetchDailyWeather, RAIN_PROBABILITY_THRESHOLD, type DiaDeTiempo } from '../../../lib/rainForecast'
import { hasRealCoordinates } from '../../../lib/distanceMock'
import { mesDelViaje } from '../../../lib/resumenViaje'
import { Icono } from '../../ui/Icono'
import type { NombreIcono } from '../../../lib/iconos'
import { alojamientoHecho } from '../reservas/AlojamientoReservas'
import { FichaEntrada } from '../reservas/FichaEntrada'
import { AZUL, CabeceraCaja, CajaBlanca, FilaHecha, FilaPorReservar, ojoMono, TarjetaOscura } from './piezas'

/** Cuándo sale la previsión del tiempo: faltando este número de días (o menos). */
const DIAS_DE_PREVISION = 5

/** Los días que faltan para el viaje (de la fecha de hoy a la del primer día); nunca negativo. */
export function diasHastaElViaje(startIso: string, hoyIso: string): number {
  const dia = 24 * 60 * 60 * 1000
  return Math.max(0, Math.round((new Date(`${startIso}T00:00:00`).getTime() - new Date(`${hoyIso}T00:00:00`).getTime()) / dia))
}

/** «El tiempo en Roma»: antes de los 5 días, solo la línea; desde 5 días antes, la previsión de cada día del viaje (si la hay). */
function ElTiempo({ route, dias, startIso }: { route: Route; dias: number | null; startIso: string | null }) {
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

  const conPrevision = toca && prevision && prevision.length > 0
  return (
    <div className="flex flex-none flex-col gap-2.5 rounded-[20px] p-3.5" style={{ background: 'oklch(0.95 0.025 230)', border: '1px solid oklch(0.56 0.1 230 / .2)' }}>
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl text-white" style={{ background: AZUL }}>
          <Icono nombre="lluvia" size={20} />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
          <span style={{ font: "400 19px/1.05 'Instrument Serif',serif", color: 'oklch(0.3 0.06 240)' }}>El tiempo en {route.destination}</span>
          {!conPrevision && <span className="text-[12px] leading-[1.35]" style={{ color: 'oklch(0.38 0.05 240)' }}>La previsión sale cuando falten {DIAS_DE_PREVISION} días.</span>}
        </span>
      </div>
      {conPrevision && (
        <div className="flex flex-col gap-1">
          {prevision.map((dia) => (
            <div key={dia.dateIso} className="flex items-center gap-2.5 rounded-xl bg-white/70 px-3 py-2 text-[13px]" style={{ color: 'oklch(0.3 0.06 240)' }}>
              <span className="w-[74px] flex-none font-medium">{formatShortDateEs(dia.dateIso).replace(',', '')}</span>
              <Icono nombre={(dia.lluvia ?? 0) >= RAIN_PROBABILITY_THRESHOLD ? 'lluvia' : 'hoy'} size={17} />
              <span className="flex-1" style={{ font: "500 12.5px 'Geist Mono',monospace" }}>
                {dia.maxima !== null ? `${Math.round(dia.maxima)}°` : '–'} / {dia.minima !== null ? `${Math.round(dia.minima)}°` : '–'}
              </span>
              {dia.lluvia !== null && dia.lluvia >= RAIN_PROBABILITY_THRESHOLD && <span className="text-[12px]">lluvia {Math.round(dia.lluvia)} %</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * HOY antes del viaje (Tanda 6z3, diseño «Antes del viaje»; gratis y de pago): con fechas, la tarjeta oscura con los días que faltan; sin fechas, «Tu viaje a Roma · octubre» y [Pon tus fechas]. Después, «Te falta por reservar»
 * (cada cosa con su [Reservar]: las entradas de «EN TU RUTA» sin reservar, el alojamiento y, de pago, la llegada y la vuelta), lo ya hecho en verde, «Útil para el viaje» (seguro y eSIM, con su «Ver») y «El tiempo en {destino}».
 */
export function HoyAntes({ route, startIso, hoyIso, onPonFechas }: { route: Route; startIso: string | null; hoyIso: string; onPonFechas: () => void }) {
  const pago = pagoActivo()
  const reservations = useRouteStore((state) => state.reservations)
  const selections = useRouteStore((state) => state.accommodationSelections)
  const setMode = useRouteStore((state) => state.setMode)
  const pedir = useReservasFocusStore((state) => state.pedir)
  const abrirMapa = useAlojamientoUi((state) => state.abrirMapa)
  const info = useDestinationExcursions(route.destination)
  const ciudad = route.days[0]?.city ?? route.destination
  const llegada = useArrivalInfo(route.destination, ciudad, route.origin)
  const [ficha, setFicha] = useState<BloqueEntrada | null>(null)
  const dias = startIso ? diasHastaElViaje(startIso, hoyIso) : null
  const mes = mesDelViaje(route)

  // Lo que falta y lo que ya está.
  const { enRuta } = buildEntradasBloque(route, info.entradasOrden, info.entradas, reservations)
  const entradasSinReservar = enRuta.filter((item) => !item.reservation)
  const entradasReservadas = enRuta.filter((item) => item.reservation)
  const primerTramo = buildDestinationSegments(route.days).find((segment) => segment.nights > 0)
  const hotel = primerTramo ? selections[primerTramo.dayIds[0]] : undefined
  const zona = info.zonasAlojamiento.find((candidata) => candidata.id === route.accommodationZone) ?? null
  const alojamientoListo = pago ? alojamientoHecho(zona?.id) : Boolean(hotel)
  const legs = legsOf(route, llegada)

  const pedirEnReservas = (bloque: 'llegada' | 'aloj') => {
    setMode('bookings')
    pedir(bloque)
  }
  const pendientes: { id: string; icono: NombreIcono; nombre: string; reservar: () => void }[] = [
    ...entradasSinReservar.map((item) => ({ id: `entrada-${item.name}`, icono: (item.isFreeTour ? 'free' : 'reservas') as NombreIcono, nombre: item.name, reservar: () => setFicha(item) })),
    ...(alojamientoListo ? [] : [{ id: 'alojamiento', icono: 'cama' as NombreIcono, nombre: pago && hotel ? `Alojamiento · ${hotel.name} · falta la zona` : 'Alojamiento', reservar: () => (pago && hotel ? pedirEnReservas('aloj') : abrirMapa()) }]),
    ...(pago && !legs.arrival.done ? [{ id: 'ida', icono: 'avion' as NombreIcono, nombre: 'Llegada', reservar: () => pedirEnReservas('llegada') }] : []),
    ...(pago && !legs.departure.done ? [{ id: 'vuelta', icono: 'avion' as NombreIcono, nombre: 'Vuelta', reservar: () => pedirEnReservas('llegada') }] : []),
  ]
  const hechas: string[] = [
    ...(alojamientoListo ? [['Alojamiento', hotel?.name, pago ? zona?.nombre : null].filter(Boolean).join(' · ')] : []),
    ...(pago && legs.arrival.done ? ['Llegada'] : []),
    ...(pago && legs.departure.done ? ['Vuelta'] : []),
    ...entradasReservadas.map((item) => item.name),
  ]
  const codigoPais = primerTramo?.countryCode ?? null

  return (
    <>
      {startIso && dias !== null ? (
        <TarjetaOscura>
          <span className="relative text-[#FFFDF8]/60" style={ojoMono}>
            Antes del viaje
          </span>
          <span className="relative mt-1.5 text-[#FFFDF8]/90" style={{ font: "400 22px/1.1 'Instrument Serif',serif" }}>
            Tu viaje a {route.destination} empieza en
          </span>
          <span className="relative flex items-baseline gap-2.5">
            <span style={{ font: "400 92px/.9 'Instrument Serif',serif" }}>{dias}</span>
            <em style={{ font: "italic 400 36px/1 'Instrument Serif',serif", color: 'oklch(0.78 0.11 15)' }}>{dias === 1 ? 'día' : 'días'}</em>
          </span>
          <div className="relative mt-3 flex gap-1" aria-hidden="true">
            {Array.from({ length: 12 }, (_, i) => (
              <span key={i} className="h-1 flex-1 rounded" style={{ background: i === Math.max(0, 12 - Math.min(dias, 12)) ? 'oklch(0.78 0.11 15)' : 'rgba(255,253,248,.16)' }} />
            ))}
          </div>
        </TarjetaOscura>
      ) : (
        <TarjetaOscura>
          <span className="relative text-[#FFFDF8]/60" style={ojoMono}>
            Antes del viaje
          </span>
          <span className="relative mt-1.5" style={{ font: "400 34px/1.05 'Instrument Serif',serif" }}>
            Tu viaje a <em style={{ color: 'oklch(0.78 0.11 15)' }}>{route.destination}</em>
            {mes ? ` · ${mes}` : ''}
          </span>
          <button type="button" onClick={onPonFechas} className="relative mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#FFFDF8] text-[14.5px] font-semibold text-[#1C2230]">
            <Icono nombre="dias" size={17} />
            Pon tus fechas
          </button>
        </TarjetaOscura>
      )}

      {(pendientes.length > 0 || hechas.length > 0) && (
        <CajaBlanca>
          <CabeceraCaja
            icono="reservas"
            titulo="Te falta por reservar"
            derecha={
              pendientes.length > 0 ? (
                <span className="h-6 rounded-full px-[9px] text-[11px] font-semibold leading-6" style={{ background: 'oklch(0.55 0.17 5 / .1)', color: 'oklch(0.5 0.17 5)' }}>
                  {pendientes.length} por reservar
                </span>
              ) : undefined
            }
          />
          {pendientes.map((pendiente) => (
            <FilaPorReservar key={pendiente.id} icono={pendiente.icono} nombre={pendiente.nombre} onReservar={pendiente.reservar} />
          ))}
          {pendientes.length === 0 && <span className="px-1 text-[13px] text-text/60">Todo reservado por ahora.</span>}
          {hechas.map((texto) => (
            <FilaHecha key={texto} texto={texto} />
          ))}
        </CajaBlanca>
      )}

      <div className="flex flex-none flex-col gap-2.5 pt-2">
        <span className="flex items-center gap-[7px] pl-1 text-text/55" style={{ ...ojoMono, letterSpacing: '.14em' }}>
          <Icono nombre="maleta" size={14} grosor={1.8} />
          Útil para el viaje
        </span>
        <div className="grid grid-cols-2 gap-2">
          {[
            { nombre: 'Seguro de viaje', icono: 'seguro' as NombreIcono, href: ENLACE_SEGURO },
            { nombre: codigoPais ? `eSIM para ${countryDisplayName(codigoPais)}` : 'eSIM', icono: 'esim' as NombreIcono, href: ENLACE_ESIM },
          ].map((tarjeta) => (
            <a key={tarjeta.nombre} href={tarjeta.href} target="_blank" rel="noopener noreferrer" className="flex h-[92px] flex-col justify-between rounded-[18px] bg-white px-3 py-[11px] text-left text-[#1C2230] no-underline" style={{ border: '1px solid rgba(28,34,48,.08)' }}>
              <span className="flex items-center justify-between">
                <span className="flex h-[30px] w-[30px] items-center justify-center rounded-[10px] bg-[#1C2230] text-[#FFFDF8]">
                  <Icono nombre={tarjeta.icono} size={16} />
                </span>
                <span className="underline underline-offset-[3px]" style={{ font: "italic 400 15px 'Instrument Serif',serif" }}>
                  Ver
                </span>
              </span>
              <span className="text-[13px] font-medium leading-tight">{tarjeta.nombre}</span>
            </a>
          ))}
        </div>
      </div>

      <ElTiempo route={route} dias={dias} startIso={startIso} />
      {ficha && <FichaEntrada route={route} item={ficha} onClose={() => setFicha(null)} />}
    </>
  )
}

