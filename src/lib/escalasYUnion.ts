/**
 * (V76) LAS ESCALAS DEL VUELO Y EL TREN O AUTOBÚS UNIDO A LA LLEGADA O A LA VUELTA. Funciones puras, sin React, para todos los destinos.
 *
 * ESCALAS (Design «Añadir una reserva» R8 y R8b). La ida y la vuelta de siempre siguen siendo UN tramo (`arrivalFlightTime`, `arrivalCodigo`, `arrivalOtraHora`…): es el tramo que toca el destino.
 * Una escala es OTRO tramo, guardado en la ruta (`arrivalEscalas` / `departureEscalas`, sin tabla nueva ni migración):
 *   · en la IDA, los tramos de ANTES del último (en el orden del viaje): «IDA · 1 DE 2» es la escala y «IDA · 2 DE 2» es el de siempre (el que llega al destino);
 *   · en la VUELTA, los tramos de DESPUÉS del primero: «VUELTA · 1 DE 2» es el de siempre (el que sale del destino) y «VUELTA · 2 DE 2» es la escala.
 * Así el motor y HOY no cambian: la ruta empieza tras la llegada del ÚLTIMO tramo de la ida (`arrivalFlightTime`) y la vuelta cuenta desde la salida del PRIMERO (`departureFlightTime`).
 * Un viaje sin escalas (todos los de antes) no tiene estos campos y todo sigue igual. El billete (QR) de cada tramo de escala va a `useBilleteStore.datos.excursiones` con la clave `escala:<arrival|departure>:<n>`.
 *
 * TREN O AUTOBÚS UNIDO (R11, R11a-c). Un tren o autobús guardado el día de llegada o el de vuelta puede unirse a ella (`Reservation.unidaALlegada`): se ve dentro de «Llegada y vuelta» (no en el bloque «Tren»),
 * en HOY como una fila de la tarjeta de llegada o de la vuelta, y la hora de SALIR de la vuelta sale de la hora de ese tren. Los datos se leen de la reserva (regla V62); nunca se copian.
 */
import type { Route } from './types'
import { puntoDeLaMitad, tripModes, type ArrivalMedio, type ArrivalPoint } from './arrivalReturn'
import { addDaysToIso } from './dateRange'
import type { Reservation } from './bookings'
import { queEliminarReservaExtra, type ReservaExtra } from './reservasExtra'
import type { RevisionDeHoras } from './revisarLasHoras'

export type MitadDelViaje = 'arrival' | 'departure'

export interface TramoDeEscala {
  compania: string
  codigo: string
  /** Hora de salida de ese tramo, `HH:MM`. */
  salida: string | null
  /** Hora de llegada de ese tramo, `HH:MM`. */
  llegada: string | null
  /** De dónde sale y a dónde llega (texto libre: «Madrid (MAD)»). */
  de: string
  a: string
}

/** Cuántas escalas caben en una mitad (tres tramos de escala = cuatro vuelos). */
export const MAX_ESCALAS = 3

export const escalaVacia = (): TramoDeEscala => ({ compania: '', codigo: '', salida: null, llegada: null, de: '', a: '' })

const HORA = /^\d{1,2}:\d{2}$/
const hora = (h: unknown): string | null => (typeof h === 'string' && HORA.test(h) ? (h.length === 4 ? `0${h}` : h) : null)
const texto = (t: unknown, max: number): string => (typeof t === 'string' ? t.replace(/\s+/g, ' ').trim().slice(0, max) : '')

/** Una escala limpia (sin espacios de más, horas válidas). */
export function limpiarEscala(t: Partial<TramoDeEscala> | null | undefined): TramoDeEscala {
  return { compania: texto(t?.compania, 40), codigo: texto(t?.codigo, 20), salida: hora(t?.salida), llegada: hora(t?.llegada), de: texto(t?.de, 60), a: texto(t?.a, 60) }
}

/** Las escalas guardadas de una mitad (vacío en un viaje de antes). */
export function escalasDe(route: Pick<Route, 'arrivalEscalas' | 'departureEscalas'> | null | undefined, kind: MitadDelViaje): TramoDeEscala[] {
  const lista = kind === 'arrival' ? route?.arrivalEscalas : route?.departureEscalas
  return Array.isArray(lista) ? lista.slice(0, MAX_ESCALAS).map(limpiarEscala) : []
}

/** ¿Está lista para guardar? Hace falta de dónde, a dónde y las dos horas. */
export const escalaCompleta = (t: TramoDeEscala): boolean => Boolean(t.de.trim() && t.a.trim() && t.salida && t.llegada)

/** La clave del billete (QR) de una escala: `escala:arrival:0`. */
export const claveDeEscala = (kind: MitadDelViaje, indice: number): string => `escala:${kind}:${indice}`

/** Un tramo de la ida o de la vuelta, ya en el orden del viaje. */
export interface TramoOrdenado {
  /** 1, 2… en el orden del viaje. */
  n: number
  de: number
  /** true = el tramo de siempre (el que llega al destino en la ida, el que sale de él en la vuelta). */
  principal: boolean
  /** El índice dentro de las escalas guardadas; null en el principal. */
  indiceEscala: number | null
  salida: string | null
  llegada: string | null
  compania: string
  codigo: string
  desde: string
  hasta: string
  /** La clave del billete: `principal` o `escala:<mitad>:<n>`. */
  clave: string
}

export interface TramoPrincipal {
  salida: string | null
  llegada: string | null
  compania: string
  codigo: string
  desde: string
  hasta: string
}

/** Todos los tramos de una mitad en el orden del viaje: la ida, las escalas y el último; la vuelta, el primero y las escalas. */
export function tramosDeLaMitad(route: Pick<Route, 'arrivalEscalas' | 'departureEscalas'>, kind: MitadDelViaje, principal: TramoPrincipal): TramoOrdenado[] {
  const escalas = escalasDe(route, kind)
  const total = escalas.length + 1
  const dePrincipal = (n: number): TramoOrdenado => ({ n, de: total, principal: true, indiceEscala: null, ...principal, clave: 'principal' })
  const deEscala = (i: number, n: number): TramoOrdenado => ({ n, de: total, principal: false, indiceEscala: i, salida: escalas[i].salida, llegada: escalas[i].llegada, compania: escalas[i].compania, codigo: escalas[i].codigo, desde: escalas[i].de, hasta: escalas[i].a, clave: claveDeEscala(kind, i) })
  if (kind === 'arrival') return [...escalas.map((_, i) => deEscala(i, i + 1)), dePrincipal(total)]
  return [dePrincipal(1), ...escalas.map((_, i) => deEscala(i, i + 2))]
}

/** «IDA · 1 DE 2», «VUELTA · 2 DE 2». */
export const etiquetaDeTramo = (kind: MitadDelViaje, n: number, de: number): string => `${kind === 'arrival' ? 'IDA' : 'VUELTA'} · ${n} DE ${de}`

const minutos = (h: string | null): number | null => {
  if (!h || !HORA.test(h)) return null
  const [a, b] = h.split(':').map(Number)
  return a * 60 + b
}

/**
 * El tramo que toca a esta hora (para el QR de HOY): el primero que aún no ha acabado (su llegada; sin llegada, su salida). Pasados todos, el último. Las horas son del mismo día; con un tramo que cruza la medianoche
 * (llega «antes» de salir) se cuenta como del día siguiente.
 */
export function tramoQueToca(tramos: readonly TramoOrdenado[], ahoraMin: number): TramoOrdenado | null {
  if (tramos.length === 0) return null
  let reloj = 0
  for (const t of tramos) {
    const s = minutos(t.salida)
    let fin = minutos(t.llegada) ?? s
    if (s != null && fin != null && fin < s) fin += 1440
    if (fin != null) {
      // Cada tramo empieza donde acabó el anterior: si el reloj retrocede, es otro día.
      while (fin < reloj) fin += 1440
      reloj = fin
      if (fin >= ahoraMin) return t
    }
  }
  return tramos[tramos.length - 1]
}

/** El billete que se pinta con la clave dada, de las claves de `excursiones`. */
export const esClaveDeEscala = (clave: string): boolean => clave.startsWith('escala:')

// ─────────────────────────────────────────────────────────────────────────────────────────────
// El tren o autobús unido a la llegada o a la vuelta.
// ─────────────────────────────────────────────────────────────────────────────────────────────

/** ¿Es un tren o un autobús (lo que se puede unir a la llegada o a la vuelta)? */
export const esUnibleALlegada = (r: Pick<Reservation, 'kind'>): boolean => r.kind === 'tren' || r.kind === 'bus'

/**
 * ¿A qué mitad cae una reserva de tren o autobús? `arrival` si es el día de llegada (el primero del viaje), `departure` si es el de vuelta (el último), `null` si ninguno.
 * Con fechas manda la fecha; sin ellas, el número de día. Si el viaje es de un solo día, es la llegada.
 */
export function mitadDeLaReserva(route: Route | null | undefined, r: Pick<Reservation, 'dateIso' | 'dayNumber' | 'kind'>): MitadDelViaje | null {
  if (!route || !esUnibleALlegada(r)) return null
  const rutas = route.days.filter((d) => !d.isReturnLeg)
  const ultimoNumero = route.days.at(-1)?.dayNumber ?? route.days.length
  const inicio = route.answers.dateRange?.start
  const fin = route.answers.dateRange?.end
  if (r.dateIso && inicio) {
    if (r.dateIso === inicio) return 'arrival'
    if (r.dateIso === (fin ?? addDaysToIso(inicio, ultimoNumero - 1))) return 'departure'
    return null
  }
  if (r.dayNumber == null) return null
  if (r.dayNumber === 1) return 'arrival'
  if (r.dayNumber === ultimoNumero || r.dayNumber === (rutas.at(-1)?.dayNumber ?? ultimoNumero)) return 'departure'
  return null
}

/** Las reservas unidas a una mitad (por hora). */
export const unidasA = (reservas: readonly Reservation[], kind: MitadDelViaje): Reservation[] => reservas.filter((r) => esUnibleALlegada(r) && r.unidaALlegada === kind).sort((a, b) => a.time.localeCompare(b.time))

/** El sitio del medio de la mitad: avión → aeropuerto, ferry → puerto, tren y autobús → estación. */
export type SitioDeLlegada = 'aeropuerto' | 'estación' | 'puerto'
const DEL: Record<SitioDeLlegada, string> = { aeropuerto: 'del aeropuerto', estación: 'de la estación', puerto: 'del puerto' }
const AL: Record<SitioDeLlegada, string> = { aeropuerto: 'al aeropuerto', estación: 'a la estación', puerto: 'al puerto' }

/** La frase de la pregunta antes de guardar: llegada «¿Es para ir del aeropuerto a tu alojamiento?»; vuelta «¿Es para ir al aeropuerto?». */
export const preguntaDeUnion = (kind: MitadDelViaje, sitio: SitioDeLlegada = 'aeropuerto', alojamiento = 'tu alojamiento'): string => (kind === 'arrival' ? `¿Es para ir ${DEL[sitio]} a ${alojamiento}?` : `¿Es para ir ${AL[sitio]}?`)

/** La etiqueta de la tarjeta de billete unida: «TREN AL CENTRO», «TREN AL AEROPUERTO» («AUTOBÚS AL CENTRO»…). */
export const etiquetaDeUnion = (tipo: 'tren' | 'bus', kind: MitadDelViaje, sitio: SitioDeLlegada = 'aeropuerto'): string => `${tipo === 'tren' ? 'TREN' : 'AUTOBÚS'} ${kind === 'arrival' ? 'AL CENTRO' : AL[sitio].toUpperCase()}`

/** «Leonardo Express · 14:35 · Fiumicino → Termini»: la fila de HOY de un tren unido (los datos salen de la reserva). */
export function filaDeUnion(r: Pick<Reservation, 'compania' | 'time' | 'returnTime' | 'origen' | 'destinoDeViaje' | 'name'>): string {
  const trayecto = [r.origen, r.destinoDeViaje].filter(Boolean).join(' → ')
  return [(r.compania ?? '').trim() || r.name, r.time, trayecto].filter(Boolean).join(' · ')
}

/**
 * (V76) La estación (o parada) de un tren o autobús unido a la vuelta, de los puntos del medio del destino: la que se llama como su «De» («Roma Termini» → Termini); sin coincidencia, la de siempre del medio.
 * Con ella se cuenta el trayecto del alojamiento a la ESTACIÓN (no al aeropuerto) para la hora de SALIR.
 */
export function puntoDeEstacion(medio: ArrivalMedio | null | undefined, origen: string | null | undefined): ArrivalPoint | null {
  const limpio = (t: string | null | undefined) => (t ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim()
  const o = limpio(origen)
  const puntos = medio?.puntos ?? []
  if (o) {
    const p = puntos.find((candidato) => [candidato.nombre, candidato.corto ?? '', candidato.id].some((n) => { const x = limpio(n); return x.length > 2 && (o.includes(x) || x.includes(o)) }))
    if (p) return p
  }
  return puntoDeLaMitad(medio, null, true).point
}

/**
 * (V76, cierre) «Revisa las horas» también con [Sí, unirlo]: un tren o autobús unido a la LLEGADA que sale ANTES de que aterrice el vuelo (tren a las 8:30, vuelo a las 11:15), o unido a la VUELTA que sale DESPUÉS de que salga el vuelo.
 * Misma forma que las demás revisiones (`RevisionDeHoras`, caso `vuelo`): [Revisar el vuelo] lleva a «Llegada y vuelta» y «Guardarla igualmente» no se prohíbe. Sin hora del vuelo o del tren, nada.
 */
export function revisionDeUnaUnion(route: Route, reserva: ReservaExtra, kind: MitadDelViaje): RevisionDeHoras | null {
  const aMin = (h: string | null | undefined): number | null => {
    const m = /^(\d{1,2}):(\d{2})$/.exec(String(h ?? '').trim())
    return m ? Number(m[1]) * 60 + Number(m[2]) : null
  }
  const aTexto = (min: number): string => `${Math.floor(min / 60)}:${String(min % 60).padStart(2, '0')}`
  const tren = aMin(reserva.time)
  const vuelo = aMin(kind === 'arrival' ? route.arrivalFlightTime : route.departureFlightTime)
  if (tren == null || vuelo == null) return null
  if (kind === 'arrival' ? tren >= vuelo : tren <= vuelo) return null
  const avion = tripModes(route)[kind] === 'avion'
  const suyo = queEliminarReservaExtra(reserva)
  return {
    caso: 'vuelo',
    texto:
      kind === 'arrival'
        ? `${avion ? `Tu vuelo aterriza a las ${aTexto(vuelo)}` : `Tu llegada es a las ${aTexto(vuelo)}`} y ${suyo} sale a las ${aTexto(tren)} del mismo día.`
        : `${avion ? `Tu vuelo de vuelta sale a las ${aTexto(vuelo)}` : `Tu vuelta es a las ${aTexto(vuelo)}`} y ${suyo} sale a las ${aTexto(tren)} del mismo día.`,
    otro: { tipo: 'vuelo', mitad: kind, etiqueta: avion ? 'Revisar el vuelo' : 'Revisar el billete' },
    esta: `Revisar ${reserva.kind === 'bus' ? 'el autobús' : 'el tren'}`,
  }
}
