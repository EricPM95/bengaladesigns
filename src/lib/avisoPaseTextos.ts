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

/** (Tanda 10N8, 0a-10) `{pase}` se sustituye por el nombre del pase del destino, escrito igual que en el título y el botón («Pase Roma», «Pase Lanzarote»). `linea1` solo existe si dice algo que el viajero YA ha usado. */
export const AVISO_PASE_TEXTOS: Record<string, TextoAviso> = {
  segunda_foto: {
    linea1: 'Ya tienes tu foto de este sitio.',
    linea2: 'Con el {pase}, guarda fotos sin límite y haz crecer tu álbum de recuerdos.',
  },
  escuchar_historia: {
    linea1: 'Ya has escuchado tu historia de prueba.',
    linea2: 'Con el {pase}, podrás escuchar todas las historias que quieras, sin límite.',
  },
  cerca_de_ti: {
    linea1: '',
    linea2: 'Con el {pase}, descubre todo lo que tienes cerca, estés donde estés.',
  },
  banos: {
    linea1: '',
    linea2: 'Con el {pase}, encuentra los baños más cercanos, estés donde estés.',
  },
  fuentes: {
    linea1: '',
    linea2: 'Con el {pase}, encuentra las fuentes de agua más cercanas, estés donde estés.',
  },
  hoy: {
    linea1: 'Solo tienes HOY abierto el día de prueba.',
    linea2: 'Con el {pase}, tienes HOY disponible todos los días de tu viaje.',
  },
  alojamiento: {
    linea1: '',
    linea2: 'Con el {pase}, adaptamos tus días a donde duermes y llegas a tu alojamiento en un toque, estés donde estés.',
  },
  vuelo: {
    linea1: '',
    linea2: 'Con el {pase}, adaptamos tu primer y tu último día a tus vuelos.',
  },
  logros: {
    linea1: '',
    linea2: 'Con el {pase}, consigues el sello de cada sitio que visitas, las colecciones y los emblemas secretos.',
  },
  generico: {
    linea1: '',
    linea2: 'Desbloquea todo lo que el {pase} añade a tu viaje.',
  },
}

/** Textos distintos para un destino (clave: nombre del destino → clave del aviso → texto). Vacío: todos los destinos usan los de arriba. */
export const AVISO_PASE_TEXTOS_POR_DESTINO: Record<string, Record<string, TextoAviso>> = {}

export function textoDelAviso(clave: string, destino?: string): TextoAviso {
  const propio = destino ? AVISO_PASE_TEXTOS_POR_DESTINO[destino]?.[clave] : undefined
  const t = propio ?? AVISO_PASE_TEXTOS[clave] ?? AVISO_PASE_TEXTOS.generico
  const pase = destino ? `Pase ${destino}` : 'Pase'
  return { linea1: t.linea1, linea2: t.linea2.replace(/{pase}/g, pase) }
}
