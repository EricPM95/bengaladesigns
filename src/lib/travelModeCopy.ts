import type { TravelMode, VehicleType } from './types'

/**
 * Descripción de "Base fija" / "Ruta itinerante" — reutilizable por cualquier arquetipo que
 * pregunte esto, no solo base_y_excursiones. Se adapta al vehículo ya elegido: con
 * camper/autocaravana se duerme en campings y zonas de pernocta, no en alojamientos normales.
 * Sin vehículo, con coche, o mientras el vehículo todavía no está resuelto (esta pregunta es
 * independiente y puede responderse antes), se usa la copy genérica de alojamiento.
 */
export function getTravelModeDescription(mode: TravelMode, vehicleType: VehicleType | null): string {
  if (vehicleType === 'camper') {
    return mode === 'base_fija'
      ? 'Un solo camping o zona de pernocta como base, y desde ahí vas y vuelves'
      : 'Cambias de camping y zonas de pernocta según la zona que quieras ver'
  }
  return mode === 'base_fija' ? 'Un solo alojamiento, y desde ahí vas y vuelves' : 'Cambias de zona según lo que quieras ver'
}
