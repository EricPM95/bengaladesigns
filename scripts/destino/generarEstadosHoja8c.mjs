// Genera los «estados de ejemplo» de la hoja de logros (Tanda 8C2) con las funciones REALES del servidor (`estadoDestino`, `pendientes`, catálogo de Roma), para que el escaparate enseñe
// exactamente la forma y los números que da `GET /api/logros/estado`. Salida: src/dev/escaparates/datos/hoja_*.json (solo se usan en desarrollo, para las capturas).
//   node scripts/destino/generarEstadosHoja8c.mjs
import fs from 'node:fs'
import { cargarCatalogo, cargarDatos, coordenadasDeSitio, nombreDeSitio } from '../../server/logros/datos.js'
import { clave } from '../../server/logros/motor.js'
import { pendientes, sitiosDeLaRuta, estadoDestino } from '../../server/logros/vistas.js'

const datos = cargarDatos()
const d = datos.destinos.roma
const catalogos = { roma: cargarCatalogo('roma') }

// La ruta de ejemplo: los sitios de 7 de las 11 colecciones, repartidos en 3 días (29 oct – 1 nov: jue, vie, sáb; el sábado es el último día en Roma).
const COLS_EN_RUTA = ['imprescindibles', 'pais_mas_pequeno', 'cuatro_joyas', 'roma_antigua', 'miguel_angel', 'caravaggio', 'miradores']
const rutaSitios = [...new Set(COLS_EN_RUTA.flatMap((id) => d.colecciones.find((c) => c.id === id).sitios))]
const DIA1 = ['coliseo', 'foro_romano_y_palatino', 'circo_maximo']
const viaje = { id: 'viaje-ejemplo', destino: 'roma', inicio: '2026-10-29', fin: '2026-11-01', dias: [{ paradas: DIA1.map((sitio) => ({ sitio })) }, { paradas: rutaSitios.filter((s) => !DIA1.includes(s)).map((sitio) => ({ sitio })) }] }
const NO_VISTOS_EL_ULTIMO_DIA = ['trastevere', 'castillo_de_santangelo', 'termas_de_caracalla', 'plaza_del_campidoglio', 'terraza_del_pincio', 'santa_maria_del_popolo', 'iglesia_de_santa_maria_sopra_minerva']

function itemsDe({ vistos, emblemas, enHoy, hoy }) {
  const items = new Map()
  const ponerItem = (logro, escalon, en) => items.set(clave('roma', logro, escalon), { clave: clave('roma', logro, escalon), logro, escalon: String(escalon), destino: 'roma', trip_id: viaje.id, en })
  const antes = `${hoy}T08:00:00.000Z`
  const ayer = '2026-10-29T10:00:00.000Z'
  for (const c of d.colecciones) {
    const mios = c.sitios.filter((s) => vistos.has(s))
    for (const s of mios) ponerItem('pedazo', `${c.id}:${s}`, enHoy.has(c.id) ? `${hoy}T09:00:00.000Z` : ayer)
    if (mios.length === c.sitios.length) ponerItem('coleccion', c.id, enHoy.has(c.id) ? `${hoy}T09:30:00.000Z` : ayer)
  }
  for (const s of d.sellos) {
    const col = d.colecciones.find((c) => c.id === s.coleccion)
    const n = col.sitios.filter((x) => vistos.has(x)).length
    for (const g of s.grados) if (n >= g.desde) ponerItem('sello', `${s.id}:${g.grado}`, antes)
  }
  for (const e of emblemas) ponerItem('emblema', e, antes)
  return items
}

function estado({ nombre, hoy, vistos, emblemas, enHoy = new Set(), conRuta = true }) {
  const items = itemsDe({ vistos, emblemas, enHoy, hoy })
  const v = conRuta ? viaje : null
  const est = estadoDestino({ datos, destino: 'roma', items, viaje: v, hoy })
  const enRuta = sitiosDeLaRuta(viaje)
  const colecciones = est.colecciones.map((c) => ({ ...c, sitios: c.sitios.map((s) => ({ ...s, nombre: nombreDeSitio(catalogos, 'roma', s.sitio), en_ruta: enRuta.has(s.sitio), ...(coordenadasDeSitio(catalogos, 'roma', s.sitio) ?? {}) })) }))
  const salida = {
    ok: true,
    ...est,
    colecciones,
    pendiente: pendientes({ datos, destino: 'roma', viaje, items, hoy }),
    puntito: false,
    viaje: { id: viaje.id, inicio: viaje.inicio, fin: viaje.fin, hoy },
  }
  fs.mkdirSync('src/dev/escaparates/datos', { recursive: true })
  fs.writeFileSync(`src/dev/escaparates/datos/hoja_${nombre}.json`, JSON.stringify(salida, null, 1))
  console.log(`hoja_${nombre}.json: ${est.sellos.map((s) => `${s.id} ${s.grado ?? '-'} ${s.n}/${s.total}`).join(' · ')} · ${est.colecciones.filter((c) => c.completa).length} completas · ${est.secretos.encontrados} secretos · puede completar ${est.con_tu_ruta_puedes_completar}`)
}

const ver = (extra = []) => new Set([...DIA1, ...extra])
const ultimo = new Set(rutaSitios.filter((s) => !NO_VISTOS_EL_ULTIMO_DIA.includes(s)))
estado({ nombre: 'antes', hoy: '2026-10-20', vistos: new Set(), emblemas: [] })
estado({ nombre: 'dia1', hoy: '2026-10-29', vistos: ver(), emblemas: ['coliseo', 'foro_romano'], enHoy: new Set(['imprescindibles', 'cuatro_joyas', 'roma_antigua']) })
estado({ nombre: 'ultimo', hoy: '2026-11-01', vistos: ultimo, emblemas: ['coliseo', 'foro_romano', 'museos_vaticanos', 'plaza_san_pedro', 'basilica_san_pedro', 'panteon', 'fontana_de_trevi', 'boca_de_la_verdad', 'madrugador', 'nocturno'], enHoy: new Set(['pais_mas_pequeno', 'bernini']) })
estado({ nombre: 'despues', hoy: '2026-11-04', vistos: ultimo, emblemas: ['coliseo', 'foro_romano', 'museos_vaticanos', 'plaza_san_pedro', 'basilica_san_pedro', 'panteon', 'fontana_de_trevi', 'boca_de_la_verdad', 'madrugador', 'nocturno'] })
