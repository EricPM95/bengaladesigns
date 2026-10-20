/**
 * LOS AVISOS DE DESTINOS NUEVOS (Tanda 10, la primera pantalla). Quien escribe un destino que aún no tenemos puede dejar su email para que le avisemos cuando llegue (tabla
 * `avisos_destino`, migración 0028). Solo el servidor, con su clave de servicio, toca la tabla; el móvil nunca la ve.
 *
 *   POST /api/avisos-destino          { destino, email, idioma? }  → { ok: true }   (uno por email y destino: pedirlo otra vez no duplica y también da ok)
 *   GET  /api/admin/destinos-pedidos  → { ok, destinos: [{ destino, veces }] }       (solo la cuenta de administrador)
 *
 * Sin la tabla (la migración aún no está aplicada) o sin la clave de servicio, responde 503 con el mismo texto que enseña la app: «No hemos podido guardarlo. Inténtalo más tarde.»
 * Hace falta una sesión (la de la cuenta o la anónima de siempre) para que no se pueda llenar la tabla desde fuera.
 */
import { quienEs, tokenDe } from './cuentas.js'
import { esAdmin } from './logros/rutas.js'

export const TEXTO_NO_GUARDADO = 'No hemos podido guardarlo. Inténtalo más tarde.'

/** Sin mayúsculas, sin tildes y sin espacios de más: la forma en que se comparan dos destinos o dos emails. */
export const limpiar = (t) =>
  String(t ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()

const EMAIL = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/

/** Valida lo que llega del móvil. Devuelve { ok: true, fila } o { ok: false, error }. */
export function validarPeticion(cuerpo) {
  const destino = String(cuerpo?.destino ?? '').replace(/\s+/g, ' ').trim()
  const email = String(cuerpo?.email ?? '').trim()
  if (destino.length < 2 || destino.length > 80) return { ok: false, error: 'Escribe el destino.' }
  if (email.length < 5 || email.length > 254 || !EMAIL.test(email)) return { ok: false, error: 'Escribe un email que funcione.' }
  const idioma = /^[a-z]{2}(-[A-Za-z]{2,4})?$/.test(String(cuerpo?.idioma ?? '')) ? String(cuerpo.idioma) : 'es'
  return { ok: true, fila: { destino, destino_norm: limpiar(destino), email, email_norm: limpiar(email), idioma } }
}

/** ¿El error de la base de datos es «la tabla no existe»? (Postgres 42P01 o el 404 de PostgREST, PGRST205.) */
export const faltaLaTabla = (error) => Boolean(error) && (error.code === '42P01' || error.code === 'PGRST205' || /does not exist|schema cache|Could not find the table/i.test(String(error.message ?? '')))

export function crearServicioAvisosDestino({ admin }) {
  return {
    /** Guarda el aviso. Uno por email y destino: si ya estaba, no hace nada y también da ok. */
    async pedir(usuario, cuerpo) {
      if (!admin) return { estado: 503, cuerpo: { ok: false, error: TEXTO_NO_GUARDADO } }
      const v = validarPeticion(cuerpo)
      if (!v.ok) return { estado: 400, cuerpo: { ok: false, error: v.error } }
      const { error } = await admin.from('avisos_destino').upsert({ ...v.fila, user_id: usuario?.id ?? null }, { onConflict: 'email_norm,destino_norm', ignoreDuplicates: true })
      if (error) {
        if (!faltaLaTabla(error)) console.error('[avisos-destino]', error.message)
        return { estado: 503, cuerpo: { ok: false, error: TEXTO_NO_GUARDADO } }
      }
      return { estado: 200, cuerpo: { ok: true } }
    },
    /** Qué destinos pide la gente y cuántas veces (de más a menos). El nombre que sale es el que más se ha escrito. */
    async pedidos() {
      if (!admin) return { estado: 503, cuerpo: { ok: false, error: 'Falta la clave de servicio de Supabase.' } }
      const { data, error } = await admin.from('avisos_destino').select('destino,destino_norm').limit(20000)
      if (error) return { estado: 200, cuerpo: { ok: true, destinos: [], sin_tabla: faltaLaTabla(error), error: faltaLaTabla(error) ? 'La migración 0028 aún no está aplicada.' : error.message } }
      const porDestino = new Map()
      for (const f of data ?? []) {
        const x = porDestino.get(f.destino_norm) ?? { veces: 0, escritos: new Map() }
        x.veces += 1
        x.escritos.set(f.destino, (x.escritos.get(f.destino) ?? 0) + 1)
        porDestino.set(f.destino_norm, x)
      }
      const destinos = [...porDestino.values()]
        .map((x) => ({ destino: [...x.escritos.entries()].sort((a, b) => b[1] - a[1])[0][0], veces: x.veces }))
        .sort((a, b) => b.veces - a.veces || a.destino.localeCompare(b.destino, 'es'))
      return { estado: 200, cuerpo: { ok: true, destinos } }
    },
  }
}

/** Un máximo de peticiones por dirección y hora (en memoria): frena a quien intente llenar la tabla. */
function limitador(maximo = 30, ventanaMs = 3600_000) {
  const cuentas = new Map()
  return (clave, ahora = Date.now()) => {
    const x = cuentas.get(clave)
    if (!x || ahora - x.desde > ventanaMs) {
      cuentas.set(clave, { desde: ahora, n: 1 })
      return true
    }
    x.n += 1
    return x.n <= maximo
  }
}

export function registrarRutasAvisosDestino(app, { admin, env = process.env }) {
  const servicio = crearServicioAvisosDestino({ admin })
  const permitido = limitador()
  const responder = (res, r) => res.status(r.estado).json(r.cuerpo)

  app.post('/api/avisos-destino', async (req, res) => {
    try {
      if (!admin) return responder(res, await servicio.pedir(null, req.body))
      if (!permitido(String(req.ip ?? req.headers?.['x-forwarded-for'] ?? 'x'))) return res.status(429).json({ ok: false, error: TEXTO_NO_GUARDADO })
      const usuario = await quienEs(admin, tokenDe(req))
      if (!usuario) return res.status(401).json({ ok: false, error: TEXTO_NO_GUARDADO })
      return responder(res, await servicio.pedir(usuario, req.body))
    } catch (error) {
      console.error('[avisos-destino]', error)
      return res.status(503).json({ ok: false, error: TEXTO_NO_GUARDADO })
    }
  })

  app.get('/api/admin/destinos-pedidos', async (req, res) => {
    try {
      if (!admin) return responder(res, await servicio.pedidos())
      const usuario = await quienEs(admin, tokenDe(req))
      if (!usuario) return res.status(401).json({ ok: false, error: 'Tu sesión no es válida. Entra otra vez.' })
      if (!esAdmin(usuario, env)) return res.status(403).json({ ok: false, error: 'Solo para el administrador.' })
      return responder(res, await servicio.pedidos())
    } catch (error) {
      console.error('[avisos-destino]', error)
      return res.status(500).json({ ok: false, error: 'No se ha podido hacer. Vuelve a probar.' })
    }
  })
}
