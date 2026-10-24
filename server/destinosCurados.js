/**
 * LOS DESTINOS CURADOS DE VERDAD (Tanda 10, la primera pantalla). Un destino sale en el mapa del formulario solo si está escrito de verdad, y eso se saca de los datos, no de una lista:
 *   · sus días escritos          data/dias/<clave>/listas.json
 *   · los datos del destino      data/pipeline_v2/<clave>.json
 *   · sus logros con el pase     data/logros/<clave>.json
 *   · dónde va su pin y su foto de portada            data/dias/<clave>/_mapa.json  ({ lat, lng, iso, portada, portada_pequena })
 * Cuando se añade otro destino con sus cuatro cosas, sale solo. Hoy, solo Roma.
 *
 *   GET /api/destinos-curados   { ok, destinos: [{ clave, nombre, pais, iso, lat, lng, portada, portada_pequena }] }
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const leer = (ruta) => JSON.parse(readFileSync(ruta, 'utf8'))
const numero = (v) => typeof v === 'number' && Number.isFinite(v)

/** Lee los destinos curados de una carpeta `data` (la de la app o una de prueba). Un destino con algún archivo roto o sin el pin se deja fuera, no rompe la lista. */
export function leerDestinosCurados(raizData) {
  const dias = join(raizData, 'dias')
  if (!existsSync(dias)) return []
  const salida = []
  for (const entrada of readdirSync(dias, { withFileTypes: true })) {
    if (!entrada.isDirectory()) continue
    const clave = entrada.name
    const archivos = [join(dias, clave, 'listas.json'), join(raizData, 'pipeline_v2', `${clave}.json`), join(raizData, 'logros', `${clave}.json`), join(dias, clave, '_mapa.json')]
    if (!archivos.every((a) => existsSync(a))) continue
    try {
      const logros = leer(archivos[2])
      const mapa = leer(archivos[3])
      const datos = leer(archivos[1])
      if (!numero(mapa.lat) || !numero(mapa.lng) || mapa.lat < -90 || mapa.lat > 90 || mapa.lng < -180 || mapa.lng > 180) continue
      const nombre = String(logros.ciudad ?? datos.destination ?? '').trim()
      if (!nombre) continue
      // La foto de portada del destino (Tanda 10G, la tarjeta del primer paso): sale de su `_mapa.json` (`portada`, y `portada_pequena` para las tarjetas), no de una lista del código.
      const ruta = (v) => (typeof v === 'string' && v.startsWith('/') ? v : null)
      salida.push({ clave, nombre, pais: String(datos.country ?? logros.pais_defecto ?? '').trim(), iso: String(mapa.iso ?? '').toLowerCase() || null, lat: mapa.lat, lng: mapa.lng, portada: ruta(mapa.portada), portada_pequena: ruta(mapa.portada_pequena) ?? ruta(mapa.portada) })
    } catch {
      /* un archivo roto: ese destino no sale */
    }
  }
  return salida.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
}

export function registrarRutasDestinosCurados(app, raizData) {
  let lista = null
  app.get('/api/destinos-curados', (_req, res) => {
    lista ??= leerDestinosCurados(raizData)
    res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=3600')
    res.json({ ok: true, destinos: lista })
  })
}
