import { useState } from 'react'
import { dateOfDay } from '../../../lib/bookings'
import { recomendarHora, useHorasEnRango } from '../../../lib/civitatis'
import { useMonedaViajero } from '../../../lib/moneda'
import { tripModes, useArrivalInfo } from '../../../lib/arrivalReturn'
import { esDiaDeExcursion, esDiaDeLlegada } from '../../../lib/tituloDelDia'
import { horaUtilDeBillete } from '../../../../shared/arrival/horaUtil.js'
import type { Reservation } from '../../../lib/bookings'
import { enlaceDeCompraDeEntrada, textoDelBotonDeEntrada } from '../../../lib/entradaEnlace'
import type { SinEntrada } from '../../../lib/destinationExcursions'
import { notaDeLlegadaSinHora } from '../../../lib/notaDeLlegada'
import { useRouteStore } from '../../../store/useRouteStore'
import { AddReservationSheet } from './AddReservationSheet'
import { useVerEntrada } from './useVerEntrada'
import { EntradaDeLaFicha } from './EntradaDeLaFicha'
import { openTicketShop } from './EntradaCard'
import { ReservedDetails } from './ReservedMarks'
import { EntradaDelGrupo, TuEntrada } from './CajasEntrada'
import { useStopEntradas } from './useStopEntradas'
import { FichaSinEntrada } from '../dayDetail/FichaPiezas'
import { diaDeLaReservaEnPalabras, horaCorta } from '../../../lib/reservasGrupo'
import { displayStopName } from '../../../lib/format'
import { frase } from '../../../lib/entradasDelGrupo'

/** La parada de la ruta con ese id (null si no está en ningún día). */
function useRouteStop(stopId: string | null | undefined) {
  return useRouteStore((state) => {
    if (!stopId || !state.route) return null
    for (const day of state.route.days) {
      const stop = day.stops.find((candidate) => candidate.id === stopId)
      if (stop) return { day, stop }
    }
    return null
  })
}

/** La reserva que fija esta parada (null si no está reservada). */
export function useStopReservation(stopId: string | null | undefined): Reservation | null {
  const found = useRouteStop(stopId)
  const reservedId = found?.stop.reservedId
  return useRouteStore((state) => (reservedId ? (state.reservations.find((reservation) => reservation.id === reservedId) ?? null) : null))
}

/**
 * El contenido de la pestaña «Entradas» de la ficha (Tanda 6n; diseño nuevo en la 6y4): todas las entradas de los datos para ese sitio, una debajo de otra (nombre, qué incluye, precio «desde» y
 * [Reservar], que abre la compra en otra pestaña con el aviso corto; nunca el nombre del proveedor). Debajo, «¿Ya la tienes? Añádela»; reservada, «✓ Tu entrada: 10:30» (la hora UNA sola vez) con
 * «Llega unos 30 minutos antes: …» (sin hora calculada; 15 en el Free Tour) y «Cambiar». «Añádela» solo sale si el sitio ya está en algún día del viaje (desde EXPLORAR o «+ Añadir parada» se ven y se reservan las
 * entradas, pero no se añaden). Un sitio sin entradas en los datos no pinta nada (y su pestaña no sale).
 * `sinEntrada` (Tanda 6y4): un sitio que no vende entrada pero cobra por acercarse (la tasa de la Fontana de Trevi) lleva «No necesitas entrada» con lo que diga el dato, y NO lleva [Reservar] ni «Añádela».
 */
export function StopEntradasTab({ stop, sinEntrada = null }: { stop: { id: string; name: string; isFreeTour?: boolean }; sinEntrada?: SinEntrada | null }) {
  useMonedaViajero() // (Tanda 10N8) el precio sale en la moneda del viajero y se repinta al cambiarla
  const route = useRouteStore((state) => state.route)
  const found = useRouteStop(stop.id)
  const data = useStopEntradas(stop)
  const [sheet, setSheet] = useState(false)
  // (V69, apartado 6) [Ver entrada]: abre el código (a pantalla completa, o el bloque que se desliza con varias personas); sin documento, «+ Subir tu entrada» (la hoja de la V64). Nunca un botón que no hace nada.
  const verEntrada = useVerEntrada({ route, reservation: data?.reservation ?? null, target: data?.target ?? null, cubiertaPorElDueno: data?.cubiertaPorElDueno ?? false })
  // Tanda 10N §8: la entrada del dueño vista por quien quiere ir con él: [Reservar la mía a la misma hora] (compra con su día y su hora) o [Ya la tengo].
  const [igualModo, setIgualModo] = useState<'comprar' | 'tengo' | null>(null)
  // La hora recomendada (API de consulta, solo encendida): se pide el calendario de los días del viaje al abrir la pestaña (sin la caché: las plazas, al día). Con la entrada ya reservada, no sale.
  const [apertura] = useState(() => String(Date.now()))
  const fechasDelViaje = route && route.answers.dateRange ? route.days.map((day) => dateOfDay(route, day)).filter((iso): iso is string => Boolean(iso)) : []
  const fechaDeLaParada = route && found ? dateOfDay(route, found.day) : null
  const lugarDeLaHora = stop.isFreeTour ? 'Free Tour' : stop.name
  const horasDelViaje = useHorasEnRango(lugarDeLaHora, fechasDelViaje[0] ?? null, fechasDelViaje[fechasDelViaje.length - 1] ?? null, route?.destination ?? '', data && !data.reservation && fechaDeLaParada ? apertura : null)
  // (V60) La hora recomendada nunca es anterior a cuando puede estar allí: el día de llegada, desde la hora útil del vuelo (la misma cuenta que HOY y la hoja de llegada); los demás, desde la hora a la que la ruta le lleva.
  // Se calcula aquí, al pintar, con lo que hay en la ruta: cambiar el vuelo o el orden del día la recalcula sola, sin pasar por Reorganizar. La alternativa sale solo de los días de ciudad (ni la vuelta ni la excursión).
  const infoLlegada = useArrivalInfo(route?.destination ?? '', found?.day.city, route?.origin)
  const diaDeLlegada = route ? route.days.find((day) => esDiaDeLlegada(route, day)) ?? null : null
  const fechaDeLlegada = route && diaDeLlegada ? dateOfDay(route, diaDeLlegada) : null
  const utilDeLlegada = route && route.arrivalFlightTime && tripModes(route).arrival === 'avion' ? (horaUtilDeBillete({ info: infoLlegada, medio: 'avion', puntoId: route.arrivalPointId ?? null, zona: route.accommodationZone ?? null, hora: route.arrivalFlightTime }) as { min: number } | null) : null
  const diasQueAdmiten = route && route.answers.dateRange ? route.days.filter((day) => !day.isReturnLeg && !esDiaDeExcursion(day)).map((day) => dateOfDay(route, day)).filter((iso): iso is string => Boolean(iso)) : []
  const paradasDelDia = found ? found.day.stops.filter((s) => !s.isArrival && !s.isBreak && !s.isFreeTime && !s.passThrough) : []
  const posicion = found ? paradasDelDia.findIndex((s) => s.id === found.stop.id) : -1
  const anterior = posicion > 0 ? paradasDelDia[posicion - 1] : null
  const recomendada = recomendarHora(horasDelViaje, fechaDeLaParada, found?.stop.time ?? null, diasQueAdmiten.length > 0 ? diasQueAdmiten : fechasDelViaje, { fechaLlegada: fechaDeLlegada, horaUtilMin: utilDeLlegada?.min ?? null, aterrizaHHMM: route?.arrivalFlightTime ?? null, despuesDe: anterior ? displayStopName(anterior.name) : null })
  if (sinEntrada) return <FichaSinEntrada bloque={sinEntrada} />
  if (!route || !data) return null
  const { reservation, delGrupo, cubiertaPorElDueno, compartido, nombreAdmin, laTienen, quienLaTiene } = data
  return (
    // `contents`: la pestaña la monta la ficha como una columna y lo tuyo (los dos recuadros de arriba) lleva `order-first`, así que sale ARRIBA DEL TODO, encima de cualquier otra cosa de la pestaña (Tanda 10N4).
    <div className="contents">
      {/* 03 · otro del grupo la tiene y tú no: azul oscuro con dorado. */}
      {compartido && delGrupo && (
        <div className="order-first">
          <EntradaDelGrupo quien={laTienen.length === 1 ? frase(laTienen[0].nombres) : quienLaTiene || nombreAdmin || 'El dueño'} plural={laTienen.length === 1 && laTienen[0].nombres.length > 1} cuando={laTienen.length === 1 ? `${laTienen[0].dia} · ${laTienen[0].hora}` : `${diaDeLaReservaEnPalabras(route, delGrupo)} · ${horaCorta(delGrupo.time)}`} texto={laTienen.length > 1 ? data.textoLaTienen : undefined} onReservar={() => setIgualModo('comprar')} onYaLaTengo={() => setIgualModo('tengo')} />
        </div>
      )}
      {/* (V23) Cada opción, cerrada y estrecha; al tocarla se abre con los detalles y un solo botón. El enlace es el de ESA actividad (el de la API, el de los datos) y solo si no hay ninguno, el buscador. */}
      {data.entradas.map((entrada) => (
        <EntradaDeLaFicha
          key={entrada.nombre}
          entrada={entrada}
          reservarTexto={textoDelBotonDeEntrada(enlaceDeCompraDeEntrada(entrada, route.destination), stop.isFreeTour ? 'Reservar Free Tour' : 'Ver horas y reservar')}
          recomendada={recomendada && horasDelViaje?.actividadId === entrada.civitatis?.id ? recomendada : null}
          onReservar={enlaceDeCompraDeEntrada(entrada, route.destination) ? () => openTicketShop(enlaceDeCompraDeEntrada(entrada, route.destination)?.url ?? null) : null}
        />
      ))}
      {reservation ? (
        // 04 · ya tienes la tuya: el recuadro VERDE, arriba del todo. (La nota de «llega antes» es de la entrada, que se pasa en el primer sitio de la reserva: el Foro, que va en la misma entrada que el Coliseo, lleva el ✓ y la hora, no esa línea.)
        <div className="order-first">
          <TuEntrada
            hora={horaCorta(reservation.time)}
            sitio={[displayStopName(stop.name), diaDeLaReservaEnPalabras(route, reservation)].filter(Boolean).join(' · ')}
            onCambiarHora={cubiertaPorElDueno ? null : () => setSheet(true)}
            onVerEntrada={verEntrada.texto ? verEntrada.alPulsar : null}
            textoVerEntrada={verEntrada.texto ?? undefined}
          >
            {verEntrada.nodos}
            {(() => {
              const nota = stop.isFreeTour || reservation.placeNames[0] === stop.name ? notaDeLlegadaSinHora(found?.stop.arrivalNote, found?.stop.arrivalMinutes) : null
              return nota ? <p className="relative text-[12.5px] leading-[1.45]" style={{ color: 'rgba(28,34,48,.7)' }}>{nota}</p> : null
            })()}
            {/* Lo que el viajero apuntó (punto de encuentro, n.º de reserva): sin repetir la hora. */}
            <ReservedDetails reservation={reservation} timeLabel={null} />
          </TuEntrada>
        </div>
      ) : (
        data.inTrip && !delGrupo && (
          <p className="text-center" style={{ font: "400 14px 'Geist'", color: 'rgba(28,34,48,.6)' }}>
            ¿Ya la tienes?{' '}
            <button type="button" onClick={() => setSheet(true)} className="zona-toque" style={{ fontWeight: 700, color: '#8A6A2C', textDecoration: 'underline', textUnderlineOffset: 3 }}>
              Añádela
            </button>
          </p>
        )
      )}
      {sheet && <AddReservationSheet route={route} target={data.target} onClose={() => setSheet(false)} />}
      {igualModo && delGrupo && <AddReservationSheet route={route} target={{ ...data.target, igualQue: { reserva: delGrupo, quien: quienLaTiene || nombreAdmin, modo: igualModo } }} onClose={() => setIgualModo(null)} />}
    </div>
  )
}
