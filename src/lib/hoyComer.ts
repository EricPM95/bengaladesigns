import { hasRealCoordinates, haversineMeters } from './distanceMock'
import { numberedStopsOf } from './stopKind'
import { filasDelDia } from './hoyParada'
import {
  aHora,
  ancho,
  cabe,
  conMeal as _conMeal,
  itemsDe,
  mantieneDe,
  minDe,
  minimoAQuitar,
  nombre,
  simularBase,
  sube10,
  unir,
  viajeMin,
  ORDEN_DE_QUITAR,
  type Contexto,
  type Op,
  type Propuesta,
} from './hoyCambiarPlan'
import type { DestinationPlace } from './destinationPlacesApi'
import type { Coordinates, DayPlan, MealSlot, Route, Stop } from './types'

void _conMeal

/**
 * HOY2 (agente C, apartado 3: pantalla 24 «Quiero comer ahora» y Completa 4 «A la hora de comer»). Todo puro, sin React:
 *  · `horarioDeComer` lee el horario en texto de un restaurante (el nuestro: «Lun-Sáb 12:30-15:00, 19:00-23:00. Domingo cerrado.», «de martes a sábado de 13:00 a 18:00; cierra domingo y lunes») y dice si está ABIERTO AHORA;
 *  · `restaurantesAbiertos` saca los más cercanos que están abiertos (solo los que sabemos seguro que están abiertos; sin horario claro, no salen);
 *  · `proponerComerAhora` es la propuesta con el formato común (Cambia… / Se mantiene…): la comida pasa a ahora, en ese sitio, y el resto del día se recoloca por la prioridad de siempre (lo opcional, lo flexible,
 *    lo principal; lo imprescindible solo preguntando; lo fijo, nunca) con el cambio más pequeño;
 *  · `comidaActiva` dice cuándo toca la tarjeta «Hora de comer».
 */

const norm = (t: string): string =>
  t
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()

/** Domingo = 0 (como `getDay`). */
const DIAS: Record<string, number> = { domingo: 0, dom: 0, lunes: 1, lun: 1, martes: 2, mar: 2, miercoles: 3, mie: 3, jueves: 4, jue: 4, viernes: 5, vie: 5, sabado: 6, sab: 6 }
const TODOS = [0, 1, 2, 3, 4, 5, 6]

export type Ventanas = Map<number, [number, number][]>

const aMin = (h: string, m: string): number => Number(h) * 60 + Number(m)

/**
 * El horario de un restaurante por día de la semana (en minutos). null si el texto no dice horas claras («sin confirmar», «horario variable»): ese restaurante no se enseña como abierto.
 * La primera fuente manda (si el texto repite el horario de otra web, no se mezcla) y «cierra…» / «…cerrado» quita ese día.
 */
export function ventanasDeHorario(texto: string | null | undefined, cierraLosDias: number[] = []): Ventanas | null {
  const t = norm(texto ?? '')
  const abiertos: Ventanas = new Map()
  const cerrados = new Set<number>(cierraLosDias)
  const trozos = t.split(/\.\s+|;\s*|\.$/).filter(Boolean)
  const reItem = /(todos los dias|diario)|\b(lunes|lun|martes|mar|miercoles|mie|jueves|jue|viernes|vie|sabado|sab|domingo|dom)\b|(\d{1,2}):(\d{2})\s*(?:-|–|—|a|hasta)\s*(\d{1,2}):(\d{2})|\b(cierra\w*|cerrad\w*)/g
  let hayRango = false
  for (const trozo of trozos) {
    const grupos: { dias: number[]; rangos: [number, number][]; cierra: boolean }[] = []
    let g: { dias: number[]; rangos: [number, number][]; cierra: boolean } = { dias: [], rangos: [], cierra: false }
    let previo = -1
    let finPrevio = 0
    let hayCierraEnElTrozo = false
    for (const m of trozo.matchAll(reItem)) {
      const sep = trozo.slice(finPrevio, m.index)
      finPrevio = (m.index ?? 0) + m[0].length
      if (m[1]) {
        g.dias.push(...TODOS)
        previo = -1
      } else if (m[2]) {
        if (g.rangos.length > 0) {
          grupos.push(g)
          g = { dias: [], rangos: [], cierra: false }
          previo = -1
        }
        const d = DIAS[m[2]]
        if (previo >= 0 && /^\s*(-|–|—|a|al|hasta)\s*$/.test(sep)) {
          for (let x = previo; ; x = (x + 1) % 7) {
            if (!g.dias.includes(x)) g.dias.push(x)
            if (x === d) break
          }
        } else if (!g.dias.includes(d)) g.dias.push(d)
        previo = d
      } else if (m[3] != null) {
        const ini = aMin(m[3], m[4])
        let fin = aMin(m[5], m[6])
        if (fin <= ini) fin += 24 * 60
        g.rangos.push([ini, fin])
        hayRango = true
      } else if (m[7]) {
        g.cierra = true
        hayCierraEnElTrozo = true
      }
    }
    grupos.push(g)
    for (const gr of grupos) {
      const dias = gr.dias.length ? gr.dias : gr.rangos.length ? TODOS : []
      if (gr.rangos.length === 0 && gr.cierra) for (const d of dias) cerrados.add(d)
      else if (gr.rangos.length > 0) for (const d of dias) if (!abiertos.has(d) && !cerrados.has(d)) abiertos.set(d, gr.rangos)
    }
    void hayCierraEnElTrozo
  }
  if (!hayRango) return null
  for (const d of cerrados) abiertos.delete(d)
  return abiertos
}

const DIA_DE_NOMBRE: Record<string, number> = { domingo: 0, lunes: 1, martes: 2, miercoles: 3, jueves: 4, viernes: 5, sabado: 6 }

export interface EstadoDeHorario {
  /** true = abierto ahora (con 30 min por delante); false = cerrado seguro; null = no lo sabemos. */
  abierto: boolean | null
  /** Hasta qué minuto del día está abierto (si abierto). */
  cierraMin: number | null
}

/** ¿Está abierto un restaurante del catálogo `ahoraMin` (minutos del día) en la fecha `dateIso`? Lee su horario en texto y sus días de cierre (`hours_data`). */
export function horarioDeComer(r: Pick<DestinationPlace, 'schedule' | 'hours_data'>, dateIso: string, ahoraMin: number, margenMin = 30): EstadoDeHorario {
  const desconocido: EstadoDeHorario = { abierto: null, cierraMin: null }
  const dia = new Date(`${dateIso}T12:00:00Z`).getUTCDay()
  const hd = (r.hours_data ?? {}) as Record<string, unknown>
  const cierraOn = (Array.isArray(hd.closed_on) ? hd.closed_on : typeof hd.closed_on === 'string' ? hd.closed_on.split(',') : [])
    .map((x) => DIA_DE_NOMBRE[norm(String(x)).trim()])
    .filter((x): x is number => x != null)
  const fechas = (Array.isArray(hd.closed_dates) ? hd.closed_dates : []).map((x) => String(x))
  if (fechas.some((f) => f === dateIso || f === dateIso.slice(5))) return { abierto: false, cierraMin: null }
  if (cierraOn.includes(dia)) return { abierto: false, cierraMin: null }
  const v = ventanasDeHorario(r.schedule, cierraOn)
  if (!v) return desconocido
  const rangos = v.get(dia)
  if (!rangos) return { abierto: false, cierraMin: null }
  for (const [ini, fin] of rangos) if (ahoraMin >= ini && ahoraMin <= fin - margenMin) return { abierto: true, cierraMin: fin }
  return { abierto: false, cierraMin: null }
}

export interface RestauranteCerca {
  nombre: string
  coordinates: Coordinates
  metros: number
  minutos: number
  modo: 'coche' | 'pie'
  precio: string | null
  cocina: string | null
  direccion: string | null
  cierraMin: number | null
}

const cocinaCorta = (t: string | null | undefined): string | null => {
  const s = (t ?? '').replace(/\s*Precio sin confirmar\.?/i, '').trim()
  if (!s) return null
  return s.split(/[,;(.]/)[0].trim().slice(0, 40) || null
}

/** Los restaurantes ABIERTOS AHORA más cercanos (los nuestros: los del catálogo del destino, que son los mismos de «Cerca de ti › Comer»). Sin ubicación ni sitio de referencia, nada. */
export function restaurantesAbiertos(p: { restaurantes: DestinationPlace[]; origen: Coordinates | null; dateIso: string; ahoraMin: number; enCoche: boolean; limite?: number; maxMin?: number }): RestauranteCerca[] {
  const { origen } = p
  const tope = p.maxMin ?? (p.enCoche ? 30 : 20)
  const salida: RestauranteCerca[] = []
  for (const r of p.restaurantes) {
    if (r.kind !== 'restaurant' || !hasRealCoordinates(r.coordinates)) continue
    const h = horarioDeComer(r, p.dateIso, p.ahoraMin)
    if (h.abierto !== true) continue
    const metros = origen && hasRealCoordinates(origen) ? haversineMeters(origen, r.coordinates) : 0
    const minutos = viajeMin(origen ? { coordinates: origen } : null, { coordinates: r.coordinates }, p.enCoche)
    if (origen && minutos > tope) continue
    salida.push({ nombre: r.name, coordinates: r.coordinates, metros, minutos, modo: p.enCoche ? 'coche' : 'pie', precio: r.price_range ?? null, cocina: cocinaCorta(r.what_to_order), direccion: r.address ?? null, cierraMin: h.cierraMin })
  }
  salida.sort((a, b) => a.metros - b.metros || a.nombre.localeCompare(b.nombre))
  return salida.slice(0, p.limite ?? 5)
}

/* ------------------------------------------------------------------ */
/* ¿Toca comer?                                                         */
/* ------------------------------------------------------------------ */

/** La comida (o la cena) que toca ahora: es la que está justo antes de la siguiente parada en «Tu día» y su franja ya ha empezado (hasta el fin de su franja o dos horas). */
export function comidaActiva(day: DayPlan, siguiente: Stop | null, ahoraMin: number): MealSlot | null {
  if (!siguiente) return null
  const vigentes = numberedStopsOf(day).filter((s) => !s.saltada)
  const filas = filasDelDia(day, vigentes)
  const i = filas.findIndex((f) => f.tipo === 'parada' && f.stop.id === siguiente.id)
  if (i <= 0) return null
  let k = i - 1
  while (k >= 0 && filas[k].tipo === 'noche') k--
  const f = filas[k]
  if (!f || f.tipo !== 'comida') return null
  const m = f.meal
  if (m.mealTime !== 'lunch' && m.mealTime !== 'dinner') return null
  const ini = minDe(m.time)
  if (ini == null) return null
  const fin = minDe(m.windowEnd) ?? ini + 120
  return ahoraMin >= ini - 10 && ahoraMin <= Math.max(fin, ini + 120) ? m : null
}

/** La comida que se mueve a ahora: la de la comida hasta las 17:30, después la cena. */
export function comidaDeAhora(day: DayPlan, ahoraMin: number): MealSlot | null {
  const quiero = ahoraMin < 17 * 60 + 30 ? 'lunch' : 'dinner'
  return day.meals.find((m) => m.mealTime === quiero) ?? null
}

/* ------------------------------------------------------------------ */
/* La propuesta                                                         */
/* ------------------------------------------------------------------ */

/** Cuánto se tarda en comer (con la sobremesa), por dentro; nunca se enseña. */
export const MIN_DE_COMER = 60

export function proponerComerAhora(p: { route: Route; day: DayPlan; restaurante: Pick<RestauranteCerca, 'nombre' | 'coordinates'>; ctx: Contexto; ahoraMin: number; siguiente: Stop; desde: Coordinates | null }): Propuesta[] {
  const { day, ctx, siguiente, restaurante } = p
  const vigentes = numberedStopsOf(day).filter((s) => !s.saltada)
  const k = vigentes.findIndex((s) => s.id === siguiente.id)
  if (k < 0) return []
  const fijas = ctx.fijasDe(day)
  const restantes = vigentes.slice(k).filter((s) => !s.checkedInAt)
  const items = itemsDe(restantes, fijas, ctx.datos)
  const anterior = k > 0 ? vigentes[k - 1] : null
  const origenStop = p.desde ? ({ coordinates: p.desde } as Stop) : anterior
  const inicio = sube10(p.ahoraMin + viajeMin(origenStop, { coordinates: restaurante.coordinates }, ctx.enCoche))
  const fin = inicio + MIN_DE_COMER
  const pseudo = { coordinates: restaurante.coordinates } as Stop
  const base = simularBase(items, p.ahoraMin, origenStop as Stop | null, ctx.enCoche)
  const meal = comidaDeAhora(day, p.ahoraMin)
  const variantes: { quitados: Set<string>; pregunta: boolean }[] = []
  const vistas = new Set<string>()
  const meter = (q: Set<string> | null, pregunta = false) => {
    if (!q) return
    const clave = [...q].sort().join('|')
    if (vistas.has(clave)) return
    vistas.add(clave)
    variantes.push({ quitados: q, pregunta })
  }
  for (let hasta = 0; hasta < ORDEN_DE_QUITAR.length; hasta++) {
    meter(minimoAQuitar(items, fin, pseudo, ctx.enCoche, base, hasta, 'tarde'))
    meter(minimoAQuitar(items, fin, pseudo, ctx.enCoche, base, hasta, 'pronto'))
  }
  if (variantes.length === 0) meter(minimoAQuitar(items, fin, pseudo, ctx.enCoche, base, 3, 'tarde', [...ORDEN_DE_QUITAR, 'imprescindible']), true)
  const n = restaurante.nombre
  return variantes.map((v, i): Propuesta => {
    const sim = cabe(items, fin, pseudo, v.quitados, ctx.enCoche, base).sim
    const ops: Op[] = []
    if (meal) {
      const mealAfter = { ...(day.mealAfter ?? {}), [meal.mealTime]: k - 1 }
      ops.push({
        t: 'comida_sitio',
        dia: day.id,
        id: meal.id,
        antes: { time: meal.time, sitio: meal.chosenRestaurant ?? null, mealAfter: day.mealAfter },
        despues: { time: aHora(Math.floor(p.ahoraMin / 10) * 10, ancho({ time: meal.time })), sitio: { name: n, coordinates: restaurante.coordinates, zone: meal.chosenRestaurant?.zone ?? null }, mealAfter },
      })
    }
    const quitadas: Propuesta['quitadas'] = []
    for (const id of [...v.quitados].sort((x, y) => ORDEN_DE_QUITAR.indexOf((items.find((q) => q.stop.id === x)?.clase ?? 'principal') as never) - ORDEN_DE_QUITAR.indexOf((items.find((q) => q.stop.id === y)?.clase ?? 'principal') as never))) {
      const it = items.find((x) => x.stop.id === id)
      if (!it) continue
      ops.push({ t: 'campo', dia: day.id, id, antes: { time: it.stop.time, saltada: Boolean(it.stop.saltada) }, despues: { time: it.stop.time, saltada: true } })
      quitadas.push({ id, nombre: nombre(it.stop), clase: it.clase, destino: 'sobra' })
    }
    for (const [id, min] of sim.nuevas) {
      const s = day.stops.find((x) => x.id === id)
      if (!s || v.quitados.has(id)) continue
      ops.push({ t: 'campo', dia: day.id, id, antes: { time: s.time, saltada: Boolean(s.saltada) }, despues: { time: aHora(min, ancho(s)), saltada: Boolean(s.saltada) } })
    }
    const nombres = quitadas.map((q) => q.nombre)
    const pregunta = v.pregunta
    return {
      id: `comer-${restaurante.nombre}-${i}`,
      tipo: 'comer',
      intro: pregunta ? `Para comer ahora tendríamos que dejar ${unir(nombres)}, que es de lo más importante. ¿Lo dejamos?` : `Vas a comer en ${n}. Recolocamos el resto del día para que todo siga cabiendo.`,
      cambia: {
        titulo: nombres.length ? `La comida pasa a ahora, en ${n}, y ${unir(nombres)} pasa${nombres.length > 1 ? 'n' : ''} a «Si te sobra tiempo»` : `La comida pasa a ahora, en ${n}`,
        detalle: pregunta ? 'Es de lo más importante: solo lo hacemos si tú quieres.' : nombres.length ? 'Así llegas bien al resto del día. Lo puedes recuperar cuando quieras.' : sim.nuevas.size ? 'Lo que queda se recoloca un poco, después de comer.' : 'Lo que queda del día sigue como estaba.',
      },
      mantiene: mantieneDe(items, ctx),
      ops,
      pregunta: pregunta || undefined,
      quitadas,
      corridas: sim.nuevas.size,
      intactas: items.filter((it) => it.fija).map((it) => it.stop.id),
    }
  })
}
