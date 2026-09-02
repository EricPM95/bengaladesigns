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

/** Estación meteorológica (hemisferio norte) del mes indicado. Por defecto, el mes actual del sistema. */
export function getCurrentSeason(date: Date = new Date()): Season {
  return SEASON_BY_MONTH[date.getMonth()]
}
