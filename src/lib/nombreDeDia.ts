import { addDaysToIso } from './dateRange'
import { weekdayNameEs } from './stopHoursTag'
import type { Route } from './types'

/**
 * EL NOMBRE DE UN DÍA (tanda 6z3, punto 5). Una sola regla, en un solo sitio:
 *  - CON fechas del viaje (`answers.dateRange.start`), el día se llama por su fecha: nunca se ve «Día 1», «Día 2»…
 *  - SIN fechas (solo el mes), todo como siempre: «Día 1», «el día 2».
 * Todo texto visible que nombre un día llama a estas funciones (sin React: se prueban solas).
 *
 * `fuente` es la ruta o, si solo se tiene eso, el primer día del viaje (yyyy-mm-dd).
 */
export type FuenteDeFechas = Pick<Route, 'answers'> | string | null | undefined

const SEMANA_CORTA = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb']

function inicioDe(fuente: FuenteDeFechas): string | null {
  if (!fuente) return null
  if (typeof fuente === 'string') return fuente
  return fuente.answers?.dateRange?.start ?? null
}

/** ¿El viaje tiene fechas? */
export function tieneFechas(fuente: FuenteDeFechas): boolean {
  return inicioDe(fuente) !== null
}

/** La fecha ISO (yyyy-mm-dd) de un día del viaje, o null si el viaje no tiene fechas. */
export function fechaDelDia(fuente: FuenteDeFechas, dayNumber: number): string | null {
  const inicio = inicioDe(fuente)
  return inicio ? addDaysToIso(inicio, dayNumber - 1) : null
}

function diaDeLaSemana(dateIso: string): number {
  const [anio, mes, dia] = dateIso.split('-').map(Number)
  return new Date(Date.UTC(anio, mes - 1, dia)).getUTCDay()
}

/** La ficha de la fecha («LUN» arriba y «13» debajo), o null sin fechas (entonces va el número del día). */
export function fichaDelDia(fuente: FuenteDeFechas, dayNumber: number): { semana: string; numero: string } | null {
  const iso = fechaDelDia(fuente, dayNumber)
  if (!iso) return null
  return { semana: SEMANA_CORTA[diaDeLaSemana(iso)].toUpperCase(), numero: String(Number(iso.slice(8, 10))) }
}

/** «lun 13» para una fecha ISO cualquiera (la de una reserva, la de un tramo de ida o vuelta). */
export function fechaCorta(dateIso: string): string {
  return `${SEMANA_CORTA[diaDeLaSemana(dateIso)]} ${Number(dateIso.slice(8, 10))}`
}

/** Forma corta, para fichas y etiquetas: «lun 13» (sin fechas, «Día 2»). */
export function diaCorto(fuente: FuenteDeFechas, dayNumber: number): string {
  const iso = fechaDelDia(fuente, dayNumber)
  return iso ? fechaCorta(iso) : `Día ${dayNumber}`
}

/** Forma larga SIN artículo, para prosa: «martes 14» (sin fechas, «día 2»). Con el artículo delante: `elDia`, `alDia`, `delDia`, `tuDia`. */
export function diaProsa(fuente: FuenteDeFechas, dayNumber: number): string {
  const iso = fechaDelDia(fuente, dayNumber)
  if (!iso) return `día ${dayNumber}`
  return `${weekdayNameEs(diaDeLaSemana(iso))} ${Number(iso.slice(8, 10))}`
}

/** «el martes 14» / «el día 2». */
export function elDia(fuente: FuenteDeFechas, dayNumber: number): string {
  return `el ${diaProsa(fuente, dayNumber)}`
}

/** «El martes 14» / «El día 2», para empezar una frase. */
export function ElDia(fuente: FuenteDeFechas, dayNumber: number): string {
  return `El ${diaProsa(fuente, dayNumber)}`
}

/** «al martes 14» / «al día 2». */
export function alDia(fuente: FuenteDeFechas, dayNumber: number): string {
  return `al ${diaProsa(fuente, dayNumber)}`
}

/** «del martes 14» / «del día 2». */
export function delDia(fuente: FuenteDeFechas, dayNumber: number): string {
  return `del ${diaProsa(fuente, dayNumber)}`
}

/** «tu martes 14» / «tu día 2». */
export function tuDia(fuente: FuenteDeFechas, dayNumber: number): string {
  return `tu ${diaProsa(fuente, dayNumber)}`
}

/** Con la inicial en mayúscula, para el principio de una frase o una etiqueta: «Martes 14» / «Día 2». */
export function diaTitulo(fuente: FuenteDeFechas, dayNumber: number): string {
  const texto = diaProsa(fuente, dayNumber)
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}
