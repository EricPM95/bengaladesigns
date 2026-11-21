/**
 * (V35B) LOS «PRÓXIMAMENTE» EN LA BASE DE DATOS (tabla `destinos_proximamente`, migración 0091).
 *   GET  /api/destinos-proximamente                         (público, nada personal) → { ok, origen: 'base'|'archivo', destinos:[{clave,nombre,pais,iso,continente,lat,lng}] }
 *   POST /api/admin/destinos/proximamente                   { destino, pais }  → añade (desde «Pasar a Próximamente» y «+ Añadir un destino»)
 *   POST /api/admin/destinos/proximamente/quitar            { clave }          → quita
 * SIN la 0091 (la tabla no existe): la lista pública sale del JSON (data/primera_vez/destinos.json) con `origen: 'archivo'` y el panel dice «Pronto» (no se puede cambiar). Un destino que YA está en la app (lanzado) no se puede
 * poner en Próximamente: nunca sale en los dos sitios.
 */
import fs from 'node:fs'
import { limpiar } from '../avisosDestino.js'

const rutaJson = new URL('../../data/primera_vez/destinos.json', import.meta.url)
const leerJson = () => {
  try {
    return JSON.parse(fs.readFileSync(rutaJson, 'utf8'))
  } catch {
    return { salida: [], proximamente: [] }
  }
}
export const proximamenteDelArchivo = () => leerJson().proximamente ?? []
export const lanzadosDelArchivo = () => leerJson().salida ?? []

const EUROPA = new Set('al ad at by be ba bg hr cy cz dk ee fi fr de gr hu is ie it xk lv li lt lu mt md mc me nl mk no pl pt ro ru sm rs sk si es se ch ua gb va'.split(' '))
const AMERICA = new Set('ag ar bs bb bz bo br ca cl co cr cu dm do ec sv gd gt gy ht hn jm mx ni pa py pe kn lc vc sr tt us uy ve pr aw cw'.split(' '))
export const continenteDe = (iso) => (EUROPA.has(String(iso).toLowerCase()) ? 'Europa' : AMERICA.has(String(iso).toLowerCase()) ? 'América y Caribe' : 'Otros')

export const claveDe = (nombre) =>
  String(nombre ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 60)

/** Pone coordenadas y país a un destino nuevo con el buscador de Mapbox (si hay clave). Sin clave o sin resultado: null (el destino se guarda igual, solo sin pin en el mapa). */
export function crearGeocodificador({ token = process.env.VITE_MAPBOX_TOKEN, fetchFn = fetch } = {}) {
  return async (nombre, pais) => {
    if (!token) return null
    try {
      const q = encodeURIComponent([nombre, pais].filter(Boolean).join(', '))
      const r = await fetchFn(`https://api.mapbox.com/geocoding/v5/mapbox.places/${q}.json?access_token=${encodeURIComponent(token)}&limit=1&language=es&types=place,region,locality`)
      const j = await r.json().catch(() => null)
      const f = j?.features?.[0]
      if (!r.ok || !f?.center) return null
      const pais = (f.context ?? []).find((c) => String(c.id).startsWith('country'))
      const iso = String(pais?.short_code ?? f.properties?.short_code ?? '').toLowerCase()
      return { lng: f.center[0], lat: f.center[1], iso, pais: pais?.text ?? '' }
    } catch {
      return null
    }
  }
}

export function crearServicioProximamente({ admin, geocodificar = crearGeocodificador(), lanzados = lanzadosDelArchivo, consola = console }) {
  /** La lista de la base (o del JSON si la tabla no existe). `deBase`: ¿existe la tabla? */
  async function leer() {
    if (admin) {
      try {
        const { data, error } = await admin.from('destinos_proximamente').select('clave,nombre,pais,iso,continente,lat,lng,orden').order('orden', { ascending: true }).order('creado_en', { ascending: true })
        if (!error) return { deBase: true, destinos: data ?? [] }
      } catch (e) {
        consola.warn?.('[proximamente]', e?.message ?? e)
      }
    }
    return { deBase: false, destinos: proximamenteDelArchivo() }
  }
  return {
    leer,
    /** La lista pública para el mapa de la app. */
    async publica() {
      const { deBase, destinos } = await leer()
      const listos = new Set(lanzados().map((d) => d.clave))
      return {
        ok: true,
        origen: deBase ? 'base' : 'archivo',
        destinos: destinos.filter((d) => !listos.has(d.clave)).map((d) => ({ clave: d.clave, nombre: d.nombre, pais: d.pais, iso: d.iso ?? '', continente: d.continente ?? '', lat: d.lat, lng: d.lng })),
      }
    },
    async anadir(cuerpo) {
      const nombre = String(cuerpo?.destino ?? '').replace(/\s+/g, ' ').trim()
      const pais = String(cuerpo?.pais ?? '').replace(/\s+/g, ' ').trim()
      if (nombre.length < 2 || nombre.length > 80) return { estado: 400, cuerpo: { ok: false, error: 'Falta el nombre del destino.' } }
      if (pais.length > 80) return { estado: 400, cuerpo: { ok: false, error: 'Ese país no vale.' } }
      const { deBase, destinos } = await leer()
      if (!deBase) return { estado: 409, cuerpo: { ok: false, pronto: true, error: 'Falta aplicar la migración 0091 en Supabase.' } }
      const clave = claveDe(nombre)
      if (!clave) return { estado: 400, cuerpo: { ok: false, error: 'Ese nombre no vale.' } }
      if (lanzados().some((d) => d.clave === clave || limpiar(d.nombre) === limpiar(nombre))) return { estado: 409, cuerpo: { ok: false, error: `${nombre} ya está en la app.`, lanzado: true } }
      if (destinos.some((d) => d.clave === clave)) return { estado: 409, cuerpo: { ok: false, error: `${nombre} ya está en Próximamente.`, ya_esta: true } }
      const sitio = await geocodificar(nombre, pais)
      const iso = sitio?.iso ?? ''
      const fila = { clave, nombre, pais: pais || sitio?.pais || '', iso, continente: continenteDe(iso), lat: sitio?.lat ?? null, lng: sitio?.lng ?? null, orden: destinos.length + 1 }
      const { error } = await admin.from('destinos_proximamente').insert(fila)
      if (error) {
        consola.error?.('[proximamente]', error.message)
        return { estado: 500, cuerpo: { ok: false, error: 'No se ha podido guardar.' } }
      }
      return { estado: 200, cuerpo: { ok: true, destino: { clave, nombre, pais, iso }, con_pin: sitio !== null } }
    },
    async quitar(cuerpo) {
      const clave = String(cuerpo?.clave ?? '')
      if (!clave || clave.length > 60) return { estado: 400, cuerpo: { ok: false, error: 'Falta el destino.' } }
      const { deBase } = await leer()
      if (!deBase) return { estado: 409, cuerpo: { ok: false, pronto: true, error: 'Falta aplicar la migración 0091 en Supabase.' } }
      const { error } = await admin.from('destinos_proximamente').delete().eq('clave', clave)
      if (error) return { estado: 500, cuerpo: { ok: false, error: 'No se ha podido quitar.' } }
      return { estado: 200, cuerpo: { ok: true } }
    },
  }
}
