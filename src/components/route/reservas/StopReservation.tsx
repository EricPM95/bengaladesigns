import { useState } from 'react'
import { dateOfDay } from '../../../lib/bookings'
import { recomendarHora, useHorasEnRango } from '../../../lib/civitatis'
import { Icono } from '../../ui/Icono'
import { precioTiendaEnVista } from '../../../lib/moneda'
import { useMonedaViajero } from '../../../lib/moneda'
import type { Reservation } from '../../../lib/bookings'
import { buildActivitySearchUrl } from '../../../lib/affiliateLinks'
import type { SinEntrada } from '../../../lib/destinationExcursions'
import { notaDeLlegadaSinHora } from '../../../lib/notaDeLlegada'
import { useRouteStore } from '../../../store/useRouteStore'
import { AddReservationSheet } from './AddReservationSheet'
import { DatosDeLaActividad } from './DatosDeLaActividad'
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
  // Tanda 10N §8: la entrada del dueño vista por quien quiere ir con él: [Reservar la mía a la misma hora] (compra con su día y su hora) o [Ya la tengo].
  const [igualModo, setIgualModo] = useState<'comprar' | 'tengo' | null>(null)
  // La hora recomendada (API de consulta, solo encendida): se pide el calendario de los días del viaje al abrir la pestaña (sin la caché: las plazas, al día). Con la entrada ya reservada, no sale.
  const [apertura] = useState(() => String(Date.now()))
  const fechasDelViaje = route && route.answers.dateRange ? route.days.map((day) => dateOfDay(route, day)).filter((iso): iso is string => Boolean(iso)) : []
  const fechaDeLaParada = route && found ? dateOfDay(route, found.day) : null
  const lugarDeLaHora = stop.isFreeTour ? 'Free Tour' : stop.name
  const horasDelViaje = useHorasEnRango(lugarDeLaHora, fechasDelViaje[0] ?? null, fechasDelViaje[fechasDelViaje.length - 1] ?? null, route?.destination ?? '', data && !data.reservation && fechaDeLaParada ? apertura : null)
  const recomendada = recomendarHora(horasDelViaje, fechaDeLaParada, found?.stop.time ?? null, fechasDelViaje)
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
      {data.entradas.map((entrada) => (
        <div key={entrada.nombre} className="rounded-[20px] border border-text/[.07] bg-bg-card p-3.5">
          <div className="flex items-baseline justify-between gap-2.5">
            <p className="font-display text-[19px] leading-[1.1] text-text">{entrada.nombre}</p>
            {entrada.civitatis?.gratis ? <span className="font-display text-[22px] leading-none text-text">Gratis</span> : entrada.desde != null && <span className="font-display text-[22px] leading-none text-text">{`Desde ${precioTiendaEnVista(entrada.desde)}`}</span>}
          </div>
          {/* (Con la API de consulta encendida, los datos reales de la actividad; sin ella, la línea de siempre.) */}
          {entrada.civitatis ? <DatosDeLaActividad datos={entrada.civitatis} /> : entrada.incluye && <p className="mt-1.5 text-[13px] leading-[1.5] text-text/72">{entrada.incluye}</p>}
          {recomendada && horasDelViaje?.actividadId === entrada.civitatis?.id && (
            <p
              className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium ${recomendada.tipo === 'hora' ? 'bg-accent-green-soft text-accent-green' : 'bg-text/[.05] text-text-soft'}`}
              data-hora-recomendada={recomendada.tipo}
            >
              {recomendada.tipo === 'hora' && <Icono nombre="tips" size={13} />}
              {recomendada.texto}
            </p>
          )}
          <button
            type="button"
            onClick={() => openTicketShop(entrada.url ?? buildActivitySearchUrl(`${entrada.nombre} ${route.destination}`))}
            className="mt-3 h-11 w-full whitespace-nowrap rounded-full btn-champan text-small font-semibold active:scale-[.97]"
          >
            {stop.isFreeTour ? 'Reservar Free Tour' : 'Reservar'}
          </button>
        </div>
      ))}
      {reservation ? (
        // 04 · ya tienes la tuya: el recuadro VERDE, arriba del todo. (La nota de «llega antes» es de la entrada, que se pasa en el primer sitio de la reserva: el Foro, que va en la misma entrada que el Coliseo, lleva el ✓ y la hora, no esa línea.)
        <div className="order-first">
          <TuEntrada
            hora={horaCorta(reservation.time)}
            sitio={[displayStopName(stop.name), diaDeLaReservaEnPalabras(route, reservation)].filter(Boolean).join(' · ')}
            onCambiarHora={cubiertaPorElDueno ? null : () => setSheet(true)}
            // [Ver entrada]: queda puesto; lo que abre (la entrada guardada) es de la Tanda 10T (`Piezas/Ver Entrada`).
            onVerEntrada={() => undefined}
          >
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
          <p className="text-center text-small text-text-soft">
            ¿Ya la tienes?{' '}
            <button type="button" onClick={() => setSheet(true)} className="font-semibold text-text underline underline-offset-2">
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
