// Tanda 10S3 (B) · USA EL SUPABASE REAL (correr SOLA). Apartados 3 y 8: «Ha cambiado el viaje» en un viaje recién creado, y las fotos del acordeón de DÍAS.
//   node scripts/destino/pruebaTanda10S3_B_real.mjs
// Cuenta fija de prueba: la «admin» de docs/dias/_cuentas_prueba_10n10.json (nunca la de Eric). Solo toca los viajes que ELLA crea en esta pasada (los borra al acabar).
// Qué se comprueba, con la app de verdad (cuentas encendidas) y la nube de verdad:
//   1. Un viaje nuevo: la app lo guarda por primera vez (insert) y su aviso de Realtime NO se toma por un cambio de otra persona (`useViajeEnDirecto.version` sigue en 0, ninguna línea «Han cambiado el viaje»).
//   2. El remate de la generación (`saveGenerationCheckpoint` con la fase «done», la ruta SIN fotos ni horarios del servidor) tampoco: el guardado propio se reconoce, la ruta viva NO se pisa y conserva sus fotos.
//   3. Las fotos del acordeón de DÍAS: cada parada que tiene foto propia o de internet sale con su foto (no con la banda de color).
// Causa (en palabras sencillas): la app apuntaba «esto lo guardé yo» solo en los guardados normales; el primer guardado de un viaje nuevo y los guardados de la generación no se apuntaban. Su eco por Realtime parecía
// un cambio de otra persona: salía «Han cambiado el viaje» y la ruta viva se sustituía por la copia de la nube del remate, que no lleva fotos (por eso el acordeón sin fotos, salvo el Desayuno romano).
// No imprime claves, contraseñas ni tokens.
import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import { abrirApp } from './_enLaApp.mjs'

const env = { ...process.env }
try {
  for (const l of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(l)
    if (m && env[m[1]] === undefined) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
} catch {
  /* sin .env.local */
}
const { VITE_SUPABASE_URL: URL_, VITE_SUPABASE_ANON_KEY: ANON, SUPABASE_SERVICE_ROLE_KEY: SERVICIO } = env
if (!URL_ || !ANON || !SERVICIO) {
  console.log('SALTADA: faltan las claves de Supabase (.env.local). No se ha tocado nada.')
  process.exit(0)
}
let cuenta
try {
  cuenta = JSON.parse(fs.readFileSync('docs/dias/_cuentas_prueba_10n10.json', 'utf8')).admin
} catch {
  console.log('SALTADA: falta docs/dias/_cuentas_prueba_10n10.json (se crea con pruebaTanda10N10_avisos_real.mjs). No se ha tocado nada.')
  process.exit(0)
}
const limpio = (m) => String(m ?? '').replace(/eyJ[\w.-]+/g, '[clave]').replace(/access_token=[^&\s]*/g, 'access_token=<…>')
const fallos = []
let comprobaciones = 0
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) fallos.push({ regla, texto })
  console.log(`  ${cond ? 'ok ' : 'MAL'} ${texto}`)
}
const BASE = process.env.APP_URL || 'http://localhost:5173'
const opc = { auth: { persistSession: false, autoRefreshToken: false } }
const admin = createClient(URL_, SERVICIO, opc)
let app = null
let antes = new Set()

async function limpiar() {
  try {
    app?.cerrar()
  } catch {
    /* ya cerrado */
  }
  try {
    const { data } = await admin.from('trips').select('id').eq('traveler_id', cuenta.id)
    for (const f of data ?? []) if (!antes.has(f.id)) await admin.from('trips').delete().eq('id', f.id)
  } catch {
    /* sin viajes */
  }
}

try {
  const c = createClient(URL_, ANON, opc)
  const { data: dentro, error: errorEntrar } = await c.auth.signInWithPassword({ email: cuenta.email, password: cuenta.password })
  if (errorEntrar || !dentro.session) throw new Error('La cuenta fija no puede entrar: ' + limpio(errorEntrar?.message ?? 'sin sesión'))
  await admin.from('travelers').upsert({ id: cuenta.id, nombre: cuenta.nombre, is_anonymous: false }, { onConflict: 'id' })
  antes = new Set(((await admin.from('trips').select('id').eq('traveler_id', cuenta.id)).data ?? []).map((f) => f.id))
  const claveSesion = `sb-${new URL(URL_).hostname.split('.')[0]}-auth-token`
  const sembrar = `try{if(!localStorage.getItem(${JSON.stringify(claveSesion)}))localStorage.setItem(${JSON.stringify(claveSesion)},${JSON.stringify(JSON.stringify(dentro.session))})}catch(e){}`
  // Se apuntan las líneas que salen en la franja de arriba («Han cambiado el viaje»): se engancha en cuanto existe el almacén.
  const gancho = `window.__franjas=[];(function(){var i=setInterval(function(){import('/src/store/useFranjaStore.ts').then(function(m){clearInterval(i);m.useFranjaStore.subscribe(function(s){if(s.franja)window.__franjas.push(s.franja.items.map(function(x){return x.titulo}).join(' + '))})}).catch(function(){})},300)})()`
  app = await abrirApp(BASE, { ruta: '/?cuentas=on&apertura=0', antes: sembrar + ';' + gancho })
  await app.esp(3000)

  console.log('1. Un viaje nuevo, guardado por primera vez')
  await app.evaluar('window.__rutaPrueba().then(() => true)')
  let fila = null
  for (let i = 0; i < 40 && !fila; i++) {
    await app.esp(1500)
    const { data } = await admin.from('trips').select('id').eq('traveler_id', cuenta.id)
    fila = (data ?? []).find((f) => !antes.has(f.id)) ?? null
  }
  debe(Boolean(fila), 'nube', 'la app guarda el viaje nuevo de la cuenta en la nube')
  await app.esp(9000) // Realtime (600 ms) + la espera del aviso (3 s) + margen
  const lineas1 = await app.evaluar('window.__franjas||[]')
  const version1 = await app.evaluar("import('/src/lib/viajeEnDirecto.ts').then(m => m.useViajeEnDirecto.getState().version)")
  debe(version1 === 0, 'propio', `el primer guardado del viaje nuevo NO se toma por un cambio de otra persona (cambios de otro vistos: ${version1})`)
  debe(!lineas1.some((t) => /cambiado el viaje|Ha cambiado|Han cambiado/i.test(t)), 'linea', `y no sale «Han cambiado el viaje» (líneas: ${JSON.stringify(lineas1)})`)

  console.log('2. El remate de la generación (guardado propio, sin fotos)')
  const paradasConFoto = () =>
    app.evaluar(`(() => { const r = window.__ruta.getState().route; const ps = r.days.flatMap(d => d.stops.filter(s => !s.isBreak && !s.isArrival && !s.passThrough)); return { total: ps.length, con: ps.filter(s => s.photoUrl).length } })()`)
  const f0 = await paradasConFoto()
  debe(f0.total > 5 && f0.con >= f0.total * 0.8, 'fotos', `el viaje nuevo tiene sus fotos (${f0.con} de ${f0.total} paradas)`)
  const guardado = await app.evaluar(`(async () => {
    const [orq, pers, sync, ruta] = await Promise.all([import('/src/lib/routeGenerationOrchestrator.ts'), import('/src/lib/tripPersistence.ts'), import('/src/store/useSyncStore.ts'), import('/src/store/useRouteStore.ts')])
    const r = ruta.useRouteStore.getState().route
    const params = { destination: 'Roma', answers: r.answers, transportContext: ruta.useRouteStore.getState().transportContext ?? r.transportContext, mustIncludePlaces: [] }
    let final = null
    await orq.runGeneration(params, null, async (cp) => { if (cp.phase === 'done') final = cp })
    if (!final) return 'sin-generacion'
    const s = sync.useSyncStore.getState()
    await pers.saveGenerationCheckpoint(s.travelerId, s.activeTripId, final)
    return 'ok'
  })()`)
  debe(guardado === 'ok', 'remate', `se guarda en la nube el remate de la generación como lo hace la app (${guardado})`)
  const { data: enNube } = await admin.from('trips').select('route').eq('id', fila.id).single()
  const sinFotoEnNube = (enNube?.route?.days ?? []).flatMap((d) => d.stops ?? []).filter((s) => !s.isBreak && !s.isArrival).every((s) => !s.photoUrl)
  debe(sinFotoEnNube, 'remate', 'la copia de la nube del remate NO lleva fotos (es lo que antes pisaba la ruta viva)')
  await app.esp(9000)
  const lineas2 = await app.evaluar('window.__franjas||[]')
  const version2 = await app.evaluar("import('/src/lib/viajeEnDirecto.ts').then(m => m.useViajeEnDirecto.getState().version)")
  debe(version2 === 0, 'propio', `el guardado del remate tampoco se toma por un cambio de otra persona (cambios de otro vistos: ${version2})`)
  debe(!lineas2.some((t) => /cambiado el viaje|Ha cambiado|Han cambiado/i.test(t)), 'linea', `y sigue sin salir «Han cambiado el viaje» (líneas: ${JSON.stringify(lineas2)})`)
  const f1 = await paradasConFoto()
  debe(f1.con >= f0.con, 'fotos', `la ruta viva conserva sus fotos tras el remate (${f1.con} de ${f1.total}; antes ${f0.con})`)

  console.log('3. Las fotos del acordeón de DÍAS')
  await app.evaluar('(window.__ruta.getState().setMode("days"), true)')
  await app.esp(2500)
  const dia1 = await app.evaluar('window.__ruta.getState().route.days[0].id')
  await app.evaluar(`(window.__ruta.getState().setActiveDayId(${JSON.stringify(dia1)}), true)`)
  await app.esp(3000)
  const imgs = await app.evaluar(`Array.from(document.querySelectorAll('img')).filter(i => i.naturalWidth > 0 && /\\/fotos\\/|images\\.unsplash|upload\\.wikimedia/.test(i.src)).length`)
  debe(imgs >= 5, 'fotos', `el acordeón del día 1 pinta las fotos de sus paradas (${imgs} fotos a la vista)`)
} catch (e) {
  debe(false, 'prueba', `la prueba ha fallado: ${limpio(e?.message ?? e).slice(0, 300)}`)
} finally {
  await limpiar()
}

console.log(`\n${comprobaciones} comprobaciones, ${fallos.length} fallos`)
for (const f of fallos) console.log(`  ✗ [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
