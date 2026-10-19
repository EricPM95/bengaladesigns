import type { DayPlan, Route, Stop } from './types'
import { fichaDelDia, fechaDelDia } from './nombreDeDia'
import { ordenTrasMover, type TipoDeRecomendacion } from './aplicarRecomendacion'

/**
 * LA PROPUESTA (cuentas parte 3, punto 3: «Recomendar cambios»). Parte PURA, sin pantalla ni red, para poder probarla sola.
 *
 * Una persona invitada hace sus cambios con las herramientas de siempre sobre una COPIA de la ruta del administrador (RM, el modo recomendación): nada cambia de verdad hasta [Enviar].
 * Aquí está:
 *   · `lineasDeCambio`: la comparación de dos listas (qué se queda, qué sale, qué entra, qué se mueve) y la PAREJA «cambiar una parada por otra» (lo que sale y lo que entra en el
 *     mismo sitio forman una pareja, y así se guarda, se enseña y se acepta);
 *   · `cambiosDeLaPropuesta`: los cambios de la copia respecto de la ruta del administrador, por días, con su pareja;
 *   · `deshacerCambio`: el [Deshacer] de cada uno;
 *   · `construirRecomendacion`: el paquete que se manda (una parada, un día o la ruta entera, según lo que haya cambiado: R2a, R2b y R2c);
 *   · `lineasDelDia`: lo que ve el administrador en R2 («solo los días que cambian; lo que sale, tachado en rojo; lo que entra, en verde; lo que no cambia, en gris»).
 */

/* ------------------------------------------------------------------ */
/* Comparar dos listas                                                 */
/* ------------------------------------------------------------------ */

export type Linea<T> = { tipo: 'igual'; a: T; b: T } | { tipo: 'sale'; a: T } | { tipo: 'entra'; b: T } | { tipo: 'pareja'; a: T; b: T } | { tipo: 'mueve'; b: T }

/**
 * Compara «antes» y «despues» y devuelve las líneas en el orden en que se leen. Lo que sale y lo que entra juntos (en el mismo hueco) forman una `pareja` («cambiar una por otra»);
 * lo que está en las dos listas pero en otro orden es un `mueve`.
 */
export function lineasDeCambio<T>(antes: T[], despues: T[], clave: (x: T) => string): Linea<T>[] {
  const n = antes.length
  const m = despues.length
  // La subsecuencia común más larga (lo que se queda en su orden).
  const l: number[][] = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0))
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) l[i][j] = clave(antes[i]) === clave(despues[j]) ? l[i + 1][j + 1] + 1 : Math.max(l[i + 1][j], l[i][j + 1])
  const ops: Linea<T>[] = []
  let i = 0
  let j = 0
  while (i < n || j < m) {
    if (i < n && j < m && clave(antes[i]) === clave(despues[j])) {
      ops.push({ tipo: 'igual', a: antes[i], b: despues[j] })
      i++
      j++
    } else if (i < n && (j >= m || l[i + 1][j] >= l[i][j + 1])) {
      ops.push({ tipo: 'sale', a: antes[i] })
      i++
    } else {
      ops.push({ tipo: 'entra', b: despues[j] })
      j++
    }
  }
  // Lo que sale y entra a la vez con el mismo nombre es una parada que se movió.
  const quitadas = new Set(ops.filter((o) => o.tipo === 'sale').map((o) => clave((o as { a: T }).a)))
  const puestas = new Set(ops.filter((o) => o.tipo === 'entra').map((o) => clave((o as { b: T }).b)))
  const movidas = new Set([...quitadas].filter((k) => puestas.has(k)))
  const sinMovidas: Linea<T>[] = []
  for (const o of ops) {
    if (o.tipo === 'sale' && movidas.has(clave(o.a))) continue
    if (o.tipo === 'entra' && movidas.has(clave(o.b))) sinMovidas.push({ tipo: 'mueve', b: o.b })
    else sinMovidas.push(o)
  }
  // Las parejas: dentro de cada racha seguida de «sale» y «entra», se emparejan de una en una, en orden.
  const salida: Linea<T>[] = []
  let k = 0
  while (k < sinMovidas.length) {
    if (sinMovidas[k].tipo !== 'sale' && sinMovidas[k].tipo !== 'entra') {
      salida.push(sinMovidas[k])
      k++
      continue
    }
    const sales: T[] = []
    const entras: T[] = []
    while (k < sinMovidas.length && (sinMovidas[k].tipo === 'sale' || sinMovidas[k].tipo === 'entra')) {
      const o = sinMovidas[k]
      if (o.tipo === 'sale') sales.push(o.a)
      else if (o.tipo === 'entra') entras.push(o.b)
      k++
    }
    const parejas = Math.min(sales.length, entras.length)
    for (let p = 0; p < parejas; p++) salida.push({ tipo: 'pareja', a: sales[p], b: entras[p] })
    for (const s of sales.slice(parejas)) salida.push({ tipo: 'sale', a: s })
    for (const e of entras.slice(parejas)) salida.push({ tipo: 'entra', b: e })
  }
  return salida
}

/** R2: las líneas de un día que cambia, por nombres (lo que no cambia, en gris; lo que sale, tachado; lo que entra, en verde; la pareja, en su recuadro). */
export function lineasDelDia(antes: string[], despues: string[]): Linea<string>[] {
  return lineasDeCambio(antes, despues, (x) => x)
}

/* ------------------------------------------------------------------ */
/* Los cambios de una propuesta                                        */
/* ------------------------------------------------------------------ */

export type TipoDeCambio = 'cambiar' | 'quitar' | 'anadir' | 'mover' | 'dia_nuevo'

export interface CambioPropuesto {
  /** Estable mientras no cambie lo que hay en el día: sirve de clave en la lista. */
  id: string
  tipo: TipoDeCambio
  dayId: string
  dayNumber: number
  dayTitle: string
  /** La parada de antes (cambiar, quitar, mover). */
  antes?: Stop
  /** La parada de ahora (cambiar, añadir, mover). */
  despues?: Stop
  /** El día nuevo (solo `dia_nuevo`). */
  dia?: DayPlan
}

const esDeRuta = (d: DayPlan) => !d.isReturnLeg
const porNumero = (a: DayPlan, b: DayPlan) => a.dayNumber - b.dayNumber

/**
 * Los cambios de la copia (`actual`) respecto de la ruta del administrador (`base`), por días y en el orden del viaje. Cuenta como UN cambio cada parada que sale, entra, se mueve o se
 * cambia por otra (la pareja «cambiar» es un solo cambio). Un día nuevo es un cambio. Los días que se quitan no se pueden proponer y no cuentan.
 */
export function cambiosDeLaPropuesta(base: Route, actual: Route): CambioPropuesto[] {
  const salida: CambioPropuesto[] = []
  for (const dia of [...actual.days].sort(porNumero)) {
    if (!esDeRuta(dia)) continue
    const original = base.days.find((d) => d.id === dia.id)
    if (!original) {
      salida.push({ id: `dia:${dia.id}`, tipo: 'dia_nuevo', dayId: dia.id, dayNumber: dia.dayNumber, dayTitle: dia.title, dia })
      continue
    }
    for (const l of lineasDeCambio(original.stops, dia.stops, (s) => s.id)) {
      const comun = { dayId: dia.id, dayNumber: dia.dayNumber, dayTitle: dia.title }
      if (l.tipo === 'pareja') salida.push({ ...comun, id: `cambiar:${dia.id}:${l.a.id}:${l.b.id}`, tipo: 'cambiar', antes: l.a, despues: l.b })
      else if (l.tipo === 'sale') salida.push({ ...comun, id: `quitar:${dia.id}:${l.a.id}`, tipo: 'quitar', antes: l.a })
      else if (l.tipo === 'entra') salida.push({ ...comun, id: `anadir:${dia.id}:${l.b.id}`, tipo: 'anadir', despues: l.b })
      else if (l.tipo === 'mueve') salida.push({ ...comun, id: `mover:${dia.id}:${l.b.id}`, tipo: 'mover', antes: original.stops.find((s) => s.id === l.b.id), despues: l.b })
    }
  }
  return salida
}

/** Cuántos días distintos tocan los cambios. */
export const diasQueCambian = (cambios: CambioPropuesto[]): string[] => [...new Set(cambios.map((c) => c.dayId))]

/** El [Deshacer] de un cambio: devuelve la copia sin ese cambio (y solo ese). */
export function deshacerCambio(actual: Route, base: Route, cambio: CambioPropuesto): Route {
  if (cambio.tipo === 'dia_nuevo') return { ...actual, days: actual.days.filter((d) => d.id !== cambio.dayId) }
  const original = base.days.find((d) => d.id === cambio.dayId)
  const days = actual.days.map((d) => {
    if (d.id !== cambio.dayId) return d
    let stops = d.stops
    if (cambio.tipo === 'anadir' && cambio.despues) stops = stops.filter((s) => s.id !== cambio.despues!.id)
    if (cambio.tipo === 'cambiar' && cambio.antes && cambio.despues) stops = stops.map((s) => (s.id === cambio.despues!.id ? cambio.antes! : s))
    if (cambio.tipo === 'quitar' && cambio.antes) {
      const i = Math.min(original?.stops.findIndex((s) => s.id === cambio.antes!.id) ?? stops.length, stops.length)
      stops = [...stops.slice(0, Math.max(i, 0)), cambio.antes, ...stops.slice(Math.max(i, 0))]
    }
    if (cambio.tipo === 'mover' && cambio.despues && original) {
      const hacia = original.stops.findIndex((s) => s.id === cambio.despues!.id)
      const orden = ordenTrasMover(stops, cambio.despues.id, hacia)
      stops = orden.map((id) => stops.find((s) => s.id === id)!)
    }
    return { ...d, stops }
  })
  return { ...actual, days }
}

/** Deshace todos los cambios: la copia vuelve a ser la ruta del administrador. */
export const sinCambios = (base: Route): Route => ({ ...base, days: base.days.map((d) => ({ ...d, stops: [...d.stops] })) })

/* ------------------------------------------------------------------ */
/* El paquete que se manda                                             */
/* ------------------------------------------------------------------ */

/** Un día sin lo pesado que no hace falta mandar (la copia de su estado de antes, que es del administrador). */
const liviano = (d: DayPlan): DayPlan => {
  const { originalSnapshot: _copia, ...resto } = d as DayPlan & { originalSnapshot?: unknown }
  return resto as DayPlan
}

/**
 * El paquete de la recomendación, según lo que haya cambiado (así lo ve el administrador en R2a, R2b y R2c):
 *   · un solo cambio de una parada → `cambio` (quitar, añadir, mover o cambiar una por otra);
 *   · cambios en un solo día → `dia` (el día entero sustituye al de ahora);
 *   · cambios en varios días, o un día nuevo → `ruta` (la ruta entera).
 * null si no hay ningún cambio.
 */
export function construirRecomendacion(base: Route, actual: Route): { tipo: TipoDeRecomendacion; payload: Record<string, unknown> } | null {
  const cambios = cambiosDeLaPropuesta(base, actual)
  if (cambios.length === 0) return null
  const dias = diasQueCambian(cambios)
  const hayDiaNuevo = cambios.some((c) => c.tipo === 'dia_nuevo')
  if (cambios.length === 1 && !hayDiaNuevo) {
    const c = cambios[0]
    const dia = actual.days.find((d) => d.id === c.dayId)!
    if (c.tipo === 'quitar') return { tipo: 'cambio', payload: { dayId: c.dayId, accion: 'quitar', stopId: c.antes!.id } }
    if (c.tipo === 'cambiar') return { tipo: 'cambio', payload: { dayId: c.dayId, accion: 'cambiar', stopId: c.antes!.id, stop: c.despues } }
    if (c.tipo === 'mover') return { tipo: 'cambio', payload: { dayId: c.dayId, accion: 'mover', stopId: c.despues!.id, haciaIndice: dia.stops.findIndex((s) => s.id === c.despues!.id) } }
    const i = dia.stops.findIndex((s) => s.id === c.despues!.id)
    return { tipo: 'cambio', payload: { dayId: c.dayId, accion: 'anadir', stop: c.despues, despuesDe: i > 0 ? dia.stops[i - 1].id : null } }
  }
  if (dias.length === 1 && !hayDiaNuevo) return { tipo: 'dia', payload: { accion: 'sustituir', dayId: dias[0], day: liviano(actual.days.find((d) => d.id === dias[0])!) } }
  return { tipo: 'ruta', payload: { days: actual.days.map(liviano) } }
}

/* ------------------------------------------------------------------ */
/* Palabras                                                            */
/* ------------------------------------------------------------------ */

/** «Día 2 · jue 17» (sin fechas, «Día 2»): la cabecera de cada día en las listas. */
export function etiquetaDeDia(route: Pick<Route, 'answers'>, dayNumber: number): string {
  const ficha = fichaDelDia(route, dayNumber)
  const iso = fechaDelDia(route, dayNumber)
  if (!ficha || !iso) return `Día ${dayNumber}`
  return `Día ${dayNumber} · ${ficha.semana.toLowerCase()} ${ficha.numero}`
}

/** «2 cambios», «1 cambio». */
export const textoDeCuantos = (n: number): string => `${n} ${n === 1 ? 'cambio' : 'cambios'}`

/** El verbo de cada cambio en la lista de RV: «cambiar», «quitar», «añadir», «mover». */
export const verboDelCambio = (t: TipoDeCambio): string => ({ cambiar: 'cambiar', quitar: 'quitar', anadir: 'añadir', mover: 'mover', dia_nuevo: 'día nuevo' })[t]

/** El texto de un cambio para la lista de RV: «Castillo de Sant’Angelo → Trastevere», «Termas de Caracalla». */
export function textoDelCambio(c: CambioPropuesto): string {
  if (c.tipo === 'cambiar') return `${c.antes?.name ?? ''} → ${c.despues?.name ?? ''}`
  if (c.tipo === 'dia_nuevo') return c.dayTitle
  return (c.antes ?? c.despues)?.name ?? ''
}

/** «Laura te recomienda un cambio», «cambios en el día 3», «otra ruta»: el texto de R2 y de la campanita según el tipo de lo recomendado. `cuando` = el día (para «cambios en el día 3»). */
export function titularDeRecomendacion(nombre: string, tipo: TipoDeRecomendacion, diaTexto: string | null): string {
  // Sin nombre puesto (cuentas parte 3B), no se inventa uno: «Te recomiendan un cambio».
  const quien = nombre.trim() ? `${nombre.trim()} te recomienda` : 'Te recomiendan'
  if (tipo === 'cambio') return `${quien} un cambio${diaTexto ? ` en ${diaTexto}` : ''}`
  if (tipo === 'dia') return `${quien} cambios${diaTexto ? ` en ${diaTexto}` : ' en un día'}`
  return `${quien} otra ruta`
}

/** El botón de enviar la propuesta: «Enviar a Elena», o «Enviar» si la otra persona aún no ha puesto su nombre. */
export const textoEnviarA = (nombre: string): string => (nombre.trim() ? `Enviar a ${nombre.trim()}` : 'Enviar')

/** «esperando a Elena», o «esperando respuesta» sin nombre. */
export const textoEsperandoA = (nombre: string): string => (nombre.trim() ? `esperando a ${nombre.trim()}` : 'esperando respuesta')

/** La pantalla de propuesta enviada: «Se lo hemos mandado a Elena», o «Se lo hemos mandado» sin nombre. */
export const textoMandadoA = (nombre: string): string => (nombre.trim() ? `Se lo hemos mandado a ${nombre.trim()}` : 'Se lo hemos mandado')

/* ------------------------------------------------------------------ */
/* Lo que ya se mandó (AV7)                                            */
/* ------------------------------------------------------------------ */

export interface CambioParaMostrar {
  etiqueta: string
  cambio: Pick<CambioPropuesto, 'tipo' | 'antes' | 'despues' | 'dayTitle'>
}

/**
 * Los cambios de una recomendación ya mandada, para la lista de quien la mandó (AV7: «Día 2 · jue 17 · cambiar → Castillo de Sant’Angelo → Trastevere»): solo lo que cambia, con la ruta
 * de ahora. Una sola lista por días, igual que en R2 pero sin lo que no cambia.
 */
export function cambiosDeUnaRecomendacion(route: Route, cambios: { dayId: string; title: string; antes: string[]; despues: string[] }[]): CambioParaMostrar[] {
  const salida: CambioParaMostrar[] = []
  for (const c of cambios) {
    const dia = route.days.find((d) => d.id === c.dayId)
    const etiqueta = dia ? etiquetaDeDia(route, dia.dayNumber) : c.title
    const p = (name: string) => ({ name }) as Stop
    for (const l of lineasDelDia(c.antes, c.despues)) {
      if (l.tipo === 'pareja') salida.push({ etiqueta, cambio: { tipo: 'cambiar', antes: p(l.a), despues: p(l.b), dayTitle: c.title } })
      else if (l.tipo === 'sale') salida.push({ etiqueta, cambio: { tipo: 'quitar', antes: p(l.a), dayTitle: c.title } })
      else if (l.tipo === 'entra') salida.push({ etiqueta, cambio: { tipo: 'anadir', despues: p(l.b), dayTitle: c.title } })
      else if (l.tipo === 'mueve') salida.push({ etiqueta, cambio: { tipo: 'mover', despues: p(l.b), dayTitle: c.title } })
    }
  }
  return salida
}
