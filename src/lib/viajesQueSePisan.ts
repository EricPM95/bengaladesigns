import type { SavedTrip } from './tripPersistence'

/**
 * «Sustituir el anterior» sin borrar (Tanda 8A2, REVISION_DESIGN_PASO3 C1/P8b/P9). Cuando alguien crea un segundo viaje al MISMO destino con fechas que se pisan, la app le
 * pregunta; si elige «Sustituir el anterior», el de antes NO se borra: pasa a «Viajes guardados» (`guardarViajeAparte`, columna `trips.guardado_en`, migración 0024).
 * Aquí está la parte pura: qué viajes se pisan y cómo se separan «Mis viajes» y «Viajes guardados». La pantalla la dibuja Design.
 */

export interface ViajeNuevo {
  destino: string
  /** yyyy-mm-dd */
  inicio: string
  fin: string
}

const norm = (t: string) => t.trim().toLowerCase()

function rangoDe(trip: Pick<SavedTrip, 'route'>): { inicio: string; fin: string } | null {
  const r = trip.route?.answers?.dateRange
  return r?.start && r?.end ? { inicio: r.start, fin: r.end } : null
}

/** ¿Está este viaje en «Viajes guardados» (sustituido por otro)? */
export const estaGuardadoAparte = (trip: Pick<SavedTrip, 'guardadoEn'>): boolean => Boolean(trip.guardadoEn)

/** Los viajes de siempre (los que se ven en «Mis viajes») y los guardados aparte, en el orden en que llegan. */
export function separarViajes<T extends Pick<SavedTrip, 'guardadoEn'>>(viajes: T[]): { activos: T[]; guardados: T[] } {
  return { activos: viajes.filter((v) => !estaGuardadoAparte(v)), guardados: viajes.filter(estaGuardadoAparte) }
}

/**
 * Los viajes ya hechos al mismo destino cuyas fechas se pisan con las del nuevo (los dos días de las puntas cuentan como pisarse). Los que ya están guardados aparte
 * no cuentan, y los de otra persona (donde solo es invitada) tampoco: no son suyos para sustituirlos.
 */
export function viajesQueSePisan<T extends Pick<SavedTrip, 'route' | 'guardadoEn' | 'esInvitado' | 'id'>>(nuevo: ViajeNuevo, existentes: T[]): T[] {
  return existentes.filter((v) => {
    if (estaGuardadoAparte(v) || v.esInvitado) return false
    if (norm(v.route?.destination ?? '') !== norm(nuevo.destino)) return false
    const r = rangoDe(v)
    return r != null && r.inicio <= nuevo.fin && nuevo.inicio <= r.fin
  })
}

export interface ViajeDeLaPareja {
  id: string
  destino: string
  inicio: string
  fin: string
}

/**
 * (Cuentas parte 3, P8b y P9) Las parejas de viajes PROPIOS al mismo destino cuyas fechas se pisan, sin contar los guardados aparte ni los de otra persona. Con el pase de ese destino
 * activo para los dos, la app pregunta cuál se hace («Tienes dos viajes a Roma. ¿Cuál haces?»); el que no se elige pasa a «Viajes guardados», sin borrarse.
 * Sale una pareja por destino (la primera): con tres viajes que se pisan se resuelve de dos en dos.
 */
export function parejasQueSePisan<T extends Pick<SavedTrip, 'route' | 'guardadoEn' | 'esInvitado' | 'id'>>(viajes: T[]): [ViajeDeLaPareja, ViajeDeLaPareja][] {
  const propios = viajes
    .filter((v) => !estaGuardadoAparte(v) && !v.esInvitado)
    .map((v) => ({ id: v.id, destino: v.route?.destination ?? '', rango: rangoDe(v) }))
    .filter((v): v is { id: string; destino: string; rango: { inicio: string; fin: string } } => v.rango != null && v.destino !== '')
    .sort((a, b) => a.rango.inicio.localeCompare(b.rango.inicio) || a.id.localeCompare(b.id))
  const salida: [ViajeDeLaPareja, ViajeDeLaPareja][] = []
  const yaPorDestino = new Set<string>()
  for (let i = 0; i < propios.length; i++) {
    const a = propios[i]
    if (yaPorDestino.has(norm(a.destino))) continue
    const b = propios.slice(i + 1).find((x) => norm(x.destino) === norm(a.destino) && x.rango.inicio <= a.rango.fin && a.rango.inicio <= x.rango.fin)
    if (!b) continue
    yaPorDestino.add(norm(a.destino))
    salida.push([
      { id: a.id, destino: a.destino, ...a.rango },
      { id: b.id, destino: b.destino, ...b.rango },
    ])
  }
  return salida
}

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

/** «16 al 19 de octubre» (mismo mes) o «28 de octubre al 2 de noviembre»: como se dice, para los botones de P8b y P9. */
export function rangoEnPalabras(inicio: string, fin: string): string {
  const [, mi, di] = inicio.split('-').map(Number)
  const [, mf, df] = fin.split('-').map(Number)
  if (mi === mf) return di === df ? `${di} de ${MESES[mi - 1]}` : `${di} al ${df} de ${MESES[mi - 1]}`
  return `${di} de ${MESES[mi - 1]} al ${df} de ${MESES[mf - 1]}`
}
