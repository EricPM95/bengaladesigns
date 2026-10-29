import { useMemo } from 'react'
import { aportacionesDelViaje, calcularCuentas, posiblesDuplicados, type Aportacion, type Cuentas, type LineaQueEntraSola, type PosibleDuplicado } from '../lib/cuentasGrupo'
import { usePresupuesto } from '../lib/usePresupuesto'
import { useCambio } from '../lib/useMoneda'
import { MONEDA_BASE, formatearCentimosBase, useMonedaViajero } from '../lib/moneda'
import { aportacionesSinCambio, type SinCambio } from '../lib/cuentasMoneda'
import { useRouteStore } from '../store/useRouteStore'
import { useGastosCompartidos } from '../store/useGastosCompartidos'
import type { Persona } from '../store/useViajeCompartido'
import { useGastosDelViaje } from './useGastosDelViaje'
import { useLoSuyoDelViaje } from './useLoSuyoDelViaje'
import { useLoSuyo } from '../store/useLoSuyo'
import { idsConLoSuyo } from '../lib/loSuyo'
import { nombreVisible } from '../lib/nombrePersona'
import { resolverModo } from '../lib/modoCuentas'
import { cuentaDelViaje, entreSinDecir, esFamilia } from '../lib/cuentaDelViaje'

/**
 * LAS CUENTAS DEL GRUPO DEL VIAJE ABIERTO (Tanda 10N2). Solo en un viaje compartido (`compartido`): los gastos [Para todos] aceptados y las entradas del dueño reservadas para varios, repartidos entre los marcados.
 * Quien salió del viaje (o a quien quitaron) sigue en las cuentas con su nombre si puso algo o le tocaba algo.
 */
export interface CuentasDelGrupo {
  compartido: boolean
  /** (10N7) La BASE de las cuentas: siempre el euro, con el cambio del día. Lo que se enseña lo pasa `texto` a la moneda de quien mira. */
  moneda: string
  /** (10N7) Céntimos de la base → texto en la moneda del viajero («≈ 322 MXN»; en euros si es la suya o no hay cambio). */
  texto: (centimos: number) => string
  /** (10N7) La moneda con la que mira esta persona, y si lo que enseña es aproximado («≈»). */
  monedaVista: string
  aproximado: boolean
  /** (10N7) Lo que cuenta pero está en una moneda sin cambio: no entra en las cuentas en euros, sale aparte con su moneda. */
  sinCambio: SinCambio[]
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
  const moneda = MONEDA_BASE
  const vista = useMonedaViajero()
  const admin = gv.personas.find((p) => p.esAdmin)?.id ?? null
  useLoSuyoDelViaje()
  const grupoLoSuyo = useLoSuyo((s) => s.grupo)
  const entradasInv = useLoSuyo((s) => s.entradas)

  return useMemo(() => {
    const ids = gv.personas.map((p) => p.id)
    const modo = resolverModo(route, ids.length).modo
    // (Tanda 10N10 §5a) Lo apuntado en la cuenta conjunta de cuando eran dos se queda entre esos dos al pasar a la del grupo.
    const porDefecto = entreSinDecir(route, cuentaDelViaje(ids.length, esFamilia(route)), ids)
    const conNombre = [
      ...gv.personas.map((p) => ({ id: p.id, nombre: nombreVisible(p.nombre) })),
      ...exMiembros.filter((e) => !ids.includes(e.id)).map((e) => ({ id: e.id, nombre: nombreVisible(e.nombre) })),
    ]
    // (Tanda 10N3) El alojamiento y el coche del administrador entran solos (los billetes de avión, no: cada uno paga el suyo).
    const entran: LineaQueEntraSola[] = []
    for (const l of [...(presupuesto?.bloques ?? []).flatMap((b) => b.lineas), ...(presupuesto?.ocultas ?? [])]) {
      if (l.abrir.tipo === 'alojamiento') entran.push({ clave: l.id, nombre: l.nombre, precio: l.precio, tipo: 'alojamiento' })
      else if (l.abrir.tipo === 'coche') entran.push({ clave: l.id, nombre: l.nombre, precio: l.precio, tipo: 'coche' })
      // (Tanda 10N5 §6c) Los vuelos del administrador ahora SÍ entran (cambia lo de la 10N3): se reparten entre para quién son, sin quien ha puesto el suyo.
      else if (l.abrir.tipo === 'llegada' || l.abrir.tipo === 'vuelta') entran.push({ clave: l.id, nombre: l.nombre, precio: l.precio, tipo: 'vuelo' })
    }
    const entradaAportaciones = { gastos: gv.gastos, reservas: reservations, adminId: admin, todos: ids, porDefecto, modo, pagadoPorDe: route?.pagadoPorDe ?? null, cambio, entran, entreDe: route?.cuentasEntre ?? null, conVueloPropio: idsConLoSuyo(grupoLoSuyo, 'vuelo'), conAlojamientoPropio: idsConLoSuyo(grupoLoSuyo, 'alojamiento'), entradasDeInvitados: entradasInv }
    const aportaciones = aportacionesDelViaje({ ...entradaAportaciones, moneda })
    const sinCambio = aportacionesSinCambio(entradaAportaciones)
    const cuentas = compartidoVacio(gv.compartido) ?? calcularCuentas({ aportaciones, pagos, personas: conNombre, todos: ids })
    // (Alguien que ya no está y no aparece en ningún gasto no sale; si sale con algo, lleva su nombre o «Alguien».)
    const personas = cuentas.personas.map((c) => {
      const viva = gv.personas.find((p) => p.id === c.id)
      return viva ? { ...viva, salio: false } : ({ id: c.id, nombre: c.nombre || null, foto: null, esAdmin: false, salio: true } as Persona & { salio: boolean })
    })
    return { compartido: gv.compartido, moneda, texto: (c: number) => formatearCentimosBase(c, { codigo: vista.moneda, cambio: vista.cambio }), monedaVista: vista.moneda, aproximado: vista.moneda !== MONEDA_BASE && Boolean(vista.cambio?.tasas?.[vista.moneda]), sinCambio, cuentas, personas, puedeMarcarPagos: cuentasOk, nombreDe: (id: string) => cuentas.personas.find((p) => p.id === id)?.nombre || gv.nombreDe(id), aportaciones, duplicados: posiblesDuplicados(aportaciones) }
  }, [gv, reservations, admin, moneda, cambio, pagos, exMiembros, cuentasOk, presupuesto, route?.cuentasEntre, route?.cuentaConjuntaCon, route?.answers?.companion, grupoLoSuyo, entradasInv, vista.moneda, vista.cambio])
}

/** Sin viaje compartido no se calcula nada. */
function compartidoVacio(compartido: boolean): Cuentas | null {
  return compartido ? null : { total: 0, personas: [], aPartesIguales: true, porPersona: null, pendientes: [], pagados: [], enPaz: false, hayGastos: false }
}
