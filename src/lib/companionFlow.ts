import type { Companion, DestinationArchetype, VehicleType } from './types'

/**
 * Arquetipos donde el vehículo (Coche/Camper/Autocaravana) ya se conoce ANTES del paso de
 * acompañantes — roadtrip_exclusivo y base_y_excursiones siempre lo preguntan en su Fase 2;
 * urbano_clasico solo cuando llegó con vehículo propio. En el resto (incluido
 * multidestino_mixto_o_circuito, donde el vehículo se elige tramo a tramo DENTRO de la ruta ya
 * generada, después de todo el cuestionario) todavía no hay vehículo que comparar — se omite el
 * aviso de capacidad sin más.
 */
const VEHICLE_KNOWN_ARCHETYPES: DestinationArchetype[] = ['roadtrip_exclusivo', 'base_y_excursiones', 'urbano_clasico']

export function totalCompanionPeople(
  companion: Companion | undefined,
  adults: number | undefined,
  childrenAges: number[] | undefined,
  groupSize: number | undefined,
): number {
  if (companion === 'family') return (adults ?? 0) + (childrenAges?.length ?? 0)
  if (companion === 'group') return groupSize ?? 0
  return 0
}

export type CapacityWarningLevel = 'car_over' | 'camper_recommend' | 'camper_over'

export interface CapacityWarning {
  level: CapacityWarningLevel
  /** Solo 'camper_recommend': número de autocaravanas recomendado (Math.ceil(N/4)). */
  unitsRecommended?: number
}

/**
 * Compara el grupo (adultos+niños en Tribu, total en Crew) contra la capacidad del vehículo ya
 * elegido en un paso anterior — solo tiene sentido para A MI AIRE/EN COMPAÑÍA excluidos (siempre
 * caben 1-2 personas en cualquier vehículo estándar, por eso `total === 0` — que solo ocurre para
 * esos dos casos, dado que Tribu/Crew siempre exigen al menos 1 persona — vuelve null aquí).
 *
 * No comprueba `vehicle_resolved`: ese flag NO significa lo mismo en los tres archetypes —
 * roadtrip_exclusivo nunca lo pone a true (su propio gate en `isTransportFullyResolved` usa
 * `vehicleType !== null && vehicleOwnership !== null`, no `vehicle_resolved`; ver
 * `transportFlow.ts`). Para cuando se llega al paso de acompañantes, el gate del propio archetype
 * ya garantiza que `vehicleType` está en su estado final — que sea no-null ya basta como señal de
 * "hay un vehículo elegido", sin más comprobación.
 *
 * - Coche: hasta 5 personas cómodas. Más de 5 → aviso bloqueante (car_over), el usuario debe
 *   elegir explícitamente cómo seguir (varios coches / cambiar de vehículo / ajustar respuesta).
 * - Camper/Autocaravana: 4 personas por unidad (conservador). 5-8 → recomendación automática de
 *   cuántas unidades (Math.ceil(N/4)), informativa, no bloquea. Más de 8 → grupo grande para este
 *   tipo de vehículo, se sugiere revisar la elección a mano en vez de calcular un número.
 */
export function getCapacityWarning(archetype: DestinationArchetype | null, vehicleType: VehicleType | null, total: number): CapacityWarning | null {
  if (!archetype || !VEHICLE_KNOWN_ARCHETYPES.includes(archetype) || !vehicleType || total === 0) return null

  if (vehicleType === 'car') {
    return total > 5 ? { level: 'car_over' } : null
  }

  // camper
  if (total > 8) return { level: 'camper_over' }
  if (total >= 5) return { level: 'camper_recommend', unitsRecommended: Math.ceil(total / 4) }
  return null
}

/**
 * true cuando ya se puede avanzar a la siguiente pregunta del cuestionario (¿Qué mueve tu
 * viaje?). A MI AIRE/EN COMPAÑÍA se resuelven en cuanto se eligen. AVENTURA EN TRIBU/CON MI CREW
 * exigen además los campos numéricos rellenados, y — solo si hay un aviso `car_over` pendiente —
 * que el usuario haya elegido explícitamente una de las tres salidas (el resto de avisos son
 * informativos, nunca bloquean).
 */
export function isCompanionFullyResolved(
  companion: Companion | undefined,
  companionAdults: number | undefined,
  companionChildrenAges: number[] | undefined,
  companionGroupSize: number | undefined,
  archetype: DestinationArchetype | null,
  vehicleType: VehicleType | null,
  capacityAcknowledged: boolean,
): boolean {
  if (!companion) return false
  if (companion === 'family' && (companionAdults === undefined || companionChildrenAges === undefined)) return false
  if (companion === 'group' && companionGroupSize === undefined) return false

  const total = totalCompanionPeople(companion, companionAdults, companionChildrenAges, companionGroupSize)
  const warning = getCapacityWarning(archetype, vehicleType, total)
  if (warning?.level === 'car_over' && !capacityAcknowledged) return false
  return true
}
