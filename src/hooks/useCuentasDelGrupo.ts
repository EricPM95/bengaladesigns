import { useMemo } from 'react'
import { aportacionesDelViaje, calcularCuentas, type Cuentas } from '../lib/cuentasGrupo'
import { monedaDelViajero, useCambio } from '../lib/useMoneda'
import { useRouteStore } from '../store/useRouteStore'
import { useGastosCompartidos } from '../store/useGastosCompartidos'
import type { Persona } from '../store/useViajeCompartido'
import { useGastosDelViaje } from './useGastosDelViaje'

/**
 * LAS CUENTAS DEL GRUPO DEL VIAJE ABIERTO (Tanda 10N2). Solo en un viaje compartido (`compartido`): los gastos [Para todos] aceptados y las entradas del dueño reservadas para varios, repartidos entre los marcados.
 * Quien salió del viaje (o a quien quitaron) sigue en las cuentas con su nombre si puso algo o le tocaba algo.
 */
export interface CuentasDelGrupo {
  compartido: boolean
  moneda: string
  cuentas: Cuentas
  /** Las personas que salen en las cuentas (las del viaje y quien salió con algo pendiente); `salio` marca a quien ya no está. */
  personas: (Persona & { salio: boolean })[]
  /** ¿Existe la migración 0040? Sin ella no se pueden marcar pagos. */
  puedeMarcarPagos: boolean
  nombreDe: (id: string) => string
}

export function useCuentasDelGrupo(): CuentasDelGrupo {
  const gv = useGastosDelViaje()
  const route = useRouteStore((s) => s.route)
  const reservations = useRouteStore((s) => s.reservations)
  const pagos = useGastosCompartidos((s) => s.pagos)
  const exMiembros = useGastosCompartidos((s) => s.exMiembros)
  const cuentasOk = useGastosCompartidos((s) => s.cuentas)
  const cambio = useCambio()
  const moneda = monedaDelViajero(route)
  const admin = gv.personas.find((p) => p.esAdmin)?.id ?? null

  return useMemo(() => {
    const ids = gv.personas.map((p) => p.id)
    const conNombre = [
      ...gv.personas.map((p) => ({ id: p.id, nombre: p.nombre?.trim() || '' })),
      ...exMiembros.filter((e) => !ids.includes(e.id)).map((e) => ({ id: e.id, nombre: e.nombre?.trim() || '' })),
    ]
    const aportaciones = aportacionesDelViaje({ gastos: gv.gastos, reservas: reservations, adminId: admin, todos: ids, moneda, cambio })
    const cuentas = compartidoVacio(gv.compartido) ?? calcularCuentas({ aportaciones, pagos, personas: conNombre, todos: ids })
    // (Alguien que ya no está y no aparece en ningún gasto no sale; si sale con algo, lleva su nombre o «Alguien».)
    const personas = cuentas.personas.map((c) => {
      const viva = gv.personas.find((p) => p.id === c.id)
      return viva ? { ...viva, salio: false } : ({ id: c.id, nombre: c.nombre || null, foto: null, esAdmin: false, salio: true } as Persona & { salio: boolean })
    })
    return { compartido: gv.compartido, moneda, cuentas, personas, puedeMarcarPagos: cuentasOk, nombreDe: (id: string) => cuentas.personas.find((p) => p.id === id)?.nombre || gv.nombreDe(id) }
  }, [gv, reservations, admin, moneda, cambio, pagos, exMiembros, cuentasOk])
}

/** Sin viaje compartido no se calcula nada. */
function compartidoVacio(compartido: boolean): Cuentas | null {
  return compartido ? null : { total: 0, personas: [], aPartesIguales: true, porPersona: null, pendientes: [], pagados: [], enPaz: false, hayGastos: false }
}
