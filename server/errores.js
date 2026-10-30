/**
 * LOS ERRORES DE PANTALLA (10S2): cuando a alguien le sale «Algo ha ido mal» (ErrorBoundary), la app avisa aquí de QUÉ ha fallado y EN QUÉ pantalla, para que la próxima vez se vea sin tener que reproducirlo.
 *   POST /api/error-pantalla   cuerpo { pantalla, mensaje, pila, componentes, ruta, version }
 * Se guarda en la tabla `errores_pantalla` (supabase/migrations/0068_errores_de_pantalla.sql; sin la clave de servicio no se guarda ahí) y SIEMPRE se escribe una línea `[error-pantalla]` en el registro
 * del servidor (en Vercel: Logs). SIN DATOS PRIVADOS: no se guarda quién es (ni id, ni email, ni IP), se recortan los textos y se tachan los correos, los tokens y las claves.
 * Responde 202 siempre (un aviso de error nunca debe dar otro error) y se frena solo: como mucho 30 avisos por minuto en total y 5 por minuto y pantalla iguales.
 */

const MAX = { pantalla: 120, mensaje: 500, pila: 2500, componentes: 2500, ruta: 120, version: 40, navegador: 200 }
const POR_MINUTO_TOTAL = 30
const POR_MINUTO_IGUALES = 5

/** Tacha lo que podría ser privado: correos, tokens (JWT), claves `sb_…`/`sk-…`, identificadores largos con forma de UUID y las partes de una dirección que parecen un código/token. Pura. */
export function limpiarTexto(valor, max = 500) {
  if (valor == null) return ''
  let t = String(valor)
  t = t.replace(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g, '<correo>')
  t = t.replace(/eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}/g, '<token>')
  t = t.replace(/\b(?:sb_secret|sb_publishable|sk|pk|rk|whsec)_[A-Za-z0-9_-]{8,}/g, '<clave>')
  t = t.replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, '<id>')
  // La vuelta de Google (`#access_token=…&refresh_token=…`) entera, y cualquier parámetro con llave: NUNCA se guarda la dirección con llaves.
  t = t.replace(/#[^\s)'"]*(?:token|code|key|jwt)[^\s)'"]*=[^\s)'"]*/gi, '#<tachado>')
  t = t.replace(/([?&#](?:code|token|access_token|refresh_token|provider_token|provider_refresh_token|id_token|key|apikey|invitacion|codigo)=)[^&\s#)'"]+/gi, '$1<tachado>')
  return t.replace(/\s+/g, ' ').trim().slice(0, max)
}

/** Pura: del cuerpo que llega (sea lo que sea) saca el registro que se guarda, ya limpio y recortado. */
export function normalizarError(cuerpo, navegador = '') {
  const b = cuerpo && typeof cuerpo === 'object' ? cuerpo : {}
  // La pila y los componentes conservan los saltos de línea contados como espacio: basta para leerlas y evita guardar texto largo.
  return {
    pantalla: limpiarTexto(b.pantalla, MAX.pantalla) || 'desconocida',
    mensaje: limpiarTexto(b.mensaje, MAX.mensaje) || '(sin mensaje)',
    pila: limpiarTexto(b.pila, MAX.pila),
    componentes: limpiarTexto(b.componentes, MAX.componentes),
    ruta: limpiarTexto(String(b.ruta ?? '').split(/[?#]/)[0], MAX.ruta),
    version: limpiarTexto(b.version, MAX.version),
    navegador: limpiarTexto(navegador, MAX.navegador),
  }
}

/** El freno: cuenta avisos por minuto. Devuelve true si este se guarda. */
export function crearFreno(ahora = () => Date.now()) {
  let ventana = []
  const iguales = new Map()
  return (clave) => {
    const t = ahora()
    ventana = ventana.filter((x) => t - x < 60000)
    if (ventana.length >= POR_MINUTO_TOTAL) return false
    const previos = (iguales.get(clave) ?? []).filter((x) => t - x < 60000)
    if (previos.length >= POR_MINUTO_IGUALES) {
      iguales.set(clave, previos)
      return false
    }
    previos.push(t)
    iguales.set(clave, previos)
    ventana.push(t)
    if (iguales.size > 200) for (const [k, v] of iguales) if (!v.some((x) => t - x < 60000)) iguales.delete(k)
    return true
  }
}

/**
 * Registra la ruta. `servicio` es el cliente de Supabase con la clave de servicio (o null: solo se escribe en el registro del servidor); `consola` se puede cambiar para las pruebas.
 */
export function registrarRutaErrores(app, { servicio = null, consola = console, ahora = () => Date.now() } = {}) {
  const frena = crearFreno(ahora)
  app.post('/api/error-pantalla', async (req, res) => {
    // Un aviso de error nunca da otro error: pase lo que pase se contesta 202.
    try {
      const registro = normalizarError(req.body, req.get('user-agent') ?? '')
      if (!frena(`${registro.pantalla}|${registro.mensaje.slice(0, 80)}`)) return res.status(202).json({ ok: true, guardado: false })
      consola.error('[error-pantalla]', JSON.stringify({ pantalla: registro.pantalla, mensaje: registro.mensaje, ruta: registro.ruta, version: registro.version, pila: registro.pila.slice(0, 600) }))
      let guardado = false
      if (servicio) {
        const { error } = await servicio.from('errores_pantalla').insert(registro)
        if (error) consola.error('[error-pantalla] no se pudo guardar en la tabla:', error.message)
        else guardado = true
      }
      return res.status(202).json({ ok: true, guardado })
    } catch (e) {
      try {
        consola.error('[error-pantalla] fallo al registrar:', e?.message ?? e)
      } catch {
        /* nada más que hacer */
      }
      return res.status(202).json({ ok: true, guardado: false })
    }
  })
}
