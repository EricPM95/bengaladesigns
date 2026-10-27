import type { DayPlan, Route, Stop } from './types'
import type { DestinationPlace } from './destinationPlacesApi'
import { fichaDelDia, fechaDelDia, delDia, alDia } from './nombreDeDia'
import { ordenTrasMover, type TipoDeRecomendacion } from './aplicarRecomendacion'
import { elSitio, deSitio } from './articulos'
import { mejorHuecoEnElDia } from './mejorHueco'
import { isFreeDay } from './freeDays'

/**
 * LA PROPUESTA (cuentas parte 3, punto 3; rehecha en la Tanda 10N). Parte PURA, sin pantalla ni red, para poder probarla sola.
 *
 * Quien solo puede recomendar (el invitado «Solo recomendar») cambia la ruta DIRECTAMENTE, como si fuera suya, y cada cambio va a su propuesta: nunca al viaje del administrador.
 * La propuesta no se guarda paso a paso: SIEMPRE se calcula comparando la ruta del administrador (`base`) con la ruta de quien propone (`actual`). Por eso:
 *   · mover una parada dos veces es UN solo cambio (el de dónde queda al final), y devolverla a donde estaba lo quita;
 *   · mover una parada a otro día es UN cambio («del jueves 26 al sábado 28»), no un quitar y un añadir.
 *
 * Aquí está:
 *   · `cambiosDeLaPropuesta`: los cambios de `actual` respecto de `base`, un cambio por idea, con su texto en palabras normales;
 *   · `aplicarCambioPuro` / `ajustarPropuestaAlViaje`: poner un cambio sobre una ruta (la del administrador cuando ha cambiado: lo que ya no tiene sentido sale marcado);
 *   · `detalleDelCambio`: el antes y el ahora de un cambio, para la hoja de detalle;
 *   · `deshacerCambio`: el [Deshacer] de cada uno;
 *   · `construirPropuesta`: el paquete que se manda (todos los cambios, para que el administrador decida uno por uno) y `construirRecomendacion`, el paquete de siempre (una parada, un día o la ruta);
 *   · `lineasDelDia`, `lineasDeCambio`: la comparación de dos listas (para R2).
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

export type TipoDeCambio = 'cambiar' | 'quitar' | 'anadir' | 'mover' | 'mover_dia' | 'dia_nuevo' | 'free_tour'

export interface CambioPropuesto {
  /** Estable mientras no cambie lo que hay en el día: sirve de clave en la lista. */
  id: string
  tipo: TipoDeCambio
  /** El día donde queda el cambio (en `mover_dia`, el día de DESTINO). */
  dayId: string
  dayNumber: number
  dayTitle: string
  /** La parada de antes (cambiar, quitar, mover, mover_dia). */
  antes?: Stop
  /** La parada de ahora (cambiar, añadir, mover, mover_dia). */
  despues?: Stop
  /** El día nuevo (solo `dia_nuevo`). */
  dia?: DayPlan
  /** Añadir, mover y mover_dia: la parada que queda justo delante en el día de destino (null = la primera del día). Sirve para colocarlo «justo donde decía». */
  despuesDeId?: string | null
  /** Mover a otro día: de dónde sale. */
  desdeDayId?: string
  desdeDayNumber?: number
  /** «Día 1 · Jue 26» (o «Jue 26 → Sáb 28» al cambiar de día): la etiqueta pequeña de la fila. */
  etiqueta: string
  /** El cambio en una frase normal: «Primero el Arco de Constantino y después el Coliseo». */
  texto: string
  /** La segunda línea, si la hay: «Antes: Coliseo → Arco de Constantino». */
  sub?: string
  /** Por qué ya no tiene sentido (el administrador cambió ese día): el cambio sale marcado y se puede quitar. */
  sinSentido?: string
}

const esDeRuta = (d: DayPlan) => !d.isReturnLeg
const porNumero = (a: DayPlan, b: DayPlan) => a.dayNumber - b.dayNumber
const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s)

/** «Día 1 · Jue 26» (sin fechas, «Día 1»): la etiqueta de un día en la lista de la propuesta. */
export function etiquetaDelDia(route: Pick<Route, 'answers'>, dayNumber: number): string {
  const ficha = fichaDelDia(route, dayNumber)
  return ficha ? `Día ${dayNumber} · ${cap(ficha.semana.toLowerCase())} ${ficha.numero}` : `Día ${dayNumber}`
}

/** «Jue 26» (sin fechas, «Día 1»). */
function diaBreve(route: Pick<Route, 'answers'>, dayNumber: number): string {
  const ficha = fichaDelDia(route, dayNumber)
  return ficha ? `${cap(ficha.semana.toLowerCase())} ${ficha.numero}` : `Día ${dayNumber}`
}

interface DatosDeTexto {
  tipo: TipoDeCambio
  route: Pick<Route, 'answers'>
  dayNumber: number
  desdeDayNumber?: number
  antes?: Stop
  despues?: Stop
  /** El día de destino tal como queda y el de origen tal como estaba (para vecinos y para el intercambio). */
  finalLista?: Stop[]
  baseLista?: Stop[]
  dayTitle?: string
}

/** La frase de un cambio, sin el día delante (el día va en la etiqueta). */
export function textoDeUnCambio(d: DatosDeTexto): { texto: string; sub?: string; etiqueta: string } {
  const etiqueta = d.tipo === 'mover_dia' && d.desdeDayNumber != null ? `${diaBreve(d.route, d.desdeDayNumber)} → ${diaBreve(d.route, d.dayNumber)}` : etiquetaDelDia(d.route, d.dayNumber)
  const nombre = (s?: Stop) => s?.name ?? ''
  const lista = d.finalLista ?? []
  const base = d.baseLista ?? []
  const quien = d.despues ?? d.antes
  const i = quien ? lista.findIndex((s) => s.id === quien.id) : -1
  const previa = i > 0 ? lista[i - 1] : undefined
  const siguiente = i >= 0 ? lista[i + 1] : undefined
  if (d.tipo === 'quitar') return { etiqueta, texto: `Quitar ${elSitio(nombre(d.antes))}` }
  if (d.tipo === 'cambiar') return { etiqueta, texto: `Cambiar ${elSitio(nombre(d.antes))} por ${elSitio(nombre(d.despues))}` }
  if (d.tipo === 'dia_nuevo') return { etiqueta: 'Día nuevo', texto: `Añadir un día: ${d.dayTitle ?? ''}`.trim() }
  // (10N5) El Free Tour, un solo cambio: «Añadir el Free Tour al jueves 12» (los días que la app reorganiza por detrás no se cuentan aparte).
  if (d.tipo === 'free_tour') return { etiqueta, texto: `Añadir el Free Tour ${alDia(d.route, d.dayNumber)}` }
  if (d.tipo === 'anadir') return { etiqueta, texto: `Añadir ${elSitio(nombre(d.despues))}${previa ? `, después ${deSitio(previa.name)}` : ', al principio del día'}` }
  if (d.tipo === 'mover_dia') {
    const desde = d.desdeDayNumber != null ? delDia(d.route, d.desdeDayNumber) : 'de su día'
    return { etiqueta, texto: `${nombre(d.despues)}: ${desde} ${alDia(d.route, d.dayNumber)}${previa ? `, después ${deSitio(previa.name)}` : ', al principio del día'}` }
  }
  // mover (en el mismo día)
  const m = d.despues!
  const j = base.findIndex((s) => s.id === m.id)
  const antesDeM = j > 0 ? base[j - 1] : undefined
  const trasM = j >= 0 ? base[j + 1] : undefined
  if (siguiente && antesDeM?.id === siguiente.id) return { etiqueta, texto: `Primero ${elSitio(m.name)} y después ${elSitio(siguiente.name)}`, sub: `Antes: ${siguiente.name} → ${m.name}` }
  if (previa && trasM?.id === previa.id) return { etiqueta, texto: `Primero ${elSitio(previa.name)} y después ${elSitio(m.name)}`, sub: `Antes: ${m.name} → ${previa.name}` }
  if (siguiente) return { etiqueta, texto: `${cap(elSitio(m.name))} pasa delante ${deSitio(siguiente.name)}` }
  if (previa) return { etiqueta, texto: `${cap(elSitio(m.name))} pasa detrás ${deSitio(previa.name)}` }
  return { etiqueta, texto: `Mover ${elSitio(m.name)}` }
}

const dayOf = (route: Route) => {
  const m = new Map<string, string>()
  for (const d of route.days) for (const s of d.stops) m.set(s.id, d.id)
  return m
}

/**
 * Los cambios de `actual` (la ruta de quien propone) respecto de `base` (la del administrador), por días y en el orden del viaje, un cambio por idea:
 *   · una parada que cambia de sitio dentro del día → `mover`; que cambia de día → `mover_dia` (UNO, no un quitar y un añadir);
 *   · una parada que sale → `quitar`; que entra → `anadir`; una que sale y otra que entra en su sitio → `cambiar`;
 *   · un día nuevo → `dia_nuevo`. Los días que se quitan no se pueden proponer y no cuentan.
 */
export function cambiosDeLaPropuesta(base: Route, actual: Route): CambioPropuesto[] {
  const salida: CambioPropuesto[] = []
  const deBase = dayOf(base)
  const deActual = dayOf(actual)
  const cruzan = new Set<string>()
  for (const [id, dia] of deActual) if (deBase.has(id) && deBase.get(id) !== dia) cruzan.add(id)
  const sinCruzar = (stops: Stop[]) => stops.filter((s) => !cruzan.has(s.id))
  const baseStop = (id: string) => {
    for (const d of base.days) {
      const s = d.stops.find((x) => x.id === id)
      if (s) return s
    }
    return undefined
  }
  // (10N5) Añadir el Free Tour rehace varios días: es UN cambio y los días rehechos (otro día escrito en su sitio) no se cuentan parada a parada.
  const ft = tieneFreeTour(actual) && !tieneFreeTour(base)
  const diaFt = ft ? actual.days.find((d) => d.stops.some((s) => s.isFreeTour)) : undefined
  const rehecho = (dia: DayPlan, original: DayPlan) => ft && Boolean(original.curatedId) && original.curatedId !== dia.curatedId
  for (const dia of [...actual.days].sort(porNumero)) {
    if (!esDeRuta(dia)) continue
    const original = base.days.find((d) => d.id === dia.id)
    const comun = { dayId: dia.id, dayNumber: dia.dayNumber, dayTitle: dia.title }
    if (original && rehecho(dia, original)) {
      if (diaFt && dia.id === diaFt.id) {
        const t = textoDeUnCambio({ tipo: 'free_tour', route: actual, dayNumber: dia.dayNumber })
        salida.push({ ...comun, id: 'free_tour', tipo: 'free_tour', despues: diaFt.stops.find((s) => s.isFreeTour), ...t })
      }
      continue
    }
    if (!original) {
      const t = textoDeUnCambio({ tipo: 'dia_nuevo', route: actual, dayNumber: dia.dayNumber, dayTitle: dia.title })
      salida.push({ ...comun, id: `dia:${dia.id}`, tipo: 'dia_nuevo', dia, ...t })
      continue
    }
    const alFinal = (tipo: TipoDeCambio, antes: Stop | undefined, despues: Stop | undefined, extra: Partial<CambioPropuesto> & { id: string }) => {
      const t = textoDeUnCambio({ tipo, route: actual, dayNumber: dia.dayNumber, desdeDayNumber: extra.desdeDayNumber, antes, despues, finalLista: dia.stops, baseLista: original.stops })
      salida.push({ ...comun, tipo, antes, despues, ...t, ...extra })
    }
    const previaDe = (id: string) => {
      const i = dia.stops.findIndex((s) => s.id === id)
      return i > 0 ? dia.stops[i - 1].id : null
    }
    for (const l of lineasDeCambio(sinCruzar(original.stops), sinCruzar(dia.stops), (s) => s.id)) {
      if (l.tipo === 'pareja') alFinal('cambiar', l.a, l.b, { id: `cambiar:${dia.id}:${l.a.id}:${l.b.id}` })
      else if (l.tipo === 'sale') alFinal('quitar', l.a, undefined, { id: `quitar:${dia.id}:${l.a.id}` })
      else if (l.tipo === 'entra') alFinal('anadir', undefined, l.b, { id: `anadir:${dia.id}:${l.b.id}`, despuesDeId: previaDe(l.b.id) })
      else if (l.tipo === 'mueve') alFinal('mover', original.stops.find((s) => s.id === l.b.id), l.b, { id: `mover:${dia.id}:${l.b.id}`, despuesDeId: previaDe(l.b.id) })
    }
    // Las que llegan de otro día.
    for (const s of dia.stops) {
      if (!cruzan.has(s.id)) continue
      const desdeId = deBase.get(s.id)!
      const desde = base.days.find((d) => d.id === desdeId)
      alFinal('mover_dia', baseStop(s.id), s, { id: `mover_dia:${s.id}`, despuesDeId: previaDe(s.id), desdeDayId: desdeId, desdeDayNumber: desde?.dayNumber })
    }
  }
  return salida
}

/** ¿La ruta lleva el Free Tour? (alguna parada o la experiencia que lo pide) */
const tieneFreeTour = (r: Pick<Route, 'days' | 'answers'>): boolean => r.days.some((d) => d.stops.some((s) => s.isFreeTour)) || (r.answers.experiencesPositive ?? []).includes('free_tour')

/** Cuántos días distintos tocan los cambios. */
export const diasQueCambian = (cambios: CambioPropuesto[]): string[] => [...new Set(cambios.map((c) => c.dayId))]

/* ------------------------------------------------------------------ */
/* Poner un cambio sobre una ruta (pura)                               */
/* ------------------------------------------------------------------ */

/** Un sitio, como lo mira «dónde mejor encaja» (el horario sale de la propia parada). */
export const lugarDeLaParada = (stop: Stop): DestinationPlace =>
  ({ name: stop.name, hours_data: stop.hoursData ?? null, schedule: stop.scheduleText ?? stop.hours ?? null, coordinates: stop.coordinates }) as unknown as DestinationPlace

/**
 * Dónde entra una parada en un día (índice): justo detrás de la que decía (`despuesDeId`; null = la primera). Si esa parada ya no está en el día, donde mejor encaje: entre las paradas,
 * donde MENOS HAY QUE ANDAR DE MÁS y con el sitio abierto (`mejorHuecoEnElDia`, la misma lógica de «+ Añadir»). `dia` NO debe llevar ya la parada.
 */
export function indiceDeDestino(dia: DayPlan, stop: Stop, despuesDeId: string | null | undefined, fechaIso: string | null): number {
  if (despuesDeId === null) return 0
  if (despuesDeId) {
    const i = dia.stops.findIndex((s) => s.id === despuesDeId)
    if (i >= 0) return i + 1
  }
  if (dia.stops.length === 0 || isFreeDay(dia)) return dia.stops.length
  return mejorHuecoEnElDia(dia, stop, lugarDeLaParada(stop), fechaIso, Math.max(5, stop.durationMinutes || 60)).hueco.indice
}

const sinParada = (d: DayPlan, id: string): DayPlan => ({ ...d, stops: d.stops.filter((s) => s.id !== id) })
const conParada = (d: DayPlan, stop: Stop, indice: number): DayPlan => {
  const stops = [...d.stops]
  stops.splice(Math.max(0, Math.min(indice, stops.length)), 0, stop)
  return { ...d, stops }
}

/**
 * Pone UN cambio sobre una ruta, solo con listas (sin horas nuevas: esas las recalcula el almacén al aceptar de verdad). Devuelve la ruta y, si el cambio ya no tiene sentido
 * (la parada la quitó o la cambió el administrador, o el día ya no existe), el motivo y la ruta SIN tocar.
 */
export function aplicarCambioPuro(ruta: Route, c: CambioPropuesto): { ruta: Route; motivo: string | null } {
  const dia = (id: string | undefined) => ruta.days.find((d) => d.id === id)
  const dondeEsta = (id: string | undefined) => ruta.days.find((d) => d.stops.some((s) => s.id === id))
  const fecha = (d: DayPlan) => fechaDelDia(ruta, d.dayNumber)
  const poner = (dias: DayPlan[]): Route => ({ ...ruta, days: ruta.days.map((d) => dias.find((x) => x.id === d.id) ?? d) })
  const no = (motivo: string) => ({ ruta, motivo })
  if (c.tipo === 'free_tour') return no('El Free Tour se añade de verdad al aceptar el cambio.')
  if (c.tipo === 'dia_nuevo') {
    if (!c.dia) return no('El día no viene en el cambio.')
    if (dia(c.dia.id)) return no('Ese día ya está en el viaje.')
    const deRuta = ruta.days.filter(esDeRuta)
    const resto = ruta.days.filter((d) => !esDeRuta(d))
    return { ruta: { ...ruta, days: [...deRuta, c.dia, ...resto].map((d, i) => ({ ...d, dayNumber: i + 1 })) }, motivo: null }
  }
  if (c.tipo === 'quitar') {
    const d = dondeEsta(c.antes?.id)
    if (!d) return no('Esa parada ya no está en el viaje.')
    return { ruta: poner([sinParada(d, c.antes!.id)]), motivo: null }
  }
  if (c.tipo === 'anadir') {
    const d = dia(c.dayId)
    if (!d || !c.despues) return no('Ese día ya no está en el viaje.')
    if (d.stops.some((s) => s.id === c.despues!.id || s.name === c.despues!.name)) return no('Esa parada ya está en ese día.')
    return { ruta: poner([conParada(d, c.despues, indiceDeDestino(d, c.despues, c.despuesDeId, fecha(d)))]), motivo: null }
  }
  if (c.tipo === 'cambiar') {
    const d = dia(c.dayId) ?? dondeEsta(c.antes?.id)
    if (!d || !c.antes || !c.despues) return no('Ese día ya no está en el viaje.')
    if (!d.stops.some((s) => s.id === c.antes!.id)) return no('La parada que querías cambiar ya no está.')
    if (d.stops.some((s) => s.name === c.despues!.name)) return no('Esa parada ya está en ese día.')
    return { ruta: poner([{ ...d, stops: d.stops.map((s) => (s.id === c.antes!.id ? { ...c.despues!, time: s.time } : s)) }]), motivo: null }
  }
  if (c.tipo === 'mover') {
    const d = dia(c.dayId)
    const s = d?.stops.find((x) => x.id === c.despues?.id)
    if (!d || !s) return no('Esa parada ya no está en ese día.')
    const sin = sinParada(d, s.id)
    return { ruta: poner([conParada(sin, s, indiceDeDestino(sin, s, c.despuesDeId, fecha(sin)))]), motivo: null }
  }
  // mover_dia
  const origen = dondeEsta(c.despues?.id)
  const destino = dia(c.dayId)
  if (!origen || !c.despues) return no('Esa parada ya no está en el viaje.')
  if (!destino) return no('El día al que la querías llevar ya no está en el viaje.')
  const s = origen.stops.find((x) => x.id === c.despues!.id)!
  if (origen.id === destino.id) {
    const sin = sinParada(destino, s.id)
    return { ruta: poner([conParada(sin, s, indiceDeDestino(sin, s, c.despuesDeId, fecha(sin)))]), motivo: null }
  }
  const sinOrigen = sinParada(origen, s.id)
  return { ruta: poner([sinOrigen, conParada(destino, s, indiceDeDestino(destino, s, c.despuesDeId, fecha(destino)))]), motivo: null }
}

/**
 * El orden en que se ponen los cambios: primero los días nuevos y los cambios de una por otra; luego las paradas que se colocan (añadir, mover, mover de día), cada una DESPUÉS de aquella detrás de la que
 * iba (si esa también es un cambio, antes ella); y al final los quitar. Así cada parada cae donde iba aunque la que tenía delante también se haya movido.
 */
function ordenDeAplicar(cambios: CambioPropuesto[]): CambioPropuesto[] {
  const colocan = (c: CambioPropuesto) => c.tipo === 'anadir' || c.tipo === 'mover' || c.tipo === 'mover_dia'
  const idDeParada = (c: CambioPropuesto) => c.despues?.id
  const pendientes = cambios.filter(colocan)
  const hechos = new Set<string>()
  const colocados: CambioPropuesto[] = []
  while (pendientes.length > 0) {
    const i = pendientes.findIndex((c) => c.despuesDeId == null || !pendientes.some((o) => o !== c && idDeParada(o) === c.despuesDeId) || hechos.has(c.despuesDeId))
    const [c] = pendientes.splice(i < 0 ? 0 : i, 1)
    colocados.push(c)
    if (idDeParada(c)) hechos.add(idDeParada(c)!)
  }
  const fuera = (t: TipoDeCambio) => cambios.filter((c) => c.tipo === t)
  return [...fuera('dia_nuevo'), ...fuera('cambiar'), ...colocados, ...fuera('quitar')]
}

/**
 * LA PROPUESTA A MEDIAS CUANDO EL ADMINISTRADOR CAMBIA EL VIAJE (Tanda 10N, apartado 10). `propuesta` = los cambios que había; `ruta` = la ruta nueva del administrador.
 * Devuelve la ruta de quien propone (la nueva con sus cambios puestos), los cambios vueltos a calcular sobre ella y los que YA NO TIENEN SENTIDO (mover una parada que el administrador
 * quitó, añadir en un día que ya no existe…): salen marcados con su motivo y se pueden quitar. Nada se pierde en silencio. Pura.
 */
export function ajustarPropuestaAlViaje(propuesta: { cambios: CambioPropuesto[] }, ruta: Route): { ruta: Route; cambios: CambioPropuesto[]; sinSentido: CambioPropuesto[] } {
  let actual = ruta
  const sinSentido: CambioPropuesto[] = []
  const ordenados = ordenDeAplicar(propuesta.cambios.filter((c) => !c.sinSentido))
  for (const c of ordenados) {
    const r = aplicarCambioPuro(actual, c)
    if (r.motivo) sinSentido.push({ ...c, sinSentido: r.motivo })
    else actual = r.ruta
  }
  return { ruta: actual, cambios: cambiosDeLaPropuesta(ruta, actual), sinSentido }
}

/* ------------------------------------------------------------------ */
/* El detalle de un cambio (antes y ahora)                              */
/* ------------------------------------------------------------------ */

export type MarcaDeParada = 'movida' | 'sale' | 'entra' | 'nueva' | null
export interface ParadaDelDetalle {
  id: string
  nombre: string
  marca: MarcaDeParada
  coordinates: Stop['coordinates']
}
export interface DiaDelDetalle {
  etiqueta: string
  antes: ParadaDelDetalle[]
  ahora: ParadaDelDetalle[]
}

const aDetalle = (stops: Stop[], marcas: Record<string, MarcaDeParada>): ParadaDelDetalle[] => stops.map((s) => ({ id: s.id, nombre: s.name, marca: marcas[s.id] ?? null, coordinates: s.coordinates }))

/**
 * El detalle de UN cambio, como en Design: los dos días (si cambia de día) con su «Antes» y su «Ahora» y lo que cambia marcado («Movida», «Sale», «Entra», «Nueva»). El «ahora» es la ruta
 * de `sobre` con SOLO ese cambio puesto (cada detalle enseña su cambio, no los demás).
 */
export function detalleDelCambio(sobre: Route, c: CambioPropuesto): DiaDelDetalle[] {
  const aplicado = aplicarCambioPuro(sobre, c).ruta
  const antes = (id: string | undefined) => sobre.days.find((d) => d.id === id)
  const ahora = (id: string | undefined) => aplicado.days.find((d) => d.id === id)
  const dia = (dayId: string, marcaAntes: Record<string, MarcaDeParada>, marcaAhora: Record<string, MarcaDeParada>, sale: Stop[] = []): DiaDelDetalle => {
    const a = antes(dayId)
    const b = ahora(dayId)
    const etiqueta = a || b ? etiquetaDelDia(sobre, (a ?? b)!.dayNumber) : ''
    let listaAhora = b ? b.stops : []
    // Lo que sale se sigue viendo en su sitio, tachado.
    for (const s of sale) {
      const i = a ? a.stops.findIndex((x) => x.id === s.id) : -1
      listaAhora = [...listaAhora]
      listaAhora.splice(i < 0 ? listaAhora.length : Math.min(i, listaAhora.length), 0, s)
    }
    return { etiqueta, antes: aDetalle(a?.stops ?? [], marcaAntes), ahora: aDetalle(listaAhora, marcaAhora) }
  }
  if (c.tipo === 'quitar' && c.antes) return [dia(c.dayId, {}, { [c.antes.id]: 'sale' }, [c.antes])]
  if (c.tipo === 'anadir' && c.despues) return [dia(c.dayId, {}, { [c.despues.id]: 'nueva' })]
  if (c.tipo === 'cambiar' && c.antes && c.despues) return [dia(c.dayId, { [c.antes.id]: 'sale' }, { [c.despues.id]: 'nueva' })]
  if (c.tipo === 'mover' && c.despues) return [dia(c.dayId, {}, { [c.despues.id]: 'movida' })]
  if (c.tipo === 'mover_dia' && c.despues) {
    const origenId = sobre.days.find((d) => d.stops.some((s) => s.id === c.despues!.id))?.id ?? c.desdeDayId ?? c.dayId
    const s = sobre.days.find((d) => d.id === origenId)?.stops.find((x) => x.id === c.despues!.id) ?? c.despues
    return [dia(origenId, {}, { [c.despues.id]: 'sale' }, [s]), dia(c.dayId, {}, { [c.despues.id]: 'entra' })]
  }
  if (c.tipo === 'free_tour') {
    const a = antes(c.dayId)
    return [{ etiqueta: a ? etiquetaDelDia(sobre, a.dayNumber) : c.etiqueta, antes: aDetalle(a?.stops ?? [], {}), ahora: c.despues ? aDetalle([c.despues], { [c.despues.id]: 'nueva' }) : [] }]
  }
  if (c.tipo === 'dia_nuevo' && c.dia) return [{ etiqueta: 'Día nuevo', antes: [], ahora: aDetalle(c.dia.stops, Object.fromEntries(c.dia.stops.map((s) => [s.id, 'nueva' as const]))) }]
  return []
}

/** Los kilómetros en línea recta de un recorrido (lo que enseña el mapa pequeño del detalle). 0 si faltan coordenadas. */
export function kilometrosDelRecorrido(paradas: Pick<ParadaDelDetalle, 'coordinates' | 'marca'>[]): number {
  const R = 6371
  const rad = Math.PI / 180
  const vivas = paradas.filter((p) => p.marca !== 'sale' && p.coordinates && (p.coordinates.lat !== 0 || p.coordinates.lng !== 0))
  let km = 0
  for (let i = 1; i < vivas.length; i++) {
    const a = vivas[i - 1].coordinates
    const b = vivas[i].coordinates
    const dLat = (b.lat - a.lat) * rad
    const dLng = (b.lng - a.lng) * rad
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2
    km += 2 * R * Math.asin(Math.sqrt(h))
  }
  return km
}

/** «3,1 km». */
export const textoDeKm = (km: number): string => `${km.toFixed(1).replace('.', ',')} km`

/* ------------------------------------------------------------------ */
/* Deshacer                                                            */
/* ------------------------------------------------------------------ */

/** El [Deshacer] de un cambio: devuelve la copia sin ese cambio (y solo ese). */
export function deshacerCambio(actual: Route, base: Route, cambio: CambioPropuesto): Route {
  // (10N5) Quitar el Free Tour de la propuesta: los días que rehízo vuelven a como estaban y la ruta deja de pedirlo.
  if (cambio.tipo === 'free_tour') {
    const days = actual.days.map((d) => {
      const o = base.days.find((x) => x.id === d.id)
      return o && o.curatedId && o.curatedId !== d.curatedId ? o : d
    })
    return { ...actual, days, answers: { ...actual.answers, experiencesPositive: base.answers.experiencesPositive, freeTourDespues: base.answers.freeTourDespues } }
  }
  if (cambio.tipo === 'dia_nuevo') return { ...actual, days: actual.days.filter((d) => d.id !== cambio.dayId) }
  const original = base.days.find((d) => d.id === cambio.dayId)
  if (cambio.tipo === 'mover_dia' && cambio.despues) {
    const id = cambio.despues.id
    const origenId = cambio.desdeDayId ?? ''
    const base0 = base.days.find((d) => d.id === origenId)
    const stop = actual.days.flatMap((d) => d.stops).find((s) => s.id === id)
    if (!stop || !base0) return actual
    const i = base0.stops.findIndex((s) => s.id === id)
    const detrasDe = i > 0 ? base0.stops[i - 1].id : null
    const days = actual.days.map((d) => {
      if (d.id === origenId) {
        const sin = sinParada(d, id)
        const k = detrasDe === null ? 0 : sin.stops.findIndex((s) => s.id === detrasDe) + 1
        return conParada(sin, stop, k > 0 || detrasDe === null ? k : sin.stops.length)
      }
      return d.stops.some((s) => s.id === id) ? sinParada(d, id) : d
    })
    return { ...actual, days }
  }
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

/** Un cambio sin lo pesado (la copia de antes de los días). */
const cambioLiviano = (c: CambioPropuesto): CambioPropuesto => (c.dia ? { ...c, dia: liviano(c.dia) } : c)

/**
 * LA PROPUESTA QUE SE MANDA (Tanda 10N): UNA sola recomendación con TODOS los cambios dentro, para que el administrador decida uno por uno («Ana te propone 5 cambios»). Lleva también la
 * ruta entera de quien propone (`days`), por si quien la recibe es una versión de la app que aún no entiende los cambios sueltos: para ella es «otra ruta», como siempre.
 * null si no hay ningún cambio con sentido.
 */
export function construirPropuesta(base: Route, actual: Route, cambios: CambioPropuesto[] = cambiosDeLaPropuesta(base, actual)): { tipo: TipoDeRecomendacion; payload: Record<string, unknown> } | null {
  if (cambios.length === 0) return null
  return { tipo: 'ruta', payload: { version: 2, cambios: cambios.map(cambioLiviano), days: actual.days.map(liviano) } }
}

/** ¿Esta recomendación es una propuesta de la Tanda 10N (con cambios sueltos)? */
export const esUnaPropuesta = (payload: Record<string, unknown> | null | undefined): boolean => Boolean(payload) && payload!.version === 2 && Array.isArray(payload!.cambios)

/** Los cambios que lleva una propuesta mandada. */
export const cambiosDeUnaPropuesta = (payload: Record<string, unknown> | null | undefined): CambioPropuesto[] => (esUnaPropuesta(payload) ? (payload!.cambios as CambioPropuesto[]) : [])

/**
 * El paquete de siempre (cuentas parte 3), según lo que haya cambiado:
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
  const hayCruce = cambios.some((c) => c.tipo === 'mover_dia')
  if (cambios.length === 1 && !hayDiaNuevo && !hayCruce) {
    const c = cambios[0]
    const dia = actual.days.find((d) => d.id === c.dayId)!
    if (c.tipo === 'quitar') return { tipo: 'cambio', payload: { dayId: c.dayId, accion: 'quitar', stopId: c.antes!.id } }
    if (c.tipo === 'cambiar') return { tipo: 'cambio', payload: { dayId: c.dayId, accion: 'cambiar', stopId: c.antes!.id, stop: c.despues } }
    if (c.tipo === 'mover') return { tipo: 'cambio', payload: { dayId: c.dayId, accion: 'mover', stopId: c.despues!.id, haciaIndice: dia.stops.findIndex((s) => s.id === c.despues!.id) } }
    const i = dia.stops.findIndex((s) => s.id === c.despues!.id)
    return { tipo: 'cambio', payload: { dayId: c.dayId, accion: 'anadir', stop: c.despues, despuesDe: i > 0 ? dia.stops[i - 1].id : null } }
  }
  if (dias.length === 1 && !hayDiaNuevo && !hayCruce) return { tipo: 'dia', payload: { accion: 'sustituir', dayId: dias[0], day: liviano(actual.days.find((d) => d.id === dias[0])!) } }
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

/**
 * El aviso corto de abajo, dicho con verdad cuando el cambio es de una propuesta: «Añadido el jueves 26» → «Añadido a tu propuesta · jueves 26»; «Movida al sábado 28» → «Movida en tu propuesta · sábado 28»;
 * «Quitada…» → «Quitada de tu propuesta»; «Cambiada por X» → «Cambiada en tu propuesta». Lo demás se queda como está.
 */
export function mensajeDePropuesta(mensaje: string): string {
  const a = /^Añadid[oa]\s+(?:al|a la|el|la)\s+(.*?)\s*(?:✓)?$/.exec(mensaje)
  if (a) return `Añadido a tu propuesta · ${a[1]}`
  const m = /^Movid[oa]\s+(?:al|a la|el|la)\s+(.*)$/.exec(mensaje)
  if (m) return `Movida en tu propuesta · ${m[1]}`
  if (/^Movid[oa]$/.test(mensaje)) return 'Movida en tu propuesta'
  if (/^(Quitad[oa]|Parada quitada|Eliminad[oa])/.test(mensaje)) return 'Quitada de tu propuesta'
  if (/^Cambiad[oa]/.test(mensaje)) return 'Cambiada en tu propuesta'
  return mensaje
}

/** «2 cambios», «1 cambio». */
export const textoDeCuantos = (n: number): string => `${n} ${n === 1 ? 'cambio' : 'cambios'}`

/** El verbo de cada cambio en la lista de RV: «cambiar», «quitar», «añadir», «mover». */
export const verboDelCambio = (t: TipoDeCambio): string => ({ cambiar: 'cambiar', quitar: 'quitar', anadir: 'añadir', mover: 'mover', mover_dia: 'mover', dia_nuevo: 'día nuevo', free_tour: 'añadir' })[t]

/** El texto de un cambio para la lista de RV: «Castillo de Sant’Angelo → Trastevere», «Termas de Caracalla». */
export function textoDelCambio(c: Pick<CambioPropuesto, 'tipo' | 'antes' | 'despues' | 'dayTitle'>): string {
  if (c.tipo === 'cambiar') return `${c.antes?.name ?? ''} → ${c.despues?.name ?? ''}`
  if (c.tipo === 'dia_nuevo') return c.dayTitle
  return (c.antes ?? c.despues)?.name ?? ''
}

/** «Ana te propone 5 cambios en tu viaje a Roma» (sin nombre: «Te proponen 5 cambios…»). */
export function titularDeLaPropuesta(nombre: string, n: number, destino: string): string {
  const quien = nombre.trim() ? `${nombre.trim()} te propone` : 'Te proponen'
  return `${quien} ${textoDeCuantos(n)} en tu viaje${destino ? ` a ${destino}` : ''}`
}

/** «Ana te recomienda un cambio», «cambios en el día 3», «otra ruta»: el texto de R2 y de la campanita según el tipo de lo recomendado. `cuando` = el día (para «cambios en el día 3»). */
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

/** «3 aceptados · 2 rechazados» (la propuesta ya decidida, en la campana del administrador). */
export function textoDeDecididos(aceptados: number, rechazados: number): string {
  const a = `${aceptados} ${aceptados === 1 ? 'aceptado' : 'aceptados'}`
  const r = `${rechazados} ${rechazados === 1 ? 'rechazado' : 'rechazados'}`
  return `${a} · ${r}`
}

/** «Eric ha aceptado 3 de tus 5 cambios» (a quien propuso). */
export function textoDeLoAceptado(admin: string, aceptados: number, total: number): string {
  const quien = admin.trim() ? `${admin.trim()} ha aceptado` : 'Han aceptado'
  if (aceptados === 0) return `${admin.trim() ? `${admin.trim()} no ha aceptado` : 'No han aceptado'} ${total === 1 ? 'tu cambio' : `ninguno de tus ${total} cambios`}`
  if (aceptados === total) return `${quien} ${total === 1 ? 'tu cambio' : `tus ${total} cambios`}`
  return `${quien} ${aceptados} de tus ${total} cambios`
}

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
