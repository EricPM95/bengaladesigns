/**
 * (V68, apartado 4) REORGANIZAR NUNCA QUITA NADA DEL VIAJE, Y CAMBIA LO MÍNIMO.
 *
 * Qué pasaba (V61): el motor, al poner un vuelo de llegada tardío (15:30, 17:30), rehacía CADA día del viaje «en cadena» (el día 1 pasa entero al día 2, el 2 al 3, y el último se «cae»), y como cada día
 * se rehace por separado, lo del día caído desaparecía: la hoja decía «Se quita de tu viaje» en 17 tarjetas y proponía 45 cambios moviendo todos los días.
 *
 * Ahora, con el vuelo de llegada:
 *  1. SOLO cambia el día de la llegada (lo que el motor monta para esa hora). Los demás días no se tocan, salvo para recibir algo que no cabía.
 *  2. Lo que no cabe ese día va al día POSTERIOR donde mejor quepa (al final, abierto, antes de la cena, sin quitar nada); si no cabe en ninguno, a «Lugares pendientes» (`spareStops`). Un sitio con reserva o
 *     el Free Tour nunca se manda a otro día solo: se queda en pendientes con su reserva, nunca desaparece.
 *  3. Los días que ya pasaron y lo ya hecho de hoy están bloqueados (`diaBloqueado`): Reorganizar no los toca.
 *  4. Una red de seguridad (`garantizarNadaSeQuita`): todo sitio que estaba en el viaje sigue en alguna parada o en pendientes; un sitio que la propuesta dejaría en dos días se queda solo en el primero
 *     (o en el de su reserva). Lo que no está en el motor (cualquier destino) lo cubre esta misma función: vale igual para Roma, Lanzarote y los que vengan.
 * Todo es puro salvo la carga (una vez) de los horarios del destino, para no mandar un sitio a un día en que está cerrado.
 */
import type { DayPlan, Route, Stop } from './types'
import type { DiaAdaptado } from './adaptarVuelos'
import { aplicarOpADia, claseDe, conMeal, delDia, limiteDelDia, minDe, sube10, viajeMin, type Op } from './hoyCambiarPlan'
import type { DatosDeImportancia } from './masVisitas'
import { catalogoEnMemoria, fetchDestinationPlaces } from './destinationPlacesApi'
import { displayStopName } from './format'
import { cargaDatosDeHorario, datosDeHorarioEnMemoria, horarioDeParada, normalizaNombre } from './horarioDeParada'
import { fechaDelDia } from './nombreDeDia'
import { hasRealCoordinates, haversineMeters } from './distanceMock'
import { esSoloDeDia, minutosDeLaHora } from './sitiosDeDia'
import { atardecerDelDestino, horaDelSol } from './puestaDeSolYManana'
import { FREE_TOUR_HORAS } from '../../shared/routeEngine/freeTourHoras.js'

/** (V74) Lo máximo que se saca de un día para hacerle sitio a UNA parada importante: más sería rehacer el día (el cambio ya no sería el mínimo); si no cabe así, va a «Lugares pendientes». */
const MAX_SACADOS = 8
const MOTIVO_VUELO = 'Con tu vuelo no te da tiempo ese día.'

/** (V77, 17) El Free Tour sin reserva solo sale a sus horas reales (10, 12, 15, 17, 19, 21: `freeTourHoras.js`), nunca a una hora que no existe (16:40): la primera hora real que no sea antes de `min` (minutos); null si ya no queda ninguna. */
export function horaRealDelFreeTour(min: number): number | null {
  for (const { hora } of FREE_TOUR_HORAS as { hora: string }[]) {
    const m = Number(hora.slice(0, 2)) * 60 + Number(hora.slice(3, 5))
    if (m >= min) return m
  }
  return null
}

/** El nombre de un sitio sin la nota entre paréntesis del final («Piazza Navona (noche)» = «Piazza Navona»): con él se emparejan los sitios de antes y de después. */
export const claveDeSitio = (name: string): string => normalizaNombre(name.replace(/\s*\([^)]*\)\s*$/, ''))
const esSitio = (stop: Stop): boolean => !stop.isArrival && !stop.isBreak
const esFijo = (stop: Stop): boolean => Boolean(stop.reservedId || stop.reservationTime || stop.isFreeTour)
/** Una reserva con su fecha y hora (entrada, turno): no se manda a otro día sola, porque la entrada es para ese día. El Free Tour SIN hora sí puede cambiar de día (V74). */
// (El Free Tour que trae el motor lleva una hora por defecto en `reservationTime` aunque el viajero no haya reservado: solo cuenta como reserva si tiene `reservedId`.)
const esReserva = (stop: Stop): boolean => Boolean(stop.reservedId || (stop.reservationTime && !stop.isFreeTour))
/** (V74) Un «de camino» (una calle, una fuente de paso: `passThrough`) no es una visita ni vale lo mismo: cuando algo tiene que salir de un día, sale el primero, sin preguntar ni avisar, y nunca va a «Lugares pendientes». */
const esDeCamino = (stop: Stop): boolean => Boolean(stop.passThrough)
/** (V77, 18) Lo que el motor de coche saca de un día porque acabaría tras el cierre de su sitio: su motivo empieza por «No cabe hoy:» (`cocheTrip.js › spare_stops`). */
export const esPorCierre = (stop: Stop): boolean => /^No cabe hoy:/.test(stop.spareReason ?? '')

/** Lo que pesa cada sitio del destino (el nivel del catálogo; 1 = imprescindible). Se pide una vez (queda en memoria); sin catálogo, todo pesa lo mismo y nada se quita de un día. */
async function datosDeImportancia(destino: string): Promise<DatosDeImportancia> {
  const catalogo = catalogoEnMemoria(destino) ?? (await fetchDestinationPlaces(destino).catch(() => null))
  const niveles: Record<string, number | null> = {}
  for (const lugar of catalogo?.places ?? []) if (lugar.kind === 'place') niveles[lugar.name] = lugar.level
  return { importanciaPorSitio: {}, nivelPorSitio: niveles }
}
/** Cuánto cuesta sacar una parada de un día para hacerle sitio a otra: lo opcional, lo primero; lo imprescindible y lo fijo, nunca (null). */
function costeDeSacar(stop: Stop, datos: DatosDeImportancia): number | null {
  if (esDeCamino(stop)) return 0
  if (stop.checkedInAt || esFijo(stop)) return null
  const clase = claseDe(stop, new Set(), datos)
  return clase === 'opcional' ? 1 : clase === 'flexible' ? 2 : clase === 'principal' ? 3 : null
}
const firma = (day: DayPlan): string => JSON.stringify([day.stops.map((stop) => `${stop.name}@${stop.time ?? ''}`), day.meals.map((meal) => `${meal.mealTime}@${meal.time ?? ''}`), (day.spareStops ?? []).map((stop) => stop.name)])

const hoyIso = (): string => {
  const ahora = new Date()
  return `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-${String(ahora.getDate()).padStart(2, '0')}`
}

/** Un día que Reorganizar no toca: uno que ya pasó, o el de hoy si ya se ha visto o saltado algo. (Sin fechas no hay días pasados.) */
export function diaBloqueado(route: Route, day: DayPlan, hoy: string = hoyIso()): boolean {
  const fecha = fechaDelDia(route, day.dayNumber)
  if (fecha && fecha < hoy) return true
  if (fecha && fecha === hoy && day.stops.some((stop) => stop.checkedInAt || stop.saltada)) return true
  return false
}

const sePuedeRecibir = (day: DayPlan): boolean => !day.isReturnLeg && !day.isExcursionDay && day.dayType !== 'excursion' && day.dayType !== 'manual' && day.interruptor?.mode !== 'excursion' && !day.originalSnapshot && !day.userAdded && !day.ownDay

export interface OpcionesDelMinimo {
  /** Hay vuelo de llegada: solo cambia el día de la llegada y lo que reciben los demás. */
  hayLlegada: boolean
  /** Hay vuelo de vuelta: se mantienen las propuestas del último día y del de vuelta. */
  hayVuelta: boolean
  enCoche: boolean
  hoy?: string
}

/**
 * El cambio mínimo. `propuestos` = lo que el motor propone día por día (puede ser TODO el viaje en cadena). Devuelve solo lo que de verdad hay que cambiar. Pura salvo la carga de los horarios.
 */
export async function cambioMinimo(route: Route, propuestos: DiaAdaptado[], opciones: OpcionesDelMinimo): Promise<DiaAdaptado[]> {
  const hoy = opciones.hoy ?? hoyIso()
  const ciudad = route.days.filter((day) => !day.isReturnLeg)
  const primero = ciudad[0]
  const ultimo = ciudad[ciudad.length - 1]
  const diaDe = (id: string) => route.days.find((day) => day.id === id)
  const quedan = new Map<string, DiaAdaptado>()
  for (const propuesto of propuestos) {
    const dia = diaDe(propuesto.dayId)
    if (!dia || diaBloqueado(route, dia, hoy)) continue
    // Con vuelo de llegada, el motor rehace los demás días «en cadena»: solo vale lo del día de la llegada y, si hay vuelo de vuelta, lo del último día y el de vuelta.
    if (opciones.hayLlegada && dia.id !== primero?.id && !(opciones.hayVuelta && (dia.isReturnLeg || (dia.id === ultimo?.id && !route.days.some((x) => x.isReturnLeg))))) continue
    quedan.set(dia.id, propuesto)
  }
  const trabajo = new Map<string, DayPlan>(route.days.map((day) => [day.id, quedan.get(day.id)?.next ?? day]))
  const movidas = new Map<string, Set<string>>()
  const anotar = (dayId: string, stopId: string) => movidas.set(dayId, (movidas.get(dayId) ?? new Set<string>()).add(stopId))

  const propuesto1 = primero ? quedan.get(primero.id) : undefined
  if (opciones.hayLlegada && primero && propuesto1) {
    const original = primero
    const r1 = propuesto1.next
    const enR1 = new Set([...r1.stops.filter(esSitio), ...(r1.spareStops ?? [])].map((stop) => claveDeSitio(stop.name)))
    // 1. Lo que el motor pone el día 1 y estaba en otro día: sale de ese día (no se repite).
    const sitiosDeR1 = new Set(r1.stops.filter(esSitio).map((stop) => claveDeSitio(stop.name)))
    const antesEnPrimero = new Set(original.stops.filter(esSitio).map((stop) => claveDeSitio(stop.name)))
    for (const day of route.days) {
      if (day.id === primero.id || diaBloqueado(route, day, hoy)) continue
      const actual = trabajo.get(day.id) as DayPlan
      const sobran = actual.stops.filter((stop) => esSitio(stop) && sitiosDeR1.has(claveDeSitio(stop.name)) && !antesEnPrimero.has(claveDeSitio(stop.name)) && !stop.reservedId)
      if (sobran.length > 0) trabajo.set(day.id, { ...actual, stops: actual.stops.filter((stop) => !sobran.includes(stop)) })
    }
    // 2. Lo que no cabe el día de la llegada: al día posterior donde mejor quepa; si no, a pendientes.
    const sobra = original.stops.filter((stop) => esSitio(stop) && !stop.checkedInAt && !enR1.has(claveDeSitio(stop.name)))
    await cargaDatosDeHorario(route.destination).catch(() => undefined)
    const horarios = datosDeHorarioEnMemoria(route.destination)
    const aPendientes: Stop[] = []
    const datos = await datosDeImportancia(route.destination)
    // (V74) Lo más importante primero: un imprescindible o el Free Tour sin hora entra en el mejor día siguiente, y si ese día va lleno se saca lo MENOS importante (un «de camino», algo opcional), que va a «Lugares
    // pendientes». Un «de camino» no es una visita: si no cabe, se pierde sin aviso (no va a pendientes). Una reserva con hora se queda en pendientes, con su reserva, mientras no se mueva su fecha.
    const grande = (stop: Stop) => !esReserva(stop) && (Boolean(stop.isFreeTour) || claseDe(stop, new Set(), datos) === 'imprescindible')
    const rango = (stop: Stop) => (esReserva(stop) ? 2 : grande(stop) ? 0 : 1)
    const ordenadas = [...sobra].sort((a, b) => rango(a) - rango(b) || (b.durationMinutes || 0) - (a.durationMinutes || 0))
    for (const stop of ordenadas) {
      if (esDeCamino(stop)) continue
      const sitio = esReserva(stop) ? null : mejorDia(route, trabajo, primero, stop, horarios, opciones.enCoche, hoy, grande(stop) ? datos : null)
      if (!sitio) {
        aPendientes.push({ ...stop, spareReason: MOTIVO_VUELO })
        continue
      }
      trabajo.set(sitio.dia.id, sitio.dia)
      anotar(sitio.dia.id, stop.id)
    }
    const ya = new Set((r1.spareStops ?? []).map((stop) => claveDeSitio(stop.name)))
    const previos = (original.spareStops ?? []).filter((stop) => !ya.has(claveDeSitio(stop.name)))
    const nuevas = aPendientes.filter((stop) => !ya.has(claveDeSitio(stop.name)) && !previos.some((x) => claveDeSitio(x.name) === claveDeSitio(stop.name)))
    trabajo.set(primero.id, { ...r1, spareStops: [...previos, ...(r1.spareStops ?? []), ...nuevas] })
  }

  // 2b. (V77, 18) Una visita que el motor ha sacado de un día porque acabaría después de que cierre su sitio (y no se puede acortar a más de la mitad: «No cabe hoy: …») se pasa al MEJOR día donde quepa
  // (abierto, a continuación de la última visita y antes de cenar); si no cabe en ninguno, se queda en «Lugares pendientes» con su motivo. Una reserva con hora no se mueve. Vale para cualquier día propuesto.
  for (const day of route.days) {
    const propuesto = quedan.get(day.id)
    const actual = trabajo.get(day.id) as DayPlan
    if (!propuesto || !actual.spareStops?.length) continue
    const antesEnPendientes = new Set((day.spareStops ?? []).map((stop) => claveDeSitio(stop.name)))
    const porCierre = actual.spareStops.filter((stop) => esPorCierre(stop) && !antesEnPendientes.has(claveDeSitio(stop.name)) && !esReserva(stop) && !esDeCamino(stop))
    if (porCierre.length === 0) continue
    await cargaDatosDeHorario(route.destination).catch(() => undefined)
    const horarios = datosDeHorarioEnMemoria(route.destination)
    const colocados = new Set<string>()
    for (const stop of porCierre) {
      const sitio = mejorDia(route, trabajo, day, stop, horarios, opciones.enCoche, hoy, null)
      if (!sitio) continue
      trabajo.set(sitio.dia.id, sitio.dia)
      anotar(sitio.dia.id, stop.id)
      colocados.add(stop.id)
    }
    if (colocados.size > 0) trabajo.set(day.id, { ...(trabajo.get(day.id) as DayPlan), spareStops: (trabajo.get(day.id) as DayPlan).spareStops?.filter((stop) => !colocados.has(stop.id)) })
  }

  // 3. La red de seguridad: nada desaparece y nada se repite.
  const salida = garantizarNadaSeQuita(route, trabajo)
  const resultado: DiaAdaptado[] = []
  for (const day of route.days) {
    const siguiente = salida.get(day.id) as DayPlan
    const propuesto = quedan.get(day.id)
    if (firma(siguiente) === firma(day)) continue
    const idsMovidas = [...(propuesto?.movidas ?? []), ...(movidas.get(day.id) ?? [])]
    resultado.push({ dayId: day.id, dayNumber: day.dayNumber, next: siguiente, movidas: [...new Set(idsMovidas)], ...(propuesto?.noCaben ? { noCaben: propuesto.noCaben } : {}) })
  }
  return resultado
}

/** (V74) Cuándo acaba la última parada de día (minutos); 0 si no hay. */
function finDelDia(day: DayPlan): number {
  const ultima = day.stops.filter((x) => esSitio(x) && !x.saltada && !x.isNightExperience && !x.isNightView && minDe(x.time) != null).at(-1)
  return ultima ? (minDe(ultima.time) as number) + (ultima.durationMinutes || 0) : 0
}

/**
 * (V74) Tapa el hueco que deja lo que se saca de un día: cada parada de día, en orden, se corre hacia ATRÁS (nunca hacia delante) hasta pegarse a la anterior (más el trayecto y 5 minutos de margen), sin pasar de la hora a la que
 * abre su sitio ni, si va después de la comida, de cuando acaba la comida. Lo fijo (reservas, el Free Tour, el atardecer) y la primera parada no se mueven. Pura salvo los horarios que ya están en memoria.
 */
function compactar(route: Route, day: DayPlan, enCoche: boolean, horarios: Map<string, Record<string, unknown>>): DayPlan {
  const comida = day.meals.find((m) => m.mealTime === 'lunch')
  const finComida = comida && minDe(comida.time) != null ? (minDe(comida.time) as number) + 60 : null
  const trasLaComida = day.mealAfter?.lunch
  const fecha = fechaDelDia(route, day.dayNumber)
  let anterior: Stop | null = null
  let finAnterior = 0
  const hh = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
  const stops = day.stops.map((s, i) => {
    if (!esSitio(s) || s.saltada || s.isNightExperience || s.isNightView || minDe(s.time) == null) return s
    const origen = minDe(s.time) as number
    const dur = s.durationMinutes || 0
    if (!anterior || esFijo(s) || s.isSunset || s.checkedInAt) {
      anterior = s
      finAnterior = origen + dur
      return s
    }
    let piso = finAnterior + viajeMin(anterior, s, enCoche) + 5
    // (Con el sitio de la comida en el día, o, si no lo trae, por la hora: lo que empezaba después de empezar la comida va después de acabarla.)
    if (finComida != null && (trasLaComida != null ? i > trasLaComida : origen >= (minDe(comida?.time) as number))) piso = Math.max(piso, finComida)
    const datos = (s.hoursData as Record<string, unknown> | null | undefined) ?? horarios.get(normalizaNombre(s.name)) ?? null
    const abre = datos ? minDe(horarioDeParada({ hoursData: datos }, fecha, route.answers.month ?? null)?.abre) : null
    if (abre != null) piso = Math.max(piso, abre)
    const nuevo = Math.min(origen, Math.ceil(piso / 5) * 5)
    anterior = s
    finAnterior = nuevo + dur
    return nuevo === origen ? s : { ...s, time: hh(nuevo), nextLegPending: true }
  })
  return { ...day, stops }
}

/** El día POSTERIOR donde la parada cabe: abierto ese día, a continuación de la última visita y antes de la hora de cenar; el más cercano y menos lleno. null si no cabe en ninguno. */
function mejorDia(route: Route, trabajo: Map<string, DayPlan>, desde: DayPlan, stop: Stop, horarios: Map<string, Record<string, unknown>>, enCoche: boolean, hoy: string, hacerSitio: DatosDeImportancia | null = null): { dia: DayPlan } | null {
  const duracion = stop.durationMinutes || 45
  let mejor: { dia: DayPlan; puntos: number } | null = null
  for (const original of route.days) {
    if (original.dayNumber <= desde.dayNumber || diaBloqueado(route, original, hoy)) continue
    const dia = trabajo.get(original.id) as DayPlan
    if (!sePuedeRecibir(dia)) continue
    const visitas = delDia(dia)
    const fecha = fechaDelDia(route, dia.dayNumber)
    const datos = (stop.hoursData as Record<string, unknown> | null | undefined) ?? horarios.get(normalizaNombre(stop.name)) ?? null
    const horario = datos ? horarioDeParada({ hoursData: datos }, fecha, route.answers.month ?? null) : null
    if (horario?.cerrado) continue
    const abre = minDe(horario?.abre)
    const cierra = minDe(horario?.cierra)
    const sol = esSoloDeDia(stop.name) ? minutosDeLaHora(horaDelSol(dia) ?? atardecerDelDestino(route.destination, fecha ?? undefined)?.hora) : null
    // La última parada con hora del día (de las de día: las de noche van después de cenar y no cuentan), sea una visita o un paseo. (V74) Si no cabe y la parada es importante, se saca del día lo MENOS importante (un «de
    // camino», algo opcional, lo de nivel 3, lo de nivel 2), de uno en uno y solo lo que de verdad libera tiempo, hasta que quepa; lo que queda se corre hacia delante para tapar el hueco (sin pasar de lo que abre cada sitio
    // ni de la comida). Lo imprescindible y lo fijo nunca salen.
    const diurnas = (d: DayPlan) => d.stops.filter((x) => esSitio(x) && !x.saltada && !x.isNightExperience && !x.isNightView && minDe(x.time) != null)
    const alFinal = (d: DayPlan): { ultima: Stop; inicio: number } | null => {
      const ultima = diurnas(d).at(-1)
      if (!ultima) return null
      const llega = sube10((minDe(ultima.time) as number) + (ultima.durationMinutes || 0) + viajeMin(ultima, stop, enCoche))
      // (V77, 17) El Free Tour va a una de sus horas reales, no a la que sale por hueco.
      const inicio = stop.isFreeTour ? horaRealDelFreeTour(llega) : llega
      if (inicio == null) return null
      const cabe = inicio + duracion <= limiteDelDia(d) && !((abre != null && inicio < abre) || (cierra != null && inicio + duracion > cierra)) && !(sol != null && inicio + duracion > sol)
      return cabe ? { ultima, inicio } : null
    }
    const sacarDe = (d: DayPlan, sale: Stop): DayPlan => {
      const i = d.stops.findIndex((x) => x.id === sale.id)
      return aplicarOpADia(d, { t: 'sacar', dia: d.id, stop: sale, indice: i, ...conMeal(d, i, false) }, 'adelante')
    }
    const sacados: Stop[] = []
    let hecho = dia
    let encontrado = alFinal(hecho)
    if (!encontrado && hacerSitio) {
      for (let vuelta = 0; vuelta < MAX_SACADOS && !encontrado; vuelta++) {
        const finActual = finDelDia(hecho)
        // Lo que se puede sacar, de lo más barato a lo más caro y, a igual coste, lo de más tarde; solo si sacarlo adelanta el final del día.
        const candidatos = diurnas(hecho)
          .map((x, i) => ({ x, i, coste: costeDeSacar(x, hacerSitio) }))
          .filter((c): c is { x: Stop; i: number; coste: number } => c.coste != null)
          .sort((a, b) => a.coste - b.coste || b.i - a.i)
        let elegido: { x: Stop; dia: DayPlan } | null = null
        for (const c of candidatos) {
          const sin = compactar(route, sacarDe(hecho, c.x), enCoche, horarios)
          if (finDelDia(sin) < finActual) {
            elegido = { x: c.x, dia: sin }
            break
          }
        }
        if (!elegido) break
        sacados.push(elegido.x)
        hecho = elegido.dia
        encontrado = alFinal(hecho)
      }
    }
    // Opción B (V74): lo que cierra por la tarde (los Museos Vaticanos) no cabe pegado al final del día: se prueba a meterlo justo después de la comida, corriendo hacia delante lo que va después; lo que ya no cabe (por la
    // hora de cierre de su sitio o por pasar de la hora de cenar) sale, empezando por lo menos importante. Solo si la opción A no ha encontrado sitio.
    let enB: { dia: DayPlan; sacados: Stop[]; vecina: Stop; coste: number } | null = null
    if (!encontrado && hacerSitio) {
      const comida = dia.meals.find((m) => m.mealTime === 'lunch')
      const finComida = comida && minDe(comida.time) != null ? (minDe(comida.time) as number) + 60 : 14 * 60
      const inicioDeComida = comida && minDe(comida.time) != null ? (minDe(comida.time) as number) : null
      const construir = (fuera: Stop[], modo: 'tarde' | 'inicio') => {
        let d = dia
        for (const s of fuera) d = sacarDe(d, s)
        const ds = diurnas(d)
        const primera = modo === 'inicio' ? ds[0] : ds.find((x) => (minDe(x.time) as number) >= finComida - 30)
        if (!primera) return null
        const previa = ds[ds.indexOf(primera) - 1] ?? null
        const finPrevia = previa ? (minDe(previa.time) as number) + (previa.durationMinutes || 0) + viajeMin(previa, stop, enCoche) : 0
        const inicioBruto = modo === 'inicio' ? Math.max(minDe(primera.time) as number, abre ?? 0) : sube10(Math.max(finComida, finPrevia))
        const inicioX = stop.isFreeTour ? horaRealDelFreeTour(inicioBruto) : inicioBruto
        if (inicioX == null) return null
        if ((cierra != null && inicioX + duracion > cierra) || (abre != null && inicioX < abre) || (sol != null && inicioX + duracion > sol)) return null
        let finAnterior = inicioX + duracion
        let anterior: Stop = stop
        const rotas: Stop[] = []
        let choque = false
        const empezada = d.stops.findIndex((x) => x.id === primera.id)
        const nuevos = d.stops.map((s, i) => {
          if (i < empezada || !esSitio(s) || s.saltada || s.isNightExperience || s.isNightView || minDe(s.time) == null) return s
          const origen = minDe(s.time) as number
          const dur = s.durationMinutes || 0
          if (esFijo(s) || s.isSunset || s.checkedInAt) {
            if (finAnterior + viajeMin(anterior, s, enCoche) > origen) choque = true
            anterior = s
            finAnterior = origen + dur
            return s
          }
          let empuja = Math.max(origen, Math.ceil((finAnterior + viajeMin(anterior, s, enCoche) + 5) / 5) * 5)
          // La comida no se mueve: lo que correría hasta pisarla pasa a después de la comida.
          if (inicioDeComida != null && empuja < finComida && empuja + (s.durationMinutes || 0) > inicioDeComida) empuja = Math.ceil(finComida / 5) * 5
          const datosS = (s.hoursData as Record<string, unknown> | null | undefined) ?? horarios.get(normalizaNombre(s.name)) ?? null
          const cierraS = datosS ? minDe(horarioDeParada({ hoursData: datosS }, fecha, route.answers.month ?? null)?.cierra) : null
          if (cierraS != null && empuja + dur > cierraS) rotas.push(s)
          anterior = s
          finAnterior = empuja + dur
          return empuja === origen ? s : { ...s, time: `${String(Math.floor(empuja / 60)).padStart(2, '0')}:${String(empuja % 60).padStart(2, '0')}`, nextLegPending: true }
        })
        if (choque) return null
        const nuevo: Stop = { ...stop, checkedInAt: undefined, saltada: false, time: `${String(Math.floor(inicioX / 60)).padStart(2, '0')}:${String(inicioX % 60).padStart(2, '0')}`, nextLegPending: true }
        const stopsConX = [...nuevos.slice(0, empezada), nuevo, ...nuevos.slice(empezada)]
        const mealAfter = d.mealAfter ? { ...d.mealAfter, ...(d.mealAfter.dinner != null && d.mealAfter.dinner >= empezada ? { dinner: d.mealAfter.dinner + 1 } : {}) } : d.mealAfter
        return { dia: { ...d, stops: stopsConX, mealAfter }, rotas, exceso: finAnterior > limiteDelDia(d), vecina: previa ?? primera, inicioX }
      }
      for (const modo of ['tarde', 'inicio'] as const) {
        const fuera: Stop[] = []
        let res = construir(fuera, modo)
        for (let v = 0; v < MAX_SACADOS && res && (res.rotas.length > 0 || res.exceso); v++) {
          const pool = res.rotas.length > 0 ? res.rotas : diurnas(res.dia).filter((x) => x.id !== stop.id && (minDe(x.time) as number) >= res.inicioX + duracion)
          const cand = pool
            .map((x) => ({ x, c: costeDeSacar(x, hacerSitio) }))
            .filter((c): c is { x: Stop; c: number } => c.c != null)
            .sort((a, b) => a.c - b.c || (minDe(b.x.time) as number) - (minDe(a.x.time) as number))
          if (cand.length === 0) {
            res = null
            break
          }
          fuera.push(cand[0].x)
          res = construir(fuera, modo)
        }
  
        if (res && res.rotas.length === 0 && !res.exceso) {
          const coste = fuera.reduce((suma, x) => suma + (costeDeSacar(x, hacerSitio) ?? 0), 0)
          if (!enB || coste < enB.coste) enB = { dia: res.dia, sacados: fuera, vecina: res.vecina, coste }
        }
      }
    }
    if (!encontrado && !enB) continue
    const vecina = encontrado ? encontrado.ultima : (enB as { vecina: Stop }).vecina
    const sacadosFinal = encontrado ? sacados : (enB as { sacados: Stop[] }).sacados
    const metros = hasRealCoordinates(stop.coordinates) && hasRealCoordinates(vecina.coordinates) ? Math.min(haversineMeters(stop.coordinates, vecina.coordinates), 8000) : 8000
    const coste = sacadosFinal.reduce((suma, x) => suma + (hacerSitio ? (costeDeSacar(x, hacerSitio) ?? 0) : 0), 0)
    const puntos = metros + visitas.length * 120 + coste * 400
    if (mejor && mejor.puntos <= puntos) continue
    let resultado: DayPlan
    if (encontrado) {
      const { ultima, inicio } = encontrado
      const indice = hecho.stops.findIndex((x) => x.id === ultima.id) + 1
      const nuevo: Stop = { ...stop, checkedInAt: undefined, saltada: false, time: `${String(Math.floor(inicio / 60)).padStart(2, '0')}:${String(inicio % 60).padStart(2, '0')}`, nextLegPending: true }
      const operacion: Op = { t: 'meter', dia: dia.id, stop: nuevo, indice, ...conMeal(hecho, indice, true) }
      resultado = aplicarOpADia(hecho, operacion, 'adelante')
    } else resultado = (enB as { dia: DayPlan }).dia
    // Lo que sale va a «Lugares pendientes» de ese día (un «de camino» no: no es una visita y sale sin aviso).
    const aPendientes = sacadosFinal.filter((x) => !esDeCamino(x)).map((x) => ({ ...x, spareReason: `Con tu vuelo hemos pasado aquí ${displayStopName(stop.name)}, que es más importante.` }))
    if (aPendientes.length > 0) resultado = { ...resultado, spareStops: [...(resultado.spareStops ?? []), ...aPendientes] }
    mejor = { dia: resultado, puntos }
  }
  return mejor ? { dia: mejor.dia } : null
}

/**
 * LA RED DE SEGURIDAD: con los días como quedarían (`trabajo`), todo sitio que había en el viaje sigue en una parada o en «Lugares pendientes» (si no, va a los pendientes del día en que estaba), y un sitio que
 * la propuesta dejaría en DOS días se queda solo en el primero (o en el que lo tiene reservado). Los repetidos que ya había en el viaje no se tocan. Devuelve los días resultantes.
 */
export function garantizarNadaSeQuita(route: Route, trabajo: Map<string, DayPlan>): Map<string, DayPlan> {
  const salida = new Map(trabajo)
  const lista = (): DayPlan[] => route.days.map((day) => salida.get(day.id) as DayPlan)
  // Repetidos nuevos.
  const cuenta = (dias: DayPlan[]): Map<string, number> => {
    const mapa = new Map<string, number>()
    for (const day of dias) for (const stop of day.stops.filter(esSitio)) mapa.set(claveDeSitio(stop.name), (mapa.get(claveDeSitio(stop.name)) ?? 0) + 1)
    return mapa
  }
  const antes = cuenta(route.days)
  const ahora = cuenta(lista())
  for (const [clave, veces] of ahora) {
    if (veces <= (antes.get(clave) ?? 0) || veces < 2) continue
    const donde = lista().filter((day) => day.stops.some((stop) => esSitio(stop) && claveDeSitio(stop.name) === clave))
    const conservar = donde.find((day) => day.stops.some((stop) => claveDeSitio(stop.name) === clave && stop.reservedId)) ?? donde[0]
    for (const day of donde) {
      if (day.id === conservar.id) continue
      const original = route.days.find((x) => x.id === day.id) as DayPlan
      if (diaBloqueado(route, original)) continue
      salida.set(day.id, { ...day, stops: day.stops.filter((stop) => !(esSitio(stop) && claveDeSitio(stop.name) === clave && !stop.reservedId)) })
    }
  }
  // Lo que desaparecería.
  const presentes = new Set(lista().flatMap((day) => [...day.stops.filter(esSitio), ...(day.spareStops ?? [])].map((stop) => claveDeSitio(stop.name))))
  for (const original of route.days) {
    // (V74) Un «de camino» no es una visita: si sale de un día, sale sin aviso y no va a pendientes.
    const perdidos = original.stops.filter((stop) => esSitio(stop) && !esDeCamino(stop) && !presentes.has(claveDeSitio(stop.name)))
    if (perdidos.length === 0) continue
    const dia = salida.get(original.id) as DayPlan
    const ya = new Set((dia.spareStops ?? []).map((stop) => claveDeSitio(stop.name)))
    const nuevos = perdidos.filter((stop, i) => !ya.has(claveDeSitio(stop.name)) && perdidos.findIndex((x) => claveDeSitio(x.name) === claveDeSitio(stop.name)) === i).map((stop) => ({ ...stop, spareReason: MOTIVO_VUELO }))
    salida.set(original.id, { ...dia, spareStops: [...(dia.spareStops ?? []), ...nuevos] })
    for (const stop of perdidos) presentes.add(claveDeSitio(stop.name))
  }
  return salida
}
