import { lazy, Suspense, useState } from 'react'
import { useRouteStore } from '../../../store/useRouteStore'
import { useAnadirReservaStore } from '../../../store/useAnadirReservaStore'
import { useReservasFocusStore } from '../../../store/useReservasFocusStore'
import { useAlojamientoUi } from '../../../store/useAlojamientoUi'
import { quitarConDeshacer } from '../../../store/useAddFlowStore'
import { Hoja, BotonHoja, DosBotonesHoja } from '../../ui/Hoja'
import { BOTON_CLARO, DORADO } from '../../ui/botonesOro'
import { Icono } from '../../ui/Icono'
import type { NombreIcono } from '../../../lib/iconos'
import { buildDestinationSegments } from '../../../lib/destinationSegments'
import { adaptarDiasDeCoche } from '../../../lib/adaptarVuelos'
import { accionDeVuelo, CASILLAS_DE_ANADIR, esTipoExtra, type CasillaDeAnadir } from '../../../lib/reservasExtra'
import { ICONOS } from './BloqueReservas'
import { HojaReservaCoche } from './ReservaDelCoche'

/**
 * (V75; Design «Añadir una reserva» R1a, R2, R7a y R7b) «+ AÑADIR UNA RESERVA»: el botón ancho de borde dorado (el claro de siempre, `BOTON_CLARO`) justo debajo de «X de N reservas listas», y la hoja «Añade una reserva» con las nueve casillas.
 * LA HOJA SOLO REPARTE, no hay una segunda forma de guardar nada:
 *   · Vuelo, Alojamiento, Entrada, Excursión o tour y Coche de alquiler abren SU hoja de siempre (la del vuelo en «Llegada y vuelta», «Tu alojamiento», el buscador de la entrada, «¿Qué excursión tienes?», la hoja del coche) y se guardan donde siempre.
 *   · Tren, Autobús, Ferry y Otra abren la hoja nueva (`HojaReservaExtra`, carga perezosa) y crean su propio bloque en RESERVAS.
 * El vuelo, en un viaje de un solo destino, solo admite una ida y una vuelta: con la ida puesta abre directamente «Tu vuelo de vuelta»; con las dos, «Ya tienes tus vuelos. ¿Quieres cambiar alguno?» (R7a).
 * En un multidestino nada cambia: se abre su bloque de siempre (el primer destino).
 * El estado de la hoja abierta vive en `useAnadirReservaStore` (también `window.__anadirReserva` en desarrollo).
 */
const HojaReservaExtra = lazy(() => import('./HojaReservaExtra'))

/** El botón ancho «+ Añadir una reserva» (R1a). */
export function BotonAnadirUnaReserva() {
  const abrirMenu = useAnadirReservaStore((state) => state.abrirMenu)
  return (
    <button
      type="button"
      onClick={abrirMenu}
      data-anadir-una-reserva
      className="flex h-[54px] w-full items-center justify-center gap-1.5 rounded-[18px] text-[15.5px] font-bold"
      style={BOTON_CLARO}
    >
      <Icono nombre="anadir" size={16} />
      Añadir una reserva
    </button>
  )
}

/** El icono de cada casilla (los de los bloques de RESERVAS: `iconoDeMedio`, `ICONOS`; «Otra» lleva el «+»). */
const ICONO_DE_CASILLA: Record<CasillaDeAnadir, NombreIcono> = {
  vuelo: ICONOS.avion,
  tren: ICONOS.tren,
  bus: ICONOS.bus,
  ferry: ICONOS.ferry,
  coche: ICONOS.coche,
  aloj: ICONOS.hotel,
  entrada: ICONOS.ticket,
  excursion: ICONOS.excursion,
  otra: 'anadir',
}

function HojaAnade({ onElegir, onClose }: { onElegir: (casilla: CasillaDeAnadir) => void; onClose: () => void }) {
  return (
    <Hoja onCerrar={onClose} titulo="Añade una reserva" datos="anadir-reserva">
      <div className="flex flex-col gap-4" data-hoja-anade-reserva>
        <p className="m-0 text-[15px] leading-[1.45]" style={{ color: 'rgba(28,34,48,.7)' }}>
          Guarda aquí cualquier reserva de tu viaje: un tren entre ciudades, un ferry entre islas, un autobús, un tour…
        </p>
        <div className="grid grid-cols-3 gap-2.5" data-casillas-anadir>
          {CASILLAS_DE_ANADIR.map((casilla) => (
            <button
              key={casilla.id}
              type="button"
              onClick={() => onElegir(casilla.id)}
              data-casilla-anadir={casilla.id}
              className="flex min-h-[108px] flex-col items-center justify-center gap-2 rounded-[20px] px-1.5 py-3 text-center"
              style={{ background: '#FFFDF8', border: '1px solid rgba(181,138,46,.35)' }}
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full" style={{ background: DORADO, color: '#4A3510' }}>
                <Icono nombre={ICONO_DE_CASILLA[casilla.id]} size={22} />
              </span>
              <span className="text-[13.5px] font-bold leading-[1.15]" style={{ color: '#1C2230' }}>
                {casilla.nombre}
              </span>
            </button>
          ))}
        </div>
      </div>
    </Hoja>
  )
}

/** (R7a) «Ya tienes tus vuelos. ¿Quieres cambiar alguno?» con [Cambiar la ida] (dorado) y [Cambiar la vuelta] (blanco) lado a lado. */
function HojaYaTienesVuelos({ onMitad, onClose }: { onMitad: (mitad: 'arrival' | 'departure') => void; onClose: () => void }) {
  return (
    <Hoja onCerrar={onClose} titulo="Ya tienes tus vuelos. ¿Quieres cambiar alguno?" datos="ya-tienes-vuelos">
      <div className="flex flex-col gap-4" data-hoja-ya-tienes-vuelos>
        <p className="m-0 text-[14.5px] leading-[1.45]" style={{ color: 'rgba(28,34,48,.7)' }}>
          Un viaje de un solo destino solo lleva un vuelo de ida y uno de vuelta.
        </p>
        <DosBotonesHoja>
          <BotonHoja tipo="dorado" onClick={() => onMitad('arrival')} datos="cambiar-ida">
            Cambiar la ida
          </BotonHoja>
          <BotonHoja tipo="secundario" onClick={() => onMitad('departure')} datos="cambiar-vuelta">
            Cambiar la vuelta
          </BotonHoja>
        </DosBotonesHoja>
      </div>
    </Hoja>
  )
}

export function AnadirReservaHost({ idaHecha, vueltaHecha, unDestino, onVueloMulti }: { idaHecha: boolean; vueltaHecha: boolean; unDestino: boolean; /** Multidestino: se abre el primer destino (nada cambia). */ onVueloMulti: () => void }) {
  const abierta = useAnadirReservaStore((state) => state.abierta)
  const cerrar = useAnadirReservaStore((state) => state.cerrar)
  const [coche, setCoche] = useState(false)
  const route = useRouteStore((state) => state.route)
  const rentalBooking = useRouteStore((state) => state.rentalVehicleBooking)
  const setRentalVehicleBooking = useRouteStore((state) => state.setRentalVehicleBooking)
  const pedir = useReservasFocusStore((state) => state.pedir)
  const pedirHoja = useReservasFocusStore((state) => state.pedirHoja)
  const abrirTuAlojamiento = useAlojamientoUi((state) => state.abrirTuAlojamiento)
  if (!route) return null

  const alElegir = (casilla: CasillaDeAnadir) => {
    if (esTipoExtra(casilla)) {
      useAnadirReservaStore.getState().abrirFormulario(casilla)
      return
    }
    cerrar()
    if (casilla === 'vuelo') {
      const accion = accionDeVuelo({ unDestino, idaHecha, vueltaHecha })
      if (accion.tipo === 'abrir') pedir('llegada', accion.mitad)
      else if (accion.tipo === 'ya-tiene-los-dos') useAnadirReservaStore.getState().abrirVuelos()
      else onVueloMulti()
    } else if (casilla === 'aloj') {
      const tramos = buildDestinationSegments(route.days).filter((segment) => segment.nights > 0)
      const primero = tramos.find((segment) => !useRouteStore.getState().accommodationSelections[segment.dayIds[0]]) ?? tramos[0]
      if (primero) abrirTuAlojamiento(primero.dayIds[0])
      else pedir('aloj')
    } else if (casilla === 'entrada') {
      pedir('entradas')
      pedirHoja('entrada')
    } else if (casilla === 'excursion') {
      pedir('excursiones')
      pedirHoja('excursion')
    } else if (casilla === 'coche') {
      setCoche(true)
    }
  }

  return (
    <>
      {abierta?.hoja === 'menu' && <HojaAnade onElegir={alElegir} onClose={cerrar} />}
      {abierta?.hoja === 'vuelos' && (
        <HojaYaTienesVuelos
          onMitad={(mitad) => {
            cerrar()
            pedir('llegada', mitad)
          }}
          onClose={cerrar}
        />
      )}
      {abierta?.hoja === 'formulario' && (
        <Suspense fallback={null}>
          <HojaReservaExtra key={`${abierta.tipo}-${abierta.editar ?? 'nueva'}`} tipo={abierta.tipo} editar={abierta.editar} onClose={cerrar} />
        </Suspense>
      )}
      {coche && (
        // La hoja del coche de siempre: se guarda en `rentalVehicleBooking`, donde se guarda el alquiler (y, con otra hora, se rehacen los días como en el bloque del coche).
        <HojaReservaCoche
          reserva={rentalBooking}
          leidos={null}
          fechasDelViaje={{ start: route.answers.dateRange?.start ?? '', end: route.answers.dateRange?.end ?? '' }}
          onGuardar={(reserva) => {
            const cambiaLaHora = reserva.horaRecogida !== (rentalBooking?.horaRecogida ?? null) || reserva.horaDevolucion !== (rentalBooking?.horaDevolucion ?? null)
            setRentalVehicleBooking(reserva)
            setCoche(false)
            if (cambiaLaHora) void adaptarDiasDeCoche({ cambioDeCoche: true })
          }}
          onQuitar={
            rentalBooking
              ? () => {
                  setCoche(false)
                  quitarConDeshacer('Alquiler quitado del viaje', () => setRentalVehicleBooking(null))
                }
              : undefined
          }
          onClose={() => setCoche(false)}
        />
      )}
    </>
  )
}
