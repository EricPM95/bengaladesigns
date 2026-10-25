import type { Route } from './types'

/**
 * Las tarjetas especiales (Tanda 10M): Navidad, Semana Santa y el cumpleaños de la ciudad. Una sola por viaje y con un solo
 * texto, el que da el motor en `route.seasonNote`. La clave del cumpleaños puede llegar como `cumpleanos` o `cumpleanos_ciudad`.
 * Una `season` que no sea de estas tres (las tarjetas de estación de antes, de viajes ya guardados) no saca tarjeta.
 */
export type CardSeason = 'navidad' | 'semana_santa' | 'cumpleanos'

export function cardSeasonOfNote(note: Route['seasonNote'] | undefined): CardSeason | null {
  if (!note?.text) return null
  const clave = String(note.season ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[\s-]+/g, '_')
  if (clave === 'navidad' || (!clave && note.icon === 'navidad')) return 'navidad'
  if (clave === 'semana_santa' || clave === 'pascua') return 'semana_santa'
  if (clave === 'cumpleanos' || clave === 'cumpleanos_ciudad') return 'cumpleanos'
  return null
}

/** ¿Falta por enseñar la tarjeta especial de este viaje? (Los avisos de fechas esperan a que se cierre.) */
export function seasonCardPending(route: Pick<Route, 'seasonNote' | 'seasonNoteDismissed'>): boolean {
  return cardSeasonOfNote(route.seasonNote) !== null && !route.seasonNoteDismissed
}
