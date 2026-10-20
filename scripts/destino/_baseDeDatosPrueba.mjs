// La base de datos de prueba de las cuentas (parte 3): un Postgres de verdad dentro de Node (PGlite), con las migraciones REALES, `auth.uid()` simulado y las reglas de
// seguridad activas. Lo usan pruebaCuentas3.mjs y, si hace falta, otras pruebas. Lo que PGlite no es (Supabase) queda para `scripts/cuentas/comprobarSupabase.mjs`.
import fs from 'node:fs'
import path from 'node:path'
import { PGlite } from '@electric-sql/pglite'

export const MIGRACIONES = /^(0001|0002|0003|0012|0018|0020|0021|0023|0024|0025|0026|0027|0028)_/

export async function crearBaseDePrueba({ migraciones = MIGRACIONES, alFallar = (m) => console.log('  ✗', m) } = {}) {
  // (PGlite se cree en un navegador si ve una ventana: se quita la de mentira antes de crearlo.)
  const ventana = globalThis.window
  const documento = globalThis.document
  delete globalThis.window
  delete globalThis.document
  const db = new PGlite()
  await db.waitReady
  globalThis.window = ventana
  globalThis.document = documento
  await db.exec(`
    create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
    create schema auth;
    create table auth.users (id uuid primary key default gen_random_uuid(), email text, is_anonymous boolean not null default false, created_at timestamptz default now(), raw_user_meta_data jsonb default '{}'::jsonb);
    create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
    create function auth.uid() returns uuid language sql stable as $$ select nullif(auth.jwt() ->> 'sub', '')::uuid $$;
    create schema storage;
    create table storage.buckets (id text primary key, name text, public boolean default false);
    create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text references storage.buckets (id), name text, owner uuid, created_at timestamptz default now(), unique (bucket_id, name));
    alter table storage.objects enable row level security;
    create function storage.foldername(name text) returns text[] language sql immutable as $$ select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1] $$;
  `)
  const aplicadas = fs.readdirSync('supabase/migrations').filter((f) => migraciones.test(f)).sort()
  for (const archivo of aplicadas) {
    try {
      await db.exec(fs.readFileSync(path.join('supabase/migrations', archivo), 'utf8'))
    } catch (error) {
      alFallar(`${archivo} no se aplica: ${error.message}`)
    }
  }
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
  // (las funciones que las migraciones reservaron al servidor)
  for (const f of ['reclamar_anonimo(uuid, uuid)', 'preparar_borrado(uuid)', 'registrar_pago(text, text, text, uuid, text, text, integer, integer, text, uuid)', 'devolver_pago(text)', 'guardar_recibo(text, text)', 'pases_de(uuid)', 'intencion_de_pago(text)', 'crear_aviso(uuid, text, text, jsonb)', 'avisos_de(uuid)', 'marcar_avisos_leidos(uuid, uuid[])', 'viajes_para_avisos(uuid)', 'logro_avisos_vencidos(uuid, timestamptz)', 'logro_aviso_en_campanita(uuid)', 'avisos_para_push(integer)', 'marcar_push(uuid)', 'borrar_suscripcion(text)', 'usuarios_para_avisos(date, date)', 'registrar_referido(text, uuid)']) await db.exec(`revoke execute on function public.${f} from authenticated`)
  return montar(db, aplicadas)
}

export function montar(db, aplicadas = []) {
  const claims = (uid, anonimo = false) => JSON.stringify({ sub: uid, role: 'authenticated', is_anonymous: anonimo })
  const q = async (sql, params = []) => (await db.query(sql, params)).rows
  async function como(uid, fn, { anonimo = false, rol = 'authenticated' } = {}) {
    await db.exec('reset role')
    await db.query("select set_config('request.jwt.claims', $1, false)", [uid ? claims(uid, anonimo) : ''])
    await db.exec(`set role ${rol}`)
    try {
      return await fn()
    } finally {
      await db.exec('reset role')
      await db.query("select set_config('request.jwt.claims', '', false)")
    }
  }
  const servidor = async (fn) => {
    await db.exec('reset role')
    await db.exec('set role service_role')
    try {
      return await fn()
    } finally {
      await db.exec('reset role')
    }
  }
  const nuevoUsuario = async (email, anonimo = false, nombre = null) => {
    const id = (await q('insert into auth.users (email, is_anonymous) values ($1, $2) returning id', [email, anonimo]))[0].id
    await q('insert into public.travelers (id, is_anonymous, email, nombre) values ($1, $2, $3, $4) on conflict (id) do update set nombre = coalesce(excluded.nombre, public.travelers.nombre)', [id, anonimo, email, nombre])
    return id
  }
  return { db, q, como, servidor, nuevoUsuario, claims, aplicadas }
}

/**
 * Un cliente de Supabase de mentira para el servidor (la clave de servicio): `auth.getUser(token)`, `auth.admin.deleteUser`, `storage` y `rpc`, todo sobre la base de pruebas.
 * `fichas` es un Map token → uid (qué token es de quién).
 */
export function crearAdminDePrueba(bd, fichas = new Map()) {
  const { db, q, servidor } = bd
  return {
    fichas,
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
            const resto = f.name.slice(prefijo.length + 1)
            const [primero, ...mas] = resto.split('/')
            if (mas.length === 0) entradas.push({ id: f.id, name: primero })
            else if (!vistos.has(primero)) {
              vistos.add(primero)
              entradas.push({ id: null, name: primero })
            }
          }
          return { data: entradas, error: null }
        },
        move: async (de, a) => {
          try {
            await db.query('update storage.objects set name = $1 where bucket_id = $2 and name = $3', [a, bucket, de])
            return { error: null }
          } catch (error) {
            return { error: { message: error.message } }
          }
        },
        remove: async (rutas) => {
          await db.query('delete from storage.objects where bucket_id = $1 and name = any($2::text[])', [bucket, rutas])
          return { data: rutas, error: null }
        },
      }),
    },
    rpc: async (nombre, args = {}) => {
      try {
        const claves = Object.keys(args)
        const filas = await servidor(() => q(`select public.${nombre}(${claves.map((_, i) => `$${i + 1}`).join(', ')}) as r`, Object.values(args)))
        return { data: filas[0].r, error: null }
      } catch (error) {
        return { data: null, error: { message: error.message } }
      }
    },
  }
}
