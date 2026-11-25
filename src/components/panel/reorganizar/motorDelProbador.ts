/**
 * (V57) EL PROBADOR DE REORGANIZAR del panel (`/admin/reorganizar`), la parte que habla con el motor. NO guarda nada: ni viajes, ni el estado del viaje del administrador, ni localStorage, ni Supabase.
 *
 * Todo sale del MISMO motor y de las MISMAS funciones que usa la app (sin copias):
 *  - «Antes» = el viaje tal como lo genera el motor SIN vuelos (`runGeneration`, la misma generación del formulario, en modo `aislado`: no lee el estado, no mira ni guarda la caché de rutas).
 *  - «Después», con el Free Tour sin reservar (o sin Free Tour) = lo que hace el botón «Reorganizar» / «Sí, adaptarlos»: `propuestaDeVuelos` (src/lib/adaptarVuelos.ts) sobre una COPIA del viaje en memoria con los
 *    vuelos puestos, y se aplica `dia.next` de cada día propuesto + los planes de la llegada y de la vuelta (igual que `ponerDiasAdaptados` + `ponerPlanes`, pero sobre la copia).
 *  - «Después», con el Free Tour a una hora reservada = la generación desde cero con los vuelos y esa reserva (en la app el Free Tour reservado solo lo mira la generación desde cero: `reservasParaMotor(…, { conFreeTour: true })`;
 *    al rehacer días suelto, `reservasParaMotor` lo quita a propósito, 10S3b).
 * La línea del motor se compone SOLO con los campos públicos que el motor devuelve (`PlanLlegada`, `PlanVuelta`: caso, fila, free_tour, avisos, resumen…).
 *
 * Cada petición se hace solo al pulsar [Probar] o un caso (una vez por pulsación, nada en bucle). Ninguna consulta a Supabase ni escritura: solo la API del motor (/api/generate-skeleton, /api/generate-day-places, /api/generate-day-block,
 * /api/rebuild-day, /api/adaptar-dia-vuelo y /api/arrival-info). Cada prueba son unas 10 a 25 peticiones pequeñas (datos de los destinos, del orden de unas decenas de KB en total), sin base de datos.
 */
import type { QuestionnaireAnswers, Route, TransportContext } from '../../../lib/types'
import type { Reservation } from '../../../lib/bookings'
import { runGeneration, type GenerationResumeState } from '../../../lib/routeGenerationOrchestrator'
import { mapGeneratedRouteToRoute } from '../../../lib/mapGeneratedRoute'
import { propuestaDeVuelos } from '../../../lib/adaptarVuelos'
import { datosParaMotor } from '../../../lib/llegadaVuelta'
import { fetchArrivalInfo, medioOf, minutesToHHMM, type ArrivalPoint } from '../../../lib/arrivalReturn'
import { reservasParaMotor } from '../../../lib/engineReservas'
import type { AvisoDelMotor, PlanLlegada, PlanVuelta } from '../../../lib/planLlegadaVuelta'

export const DESTINOS_DEL_PROBADOR = ['Roma', 'Lanzarote'] as const
export type DestinoDelProbador = (typeof DESTINOS_DEL_PROBADOR)[number]

/** El Free Tour del caso: 'no' = sin Free Tour; 'sin_hora' = con Free Tour sin hora reservada; 'HH:MM' = con esa hora reservada. */
export type FreeTourDelCaso = 'no' | 'sin_hora' | string

export const HORAS_DE_FREE_TOUR = ['10:00', '12:00', '15:00', '17:00', '19:00', '21:00'] as const

export interface CasoProbador {
  destino: DestinoDelProbador
  /** Días del viaje por fechas (el último es el de la vuelta), como el «4 días» del viaje de pruebas de siempre. */
  dias: number
  /** Primer día, AAAA-MM-DD. */
  inicio: string
  /** Hora de llegada (HH:MM) o '' = sin vuelo de llegada. */
  llegada: string
  /** Hora de salida (HH:MM) o '' = sin vuelo de vuelta. */
  salida: string
  /** El punto de llegada y de vuelta (aeropuerto), por su id; '' = el que elige el motor (el del traslado más largo). */
  punto: string
  freeTour: FreeTourDelCaso
}

/** Cómo se prepara cada destino: fechas de ejemplo, nombre de su Free Tour (el de `default_free_tour.name` del destino) y su transporte. */
const DATOS_DE_DESTINO: Record<DestinoDelProbador, { inicio: string; dias: number; freeTour: string; pais: string; coche: boolean }> = {
  Roma: { inicio: '2027-05-04', dias: 4, freeTour: 'Free Tour por Roma', pais: 'it', coche: false },
  Lanzarote: { inicio: '2027-03-07', dias: 6, freeTour: 'Free Tour por Teguise', pais: 'es', coche: true },
}

export const casoPorDefecto = (destino: DestinoDelProbador = 'Roma'): CasoProbador => ({ destino, dias: DATOS_DE_DESTINO[destino].dias, inicio: DATOS_DE_DESTINO[destino].inicio, llegada: '14:00', salida: '', punto: '', freeTour: 'no' })

/** Los casos con un toque: solo cambian las horas y el Free Tour (el destino, los días, la fecha y el punto se quedan como estén). */
export const CASOS_RAPIDOS: { id: string; texto: string; cambia: Pick<CasoProbador, 'llegada' | 'salida' | 'freeTour'> }[] = [
  { id: 'llegada-0900', texto: 'Llegada 9:00', cambia: { llegada: '09:00', salida: '', freeTour: 'no' } },
  { id: 'llegada-1400', texto: 'Llegada 14:00', cambia: { llegada: '14:00', salida: '', freeTour: 'no' } },
  { id: 'llegada-2100', texto: 'Llegada 21:00', cambia: { llegada: '21:00', salida: '', freeTour: 'no' } },
  { id: 'salida-1000', texto: 'Salida 10:00', cambia: { llegada: '', salida: '10:00', freeTour: 'no' } },
  { id: 'salida-1800', texto: 'Salida 18:00', cambia: { llegada: '', salida: '18:00', freeTour: 'no' } },
  { id: 'llegada-1600-ft-1700', texto: 'Llegada 16:00 + Free Tour 17:00 reservado', cambia: { llegada: '16:00', salida: '', freeTour: '17:00' } },
  { id: 'llegada-1800-ft-sin-hora', texto: 'Llegada 18:00 + Free Tour sin hora', cambia: { llegada: '18:00', salida: '', freeTour: 'sin_hora' } },
]

export interface ResultadoProbador {
  antes: Route
  despues: Route
  /** Lo que ha decidido el motor y por qué, en una línea. */
  linea: string
  /** Por qué camino salió el «después»: el botón Reorganizar (`propuestaDeVuelos`) o la generación desde cero (Free Tour con hora). */
  camino: 'reorganizar' | 'generacion' | 'sin-vuelos'
}

/** Los aeropuertos (o puntos de llegada) del destino, de sus datos de llegada y vuelta (`/api/arrival-info`, `src/lib/arrivalReturn.ts`). */
export async function puntosDeLlegada(destino: DestinoDelProbador): Promise<ArrivalPoint[]> {
  const info = await fetchArrivalInfo(destino).catch(() => null)
  return info ? (medioOf(info, 'avion')?.puntos ?? []) : []
}

const sumarDias = (iso: string, n: number): string => {
  const f = new Date(`${iso}T12:00:00Z`)
  f.setUTCDate(f.getUTCDate() + n)
  return f.toISOString().slice(0, 10)
}

function contextoDeTransporte(coche: boolean): TransportContext {
  return {
    archetype: null,
    is_region: null,
    transport_option: null,
    vehicle_type: coche ? 'car' : null,
    vehicle_ownership: coche ? 'rental' : null,
    accommodation_mode: null,
    travel_mode: null,
    pase_dominante: null,
    vehiculo_altamente_recomendado: false,
    travel_pass_confirmed: null,
  }
}

const respuestasDe = (caso: CasoProbador): QuestionnaireAnswers => ({
  origin: 'Madrid',
  days: caso.dias,
  dateRange: { start: caso.inicio, end: sumarDias(caso.inicio, caso.dias - 1) },
  month: Number(caso.inicio.slice(5, 7)) - 1,
  companion: 'couple',
  experiences: [],
  experiencesPositive: caso.freeTour === 'no' ? ['imprescindibles'] : ['imprescindibles', 'free_tour'],
  experiencesNegative: [],
  chronotype: 'normal',
  budgetLevel: 'comfortable',
  ...(DATOS_DE_DESTINO[caso.destino].coche ? { coche: 'alquiler' as const } : {}),
})

/** La misma generación que hace la app al terminar el formulario, en modo aislado (no lee ni escribe el estado, ni la caché de rutas). */
async function generar(caso: CasoProbador, aislado: { reservas: ReturnType<typeof reservasParaMotor>; vuelo: ReturnType<typeof datosParaMotor> }): Promise<Route> {
  const respuestas = respuestasDe(caso)
  const contexto = contextoDeTransporte(DATOS_DE_DESTINO[caso.destino].coche)
  let final: GenerationResumeState | null = null
  await runGeneration({ destination: caso.destino, answers: respuestas, transportContext: contexto, mustIncludePlaces: [], aislado }, null, async (cp) => {
    if (cp.phase === 'done') final = cp
  })
  if (!final) throw new Error(`El motor no ha devuelto la ruta de ${caso.destino}.`)
  const ruta = mapGeneratedRouteToRoute((final as GenerationResumeState).generated, caso.destino, respuestas, contexto)
  ruta.id = 'probador-reorganizar'
  ruta.createdAt = new Date().toISOString()
  for (const dia of ruta.days) if (!dia.countryCode) dia.countryCode = DATOS_DE_DESTINO[caso.destino].pais
  return ruta
}

/** La reserva del Free Tour a la hora del caso, en la forma que el motor lee (`reservasParaMotor`): el día 1, con su fecha. */
function reservaDelFreeTour(caso: CasoProbador): ReturnType<typeof reservasParaMotor> {
  if (!/^\d{1,2}:\d{2}$/.test(caso.freeTour)) return []
  return [{ placeNames: [DATOS_DE_DESTINO[caso.destino].freeTour], dateIso: caso.inicio, dayNumber: null, time: caso.freeTour }]
}

const conVuelos = (ruta: Route, caso: CasoProbador): Route => ({
  ...ruta,
  arrivalFlightTime: caso.llegada || null,
  departureFlightTime: caso.salida || null,
  arrivalPointId: caso.punto || null,
  departurePointId: caso.punto || null,
})

const sinDoble = (texto: string): string => texto.replace(/\{dia:(\d+)\}/g, 'el día $1').replace(/\s+/g, ' ').trim()
const textoDelAviso = (aviso: AvisoDelMotor): string => sinDoble(aviso.texto)

/**
 * LA LÍNEA DEL MOTOR: lo que ha decidido y por qué, con lo que el motor dice de la llegada (`PlanLlegada`) y de la vuelta (`PlanVuelta`). Sin inventar nada: si el motor no da texto, los campos públicos tal cual
 * (caso, fila, Free Tour, qué día pasa o se cae).
 */
export function lineaDelMotor(llegada: PlanLlegada | null | undefined, vuelta: PlanVuelta | null | undefined, extra: string[] = []): string {
  const partes: string[] = []
  if (llegada) {
    const interno = llegada.interno as { horaUtilMin?: number } | undefined
    const cabeza = [llegada.entrada ? `Llegas a las ${llegada.entrada.hora}${llegada.entrada.punto ? ` (${llegada.entrada.punto})` : ''}` : 'Llegada', typeof interno?.horaUtilMin === 'number' ? `libre a las ${minutesToHHMM(interno.horaUtilMin)}` : null].filter(Boolean).join(', ')
    partes.push(`${cabeza}${llegada.caso ? `: ${llegada.caso}` : ''}${llegada.fila ? ` (fila ${(llegada.fila as { desde?: string }).desde ?? '?'}–${(llegada.fila as { hasta?: string | null }).hasta ?? '?'})` : ''}`)
    if (llegada.pasa_al_dia_2) partes.push('el día 1 pasa al día 2')
    if (llegada.dia_caido) partes.push(`se cae ${llegada.dia_caido.nombre ?? llegada.dia_caido.id} (${llegada.dia_caido.motivo})`)
    if (llegada.free_tour) partes.push(`Free Tour ${llegada.free_tour.sin_hora ? 'sin hora, puesto ' : ''}${llegada.free_tour.hora ? `a las ${llegada.free_tour.hora} ` : ''}el día ${llegada.free_tour.dia}`)
    for (const resumen of llegada.resumen ?? []) partes.push(sinDoble(resumen.texto))
    for (const aviso of llegada.avisos ?? []) partes.push(`aviso: ${textoDelAviso(aviso)}`)
  }
  if (vuelta && vuelta.activo !== false) {
    partes.push(`Vuelta${vuelta.hora ? ` a las ${vuelta.hora}` : ''}${vuelta.madrugada ? ' (madrugada)' : ''}${vuelta.lleva ? `: ${vuelta.lleva}` : ''}`)
    for (const aviso of vuelta.avisos ?? []) partes.push(`aviso: ${textoDelAviso(aviso)}`)
  }
  partes.push(...extra)
  return partes.length > 0 ? partes.join(' · ') : 'El motor no da ninguna decisión para este caso (sin vuelos).'
}

/** Prueba un caso. Tarda lo que tarda el motor (unos segundos por viaje). Lanza un Error con el motivo si el motor no responde. */
export async function probar(caso: CasoProbador): Promise<ResultadoProbador> {
  const sinVuelo = { reservas: reservaDelFreeTour(caso), vuelo: {} }
  const antes = await generar(caso, sinVuelo)
  if (!caso.llegada && !caso.salida) return { antes, despues: antes, linea: lineaDelMotor(null, null, ['sin vuelos: no hay nada que reorganizar']), camino: 'sin-vuelos' }

  const conPuntos = conVuelos(antes, caso)
  // El Free Tour a una hora reservada: solo lo mira la generación desde cero (en la app, el rehacer el viaje con sus reservas); el resto, el botón Reorganizar.
  if (/^\d{1,2}:\d{2}$/.test(caso.freeTour)) {
    const info = await fetchArrivalInfo(caso.destino).catch(() => null)
    const vuelo = datosParaMotor(conPuntos, [], info, { paraAvisos: true, coche: null })
    const generado = await generar(caso, { reservas: reservaDelFreeTour(caso), vuelo })
    const despues = conVuelos(generado, caso)
    return { antes, despues, linea: lineaDelMotor(despues.planLlegada, despues.planVuelta), camino: 'generacion' }
  }
  const propuesta = await propuestaDeVuelos(conPuntos, [] as Reservation[], { pase: true, coche: null })
  if (!propuesta) return { antes, despues: conPuntos, linea: 'El motor no rehace este viaje (no es un viaje de días escritos).', camino: 'reorganizar' }
  const cambiados = new Map(propuesta.dias.map((dia) => [dia.dayId, dia]))
  const despues: Route = {
    ...conPuntos,
    days: conPuntos.days.map((dia) => (cambiados.has(dia.id) ? { ...cambiados.get(dia.id)!.next, originalSnapshot: null } : dia)),
    ...(propuesta.planes.llegada !== undefined ? { planLlegada: propuesta.planes.llegada } : {}),
    ...(propuesta.planes.vuelta !== undefined ? { planVuelta: propuesta.planes.vuelta } : {}),
  }
  const extra = [propuesta.dias.length > 0 ? `Reorganizar cambia ${propuesta.dias.length === 1 ? '1 día' : `${propuesta.dias.length} días`} (${propuesta.dias.map((dia) => `día ${dia.dayNumber}`).join(', ')})` : 'Reorganizar no cambia ningún día']
  const noCaben = propuesta.dias.flatMap((dia) => dia.noCaben ?? []).filter((x) => x.imprescindible !== false)
  if (noCaben.length > 0) extra.push(`no caben: ${noCaben.map((x) => x.nombre).join(', ')}`)
  return { antes, despues, linea: lineaDelMotor(propuesta.planes.llegada, propuesta.planes.vuelta, extra), camino: 'reorganizar' }
}
