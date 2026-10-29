import { useMemo } from 'react'
import { cuentaDelViaje, esFamilia } from './cuentaDelViaje'
import type { Route } from './types'
import { useRouteStore } from '../store/useRouteStore'
import { useViajeCompartido } from '../store/useViajeCompartido'
import { esInvitadoAhora, miPermisoAhora } from '../hooks/useModoInvitado'

/**
 * LA FORMA DE LAS CUENTAS DEL VIAJE ABIERTO (Tanda 10N10 §5a; cambia lo de la 10N7). Una sola fuente para toda la app, y LA DECIDE LA APP según las personas (ya no se elige a mano ni hay «¿Cómo lleváis las cuentas?»):
 *   · `solo`      — una persona: sin interruptor, «Total del viaje», sin «¿Para quién…?».
 *   · `conjunta`  — dos personas, o una familia (sean las que sean): «Mi cuenta | Cuenta conjunta».
 *   · `cada_uno`  — tres o más que no son familia: «Mi cuenta | Cuenta del grupo». (El nombre interno `cada_uno` se conserva por la base de datos, que ya lo llama así: 0054/0055/0064/0067.)
 * `route.modoCuentas`, `route.modoElegidoCon` y `route.nombreCuenta` (de la 10N7) ya no cuentan.
 */
export type ModoCuentas = 'solo' | 'conjunta' | 'cada_uno'

export interface EstadoModoCuentas {
  modo: ModoCuentas
  /** Siempre false (ya no se pregunta nada); se conserva para quien aún lo lee. */
  pendiente: boolean
  /** «Cuenta conjunta» o «Cuenta del grupo». */
  nombre: string
  nombrePuesto: string
  esAdmin: boolean
  /** Cuántas personas hay en el viaje (con el administrador). */
  personas: number
}

/** Pura: la forma de las cuentas a partir de la ruta (si es una familia) y de cuántas personas hay. */
export function resolverModo(route: Pick<Route, 'answers'> | null | undefined, personas: number): { modo: ModoCuentas; pendiente: boolean } {
  const c = cuentaDelViaje(personas, esFamilia(route))
  return { modo: c === 'grupo' ? 'cada_uno' : c, pendiente: false }
}

/** Cuántas personas hay en el viaje abierto (quien lo mira cuenta aunque aún no haya cargado la lista). */
function personasAhora(): number {
  const gente = useViajeCompartido.getState().gente
  return Math.max(gente.length, esInvitadoAhora() ? 2 : 1)
}

/** Lectura síncrona del modo AHORA (fuera de un componente). */
export function modoDeCuentas(): ModoCuentas {
  return resolverModo(useRouteStore.getState().route, personasAhora()).modo
}

export function useModoCuentas(): EstadoModoCuentas {
  const route = useRouteStore((s) => s.route)
  const gente = useViajeCompartido((s) => s.gente)
  const invitado = esInvitadoAhora()
  const personas = Math.max(gente.length, invitado ? 2 : 1)
  const rol = miPermisoAhora()
  return useMemo(() => {
    const r = resolverModo(route, personas)
    return { modo: r.modo, pendiente: false, nombre: r.modo === 'cada_uno' ? 'Cuenta del grupo' : 'Cuenta conjunta', nombrePuesto: '', esAdmin: rol === 'admin', personas }
  }, [route, personas, rol])
}
