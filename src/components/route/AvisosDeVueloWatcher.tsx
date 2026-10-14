import { useAvisosDeVuelo } from '../../hooks/useAvisosDeVuelo'

/** Se monta una vez en `App`: mantiene al día los avisos de reservas contra los vuelos que ve la campana (Tanda 7). No pinta nada. */
export function AvisosDeVueloWatcher() {
  useAvisosDeVuelo()
  return null
}
