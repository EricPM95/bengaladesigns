import type { Route } from '../../lib/types'
import { misPases } from '../../lib/pagoPase'
import { pedirPermisoUnaVez } from '../../lib/permisoAvisos'
import { usePagoStore } from '../../store/usePagoStore'
import { usePedirNombre } from '../../store/usePedirNombre'

/**
 * Abre la hoja de invitar al viaje (el administrador). Con un Pase Dúo o Grupo de este destino con plazas, la hoja del pase (el invitado entra con su plaza); si no, la de compartir el viaje.
 * La usan [Compartir] de la tarjeta de RUTA y [+ Invitar a alguien] de «Personas del viaje».
 */
export async function abrirHojaInvitar(route: Route, tripId: string): Promise<void> {
  // La ventana del móvil que pide permiso para los avisos sale AQUÍ, una sola vez en la vida, en este mismo toque.
  void pedirPermisoUnaVez()
  // Quien entró con el email y no tiene nombre: «¿Cómo te llamas?», una sola vez, antes de compartir.
  await usePedirNombre.getState().pedir()
  const pases = await misPases()
  const pase = pases.find((p) => p.estado === 'activo' && p.es_mio && p.tipo !== 'uno' && p.destino.toLowerCase() === route.destination.toLowerCase() && p.usos_usados < p.usos_max) ?? null
  usePagoStore.getState().abrir({ tipo: 'invitar', modo: pase ? 'pase' : 'viaje', destino: route.destination, tripId, pase })
}
