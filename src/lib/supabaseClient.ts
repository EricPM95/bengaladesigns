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
export const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null
