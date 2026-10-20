// Mira, migración por migración (de la 0001 a la 0028), qué de lo que crea cada una existe ya en el Supabase de verdad: tablas, columnas, funciones y almacenes.
//   node scripts/cuentas/estadoMigraciones.mjs
// Lee las migraciones de supabase/migrations y saca de cada una lo que crea; la clave sale de `.env.local` y no se muestra. Solo LEE: no cambia nada en Supabase.
import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

const env = {}
for (const l of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/)
  if (m && !l.trim().startsWith('#')) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}
if (!env.VITE_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
  console.log('Faltan VITE_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local.')
  process.exit(2)
}
const admin = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } })

const tabla = async (t) => {
  const { error } = await admin.from(t).select('*').limit(1)
  return !error
}
const columna = async (t, c) => {
  const { error } = await admin.from(t).select(c).limit(1)
  return !error
}
// Las funciones: PostgREST publica su lista en `/rest/v1/` (OpenAPI, `/rpc/<nombre>`). Llamarlas sin argumentos no sirve: las que llevan argumentos dicen «no está» aunque estén.
const abierta = await fetch(`${env.VITE_SUPABASE_URL}/rest/v1/`, { headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` } }).then((r) => r.json()).catch(() => ({}))
const funcionesQueHay = new Set(Object.keys(abierta.paths ?? {}).filter((x) => x.startsWith('/rpc/')).map((x) => x.slice(5)))
if (funcionesQueHay.size === 0) console.log('(No he podido leer la lista de funciones de Supabase: las funciones saldrán como «faltan».)')
const funcion = async (f) => funcionesQueHay.has(f)
const { data: almacenes } = await admin.storage.listBuckets()
const buckets = new Map((almacenes ?? []).map((b) => [b.id, b]))

const dir = 'supabase/migrations'
const archivos = fs.readdirSync(dir).filter((f) => /^\d{4}_.*\.sql$/.test(f)).sort()
let faltaAlgo = false
for (const archivo of archivos) {
  const sql = fs.readFileSync(path.join(dir, archivo), 'utf8').replace(/--.*$/gm, '')
  const cosas = []
  for (const m of sql.matchAll(/create table (?:if not exists )?public\.(\w+)/gi)) cosas.push({ tipo: 'tabla', nombre: m[1], ok: () => tabla(m[1]) })
  for (const m of sql.matchAll(/alter table (?:if exists )?public\.(\w+)\s+add column (?:if not exists )?(\w+)/gi)) cosas.push({ tipo: 'columna', nombre: `${m[1]}.${m[2]}`, ok: () => columna(m[1], m[2]) })
  // (Las funciones de disparador —`returns trigger`— no se publican por la API: no se pueden mirar desde fuera.)
  for (const m of sql.matchAll(/create (?:or replace )?function public\.(\w+)\s*\(/gi)) if (!/^[^;]*?returns trigger/i.test(sql.slice(m.index + m[0].length, m.index + m[0].length + 400))) cosas.push({ tipo: 'función', nombre: m[1], ok: () => funcion(m[1]) })
  for (const m of sql.matchAll(/insert into storage\.buckets[^;]*?values\s*\(\s*'(\w[\w-]*)'/gi)) cosas.push({ tipo: 'almacén', nombre: m[1], ok: async () => buckets.has(m[1]) })
  const vistas = new Set()
  const unicas = cosas.filter((c) => (vistas.has(c.tipo + c.nombre) ? false : (vistas.add(c.tipo + c.nombre), true)))
  const faltan = []
  for (const c of unicas) if (!(await c.ok())) faltan.push(`${c.tipo} ${c.nombre}`)
  const estado = unicas.length === 0 ? 'sin nada que mirar desde fuera' : faltan.length === 0 ? `TODO (${unicas.length} cosas)` : faltan.length === unicas.length ? `NADA (${unicas.length} cosas)` : `A MEDIAS: faltan ${faltan.length} de ${unicas.length}`
  if (faltan.length) faltaAlgo = true
  console.log(`${archivo.padEnd(48)} ${estado}`)
  for (const f of faltan) console.log(`      falta ${f}`)
}
const perfiles = buckets.get('perfiles')
if (perfiles) console.log(`\nAlmacén «perfiles»: ${perfiles.public ? 'PÚBLICO (falta la 0027)' : 'privado'}`)
process.exit(faltaAlgo ? 1 : 0)
