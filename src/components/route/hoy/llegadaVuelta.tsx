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
import { useAlojamientoDelViaje } from '../alojamiento/useAlojamientoDelViaje'
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

/**
 * [Cómo llegar a tu alojamiento] en HOY (Tanda 10N11 §3; solo con el pase y solo con dirección): una tarjeta con la zona y el nombre del hotel y, debajo, el botón compartido
 * (`BotonComoLlegarAlojamiento`, que abre el camino desde donde estás hasta la dirección). Sale al EMPEZAR el día (donde el viajero se levanta) y al ACABARLO (para volver a dormir).
 * `dentro`: sin la tarjeta (solo el botón), para ir dentro de otra caja (la llegada).
 */
export function BotonAlojamientoHoy({ route, dentro = false }: { route: Route; dentro?: boolean }) {
  const viaje = useAlojamientoDelViaje()
  if (!pagoActivo()) return null
  const direccion = direccionDelAlojamiento(route)
  if (!direccion) return null
  if (dentro) return <BotonComoLlegarAlojamiento direccion={direccion} />
  return (
    <div data-alojamiento-hoy className="flex flex-col gap-2.5 rounded-[22px] p-3" style={{ background: '#FFFDF8', border: '1px solid rgba(181,138,46,.4)', boxShadow: '0 10px 22px -16px rgba(60,40,10,.5)' }}>
      <div className="flex items-center gap-3">
        <span aria-hidden="true" style={{ width: 46, height: 46, flex: 'none', borderRadius: 14, background: 'radial-gradient(circle at 35% 28%,#FFFDF8,#F3E3B2 70%,#E3C77E)', boxShadow: '0 0 0 1.5px #B58A2E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6E5018" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 18V8M3 14h18v4M21 14v-2a3 3 0 0 0-3-3h-8v5" />
          </svg>
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
          <span style={{ font: "600 9.5px 'Geist Mono',monospace", letterSpacing: '.12em', color: '#6E5018', whiteSpace: 'nowrap' }}>{'TU ALOJAMIENTO · ' + (viaje.zonaNombre ?? viaje.ciudad).toUpperCase()}</span>
          <span className="truncate" style={{ font: "400 21px/1.05 'Instrument Serif',serif" }}>{viaje.nombre ?? direccion}</span>
          {viaje.nombre && <span className="truncate text-[12px] text-text/55">{direccion}</span>}
        </span>
      </div>
      <BotonComoLlegarAlojamiento direccion={direccion} />
    </div>
  )
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
      {hayAlojamiento && <BotonAlojamientoHoy route={route} dentro />}
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
      <a href={enlace} target="_blank" rel="noopener noreferrer" data-hoy-vuelta-como-llegar className="flex h-12 w-full items-center justify-center gap-[7px] rounded-full btn-champan text-[14px] font-semibold no-underline">
        <Icono nombre="explorar" size={16} grosor={1.8} />
        Cómo llegar
      </a>
      <button type="button" onClick={onVerComoIr} data-hoy-ver-como-ir className="-mt-0.5 flex h-9 items-center justify-center gap-1.5 self-center px-3 text-[12.5px] font-medium text-text/60 underline underline-offset-2">
        Ver cómo ir
      </button>
    </CajaBlanca>
  )
}
