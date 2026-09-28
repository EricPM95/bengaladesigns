/**
 * "Quiero entrar" (PROMPT_PENDIENTE F): qué cambia en un día curado si una parada que iba por fuera pasa a por dentro.
 * El motor rehace el día con esa parada por dentro y obligatoria (`insideNames`); aquí se compara con el día de antes
 * para contárselo al viajero antes de guardar.
 *
 * El texto (decisión del usuario, 2026-09-28) va en tres piezas, en este orden:
 *   a) lo que ganas: "Si entras, tendrás unos 70 min para recorrerlo y subir a la terraza del ángel."
 *      (`lo_mejor_dentro` del lugar, curado por monumento);
 *   b) lo que cambia, solo lo que de verdad se mueve: "Para que te dé tiempo, el paseo por Trastevere se queda en
 *      45 min y cenas a las 21:30.";
 *   c) lo que no pierdes: "Tranquilo: sigues llegando al Janículo para el atardecer."
 * Si para entrar se pierde algo importante (un imprescindible o el atardecer), lo dice claro y ofrece la alternativa:
 * "Si entras, no te da tiempo a llegar al Janículo para el atardecer. Lo verás ya de noche, con Roma iluminada, que
 * también es precioso. ¿Lo cambiamos?"
 */

import { joinSpanish, placeWithArticle } from '../../shared/routeEngine/whyTexts.js'

const toMin = (hhmm) => {
  const [h, m] = String(hhmm ?? '').split(':').map(Number)
  return Number.isFinite(h) ? h * 60 + (m || 0) : null
}
const nameOf = (stop) => stop.place_name ?? stop.name
const dayStops = (day) => (day?.stops ?? []).filter((stop) => !stop.is_night_experience)
const roundTo5 = (minutes) => Math.round(minutes / 5) * 5

/**
 * @param {object} destData
 * @param {object} before  el día de ahora (salida del motor)
 * @param {object} after   el día con la parada por dentro
 * @param {string} name    la parada que el viajero quiere ver por dentro
 * @returns {{ ok: boolean, critical: boolean, message: string, lost: string[] }}
 */
export function compareInside(destData, before, after, name) {
  const placeOf = (stopName) => (destData.places ?? []).find((place) => place.name === stopName) ?? { name: stopName }
  // El nombre corto del destino si lo tiene ("el Janículo", no "el Mirador del Janículo").
  const named = (stopName) => destData.destination_config?.night_view_names?.[stopName] ?? placeWithArticle(placeOf(stopName))
  const target = dayStops(after).find((stop) => nameOf(stop) === name)
  if (!target || target.visit_mode === 'fuera') {
    return { ok: false, critical: true, lost: [], message: `Ese día no cabe ${named(name)} por dentro sin cambiar el viaje.` }
  }

  // a) Lo que ganas.
  const best = placeOf(name).lo_mejor_dentro
  const gain = `Si entras, tendrás unos ${roundTo5(target.duration_minutes ?? 0)} min para ${best ?? 'verlo por dentro'}.`

  const afterByName = new Map(dayStops(after).map((stop) => [nameOf(stop), stop]))
  const sunsetBefore = dayStops(before).find((stop) => stop.sunset_minutes != null)
  const sunsetAfter = dayStops(after).find((stop) => stop.sunset_minutes != null)
  const lost = []
  const toOutside = []
  const shortened = []
  for (const stop of dayStops(before)) {
    const stopName = nameOf(stop)
    if (stopName === name) continue
    const now = afterByName.get(stopName)
    if (!now) {
      lost.push(stopName)
      continue
    }
    if (stop.visit_mode === 'dentro' && now.visit_mode === 'fuera') toOutside.push(stopName)
    // Lo que se acorta (lo estirable): "el paseo por Trastevere se queda en 45 min".
    if ((stop.duration_minutes ?? 0) - (now.duration_minutes ?? 0) >= 10 && !stop.pass_through) {
      const tags = placeOf(stopName).tags ?? []
      const label = tags.includes('barrio') ? `el paseo por ${stopName}` : named(stopName)
      shortened.push(`${label} se queda en ${now.duration_minutes} min`)
    }
  }

  // Lo que no se puede perder sin preguntar: un imprescindible o el atardecer.
  const criticalLost = lost.filter((stopName) => placeOf(stopName).level === 1)
  const sunsetLost = Boolean(sunsetBefore) && !sunsetAfter
  if (criticalLost.length > 0 || sunsetLost) {
    const parts = []
    if (sunsetLost) {
      const mirador = nameOf(sunsetBefore)
      // El mirador sigue en el día, ya de noche: se dice y se vende como lo que es.
      if (afterByName.has(mirador)) parts.push(`Si entras, no te da tiempo a llegar a ${named(mirador)} para el atardecer. Lo verás ya de noche, con Roma iluminada, que también es precioso.`)
      else parts.push(`Si entras, no te da tiempo a llegar a ${named(mirador)} para el atardecer.`)
    }
    if (criticalLost.length > 0) parts.push(`${sunsetLost ? 'Y tampoco' : 'Si entras, no'} te da tiempo a ver ${joinSpanish(criticalLost.map(named))}.`)
    return { ok: true, critical: true, lost, message: `${parts.join(' ')} ¿Lo cambiamos?`.replace(/\ba el\b/g, 'al') }
  }

  // b) Lo que cambia, solo lo que de verdad se mueve.
  const changes = [...shortened]
  for (const stopName of toOutside) changes.push(`${named(stopName)} lo ves por fuera`)
  for (const stopName of lost) changes.push(`${named(stopName)} se queda fuera del día`)
  // La comida y la cena no se acortan nunca: solo se mueven dentro de su franja.
  for (const type of ['lunch', 'dinner']) {
    const was = (before.meals ?? []).find((meal) => meal.time === type)?.suggested_time
    const now = (after.meals ?? []).find((meal) => meal.time === type)?.suggested_time
    if (was && now && toMin(was) !== toMin(now)) changes.push(`${type === 'dinner' ? 'cenas' : 'comes'} a las ${now}`)
  }
  const change = changes.length > 0 ? ` Para que te dé tiempo, ${joinSpanish(changes)}.` : ' El resto del día queda igual.'

  // c) Lo que no pierdes.
  const keep = sunsetAfter ? ` Tranquilo: sigues llegando a ${named(nameOf(sunsetAfter))} para el atardecer.` : ''
  return { ok: true, critical: false, lost, message: `${gain}${change}${keep}`.replace(/\ba el\b/g, 'al') }
}
