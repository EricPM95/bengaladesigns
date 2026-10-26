import type { Importe, Cambio } from './dinero'
import { convertir, leerImporte } from './dinero'
import type { GastoCompartido } from './gastosCompartidos'
import { sumaAlGrupo } from './gastosCompartidos'
import type { Reservation } from './bookings'

/**
 * LAS CUENTAS DEL GRUPO, QUIÉN LE DEBE A QUIÉN (Tanda 10N2; diseño `Piezas/Cuentas Grupo`). Funciones puras, sin React ni red. Todo en CÉNTIMOS enteros (nunca decimales de coma flotante), en la moneda del viajero.
 *
 *   · Un gasto [Para todos] ya aceptado (o una entrada reservada para varios) lo pagan una o varias personas y se reparte a partes iguales ENTRE los marcados.
 *   · Los céntimos que sobran al repartir (100 € entre 3) los asume quien lo pagó: así las cuentas cuadran siempre al céntimo (la suma de los saldos es 0).
 *   · No cuentan: los [Para mí], los pendientes de que los acepten, los rechazados, ni lo que no tiene cambio a la moneda del viajero.
 *   · saldo = lo que ha pagado − lo que le toca + lo que ha enviado en pagos − lo que ha recibido en pagos. Positivo: le deben; negativo: debe.
 *   · «Para quedar en paz»: lo mínimo de pagos entre los saldos que quedan (el que más debe al que más le deben, y así hasta cero).
 */
export interface Aportacion {
  id: string
  nombre: string
  origen: 'gasto' | 'reserva'
  centimos: number
  /** Quién lo pagó (ids). */
  pagan: string[]
  /** Entre quién se reparte (ids). */
  entre: string[]
}

export interface PagoMarcado {
  id: string
  deudorId: string
  acreedorId: string
  centimos: number
  marcadoPor: string
}

export interface PersonaCuenta {
  id: string
  nombre: string
  pagado: number
  toca: number
  enviado: number
  recibido: number
  saldo: number
}

export interface PagoPendiente {
  deudorId: string
  acreedorId: string
  centimos: number
}

export interface Cuentas {
  total: number
  personas: PersonaCuenta[]
  /** ¿Todos los gastos son entre todos? Entonces «a partes iguales» y hay «por persona». */
  aPartesIguales: boolean
  porPersona: number | null
  pendientes: PagoPendiente[]
  pagados: PagoMarcado[]
  /** Hay gastos contados y todos los saldos están a cero. */
  enPaz: boolean
  hayGastos: boolean
}

export const aCentimos = (importe: Importe): number => Math.round(importe.amount * 100)
export const deCentimos = (centimos: number, currency: string): Importe => ({ amount: centimos / 100, currency })

/**
 * Reparte un gasto: quien paga adelanta el total (a partes iguales entre los que pagan; el resto, al primero) y cada uno de los marcados asume su parte (los céntimos que sobran, al que pagó).
 * Devuelve lo pagado y lo que toca a cada persona; ambos suman `centimos`.
 */
export function repartir(centimos: number, pagan: readonly string[], entre: readonly string[]): { pagado: Map<string, number>; toca: Map<string, number> } {
  const pagado = new Map<string, number>()
  const toca = new Map<string, number>()
  if (centimos <= 0 || pagan.length === 0 || entre.length === 0) return { pagado, toca }
  const parte = Math.floor(centimos / pagan.length)
  pagan.forEach((id, i) => pagado.set(id, (pagado.get(id) ?? 0) + parte + (i === 0 ? centimos - parte * pagan.length : 0)))
  const cada = Math.floor(centimos / entre.length)
  entre.forEach((id) => toca.set(id, (toca.get(id) ?? 0) + cada))
  const sobra = centimos - cada * entre.length
  if (sobra > 0) toca.set(pagan[0], (toca.get(pagan[0]) ?? 0) + sobra)
  return { pagado, toca }
}

/** «30 € cada uno», con el céntimo que sobra aparte: lo que toca a cada uno sin contar el resto de quien paga. */
export const cadaUno = (centimos: number, entre: number): number => (entre > 0 ? Math.floor(centimos / entre) : 0)

/** Los pagos mínimos para dejar a todos a cero. El que más debe paga al que más le deben. */
export function pagosParaQuedarEnPaz(saldos: ReadonlyMap<string, number>): PagoPendiente[] {
  const deben = [...saldos].filter(([, s]) => s < 0).map(([id, s]) => ({ id, resto: -s }))
  const cobran = [...saldos].filter(([, s]) => s > 0).map(([id, s]) => ({ id, resto: s }))
  const orden = (a: { resto: number }, b: { resto: number }) => b.resto - a.resto
  const pagos: PagoPendiente[] = []
  while (deben.length > 0 && cobran.length > 0) {
    deben.sort(orden)
    cobran.sort(orden)
    const d = deben[0]
    const c = cobran[0]
    const x = Math.min(d.resto, c.resto)
    pagos.push({ deudorId: d.id, acreedorId: c.id, centimos: x })
    d.resto -= x
    c.resto -= x
    if (d.resto === 0) deben.shift()
    if (c.resto === 0) cobran.shift()
  }
  return pagos
}

/**
 * `personas`: las del viaje y, si se quiere, quien salió (para ponerle nombre); `todos`: los ids de quienes están AHORA en el viaje (por defecto, todas las `personas`): a ellos se reparte lo que no dice «entre quién»
 * y ellos cuentan para «a partes iguales» y el «por persona». Quien salió solo sale en las cuentas si tiene algo puesto o pendiente.
 */
export function calcularCuentas(entrada: { aportaciones: Aportacion[]; pagos: PagoMarcado[]; personas: { id: string; nombre: string }[]; todos?: string[] }): Cuentas {
  const mapa = new Map<string, PersonaCuenta>()
  const persona = (id: string): PersonaCuenta => {
    let p = mapa.get(id)
    if (!p) {
      p = { id, nombre: entrada.personas.find((x) => x.id === id)?.nombre ?? '', pagado: 0, toca: 0, enviado: 0, recibido: 0, saldo: 0 }
      mapa.set(id, p)
    }
    return p
  }
  for (const x of entrada.personas) persona(x.id)
  const todos = entrada.todos ?? entrada.personas.map((p) => p.id)
  let total = 0
  let iguales = true
  for (const a of entrada.aportaciones) {
    const entre = a.entre.length > 0 ? a.entre : todos
    const r = repartir(a.centimos, a.pagan, entre)
    for (const [id, c] of r.pagado) persona(id).pagado += c
    for (const [id, c] of r.toca) persona(id).toca += c
    total += a.centimos
    if (!todos.every((id) => entre.includes(id))) iguales = false
  }
  for (const p of entrada.pagos) {
    persona(p.deudorId).enviado += p.centimos
    persona(p.acreedorId).recibido += p.centimos
  }
  const personas = [...mapa.values()]
    .map((p) => ({ ...p, saldo: p.pagado - p.toca + p.enviado - p.recibido }))
    .filter((p) => todos.includes(p.id) || p.pagado !== 0 || p.toca !== 0 || p.enviado !== 0 || p.recibido !== 0)
  const pendientes = pagosParaQuedarEnPaz(new Map(personas.map((p) => [p.id, p.saldo])))
  const hayGastos = entrada.aportaciones.length > 0
  return {
    total,
    personas,
    aPartesIguales: iguales,
    porPersona: iguales && todos.length > 0 ? Math.round(total / todos.length) : null,
    pendientes,
    pagados: entrada.pagos,
    enPaz: hayGastos && pendientes.length === 0,
    hayGastos,
  }
}

/**
 * Lo que cuenta del presupuesto para las cuentas: los gastos [Para todos] aceptados y las entradas del dueño reservadas para varios (las paga el dueño y se reparten entre las marcadas; sin `paraQuien`, es
 * «solo para mí» y no cuenta). Lo que está en una moneda sin cambio a la del viajero se deja fuera (no se inventa un número).
 */
export function aportacionesDelViaje(entrada: { gastos: GastoCompartido[]; reservas: readonly Reservation[]; adminId: string | null; todos: string[]; moneda: string; cambio: Cambio | null }): Aportacion[] {
  const salida: Aportacion[] = []
  const aMoneda = (importe: Importe | null): number | null => {
    if (!importe) return null
    const c = convertir(importe, entrada.moneda, entrada.cambio)
    return c ? aCentimos(c) : null
  }
  for (const g of entrada.gastos) {
    if (!sumaAlGrupo(g)) continue
    const c = aMoneda(g.precio)
    if (c === null || c <= 0) continue
    salida.push({ id: `gasto-${g.id}`, nombre: g.nombre, origen: 'gasto', centimos: c, pagan: g.pagadoPor.length > 0 ? g.pagadoPor : [g.autorId], entre: g.entre && g.entre.length > 0 ? g.entre : entrada.todos })
  }
  if (entrada.adminId) {
    for (const r of entrada.reservas) {
      if (!r.paraQuien || r.paraQuien.length === 0) continue
      const c = aMoneda(leerImporte(r.precio))
      if (c === null || c <= 0) continue
      salida.push({ id: `reserva-${r.id}`, nombre: r.name, origen: 'reserva', centimos: c, pagan: [entrada.adminId], entre: r.paraQuien })
    }
  }
  return salida
}
