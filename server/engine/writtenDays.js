/**
 * Los días de un destino, escritos como listas de paradas por franjas (Tanda 6): `data/dias/<destino>/listas.json` (lo genera
 * scripts/destino/listasConvertir.mjs desde docs/dias/DIAS_<DESTINO>_PARADAS.md) más `_destino.json` (llegadas, textos). Se leen una vez y se guardan en memoria.
 *
 * El motor (shared/routeEngine/listasTrip.js) los recibe ya leídos: el motor es puro y puede correr sin Node.
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
      else if (file === 'listas.json') Object.assign(days, data.dias ?? {})
      else if (file === '_pool_d0.json') extraPool = data
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
  excursionsCache.clear()
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
 * Las entradas que se pueden comprar de cada sitio (Tanda 6n): `data/dias/<destino>/_entradas.json`, por nombre de sitio (el Free Tour, como «Free Tour»).
 * Cada una: nombre, incluye, desde y url. Un sitio que no sale aquí no tiene entradas: ni pestaña ni pestañita. {} si el destino no tiene el archivo.
 */
export function entradasDe(destinationKey) {
  const key = String(destinationKey ?? '').trim().toLowerCase()
  if (!key) return {}
  if (!entradasCache.has(key)) {
    const file = join(DIAS_DIR, key, '_entradas.json')
    entradasCache.set(key, existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')).lugares ?? {} : {})
  }
  return entradasCache.get(key)
}

const entradasCache = new Map()

/**
 * Las fotos propias de un destino (PARA_CODE_FOTOS): `data/dias/<destino>/_fotos.json`. Null si no las tiene.
 */
export function photosFor(destinationKey) {
  const key = String(destinationKey ?? '').trim().toLowerCase()
  if (!key) return null
  if (photosCache.has(key)) {
    const cached = photosCache.get(key)
    return cached ? withSlots(key, cached) : null
  }
  const file = join(DIAS_DIR, key, '_fotos.json')
  const raw = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : null
  const value = raw?.fotos?.length ? raw : null
  photosCache.set(key, value)
  return value ? withSlots(key, value) : null
}

const photosCache = new Map()

/**
 * ¿Este lugar va SIN foto buscada? (Tanda 6y2.) Una sola regla para todo el servidor: `sin_foto` (sitios sin foto hasta elegir una buena) y
 * `fotos_rechazadas` (sitios cuya foto de Wikipedia era de otro lugar; cada uno con su motivo), ambas en data/dias/<destino>/_fotos.json.
 * Las rechazadas valen también para su versión nocturna («X (noche)», «X de noche»). Una foto PROPIA no pasa por aquí: va antes.
 */
export function fotoOculta(destinationKey, name) {
  const table = photosFor(destinationKey)
  if (!table || !name) return false
  if ((table.sin_foto ?? []).includes(name)) return true
  const base = String(name).replace(/\s*\(noche\)$|\s+de noche$/i, '')
  return (table.fotos_rechazadas ?? []).some((entrada) => entrada.lugar === name || entrada.lugar === base)
}

/**
 * El autor y la licencia de una foto de Wikipedia / Commons (Tanda 6z6f): `data/dias/<destino>/_fotos_wikimedia.json`, que rellena una vez
 * `scripts/destino/creditosWikimedia.mjs`. Se busca por el NOMBRE DEL FICHERO de la miniatura (no por el lugar: la foto puede venir de la caché
 * o de la versión de día de una nocturna). Null si es de dominio público, si el fichero no está en la tabla o si le falta el autor o la licencia:
 * sin crédito completo no se enseña nada.
 */
export function wikimediaCreditFor(destinationKey, photoUrl) {
  const key = String(destinationKey ?? '').trim().toLowerCase()
  if (!key || !photoUrl) return null
  let table = wikimediaCache.get(key)
  if (table === undefined) {
    const file = join(DIAS_DIR, key, '_fotos_wikimedia.json')
    let raw = null
    try {
      raw = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : null
    } catch {
      raw = null
    }
    table = new Map((raw?.fotos ?? []).map((foto) => [foto.archivo, foto]))
    wikimediaCache.set(key, table)
  }
  let archivo = null
  try {
    const parts = new URL(photoUrl).pathname.split('/').filter(Boolean)
    const i = parts.indexOf('thumb')
    archivo = decodeURIComponent(i >= 0 ? parts[i + 3] : parts[parts.length - 1])
  } catch {
    return null
  }
  const foto = table.get(archivo)
  if (!foto || foto.dominio_publico || !foto.autor || !foto.licencia) return null
  return { autor: foto.autor, licencia: foto.licencia, enlace: foto.pagina || null, licencia_url: foto.licencia_url || null }
}

const wikimediaCache = new Map()
const slotsCache = new Map()

/**
 * Los huecos de las fotos propias (`huecos` de _fotos.json, Tanda 3): cada sitio tiene un archivo fijo en public/fotos/<destino>/; en cuanto ese archivo existe, es una foto propia más (sin
 * registrarla a mano). Se mira cada 5 segundos si ha llegado alguna, así que basta con soltar el archivo.
 */
function withSlots(key, table) {
  if (!Array.isArray(table.huecos) || table.huecos.length === 0) return table
  const cached = slotsCache.get(key)
  if (cached && Date.now() - cached.at < 5000) return cached.value
  const folder = join(DIAS_DIR, '..', '..', 'public', String(table.carpeta ?? '').replace(/^\//, ''))
  const registered = new Set(table.fotos.map((foto) => foto.archivo))
  const arrived = table.huecos
    .filter((slot) => !registered.has(slot.archivo) && existsSync(join(folder, slot.archivo)))
    .map((slot) => ({ archivo: slot.archivo, lugares: slot.lugares, cuando: slot.cuando ?? 'dia', ancho: 1600, fuente: '', autor: '', enlace: '', hueco: true }))
  const value = arrived.length > 0 ? { ...table, fotos: [...table.fotos, ...arrived] } : table
  slotsCache.set(key, { at: Date.now(), value })
  return value
}

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

const excursionsCache = new Map()

/**
 * Las excursiones del día 4 de un destino (Tanda 6g): `data/dias/<destino>/_excursiones.json`. Null si el destino no las tiene escritas.
 * Se lee una vez; para las pruebas, `clearWrittenDaysCache` lo vacía.
 */
export function excursionsFor(destinationKey) {
  const key = String(destinationKey ?? '').trim().toLowerCase()
  if (!key) return null
  if (excursionsCache.has(key)) return excursionsCache.get(key)
  const file = join(DIAS_DIR, key, '_excursiones.json')
  const value = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : null
  excursionsCache.set(key, value)
  return value
}
