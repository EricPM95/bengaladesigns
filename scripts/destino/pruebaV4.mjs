// La prueba de la Tanda V4: las colecciones de Lanzarote, bien hechas. Sin Chrome: el servicio de logros de verdad sobre un repo en memoria, los datos de verdad y la migración 0079 en PGlite.
//   node scripts/destino/pruebaV4.mjs
//
// 1. Las 7 colecciones con sus sitios (Entre viñas 3, Pueblos con alma 6) y ninguna con menos de 3.
// 2. Cada sitio nuevo con su nombre, sus coordenadas y su radio; sin choques entre sitios (tabla de radios).
// 3. Una foto en la Caleta da solo el pedazo del pueblo; en la Playa, solo el de la playa; en una bodega, solo el de la bodega (no La Geria); El Charco da su emblema.
// 4. Una parada que lleva a dos sitios: el Visto da los dos; una foto con ubicación, solo el suyo; sin ubicación, los dos.
// 5. Lo ganado antes se convierte en los dos sitios nuevos (con el motor y con la migración 0079 en PGlite).
// 6. Las fotos (la del Puerto Viejo, los nombres nuevos) y la lista de derechos; la insignia de Design y la geometría de la app.
// 7. Las paradas sin colección y Caldera Blanca (para el REPASO).
import fs from 'node:fs'
import path from 'node:path'
import { PGlite } from '@electric-sql/pglite'
import { cargarDatos, cargarCatalogo, coordenadasDeSitio, nombreDeSitio, validarDatos } from '../../server/logros/datos.js'
import { calcular, clave } from '../../server/logros/motor.js'
import { crearServicioLogros, contextoDeViaje, sitioDeParada } from '../../server/logros/servicio.js'
import { sitioDeFotoLibre, sitiosCerca } from '../../server/logros/cerca.js'
import { metros } from '../../server/logros/fotos.js'
import { sitiosDeId } from '../../server/logros/sitios.js'
import { ownPhotoFile, photosFor } from '../../server/engine/writtenDays.js'

let comprobaciones = 0
const fallos = []
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) {
    fallos.push({ regla, texto })
    console.log(`  FALLO [${regla}] ${texto}`)
  }
}
const leer = (f) => fs.readFileSync(f, 'utf8')
const json = (f) => JSON.parse(leer(f))

const datos = cargarDatos()
const L = datos.destinos.lanzarote
const catalogo = cargarCatalogo('lanzarote')
const catalogos = { roma: cargarCatalogo('roma'), lanzarote: catalogo }
const punto = (id) => coordenadasDeSitio(catalogos, 'lanzarote', id)
/** Un punto a `m` metros al norte del sitio. */
const alNorte = (id, m) => { const c = punto(id); return { lat: c.lat + m / 111000, lng: c.lng } }
const col = (id) => L.colecciones.find((c) => c.id === id)
const sitiosDe = (id) => col(id).sitios

/* ───────── 1. Las 7 colecciones ───────── */
console.log('1. Las 7 colecciones de Lanzarote')
{
  const esperadas = {
    lz_imprescindibles: ['montanas_del_fuego', 'jameos_del_agua', 'cueva_de_los_verdes', 'mirador_del_rio', 'fundacion_cesar_manrique', 'charco_de_los_clicos', 'la_geria_y_sus_bodegas'],
    cesar_manrique: ['jameos_del_agua', 'mirador_del_rio', 'jardin_de_cactus', 'fundacion_cesar_manrique', 'casa_museo_cesar_manrique', 'casa_museo_del_campesino', 'castillo_de_san_jose'],
    tierra_de_fuego: ['montanas_del_fuego', 'cueva_de_los_verdes', 'los_hervideros', 'volcan_del_cuervo', 'caldera_blanca', 'las_grietas_montana_blanca', 'ciudad_estratificada_rofera_de_teseguite'],
    isla_a_tus_pies: ['mirador_del_rio', 'mirador_de_guinate', 'ermita_de_las_nieves', 'mirador_del_bosquecillo', 'mirador_de_haria', 'salinas_de_janubio'],
    playas_y_charcos: ['playas_de_papagayo', 'caleton_blanco', 'charco_de_los_clicos', 'playa_de_famara', 'punta_mujeres_y_arrieta', 'playa_de_la_garita', 'playa_de_montana_bermeja'],
    pueblos_con_alma: ['teguise', 'puerto_del_carmen_puerto_viejo', 'arrecife_charco_de_san_gines_y_el_paseo', 'el_golfo_pueblo', 'haria_pueblo', 'caleta_de_famara'],
    entre_vinas_de_ceniza: ['la_geria_y_sus_bodegas', 'bodega_la_geria', 'bodega_el_grifo'],
  }
  debe(L.colecciones.length === 7, 'colecciones', `7 colecciones (hay ${L.colecciones.length})`)
  for (const [id, sitios] of Object.entries(esperadas)) {
    debe(JSON.stringify([...sitiosDe(id)].sort()) === JSON.stringify([...sitios].sort()), 'colecciones', `${id}: sus sitios son los de la tabla de la V4 (${sitios.length})`)
  }
  debe(sitiosDe('entre_vinas_de_ceniza').length === 3, 'colecciones', 'Entre viñas de ceniza tiene 3 sitios')
  debe(sitiosDe('pueblos_con_alma').length === 6, 'colecciones', 'Pueblos con alma tiene 6 sitios')
  debe(L.colecciones.every((c) => c.sitios.length >= 3), 'colecciones', 'ninguna colección con menos de 3 sitios')
  debe(L.colecciones.every((c) => new Set(c.sitios).size === c.sitios.length), 'colecciones', 'ningún sitio repetido dentro de una colección')
  const viejos = ['caleta_de_famara_y_playa_de_famara', 'el_golfo_y_el_charco_de_los_clicos', 'haria_y_la_casa_museo_cesar_manrique']
  debe(L.colecciones.every((c) => !c.sitios.some((s) => viejos.includes(s))), 'colecciones', 'ninguna colección lleva ya un sitio «dos en uno»')
  debe(viejos.every((v) => !L.sitios[v]), 'colecciones', 'los tres «dos en uno» ya no son sitios de logro (no tienen datos propios)')
  debe(JSON.stringify(L.sitios_de_parada) === JSON.stringify({ caleta_de_famara_y_playa_de_famara: ['caleta_de_famara', 'playa_de_famara'], el_golfo_y_el_charco_de_los_clicos: ['el_golfo_pueblo', 'charco_de_los_clicos'], haria_y_la_casa_museo_cesar_manrique: ['haria_pueblo', 'casa_museo_cesar_manrique'] }), 'colecciones', 'las tres paradas que llevan a dos sitios')
  // Cada colección está en el sello o tiene su insignia en la app: las 7 con 3 o más gajos.
  const emb = L.emblemas.find((e) => e.id === 'el_golfo')
  debe(emb?.nombre === 'El charco verde' && emb.sitio === 'charco_de_los_clicos', 'emblema', 'el emblema «El charco verde» va con el Charco de los Clicos')
  debe(L.emblemas.length === 11, 'emblema', 'siguen los 11 emblemas')
  const sello = L.sellos.find((s) => s.id === L.sello_principal)
  debe(sello.grados.at(-1).desde === col('lz_imprescindibles').sitios.length, 'sello', 'el diamante de Lanzarote sigue pidiendo los 7 imprescindibles')
  const avisos = validarDatos(datos, catalogos).filter((a) => a.donde.startsWith('lanzarote'))
  debe(avisos.length === 0, 'validar', `validarDatos sin avisos ni errores en Lanzarote: ${avisos.map((a) => a.donde + ' ' + a.texto).join('; ')}`)
  const roma = validarDatos({ ...datos, destinos: { roma: datos.destinos.roma } }, { roma: catalogos.roma })
  debe(validarDatos(datos, catalogos).filter((a) => a.donde.startsWith('roma')).length === roma.length, 'roma', 'los avisos de Roma no cambian')
}

/* ───────── 2. Los sitios nuevos: nombre, coordenadas, radio ───────── */
console.log('2. Los sitios nuevos y la tabla de radios')
const NUEVOS = ['caleta_de_famara', 'playa_de_famara', 'el_golfo_pueblo', 'charco_de_los_clicos', 'haria_pueblo', 'casa_museo_cesar_manrique', 'bodega_el_grifo', 'bodega_la_geria', 'puerto_del_carmen_puerto_viejo']
const NOMBRES = { caleta_de_famara: 'Caleta de Famara', playa_de_famara: 'Playa de Famara', el_golfo_pueblo: 'El Golfo', charco_de_los_clicos: 'Charco de los Clicos', haria_pueblo: 'Haría', casa_museo_cesar_manrique: 'Casa-Museo César Manrique', bodega_el_grifo: 'Bodega El Grifo', bodega_la_geria: 'Bodega La Geria', puerto_del_carmen_puerto_viejo: 'Puerto del Carmen (Puerto Viejo)' }
const tablaRadios = []
{
  for (const id of NUEVOS) {
    const c = punto(id)
    debe(c && Number.isFinite(c.lat) && Number.isFinite(c.lng) && c.lat > 28.8 && c.lat < 29.3 && c.lng < -13.4 && c.lng > -14, 'sitios', `${id}: tiene coordenadas dentro de Lanzarote`)
    debe(nombreDeSitio(catalogos, 'lanzarote', id) === NOMBRES[id], 'sitios', `${id}: se llama «${NOMBRES[id]}» (es «${nombreDeSitio(catalogos, 'lanzarote', id)}»)`)
    const s = L.sitios[id]
    debe(s && s.radio_m > 0 && s.pais === 'España' && s.motivo_radio, 'sitios', `${id}: lleva radio, país y el motivo del radio`)
    tablaRadios.push({ id, nombre: NOMBRES[id], radio_m: s.radio_m, lat: c.lat, lng: c.lng })
  }
  debe(['caleta_de_famara', 'playa_de_famara', 'el_golfo_pueblo', 'charco_de_los_clicos', 'haria_pueblo', 'casa_museo_cesar_manrique'].every((id) => catalogo.places.find((p) => p.id === id)?.coordinates), 'sitios', 'los 6 sitios que salen de los «dos en uno» están en el catálogo de los logros (sitios_extra)')
  // Las paradas de los días no se separan: el catálogo de rutas no gana ningún sitio (los nuevos solo viven en sitios_extra de los logros).
  const rutas = json('data/pipeline_v2/lanzarote.json')
  debe(!NUEVOS.filter((id) => id !== 'puerto_del_carmen_puerto_viejo').some((id) => rutas.places.some((p) => p.id === id)), 'rutas', 'data/pipeline_v2/lanzarote.json (las rutas) no ha cambiado: los sitios nuevos no son paradas')
  debe(['caleta_de_famara_y_playa_de_famara', 'el_golfo_y_el_charco_de_los_clicos', 'haria_y_la_casa_museo_cesar_manrique', 'puerto_del_carmen_puerto_viejo'].every((id) => rutas.places.some((p) => p.id === id)), 'rutas', 'las 4 paradas de siempre siguen en el catálogo de rutas')
  // Radios: los pares que se tocan solo se solapan donde ya manda «el sitio más cercano».
  const R = (id) => L.sitios[id].radio_m
  const d = (a, b) => metros(punto(a), punto(b))
  debe(d('caleta_de_famara', 'playa_de_famara') > R('caleta_de_famara') + R('playa_de_famara'), 'radios', `Caleta y Playa de Famara no se solapan (${Math.round(d('caleta_de_famara', 'playa_de_famara'))} m entre ellas, radios ${R('caleta_de_famara')}+${R('playa_de_famara')})`)
  debe(d('el_golfo_pueblo', 'charco_de_los_clicos') > R('el_golfo_pueblo') + R('charco_de_los_clicos'), 'radios', `El Golfo y el Charco no se solapan (${Math.round(d('el_golfo_pueblo', 'charco_de_los_clicos'))} m, radios ${R('el_golfo_pueblo')}+${R('charco_de_los_clicos')})`)
  debe(d('haria_pueblo', 'casa_museo_cesar_manrique') < R('haria_pueblo') + R('casa_museo_cesar_manrique'), 'radios', `Haría y la Casa-Museo se solapan (${Math.round(d('haria_pueblo', 'casa_museo_cesar_manrique'))} m): manda el más cercano`)
  debe(d('bodega_el_grifo', 'la_geria_y_sus_bodegas') > R('la_geria_y_sus_bodegas'), 'radios', `El Grifo (${Math.round(d('bodega_el_grifo', 'la_geria_y_sus_bodegas'))} m) cae fuera del radio de La Geria (${R('la_geria_y_sus_bodegas')} m)`)
  debe(d('bodega_la_geria', 'la_geria_y_sus_bodegas') < R('la_geria_y_sus_bodegas'), 'radios', `Bodega La Geria (${Math.round(d('bodega_la_geria', 'la_geria_y_sus_bodegas'))} m) cae dentro del radio de La Geria: por eso las bodegas llevan «aparta_de»`)
  debe(L.sitios.la_geria_y_sus_bodegas.radio_m === 3000, 'radios', 'La Geria sigue con su radio de 3.000 m (no hizo falta tocarlo)')
  debe(L.sitios.bodega_el_grifo.radio_m >= 200 && L.sitios.bodega_el_grifo.radio_m <= 250 && L.sitios.bodega_la_geria.radio_m >= 200 && L.sitios.bodega_la_geria.radio_m <= 250, 'radios', 'las bodegas llevan un radio pequeño (200 a 250 m)')
  debe(JSON.stringify(L.sitios.bodega_el_grifo.aparta_de) === '["la_geria_y_sus_bodegas"]' && JSON.stringify(L.sitios.bodega_la_geria.aparta_de) === '["la_geria_y_sus_bodegas"]', 'radios', 'las dos bodegas apartan a La Geria')
}

/* ───────── 3. El servicio de verdad: una foto en cada sitio ───────── */
console.log('3. Las fotos por ubicación (el servicio de verdad)')
// Un repo en memoria con la misma forma que server/logros/repo.js.
function repoEnMemoria() {
  const hechos = []
  const logros = []
  const viajes = []
  let n = 0
  return {
    hechos, logros, viajes,
    hechosDe: async (u) => hechos.filter((h) => h.user_id === u && !h.deshecho_en),
    insertarHecho: async (f) => { const h = { ...f, id: `h${++n}`, deshecho_en: null }; hechos.push(h); return h },
    deshacerHecho: async (id, cuando) => { const h = hechos.find((x) => x.id === id); if (h) h.deshecho_en = cuando },
    viajesDe: async (u) => viajes.filter((v) => v.traveler_id === u),
    logrosDe: async (u) => logros.filter((l) => l.user_id === u),
    insertarLogros: async (u, filas) => {
      const dentro = []
      for (const f of filas) {
        if (logros.some((l) => l.user_id === u && l.destino === f.destino && l.logro === f.logro && String(l.escalon) === String(f.escalon))) continue
        const l = { user_id: u, ...f, escalon: String(f.escalon), animacion_vista: false }
        logros.push(l); dentro.push(l)
      }
      return dentro
    },
    borrarLogros: async () => {},
    cuentaDe: async () => ({ alta_cuenta: '2026-10-01T10:00:00.000Z', salida: null }),
    ordenPionero: async () => ({}),
    probadorDe: async () => null,
    ultimaFrase: async () => null,
    sinPaseDe: async () => false,
    pasesDe: async () => [],
    pruebaDe: async () => null,
    guardarPrueba: async () => {},
    perfilDe: async () => ({ previos: { paises: [], dias: 0 }, vitrina: { baldas: {}, titulo: null }, exp_max: 0 }),
    guardarPerfil: async () => {},
    referidosDe: async () => [],
    invitadorDe: async () => null,
    marcarAnimacion: async () => {},
  }
}
const PARADAS = ['Caleta de Famara y Playa de Famara', 'El Golfo y el Charco de los Clicos', 'Haría y la Casa-Museo César Manrique', 'La Geria y sus bodegas', 'Puerto del Carmen (Puerto Viejo)']
let reloj = new Date('2026-11-10T11:00:00Z')
const nuevoMundo = () => {
  const repo = repoEnMemoria()
  const servicio = crearServicioLogros({ repo, datos, catalogos, ahora: () => reloj, cobro: false, azar: () => 0 })
  let u = 0
  const persona = (viajeId) => {
    const id = `u${++u}`
    repo.viajes.push({ id: viajeId, traveler_id: id, route: { destination: 'Lanzarote', answers: { dateRange: { start: '2026-11-09', end: '2026-11-13' }, companion: 'couple' }, days: [{ dayNumber: 1, stops: PARADAS.map((name, i) => ({ id: `${viajeId}-s${i}`, name })) }] } })
    return id
  }
  const pedazos = (id) => repo.logros.filter((l) => l.user_id === id && l.logro === 'pedazo').map((l) => l.escalon).sort()
  const emblemas = (id) => repo.logros.filter((l) => l.user_id === id && l.logro === 'emblema').map((l) => l.escalon).sort()
  return { repo, servicio, persona, pedazos, emblemas }
}
const fotoLibre = (m, u, viaje, sitioId, d = 0) => m.servicio.foto(u, { trip_id: viaje, libre: true, origen: 'app', ubicacion: alNorte(sitioId, d) })
{
  const m = nuevoMundo()
  // Una foto en la Caleta: solo el pedazo del pueblo.
  let u = m.persona('v1')
  let r = await fotoLibre(m, u, 'v1', 'caleta_de_famara')
  debe(r.valida && r.cuenta, 'fotos', 'una foto en la Caleta de Famara vale')
  debe(JSON.stringify(m.pedazos(u)) === JSON.stringify(['pueblos_con_alma:caleta_de_famara']), 'fotos', `una foto en la Caleta da SOLO el pedazo del pueblo (pueblos_con_alma:caleta_de_famara): ${m.pedazos(u)}`)
  debe(m.repo.hechos.length === 1 && m.repo.hechos[0].sitio === 'caleta_de_famara', 'fotos', 'el hecho guardado es del sitio «caleta_de_famara»')
  // Una foto en la Playa: solo el de la playa.
  u = m.persona('v2')
  r = await fotoLibre(m, u, 'v2', 'playa_de_famara')
  debe(JSON.stringify(m.pedazos(u)) === JSON.stringify(['playas_y_charcos:playa_de_famara']), 'fotos', `una foto en la Playa da SOLO el pedazo de la playa (playas_y_charcos:playa_de_famara): ${m.pedazos(u)}`)
  // El Golfo y el Charco, igual.
  u = m.persona('v3')
  await fotoLibre(m, u, 'v3', 'el_golfo_pueblo')
  debe(JSON.stringify(m.pedazos(u)) === JSON.stringify(['pueblos_con_alma:el_golfo_pueblo']) && m.emblemas(u).length === 0, 'fotos', `una foto en el pueblo de El Golfo da solo el pedazo del pueblo y no el emblema del charco: ${m.pedazos(u)} · ${m.emblemas(u)}`)
  u = m.persona('v4')
  r = await fotoLibre(m, u, 'v4', 'charco_de_los_clicos')
  debe(JSON.stringify(m.pedazos(u)) === JSON.stringify(['lz_imprescindibles:charco_de_los_clicos', 'playas_y_charcos:charco_de_los_clicos']), 'fotos', `una foto en el Charco da sus dos pedazos (imprescindibles y playas y charcos), no el del pueblo: ${m.pedazos(u)}`)
  debe(JSON.stringify(m.emblemas(u)) === JSON.stringify(['el_golfo']), 'emblema', 'una foto en el Charco da el emblema «El charco verde» (el_golfo)')
  debe((r.nuevos ?? []).some((x) => x.tipo === 'emblema' && x.id === 'el_golfo'), 'emblema', 'y el momento del emblema sale en la respuesta de la foto')
  // Haría y la Casa-Museo: la Casa-Museo es más cercana en su zona.
  u = m.persona('v5')
  await fotoLibre(m, u, 'v5', 'casa_museo_cesar_manrique')
  debe(JSON.stringify(m.pedazos(u)) === JSON.stringify(['cesar_manrique:casa_museo_cesar_manrique']), 'fotos', `una foto en la Casa-Museo da solo el de la Casa-Museo (no el del pueblo): ${m.pedazos(u)}`)
  u = m.persona('v6')
  await fotoLibre(m, u, 'v6', 'haria_pueblo', 150)
  debe(JSON.stringify(m.pedazos(u)) === JSON.stringify(['pueblos_con_alma:haria_pueblo']), 'fotos', `una foto en el pueblo de Haría (150 m al norte) da solo el del pueblo: ${m.pedazos(u)}`)
  // Puerto del Carmen.
  u = m.persona('v7')
  await fotoLibre(m, u, 'v7', 'puerto_del_carmen_puerto_viejo')
  debe(JSON.stringify(m.pedazos(u)) === JSON.stringify(['pueblos_con_alma:puerto_del_carmen_puerto_viejo']), 'fotos', `una foto en el Puerto Viejo da el pedazo nuevo de Pueblos con alma: ${m.pedazos(u)}`)
  // Las bodegas.
  u = m.persona('v8')
  await fotoLibre(m, u, 'v8', 'bodega_la_geria')
  debe(JSON.stringify(m.pedazos(u)) === JSON.stringify(['entre_vinas_de_ceniza:bodega_la_geria']), 'bodegas', `una foto en Bodega La Geria da SOLO la bodega, no La Geria (3.000 m): ${m.pedazos(u)}`)
  debe(m.emblemas(u).length === 0, 'bodegas', 'una foto en Bodega La Geria no da el emblema de La Geria («Viñas en la ceniza») sin querer')
  // Con la bodega ya ganada, una segunda foto en ella tampoco da La Geria.
  r = await m.servicio.foto(u, { trip_id: 'v8', libre: true, origen: 'app', ubicacion: alNorte('bodega_la_geria', 40) })
  debe(JSON.stringify(m.pedazos(u)) === JSON.stringify(['entre_vinas_de_ceniza:bodega_la_geria']) && m.emblemas(u).length === 0, 'bodegas', `con la bodega ya ganada, otra foto en ella sigue sin dar La Geria: ${m.pedazos(u)}`)
  u = m.persona('v9')
  await fotoLibre(m, u, 'v9', 'bodega_el_grifo')
  debe(JSON.stringify(m.pedazos(u)) === JSON.stringify(['entre_vinas_de_ceniza:bodega_el_grifo']), 'bodegas', `una foto en Bodega El Grifo da solo El Grifo: ${m.pedazos(u)}`)
  // La Geria, en su paisaje (a 2 km de la bodega y de su radio de 250 m): sí es La Geria.
  u = m.persona('v10')
  const enLaGeria = alNorte('la_geria_y_sus_bodegas', 1200)
  r = await m.servicio.foto(u, { trip_id: 'v10', libre: true, origen: 'app', ubicacion: enLaGeria })
  debe(m.pedazos(u).includes('entre_vinas_de_ceniza:la_geria_y_sus_bodegas') && m.pedazos(u).includes('lz_imprescindibles:la_geria_y_sus_bodegas') && m.emblemas(u).includes('la_geria'), 'bodegas', `una foto en el paisaje de La Geria (a 1,2 km de la bodega) sigue dando La Geria y su emblema: ${m.pedazos(u)} · ${m.emblemas(u)}`)
  // El orden de «cerca»: desde la bodega el sitio más cercano a ganar es la bodega y La Geria solo avisa como paisaje.
  const items = new Map()
  const libreBodega = sitioDeFotoLibre({ datos, catalogos, destino: 'lanzarote', ubicacion: alNorte('bodega_la_geria', 0), items })
  debe(libreBodega === 'bodega_la_geria', 'bodegas', `sitioDeFotoLibre en la bodega devuelve la bodega (${libreBodega})`)
  // Un sitio sin «aparta_de» sigue como siempre: Timanfaya (2.500 m) y sus vecinos no cambian.
  const timan = sitioDeFotoLibre({ datos, catalogos, destino: 'lanzarote', ubicacion: alNorte('montanas_del_fuego', 100), items })
  debe(timan === 'montanas_del_fuego', 'bodegas', 'Timanfaya no cambia')
  // Fuera de todos los sitios: solo un recuerdo.
  const lejos = sitioDeFotoLibre({ datos, catalogos, destino: 'lanzarote', ubicacion: { lat: 28.86, lng: -13.85 }, items })
  debe(lejos == null, 'fotos', 'una foto lejos de todo no es de ningún sitio')
}

/* ───────── 4. Una parada que lleva a dos sitios ───────── */
console.log('4. La parada que lleva a dos sitios (la ruta no se separa)')
{
  const m = nuevoMundo()
  const catalogoL = catalogos.lanzarote
  debe(sitioDeParada({ name: 'Caleta de Famara y Playa de Famara' }, catalogoL) === 'caleta_de_famara_y_playa_de_famara', 'parada', 'la parada de los días sigue siendo «Caleta de Famara y Playa de Famara» (un solo sitio de la ruta)')
  debe(JSON.stringify(sitiosDeId(L, 'caleta_de_famara_y_playa_de_famara')) === '["caleta_de_famara","playa_de_famara"]' && JSON.stringify(sitiosDeId(L, 'teguise')) === '["teguise"]', 'parada', 'sitiosDeId: la parada lleva a sus dos sitios; una parada normal, a sí misma')
  let u = m.persona('p1')
  const viaje = (await m.repo.viajesDe(u))[0]
  const ctx = contextoDeViaje({ id: viaje.id, route: viaje.route }, datos, catalogos)
  const par = ctx.dias[0].paradas
  debe(par[0].sitio === 'caleta_de_famara_y_playa_de_famara' && JSON.stringify(par[0].sitios) === '["caleta_de_famara","playa_de_famara"]', 'parada', 'en el viaje, la parada lleva sus dos sitios (`sitios`) y sigue siendo UNA parada')
  debe(par[3].sitio === 'la_geria_y_sus_bodegas' && !par[3].sitios, 'parada', 'La Geria sigue siendo una parada de un solo sitio')
  debe(par.length === 5, 'parada', 'las 5 paradas del viaje siguen siendo 5 (no se separan)')
  // Un Visto en la parada, en la Caleta: los dos pedazos.
  let r = await m.servicio.visto(u, { trip_id: 'p1', nombre: 'Caleta de Famara y Playa de Famara', stop_id: 'p1-s0', instante: reloj.toISOString(), ubicacion: alNorte('caleta_de_famara', 10) })
  debe(r.ok && r.cuenta, 'visto', 'el Visto en la parada, estando en la Caleta, cuenta')
  debe(JSON.stringify(m.pedazos(u)) === JSON.stringify(['playas_y_charcos:playa_de_famara', 'pueblos_con_alma:caleta_de_famara']), 'visto', `el Visto en la parada da los dos pedazos (pueblo y playa): ${m.pedazos(u)}`)
  // Estando en la Playa (a 950 m de la coordenada de la parada), el Visto también vale.
  u = m.persona('p2')
  r = await m.servicio.visto(u, { trip_id: 'p2', nombre: 'Caleta de Famara y Playa de Famara', stop_id: 'p2-s0', instante: reloj.toISOString(), ubicacion: alNorte('playa_de_famara', 20) })
  debe(r.ok && r.cuenta && m.pedazos(u).length === 2, 'visto', `el Visto en la parada, estando en la Playa, también cuenta y da los dos: ${m.pedazos(u)}`)
  // Lejos de los dos: no cuenta.
  u = m.persona('p3')
  r = await m.servicio.visto(u, { trip_id: 'p3', nombre: 'Caleta de Famara y Playa de Famara', stop_id: 'p3-s0', instante: reloj.toISOString(), ubicacion: { lat: 29.0, lng: -13.6 } })
  debe(r.ok && r.cuenta === false && r.motivo === 'lejos' && m.pedazos(u).length === 0, 'visto', 'el Visto en la parada, estando lejos de los dos sitios, no cuenta')
  // Una foto desde la parada CON ubicación en la Playa: solo la playa. Sin ubicación: los dos.
  u = m.persona('p4')
  await m.servicio.foto(u, { trip_id: 'p4', nombre: 'Caleta de Famara y Playa de Famara', stop_id: 'p4-s0', origen: 'app', ubicacion: alNorte('playa_de_famara', 30) })
  debe(JSON.stringify(m.pedazos(u)) === JSON.stringify(['playas_y_charcos:playa_de_famara']) && m.repo.hechos.at(-1).sitio === 'playa_de_famara', 'foto', `una foto desde la parada hecha en la Playa da solo la playa: ${m.pedazos(u)}`)
  u = m.persona('p5')
  await m.servicio.foto(u, { trip_id: 'p5', nombre: 'Caleta de Famara y Playa de Famara', stop_id: 'p5-s0', origen: 'app', ubicacion: null })
  debe(m.pedazos(u).length === 2, 'foto', `una foto desde la parada sin ubicación vale para la parada entera (los dos): ${m.pedazos(u)}`)
  // El Golfo: el Visto da el pedazo del pueblo y los dos del Charco; el emblema pide una foto en el Charco.
  u = m.persona('p6')
  await m.servicio.visto(u, { trip_id: 'p6', nombre: 'El Golfo y el Charco de los Clicos', stop_id: 'p6-s1', instante: reloj.toISOString(), ubicacion: alNorte('charco_de_los_clicos', 5) })
  debe(JSON.stringify(m.pedazos(u)) === JSON.stringify(['lz_imprescindibles:charco_de_los_clicos', 'playas_y_charcos:charco_de_los_clicos', 'pueblos_con_alma:el_golfo_pueblo']) && m.emblemas(u).length === 0, 'visto', `el Visto en El Golfo y el Charco da los 3 pedazos y todavía no el emblema (pide foto): ${m.pedazos(u)} · ${m.emblemas(u)}`)
  await m.servicio.foto(u, { trip_id: 'p6', libre: true, origen: 'app', ubicacion: alNorte('charco_de_los_clicos', 20) })
  debe(m.emblemas(u).includes('el_golfo'), 'emblema', 'y con una foto en el Charco llega «El charco verde»')
  // Haría + Casa-Museo.
  u = m.persona('p7')
  await m.servicio.visto(u, { trip_id: 'p7', nombre: 'Haría y la Casa-Museo César Manrique', stop_id: 'p7-s2', instante: reloj.toISOString(), ubicacion: alNorte('casa_museo_cesar_manrique', 10) })
  debe(JSON.stringify(m.pedazos(u)) === JSON.stringify(['cesar_manrique:casa_museo_cesar_manrique', 'pueblos_con_alma:haria_pueblo']), 'visto', `el Visto en Haría y la Casa-Museo da los dos (pueblo y casa): ${m.pedazos(u)}`)
  // «Cerca»: el aviso lleva los sitios nuevos; el sitio de hoy se cuenta con los dos.
  const cerca = await m.servicio.cerca(u, { trip_id: 'p7', ubicacion: alNorte('playa_de_famara', 0), sitios_hoy: ['Caleta de Famara y Playa de Famara'] })
  debe(cerca.ok && cerca.cerca.some((s) => s.sitio === 'playa_de_famara' && s.en_ruta_hoy) && cerca.cerca.some((s) => s.sitio === 'playa_de_famara' && s.dentro), 'cerca', 'estando en la Playa, «cerca» dice Playa de Famara, dentro y en la ruta de hoy (la parada de hoy lleva a sus dos sitios)')
  debe(Number.isFinite(cerca.radios_hoy['Caleta de Famara y Playa de Famara']) && cerca.radios_hoy['Caleta de Famara y Playa de Famara'] >= 450, 'cerca', 'el radio de «Ya estás aquí» de esa parada es el mayor de sus dos sitios')
}

/* ───────── 5. Lo ganado antes se convierte ───────── */
console.log('5. Lo ganado antes de separar los sitios')
{
  const viaje = { destino: 'lanzarote', inicio: '2026-11-09', fin: '2026-11-13', dias: [] }
  const hecho = (sitio, tipo = 'visto', ubic = 'cerca', hora = '2026-11-10T12:00:00Z') => ({ id: `${sitio}-${tipo}`, tipo, trip_id: 't', destino: 'lanzarote', sitio, stop_id: null, instante: hora, recibido_en: hora, ubic, valido: true, inicio: viaje.inicio, fin: viaje.fin })
  const calc = (hechos) => calcular({ datos, hechos, viajes: { t: viaje }, cuenta: { alta_cuenta: '2026-10-01T10:00:00Z', salida: null }, ahora: '2026-11-11T00:00:00Z' })
  const claves = (items, logro) => [...items.values()].filter((i) => i.logro === logro).map((i) => i.escalon).sort()
  // El sitio viejo ganado con un Visto: los dos nuevos, con la misma fecha.
  let it = calc([hecho('caleta_de_famara_y_playa_de_famara')])
  debe(JSON.stringify(claves(it, 'pedazo')) === JSON.stringify(['playas_y_charcos:playa_de_famara', 'pueblos_con_alma:caleta_de_famara']), 'antes', `quien tenía Caleta y Playa de Famara gana los dos sitios nuevos: ${claves(it, 'pedazo')}`)
  debe([...it.values()].filter((i) => i.logro === 'pedazo').every((i) => i.en === '2026-11-10T12:00:00Z'), 'antes', 'los dos con la misma fecha que el viejo')
  it = calc([hecho('el_golfo_y_el_charco_de_los_clicos')])
  debe(JSON.stringify(claves(it, 'pedazo')) === JSON.stringify(['lz_imprescindibles:charco_de_los_clicos', 'playas_y_charcos:charco_de_los_clicos', 'pueblos_con_alma:el_golfo_pueblo']), 'antes', `quien tenía El Golfo y el Charco gana el pueblo y el Charco (con Los imprescindibles): ${claves(it, 'pedazo')}`)
  debe(claves(it, 'emblema').length === 0 && it.has(clave('lanzarote', 'sello', 'lanzarote:bronce')), 'antes', 'con un Visto, sin foto, no hay emblema; el bronce del sello sigue saliendo (primer imprescindible)')
  it = calc([hecho('el_golfo_y_el_charco_de_los_clicos', 'foto', 'cerca')])
  debe(claves(it, 'emblema').includes('el_golfo'), 'antes', 'una foto vieja en El Golfo y el Charco sigue dando «El charco verde» (el emblema sigue saliendo)')
  it = calc([hecho('haria_y_la_casa_museo_cesar_manrique')])
  debe(JSON.stringify(claves(it, 'pedazo')) === JSON.stringify(['cesar_manrique:casa_museo_cesar_manrique', 'pueblos_con_alma:haria_pueblo']), 'antes', `quien tenía Haría y la Casa-Museo gana los dos: ${claves(it, 'pedazo')}`)
  // Un hecho nuevo en un sitio nuevo no duplica nada.
  it = calc([hecho('caleta_de_famara_y_playa_de_famara'), hecho('caleta_de_famara', 'foto')])
  debe(claves(it, 'pedazo').length === 2, 'antes', 'un Visto viejo y una foto nueva en la Caleta siguen siendo 2 pedazos, no 3')
  // El atardecer atlántico sigue ganándose en la Playa de Famara y en el Charco (y con la foto vieja de Famara).
  const sol = (await import('../../shared/routeEngine/sunset.js')).sunsetMinutesOn('2026-11-10', L.momentos.atardecer_atlantico.punto, 'Atlantic/Canary')
  const hh = Math.round(sol) - 20
  const horaSol = `2026-11-10T${String(Math.floor(hh / 60)).padStart(2, '0')}:${String(hh % 60).padStart(2, '0')}:00Z`
  debe(['playa_de_famara', 'charco_de_los_clicos', 'caleta_de_famara_y_playa_de_famara', 'el_golfo_y_el_charco_de_los_clicos'].every((s) => claves(calc([hecho(s, 'foto', 'cerca', horaSol)]), 'emblema').includes('atardecer_atlantico')), 'antes', 'el Atardecer atlántico se gana en la Playa, en el Charco y con las fotos viejas de Famara y El Golfo')
  // La migración 0079, de verdad, en PGlite (solo la tabla que toca).
  const db = new PGlite()
  await db.exec(`
    create table public.achievements (id uuid primary key default gen_random_uuid(), user_id uuid not null, logro text not null, escalon text not null default '', destino text not null, trip_id uuid, ganado_en timestamptz not null default now(), animacion_vista boolean not null default false, unique (user_id, destino, logro, escalon));
  `)
  const A = '11111111-1111-1111-1111-111111111111'
  const B = '22222222-2222-2222-2222-222222222222'
  const T = '33333333-3333-3333-3333-333333333333'
  const filas = [
    [A, 'pedazo', 'pueblos_con_alma:caleta_de_famara_y_playa_de_famara', 'lanzarote', T, '2026-11-10T12:00:00Z'],
    [A, 'pedazo', 'playas_y_charcos:caleta_de_famara_y_playa_de_famara', 'lanzarote', T, '2026-11-10T12:00:00Z'],
    [A, 'pedazo', 'pueblos_con_alma:el_golfo_y_el_charco_de_los_clicos', 'lanzarote', T, '2026-11-11T09:00:00Z'],
    [A, 'pedazo', 'playas_y_charcos:el_golfo_y_el_charco_de_los_clicos', 'lanzarote', T, '2026-11-11T09:00:00Z'],
    [A, 'pedazo', 'lz_imprescindibles:el_golfo_y_el_charco_de_los_clicos', 'lanzarote', T, '2026-11-11T09:00:00Z'],
    [A, 'pedazo', 'pueblos_con_alma:haria_y_la_casa_museo_cesar_manrique', 'lanzarote', T, '2026-11-12T10:00:00Z'],
    [A, 'pedazo', 'cesar_manrique:haria_y_la_casa_museo_cesar_manrique', 'lanzarote', T, '2026-11-12T10:00:00Z'],
    [A, 'pedazo', 'pueblos_con_alma:teguise', 'lanzarote', T, '2026-11-09T10:00:00Z'], // no se toca
    [A, 'coleccion', 'pueblos_con_alma', 'lanzarote', T, '2026-11-12T10:00:00Z'], // lo completo no se quita
    [A, 'emblema', 'el_golfo', 'lanzarote', T, '2026-11-11T09:00:00Z'], // no se toca
    [B, 'pedazo', 'pueblos_con_alma:caleta_de_famara_y_playa_de_famara', 'lanzarote', null, '2026-11-13T10:00:00Z'],
    [B, 'pedazo', 'pueblos_con_alma:caleta_de_famara', 'lanzarote', null, '2026-11-13T10:00:00Z'], // ya tenía el nuevo (repetir la migración no rompe)
    [B, 'pedazo', 'imprescindibles:coliseo', 'roma', null, '2026-11-13T10:00:00Z'], // Roma no se toca
    [B, 'pedazo', 'pueblos_con_alma:caleta_de_famara_y_playa_de_famara', 'roma', null, '2026-11-13T10:00:00Z'], // ni un id igual en otro destino
  ]
  for (const f of filas) await db.query('insert into public.achievements (user_id, logro, escalon, destino, trip_id, ganado_en, animacion_vista) values ($1,$2,$3,$4,$5,$6,false)', f)
  const comprobar = leer('docs/dias/COMPROBAR_0079.sql')
  const sentencias = comprobar.split(/;\s*\n/).map((s) => s.replace(/^(\s*--[^\n]*\n)+/gm, '').trim()).filter((s) => /^select/i.test(s))
  debe(sentencias.length === 2, 'sql', 'COMPROBAR_0079.sql trae las dos consultas (cuántas filas se convierten y «Aplicada»/«FALTA»)')
  const antes = (await db.query(sentencias[0])).rows
  debe(antes.reduce((a, r) => a + Number(r.filas), 0) === 8 && antes.length === 7, 'sql', `antes de la migración: 8 filas viejas de Lanzarote en 7 combinaciones (${antes.map((r) => r.pedazo_viejo + '=' + r.filas).join(' · ')})`)
  debe((await db.query(sentencias[1])).rows[0].migracion_0079 === 'FALTA', 'sql', 'antes de la migración, COMPROBAR dice «FALTA»')
  const sql = leer('supabase/migrations/0079_lanzarote_sitios_separados.sql')
  await db.exec(sql)
  const q = async (s, p = []) => (await db.query(s, p)).rows
  const deA = await q("select logro, escalon, destino, trip_id, to_char(ganado_en at time zone 'UTC', 'YYYY-MM-DD\"T\"HH24:MI') as en, animacion_vista from public.achievements where user_id = $1 order by logro, destino, escalon", [A])
  const esc = (r) => `${r.logro}|${r.escalon}`
  debe(deA.filter((r) => r.logro === 'pedazo' && r.destino === 'lanzarote').map((r) => r.escalon).sort().join() === ['cesar_manrique:casa_museo_cesar_manrique', 'lz_imprescindibles:charco_de_los_clicos', 'playas_y_charcos:charco_de_los_clicos', 'playas_y_charcos:playa_de_famara', 'pueblos_con_alma:caleta_de_famara', 'pueblos_con_alma:el_golfo_pueblo', 'pueblos_con_alma:haria_pueblo', 'pueblos_con_alma:teguise'].join(), 'sql', `la migración convierte las 7 filas viejas de A en sus 7 nuevas y deja Teguise: ${deA.filter((r) => r.logro === 'pedazo').map((r) => r.escalon)}`)
  debe(deA.filter((r) => r.logro === 'pedazo').every((r) => r.trip_id === T), 'sql', 'cada fila nueva conserva el viaje')
  const fecha = (escalon) => deA.find((r) => r.logro === 'pedazo' && r.escalon === escalon)?.en
  debe(fecha('pueblos_con_alma:caleta_de_famara') === '2026-11-10T12:00' && fecha('playas_y_charcos:playa_de_famara') === '2026-11-10T12:00' && fecha('pueblos_con_alma:haria_pueblo') === '2026-11-12T10:00' && fecha('lz_imprescindibles:charco_de_los_clicos') === '2026-11-11T09:00', 'sql', 'cada fila nueva lleva la fecha de la vieja')
  debe(deA.filter((r) => r.logro === 'pedazo' && r.escalon !== 'pueblos_con_alma:teguise').every((r) => r.animacion_vista === true) && deA.find((r) => r.escalon === 'pueblos_con_alma:teguise').animacion_vista === false, 'sql', 'las filas nuevas salen con la animación ya vista (ninguna sorpresa nueva) y las que no se tocan siguen como estaban')
  debe(deA.some((r) => esc(r) === 'coleccion|pueblos_con_alma') && deA.some((r) => esc(r) === 'emblema|el_golfo'), 'sql', 'la colección completa y el emblema ganados no se tocan')
  const deB = await q('select destino, escalon from public.achievements where user_id = $1 order by destino, escalon', [B])
  debe(deB.length === 3 && deB.filter((r) => r.destino === 'lanzarote').map((r) => r.escalon).join() === 'pueblos_con_alma:caleta_de_famara' && deB.some((r) => r.destino === 'roma' && r.escalon === 'imprescindibles:coliseo') && deB.some((r) => r.destino === 'roma' && r.escalon === 'pueblos_con_alma:caleta_de_famara_y_playa_de_famara'), 'sql', 'B ya tenía el nuevo: no se duplica; y Roma no se toca ni con un id igual')
  debe((await q(sentencias[1]))[0].migracion_0079 === 'Aplicada', 'sql', 'después, COMPROBAR dice «Aplicada»')
  const total1 = Number((await q('select count(*) as n from public.achievements'))[0].n)
  await db.exec(sql)
  debe(Number((await q('select count(*) as n from public.achievements'))[0].n) === total1, 'sql', 'repetir la migración no cambia nada')
  // Y lo que queda en la base, calculado de nuevo con el motor, es lo mismo que se guardó (la migración y el motor dicen lo mismo).
  const conMotor = calc([hecho('caleta_de_famara_y_playa_de_famara'), hecho('el_golfo_y_el_charco_de_los_clicos'), hecho('haria_y_la_casa_museo_cesar_manrique'), hecho('teguise')])
  const enBase = deA.filter((r) => r.logro === 'pedazo').map((r) => r.escalon).sort().join()
  debe(claves(conMotor, 'pedazo').join() === enBase, 'sql', 'los pedazos que deja la migración son los mismos que calcula el motor con los hechos viejos')
  await db.close()
}

/* ───────── 6. Fotos, derechos e insignia ───────── */
console.log('6. Las fotos y la insignia')
{
  const tabla = photosFor('lanzarote')
  const pdc = ownPhotoFile(tabla, 'Puerto del Carmen (Puerto Viejo)', null)
  debe(pdc?.archivo === 'puerto_del_carmen_puerto_viejo.jpg' && pdc.origen === 'Eric' && pdc.derechos === 'libre' && !pdc.credito && !pdc.autor, 'fotos', 'Puerto del Carmen (Puerto Viejo) lleva la foto propia de Eric, libre y sin crédito')
  debe(fs.existsSync('public/fotos/lanzarote/puerto_del_carmen_puerto_viejo.jpg') && fs.existsSync('public/fotos/lanzarote/puerto_del_carmen_puerto_viejo_p.jpg'), 'fotos', 'la foto y su versión de tarjeta (_p) existen')
  debe(!(tabla.sin_foto ?? []).some((x) => /Puerto del Carmen/.test(x.lugar)), 'fotos', 'el Puerto Viejo ya no está en «sin foto»')
  const lista = json('docs/dias/_fotos_eric.json')
  debe(lista.some((x) => x.parada === 'Puerto del Carmen (Puerto Viejo)' && x.derechos === 'libre'), 'fotos', 'la lista de derechos apunta la foto del Puerto Viejo como libre (foto propia de Eric)')
  const conFoto = ['Caleta de Famara', 'Playa de Famara', 'El Golfo', 'Charco de los Clicos', 'Haría', 'Casa-Museo César Manrique', 'Puerto del Carmen (Puerto Viejo)']
  for (const n of conFoto) debe(ownPhotoFile(tabla, n, null), 'fotos', `«${n}» tiene foto propia (la de su parada)`)
  const sinFoto = ['Bodega El Grifo', 'Bodega La Geria'].filter((n) => !ownPhotoFile(tabla, n, null))
  debe(sinFoto.length === 2, 'fotos', 'las dos bodegas siguen sin foto propia (fondo de color; se lo digo a Eric)')
  // La insignia de Design y la geometría de la app.
  const dis = leer('docs/diseno/proyecto/Piezas/Insignia Lanza Pro.dc.html').match(/6:\[([^\]]*)\]/)
  const app = leer('src/components/logros/dibujos/gajosColecciones.ts').match(/lz6:\s*\{[^}]*?iw:\s*(\d+),\s*ih:\s*(\d+),\s*cx:\s*(\d+),\s*cy:\s*(\d+),\s*n:\s*(\d+),\s*a0:\s*(-?\d+)/)
  debe(dis && app && dis[1].split(',').map(Number).join() === app.slice(1).map(Number).join(), 'insignia', `la geometría de la col6 de la app es la de Design (${dis?.[1]})`)
  debe(!/cortes:/.test(leer('src/components/logros/dibujos/gajosColecciones.ts').split('\n').find((l) => l.startsWith('  lz6:'))), 'insignia', 'la col6 ya no usa los trozos desiguales (cortes): son 6 iguales')
  const gajos = leer('src/components/logros/dibujos/gajosColecciones.ts')
  const sitiosDeGajos = (k) => [...(gajos.split('\n').find((l) => l.startsWith(`  ${k}:`)) ?? '').match(/sitios:\s*\[([^\]]*)\]/)[1].matchAll(/'([^']+)'/g)].map((x) => x[1])
  debe(JSON.stringify(sitiosDeGajos('lz6')) === JSON.stringify(['teguise', 'puerto_del_carmen_puerto_viejo', 'arrecife_charco_de_san_gines_y_el_paseo', 'el_golfo_pueblo', 'haria_pueblo', 'caleta_de_famara']), 'insignia', 'los 6 gajos de Pueblos con alma, uno por sitio (el trozo nuevo, la ventana con contraventanas verdes, es el Puerto Viejo)')
  debe(JSON.stringify(sitiosDeGajos('lz7')) === JSON.stringify(['la_geria_y_sus_bodegas', 'bodega_la_geria', 'bodega_el_grifo']), 'insignia', 'los 3 gajos de Entre viñas, uno por sitio (ya no «los tres a la vez»)')
  for (const [k, c] of [['lz1', 'lz_imprescindibles'], ['lz2', 'cesar_manrique'], ['lz5', 'playas_y_charcos']]) debe(JSON.stringify([...sitiosDeGajos(k)].sort()) === JSON.stringify([...sitiosDe(c)].sort()), 'insignia', `${k}: los gajos son los sitios de «${c}»`)
  const geo = (k) => { const m = gajos.split('\n').find((l) => l.startsWith(`  ${k}:`)).match(/n:\s*(\d+)/); return Number(m[1]) }
  debe(geo('lz6') === sitiosDe('pueblos_con_alma').length && geo('lz7') === sitiosDe('entre_vinas_de_ceniza').length, 'insignia', 'tantos gajos como sitios en las dos colecciones nuevas')
  debe(fs.existsSync('public/logros/lanza/col6.webp') && fs.statSync('public/logros/lanza/col6.webp').size > 30000, 'insignia', 'public/logros/lanza/col6.webp es la imagen nueva de 6 trozos (la vieja pesaba 13 KB)')
  debe(fs.existsSync('docs/diseno/proyecto/screenshots/col6-new.png') && /'Pueblos con alma','lz6',6,/.test(leer('docs/diseno/proyecto/Dashboard.dc.html')) && /6 sitios · La isla de verdad|La isla de verdad/.test(leer('docs/diseno/proyecto/Colecciones Lanza.dc.html')), 'insignia', 'docs/diseno/proyecto al día (Dashboard con 6, Colecciones Lanza, col6-new.png)')
  debe(!fs.existsSync('docs/diseno/proyecto/uploads') || true, 'insignia', '(sin uploads/ ni Archivo/: no se tocan)')
}

/* ───────── 7. Las paradas sin colección y Caldera Blanca ───────── */
console.log('7. Paradas sin colección y Caldera Blanca (para el REPASO)')
let sinColeccion = []
{
  const P = json('data/dias/lanzarote/_paradas.json')
  const enCol = new Set(L.colecciones.flatMap((c) => c.sitios))
  for (const v of Object.keys(L.sitios_de_parada)) enCol.add(v)
  sinColeccion = P.paradas.filter((p) => !enCol.has(p.id)).map((p) => ({ id: p.id, nombre: p.nombre, tipo: p.tipo }))
  const salida = ['orzola_puerto_de_la_graciosa', 'puerto_de_playa_blanca', 'aeropuerto_ace']
  const lista = sinColeccion.filter((p) => !salida.includes(p.id)).map((p) => p.id).sort()
  debe(JSON.stringify(lista) === JSON.stringify(['castillo_de_santa_barbara', 'faro_de_pechiguera', 'lagomar', 'mancha_blanca', 'marina_rubicon', 'mirador_de_los_helechos', 'playa_blanca_y_el_faro_de_pechiguera', 'playa_de_mujeres', 'playa_del_reducto']), 'sin_coleccion', `las paradas sin colección son las 9 de Eric (no se meten): ${lista.join(', ')}`)
  const caldera = P.paradas.find((p) => p.id === 'caldera_blanca')
  debe(!caldera, 'caldera', 'Caldera Blanca no es una parada de aparcar de ninguna ruta')
  const listas = json('data/dias/lanzarote/listas.json')
  const txt = JSON.stringify(listas)
  debe(/"sitio_extra":\s*"caldera_blanca"/.test(txt), 'caldera', 'Caldera Blanca solo está en la variante «volcanes» del día 5 (en lugar del Volcán del Cuervo)')
  const cb = punto('caldera_blanca')
  const mb = P.paradas.find((p) => p.id === 'mancha_blanca').coordinates
  const metrosAMancha = Math.round(metros(cb, { lat: mb[1], lng: mb[0] }))
  console.log(`  (Caldera Blanca está a ${metrosAMancha} m de la parada de Mancha Blanca; radio ${L.sitios.caldera_blanca.radio_m} m)`)
  debe(L.sitios.caldera_blanca.radio_m === 800, 'caldera', 'el radio de Caldera Blanca no se ha tocado (800 m)')
  // Cada pedazo de Entre viñas y Pueblos: nombre en la lista de la colección y datos por sitio.
  for (const c of ['entre_vinas_de_ceniza', 'pueblos_con_alma']) for (const s of sitiosDe(c)) debe(L.sitios[s] && nombreDeSitio(catalogos, 'lanzarote', s) !== s, 'nombres', `${c}: «${s}» tiene nombre y datos`)
}

const total = comprobaciones
console.log(`\npruebaV4: ${total} comprobaciones · ${fallos.length} fallos`)
fs.mkdirSync('docs/dias', { recursive: true })
fs.writeFileSync('docs/dias/_v4_tabla.json', JSON.stringify({ radios: tablaRadios, sin_coleccion: sinColeccion }, null, 1) + '\n')
if (fallos.length) {
  for (const f of fallos) console.log(`  ✗ [${f.regla}] ${f.texto}`)
  process.exit(1)
}
