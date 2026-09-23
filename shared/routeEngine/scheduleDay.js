/**
 * El PROGRAMADOR del motor v3: dado lo que va en un día, decide el orden y la hora de cada cosa.
 *
 * Por qué se reescribe así (diagnóstico del 2026-09-23): el constructor anterior ordenaba por
 * geografía, ponía horas después, y lo que no le cabía lo descartaba en silencio con un `continue`.
 * Medido sobre 112 viajes: 488 paradas perdidas por el camino, 97 grupos rotos, 73 minutos muertos
 * por día. Aquí no hay "ordenar y luego ver si cabe": cada orden candidato se SIMULA entero con el
 * reloj real (trayectos de la matriz, redondeo, encadenado, horarios, comida y cena) y se elige el
 * que menos tiempo pierde. Lo que no cabe de ninguna manera sale con su motivo.
 *
 * La comida es un elemento más de la secuencia, no un hueco fijo: el motor decide él si le conviene
 * meter una parada corta antes de comer para no llegar a las 12:15 y esperar 45 minutos. Es la
 * "planificación proactiva" de las comidas sin escribir una regla para ella.
 *
 * Módulo PURO: sin Node, sin red, sin reloj. Lo usa el servidor al generar y lo usará Modo Hoy para
 * reajustar en directo (hora y posición de inicio + lo que queda + si ya se ha comido).
 *
 * Reglas de tiempo (decisiones del 2026-09-23):
 *   - Las horas caen en :00 o :30 por la mañana y en cuartos de hora por la tarde (después de
 *     comer), redondeando hacia arriba.
 *   - Encadenado manda sobre redondeo: dentro de un grupo, o a <= 3 min a pie, se entra al llegar,
 *     redondeando solo a 5 min (15:07 -> 15:10).
 *   - La comida puede caer DENTRO de un grupo, entre dos de sus lugares, si solo así entra en su
 *     ventana. Nunca entre un par inseparable (`inseparableWithNext`: plaza + monumento en el mismo
 *     sitio físico, marcados en el JSON del destino). El grupo sigue siendo un día y un orden.
 *   - El extra de duración del ritmo (+15 en tranquilo) es por VISITA: un grupo lo suma una vez.
 *   - Un lugar cubierto sin horario legible se supone abierto de 09:00 a 17:00.
 *   - Un imprescindible nunca se cae por las reglas del ritmo: si no cabe, el día pasa a
 *     `fallbackMode` (empieza antes, sin el extra) y el resultado lo dice en `modeFallback`.
 *   - Ninguna visita empieza antes de que abra, durante un cierre, después de `last_entry` (si el
 *     lugar lo trae) ni antes de `not_before`; ninguna se queda sin tiempo antes de su cierre.
 *   - El Free Tour tiene hora fija (la de su JSON): lo que va antes tiene que llegar a tiempo.
 *   - Las visitas largas (>= 180 min) empiezan por la mañana, salvo en viajes de un día.
 *   - Comida y cena en su ventana; el día acaba con la cena.
 *
 * La tarde va HACIA la cena (paso 4): la cena tiene un sitio (`dinnerPoint`, el barrio donde se
 * cena) y el paseo hasta ella cuenta, así que el orden termina cerca del restaurante. La tarde vacía
 * antes de cenar (`tailPenalty`) es otra cosa y va APARTE del coste de ordenar: sirve para que el
 * repartidor sepa que añadir una parada al final abarata el día, pero no puede mover el orden. Si
 * contara al ordenar, el motor "llenaba" la tarde retrasando paradas —volviendo al Borgo Pio después
 * del Puente Sant'Angelo— en vez de añadiendo algo.
 *
 * Preferencias de hora (cuestan, no prohíben):
 *   - `preferMorning`: lo que el reparto curado pone de mañana, antes de comer.
 *   - `preferEarly`: `best_time` "primera hora" (Coliseo, Vaticano, Trevi), cuanto antes mejor.
 *   - `latest_end`: tiene que haber acabado a esa hora (Trevi a las 08:00, antes del Free Tour).
 *   - `related_to`: las parejas naturales del JSON, seguidas si caen el mismo día.
 *
 * Por delante del monumento, SIEMPRE (regla, no preferencia): la plaza, el puente o el parque que
 * lo contiene o da acceso (`approach_to` en el JSON: Plaza de San Pedro → Basílica, Puente
 * Sant'Angelo → Castillo, Parque de Villa Borghese → Galería Borghese). Si caen el mismo día, el
 * monumento no puede ir antes; se acepta el pequeño rodeo que eso cueste.
 *
 * Lo que está DENTRO de otro (`contained_in`) va justo detrás de él y cuenta como una visita; los
 * VECINOS (`neighbor_of`) van seguidos si caen el mismo día (ver `relationBroken`). Qué día le toca a
 * cada uno lo decide el repartidor.
 *
 * La tarde se ordena al final por lo que MENOS CAMINA (`bestAfternoon`), probando todos los órdenes;
 * el relleno que obliga a volver atrás se quita (`pruneAfternoon`).
 *
 * Las paradas "de paso" (`passBy`: repasar por fuera un imprescindible ya visto otro día, camino de
 * la cena) van SIEMPRE al final del día, detrás de todo lo nuevo. Es una regla del orden, no una
 * preferencia: si la mejora del orden pudiera moverlas, "de camino a cenar" acabaría a mediodía.
 */

import { roundUpToFive, roundUpToQuarter, roundUpToSlot, toMinutes } from './time.js'
import { earliestVisitStart, effectiveSchedule, nextOpenMinutes } from './openingHours.js'
import { latestDinnerStart } from './modes.js'

/**
 * Prioridades: cuanto más bajo, más manda. Solo pool y nivel 1 pueden desplazar a otros.
 *
 * El nivel 1 tiene dos escalones (el `tier` del JSON del destino): las JOYAS y el resto de
 * IMPRESCINDIBLES. Entran todos siempre; el escalón solo decide qué va primero cuando no cabe
 * todo (viajes cortos): una joya puede desplazar a un imprescindible, nunca al revés, y lo que no
 * quepa va a "No te dio tiempo". Todo lo que compara con `<= ESSENTIAL` incluye a las joyas.
 */
export const PRIORITY = { POOL: 0, JOYA: 1, ESSENTIAL: 1.5, THEME: 2, FILLER: 3 }

/** Penalización por cada pareja de unidades curadas que se visita al revés que el reparto a mano.
    Pequeña a propósito: el orden curado es buen punto de partida (medido), no una cárcel. */
const CURATED_INVERSION_PENALTY = 10
const MAX_IMPROVEMENT_PASSES = 30
/** Piezas de tarde hasta las que se prueban TODOS los órdenes (8! = 40.320 simulaciones). Medido: ninguna tarde pasa de 8. */
const MAX_AFTERNOON_PIECES = 8
/** Lo curado de mañana que acaba después de comer. Alto: el Coliseo a las 15:30 es otro viaje. */
const MORNING_AFTER_LUNCH_PENALTY = 90
/** Cada minuto que una visita de "primera hora" se retrasa respecto al inicio del día. */
const EARLY_DELAY_PENALTY_PER_MINUTE = 0.5
/** Cada minuto muerto antes de cenar por encima de la tolerancia del ritmo. */
const DINNER_IDLE_PENALTY_PER_MINUTE = 1
/**
 * Una pareja natural (`related_to` del JSON: Castillo ↔ Puente Sant'Angelo, Basílica ↔ Cúpula) que
 * cae el mismo día pero con otra cosa en medio. Preferencia, no regla: a diferencia de un grupo, se
 * puede separar si el día lo necesita.
 */
const RELATED_APART_PENALTY = 30

const LUNCH = { kind: 'lunch' }

/**
 * @typedef {object} SchedulePlace
 * @property {string} name
 * @property {[number, number]} coordinates  [lat, lng]
 * @property {number} [duration_minutes]
 * @property {string} [schedule]      texto libre del JSON
 * @property {string} [last_entry]    "HH:MM", opcional
 * @property {string} [not_before]    "HH:MM", opcional
 * @property {boolean} [isFreeTour]
 * @property {string} [fixed_start]   "HH:MM": la visita empieza exactamente a esta hora
 * @property {boolean} [inseparableWithNext]  este lugar y el siguiente del grupo son el mismo sitio
 *           físico: ni comida ni nada entre ellos
 * @property {string} [type]          'exterior' | 'interior' — decide el horario por defecto
 * @property {string} [latest_end]    "HH:MM": la visita tiene que haber acabado a esta hora
 * @property {[number, number]} [end_coordinates]  dónde se acaba (un recorrido a pie no acaba donde empieza)
 * @property {string} [contained_in]  está dentro de este otro lugar: va justo detrás, como una visita
 * @property {string[]} [neighbor_of] vecino pegado de estos lugares: si caen el mismo día, seguidos
 *
 * @typedef {object} ScheduleUnit
 * @property {string} id
 * @property {SchedulePlace[]} places   en su orden de visita (un grupo nunca se reordena)
 * @property {number} priority          PRIORITY.*
 * @property {number|null} [curatedIndex]  posición en el reparto curado, si viene de él
 * @property {boolean} [isLong]
 * @property {number|null} [poolIndex]  orden en que el viajero lo eligió: si no cabe todo, entra
 *           antes lo que eligió antes
 * @property {boolean} [preferMorning]  el reparto curado lo pone de mañana: antes de comer
 * @property {boolean} [preferEarly]    `best_time` "primera hora": cuanto antes mejor
 *
 * @param {object} input
 * @param {ScheduleUnit[]} input.units
 * @param {object} input.mode                  MODES_V3.*
 * @param {{leg: Function}} input.travel       createTravelTimes(matriz)
 * @param {{minutes: number, coordinates?: [number, number]|null}} input.start
 * @param {{lunch: boolean, dinner: boolean}} [input.pendingMeals]  qué comidas quedan por hacer
 * @param {boolean} [input.longVisitsAnytime]  viaje de UN día: no hay otra mañana a la que mandar la
 *        segunda visita larga, así que puede ir por la tarde (Prompt 9, Parte 10)
 * @param {object} [input.fallbackMode]  el ritmo al que se pasa ESE día si un imprescindible no cabe
 *        con el suyo (tranquilo -> empieza antes y sin el extra de duración)
 * @param {[number, number]|null} [input.dinnerPoint]  dónde se cena; null = cerca de la última visita
 */
export function scheduleDay(input) {
  const first = runSchedule(input)
  const lostEssentials = (result) => result.unscheduled.filter((item) => item.priority <= PRIORITY.ESSENTIAL).length
  if (!input.fallbackMode || lostEssentials(first) === 0) return first

  // Un imprescindible no se cae por el ritmo: se prueba el día con el horario normal. Solo se acepta
  // si recupera algo sin perder otra cosa igual de importante.
  const { mode, fallbackMode, start } = input
  const fallbackStart = start.minutes === mode.dayStart ? Math.min(start.minutes, fallbackMode.dayStart) : start.minutes
  const second = runSchedule({ ...input, mode: fallbackMode, start: { ...start, minutes: fallbackStart } })
  if (lostEssentials(second) >= lostEssentials(first)) return first

  const recovered = first.unscheduled
    .filter((item) => item.priority <= PRIORITY.ESSENTIAL && !second.unscheduled.some((other) => other.unitId === item.unitId))
    .map((item) => item.unitId)
  return { ...second, modeFallback: { recoveredUnitIds: recovered, startedAt: fallbackStart } }
}

function runSchedule({ units, mode, travel, start, pendingMeals = { lunch: true, dinner: true }, longVisitsAnytime = false, dinnerPoint = null }) {
  const ctx = { mode, travel, start, pendingMeals, longVisitsAnytime, dinnerPoint, dinnerLatest: latestDinnerStart(mode) }

  let sequence = pendingMeals.lunch ? [LUNCH] : []
  const unscheduled = []

  const queue = [...units].sort(
    (a, b) =>
      a.priority - b.priority ||
      (a.poolIndex ?? Infinity) - (b.poolIndex ?? Infinity) ||
      (a.curatedIndex ?? Infinity) - (b.curatedIndex ?? Infinity) ||
      unitMinutes(b) - unitMinutes(a) ||
      a.id.localeCompare(b.id, 'es'),
  )

  for (const unit of queue) {
    const inserted = bestInsertion(sequence, unit, ctx)
    if (inserted) {
      sequence = inserted
      continue
    }
    const displaced = insertByDisplacing(sequence, unit, ctx)
    if (displaced) {
      sequence = displaced.sequence
      for (const victim of displaced.victims) {
        // Lo desplazado intenta volver a entrar en otro hueco antes de darse por perdido.
        const back = bestInsertion(sequence, victim, ctx)
        if (back) sequence = back
        else unscheduled.push({ unit: victim, reason: 'displaced', detail: `desplazado por ${unit.id}` })
      }
      continue
    }
    unscheduled.push({ unit, ...diagnose(unit, ctx) })
  }

  sequence = improve(sequence, ctx)

  // Mover las piezas puede haber abierto hueco para algo que antes no cabía.
  for (const item of [...unscheduled]) {
    const inserted = bestInsertion(sequence, item.unit, ctx)
    if (inserted) {
      sequence = improve(inserted, ctx)
      unscheduled.splice(unscheduled.indexOf(item), 1)
    }
  }
  sequence = bestAfternoon(sequence, ctx).sequence

  const result = simulate(sequence, ctx)
  return {
    visits: result.visits,
    meals: result.meals,
    unscheduled: unscheduled.map(({ unit, reason, detail }) => ({ unitId: unit.id, places: unit.places.map((p) => p.name), priority: unit.priority, reason, detail })),
    walkMinutes: result.walk,
    idleMinutes: result.idle,
    idleBeforeDinner: result.idleBeforeDinner,
  }
}

/**
 * Horas para un orden FIJO: las rutas curadas a mano de 1 y 1,5 días (short_trips del destino).
 * Ahí el destino ya decidió qué se ve y en qué orden; el programador no reordena nada, solo pone
 * horas y comprueba horarios, últimas entradas y cierres con las mismas reglas que siempre.
 *
 * Si algo no cabe, se cae lo de menos prioridad (\`dropRank\` más alto) y vuelve con su motivo — lo
 * que no entra va a "No te dio tiempo", nunca desaparece en silencio.
 *
 * @param {object} input
 * @param {(ScheduleUnit & {slot: 'manana'|'tarde', dropRank: number})[]} input.units  en su orden
 * @param {object} input.mode
 * @param {{leg: Function}} input.travel
 * @param {{minutes: number, coordinates?: [number, number]|null}} input.start
 * @param {{lunch: boolean, dinner: boolean}} [input.pendingMeals]
 * @param {[number, number]|null} [input.dinnerPoint]
 * @param {boolean} [input.visitsEndByLunch]  día con solo mañana (el de la salida): nada después de comer
 */
export function scheduleFixedOrder({ units, mode, travel, start, pendingMeals = { lunch: true, dinner: true }, dinnerPoint = null, visitsEndByLunch = false }) {
  const ctx = { mode, travel, start, pendingMeals, longVisitsAnytime: true, dinnerPoint, visitsEndByLunch, dinnerLatest: latestDinnerStart(mode) }
  let kept = [...units]
  const dropped = []
  // La comida va detrás de lo último de la mañana (o al principio si la mañana se ha quedado vacía).
  const sequenceOf = (list) => {
    if (!pendingMeals.lunch) return [...list]
    const lastMorning = list.map((unit) => unit.slot).lastIndexOf('manana')
    return [...list.slice(0, lastMorning + 1), LUNCH, ...list.slice(lastMorning + 1)]
  }
  for (;;) {
    const result = simulate(sequenceOf(kept), ctx)
    if (result.ok || kept.length === 0) {
      return {
        visits: result.visits ?? [],
        meals: result.meals ?? [],
        dropped,
        walkMinutes: result.walk ?? 0,
        idleMinutes: result.idle ?? 0,
        idleBeforeDinner: result.idleBeforeDinner ?? null,
      }
    }
    // Se cae lo que falla si no es lo más importante de su franja; si no, lo menos importante de la
    // franja donde está el problema (la comida es de la mañana, la cena de la tarde).
    const failing = kept.find((unit) => unit.id === result.unitId)
    const slot = failing?.slot ?? (result.reason === 'lunch_out_of_window' ? 'manana' : 'tarde')
    const inSlot = kept.filter((unit) => unit.slot === slot)
    const pool = inSlot.length > 0 ? inSlot : kept
    const leastImportant = pool.reduce((worst, unit) => (unit.dropRank > worst.dropRank ? unit : worst), pool[0])
    const victim = failing && failing.dropRank >= leastImportant.dropRank ? failing : leastImportant
    // Un grupo que no cabe entero pierde su final, no el grupo: si no da tiempo a la Basílica y la
    // Plaza, caen ellas, no los Museos Vaticanos. Lo que se recorta es lo que no es joya, y nunca
    // se separa un par inseparable (si el último lo es del anterior, caen los dos).
    const tail = trimmableTail(victim)
    if (tail > 0) {
      const removed = victim.places.slice(victim.places.length - tail)
      const trimmed = { ...victim, places: victim.places.slice(0, victim.places.length - tail) }
      dropped.push({ unit: { ...victim, places: removed }, reason: result.reason })
      kept = kept.map((unit) => (unit === victim ? trimmed : unit))
      continue
    }
    dropped.push({ unit: victim, reason: result.reason })
    kept = kept.filter((unit) => unit !== victim)
  }
}

/** Cuántos lugares del final de un grupo se pueden quitar dejando el resto: 0 si ninguno. */
function trimmableTail(unit) {
  if (unit.places.length < 2) return 0
  let tail = 1
  // Un par inseparable se va entero.
  while (tail < unit.places.length && unit.places[unit.places.length - tail - 1].inseparableWithNext) tail++
  const removed = unit.places.slice(unit.places.length - tail)
  if (tail >= unit.places.length || removed.some((place) => place.tier === 'joya')) return 0
  return tail
}

/**
 * Un día ABIERTO, para el repartidor: se le prueban unidades de una en una sobre el orden que ya
 * tiene, sin reprogramar todo en cada pregunta (el repartidor pregunta cientos de veces por viaje).
 *
 * Mismas reglas que `scheduleDay`, porque usa la misma simulación: lo que `tryAdd` acepta, el día
 * final lo contiene. Esa es toda la gracia — el reparto y el programador ya no pueden divergir.
 *
 * @param {object} input  lo mismo que scheduleDay, sin `units`
 */
export function openDay(input) {
  let dinnerPoint = input.dinnerPoint ?? null
  const makeCtx = (mode, start) => ({
    dinnerPoint,
    mode,
    travel: input.travel,
    start,
    pendingMeals: input.pendingMeals ?? { lunch: true, dinner: true },
    longVisitsAnytime: input.longVisitsAnytime ?? false,
    dinnerLatest: latestDinnerStart(mode),
  })
  let ctx = makeCtx(input.mode, input.start)
  let sequence = ctx.pendingMeals.lunch ? [LUNCH] : []
  let currentCost = simulate(sequence, ctx).cost ?? 0
  let modeFallback = null

  const units = () => sequence.filter((element) => element !== LUNCH)

  return {
    units,
    get modeFallback() {
      return modeFallback
    },

    /**
     * Dónde entraría la unidad, cuánto cambia el coste del día y cuántos minutos de paseo AÑADE.
     * null si no cabe (o si solo cabe añadiendo más paseo que `maxAddedWalk`).
     *
     * La posición se elige como al ordenar (menos paseo y espera) pero SOLO entre las que no pasan
     * del tope de paseo: sin el tope, la Plaza Colonna se metía en un hueco de la mañana a 33 minutos
     * de desvío y se descartaba por desvío, cuando al final de la tarde añadía 4. La tarde vacía
     * antes de cenar NO elige la posición —si la eligiera, el motor colocaba la parada tarde abriendo
     * un hueco de 80 minutos a media tarde: movía el tiempo muerto de sitio en vez de quitarlo—, solo
     * entra en \`addedCost\`, que es lo que el repartidor usa para decidir si la parada compensa.
     */
    tryAdd(unit, { maxAddedWalk = Infinity } = {}) {
      const before = simulate(sequence, ctx)
      let best = null
      for (let i = 0; i <= sequence.length; i++) {
        const candidate = [...sequence.slice(0, i), unit, ...sequence.slice(i)]
        const result = simulate(candidate, ctx)
        if (!result.ok) continue
        const addedWalk = result.walk - (before.walk ?? 0)
        if (addedWalk > maxAddedWalk) continue
        if (!best || result.cost < best.result.cost) best = { sequence: candidate, result, addedWalk }
      }
      if (!best) return null
      // Para el repartidor, una parada que llena la tarde vacía antes de cenar abarata el día.
      const addedCost = best.result.cost + best.result.tailPenalty - (before.cost + (before.tailPenalty ?? 0))
      return { sequence: best.sequence, addedCost, addedWalk: best.addedWalk }
    },

    /** Mete la unidad (lo que devolvió `tryAdd`, o la unidad a secas). false si no cabe. */
    add(unitOrTry) {
      const attempt = unitOrTry.sequence ? unitOrTry : this.tryAdd(unitOrTry)
      if (!attempt) return false
      sequence = attempt.sequence
      currentCost = simulate(sequence, ctx).cost
      return true
    },

    /** Saca una unidad. Quitar nunca rompe un día que ya era posible. */
    remove(unitId) {
      sequence = sequence.filter((element) => element === LUNCH || element.id !== unitId)
      currentCost = simulate(sequence, ctx).cost ?? 0
    },

    /**
     * El plan B de un imprescindible que no cabe con el ritmo: el día entero pasa a `fallbackMode`
     * (empieza antes, sin el extra de duración) SOLO si con él cabe todo lo que ya había más la
     * unidad nueva. true si el día ha cambiado de modo.
     */
    tryWithFallback(unit, fallbackMode) {
      if (!fallbackMode || modeFallback) return false
      const start = { ...input.start, minutes: input.start.minutes === input.mode.dayStart ? Math.min(input.start.minutes, fallbackMode.dayStart) : input.start.minutes }
      const altCtx = makeCtx(fallbackMode, start)
      let alt = altCtx.pendingMeals.lunch ? [LUNCH] : []
      const queue = [...units(), unit].sort((a, b) => a.priority - b.priority || unitMinutes(b) - unitMinutes(a) || a.id.localeCompare(b.id, 'es'))
      for (const item of queue) {
        alt = bestInsertion(alt, item, altCtx)
        if (!alt) return false
      }
      ctx = altCtx
      sequence = alt
      currentCost = simulate(sequence, ctx).cost
      modeFallback = { recoveredUnitIds: [unit.id], startedAt: start.minutes }
      return true
    },

    /**
     * Dónde se cena. false (y no cambia nada) si con ese paseo hasta la cena el día deja de caber.
     */
    setDinnerPoint(coordinates) {
      const previous = dinnerPoint
      dinnerPoint = coordinates
      const next = { ...ctx, dinnerPoint }
      const result = simulate(sequence, next)
      if (!result.ok) {
        dinnerPoint = previous
        return false
      }
      ctx = next
      currentCost = result.cost
      return true
    },

    /** Cómo quedaría el día con esta secuencia (visitas y comidas), sin aplicarla. */
    preview(candidateSequence) {
      const result = simulate(candidateSequence, ctx)
      return { visits: result.visits ?? [], meals: result.meals ?? [] }
    },

    /** Las visitas tal como están ahora (sin mejorar el orden). */
    visits() {
      return simulate(sequence, ctx).visits ?? []
    },

    /** Minutos libres antes de cenar, ya descontado el paseo hasta la cena (null sin cena). */
    idleBeforeDinner() {
      return simulate(sequence, ctx).idleBeforeDinner ?? null
    },

    /** Dónde acaba ahora mismo la última visita del día (null si aún no tiene ninguna). */
    endCoordinates() {
      const visits = simulate(sequence, ctx).visits ?? []
      const last = visits[visits.length - 1]
      return last ? (last.place.end_coordinates ?? last.place.coordinates) : null
    },

    /** Foto exacta del día, para deshacer un intento sin depender de volver a encajarlo igual. */
    snapshot() {
      return { ctx, sequence, currentCost, modeFallback, dinnerPoint }
    },
    restore(snap) {
      ;({ ctx, sequence, currentCost, modeFallback, dinnerPoint } = snap)
    },

    /**
     * Quita el relleno de tarde que obliga a volver atrás (decisión del 2026-09-23): si el mejor orden
     * CON él camina más de `maxExtraWalk` minutos que el mejor orden SIN él, fuera. Un relleno nunca
     * justifica un zigzag. De uno en uno, el peor primero, hasta que no quede ninguno así.
     * @param {(unit: object) => boolean} isRemovable  qué es relleno (lo decide el repartidor)
     * @returns {object[]} las unidades quitadas
     */
    pruneAfternoon(isRemovable, maxExtraWalk) {
      const removed = []
      let base = bestAfternoon(improve(sequence, ctx), ctx)
      for (;;) {
        const afternoon = base.sequence.slice(base.sequence.indexOf(LUNCH) + 1)
        let worst = null
        for (const unit of afternoon.filter((element) => element !== LUNCH && isRemovable(element))) {
          const without = bestAfternoon(base.sequence.filter((element) => element !== unit), ctx)
          if (!without.result.ok) continue
          const extra = base.result.walk - without.result.walk
          if (extra > maxExtraWalk && (!worst || extra > worst.extra)) worst = { unit, extra, without }
        }
        if (!worst) break
        removed.push(worst.unit)
        base = worst.without
      }
      sequence = base.sequence
      currentCost = base.result.cost
      return removed
    },

    /** El día terminado: orden mejorado y horas puestas. */
    finish() {
      sequence = bestAfternoon(improve(sequence, ctx), ctx).sequence
      const result = simulate(sequence, ctx)
      return {
        visits: result.visits,
        meals: result.meals,
        unscheduled: [],
        walkMinutes: result.walk,
        idleMinutes: result.idle,
        idleBeforeDinner: result.idleBeforeDinner,
        modeFallback,
      }
    },
  }
}

function unitMinutes(unit) {
  return unit.places.reduce((sum, place) => sum + (place.duration_minutes ?? 30), 0)
}

// ── Simulación: el día entero, con el reloj real, para UNA secuencia ─────────────────────────

/**
 * Recorre la secuencia poniendo hora a cada cosa. Devuelve `ok: false` con el motivo en cuanto algo
 * es imposible — es lo que permite a la búsqueda descartar órdenes sin reglas aparte.
 */
function simulate(sequence, ctx) {
  const { mode, travel, start, pendingMeals, longVisitsAnytime, dinnerLatest, dinnerPoint } = ctx
  const [lunchOpen, lunchClose] = mode.lunchWindow
  const visitLimit = pendingMeals.dinner ? dinnerLatest : mode.dayEndWithDinner

  let cursor = start.minutes
  let position = start.coordinates ?? null
  let lunchDone = !pendingMeals.lunch
  let afterMeal = false
  let seenVisit = false
  let walk = 0
  let meters = 0
  let idle = 0
  let preference = 0 // penalizaciones de hora (ver preferMorning / preferEarly)
  const visits = []
  // Monumento -> accesos (plaza, puente, parque) que van en este mismo día y tienen que ir antes.
  const approachesOf = new Map()
  for (const element of sequence) {
    if (element === LUNCH) continue
    for (const place of element.places) {
      for (const monument of place.approach_to ?? []) {
        if (!approachesOf.has(monument)) approachesOf.set(monument, [])
        approachesOf.get(monument).push(place.name)
      }
    }
  }
  const meals = []
  /** Índice de la primera visita después de comer (la comida va entre esa y la anterior). */
  let lunchBeforeVisit = null

  /** Come ahora. false si ya no entra en la ventana. */
  const takeLunch = () => {
    const at = Math.max(roundUpToSlot(cursor), lunchOpen)
    if (at > lunchClose) return false
    idle += at - cursor
    meals.push({ type: 'lunch', start: at, end: at + mode.mealMinutes, coordinates: position })
    lunchBeforeVisit = visits.length
    cursor = at + mode.mealMinutes
    lunchDone = true
    afterMeal = true
    return true
  }

  for (const [elementIndex, element] of sequence.entries()) {
    if (element === LUNCH) {
      if (lunchDone) continue // ya se comió dentro del grupo anterior
      if (!takeLunch()) return { ok: false, reason: 'lunch_out_of_window' }
      continue
    }

    const unit = element
    if (unit.isLong && !longVisitsAnytime && pendingMeals.lunch && lunchDone) return { ok: false, reason: 'long_visit_after_lunch', unitId: unit.id }
    // Nada nuevo después de una parada "de paso": esas van camino de la cena, al final.
    if (!unit.places.some((place) => place.passBy) && visits.some((visit) => visit.place.passBy)) return { ok: false, reason: 'pass_by_not_last', unitId: unit.id }
    const unitStartsAt = visits.length
    // La comida puede meterse dentro de este grupo solo si es lo que viene justo después de él.
    const lunchComesNext = !lunchDone && sequence[elementIndex + 1] === LUNCH

    for (const [index, place] of unit.places.entries()) {
      if (ctx.visitsEndByLunch && lunchDone) return { ok: false, reason: 'after_lunch_on_departure', unitId: unit.id }
      // ¿Seguir con el grupo hasta el próximo punto de corte deja la comida fuera de su ventana?
      // Entonces se come aquí, en el último corte que aún llega. Nunca entre un par inseparable.
      if (index > 0 && lunchComesNext && !lunchDone && !unit.places[index - 1].inseparableWithNext) {
        if (roundUpToSlot(segmentEnd(unit, index, cursor, position, travel, mode)) > lunchClose && !takeLunch()) {
          return { ok: false, reason: 'lunch_out_of_window' }
        }
        if (ctx.visitsEndByLunch && lunchDone) return { ok: false, reason: 'after_lunch_on_departure', unitId: unit.id }
      }

      const leg = position ? travel.leg(position, place.coordinates) : null
      const walkMinutes = leg?.minutes ?? 0
      const arrive = cursor + walkMinutes
      // Encadenado: el siguiente miembro de un grupo, o un sitio a <= 3 min; nunca al volver de comer.
      // Lo que está DENTRO de otro (`contained_in`: el Elefantino en la plaza de la Minerva) va con su
      // contenedor como una sola visita, aunque haya 4 minutos andando.
      const previous = visits[visits.length - 1]
      const withContainer = Boolean(place.contained_in && previous && (previous.place.name === place.contained_in || previous.place.contained_in === place.contained_in))
      const chained = !afterMeal && (index > 0 || withContainer || (seenVisit && position !== null && walkMinutes <= mode.chainMaxWalkMinutes))
      // Por la tarde, cuartos de hora; por la mañana, :00/:30.
      const roundSlot = lunchDone ? roundUpToQuarter : roundUpToSlot

      let at = chained ? roundUpToFive(arrive) : roundSlot(arrive)
      if (place.fixed_start) {
        const fixed = toMinutes(place.fixed_start)
        if (arrive > fixed) return { ok: false, reason: 'fixed_start_missed', unitId: unit.id }
        at = fixed
      }
      if (place.not_before) at = Math.max(at, roundSlot(toMinutes(place.not_before)))

      const duration = visitMinutes(unit, index, mode)
      // Abierto de principio a fin, en el primer tramo donde quepa entera (con cierre de mediodía,
      // se espera a la tarde en vez de descartarla).
      const schedule = effectiveSchedule(place)
      const fitAt = earliestVisitStart(schedule, at, duration, roundSlot)
      if (fitAt === null) {
        return { ok: false, reason: nextOpenMinutes(schedule, at) === null ? 'closed' : 'closes_during_visit', unitId: unit.id }
      }
      if (place.fixed_start && fitAt !== at) return { ok: false, reason: 'fixed_start_missed', unitId: unit.id }
      at = fitAt
      if (place.last_entry && at > toMinutes(place.last_entry)) return { ok: false, reason: 'after_last_entry', unitId: unit.id }
      if (place.latest_end && at + duration > toMinutes(place.latest_end)) return { ok: false, reason: 'after_latest_end', unitId: unit.id }
      if (at + duration > visitLimit) return { ok: false, reason: 'past_dinner', unitId: unit.id }

      const pendingApproach = (approachesOf.get(place.name) ?? []).find((name) => !visits.some((visit) => visit.place.name === name))
      if (pendingApproach) return { ok: false, reason: 'approach_after_monument', unitId: unit.id }

      walk += walkMinutes
      meters += leg?.meters ?? 0
      idle += at - arrive
      visits.push({ unitId: unit.id, place, start: at, end: at + duration, chained, walkMinutes, walkSource: leg?.source ?? null })
      cursor = at + duration
      // Un recorrido a pie (el Free Tour) acaba donde acaba su recorrido, no donde se quedó.
      position = place.end_coordinates ?? place.coordinates
      seenVisit = true
      afterMeal = false
    }

    // Preferencias de hora de la unidad, medidas sobre su primera visita.
    const first = visits[unitStartsAt]
    if (first) {
      const lunch = meals.find((meal) => meal.type === 'lunch')
      if (unit.preferMorning && pendingMeals.lunch && lunch && lunch.start < visits[visits.length - 1].end) preference += MORNING_AFTER_LUNCH_PENALTY
      if (unit.preferEarly) preference += Math.max(0, first.start - start.minutes) * EARLY_DELAY_PENALTY_PER_MINUTE
    }
  }

  if (!lunchDone) return { ok: false, reason: 'lunch_missing' }
  const apart = relationBroken(visits, lunchBeforeVisit)
  if (apart) return { ok: false, reason: apart.reason, unitId: apart.unitId }

  let idleBeforeDinner = null
  let dinnerIdlePenalty = 0
  if (pendingMeals.dinner) {
    // Se va andando hasta el barrio donde se cena: ese paseo es parte del día.
    const walkToDinner = position && dinnerPoint ? (travel.leg(position, dinnerPoint)?.minutes ?? 0) : 0
    const at = Math.max(roundUpToSlot(cursor + walkToDinner), mode.dinnerWindow[0])
    if (at > dinnerLatest) return { ok: false, reason: 'dinner_out_of_window' }
    walk += walkToDinner
    meters += walkToDinner > 0 ? (travel.leg(position, dinnerPoint)?.meters ?? 0) : 0
    idleBeforeDinner = at - cursor - walkToDinner
    // Hasta la tolerancia del ritmo es caminar tranquilo, un helado; por encima, una tarde vacía.
    dinnerIdlePenalty = Math.max(0, idleBeforeDinner - mode.gapTolerance) * DINNER_IDLE_PENALTY_PER_MINUTE
    meals.push({ type: 'dinner', start: at, end: at + mode.mealMinutes, coordinates: dinnerPoint ?? position, walkMinutes: walkToDinner })
  }

  const cost = walk + idle + curatedInversions(sequence) * CURATED_INVERSION_PENALTY + preference + relatedApart(visits) * RELATED_APART_PENALTY
  return { ok: true, visits, meals, walk, meters, idle, idleBeforeDinner, cost, tailPenalty: dinnerIdlePenalty }
}

/**
 * Sitios que están dentro de otro o pegados a otro (decisión del 2026-09-23, datos del destino):
 *   - `contained_in`: lo de dentro va JUSTO DETRÁS de su contenedor, como una sola visita (el
 *     Elefantino detrás de la Minerva; las Tortugas y el Teatro de Marcelo, detrás del Barrio Judío).
 *   - `neighbor_of`: vecinos pegados (Campo de' Fiori y Plaza Farnese). Si caen el mismo día, van
 *     seguidos. Lo de dentro de cada uno va con él: la Minerva y su Elefantino son un bloque que
 *     tiene que tocar al Panteón.
 * La comida no puede ir en medio de ninguno de los dos. Las paradas "de paso" no cuentan: repasar
 * el Foro por fuera no es visitarlo.
 * @returns {{reason: string, unitId: string} | null}
 */
function relationBroken(visits, lunchBeforeVisit) {
  const indexOf = new Map()
  visits.forEach((visit, index) => {
    if (!visit.place.passBy && !indexOf.has(visit.place.name)) indexOf.set(visit.place.name, index)
  })
  const lunchBetween = (a, b) => lunchBeforeVisit !== null && lunchBeforeVisit > Math.min(a, b) && lunchBeforeVisit <= Math.max(a, b)
  // El bloque de un lugar: él y lo que tiene dentro, que va detrás.
  const blockEnd = (index) => {
    let end = index
    while (end + 1 < visits.length && visits[end + 1].place.contained_in === visits[index].place.name) end++
    return end
  }
  for (const [index, visit] of visits.entries()) {
    const place = visit.place
    if (place.passBy) continue
    const container = place.contained_in ? indexOf.get(place.contained_in) : undefined
    if (container !== undefined) {
      const between = visits.slice(container + 1, index)
      if (container > index || between.some((other) => other.place.contained_in !== place.contained_in) || lunchBetween(container, index)) {
        return { reason: 'contained_apart', unitId: visit.unitId }
      }
    }
    for (const partner of place.neighbor_of ?? []) {
      const other = indexOf.get(partner)
      if (other === undefined) continue
      const [first, second] = other < index ? [other, index] : [index, other]
      if (blockEnd(first) + 1 !== second || lunchBetween(first, second)) return { reason: 'neighbor_apart', unitId: visit.unitId }
    }
  }
  return null
}

/**
 * Duración de un lugar dentro de su unidad. El extra del ritmo va UNA vez por visita, y se lo lleva
 * el lugar principal del grupo (el más largo): el tiempo de más se pasa en el Altar de la Patria,
 * no en cruzar la Plaza Venecia.
 */
function visitMinutes(unit, index, mode) {
  const place = unit.places[index]
  // El Free Tour dura lo que dura; una parada "de paso" dura lo que dice su mensaje ("dedícale 15
  // minutos"), sin el extra del ritmo.
  if (place.isFreeTour || place.passBy) return place.duration_minutes ?? 30
  const durations = unit.places.map((p) => p.duration_minutes ?? 30)
  const main = durations.indexOf(Math.max(...durations))
  return durations[index] + (index === main ? mode.visitDurationBonus : 0)
}

/** Cuándo acabaría el tramo del grupo que empieza en `fromIndex`, hasta su próximo punto de corte. */
function segmentEnd(unit, fromIndex, cursor, position, travel, mode) {
  let time = cursor
  let at = position
  for (let index = fromIndex; index < unit.places.length; index++) {
    const place = unit.places[index]
    time += (at ? travel.leg(at, place.coordinates)?.minutes ?? 0 : 0) + visitMinutes(unit, index, mode)
    at = place.coordinates
    if (!place.inseparableWithNext) break
  }
  return time
}

/** Cuántas parejas naturales (`related_to`) van el mismo día con otra visita en medio. */
function relatedApart(visits) {
  const position = new Map(visits.map((visit, index) => [visit.place.name, index]))
  let apart = 0
  for (const [index, visit] of visits.entries()) {
    const partner = visit.place.related_to
    // Cada pareja se cuenta una vez: desde el lugar que va primero.
    if (!partner || !position.has(partner) || position.get(partner) < index) continue
    if (position.get(partner) - index !== 1) apart++
  }
  return apart
}

function curatedInversions(sequence) {
  const indices = sequence.filter((element) => element !== LUNCH && element.curatedIndex != null).map((unit) => unit.curatedIndex)
  let inversions = 0
  for (let i = 0; i < indices.length; i++) for (let j = i + 1; j < indices.length; j++) if (indices[i] > indices[j]) inversions++
  return inversions
}

// ── Búsqueda ────────────────────────────────────────────────────────────────────────────────

/** La unidad en la posición donde menos tiempo pierde el día. null si no cabe en ninguna. */
function bestInsertion(sequence, unit, ctx) {
  let best = null
  for (let i = 0; i <= sequence.length; i++) {
    const candidate = [...sequence.slice(0, i), unit, ...sequence.slice(i)]
    const result = simulate(candidate, ctx)
    if (result.ok && (!best || result.cost < best.cost)) best = { sequence: candidate, cost: result.cost }
  }
  return best?.sequence ?? null
}

/**
 * Solo para pool e imprescindibles: si no caben, se quita lo menos importante (y, a igualdad, lo más
 * largo) hasta que quepan. Nunca se desplaza algo de igual o más prioridad.
 */
function insertByDisplacing(sequence, unit, ctx) {
  if (unit.priority > PRIORITY.ESSENTIAL) return null
  const candidates = sequence
    .filter((element) => element !== LUNCH && element.priority > unit.priority)
    .sort((a, b) => b.priority - a.priority || unitMinutes(b) - unitMinutes(a) || a.id.localeCompare(b.id, 'es'))
  let remaining = sequence
  const victims = []
  for (const victim of candidates) {
    remaining = remaining.filter((element) => element !== victim)
    victims.push(victim)
    const inserted = bestInsertion(remaining, unit, ctx)
    if (inserted) return { sequence: inserted, victims }
  }
  return null
}

/**
 * Mejora el orden mientras el día pierda menos tiempo. Tres movimientos:
 *   - mover una pieza (unidad o comida) a otra posición;
 *   - intercambiar dos piezas;
 *   - invertir un tramo entero (2-opt). Es el que deshace un zigzag: A → C → B → D, donde ir y
 *     volver cruza la ciudad dos veces, pasa a A → B → C → D. Moviendo piezas de una en una no se
 *     llega, porque cada paso intermedio es peor que el de partida.
 */
function improve(sequence, ctx) {
  let current = sequence
  let currentCost = simulate(current, ctx).cost ?? Infinity
  const consider = (candidate, best) => {
    const result = simulate(candidate, ctx)
    return result.ok && result.cost < (best?.cost ?? currentCost) ? { sequence: candidate, cost: result.cost } : best
  }
  for (let pass = 0; pass < MAX_IMPROVEMENT_PASSES; pass++) {
    let bestMove = null
    for (let from = 0; from < current.length; from++) {
      const without = [...current.slice(0, from), ...current.slice(from + 1)]
      for (let to = 0; to <= without.length; to++) {
        if (to === from) continue
        bestMove = consider([...without.slice(0, to), current[from], ...without.slice(to)], bestMove)
      }
      for (let other = from + 1; other < current.length; other++) {
        const swapped = [...current]
        ;[swapped[from], swapped[other]] = [swapped[other], swapped[from]]
        bestMove = consider(swapped, bestMove)
        if (other - from >= 2) bestMove = consider([...current.slice(0, from), ...current.slice(from, other + 1).reverse(), ...current.slice(other + 1)], bestMove)
      }
    }
    if (!bestMove) break
    current = bestMove.sequence
    currentCost = bestMove.cost
  }
  return current
}

/**
 * La tarde, en el orden que MENOS CAMINA (decisión del 2026-09-23). Con la salida fija (donde se
 * come) y la llegada fija (el barrio de la cena), se prueban todos los órdenes de lo que va después
 * de comer y se queda el de menos metros que respete horarios y reglas; a igualdad, el que menos
 * tiempo pierde. Lo curado y el recorrido de tarde del destino (`curatedIndex`) no se mueven entre
 * sí: solo se intercala lo demás. Las paradas "de paso" siguen al final.
 *
 * Es lo que la mejora por pasos no consigue: medía paseo + espera, y con el redondeo la espera
 * pesaba tanto que el motor elegía un zigzag que llegaba "en punto" (Castillo → Tortugas → Minerva →
 * Elefantino → Trastevere: bajar, subir y volver a bajar).
 */
function bestAfternoon(sequence, ctx) {
  const current = { sequence, result: simulate(sequence, ctx) }
  const lunchAt = sequence.indexOf(LUNCH)
  const head = sequence.slice(0, lunchAt + 1)
  const afternoon = sequence.slice(lunchAt + 1)
  const isPassBy = (unit) => unit.places.some((place) => place.passBy)
  const tail = afternoon.filter(isPassBy)
  const pieces = afternoon.filter((unit) => !isPassBy(unit))
  const fixed = pieces.filter((unit) => unit.curatedIndex != null)
  const movable = pieces.filter((unit) => unit.curatedIndex == null)
  if (movable.length === 0 || pieces.length > MAX_AFTERNOON_PIECES) return current

  let best = current.result.ok ? current : null
  const better = (a, b) => !b || a.meters < b.meters || (a.meters === b.meters && a.cost < b.cost)
  const order = []
  const used = new Array(movable.length).fill(false)
  const walkOrders = (nextFixed) => {
    if (order.length === pieces.length) {
      const candidate = [...head, ...order, ...tail]
      const result = simulate(candidate, ctx)
      if (result.ok && better(result, best?.result)) best = { sequence: candidate, result }
      return
    }
    if (nextFixed < fixed.length) {
      order.push(fixed[nextFixed])
      walkOrders(nextFixed + 1)
      order.pop()
    }
    for (let i = 0; i < movable.length; i++) {
      if (used[i]) continue
      used[i] = true
      order.push(movable[i])
      walkOrders(nextFixed)
      order.pop()
      used[i] = false
    }
  }
  walkOrders(0)
  return best ?? current
}

/**
 * Por qué no ha entrado. Se prueba la unidad SOLA en el día: si ni así cabe, el motivo es suyo
 * (cierra, última entrada...); si sola cabe, es que no hay sitio con el resto.
 */
function diagnose(unit, ctx) {
  const alone = ctx.pendingMeals.lunch ? [[unit, LUNCH], [LUNCH, unit]] : [[unit]]
  const results = alone.map((sequence) => simulate(sequence, ctx))
  if (results.some((result) => result.ok)) return { reason: 'no_room', detail: 'no cabe con el resto del día' }
  const own = results.find((result) => result.unitId === unit.id) ?? results[0]
  return { reason: own.reason, detail: null }
}
