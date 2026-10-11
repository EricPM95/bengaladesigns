/**
 * El camino del formulario Trazo (Tanda 6y): quién monta el itinerario. Todo lo que decide a qué pantalla se va, sin React (se prueba solo).
 *  - `auto` («¡Sí, hazla por mí!»): experiencias, lugares y resumen, y la ruta se monta por detrás como siempre.
 *  - `manual` («Quiero hacerla yo»): se salta experiencias y lugares y va a un resumen corto; NO se monta ninguna ruta por detrás.
 */
export type PlanChoice = 'auto' | 'manual'

export const STEP = {
  ruta: 0,
  transporte: 1,
  fechas: 2,
  compania: 3,
  elegir: 4,
  experiencias: 5,
  lugares: 6,
  /** El resumen de siempre: aquí se monta la ruta por detrás. */
  resumen: 7,
  /** El resumen corto de la ruta a mano: sin experiencias ni sitios, y sin ruta por detrás. */
  resumenCorto: 8,
} as const

/** El aviso corto al tocar una de las dos tarjetas. */
export const AVISO_DE_ELEGIR: Record<PlanChoice, string> = {
  auto: 'Creando tu itinerario…',
  manual: 'Preparando tu viaje…',
}

/** A dónde se va después de elegir. */
export const stepAfterChoice = (plan: PlanChoice): number => (plan === 'manual' ? STEP.resumenCorto : STEP.experiencias)

/** La flecha de atrás: a qué pantalla vuelve desde `step` (null = no hay flecha: la primera, y el resumen que está montando la ruta). */
export function backStepFrom(step: number): number | null {
  if (step === STEP.ruta || step === STEP.resumen) return null
  // El resumen corto y las experiencias vuelven a la pantalla de elegir; la de elegir, a «quién viaja».
  if (step === STEP.resumenCorto) return STEP.elegir
  return step - 1
}

/** Los nombres de los pasos de la barra y del panel: con la ruta a mano no hay experiencias ni lugares. */
export function stepNamesFor(plan: PlanChoice | null): string[] {
  const base = ['Origen y destino', 'Transporte', 'Fechas', 'Compañía', 'Itinerario']
  return plan === 'manual' ? base : [...base, 'Experiencias', 'Lugares']
}

/**
 * Los pasos que se ven en la barra, el contador («5/5») y el panel (Tanda 6y2). Hasta la pantalla de elegir (incluida) todavía no se sabe qué camino va a tomar el viajero: se
 * cuentan solo los 5 pasos que tienen los dos caminos (así la pantalla de elegir no dice «5/7» cuando quizá no habrá 7). «Experiencias» y «Lugares» se suman cuando elige
 * «¡Sí, hazla por mí!»; con «Quiero hacerla yo» no aparecen nunca.
 */
export function visibleStepNamesFor(plan: PlanChoice | null, step: number): string[] {
  return step <= STEP.elegir ? stepNamesFor('manual') : stepNamesFor(plan)
}

/** El contador de arriba: «5/5», «6/7»…; en el último paso (el resumen) pone «LISTO». */
export const stepCounterLabel = (step: number, names: string[]): string => (step < names.length ? `${step + 1}/${names.length}` : 'LISTO')

/** ¿Se piden ya las sugerencias de experiencias (y, tras ellas, la precarga de lugares)? Solo con «¡Sí, hazla por mí!»: la ruta a mano no las usa. */
export const shouldSuggestExperiences = (choice: PlanChoice | null): boolean => choice === 'auto'

/** ¿Está el formulario en una pantalla de resumen (última)? */
export const isSummaryStep = (step: number): boolean => step === STEP.resumen || step === STEP.resumenCorto

/** ¿Se monta la ruta por detrás? Solo en el resumen de siempre y solo en el camino de «hazla por mí»: nunca en el de la ruta a mano. */
export const shouldGenerateRoute = (step: number, plan: PlanChoice | null): boolean => step === STEP.resumen && plan !== 'manual'

/** ¿Pasa el formulario por las experiencias y por los lugares? */
export const usesExperiences = (plan: PlanChoice | null): boolean => plan !== 'manual'
