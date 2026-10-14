import type { DayPlan, Route } from './types'
import type { CambioDeVuelo } from './cambioDeVuelo'
import { botonesDe, vaALaCampana, type AvisoDelMotor, type ResumenDelMotor } from './planLlegadaVuelta'
import { diaCortoProsa } from './nombreDeDia'

/**
 * LA HOJA DEL RESUMEN (Tanda 7, punto 14): UNA sola hoja de abajo, al poner, cambiar o borrar una hora, un punto o la zona de los vuelos, con lo que ha cambiado. Todo el contenido sale de lo que el
 * motor devolvió al rehacer (`Route.planLlegada.resumen` y `.avisos`, `Route.planVuelta.resumen`): aquí solo se escriben las fechas de los días («el mar 10»; sin fechas, «el día 1») y se juntan las
 * frases. Ninguna hora calculada: las únicas horas son las del viajero, que ya vienen en los textos del motor. Las frases propias de la pantalla son dos: los días que el viajero cambió a mano y
 * «Al borrar los vuelos».
 */
export interface ItemDeResumen {
  id: string
  texto: string
  /** Botones propios de la frase (sin [De acuerdo], que cierra siempre la hoja). */
  botones: { id: string; texto: string }[]
}

export const TEXTO_AL_BORRAR = 'Tus días vuelven a ser enteros. Tus reservas se quedan donde estaban.'

/** «El jue 12 lo has cambiado tú: lo dejamos como está.» */
export const textoDiaCambiadoATu = (route: Pick<Route, 'answers'>, dayNumber: number): string => `El ${diaCortoProsa(route, dayNumber)} lo has cambiado tú: lo dejamos como está.`

/** Pone la fecha de cada día donde el motor dejó `{dia:N}`: «mar 10» con fechas y «día 2» sin ellas. */
export function conFechasDeLosDias(texto: string, route: Pick<Route, 'answers'>): string {
  return texto.replace(/\{dia:(\d+)\}/g, (_, numero: string) => diaCortoProsa(route, Number(numero)))
}

/** La plantilla de la vuelta («{dia} tienes una última mañana…»): `{dia}` va al principio de la frase, con su artículo («El sáb 14»). */
export function textoDeLaVuelta(plantilla: string, route: Pick<Route, 'answers'>, dayNumber: number): string {
  return plantilla.replace('{dia}', `El ${diaCortoProsa(route, dayNumber)}`)
}

const sinDeAcuerdo = (botones: ReturnType<typeof botonesDe>) => botones.filter((boton) => boton.id !== 'de_acuerdo')

function desdeResumen(item: ResumenDelMotor, route: Route, indice: number): ItemDeResumen {
  return { id: `res:${item.tipo}:${indice}`, texto: conFechasDeLosDias(item.texto, route), botones: sinDeAcuerdo(botonesDe(item.botones)) }
}

function desdeAviso(aviso: AvisoDelMotor, route: Route, indice: number): ItemDeResumen {
  return { id: `avi:${aviso.tipo}:${indice}`, texto: conFechasDeLosDias(aviso.texto, route), botones: sinDeAcuerdo(botonesDe(aviso.botones)) }
}

/**
 * Las frases de la hoja, en este orden: lo de la llegada (su día, la madrugada, el día que se corre, el que se cae, el Free Tour, lo que queda en «Si te sobra tiempo»), lo de la vuelta (su última
 * mañana), los días que el viajero cambió a mano y, al borrar, «Tus días vuelven a ser enteros…». Solo habla de la mitad que ha cambiado (la zona cambia las dos). Vacío = nada que contar.
 * `mantenidos`: los días que el viajero cambió a mano y el rehacer dejó como estaban.
 */
export function construirResumen({ route, cambios, mantenidos }: { route: Route; cambios: CambioDeVuelo[]; mantenidos: DayPlan[] }): ItemDeResumen[] {
  const mitades = new Set<'arrival' | 'departure'>()
  for (const cambio of cambios) {
    if (cambio.mitad) mitades.add(cambio.mitad)
    else {
      mitades.add('arrival')
      mitades.add('departure')
    }
  }
  const items: ItemDeResumen[] = []
  const quitado = cambios.some((cambio) => cambio.que === 'quitar')

  if (mitades.has('arrival') && route.planLlegada) {
    ;(route.planLlegada.resumen ?? []).forEach((item, indice) => items.push(desdeResumen(item, route, indice)))
    // Los avisos de la hoja (no los de la campana): el Free Tour puesto, lo que queda en «Si te sobra tiempo»…
    ;(route.planLlegada.avisos ?? []).forEach((aviso, indice) => {
      if (!vaALaCampana(aviso)) items.push(desdeAviso(aviso, route, indice))
    })
  }
  if (mitades.has('departure') && route.planVuelta?.resumen) {
    const resumen = route.planVuelta.resumen
    items.push({ id: 'res:vuelta', texto: textoDeLaVuelta(resumen.plantilla, route, resumen.dayNumber), botones: [] })
  }
  for (const dia of mantenidos) items.push({ id: `mano:${dia.id}`, texto: textoDiaCambiadoATu(route, dia.dayNumber), botones: [] })
  if (quitado) items.push({ id: 'borrado', texto: TEXTO_AL_BORRAR, botones: [] })
  return items
}

/** Una firma de los días (nombres y horas de las paradas, comidas) para saber si el rehacer ha cambiado algo de verdad. */
export function firmaDeLosDias(route: Route | null | undefined): string {
  return JSON.stringify((route?.days ?? []).map((day) => [day.dayNumber, day.stops.map((stop) => `${stop.name}@${stop.time ?? ''}`), day.meals.map((meal) => `${meal.mealTime}@${meal.time ?? ''}`)]))
}
