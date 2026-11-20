/**
 * EL GUARDIÁN DEL PANEL (V33): el mismo de las demás rutas /api/admin/* (server/avisosViajeros.js, server/logros/rutas.js).
 *   sin clave de servicio → 503 · sin sesión válida → 401 · sesión que no es de administrador (LOGROS_ADMIN_EMAILS / LOGROS_ADMIN_IDS) o anónima → 403.
 * La comprobación es SIEMPRE aquí, en el servidor. Nada de lo que llega en el cuerpo o en la dirección decide quién es administrador.
 */
import { quienEs, tokenDe } from '../cuentas.js'
import { esAdmin } from '../logros/rutas.js'

export function crearGuardian({ admin, env = process.env, consola = console }) {
  return (manejador) => async (req, res) => {
    try {
      if (!admin) return res.status(503).json({ ok: false, error: 'Falta la clave de servicio de Supabase.' })
      let usuario = null
      try {
        usuario = await quienEs(admin, tokenDe(req))
      } catch {
        usuario = null
      }
      if (!usuario) return res.status(401).json({ ok: false, error: 'Tu sesión no es válida. Entra otra vez.' })
      if (!esAdmin(usuario, env)) return res.status(403).json({ ok: false, error: 'Solo para el administrador.' })
      return await manejador(req, res, usuario)
    } catch (e) {
      try {
        consola.error('[panel]', e?.message ?? e)
      } catch {
        /* nada más que hacer */
      }
      return res.status(500).json({ ok: false, error: 'No hemos podido hacerlo. Inténtalo más tarde.' })
    }
  }
}

/** Llama a una función SQL del panel (solo con la clave de servicio). Si falla, lanza (el guardián lo convierte en 500 sin enseñar detalles). */
export async function rpc(admin, nombre, args = {}) {
  const { data, error } = await admin.rpc(nombre, args)
  if (error) throw new Error(`${nombre}: ${error.message}`)
  return data
}

/** Hoy en la hora del panel (AAAA-MM-DD). */
export const ZONA_PANEL = 'Europe/Madrid'
export const hoyEnPanel = (ahora = new Date(), zona = ZONA_PANEL) => new Intl.DateTimeFormat('en-CA', { timeZone: zona, year: 'numeric', month: '2-digit', day: '2-digit' }).format(ahora)
