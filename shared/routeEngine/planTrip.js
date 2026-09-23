/**
 * El REPARTIDOR del motor v3: qué va en cada día del viaje.
 *
 * El fallo raíz del motor anterior (diagnóstico del 2026-09-23) era que el repartidor decidía con
 * minutos supuestos —"esto cuesta su duración + 22"— y el constructor descubría después, con el
 * reloj de verdad, que no cabía, y lo tiraba en silencio. Aquí el repartidor no supone nada: cada
 * vez que quiere meter algo en un día se lo PREGUNTA al programador (`openDay().tryAdd`), que lo
 * prueba con los trayectos reales, los horarios y las comidas. Lo que el reparto da por hecho, el
 * día final lo contiene.
 *
 * Orden de colocación (decisiones del 2026-09-23):
 *   1. Esqueleto: tipo de cada día (excursión, en blanco, media jornada, revisitas).
 *   2. Imprescindibles que el reparto curado FIJA a un día (el Coliseo, el día de Roma Antigua).
 *   3. El pool, en el orden en que el viajero lo eligió: lo antes posible y cerca de lo que ya hay.
 *      Puede mover un imprescindible a otro día; nunca quitarlo del viaje.
 *   4. El resto de imprescindibles, donde quepan mejor. Un imprescindible no se cae por el ritmo:
 *      si no cabe, ese día pasa al horario normal (con aviso).
 *   5. La cuota de experiencias: al menos una cosa del tema por día, si hay algo cerca.
 *   6. Relleno hasta el objetivo de paradas del ritmo, repartido por turnos entre los días.
 *
 * Y dos cosas del paso 4 (la tarde hacia la cena):
 *   - El Free Tour se coloca el primero y se lleva lo que recorre (`default_free_tour.covers`): esos
 *     lugares no vuelven a salir sueltos ese día —el Día 1 pasaba dos veces por los mismos sitios—,
 *     salvo los de `early_visit_ok` antes del tour (Trevi a las 08:00, vacía, es otra experiencia).
 *   - Cada día elige dónde se cena: el barrio bueno para cenar (`destination_config.dinner_zones`)
 *     más cercano a donde acaba su tarde, sin repetir barrio de una noche a otra mientras queden
 *     (salvo a 15 min o menos). Se elige DESPUÉS del relleno: la tarde va primero adonde queda
 *     contenido sin ver; luego se rellena otra vuelta hacia la cena y el programador cuenta el paseo.
 *
 * "Cerca" se mide en minutos REALES andando desde las paradas que el día ya tiene (matriz de
 * tiempos), no por centros de zona: con centros, Villa Farnesina (Trastevere) contaba como vecina
 * del Centro Histórico y acababa a 27 minutos de la Fontana de Trevi.
 *
 * Función pura: mismos argumentos, mismo resultado. Cada día se genera en su propia llamada y
 * todas recalculan el viaje entero (invariante 20).
 */

import { buildUnits } from './units.js'
import { TAG_INTEREST_MAP, categoryCapFor, categoryOfTags, interestTagsFor } from './experienceTags.js'
import { MAX_REVISITS_PER_DAY, RELAXED_DAY_TARGET_STOPS, canRevisit, revisitReasonFor } from './revisits.js'
import { tripDays } from './tripSkeleton.js'
import { MODES_V3, modeV3For } from './modes.js'
import { PRIORITY, openDay } from './scheduleDay.js'
import { nightWalkPlan, planNightWalks } from './nightWalk.js'

/** Hasta dónde se va andando a buscar algo para un día: más lejos ya no es "de camino". */
const NEAR_WALK_MINUTES = 20

/**
 * Pesos del relleno. Solo ordenan candidatos que YA caben. El tema pesa poco a propósito: la cuota
 * (paso 5) ya garantiza uno por día, y con 60 puntos una iglesia a 27 minutos ganaba a una plaza
 * de camino — el día 2 de Roma acababa con cuatro iglesias cruzando la ciudad. Cada minuto de
 * paseo o espera que añade el candidato resta el doble.
 */
const FILL_SCORE = { theme: 20, level1: 50, level2: 30, curatedForDay: 25, revisit: -40, perAddedMinute: 2 }

/** Relleno que añade más que esto en paseo + espera no compensa: no es "de camino", es un desvío. */
const MAX_FILL_ADDED_MINUTES = 30

/** Por encima del mínimo de paradas del ritmo solo entra lo que cae de camino (ver ON_THE_WAY_MINUTES). */
const CHEAP_FILL_ADDED_MINUTES = 10

/**
 * Tope de seguridad de paradas por encima del máximo del ritmo. La tarde se llena por MINUTOS, no
 * por número de paradas (decisión de la ronda del relleno por presupuesto de tiempo): diez paradas de
 * veinte minutos acababan a las 17:30. El máximo del ritmo deja de ser un techo mientras quede más
 * tiempo libre antes de cenar que la tolerancia; esto solo evita un día de quince plazas.
 */
const EXTRA_STOPS_WHILE_AFTERNOON_EMPTY = 2

/**
 * Paseo que el relleno puede AÑADIR al día. "Hacia la cena" es de camino, no alrededor: con el
 * barrio de la cena contando como cercano, la tarde del Vaticano bajaba al Aventino y volvía al
 * Castillo, y la del centro subía a la Galería Borghese y bajaba otra vez, porque llenar la tarde
 * compensaba cualquier desvío.
 */
const MAX_FILL_ADDED_WALK_MINUTES = 15

/**
 * Lo que queda de camino SIN desvío (añade como mucho esto andando) no cuenta para el tope de
 * calles/plazas/iglesias del día: el Borgo Pio entre la Via della Conciliazione y el Castillo no es
 * "otra calle más", es la calle por la que se va.
 */
const ON_THE_WAY_MINUTES = 5

/** Se puede repetir barrio de cena si en ese momento se está a esto o menos andando (decisión). */
const DINNER_REPEAT_MAX_WALK_MINUTES = 15

/** Por debajo de este hueco antes de cenar no se repite nada de paso: es caminar tranquilo. */
const PASS_BY_MIN_GAP_MINUTES = 45

/**
 * Regla de experiencias (decisión del 2026-09-23): un lugar de una experiencia solo se DESVÍA para
 * entrar si hace falta para la cuota del día o para el mínimo del viaje. Si no, solo entra de
 * camino: sin alejarse de la cena y sin añadir más que esto andando. Es lo que saca al Ara Pacis
 * del día del Vaticano (el día ya tiene arte con los Museos Vaticanos, y cruzar el río aleja de
 * Trastevere) sin bajar el desvío general del relleno.
 */
const THEME_ON_THE_WAY_MINUTES = 10
/**
 * "Alejarse de la cena" (decisión del 2026-09-23): la parada nueva queda más lejos ANDANDO del sitio
 * de la cena que la anterior, con este margen para no descartar por ruido de la matriz.
 */
const AWAY_FROM_DINNER_TOLERANCE_MINUTES = 2

/**
 * Relleno de tarde que obliga a volver atrás (decisión del 2026-09-23): si el mejor orden de la tarde
 * con él camina más que esto por encima del mejor orden sin él, se quita. Un relleno nunca
 * justifica un zigzag.
 */
const MAX_BACKTRACK_WALK_MINUTES = 5

/** Desvío máximo de una parada "de paso": tiene que pillar de camino a la cena. */
const PASS_BY_MAX_ADDED_WALK_MINUTES = 10

/**
 * Los lugares de una unidad, listos para el programador: con la hora fija del Free Tour y la marca
 * de par inseparable leída de `groups.<id>.inseparable` del JSON del destino. Se marca en el dato,
 * no se deduce por distancia: Plaza de San Pedro y la Basílica son el mismo sitio aunque las
 * coordenadas estén a 200 m, y dos sitios a 200 m no tienen por qué serlo.
 */
export function placesForScheduler(unit, destData, freeTourTime) {
  const pairs = destData.groups?.[unit.id]?.inseparable ?? []
  const joined = (a, b) => pairs.some((pair) => pair.includes(a) && pair.includes(b))
  // El Free Tour acaba en el último sitio de su recorrido, no en el punto de encuentro: lo siguiente
  // del día se mide desde allí.
  const tourEnd = destData.places?.find((p) => p.name === (destData.default_free_tour?.covers ?? []).at(-1))?.coordinates ?? null
  return unit.places.map((place, index) => {
    const next = unit.places[index + 1]
    return {
      ...place,
      ...(place.isFreeTour && freeTourTime ? { fixed_start: freeTourTime } : {}),
      ...(place.isFreeTour && tourEnd ? { end_coordinates: tourEnd } : {}),
      ...(next && joined(place.name, next.name) ? { inseparableWithNext: true } : {}),
    }
  })
}

/**
 * Un imprescindible ya visto, repasado por fuera camino de la cena. Sin horario (por fuera no hay
 * puerta), con los minutos de paso del JSON, desde donde se ve (`pass_by.coordinates`: el Foro se
 * mira desde la Via dei Fori Imperiali) y con el mensaje que explica por qué vuelve a salir.
 */
function passByUnit(place, passBy, minutes, seenOnDay, dinnerDisplay) {
  const message = `Ya visitaste ${passBy.label ?? place.name} el Día ${seenOnDay}. De camino a cenar ${dinnerDisplay} pasas por delante: dedícale ${minutes} minutos y hazte fotos nuevas con la luz de la tarde.`
  return {
    id: `${place.name} (de paso)`,
    places: [
      {
        name: place.name,
        coordinates: passBy.coordinates ?? place.coordinates,
        duration_minutes: minutes,
        type: 'exterior',
        tags: place.tags ?? [],
        wikipedia_title: place.wikipedia_title,
        zone: place.zone,
        passBy: { seenOnDay, includes: passBy.includes ?? [], from: passBy.from ?? null },
      },
    ],
    priority: PRIORITY.FILLER,
    level: 1,
    tags: place.tags ?? [],
    closedOn: [],
    minutes,
    isRevisit: true,
    revisitReason: message,
    capExempt: true,
  }
}

/** Zonas por prioridad, para los días que no tienen reparto curado (6+ días, destinos nuevos). */
function zonesByPriority(destData) {
  return Object.entries(destData?.zones ?? {})
    .map(([id, zone]) => ({ id, priority: zone.zone_priority ?? 9, center: zone.center }))
    .sort((a, b) => a.priority - b.priority || a.id.localeCompare(b.id, 'es'))
}

/**
 * @param {object} args
 * @param {object} args.destData
 * @param {number} args.totalDays          días del viaje CONTANDO la vuelta (invariante 21)
 * @param {string} args.pace               'nonstop' | 'tranquilo'
 * @param {boolean} args.hasFreeTour
 * @param {string[]} [args.poolNames]      lo que eligió el viajero, en el orden en que lo eligió
 * @param {string[]} [args.experiencesPositive]
 * @param {string|null} [args.dateRangeStartIso]
 * @param {{leg: Function}} args.travel    createTravelTimes(matriz)
 */
export function planTrip({ destData, totalDays, pace, hasFreeTour, poolNames = [], experiencesPositive = [], dateRangeStartIso = null, travel }) {
  const mode = modeV3For(pace)
  // Plan B de un imprescindible: el horario normal (el del completo, sin el extra de duración).
  const normal = { ...mode, dayStart: MODES_V3.completo.dayStart, visitDurationBonus: 0 }
  const fallbackMode = normal.dayStart !== mode.dayStart || normal.visitDurationBonus !== mode.visitDurationBonus ? normal : null
  const freeTourTime = destData.default_free_tour?.default_time ?? null

  const selectedThemes = (experiencesPositive ?? []).filter((id) => id in TAG_INTEREST_MAP && id !== 'free_tour')
  const interestTags = interestTagsFor(selectedThemes)
  const matchesTheme = (unit) => unit.tags.some((tag) => interestTags.has(tag))

  // ── Unidades, con su prioridad ────────────────────────────────────────────────────────────
  const poolIndexOf = (unit) => {
    const indices = unit.places.map((place) => poolNames.indexOf(place.name)).filter((index) => index >= 0)
    return indices.length > 0 ? Math.min(...indices) : null
  }
  const units = buildUnits(destData, hasFreeTour)
    .map((unit) => {
      const poolIndex = poolIndexOf(unit)
      const priority =
        poolIndex !== null || unit.isFreeTour
          ? PRIORITY.POOL
          : unit.level === 1
            ? unit.places.some((place) => place.tier === 'joya')
              ? PRIORITY.JOYA
              : PRIORITY.ESSENTIAL
            : matchesTheme(unit)
              ? PRIORITY.THEME
              : PRIORITY.FILLER
      return {
        ...unit,
        places: placesForScheduler(unit, destData, freeTourTime),
        priority,
        poolIndex,
        isLong: !unit.isFreeTour && unit.minutes >= mode.longVisitMinutes,
      }
    })

  // ── Paso 1: esqueleto ──────────────────────────────────────────────────────────────────────
  const skeleton = tripDays({ destData, totalDays, hasFreeTour, dateRangeStartIso })
  const zones = zonesByPriority(destData)
  const cityDays = []
  let nextZone = 0
  let nextRepetitionZone = 0
  for (const day of skeleton) {
    if (day.isBlank || day.isExcursion) continue
    const curatedNames = [...(day.curated?.morning?.places ?? []), ...(day.curated?.afternoon?.places ?? [])]
    // Semilla geográfica de un día sin curado: la siguiente zona por prioridad. Un día de revisitas
    // vuelve a las tres mejores en vez de bajar hacia la periferia (Prompt 9, Parte 13).
    const seedZone = day.curated?.morning?.zone ?? (day.allowsRepetition ? zones[nextRepetitionZone++ % Math.min(3, zones.length)] : zones[nextZone++ % zones.length])?.id
    const seedCenter = destData.zones?.[seedZone]?.center ?? null
    cityDays.push({
      ...day,
      curatedNames,
      curatedMorning: day.curated?.morning?.places ?? [],
      dinnerZone: null,
      dinnerCoords: null,
      seedCoords: Array.isArray(seedCenter) ? seedCenter : null,
      revisits: 0,
      open: openDay({
        mode,
        travel,
        start: { minutes: day.halfDayExcursion ? mode.halfDayRouteStart : mode.dayStart, coordinates: null },
        pendingMeals: { lunch: !day.halfDayExcursion, dinner: true },
        longVisitsAnytime: skeleton.filter((d) => !d.isBlank && !d.isExcursion).length === 1,
      }),
    })
  }

  const placedDay = new Map() // unit.id -> dayNumber
  // Relleno quitado de un día por obligar a volver atrás: a ESE día no vuelve.
  const bannedOnDay = new Set() // `${dayNumber}|${unit.id}`
  // Vecinos y contenidos que no cupieron el día de su pareja: fuera del viaje, pero la cuota los ve
  // (si el tema solo tenía eso cerca, el motivo es "no cabe", no "no hay nada").
  const droppedByRelation = new Set()

  // Dentro de otro (`contained_in`) y vecinos (`neighbor_of`): con quién tiene que ir cada unidad.
  const unitIdOfPlace = new Map(units.flatMap((unit) => unit.places.map((place) => [place.name, unit.id])))
  const partnersOf = (unit) =>
    unit.places
      .flatMap((place) => [place.contained_in, ...(place.neighbor_of ?? [])])
      .filter(Boolean)
      .map((name) => unitIdOfPlace.get(name))
      .filter((id) => id && id !== unit.id)
  /**
   * Días en los que puede ir por sus relaciones: si su contenedor o su vecino principal está en el
   * viaje, SOLO el día de él (lo de dentro no vuelve a salir otro día; el vecino que no cabe ese día
   * se queda fuera). null = sin restricción.
   */
  const mandatory = (unit) => unit.priority <= PRIORITY.ESSENTIAL
  const relationDays = (unit) => {
    if (unit.isRevisit || unit.places.some((place) => place.passBy)) return null
    // Lo que pidió el viajero o es nivel 1 no se mueve ni se quita por una relación: es el otro
    // el que va con él (la Galería Borghese del pool, dentro del Parque: el Parque va su día).
    if (mandatory(unit)) return null
    const forward = partnersOf(unit).map((id) => placedDay.get(id))
    const reverse = units.filter((other) => mandatory(other) && partnersOf(other).includes(unit.id)).map((other) => placedDay.get(other.id))
    const days = [...forward, ...reverse].filter((day) => day != null)
    return days.length > 0 ? days : null
  }
  const revisited = new Set()
  const unplacedPool = []
  const unplacedEssentials = []
  // Días que se quedan sin su tema, y por qué. Nunca en silencio (ver paso 5).
  const quotaMisses = []

  // ── Utilidades ─────────────────────────────────────────────────────────────────────────────
  const dayUnits = (day) => day.open.units()
  /**
   * Cuántas VISITAS tiene el día: lo encadenado (un grupo, o sitios a <= 3 min, como Plaza Venecia +
   * Altar) cuenta como una. Es la medida del objetivo del ritmo (8-10 completo, 5-7 tranquilo); la
   * app sigue enseñando lugares, igual que el mapa y la lista.
   */
  const visitCount = (day) => day.open.visits().filter((visit) => !visit.chained).length
  const curatedIndexIn = (day, unit) => {
    const index = unit.places.map((place) => day.curatedNames.indexOf(place.name)).filter((i) => i >= 0)
    return index.length > 0 ? Math.min(...index) : null
  }

  /**
   * La unidad tal como va en ESTE día: su posición en el curado del día y sus preferencias de hora
   * (lo curado de mañana, antes de comer; lo de "primera hora", cuanto antes).
   */
  const forDay = (day, unit) => ({
    ...unit,
    curatedIndex: curatedIndexIn(day, unit),
    preferMorning: unit.places.some((place) => day.curatedMorning.includes(place.name)),
    preferEarly: unit.places.some((place) => /primera hora/i.test(place.best_time ?? '')),
  })

  /**
   * Minutos andando desde lo más cercano que el día ya tiene (o su zona semilla si está vacío). El
   * sitio de la cena cuenta como algo que el día ya tiene: lo que queda de camino hacia la cena está
   * "cerca" aunque el día todavía no haya llegado hasta allí.
   */
  function walkFromDay(day, unit) {
    const anchors = dayUnits(day).flatMap((u) => u.places.map((p) => p.coordinates))
    if (anchors.length === 0 && day.seedCoords) anchors.push(day.seedCoords)
    if (day.dinnerCoords) anchors.push(day.dinnerCoords)
    if (anchors.length === 0) return 0
    let best = Infinity
    for (const anchor of anchors) {
      for (const place of unit.places) best = Math.min(best, travel.leg(anchor, place.coordinates)?.minutes ?? Infinity)
    }
    return best
  }

  /** ¿Puede ir este día, antes de preguntar al programador? Cierres, visita larga, tope de tema. */
  function eligible(day, unit) {
    return eligibleIgnoringCap(day, unit) && withinCategoryCap(day, unit)
  }

  /** Cierres y visita larga: lo que ni yendo de camino se puede saltar. */
  function eligibleIgnoringCap(day, unit) {
    // Días limitados y reserva obligatoria (`booking_required`, la Domus Aurea): no entra sola en la
    // ruta sin fechas — podría caer un martes, que está cerrada. Desde el pool sí (el viajero sabe lo
    // que pide); con fechas, como cualquier otro, solo los días que abre.
    if (!dateRangeStartIso && unit.poolIndex == null && unit.places.some((place) => place.booking_required)) return false
    if (bannedOnDay.has(`${day.dayNumber}|${unit.id}`)) return false
    const allowedDays = relationDays(unit)
    if (allowedDays && !allowedDays.includes(day.dayNumber)) return false
    if (unit.closedOn.length > 0 && day.weekday && unit.closedOn.includes(day.weekday)) return false
    if (unit.isLong && cityDays.length > 1 && dayUnits(day).some((u) => u.isLong)) return false
    return withinCategoryCap(day, unit)
  }

  /**
   * ¿Cabe en el tope de su categoría? Lo que entró "de camino, sin desvío" no cuenta, y lo que el
   * destino escribió para ese día (curado, recorrido de tarde) tampoco: el Borgo Pio del recorrido
   * del Vaticano no es "otra calle más" que compite con la Via della Conciliazione.
   */
  function withinCategoryCap(day, unit) {
    if (unit.priority <= PRIORITY.ESSENTIAL || unit.capExempt || curatedIndexIn(day, unit) !== null) return true
    const category = categoryOfTags(unit.tags)
    if (!category) return true
    const sameCategory = dayUnits(day).filter((u) => u.priority > PRIORITY.ESSENTIAL && !u.capExempt && categoryOfTags(u.tags) === category).length
    return sameCategory < categoryCapFor(destData, category, selectedThemes)
  }

  /**
   * Mete la unidad en el día si el programador dice que cabe. Un imprescindible tiene plan B (el día
   * pasa al horario normal), salvo que se pida sin él: una visita OPCIONAL de un imprescindible —Trevi
   * antes del Free Tour, que el tour ya enseña— no justifica madrugar.
   */
  function placeOnDay(day, unit, { allowFallback = true } = {}) {
    if (!eligible(day, unit)) return false
    const withIndex = forDay(day, unit)
    if (day.open.add(withIndex) || (allowFallback && unit.priority <= PRIORITY.ESSENTIAL && day.open.tryWithFallback(withIndex, fallbackMode))) {
      placedDay.set(unit.id, day.dayNumber)
      droppedByRelation.delete(unit.id)
      return true
    }
    return false
  }

  /** Días donde probar una unidad: primero los que la tienen cerca, y de esos el más temprano. */
  function daysByProximity(unit, { earliestFirst = false } = {}) {
    return cityDays
      .map((day) => ({ day, walk: walkFromDay(day, unit) }))
      .sort((a, b) =>
        earliestFirst
          ? Number(a.walk > NEAR_WALK_MINUTES) - Number(b.walk > NEAR_WALK_MINUTES) || a.day.dayNumber - b.day.dayNumber
          : a.walk - b.walk || a.day.dayNumber - b.day.dayNumber,
      )
      .map((item) => item.day)
  }


  // ── Paso 1b: el Free Tour, y lo que su recorrido ya enseña ────────────────────────────────
  const tour = destData.default_free_tour ?? null
  const tourUnit = units.find((unit) => unit.isFreeTour)
  const coveredByFreeTour = []
  if (tourUnit) {
    // Su día es el del reparto curado; sin curado, el primero donde quepa.
    const curatedDay = cityDays.find((day) => curatedIndexIn(day, tourUnit) !== null)
    const tourDay = [curatedDay, ...cityDays.filter((day) => day !== curatedDay)].filter(Boolean).find((day) => placeOnDay(day, tourUnit))
    if (!tourDay) {
      unplacedPool.push({ unitId: tourUnit.id, name: tourUnit.places[0].name, reason: 'no_room', closedOn: [] })
    } else {
      const covers = tour.covers ?? []
      const earlyOk = tour.early_visit_ok ?? []
      for (const unit of units) {
        if (unit.isFreeTour || placedDay.has(unit.id) || !unit.places.every((place) => covers.includes(place.name))) continue
        // Lo que tiene sentido ver aparte ANTES del tour (Trevi a las 08:00, sin gente) se intenta
        // ese mismo día, acabando antes de que empiece. Si no cabe, el tour ya lo enseña.
        if (unit.places.every((place) => earlyOk.includes(place.name))) {
          const early = { ...unit, places: unit.places.map((place) => ({ ...place, latest_end: tour.default_time })) }
          if (placeOnDay(tourDay, early, { allowFallback: false })) continue
        }
        // Visto con el tour: cuenta como visitado y no se repite suelto.
        placedDay.set(unit.id, tourDay.dayNumber)
        coveredByFreeTour.push({ unitId: unit.id, names: unit.places.map((place) => place.name), dayNumber: tourDay.dayNumber })
      }
    }
  }

  // ── Paso 2: imprescindibles fijados por el reparto curado ─────────────────────────────────
  for (const day of cityDays) {
    const anchors = units
      .filter((unit) => !placedDay.has(unit.id) && (unit.level === 1 || unit.isFreeTour) && curatedIndexIn(day, unit) !== null)
      .sort((a, b) => curatedIndexIn(day, a) - curatedIndexIn(day, b))
    for (const unit of anchors) placeOnDay(day, unit) // si no cabe aquí, el paso 4 le busca otro día
  }

  // ── Paso 3: el pool, en el orden en que se eligió ─────────────────────────────────────────
  for (const unit of units.filter((u) => u.poolIndex !== null).sort((a, b) => a.poolIndex - b.poolIndex)) {
    if (placedDay.has(unit.id)) continue // ya estaba como imprescindible fijado: ahí se queda
    const candidates = daysByProximity(unit, { earliestFirst: true })
    if (candidates.some((day) => placeOnDay(day, unit))) continue

    // No cabe en ningún día tal cual: se le hace sitio moviendo un imprescindible a OTRO día.
    let placed = false
    for (const day of candidates) {
      if (placed || !eligible(day, unit)) continue
      // Se mueve antes un imprescindible que una joya; y de igual escalón, lo más largo.
      const movable = dayUnits(day)
        .filter((u) => u.priority > PRIORITY.POOL && u.priority <= PRIORITY.ESSENTIAL)
        .sort((a, b) => b.priority - a.priority || b.minutes - a.minutes || a.id.localeCompare(b.id, 'es'))
      for (const victim of movable) {
        const before = day.open.snapshot()
        day.open.remove(victim.id)
        placedDay.delete(victim.id)
        if (placeOnDay(day, unit)) {
          const elsewhere = daysByProximity(victim).filter((other) => other !== day)
          if (elsewhere.some((other) => placeOnDay(other, victim))) {
            placed = true
            break
          }
        }
        // Se deshace tal cual estaba: un imprescindible no puede perderse por un intento fallido.
        day.open.restore(before)
        placedDay.delete(unit.id)
        placedDay.set(victim.id, day.dayNumber)
      }
    }

    // Viaje de UN día: no hay otro día al que mover nada, y ahí manda el pool (decisión firme del
    // Prompt 9, Parte 3). Se van quitando nivel 1 —antes imprescindibles que joyas— hasta que lo
    // elegido quepa; lo que salga va a "No te dio tiempo".
    if (!placed && cityDays.length === 1 && eligible(cityDays[0], unit)) {
      const day = cityDays[0]
      const before = day.open.snapshot()
      const removed = []
      const victims = dayUnits(day)
        .filter((u) => u.priority > PRIORITY.POOL && u.priority <= PRIORITY.ESSENTIAL)
        .sort((a, b) => b.priority - a.priority || b.minutes - a.minutes || a.id.localeCompare(b.id, 'es'))
      for (const victim of victims) {
        day.open.remove(victim.id)
        placedDay.delete(victim.id)
        removed.push(victim)
        if (placeOnDay(day, unit)) {
          placed = true
          break
        }
      }
      if (placed) {
        // Lo quitado intenta volver al hueco que quede; lo que no, fuera con su motivo.
        for (const victim of removed) {
          if (placeOnDay(day, victim, { allowFallback: !victim.places.some((place) => place.latest_end) })) continue
          // Lo que iba antes del Free Tour (Trevi a las 08:00) y se queda sin su hueco lo sigue
          // enseñando el tour: cuenta como visto, no como perdido — y no vuelve suelto a mediodía.
          if (victim.places.some((place) => place.latest_end)) {
            placedDay.set(victim.id, day.dayNumber)
            coveredByFreeTour.push({ unitId: victim.id, names: victim.places.map((place) => place.name), dayNumber: day.dayNumber })
          } else {
            unplacedEssentials.push({ unitId: victim.id, name: victim.places[0].name, reason: 'displaced_by_pool' })
            placedDay.set(victim.id, null) // fuera por decisión del viajero: el paso 4 no lo recoloca
          }
        }
      } else {
        day.open.restore(before)
        for (const victim of removed) placedDay.set(victim.id, day.dayNumber)
      }
    }
    if (!placed) {
      const closedEveryDay = cityDays.every((day) => day.weekday && unit.closedOn.includes(day.weekday))
      unplacedPool.push({ unitId: unit.id, name: unit.places[0].name, reason: closedEveryDay ? 'closed_every_day' : unit.isLong ? 'no_room_long_visit' : 'no_room', closedOn: unit.closedOn })
    }
  }

  // ── Paso 4: el resto de imprescindibles ───────────────────────────────────────────────────
  // Primero las joyas, luego los imprescindibles: si no cabe todo, lo que se queda fuera es de abajo.
  const pendingLevel1 = units.filter((u) => u.priority > PRIORITY.POOL && u.priority <= PRIORITY.ESSENTIAL && !placedDay.has(u.id))
  for (const unit of pendingLevel1.sort((a, b) => a.priority - b.priority || b.minutes - a.minutes || a.id.localeCompare(b.id, 'es'))) {
    if (!daysByProximity(unit).some((day) => placeOnDay(day, unit))) {
      unplacedEssentials.push({ unitId: unit.id, name: unit.places[0].name, reason: 'no_room' })
    }
  }

  // ── Paso 4a: recorrido de tarde del destino (afternoon_flow) ──────────────────────────────
  // Misma preferencia que el reparto curado: el día que tiene lo gordo de una zona con recorrido de
  // tarde escrito a mano (Roma: salir del Vaticano por la Conciliazione y el Borgo Pio hacia el
  // Castillo) prefiere esos lugares y en ese orden.
  // El recorrido manda sobre el ORDEN de lo que comparte con el curado: se inserta entero donde
  // aparece su primer lugar. Añadido al final, el curado del día 3 ("... Plaza de San Pedro,
  // Castillo") ponía el Castillo antes que la Conciliazione y el día salía al revés.
  for (const day of cityDays) {
    const zonesOfDay = new Set(dayUnits(day).flatMap((unit) => unit.places.map((place) => place.zone)))
    for (const zone of zonesOfDay) {
      const flow = destData.afternoon_flow?.[zone] ?? []
      if (flow.length === 0) continue
      const firstShared = day.curatedNames.findIndex((name) => flow.includes(name))
      const rest = day.curatedNames.filter((name) => !flow.includes(name))
      const at = firstShared < 0 ? rest.length : rest.length - day.curatedNames.slice(firstShared).filter((name) => !flow.includes(name)).length
      day.curatedNames = [...rest.slice(0, at), ...flow, ...rest.slice(at)]
    }
  }

  // ── Regla de experiencias: solo se desvía lo que hace falta ────────────────────────────────
  const unitHasTheme = (unit, theme) => unit.tags.some((tag) => TAG_INTEREST_MAP[theme].includes(tag))
  /** ¿Hace falta este lugar para la cuota del día o para el mínimo del viaje (uno por día)? */
  function neededForTheme(day, unit) {
    return selectedThemes.some((theme) => {
      if (!unitHasTheme(unit, theme)) return false
      const dayHasIt = dayUnits(day).some((u) => unitHasTheme(u, theme))
      const tripCount = cityDays.reduce((sum, d) => sum + dayUnits(d).filter((u) => unitHasTheme(u, theme)).length, 0)
      return !dayHasIt && tripCount < cityDays.length
    })
  }
  /** ¿Va de camino? Sin alejarse de la cena (por la tarde) y sin añadir más de 10 min andando. */
  function onTheWay(day, unit, attempt) {
    if (attempt.addedWalk > THEME_ON_THE_WAY_MINUTES) return false
    if (!day.dinnerCoords) return true
    const { visits, meals } = day.open.preview(attempt.sequence)
    const index = visits.findIndex((visit) => visit.unitId === unit.id)
    const lunch = meals.find((meal) => meal.type === 'lunch')
    if (index < 0 || (lunch && visits[index].start < lunch.start)) return true // por la mañana la cena no marca rumbo
    const previous = visits[index - 1]
    if (!previous) return true
    const from = previous.place.end_coordinates ?? previous.place.coordinates
    const toDinnerBefore = travel.leg(from, day.dinnerCoords)?.minutes ?? 0
    const toDinnerAfter = travel.leg(visits[index].place.coordinates, day.dinnerCoords)?.minutes ?? 0
    return toDinnerAfter <= toDinnerBefore + AWAY_FROM_DINNER_TOLERANCE_MINUTES
  }
  /**
   * Un lugar de experiencia (no nivel 1 ni pool) entra si hace falta o si va de camino. Lo que el
   * destino ya escribió para ESE día (reparto curado, recorrido de tarde) no es relleno: entra como
   * cualquier otra parada. El Castillo de Sant'Angelo es "museo", pero el día del Vaticano está en
   * su recorrido de tarde y no puede caerse porque los Museos Vaticanos ya cuenten como arte.
   */
  function themeMayEnter(day, unit, attempt) {
    if (unit.priority !== PRIORITY.THEME || curatedIndexIn(day, unit) !== null) return true
    return neededForTheme(day, unit) || onTheWay(day, unit, attempt)
  }

  // ── Paso 6a (se llama después del relleno): dónde se cena cada día ────────────────────────
  // DESPUÉS del relleno (decisión del 2026-09-23): la tarde va primero adonde queda contenido sin
  // ver, y se cena donde acaba. Elegido antes, con solo lo gordo colocado, el barrio mandaba la
  // tarde hacia una zona ya agotada (3 días: el día del centro acababa a las 13:00 y cenaba en Roma
  // Antigua, vista el día 2) y la tarde se quedaba vacía.
  // El barrio bueno para cenar más cercano a donde acaba la tarde. Sin repetir barrio de una noche a
  // otra mientras queden, SALVO que en ese momento se esté a 15 min o menos andando.
  const dinnerOptions = (destData.destination_config?.dinner_zones ?? [])
    .map((zone) => ({ zone, coordinates: destData.meal_zones?.[zone]?.cena?.coordinates }))
    .filter((option) => Array.isArray(option.coordinates))
  function chooseDinners() {
    let usedDinnerZones = new Set()
    for (const day of cityDays) {
      if (dinnerOptions.length === 0) break
      if (usedDinnerZones.size >= dinnerOptions.length) usedDinnerZones = new Set()
      const pick = () => {
        const from = day.open.endCoordinates() ?? day.seedCoords
        // Orden de preferencia: un barrio nuevo a mano; si no hay, repetir uno que esté a mano; si
        // tampoco, el barrio nuevo más cercano. Repetir es la excepción, no el atajo: eligiendo siempre
        // el más cercano, el día del Vaticano volvía a cenar a Campo de' Fiori (a 14 min del Castillo).
        const rank = (option) => {
          const near = option.walk <= DINNER_REPEAT_MAX_WALK_MINUTES
          const fresh = !usedDinnerZones.has(option.zone)
          return fresh && near ? 0 : near ? 1 : fresh ? 2 : 3
        }
        const chosen = dinnerOptions
          .map((option) => ({ ...option, walk: from ? (travel.leg(from, option.coordinates)?.minutes ?? Infinity) : 0 }))
          .filter((option) => rank(option) < 3)
          .sort((a, b) => rank(a) - rank(b) || a.walk - b.walk || a.zone.localeCompare(b.zone, 'es'))
          // Si con el paseo hasta allí el día deja de caber, el siguiente barrio.
          .find((option) => day.open.setDinnerPoint(option.coordinates))
        return chosen
      }
      let chosen = pick()
      // Una tarde llena hasta la hora de cenar no deja tiempo para ir andando a ningún barrio: se
      // quita el último relleno (no vuelve a ese día) y se vuelve a probar.
      for (let tries = 0; !chosen && tries < 3; tries++) {
        const lastFiller = [...day.open.visits()]
          .reverse()
          .map((visit) => dayUnits(day).find((unit) => unit.id === visit.unitId))
          .find((unit) => unit && unit.priority >= PRIORITY.THEME && unit.curatedIndex == null && !unit.places.some((place) => place.passBy))
        if (!lastFiller) break
        day.open.remove(lastFiller.id)
        bannedOnDay.add(`${day.dayNumber}|${lastFiller.id}`)
        if (lastFiller.isRevisit) {
          revisited.delete(lastFiller.originalId)
          day.revisits--
        } else placedDay.delete(lastFiller.id)
        chosen = pick()
      }
      if (!chosen) continue
      day.dinnerZone = chosen.zone
      day.dinnerCoords = chosen.coordinates
      // Para poder comprobarlo: si se repite barrio, a cuánto estaba al elegirlo.
      day.dinnerRepeatWalk = usedDinnerZones.has(chosen.zone) ? chosen.walk : null
      usedDinnerZones.add(chosen.zone)
    }
  }

  // ── Paso 5: cuota de experiencias — al menos una del tema por día, si hay algo cerca ─────
  /** Intenta dejar el día con algo del tema. null si lo lleva; si no, el motivo. */
  function fulfilQuota(day, theme) {
    const tags = new Set(TAG_INTEREST_MAP[theme])
    const ofTheme = (unit) => unit.tags.some((tag) => tags.has(tag))
    if (dayUnits(day).some(ofTheme)) return null
    const candidates = units
      .filter((unit) => (!placedDay.has(unit.id) || droppedByRelation.has(unit.id)) && ofTheme(unit))
      .map((unit) => ({ unit, walk: walkFromDay(day, unit) }))
      // Nunca cruzar la ciudad para cumplir la cuota: si no hay nada cerca, el día se queda sin.
      .filter((item) => item.walk <= NEAR_WALK_MINUTES)
      .sort((a, b) => a.unit.level - b.unit.level || a.walk - b.walk || a.unit.id.localeCompare(b.unit.id, 'es'))
    // La cuota SÍ puede usar nivel 3 en tranquilo: es lo que el viajero pidió, no relleno genérico
    // (casi todo "Naturaleza y vistas" de Roma son fuentes de nivel 3). Si el mínimo del viaje ya lo
    // cubren otros días, no se desvía para cumplirla: solo entra lo que va de camino.
    const placedFor = candidates.find((item) => {
      if (neededForTheme(day, item.unit) || item.unit.priority !== PRIORITY.THEME) return placeOnDay(day, item.unit)
      if (!eligible(day, item.unit)) return false
      const attempt = day.open.tryAdd(forDay(day, item.unit), { maxAddedWalk: THEME_ON_THE_WAY_MINUTES })
      if (!attempt || !onTheWay(day, item.unit, attempt)) return false
      day.open.add(attempt)
      placedDay.set(item.unit.id, day.dayNumber)
      return true
    })
    if (placedFor) return null
    return candidates.length === 0 ? 'none_near' : 'no_room'
  }
  for (const theme of selectedThemes) {
    for (const day of cityDays) {
      const reason = fulfilQuota(day, theme)
      if (reason) quotaMisses.push({ dayNumber: day.dayNumber, theme, reason })
    }
  }

  // ── Paso 6: relleno, por turnos entre días ─────────────────────────────────────────────────
  // Por turnos y no día a día: llenando el día 1 del todo primero, se quedaba con lo mejor de la
  // zona que comparte con el día 3.
  // El objetivo es el MÍNIMO del ritmo (8 completo, 5 tranquilo); hasta el máximo solo se sube con
  // paradas que caen de camino. Rellenar hasta 10 a cualquier precio es el "relleno obsesivo" que
  // se quería quitar.
  const minTargetOf = (day) => (day.allowsRepetition ? RELAXED_DAY_TARGET_STOPS : mode.targetStops[0])
  const maxTargetOf = (day) => (day.allowsRepetition ? RELAXED_DAY_TARGET_STOPS : mode.targetStops[1])
  function fillRounds() {
    let progress = true
    while (progress) {
      progress = false
      for (const day of cityDays) {
        // Se sigue mientras falte el mínimo del ritmo, o mientras la tarde siga vacía antes de cenar.
        const afternoonEmpty = (day.open.idleBeforeDinner() ?? 0) > mode.gapTolerance
        const cap = maxTargetOf(day) + (afternoonEmpty ? EXTRA_STOPS_WHILE_AFTERNOON_EMPTY : 0)
        if (visitCount(day) >= cap) continue
        if (visitCount(day) >= minTargetOf(day) && !afternoonEmpty) continue
        const aboveMinimum = visitCount(day) >= minTargetOf(day)
        const fresh = units.filter((unit) => !placedDay.has(unit.id))
        // Revisitas: solo en días de repetición, de algo visto en un día ANTERIOR, una vez por viaje.
        const revisits = day.allowsRepetition && day.revisits < MAX_REVISITS_PER_DAY
          ? units
              .filter((unit) => placedDay.get(unit.id) != null && placedDay.get(unit.id) < day.dayNumber && !revisited.has(unit.id) && canRevisit(unit))
              .map((unit) => ({ ...unit, id: `${unit.id} (revisita)`, originalId: unit.id, isRevisit: true, revisitReason: revisitReasonFor(unit), priority: PRIORITY.FILLER }))
          : []
  
        let best = null
        for (const unit of [...fresh, ...revisits]) {
          // En tranquilo el nivel 3 no entra como relleno: 5-7 paradas gastadas en tercera fila es lo
          // que hace que un día tranquilo se sienta vacío en vez de tranquilo.
          if (unit.priority > PRIORITY.ESSENTIAL && !mode.fillLevels.includes(unit.level)) continue
          if (walkFromDay(day, unit) > NEAR_WALK_MINUTES || !eligibleIgnoringCap(day, unit)) continue
          // Fuera de su tope de categoría solo entra si va de camino, sin desvío — y entonces no cuenta.
          const overCap = !withinCategoryCap(day, unit)
          const candidate = overCap ? { ...forDay(day, unit), capExempt: true } : forDay(day, unit)
          // Con la tarde todavía vacía se admite un desvío corto; con la tarde ya llena, solo lo que
          // cae de camino. Por minutos, no por número de paradas: con "a partir de 8 paradas, solo de
          // camino", el día del Free Tour (una "parada" de 2h30) se cerraba a las 16:10.
          const walkCap = overCap || !afternoonEmpty ? ON_THE_WAY_MINUTES : MAX_FILL_ADDED_WALK_MINUTES
          const attempt = day.open.tryAdd(candidate, { maxAddedWalk: walkCap })
          if (!attempt) continue
          if (attempt.addedCost > (aboveMinimum ? CHEAP_FILL_ADDED_MINUTES : MAX_FILL_ADDED_MINUTES)) continue
          if (!themeMayEnter(day, unit, attempt)) continue
          const score =
            (matchesTheme(unit) ? FILL_SCORE.theme : 0) +
            (unit.level === 1 ? FILL_SCORE.level1 : unit.level === 2 ? FILL_SCORE.level2 : 0) +
            (curatedIndexIn(day, unit) !== null ? FILL_SCORE.curatedForDay : 0) +
            (unit.isRevisit ? FILL_SCORE.revisit : 0) -
            attempt.addedCost * FILL_SCORE.perAddedMinute -
            // El paseo añadido cuenta además de en el coste: a igualdad, lo que está más a mano.
            attempt.addedWalk * FILL_SCORE.perAddedMinute
          if (!best || score > best.score || (score === best.score && unit.id.localeCompare(best.unit.id, 'es') < 0)) best = { unit, attempt, score }
        }
        if (!best) continue
        day.open.add(best.attempt)
        if (best.unit.isRevisit) {
          revisited.add(best.unit.originalId)
          day.revisits++
        } else {
          placedDay.set(best.unit.id, day.dayNumber)
        }
        progress = true
      }
    }
  }

  /**
   * Lo que quedó en un día que no es el de su contenedor o su vecino principal (el vecino entró
   * antes que él, o el contenedor llegó después): se lleva a ese día; si allí no cabe, fuera.
   */
  function enforceRelations() {
    // Mover un contenedor arrastra lo suyo: se repasa hasta que no cambie nada.
    for (let changed = true; changed; ) {
      changed = false
      for (const day of cityDays) {
        for (const unit of dayUnits(day)) {
          const allowedDays = relationDays(unit)
          if (!allowedDays || allowedDays.includes(day.dayNumber)) continue
          day.open.remove(unit.id)
          placedDay.delete(unit.id)
          const target = cityDays.filter((other) => allowedDays.includes(other.dayNumber)).find((other) => placeOnDay(other, unit))
          // El vecino que no cabe con su pareja se queda fuera.
          if (target) droppedByRelation.delete(unit.id)
          else {
            placedDay.set(unit.id, null)
            droppedByRelation.add(unit.id)
          }
          changed = true
        }
      }
    }
  }

  fillRounds()
  enforceRelations()
  fillRounds()
  // Con la tarde ya llena, dónde se cena; y otra vuelta de relleno, ya en esa dirección.
  chooseDinners()
  fillRounds()
  enforceRelations()

  // Segundo repaso de la cuota con los días ya completos: en el paso 5 el día solo tenía sus
  // imprescindibles, y "no hay nada del tema cerca" era verdad entonces pero puede dejar de serlo
  // cuando el relleno lo acerca a otra zona.
  for (const miss of [...quotaMisses]) {
    const reason = fulfilQuota(cityDays.find((day) => day.dayNumber === miss.dayNumber), miss.theme)
    if (reason) miss.reason = reason
    else quotaMisses.splice(quotaMisses.indexOf(miss), 1)
  }

  // ── Paso 6b: la tarde sin zigzag ──────────────────────────────────────────────────────────
  // Con la tarde ya llena, se prueba su orden entero (el que menos camina) y se quita el relleno que
  // obliga a volver atrás. Lo quitado no vuelve a ese día; se rellena otra vez con lo que sí cae de
  // camino, y así hasta que no quede nada que quitar.
  const themeUnitsInDay = (day, theme) => dayUnits(day).filter((u) => u.tags.some((tag) => TAG_INTEREST_MAP[theme].includes(tag)))
  const isRemovableIn = (day) => (unit) =>
    unit.priority >= PRIORITY.THEME &&
    unit.curatedIndex == null &&
    !unit.places.some((place) => place.passBy) &&
    // El mínimo de experiencias no se baja: lo único del tema en el día se queda.
    !selectedThemes.some((theme) => themeUnitsInDay(day, theme).length === 1 && themeUnitsInDay(day, theme)[0].id === unit.id)
  for (let round = 0; round < 5; round++) {
    let removedAny = false
    for (const day of cityDays) {
      for (const unit of day.open.pruneAfternoon(isRemovableIn(day), MAX_BACKTRACK_WALK_MINUTES)) {
        removedAny = true
        const id = unit.originalId ?? unit.id
        bannedOnDay.add(`${day.dayNumber}|${unit.id}`)
        if (unit.isRevisit) {
          revisited.delete(unit.originalId)
          day.revisits--
        } else placedDay.delete(id)
      }
    }
    if (!removedAny) break
    fillRounds()
    enforceRelations()
  }

  // La cuota, otra vez con la tarde ya definitiva: quitar relleno o mover vecinos puede haber dejado
  // un día sin su tema, y el mínimo de experiencias no se baja.
  for (const theme of selectedThemes) {
    for (const day of cityDays) {
      const reason = fulfilQuota(day, theme)
      const existing = quotaMisses.findIndex((miss) => miss.dayNumber === day.dayNumber && miss.theme === theme)
      if (existing >= 0) quotaMisses.splice(existing, 1)
      if (reason) quotaMisses.push({ dayNumber: day.dayNumber, theme, reason })
    }
  }
  quotaMisses.sort((a, b) => a.dayNumber - b.dayNumber || selectedThemes.indexOf(a.theme) - selectedThemes.indexOf(b.theme))

  // ── Paso 7: de paso hacia la cena ─────────────────────────────────────────────────────────
  // Si después de todo lo anterior la tarde sigue con 45 min o más libres, se repasa POR FUERA un
  // imprescindible ya visto otro día que pille camino de la cena (decisión del 2026-09-23):
  //   - solo nivel 1 con `pass_by` en el JSON (minutos de paso, cómo se nombra, desde dónde se ve);
  //   - visto un día ANTERIOR (o con el Free Tour), una vez por viaje;
  //   - nunca si esa misma noche sale como experiencia nocturna: la versión de noche manda;
  //   - siempre al final del día, camino de la cena (el programador no deja moverlo).
  const passedBy = new Set()
  const nightsBeforePassBy = planNightWalks(destData, nightWalkPlan({
    days: skeleton.map((day) => {
      const city = cityDays.find((d) => d.dayNumber === day.dayNumber)
      return city ? { ...day, dinnerZone: city.dinnerZone, schedule: { visits: city.open.visits() } } : { ...day, schedule: null }
    }),
  }))
  const firstSeenDay = new Map()
  for (const day of cityDays) {
    for (const visit of day.open.visits()) if (!firstSeenDay.has(visit.place.name)) firstSeenDay.set(visit.place.name, day.dayNumber)
  }
  for (const item of coveredByFreeTour) for (const name of item.names) if (!firstSeenDay.has(name)) firstSeenDay.set(name, item.dayNumber)

  for (const day of cityDays) {
    const tonight = new Set((nightsBeforePassBy.get(day.dayNumber) ?? []).flatMap((entry) => entry.conflicts_with ?? []))
    const dinnerDisplay = destData.meal_zones?.[day.dinnerZone]?.cena?.display ?? ''
    while ((day.open.idleBeforeDinner() ?? 0) >= PASS_BY_MIN_GAP_MINUTES) {
      const onDay = new Set(day.open.visits().map((visit) => visit.place.name))
      let best = null
      for (const place of destData.places ?? []) {
        const passBy = place.pass_by
        if (!passBy || place.level !== 1 || passedBy.has(place.name) || onDay.has(place.name) || tonight.has(place.name)) continue
        const seenOn = firstSeenDay.get(place.name)
        if (seenOn == null || seenOn >= day.dayNumber) continue
        // El Coliseo tiene 20-30 min: se prueba primero el rato largo.
        for (const minutes of [...new Set([passBy.max_minutes, passBy.minutes].filter(Number.isFinite))]) {
          const unit = passByUnit(place, passBy, minutes, seenOn, dinnerDisplay)
          const attempt = day.open.tryAdd(unit, { maxAddedWalk: PASS_BY_MAX_ADDED_WALK_MINUTES })
          if (attempt && (!best || attempt.addedCost < best.attempt.addedCost)) best = { place, attempt }
          if (attempt) break
        }
      }
      if (!best) break
      day.open.add(best.attempt)
      passedBy.add(best.place.name)
    }
  }

  // ── Resultado ─────────────────────────────────────────────────────────────────────────────
  const finished = new Map(cityDays.map((day) => [day.dayNumber, { units: dayUnits(day), schedule: day.open.finish(), dinnerZone: day.dinnerZone, dinnerRepeatWalk: day.dinnerRepeatWalk ?? null }]))
  return {
    mode,
    days: skeleton.map((day) => ({ ...day, ...(finished.get(day.dayNumber) ?? { units: [], schedule: null }) })),
    placedDay,
    unplacedPool,
    unplacedEssentials,
    quotaMisses,
    coveredByFreeTour,
  }
}
