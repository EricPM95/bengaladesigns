/**
 * Un día de un destino en coche (LZ2a): une los datos (cocheData.js) con el motor (shared/routeEngine/cocheTrip.js) y da el día con la forma de siempre
 * (`stops`, `meals`, `not_included`…) más los campos del contrato docs/dias/_estado_lz2a_contrato.md. Solo se llama si `destination_config.medio === 'coche'`.
 * LL (4-nov): con pase y la hora de llegada, el día 1 es el de llegada (`LL`) y el último día es el de vuelta (`V`); ver shared/routeEngine/cocheLlegada.js.
 */
import { cocheDataFor } from './cocheData.js'
import { crearCoche, repartoLL, planCocheDia, ZONAS_COCHE } from '../../shared/routeEngine/cocheTrip.js'
import { planDeLlegadaLL, planDeVueltaLL, CONSTANTES_LL } from '../../shared/routeEngine/cocheLlegada.js'
import { sunsetFor } from '../../shared/routeEngine/sunset.js'
import { diasDeRuta } from '../../shared/routeEngine/tripSkeleton.js'

export function esDestinoEnCoche(destData) {
  return destData?.destination_config?.medio === 'coche'
}

const hmACoche = (s) => { const [h, m] = String(s).split(':').map(Number); return h * 60 + m }
const horaValida = (h) => /^\d{1,2}:\d{2}$/.test(String(h ?? ''))
const sumaDias = (iso, n) => (iso ? new Date(Date.parse(`${String(iso).slice(0, 10)}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10) : null)

/** Los planes de la llegada y de la vuelta de un viaje (solo con pase y la hora puesta; sin ellos, null y todo sigue como antes). */
export function planesLL(destData, datos, { startIso, contentDays, options = {} }) {
  if (!datos?.ll || options.pase !== true) return { ll: null, vl: null }
  const coche = datos._coche ?? (datos._coche = crearCoche({ matriz: datos.matriz, paradas: datos.paradas }))
  const k = { ...CONSTANTES_LL, ...(datos.ll.constantes ?? {}) }
  const alquiler = options.coche !== 'propio'
  const season = options.season ?? null
  let ll = null
  if (horaValida(options.llegada?.hora) && (options.llegada?.medio ?? 'avion') === 'avion') {
    const sol = sunsetFor(destData, { dateIso: startIso ? sumaDias(startIso, 0) : null, season }) ?? hmACoche('18:20')
    ll = planDeLlegadaLL({ aterriza: options.llegada.hora, alquiler, coche, zona: options.zona ?? options.llegada?.zona ?? null, zonas: ZONAS_COCHE, sol, k, recogida: options.llegada?.recogida ?? null })
  }
  const salida = datos.llegadaInfo?.medios?.avion
  const vl = horaValida(options.vuelta?.hora) && /flight|avion|plane/i.test(String(options.vuelta?.modo ?? 'flight'))
    ? planDeVueltaLL({ vuelo: options.vuelta.hora, coche, zona: options.zona ?? options.vuelta?.zona ?? null, zonas: ZONAS_COCHE, salirAntesPorZona: salida?.salir_antes_por_zona ?? {}, salirAntesDefecto: salida?.salir_antes_min ?? 165, k, devolucion: options.vuelta?.devolucion ?? null })
    : null
  return { ll, vl }
}

/** Los ids de los días del viaje (para las pruebas y para quien necesite saber qué día es cuál). */
export function diasCoche(destData, destKey, { totalDays, dateRangeStartIso = null, experiences = [], options = {} }) {
  const datos = cocheDataFor(destKey)
  if (!datos) return null
  const contentDays = diasDeRuta(totalDays)
  const { ll, vl } = planesLL(destData, datos, { startIso: dateRangeStartIso, contentDays, options })
  return repartoLL({ reparto: datos.listas.reparto, contentDays, startIso: dateRangeStartIso, experiences, ll, vuelta: vl }).ids
}

/** @returns el día, o null si el destino no tiene los datos (el motor sigue por el camino de siempre). */
export function buildCocheDay(destData, destKey, { totalDays, dayNumber, dateRangeStartIso = null, experiencesPositive = [], options = {}, buildManualDay }) {
  const datos = cocheDataFor(destKey)
  if (!datos) return null
  const contentDays = diasDeRuta(totalDays)
  const { ll, vl } = planesLL(destData, datos, { startIso: dateRangeStartIso, contentDays, options })
  const dateIso = dateRangeStartIso ? sumaDias(dateRangeStartIso, dayNumber - 1) : null
  // Sin pase (o sin la hora del vuelo) la llegada va como antes (LZ2a): el día 1 sale del aeropuerto y Timanfaya se mueve de turno; la adaptación del día de llegada es del pase.
  const llegadaSinPase = !ll && options.pase !== true && horaValida(options.llegada?.hora) && (options.llegada?.medio ?? 'avion') === 'avion' && dayNumber === 1
  const recogerMin = options.coche === 'propio' ? 20 : 45
  const base = { llegadaMin: llegadaSinPase ? hmACoche(options.llegada.hora) + recogerMin : null, recogerMin: llegadaSinPase ? recogerMin : 0, destData, datos, contentDays, season: options.season ?? null, experiences: experiencesPositive ?? [], zona: options.zona ?? null, pase: options.pase === true, cocheModo: options.coche === 'propio' ? 'propio' : 'alquiler', dateIso, dayNumber }
  const { ids, d3Vuelta } = repartoLL({ reparto: datos.listas.reparto, contentDays, startIso: dateRangeStartIso, experiences: experiencesPositive ?? [], ll, vuelta: vl })
  let dayId
  if (dayNumber > contentDays) {
    // El día de vuelta (el último del viaje): solo con la hora del vuelo y pase. Sin ellos, como siempre (la app pone la tarjeta vacía).
    if (!vl || dayNumber !== totalDays) return null
    dayId = 'V'
  } else dayId = ids[dayNumber - 1]
  if (!dayId || dayId === 'BLANCO') {
    const day = buildManualDay(dayNumber)
    day.beyond_auto_days = true
    day.max_auto_days = destData.destination_config?.max_auto_days ?? null
    return day
  }
  const plan = planCocheDia({ ...base, vistosLL: dayId === 'V' && ll ? new Set((planCocheDia({ ...base, dayNumber: 1, dateIso: dateRangeStartIso ? String(dateRangeStartIso).slice(0, 10) : null, dayId: 'LL', ll })?.stops ?? []).map((x) => x.place_name)) : new Set(), dayId, ll: dayId === 'LL' ? ll : null, vl: dayId === 'V' ? vl : null, d3Vuelta, opciones: { nochesJameos: options.nochesJameos === true, cuevaPrimero: options.cuevaPrimero === true, kayak: options.kayak === true } })
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
