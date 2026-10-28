import { aportacionesDelViaje } from './cuentasGrupo'
import { leerImporte, type Cambio, type Importe } from './dinero'
import { MONEDA_BASE } from './monedaFormato'

/**
 * LAS CUENTAS DEL GRUPO EN MONEDAS DISTINTAS (Tanda 10N7, 2b-5). Las cuentas se calculan SIEMPRE en una misma base (el euro, con el cambio del día) y cada uno las ve en su moneda con «≈».
 * Lo que está en una moneda sin cambio NO entra en esa cuenta en euros (no se inventa un número), pero tampoco se queda fuera sin avisar: aquí se separa para enseñarlo aparte con su moneda y
 * «Sin cambio a tu moneda».
 */
type EntradaAportaciones = Parameters<typeof aportacionesDelViaje>[0]

export interface SinCambio {
  id: string
  nombre: string
  precio: Importe
}

/** Los importes que cuentan pero no se pudieron pasar a euros por no haber cambio para su moneda. Pura. */
export function aportacionesSinCambio(entrada: Omit<EntradaAportaciones, 'moneda'>): SinCambio[] {
  const base = aportacionesDelViaje({ ...entrada, moneda: MONEDA_BASE })
  // Un cambio "de prueba" donde toda moneda desconocida vale 1: lo que solo aparece así es lo que se había quedado fuera por no tener cambio.
  const desconocidas = new Set<string>()
  const mirar = (i: Importe | null | undefined) => {
    if (i && i.currency !== MONEDA_BASE && !(entrada.cambio?.tasas?.[i.currency] > 0)) desconocidas.add(i.currency)
  }
  for (const g of entrada.gastos) mirar(g.precio)
  for (const r of entrada.reservas) mirar(leerImporte(r.precio))
  for (const g of entrada.entradasDeInvitados ?? []) for (const r of g.reservas) mirar(leerImporte(r.precio))
  for (const l of entrada.entran ?? []) mirar(l.precio)
  if (desconocidas.size === 0) return []
  const tasas = { ...(entrada.cambio?.tasas ?? {}) }
  for (const c of desconocidas) tasas[c] = 1
  const cambioDePrueba: Cambio = { fecha: entrada.cambio?.fecha ?? '', tasas }
  const conTodo = aportacionesDelViaje({ ...entrada, moneda: MONEDA_BASE, cambio: cambioDePrueba })
  const ya = new Set(base.map((a) => a.id))
  const original = new Map<string, Importe>()
  for (const g of entrada.gastos) if (g.precio) original.set(`gasto-${g.id}`, g.precio)
  for (const r of entrada.reservas) {
    const i = leerImporte(r.precio)
    if (i) original.set(`reserva-${r.id}`, i)
  }
  for (const g of entrada.entradasDeInvitados ?? []) for (const r of g.reservas) {
    const i = leerImporte(r.precio)
    if (i && !original.has(`reserva-${r.id}`)) original.set(`reserva-${r.id}`, i)
  }
  for (const l of entrada.entran ?? []) original.set(`${l.tipo}-${l.clave}`, l.precio)
  return conTodo.filter((a) => !ya.has(a.id) && original.has(a.id)).map((a) => ({ id: a.id, nombre: a.nombre, precio: original.get(a.id) as Importe }))
}
