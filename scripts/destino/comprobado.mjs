// Datos que caducan (decisión del usuario, 2026-09-28): lo que cambia de un año a otro lleva la fecha de su última
// comprobación, `comprobado: "AAAA-MM-DD"`. Son las fechas especiales con `verificar`, los textos con `cifra_ok`, los
// horarios por temporada (`by_season` / `by_period`) y los restaurantes curados. validar.mjs avisa en amarillo de lo
// que no lo tiene o lo tiene de hace más de 11 meses, y la revisión de cada 1 de diciembre usa esta lista para saber
// qué repasar.
//   node scripts/destino/comprobado.mjs            → todos los destinos
//   node scripts/destino/comprobado.mjs roma
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

export const MESES_CADUCIDAD = 11

/** Todo lo que debería llevar `comprobado`, con un nombre legible y su fecha (o null). */
export function datosQueCaducan(D, detalle = {}) {
  const items = []
  for (const entry of D.fechas_especiales?.fechas ?? []) if (entry.verificar) items.push({ tipo: 'fecha especial', nombre: entry.titulo ?? entry.id, comprobado: entry.comprobado ?? null })
  for (const place of D.places ?? []) if (place.by_season || place.by_period) items.push({ tipo: 'horario por temporada', nombre: place.name, comprobado: place.comprobado ?? null })
  for (const restaurant of D.restaurants ?? []) items.push({ tipo: 'restaurante', nombre: restaurant.name, comprobado: restaurant.comprobado ?? null })
  // Los textos con cifra (`cifra_ok`), estén donde estén: días curados, por_que_lugares, paseos, fichas.
  const seen = new Set()
  const walk = (node, path, where) => {
    if (!node || typeof node !== 'object') return
    if (node.cifra_ok) {
      const nombre = `${where}: ${path}`
      const texto = node.texto ?? node.añadir ?? node.description ?? path
      const key = `${where}|${texto}`
      if (!seen.has(key)) {
        seen.add(key)
        items.push({ tipo: 'texto con cifra', nombre, comprobado: node.comprobado ?? null })
      }
    }
    for (const [key, value] of Object.entries(node)) walk(value, `${path}.${key}`, where)
  }
  walk(D, D.destination ?? 'destino', 'datos')
  for (const [file, data] of Object.entries(detalle)) walk(data, file, 'ficha')
  return items
}

/** ¿Hay que repasarlo? Sin fecha, o de hace más de 11 meses. */
export function caducado(item, today = new Date()) {
  if (!item.comprobado || !/^\d{4}-\d{2}-\d{2}$/.test(item.comprobado)) return 'sin fecha de comprobación'
  const limit = new Date(today)
  limit.setMonth(limit.getMonth() - MESES_CADUCIDAD)
  return new Date(`${item.comprobado}T12:00:00Z`) < limit ? `comprobado el ${item.comprobado}, hace más de ${MESES_CADUCIDAD} meses` : null
}

export function detalleDe(root, destino) {
  const dir = join(root, 'data/pipeline_v2/detalle', destino)
  if (!existsSync(dir)) return {}
  return Object.fromEntries(readdirSync(dir).filter((file) => file.endsWith('.json')).map((file) => [file, JSON.parse(readFileSync(join(dir, file), 'utf8'))]))
}

/** El listado por destino (lo que usa la revisión automática de cada 1 de diciembre). */
export function listadoComprobado(destino = null) {
  const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..')
  const destinos = destino ? [destino] : readdirSync(join(ROOT, 'data/pipeline_v2')).filter((file) => file.endsWith('.json')).map((file) => file.replace(/\.json$/, ''))
  for (const destino of destinos) {
    const D = JSON.parse(readFileSync(join(ROOT, `data/pipeline_v2/${destino}.json`), 'utf8'))
    if (!Array.isArray(D.places)) continue
    const pendientes = datosQueCaducan(D, detalleDe(ROOT, destino)).map((item) => ({ ...item, motivo: caducado(item) })).filter((item) => item.motivo)
    console.log(`\n## ${D.destination ?? destino}: ${pendientes.length} datos por repasar`)
    for (const item of pendientes) console.log(`- ${item.tipo} · ${item.nombre} (${item.motivo})`)
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) listadoComprobado(process.argv[2] ?? null)
