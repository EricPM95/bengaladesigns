// Reproduce con el Supabase REAL y una cuenta de prueba fija (la «Viajes» de docs/dias/_cuentas_prueba_10n10.json, fuera de git) la VUELTA DE GOOGLE: la dirección vuelve con `#access_token=…`
// (el flujo implícito de Supabase), la app recibe la sesión y NO debe salir «Algo ha ido mal». Dos casos: (A) un navegador limpio (incógnito) y (B) uno que ya tenía una sesión anónima guardada
// (lo que pasa cuando alguien crea un viaje sin cuenta y luego toca «Entrar con Google»: `completarEntrada` pasa lo de la anónima a la cuenta con `/api/cuenta/reclamar`).
// NO imprime claves, contraseñas, tokens ni la dirección con llaves. Usa el Supabase real: CORRER SOLA.
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/_10s2_repro.mjs
import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import { abrirApp } from './_enLaApp.mjs'

const env = {}
for (const l of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(l)
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}
const URL_ = env.VITE_SUPABASE_URL
const ANON = env.VITE_SUPABASE_ANON_KEY
if (!URL_ || !ANON) {
  console.log('SALTADA: faltan las claves de Supabase (.env.local).')
  process.exit(0)
}
const cuentas = JSON.parse(fs.readFileSync('docs/dias/_cuentas_prueba_10n10.json', 'utf8'))
const BASE = process.env.APP_URL || 'http://localhost:5173'
const ganchos = `window.__errs=[];(function(){var o=console.error;console.error=function(){try{window.__errs.push(Array.prototype.slice.call(arguments).map(function(x){return (x&&x.stack)?String(x.stack).slice(0,1500):String(x).slice(0,1500)}).join(' | '))}catch(e){};return o.apply(console,arguments)};window.addEventListener('error',function(e){window.__errs.push('window.error: '+e.message)});window.addEventListener('unhandledrejection',function(e){window.__errs.push('rejection: '+(e.reason&&e.reason.message||e.reason))})})()`

async function sesionNueva() {
  const c = createClient(URL_, ANON, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data, error } = await c.auth.signInWithPassword({ email: cuentas.invitado.email, password: cuentas.invitado.password })
  if (error || !data.session) throw new Error('No se pudo entrar con la cuenta de prueba: ' + (error?.message ?? 'sin sesión'))
  return data.session
}
// La dirección de vuelta de Google (implícito): se arma en memoria, NUNCA se imprime.
const direccionDeVuelta = (s) => `${BASE}/?cuentas=on&apertura=0&r=${Date.now()}#access_token=${s.access_token}&expires_at=${s.expires_at}&expires_in=${s.expires_in}&provider_token=x&refresh_token=${s.refresh_token}&token_type=bearer`

async function caso(nombre, conAnonimaAntes) {
  const app = await abrirApp(BASE, { ruta: '/?cuentas=on&apertura=0', antes: ganchos })
  const ver = async (etiqueta) => {
    const texto = await app.evaluar('document.body.innerText').catch(() => '')
    const mal = /Algo ha ido mal/.test(texto)
    const errs = await app.evaluar('window.__errs || []').catch(() => [])
    console.log(`[${nombre} · ${etiqueta}] ${mal ? 'ALGO HA IDO MAL' : 'bien'} · errores en consola: ${errs.length}`)
    for (const e of errs.slice(0, 4)) console.log('   ' + String(e).replace(/access_token=[^&\s]*/g, 'access_token=<…>').replace(/refresh_token=[^&\s]*/g, 'refresh_token=<…>').replace(/\s+/g, ' ').slice(0, 700))
    return mal
  }
  await app.esp(3500)
  if (conAnonimaAntes) {
    // La app da de alta una anónima sola al abrir con cuentas encendidas; se guarda como hace `entrarConGoogle`.
    await app.evaluar("(() => { const k = Object.keys(localStorage).find((x) => /^sb-.*-auth-token$/.test(x)); if (!k) return false; try { const s = JSON.parse(localStorage.getItem(k)); if (s?.user?.is_anonymous) localStorage.setItem('trazo:cuenta:anonima', JSON.stringify({ uid: s.user.id, refreshToken: s.refresh_token })); } catch (e) {} return true })()")
    await ver('con la anónima')
  }
  const s = await sesionNueva()
  await app.evaluar(`location.href = ${JSON.stringify(direccionDeVuelta(s))}`)
  await app.esp(2500)
  for (let i = 0; i < 6; i++) {
    await app.esp(2500)
    if (await ver(`vuelta de Google ${i + 1}`)) break
  }
  const url = await app.evaluar('location.pathname + location.search + (location.hash ? "#<hash>" : "")').catch(() => '')
  console.log(`[${nombre}] dirección al final: ${url}`)
  app.cerrar()
}
await caso('A (navegador limpio)', false)
await caso('B (con sesión anónima antes)', true)
