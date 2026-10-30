// Tanda 10S2 · USA EL SUPABASE REAL (correr SOLA, al final de la batería). El fallo «Algo ha ido mal» de Eric: al entrar (o al volver de «Entrar con Google») la app baja de la nube un viaje con las reservas
// VACÍAS (`bookings = {}`, `ui_state = {}`) y tumbaba la app entera. Aquí, con el Supabase de verdad:
//   1. una CUENTA NUEVA (se crea para la prueba y se borra al acabar) entra, crea su viaje (la ruta rápida de desarrollo, la misma que usan las demás pruebas) y la app lo guarda en la nube;
//   2. se recarga: el viaje baja de la nube y se ve, sin «Algo ha ido mal»;
//   3. se dejan en la nube las reservas y el estado VACÍOS (`{}`), como el viaje de Eric: se recarga y sigue sin «Algo ha ido mal» y con el viaje a la vista;
//   4. la VUELTA DE GOOGLE (la dirección con `#access_token=…`, el flujo implícito, con la sesión de esa cuenta) tampoco la tumba, y la dirección se limpia.
// Límite: no recorre los 7 pasos del formulario con clics (usa la ruta rápida de desarrollo para crear el viaje); el formulario, sin cuentas, lo cubren otras pruebas.
// No imprime claves, contraseñas, tokens ni la dirección con llaves. Usa la clave de servicio de .env.local para crear y borrar SU cuenta de prueba (nunca toca otra).
import fs from 'node:fs'
import crypto from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import { abrirApp } from './_enLaApp.mjs'

const fallos = []
let comprobaciones = 0
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) fallos.push({ regla, texto })
  console.log(`  ${cond ? 'ok ' : '✗  '} ${texto}`)
}
const env = {}
try {
  for (const l of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(l)
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
} catch {
  /* sin .env.local */
}
const URL_ = env.VITE_SUPABASE_URL
const ANON = env.VITE_SUPABASE_ANON_KEY
const SERVICIO = env.SUPABASE_SERVICE_ROLE_KEY
if (!URL_ || !ANON || !SERVICIO) {
  console.log('SALTADA: faltan las claves de Supabase (.env.local). No se ha tocado nada.')
  process.exit(0)
}
const BASE = process.env.APP_URL || 'http://localhost:5173'
const admin = createClient(URL_, SERVICIO, { auth: { persistSession: false, autoRefreshToken: false } })
const ganchos = `window.__errs=[];(function(){var o=console.error;console.error=function(){try{window.__errs.push(Array.prototype.slice.call(arguments).map(function(x){return (x&&x.stack)?String(x.stack).slice(0,800):String(x).slice(0,800)}).join(' | '))}catch(e){};return o.apply(console,arguments)};window.addEventListener('error',function(e){window.__errs.push('window.error: '+e.message)})})()`

const correo = `prueba-10s2-${crypto.randomBytes(5).toString('hex')}@example.com`
const clave = crypto.randomBytes(18).toString('base64url')
let usuario = null
let app = null

async function limpiar() {
  try {
    app?.cerrar()
  } catch {
    /* ya cerrado */
  }
  if (!usuario) return
  try {
    await admin.from('trips').delete().eq('traveler_id', usuario.id)
    await admin.from('travelers').delete().eq('id', usuario.id)
  } catch {
    /* puede no existir */
  }
  try {
    await admin.auth.admin.deleteUser(usuario.id)
  } catch {
    /* ya borrada */
  }
}
process.on('exit', () => undefined)

try {
  console.log('1. Una cuenta nueva entra y crea su viaje')
  const creada = await admin.auth.admin.createUser({ email: correo, password: clave, email_confirm: true })
  if (creada.error || !creada.data.user) throw new Error('No se pudo crear la cuenta de prueba: ' + (creada.error?.message ?? 'sin usuario'))
  usuario = creada.data.user
  const c = createClient(URL_, ANON, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data: dentro, error: errorEntrar } = await c.auth.signInWithPassword({ email: correo, password: clave })
  if (errorEntrar || !dentro.session) throw new Error('La cuenta nueva no puede entrar: ' + (errorEntrar?.message ?? 'sin sesión'))
  const s = dentro.session
  const claveSesion = `sb-${new URL(URL_).hostname.split('.')[0]}-auth-token`
  const sembrar = `try{if(!localStorage.getItem(${JSON.stringify(claveSesion)}))localStorage.setItem(${JSON.stringify(claveSesion)},${JSON.stringify(JSON.stringify(s))})}catch(e){}`
  app = await abrirApp(BASE, { ruta: '/?cuentas=on&apertura=0', antes: sembrar + ';' + ganchos })
  const mal = async () => /Algo ha ido mal/.test(await app.evaluar('document.body.innerText').catch(() => ''))
  const errores = async () => (await app.evaluar('window.__errs||[]').catch(() => [])).filter((e) => !/Warning:|Failed to load resource|favicon/i.test(String(e)))
  // Abrir el viaje bajado de la nube: lo mismo que hace la app al elegirlo sola al entrar o al tocarlo en «Mis viajes» (`abrirViajeGuardado`).
  const abrirViaje = () =>
    app.evaluar(
      "(async () => { const s = await import('/src/store/useSyncStore.ts'); const a = await import('/src/lib/abrirViaje.ts'); const v = s.useSyncStore.getState().savedTrips?.[0]; if (!v) return 'sin-viaje'; try { a.abrirViajeGuardado(v.id); return 'ok' } catch (e) { return 'error: ' + e.message } })()",
    )
  await app.esp(3000)
  debe(!(await mal()), 'entrar', 'con la cuenta nueva, al abrir la app no sale «Algo ha ido mal»')
  await app.evaluar('window.__rutaPrueba().then(() => true)')
  await app.esp(2500)
  debe(!(await mal()), 'viaje', 'crear el viaje (la ruta rápida) no da «Algo ha ido mal»')
  const dias = await app.evaluar("window.__ruta?.getState().route?.days?.length ?? 0")
  debe(dias > 0, 'viaje', `el viaje tiene ruta con días (${dias})`)
  // La app lo guarda sola en la nube: se espera a que aparezca la fila.
  let fila = null
  for (let i = 0; i < 40 && !fila; i++) {
    await app.esp(1500)
    const { data } = await admin.from('trips').select('id, bookings, ui_state').eq('traveler_id', usuario.id).limit(1)
    fila = data?.[0] ?? null
  }
  debe(Boolean(fila), 'nube', 'la app guarda el viaje de la cuenta nueva en la nube')

  console.log('2. Se recarga: el viaje baja de la nube')
  await app.evaluar(`location.href = ${JSON.stringify(`${BASE}/?cuentas=on&apertura=0&r=${Date.now()}`)}`)
  await app.esp(6000)
  const r1 = await abrirViaje()
  await app.esp(2500)
  debe(r1 === 'ok', 'recarga', `el viaje bajado de la nube se abre (${r1})`)
  debe(!(await mal()), 'recarga', 'tras recargar y abrir el viaje bajado de la nube, no sale «Algo ha ido mal»')
  const hay1 = await app.evaluar("Boolean(window.__ruta?.getState().route?.days?.length)")
  debe(hay1, 'recarga', 'y el viaje está a la vista')

  console.log('3. El viaje con las reservas y el estado VACÍOS (como el de Eric)')
  const { error: errorVaciar } = await admin.from('trips').update({ bookings: {}, ui_state: {} }).eq('traveler_id', usuario.id)
  debe(!errorVaciar, 'nube', 'se dejan en la nube las reservas y el estado en `{}`')
  await app.evaluar(`location.href = ${JSON.stringify(`${BASE}/?cuentas=on&apertura=0&r=${Date.now()}`)}`)
  await app.esp(6000)
  const r2 = await abrirViaje()
  await app.esp(2500)
  debe(r2 === 'ok', 'vacio', `el viaje con \`bookings = {}\` se abre sin lanzar ningún error (${r2})`)
  debe(!(await mal()), 'vacio', 'con `bookings = {}` y `ui_state = {}` en la nube, al abrirlo NO sale «Algo ha ido mal»')
  const hay2 = await app.evaluar("Boolean(window.__ruta?.getState().route?.days?.length)")
  debe(hay2, 'vacio', 'y el viaje está a la vista')
  for (const modo of ['days', 'reservations', 'today', 'budget']) {
    await app.evaluar(`(window.__ruta.getState().setMode(${JSON.stringify(modo)}), true)`).catch(() => undefined)
    await app.esp(1500)
    debe(!(await mal()), 'vacio', `y en la pestaña «${modo}» tampoco`)
  }

  console.log('4. La vuelta de Google (#access_token)')
  await app.evaluar("(() => { for (const k of Object.keys(localStorage)) if (k.startsWith('sb-')) localStorage.removeItem(k); return true })()")
  const vuelta = `${BASE}/?cuentas=on&apertura=0&r=${Date.now()}#access_token=${s.access_token}&expires_at=${s.expires_at}&expires_in=${s.expires_in}&provider_token=x&refresh_token=${s.refresh_token}&token_type=bearer`
  await app.evaluar(`location.href = ${JSON.stringify(vuelta)}`)
  await app.esp(7000)
  debe(!(await mal()), 'google', 'al volver con `#access_token=…` no sale «Algo ha ido mal»')
  const direccion = await app.evaluar('location.pathname + location.search + location.hash')
  debe(!/access_token|refresh_token/.test(direccion), 'google', 'y la dirección se queda sin las llaves')
  const errs = await errores()
  debe(errs.length === 0, 'consola', `y sin errores en la consola (${errs.length}${errs.length ? ': ' + String(errs[0]).replace(/\s+/g, ' ').slice(0, 200) : ''})`)
} catch (e) {
  debe(false, 'prueba', `la prueba ha fallado: ${String(e?.message ?? e).replace(/access_token=[^&\s]*/g, 'access_token=<…>').slice(0, 300)}`)
} finally {
  await limpiar()
}

console.log(`\n${comprobaciones} comprobaciones, ${fallos.length} fallos`)
for (const f of fallos) console.log(`  ✗ [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
