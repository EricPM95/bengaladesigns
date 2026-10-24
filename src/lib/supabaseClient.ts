import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Faltan VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY — la persistencia en la nube estará desactivada, la app sigue funcionando solo en memoria.')
}

/**
 * null cuando faltan las credenciales — todo el código que la usa (tripPersistence.ts) comprueba
 * esto y se convierte en no-op, así la app sigue funcionando en memoria sin romperse.
 */
// Tanda 10G, la sesión abierta: se dice EXPLÍCITO lo que antes eran valores por defecto (no cambia nada para quien ya tiene sesión). La sesión se guarda en el móvil (`persistSession`, en localStorage) y se renueva sola
// (`autoRefreshToken`); dura hasta que el viajero la cierra con [Cerrar sesión] (Supabase no la caduca por sí mismo: ver «Time-box / Inactivity timeout» en el panel, que deben estar apagados).
export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storage: typeof window !== 'undefined' ? window.localStorage : undefined } })
    : null

// Pide al navegador que NO borre lo guardado de la app cuando le falte espacio (Safari borra a los 7 días lo de una web que no se usa; la app instalada en la pantalla de inicio está libre de eso). Mejor esfuerzo: si no lo concede, no pasa nada.
if (typeof navigator !== 'undefined' && navigator.storage?.persist) void navigator.storage.persist().catch(() => undefined)
