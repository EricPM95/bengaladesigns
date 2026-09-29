/**
 * Los días escritos de un destino (docs/DIAS_ESCRITOS_FORMATO.md): `data/dias/<destino>/`, un fichero por día más
 * `_destino.json` (cortes de luz, fechas especiales, pool, reparto). Se leen una vez y se guardan en memoria.
 *
 * El motor v4 (shared/routeEngine/writtenTrip.js) los recibe ya leídos: el motor es puro y puede correr sin Node.
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const DIAS_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'data', 'dias')
const cache = new Map()

/** { destino, days: { D1: {...}, … } } o null si el destino no tiene días escritos. */
export function writtenDaysFor(destinationKey) {
  const key = String(destinationKey ?? '').trim().toLowerCase()
  if (!key) return null
  if (cache.has(key)) return cache.get(key)
  const dir = join(DIAS_DIR, key)
  let value = null
  if (existsSync(dir)) {
    const days = {}
    let destino = {}
    for (const file of readdirSync(dir).filter((name) => name.endsWith('.json')).sort()) {
      const data = JSON.parse(readFileSync(join(dir, file), 'utf8'))
      if (file === '_destino.json') destino = data
      else if (data?.id) days[data.id] = data
    }
    value = Object.keys(days).length > 0 ? { destino, days } : null
  }
  cache.set(key, value)
  return value
}

/** Para las pruebas: vuelve a leer los ficheros (después de editarlos). */
export function clearWrittenDaysCache() {
  cache.clear()
}

const arrivalCache = new Map()

/**
 * Los tips del viaje (PROMPT_UI_REPASO_2, 3): `data/dias/<destino>/_tips.json`, en su orden, con el gentilicio para la
 * cabecera («8 cosas que un romano te diría»). Null si el destino no los tiene.
 */
export function tipsFor(destinationKey) {
  const key = String(destinationKey ?? '').trim().toLowerCase()
  if (!key) return null
  if (tipsCache.has(key)) return tipsCache.get(key)
  const file = join(DIAS_DIR, key, '_tips.json')
  const raw = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : null
  const value = raw?.tips?.length ? { local: raw.local ?? null, tips: [...raw.tips].sort((a, b) => a.orden - b.orden) } : null
  tipsCache.set(key, value)
  return value
}

const tipsCache = new Map()

/**
 * La llegada y la vuelta de un destino (PROMPT_UI, Parte 3): `data/dias/<destino>/_llegada.json`, una sección por medio
 * y por punto de llegada, con sus precios, fuentes y fechas. Null si el destino no lo tiene.
 */
export function arrivalInfoFor(destinationKey) {
  const key = String(destinationKey ?? '').trim().toLowerCase()
  if (!key) return null
  if (arrivalCache.has(key)) return arrivalCache.get(key)
  const file = join(DIAS_DIR, key, '_llegada.json')
  const value = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : null
  arrivalCache.set(key, value)
  return value
}
