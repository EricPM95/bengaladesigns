/**
 * Copy de movilidad local para una fase urbana de multidestino_mixto_o_circuito (Paso 4) — hereda
 * el mismo comportamiento que urbano_clasico (a pie/transporte público/taxi), pero personalizado:
 * en sudeste asiático, Grab es la app que usa de verdad la mayoría de visitantes, así que se
 * menciona explícitamente en vez de un "taxi" genérico.
 *
 * Decisión deliberada de mantener esto en el frontend (no en el prompt de Claude): igual que el
 * resto de copy de la app, es texto fijo y determinista, no algo que decida el modelo tramo a
 * tramo — ver la nota de arquitectura en FLUJO_TRANSPORTE.md.
 */
const GRAB_KEYWORDS = ['tailandia', 'thailand', 'vietnam', 'malasia', 'malaysia', 'filipinas', 'philippines', 'singapur', 'singapore', 'indonesia']

export function isSoutheastAsianDestination(destinationName: string): boolean {
  const normalized = destinationName.toLowerCase()
  return GRAB_KEYWORDS.some((keyword) => normalized.includes(keyword))
}

export function buildUrbanMobilityTip(phaseName: string, isSoutheastAsia: boolean): string {
  if (isSoutheastAsia) {
    return `Para moverte por ${phaseName}, la app que usa todo el mundo aquí es Grab — como un Uber, pero mucho más barato.`
  }
  return `Para moverte por ${phaseName}, lo normal es ir a pie, en transporte público o en taxi.`
}
