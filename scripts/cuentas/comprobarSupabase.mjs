// Comprueba las cuentas (parte 3) contra el Supabase DE VERDAD. Lo lanza Eric UNA vez, cuando haya aplicado las migraciones y puesto las claves:
//   node scripts/cuentas/comprobarSupabase.mjs
// Opciones: --api=http://localhost:8787 (el servidor de la app, para el pago de prueba y el borrado)   --sin-pago (se salta el pago de prueba)
// Las claves se leen SOLO de `.env.local` y no se muestran nunca (ni en pantalla ni en ningún archivo). Si falta una clave o una migración, NO prueba nada: dice qué falta y para.
// Todo lo que crea (usuarios de prueba, viaje, foto, invitación, recomendación) se borra al final, salga bien o mal.
import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

const args = process.argv.slice(2)
const opcion = (n, def) => args.find((a) => a.startsWith(`--${n}=`))?.split('=').slice(1).join('=') ?? def
const API = opcion('api', 'http://localhost:8787')
const sinPago = args.includes('--sin-pago')

/** Lee `.env.local` sin tocar el entorno de nadie ni enseñar nada. */
function leerEnv() {
  const f = path.resolve('.env.local')
  if (!fs.existsSync(f)) return {}
  const env = {}
  for (const linea of fs.readFileSync(f, 'utf8').split(/\r?\n/)) {
    const m = linea.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/)
    if (m && !linea.trim().startsWith('#')) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
  return env
}
const env = leerEnv()

const resultados = []
let fallos = 0
const ok = (nombre) => resultados.push(`  ✓ ${nombre}`)
const mal = (nombre, porque) => {
  fallos++
  resultados.push(`  ✗ ${nombre}${porque ? ` — ${porque}` : ''}`)
}
const comprobar = (cond, nombre, porque) => (cond ? ok(nombre) : mal(nombre, porque))
const texto = (e) => String(e?.message ?? e ?? 'error desconocido')

/* ── 0 · Qué hace falta antes de empezar ── */
const CLAVES = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY']
const sinClaves = CLAVES.filter((c) => !env[c])
if (sinClaves.length) {
  console.log('No lanzo la comprobación: faltan estas claves en .env.local (solo los nombres, nunca los valores):')
  for (const c of sinClaves) console.log(`  · ${c}`)
  console.log('Ponlas (Supabase → Project Settings → API) y vuelve a lanzar el script.')
  process.exit(2)
}

const url = env.VITE_SUPABASE_URL
const admin = createClient(url, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } })
const nuevoCliente = () => createClient(url, env.VITE_SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } })

/* ── 1 · Las migraciones: cada una se reconoce por algo que SOLO ella crea ── */
const MIGRACIONES = [
  { n: '0020', tabla: 'trip_recommendations' },
  { n: '0021', tabla: 'trip_invitations' },
  { n: '0023', tabla: 'logro_hechos' },
  { n: '0026', tabla: 'avisos' },
  { n: '0026', tabla: 'pagos_registro' },
  { n: '0026', tabla: 'invitaciones_app' },
]
const existe = async (tabla) => {
  const { error } = await admin.from(tabla).select('*', { head: true, count: 'exact' }).limit(1)
  return !error || !/does not exist|Could not find the table|schema cache/i.test(error.message)
}
const faltan = []
for (const m of MIGRACIONES) {
  let hay = await existe(m.tabla)
  if (!hay && m.alternativa) hay = await existe(m.alternativa)
  if (!hay) faltan.push(`${m.n} (falta la tabla ${m.tabla})`)
}
if (faltan.length) {
  console.log('No lanzo la comprobación: faltan migraciones por aplicar en Supabase (SQL Editor, en este orden):')
  for (const f of faltan) console.log(`  · ${f}`)
  console.log('Orden: 0020 → 0021 → 0022 → 0023 → 0024 → 0025 → 0026 (y 0017/0018 si no están).')
  process.exit(2)
}
ok('las migraciones 0020 a 0026 están aplicadas')

/* ── 2 · El flujo, con dos personas de prueba ── */
const creados = { usuarios: [], viaje: null, archivos: [] }
const persona = async (nombre) => {
  const cliente = nuevoCliente()
  const { data, error } = await cliente.auth.signInAnonymously()
  if (error || !data?.user) throw new Error(`no se pudo crear a ${nombre}: ${texto(error)}`)
  creados.usuarios.push(data.user.id)
  await cliente.from('travelers').upsert({ id: data.user.id, is_anonymous: true }, { onConflict: 'id', ignoreDuplicates: true })
  return { cliente, id: data.user.id, token: data.session?.access_token }
}

try {
  const eric = await persona('la dueña')
  const laura = await persona('la invitada')

  // Guardar un viaje
  const ruta = { id: 'prueba', answers: { destination: { name: 'Roma' } }, days: [] }
  const { data: viaje, error: eViaje } = await eric.cliente.from('trips').insert({ traveler_id: eric.id, route: ruta }).select('id').single()
  comprobar(!eViaje && viaje?.id, 'guardar un viaje con la cuenta', texto(eViaje))
  if (viaje?.id) creados.viaje = viaje.id

  // Subir la foto de perfil
  const rutaFoto = `${eric.id}/prueba.jpg`
  const jpg = new Uint8Array([0xff, 0xd8, 0xff, 0xd9])
  const subida = await eric.cliente.storage.from('perfiles').upload(rutaFoto, jpg, { contentType: 'image/jpeg', upsert: true })
  comprobar(!subida.error, 'subir la foto de perfil', texto(subida.error))
  if (!subida.error) creados.archivos.push(rutaFoto)

  // Invitar y entrar como invitada
  const { data: inv, error: eInv } = await eric.cliente.rpc('crear_invitacion', { p_trip: creados.viaje, p_pass: null, p_usos: 1 })
  const codigo = inv?.codigo
  comprobar(!eInv && codigo, 'crear el código de invitación', texto(eInv))
  if (codigo) {
    const { data: vista } = await laura.cliente.rpc('ver_invitacion', { p_codigo: codigo })
    comprobar(vista?.valida === true, 'ver la invitación antes de entrar', JSON.stringify(vista))
    const { data: unida, error: eUnir } = await laura.cliente.rpc('canjear_invitacion', { p_codigo: codigo })
    comprobar(!eUnir && unida?.ok !== false, 'entrar al viaje con el código', texto(eUnir) || JSON.stringify(unida))
  }

  // Recomendar y aceptar
  const { data: rec, error: eRec } = await laura.cliente.from('trip_recommendations').insert({ trip_id: creados.viaje, tipo: 'cambio', payload: { prueba: true } }).select('id').single()
  comprobar(!eRec && rec?.id, 'la invitada recomienda un cambio', texto(eRec))
  if (rec?.id) {
    const { error: eAc } = await eric.cliente.from('trip_recommendations').update({ estado: 'aceptada', decidida_por: eric.id, decidida_en: new Date().toISOString() }).eq('id', rec.id)
    comprobar(!eAc, 'la dueña acepta la recomendación', texto(eAc))
  }

  // El aviso (lo ponen los disparadores solos)
  const { data: avisos, error: eAv } = await admin.rpc('avisos_de', { p_uid: eric.id })
  comprobar(!eAv && Array.isArray(avisos) && avisos.length >= 1, 'a la dueña le llega un aviso de la recomendación', texto(eAv) || `avisos: ${Array.isArray(avisos) ? avisos.length : '?'}`)

  // El pago de prueba (hace falta la API arrancada con PASES_COBRO_ACTIVO y PAGO_DE_MENTIRA, o las claves de Stripe en modo pruebas)
  if (sinPago) {
    resultados.push('  – pago de prueba: saltado (--sin-pago)')
  } else {
    try {
      const cfg = await fetch(`${API}/api/pase/config`).then((r) => r.json())
      if (!cfg?.cobro) {
        resultados.push('  – pago de prueba: el cobro está apagado en la API (PASES_COBRO_ACTIVO + STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET). Enciéndelo con Stripe en modo pruebas y vuelve a lanzar.')
      } else {
        // El pago pide una cuenta de verdad (no anónima): se crea una de usar y tirar, con correo ya confirmado.
        const correo = `prueba-${Date.now()}@example.com`
        const clave = `P-${Math.random().toString(36).slice(2)}-${Date.now()}`
        const { data: nueva, error: eNueva } = await admin.auth.admin.createUser({ email: correo, password: clave, email_confirm: true })
        if (eNueva || !nueva?.user) throw new Error(`no se pudo crear la cuenta de prueba del pago: ${texto(eNueva)}`)
        creados.usuarios.push(nueva.user.id)
        const entrada = nuevoCliente()
        const { data: sesionComprador, error: eEntra } = await entrada.auth.signInWithPassword({ email: correo, password: clave })
        if (eEntra) throw new Error(`la cuenta de prueba no entra: ${texto(eEntra)}`)
        const r = await fetch(`${API}/api/pago/crear`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${sesionComprador.session.access_token}` }, body: JSON.stringify({ plan: 'uno', destino: (cfg.destinos ?? ['Roma'])[0] }) })
        const j = await r.json().catch(() => ({}))
        comprobar(r.ok && j.url, 'empezar un pago de prueba (el precio lo pone el servidor)', j.error ?? `HTTP ${r.status}`)
        resultados.push('  – para cerrar el pago: abre la URL que da la API con la tarjeta de pruebas 4242 4242 4242 4242, y en Stripe → Webhooks → «Enviar evento de prueba» comprueba que el aviso llega con la firma buena.')
      }
    } catch (e) {
      mal('hablar con la API para el pago de prueba', `${API}: ${texto(e)}`)
    }
  }

  // Borrar la cuenta de la dueña por la API: no deben quedar restos (viaje, foto)
  try {
    const r = await fetch(`${API}/api/cuenta`, { method: 'DELETE', headers: { authorization: `Bearer ${eric.token}` } })
    comprobar(r.ok, 'borrar la cuenta desde la API', `HTTP ${r.status}`)
    if (r.ok) {
      creados.usuarios = creados.usuarios.filter((u) => u !== eric.id)
      const { data: restoViaje } = await admin.from('trips').select('id').eq('id', creados.viaje)
      comprobar((restoViaje ?? []).length === 0, 'no queda el viaje de la cuenta borrada')
      const { data: restoFoto } = await admin.storage.from('perfiles').list(eric.id)
      comprobar((restoFoto ?? []).length === 0, 'no queda la foto de perfil de la cuenta borrada')
      creados.viaje = null
      creados.archivos = []
    }
  } catch (e) {
    mal('hablar con la API para borrar la cuenta', `${API}: ${texto(e)}`)
  }
} catch (e) {
  mal('la comprobación se ha parado', texto(e))
} finally {
  // Limpiar todo lo que quede, pase lo que pase
  try {
    if (creados.archivos.length) await admin.storage.from('perfiles').remove(creados.archivos)
    if (creados.viaje) await admin.from('trips').delete().eq('id', creados.viaje)
    for (const u of creados.usuarios) await admin.auth.admin.deleteUser(u)
  } catch (e) {
    resultados.push(`  ! no he podido limpiar todo (${texto(e)}). Borra a mano los usuarios anónimos creados hoy en Authentication → Users.`)
  }
}

console.log('\nComprobación de las cuentas contra Supabase\n' + resultados.join('\n'))
console.log(fallos === 0 ? '\nTodo bien: ya está.' : `\n${fallos} fallo(s).`)
process.exit(fallos === 0 ? 0 : 1)
