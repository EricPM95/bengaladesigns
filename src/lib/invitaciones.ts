import { supabase } from './supabaseClient'

/**
 * Invitar a alguien a un viaje (cuentas, parte 2, punto 3): la lógica. El administrador crea una invitación (un enlace y un código corto que sirven para lo mismo);
 * quien la abre crea su cuenta si no la tiene y entra en el viaje como invitado. Si la invitación va con un Pase Dúo o de grupo, al entrar recibe su uso del pase.
 * Se puede anular y deja de valer cuando ya no quedan usos. Todo pasa por funciones de la base de datos (migración 0021), que son las que comprueban quién puede qué.
 * Nada de esto se ejecuta con el interruptor de las cuentas apagado.
 */

export interface Invitacion {
  id: string
  tripId: string
  codigo: string
  passId: string | null
  usosMax: number
  usosUsados: number
  anulada: boolean
  creadaEn: string
}

export type MotivoNoValida = 'no_existe' | 'anulada' | 'sin_usos'
export interface VistaDeInvitacion {
  valida: boolean
  motivo?: MotivoNoValida
  destino?: string | null
  /** (0026) Quién invita: su nombre de pila (o null si no lo tiene puesto). */
  invitador?: string | null
  /** (0026) Las fechas del viaje, para enseñarlas antes de entrar. */
  inicio?: string | null
  fin?: string | null
  /** (0026) La invitación va con un pase: entrar no cuesta nada. */
  con_pase?: boolean
  /** (0036, Tanda 10N) Quien la abre ya está en ese viaje (o lo administra): no se le enseña «Eric te invita…», va directo al viaje `trip_id`. */
  ya_dentro?: boolean
  trip_id?: string | null
}

/** Cuántas personas pueden entrar con el código de un viaje SIN Pase Dúo o Grupo (Tanda 10N: «Invita hasta 10 personas con este código.»). */
export const PLAZAS_SIN_PASE = 10

const CLAVE_PENDIENTE = 'trazo:invitacion'
const CLAVE_ACEPTADA = 'trazo:invitacion:aceptada'
const SIN_NUBE = 'Las invitaciones necesitan conexión con el servidor; ahora mismo no está disponible.'

/** Pura: el código tal como se escribe (mayúsculas, sin espacios ni guiones). */
export const normalizarCodigo = (texto: string): string => String(texto ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '')

/** Pura: el enlace que se manda («https://…/?invitacion=ABCD2345»). */
export const enlaceDeInvitacion = (origen: string, codigo: string): string => `${origen.replace(/\/+$/, '')}/?invitacion=${encodeURIComponent(normalizarCodigo(codigo))}`

/** Pura: el código que trae una dirección («?invitacion=ABCD2345»), o null. */
export function codigoDeLaDireccion(busqueda: string): string | null {
  const valor = new URLSearchParams(busqueda).get('invitacion')
  const codigo = valor ? normalizarCodigo(valor) : ''
  return codigo.length >= 6 && codigo.length <= 16 ? codigo : null
}

/** Pura: lo que se le dice a la persona cuando una invitación no vale. */
export function textoDeInvitacionNoValida(motivo: MotivoNoValida | undefined): string {
  if (motivo === 'anulada') return 'Esa invitación se ha anulado.'
  if (motivo === 'sin_usos') return 'Ya no quedan plazas en esa invitación.'
  return 'Este código no existe.'
}

/** Pura: el titular de «lo que ve quien recibe el enlace» (P7b): «Laura te invita a su Pase Roma» (con pase) o «Laura te invita a su viaje a Roma». */
export function titularDeInvitacion(v: VistaDeInvitacion): string {
  const quien = v.invitador && v.invitador.trim() ? v.invitador.trim() : 'Alguien'
  const destino = v.destino?.trim() || 'su viaje'
  return v.con_pase ? `${quien} te invita a su Pase ${destino}` : `${quien} te invita a su viaje a ${destino}`
}

/** (P7b) Al tocar [Unirme] se apunta que la invitación está aceptada: solo entonces se canjea después de entrar. Abrir el enlace por sí solo no mete a nadie en un viaje. */
export function aceptarInvitacionPendiente(): void {
  try {
    window.localStorage.setItem(CLAVE_ACEPTADA, '1')
  } catch {
    /* sin almacenamiento: tendrá que escribir el código a mano */
  }
}
export function invitacionAceptada(): boolean {
  try {
    return window.localStorage.getItem(CLAVE_ACEPTADA) === '1'
  } catch {
    return false
  }
}

/** Se guarda el código de una invitación abierta antes de tener cuenta, para canjearla justo después de entrar. */
export function guardarInvitacionPendiente(codigo: string): void {
  try {
    window.localStorage.setItem(CLAVE_PENDIENTE, normalizarCodigo(codigo))
    window.localStorage.removeItem(CLAVE_ACEPTADA) // (un enlace nuevo no hereda la aceptación de otro)
  } catch {
    /* sin almacenamiento: tendrá que escribir el código a mano */
  }
  avisarCambioDeInvitacion()
}
export function invitacionPendiente(): string | null {
  try {
    return window.localStorage.getItem(CLAVE_PENDIENTE) || null
  } catch {
    return null
  }
}
export function olvidarInvitacionPendiente(): void {
  try {
    window.localStorage.removeItem(CLAVE_PENDIENTE)
    window.localStorage.removeItem(CLAVE_ACEPTADA)
  } catch {
    /* nada que quitar */
  }
  avisarCambioDeInvitacion()
}

/** (10N §5) Quien pinta «Crear viaje» se entera de que una invitación entra o sale de marcha. */
export const EVENTO_INVITACION = 'trazo:invitacion'
function avisarCambioDeInvitacion(): void {
  try {
    window.dispatchEvent(new Event(EVENTO_INVITACION))
  } catch {
    /* sin ventana (pruebas): nadie escucha */
  }
}

const mensajeDe = (error: { message?: string } | null | undefined, porDefecto: string): string => {
  const texto = error?.message ?? ''
  // Los mensajes que escribe la base de datos ya están en palabras sencillas.
  return /^(Hace falta|Primero crea|Solo el administrador|Esa invitación|Ya no quedan|Ese pase|Demasiad|No se pudo crear)/.test(texto) ? texto : porDefecto
}

/** El administrador crea una invitación. `passId`: con un pase suyo (Dúo o de grupo). `usos`: cuántas personas pueden entrar (sin pase). */
export async function crearInvitacion(tripId: string, opciones: { passId?: string | null; usos?: number } = {}): Promise<{ invitacion: Pick<Invitacion, 'id' | 'codigo' | 'tripId' | 'passId' | 'usosMax'> | null; error: string | null }> {
  if (!supabase) return { invitacion: null, error: SIN_NUBE }
  const { data, error } = await supabase.rpc('crear_invitacion', { p_trip: tripId, p_pass: opciones.passId ?? null, p_usos: opciones.usos ?? 1 })
  if (error || !data) return { invitacion: null, error: mensajeDe(error, 'No se ha podido crear la invitación. Inténtalo de nuevo.') }
  const d = data as { id: string; codigo: string; trip_id: string; pass_id: string | null; usos_max: number }
  return { invitacion: { id: d.id, codigo: d.codigo, tripId: d.trip_id, passId: d.pass_id, usosMax: d.usos_max }, error: null }
}

/** Pura: ¿esta invitación sirve todavía para dar su código otra vez? (ni anulada ni gastada, y del mismo pase si lo hay). */
export function invitacionReutilizable(i: Pick<Invitacion, 'anulada' | 'usosMax' | 'usosUsados' | 'passId'>, passId: string | null): boolean {
  return !i.anulada && i.usosUsados < i.usosMax && (i.passId ?? null) === (passId ?? null)
}

const enCurso = new Map<string, Promise<{ invitacion: Pick<Invitacion, 'id' | 'codigo' | 'tripId' | 'passId' | 'usosMax'> | null; error: string | null }>>()

/**
 * (Tanda 10N §4) EL MISMO CÓDIGO PARA EL MISMO VIAJE: reutiliza la invitación vigente del viaje y solo crea otra si la de antes se gastó o se anuló. Los códigos ya creados siguen valiendo.
 * Dos aperturas casi a la vez comparten la misma petición (así no salen dos códigos).
 */
export function invitacionDelViaje(tripId: string, opciones: { passId?: string | null; usos?: number } = {}) {
  const clave = `${tripId}:${opciones.passId ?? ''}`
  const previa = enCurso.get(clave)
  if (previa) return previa
  const peticion = (async () => {
    const existentes = await listarInvitaciones(tripId)
    const buena = existentes.find((i) => invitacionReutilizable(i, opciones.passId ?? null))
    if (buena) return { invitacion: { id: buena.id, codigo: buena.codigo, tripId: buena.tripId, passId: buena.passId, usosMax: buena.usosMax }, error: null }
    return crearInvitacion(tripId, opciones)
  })().finally(() => enCurso.delete(clave))
  enCurso.set(clave, peticion)
  return peticion
}

export async function anularInvitacion(id: string): Promise<string | null> {
  if (!supabase) return SIN_NUBE
  const { error } = await supabase.rpc('anular_invitacion', { p_id: id })
  return error ? mensajeDe(error, 'No se ha podido anular la invitación.') : null
}

/** Las invitaciones de un viaje (solo las ve su administrador). */
export async function listarInvitaciones(tripId: string): Promise<Invitacion[]> {
  if (!supabase) return []
  try {
    const { data, error } = await supabase.from('trip_invitations').select('id, trip_id, codigo, pass_id, usos_max, usos_usados, anulada_en, created_at').eq('trip_id', tripId).order('created_at', { ascending: false })
    if (error || !data) return []
    return (data as { id: string; trip_id: string; codigo: string; pass_id: string | null; usos_max: number; usos_usados: number; anulada_en: string | null; created_at: string }[]).map((f) => ({
      id: f.id,
      tripId: f.trip_id,
      codigo: f.codigo,
      passId: f.pass_id,
      usosMax: f.usos_max,
      usosUsados: f.usos_usados,
      anulada: f.anulada_en !== null,
      creadaEn: f.created_at,
    }))
  } catch {
    return []
  }
}

/** Antes de entrar: ¿vale esta invitación y a qué destino? */
export async function verInvitacion(codigo: string): Promise<VistaDeInvitacion> {
  if (!supabase) return { valida: false, motivo: 'no_existe' }
  const { data, error } = await supabase.rpc('ver_invitacion', { p_codigo: normalizarCodigo(codigo) })
  if (error || !data) return { valida: false, motivo: 'no_existe' }
  return data as VistaDeInvitacion
}

/** Entrar en el viaje. Solo con una cuenta de verdad. Devuelve el viaje al que entró, o un error en palabras sencillas. */
export async function canjearInvitacion(codigo: string): Promise<{ tripId: string | null; yaEstaba: boolean; error: string | null }> {
  if (!supabase) return { tripId: null, yaEstaba: false, error: SIN_NUBE }
  const { data, error } = await supabase.rpc('canjear_invitacion', { p_codigo: normalizarCodigo(codigo) })
  if (error || !data) return { tripId: null, yaEstaba: false, error: mensajeDe(error, 'No se ha podido entrar en el viaje. Inténtalo de nuevo.') }
  // (0047) El código que no existe ya no hace «raise» en la base de datos (así queda apuntado el fallo): llega como { error: 'no_existe' }.
  if ((data as { error?: string }).error === 'no_existe') return { tripId: null, yaEstaba: false, error: 'Esa invitación no existe.' }
  const d = data as { trip_id: string; ya_estaba: boolean }
  olvidarInvitacionPendiente()
  recordarCanjeada(codigo)
  pedirAbrirViaje(d.trip_id)
  return { tripId: d.trip_id, yaEstaba: d.ya_estaba, error: null }
}

/* ------------------------------------------------------------------ */
/* Abrir un enlace de invitación sin pasar por «Crear viaje» (10N §5)  */
/* ------------------------------------------------------------------ */

const CLAVE_CANJEADAS = 'trazo:invitaciones:canjeadas'
const CLAVE_ABRIR_VIAJE = 'trazo:abrir-viaje'

/** Los códigos que esta persona ya ha canjeado en este móvil: volver a abrir uno de ellos va directo al viaje, sin la pantalla de la invitación. */
export function codigosCanjeados(): string[] {
  try {
    const v = JSON.parse(window.localStorage.getItem(CLAVE_CANJEADAS) ?? '[]') as unknown
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []
  } catch {
    return []
  }
}
export function recordarCanjeada(codigo: string): void {
  try {
    const todos = new Set(codigosCanjeados())
    todos.add(normalizarCodigo(codigo))
    window.localStorage.setItem(CLAVE_CANJEADAS, JSON.stringify([...todos].slice(-30)))
  } catch {
    /* sin almacenamiento: se preguntará al servidor */
  }
}
export const yaCanjeada = (codigo: string): boolean => codigosCanjeados().includes(normalizarCodigo(codigo))

/** El viaje al que ir directo en cuanto se carguen los viajes (al unirse, o al volver a abrir un enlace del que ya se es parte). Se lee una sola vez. */
export function pedirAbrirViaje(tripId: string | null | undefined): void {
  if (!tripId) return
  try {
    window.sessionStorage.setItem(CLAVE_ABRIR_VIAJE, tripId)
  } catch {
    /* sin almacenamiento: se abre el viaje de siempre */
  }
  avisarCambioDeInvitacion()
}
export function viajeAAbrir(): string | null {
  try {
    return window.sessionStorage.getItem(CLAVE_ABRIR_VIAJE)
  } catch {
    return null
  }
}
export function olvidarViajeAAbrir(): void {
  try {
    window.sessionStorage.removeItem(CLAVE_ABRIR_VIAJE)
  } catch {
    /* nada que quitar */
  }
  avisarCambioDeInvitacion()
}

/**
 * ¿Hay una invitación en marcha? (enlace abierto sin aceptar, o aceptada y a punto de entrar en el viaje). Mientras sea así, «Crear viaje» (la pantalla de origen y destino) NO se pinta:
 * ni al abrir el enlace, antes de «Eric te invita…», ni al tocar [Unirme], antes de entrar en el viaje.
 */
export function invitacionEnMarcha(busqueda: string = typeof window !== 'undefined' ? window.location.search : ''): boolean {
  return invitacionPendiente() !== null || viajeAAbrir() !== null || codigoDeLaDireccion(busqueda) !== null
}

/* ------------------------------------------------------------------ */
/* Invitar a un amigo a la app (cuentas parte 3, punto 7)              */
/* ------------------------------------------------------------------ */

const CLAVE_AMIGO = 'trazo:amigo'

/** Pura: el enlace personal para invitar a la app, sin viaje («https://…/?amigo=ABCD2345»). */
export const enlaceDeAmigo = (origen: string, codigo: string): string => `${origen.replace(/\/+$/, '')}/?amigo=${encodeURIComponent(normalizarCodigo(codigo))}`

/** Pura: el código personal que trae una dirección («?amigo=ABCD2345»), o null. */
export function codigoDeAmigoDeLaDireccion(busqueda: string): string | null {
  const valor = new URLSearchParams(busqueda).get('amigo')
  const codigo = valor ? normalizarCodigo(valor) : ''
  return codigo.length >= 6 && codigo.length <= 16 ? codigo : null
}

export function guardarAmigoPendiente(codigo: string): void {
  try {
    window.localStorage.setItem(CLAVE_AMIGO, normalizarCodigo(codigo))
  } catch {
    /* sin almacenamiento: la invitación no se apunta */
  }
}
export function amigoPendiente(): string | null {
  try {
    return window.localStorage.getItem(CLAVE_AMIGO) || null
  } catch {
    return null
  }
}
export function olvidarAmigoPendiente(): void {
  try {
    window.localStorage.removeItem(CLAVE_AMIGO)
  } catch {
    /* nada que quitar */
  }
}

/** Mi código personal para invitar a la app (se crea la primera vez). null si no se pudo. */
export async function miCodigoDeAmigo(): Promise<string | null> {
  if (!supabase) return null
  const { data, error } = await supabase.rpc('mi_codigo_app')
  return error || typeof data !== 'string' ? null : data
}

/**
 * Apunta que esta persona llegó invitada por ese código (de viaje, de pase o personal). Cuenta SOLO si con eso se creó una cuenta nueva (lo decide el servidor: una cuenta que ya existía no
 * cuenta) y solo para el primer invitador. No falla en voz alta: si algo sale mal, simplemente no se apunta.
 */
export async function registrarInvitado(codigo: string): Promise<boolean> {
  try {
    const token = (await supabase?.auth.getSession())?.data.session?.access_token
    if (!token) return false
    const r = await fetch('/api/invitaciones/registrar', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ codigo: normalizarCodigo(codigo) }) })
    const cuerpo = (await r.json().catch(() => null)) as { registrado?: boolean } | null
    return r.ok && cuerpo?.registrado === true
  } catch {
    return false
  }
}
