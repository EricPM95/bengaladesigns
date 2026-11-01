/**
 * (Tanda 10S10, apartado 3) EL NOMBRE DE UNA PARADA NUNCA DEPENDE DE LA HORA.
 *
 * Los datos traen sitios con la hora metida en el nombre: «Fontana de Trevi, sin gente» (31 veces en los días escritos), «El Puente y el Castillo de Sant'Angelo iluminados», «Mirador del Janículo iluminado»,
 * «Roma iluminada desde el Janículo», «Trastevere de noche», «Trastevere al atardecer»… Si el viajero mueve la parada a las 17:00, el nombre seguía diciendo «sin gente». Regla nueva (Eric, 1-nov):
 *   · el nombre es el del sitio («Fontana de Trevi»);
 *   · lo de la hora va en una etiqueta pequeña que SOLO sale si la hora de la parada lo cumple y se quita sola si se mueve (`etiquetaDeHora`).
 *
 * Se hace al pintar, no en los datos: el motor lee «sin gente» del título para colocar lo de primera hora (`reorganizarDia.js`), así que los datos no se tocan; y los viajes ya guardados quedan arreglados igual.
 */

/** Qué prometía la hora que llevaba el nombre. */
export type MarcaDeHora = 'sin_gente' | 'iluminado' | 'de_noche' | 'atardecer'

const REGLAS: { patron: RegExp; marca: MarcaDeHora }[] = [
  { patron: /,?\s+sin gente$/i, marca: 'sin_gente' },
  // «Roma iluminada desde el Janículo»: la palabra va en medio.
  { patron: /\s+iluminad[oa]s?(?=\s+desde\b|,|$)/i, marca: 'iluminado' },
  { patron: /\s+de noche$/i, marca: 'de_noche' },
  { patron: /\s+al atardecer$/i, marca: 'atardecer' },
]

/** El nombre sin la hora y, si la traía, qué prometía. («Sin paseo de noche» no es un sitio: se queda.) */
export function nombreSinHora(nombre: string): { nombre: string; marca: MarcaDeHora | null } {
  if (/^sin paseo/i.test(nombre.trim())) return { nombre, marca: null }
  for (const { patron, marca } of REGLAS) {
    if (patron.test(nombre)) {
      const limpio = nombre.replace(patron, '').trim()
      if (limpio.length > 0) return { nombre: limpio, marca }
    }
  }
  return { nombre, marca: null }
}

/** Lo que se sabe de la hora de una parada para decidir su etiqueta. Todo en minutos desde las 0:00; null = no se sabe. */
export interface HoraDeParada {
  /** Cuándo empieza la parada. */
  inicio: number | null
  /** La puesta de sol de ese día. */
  ocaso: number | null
  /** La parada va detrás de la cena en el día (por posición, no por franja guardada). */
  despuesDeCena: boolean
}

/** Hasta qué hora (incluida) cuenta como «primera hora»: las 9:00. */
export const PRIMERA_HORA_HASTA = 9 * 60

export const TEXTO_DE_MARCA: Record<MarcaDeHora, string> = {
  sin_gente: 'Sin gente a primera hora',
  iluminado: 'Iluminado',
  de_noche: 'De noche',
  atardecer: 'Al atardecer',
}

/**
 * La etiqueta pequeña de la hora, o null si la hora de la parada no lo cumple:
 *  · «Sin gente a primera hora»: empieza a las 9:00 o antes;
 *  · «Iluminado» / «De noche»: empieza con el sol ya puesto (sin hora de sol, después de la cena);
 *  · «Al atardecer»: empieza desde una hora antes del sol hasta un cuarto de hora después (la ventana del atardecer del motor).
 */
export function etiquetaDeHora(marca: MarcaDeHora | null, hora: HoraDeParada): string | null {
  if (!marca || hora.inicio === null) return null
  const { inicio, ocaso, despuesDeCena } = hora
  if (marca === 'sin_gente') return inicio <= PRIMERA_HORA_HASTA ? TEXTO_DE_MARCA.sin_gente : null
  if (marca === 'atardecer') return ocaso !== null && inicio >= ocaso - 60 && inicio <= ocaso + 15 ? TEXTO_DE_MARCA.atardecer : null
  const anochecido = ocaso !== null ? inicio >= ocaso : despuesDeCena
  return anochecido ? TEXTO_DE_MARCA[marca] : null
}
