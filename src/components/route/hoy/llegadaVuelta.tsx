import { useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import type { DayPlan, Route } from '../../../lib/types'
import { medioOf, puntoDeLaMitad, tripModes, useArrivalInfo, type ArrivalMode, type ArrivalPoint } from '../../../lib/arrivalReturn'
import { billeteDe, type DatosBillete } from '../../../lib/billete'
import { direccionDelAlojamiento } from '../../../lib/direccionAlojamiento'
import { destinoDelPunto, tituloDeLlegada, tituloDeVuelta } from '../../../lib/llegadaVueltaHoy'
import { buildGoogleMapsUrlToPlaceTransit } from '../../../lib/mapsLinks'
import { pagoActivo } from '../../../lib/pago'
import { useRouteStore } from '../../../store/useRouteStore'
import { useReservasFocusStore } from '../../../store/useReservasFocusStore'
import { BilleteDeVuelo } from '../dayDetail/BilleteDeVuelo'
import { ArrivalReturnSheet } from '../dayDetail/ArrivalReturnSheet'
import { BotonComoLlegarAlojamiento } from '../alojamiento/BotonComoLlegarAlojamiento'
import { Icono } from '../../ui/Icono'
import { CajaBlanca, ojoMono } from './piezas'

/**
 * LA LLEGADA Y LA VUELTA EN HOY (Tanda 7, punto 15; solo de pago). Tres piezas y una hoja:
 *  - `TarjetaLlegadaHoy`: el día de llegada, ANTES de la primera parada, «Llegada a Fiumicino» con el billete (el mismo de DÍAS), que abre la ficha de llegada, y después [Cómo llegar a tu alojamiento] si hay dirección.
 *  - `TarjetaVueltaHoy`: el día de vuelta, DESPUÉS de la última parada, «Llegada al aeropuerto de Fiumicino» (o «a la estación de Termini», «al puerto de Civitavecchia») con [Cómo llegar] y, en pequeño, «Ver cómo ir», que abre la ficha de vuelta.
 *  - `BotonAlojamientoHoy`: al acabar cada día, [Cómo llegar a tu alojamiento] (la pieza compartida), solo con dirección.
 * Ninguna hora calculada: las únicas que se ven son las del viajero, dentro del billete. Nunca «sal a las…».
 */

export interface MitadDeHoy {
  mode: ArrivalMode
  point: ArrivalPoint | null
  billete: DatosBillete | null
  /** La hora del viajero (la de Roma). Sin ella no hay billete ni tarjeta. */
  hora: string | null
}

export interface FichasDeHoy {
  llegada: MitadDeHoy
  vuelta: MitadDeHoy
  abrir: (cual: 'llegada' | 'vuelta') => void
  /** La ficha de llegada y vuelta (la hoja de DÍAS), cerrada hasta que se abre. Se pinta una vez, al final de la pantalla. */
  hoja: ReactNode
}

/** Todo lo que HOY necesita de la llegada y de la vuelta: el billete de cada mitad, el punto elegido en RESERVAS y la ficha. Los mismos datos y las mismas reglas que el acordeón de DÍAS. */
export function useFichasDeHoy(route: Route, day: DayPlan, dateIso: string | null): FichasDeHoy {
  const info = useArrivalInfo(route.destination, day.city, route.origin)
  const setMode = useRouteStore((state) => state.setMode)
  const marcarVueltaVista = useRouteStore((state) => state.marcarVueltaVista)
  const pedirReservas = useReservasFocusStore((state) => state.pedir)
  const [abierta, setAbierta] = useState<'llegada' | 'vuelta' | null>(null)
  const modes = tripModes(route)
  const medioLlegada = medioOf(info, modes.arrival)
  const medioVuelta = medioOf(info, modes.departure)
  const horaLlegada = route.arrivalFlightTime || null
  const horaVuelta = route.departureFlightTime || null
  const puntoLlegada = puntoDeLaMitad(medioLlegada, route.arrivalPointId, Boolean(horaLlegada)).point
  const puntoVuelta = puntoDeLaMitad(medioVuelta, route.departurePointId, Boolean(horaVuelta)).point
  const llegada: MitadDeHoy = { mode: modes.arrival, point: puntoLlegada, hora: horaLlegada, billete: billeteDe({ route, kind: 'llegada', mode: modes.arrival, point: puntoLlegada }) }
  const vuelta: MitadDeHoy = { mode: modes.departure, point: puntoVuelta, hora: horaVuelta, billete: billeteDe({ route, kind: 'vuelta', mode: modes.departure, point: puntoVuelta }) }
  const abrir = (cual: 'llegada' | 'vuelta') => {
    if (cual === 'vuelta') marcarVueltaVista()
    setAbierta(cual)
  }
  const esVuelta = abierta === 'vuelta'
  const ficha = (
    <ArrivalReturnSheet
      open={abierta !== null}
      route={route}
      kind={abierta ?? 'llegada'}
      mode={esVuelta ? modes.departure : modes.arrival}
      info={info}
      medio={esVuelta ? medioVuelta : medioLlegada}
      origin={route.origin}
      dateIso={dateIso}
      time={esVuelta ? horaVuelta : horaLlegada}
      pointId={(esVuelta ? route.departurePointId : route.arrivalPointId) ?? null}
      onEditBooking={() => {
        setAbierta(null)
        setMode('bookings')
        pedirReservas('llegada', esVuelta ? 'departure' : 'arrival')
      }}
      onClose={() => setAbierta(null)}
    />
  )
  // La ficha va a pantalla completa, por encima de la cabecera y de la barra de abajo: fuera del contenedor de HOY (en el navegador, en el body; el servidor de las pruebas no tiene `document` y la pinta en su sitio).
  const hoja = typeof document === 'undefined' ? ficha : createPortal(ficha, document.body)
  return { llegada, vuelta, abrir, hoja }
}

/** [Cómo llegar a tu alojamiento]: la pieza compartida, con la dirección del viaje. Sin dirección, o en la gratis, no sale. */
export function BotonAlojamientoHoy({ route }: { route: Route }) {
  if (!pagoActivo()) return null
  return <BotonComoLlegarAlojamiento direccion={direccionDelAlojamiento(route)} />
}

/** El día de llegada, antes de la primera parada. Sin billete (sin la hora del viajero, o en coche) no sale. */
export function TarjetaLlegadaHoy({ route, mitad, onAbrir }: { route: Route; mitad: MitadDeHoy; onAbrir: () => void }) {
  if (!pagoActivo() || !mitad.billete || !mitad.point) return null
  const hayAlojamiento = direccionDelAlojamiento(route) !== null
  return (
    <CajaBlanca data-hoy-llegada="1">
      <span className="pl-1 text-text/55" style={{ ...ojoMono, letterSpacing: '.14em' }}>
        Tu llegada
      </span>
      <span className="pl-1" style={{ font: "400 26px/1.1 'Instrument Serif',serif", textWrap: 'balance' as never }}>
        {tituloDeLlegada(mitad.point)}
      </span>
      <BilleteDeVuelo billete={mitad.billete} onOpen={onAbrir} />
      {hayAlojamiento && <BotonAlojamientoHoy route={route} />}
    </CajaBlanca>
  )
}

/** El día de vuelta, después de la última parada: «Llegada al aeropuerto de Fiumicino» con [Cómo llegar] y «Ver cómo ir». */
export function TarjetaVueltaHoy({ route, mitad, onVerComoIr }: { route: Route; mitad: MitadDeHoy; onVerComoIr: () => void }) {
  if (!pagoActivo() || !mitad.point || !mitad.hora) return null
  const titulo = tituloDeVuelta(mitad.mode, mitad.point)
  if (!titulo) return null
  const enlace = buildGoogleMapsUrlToPlaceTransit(destinoDelPunto(mitad.mode, mitad.point, route.destination))
  return (
    <CajaBlanca data-hoy-vuelta="1">
      <span className="pl-1 text-text/55" style={{ ...ojoMono, letterSpacing: '.14em' }}>
        Tu vuelta
      </span>
      <span className="pl-1" style={{ font: "400 26px/1.1 'Instrument Serif',serif", textWrap: 'balance' as never }}>
        {titulo}
      </span>
      <a href={enlace} target="_blank" rel="noopener noreferrer" data-hoy-vuelta-como-llegar className="flex h-12 w-full items-center justify-center gap-[7px] rounded-full bg-[#1C2230] text-[14px] font-semibold text-[#FFFDF8] no-underline">
        <Icono nombre="explorar" size={16} grosor={1.8} />
        Cómo llegar
      </a>
      <button type="button" onClick={onVerComoIr} data-hoy-ver-como-ir className="-mt-0.5 flex h-9 items-center justify-center gap-1.5 self-center px-3 text-[12.5px] font-medium text-text/60 underline underline-offset-2">
        Ver cómo ir
      </button>
    </CajaBlanca>
  )
}
