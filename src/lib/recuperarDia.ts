import type { DayPlan, Route, Stop } from './types'
import { claveDeSitio } from './sinSitiosRepetidos'

/**
 * (V68, apartado 3) «RECUPERAR EL DÍA» DE VERDAD. Función pura (sin almacén ni React) para poder probarla desde un script.
 *
 * Recuperar es recuperar: el día vuelve a como lo dio el motor (su copia, `originalSnapshot`) Y se deshace todo lo que le tocó:
 *   · lo que SALIÓ de ese día a otros días (o a «Si te sobra tiempo» de otro día) vuelve a él y desaparece de allí;
 *   · lo que ENTRÓ en ese día desde otro vuelve a su día (con su hora de antes), si ese día lo guarda en su copia;
 *   · lo que el viajero añadió a mano a ese día se quita (como antes); una parada del motor que no es de ningún otro día no se pierde: pasa a «Si te sobra tiempo» de ese día.
 * Así nunca queda un sitio en dos días (el Free Tour del 27 que se pasó al 28 y se recupera el 27: sale del 28).
 * NO decide nada sobre Reorganizar: eso lo hace `recuperarElDia` (más abajo), que además cierra el botón flotante.
 */
const mismaParada = (a: Stop, b: Stop): boolean => a.id === b.id || (claveDeSitio(a) != null && claveDeSitio(a) === claveDeSitio(b))

const minutos = (hora: string | null | undefined): number | null => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(hora ?? '').trim())
  return m ? Number(m[1]) * 60 + Number(m[2]) : null
}

/** Mete una parada en la lista, delante de la primera que es más tardía (sin hora: al final). */
function conLaParada(stops: Stop[], parada: Stop): Stop[] {
  const t = minutos(parada.time)
  let indice = stops.length
  if (t != null) {
    const at = stops.findIndex((otra) => {
      const o = minutos(otra.time)
      return o != null && o > t
    })
    if (at >= 0) indice = at
  }
  return [...stops.slice(0, indice), parada, ...stops.slice(indice)]
}

const firma = (stops: Stop[]): string => JSON.stringify(stops.map((s) => [s.id, s.name, s.time]))

export function recuperarDiaCompleto(route: Route, dayId: string): Route {
  const dia = route.days.find((day) => day.id === dayId)
  const copia = dia?.originalSnapshot
  if (!dia || !copia) return route
  const estaEnLaCopia = (stop: Stop) => copia.stops.some((otra) => mismaParada(otra, stop))
  // Lo que ahora está en este día y NO estaba en el original: entró desde otro día (o lo añadió el viajero).
  const entraron = dia.stops.filter((stop) => !estaEnLaCopia(stop) && claveDeSitio(stop) != null)
  const devueltas = new Set<string>()
  const days = route.days.map((day): DayPlan => {
    if (day.id === dayId) return day
    const suCopia = day.originalSnapshot
    let stops = day.stops
    // 1. Lo que salió de este día (está en su copia y ahora está en este otro día) vuelve a su día: aquí se quita. Salvo lo que este otro día ya llevaba en el suyo.
    stops = stops.filter((stop) => !(claveDeSitio(stop) != null && estaEnLaCopia(stop) && !suCopia?.stops.some((otra) => mismaParada(otra, stop))))
    let spare = day.spareStops
    if (spare) spare = spare.filter((stop) => !(claveDeSitio(stop) != null && estaEnLaCopia(stop) && !suCopia?.stops.some((otra) => mismaParada(otra, stop))))
    // 2. Lo que entró en este día desde ese otro y era suyo (está en su copia) vuelve a él, con su hora de antes.
    for (const entrada of entraron) {
      const suya = suCopia?.stops.find((otra) => mismaParada(otra, entrada))
      if (!suya || stops.some((otra) => mismaParada(otra, suya))) continue
      stops = conLaParada(stops, suya)
      devueltas.add(entrada.id)
    }
    if (stops === day.stops && spare === day.spareStops) return day
    const igualQueAntes = suCopia != null && firma(stops) === firma(suCopia.stops)
    return { ...day, stops, ...(spare ? { spareStops: spare } : {}), ...(igualQueAntes ? { originalSnapshot: null } : {}) }
  })
  // 3. El día, como estaba. Lo que entró y no es de ningún otro día no se pierde (salvo lo añadido a mano): pasa a «Si te sobra tiempo».
  const sinDueno = entraron.filter((stop) => !devueltas.has(stop.id) && !stop.addedByUser && !stop.reservedId)
  const spareDeLaCopia = copia.spareStops ?? []
  const spareStops = [...spareDeLaCopia, ...sinDueno.filter((stop) => !spareDeLaCopia.some((otra) => mismaParada(otra, stop))).map((stop) => ({ ...stop, spareReason: stop.spareReason ?? 'Para otro momento' }))]
  return {
    ...route,
    days: days.map((day) =>
      day.id === dayId ? { ...copia, id: dia.id, dayNumber: dia.dayNumber, colorIndex: dia.colorIndex, originalSnapshot: null, ...(spareStops.length > 0 ? { spareStops } : {}) } : day,
    ),
  }
}
