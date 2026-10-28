import { useMemo } from 'react'
import { totalCompanionPeople } from './companionFlow'
import { nombreVisible } from './nombrePersona'
import type { Route } from './types'
import { useRouteStore } from '../store/useRouteStore'
import { useViajeCompartido } from '../store/useViajeCompartido'
import { esInvitadoAhora, miPermisoAhora } from '../hooks/useModoInvitado'

/**
 * CÓMO SE LLEVAN LAS CUENTAS DEL VIAJE ABIERTO (Tanda 10N7). Una sola fuente para toda la app:
 *   · `solo`      — nadie más en el viaje: el presupuesto de siempre, sin nombres, sin «¿Para quién…?», sin «Cuentas del grupo» y sin [Para todos] / [Para mí].
 *   · `conjunta`  — un solo presupuesto común (pareja y familia): sin deudas. Al añadir algo: «Para los dos / Para todos» o «Solo para mí».
 *   · `cada_uno`  — cada uno lo suyo (amigos): los nombres, «Cuentas del grupo» con quién le debe a quién.
 *
 * Se guarda en el viaje (`route.modoCuentas`, `route.modoElegidoCon`, `route.nombreCuenta`), así viaja con la ruta compartida y llega en directo a todos.
 * Sin elegir, sale por «¿Con quién viajas?»: pareja o familia → conjunta; amigos → cada uno lo suyo; solo → solo.
 * Un viaje de una persona al que entra alguien: `cada_uno` y `pendiente` hasta que el administrador elija. Una cuenta conjunta a la que entra un tercero: sigue como estaba y `pendiente` otra vez.
 * Solo el administrador la cambia.
 */
export type ModoCuentas = 'solo' | 'conjunta' | 'cada_uno'

export interface EstadoModoCuentas {
  modo: ModoCuentas
  /** Hay que preguntarle al administrador «¿Cómo lleváis las cuentas?» (entró alguien y no ha elegido). */
  pendiente: boolean
  /** El nombre de la cuenta conjunta: el que le pusieron o «Cuenta conjunta». */
  nombre: string
  /** El nombre que le pusieron, o '' si no tiene. */
  nombrePuesto: string
  esAdmin: boolean
  /** Cuántas personas hay en el viaje (con el administrador). */
  personas: number
}

/** Pura: el modo, si falta preguntarlo y cuánta gente se espera, a partir de la ruta y de cuántas personas hay. */
export function resolverModo(route: Pick<Route, 'answers' | 'modoCuentas' | 'modoElegidoCon' | 'nombreCuenta'> | null | undefined, personas: number): { modo: ModoCuentas; pendiente: boolean } {
  if (personas <= 1) return { modo: 'solo', pendiente: false }
  const elegido = route?.modoCuentas === 'conjunta' || route?.modoCuentas === 'cada_uno' ? route.modoCuentas : null
  const conCuantos = route?.modoElegidoCon ?? 0
  if (elegido) {
    // Elegida a mano: solo se vuelve a preguntar si es conjunta y entra alguien más (a partir de tres).
    return { modo: elegido, pendiente: elegido === 'conjunta' && personas >= 3 && personas > conCuantos }
  }
  const a = route?.answers
  const companion = a?.companion
  if (companion === 'couple') return { modo: 'conjunta', pendiente: personas > 2 }
  if (companion === 'family') {
    const esperadas = Math.max(2, totalCompanionPeople('family', a?.companionAdults, a?.companionChildrenAges, a?.companionGroupSize))
    return { modo: 'conjunta', pendiente: personas > esperadas }
  }
  if (companion === 'group') return { modo: 'cada_uno', pendiente: false }
  // Un viaje de una persona al que entra alguien: no sabemos si son pareja o amigos. «Cada uno lo suyo» hasta que el administrador elija.
  return { modo: 'cada_uno', pendiente: true }
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

/** «Eric y Ana» / «Eric, Ana y Luis» a partir de los nombres de pila. */
function frase(nombres: string[]): string {
  const n = nombres.filter(Boolean)
  if (n.length <= 1) return n[0] ?? ''
  return `${n.slice(0, -1).join(', ')} y ${n[n.length - 1]}`
}

/** «Cuenta conjunta · Eric y Ana» (sin los nombres si aún no hay ninguno). */
export function etiquetaCuentaConjunta(nombres: string[], nombrePuesto = ''): string {
  const f = frase(nombres.map((x) => nombreVisible(x)))
  const nombre = nombrePuesto.trim() || 'Cuenta conjunta'
  return f ? `${nombre} · ${f}` : nombre
}

export function useModoCuentas(): EstadoModoCuentas {
  const route = useRouteStore((s) => s.route)
  const gente = useViajeCompartido((s) => s.gente)
  // El administrador es quien lo ve «desde dentro»: sin cuentas o sin ser invitado. (Mismo criterio que usePermisosDelViaje, sin colgar el hook de más cosas.)
  const invitado = esInvitadoAhora()
  const personas = Math.max(gente.length, invitado ? 2 : 1)
  const rol = miPermisoAhora()
  return useMemo(() => {
    const r = resolverModo(route, personas)
    const puesto = (route?.nombreCuenta ?? '').trim()
    return { modo: r.modo, pendiente: r.pendiente, nombre: puesto || 'Cuenta conjunta', nombrePuesto: puesto, esAdmin: rol === 'admin', personas }
  }, [route, personas, rol])
}

/** El administrador elige cómo llevar las cuentas. Devuelve false si quien llama no es el administrador. */
export function setModoCuentas(modo: Exclude<ModoCuentas, 'solo'>): boolean {
  if (miPermisoAhora() !== 'admin') return false
  useRouteStore.getState().setModoCuentasRuta(modo, personasAhora())
  return true
}

/** Quien puede editar (administrador o «Editar») le cambia el nombre a la cuenta conjunta. Devuelve false si solo recomienda. */
export function setNombreCuentaConjunta(nombre: string): boolean {
  if (miPermisoAhora() === 'recomendar') return false
  useRouteStore.getState().setNombreCuenta(nombre)
  return true
}

// Solo desarrollo: window.__modoCuentas.poner('cada_uno' | 'conjunta') fija el modo del viaje abierto (pruebas y capturas).
if (import.meta.env.DEV && typeof window !== 'undefined') {
  ;(window as unknown as { __modoCuentas: unknown }).__modoCuentas = {
    poner: (modo: 'conjunta' | 'cada_uno', con?: number) => useRouteStore.getState().setModoCuentasRuta(modo, con ?? Math.max(useViajeCompartido.getState().gente.length, 2)),
  }
}
