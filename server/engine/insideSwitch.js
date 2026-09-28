/**
 * "Quiero entrar" (PROMPT_PENDIENTE F): qué cambia en un día curado si una parada que iba por fuera pasa a por dentro.
 * El motor rehace el día con esa parada por dentro y obligatoria (`insideNames`); aquí se compara con el día de antes
 * para contárselo al viajero en una línea antes de guardar.
 *
 * El tiempo sale, por este orden, de lo estirable (callejeo, tiempo libre, aperitivo) y de lo de menos nivel (pasa a
 * por fuera o sale); si aun así se pierde un imprescindible o el atardecer, no se hace sin preguntar.
 */

import { joinSpanish, placeWithArticle } from '../../shared/routeEngine/whyTexts.js'

const toMin = (hhmm) => {
  const [h, m] = String(hhmm ?? '').split(':').map(Number)
  return Number.isFinite(h) ? h * 60 + (m || 0) : null
}
const nameOf = (stop) => stop.place_name ?? stop.name
const dayStops = (day) => (day?.stops ?? []).filter((stop) => !stop.is_night_experience)

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
  const afterByName = new Map(dayStops(after).map((stop) => [nameOf(stop), stop]))
  const sunsetBefore = dayStops(before).find((stop) => stop.sunset_minutes != null)
  const sunsetAfter = dayStops(after).find((stop) => stop.sunset_minutes != null)
  const lost = []
  const toOutside = []
  const changes = []
  for (const stop of dayStops(before)) {
    const stopName = nameOf(stop)
    if (stopName === name) continue
    const now = afterByName.get(stopName)
    if (!now) {
      lost.push(stopName)
      continue
    }
    if (stop.visit_mode === 'dentro' && now.visit_mode === 'fuera') toOutside.push(stopName)
    // Lo que se acorta (lo estirable): "el callejeo por Trastevere pasa de 75 a 45 min".
    if ((stop.duration_minutes ?? 0) - (now.duration_minutes ?? 0) >= 10 && !stop.pass_through) {
      const tags = placeOf(stopName).tags ?? []
      const label = tags.includes('barrio') ? `el callejeo por ${stopName}` : named(stopName)
      changes.push(`${label} pasa de ${stop.duration_minutes} a ${now.duration_minutes} min`)
    }
  }
  // Lo que no se puede perder sin preguntar: un imprescindible o el atardecer.
  const criticalLost = lost.filter((stopName) => placeOf(stopName).level === 1)
  const sunsetLost = Boolean(sunsetBefore) && !sunsetAfter
  if (criticalLost.length > 0 || sunsetLost) {
    // El mirador que sale del día entero: "quitar el Janículo"; el que se queda sin sol: "el atardecer en el Janículo".
    const sunsetWhat = sunsetLost ? (lost.includes(nameOf(sunsetBefore)) ? named(nameOf(sunsetBefore)) : `el atardecer en ${named(nameOf(sunsetBefore))}`) : null
    const what = [...criticalLost.map(named), ...(sunsetWhat ? [sunsetWhat] : [])]
    return { ok: true, critical: true, lost, message: `Para entrar hay que quitar ${joinSpanish(what)}. ¿Lo cambiamos?` }
  }
  for (const stopName of toOutside) changes.push(`${named(stopName)} pasa a verse por fuera`)
  for (const stopName of lost) changes.push(`${named(stopName)} sale del día`)
  // La cena y la comida no se acortan nunca: solo se mueven dentro de su franja.
  for (const type of ['lunch', 'dinner']) {
    const was = (before.meals ?? []).find((meal) => meal.time === type)?.suggested_time
    const now = (after.meals ?? []).find((meal) => meal.time === type)?.suggested_time
    if (was && now && toMin(was) !== toMin(now)) changes.push(`${type === 'dinner' ? 'la cena' : 'la comida'} a las ${now}`)
  }
  const kept = sunsetAfter ? ` ${named(nameOf(sunsetAfter)).replace(/^./, (c) => c.toUpperCase())} sigue al atardecer.` : ''
  const message = changes.length > 0 ? `Si entras, ${joinSpanish(changes)}.${kept}` : `Si entras, el resto del día queda igual.${kept}`
  return { ok: true, critical: false, lost, message }
}
