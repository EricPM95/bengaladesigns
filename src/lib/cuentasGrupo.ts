import type { Importe, Cambio } from './dinero'
import { convertir, leerImporte } from './dinero'
import type { GastoCompartido } from './gastosCompartidos'
import { sumaAlGrupo } from './gastosCompartidos'
import type { Reservation } from './bookings'
import type { Presupuesto } from './presupuesto'
import { lineaCuenta } from './presupuesto'
import { entreDeLoDelAdmin, esSoloDe, reservaEsPersonal } from './loSuyo'

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
  origen: 'gasto' | 'reserva' | 'alojamiento' | 'coche' | 'vuelo'
  /** Clave de la línea del presupuesto (alojamiento y coche), para cambiar su «¿Entre quién?». */
  clave?: string
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
export interface LineaQueEntraSola {
  /** `aloj-…` o `coche`: la clave de la línea del presupuesto. */
  clave: string
  nombre: string
  precio: Importe
  tipo: 'alojamiento' | 'coche' | 'vuelo'
}

export function aportacionesDelViaje(entrada: { gastos: GastoCompartido[]; reservas: readonly Reservation[]; adminId: string | null; todos: string[]; moneda: string; cambio: Cambio | null; entran?: readonly LineaQueEntraSola[]; entreDe?: Record<string, string[]> | null; conVueloPropio?: ReadonlySet<string>; conAlojamientoPropio?: ReadonlySet<string>; entradasDeInvitados?: readonly { userId: string; reservas: readonly Reservation[] }[] }): Aportacion[] {
  const salida: Aportacion[] = []
  const aMoneda = (importe: Importe | null): number | null => {
    if (!importe) return null
    const c = convertir(importe, entrada.moneda, entrada.cambio)
    return c ? aCentimos(c) : null
  }
  // (Tanda 10N8 §0b-7) Un gasto con su foto del cambio se pasa a euros con el cambio DEL DÍA EN QUE SE APUNTÓ (no el de hoy); de euros a la moneda de quien mira, con el de hoy.
  const aMonedaDelGasto = (g: GastoCompartido): number | null => {
    const tasa = g.cambio?.tasas?.[g.precio.currency]
    if (!tasa || g.precio.currency === 'EUR') return aMoneda(g.precio)
    return aMoneda({ amount: g.precio.amount / tasa, currency: 'EUR' })
  }
  for (const g of entrada.gastos) {
    if (!sumaAlGrupo(g)) continue
    const c = aMonedaDelGasto(g)
    if (c === null || c <= 0) continue
    const pagan = g.pagadoPor.length > 0 ? g.pagadoPor : [g.autorId]
    // (Tanda 10N6 §1k) Un gasto solo para quien lo paga es personal: no es del grupo.
    if (g.entre?.length === 1 && pagan.length === 1 && g.entre[0] === pagan[0]) continue
    salida.push({ id: `gasto-${g.id}`, nombre: g.nombre, origen: 'gasto', centimos: c, pagan, entre: g.entre && g.entre.length > 0 ? g.entre : entrada.todos })
  }
  if (entrada.adminId) {
    // (Tanda 10N3) El alojamiento y el coche que el administrador pone en RESERVAS entran solos: los pagó él y se reparten entre todos (o entre quienes marque). Los billetes de avión NO: cada uno paga el suyo.
    for (const l of entrada.entran ?? []) {
      const c = aMoneda(l.precio)
      if (c === null || c <= 0) continue
      // (Tanda 10N5 §6c) Quien ha puesto SU vuelo o SU alojamiento sale del reparto del administrador (lo suyo es suyo y no se reparte); si no queda nadie, es del administrador.
      const entre = entreDeLoDelAdmin({ tipo: l.tipo, clave: l.clave, entreDe: entrada.entreDe, todos: entrada.todos, adminId: entrada.adminId, conVueloPropio: entrada.conVueloPropio, conAlojamientoPropio: entrada.conAlojamientoPropio })
      // (Tanda 10N6 §1k) Lo que es solo para quien lo paga es personal: no es del grupo ni cuenta en las cuentas.
      if (esSoloDe(entre, entrada.adminId)) continue
      salida.push({ id: `${l.tipo}-${l.clave}`, clave: l.clave, nombre: l.nombre, origen: l.tipo, centimos: c, pagan: [entrada.adminId], entre })
    }
    for (const r of entrada.reservas) {
      if (reservaEsPersonal(r.paraQuien, entrada.adminId)) continue
      const c = aMoneda(leerImporte(r.precio))
      if (c === null || c <= 0) continue
      salida.push({ id: `reserva-${r.id}`, nombre: r.name, origen: 'reserva', centimos: c, pagan: [entrada.adminId], entre: r.paraQuien })
    }
  }
  // (Tanda 10N5 §6c) Las entradas que ha reservado cualquier invitado para varias personas: las pagó quien reservó y se reparten entre su «¿Para quién es?». Las que son solo para él no cuentan.
  for (const grupo of entrada.entradasDeInvitados ?? []) {
    for (const r of grupo.reservas) {
      if (r.kind !== 'entrada' || reservaEsPersonal(r.paraQuien, grupo.userId)) continue
      const c = aMoneda(leerImporte(r.precio))
      if (c === null || c <= 0 || salida.some((a) => a.id === `reserva-${r.id}`)) continue
      salida.push({ id: `reserva-${r.id}`, nombre: r.name, origen: 'reserva', centimos: c, pagan: [grupo.userId], entre: r.paraQuien })
    }
  }
  return salida
}

const sinAcentos = (t: string): string => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
const PALABRAS: Record<'alojamiento' | 'coche' | 'vuelo', RegExp> = { alojamiento: /hotel|aloja|airbnb|apartamento|hostal|booking/, coche: /coche|alquiler|rent|vehiculo|furgo|autocaravana/, vuelo: /vuelo|billete|avion|aerolinea|ryanair|iberia|vueling|ida |vuelta|ida$/ }

export interface PosibleDuplicado {
  /** Lo que entró solo desde RESERVAS. */
  linea: string
  /** El gasto [Para todos] que parece lo mismo. */
  gasto: string
  centimos: number
}

/**
 * (Tanda 10N3) Que no se cuente nada dos veces: si el alojamiento o el coche que entran solos ya están apuntados como un gasto [Para todos] (mismo importe y mismo concepto: el nombre se parece o dice «hotel» /
 * «coche»…), se avisa. Se sigue contando todo: quien lo apuntó decide cuál quitar.
 */
export function posiblesDuplicados(aportaciones: readonly Aportacion[]): PosibleDuplicado[] {
  const salida: PosibleDuplicado[] = []
  const gastos = aportaciones.filter((a) => a.origen === 'gasto')
  for (const a of aportaciones) {
    // (Tanda 10N5) También el vuelo del administrador y las entradas reservadas por alguien: si ya hay un gasto [Para todos] igual (mismo importe y concepto parecido), se avisa.
    if (a.origen !== 'alojamiento' && a.origen !== 'coche' && a.origen !== 'vuelo' && a.origen !== 'reserva') continue
    const n = sinAcentos(a.nombre)
    const igual = gastos.find((g) => {
      if (g.centimos !== a.centimos) return false
      const m = sinAcentos(g.nombre)
      return m.includes(n) || n.includes(m) || (a.origen !== 'reserva' && PALABRAS[a.origen as 'alojamiento' | 'coche' | 'vuelo'].test(m))
    })
    if (igual) salida.push({ linea: a.nombre, gasto: igual.nombre, centimos: a.centimos })
  }
  return salida
}

/**
 * (Tanda 10N3) Lo que le toca a UNA persona de lo que ve el presupuesto, para el «por persona»: lo de todos entre N; lo que va «entre quién» (un gasto con lista, una entrada reservada para 2 de 4, el alojamiento entre unos
 * pocos) solo a los marcados. `null` en las líneas que no se cuentan.
 */
export function parteDeUnaPersona(lineas: { centimos: number; entre: readonly string[] | null }[], personaId: string, todos: readonly string[]): number {
  let total = 0
  for (const l of lineas) {
    const entre = l.entre && l.entre.length > 0 ? l.entre : todos
    if (!entre.includes(personaId)) continue
    total += Math.floor(l.centimos / entre.length)
  }
  return total
}

/**
 * (Tanda 10N3) El «por persona» del presupuesto de un viaje compartido, con «¿Para quién es?» y «¿Entre quién?»: una entrada reservada para 2 de 4 cuenta solo entre esos 2; un gasto con lista, solo entre los marcados;
 * el alojamiento y el coche, entre todos o entre quienes marque el administrador; una reserva sin «¿Para quién es?» es solo del administrador; lo demás (billetes, seguro, eSIM, traslados), entre todos.
 * Si TODO es entre todos, es el total entre las personas (como siempre). Si no, no hay un «por persona» único: sale la parte de quien mira (`tuParte`).
 */
export function porPersonaDelPresupuesto(e: { presupuesto: Presupuesto; gastos: readonly GastoCompartido[]; reservas: readonly Reservation[]; entreDe: Record<string, string[]> | null | undefined; adminId: string | null; todos: string[]; yoId: string | null; conVueloPropio?: ReadonlySet<string>; conAlojamientoPropio?: ReadonlySet<string> }): { centimos: number; tuParte: boolean } {
  const lineas: { centimos: number; entre: string[] | null }[] = []
  let total = 0
  // (Tanda 10N6 §1k) Lo personal (reservas, alojamiento, coche, vuelos solo para quien los paga, y los [Para mí]) no suma al grupo pero SÍ a «Tu parte» de esa persona (solo lo suyo llega aquí).
  let personales = 0
  for (const b of e.presupuesto.bloques) {
    for (const l of b.lineas) {
      if (!lineaCuenta(l)) {
        // (Solo lo personal de reservas, alojamiento, coche y vuelos: los [Para mí] de Extras, los pendientes y los rechazados siguen como antes, sin contar aquí.)
        if (l.enMonedaViajero && l.personal) personales += aCentimos(l.enMonedaViajero)
        continue
      }
      if (!l.enMonedaViajero) continue
      const centimos = aCentimos(l.enMonedaViajero)
      total += centimos
      let entre: string[] | null = null
      if (l.compartido?.gastoId) entre = e.gastos.find((g) => g.id === l.compartido!.gastoId)?.entre ?? null
      else if (l.abrir.tipo === 'reserva') {
        const r = e.reservas.find((x) => x.id === (l.abrir as { reservationId: string }).reservationId)
        entre = r?.paraQuien && r.paraQuien.length > 0 ? r.paraQuien : e.adminId ? [e.adminId] : null
      } else if (l.abrir.tipo === 'alojamiento' || l.abrir.tipo === 'coche') {
        entre = entreDeLoDelAdmin({ tipo: l.abrir.tipo, clave: l.id, entreDe: e.entreDe, todos: e.todos, adminId: e.adminId, conAlojamientoPropio: e.conAlojamientoPropio })
      } else if (l.abrir.tipo === 'llegada' || l.abrir.tipo === 'vuelta') {
        // (Tanda 10N5) Los vuelos del administrador se reparten entre para quien son, sin quien ha puesto el suyo.
        entre = entreDeLoDelAdmin({ tipo: 'vuelo', clave: l.id, entreDe: e.entreDe, todos: e.todos, adminId: e.adminId, conVueloPropio: e.conVueloPropio })
      } else if (l.entre && l.entre.length > 0) entre = [...l.entre]
      lineas.push({ centimos, entre: entre && entre.length > 0 ? entre : null })
    }
  }
  // (Tanda 10N8 §0a-6 y 8b-d) Lo «Solo tú» (reservas, vuelos… y los gastos [Para mí] de Extras) está en su bloque «Lo tuyo»: es dinero que paga esta persona y SÍ cuenta en «Tu parte» (no en lo del grupo).
  for (const l of e.presupuesto.loTuyo ?? []) if (l.enMonedaViajero) personales += aCentimos(l.enMonedaViajero)
  const todoEntreTodos = lineas.every((l) => l.entre === null || e.todos.every((id) => l.entre!.includes(id)))
  if ((todoEntreTodos && personales === 0) || !e.yoId) return { centimos: e.todos.length > 0 ? Math.round(total / e.todos.length) : total, tuParte: false }
  return { centimos: parteDeUnaPersona(lineas, e.yoId, e.todos) + personales, tuParte: true }
}
