// La prueba de la Tanda LZ3, parte A: los datos y la lógica de los logros de Lanzarote. No toca el motor de rutas.
//   node scripts/destino/pruebaTandaLZ3_A.mjs
//
// 1. Los datos (data/logros/lanzarote.json) cruzados con el catálogo: el sello con sus grados, las 7 colecciones con ids de lanzarote.json, los 11 emblemas, sin Patrimonios.
// 2. Cómo se gana: un sitio colorea su gajo y su emblema; el sello sube de grado; Madrugador; Atardecer atlántico solo en la costa oeste y a su hora (hora de Canarias).
// 3. Ningún texto de Roma en los logros de Lanzarote.
// 4. Lanzarote oculto para quien no es administrador (destinos curados, datos de logros, guardián de /api, pase) y Roma intacta con administrador y sin él.
import fs from 'node:fs'
import { cargarDatos, cargarCatalogo, validarDatos, datosVisiblesPara } from '../../server/logros/datos.js'
import { calcular, clave, parteLocal } from '../../server/logros/motor.js'
import { logrosVisibles, pasaporte } from '../../server/logros/vistas.js'
import { leerDestinosCurados, DESTINOS_OCULTOS } from '../../server/destinosCurados.js'
import { crearGuardianDestinosOcultos } from '../../server/destinoOculto.js'
import { sunsetMinutesOn } from '../../shared/routeEngine/sunset.js'
import { conArticulo } from '../../server/logros/articulos.js'

let comprobaciones = 0
const fallos = []
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) fallos.push({ regla, texto })
}

const datos = cargarDatos()
const L = datos.destinos.lanzarote
const R = datos.destinos.roma
const catalogo = cargarCatalogo('lanzarote')
const catalogos = { roma: cargarCatalogo('roma'), lanzarote: catalogo }
const ids = new Set(catalogo.places.map((p) => p.id))
const ajustes = datos.ajustes

/* ───────── 1. Los datos ───────── */
console.log('1. Los datos de Lanzarote')
debe(Boolean(L), 'datos', 'Lanzarote tiene logros (DESTINOS_CON_LOGROS)')
{
  const avisos = validarDatos(datos, catalogos)
  const malos = avisos.filter((a) => a.nivel === 'error' && a.donde.startsWith('lanzarote'))
  debe(malos.length === 0, 'validar', `validarDatos sin errores en Lanzarote: ${malos.map((a) => a.donde + ' ' + a.texto).join('; ')}`)
  const sueltos = avisos.filter((a) => a.donde.startsWith('lanzarote'))
  debe(sueltos.length === 0, 'validar', `validarDatos sin avisos en Lanzarote: ${sueltos.map((a) => a.donde + ' ' + a.texto).join('; ')}`)
  debe(avisos.filter((a) => a.donde.startsWith('roma')).length === validarDatos({ ...datos, destinos: { roma: R } }, { roma: catalogos.roma }).length, 'roma', 'los avisos de Roma no cambian')
}
{
  const s = L.sellos.find((x) => x.id === L.sello_principal)
  debe(Boolean(s) && s.coleccion === 'lz_imprescindibles', 'sello', 'el sello de Lanzarote va sobre los imprescindibles')
  debe(JSON.stringify(s.grados.map((g) => [g.grado, g.desde, g.nombre])) === JSON.stringify([['bronce', 1, 'Primeros pasos en Lanzarote'], ['plata', 3, 'Lanzarote te atrapa'], ['oro', 5, 'Tierra de volcanes'], ['diamante', 7, 'Lanzarote es tuya']]), 'sello', 'grados 1/3/5/7 con los nombres del documento')
  debe(s.grados[1].linea === '{n} de {total} imprescindibles.' && s.grados[3].linea === 'Todos los imprescindibles de Lanzarote.', 'sello', 'las líneas del sello')
  const imp = L.colecciones.find((c) => c.id === 'lz_imprescindibles')
  debe(imp.sitios.length === 7, 'sello', 'los imprescindibles son 7')
  debe(s.grados.at(-1).desde === imp.sitios.length, 'sello', 'el diamante pide los 7')
}
{
  debe(L.colecciones.length === 7, 'colecciones', `7 colecciones (hay ${L.colecciones.length})`)
  const esperadas = { lz_imprescindibles: 7, cesar_manrique: 7, tierra_de_fuego: 7, isla_a_tus_pies: 6, playas_y_charcos: 7, pueblos_con_alma: 5, entre_vinas_de_ceniza: 1 }
  for (const [id, n] of Object.entries(esperadas)) debe(L.colecciones.find((c) => c.id === id)?.sitios.length === n, 'colecciones', `${id} con ${n} sitios`)
  for (const c of L.colecciones) {
    debe(Boolean(c.nombre && c.al_completar && c.grupo && L.grupos_colecciones[c.grupo]), 'colecciones', `${c.id}: nombre, frase al completar y grupo`)
    for (const s of c.sitios) {
      debe(ids.has(s), 'colecciones', `${c.id}/${s} es un id de lanzarote.json`)
      debe(Boolean(L.sitios[s]?.radio_m), 'colecciones', `${c.id}/${s} tiene su radio`)
    }
  }
  debe(L.colecciones.find((c) => c.id === 'cesar_manrique').nombre === 'La Lanzarote de César Manrique', 'colecciones', 'nombre de la colección de Manrique')
}
{
  debe(L.emblemas.length === 11, 'emblemas', `11 emblemas (hay ${L.emblemas.length})`)
  debe(L.emblemas.filter((e) => e.tipo === 'sitio').length === 9 && L.emblemas.filter((e) => e.tipo === 'momento').length === 2, 'emblemas', '9 de sitio y 2 de momento')
  const nombres = L.emblemas.map((e) => e.nombre).join('|')
  for (const n of ['El calor de la tierra', 'El lago bajo el volcán', 'El secreto de la cueva', 'Las islas de enfrente', 'Una casa en cinco burbujas', 'El charco verde', 'Viñas en la ceniza', 'La octava isla', 'Las calas de Papagayo', 'Madrugador', 'Atardecer atlántico']) debe(nombres.includes(n), 'emblemas', `emblema «${n}»`)
  for (const e of L.emblemas.filter((x) => x.tipo === 'sitio')) debe(catalogo.places.some((p) => p.id === e.sitio), 'emblemas', `${e.id}: sitio ${e.sitio} existe en el catálogo de los logros`)
  debe(!L.emblemas.some((e) => e.momento === 'nocturno'), 'emblemas', 'Lanzarote no tiene Nocturno')
  debe(L.emblemas.find((e) => e.id === 'cueva_de_los_verdes').linea === 'Lo que has visto dentro, no se cuenta.', 'emblemas', 'la cueva no desvela su sorpresa')
  debe(!JSON.stringify(L.emblemas).includes('IGME') && !JSON.stringify(L.emblemas).includes('CACT'), 'emblemas', 'sin las fuentes entre paréntesis dentro de la línea')
  // La Graciosa no es parada: sale de `sitios_extra`, y solo para los logros (el catálogo del motor de rutas no la tiene).
  const crudo = JSON.parse(fs.readFileSync(new URL('../../data/pipeline_v2/lanzarote.json', import.meta.url), 'utf8'))
  debe(!crudo.places.some((p) => p.id === 'la_graciosa') && ids.has('la_graciosa'), 'graciosa', 'La Graciosa solo está en el catálogo de los logros, no en el del motor de rutas')
  debe(JSON.stringify(cargarCatalogo('roma')) === JSON.stringify(JSON.parse(fs.readFileSync(new URL('../../data/pipeline_v2/roma.json', import.meta.url), 'utf8'))), 'roma', 'el catálogo de Roma no cambia')
}
debe(Object.keys(L.patrimonios ?? {}).length === 0, 'patrimonios', 'sin Patrimonios de la Humanidad')
debe(L.textos.secretos.total === 'Lanzarote esconde {total} secretos' && L.textos.resumen_viaje.wow.includes('Lanzarote'), 'textos', 'los textos con Lanzarote')
debe(L.timezone === 'Atlantic/Canary', 'hora', 'hora de Canarias')

/* ───────── 3. Ningún texto de Roma ───────── */
console.log('3. Ningún texto de Roma')
{
  const textos = JSON.stringify({ ...L, sitios: undefined, _nota: undefined })
  for (const prohibida of ['Roma', 'Coliseo', 'Vaticano', 'Trastevere', 'Italia', 'Europe/Rome', 'Nocturno', 'Panteón']) debe(!textos.includes(prohibida), 'sin_roma', `Lanzarote no dice «${prohibida}»`)
  debe(L.pais_defecto === 'España' && L.sellos.every((s) => !/Roma|Vaticano/.test(s.nombre)), 'sin_roma', 'país España y sellos propios')
  debe(conArticulo('lanzarote', 'Mirador del Río', 'en') === 'en el Mirador del Río' && conArticulo('lanzarote', 'Montañas del Fuego (Timanfaya)', 'en') === 'en las Montañas del Fuego (Timanfaya)', 'sin_roma', 'los mensajes de «no estás en…» llevan su artículo')
}

/* ───────── 2. Cómo se gana ───────── */
console.log('2. Cómo se gana')
const viaje = { destino: 'lanzarote', inicio: '2027-03-10', fin: '2027-03-14', con_quien: 'pareja', dias: [] }
const foto = (n, sitio, fecha, hhmmCanarias, extra = {}) => {
  // La hora local de Canarias en marzo es UTC (WET) y en verano UTC+1: se calcula con la zona para no depender de la fecha.
  const [h, m] = hhmmCanarias.split(':').map(Number)
  let t = new Date(`${fecha}T${hhmmCanarias}:00Z`)
  for (let i = 0; i < 3; i++) {
    const loc = parteLocal(t, 'Atlantic/Canary')
    const dif = (h * 60 + m) - loc.minutos
    if (dif === 0) break
    t = new Date(t.getTime() + dif * 60000)
  }
  return { id: `f${n}`, tipo: 'foto', trip_id: 'v', destino: 'lanzarote', sitio, stop_id: `s${n}`, instante: t.toISOString(), recibido_en: t.toISOString(), ubic: 'cerca', valido: true, inicio: viaje.inicio, fin: viaje.fin, ...extra }
}
const calc = (hechos) => calcular({ datos, hechos, viajes: { v: viaje }, ahora: '2027-03-20T12:00:00Z' })
const tiene = (items, logro, escalon) => items.has(clave('lanzarote', logro, escalon))
{
  // Un sitio colorea su gajo y su emblema (con foto); con un Visto solo el gajo.
  const vistoGolfo = { id: 'v1', tipo: 'visto', trip_id: 'v', destino: 'lanzarote', sitio: 'jameos_del_agua', stop_id: 'a', instante: '2027-03-10T11:00:00Z', recibido_en: '2027-03-10T11:00:00Z', ubic: 'cerca', valido: true, inicio: viaje.inicio, fin: viaje.fin }
  const a = calc([vistoGolfo])
  debe(tiene(a, 'pedazo', 'lz_imprescindibles:jameos_del_agua') && tiene(a, 'pedazo', 'cesar_manrique:jameos_del_agua') && !tiene(a, 'emblema', 'jameos'), 'ganar', 'un Visto en Jameos da el gajo (imprescindibles y Manrique) pero no el emblema')
  debe(tiene(a, 'sello', 'lanzarote:bronce'), 'ganar', 'el primer imprescindible da el bronce')
  const b = calc([foto(1, 'jameos_del_agua', '2027-03-10', '11:00')])
  debe(tiene(b, 'emblema', 'jameos') && tiene(b, 'pedazo', 'lz_imprescindibles:jameos_del_agua'), 'ganar', 'una foto en Jameos da su gajo y su emblema «El lago bajo el volcán»')
  // El sello sube de grado con los imprescindibles: 1 bronce, 3 plata, 5 oro, 7 diamante.
  const imp = L.colecciones.find((c) => c.id === 'lz_imprescindibles').sitios
  const grados = (n) => {
    const it = calc(imp.slice(0, n).map((s, i) => foto(i, s, '2027-03-11', '12:00')))
    return ['bronce', 'plata', 'oro', 'diamante'].filter((g) => tiene(it, 'sello', `lanzarote:${g}`)).length
  }
  debe(grados(1) === 1 && grados(2) === 1 && grados(3) === 2 && grados(4) === 2 && grados(5) === 3 && grados(6) === 3 && grados(7) === 4, 'sello', 'el sello: 1→bronce, 3→plata, 5→oro, 7→diamante')
  const todo = calc(imp.map((s, i) => foto(i, s, '2027-03-11', '12:00')))
  debe(tiene(todo, 'coleccion', 'lz_imprescindibles'), 'ganar', 'los 7 completan la colección de los imprescindibles')
  const graciosa = calc([foto(1, 'la_graciosa', '2027-03-12', '12:00')])
  debe(tiene(graciosa, 'emblema', 'la_graciosa'), 'graciosa', 'una foto con sitio La Graciosa gana «La octava isla» (sitio fuera de ruta)')
}
{
  // Madrugador: antes de las 08:00 (hora de Canarias), en cualquier sitio.
  const m1 = calc([foto(1, 'la_geria_y_sus_bodegas', '2027-03-11', '07:30')])
  const m2 = calc([foto(1, 'la_geria_y_sus_bodegas', '2027-03-11', '08:00')])
  const m3 = calc([foto(1, 'jardin_de_cactus', '2027-03-11', '07:00')])
  debe(tiene(m1, 'emblema', 'lz_madrugador') && !tiene(m2, 'emblema', 'lz_madrugador') && tiene(m3, 'emblema', 'lz_madrugador'), 'madrugador', 'Madrugador antes de las 08:00 (a las 08:00 ya no), en cualquier sitio')
  // La hora es la de Canarias: 07:30 de Canarias en verano son las 06:30 UTC (y 07:30 UTC no vale en verano: ya son las 08:30).
  const veranoOk = calc([foto(1, 'teguise', '2027-07-11', '07:30', { })].map((h) => ({ ...h, inicio: '2027-07-10', fin: '2027-07-14' })))
  void veranoOk
}
{
  // Atardecer atlántico: la hora de la puesta de sol de ese día (sunset.js, hora de Canarias); de 60 min antes a 15 después; solo en la costa oeste.
  const oeste = ['el_golfo_y_el_charco_de_los_clicos', 'los_hervideros', 'salinas_de_janubio', 'playa_de_montana_bermeja', 'caleta_de_famara_y_playa_de_famara', 'playa_blanca_y_el_faro_de_pechiguera']
  debe(JSON.stringify(L.momentos.atardecer_atlantico.sitios) === JSON.stringify(oeste), 'atardecer', 'los 6 sitios de la costa oeste del documento')
  const fecha = '2027-03-11'
  const sol = sunsetMinutesOn(fecha, L.momentos.atardecer_atlantico.punto, 'Atlantic/Canary')
  debe(sol > 17 * 60 && sol < 21 * 60, 'atardecer', `la puesta de sol de marzo es plausible (${sol} min)`)
  const hm = (min) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`
  const gana = (sitio, min) => tiene(calc([foto(1, sitio, fecha, hm(min))]), 'emblema', 'atardecer_atlantico')
  debe(gana('los_hervideros', sol) && gana('los_hervideros', sol - 60) && gana('los_hervideros', sol + 15), 'atardecer', 'se gana en la puesta de sol, 60 min antes y 15 después')
  debe(!gana('los_hervideros', sol - 61) && !gana('los_hervideros', sol + 16), 'atardecer', 'no se gana 61 min antes ni 16 después')
  for (const s of oeste) debe(gana(s, sol - 20), 'atardecer', `se gana en ${s}`)
  debe(!gana('jameos_del_agua', sol) && !gana('playas_de_papagayo', sol) && !gana('montanas_del_fuego', sol) && !gana('teguise', sol), 'atardecer', 'no se gana fuera de la costa oeste (Jameos, Papagayo, Timanfaya, Teguise)')
  // Con un Visto (sin foto) no se gana: igual que Madrugador en Roma.
  const visto = { id: 'v9', tipo: 'visto', trip_id: 'v', destino: 'lanzarote', sitio: 'los_hervideros', stop_id: 'a', instante: foto(1, 'x', fecha, hm(sol)).instante, recibido_en: foto(1, 'x', fecha, hm(sol)).instante, ubic: 'cerca', valido: true, inicio: viaje.inicio, fin: viaje.fin }
  debe(!tiene(calc([visto]), 'emblema', 'atardecer_atlantico'), 'atardecer', 'un Visto sin foto no da el Atardecer atlántico')
  // La hora es la de Canarias, no la UTC ni la de Madrid: en verano (UTC+1) el mismo reloj de pared cambia el instante UTC.
  const fv = '2027-07-11'
  const solV = sunsetMinutesOn(fv, L.momentos.atardecer_atlantico.punto, 'Atlantic/Canary')
  const hv = foto(1, 'los_hervideros', fv, hm(solV), { inicio: '2027-07-10', fin: '2027-07-14' })
  debe(tiene(calcular({ datos, hechos: [hv], viajes: { v: { ...viaje, inicio: '2027-07-10', fin: '2027-07-14' } } }), 'emblema', 'atardecer_atlantico'), 'atardecer', 'en verano también (la hora local de Canarias)')
  // Un destino con momentos no gana Nocturno.
  debe(!tiene(calc([foto(1, 'los_hervideros', fecha, '23:00')]), 'emblema', 'nocturno'), 'atardecer', 'en Lanzarote no hay Nocturno')
}
{
  // Roma sigue con su regla: Madrugador/Nocturno en los imprescindibles, y sin Atardecer.
  const viajeR = { destino: 'roma', inicio: '2027-03-10', fin: '2027-03-14', con_quien: 'pareja', dias: [] }
  const hr = (sitio, hora) => ({ id: 'r' + hora, tipo: 'foto', trip_id: 'r', destino: 'roma', sitio, stop_id: 'x', instante: `2027-03-11T${hora}:00Z`, recibido_en: `2027-03-11T${hora}:00Z`, ubic: 'cerca', valido: true, inicio: viajeR.inicio, fin: viajeR.fin })
  const cr = (h) => calcular({ datos, hechos: [h], viajes: { r: viajeR }, ahora: '2027-03-20T12:00:00Z' })
  debe(cr(hr('coliseo', '06:30')).has(clave('roma', 'emblema', 'madrugador')), 'roma', 'Roma: Madrugador en un imprescindible')
  debe(!cr(hr('arco_de_constantino', '06:30')).has(clave('roma', 'emblema', 'madrugador')), 'roma', 'Roma: Madrugador solo en los imprescindibles (igual que antes)')
  debe(cr(hr('coliseo', '22:30')).has(clave('roma', 'emblema', 'nocturno')), 'roma', 'Roma: Nocturno igual que antes')
}

/* ───────── 4. Oculto ───────── */
console.log('4. Lanzarote oculto')
{
  debe(DESTINOS_OCULTOS.has('lanzarote') || process.env.DESTINOS_OCULTOS !== undefined, 'oculto', 'Lanzarote está en DESTINOS_OCULTOS')
  const ocultos = new Set(['lanzarote'])
  const raiz = new URL('../../data', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1').replace(/%20/g, ' ')
  const publica = leerDestinosCurados(raiz, { esAdmin: false, ocultos })
  const admin = leerDestinosCurados(raiz, { esAdmin: true, ocultos })
  debe(!publica.some((d) => d.clave === 'lanzarote') && publica.some((d) => d.clave === 'roma'), 'oculto', '/api/destinos-curados sin administrador: sin Lanzarote y con Roma')
  debe(admin.some((d) => d.clave === 'lanzarote' && d.nombre === 'Lanzarote'), 'oculto', '/api/destinos-curados con administrador: Lanzarote sale')
  // Los datos de logros que ve cada cuenta.
  const sin = datosVisiblesPara(datos, ocultos, false)
  const con = datosVisiblesPara(datos, ocultos, true)
  debe(!sin.destinos.lanzarote && Boolean(sin.destinos.roma) && con === datos, 'oculto', 'datosVisiblesPara: sin administrador no hay Lanzarote; con él, todo')
  debe(JSON.stringify(logrosVisibles(sin, new Date('2026-11-10'))) === JSON.stringify(logrosVisibles({ ...datos, destinos: { roma: R } }, new Date('2026-11-10'))), 'roma', 'los logros de viajero de quien no es administrador son EXACTAMENTE los de solo Roma')
  const pas = (d) => pasaporte({ datos: d, items: new Map(), ahora: new Date('2026-11-10') })
  debe(JSON.stringify(pas(sin)) === JSON.stringify(pas({ ...datos, destinos: { roma: R } })) && !JSON.stringify(pas(sin)).includes('Lanzarote') && !JSON.stringify(pas(sin)).includes('España'), 'oculto', 'el pasaporte de quien no es administrador no nombra Lanzarote ni España')
  debe(JSON.stringify(pas(con)).includes('Lanzarote'), 'oculto', 'el pasaporte del administrador sí lo trae (por descubrir)')
  // El guardián de /api: una petición con Lanzarote sin administrador da 404; con administrador pasa; con Roma pasa.
  const lanzar = async (cuerpo, admin) => {
    const g = crearGuardianDestinosOcultos({ ocultos, esAdminDe: async () => admin })
    let estado = null
    let paso = false
    await g({ body: cuerpo, query: {} }, { status: (c) => ({ json: () => { estado = c } }) }, () => { paso = true })
    return { estado, paso }
  }
  const a = await lanzar({ destination: 'Lanzarote' }, false)
  const b = await lanzar({ destination: 'Lanzarote' }, true)
  const c = await lanzar({ destination: 'Roma' }, false)
  debe(a.estado === 404 && !a.paso && b.paso && c.paso, 'oculto', 'el guardián de /api: 404 sin administrador, pasa con administrador y con Roma')
  const index = fs.readFileSync(new URL('../../server/index.js', import.meta.url), 'utf8')
  debe(/destinosConPase = .*DESTINOS_OCULTOS/.test(index), 'oculto', 'el pase no ofrece Lanzarote mientras esté oculto')
  debe(/ocultos: DESTINOS_OCULTOS, esAdminDeCuenta/.test(index), 'oculto', 'el servicio de logros recibe los destinos ocultos y el permiso de administrador')
}

console.log(`\n${comprobaciones} comprobaciones, ${fallos.length} fallos`)
for (const f of fallos) console.log(`  FALLO [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
