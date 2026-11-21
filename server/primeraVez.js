/**
 * LAS PREGUNTAS DE LA PRIMERA VEZ (V31). Quien abre JUTRIP por primera vez, sin ningún viaje, contesta (o salta) unas preguntas, UNA sola vez por cuenta. Aquí se guardan SOLO tres cosas, en `viajero_primera_vez`
 * (migración 0089): cada cuánto viaja, con quién suele viajar y el año de nacimiento (opcional). El ritmo y «qué te gusta ver» de la pregunta 3 NO se guardan: si llegan, se ignoran. Las respuestas no se usan para
 * los viajes: son datos para JUTRIP.
 *
 *   GET /api/primera-vez   → { ok, hecho, frecuencia, compania, anio_nacimiento, pais_vive }   (hecho: ya las contestó o las saltó)
 *   PUT /api/primera-vez   { frecuencia?, compania?, anio_nacimiento?, pais_vive? }          → { ok: true }   (marca «hecho»; las que no lleguen se quedan vacías)
 *   PUT /api/primera-vez/pais   { pais_vive }   (V35B, desde Ajustes: solo el país; null lo quita)   → { ok: true, guardado }   (sin la columna de la 0091: ok y guardado false)
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
    pais_vive: limpiarPais(c.pais_vive),
  }
}

/** (V35B) El país donde vive: código de 2 letras (se guarda en mayúsculas); cualquier otra cosa, vacío. Nunca una dirección IP ni un lugar. */
export const limpiarPais = (valor) => (typeof valor === 'string' && /^[A-Za-z]{2}$/.test(valor.trim()) ? valor.trim().toUpperCase() : null)

const faltaLaTabla = (error) => Boolean(error) && (error.code === '42P01' || error.code === 'PGRST205' || /does not exist|schema cache|Could not find the table/i.test(String(error.message ?? '')))
/** (V35B) La columna `pais_vive` aún no existe (la migración 0091 sin aplicar): se sigue sin ella. */
const faltaLaColumna = (error) => Boolean(error) && (error.code === '42703' || error.code === 'PGRST204' || (/pais_vive/i.test(String(error.message ?? '')) && /column|schema cache|does not exist/i.test(String(error.message ?? ''))))

export function crearServicioPrimeraVez({ admin }) {
  return {
    async leer(usuario) {
      if (!admin) return { estado: 503, cuerpo: { ok: false } }
      let { data, error } = await admin.from('viajero_primera_vez').select('frecuencia,compania,anio_nacimiento,hecho_en,pais_vive').eq('user_id', usuario.id).maybeSingle()
      if (error && faltaLaColumna(error)) ({ data, error } = await admin.from('viajero_primera_vez').select('frecuencia,compania,anio_nacimiento,hecho_en').eq('user_id', usuario.id).maybeSingle())
      if (error) {
        if (!faltaLaTabla(error)) console.error('[primera-vez]', error.message)
        return { estado: 503, cuerpo: { ok: false } }
      }
      return { estado: 200, cuerpo: { ok: true, hecho: Boolean(data), frecuencia: data?.frecuencia ?? null, compania: data?.compania ?? null, anio_nacimiento: data?.anio_nacimiento ?? null, pais_vive: data?.pais_vive ?? null } }
    },
    async guardar(usuario, cuerpo) {
      if (!admin) return { estado: 503, cuerpo: { ok: false } }
      const fila = { user_id: usuario.id, ...limpiarRespuestas(cuerpo), hecho_en: new Date().toISOString() }
      let { error } = await admin.from('viajero_primera_vez').upsert(fila, { onConflict: 'user_id' })
      // Sin la columna nueva (0091 sin aplicar): se guarda lo demás y el país se ignora (las preguntas no se repiten).
      if (error && faltaLaColumna(error)) {
        const { pais_vive: _pais, ...sinPais } = fila
        ;({ error } = await admin.from('viajero_primera_vez').upsert(sinPais, { onConflict: 'user_id' }))
      }
      if (error) {
        if (!faltaLaTabla(error)) console.error('[primera-vez]', error.message)
        return { estado: 503, cuerpo: { ok: false } }
      }
      return { estado: 200, cuerpo: { ok: true } }
    },
    /** (V35B) Cambiar SOLO el país (desde Ajustes), sin tocar lo demás que contestó. Sin la columna, responde ok sin guardar. */
    async guardarPais(usuario, cuerpo) {
      if (!admin) return { estado: 503, cuerpo: { ok: false } }
      const pais = limpiarPais(cuerpo?.pais_vive)
      const { data: ya, error: errorLeer } = await admin.from('viajero_primera_vez').select('user_id').eq('user_id', usuario.id).maybeSingle()
      if (errorLeer) {
        if (!faltaLaTabla(errorLeer)) console.error('[primera-vez]', errorLeer.message)
        return { estado: 503, cuerpo: { ok: false } }
      }
      const consulta = ya
        ? admin.from('viajero_primera_vez').update({ pais_vive: pais }).eq('user_id', usuario.id)
        : admin.from('viajero_primera_vez').upsert({ user_id: usuario.id, pais_vive: pais, hecho_en: new Date().toISOString() }, { onConflict: 'user_id' })
      const { error } = await consulta
      if (error) {
        if (faltaLaColumna(error)) return { estado: 200, cuerpo: { ok: true, guardado: false } }
        if (!faltaLaTabla(error)) console.error('[primera-vez]', error.message)
        return { estado: 503, cuerpo: { ok: false } }
      }
      return { estado: 200, cuerpo: { ok: true, guardado: true } }
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
  app.get('/api/primera-vez/pais', conUsuario(async (u) => {
    const r = await servicio.leer(u)
    return r.estado === 200 ? { estado: 200, cuerpo: { ok: true, pais_vive: r.cuerpo.pais_vive ?? null } } : r
  }))
  app.put('/api/primera-vez/pais',conUsuario((u, req) => servicio.guardarPais(u, req.body)))
}
