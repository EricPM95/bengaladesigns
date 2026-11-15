// BORRA las cuentas de prueba del Supabase de producción con la API de administración (lo mismo que hace la app al borrar una cuenta: el usuario y, en cascada, todo lo suyo). Orden de Eric, 15-nov: «Borra todo».
//   ADMIN_EMAILS="uno@x.com,otro@y.com" node --env-file=.env.local scripts/limpieza/ejecutarBorrado.mjs [carpeta_de_la_copia]
// Seguridad: se para si no encuentra a los dos administradores, si no existe la copia, o si va a borrar a un administrador / a quien comparte un viaje con ellos. Se puede repetir (solo borra lo que queda).
import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

const url = process.env.VITE_SUPABASE_URL
const clave = process.env.SUPABASE_SERVICE_ROLE_KEY
const admins = String(process.env.ADMIN_EMAILS ?? '').split(',').map((e) => e.trim().toLowerCase()).filter(Boolean)
if (!url || !clave || admins.length !== 2) throw new Error('Faltan VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY o los 2 correos de ADMIN_EMAILS.')
const carpeta = process.argv[2] ?? path.join(process.env.USERPROFILE ?? '.', 'Desktop', 'JUTRIP_copia_cuentas_de_prueba_2026-11-15')
for (const f of ['trips.json', 'auth_users_a_borrar.json', 'RESUMEN.json']) if (!fs.existsSync(path.join(carpeta, f))) throw new Error(`No hay copia (${f}) en ${carpeta}: no se borra nada.`)
const sb = createClient(url, clave, { auth: { persistSession: false, autoRefreshToken: false } })

const usuarios = []
for (let pagina = 1; ; pagina++) {
  const { data, error } = await sb.auth.admin.listUsers({ page: pagina, perPage: 1000 })
  if (error) throw new Error(`listUsers: ${error.message}`)
  usuarios.push(...data.users)
  if (data.users.length < 1000) break
}
const adminIds = usuarios.filter((u) => u.email && admins.includes(u.email.toLowerCase())).map((u) => u.id)
if (adminIds.length !== 2) throw new Error('No encuentro las dos cuentas de administrador: no se borra nada.')
const quedan = new Set(adminIds)
// Lo compartido con ellos: dueños de viajes donde un administrador es miembro.
const { data: miembros, error: em } = await sb.from('trip_members').select('trip_id, user_id').in('user_id', adminIds)
if (em) throw new Error(`trip_members: ${em.message}`)
if (miembros.length > 0) {
  const { data: viajes, error: ev } = await sb.from('trips').select('id, traveler_id').in('id', miembros.map((m) => m.trip_id))
  if (ev) throw new Error(`trips: ${ev.message}`)
  for (const v of viajes) quedan.add(v.traveler_id)
}
const copia = new Set(JSON.parse(fs.readFileSync(path.join(carpeta, 'auth_users_a_borrar.json'), 'utf8')).map((u) => u.id))
const aBorrar = usuarios.filter((u) => !quedan.has(u.id))
const sinCopia = aBorrar.filter((u) => !copia.has(u.id))
console.log(`Cuentas ahora: ${usuarios.length} · se quedan: ${quedan.size} · a borrar: ${aBorrar.length} · de ellas sin estar en la copia: ${sinCopia.length}`)
if (aBorrar.some((u) => adminIds.includes(u.id))) throw new Error('Iba a borrar a un administrador: se para.')
// Las que no estaban en la copia (cuentas nuevas desde el análisis) no se borran: se avisa.
const seguras = aBorrar.filter((u) => copia.has(u.id))
if (sinCopia.length > 0) console.log(`(Se saltan ${sinCopia.length} cuentas que no estaban en la copia: ${sinCopia.map((u) => u.id.slice(0, 8)).join(', ')})`)

if (process.env.SIMULAR === '1') {
  console.log(`SIMULACIÓN: se borrarían ${seguras.length} cuentas; no se borra nada.`)
  process.exit(0)
}

let hechas = 0
let errores = 0
const fallos = []
let siguiente = 0
async function trabajador() {
  while (siguiente < seguras.length) {
    const u = seguras[siguiente++]
    const { error } = await sb.auth.admin.deleteUser(u.id)
    if (error) {
      errores++
      if (fallos.length < 10) fallos.push(`${u.id.slice(0, 8)}: ${error.message}`)
    } else hechas++
    if ((hechas + errores) % 250 === 0) console.log(`  … ${hechas + errores} / ${seguras.length} (${errores} errores)`)
  }
}
const t0 = Date.now()
await Promise.all(Array.from({ length: 6 }, trabajador))
console.log(`Borradas: ${hechas} · errores: ${errores} · ${Math.round((Date.now() - t0) / 1000)} s`)
if (fallos.length) console.log('Primeros errores:', fallos)

// Recuento final
const despues = []
for (let pagina = 1; ; pagina++) {
  const { data } = await sb.auth.admin.listUsers({ page: pagina, perPage: 1000 })
  despues.push(...data.users)
  if (data.users.length < 1000) break
}
const cuenta = async (tabla) => (await sb.from(tabla).select('*', { count: 'exact', head: true })).count
const tripsDeLosQueSeQuedan = (await sb.from('trips').select('id', { count: 'exact', head: true }).in('traveler_id', [...quedan])).count
console.log(JSON.stringify({ cuentas: despues.length, travelers: await cuenta('travelers'), viajes: await cuenta('trips'), viajesDeLosQueSeQuedan: tripsDeLosQueSeQuedan, miembrosDeViaje: await cuenta('trip_members'), avisos: await cuenta('avisos'), quedanPorBorrar: despues.filter((u) => !quedan.has(u.id)).length, administradoresSiguen: despues.filter((u) => adminIds.includes(u.id)).length }, null, 1))
