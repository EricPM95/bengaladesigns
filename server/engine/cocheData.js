/**
 * Los datos del motor en coche (LZ2a): lo que lee `shared/routeEngine/cocheTrip.js` de un destino que se recorre en coche, leído una vez y en memoria.
 *   data/dias/<destino>/listas.json, _paradas.json, _restaurantes.json, _civitatis.json, _destino.json  +  data/pipeline_v2/travel/<destino>_coche.json
 */
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const cache = new Map()
const leer = (ruta) => (existsSync(ruta) ? JSON.parse(readFileSync(ruta, 'utf8')) : null)

/** { listas, paradas, matriz, restaurantes, civitatis, destino } o null si el destino no los tiene todos (listas, paradas y la tabla de coche). */
export function cocheDataFor(destinationKey) {
  const key = String(destinationKey ?? '').trim().toLowerCase()
  if (!key) return null
  if (cache.has(key)) return cache.get(key)
  const dir = join(RAIZ, 'data', 'dias', key)
  const listas = leer(join(dir, 'listas.json'))
  const paradas = leer(join(dir, '_paradas.json'))
  const matriz = leer(join(RAIZ, 'data', 'pipeline_v2', 'travel', `${key}_coche.json`))
  const value = listas && paradas && matriz
    ? { listas, paradas, matriz, restaurantes: leer(join(dir, '_restaurantes.json')) ?? {}, civitatis: leer(join(dir, '_civitatis.json')), destino: leer(join(dir, '_destino.json')) ?? {} }
    : null
  cache.set(key, value)
  return value
}

export function clearCocheDataCache() {
  cache.clear()
}
