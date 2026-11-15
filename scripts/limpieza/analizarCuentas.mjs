// LIMPIEZA DE CUENTAS DE PRUEBA (15-nov): SOLO LEE. Clasifica las cuentas del Supabase de producción en «se quedan» (las de los correos de administrador, con lo compartido entre ellos) y «de prueba», cuenta
// lo que habría que borrar, marca las que NO parecen de pruebas y guarda una copia completa de lo que se borraría en una carpeta del PC (FUERA del repo). No borra nada.
//   ADMIN_EMAILS="uno@x.com,otro@y.com" node --env-file=.env.local scripts/limpieza/analizarCuentas.mjs [carpeta_de_la_copia]
// Usa la clave de servicio de .env.local (nunca se imprime). La carpeta de la copia lleva datos privados: no se sube a ningún sitio.
import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

const url = process.env.VITE_SUPABASE_URL
const clave = process.env.SUPABASE_SERVICE_ROLE_KEY
const admins = String(process.env.ADMIN_EMAILS ?? '').split(',').map((e) => e.trim().toLowerCase()).filter(Boolean)
if (!url || !clave) throw new Error('Faltan VITE_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local.')
if (admins.length === 0) throw new Error('Falta ADMIN_EMAILS.')
const carpeta = process.argv[2] ?? path.join(process.env.USERPROFILE ?? '.', 'Desktop', 'JUTRIP_copia_cuentas_de_prueba_2026-11-15')
if (path.resolve(carpeta).startsWith(path.resolve('.'))) throw new Error('La copia no puede estar dentro del repo.')
fs.mkdirSync(carpeta, { recursive: true })
const sb = createClient(url, clave, { auth: { persistSession: false, autoRefreshToken: false } })

/** Las tablas con datos de una persona (las del inventario de «Empezar de cero», más las de pruebas), con su columna de persona. */
const TABLAS = [
  ['stop_visits', 'user_id'], ['trip_photo_meta', 'user_id'], ['trip_photos', 'user_id'], ['logro_hechos', 'user_id'], ['achievements', 'user_id'], ['logro_avisos', 'user_id'], ['logro_perfil', 'user_id'],
  ['push_suscripciones', 'user_id'], ['logro_referidos', 'invitador_id'], ['avisos', 'user_id'], ['avisos_viaje_enviados', 'user_id'], ['avisos_destino', 'user_id'], ['place_likes', 'user_id'],
  ['admin_sin_pase', 'user_id'], ['trip_recommendations', 'author_id'], ['trip_gastos', 'autor_id'], ['trip_pagos', 'marcado_por'], ['trip_invitations', 'creada_por'], ['trip_members', 'user_id'],
  ['trip_ex_miembros', 'user_id'], ['pass_members', 'user_id'], ['passes', 'comprador_id'], ['billetes_personales', 'user_id'], ['lo_suyo_del_viaje', 'user_id'], ['reservas_invitado', 'user_id'],
  ['reservas_privadas_admin', 'user_id'], ['fotos_por_borrar', 'user_id'], ['hoy_prueba', 'user_id'], ['historia_de_prueba', 'user_id'], ['lecturas_de_documentos', 'user_id'], ['travelers', 'id'],
]

/** Todas las filas de una tabla, por páginas (las rutas pesan ~100 kB: `trips` va de 10 en 10 y ordenada por id, o la base da «statement timeout»). */
async function todo(tabla) {
  const filas = []
  const pagina = tabla === 'trips' ? 10 : 1000
  for (let desde = 0; ; desde += pagina) {
    let r = await sb.from(tabla).select('*').order(tabla === 'travelers' || tabla === 'trips' ? 'id' : 'created_at', { ascending: true, nullsFirst: true }).range(desde, desde + pagina - 1)
    if (r.error && tabla !== 'trips' && /created_at/.test(r.error.message)) r = await sb.from(tabla).select('*').range(desde, desde + pagina - 1)
    if (r.error) return { error: r.error.message, filas }
    filas.push(...r.data)
    if (r.data.length < pagina) break
  }
  return { filas }
}

// 1. Las cuentas
const usuarios = []
for (let pagina = 1; ; pagina++) {
  const { data, error } = await sb.auth.admin.listUsers({ page: pagina, perPage: 1000 })
  if (error) throw new Error(`listUsers: ${error.message}`)
  usuarios.push(...data.users)
  if (data.users.length < 1000) break
}
const adminIds = new Set(usuarios.filter((u) => u.email && admins.includes(u.email.toLowerCase())).map((u) => u.id))
const encontrados = usuarios.filter((u) => u.email && admins.includes(u.email.toLowerCase())).map((u) => u.email.toLowerCase())
const noEncontrados = admins.filter((e) => !encontrados.includes(e))

// 2. Los datos
const datos = {}
const faltan = []
for (const [tabla] of [['trips'], ...TABLAS]) {
  const r = await todo(tabla)
  if (r.error) faltan.push(`${tabla}: ${r.error}`)
  datos[tabla] = r.filas
}
const trips = datos.trips
const miembros = datos.trip_members ?? []

// 3. Quién se queda: los administradores y los dueños de viajes donde un administrador es miembro (lo compartido no se pierde).
const seQuedan = new Set(adminIds)
const ligadas = []
for (const m of miembros) {
  if (adminIds.has(m.user_id)) {
    const viaje = trips.find((t) => t.id === m.trip_id)
    if (viaje && !seQuedan.has(viaje.traveler_id)) {
      seQuedan.add(viaje.traveler_id)
      ligadas.push(viaje.traveler_id)
    }
  }
}
const aBorrar = usuarios.filter((u) => !seQuedan.has(u.id))
const idsBorrar = new Set(aBorrar.map((u) => u.id))

// 4. Señales de uso real en cada cuenta a borrar
const porUsuario = (tabla, col) => {
  const m = new Map()
  for (const f of datos[tabla] ?? []) m.set(f[col], (m.get(f[col]) ?? 0) + 1)
  return m
}
const cuentas = Object.fromEntries(TABLAS.map(([t, c]) => [t, porUsuario(t, c)]))
const tripsDe = new Map()
for (const t of trips) tripsDe.set(t.traveler_id, [...(tripsDe.get(t.traveler_id) ?? []), t])
const reservasNoVacias = (t) => {
  const b = t.bookings ?? {}
  return (b.reservations?.length ?? 0) > 0 || Object.keys(b.accommodationSelections ?? {}).length > 0 || (b.transportBookings && Object.keys(b.transportBookings).length > 0) || Boolean(b.rentalVehicleBooking) || Boolean(b.insuranceBooking)
}
const hoy = Date.now()
function ficha(u) {
  const vs = tripsDe.get(u.id) ?? []
  const senales = []
  if (u.email) senales.push('tiene correo')
  if (vs.some((t) => /lanzarote/i.test(t.route?.destination ?? ''))) senales.push('viaje a Lanzarote')
  if (vs.some((t) => t.route?.editedManually)) senales.push('ruta cambiada a mano')
  if (vs.some(reservasNoVacias)) senales.push('reservas puestas')
  if (vs.some((t) => (t.wishlist?.length ?? 0) > 0)) senales.push('lista de deseos')
  for (const [tabla, etiqueta] of [['stop_visits', 'paradas vistas'], ['trip_photos', 'fotos'], ['passes', 'pases'], ['logro_hechos', 'logros'], ['billetes_personales', 'billetes'], ['push_suscripciones', 'avisos del móvil'], ['trip_members', 'viaje compartido'], ['trip_invitations', 'invitaciones'], ['trip_gastos', 'gastos'], ['hoy_prueba', 'prueba de HOY gastada'], ['trip_recommendations', 'recomendaciones']]) {
    if (cuentas[tabla].get(u.id)) senales.push(`${etiqueta} (${cuentas[tabla].get(u.id)})`)
  }
  const ultimo = u.last_sign_in_at ? Date.parse(u.last_sign_in_at) : null
  return { id: u.id, anonima: Boolean(u.is_anonymous), email: u.email ?? null, creada: u.created_at, ultimoAcceso: u.last_sign_in_at ?? null, viajes: vs.length, destinos: [...new Set(vs.map((t) => t.route?.destination).filter(Boolean))], senales, ultimaHaceDias: ultimo ? Math.round((hoy - ultimo) / 86400000) : null }
}
const fichas = aBorrar.map(ficha)
const sospechosas = fichas.filter((f) => f.senales.length > 0)

// 5. La copia, en el PC
const guardar = (nombre, valor) => fs.writeFileSync(path.join(carpeta, nombre), JSON.stringify(valor, null, 1))
guardar('auth_users_a_borrar.json', aBorrar.map((u) => ({ id: u.id, email: u.email ?? null, is_anonymous: u.is_anonymous, created_at: u.created_at, last_sign_in_at: u.last_sign_in_at, app_metadata: u.app_metadata, user_metadata: u.user_metadata })))
const cuantasFilas = {}
for (const [tabla, col] of [['trips', 'traveler_id'], ...TABLAS]) {
  const mias = (datos[tabla] ?? []).filter((f) => idsBorrar.has(f[col]))
  cuantasFilas[tabla] = mias.length
  if (mias.length > 0) guardar(`${tabla}.json`, mias)
}
// Lo que cuelga de los viajes que se borran (aunque su persona no sea la dueña): miembros y recomendaciones de los viajes a borrar.
const tripsBorrados = new Set((datos.trips ?? []).filter((t) => idsBorrar.has(t.traveler_id)).map((t) => t.id))
const resumen = {
  fecha: new Date().toISOString(),
  administradores: { buscados: admins.length, encontrados: encontrados.length, noEncontrados: noEncontrados.length },
  cuentas: { total: usuarios.length, seQuedan: seQuedan.size, deAdministrador: adminIds.size, ligadasPorViajeCompartido: ligadas.length, aBorrar: aBorrar.length, aBorrarAnonimas: aBorrar.filter((u) => u.is_anonymous).length, aBorrarConCorreo: aBorrar.filter((u) => u.email).length },
  viajes: { total: trips.length, seQuedan: trips.filter((t) => seQuedan.has(t.traveler_id)).length, aBorrar: tripsBorrados.size },
  filasAborrarPorTabla: cuantasFilas,
  tablasQueNoSePudieronLeer: faltan,
  sospechosas: sospechosas.length,
}
guardar('RESUMEN.json', resumen)
guardar('FICHAS_cuentas_a_borrar.json', fichas)
guardar('SOSPECHOSAS.json', sospechosas)
guardar('ids_a_borrar.json', aBorrar.map((u) => u.id))
const kb = fs.readdirSync(carpeta).reduce((s, f) => s + fs.statSync(path.join(carpeta, f)).size, 0) / 1024

console.log(JSON.stringify(resumen, null, 1))
console.log(`\nLa copia está en: ${carpeta} (${(kb / 1024).toFixed(1)} MB, ${fs.readdirSync(carpeta).length} archivos)`)
console.log(`\nCuentas que NO parecen solo de pruebas (${sospechosas.length}); primeras 25 por señales:`)
for (const f of [...sospechosas].sort((a, b) => b.senales.length - a.senales.length).slice(0, 25)) {
  console.log(`- ${f.id.slice(0, 8)}… ${f.anonima ? 'anónima' : 'con cuenta'}${f.email ? ` ${f.email.replace(/^(.).*(@.*)$/, '$1***$2')}` : ''} · ${f.viajes} viaje(s) ${f.destinos.join('/')} · último acceso hace ${f.ultimaHaceDias ?? '?'} d · ${f.senales.join(', ')}`)
}
const conCorreo = fichas.filter((f) => f.email)
if (conCorreo.length > 0) {
  console.log(`\nCuentas A BORRAR con correo (${conCorreo.length}):`)
  for (const f of conCorreo) console.log(`- ${f.id.slice(0, 8)}… ${f.email.replace(/^(.).*(@.*)$/, '$1***$2')} · ${f.viajes} viaje(s) ${f.destinos.join('/')} · último acceso hace ${f.ultimaHaceDias ?? '?'} d`)
}
