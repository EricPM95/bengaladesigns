import type { Route } from './types'
import { dateOfDay, type Reservation } from './bookings'
import { lugarCon } from './articulos'
import { reservationOverlaps } from './reservationOverlaps'
import { tripModes } from './arrivalReturn'

/**
 * (V69, apartado 3; Design «Entrada Mueve Dias» A1a/A1b) «REVISA LAS HORAS»: al GUARDAR una reserva imposible, antes de meterla en la ruta. Función pura (sin red ni almacén): recibe la reserva que se va a guardar (con su día y su hora) y lo
 * que ya hay, y dice si hay algo que no puede ser:
 *   · A1a, la reserva cae ANTES de que aterrice el vuelo de llegada (el día de la llegada) o DESPUÉS de que salga el de vuelta (el día de la vuelta): «Tu vuelo aterriza a las 17:30 y tu Free Tour es a las 10:00 del mismo día.»
 *   · A1b, la reserva coincide con otra reserva del viajero (las mismas que ya avisa `reservationOverlaps` desde la campana): «Tu entrada del Coliseo (13:00) coincide con tu Free Tour (12:00 a 14:30).»
 * No es para Reorganizar: la hoja solo sale al guardar. «Guardarla igualmente» no se prohíbe (la app avisa, no prohíbe).
 */
export interface RevisionDeHoras {
  caso: 'vuelo' | 'reservas' | 'parada'
  texto: string
  /** El botón de la IZQUIERDA (dorado): lleva a lo OTRO (el vuelo; la otra reserva). */
  otro: { etiqueta: string } & ({ tipo: 'vuelo'; mitad: 'arrival' | 'departure' } | { tipo: 'reserva'; reserva: Reservation } | { tipo: 'dia'; dayId: string })
  /** El botón de la derecha (blanco): vuelve a la hoja para cambiar la reserva que se estaba guardando. */
  esta: string
}

const aMin = (hhmm: string | null | undefined): number | null => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(hhmm ?? '').trim())
  return m ? Number(m[1]) * 60 + Number(m[2]) : null
}
const aHora = (min: number): string => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`
const horaCorta = (hhmm: string): string => aHora(aMin(hhmm) ?? 0)

const esFreeTour = (r: Reservation) => r.refId === 'Free Tour'

/** «tu Free Tour», «tu entrada del Coliseo», «tu excursión a Pompeya». */
export function llamarLaReserva(r: Reservation): string {
  if (esFreeTour(r)) return 'tu Free Tour'
  if (r.kind === 'excursion') return `tu ${r.name.replace(/^Excursi[oó]n/, 'excursión')}`
  const corto = r.shortName?.trim()
  const sitio = corto ? `de ${corto}`.replace(/^de el /, 'del ') : lugarCon('de', r.placeNames[0] ?? r.name)
  return `tu entrada ${sitio}`
}
/** «el Free Tour», «la entrada», «la excursión»: lo que dicen los botones [Revisar …]. */
const quePalabra = (r: Reservation): string => (esFreeTour(r) ? 'el Free Tour' : r.kind === 'excursion' ? 'la excursión' : 'la entrada')
const conMayuscula = (t: string): string => t.charAt(0).toUpperCase() + t.slice(1)

export function revisarLasHoras(
  route: Route,
  reserva: Reservation,
  otras: Reservation[],
  /** Los minutos que dura la reserva que se guarda (para el A1b); sin dato, solo su hora. */
  opciones: { sinDia?: boolean } = {},
): RevisionDeHoras | null {
  if (reserva.fueraDeRuta || !reserva.dateIso || aMin(reserva.time) == null || opciones.sinDia) return null
  const hora = aMin(reserva.time) as number
  const modos = tripModes(route)
  const dias = route.days
  // A1a · el vuelo de llegada (el primer día) y el de vuelta (el día de la vuelta o, sin él, el último día).
  const primero = dias[0] ?? null
  const fechaLlegada = primero ? dateOfDay(route, primero) : null
  const llegada = aMin(route.arrivalFlightTime)
  if (fechaLlegada && reserva.dateIso === fechaLlegada && llegada != null && hora < llegada) {
    const medio = modos.arrival === 'avion'
    return {
      caso: 'vuelo',
      texto: `${medio ? `Tu vuelo aterriza a las ${aHora(llegada)}` : `Tu llegada es a las ${aHora(llegada)}`} y ${llamarLaReserva(reserva)} es a las ${aHora(hora)} del mismo día.`,
      otro: { tipo: 'vuelo', mitad: 'arrival', etiqueta: medio ? 'Revisar el vuelo' : 'Revisar el billete' },
      esta: `Revisar ${quePalabra(reserva)}`,
    }
  }
  const ultimo = dias.find((d) => d.isReturnLeg) ?? dias[dias.length - 1] ?? null
  const fechaVuelta = ultimo ? dateOfDay(route, ultimo) : null
  const salida = aMin(route.departureFlightTime)
  if (fechaVuelta && reserva.dateIso === fechaVuelta && salida != null && hora > salida) {
    const medio = modos.departure === 'avion'
    return {
      caso: 'vuelo',
      texto: `${medio ? `Tu vuelo de vuelta sale a las ${aHora(salida)}` : `Tu vuelta es a las ${aHora(salida)}`} y ${llamarLaReserva(reserva)} es a las ${aHora(hora)} del mismo día.`,
      otro: { tipo: 'vuelo', mitad: 'departure', etiqueta: medio ? 'Revisar el vuelo' : 'Revisar el billete' },
      esta: `Revisar ${quePalabra(reserva)}`,
    }
  }
  // A1b · coincide con otra reserva del viajero (las mismas que la campana avisa como «coinciden»).
  if (reserva.kind === 'entrada') {
    const todas = [...otras.filter((o) => !(o.kind === reserva.kind && o.refId === reserva.refId)), reserva]
    const choque = reservationOverlaps(route, todas).find((o) => o.kind === 'coinciden' && (o.first.id === reserva.id || o.second.id === reserva.id))
    if (choque) {
      const otra = choque.first.id === reserva.id ? choque.second : choque.first
      // La que dura un tramo largo (el Free Tour) enseña de cuándo a cuándo; la otra, solo su hora (como en el dibujo A1b).
      const rango = (r: Reservation) => {
        const inicio = aMin(r.time) as number
        return esFreeTour(r) ? `${horaCorta(r.time)} a ${aHora(inicio + 150)}` : horaCorta(r.time)
      }
      return {
        caso: 'reservas',
        texto: `${conMayuscula(llamarLaReserva(reserva))} (${rango(reserva)}) coincide con ${llamarLaReserva(otra)} (${rango(otra)}).`,
        otro: { tipo: 'reserva', reserva: otra, etiqueta: `Revisar ${esFreeTour(otra) ? 'el Free Tour' : esFreeTour(reserva) || otra.kind === 'excursion' ? quePalabra(otra) : 'la otra entrada'}` },
        esta: esFreeTour(otra) || esFreeTour(reserva) ? `Revisar ${quePalabra(reserva)}` : 'Revisar esta entrada',
      }
    }
  }
  return null
}
