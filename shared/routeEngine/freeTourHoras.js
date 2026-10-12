// Las horas del Free Tour y cómo se llaman: UN solo sitio (Tanda 6y9). El motor, el servidor y las pantallas leen de aquí; nadie más escribe estas horas.
//   franja: 'manana' (antes de las 13:00), 'tarde' (antes de las 19:00) y 'noche' (de las 19:00 en adelante).
//   El Free Tour de la noche (19:00 y 21:00) no es un día con tour: el viaje lleva los días de «Sin Free Tour» y el tour va en la noche del primer día, en lugar de lo que el tour ya recorre.
//   La cena NO la decide esta lista: la decide la regla de la comida y la cena (listasTrip.js, paso 5.7b) con lo que dura el tour (19:00 → sale hacia las 21:30, cena después; 21:00 → cena antes).
export const FREE_TOUR_HORAS = [
  { hora: '10:00', franja: 'manana', nombre: 'Por la mañana' },
  { hora: '12:00', franja: 'manana', nombre: 'A mediodía' },
  { hora: '15:00', franja: 'tarde', nombre: 'Después de comer' },
  { hora: '17:00', franja: 'tarde', nombre: 'Por la tarde' },
  { hora: '19:00', franja: 'noche', nombre: 'Al caer la tarde' },
  { hora: '21:00', franja: 'noche', nombre: 'De noche' },
]

/** Desde esta hora (minutos) el Free Tour es «de la noche» (19:00). */
export const FREE_TOUR_NOCHE_DESDE_MIN = 19 * 60
/** Hasta esta hora (minutos, sin incluirla) el Free Tour es «de la mañana» (13:00). */
export const FREE_TOUR_TARDE_DESDE_MIN = 13 * 60

const aMin = (hora) => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(hora ?? ''))
  return m ? Number(m[1]) * 60 + Number(m[2]) : null
}

/** 'manana' | 'tarde' | 'noche' de una hora «HH:MM» (null si no es una hora). */
export function franjaDelFreeTour(hora) {
  const min = aMin(hora)
  if (min == null) return null
  return min < FREE_TOUR_TARDE_DESDE_MIN ? 'manana' : min < FREE_TOUR_NOCHE_DESDE_MIN ? 'tarde' : 'noche'
}

/** ¿Es el Free Tour de la noche (de las 19:00 en adelante)? */
export const esFreeTourDeNoche = (hora) => franjaDelFreeTour(hora) === 'noche'
