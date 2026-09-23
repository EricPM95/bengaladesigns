/**
 * La puerta del motor nuevo: MISMA firma y MISMA salida que `buildDayBlockV2`, para que el resto de
 * la app no se entere de cuál de los dos la ha servido. Es lo que permite comparar los dos motores
 * sobre la misma ruta antes de tocar el interruptor.
 *
 * El motor nuevo es el que manda por defecto. La bandera se queda para poder volver atrás y para
 * seguir comparando los dos sobre la misma ruta:
 *
 *   ROUTE_ENGINE=viejo    en .env.local  → todas las rutas vuelven al motor viejo
 *   { "engine": "viejo" } en el cuerpo   → solo esa petición, para comparar sin reiniciar
 *
 * Una diferencia que sí se nota: este motor NO tiene tope de 5 días. El viejo devuelve null por
 * encima de esa duración y el día cae en una llamada a Claude (~60-70s y dinero); este los reparte
 * con `zone_priority` y sale gratis e instantáneo.
 */

import { buildExcursionDayV2, buildManualDayV2 } from '../routeAlgorithm.js'
import { preselectedExcursionId } from './excursions.js'
import { preplanTrip } from './preplan.js'
import { buildDayFromPlan } from './buildDay.js'
import { planNightWalks } from './nightWalk.js'
import { buildDayV3 } from './buildDayV3.js'
import { interestTagsFor } from './experienceTags.js'
import { findPipelineV2Key } from '../routeAlgorithm.js'

/**
 * Qué motor sirve esta petición. El cuerpo manda sobre la variable de entorno, y en ausencia de
 * ambos manda el nuevo.
 *
 * El defecto se cambió después de comprobar que la salida del motor nuevo es un SUPERCONJUNTO de la
 * del viejo: mismo formato, ningún campo menos, dos de más (`dinner_zone`, `is_revisit`). Volver
 * atrás no necesita un despliegue, solo `ROUTE_ENGINE=viejo`.
 */
export function engineFor(requestEngine) {
  const choice = (requestEngine ?? process.env.ROUTE_ENGINE ?? '').toString().trim().toLowerCase()
  if (choice === 'viejo' || choice === 'v2' || choice === 'old') return 'viejo'
  // Motor v3 en construcción (reparto actual + programador nuevo con reloj real). Solo bajo
  // petición: el defecto sigue siendo 'nuevo' hasta que las métricas digan que gana.
  if (choice === 'v3') return 'v3'
  return 'nuevo'
}

/**
 * Un día completo con el motor nuevo. Misma firma que buildDayBlockV2 (invariante: el contrato de
 * entrada/salida no cambia), devuelve `null` si este destino no tiene datos curados.
 */
export async function buildDayBlockV3(
  destData,
  totalDays,
  hasFreeTour,
  dayNumber,
  pace,
  mapboxToken,
  dateRangeStartIso,
  mustIncludePlaces,
  experiencesPositive,
  options = {},
) {
  if (!destData) return null

  // El reparto del viaje ENTERO se recalcula en cada llamada: es una función pura y cuesta
  // milisegundos, y es lo que permite que un día construido aislado sepa qué hacen los demás
  // (invariante 20).
  const plan = preplanTrip({
    destData,
    totalDays,
    pace,
    hasFreeTour,
    poolNames: mustIncludePlaces ?? [],
    experiencesPositive: experiencesPositive ?? [],
    dateRangeStartIso,
  })

  const dayPlan = plan.days.find((day) => day.dayNumber === dayNumber)
  if (!dayPlan) return null

  // Más allá de `max_auto_days` el día sale EN BLANCO a propósito: el destino ya no da para más
  // contenido nuevo y a partir de ahí lo monta el viajero (Prompt 9, Parte 16).
  //
  // Se devuelve un día manual, no `null`. Devolver null hacía que el servidor cayera al camino de
  // Claude y generara el día con IA: cada día por encima del límite costaba una llamada de pago y
  // salía lleno de relleno, que es exactamente lo contrario de lo que el límite quiere conseguir.
  if (dayPlan.isBlank) {
    const day = buildManualDayV2(dayNumber)
    // Se marca de dónde viene el día en blanco: un día que el viajero convirtió a mano en libre y
    // uno que sale en blanco porque el destino ya no da para más contenido nuevo son la misma
    // pantalla, pero solo el segundo tiene algo que explicar.
    day.beyond_auto_days = true
    day.max_auto_days = destData.destination_config?.max_auto_days ?? null
    return day
  }

  // Día de excursión: no tiene paradas de ciudad, tiene OPCIONES, con una ya preseleccionada — la
  // más popular del destino. El viajero puede cambiarla, o rechazarla y recuperar un día de ruta.
  if (dayPlan.isExcursion) {
    const config = destData.destination_config ?? {}
    const day = buildExcursionDayV2(destData, dayNumber, totalDays, pace)
    const preferida = day.excursion_options.find((option) => option.id === preselectedExcursionId(destData))
    if (preferida) {
      // La preseleccionada va la primera: es la que la ficha enseña en grande y el resto quedan
      // como alternativas.
      day.excursion_options = [preferida, ...day.excursion_options.filter((option) => option.id !== preferida.id)]
      day.excursion_preselected = preferida.id
    }
    day.excursion_social_proof = config.excursion_social_proof ?? null
    return day
  }

  const nights = planNightWalks(destData, plan)
  const dayVisitedNames = new Set()
  for (const day of plan.days) {
    for (const slotName of ['morning', 'afternoon']) {
      for (const unit of day.slots[slotName].units) {
        for (const place of unit.places) dayVisitedNames.add(place.name)
      }
    }
  }

  const day =
    options.scheduler === 'v3'
      ? buildDayV3({
          destData,
          destinationKey: findPipelineV2Key(destData.destination ?? options.city ?? ''),
          dayPlan,
          modeId: plan.mode.id,
          tiers: plan.tiers,
          interestTags: interestTagsFor(experiencesPositive),
          city: destData.destination ?? options.city ?? '',
          nightChain: nights.get(dayNumber) ?? [],
          dayVisitedNames,
          contentDays: plan.days.length,
          poolNames: mustIncludePlaces ?? [],
        })
      : await buildDayFromPlan({
          destData,
          dayPlan,
          mode: plan.mode,
          mapboxToken,
          city: destData.destination ?? options.city ?? '',
          nightChain: nights.get(dayNumber) ?? [],
          dayVisitedNames,
        })

  // Lo que el viajero eligió y no cupo viaja con el día, con su motivo. Mejor avisar que dejarlo
  // fuera en silencio: decide él si mueve algo de día, alarga el viaje o cambia de ritmo.
  const notScheduled = (day.unscheduled ?? [])
    .filter((item) => item.priority <= 1)
    .map((item) => ({ name: item.places[0], reason: item.reason_text, suggestion: 'Muévelo a otro día desde el menú de la parada' }))
  day.not_included = [...notScheduled, ...plan.unplacedPool.map((item) => ({
    name: item.name,
    reason:
      item.reason === 'closed_every_day'
        ? `Cierra todos los días de tu viaje (${item.closedOn.join(', ')})`
        : 'No cabía en ningún día del viaje',
    suggestion: item.reason === 'closed_every_day' ? 'Cambia las fechas o quítalo de tu selección' : 'Alarga el viaje un día o elige el ritmo completo',
  }))]

  return day
}
