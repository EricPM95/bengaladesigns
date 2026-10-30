/**
 * «PROPÓN UN SITIO» (10S5): el viajero escribe un sitio que no está en JUTRIP y lo manda para que lo revisemos.
 *   POST /api/proponer-sitio   cuerpo { nombre, comentario?, destino?, origen? }
 * Se guarda en la tabla `propuestas_de_sitio` (supabase/migrations/0069_propuestas_de_sitio.sql) con el nombre, el comentario, el destino y la fecha (la pone la base). SIEMPRE se escribe también una línea
 * `[propon-sitio]` en el registro del servidor (en Vercel: Logs). SIN DATOS PRIVADOS: no se guarda quién es (ni id, ni email, ni IP) y se tachan correos, tokens y claves (`limpiarTexto`, la misma de los avisos
 * de error). Respuestas: 200 {ok:true, guardado:true|false} si el nombre es válido (guardado:false = solo quedó en el registro del servidor: sin clave de servicio o sin aplicar la migración 0069);
 * 400 si falta el nombre; 429 si manda demasiados seguidos. Se frena solo: 30 por minuto en total y 5 por minuto del mismo nombre.
 */
import { limpiarTexto, crearFreno } from './errores.js'

const MAX = { nombre: 120, comentario: 1000, destino: 80, origen: 60 }
const MIN_NOMBRE = 2

/** Pura: del cuerpo que llega saca el registro que se guarda (limpio y recortado), o null si no tiene un nombre válido. */
export function normalizarPropuesta(cuerpo) {
  const b = cuerpo && typeof cuerpo === 'object' ? cuerpo : {}
  const nombre = limpiarTexto(b.nombre, MAX.nombre)
  if (nombre.length < MIN_NOMBRE) return null
  return {
    nombre,
    comentario: limpiarTexto(b.comentario, MAX.comentario),
    destino: limpiarTexto(b.destino, MAX.destino),
    origen: limpiarTexto(b.origen, MAX.origen),
  }
}

export function registrarRutaPropuestasSitio(app, { servicio = null, consola = console, ahora = () => Date.now() } = {}) {
  const frena = crearFreno(ahora)
  app.post('/api/proponer-sitio', async (req, res) => {
    try {
      const registro = normalizarPropuesta(req.body)
      if (!registro) return res.status(400).json({ ok: false, error: 'Falta el nombre del sitio.' })
      // (El freno de los avisos de error: 30 en total y 5 con el mismo nombre por minuto.)
      if (!frena(registro.nombre.toLowerCase())) return res.status(429).json({ ok: false, error: 'Demasiadas propuestas seguidas. Inténtalo en un minuto.' })
      consola.log('[propon-sitio]', JSON.stringify(registro))
      let guardado = false
      if (servicio) {
        const { error } = await servicio.from('propuestas_de_sitio').insert(registro)
        if (error) consola.error('[propon-sitio] no se pudo guardar en la tabla:', error.message)
        else guardado = true
      }
      return res.status(200).json({ ok: true, guardado })
    } catch (e) {
      try {
        consola.error('[propon-sitio] fallo:', e?.message ?? e)
      } catch {
        /* nada más que hacer */
      }
      return res.status(500).json({ ok: false, error: 'No hemos podido guardarlo.' })
    }
  })
}
