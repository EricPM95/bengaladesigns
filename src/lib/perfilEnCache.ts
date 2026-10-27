import type { PerfilLogros } from '../components/logros/pantallas/perfil/api'
import { supabase } from './supabaseClient'
import { demoActivo } from './logros'

/**
 * LO ÚLTIMO QUE SE VIO DEL PERFIL (Tanda 10N5, apartado 4, «que se abra al momento»): la última respuesta de `/api/logros/perfil` se guarda en el móvil y, al abrir el Perfil, se enseña AL INSTANTE; los datos
 * nuevos llegan por detrás y solo cambian lo que cambie (sin parpadeo, y nunca el perfil vacío si ya se vio uno). Se guarda por cuenta (el `uid`) y se borra al cerrar la sesión.
 */
const CLAVE = 'trazo:perfil:ultimo:v1'

interface Guardado {
  uid: string
  perfil: PerfilLogros
}

/** Lo último guardado (sin mirar de quién es: se lee al instante, y `uidDeLaSesion` lo confirma justo después; si no coincide, se descarta). */
export function leerPerfilGuardado(): Guardado | null {
  try {
    const crudo = window.localStorage.getItem(CLAVE)
    if (!crudo) return null
    const g = JSON.parse(crudo) as Guardado
    return g && typeof g.uid === 'string' && g.perfil?.ok && g.perfil.exp ? g : null
  } catch {
    return null
  }
}

/** La cuenta con la que se está ahora (en el modo de pruebas de los logros, «demo»). */
export async function uidDeLaSesion(): Promise<string | null> {
  if (demoActivo()) return 'demo'
  try {
    return (await supabase?.auth.getSession())?.data.session?.user.id ?? null
  } catch {
    return null
  }
}

export function guardarPerfil(uid: string | null, perfil: PerfilLogros): void {
  if (!uid) return
  try {
    window.localStorage.setItem(CLAVE, JSON.stringify({ uid, perfil } satisfies Guardado))
  } catch {
    /* sin almacenamiento o lleno: se pide al servidor como siempre */
  }
}

export function olvidarPerfilGuardado(): void {
  try {
    window.localStorage.removeItem(CLAVE)
  } catch {
    /* nada que quitar */
  }
}

/** Pura: ¿son iguales dos respuestas del perfil? (para no repintar ni parpadear cuando el servidor dice lo mismo). */
export const mismoPerfil = (a: PerfilLogros | null, b: PerfilLogros | null): boolean => a === b || (a !== null && b !== null && JSON.stringify(a) === JSON.stringify(b))
