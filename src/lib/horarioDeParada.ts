/**
 * El horario de una parada UN día concreto (Tanda 6z5, tarea A): lo que sale en pequeño debajo del nombre de la tarjeta,
 * en DÍAS y en HOY — «Abre 9:00 – 19:15 · Última entrada 18:15», «Abre 9:00 – 13:00 y 15:00 – 19:00» o «Cerrado hoy».
 *
 * Es el ÚNICO sitio donde se decide: lee los datos reales del lugar (`hours_data` del catálogo del destino: horario por
 * época, por día de la semana, por periodo, días y fechas de cierre, horarios especiales y `last_entry`) con los MISMOS
 * ayudantes que el motor (shared/routeEngine/openingHours.js). La app no calcula ninguna hora: solo enseña la que ya está.
 *
 * Sin horario en los datos (plazas, fuentes, calles, sitios de acceso libre) devuelve null y la tarjeta no enseña nada.
 */
import { useEffect, useState } from 'react'
import { closedOnDay, lastEntryMinutes, parseHoursSessions, placeWindows, seasonKey } from '../../shared/routeEngine/openingHours.js'
import { fetchDestinationPlaces } from './destinationPlacesApi'
import { useRouteStore } from '../store/useRouteStore'
import { formatDaySessions } from './stopHoursTag'

const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']

/** Lo que hace falta de una parada para saber su horario. */
export interface LugarConHorario {
  /** Los campos de horario del lugar (DestinationPlace.hours_data). */
  hoursData?: Record<string, unknown> | null
  /** El horario de ese día que dio el motor ("09:00-19:15"): solo se usa si no hay `hoursData`. */
  scheduleText?: string | null
  hours?: string | null
}

export interface HorarioDeParada {
  /** Cuándo abre ("9:00"): el primer tramo. null si ese día no abre. */
  abre: string | null
  /** Cuándo cierra ("19:15"): el último tramo. */
  cierra: string | null
  /** La última hora a la que se puede entrar ("18:15"), si los datos la traen. */
  ultimaEntrada: string | null
  /** Ese día no abre (cierre semanal, fecha cerrada o ningún tramo). Sin fecha nunca es true: no se sabe qué día es. */
  cerrado: boolean
  /** Los tramos del día, en orden: [{ abre: '9:00', cierra: '13:00' }, { abre: '15:00', cierra: '19:00' }]. */
  tramos: { abre: string; cierra: string }[]
  /** La línea lista para pintar. */
  texto: string
}

/** 9*60+5 → "9:05" (sin cero delante de la hora: así se lee en pantalla). */
const horaTexto = (minutos: number) => `${Math.floor(minutos / 60)}:${String(minutos % 60).padStart(2, '0')}`

/** El nombre de un lugar tal como se busca en los datos de horario: sin tildes, en minúsculas. */
export const normalizaNombre = (texto: string) => texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
const normaliza = normalizaNombre

/** Los campos de horario que se miran: sin ninguno no hay horario que enseñar (nunca se inventa uno). */
const CAMPOS_DE_HORARIO = ['windows', 'by_day', 'by_season', 'by_period', 'special_hours'] as const

function tieneHorario(datos: Record<string, unknown>): boolean {
  return CAMPOS_DE_HORARIO.some((campo) => datos[campo] != null) || parseHoursSessions(datos.schedule).length > 0
}

/** Todas las variantes de horario que tiene el lugar a lo largo del año/la semana (cada una, en texto). */
function variantesDeHorario(datos: Record<string, unknown>): Set<string> {
  const variantes = new Set<string>()
  const añade = (franjas: unknown) => {
    if (Array.isArray(franjas) && franjas.length > 0) variantes.add(franjas.join(','))
  }
  añade(datos.windows)
  for (const franjas of Object.values((datos.by_day as Record<string, unknown>) ?? {})) añade(franjas)
  for (const franjas of Object.values((datos.by_season as Record<string, unknown>) ?? {})) añade(franjas)
  for (const periodo of Array.isArray(datos.by_period) ? (datos.by_period as { windows?: unknown }[]) : []) añade(periodo.windows)
  return variantes
}

/** «los lunes», «los lunes y martes»: los días de la semana que el lugar cierra siempre (`closed_on`); null si no cierra ninguno. */
function diasDeCierre(datos: Record<string, unknown>): string | null {
  const cierra = datos.closed_on
  const dias = (Array.isArray(cierra) ? cierra : typeof cierra === 'string' ? cierra.split(',') : []).map((dia) => String(dia).trim().toLowerCase()).filter(Boolean)
  if (dias.length === 0) return null
  const plural = dias.map((dia) => (dia.endsWith('s') ? dia : `${dia}s`))
  return `los ${plural.length > 1 ? `${plural.slice(0, -1).join(', ')} y ${plural.at(-1)}` : plural[0]}`
}

/** Sin fecha: la última entrada solo vale si no depende de la época, del periodo ni del día de la semana. */
function ultimaEntradaSinFecha(datos: Record<string, unknown>, inicio: number): number | null {
  const entrada = datos.last_entry
  if (entrada == null || datos.by_period != null || datos.last_entry_by_day != null) return null
  if (typeof entrada === 'object' && !('manana' in (entrada as object)) && !('tarde' in (entrada as object))) return null
  return lastEntryMinutes(datos, inicio, { season: null }) as number | null
}

/**
 * @param lugar  la parada (o el lugar del catálogo) con sus datos de horario
 * @param fechaIso  el día de la visita ("2027-03-10"); null si el viaje no tiene fechas
 * @param mes  el mes del viaje (0–11) cuando no hay fechas: se enseña el horario de ese mes (su temporada); si cambia según el día de la semana, el general con el día que cierra («Abre 9:00 – 19:00 · Cerrado los lunes»)
 */
export function horarioDeParada(lugar: LugarConHorario, fechaIso: string | null, mes: number | null = null): HorarioDeParada | null {
  const datos: Record<string, unknown> | null =
    lugar.hoursData && Object.keys(lugar.hoursData).length > 0 ? lugar.hoursData : lugar.scheduleText || lugar.hours ? { schedule: lugar.scheduleText ?? lugar.hours } : null
  if (!datos || !tieneHorario(datos)) return null

  const fecha = fechaIso && /^\d{4}-\d{2}-\d{2}$/.test(fechaIso) ? fechaIso : null
  const diaDeLaSemana = fecha ? WEEKDAYS[new Date(`${fecha}T00:00:00`).getDay()] : null
  // Sin fechas pero con mes (los viajes sin fechas lo tienen): el horario de la temporada de ese mes, sin día de la semana (el general).
  const mesDelViaje = typeof mes === 'number' && mes >= 0 && mes <= 11 ? mes : null
  const fechaDelMes = !fecha && mesDelViaje !== null ? `2027-${String(mesDelViaje + 1).padStart(2, '0')}-15` : null
  const horas = { weekday: diaDeLaSemana, season: fecha || fechaDelMes ? seasonKey(null, fecha ?? fechaDelMes) : null, dateIso: fecha ?? fechaDelMes }

  // Sin fecha y sin mes, si el horario cambia según el día o la época no se enseña ninguno: no se sabe cuál toca.
  if (!fecha && !fechaDelMes && variantesDeHorario(datos).size > 1) return null

  const cerradoElDia = Boolean(fecha && closedOnDay(datos, diaDeLaSemana, fecha))
  const franjas = placeWindows(datos, horas) as string[] | null
  // `00:00-24:00` (abierto siempre): no hay horario que enseñar.
  if (franjas && franjas.length > 0 && franjas.every((franja) => /^00:00\s*-\s*24:00$/.test(franja))) return null
  // (Un horario solo en texto, "Lun-Sáb 09:00-19:00. Dom 09:00-13:00": se toma el primer grupo de días, como en el resto de la app.)
  const texto = franjas ? franjas.join(', ') : typeof datos.schedule === 'string' ? formatDaySessions(datos.schedule) : null
  const tramosEnMinutos = (parseHoursSessions(texto) as { open: number; close: number }[]).sort((a, b) => a.open - b.open)
  // Con fecha, un día sin ningún tramo (o de cierre) es un día cerrado; sin ellos y sin fecha no hay nada que enseñar.
  if (cerradoElDia || (fecha !== null && franjas !== null && tramosEnMinutos.length === 0)) return { abre: null, cierra: null, ultimaEntrada: null, cerrado: true, tramos: [], texto: 'Cerrado hoy' }
  if (tramosEnMinutos.length === 0) return null

  // Los parques que cierran «al anochecer» ("07:00-sunset"): el motor los pasa a las 17:00 por prudencia; aquí se dice lo que son.
  const alAnochecer = /sunset/i.test(JSON.stringify(datos)) && tramosEnMinutos.at(-1)?.close === 17 * 60
  const tramos = tramosEnMinutos.map((tramo) => ({ abre: horaTexto(tramo.open), cierra: horaTexto(tramo.close) }))
  const inicioDelUltimo = tramosEnMinutos.at(-1)!.open
  const minutosUltimaEntrada = fecha
    ? (lastEntryMinutes(datos, inicioDelUltimo, horas) as number | null)
    : fechaDelMes
      ? datos.last_entry_by_day != null
        ? null
        : (lastEntryMinutes(datos, inicioDelUltimo, horas) as number | null)
      : ultimaEntradaSinFecha(datos, inicioDelUltimo)
  const ultimaEntrada = minutosUltimaEntrada != null ? horaTexto(minutosUltimaEntrada) : null

  const rangos = tramos.map((tramo, indice) => (alAnochecer && indice === tramos.length - 1 ? `${tramo.abre} – al anochecer` : `${tramo.abre} – ${tramo.cierra}`))
  const lineaDeTramos = rangos.length > 2 ? `${rangos.slice(0, -1).join(', ')} y ${rangos.at(-1)}` : rangos.join(' y ')
  return {
    abre: tramos[0].abre,
    cierra: tramos.at(-1)!.cierra,
    ultimaEntrada,
    cerrado: false,
    tramos,
    texto: `Abre ${lineaDeTramos}${ultimaEntrada ? ` · Última entrada ${ultimaEntrada}` : ''}${!fecha && diasDeCierre(datos) ? ` · Cerrado ${diasDeCierre(datos)}` : ''}`,
  }
}

// ── Los datos del catálogo, para quien pinta tarjetas ──────────────────────────────────────

type DatosPorNombre = Map<string, Record<string, unknown>>

const porDestino = new Map<string, DatosPorNombre>()

/** Los datos de horario de cada lugar del destino, por nombre; vacío si todavía no se han pedido o el destino no es curado. */
export function datosDeHorarioEnMemoria(destino: string): DatosPorNombre {
  return porDestino.get(destino.trim().toLowerCase()) ?? new Map()
}

/** Pide (una vez; después sale de la memoria) los datos de horario del destino. */
export async function cargaDatosDeHorario(destino: string): Promise<DatosPorNombre> {
  const clave = destino.trim().toLowerCase()
  const catalogo = await fetchDestinationPlaces(destino)
  const mapa: DatosPorNombre = new Map()
  for (const lugar of catalogo.places) if (lugar.hours_data && Object.keys(lugar.hours_data).length > 0) mapa.set(normaliza(lugar.name), lugar.hours_data)
  if (mapa.size > 0) porDestino.set(clave, mapa)
  return mapa
}

/**
 * Para pintar tarjetas: `horarioDe(parada)` da el horario de esa parada ese día, o null. Lee primero lo que ya hay en memoria (así
 * el primer pintado ya sale con horario si el catálogo estaba pedido) y, si no, lo pide y repinta.
 */
/** Los datos de horario de cada lugar del destino (por nombre normalizado): salen de la memoria si ya se pidieron y, si no, se piden y se repinta. */
export function useDatosDeHorario(destino: string | undefined): DatosPorNombre {
  const [datos, setDatos] = useState<DatosPorNombre>(() => (destino ? datosDeHorarioEnMemoria(destino) : new Map()))
  useEffect(() => {
    if (!destino) return
    let cancelado = false
    cargaDatosDeHorario(destino).then((mapa) => {
      if (!cancelado && mapa.size > 0) setDatos(mapa)
    })
    return () => {
      cancelado = true
    }
  }, [destino])
  return datos
}

export function useHorarioDeParadas(destino: string, fechaIso: string | null): (parada: LugarConHorario & { name: string; fullName?: string; passThrough?: boolean }) => HorarioDeParada | null {
  const datos = useDatosDeHorario(destino)
  // (Sin fechas, el mes del viaje: el horario de su temporada.)
  const mes = useRouteStore((state) => state.route?.answers.month ?? null)
  return (parada) => {
    if (parada.passThrough) return null
    const hoursData = parada.hoursData ?? datos.get(normaliza(parada.name)) ?? (parada.fullName ? datos.get(normaliza(parada.fullName)) : undefined) ?? null
    return horarioDeParada({ hoursData, scheduleText: parada.scheduleText, hours: parada.hours }, fechaIso, mes)
  }
}
