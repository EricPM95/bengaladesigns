import { useViajeCompartido, type Permiso } from '../store/useViajeCompartido'
import { permisoDe, permisoFingido, useModoInvitado } from './useModoInvitado'

/**
 * LOS PERMISOS DEL VIAJE ABIERTO (tanda 10N, apartado 4a). Una sola fuente para toda la app:
 *   - `admin` (quien crea el viaje, tenga o no gente): todo. Es el ÚNICO que invita, quita gente, cambia permisos, cambia fechas/vuelo/alojamiento y borra el viaje.
 *   - `editar`: toca la ruta directamente y acepta/rechaza propuestas y gastos [Para todos]. No invita, no quita, no cambia permisos ni fechas/vuelo/alojamiento.
 *   - `recomendar`: propone (la propuesta) y sus gastos [Para todos] esperan. TODOS empiezan así al entrar.
 * Con las cuentas apagadas nunca hay invitados y siempre sale `admin`.
 * En desarrollo, `sessionStorage['trazo:permiso'] = 'editar' | 'recomendar'` lo finge junto con `trazo:invitado`.
 */
export interface PermisosDelViaje {
  rol: Permiso
  esAdmin: boolean
  /** Admin o «Puede editar»: cambia la ruta directamente. */
  puedeEditar: boolean
  soloRecomienda: boolean
  esInvitado: boolean
  nombreAdmin: string
}

export { permisoFingido }

export function usePermisosDelViaje(): PermisosDelViaje {
  const { esInvitado, nombreAdmin } = useModoInvitado()
  const gente = useViajeCompartido((s) => s.gente)
  const rol: Permiso = permisoDe(esInvitado, gente)
  return { rol, esAdmin: rol === 'admin', puedeEditar: rol !== 'recomendar', soloRecomienda: rol === 'recomendar', esInvitado, nombreAdmin }
}
