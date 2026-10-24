import { supabase } from './supabaseClient'

/**
 * ¿YA HA VISTO LA PELÍCULA DEL PASE? (Tanda 10I) La primera vez que se abre el pase sale la película entera; después, directa al final. Se guarda en la CUENTA (en los datos de la persona, para que no
 * vuelva a salir en otro móvil) y, sin sesión, en el móvil. Siempre se guarda también en el móvil: si la cuenta no contesta a tiempo, no se vuelve a enseñar entera.
 */
const CLAVE = 'trazo:pelicula-pase-vista'
const EN_LA_CUENTA = 'pelicula_pase_vista'

const enElMovil = (): boolean => {
  try {
    return window.localStorage.getItem(CLAVE) === '1'
  } catch {
    return false
  }
}

/** Pura: ¿dice la cuenta que ya la vio? (los datos de la persona de Supabase) */
export const laCuentaDiceQueLaVio = (usuario: { user_metadata?: Record<string, unknown> | null } | null | undefined): boolean => usuario?.user_metadata?.[EN_LA_CUENTA] === true

export async function peliculaYaVista(): Promise<boolean> {
  if (enElMovil()) return true
  if (!supabase) return false
  try {
    const { data } = await supabase.auth.getSession()
    if (laCuentaDiceQueLaVio(data.session?.user)) {
      try {
        window.localStorage.setItem(CLAVE, '1')
      } catch {
        /* sin almacenamiento */
      }
      return true
    }
  } catch {
    /* sin conexión: se mira solo el móvil */
  }
  return false
}

export async function marcarPeliculaVista(): Promise<void> {
  try {
    window.localStorage.setItem(CLAVE, '1')
  } catch {
    /* sin almacenamiento: se guarda solo en la cuenta */
  }
  if (!supabase) return
  try {
    const { data } = await supabase.auth.getSession()
    if (data.session && !laCuentaDiceQueLaVio(data.session.user)) await supabase.auth.updateUser({ data: { [EN_LA_CUENTA]: true } })
  } catch {
    /* la cuenta no contesta: queda guardado en el móvil */
  }
}

/** Solo desarrollo y pruebas: olvida que la vio (para ver la película otra vez entera). */
export function olvidarPeliculaVista(): void {
  try {
    window.localStorage.removeItem(CLAVE)
  } catch {
    /* nada que olvidar */
  }
}
