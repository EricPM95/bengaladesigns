/**
 * (Tanda 10S8, apartado 0b) Los imprescindibles GRANDES: los únicos que tienen su propio aviso («El Coliseo no cabe el jueves.» + [Pasarlo a otro día]) cuando un día adaptado al vuelo no
 * los deja caber. Los demás imprescindibles que no caben van juntos en UNA línea («Y 4 sitios más pasan a “Si te sobra tiempo”.» + [Ver]).
 *
 * LA LISTA, POR DESTINO, ESTÁ AQUÍ y solo aquí: para otro destino se añade su clave (el nombre del destino sin tildes, en minúsculas) con trozos de nombre (sin tildes, en minúsculas).
 * Un destino que no esté en la lista no tiene «grandes» y todos sus imprescindibles avisan uno a uno, como en la 10S7c.
 */
export const IMPRESCINDIBLES_GRANDES: Record<string, string[]> = {
  roma: ['coliseo', 'foro romano', 'museos vaticanos', 'basilica de san pedro', 'galeria borghese'],
}

const norm = (texto: string): string => String(texto ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim()

/** ¿Este sitio es de los grandes de ese destino? Sin lista para el destino: todos cuentan como grandes (cada uno con su aviso). */
export function esImprescindibleGrande(destino: string | null | undefined, nombre: string): boolean {
  const lista = IMPRESCINDIBLES_GRANDES[norm(destino ?? '')]
  if (!lista) return true
  const n = norm(nombre)
  return lista.some((trozo) => n.includes(trozo))
}

/** Reparte los avisos: los grandes, uno por línea; el resto, a la línea de «Y N sitios más…». */
export function repartirNoCaben<T extends { nombre: string; imprescindible?: boolean }>(items: T[], destino: string | null | undefined): { grandes: T[]; resto: T[] } {
  const grandes: T[] = []
  const resto: T[] = []
  // (10R) Lo que no es imprescindible nunca tiene línea propia: va a «Y N sitios más…».
  for (const item of items) (item.imprescindible !== false && esImprescindibleGrande(destino, item.nombre) ? grandes : resto).push(item)
  return { grandes, resto }
}

/** «Y 4 sitios más pasan a “Si te sobra tiempo”.» (singular: «Y 1 sitio más pasa a “Si te sobra tiempo”.») */
export function textoYMasSitios(cuantos: number): string {
  return cuantos === 1 ? 'Y 1 sitio más pasa a “Si te sobra tiempo”.' : `Y ${cuantos} sitios más pasan a “Si te sobra tiempo”.`
}
