// A qué cuenta está unido el Google de Eric, si hay una o dos cuentas con su email, cuál tiene sus viajes y qué sesiones anónimas con viajes se podrían pasar (arreglo de entrar).
//   node scripts/cuentas/cuentaDeEric.mjs [--email=otro@correo.es]
// Solo LEE. La clave de servicio y el email del administrador (LOGROS_ADMIN_EMAILS) salen de `.env.local`; las claves no se enseñan nunca. De cada cuenta enseña un identificador corto,
// no el email entero de nadie más.
import fs from 'node:fs'
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
const pedido = process.argv.find((a) => a.startsWith('--email='))?.split('=')[1]
const emails = (pedido ? [pedido] : String(env.LOGROS_ADMIN_EMAILS ?? '').split(',')).map((e) => e.trim().toLowerCase()).filter(Boolean)
if (emails.length === 0) {
  console.log('No hay email: pon LOGROS_ADMIN_EMAILS en .env.local o pásalo con --email=…')
  process.exit(2)
}
const admin = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })

const usuarios = []
for (let pagina = 1; pagina < 100; pagina++) {
  const { data, error } = await admin.auth.admin.listUsers({ page: pagina, perPage: 1000 })
  if (error) throw new Error(error.message)
  usuarios.push(...data.users)
  if (data.users.length < 1000) break
}
const corto = (id) => `${id.slice(0, 8)}…`
const fecha = (iso) => (iso ? String(iso).slice(0, 16).replace('T', ' ') : '—')
const sinEmail = (u) => String(u.email ?? '').toLowerCase()
// (La lista de usuarios no trae las identidades: los proveedores salen de `app_metadata.providers` y el detalle de cada cuenta se pide aparte.)
const proveedoresDe = (u) => u.app_metadata?.providers ?? (u.app_metadata?.provider ? [u.app_metadata.provider] : [])
const delEmail = (u) => emails.includes(sinEmail(u))

const viajesDe = async (uid) => {
  const { data } = await admin.from('trips').select('id, route, updated_at, guardado_en').eq('traveler_id', uid)
  return data ?? []
}
const cuenta = async (tabla, col, uid) => (await admin.from(tabla).select('*', { count: 'exact', head: true }).eq(col, uid)).count ?? 0
const resumenViaje = (t) => {
  const r = t.route ?? {}
  const rango = r.answers?.dateRange
  return `${r.destination ?? '¿?'}${rango?.start ? ` ${rango.start}→${rango.end}` : ''}${t.guardado_en ? ' (guardado aparte)' : ''}`
}

console.log(`Cuentas de Supabase en total: ${usuarios.length} (${usuarios.filter((u) => u.is_anonymous).length} anónimas).\n`)
const mias = usuarios.filter(delEmail)
console.log(`Cuentas que llevan tu email (o una identidad con tu email): ${mias.length}`)
for (const u of mias) {
  const viajes = await viajesDe(u.id)
  console.log(`\n  · ${corto(u.id)}  ${u.is_anonymous ? 'ANÓNIMA' : 'cuenta'}  creada ${fecha(u.created_at)}  último acceso ${fecha(u.last_sign_in_at)}`)
  const detalle = (await admin.auth.admin.getUserById(u.id)).data?.user
  const idents = (detalle?.identities ?? []).map((i) => `${i.provider} (unida ${fecha(i.created_at)})`)
  console.log(`      proveedores: ${proveedoresDe(u).join(', ') || '(ninguno)'}  ·  identidades: ${idents.join(', ') || '(ninguna)'}`)
  console.log(`      viajes: ${viajes.length}${viajes.length ? ' → ' + viajes.map(resumenViaje).join(' | ') : ''}`)
  console.log(`      logros: ${await cuenta('achievements', 'user_id', u.id)} · hechos: ${await cuenta('logro_hechos', 'user_id', u.id)} · pases comprados: ${await cuenta('passes', 'comprador_id', u.id)} · visitas: ${await cuenta('stop_visits', 'user_id', u.id)}`)
}
const reales = mias.filter((u) => !u.is_anonymous)
console.log(`\nResumen: ${reales.length === 0 ? 'NO hay ninguna cuenta real con tu email.' : reales.length === 1 ? 'una sola cuenta real con tu email (bien).' : `¡HAY ${reales.length} cuentas reales con tu email! Habría que juntarlas.`}`)
const google = mias.filter((u) => proveedoresDe(u).includes('google'))
const otrasConGoogle = usuarios.filter((u) => !u.is_anonymous && !delEmail(u) && proveedoresDe(u).includes('google'))
console.log(`Tu Google está unido a: ${google.length === 0 ? 'ninguna cuenta' : google.map((u) => `${corto(u.id)}${u.is_anonymous ? ' (anónima)' : ''}`).join(', ')}.`)
const conViajes = []
for (const u of mias) if ((await viajesDe(u.id)).length > 0) conViajes.push(corto(u.id))
console.log(`Otras cuentas reales con Google que NO llevan tu email: ${otrasConGoogle.length} (no se enseña de quién son).`)
console.log(`Tus viajes están en: ${conViajes.length ? conViajes.join(', ') : 'ninguna de esas cuentas'}.`)

// Sesiones anónimas con viajes (cualquiera: no se sabe de quién es cada una; se enseñan solo las que tienen viajes, con la fecha del último uso).
const anonimas = usuarios.filter((u) => u.is_anonymous)
const conV = []
for (const u of anonimas) {
  const v = await viajesDe(u.id)
  if (v.length) conV.push({ u, v })
}
conV.sort((a, b) => String(b.u.last_sign_in_at ?? '').localeCompare(String(a.u.last_sign_in_at ?? '')))
console.log(`\nSesiones anónimas con viajes: ${conV.length} (las más recientes primero; si una es de tu navegador normal, sus viajes pasan a tu cuenta al entrar):`)
for (const { u, v } of conV.slice(0, 15)) console.log(`  · ${corto(u.id)}  creada ${fecha(u.created_at)}  último acceso ${fecha(u.last_sign_in_at)}  ${v.length} viaje(s): ${v.map(resumenViaje).join(' | ')}`)
if (conV.length > 15) console.log(`  … y ${conV.length - 15} más.`)
