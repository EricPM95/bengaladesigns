import type { DayPlan, Stop } from './types'
import { useRouteStore } from '../store/useRouteStore'
import { cambiarConDeshacer, useAddFlowStore } from '../store/useAddFlowStore'
import { alDia } from './nombreDeDia'
import { dondeQueda, sinSuFranja } from './dondeQuedaLaParada'

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

/** Pone (o quita, con undefined) la franja de una parada, sin pasar por las acciones que se niegan con una parada reservada: la franja es del día, no de la parada (10N8, 3f). */
export function ponerFranjaDeLaParada(dayId: string, stopId: string, franja: Stop['franja']): void {
  useRouteStore.setState((state) =>
    state.route
      ? { route: { ...state.route, days: state.route.days.map((day) => (day.id !== dayId ? day : { ...day, stops: day.stops.map((s) => (s.id === stopId ? { ...s, franja } : s)) })) } }
      : state,
  )
}

/**
 * Lleva al viajero a una parada: abre DÍAS en ese día, baja hasta ella y la marca un momento (`focusStopId`, que `DayDetailPanel` atiende). Se usa al pasar una parada a otro día y al añadir un sitio (10N8, 3f).
 */
export function llevarALaParada(dayId: string, stopId: string | null): void {
  const store = useRouteStore.getState()
  useAddFlowStore.setState({ addFlow: null, focusStopId: stopId })
  store.setMode('days')
  store.setActiveDayId(dayId)
}

/**
 * «Mover a otro día» (el menú «···» de DÍAS y la hoja de HOY): la parada pasa a ese día, sin quitar nada, con [Deshacer]. (10N8, 3f) Dónde queda lo dice `dondeQueda` (el Free Tour de primero por la mañana; lo
 * demás de primero sin pase y donde mejor encaja con pase) y la parada NO se lleva su franja: entra en la que le toque. Después, la app lleva al viajero hasta ella. Devuelve false si no hay ruta.
 */
export function moverParadaAOtroDia(stopId: string, deDiaId: string, aDiaId: string, opciones: { llevar?: boolean; conPase?: boolean } = {}): boolean {
  const { route, moveStopToDay } = useRouteStore.getState()
  if (!route) return false
  const destino = route.days.find((day) => day.id === aDiaId)
  const parada = route.days.find((day) => day.id === deDiaId)?.stops.find((s) => s.id === stopId)
  cambiarConDeshacer(destino ? `Movida ${alDia(route, destino.dayNumber)}` : 'Movida', () => {
    moveStopToDay(stopId, deDiaId, aDiaId)
    const state = useRouteStore.getState()
    const dia = state.route?.days.find((day) => day.id === aDiaId)
    if (!dia || !parada || !dia.stops.some((s) => s.id === stopId)) return
    const sin: DayPlan = { ...dia, stops: dia.stops.filter((s) => s.id !== stopId) }
    const { indice } = dondeQueda(state.route!, sin, parada, { conPase: opciones.conPase })
    const orden = sin.stops.map((s) => s.id)
    orden.splice(Math.min(indice, orden.length), 0, stopId)
    state.reorderStops(aDiaId, orden)
    ponerFranjaDeLaParada(aDiaId, stopId, sinSuFranja(sin, parada, Math.min(indice, orden.length - 1)).franja)
  })
  if (opciones.llevar === true) llevarALaParada(aDiaId, stopId)
  return true
}

/**
 * (10N8, 3f) Pone una parada NUEVA en un día donde dice `dondeQueda` (el Free Tour de primero por la mañana; lo demás de primero sin pase y donde mejor encaja con pase), sin la franja que traiga. Si entra
 * de primera, coge la hora de la que era primera y las de detrás se empujan lo justo si se pisan. Sin aviso ni [Deshacer]: eso lo pone quien llama. Devuelve el id de la parada, o null si no hay ese día.
 */
export function ponerParadaEnElDia(dayId: string, parada: Stop, opciones: { conPase?: boolean } = {}): string | null {
  const state = useRouteStore.getState()
  const route = state.route
  const dia = route?.days.find((d) => d.id === dayId)
  if (!route || !dia) return null
  const { indice } = dondeQueda(route, dia, parada, opciones)
  const conFranja = sinSuFranja(dia, parada, indice)
  const hora = indice === 0 && dia.stops[0] ? dia.stops[0].time : conFranja.time
  state.insertStopAt(dayId, indice, { ...conFranja, time: hora, addedByUser: parada.addedByUser ?? true })
  if (indice === 0 && dia.stops.length > 0) {
    const ahora = useRouteStore.getState().route?.days.find((d) => d.id === dayId)
    if (ahora) useRouteStore.getState().reorderStops(dayId, ahora.stops.map((s) => s.id))
  }
  return parada.id
}
