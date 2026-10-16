import { useEffect, useState } from 'react'

/**
 * LA API DE CONSULTA EN LA APP (parte 1, sandbox). Todo detrás de un interruptor, apagado en producción: con él apagado la app es la de hoy (nuestros datos y nuestros enlaces).
 * Todo pasa por NUESTRO servidor (`/api/civitatis/*`): el móvil nunca ve el usuario, la contraseña ni el token de la API. Si el servidor responde `{ ok: false }` (la API apagada, caída,
 * fuera de horario o sin datos), la app hace lo de hoy. La app avisa, no prohíbe.
 */

const CLAVE_INTERRUPTOR = 'trazo:civitatis'

/** Pura: ¿está encendida la API en la app? Apagada salvo `VITE_CIVITATIS_ACTIVA=true`; en desarrollo también vale `?civitatis=on` (y `?civitatis=off`). */
export function calcularCivitatisActiva(datos: { entorno?: string | undefined; desarrollo: boolean; parametro?: string | null; guardado?: string | null }): boolean {
  if (datos.desarrollo) {
    const elegido = datos.parametro === 'on' || datos.parametro === 'off' ? datos.parametro : datos.guardado
    if (elegido === 'on') return true
    if (elegido === 'off') return false
  }
  return datos.entorno === 'true'
}

export function civitatisActiva(): boolean {
  let parametro: string | null = null
  let guardado: string | null = null
  try {
    parametro = new URLSearchParams(window.location.search).get('civitatis')
    if (import.meta.env.DEV && (parametro === 'on' || parametro === 'off')) window.sessionStorage.setItem(CLAVE_INTERRUPTOR, parametro)
    guardado = window.sessionStorage.getItem(CLAVE_INTERRUPTOR)
  } catch {
    /* sin ventana o sin almacenamiento: manda el valor de configuración */
  }
  return calcularCivitatisActiva({ entorno: import.meta.env.VITE_CIVITATIS_ACTIVA, desarrollo: import.meta.env.DEV, parametro, guardado })
}

/* ------------------------------------------------------------------ */
/* Lo que da el servidor                                               */
/* ------------------------------------------------------------------ */

/** Una hora libre de un día. `plazas` es el número real de la API (null = sin límite o no lo dice); `aviso` solo sale si quedan pocas («Últimas 3 plazas»). */
export interface HoraLibre {
  hora: string
  plazas: number | null
  aviso: string | null
}
export interface HorasDelDia {
  fecha: string
  /** El día no tiene ninguna hora libre. */
  sinPlazas: boolean
  horas: HoraLibre[]
}

export type EstadoDeHoras = { estado: 'apagado' } | { estado: 'cargando' } | { estado: 'sin_datos' } | { estado: 'ok'; datos: HorasDelDia }

/** Pura: la rueda de horas con solo las libres. Sin horas libres (o con la API sin datos), la rueda de siempre. La hora que el viajero ya tiene (`propia`) siempre está. */
export function ruedaConHorasLibres(rueda: string[], horas: HorasDelDia | null, propia: string | null = null): string[] {
  if (!horas || horas.horas.length === 0) return rueda
  const libres = horas.horas.map((h) => h.hora)
  const conPropia = propia && !libres.includes(propia) ? [...libres, propia].sort() : libres
  return conPropia
}

/** Pura: el enlace al mapa del punto de encuentro de una actividad, con sus coordenadas (null si la API no las da). */
export function enlaceAlPuntoDeEncuentro(punto: { lat: number | null; lng: number | null } | null | undefined): string | null {
  return punto && punto.lat != null && punto.lng != null ? `https://www.google.com/maps/search/?api=1&query=${punto.lat},${punto.lng}` : null
}

/** Pura: el aviso de una hora (el de las plazas) o null. */
export function avisoDeLaHora(horas: HorasDelDia | null, hora: string | null): string | null {
  if (!horas || !hora) return null
  const normal = hora.length === 4 ? `0${hora}` : hora
  return horas.horas.find((h) => h.hora === normal)?.aviso ?? null
}

/** Pura: ¿la hora que ha puesto NO sale entre las libres? (Con «Ya tengo mi entrada» se deja igualmente, con un aviso: la app avisa, no prohíbe.) */
export function horaFueraDelCalendario(horas: HorasDelDia | null, hora: string | null): boolean {
  if (!horas || horas.horas.length === 0 || !hora) return false
  const normal = hora.length === 4 ? `0${hora}` : hora
  return !horas.horas.some((h) => h.hora === normal)
}

/**
 * Las horas libres de ese sitio ese día, siempre FRESCAS (sin la caché de una hora: las plazas tienen que estar al día). `clave` cambia cuando el selector se abre o cambia el día: así
 * se vuelve a pedir. `clave` null, o el interruptor apagado, no pide nada.
 */
export function useHorasLibres(lugar: string | null, fecha: string | null, destino: string, clave: string | null): EstadoDeHoras {
  const activo = civitatisActiva() && Boolean(lugar) && Boolean(fecha) && Boolean(clave)
  const [resultado, setResultado] = useState<{ clave: string; estado: EstadoDeHoras } | null>(null)
  useEffect(() => {
    if (!activo || !lugar || !fecha || !clave) return undefined
    let cancelado = false
    const consulta = new URLSearchParams({ lugar, fecha, destino, fresco: '1' })
    fetch(`/api/civitatis/horas?${consulta.toString()}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((cuerpo: { ok?: boolean; datos?: HorasDelDia } | null) => {
        if (cancelado) return
        setResultado({ clave, estado: cuerpo?.ok && cuerpo.datos ? { estado: 'ok', datos: cuerpo.datos } : { estado: 'sin_datos' } })
      })
      .catch(() => {
        if (!cancelado) setResultado({ clave, estado: { estado: 'sin_datos' } })
      })
    return () => {
      cancelado = true
    }
  }, [activo, lugar, fecha, destino, clave])
  if (!activo) return { estado: 'apagado' }
  return resultado && resultado.clave === clave ? resultado.estado : { estado: 'cargando' }
}

/** Las horas del Free Tour de cada día entre dos fechas (del calendario). Apagado o sin datos: null y la app usa las de siempre. */
export function useHorasDelFreeTour(desde: string | null, hasta: string | null, destino: string, clave: string | null): Record<string, HoraLibre[]> | null {
  const activo = civitatisActiva() && Boolean(desde) && Boolean(hasta) && Boolean(clave)
  const [resultado, setResultado] = useState<{ clave: string; dias: Record<string, HoraLibre[]> | null } | null>(null)
  useEffect(() => {
    if (!activo || !desde || !hasta || !clave) return undefined
    let cancelado = false
    fetch(`/api/civitatis/free-tour?${new URLSearchParams({ desde, hasta, destino, fresco: '1' }).toString()}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((cuerpo: { ok?: boolean; datos?: { dias?: Record<string, HoraLibre[]> } } | null) => {
        if (!cancelado) setResultado({ clave, dias: cuerpo?.ok && cuerpo.datos?.dias ? cuerpo.datos.dias : null })
      })
      .catch(() => {
        if (!cancelado) setResultado({ clave, dias: null })
      })
    return () => {
      cancelado = true
    }
  }, [activo, desde, hasta, destino, clave])
  return activo && resultado && resultado.clave === clave ? resultado.dias : null
}

/** Las actividades cerca de unas coordenadas (la pestaña «Entradas» de un sitio sin entradas escritas a mano). Apagado o sin datos: []. */
export interface ActividadCerca {
  id: number
  nombre: string
  gratis: boolean
  desde: number | null
  valoracion: number | null
  opiniones: number | null
  foto: string | null
  puntoDeEncuentro: { texto: string | null; lat: number | null; lng: number | null } | null
  url: string | null
}
export function useActividadesCerca(lat: number | null | undefined, lng: number | null | undefined, activo: boolean): ActividadCerca[] {
  const encendido = civitatisActiva() && activo && Number.isFinite(lat) && Number.isFinite(lng)
  const [resultado, setResultado] = useState<{ clave: string; lista: ActividadCerca[] } | null>(null)
  const clave = `${lat}|${lng}`
  useEffect(() => {
    if (!encendido) return undefined
    let cancelado = false
    fetch('/api/civitatis/cerca', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lat, lng }) })
      .then((r) => (r.ok ? r.json() : null))
      .then((cuerpo: { ok?: boolean; datos?: ActividadCerca[] } | null) => {
        if (!cancelado) setResultado({ clave, lista: cuerpo?.ok && Array.isArray(cuerpo.datos) ? cuerpo.datos : [] })
      })
      .catch(() => {
        if (!cancelado) setResultado({ clave, lista: [] })
      })
    return () => {
      cancelado = true
    }
  }, [encendido, lat, lng, clave])
  return encendido && resultado?.clave === clave ? resultado.lista : []
}

/* ------------------------------------------------------------------ */
/* La hora recomendada (encima de «Reservar»)                          */
/* ------------------------------------------------------------------ */

/** Lo que da `/api/civitatis/horas-rango`: las horas libres de cada día de un rango y de qué actividad son. */
export interface HorasEnRango {
  actividadId: number
  /** La actividad trabaja con horas fijas (si no, no hay hora que recomendar). */
  conHorasFijas: boolean
  dias: Record<string, { sinPlazas: boolean; horas: HoraLibre[] }>
}

const aMinutos = (hhmm: string): number | null => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm)
  return m ? Number(m[1]) * 60 + Number(m[2]) : null
}

/** Pura: de las horas libres, la más cercana a la hora a la que la ruta lleva la parada; con dos igual de cerca, la más temprana. Sin horas o sin hora de ruta válida, null. */
export function horaMasCercana(horas: HoraLibre[], horaRuta: string | null): HoraLibre | null {
  const objetivo = horaRuta ? aMinutos(horaRuta) : null
  if (objetivo == null) return null
  let mejor: HoraLibre | null = null
  let distancia = Infinity
  for (const h of [...horas].sort((a, b) => a.hora.localeCompare(b.hora))) {
    const minutos = aMinutos(h.hora)
    if (minutos == null) continue
    const d = Math.abs(minutos - objetivo)
    if (d < distancia) {
      mejor = h
      distancia = d
    }
  }
  return mejor
}

const DIA_LARGO = new Intl.DateTimeFormat('es-ES', { weekday: 'long', timeZone: 'UTC' })
/** «miércoles 21». */
export function diaLargoEs(fechaIso: string): string {
  const fecha = new Date(`${fechaIso}T12:00:00Z`)
  return `${DIA_LARGO.format(fecha)} ${Number(fechaIso.slice(8, 10))}`
}

export type HoraRecomendada = { tipo: 'hora'; hora: string; aviso: string | null; texto: string } | { tipo: 'sin_plazas'; alternativa: string | null; texto: string }

/**
 * Pura: lo que dice la etiqueta verde encima de «Reservar». `diasDelViaje`: las fechas de su viaje (la alternativa sale SOLO de ahí; la más cercana al día de la parada, la más temprana si empatan).
 * Nada (null) sin fecha, sin datos, sin hora de ruta o si la actividad no tiene horas fijas.
 */
export function recomendarHora(datos: HorasEnRango | null, fechaParada: string | null, horaRuta: string | null, diasDelViaje: string[]): HoraRecomendada | null {
  if (!datos || !datos.conHorasFijas || !fechaParada) return null
  const dia = datos.dias[fechaParada]
  if (!dia) return null
  if (dia.horas.length > 0) {
    const elegida = horaMasCercana(dia.horas, horaRuta)
    if (!elegida) return null
    const texto = `Te recomendamos reservar a las ${elegida.hora}${elegida.aviso ? ` · ${elegida.aviso}` : ''}`
    return { tipo: 'hora', hora: elegida.hora, aviso: elegida.aviso, texto }
  }
  const base = new Date(`${fechaParada}T12:00:00Z`).getTime()
  const candidatos = diasDelViaje
    .filter((f) => f !== fechaParada && (datos.dias[f]?.horas.length ?? 0) > 0)
    .sort((a, b) => Math.abs(new Date(`${a}T12:00:00Z`).getTime() - base) - Math.abs(new Date(`${b}T12:00:00Z`).getTime() - base) || a.localeCompare(b))
  const alternativa = candidatos[0] ?? null
  return { tipo: 'sin_plazas', alternativa, texto: alternativa ? `Ese día no quedan plazas. El ${diaLargoEs(alternativa)} sí hay` : 'Ese día no quedan plazas' }
}

/** Las horas libres de cada día del viaje para una entrada (siempre frescas: las plazas tienen que estar al día). `clave` null, o el interruptor apagado, no pide nada. */
export function useHorasEnRango(lugar: string | null, desde: string | null, hasta: string | null, destino: string, clave: string | null): HorasEnRango | null {
  const activo = civitatisActiva() && Boolean(lugar) && Boolean(desde) && Boolean(hasta) && Boolean(clave)
  const [resultado, setResultado] = useState<{ clave: string; datos: HorasEnRango | null } | null>(null)
  useEffect(() => {
    if (!activo || !lugar || !desde || !hasta || !clave) return undefined
    let cancelado = false
    fetch(`/api/civitatis/horas-rango?${new URLSearchParams({ lugar, desde, hasta, destino, fresco: '1' }).toString()}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((cuerpo: { ok?: boolean; datos?: HorasEnRango } | null) => {
        if (!cancelado) setResultado({ clave, datos: cuerpo?.ok && cuerpo.datos?.dias ? cuerpo.datos : null })
      })
      .catch(() => {
        if (!cancelado) setResultado({ clave, datos: null })
      })
    return () => {
      cancelado = true
    }
  }, [activo, lugar, desde, hasta, destino, clave])
  return activo && resultado?.clave === clave ? resultado.datos : null
}
