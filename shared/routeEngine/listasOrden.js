/**
 * Qué días lleva el viaje y en qué orden (Tanda 6, paso 1 del motor: «igual que ahora»).
 *
 *   1. Los días de la tabla del destino por días de ciudad (`curated_routes.por_dias_ciudad`), con las medias jornadas de llegada y de salida.
 *   2. El orden: cada día cae en una fecha; un día que le va mal a una fecha (`fechas_malas`: un día de la semana, una fecha, un sitio que cierra) se cambia con otro del
 *      viaje. El Vaticano no cae en domingo ni miércoles, la excursión y «Prefiero quedarme en Roma» siguen sus reglas.
 *
 * Puro: recibe lo que necesita de fuera (fechas, cierres) y devuelve { chosen, order, halfPosition, dateMoves }.
 */

import { matchesDateRange, matchesDateToken } from './openingHours.js'
import { specialHoursToAvoid } from './specialDates.js'

const norm = (text) => String(text ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const EVITAR_COST = 300
const SPECIAL_HOURS_COST = 400

function permutations(list) {
  if (list.length <= 1) return [list]
  return list.flatMap((item, index) => permutations([...list.slice(0, index), ...list.slice(index + 1)]).map((rest) => [item, ...rest]))
}

/** Todas las paradas de un día (de todas sus partes), sin lo de camino si `sinCamino`. */
export const paradasDelDia = (dia, { sinCamino = false } = {}) =>
  Object.values(dia.partes ?? {}).flatMap((parte) => [...(parte.manana ?? []), ...(parte.tarde ?? [])]).filter((stop) => stop.lugar && (!sinCamino || stop.modo !== 'camino'))

/**
 * @param {object} env  { destData, written, cityDays, contentDays, hasFreeTour, hoursOf, realDateIso, closedThatDay, calendar, poolNames, selected, mediaJornada,
 *                        forceOrder, halfDayOwner, tour, noTourOn, openCheck }
 */
export function ordenarDias(env) {
  const { destData, written, cityDays: todosLosDias, contentDays, hasFreeTour, hoursOf, realDateIso, closedThatDay, calendar, poolNames, selected, mediaJornada, forceOrder, noTourOn, tour } = env
  // El día propio del viajero («Crear mi propio día», Tanda 6g) no entra en el reparto de fechas: va fijo en su día y los demás se ordenan como si ese día fuera el de la excursión.
  // `env.propios` = { número de día: id del día escrito que se monta con sus sitios }. Con el interruptor en Roma sin día propio, los días de Roma van en su orden de la tabla
  // (D5, D6, D7) y el día que se gana va al final: no hay nada fijo.
  const propios = env.propios ?? {}
  const pins = []
  todosLosDias.forEach((day, index) => { if (propios[day.dayNumber]) pins.push({ index, id: propios[day.dayNumber] }) })
  const cityDays = todosLosDias.filter((_, index) => !pins.some((pin) => pin.index === index))
  const tablaLen = todosLosDias.length - pins.length
  const sinGaleria = !poolNames.includes('Galería Borghese') && !selected.includes('arte_museos')
  const routeTable = destData.curated_routes?.por_dias_ciudad ?? {}
  const keys = Object.keys(routeTable).map(Number).sort((a, b) => a - b)
  const key = keys.filter((k) => k <= tablaLen).at(-1)
  const row = key != null ? routeTable[String(key)]?.[hasFreeTour ? 'con_free_tour' : 'sin_free_tour'] ?? [] : []
  const wholeRow = (routeTable['2'] ?? {})[hasFreeTour ? 'con_free_tour' : 'sin_free_tour'] ?? ['D1', 'D2']
  let chosen
  let halfPosition = null
  // (El medio día de tarde es el de llegada y el de mañana el de salida; `mediaJornada.posicion` ('primero' o 'ultimo') lo cambia.)
  const halfFirst = mediaJornada?.posicion ? mediaJornada.posicion === 'primero' : mediaJornada?.franja === 'tarde'
  if (mediaJornada && cityDays.length === 2) {
    chosen = halfFirst ? ['D0-medio', 'D1-corto'] : ['D1-corto', 'D0-medio']
    halfPosition = halfFirst ? 0 : 1
  } else if (mediaJornada && cityDays.length === 3 && written.days['DT-medio']) {
    const half = hasFreeTour && mediaJornada.franja === 'manana' && written.days['DM-medio'] ? 'DM-medio' : 'DT-medio'
    chosen = halfFirst ? [half, ...wholeRow] : [...wholeRow, half]
    halfPosition = halfFirst ? 0 : 2
  } else if (mediaJornada && cityDays.length === 4 && written.days['DA-medio']) {
    const whole = (routeTable['3'] ?? {})[hasFreeTour ? 'con_free_tour' : 'sin_free_tour'] ?? ['D1', 'D2', 'D4']
    // (Tanda 6f, 4m: el medio día del viaje de 3,5 días es siempre el DA-medio; si es la tarde de llegada, va su versión «De tarde».)
    const half = 'DA-medio'
    chosen = halfFirst ? [half, ...whole] : [...whole, half]
    halfPosition = halfFirst ? 0 : 3
  } else chosen = row.map((item) => (typeof item === 'string' ? item : sinGaleria && contentDays < 4 ? item.sin_galeria : item.con_galeria)).slice(0, tablaLen)
  if (chosen.some((id) => !written.days[id])) return null
  const halfDayOwner = Object.fromEntries(Object.entries(destData.curated_routes?.excursiones?.media_jornada ?? {}).map(([id, excursion]) => [excursion, id]))

  const carries = (dia, name) => paradasDelDia(dia, { sinCamino: true }).some((stop) => stop.lugar === name)
  const carriesTour = (dia) => Boolean(tour) && paradasDelDia(dia).some((stop) => stop.lugar === tour.name)
  const violates = (dia, day) => carriesTour(dia) && noTourOn(day)
  /** Lo que le va mal a un día escrito en una fecha (`fechas_malas`: días de la semana, fechas MM-DD y sitios que ese día cierran): 1000 por cada una. */
  const badDateCost = (dia, day) => {
    const bad = dia.fechas_malas
    if (!bad || !calendar.hasDates) return 0
    const hours = hoursOf(day)
    let cost = 0
    if (hours.weekday && (bad.dias_semana ?? []).includes(norm(hours.weekday))) cost += 1000
    if (hours.dateIso && (bad.fechas ?? []).some((token) => matchesDateToken(token, hours.dateIso))) cost += 1000
    if ((bad.cerrado ?? []).some((name) => closedThatDay(name, day))) cost += 1000
    if ((bad.cerrado_a ?? []).some(({ lugar, hora }) => env.cerradoA(lugar, hora, day))) cost += 1000
    return cost
  }
  const avoidSpecial = calendar.hasDates ? specialHoursToAvoid(destData) : []
  let order = chosen
  let fixedWhy = new Map()
  const reservasColocadas = []
  const reservasSinDia = []
  let ftSeparado = null
  const pinnedOrder = (rest) => {
    if (pins.length === 0) return rest
    const todo = []
    let cursor = 0
    for (let index = 0; index < todosLosDias.length; index++) {
      const pin = pins.find((candidate) => candidate.index === index)
      todo.push(pin ? pin.id : rest[cursor++])
    }
    return todo
  }
  if (Array.isArray(forceOrder) && forceOrder.length === todosLosDias.length && forceOrder.every((id) => written.days[id])) order = forceOrder.filter((_, index) => !pins.some((pin) => pin.index === index))
  else if (chosen.length > 1) {
    const fixedCost = new Map()
    // (Por qué cada día no va en cada fecha: lo que le cuesta ahí; con eso el informe y la prueba explican cada cambio de orden.)
    fixedWhy = new Map()
    for (const id of chosen) {
      const dia = written.days[id]
      const entries = [...new Set(paradasDelDia(dia).filter((stop) => stop.modo === 'dentro' || stop.hora_tipo).map((stop) => stop.lugar))]
      const whyByDay = []
      fixedWhy.set(id, whyByDay)
      fixedCost.set(id, cityDays.map((day, dayIndex) => {
        let cost = 0
        const why = (text) => { (whyByDay[dayIndex] ??= []).push(text) }
        if (violates(dia, day)) { cost += 1000; why('el Free Tour no sale ese día') }
        const halfId = day.halfDayExcursion?.id ?? null
        if (day.halfDayExcursion?.soloTarde) { /* (la tarde de un día de ciudad con excursión de medio día: ese día va donde toca) */ }
        else if (halfId ? halfDayOwner[halfId] !== id : Object.values(halfDayOwner).includes(id)) { cost += 5000; why('día de excursión de medio día') }
        for (const name of entries) if (closedThatDay(name, day)) { cost += EVITAR_COST; why(`${name} cerrado`) }
        for (const rule of avoidSpecial) if (hoursOf(day).dateIso && matchesDateRange(rule.fecha, rule.hasta, hoursOf(day).dateIso) && rule.lugares.some((name) => carries(dia, name))) { cost += SPECIAL_HOURS_COST; why(`horario especial (${rule.fecha})`) }
        { const bad = badDateCost(dia, day); if (bad > 0) { cost += bad; why('mala fecha del documento') } }
        // (Lo marcado en el pool que ese día no abre —la Galería Borghese el lunes— va mejor en el otro día.)
        for (const name of poolNames) if (dia.pool?.[name] && closedThatDay(name, day)) { cost += 600; why(`${name} (del pool) cerrado`) }
        return cost
      }))
    }
    // Las reservas grandes (Tanda 6j, punto 9): el día escrito que lleva el sitio reservado va FIJO en la fecha de la reserva; los demás se ordenan con las reglas de siempre en los huecos que quedan.
    const fijos = new Map(halfPosition == null ? [] : [[halfPosition, chosen[halfPosition]]])
    // (El Free Tour reservado se coloca después de las demás reservas grandes: si su día lo ocupa otra —los Museos, en otra fecha—, el Free Tour va en otro día, Tanda 6w.)
    const esTour = (reserva) => Boolean(tour) && reserva.name === tour.name
    for (const reserva of (env.reservasGrandes ?? []).filter((r) => !esTour(r))) {
      const slot = cityDays.findIndex((day) => (reserva.dateIso ? hoursOf(day).dateIso === reserva.dateIso : day.dayNumber === Number(reserva.dayNumber)))
      // (Un día que hereda su mañana de otro —el D1-FT, la de la Roma antigua— lleva también las paradas de esa mañana.)
      const conHerencia = (dia) => [...paradasDelDia(dia, { sinCamino: true }), ...(dia.hereda_manana_de && written.days[dia.hereda_manana_de] ? paradasDelDia(written.days[dia.hereda_manana_de], { sinCamino: true }) : [])]
      const dentro = (id) => conHerencia(written.days[id]).some((stop) => stop.lugar === reserva.name && stop.modo === 'dentro')
      const id = chosen.find((candidate) => candidate !== 'D1-corto' && dentro(candidate)) ?? chosen.find((candidate) => candidate !== 'D1-corto' && conHerencia(written.days[candidate]).some((stop) => stop.lugar === reserva.name))
      // (Un sitio cerrado ese día no se fija: la reserva no puede ser de ese día; se guarda con su aviso y el viaje se queda como está.)
      if (slot >= 0 && closedThatDay(reserva.name, cityDays[slot])) { reservasSinDia.push({ name: reserva.name, motivo: 'cerrado' }); continue }
      if (slot < 0 || !id || [...fijos.values()].includes(id)) { reservasSinDia.push({ name: reserva.name, motivo: slot < 0 ? 'fecha_sin_dia' : !id ? 'sin_dia_escrito' : 'ya_fijado' }); continue }
      if (fijos.has(slot)) { reservasSinDia.push({ name: reserva.name, motivo: 'dos_reservas_grandes' }); continue }
      fijos.set(slot, id)
      reservasColocadas.push({ name: reserva.name, id, slot })
    }
    // El Free Tour reservado (Tanda 6w): su día es el que lleva el tour (el D3). Si otra reserva grande (los Museos, otro día) ya tiene ese D3, el D3 se queda con ella sin el tour (lo del guía, por libre)
    // y el día de la fecha del Free Tour es el D1-FT (o el D1, si el viaje no lo lleva), donde el Free Tour hace de «otra parte».
    for (const reserva of (env.reservasGrandes ?? []).filter(esTour)) {
      const slot = cityDays.findIndex((day) => (reserva.dateIso ? hoursOf(day).dateIso === reserva.dateIso : day.dayNumber === Number(reserva.dayNumber)))
      const idTour = chosen.find((candidate) => carriesTour(written.days[candidate]))
      if (slot < 0 || !idTour) { reservasSinDia.push({ name: reserva.name, motivo: slot < 0 ? 'fecha_sin_dia' : 'sin_dia_escrito' }); continue }
      if (noTourOn(cityDays[slot])) { reservasSinDia.push({ name: reserva.name, motivo: 'sin_tour_ese_dia' }); continue }
      const dueño = [...fijos.entries()].find(([, id]) => id === idTour)
      if (!dueño) {
        if (fijos.has(slot)) { reservasSinDia.push({ name: reserva.name, motivo: 'dos_reservas_grandes' }); continue }
        fijos.set(slot, idTour)
        reservasColocadas.push({ name: reserva.name, id: idTour, slot })
      } else if (dueño[0] !== slot) {
        const alterno = ['D1-FT', 'D1'].find((id) => chosen.includes(id))
        const yaEsta = fijos.get(slot)
        if (alterno && (!yaEsta || yaEsta === alterno) && ![...fijos.entries()].some(([k, id]) => id === alterno && k !== slot)) {
          fijos.set(slot, alterno)
          reservasColocadas.push({ name: reserva.name, id: alterno, slot })
          ftSeparado = { slotFt: slot, slotOtro: dueño[0], idFt: alterno }
        } else reservasSinDia.push({ name: reserva.name, motivo: 'ya_fijado' })
      }
    }
    // El Free Tour de tarde o de noche con su fecha (Tanda 6u): el día escrito que lo lleva (el D1, con su variante) va fijo en esa fecha.
    if (env.freeTourFijo) {
      const { franja, dateIso, dayNumber } = env.freeTourFijo
      const slot = cityDays.findIndex((day) => (dateIso ? hoursOf(day).dateIso === dateIso : day.dayNumber === Number(dayNumber)))
      const id = chosen.find((candidate) => (written.days[candidate].variantes ?? []).some((variante) => [].concat(variante.cuando ?? []).some((cuando) => cuando?.free_tour_despues === franja)))
      if (slot >= 0 && id && !fijos.has(slot) && ![...fijos.values()].includes(id)) fijos.set(slot, id)
    }
    // El mejor orden con unos días fijos, midiendo lo que se aleja cada día de `referencia` (Tanda 6k): sin reservas, de la tabla; con una reserva, del orden que el viajero ya veía sin ella,
    // para que cambien de sitio los menos días posibles (dos días enteros, uno por otro, y algún día más solo si un cierre lo obliga).
    const mejorOrden = (fijosDe, referencia) => {
      let best = null
      const libres = chosen.filter((id) => ![...fijosDe.values()].includes(id))
      const candidates = permutations(libres).map((perm) => { let k = 0; return chosen.map((_, index) => (fijosDe.has(index) ? fijosDe.get(index) : perm[k++])) })
      for (const candidate of candidates) {
        let cost = 0
        candidate.forEach((id, index) => {
          cost += fixedCost.get(id)[index]
          cost += Math.abs(index - referencia.indexOf(id))
          if (id !== referencia[index]) cost += 0.01
        })
        if (!best || cost < best.cost) best = { candidate, cost }
      }
      return best
    }
    const sinReservas = mejorOrden(new Map(halfPosition == null ? [] : [[halfPosition, chosen[halfPosition]]]), chosen)
    const best = fijos.size > (halfPosition == null ? 0 : 1) ? mejorOrden(fijos, sinReservas.candidate) : sinReservas
    order = best.candidate
  }
  const orderSinPin = order
  order = pinnedOrder(order)
  // Navidad y Año Nuevo: si el Día de la Roma antigua cae el 25 de diciembre o el 1 de enero, se usa el D1-corto (todo por fuera).
  if (calendar.hasDates && written.days['D1-corto']) {
    order = order.map((id, index) => {
      if (id !== 'D1') return id
      const mmdd = String(hoursOf(todosLosDias[index]).dateIso ?? '').slice(5)
      return mmdd === '12-25' || mmdd === '01-01' ? 'D1-corto' : id
    })
  }
  // Lo que un cambio de orden sacó de su fecha mala (para el aviso «Hemos puesto el Vaticano otro día»).
  const dateMoves = []
  if (calendar.hasDates) {
    order.forEach((id, index) => {
      const dia = written.days[id]
      const placed = todosLosDias[index]
      const names = [...new Set([...poolNames.filter((name) => carries(dia, name)), ...(dia.fechas_malas?.cerrado ?? [])])]
      for (const name of names) {
        if (closedThatDay(name, placed)) continue
        for (const other of todosLosDias) {
          if (other === placed || !closedThatDay(name, other)) continue
          dateMoves.push({ name, dayId: id, blockedDayNumber: other.dayNumber, blockedDateIso: hoursOf(other).dateIso, placedDayNumber: placed.dayNumber, placedDateIso: hoursOf(placed).dateIso })
        }
      }
    })
  }
  // Los días que cambian de sitio respecto a la tabla y por qué: lo que les cuesta en su fecha de la tabla (un sitio cerrado, una mala fecha, un horario especial). Para el informe y la prueba del orden.
  const motivosOrden = {}
  chosen.forEach((id, slot) => { const why = fixedWhy.get(id)?.[slot] ?? []; if (orderSinPin.indexOf(id) !== slot && why.length > 0) motivosOrden[id] = why })
  return { chosen, order, halfPosition, dateMoves, motivosOrden, reservasColocadas, reservasSinDia, ftSeparado }
}
