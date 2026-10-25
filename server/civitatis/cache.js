/**
 * La caché de las respuestas de la API de consulta (parte 1): en memoria y en Supabase (tabla `civitatis_cache`, migración 0022, sin aplicar), como las fotos de Unsplash.
 * Para no pedir lo mismo cada vez, no acercarnos al límite de peticiones y que la app vaya rápida. Cuánto vive cada cosa está en `data/civitatis/ajustes.json › ttl_segundos`
 * (4 horas como mucho: tope duro, ver TTL_MAXIMO_SEGUNDOS).
 *
 *   · Primero memoria, luego Supabase, luego la API. Lo que llega de la API se guarda en las dos.
 *   · Si la API falla pero hay algo guardado que ya caducó, se usa eso (marcado `viejo: true`) SOLO si lo guardado tiene 4 horas o menos (Tanda 10O2: lo que pidió el proveedor es no guardar más de 4 horas, y enseñar algo
 *     más viejo es guardarlo). Si tiene más, o no hay nada, se devuelve el fallo y la app hace lo de hoy, con los datos de roma.json.
 *   · `fresco: true` se salta la caché (por ejemplo, al abrir el selector de hora: las plazas tienen que estar al día), pero lo que llega sí se guarda.
 *   · Dos peticiones iguales a la vez comparten la misma respuesta.
 * Sin Supabase (o sin la tabla), todo sigue funcionando solo con la memoria.
 */

/**
 * TOPE DURO: nada se guarda más de 4 horas (14400 s), pase lo que pase en `ajustes.json`. Lo pidió el proveedor de la API el 19-oct-2026.
 * Un valor mayor (o raro) se recorta aquí; el calendario (3600 s) queda por debajo y no se toca.
 */
export const TTL_MAXIMO_SEGUNDOS = 14400
export const ttlConTope = (ttlSegundos) => {
  const n = Number(ttlSegundos)
  return Number.isFinite(n) ? Math.min(Math.max(0, n), TTL_MAXIMO_SEGUNDOS) : TTL_MAXIMO_SEGUNDOS
}

export function crearCache({ admin = null, ahora = () => Date.now() } = {}) {
  const memoria = new Map() // clave → { valor, caduca }
  const enVuelo = new Map() // clave → Promise
  const estadisticas = { aciertosMemoria: 0, aciertosBase: 0, fallos: 0, viejos: 0 }
  let baseRota = false // (la tabla no existe o no se puede usar: no se insiste)

  async function leerBase(clave) {
    if (!admin || baseRota) return null
    try {
      const { data, error } = await admin.from('civitatis_cache').select('valor, caduca_en').eq('clave', clave).maybeSingle()
      if (error) {
        baseRota = true
        return null
      }
      return data ? { valor: data.valor, caduca: Date.parse(data.caduca_en) } : null
    } catch {
      baseRota = true
      return null
    }
  }

  async function escribirBase(clave, valor, caduca) {
    if (!admin || baseRota) return
    try {
      const { error } = await admin.from('civitatis_cache').upsert({ clave, valor, caduca_en: new Date(caduca).toISOString() }, { onConflict: 'clave' })
      if (error) baseRota = true
    } catch {
      baseRota = true
    }
  }

  /**
   * @param {string} clave
   * @param {number} ttlSegundos
   * @param {() => Promise<{ ok: boolean, datos?: any, motivo?: string }>} cargar  pide la API
   * @param {{ fresco?: boolean }} [opciones]
   * @returns {Promise<{ ok: true, datos: any, viejo?: boolean, origen: 'memoria'|'base'|'api'|'viejo' } | { ok: false, motivo: string }>}
   */
  async function obtener(clave, ttlSegundos, cargar, { fresco = false } = {}) {
    const t = ahora()
    if (!fresco) {
      const enMemoria = memoria.get(clave)
      if (enMemoria && enMemoria.caduca > t) {
        estadisticas.aciertosMemoria++
        return { ok: true, datos: enMemoria.valor, origen: 'memoria' }
      }
      const enBase = await leerBase(clave)
      if (enBase && enBase.caduca > t) {
        memoria.set(clave, enBase)
        estadisticas.aciertosBase++
        return { ok: true, datos: enBase.valor, origen: 'base' }
      }
    }
    const llave = `${fresco ? 'fresco' : 'normal'}|${clave}`
    if (!enVuelo.has(llave)) {
      enVuelo.set(
        llave,
        (async () => {
          estadisticas.fallos++
          const respuesta = await cargar()
          if (respuesta?.ok) {
            const caduca = ahora() + ttlConTope(ttlSegundos) * 1000
            memoria.set(clave, { valor: respuesta.datos, caduca })
            void escribirBase(clave, respuesta.datos, caduca)
            return { ok: true, datos: respuesta.datos, origen: 'api' }
          }
          // La API ha fallado: lo viejo, si hay y si tiene 4 horas o menos desde que se guardó (se guardó en `caduca - ttl`).
          const viejoEnMemoria = memoria.get(clave)
          const viejo = viejoEnMemoria ?? (await leerBase(clave))
          const guardadoEn = viejo ? viejo.caduca - ttlConTope(ttlSegundos) * 1000 : 0
          if (viejo && ahora() - guardadoEn <= TTL_MAXIMO_SEGUNDOS * 1000) {
            estadisticas.viejos++
            return { ok: true, datos: viejo.valor, viejo: true, origen: 'viejo' }
          }
          return { ok: false, motivo: respuesta?.motivo ?? 'no_disponible' }
        })().finally(() => enVuelo.delete(llave)),
      )
    }
    return enVuelo.get(llave)
  }

  return { obtener, estadisticas, vaciarMemoria: () => memoria.clear(), tamano: () => memoria.size }
}
