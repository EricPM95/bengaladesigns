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

/**
 * (Tanda 10S3, apartado 5) La rueda de la hora del Free Tour: la misma de las entradas, de las 08:00 a las 22:00 de 15 en 15. Las seis horas fijas de `FREE_TOUR_HOURS` son nuestras (el motor las usa para elegir
 * franja; la ficha del Free Tour dice que la web del tour no publica horarios: solo se ven al elegir fecha), no las reales de ese día: el viajero pone la hora que ha reservado.
 */
export const FREE_TOUR_RUEDA: string[] = (() => {
  const out: string[] = []
  for (let m = 8 * 60; m <= 22 * 60; m += 15) out.push(`${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`)
  return out
})()
