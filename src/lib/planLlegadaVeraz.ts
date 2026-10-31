import type { DayPlan, Route } from './types'
import type { AvisoDelMotor, PlanLlegada, ResumenDelMotor } from './planLlegadaVuelta'

/**
 * (Tanda 10S7c) EL PLAN DE LLEGADA DICE LO QUE DE VERDAD HA PASADO.
 * El motor calcula el plan de la llegada («la Roma antigua pasa al día 2», «el Foro no cabe en tu viaje», «el Coliseo lo tienes en “Si te sobra tiempo” del día 1») como si rehiciera la ruta entera con la
 * llegada de ahora, y eso era verdad solo cuando la ruta salía de ahí. Pero desde la 10S7b los vuelos no rehacen la ruta (solo se adapta el primer y el último día, y los demás no se tocan): la ruta REAL
 * puede no haber movido nada. Aquí se contrasta cada frase con la ruta real y las que no se cumplen se omiten (no se cambia lo que da el motor ni la generación).
 *  - `dia_corrido` («X pasa al día 2»): solo si el día 2 de la ruta ES de verdad ese día escrito (`curatedId`).
 *  - `dia_caido` («X no cabe en tu viaje»): solo si ese día escrito no está en ningún día de la ruta.
 *  - `sitio_en_si_te_sobra`: solo si ese sitio está de verdad en «Si te sobra tiempo» de ese día.
 * Con un día sin `curatedId` (no se puede comprobar) la frase se omite: mejor callar que decir algo que no ha pasado.
 */

const limpio = (texto: unknown): string => (typeof texto === 'string' ? texto : texto && typeof texto === 'object' && typeof (texto as { name?: unknown }).name === 'string' ? (texto as { name: string }).name : '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()

function ciudad(route: Route): DayPlan[] {
  return route.days.filter((day) => !day.isReturnLeg)
}

function diaCorridoEsVerdad(route: Route, item: ResumenDelMotor): boolean {
  const id = typeof item.dia_id === 'string' ? item.dia_id : null
  if (!id) return false
  const segundo = ciudad(route).find((day) => day.dayNumber === 2)
  return Boolean(segundo?.curatedId) && segundo?.curatedId === id
}

function diaCaidoEsVerdad(route: Route, item: ResumenDelMotor): boolean {
  const id = typeof item.dia_id === 'string' ? item.dia_id : null
  if (!id) return false
  const dias = ciudad(route)
  if (!dias.some((day) => day.curatedId)) return false
  return !dias.some((day) => day.curatedId === id)
}

function sobraEsVerdad(route: Route, plan: PlanLlegada, aviso: AvisoDelMotor): boolean {
  const numero = typeof aviso.dayNumber === 'number' ? aviso.dayNumber : 1
  const dia = route.days.find((day) => day.dayNumber === numero)
  const sobran = new Set((dia?.spareStops ?? []).flatMap((stop) => [limpio(stop.name), limpio(stop.fullName)]).filter(Boolean))
  if (sobran.size === 0) return false
  const dejados = (plan.dejado_fuera ?? []).filter((fila) => (fila.dia ?? 1) === numero)
  return dejados.some((fila) => sobran.has(limpio(fila.lugar)) || sobran.has(limpio(fila.parada)))
}

/** El plan de llegada de la ruta con solo las frases que la ruta real cumple. null si no hay plan. */
export function planLlegadaVeraz(route: Route | null | undefined): PlanLlegada | null {
  const plan = route?.planLlegada
  if (!route || !plan) return null
  const corrido = (plan.resumen ?? []).some((item) => item.tipo === 'dia_corrido' && diaCorridoEsVerdad(route, item))
  const caido = (plan.resumen ?? []).some((item) => item.tipo === 'dia_caido' && diaCaidoEsVerdad(route, item))
  return {
    ...plan,
    pasa_al_dia_2: plan.pasa_al_dia_2 === true && corrido,
    dia_caido: plan.dia_caido && caido ? plan.dia_caido : null,
    dia_sustituido: corrido || caido ? (plan.dia_sustituido ?? null) : null,
    resumen: (plan.resumen ?? []).filter((item) => (item.tipo === 'dia_corrido' ? diaCorridoEsVerdad(route, item) : item.tipo === 'dia_caido' ? diaCaidoEsVerdad(route, item) : true)),
    avisos: (plan.avisos ?? []).filter((aviso) => (aviso.tipo === 'sitio_en_si_te_sobra' ? sobraEsVerdad(route, plan, aviso) : true)),
  }
}
