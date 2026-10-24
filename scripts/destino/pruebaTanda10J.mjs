// La prueba de la Tanda 10J: [Empezar de cero]. No toca el motor de rutas.
//   node scripts/destino/pruebaTanda10J.mjs
//
// 1. La base de datos de verdad (PGlite con TODAS las migraciones, la 0032 incluida): la función `empezar_de_cero` deja la cuenta de prueba vacía en cada tabla del inventario,
//    deja IDÉNTICA a otra cuenta con datos, es una transacción (si algo falla no se borra nada) y el móvil no puede llamarla.
// 2. Las rutas de verdad (server/logros/rutas.js) con una clave de servicio de mentira: quien no es de LOGROS_ADMIN_EMAILS recibe 403 y no se borra nada; el administrador solo borra su cuenta
//    (un user_id en el cuerpo se ignora); archivos de fotos de Storage y marca de la película; lo compartido pasa a los demás.
// 3. El código: ninguna llamada a Stripe, ninguna cuenta de auth borrada, siempre `= uid`.
// 4. La pantalla (hace falta `npm run dev`; sin él se salta): el botón solo sale si el servidor dice que sí, el diálogo con el texto exacto, [Cancelar], y [Sí, empezar de cero] limpia el móvil
//    (también la marca de la película y IndexedDB) y vuelve a la raíz.
import fs from 'node:fs'
import path from 'node:path'
import { PGlite } from '@electric-sql/pglite'
import { cargarDatos, cargarCatalogo } from '../../server/logros/datos.js'
import { registrarRutasLogros } from '../../server/logros/rutas.js'
import { archivosDe } from '../../server/cuentas.js'
import { empezarDeCero } from '../../server/logros/reiniciar.js'

let comprobaciones = 0
const fallos = []
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) fallos.push({ regla, texto })
}

/* ─────────────────────────── 1. La base de datos ─────────────────────────── */
console.log('1. La base de datos: la función empezar_de_cero (PGlite, migraciones reales)')
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
const todas = fs.readdirSync('supabase/migrations').filter((f) => /^\d{4}_.*\.sql$/.test(f)).sort()
const noAplicadas = []
for (const archivo of todas) {
  try {
    await db.exec(fs.readFileSync(path.join('supabase/migrations', archivo), 'utf8'))
  } catch (error) {
    noAplicadas.push(`${archivo}: ${String(error.message).slice(0, 80)}`)
  }
}
// Las que la función necesita tienen que aplicarse (las demás, de cachés de rutas y similares, no le importan).
const NECESARIAS = ['0001', '0003', '0012', '0018', '0020', '0021', '0023', '0024', '0025', '0026', '0028', '0030', '0031', '0032']
for (const n of NECESARIAS) debe(!noAplicadas.some((x) => x.startsWith(n)), 'migracion', `la migración ${n} se aplica (${noAplicadas.filter((x) => x.startsWith(n)).join(' | ')})`)
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
// Como en Supabase: lo que las migraciones revocan, revocado.
await db.exec('revoke execute on function public.preparar_borrado(uuid) from authenticated')
await db.exec('revoke execute on function public.empezar_de_cero(uuid) from authenticated')

const q = async (sql, params = []) => (await db.query(sql, params)).rows
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

/** El inventario: TODA tabla con datos de una cuenta y la columna que dice de quién es. Lo que se borra. */
const INVENTARIO = [
  ['stop_visits', 'user_id'], ['trip_photo_meta', 'user_id'], ['trip_photos', 'user_id'], ['logro_hechos', 'user_id'], ['achievements', 'user_id'], ['logro_avisos', 'user_id'], ['logro_perfil', 'user_id'],
  ['push_suscripciones', 'user_id'], ['hoy_prueba', 'user_id'], ['logro_referidos', 'invitador_id'], ['avisos', 'user_id'], ['avisos_destino', 'user_id'], ['place_likes', 'user_id'], ['admin_sin_pase', 'user_id'],
  ['trip_recommendations', 'author_id'], ['trip_invitations', 'creada_por'], ['trip_members', 'user_id'], ['pass_members', 'user_id'], ['passes', 'comprador_id'], ['trips', 'traveler_id'], ['fotos_por_borrar', 'user_id'],
]
/** Lo que se queda (de la cuenta). */
const SE_QUEDA = [['travelers', 'id'], ['invitaciones_app', 'user_id'], ['logro_referidos', 'invitado_id']]

const usuario = async (email) => (await q('insert into auth.users (email, is_anonymous) values ($1, false) returning id', [email]))[0].id
let contador = 0
const unico = (p) => `${p}-${++contador}`

/** Siembra una cuenta con algo en CADA tabla del inventario. `con` = otras cuentas que se mezclan (para lo compartido). */
async function sembrar(uid, etiqueta, { invitado = null, amiga = null } = {}) {
  await S('insert into public.travelers (id, is_anonymous, nombre, email) values ($1, false, $2, $3) on conflict (id) do nothing', [uid, `Nombre ${etiqueta}`, `${etiqueta}@x.es`])
  const ruta = unico(`ruta-${etiqueta}`)
  const viaje = (await S('insert into public.trips (traveler_id, route, bookings) values ($1, $2, $3) returning id', [uid, JSON.stringify({ id: ruta, destino: 'roma' }), JSON.stringify({ vuelo: etiqueta })]))[0].id
  await S('insert into public.trips (traveler_id, route) values ($1, $2)', [uid, JSON.stringify({ id: unico(`ruta2-${etiqueta}`), destino: 'roma' })])
  const foto = (await S('insert into public.trip_photos (user_id, trip_id, day_id, day_number, storage_path, width, height, bytes) values ($1,$2,$3,1,$4,10,10,10) returning id', [uid, ruta, 'd1', `${uid}/${etiqueta}.jpg`]))[0].id
  await S('insert into public.trip_photo_meta (photo_id, user_id) values ($1, $2)', [foto, uid])
  await S('insert into public.stop_visits (user_id, trip_id, day_id, stop_id) values ($1,$2,$3,$4)', [uid, viaje, 'd1', 's1'])
  await S("insert into public.logro_hechos (user_id, trip_id, destino, tipo, sitio, instante, foto_id) values ($1,$2,'roma','foto','coliseo', now(), $3)", [uid, viaje, foto])
  await S("insert into public.achievements (user_id, logro, escalon, destino, trip_id) values ($1,'sello','bronce','roma',$2)", [uid, viaje])
  await S("insert into public.logro_avisos (user_id, trip_id, tipo, enviar_en) values ($1,$2,'resumen_viaje', now())", [uid, viaje])
  await S('insert into public.logro_perfil (user_id) values ($1) on conflict (user_id) do nothing', [uid])
  await S("insert into public.push_suscripciones (user_id, endpoint, claves) values ($1,$2,'{}')", [uid, unico('https://push/')])
  await S("insert into public.hoy_prueba (user_id, trip_id, fecha, gastada_en) values ($1,$2,'2026-10-10', now()) on conflict (user_id) do nothing", [uid, viaje])
  await S("insert into public.avisos (user_id, tipo, clave) values ($1,'unido',$2)", [uid, unico('aviso')])
  await S("insert into public.avisos_destino (destino, destino_norm, email, email_norm, user_id) values ('Lisboa','lisboa',$1,$1,$2)", [`${etiqueta}@x.es`, uid])
  await S("insert into public.place_likes (place_name, destination, user_id) values ('Coliseo','roma',$1)", [uid])
  await S('insert into public.admin_sin_pase (user_id, activo) values ($1, true) on conflict (user_id) do nothing', [uid])
  await S("insert into public.fotos_por_borrar (user_id, storage_path) values ($1,$2)", [uid, `${uid}/vieja.jpg`])
  await S('insert into public.invitaciones_app (user_id, codigo) values ($1,$2) on conflict (user_id) do nothing', [uid, unico('COD')])
  const pase = (await S("insert into public.passes (destino, comprador_id, tipo, usos_max, usos_usados, codigo) values ('roma',$1,'uno',1,1,$2) returning id", [uid, unico('PASE')]))[0].id
  await S('insert into public.pass_members (pass_id, user_id) values ($1,$2)', [pase, uid])
  await S('insert into public.trip_invitations (trip_id, creada_por, codigo) values ($1,$2,$3)', [viaje, uid, unico('INV')])
  const amigoQueInvito = await usuario(unico(`invitado-${etiqueta}@x.es`))
  await S('insert into public.logro_referidos (invitador_id, invitado_id) values ($1,$2)', [uid, amigoQueInvito])
  if (invitado) await S('insert into public.logro_referidos (invitador_id, invitado_id) values ($1,$2)', [invitado, uid]) // alguien la invitó a ella
  if (amiga) {
    // Un viaje de la cuenta compartido con `amiga` (con una foto de ella dentro) y un pase de la cuenta con `amiga` dentro; y la cuenta, invitada al viaje de `amiga`.
    await S('insert into public.travelers (id, is_anonymous) values ($1, false) on conflict (id) do nothing', [amiga])
    await S('insert into public.trip_members (trip_id, user_id) values ($1,$2)', [viaje, amiga])
    await S("insert into public.trip_photos (user_id, trip_id, day_id, day_number, storage_path, width, height, bytes) values ($1,$2,'d1',1,$3,10,10,10)", [amiga, ruta, `${amiga}/en-viaje-ajeno.jpg`])
    await S('insert into public.trip_recommendations (trip_id, author_id, tipo, payload) values ($1,$2,$3,$4)', [viaje, amiga, 'dia', '{}'])
    const paseCompartido = (await S("insert into public.passes (destino, comprador_id, tipo, usos_max, usos_usados, codigo) values ('roma',$1,'duo',2,2,$2) returning id", [uid, unico('DUO')]))[0].id
    await S('insert into public.pass_members (pass_id, user_id) values ($1,$2), ($3,$4)', [paseCompartido, uid, paseCompartido, amiga])
    const viajeDeAmiga = (await S('insert into public.trips (traveler_id, route) values ($1,$2) returning id', [amiga, JSON.stringify({ id: unico('ruta-amiga'), destino: 'roma' })]))[0].id
    await S('insert into public.trip_members (trip_id, user_id) values ($1,$2)', [viajeDeAmiga, uid])
    await S("insert into public.trip_recommendations (trip_id, author_id, tipo, payload) values ($1,$2,'dia','{}')", [viajeDeAmiga, uid])
    return { viaje, ruta, viajeDeAmiga, paseCompartido }
  }
  return { viaje, ruta }
}

/** Lo que tiene una cuenta en cada tabla del inventario (cuántas filas). */
async function contar(uid) {
  const r = {}
  for (const [tabla, columna] of [...INVENTARIO, ...SE_QUEDA]) r[`${tabla}.${columna}`] = (await S(`select count(*)::int as n from public.${tabla} where ${columna} = $1`, [uid]))[0].n
  return r
}
/** Todo lo que hay en la base de datos que NO es de la cuenta `uid`: cada tabla, sus filas sin esa cuenta (comparable antes y después). */
async function foto(uidFuera) {
  const r = {}
  const tablas = (await S("select table_name from information_schema.tables where table_schema = 'public' and table_type = 'BASE TABLE' order by 1")).map((t) => t.table_name)
  for (const t of tablas) {
    const cols = (await S("select column_name from information_schema.columns where table_schema = 'public' and table_name = $1", [t])).map((c) => c.column_name)
    const dueno = INVENTARIO.concat(SE_QUEDA).filter(([tabla]) => tabla === t).map(([, c]) => c)
    // Una fila es "de la cuenta" si cualquiera de sus columnas de dueño es ella (trips: traveler_id); lo demás se compara tal cual.
    const filtro = dueno.length ? ` where not (${dueno.map((c) => `coalesce(${c}::text, '') = '${uidFuera}'`).join(' or ')})` : ''
    const orden = cols.includes('id') ? 'id' : cols[0]
    r[t] = JSON.stringify(await S(`select * from public.${t}${filtro} order by ${orden}::text`))
  }
  return r
}

const A = await usuario('eric@ejemplo.es')
const B = await usuario('otra@ejemplo.es')
await sembrar(B, 'B')
await db.query("insert into public.pagos_registro (pago_ref, proveedor, destino, plan, personas, importe_cent) values ('pi_1','stripe','roma','uno',1,599)")
const aSembrada = await sembrar(A, 'A', { invitado: B })
let c = await contar(A)
for (const [tabla, columna] of INVENTARIO.filter(([t]) => !['trip_recommendations', 'trip_members'].includes(t))) debe(c[`${tabla}.${columna}`] > 0, 'siembra', `la cuenta de prueba tiene datos en ${tabla}.${columna}`)
// ¿Se ha olvidado alguna tabla con datos de una cuenta? Cualquier tabla del esquema con una columna que apunta a auth.users tiene que estar en el inventario o en «se queda» o ser global.
const apuntanAUsuarios = await S(`
  select distinct kcu.table_name as tabla, kcu.column_name as columna
  from information_schema.table_constraints tc
  join information_schema.key_column_usage kcu on kcu.constraint_name = tc.constraint_name and kcu.table_schema = tc.table_schema
  join information_schema.constraint_column_usage ccu on ccu.constraint_name = tc.constraint_name and ccu.table_schema = tc.table_schema
  where tc.constraint_type = 'FOREIGN KEY' and tc.table_schema = 'public' and ccu.table_schema = 'auth' and ccu.table_name = 'users'`)
const conocidas = new Set(INVENTARIO.concat(SE_QUEDA).map(([t, col]) => `${t}.${col}`))
// Columnas que apuntan a una cuenta pero son «quién lo hizo» y no de quién es (se dejan: no son de la cuenta, o se limpian solas con `on delete set null`).
const NO_SON_DE_LA_CUENTA = new Set(['trip_members.invited_by', 'trip_recommendations.decidida_por', 'passes.para_id'])
const olvidadas = apuntanAUsuarios.map((x) => `${x.tabla}.${x.columna}`).filter((x) => !conocidas.has(x) && !NO_SON_DE_LA_CUENTA.has(x))
debe(olvidadas.length === 0, 'inventario', `ninguna tabla con datos de una cuenta queda fuera del inventario (olvidadas: ${olvidadas.join(', ') || 'ninguna'})`)
const sinColumnaDeCuenta = (await S("select table_name from information_schema.tables where table_schema = 'public' and table_type = 'BASE TABLE'")).map((t) => t.table_name)
debe(sinColumnaDeCuenta.includes('pagos_registro') && !apuntanAUsuarios.some((x) => x.tabla === 'pagos_registro'), 'stripe', 'el registro de cobros no cuelga de ninguna cuenta (no se puede borrar por cuenta)')

const antesDeLosDemas = await foto(A)
const pagosAntes = (await S('select count(*)::int as n from public.pagos_registro'))[0].n

// El móvil no puede llamarla
{
  await db.exec('reset role')
  await db.query("select set_config('request.jwt.claims', $1, false)", [JSON.stringify({ sub: A, role: 'authenticated' })])
  await db.exec('set role authenticated')
  let error = null
  try {
    await db.query('select public.empezar_de_cero($1)', [A])
  } catch (e) {
    error = String(e.message)
  }
  await db.exec('reset role')
  debe(error && /permission denied/i.test(error), 'permisos', `el móvil (authenticated) no puede llamar a empezar_de_cero: ${error}`)
  debe((await contar(A))['trips.traveler_id'] === 2, 'permisos', 'y no se ha borrado nada')
}

// Es una transacción: si algo falla a medias, no se borra NADA
{
  await db.exec("create function public.prueba_falla() returns trigger language plpgsql as $$ begin raise exception 'fallo de prueba'; end $$")
  await db.exec('create trigger prueba_falla before delete on public.passes for each row execute function public.prueba_falla()')
  const antes = await contar(A)
  let error = null
  try {
    await S('select public.empezar_de_cero($1)', [A])
  } catch (e) {
    error = String(e.message)
  }
  debe(error && /fallo de prueba/.test(error), 'transaccion', `el fallo de la base de datos sube hasta el servidor (${error})`)
  debe(JSON.stringify(await contar(A)) === JSON.stringify(antes), 'transaccion', 'y no se ha borrado NADA: ni los viajes, ni los logros, ni lo que se borraba antes del fallo')
  await db.exec('drop trigger prueba_falla on public.passes')
  await db.exec('drop function public.prueba_falla()')
}

// Empezar de cero
const resultado = (await S('select public.empezar_de_cero($1) as r', [A]))[0].r
c = await contar(A)
for (const [tabla, columna] of INVENTARIO) debe(c[`${tabla}.${columna}`] === 0, 'vacio', `${tabla}.${columna}: vacío para la cuenta`)
debe(resultado.borrados.trips > 0 && resultado.borrados.logro_hechos > 0 && resultado.borrados.passes > 0, 'vacio', `la función cuenta lo que borra: ${JSON.stringify(resultado.borrados)}`)
debe(c['travelers.id'] === 1 && c['invitaciones_app.user_id'] === 1, 'cuenta', 'la cuenta y su ficha se quedan (travelers e invitaciones_app)')
debe(c['logro_referidos.invitado_id'] === 1, 'cuenta', 'el registro de quien la invitó (donde ella es la invitada) se queda: es de quien invitó')
debe((await S('select count(*)::int as n from auth.users where id = $1', [A]))[0].n === 1, 'cuenta', 'la cuenta de auth NO se borra')
debe((await S('select count(*)::int as n from public.pagos_registro'))[0].n === pagosAntes, 'stripe', 'el registro de cobros queda igual')
const despuesDeLosDemas = await foto(A)
const cambiadas = Object.keys(antesDeLosDemas).filter((t) => antesDeLosDemas[t] !== despuesDeLosDemas[t])
debe(cambiadas.length === 0, 'otra', `OTRA cuenta con datos queda IDÉNTICA: ninguna tabla cambia fuera de la cuenta (cambian: ${cambiadas.join(', ') || 'ninguna'})`)
debe(Object.values(await contar(B)).filter((n) => n > 0).length >= 18, 'otra', 'la otra cuenta sigue con datos en todas sus tablas')
// Y repetirlo no rompe nada
const otraVez = (await S('select public.empezar_de_cero($1) as r', [A]))[0].r
debe(Object.values(otraVez.borrados).every((n) => n === 0), 'repetir', 'repetirlo con la cuenta ya vacía no borra nada y no falla')
let falla = null
try {
  await S('select public.empezar_de_cero($1)', ['00000000-0000-0000-0000-000000000001'])
} catch (e) {
  falla = String(e.message)
}
debe(falla && /no existe/.test(falla), 'cuenta', 'con una cuenta que no existe, falla y no borra nada')

// Lo compartido: pasa a los demás, no se borra
const C = await usuario('amiga@ejemplo.es')
await sembrar(C, 'C')
const compartido = await sembrar(A, 'A2', { amiga: C })
const antesC = await contar(C)
const antesA2 = await contar(A)
debe(antesA2['trip_recommendations.author_id'] > 0 && antesA2['trip_members.user_id'] > 0, 'siembra', 'la cuenta compartida tiene recomendaciones y sitio en el viaje de una amiga')
const rutaDelViajeCompartido = (await S('select route from public.trips where id = $1', [compartido.viaje]))[0].route
await S('select public.empezar_de_cero($1)', [A])
const despuesA2 = await contar(A)
for (const [tabla, columna] of INVENTARIO) debe(despuesA2[`${tabla}.${columna}`] === 0, 'compartido', `${tabla}.${columna}: vacío también con lo compartido`)
const viajeAhora = (await S('select traveler_id, route from public.trips where id = $1', [compartido.viaje]))[0]
debe(viajeAhora && viajeAhora.traveler_id === C && JSON.stringify(viajeAhora.route) === JSON.stringify(rutaDelViajeCompartido), 'compartido', 'el viaje compartido con una amiga NO se borra: pasa a ser de ella, con su ruta intacta')
debe((await S('select count(*)::int as n from public.trip_photos where user_id = $1 and trip_id = $2', [C, rutaDelViajeCompartido.id]))[0].n === 1, 'compartido', 'y la foto que ella tenía dentro sigue en su sitio')
const paseC = (await S('select comprador_id from public.passes where id = $1', [compartido.paseCompartido]))[0]
debe(paseC && paseC.comprador_id === C, 'compartido', 'el pase compartido con una amiga se queda con ella')
debe((await S('select count(*)::int as n from public.trips where id = $1', [compartido.viajeDeAmiga]))[0].n === 1, 'compartido', 'el viaje de la amiga, al que estaba invitada la cuenta, sigue ahí')
const despuesC = await contar(C)
const sinTocar = ['stop_visits.user_id', 'trip_photos.user_id', 'logro_hechos.user_id', 'achievements.user_id', 'logro_perfil.user_id', 'hoy_prueba.user_id', 'avisos.user_id', 'place_likes.user_id', 'push_suscripciones.user_id']
debe(sinTocar.every((k) => despuesC[k] >= antesC[k]), 'compartido', 'los logros, fotos y vistos de la amiga siguen donde estaban')
debe(despuesC['trips.traveler_id'] === antesC['trips.traveler_id'] + 1, 'compartido', 'la amiga tiene sus viajes y, además, el que le pasa la cuenta')

/* ─────────────────────────── 2. Las rutas ─────────────────────────── */
console.log('2. Las rutas: solo el administrador, solo su cuenta')
const ADMIN_EMAIL = 'eric@ejemplo.es'
const D = await usuario(ADMIN_EMAIL) // otra fila de auth con el email de administrador
const X = await usuario('otra-persona@ejemplo.es') // NO es de LOGROS_ADMIN_EMAILS
await sembrar(D, 'D')
const dueña = await sembrar(X, 'X')
const usuarios = {
  admin: { id: D, email: ADMIN_EMAIL, is_anonymous: false, user_metadata: { pelicula_pase_vista: true, otro_dato: 'queda' } },
  otra: { id: X, email: 'otra-persona@ejemplo.es', is_anonymous: false, user_metadata: { pelicula_pase_vista: true } },
  anonimo: { id: await usuario('anon@x.es'), email: null, is_anonymous: true },
}
const archivos = new Map([
  ['fotos-viaje', new Set([`${D}/d1/1.jpg`, `${D}/d1/2.jpg`, `${D}/d2/3.jpg`, `${X}/d1/1.jpg`, `${X}/d1/2.jpg`])],
  ['perfiles', new Set([`${D}/perfil.jpg`, `${X}/perfil.jpg`])],
])
const metas = []
const quitados = []
let rpcRoto = null
const adminFalso = {
  auth: {
    getUser: async (t) => (usuarios[t] ? { data: { user: usuarios[t] } } : { error: { message: 'no' } }),
    admin: {
      updateUserById: async (id, attrs) => {
        metas.push({ id, attrs })
        return { error: null }
      },
      deleteUser: async () => {
        throw new Error('NO se borra la cuenta')
      },
    },
  },
  rpc: async (fn, args) => {
    if (rpcRoto) return { error: rpcRoto }
    try {
      const filas = await S(`select public.${fn}($1) as r`, [args.p_uid])
      return { data: filas[0].r, error: null }
    } catch (e) {
      return { error: { message: String(e.message), code: e.code } }
    }
  },
  storage: {
    from: (bucket) => ({
      list: async (carpeta) => {
        const hijos = new Map()
        for (const ruta of archivos.get(bucket) ?? []) {
          if (!ruta.startsWith(`${carpeta}/`)) continue
          const resto = ruta.slice(carpeta.length + 1).split('/')
          if (resto.length === 1) hijos.set(resto[0], { name: resto[0], id: 'x' })
          else if (!hijos.has(resto[0])) hijos.set(resto[0], { name: resto[0], id: null })
        }
        return { data: [...hijos.values()], error: null }
      },
      remove: async (rutas) => {
        for (const r of rutas) {
          archivos.get(bucket).delete(r)
          quitados.push(`${bucket}:${r}`)
        }
        return { error: null }
      },
    }),
  },
  from: () => {
    throw new Error('no se toca ninguna tabla por aquí')
  },
}
const mont = {}
const app = new Proxy({}, { get: (_, metodo) => (ruta, h) => (mont[`${String(metodo).toUpperCase()} ${ruta}`] = h) })
const env = { LOGROS_ACTIVOS: 'true', CUENTAS_ACTIVAS: 'true', LOGROS_ADMIN_EMAILS: ADMIN_EMAIL }
const datos = cargarDatos()
registrarRutasLogros(app, { admin: adminFalso, servicio: { datos, catalogos: { roma: cargarCatalogo('roma') } }, repo: {}, env })
const llamar = async (ruta, token, { body = {}, query = {} } = {}) => {
  let estado = 200
  let cuerpo = null
  const res = { status: (e) => ((estado = e), res), json: (x) => ((cuerpo = x), res) }
  await mont[ruta]({ headers: token ? { authorization: `Bearer ${token}` } : {}, get: () => (token ? `Bearer ${token}` : ''), body, query }, res)
  return { estado, cuerpo }
}
debe(Boolean(mont['GET /api/admin/empezar-de-cero/puede']) && Boolean(mont['POST /api/admin/empezar-de-cero']), 'rutas', 'las dos rutas existen')

// El botón: solo el administrador (lo decide el servidor)
debe((await llamar('GET /api/admin/empezar-de-cero/puede', 'admin')).cuerpo.puede === true, 'boton', 'el administrador ve el botón (puede: true)')
debe((await llamar('GET /api/admin/empezar-de-cero/puede', 'otra')).cuerpo.puede === false, 'boton', 'un email que no es de LOGROS_ADMIN_EMAILS NO ve el botón (puede: false)')
debe((await llamar('GET /api/admin/empezar-de-cero/puede', 'anonimo')).estado === 403, 'boton', 'la sesión anónima, tampoco (403)')
debe((await llamar('GET /api/admin/empezar-de-cero/puede', null)).estado === 401, 'boton', 'sin sesión: 401')
debe((await llamar('GET /api/admin/empezar-de-cero/puede', 'raro')).estado === 401, 'boton', 'con un token que no vale: 401')

// Un email que no es de administrador no puede usarlo: 403 y NADA borrado
const antesTodo = await foto('00000000-0000-0000-0000-000000000000')
const archivosAntes = JSON.stringify([...archivos.entries()].map(([b, s]) => [b, [...s].sort()]))
for (const [quien, token] of [['una cuenta normal', 'otra'], ['la sesión anónima', 'anonimo']]) {
  const r = await llamar('POST /api/admin/empezar-de-cero', token, { body: { confirmar: true, user_id: D } })
  debe(r.estado === 403, 'no_admin', `${quien} no puede usarlo: 403`)
}
debe((await llamar('POST /api/admin/empezar-de-cero', null, { body: { confirmar: true } })).estado === 401, 'no_admin', 'sin sesión: 401')
const despuesTodo = await foto('00000000-0000-0000-0000-000000000000')
debe(Object.keys(antesTodo).every((t) => antesTodo[t] === despuesTodo[t]), 'no_admin', 'y no se ha borrado NADA en ninguna tabla (ni de la cuenta del administrador que intentaba nombrar)')
debe(archivosAntes === JSON.stringify([...archivos.entries()].map(([b, s]) => [b, [...s].sort()])) && metas.length === 0 && quitados.length === 0, 'no_admin', 'ni archivos de fotos, ni datos de la persona')

// El administrador, sin confirmar
{
  const r = await llamar('POST /api/admin/empezar-de-cero', 'admin', { body: {} })
  debe(r.estado === 400 && (await contar(D))['trips.traveler_id'] === 2, 'confirmar', 'sin confirmar: 400 y no se borra nada')
}
// Si la base de datos falla (o falta la migración), no se borra NADA: ni archivos ni marca
{
  rpcRoto = { message: 'Could not find the function public.empezar_de_cero(p_uid) in the schema cache', code: 'PGRST202' }
  const r = await llamar('POST /api/admin/empezar-de-cero', 'admin', { body: { confirmar: true } })
  debe(r.estado === 500 && /0032/.test(r.cuerpo.error), 'fallo', `sin la migración 0032: 500 y lo dice (${r.cuerpo.error})`)
  rpcRoto = { message: 'boom', code: 'XX000' }
  const r2 = await llamar('POST /api/admin/empezar-de-cero', 'admin', { body: { confirmar: true } })
  debe(r2.estado === 500 && quitados.length === 0 && metas.length === 0 && (await contar(D))['trips.traveler_id'] === 2, 'fallo', 'con la base de datos rota: 500 y ni archivos ni marca ni filas tocadas')
  rpcRoto = null
}
// El administrador de verdad: solo su cuenta (aunque el cuerpo traiga otro user_id)
const antesDeX = await contar(X)
const fotosDeLosDemas = await foto(D)
const ok = await llamar('POST /api/admin/empezar-de-cero', 'admin', { body: { confirmar: true, user_id: X, uid: X } })
debe(ok.estado === 200 && ok.cuerpo.ok === true, 'admin', `el administrador lo hace (${ok.estado})`)
c = await contar(D)
for (const [tabla, columna] of INVENTARIO) debe(c[`${tabla}.${columna}`] === 0, 'admin', `${tabla}.${columna}: vacío para el administrador`)
debe(JSON.stringify(await contar(X)) === JSON.stringify(antesDeX), 'admin', 'la otra cuenta (la que el cuerpo intentaba nombrar) queda IDÉNTICA, tabla a tabla')
const fotosDespues = await foto(D)
debe(Object.keys(fotosDeLosDemas).every((t) => fotosDeLosDemas[t] === fotosDespues[t]), 'admin', 'y nada más de la base de datos ha cambiado fuera de la cuenta del administrador')
const quedanFotosD = [...archivos.get('fotos-viaje')].filter((r) => r.startsWith(`${D}/`))
const quedanFotosX = [...archivos.get('fotos-viaje')].filter((r) => r.startsWith(`${X}/`))
debe(quedanFotosD.length === 0 && quedanFotosX.length === 2 && ok.cuerpo.archivos === 3, 'storage', 'los archivos de las fotos del administrador se borran (3) y los de la otra cuenta quedan (2)')
debe([...archivos.get('perfiles')].length === 2, 'storage', 'la foto del perfil se queda (es de la ficha de la cuenta)')
debe(metas.length === 1 && metas[0].id === D && metas[0].attrs.user_metadata.pelicula_pase_vista === null && metas[0].attrs.user_metadata.otro_dato === 'queda', 'pelicula', 'la marca «ya vi la película del pase» se quita de los datos de la persona (y no se pierde ningún otro dato)')
debe((await S('select count(*)::int as n from auth.users where id = $1', [D]))[0].n === 1 && (await S('select count(*)::int as n from public.travelers where id = $1', [D]))[0].n === 1, 'cuenta', 'la cuenta (auth y su ficha) se queda')
debe((await S('select count(*)::int as n from public.pagos_registro'))[0].n === pagosAntes, 'stripe', 'el registro de cobros queda igual')
debe(Array.isArray(ok.cuerpo.avisos) && ok.cuerpo.avisos.length === 0, 'avisos', 'sin avisos cuando todo ha ido bien')
void dueña
// Repetirlo
const segunda = await llamar('POST /api/admin/empezar-de-cero', 'admin', { body: { confirmar: true } })
debe(segunda.estado === 200 && segunda.cuerpo.archivos === 0, 'repetir', 'repetirlo con la cuenta ya vacía: 200 y nada que borrar')
// Con la lista de archivos que falla, no se borra nada
{
  const mala = await empezarDeCero(adminFalso, usuarios.admin, { archivosDe: async () => { throw new Error('sin red') } })
  debe(mala.ok === false && /No se ha borrado nada/.test(mala.error), 'fallo', 'si no se pueden leer las fotos, no se hace nada')
  const real = await empezarDeCero(adminFalso, usuarios.admin, { archivosDe })
  debe(real.ok === true, 'fallo', 'y con la función real de listar archivos (server/cuentas.js) también funciona')
}

/* ─────────────────────────── 3. El código ─────────────────────────── */
console.log('3. El código')
{
  const sin = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s--.*$/gm, '')
  const sql = sin(fs.readFileSync('supabase/migrations/0032_empezar_de_cero.sql', 'utf8'))
  const reiniciar = sin(fs.readFileSync('server/logros/reiniciar.js', 'utf8'))
  const rutas = fs.readFileSync('server/logros/rutas.js', 'utf8')
  const bloque = rutas.slice(rutas.indexOf("app.get('/api/admin/empezar-de-cero/puede'"), rutas.indexOf("app.post('/api/admin/logros/sin-pase'"))
  debe(!/stripe/i.test(sql + reiniciar + bloque), 'stripe', 'ni la migración, ni el servicio, ni las rutas nombran a Stripe: no se llama ni se toca nada de Stripe')
  debe(!/pagos_registro/.test(sql.replace(/\n--.*$/gm, '')), 'stripe', 'la migración no toca el registro de cobros')
  debe(!/delete\s+from\s+auth\./i.test(sql) && !/deleteUser/.test(reiniciar + bloque), 'cuenta', 'no hay ningún borrado de la cuenta de auth')
  debe(/'delete from public\.%I where %I = \$1'/.test(sql) && (sql.match(/\bdelete\s+from\b/gi) ?? []).length === 1, 'filtro', 'en la migración hay UN solo borrado y siempre «columna = uid» (nunca un filtro amplio)')
  debe(!/truncate/i.test(sql), 'filtro', 'ningún TRUNCATE')
  debe(/revoke all on function public\.empezar_de_cero\(uuid\) from public, anon, authenticated/.test(sql) && /grant execute on function public\.empezar_de_cero\(uuid\) to service_role/.test(sql), 'permisos', 'la función es solo del servidor')
  debe(!/req\.body\??\.(user|uid)/.test(bloque) && /usuario/.test(bloque) && /empezarDeCero\(admin, usuario/.test(bloque), 'uid', 'la ruta nunca lee la cuenta de lo que manda el móvil: usa la de la sesión')
  debe(/conAdmin\(async \(req, res, usuario\)/.test(bloque) && /esAdmin\(usuario, env\)/.test(bloque), 'admin', 'el servidor decide con LOGROS_ADMIN_EMAILS (esAdmin) en las dos rutas')
  debe(!/@[a-z0-9-]+\.(com|es|org)/i.test(reiniciar + bloque), 'admin', 'ningún email escrito en el código')
  debe(!/from\('/.test(reiniciar), 'filtro', 'el servicio no hace consultas sueltas a tablas: todo pasa por la función de la base de datos')
  const motor = ['server/logros/reiniciar.js', 'src/lib/empezarDeCero.ts', 'supabase/migrations/0032_empezar_de_cero.sql'].map((f) => fs.readFileSync(f, 'utf8')).join('\n')
  debe(!/routeEngine|server\/engine|shared\//.test(motor), 'motor', 'no toca el motor de rutas')
  // El inventario de la prueba es el de la migración
  const tablasSql = [...sql.matchAll(/\('([a-z_]+)', '([a-z_]+)'\)/g)].map((m) => `${m[1]}.${m[2]}`).sort()
  debe(JSON.stringify(tablasSql) === JSON.stringify(INVENTARIO.map(([t, col]) => `${t}.${col}`).sort()), 'inventario', `el inventario de la prueba y el de la migración son el mismo (${tablasSql.length} tablas)`)
  // El cliente
  const cliente = fs.readFileSync('src/lib/empezarDeCero.ts', 'utf8')
  const panel = fs.readFileSync('src/components/logros/AdminLogros.tsx', 'utf8')
  debe(/Se borrará todo lo de tu cuenta: viajes, reservas, fotos, logros, experiencia, el día de prueba y los pases\. La cuenta se queda\. ¿Seguro\?/.test(panel) && /Sí, empezar de cero/.test(panel) && />Cancelar</.test(panel), 'pantalla', 'el diálogo lleva el texto exacto y los dos botones')
  debe(panel.indexOf('<VermeSinPase />') < panel.indexOf('<EmpezarDeCero />') && panel.indexOf('<EmpezarDeCero />') < panel.indexOf('<MisPruebas />'), 'pantalla', 'el botón está junto a «Verme como viajero sin pase»')
  debe(/location\.replace\('\/'\)/.test(cliente) && !/recargarSinApertura|MARCA_SIN_APERTURA/.test(cliente), 'pantalla', 'al acabar vuelve a la raíz SIN la marca de «sin apertura»: sale la apertura como la primera vez')
  debe(/signOut/.test(cliente) && /pelicula_pase_vista: null/.test(cliente) && /indexedDB/.test(cliente) && /localStorage/.test(cliente) && /sessionStorage/.test(cliente), 'pantalla', 'cierra la sesión y limpia localStorage, sessionStorage, IndexedDB y la marca de la película')
}

/* ─────────────────────────── 4. La pantalla ─────────────────────────── */
console.log('4. La pantalla (modo demo del panel)')
let hayDev = false
try {
  hayDev = (await fetch('http://localhost:5173/')).ok
} catch {
  hayDev = false
}
if (!hayDev) {
  console.log('   (sin `npm run dev` en el puerto 5173: la parte de pantalla se salta)')
} else {
  const { abrirApp } = await import('./_enLaApp.mjs')
  const esp = (ms) => new Promise((r) => setTimeout(r, ms))
  const SALIDA = path.resolve('docs/dias/capturas_jutrip')
  fs.mkdirSync(SALIDA, { recursive: true })
  const abrirPanel = async (extra = '') => {
    const a = await abrirApp('http://localhost:5173', { ruta: '/?admin=logros&logrosDemo=1&cuentas=on&logros=on', antes: extra })
    for (let i = 0; i < 40 && !(await a.evaluar("Boolean(document.querySelector('[data-admin-logros]'))").catch(() => false)); i++) await esp(500)
    await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('nav button')).find((x) => x.textContent.trim() === 'Mis pruebas'); b.click(); return true })()")
    await esp(1200)
    return a
  }
  // La cuenta que NO es de administrador: el botón no existe
  {
    const a = await abrirPanel("try { sessionStorage.setItem('trazo:demo-no-admin', '1') } catch (e) {}")
    debe((await a.evaluar("Boolean(document.querySelector('[data-ver-sin-pase]'))")) === true, 'pantalla', 'el panel se abre en «Mis pruebas» con «Verme como viajero sin pase»')
    debe((await a.evaluar("Boolean(document.querySelector('[data-empezar-de-cero]'))")) === false, 'pantalla', 'si el servidor dice que no eres administrador, el botón NO sale')
    a.cerrar()
  }
  // El administrador
  const a = await abrirPanel(
    "if (window.name !== 'sembrado10j') try { window.name = 'sembrado10j'; localStorage.setItem('trazo:pelicula-pase-vista', '1'); localStorage.setItem('trazo:logrosDemo:basura', 'x'); localStorage.setItem('route-planner-algo', 'y'); sessionStorage.setItem('trazo:otra', 'z'); sessionStorage.setItem('trazo:cuentas', 'on'); indexedDB.open('base-de-prueba-10j', 1) } catch (e) {}",
  )
  debe((await a.evaluar("Boolean(document.querySelector('[data-empezar-de-cero-boton]'))")) === true, 'pantalla', 'el administrador ve [Empezar de cero]')
  const mismaFila = await a.evaluar("(() => { const v = document.querySelector('[data-ver-sin-pase]'); const e = document.querySelector('[data-empezar-de-cero]'); return v && e && v.nextElementSibling === e })()")
  debe(mismaFila === true, 'pantalla', 'justo debajo de «Verme como viajero sin pase»')
  await a.captura(path.join(SALIDA, 'j10_boton.jpg'))
  await a.evaluar("document.querySelector('[data-empezar-de-cero-boton]').click()")
  await esp(500)
  const dialogo = await a.evaluar("document.querySelector('[data-empezar-de-cero-dialogo]')?.innerText ?? null")
  debe(dialogo && dialogo.includes('Se borrará todo lo de tu cuenta: viajes, reservas, fotos, logros, experiencia, el día de prueba y los pases. La cuenta se queda. ¿Seguro?') && dialogo.includes('Sí, empezar de cero') && dialogo.includes('Cancelar'), 'pantalla', `el diálogo dice el texto exacto (${String(dialogo).replace(/\n/g, ' | ')})`)
  await a.captura(path.join(SALIDA, 'j10_dialogo.jpg'))
  await a.evaluar("document.querySelector('[data-empezar-de-cero-no]').click()")
  await esp(400)
  debe((await a.evaluar("!document.querySelector('[data-empezar-de-cero-dialogo]') && Boolean(document.querySelector('[data-empezar-de-cero-boton]')) && localStorage.getItem('trazo:pelicula-pase-vista') === '1'")) === true, 'pantalla', '[Cancelar] cierra el diálogo y no se borra nada del móvil')
  await a.evaluar("document.querySelector('[data-empezar-de-cero-boton]').click()")
  await esp(300)
  await a.evaluar("document.querySelector('[data-empezar-de-cero-si]').click()")
  // Tras borrar, la app vuelve a la raíz recargando
  let url = ''
  for (let i = 0; i < 40; i++) {
    await esp(500)
    url = await a.evaluar('location.pathname + location.search').catch(() => '')
    if (url === '/') break
  }
  debe(url === '/', 'pantalla', `vuelve a la pantalla de inicio (la raíz): ${url}`)
  await esp(1500)
  const estado = await a.evaluar(`(async () => ({
    local: Object.keys(localStorage).filter((k) => !['trazo:cuentas', 'trazo:logros', 'trazo:civitatis', 'trazo:version'].includes(k)),
    sesion: Object.keys(sessionStorage).filter((k) => !['trazo:cuentas', 'trazo:logros', 'trazo:civitatis', 'trazo:version'].includes(k)),
    peli: localStorage.getItem('trazo:pelicula-pase-vista'),
    bases: (await indexedDB.databases()).map((b) => b.name).filter((n) => n === 'base-de-prueba-10j'),
    apertura: Boolean(document.getElementById('apertura')),
    sinApertura: sessionStorage.getItem('jutrip:sin-apertura'),
  }))()`)
  const sobran = estado.local.filter((k) => !/^(sb-|trazo:)/.test(k) || k === 'trazo:pelicula-pase-vista' || k.startsWith('trazo:logrosDemo'))
  debe(estado.peli === null && !estado.local.includes('route-planner-algo') && !estado.local.includes('trazo:logrosDemo:basura') && !estado.sesion.includes('trazo:otra'), 'pantalla', `se borra lo del móvil, incluida la marca de la película (quedan: ${JSON.stringify(estado.local.concat(estado.sesion))})`)
  debe(estado.bases.length === 0, 'pantalla', 'y las bases de IndexedDB de la app')
  debe(estado.sinApertura === null, 'pantalla', 'sin la marca de «sin apertura»: la apertura sale como la primera vez')
  void sobran
  a.cerrar()
}

if (noAplicadas.length) console.log(`   (migraciones que el Postgres de prueba no aplica, sin importar a esta prueba: ${noAplicadas.length})`)
console.log(`\nLa prueba de la Tanda 10J: ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
for (const f of fallos) console.log(`  FALLO [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
