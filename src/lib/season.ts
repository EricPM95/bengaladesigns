import type { Season } from './types'

const SEASON_BY_MONTH: Season[] = [
  'winter', // enero
  'winter', // febrero
  'spring', // marzo
  'spring', // abril
  'spring', // mayo
  'summer', // junio
  'summer', // julio
  'summer', // agosto
  'autumn', // septiembre
  'autumn', // octubre
  'autumn', // noviembre
  'winter', // diciembre
]

export const SEASON_META: Record<Season, { icon: string; label: string }> = {
  spring: { icon: '🌸', label: 'Primavera' },
  summer: { icon: '☀️', label: 'Verano' },
  autumn: { icon: '🍂', label: 'Otoño' },
  winter: { icon: '❄️', label: 'Invierno' },
}

/** Temporada de un mes 0-11 (hemisferio norte: diciembre-febrero, invierno). */
export function seasonOfMonth(month: number): Season {
  return SEASON_BY_MONTH[month]
}

/** Mes central de cada temporada: el que se asigna a los viajes antiguos que solo guardaban temporada. */
export const CENTRAL_MONTH: Record<Season, number> = { winter: 0, spring: 3, summer: 6, autumn: 9 }

/** Los 12 meses en 4 filas por temporada (Invierno: Dic · Ene · Feb; ...), como el formulario. */
export const MONTH_ROWS: { season: Season; months: number[] }[] = [
  { season: 'winter', months: [11, 0, 1] },
  { season: 'spring', months: [2, 3, 4] },
  { season: 'summer', months: [5, 6, 7] },
  { season: 'autumn', months: [8, 9, 10] },
]

export const MONTH_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

/** Estación meteorológica (hemisferio norte) del mes indicado. Por defecto, el mes actual del sistema. */
export function getCurrentSeason(date: Date = new Date()): Season {
  return SEASON_BY_MONTH[date.getMonth()]
}
