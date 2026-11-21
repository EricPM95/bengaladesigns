import { createClient } from '@supabase/supabase-js'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from './supabaseClient'
import { amigoPendiente, canjearInvitacion, codigoDeAmigoDeLaDireccion, codigoDeLaDireccion, guardarAmigoPendiente, guardarInvitacionPendiente, invitacionAceptada, invitacionPendiente, olvidarAmigoPendiente, olvidarInvitacionPendiente, registrarInvitado, verInvitacion } from './invitaciones'
import { guardarFranjaDeUnion } from './franjaDeUnion'
import { recargarSinApertura } from './recargarSinApertura'
import { codigoValido } from './entrarCuenta'

/**
 * LAS CUENTAS, PARTE 1 (docs/dias/PLAN_CUENTAS.md). Entrar con el email (enlace mágico) o con Google, pasar a la cuenta lo que el móvil tenía, cerrar sesión y
 * borrar la cuenta. TODO va detrás de un interruptor (`cuentasActivas()`), apagado en producción hasta que estén las pantallas de Design. Con el interruptor
 * apagado nada de este fichero se ejecuta y la app es la de hoy.
 *
 * La idea de fondo: hoy cada móvil ya entra con una sesión anónima de Supabase (tripPersistence.ts) y casi todo cuelga de su `uid`. Hacer la cuenta CONSERVANDO ese
 * `uid` (`updateUser` con el email, `linkIdentity` con Google) no mueve nada. Solo si la persona ya tenía cuenta (otro móvil) el `uid` es otro, y entonces el servidor
 * pasa lo del móvil a la cuenta (`POST /api/cuenta/reclamar`).
 */

/* ------------------------------------------------------------------ */
/* El interruptor                                                      */
/* ------------------------------------------------------------------ */

const CLAVE_INTERRUPTOR = 'trazo:cuentas'

/** Pura, para poder probarla sin navegador: ¿están encendidas las cuentas? Apagadas salvo `VITE_CUENTAS_ACTIVAS=true`; en desarrollo también vale `?cuentas=on` (y `?cuentas=off`). */
export function calcularCuentasActivas(datos: { entorno?: string | undefined; desarrollo: boolean; parametro?: string | null; guardado?: string | null }): boolean {
  if (datos.desarrollo) {
    const elegido = datos.parametro === 'on' || datos.parametro === 'off' ? datos.parametro : datos.guardado
    if (elegido === 'on') return true
    if (elegido === 'off') return false
  }
  return datos.entorno === 'true'
}

/** Solo desarrollo: el modo demo de los logros (?logrosDemo=1) fuerza las cuentas. Se lee aquí a mano para no importar logros.ts (que importa este fichero). */
function demoActivoRapido(): boolean {
  try {
    return new URLSearchParams(window.location.search).get('logrosDemo') === '1' || window.sessionStorage.getItem('trazo:logrosDemo') === '1'
  } catch {
    return false
  }
}

export function cuentasActivas(): boolean {
  if (import.meta.env.DEV && demoActivoRapido()) return true
  let parametro: string | null = null
  let guardado: string | null = null
  try {
    parametro = new URLSearchParams(window.location.search).get('cuentas')
    if (import.meta.env.DEV && (parametro === 'on' || parametro === 'off')) window.sessionStorage.setItem(CLAVE_INTERRUPTOR, parametro)
    guardado = window.sessionStorage.getItem(CLAVE_INTERRUPTOR)
  } catch {
    /* sin ventana o sin almacenamiento: manda el valor de configuración */
  }
  return calcularCuentasActivas({ entorno: import.meta.env.VITE_CUENTAS_ACTIVAS, desarrollo: import.meta.env.DEV, parametro, guardado })
}

/* ------------------------------------------------------------------ */
/* Quién es                                                            */
/* ------------------------------------------------------------------ */

export interface DeGoogle {
  nombre: string | null
  foto: string | null
}
export type EstadoDeCuenta =
  | { tipo: 'cargando' }
  | { tipo: 'sin_sesion' }
  | { tipo: 'anonima'; uid: string }
  /** `proveedor`: cómo entra («email» o «google»); `deGoogle`: su nombre y su foto de Google, si entra con Google. */
  | { tipo: 'cuenta'; uid: string; email: string | null; proveedor?: string | null; deGoogle?: DeGoogle | null }

export const esAnonimo = (usuario: Pick<User, 'is_anonymous'> | null | undefined): boolean => usuario?.is_anonymous === true

export function estadoDeSesion(sesion: Session | null): EstadoDeCuenta {
  if (!sesion?.user) return { tipo: 'sin_sesion' }
  if (esAnonimo(sesion.user)) return { tipo: 'anonima', uid: sesion.user.id }
  const meta = (sesion.user.user_metadata ?? {}) as { full_name?: string; name?: string; avatar_url?: string; picture?: string }
  const proveedor = (sesion.user.app_metadata as { provider?: string } | undefined)?.provider ?? null
  const nombre = meta.full_name ?? meta.name ?? null
  const foto = meta.avatar_url ?? meta.picture ?? null
  return { tipo: 'cuenta', uid: sesion.user.id, email: sesion.user.email ?? null, proveedor, deGoogle: proveedor === 'google' ? { nombre, foto } : null }
}

/* ------------------------------------------------------------------ */
/* Guardar la sesión anónima por si la persona ya tenía cuenta        */
/* ------------------------------------------------------------------ */

const CLAVE_ANONIMA = 'trazo:cuenta:anonima'
interface AnonimaGuardada {
  uid: string
  refreshToken: string
}

function guardarAnonima(sesion: Session | null): void {
  try {
    if (sesion?.user && esAnonimo(sesion.user)) window.localStorage.setItem(CLAVE_ANONIMA, JSON.stringify({ uid: sesion.user.id, refreshToken: sesion.refresh_token } satisfies AnonimaGuardada))
  } catch {
    /* sin almacenamiento: no se podrá pasar lo del móvil si la cuenta ya existía */
  }
}

function leerAnonima(): AnonimaGuardada | null {
  try {
    const crudo = window.localStorage.getItem(CLAVE_ANONIMA)
    const dato = crudo ? (JSON.parse(crudo) as Partial<AnonimaGuardada>) : null
    return dato && typeof dato.uid === 'string' && typeof dato.refreshToken === 'string' ? { uid: dato.uid, refreshToken: dato.refreshToken } : null
  } catch {
    return null
  }
}

/* ------------------------------------------------------------------ */
/* (V1, 15-nov) El respaldo de la sesión: una caída del servidor no echa */
/* ------------------------------------------------------------------ */

/**
 * El 11-nov el servidor (Supabase) dejó de contestar y la app del iPhone de Eric «cerró la sesión»: al renovar el token con el servidor caído, la librería dio la sesión por perdida y la app pidió el correo.
 * Para que una caída NO eche a nadie, la sesión de una cuenta de verdad se copia aparte (como ya se hacía con la anónima) y, si al abrir la app la librería no tiene sesión, se intenta recuperar con esa copia.
 * Solo se borra al cerrar la sesión A PROPÓSITO (cerrarSesion, borrar la cuenta, empezar de cero) o si el servidor contesta que la sesión ya no vale.
 */
const CLAVE_RESPALDO = 'trazo:cuenta:respaldo'
interface RespaldoDeSesion {
  uid: string
  access_token: string
  refresh_token: string
}

function guardarRespaldo(sesion: Session | null): void {
  try {
    if (sesion?.user && !esAnonimo(sesion.user) && sesion.refresh_token) {
      window.localStorage.setItem(CLAVE_RESPALDO, JSON.stringify({ uid: sesion.user.id, access_token: sesion.access_token, refresh_token: sesion.refresh_token } satisfies RespaldoDeSesion))
    }
  } catch {
    /* sin almacenamiento: no habrá respaldo */
  }
}

function leerRespaldo(): RespaldoDeSesion | null {
  try {
    const crudo = window.localStorage.getItem(CLAVE_RESPALDO)
    const dato = crudo ? (JSON.parse(crudo) as Partial<RespaldoDeSesion>) : null
    return dato && typeof dato.uid === 'string' && typeof dato.access_token === 'string' && typeof dato.refresh_token === 'string' ? (dato as RespaldoDeSesion) : null
  } catch {
    return null
  }
}

/** Para cerrar la sesión a propósito: sin respaldo, la app no la recupera. */
export function olvidarRespaldoDeSesion(): void {
  try {
    window.localStorage.removeItem(CLAVE_RESPALDO)
  } catch {
    /* nada que quitar */
  }
}

export const hayRespaldoDeSesion = (): boolean => leerRespaldo() !== null

/** ¿El fallo es de que el servidor no contesta (y no de que la sesión no valga)? Tiempo de espera, 5xx, sin red. */
export function esFalloDeServidor(error: unknown): boolean {
  if (!error) return false
  const e = error as { status?: number; name?: string; message?: string; originalError?: { status?: number }; cause?: { status?: number } }
  const origen = e.originalError?.status ?? e.cause?.status
  if (typeof origen === 'number' && origen >= 500) return true
  if (typeof e.status === 'number' && (e.status >= 500 || e.status === 0 || e.status === 408 || e.status === 429)) return true
  if (e.name === 'AuthRetryableFetchError') return true
  return /timeout|timed out|upstream|failed to fetch|load failed|network|fetch|unavailable|bad gateway|gateway|econn|offline/i.test(String(e.message ?? error))
}

/**
 * Intenta recuperar la sesión de una cuenta con el respaldo. 'ok' = recuperada; 'sin_servidor' = el servidor no contesta (el respaldo se queda y se reintenta); 'invalida' = el servidor dice que ya no vale (se borra el respaldo);
 * 'no_hay' = nunca hubo respaldo.
 */
export async function recuperarSesionDeRespaldo(): Promise<'ok' | 'sin_servidor' | 'invalida' | 'no_hay'> {
  const respaldo = leerRespaldo()
  if (!respaldo || !supabase) return 'no_hay'
  try {
    const { data, error } = await supabase.auth.setSession({ access_token: respaldo.access_token, refresh_token: respaldo.refresh_token })
    if (data?.session) return 'ok'
    if (error && esFalloDeServidor(error)) return 'sin_servidor'
    olvidarRespaldoDeSesion()
    return 'invalida'
  } catch (error) {
    if (esFalloDeServidor(error)) return 'sin_servidor'
    olvidarRespaldoDeSesion()
    return 'invalida'
  }
}

function olvidarAnonima(): void {
  try {
    window.localStorage.removeItem(CLAVE_ANONIMA)
  } catch {
    /* nada que quitar */
  }
}

/* ------------------------------------------------------------------ */
/* Entrar                                                              */
/* ------------------------------------------------------------------ */

const SIN_NUBE = 'Las cuentas necesitan conexión con el servidor; ahora mismo no está disponible.'
export type Resultado = { error: string | null; aviso?: string }

const volverA = () => `${window.location.origin}/`
const emailValido = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)

/** Entrar con el email: se manda un enlace mágico. Sin cuenta todavía, la sesión anónima pasa a ser la cuenta (mismo `uid`); con cuenta, se entra en ella. */
export async function entrarConEmail(correo: string): Promise<Resultado> {
  if (!supabase) return { error: SIN_NUBE }
  const email = correo.trim().toLowerCase()
  if (!emailValido(email)) return { error: 'Escribe un email válido.' }
  try {
    const { data } = await supabase.auth.getSession()
    guardarAnonima(data.session)
    if (data.session && esAnonimo(data.session.user)) {
      const { error } = await supabase.auth.updateUser({ email }, { emailRedirectTo: volverA() })
      if (!error) return { error: null, aviso: 'Te hemos enviado un enlace. Ábrelo desde este móvil para terminar.' }
      // Ese email ya tiene cuenta: se entra en ella con otro enlace, y lo de este móvil se le pasa al volver.
      if (!/already|registered|exists|ya (está|existe)/i.test(error.message) && !/email_exists/i.test((error as { code?: string }).code ?? '')) return { error: 'No hemos podido mandar el enlace. Inténtalo de nuevo en un momento.' }
    }
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: volverA(), shouldCreateUser: true } })
    if (error) return { error: 'No hemos podido mandar el enlace. Inténtalo de nuevo en un momento.' }
    return { error: null, aviso: 'Te hemos enviado un enlace. Ábrelo desde este móvil para entrar.' }
  } catch {
    return { error: 'No hemos podido mandar el enlace. Inténtalo de nuevo en un momento.' }
  }
}

/**
 * Entrar con el CÓDIGO del email (Tanda 10G): el mismo email lleva el enlace y un código de números. Si el enlace se abre en OTRO navegador (por ejemplo, dentro de la app de Gmail, o en Safari cuando la app está
 * instalada en la pantalla de inicio), la sesión se queda allí y no en la app; el código se escribe en la propia app y la sesión queda donde hace falta. Lleva el mismo `uid` que la sesión anónima (se prueba como
 * cuenta nueva o ya existente, y como cambio de email de la sesión anónima). Necesita que el correo de Supabase incluya `{{ .Token }}` (ver el informe 10G).
 */
export async function entrarConCodigo(correo: string, codigo: string): Promise<Resultado> {
  if (!supabase) return { error: SIN_NUBE }
  const email = correo.trim().toLowerCase()
  const token = codigo.replace(/s+/g, '')
  if (!codigoValido(token)) return { error: 'El código son solo números (los del email).' }
  try {
    for (const type of ['email', 'email_change'] as const) {
      const { error } = await supabase.auth.verifyOtp({ email, token, type })
      if (!error) return { error: null }
    }
    return { error: 'Ese código no vale o ha caducado. Pide otro enlace.' }
  } catch {
    return { error: MENSAJE_NO_ENTRA }
  }
}

/**
 * Entrar con Google (Tanda 10K): UN solo viaje a Google, tenga o no cuenta ya. Se va directo con `signInWithOAuth` (nunca `linkIdentity`, que con una cuenta de Google que ya existe volvía con
 * `identity_already_exists` y obligaba a un segundo viaje). Si había una sesión anónima en este móvil (un viaje creado sin cuenta…), se guarda ANTES con su token al día; al volver ya con la cuenta,
 * `completarEntrada` le pasa a esa cuenta todo lo de la anónima (`/api/cuenta/reclamar`), como hace con el email. Cada toque en el botón borra los avisos y frenos de intentos anteriores.
 * Y la vuelta de Google no pone la pantalla de inicio (la detecta index.html por la dirección; ver `esVueltaDeGoogle`).
 */
export async function entrarConGoogle(): Promise<Resultado> {
  if (!supabase) return { error: SIN_NUBE }
  try {
    escribirSesionStorage(CLAVE_REINTENTO_GOOGLE, null)
    escribirSesionStorage(CLAVE_ERROR_ENTRAR, null)
    const { data } = await supabase.auth.getSession()
    guardarAnonima(data.session)
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: volverA() } })
    return error ? { error: MENSAJE_NO_ENTRA } : { error: null }
  } catch {
    return { error: MENSAJE_NO_ENTRA }
  }
}

/** Pura: ¿la dirección es la vuelta de Google (el código, la sesión o un error en la dirección o en el hash)? index.html usa la misma regla para no poner la pantalla de inicio. */
export const esVueltaDeGoogle = (direccion: string): boolean => /(^|[?&#])(code|access_token|error|error_code)=/i.test(direccion)

/** Lo que se dice cuando no se ha podido entrar (la pantalla de entrar lo enseña con su botón; la página NO se recarga). */
export const MENSAJE_NO_ENTRA = 'No hemos podido entrar. Inténtalo de nuevo.'

const CLAVE_REINTENTO_GOOGLE = 'trazo:cuenta:google-reintento'
const CLAVE_ERROR_ENTRAR = 'trazo:cuenta:error-entrar'

/** Pura: ¿lo que dejó el enlace en la dirección es un error de entrar? (\`error=\` o \`error_code=\` en la dirección o en el hash). */
export const hayErrorDeEntrar = (direccion: string): boolean => /(^|[?&#])error(_code)?=/i.test(direccion)
/** Pura: ¿es «esa cuenta de Google ya está en otra cuenta»? */
export const esCuentaYaExistente = (direccion: string): boolean => /identity_already_exists|already linked|already_exists|email_exists|user_already/i.test(direccion)

const leerSesionStorage = (clave: string): string | null => {
  try {
    return window.sessionStorage.getItem(clave)
  } catch {
    return null
  }
}
const escribirSesionStorage = (clave: string, valor: string | null): void => {
  try {
    if (valor === null) window.sessionStorage.removeItem(clave)
    else window.sessionStorage.setItem(clave, valor)
  } catch {
    /* sin almacenamiento: no se puede recordar el intento (el estado de la página es el único freno) */
  }
}

/** El aviso de «no hemos podido entrar» que dejó el último intento (se lee una vez y se borra). */
export function errorDeEntradaPendiente(): string | null {
  const e = leerSesionStorage(CLAVE_ERROR_ENTRAR)
  if (e) escribirSesionStorage(CLAVE_ERROR_ENTRAR, null)
  return e
}

let volviendo: Promise<boolean> | null = null

/**
 * Al volver del enlace de Google con un error en la dirección (Google cancelado, sin conexión…): se limpia la dirección y se deja el aviso «No hemos podido entrar. Inténtalo de nuevo.» para la pantalla
 * de entrar. SIN reintentos ni segundo viaje a Google (Tanda 10K): quien quiera volver a probar toca el botón otra vez. Devuelve siempre false (nunca sale a Google por su cuenta).
 */
export function alVolverDelEnlace(): Promise<boolean> {
  if (volviendo) return volviendo
  volviendo = (async () => {
    try {
      const texto = `${window.location.search}&${window.location.hash.replace(/^#/, '')}`
      if (!hayErrorDeEntrar(texto)) return false
      window.history.replaceState(null, '', window.location.pathname)
      escribirSesionStorage(CLAVE_REINTENTO_GOOGLE, null)
      escribirSesionStorage(CLAVE_ERROR_ENTRAR, MENSAJE_NO_ENTRA)
      return false
    } catch {
      escribirSesionStorage(CLAVE_ERROR_ENTRAR, MENSAJE_NO_ENTRA)
      return false
    }
  })()
  return volviendo
}

/** Solo la prueba: deja a \`alVolverDelEnlace\` listo para otra vuelta. */
export function reiniciarVueltaDeEnlace(): void {
  volviendo = null
}

/* ------------------------------------------------------------------ */
/* Al entrar: pasar lo del móvil, fecha de alta, vistos                */
/* ------------------------------------------------------------------ */

/** Un cliente aparte, sin guardar sesión, para renovar el token de la sesión anónima de antes sin tocar la de ahora. */
async function tokenDeLaAnonima(anonima: AnonimaGuardada): Promise<string | null> {
  const url = import.meta.env.VITE_SUPABASE_URL
  const clave = import.meta.env.VITE_SUPABASE_ANON_KEY
  if (!url || !clave) return null
  const aparte = createClient(url, clave, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } })
  const { data, error } = await aparte.auth.refreshSession({ refresh_token: anonima.refreshToken })
  return error ? null : (data.session?.access_token ?? null)
}

/** Pide al servidor que pase a esta cuenta lo de la sesión anónima de este móvil. Devuelve true si se pasó algo (hay que recargar para que la app lea con la cuenta). */
/**
 * `intento`: se llamó al servidor y salió bien (la sesión anónima ya no existe). `movido`: había algo que pasar (viajes, fotos, vistos, «me gusta», pases, plazas, logros…); solo entonces lo que la app
 * ya había leído está viejo. Sin respuesta clara del servidor se cuenta como «movido» (ante la duda, se recarga).
 */
type ResultadoReclamar = { intento: boolean; movido: boolean }
const NADA_RECLAMADO: ResultadoReclamar = { intento: false, movido: false }
/** ¿Esta sesión va a necesitar pasar lo del móvil a la cuenta? (Para tapar la app mientras se hace, y no enseñarla un segundo antes de recargar.) */
function hayQueReclamar(sesion: Session): boolean {
  const anonima = leerAnonima()
  return !!anonima && anonima.uid !== sesion.user.id
}
async function reclamarLoDelMovil(sesion: Session): Promise<ResultadoReclamar> {
  const anonima = leerAnonima()
  if (!anonima) return NADA_RECLAMADO
  if (anonima.uid === sesion.user.id) {
    olvidarAnonima() // (mismo `uid`: la cuenta se hizo sobre la sesión anónima y no hay nada que pasar)
    return NADA_RECLAMADO
  }
  try {
    const tokenViejo = await tokenDeLaAnonima(anonima)
    if (!tokenViejo) {
      olvidarAnonima()
      return NADA_RECLAMADO
    }
    const respuesta = await fetch('/api/cuenta/reclamar', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sesion.access_token}` }, body: JSON.stringify({ anonToken: tokenViejo }) })
    if (!respuesta.ok) {
      console.warn('[cuentas] no se pudo pasar lo del móvil:', await respuesta.text().catch(() => respuesta.status))
      return NADA_RECLAMADO // (se deja guardada la sesión anónima para reintentarlo la próxima vez)
    }
    olvidarAnonima()
    const cuerpo = (await respuesta.json().catch(() => null)) as { pasado?: Record<string, number> | null; archivosMovidos?: number; otros?: number } | null
    const contado = cuerpo?.pasado ? Object.values(cuerpo.pasado).reduce((a, n) => a + (Number(n) || 0), 0) : null
    const movido = !cuerpo || contado === null || contado > 0 || (cuerpo.archivosMovidos ?? 0) > 0 || (cuerpo.otros ?? 1) > 0
    return { intento: true, movido }
  } catch (error) {
    console.warn('[cuentas] fallo pasando lo del móvil:', error)
    return NADA_RECLAMADO
  }
}

/**
 * ENTRAR SIN QUE SE VEA LA APP DOS VECES. Al abrir con una cuenta, la app arranca y enseña todo mientras `completarEntrada` hace sus gestiones (pasar lo del móvil, fecha de alta…) y, si algo cambia, recarga.
 * Eso es lo que se veía: la app entera un segundo y luego «otra carga». Aquí se pone una cortina del color de la app (con «Entrando…») mientras dura esa gestión; si se recarga, la cortina sigue hasta la recarga
 * (y la pantalla de apertura no sale otra vez), y si no hace falta recargar, se quita. Con tope de seguridad.
 */
const ID_CORTINA = 'jutrip-entrando'
function ponerCortina(): void {
  try {
    if (typeof document === 'undefined' || document.getElementById(ID_CORTINA)) return
    const c = document.createElement('div')
    c.id = ID_CORTINA
    c.setAttribute('data-entrando', '')
    c.setAttribute('role', 'status')
    c.style.cssText = "position:fixed;inset:0;z-index:2147483000;background:#FBF6EC;color:#1C2230;display:flex;align-items:center;justify-content:center;font:500 15px 'Geist',system-ui,sans-serif"
    c.textContent = 'Entrando…'
    document.body.appendChild(c)
    window.setTimeout(quitarCortina, 12000)
  } catch {
    /* sin documento: nada que tapar */
  }
}
function quitarCortina(): void {
  try {
    document.getElementById(ID_CORTINA)?.remove()
  } catch {
    /* nada que quitar */
  }
}

/**
 * (V34) LA CORTINA, DESDE EL PRIMER INSTANTE: si al abrir la app se ve que va a haber que pasar lo del móvil a una cuenta (hay una sesión anónima guardada Y la dirección trae la vuelta de Google / del enlace, o ya hay una sesión de
 * cuenta distinta), la cortina se pone YA, al cargar este archivo, antes de que la app pinte nada. Se quita sola si al final no hay cuenta (o a los 12 s).
 */
function tapaTempranaSiHaceFalta(): void {
  try {
    if (typeof window === 'undefined' || typeof document === 'undefined' || !document.body) return
    const anonima = leerAnonima()
    if (!anonima) return
    const url = `${window.location.search}&${window.location.hash.replace(/^#/, '')}`
    let cuentaDistinta = false
    for (let i = 0; i < window.localStorage.length; i++) {
      const clave = window.localStorage.key(i)
      if (!clave || !/^sb-.*-auth-token$/.test(clave)) continue
      const usuario = (JSON.parse(window.localStorage.getItem(clave) ?? 'null') as { user?: { id?: string; is_anonymous?: boolean } } | null)?.user
      if (usuario?.id && !usuario.is_anonymous && usuario.id !== anonima.uid) cuentaDistinta = true
    }
    if ((/(^|&)(code|access_token)=/.test(url) && !hayErrorDeEntrar(url)) || cuentaDistinta) ponerCortina()
  } catch {
    /* sin almacenamiento: no se tapa nada */
  }
}

/** ¿La primera lectura de la sesión al abrir la app ya era una cuenta de verdad? (Vuelta de Google: sí. Escribir el código con la app ya abierta: no, era la anónima.) */
let resolverPrimeraLectura: (esCuenta: boolean) => void = () => undefined
const primeraLectura = new Promise<boolean>((r) => {
  resolverPrimeraLectura = r
})

/** Recarga la app con la dirección limpia (sin lo que dejó el enlace mágico). Una navegación dentro de la propia app, no un enlace a otra web. */
function recargarLimpio(ruta: string): void {
  try {
    window.history.replaceState(null, '', ruta)
  } catch {
    /* sin historial: se recarga igual */
  }
  recargarSinApertura()
}

const CLAVE_AVISO_INVITACION = 'trazo:invitacion:aviso'
/** Lo que le pasó a la última invitación que abrió (para enseñarlo después de la recarga). */
export function guardarAvisoDeInvitacion(texto: string): void {
  try {
    window.sessionStorage.setItem(CLAVE_AVISO_INVITACION, texto)
  } catch {
    /* sin almacenamiento: no se enseña */
  }
}
export function leerAvisoDeInvitacion(): string | null {
  try {
    return window.sessionStorage.getItem(CLAVE_AVISO_INVITACION)
  } catch {
    return null
  }
}
export function olvidarAvisoDeInvitacion(): void {
  try {
    window.sessionStorage.removeItem(CLAVE_AVISO_INVITACION)
  } catch {
    /* nada que quitar */
  }
}

/** Si la dirección trae `?invitacion=CÓDIGO`, se guarda para canjearla después de entrar y se limpia la dirección. */
export function recogerInvitacionDeLaDireccion(): string | null {
  try {
    // El enlace personal para invitar a la app («?amigo=CÓDIGO»): se guarda para apuntar la invitación justo después de crear la cuenta.
    const amigo = codigoDeAmigoDeLaDireccion(window.location.search)
    if (amigo) {
      guardarAmigoPendiente(amigo)
      window.history.replaceState(null, '', window.location.pathname)
    }
    const codigo = codigoDeLaDireccion(window.location.search)
    if (!codigo) return null
    guardarInvitacionPendiente(codigo)
    window.history.replaceState(null, '', window.location.pathname)
    return codigo
  } catch {
    return null
  }
}

let entradaEnCurso: Promise<void> | null = null

/** Lo que se hace cada vez que hay una cuenta de verdad: pasar lo del móvil, guardar la fecha de alta y copiar los vistos del viaje a los de la persona. */
export function completarEntrada(sesion: Session): Promise<void> {
  if (!supabase || esAnonimo(sesion.user)) return Promise.resolve()
  if (!entradaEnCurso) {
    const tapar = hayQueReclamar(sesion) || !!invitacionPendiente()
    if (tapar) ponerCortina()
    let recargando = false
    entradaEnCurso = (async () => {
      const reclamado = await reclamarLoDelMovil(sesion)
      const pasado = reclamado.movido
      await supabase!.rpc('marcar_alta').then(({ error }) => {
        if (error) console.warn('[cuentas] no se pudo guardar la fecha de alta (¿falta aplicar la migración 0020?):', error.message)
      })
      if (sesion.user.email) await supabase!.from('travelers').update({ email: sesion.user.email }).eq('id', sesion.user.id)
      const { copiarVistosDeLosViajes } = await import('./vistosApi')
      await copiarVistosDeLosViajes(sesion.user.id).catch(() => undefined)
      // Una invitación a un viaje abierta antes de tener cuenta (o ahora): se canjea y la persona entra en el viaje como invitada.
      let entroEnUnViaje = false
      const codigo = invitacionPendiente()
      if (codigo && invitacionAceptada()) {
        // (Tanda 10N5) Para la franja «Te has unido al viaje a Roma de Eric»: antes de canjear se mira quién invita y a qué destino.
        const antes = await verInvitacion(codigo).catch(() => null)
        const resultado = await canjearInvitacion(codigo)
        olvidarInvitacionPendiente()
        // Entrar por un enlace o un código de viaje o de pase cuenta como invitación SI con eso se creó una cuenta nueva (lo decide el servidor).
        if (!resultado.error) await registrarInvitado(codigo)
        // Entra al crear su cuenta: tras recargar, si no tiene nombre, se le pregunta una vez (AjustesHosts).
        if (!resultado.error) {
          try {
            window.sessionStorage.setItem('trazo:pedir-nombre-al-volver', '1')
          } catch {
            /* sin almacenamiento: no se pregunta */
          }
        }
        if (resultado.error) guardarAvisoDeInvitacion(resultado.error)
        else if (!resultado.yaEstaba) {
          guardarAvisoDeInvitacion('Has entrado en el viaje como invitado.')
          guardarFranjaDeUnion({ destino: antes?.destino ?? null, invitador: antes?.invitador ?? null, yaEstaba: false })
          entroEnUnViaje = true
        } else if (resultado.tripId) {
          // (Tanda 10N §5) Ya estaba dentro: directo a ese viaje, sin la pantalla de la invitación.
          if (resultado.plazaDada) guardarAvisoDeInvitacion('Ya tienes tu plaza del pase.')
          entroEnUnViaje = true
        }
      }
      // El enlace personal para invitar a la app (sin viaje).
      const amigo = amigoPendiente()
      if (amigo) {
        await registrarInvitado(amigo)
        olvidarAmigoPendiente()
      }
      // Con el `uid` cambiado, o con un viaje nuevo, todo lo que la app cargó está viejo: se recarga una vez, con la dirección limpia.
      // (Entrar sin doble carga) Si NO había nada que pasar y la app ya abrió con la cuenta (vuelta de Google), lo leído ya es lo bueno: no se recarga. Con el código escrito con la app abierta, se recarga siempre
      // (lo leído era de la sesión anónima).
      const alArrancar = reclamado.intento && !reclamado.movido ? await Promise.race([primeraLectura, new Promise<boolean>((r) => setTimeout(() => r(false), 3000))]) : false
      if (pasado || entroEnUnViaje || (reclamado.intento && !alArrancar)) {
        recargando = true
        recargarLimpio(window.location.pathname)
      }
    })().finally(() => {
      entradaEnCurso = null
      if (tapar && !recargando) quitarCortina()
    })
  }
  return entradaEnCurso
}

/** Se engancha a los cambios de sesión (una sola vez). Devuelve la función para soltarlo. */
export function vigilarSesion(alCambiar: (estado: EstadoDeCuenta) => void): () => void {
  if (!supabase) {
    alCambiar({ tipo: 'sin_sesion' })
    return () => undefined
  }
  recogerInvitacionDeLaDireccion()
  void alVolverDelEnlace()
  let parado = false
  let reintento: number | undefined
  // (V1) Sin sesión en la librería pero con respaldo de una cuenta: se recupera con el respaldo. Con el servidor caído NO se enseña «Entrar»: se queda cargando y se reintenta cada 15 s.
  const recuperar = async (): Promise<void> => {
    const r = await recuperarSesionDeRespaldo()
    if (parado) return
    if (r === 'ok') {
      const { data } = await supabase!.auth.getSession()
      if (parado) return
      alCambiar(estadoDeSesion(data.session))
      guardarAnonima(data.session)
      guardarRespaldo(data.session)
      if (data.session) void completarEntrada(data.session)
    } else if (r === 'sin_servidor') {
      alCambiar({ tipo: 'cargando' })
      reintento = window.setTimeout(() => void recuperar(), 15000)
    } else {
      alCambiar({ tipo: 'sin_sesion' })
    }
  }
  void supabase.auth
    .getSession()
    .then(({ data, error }) => {
      if (!data.session && (hayRespaldoDeSesion() || (error && esFalloDeServidor(error)))) {
        if (hayRespaldoDeSesion()) return recuperar()
        alCambiar({ tipo: 'cargando' })
        reintento = window.setTimeout(() => void supabase!.auth.getSession().then(() => undefined), 15000)
        return undefined
      }
      resolverPrimeraLectura(!!data.session && !esAnonimo(data.session.user))
      if (!data.session || esAnonimo(data.session.user)) quitarCortina()
      alCambiar(estadoDeSesion(data.session))
      guardarAnonima(data.session)
      guardarRespaldo(data.session)
      if (data.session && !esAnonimo(data.session.user)) escribirSesionStorage(CLAVE_REINTENTO_GOOGLE, null)
      if (data.session) void completarEntrada(data.session)
      return undefined
    })
    .catch(() => {
      resolverPrimeraLectura(false)
      quitarCortina()
      if (hayRespaldoDeSesion()) void recuperar()
      else alCambiar({ tipo: 'sin_sesion' })
    })
  // (Tanda 10G) Si el enlace del email se abrió en otro navegador, el servidor ya sabe que esta cuenta es de verdad pero esta sesión lo ignora hasta renovarse: al volver a la app (con la sesión anónima) se renueva ahora.
  const alVolver = () => {
    if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return
    void supabase!.auth.getSession().then(({ data: s }) => {
      if (s.session && esAnonimo(s.session.user)) void supabase!.auth.refreshSession().catch(() => undefined)
    })
  }
  document.addEventListener('visibilitychange', alVolver)
  window.addEventListener('focus', alVolver)
  const { data } = supabase.auth.onAuthStateChange((_evento, sesion) => {
    // (V1) La librería se quedó sin sesión pero NO fue a propósito (hay respaldo): no se enseña «Entrar»; se recupera con el respaldo.
    if (!sesion && hayRespaldoDeSesion()) {
      alCambiar({ tipo: 'cargando' })
      setTimeout(() => void recuperar(), 0)
      return
    }
    alCambiar(estadoDeSesion(sesion))
    guardarRespaldo(sesion)
    // El token de la sesión anónima se mantiene al día (Supabase lo cambia al renovarlo): si luego hay que pasar lo suyo a una cuenta, el guardado sirve.
    guardarAnonima(sesion)
    if (sesion && !esAnonimo(sesion.user)) escribirSesionStorage(CLAVE_REINTENTO_GOOGLE, null)
    // (Sin `await` dentro del aviso: Supabase pide no llamarle desde aquí dentro; se hace en el siguiente turno.)
    if (sesion) setTimeout(() => void completarEntrada(sesion), 0)
  })
  return () => {
    parado = true
    if (reintento) window.clearTimeout(reintento)
    data.subscription.unsubscribe()
    document.removeEventListener('visibilitychange', alVolver)
    window.removeEventListener('focus', alVolver)
  }
}

/* ------------------------------------------------------------------ */
/* Cerrar sesión y borrar la cuenta                                    */
/* ------------------------------------------------------------------ */

function limpiarElMovil(): void {
  try {
    for (const almacen of [window.localStorage, window.sessionStorage]) {
      const claves: string[] = []
      for (let i = 0; i < almacen.length; i++) {
        const clave = almacen.key(i)
        if (clave && (clave.startsWith('trazo:') || clave.startsWith('sb-'))) claves.push(clave)
      }
      for (const clave of claves) almacen.removeItem(clave)
    }
  } catch {
    /* sin almacenamiento: nada que limpiar */
  }
}

export async function cerrarSesion(): Promise<void> {
  olvidarRespaldoDeSesion() // (V1) a propósito: sin respaldo, la app no la recupera
  await import('./sinConexion').then((m) => m.borrarListaDeViajes()).catch(() => undefined) // (V1b) la lista de viajes del móvil es de esta cuenta
  await import('./copiaOriginal').then((m) => m.borrarCopiasOriginales()).catch(() => undefined) // (V37) las rutas originales del móvil también
  try {
    await supabase?.auth.signOut()
  } finally {
    olvidarAnonima()
    try {
      window.localStorage.removeItem('trazo:perfil:ultimo:v1') // (Tanda 10N5) lo último que se vio del Perfil es de la cuenta que sale
      void import('./logrosEnCache').then((m) => m.olvidarCacheDeLogros()) // (V9) y lo último que se vio de los logros
    } catch {
      /* nada que quitar */
    }
    recargarLimpio('/')
  }
}

/**
 * Borra la cuenta DE VERDAD: el servidor borra los archivos de las fotos y al usuario (y con él, en cascada, viajes, vistos, fotos, logros y pases). Aquí, después,
 * se limpia lo que quede en el móvil. Devuelve el error en palabras sencillas, o null si todo fue bien (y entonces recarga la app, que arranca de cero).
 */
export async function borrarMiCuenta(): Promise<string | null> {
  if (!supabase) return SIN_NUBE
  try {
    const { data } = await supabase.auth.getSession()
    if (!data.session) return 'No has entrado con ninguna cuenta.'
    // (V37) Una petición, solo al pulsar el botón de la hoja (nada en bucle); el servidor exige { confirmar: 'BORRAR' }.
    const respuesta = await fetch('/api/cuenta', { method: 'DELETE', headers: { Authorization: `Bearer ${data.session.access_token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ confirmar: 'BORRAR' }) })
    if (!respuesta.ok) {
      const cuerpo = (await respuesta.json().catch(() => null)) as { error?: string } | null
      return cuerpo?.error ?? 'No se ha podido borrar la cuenta. Inténtalo de nuevo.'
    }
    olvidarRespaldoDeSesion()
    await supabase.auth.signOut({ scope: 'local' }).catch(() => undefined)
    limpiarElMovil()
    recargarLimpio('/')
    return null
  } catch {
    return 'No se ha podido borrar la cuenta. Inténtalo de nuevo.'
  }
}

tapaTempranaSiHaceFalta()
