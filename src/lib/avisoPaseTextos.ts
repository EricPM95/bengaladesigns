/**
 * LOS TEXTOS DEL AVISO PEQUEÑO DEL PASE (Tanda 10N6 §1g): UN solo archivo para toda la app y todos los destinos.
 * Cada clave lleva dos líneas:
 *  - `linea1`: pequeña, gris claro: lo que el viajero tiene gratis o lo que ya ha usado;
 *  - `linea2`: en negrita: lo que gana con el pase (sin repetir «Pase {destino}», que ya está en el título).
 * Para cambiar el texto de un destino concreto, añade su nombre (tal cual lo escribe la ruta: «Roma», «París»…) en `PORDESTINO`.
 * REGLA: solo se promete lo que el pase hace de verdad.
 */
export interface TextoAviso {
  linea1: string
  linea2: string
}

export const AVISO_PASE_TEXTOS: Record<string, TextoAviso> = {
  segunda_foto: {
    linea1: 'Sin pase, guardas 1 foto por sitio.',
    linea2: 'Guarda todas las que quieras y crea tus recuerdos.',
  },
  escuchar_historia: {
    linea1: 'Ya has escuchado tu historia de prueba.',
    linea2: 'Escucha todas las historias de tu viaje.',
  },
  cerca_de_ti: {
    linea1: 'Tu ruta ya te dice qué hay en cada parada.',
    linea2: 'Descubre lo que tienes cerca de ti, allí donde estés.',
  },
  banos: {
    linea1: 'Tu ruta ya te dice qué ver y dónde comer.',
    linea2: 'Encuentra los baños más cercanos en cada momento.',
  },
  fuentes: {
    linea1: 'Tu ruta ya te dice qué ver y dónde comer.',
    linea2: 'Encuentra las fuentes de agua más cercanas.',
  },
  hoy: {
    linea1: 'Solo tienes HOY abierto el día de prueba.',
    linea2: 'Tu día, ajustado en directo a donde estás y a la hora que es.',
  },
  generico: {
    linea1: 'Esto no está en la versión gratis.',
    linea2: 'Desbloquea todo lo que el pase añade a tu viaje.',
  },
}

/** Textos distintos para un destino (clave: nombre del destino → clave del aviso → texto). Vacío: todos los destinos usan los de arriba. */
export const AVISO_PASE_TEXTOS_POR_DESTINO: Record<string, Record<string, TextoAviso>> = {}

export function textoDelAviso(clave: string, destino?: string): TextoAviso {
  const propio = destino ? AVISO_PASE_TEXTOS_POR_DESTINO[destino]?.[clave] : undefined
  return propio ?? AVISO_PASE_TEXTOS[clave] ?? AVISO_PASE_TEXTOS.generico
}
