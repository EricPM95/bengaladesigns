import { hasRealCoordinates, haversineMeters } from './distanceMock'
import { displayStopName } from './format'
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
  return Boolean(day && !day.isReturnLeg && !day.isExcursionDay && day.interruptor?.mode !== 'excursion')
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
  /** Para la prueba y la nota interna (nunca se enseñan): lo que se quita (con su clase), lo que se corre y a dónde va cada cosa. */
  quitadas: { id: string; nombre: string; clase: Clase; destino: 'sobra' | 'manana' | 'manana_sobra' | 'otro' }[]
  corridas: number
  /** Los ids de las paradas fijas que la propuesta NO toca (todas las del día). */
  intactas: string[]
}

export const mantieneDe = (fijasOrden: Item[], ctx: Contexto, sufijo = ''): Propuesta['mantiene'] => {
  const f = fijasOrden.find((it) => it.fija)
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
  const propuestas = colocarEnDia(destino, stop, ctx).map((c): Propuesta => {
    const quitadas = c.sale ? [{ id: c.sale.id, nombre: nombre(c.sale), clase: claseDe(c.sale, ctx.fijasDe(destino), ctx.datos), destino: 'otro' as const }] : []
    const base = { tipo: 'otro_dia' as const, caso: c.caso, quitadas, corridas: 0, intactas: items.filter((it) => it.fija).map((it) => it.stop.id), ops: [sacar, ...c.ops] }
    if (c.caso === 'a')
      return { ...base, id: `otro-dia-a-${destino.id}`, intro: `Podemos pasarte ${n} al ${dest}${c.despuesDe ? `, después de ${nombre(c.despuesDe)}` : ''}.`, cambia: { titulo: `${n} pasa al ${dest}`, detalle: c.despuesDe ? `Entra después de ${nombre(c.despuesDe)}.` : 'Entra al empezar el día.' }, mantiene: { titulo: `el resto de tu ${hoy}`, detalle: 'Sin cambios.' } }
    if (c.caso === 'b')
      return { ...base, id: `otro-dia-b-${destino.id}`, intro: `Para meter ${n} el ${dest}, tendríamos que quitar ${nombre(c.sale as Stop)}.`, cambia: { titulo: `entra ${n}, sale ${nombre(c.sale as Stop)}`, detalle: `${nombre(c.sale as Stop)} es flexible: la dejamos en «Si te sobra tiempo».` }, mantiene: mantieneDia() }
    return { ...base, id: `otro-dia-c-${destino.id}`, intro: `No cabe en tus otros días sin estropearlos. Si te hace ilusión, lo dejamos al final del ${dest}, como «Si te sobra tiempo».`, cambia: { titulo: `${n}, al final del ${dest}`, detalle: 'Va aparte, en «Si te sobra tiempo».' }, mantiene: { titulo: 'todo lo demás', detalle: 'Tu ruta sigue igual.' } }
  })
  return { propuestas }
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
  const restantes = orden.slice(i + 1).filter((s) => !s.saltada && !s.checkedInAt)
  const items = itemsDe(restantes, fijas, ctx.datos)
  if (items.length === 0) return []
  const t0 = minDe(actual.time)
  const fin0 = (t0 ?? p.ahoraMin ?? 12 * 60) + (actual.durationMinutes || 0)
  const base = simularBase(items, fin0, actual, ctx.enCoche)
  const cur0 = fin0 + p.minutos
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
  const despuesDeHoy = route.days.slice(route.days.findIndex((d) => d.id === day.id) + 1)
  // A mañana, o al primer día que admita paradas (si mañana es una excursión o la vuelta).
  const manana = despuesDeHoy.find((d) => diaAdmite(d))
  const aDia = manana && despuesDeHoy[0] && manana.id === despuesDeHoy[0].id ? 'a mañana' : manana ? `al ${etiquetaPara(ctx, manana)}` : 'a mañana'
  const posibles = variantes.flatMap((v) => (v.quitados.size && [...v.quitados].some((id) => items.find((x) => x.stop.id === id)?.clase !== 'opcional') && manana ? [{ v, modo: 'manana' as const }, { v, modo: 'sobra' as const }] : [{ v, modo: 'manana' as const }]))
  return posibles.map(({ v, modo }, k): Propuesta => {
    const sim = cabe(items, cur0, actual, v.quitados, ctx.enCoche, base).sim
    const ops: Op[] = []
    const destinos: DestinoRetraso[] = []
    let trabajoHoy = day
    let trabajoManana = manana
    const quitadas: Propuesta['quitadas'] = []
    for (const id of [...v.quitados].sort((x, y) => ORDEN_DE_QUITAR.indexOf((items.find((q) => q.stop.id === x) as Item).clase) - ORDEN_DE_QUITAR.indexOf((items.find((q) => q.stop.id === y) as Item).clase))) {
      const it = items.find((x) => x.stop.id === id) as Item
      let destino: DestinoRetraso['destino'] = 'sobra'
      let opsDe: Op[] = []
      if (it.clase !== 'opcional' && modo === 'manana' && manana && diaAdmite(trabajoManana)) {
        const c = colocarEnDia(trabajoManana as DayPlan, it.stop, ctx, { permitirB: false })[0]
        const iy = trabajoHoy.stops.findIndex((s) => s.id === it.stop.id)
        opsDe = [{ t: 'sacar', dia: day.id, stop: it.stop, indice: iy, ...conMeal(trabajoHoy, iy, false) }, ...c.ops]
        destino = c.caso === 'a' ? 'manana' : 'manana_sobra'
        for (const op of opsDe) {
          trabajoHoy = op.dia === day.id ? aplicarOpADia(trabajoHoy, op, 'adelante') : trabajoHoy
          if (trabajoManana && op.dia === trabajoManana.id) trabajoManana = aplicarOpADia(trabajoManana, op, 'adelante')
        }
      } else {
        opsDe = [{ t: 'campo', dia: day.id, id: it.stop.id, antes: { time: it.stop.time, saltada: Boolean(it.stop.saltada) }, despues: { time: it.stop.time, saltada: true } }]
      }
      ops.push(...opsDe)
      destinos.push({ id, destino })
      quitadas.push({ id, nombre: nombre(it.stop), clase: it.clase, destino })
    }
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
    const aManana = quitadas.filter((q) => q.destino === 'manana').map((q) => q.nombre)
    const aSobraM = quitadas.filter((q) => q.destino === 'manana_sobra').map((q) => q.nombre)
    const partes: string[] = []
    if (soloOpc.length) partes.push(`quitamos ${unir(soloOpc)}`)
    if (aManana.length) partes.push(`${unir(aManana)} pasa${aManana.length > 1 ? 'n' : ''} ${aDia}`)
    if (aSobraM.length) partes.push(`${unir(aSobraM)} pasa${aSobraM.length > 1 ? 'n' : ''} a «Si te sobra tiempo» ${aDia.replace('a mañana', 'de mañana').replace(/^al /, 'del ')}`)
    if (aSobraHoy.length) partes.push(`${unir(aSobraHoy)} pasa${aSobraHoy.length > 1 ? 'n' : ''} a «Si te sobra tiempo»`)
    const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
    const titulo = partes.length ? cap(partes.join(' y ')) : 'Tus siguientes paradas se retrasan un poco'
    const detalle = v.pregunta ? 'Es de lo más importante: solo lo hacemos si tú quieres.' : soloOpc.length && !aManana.length && !aSobraM.length && !aSobraHoy.length ? 'Es opcional: queda en «Si te sobra tiempo».' : aSobraHoy.length && !aManana.length && !aSobraM.length ? 'La puedes recuperar de «Si te sobra tiempo» cuando quieras.' : partes.length ? 'Así llegas bien al resto de la tarde.' : 'Todo cabe: no quitamos nada.'
    const mantiene = mantieneDe(items, ctx)
    const pregunta = v.pregunta
    const cambiaTitulo = pregunta ? `Dejamos ${unir(quitadas.map((q) => q.nombre))}` : titulo
    return {
      id: `retraso-${p.minutos}-${k}`,
      tipo: 'retraso',
      intro: pregunta ? `Para no perder lo que tienes fijo tendríamos que dejar ${unir(quitadas.map((q) => q.nombre))}, que es de lo más importante. ¿Lo dejamos?` : INTRO_RETRASO,
      cambia: { titulo: cambiaTitulo, detalle },
      mantiene,
      ops,
      pregunta: pregunta || undefined,
      quitadas,
      corridas: sim.nuevas.size,
      intactas: items.filter((it) => it.fija).map((it) => it.stop.id),
    }
  })
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
}

/** Los sitios fuera de tu ruta que se pueden añadir: del catálogo de EXPLORAR (y los de «Cerca de ti» entran por `logros`), los de logro primero y luego los más cercanos. */
export function candidatosParaAnadir(p: { route: Route; lugares: { kind: string; name: string; coordinates: Coordinates; duration_min: number | null; fuera_de_lista?: boolean; solo_entradas?: boolean }[]; desde: Coordinates | null; logros: Set<string>; enCoche: boolean; maxMetros?: number; limite?: number }): Candidato[] {
  const usados = new Set<string>()
  for (const d of p.route.days) for (const s of [...d.stops, ...(d.spareStops ?? [])]) usados.add(s.name.toLowerCase())
  const tope = p.maxMetros ?? (p.enCoche ? 25000 : 2500)
  const lista: Candidato[] = []
  for (const l of p.lugares) {
    if (l.kind !== 'place' || l.fuera_de_lista || l.solo_entradas || usados.has(l.name.toLowerCase()) || !hasRealCoordinates(l.coordinates)) continue
    const metros = p.desde && hasRealCoordinates(p.desde) ? haversineMeters(p.desde, l.coordinates) : 0
    if (metros > tope) continue
    lista.push({ nombre: l.name, coordinates: l.coordinates, duracionMin: l.duration_min ?? 45, metros, logro: p.logros.has(l.name) })
  }
  lista.sort((a, b) => Number(b.logro) - Number(a.logro) || a.metros - b.metros || a.nombre.localeCompare(b.nombre))
  return lista.slice(0, p.limite ?? 6)
}

export const stopDeCandidato = (c: Candidato, id?: string): Stop => ({
  id: id ?? `anadido-${c.nombre.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
  time: '',
  name: c.nombre,
  description: '',
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
