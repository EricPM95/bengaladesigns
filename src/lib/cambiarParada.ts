import type { Stop } from './types'
import { useRouteStore } from '../store/useRouteStore'
import { cambiarConDeshacer } from '../store/useAddFlowStore'
import { alDia, fechaDelDia } from './nombreDeDia'
import { indiceDeDestino } from './propuesta'

/** Lo único que se queda del hueco de la parada que se cambia: su sitio en el día (su hora y su franja). */
const DEL_HUECO = new Set<string>(['time', 'franja'])

/**
 * «Cambiar parada» (Tanda 7, punto 16): lo que se le pasa a `replaceStop` para que el sitio nuevo ocupe el hueco de la parada vieja, en su día y a su hora.
 * `replaceStop` mezcla (`{ ...vieja, ...cambios }`), así que lo que traía la parada vieja y el sitio nuevo no dice (su aviso de «Por fuera», su horario, sus etiquetas, su ficha, su paseo hasta la siguiente…)
 * se borra aquí de forma expresa: si no, el sitio nuevo heredaría los datos de otro. Se queda su hora y su franja; la parada nueva sale como no saltada.
 */
export function paradaQueSustituye(vieja: Stop, nueva: Stop): Partial<Stop> {
  const borrar: Record<string, undefined> = {}
  for (const clave of Object.keys(vieja)) {
    if (!DEL_HUECO.has(clave) && !(clave in nueva)) borrar[clave] = undefined
  }
  return { ...borrar, ...nueva, time: vieja.time, ...(vieja.franja ? { franja: vieja.franja } : {}), saltada: false }
}

/** El aviso de «Deshacer» de «Cambiar parada»: «Cambiada por Castillo de Sant'Angelo» (corto: el aviso de abajo lo recorta a 375 px). */
export function mensajeDeCambiarParada(nueva: Pick<Stop, 'name'>): string {
  return `Cambiada por ${nueva.name}`
}

/**
 * EL ⇄ de «Cambiar parada»: el sitio nuevo sustituye a la parada en su día y a su hora, con [Deshacer] (`cambiarConDeshacer`: vuelve la ruta y todo lo reservado tal cual). Una parada reservada no se cambia
 * (la acción de siempre, `replaceStop`, no la toca). `sembrar` pone en el día sus paradas reales antes (no hace nada si ya las tiene).
 */
export function cambiarParadaPorOtra(dayId: string, vieja: Stop, nueva: Stop, sembrar?: () => void): void {
  cambiarConDeshacer(mensajeDeCambiarParada(nueva), () => {
    sembrar?.()
    useRouteStore.getState().replaceStop(dayId, vieja.id, paradaQueSustituye(vieja, nueva))
  })
}

/**
 * «Mover a otro día» (el menú «···» de DÍAS y la hoja de HOY): la parada pasa a ese día, más o menos a su hora, sin quitar nada, con [Deshacer].
 * Devuelve false si no hay ruta.
 */
export function moverParadaAOtroDia(stopId: string, deDiaId: string, aDiaId: string): boolean {
  const { route, moveStopToDay } = useRouteStore.getState()
  if (!route) return false
  const destino = route.days.find((day) => day.id === aDiaId)
  const parada = route.days.find((day) => day.id === deDiaId)?.stops.find((s) => s.id === stopId)
  // Tanda 10N: no va al final del día, sino donde menos hay que andar de más entre las paradas de al lado (la lógica de «+ Añadir», `mejorHuecoEnElDia`), nunca en medio de nada.
  const indice = destino && parada ? indiceDeDestino(destino, parada, undefined, fechaDelDia(route, destino.dayNumber)) : null
  cambiarConDeshacer(destino ? `Movida ${alDia(route, destino.dayNumber)}` : 'Movida', () => {
    moveStopToDay(stopId, deDiaId, aDiaId)
    if (indice === null) return
    const state = useRouteStore.getState()
    const dia = state.route?.days.find((day) => day.id === aDiaId)
    if (!dia?.stops.some((s) => s.id === stopId)) return
    const orden = dia.stops.filter((s) => s.id !== stopId).map((s) => s.id)
    orden.splice(Math.min(indice, orden.length), 0, stopId)
    state.reorderStops(aDiaId, orden)
  })
  return true
}
