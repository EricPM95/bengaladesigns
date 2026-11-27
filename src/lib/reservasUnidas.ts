/**
 * (V76; Design «Añadir una reserva» R5, R9 y R10) UNIR UN FERRY, TREN O AUTOBÚS A UNA EXCURSIÓN, Y LAS RESERVAS EXTRA SUELTAS DE UN DÍA. Funciones puras (sin React ni red), iguales para todos los destinos.
 *
 *  · Si un ferry, tren o autobús cae el día de una excursión de la ruta (`excursionesDeLaRuta`), antes de guardar se pregunta «¿Es para tu excursión a La Graciosa?». Si se une, la reserva lleva `unidaA` = el id de la excursión:
 *    cuenta como la reserva de esa excursión (`excursionesDeLaRuta().hecha`), se ve dentro de su ficha de RESERVAS (no en un bloque aparte) y HOY enseña una fila por billete en la tarjeta de la excursión.
 *  · Un ferry, tren, autobús u «otra» NO unido sale en HOY y en DÍAS en su día, por la hora (`extrasSueltasDelDia`). Si choca con una parada de ese día, se AVISA (`choqueConParadas`); la app no reorganiza el día sola.
 * No guarda nada: todo se lee de la ruta y de las reservas (la regla «HOY y RESERVAS, los mismos datos»).
 */
import type { DayPlan, Excursion, Route, Stop } from './types'
import { dayOfReservation, excursionesDeLaRuta, nombreCortoDeExcursion, type Reservation } from './bookings'
import { esReservaExtra, queEliminarReservaExtra, trayectoDeLaReservaExtra, type ReservaExtra } from './reservasExtra'
import type { RevisionDeHoras } from './revisarLasHoras'
import { lugarCon } from './articulos'
import { displayStopName } from './format'
import { queEliminarExcursion } from './queEliminar'

export const minutosDeLaHora = (hhmm: string | null | undefined): number | null => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(hhmm ?? '').trim())
  return m ? Number(m[1]) * 60 + Number(m[2]) : null
}
const aHora = (min: number): string => `${String(Math.floor(min / 60) % 24).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`
/** «9:00» (sin cero delante, como en los dibujos). */
export const horaSinCero = (hhmm: string): string => (minutosDeLaHora(hhmm) == null ? hhmm : aHora(minutosDeLaHora(hhmm) as number).replace(/^0/, ''))

/** Los tipos que se pueden unir a una excursión (el «otra» no: es otra cosa). */
export const puedeUnirseAUnaExcursion = (r: Pick<Reservation, 'kind'>): boolean => r.kind === 'ferry' || r.kind === 'tren' || r.kind === 'bus'

/** El nombre de la excursión sin lo que va entre paréntesis («La Graciosa (excursión)» → «La Graciosa»). */
export const nombreDeLaExcursion = (excursion: Pick<Excursion, 'id' | 'title'>): string => excursion.title.replace(/\s*\(.*$/, '').split(/\s+[·–-]\s+|\s+desde\s+/i)[0].trim() || nombreCortoDeExcursion(excursion)

export interface ExcursionDeLaReserva {
  excursion: Excursion
  day: DayPlan
  /** «La Graciosa». */
  nombre: string
  /** «tu excursión a La Graciosa». */
  frase: string
}

/** La excursión de la ruta que cae el MISMO día que esta reserva (un ferry, tren o autobús), o null. `otras`: las reservas que ya hay (para saber qué excursiones hay). */
export function excursionAlQueSeUne(route: Route, otras: readonly Reservation[], reserva: Pick<Reservation, 'kind' | 'dateIso' | 'dayNumber'>): ExcursionDeLaReserva | null {
  if (!puedeUnirseAUnaExcursion(reserva)) return null
  const dia = dayOfReservation(route, reserva as Reservation)
  if (!dia) return null
  const fila = excursionesDeLaRuta(route, otras as Reservation[]).find((f) => f.day.id === dia.id)
  if (!fila) return null
  const nombre = nombreDeLaExcursion(fila.excursion)
  return { excursion: fila.excursion, day: fila.day, nombre, frase: queEliminarExcursion(nombre) }
}

/** Los ferris, trenes y autobuses unidos a una excursión, por hora. */
export const unidasAUnaExcursion = (reservas: readonly Reservation[], excursionId: string): ReservaExtra[] =>
  reservas.filter((r): r is ReservaExtra => esReservaExtra(r) && r.unidaA === excursionId).sort((a, b) => a.time.localeCompare(b.time))

/** Las reservas extra de un día que NO están unidas a una excursión, por hora (R10). */
export function extrasSueltasDelDia(route: Route, reservas: readonly Reservation[], day: DayPlan): ReservaExtra[] {
  return reservas
    .filter((r): r is ReservaExtra => esReservaExtra(r) && !r.unidaA && !r.unidaALlegada && dayOfReservation(route, r)?.id === day.id)
    .sort((a, b) => a.time.localeCompare(b.time))
}

/** «Ferry», «Tren», «Autobús», «Reserva». */
export const palabraDelMedio = (r: Pick<Reservation, 'kind'>): string => (r.kind === 'tren' ? 'Tren' : r.kind === 'bus' ? 'Autobús' : r.kind === 'ferry' ? 'Ferry' : 'Reserva')

export interface FilaDeBillete {
  reserva: ReservaExtra
  /** «Ferry de las 10:00 desde Órzola» / «Ferry de vuelta · 17:30». */
  titulo: string
  /** «Falta tu billete» (sin código) o ''. */
  sub: string
  esVuelta: boolean
}

/** Una fila por billete unido, por hora: el primero es la ida («Ferry de las 10:00 desde Órzola»); los siguientes, «Ferry de vuelta · 17:30». `tieneCodigo(reserva)` lo dice el billete guardado en RESERVAS. */
export function filasDeBilletes(unidas: readonly ReservaExtra[], tieneCodigo: (r: ReservaExtra) => boolean): FilaDeBillete[] {
  return unidas.map((reserva, i) => {
    const medio = palabraDelMedio(reserva)
    const faltaElBillete = !tieneCodigo(reserva)
    if (i === 0) return { reserva, esVuelta: false, titulo: `${medio} de las ${reserva.time}${reserva.origen ? ` desde ${reserva.origen}` : ''}`, sub: faltaElBillete ? 'Falta tu billete' : '' }
    return { reserva, esVuelta: true, titulo: `${medio} de vuelta · ${reserva.time}`, sub: faltaElBillete ? 'Falta tu billete' : trayectoDeLaReservaExtra(reserva) }
  })
}

export interface ChoqueConUnaParada {
  parada: Stop
  /** «Ferry a Fuerteventura». */
  nombre: string
}

const paradaCuenta = (s: Stop): boolean => !s.saltada && !s.passThrough && !s.isBreak && !s.isFreeTime && s.visitMode !== 'fuera' && minutosDeLaHora(s.time) != null

/**
 * (R10) ¿Choca la reserva con una parada de ese día? Sí cuando el rato del trayecto (de su hora de salida a la de llegada; sin llegada, desde la salida hasta una hora después) se pisa con el rato de la parada (su hora y su tiempo de visita).
 * La app avisa; NO mueve nada. Una reserva unida a una excursión no se mira (la excursión ya es el día).
 */
export function choqueConParadas(route: Route, reserva: Reservation): ChoqueConUnaParada | null {
  if (!esReservaExtra(reserva) || reserva.unidaA) return null
  const dia = dayOfReservation(route, reserva)
  const desde = minutosDeLaHora(reserva.time)
  if (!dia || desde == null) return null
  const hasta = Math.max(minutosDeLaHora(reserva.returnTime) ?? desde + 60, desde + 1)
  for (const parada of dia.stops) {
    if (!paradaCuenta(parada)) continue
    const ini = minutosDeLaHora(parada.time) as number
    const fin = ini + Math.max(parada.durationMinutes || 30, 1)
    if (desde < fin && ini < hasta) return { parada, nombre: reserva.name }
  }
  return null
}

/** Los choques de TODAS las reservas extra sueltas de un día (para el aviso de arriba de HOY). */
export function choquesDelDia(route: Route, reservas: readonly Reservation[], day: DayPlan): ChoqueConUnaParada[] {
  return extrasSueltasDelDia(route, reservas, day).flatMap((r) => {
    const c = choqueConParadas(route, r)
    return c ? [c] : []
  })
}

const mayus = (t: string): string => t.charAt(0).toUpperCase() + t.slice(1)

/**
 * (R10; hoja A1 «Revisa las horas» de la V69) Lo que dice la hoja al GUARDAR una reserva extra suelta que choca con una parada de su día. Misma forma que las demás revisiones (`RevisionDeHoras`): el botón dorado lleva a mirar el día
 * (DÍAS), el blanco vuelve a cambiar esta reserva, y «Guardarla igualmente» no se prohíbe. La app avisa; no mueve nada.
 */
export function revisionDeUnaExtra(route: Route, reserva: Reservation): RevisionDeHoras | null {
  const choque = choqueConParadas(route, reserva)
  const dia = dayOfReservation(route, reserva)
  if (!choque || !dia || !esReservaExtra(reserva)) return null
  const rango = reserva.returnTime ? `${horaSinCero(reserva.time)} a ${horaSinCero(reserva.returnTime)}` : horaSinCero(reserva.time)
  const parada = choque.parada
  return {
    caso: 'parada',
    texto: `${mayus(queEliminarReservaExtra(reserva))} (${rango}) coincide con tu visita ${lugarCon('a', displayStopName(parada.name))} (${horaSinCero(parada.time)}).`,
    otro: { tipo: 'dia', dayId: dia.id, etiqueta: 'Ver el día' },
    esta: `Revisar ${reserva.kind === 'otra' ? 'la reserva' : reserva.kind === 'bus' ? 'el autobús' : `el ${reserva.kind}`}`,
  }
}

/**
 * (V81, R13) EN SU SITIO POR LA HORA, en la lista de DÍAS. `grupos` son las franjas del día, cada una con sus elementos (`start` = el minuto en que empiezan; `cuenta` = es una parada, la comida o la cena: lo que ordena;
 * un hueco, un tiempo libre o el final del día no cuentan). Una reserva a las 19:30 va ANTES del primer elemento que empieza a su hora o más tarde (con la cena a las 19:30 también: la reserva va delante y la cena pasa detrás); si no hay
 * ninguno, después del último. Devuelve la franja `g` y la posición `k` (la reserva se pinta delante del elemento `k` de esa franja). Pura: no mueve nada del día.
 */
export function lugarDeLaExtraEnElDia(grupos: readonly (readonly { start: number; cuenta: boolean }[])[], minutos: number): { g: number; k: number } {
  let ultimo: { g: number; k: number } | null = null
  for (let g = 0; g < grupos.length; g++) {
    for (let k = 0; k < grupos[g].length; k++) {
      const e = grupos[g][k]
      if (!e.cuenta) continue
      if (e.start >= minutos) return { g, k }
      ultimo = { g, k: k + 1 }
    }
  }
  return ultimo ?? { g: Math.max(grupos.length - 1, 0), k: 0 }
}
