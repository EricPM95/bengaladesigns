/**
 * LAS PREGUNTAS DE LA PRIMERA VEZ (V31). Quien abre JUTRIP por primera vez, sin ningún viaje, contesta (o salta) unas preguntas, UNA sola vez por cuenta. Aquí se guardan SOLO tres cosas, en `viajero_primera_vez`
 * (migración 0089): cada cuánto viaja, con quién suele viajar y la franja de edad (opcional; V41, antes el año de nacimiento: el año ya no se pide ni se guarda; la franja viene de la migración 0094). El ritmo y «qué te gusta ver» de la pregunta 3 NO se guardan: si llegan, se ignoran. Las respuestas no se usan para
 * los viajes: son datos para JUTRIP.
 *
 *   GET /api/primera-vez   → { ok, hecho, frecuencia, compania, franja_edad, pais_vive }   (hecho: ya las contestó o las saltó)
 *   PUT /api/primera-vez   { frecuencia?, compania?, franja_edad?, pais_vive? }        → { ok: true }   (marca «hecho»; las que no lleguen se quedan vacías)
 *   GET /api/primera-vez/sueno   (V39) → { ok, sueno: { tipo, nombre, iso } | null, disponible }   (disponible: false = falta la migración 0093)
 *   PUT /api/primera-vez/sueno   { sueno: { tipo: 'pais'|'destino', nombre, iso } | null }   (V39, desde Ajustes: solo el viaje de sus sueños; null lo quita)   → { ok: true, guardado }   (sin las columnas de la 0093: ok y guardado false)
 *   PUT /api/primera-vez/pais   { pais_vive }   (V35B, desde Ajustes: solo el país; null lo quita)   → { ok: true, guardado }   (sin la columna de la 0091: ok y guardado false)
 *
 * Solo el servidor, con su clave de servicio, toca la tabla; hace falta una sesión. Sin la tabla (migración sin aplicar) responde 503 y la app sigue como si no hubiera preguntas (no se queda atascada).
 */
import { quienEs, tokenDe } from './cuentas.js'
import { limpiar } from './avisosDestino.js'
import { franjaDeAnio, franjaDeFila, franjaValida } from './franjaEdad.js'

export const FRECUENCIAS = ['una_vez_al_anio', 'dos_o_tres', 'cuatro_o_mas']
export const COMPANIAS = ['a_mi_aire', 'pareja', 'familia', 'amigos']

/**
 * Valida lo que llega del móvil: solo los tres datos (la edad ahora es una FRANJA, V41); cualquier otra cosa (el ritmo, los gustos) se descarta. Lo que no es válido se deja vacío.
 * Un móvil con la app vieja todavía puede mandar `anio_nacimiento`: se convierte en su franja (con `anioActual`, inyectable) y el año NO se guarda.
 */
export function limpiarRespuestas(cuerpo, anioActual = new Date().getFullYear()) {
  const c = cuerpo && typeof cuerpo === 'object' ? cuerpo : {}
  return {
    frecuencia: FRECUENCIAS.includes(c.frecuencia) ? c.frecuencia : null,
    compania: COMPANIAS.includes(c.compania) ? c.compania : null,
    franja_edad: franjaValida(c.franja_edad) ?? franjaDeAnio(c.anio_nacimiento, anioActual),
    pais_vive: limpiarPais(c.pais_vive),
  }
}

/** (V35B) El país donde vive: código de 2 letras (se guarda en mayúsculas); cualquier otra cosa, vacío. Nunca una dirección IP ni un lugar. */
export const limpiarPais = (valor) => (typeof valor === 'string' && /^[A-Za-z]{2}$/.test(valor.trim()) ? valor.trim().toUpperCase() : null)

/**
 * (V39) EL VIAJE DE SUS SUEÑOS: un país o un destino que le encantaría visitar (opcional, solo uno). Se guarda en columnas de `viajero_primera_vez` (migración 0093): sueno_tipo, sueno_nombre, sueno_iso (país, minúscula),
 * sueno_norm (el nombre sin tildes ni mayúsculas: con él se cuenta y se avisa) y sueno_en (cuándo lo eligió). Cualquier cosa que no encaje, vacío.
 */
export function limpiarSueno(valor) {
  const v = valor && typeof valor === 'object' ? valor : null
  const nombre = String(v?.nombre ?? '').replace(/\s+/g, ' ').trim()
  const iso = String(v?.iso ?? '').trim().toLowerCase()
  if (!v || (v.tipo !== 'pais' && v.tipo !== 'destino') || nombre.length < 2 || nombre.length > 80 || !/^[a-z]{2}$/.test(iso)) return null
  return { tipo: v.tipo, nombre, iso }
}
/** Las columnas de la fila para un sueño (o todas vacías, si no hay). */
export const columnasDeSueno = (sueno, ahora = new Date()) =>
  sueno ? { sueno_tipo: sueno.tipo, sueno_nombre: sueno.nombre, sueno_iso: sueno.iso, sueno_norm: limpiar(sueno.nombre), sueno_en: ahora.toISOString() } : { sueno_tipo: null, sueno_nombre: null, sueno_iso: null, sueno_norm: null, sueno_en: null }
const COLUMNAS_SUENO = ['sueno_tipo', 'sueno_nombre', 'sueno_iso', 'sueno_norm', 'sueno_en']
/** La migración 0093 aún no está aplicada (faltan las columnas del sueño). */
const faltaElSueno = (error) => Boolean(error) && (error.code === '42703' || error.code === 'PGRST204' || (/sueno_/i.test(String(error.message ?? '')) && /column|schema cache|does not exist/i.test(String(error.message ?? ''))))

const faltaLaTabla = (error) => Boolean(error) && (error.code === '42P01' || error.code === 'PGRST205' || /does not exist|schema cache|Could not find the table/i.test(String(error.message ?? '')))
/** (V41) La columna `franja_edad` aún no existe (la migración 0094 sin aplicar): se sigue sin ella y la edad no se guarda. */
const faltaLaFranja = (error) => Boolean(error) && /franja_edad/i.test(String(error.message ?? '')) && /column|schema cache|does not exist/i.test(String(error.message ?? ''))
/** (V35B) La columna `pais_vive` aún no existe (la migración 0091 sin aplicar): se sigue sin ella. */
const faltaLaColumna = (error) => Boolean(error) && (error.code === '42703' || error.code === 'PGRST204' || (/pais_vive/i.test(String(error.message ?? '')) && /column|schema cache|does not exist/i.test(String(error.message ?? ''))))

export function crearServicioPrimeraVez({ admin }) {
  return {
    async leer(usuario) {
      if (!admin) return { estado: 503, cuerpo: { ok: false } }
      // Se hace una vez al abrir la app un viajero nuevo y una vez al abrir Ajustes; baja UNA fila de ~150 bytes.
      let suenosDisponibles = true
      // (V41) Baja además `franja_edad` (~7 bytes) y el año de nacimiento de las respuestas viejas, solo para convertirlo en franja: el año no sale del servidor.
      let { data, error } = await admin.from('viajero_primera_vez').select('frecuencia,compania,anio_nacimiento,franja_edad,hecho_en,pais_vive,' + COLUMNAS_SUENO.join(',')).eq('user_id', usuario.id).maybeSingle()
      // Sin la 0094 (falta la franja): se vuelve a pedir sin ella (la franja saldrá del año, si lo hay) y se sigue con lo de siempre.
      if (error && faltaLaFranja(error)) ({ data, error } = await admin.from('viajero_primera_vez').select('frecuencia,compania,anio_nacimiento,hecho_en,pais_vive,' + COLUMNAS_SUENO.join(',')).eq('user_id', usuario.id).maybeSingle())
      // Sin la 0093 (faltan las columnas del sueño) se sigue sin ellas; sin la 0091 (falta el país), sin el país: así las preguntas nunca se atascan.
      if (error && (faltaElSueno(error) || faltaLaColumna(error))) {
        suenosDisponibles = false
        ;({ data, error } = await admin.from('viajero_primera_vez').select('frecuencia,compania,anio_nacimiento,hecho_en,pais_vive').eq('user_id', usuario.id).maybeSingle())
      }
      if (error && faltaLaColumna(error)) ({ data, error } = await admin.from('viajero_primera_vez').select('frecuencia,compania,anio_nacimiento,hecho_en').eq('user_id', usuario.id).maybeSingle())
      if (error) {
        if (!faltaLaTabla(error)) console.error('[primera-vez]', error.message)
        return { estado: 503, cuerpo: { ok: false } }
      }
      return { estado: 200, cuerpo: { ok: true, hecho: Boolean(data), frecuencia: data?.frecuencia ?? null, compania: data?.compania ?? null, franja_edad: franjaDeFila(data), pais_vive: data?.pais_vive ?? null, suenos_disponibles: suenosDisponibles, sueno: limpiarSueno({ tipo: data?.sueno_tipo, nombre: data?.sueno_nombre, iso: data?.sueno_iso }) } }
    },
    async guardar(usuario, cuerpo) {
      if (!admin) return { estado: 503, cuerpo: { ok: false } }
      let fila = { user_id: usuario.id, ...limpiarRespuestas(cuerpo), ...columnasDeSueno(limpiarSueno(cuerpo?.sueno)), hecho_en: new Date().toISOString() }
      let { error } = await admin.from('viajero_primera_vez').upsert(fila, { onConflict: 'user_id' })
      // (V41) Sin la 0094 (falta `franja_edad`): se guarda todo menos la edad y las preguntas no se atascan.
      if (error && faltaLaFranja(error)) {
        const { franja_edad: _franja, ...sinFranja } = fila
        fila = sinFranja
        ;({ error } = await admin.from('viajero_primera_vez').upsert(fila, { onConflict: 'user_id' }))
      }
      // Sin la 0093 (V39): se guarda todo menos el sueño (y la pregunta ni sale: el GET dijo suenos_disponibles false).
      if (error && faltaElSueno(error)) {
        const sinSueno = Object.fromEntries(Object.entries(fila).filter(([k]) => !COLUMNAS_SUENO.includes(k)))
        ;({ error } = await admin.from('viajero_primera_vez').upsert(sinSueno, { onConflict: 'user_id' }))
        if (error && faltaLaColumna(error)) {
          const { pais_vive: _p, ...sinPaisNiSueno } = sinSueno
          ;({ error } = await admin.from('viajero_primera_vez').upsert(sinPaisNiSueno, { onConflict: 'user_id' }))
        }
      }
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
    /** (V39) Cambiar SOLO el viaje de sus sueños (desde Ajustes), sin tocar lo demás. Sin las columnas de la 0093, responde ok sin guardar. */
    async guardarSueno(usuario, cuerpo) {
      if (!admin) return { estado: 503, cuerpo: { ok: false } }
      const columnas = columnasDeSueno(limpiarSueno(cuerpo?.sueno))
      const { data: ya, error: errorLeer } = await admin.from('viajero_primera_vez').select('user_id').eq('user_id', usuario.id).maybeSingle()
      if (errorLeer) {
        if (!faltaLaTabla(errorLeer)) console.error('[primera-vez]', errorLeer.message)
        return { estado: 503, cuerpo: { ok: false } }
      }
      const consulta = ya
        ? admin.from('viajero_primera_vez').update(columnas).eq('user_id', usuario.id)
        : admin.from('viajero_primera_vez').upsert({ user_id: usuario.id, ...columnas, hecho_en: new Date().toISOString() }, { onConflict: 'user_id' })
      const { error } = await consulta
      if (error) {
        if (faltaElSueno(error)) return { estado: 200, cuerpo: { ok: true, guardado: false } }
        if (!faltaLaTabla(error)) console.error('[primera-vez]', error.message)
        return { estado: 503, cuerpo: { ok: false } }
      }
      return { estado: 200, cuerpo: { ok: true, guardado: true } }
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
  // (V39) El viaje de sus sueños, desde Ajustes. «disponible: false» = falta la 0093 (Ajustes no enseña la fila).
  app.get('/api/primera-vez/sueno', conUsuario(async (u) => {
    const r = await servicio.leer(u)
    return r.estado === 200 ? { estado: 200, cuerpo: { ok: true, sueno: r.cuerpo.sueno ?? null, disponible: r.cuerpo.suenos_disponibles === true } } : r
  }))
  app.put('/api/primera-vez/sueno', conUsuario((u, req) => servicio.guardarSueno(u, req.body)))
  app.put('/api/primera-vez/pais',conUsuario((u, req) => servicio.guardarPais(u, req.body)))
}
