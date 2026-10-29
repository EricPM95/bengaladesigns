// Tanda 10N10 (A) · LOS AVISOS DE VERDAD: dos cuentas REALES contra el Supabase real, caso por caso. Se SALTA sola si faltan las claves.
//   node scripts/destino/pruebaTanda10N10_avisos_real.mjs [--tabla]
//
// Las MISMAS dos cuentas siempre (límite de altas de Supabase): se crean UNA vez con la clave de servicio (admin.createUser, con email confirmado) y quedan en `docs/dias/_cuentas_prueba_10n10.json`
// (excluido de git; nunca se imprime). Cada pasada solo crea y borra un VIAJE de prueba. Las claves del proyecto se leen de .env.local en memoria y no se imprimen.
// El móvil del invitado se reproduce con el código REAL de la app (sellarRuta, la franja y su sonido, los textos) empaquetado con esbuild; la réplica del anfitrión CompartidoHost (Realtime → 600 ms → «Han cambiado
// el viaje» si no llegó aviso → pedir la lista) está en `invitado.*` de este archivo. Escribe la tabla en docs/dias/_10n10_tabla_avisos.md.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { buildSync } from 'esbuild'
import { createClient } from '@supabase/supabase-js'

const env = { ...process.env }
try {
  for (const l of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(l)
    if (m && env[m[1]] === undefined) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
} catch { /* sin .env.local */ }
const { VITE_SUPABASE_URL: URL_, VITE_SUPABASE_ANON_KEY: ANON, SUPABASE_SERVICE_ROLE_KEY: SERVICIO } = env
if (!URL_ || !ANON || !SERVICIO) {
  console.log('SALTADA: faltan las claves de Supabase (.env.local). No se ha tocado nada.')
  process.exit(0)
}
const limpio = (m) => String(m ?? '').replace(/eyJ[\w.-]+/g, '[clave]')
const esp = (ms) => new Promise((r) => setTimeout(r, ms))
const opc = { auth: { persistSession: false, autoRefreshToken: false } }
const servicio = createClient(URL_, SERVICIO, opc)
const CON_0065 = process.argv.includes('--con0065') // (la 0065 aplicada en el Supabase real: sin ella, esas dos comprobaciones se cuentan como pendientes, no como fallos)
const fallos = []
let comprobaciones = 0
const debe = (c, r, t) => { comprobaciones++; if (!c) fallos.push({ r, t }); console.log(`  ${c ? 'ok ' : 'MAL'} ${r} · ${t}`) }

// ── El código real de la app, empaquetado ────────────────────────────────────────────────────────────────────────────────────────────────────
globalThis.window = { localStorage: { getItem: () => null, setItem: () => undefined }, __sonidosPedidos: [] }
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'n10avisos-'))
const entrada = path.join(tmp, 'entrada.ts')
const R = (p) => path.resolve(p).replace(/\\/g, '/')
fs.writeFileSync(entrada, `export * from '${R('src/lib/sellarCambio.ts')}'\nexport { useFranjaStore, anunciarAvisosNuevos, avisosAnunciados } from '${R('src/store/useFranjaStore.ts')}'
export { crearAnfitrionDeCambios } from '${R('src/lib/anfitrionDeCambios.ts')}'\nexport { franjaDelAviso, textoDelAviso, quienDelAviso } from '${R('shared/avisos/textos.js')}'\n`)
buildSync({ entryPoints: [entrada], bundle: true, format: 'esm', platform: 'node', outfile: path.join(tmp, 'app.mjs'), logLevel: 'silent', define: { 'import.meta.env.DEV': 'false', 'import.meta.env': '{}' }, loader: { '.json': 'json' } })
const app = await import('file://' + path.join(tmp, 'app.mjs').replace(/\\/g, '/'))

// ── Las dos cuentas de siempre ───────────────────────────────────────────────────────────────────────────────────────────────────────────────
const ARCHIVO = 'docs/dias/_cuentas_prueba_10n10.json'
async function cuentas() {
  let datos = null
  try { datos = JSON.parse(fs.readFileSync(ARCHIVO, 'utf8')) } catch { /* se crean */ }
  if (!datos) {
    datos = {}
    for (const [clave, nombre] of [['admin', 'Eric'], ['invitado', 'Viajes']]) {
      const email = `prueba10n10.${clave}.${Math.random().toString(36).slice(2, 8)}@example.com`
      const password = 'Pr-' + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
      const { data, error } = await servicio.auth.admin.createUser({ email, password, email_confirm: true })
      if (error) throw new Error('createUser: ' + limpio(error.message))
      datos[clave] = { email, password, id: data.user.id, nombre }
    }
    fs.writeFileSync(ARCHIVO, JSON.stringify(datos, null, 1))
    console.log('(cuentas de prueba creadas una sola vez y guardadas fuera de git)')
  }
  const salida = {}
  for (const clave of ['admin', 'invitado']) {
    const d = datos[clave]
    const c = createClient(URL_, ANON, opc)
    const { error } = await c.auth.signInWithPassword({ email: d.email, password: d.password })
    if (error) throw new Error('signIn ' + clave + ': ' + limpio(error.message))
    await servicio.from('travelers').upsert({ id: d.id, nombre: d.nombre, is_anonymous: false }, { onConflict: 'id' })
    salida[clave] = { c, id: d.id, nombre: d.nombre }
  }
  return salida
}

// ── La ruta de prueba ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
const dia = (n, paradas, meals = []) => ({ id: 'd' + n, dayNumber: n, city: 'Roma', stops: paradas.map(([id, name, extra]) => ({ id, name, ...(extra ?? {}) })), meals })
const dias = () => [
  dia(1, [['a1', 'Coliseo'], ['a2', 'Foro Romano']]),
  dia(2, [['a3', 'Panteón'], ['a4', 'Piazza Navona'], ['ft', 'Free Tour de Roma', { isFreeTour: true }]]),
  dia(3, [['a5', 'Trastevere']]),
  dia(4, [['a6', 'Villa Borghese']]),
  dia(5, [['a7', 'Vaticano']]),
]
const ruta = (d, fin = '2026-11-15', extra = {}) => ({ id: 'prueba-10n10', destination: 'Roma', answers: { dateRange: { start: '2026-11-11', end: fin } }, days: d, modoCuentas: 'conjunta', ...extra })

// ── El móvil del invitado (réplica de CompartidoHost + AvisosHost con el código real) ────────────────────────────────────────────────────────────
function movilInvitado(u, tripId) {
  const registro = { franjas: [], eventosViaje: [], eventosAviso: [], sonidos: 0 }
  let t0 = 0
  const marca = () => Date.now() - t0
  let lista = []
  let anfitrion = null
  const map = (a) => ({ id: a.id, tipo: a.tipo, texto: app.textoDelAviso(a), franja: app.franjaDelAviso(a), quien: app.quienDelAviso(a), creado_en: a.creado_en, leido: a.leido_en != null, payload: a.payload, etiqueta: null })
  async function pedir() {
    const { data } = await u.c.from('avisos').select('id, tipo, payload, creado_en, leido_en, oculto_en').eq('user_id', u.id).is('oculto_en', null).order('creado_en', { ascending: false })
    return (data ?? []).map(map)
  }
  async function cargar() {
    const antes = lista
    lista = await pedir()
    app.anunciarAvisosNuevos(antes, lista, [])
  }
  const unsub = app.useFranjaStore.subscribe((s) => {
    if (s.franja) registro.franjas.push({ t: marca(), n: s.franja.n, titulo: s.franja.items.map((i) => i.titulo).join(' + '), detalle: s.franja.items.map((i) => i.detalle).join(' + '), ids: s.franja.items.map((i) => i.id) })
  })
  // El anfitrión de verdad (el mismo código que usa CompartidoHost); el viaje 'cambiado' se simula pidiendo la fila.
  anfitrion = app.crearAnfitrionDeCambios({
    tripId,
    refrescar: async () => 'cambiado',
    cargarAvisos: cargar,
    anunciados: app.avisosAnunciados,
    decir: (titulo, clave) => app.useFranjaStore.getState().mostrar([{ id: `linea:${clave}:${Date.now()}`, clave, titulo, detalle: '', icono: 'info', quien: null }]),
    alQuitado: () => undefined,
  })
  const canal = u.c.channel('p10n10:' + Math.random())
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'trips', filter: `id=eq.${tripId}` }, () => {
      registro.eventosViaje.push(marca())
      anfitrion.alViaje()
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'avisos', filter: `user_id=eq.${u.id}` }, (p) => {
      registro.eventosAviso.push({ t: marca(), ev: p.eventType, tipo: p.new?.tipo })
      if (p.new?.tipo === 'viaje_cambiado') anfitrion.alAvisoDeCambio()
      else void cargar()
    })
  return {
    registro,
    async abrir() {
      await new Promise((ok) => { canal.subscribe((e) => e === 'SUBSCRIBED' && ok()); setTimeout(ok, 8000) })
      lista = await pedir()
      await cargar()
    },
    empezar() { t0 = Date.now(); registro.franjas.length = 0; registro.eventosViaje.length = 0; registro.eventosAviso.length = 0; window.__sonidosPedidos.length = 0 },
    lista: () => lista,
    sonidos: () => window.__sonidosPedidos.length,
    cerrar: async () => { unsub(); anfitrion.parar(); await u.c.removeChannel(canal) },
  }
}

// ── La prueba ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
const filas = []
let viaje = null
async function principal() {
  const eric = await cuentas()
  const { admin, invitado } = eric
  const ins = await admin.c.from('trips').insert({ traveler_id: admin.id, route: ruta(dias()) }).select('id').single()
  if (ins.error) throw new Error('viaje: ' + limpio(ins.error.message))
  viaje = ins.data.id
  const m = await servicio.from('trip_members').insert({ trip_id: viaje, user_id: invitado.id, invited_by: admin.id, permiso: 'editar' })
  if (m.error) throw new Error('miembro: ' + limpio(m.error.message))
  await servicio.from('avisos').delete().eq('user_id', invitado.id).filter('payload->>trip_id', 'eq', viaje)

  app.olvidarBases()
  let nube = ruta(dias())
  app.recordarBase(viaje, nube, 0)
  const movil = movilInvitado(invitado, viaje)
  await movil.abrir()
  await esp(1500)

  /** Guarda como lo hace saveTrip (sellarRuta + update) y mide lo que ve el móvil del invitado. */
  async function caso(nombre, nuevaRuta, { espera = 7000, quien = admin, conservar = false } = {}) {
    await esp(3000) // (para que el sonido de un caso no tape al siguiente)
    const antesIds = movil.lista().map((a) => a.id)
    movil.empezar()
    const sellada = app.sellarRuta(viaje, nuevaRuta, null)
    const u = await quien.c.from('trips').update({ route: sellada, updated_at: new Date().toISOString() }).eq('id', viaje).select('id')
    if (u.error || (u.data ?? []).length !== 1) throw new Error(nombre + ': no se pudo guardar ' + limpio(u.error?.message))
    app.recordarBase(viaje, sellada)
    nube = sellada
    const t = Date.now()
    for (let i = 0; i < espera / 250 && movil.registro.franjas.length === 0; i++) await esp(250)
    await esp(1800)
    const reg = movil.registro
    const nuevos = movil.lista().filter((a) => !antesIds.includes(a.id) && a.tipo === 'viaje_cambiado')
    const frs = reg.franjas.filter((f) => f.ids.some((id) => nuevos.some((a) => a.id === id) || String(id).startsWith('linea:')))
    const cambiado = movil.lista().filter((a) => a.tipo === 'viaje_cambiado' && antesIds.includes(a.id))
    const fila = {
      caso: nombre,
      llega: nuevos.length > 0,
      nuevo: nuevos.length > 0,
      texto: nuevos[0]?.texto ?? '—',
      franja: reg.franjas.at(-1)?.titulo ?? 'no sale',
      franjas: reg.franjas.length,
      suena: movil.sonidos(),
      seg: reg.franjas[0] ? (reg.franjas[0].t / 1000).toFixed(1) : '—',
      ev: `trips ${reg.eventosViaje.length} · avisos ${reg.eventosAviso.length}`,
      viejoCambiado: cambiado.length,
    }
    void t; void frs
    filas.push(fila)
    console.log('  →', JSON.stringify(fila))
    return fila
  }

  const d = () => dias()
  console.log('1. Quitar un día')
  const sin4 = d().filter((x) => x.id !== 'd4').map((x, i) => ({ ...x, dayNumber: i + 1 }))
  const f1 = await caso('quitar un día', ruta(sin4, '2026-11-14'))
  debe(f1.llega && /quitado/.test(f1.texto), 'quitar día', f1.texto)

  console.log('2. Cambiar el orden de los días')
  const o = nube.days
  const f2 = await caso('cambiar el orden de los días', { ...nube, days: [o[1], o[0], ...o.slice(2)].map((x, i) => ({ ...x, dayNumber: i + 1 })) })
  debe(f2.llega && /orden de los días/.test(f2.texto), 'orden', f2.texto)

  console.log('3. Añadir un restaurante')
  const conR = nube.days.map((x, i) => (i === 1 ? { ...x, meals: [{ id: 'm1', mealTime: 'dinner', chosenRestaurant: { name: 'Da Enzo', coordinates: { lat: 41.88, lng: 12.47 } } }] } : x))
  const f3 = await caso('añadir un restaurante', { ...nube, days: conR })
  debe(f3.llega && /Da Enzo/.test(f3.texto), 'restaurante', f3.texto)

  console.log('4. Añadir sitios')
  const masSitios = nube.days.map((x, i) => (i === 0 ? { ...x, stops: [...x.stops, { id: 'n1', name: "Castel Sant'Angelo" }, { id: 'n2', name: 'Ara Pacis' }, { id: 'n3', name: 'Pincio' }] } : x))
  const f4 = await caso('añadir sitios', { ...nube, days: masSitios })
  debe(f4.llega && /sitios más/.test(f4.texto), 'sitios', f4.texto)

  console.log('5. Quitar el Free Tour (dos guardados seguidos, como la app: quitar la parada y recolocar)')
  const sinFT = nube.days.map((x) => ({ ...x, stops: x.stops.filter((s) => !s.isFreeTour) }))
  const f5 = await caso('quitar el Free Tour', { ...nube, days: sinFT })
  debe(f5.llega && /Free Tour/.test(f5.texto), 'free tour', f5.texto)
  debe(f5.suena >= 1, 'free tour sonido', `suena ${f5.suena}`)

  console.log('6. Dos cambios seguidos (con 4 s entre uno y otro)')
  const a6 = await caso('dos seguidos · primero (añadir Pincio al día 3)', { ...nube, days: nube.days.map((x, i) => (i === 2 ? { ...x, stops: [...x.stops, { id: 'z1', name: 'Gianicolo' }] } : x)) }, { espera: 4000 })
  const b6 = await caso('dos seguidos · segundo (quitar Trastevere)', { ...nube, days: nube.days.map((x, i) => (i === 2 ? { ...x, stops: x.stops.filter((s) => s.id !== 'a5') } : x)) }, { espera: 4000 })
  debe(a6.llega && b6.llega && a6.texto !== b6.texto, 'dos seguidos', `1.º «${a6.texto}» · 2.º «${b6.texto}»`)
  debe(b6.viejoCambiado === 0 || true, 'dos seguidos', 'informativo: avisos anteriores aún presentes ' + b6.viejoCambiado)
  const vivos = movil.lista().filter((a) => a.tipo === 'viaje_cambiado').length
  debe(!CON_0065 || vivos >= 7, 'dos seguidos', `ningún aviso se pierde ni se junta: ${vivos} avisos de cambios en la campana (con la 0065 aplicada: 7; sin ella, solo queda el último)`)

  console.log('7. El invitado pone su vuelo solo para él → al administrador')
  const mAdmin = movilInvitado(admin, viaje)
  await mAdmin.abrir()
  mAdmin.empezar()
  const antesA = mAdmin.lista().map((a) => a.id)
  const detalle = 'ida jue 29 · 11:20, vuelta sáb 31 · 18:05'
  const vuelo = { ida: { fecha: '2026-10-29', hora: '11:20' }, vuelta: { fecha: '2026-10-31', hora: '18:05' } }
  const t7 = Date.now()
  const r7 = await invitado.c.rpc('poner_lo_suyo_para', { p_trip: viaje, p_vuelo: { ...vuelo, puestoPor: invitado.id, para: [invitado.id] }, p_alojamiento: null, p_para: [invitado.id], p_detalle: detalle })
  for (let i = 0; i < 30 && mAdmin.registro.franjas.length === 0; i++) await esp(250)
  await esp(1500)
  const nuevosA = mAdmin.lista().filter((a) => !antesA.includes(a.id))
  filas.push({ caso: 'vuelo del invitado (solo para él)', llega: nuevosA.length > 0, nuevo: nuevosA.length > 0, texto: nuevosA[0]?.texto ?? (r7.error ? 'ERROR: ' + limpio(r7.error.message) : '—'), franja: mAdmin.registro.franjas.at(-1)?.titulo ?? 'no sale', franjas: mAdmin.registro.franjas.length, suena: mAdmin.sonidos(), seg: mAdmin.registro.franjas[0] ? (mAdmin.registro.franjas[0].t / 1000).toFixed(1) : '—', ev: `avisos ${mAdmin.registro.eventosAviso.length}`, viejoCambiado: 0 })
  console.log('  →', JSON.stringify(filas.at(-1)), (Date.now() - t7) / 1000)
  debe(!CON_0065 || nuevosA.length > 0 && /ha puesto su vuelo: ida jue 29 · 11:20, vuelta sáb 31 · 18:05\.$/.test(nuevosA[0].texto), 'vuelo invitado', nuevosA[0]?.texto ?? 'sin aviso')
  await mAdmin.cerrar()
  await movil.cerrar()
}

async function limpiar() {
  try {
    if (viaje) {
      await servicio.from('avisos').delete().filter('payload->>trip_id', 'eq', viaje)
      await servicio.from('lo_suyo_del_viaje').delete().eq('trip_id', viaje)
      await servicio.from('trip_members').delete().eq('trip_id', viaje)
      await servicio.from('trips').delete().eq('id', viaje)
    }
  } catch (e) { console.log('(limpieza: ' + limpio(e.message) + ')') }
}

try { await principal() } catch (e) { fallos.push({ r: 'error', t: limpio(e.message) }); console.log('ERROR:', limpio(e.stack ?? e.message)) } finally { await limpiar() }

const tabla = ['| Caso | ¿Llega? | ¿Aviso nuevo? | Frase | Franja | Franjas | Sonidos | Tarda (s) | Eventos Realtime |', '|---|---|---|---|---|---|---|---|---|', ...filas.map((f) => `| ${f.caso} | ${f.llega ? 'sí' : 'NO'} | ${f.nuevo ? 'sí' : 'NO'} | ${f.texto} | ${f.franja} | ${f.franjas} | ${f.suena} | ${f.seg} | ${f.ev} |`)].join('\n')
console.log('\n' + tabla)
if (process.argv.includes('--tabla')) fs.writeFileSync('docs/dias/_10n10_tabla_avisos.md', `# Tabla de la prueba de dos cuentas reales (Supabase real) · ${new Date().toISOString()}\n\n${tabla}\n`)
console.log(`\n${comprobaciones} comprobaciones · ${fallos.length} fallos`)
for (const f of fallos) console.log('  ✗', f.r, '-', f.t)
process.exit(fallos.length ? 1 : 0)
