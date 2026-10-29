import { llamar } from './logros'
import { supabase } from './supabaseClient'

/**
 * EMPEZAR DE CERO (Tanda 10J, solo para la cuenta de administrador; lo decide el servidor). El servidor borra lo de la cuenta; aquí se borra lo del móvil y se vuelve a la pantalla de inicio
 * como la primera vez que se abre la app (con la apertura).
 */

/** Los interruptores de la app (cuentas, logros, Civitatis, versión gratis/completa): no son datos de la persona, son cómo está encendida la app; sin ellos la app no volvería a arrancar igual. */
export const CLAVES_QUE_SE_QUEDAN = ['trazo:cuentas', 'trazo:logros', 'trazo:civitatis', 'trazo:version']

/** ¿Ve esta cuenta el botón? Lo dice el servidor (LOGROS_ADMIN_EMAILS); sin respuesta, no. */
export async function puedeEmpezarDeCero(): Promise<boolean> {
  const r = await llamar<{ ok: boolean; puede: boolean }>('/api/admin/empezar-de-cero/puede')
  return Boolean(r?.ok && r.puede === true)
}

/** Pura: las claves de un almacén que hay que borrar (todas menos los interruptores de la app). */
export function clavesParaBorrar(claves: string[]): string[] {
  return claves.filter((clave) => !CLAVES_QUE_SE_QUEDAN.includes(clave))
}

/** Borra lo que guarda el móvil: localStorage, sessionStorage e IndexedDB de la app (menos los interruptores). */
export async function limpiarTodoElMovil(): Promise<void> {
  for (const almacen of [() => window.localStorage, () => window.sessionStorage]) {
    try {
      const a = almacen()
      const claves: string[] = []
      for (let i = 0; i < a.length; i++) {
        const clave = a.key(i)
        if (clave) claves.push(clave)
      }
      for (const clave of clavesParaBorrar(claves)) a.removeItem(clave)
    } catch {
      /* sin almacenamiento: nada que borrar */
    }
  }
  try {
    const bases = (await window.indexedDB.databases?.()) ?? []
    await Promise.all(
      bases.map(
        (b) =>
          new Promise<void>((resolver) => {
            if (!b.name) return resolver()
            const pedido = window.indexedDB.deleteDatabase(b.name)
            pedido.onsuccess = pedido.onerror = pedido.onblocked = () => resolver()
          }),
      ),
    )
  } catch {
    /* IndexedDB no disponible: nada que borrar */
  }
}

/**
 * Pide al servidor empezar de cero y, si va bien, limpia el móvil, cierra la sesión y vuelve a la raíz recargando la app (con la apertura, como la primera vez).
 * Devuelve un texto de error si no se pudo (y entonces no se toca nada del móvil), o null si va bien (la página se recarga).
 */
export async function empezarDeCero(): Promise<string | null> {
  const r = await llamar<{ ok: boolean; error?: string }>('/api/admin/empezar-de-cero', { cuerpo: { confirmar: true } })
  if (!r?.ok) return r?.error ?? 'No se ha podido empezar de cero. Vuelve a probar.'
  try {
    await supabase?.auth.signOut({ scope: 'local' })
  } catch {
    /* sin sesión que cerrar */
  }
  await limpiarTodoElMovil()
  // A la raíz, sin la marca `jutrip:sin-apertura` (ya borrada): la apertura sale como la primera vez.
  window.location.replace('/')
  return null
}
