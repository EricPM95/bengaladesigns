// Prueba de la Tanda 7, parte DATOS DE LLEGADA Y VUELTA (agente B): _llegada.json, «Para tu zona», la función de noche y las fronteras.
// Sin servidor. Uso: node scripts/destino/pruebaTanda7_datosllegada.mjs [--fronteras]   (con --fronteras escribe la tabla de fronteras en Markdown)
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { centerMinutesOf, leaveMinutesOf, soloLoQueSeEnseña, minutesToHHMM, arrivalModeOf } from '../../shared/arrival/arrivalRules.js'
import { paraTuZona } from '../../shared/arrival/paraTuZona.js'
import { arrivalInfoFor, clearWrittenDaysCache } from '../../server/engine/writtenDays.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const crudo = JSON.parse(fs.readFileSync(path.join(root, 'data/dias/roma/_llegada.json'), 'utf8'))
const info = soloLoQueSeEnseña(crudo)
let fallos = 0
const debe = (ok, regla, msg) => {
  if (!ok) {
    fallos += 1
    console.log(`FALLO ${regla}: ${msg}`)
  }
}

// ── 1. Lo que se enseña: sin taxi, sin empresas ─────────────────────────────────────────────────────────────
const EMPRESAS = /terravision|kipoint|kibag|atral|trenitalia|rome airport bus|romeairportbus|portlink|tibus|italo|flixbus|cotral/i
const TAXI = /taxi/i
// Recorre solo lo que se enseña, sin los campos que son fuente (no se muestran).
const NO_SE_MUESTRAN = new Set(['fuente', 'verificar', 'nota_fuente', 'sin_horario', 'horario_publicado_sin_usar', 'motivo', 'comprobado', 'descartadas', '_nota', '_nota_tanda7', 'puntos', 'solo_en', 'a_id', 'foto', 'foto_url', 'foto_credito', 'id', 'barra'])
function recorre(valor, ruta, fn) {
  if (typeof valor === 'string') return fn(valor, ruta)
  if (Array.isArray(valor)) return valor.forEach((x, i) => recorre(x, `${ruta}[${i}]`, fn))
  if (valor && typeof valor === 'object') for (const [k, v] of Object.entries(valor)) if (!NO_SE_MUESTRAN.has(k)) recorre(v, `${ruta}.${k}`, fn)
}
recorre(info, 'info', (texto, ruta) => {
  debe(!EMPRESAS.test(texto), 'empresa', `${ruta}: «${texto.slice(0, 90)}»`)
  debe(!TAXI.test(texto), 'taxi', `${ruta}: «${texto.slice(0, 90)}»`)
})
// El taxi sigue en el fichero, marcado.
const taxisCrudos = []
recorre(crudo, 'crudo', () => {})
;(function buscaTaxi(v) {
  if (Array.isArray(v)) return v.forEach(buscaTaxi)
  if (v && typeof v === 'object') {
    if (typeof v.nombre === 'string' && TAXI.test(v.nombre)) taxisCrudos.push(v)
    if (typeof v.titulo === 'string' && TAXI.test(v.titulo) && v.no_enseñar) taxisCrudos.push(v)
    Object.values(v).forEach(buscaTaxi)
  }
})(crudo)
debe(taxisCrudos.length >= 5, 'taxi_en_datos', `el taxi debe seguir en los datos (hay ${taxisCrudos.length})`)
debe(taxisCrudos.every((o) => o.no_enseñar === true), 'taxi_marcado', 'algún taxi no lleva no_enseñar: true')
// El servidor tampoco lo sirve
clearWrittenDaysCache?.()
const servido = arrivalInfoFor('roma')
recorre(servido, 'servido', (texto, ruta) => {
  debe(!TAXI.test(texto), 'taxi_servido', `${ruta}: «${texto.slice(0, 80)}»`)
  debe(!EMPRESAS.test(texto), 'empresa_servida', `${ruta}: «${texto.slice(0, 80)}»`)
})
// Frases concretas
const tips = info.medios.avion.tips_llegada.map((t) => t.titulo)
debe(!tips.some((t) => /taxi de Ciampino/i.test(t)), 'tip_taxi_ciampino', 'sigue «El taxi de Ciampino sale más barato»')
const nadie = info.medios.avion.tips_llegada.find((t) => /Nadie te espera sin reserva/.test(t.titulo))
debe(nadie?.texto === 'Nadie te espera sin reserva: si alguien se te acerca en la terminal ofreciendo coche, di que no. Si has reservado el traslado, te esperan con un cartel con tu nombre.', 'tip_nadie', 'texto de «Nadie te espera sin reserva»')
debe(info.medios.avion.textos.llegada_sub === 'Cómo llegar a tu alojamiento desde tu punto de llegada', 'llegada_sub', info.medios.avion.textos.llegada_sub)
debe(info.maleta.texto === 'Déjala en tu alojamiento (pregunta si te la guardan después de dejar la habitación) o en la consigna de Termini y recógela de camino.', 'maleta', info.maleta.texto)
debe(info.ultima_tarde.texto === 'Aprovecha la mañana sin prisas: deja la maleta en la consigna o en tu alojamiento y sal con margen.', 'ultima_tarde', info.ultima_tarde.texto)
debe(!/sal a la hora que te marcamos/i.test(JSON.stringify(info)), 'sal_a_la_hora', 'queda «sal a la hora que te marcamos»')
const puntosAvion = info.medios.avion.puntos
debe(info.medios.avion.puntos.find((p) => p.id === 'fco').al_centro.some((o) => /Leonardo/.test(o.nombre)), 'leonardo', 'falta el Leonardo Express')
// «centro» solo en datos reales: lo que queda en textos nuestros (fuera de distancia, nombres de campo y ZTL)
recorre(info, 'info', (texto, ruta) => {
  if (!/centro/i.test(texto)) return
  const real = /^\d+ km al centro$/.test(texto) || /ZTL del centro histórico/.test(texto) || /centro histórico/.test(texto) || /El centro de Roma es una zona de tráfico limitado/.test(texto) || /Mercato Centrale/.test(texto) || /al centro/i.test(ruta)
  debe(real, 'centro_en_texto_nuestro', `${ruta}: «${texto.slice(0, 100)}»`)
})
// El traslado privado: sin precio ni proveedor
debe(info.para_tu_zona.traslado_privado.precio === null && info.para_tu_zona.traslado_privado.proveedor === null, 'traslado_privado', 'lleva precio o proveedor')
for (const medio of Object.values(info.medios)) for (const p of medio.puntos) debe(!p.traslado || (Object.keys(p.traslado).length === 1 && p.traslado.url), 'traslado_punto', `${p.id} lleva algo más que la url`)

// ── 2. Cada dato con fuente y fecha ──────────────────────────────────────────────────────────────────────────
for (const [id, tr] of Object.entries(info.tramos)) {
  debe(!!tr.fuente && /^\d{4}-\d{2}-\d{2}$/.test(tr.comprobado ?? ''), 'tramo_fuente_fecha', `${id} sin fuente o sin fecha`)
  for (const lado of ['ida', 'vuelta']) {
    const h = tr.horario?.[lado]
    if (h) debe(!!h.fuente && /^\d{4}-\d{2}-\d{2}$/.test(h.comprobado ?? ''), 'horario_fuente_fecha', `${id}.${lado}`)
  }
}
for (const medio of Object.values(info.medios)) for (const p of medio.puntos) for (const lista of [p.al_centro, p.a_la_salida ?? []]) for (const o of lista) {
  if (o.precio || o.horario) debe(o.fuente !== undefined && /^\d{4}-\d{2}-\d{2}$/.test(o.comprobado ?? ''), 'opcion_fuente_fecha', `${p.id}: ${o.nombre}`)
}

// ── 3. La tabla «Para tu zona»: 6 zonas × 5 columnas, y las opciones de Eric ─────────────────────────────────────
const ptz = info.para_tu_zona
const ZONAS = ['termini', 'monti', 'centro', 'plaza_de_espana', 'prati', 'trastevere']
const COLS = { fco: 'fco', cia: 'cia', termini: 'termini', tiburtina: 'tiburtina', civitavecchia: 'civitavecchia' }
const idsOpcion = (z, c) => ptz.zonas[z][c].map((o) => o.tramos.join('+'))
let celdas = 0
for (const z of ZONAS) for (const c of Object.keys(COLS)) {
  const celda = ptz.zonas[z]?.[c]
  debe(Array.isArray(celda) && celda.length > 0, 'celda', `${z}/${c} vacía`)
  celdas += 1
  for (const o of celda ?? []) for (const id of o.tramos) debe(!!info.tramos[id], 'tramo_existe', `${z}/${c}: falta ${id}`)
}
debe(celdas === 30, 'celdas', `${celdas} celdas`)
const espera = {
  'trastevere/fco': ['fl1_fco_trastevere+tranvia_8'],
  'termini/fco': ['leonardo_express', 'bus_fco_termini_18', 'bus_fco_termini_19'],
  'prati/fco': ['leonardo_express+metro_a_termini_ottaviano'],
  'centro/civitavecchia': ['tren_civ_sanpietro+bus_64_sanpietro_argentina', 'tren_civ_termini+bus_40_64_termini_argentina'],
  'plaza_de_espana/cia': ['bus_cia_anagnina+metro_a_anagnina_spagna', 'airlink_cia_termini+metro_a_termini_spagna'],
  'termini/termini': ['andando_termini'],
}
for (const [clave, ids] of Object.entries(espera)) {
  const [z, c] = clave.split('/')
  debe(JSON.stringify(idsOpcion(z, c)) === JSON.stringify(ids), 'tabla_eric', `${clave}: ${JSON.stringify(idsOpcion(z, c))}`)
}
// Trastevere desde Fiumicino: sin Leonardo Express
const tf = paraTuZona(info, { zona: 'trastevere', puntoId: 'fco', hora: '13:00', fecha: '2026-10-20' })
debe(tf.mejor.tipo === 'opcion' && tf.mejor.tramos[0].id === 'fl1_fco_trastevere', 'trastevere_fco', 'la mejor no es el FL1')
debe(![tf.mejor, ...tf.otras].some((o) => o.tramos.some((t) => t.id === 'leonardo_express')), 'trastevere_sin_leonardo', 'sale el Leonardo Express')
debe(tf.mejor.pasaPorTermini === false, 'trastevere_sin_termini', 'el FL1 no pasa por Termini')
// Termini como paso: el Leonardo a Monti sí, con su nota
const mf = paraTuZona(info, { zona: 'monti', puntoId: 'fco', hora: '13:00', fecha: '2026-10-20' })
debe(mf.mejor.pasaPorTermini === true && /otro billete \(1,50 €, vale 100 min\)/.test(mf.mejor.notaOtroBillete), 'monti_termini', 'Monti desde Fiumicino debe pasar por Termini con la nota')
debe(mf.mejor.otroBilleteDesde === 1, 'otro_billete_desde', String(mf.mejor.otroBilleteDesde))
// Zona sin saber: la mejor desde Termini, sin los puntos 2 y 3
const ns = paraTuZona(info, { zona: 'nose', puntoId: 'fco', hora: '13:00', fecha: '2026-10-20' })
debe(ns.sinZona && ns.zona === 'termini' && ns.mejor.tramos[0].id === 'leonardo_express' && JSON.stringify(ns.quitarDelResumen) === '[2,3]', 'zona_nose', JSON.stringify(ns.quitarDelResumen))
// Cada celda con cada punto (también tibus) y a la vuelta
for (const z of [...ZONAS, 'nose']) for (const p of ['fco', 'cia', 'termini', 'tiburtina', 'tibus', 'civitavecchia']) {
  for (const sentido of ['llegada', 'vuelta']) {
    const r = paraTuZona(info, { zona: z, puntoId: p, hora: '12:00', fecha: '2026-10-20', sentido })
    debe(r && r.mejor.tipo === 'opcion' && r.mejor.tramos.length > 0, 'celda_funcion', `${z}/${p}/${sentido}`)
    if (sentido === 'vuelta' && r) debe(r.mejor.tramos[0].de === info.tramos[ptz.zonas[ns && z === 'nose' ? 'termini' : z][r.columna][0].tramos.at(-1)].a, 'vuelta_al_reves', `${z}/${p}`)
  }
}
// Los tramos sin tiempo no inventan uno
for (const id of ['tranvia_8', 'metro_a_termini_spagna', 'tren_civ_sanpietro']) debe(!info.tramos[id].tiempo, 'sin_tiempo', `${id} no debía llevar tiempo`)
debe(info.tramos.leonardo_express.tiempo === '32 min, sin paradas' && info.tramos.leonardo_express.precio === '14 €', 'leonardo_datos', 'precio o tiempo')
debe(ptz.descartadas.some((d) => d.id === 'autobus_fco_prati'), 'descartada', 'el autobús a Prati debía quedar fuera con su motivo')
debe(!JSON.stringify(ptz.zonas).includes('crescenzio'), 'prati_fuera', 'el bus a Via Crescenzio no puede estar en la tabla')
debe(info.tramos.tren_civ_trastevere.nota_parada === 'Mira en tu billete que el tren pare en Roma Trastevere.', 'nota_parada', 'falta la nota del regional')

// ── 4. De noche y a primera hora ─────────────────────────────────────────────────────────────────────────────
const noche = paraTuZona(info, { zona: 'termini', puntoId: 'fco', hora: '23:30', fecha: '2026-10-20' })
debe(noche.modo === 'noche' && noche.mejor.tipo === 'traslado_privado' && noche.aviso === 'A esta hora ya no hay tren: el último Leonardo Express sale del aeropuerto a las 23:23.', 'noche_23_30', JSON.stringify([noche.modo, noche.aviso]))
debe(noche.otras.length === 1 && noche.otras[0].tramos[0].id === 'bus_fco_termini_19', 'noche_otras', 'a las 23:30 solo sigue el autobús con horario hasta las 23:55')
const nocheMonti = paraTuZona(info, { zona: 'monti', puntoId: 'fco', hora: '23:30', fecha: '2026-10-20' })
debe(nocheMonti.modo === 'noche' && nocheMonti.otras.length === 0 && nocheMonti.sinOtras, 'noche_monti', 'Monti de noche no tiene otras con dato')
const tarde = paraTuZona(info, { zona: 'termini', puntoId: 'fco', hora: '23:58', fecha: '2026-10-20' })
debe(tarde.modo === 'noche' && tarde.otras.length === 0, 'noche_23_58', 'pasado el último autobús no queda ninguno')
const unaPunto = paraTuZona(info, { zona: 'termini', puntoId: 'fco', hora: '23:23', fecha: '2026-10-20' })
debe(unaPunto.modo === 'normal' && unaPunto.mejor.tramos[0].id === 'leonardo_express', 'borde_23_23', 'a las 23:23 en punto aún sale')
const pronto = paraTuZona(info, { zona: 'termini', puntoId: 'fco', hora: '05:00', fecha: '2026-10-20' })
debe(pronto.modo === 'noche' && pronto.mejor.tipo === 'traslado_privado' && /aún no hay tren/.test(pronto.aviso) && pronto.otras.length === 0, 'noche_5_00', JSON.stringify([pronto.modo, pronto.aviso, pronto.otras.length]))
const borde = paraTuZona(info, { zona: 'termini', puntoId: 'fco', hora: '05:38', fecha: '2026-10-20' })
debe(borde.modo === 'normal' && borde.mejor.tramos[0].id === 'leonardo_express' && !borde.otras.some((o) => o.tramos[0].id === 'bus_fco_termini_19'), 'borde_5_38', 'a las 5:38 sale el tren; el autobús de 6:00 no cuenta')
// Fuera del tramo de fechas no se aplica
for (const fecha of ['2026-06-13', '2026-12-13', '2027-03-01', null]) {
  const r = paraTuZona(info, { zona: 'termini', puntoId: 'fco', hora: '23:30', fecha })
  debe(r.modo === 'normal' && r.horarioConocido === false, 'fuera_de_fechas', `${fecha}: ${r.modo}`)
}
for (const fecha of ['2026-06-14', '2026-12-12']) debe(paraTuZona(info, { zona: 'termini', puntoId: 'fco', hora: '23:30', fecha }).modo === 'noche', 'dentro_de_fechas', fecha)
// Sin fecha: el día 15 del mes (octubre = mes 9)
debe(paraTuZona(info, { zona: 'termini', puntoId: 'fco', hora: '23:30', mes: 9 }).modo === 'noche', 'mes_15', 'octubre sin fecha')
debe(paraTuZona(info, { zona: 'termini', puntoId: 'fco', hora: '23:30', mes: 0 }).modo === 'normal', 'mes_15_enero', 'enero 2026 está fuera del horario de verano')
// Sin dato para Ciampino, Tiburtina y Civitavecchia: modo normal
for (const p of ['cia', 'tiburtina', 'civitavecchia']) debe(paraTuZona(info, { zona: 'monti', puntoId: p, hora: '23:59', fecha: '2026-10-20' }).modo === 'normal', 'sin_dato', p)
// A la vuelta: el último Leonardo desde Termini es el de las 23:05
const vuelta = paraTuZona(info, { zona: 'monti', puntoId: 'fco', hora: '23:30', fecha: '2026-10-20', sentido: 'vuelta' })
debe(vuelta.modo === 'noche' && vuelta.aviso === 'A esta hora ya no hay tren: el último Leonardo Express sale de Termini a las 23:05.', 'vuelta_noche', String(vuelta.aviso))
const vuelta2 = paraTuZona(info, { zona: 'termini', puntoId: 'fco', hora: '00:30', fecha: '2026-10-20', sentido: 'vuelta' })
debe(vuelta2.modo === 'noche' && vuelta2.otras.length === 1 && vuelta2.otras[0].tramos[0].id === 'bus_fco_termini_19', 'vuelta_bus_pasa_medianoche', 'a la 0:30 aún sale el autobús (último a la 1:00)')

// ── 5. Los márgenes (única fuente) coinciden con el punto 5 del documento ───────────────────────────────────────
const libre = { avion: { fco: 90, cia: 80 }, tren: { termini: 45, tiburtina: 55 }, bus: { tibus: 55 }, ferry: { civitavecchia: 150 } }
const salir = { avion: { fco: 180, cia: 170 }, tren: { termini: 45, tiburtina: 55 }, bus: { tibus: 55 }, ferry: { civitavecchia: 230 } }
const buscaPunto = (modo, id) => info.medios[modo].puntos.find((p) => p.id === id)
const MODO_NOMBRE = { avion: 'avion', tren: 'tren', bus: 'bus', ferry: 'ferry' }
for (const [modo, pts] of Object.entries(libre)) for (const [id, min] of Object.entries(pts)) {
  const p = buscaPunto(modo, id)
  debe(centerMinutesOf('00:00', p) === min - 30 + 0 || Math.round((p.al_centro_min + 30) / 5) * 5 === min, 'libre', `${id}: ${p.al_centro_min}+30 != ${min}`)
  debe(p.al_centro_min + 30 === min, 'libre_min', `${id}: ${p.al_centro_min + 30} != ${min}`)
  const sal = leaveMinutesOf('12:00', modo, info.medios[modo], p)
  debe(12 * 60 - sal === salir[modo][id], 'salir', `${id}: ${12 * 60 - sal} != ${salir[modo][id]}`)
}
debe(!!buscaPunto('bus', 'tibus') && buscaPunto('bus', 'tibus').nombre === 'Estación de autobuses de Tiburtina', 'punto_estacion_autobuses', 'falta el punto de la estación de autobuses de Tiburtina')

// ── 6. Las fronteras por punto (se escriben con --fronteras) ─────────────────────────────────────────────────────
const hh = (m) => minutesToHHMM(((m % 1440) + 1440) % 1440).replace(/^0/, '')
const LIBRE_FILAS = [
  ['antes de las 10:00', 600],
  ['de 10:00 a 11:59', 720],
  ['de 12:00 a 13:59 (en invierno, de 12:00 a 12:59)', 840, 780],
  ['de 14:00 a 14:59', 900],
  ['de 15:00 a 18:59', 1140],
  ['de 19:00 a 20:29', 1230],
  ['de 20:30 a 22:59', 1380],
  ['a las 23:00 o más tarde', null],
]
const VUELO_FILAS = [
  ['cuenta como la noche de antes (solo el traslado)', 'salir < 02:00', 120],
  ['de 5:00 a 8:59 (solo el traslado)', 'salir de 02:00 a 05:59', 360],
  ['de 9:00 a 13:29 (solo el traslado)', 'salir de 06:00 a 10:29', 630],
  ['de 13:30 a 14:59 (mañana corta, sin comida)', 'salir de 10:30 a 11:59', 720],
  ['de 15:00 a 16:59 (última mañana entera, sin comida)', 'salir de 12:00 a 13:59', 840],
  ['de 17:00 a 22:59 (última mañana con comida y tarde libre)', 'salir de 14:00 a 19:59', 1200],
  ['a las 23:00 o más tarde (un día más entero)', 'salir desde 20:00', null],
]
if (process.argv.includes('--fronteras')) {
  const out = []
  const puntos = [['avion', 'fco', 'Fiumicino'], ['avion', 'cia', 'Ciampino'], ['tren', 'termini', 'Termini'], ['tren', 'tiburtina', 'Tiburtina (tren)'], ['bus', 'tibus', 'Estación de autobuses de Tiburtina'], ['ferry', 'civitavecchia', 'Civitavecchia']]
  out.push('### Fronteras de la llegada (hora de llegada ↔ «libre»)', '')
  for (const [modo, id, nombre] of puntos) {
    const p = buscaPunto(modo, id)
    const off = p.al_centro_min + 30
    out.push(`**${nombre}** — libre = llegada + ${Math.floor(off / 60)}:${String(off % 60).padStart(2, '0')}`, '', '| Libre a las… | Llegas (hora de aterrizar o de llegada) |', '|---|---|')
    out.push('| (llegada de 0:00 a 4:59) | un día entero normal: de 0:00 a 4:59 |')
    let desde = 300
    for (const [fila, borde, invierno] of LIBRE_FILAS) {
      const hasta = borde == null ? null : borde - off - 1
      const tramo = hasta == null ? `desde las ${hh(Math.max(desde, 1380 - off))}` : `de ${hh(desde)} a ${hh(hasta)}`
      let extra = ''
      if (invierno != null) extra = ` · en invierno el corte es a las 13:00 (llegada ${hh(invierno - off)})`
      if (borde == null) out.push(`| ${fila} | desde las ${hh(1380 - off)} (lo que pase de la medianoche sigue siendo el mismo día) |`)
      else out.push(`| ${fila} | ${tramo}${extra} |`)
      if (borde != null) desde = borde - off
    }
    out.push('')
  }
  out.push('### Fronteras de la vuelta (hora del vuelo, tren, autobús o barco ↔ salir = hora − margen)', '', 'Las filas del documento son las de Fiumicino (margen 3:00). Para los demás puntos se conserva la misma hora de SALIR; la hora de salida del medio es salir + el margen del punto.', '')
  for (const [modo, id, nombre] of puntos) {
    const p = buscaPunto(modo, id)
    const margen = modo === 'ferry' ? (info.medios.ferry.salir_antes_min ?? 120) + (info.medios.ferry.trayecto_min ?? 110) : (p.salir_antes_min ?? info.medios[modo].salir_antes_min)
    out.push(`**${nombre}** — margen ${Math.floor(margen / 60)}:${String(margen % 60).padStart(2, '0')}`, '', '| Fila | Salida (vuelo / tren / barco) |', '|---|---|')
    let desde = 0
    VUELO_FILAS.forEach(([fila, salirTxt, hastaSalir], i) => {
      const hastaVuelo = hastaSalir == null ? null : hastaSalir + margen - 1
      const empieza = i === 0 ? 0 : desde
      const rango = hastaVuelo == null ? `desde las ${hh(empieza)}` : `de ${hh(empieza)} a ${hh(hastaVuelo)}`
      out.push(`| ${fila} | ${rango} |`)
      if (hastaSalir != null) desde = hastaSalir + margen
    })
    out.push('')
  }
  fs.writeFileSync(path.join(root, 'docs/dias/_fronteras_tmp.md'), out.join('\n'))
  console.log('Fronteras escritas en docs/dias/_fronteras_tmp.md')
}

console.log(fallos === 0 ? 'PRUEBA OK: 0 fallos' : `PRUEBA: ${fallos} fallos`)
process.exitCode = fallos === 0 ? 0 : 1
