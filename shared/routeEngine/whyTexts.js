/**
 * El "por qué" de cada parada (Paso 6 de la revisión, 2026-09-24): una línea corta según el motivo
 * por el que la puso el motor. Plantillas fijas, sin IA y de tú a tú. Evitan concordar en género con
 * el lugar ("su historia", "con sus luces"): {lugar} puede ser masculino o femenino y va con su
 * artículo ("el Coliseo", "la Fontana de Trevi").
 *
 * Si una parada tiene varios motivos, se enseña el más fuerte:
 *   pool > imprescindible > experiencia > mirador / nocturna > de camino.
 *
 * Módulo puro: lo usan el servidor y el repartidor (el texto de las revisitas).
 */

/** Nombre de cada experiencia tal como la ve el viajero (el mismo que en el cuestionario). */
export const EXPERIENCE_TITLES = {
  arte_museos: 'Arte y Museos',
  barrios_sabores: 'Barrios y Sabores',
  naturaleza_vistas: 'Naturaleza y Vistas',
  free_tour: 'Free Tour',
}

export const whyTexts = {
  pool: () => 'Uno de tus favoritos.',
  essential: (city) => `Uno de los imprescindibles de ${city}.`,
  experience: (theme) => `Elegido según tus gustos: ${EXPERIENCE_TITLES[theme] ?? theme}.`,
  onTheWay: () => 'Te pilla de camino a la cena: merece la parada.',
  /** Por la mañana no se va hacia la cena. */
  onTheWayMorning: () => 'Te pilla de camino: merece la parada.',
  /** Lo gratis que llena un hueco a mitad de día (antes del mirador del atardecer, por ejemplo). */
  inGap: () => 'Te pilla de camino y hay tiempo de sobra hasta la siguiente: merece la pena.',
  /** La parte de pago de un grupo que se ve por fuera (el Castillo, desde el Puente). */
  outside: (places) => `Por fuera: ${places} (la entrada es aparte).`,
  sunset: (city) => `Llegas justo a tiempo para ver el atardecer sobre ${city}.`,
  /** Llegada de 60 a 30 min antes de la puesta de sol. */
  sunsetEarly: (city) => `Llegas con tiempo para coger buen sitio antes del atardecer sobre ${city}.`,
  night: () => 'De noche es una experiencia completamente distinta: con sus luces y otro ambiente.',
  revisit: (place, dayNumber, minutes) =>
    `Ya visitaste ${place} el Día ${dayNumber}, pero creemos que verlo a esta hora te va a gustar: dedícale ${minutes} minutos y hazte fotos nuevas.`,
  insideAfterTour: (place, city) =>
    `El Free Tour te ha enseñado ${place} por fuera; ahora toca verlo por dentro. Conocer su historia es imprescindible en cualquier viaje a ${city}.`,
  freeTour: ({ area, places, repeats }) =>
    `Con el Free Tour descubrirás varios imprescindibles${area ? ` ${area}` : ''}, como ${places}, de la mano de un guía que te contará su historia y sus secretos. El recorrido es por fuera, sin entrar en los monumentos. ` +
    (repeats
      ? 'Te los volveremos a enseñar a otra hora del viaje, porque la experiencia es totalmente distinta.'
      : 'Si puedes, vuelve de noche: la experiencia es totalmente distinta.'),
}

/** "a, b y c" */
export function joinSpanish(items) {
  if (items.length <= 1) return items.join('')
  return `${items.slice(0, -1).join(', ')} y ${items[items.length - 1]}`
}

/** El lugar con su artículo: la etiqueta de su paso por fuera si la tiene ("el Panteón"), si no el nombre. */
export function placeWithArticle(place) {
  return place?.pass_by?.label ?? place?.name ?? ''
}
