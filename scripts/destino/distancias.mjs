// Distancias de los días escritos: ¿el hueco entre una parada y la siguiente da para lo que se tarda andando de verdad (con las coordenadas de roma.json y el mismo cálculo
// que usa la app) más el margen del documento (10 min; 15 después de una visita guiada)? Se usa de dos maneras:
//   node scripts/destino/distancias.mjs            → escribe docs/dias/DISTANCIAS_TANDA3.md con cada tramo que no llega (sin cambiar nada)
//   import { corregirDistancias } from './distancias.mjs'  → el convertidor corre las horas de los tramos cortos (solo empuja lo siguiente; las filas ancladas no se tocan)
import fs from 'node:fs'
import { findPipelineV2Data, findPipelineV2Key } from '../../server/routeAlgorithm.js'
import { travelTimesFor } from '../../server/engine/buildDayV3.js'
import { hueco, finDe, esAncla, toMin, toHHMM, CENA_MAXIMA, correrHoras } from '../../shared/routeEngine/escritos.js'

const D = findPipelineV2Data('Roma')
const travel = travelTimesFor(findPipelineV2Key(D.destination ?? 'Roma'))
const placeBy = new Map(D.places.map((place) => [place.name, place]))
const restBy = new Map(D.restaurants.map((restaurant) => [restaurant.name, restaurant]))
const nightBy = new Map((D.night_experiences ?? []).map((entry) => [entry.name, entry]))
const up5 = (m) => Math.ceil(m / 5) * 5
/**
 * Tolerancia en minutos: 0 = la regla de márgenes del documento tal cual, con el mismo redondeo del motor (andando + 10, a 5 hacia arriba). Con TOLERANCIA_DISTANCIAS=4 se mide hacia abajo
 * (117 tramos en vez de 478), pero entonces las tablas quedan con tramos cortos que el motor destapa en cuanto corre las horas por otra causa (un cierre, el pool…): recorta colchones sin que nadie
 * lo haya pedido. Por eso por defecto es 0 (decisión provisional, PREGUNTAS_TANDA3).
 */
export const TOLERANCIA = Number(process.env.TOLERANCIA_DISTANCIAS ?? 0)

export function coordsDe(row) {
  if (row.tipo === 'comida' || row.tipo === 'cena') {
    const restaurant = restBy.get(row.restaurante)
    return restaurant?.coordinates ? [restaurant.coordinates.lat, restaurant.coordinates.lng] : null
  }
  if (row.tipo === 'noche') return nightBy.get(row.noche)?.coordinates ?? null
  return placeBy.get(row.lugar)?.coordinates ?? null
}
export const andar = (a, b) => {
  const from = coordsDe(a)
  const to = coordsDe(b)
  return Array.isArray(from) && Array.isArray(to) ? Math.round(travel.leg(from, to)?.minutes ?? 0) : 0
}
const nombre = (row) => row.titulo ?? row.lugar ?? row.restaurante ?? row.noche ?? row.tipo

const andarT = (a, b) => Math.max(0, andar(a, b) - TOLERANCIA)

/** Los tramos de una tabla que no llegan: { i, de, a, andar, hay, hace_falta, falta }. */
export function tramosCortos(rows) {
  const cortos = []
  for (let i = 1; i < rows.length; i++) {
    const prev = rows[i - 1]
    const row = rows[i]
    if (!prev.hora || !row.hora) continue
    const llegada = up5(finDe(prev) + hueco(prev, row, andarT))
    const falta = llegada - toMin(row.hora)
    if (falta > 0) cortos.push({ i, de: nombre(prev), a: nombre(row), hora_de: prev.hora, hora_a: row.hora, andar: andar(prev, row), hay: toMin(row.hora) - finDe(prev), hace_falta: llegada - finDe(prev), falta, ancla: esAncla(row) && row.tipo !== 'traslado' })
  }
  return cortos
}

/**
 * Corre las horas de una tabla: cada fila que no llega a su hora sale más tarde (lo andado más el margen del documento) y lo de después se empuja lo que haga falta. SOLO corre horas: no
 * acorta colchones ni comidas ni quita nada. La cena puede retrasarse (hasta las 22:00, como en el motor); una reserva, un turno, el Free Tour u otra fila fija, no. Si la tabla no se
 * puede arreglar así, no se toca y los tramos cortos se apuntan (`fijos`): lo decide quien escribe el documento (recortar un colchón, mover una parada).
 */
export function corregirTabla(rows) {
  const cortos = tramosCortos(rows)
  if (cortos.length === 0) return { rows, cambios: [], fijos: [] }
  if (process.env.DISTANCIAS_MODO === 'recortar') return corregirRecortando(rows)
  const lista = rows.map((row) => ({ ...row }))
  const sinArreglo = (porque) => ({ rows, cambios: [], fijos: cortos.map((corto) => ({ id: rows[corto.i].id, fila: corto.a, hora: corto.hora_a, tramo: `${corto.de} → ${corto.a}`, andar: corto.andar, falta: corto.falta, porque })) })
  for (let i = 1; i < lista.length; i++) {
    const prev = lista[i - 1]
    const row = lista[i]
    if (!prev.hora || !row.hora) continue
    const llegada = up5(finDe(prev) + hueco(prev, row, andarT))
    if (llegada <= toMin(row.hora)) continue
    if (esAncla(row) && row.tipo !== 'traslado' && row.tipo !== 'cena') return sinArreglo(`la fila de llegada es fija (${row.hora_tipo ?? row.tipo})`)
    if (row.tipo === 'cena' && llegada > CENA_MAXIMA) return sinArreglo('la cena pasaría de las 22:00')
    row.hora = toHHMM(llegada)
  }
  const cambios = []
  const nuevas = lista.map((row, i) => {
    const antes = rows[i]
    if (row.hora === antes.hora) return antes
    cambios.push({ id: row.id, fila: nombre(row), de: antes.hora, a: row.hora, min_de: antes.min, min_a: row.min, tramo: `${nombre(rows[i - 1] ?? antes)} → ${nombre(row)}`, andar: i > 0 ? andar(rows[i - 1], row) : 0 })
    return { ...row, hora_corregida: `distancia: lo escrito era ${antes.hora}` }
  })
  return { rows: nuevas, cambios, fijos: [] }
}

/**
 * La otra manera (DISTANCIAS_MODO=recortar): con `correrHoras` del motor, que además de correr las horas acorta el colchón de antes (hasta su mínimo) y la comida (hasta 45 min) antes de retrasar la cena.
 * Deja la cena donde la escribió el documento, pero recorta colchones (hasta 55 min en algún día). Si habría que quitar una parada, no toca la tabla.
 */
function corregirRecortando(rows) {
  const corrida = correrHoras(rows.map((row) => ({ ...row })), { desde: 1, walk: andarT, soloEmpujar: true })
  if (corrida.quitadas.length > 0 || corrida.problemas.length > 0 || corrida.rows.length !== rows.length) {
    return { rows, cambios: [], fijos: tramosCortos(rows).map((corto) => ({ id: rows[corto.i].id, fila: corto.a, hora: corto.hora_a, tramo: `${corto.de} → ${corto.a}`, andar: corto.andar, falta: corto.falta, porque: corrida.problemas[0] ?? (corrida.quitadas.length ? 'habría que quitar una parada' : 'no cabe') })) }
  }
  const cambios = []
  const nuevas = corrida.rows.map((row, i) => {
    const antes = rows[i]
    if (row.hora === antes.hora && row.min === antes.min) return antes
    cambios.push({ id: row.id, fila: nombre(row), de: antes.hora, a: row.hora, min_de: antes.min, min_a: row.min, tramo: `${nombre(rows[i - 1] ?? antes)} → ${nombre(row)}`, andar: i > 0 ? andar(rows[i - 1], row) : 0 })
    return { ...row, hora_corregida: `distancia: lo escrito era ${antes.hora}${row.min !== antes.min ? ` y ${antes.min} min` : ''}` }
  })
  return { rows: nuevas, cambios, fijos: [] }
}

/** Todas las tablas de todos los días (versiones y pool): [{ dia, donde, rows, poner }]. */
export function todasLasTablas(out) {
  const lista = []
  for (const [id, day] of Object.entries(out)) {
    for (const [grupo, tablas] of Object.entries(day.versiones ?? {})) for (const [letra, rows] of Object.entries(tablas)) lista.push({ dia: id, donde: `${grupo}/${letra}`, rows, poner: (nuevas) => { tablas[letra] = nuevas } })
    for (const [extra, def] of Object.entries(day.pool ?? {})) for (const accion of def.acciones ?? []) {
      for (const [letra, rows] of Object.entries(accion.tablas ?? {})) lista.push({ dia: id, donde: `pool ${extra}/${letra}`, rows, poner: (nuevas) => { accion.tablas[letra] = nuevas } })
      if (accion.filas) lista.push({ dia: id, donde: `pool ${extra}/mañana`, rows: accion.filas, poner: (nuevas) => { accion.filas = nuevas } })
    }
  }
  return lista
}

/** Para el convertidor: corre las horas de todas las tablas y devuelve lo que ha cambiado. */
export function corregirDistancias(out) {
  const todos = []
  const fijos = []
  for (const tabla of todasLasTablas(out)) {
    const { rows, cambios, fijos: sin } = corregirTabla(tabla.rows)
    for (const f of sin) fijos.push({ dia: tabla.dia, donde: tabla.donde, ...f })
    if (cambios.length === 0) continue
    tabla.poner(rows)
    for (const cambio of cambios) todos.push({ dia: tabla.dia, donde: tabla.donde, ...cambio })
  }
  return { cambios: todos, fijos }
}

// Como programa: el informe (sobre lo que hay ahora en data/dias/roma, sin tocarlo).
if (process.argv[1] && process.argv[1].endsWith('distancias.mjs')) {
  const out = {}
  for (const file of fs.readdirSync('data/dias/roma').filter((name) => /^D.*\.json$/.test(name) && !name.startsWith('_'))) {
    const day = JSON.parse(fs.readFileSync(`data/dias/roma/${file}`, 'utf8'))
    out[day.id] = day
  }
  const lineas = ['# Distancias de los días escritos (Tanda 3)', '', 'Cada tramo en que el hueco entre dos paradas no da para lo que se anda (coordenadas de roma.json, el cálculo de la app) más el margen del documento. «Falta» son los minutos de más que hacen falta.', '']
  const vistos = new Set()
  let n = 0
  for (const tabla of todasLasTablas(out)) {
    for (const corto of tramosCortos(tabla.rows)) {
      const clave = `${tabla.dia}|${corto.de}|${corto.a}|${corto.hora_de}|${corto.hora_a}`
      if (vistos.has(clave)) continue
      vistos.add(clave)
      n++
      lineas.push(`- **${tabla.dia}** (${tabla.donde}): ${corto.hora_de} ${corto.de} → ${corto.hora_a} ${corto.a}: andando ${corto.andar} min, hace falta ${corto.hace_falta} y hay ${corto.hay} (faltan ${corto.falta} min${corto.ancla ? '; la fila de llegada es fija' : ''})`)
    }
  }
  lineas.splice(3, 0, `${n} tramos distintos.`, '')
  fs.writeFileSync(process.argv[2] ?? 'docs/dias/DISTANCIAS_TANDA3.md', lineas.join('\n') + '\n')
  console.log(`${n} tramos que no llegan`)
}
