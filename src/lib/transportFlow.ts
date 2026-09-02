import type { DestinationArchetype, TransportOption, TravelMode, VehicleOwnership, VehicleType } from './types'

/**
 * true cuando ya se puede avanzar a la siguiente pregunta del cuestionario (¿Cuántos días?).
 *
 * - roadtrip_exclusivo: el vehículo en destino es siempre obligatorio, así que no está resuelto
 *   hasta que vehicleType y vehicleOwnership tienen valor.
 * - base_y_excursiones: el vehículo es siempre opcional (puede resolverse en "sin vehículo"), así
 *   que se usa `vehicleResolved` en vez de comprobar vehicleType — y además exige `travelMode`
 *   (Base fija / Ruta itinerante), que en este arquetipo se pregunta en paralelo al vehículo.
 * - urbano_clasico: dos casos. Si llegó por "Ruta por libre con vehículo propio"
 *   (`transportOption.id === 'own_vehicle'`), siempre exige `vehicleResolved` — pregunta el tipo
 *   de vehículo igual que roadtrip_exclusivo/base_y_excursiones, sin importar `requiereCoche`
 *   (ya tiene un vehículo, solo falta saber cuál). En cualquier otra llegada, sin Fase 2 en el
 *   caso normal (`requiereCoche = false`) — resuelto en cuanto hay transportOption. Solo cuando
 *   `requiereCoche = true` (transporte público insuficiente, ver clasificación de destino) hay
 *   una pregunta de alquiler de coche que también exige `vehicleResolved`.
 * - multidestino_tren_o_vuelo: sin Fase 2 si `paseDominante` es null (caso normal) — resuelto en
 *   cuanto hay transportOption. Si `paseDominante` no es null, exige además `travelPassConfirmed
 *   !== null` (la pregunta "¿Vas a viajar con {pase}?", una sola vez para todo el viaje).
 * - El resto de arquetipos todavía no tienen flujo propio (se reconstruyen uno a uno) — en cuanto
 *   hay un transportOption asumido, se da por resuelto.
 */
export function isTransportFullyResolved(
  archetype: DestinationArchetype | null,
  transportOption: TransportOption | null,
  vehicleType: VehicleType | null,
  vehicleOwnership: VehicleOwnership | null,
  vehicleResolved: boolean,
  travelMode: TravelMode | null,
  requiereCoche: boolean,
  paseDominante: string | null,
  travelPassConfirmed: boolean | null,
): boolean {
  if (!transportOption) return false
  if (archetype === 'roadtrip_exclusivo') return vehicleType !== null && vehicleOwnership !== null
  if (archetype === 'base_y_excursiones') return vehicleResolved && travelMode !== null
  if (archetype === 'urbano_clasico') return transportOption.id === 'own_vehicle' ? vehicleResolved : !requiereCoche || vehicleResolved
  if (archetype === 'multidestino_tren_o_vuelo') return !paseDominante || travelPassConfirmed !== null
  return true
}
