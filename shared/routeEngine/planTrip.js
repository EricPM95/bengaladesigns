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
import { MAX_REVISITS_PER_DAY, RELAXED_DAY_TARGET_STOPS, canRevisit } from './revisits.js'
import { placeWithArticle, whyTexts } from './whyTexts.js'
import { tripDays } from './tripSkeleton.js'
import { LATE_DINNER_START, LATE_SUNSET_MINUTES, MODES_V3, modeV3For } from './modes.js'
import { PRIORITY, openDay } from './scheduleDay.js'
import { NIGHT_REACH_METERS, nightWalkPlan, planNightWalks } from './nightWalk.js'
import { dinnerZones } from './dinnerZones.js'
import { straightLineMeters } from './travelTimes.js'
import { toMinutes } from './time.js'
import { lunchSpots } from './lunchSpots.js'
import { sunsetFor } from './sunset.js'
import { closedOnDay } from './openingHours.js'
import { availableForTrip } from './availability.js'
import { tripCalendar } from './tripCalendar.js'
import { blockedByRedundancy, breaksOneBigVisit, isPaidMuseum, paidMuseumQuota } from './localRules.js'

/** Hasta dónde se va andando a buscar algo para un día: más lejos ya no es "de camino". */
const NEAR_WALK_MINUTES = 20
/** A partir de aquí de tiempo libre antes de cenar, el día tiene "tarde libre" (como el servidor). */
const FREE_AFTERNOON_IDLE_MINUTES = 90
/** Paseo de más que se acepta para meter algo de la experiencia antes de dejar la tarde libre. */
const EXPERIENCE_BEFORE_FREE_MAX_WALK = 25

/**
 * Pesos del relleno. Solo ordenan candidatos que YA caben. El tema pesa poco a propósito: la cuota
 * (paso 5) ya garantiza uno por día, y con 60 puntos una iglesia a 27 minutos ganaba a una plaza
 * de camino — el día 2 de Roma acababa con cuatro iglesias cruzando la ciudad. Cada minuto de
 * paseo o espera que añade el candidato resta el doble.
 */
const FILL_SCORE = { theme: 20, level1: 50, level2: 30, curatedForDay: 25, fixedFlow: 500, fixedFlowStep: 20, revisit: -40, perAddedMinute: 2 }

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
/** Nunca se vuelve sobre los propios pasos más de esto para meter una parada opcional (revisión del 2026-09-25). */
const BACKTRACK_MAX_MINUTES = 10

/**
 * Lo que queda de camino SIN desvío (añade como mucho esto andando) no cuenta para el tope de
 * calles/plazas/iglesias del día: el Borgo Pio entre la Via della Conciliazione y el Castillo no es
 * "otra calle más", es la calle por la que se va.
 */
const ON_THE_WAY_MINUTES = 5

/** Se puede repetir barrio de cena si en ese momento se está a esto o menos andando (decisión). */
const DINNER_REPEAT_MAX_WALK_MINUTES = 15

/**
 * Se cena donde acaba el día (revisión del 2026-09-25): barrios de cena a esto o menos andando desde
 * donde acaba la tarde. La ventaja por una nocturna cerca desempata entre estos, nunca lleva la cena
 * más lejos. Era 30.
 */
const DINNER_MAX_WALK_MINUTES = 15

/**
 * Extra de un barrio de cena con un mirador sin ver de camino, si queda tarde para verlo: el
 * atardecer antes de cenar (decisión del 2026-09-23). En minutos de contenido, como el resto.
 */
const SUNSET_BONUS_MINUTES = 45
/**
 * Extra de un barrio de cena con una nocturna a 15 min o menos que el viaje aún puede enseñar
 * (decisión del 2026-09-25: la nocturna sale desde la cena o no sale). Menor que el del atardecer:
 * desempata entre barrios parecidos, no arrastra el día a otra punta.
 */
const NIGHT_BONUS_MINUTES = 30
/**
 * Hueco a mitad de día (decisión del 2026-09-25): 60 min o más parado antes de una parada con hora
 * (el Janículo al atardecer). Primero entra lo gratis de camino; si aún queda, "Tiempo libre".
 */
export const MID_DAY_GAP_MINUTES = 60
/** Tiempo libre mínimo para que el mirador del atardecer cuente. */
const SUNSET_MIN_ROOM_MINUTES = 30

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
/** Una experiencia nocturna a esta distancia (o menos) de una parada de la tarde se ve al atardecer. */
const NIGHT_TO_AFTERNOON_MINUTES = 10
/** Un barrio "es" el de la cena de otro día si está a esta distancia (o menos) de donde se cena. */
const BARRIO_TO_DINNER_MAX_WALK_MINUTES = 20
/** Lo que puede alargar el paseo de la tarde subir a ver esa nocturna al atardecer (el Janículo y bajar). */
const NIGHT_TO_SUNSET_MAX_ADDED_WALK_MINUTES = 20
/**
 * "Alejarse de la cena" (decisión del 2026-09-23): la parada nueva queda más lejos ANDANDO del sitio
 * de la cena que la anterior, con este margen para no descartar por ruido de la matriz.
 */
const AWAY_FROM_DINNER_TOLERANCE_MINUTES = 2

/**
 * Relleno de tarde que un HORARIO obliga a hacer volver atrás (decisión del 2026-09-23): si por los
 * horarios la tarde anda más que esto por encima del mejor orden con todo abierto, se quita el
 * relleno responsable. Un relleno nunca justifica un zigzag.
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
  const message = whyTexts.revisit(passBy.label ?? place.name, seenOnDay, minutes)
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
 * @param {string|null} [args.dateRangeStartIso]  fechas exactas: cada día, su fecha real
 * @param {number|null} [args.month]      sin fechas: mes 0-11 (todos los días, el 15 de ese mes)
 * @param {string|null} [args.season]     solo viajes antiguos: pasa a su mes central (tripCalendar.js)
 * @param {{leg: Function}} args.travel    createTravelTimes(matriz)
 */
export function planTrip({ destData, totalDays, pace, hasFreeTour, poolNames = [], experiencesPositive = [], dateRangeStartIso = null, month = null, season = null, travel }) {
  // El calendario del viaje (Estaciones, Parte 1): con fechas, la de cada día; con días + mes, el 15
  // de ese mes. La época se deduce del mes (reserva `by_season`). Día de la semana, solo con fechas.
  const calendar = tripCalendar({ dateRangeStartIso, month, season })
  const seasonOfTrip = calendar.season
  /** ¿Cierra la unidad ese día? Por día de la semana (con fechas) o por fecha (`closed_dates`, Parte 2). */
  // Lugar a lugar (closedOnDay): el último domingo del mes el Vaticano abre aunque cierre los domingos.
  const closedThatDay = (unit, day) =>
    unit.places.some((place) => closedOnDay(place, day.weekday ?? null, calendar.hasDates ? calendar.dateOfDay(day.dayNumber) : null))
  /**
   * ¿Está fuera de temporada ese día (`available`, Parte 4)? Con fechas, la del día; con solo el mes,
   * el mes frontera solo vale si el viajero lo eligió (pool): lo de temporada no entra solo.
   */
  // Con `aprox` (mercadillos) el margen de 15 días entra solo, con aviso; sin `aprox`, en el mes
  // frontera solo entra lo que el viajero puso en su pool.
  const outOfSeason = (unit, day) =>
    (unit.availableWindows ?? []).some((window) => !availableForTrip(window, calendar, calendar.dateOfDay(day.dayNumber), unit.poolIndex != null))
  // Dónde se puede comer (restaurantes curados para comer): el programador elige en cada día.
  const lunchSpotList = lunchSpots(destData)
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
  // Con fechas: si un imprescindible del día curado cierra ese día de la semana (el Vaticano en
  // domingo), ese día se cambia con otro del viaje en el que abra y cuyo curado también abra en el
  // primero. Si no, se perdía el grupo entero (Plaza y Basílica van con los Museos).
  {
    const placeOf = (name) => destData.places?.find((place) => place.name === name)
    const namesOf = (day) => [...(day.curated?.morning?.places ?? []), ...(day.curated?.afternoon?.places ?? [])]
    // ¿Cierra algún imprescindible del curado de \`day\` el día \`target\`? Por día de la semana o por
    // fecha (\`closed_dates\`: el Coliseo el 25 de diciembre).
    const closedIn = (day, target) => namesOf(day).some((name) => {
      const place = placeOf(name)
      if (place?.level !== 1) return false
      return closedOnDay(place, target.weekday ?? null, calendar.hasDates ? calendar.dateOfDay(target.dayNumber) : null)
    })
    const swappable = skeleton.filter((day) => !day.isBlank && !day.isExcursion && !day.halfDayExcursion && day.weekday)
    for (const day of swappable) {
      if (!day.curated || !closedIn(day, day)) continue
      const other = swappable.find((candidate) => candidate !== day && !closedIn(day, candidate) && !closedIn(candidate, day))
      if (other) [day.curated, other.curated] = [other.curated, day.curated]
    }
    // Sin nadie con quien cambiarlo (viaje de 2 días desde el domingo de Pascua: el Vaticano cierra los
    // dos), el día deja de ser "el del Vaticano sin Vaticano": se reparte como un día sin curado.
    for (const day of swappable) {
      if (day.curated && closedIn(day, day)) day.curated = null
    }
  }
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
    // La fecha de ese día para la puesta de sol y los horarios: la real (con fechas) o el 15 del mes.
    const dateIso = calendar.dateOfDay(day.dayNumber)
    const sunsetMinutes = sunsetFor(destData, { dateIso, season: seasonOfTrip })
    cityDays.push({
      ...day,
      dateIso,
      sunsetMinutes,
      sunsetNames: new Set(),
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
        // La puesta de sol entra en los horarios: "07:00-sunset" cierra a esa hora (Parte 2).
        hours: { weekday: day.weekday ?? null, season: seasonOfTrip, dateIso, sunset: sunsetMinutes },
        lunchSpots: lunchSpotList,
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

  // ── Experiencias: mínimo-máximo por viaje (Paso 3, decisión A del 2026-09-24) ─────────────────
  // Cuenta SOLO lo que entra por la experiencia: lo de pago del tema (o lo que está dentro de algo de
  // pago) y lo que se añade para llegar al mínimo. Los imprescindibles no cuentan aunque lleven la
  // etiqueta del tema, y lo gratis del tema que cae de camino es relleno normal que tampoco cuenta.
  const unitById = new Map(units.map((unit) => [unit.id, unit]))
  const EXPERIENCE_RANGE = cityDays.length <= 1 ? { min: 1, max: 1 } : cityDays.length <= 3 ? { min: 2, max: 3 } : { min: 3, max: 4 }
  const experienceEntries = new Set() // unit.id de lo que entró por una experiencia
  function themesOf(unit) {
    return selectedThemes.filter((theme) => unit.tags.some((tag) => TAG_INTEREST_MAP[theme].includes(tag)))
  }
  /** Lo de la experiencia que entró para no dejar la tarde libre (regla 113): va aparte del mínimo-máximo. */
  const beforeFreeTimeEntries = new Set()
  /** Entradas de experiencia de un tema en el viaje (o en un día). */
  function experienceCount(theme, day = null) {
    let count = 0
    for (const id of experienceEntries) {
      if (beforeFreeTimeEntries.has(id)) continue
      const placed = placedDay.get(id)
      if (placed == null || (day && placed !== day.dayNumber)) continue
      if (themesOf(unitById.get(id)).includes(theme)) count++
    }
    return count
  }
  /** Contenedores de pago de una unidad (`contained_in` en algo con entrada). Solo para decidir
      rellenos: el campo "de pago" del lugar no cambia. */
  function paidContainerIdsOf(unit) {
    return unit.places
      .map((place) => place.contained_in)
      .filter(Boolean)
      .map((name) => unitIdOfPlace.get(name))
      .filter((id) => id && id !== unit.id && unitById.get(id)?.requiresTicket)
  }
  /** Lo del tema que solo puede entrar por la experiencia: lo de pago, o lo que está dentro de algo de pago. */
  const entersByExperience = (unit) => unit.priority === PRIORITY.THEME && (unit.requiresTicket || paidContainerIdsOf(unit).length > 0)
  /** ¿Cabe otra entrada de su experiencia? Sin pasar del máximo y repartidas entre días, no amontonadas. */
  function experienceRoom(day, unit) {
    return themesOf(unit).every(
      (theme) => experienceCount(theme) < EXPERIENCE_RANGE.max && experienceCount(theme, day) <= Math.min(...cityDays.map((other) => experienceCount(theme, other))),
    )
  }
  /** Tras colocar una unidad: si entró por su experiencia, cuenta; si volvió a entrar como relleno
      gratis (se quitó al podar la tarde y otro día la recogió de camino), ya no cuenta. */
  function recordEntry(unit) {
    if (entersByExperience(unit)) experienceEntries.add(unit.id)
    else experienceEntries.delete(unit.id)
  }
  /**
   * Días en los que puede ir por sus relaciones: si su contenedor o su vecino principal está en el
   * viaje, SOLO el día de él (lo de dentro no vuelve a salir otro día; el vecino que no cabe ese día
   * se queda fuera). null = sin restricción.
   */
  const mandatory = (unit) => unit.priority <= PRIORITY.ESSENTIAL
  // Miradores del atardecer por los que se eligió un barrio de cena (se llena en chooseDinners).
  const sunsetUnitIds = new Set()
  const relationDays = (unit) => {
    if (unit.isRevisit || unit.places.some((place) => place.passBy)) return null
    // Lo que pidió el viajero o es nivel 1 no se mueve ni se quita por una relación: es el otro
    // el que va con él (la Galería Borghese del pool, dentro del Parque: el Parque va su día).
    if (mandatory(unit)) return null
    // El mirador del atardecer manda sobre su vecino (decisión del 2026-09-24): el mirador va su
    // día; el vecino, justo antes si ese día cabe y está abierto, y si no, otro día.
    if (sunsetUnitIds.has(unit.id)) return null
    const forward = partnersOf(unit)
      .filter((id) => !sunsetUnitIds.has(id))
      .map((id) => placedDay.get(id))
    const reverse = units.filter((other) => mandatory(other) && partnersOf(other).includes(unit.id)).map((other) => placedDay.get(other.id))
    const days = [...forward, ...reverse].filter((day) => day != null)
    return days.length > 0 ? days : null
  }
  const revisited = new Set()
  const unplacedPool = []
  const unplacedEssentials = []
  const movedForJoya = new Set()
  // Días que se quedan sin su tema, y por qué. Nunca en silencio (ver paso 5).
  const quotaMisses = []

  // ── Utilidades ─────────────────────────────────────────────────────────────────────────────
  const dayUnits = (day) => day.open.units()
  /**
   * Cuántas VISITAS tiene el día: lo encadenado (un grupo, o sitios a <= 3 min, como Plaza Venecia +
   * Altar) cuenta como una. Es la medida del objetivo del ritmo (8-10 completo, 5-7 tranquilo); la
   * app sigue enseñando lugares, igual que el mapa y la lista.
   */
  // El Free Tour cuenta como los lugares que recorre (decisión del 2026-09-23): son cuatro visitas
  // hechas a pie con guía, no una.
  const tourPlaces = Math.max(1, (destData.default_free_tour?.covers ?? []).length)
  const visitCount = (day) => day.open.visits().reduce((count, visit) => count + (visit.chained ? 0 : visit.place.isFreeTour ? tourPlaces : 1), 0)
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
    // El mirador del atardecer de ese día: se llega en la ventana del atardecer y no se sale antes
    // de que se ponga el sol (ver simulate en scheduleDay.js).
    ...(day.sunsetMinutes != null && unit.places.some((place) => day.sunsetNames.has(place.name))
      ? { places: unit.places.map((place) => (day.sunsetNames.has(place.name) ? { ...place, sunset: day.sunsetMinutes } : place)) }
      : {}),
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
    if (!localRulesAllow(day, unit)) return false
    // Un relleno nunca es de pago (Paso 3, 2026-09-24): lo que pide entrada solo entra si es nivel 1,
    // del pool o de una experiencia elegida. Sin Arte, fuera el Ara Pacis o los Capitolinos. Lo que
    // está DENTRO de algo de pago tampoco es relleno salvo que su contenedor ya esté en la ruta (y
    // entonces va justo detrás). Un contenedor arrastrado por lo del pool o de una experiencia
    // (`draggedBy`) sí entra aunque sea de pago.
    if (!unit.draggedBy && !unit.isRevisit) {
      if (unit.priority === PRIORITY.FILLER) {
        if (unit.requiresTicket) return false
        if (paidContainerIdsOf(unit).some((id) => placedDay.get(id) == null)) return false
      } else if (entersByExperience(unit) && !experienceRoom(day, unit)) return false
    }
    // Días limitados y reserva obligatoria (`booking_required`, la Domus Aurea): no entra sola en la
    // ruta sin fechas — podría caer un martes, que está cerrada. Desde el pool sí (el viajero sabe lo
    // que pide); con fechas, como cualquier otro, solo los días que abre.
    if (!dateRangeStartIso && unit.poolIndex == null && unit.places.some((place) => place.booking_required)) return false
    if (bannedOnDay.has(`${day.dayNumber}|${unit.id}`)) return false
    const allowedDays = relationDays(unit)
    if (allowedDays && !allowedDays.includes(day.dayNumber)) return false
    if (closedThatDay(unit, day) || outOfSeason(unit, day)) return false
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
    // Antes de adelantar el día (plan B: el tranquilo a las 08:00), se prueba a quitar un relleno: el
    // madrugón, solo si de verdad hace falta (revisión del 2026-09-25).
    const displaceFiller = () => {
      if (!allowFallback || unit.priority > PRIORITY.ESSENTIAL || !fallbackMode) return false
      const fillers = dayUnits(day)
        .filter((other) => other.priority >= PRIORITY.FILLER && other.curatedIndex == null && other.poolIndex == null && !other.isRevisit && !experienceEntries.has(other.id))
        .sort((a, b) => b.minutes - a.minutes)
      for (const filler of fillers) {
        const snapshot = day.open.snapshot()
        day.open.remove(filler.id)
        if (day.open.add(withIndex)) {
          placedDay.delete(filler.id)
          return true
        }
        day.open.restore(snapshot)
      }
      return false
    }
    // Sin vaivenes (revisión del 2026-09-25): para meter una parada que no es imprescindible ni del
    // pool no se vuelve sobre los propios pasos más de 10 min; si no, va otro día (la Villa Farnesina,
    // que solo abre por la mañana, no se mete antes del Vaticano con 35 min de vuelta).
    const optional = unit.priority > PRIORITY.ESSENTIAL && unit.poolIndex == null && unit.curatedIndex == null && !unit.draggedBy
    const addWithinDetour = () => {
      if (!optional) return day.open.add(withIndex)
      const attempt = day.open.tryAdd(withIndex, { maxAddedWalk: BACKTRACK_MAX_MINUTES })
      return attempt ? day.open.add(attempt) : false
    }
    if (addWithinDetour() || displaceFiller() || (allowFallback && unit.priority <= PRIORITY.ESSENTIAL && day.open.tryWithFallback(withIndex, fallbackMode))) {
      placedDay.set(unit.id, day.dayNumber)
      droppedByRelation.delete(unit.id)
      recordEntry(unit)
      return true
    }
    return false
  }

  /**
   * Cómo planifica un local (Parte A): (1) una visita grande al día, y otra de pago por dentro solo si es
   * corta; (2) museos de pago de más, según los días del viaje (`museos_de_pago`); (3) museos parecidos
   * (`redundancias`: con los Vaticanos, los Capitolinos no). Lo del pool entra siempre.
   */
  function localRulesAllow(day, unit) {
    if (unit.poolIndex != null || unit.isFreeTour) return true
    const dayPlaces = dayUnits(day).filter((other) => other.id !== unit.id).flatMap((other) => other.places)
    if (breaksOneBigVisit(unit.places, dayPlaces)) return false
    if (unit.places.some(isPaidMuseum)) {
      const placedMuseums = units.filter((other) => other.id !== unit.id && other.poolIndex == null && placedDay.get(other.id) != null && other.places.some(isPaidMuseum)).length
      if (placedMuseums >= paidMuseumQuota(destData, cityDays.length)) return false
    }
    const tripNames = new Set(units.filter((other) => placedDay.get(other.id) != null).flatMap((other) => other.places.map((place) => place.name)))
    const matches = themesOf(unit).length > 0
    return !unit.places.some((place) => blockedByRedundancy(destData, place.name, tripNames, { contentDays: cityDays.length, experienceMatches: matches }))
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
      for (const unit of units) {
        if (unit.isFreeTour || placedDay.has(unit.id) || !unit.places.every((place) => covers.includes(place.name))) continue
        // El tour cubre lo que se ve por fuera y las iglesias gratis por las que entra (Paso 4). Un
        // imprescindible con interior de pago (el Panteón) NO se quita: se visita por dentro aparte
        // —antes del tour si el punto de encuentro está a 10 min o menos, si no después de comer—.
        if (unit.requiresTicket) {
          // Un grupo (Panteón + Navona): el tour cubre lo de fuera y en la ruta queda solo el interior.
          const paidInterior = (place) => !(place.is_free_access ?? place.type === 'exterior')
          const outside = unit.places.filter((place) => !paidInterior(place))
          if (outside.length > 0) {
            unit.places = unit.places.filter(paidInterior)
            coveredByFreeTour.push({ unitId: unit.id, names: outside.map((place) => place.name), dayNumber: tourDay.dayNumber })
          }
          continue
        }
        // Visto con el tour: cuenta como visitado y no se repite suelto, tampoco antes del tour.
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
      const closedEveryDay = cityDays.every((day) => closedThatDay(unit, day))
      const seasonalEveryDay = cityDays.every((day) => outOfSeason(unit, day))
      unplacedPool.push({
        unitId: unit.id,
        name: unit.places[0].name,
        reason: seasonalEveryDay ? 'out_of_season' : closedEveryDay ? 'closed_every_day' : unit.isLong ? 'no_room_long_visit' : 'no_room',
        closedOn: unit.closedOn,
        ...(seasonalEveryDay ? { available: unit.availableWindows[0] } : {}),
      })
    }
  }

  // ── Paso 4: el resto de imprescindibles ───────────────────────────────────────────────────
  // Primero las joyas, luego los imprescindibles: si no cabe todo, lo que se queda fuera es de abajo.
  const pendingLevel1 = units.filter((u) => u.priority > PRIORITY.POOL && u.priority <= PRIORITY.ESSENTIAL && !placedDay.has(u.id))
  for (const unit of pendingLevel1.sort((a, b) => a.priority - b.priority || b.minutes - a.minutes || a.id.localeCompare(b.id, 'es'))) {
    if (daysByProximity(unit).some((day) => placeOnDay(day, unit))) continue
    // Una joya nunca se queda fuera (revisión del 2026-09-25): si no cabe en ninguna mañana, va por la
    // tarde en un día sin otra visita larga (el Vaticano, en 2 días con Free Tour, la tarde del tour).
    const isJoya = unit.places.some((place) => place.tier === 'joya')
    const afternoonDay = isJoya
      ? daysByProximity(unit).find((day) => {
          if (!eligibleIgnoringCap(day, unit) || dayUnits(day).some((other) => other.isLong && other !== unit)) return false
          return day.open.tryLongAfterLunch(forDay(day, unit))
        })
      : null
    if (afternoonDay) {
      placedDay.set(unit.id, afternoonDay.dayNumber)
      recordEntry(unit)
      continue
    }
    // Si ni así, se hace sitio moviendo otra parada de ese día a otro día del viaje (sin perderla): el
    // Panteón por dentro pasa al día 2 y la tarde del Free Tour se queda para el Vaticano.
    const moved = isJoya
      ? daysByProximity(unit).some((day) => {
          if (!eligibleIgnoringCap(day, unit) || dayUnits(day).some((other) => other.isLong && other !== unit)) return false
          const movable = dayUnits(day).filter((other) => !other.isFreeTour && other.poolIndex == null && !other.isLong)
          return movable.some((other) => {
            const snapshots = new Map(cityDays.map((d) => [d, d.open.snapshot()]))
            const otherDay = placedDay.get(other.id)
            day.open.remove(other.id)
            placedDay.delete(other.id)
            if (day.open.tryLongAfterLunch(forDay(day, unit)) && cityDays.some((target) => target !== day && placeOnDay(target, other, { allowFallback: false }))) {
              for (const place of other.places) movedForJoya.add(place.name)
              placedDay.set(unit.id, day.dayNumber)
              recordEntry(unit)
              return true
            }
            for (const [d, snap] of snapshots) d.open.restore(snap)
            placedDay.set(other.id, otherDay)
            return false
          })
        })
      : false
    if (moved) continue
    unplacedEssentials.push({ unitId: unit.id, name: unit.places[0].name, reason: 'no_room' })
  }

  // ── Paso 4a: recorrido de tarde del destino (afternoon_flow) ──────────────────────────────
  // Misma preferencia que el reparto curado: el día que tiene lo gordo de una zona con recorrido de
  // tarde escrito a mano (Roma: salir del Vaticano por la Conciliazione y el Borgo Pio hacia el
  // Castillo) prefiere esos lugares y en ese orden.
  // El recorrido manda sobre el ORDEN de lo que comparte con el curado: se inserta entero donde
  // aparece su primer lugar. Añadido al final, el curado del día 3 ("... Plaza de San Pedro,
  // Castillo") ponía el Castillo antes que la Conciliazione y el día salía al revés.
  // Un mirador del recorrido con versión de noche (el Janículo) va al atardecer SI el sol se pone antes
  // de cenar en la época del viaje; si no, se queda de noche, como experiencia nocturna (decisión del
  // 2026-09-24). Sin época, se supone que sí da tiempo.
  const withNightVersion = new Set((destData.night_experiences ?? []).flatMap((entry) => entry.conflicts_with ?? []))
  // Del atardecer, solo los MIRADORES con versión de noche (el Janículo), no todo lo que la tenga (el
  // Puente Sant'Angelo tiene nocturna y no es un mirador).
  const isMirador = (name) => (destData.places?.find((place) => place.name === name)?.tags ?? []).includes('mirador')
  for (const day of cityDays) {
    const zonesOfDay = new Set(dayUnits(day).flatMap((unit) => unit.places.map((place) => place.zone)))
    for (const zone of zonesOfDay) {
      // Ese día el sol se pone a la hora de cenar o después: su mirador con versión de noche, de noche.
      // En verano la cena se retrasa a las 21:00 (Parte A, regla 8): el mirador puede ir al atardecer.
      const dinnerStart = day.sunsetMinutes != null && day.sunsetMinutes >= LATE_SUNSET_MINUTES ? LATE_DINNER_START : mode.dinnerWindow[0]
      // Si el sol se pone a la hora de cenar (la de verano, 21:00) o después, el mirador va de noche.
      const sunsetAfterDinner = day.sunsetMinutes != null && day.sunsetMinutes >= dinnerStart
      const flow = (destData.afternoon_flow?.[zone] ?? []).filter((name) => !(sunsetAfterDinner && withNightVersion.has(name) && isMirador(name)))
      for (const name of flow) if (withNightVersion.has(name) && isMirador(name)) day.sunsetNames.add(name)
      if (flow.length === 0) continue
      const firstShared = day.curatedNames.findIndex((name) => flow.includes(name))
      const rest = day.curatedNames.filter((name) => !flow.includes(name))
      const at = firstShared < 0 ? rest.length : rest.length - day.curatedNames.slice(firstShared).filter((name) => !flow.includes(name)).length
      day.curatedNames = [...rest.slice(0, at), ...flow, ...rest.slice(at)]
      // El recorrido fijado para la tarde de ese día: va por delante del relleno y sin sus topes.
      day.flowNames = new Set([...(day.flowNames ?? []), ...flow])
    }
  }

  // ── Regla de experiencias: solo se desvía lo que hace falta ────────────────────────────────
  const unitHasTheme = (unit, theme) => unit.tags.some((tag) => TAG_INTEREST_MAP[theme].includes(tag))
  /** ¿Hace falta este lugar para el mínimo de su experiencia en el viaje? */
  function neededForTheme(day, unit) {
    return themesOf(unit).some((theme) => experienceCount(theme) < EXPERIENCE_RANGE.min)
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
    // Lo gratis del tema es relleno normal (Paso 3, decisión A): entra como cualquier otro, con su
    // ventaja en la puntuación. Solo lo que entra POR la experiencia (lo de pago) va si hace falta o
    // si cae de camino.
    if (unit.priority !== PRIORITY.THEME || curatedIndexIn(day, unit) !== null || !entersByExperience(unit)) return true
    return neededForTheme(day, unit) || onTheWay(day, unit, attempt)
  }

  // ── Paso 6a (se llama después del relleno): dónde se cena cada día ────────────────────────
  // DESPUÉS del relleno (decisión del 2026-09-23): la tarde va primero adonde queda contenido sin
  // ver, y se cena donde acaba. Elegido antes, con solo lo gordo colocado, el barrio mandaba la
  // tarde hacia una zona ya agotada (3 días: el día del centro acababa a las 13:00 y cenaba en Roma
  // Antigua, vista el día 2) y la tarde se quedaba vacía.
  // Los barrios de cena salen solos de los restaurantes curados (dinnerZones.js). Desde donde acaba
  // la tarde, entre los que están a 30 min o menos, gana el que tiene más contenido SIN VER de camino
  // (hasta lo que cabe en la tarde que queda), con un extra si hay un mirador para el atardecer.
  // Repetir barrio de una noche a otra, solo a 15 min o menos. Es lo que manda el día del Vaticano a
  // cenar a Trastevere pasando por el Janículo sin escribirlo en ningún sitio.
  const dinnerOptions = dinnerZones(destData)
  function chooseDinners() {
    if (dinnerOptions.length === 0) return
    const leg = (a, b) => (a && b ? (travel.leg(a, b)?.minutes ?? Infinity) : 0)
    // El relleno de tarde de la primera vuelta es PROVISIONAL: se hizo sin saber dónde se cena. Se
    // aparta en todos los días para elegir el barrio desde donde acaba la parte fija de la tarde (el
    // Castillo, el día del Vaticano), contándolo como contenido sin ver; luego se rellena otra vez
    // hacia la cena elegida.
    const before = new Map()
    for (const day of cityDays) {
      const provisional = day.open
        .afternoonUnits()
        // Lo que entró por una experiencia no es relleno provisional: se queda (la Galería Borghese
        // del mínimo de Arte se perdía aquí y no volvía).
        .filter((unit) => unit.priority >= PRIORITY.THEME && unit.curatedIndex == null && !unit.isRevisit && !experienceEntries.has(unit.id) && !unit.places.some((place) => place.passBy))
      before.set(day, { snapshot: day.open.snapshot(), provisional })
      for (const unit of provisional) {
        day.open.remove(unit.id)
        placedDay.delete(unit.id)
      }
    }

    // Cada día puntúa cada barrio: contenido sin ver de camino (hasta lo que cabe en la tarde que
    // queda) + el extra del atardecer si hay un mirador de camino.
    const unseen = units.filter((unit) => !placedDay.has(unit.id) && !unit.isFreeTour)
    // Nocturnas que el viaje aún puede enseñar: ninguna de un lugar de nivel 2-3 ya visto de día.
    const placedNames = new Set(units.filter((unit) => placedDay.has(unit.id)).flatMap((unit) => unit.places.map((place) => place.name)))
    const levelOf = new Map((destData?.places ?? []).map((place) => [place.name, place.level]))
    const nightCoords = (destData?.night_experiences ?? [])
      .filter((entry) => Array.isArray(entry.coordinates) && !(entry.conflicts_with ?? []).some((name) => placedNames.has(name) && (levelOf.get(name) ?? 1) >= 2))
      .map((entry) => entry.coordinates)
    const hasNight = (coords) => nightCoords.some((c) => straightLineMeters(coords, c) <= NIGHT_REACH_METERS)
    const candidates = []
    for (const day of cityDays) {
      const from = day.open.endCoordinates() ?? day.seedCoords
      const idle = day.open.idleBeforeDinner() ?? 0
      const available = unseen.filter((unit) => (unit.priority <= PRIORITY.ESSENTIAL || mode.fillLevels.includes(unit.level)) && eligibleIgnoringCap(day, unit))
      for (const option of dinnerOptions) {
        const walk = leg(from, option.coordinates)
        if (walk > DINNER_MAX_WALK_MINUTES) continue
        // De camino: el rodeo para pasar por allí no pasa del desvío que admite el relleno.
        const onTheWay = available.filter((unit) => leg(from, unit.places[0].coordinates) + leg(unit.places.at(-1).coordinates, option.coordinates) - walk <= MAX_FILL_ADDED_WALK_MINUTES)
        const room = Math.max(0, idle - walk)
        const content = onTheWay.reduce((sum, unit) => sum + unit.minutes, 0)
        // El mirador del atardecer: el de camino con menos rodeo.
        const sunsetUnit = room >= SUNSET_MIN_ROOM_MINUTES
          ? onTheWay.filter((unit) => unit.tags.includes('mirador')).sort((a, b) => leg(from, a.places[0].coordinates) + leg(a.places.at(-1).coordinates, option.coordinates) - (leg(from, b.places[0].coordinates) + leg(b.places.at(-1).coordinates, option.coordinates)))[0] ?? null
          : null
        candidates.push({ day, option, walk, sunsetUnit, score: Math.min(content, room) + (sunsetUnit ? SUNSET_BONUS_MINUTES : 0) + (hasNight(option.coordinates) ? NIGHT_BONUS_MINUTES : 0) })
      }
    }

    // Reparto conjunto: la combinación de barrios que MÁS contenido suma en todo el viaje (a igualdad,
    // la que menos anda). Por turnos, el primer día se quedaba Trastevere por 32 minutos de ventaja y
    // el día del Vaticano, que perdía 63 sin él, acababa cenando donde no había nada que ver.
    // Un barrio lo pueden compartir varios días solo si todos menos uno están a 15 min o menos.
    // Son pocos días y pocos barrios (7 x 5 como mucho): se prueban todas las combinaciones.
    const bestAssignment = (excluded) => {
      const optionsOf = cityDays.map((day) => candidates.filter((c) => c.day === day && !excluded.has(c)))
      let best = null
      const chosen = []
      const search = (index, score, walk) => {
        if (index === cityDays.length) {
          if (!best || score > best.score || (score === best.score && walk < best.walk)) best = { score, walk, picks: [...chosen] }
          return
        }
        const options = optionsOf[index]
        for (const candidate of options.length > 0 ? options : [null]) {
          const sharing = candidate ? [...chosen.filter((c) => c && c.option.id === candidate.option.id), candidate] : []
          if (sharing.filter((c) => c.walk > DINNER_REPEAT_MAX_WALK_MINUTES).length > 1) continue
          chosen.push(candidate)
          search(index + 1, score + (candidate?.score ?? 0), walk + (candidate?.walk ?? 0))
          chosen.pop()
        }
      }
      search(0, 0, 0)
      return best?.picks ?? []
    }
    // Si con el paseo hasta allí un día deja de caber, esa opción se descarta y se vuelve a repartir.
    const excluded = new Set()
    let picks = bestAssignment(excluded)
    for (let round = 0; round < candidates.length; round++) {
      const failed = picks.find((pick) => pick && !pick.day.open.setDinnerPoint(pick.option.coordinates))
      if (!failed) break
      excluded.add(failed)
      picks = bestAssignment(excluded)
    }
    for (const pick of picks) {
      if (!pick || !pick.day.open.setDinnerPoint(pick.option.coordinates)) continue
      const { day, option, walk } = pick
      const shared = picks.some((other) => other && other !== pick && other.option.id === option.id)
      day.dinnerZone = option.id
      day.dinnerPlaceZone = option.placeZone
      day.dinnerCoords = option.coordinates
      day.dinnerDisplay = option.display
      // Si el barrio ganó por el atardecer, ese mirador entra el primero (ver más abajo).
      day.sunsetUnit = pick.sunsetUnit ?? null
      if (day.sunsetUnit) {
        sunsetUnitIds.add(day.sunsetUnit.id)
        for (const place of day.sunsetUnit.places) if ((place.tags ?? []).includes('mirador')) day.sunsetNames.add(place.name)
      }
      // Para poder comprobarlo: si comparte barrio con otro día, a cuánto estaba (solo el que no
      // repite puede estar a más de 15 min).
      day.dinnerRepeatWalk = shared && walk <= DINNER_REPEAT_MAX_WALK_MINUTES ? walk : null
    }

    // Sin barrio posible (todo a más de 30 min, o el paseo no cabe): el día se queda como estaba.
    for (const day of cityDays) {
      if (day.dinnerZone) continue
      const { snapshot, provisional } = before.get(day)
      day.open.restore(snapshot)
      for (const unit of provisional) placedDay.set(unit.id, day.dayNumber)
    }
  }

  // ── Paso 5: mínimo de cada experiencia en el VIAJE (sustituye a la cuota por día) ────────────
  // 1 día: 1 · 2-3 días: 2-3 · más de 3: 3-4, sin contar imprescindibles. Primero se da por buena lo
  // del tema que ya está en la ruta como relleno; si falta, se añade, repartido entre días (el que
  // menos lleva del tema primero) y nivel 2 antes que nivel 3. Nunca cruzando la ciudad.
  /** Lo característico del tema va primero: la posición de su mejor etiqueta en la lista del tema
      (museo antes que iglesia en Arte, barrio antes que plaza en Barrios, mirador antes que fuente). */
  const coreness = (unit, theme) => Math.min(...unit.tags.map((tag) => TAG_INTEREST_MAP[theme].indexOf(tag)).filter((index) => index >= 0))
  /**
   * Lo más representativo del tema va primero (decisión del 2026-09-24): la lista editorial del
   * destino si la tiene (`destination_config.experience_highlights`), y si no, el que tiene más
   * etiquetas del tema, luego la más característica y luego el nivel. La geografía decide el DÍA, no
   * si entra: la Galería Borghese no puede perder contra los Mercados de Trajano por estar lejos.
   */
  const highlightIndex = (unit, theme) => {
    const list = destData.destination_config?.experience_highlights?.[theme] ?? []
    const indices = unit.places.map((place) => list.indexOf(place.name)).filter((index) => index >= 0)
    return indices.length > 0 ? Math.min(...indices) : Infinity
  }
  const themeTagCount = (unit, theme) => unit.tags.filter((tag) => TAG_INTEREST_MAP[theme].includes(tag)).length
  const byRepresentativeness = (theme) => (a, b) =>
    highlightIndex(a, theme) - highlightIndex(b, theme) ||
    themeTagCount(b, theme) - themeTagCount(a, theme) ||
    coreness(a, theme) - coreness(b, theme) ||
    a.level - b.level ||
    a.id.localeCompare(b.id, 'es')
  /** null si la experiencia llega a su mínimo; si no, el motivo. */
  function fulfilMinimum(theme) {
    const ofTheme = (unit) => unit.priority === PRIORITY.THEME && themesOf(unit).includes(theme)
    for (const day of cityDays) {
      for (const unit of dayUnits(day)) {
        if (experienceCount(theme) >= EXPERIENCE_RANGE.min) return null
        if (ofTheme(unit) && !experienceEntries.has(unit.id) && unit.curatedIndex == null) experienceEntries.add(unit.id)
      }
    }
    let candidates = []
    while (experienceCount(theme) < EXPERIENCE_RANGE.min) {
      candidates = units.filter((unit) => (!placedDay.has(unit.id) || droppedByRelation.has(unit.id)) && ofTheme(unit)).sort(byRepresentativeness(theme))
      // Repartidas: a cada día de los que menos llevan del tema, lo más representativo que tenga cerca.
      // Si ninguno tiene nada cerca, lo más representativo en el día que le pille más cerca: la
      // geografía decide el día, no si entra.
      let placed = null
      const fewest = Math.min(...cityDays.map((day) => experienceCount(theme, day)))
      for (const day of cityDays.filter((d) => experienceCount(theme, d) === fewest)) {
        placed = candidates.find((unit) => walkFromDay(day, unit) <= NEAR_WALK_MINUTES && placeOnDay(day, unit)) ?? null
        if (placed) break
      }
      for (const unit of placed ? [] : candidates) {
        const days = cityDays.map((day) => ({ day, walk: walkFromDay(day, unit) })).sort((a, b) => a.walk - b.walk || a.day.dayNumber - b.day.dayNumber)
        if (days.some(({ day }) => placeOnDay(day, unit))) {
          placed = unit
          break
        }
      }
      if (!placed) return candidates.length === 0 ? 'none_near' : 'no_room'
      experienceEntries.add(placed.id)
    }
    return null
  }
  const refreshMinimums = () => {
    quotaMisses.length = 0
    for (const theme of selectedThemes) {
      const reason = fulfilMinimum(theme)
      if (reason) quotaMisses.push({ dayNumber: null, theme, reason })
    }
  }
  refreshMinimums()

  // ── Paso 6d: el barrio, el día que se cena en él (decisión del 2026-09-25) ──────────────────
  // Si un barrio (Trastevere) es el barrio de cena de OTRO día y le queda de camino al final de ese
  // día, el barrio va ese día, bajando del mirador a cenar; el día de donde sale se rellena con lo
  // que tiene cerca. Lo de dentro del barrio se va con él (enforceRelations).
  function moveBarriosToDinnerDay() {
    for (const day of cityDays) {
      for (const unit of [...dayUnits(day)]) {
        // Solo el barrio de verdad, nunca su revisita ni un paso por fuera.
        if (!(unit.tags ?? []).includes('barrio') || unit.curatedIndex != null || unit.isRevisit || unit.places.some((place) => place.passBy)) continue
        // Lo que va DENTRO del barrio ese día (la Plaza Trilussa, en Trastevere) no se queda sin él: si
        // lo hay, el barrio no se mueve solo.
        const names = new Set(unit.places.map((place) => place.name))
        if (dayUnits(day).some((other) => other !== unit && other.places.some((place) => names.has(place.contained_in)))) continue
        const zone = unit.places[0]?.zone
        const target = cityDays.find((other) => {
          // Ese otro día se cena en el barrio: se llega a él bajando a cenar.
          if (other === day || other.dinnerPlaceZone !== zone || !other.dinnerCoords) return false
          return (travel.leg(other.dinnerCoords, unit.places[0].coordinates)?.minutes ?? Infinity) <= BARRIO_TO_DINNER_MAX_WALK_MINUTES
        })
        if (!target) continue
        const wasEntry = experienceEntries.has(unit.id)
        const before = day.open.snapshot()
        const beforeTarget = target.open.snapshot()
        day.open.remove(unit.id)
        placedDay.delete(unit.id)
        if (placeOnDay(target, unit)) {
          if (wasEntry) experienceEntries.add(unit.id)
          continue
        }
        day.open.restore(before)
        target.open.restore(beforeTarget)
        placedDay.set(unit.id, day.dayNumber)
        if (wasEntry) experienceEntries.add(unit.id)
      }
    }
  }

  // ── Paso 6: relleno, primero los primeros días ────────────────────────────────────────────
  // Cada parada nueva va al PRIMER día que todavía la necesita (decisión del 2026-09-24): si el
  // destino no da para llenar todas las tardes, el tiempo libre cae al final del viaje, nunca en el
  // día 2. Antes iba por turnos (una a cada día) y la tarde libre salía en cualquier día.
  // El objetivo es el MÍNIMO del ritmo (8 completo, 5 tranquilo); hasta el máximo solo se sube con
  // paradas que caen de camino. Rellenar hasta 10 a cualquier precio es el "relleno obsesivo" que
  // se quería quitar.
  const minTargetOf = (day) => (day.allowsRepetition ? RELAXED_DAY_TARGET_STOPS : mode.targetStops[0])
  const maxTargetOf = (day) => (day.allowsRepetition ? RELAXED_DAY_TARGET_STOPS : mode.targetStops[1])
  function fillRounds() {
    // Dos fases: por turnos hasta que todos los días lleguen al mínimo de su ritmo (si no, el día 1 se
    // queda lo cercano y el día 2 se queda corto); después, lo que sobra, primero en los primeros días.
    const stuck = new Set() // días que no llegan al mínimo con nada: no bloquean la segunda fase
    let progress = true
    while (progress) {
      progress = false
      const needy = cityDays.filter((day) => !stuck.has(day) && visitCount(day) < minTargetOf(day))
      const firstPhase = needy.length > 0
      for (const day of firstPhase ? needy : cityDays) {
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
              .map((unit) => ({
                ...unit,
                id: `${unit.id} (revisita)`,
                originalId: unit.id,
                isRevisit: true,
                revisitReason: whyTexts.revisit(placeWithArticle(destData.places?.find((place) => place.name === unit.places[0]?.name) ?? unit.places[0]), placedDay.get(unit.id), unit.minutes ?? unit.places[0]?.duration_minutes ?? 30),
                priority: PRIORITY.FILLER,
              }))
          : []
  
        let best = null
        for (const unit of [...fresh, ...revisits]) {
          // En tranquilo el nivel 3 no entra como relleno: 5-7 paradas gastadas en tercera fila es lo
          // que hace que un día tranquilo se sienta vacío en vez de tranquilo.
          // Lo que el destino escribió para ESE día (el Borgo Pio del recorrido de tarde del Vaticano) no
          // es relleno: entra aunque sea de nivel 3.
          if (unit.priority > PRIORITY.ESSENTIAL && !mode.fillLevels.includes(unit.level) && curatedIndexIn(day, unit) === null) continue
          // Lo que el destino fijó para ese día (su recorrido de tarde) no tiene que estar "cerca": es el camino.
          if ((!unit.places.some((place) => day.flowNames?.has(place.name)) && walkFromDay(day, unit) > NEAR_WALK_MINUTES) || !eligibleIgnoringCap(day, unit)) continue
          // Fuera de su tope de categoría solo entra si va de camino, sin desvío — y entonces no cuenta.
          const overCap = !withinCategoryCap(day, unit)
          const candidate = overCap ? { ...forDay(day, unit), capExempt: true } : forDay(day, unit)
          // Con la tarde todavía vacía se admite un desvío corto; con la tarde ya llena, solo lo que
          // cae de camino. Por minutos, no por número de paradas: con "a partir de 8 paradas, solo de
          // camino", el día del Free Tour (una "parada" de 2h30) se cerraba a las 16:10.
          // El recorrido que el destino fijó para ese día es el camino, no un desvío: sin topes de relleno
          // (Castillo → Mirador del Janículo → Fontana dell'Acqua Paola → Trastevere).
          const fixedForDay = unit.places.some((place) => day.flowNames?.has(place.name))
          const walkCap = fixedForDay ? Infinity : overCap || !afternoonEmpty ? ON_THE_WAY_MINUTES : MAX_FILL_ADDED_WALK_MINUTES
          const attempt = day.open.tryAdd(candidate, { maxAddedWalk: walkCap })
          if (!attempt) continue
          if (!fixedForDay && attempt.addedCost > (aboveMinimum ? CHEAP_FILL_ADDED_MINUTES : MAX_FILL_ADDED_MINUTES)) continue
          if (!themeMayEnter(day, unit, attempt)) continue
          const score =
            (matchesTheme(unit) ? FILL_SCORE.theme : 0) +
            (unit.level === 1 ? FILL_SCORE.level1 : unit.level === 2 ? FILL_SCORE.level2 : 0) +
            (curatedIndexIn(day, unit) !== null ? FILL_SCORE.curatedForDay : 0) +
            // Lo del recorrido fijado entra en su orden (el Castillo antes que Trastevere): si entra
            // después lo de más adelante, ya no queda sitio para lo de antes sin perder el atardecer.
            (fixedForDay ? FILL_SCORE.fixedFlow - (curatedIndexIn(day, unit) ?? 0) * FILL_SCORE.fixedFlowStep : 0) +
            (unit.isRevisit ? FILL_SCORE.revisit : 0) -
            attempt.addedCost * FILL_SCORE.perAddedMinute -
            // El paseo añadido cuenta además de en el coste: a igualdad, lo que está más a mano.
            attempt.addedWalk * FILL_SCORE.perAddedMinute
          if (!best || score > best.score || (score === best.score && unit.id.localeCompare(best.unit.id, 'es') < 0)) best = { unit, attempt, score }
        }
        if (!best) {
          if (firstPhase) {
            stuck.add(day)
            progress = true // se vuelve a mirar sin él
          }
          continue
        }
        day.open.add(best.attempt)
        if (best.unit.isRevisit) {
          revisited.add(best.unit.originalId)
          day.revisits++
        } else {
          placedDay.set(best.unit.id, day.dayNumber)
          recordEntry(best.unit)
        }
        progress = true
        if (!firstPhase) break // segunda fase: se vuelve a empezar por el día 1
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
      // Lo de dentro no va sin su contenedor (Paso 3): si entra la Fuente de las Tortugas, entra el
      // Barrio Judío ese día, justo delante. Si el contenedor no cabe o no puede entrar, fuera lo de
      // dentro.
      for (const day of cityDays) {
        for (const unit of dayUnits(day)) {
          if (unit.isRevisit || unit.places.some((place) => place.passBy)) continue
          const containerIds = [...new Set(unit.places.map((place) => place.contained_in).filter(Boolean).map((name) => unitIdOfPlace.get(name)).filter((id) => id && id !== unit.id))]
          for (const containerId of containerIds) {
            if (placedDay.get(containerId) != null) continue
            const container = units.find((candidate) => candidate.id === containerId)
            // Lo del pool o de una experiencia arrastra su contenedor aunque sea de pago (cuentan como 1).
            const drags = mandatory(unit) || experienceEntries.has(unit.id)
            if (container && placeOnDay(day, drags ? { ...container, draggedBy: unit.id } : container)) {
              changed = true
              continue
            }
            if (mandatory(unit)) continue // lo que pidió el viajero o es nivel 1 se queda igualmente
            day.open.remove(unit.id)
            placedDay.set(unit.id, null)
            droppedByRelation.add(unit.id)
            changed = true
            break
          }
        }
      }
    }
  }

  fillRounds()
  enforceRelations()
  fillRounds()
  // Con la tarde ya llena, dónde se cena; y otra vuelta de relleno, ya en esa dirección.
  chooseDinners()
  // ── Paso 6c: la nocturna que pilla al lado de la tarde, al atardecer (Paso 5, 2026-09-24) ────
  // Si la experiencia nocturna de una noche está a 10 min o menos de una parada de esa tarde, se ve
  // en la tarde, al atardecer, y no bajando a cenar para volver a subir a las 21:30 (la Fontana
  // dell'Acqua Paola → el Mirador del Janículo → cena en Trastevere). Visto de día, su versión de
  // noche ya no sale esa noche. Las cadenas de varias nocturnas (Panteón → Trevi → España) no se tocan.
  function nightToSunset() {
    const nightsNow = planNightWalks(destData, nightWalkPlan({
      days: skeleton.map((day) => {
        const city = cityDays.find((d) => d.dayNumber === day.dayNumber)
        return city ? { ...day, dinnerZone: city.dinnerZone, dinnerPlaceZone: city.dinnerPlaceZone, hours: { weekday: city.weekday ?? null, season: seasonOfTrip, dateIso: city.dateIso, sunset: city.sunsetMinutes }, schedule: { visits: city.open.visits() } } : { ...day, schedule: null }
      }),
    }))
    for (const day of cityDays) {
      const chain = nightsNow.get(day.dayNumber) ?? []
      if (chain.length !== 1) continue
      const entry = chain[0]
      const unit = units.find((candidate) => candidate.places.some((place) => (entry.conflicts_with ?? []).includes(place.name)))
      if (!unit || placedDay.get(unit.id) != null || !eligibleIgnoringCap(day, unit)) continue
      const lunchEnd = day.open.meals().find((meal) => meal.type === 'lunch')?.end ?? 0
      const nearAfternoon = day.open.visits().some((visit) => visit.start >= lunchEnd && (travel.leg(visit.place.coordinates, entry.coordinates)?.minutes ?? Infinity) <= NIGHT_TO_AFTERNOON_MINUTES)
      if (!nearAfternoon) continue
      for (const place of unit.places) day.sunsetNames.add(place.name)
      const attempt = day.open.tryAdd(forDay(day, unit), { maxAddedWalk: NIGHT_TO_SUNSET_MAX_ADDED_WALK_MINUTES })
      if (!attempt) continue
      day.open.add(attempt)
      placedDay.set(unit.id, day.dayNumber)
      recordEntry(unit)
    }
  }

  nightToSunset()
  moveBarriosToDinnerDay()
  // El mirador del atardecer por el que se eligió el barrio va antes que el resto del relleno: si no,
  // otras paradas de camino se quedan su hueco y el día cena en Trastevere sin haber subido.
  for (const day of cityDays) {
    const unit = day.sunsetUnit
    if (!unit || placedDay.has(unit.id) || !eligibleIgnoringCap(day, unit)) continue
    const attempt = day.open.tryAdd(forDay(day, unit), { maxAddedWalk: MAX_FILL_ADDED_WALK_MINUTES })
    if (attempt) {
      day.open.add(attempt)
      placedDay.set(unit.id, day.dayNumber)
      recordEntry(unit)
    }
  }
  fillRounds()
  enforceRelations()

  // Segundo repaso de la cuota con los días ya completos: en el paso 5 el día solo tenía sus
  // imprescindibles, y "no hay nada del tema cerca" era verdad entonces pero puede dejar de serlo
  // cuando el relleno lo acerca a otra zona.
  refreshMinimums()

  // ── Paso 6b: la tarde sin zigzag ──────────────────────────────────────────────────────────
  // Con la tarde ya llena, se prueba su orden entero (el que menos camina) y se quita el relleno que
  // obliga a volver atrás. Lo quitado no vuelve a ese día; se rellena otra vez con lo que sí cae de
  // camino, y así hasta que no quede nada que quitar.
  const isRemovableIn = () => (unit) =>
    unit.priority >= PRIORITY.THEME &&
    unit.curatedIndex == null &&
    !unit.places.some((place) => place.passBy) &&
    // El mínimo de experiencias no se baja.
    !(experienceEntries.has(unit.id) && themesOf(unit).some((theme) => experienceCount(theme) <= EXPERIENCE_RANGE.min))
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
  refreshMinimums()
  // Lo que entra en este último repaso puede dejar un vecino en otro día (el Parque de Villa Borghese
  // el día 5 con el Pincio el día 1): se aplican otra vez las relaciones y, si algo se cae, el mínimo.
  enforceRelations()
  refreshMinimums()

  // Otra vez con la tarde ya definitiva: la parada de al lado (la Fontana dell'Acqua Paola) puede haber
  // entrado después de elegir la cena.
  nightToSunset()
  enforceRelations()
  refreshMinimums()

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
      return city ? { ...day, dinnerZone: city.dinnerZone, dinnerPlaceZone: city.dinnerPlaceZone, hours: { weekday: city.weekday ?? null, season: seasonOfTrip, dateIso: city.dateIso, sunset: city.sunsetMinutes }, schedule: { visits: city.open.visits() } } : { ...day, schedule: null }
    }),
  }))
  const firstSeenDay = new Map()
  for (const day of cityDays) {
    for (const visit of day.open.visits()) if (!firstSeenDay.has(visit.place.name)) firstSeenDay.set(visit.place.name, day.dayNumber)
  }
  for (const item of coveredByFreeTour) for (const name of item.names) if (!firstSeenDay.has(name)) firstSeenDay.set(name, item.dayNumber)

  for (const day of cityDays) {
    const tonight = new Set((nightsBeforePassBy.get(day.dayNumber) ?? []).flatMap((entry) => entry.conflicts_with ?? []))
    const dinnerDisplay = day.dinnerDisplay ?? ''
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

  // ── Miradores al atardecer si el día tiene tiempo (revisión del 2026-09-25) ────────────────
  // Si al día le sobra tiempo, un mirador que va a otra hora (el Pincio a las 12:00) pasa a la hora del
  // atardecer: el tiempo sobrante se usa antes, no después. Solo si sigue cabiendo todo.
  for (const day of cityDays) {
    if (day.sunsetMinutes == null || day.sunsetUnit || (day.open.idleBeforeDinner() ?? 0) < SUNSET_MIN_ROOM_MINUTES) continue
    const isMirador = (place) => (place.tags ?? []).includes('mirador') && !place.passBy
    const mirador = dayUnits(day).find((unit) => !unit.isRevisit && unit.places.some(isMirador) && !unit.places.some((place) => place.sunset != null))
    if (!mirador) continue
    const name = mirador.places.find(isMirador).name
    const snapshot = day.open.snapshot()
    day.open.remove(mirador.id)
    day.sunsetNames.add(name)
    if (day.open.add(forDay(day, mirador))) {
      day.sunsetUnit = mirador
      sunsetUnitIds.add(mirador.id)
    } else {
      day.sunsetNames.delete(name)
      day.open.restore(snapshot)
    }
  }

  // ── Antes de una tarde libre, lo de la experiencia elegida (revisión del 2026-09-25) ────────
  // La experiencia se tiene que notar: si al día le sobra la tarde (90 min o más antes de cenar), entra
  // lo de sus experiencias que quepa, en el orden de `experience_highlights` (lo más representativo
  // primero), aunque ya se haya llegado al máximo de la experiencia. Lo de pago, solo si aún hay sitio
  // para ello (su mínimo-máximo y, con la Parte A, `museos_de_pago`); lo gratis, siempre.
  // Las relaciones mandan también en estos pasos finales (van después de enforceRelations): lo de
  // dentro de otro, solo el día de su contenedor; los vecinos y los accesos, el de su pareja.
  // En los dos sentidos: la vecindad puede estar escrita en uno solo de los dos lugares (Santa Maria del
  // Popolo → Piazza del Popolo).
  const relationPartnersOf = (name) =>
    (destData.places ?? []).flatMap((place) => {
      const own = place.name === name ? [place.contained_in, ...(place.neighbor_of ?? []), ...(place.approach_to ?? [])] : []
      const reverse = place.name !== name && (place.contained_in === name || (place.neighbor_of ?? []).includes(name) || (place.approach_to ?? []).includes(name)) ? [place.name] : []
      return [...own, ...reverse]
    })
  const relationsAllow = (unit, day) => {
    const allowed = relationDays(unit)
    if (allowed && !allowed.includes(day.dayNumber)) return false
    const partners = unit.places.flatMap((place) => relationPartnersOf(place.name)).filter(Boolean)
    return partners.every((name) => {
      const id = unitIdOfPlace.get(name)
      const partnerDay = id && id !== unit.id ? placedDay.get(id) : undefined
      return partnerDay == null || partnerDay === day.dayNumber
    }) && unit.places.every((place) => !place.contained_in || placedDay.get(unitIdOfPlace.get(place.contained_in)) === day.dayNumber || unitIdOfPlace.get(place.contained_in) === unit.id)
  }
  if (selectedThemes.length > 0) {
    for (const day of cityDays) {
      for (let round = 0; round < 6; round++) {
        if ((day.open.idleBeforeDinner() ?? 0) < FREE_AFTERNOON_IDLE_MINUTES) break
        const candidates = units
          .filter((unit) => !unit.isFreeTour && !placedDay.has(unit.id) && unit.priority === PRIORITY.THEME)
          .filter((unit) => (unit.requiresTicket ? eligible(day, unit) : !closedThatDay(unit, day) && !outOfSeason(unit, day)))
          .filter((unit) => relationsAllow(unit, day))
          .map((unit) => ({ unit, rank: Math.min(...themesOf(unit).filter((theme) => selectedThemes.includes(theme)).map((theme) => highlightIndex(unit, theme))) }))
          .sort((a, b) => a.rank - b.rank || a.unit.level - b.unit.level || a.unit.id.localeCompare(b.unit.id, 'es'))
        const next = candidates.find(({ unit }) => {
          const attempt = day.open.tryAdd(forDay(day, unit), { maxAddedWalk: EXPERIENCE_BEFORE_FREE_MAX_WALK })
          if (!attempt) return false
          day.open.add(attempt)
          placedDay.set(unit.id, day.dayNumber)
          experienceEntries.add(unit.id)
          beforeFreeTimeEntries.add(unit.id)
          return true
        })
        if (!next) break
      }
    }
  }

  // ── Y después, lo gratis de nivel 2 que falte (revisión del 2026-09-25) ───────────────────
  // Antes de dejar una tarde libre (días largos: el 6 y el 7), entran los lugares gratis de nivel 2 que
  // aún no están en el viaje (el Parque de Villa Borghese, el Aventino), de más cerca a más lejos.
  for (const day of cityDays) {
    for (let round = 0; round < 6; round++) {
      if ((day.open.idleBeforeDinner() ?? 0) < FREE_AFTERNOON_IDLE_MINUTES) break
      const candidates = units
        .filter((unit) => !unit.isFreeTour && !placedDay.has(unit.id) && unit.level <= 2 && !unit.requiresTicket && !unit.isRevisit)
        .filter((unit) => !closedThatDay(unit, day) && !outOfSeason(unit, day) && !paidContainerIdsOf(unit).some((id) => placedDay.get(id) == null))
        .filter((unit) => relationsAllow(unit, day))
        .map((unit) => ({ unit, walk: walkFromDay(day, unit) }))
        .sort((a, b) => a.walk - b.walk || a.unit.id.localeCompare(b.unit.id, 'es'))
      const next = candidates.find(({ unit }) => {
        const attempt = day.open.tryAdd(forDay(day, unit), { maxAddedWalk: EXPERIENCE_BEFORE_FREE_MAX_WALK })
        if (!attempt) return false
        day.open.add(attempt)
        placedDay.set(unit.id, day.dayNumber)
        return true
      })
      if (!next) break
    }
  }

  // ── Huecos a mitad de día (decisión del 2026-09-25) ──────────────────────────────────────
  // Si entre dos visitas quedan 60 min o más de espera (a la hora del atardecer, a que abra algo),
  // primero entra lo GRATIS que quede de camino, sin contar topes de categoría: es tiempo que ya
  // estaba perdido. También la parte gratis de un grupo de pago que no está en la ruta, con lo de
  // pago visto por fuera (el Puente Sant'Angelo, con el Castillo por fuera). Lo que siga quedando es
  // "Tiempo libre" con sugerencias (lo pone el servidor, ver midDayFreeFor).
  // La comida no es un hueco: entre dos visitas con la comida en medio no se mira.
  // `before`: una vez abierto un hueco de 60+, se sigue llenando ESE mismo hueco mientras quepa algo
  // gratis de camino (tras el Puente quedaban 45 min: cabe el Tempietto).
  const midGapOf = (visits, meals = [], before = null) => {
    let worst = null
    for (let i = 1; i < visits.length; i++) {
      if (meals.some((meal) => meal.start >= visits[i - 1].end && meal.start < visits[i].start)) continue
      const gap = visits[i].start - visits[i - 1].end - (visits[i].walkMinutes ?? 0)
      if (before && visits[i].place.name !== before) continue
      if (gap >= (before ? 1 : MID_DAY_GAP_MINUTES) && (!worst || gap > worst.gap)) worst = { gap, before: visits[i].place.name, start: visits[i].start }
    }
    return worst
  }
  const tourNames = new Set(coveredByFreeTour.flatMap((item) => item.names))
  const outsideVariant = (unit) => {
    const free = unit.places.filter((place) => (place.is_free_access ?? place.type === 'exterior'))
    const paid = unit.places.filter((place) => !(place.is_free_access ?? place.type === 'exterior'))
    if (free.length === 0 || paid.length === 0 || !paid.every((place) => place.visible_from_outside)) return null
    const outsideOf = paid.map((place) => place.name)
    return {
      ...unit,
      id: `${unit.id} (por fuera)`,
      outsideOfUnitId: unit.id,
      places: free.map((place) => ({ ...place, outsideOf })),
      minutes: free.reduce((sum, place) => sum + (place.duration_minutes ?? 30), 0),
      requiresTicket: false,
      closedOn: [],
      priority: PRIORITY.FILLER,
    }
  }
  for (const day of cityDays) {
    let filling = null
    for (let round = 0; round < 4; round++) {
      const gap = midGapOf(day.open.visits(), day.open.meals(), filling)
      if (!gap) break
      filling = gap.before
      const onDay = new Set(day.open.visits().map((visit) => visit.place.name))
      const candidates = units
        .filter((unit) => !unit.isFreeTour && !placedDay.has(unit.id) && unit.places.every((place) => !onDay.has(place.name) && !tourNames.has(place.name)))
        .map((unit) => (unit.requiresTicket ? outsideVariant(unit) : unit))
        .filter((unit) => unit && !closedThatDay(unit, day) && !outOfSeason(unit, day))
        .filter((unit) => !paidContainerIdsOf(unit).some((id) => placedDay.get(id) == null))
        // Las relaciones mandan también aquí (este paso va después de enforceRelations): lo de dentro de
        // otro, solo el día de su contenedor (la Plaza Trilussa, el día de Trastevere); los vecinos, el
        // de su pareja.
        .filter((unit) => {
          const original = unit.outsideOfUnitId ? units.find((u) => u.id === unit.outsideOfUnitId) ?? unit : unit
          if (!relationsAllow(original, day)) return false
          const allowed = relationDays(original)
          if (allowed && !allowed.includes(day.dayNumber)) return false
          const containers = unit.places.map((place) => place.contained_in).filter(Boolean).map((name) => unitIdOfPlace.get(name)).filter((id) => id && id !== unit.id)
          return containers.every((id) => placedDay.get(id) === day.dayNumber)
        })
      let best = null
      for (const unit of candidates) {
        const attempt = day.open.tryAdd({ ...forDay(day, unit), gapFillerBefore: gap.before, capExempt: true }, { maxAddedWalk: MAX_FILL_ADDED_WALK_MINUTES })
        if (!attempt) continue
        // Solo vale si va DENTRO del hueco: la parada con hora sigue en su ventana (el programador ya lo
        // comprueba; puede correrse un cuarto dentro de la del atardecer) y el hueco se acorta.
        const preview = day.open.preview(attempt.sequence).visits
        const fixed = preview.find((visit) => visit.place.name === gap.before)
        const after = midGapOf(preview, day.open.preview(attempt.sequence).meals, gap.before)
        if (!fixed || fixed.start < gap.start || (after && after.gap >= gap.gap)) continue
        const origin = unit.outsideOfUnitId ?? unit.id
        if (!best || attempt.addedCost < best.attempt.addedCost) best = { attempt, origin }
      }
      if (!best) break
      day.open.add(best.attempt)
      placedDay.set(best.origin, day.dayNumber)
    }
  }

  // ── La cena, donde acaba el día de verdad ─────────────────────────────────────────────────
  // El barrio se eligió antes de terminar la tarde; si al final la cena queda a más de 15 min de la
  // última parada, se cambia por el barrio de cena más cercano a ella (si lo hay a 15 min o menos).
  for (const day of cityDays) {
    const end = day.open.endCoordinates()
    if (!end || !day.dinnerCoords) continue
    const walkTo = (coords) => travel.leg(end, coords)?.minutes ?? Infinity
    if (walkTo(day.dinnerCoords) <= DINNER_MAX_WALK_MINUTES) continue
    const nearest = dinnerOptions.map((option) => ({ option, walk: walkTo(option.coordinates) })).filter((item) => item.walk <= DINNER_MAX_WALK_MINUTES).sort((a, b) => a.walk - b.walk)[0]
    if (!nearest || !day.open.setDinnerPoint(nearest.option.coordinates)) continue
    day.dinnerZone = nearest.option.id
    day.dinnerPlaceZone = nearest.option.placeZone
    day.dinnerCoords = nearest.option.coordinates
    day.dinnerDisplay = nearest.option.display
  }

  // ── Resultado ─────────────────────────────────────────────────────────────────────────────
  const labelled = (unit) => (experienceEntries.has(unit.id) ? { ...unit, experienceTheme: themesOf(unit)[0] ?? null } : unit)
  const finished = new Map(cityDays.map((day) => [day.dayNumber, { units: dayUnits(day).map(labelled), schedule: day.open.finish(), dinnerZone: day.dinnerZone, dinnerPlaceZone: day.dinnerPlaceZone ?? null, dinnerRepeatWalk: day.dinnerRepeatWalk ?? null, sunsetUnitId: day.sunsetUnit?.id ?? null }]))
  return {
    mode,
    days: skeleton.map((day) => ({ ...day, hours: { weekday: day.weekday ?? null, season: seasonOfTrip, dateIso: calendar.dateOfDay(day.dayNumber), sunset: sunsetFor(destData, { dateIso: calendar.dateOfDay(day.dayNumber), season: seasonOfTrip }) }, ...(finished.get(day.dayNumber) ?? { units: [], schedule: null }) })),
    calendar: { hasDates: calendar.hasDates, month: calendar.month, season: calendar.season, referenceIso: calendar.referenceIso },
    placedDay,
    unplacedPool,
    unplacedEssentials,
    quotaMisses,
    experienceRange: EXPERIENCE_RANGE,
    experienceCounts: Object.fromEntries(selectedThemes.map((theme) => [theme, experienceCount(theme)])),
    coveredByFreeTour,
    // Lo que pasó a otro día para hacer sitio a una joya (regla 112): el Panteón, para el Vaticano.
    movedForJoya: [...movedForJoya],
  }
}
