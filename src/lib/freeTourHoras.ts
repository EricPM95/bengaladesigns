import { FREE_TOUR_HORAS } from '../../shared/routeEngine/freeTourHoras.js'

/**
 * Las horas a las que sale el Free Tour para las pantallas (Tanda 6y9): las dos hojas («Añadir el Free Tour» y «¿Ya la tienes? Añádela») leen de AQUÍ, y aquí solo se adapta
 * la lista del motor (`shared/routeEngine/freeTourHoras.js`, la única que escribe las horas y los nombres de franja). La franja es la que entiende el motor (`setFreeTourChoice`):
 * mañana = el de siempre, tarde y noche = su hora. El de las 19:00 va como el de las 21:00 (franja `noche`).
 */
export type FranjaFreeTour = 'manana' | 'tarde' | 'noche'

export const FREE_TOUR_FRANJAS: readonly { id: FranjaFreeTour; label: string; hora: string }[] = (FREE_TOUR_HORAS as { hora: string; franja: FranjaFreeTour; nombre: string }[]).map((entrada) => ({
  id: entrada.franja,
  label: entrada.nombre,
  hora: entrada.hora,
}))

export const FREE_TOUR_HOURS: string[] = FREE_TOUR_FRANJAS.map((franja) => franja.hora)
