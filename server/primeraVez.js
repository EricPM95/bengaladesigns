/**
 * LAS PREGUNTAS DE LA PRIMERA VEZ (V31). Quien abre JUTRIP por primera vez, sin ningún viaje, contesta (o salta) unas preguntas, UNA sola vez por cuenta. Aquí se guardan SOLO tres cosas, en `viajero_primera_vez`
 * (migración 0089): cada cuánto viaja, con quién suele viajar y el año de nacimiento (opcional). El ritmo y «qué te gusta ver» de la pregunta 3 NO se guardan: si llegan, se ignoran. Las respuestas no se usan para
 * los viajes: son datos para JUTRIP.
 *
 *   GET /api/primera-vez   → { ok, hecho, frecuencia, compania, anio_nacimiento }   (hecho: ya las contestó o las saltó)
 *   PUT /api/primera-vez   { frecuencia?, compania?, anio_nacimiento? }              → { ok: true }   (marca «hecho»; las que no lleguen se quedan vacías)
 *
 * Solo el servidor, con su clave de servicio, toca la tabla; hace falta una sesión. Sin la tabla (migración sin aplicar) responde 503 y la app sigue como si no hubiera preguntas (no se queda atascada).
 */
import { quienEs, tokenDe } from './cuentas.js'

export const FRECUENCIAS = ['una_vez_al_anio', 'dos_o_tres', 'cuatro_o_mas']
export const COMPANIAS = ['a_mi_aire', 'pareja', 'familia', 'amigos']
export const ANIO_MINIMO = 1920

/** Valida lo que llega del móvil: solo los tres datos; cualquier otra cosa (el ritmo, los gustos) se descarta. Lo que no es válido se deja vacío. */
export function limpiarRespuestas(cuerpo, anioActual = new Date().getFullYear()) {
  const c = cuerpo && typeof cuerpo === 'object' ? cuerpo : {}
  const anio = Number(c.anio_nacimiento)
  return {
    frecuencia: FRECUENCIAS.includes(c.frecuencia) ? c.frecuencia : null,
    compania: COMPANIAS.includes(c.compania) ? c.compania : null,
    anio_nacimiento: Number.isInteger(anio) && anio >= ANIO_MINIMO && anio <= anioActual ? anio : null,
  }
}

const faltaLaTabla = (error) => Boolean(error) && (error.code === '42P01' || error.code === 'PGRST205' || /does not exist|schema cache|Could not find the table/i.test(String(error.message ?? '')))

export function crearServicioPrimeraVez({ admin }) {
  return {
    async leer(usuario) {
      if (!admin) return { estado: 503, cuerpo: { ok: false } }
      const { data, error } = await admin.from('viajero_primera_vez').select('frecuencia,compania,anio_nacimiento,hecho_en').eq('user_id', usuario.id).maybeSingle()
      if (error) {
        if (!faltaLaTabla(error)) console.error('[primera-vez]', error.message)
        return { estado: 503, cuerpo: { ok: false } }
      }
      return { estado: 200, cuerpo: { ok: true, hecho: Boolean(data), frecuencia: data?.frecuencia ?? null, compania: data?.compania ?? null, anio_nacimiento: data?.anio_nacimiento ?? null } }
    },
    async guardar(usuario, cuerpo) {
      if (!admin) return { estado: 503, cuerpo: { ok: false } }
      const fila = { user_id: usuario.id, ...limpiarRespuestas(cuerpo), hecho_en: new Date().toISOString() }
      const { error } = await admin.from('viajero_primera_vez').upsert(fila, { onConflict: 'user_id' })
      if (error) {
        if (!faltaLaTabla(error)) console.error('[primera-vez]', error.message)
        return { estado: 503, cuerpo: { ok: false } }
      }
      return { estado: 200, cuerpo: { ok: true } }
    },
  }
}

export function registrarRutasPrimeraVez(app, { admin }) {
  const servicio = crearServicioPrimeraVez({ admin })
  const responder = (res, r) => res.status(r.estado).json(r.cuerpo)
  const conUsuario = (accion) => async (req, res) => {
    try {
      if (!admin) return res.status(503).json({ ok: false })
      const usuario = await quienEs(admin, tokenDe(req))
      if (!usuario) return res.status(401).json({ ok: false })
      return responder(res, await accion(usuario, req))
    } catch (error) {
      console.error('[primera-vez]', error)
      return res.status(503).json({ ok: false })
    }
  }
  app.get('/api/primera-vez', conUsuario((u) => servicio.leer(u)))
  app.put('/api/primera-vez', conUsuario((u, req) => servicio.guardar(u, req.body)))
}
