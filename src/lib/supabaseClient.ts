import { createClient } from '@supabase/supabase-js'
import { contarLlamadasAlServidor, crearFetchContado } from '../dev/contadorSupabase'

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
// (V36) Solo en desarrollo: el contador de peticiones (`window.__supabaseContador`, un aviso en la consola cada minuto). En producción `import.meta.env.DEV` es `false` y nada de esto entra en el paquete.
const fetchContado = import.meta.env.DEV ? crearFetchContado() : undefined
if (import.meta.env.DEV) contarLlamadasAlServidor()
export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, { ...(fetchContado ? { global: { fetch: fetchContado } } : {}), auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storage: typeof window !== 'undefined' ? window.localStorage : undefined } })
    : null

// Pide al navegador que NO borre lo guardado de la app cuando le falte espacio (Safari borra a los 7 días lo de una web que no se usa; la app instalada en la pantalla de inicio está libre de eso). Mejor esfuerzo: si no lo concede, no pasa nada.
if (typeof navigator !== 'undefined' && navigator.storage?.persist) void navigator.storage.persist().catch(() => undefined)

/**
 * (V36) QUIÉN SOY, SIN SALIR A LA RED. `supabase.auth.getUser()` hace una petición a Supabase CADA vez (para comprobar la sesión en el servidor); se llamaba en cada recarga de lo suyo del viaje, los gastos y las reservas. La sesión ya está
 * guardada en el móvil (`getSession` la lee de ahí y la renueva sola cuando caduca), y el servidor vuelve a comprobarla en cada consulta de todos modos. Mismo resultado que `getUser()`: `{ data: { user } }`.
 */
export async function usuarioLocal(): Promise<{ data: { user: import('@supabase/supabase-js').User | null } }> {
  if (!supabase) return { data: { user: null } }
  const { data } = await supabase.auth.getSession()
  return { data: { user: data.session?.user ?? null } }
}
