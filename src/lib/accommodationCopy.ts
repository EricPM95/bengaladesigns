/**
 * Copy del resumen de alojamiento tras resolver el vehículo — reutilizable por cualquier
 * arquetipo, no solo roadtrip_exclusivo.
 *
 * Regla de producto: cuando el sistema preselecciona algo automáticamente sin preguntar (aquí,
 * "coche" porque el destino no admite camper/autocaravana), nunca se muestra solo el resultado
 * — siempre se antepone el motivo. Cuando la elección fue manual del usuario, la tarjeta
 * confirmada con check ya es suficiente y este texto no se muestra en absoluto.
 */
export function buildCarAccommodationMessage(destinationName: string, autoSelectedDueToCamperAccess: boolean): string {
  if (autoSelectedDueToCamperAccess) {
    return `${destinationName} no es apto para camper o autocaravana, así que hemos elegido coche por ti 🚗 — elige tú mismo dónde dormir cada noche, según tu ruta y tu presupuesto.`
  }
  return 'Elige tú mismo dónde dormir cada noche, según tu ruta y tu presupuesto.'
}
