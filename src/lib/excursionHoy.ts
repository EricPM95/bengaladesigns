import type { CocheDelDia } from './types'
import type { Reservation } from './bookings'
import type { ReservaExtra } from './reservasExtra'
import { minutosDeLaHora, horaSinCero } from './reservasUnidas'
import { normalizar } from './avisosDelTiempo'
import { haversineMeters } from './distanceMock'

/**
 * (V80) EL DÍA DE EXCURSIÓN EN HOY, PASO A PASO (Design «Día de excursión en HOY», EX1-EX6). Funciones puras (sin React ni red), iguales para todos los destinos; los datos de cada excursión salen de
 * `data/dias/<destino>/_excursion_hoy.json` (modo habitual, ideas, sitio de destino) y de su día escrito (`listas.json`: `partes`, `vuelta`, `en_la_isla`). Nada se inventa: lo que un dato no trae, no sale.
 *
 * DOS TIPOS DE EXCURSIÓN (§1): `organizada` (con una empresa: hay una reserva de excursión en RESERVAS) o `por_tu_cuenta` (ferry, tren, bus o coche: billetes unidos a la excursión, V76, o nada). Mientras no haya
 * nada guardado manda `modo_habitual` de sus datos.
 * Consultas a Supabase: ninguna (los datos son archivos del destino y lo guardado vive en el móvil).
 */
export type ModoDeExcursion = 'organizada' | 'por_tu_cuenta'
export type MedioDeExcursion = 'barco' | 'tren' | 'autobus'

export interface IdeaDeExcursion {
  nombre: string
  sub?: string
  /** Lo que se escribe en el buscador del mapa para [Cómo llegar] (nunca una coordenada inventada). */
  buscar: string
  fuente?: string
}
export interface DatosHoyDeExcursion {
  modo_habitual?: ModoDeExcursion
  medio?: MedioDeExcursion
  dia_escrito?: string
  nombre?: string
  destino?: { nombre: string; lat: number; lng: number; radio_m: number }
  puerto?: { nombre: string; lat: number; lng: number }
  puerto_de_vuelta?: { nombre: string; buscar: string }
  ideas?: IdeaDeExcursion[]
  comer?: string
}
interface PasoEscrito { tipo?: string; como?: string; texto?: string; hora?: string; consejo?: string }
export interface DiaEscritoDeExcursion {
  partes?: Record<string, { manana?: PasoEscrito[] }>
  vuelta?: Record<string, string> | null
  en_la_isla?: string | null
}

/** Qué tipo de excursión es: lo guardado manda (reserva de excursión → organizada; billetes unidos → por tu cuenta); sin nada, lo habitual de esa excursión; sin dato, por tu cuenta solo si el día trae traslados. */
export function modoDeLaExcursion(a: { reserva: Pick<Reservation, 'kind'> | null; unidas: readonly unknown[]; habitual?: ModoDeExcursion | null; diaConTraslados?: boolean }): ModoDeExcursion {
  if (a.reserva) return 'organizada'
  if (a.unidas.length > 0) return 'por_tu_cuenta'
  return a.habitual ?? (a.diaConTraslados ? 'por_tu_cuenta' : 'organizada')
}

/** «1 h», «1 h 15», «45 min» (redondeado a 5 minutos: 61 min es «1 h»). */
export function duracionLegible(min: number): string {
  const r = Math.max(5, Math.round(min / 5) * 5)
  if (r < 60) return `${r} min`
  const h = Math.floor(r / 60)
  const m = r % 60
  return m === 0 ? `${h} h` : `${h} h ${m}`
}

const MESES: Record<string, number> = { ene: 1, feb: 2, mar: 3, abr: 4, may: 5, jun: 6, jul: 7, ago: 8, sep: 9, sept: 9, oct: 10, nov: 11, dic: 12 }
/** La hora del último barco o tren de ese día según la temporada que dicen los datos: `ultima_todo_el_ano` y los tramos `verano_27_mar_25_oct` (día, mes, día, mes). El tramo que más tarde acaba y contiene la fecha gana. */
export function ultimaDeVuelta(vuelta: Record<string, string> | null | undefined, dateIso: string | null | undefined): string | null {
  if (!vuelta) return null
  const hora = (v: string | undefined): string | null => (v && /^\d{1,2}:\d{2}$/.test(v) ? v : null)
  let mejor = hora(vuelta.ultima_todo_el_ano)
  const f = dateIso && /^\d{4}-\d{2}-\d{2}$/.test(dateIso) ? { m: Number(dateIso.slice(5, 7)), d: Number(dateIso.slice(8, 10)) } : null
  if (!f) return mejor
  const clave = (m: number, d: number) => m * 100 + d
  for (const [k, v] of Object.entries(vuelta)) {
    const r = /^[a-z]+_(\d{1,2})_([a-z]+)_(\d{1,2})_([a-z]+)$/.exec(k)
    const h = hora(v)
    if (!r || !h) continue
    const m1 = MESES[r[2]]
    const m2 = MESES[r[4]]
    if (!m1 || !m2) continue
    const ini = clave(m1, Number(r[1]))
    const fin = clave(m2, Number(r[3]))
    const hoy = clave(f.m, f.d)
    if (hoy >= ini && hoy <= fin && (minutosDeLaHora(h) ?? 0) > (minutosDeLaHora(mejor) ?? 0)) mejor = h
  }
  return mejor
}

/** De un traslado escrito («Ferry de las 10:00 (Líneas Romero, 25-30 min, 29 € ida y vuelta)»): la empresa y los minutos del trayecto (el mayor de «25-30»). */
export function datosDelTraslado(texto: string | null | undefined): { empresa: string | null; trayectoMin: number | null } {
  const dentro = /\(([^)]*)\)/.exec(texto ?? '')?.[1] ?? ''
  const partes = dentro.split(',').map((p) => p.trim())
  const empresa = partes[0] && !/\d/.test(partes[0]) ? partes[0] : null
  const m = /(\d{1,3})(?:\s*[-–]\s*(\d{1,3}))?\s*min/.exec(dentro)
  return { empresa, trayectoMin: m ? Number(m[2] ?? m[1]) : null }
}

export interface EstadoDeExcursion {
  /** [Ya he llegado] al punto de salida. */
  llegado: boolean
  /** [He embarcado] en el de ida. */
  embarcado: boolean
  /** [He embarcado] en el de vuelta. */
  vuelto: boolean
  /** La hora del de ida que el viajero cambió con [Cambiar la hora] (sin billete guardado; con billete se cambia la reserva). */
  horaIda: string | null
  /** El GPS ya lo vio en el destino alguna vez (para saber que ha vuelto cuando deja de estar). */
  estuvo: boolean
}
export const ESTADO_VACIO: EstadoDeExcursion = { llegado: false, embarcado: false, vuelto: false, horaIda: null, estuvo: false }

export type TipoDePaso = 'salida' | 'ida' | 'tiempo' | 'vuelta' | 'casa'
export interface PasoDeExcursion {
  tipo: TipoDePaso
  numero: number
  titulo: string
  sub: string | null
  hecho: boolean
  ahora: boolean
}

export interface EntradaDePasos {
  nombre: string
  medio: MedioDeExcursion
  dia: DiaEscritoDeExcursion | null
  coche: CocheDelDia | null
  /** Los billetes unidos a la excursión (V76), por hora: el primero es la ida, el siguiente la vuelta. */
  unidas: readonly ReservaExtra[]
  dateIso: string | null
  ahoraMin: number
  /** Dónde está el viajero respecto a la excursión (GPS): en el destino, en otro sitio o sin GPS. */
  gps: 'destino' | 'otro' | 'sin'
  /** El GPS lo pone cerca del punto de salida (el puerto de Órzola, la estación). */
  gpsEnSalida: boolean
  estado: EstadoDeExcursion
}

/** Lo que dicen los traslados del día escrito: el de coche (a dónde) y el del ferry (hora y empresa). */
export function trasladosDelDia(dia: DiaEscritoDeExcursion | null | undefined): { coche: { hasta: string | null; consejo: string | null } | null; barco: { hora: string | null; empresa: string | null; trayectoMin: number | null } | null } {
  const partes = dia?.partes ? (dia.partes.unica ?? Object.values(dia.partes)[0]) : null
  const traslados = (partes?.manana ?? []).filter((r) => r.tipo === 'traslado')
  const coche = traslados.find((r) => r.como === 'coche')
  const barco = traslados.find((r) => r.como === 'ferry' || r.como === 'barco')
  return {
    coche: coche ? { hasta: /^A\s+([^(.,;]+?)\s*(?:\(|[.,;]|$)/.exec(coche.texto ?? '')?.[1]?.trim() ?? null, consejo: coche.consejo ?? null } : null,
    barco: barco ? { hora: barco.hora ?? null, ...datosDelTraslado(barco.texto) } : null,
  }
}

const horaCorta = (hhmm: string | null | undefined): string => (hhmm ? horaSinCero(hhmm) : '')

export interface ResultadoDePasos {
  pasos: PasoDeExcursion[]
  /** Los datos de lo que pasa: horas y banderas que usan la tarjeta y el aviso. */
  horaIda: string | null
  horaIdaMin: number | null
  llegadaMin: number | null
  ultima: string | null
  ultimaMin: number | null
  ultimaEsBillete: boolean
  idaPorLaHora: boolean
  idaHecha: boolean
  vueltaHecha: boolean
  cocheMin: number | null
  hasta: string | null
  empresa: string | null
}

/**
 * Los pasos del día por tu cuenta, de los datos (`partes`) y de los billetes: coche o transporte hasta la salida · transporte de ida · «Tu tiempo en…» · transporte de vuelta · «Vuelta a tu alojamiento».
 * Cuándo se da el transporte de ida por hecho: 1) con el GPS (está en el destino), 2) con [He embarcado], 3) sin las dos, pasada su hora más el trayecto (y entonces queda «¿No has cogido este barco?»).
 * NUNCA se supone el último de vuelta: solo con [He embarcado] o si el GPS ya no está en el destino después de haber estado.
 */
export function pasosDeLaExcursion(e: EntradaDePasos): ResultadoDePasos {
  const t = trasladosDelDia(e.dia)
  const ida = e.unidas[0] ?? null
  const vuelta = e.unidas[1] ?? null
  const medio = e.medio
  const nombreMedio = medio === 'barco' ? 'Ferry' : medio === 'tren' ? 'Tren' : 'Autobús'
  const horaIda = e.estado.horaIda ?? ida?.time ?? t.barco?.hora ?? null
  const horaIdaMin = minutosDeLaHora(horaIda)
  // El trayecto: del billete (llegada − salida) o de los datos del traslado; sin ninguno, la hora no da por hecho nada.
  const deBillete = ida?.returnTime && minutosDeLaHora(ida.time) != null && minutosDeLaHora(ida.returnTime) != null ? (minutosDeLaHora(ida.returnTime) as number) - (minutosDeLaHora(ida.time) as number) : null
  const trayectoMin = deBillete != null && deBillete > 0 ? deBillete : t.barco?.trayectoMin ?? null
  const llegadaMin = horaIdaMin != null && trayectoMin != null ? horaIdaMin + trayectoMin : null
  const idaPorLaHora = llegadaMin != null && e.ahoraMin >= llegadaMin
  const idaHecha = e.estado.embarcado || e.gps === 'destino' || idaPorLaHora
  const ultimaDato = ultimaDeVuelta(e.dia?.vuelta, e.dateIso)
  const ultima = vuelta?.time ?? ultimaDato
  const ultimaMin = minutosDeLaHora(ultima)
  const vueltaHecha = e.estado.vuelto || (idaHecha && e.estado.estuvo && e.gps === 'otro')
  // El de vuelta pasa a ser «el de ahora» desde 1 h 30 antes (la hora del aviso de arriba).
  const vueltaToca = !vueltaHecha && idaHecha && ultimaMin != null && e.ahoraMin >= ultimaMin - 90
  const empresa = ida?.compania?.trim() || t.barco?.empresa || null
  const cocheMin = e.coche?.activo && e.coche.ida?.minutos ? e.coche.ida.minutos : null
  const hasta = t.coche?.hasta ?? null
  const cocheVueltaMin = e.coche?.activo && e.coche.vuelta?.minutos ? e.coche.vuelta.minutos : null
  const salidaHecha = e.estado.llegado || idaHecha || e.gpsEnSalida

  const crudos: Omit<PasoDeExcursion, 'numero' | 'ahora'>[] = []
  if (t.coche && hasta) {
    crudos.push({ tipo: 'salida', titulo: `${e.coche?.activo ? 'Coche hasta' : 'Hasta'} ${hasta}${cocheMin ? ` · ${duracionLegible(cocheMin)}` : ''}`, sub: t.coche.consejo, hecho: salidaHecha })
  }
  const tituloIda = ida
    ? medio === 'barco'
      ? `Ferry de las ${horaCorta(horaIda)}${empresa ? ` · ${empresa}` : ''}`
      : `${nombreMedio} a ${e.nombre} · ${horaCorta(horaIda)}${ida.origen ? ` · ${ida.origen}` : ''}`
    : horaIda
      ? `${nombreMedio} de las ${horaCorta(horaIda)}${empresa ? ` · ${empresa}` : ''}`
      : `${nombreMedio} a ${e.nombre}`
  crudos.push({ tipo: 'ida', titulo: tituloIda, sub: null, hecho: idaHecha })
  crudos.push({ tipo: 'tiempo', titulo: `Tu tiempo en ${e.nombre}`, sub: 'Ideas para tu día, sin prisa:', hecho: vueltaHecha || vueltaToca })
  const tituloVuelta = vuelta ? `${nombreMedio} de vuelta · ${horaCorta(vuelta.time)}` : ultimaDato ? `${nombreMedio} de vuelta · último a las ${horaCorta(ultimaDato)}` : `${nombreMedio} de vuelta`
  crudos.push({ tipo: 'vuelta', titulo: tituloVuelta, sub: null, hecho: vueltaHecha })
  crudos.push({ tipo: 'casa', titulo: `Vuelta a tu alojamiento${e.coche?.activo && hasta ? ` · en coche desde ${hasta}${cocheVueltaMin ? `, ${duracionLegible(cocheVueltaMin)}` : ''}` : ''}`, sub: null, hecho: false })

  // «Ahora»: el primero que no está hecho.
  let ya = false
  const pasos = crudos.map((p, i) => {
    const ahora = !ya && !p.hecho
    if (ahora) ya = true
    return { ...p, numero: i + 1, ahora }
  })
  return { pasos, horaIda, horaIdaMin, llegadaMin, ultima, ultimaMin, ultimaEsBillete: Boolean(vuelta), idaPorLaHora: idaPorLaHora && !e.estado.embarcado && e.gps !== 'destino', idaHecha, vueltaHecha, cocheMin, hasta, empresa }
}

/** El aviso rojo del último barco o tren: desde 1 h 30 antes y mientras no se haya cogido. Sale solo si ya se ha ido (el día está en marcha). */
export function avisoDelUltimo(a: { ultimaMin: number | null; ahoraMin: number; idaHecha: boolean; vueltaHecha: boolean }): { quedan: number } | null {
  if (a.ultimaMin == null || !a.idaHecha || a.vueltaHecha) return null
  const quedan = a.ultimaMin - a.ahoraMin
  return quedan <= 90 ? { quedan: Math.max(0, quedan) } : null
}

/** ¿El GPS está en el destino de la excursión (la isla, la ciudad)? */
export function gpsEnElDestino(ubicacion: { lat: number; lng: number } | null, destino: { lat: number; lng: number; radio_m: number } | null | undefined): 'destino' | 'otro' | 'sin' {
  if (!ubicacion) return 'sin'
  if (!destino) return 'sin'
  return haversineMeters(ubicacion, destino) <= destino.radio_m ? 'destino' : 'otro'
}

/** Las cajas de la tarjeta de la excursión por tu cuenta (SALIDA, FERRY/TREN/LLEGADA, VUELTA); cada una solo si se sabe. */
export interface CajaDeExcursion {
  dato: 'salida' | 'transporte' | 'llegada' | 'vuelta'
  etiqueta: string
  grande: string
  sub: string
  faltaBillete?: boolean
}
export function cajasPorTuCuenta(e: EntradaDePasos, r: ResultadoDePasos): CajaDeExcursion[] {
  const cajas: CajaDeExcursion[] = []
  const t = trasladosDelDia(e.dia)
  const ida = e.unidas[0] ?? null
  const vuelta = e.unidas[1] ?? null
  const tipo = e.medio === 'barco' ? 'FERRY' : e.medio === 'tren' ? 'TREN' : 'AUTOBÚS'
  const ultimoNombre = e.medio === 'barco' ? 'barco' : e.medio === 'tren' ? 'tren' : 'autobús'
  const salirCoche = e.coche?.activo ? e.coche.ida?.salir : null
  if (salirCoche) cajas.push({ dato: 'salida', etiqueta: 'SALIDA', grande: horaCorta(salirCoche), sub: 'Desde tu alojamiento' })
  else if (ida && e.medio !== 'barco') cajas.push({ dato: 'salida', etiqueta: 'SALIDA', grande: horaCorta(ida.time), sub: ida.origen ?? '' })
  if (e.medio === 'barco' || !ida) {
    if (r.horaIda) cajas.push({ dato: 'transporte', etiqueta: tipo, grande: horaCorta(r.horaIda), sub: `${t.coche?.hasta ?? ida?.origen ?? ''}${ida ? '' : `${t.coche?.hasta ? ' · ' : ''}falta billete`}`, faltaBillete: !ida })
    else cajas.push({ dato: 'transporte', etiqueta: tipo, grande: 'Falta billete', sub: '', faltaBillete: true })
  } else if (ida.returnTime) cajas.push({ dato: 'llegada', etiqueta: 'LLEGADA', grande: horaCorta(ida.returnTime), sub: ida.destinoDeViaje ?? '' })
  if (r.ultima) cajas.push({ dato: 'vuelta', etiqueta: 'VUELTA', grande: horaCorta(r.ultima), sub: vuelta ? `Tu ${ultimoNombre}` : `Último ${ultimoNombre}` })
  return cajas
}

/** (V80) Las cajas de una excursión ORGANIZADA, de la ficha del operador o de la reserva leída: RECOGIDA, DURACIÓN y TRANSPORTE. Cada una solo si se sabe; nada inventado. */
export interface CajaOrganizada { dato: 'recogida' | 'duracion' | 'transporte'; etiqueta: string; grande: string; sub: string }
export function cajasOrganizada(a: { recogida?: string | null; meetingPoint?: string | null; horaDeRecogida?: string | null; duracion?: string | null; incluye?: string | null; descripcion?: string | null; conGuia?: boolean }): CajaOrganizada[] {
  const cajas: CajaOrganizada[] = []
  const rec = (a.recogida ?? '').trim()
  const punto = (a.meetingPoint ?? '').trim()
  const hora = a.horaDeRecogida && /^\d{1,2}:\d{2}$/.test(a.horaDeRecogida) ? horaSinCero(a.horaDeRecogida) : null
  if (punto) cajas.push({ dato: 'recogida', etiqueta: 'RECOGIDA', grande: 'Punto de encuentro', sub: `${punto}${hora ? ` · ${hora}` : ''}` })
  else if (/hotel|alojamiento/i.test(rec)) cajas.push({ dato: 'recogida', etiqueta: 'RECOGIDA', grande: 'En el hotel', sub: hora ?? 'Sin hora aún' })
  if (a.duracion) cajas.push({ dato: 'duracion', etiqueta: 'DURACIÓN', grande: a.duracion, sub: a.conGuia ? 'Con guía' : '' })
  const texto = normalizar(`${a.incluye ?? ''} ${a.descripcion ?? ''}`)
  if (/no (se )?incluye(n)? (el )?(transporte|traslado)|transporte no incluido/.test(texto)) cajas.push({ dato: 'transporte', etiqueta: 'TRANSPORTE', grande: 'No incluido', sub: '' })
  else if (/\b(transporte|autobus|autocar|barco|ferry|traslado|tren|velero)\b/.test(texto)) {
    const medio = /autobus|autocar/.test(texto) ? 'Autocar' : /barco|ferry|velero/.test(texto) ? 'Barco' : /tren/.test(texto) ? 'Tren' : ''
    cajas.push({ dato: 'transporte', etiqueta: 'TRANSPORTE', grande: 'Incluido', sub: medio })
  }
  return cajas
}

/* ── Los datos (archivos del destino, en un trozo aparte que NO entra en el peso de arranque) ── */
type ArchivoHoy = { excursiones?: Record<string, DatosHoyDeExcursion> }
type ArchivoListas = { dias?: Record<string, DiaEscritoDeExcursion> }
let HOY: Record<string, () => Promise<ArchivoHoy>> = {}
let LISTAS: Record<string, () => Promise<ArchivoListas>> = {}
try {
  HOY = import.meta.glob('../../data/dias/*/_excursion_hoy.json', { import: 'default' }) as Record<string, () => Promise<ArchivoHoy>>
  LISTAS = import.meta.glob('../../data/dias/*/listas.json', { import: 'default' }) as Record<string, () => Promise<ArchivoListas>>
} catch {
  HOY = {}
  LISTAS = {}
}
const delDestino = <T,>(cargadores: Record<string, () => Promise<T>>, destino: string): (() => Promise<T>) | null => {
  const k = Object.keys(cargadores).find((x) => x.split('/').at(-2) === normalizar(destino))
  return k ? cargadores[k] : null
}

/** Lo ya leído (para quien necesita el modo habitual sin esperar: la excursión cancelada). */
const EN_CACHE = new Map<string, DatosHoyDeExcursion>()
export const modoHabitualCargado = (excursionId: string | null | undefined): ModoDeExcursion | null => (excursionId ? (EN_CACHE.get(excursionId)?.modo_habitual ?? null) : null)

/** Los datos de HOY de una excursión (modo habitual, ideas, destino…); null si el destino o la excursión no los traen. */
export async function leerDatosHoyDeExcursion(destino: string | null | undefined, excursionId: string | null | undefined): Promise<DatosHoyDeExcursion | null> {
  if (!destino || !excursionId) return null
  try {
    const c = delDestino(HOY, destino)
    const datos = c ? ((await c()).excursiones?.[excursionId] ?? null) : null
    if (datos) EN_CACHE.set(excursionId, datos)
    return datos
  } catch {
    return null
  }
}

/** El día escrito de la excursión (`DG`) del archivo del destino; null si no está. */
export async function leerDiaEscritoDeExcursion(destino: string | null | undefined, diaEscritoId: string | null | undefined): Promise<DiaEscritoDeExcursion | null> {
  if (!destino || !diaEscritoId) return null
  try {
    const c = delDestino(LISTAS, destino)
    return c ? ((await c()).dias?.[diaEscritoId] ?? null) : null
  } catch {
    return null
  }
}
