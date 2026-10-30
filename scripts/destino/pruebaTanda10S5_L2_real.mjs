// Tanda 10S5 (agente L) · el billete privado en el Supabase REAL (migración 0070). SIEMPRE SOLA (usa la base real y las cuentas de prueba fijas de docs/dias/_cuentas_prueba_10n10.json, nunca la de Eric).
// Solo vale con la 0070 aplicada: si falta la tabla, dice «SALTADA: falta la 0070» y no toca nada (sale con 0).
//   · el dueño guarda su billete en su fila; otra cuenta del MISMO viaje (el invitado) no lo lee, no lo cambia, no lo borra, y no puede escribir en la fila del dueño;
//   · el dueño, desde «otro móvil» (otra sesión suya), lo lee entero;
//   · el administrador del viaje no lo ve cuando es de otra persona (se prueba con la fila del invitado leída por el dueño).
// Lee en memoria VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY y SUPABASE_SERVICE_ROLE_KEY de .env.local (nunca las imprime). Al acabar borra el viaje de prueba y sus filas.
//   node scripts/destino/pruebaTanda10S5_L2_real.mjs
import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const env = { ...process.env }
try {
  for (const linea of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(linea)
    if (m && env[m[1]] === undefined) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
} catch {
  /* sin .env.local */
}
const { VITE_SUPABASE_URL: URL_, VITE_SUPABASE_ANON_KEY: ANON, SUPABASE_SERVICE_ROLE_KEY: SERVICIO } = env
if (!URL_ || !ANON || !SERVICIO) {
  console.log('SALTADA: faltan VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY o SUPABASE_SERVICE_ROLE_KEY. No se ha tocado nada.')
  process.exit(0)
}
let cuentas
try {
  cuentas = JSON.parse(fs.readFileSync('docs/dias/_cuentas_prueba_10n10.json', 'utf8'))
} catch {
  console.log('SALTADA: no está docs/dias/_cuentas_prueba_10n10.json (las cuentas fijas de prueba). No se ha tocado nada.')
  process.exit(0)
}
const fallos = []
let comprobaciones = 0
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) fallos.push({ regla, texto })
  console.log(`  ${cond ? 'ok ' : 'MAL'} ${regla} · ${texto}`)
}
const limpio = (m) => String(m ?? '').replace(/eyJ[\w.-]+/g, '[clave]')
const opciones = { auth: { persistSession: false, autoRefreshToken: false } }
const servicio = createClient(URL_, SERVICIO, opciones)

const falta = await servicio.from('billetes_personales').select('user_id').limit(1)
if (falta.error) {
  console.log(`SALTADA: falta la 0070 (la tabla billetes_personales no existe todavía: ${limpio(falta.error.message)}). Aplícala y pasa COMPROBAR_0070.sql. No se ha tocado nada.`)
  process.exit(0)
}

const entrar = async (d) => {
  const c = createClient(URL_, ANON, opciones)
  const { error } = await c.auth.signInWithPassword({ email: d.email, password: d.password })
  if (error) throw new Error('signIn: ' + limpio(error.message))
  return c
}
let viaje = null
try {
  const dueno = await entrar(cuentas.admin)
  const dueno2 = await entrar(cuentas.admin) // «otro móvil» de la misma persona: otra sesión
  const otro = await entrar(cuentas.invitado)
  const ins = await dueno.from('trips').insert({ traveler_id: cuentas.admin.id, route: { days: [] } }).select('id').single()
  debe(!ins.error && Boolean(ins.data?.id), 'viaje', `el dueño crea su viaje de prueba${ins.error ? ': ' + limpio(ins.error.message) : ''}`)
  viaje = ins.data.id
  const datos = { arrival: { asiento: '14C', localizador: 'ABC123', codigo: { dibujo: 'data:image/svg+xml;utf8,<svg/>', formato: 'qr' }, dueno: cuentas.admin.id } }
  const sube = await dueno.from('billetes_personales').upsert({ trip_id: viaje, user_id: cuentas.admin.id, datos, actualizado_en: new Date().toISOString() })
  debe(!sube.error, 'dueño', `el dueño guarda su billete en su fila${sube.error ? ': ' + limpio(sube.error.message) : ''}`)
  const mio2 = await dueno2.from('billetes_personales').select('datos').eq('trip_id', viaje).eq('user_id', cuentas.admin.id).maybeSingle()
  debe(mio2.data?.datos?.arrival?.asiento === '14C' && mio2.data?.datos?.arrival?.codigo?.formato === 'qr', 'otro móvil', 'desde otra sesión suya (otro móvil) lo lee entero')
  const ajeno = await otro.from('billetes_personales').select('datos').eq('trip_id', viaje)
  debe(!ajeno.error && (ajeno.data ?? []).length === 0, 'privado', `otra cuenta NO lo lee (${(ajeno.data ?? []).length} filas)`)
  const ajenoDirecto = await otro.from('billetes_personales').select('datos').eq('trip_id', viaje).eq('user_id', cuentas.admin.id)
  debe((ajenoDirecto.data ?? []).length === 0, 'privado', 'ni pidiéndolo por el id del dueño')
  const pisar = await otro.from('billetes_personales').upsert({ trip_id: viaje, user_id: cuentas.admin.id, datos: { arrival: { asiento: 'XXX' } } })
  debe(pisar.error !== null, 'privado', 'otra cuenta no puede escribir en la fila del dueño')
  const cambiar = await otro.from('billetes_personales').update({ datos: {} }).eq('trip_id', viaje).eq('user_id', cuentas.admin.id).select('user_id')
  debe((cambiar.data ?? []).length === 0, 'privado', 'ni cambiarla')
  const borrar = await otro.from('billetes_personales').delete().eq('trip_id', viaje).eq('user_id', cuentas.admin.id).select('user_id')
  debe((borrar.data ?? []).length === 0, 'privado', 'ni borrarla')
  const suyo = await otro.from('billetes_personales').upsert({ trip_id: viaje, user_id: cuentas.invitado.id, datos: { departure: { asiento: '1A' } } })
  debe(!suyo.error, 'invitado', `el invitado guarda el SUYO${suyo.error ? ': ' + limpio(suyo.error.message) : ''}`)
  const adminVeSuyo = await dueno.from('billetes_personales').select('user_id, datos').eq('trip_id', viaje)
  debe((adminVeSuyo.data ?? []).length === 1 && adminVeSuyo.data[0].user_id === cuentas.admin.id, 'privado', 'el administrador del viaje solo ve el suyo: el del invitado no sale')
  const sigue = await servicio.from('billetes_personales').select('datos').eq('trip_id', viaje).eq('user_id', cuentas.admin.id).maybeSingle()
  debe(sigue.data?.datos?.arrival?.asiento === '14C', 'privado', 'y la fila del dueño sigue intacta')
} finally {
  if (viaje) {
    await servicio.from('billetes_personales').delete().eq('trip_id', viaje)
    await servicio.from('trips').delete().eq('id', viaje)
  }
}
console.log(`\n${comprobaciones} comprobaciones, ${fallos.length} fallos`)
process.exit(fallos.length ? 1 : 0)
