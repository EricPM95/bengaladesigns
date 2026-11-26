import type { DayPlan, Route, Stop } from './types'

/**
 * (V67) HARÍA, EN DOS PARADAS. Antes la ruta de Lanzarote llevaba «Haría y la Casa-Museo César Manrique» como un solo sitio: las dos paradas del día («Haría y el Valle de las Mil Palmeras»
 * y «Casa-Museo César Manrique (Haría)») heredaban el horario de la Casa-Museo y el pueblo salía cerrado a las 17:30. Ahora el pueblo no lleva horario (regla V56) y la Casa-Museo, el suyo.
 * Un viaje ya creado se corrige al abrirlo, en el móvil y sin red: al pueblo se le quitan el horario, el precio y los avisos de «cerrado»; todo lo demás (el id de la parada, su hora,
 * lo visto, las fotos, las reservas) se queda como estaba. Devuelve la MISMA ruta si no hay nada que cambiar (idempotente).
 * Sin consultas a Supabase: se lee y se guarda lo que ya hay en el móvil (cero peticiones).
 */
const NOMBRES_DEL_PUEBLO = new Set(['haria y el valle de las mil palmeras', 'haria y la casa-museo cesar manrique'])
const quitaTildes = (s: string) => s.normalize('NFD').replace(new RegExp(String.fromCharCode(0x5b, 0x300, 0x2d, 0x36f, 0x5d), 'g'), '').toLowerCase().trim()

function esElPueblo(stop: Stop): boolean {
  return NOMBRES_DEL_PUEBLO.has(quitaTildes(stop.name ?? ''))
}

function yaEstaBien(stop: Stop): boolean {
  return !stop.hours && !stop.scheduleText && !stop.hoursCard && !stop.hoursData && !stop.closedThisDay && !stop.outsideKind
}

function arreglaElPueblo(stop: Stop): Stop {
  if (!esElPueblo(stop) || yaEstaBien(stop)) return stop
  const { outsideKind: _k, ...resto } = stop
  void _k
  return { ...resto, hours: null, scheduleText: null, hoursCard: null, hoursData: null, hoursWarning: null, closedThisDay: false, outsideReason: null, freeAccess: true, reservation: 'no', priceInfo: undefined, ticketOptions: [] }
}

export function conHariaEnDosParadas(route: Route): Route {
  let cambio = false
  const arregla = (lista: Stop[] | undefined): Stop[] | undefined => {
    if (!lista) return lista
    const nueva = lista.map(arreglaElPueblo)
    if (nueva.some((s, i) => s !== lista[i])) { cambio = true; return nueva }
    return lista
  }
  const days = route.days.map((day: DayPlan) => {
    const stops = arregla(day.stops) ?? day.stops
    const spareStops = arregla(day.spareStops)
    const add = arregla(day.rainPlan?.add)
    if (stops === day.stops && spareStops === day.spareStops && add === day.rainPlan?.add) return day
    return { ...day, stops, ...(spareStops ? { spareStops } : {}), ...(day.rainPlan ? { rainPlan: { ...day.rainPlan, add: add ?? day.rainPlan.add } } : {}) }
  })
  return cambio ? { ...route, days } : route
}
