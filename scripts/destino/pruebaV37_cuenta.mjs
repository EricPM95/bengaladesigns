// V37 · «Borrar mi cuenta» (RGPD). Sin Chrome ni Supabase real: PGlite con TODAS las migraciones + el servidor de cuentas de verdad.
//   node scripts/destino/pruebaV37_cuenta.mjs
// Comprueba: pide BORRAR (sin la palabra no se borra nada); no deja a una sesión anónima ni a un administrador; borra todo de la cuenta y su acceso (Supabase Auth) y sus archivos;
// deja el registro de pagos (pagos_registro); lo compartido pasa a la otra persona; no toca a las demás cuentas; y el texto de la hoja y de la política de privacidad.
import fs from 'node:fs'
import path from 'node:path'
import { PGlite } from '@electric-sql/pglite'
import { registrarRutasCuentas } from '../../server/cuentas.js'

let comprobaciones = 0
const fallos = []
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) fallos.push({ regla, texto })
}

console.log('1. La base de datos (PGlite, todas las migraciones)')
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
const noAplicadas = []
for (const archivo of fs.readdirSync('supabase/migrations').filter((f) => /^\d{4}_.*\.sql$/.test(f)).sort()) {
  try {
    await db.exec(fs.readFileSync(path.join('supabase/migrations', archivo), 'utf8'))
  } catch (error) {
    noAplicadas.push(`${archivo}: ${String(error.message).slice(0, 80)}`)
  }
}
debe(!noAplicadas.some((x) => /^00(21|32|40|72|91)/.test(x)), 'migracion', `las migraciones que usa el borrado se aplican (${noAplicadas.join(' | ')})`)
await db.exec(`
  grant usage on schema public, auth, storage to anon, authenticated, service_role;
  grant all on all tables in schema public to authenticated, service_role;
  grant all on all tables in schema storage to authenticated, service_role;
  grant select on auth.users to authenticated, service_role;
  grant execute on all functions in schema public to service_role;
`)
const q = async (sql, params = []) => (await db.query(sql, params)).rows
const n = async (sql, params = []) => (await q(sql, params))[0].n
const usuario = async (email, anonimo = false) => (await q('insert into auth.users (email, is_anonymous) values ($1, $2) returning id', [email, anonimo]))[0].id

const fichas = new Map() // token → uid
const admin = {
  auth: {
    getUser: async (token) => {
      const uid = fichas.get(token)
      if (!uid) return { data: { user: null }, error: { message: 'token no válido' } }
      const u = (await q('select id, is_anonymous, email from auth.users where id = $1', [uid]))[0]
      return u ? { data: { user: { id: u.id, is_anonymous: u.is_anonymous, email: u.email } }, error: null } : { data: { user: null }, error: { message: 'no existe' } }
    },
    admin: {
      deleteUser: async (id) => {
        try {
          await db.query('delete from auth.users where id = $1', [id])
          return { error: null }
        } catch (error) {
          return { error: { message: error.message } }
        }
      },
    },
  },
  storage: {
    from: (bucket) => ({
      list: async (prefijo) => {
        const filas = await q('select id, name from storage.objects where bucket_id = $1 and name like $2', [bucket, `${prefijo}/%`])
        const vistos = new Set()
        const entradas = []
        for (const f of filas) {
          const [primero, ...mas] = f.name.slice(prefijo.length + 1).split('/')
          if (mas.length === 0) entradas.push({ id: f.id, name: primero })
          else if (!vistos.has(primero)) {
            vistos.add(primero)
            entradas.push({ id: null, name: primero })
          }
        }
        return { data: entradas, error: null }
      },
      remove: async (rutas) => {
        await db.query('delete from storage.objects where bucket_id = $1 and name = any($2::text[])', [bucket, rutas])
        return { data: rutas, error: null }
      },
    }),
  },
  rpc: async (nombre, args) => {
    try {
      const filas = await q(`select public.${nombre}(${Object.keys(args).map((_, i) => `$${i + 1}`).join(', ')}) as r`, Object.values(args))
      return { data: filas[0].r, error: null }
    } catch (error) {
      return { data: null, error: { message: error.message } }
    }
  },
}

console.log('2. Las personas y lo que tienen')
await db.exec("insert into storage.buckets (id, name) values ('fotos-viaje', 'fotos-viaje'), ('perfiles', 'perfiles') on conflict do nothing")
const ana = await usuario('ana@correo.es')
const beto = await usuario('beto@correo.es')
const anonima = await usuario(null, true)
const jefa = await usuario('jefa@correo.es')
fichas.set('tok-ana', ana).set('tok-beto', beto).set('tok-anon', anonima).set('tok-jefa', jefa)
for (const [id, anon] of [[ana, false], [beto, false], [anonima, true], [jefa, false]]) await q('insert into public.travelers (id, is_anonymous) values ($1, $2)', [id, anon])
const viajeAna = (await q("insert into public.trips (traveler_id, route, bookings) values ($1, $2, '{}') returning id", [ana, JSON.stringify({ id: 'ruta-ana', destino: 'roma' })]))[0].id
await q("insert into public.trips (traveler_id, route, bookings) values ($1, $2, '{}')", [beto, JSON.stringify({ id: 'ruta-beto', destino: 'roma' })])
await q("insert into public.achievements (user_id, logro, escalon, destino, trip_id) values ($1, 'Roma antigua', 'oro', 'Roma', $2)", [ana, viajeAna])
await q("insert into public.achievements (user_id, logro, escalon, destino) values ($1, 'Roma antigua', 'oro', 'Roma')", [beto])
await q("insert into storage.objects (bucket_id, name, owner) values ('fotos-viaje', $1, $2), ('fotos-viaje', $3, $4), ('perfiles', $5, $2)", [`${ana}/x/a.jpg`, ana, `${beto}/x/b.jpg`, beto, `${ana}/perfil.jpg`])
// Un pase que Ana pagó y usa también Beto (pasa a él); y un pago registrado (se queda).
const pase = (await q("insert into public.passes (destino, comprador_id, tipo, para_id, usos_max, codigo) values ('Roma', $1, 'duo', null, 2, 'ROMA-DUO-V37') returning id", [ana]))[0].id
await q('insert into public.pass_members (pass_id, user_id) values ($1, $2), ($1, $3)', [pase, ana, beto])
await q("insert into public.pagos_registro (pago_ref, proveedor, destino, plan, personas, importe_cent, user_id) values ('pi_v37', 'mentira', 'Roma', 'duo', 2, 1998, $1)", [ana])

console.log('3. Las rutas (el DELETE de verdad, con respuesta de mentira)')
process.env.LOGROS_ADMIN_EMAILS = 'jefa@correo.es'
const rutas = new Map()
registrarRutasCuentas({ post: (p, h) => rutas.set(`POST ${p}`, h), delete: (p, h) => rutas.set(`DELETE ${p}`, h) }, admin)
const borrar = async (token, cuerpo) => {
  const r = { estado: 0, cuerpo: null, status(x) { r.estado = x; return r }, json(c) { r.cuerpo = c; return r } }
  await rutas.get('DELETE /api/cuenta')({ headers: token ? { authorization: `Bearer ${token}` } : {}, get: (h) => (h.toLowerCase() === 'authorization' && token ? `Bearer ${token}` : ''), body: cuerpo }, r)
  return r
}
const hayUsuario = async (id) => (await n('select count(*)::int as n from auth.users where id = $1', [id])) === 1

let r = await borrar('tok-ana', {})
debe(r.estado === 400 && (await hayUsuario(ana)), 'confirmar', 'sin la palabra BORRAR no se borra nada (400)')
r = await borrar('tok-ana', { confirmar: 'borrar' })
debe(r.estado === 400 && (await hayUsuario(ana)), 'confirmar', 'la palabra tiene que ser BORRAR (en mayúsculas)')
r = await borrar('tok-anon', { confirmar: 'BORRAR' })
debe(r.estado === 403 && (await hayUsuario(anonima)), 'anonima', 'una sesión anónima no puede borrar (403) y su acceso sigue')
r = await borrar('tok-jefa', { confirmar: 'BORRAR' })
debe(r.estado === 403 && /otro administrador/i.test(r.cuerpo?.error ?? '') && (await hayUsuario(jefa)), 'admin', 'un administrador ve «Pídeselo a otro administrador» y su cuenta sigue')
r = await borrar('tok-falso', { confirmar: 'BORRAR' })
debe(r.estado === 401 && (await hayUsuario(ana)), 'token', 'un token que no vale responde 401')
r = await borrar(null, { confirmar: 'BORRAR' })
debe(r.estado === 401, 'token', 'sin token responde 401')

console.log('4. Borrar la cuenta de Ana')
const antesBeto = { viajes: await n('select count(*)::int as n from public.trips where traveler_id = $1', [beto]), logros: await n('select count(*)::int as n from public.achievements where user_id = $1', [beto]) }
r = await borrar('tok-ana', { confirmar: 'BORRAR' })
debe(r.estado === 200 && r.cuerpo?.ok === true, 'borrar', `con BORRAR responde 200 (${r.estado} ${JSON.stringify(r.cuerpo)})`)
debe(!(await hayUsuario(ana)), 'borrar', 'su acceso (auth.users) ya no existe')
debe((await n('select count(*)::int as n from public.travelers where id = $1', [ana])) === 0, 'borrar', 'su ficha de viajera ya no existe')
debe((await n('select count(*)::int as n from public.trips where traveler_id = $1', [ana])) === 0, 'borrar', 'sus viajes se han borrado')
debe((await n('select count(*)::int as n from public.achievements where user_id = $1', [ana])) === 0, 'borrar', 'sus logros se han borrado')
debe((await n("select count(*)::int as n from storage.objects where name like $1", [`${ana}/%`])) === 0, 'borrar', 'sus archivos (fotos y foto de perfil) se han borrado')
debe((await n('select count(*)::int as n from public.pass_members where user_id = $1', [ana])) === 0, 'borrar', 'ya no usa ningún pase')
debe((await n("select count(*)::int as n from public.passes where id = $1 and comprador_id = $2", [pase, ana])) === 0, 'pases', 'el pase que pagó ya no está a su nombre')
debe((await n('select count(*)::int as n from public.pagos_registro where user_id = $1', [ana])) === 1, 'pagos', 'el registro de sus pagos (fecha e importe) SE QUEDA')
debe((await n('select count(*)::int as n from public.trips where traveler_id = $1', [beto])) === antesBeto.viajes && (await n('select count(*)::int as n from public.achievements where user_id = $1', [beto])) === antesBeto.logros, 'otros', 'lo de Beto no se toca')
debe((await n("select count(*)::int as n from storage.objects where name like $1", [`${beto}/%`])) === 1, 'otros', 'los archivos de Beto no se tocan')
debe((await n('select count(*)::int as n from public.pass_members where user_id = $1', [beto])) === 1, 'pases', 'Beto sigue usando el pase que pagó Ana (pasa a ella)')
r = await borrar('tok-ana', { confirmar: 'BORRAR' })
debe(r.estado === 401, 'borrar', 'repetirlo con la sesión ya borrada responde 401 (nada que borrar)')

console.log('5. Los textos (hoja de Ajustes y política de privacidad)')
const hoja = fs.readFileSync('src/components/ajustes/AjustesScreen.tsx', 'utf8')
debe(/Se borran tus viajes, fotos, logros y datos/.test(hoja) && /Los pases que pagaste se pierden; los que usa otra persona pasan a ella/.test(hoja) && /Por ley guardamos el registro de tus pagos \(fecha e importe\)/.test(hoja), 'texto', 'la hoja explica qué se borra, qué pasa con los pases y qué guarda la ley')
debe(/escribe BORRAR/.test(hoja) && /Borrar mi cuenta para siempre/.test(hoja) && /palabra\.trim\(\) !== 'BORRAR'/.test(hoja), 'texto', 'la hoja pide escribir BORRAR y el botón dice «Borrar mi cuenta para siempre» (apagado hasta escribirlo)')
debe(/Pídeselo a otro administrador/.test(hoja), 'texto', 'la hoja avisa a un administrador')
const cliente = fs.readFileSync('src/lib/cuentas.ts', 'utf8')
debe(/confirmar: 'BORRAR'/.test(cliente), 'cliente', 'la app manda la confirmación al servidor')
const priv = fs.readFileSync('src/lib/privacidad.ts', 'utf8')
debe(/desde Ajustes/.test(priv) && /CORREO_PRIVACIDAD/.test(priv) && /privacidad@jutrip\.app/.test(fs.readFileSync('src/lib/contacto.ts', 'utf8')), 'privacidad', 'la política dice que se borra desde Ajustes y por el correo de privacidad')

for (const f of fallos) console.log(`  ✗ [${f.regla}] ${f.texto}`)
console.log(`\nPrueba V37 · borrar mi cuenta: ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
process.exit(fallos.length ? 1 : 0)
