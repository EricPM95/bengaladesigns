// Genera el estado «antes del viaje» de LANZAROTE (Tanda LG1, agente B) con las funciones REALES del servidor (como generarEstadosHojaLZ3.mjs), para la hoja 2a de Lanzarote y su captura.
// Salida: src/dev/escaparates/datos/hoja_lz_antes.json (solo desarrollo). También imprime los números de Roma (hoja_antes.json) para compararlos.
//   node scripts/destino/generarEstadosHojaLG1.mjs
import fs from 'node:fs'
import { cargarCatalogo, cargarDatos, coordenadasDeSitio, nombreDeSitio } from '../../server/logros/datos.js'
import { pendientes, sitiosDeLaRuta, estadoDestino } from '../../server/logros/vistas.js'

const DEST = 'lanzarote'
const datos = cargarDatos()
const d = datos.destinos[DEST]
const catalogos = { [DEST]: cargarCatalogo(DEST) }
// Una ruta de 5 días que NO lo lleva todo: así «Con tu ruta puedes completar N de las 7 colecciones» es un número de verdad y no el máximo.
const todos = [...new Set(d.colecciones.flatMap((c) => c.sitios))]
const FUERA = ['playas_de_papagayo', 'caleta_de_famara_y_playa_de_famara', 'jardin_de_cactus']
const rutaSitios = todos.filter((s) => !FUERA.includes(s))
const viaje = { id: 'viaje-ejemplo-lz', destino: DEST, inicio: '2026-11-08', fin: '2026-11-13', dias: [{ paradas: rutaSitios.slice(0, 5).map((sitio) => ({ sitio })) }, { paradas: rutaSitios.slice(5).map((sitio) => ({ sitio })) }] }
const hoy = '2026-11-04'
const est = estadoDestino({ datos, destino: DEST, items: new Map(), viaje, hoy })
const enRuta = sitiosDeLaRuta(viaje)
const colecciones = est.colecciones.map((c) => ({ ...c, sitios: c.sitios.map((s) => ({ ...s, nombre: nombreDeSitio(catalogos, DEST, s.sitio), en_ruta: enRuta.has(s.sitio), ...(coordenadasDeSitio(catalogos, DEST, s.sitio) ?? {}) })) }))
const salida = { ok: true, ...est, colecciones, pendiente: pendientes({ datos, destino: DEST, viaje, items: new Map(), hoy }), puntito: false, viaje: { id: viaje.id, inicio: viaje.inicio, fin: viaje.fin, hoy } }
fs.writeFileSync('src/dev/escaparates/datos/hoja_lz_antes.json', JSON.stringify(salida, null, 1))
console.log(`hoja_lz_antes.json: ${est.sellos.map((s) => `${s.id} ${s.grado ?? '-'} ${s.n}/${s.total} siguiente ${s.siguiente?.grado}`).join(' · ')} · con tu ruta ${est.con_tu_ruta_puedes_completar} de ${est.colecciones.length} · en ruta: ${colecciones.filter((c) => c.en_tu_ruta).map((c) => c.id).join(',')}`)
