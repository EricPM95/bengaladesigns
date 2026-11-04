// Genera los «estados de ejemplo» de la hoja de logros de LANZAROTE (Tanda LZ3, agente B) con las funciones REALES del servidor (como `generarEstadosHoja8c.mjs` para Roma), para las capturas.
// Salida: src/dev/escaparates/datos/hoja_lz_amedias.json y hoja_lz_completa.json (solo se usan en desarrollo, para las capturas).
//   node scripts/destino/generarEstadosHojaLZ3.mjs
import fs from 'node:fs'
import { cargarCatalogo, cargarDatos, coordenadasDeSitio, nombreDeSitio } from '../../server/logros/datos.js'
import { clave } from '../../server/logros/motor.js'
import { pendientes, sitiosDeLaRuta, estadoDestino } from '../../server/logros/vistas.js'

const DEST = 'lanzarote'
const datos = cargarDatos()
const d = datos.destinos[DEST]
const catalogos = { [DEST]: cargarCatalogo(DEST) }
const rutaSitios = [...new Set(d.colecciones.flatMap((c) => c.sitios))]
const DIA1 = ['montanas_del_fuego', 'el_golfo_y_el_charco_de_los_clicos', 'los_hervideros']
const viaje = { id: 'viaje-ejemplo-lz', destino: DEST, inicio: '2026-11-08', fin: '2026-11-13', dias: [{ paradas: DIA1.map((sitio) => ({ sitio })) }, { paradas: rutaSitios.filter((s) => !DIA1.includes(s)).map((sitio) => ({ sitio })) }] }

function itemsDe({ vistos, emblemas, hoy }) {
  const items = new Map()
  const ponerItem = (logro, escalon, en) => items.set(clave(DEST, logro, escalon), { clave: clave(DEST, logro, escalon), logro, escalon: String(escalon), destino: DEST, trip_id: viaje.id, en })
  const en = `${hoy}T09:00:00.000Z`
  for (const c of d.colecciones) {
    const mios = c.sitios.filter((s) => vistos.has(s))
    for (const s of mios) ponerItem('pedazo', `${c.id}:${s}`, en)
    if (mios.length === c.sitios.length) ponerItem('coleccion', c.id, en)
  }
  for (const s of d.sellos) {
    const col = d.colecciones.find((c) => c.id === s.coleccion)
    const n = col.sitios.filter((x) => vistos.has(x)).length
    for (const g of s.grados) if (n >= g.desde) ponerItem('sello', `${s.id}:${g.grado}`, en)
  }
  for (const e of emblemas) ponerItem('emblema', e, en)
  return items
}

function estado({ nombre, hoy, vistos, emblemas }) {
  const items = itemsDe({ vistos, emblemas, hoy })
  const est = estadoDestino({ datos, destino: DEST, items, viaje, hoy })
  const enRuta = sitiosDeLaRuta(viaje)
  const colecciones = est.colecciones.map((c) => ({ ...c, sitios: c.sitios.map((s) => ({ ...s, nombre: nombreDeSitio(catalogos, DEST, s.sitio), en_ruta: enRuta.has(s.sitio), ...(coordenadasDeSitio(catalogos, DEST, s.sitio) ?? {}) })) }))
  const salida = { ok: true, ...est, colecciones, pendiente: pendientes({ datos, destino: DEST, viaje, items, hoy }), puntito: false, viaje: { id: viaje.id, inicio: viaje.inicio, fin: viaje.fin, hoy } }
  fs.mkdirSync('src/dev/escaparates/datos', { recursive: true })
  fs.writeFileSync(`src/dev/escaparates/datos/hoja_lz_${nombre}.json`, JSON.stringify(salida, null, 1))
  console.log(`hoja_lz_${nombre}.json: ${est.sellos.map((s) => `${s.id} ${s.grado ?? '-'} ${s.n}/${s.total}`).join(' · ')} · ${est.colecciones.filter((c) => c.completa).length} completas · ${est.secretos.encontrados} secretos`)
}

const emblemasTodos = d.emblemas.map((e) => e.id)
estado({ nombre: 'amedias', hoy: '2026-11-10', vistos: new Set([...DIA1, 'jameos_del_agua', 'mirador_del_rio', 'cueva_de_los_verdes', 'jardin_de_cactus']), emblemas: ['timanfaya', 'jameos', 'mirador_del_rio', 'el_golfo'] })
estado({ nombre: 'completa', hoy: '2026-11-13', vistos: new Set(rutaSitios), emblemas: emblemasTodos })
