/**
 * LOS AVISOS DEL VIAJE CON EL MÓVIL BLOQUEADO (tanda HOY3, 5-nov). Módulo PURO (sin red, sin base de datos, sin reloj propio: todo lo que depende de la hora recibe el instante), compartido:
 * lo usa el servidor (server/avisosViaje.js) y lo prueba `scripts/destino/pruebaTandaHOY3.mjs` con un reloj de mentira.
 *
 * De la ruta de un viaje (y sus reservas) saca la LISTA de avisos del viaje, cada uno con su hora EN LA HORA DEL DESTINO (Lanzarote: Atlantic/Canary, una hora por detrás de la Península):
 *   1. `manana`         30 min antes de la hora de salir de casa, nunca antes de las 7:30: «Buenos días. Hoy toca El norte de Manrique: sal de casa a las 9:26.» (con el aviso del tiempo de hoy, si lo hay)
 *   2. `turno`          a la hora de salir hacia un turno o una reserva, solo si los hay: «Sal ahora para llegar a tu turno de las 11:30.»
 *   3. `tiempo_noche`   la noche antes (21:00), solo si mañana toca (lluvia, nubes en los miradores del norte, viento fuerte: umbrales de data/hoy/avisos_tiempo.json)
 *   4. `atardecer`      1 h antes de la puesta de sol, con la parada del día o el sitio de atardecer más cercano a la zona de hoy
 *   5. `llegada`        aterrizaje + 10 min el primer día: «Bienvenido a Lanzarote. Cuando tengas el coche, empiezas hacia las 11:25.» (el único que puede salir de noche)
 *   6. `vuelta_manana` y `vuelta_salir`  el último día: «Hoy vuelves a casa. Devuelve el coche en la T1 antes de las 17:10.» y, media hora antes de salir hacia el aeropuerto, «En media hora tienes que salir hacia el aeropuerto.»
 * Límites: como mucho 4 al día (los de menos prioridad se caen) y ninguno entre las 22:00 y las 7:30 (salvo el de llegada).
 *
 * Las cuentas de verdad no se duplican: la hora de salir de casa es la del motor de coche (`day.coche.ida.salir`, la misma de `salidaDeCasa` en src/lib/hoyParada.ts); el sol, `shared/routeEngine/sunset.js`
 * (la misma cuenta de `atardecerDelDestino`); los sitios de atardecer, `src/data/sitiosDeAtardecer.json`; los umbrales y los sitios del tiempo, `data/hoy/avisos_tiempo.json`. Lo único que está escrito dos veces es
 * la cuenta de qué avisos del tiempo tocan (`avisosDelTiempoDeUnDia`, puerto de `calcularAvisos` de src/lib/avisosDelTiempo.ts, que es TypeScript y el servidor no lo puede leer): la prueba comprueba que dan lo mismo.
 */
import { sunsetMinutesOn } from '../routeEngine/sunset.js'

/* ---------------------------------------------------------------- Las cifras (todas aquí) */
export const MANANA_ANTES_MIN = 30
export const NO_ANTES_DE_MIN = 7 * 60 + 30
export const NO_DESPUES_DE_MIN = 22 * 60
export const MAX_AL_DIA = 4
export const TIEMPO_NOCHE_MIN = 21 * 60
export const ATARDECER_ANTES_MIN = 60
export const LLEGADA_DESPUES_MIN = 10
export const VUELTA_ANTES_MIN = 30
/** Un aviso que se ha quedado sin mandar (la tarea no corrió) deja de valer pasado este tiempo: «Sal ahora» dos horas tarde no sirve. */
export const MAX_RETRASO_MIN = 30
/** Si el trayecto hasta el turno no está en la ruta, se cuenta esto (min). */
export const TRAYECTO_POR_DEFECTO_MIN = 20
const KM_H_COCHE = 40
const RODEO = 1.35
const MAX_EN_COCHE_AL_ATARDECER_MIN = 45

/** El centro del destino para la puesta de sol y su hora (la misma lista que `SOL_POR_DESTINO` de src/lib/puestaDeSolYManana.ts). */
const SOL_POR_DESTINO = { lanzarote: { centro: [29.0024, -13.6114], zona: 'Atlantic/Canary' }, roma: { centro: [41.9028, 12.4964], zona: 'Europe/Rome' } }
export const ZONA_POR_DEFECTO = 'Europe/Madrid'

/* ---------------------------------------------------------------- Horas y fechas */
const aMin = (hhmm) => {
  const m = /^(\d{1,2}):(\d{2})/.exec(String(hhmm ?? ''))
  return m ? Number(m[1]) * 60 + Number(m[2]) : null
}
/** «9:26» (sin el cero de delante), como en HOY. */
export const horaCorta = (min) => {
  const m = ((Math.round(min) % 1440) + 1440) % 1440
  return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`
}
export const addDias = (iso, n) => new Date(Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10) + n)).toISOString().slice(0, 10)

const zonaValida = (z) => {
  try {
    new Intl.DateTimeFormat('es', { timeZone: z })
    return true
  } catch {
    return false
  }
}
/** Minutos de diferencia (hora de la zona − UTC) en ese instante. */
function desfaseMin(ms, zona) {
  const f = new Intl.DateTimeFormat('en-CA', { timeZone: zona, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' })
  const p = Object.fromEntries(f.formatToParts(new Date(ms)).map((x) => [x.type, x.value]))
  return Math.round((Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - Math.floor(ms / 1000) * 1000) / 60000)
}
/** El instante (UTC) de una fecha «aaaa-mm-dd» y unos minutos desde las 0:00 EN LA HORA DE ESA ZONA (los minutos pueden pasar de 1440). */
export function instanteDe(fechaIso, min, zona) {
  const z = zonaValida(zona) ? zona : ZONA_POR_DEFECTO
  const base = Date.UTC(+fechaIso.slice(0, 4), +fechaIso.slice(5, 7) - 1, +fechaIso.slice(8, 10)) + min * 60000
  const primero = base - desfaseMin(base, z) * 60000
  return new Date(base - desfaseMin(primero, z) * 60000)
}
/** La fecha y los minutos del día de un instante en la hora de esa zona. */
export function localDe(instante, zona) {
  const z = zonaValida(zona) ? zona : ZONA_POR_DEFECTO
  const f = new Intl.DateTimeFormat('en-CA', { timeZone: z, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
  const p = Object.fromEntries(f.formatToParts(instante).map((x) => [x.type, x.value]))
  return { fecha: `${p.year}-${p.month}-${p.day}`, min: Number(p.hour) * 60 + Number(p.minute) }
}
/** ¿Cae en horas de silencio (de las 22:00 a las 7:30)? */
export const esDeNoche = (min) => min >= NO_DESPUES_DE_MIN || min < NO_ANTES_DE_MIN

const sinTildes = (t) => String(t ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
const km = (a, b) => {
  const r = Math.PI / 180
  const x = (b.lng - a.lng) * r * Math.cos(((a.lat + b.lat) / 2) * r)
  const y = (b.lat - a.lat) * r
  return Math.sqrt(x * x + y * y) * 6371
}
const hayCoords = (c) => c && Number.isFinite(c.lat) && Number.isFinite(c.lng) && !(c.lat === 0 && c.lng === 0)

/* ---------------------------------------------------------------- Las paradas del día */
/** Las paradas con número del día que siguen en pie (sin saltar), en orden de hora (igual que `numberedStopsOf`). */
export function paradasDelDia(day) {
  const lista = (day?.stops ?? []).filter((s) => !s.isZoneWalk && !s.isBreak && !s.passThrough && !s.isFreeTime && !s.saltada)
  const mins = lista.map((s) => aMin(s.time))
  if (mins.some((m) => m == null)) return lista
  return lista.map((s, i) => ({ s, i, m: mins[i] })).sort((a, b) => a.m - b.m || a.i - b.i).map((x) => x.s)
}
/** «La Graciosa (excursión)» → «La Graciosa»; «Fuego y mar: el sur volcánico» → «Fuego y mar» (sin lo que va entre paréntesis ni detrás de los dos puntos: la frase ya lleva los suyos). */
export const tituloDelDia = (day) => String(day?.curatedTitle || day?.title || '').replace(/\s*\([^)]*\)\s*/g, ' ').split(':')[0].replace(/\s+/g, ' ').trim()

/** La hora de salir de casa del día, en minutos: la del motor de coche (`coche.ida.salir`, o «Sal de casa a las…» del texto); sin coche, la de la primera parada. */
export function salidaDeCasaDelDia(day) {
  const ida = day?.coche?.activo !== false ? day?.coche?.ida : null
  const delMotor = aMin(ida?.salir) ?? aMin(/(\d{1,2}:\d{2})/.exec(day?.coche?.salir_texto ?? '')?.[1])
  if (delMotor != null) return { min: delMotor, enCoche: true }
  const primera = paradasDelDia(day).find((s) => aMin(s.time) != null)
  return primera ? { min: aMin(primera.time), enCoche: false } : null
}

/* ---------------------------------------------------------------- El tiempo (puerto de calcularAvisos) */
const llueve = (m, h, u) => (m.probability?.[h] ?? 0) >= u.lluvia.probabilidad_pct || (m.precipitation?.[h] ?? 0) >= u.lluvia.mm_por_hora
const nubes = (m, h, u) => (m.cloud?.[h] ?? 0) >= u.nubes.nubes_bajas_pct
const viento = (m, h, u) => (m.gust?.[h] ?? 0) >= u.viento.rachas_kmh
const cuenta = (stop, clave) => sinTildes(stop.name).includes(clave) || sinTildes(stop.fullName ?? '').includes(clave)
function horasDeParada(stop) {
  const ini = aMin(stop.time)
  if (ini == null) return []
  const fin = ini + Math.max(30, stop.durationMinutes || 60)
  const horas = []
  for (let h = Math.floor(ini / 60); h <= Math.floor((fin - 1) / 60); h++) if (h >= 0 && h <= 23) horas.push(h)
  return horas
}
const cuandoLlueve = (horas) => (horas.every((h) => h < 14) ? 'por la mañana' : horas.every((h) => h >= 14) ? 'por la tarde' : 'durante el día')

/**
 * Qué avisos del tiempo tocan en un día de Lanzarote (lluvia, nubes sobre un mirador del norte, viento fuerte) y qué alternativa hay. Misma cuenta que `calcularAvisos` (src/lib/avisosDelTiempo.ts).
 * @returns {{ tipo: 'lluvia'|'nubes'|'viento', sitio: string|null, cuando: string, hayAlternativa: boolean, salen: string[] }[]}
 */
export function avisosDelTiempoDeUnDia(day, meteo, tiempo) {
  if (!day || !meteo || !tiempo?.umbrales) return []
  const u = tiempo.umbrales
  const lz = tiempo.lanzarote
  const A_CUBIERTO = lz.a_cubierto
  const yaACubierto = (s) => A_CUBIERTO.some((c) => cuenta(s, c.clave)) || lz.ya_a_cubierto_si_el_nombre_contiene.some((p) => sinTildes(s.name).includes(p))
  const paradas = paradasDelDia(day).filter((s) => !s.isArrival && !s.checkedInAt)
  const quedan = paradas.filter((s) => !s.reservedId)
  const hayAlternativaACubierto = (salen) => {
    const hora = salen[0]?.time && /^\d{1,2}:\d{2}$/.test(salen[0].time) ? aMin(salen[0].time) : null
    const candidatos = A_CUBIERTO.filter((c) => !(day.stops ?? []).some((s) => cuenta(s, c.clave))).filter((c) => (hora == null ? true : hora >= aMin(c.abre) && hora + Math.min(c.minutos, 45) <= aMin(c.cierra)))
    return candidatos.length > 0
  }
  const avisos = []
  const alAire = quedan.filter((s) => !yaACubierto(s) && horasDeParada(s).some((h) => llueve(meteo, h, u)))
  const horasMojadas = [...new Set(paradas.flatMap(horasDeParada).filter((h) => llueve(meteo, h, u)))]
  if (horasMojadas.length > 0 && alAire.length > 0) {
    const salen = alAire.slice(0, 2)
    avisos.push({ tipo: 'lluvia', sitio: null, cuando: cuandoLlueve(horasMojadas), hayAlternativa: hayAlternativaACubierto(salen), salen: salen.map((s) => s.name) })
  }
  const tapados = quedan.filter((s) => lz.miradores_de_nubes.some((m) => cuenta(s, m.clave)) && horasDeParada(s).some((h) => nubes(meteo, h, u)))
  if (tapados.length > 0) {
    const primero = tapados[0]
    const sitio = lz.miradores_de_nubes.find((m) => cuenta(primero, m.clave))
    const soloElRio = tapados.length === 1 && sitio.solo_si_tapado && !(day.stops ?? []).some((s) => cuenta(s, sitio.solo_si_tapado))
    avisos.push({ tipo: 'nubes', sitio: sitio.nombre, cuando: 'hoy', hayAlternativa: Boolean(soloElRio) || hayAlternativaACubierto([primero]), salen: [primero.name] })
  }
  const ventosos = quedan.filter((s) => lz.sitios_de_viento.some((v) => cuenta(s, v.clave)) && horasDeParada(s).some((h) => viento(meteo, h, u)))
  if (ventosos.length > 0) {
    const primero = ventosos[0]
    const sitio = lz.sitios_de_viento.find((v) => cuenta(primero, v.clave))
    avisos.push({ tipo: 'viento', sitio: sitio.nombre, cuando: 'hoy', hayAlternativa: hayAlternativaACubierto([primero]), salen: [primero.name] })
  }
  return avisos
}

/** «Mirador del Río» → «el Mirador del Río»; «Ermita de las Nieves» → «la Ermita de las Nieves»; «Las Grietas», «Famara»… tal cual. */
const conArticulo = (nombre) => (/^(Mirador|Bosquecillo)/.test(nombre) ? `el ${nombre}` : /^Ermita/.test(nombre) ? `la ${nombre}` : nombre)

/** La frase del tiempo para un aviso del móvil. `cuando`: 'hoy' (va dentro del aviso de la mañana) o 'manana' (el de las 21:00). Vacía si no hay nada que decir. */
export function fraseDelTiempo(avisos, cuando) {
  const a = avisos?.[0]
  if (!a) return ''
  const dia = cuando === 'manana' ? 'Mañana' : 'Hoy'
  const alt = a.hayAlternativa ? 'Te hemos preparado una alternativa en HOY.' : 'Mira en HOY cómo organizar el día.'
  const base = a.tipo === 'lluvia' ? `${dia} va a llover ${a.cuando}.` : a.tipo === 'nubes' ? `${dia} ${cuando === 'manana' ? 'habrá' : 'hay'} nubes en ${conArticulo(a.sitio)}.` : `${dia} ${cuando === 'manana' ? 'habrá' : 'hay'} viento fuerte en ${conArticulo(a.sitio)}.`
  const mas = avisos.length > 1 ? ' Hay más avisos del tiempo en HOY.' : ''
  return `${base} ${alt}${mas}`
}

/* ---------------------------------------------------------------- Las paradas fijas (turnos y reservas) */
function fijasDelDia(route, day, fecha, reservations) {
  const salida = []
  const paradas = paradasDelDia(day)
  const usadas = new Set()
  for (const r of reservations ?? []) {
    if (!r || r.fueraDeRuta || !aMin(r.time)) continue
    const esDeHoy = r.dateIso ? r.dateIso === fecha : r.dayNumber != null && r.dayNumber === day.dayNumber
    if (!esDeHoy) continue
    const nombres = [r.name, ...(r.placeNames ?? [])].map(sinTildes).filter(Boolean)
    const parada = paradas.find((s) => aMin(s.time) === aMin(r.time) && !usadas.has(s.id)) ?? paradas.find((s) => !usadas.has(s.id) && nombres.some((n) => sinTildes(s.name).includes(n) || n.includes(sinTildes(s.name))))
    if (parada) usadas.add(parada.id)
    salida.push({ min: aMin(r.time), parada })
  }
  for (const s of paradas) {
    if (usadas.has(s.id)) continue
    const m = aMin(s.reservationTime) ?? (s.isFreeTour ? aMin(s.time) : null)
    if (m != null) salida.push({ min: m, parada: s })
  }
  return salida.sort((a, b) => a.min - b.min).filter((x, i, l) => i === 0 || x.min !== l[i - 1].min)
}
/** Minutos de trayecto hasta una parada (con aparcar, en coche): lo que dice el motor; si no, la distancia en línea recta; si no, 20. */
function trayectoHasta(day, parada) {
  if (!parada) return TRAYECTO_POR_DEFECTO_MIN
  const t = parada.trayectoCoche
  if (t && Number.isFinite(t.minutos)) return Math.round(t.minutos + (t.aparcar_min ?? 0))
  const lista = paradasDelDia(day)
  const i = lista.findIndex((s) => s.id === parada.id)
  if (i === 0 && day.coche?.ida && Number.isFinite(day.coche.ida.minutos)) return Math.round(day.coche.ida.minutos + (day.coche.ida.aparcar_min ?? 0))
  const antes = i > 0 ? lista[i - 1] : null
  if (antes && hayCoords(antes.coordinates) && hayCoords(parada.coordinates) && day.coche?.activo) return Math.max(2, Math.round(((km(antes.coordinates, parada.coordinates) * RODEO) / KM_H_COCHE) * 60) + 5)
  return TRAYECTO_POR_DEFECTO_MIN
}

/* ---------------------------------------------------------------- El atardecer */
const listaDeAtardecer = (datos, destino) => datos?.atardecer?.[String(destino ?? '').trim().toLowerCase()] ?? null
function lugarDelAtardecer(day, lista) {
  const paradas = paradasDelDia(day)
  const dePosta = paradas.find((s) => s.isSunset) ?? null
  const delSitio = (s) => lista.sitios.find((x) => x.alias.some((a) => sinTildes(s.name).includes(a)))
  // La del atardecer es la última del día que está en la lista (la parada marcada por el motor, si la hay, va primero).
  for (const s of dePosta ? [dePosta, ...[...paradas].reverse()] : [...paradas].reverse()) {
    const x = delSitio(s)
    if (x) return { nombre: x.corto, deLaRuta: true }
  }
  if (dePosta) return { nombre: String(dePosta.name).replace(/^(El|La|Los|Las)\s/, (a) => a.toLowerCase()), deLaRuta: true }
  // Sin parada de atardecer: el sitio de atardecer más cercano a la zona de hoy (el centro de las paradas; sin paradas, adonde va el coche).
  const puntos = paradas.map((s) => s.coordinates).filter(hayCoords)
  const centro = puntos.length
    ? { lat: puntos.reduce((a, p) => a + p.lat, 0) / puntos.length, lng: puntos.reduce((a, p) => a + p.lng, 0) / puntos.length }
    : hayCoords({ lat: day?.coche?.ida?.destino?.lat, lng: day?.coche?.ida?.destino?.lng })
      ? { lat: day.coche.ida.destino.lat, lng: day.coche.ida.destino.lng }
      : null
  if (!centro) return null
  let mejor = null
  for (const x of lista.sitios) {
    const d = km(centro, { lat: x.lat, lng: x.lng })
    const enCoche = Math.max(2, Math.round(((d * RODEO) / KM_H_COCHE) * 60))
    if (enCoche <= MAX_EN_COCHE_AL_ATARDECER_MIN && (!mejor || d < mejor.d)) mejor = { d, nombre: x.corto }
  }
  return mejor ? { nombre: mejor.nombre, deLaRuta: false } : null
}

/* ---------------------------------------------------------------- La lista de avisos del viaje */
const PRIORIDAD = { llegada: 0, vuelta_salir: 1, vuelta_manana: 1, turno: 2, manana: 3, tiempo_noche: 4, atardecer: 5 }

/**
 * Todos los avisos del viaje, ya con su hora y su texto, ordenados por hora.
 * @param {object} p
 * @param {object} p.route        la ruta (`trips.route`)
 * @param {object[]} [p.reservations]  las reservas del viaje (`trips.bookings.reservations`)
 * @param {string} [p.zona]       la zona horaria del destino («Atlantic/Canary»); sin ella, la del primer día o la de la Península
 * @param {{ tiempo?: object, atardecer?: object }} [p.datos]  `tiempo` = data/hoy/avisos_tiempo.json; `atardecer` = src/data/sitiosDeAtardecer.json
 * @param {(fecha: string) => ({probability:number[],precipitation:number[],cloud?:number[],gust?:number[]}|null|undefined)} [p.meteo]  la previsión por horas de un día (sin ella, no hay avisos del tiempo)
 * @param {string[]} [p.soloDias] solo los avisos de estos días del viaje (el día de prueba): el aviso de la noche antes cuenta para el día del que habla
 * @returns {{ clave: string, tipo: string, fecha: string, min: number, instante: Date, diaFecha: string, texto: string, prioridad: number }[]}
 *   `fecha`/`min` = cuándo sale (hora del destino); `diaFecha` = de qué día del viaje habla; `clave` = única por viaje (para no mandarlo dos veces).
 */
export function planDelViaje({ route, reservations = [], zona, datos = {}, meteo = () => null, soloDias = null }) {
  const inicio = route?.answers?.dateRange?.start
  const dias = route?.days ?? []
  if (!inicio || dias.length === 0) return []
  const tz = zona && zonaValida(zona) ? zona : dias.find((d) => d.zonaHorariaDia && zonaValida(d.zonaHorariaDia))?.zonaHorariaDia ?? ZONA_POR_DEFECTO
  const destino = route.destination ?? ''
  const esLanzarote = sinTildes(destino) === 'lanzarote'
  const lista = listaDeAtardecer(datos, destino)
  const sol = SOL_POR_DESTINO[sinTildes(destino)] ?? null
  const ordenados = [...dias].sort((a, b) => a.dayNumber - b.dayNumber)
  const ultimo = ordenados[ordenados.length - 1]
  const avisos = []
  const poner = (tipo, fecha, min, diaFecha, texto, extra = '') => {
    if (!texto) return
    avisos.push({ clave: `${tipo}:${diaFecha}${extra ? `:${extra}` : ''}`, tipo, fecha, min, instante: instanteDe(fecha, min, tz), diaFecha, texto, prioridad: PRIORIDAD[tipo] })
  }

  for (const day of ordenados) {
    const fecha = addDias(inicio, day.dayNumber - 1)
    const esPrimero = day === ordenados[0]
    const esVuelta = day === ultimo && (day.isReturnLeg === true || route.departureFlightTime || day.coche?.vuelta?.limite_t1)
    const salida = salidaDeCasaDelDia(day)
    const titulo = tituloDelDia(day)
    const coche = Boolean(day.coche?.activo || route.defaultTransport === 'car')

    // 5. La llegada: aterrizaje + 10 min (en la hora del destino). El día de llegada no lleva el aviso de la mañana: ya vas de camino.
    let hayLlegada = false
    if (esPrimero && aMin(route.arrivalFlightTime) != null) {
      hayLlegada = true
      const util = aMin(day.coche?.ida?.salir) ?? aMin(paradasDelDia(day).find((s) => aMin(s.time) != null)?.time)
      const cuando = coche ? 'Cuando tengas el coche' : 'Cuando llegues a tu alojamiento'
      const min = aMin(route.arrivalFlightTime) + LLEGADA_DESPUES_MIN
      const loc = localDe(instanteDe(fecha, min, tz), tz)
      poner('llegada', loc.fecha, loc.min, fecha, util != null ? `Bienvenido a ${destino}. ${cuando}, empiezas hacia las ${horaCorta(util)}.` : `Bienvenido a ${destino}. Abre HOY para ver tu primer día.`)
    }

    // 1. La mañana (o, el último día, «Hoy vuelves a casa»).
    if (!hayLlegada || esVuelta) {
      const salir = salida?.min ?? null
      const base = salir != null ? salir - MANANA_ANTES_MIN : 9 * 60
      const min = Math.max(NO_ANTES_DE_MIN, base)
      if (esVuelta) {
        const limite = day.coche?.vuelta?.limite_t1
        const vuelo = route.departureFlightTime
        const texto = limite ? `Hoy vuelves a casa. Devuelve el coche en la T1 antes de las ${horaCorta(aMin(limite))}.` : vuelo ? `Hoy vuelves a casa. Tu vuelo sale a las ${horaCorta(aMin(vuelo))}.` : 'Hoy vuelves a casa. Mira en HOY lo que te queda por hacer.'
        poner('vuelta_manana', fecha, min, fecha, texto)
      } else if (salir != null) {
        const tiempo = esLanzarote ? fraseDelTiempo(avisosDelTiempoDeUnDia(day, meteo(fecha), datos.tiempo), 'hoy') : ''
        const yaEsHora = salir <= min
        const que = yaEsHora ? 'es hora de salir de casa' : salida.enCoche ? `sal de casa a las ${horaCorta(salir)}` : `empiezas a las ${horaCorta(salir)}`
        poner('manana', fecha, min, fecha, `Buenos días. Hoy toca ${titulo}: ${que}.${tiempo ? ` ${tiempo}` : ''}`)
      }
    }

    // 6b. El último día: media hora antes de salir hacia el aeropuerto.
    if (esVuelta) {
      const v = day.coche?.vuelta
      const sale = aMin(v?.sale) ?? (aMin(v?.limite_t1) != null && Number.isFinite(v?.minutos) ? aMin(v.limite_t1) - v.minutos : null)
      // (Arreglo, 6-nov; decisión de Eric) Con la hora límite de la T1 (devolver el coche): a la hora de la T1 menos 30 min, «En media hora tienes que dejar el coche en la T1 (antes de las 17:10).»; fuera el de «salir hacia el aeropuerto» (era una hora antes y no servía). Sin esa hora (sin coche), el de siempre.
      const limiteT1 = aMin(v?.limite_t1)
      if (limiteT1 != null) poner('vuelta_salir', fecha, limiteT1 - VUELTA_ANTES_MIN, fecha, `En media hora tienes que dejar el coche en la T1 (antes de las ${horaCorta(limiteT1)}).`)
      else if (sale != null) poner('vuelta_salir', fecha, sale - VUELTA_ANTES_MIN, fecha, 'En media hora tienes que salir hacia el aeropuerto.')
    }

    // 2. Los turnos y las reservas: a la hora de salir hacia ellos.
    for (const f of fijasDelDia(route, day, fecha, reservations)) {
      const salir = f.min - trayectoHasta(day, f.parada)
      poner('turno', fecha, Math.max(NO_ANTES_DE_MIN, salir), fecha, `Sal ahora para llegar a tu turno de las ${horaCorta(f.min)}.`, horaCorta(f.min))
    }

    // 4. El atardecer: 1 h antes de la puesta de sol (no el día que vuelves a casa).
    if (lista && sol && !esVuelta) {
      const delMotor = /(\d{1,2}):(\d{2})/.exec(day.sunsetText ?? '')
      const horaSol = delMotor ? Number(delMotor[1]) * 60 + Number(delMotor[2]) : sunsetMinutesOn(fecha, sol.centro, sol.zona)
      if (horaSol != null) {
        const lugar = lugarDelAtardecer(day, lista)
        poner('atardecer', fecha, horaSol - ATARDECER_ANTES_MIN, fecha, `Hoy el sol se pone a las ${horaCorta(horaSol)}.${lugar ? ` Desde ${lugar.nombre} se ve precioso.` : ''}`)
      }
    }

    // 3. El tiempo, la noche antes (21:00).
    if (esLanzarote && !esVuelta) {
      const frase = fraseDelTiempo(avisosDelTiempoDeUnDia(day, meteo(fecha), datos.tiempo), 'manana')
      if (frase) poner('tiempo_noche', addDias(fecha, -1), TIEMPO_NOCHE_MIN, fecha, frase)
    }
  }

  // Los límites: nada de noche (salvo la llegada) y como mucho 4 al día (los de menos prioridad se caen).
  const buenos = avisos.filter((a) => a.tipo === 'llegada' || !esDeNoche(a.min)).filter((a) => !soloDias || soloDias.includes(a.diaFecha))
  const porDia = new Map()
  for (const a of buenos) porDia.set(a.fecha, [...(porDia.get(a.fecha) ?? []), a])
  const quedan = []
  for (const delDia of porDia.values()) quedan.push(...[...delDia].sort((a, b) => a.prioridad - b.prioridad || a.min - b.min).slice(0, MAX_AL_DIA))
  return quedan.sort((a, b) => a.instante - b.instante || a.prioridad - b.prioridad)
}

/** Los avisos que ya les toca y todavía valen: su hora ya ha pasado y no hace más de `retrasoMax` minutos. */
export function avisosDebidos(plan, instante, { retrasoMax = MAX_RETRASO_MIN } = {}) {
  const t = instante.getTime()
  return plan.filter((a) => a.instante.getTime() <= t && t - a.instante.getTime() <= retrasoMax * 60000)
}
