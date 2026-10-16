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
import { cobroActivo, diaDePrueba, puedeGanarLogros } from '../../server/logros/pase.js'
import { crearServicioLogros, simular, contextoDeViaje } from '../../server/logros/servicio.js'
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
  debe(R.emblemas.length === 12 && R.emblemas.filter((e) => e.tipo === 'sitio').length === 10 && R.emblemas.filter((e) => e.tipo === 'momento').length === 2, 'datos', '12 emblemas: 10 de sitio y 2 de momento')
  debe(R.emblemas.find((e) => e.sitio === 'plaza_de_san_pedro').nombre === 'La frontera que no se ve', 'datos', 'el emblema de la Plaza se llama «La frontera que no se ve»')
  debe(R.emblemas.every((e) => e.nombre && e.linea), 'datos', 'todos los emblemas llevan nombre y línea')
  debe(R.colecciones.every((c) => c.al_completar), 'datos', 'todas las colecciones llevan su frase al completarse')
  debe(R.sitios.museos_vaticanos_y_capilla_sixtina.foto_dentro.startsWith('En la Capilla Sixtina no se pueden hacer fotos') && R.sitios.catacumbas_de_san_calixto.foto_dentro.startsWith('Dentro no se pueden hacer fotos') && R.sitios.galeria_borghese.foto_dentro === 'Sin flash.', 'datos', 'los avisos de «foto dentro» son los del encargo')
  debe(R.sitios.trastevere.radio_m >= 800 && R.sitios.museos_vaticanos_y_capilla_sixtina.radio_m > R.sitios.fontana_de_trevi.radio_m && R.sitios.circo_maximo.radio_m > R.sitios.piazza_navona.radio_m, 'datos', 'los radios: Trastevere cubre el barrio y los sitios grandes tienen más radio')
  debe(Object.values(R.sitios).every((s) => s.radio_m > 0 && s.motivo_radio && s.pais), 'datos', 'cada sitio lleva radio, su motivo y su país')
  debe(R.sitios.basilica_de_san_pedro.pais === 'Ciudad del Vaticano' && R.sitios.coliseo.pais === 'Italia' && R.sitios.coliseo.capital === true, 'datos', 'país y capital de los sitios')
  debe(R.sitios.coliseo.patrimonio == null && R.sitios.coliseo.patrimonio_por_comprobar === 'centro_historico_de_roma' && R.sitios.foro_romano_y_palatino.patrimonio === 'centro_historico_de_roma', 'datos', 'el Patrimonio: solo lo comprobado cuenta; el resto queda «por comprobar» sin contar')
  debe(R.pionero.activo === true && R.pionero.limite === 100, 'datos', 'Pionero encendido en Roma, los 100 primeros')
  const V = datos.viajero
  debe(V.logros.find((l) => l.id === 'paises').escalones.map((e) => e.n).join() === '1,3,5,8,10,15,20,25,30', 'datos', 'escalones de Países')
  debe(V.logros.find((l) => l.id === 'destinos').escalones.map((e) => e.n).join() === '1,3,5,10,15,20' && V.logros.find((l) => l.id === 'capitales').escalones.map((e) => e.n).join() === '5,10,15,25', 'datos', 'escalones de Destinos y Capitales')
  debe(V.logros.find((l) => l.id === 'patrimonios').escalones.map((e) => e.n).join() === '1,10,15' && V.logros.find((l) => l.id === 'cazador_emblemas').escalones.map((e) => e.n).join() === '5,10,15' && V.logros.find((l) => l.id === 'coleccionista').escalones.map((e) => e.n).join() === '5,10,15', 'datos', 'escalones de Patrimonios, Cazador y Coleccionista')
  debe(V.logros.find((l) => l.id === 'maravillas').escalones.length === 7 && V.logros.find((l) => l.id === 'viajes').escalones.map((e) => e.n).join() === '1,5,10', 'datos', 'las 7 maravillas y los viajes 1, 5, 10')
  debe(['solo', 'pareja', 'amigos', 'familia'].every((v) => V.logros.find((l) => l.valor === v)?.escalones.map((e) => e.n).join() === '1,3,5,10'), 'datos', 'Con quién viajas: cuatro chapas de 1, 3, 5 y 10')
  debe(V.logros.find((l) => l.id === 'conocedor').escalones.map((e) => e.n).join() === '25,50', 'datos', 'Conocedor: 25 y 50')
  const ids = V.logros.map((l) => l.id)
  debe(new Set(ids).size === ids.length, 'datos', 'ningún logro de viajero repetido')
  for (const id of ['dos_paises_en_un_dia', 'de_sol_a_sol', 'alondra', 'buho', 'escapada', 'gran_viaje', 'imparable', 'el_fotografo', 'nunca_ultima_vez', 'tres_oro', 'tres_diamante', 'fundador', 'pionero', 'edicion_anio', 'probador', 'cuatro_estaciones', 'destino_cuatro_estaciones', 'doce_meses', 'navidad_fuera', 'nochevieja_fuera', 'tres_viajes_ano', 'dia_perfecto', 'viaje_perfecto', 'ciudad_completa', 'todos_secretos', 'diamante_primera']) debe(ids.includes(id), 'datos', `falta el logro ${id}`)
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
  debe(foto({ ubicacion: enMadrid }).mensaje === 'Esta foto no es de Fontana de Trevi.' && foto({ ubicacion: enMadrid }).valida === false, 'foto', 'foto de otro sitio (si trae ubicación)')
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
  debe(!visto({ ubicacion: enMadrid }).cuenta && visto({ ubicacion: enMadrid }).mensaje === 'Parece que no estás en Fontana de Trevi. Tu pedazo te espera allí.', 'visto', 'Visto lejos: el pedazo no, con su mensaje')
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
  const prueba = diaDePrueba([{ id: 'a', destino: 'roma', inicio: '2026-10-10', fin: '2026-10-14', dias: [10, 11, 12, 13, 14].map((d) => ({ fecha: `2026-10-${d}` })) }])
  debe(prueba.trip_id === 'a' && prueba.fecha === '2026-10-11', 'pase', 'el día de prueba es el primer día entero (no el de llegada)')
  debe(puedeGanarLogros({ cobro: true, destino: 'roma', tripId: 'a', fecha: '2026-10-11', pases: [], prueba }).motivo === 'dia_de_prueba', 'pase', 'con el cobro encendido, el día de prueba vale')
  debe(puedeGanarLogros({ cobro: true, destino: 'roma', tripId: 'a', fecha: '2026-10-12', pases: [], prueba }).puede === false, 'pase', 'con el cobro encendido, otro día sin pase no')
  debe(puedeGanarLogros({ cobro: true, destino: 'roma', tripId: 'a', fecha: '2026-10-12', pases: [{ destino: 'Roma' }], prueba }).motivo === 'con_pase', 'pase', 'con el cobro encendido, con el pase de ese destino sí')
  debe(puedeGanarLogros({ cobro: true, destino: 'roma', tripId: 'b', fecha: '2026-10-11', pases: [{ destino: 'florencia' }], prueba }).puede === false, 'pase', 'el pase de otro destino no vale')
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
const migraciones = fs.readdirSync('supabase/migrations').filter((f) => /^(0001|0002|0003|0012|0018|0020|0021|0023)_/.test(f)).sort()
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
  pasesDe: (u) => S('select id, destino, tipo from public.passes where comprador_id = $1 or para_id = $1 or id in (select pass_id from public.pass_members where user_id = $1)', [u]),
  perfilDe: async (u) => {
    const f = (await S('select previos, vitrina from public.logro_perfil where user_id = $1', [u]))[0]
    return { previos: f?.previos ?? { paises: [], dias: 0 }, vitrina: f?.vitrina ?? { baldas: {}, titulo: null } }
  },
  guardarPerfil: async (u, p) => {
    await S('insert into public.logro_perfil (user_id) values ($1) on conflict (user_id) do nothing', [u])
    if (p.previos) await S('update public.logro_perfil set previos = $2::jsonb where user_id = $1', [u, JSON.stringify(p.previos)])
    if (p.vitrina) await S('update public.logro_perfil set vitrina = $2::jsonb where user_id = $1', [u, JSON.stringify(p.vitrina)])
  },
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
  debe(estado.secretos.encontrados === 0 && estado.secretos.texto === 'Roma esconde 12 secretos', 'emblemas', 'sin emblemas: «Roma esconde 12 secretos» (nunca cuáles ni dónde)')
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
  debe(!lejos.cuenta && lejos.mensaje === 'Parece que no estás en Plaza de España. Tu pedazo te espera allí.' && !(await tiene(p, 'roma', 'pedazo', 'imprescindibles:plaza_de_espana')), 'pedazo', 'con la ubicación lejos: el Visto se marca para la ruta pero el pedazo no')
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
  const estado = await servicio.estado(p.uid, p.trip)
  debe(estado.puntito === true && estado.secretos.encontrados === 2 && estado.secretos.texto === '2 de 12 secretos encontrados', 'puntito', 'el botón lleva puntito y dice «2 de 12 secretos encontrados»')
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
  debe(!otroSitio.valida && otroSitio.mensaje === 'Esta foto no es de Panteón.', 'galeria', 'de otro sitio (con ubicación): se rechaza')
  debe((await repoPG.hechosDe(p.uid)).length === 0, 'galeria', 'lo rechazado no se guarda')
  const buena = await g({})
  debe(buena.valida && buena.nuevos.some((m) => m.tipo === 'emblema' && m.id === 'panteon'), 'galeria', 'una buena: vale y da el emblema')
  const amigo = await g({ de_amigo: true, sitio: 'castillo_de_santangelo', tomada_en: '2026-10-12T10:00:00' })
  debe(amigo.valida, 'galeria', 'la foto de un amigo del grupo también vale')
  debe(!(await tiene(p, 'roma', 'emblema', 'castillo_de_santangelo')), 'emblema', 'un sitio sin emblema no da emblema')
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
  debe(r.nuevos.findIndex((m) => m.tipo === 'emblema') < r.nuevos.findIndex((m) => m.tipo === 'suma') && r.nuevos.findIndex((m) => m.tipo === 'suma') < r.nuevos.findIndex((m) => m.tipo === 'sello') && r.nuevos.findIndex((m) => m.tipo === 'sello') < r.nuevos.findIndex((m) => m.tipo === 'pais'), 'orden', 'el orden: emblema, lo que suma, sello, país')
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

// ── Los logros de viajero que se ven hoy ──
{
  const vis = logrosVisibles(datos, new Date('2026-11-10T00:00:00Z'))
  const id = (x) => vis.find((l) => l.id === x)
  debe(id('paises').escalones.map((e) => e.n).join() === '1' && id('destinos').escalones.map((e) => e.n).join() === '1' && !id('capitales'), 'visibles', 'con solo Roma: Países y Destinos solo el 1, Capitales no se ve')
  debe(id('patrimonios').escalones.map((e) => e.n).join() === '1' && id('maravillas').escalones.map((e) => e.n).join() === '1', 'visibles', 'Patrimonios y maravillas, solo el 1')
  debe(id('cazador_emblemas').escalones.map((e) => e.n).join() === '5,10' && id('coleccionista').escalones.map((e) => e.n).join() === '5,10', 'visibles', 'Cazador y Coleccionista, hasta 10 (Roma tiene 12 emblemas y 11 colecciones)')
  debe(id('conocedor').escalones.map((e) => e.n).join() === '25,50' && id('viajes').escalones.length === 3, 'visibles', 'Conocedor 25 y 50 (cuentan todos los sitios de la ciudad); los viajes enteros')
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
  const vit = await como(a.uid, () => q("insert into public.logro_perfil (user_id, vitrina) values ($1, '{\"baldas\":{},\"titulo\":null}'::jsonb) returning user_id", [a.uid]))
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
  debe(['POST /api/logros/visto', 'POST /api/logros/foto', 'POST /api/logros/deshacer', 'GET /api/logros/estado', 'GET /api/logros/ficha', 'GET /api/logros/lo-de-ayer', 'GET /api/logros/pasaporte', 'GET /api/logros/vitrina', 'PUT /api/logros/vitrina', 'PUT /api/logros/previos', 'POST /api/logros/recalcular', 'GET /api/admin/logros/datos', 'POST /api/admin/logros/simular', 'POST /api/admin/logros/probador'].every((r) => montadas.includes(r)), 'rutas', 'encendido, están todas las rutas')
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
    debe(e.estado === 200 && e.cuerpo.sellos.length === 2 && e.cuerpo.colecciones.length === 11 && e.cuerpo.secretos.total === 12, 'rutas', 'el estado trae los sellos, las 11 colecciones y los secretos contados')
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
  debe(esAdmin({ id: 'x', email: 'Eric@ejemplo.es' }, { LOGROS_ADMIN_EMAILS: 'eric@ejemplo.es, otra@ejemplo.es' }) === true && esAdmin({ id: 'x', email: 'otro@ejemplo.es' }, { LOGROS_ADMIN_EMAILS: 'eric@ejemplo.es' }) === false && esAdmin({ id: 'x', email: 'eric@ejemplo.es', is_anonymous: true }, { LOGROS_ADMIN_EMAILS: 'eric@ejemplo.es' }) === false && esAdmin({ id: 'x', email: 'eric@ejemplo.es' }, {}) === false, 'admin', 'la cuenta de administrador sale de una variable del servidor; sin variable, nadie')
  const codigo = ['motor', 'servicio', 'rutas', 'datos', 'avisos', 'pase', 'vistas', 'momentos', 'fotos', 'repo'].map((f) => fs.readFileSync(`server/logros/${f}.js`, 'utf8')).join('\n')
  debe(!/@[a-z0-9-]+\.(com|es|org)/i.test(codigo.replace(/mailto:/g, '')), 'admin', 'ningún email escrito en el código')
  debe(!/shared\/routeEngine|server\/engine/.test(codigo.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')), 'motor', 'los logros no importan el motor de rutas')
  // Nunca enseña las fotos de nadie
  const rutasCodigo = fs.readFileSync('server/logros/rutas.js', 'utf8')
  debe(!/storage|trip_photos|signedUrl|createSignedUrl/i.test(rutasCodigo), 'admin', 'el panel nunca enseña las fotos de nadie')
  // Con el interruptor apagado el servidor no monta nada
  const index = fs.readFileSync('server/index.js', 'utf8')
  debe(/if \(logrosActivos\(\) && salesAdmin\)/.test(index), 'interruptor', 'el servidor solo monta los logros con el interruptor encendido')
}

console.log(`\nLa prueba de los logros: ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
for (const f of fallos) console.log(`  FALLO [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
