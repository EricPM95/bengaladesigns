import type { DayPlan } from './types'
import type { Recomendacion } from './aplicarRecomendacion'
import { fechaDelDia } from './nombreDeDia'
import { indiceDeDestino, cambiosDeUnaPropuesta, type CambioPropuesto } from './propuesta'
import { paradaQueSustituye } from './cambiarParada'
import { puente } from './recomendacionesViaje'
import { useRouteStore } from '../store/useRouteStore'
import { useSyncStore } from '../store/useSyncStore'

/**
 * ACEPTAR O RECHAZAR UNA PROPUESTA, CAMBIO A CAMBIO (Tanda 10N, apartado 6). Lo hace el administrador o quien puede editar.
 *   · Aceptar un cambio lo pone en la ruta DE VERDAD con las acciones de siempre (quitar, mover, añadir, cambiar…), así que la varita sigue funcionando y las horas se recalculan.
 *   · Se coloca justo donde decía (detrás de la misma parada); si ese día cambió y esa parada ya no está, donde mejor encaje (`indiceDeDestino`: la lógica de «+ Añadir», de la 10O).
 *   · Si dos la miran a la vez, vale lo que decida el primero: antes de decidir se mira lo ya decidido y, si ese cambio ya tiene respuesta, no se vuelve a decidir.
 */

export type Decision = 'aceptado' | 'rechazado'

export interface ResultadoDeAplicar {
  ok: boolean
  /** Lo que ha pasado si no se ha podido, o una nota («esa parada ya no está»). */
  nota?: string
}

const diaDe = (id: string | undefined) => useRouteStore.getState().route?.days.find((d) => d.id === id)
const dondeEsta = (stopId: string | undefined) => useRouteStore.getState().route?.days.find((d) => d.stops.some((s) => s.id === stopId))
const fecha = (d: DayPlan) => {
  const route = useRouteStore.getState().route
  return route ? fechaDelDia(route, d.dayNumber) : null
}

/** Pone UN cambio en la ruta de ahora (la del administrador), con las acciones de siempre del almacén. */
export function aplicarCambioReal(c: CambioPropuesto): ResultadoDeAplicar {
  const s = useRouteStore.getState()
  if (!s.route) return { ok: false, nota: 'No hay ninguna ruta abierta.' }
  if (c.tipo === 'quitar') {
    const d = dondeEsta(c.antes?.id)
    if (!d) return { ok: true, nota: 'Esa parada ya no está en tu ruta.' }
    s.removeStop(d.id, c.antes!.id)
    return { ok: true }
  }
  if (c.tipo === 'anadir') {
    const d = diaDe(c.dayId)
    if (!d || !c.despues) return { ok: false, nota: 'Ese día ya no existe en tu viaje.' }
    if (d.stops.some((x) => x.name === c.despues!.name)) return { ok: true, nota: 'Esa parada ya está en ese día.' }
    s.insertStopAt(d.id, indiceDeDestino(d, c.despues, c.despuesDeId, fecha(d)), { ...c.despues, addedByUser: true })
    return { ok: true }
  }
  if (c.tipo === 'cambiar') {
    const d = diaDe(c.dayId) ?? dondeEsta(c.antes?.id)
    const vieja = d?.stops.find((x) => x.id === c.antes?.id)
    if (!d || !vieja || !c.despues) return { ok: false, nota: 'La parada que querían cambiar ya no está.' }
    if (d.stops.some((x) => x.name === c.despues!.name)) return { ok: true, nota: 'Esa parada ya está en ese día.' }
    s.replaceStop(d.id, vieja.id, paradaQueSustituye(vieja, { ...c.despues, addedByUser: true }))
    return { ok: true }
  }
  if (c.tipo === 'mover') {
    const d = diaDe(c.dayId)
    const stop = d?.stops.find((x) => x.id === c.despues?.id)
    if (!d || !stop) return { ok: true, nota: 'Esa parada ya no está en ese día.' }
    const sin: DayPlan = { ...d, stops: d.stops.filter((x) => x.id !== stop.id) }
    const orden = sin.stops.map((x) => x.id)
    orden.splice(indiceDeDestino(sin, stop, c.despuesDeId, fecha(d)), 0, stop.id)
    s.reorderStops(d.id, orden)
    return { ok: true }
  }
  if (c.tipo === 'mover_dia') {
    const origen = dondeEsta(c.despues?.id)
    const destino = diaDe(c.dayId)
    const stop = origen?.stops.find((x) => x.id === c.despues?.id)
    if (!origen || !stop) return { ok: true, nota: 'Esa parada ya no está en tu ruta.' }
    if (!destino) return { ok: false, nota: 'El día al que la llevaban ya no existe en tu viaje.' }
    if (origen.id === destino.id) return aplicarCambioReal({ ...c, tipo: 'mover' })
    const idx = indiceDeDestino(destino, stop, c.despuesDeId, fecha(destino))
    s.moveStopToDay(stop.id, origen.id, destino.id)
    const ahora = diaDe(destino.id)
    if (!ahora?.stops.some((x) => x.id === stop.id)) return { ok: false, nota: 'Esa parada está reservada y no se puede mover.' }
    const orden = ahora.stops.filter((x) => x.id !== stop.id).map((x) => x.id)
    orden.splice(Math.min(idx, orden.length), 0, stop.id)
    s.reorderStops(destino.id, orden)
    return { ok: true }
  }
  if (c.tipo === 'dia_nuevo' && c.dia) {
    const r = s.aplicarRecomendacion({ tipo: 'dia', payload: { accion: 'anadir', day: c.dia } })
    return r.ok ? { ok: true } : { ok: false, nota: r.motivo }
  }
  return { ok: false, nota: 'No entiendo ese cambio.' }
}

/** Lo ya decidido de una propuesta, mezclando lo que sabe esta app y lo que dice el servidor (si dos deciden a la vez, vale el primero). */
async function decididoAhora(rec: Recomendacion): Promise<Record<string, Decision>> {
  const remoto = await puente.leerDecisiones(rec.id).catch(() => null)
  return { ...(rec.decisiones ?? {}), ...(remoto ?? {}) }
}

export type ResultadoDeDecidir = { estado: 'hecho'; decisiones: Record<string, Decision>; nota?: string } | { estado: 'ya_decidido'; decisiones: Record<string, Decision> } | { estado: 'error'; mensaje: string }

/**
 * Decide UN cambio de una propuesta. Aceptado: se pone en la ruta (antes de guardar la decisión, para no dar por aceptado lo que no se pudo poner). Rechazado: solo se guarda.
 * Cuando ya está todo decidido, la propuesta queda aceptada (si se aceptó alguno) o rechazada.
 */
export async function decidirCambio(rec: Recomendacion, cambio: CambioPropuesto, decision: Decision): Promise<ResultadoDeDecidir> {
  const abierto = useSyncStore.getState().activeTripId
  if (abierto && abierto !== rec.tripId) return { estado: 'error', mensaje: 'Abre primero ese viaje para decidir.' }
  const previas = await decididoAhora(rec)
  if (previas[cambio.id]) return { estado: 'ya_decidido', decisiones: previas }
  let nota: string | undefined
  if (decision === 'aceptado') {
    const r = aplicarCambioReal(cambio)
    if (!r.ok) return { estado: 'error', mensaje: r.nota ?? 'No se ha podido poner ese cambio.' }
    nota = r.nota
  }
  const decisiones = { ...previas, [cambio.id]: decision }
  const todos = cambiosDeUnaPropuesta(rec.payload)
  const terminado = todos.every((c) => decisiones[c.id])
  const estado = terminado ? (Object.values(decisiones).some((d) => d === 'aceptado') ? 'aceptada' : 'rechazada') : null
  const error = await puente.guardarDecisiones(rec.id, decisiones, estado)
  if (error) return { estado: 'error', mensaje: error }
  return { estado: 'hecho', decisiones, nota }
}

/** [Aceptar todos]: acepta, en el orden de la lista, todos los cambios que aún no tienen respuesta. */
export async function aceptarTodos(rec: Recomendacion): Promise<{ decisiones: Record<string, Decision>; fallos: string[] }> {
  let decisiones = await decididoAhora(rec)
  const fallos: string[] = []
  for (const c of cambiosDeUnaPropuesta(rec.payload)) {
    if (decisiones[c.id]) continue
    const r = await decidirCambio({ ...rec, decisiones }, c, 'aceptado')
    if (r.estado === 'hecho') decisiones = r.decisiones
    else if (r.estado === 'ya_decidido') decisiones = r.decisiones
    else fallos.push(r.mensaje)
  }
  return { decisiones, fallos }
}
