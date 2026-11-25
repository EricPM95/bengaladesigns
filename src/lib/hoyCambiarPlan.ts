import { seasonFit } from '../../shared/routeEngine/availability.js'
import { hasRealCoordinates, haversineMeters } from './distanceMock'
import { horarioDeParada } from './horarioDeParada'
import { displayStopName } from './format'
import { puntualidadDe } from './puntualidadEntradas'
import { posicionDeMenosRodeo, primerHuecoLibre, pesoDe, type DatosDeImportancia } from './masVisitas'
import { numberedStopsOf } from './stopKind'
import type { ChosenRestaurant, Coordinates, DayPlan, Route, Stop } from './types'

/**
 * HOY2 (tanda del 5-nov, agente B): EL MOTOR DE PROPUESTAS DE [CAMBIAR PLAN]. Todo puro (sin React ni almacén): lo que entra son el viaje y el día, lo que sale son PROPUESTAS con su vista previa
 * («Cambia… / Se mantiene…») y las operaciones que las aplican y las deshacen. La app no mueve nada sola: aplicar una propuesta es siempre un toque del viajero y se deshace.
 *
 * Reglas (Eric, 5-nov):
 *  · Reservas y turnos (lo FIJO), nunca se tocan.
 *  · Prioridad para absorber un retraso: primero lo opcional (opcionales de Lanzarote y «Si te sobra tiempo»), luego lo flexible (nivel 3), luego lo principal (resto de nivel 2). Lo imprescindible
 *    (imprescindibles, joyas, el atardecer del día), SOLO preguntando: es la última propuesta y solo sale si no hay otra.
 *  · Siempre el cambio MÁS PEQUEÑO: la mínima cantidad de paradas y de la clase más baja posible.
 *  · Al viajero, sin minutos: «Vas con algo de retraso. Buscamos el ajuste más pequeño…».
 */

export type Clase = 'fija' | 'opcional' | 'flexible' | 'principal' | 'imprescindible'
/** El orden en que se quita lo que no es fijo ni imprescindible. */
export const ORDEN_DE_QUITAR: Clase[] = ['opcional', 'flexible', 'principal']

export const FIN_MIN = 23 * 60
const VEL_COCHE_M_MIN = (40 * 1000) / 60
const RODEO = 1.35
const VEL_PIE_M_MIN = 80

export const minDe = (hhmm: string | null | undefined): number | null => {
  const m = /^(\d{1,2}):(\d{2})/.exec(hhmm ?? '')
  return m ? Number(m[1]) * 60 + Number(m[2]) : null
}
export const aHora = (min: number, ancho: boolean): string => {
  const m = ((Math.round(min) % 1440) + 1440) % 1440
  const h = Math.floor(m / 60)
  return `${ancho ? String(h).padStart(2, '0') : h}:${String(m % 60).padStart(2, '0')}`
}
export const sube10 = (min: number) => Math.ceil(min / 10) * 10
export const ancho = (s: { time: string }) => /^\d{2}:/.test(s.time)
export const horaLegible = (min: number): string => aHora(min, false)

/* ------------------------------------------------------------------ */
/* Operaciones: lo que cambia una propuesta, reversible                 */
/* ------------------------------------------------------------------ */

type MealAfter = DayPlan['mealAfter']

export type Op =
  | { t: 'campo'; dia: string; id: string; antes: { time: string; saltada: boolean }; despues: { time: string; saltada: boolean } }
  | { t: 'comida'; dia: string; id: string; antes: string; despues: string }
  | { t: 'sacar'; dia: string; stop: Stop; indice: number; mealAntes: MealAfter; mealDespues: MealAfter }
  | { t: 'meter'; dia: string; stop: Stop; indice: number; mealAntes: MealAfter; mealDespues: MealAfter }
  | { t: 'sobra_meter'; dia: string; stop: Stop }
  | { t: 'sobra_sacar'; dia: string; stop: Stop }
  /* HOY2 (agente C): la comida que pasa a ahora en otro sitio, y el cambio de las paradas de un día entero (el plan de lluvia y volver al plan). */
  | { t: 'comida_sitio'; dia: string; id: string; antes: { time: string; sitio: ChosenRestaurant | null; mealAfter: MealAfter }; despues: { time: string; sitio: ChosenRestaurant | null; mealAfter: MealAfter } }
  | { t: 'paradas'; dia: string; antes: { stops: Stop[]; rainBackup: DayPlan['rainBackup'] }; despues: { stops: Stop[]; rainBackup: DayPlan['rainBackup'] } }

const mealTrasSacar = (m: MealAfter, i: number): MealAfter => (m ? { ...(m.lunch !== undefined ? { lunch: m.lunch >= i ? m.lunch - 1 : m.lunch } : {}), ...(m.dinner !== undefined ? { dinner: m.dinner >= i ? m.dinner - 1 : m.dinner } : {}) } : m)
const mealTrasMeter = (m: MealAfter, i: number): MealAfter => (m ? { ...(m.lunch !== undefined ? { lunch: m.lunch >= i ? m.lunch + 1 : m.lunch } : {}), ...(m.dinner !== undefined ? { dinner: m.dinner >= i ? m.dinner + 1 : m.dinner } : {}) } : m)

/** Aplica UNA operación a un día (`adelante`: aplicar; `atras`: deshacer). */
export function aplicarOpADia(day: DayPlan, op: Op, dir: 'adelante' | 'atras'): DayPlan {
  const fwd = dir === 'adelante'
  switch (op.t) {
    case 'campo': {
      const v = fwd ? op.despues : op.antes
      return { ...day, stops: day.stops.map((s) => (s.id === op.id ? { ...s, time: v.time, saltada: v.saltada } : s)) }
    }
    case 'comida':
      return { ...day, meals: day.meals.map((m) => (m.id === op.id ? { ...m, time: fwd ? op.despues : op.antes } : m)) }
    case 'sacar':
    case 'meter': {
      const quitar = (op.t === 'sacar') === fwd
      const meal = fwd ? op.mealDespues : op.mealAntes
      const base = quitar ? day.stops.filter((s) => s.id !== op.stop.id) : day.stops.some((s) => s.id === op.stop.id) ? day.stops : [...day.stops.slice(0, Math.min(Math.max(op.indice, 0), day.stops.length)), op.stop, ...day.stops.slice(Math.min(Math.max(op.indice, 0), day.stops.length))]
      return { ...day, stops: base, ...(meal !== undefined || day.mealAfter !== undefined ? { mealAfter: meal } : {}) }
    }
    case 'comida_sitio': {
      const v = fwd ? op.despues : op.antes
      return { ...day, meals: day.meals.map((m) => (m.id === op.id ? { ...m, time: v.time, chosenRestaurant: v.sitio, ...(v.sitio ? { coordinates: v.sitio.coordinates } : {}) } : m)), mealAfter: v.mealAfter }
    }
    case 'paradas': {
      // Al aplicar o deshacer no se pierde lo que el viajero haya hecho después: lo visto y lo saltado se conserva.
      const v = fwd ? op.despues : op.antes
      const actuales = new Map(day.stops.map((s) => [s.id, s]))
      const stops = v.stops.map((s) => {
        const ahora = actuales.get(s.id)
        return ahora ? { ...s, checkedInAt: ahora.checkedInAt ?? s.checkedInAt, saltada: ahora.saltada ?? s.saltada } : s
      })
      for (const s of day.stops) if (s.checkedInAt && !stops.some((o) => o.id === s.id)) stops.push(s)
      stops.sort((a, b) => (minDe(a.time) != null && minDe(b.time) != null ? (minDe(a.time) as number) - (minDe(b.time) as number) : 0))
      return { ...day, stops, rainBackup: v.rainBackup ?? null }
    }
    case 'sobra_meter':
    case 'sobra_sacar': {
      const meter = (op.t === 'sobra_meter') === fwd
      const sobra = day.spareStops ?? []
      return { ...day, spareStops: meter ? (sobra.some((s) => s.id === op.stop.id) ? sobra : [...sobra, op.stop]) : sobra.filter((s) => s.id !== op.stop.id) }
    }
  }
}

/** Aplica una lista de operaciones al viaje (`atras` las deshace en el orden contrario). Pura. */
export function aplicarOps(route: Route, ops: Op[], dir: 'adelante' | 'atras'): Route {
  const lista = dir === 'adelante' ? ops : [...ops].reverse()
  let days = route.days
  for (const op of lista) days = days.map((d) => (d.id === op.dia ? aplicarOpADia(d, op, dir) : d))
  return { ...route, days }
}

/* ------------------------------------------------------------------ */
/* Qué es cada parada                                                   */
/* ------------------------------------------------------------------ */

export interface Contexto {
  /** Los ids de lo que no se mueve nunca (reservas, turnos) de ese día. */
  fijasDe: (day: DayPlan) => Set<string>
  datos: DatosDeImportancia
  enCoche: boolean
  /** «jueves», «día 3»: cómo se llama ese día en las frases («al jueves»). */
  etiquetaDia: (day: DayPlan) => string
  /** La hora fija de una parada, en minutos (su turno o reserva). Sin ella, la hora del propio dato. */
  horaFijaMin?: (stop: Stop) => number | null
  /** (V43) La fecha ISO de un día del viaje (sin fechas, null). */
  fechaDe?: (day: DayPlan) => string | null
  /** (V43) El horario de un sitio ese día (los datos reales del destino): sin horario en los datos, null. */
  horarioEn?: (stop: Stop, fechaIso: string | null) => { cerrado: boolean; abre: number | null; cierra: number | null } | null
}

export function claseDe(stop: Stop, fijas: Set<string>, datos: DatosDeImportancia): Clase {
  if (fijas.has(stop.id) || stop.reservedId || stop.reservationTime || stop.isFreeTour) return 'fija'
  if (stop.isSunset) return 'imprescindible'
  if (stop.optional || stop.isZoneWalk || stop.isFreeWalk || stop.isFreeTime) return 'opcional'
  if (stop.tags?.some((x) => /joya/i.test(x))) return 'imprescindible'
  const peso = pesoDe(stop.name, datos)
  if (peso <= 1) return 'imprescindible'
  return peso === 3 ? 'flexible' : 'principal'
}

const NO_ES_VISITA = (s: Stop) => Boolean(s.isBreak || s.isZoneWalk || s.isFreeWalk || s.isFreeTime || s.passThrough || s.isArrival)

export function diaAdmite(day: DayPlan | undefined): boolean {
  return Boolean(day && !day.isReturnLeg && !day.isExcursionDay && day.interruptor?.mode !== 'excursion' && day.dayType !== 'excursion')
}

export const unir = (lista: string[]): string => (lista.length <= 1 ? (lista[0] ?? '') : `${lista.slice(0, -1).join(', ')} y ${lista[lista.length - 1]}`)
export const nombre = (s: Stop) => displayStopName(s.name)

/** Minutos de ir de un sitio a otro (con 5 mínimo; en coche, con la curva de la carretera y +5 de aparcar). */
export function viajeMin(a: { coordinates: Coordinates } | null | undefined, b: { coordinates: Coordinates }, enCoche: boolean): number {
  if (!a || !hasRealCoordinates(a.coordinates) || !hasRealCoordinates(b.coordinates)) return enCoche ? 15 : 10
  const m = haversineMeters(a.coordinates, b.coordinates)
  return enCoche ? Math.max(5, Math.round((m * RODEO) / VEL_COCHE_M_MIN) + 5) : Math.max(5, Math.round(m / VEL_PIE_M_MIN))
}

/* ------------------------------------------------------------------ */
/* El reloj del día: ¿cabe todo si empiezo a esta hora?                 */
/* ------------------------------------------------------------------ */

export interface Item {
  stop: Stop
  t: number | null
  dur: number
  fija: boolean
  clase: Clase
}

export const itemsDe = (paradas: Stop[], fijas: Set<string>, datos: DatosDeImportancia): Item[] =>
  paradas.map((stop) => ({ stop, t: minDe(stop.time), dur: stop.durationMinutes || 0, fija: claseDe(stop, fijas, datos) === 'fija', clase: claseDe(stop, fijas, datos) }))

export interface Simulacion {
  ok: boolean
  /** id → su hora nueva (solo las que cambian respecto a la hora de antes del retraso). */
  nuevas: Map<string, number>
  /** id → cuánto se corre (min). */
  corrimiento: Map<string, number>
}

/** Recorre lo que queda: `cur0` es la hora a la que queda libre el viajero, `desde` la parada de la que sale. Lo fijo no se mueve; si se llega tarde a lo fijo (y sin el retraso se llegaba), o se pasa de las 23:00, no cabe. */
function simular(items: Item[], cur0: number, desde: Stop | null, quitados: Set<string>, enCoche: boolean, base: Simulacion | null): Simulacion {
  let cur = cur0
  let prev: Stop | null = desde
  let ok = true
  const nuevas = new Map<string, number>()
  const corrimiento = new Map<string, number>()
  for (const it of items) {
    if (quitados.has(it.stop.id) || it.t == null) continue
    const llega = cur + (prev ? viajeMin(prev, it.stop, enCoche) : 0)
    if (it.fija) {
      if (llega > it.t && !(base && base.corrimiento.has('!' + it.stop.id))) ok = false
      cur = Math.max(it.t, llega) + it.dur
    } else {
      const inicio = Math.max(it.t, llega)
      const inicioBase = base ? (base.nuevas.get(it.stop.id) ?? it.t) : it.t
      if (inicio > inicioBase) {
        nuevas.set(it.stop.id, inicio)
        corrimiento.set(it.stop.id, inicio - inicioBase)
      }
      cur = inicio + it.dur
      if (cur > FIN_MIN && !(base && inicioBase + it.dur > FIN_MIN)) ok = false
    }
    prev = it.stop
  }
  return { ok, nuevas, corrimiento }
}

/** La simulación de lo que iba a pasar SIN el cambio (para no cargarle lo que el día ya traía justo). Marca con `!id` lo fijo al que ya no se llegaba. */
export function simularBase(items: Item[], cur0: number, desde: Stop | null, enCoche: boolean): Simulacion {
  let cur = cur0
  let prev: Stop | null = desde
  const nuevas = new Map<string, number>()
  const corrimiento = new Map<string, number>()
  for (const it of items) {
    if (it.t == null) continue
    const llega = cur + (prev ? viajeMin(prev, it.stop, enCoche) : 0)
    if (it.fija) {
      if (llega > it.t) corrimiento.set('!' + it.stop.id, llega - it.t)
      cur = Math.max(it.t, llega) + it.dur
    } else {
      const inicio = Math.max(it.t, llega)
      nuevas.set(it.stop.id, inicio)
      cur = inicio + it.dur
    }
    prev = it.stop
  }
  return { ok: true, nuevas, corrimiento }
}

/** ¿Cabe (con lo quitado)? */
export function cabe(items: Item[], cur0: number, desde: Stop | null, quitados: Set<string>, enCoche: boolean, base: Simulacion): { ok: boolean; sim: Simulacion } {
  const sim = simular(items, cur0, desde, quitados, enCoche, base)
  return { ok: sim.ok, sim }
}

/** El conjunto MÍNIMO de paradas a quitar para que quepa, de la clase más baja posible (primero lo opcional, luego lo flexible, luego lo principal). `hasta`: la clase más alta permitida. `orden`: de las que quedan, las de más tarde o las de más pronto primero. */
export function minimoAQuitar(items: Item[], cur0: number, desde: Stop | null, enCoche: boolean, base: Simulacion, hasta: number, orden: 'tarde' | 'pronto', clases: Clase[] = ORDEN_DE_QUITAR): Set<string> | null {
  const quitados = new Set<string>()
  if (cabe(items, cur0, desde, quitados, enCoche, base).ok) return quitados
  for (let r = 0; r <= Math.min(hasta, clases.length - 1); r++) {
    const cand = items.filter((it) => it.clase === clases[r] && !it.fija)
    if (orden === 'tarde') cand.reverse()
    for (const c of cand) {
      quitados.add(c.stop.id)
      if (cabe(items, cur0, desde, quitados, enCoche, base).ok) break
    }
    if (cabe(items, cur0, desde, quitados, enCoche, base).ok) break
  }
  if (!cabe(items, cur0, desde, quitados, enCoche, base).ok) return null
  // Poda: nunca se quita de más (lo que no hace falta vuelve, empezando por lo más importante).
  const rango = (id: string) => clases.indexOf(items.find((it) => it.stop.id === id)!.clase)
  for (const id of [...quitados].sort((x, y) => rango(y) - rango(x))) {
    quitados.delete(id)
    if (!cabe(items, cur0, desde, quitados, enCoche, base).ok) quitados.add(id)
  }
  return quitados
}

/* ------------------------------------------------------------------ */
/* La propuesta                                                         */
/* ------------------------------------------------------------------ */

export interface Propuesta {
  id: string
  tipo: 'retraso' | 'otro_dia' | 'anadir' | 'comer' | 'peligro' | 'lluvia' | 'vuelta_lluvia' | 'cansados'
  /** La frase de arriba («Vas con algo de retraso. Buscamos…»). */
  intro: string
  /** «Cambia: …» */
  cambia: { titulo: string; detalle: string }
  /** «Se mantiene: …» */
  mantiene: { titulo: string; detalle: string }
  ops: Op[]
  /** Toca algo imprescindible: solo se ofrece preguntando (el botón dice «Sí, hazlo»). */
  pregunta?: boolean
  /** Pasar a otro día / añadir: cabe sin tocar nada (a), cabe quitando algo (b) o no cabe (c, «Si te sobra tiempo»). */
  caso?: 'a' | 'b' | 'c'
  /** (V43 §6) El aviso que sale al aplicarla, con [Deshacer]: qué ha pasado. */
  avisoTexto?: string
  /** (V43 §1) Lo que dice el botón dorado («Pasarlo al viernes 27»); sin él, uno según el tipo. */
  boton?: string
  /** (V43 §2) Lo que dice [Ver otra opción] en esta propuesta («Mejor pasarlo al viernes 27»). */
  etiquetaOtra?: string
  /** (V43 §1) Las líneas del bloque de resumen (icono + texto): solo las que vienen al caso. Sin ellas, salen de «cambia» y «mantiene». */
  resumen?: { icono: 'mover' | 'quitar' | 'ok' | 'reloj' | 'mas'; texto: string; /** Una frase pequeña debajo (lo que antes era el «detalle»). */ sub?: string }[]
  /** (V50; Design «Aviso Cierre» A2/A4) «Pasar a otro día»: la tarjeta del sitio (foto pequeña, nombre, cuándo en gris y la fecha en su cuadrado oscuro) y el día de hoy para la franja verde «Sigue igual: el resto de tu martes». */
  tarjetaDia?: { nombre: string; fotoUrl: string; cuando: string; semanaCorta: string; numero: string; destino: string; diaDeHoy: string; /** (V53 §6) El sitio va a «Lugares pendientes», no a un día: a la derecha, el cuadrado del pin con reloj en vez de la fecha. */ aPendientes?: boolean; /** (V55) El sitio se quita del viaje: a la derecha, el cuadrado azul con la papelera. */ quitar?: boolean; /** (V55) La parada, para pedir su foto real si no la trae (la misma de su parada), y la ciudad de su día. */ parada?: Stop; ciudad?: string }
  /** (V54 §3) VARIOS sitios que cambian (una tarjeta por sitio) y la frase de la franja verde («Llegas a tu entrada de las 9:15»). */
  tarjetasDia?: NonNullable<Propuesta['tarjetaDia']>[]
  franja?: string
  /** (V43 §2) Entradas o reservas de hoy cuya hora YA pasó: no se protegen (las ve la hoja para decirlo). */
  entradasPasadas?: { nombre: string; hora: string; freeTour?: boolean }[]
  /** Para la prueba y la nota interna (nunca se enseñan): lo que se quita (con su clase), lo que se corre y a dónde va cada cosa. */
  quitadas: { id: string; nombre: string; clase: Clase; destino: 'sobra' | 'manana' | 'manana_sobra' | 'otro'; /** (V43) Si pasa a otro día: ese día («viernes 27»). */ aDia?: string }[]
  corridas: number
  /** Los ids de las paradas fijas que la propuesta NO toca (todas las del día). */
  intactas: string[]
}

export const mantieneDe = (fijasOrden: Item[], ctx: Contexto, sufijo = '', ahoraMin: number = new Date().getHours() * 60 + new Date().getMinutes()): Propuesta['mantiene'] => {
  // (V59) Una entrada o reserva cuya hora YA pasó nunca sale como «Sigue igual» en ninguna hoja de HOY: solo cuentan las que aún están por venir.
  const f = fijasOrden.find((it) => it.fija && (ctx.horaFijaMin?.(it.stop) ?? it.t ?? 24 * 60) >= ahoraMin)
  if (f) {
    const h = ctx.horaFijaMin?.(f.stop) ?? f.t
    return { titulo: h != null ? `tu entrada de las ${aHora(h, false)}` : `lo que tienes reservado${sufijo}`, detalle: 'Las reservas y lo importante no se tocan.' }
  }
  return { titulo: `lo más importante de tu día${sufijo}`, detalle: 'Lo imprescindible no se toca.' }
}

const etiquetaPara = (ctx: Contexto, d: DayPlan) => ctx.etiquetaDia(d)

/* ---------- colocar una parada en otro día (26a / 26b / 26c) ---------- */

/** Hasta qué hora admite paradas un día: la cena menos un cuarto de hora (no antes de las 17:00); sin cena, las 20:00. */
export const limiteDelDia = (day: DayPlan): number => {
  const cena = day.meals.find((m) => m.mealTime === 'dinner')
  const t = cena ? minDe(cena.time) : null
  return t != null ? Math.max(t - 15, 17 * 60) : 20 * 60
}

export const delDia = (day: DayPlan) => numberedStopsOf(day).filter((s) => !s.saltada && !NO_ES_VISITA(s) && !s.isNightExperience && !s.isNightView)

export interface Colocacion {
  caso: 'a' | 'b' | 'c'
  ops: Op[]
  /** La parada que sale (solo en b). */
  sale?: Stop
  /** Después de qué parada entra (a). */
  despuesDe?: Stop
  hora?: string
}

export const conMeal = (day: DayPlan, i: number, meter: boolean) => ({ mealAntes: day.mealAfter, mealDespues: meter ? mealTrasMeter(day.mealAfter, i) : mealTrasSacar(day.mealAfter, i) })

const paraOtroDia = (s: Stop): Stop => {
  const { checkedInAt: _c, delayNotedAt: _d, ...resto } = s
  void _c
  void _d
  return { ...resto, saltada: false }
}

/** ¿Cabe `stop` en el día `day`, dónde y a qué precio? Devuelve las tres vías, de la mejor a la peor, ya como operaciones. */
export function colocarEnDia(day: DayPlan, stop: Stop, ctx: Contexto, opciones: { permitirB?: boolean } = {}): Colocacion[] {
  const salida: Colocacion[] = []
  const fijas = ctx.fijasDe(day)
  const visitas = delDia(day)
  const limite = limiteDelDia(day)
  const dur = stop.durationMinutes || 45
  const ultima = visitas[visitas.length - 1]
  const finUltima = ultima ? (minDe(ultima.time) ?? 9 * 60) + (ultima.durationMinutes || 0) : 10 * 60 - 20
  const t = sube10(finUltima + (ultima ? viajeMin(ultima, stop, ctx.enCoche) : 20))
  const nuevo = (hora: number): Stop => ({ ...paraOtroDia(stop), time: aHora(hora, true), nextLegPending: true })
  // a) Cabe al final del día sin tocar nada.
  if (t + dur <= limite) {
    const iUlt = ultima ? day.stops.findIndex((s) => s.id === ultima.id) : -1
    const indice = iUlt >= 0 ? iUlt + 1 : day.stops.length
    const n = nuevo(t)
    salida.push({ caso: 'a', ops: [{ t: 'meter', dia: day.id, stop: n, indice, ...conMeal(day, indice, true) }], despuesDe: ultima, hora: n.time })
  } else if (opciones.permitirB !== false) {
    // b) Cabe en el hueco de algo flexible (o de lo opcional) que sale: nunca de lo fijo ni de lo imprescindible.
    const items = itemsDe(visitas, fijas, ctx.datos)
    const huecos = items
      .map((it, k) => {
        const sig = items.slice(k + 1).find((x) => x.t != null)
        const lim = Math.min(sig?.t ?? limite, limite)
        const hueco = lim - (it.t ?? 0)
        return { it, hueco }
      })
      .filter((x) => !x.it.fija && x.it.t != null && ORDEN_DE_QUITAR.slice(0, 2).includes(x.it.clase) && x.hueco >= dur)
      .sort((a, b) => ORDEN_DE_QUITAR.indexOf(a.it.clase) - ORDEN_DE_QUITAR.indexOf(b.it.clase) || a.it.dur - b.it.dur)
    const e = huecos[0]
    if (e) {
      const n = nuevo(e.it.t as number)
      const iy = day.stops.findIndex((s) => s.id === e.it.stop.id)
      const m1 = conMeal(day, iy, false)
      const ops: Op[] = [
        { t: 'sacar', dia: day.id, stop: e.it.stop, indice: iy, ...m1 },
        { t: 'meter', dia: day.id, stop: n, indice: iy, mealAntes: m1.mealDespues, mealDespues: mealTrasMeter(m1.mealDespues, iy) },
        { t: 'sobra_meter', dia: day.id, stop: { ...e.it.stop, spareReason: 'Dejada para meter otra parada.' } },
      ]
      salida.push({ caso: 'b', ops, sale: e.it.stop, hora: n.time })
    }
  }
  // c) No cabe: al final del día, en «Si te sobra tiempo».
  salida.push({ caso: 'c', ops: [{ t: 'sobra_meter', dia: day.id, stop: { ...paraOtroDia(stop), spareReason: 'La pasaste desde otro día.' } }] })
  return salida
}

/** Pasar una parada a otro día (el viajero elige el día; sale uno de los tres casos). La primera es la mejor; `Ver otra opción` baja a «Si te sobra tiempo». */
export function proponerPasarADia(p: { route: Route; day: DayPlan; stop: Stop; destinoId: string; ctx: Contexto }): { propuestas: Propuesta[]; razon?: 'fija' | 'sin_dia' } {
  const { route, day, stop, ctx } = p
  const destino = route.days.find((d) => d.id === p.destinoId)
  if (!destino || destino.id === day.id || !diaAdmite(destino)) return { propuestas: [], razon: 'sin_dia' }
  if (ctx.fijasDe(day).has(stop.id) || stop.reservedId) return { propuestas: [], razon: 'fija' }
  const iOrigen = day.stops.findIndex((s) => s.id === stop.id)
  if (iOrigen < 0) return { propuestas: [], razon: 'sin_dia' }
  const sacar: Op = { t: 'sacar', dia: day.id, stop, indice: iOrigen, ...conMeal(day, iOrigen, false) }
  const dest = etiquetaPara(ctx, destino)
  const hoy = etiquetaPara(ctx, day)
  const n = nombre(stop)
  const items = itemsDe(delDia(destino), ctx.fijasDe(destino), ctx.datos)
  const mantieneDia = (): Propuesta['mantiene'] => {
    const f = items.find((it) => it.fija)
    return f ? { titulo: `tus reservas del ${dest}`, detalle: 'Las horas fijas no se tocan.' } : { titulo: `lo importante del ${dest}`, detalle: 'Lo imprescindible no se toca.' }
  }
  // (V43 §4) Solo la MEJOR forma en ESE día (cabe · cabe quitando algo flexible · al final, en «Si te sobra tiempo»): el viajero no ve [Ver otra opción], sino [Elegir otro día].
  const propuestas = colocarEnDia(destino, stop, ctx).slice(0, 1).map((c): Propuesta => {
    const quitadas = c.sale ? [{ id: c.sale.id, nombre: nombre(c.sale), clase: claseDe(c.sale, ctx.fijasDe(destino), ctx.datos), destino: 'otro' as const }] : []
    const resumenDia: NonNullable<Propuesta['resumen']> = [{ icono: 'mover', texto: c.caso === 'c' ? `${n} va al final del ${dest}, en «Si te sobra tiempo»` : `${n} pasa al ${dest}` }, ...(c.sale ? [{ icono: 'quitar' as const, texto: `${nombre(c.sale)} pasa a «Si te sobra tiempo»` }] : []), { icono: 'ok', texto: `Sigue igual: el resto de tu ${hoy}` }]
    const iso = ctx.fechaDe?.(destino) ?? null
    const semanaCorta = iso ? ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'][new Date(`${iso}T12:00:00Z`).getUTCDay()] : `DÍA`
    const numero = iso ? String(Number(iso.slice(8, 10))) : String(destino.dayNumber)
    const iDespues = c.despuesDe ? delDia(destino).findIndex((s) => s.id === c.despuesDe?.id) : -1
    const mitad = Math.max(1, Math.ceil(delDia(destino).length / 2))
    const cuando = c.caso === 'c' ? `Al final del ${dest.replace(/ \d+$/, '')} · «Si te sobra tiempo»` : iDespues >= mitad ? 'Por la tarde' : 'Por la mañana'
    const tarjetaDia = { nombre: n, fotoUrl: stop.photoUrl || stop.fixedPhotoUrl || '', cuando, semanaCorta, numero, destino: dest, diaDeHoy: ctx.etiquetaDia(day), parada: stop, ciudad: day.city }
    const base = { tarjetaDia, tipo: 'otro_dia' as const, caso: c.caso, boton: `Pasarlo al ${dest}`, resumen: resumenDia, quitadas, corridas: 0, intactas: items.filter((it) => it.fija).map((it) => it.stop.id), ops: [sacar, ...c.ops] }
    if (c.caso === 'a')
      return { ...base, id: `otro-dia-a-${destino.id}`, intro: `Podemos pasarte ${n} al ${dest}${c.despuesDe ? `, después de ${nombre(c.despuesDe)}` : ''}.`, cambia: { titulo: `${n} pasa al ${dest}`, detalle: c.despuesDe ? `Entra después de ${nombre(c.despuesDe)}.` : 'Entra al empezar el día.' }, mantiene: { titulo: `el resto de tu ${hoy}`, detalle: 'Sin cambios.' } }
    if (c.caso === 'b')
      return { ...base, id: `otro-dia-b-${destino.id}`, intro: `Para meter ${n} el ${dest}, tendríamos que quitar ${nombre(c.sale as Stop)}.`, cambia: { titulo: `entra ${n}, sale ${nombre(c.sale as Stop)}`, detalle: `${nombre(c.sale as Stop)} es flexible: la dejamos en «Si te sobra tiempo».` }, mantiene: mantieneDia() }
    return { ...base, id: `otro-dia-c-${destino.id}`, intro: `No cabe en tus otros días sin estropearlos. Si te hace ilusión, lo dejamos al final del ${dest}, como «Si te sobra tiempo».`, cambia: { titulo: `${n}, al final del ${dest}`, detalle: 'Va aparte, en «Si te sobra tiempo».' }, mantiene: { titulo: 'todo lo demás', detalle: 'Tu ruta sigue igual.' } }
  })
  return { propuestas }
}

/* ---------- el mejor día para una parada (V43 §2 y §4) ---------- */

/** «viernes 27»: el día de la semana y el número (sin fechas, solo el nombre que dé el contexto). */
export const etiquetaConNumero = (ctx: Contexto, d: DayPlan): string => {
  const iso = ctx.fechaDe?.(d) ?? null
  return iso ? `${ctx.etiquetaDia(d)} ${Number(iso.slice(8, 10))}` : ctx.etiquetaDia(d)
}

export interface MejorDia {
  dia: DayPlan
  col: Colocacion
  etiqueta: string
  /** Metros hasta lo más cercano de ese día (para ordenar). */
  metros: number
}

export interface OpcionDeDia {
  dia: DayPlan
  /** null si ese día está cerrado para esta parada. */
  col: Colocacion | null
  cerrado: boolean
  etiqueta: string
  metros: number
  /** Cuántas visitas lleva ya ese día. */
  visitas: number
}

/** Todos los días POSTERIORES a hoy que admiten paradas, con cómo encaja la parada en cada uno (cabe, quitando algo flexible, o al final en «Si te sobra tiempo»). */
export function opcionesDeDia(p: { route: Route; day: DayPlan; stop: Stop; ctx: Contexto; dias?: DayPlan[] }): OpcionDeDia[] {
  const { route, day, stop, ctx } = p
  const lista = p.dias ?? route.days
  const hoy = route.days.findIndex((d) => d.id === day.id)
  const salida: OpcionDeDia[] = []
  for (const d of lista) {
    if (route.days.findIndex((x) => x.id === d.id) <= hoy || !diaAdmite(d)) continue
    const fecha = ctx.fechaDe?.(d) ?? null
    const h = ctx.horarioEn?.(stop, fecha) ?? null
    const visitas = delDia(d)
    const metros = hasRealCoordinates(stop.coordinates) ? Math.min(...visitas.filter((v) => hasRealCoordinates(v.coordinates)).map((v) => haversineMeters(stop.coordinates, v.coordinates)), 8000) : 8000
    if (h?.cerrado) {
      salida.push({ dia: d, col: null, cerrado: true, etiqueta: etiquetaConNumero(ctx, d), metros, visitas: visitas.length })
      continue
    }
    salida.push({ dia: d, col: colocarEnDia(d, stop, ctx)[0] ?? null, cerrado: false, etiqueta: etiquetaConNumero(ctx, d), metros, visitas: visitas.length })
  }
  return salida
}

/** El mejor día donde la parada CABE sin quitar nada: abierto y cerca. (V44 §7) Sin tope de visitas: lo que cuenta es el tiempo (que quepa en las horas del día, con lo que ya tiene y los trayectos). Nada si no cabe en ninguno. */
export function mejorDiaPara(p: { route: Route; day: DayPlan; stop: Stop; ctx: Contexto; dias?: DayPlan[] }): MejorDia | null {
  const buenas = opcionesDeDia(p).filter((o): o is OpcionDeDia & { col: Colocacion } => !o.cerrado && o.col?.caso === 'a')
  if (buenas.length === 0) return null
  buenas.sort((a, b) => a.metros + a.visitas * 120 - (b.metros + b.visitas * 120))
  const m = buenas[0]
  return { dia: m.dia, col: m.col, etiqueta: m.etiqueta, metros: m.metros }
}

/* ---------- «Hoy ya no da tiempo a todo» (V43 §2) ---------- */

/** (V56, 8) Desde las 20:00 la hoja «Hoy ya no da tiempo a todo» ya no sale. */
export const HORA_DE_CENAR_MIN = 20 * 60

export interface YaNoDaTiempo {
  /** Si había una entrada o reserva que ya pasó. */
  entrada: { nombre: string; hora: string; /** (V48) Un free tour no tiene «entrada»: «Tu Free Tour por Roma de las 10:00 ya ha pasado». */ freeTour?: boolean } | null
}

/**
 * ¿Sale la hoja «Hoy ya no da tiempo a todo»? Con más de una hora de retraso sobre la siguiente parada, o al abrir HOY con la mañana ya pasada y nada hecho.
 * Pura: la hoja sale UNA vez al día (lo guarda `avisosUnaVez`).
 */
export function yaNoDaTiempo(p: { day: DayPlan; ahoraMin: number; ctx: Contexto; vistas: number }): YaNoDaTiempo | null {
  const { day, ahoraMin, ctx } = p
  // (V56, 8) A partir de las 20:00 no sale: es la hora de cenar. (Lo demás, igual: una vez al día, con más de 1 h de retraso o al abrir HOY con la mañana pasada y nada hecho.)
  if (ahoraMin >= HORA_DE_CENAR_MIN) return null
  const pendientes = delDia(day).filter((s) => !s.checkedInAt)
  if (pendientes.length === 0) return null
  const siguiente = pendientes[0]
  const t = minDe(siguiente.time)
  const retrasoGrande = t != null && ahoraMin - t > 60
  // (V48) Al abrir HOY cuando han pasado 1 h 30 desde la hora PREVISTA de la primera parada del día y no se ha hecho ninguna (antes: «después de las 13:00», que salía el día de llegada antes de empezar).
  const primeraDelDia = minDe(delDia(day)[0]?.time)
  const mananaPasada = p.vistas === 0 && primeraDelDia != null && ahoraMin - primeraDelDia > 90
  if (!retrasoGrande && !mananaPasada) return null
  const fijas = ctx.fijasDe(day)
  const e = pendientes.find((s) => claseDe(s, fijas, ctx.datos) === 'fija' && puntualidadDe(s.name).tipo === 'estricta' && (ctx.horaFijaMin?.(s) ?? minDe(s.time) ?? 24 * 60) < ahoraMin)
  return { entrada: e ? { nombre: nombre(e), hora: aHora((ctx.horaFijaMin?.(e) ?? minDe(e.time)) as number, false), freeTour: Boolean(e.isFreeTour) } : null }
}

/** «Pasar lo que falta a otro día» (V43 §2): cada parada pendiente que no es fija, al mejor día donde quepa; lo que no cabe en ninguno se queda en «Lugares pendientes» (no se pierde). Una sola propuesta. */
export function proponerPasarLoQueFalta(p: { route: Route; day: DayPlan; ctx: Contexto; ahoraMin: number }): Propuesta | null {
  const { route, day, ctx } = p
  const fijas = ctx.fijasDe(day)
  const pendientes = delDia(day).filter((s) => !s.checkedInAt && claseDe(s, fijas, ctx.datos) !== 'fija')
  if (pendientes.length === 0) return null
  const ops: Op[] = []
  const quitadas: Propuesta['quitadas'] = []
  let trabajoHoy = day
  let dias: DayPlan[] = route.days
  for (const s of pendientes) {
    const mejor = mejorDiaPara({ route, day, stop: s, ctx, dias })
    const clase = claseDe(s, fijas, ctx.datos)
    if (mejor) {
      const iy = trabajoHoy.stops.findIndex((x) => x.id === s.id)
      const o: Op[] = [{ t: 'sacar', dia: day.id, stop: s, indice: iy, ...conMeal(trabajoHoy, iy, false) }, ...mejor.col.ops]
      for (const op of o) {
        if (op.dia === day.id) trabajoHoy = aplicarOpADia(trabajoHoy, op, 'adelante')
        else dias = dias.map((d) => (d.id === op.dia ? aplicarOpADia(d, op, 'adelante') : d))
      }
      ops.push(...o)
      quitadas.push({ id: s.id, nombre: nombre(s), clase, destino: 'manana', aDia: mejor.etiqueta })
    } else {
      ops.push({ t: 'campo', dia: day.id, id: s.id, antes: { time: s.time, saltada: Boolean(s.saltada) }, despues: { time: s.time, saltada: true } })
      quitadas.push({ id: s.id, nombre: nombre(s), clase, destino: 'sobra' })
    }
  }
  const movidas = quitadas.filter((q) => q.destino === 'manana')
  const sinDia = quitadas.filter((q) => q.destino === 'sobra')
  const resumen: NonNullable<Propuesta['resumen']> = movidas.map((q) => ({ icono: 'mover' as const, texto: `${q.nombre} pasa al ${q.aDia}` }))
  if (sinDia.length) resumen.push({ icono: 'quitar', texto: `${unir(sinDia.map((q) => q.nombre))} se queda en «Lugares pendientes»: no cabe en otro día` })
  resumen.push({ icono: 'ok', texto: 'Lo que tienes reservado no se toca' })
  return {
    id: 'pasar-lo-que-falta',
    tipo: 'retraso',
    intro: 'Pasamos a otros días lo que hoy ya no te da tiempo a hacer, cada cosa donde mejor encaja.',
    cambia: { titulo: `${unir(quitadas.map((q) => q.nombre))} sale de hoy`, detalle: 'Cada parada, a su mejor día.' },
    mantiene: { titulo: 'tus reservas', detalle: 'Las horas fijas no se tocan.' },
    ops,
    boton: 'Pasar lo que falta a otros días',
    resumen,
    quitadas,
    corridas: 0,
    intactas: [],
  }
}

/**
 * (V54 §1) «Hoy ya no llegas a 3 sitios» › [Ver]: la hoja de «Pasar a otro día» con UNA TARJETA POR SITIO. Cada sitio se pasa al mejor día donde quepa; lo que no cabe en ninguno, a «Lugares pendientes» (no se pierde).
 * Los sitios son visitas sueltas (nunca una reserva): `proponerPasarADia` ya lo comprueba para uno solo; aquí se cuentan todos seguidos, en un día de trabajo que se va actualizando.
 */
export function proponerPasarSitios(p: { route: Route; day: DayPlan; ctx: Contexto; stops: Stop[]; /** Lo que se dice arriba: «Hoy ya no llegas a …». */ intro: string; /** (V59) Todos a «Lugares pendientes», sin buscarles día ([Guardarlos en pendientes]). */ soloPendientes?: boolean; /** (V59) La tarjeta dice «Al jueves 26» (el día al que va) en vez de «Por la mañana». */ cuandoConDia?: boolean }): Propuesta | null {
  const { route, day, ctx } = p
  const fijas = ctx.fijasDe(day)
  const sitios = p.stops.filter((s) => !fijas.has(s.id) && !s.reservedId)
  if (sitios.length === 0) return null
  const ops: Op[] = []
  const quitadas: Propuesta['quitadas'] = []
  const tarjetas: NonNullable<Propuesta['tarjetasDia']> = []
  let trabajoHoy = day
  let dias: DayPlan[] = route.days
  const semanaCorta = (iso: string | null) => (iso ? ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'][new Date(`${iso}T12:00:00Z`).getUTCDay()] : 'DÍA')
  for (const s of sitios) {
    const mejor = p.soloPendientes ? null : mejorDiaPara({ route, day, stop: s, ctx, dias })
    const clase = claseDe(s, fijas, ctx.datos)
    const fotoUrl = s.photoUrl || s.fixedPhotoUrl || ''
    if (mejor) {
      const iy = trabajoHoy.stops.findIndex((x) => x.id === s.id)
      const o: Op[] = [{ t: 'sacar', dia: day.id, stop: s, indice: iy, ...conMeal(trabajoHoy, iy, false) }, ...mejor.col.ops]
      for (const op of o) {
        if (op.dia === day.id) trabajoHoy = aplicarOpADia(trabajoHoy, op, 'adelante')
        else dias = dias.map((d) => (d.id === op.dia ? aplicarOpADia(d, op, 'adelante') : d))
      }
      ops.push(...o)
      const iso = ctx.fechaDe?.(mejor.dia) ?? null
      quitadas.push({ id: s.id, nombre: nombre(s), clase, destino: 'manana', aDia: mejor.etiqueta })
      tarjetas.push({ nombre: nombre(s), fotoUrl, cuando: p.cuandoConDia ? `Al ${mejor.etiqueta}` : 'Por la mañana', semanaCorta: semanaCorta(iso), numero: iso ? String(Number(iso.slice(8, 10))) : String(mejor.dia.dayNumber), destino: mejor.etiqueta, diaDeHoy: ctx.etiquetaDia(day), parada: s, ciudad: day.city })
    } else {
      ops.push({ t: 'campo', dia: day.id, id: s.id, antes: { time: s.time, saltada: Boolean(s.saltada) }, despues: { time: s.time, saltada: true } })
      quitadas.push({ id: s.id, nombre: nombre(s), clase, destino: 'sobra' })
      tarjetas.push({ nombre: nombre(s), fotoUrl, cuando: 'A Lugares pendientes', semanaCorta: '', numero: '', destino: '', diaDeHoy: ctx.etiquetaDia(day), aPendientes: true, parada: s, ciudad: day.city })
    }
  }
  const dest = new Set(quitadas.filter((q) => q.destino === 'manana').map((q) => q.aDia))
  const todosPend = dest.size === 0
  const plural = sitios.length > 1
  return {
    id: 'pasar-sitios',
    tipo: 'otro_dia',
    intro: p.intro,
    cambia: { titulo: `${unir(quitadas.map((q) => q.nombre))} sale de hoy`, detalle: 'Cada sitio, a su mejor día.' },
    mantiene: { titulo: 'tus reservas', detalle: 'Las horas fijas no se tocan.' },
    ops,
    boton: todosPend ? (plural ? 'Guardarlos en pendientes' : 'Guardarlo en pendientes') : dest.size === 1 && quitadas.every((q) => q.destino === 'manana') ? `Pasar${plural ? 'los' : 'lo'} al ${[...dest][0]?.replace(/ \d+$/, '')}` : 'Pasarlos a otro día',
    tarjetasDia: tarjetas,
    franja: 'Lo que tienes reservado no se toca',
    quitadas,
    corridas: 0,
    intactas: [],
  }
}

/* ---------- voy con retraso (23) ---------- */

export const INTRO_RETRASO = 'Vas con algo de retraso. Buscamos el ajuste más pequeño para que no te pierdas lo importante.'

/** El retraso en minutos redondeado a los tres escalones de la propuesta: 15, 30 o 60. */
export const escalonDeRetraso = (min: number): 15 | 30 | 60 => (min <= 15 ? 15 : min <= 30 ? 30 : 60)

/** Lo que el viajero va por detrás, contando por dentro: su hora de ahora contra la prevista de su parada (nunca se le enseña el número). */
export const retrasoDeAhora = (ahoraMin: number, paradaTime: string | null | undefined): number => {
  const t = minDe(paradaTime)
  return t == null ? 15 : Math.max(0, ahoraMin - t)
}

interface DestinoRetraso { id: string; destino: 'sobra' | 'manana' | 'manana_sobra' }

/**
 * Las propuestas para absorber un retraso de `minutos` desde la parada `paradaId`: SIN mover reservas ni turnos y quitando antes lo opcional que lo flexible y lo flexible que lo principal.
 * La primera es la mínima; las siguientes son otras salidas posibles (de más a menos pequeñas). Lo imprescindible, solo si no hay otra, y marcado como pregunta. Sin nada que ajustar: vacío.
 */
export function proponerRetraso(p: { route: Route; day: DayPlan; paradaId: string; minutos: number; ctx: Contexto; ahoraMin?: number }): Propuesta[] {
  const { route, day, ctx } = p
  const orden = numberedStopsOf(day)
  const i = orden.findIndex((s) => s.id === p.paradaId)
  if (i < 0 || p.minutos <= 0) return []
  const actual = orden[i]
  const fijas = ctx.fijasDe(day)
  // (V43 §1) NUNCA se protege una entrada o reserva cuya hora ya pasó: no cuenta para el reloj del día (se avisa en la hoja).
  const horaDe = (s: Stop) => ctx.horaFijaMin?.(s) ?? minDe(s.time)
  const esPasada = (s: Stop) => p.ahoraMin != null && claseDe(s, fijas, ctx.datos) === 'fija' && (horaDe(s) ?? 24 * 60) < p.ahoraMin
  const pasadas = orden.slice(i).filter((s) => !s.saltada && !s.checkedInAt && esPasada(s)).map((s) => ({ nombre: nombre(s), hora: aHora(horaDe(s) as number, false), freeTour: Boolean(s.isFreeTour) }))
  const restantes = orden.slice(i + 1).filter((s) => !s.saltada && !s.checkedInAt && !esPasada(s))
  const items = itemsDe(restantes, fijas, ctx.datos)
  if (items.length === 0) return []
  const t0 = minDe(actual.time)
  const fin0 = (t0 ?? p.ahoraMin ?? 12 * 60) + (actual.durationMinutes || 0)
  const base = simularBase(items, fin0, actual, ctx.enCoche)
  // (V43) Con la hora de ahora, nunca se cuenta desde antes de ahora (a las 21:19 no se empieza a las 10:00).
  const cur0 = Math.max(fin0 + p.minutos, p.ahoraMin ?? 0)
  const variantes: { quitados: Set<string>; pregunta: boolean }[] = []
  const vistas = new Set<string>()
  const meter = (q: Set<string> | null, pregunta = false) => {
    if (!q) return
    const k = [...q].sort().join('|')
    if (vistas.has(k)) return
    vistas.add(k)
    variantes.push({ quitados: q, pregunta })
  }
  for (let hasta = 0; hasta < ORDEN_DE_QUITAR.length; hasta++) {
    meter(minimoAQuitar(items, cur0, actual, ctx.enCoche, base, hasta, 'tarde'))
    meter(minimoAQuitar(items, cur0, actual, ctx.enCoche, base, hasta, 'pronto'))
  }
  // Si cabe sin quitar nada, otra salida es dejar la parada más prescindible para ir más holgado.
  if (variantes.length === 1 && variantes[0].quitados.size === 0) {
    const prescindible = ORDEN_DE_QUITAR.slice(0, 2)
      .flatMap((c) => items.filter((it) => it.clase === c && !it.fija))
      .sort((a, b) => ORDEN_DE_QUITAR.indexOf(a.clase) - ORDEN_DE_QUITAR.indexOf(b.clase))[0]
    if (prescindible) meter(new Set([prescindible.stop.id]))
  }
  // Lo imprescindible, solo si no hay otra salida, y preguntando.
  if (variantes.length === 0) {
    const q = minimoAQuitar(items, cur0, actual, ctx.enCoche, base, 3, 'tarde', [...ORDEN_DE_QUITAR, 'imprescindible'])
    meter(q, true)
  }
  const posibles = variantes.flatMap((v) => (v.quitados.size && [...v.quitados].some((id) => items.find((x) => x.stop.id === id)?.clase !== 'opcional') ? [{ v, modo: 'dia' as const }, { v, modo: 'quitar' as const }] : [{ v, modo: 'quitar' as const }]))
  const construidas = posibles.map(({ v, modo }, k): Propuesta | null => {
    const sim = cabe(items, cur0, actual, v.quitados, ctx.enCoche, base).sim
    const ops: Op[] = []
    const destinos: DestinoRetraso[] = []
    let trabajoHoy = day
    // (V43 §2) Los demás días, con lo que ya se les ha metido en esta propuesta.
    let trabajoDias: DayPlan[] = route.days
    const quitadas: Propuesta['quitadas'] = []
    let algunoSinDia = false
    let algunoConDia: string | null = null
    for (const id of [...v.quitados].sort((x, y) => ORDEN_DE_QUITAR.indexOf((items.find((q) => q.stop.id === x) as Item).clase) - ORDEN_DE_QUITAR.indexOf((items.find((q) => q.stop.id === y) as Item).clase))) {
      const it = items.find((x) => x.stop.id === id) as Item
      let destino: DestinoRetraso['destino'] = 'sobra'
      let aDia: string | undefined
      let opsDe: Op[] = []
      const mejor = it.clase !== 'opcional' ? mejorDiaPara({ route, day, stop: it.stop, ctx, dias: trabajoDias }) : null
      if (it.clase !== 'opcional' && !mejor) algunoSinDia = true
      if (it.clase !== 'opcional' && modo === 'dia' && mejor) {
        const iy = trabajoHoy.stops.findIndex((s) => s.id === it.stop.id)
        opsDe = [{ t: 'sacar', dia: day.id, stop: it.stop, indice: iy, ...conMeal(trabajoHoy, iy, false) }, ...mejor.col.ops]
        destino = 'manana'
        aDia = mejor.etiqueta
        algunoConDia = mejor.etiqueta
        for (const op of opsDe) {
          if (op.dia === day.id) trabajoHoy = aplicarOpADia(trabajoHoy, op, 'adelante')
          else trabajoDias = trabajoDias.map((d) => (d.id === op.dia ? aplicarOpADia(d, op, 'adelante') : d))
        }
      } else {
        if (it.clase !== 'opcional' && mejor) algunoConDia = mejor.etiqueta
        opsDe = [{ t: 'campo', dia: day.id, id: it.stop.id, antes: { time: it.stop.time, saltada: Boolean(it.stop.saltada) }, despues: { time: it.stop.time, saltada: true } }]
      }
      ops.push(...opsDe)
      destinos.push({ id, destino })
      quitadas.push({ id, nombre: nombre(it.stop), clase: it.clase, destino, ...(aDia ? { aDia } : {}) })
    }
    // Si «pasarlo» no lleva a ningún sitio (no cabe en ningún otro día), esta propuesta es igual que quitarlo: se queda solo esa.
    if (modo === 'dia' && quitadas.every((q) => q.destino === 'sobra')) return null
    for (const [id, min] of sim.nuevas) {
      const s = day.stops.find((x) => x.id === id)
      if (!s || v.quitados.has(id)) continue
      ops.push({ t: 'campo', dia: day.id, id, antes: { time: s.time, saltada: Boolean(s.saltada) }, despues: { time: aHora(min, ancho(s)), saltada: Boolean(s.saltada) } })
    }
    // La comida y la cena que caen detrás de lo corrido se corren igual (nunca pasan de las 23:00).
    const tardanza = (t: number): number => {
      let d = 0
      for (const it of items) {
        if (v.quitados.has(it.stop.id) || it.t == null || it.t >= t) continue
        d = sim.corrimiento.get(it.stop.id) ?? 0
      }
      return d
    }
    for (const m of day.meals) {
      if (m.mealTime !== 'lunch' && m.mealTime !== 'dinner') continue
      const t = minDe(m.time)
      if (t == null) continue
      const d = tardanza(t)
      if (d > 0 && t + d <= FIN_MIN) ops.push({ t: 'comida', dia: day.id, id: m.id, antes: m.time, despues: aHora(t + d, ancho(m)) })
    }
    const soloOpc = quitadas.filter((q) => q.destino === 'sobra' && q.clase === 'opcional').map((q) => q.nombre)
    const aSobraHoy = quitadas.filter((q) => q.destino === 'sobra' && q.clase !== 'opcional').map((q) => q.nombre)
    const aDiaQ = quitadas.filter((q) => q.destino === 'manana')
    const diasDe = [...new Set(aDiaQ.map((q) => q.aDia as string))]
    const partes: string[] = []
    if (soloOpc.length) partes.push(`quitamos ${unir(soloOpc)}`)
    if (aDiaQ.length) partes.push(`pasamos ${unir(aDiaQ.map((q) => q.nombre))} al ${diasDe.join(' y al ')}`)
    if (aSobraHoy.length) partes.push(`quitamos ${unir(aSobraHoy)} de hoy`)
    const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
    const titulo = partes.length ? cap(partes.join(' y ')) : 'Tus siguientes paradas se retrasan un poco'
    const pregunta = v.pregunta
    const detalle = pregunta
      ? 'Es de los lugares más importantes de tu viaje: solo lo hacemos si tú quieres.'
      : aSobraHoy.length && algunoSinDia
        ? 'No cabe en ningún otro día de tu viaje.'
        : aSobraHoy.length
          ? 'Lo puedes recuperar desde «Lugares pendientes» cuando quieras.'
          : aDiaQ.length
            ? 'Ese día cabe sin llenarlo y está abierto.'
            : soloOpc.length
              ? 'Es opcional: queda en «Si te sobra tiempo».'
              : 'Todo cabe: no quitamos nada.'
    const mantiene = mantieneDe(items, ctx)
    const cambiaTitulo = pregunta ? `Dejamos ${unir(quitadas.map((q) => q.nombre))}` : titulo
    const plural = quitadas.length > 1
    const boton = aDiaQ.length ? `${plural ? 'Pasarlos' : 'Pasarlo'} al ${diasDe[0]}` : quitadas.length ? `${plural ? 'Guardarlos' : 'Guardarlo'} en pendientes` : 'Ajustar mi día'
    const resumen: NonNullable<Propuesta['resumen']> = []
    if (aDiaQ.length) resumen.push({ icono: 'mover', texto: `${cap(unir(aDiaQ.map((q) => q.nombre)))} pasa${aDiaQ.length > 1 ? 'n' : ''} al ${diasDe.join(' y al ')}` })
    if (soloOpc.length || aSobraHoy.length) resumen.push({ icono: 'quitar', texto: `Sale de hoy: ${unir([...soloOpc, ...aSobraHoy])}` })
    // (V43 §2) 23c: «no cabe en ningún otro día de tu viaje»; con imprescindibles: «Es de los lugares más importantes de tu viaje: solo lo hacemos si tú quieres».
    if (aSobraHoy.length && algunoSinDia && !pregunta) resumen.push({ icono: 'quitar', texto: 'No cabe en ningún otro día de tu viaje' })
    if (pregunta) resumen.push({ icono: 'quitar', texto: 'Es de los lugares más importantes de tu viaje: solo lo hacemos si tú quieres' })
    if (sim.nuevas.size > 0) resumen.push({ icono: 'reloj', texto: 'Lo que sigue se retrasa un poco' })
    resumen.push({ icono: 'ok', texto: `Sigue igual: ${mantiene.titulo}` })
    return {
      id: `retraso-${p.minutos}-${k}`,
      tipo: 'retraso',
      intro: pregunta
        ? `Para no perder lo que tienes fijo tendríamos que quitar ${unir(quitadas.map((q) => q.nombre))}, que es de lo más importante.`
        : aDiaQ.length
          ? `Con el retraso, ${unir(aDiaQ.map((q) => q.nombre))} ya no cabe hoy. Lo pasamos al día donde mejor encaja.`
          : INTRO_RETRASO,
      cambia: { titulo: cambiaTitulo, detalle },
      mantiene,
      ops,
      pregunta: pregunta || undefined,
      boton,
      ...(modo === 'quitar' && algunoConDia ? { etiquetaOtra: `Mejor pasarlo al ${algunoConDia}` } : {}),
      resumen,
      entradasPasadas: pasadas,
      quitadas,
      corridas: sim.nuevas.size,
      intactas: items.filter((it) => it.fija).map((it) => it.stop.id),
    }
  })
  // «Pasarlo a otro día» va antes que «Quitarlo»; sin ningún día posible, solo queda quitarlo (23c).
  return construidas.filter((x): x is Propuesta => x !== null)
}

/* ---------- añadir un sitio cercano (27a / 27b) ---------- */

export interface Candidato {
  nombre: string
  coordinates: Coordinates
  duracionMin: number
  /** Metros hasta donde estás (o hasta tu siguiente parada). */
  metros: number
  /** Suma a algún logro (emblema o colección): sale primero. */
  logro: boolean
  /** Lo que el catálogo sabe de él (para la ficha y la foto). */
  lugar?: { photoUrl?: string; category_label?: string }
  /** (V43 §5) Cómo está ahora mismo: «Abierto · cierra a las 19:00», «Cierra pronto», «Al aire libre». */
  estado?: { texto: string; cierraPronto: boolean; alAireLibre: boolean }
  /** (V43 §5) El escalón del que sale: 1 cerca · 2 de otro día · 3 más lejos · 4 de noche. */
  escalon?: 1 | 2 | 3 | 4
  /** (V43 §5) Si ya lo tienes en otro día del viaje: ese día («viernes 27») y de qué día es (se añade hoy y el otro día NO se toca). */
  deOtroDia?: { etiqueta: string; diaId: string; stopId: string }
  /** (V43 §5) Tiene entrada: hoy se ve por fuera (15-20 min). */
  porFuera?: boolean
}

export type LugarCatalogo = { kind: string; name: string; coordinates: Coordinates; duration_min: number | null; fuera_de_lista?: boolean; solo_entradas?: boolean; photoUrl?: string; category_label?: string; hours_data?: Record<string, unknown> | null; available?: unknown; capa_de?: string | null; night_experience?: boolean; requires_ticket?: boolean }

const PALABRAS_SUELTAS = new Set(['piazza', 'plaza', 'piazzale', 'place', 'via', 'calle', 'de', 'del', 'di', 'della', 'la', 'el', 'il', 'lo', 'the', 'of'])
const normalizar = (t: string) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, ' ').split(' ').filter((w) => w && !PALABRAS_SUELTAS.has(w)).join(' ')
/** (V43 §5) ¿Es el MISMO sitio? Se compara el sitio, no el texto: «Piazza Navona» = «Navona» = «Plaza Navona (mercadillo)». */
export function mismoSitio(a: string, b: string): boolean {
  const x = normalizar(a)
  const y = normalizar(b)
  if (!x || !y) return false
  if (x === y) return true
  const [corto, largo] = x.length <= y.length ? [x, y] : [y, x]
  return corto.length >= 6 && ` ${largo} `.includes(` ${corto} `)
}

/**
 * (V43 §5) ¿Está abierto AHORA, según los horarios de los datos? Sin horario en los datos solo vale lo que lleva `abierto_24h`, lo nocturno de noche y, de día (7:00-20:00), un sitio al aire libre sin puertas.
 * De noche nunca sale un parque o un sitio con horario que ya cerró. Null = no vale.
 */
export function estadoAhora(l: Pick<LugarCatalogo, 'hours_data' | 'night_experience'>, ahoraMin: number, fechaIso: string | null, mes: number | null): Candidato['estado'] | null {
  void mes
  const datos = l.hours_data ?? null
  const tieneHorario = datos != null && ['windows', 'by_day', 'by_season', 'by_period', 'special_hours', 'schedule'].some((k) => datos[k] != null)
  if (tieneHorario) {
    const h = horarioDeParada({ hoursData: datos }, fechaIso, null)
    if (h && h.tramos.length > 0) {
      if (h.cerrado) return null
      const tramo = h.tramos.map((t) => ({ a: minDe(t.abre), c: minDe(t.cierra) })).find((t) => t.a != null && t.c != null && t.a <= ahoraMin && ahoraMin < t.c)
      if (!tramo) return null
      const resta = (tramo.c as number) - ahoraMin
      if (resta < 15) return null
      return resta < 60 ? { texto: 'Cierra pronto', cierraPronto: true, alAireLibre: false } : { texto: `Abierto · cierra a las ${aHora(tramo.c as number, false)}`, cierraPronto: false, alAireLibre: false }
    }
    if (h?.cerrado) return null
  }
  if (datos?.abierto_24h === true) return { texto: 'Al aire libre', cierraPronto: false, alAireLibre: true }
  const noche = ahoraMin >= 20 * 60 || ahoraMin < 7 * 60
  if (noche) return l.night_experience ? { texto: 'Se ve de noche', cierraPronto: false, alAireLibre: true } : null
  return tieneHorario ? null : { texto: 'Al aire libre', cierraPronto: false, alAireLibre: true }
}

/**
 * Los sitios que se pueden añadir a hoy (V43 §5), de EXPLORAR. Solo lo que está ABIERTO ahora; nunca uno que ya está en el viaje (se compara el sitio); con su foto; con recompensa primero y luego por cercanía.
 * Escalones, hasta tener al menos 3: 1) fuera de la ruta, hasta 15 min a pie · 2) sitios de OTROS días del viaje («Lo tienes el viernes»; se añaden hoy y el otro día no se toca; con entrada, por fuera)
 * · 3) hasta 30 min a pie, metro o bus · 4) de noche, lo al aire libre y lo nocturno, aunque esté más lejos. Si no hay nada: lista vacía (la pantalla dice «A esta hora no queda nada abierto cerca.»).
 * Sin `ahoraMin` (las demás pantallas que lo usan, como «¿Qué hago ahora?») no se mira el horario: como antes, solo por cercanía.
 */
export function candidatosParaAnadir(p: { route: Route; lugares: LugarCatalogo[]; desde: Coordinates | null; logros: Set<string>; enCoche: boolean; maxMetros?: number; limite?: number; ahoraMin?: number; day?: DayPlan; fechaIso?: string | null; mes?: number | null; ctx?: Contexto }): Candidato[] {
  const enRuta: { nombre: string; dia: DayPlan | null }[] = []
  for (const d of p.route.days) for (const s of [...d.stops, ...(d.spareStops ?? [])]) if (!s.isBreak && !s.isArrival && !s.passThrough) enRuta.push({ nombre: s.name, dia: d })
  const hoyId = p.day?.id ?? null
  const yaEstaHoy = (n: string) => enRuta.some((u) => (hoyId ? u.dia?.id === hoyId : true) && mismoSitio(u.nombre, n))
  const yaEstaEnElViaje = (n: string) => enRuta.some((u) => mismoSitio(u.nombre, n))
  const limiteM = p.maxMetros ?? (p.enCoche ? 25000 : 2500)
  const mHasta = (c: Coordinates) => (p.desde && hasRealCoordinates(p.desde) ? haversineMeters(p.desde, c) : 0)
  const conHorario = p.ahoraMin != null
  const mes = p.mes ?? null
  const dentroDeTemporada = (l: LugarCatalogo) => {
    if (!l.available || typeof l.available !== 'object') return true
    return seasonFit(l.available, { hasDates: Boolean(p.fechaIso), month: mes }, p.fechaIso ?? null).enters
  }
  const valen = p.lugares.filter((l) => l.kind === 'place' && !l.fuera_de_lista && !l.solo_entradas && !l.capa_de && hasRealCoordinates(l.coordinates) && dentroDeTemporada(l))
  const aCandidato = (l: LugarCatalogo, extra: Partial<Candidato> = {}): Candidato | null => {
    const estado = conHorario ? estadoAhora(l, p.ahoraMin as number, p.fechaIso ?? null, mes) : null
    if (conHorario && !estado) return null
    return { nombre: l.name, coordinates: l.coordinates, duracionMin: extra.porFuera ? 20 : (l.duration_min ?? 45), metros: mHasta(l.coordinates), logro: p.logros.has(l.name), lugar: { photoUrl: l.photoUrl, category_label: l.category_label }, ...(estado ? { estado } : {}), ...extra }
  }
  const ordenar = (l: Candidato[]) => l.sort((a, b) => Number(b.logro) - Number(a.logro) || a.metros - b.metros || a.nombre.localeCompare(b.nombre))
  const unico = (lista: Candidato[]) => {
    const vistos: Candidato[] = []
    for (const c of lista) if (!vistos.some((v) => mismoSitio(v.nombre, c.nombre))) vistos.push(c)
    return vistos
  }
  const tope = p.limite ?? 6
  // Sin horario (otras pantallas): como siempre, lo de fuera de la ruta por cercanía.
  if (!conHorario) {
    const lista = valen.filter((l) => !yaEstaEnElViaje(l.name) && mHasta(l.coordinates) <= limiteM).map((l) => aCandidato(l)).filter((c): c is Candidato => c !== null)
    return ordenar(unico(lista)).slice(0, tope)
  }
  const piePorMin = p.enCoche ? 667 / 1.35 : 80
  const m15 = 15 * piePorMin
  const m30 = 30 * piePorMin
  let salida: Candidato[] = []
  const nuevos = (lista: Candidato[]) => unico([...salida, ...lista])
  // 1) Fuera de la ruta, hasta 15 min.
  const fuera = valen.filter((l) => !yaEstaEnElViaje(l.name)).map((l) => aCandidato(l, { escalon: 1 })).filter((c): c is Candidato => c !== null)
  salida = nuevos(fuera.filter((c) => c.metros <= m15))
  // 2) Lo que ya tienes en otro día: se añade hoy y el otro día no se toca.
  if (salida.length < 3 && p.day) {
    const otros: Candidato[] = []
    for (const d of p.route.days) {
      if (d.id === p.day.id || !diaAdmite(d)) continue
      for (const s of d.stops) {
        if (s.saltada || s.checkedInAt || s.isBreak || s.isArrival || s.passThrough || yaEstaHoy(s.name)) continue
        const l = valen.find((x) => mismoSitio(x.name, s.name)) ?? p.lugares.find((x) => x.kind === 'place' && mismoSitio(x.name, s.name) && hasRealCoordinates(x.coordinates))
        if (!l || !dentroDeTemporada(l)) continue
        const porFuera = Boolean(l.requires_ticket) || Boolean(s.reservedId)
        const c = aCandidato({ ...l, name: s.name }, { escalon: 2, porFuera, deOtroDia: { etiqueta: p.ctx ? etiquetaConNumero(p.ctx, d) : `día ${d.dayNumber}`, diaId: d.id, stopId: s.id } })
        if (c && c.metros <= m30) otros.push(c)
      }
    }
    salida = nuevos(otros)
  }
  // 3) Hasta 30 min a pie (o metro y bus).
  if (salida.length < 3) salida = nuevos(fuera.filter((c) => c.metros <= m30).map((c) => ({ ...c, escalon: 3 as const })))
  // 4) De noche, lo al aire libre y lo nocturno, aunque esté más lejos.
  const esNoche = (p.ahoraMin as number) >= 20 * 60 || (p.ahoraMin as number) < 7 * 60
  if (salida.length < 3 && esNoche) salida = nuevos(fuera.filter((c) => c.estado?.alAireLibre && c.metros <= 6000).map((c) => ({ ...c, escalon: 4 as const })))
  return ordenar(salida).slice(0, tope)
}

export const stopDeCandidato = (c: Candidato, id?: string): Stop => ({
  id: id ?? `anadido-${c.nombre.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
  time: '',
  name: c.nombre,
  description: c.porFuera ? 'Lo ves por fuera.' : '',
  durationMinutes: c.duracionMin,
  coordinates: c.coordinates,
  photoUrl: c.lugar?.photoUrl ?? '',
  addedByUser: true,
})

/** Añadir un sitio a hoy: encaja (a: sin quitar nada) o hay que mover algo (b: lo más prescindible, a mañana). Nada si ni así cabe. */
export function proponerAnadir(p: { route: Route; day: DayPlan; stop: Stop; ctx: Contexto; ahoraMin: number }): Propuesta[] {
  const { route, day, ctx } = p
  const fijas = ctx.fijasDe(day)
  const hueco = posicionDeMenosRodeo(day.stops, p.stop.coordinates, primerHuecoLibre(day.stops))
  const antes = day.stops.slice(0, hueco).filter((s) => !s.saltada && !NO_ES_VISITA(s)).pop() ?? null
  const despues = numberedStopsOf(day).filter((s) => day.stops.indexOf(s) >= hueco && !s.saltada && !s.checkedInAt)
  const dur = p.stop.durationMinutes || 45
  const finAntes = antes ? (minDe(antes.time) ?? p.ahoraMin) + (antes.durationMinutes || 0) : p.ahoraMin
  const llegada = antes && antes.checkedInAt ? finAntes : Math.max(finAntes, p.ahoraMin)
  const t = sube10(llegada + (antes ? viajeMin(antes, p.stop, ctx.enCoche) : 5))
  const items = itemsDe(despues, fijas, ctx.datos)
  const fin = t + dur
  const base = simularBase(items, fin - dur, antes, ctx.enCoche)
  const nuevo: Stop = { ...p.stop, time: aHora(t, true), nextLegPending: true }
  const meterOp: Op = { t: 'meter', dia: day.id, stop: nuevo, indice: hueco, ...conMeal(day, hueco, true) }
  const vecino = despues[0] ?? antes
  const franja = t < 14 * 60 ? 'por la mañana' : t < 20 * 60 ? 'por la tarde' : 'por la noche'
  const n = nombre(p.stop)
  const salida: Propuesta[] = []
  const baseDeAqui = simularBase(items, fin, nuevo, ctx.enCoche)
  void base
  const sinQuitar = cabe(items, fin, nuevo, new Set(), ctx.enCoche, baseDeAqui)
  // Sin añadir, ¿cómo iba el día? (para no cargar al cambio lo que ya iba justo)
  const sinNada = simularBase(items, p.ahoraMin, antes, ctx.enCoche)
  const caben = (q: Set<string>) => cabe(items, fin, nuevo, q, ctx.enCoche, sinNada)
  if (caben(new Set()).ok) {
    const sim = caben(new Set()).sim
    const ops: Op[] = [meterOp]
    for (const [id, min] of sim.nuevas) {
      const s = day.stops.find((x) => x.id === id)
      if (s) ops.push({ t: 'campo', dia: day.id, id, antes: { time: s.time, saltada: Boolean(s.saltada) }, despues: { time: aHora(min, ancho(s)), saltada: Boolean(s.saltada) } })
    }
    salida.push({ id: `anadir-a-${p.stop.id}`, tipo: 'anadir', caso: 'a', intro: `${n} encaja sin cambios.`, cambia: { titulo: `se añade ${n}`, detalle: `Entra ${franja}${vecino ? `, junto a ${nombre(vecino)}` : ''}.` }, mantiene: { titulo: 'todo lo que ya tenías', detalle: 'Sin cambios.' }, ops, quitadas: [], corridas: sim.nuevas.size, intactas: items.filter((it) => it.fija).map((it) => it.stop.id) })
  } else {
    void sinQuitar
    const manana = route.days[route.days.findIndex((d) => d.id === day.id) + 1]
    for (const hasta of [0, 1, 2]) {
      for (const orden of ['tarde', 'pronto'] as const) {
        const q = (() => {
          const quitados = new Set<string>()
          for (let r = 0; r <= hasta; r++) {
            const cand = items.filter((it) => it.clase === ORDEN_DE_QUITAR[r] && !it.fija)
            if (orden === 'tarde') cand.reverse()
            for (const c of cand) {
              quitados.add(c.stop.id)
              if (caben(quitados).ok) break
            }
            if (caben(quitados).ok) break
          }
          if (!caben(quitados).ok) return null
          const rango = (id: string) => ORDEN_DE_QUITAR.indexOf(items.find((it) => it.stop.id === id)!.clase)
          for (const id of [...quitados].sort((x, y) => rango(y) - rango(x))) {
            quitados.delete(id)
            if (!caben(quitados).ok) quitados.add(id)
          }
          return quitados
        })()
        if (!q || q.size === 0) continue
        const k = `anadir-b-${p.stop.id}-${[...q].sort().join('+')}`
        if (salida.some((x) => x.id === k)) continue
        const sim = caben(q).sim
        const ops: Op[] = []
        let trabajoHoy = day
        let trabajoManana = manana
        const quitadas: Propuesta['quitadas'] = []
        for (const id of q) {
          const it = items.find((x) => x.stop.id === id) as Item
          let destino: 'sobra' | 'manana' | 'manana_sobra' = 'sobra'
          if (it.clase !== 'opcional' && diaAdmite(trabajoManana)) {
            const c = colocarEnDia(trabajoManana as DayPlan, it.stop, ctx, { permitirB: false })[0]
            const iy = trabajoHoy.stops.findIndex((s) => s.id === it.stop.id)
            const o: Op[] = [{ t: 'sacar', dia: day.id, stop: it.stop, indice: iy, ...conMeal(trabajoHoy, iy, false) }, ...c.ops]
            for (const op of o) {
              if (op.dia === day.id) trabajoHoy = aplicarOpADia(trabajoHoy, op, 'adelante')
              else if (trabajoManana && op.dia === trabajoManana.id) trabajoManana = aplicarOpADia(trabajoManana, op, 'adelante')
            }
            ops.push(...o)
            destino = c.caso === 'a' ? 'manana' : 'manana_sobra'
          } else ops.push({ t: 'campo', dia: day.id, id, antes: { time: it.stop.time, saltada: Boolean(it.stop.saltada) }, despues: { time: it.stop.time, saltada: true } })
          quitadas.push({ id, nombre: nombre(it.stop), clase: it.clase, destino })
        }
        // El sitio nuevo entra donde estaba pensado (el índice puede haber cambiado si algo de antes salió).
        const indiceFinal = Math.min(hueco, trabajoHoy.stops.length)
        ops.unshift({ ...meterOp, indice: indiceFinal })
        for (const [id, min] of sim.nuevas) {
          const s = day.stops.find((x) => x.id === id)
          if (s && !q.has(id)) ops.push({ t: 'campo', dia: day.id, id, antes: { time: s.time, saltada: Boolean(s.saltada) }, despues: { time: aHora(min, ancho(s)), saltada: Boolean(s.saltada) } })
        }
        const nombres = quitadas.map((x) => x.nombre)
        const aMan = quitadas.some((x) => x.destino !== 'sobra')
        salida.push({ id: k, tipo: 'anadir', caso: 'b', intro: `Para incluir ${n}, tendríamos que mover ${unir(nombres)}.`, cambia: { titulo: `${unir(nombres)} pasa${nombres.length > 1 ? 'n' : ''} ${aMan ? 'a la mañana de mañana' : 'a «Si te sobra tiempo»'}`, detalle: `Así ${n} entra hoy.` }, mantiene: { titulo: 'tus reservas', detalle: 'Las horas fijas no se tocan.' }, ops, quitadas, corridas: sim.nuevas.size, intactas: items.filter((it) => it.fija).map((it) => it.stop.id) })
      }
    }
  }
  return salida
}
