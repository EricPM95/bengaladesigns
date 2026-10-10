import { addDaysToIso } from './dateRange'
import { hasRealCoordinates } from './distanceMock'
import { rainsInHours, type HourlyRain } from './rainForecast'
import type { Coordinates, Route } from './types'

/**
 * LA LLUVIA EN LA CAMPANA (Tanda 6z6e; gratis y de pago): un aviso por día del viaje cuando nuestro servidor dice que llueve ese día, en dos momentos: la víspera («Mañana llueve en Roma por la tarde») y el
 * mismo día («Hoy llueve en Roma por la tarde»). Solo hay aviso si hay previsión (si el servidor no responde, 0 avisos). Todo puro y sin pantalla; `useAppNotices` pide el tiempo y lo pasa aquí.
 */
export type FranjaDeLluvia = 'manana' | 'tarde' | 'noche'

/** Las horas de cada franja del día (la misma frontera de las 14:00 que el aviso de HOY). */
const HORAS_DE_FRANJA: Record<FranjaDeLluvia, number[]> = {
  manana: [8, 9, 10, 11, 12, 13],
  tarde: [14, 15, 16, 17, 18, 19, 20],
  noche: [21, 22, 23],
}

/** Las franjas del día en las que la previsión dice que llueve. */
export function franjasConLluvia(lluvia: HourlyRain): FranjaDeLluvia[] {
  return (Object.keys(HORAS_DE_FRANJA) as FranjaDeLluvia[]).filter((franja) => rainsInHours(lluvia, HORAS_DE_FRANJA[franja]))
}

/** «por la mañana», «por la tarde», «por la noche», «por la tarde y por la noche» o «todo el día» (llueve por la mañana y por la tarde, o en las tres). */
export function textoDeFranjas(franjas: FranjaDeLluvia[]): string {
  if (franjas.length === 0) return ''
  if (franjas.includes('manana') && franjas.includes('tarde')) return 'todo el día'
  const palabras: Record<FranjaDeLluvia, string> = { manana: 'por la mañana', tarde: 'por la tarde', noche: 'por la noche' }
  return franjas.map((franja) => palabras[franja]).join(' y ')
}

export interface DiaAMirar {
  dateIso: string
  cuando: 'hoy' | 'manana'
  ciudad: string
  coordenadas: Coordinates
}

/** Los días del viaje que son hoy o mañana (con fecha y con una parada con coordenadas de verdad, que es lo que el servidor necesita). */
export function diasAMirar(route: Route, hoyIso: string): DiaAMirar[] {
  const inicio = route.answers.dateRange?.start
  if (!inicio) return []
  const salida: DiaAMirar[] = []
  const manana = addDaysToIso(hoyIso, 1)
  for (const day of route.days) {
    if (day.isReturnLeg) continue
    const dateIso = addDaysToIso(inicio, day.dayNumber - 1)
    if (dateIso !== hoyIso && dateIso !== manana) continue
    const coordenadas = day.stops.find((stop) => hasRealCoordinates(stop.coordinates))?.coordinates
    if (!coordenadas) continue
    salida.push({ dateIso, cuando: dateIso === hoyIso ? 'hoy' : 'manana', ciudad: day.city || route.destination, coordenadas })
  }
  return salida
}

export interface AvisoDeLluvia {
  /** Uno por día y momento: nunca dos a la vez para el mismo día. */
  id: string
  titulo: string
  texto: string
}

/** Los avisos de lluvia: `lluviaPorDia` trae la previsión de cada día mirado (null o sin ella = ese día no tiene aviso). */
export function avisosDeLluvia(dias: DiaAMirar[], lluviaPorDia: Record<string, HourlyRain | null | undefined>): AvisoDeLluvia[] {
  const avisos: AvisoDeLluvia[] = []
  const vistos = new Set<string>()
  for (const dia of dias) {
    if (vistos.has(dia.dateIso)) continue
    const lluvia = lluviaPorDia[dia.dateIso]
    if (!lluvia) continue
    const franjas = franjasConLluvia(lluvia)
    if (franjas.length === 0) continue
    vistos.add(dia.dateIso)
    avisos.push({
      id: `lluvia:${dia.dateIso}:${dia.cuando}`,
      titulo: 'Previsión de lluvia',
      texto: `${dia.cuando === 'hoy' ? 'Hoy' : 'Mañana'} llueve en ${dia.ciudad} ${textoDeFranjas(franjas)}`,
    })
  }
  return avisos
}
