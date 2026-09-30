import type { TripPace } from './types'

/**
 * Hay una sola ruta (PROMPT_QUITAR_RITMOS, 2026-09-30): la que era «completo». El formulario ya no pregunta el ritmo y
 * todo lo que antes dependía de él usa este. Los viajes guardados con «tranquilo» se abren igual; si se regeneran, salen
 * con la ruta única (el servidor también lo fuerza). El viajero aligera su ruta quitando paradas.
 */
export const SINGLE_PACE: TripPace = 'nonstop'
