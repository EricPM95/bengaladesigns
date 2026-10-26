import { useMemo } from 'react'
import { aportacionesDelViaje, calcularCuentas, posiblesDuplicados, type Aportacion, type Cuentas, type LineaQueEntraSola, type PosibleDuplicado } from '../lib/cuentasGrupo'
import { usePresupuesto } from '../lib/usePresupuesto'
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
  /** (Tanda 10N3) Todo lo que cuenta, con el alojamiento y el coche que entran solos desde RESERVAS. */
  aportaciones: Aportacion[]
  /** Lo que parece contado dos veces (un gasto [Para todos] igual que el alojamiento o el coche de RESERVAS). */
  duplicados: PosibleDuplicado[]
}

export function useCuentasDelGrupo(): CuentasDelGrupo {
  const gv = useGastosDelViaje()
  const route = useRouteStore((s) => s.route)
  const reservations = useRouteStore((s) => s.reservations)
  const pagos = useGastosCompartidos((s) => s.pagos)
  const exMiembros = useGastosCompartidos((s) => s.exMiembros)
  const cuentasOk = useGastosCompartidos((s) => s.cuentas)
  const cambio = useCambio()
  const { presupuesto } = usePresupuesto()
  const moneda = monedaDelViajero(route)
  const admin = gv.personas.find((p) => p.esAdmin)?.id ?? null

  return useMemo(() => {
    const ids = gv.personas.map((p) => p.id)
    const conNombre = [
      ...gv.personas.map((p) => ({ id: p.id, nombre: p.nombre?.trim() || '' })),
      ...exMiembros.filter((e) => !ids.includes(e.id)).map((e) => ({ id: e.id, nombre: e.nombre?.trim() || '' })),
    ]
    // (Tanda 10N3) El alojamiento y el coche del administrador entran solos (los billetes de avión, no: cada uno paga el suyo).
    const entran: LineaQueEntraSola[] = []
    for (const l of (presupuesto?.bloques ?? []).flatMap((b) => b.lineas)) {
      if (l.abrir.tipo === 'alojamiento') entran.push({ clave: l.id, nombre: l.nombre, precio: l.precio, tipo: 'alojamiento' })
      else if (l.abrir.tipo === 'coche') entran.push({ clave: l.id, nombre: l.nombre, precio: l.precio, tipo: 'coche' })
    }
    const aportaciones = aportacionesDelViaje({ gastos: gv.gastos, reservas: reservations, adminId: admin, todos: ids, moneda, cambio, entran, entreDe: route?.cuentasEntre ?? null })
    const cuentas = compartidoVacio(gv.compartido) ?? calcularCuentas({ aportaciones, pagos, personas: conNombre, todos: ids })
    // (Alguien que ya no está y no aparece en ningún gasto no sale; si sale con algo, lleva su nombre o «Alguien».)
    const personas = cuentas.personas.map((c) => {
      const viva = gv.personas.find((p) => p.id === c.id)
      return viva ? { ...viva, salio: false } : ({ id: c.id, nombre: c.nombre || null, foto: null, esAdmin: false, salio: true } as Persona & { salio: boolean })
    })
    return { compartido: gv.compartido, moneda, cuentas, personas, puedeMarcarPagos: cuentasOk, nombreDe: (id: string) => cuentas.personas.find((p) => p.id === id)?.nombre || gv.nombreDe(id), aportaciones, duplicados: posiblesDuplicados(aportaciones) }
  }, [gv, reservations, admin, moneda, cambio, pagos, exMiembros, cuentasOk, presupuesto, route?.cuentasEntre])
}

/** Sin viaje compartido no se calcula nada. */
function compartidoVacio(compartido: boolean): Cuentas | null {
  return compartido ? null : { total: 0, personas: [], aPartesIguales: true, porPersona: null, pendientes: [], pagados: [], enPaz: false, hayGastos: false }
}
