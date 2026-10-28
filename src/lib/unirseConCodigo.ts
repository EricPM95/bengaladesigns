import { supabase } from './supabaseClient'
import { useSyncStore } from '../store/useSyncStore'
import { abrirViajeGuardado } from './abrirViaje'
import { aceptarInvitacionPendiente, canjearInvitacion, guardarInvitacionPendiente, normalizarCodigo, olvidarViajeAAbrir, pedirAbrirViaje, textoDeInvitacionNoValida, verInvitacion } from './invitaciones'
import { recargarSinApertura } from './recargarSinApertura'
import { demoActivo } from './logros'
import { loadAllTrips } from './tripPersistence'
import { usePedirNombre } from '../store/usePedirNombre'
import { guardarFranjaDeUnion, type FranjaDeUnion } from './franjaDeUnion'

/**
 * UNIRSE A UN VIAJE ESCRIBIENDO EL CÓDIGO (Tanda 10N5, apartado 3, `Piezas/Unirse Codigo`): la lógica, para la hoja de la primera pantalla y la del Perfil.
 * 1. Límite de intentos: 6 fallos seguidos en 15 minutos y no se deja probar más (también lo pone el servidor, migración 0047; esto es el primer freno, en el móvil).
 * 2. Mira el código (`ver_invitacion`): si no es de ningún viaje, «Ese código no es de ningún viaje. Revísalo con quien te lo ha pasado.»; si ya estás en ese viaje, se abre y ya.
 * 3. Sin cuenta de verdad: se guarda el código como invitación aceptada y la puerta de la app pide «Entra o crea tu cuenta para unirte»; al entrar se une sola, con el código ya escrito.
 * 4. Con cuenta: se canjea y se ABRE ese viaje directamente (el que había abierto sigue en «Mis viajes»); sale la franja «Te has unido al viaje a Roma de Eric».
 */

export const TEXTO_CODIGO_NO_VALE = 'Este código no existe.'
export const TEXTO_DEMASIADOS_INTENTOS = 'Demasiados intentos. Espera unos minutos y vuelve a probar.'
export const MAX_FALLOS = 6
export const VENTANA_FALLOS_MS = 15 * 60 * 1000
const CLAVE_FALLOS = 'trazo:codigo:fallos'

/** Pura: los fallos que siguen contando (los de los últimos 15 minutos). */
export const fallosVigentes = (fallos: number[], ahora: number): number[] => fallos.filter((t) => ahora - t < VENTANA_FALLOS_MS)
/** Pura: ¿se ha pasado de intentos? */
export const demasiadosFallos = (fallos: number[], ahora: number): boolean => fallosVigentes(fallos, ahora).length >= MAX_FALLOS

function leerFallos(): number[] {
  try {
    const v = JSON.parse(window.localStorage.getItem(CLAVE_FALLOS) ?? '[]') as unknown
    return Array.isArray(v) ? v.filter((x): x is number => typeof x === 'number') : []
  } catch {
    return []
  }
}
function guardarFallos(fallos: number[]): void {
  try {
    window.localStorage.setItem(CLAVE_FALLOS, JSON.stringify(fallos))
  } catch {
    /* sin almacenamiento: el servidor pone su propio límite */
  }
}
export const estaBloqueado = (): boolean => demasiadosFallos(leerFallos(), Date.now())
export function anotarFallo(): void {
  guardarFallos([...fallosVigentes(leerFallos(), Date.now()), Date.now()])
}
export function olvidarFallos(): void {
  guardarFallos([])
}

export type ResultadoDeUnirse = { tipo: 'error'; texto: string } | { tipo: 'necesita_cuenta' } | { tipo: 'dentro'; tripId: string; yaEstaba: boolean }

/** ¿Hay una cuenta de verdad (no anónima) en este móvil? */
async function hayCuentaDeVerdad(): Promise<boolean> {
  if (demoActivo()) return true
  if (!supabase) return false
  const { data } = await supabase.auth.getSession()
  const u = data.session?.user
  return Boolean(u) && u?.is_anonymous !== true
}

/** Abre ese viaje en la app SIN recargar si se puede (trae de nuevo la lista de viajes, que ahora lo incluye); si no, lo deja pedido y recarga. */
export async function abrirViajeRecienUnido(tripId: string): Promise<void> {
  if (abrirViajeGuardado(tripId)) {
    olvidarViajeAAbrir()
    return
  }
  try {
    const uid = (await supabase?.auth.getSession())?.data.session?.user.id
    if (uid) {
      const viajes = await loadAllTrips(uid)
      useSyncStore.getState().setSavedTrips(viajes)
      if (abrirViajeGuardado(tripId)) {
        olvidarViajeAAbrir()
        return
      }
    }
  } catch {
    /* sin red: se abre tras recargar */
  }
  pedirAbrirViaje(tripId)
  recargarSinApertura()
}

export async function unirseConCodigo(texto: string): Promise<ResultadoDeUnirse> {
  const codigo = normalizarCodigo(texto)
  if (codigo.length < 6) return { tipo: 'error', texto: TEXTO_CODIGO_NO_VALE }
  if (estaBloqueado()) return { tipo: 'error', texto: TEXTO_DEMASIADOS_INTENTOS }
  const vista = await verInvitacion(codigo)
  if (!vista.valida) {
    if ((vista as { motivo?: string }).motivo === 'bloqueado') return { tipo: 'error', texto: TEXTO_DEMASIADOS_INTENTOS }
    if (vista.motivo === 'no_existe' || !vista.motivo) {
      anotarFallo()
      return { tipo: 'error', texto: estaBloqueado() ? TEXTO_DEMASIADOS_INTENTOS : TEXTO_CODIGO_NO_VALE }
    }
    return { tipo: 'error', texto: textoDeInvitacionNoValida(vista.motivo) }
  }
  olvidarFallos()
  const franja: FranjaDeUnion = { destino: vista.destino ?? null, invitador: vista.invitador ?? null, yaEstaba: Boolean(vista.ya_dentro) }
  // Ya está en ese viaje: se abre y ya.
  if (vista.ya_dentro && vista.trip_id) {
    guardarFranjaDeUnion(franja)
    return { tipo: 'dentro', tripId: vista.trip_id, yaEstaba: true }
  }
  // Sin cuenta de verdad: primero la cuenta; al entrar se une solo con este código.
  if (!(await hayCuentaDeVerdad())) {
    guardarInvitacionPendiente(codigo)
    aceptarInvitacionPendiente()
    return { tipo: 'necesita_cuenta' }
  }
  // Sin nombre puesto: «¿Cómo te llamas?», una sola vez, antes de entrar.
  await usePedirNombre.getState().pedir()
  const r = await canjearInvitacion(codigo)
  if (r.error || !r.tripId) {
    if (/no existe/i.test(r.error ?? '')) {
      anotarFallo()
      return { tipo: 'error', texto: TEXTO_CODIGO_NO_VALE }
    }
    return { tipo: 'error', texto: r.error ?? 'No se ha podido entrar en el viaje. Inténtalo de nuevo.' }
  }
  guardarFranjaDeUnion({ ...franja, yaEstaba: r.yaEstaba })
  return { tipo: 'dentro', tripId: r.tripId, yaEstaba: r.yaEstaba }
}
