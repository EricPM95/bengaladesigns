import { dayOfReservation } from './bookings'
import type { Reservation } from './bookings'
import { hasRealCoordinates, haversineMeters } from './distanceMock'
import { displayStopName } from './format'
import { numberedStopsOf } from './stopKind'
import { parseTimeToMinutes } from './time'
import { diaSiguiente } from './puestaDeSolYManana'
import type { Coordinates, DayPlan, MealSlot, Route, Stop } from './types'
import { useRouteStore } from '../store/useRouteStore'

/**
 * HOY1 (tanda del 4-nov, agente A, apartados 1, 2, 7 y 8): la lógica PURA de la siguiente parada y de su día. Sin React (salvo `aplicarCambio`, que escribe en el almacén de la ruta).
 *  · el trayecto («A pie · 12 min», «En coche · 22 min · 17 km · +5 min para aparcar»);
 *  · «Sal ahora para llegar a tu turno…» y «Vas tarde…» (solo con hora fija; desde 15 min antes de la hora de salir);
 *  · «Ya estás aquí» (por la ubicación, dentro del radio del sitio);
 *  · [Necesito más tiempo]: correr el resto del día, quitando primero lo opcional, con su [Deshacer];
 *  · «Tu día» (las filas de la lista, con la comida y la cena) y el «Parada X de Y»;
 *  · lo de mañana de la 13 y la cuenta de «Hoy vuelves a casa» (la 14).
 * Nada de esto mueve nada solo: lo que cambia el día lo propone el viajero con un toque y lleva [Deshacer]. Las paradas con reserva no se tocan nunca.
 */

export const METROS_POR_MINUTO_A_PIE = 80
/** Coche: 40 km/h de media por la isla, con la curva de la carretera (1,35 sobre la línea recta). Solo cuando el motor no trae el trayecto de la parada. */
export const KM_POR_HORA_COCHE = 40
export const RODEO_COCHE = 1.35
/** «Ya estás aquí»: dentro de este radio del sitio (m). El radio propio de cada sitio vive en los datos de los logros (servidor); aquí, uno de calle para la tarjeta. */
export const RADIO_YA_ESTAS_AQUI_M = 150
/** «Sal ahora…» sale desde estos minutos antes de la hora a la que hay que salir. */
export const AVISO_DE_SALIDA_ANTES_MIN = 15
/** Pasada la hora fija más esto, el aviso deja de salir (ya no tiene sentido). */
export const AVISO_DE_SALIDA_DESPUES_MIN = 30
/** El día no se corre más allá de esta hora (23:00). */
export const FIN_DEL_DIA_MIN = 23 * 60

const aHora = (min: number, ancho: boolean): string => {
  const m = ((Math.round(min) % 1440) + 1440) % 1440
  const h = Math.floor(m / 60)
  return `${ancho ? String(h).padStart(2, '0') : h}:${String(m % 60).padStart(2, '0')}`
}
/** «9:00» tal cual (sin el cero de delante). */
export const horaCorta = (hhmm: string | null | undefined): string => {
  const m = /^(\d{1,2}):(\d{2})/.exec(hhmm ?? '')
  return m ? `${Number(m[1])}:${m[2]}` : (hhmm ?? '')
}
export const minutosDe = (hhmm: string | null | undefined): number | null => {
  const m = /^(\d{1,2}):(\d{2})/.exec(hhmm ?? '')
  return m ? Number(m[1]) * 60 + Number(m[2]) : null
}

/* ------------------------------------------------------------------ */
/* El trayecto                                                          */
/* ------------------------------------------------------------------ */

export interface TrayectoDeParada {
  modo: 'pie' | 'coche'
  /** Minutos del trayecto (sin aparcar). */
  min: number
  km: number | null
  aparcar: number
  /** «A pie · 12 min» / «En coche · 22 min». */
  titulo: string
  /** «Desde el Panteón» / «17 km · +5 min para aparcar». */
  detalle: string | null
  /** El trayecto de verdad hasta llegar (con aparcar). */
  totalMin: number
  /** true cuando los minutos son los del motor (coche) o los de la ubicación real. */
  desdeUbicacion: boolean
}

export function trayectoHasta(p: { siguiente: Stop; ubicacion: Coordinates | null; anterior?: Stop | null; enCoche: boolean; /** La zona del alojamiento (para la primera parada del día, que no tiene parada de antes). */ casa?: Coordinates | null; /** El trayecto de salir de casa a la primera parada que trae el motor de coche (`day.coche.ida`). */ ida?: { minutos: number; km: number; aparcar_min?: number } | null }): TrayectoDeParada | null {
  const { siguiente, ubicacion, anterior, enCoche } = p
  const reales = hasRealCoordinates(siguiente.coordinates)
  const deAnterior = anterior && hasRealCoordinates(anterior.coordinates) ? anterior.coordinates : null
  const deCasa = !deAnterior && p.casa && hasRealCoordinates(p.casa) ? p.casa : null
  const desde = ubicacion ?? deAnterior ?? deCasa
  const nombreDesde = ubicacion ? null : deAnterior && anterior ? `Desde ${displayStopName(anterior.name)}` : deCasa ? 'Desde tu alojamiento' : null
  if (enCoche) {
    const t = siguiente.trayectoCoche ?? (p.ida && !anterior ? { minutos: p.ida.minutos, km: p.ida.km, aparcar_min: p.ida.aparcar_min } : null)
    if (t && Number.isFinite(t.minutos) && !ubicacion) {
      const aparcar = t.aparcar_min ?? 0
      const km = Number.isFinite(t.km) ? Math.round(t.km) : null
      return { modo: 'coche', min: t.minutos, km, aparcar, titulo: `En coche · ${t.minutos} min`, detalle: [km != null ? `${km} km` : null, aparcar ? `+${aparcar} min para aparcar` : null].filter(Boolean).join(' · ') || nombreDesde, totalMin: t.minutos + aparcar, desdeUbicacion: false }
    }
    if (reales && desde) {
      const m = haversineMeters(desde, siguiente.coordinates) * RODEO_COCHE
      const min = Math.max(1, Math.round(m / ((KM_POR_HORA_COCHE * 1000) / 60)))
      const km = Math.max(1, Math.round(m / 1000))
      const aparcar = siguiente.trayectoCoche?.aparcar_min ?? p.ida?.aparcar_min ?? 0
      return { modo: 'coche', min, km, aparcar, titulo: `En coche · ${min} min`, detalle: [`${km} km`, aparcar ? `+${aparcar} min para aparcar` : null].filter(Boolean).join(' · '), totalMin: min + aparcar, desdeUbicacion: Boolean(ubicacion) }
    }
    return null
  }
  if (reales && desde) {
    const min = Math.max(1, Math.round(haversineMeters(desde, siguiente.coordinates) / METROS_POR_MINUTO_A_PIE))
    const delMotor = !ubicacion && anterior?.walkingTimeToNextMinutes && anterior.walkingTimeToNextMinutes > 0 ? anterior.walkingTimeToNextMinutes : null
    const m = delMotor ?? min
    return { modo: 'pie', min: m, km: null, aparcar: 0, titulo: `A pie · ${m} min`, detalle: nombreDesde, totalMin: m, desdeUbicacion: Boolean(ubicacion) }
  }
  return null
}

/* ------------------------------------------------------------------ */
/* «Sal ahora» y «Vas tarde»                                            */
/* ------------------------------------------------------------------ */

export type AvisoDeSalida = 'sal' | 'tarde' | null

/** La hora fija de una parada, en minutos: su turno o reserva (con hora) o el Free Tour. Sin hora fija, null: entonces no hay aviso. */
export function horaFijaDe(stop: Stop, reserva: Pick<Reservation, 'time'> | null): number | null {
  const r = minutosDe(reserva?.time) ?? minutosDe(stop.reservationTime ?? null)
  if (r != null) return r
  if (stop.isFreeTour && stop.time) return minutosDe(stop.time)
  return null
}

/**
 * «Sal ahora…» desde 15 min antes de la hora a la que hay que salir (hora fija − trayecto); en rojo «Vas tarde…» si ya no llega (ahora + trayecto > hora fija).
 * Pasados 30 min de la hora fija, nada. Solo con hora fija.
 */
export function avisoDeSalida(ahoraMin: number, horaFijaMin: number | null, trayectoMin: number | null): AvisoDeSalida {
  if (horaFijaMin == null || trayectoMin == null) return null
  if (ahoraMin > horaFijaMin + AVISO_DE_SALIDA_DESPUES_MIN) return null
  const salir = horaFijaMin - trayectoMin
  if (ahoraMin > salir) return 'tarde'
  if (ahoraMin >= salir - AVISO_DE_SALIDA_ANTES_MIN) return 'sal'
  return null
}

export const textoDeSalida = (aviso: Exclude<AvisoDeSalida, null>, horaFijaMin: number): string =>
  aviso === 'tarde' ? `Vas tarde para tu turno de las ${aHora(horaFijaMin, false)}` : `Sal ahora para llegar a tu turno de las ${aHora(horaFijaMin, false)}`

/* ------------------------------------------------------------------ */
/* «Ya estás aquí»                                                      */
/* ------------------------------------------------------------------ */

export function estaAqui(ubicacion: Coordinates | null, stop: Stop, radioM: number = RADIO_YA_ESTAS_AQUI_M): boolean {
  if (!ubicacion || !hasRealCoordinates(stop.coordinates)) return false
  return haversineMeters(ubicacion, stop.coordinates) <= radioM
}

/* ------------------------------------------------------------------ */
/* «Tu día»: la lista y el «Parada X de Y»                              */
/* ------------------------------------------------------------------ */

export type FilaDeTuDia = { tipo: 'parada'; stop: Stop } | { tipo: 'comida'; meal: MealSlot } | { tipo: 'noche' }

/** La lista del día: las paradas numeradas, la comida y la cena donde caen (donde el viajero las dejó, o por su hora) y la cabecera «Noche». */
export function filasDelDia(day: DayPlan, paradas: Stop[]): FilaDeTuDia[] {
  const posiciones: { meal: MealSlot; despuesDe: number }[] = []
  for (const meal of day.meals) {
    if (meal.mealTime !== 'lunch' && meal.mealTime !== 'dinner') continue
    const movida = day.mealAfter?.[meal.mealTime]
    let despuesDe = movida != null && movida >= -1 && movida < paradas.length ? movida : -2
    if (despuesDe === -2) {
      const t = parseTimeToMinutes(meal.time)
      despuesDe = paradas.filter((s) => s.time && !Number.isNaN(t) && parseTimeToMinutes(s.time) < t).length - 1
    }
    posiciones.push({ meal, despuesDe })
  }
  const filas: FilaDeTuDia[] = []
  let nocheDicha = false
  const metaComidas = (despuesDe: number) => posiciones.filter((p) => p.despuesDe === despuesDe).forEach((p) => filas.push({ tipo: 'comida', meal: p.meal }))
  metaComidas(-1)
  paradas.forEach((stop, i) => {
    if (!nocheDicha && (stop.isNightExperience || stop.isNightView)) {
      filas.push({ tipo: 'noche' })
      nocheDicha = true
    }
    filas.push({ tipo: 'parada', stop })
    metaComidas(i)
  })
  return filas
}

export const tituloDeComida = (meal: MealSlot): string => {
  const base = meal.mealTime === 'dinner' ? 'Cena' : 'Comida'
  const sitio = meal.chosenRestaurant?.name ?? meal.recommendedRestaurant?.name
  if (sitio) return `${base} · ${sitio}`
  return meal.noRestaurant ? 'Comida, cerca de tu alojamiento' : meal.mealTime === 'dinner' ? 'Hora de cenar' : 'Hora de comer'
}

export interface CuentaDelDia {
  /** Las paradas del día que cuentan (las saltadas no). */
  total: number
  /** Las que ya están hechas. */
  hechas: number
  /** El «X» de «Parada X de Y»: la que toca ahora (hechas + 1, sin pasar del total). 0 si no queda ninguna. */
  ahora: number
}
/** «Parada X de Y» y «Tu día · X de Y» salen de la MISMA cuenta (las paradas del día sin las saltadas). */
export function cuentaDelDia(paradas: Stop[]): CuentaDelDia {
  const vigentes = paradas.filter((s) => !s.saltada)
  const hechas = vigentes.filter((s) => s.checkedInAt).length
  const total = vigentes.length
  return { total, hechas, ahora: hechas >= total ? 0 : hechas + 1 }
}

/* ------------------------------------------------------------------ */
/* [Necesito más tiempo]: correr el resto del día                       */
/* ------------------------------------------------------------------ */

export interface CambioDelDia {
  dayId: string
  /** Lo que valía antes (para [Deshacer]): hora y «saltada» de cada parada tocada, y hora de cada comida. */
  antes: { stops: { id: string; time: string; saltada: boolean }[]; meals: { id: string; time: string }[] }
  despues: { stops: { id: string; time: string; saltada: boolean }[]; meals: { id: string; time: string }[] }
  /** Las paradas opcionales que se han quitado para que el día quepa. */
  quitadas: string[]
  /** Cuántas paradas cambian de hora. */
  corridas: number
  /** Si, aun quitando lo opcional, algo no cabe (se avisa; no se esconde). */
  noCabe: boolean
  minutos: number
}

/**
 * Propone correr `minutos` el resto del día a partir de la parada de ahora. Las paradas con reserva (hora fija) NO se mueven; las demás se corren; si una no cabe antes de la siguiente hora
 * fija (o de las 23:00), se quita primero lo OPCIONAL (de atrás hacia delante). null si no hay nada que correr.
 */
export function proponerCorrerElDia(day: DayPlan, paradaId: string, minutos: number, fijas: Set<string>): CambioDelDia | null {
  const orden = numberedStopsOf(day)
  const i = orden.findIndex((s) => s.id === paradaId)
  if (i < 0 || minutos <= 0) return null
  const actual = orden[i]
  const t0 = minutosDe(actual.time)
  const siguientes = orden.slice(i + 1).filter((s) => !s.saltada && !s.checkedInAt)
  const plan = siguientes.map((s) => {
    const t = minutosDe(s.time)
    const fija = fijas.has(s.id) || t == null
    return { stop: s, t, fija, nueva: fija || t == null ? t : t + minutos, quitada: false }
  })
  // Lo corrido tiene que caber antes de la siguiente hora fija (o de las 23:00): si no, fuera lo OPCIONAL (el más cercano de atrás hacia delante). Lo que se quita libera su tiempo para lo que viene después.
  let noCabe = false
  const recalcular = () => {
    let libre = 0
    for (const p of plan) {
      if (p.quitada) {
        libre += p.stop.durationMinutes || 0
        continue
      }
      p.nueva = p.fija || p.t == null ? p.t : p.t + Math.max(0, minutos - libre)
    }
  }
  const limiteDe = (k: number): number => {
    for (let j = k + 1; j < plan.length; j++) if (plan[j].fija && plan[j].t != null) return plan[j].t as number
    return FIN_DEL_DIA_MIN
  }
  const sobra = (k: number): boolean => {
    const p = plan[k]
    if (p.quitada || p.fija || p.nueva == null || p.t == null || p.nueva === p.t) return false
    return p.nueva + (p.stop.durationMinutes || 0) > limiteDe(k)
  }
  recalcular()
  for (let intento = 0; intento < plan.length + 1; intento++) {
    const mal = plan.findIndex((_, k) => sobra(k))
    if (mal < 0) break
    let quitar = -1
    for (let k = mal; k >= 0; k--) if (!plan[k].fija && !plan[k].quitada && plan[k].stop.optional) { quitar = k; break }
    if (quitar < 0) {
      noCabe = true
      break
    }
    plan[quitar].quitada = true
    recalcular()
  }
  const antesS: CambioDelDia['antes']['stops'] = []
  const despuesS: CambioDelDia['despues']['stops'] = []
  const quitadas: string[] = []
  let corridas = 0
  const ancho = (s: Stop) => /^\d{2}:/.test(s.time)
  for (const p of plan) {
    if (p.quitada) {
      antesS.push({ id: p.stop.id, time: p.stop.time, saltada: Boolean(p.stop.saltada) })
      despuesS.push({ id: p.stop.id, time: p.stop.time, saltada: true })
      quitadas.push(p.stop.id)
      continue
    }
    if (p.fija || p.nueva == null || p.t == null || p.nueva === p.t) continue
    antesS.push({ id: p.stop.id, time: p.stop.time, saltada: Boolean(p.stop.saltada) })
    despuesS.push({ id: p.stop.id, time: aHora(p.nueva, ancho(p.stop)), saltada: Boolean(p.stop.saltada) })
    corridas++
  }
  // Las comidas y cenas que vienen después se corren igual (sin reserva con hora: las de restaurante reservado no se tocan).
  const antesM: CambioDelDia['antes']['meals'] = []
  const despuesM: CambioDelDia['despues']['meals'] = []
  const desde = t0 ?? 0
  for (const m of day.meals) {
    if (m.mealTime !== 'lunch' && m.mealTime !== 'dinner') continue
    if (fijas.has(m.id)) continue
    const t = minutosDe(m.time)
    if (t == null || t < desde) continue
    const nueva = t + minutos
    if (nueva > FIN_DEL_DIA_MIN) continue
    antesM.push({ id: m.id, time: m.time })
    despuesM.push({ id: m.id, time: aHora(nueva, /^\d{2}:/.test(m.time)) })
  }
  if (antesS.length === 0 && antesM.length === 0) return null
  return { dayId: day.id, antes: { stops: antesS, meals: antesM }, despues: { stops: despuesS, meals: despuesM }, quitadas, corridas, noCabe, minutos }
}

/** Escribe un lado del cambio (`despues` para aplicar, `antes` para [Deshacer]) en la ruta. */
export function aplicarCambio(cambio: CambioDelDia, lado: 'antes' | 'despues'): void {
  const datos = cambio[lado]
  const stops = new Map(datos.stops.map((s) => [s.id, s]))
  const meals = new Map(datos.meals.map((m) => [m.id, m]))
  useRouteStore.setState((state) => {
    if (!state.route) return state
    return {
      route: {
        ...state.route,
        days: state.route.days.map((d) =>
          d.id !== cambio.dayId
            ? d
            : {
                ...d,
                stops: d.stops.map((s) => {
                  const x = stops.get(s.id)
                  return x ? { ...s, time: x.time, saltada: x.saltada } : s
                }),
                meals: d.meals.map((m) => {
                  const x = meals.get(m.id)
                  return x ? { ...m, time: x.time } : m
                }),
              },
        ),
      },
    }
  })
}

/** Los ids de lo que no se mueve nunca: las paradas con entrada o reserva (con hora) y las comidas con restaurante reservado. */
export function fijasDelDia(route: Route, day: DayPlan, reservations: Reservation[]): Set<string> {
  const fijas = new Set<string>()
  const delDia = reservations.filter((r) => dayOfReservation(route, r)?.id === day.id)
  for (const s of day.stops) {
    if (s.reservedId || s.reservationTime) fijas.add(s.id)
    if (s.isFreeTour) fijas.add(s.id)
    if (delDia.some((r) => r.kind === 'entrada' && r.time && r.placeNames.includes(s.name))) fijas.add(s.id)
  }
  // (Las comidas no tienen reserva propia en la app: no hay ninguna fija. Se corren con el resto del día.)
  return fijas
}

/* ------------------------------------------------------------------ */
/* H6: «Sal de casa a las…»                                             */
/* ------------------------------------------------------------------ */

export interface SalidaDeCasa {
  /** «9:26». */
  hora: string
  trayecto: TrayectoDeParada
}

/**
 * La mañana (H6): la hora de salir de casa para llegar a la primera parada a su hora. En coche, la del motor (`day.coche.ida.salir`); a pie, la hora de la parada − el paseo desde la zona del alojamiento
 * (con pase y zona: sin esas coordenadas no se dice ninguna hora). Redondea hacia abajo de 1 en 1 (nunca se llega tarde).
 */
export function salidaDeCasa(p: { day: DayPlan; primera: Stop; zona: Coordinates | null; enCoche: boolean }): SalidaDeCasa | null {
  const { day, primera, zona, enCoche } = p
  if (enCoche) {
    const ida = day.coche?.activo ? day.coche.ida : null
    const t = primera.trayectoCoche ?? (ida ? { minutos: ida.minutos, km: ida.km, aparcar_min: ida.aparcar_min } : null)
    const hora = ida?.salir ?? /(\d{1,2}:\d{2})/.exec(day.coche?.salir_texto ?? '')?.[1] ?? null
    if (!hora || !t) return null
    const aparcar = t.aparcar_min ?? 0
    const km = Number.isFinite(t.km) ? Math.round(t.km) : null
    return { hora: horaCorta(hora), trayecto: { modo: 'coche', min: t.minutos, km, aparcar, titulo: `En coche · ${t.minutos} min`, detalle: [km != null ? `${km} km` : null, aparcar ? `+${aparcar} min para aparcar` : null].filter(Boolean).join(' · ') || null, totalMin: t.minutos + aparcar, desdeUbicacion: false } }
  }
  const inicio = minutosDe(primera.time)
  if (inicio == null || !zona || !hasRealCoordinates(zona) || !hasRealCoordinates(primera.coordinates)) return null
  const min = Math.max(1, Math.round(haversineMeters(zona, primera.coordinates) / METROS_POR_MINUTO_A_PIE))
  return { hora: aHora(inicio - min, false), trayecto: { modo: 'pie', min, km: null, aparcar: 0, titulo: `A pie · ${min} min`, detalle: null, totalMin: min, desdeUbicacion: false } }
}

/* ------------------------------------------------------------------ */
/* H13: el atardecer y lo de mañana                                     */
/* ------------------------------------------------------------------ */

export interface MananaH13 {
  diaId: string
  /** El título de la tarjeta: la primera parada de mañana (o el nombre del día). */
  titulo: string
  /** «sales a las 9:26» (con pase y zona o en coche). */
  sales: string | null
  /** «turno en la Cueva a las 11:30» (la reserva con hora de mañana). */
  turno: string | null
  /** Un consejo, si lo hay («lleva la entrada»). */
  consejo: string | null
}

/**
 * «Mañana: … · sales a las 9:26 · turno en la Cueva a las 11:30», con un consejo si lo hay. El último día no lleva. Los consejos salen de la reserva («lleva tu entrada») o del consejo corto de la primera parada.
 */
export function mananaH13(p: { route: Route; day: DayPlan; reservations: Reservation[]; nombreDelDia: (d: DayPlan) => string; nombreCorto?: (r: Reservation) => string | null; zona: Coordinates | null; enCoche: boolean }): MananaH13 | null {
  const manana = diaSiguiente(p.route, p.day)
  if (!manana) return null
  const paradas = numberedStopsOf(manana).filter((s) => !s.saltada)
  const primera = paradas.find((s) => s.time) ?? paradas[0] ?? null
  const entradas = p.reservations
    .filter((r) => r.kind === 'entrada' && !r.fueraDeRuta && r.time && dayOfReservation(p.route, r)?.id === manana.id)
    .sort((a, b) => parseTimeToMinutes(a.time) - parseTimeToMinutes(b.time))
  const e = entradas[0]
  const quien = e ? (p.nombreCorto?.(e) ?? displayStopName(e.placeNames[0] ?? e.name)) : null
  const sale = primera ? salidaDeCasa({ day: manana, primera, zona: p.zona, enCoche: p.enCoche }) : null
  const tip = primera?.insiderTip?.replace(/\s+/g, ' ').trim() ?? ''
  const consejo = e ? 'lleva tu entrada' : tip && tip.length <= 60 ? tip.replace(/^[A-ZÁÉÍÓÚ]/, (c) => c.toLowerCase()).replace(/\.$/, '') : null
  return {
    diaId: manana.id,
    titulo: primera ? displayStopName(primera.name) : p.nombreDelDia(manana),
    sales: sale ? `sales a las ${sale.hora}` : primera?.time ? `empiezas a las ${horaCorta(primera.time)}` : null,
    turno: e && quien ? `turno en ${quien} a las ${horaCorta(e.time)}` : null,
    consejo,
  }
}

/* ------------------------------------------------------------------ */
/* H14: «Hoy vuelves a casa»                                            */
/* ------------------------------------------------------------------ */

export interface LineasDeVuelta {
  /** «Tu vuelo sale a las 18:05». */
  titulo: string
  /** Las tres líneas de la tarjeta, con su icono. */
  lineas: { icono: 'reloj' | 'coche' | 'ubicacion' | 'llave'; texto: string }[]
  /** Sin pase: la frase que explica lo que daría el pase. */
  lineaPase: string | null
}

/** Las palabras de cada medio de vuelta. */
const PALABRA_VUELTA: Record<string, string> = { avion: 'vuelo', tren: 'tren', bus: 'autobús', ferry: 'barco', coche: 'viaje' }

export function lineasDeVuelta(p: {
  modo: string
  hora: string | null
  /** «hasta las 13:40» (con pase; null sin hora o sin tiempo). */
  hasta: string | null
  /** Minutos del trayecto a su aeropuerto/estación/puerto. */
  trayectoMin: number | null
  sitio: string | null
  /** «2 horas», «30 minutos». */
  margen: string | null
  enCoche: boolean
  /** Lanzarote: la hora límite del coche en la T1 (planVuelta.limite_t1). */
  limiteT1: string | null
  conPase: boolean
  nombreDelPase: string
}): LineasDeVuelta {
  const palabra = PALABRA_VUELTA[p.modo] ?? 'vuelo'
  const sitioConArticulo = p.sitio ? `${p.sitio === 'estación' ? 'la' : 'el'} ${p.sitio}` : 'el aeropuerto'
  const titulo = p.hora ? `Tu ${palabra} sale a las ${horaCorta(p.hora)}` : 'Hoy vuelves a casa'
  const lineas: LineasDeVuelta['lineas'] = []
  if (p.conPase) {
    if (p.hasta) lineas.push({ icono: 'reloj', texto: `Tienes el día libre hasta las ${horaCorta(p.hasta)}.` })
    if (p.trayectoMin != null) lineas.push({ icono: p.enCoche ? 'coche' : 'ubicacion', texto: `${p.sitio === 'estación' ? 'A la estación' : p.sitio === 'puerto' ? 'Al puerto' : 'Al aeropuerto'}: ${p.trayectoMin} min${p.enCoche ? ' en coche' : ''}.` })
  } else {
    if (p.hora) lineas.push({ icono: 'reloj', texto: `Tu ${palabra} sale a las ${horaCorta(p.hora)}.` })
    lineas.push({ icono: p.enCoche ? 'coche' : 'ubicacion', texto: p.enCoche ? `Al aeropuerto en coche.` : `Estate en ${sitioConArticulo}${p.margen ? ` ${p.margen} antes` : ''}.` })
  }
  if (p.enCoche) lineas.push({ icono: 'llave', texto: p.conPase && p.limiteT1 ? `Devuelve el coche en la T1 (llega antes de las ${horaCorta(p.limiteT1)}).` : 'Devuelve el coche en la T1.' })
  else if (p.conPase && p.margen) lineas.push({ icono: 'ubicacion', texto: `Estate en ${sitioConArticulo} ${p.margen} antes.` })
  return { titulo, lineas, lineaPase: p.conPase ? null : `Con el ${p.nombreDelPase}, te decimos hasta qué hora tienes el día.` }
}

/** [Cómo llegar] de la tarjeta: a pie (Roma) o en coche (Lanzarote), desde donde está el viajero (sin origen: la ubicación del móvil) o desde la parada de antes. */
export function urlComoLlegar(destino: Coordinates, origen: Coordinates | null, enCoche: boolean): string {
  const params = new URLSearchParams({ api: '1', destination: `${destino.lat},${destino.lng}`, travelmode: enCoche ? 'driving' : 'walking' })
  if (origen) params.set('origin', `${origen.lat},${origen.lng}`)
  return `https://www.google.com/maps/dir/?${params.toString()}`
}
