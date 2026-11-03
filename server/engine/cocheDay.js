/**
 * Un día de un destino en coche (LZ2a): une los datos (cocheData.js) con el motor (shared/routeEngine/cocheTrip.js) y da el día con la forma de siempre
 * (`stops`, `meals`, `not_included`…) más los campos del contrato docs/dias/_estado_lz2a_contrato.md. Solo se llama si `destination_config.medio === 'coche'`.
 */
import { cocheDataFor } from './cocheData.js'
import { diasDelViaje, planCocheDia } from '../../shared/routeEngine/cocheTrip.js'
import { diasDeRuta } from '../../shared/routeEngine/tripSkeleton.js'

export function esDestinoEnCoche(destData) {
  return destData?.destination_config?.medio === 'coche'
}

/** Los ids de los días del viaje (para las pruebas y para quien necesite saber qué día es cuál). */
export function diasCoche(destData, destKey, { totalDays, dateRangeStartIso = null, experiences = [] }) {
  const datos = cocheDataFor(destKey)
  if (!datos) return null
  return diasDelViaje({ reparto: datos.listas.reparto, contentDays: diasDeRuta(totalDays), startIso: dateRangeStartIso, experiences })
}

/** @returns el día, o null si el destino no tiene los datos (el motor sigue por el camino de siempre). */
export function buildCocheDay(destData, destKey, { totalDays, dayNumber, dateRangeStartIso = null, experiencesPositive = [], options = {}, buildManualDay }) {
  const datos = cocheDataFor(destKey)
  if (!datos) return null
  const contentDays = diasDeRuta(totalDays)
  if (dayNumber > contentDays) return null
  const ids = diasDelViaje({ reparto: datos.listas.reparto, contentDays, startIso: dateRangeStartIso, experiences: experiencesPositive })
  const dayId = ids[dayNumber - 1]
  if (!dayId || dayId === 'BLANCO') {
    const day = buildManualDay(dayNumber)
    day.beyond_auto_days = true
    day.max_auto_days = destData.destination_config?.max_auto_days ?? null
    return day
  }
  const dateIso = dateRangeStartIso ? new Date(Date.parse(`${String(dateRangeStartIso).slice(0, 10)}T12:00:00Z`) + (dayNumber - 1) * 86400000).toISOString().slice(0, 10) : null
  const plan = planCocheDia({
    destData, datos, dayId, dayNumber, contentDays, dateIso, season: options.season ?? null, experiences: experiencesPositive ?? [],
    zona: options.zona ?? null, pase: options.pase === true, cocheModo: options.coche ?? 'alquiler',
    llegadaMin: dayNumber === 1 && /^\d{1,2}:\d{2}$/.test(String(options.llegada?.hora ?? '')) && (options.llegada?.medio ?? 'avion') === 'avion' ? hmACoche(options.llegada.hora) + ((options.coche ?? 'alquiler') === 'alquiler' ? 45 : (options.coche === 'propio' ? 20 : 0)) : null,
    recogerMin: (options.coche ?? 'alquiler') === 'alquiler' ? 45 : options.coche === 'propio' ? 20 : 0,
    opciones: { nochesJameos: options.nochesJameos === true, cuevaPrimero: options.cuevaPrimero === true, kayak: options.kayak === true },
  })
  if (!plan) return null
  const { stops, meals, title, ...resto } = plan
  const quitados = plan.opcionales_quitados ?? []
  return {
    day_number: dayNumber,
    title: `${title}`,
    type: plan.tipo_dia === 'excursion' ? 'excursion' : 'city',
    date_iso: dateIso,
    stops,
    meals,
    afternoon_free: false,
    times_are_final: true,
    not_included: quitados.map((q) => ({ name: q.name, reason: 'Quitado para que el día quepa', suggestion: 'Añádelo desde EXPLORAR (posiblemente ya esté cerrado)' })),
    ...resto,
  }
}

const hmACoche = (s) => { const [h, m] = String(s).split(':').map(Number); return h * 60 + m }
