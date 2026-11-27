// La prueba de la Tanda V78: QUÉ SITIO CUENTA CUANDO HACES UNA FOTO (una sola regla para la cámara y la galería) y los «puntos de foto». Pura, sin navegador, sin Supabase.
//   node scripts/destino/pruebaV78.mjs
//
// 1. La regla en funciones puras (`sitiosQueCuentaUnaFoto`), en Roma y en Lanzarote, con los datos de verdad (y, donde los radios reales no se tocan, con una copia con un radio mayor).
// 2. Los puntos de foto con 2 puntos de EJEMPLO (no están en los datos reales): la foto vale para su sitio, pero «has llegado» / «Algo brilla» / la hoja del emblema no cambian.
// 3. El servicio entero con un repositorio de memoria: la misma foto por cámara y por galería da lo mismo; sin nada que ganar no hay hecho ni aviso.
// 4. Lo que se lee en el código: la ubicación se mira al hacer la foto (no al abrir la cámara), la parada de ahora viaja con la foto, el radio de «has llegado» no cambia.
import fs from 'node:fs'
import { cargarDatos, cargarCatalogo, coordenadasDeSitio, nombreDeSitio, validarDatos } from '../../server/logros/datos.js'
import { clave } from '../../server/logros/motor.js'
import { crearServicioLogros } from '../../server/logros/servicio.js'
import { RADIO_MAXIMO_AVISO_M, queEnsenar, sitioDeFotoLibre, sitiosCerca, sitiosDeFotoLibre, sitiosQueCuentaUnaFoto } from '../../server/logros/cerca.js'

let comprobaciones = 0
const fallos = []
const debe = (cond, texto) => {
  comprobaciones++
  if (!cond) {
    fallos.push(texto)
    console.log('✗', texto)
  }
}
const leer = (f) => fs.readFileSync(f, 'utf8')
const sinComentarios = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b)

const datos = cargarDatos()
const catalogos = { roma: cargarCatalogo('roma'), lanzarote: cargarCatalogo('lanzarote') }
const coord = (destino, id) => coordenadasDeSitio(catalogos, destino, id)
const grados = (m) => m / 111320
const aMetros = (c, m) => ({ lat: c.lat + grados(m), lng: c.lng })
const entre = (a, b, t) => ({ lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t })
const copia = (o) => JSON.parse(JSON.stringify(o))
/** Lo ya ganado de un sitio: todos sus emblemas y pedazos (el `items` que usa el servidor). */
function ganado(destino, ...sitios) {
  const d = datos.destinos[destino]
  const m = new Map()
  for (const s of sitios) {
    for (const e of d.emblemas) if (e.sitio === s) m.set(clave(destino, 'emblema', e.id), { logro: 'emblema' })
    for (const c of d.colecciones) if (c.sitios.includes(s)) m.set(clave(destino, 'pedazo', `${c.id}:${s}`), { logro: 'pedazo' })
  }
  return m
}
const regla = (destino, ubicacion, extra = {}, datosUsados = datos) => sitiosQueCuentaUnaFoto({ datos: datosUsados, catalogos, destino, ubicacion, items: new Map(), ...extra })

/* ───────────────────────── 1. ROMA: la regla ───────────────────────── */
console.log('1. Roma')
{
  const COL = 'coliseo'
  const FORO = 'foro_romano_y_palatino'
  const col = coord('roma', COL)
  const foro = coord('roma', FORO)
  // Los radios reales del Coliseo (250 m) y del Foro (350 m) no se tocan (están a 626 m): para tener una foto en el radio de LOS DOS se usa una copia de los datos con el radio del Foro mayor.
  const solape = copia(datos)
  solape.destinos.roma.sitios[FORO].radio_m = 700
  const foto = aMetros(col, 150) // ~150 m del Coliseo y ~480 m del Foro
  const enLosDos = sitiosCerca({ datos: solape, catalogos, destino: 'roma', ubicacion: foto, items: new Map(), margenM: 0, sinTope: true }).filter((s) => s.dentro).map((s) => s.sitio)
  debe(enLosDos.includes(COL) && enLosDos.includes(FORO), `la foto de prueba está en el radio del Coliseo y del Foro (sale ${enLosDos})`)

  const conParada = regla('roma', foto, { paradaHoy: [COL] }, solape)
  debe(igual(conParada.sitios, [COL]) && conParada.por === 'parada', `con el Coliseo de parada de HOY, la foto cuenta SOLO para el Coliseo (sale ${conParada.sitios})`)
  const sinParada = regla('roma', foto, {}, solape)
  debe(sinParada.sitios.length === 2 && sinParada.sitios[0] === COL && sinParada.sitios.includes(FORO) && sinParada.por === 'radio', `la misma foto SIN parada cuenta para los dos, el más cercano primero (sale ${sinParada.sitios})`)
  const otraParada = regla('roma', foto, { paradaHoy: ['panteon'] }, solape)
  debe(otraParada.sitios.length === 2, `con una parada que no está a la vista (el Panteón), cuentan todos los del radio (sale ${otraParada.sitios})`)
  const conForoDeParada = regla('roma', foto, { paradaHoy: [FORO] }, solape)
  debe(igual(conForoDeParada.sitios, [FORO]), `con el Foro de parada, la foto cuenta solo para el Foro (sale ${conForoDeParada.sitios})`)
  // El Coliseo ya ganado: solo el Foro, tanto sin parada como con el Coliseo de parada (su parada ya está ganada: se va por libre).
  const colGanado = ganado('roma', COL)
  const sinColiseo = regla('roma', foto, { items: colGanado }, solape)
  debe(igual(sinColiseo.sitios, [FORO]), `con el Coliseo ya ganado, solo el Foro (sale ${sinColiseo.sitios})`)
  const sinColiseoConParada = regla('roma', foto, { items: colGanado, paradaHoy: [COL] }, solape)
  debe(igual(sinColiseoConParada.sitios, [FORO]) && sinColiseoConParada.por === 'radio', `con el Coliseo de parada pero ya ganado, la foto va por libre: solo el Foro (sale ${sinColiseoConParada.sitios})`)
  const todoGanado = regla('roma', foto, { items: ganado('roma', COL, FORO) }, solape)
  debe(todoGanado.sitios.length === 0 && todoGanado.posibles.length === 2, 'con los dos ganados, la foto no cuenta para nadie (sale vacío; los sitios posibles siguen a la vista para decir «ya lo tenías»)')

  // Un caso real de Roma con los radios de verdad: la Basílica y la Plaza de San Pedro (a 149 m una de otra, las dos con emblema por ganar).
  const BAS = 'basilica_de_san_pedro'
  const PLZ = 'plaza_de_san_pedro'
  const medio = entre(coord('roma', BAS), coord('roma', PLZ), 0.5)
  const real = regla('roma', medio)
  debe(real.sitios.includes(BAS) && real.sitios.includes(PLZ), `(radios reales) entre la Basílica y la Plaza de San Pedro, sin parada: cuentan las dos (sale ${real.sitios})`)
  debe(igual(regla('roma', medio, { paradaHoy: [BAS] }).sitios, [BAS]), '(radios reales) con la Basílica de parada: solo la Basílica')
  debe(igual(regla('roma', medio, { paradaHoy: [PLZ] }).sitios, [PLZ]), '(radios reales) con la Plaza de parada: solo la Plaza')
  debe(igual(regla('roma', medio, { items: ganado('roma', BAS) }).sitios, [PLZ]), '(radios reales) con la Basílica ya ganada: solo la Plaza')
  const sinNada = regla('roma', medio, { items: ganado('roma', BAS, PLZ) })
  debe(sinNada.sitios.length === 0, '(radios reales) con las dos ganadas, no cuenta para ninguna')
  debe(regla('roma', { lat: 40.4, lng: -3.7 }).sitios.length === 0 && regla('roma', null).sitios.length === 0, 'lejos de todo, o sin ubicación, no cuenta para nadie')
  // Mismo resultado que la regla de antes cuando solo hay un sitio a la vista y no hay parada.
  const solo = aMetros(coord('roma', 'fontana_de_trevi'), 20)
  debe(igual(regla('roma', solo).sitios, ['fontana_de_trevi']) && sitioDeFotoLibre({ datos, catalogos, destino: 'roma', ubicacion: solo, items: new Map() }) === 'fontana_de_trevi', 'en la Fontana de Trevi (un solo sitio) cuenta para la Fontana, como siempre')

  /* ── Via dei Fori: ANTES y DESPUÉS ── */
  // El punto a mitad de camino entre el Coliseo y el Foro (313 m de cada uno): dentro del radio del Foro (350 m) y fuera del del Coliseo (250 m).
  const viaDeiFori = entre(col, foro, 0.5)
  const antesCamara = sitioDeFotoLibre({ datos, catalogos, destino: 'roma', ubicacion: viaDeiFori, items: new Map() })
  const antesGaleria = sitiosDeFotoLibre({ datos, catalogos, destino: 'roma', ubicacion: viaDeiFori, items: new Map() })
  debe(antesCamara === FORO && igual(antesGaleria, [FORO]), `ANTES (regla vieja), en Via dei Fori la foto iba al Foro (cámara: ${antesCamara}; galería: ${antesGaleria})`)
  debe(igual(regla('roma', viaDeiFori, { paradaHoy: [COL] }).sitios, [FORO]), 'DESPUÉS, con los datos de verdad (sin puntos de foto aprobados) el Coliseo no está a la vista desde allí: sigue yendo al Foro')
  // Con UN punto de foto de EJEMPLO («Via dei Fori Imperiali», 100 m) para el Coliseo:
  const conPunto = copia(datos)
  conPunto.destinos.roma.sitios[COL].puntos_de_foto = [{ nombre: 'Via dei Fori Imperiali (EJEMPLO de la prueba)', lat: viaDeiFori.lat, lng: viaDeiFori.lng, radio_m: 100, fuente: 'ejemplo de la prueba V78, no es un punto real' }]
  const despuesParada = regla('roma', viaDeiFori, { paradaHoy: [COL] }, conPunto)
  debe(igual(despuesParada.sitios, [COL]) && despuesParada.por === 'parada', `DESPUÉS, con el punto de foto y el Coliseo de parada: SOLO el Coliseo, ni el Foro ni el Vittoriano (sale ${despuesParada.sitios})`)
  const despuesLibre = regla('roma', viaDeiFori, {}, conPunto)
  debe(igual(despuesLibre.sitios, [COL]) && despuesLibre.por === 'punto', `DESPUÉS, en el punto de foto y por libre: solo el sitio de ESE punto, no el Foro aunque esté en su radio (sale ${despuesLibre.sitios})`)
  debe(igual(regla('roma', viaDeiFori, { paradaHoy: [FORO] }, conPunto).sitios, [FORO]), 'en el punto de foto del Coliseo pero con el Foro de parada (y a la vista por su radio): solo el Foro')
  debe(igual(regla('roma', viaDeiFori, { items: colGanado }, conPunto).sitios, []), 'en el punto de foto con el Coliseo ya ganado: no cuenta para nadie (lo ya ganado nunca cuenta; el Foro tampoco, porque la foto es del Coliseo)')
  debe(regla('roma', aMetros(viaDeiFori, 400), {}, conPunto).por !== 'punto', 'a 400 m del punto de foto (radio 100), ya no vale como punto')
  // Un punto de foto NO es «has llegado»: nada de `sitiosCerca` / `queEnsenar` cambia por tenerlo.
  const cercaSin = sitiosCerca({ datos, catalogos, destino: 'roma', ubicacion: viaDeiFori, items: new Map(), sitiosHoy: new Set([COL]) })
  const cercaCon = sitiosCerca({ datos: conPunto, catalogos, destino: 'roma', ubicacion: viaDeiFori, items: new Map(), sitiosHoy: new Set([COL]) })
  debe(igual(cercaSin, cercaCon) && igual(queEnsenar(cercaSin), queEnsenar(cercaCon)), 'un punto de foto no cambia «cerca de ti» (ni «Algo brilla», ni la hoja del emblema al llegar, ni el Visto): sitiosCerca / queEnsenar salen idénticos')
  const llegada = queEnsenar(cercaCon)
  debe(llegada.juego_sitio !== COL, `desde el punto de foto NO se dice «has llegado» al Coliseo (el juego, por el radio de siempre, habla de: ${llegada.juego_sitio})`)
  debe(RADIO_MAXIMO_AVISO_M === 800 && datos.destinos.roma.sitios[COL].radio_m === 250, 'el radio de «has llegado» sigue siendo el de siempre (Coliseo 250 m; avisos recortados a 800 m)')
}

/* ───────────────────────── 1b. LANZAROTE: la regla ───────────────────────── */
console.log('1b. Lanzarote')
{
  const CASA = 'casa_museo_cesar_manrique'
  const HARIA = 'haria_pueblo'
  const foto = entre(coord('lanzarote', CASA), coord('lanzarote', HARIA), 0.5) // en el radio de los dos (a 93 m uno del otro)
  const dentro = sitiosCerca({ datos, catalogos, destino: 'lanzarote', ubicacion: foto, items: new Map(), margenM: 0, sinTope: true }).filter((s) => s.dentro).map((s) => s.sitio)
  debe(dentro.includes(CASA) && dentro.includes(HARIA), `la foto de prueba está en el radio de la Casa-Museo César Manrique y de Haría (sale ${dentro})`)
  debe(igual(regla('lanzarote', foto, { paradaHoy: [CASA] }).sitios, [CASA]), 'Lanzarote: con la Casa-Museo de parada de HOY, solo la Casa-Museo')
  const libre = regla('lanzarote', foto)
  debe(libre.sitios.length === 2 && libre.sitios.includes(CASA) && libre.sitios.includes(HARIA), `Lanzarote: la misma foto sin parada cuenta para los dos (sale ${libre.sitios})`)
  debe(igual(regla('lanzarote', foto, { items: ganado('lanzarote', CASA) }).sitios, [HARIA]), 'Lanzarote: con la Casa-Museo ya ganada, solo Haría')
  debe(igual(regla('lanzarote', foto, { items: ganado('lanzarote', CASA), paradaHoy: [CASA] }).sitios, [HARIA]), 'Lanzarote: con la Casa-Museo de parada pero ya ganada, va por libre: solo Haría')
  debe(regla('lanzarote', foto, { items: ganado('lanzarote', CASA, HARIA) }).sitios.length === 0, 'Lanzarote: con los dos ganados, no cuenta para nadie')
  debe(regla('lanzarote', { lat: 28.0, lng: -16.5 }).sitios.length === 0, 'Lanzarote: en medio de la nada, no cuenta para nadie')
  // `aparta_de` (V4): en una bodega no cuenta La Geria (3.000 m).
  const bodega = coord('lanzarote', 'bodega_la_geria')
  const enBodega = regla('lanzarote', aMetros(bodega, 30)).sitios
  debe(enBodega.includes('bodega_la_geria') && !enBodega.includes('la_geria_y_sus_bodegas'), `Lanzarote: en una bodega no cuenta La Geria (aparta_de) (sale ${enBodega})`)
  // Un punto de foto de EJEMPLO en Lanzarote: el Mirador del Río mirando a La Graciosa NO existe aquí; se usa un punto de ejemplo a 600 m de los Jameos del Agua (radio 200 m, fuera de él).
  const jameos = coord('lanzarote', 'jameos_del_agua')
  const lejano = aMetros(jameos, 600)
  const sinPuntos = regla('lanzarote', lejano)
  debe(!sinPuntos.sitios.includes('jameos_del_agua'), 'Lanzarote: a 600 m de los Jameos, sin punto de foto, no cuenta para los Jameos')
  const conPunto = copia(datos)
  conPunto.destinos.lanzarote.sitios.jameos_del_agua.puntos_de_foto = [{ nombre: 'Punto de EJEMPLO a 600 m (prueba V78)', lat: lejano.lat, lng: lejano.lng, radio_m: 80, fuente: 'ejemplo de la prueba V78, no es un punto real' }]
  const p = regla('lanzarote', lejano, {}, conPunto)
  debe(igual(p.sitios, ['jameos_del_agua']) && p.por === 'punto', `Lanzarote: en el punto de foto de ejemplo, solo el sitio de ese punto (los Jameos) (sale ${p.sitios})`)
  debe(igual(sitiosCerca({ datos, catalogos, destino: 'lanzarote', ubicacion: lejano, items: new Map() }), sitiosCerca({ datos: conPunto, catalogos, destino: 'lanzarote', ubicacion: lejano, items: new Map() })), 'Lanzarote: el punto de foto no cambia «cerca de ti» ni «has llegado»')
  debe(!queEnsenar(sitiosCerca({ datos: conPunto, catalogos, destino: 'lanzarote', ubicacion: lejano, items: new Map() })).juego_sitio?.includes('llegada') && queEnsenar(sitiosCerca({ datos: conPunto, catalogos, destino: 'lanzarote', ubicacion: lejano, items: new Map() })).juego !== 'llegada', 'Lanzarote: desde el punto de foto no sale «has llegado»')
}

/* ───────────────────────── 2. Los datos ───────────────────────── */
console.log('2. Los datos')
{
  const malos = copia(datos)
  malos.destinos.roma.sitios.coliseo.puntos_de_foto = [{ nombre: 'sin fuente', lat: 41.89, lng: 12.49, radio_m: 400 }, { nombre: 'sin coordenadas' }]
  const avisos = validarDatos(malos, catalogos)
  debe(avisos.some((a) => a.nivel === 'error' && /sin lat\/lng/.test(a.texto ?? a.mensaje ?? JSON.stringify(a))), 'validarDatos: un punto de foto sin lat/lng es un error')
  debe(avisos.some((a) => /sin fuente/.test(JSON.stringify(a))) && avisos.some((a) => /50 a 150/.test(JSON.stringify(a))), 'validarDatos: avisa de un punto sin fuente y de un radio fuera de 50-150 m')
  // (Hallazgo de la V78, no es de esta tanda: validarDatos ya daba UN error antes —«haria_y_la_casa_museo_cesar_manrique», el sitio que la V67 separó en dos—; aquí solo se mira que ningún error sea de los puntos de foto.)
  debe(validarDatos(datos, catalogos).filter((a) => a.nivel === 'error' && /puntos_de_foto/.test(JSON.stringify(a))).length === 0, 'los datos de verdad no tienen errores de puntos de foto')
  // (V78) La parada vieja de Haría se conserva a propósito: ya es un aviso, no un error. `validarDatos` de los datos de verdad sale SIN errores.
  debe(validarDatos(datos, catalogos).filter((a) => a.nivel === 'error').length === 0, 'validarDatos de los datos de verdad sale sin errores')
  debe(validarDatos(datos, catalogos).some((a) => a.nivel === 'aviso' && /haria_y_la_casa_museo_cesar_manrique/.test(a.donde)), 'la parada antigua de Haría sale como aviso (excepción explícita), no como error')
  const sinExcepcion = copia(datos)
  sinExcepcion.destinos.lanzarote.sitios_de_parada.otra_parada_que_no_existe = ['haria_pueblo']
  debe(validarDatos(sinExcepcion, catalogos).some((a) => a.nivel === 'error' && /otra_parada_que_no_existe/.test(a.donde)), 'cualquier OTRA parada que falte en el catálogo sigue siendo un error')
}

/* ───────────────────────── 3. El servicio entero: cámara y galería dan lo mismo ───────────────────────── */
console.log('3. El servicio (cámara y galería)')
{
  const AHORA = '2026-11-09T10:00:00Z'
  const parada = (id, destino, sitio) => ({ id, name: nombreDeSitio(catalogos, destino, sitio) })
  const BAS = 'basilica_de_san_pedro'
  const PLZ = 'plaza_de_san_pedro'
  const viajeRoma = { id: 'v1', route: { destination: 'Roma', answers: { dateRange: { start: '2026-11-08', end: '2026-11-13' }, companion: 'solo' }, days: [{ dayNumber: 1, stops: [parada('d1p1', 'roma', 'panteon')] }, { dayNumber: 2, stops: [parada('p1', 'roma', BAS), parada('p2', 'roma', PLZ)] }] } }
  const viajeLz = { id: 'v2', route: { destination: 'Lanzarote', answers: { dateRange: { start: '2026-11-08', end: '2026-11-13' }, companion: 'solo' }, days: [{ dayNumber: 2, stops: [parada('l1', 'lanzarote', 'casa_museo_cesar_manrique'), parada('l2', 'lanzarote', 'haria_pueblo')] }] } }
  function nuevo(viaje) {
    const guardados = []
    const logros = []
    const repo = { hechosDe: async () => guardados, viajesDe: async () => [viaje], logrosDe: async () => logros, cuentaDe: async () => ({}), ordenPionero: async () => null, probadorDe: async () => null, perfilDe: async () => ({}), guardarPerfil: async () => {}, referidosDe: async () => [], ultimaFrase: async () => null, insertarHecho: async (h) => { const fila = { id: 'h' + guardados.length, ...h }; guardados.push(fila); return fila }, insertarLogros: async (_u, filas) => { logros.push(...filas); return filas }, pruebaDe: async () => null, pasesDe: async () => [], guardarPrueba: async () => {}, sinPaseDe: async () => false }
    const servicio = crearServicioLogros({ repo, datos, catalogos, ahora: () => new Date(AHORA), cobro: false })
    return { servicio, guardados }
  }
  const silencio = async (f) => {
    const log = console.log
    console.log = () => {}
    try {
      return await f()
    } finally {
      console.log = log
    }
  }
  const camara = (s, trip, ubic, extra = {}) => s.foto('u', { trip_id: trip, libre: true, origen: 'app', tomada_en: AHORA, ubicacion: ubic, ...extra })
  const galeria = (s, trip, ubic, extra = {}) => s.foto('u', { trip_id: trip, libre: true, origen: 'galeria', tomada_en: '2026-11-09T09:00:00Z', con_camara: true, ubicacion: ubic, ...extra })
  const sitiosDe = (guardados) => guardados.map((h) => h.sitio).sort()
  const medio = entre(coord('roma', BAS), coord('roma', PLZ), 0.5)
  const pBas = { stop_id: 'p1', nombre: nombreDeSitio(catalogos, 'roma', BAS) }

  // Con la Basílica de parada: la cámara y la galería cuentan SOLO la Basílica.
  const A = nuevo(viajeRoma)
  const rA = await silencio(() => camara(A.servicio, 'v1', medio, { parada_hoy: pBas }))
  const B = nuevo(viajeRoma)
  const rB = await silencio(() => galeria(B.servicio, 'v1', medio, { parada_hoy: pBas }))
  debe(rA.cuenta && igual(sitiosDe(A.guardados), [BAS]) && rA.nuevos.length > 0, `cámara con la Basílica de parada: un solo hecho, de la Basílica (sale ${sitiosDe(A.guardados)})`)
  debe(rB.cuenta && igual(sitiosDe(B.guardados), [BAS]) && rB.nuevos.length > 0, `galería con la Basílica de parada: un solo hecho, de la Basílica (sale ${sitiosDe(B.guardados)})`)
  debe(igual(rA.sitios, rB.sitios) && igual(rA.nuevos.map((m) => `${m.tipo}:${m.nombre ?? ''}`), rB.nuevos.map((m) => `${m.tipo}:${m.nombre ?? ''}`)), 'cámara y galería: la misma foto en el mismo sitio da LO MISMO (mismos sitios, mismos logros)')
  // Sin parada: las dos, también igual por cámara y por galería.
  const C = nuevo(viajeRoma)
  const rC = await silencio(() => camara(C.servicio, 'v1', medio))
  const D = nuevo(viajeRoma)
  const rD = await silencio(() => galeria(D.servicio, 'v1', medio))
  debe(igual(sitiosDe(C.guardados), [BAS, PLZ].sort()) && igual(sitiosDe(D.guardados), [BAS, PLZ].sort()), `sin parada, cámara y galería cuentan las dos (cámara ${sitiosDe(C.guardados)}; galería ${sitiosDe(D.guardados)})`)
  debe(igual(rC.nuevos.map((m) => `${m.tipo}:${m.nombre ?? ''}`), rD.nuevos.map((m) => `${m.tipo}:${m.nombre ?? ''}`)), 'sin parada: cámara y galería dan los mismos logros')
  // Una foto de la galería de OTRO día no usa la parada de hoy (no la tiene): cuenta las dos.
  const E = nuevo(viajeRoma)
  await silencio(() => galeria(E.servicio, 'v1', medio, { tomada_en: '2026-11-08T09:00:00Z', parada_hoy: pBas }))
  debe(igual(sitiosDe(E.guardados), [BAS, PLZ].sort()), `una foto de la galería de otro día no usa la parada de hoy (sale ${sitiosDe(E.guardados)})`)
  // Una parada que el servidor no encuentra por su id se busca por su nombre, y solo vale si la foto es de hoy.
  const F = nuevo(viajeRoma)
  await silencio(() => camara(F.servicio, 'v1', medio, { parada_hoy: { stop_id: 'no_existe', nombre: pBas.nombre } }))
  debe(igual(sitiosDe(F.guardados), [BAS]), `la parada se encuentra por su nombre si no por su id (sale ${sitiosDe(F.guardados)})`)
  // Lo ya ganado nunca cuenta: después de ganar la Basílica con una foto, otra foto en el mismo punto cuenta solo la Plaza; y con las dos ganadas, nada.
  const G = nuevo(viajeRoma)
  await silencio(() => camara(G.servicio, 'v1', medio, { parada_hoy: pBas }))
  const g2 = await silencio(() => camara(G.servicio, 'v1', medio, { parada_hoy: pBas }))
  debe(igual(sitiosDe(G.guardados), [BAS, PLZ].sort()) && g2.cuenta, `con la Basílica ya ganada (la parada), la segunda foto va por libre y gana la Plaza (hechos: ${sitiosDe(G.guardados)})`)
  const hechosAntes = G.guardados.length
  const g3 = await silencio(() => camara(G.servicio, 'v1', medio, { parada_hoy: pBas }))
  debe(g3.ok && g3.valida && g3.cuenta === false && g3.motivo === 'sin_logro_aqui' && g3.ya_ganado === true && g3.nuevos.length === 0 && G.guardados.length === hechosAntes, 'con todo ganado: foto válida, no cuenta, sin logros nuevos (sin aviso), no se guarda ningún hecho')
  const g4 = await silencio(() => galeria(G.servicio, 'v1', medio))
  debe(g4.ok && g4.valida && g4.cuenta === false && g4.motivo === 'sin_logro_aqui' && g4.nuevos.length === 0 && G.guardados.length === hechosAntes, 'lo mismo por la galería: nada que ganar, sin aviso, ningún hecho')
  // Lejos de todo y sin ubicación.
  const H = nuevo(viajeRoma)
  const h1 = await silencio(() => camara(H.servicio, 'v1', { lat: 40.4, lng: -3.7 }))
  const h2 = await silencio(() => camara(H.servicio, 'v1', null))
  debe(h1.motivo === 'sin_logro_aqui' && !h1.ya_ganado && h1.nuevos.length === 0 && h2.motivo === 'sin_ubicacion' && H.guardados.length === 0, 'lejos de todo → sin_logro_aqui (sin «ya lo tenías»); sin ubicación → sin_ubicacion; ningún hecho')
  // La ubicación que se manda con la foto no se guarda.
  debe(!JSON.stringify(A.guardados).includes(String(medio.lat).slice(0, 7)), 'el hecho guardado no lleva las coordenadas de la ubicación')

  // Lanzarote: la Casa-Museo de parada → solo ella (cámara y galería); sin parada → las dos.
  const medioLz = entre(coord('lanzarote', 'casa_museo_cesar_manrique'), coord('lanzarote', 'haria_pueblo'), 0.5)
  const pCasa = { stop_id: 'l1', nombre: nombreDeSitio(catalogos, 'lanzarote', 'casa_museo_cesar_manrique') }
  const L1 = nuevo(viajeLz)
  const L2 = nuevo(viajeLz)
  const L3 = nuevo(viajeLz)
  const L4 = nuevo(viajeLz)
  const l1 = await silencio(() => camara(L1.servicio, 'v2', medioLz, { parada_hoy: pCasa }))
  const l2 = await silencio(() => galeria(L2.servicio, 'v2', medioLz, { parada_hoy: pCasa }))
  await silencio(() => camara(L3.servicio, 'v2', medioLz))
  await silencio(() => galeria(L4.servicio, 'v2', medioLz))
  debe(l1.cuenta && l2.cuenta && igual(sitiosDe(L1.guardados), ['casa_museo_cesar_manrique']) && igual(sitiosDe(L2.guardados), ['casa_museo_cesar_manrique']), `Lanzarote: con la Casa-Museo de parada, cámara y galería cuentan solo la Casa-Museo (${sitiosDe(L1.guardados)} / ${sitiosDe(L2.guardados)})`)
  debe(igual(sitiosDe(L3.guardados), ['casa_museo_cesar_manrique', 'haria_pueblo']) && igual(sitiosDe(L4.guardados), ['casa_museo_cesar_manrique', 'haria_pueblo']), `Lanzarote: sin parada, cámara y galería cuentan las dos (${sitiosDe(L3.guardados)} / ${sitiosDe(L4.guardados)})`)
  const L5 = nuevo(viajeLz)
  await silencio(() => camara(L5.servicio, 'v2', medioLz))
  const l5 = await silencio(() => galeria(L5.servicio, 'v2', medioLz))
  debe(l5.cuenta === false && l5.motivo === 'sin_logro_aqui' && l5.nuevos.length === 0 && L5.guardados.length === 2, 'Lanzarote: con lo de las dos ya ganado, la foto no cuenta, sin aviso')
  // El Visto y las fotos con sitio (de una parada) NO cambian: foto con `sitio` explícito en Roma sigue contando ese sitio.
  const V = nuevo(viajeRoma)
  const v = await silencio(() => V.servicio.foto('u', { trip_id: 'v1', sitio: PLZ, origen: 'app', tomada_en: AHORA, ubicacion: medio }))
  debe(v.ok && v.valida && igual(sitiosDe(V.guardados), [PLZ]), 'una foto con parada explícita (la del Visto) sigue contando solo su sitio')
}

/* ───────────────────────── 4. En el código ───────────────────────── */
console.log('4. En el código')
{
  const cam = leer('src/components/route/hoy/CamaraViaje.tsx')
  const lib = leer('src/lib/logros.ts')
  const cerca = sinComentarios(leer('server/logros/cerca.js'))
  const servicio = leer('server/logros/servicio.js')
  const tocar = cam.slice(cam.indexOf('const tocar = () => {'), cam.indexOf('const abrirDesdeLaHoja'))
  debe(tocar.length > 20 && !/ubicacion|geolocation|enviarFoto/.test(tocar), 'al abrir la cámara no se pregunta nada (ni ubicación ni servidor)')
  debe(/ubicacionDeAhora\(\)/.test(lib.slice(lib.indexOf('export async function enviarFotoDeLaCamara'))), 'la ubicación se mira al HACER la foto (dentro de enviarFotoDeLaCamara)')
  debe(/paradaHoy: paradaDeAhora\(day\)/.test(cam) && /parada_hoy: p\.libre/.test(lib), 'la cámara manda con la foto la parada de ahora de HOY (parada_hoy)')
  debe(/paradaDeAhoraDeLaRuta/.test(leer('src/lib/reclamar.ts')), 'la galería (Reclamar con tus fotos) manda también la parada de ahora')
  debe(servicio.includes('sitiosQueCuentaUnaFoto') && !/sitioDeFotoLibre\(|sitiosDeFotoLibre\(/.test(sinComentarios(servicio)), 'el servicio usa UNA sola regla (sitiosQueCuentaUnaFoto) para la cámara y la galería')
  debe(!/puntos_de_foto/.test(sinComentarios(cerca.slice(cerca.indexOf('export function sitiosCerca'), cerca.indexOf('export function sitiosDeFotoLibre')))) && !/puntosDeFotoDe/.test(sinComentarios(cerca.slice(cerca.indexOf('export function queEnsenar'), cerca.indexOf('export function retoDelDia')))), '«cerca de ti», el juego y «has llegado» (sitiosCerca, queEnsenar) no leen los puntos de foto')
  debe(!/puntos_de_foto/.test(servicio.slice(servicio.indexOf('async function visto('), servicio.indexOf('/* ── Una foto ── */'))), 'el Visto no lee los puntos de foto')
  const pedirSupabase = /supabase\.from|\.rpc\(/.test(sinComentarios(leer('src/lib/camaraViaje.ts').slice(leer('src/lib/camaraViaje.ts').indexOf('export function paradaDeAhora'))))
  debe(!pedirSupabase, 'la parada de ahora no pide nada a Supabase (va dentro del mismo POST de la foto)')
}

console.log(`\npruebaV78: ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
for (const f of fallos) console.log(`  FALLO ${f}`)
process.exit(fallos.length ? 1 : 0)
