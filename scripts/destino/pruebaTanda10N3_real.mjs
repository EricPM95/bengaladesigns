// Tanda 10N3 (parte B): comprobar contra Supabase REAL lo que en la 10N solo se probó con PGlite. Se SALTA sola si faltan las variables.
//   node scripts/destino/pruebaTanda10N3_real.mjs
//
// Lee en memoria VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY y SUPABASE_SERVICE_ROLE_KEY de .env.local (o del entorno); NUNCA las imprime.
// (10S) Ya NO crea cuentas nuevas en cada pasada (Supabase limita las altas anonimas: «Request rate limit reached»). Usa TRES cuentas FIJAS y un viaje de prueba propio:
//   · dueño = «Eric» y Luis = «Viajes»: las dos cuentas REALES de docs/dias/_cuentas_prueba_10n10.json (las mismas de pruebaTanda10N10_avisos_real; si el archivo no existe se crean aqui, una sola vez, igual que alli);
//   · Ana = UNA cuenta anonima fija: su sesion (el refresh token, que se renueva en cada pasada) se guarda en docs/dias/_cuentas_prueba_10n3_ana.json. Solo se da de alta una anonima la primera vez o si esa sesion ya no vale (y lo dice).
//   Los dos archivos estan fuera de git (.git/info/exclude: docs/dias/_cuentas_prueba*.json) y no se imprimen nunca. Al acabar BORRA el viaje, sus filas y los avisos de esas cuentas; las cuentas NO se borran.
//   Usa el Supabase real y las mismas cuentas que pruebaTanda10N10_avisos_real: CORRER SOLA (nunca con otra prueba de Supabase a la vez).
// No toca ningún dato de nadie más y no llama a `empezar_de_cero`.
// OJO: `crear_invitacion` y `canjear_invitacion` exigen una cuenta de verdad (no anónima), así que con cuentas anónimas NO se pueden probar contra Supabase: se dice en el resumen.
// Los miembros se meten con la clave de servicio (lo que hace `canjear_invitacion` por dentro) y el resto de funciones se llaman COMO cada cuenta, con sus reglas de seguridad reales.
import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const leerEnv = () => {
  const env = { ...process.env }
  try {
    for (const linea of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
      const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(linea)
      if (m && env[m[1]] === undefined) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
  } catch {
    /* sin .env.local */
  }
  return env
}
const env = leerEnv()
const URL_ = env.VITE_SUPABASE_URL
const ANON = env.VITE_SUPABASE_ANON_KEY
const SERVICIO = env.SUPABASE_SERVICE_ROLE_KEY
if (!URL_ || !ANON || !SERVICIO) {
  console.log('SALTADA: faltan VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY o SUPABASE_SERVICE_ROLE_KEY (en .env.local o en el entorno). No se ha tocado nada.')
  process.exit(0)
}

const fallos = []
const hechas = []
let comprobaciones = 0
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) fallos.push({ regla, texto })
  console.log(`  ${cond ? 'ok ' : 'MAL'} ${regla} · ${texto}`)
}
const esp = (ms) => new Promise((r) => setTimeout(r, ms))
const opciones = { auth: { persistSession: false, autoRefreshToken: false } }
const admin = createClient(URL_, SERVICIO, opciones)
const limpio = (m) => String(m ?? '').replace(/eyJ[\w.-]+/g, '[clave]')

const usuarios = []
let viaje = null
let anaRenovada = false

const ARCHIVO_REALES = 'docs/dias/_cuentas_prueba_10n10.json'
const ARCHIVO_ANA = 'docs/dias/_cuentas_prueba_10n3_ana.json'

/** Las dos cuentas reales de siempre (admin «Eric» e invitado «Viajes»): se leen del archivo; si no existe, se crean una sola vez (como en pruebaTanda10N10_avisos_real). */
async function cuentasReales() {
  let datos = null
  try {
    datos = JSON.parse(fs.readFileSync(ARCHIVO_REALES, 'utf8'))
  } catch {
    /* se crean */
  }
  if (!datos) {
    datos = {}
    for (const [clave, nombre] of [['admin', 'Eric'], ['invitado', 'Viajes']]) {
      const email = `prueba10n10.${clave}.${Math.random().toString(36).slice(2, 8)}@example.com`
      const password = 'Pr-' + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
      const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true })
      if (error) throw new Error('createUser: ' + limpio(error.message))
      datos[clave] = { email, password, id: data.user.id, nombre: nombre }
    }
    fs.writeFileSync(ARCHIVO_REALES, JSON.stringify(datos, null, 1))
    console.log('  (cuentas reales de prueba creadas una sola vez y guardadas fuera de git)')
  }
  const salida = {}
  for (const clave of ['admin', 'invitado']) {
    const d = datos[clave]
    const c = createClient(URL_, ANON, opciones)
    const { error } = await c.auth.signInWithPassword({ email: d.email, password: d.password })
    if (error) throw new Error('signIn ' + clave + ': ' + limpio(error.message))
    await admin.from('travelers').upsert({ id: d.id, nombre: d.nombre, is_anonymous: false }, { onConflict: 'id' })
    salida[clave] = { c, id: d.id, nombre: d.nombre }
  }
  return salida
}

/** Una cuenta anónima FIJA: se reanuda su sesión guardada (el refresh token se renueva y se guarda otra vez); solo si no hay o ya no vale se da de alta una nueva (1 alta, y lo dice). */
async function cuentaAnonimaFija(nombre) {
  const c = createClient(URL_, ANON, opciones)
  let user = null
  try {
    const guardada = JSON.parse(fs.readFileSync(ARCHIVO_ANA, 'utf8'))
    const { data, error } = await c.auth.refreshSession({ refresh_token: guardada.refresh_token })
    if (!error && data.session?.user?.is_anonymous) {
      user = data.session.user
      fs.writeFileSync(ARCHIVO_ANA, JSON.stringify({ refresh_token: data.session.refresh_token }))
    }
  } catch {
    /* sin sesión guardada */
  }
  if (!user) {
    const { data, error } = await c.auth.signInAnonymously()
    if (error || !data.user) throw new Error(`no se pudo dar de alta la cuenta anónima fija ${nombre}: ${limpio(error?.message)} (límite de altas de Supabase: espera unos minutos y repite la prueba SOLA; esta alta solo hace falta una vez)`)
    anaRenovada = true
    user = data.user
    fs.writeFileSync(ARCHIVO_ANA, JSON.stringify({ refresh_token: data.session.refresh_token }))
    console.log('  (cuenta anónima fija creada: 1 alta; las próximas pasadas reanudan su sesión)')
  }
  const { error: e2 } = await c.from('travelers').upsert({ id: user.id, is_anonymous: true }, { onConflict: 'id', ignoreDuplicates: true })
  if (e2) throw new Error(`travelers: ${limpio(e2.message)}`)
  await admin.from('travelers').update({ nombre }).eq('id', user.id)
  return { c, id: user.id, nombre }
}

/** Los avisos de las tres cuentas fijas: se vacían al empezar y al acabar (las cuentas se reutilizan, así que no puede quedar nada de la pasada anterior). */
async function limpiarAvisos() {
  if (usuarios.length) await admin.from('avisos').delete().in('user_id', usuarios)
}
const rpc = async (u, f, args) => {
  const { data, error } = await u.c.rpc(f, args)
  return { data, error: error ? limpio(error.message) : null }
}
const avisosDe = async (u, tipo) => (await admin.from('avisos').select('tipo, payload, leido_en').eq('user_id', u.id).eq('tipo', tipo)).data ?? []

const dia = (n, paradas) => ({ id: 'd' + n, dayNumber: n, city: 'Roma', stops: paradas.map(([id, name]) => ({ id, name })) })
const ruta = (dias, ini = '2026-11-26', fin = '2026-11-29') => ({ id: 'prueba-10n3', destination: 'Roma', answers: { dateRange: { start: ini, end: fin } }, days: dias, departureFlightTime: '10:00' })
const base = [dia(1, [['s1', 'Coliseo'], ['s2', 'Arco de Constantino']]), dia(2, [['s3', 'Panteón']]), dia(3, [['s4', 'Trastevere']]), dia(4, [['s5', 'Galería Borghese']])]

async function principal() {
  console.log('0. Las migraciones (¿están aplicadas?)')
  for (const [f, args, nota] of [['gente_del_viaje', { p_trip: '00000000-0000-0000-0000-000000000000' }, '0036'], ['info_quitar', { p_trip: '00000000-0000-0000-0000-000000000000', p_user: '00000000-0000-0000-0000-000000000000' }, '0036']]) {
    const r = await admin.rpc(f, args)
    const falta = r.error && /Could not find the function|PGRST202|42883/.test(`${r.error.code} ${r.error.message}`)
    debe(!falta, 'migraciones', `la función ${f} existe (${nota}${r.error && !falta ? ': ' + limpio(r.error.message).slice(0, 80) : ''})`)
  }
  for (const t of ['trip_gastos', 'reservas_invitado', 'trip_ex_miembros', 'trip_pagos']) {
    const r = await admin.from(t).select('*', { head: true, count: 'exact' })
    debe(!r.error, 'migraciones', `la tabla ${t} existe (0037-0040)${r.error ? ': ' + limpio(r.error.message).slice(0, 90) : ''}`)
  }
  const col = await admin.from('trip_recommendations').select('decisiones').limit(1)
  debe(!col.error, 'migraciones', `trip_recommendations.decisiones existe (0039)${col.error ? ': ' + limpio(col.error.message).slice(0, 90) : ''}`)
  const t41 = await admin.rpc('sacar_del_viaje', { p_trip: '00000000-0000-0000-0000-000000000000', p_user: '00000000-0000-0000-0000-000000000000', p_aviso: false })
  console.log(`  (la 0041 ${t41.error && /permission|denied|42501/i.test(`${t41.error.code} ${t41.error.message}`) ? 'responde (función reservada)' : 'no se puede comprobar desde aquí'}; esta tanda no la aplica Eric hasta que la lea)`)

  console.log('1. Las tres cuentas fijas de prueba y un viaje de prueba')
  const real = await cuentasReales()
  const eric = real.admin
  const luis = real.invitado
  const ana = await cuentaAnonimaFija('PruebaAna')
  usuarios.push(eric.id, luis.id, ana.id)
  await limpiarAvisos()
  debe(Boolean(eric.id && ana.id && luis.id), 'cuentas', `tres cuentas fijas (dueño y Luis reales, Ana anónima fija; sin altas nuevas${anaRenovada ? ', salvo la de Ana, que no tenía sesión guardada' : ''})`)
  const ins = await eric.c.from('trips').insert({ traveler_id: eric.id, route: ruta(base) }).select('id').single()
  debe(!ins.error && Boolean(ins.data?.id), 'viaje', `el dueño crea su viaje de prueba${ins.error ? ': ' + limpio(ins.error.message) : ''}`)
  viaje = ins.data.id

  console.log('2. Invitar (crear_invitacion/canjear_invitacion exigen cuenta de verdad)')
  const inv = await rpc(ana, 'crear_invitacion', { p_trip: viaje, p_pass: null, p_usos: 10 })
  debe(inv.error !== null && /Primero crea tu cuenta/.test(inv.error), 'invitar', `con una cuenta anónima, crear_invitacion dice «Primero crea tu cuenta» (la regla funciona en real): ${inv.error}`)
  hechas.push('crear_invitacion y canjear_invitacion: solo se comprobó que rechazan a una cuenta anónima; probarlas de verdad necesita dos cuentas de verdad (email)')
  // La invitación (una fila) y los miembros se ponen con la clave de servicio, como lo hace canjear_invitacion por dentro.
  const codigo = 'TEST' + Math.random().toString(36).slice(2, 6).toUpperCase()
  const fila = await admin.from('trip_invitations').insert({ trip_id: viaje, creada_por: eric.id, codigo, usos_max: 10, usos_usados: 2 }).select('id').single()
  debe(!fila.error, 'invitar', `invitación de prueba creada por servicio${fila.error ? ': ' + limpio(fila.error.message) : ''}`)
  const lista = await eric.c.from('trip_invitations').select('id, codigo, usos_max, usos_usados, anulada_en').eq('trip_id', viaje)
  const vigente = (lista.data ?? []).find((i) => i.anulada_en === null && i.usos_usados < i.usos_max)
  debe(vigente?.codigo === codigo, 'invitar', 'el dueño ve su invitación vigente (la que reutiliza invitacionDelViaje: el mismo código)')
  const ajena = await ana.c.from('trip_invitations').select('id').eq('trip_id', viaje)
  debe((ajena.data ?? []).length === 0, 'invitar', 'otra cuenta NO ve las invitaciones del viaje (reglas de seguridad)')
  const ver = await rpc(ana, 'ver_invitacion', { p_codigo: codigo })
  debe(ver.data?.valida === true && ver.data?.ya_dentro === false && ver.data?.destino === 'Roma', 'invitar', `ver_invitacion antes de entrar: válida, ya_dentro false, destino Roma${ver.error ? ' · ' + ver.error : ''}`)
  for (const u of [ana, luis]) {
    const r = await admin.from('trip_members').insert({ trip_id: viaje, user_id: u.id, invited_by: eric.id })
    if (r.error) throw new Error('trip_members: ' + limpio(r.error.message))
  }
  const ver2 = await rpc(ana, 'ver_invitacion', { p_codigo: codigo })
  debe(ver2.data?.ya_dentro === true && ver2.data?.trip_id === viaje, 'entrar', 'ya dentro: ver_invitacion dice ya_dentro y a qué viaje ir (sin la pantalla de la invitación)')
  const g = await rpc(eric, 'gente_del_viaje', { p_trip: viaje })
  debe(Array.isArray(g.data) && g.data.length === 3 && g.data.filter((p) => p.permiso === 'recomendar').length === 2 && g.data[0].es_admin && g.data[0].es_yo, 'permisos', 'gente_del_viaje: 3 personas, el dueño con es_yo, y los dos invitados entran con «recomendar»')

  console.log('3. Permisos y su aviso en la campana')
  const noAdmin = await rpc(ana, 'cambiar_permiso', { p_trip: viaje, p_user: luis.id, p_permiso: 'editar' })
  debe(/Solo el administrador/.test(noAdmin.error ?? ''), 'permisos', 'un invitado no puede cambiar permisos')
  const cambia = await rpc(eric, 'cambiar_permiso', { p_trip: viaje, p_user: luis.id, p_permiso: 'editar' })
  debe(!cambia.error && cambia.data?.cambiado === true, 'permisos', `el dueño sube a Luis a «Puede editar»${cambia.error ? ': ' + cambia.error : ''}`)
  const avp = await avisosDe(luis, 'permiso')
  debe(avp.length === 1 && avp[0].payload.permiso === 'editar' && avp[0].payload.destino === 'Roma', 'permisos', 'a Luis le llega el aviso «permiso» a su campana (con el destino y el permiso)')
  const miAviso = await luis.c.from('avisos').select('tipo').eq('tipo', 'permiso')
  debe((miAviso.data ?? []).length === 1, 'permisos', 'y Luis lo lee con SUS reglas de seguridad (la campana de verdad)')

  console.log('4. El editor y el que solo recomienda escriben en el viaje')
  const nuevaParada = base.map((d, i) => (i === 2 ? { ...d, stops: [...d.stops, { id: 's9', name: 'Fontana de Trevi' }] } : d))
  const edLuis = await luis.c.from('trips').update({ route: ruta(nuevaParada) }).eq('id', viaje).select('id')
  debe(!edLuis.error && (edLuis.data ?? []).length === 1, 'editor', `Luis (puede editar) guarda la ruta${edLuis.error ? ': ' + limpio(edLuis.error.message) : ''}`)
  const edAna = await ana.c.from('trips').update({ route: ruta(base) }).eq('id', viaje).select('id')
  debe(!edAna.error && (edAna.data ?? []).length === 0, 'editor', 'Ana (solo recomienda) NO escribe en el viaje (0 filas)')
  const fechas = await luis.c.from('trips').update({ route: ruta(nuevaParada, '2026-12-01', '2026-12-04') }).eq('id', viaje).select('id')
  debe(/fechas/.test(fechas.error?.message ?? ''), 'editor', `Luis no puede cambiar las fechas${fechas.error ? ' (' + limpio(fechas.error.message) + ')' : ' — SE DEJÓ'}`)
  const vuelo = await luis.c.from('trips').update({ route: { ...ruta(nuevaParada), departureFlightTime: '23:00' } }).eq('id', viaje).select('id')
  debe(/vuelo o el alojamiento/.test(vuelo.error?.message ?? ''), 'editor', 'Luis no puede cambiar el vuelo')
  const borra = await luis.c.from('trips').delete().eq('id', viaje).select('id')
  debe((borra.data ?? []).length === 0, 'editor', 'Luis no borra el viaje')
  const avc = await avisosDe(eric, 'viaje_cambiado')
  debe(avc.length >= 1 && avc[0].payload.quien === luis.nombre.split(' ')[0] && (avc[0].payload.anadidas ?? []).some((a) => a.nombre === 'Fontana de Trevi'), 'directo', 'el cambio de Luis deja en la campana del dueño el aviso «viaje_cambiado» con lo añadido')
  const avAna = await avisosDe(ana, 'viaje_cambiado')
  debe(avAna.length === 1, 'directo', 'y en la de Ana (uno solo)')
  const recs = await rpc(ana, 'ver_invitacion', { p_codigo: codigo })
  void recs

  console.log('5. Propuesta: recomendación, decidir, avisos')
  const rec = await ana.c.from('trip_recommendations').insert({ trip_id: viaje, tipo: 'cambio', payload: { dayId: 'd1' } }).select('id').single()
  debe(!rec.error, 'propuesta', `Ana manda una recomendación${rec.error ? ': ' + limpio(rec.error.message) : ''}`)
  await esp(500)
  debe((await avisosDe(eric, 'recomendacion')).length === 1, 'propuesta', 'al dueño le llega «recomendacion» a la campana')
  const rec2 = await ana.c.from('trip_recommendations').insert({ trip_id: viaje, tipo: 'cambio', payload: { dayId: 'd2' } }).select('id').single()
  const acepta = await luis.c.from('trip_recommendations').update({ estado: 'aceptada' }).eq('id', rec.data.id).select('id')
  debe(!acepta.error && (acepta.data ?? []).length === 1, 'propuesta', 'Luis (puede editar) acepta la recomendación de Ana')
  await esp(500)
  debe((await avisosDe(ana, 'aceptada')).length === 1, 'propuesta', 'a Ana le llega «aceptada»')
  const noDecide = await ana.c.from('trip_recommendations').update({ estado: 'rechazada' }).eq('id', rec2.data.id).select('id')
  debe((noDecide.data ?? []).length === 0, 'propuesta', 'Ana no puede decidir su propia recomendación')

  console.log('6. El directo (Realtime) con dos clientes escuchando a la vez')
  const recibidos = { ericViaje: 0, ericAviso: 0, luisViaje: 0, luisMiembros: 0, anaAviso: [] }
  const conectar = (u, escuchas) =>
    new Promise((ok) => {
      let canal = u.c.channel('p10n3:' + u.id + Math.random())
      for (const [filtro, cb] of escuchas) canal = canal.on('postgres_changes', filtro, cb)
      let ultimo = 'sin respuesta'
      canal.subscribe((estado, err) => {
        ultimo = estado + (err ? ' ' + limpio(err.message) : '')
        if (estado === 'SUBSCRIBED') ok(canal)
      })
      setTimeout(() => {
        if (ultimo !== 'SUBSCRIBED') console.log('  (el canal de ' + u.nombre + ' no llegó a SUBSCRIBED: ' + ultimo + ')')
        ok(canal)
      }, 8000)
    })
  const canales = []
  canales.push(await conectar(eric, [[{ event: 'UPDATE', schema: 'public', table: 'trips', filter: `id=eq.${viaje}` }, () => recibidos.ericViaje++], [{ event: '*', schema: 'public', table: 'avisos', filter: `user_id=eq.${eric.id}` }, () => recibidos.ericAviso++]]))
  canales.push(await conectar(ana, [[{ event: 'INSERT', schema: 'public', table: 'avisos', filter: `user_id=eq.${ana.id}` }, (p) => recibidos.anaAviso.push(p.new?.tipo)]]))
  await esp(1500)
  // Luis (editor) cambia la ruta: el dueño debe recibir el cambio y el aviso, sin recargar.
  const otra = nuevaParada.map((d, i) => (i === 3 ? { ...d, stops: [...d.stops, { id: 's10', name: 'Piazza Navona' }] } : d))
  await luis.c.from('trips').update({ route: ruta(otra) }).eq('id', viaje)
  for (let i = 0; i < 20 && (recibidos.ericViaje === 0 || recibidos.ericAviso === 0); i++) await esp(500)
  debe(recibidos.ericViaje >= 1, 'directo', `el DUEÑO recibe en directo el cambio del viaje que hace Luis (Realtime en trips) — eventos: ${recibidos.ericViaje}`)
  debe(recibidos.ericAviso >= 1, 'directo', `y el aviso «viaje_cambiado» de la campana (Realtime en avisos) — eventos: ${recibidos.ericAviso}`)
  // El dueño cambia el permiso de Ana: a Ana le llega el aviso en directo.
  await rpc(eric, 'cambiar_permiso', { p_trip: viaje, p_user: ana.id, p_permiso: 'editar' })
  for (let i = 0; i < 12 && !recibidos.anaAviso.includes('permiso'); i++) await esp(500)
  debe(recibidos.anaAviso.includes('permiso'), 'directo', 'Ana recibe en directo su aviso «permiso»')
  await rpc(eric, 'cambiar_permiso', { p_trip: viaje, p_user: ana.id, p_permiso: 'recomendar' })

  console.log('7. Quitar y salir')
  const info = await rpc(eric, 'info_quitar', { p_trip: viaje, p_user: ana.id })
  debe(info.data?.nombre === ana.nombre || info.data?.nombre === ana.nombre.split(' ')[0], 'quitar', `info_quitar dice el nombre${info.error ? ': ' + info.error : ''}`)
  const sinPermiso = await rpc(luis, 'quitar_del_viaje', { p_trip: viaje, p_user: ana.id })
  debe(/Solo el administrador/.test(sinPermiso.error ?? ''), 'quitar', 'un editor no quita a nadie')
  const aSiMismo = await rpc(eric, 'quitar_del_viaje', { p_trip: viaje, p_user: eric.id })
  debe(/no puede quitarse/.test(aSiMismo.error ?? ''), 'quitar', 'el administrador no puede quitarse')
  const sale = await rpc(eric, 'salir_del_viaje', { p_trip: viaje })
  debe(/no puede salir/.test(sale.error ?? ''), 'quitar', 'el administrador no puede salir')
  debe(((await ana.c.from('trips').select('id').eq('id', viaje)).data ?? []).length === 1, 'quitar', 'antes de quitarla, Ana ve el viaje')
  const ex = await rpc(eric, 'quitar_del_viaje', { p_trip: viaje, p_user: ana.id })
  debe(!ex.error && ex.data?.quitado === true, 'quitar', `el dueño quita a Ana${ex.error ? ': ' + ex.error : ''}`)
  debe(((await ana.c.from('trips').select('id').eq('id', viaje)).data ?? []).length === 0, 'quitar', 'Ana deja de ver el viaje enseguida')
  const avq = await avisosDe(ana, 'quitado')
  debe(avq.length === 1 && avq[0].payload.destino === 'Roma', 'quitar', 'a Ana le llega «Ya no formas parte del viaje a Roma»')
  const propuestasAna = ((await admin.from('trip_recommendations').select('id, estado').eq('trip_id', viaje).eq('author_id', ana.id)).data ?? [])
  console.log(`  (propuestas de Ana tras quitarla: ${propuestasAna.map((p) => p.estado).join(', ') || 'ninguna'} — con la 0041 aplicada se borran las pendientes)`)
  const sal = await rpc(luis, 'salir_del_viaje', { p_trip: viaje })
  debe(!sal.error && sal.data?.quitado === true, 'salir', `Luis sale del viaje${sal.error ? ': ' + sal.error : ''}`)
  debe(((await luis.c.from('trips').select('id').eq('id', viaje)).data ?? []).length === 0, 'salir', 'y deja de verlo')
  const otraVez = await rpc(luis, 'salir_del_viaje', { p_trip: viaje })
  debe(/No estás/.test(otraVez.error ?? ''), 'salir', 'quien ya no está no puede salir otra vez')
  for (const c of canales) await admin.removeChannel?.(c)
  for (const u of [eric, ana, luis]) await u.c.removeAllChannels()
  hechas.push('Pase/plaza que vuelve: no se probó contra Supabase real (hace falta un pase de verdad, que solo se crea con un cobro); sí está probado en PGlite')
}

async function limpiar() {
  console.log('8. Limpieza (todo lo que creó esta prueba)')
  try {
    if (viaje) {
      await admin.from('trip_recommendations').delete().eq('trip_id', viaje)
      await admin.from('trip_invitations').delete().eq('trip_id', viaje)
      await admin.from('trip_members').delete().eq('trip_id', viaje)
      await admin.from('trips').delete().eq('id', viaje)
    }
    if (usuarios.length) {
      await limpiarAvisos()
    }
    const quedan = viaje ? ((await admin.from('trip_members').select('user_id').eq('trip_id', viaje)).data ?? []).length : 0
    const viajeQueda = viaje ? ((await admin.from('trips').select('id').eq('id', viaje)).data ?? []).length : 0
    console.log(`  viaje borrado: ${viajeQueda === 0 ? 'sí' : 'NO'} · miembros que quedan en el viaje de prueba: ${quedan}`)
    debe(viajeQueda === 0 && quedan === 0, 'limpieza', 'no queda nada de lo que creó la prueba')
  } catch (e) {
    console.log('  (la limpieza falló: ' + limpio(e.message) + ') — borrar a mano el viaje de prueba (las cuentas fijas NO se borran) ' + viaje)
    fallos.push({ regla: 'limpieza', texto: 'la limpieza falló' })
  }
}

try {
  await principal()
} catch (e) {
  fallos.push({ regla: 'error', texto: limpio(e.message) })
  console.log('ERROR:', limpio(e.message))
} finally {
  await limpiar()
}
console.log('\nLo que NO se pudo probar contra Supabase real:')
for (const h of hechas) console.log('  -', h)
console.log(`\n${comprobaciones} comprobaciones · ${fallos.length} fallos`)
for (const f of fallos) console.log('  ✗', f.regla, '-', f.texto)
process.exit(fallos.length ? 1 : 0)
