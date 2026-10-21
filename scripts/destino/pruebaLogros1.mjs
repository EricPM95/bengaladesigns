// La prueba del cerebro de los logros (Tanda 8A, docs/dias/PROMPT_TANDA8A.md). No toca el motor de rutas.
//   node scripts/destino/pruebaLogros1.mjs
//
// 1. Los datos (data/logros/*.json) cruzados con el catálogo de Roma: ningún sitio inventado, las colecciones y los emblemas del encargo.
// 2. Las reglas puras: qué foto y qué Visto valen, las horas de Madrugador y Nocturno, el pase.
// 3. El servicio de verdad sobre un Postgres de prueba (PGlite) con las migraciones reales (0020, 0021 y 0023): los 4 grados de Roma y los 3 del Vaticano, los pedazos con
//    y sin ubicación, los emblemas, las fotos de la galería, deshacer, el plazo de 30 días, un viaje compartido, un segundo viaje, volver a calcular todo…
// 4. Las rutas y el panel de Eric: apagado no existe nada, la cuenta de administrador sale de una variable.
import fs from 'node:fs'
import path from 'node:path'
import { PGlite } from '@electric-sql/pglite'
import { cargarDatos, cargarCatalogo, validarDatos, coordenadasDeSitio } from '../../server/logros/datos.js'
import { calcular, clave, momentoDeLaHora, parteLocal } from '../../server/logros/motor.js'
import { evaluarFoto, evaluarVisto, instanteDeToma, rangoLargo, metros, diasParaReclamar } from '../../server/logros/fotos.js'
import { cobroActivo, diasLibres, elegirDiaDePrueba, estadoDePrueba, planParaPersonas, precioDelPase, puedeGanarLogros, repartoDelPago, tocaPreguntar, viajeDePrueba } from '../../server/logros/pase.js'
import { crearServicioLogros, simular, contextoDeViaje, horasDelViaje } from '../../server/logros/servicio.js'
import { capacidad, logrosVisibles, logrosYVisibilidad, llevarAVitrina } from '../../server/logros/vistas.js'
import { enviarAvisosPendientes, pushActivo, textoDeAviso } from '../../server/logros/avisos.js'
import { esAdmin, logrosActivos, registrarRutasLogros } from '../../server/logros/rutas.js'
import { elegirFrase } from '../../server/logros/momentos.js'

const fallos = []
let comprobaciones = 0
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) fallos.push({ regla, texto })
}

const datos = cargarDatos()
const catalogo = cargarCatalogo('roma')
const catalogos = { roma: catalogo }
const R = datos.destinos.roma
const ajustes = datos.ajustes
const nombre = (id) => catalogo.places.find((p) => p.id === id).name
const coords = (id) => coordenadasDeSitio(catalogos, 'roma', id)

/* ─────────────────────────── 1. Los datos ─────────────────────────── */
console.log('1. Los datos de los logros')
{
  const avisos = validarDatos(datos, catalogos)
  debe(avisos.filter((a) => a.nivel === 'error').length === 0, 'datos', `sin errores contra el catálogo: ${JSON.stringify(avisos.filter((a) => a.nivel === 'error'))}`)
  const imp = R.colecciones.find((c) => c.id === 'imprescindibles')
  debe(imp.sitios.length === 8 && ['coliseo', 'foro_romano_y_palatino', 'fontana_de_trevi', 'panteon', 'piazza_navona', 'plaza_de_espana', 'castillo_de_santangelo', 'trastevere'].every((s) => imp.sitios.includes(s)), 'datos', 'los 8 imprescindibles son los del encargo')
  const roma = R.sellos.find((s) => s.id === 'roma')
  debe(roma.grados.map((g) => `${g.grado}:${g.desde}`).join() === 'bronce:1,plata:4,oro:6,diamante:8', 'datos', 'el sello de Roma: 1 bronce, 4 plata, 6 oro, 8 diamante')
  const vat = R.sellos.find((s) => s.id === 'vaticano')
  debe(vat.grados.map((g) => `${g.grado}:${g.desde}`).join() === 'plata:1,oro:2,diamante:3', 'datos', 'el Vaticano no tiene bronce: 1 plata, 2 oro, 3 diamante')
  debe(R.sellos.length === 2, 'datos', 'un sello por cosa (Roma y el Vaticano), no dos de cada')
  debe(R.colecciones.length === 11, 'datos', `11 colecciones: ${R.colecciones.length}`)
  debe(R.colecciones.map((c) => c.nombre).join('|') === 'Los imprescindibles de Roma|El país más pequeño del mundo|Las 4 joyas de Roma|El alma de Trastevere|La Roma de Miguel Ángel|La Roma de Bernini|Tras los pasos de Caravaggio|La Roma antigua|Los miradores|Plazas y fuentes de Roma|La Roma secreta', 'datos', 'las 11 colecciones, en el orden del encargo')
  debe(R.colecciones.map((c) => c.sitios.length).join() === '8,3,4,4,4,5,3,6,3,7,5', 'datos', 'los sitios de cada colección: 8,3,4,4,4,5,3,6,3,7,5')
  const tempietto = 'san_pietro_in_montorio_y_tempietto_de_bramante'
  debe(R.colecciones.filter((c) => c.sitios.includes(tempietto)).map((c) => c.id).sort().join() === 'alma_trastevere,roma_secreta', 'datos', 'el Tempietto es un solo sitio y cuenta en El alma de Trastevere y en La Roma secreta')
  debe(R.colecciones.filter((c) => c.sitios.includes('basilica_de_san_pedro')).length === 3, 'datos', 'la Basílica de San Pedro suma en tres colecciones')
  debe(R.emblemas.length === 14 && R.emblemas.filter((e) => e.tipo === 'sitio').length === 12 && R.emblemas.filter((e) => e.tipo === 'momento').length === 2, 'datos', '14 emblemas (Tanda 10): 12 de sitio y 2 de momento')
  debe(R.emblemas.find((e) => e.sitio === 'plaza_de_san_pedro').nombre === 'La frontera que no se ve', 'datos', 'el emblema de la Plaza se llama «La frontera que no se ve»')
  debe(R.emblemas.every((e) => e.nombre && e.linea), 'datos', 'todos los emblemas llevan nombre y línea')
  debe(R.colecciones.every((c) => c.al_completar), 'datos', 'todas las colecciones llevan su frase al completarse')
  debe(R.sitios.museos_vaticanos_y_capilla_sixtina.foto_dentro.startsWith('En la Capilla Sixtina no se pueden hacer fotos') && R.sitios.catacumbas_de_san_calixto.foto_dentro.startsWith('Dentro no se pueden hacer fotos') && R.sitios.galeria_borghese.foto_dentro === 'Sin flash.', 'datos', 'los avisos de «foto dentro» son los del encargo')
  debe(R.sitios.trastevere.radio_m >= 800 && R.sitios.museos_vaticanos_y_capilla_sixtina.radio_m > R.sitios.fontana_de_trevi.radio_m && R.sitios.circo_maximo.radio_m > R.sitios.piazza_navona.radio_m, 'datos', 'los radios: Trastevere cubre el barrio y los sitios grandes tienen más radio')
  debe(Object.values(R.sitios).every((s) => s.radio_m > 0 && s.motivo_radio && s.pais), 'datos', 'cada sitio lleva radio, su motivo y su país')
  debe(R.sitios.basilica_de_san_pedro.pais === 'Ciudad del Vaticano' && R.sitios.coliseo.pais === 'Italia' && R.sitios.coliseo.capital === true, 'datos', 'país y capital de los sitios')
  debe(['museos_vaticanos_y_capilla_sixtina', 'basilica_de_san_pedro', 'plaza_de_san_pedro'].every((id) => R.sitios[id].capital === true), 'vaticano', 'el Vaticano es capital: capital:true en sus tres sitios (Eric, 17-oct)')
  // Los Patrimonios (Tanda 8A2): todo lo que está dentro de las murallas
  const CH = R.patrimonios.centro_historico_de_roma
  const idsCatalogo = new Set(catalogo.places.map((p) => p.id))
  for (const id of ['coliseo', 'fontana_de_trevi', 'piazza_navona', 'plaza_de_espana', 'trastevere', 'foro_romano_y_palatino', 'panteon', 'castillo_de_santangelo']) debe(CH.sitios.includes(id), 'patrimonio', `${id} cuenta para el Centro histórico`)
  debe(CH.sitios.every((id) => idsCatalogo.has(id)), 'patrimonio', 'todos los sitios del Centro histórico existen en los datos de Roma')
  debe(['mirador_del_janiculo', 'piramide_cestia', 'terraza_del_pincio', 'santa_maria_del_popolo', 'borgo_pio', 'via_della_conciliazione', 'testaccio', 'basilica_de_san_juan_de_letran', 'basilica_de_santa_maria_la_mayor'].every((id) => CH.sitios.includes(id)), 'patrimonio', 'también los que no están en ninguna colección y quedan dentro de las murallas (Janículo, Pincio, Borgo, Testaccio, San Juan de Letrán…)')
  debe(['galeria_borghese', 'parque_de_villa_borghese', 'bioparque_de_roma', 'galeria_nacional_de_arte_moderno', 'quartiere_coppede'].every((id) => !CH.sitios.includes(id)), 'patrimonio', 'lo que está fuera de las murallas no cuenta (Galería Borghese, Villa Borghese…)')
  debe(R.patrimonios.via_appia.sitios.length === 0 && R.patrimonios.via_appia.por_comprobar.includes('catacumbas_de_san_calixto'), 'patrimonio', 'las Catacumbas de San Calixto siguen «por comprobar» y no cuentan')
  const sitiosVat = R.patrimonios.ciudad_del_vaticano.sitios
  debe(['museos_vaticanos_y_capilla_sixtina', 'basilica_de_san_pedro', 'plaza_de_san_pedro'].every((id) => sitiosVat.includes(id) && !CH.sitios.includes(id)), 'patrimonio', 'el Vaticano es otro Patrimonio, sin repetirse en el del Centro histórico')
  debe(!idsCatalogo.has('basilica_de_san_pablo_extramuros') && !JSON.stringify(R).includes('san_pablo_extramuros'), 'patrimonio', 'la Basílica de San Pablo Extramuros no está en nuestros datos (cuenta si algún día se añade)')
  debe(R.pais_defecto === 'Italia' && R.excepciones_pais['Ciudad del Vaticano'].capital === true, 'datos', 'cualquier sitio del catálogo cuenta como Italia salvo los del Vaticano')
  debe(R.pionero.activo === true && R.pionero.limite === 100, 'datos', 'Pionero encendido en Roma, los 100 primeros')
  const V = datos.viajero
  debe(V.logros.find((l) => l.id === 'paises').escalones.map((e) => e.n).join() === '1,3,5,8,10,15,20,25,30', 'datos', 'escalones de Países')
  debe(V.logros.find((l) => l.id === 'destinos').escalones.map((e) => e.n).join() === '1,3,5,10,15,20,25,30' && V.logros.find((l) => l.id === 'capitales').escalones.map((e) => e.n).join() === '5,10,15,25', 'datos', 'escalones de Destinos (con 25 y 30 del Dashboard) y Capitales')
  debe(V.logros.find((l) => l.id === 'patrimonios').escalones.map((e) => e.n).join() === '1,5,10,15,25' && V.logros.find((l) => l.id === 'cazador_emblemas').escalones.map((e) => e.n).join() === '5,10,15' && V.logros.find((l) => l.id === 'coleccionista').escalones.map((e) => e.n).join() === '5,10,15', 'datos', 'escalones de Patrimonios, Cazador y Coleccionista')
  debe(V.logros.find((l) => l.id === 'maravillas').escalones.length === 7 && V.logros.find((l) => l.id === 'viajes').escalones.map((e) => e.n).join() === '1,5,10,15,20,25,30', 'datos', 'las 7 maravillas y los viajes 1, 5, 10, 15, 20, 25 y 30 (Dashboard, 8C1)')
  debe(['solo', 'pareja', 'amigos', 'familia'].every((v) => V.logros.find((l) => l.valor === v)?.escalones.map((e) => e.n).join() === '1,3,5,10'), 'datos', 'Con quién viajas: cuatro chapas de 1, 3, 5 y 10')
  debe(V.logros.find((l) => l.id === 'conocedor').escalones.map((e) => e.n).join() === '25,50', 'datos', 'Conocedor: 25 y 50')
  const ids = V.logros.map((l) => l.id)
  debe(new Set(ids).size === ids.length, 'datos', 'ningún logro de viajero repetido')
  for (const id of ['dos_paises_en_un_dia', 'de_sol_a_sol', 'alondra', 'buho', 'escapada', 'gran_viaje', 'imparable', 'el_fotografo', 'nunca_ultima_vez', 'tres_oro', 'tres_diamante', 'fundador', 'pionero', 'edicion_anio', 'probador', 'cuatro_estaciones', 'destino_cuatro_estaciones', 'doce_meses', 'navidad_fuera', 'nochevieja_fuera', 'tres_viajes_ano', 'dia_perfecto', 'viaje_perfecto', 'ciudad_completa', 'diamante_primera']) debe(ids.includes(id), 'datos', `falta el logro ${id}`)
  debe(!/\bqa\.|password|secret_|api[_-]?key|token/i.test(JSON.stringify(datos)), 'datos', 'ninguna clave en los datos')
  // Los nombres y las líneas, de NOMBRES_LOGROS.md
  debe(R.sellos[0].grados.map((g) => g.nombre).join('|') === 'Primeros pasos en Roma|Roma te atrapa|Roma en el corazón|Roma es tuya' && R.sellos[1].grados.map((g) => g.nombre).join('|') === 'Has cruzado la frontera|El Vaticano en el corazón|El Vaticano es tuyo', 'datos', 'los nombres de cada grado, de NOMBRES_LOGROS.md')
  // Mapeo de nombres de las colecciones con los de NOMBRES_LOGROS.md
  const nombres = fs.readFileSync('docs/dias/NOMBRES_LOGROS.md', 'utf8')
  debe(R.colecciones.every((c) => nombres.includes(c.nombre) && nombres.includes(c.al_completar)), 'datos', 'colecciones y frases al completar, tal cual NOMBRES_LOGROS.md')
  debe(R.emblemas.every((e) => nombres.includes(e.nombre.split(' ').slice(0, 3).join(' '))), 'datos', 'los nombres de los emblemas están en NOMBRES_LOGROS.md')
}

/* ─────────────────────────── 2. Las reglas puras ─────────────────────────── */
console.log('2. Las reglas: fotos, Vistos, horas y pase')
const viajeEj = { inicio: '2026-10-10', fin: '2026-10-14' }
const destinoRoma = { timezone: 'Europe/Rome' }
const sitioTrevi = { coords: coords('fontana_de_trevi'), radio_m: R.sitios.fontana_de_trevi.radio_m }
const enTrevi = coords('fontana_de_trevi')
const enMadrid = { lat: 40.4168, lng: -3.7038 }
{
  const foto = (p) => evaluarFoto({ origen: 'galeria', tomadaEn: '2026-10-12T11:00:00', conCamara: true, ubicacion: null, sitio: sitioTrevi, viaje: viajeEj, destino: destinoRoma, nombreSitio: 'Fontana de Trevi', recibidoEn: '2026-10-12T12:00:00Z', ajustes, ...p })
  debe(foto({}).valida === true && foto({}).ubic === 'sin', 'foto', 'foto de la galería buena, sin ubicación: vale')
  debe(foto({ conCamara: false }).motivo === 'no_camara' && foto({ conCamara: false }).mensaje === 'Esta foto no está hecha con una cámara.', 'foto', 'una captura o una foto de internet no vale, con el mensaje del encargo')
  const otra = foto({ tomadaEn: '2026-09-02T11:00:00' })
  debe(otra.valida === false && otra.mensaje === 'Esta foto es del 2 de septiembre. Elige una del 10 al 14 de octubre.', 'foto', `foto de otro día: ${otra.mensaje}`)
  debe(foto({ ubicacion: enMadrid }).mensaje === 'Esta foto no es de la Fontana de Trevi.' && foto({ ubicacion: enMadrid }).valida === false, 'foto', 'foto de otro sitio (si trae ubicación)')
  debe(foto({ ubicacion: enTrevi }).valida === true && foto({ ubicacion: enTrevi }).ubic === 'cerca', 'foto', 'foto con ubicación en el sitio: vale')
  debe(foto({ tomadaEn: null }).motivo === 'sin_fecha', 'foto', 'una foto de la galería sin fecha no se puede comprobar')
  debe(foto({ origen: 'app', conCamara: false, tomadaEn: null, recibidoEn: '2026-10-12T12:00:00Z' }).valida === true, 'foto', 'la foto de la cámara de la app siempre es de cámara')
  debe(foto({ recibidoEn: '2026-11-13T12:00:00Z' }).valida === true, 'plazo', 'el día 30 después del último día todavía vale (galería, fechas del viaje)')
  debe(foto({ recibidoEn: '2026-11-14T12:00:00Z' }).motivo === 'fuera_de_plazo', 'plazo', 'el día 31 ya no vale')
  debe(foto({ origen: 'app', recibidoEn: '2026-10-20T12:00:00Z' }).motivo === 'desde_casa', 'plazo', 'desde casa solo valen fotos de la galería')
  debe(foto({ recibidoEn: '2026-10-20T12:00:00Z' }).valida === true, 'plazo', 'desde casa, una foto de la galería de esas fechas vale')
  debe(instanteDeToma('2026-10-12T21:30:00', 'Europe/Rome') === '2026-10-12T19:30:00.000Z' && instanteDeToma('2026-01-12T21:30:00', 'Europe/Rome') === '2026-01-12T20:30:00.000Z' && instanteDeToma('2026-10-12T21:30:00+02:00', 'Europe/Rome') === '2026-10-12T19:30:00.000Z', 'foto', 'la hora de reloj de la cámara se toma como hora del destino (verano e invierno)')
  debe(rangoLargo('2026-09-30', '2026-10-02') === '30 de septiembre al 2 de octubre', 'foto', 'el rango de fechas cuando cruza de mes')
  const visto = (p) => evaluarVisto({ instante: '2026-10-12T10:00:00Z', recibidoEn: '2026-10-12T10:00:00Z', ubicacion: enTrevi, sitio: sitioTrevi, viaje: viajeEj, destino: destinoRoma, nombreSitio: 'Fontana de Trevi', ajustes, ...p })
  debe(visto({}).cuenta && visto({}).ubic === 'cerca', 'visto', 'Visto cerca: cuenta')
  debe(visto({ ubicacion: null }).cuenta && visto({ ubicacion: null }).ubic === 'sin' && visto({ ubicacion: null }).mensaje === 'Activa tu ubicación o haz una foto para ganar tu pedazo.', 'visto', 'Visto sin ubicación: se guarda y se le dice qué hacer')
  debe(!visto({ ubicacion: enMadrid }).cuenta && visto({ ubicacion: enMadrid }).mensaje === 'Parece que no estás en la Fontana de Trevi. Tu pedazo te espera allí.', 'visto', 'Visto lejos: el pedazo no, con su mensaje')
  debe(!visto({ instante: '2026-10-20T10:00:00Z', recibidoEn: '2026-10-20T10:00:00Z' }).cuenta && visto({ instante: '2026-10-20T10:00:00Z', recibidoEn: '2026-10-20T10:00:00Z' }).motivo === 'fuera_de_fechas', 'visto', 'Visto fuera de las fechas del viaje: no da logros')
  debe(metros({ lat: 41.9, lng: 12.5 }, { lat: 41.9, lng: 12.5 }) === 0 && metros({ lat: 41.9, lng: 12.5 }, { lat: 41.91, lng: 12.5 }) > 1000, 'visto', 'la distancia en metros')
  debe(diasParaReclamar(viajeEj, '2026-10-14') === null && diasParaReclamar(viajeEj, '2026-10-15') === 29 && diasParaReclamar(viajeEj, '2026-11-13') === 0 && diasParaReclamar(viajeEj, '2026-11-14') === null, 'plazo', 'los días que quedan para reclamar')
  const loc = (iso) => parteLocal(iso, 'Europe/Rome')
  debe(momentoDeLaHora(loc('2026-10-12T05:30:00Z'), ajustes) === 'madrugador' && momentoDeLaHora(loc('2026-10-12T06:00:00Z'), ajustes) === null, 'horas', 'Madrugador: antes de las 8:00 (las 8:00 en punto ya no)')
  debe(momentoDeLaHora(loc('2026-10-12T20:00:00Z'), ajustes) === 'nocturno' && momentoDeLaHora(loc('2026-10-12T19:59:00Z'), ajustes) === null, 'horas', 'Nocturno en verano y otoño: desde las 22:00')
  debe(momentoDeLaHora(loc('2027-01-15T18:00:00Z'), ajustes) === 'nocturno' && momentoDeLaHora(loc('2027-01-15T17:59:00Z'), ajustes) === null, 'horas', 'Nocturno en invierno: desde las 19:00')
  debe(rangoLargo('2026-10-10', '2026-10-14') === '10 al 14 de octubre', 'foto', 'el rango dentro del mismo mes')
  debe(elegirFrase(ajustes.frases_suspense, '¡Eh! Aquí hay algo…', () => 0) !== '¡Eh! Aquí hay algo…' && ajustes.frases_suspense.length === 7, 'frases', 'la frase de suspense nunca repite la última, y hay las 7 de los apuntes')
  // El pase
  debe(cobroActivo({}) === false && cobroActivo({ PASES_COBRO_ACTIVO: 'true' }) === true, 'pase', 'el cobro está apagado salvo PASES_COBRO_ACTIVO=true')
  debe(puedeGanarLogros({ cobro: false, destino: 'roma', tripId: 'a', fecha: '2026-10-11', pases: [] }).puede === true, 'pase', 'con el cobro apagado, siempre sí')
  const prueba = { estado: 'pendiente', trip_id: 'a', fecha: '2026-10-11' }
  debe(puedeGanarLogros({ cobro: true, destino: 'roma', tripId: 'a', fecha: '2026-10-11', pases: [], prueba }).motivo === 'dia_de_prueba', 'pase', 'con el cobro encendido, el día de prueba vale')
  debe(puedeGanarLogros({ cobro: true, destino: 'roma', tripId: 'a', fecha: '2026-10-12', pases: [], prueba }).puede === false, 'pase', 'con el cobro encendido, otro día sin pase no')
  debe(puedeGanarLogros({ cobro: true, destino: 'roma', tripId: 'a', fecha: '2026-10-12', pases: [{ destino: 'Roma' }], prueba }).motivo === 'con_pase', 'pase', 'con el cobro encendido, con el pase de ese destino sí')
  debe(puedeGanarLogros({ cobro: true, destino: 'roma', tripId: 'b', fecha: '2026-10-11', pases: [{ destino: 'florencia' }], prueba }).puede === false, 'pase', 'el pase de otro destino no vale')
  debe(puedeGanarLogros({ cobro: true, destino: 'roma', tripId: 'a', fecha: '2026-10-12', pases: [], prueba: { estado: 'gastada', trip_id: 'a', fecha: '2026-10-11' } }).motivo === 'prueba_ya_usada', 'pase', 'con la prueba ya gastada y sin pase, otro día: la prueba ya está usada')
}

console.log('2b. El día de prueba de HOY')
{
  const aj = datos.pase.ajustes
  const dias = (n, desde = 10) => Array.from({ length: n }, (_, i) => ({ numero: i + 1, fecha: `2026-10-${String(desde + i).padStart(2, '0')}` }))
  const dia = (viaje) => elegirDiaDePrueba(viaje, aj)
  debe(dia({ dias: dias(5), llegada: '07:00' }).numero === 1, 'prueba', 'llegada a las 7:00: el día de llegada está libre antes de las 10:00 → la prueba es ese día')
  debe(dia({ dias: dias(5), llegada: '14:00' }).numero === 2, 'prueba', 'llegada a las 14:00: el día de llegada no está libre antes de las 10:00 → el día siguiente')
  debe(dia({ dias: dias(5), llegada: null }).numero === 1 && dia({ dias: dias(5), llegada: null }).motivo === 'sin_vuelo', 'prueba', 'sin vuelo puesto: el día 1')
  debe(dia({ dias: dias(5), llegada: null, vuelta: '20:00' }).numero === 1, 'prueba', 'solo con la vuelta puesta (sin llegada): el día 1')
  const dos = dia({ dias: dias(2), llegada: '22:00', vuelta: '07:00' })
  debe(dos.numero === 1 && dos.motivo === 'mas_horas_libres', 'prueba', 'viaje de 2 días con llegada tarde y vuelo de madrugada: ningún día libre antes de las 10:00 → el día con más horas libres')
  const dos2 = dia({ dias: dias(2), llegada: '13:00', vuelta: '09:00' })
  debe(dos2.motivo === 'mas_horas_libres' && dos2.numero === 1, 'prueba', 'otro viaje de 2 días: el día 2 sale antes de poder usarse, gana el día 1 (más horas libres)')
  debe(dia({ dias: dias(2), llegada: '14:00', vuelta: '20:00' }).numero === 2 && dia({ dias: dias(2), llegada: '14:00', vuelta: '20:00' }).motivo === 'dia_siguiente', 'prueba', 'si el día siguiente está libre por la mañana, se usa ese')
  debe(diasLibres({ dias: dias(3), llegada: '08:00', vuelta: '15:00' }, aj)[2].hasta === 15 * 60 - aj.salida_antes_de_vuelo_min && diasLibres({ dias: dias(3), llegada: '08:00' }, aj)[0].desde === 8 * 60 + aj.libre_tras_llegada_min, 'prueba', 'el último día se acaba 3 horas antes del vuelo y el primero empieza al llegar más el traslado')
  // Si pone o cambia el vuelo antes de gastarla, se vuelve a calcular (mientras no se gasta, no se guarda)
  const v = { id: 'a', inicio: '2026-10-10', fin: '2026-10-14', dias: dias(5), llegada: null }
  const e1 = estadoDePrueba({ fila: null, viajes: [v], hoy: '2026-10-01', ajustes: aj })
  const e2 = estadoDePrueba({ fila: null, viajes: [{ ...v, llegada: '15:00' }], hoy: '2026-10-01', ajustes: aj })
  debe(e1.fecha === '2026-10-10' && e2.fecha === '2026-10-11' && e1.estado === 'pendiente', 'prueba', 'sin vuelo, el 10; al poner la llegada a las 15:00, se recalcula al 11')
  const gastada = { trip_id: 'a', fecha: '2026-10-10', gastada_en: '2026-10-10T09:00:00Z', pospuesta: false, pregunta_hecha: false }
  const e3 = estadoDePrueba({ fila: gastada, viajes: [{ ...v, llegada: '15:00' }], hoy: '2026-10-11', ajustes: aj })
  debe(e3.estado === 'gastada' && e3.fecha === '2026-10-10', 'prueba', 'una vez gastada, ya no se recalcula aunque cambie el vuelo')
  const e4 = estadoDePrueba({ fila: gastada, viajes: [v, { ...v, id: 'b', inicio: '2027-03-10', fin: '2027-03-12', dias: dias(3, 10) }], hoy: '2027-03-01', ajustes: aj })
  debe(e4.estado === 'gastada' && e4.trip_id === 'a', 'prueba', 'UNA prueba por cuenta, para siempre: con otro viaje después, no hay otra')
  debe(viajeDePrueba([{ id: 'x', inicio: '2026-05-01', fin: '2026-05-03' }, { id: 'y', inicio: '2026-10-10', fin: '2026-10-12' }], '2026-10-01').id === 'y', 'prueba', 'la prueba es del primer viaje al que todavía no le ha pasado el último día')
  // La pregunta de las 12:00
  const pend = { estado: 'pendiente', trip_id: 'a', fecha: '2026-10-11', pregunta_hecha: false }
  debe(tocaPreguntar({ prueba: pend, hoy: '2026-10-11', minutosLocales: 11 * 60 + 59, ajustes: aj }) === false && tocaPreguntar({ prueba: pend, hoy: '2026-10-11', minutosLocales: 12 * 60, ajustes: aj }) === true, 'prueba', 'la pregunta sale a partir de las 12:00, no antes')
  debe(tocaPreguntar({ prueba: { ...pend, pregunta_hecha: true }, hoy: '2026-10-11', minutosLocales: 15 * 60, ajustes: aj }) === false && tocaPreguntar({ prueba: pend, hoy: '2026-10-12', minutosLocales: 15 * 60, ajustes: aj }) === false, 'prueba', 'se pregunta una sola vez, y solo el día de la prueba')
  debe(aj.pregunta.texto === 'Te queda medio día. ¿Usas hoy tu día de prueba o lo guardas para mañana?' && aj.pregunta.opciones.map((o) => o.texto).join() === 'Hoy,Mañana', 'prueba', 'el texto de la pregunta y sus botones son los del encargo')
}

console.log('2c. Los precios del pase y quién paga')
{
  const pr = datos.pase.precios
  debe(precioDelPase(pr, 'uno').total === 6.99, 'precios', '1 persona: 6,99 €')
  const duo = precioDelPase(pr, 'duo')
  debe(duo.total === 10.99 && duo.por_persona === 5.5 && duo.tachado === 13.98, 'precios', 'Pase Dúo: 10,99 € (13,98 € tachado, 5,50 € cada uno)')
  debe(precioDelPase(pr, 'grupo', 3).total === 14.97 && precioDelPase(pr, 'grupo', 4).total === 19.96 && precioDelPase(pr, 'grupo', 3).por_persona === 4.99, 'precios', 'Pase Grupo, 3 o más: 4,99 € cada uno')
  debe(precioDelPase(pr, 'grupo', 5).por_persona === 4.99 && precioDelPase(pr, 'grupo', 10).total === 49.9, 'precios', 'de 5 en adelante sigue siendo 4,99 € (fuera el escalón de 3,99 €)')
  debe(!JSON.stringify(pr).includes('3.99') && !JSON.stringify(pr).includes('3,99'), 'precios', 'el escalón de 3,99 € ya no existe en los datos')
  debe(precioDelPase(pr, 'grupo', 2) === null && precioDelPase(pr, 'grupo', 51) === null && precioDelPase(pr, 'raro') === null, 'precios', 'un grupo de 2 o de más del máximo no vale')
  debe(planParaPersonas(pr, 1) === 'uno' && planParaPersonas(pr, 2) === 'duo' && planParaPersonas(pr, 7) === 'grupo' && planParaPersonas(pr, 0) === null, 'precios', 'el plan que toca según las personas')
  const reparto = repartoDelPago(pr, { plan: 'duo', personas: 2, comprador: 'laura', invitados: ['elena'] })
  debe(reparto.length === 2 && reparto[0].usuario === 'laura' && reparto[0].paga === 10.99 && reparto[1].usuario === 'elena' && reparto[1].paga === 0, 'precios', 'paga todo el que compra: el invitado entra con su plaza sin pagar nada')
  const grupo = repartoDelPago(pr, { plan: 'grupo', personas: 4, comprador: 'laura', invitados: ['a', 'b', 'c'] })
  debe(grupo[0].paga === 19.96 && grupo.slice(1).every((x) => x.paga === 0), 'precios', 'igual en el Pase Grupo: paga todo la que compra')
  const codigoPase = ['pase.js'].map((f) => fs.readFileSync('server/logros/' + f, 'utf8')).join('\n') + fs.readFileSync('data/pase/precios.json', 'utf8')
  debe(!/cada_uno_paga|pagar_cada|pago_por_separado|por separado/i.test(codigoPase.replace(/PAGA TODO|Paga todo/g, '')) || /paga.*el_que_compra/.test(codigoPase), 'precios', 'no hay nada para que cada uno pague su parte')
}


/* ─────────────────────────── 3. El servicio sobre Postgres de verdad ─────────────────────────── */
console.log('3. El servicio: los hechos, lo ganado y el recálculo (PGlite)')
delete globalThis.window
delete globalThis.document
const db = new PGlite()
await db.exec(`
  create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
  create schema auth;
  create table auth.users (id uuid primary key default gen_random_uuid(), email text, is_anonymous boolean not null default false, created_at timestamptz default now());
  create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
  create function auth.uid() returns uuid language sql stable as $$ select nullif(auth.jwt() ->> 'sub', '')::uuid $$;
  create schema storage;
  create table storage.buckets (id text primary key, name text, public boolean default false);
  create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text references storage.buckets (id), name text, owner uuid, created_at timestamptz default now(), unique (bucket_id, name));
  alter table storage.objects enable row level security;
  create function storage.foldername(name text) returns text[] language sql immutable as $$ select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1] $$;
`)
const migraciones = fs.readdirSync('supabase/migrations').filter((f) => /^(0001|0002|0003|0012|0018|0020|0021|0023|0024|0025|0030)_/.test(f)).sort()
for (const archivo of migraciones) {
  try {
    await db.exec(fs.readFileSync(path.join('supabase/migrations', archivo), 'utf8'))
  } catch (error) {
    debe(false, 'migracion', `${archivo} no se aplica: ${error.message}`)
  }
}
debe(migraciones.includes('0023_logros.sql'), 'migracion', 'la migración 0023 se aplica después de la 0020 y la 0021')
await db.exec(`
  grant usage on schema public, auth, storage to anon, authenticated, service_role;
  grant all on all tables in schema public to authenticated, service_role;
  grant select on all tables in schema public to anon;
  grant all on all tables in schema storage to authenticated, service_role;
  grant select on auth.users to authenticated, service_role;
  grant execute on all functions in schema public to authenticated, service_role;
  grant execute on all functions in schema auth to anon, authenticated, service_role;
  grant execute on all functions in schema storage to anon, authenticated, service_role;
`)
await db.exec('revoke execute on function public.reclamar_anonimo(uuid, uuid) from authenticated')
await db.exec('revoke execute on function public.preparar_borrado(uuid) from authenticated')
await db.exec('revoke execute on function public.reclamar_anonimo_logros(uuid, uuid) from authenticated')
await db.exec('revoke execute on function public.logro_orden_pionero(uuid, text) from authenticated')
await db.exec('revoke execute on function public.logro_contar() from authenticated')

const claims = (uid) => JSON.stringify({ sub: uid, role: 'authenticated', is_anonymous: false })
async function como(uid, fn) {
  await db.exec('reset role')
  await db.query("select set_config('request.jwt.claims', $1, false)", [claims(uid)])
  await db.exec('set role authenticated')
  try {
    return await fn()
  } finally {
    await db.exec('reset role')
    await db.query("select set_config('request.jwt.claims', '', false)")
  }
}
const q = async (sql, params = []) => (await db.query(sql, params)).rows
const lanza = async (fn) => {
  try {
    await fn()
    return null
  } catch (error) {
    return String(error?.message ?? error)
  }
}
// Todo lo que hace el servidor va con el rol de servicio (se salta las reglas de seguridad, como la clave de servicio de Supabase).
const servidor = async (fn) => {
  await db.exec('reset role')
  await db.exec('set role service_role')
  try {
    return await fn()
  } finally {
    await db.exec('reset role')
  }
}
const S = (sql, params = []) => servidor(() => q(sql, params))

/** El `repo` del servicio, sobre PGlite (la misma forma que server/logros/repo.js sobre Supabase). */
const repoPG = {
  hechosDe: (u) => S('select * from public.logro_hechos where user_id = $1 and deshecho_en is null', [u]).then((f) => f.map(normalizarHecho)),
  insertarHecho: async (f) =>
    normalizarHecho((await S(
      `insert into public.logro_hechos (user_id, trip_id, destino, tipo, sitio, stop_id, instante, recibido_en, ubic, valido, motivo, origen, foto_id, inicio, fin) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) returning *`,
      [f.user_id, f.trip_id, f.destino, f.tipo, f.sitio ?? null, f.stop_id ?? null, f.instante, f.recibido_en, f.ubic, f.valido, f.motivo ?? null, f.origen ?? null, f.foto_id ?? null, f.inicio, f.fin],
    ))[0]),
  deshacerHecho: (id, cuando) => S('update public.logro_hechos set deshecho_en = $2 where id = $1', [id, cuando]),
  viajesDe: async (u) => {
    const filas = await S('select t.id, t.route, t.traveler_id from public.trips t where t.traveler_id = $1 or t.id in (select trip_id from public.trip_members where user_id = $1)', [u])
    const duos = await S("select distinct i.trip_id from public.trip_invitations i join public.passes p on p.id = i.pass_id where p.tipo = 'duo'")
    return filas.map((t) => ({ ...t, es_duo: duos.some((d) => d.trip_id === t.id) }))
  },
  logrosDe: (u) => S('select * from public.achievements where user_id = $1', [u]),
  insertarLogros: async (u, filas) => {
    const dentro = []
    for (const f of filas) {
      const r = await S('insert into public.achievements (user_id, destino, logro, escalon, trip_id, ganado_en, frase) values ($1,$2,$3,$4,$5,$6,$7) on conflict (user_id, destino, logro, escalon) do nothing returning *', [u, f.destino, f.logro, String(f.escalon), f.trip_id ?? null, f.ganado_en, f.frase ?? null])
      dentro.push(...r)
    }
    return dentro
  },
  borrarLogros: async (u, claves) => {
    for (const c of claves) await S('delete from public.achievements where user_id = $1 and destino = $2 and logro = $3 and escalon = $4', [u, c.destino, c.logro, String(c.escalon)])
  },
  cuentaDe: async (u) => {
    const v = (await S('select alta_cuenta from public.travelers where id = $1', [u]))[0]
    const c = (await S("select value from public.app_config where key = 'salida_app'"))[0]
    return { alta_cuenta: v?.alta_cuenta ? new Date(v.alta_cuenta).toISOString() : null, salida: c ? String(c.value).slice(0, 10) : null }
  },
  ordenPionero: async (u) => {
    const salida = {}
    const r = (await S("select public.logro_orden_pionero($1, 'roma') as n", [u]))[0].n
    if (r != null) salida.roma = r
    return salida
  },
  probadorDe: async (u) => (await S("select ganado_en from public.achievements where user_id = $1 and logro = 'viajero:probador'", [u]))[0]?.ganado_en?.toISOString?.() ?? null,
  ultimaFrase: async (u) => (await S('select frase from public.achievements where user_id = $1 and frase is not null order by ganado_en desc limit 1', [u]))[0]?.frase ?? null,
  sinPaseDe: async (u) => Boolean((await S('select activo from public.admin_sin_pase where user_id = $1', [u]))[0]?.activo),
  ponerSinPase: async (u, activo) => {
    await S('insert into public.admin_sin_pase (user_id, activo) values ($1, $2) on conflict (user_id) do update set activo = excluded.activo, updated_at = now()', [u, Boolean(activo)])
    return { ok: true }
  },
  pasesDe: (u) => S('select id, destino, tipo from public.passes where comprador_id = $1 or para_id = $1 or id in (select pass_id from public.pass_members where user_id = $1)', [u]),
  pruebaDe: async (u) => {
    const f = (await S('select * from public.hoy_prueba where user_id = $1', [u]))[0]
    return f ? { ...f, fecha: new Date(f.fecha).toISOString().slice(0, 10), gastada_en: f.gastada_en ? new Date(f.gastada_en).toISOString() : null } : null
  },
  guardarPrueba: (u, f) =>
    S(
      `insert into public.hoy_prueba (user_id, trip_id, fecha, gastada_en, pospuesta, pregunta_hecha) values ($1,$2,$3,$4,$5,$6)
       on conflict (user_id) do update set trip_id = excluded.trip_id, fecha = excluded.fecha, gastada_en = excluded.gastada_en, pospuesta = excluded.pospuesta, pregunta_hecha = excluded.pregunta_hecha, updated_at = now()`,
      [u, f.trip_id, f.fecha, f.gastada_en, f.pospuesta, f.pregunta_hecha],
    ),
  perfilDe: async (u) => {
    const f = (await S('select previos, vitrina, exp_max from public.logro_perfil where user_id = $1', [u]))[0]
    return { previos: f?.previos ?? { paises: [], dias: 0 }, vitrina: f?.vitrina ?? { baldas: {}, titulo: null }, exp_max: f?.exp_max ?? 0 }
  },
  guardarPerfil: async (u, p) => {
    await S('insert into public.logro_perfil (user_id) values ($1) on conflict (user_id) do nothing', [u])
    if (p.previos) await S('update public.logro_perfil set previos = $2::jsonb where user_id = $1', [u, JSON.stringify(p.previos)])
    if (p.vitrina) await S('update public.logro_perfil set vitrina = $2::jsonb where user_id = $1', [u, JSON.stringify(p.vitrina)])
    if (p.exp_max != null) await S('update public.logro_perfil set exp_max = $2 where user_id = $1', [u, p.exp_max])
  },
  referidosDe: (u) => S('select invitado_id as invitado, creado_en, viaje_acabado_en from public.logro_referidos where invitador_id = $1', [u]),
  invitadorDe: async (u) => (await S('select invitador_id, viaje_acabado_en from public.logro_referidos where invitado_id = $1', [u]))[0] ?? null,
  apuntarInvitacion: async (a, b) => {
    if (a === b) return false
    await S('insert into public.logro_referidos (invitador_id, invitado_id) values ($1, $2) on conflict (invitado_id) do nothing', [a, b])
    return true
  },
  marcarInvitacionCumplida: (u, cuando) => S('update public.logro_referidos set viaje_acabado_en = $2 where invitado_id = $1 and viaje_acabado_en is null', [u, cuando]),
  cuentasConHechos: async () => [...new Set((await S('select user_id from public.logro_hechos where deshecho_en is null')).map((f) => f.user_id))],
  marcarAnimacion: async (u, claves, vista) => {
    for (const c of claves) await S('update public.achievements set animacion_vista = $5 where user_id = $1 and destino = $2 and logro = $3 and escalon = $4', [u, c.destino, c.logro, String(c.escalon), vista])
  },
  encolarAvisos: async (filas) => {
    const dentro = []
    for (const f of filas) dentro.push(...(await S('insert into public.logro_avisos (user_id, trip_id, tipo, enviar_en, payload) values ($1,$2,$3,$4,$5::jsonb) on conflict (user_id, trip_id, tipo) do nothing returning *', [f.user_id, f.trip_id, f.tipo, f.enviar_en, JSON.stringify(f.payload)])))
    return dentro
  },
  avisosPendientes: (ahora) => S('select * from public.logro_avisos where enviado_en is null and enviar_en <= $1 order by enviar_en', [ahora]),
  marcarAvisoEnviado: (id, cuando) => S('update public.logro_avisos set enviado_en = $2 where id = $1', [id, cuando]),
  suscripcionesDe: (u) => S('select endpoint, claves from public.push_suscripciones where user_id = $1', [u]),
  guardarSuscripcion: (u, e, c) => S('insert into public.push_suscripciones (user_id, endpoint, claves) values ($1,$2,$3::jsonb) on conflict (endpoint) do nothing', [u, e, JSON.stringify(c)]),
  contarLogros: () => S('select * from public.logro_contar()'),
  usuarioPorEmail: async (e) => (await S('select id, email from auth.users where email = $1', [e]))[0] ?? null,
  darProbador: (u, cuando) => S("insert into public.achievements (user_id, logro, escalon, destino, ganado_en) values ($1, 'viajero:probador', '', '*', $2) on conflict do nothing returning *", [u, cuando]),
}
function normalizarHecho(f) {
  return { ...f, instante: new Date(f.instante).toISOString(), recibido_en: new Date(f.recibido_en).toISOString(), inicio: f.inicio ? new Date(f.inicio).toISOString().slice(0, 10) : null, fin: f.fin ? new Date(f.fin).toISOString().slice(0, 10) : null, deshecho_en: f.deshecho_en ? new Date(f.deshecho_en).toISOString() : null }
}
// (Las fechas de tipo date las devuelve PGlite a las 00:00 UTC; se toma el día tal cual.)

let reloj = new Date('2026-10-12T12:00:00Z')
const servicio = crearServicioLogros({ repo: repoPG, datos, catalogos, ahora: () => reloj, cobro: false, azar: () => 0 })

const nuevoUsuario = async (email) => {
  const id = (await q('insert into auth.users (email, is_anonymous) values ($1, false) returning id', [email]))[0].id
  await S('insert into public.travelers (id, is_anonymous, alta_cuenta) values ($1, false, $2)', [id, '2026-10-01T10:00:00Z'])
  return id
}
const rutaRoma = (inicio, fin, dias, companion = 'couple') => ({
  destination: 'Roma',
  answers: { dateRange: { start: inicio, end: fin }, companion },
  days: dias.map((ids, i) => ({ id: `d${i + 1}`, dayNumber: i + 1, stops: ids.map((id, j) => ({ id: `d${i + 1}s${j + 1}`, name: nombre(id) })) })),
})
const nuevoViaje = async (uid, ruta) => (await S('insert into public.trips (traveler_id, route) values ($1, $2::jsonb) returning id', [uid, JSON.stringify(ruta)]))[0].id
const RUTA_BASE = rutaRoma('2026-10-10', '2026-10-14', [
  ['coliseo', 'foro_romano_y_palatino', 'fontana_de_trevi'],
  ['panteon', 'piazza_navona', 'plaza_de_espana'],
  ['museos_vaticanos_y_capilla_sixtina', 'basilica_de_san_pedro', 'plaza_de_san_pedro'],
  ['castillo_de_santangelo', 'trastevere', 'isla_tiberina'],
  ['galeria_borghese', 'mirador_del_janiculo'],
])
const persona = async (email, ruta = RUTA_BASE) => {
  const uid = await nuevoUsuario(email)
  const trip = await nuevoViaje(uid, ruta)
  return { uid, trip }
}
const dia = (n, hh = '10:00') => `2026-10-${String(9 + n).padStart(2, '0')}T${hh}:00Z`
const V = (p, sitio, instante, extra = {}) => servicio.visto(p.uid, { trip_id: p.trip, sitio, instante, recibido_en: instante, ubicacion: coords(sitio), ...extra })
const F = (p, sitio, instante, extra = {}) => servicio.foto(p.uid, { trip_id: p.trip, sitio, origen: 'app', tomada_en: instante, con_camara: true, ubicacion: coords(sitio), recibido_en: instante, ...extra })
const claves = (r) => r.nuevos.map((m) => m.clave).filter(Boolean)
const tiene = async (p, destino, logro, escalon = '') => (await repoPG.logrosDe(p.uid)).some((f) => f.destino === destino && f.logro === logro && String(f.escalon) === String(escalon))
const tipos = (r) => r.nuevos.map((m) => m.tipo)

// ── Los 4 grados de Roma ──
{
  const p = await persona('ana@correo.es')
  const grados = []
  const orden = ['coliseo', 'foro_romano_y_palatino', 'fontana_de_trevi', 'panteon', 'piazza_navona', 'plaza_de_espana', 'castillo_de_santangelo', 'trastevere']
  const dias = [1, 1, 1, 2, 2, 2, 4, 4]
  for (let i = 0; i < orden.length; i++) {
    const r = await V(p, orden[i], dia(dias[i], `${10 + i}:00`))
    const sello = r.nuevos.find((m) => m.tipo === 'sello')
    grados.push(`${i + 1}:${sello?.grado ?? '-'}`)
  }
  debe(grados.join() === '1:bronce,2:-,3:-,4:plata,5:-,6:oro,7:-,8:diamante', 'sellos', `los 4 grados de Roma (1 bronce, 4 plata, 6 oro, 8 diamante): ${grados.join()}`)
  const filas = await repoPG.logrosDe(p.uid)
  debe(['bronce', 'plata', 'oro', 'diamante'].every((g) => filas.some((f) => f.logro === 'sello' && f.escalon === `roma:${g}`)), 'sellos', 'el sello queda guardado con cada grado alcanzado (es uno solo y se transforma)')
  const estado = await servicio.estado(p.uid, p.trip)
  debe(estado.sellos.find((s) => s.id === 'roma').grado === 'diamante' && estado.sellos.find((s) => s.id === 'roma').siguiente === null, 'sellos', 'el estado dice diamante y nada más que subir')
  debe(estado.colecciones[0].id === 'imprescindibles' && estado.colecciones[0].completa, 'colecciones', 'la colección completa sube arriba de la lista')
  debe(estado.secretos.encontrados === 0 && estado.secretos.texto === 'Roma esconde 14 secretos', 'emblemas', 'sin emblemas: «Roma esconde 14 secretos» (nunca cuáles ni dónde)')
}

// ── Los 3 grados del Vaticano (sin bronce) ──
{
  const p = await persona('vati@correo.es')
  const r1 = await V(p, 'plaza_de_san_pedro', dia(3, '09:00'))
  const r2 = await V(p, 'basilica_de_san_pedro', dia(3, '10:00'))
  const r3 = await V(p, 'museos_vaticanos_y_capilla_sixtina', dia(3, '12:00'))
  const g = (r) => r.nuevos.find((m) => m.tipo === 'sello' && m.sello === 'vaticano')?.grado
  debe(g(r1) === 'plata' && g(r2) === 'oro' && g(r3) === 'diamante', 'sellos', `el Vaticano: 1 plata, 2 oro, 3 diamante (${g(r1)}, ${g(r2)}, ${g(r3)})`)
  debe(!(await tiene(p, 'roma', 'sello', 'vaticano:bronce')), 'sellos', 'el Vaticano no tiene bronce')
  debe(r3.nuevos.some((m) => m.tipo === 'coleccion' && m.id === 'pais_mas_pequeno'), 'colecciones', 'completar los tres sitios completa «El país más pequeño del mundo»')
  debe(r1.nuevos.some((m) => m.tipo === 'pais' && m.pais === 'Ciudad del Vaticano') && r1.nuevos.some((m) => m.tipo === 'pais' && m.pais === 'Italia') === false, 'viajero', 'el primer sitio del Vaticano da el país Ciudad del Vaticano (no Italia)')
  debe(r1.nuevos.some((m) => m.tipo === 'patrimonio' && m.id === 'ciudad_del_vaticano'), 'viajero', 'y su Patrimonio (la Ciudad del Vaticano)')
}

// ── El país del primer Visto (Tanda 8B3): el Coliseo es Italia, no el Vaticano ──
{
  const p = await persona('pais-coliseo@correo.es')
  const c = await V(p, 'coliseo', dia(1, '09:00'))
  const pc = c.nuevos.filter((m) => m.tipo === 'pais')
  debe(pc.length === 1 && pc[0].pais === 'Italia' && pc[0].n === 1 && pc[0].nombre === 'Tu país número 1: Italia', 'pais', 'el primer Visto en el Coliseo da «Tu país número 1: Italia» (nunca el Vaticano)')
  const dn = c.nuevos.filter((m) => m.tipo === 'destino_nuevo')
  debe(dn.length === 1 && dn[0].n === 1 && dn[0].destino === 'roma', 'pais', 'y «Tu destino número 1: Roma», una sola vez')
  const pat = c.nuevos.filter((m) => m.tipo === 'patrimonio')
  debe(pat.length === 1 && pat[0].id === 'centro_historico_de_roma' && pat[0].nombre === 'Centro histórico de Roma', 'patrimonio', 'el primer Visto en el Coliseo da el Patrimonio «Centro histórico de Roma» (Tanda 8B4)')
  const orden = c.nuevos.map((m) => m.tipo).filter((t) => ['emblema', 'sello', 'pais', 'destino_nuevo', 'maravilla', 'patrimonio'].includes(t)).join()
  debe(orden === 'sello,pais,destino_nuevo,maravilla,patrimonio' || orden === 'emblema,sello,pais,destino_nuevo,maravilla,patrimonio', 'maravilla', `(8B4) la maravilla del Coliseo ya no va pegada a su emblema: sale con «Y además…», antes del Patrimonio (${orden})`)
  const mar = c.nuevos.find((m) => m.tipo === 'maravilla')
  debe(mar && mar.n === 1 && JSON.stringify(mar.maravillas) === '["coliseo"]', 'maravilla', '(8B5) la maravilla del Coliseo lleva la lista de las que tiene el viajero ([coliseo]) para pintar la medalla')
  debe(pat[0].n === 1, 'patrimonio', '(8B5) y el Patrimonio lleva su número («Tu Patrimonio número 1»)')
  const c2 = await V(p, 'fontana_de_trevi', dia(1, '10:00'))
  debe(!c2.nuevos.some((m) => m.tipo === 'pais' || m.tipo === 'destino_nuevo'), 'pais', 'el segundo sitio del mismo día no repite país ni destino')
  const v = await V(p, 'basilica_de_san_pedro', dia(1, '12:00'))
  const pv = v.nuevos.filter((m) => m.tipo === 'pais')
  debe(pv.length === 1 && pv[0].pais === 'Ciudad del Vaticano' && pv[0].n === 2 && !v.nuevos.some((m) => m.tipo === 'destino_nuevo'), 'pais', 'la Basílica da «Tu país número 2: Ciudad del Vaticano» y no un destino nuevo')
  // El resumen del día cuenta solo lo de ese día (Tanda 8B3).
  const dia2 = await V(p, 'panteon', dia(2, '10:00'))
  const r1d = await servicio.resumenDe(p.uid, p.trip, { dia: '2026-10-10' })
  const r2d = await servicio.resumenDe(p.uid, p.trip, { dia: '2026-10-11' })
  const claves = (r) => r.ganado.map((x) => x.logro + ':' + x.escalon)
  debe(r1d.ganado.length > 0 && r2d.ganado.length > 0 && !claves(r1d).some((k) => claves(r2d).includes(k)), 'resumen', 'el resumen de cada día cuenta solo lo que salió ese día, sin arrastrar lo de otros días')
  debe(r1d.por_categoria.emblema === undefined && r2d.por_categoria.emblema === undefined && !claves(r2d).some((k) => k.includes('coliseo')), 'resumen', 'sin foto no hay emblema en el resumen, y el del día 2 no trae lo del Coliseo del día 1')
  void dia2
}

// ── Pedazo: con ubicación cerca, sin ubicación, lejos y con foto ──
{
  const p = await persona('pedazo@correo.es')
  const cerca = await V(p, 'piazza_navona', dia(2, '10:00'))
  debe(cerca.cuenta && cerca.ubic === 'cerca' && cerca.nuevos.some((m) => m.tipo === 'suma' && m.coleccion === 'imprescindibles'), 'pedazo', 'con ubicación y cerca: se gana al tocar Visto, sin foto')
  debe(await tiene(p, 'roma', 'pedazo', 'imprescindibles:piazza_navona'), 'pedazo', 'el pedazo queda guardado')
  const sin = await V(p, 'panteon', dia(2, '11:00'), { ubicacion: null })
  debe(sin.cuenta && sin.ubic === 'sin' && sin.aviso === 'Activa tu ubicación o haz una foto para ganar tu pedazo.' && !(await tiene(p, 'roma', 'pedazo', 'imprescindibles:panteon')), 'pedazo', 'sin ubicación: el Visto se guarda pero el pedazo todavía no, y se le dice qué hacer')
  const conFoto = await F(p, 'panteon', dia(2, '11:05'), { ubicacion: null })
  debe(conFoto.valida && (await tiene(p, 'roma', 'pedazo', 'imprescindibles:panteon')), 'pedazo', 'y con una foto válida de ese día, gana el pedazo')
  const lejos = await V(p, 'plaza_de_espana', dia(2, '12:00'), { ubicacion: { lat: 40.4168, lng: -3.7038 } })
  debe(!lejos.cuenta && lejos.mensaje === 'Parece que no estás en la Plaza de España. Tu pedazo te espera allí.' && !(await tiene(p, 'roma', 'pedazo', 'imprescindibles:plaza_de_espana')), 'pedazo', 'con la ubicación lejos: el Visto se marca para la ruta pero el pedazo no')
  const hechos = await repoPG.hechosDe(p.uid)
  debe(!hechos.some((h) => h.sitio === 'plaza_de_espana'), 'pedazo', 'el Visto de lejos no se guarda como hecho de logros')
  const cols = await S('select column_name from information_schema.columns where table_name = $1', ['logro_hechos'])
  debe(!cols.some((c) => /lat|lng|coord|ubicacion/i.test(c.column_name)), 'privacidad', 'la base de datos no tiene dónde guardar coordenadas: solo la decisión (cerca / lejos / sin)')
}

// ── Emblema: sin foto no, con foto sí ──
{
  const p = await persona('emblema@correo.es')
  const v = await V(p, 'fontana_de_trevi', dia(1, '10:00'))
  debe(!v.nuevos.some((m) => m.tipo === 'emblema') && !(await tiene(p, 'roma', 'emblema', 'fontana_de_trevi')), 'emblema', 'un emblema sin foto no se gana (aunque haya Visto)')
  const f = await F(p, 'fontana_de_trevi', dia(1, '10:02'))
  const em = f.nuevos.find((m) => m.tipo === 'emblema')
  debe(em && em.nombre === 'Volverás a Roma' && em.primera_vez === true && ajustes.frases_suspense.includes(em.frase), 'emblema', 'con una foto válida, sí; con su frase de suspense la primera vez')
  debe(f.nuevos[0].tipo === 'emblema', 'orden', 'el emblema va el primero de los momentos')
  const guardada = (await repoPG.logrosDe(p.uid)).find((x) => x.logro === 'emblema')
  debe(guardada.animacion_vista === false && guardada.frase === em.frase, 'emblema', 'se guarda su frase y que su animación aún no se ha visto (el puntito)')
  const otra = await F(p, 'coliseo', dia(1, '09:00'), {})
  debe(otra.nuevos.find((m) => m.tipo === 'emblema')?.frase !== em.frase, 'frases', 'la siguiente frase de suspense no repite la última')
  {
    const iE = otra.nuevos.findIndex((m) => m.tipo === 'emblema' && m.id === 'coliseo')
    const iM = otra.nuevos.findIndex((m) => m.tipo === 'maravilla' && m.id === 'coliseo')
    debe(iE >= 0 && iM === iE + 1 && otra.nuevos[iE].maravilla === 'coliseo', 'orden', 'la maravilla del Coliseo va justo después de su emblema («Tu primera maravilla · 1 de 7»), no con el «Y además…» (Tanda 8B2)')
  }
  // (Tanda 10) Los dos emblemas nuevos, como los demás: sin foto no, con una foto válida sí.
  {
    const n = await persona('emblemas-nuevos@correo.es')
    const v1 = await V(n, 'plaza_de_espana', dia(1, '10:00'))
    debe(!v1.nuevos.some((m) => m.tipo === 'emblema') && !(await tiene(n, 'roma', 'emblema', 'plaza_de_espana')), 'emblemas14', 'Plaza de España: sin foto no hay emblema')
    const f1 = await F(n, 'plaza_de_espana', dia(1, '10:02'))
    const e1 = f1.nuevos.find((m) => m.tipo === 'emblema')
    debe(e1 && e1.id === 'plaza_de_espana' && e1.nombre === 'Escalón a escalón', 'emblemas14', 'Plaza de España: con foto se gana «Escalón a escalón»')
    const f2 = await F(n, 'castillo_de_santangelo', dia(1, '11:00'))
    const e2 = f2.nuevos.find((m) => m.tipo === 'emblema')
    debe(e2 && e2.id === 'castillo_de_santangelo' && e2.nombre === 'Tumba de emperador', 'emblemas14', 'Castillo de Sant’Angelo: con foto se gana «Tumba de emperador»')
    const est = await servicio.estado(n.uid, n.trip)
    debe(est.secretos.total === 14 && est.secretos.encontrados === 2 && est.secretos.texto === '2 de 14 secretos encontrados', 'emblemas14', 'el total sale de los datos: 2 de 14')
    debe(est.secretos.encontrados_lista.some((x) => x.id === 'plaza_de_espana') && est.secretos.encontrados_lista.some((x) => x.id === 'castillo_de_santangelo'), 'emblemas14', 'los dos salen en la lista de los encontrados (la colección y la vitrina)')
  }
  const estado = await servicio.estado(p.uid, p.trip)
  debe(estado.puntito === true && estado.secretos.encontrados === 2 && estado.secretos.texto === '2 de 14 secretos encontrados', 'puntito', 'el botón lleva puntito y dice «2 de 14 secretos encontrados»')
  await servicio.estado(p.uid, p.trip)
  await repoPG.marcarAnimacion(p.uid, [{ destino: 'roma', logro: 'emblema', escalon: 'fontana_de_trevi' }, { destino: 'roma', logro: 'emblema', escalon: 'coliseo' }], true)
  const filas = await repoPG.logrosDe(p.uid)
  debe(filas.filter((x) => x.logro === 'emblema').every((x) => x.animacion_vista === true), 'puntito', 'marcar la animación como vista la apaga')
}

// ── La foto de la galería ──
{
  const p = await persona('galeria@correo.es')
  const g = (extra) => servicio.foto(p.uid, { trip_id: p.trip, sitio: 'panteon', origen: 'galeria', tomada_en: '2026-10-11T11:00:00', con_camara: true, ubicacion: null, recibido_en: '2026-10-11T12:00:00Z', ...extra })
  const otroDia = await g({ tomada_en: '2026-09-02T11:00:00' })
  debe(!otroDia.valida && otroDia.mensaje === 'Esta foto es del 2 de septiembre. Elige una del 10 al 14 de octubre.', 'galeria', 'foto de otro día: se rechaza con su mensaje')
  const sinCamara = await g({ con_camara: false })
  debe(!sinCamara.valida && sinCamara.mensaje === 'Esta foto no está hecha con una cámara.', 'galeria', 'sin datos de cámara: se rechaza')
  const otroSitio = await g({ ubicacion: coords('fontana_de_trevi') })
  debe(!otroSitio.valida && otroSitio.mensaje === 'Esta foto no es del Panteón.', 'galeria', 'de otro sitio (con ubicación): se rechaza')
  debe((await repoPG.hechosDe(p.uid)).length === 0, 'galeria', 'lo rechazado no se guarda')
  const buena = await g({})
  debe(buena.valida && buena.nuevos.some((m) => m.tipo === 'emblema' && m.id === 'panteon'), 'galeria', 'una buena: vale y da el emblema')
  const amigo = await g({ de_amigo: true, sitio: 'trastevere', tomada_en: '2026-10-12T10:00:00' })
  debe(amigo.valida, 'galeria', 'la foto de un amigo del grupo también vale')
  debe(!(await tiene(p, 'roma', 'emblema', 'trastevere')), 'emblema', 'un sitio sin emblema no da emblema')
}

// ── Un Visto fuera de las fechas del viaje ──
{
  const p = await persona('fuera@correo.es')
  const r = await V(p, 'coliseo', '2026-10-20T10:00:00Z')
  debe(r.cuenta === false && r.motivo === 'fuera_de_fechas' && r.nuevos.length === 0 && (await repoPG.hechosDe(p.uid)).length === 0, 'fechas', 'un Visto fuera de las fechas del viaje no da logros ni se guarda como hecho')
  const antes = await V(p, 'coliseo', '2026-10-09T10:00:00Z')
  debe(antes.cuenta === false, 'fechas', 'ni el día anterior al viaje')
  const sinFechas = await persona('sinfechas@correo.es', { destination: 'Roma', answers: {}, days: [] })
  const r2 = await servicio.visto(sinFechas.uid, { trip_id: sinFechas.trip, sitio: 'coliseo', instante: dia(1) })
  debe(r2.ok === false && r2.motivo === 'viaje_sin_fechas', 'fechas', 'un viaje sin fechas no gana nada')
}

// ── Deshacer ──
{
  const p = await persona('deshacer@correo.es')
  await V(p, 'trastevere', dia(4, '10:00'))
  debe(await tiene(p, 'roma', 'pedazo', 'imprescindibles:trastevere'), 'deshacer', 'antes de deshacer, el pedazo está')
  const d = await servicio.deshacer(p.uid, { trip_id: p.trip, sitio: 'trastevere' })
  debe(d.ok && d.quitados.length > 0 && !(await tiene(p, 'roma', 'pedazo', 'imprescindibles:trastevere')) && !(await tiene(p, 'roma', 'sello', 'roma:bronce')), 'deshacer', 'deshacer antes de la foto quita lo ganado solo con el Visto (pedazo, sello, país…)')
  debe(!(await tiene(p, 'roma', 'pedazo', 'imprescindibles:trastevere')) && !(await tiene(p, '*', 'pais', 'Italia')), 'deshacer', 'y el país que solo dio ese Visto')
  const otra = await V(p, 'trastevere', dia(4, '11:00'))
  debe(otra.nuevos.some((m) => m.tipo === 'suma'), 'deshacer', 'se puede volver a marcar y vuelve a dar')
  await F(p, 'trastevere', dia(4, '11:05'))
  const tarde = await servicio.deshacer(p.uid, { trip_id: p.trip, sitio: 'trastevere' })
  debe(tarde.ok === false && tarde.motivo === 'con_foto' && (await tiene(p, 'roma', 'pedazo', 'imprescindibles:trastevere')), 'deshacer', 'después de la foto ya no se puede deshacer, y lo ganado se queda')
  const nada = await servicio.deshacer(p.uid, { trip_id: p.trip, sitio: 'coliseo' })
  debe(nada.ok && nada.nada === true, 'deshacer', 'deshacer algo que no estaba marcado no hace nada')
}

// ── Madrugador y Nocturno ──
{
  const p = await persona('horas@correo.es')
  const noImp = await F(p, 'galeria_borghese', '2026-10-13T05:30:00Z')
  debe(!noImp.nuevos.some((m) => m.tipo === 'emblema' && m.momento), 'madrugador', 'en un sitio que no es imprescindible, no da Madrugador')
  const mad = await F(p, 'fontana_de_trevi', '2026-10-11T05:30:00Z')
  debe(mad.nuevos.some((m) => m.id === 'madrugador'), 'madrugador', 'foto en un imprescindible antes de las 8:00: Madrugador')
  const tarde = await F(p, 'panteon', '2026-10-11T06:00:00Z')
  debe(!tarde.nuevos.some((m) => m.id === 'madrugador'), 'madrugador', 'a las 8:00 en punto ya no')
  const noche = await F(p, 'plaza_de_espana', '2026-10-11T19:30:00Z')
  debe(!noche.nuevos.some((m) => m.id === 'nocturno'), 'nocturno', 'a las 21:30 en octubre no es Nocturno todavía')
  const noche2 = await F(p, 'piazza_navona', '2026-10-11T20:00:00Z')
  debe(noche2.nuevos.some((m) => m.id === 'nocturno'), 'nocturno', 'desde las 22:00 sí')
  debe(noche2.nuevos.some((m) => m.tipo === 'viajero' && m.logro === 'de_sol_a_sol'), 'viajero', 'Madrugador y Nocturno el mismo día: De sol a sol')
  const otro = await F(p, 'coliseo', '2026-10-12T05:30:00Z')
  debe(!otro.nuevos.some((m) => m.id === 'madrugador'), 'madrugador', 'como emblema, Madrugador se gana una sola vez por ciudad')
  // En invierno, el Nocturno empieza a las 19:00
  const pw = await persona('invierno@correo.es', rutaRoma('2027-01-14', '2027-01-16', [['coliseo', 'panteon'], ['fontana_de_trevi'], ['piazza_navona']]))
  const w1 = await F(pw, 'coliseo', '2027-01-14T17:59:00Z')
  const w2 = await F(pw, 'panteon', '2027-01-14T18:00:00Z')
  debe(!w1.nuevos.some((m) => m.id === 'nocturno') && w2.nuevos.some((m) => m.id === 'nocturno'), 'nocturno', 'en invierno, Nocturno desde las 19:00 (no a las 18:59)')
}

// ── Una foto que suma en tres colecciones ──
{
  const p = await persona('tres@correo.es')
  const r = await F(p, 'basilica_de_san_pedro', dia(3, '10:00'))
  const sumas = r.nuevos.filter((m) => m.tipo === 'suma').map((m) => m.coleccion).sort()
  debe(sumas.join() === 'bernini,miguel_angel,pais_mas_pequeno', 'tres', `una foto de la Basílica de San Pedro suma en tres colecciones: ${sumas.join()}`)
  debe(r.nuevos.some((m) => m.tipo === 'suma_sello' && m.sello === 'vaticano') && r.nuevos.some((m) => m.tipo === 'sello' && m.grado === 'plata'), 'tres', 'y sube el sello del Vaticano a plata')
  debe(r.nuevos.findIndex((m) => m.tipo === 'suma') < r.nuevos.findIndex((m) => m.tipo === 'emblema') && r.nuevos.findIndex((m) => m.tipo === 'emblema') < r.nuevos.findIndex((m) => m.tipo === 'sello') && r.nuevos.findIndex((m) => m.tipo === 'sello') < r.nuevos.findIndex((m) => m.tipo === 'pais'), 'orden', 'el orden: lo que suma, emblema, sello, país (Tanda 8B2)')
  const ficha = await servicio.ficha(p.uid, p.trip, 'basilica_de_san_pedro')
  debe(ficha.colecciones.length === 3 && ficha.colecciones.every((c) => c.sitios.some((s) => s.estado === 'este')) && !JSON.stringify(ficha).includes('Sobre la tumba'), 'ficha', 'la pestaña de la ficha lista sus colecciones, sin emblemas ni logros de viajero')
  debe(ficha.colecciones.find((c) => c.id === 'bernini').linea === 'Con Basílica de San Pedro, 1 de 5', 'ficha', 'con su línea «Con …, 1 de 5»')
  const sinColeccion = await servicio.ficha(p.uid, p.trip, 'boca_de_la_verdad')
  debe(sinColeccion.colecciones.length === 0, 'ficha', 'un sitio que no está en ninguna colección no tiene pestaña')
}

// ── Completar una colección ──
{
  const p = await persona('completa@correo.es')
  await V(p, 'mirador_del_janiculo', dia(5, '09:00'))
  await V(p, 'terraza_del_pincio', dia(5, '10:00'))
  const ultimo = await V(p, 'jardin_de_los_naranjos', dia(5, '11:00'))
  const c = ultimo.nuevos.find((m) => m.tipo === 'coleccion')
  debe(c && c.id === 'miradores' && c.linea === 'Roma a tus pies', 'colecciones', 'completar los miradores: sale su nombre y, debajo, su línea')
  debe(await tiene(p, 'roma', 'coleccion', 'miradores'), 'colecciones', 'queda guardada')
  // El sello sube al completar la principal
  const q2 = await persona('sello@correo.es')
  const orden = ['coliseo', 'foro_romano_y_palatino', 'fontana_de_trevi', 'panteon']
  let ultimaR
  for (let i = 0; i < orden.length; i++) ultimaR = await V(q2, orden[i], dia(1 + (i > 2 ? 1 : 0), `${String(9 + i).padStart(2, '0')}:00`))
  debe(ultimaR.nuevos.some((m) => m.tipo === 'sello' && m.grado === 'plata') && ultimaR.nuevos.some((m) => m.tipo === 'coleccion' && m.id === 'cuatro_joyas') === false, 'sello', 'el sello sube a plata con el 4.º imprescindible')
}

// ── Dos países en un día ──
{
  const p = await persona('dos@correo.es')
  const a = await V(p, 'basilica_de_san_pedro', dia(3, '09:00'))
  debe(!a.nuevos.some((m) => m.logro === 'dos_paises_en_un_dia'), 'viajero', 'un solo país el mismo día: nada')
  const b = await V(p, 'castillo_de_santangelo', dia(3, '12:00'))
  debe(b.nuevos.some((m) => m.tipo === 'viajero' && m.logro === 'dos_paises_en_un_dia' && m.nombre === 'Dos países en un día'), 'viajero', 'Italia y el Vaticano el mismo día: Dos países en un día')
  const c2 = await persona('dos2@correo.es')
  await V(c2, 'basilica_de_san_pedro', dia(2, '09:00'))
  const d2 = await V(c2, 'castillo_de_santangelo', dia(4, '12:00'))
  debe(!d2.nuevos.some((m) => m.logro === 'dos_paises_en_un_dia'), 'viajero', 'en días distintos, no')
}

// ── El plazo de 30 días ──
{
  const p = await persona('plazo@correo.es')
  const g = (recibido, extra = {}) => servicio.foto(p.uid, { trip_id: p.trip, sitio: 'coliseo', origen: 'galeria', tomada_en: '2026-10-11T10:00:00', con_camara: true, ubicacion: null, recibido_en: recibido, ...extra })
  const tarde = await g('2026-11-14T12:00:00Z')
  debe(tarde.valida === false && tarde.motivo === 'fuera_de_plazo', 'plazo', 'el día 31 después del último día, nada')
  const justo = await g('2026-11-13T12:00:00Z')
  debe(justo.valida === true && justo.nuevos.some((m) => m.tipo === 'emblema'), 'plazo', 'el día 30 todavía vale')
  const visto = await servicio.visto(p.uid, { trip_id: p.trip, sitio: 'panteon', instante: dia(2), recibido_en: '2026-11-14T12:00:00Z', ubicacion: coords('panteon') })
  debe(visto.cuenta === false && visto.motivo === 'fuera_de_plazo', 'plazo', 'un Visto que llega pasado el plazo tampoco')
}

// ── El Visto sin cobertura, que llega horas después ──
{
  const p = await persona('offline@correo.es')
  const r = await servicio.visto(p.uid, { trip_id: p.trip, sitio: 'fontana_de_trevi', instante: dia(1, '10:00'), recibido_en: dia(1, '16:30'), ubicacion: coords('fontana_de_trevi') })
  const hecho = (await repoPG.hechosDe(p.uid))[0]
  debe(r.cuenta && hecho.instante === new Date(dia(1, '10:00')).toISOString() && hecho.recibido_en === new Date(dia(1, '16:30')).toISOString(), 'offline', 'la hora que cuenta es la del Visto, no la del envío')
  debe(r.nuevos.some((m) => m.tipo === 'suma'), 'offline', 'y al llegar, salen las sorpresas')
  const dormido = await F(p, 'panteon', dia(1, '23:50'), { recibido_en: dia(2, '08:00') })
  debe(dormido.valida && (await repoPG.hechosDe(p.uid)).find((h) => h.sitio === 'panteon').instante === new Date(dia(1, '23:50')).toISOString(), 'offline', 'una foto hecha de noche y enviada por la mañana cuenta con la hora de la toma')
}

// ── Los países de antes no dan logros ──
{
  const p = await persona('previos@correo.es')
  const total = (await repoPG.logrosDe(p.uid)).length
  await repoPG.guardarPerfil(p.uid, { previos: { paises: ['Francia', 'Alemania', 'Portugal'], dias: 41 } })
  const rec = await servicio.recalcular(p.uid)
  debe((await repoPG.logrosDe(p.uid)).length === total && rec.faltan.length === 0, 'previos', 'los países marcados en «¿Dónde has estado ya?» no dan ningún logro, ni sello, ni colección')
  await V(p, 'coliseo', dia(1))
  const pas = await servicio.pasaporteDe(p.uid)
  debe(pas.numeros.paises === 4 && pas.numeros.dias_viajando === 42, 'previos', `pero sí suman en los números (${pas.numeros.paises} países · ${pas.numeros.dias_viajando} días viajando)`)
  debe(pas.tus_paises.map((x) => x.pais).join() === 'Italia' && pas.por_descubrir.map((x) => x.pais).join() === 'Ciudad del Vaticano', 'pasaporte', 'el pasaporte: «Tus países» (visitados) y «Por descubrir» (con algo que ganar en la app)')
  debe(pas.tus_paises[0].entrada === new Date(dia(1)).toISOString() && pas.por_descubrir[0].destinos[0].sellos.some((s) => s.id === 'vaticano' && s.grado === null), 'pasaporte', 'con la fecha de entrada y los sellos del país sin ganar en gris')
  const paises = (await repoPG.logrosDe(p.uid)).filter((f) => f.logro === 'pais').map((f) => f.escalon)
  debe(paises.join() === 'Italia', 'previos', 'de logros de «país», solo el ganado con la app')
}

// ── Un viaje compartido: cada persona, sus logros ──
{
  const ana = await persona('anaviaje@correo.es')
  const beto = await nuevoUsuario('beto@correo.es')
  await S('insert into public.trip_members (trip_id, user_id) values ($1, $2)', [ana.trip, beto])
  const a = await V(ana, 'coliseo', dia(1, '10:00'))
  const b = await servicio.visto(beto, { trip_id: ana.trip, sitio: 'panteon', instante: dia(1, '12:00'), recibido_en: dia(1, '12:00'), ubicacion: coords('panteon') })
  debe(a.cuenta && b.cuenta, 'compartido', 'los dos pueden marcar su Visto en el mismo viaje')
  const lasDeAna = (await repoPG.logrosDe(ana.uid)).filter((f) => f.logro === 'pedazo').map((f) => f.escalon)
  const lasDeBeto = (await repoPG.logrosDe(beto)).filter((f) => f.logro === 'pedazo').map((f) => f.escalon)
  debe(lasDeAna.every((e) => e.endsWith(':coliseo')) && lasDeBeto.every((e) => e.endsWith(':panteon')) && lasDeAna.length > 0 && lasDeBeto.length > 0, 'compartido', 'cada persona tiene sus Vistos y sus logros aunque la ruta sea la misma')
  const same = await servicio.visto(beto, { trip_id: ana.trip, sitio: 'coliseo', instante: dia(1, '13:00'), recibido_en: dia(1, '13:00'), ubicacion: coords('coliseo') })
  debe(same.cuenta && same.nuevos.length > 0, 'compartido', 'el Coliseo que marcó Ana no se lo da a Beto: él lo gana aparte')
}

// ── Un segundo viaje a Roma ──
{
  const uid = await nuevoUsuario('vuelve@correo.es')
  const t1 = await nuevoViaje(uid, rutaRoma('2026-10-10', '2026-10-12', [['coliseo', 'panteon'], ['fontana_de_trevi'], ['piazza_navona']]))
  const t2 = await nuevoViaje(uid, rutaRoma('2027-03-10', '2027-03-12', [['plaza_de_espana', 'castillo_de_santangelo'], ['trastevere'], ['foro_romano_y_palatino']]))
  const p = { uid, trip: t1 }
  await V(p, 'coliseo', dia(1, '09:00'))
  await V(p, 'panteon', dia(1, '11:00'))
  const primero = await tiene(p, '*', 'viajero:nunca_ultima_vez')
  reloj = new Date('2027-03-10T12:00:00Z')
  const r = await servicio.visto(uid, { trip_id: t2, sitio: 'plaza_de_espana', instante: '2027-03-10T09:00:00Z', recibido_en: '2027-03-10T09:00:00Z', ubicacion: coords('plaza_de_espana') })
  debe(!primero && r.nuevos.some((m) => m.tipo === 'viajero' && m.logro === 'nunca_ultima_vez' && m.nombre === 'Nunca es la última vez'), 'volver', 'un segundo viaje hecho con la app a la misma ciudad: «Nunca es la última vez»')
  const r3 = await servicio.visto(uid, { trip_id: t2, sitio: 'castillo_de_santangelo', instante: '2027-03-10T10:00:00Z', recibido_en: '2027-03-10T10:00:00Z', ubicacion: coords('castillo_de_santangelo') })
  debe(r3.nuevos.some((m) => m.tipo === 'sello' && m.grado === 'plata'), 'volver', 'el avance del sello se suma entre viajes (2 del primer viaje + 2 del segundo = 4 imprescindibles, ya es plata)')
  debe(await tiene({ uid }, 'roma', 'viajero:destino_cuatro_estaciones') === false, 'volver', 'Un destino, cuatro estaciones no sale con dos estaciones')
  debe((await tiene({ uid }, '*', 'viajero:viajes', 1)) && !(await tiene({ uid }, '*', 'viajero:viajes', 5)), 'volver', 'viajes hechos con la app: el primero, no el quinto')
  reloj = new Date('2026-10-12T12:00:00Z')
}

// ── Viajero fundador, con la fecha de salida cambiada ──
{
  const ruta = rutaRoma('2026-11-10', '2026-11-12', [['coliseo'], ['panteon'], ['fontana_de_trevi']])
  const a = await persona('fundador1@correo.es', ruta)
  const r = await V(a, 'coliseo', '2026-11-10T09:00:00Z')
  debe(r.nuevos.some((m) => m.tipo === 'viajero' && m.logro === 'fundador'), 'fundador', 'un viaje con la app después de la salida y dado de alta antes de «salida + 1 año»: Viajero fundador')
  await S("update public.app_config set value = '\"2027-06-01\"' where key = 'salida_app'")
  const b = await persona('fundador2@correo.es', ruta)
  const r2 = await V(b, 'coliseo', '2026-11-10T09:00:00Z')
  debe(!r2.nuevos.some((m) => m.logro === 'fundador'), 'fundador', 'si la salida se mueve (a junio de 2027), el viaje de noviembre de 2026 ya es de antes de la salida: no es fundador')
  await S("update public.app_config set value = '\"2025-01-01\"' where key = 'salida_app'")
  const c = await persona('fundador3@correo.es', ruta)
  await S("update public.travelers set alta_cuenta = '2026-02-01T00:00:00Z' where id = $1", [c.uid])
  const r3 = await V(c, 'coliseo', '2026-11-10T09:00:00Z')
  debe(!r3.nuevos.some((m) => m.logro === 'fundador'), 'fundador', 'con la salida en 2025, «salida + 1 año» (enero de 2026) ya pasó: el alta de febrero de 2026 llega tarde')
  await S("update public.app_config set value = '\"2026-11-04\"' where key = 'salida_app'")
  const ficheros = fs.readFileSync('server/logros/motor.js', 'utf8') + fs.readFileSync('server/logros/servicio.js', 'utf8')
  debe(!/2026-11-04|2027-11-04/.test(ficheros), 'fundador', 'la fecha de salida no está escrita en el código: sale de app_config')
}

// ── Pionero ──
{
  // (Antes de este caso ya hay muchos viajeros de prueba en Roma: se vacían los hechos para que el puesto de estos tres sea el 1, el 2 y el 3.)
  await S('delete from public.logro_hechos')
  const viejo = R.pionero.limite
  R.pionero.limite = 2
  const ruta = rutaRoma('2026-10-10', '2026-10-14', [['coliseo'], ['panteon'], ['fontana_de_trevi']])
  const a = await persona('pio1@correo.es', ruta)
  const b = await persona('pio2@correo.es', ruta)
  const c = await persona('pio3@correo.es', ruta)
  const ra = await V(a, 'coliseo', dia(1, '08:00'))
  const rb = await V(b, 'coliseo', dia(1, '09:00'))
  const rc = await V(c, 'coliseo', dia(1, '10:00'))
  debe(ra.nuevos.some((m) => m.logro === 'pionero') && rb.nuevos.some((m) => m.logro === 'pionero') && !rc.nuevos.some((m) => m.logro === 'pionero'), 'pionero', 'Pionero: los primeros viajeros de cada destino (aquí 2); el tercero no')
  R.pionero.limite = viejo
}

// ── Lo mismo dos veces no se da dos veces; volver a calcular todo da lo mismo ──
{
  const p = await persona('dos-veces@correo.es')
  await V(p, 'coliseo', dia(1, '09:00'))
  await F(p, 'coliseo', dia(1, '09:05'))
  const antes = (await repoPG.logrosDe(p.uid)).length
  const otra = await V(p, 'coliseo', dia(1, '09:30'))
  const igual = await F(p, 'coliseo', dia(1, '09:35'))
  debe(otra.repetido === true && otra.nuevos.length === 0 && igual.nuevos.length === 0 && (await repoPG.logrosDe(p.uid)).length === antes, 'repetido', 'tocar Visto o subir la foto otra vez no da lo mismo dos veces')
  debe((await repoPG.hechosDe(p.uid)).filter((h) => h.tipo === 'visto').length === 1, 'repetido', 'y no se duplica el Visto')
  // Una secuencia larga y luego recalcular
  const q2 = await persona('recalcula@correo.es')
  const pasos = [['coliseo', 1, '09'], ['foro_romano_y_palatino', 1, '11'], ['panteon', 2, '10'], ['basilica_de_san_pedro', 3, '10'], ['plaza_de_san_pedro', 3, '12'], ['castillo_de_santangelo', 4, '09']]
  for (const [s, d, h] of pasos) {
    await V(q2, s, dia(d, `${h}:00`))
    await F(q2, s, dia(d, `${h}:10`))
  }
  const guardado = (await repoPG.logrosDe(q2.uid)).map((f) => `${f.destino}|${f.logro}|${f.escalon}`).sort()
  const rec = await servicio.recalcular(q2.uid)
  const despues = (await repoPG.logrosDe(q2.uid)).map((f) => `${f.destino}|${f.logro}|${f.escalon}`).sort()
  debe(rec.faltan.length === 0 && rec.sobran.length === 0 && guardado.join('#') === despues.join('#'), 'recalculo', `volver a calcular todo desde los hechos da lo mismo (${guardado.length} cosas ganadas)`)
  const c = await servicio.cargar(q2.uid)
  const otraVez = [...servicio.calcularCon(c).keys()].sort()
  debe(otraVez.join('#') === guardado.join('#'), 'recalculo', 'calcular dos veces desde los hechos da lo mismo en el mismo orden')
  // Si se borra un logro de la base, recalcular lo vuelve a poner
  await S("delete from public.achievements where user_id = $1 and logro in ('pedazo', 'sello')", [q2.uid])
  const rec2 = await servicio.recalcular(q2.uid)
  debe(rec2.faltan.length > 0 && rec2.puestos.length === rec2.faltan.length && (await repoPG.logrosDe(q2.uid)).length === guardado.length, 'recalculo', 'si falta algo, recalcular lo pone (y solo eso)')
}

// ── Día perfecto, viaje perfecto, Imparable, El fotógrafo, Escapada ──
{
  const ruta = rutaRoma('2026-10-10', '2026-10-12', [['coliseo', 'foro_romano_y_palatino'], ['panteon', 'piazza_navona'], ['fontana_de_trevi', 'plaza_de_espana']])
  ruta.days[2].spareStops = [{ id: 'extra', name: nombre('trastevere') }]
  ruta.days[1].stops[1].closedThisDay = true
  const p = await persona('perfecto@correo.es', ruta)
  const ctx = contextoDeViaje({ id: p.trip, route: ruta }, datos, catalogos)
  debe(ctx.dias[1].paradas.length === 1 && ctx.dias[2].paradas.length === 2, 'perfecto', 'las paradas «Cerrado este día» no cuentan para el día perfecto y «Si te sobra tiempo» no está en las paradas')
  const stop = (d, j) => `d${d}s${j}`
  await V(p, 'coliseo', dia(1, '09:00'), { stop_id: stop(1, 1) })
  const d1 = await V(p, 'foro_romano_y_palatino', dia(1, '11:00'), { stop_id: stop(1, 2) })
  debe(d1.nuevos.some((m) => m.logro === 'dia_perfecto') && !d1.nuevos.some((m) => m.logro === 'viaje_perfecto'), 'perfecto', 'todas las paradas del día vistas: Día perfecto (el viaje aún no)')
  const d2 = await V(p, 'panteon', dia(2, '09:00'), { stop_id: stop(2, 1) })
  debe(d2.nuevos.some((m) => m.logro === 'dia_perfecto') === false, 'perfecto', 'el segundo Día perfecto no repite el logro')
  await V(p, 'fontana_de_trevi', dia(3, '09:00'), { stop_id: stop(3, 1) })
  const d3 = await V(p, 'plaza_de_espana', dia(3, '11:00'), { stop_id: stop(3, 2) })
  debe(d3.nuevos.some((m) => m.logro === 'viaje_perfecto') && d3.nuevos.some((m) => m.logro === 'imparable'), 'perfecto', 'todos los días perfectos: Viaje perfecto, y 3 días seguidos: Imparable')
  debe(d3.nuevos.some((m) => m.logro === 'escapada') === false, 'perfecto', 'Escapada ya salió con el primer Visto')
  debe(await tiene(p, '*', 'viajero:escapada'), 'perfecto', 'un viaje de 2 noches: Escapada')
  const foto = await F(p, 'plaza_de_espana', dia(3, '11:05'))
  void foto
  reloj = new Date('2026-10-20T12:00:00Z')
  const rec = await servicio.recalcular(p.uid)
  debe(!rec.faltan.some((k) => k.includes('el_fotografo')), 'perfecto', 'El fotógrafo no sale si faltan fotos en paradas vistas')
  for (const [s, d, h] of [['coliseo', 1, '09'], ['foro_romano_y_palatino', 1, '11'], ['panteon', 2, '09'], ['fontana_de_trevi', 3, '09']]) await F(p, s, dia(d, `${h}:05`), { recibido_en: dia(d, `${h}:05`) })
  const rec2 = await servicio.recalcular(p.uid)
  debe(await tiene(p, '*', 'viajero:el_fotografo'), 'perfecto', 'con foto en todas las paradas vistas, y ya acabado el viaje: El fotógrafo')
  reloj = new Date('2026-10-12T12:00:00Z')
}

// ── Lo de ayer también cuenta y el plazo ──
{
  const p = await persona('ayer@correo.es')
  await V(p, 'coliseo', dia(1, '09:00'))
  reloj = new Date('2026-10-12T09:00:00Z')
  const a = await servicio.loDeAyer(p.uid, p.trip)
  debe(a.ok && a.pendientes.some((x) => x.sitio === 'foro_romano_y_palatino') && a.pendientes.some((x) => x.sitio === 'fontana_de_trevi') && !a.pendientes.some((x) => x.sitio === 'coliseo' && x.falta.includes('pedazo')) && !a.pendientes.some((x) => x.sitio === 'basilica_de_san_pedro'), 'ayer', 'las paradas de días anteriores que aún no tienen su pedazo o su emblema (hoy no cuenta)')
  debe(a.pendientes.find((x) => x.sitio === 'coliseo')?.falta.join() === 'emblema', 'ayer', 'el Coliseo ya tiene su pedazo pero le falta el emblema (la foto)')
  debe(a.dias_para_reclamar === null && /sorpresa/.test(a.texto ?? ''), 'ayer', 'durante el viaje no hay cuenta atrás: solo «Te espera una sorpresa: sube tu foto»')
  reloj = new Date('2026-10-26T09:00:00Z')
  const b = await servicio.loDeAyer(p.uid, p.trip)
  debe(b.dias_para_reclamar === 18 && /Te quedan 18 días para reclamar tus \d+ sorpresas de Roma/.test(b.texto), 'ayer', 'después del último día sí: «Te quedan 18 días para reclamar tus … sorpresas de Roma»')
  reloj = new Date('2026-11-14T09:00:00Z')
  const c = await servicio.loDeAyer(p.uid, p.trip)
  debe(c.pendientes.length === 0 && c.plazo_pasado === true && c.dias_para_reclamar === null, 'ayer', 'pasados los 30 días, lo pendiente se pierde')
  reloj = new Date('2026-10-12T12:00:00Z')
  // Con las fotos de la galería de esos días se gana lo que toque.
  const g = await servicio.foto(p.uid, { trip_id: p.trip, sitio: 'fontana_de_trevi', origen: 'galeria', tomada_en: '2026-10-10T15:00:00', con_camara: true, ubicacion: null, recibido_en: '2026-10-12T09:00:00Z' })
  debe(g.valida && g.nuevos.some((m) => m.tipo === 'emblema'), 'ayer', 'con una foto de la galería de ese día se gana lo que toque')
}

// ── Los avisos (la lógica) ──
{
  const p = await persona('avisos@correo.es')
  await V(p, 'coliseo', dia(1, '09:00'))
  const puestos = await servicio.prepararAvisos(p.uid)
  const tipos2 = puestos.map((a) => a.tipo).sort()
  debe(tipos2.join() === 'quedan_dias,resumen_viaje', 'avisos', 'se preparan el resumen del viaje y «te quedan 3 días»')
  const resumen = puestos.find((a) => a.tipo === 'resumen_viaje')
  debe(new Date(resumen.enviar_en).toISOString().slice(0, 10) === '2026-10-15', 'avisos', 'el resumen del viaje, al día siguiente del último día')
  const quedan = puestos.find((a) => a.tipo === 'quedan_dias')
  debe(new Date(quedan.enviar_en).toISOString().slice(0, 10) === '2026-11-10' && /Te quedan 3 días para reclamar tus \d+ sorpresas de Roma/.test(quedan.payload.texto), 'avisos', '«Te quedan 3 días para reclamar tus … sorpresas de Roma», 3 días antes de que acabe el plazo')
  debe((await servicio.prepararAvisos(p.uid)).length === 0, 'avisos', 'preparar dos veces no duplica')
  const sinPush = await enviarAvisosPendientes({ repo: repoPG, ahora: new Date('2026-12-01T00:00:00Z'), env: {} })
  debe(sinPush.enviados === 0 && sinPush.motivo === 'apagado' && pushActivo({}) === false, 'avisos', 'el envío está apagado salvo PUSH_ACTIVO=true')
  const sinClaves = await enviarAvisosPendientes({ repo: repoPG, ahora: new Date('2026-12-01T00:00:00Z'), env: { PUSH_ACTIVO: 'true' } })
  debe(sinClaves.motivo === 'faltan_claves_vapid', 'avisos', 'encendido pero sin claves VAPID, dice qué falta')
  const sinPaquete = await enviarAvisosPendientes({ repo: repoPG, ahora: new Date('2026-12-01T00:00:00Z'), env: { PUSH_ACTIVO: 'true', VAPID_PUBLIC_KEY: 'a', VAPID_PRIVATE_KEY: 'b', VAPID_CONTACTO: 'mailto:x@y.es' }, cargarWebPush: async () => { throw new Error('no') } })
  debe(sinPaquete.motivo === 'falta_el_paquete_web_push', 'avisos', 'y sin el paquete web-push, también')
  await repoPG.guardarSuscripcion(p.uid, 'https://push.ejemplo/abc', { p256dh: 'x', auth: 'y' })
  const mandados = []
  const falso = { setVapidDetails() {}, async sendNotification(sub, texto) { mandados.push([sub.endpoint, JSON.parse(texto)]) } }
  const conPush = await enviarAvisosPendientes({ repo: repoPG, ahora: new Date('2026-12-01T00:00:00Z'), env: { PUSH_ACTIVO: 'true', VAPID_PUBLIC_KEY: 'a', VAPID_PRIVATE_KEY: 'b', VAPID_CONTACTO: 'mailto:x@y.es' }, cargarWebPush: async () => ({ default: falso }) })
  debe(conPush.enviados === 2 && mandados.length === 2 && mandados.some(([, t]) => /sorpresas|resumen/i.test(`${t.titulo} ${t.cuerpo}`)) && (await repoPG.avisosPendientes('2027-01-01T00:00:00Z')).length === 0, 'avisos', 'con todo listo (simulado), se mandan y se marcan como enviados')
  debe(textoDeAviso({ tipo: 'resumen_viaje', payload: {} }).titulo.length > 0, 'avisos', 'el texto de cada aviso')
}

// ── La vitrina ──
{
  const p = await persona('vitrina@correo.es')
  for (const [s, d] of [['coliseo', 1], ['foro_romano_y_palatino', 1], ['fontana_de_trevi', 1], ['panteon', 2], ['piazza_navona', 2], ['plaza_de_espana', 2]]) {
    await V(p, s, dia(d, '10:00'))
    await F(p, s, dia(d, '10:10'))
  }
  const v1 = await servicio.vitrinaDe(p.uid)
  debe(v1.baldas.emblemas.huecos.length === 4 && v1.baldas.emblemas.elegida === false, 'vitrina', 'los huecos de 4 se llenan solos con lo último ganado')
  debe(v1.pedestal.length === 1 && v1.pedestal[0] === '*|maravilla|coliseo', 'vitrina', 'el pedestal de las maravillas (solo si tiene alguna)')
  const claveEm = v1.baldas.emblemas.huecos[0]
  const r = llevarAVitrina({ baldas: { emblemas: ['a', 'b', 'c', 'd'] } }, 'emblemas', 'e')
  debe(r.ok === false && r.motivo === 'balda_llena' && r.elegir_entre.length === 4, 'vitrina', 'si la balda está llena, hay que elegir cuál quitar')
  debe(llevarAVitrina({ baldas: { emblemas: ['a', 'b', 'c', 'd'] } }, 'emblemas', 'e', 'b').guardada.baldas.emblemas.join() === 'a,c,d,e', 'vitrina', 'quitando una, entra la nueva')
  await repoPG.guardarPerfil(p.uid, { vitrina: { baldas: { emblemas: [claveEm] }, titulo: '*|maravilla|coliseo' } })
  const v2 = await servicio.vitrinaDe(p.uid)
  debe(v2.baldas.emblemas.huecos.length === 1 && v2.baldas.emblemas.elegida === true && v2.titulo === '*|maravilla|coliseo', 'vitrina', '[Llevar a mi vitrina] y [Usar como mi título] se guardan en la cuenta')
}

// ── La prueba de HOY con el cobro encendido (una por cuenta, para siempre) ──
{
  const conCobro = crearServicioLogros({ repo: repoPG, datos, catalogos, ahora: () => reloj, cobro: true, azar: () => 0 })
  const rutaVuelo = (llegada, vuelta = null) => ({ ...RUTA_BASE, answers: { ...RUTA_BASE.answers, arrivalFlightTime: llegada, departureFlightTime: vuelta } })
  const VV = (svc, p, sitio, instante, extra = {}) => svc.visto(p.uid, { trip_id: p.trip, sitio, instante, recibido_en: instante, ubicacion: coords(sitio), ...extra })
  const filaDe = async (p) => (await S('select * from public.hoy_prueba where user_id = $1', [p.uid]))[0] ?? null

  // Sin vuelo: la prueba es el día 1. Abrir HOY y cerrarlo no la gasta; el [Visto] sí.
  {
    const p = await persona('prueba1@correo.es')
    reloj = new Date('2026-10-10T08:00:00Z')
    const est = await conCobro.estadoDelPase(p.uid, p.trip)
    debe(est.cobro === true && est.prueba.estado === 'pendiente' && est.prueba.fecha === '2026-10-10' && est.hoy.puede === true && est.hoy.tarjeta === null, 'prueba_servicio', 'sin vuelo, la prueba es el día 1 y HOY se puede usar')
    debe((await filaDe(p)) === null, 'prueba_servicio', 'abrir HOY y cerrarlo no gasta la prueba (no se guarda nada)')
    const v1 = await VV(conCobro, p, 'coliseo', '2026-10-10T08:00:00Z')
    debe(v1.cuenta === true && v1.nuevos.length > 0 && (await filaDe(p))?.gastada_en != null, 'prueba_servicio', 'tocar [Visto] gasta la prueba y da los logros')
    const v2 = await VV(conCobro, p, 'panteon', '2026-10-11T08:00:00Z')
    debe(v2.cuenta === false && v2.motivo === 'prueba_ya_usada', 'prueba_servicio', 'otro día, sin pase y con la prueba ya usada: no da logros')
    reloj = new Date('2026-10-11T08:00:00Z')
    const est2 = await conCobro.estadoDelPase(p.uid, p.trip)
    debe(est2.hoy.puede === false && est2.hoy.tarjeta === 'pase' && est2.prueba.ya_usada === true, 'prueba_servicio', 'abre HOY sin pase y ya usó la prueba: ninguna alerta, la tarjeta del pase (pantalla 12)')
  }

  // Llegada a las 7:00 → día 1; llegada a las 14:00 → día 2; el vuelo se pone después → se recalcula
  {
    const a = await persona('prueba2@correo.es', rutaVuelo('07:00'))
    const b = await persona('prueba3@correo.es', rutaVuelo('14:00'))
    reloj = new Date('2026-10-01T08:00:00Z')
    debe((await conCobro.estadoDelPase(a.uid, a.trip)).prueba.fecha === '2026-10-10', 'prueba_servicio', 'llegada a las 7:00: la prueba es el día de llegada')
    debe((await conCobro.estadoDelPase(b.uid, b.trip)).prueba.fecha === '2026-10-11', 'prueba_servicio', 'llegada a las 14:00: la prueba es el día siguiente')
    await S("update public.trips set route = $2::jsonb where id = $1", [b.trip, JSON.stringify(rutaVuelo('06:30'))])
    debe((await conCobro.estadoDelPase(b.uid, b.trip)).prueba.fecha === '2026-10-10', 'prueba_servicio', 'cambia el vuelo antes de gastarla: el día de prueba se vuelve a calcular')
    const dentro = await VV(conCobro, b, 'coliseo', '2026-10-11T08:00:00Z')
    debe(dentro.cuenta === false && dentro.motivo === 'sin_pase', 'prueba_servicio', 'un Visto en un día que no es el de prueba (y sin pase) no da logros')
  }

  // Viaje de 2 días con llegada tarde
  {
    const ruta2 = { ...rutaRoma('2026-10-10', '2026-10-11', [['coliseo'], ['panteon']]), answers: { dateRange: { start: '2026-10-10', end: '2026-10-11' }, companion: 'couple', arrivalFlightTime: '22:00', departureFlightTime: '07:00' } }
    const p = await persona('prueba4@correo.es', ruta2)
    reloj = new Date('2026-10-01T08:00:00Z')
    debe((await conCobro.estadoDelPase(p.uid, p.trip)).prueba.fecha === '2026-10-10', 'prueba_servicio', '2 días con llegada tarde: el día con más horas libres')
  }

  // La pregunta de las 12:00 con [Hoy] y con [Mañana]
  {
    const p = await persona('prueba5@correo.es')
    reloj = new Date('2026-10-10T10:30:00Z') // 12:30 en Roma
    const q1 = await VV(conCobro, p, 'coliseo', '2026-10-10T10:30:00Z')
    debe(q1.cuenta === false && q1.motivo === 'pregunta_medio_dia' && q1.pregunta.texto.startsWith('Te queda medio día') && q1.pregunta.opciones.length === 2, 'prueba_servicio', 'la primera vez que usa HOY en su día de prueba a partir de las 12:00: se le pregunta, sin gastar')
    debe((await filaDe(p)) === null && (await repoPG.hechosDe(p.uid)).length === 0, 'prueba_servicio', 'mientras no contesta no se gasta nada ni se guarda el Visto')
    const hoy = await conCobro.responderPrueba(p.uid, { trip_id: p.trip, respuesta: 'hoy' })
    debe(hoy.ok === true && (await filaDe(p)).gastada_en != null && (await filaDe(p)).pregunta_hecha === true, 'prueba_servicio', '[Hoy]: se gasta hoy')
    const q2 = await VV(conCobro, p, 'coliseo', '2026-10-10T10:35:00Z')
    debe(q2.cuenta === true && q2.nuevos.length > 0, 'prueba_servicio', 'y su Visto (el móvil lo vuelve a mandar) ya da logros')
    debe((await conCobro.responderPrueba(p.uid, { trip_id: p.trip, respuesta: 'hoy' })).motivo === 'ya_respondida' || (await conCobro.responderPrueba(p.uid, { trip_id: p.trip, respuesta: 'hoy' })).motivo === 'no_hay_pregunta', 'prueba_servicio', 'no se pregunta dos veces')

    const m = await persona('prueba6@correo.es')
    reloj = new Date('2026-10-10T10:30:00Z')
    await VV(conCobro, m, 'coliseo', '2026-10-10T10:30:00Z')
    const man = await conCobro.responderPrueba(m.uid, { trip_id: m.trip, respuesta: 'manana' })
    debe(man.ok === true && man.prueba.fecha === '2026-10-11' && /Lo de ayer también cuenta/.test(man.lo_de_hoy), 'prueba_servicio', '[Mañana]: la prueba pasa al día siguiente y lo de hoy se gana mañana con «Lo de ayer también cuenta»')
    const fm = await filaDe(m)
    debe(fm.gastada_en == null && fm.pospuesta === true && String(fm.fecha.toISOString?.() ?? fm.fecha).slice(0, 10) === '2026-10-11', 'prueba_servicio', 'queda sin gastar y apuntada para mañana')
    const hoy2 = await VV(conCobro, m, 'panteon', '2026-10-10T11:00:00Z')
    debe(hoy2.cuenta === false && hoy2.motivo === 'sin_pase', 'prueba_servicio', 'hoy ya no es su día de prueba: sin logros')
    reloj = new Date('2026-10-11T09:00:00Z')
    const foto = await conCobro.foto(m.uid, { trip_id: m.trip, sitio: 'coliseo', origen: 'galeria', tomada_en: '2026-10-10T11:00:00', con_camara: true, ubicacion: null, recibido_en: '2026-10-11T09:00:00Z' })
    debe(foto.valida === true && foto.cuenta === true && foto.nuevos.some((x) => x.tipo === 'emblema'), 'prueba_servicio', 'mañana, con las fotos de la galería de hoy se gana lo de hoy («Lo de ayer también cuenta»)')
    const vm = await VV(conCobro, m, 'fontana_de_trevi', '2026-10-11T09:30:00Z')
    debe(vm.cuenta === true && (await filaDe(m)).gastada_en != null, 'prueba_servicio', 'el Visto de mañana ya usa la prueba (sin volver a preguntar)')
  }

  // [Cómo llegar] también gasta; y a partir de las 12:00 hace la pregunta
  {
    const p = await persona('prueba7@correo.es')
    reloj = new Date('2026-10-10T07:00:00Z')
    const u = await conCobro.usarHoy(p.uid, { trip_id: p.trip, motivo: 'como_llegar' })
    debe(u.ok === true && u.acceso === true && (await filaDe(p))?.gastada_en != null, 'prueba_servicio', '[Cómo llegar] por la mañana gasta la prueba')
    const q = await persona('prueba8@correo.es')
    reloj = new Date('2026-10-10T13:00:00Z')
    const u2 = await conCobro.usarHoy(q.uid, { trip_id: q.trip })
    debe(u2.motivo === 'pregunta_medio_dia' && (await filaDe(q)) === null, 'prueba_servicio', '[Cómo llegar] a partir de las 12:00 hace la pregunta y no gasta')
  }

  // Una segunda prueba en otro destino no se da
  {
    const datos2 = { ...datos, destinos: { ...datos.destinos, florencia: { ...R, clave: 'florencia', destino: 'Florencia', ciudad: 'Florencia' } } }
    Object.defineProperty(datos2.destinos.florencia, 'sitios_catalogo', { value: R.sitios_catalogo ?? Object.keys(R.sitios), enumerable: false })
    const svc2 = crearServicioLogros({ repo: repoPG, datos: datos2, catalogos: { roma: catalogo, florencia: catalogo }, ahora: () => reloj, cobro: true, azar: () => 0 })
    const uid = await nuevoUsuario('prueba9@correo.es')
    const tRoma = await nuevoViaje(uid, rutaRoma('2026-10-10', '2026-10-12', [['coliseo'], ['panteon'], ['fontana_de_trevi']]))
    const rutaFlorencia = { ...rutaRoma('2026-11-10', '2026-11-12', [['coliseo'], ['panteon'], ['fontana_de_trevi']]), destination: 'Florencia' }
    const tFlor = await nuevoViaje(uid, rutaFlorencia)
    reloj = new Date('2026-10-10T08:00:00Z')
    const r1 = await svc2.visto(uid, { trip_id: tRoma, sitio: 'coliseo', instante: '2026-10-10T08:00:00Z', recibido_en: '2026-10-10T08:00:00Z', ubicacion: coords('coliseo') })
    reloj = new Date('2026-11-10T08:00:00Z')
    const r2 = await svc2.visto(uid, { trip_id: tFlor, sitio: 'coliseo', instante: '2026-11-10T08:00:00Z', recibido_en: '2026-11-10T08:00:00Z', ubicacion: coords('coliseo') })
    debe(r1.cuenta === true && r2.cuenta === false && r2.motivo === 'prueba_ya_usada', 'prueba_servicio', 'una segunda prueba en otro destino no se da: la cuenta ya gastó la suya')
  }

  // Con pase, siempre
  {
    const p = await persona('prueba10@correo.es')
    await S("insert into public.passes (destino, comprador_id, tipo, usos_max, codigo) values ('Roma', $1, 'uno', 1, 'PASE-PRUEBA-10')", [p.uid])
    reloj = new Date('2026-10-12T08:00:00Z')
    const r = await VV(conCobro, p, 'coliseo', '2026-10-12T08:00:00Z')
    debe(r.cuenta === true && (await filaDe(p)) === null, 'prueba_servicio', 'con el pase de ese destino se gana en cualquier día, sin gastar la prueba')
    const e = await conCobro.estadoDelPase(p.uid, p.trip)
    debe(e.pases.length === 1 && e.hoy.puede === true, 'prueba_servicio', 'el estado del pase dice que HOY se puede usar')
  }
  debe(conCobro.precioDe('duo').total === 10.99 && conCobro.precioDe('grupo', 4).total === 19.96 && conCobro.precioDe('raro').ok === false, 'precios', 'el servicio da el precio de cada plan')
  reloj = new Date('2026-10-12T12:00:00Z')

  // Las reglas de seguridad de la tabla nueva
  const a = await persona('prueba-seg-a@correo.es')
  reloj = new Date('2026-10-10T08:00:00Z')
  await VV(conCobro, a, 'coliseo', '2026-10-10T08:00:00Z')
  debe((await como(a.uid, () => q('select * from public.hoy_prueba'))).length === 1, 'prueba_servicio', 'cada persona ve su prueba')
  debe((await lanza(() => como(a.uid, () => q("update public.hoy_prueba set gastada_en = null where user_id = $1", [a.uid])))) === null && (await filaDe(a)).gastada_en != null, 'prueba_servicio', 'nadie se devuelve la prueba desde el móvil')
  const b = await persona('prueba-seg-b@correo.es')
  debe((await como(b.uid, () => q('select * from public.hoy_prueba'))).length === 0, 'prueba_servicio', 'y nadie ve la de otra persona')
  reloj = new Date('2026-10-12T12:00:00Z')
}

// ── La hora libre del día de llegada, la de la ruta (según el aeropuerto o la estación) ──
{
  const R2 = datos.destinos.roma
  const aj = datos.pase.ajustes
  const dias = (n) => Array.from({ length: n }, (_, i) => ({ numero: i + 1, fecha: `2026-10-${10 + i}` }))
  const plan = (hora, medio, punto) => ({ answers: { planLlegada: { entrada: { hora, medio, punto_id: punto } } } })
  const libre = (hora, medio, punto) => horasDelViaje(plan(hora, medio, punto), R2, catalogo)
  const fco = libre('08:35', 'avion', 'fco')
  const cia = libre('08:35', 'avion', 'cia')
  const tren = libre('08:35', 'tren', 'termini')
  debe(fco.libre_llegada_min === 8 * 60 + 35 + 60 + 30 && cia.libre_llegada_min === 8 * 60 + 35 + 50 + 30 && tren.libre_llegada_min === 8 * 60 + 35 + 15 + 30, 'hora_motor', 'la hora libre es la del motor: llegada + traslado del punto + maleta (Fiumicino 60, Ciampino 50, Termini 15)')
  debe([fco, cia, tren].every((x) => x.libre_origen === 'motor'), 'hora_motor', 'las tres vienen del motor, no del respaldo')
  const diaDe = (viaje) => elegirDiaDePrueba({ dias: dias(5), ...viaje }, aj).numero
  debe(diaDe({ llegada: '08:35', libre_llegada_min: fco.libre_llegada_min }) === 2, 'hora_motor', 'llegada a Fiumicino a las 8:35: queda libre a las 10:05 → la prueba es el día siguiente')
  debe(diaDe({ llegada: '08:35', libre_llegada_min: cia.libre_llegada_min }) === 1, 'hora_motor', 'la misma hora en Ciampino: queda libre a las 9:55 → la prueba es el día de llegada')
  debe(diaDe({ llegada: '08:35', libre_llegada_min: tren.libre_llegada_min }) === 1, 'hora_motor', 'y en tren a Termini (libre a las 9:20): el día de llegada')
  debe(diaDe({ llegada: '08:35' }) === 2, 'hora_motor', 'con los 90 minutos fijos de antes, las tres habrían dado el día siguiente (por eso había que leer la hora de la ruta)')
  // Respaldo: si el motor no da la hora (en coche, sin datos del destino), se usan los 90 minutos
  const coche = horasDelViaje({ answers: { planLlegada: { entrada: { hora: '08:35', medio: 'coche', punto_id: 'ztl' } } } }, R2, catalogo)
  debe(coche.libre_llegada_min === null && coche.libre_origen === 'respaldo', 'hora_motor', 'en coche el motor no da la hora: se marca como respaldo')
  debe(diasLibres({ dias: dias(5), llegada: '08:35', libre_llegada_min: coche.libre_llegada_min }, aj)[0].desde === 8 * 60 + 35 + aj.libre_tras_llegada_min, 'hora_motor', 'y entonces se usan los 90 minutos de antes')
  debe(horasDelViaje({ answers: {} }, R2, catalogo).libre_origen === null, 'hora_motor', 'sin vuelo puesto no hay hora que buscar')
  const sinDatos = horasDelViaje(plan('08:35', 'avion', 'fco'), { ...R2, llegadaInfo: null }, catalogo)
  debe(sinDatos.libre_origen === 'respaldo', 'hora_motor', 'sin los datos de llegada del destino: respaldo')
  // El último día: lo que hay que salir antes cambia con el aeropuerto o la estación
  const vuelta = (hora, medio, punto) => horasDelViaje({ answers: { departureFlightTime: hora, returnTransportOptionId: medio, departurePointId: punto } }, R2, catalogo)
  debe(vuelta('20:00', 'flight', 'fco').salir_min === 20 * 60 - 180 && vuelta('20:00', 'flight', 'cia').salir_min === 20 * 60 - 170 && vuelta('18:00', 'train', 'termini').salir_min === 18 * 60 - 45 && vuelta('20:00', 'flight', 'fco').salir_origen === 'motor', 'hora_motor', 'la hora de salir el último día es la del motor: Fiumicino 3 h, Ciampino 2 h 50, tren 45 min antes')
  const ultimo = diasLibres({ dias: dias(3), llegada: '08:00', libre_llegada_min: 8 * 60 + 90, vuelta: '20:00', salir_min: vuelta('20:00', 'flight', 'cia').salir_min }, aj)[2]
  debe(ultimo.hasta === 20 * 60 - 170, 'hora_motor', 'el último día acaba cuando hay que salir de verdad (Ciampino), no 3 horas antes siempre')
  // De la ruta guardada del viajero al día de prueba, de punta a punta
  const ruta = (hora, medio, punto) => ({ ...rutaRoma('2026-10-10', '2026-10-14', RUTA_BASE.days.map((d) => d.stops.map((st) => catalogo.places.find((x) => x.name === st.name).id))), answers: { dateRange: { start: '2026-10-10', end: '2026-10-14' }, companion: 'couple', planLlegada: { entrada: { hora, medio, punto_id: punto } } } })
  const ctxFco = contextoDeViaje({ id: 'v1', route: ruta('08:35', 'avion', 'fco') }, datos, catalogos)
  const ctxCia = contextoDeViaje({ id: 'v2', route: ruta('08:35', 'avion', 'cia') }, datos, catalogos)
  debe(ctxFco.libre_llegada_min === 605 && ctxCia.libre_llegada_min === 595 && elegirDiaDePrueba(ctxFco, aj).numero === 2 && elegirDiaDePrueba(ctxCia, aj).numero === 1, 'hora_motor', 'el viaje del viajero trae la hora libre del motor y de ella sale el día de prueba (Fiumicino día 2, Ciampino día 1)')
}

// ── La pregunta de las 12:00 también sin cobertura ──
{
  const conCobro = crearServicioLogros({ repo: repoPG, datos, catalogos, ahora: () => reloj, cobro: true, azar: () => 0 })
  const VV = (p, sitio, instante, recibido) => conCobro.visto(p.uid, { trip_id: p.trip, sitio, instante, recibido_en: recibido, ubicacion: coords(sitio) })
  const filaDe = async (p) => (await S('select * from public.hoy_prueba where user_id = $1', [p.uid]))[0] ?? null

  // Un Visto sin señal de las 13:00 (hora de Roma) que llega a las 15:00 del mismo día: se pregunta cuando llega, y cuenta la hora del Visto
  const a = await persona('offline12-a@correo.es')
  reloj = new Date('2026-10-10T13:00:00Z') // 15:00 en Roma
  const r1 = await VV(a, 'coliseo', '2026-10-10T11:00:00Z', '2026-10-10T13:00:00Z') // Visto a las 13:00, llega a las 15:00
  debe(r1.cuenta === false && r1.motivo === 'pregunta_medio_dia' && r1.pregunta.texto.startsWith('Te queda medio día'), 'offline12', 'un Visto de las 13:00 sin señal que llega a las 15:00 el mismo día: no gasta la prueba, hace la pregunta de las 12:00')
  debe((await filaDe(a)) === null && (await repoPG.hechosDe(a.uid)).length === 0, 'offline12', 'y mientras no conteste no se gasta nada ni se guarda el Visto')
  const hoy = await conCobro.responderPrueba(a.uid, { trip_id: a.trip, respuesta: 'hoy' })
  debe(hoy.ok === true && hoy.reenviar_vistos === true && (await filaDe(a)).gastada_en != null, 'offline12', '[Hoy]: se gasta y el móvil vuelve a mandar el Visto')
  const r2 = await VV(a, 'coliseo', '2026-10-10T11:00:00Z', '2026-10-10T13:05:00Z')
  const hecho = (await repoPG.hechosDe(a.uid))[0]
  debe(r2.cuenta === true && hecho.instante === new Date('2026-10-10T11:00:00Z').toISOString(), 'offline12', 'al reenviarlo cuenta con la hora del Visto (las 13:00), no con la de llegada')

  // [Mañana]: la prueba pasa al día siguiente y lo de hoy se gana mañana con las fotos
  const b = await persona('offline12-b@correo.es')
  reloj = new Date('2026-10-10T13:00:00Z')
  await VV(b, 'coliseo', '2026-10-10T11:00:00Z', '2026-10-10T13:00:00Z')
  const man = await conCobro.responderPrueba(b.uid, { trip_id: b.trip, respuesta: 'manana' })
  debe(man.ok === true && man.prueba.fecha === '2026-10-11' && (await filaDe(b)).gastada_en == null, 'offline12', '[Mañana]: la prueba pasa al día siguiente sin gastarse')

  // Un Visto de las 9:00 que llega a las 15:00: su hora es de antes de las 12:00 → se gasta la prueba directamente
  const c = await persona('offline12-c@correo.es')
  reloj = new Date('2026-10-10T13:00:00Z')
  const r3 = await VV(c, 'coliseo', '2026-10-10T07:00:00Z', '2026-10-10T13:00:00Z') // Visto a las 9:00, llega a las 15:00
  debe(r3.cuenta === true && (await filaDe(c))?.gastada_en != null, 'offline12', 'un Visto de las 9:00 que llega a las 15:00: manda la hora del Visto (antes de las 12:00), se gasta la prueba sin preguntar')

  // Ya ha pasado ese día cuando llega: se gasta la prueba como antes, sin preguntar
  const d = await persona('offline12-d@correo.es')
  reloj = new Date('2026-10-11T13:00:00Z')
  const r4 = await VV(d, 'coliseo', '2026-10-10T11:00:00Z', '2026-10-11T13:00:00Z') // Visto del día 10 a las 13:00, llega el 11
  debe(r4.cuenta === true && r4.motivo !== 'pregunta_medio_dia' && (await filaDe(d))?.gastada_en != null, 'offline12', 'si ya ha pasado ese día cuando llega, la prueba se gasta directamente (ya no puede contestar «hoy o mañana»)')
  debe(r4.nuevos.length > 0, 'offline12', 'y el Visto da lo suyo con la hora en que se hizo')

  // En el móvil: el Visto espera la respuesta en la cola y no se pierde ni se manda dos veces
  const logros = fs.readFileSync('src/lib/logros.ts', 'utf8')
  debe(/enEspera/.test(logros) && /pregunta_medio_dia/.test(logros) && /export async function responderPregunta/.test(logros) && /filter\(\(h\) => !h\.enEspera\)/.test(logros), 'offline12', 'el móvil guarda el Visto en espera hasta que conteste: [Hoy] lo manda, [Mañana] lo descarta')
  debe(/pregunta_medio_dia/.test(fs.readFileSync('src/store/useLogrosStore.ts', 'utf8')), 'offline12', 'la pregunta llega al almacén de logros para que la enseñe la pantalla')
  reloj = new Date('2026-10-12T12:00:00Z')
}

// ── Entrar con una cuenta que ya existía: la prueba gastada pasa con ella ──
{
  const real = await nuevoUsuario('real-prueba@correo.es')
  const anonimo = (await q('insert into auth.users (email, is_anonymous) values (null, true) returning id'))[0].id
  await S('insert into public.travelers (id, is_anonymous) values ($1, true)', [anonimo])
  await S("insert into public.hoy_prueba (user_id, fecha, gastada_en) values ($1, '2026-10-10', now())", [anonimo])
  await S('select public.reclamar_anonimo_logros($1, $2)', [anonimo, real])
  const f = (await S('select gastada_en from public.hoy_prueba where user_id = $1', [real]))[0]
  debe(f?.gastada_en != null, 'prueba_servicio', 'si gastó la prueba con la sesión anónima, la cuenta no recupera otra')
}

// ── Los logros de viajero que se ven hoy ──
{
  const vis = logrosVisibles(datos, new Date('2026-11-10T00:00:00Z'))
  const id = (x) => vis.find((l) => l.id === x)
  debe(id('paises').escalones.map((e) => e.n).join() === '1' && id('destinos').escalones.map((e) => e.n).join() === '1' && !id('capitales'), 'visibles', 'con solo Roma: Países y Destinos solo el 1, Capitales no se ve')
  debe(id('patrimonios').escalones.map((e) => e.n).join() === '1' && id('maravillas').escalones.map((e) => e.n).join() === '1', 'visibles', 'Patrimonios y maravillas, solo el 1')
  debe(id('cazador_emblemas').escalones.map((e) => e.n).join() === '5,10' && id('coleccionista').escalones.map((e) => e.n).join() === '5,10', 'visibles', 'Cazador y Coleccionista, hasta 10 (Roma tiene 12 emblemas y 11 colecciones)')
  debe(id('conocedor').escalones.map((e) => e.n).join() === '25,50' && id('viajes').escalones.length === 7, 'visibles', 'Conocedor 25 y 50 (cuentan todos los sitios de la ciudad); los viajes enteros')
  debe(!id('tres_oro') && !id('tres_diamante') && !id('pequenos_gigantes') && !id('otro_lado_ecuador') && !id('viajero_nacional') && !id('probador'), 'visibles', 'lo que pide más ciudades o países no se ve todavía')
  debe(vis.every((l) => !l.nuevo), 'visibles', 'con un solo destino, nada es «Nuevo escalón»')
  // Cuando se añade un destino, sus escalones salen con «Nuevo escalón»
  const extra = { ...datos, destinos: { ...datos.destinos, florencia: { ...R, clave: 'florencia', destino: 'Florencia', ciudad: 'Florencia', anadido: '2027-02-01', sitios: Object.fromEntries(Object.entries(R.sitios).map(([k, v]) => [k, { ...v, pais: 'Italia' }])) } } }
  Object.defineProperty(extra.destinos.florencia, 'sitios_catalogo', { value: R.sitios ? Object.keys(R.sitios) : [], enumerable: false })
  const conDos = logrosVisibles(extra, new Date('2027-02-10T00:00:00Z'))
  const dest = conDos.find((l) => l.id === 'destinos')
  debe(dest.escalones.map((e) => e.n).join() === '1,3' || dest.escalones.map((e) => e.n).join() === '1', 'visibles', 'con dos destinos, lo que ya se puede conseguir aparece')
  const nuevoCap = capacidad(extra, ['roma', 'florencia'])
  debe(nuevoCap.destinos === 2 && nuevoCap.colecciones === 22, 'visibles', 'la capacidad se calcula desde los datos')
  const todos = logrosYVisibilidad(datos, new Date('2026-11-10'))
  debe(todos.length === datos.viajero.logros.length, 'visibles', 'el panel enseña todos con su visibilidad')
}

// ── El simulador del panel de Eric ──
{
  const pasos = simular({
    datos, catalogos, destino: 'roma', inicio: '2026-10-10', fin: '2026-10-14',
    pasos: [
      { tipo: 'visto', sitio: 'coliseo', fecha: '2026-10-10', hora: '09:00' },
      { tipo: 'foto', sitio: 'coliseo', fecha: '2026-10-10', hora: '09:05' },
      { tipo: 'foto', sitio: 'fontana_de_trevi', fecha: '2026-10-11', hora: '06:30' },
    ],
  })
  debe(pasos.length === 3 && pasos[0].nuevos.some((m) => m.tipo === 'sello' && m.grado === 'bronce') && pasos[1].nuevos[0].tipo === 'emblema' && pasos[2].nuevos.some((m) => m.id === 'madrugador'), 'simulador', 'el simulador dice qué se gana y en qué orden, sin tocar la base de datos')
}

// ── Cuentas: borrar una cuenta se lleva lo suyo; pasar lo de una sesión anónima ──
{
  const p = await persona('borra@correo.es')
  await V(p, 'coliseo', dia(1, '09:00'))
  await F(p, 'coliseo', dia(1, '09:05'))
  await repoPG.guardarPerfil(p.uid, { previos: { paises: ['Francia'], dias: 3 } })
  await servicio.prepararAvisos(p.uid)
  await repoPG.guardarSuscripcion(p.uid, 'https://push.ejemplo/borra', { a: 1 })
  const tablas = ['logro_hechos', 'achievements', 'logro_perfil', 'logro_avisos', 'push_suscripciones']
  for (const t of tablas) debe((await S(`select count(*)::int as n from public.${t} where user_id = $1`, [p.uid]))[0].n > 0, 'borrado', `antes de borrar, ${t} tiene filas de esa persona`)
  await S('select public.preparar_borrado($1)', [p.uid])
  await db.exec('reset role')
  await q('delete from auth.users where id = $1', [p.uid])
  for (const t of tablas) debe((await S(`select count(*)::int as n from public.${t} where user_id = $1`, [p.uid]))[0].n === 0, 'borrado', `al borrar la cuenta no queda nada suyo en ${t}`)

  const real = await persona('real@correo.es')
  const anonimo = (await q('insert into auth.users (email, is_anonymous) values (null, true) returning id'))[0].id
  await S('insert into public.travelers (id, is_anonymous) values ($1, true)', [anonimo])
  const tripAnon = await nuevoViaje(anonimo, RUTA_BASE)
  await servicio.visto(anonimo, { trip_id: tripAnon, sitio: 'panteon', instante: dia(2, '10:00'), recibido_en: dia(2, '10:00'), ubicacion: null })
  const antes = (await repoPG.hechosDe(real.uid)).length
  await S('select public.reclamar_anonimo_logros($1, $2)', [anonimo, real.uid])
  debe((await repoPG.hechosDe(real.uid)).length === antes + 1 && (await repoPG.hechosDe(anonimo)).length === 0, 'reclamar', 'al entrar con una cuenta que ya existía, los hechos de la sesión anónima pasan a la cuenta')
  const sinPermiso = await lanza(() => como(real.uid, () => q('select public.reclamar_anonimo_logros($1, $2)', [anonimo, real.uid])))
  debe(sinPermiso !== null, 'reclamar', 'desde el móvil no se puede llamar a esa función')
}

// ── Las reglas de seguridad de las tablas nuevas ──
{
  const a = await persona('seg-a@correo.es')
  const b = await persona('seg-b@correo.es')
  await V(a, 'coliseo', dia(1, '09:00'))
  await F(a, 'coliseo', dia(1, '09:05'))
  debe((await como(a.uid, () => q('select id from public.logro_hechos'))).length === 2, 'seguridad', 'cada persona ve sus hechos')
  debe((await como(b.uid, () => q('select id from public.logro_hechos'))).length === 0 && (await como(b.uid, () => q('select id from public.achievements'))).length === 0, 'seguridad', 'y no ve los de otra persona')
  const escribir = await lanza(() => como(a.uid, () => q("insert into public.logro_hechos (user_id, destino, tipo, instante) values ($1, 'roma', 'visto', now())", [a.uid])))
  debe(escribir !== null, 'seguridad', 'nadie se da un hecho a sí mismo desde el móvil')
  const darse = await lanza(() => como(a.uid, () => q("insert into public.achievements (user_id, logro, destino) values ($1, 'sello', 'roma')", [a.uid])))
  debe(darse !== null, 'seguridad', 'ni se da un logro')
  const animar = await como(a.uid, () => q("update public.achievements set animacion_vista = true where user_id = $1 returning id", [a.uid]))
  debe(animar.length === 0, 'seguridad', 'ni cambia lo ganado (la animación vista la marca el servidor)')
  const vit = await como(a.uid, () => q("insert into public.logro_perfil (user_id, vitrina) values ($1, '{\"baldas\":{},\"titulo\":null}'::jsonb) on conflict (user_id) do update set vitrina = excluded.vitrina returning user_id", [a.uid]))
  debe(vit.length === 1, 'seguridad', 'sí guarda su vitrina en su cuenta')
  const ajeno = await como(b.uid, () => q('select * from public.logro_perfil'))
  debe(ajeno.length === 0, 'seguridad', 'y nadie más la ve')
  const contar = await lanza(() => como(a.uid, () => q('select * from public.logro_contar()')))
  debe(contar !== null, 'seguridad', 'los números por logro del panel solo los ve el servidor')
  const nums = await S('select * from public.logro_contar()')
  debe(nums.length > 0 && Object.keys(nums[0]).sort().join() === 'destino,escalon,logro,personas', 'admin', 'el panel cuenta cuánta gente tiene cada logro (solo números, ningún nombre)')
}

/* ─────────────────────────── 4. Las rutas y el panel ─────────────────────────── */
console.log('4. Las rutas y el panel de Eric')
{
  debe(logrosActivos({}) === false && logrosActivos({ LOGROS_ACTIVOS: 'true' }) === false && logrosActivos({ LOGROS_ACTIVOS: 'true', VITE_CUENTAS_ACTIVAS: 'true' }) === true && logrosActivos({ CUENTAS_ACTIVAS: 'true' }) === false, 'interruptor', 'los logros solo se encienden con su interruptor Y las cuentas encendidas')
  const montadas = []
  const app = { get: (r) => montadas.push(`GET ${r}`), post: (r) => montadas.push(`POST ${r}`), put: (r) => montadas.push(`PUT ${r}`) }
  debe(registrarRutasLogros(app, { admin: {}, servicio, repo: repoPG, env: {} }) === false && montadas.length === 0, 'interruptor', 'apagado, no se monta ninguna ruta (la app es la de hoy)')
  registrarRutasLogros(app, { admin: {}, servicio, repo: repoPG, env: { LOGROS_ACTIVOS: 'true', CUENTAS_ACTIVAS: 'true' } })
  debe(['POST /api/logros/visto', 'POST /api/logros/foto', 'POST /api/logros/deshacer', 'GET /api/logros/estado', 'GET /api/logros/ficha', 'GET /api/logros/lo-de-ayer', 'GET /api/logros/pasaporte', 'GET /api/logros/vitrina', 'PUT /api/logros/vitrina', 'PUT /api/logros/previos', 'POST /api/logros/recalcular', 'GET /api/admin/logros/datos', 'POST /api/admin/logros/simular', 'POST /api/admin/logros/probador', 'GET /api/pase/estado', 'POST /api/pase/prueba/usar', 'POST /api/pase/prueba/responder', 'GET /api/pase/precios', 'POST /api/pase/precio', 'GET /api/logros/push/clave'].every((r) => montadas.includes(r)), 'rutas', 'encendido, están todas las rutas')
  // Las rutas de verdad, con una app y una cuenta de mentira: sin sesión, con sesión anónima, con cuenta y con la cuenta de administrador.
  {
    const manejadores = {}
    const app2 = { get: (r, h) => (manejadores[`GET ${r}`] = h), post: (r, h) => (manejadores[`POST ${r}`] = h), put: (r, h) => (manejadores[`PUT ${r}`] = h) }
    const ana = await persona('rutas-ana@correo.es')
    const usuarios = { ok: { id: ana.uid, email: 'rutas-ana@correo.es', is_anonymous: false }, anonimo: { id: ana.uid, is_anonymous: true }, admin: { id: ana.uid, email: 'eric@ejemplo.es', is_anonymous: false } }
    const adminFalso = { auth: { getUser: async (token) => (usuarios[token] ? { data: { user: usuarios[token] } } : { error: { message: 'no' } }) } }
    const envOn = { LOGROS_ACTIVOS: 'true', CUENTAS_ACTIVAS: 'true', LOGROS_ADMIN_EMAILS: 'eric@ejemplo.es' }
    registrarRutasLogros(app2, { admin: adminFalso, servicio, repo: repoPG, env: envOn, ahora: () => reloj })
    const llamar = async (ruta, { token, body = {}, query = {} } = {}) => {
      let estado = 200
      let cuerpo = null
      const res = { status: (e) => ((estado = e), res), json: (c) => ((cuerpo = c), res) }
      await manejadores[ruta]({ headers: token ? { authorization: `Bearer ${token}` } : {}, get: () => (token ? `Bearer ${token}` : ''), body, query }, res)
      return { estado, cuerpo }
    }
    debe((await llamar('POST /api/logros/visto')).estado === 401, 'rutas', 'sin sesión: 401')
    debe((await llamar('POST /api/logros/visto', { token: 'raro' })).estado === 401, 'rutas', 'con un token que no vale: 401')
    debe((await llamar('POST /api/logros/visto', { token: 'anonimo' })).estado === 403, 'rutas', 'con la sesión anónima: 403 (los logros van en la cuenta)')
    const v = await llamar('POST /api/logros/visto', { token: 'ok', body: { trip_id: ana.trip, sitio: 'coliseo', instante: dia(1, '09:00'), ubicacion: coords('coliseo'), recibido_en: dia(1, '09:00') } })
    debe(v.estado === 200 && v.cuerpo.cuenta === true && v.cuerpo.nuevos.length > 0, 'rutas', 'con cuenta: el Visto da lo suyo')
    const e = await llamar('GET /api/logros/estado', { token: 'ok', query: { trip_id: ana.trip } })
    debe(e.estado === 200 && e.cuerpo.sellos.length === 2 && e.cuerpo.colecciones.length === 11 && e.cuerpo.secretos.total === 14, 'rutas', 'el estado trae los sellos, las 11 colecciones y los secretos contados')
    const pe = await llamar('GET /api/pase/estado', { token: 'ok', query: { trip_id: ana.trip } })
    debe(pe.estado === 200 && pe.cuerpo.cobro === false && pe.cuerpo.hoy.puede === true && pe.cuerpo.precios.planes.length === 3, 'rutas', 'el estado del pase: con el cobro apagado HOY se puede usar y trae los precios')
    const pp = await llamar('POST /api/pase/precio', { body: { plan: 'duo' } })
    debe(pp.cuerpo.total === 10.99 && pp.cuerpo.paga === 'el_que_compra' && (await llamar('GET /api/pase/precios')).cuerpo.moneda === 'EUR', 'rutas', 'los precios por la ruta: paga el que compra')
    const clave = await llamar('GET /api/logros/push/clave')
    debe(clave.cuerpo.ok === false && clave.cuerpo.clave === null, 'rutas', 'con los avisos al móvil apagados no sale ninguna clave')
    debe((await llamar('GET /api/admin/logros/datos', { token: 'ok' })).estado === 403, 'rutas', 'el panel de Eric: una cuenta normal no entra (403)')
    const panel = await llamar('GET /api/admin/logros/datos', { token: 'admin' })
    debe(panel.estado === 200 && panel.cuerpo.destinos.roma && Array.isArray(panel.cuerpo.avisos) && panel.cuerpo.viajero.length === datos.viajero.logros.length && panel.cuerpo.personas.length > 0, 'rutas', 'la cuenta de administrador ve los datos, los avisos, los logros de viajero y los números')
    debe(!JSON.stringify(panel.cuerpo.personas).match(/user|email|uid/i), 'rutas', 'el panel solo enseña números: ninguna persona')
    const sim = await llamar('POST /api/admin/logros/simular', { token: 'admin', body: { destino: 'roma', inicio: '2026-10-10', fin: '2026-10-14', pasos: [{ tipo: 'visto', sitio: 'coliseo', fecha: '2026-10-10', hora: '09:00' }] } })
    debe(sim.estado === 200 && sim.cuerpo.pasos[0].nuevos.length > 0, 'rutas', 'el simulador responde')
    const otra = await persona('rutas-probador@correo.es')
    const pr = await llamar('POST /api/admin/logros/probador', { token: 'admin', body: { email: 'rutas-probador@correo.es' } })
    debe(pr.estado === 200 && (await tiene(otra, '*', 'viajero:probador')), 'rutas', 'dar Probador a mano funciona')
    const rec = await servicio.recalcular(otra.uid)
    debe(rec.sobran.length === 0, 'rutas', 'y recalcular no lo quita (es a mano)')
    const dv = await llamar('PUT /api/logros/previos', { token: 'ok', body: { paises: ['Francia', 'Alemania'], dias: 10 } })
    debe(dv.estado === 200 && (await repoPG.perfilDe(ana.uid)).previos.paises.length === 2, 'rutas', 'los países de antes se guardan aparte')
    const vit = await llamar('PUT /api/logros/vitrina', { token: 'ok', body: { titulo: '*|maravilla|coliseo' } })
    debe(vit.estado === 200 && vit.cuerpo.titulo === '*|maravilla|coliseo', 'rutas', 'el título de la vitrina se guarda en la cuenta')
  }
  // «Verme como viajero sin pase» (Tanda 10B): lo decide el servidor, solo el administrador, solo su cuenta; encendido, lo de pago sale cerrado; apagado, vuelve el pase.
  {
    const mont = {}
    const admin2 = await persona('rutas-admin2@correo.es')
    const otra2 = await persona('rutas-otra2@correo.es')
    const usuarios2 = { admin2: { id: admin2.uid, email: 'eric@ejemplo.es', is_anonymous: false }, otra2: { id: otra2.uid, email: 'otra2@correo.es', is_anonymous: false } }
    registrarRutasLogros({ get: (r, h) => (mont[`GET ${r}`] = h), post: (r, h) => (mont[`POST ${r}`] = h), put: (r, h) => (mont[`PUT ${r}`] = h) }, { admin: { auth: { getUser: async (t) => (usuarios2[t] ? { data: { user: usuarios2[t] } } : { error: { message: 'no' } }) } }, servicio, repo: repoPG, env: { LOGROS_ACTIVOS: 'true', CUENTAS_ACTIVAS: 'true', LOGROS_ADMIN_EMAILS: 'eric@ejemplo.es' }, ahora: () => reloj })
    const llamar2 = async (ruta, token, { body = {}, query = {} } = {}) => {
      let estado = 200
      let cuerpo = null
      const res = { status: (e) => ((estado = e), res), json: (c) => ((cuerpo = c), res) }
      await mont[ruta]({ headers: { authorization: `Bearer ${token}` }, get: () => `Bearer ${token}`, body, query }, res)
      return { estado, cuerpo }
    }
    const pasesAntes = (await S('select count(*)::int as n from public.passes'))[0].n
    debe((await llamar2('GET /api/pase/sin-pase', 'admin2')).cuerpo.activo === false, 'sin_pase', 'apagado por defecto')
    debe((await llamar2('POST /api/admin/logros/sin-pase', 'otra2', { body: { activo: true } })).estado === 403 && (await repoPG.sinPaseDe(otra2.uid)) === false, 'sin_pase', 'otra cuenta no puede encenderlo (403) y no queda nada guardado')
    debe((await llamar2('POST /api/admin/logros/sin-pase', 'admin2', { body: { activo: 'si' } })).estado === 400, 'sin_pase', 'el administrador tiene que decir true o false')
    const encender = await llamar2('POST /api/admin/logros/sin-pase', 'admin2', { body: { activo: true, user_id: otra2.uid } })
    debe(encender.estado === 200 && (await repoPG.sinPaseDe(admin2.uid)) === true && (await repoPG.sinPaseDe(otra2.uid)) === false, 'sin_pase', 'el administrador lo enciende y solo cambia su propia cuenta (un user_id en el cuerpo se ignora)')
    debe((await llamar2('GET /api/pase/sin-pase', 'admin2')).cuerpo.activo === true && (await llamar2('GET /api/pase/sin-pase', 'otra2')).cuerpo.activo === false, 'sin_pase', 'el móvil solo lee: el administrador lo ve encendido y los demás nunca')
    const cerrado = await llamar2('GET /api/pase/estado', 'admin2', { query: { trip_id: admin2.trip } })
    debe(cerrado.cuerpo.sin_pase_prueba === true && cerrado.cuerpo.cobro === true && cerrado.cuerpo.pases.length === 0 && cerrado.cuerpo.hoy.puede === false && cerrado.cuerpo.hoy.tarjeta === 'pase' && cerrado.cuerpo.prueba.ya_usada === true && cerrado.cuerpo.precios.planes.length === 3, 'sin_pase', 'encendido: cobro puesto, sin pase, HOY cerrado con la tarjeta del pase y los precios a la vista')
    const normal = await llamar2('GET /api/pase/estado', 'otra2', { query: { trip_id: otra2.trip } })
    debe(normal.cuerpo.sin_pase_prueba === undefined && normal.cuerpo.hoy.puede === true, 'sin_pase', 'otra cuenta, a lo suyo: no cambia nada')
    const vistoCerrado = await servicio.visto(admin2.uid, { trip_id: admin2.trip, sitio: 'coliseo', instante: dia(1, '09:00'), ubicacion: coords('coliseo'), recibido_en: dia(1, '09:00') })
    debe(vistoCerrado.cuenta === false && vistoCerrado.motivo === 'sin_pase_prueba', 'sin_pase', 'encendido, un [Visto] no cuenta (lo de pago, cerrado)')
    debe((await servicio.usarHoy(admin2.uid, { trip_id: admin2.trip })).acceso === false, 'sin_pase', 'ni usar HOY')
    await llamar2('POST /api/admin/logros/sin-pase', 'admin2', { body: { activo: false } })
    const abierto = await llamar2('GET /api/pase/estado', 'admin2', { query: { trip_id: admin2.trip } })
    debe(abierto.cuerpo.sin_pase_prueba === undefined && abierto.cuerpo.hoy.puede === true, 'sin_pase', 'apagado: vuelve a tener su pase (todo abierto, como antes)')
    const vistoAbierto = await servicio.visto(admin2.uid, { trip_id: admin2.trip, sitio: 'coliseo', instante: dia(1, '09:00'), ubicacion: coords('coliseo'), recibido_en: dia(1, '09:00') })
    debe(vistoAbierto.cuenta === true, 'sin_pase', 'y el [Visto] vuelve a contar')
    debe((await S('select count(*)::int as n from public.passes'))[0].n === pasesAntes, 'sin_pase', 'no toca el pase de verdad ni los cobros (la tabla de pases queda igual)')
    const fuenteRutas = fs.readFileSync('server/logros/rutas.js', 'utf8')
    const rutaSinPase = fuenteRutas.slice(fuenteRutas.indexOf("'/api/admin/logros/sin-pase'"), fuenteRutas.indexOf('// El sorteo del año'))
    debe(rutaSinPase.length > 100 && !/req\.body\??\.(user|uid)/.test(rutaSinPase) && /usuario\.id/.test(rutaSinPase), 'sin_pase', 'la ruta nunca lee el usuario de lo que manda el móvil: usa el de la sesión')
  }
  debe(esAdmin({ id: 'x', email: 'Eric@ejemplo.es' }, { LOGROS_ADMIN_EMAILS: 'eric@ejemplo.es, otra@ejemplo.es' }) === true && esAdmin({ id: 'x', email: 'otro@ejemplo.es' }, { LOGROS_ADMIN_EMAILS: 'eric@ejemplo.es' }) === false && esAdmin({ id: 'x', email: 'eric@ejemplo.es', is_anonymous: true }, { LOGROS_ADMIN_EMAILS: 'eric@ejemplo.es' }) === false && esAdmin({ id: 'x', email: 'eric@ejemplo.es' }, {}) === false, 'admin', 'la cuenta de administrador sale de una variable del servidor; sin variable, nadie')
  const codigo = ['motor', 'servicio', 'rutas', 'datos', 'avisos', 'pase', 'vistas', 'momentos', 'fotos', 'repo', 'exp'].map((f) => fs.readFileSync(`server/logros/${f}.js`, 'utf8')).join('\n')
  debe(!/@[a-z0-9-]+\.(com|es|org)/i.test(codigo.replace(/mailto:/g, '')), 'admin', 'ningún email escrito en el código')
  // El motor solo se LEE: de él salen la hora libre del día de llegada y la de salir el último día (dos funciones suyas); no se escribe ni se importa nada más.
  const sinComentarios = codigo.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
  const importsDelMotor = [...sinComentarios.matchAll(/import[^;\n]*from '([^']*(?:routeEngine|server\/engine)[^']*)'/g)].map((m) => m[1])
  debe(importsDelMotor.sort().join() === '../../shared/routeEngine/llegadaDia1.js,../../shared/routeEngine/vueltaDia.js', 'motor', `los logros solo leen dos funciones del motor (libreDeLlegada y datosDeVuelta): ${importsDelMotor.join()}`)
  debe(!/routeEngine[^\n]*\b(writeFile|appendFile)\b/.test(sinComentarios) && !/fs\.write[^\n]*(routeEngine|server\/engine)/.test(sinComentarios), 'motor', 'y no escriben nada en el motor')
  // Nunca enseña las fotos de nadie
  const rutasCodigo = fs.readFileSync('server/logros/rutas.js', 'utf8')
  debe(!/storage|trip_photos|signedUrl|createSignedUrl/i.test(rutasCodigo), 'admin', 'el panel nunca enseña las fotos de nadie')
  // Con el interruptor apagado el servidor no monta nada
  const index = fs.readFileSync('server/index.js', 'utf8')
  debe(/if \(logrosActivos\(\) && salesAdmin\)/.test(index), 'interruptor', 'el servidor solo monta los logros con el interruptor encendido')
}

/* ─────────────────────────── 5. Tanda 8C1: Versión 1, escalones del Dashboard y EXP ─────────────────────────── */
console.log('5. Tanda 8C1: la Versión 1, los escalones del Dashboard, la EXP, los niveles, las invitaciones y el sorteo')
{
  const { soloActivos } = await import('../../server/logros/datos.js')
  const E = await import('../../server/logros/exp.js')
  const crudo = JSON.parse(fs.readFileSync('data/logros/viajero.json', 'utf8'))
  const ids1 = datos.viajero.logros.map((l) => l.id)
  const APAGADOS = ['continentes', 'pequenos_gigantes', 'otro_lado_ecuador', 'todos_secretos']
  const V1 = ['paises', 'destinos', 'capitales', 'patrimonios', 'dos_paises_en_un_dia', 'viajero_nacional', 'maravillas', 'viajes', 'cuatro_estaciones', 'doce_meses', 'nunca_ultima_vez', 'destino_cuatro_estaciones', 'navidad_fuera', 'nochevieja_fuera', 'tres_viajes_ano', 'de_sol_a_sol', 'alondra', 'buho', 'con_quien_solo', 'con_quien_pareja', 'con_quien_amigos', 'con_quien_familia', 'dia_perfecto', 'viaje_perfecto', 'imparable', 'escapada', 'gran_viaje', 'el_fotografo', 'diamante_primera', 'cazador_emblemas', 'coleccionista', 'conocedor', 'ciudad_completa', 'tres_oro', 'tres_diamante', 'fundador', 'pionero', 'edicion_anio', 'probador']
  // La Versión 1
  debe(ids1.length === V1.length && V1.every((id) => ids1.includes(id)), 'version1', `los 39 logros de la Versión 1 están encendidos (y solo ellos): ${ids1.length}`)
  debe(APAGADOS.every((id) => !ids1.includes(id) && crudo.logros.find((l) => l.id === id)?.activo === false), 'version1', 'los 4 de más adelante (Continentes, Pequeños gigantes, Al otro lado del ecuador, Todos los secretos) siguen en los datos, apagados con `activo: false`')
  debe(JSON.stringify(datos.viajero.logros_apagados.slice().sort()) === JSON.stringify(APAGADOS.slice().sort()), 'version1', 'el panel sabe cuáles están apagados')
  debe(!logrosVisibles(datos, new Date('2026-12-01')).some((l) => APAGADOS.includes(l.id)) && !(await servicio.logrosDeViajero((await persona('v1-ver@correo.es')).uid)).logros.some((l) => APAGADOS.includes(l.id)), 'version1', 'los apagados no se ven en ningún sitio (ni en la lista de logros de viajero)')
  // Encender uno es cambiar un dato, sin tocar código: con `activo` quitado ya se gana y da EXP.
  const encendido = { ...datos, viajero: soloActivos({ ...crudo, logros: crudo.logros.map((l) => (l.id === 'continentes' ? { ...l, activo: undefined, version: 1 } : l)) }) }
  debe(encendido.viajero.logros.some((l) => l.id === 'continentes'), 'version1', 'encender un logro es cambiar su dato en viajero.json (sin tocar código)')
  const hechoRoma = { id: 'h1', tipo: 'foto', trip_id: 'v', destino: 'roma', sitio: 'coliseo', stop_id: 's1', instante: '2026-10-10T09:00:00Z', recibido_en: '2026-10-10T09:00:00Z', ubic: 'cerca', valido: true, inicio: '2026-10-10', fin: '2026-10-14' }
  const viajeV = { id: 'v', destino: 'roma', inicio: '2026-10-10', fin: '2026-10-14', con_quien: 'pareja', noches: 4, dias: [] }
  const conLogros = calcular({ datos: encendido, hechos: [hechoRoma], viajes: { v: viajeV }, cuenta: {}, ahora: new Date('2026-11-01') })
  const sinLogros = calcular({ datos, hechos: [hechoRoma], viajes: { v: viajeV }, cuenta: {}, ahora: new Date('2026-11-01') })
  debe([...conLogros.values()].some((i) => i.logro === 'continente') && ![...sinLogros.values()].some((i) => i.logro === 'continente'), 'version1', 'con «Continentes» apagado no se gana el continente; encendido, sí')
  const itemContinente = { logro: 'continente', escalon: 'Europa', destino: '*' }
  debe(E.expDeItem(datos, itemContinente) === 0 && E.expDeItem(encendido, itemContinente) === 150, 'exp', 'lo apagado da 0 EXP; encendido, 150 (continente nuevo)')
  debe(E.expDeItem(datos, { logro: 'viajero:todos_secretos', escalon: '', destino: 'roma' }) === 0 && E.expDeItem(datos, { logro: 'viajero:pequenos_gigantes', escalon: '', destino: '*' }) === 0, 'exp', 'Todos los secretos y Los pequeños gigantes (apagados) no dan EXP, ni aunque estuvieran guardados')
  // Una cuenta con un logro apagado ya guardado de antes: no se ve ni da EXP
  const vieja = await persona('v1-vieja@correo.es')
  await S("insert into public.achievements (user_id, logro, escalon, destino, ganado_en) values ($1, 'viajero:todos_secretos', '', 'roma', now()), ($1, 'continente', 'Europa', '*', now())", [vieja.uid])
  const cv = await servicio.cargar(vieja.uid)
  const resV = await servicio.resumenDe(vieja.uid, vieja.trip)
  debe(!JSON.stringify(resV).includes('todos_secretos') && !JSON.stringify(resV).includes('Europa'), 'version1', 'lo apagado que ya estuviera guardado tampoco sale en el resumen')
  debe((await servicio.expDe(vieja.uid)).exp === 0 && cv.logros.length === 2, 'exp', 'ni da EXP (0)')

  // Escalones y nombres nuevos del Dashboard
  const esc = (id) => datos.viajero.logros.find((l) => l.id === id).escalones
  debe(esc('destinos').slice(-2).map((e) => `${e.n}:${e.nombre}`).join() === '25:Pasión por el mundo,30:Alma de explorador', 'dashboard', 'Destinos: 25 «Pasión por el mundo» y 30 «Alma de explorador»')
  debe(esc('patrimonios').map((e) => `${e.n}:${e.nombre}`).join() === '1:Testigo de la historia,5:Pasos por la historia,10:Guardián del patrimonio,15:Memoria del mundo,25:Heredero del mundo', 'dashboard', 'Patrimonios: 1, 5 «Pasos por la historia», 10, 15 y 25 «Heredero del mundo»')
  debe(esc('viajes').map((e) => `${e.n}:${e.nombre}`).join() === '1:El primer viaje,5:Cinco maletas,10:Maleta siempre lista,15:Viajero de ida y vuelta,20:Veinte maletas,25:Vida de viajero,30:Treinta viajes, treinta recuerdos', 'dashboard', 'Viajes: 1, 5, 10, 15 «Viajero de ida y vuelta», 20, 25 y 30')
  debe(esc('cazador_emblemas').map((e) => e.nombre).join() === 'Cazador de emblemas,Ojo de lince,Nada se te escapa' && esc('coleccionista').map((e) => e.nombre).join() === 'Coleccionista,Álbum lleno,Gran coleccionista' && esc('conocedor').map((e) => e.nombre).join() === 'Conocedor de {ciudad},Como en casa en {ciudad}', 'dashboard', 'Cazador, Coleccionista y Conocedor con los nombres del Dashboard')
  const lg = (id) => datos.viajero.logros.find((l) => l.id === id)
  debe(lg('alondra').linea === 'Empieza tu ruta muy temprano.' && lg('buho').linea === 'Acaba tu ruta muy tarde.' && lg('alondra').n === 10 && lg('buho').n === 10 && lg('alondra').momento === 'madrugador' && lg('buho').momento === 'nocturno', 'dashboard', 'Alondra y Búho: las líneas del Dashboard y la regla de siempre (10 días Madrugador / 10 días Nocturno)')
  debe(!/\d{1,2}:\d{2}/.test(lg('alondra').linea + lg('buho').linea + (lg('alondra').como ?? '') + (lg('buho').como ?? '')), 'dashboard', 'y nunca una hora a la vista')
  debe(datos.viajero.logros.every((l) => typeof l.como === 'string' && l.como.length > 5), 'dashboard', 'cada logro lleva su línea de «cómo se gana» del Dashboard')
  // Cada escalón con EXP en la tabla (ninguno olvidado)
  const sinExp = []
  for (const l of datos.viajero.logros) {
    const t = datos.exp.viajero[l.id]
    if (t == null) sinExp.push(l.id)
    else if (l.escalones) for (const e of l.escalones) if (typeof t !== 'object' || t[String(e.n)] == null) sinExp.push(`${l.id}:${e.n}`)
  }
  debe(sinExp.length === 0, 'exp', `todos los logros y escalones encendidos tienen su EXP en data/logros/exp.json (faltan: ${sinExp.join(', ')})`)

  // La EXP de cada cosa (EXP_Y_NIVELES.md)
  const X = (logro, escalon = '', destino = 'roma') => E.expDeItem(datos, { logro, escalon, destino })
  debe(X('pedazo', 'imprescindibles:coliseo') === 5 && X('emblema', 'coliseo') === 25 && X('maravilla', 'coliseo', '*') === 150 && X('pais', 'Italia', '*') === 50 && X('destino_nuevo', 'roma', '*') === 75 && X('patrimonio', 'centro_historico_de_roma', '*') === 40, 'exp', 'pedazo 5 · emblema 25 · maravilla 150 · país 50 · destino 75 · patrimonio 40')
  debe(X('coleccion', 'imprescindibles') === 80 && X('coleccion', 'cuatro_joyas') === 40, 'exp', 'colección completa: 10 por pedazo (imprescindibles 8 → 80; las 4 joyas → 40)')
  debe(['bronce', 'plata', 'oro', 'diamante'].map((g) => X('sello', `roma:${g}`)).join() === '50,75,125,200' && ['plata', 'oro', 'diamante'].map((g) => X('sello', `vaticano:${g}`)).join() === '50,75,125', 'exp', 'sello de ciudad 50/75/125/200 y del Vaticano 50/75/125')
  const esca = (id, ns) => ns.map((n) => X(`viajero:${id}`, String(n), '*')).join()
  debe(esca('paises', [1, 3, 5, 8, 10, 15, 20, 25, 30]) === '25,50,75,125,175,250,350,450,600', 'exp', 'Países: toda la escalera, de 25 a 600')
  debe(esca('destinos', [1, 3, 5, 10, 15, 20, 25, 30]) === '25,50,75,125,175,250,350,450' && esca('capitales', [5, 10, 15, 25]) === '75,125,175,250', 'exp', 'Destinos (25 y 30: 350 y 450) y Capitales')
  debe(esca('maravillas', [1, 2, 3, 4, 5, 6, 7]) === '25,50,75,125,175,250,1000' && esca('patrimonios', [1, 5, 10, 15, 25]) === '25,75,175,250,350', 'exp', 'Maravillas 1 a 6 y las siete (1.000) · Patrimonios 1, 5, 10, 15, 25')
  debe(esca('viajes', [1, 5, 10, 15, 20, 25, 30]) === '25,125,250,350,450,600,750', 'exp', 'Viajes 1, 5, 10, 15, 20, 25 y 30: 25 a 750')
  debe(esca('con_quien_solo', [1, 3, 5, 10]) === '25,75,125,250' && esca('conocedor', [25, 50]) === '175,350' && esca('cazador_emblemas', [5, 10, 15]) === '75,175,250' && esca('coleccionista', [5, 10, 15]) === '75,175,250', 'exp', 'Con quién viajas, Conocedor, Cazador y Coleccionista')
  const unicos = { escapada: 25, dos_paises_en_un_dia: 50, viajero_nacional: 75, dia_perfecto: 75, el_fotografo: 75, nunca_ultima_vez: 75, gran_viaje: 100, navidad_fuera: 100, nochevieja_fuera: 100, de_sol_a_sol: 100, ciudad_completa: 100, tres_viajes_ano: 150, imparable: 150, diamante_primera: 150, viaje_perfecto: 250, alondra: 250, buho: 250, tres_oro: 250, cuatro_estaciones: 500, tres_diamante: 500, destino_cuatro_estaciones: 750, doce_meses: 1000, fundador: 100, pionero: 100, probador: 100, edicion_anio: 50 }
  debe(Object.entries(unicos).every(([id, n]) => X(`viajero:${id}`, '', '*') === n), 'exp', 'los de un solo paso: 25, 50, 75, 100, 150, 250, 500, 750, 1.000; los exclusivos 100 (Fundador, Pionero, Probador) y 50 ({Ciudad} {año})')

  // Paradas vistas (5, máximo 50 al día), viajes acabados y viajes de antes de la app
  const enUnDia = Array.from({ length: 14 }, (_, i) => ({ ...hechoRoma, id: `d${i}`, sitio: 'coliseo', stop_id: `p${i}`, instante: `2026-10-10T${String(8 + (i % 12)).padStart(2, '0')}:${i < 12 ? '00' : '30'}:00Z`, recibido_en: `2026-10-10T${String(8 + (i % 12)).padStart(2, '0')}:00:00Z` }))
  const rParadas = E.calcularExp({ datos, items: new Map(), hechos: enUnDia, viajes: { v: viajeV }, ahora: new Date('2026-10-12') })
  debe(rParadas.entradas.filter((x) => x.tipo === 'parada').length === 10 && rParadas.total === 50, 'exp', 'parada vista: 5 cada una, como mucho 50 al día (14 paradas el mismo día dan 50)')
  const sinUbic = [{ ...hechoRoma, tipo: 'visto', ubic: 'sin' }]
  debe(E.calcularExp({ datos, items: new Map(), hechos: sinUbic, viajes: { v: viajeV }, ahora: new Date('2026-10-12') }).total === 0, 'exp', 'un Visto sin ubicación ni foto no da EXP de parada (solo cuenta lo comprobado)')
  const cinco = Array.from({ length: 5 }, (_, i) => ({ ...hechoRoma, id: `c${i}`, stop_id: `q${i}`, sitio: 'coliseo', instante: `2026-10-1${i}T09:00:00Z`, recibido_en: `2026-10-1${i}T09:00:00Z` }))
  debe(E.viajesAcabados({ datos, hechos: cinco, viajes: { v: viajeV }, ahora: new Date('2026-10-20') }).length === 1 && E.viajesAcabados({ datos, hechos: cinco, viajes: { v: viajeV }, ahora: new Date('2026-10-12') }).length === 0 && E.viajesAcabados({ datos, hechos: cinco.slice(0, 4), viajes: { v: viajeV }, ahora: new Date('2026-10-20') }).length === 0, 'exp', 'viaje acabado (100): 5 paradas vistas o más y el último día ya pasado; con 4, o sin acabar, no')
  const prev = await persona('exp-previos@correo.es')
  await V(prev, 'coliseo', dia(1))
  const sinPrev = (await servicio.expDe(prev.uid)).exp
  await repoPG.guardarPerfil(prev.uid, { previos: { paises: ['Francia', 'Alemania', 'Portugal', 'España'], dias: 90 } })
  debe((await servicio.expDe(prev.uid)).exp === sinPrev, 'exp', 'los viajes de antes de la app («¿Dónde has estado ya?») dan 0 EXP')

  // Los niveles, en sus límites
  const N = (x) => E.nivelDeExp(x, datos.exp)
  debe(N(499).nivel === 1 && N(500).nivel === 2 && N(1399).nivel === 2 && N(1400).nivel === 3 && N(2699).nivel === 3 && N(2700).nivel === 4 && N(0).nivel === 1, 'niveles', 'límites: 499 es nivel 1, 500 nivel 2, 1.399 nivel 2, 1.400 nivel 3, 2.699 nivel 3, 2.700 nivel 4')
  debe([500, 900, 1300, 1700, 2100].every((c, i) => E.costeDeNivel(i + 1, datos.exp) === c) && E.costeDeNivel(6, datos.exp) === 2500 && E.costeDeNivel(7, datos.exp) === 2500 && E.costeDeNivel(30, datos.exp) === 2500, 'niveles', 'subir cuesta 500, 900, 1.300, 1.700 y 2.100 y, desde el nivel 6, 2.500 cada nivel')
  debe(N(6499).nivel === 5 && N(6500).nivel === 6 && N(8999).nivel === 6 && N(9000).nivel === 7 && E.expDeNivel(6, datos.exp) === 6500 && E.expDeNivel(7, datos.exp) === 9000 && E.expDeNivel(50, datos.exp) === 116500, 'niveles', 'el paso a 2.500: el nivel 6 empieza en 6.500, el 7 en 9.000 y el 50 en 116.500')
  debe(N(116499).nivel === 49 && N(116500).nivel === 50 && N(116500).leyenda_estrellas === 0 && N(119499).leyenda_estrellas === 0 && N(119500).leyenda_estrellas === 1 && N(119500).nivel === 50 && N(122500).leyenda_estrellas === 2 && N(125500).leyenda_estrellas === 3 && N(116500 + 3000 * 40).leyenda_estrellas === 40, 'niveles', 'del 50 a Leyenda ★1: el 50 en 116.500 y Leyenda ★1 en 119.500 (3.000 después), una estrella cada 3.000 EXP sin final')
  debe(datos.exp.niveles.rangos.join() === 'Soñador,Explorador,Viajero,Trotamundos,Aventurero,Nómada,Cartógrafo,Embajador,Navegante,Leyenda' && [1, 5, 6, 10, 11, 15, 16, 20, 21, 26, 31, 36, 41, 46, 50].map((n) => N(E.expDeNivel(n, datos.exp)).rango).join() === 'Soñador,Soñador,Explorador,Explorador,Viajero,Viajero,Trotamundos,Trotamundos,Aventurero,Nómada,Cartógrafo,Embajador,Navegante,Leyenda,Leyenda', 'niveles', '10 rangos de 5 niveles, con sus nombres')
  const m = N(1600)
  debe(m.nivel === 3 && m.exp_en_nivel === 200 && m.coste_nivel === 1300 && m.falta === 1100 && m.estrellas_en_rango === 3, 'niveles', 'lo que se manda al móvil: 1.600 EXP → nivel 3, 200 dentro del nivel, faltan 1.100 para el siguiente')
  const tablaDistinta = { ...datos.exp, niveles: { ...datos.exp.niveles, coste: { ...datos.exp.niveles.coste, primero: 100 } } }
  debe(E.nivelDeExp(499, tablaDistinta).nivel > N(499).nivel, 'niveles', 'los costes salen del archivo de datos (cambiarlo cambia los niveles, sin tocar código)')

  // El avance de «Las cuatro estaciones» y «Los 12 meses»
  const { avanceViajero } = await import('../../server/logros/motor.js')
  const mesesDe = (...ms) => ms.map((mes, i) => ({ ...hechoRoma, id: `mes${i}`, stop_id: `m${i}`, instante: `2026-${String(mes).padStart(2, '0')}-10T09:00:00Z`, recibido_en: `2026-${String(mes).padStart(2, '0')}-10T09:00:00Z`, inicio: `2026-${String(mes).padStart(2, '0')}-09`, fin: `2026-${String(mes).padStart(2, '0')}-12` }))
  const viajesDeMeses = Object.fromEntries([3, 7, 10, 12].map((mes, i) => [`v${i}`, { ...viajeV, id: `v${i}`, inicio: `2026-${String(mes).padStart(2, '0')}-09`, fin: `2026-${String(mes).padStart(2, '0')}-12` }]))
  const hm = [3, 7, 10, 12].map((mes, i) => ({ ...mesesDe(mes)[0], id: `mm${i}`, trip_id: `v${i}`, stop_id: `z${i}` }))
  const av = avanceViajero({ datos, hechos: hm, viajes: viajesDeMeses })
  debe(av.doce_meses.n === 4 && av.doce_meses.total === 12 && av.doce_meses.meses.join() === '3,7,10,12' && av.cuatro_estaciones.n === 4 && av.cuatro_estaciones.total === 4, 'dashboard', 'se ve el avance: Los 12 meses (cada mes, un pedazo) y Las cuatro estaciones (1 de 4… 4 de 4)')
  const avUno = avanceViajero({ datos, hechos: hm.slice(0, 1), viajes: viajesDeMeses })
  debe(avUno.cuatro_estaciones.n === 1 && avUno.doce_meses.n === 1, 'dashboard', 'con un solo viaje: 1 de 4 y 1 de 12')
  const personaAv = await persona('avance-viajero@correo.es')
  await V(personaAv, 'coliseo', dia(1))
  const lv = await servicio.logrosDeViajero(personaAv.uid)
  debe(lv.logros.find((l) => l.id === 'cuatro_estaciones')?.avance?.n === 1 && lv.logros.find((l) => l.id === 'doce_meses')?.avance?.n === 1 && lv.logros.every((l) => typeof l.como === 'string'), 'dashboard', 'la lista de logros de viajero del servidor trae el avance y la línea de «cómo se gana»')
  // Cuentas de Roma (para el informe): un viaje normal de 3 días y Roma al 100 % (server/logros/escenarios.js, el mismo que usa el modo de pruebas del móvil)
  const { escenarioDeRoma } = await import('../../server/logros/escenarios.js')
  const normal = escenarioDeRoma(datos, 'normal')
  const roma100 = escenarioDeRoma(datos, 'roma100')
  const aCategorias = (r) => r.por_categoria
  console.log('   EXP de Roma · viaje normal (9 sitios, 3 días):', normal.total, 'nivel', E.nivelDeExp(normal.total, datos.exp).nivel, JSON.stringify(aCategorias(normal)))
  console.log('   EXP de Roma · al 100 % (todos los sitios de las colecciones y emblemas):', roma100.total, 'nivel', E.nivelDeExp(roma100.total, datos.exp).nivel, JSON.stringify(aCategorias(roma100)))
  debe(E.nivelDeExp(normal.total, datos.exp).nivel === 3 && normal.total >= 1400 && normal.total < 2700, 'roma', `un viaje normal a Roma (9 sitios, 3 días): nivel 3 (${normal.total} EXP)`)
  debe(E.nivelDeExp(roma100.total, datos.exp).nivel === 4, 'roma', `Roma al 100 %: nivel 4 (${roma100.total} EXP, el 4 va de 2.700 a 4.399)`)
  const base100 = ['pedazo', 'coleccion', 'sello', 'emblema', 'pais', 'destino_nuevo', 'maravilla', 'patrimonio'].reduce((s, k) => s + (aCategorias(roma100)[k] ?? 0), 0)
  debe(base100 === 2235 && roma100.total > base100, 'roma', `Roma al 100 %: lo que dan los pedazos, colecciones, sellos, emblemas, países, destino, maravilla y Patrimonios son 2.235 EXP (Tanda 10: 14 emblemas, 50 más); con los logros de viajero, las paradas y el viaje acabado, ${roma100.total}`)

  // Nunca baja: se cambia la tabla y a nadie le sale menos
  const pn = await persona('exp-nunca-baja@correo.es')
  for (const [i, s] of ['coliseo', 'foro_romano_y_palatino', 'fontana_de_trevi', 'panteon'].entries()) await V(pn, s, dia(1, `${String(9 + i).padStart(2, "0")}:00`))
  const e1 = await servicio.expDe(pn.uid)
  debe(e1.exp > 0 && (await repoPG.perfilDe(pn.uid)).exp_max === e1.exp, 'exp', `la EXP se guarda (${e1.exp}) y se puede volver a calcular desde los hechos`)
  const baja = crearServicioLogros({ repo: repoPG, datos: { ...datos, exp: { ...datos.exp, pedazo: 0, emblema: 0, maravilla: 0, pais: 0, destino_nuevo: 0, patrimonio: 0, sello: { por_defecto: { bronce: 0, plata: 0, oro: 0, diamante: 0 } }, paradas: { ...datos.exp.paradas, por_parada: 0 } } }, catalogos, ahora: () => reloj, cobro: false, azar: () => 0 })
  const e2 = await baja.expDe(pn.uid)
  debe(e2.calculada < e1.exp && e2.exp === e1.exp && e2.nivel === e1.nivel, 'exp', `si la tabla baja y le saldría menos (${e2.calculada}), se queda con lo que tenía (${e2.exp})`)
  debe((await servicio.expDe(pn.uid)).exp === e1.exp, 'exp', 'y con la tabla de siempre, igual')
  // Cada momento trae su EXP y si se sube de nivel
  const pm = await persona('exp-momentos@correo.es')
  const r1 = await V(pm, 'coliseo', dia(1, '09:00'))
  const sumaMomentos = r1.nuevos.reduce((s, x) => s + x.exp, 0)
  debe(r1.nuevos.every((x) => Number.isFinite(x.exp) && typeof x.sube_de_nivel === 'boolean') && r1.exp && r1.exp.ganada >= sumaMomentos && r1.exp.despues.exp === r1.exp.antes.exp + r1.exp.ganada, 'exp', 'cada momento trae su EXP y si se sube de nivel, y la respuesta el total ganado')
  debe(r1.nuevos.find((x) => x.tipo === 'maravilla')?.exp === 150 && r1.nuevos.find((x) => x.tipo === 'pais')?.exp === 50 && r1.nuevos.find((x) => x.tipo === 'sello')?.exp === 50 && r1.nuevos.find((x) => x.tipo === 'suma')?.exp === 5 * (r1.nuevos.find((x) => x.tipo === 'suma')?.sitios?.length ?? 1), 'exp', 'la maravilla del Coliseo da 150 (su escalón «Tu primera maravilla» da 25 aparte, como momento de viajero); el país 50; el sello en bronce 50; cada pedazo 5')
  debe(r1.exp.antes.nivel === 1 && r1.exp.despues.nivel >= 2 && r1.exp.sube_de_nivel === true && r1.nuevos.some((x) => x.sube_de_nivel), 'exp', `con el primer Visto en el Coliseo (${r1.exp.ganada} EXP) se sube de nivel (${r1.exp.antes.nivel} → ${r1.exp.despues.nivel}) y un momento lo marca`)
  debe(r1.nuevos.filter((x) => x.sube_de_nivel).length === 1 || r1.nuevos.filter((x) => x.sube_de_nivel).length === 2, 'exp', 'la subida de nivel la marca el momento en que se cruza (y no los siguientes)')
  const rep = await V(pm, 'coliseo', dia(1, '09:00'))
  debe(rep.repetido === true && rep.nuevos.length === 0 && !rep.exp, 'exp', 'repetir un Visto no da EXP otra vez')
  const est = await servicio.estado(pm.uid, pm.trip)
  debe(est.exp && est.exp.exp === r1.exp.despues.exp && ['nivel', 'rango', 'exp_en_nivel', 'falta', 'exp_para_siguiente'].every((k) => k in est.exp), 'exp', 'el estado manda al móvil: EXP total, nivel, rango, EXP dentro del nivel y la que falta')

  // Las invitaciones
  const invitador = await persona('inv-invitador@correo.es')
  const invitado = await persona('inv-invitado@correo.es')
  const expAntes = (await servicio.expDe(invitador.uid)).exp
  debe((await servicio.registrarInvitacion(invitador.uid, invitado.uid)).ok === true && (await servicio.registrarInvitacion(invitador.uid, invitador.uid)).ok === false, 'invitaciones', 'se apunta quién invitó a quién (nadie se invita a sí mismo)')
  debe((await servicio.expDe(invitador.uid)).exp === expAntes, 'invitaciones', 'crear la cuenta no da EXP al que invita')
  for (const [i, s] of ['coliseo', 'foro_romano_y_palatino', 'fontana_de_trevi', 'panteon'].entries()) await V(invitado, s, dia(1 + (i > 1 ? 1 : 0), `${String(9 + i).padStart(2, "0")}:00`))
  await servicio.expDe(invitado.uid)
  debe((await servicio.expDe(invitador.uid)).exp === expAntes, 'invitaciones', 'ni con 4 paradas vistas (el viaje no es de 5)')
  await V(invitado, 'piazza_navona', dia(3, '09:00'))
  reloj = new Date('2026-10-20T12:00:00Z')
  const sinAcabar = await servicio.expDe(invitador.uid)
  await servicio.expDe(invitado.uid)
  const conInv = await servicio.expDe(invitador.uid)
  debe(sinAcabar.exp === expAntes && conInv.exp === expAntes + 100, 'invitaciones', `100 EXP al que invita cuando su amigo acaba su primer viaje con la app (no antes): ${expAntes} → ${conInv.exp}`)
  await servicio.expDe(invitado.uid)
  debe((await servicio.expDe(invitador.uid)).exp === conInv.exp, 'invitaciones', 'y solo una vez')
  const referidos12 = Array.from({ length: 12 }, (_, i) => ({ invitado: `u${i}`, viaje_acabado_en: `2026-0${1 + (i % 9)}-15T10:00:00Z` }))
  const r12 = E.calcularExp({ datos, items: new Map(), hechos: [], viajes: {}, ahora: new Date('2026-12-31'), referidos: referidos12 })
  debe(r12.total === 1000 && E.invitacionesQueCuentan(referidos12, 2026, datos.exp) === 10, 'invitaciones', 'como mucho 10 amigos al año: 12 amigos que acaban su viaje dan 1.000 EXP, no 1.200')
  const dosAnios = [...referidos12.slice(0, 10), { invitado: 'x', viaje_acabado_en: '2027-02-01T10:00:00Z' }]
  debe(E.calcularExp({ datos, items: new Map(), hechos: [], viajes: {}, ahora: new Date('2027-12-31'), referidos: dosAnios }).total === 1100, 'invitaciones', 'el tope es por año: el año siguiente vuelve a contar')
  debe(E.calcularExp({ datos, items: new Map(), hechos: [], viajes: {}, ahora: new Date('2026-12-31'), referidos: [{ invitado: 'z', viaje_acabado_en: null }] }).total === 0, 'invitaciones', 'un amigo que todavía no ha acabado su viaje no da nada')

  // El sorteo
  const S1 = (exp, viajes) => E.entraEnElSorteo({ exp, viajesAcabadosDelAnio: viajes, tabla: datos.exp })
  debe(S1(1400, 1) === true && S1(1500, 2) === true && S1(1400, 0) === false && S1(1399, 1) === false && S1(500, 3) === false, 'sorteo', 'nivel 3 con un viaje acabado este año, sí; nivel 3 sin viaje este año, no; nivel 2, no')
  const nivel3ConViaje = await persona('sor-si@correo.es')
  for (const [i, s] of ['coliseo', 'foro_romano_y_palatino', 'fontana_de_trevi', 'panteon', 'piazza_navona'].entries()) await V(nivel3ConViaje, s, dia(1 + (i > 2 ? 1 : 0), `${String(9 + i).padStart(2, "0")}:00`))
  await repoPG.guardarPerfil(nivel3ConViaje.uid, { exp_max: 1500 })
  const nivel3SinViaje = await persona('sor-sin-viaje@correo.es')
  await repoPG.guardarPerfil(nivel3SinViaje.uid, { exp_max: 1500 })
  const nivel2 = await persona('sor-nivel2@correo.es')
  for (const [i, s] of ['coliseo', 'foro_romano_y_palatino', 'fontana_de_trevi', 'panteon', 'piazza_navona'].entries()) await V(nivel2, s, dia(1 + (i > 2 ? 1 : 0), `${String(9 + i).padStart(2, "0")}:00`))
  const so = await servicio.sorteoDe(2026, [nivel3ConViaje.uid, nivel3SinViaje.uid, nivel2.uid])
  const ids = so.lista.map((x) => x.user_id)
  debe(ids.includes(nivel3ConViaje.uid) && !ids.includes(nivel3SinViaje.uid), 'sorteo', 'nivel 3 con un viaje acabado este año: entra · nivel 3 sin viaje este año: no entra')
  debe(!ids.includes(nivel2.uid) || (await servicio.expDe(nivel2.uid)).nivel >= 3, 'sorteo', 'nivel 2: no entra')
  debe((await servicio.sorteoDe(2027, [nivel3ConViaje.uid])).entran === 0, 'sorteo', 'el año siguiente, sin viaje acabado ese año, ya no entra')
  const mont = {}
  registrarRutasLogros({ get: (r, h) => (mont[`GET ${r}`] = h), post: (r, h) => (mont[`POST ${r}`] = h), put: (r, h) => (mont[`PUT ${r}`] = h) }, { admin: { auth: { getUser: async (t) => (t === 'a' ? { data: { user: { id: nivel3ConViaje.uid, email: 'eric@ejemplo.es', is_anonymous: false } } } : t === 'u' ? { data: { user: { id: nivel3ConViaje.uid, email: 'x@y.z', is_anonymous: false } } } : { error: { message: 'no' } }) } }, servicio, repo: repoPG, env: { LOGROS_ACTIVOS: 'true', CUENTAS_ACTIVAS: 'true', LOGROS_ADMIN_EMAILS: 'eric@ejemplo.es' }, ahora: () => reloj })
  const call = async (ruta, token, query = {}) => {
    let estado = 200
    let cuerpo = null
    const res = { status: (e) => ((estado = e), res), json: (c) => ((cuerpo = c), res) }
    await mont[ruta]({ headers: { authorization: `Bearer ${token}` }, get: () => `Bearer ${token}`, body: {}, query }, res)
    return { estado, cuerpo }
  }
  const adm = await call('GET /api/admin/logros/sorteo', 'a', { anio: '2026' })
  debe(adm.estado === 200 && adm.cuerpo.entran >= 1 && adm.cuerpo.lista.every((x) => !('email' in x) && !('nombre' in x)) && (await call('GET /api/admin/logros/sorteo', 'u')).estado === 403, 'sorteo', 'el panel de Eric cuenta cuántos entran este año y da la lista (solo ids, sin nombres ni correos); una cuenta normal no entra (403)')
  const mi = await call('GET /api/logros/exp', 'u')
  debe(mi.estado === 200 && mi.cuerpo.ok && mi.cuerpo.nivel >= 1 && 'falta' in mi.cuerpo, 'exp', 'GET /api/logros/exp manda la EXP, el nivel, el rango y lo que falta')
  const panel8 = await call('GET /api/admin/logros/datos', 'a')
  debe(panel8.cuerpo.viajero_apagados.length === 4, 'version1', 'el panel de Eric enseña cuáles están apagados')
  const coste = fs.readFileSync('server/logros/exp.js', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
  debe(!/\b(500|700|2500|3000|150)\b/.test(coste), 'exp', 'ninguna cifra de la EXP escrita en el código: todo sale de data/logros/exp.json')
}

console.log(`\nLa prueba de los logros: ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
for (const f of fallos) console.log(`  FALLO [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
