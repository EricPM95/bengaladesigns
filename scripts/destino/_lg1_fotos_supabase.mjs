// LG1 (Eric, 5-nov): las fotos de prueba que quedaban en el Supabase real (tabla `trip_photos` y almacén `fotos-viaje`).
//   node scripts/destino/_lg1_fotos_supabase.mjs            → solo LEE: lista las filas, de qué viajes son y si el viaje existe en `trips`/`trip_snapshots`.
//   node scripts/destino/_lg1_fotos_supabase.mjs borrar=1   → borra SOLO las filas (y sus archivos) cuyo viaje NO existe como viaje de un viajero (de prueba). Si alguna es de un viaje que existe, no la borra y la dice.
// La clave de servicio sale de .env.local (nunca se imprime).
import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const env = Object.fromEntries(fs.readFileSync('.env.local', 'utf8').split('\n').filter((l) => /^[A-Z_]+=/.test(l)).map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '')]))
const sb = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const borrar = process.argv.includes('borrar=1')

const { data: fotos, error } = await sb.from('trip_photos').select('id,user_id,trip_id,day_id,day_number,stop_name,storage_path,width,height,bytes,created_at').order('created_at')
if (error) { console.log('ERROR leyendo trip_photos:', error.message); process.exit(1) }
// ¿De quién es cada foto? Un viaje de PRUEBA es el de una sesión anónima SIN correo (así entran las pruebas automáticas y el desarrollo); una foto de una cuenta con correo, o de un usuario que no es anónimo, NO se toca. (La tabla de viajes se agota si se lee entera: no se usa.)
const usuarios = new Map()
for (const u of [...new Set(fotos.map((f) => f.user_id))]) {
  const { data, error: e } = await sb.auth.admin.getUserById(u)
  usuarios.set(u, e ? { desconocido: true } : { anonimo: data?.user?.is_anonymous === true, correo: Boolean(data?.user?.email) })
}
console.log(`
${fotos.length} fotos en trip_photos:`)
const dePrueba = []
const dudosas = []
for (const f of fotos) {
  const u = usuarios.get(f.user_id)
  const prueba = u && !u.desconocido && u.anonimo && !u.correo
  console.log(`${f.id.slice(0, 8)} · trip=${f.trip_id} · ${f.created_at.slice(0, 19)} · ${f.width}x${f.height} · ${f.bytes} B · día ${f.day_number} · ${f.stop_name ?? '-'} · sesión anónima sin correo=${prueba}`)
  ;(prueba ? dePrueba : dudosas).push(f)
}
console.log(`
de sesiones anónimas sin correo (de prueba): ${dePrueba.length} · de una cuenta con correo o desconocidas (NO se tocan): ${dudosas.length}`)
if (!borrar) process.exit(0)
if (dudosas.length) console.log('OJO: estas son de un viaje que existe y NO se borran:', dudosas.map((f) => f.id.slice(0, 8)).join(', '))
let borradas = 0
for (const f of dePrueba) {
  const a = await sb.storage.from('fotos-viaje').remove([f.storage_path])
  const b = await sb.from('trip_photos').delete().eq('id', f.id)
  if (a.error || b.error) console.log(`no se pudo borrar ${f.id.slice(0, 8)}: ${a.error?.message ?? ''} ${b.error?.message ?? ''}`)
  else { borradas++; console.log(`borrada ${f.id.slice(0, 8)} (${f.trip_id})`) }
}
const resto = await sb.from('trip_photos').select('id', { count: 'exact', head: true })
console.log(`\nborradas ${borradas}; quedan ${resto.count} en trip_photos`)
