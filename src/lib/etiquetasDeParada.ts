import nombresCortos from '../data/nombresCortos.json'

/** (6-nov, RETOQUES_TARJETAS §4) Las etiquetas de ESTA parada: las suyas propias si el sitio entero no cuadra con ella (src/data/nombresCortos.json), si no las del sitio. */
export function etiquetasDeParada(nombre: string, tags: readonly string[] | undefined): readonly string[] | undefined {
  const propias = (nombresCortos._etiquetas_por_nombre as Record<string, unknown>)[nombre]
  return Array.isArray(propias) ? (propias as string[]) : tags
}
