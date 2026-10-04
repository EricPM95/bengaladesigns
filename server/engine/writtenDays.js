/**
 * Los días escritos de un destino (docs/DIAS_ESCRITOS_FORMATO.md): `data/dias/<destino>/`, un fichero por día más
 * `_destino.json` (cortes de luz, fechas especiales, pool, reparto). Se leen una vez y se guardan en memoria.
 *
 * El motor v4 (shared/routeEngine/writtenTrip.js) los recibe ya leídos: el motor es puro y puede correr sin Node.
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { withinMonthDays } from '../../shared/routeEngine/openingHours.js'

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
    let extraPool = null
    for (const file of readdirSync(dir).filter((name) => name.endsWith('.json')).sort()) {
      const data = JSON.parse(readFileSync(join(dir, file), 'utf8'))
      if (file === '_destino.json') destino = data
      else if (file === '_pool_d0.json') extraPool = data
      else if (data?.id) days[data.id] = data
    }
    // (El sitio de cada extra del pool en el viaje de 1 día, D0: `_pool_d0.json` se suma a `_destino.json › pool`.)
    if (extraPool) {
      destino.pool = destino.pool ?? {}
      for (const [name, site] of Object.entries(extraPool)) if (!name.startsWith('_')) destino.pool[name] = { ...(destino.pool[name] ?? {}), sitios: [...(destino.pool[name]?.sitios ?? []), site] }
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
 * Las fotos propias de un destino (PARA_CODE_FOTOS): `data/dias/<destino>/_fotos.json`. Null si no las tiene.
 */
export function photosFor(destinationKey) {
  const key = String(destinationKey ?? '').trim().toLowerCase()
  if (!key) return null
  if (photosCache.has(key)) return photosCache.get(key)
  const file = join(DIAS_DIR, key, '_fotos.json')
  const raw = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : null
  const value = raw?.fotos?.length ? raw : null
  photosCache.set(key, value)
  return value
}

const photosCache = new Map()

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

/**
 * La foto propia de un lugar (de `photosFor`) para una fecha, o null: la de sus fechas (Navidad) primero, sin las que esperan a
 * comprobarse (`verificar`). Es lo que usa /api/place-photo y lo que mira la prueba para que un día no repita foto.
 */
export function ownPhotoFile(table, name, dateIso) {
  if (!table) return null
  const md = /^\d{4}-\d{2}-\d{2}$/.test(String(dateIso ?? '')) ? Number(dateIso.slice(5, 7)) * 100 + Number(dateIso.slice(8, 10)) : null
  const valid = (table.fotos ?? []).filter((foto) => (foto.lugares ?? []).includes(name) && !foto.verificar && (!foto.fechas || (md != null && withinMonthDays(md, foto.fechas.desde, foto.fechas.hasta))))
  return valid.find((candidate) => candidate.fechas) ?? valid[0] ?? null
}
