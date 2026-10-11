/**
 * Qué nombres puede guardar la caché de fotos (tabla `place_photo_cache`, Tanda 6y5).
 *
 * La caché guarda la foto que resolvió el servidor para un NOMBRE. Si el nombre no es de ningún sitio nuestro (un nombre mal escrito, un texto de búsqueda, el nombre de un punto
 * de Mapbox), la foto que sale es una de Wikipedia o Unsplash para algo que no es ese sitio, y guardada se queda para todos los viajeros («Plaza de Espa?a» con la foto de un cantante).
 * Una sola regla: solo se lee y se guarda en la caché lo que lleva un nombre de nuestros datos del destino. Un destino SIN datos nuestros no tiene con qué compararse: todo vale.
 */
import { titulosDePaseoLibre } from '../../shared/routeEngine/sitios.js'

const nombresPorDatos = new WeakMap()

/** Todos los nombres con los que nuestros datos llaman a un sitio: fichas (y su `photo_name`), nocturnas, paseos, excursiones, Free Tour, sitios extra y bloques de tarde. */
export function nombresDeNuestrosDatos(data) {
  const nombres = new Set()
  const anade = (nombre) => {
    if (typeof nombre === 'string' && nombre.trim()) nombres.add(nombre.trim())
  }
  for (const place of data.places ?? []) {
    anade(place.name)
    anade(place.photo_name)
  }
  for (const entrada of [...(data.night_experiences ?? []), ...(data.zone_walks ?? []), ...(data.evening_blocks ?? []), ...(data.joyas ?? [])]) anade(typeof entrada === 'string' ? entrada : entrada?.name)
  for (const opcion of data.excursions?.options ?? []) anade(opcion.name)
  anade(data.default_free_tour?.name)
  for (const [clave, nombre] of Object.entries(data.destination_config?.sitios_extra ?? {})) if (!clave.startsWith('_')) anade(nombre)
  for (const config of Object.values(data.destination_config?.paseo_libre?.zonas ?? {})) {
    for (const titulo of titulosDePaseoLibre(config)) anade(titulo)
    anade(config.nombre)
    anade(config.iluminado)
    anade(config.si_visto_nombre)
    anade(config.foto)
    for (const alternativa of config.foto_alternativas ?? []) anade(alternativa)
  }
  return nombres
}

/** El nombre sin lo que le añade la app: «noche:», « (por fuera)», « (por dentro)», « (noche)» y « de noche». */
export const nombreBase = (nombre) =>
  String(nombre ?? '')
    .replace(/^noche:/, '')
    .replace(/\s*\((por fuera|por dentro|noche)\)$/i, '')
    .replace(/\s+de noche$/i, '')
    .trim()

/** ¿Es `nombre` de algún sitio de estos datos? Sin datos (un destino que no es nuestro) no hay con qué comparar: sí. */
export function esNombreNuestro(data, nombre) {
  if (!data) return true
  let nombres = nombresPorDatos.get(data)
  if (!nombres) {
    nombres = nombresDeNuestrosDatos(data)
    nombresPorDatos.set(data, nombres)
  }
  const texto = String(nombre ?? '').trim()
  return nombres.has(texto) || nombres.has(nombreBase(texto))
}
