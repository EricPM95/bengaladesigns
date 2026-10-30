import type { Route } from './types'

/**
 * CÓMO SE ENSEÑA LA DURACIÓN DE UN VIAJE (Tanda 7, punto 1). Una sola regla, en un solo sitio: siempre los dos, primero los días y después las noches —
 * «{n+1} días · {n} noches» (del 10 al 14 de octubre: «5 días · 4 noches»); con una sola fecha, «1 día». Todo texto visible que cuente los días de un viaje llama a estas funciones.
 *
 * Por dentro no cambia nada: los viajes guardan `days` (= noches + 1) como siempre y la ruta lleva el día de vuelta aparte (invariante 21: `contentDays = días − 1`); aquí solo se cambia cómo se escribe.
 * `dias` es siempre el TOTAL del viaje (el día de vuelta incluido), nunca los días de ruta.
 */

/** «1 noche» / «4 noches». */
export function textoDeNoches(noches: number): string {
  return `${noches} ${noches === 1 ? 'noche' : 'noches'}`
}

/** «1 día» / «5 días». */
export function textoDeDias(dias: number): string {
  return `${dias} ${dias === 1 ? 'día' : 'días'}`
}

/**
 * «5 días · 4 noches»; con un solo día, «1 día». Sin días (0 o menos), vacío.
 * `noches`: solo cuando no son los días menos uno (el tramo de un viaje de varios destinos, que duerme su último día).
 */
export function textoDeDuracion(dias: number, noches: number = dias - 1): string {
  if (!Number.isFinite(dias) || dias < 1) return ''
  return dias === 1 ? textoDeDias(1) : `${textoDeDias(dias)} · ${textoDeNoches(noches)}`
}

/** Los días del viaje entero, el de vuelta incluido: los de la ruta o, si aún no la hay, los que eligió el viajero (`answers.days`). 0 si no se sabe. */
export function diasDelViaje(route: Pick<Route, 'days' | 'answers'>): number {
  return route.days.length || (route.answers?.days ?? 0)
}

// ── La duración de un TRAYECTO (10S5, M): la calcula la app con las dos horas ─────────────────────────────────────────────────────────────
// «1 h 55 min»: la hora de salida y la de llegada son las locales de cada lado, así que con un vuelo entre dos países la diferencia de relojes NO es la duración
// (Barcelona 08:30 → Londres 09:50 son 2 h 20 min, no 1 h 20). Se pasa cada hora a su instante real con la zona horaria de cada aeropuerto (con su cambio de hora de ese día).
// Sin las dos horas, o sin saber la zona de un lado cuando las dos zonas pueden ser distintas (avión), NO hay duración (null): nunca se inventa.

const HHMM = /^(\d{1,2}):(\d{2})$/
const ISO = /^(\d{4})-(\d{2})-(\d{2})$/

/** Cuánto va por delante de UTC la zona `zona` en el instante `ms` (en ms). */
function desfaseDeZona(zona: string, ms: number): number {
  const partes = new Intl.DateTimeFormat('en-US', { timeZone: zona, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' }).formatToParts(new Date(ms))
  const n = (tipo: string) => Number(partes.find((p) => p.type === tipo)?.value)
  return Date.UTC(n('year'), n('month') - 1, n('day'), n('hour'), n('minute'), n('second')) - Math.floor(ms / 1000) * 1000
}

/** El instante (ms UTC) en que en `zona` los relojes marcan `fecha` + `hora`. */
function instanteLocal(fecha: string, hora: string, zona: string | null): number | null {
  const f = fecha.match(ISO), h = hora.match(HHMM)
  if (!f || !h) return null
  const ingenuo = Date.UTC(Number(f[1]), Number(f[2]) - 1, Number(f[3]), Number(h[1]), Number(h[2]))
  if (!zona) return ingenuo
  try {
    const primero = ingenuo - desfaseDeZona(zona, ingenuo)
    return ingenuo - desfaseDeZona(zona, primero)
  } catch {
    return null
  }
}

export interface EntradaTrayecto {
  /** Día de salida, `YYYY-MM-DD` (si falta, hoy: solo cambia algo en los días del cambio de hora). */
  fecha?: string | null
  /** Día de llegada, solo si no es el mismo (se ve en el billete). */
  fechaLlegada?: string | null
  horaSalida: string | null | undefined
  horaLlegada: string | null | undefined
  /** Zona IANA de cada lado («Europe/Madrid»), de `aeropuertoPorIata(..).zona`. */
  zonaSalida?: string | null
  zonaLlegada?: string | null
  /** Tren, autobús, barco dentro de un país: si no se sabe la zona de ninguno de los dos lados, se cuentan los dos con el mismo reloj. Avión: no. */
  mismaZonaSiFalta?: boolean
}

/** Minutos del trayecto, o `null` si no se saben (falta una hora, o una zona con dos países posibles) o el resultado no tiene sentido (≤ 0 o más de 48 h). */
export function duracionDelTrayecto(e: EntradaTrayecto): number | null {
  if (!e.horaSalida || !e.horaLlegada) return null
  let zonaSal = e.zonaSalida ?? null
  let zonaLle = e.zonaLlegada ?? null
  if (!zonaSal || !zonaLle) {
    // Falta la zona de un lado: solo se sigue con `mismaZonaSiFalta` (tren, autobús, barco), y entonces los dos lados usan la misma (la que haya, o ninguna).
    if (!e.mismaZonaSiFalta) return null
    zonaSal = zonaLle = zonaSal ?? zonaLle
  }
  const salidaDia = e.fecha && ISO.test(e.fecha) ? e.fecha : new Date().toISOString().slice(0, 10)
  const salida = instanteLocal(salidaDia, e.horaSalida, zonaSal)
  if (salida == null) return null
  let llegada = instanteLocal(e.fechaLlegada && ISO.test(e.fechaLlegada) ? e.fechaLlegada : salidaDia, e.horaLlegada, zonaLle)
  if (llegada == null) return null
  // Sin día de llegada, si sale antes que la salida, es que llega al día siguiente (y los husos pueden hacer que sea el mismo día).
  if (!e.fechaLlegada) while (llegada <= salida && salida - llegada < 36 * 3600_000) llegada += 24 * 3600_000
  const minutos = Math.round((llegada - salida) / 60000)
  return minutos > 0 && minutos <= 48 * 60 ? minutos : null
}

/** «1 h 55 min», «3 h 2 min», «2 h», «45 min». Sin minutos válidos, vacío. */
export function textoDeTrayecto(minutos: number | null | undefined): string {
  if (minutos == null || !Number.isFinite(minutos) || minutos <= 0) return ''
  const h = Math.floor(minutos / 60), m = Math.round(minutos % 60)
  if (h === 0) return `${m} min`
  return m === 0 ? `${h} h` : `${h} h ${m} min`
}
