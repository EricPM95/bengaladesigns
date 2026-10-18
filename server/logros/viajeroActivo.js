/**
 * La Versión 1 (Tanda 8C1): solo los logros de viajero con `version: 1` y sin `activo: false` existen para el cerebro: no se ganan, no se ven en ningún sitio y no dan EXP.
 * Los apagados se guardan aparte (`logros_apagados`) para el panel de Eric y para encenderlos más adelante sin tocar código (cambiar el dato en data/logros/viajero.json).
 * Pura (sin `fs`): la usan el servidor y el modo de pruebas del móvil.
 */
export function soloActivos(viajero) {
  const activo = (def) => def.activo !== false
  return { ...viajero, logros: viajero.logros.filter(activo), logros_apagados: viajero.logros.filter((d) => !activo(d)).map((d) => d.id) }
}
