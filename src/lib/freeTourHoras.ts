/**
 * Las horas a las que sale el Free Tour (Tanda 6y9): UNA sola lista para las dos hojas (la de «Añadir el Free Tour» y la de «¿Ya la tienes? Añádela»).
 * El motor tiene la suya (agente B: la de las 19:00 entra allí); al integrar las dos listas se unen. La franja es la que entiende el motor
 * (`setFreeTourChoice`): mañana = el de siempre, tarde y noche = su hora. El de las 19:00 va como el de las 21:00 (franja `noche`).
 */
export type FranjaFreeTour = 'manana' | 'tarde' | 'noche'

export const FREE_TOUR_FRANJAS: readonly { id: FranjaFreeTour; label: string; hora: string }[] = [
  { id: 'manana', label: 'Por la mañana', hora: '10:00' },
  { id: 'manana', label: 'A mediodía', hora: '12:00' },
  { id: 'tarde', label: 'Después de comer', hora: '15:00' },
  { id: 'tarde', label: 'Por la tarde', hora: '17:00' },
  { id: 'noche', label: 'Al anochecer', hora: '19:00' },
  { id: 'noche', label: 'De noche', hora: '21:00' },
]

export const FREE_TOUR_HOURS: string[] = FREE_TOUR_FRANJAS.map((franja) => franja.hora)
