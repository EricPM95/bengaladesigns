import type { Ganados } from './api'

/**
 * (V82 §1 y §5) LOS NÚMEROS DE «MI COLECCIÓN»: UNA SOLA CUENTA para la cabecera de «Todos mis logros» (N1) y la tarjeta para presumir (P3), así nunca difieren.
 * Todo sale de lo ya ganado (`GET /api/logros/ganados`), sin pedir nada más: medallas de ciudad (cada una en su grado más alto), colecciones completas, secretos (emblemas encontrados) y países.
 */
export interface NumerosDeColeccion {
  total: number
  medallas: number
  colecciones: number
  secretos: number
  paises: number
}

export function numerosDeColeccion(g: Ganados): NumerosDeColeccion {
  const vivos = g.items.filter((i) => !i.superado)
  return {
    total: g.total,
    medallas: vivos.filter((i) => i.tipo === 'sello').length,
    colecciones: vivos.filter((i) => i.tipo === 'coleccion').length,
    secretos: vivos.filter((i) => i.tipo === 'emblema').length,
    paises: g.paises.length,
  }
}

/** Las cuatro cifras, con su etiqueta, en el orden de Design (MEDALLAS, COLEC., SECRETOS, PAÍSES). */
export function cifrasDeColeccion(n: NumerosDeColeccion): { n: number; etiqueta: string }[] {
  return [
    { n: n.medallas, etiqueta: 'Medallas' },
    { n: n.colecciones, etiqueta: 'Colec.' },
    { n: n.secretos, etiqueta: 'Secretos' },
    { n: n.paises, etiqueta: 'Países' },
  ]
}
