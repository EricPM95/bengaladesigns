import { createClient } from '@supabase/supabase-js'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from './supabaseClient'
import { canjearInvitacion, codigoDeLaDireccion, guardarInvitacionPendiente, invitacionPendiente, olvidarInvitacionPendiente } from './invitaciones'

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

export function cuentasActivas(): boolean {
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

export type EstadoDeCuenta = { tipo: 'cargando' } | { tipo: 'sin_sesion' } | { tipo: 'anonima'; uid: string } | { tipo: 'cuenta'; uid: string; email: string | null }

export const esAnonimo = (usuario: Pick<User, 'is_anonymous'> | null | undefined): boolean => usuario?.is_anonymous === true

export function estadoDeSesion(sesion: Session | null): EstadoDeCuenta {
  if (!sesion?.user) return { tipo: 'sin_sesion' }
  return esAnonimo(sesion.user) ? { tipo: 'anonima', uid: sesion.user.id } : { tipo: 'cuenta', uid: sesion.user.id, email: sesion.user.email ?? null }
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

/** Entrar con Google: con sesión anónima se vincula (mismo `uid`); si esa cuenta de Google ya existía, se entra en ella (al volver, el error lo recoge `alVolverDelEnlace`). */
export async function entrarConGoogle(): Promise<Resultado> {
  if (!supabase) return { error: SIN_NUBE }
  try {
    const { data } = await supabase.auth.getSession()
    guardarAnonima(data.session)
    if (data.session && esAnonimo(data.session.user)) {
      const { error } = await supabase.auth.linkIdentity({ provider: 'google', options: { redirectTo: volverA() } })
      if (!error) return { error: null }
    }
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: volverA() } })
    return error ? { error: 'No hemos podido entrar con Google. Inténtalo de nuevo.' } : { error: null }
  } catch {
    return { error: 'No hemos podido entrar con Google. Inténtalo de nuevo.' }
  }
}

/**
 * Al volver del enlace de Google: si esa cuenta de Google ya estaba en otra persona o en otro móvil, Supabase devuelve `identity_already_exists`. Entonces se entra en
 * ESA cuenta (lo del móvil se le pasa después, como en cualquier entrada). Devuelve true si tuvo que reintentar. Pura salvo por la dirección y el cliente.
 */
export async function alVolverDelEnlace(): Promise<boolean> {
  try {
    const texto = `${window.location.search}&${window.location.hash.replace(/^#/, '')}`
    if (!/identity_already_exists|already linked|already_exists/i.test(texto)) return false
    window.history.replaceState(null, '', window.location.pathname)
    await entrarConGoogle()
    return true
  } catch {
    return false
  }
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
async function reclamarLoDelMovil(sesion: Session): Promise<boolean> {
  const anonima = leerAnonima()
  if (!anonima) return false
  if (anonima.uid === sesion.user.id) {
    olvidarAnonima() // (mismo `uid`: la cuenta se hizo sobre la sesión anónima y no hay nada que pasar)
    return false
  }
  try {
    const tokenViejo = await tokenDeLaAnonima(anonima)
    if (!tokenViejo) {
      olvidarAnonima()
      return false
    }
    const respuesta = await fetch('/api/cuenta/reclamar', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sesion.access_token}` }, body: JSON.stringify({ anonToken: tokenViejo }) })
    if (!respuesta.ok) {
      console.warn('[cuentas] no se pudo pasar lo del móvil:', await respuesta.text().catch(() => respuesta.status))
      return false // (se deja guardada la sesión anónima para reintentarlo la próxima vez)
    }
    olvidarAnonima()
    return true
  } catch (error) {
    console.warn('[cuentas] fallo pasando lo del móvil:', error)
    return false
  }
}

/** Recarga la app con la dirección limpia (sin lo que dejó el enlace mágico). Una navegación dentro de la propia app, no un enlace a otra web. */
function recargarLimpio(ruta: string): void {
  try {
    window.history.replaceState(null, '', ruta)
  } catch {
    /* sin historial: se recarga igual */
  }
  window.location.reload()
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
    entradaEnCurso = (async () => {
      const pasado = await reclamarLoDelMovil(sesion)
      await supabase!.rpc('marcar_alta').then(({ error }) => {
        if (error) console.warn('[cuentas] no se pudo guardar la fecha de alta (¿falta aplicar la migración 0020?):', error.message)
      })
      if (sesion.user.email) await supabase!.from('travelers').update({ email: sesion.user.email }).eq('id', sesion.user.id)
      const { copiarVistosDeLosViajes } = await import('./vistosApi')
      await copiarVistosDeLosViajes(sesion.user.id).catch(() => undefined)
      // Una invitación a un viaje abierta antes de tener cuenta (o ahora): se canjea y la persona entra en el viaje como invitada.
      let entroEnUnViaje = false
      const codigo = invitacionPendiente()
      if (codigo) {
        const resultado = await canjearInvitacion(codigo)
        olvidarInvitacionPendiente()
        if (resultado.error) guardarAvisoDeInvitacion(resultado.error)
        else if (!resultado.yaEstaba) {
          guardarAvisoDeInvitacion('Has entrado en el viaje como invitado.')
          entroEnUnViaje = true
        }
      }
      // Con el `uid` cambiado, o con un viaje nuevo, todo lo que la app cargó está viejo: se recarga una vez, con la dirección limpia.
      if (pasado || entroEnUnViaje) recargarLimpio(window.location.pathname)
    })().finally(() => {
      entradaEnCurso = null
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
  void supabase.auth.getSession().then(({ data }) => {
    alCambiar(estadoDeSesion(data.session))
    if (data.session) void completarEntrada(data.session)
  })
  const { data } = supabase.auth.onAuthStateChange((_evento, sesion) => {
    alCambiar(estadoDeSesion(sesion))
    // (Sin `await` dentro del aviso: Supabase pide no llamarle desde aquí dentro; se hace en el siguiente turno.)
    if (sesion) setTimeout(() => void completarEntrada(sesion), 0)
  })
  return () => data.subscription.unsubscribe()
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
  try {
    await supabase?.auth.signOut()
  } finally {
    olvidarAnonima()
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
    const respuesta = await fetch('/api/cuenta', { method: 'DELETE', headers: { Authorization: `Bearer ${data.session.access_token}` } })
    if (!respuesta.ok) {
      const cuerpo = (await respuesta.json().catch(() => null)) as { error?: string } | null
      return cuerpo?.error ?? 'No se ha podido borrar la cuenta. Inténtalo de nuevo.'
    }
    await supabase.auth.signOut({ scope: 'local' }).catch(() => undefined)
    limpiarElMovil()
    recargarLimpio('/')
    return null
  } catch {
    return 'No se ha podido borrar la cuenta. Inténtalo de nuevo.'
  }
}
