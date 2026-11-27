/**
 * (V75) «+ AÑADIR UNA RESERVA»: las reservas que no son vuelo, alojamiento, entrada, excursión ni coche: FERRY, TREN, AUTOBÚS y OTRA (Design «Añadir una reserva» R3-R4, R6). Funciones puras, sin React, para todos los destinos.
 *
 *  · Se guardan en la MISMA lista de reservas del viaje (`Reservation` de `bookings.ts`, `kind` = `ferry` | `tren` | `bus` | `otra`): ni migración ni tabla nueva. El billete (el código) va donde van los de las excursiones
 *    (`useBilleteStore`, mapa `excursiones`, clave = el id de la reserva) y por tanto a la fila privada `billetes_personales`.
 *  · No mueven la ruta, no fijan días y NO cuentan en «X de N reservas listas» (ese contador es de lo que la app recomienda reservar).
 *  · Su precio entra en el presupuesto como el de cualquier reserva (`presupuesto.ts` lee todas las reservas) y se reparte entre «¿Para quién es?».
 */
import type { Importe } from './dinero'
import type { DayPlan, Route } from './types'
import { dateOfDay, dayLineOf, dayOnDate, type Reservation } from './bookings'
import { queEliminarTransporteNuevo } from './queEliminar'

export type TipoExtra = 'ferry' | 'tren' | 'bus' | 'otra'

/** El orden de los bloques de RESERVAS (al final, antes de «Útil para el viaje»): Ferry, Tren, Autobús, Otras reservas. */
export const TIPOS_EXTRA: readonly TipoExtra[] = ['ferry', 'tren', 'bus', 'otra']

export const esTipoExtra = (valor: unknown): valor is TipoExtra => valor === 'ferry' || valor === 'tren' || valor === 'bus' || valor === 'otra'

export type ReservaExtra = Reservation & { kind: TipoExtra }

/** ¿Es una de las reservas de «+ Añadir una reserva»? */
export const esReservaExtra = (reserva: Pick<Reservation, 'kind'>): reserva is ReservaExtra => esTipoExtra(reserva.kind)

/** El nombre del bloque: «Ferry», «Tren», «Autobús», «Otras reservas». */
export const nombreDelBloqueExtra = (tipo: TipoExtra): string => (tipo === 'ferry' ? 'Ferry' : tipo === 'tren' ? 'Tren' : tipo === 'bus' ? 'Autobús' : 'Otras reservas')

/** El título de la hoja del formulario (R3, R3b, R3c, R4). */
export const tituloDeLaHojaExtra = (tipo: TipoExtra): string => (tipo === 'ferry' ? 'Ferry' : tipo === 'tren' ? 'Tren' : tipo === 'bus' ? 'Autobús' : 'Otra reserva')

/** El rótulo de la tarjeta («FERRY», «TREN», «AUTOBÚS», «OTRA RESERVA»). */
export const rotuloDeLaTarjetaExtra = (tipo: TipoExtra): string => (tipo === 'otra' ? 'OTRA RESERVA' : nombreDelBloqueExtra(tipo).toUpperCase())

/** El botón de guardar: «Guardar el ferry», «Guardar el tren», «Guardar el autobús», «Guardar la reserva». */
export const textoDeGuardarExtra = (tipo: TipoExtra): string => (tipo === 'ferry' ? 'Guardar el ferry' : tipo === 'tren' ? 'Guardar el tren' : tipo === 'bus' ? 'Guardar el autobús' : 'Guardar la reserva')

/** «1 guardado» / «2 guardados». */
export const textoGuardados = (cuantos: number): string => `${cuantos} ${cuantos === 1 ? 'guardado' : 'guardados'}`

/** Lo que escribe el viajero en la hoja. Todo texto; vacío = sin poner. */
export interface BorradorExtra {
  tipo: TipoExtra
  /** Naviera (ferry) o compañía (tren, autobús). */
  compania: string
  /** Puerto o estación de salida («De»). */
  origen: string
  /** Puerto o estación de llegada («A»). */
  destino: string
  /** Solo «otra»: cómo se llama. */
  nombre: string
  /** Solo «otra»: el lugar. */
  lugar: string
  /** El día: la fecha (con fechas en el viaje) o el número de día (sin ellas). */
  dateIso: string
  dayNumber: string
  /** Hora de salida (o la hora, en «otra»), `HH:MM`. */
  hora: string
  /** Hora de llegada, opcional. */
  llegada: string
  localizador: string
  /** Solo tren. */
  coche: string
  asiento: string
}

export function borradorVacio(tipo: TipoExtra): BorradorExtra {
  return { tipo, compania: '', origen: '', destino: '', nombre: '', lugar: '', dateIso: '', dayNumber: '', hora: '', llegada: '', localizador: '', coche: '', asiento: '' }
}

const HORA = /^\d{1,2}:\d{2}$/
export const horaValida = (hora: string | null | undefined): boolean => Boolean(hora && HORA.test(hora))
const hhmm = (hora: string): string => (hora.length === 4 ? `0${hora}` : hora)

/** Lo que falta para poder guardar (vacío = listo): el día y la hora de salida siempre; en ferry, tren y autobús, de dónde y a dónde; en «otra», el nombre. Lo demás es opcional. */
export function loQueFalta(b: BorradorExtra): string[] {
  const falta: string[] = []
  if (!b.dateIso && !b.dayNumber) falta.push('dia')
  if (!horaValida(b.hora)) falta.push('hora')
  if (b.tipo === 'otra') {
    if (!b.nombre.trim()) falta.push('nombre')
  } else {
    if (!b.origen.trim()) falta.push('origen')
    if (!b.destino.trim()) falta.push('destino')
  }
  return falta
}

/** «Ferry a La Graciosa», «Tren a Florencia», «Autobús al aeropuerto»; en «otra», el nombre escrito. Es el `name` de la reserva (lo que lee el presupuesto y los avisos). */
export function nombreDeLaReservaExtra(b: Pick<BorradorExtra, 'tipo' | 'destino' | 'nombre'>): string {
  if (b.tipo === 'otra') return b.nombre.trim()
  const palabra = b.tipo === 'ferry' ? 'Ferry' : b.tipo === 'tren' ? 'Tren' : 'Autobús'
  const d = b.destino.trim()
  return d ? `${palabra} a ${d}` : palabra
}

const tonto = (texto: string): string | null => texto.trim() || null

/** El borrador y lo del dinero convertidos en la reserva que se guarda. `id` y `refId`: únicos (la lista reemplaza una del mismo tipo y `refId`). */
export function construirReservaExtra(b: BorradorExtra, dinero: { id: string; precio: Importe | null; paraQuien?: string[] | null; pagadoPor?: string[] | null }, conFechas: boolean, dayNumberDelDia: number | null): ReservaExtra {
  const esOtra = b.tipo === 'otra'
  const nombre = nombreDeLaReservaExtra(b)
  return {
    id: dinero.id,
    kind: b.tipo,
    refId: dinero.id,
    name: nombre,
    placeNames: [],
    dateIso: conFechas ? b.dateIso || null : null,
    dayNumber: conFechas ? null : dayNumberDelDia,
    time: hhmm(b.hora),
    returnTime: esOtra ? null : horaValida(b.llegada) ? hhmm(b.llegada) : null,
    meetingPoint: null,
    locator: tonto(b.localizador),
    precio: dinero.precio,
    // Ni mueven ni rehacen nada: solo viven en RESERVAS (el motor no las conoce).
    noMueve: true,
    compania: esOtra ? null : tonto(b.compania),
    origen: esOtra ? null : tonto(b.origen),
    destinoDeViaje: esOtra ? null : tonto(b.destino),
    coche: b.tipo === 'tren' ? tonto(b.coche) : null,
    asiento: b.tipo === 'tren' ? tonto(b.asiento) : null,
    lugar: esOtra ? tonto(b.lugar) : null,
    ...(dinero.paraQuien ? { paraQuien: dinero.paraQuien, pagadoPor: dinero.pagadoPor ?? null } : {}),
  } as ReservaExtra
}

/** De una reserva guardada al borrador (para el lápiz). */
export function borradorDeLaReserva(r: ReservaExtra): BorradorExtra {
  return {
    tipo: r.kind,
    compania: r.compania ?? '',
    origen: r.origen ?? '',
    destino: r.destinoDeViaje ?? '',
    nombre: r.kind === 'otra' ? r.name : '',
    lugar: r.lugar ?? '',
    dateIso: r.dateIso ?? '',
    dayNumber: r.dayNumber != null ? String(r.dayNumber) : '',
    hora: r.time ?? '',
    llegada: r.returnTime ?? '',
    localizador: r.locator ?? '',
    coche: r.coche ?? '',
    asiento: r.asiento ?? '',
  }
}

/** Los días que se pueden elegir: TODOS los del viaje (también el de la vuelta), en su orden. */
export function diasParaElegir(route: Route): DayPlan[] {
  return route.days
}

/** El día de una reserva guardada en la ruta (el de su fecha; sin fechas, su número). */
export function diaDeLaReservaExtra(route: Route, r: Pick<Reservation, 'dateIso' | 'dayNumber'>): DayPlan | null {
  if (r.dateIso && route.answers.dateRange) return dayOnDate(route, r.dateIso)
  if (r.dayNumber != null) return route.days.find((day) => day.dayNumber === r.dayNumber) ?? null
  return null
}

/** «Viernes 27 nov» (o «Día 2» sin fechas): la línea del día de la tarjeta. */
export function diaDeLaTarjetaExtra(route: Route, r: Pick<Reservation, 'dateIso' | 'dayNumber'>): string {
  const dia = diaDeLaReservaExtra(route, r)
  return dia ? dayLineOf(route, dia) : r.dayNumber != null ? `Día ${r.dayNumber}` : ''
}

/** El trayecto de la tarjeta: «Órzola → La Graciosa». En «otra», el lugar. */
export function trayectoDeLaReservaExtra(r: ReservaExtra): string {
  if (r.kind === 'otra') return r.lugar ?? ''
  return [r.origen, r.destinoDeViaje].filter(Boolean).join(' → ')
}

/** Las guardadas de un tipo, por día y hora. */
export function extrasDeUnTipo(reservas: readonly Reservation[], tipo: TipoExtra): ReservaExtra[] {
  return reservas
    .filter((r): r is ReservaExtra => r.kind === tipo)
    .sort((a, b) => (a.dateIso ?? `9999-${String(a.dayNumber ?? 99).padStart(2, '0')}`).localeCompare(b.dateIso ?? `9999-${String(b.dayNumber ?? 99).padStart(2, '0')}`) || a.time.localeCompare(b.time))
}

/** Los bloques que salen (solo los tipos con alguna guardada), en su orden. Sin ninguna guardada: lista vacía y no sale ningún bloque. */
export function bloquesExtra(reservas: readonly Reservation[]): { tipo: TipoExtra; reservas: ReservaExtra[] }[] {
  // (V76) Un tren o autobús unido a la llegada o a la vuelta se ve dentro de «Llegada y vuelta», no en su bloque.
  return TIPOS_EXTRA.map((tipo) => ({ tipo, reservas: extrasDeUnTipo(reservas, tipo).filter((r) => !r.unidaALlegada) })).filter((b) => b.reservas.length > 0)
}

/** La frase de la hoja de eliminar: «tu ferry a La Graciosa», «tu tren a Florencia», «tu reserva de Tour en kayak». */
export const queEliminarReservaExtra = (r: Pick<ReservaExtra, 'kind' | 'destinoDeViaje' | 'name'>): string => queEliminarTransporteNuevo(r.kind, r.kind === 'otra' ? r.name : (r.destinoDeViaje ?? ''))

/** El rótulo del documento de la tarjeta («Enséñalo al embarcar»…). */
export const fraseDelDocumentoExtra = (tipo: TipoExtra): { rotulo: string; frase: string } =>
  tipo === 'ferry' ? { rotulo: 'TU BILLETE', frase: 'Enséñalo al embarcar' } : tipo === 'bus' ? { rotulo: 'TU BILLETE', frase: 'Enséñalo al conductor' } : tipo === 'tren' ? { rotulo: 'TU BILLETE', frase: 'Enséñalo al revisor' } : { rotulo: 'TU RESERVA', frase: 'Enséñala al llegar' }

/** (Reparto de la hoja «Añade una reserva», R2) Las nueve casillas, en su orden, y a dónde lleva cada una. */
export type CasillaDeAnadir = 'vuelo' | 'tren' | 'bus' | 'ferry' | 'coche' | 'aloj' | 'entrada' | 'excursion' | 'otra'
export const CASILLAS_DE_ANADIR: readonly { id: CasillaDeAnadir; nombre: string }[] = [
  { id: 'vuelo', nombre: 'Vuelo' },
  { id: 'tren', nombre: 'Tren' },
  { id: 'bus', nombre: 'Autobús' },
  { id: 'ferry', nombre: 'Ferry' },
  { id: 'coche', nombre: 'Coche de alquiler' },
  { id: 'aloj', nombre: 'Alojamiento' },
  { id: 'entrada', nombre: 'Entrada' },
  { id: 'excursion', nombre: 'Excursión o tour' },
  { id: 'otra', nombre: 'Otra' },
]

/**
 * (R7a, R7b) Qué hace «Vuelo». Un viaje de UN destino solo lleva un vuelo de ida y uno de vuelta: con la ida puesta, abre directamente «Tu vuelo de vuelta»; con las dos, la hoja «Ya tienes tus vuelos. ¿Quieres cambiar alguno?»;
 * sin ninguna (o solo la vuelta), «Tu vuelo de ida». En un multidestino nada cambia: se abre su bloque de siempre (`multidestino`).
 */
export type AccionDeVuelo = { tipo: 'abrir'; mitad: 'arrival' | 'departure' } | { tipo: 'ya-tiene-los-dos' } | { tipo: 'multidestino' }
export function accionDeVuelo(a: { unDestino: boolean; idaHecha: boolean; vueltaHecha: boolean }): AccionDeVuelo {
  if (!a.unDestino) return { tipo: 'multidestino' }
  if (a.idaHecha && a.vueltaHecha) return { tipo: 'ya-tiene-los-dos' }
  if (a.idaHecha) return { tipo: 'abrir', mitad: 'departure' }
  return { tipo: 'abrir', mitad: 'arrival' }
}

/** El texto de la fecha de un día para los botones de día: «JUE» y «26». */
export function fichaDeDia(route: Route, day: DayPlan): { semana: string; numero: string } {
  const iso = dateOfDay(route, day)
  if (!iso) return { semana: 'DÍA', numero: String(day.dayNumber) }
  const fecha = new Date(`${iso}T12:00:00`)
  return { semana: new Intl.DateTimeFormat('es-ES', { weekday: 'short' }).format(fecha).replace('.', '').toUpperCase(), numero: String(fecha.getDate()) }
}
