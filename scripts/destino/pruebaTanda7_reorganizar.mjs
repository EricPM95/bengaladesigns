// Tanda 7, arreglo de «Reorganizar»: las listas de la llegada y de la vuelta no son días de ruta.
//   node scripts/destino/pruebaTanda7_reorganizar.mjs
// Comprueba (1) que el convertidor marca con `solo_llegada_o_vuelta` las listas que cuelgan de «Llegadas y vueltas» y solo esas,
// (2) que los motores de la llegada y la vuelta las siguen leyendo, y (3) que Reorganizar deja una reserva a su hora (los Museos a las 9:00)
// tanto con los días escritos de siempre como con las listas de llegada y vuelta presentes, y que un destino sin marca se comporta como antes.
import fs from 'node:fs'
import { reorganizarDia } from '../../shared/routeEngine/reorganizarDia.js'
import { esDiaDeRuta } from '../../shared/routeEngine/listasDia.js'
import { findPipelineV2Data } from '../../server/routeAlgorithm.js'
import { writtenDaysFor } from '../../server/engine/writtenDays.js'

const D = findPipelineV2Data('Roma')
const W = writtenDaysFor('roma')
const fallos = []
let comprobaciones = 0
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) fallos.push({ regla, texto })
}

// 1. Las marcas salen del documento: toda lista cuyo encabezado cuelga de «## Llegadas y vueltas» y ninguna otra.
const lineas = fs.readFileSync('docs/dias/DIAS_ROMA_PARADAS.md', 'utf8').split(/\r?\n/)
const delDocumento = new Set()
{
  let dentro = false
  for (const linea of lineas) {
    const dos = /^##\s+(.+?)\s*$/.exec(linea)
    if (dos) dentro = /^Llegadas y vueltas\b/i.test(dos[1])
    const h = /^#{2,3}\s+.+?\s+·\s+(D[0-9A-Za-z-]+)\b/.exec(linea)
    if (h && dentro) delDocumento.add(h[1])
  }
}
const marcadas = Object.entries(W.days).filter(([, dia]) => !esDiaDeRuta(dia)).map(([id]) => id)
debe(delDocumento.size >= 20, 'marca_documento', `el documento debería traer al menos 20 listas bajo «Llegadas y vueltas» y trae ${delDocumento.size}`)
debe(marcadas.length === delDocumento.size && marcadas.every((id) => delDocumento.has(id)), 'marca_documento', `las marcadas (${marcadas.join(' ')}) no son las del documento (${[...delDocumento].join(' ')})`)
for (const id of ['D0', 'D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D1-corto', 'D1-FT', 'DT-medio', 'DM-medio', 'DA-medio', 'D0-medio']) debe(esDiaDeRuta(W.days[id]), 'marca_ruta', `${id} es un día de ruta y no debería estar marcado`)
for (const id of ['D1-rapido', 'D1-tarde', 'D1-centro-navona', 'D1-anochecer-espana', 'D1-noche', 'D1-sin-ruta', 'D1-vaticano', 'DC-vaticano', 'DC-roma-antigua', 'DC-pincio-popolo', 'DC-aventino', 'DC-cupula', 'DV-traslado']) debe(!esDiaDeRuta(W.days[id]), 'marca_llegada_vuelta', `${id} es de llegada o vuelta y no está marcado`)

// 2. Las tablas de la llegada y de la vuelta siguen apuntando a listas que existen (los motores las leen por su id).
{
  const ids = new Set()
  const recorrer = (o) => {
    if (Array.isArray(o)) o.forEach(recorrer)
    else if (o && typeof o === 'object') {
      if (typeof o.lista === 'string') ids.add(o.lista)
      if (typeof o.corta === 'string') ids.add(o.corta)
      Object.values(o).forEach(recorrer)
    }
  }
  recorrer(W.llegadas)
  debe(ids.size > 0, 'tablas', 'las tablas de llegada y vuelta no nombran ninguna lista')
  for (const id of ids) debe(Boolean(W.days[id]), 'tablas', `la tabla nombra «${id}» y no está en los días`)
}

// 3. Reorganizar con una reserva a las 9:00 (los Museos): se queda a las 9:00 con y sin las listas de llegada y vuelta.
const sinLlegadaVuelta = { ...W, days: Object.fromEntries(Object.entries(W.days).filter(([, dia]) => esDiaDeRuta(dia))) }
// Una copia de las listas SIN la marca = lo que pasaba antes del arreglo (para comprobar que la marca es la causa).
const sinMarca = { ...W, days: Object.fromEntries(Object.entries(W.days).map(([id, dia]) => { const { solo_llegada_o_vuelta: _quitada, ...resto } = dia; return [id, resto] })) }
const museos = 'Museos Vaticanos y Capilla Sixtina'
const nocturnas = new Set(D.night_experiences.map((n) => n.name))
const ordenDe = (written, items) => {
  const stops = items.map((it, i) => { const o = typeof it === 'string' ? { name: it } : it; return { id: `s${i}`, night: nocturnas.has(o.name), freeTour: o.name === 'Free Tour por Roma', ...o } })
  const r = reorganizarDia({ stops, written, destData: D, hasLunch: true, hasDinner: true })
  return r.order.map((id) => stops.find((s) => s.id === id).name)
}
const casos = [
  ['tres sitios, Museos a las 9:00', ['Coliseo', 'Altar de la Patria', { name: museos, reservedTime: '09:00' }]],
  ['Museos a las 9:00 y Coliseo a las 14:00', [{ name: 'Coliseo', reservedTime: '14:00' }, { name: museos, reservedTime: '09:00' }, 'Panteón']],
  ['Museos a las 9:00 con la Plaza de San Pedro y el Panteón', ['Panteón', 'Plaza de San Pedro', { name: museos, reservedTime: '09:00' }]],
]
for (const [nombre, items] of casos) {
  for (const [etiqueta, written] of [['con las listas de llegada y vuelta', W], ['sin ellas', sinLlegadaVuelta]]) {
    const orden = ordenDe(written, items)
    debe(orden[0] === museos, 'reorganizar', `${nombre} (${etiqueta}): los Museos reservados a las 9:00 no van los primeros: ${orden.join(' > ')}`)
    debe(orden.length === items.length && new Set(orden).size === items.length, 'reorganizar', `${nombre} (${etiqueta}): Reorganizar ha añadido o quitado paradas: ${orden.join(' > ')}`)
  }
  // Con la marca y sin las listas el orden es el mismo: las listas de llegada y vuelta no pintan nada aquí.
  debe(ordenDe(W, items).join('|') === ordenDe(sinLlegadaVuelta, items).join('|'), 'reorganizar', `${nombre}: el orden cambia según haya o no listas de llegada y vuelta`)
}
// La marca es la que lo arregla: un destino SIN marca se comporta como antes (reconoce todas las listas).
{
  const catalogoMarcado = ordenDe(W, casos[0][1])
  const catalogoSinMarca = ordenDe(sinMarca, casos[0][1])
  debe(catalogoMarcado[0] === museos, 'sin_marca', 'con la marca, los Museos van primeros')
  debe(catalogoSinMarca.length === 3, 'sin_marca', 'sin marca Reorganizar sigue devolviendo las tres paradas')
  // (Sin la marca, la lista D1-vaticano se reconoce como un día de ruta y deja los Museos de 9:00 en la tarde: es el fallo de origen.)
  debe(catalogoSinMarca[0] !== museos, 'sin_marca', `sin la marca ya no se reproduce el fallo de origen: ${catalogoSinMarca.join(' > ')}`)
}

console.log(`Prueba Tanda 7 (Reorganizar y las listas de llegada y vuelta): ${comprobaciones} comprobaciones, ${fallos.length} fallos`)
for (const f of fallos.slice(0, 30)) console.log(` - [${f.regla}] ${f.texto}`)
process.exitCode = fallos.length ? 1 : 0
