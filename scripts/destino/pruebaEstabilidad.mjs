// Tanda V1 (15-nov): ESTABILIDAD DESPUÉS DEL VIAJE. La caída del 11-nov y el exceso de salida de datos (egress) de Supabase.
//   1. La migración 0077 (los avisos programados) y la tarea cada 5 minutos.
//   2. La tarea de los avisos, un DÍA ENTERO simulado en Lanzarote (con pg_cron cada 5 min): lee solo los avisos que tocan y cuenta los bytes; los avisos salen a su hora.
//   3. El sondeo del viaje compartido pregunta solo por el sello (no baja el viaje entero) y la sesión no se cierra con una caída (en el código).
//   4. El navegador (un Chrome por vez, que se cierra al acabar; SIN_NAVEGADOR=1 lo salta): con Supabase caído NO sale el formulario ni «Entrar», se ve HOY guardado con «No llegamos al servidor…» y el respaldo de la sesión sigue.
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/pruebaEstabilidad.mjs
import fs from 'node:fs'
import { crearServicioAvisosViaje } from '../../server/avisosViaje.js'
import { localDe, planDelViaje } from '../../shared/avisos/avisosDelViaje.js'
import { crearBaseDeAvisos } from './_baseDeAvisosDeMentira.mjs'

let comprobaciones = 0
const fallos = []
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) fallos.push({ regla, texto })
}
const leer = (f) => fs.readFileSync(f, 'utf8')
const clonar = (x) => JSON.parse(JSON.stringify(x))
const FIXTURE = 'docs/dias/_hoy3_ruta_eric.json'
if (!fs.existsSync(FIXTURE)) {
  console.error(`Falta ${FIXTURE}`)
  process.exit(2)
}
const { route: ERIC, reservations: RESERVAS_ERIC } = JSON.parse(leer(FIXTURE))
const DATOS = { tiempo: JSON.parse(leer('data/hoy/avisos_tiempo.json')), atardecer: JSON.parse(leer('src/data/sitiosDeAtardecer.json')) }
const CANARIAS = 'Atlantic/Canary'
const ENV = { PUSH_ACTIVO: 'true', VAPID_PUBLIC_KEY: 'a', VAPID_PRIVATE_KEY: 'b', VAPID_CONTACTO: 'mailto:prueba@example.test', CRON_SECRET: 'x' }
const MB = 1024 * 1024

/* ───────────────────────── 1. La migración 0077 ───────────────────────── */
console.log('1. La migración 0077 y la tarea cada 5 minutos')
{
  const sql = leer('supabase/migrations/0077_avisos_programados.sql')
  for (const t of ['avisos_plan', 'avisos_programados']) {
    debe(new RegExp(`create table if not exists public\\.${t}\\b`).test(sql) && new RegExp(`alter table public\\.${t} enable row level security`).test(sql), '0077', `la tabla ${t} se crea con RLS y sin políticas`)
  }
  debe(!/\buser_id\b|\bcomprador_id\b|\bautor_id\b/.test(sql.split('-- ── 2.')[0].split('create table if not exists public.avisos_plan')[1] ?? ''), '0077', 'las tablas nuevas cuelgan del VIAJE, no de ninguna cuenta (nada que añadir a «Empezar de cero»)')
  debe(/references public\.trips \(id\) on delete cascade/.test(sql), '0077', 'se borran con el viaje')
  for (const f of ['avisos_viajes_por_planificar', 'avisos_viaje_para_plan', 'avisos_programados_guardar', 'avisos_programados_debidos', 'avisos_programados_listo', 'avisos_viaje_hay_que_mirar']) {
    debe(new RegExp(`create or replace function public\\.${f}\\(`).test(sql) && new RegExp(`revoke all on function public\\.${f}\\([^)]*\\) from public, anon, authenticated`).test(sql) && new RegExp(`grant execute on function public\\.${f}\\([^)]*\\) to service_role`).test(sql), '0077', `${f}: solo la puede llamar el servidor`)
  }
  debe(/'\*\/5 \* \* \* \*'/.test(sql) && /cron\.unschedule\('avisos-viaje'\)/.test(sql), '0077', 'la tarea pasa a cada 5 minutos (y vuelve a programarse sin duplicarse)')
  debe(/md5\(coalesce\(t\.route::text/.test(sql) && /interval '6 hours'/.test(sql), '0077', 'la huella (md5) se calcula dentro de la base de datos y el plan se refresca cada 6 h')
  const debidos = /create or replace function public\.avisos_programados_debidos[^]*?\$\$;/.exec(sql)?.[0] ?? ''
  debe(!/'route'|t\.route\b(?! ->>)|'bookings'/.test(debidos), '0077', 'la lectura de cada vuelta (avisos_programados_debidos) NO devuelve la ruta ni las reservas: solo textos')
  debe(/trip_members/.test(sql.split('avisos_viaje_hay_que_mirar')[0]) || /avisos_viajes_por_planificar/.test(sql), '0077', 'los compañeros de un viaje compartido siguen contando (la 0076, dentro de «por planificar»)')
  debe(fs.existsSync('docs/dias/COMPROBAR_0077.sql') && /avisos_programados/.test(leer('docs/dias/COMPROBAR_0077.sql')), '0077', 'tiene su COMPROBAR_0077.sql')
}

/* ───────────────────────── 2. Un día entero, simulado ───────────────────────── */
console.log('2. La tarea de los avisos, un día entero simulado en Lanzarote (pg_cron cada 5 min)')
function mundo({ route = ERIC, reservations = RESERVAS_ERIC, miembros = [], meteos = {} } = {}) {
  const viaje = { trip_id: 't1', user_id: 'u1', route: clonar(route), bookings: { reservations } }
  const base = crearBaseDeAvisos({ viajes: [viaje], miembros, usuarios: {} })
  const enviados = []
  const webpush = { setVapidDetails() {}, sendNotification: async (sub, payload) => void enviados.push({ en: base.estado.reloj, payload: JSON.parse(payload) }) }
  const llamadasTiempo = []
  const servicio = crearServicioAvisosViaje({
    admin: base.admin,
    destinos: { lanzarote: { destino: 'Lanzarote', timezone: CANARIAS } },
    env: ENV,
    cargarWebPush: async () => ({ default: webpush }),
    tiempo: async (coords, fecha) => {
      llamadasTiempo.push(fecha)
      return { value: meteos[fecha] ?? null }
    },
    datos: DATOS,
    esAdminDeCuenta: async () => true,
    marca: () => ({ nombre: 'JUTRIP' }),
    log: { warn() {} },
  })
  /** pg_cron cada 5 minutos: la base mira (sin salir ni un byte) y, solo si hay algo, llama a la API. */
  const correr = async (desdeMs, hastaMs) => {
    let llamadas = 0
    for (let t = desdeMs; t < hastaMs; t += 5 * 60000) {
      const instante = new Date(t)
      if (!base.hayQueMirar(instante)) continue
      llamadas++
      base.estado.reloj = instante
      await servicio.tick(instante)
    }
    return llamadas
  }
  return { base, viaje, enviados, servicio, correr, llamadasTiempo }
}
const dia = (iso) => Date.parse(`${iso}T00:00:00Z`) // Canarias = UTC en noviembre
{
  const m = mundo()
  const llamadas = await m.correr(dia('2026-11-10'), dia('2026-11-11'))
  const bytes = m.base.estado.bytes
  const rutaBytes = JSON.stringify({ route: m.viaje.route, bookings: m.viaje.bookings }).length
  const antes = rutaBytes * 1440
  console.log(`   (martes 10-nov: ${llamadas} llamadas a la API de 288 vueltas de pg_cron; la tarea leyó ${(bytes / 1024).toFixed(1)} KB; antes: la ruta entera (${(rutaBytes / 1024).toFixed(1)} KB) cada minuto = ${(antes / MB).toFixed(1)} MB al día)`)
  debe(bytes < 1 * MB, 'egress', `un día entero: la tarea lee ${(bytes / 1024).toFixed(0)} KB, menos de 1 MB (antes ${(antes / MB).toFixed(0)} MB)`)
  debe(antes / bytes > 30, 'egress', `lee más de 30 veces menos que antes (${Math.round(antes / bytes)} veces)`)
  const planes = m.base.estado.llamadas.filter((n) => n === 'avisos_viaje_para_plan').length
  debe(planes >= 1 && planes <= 5, 'egress', `la ruta entera se baja solo para rehacer el plan: ${planes} veces en 24 h (no 1.440)`)
  debe(llamadas < 288, 'egress', `la base solo llama a la API cuando hay algo que hacer (${llamadas} de 288 vueltas)`)
  const esperado = planDelViaje({ route: ERIC, reservations: RESERVAS_ERIC, zona: CANARIAS, datos: DATOS }).filter((a) => a.fecha === '2026-11-10')
  debe(esperado.length >= 1 && m.enviados.length === esperado.length, 'avisos', `el martes 10 salen los ${esperado.length} avisos del plan (${m.enviados.length})`)
  for (const a of esperado) {
    const salio = m.enviados.find((e) => e.payload.cuerpo === a.texto)
    const retraso = salio ? (salio.en.getTime() - a.instante.getTime()) / 60000 : null
    debe(salio && retraso >= 0 && retraso <= 5, 'avisos', `«${a.texto.slice(0, 40)}…» sale a su hora (retraso ${retraso} min, tope 5)`)
  }
  debe(new Set(m.enviados.map((e) => e.payload.cuerpo)).size === m.enviados.length, 'avisos', 'ninguno se repite')
  const filasDebidas = m.base.estado.bytesPorLlamada.get('avisos_programados_debidos') ?? 0
  debe(filasDebidas < 20 * 1024, 'egress', `lo que se lee de los avisos que tocan: ${filasDebidas} bytes en 24 h`)
}
{
  // El viaje entero (7 → 13 de noviembre): total de lo leído.
  const m = mundo()
  await m.correr(dia('2026-11-07'), dia('2026-11-14'))
  const mb = m.base.estado.bytes / MB
  console.log(`   (viaje entero, 7 días: ${(mb).toFixed(2)} MB leídos en total, ${m.enviados.length} avisos)`)
  debe(mb < 5, 'egress', `el viaje entero cuesta ${mb.toFixed(2)} MB de salida de datos (antes ~${((JSON.stringify(ERIC).length * 1440 * 7) / MB / 1024).toFixed(2)} GB)`)
  const porFecha = new Map()
  for (const e of m.enviados) {
    const f = localDe(e.en, CANARIAS).fecha
    porFecha.set(f, (porFecha.get(f) ?? 0) + 1)
  }
  debe([...porFecha.values()].every((n) => n <= 4), 'avisos', 'como mucho 4 al día, igual que en la HOY3')
  debe(m.enviados.every((e) => localDe(e.en, CANARIAS).min < 22 * 60 && localDe(e.en, CANARIAS).min >= 7 * 60 - 5 || /Bienvenido/.test(e.payload.cuerpo)), 'avisos', 'ninguno de noche (salvo la llegada), en la hora de Canarias')
}
{
  // Si la ruta cambia, la huella cambia y el plan se rehace en la vuelta siguiente (con la hora nueva); si no cambia, no se vuelve a bajar.
  const m = mundo()
  const tic = (instante) => {
    m.base.estado.reloj = instante
    return m.servicio.tick(instante)
  }
  await tic(new Date(dia('2026-11-10') + 3 * 3600000))
  const antes = [...m.base.filas.values()].find((f) => f.tipo === 'manana' && f.dia_fecha === '2026-11-10')
  debe(Boolean(antes) && /sal de casa a las 9:26/.test(antes.texto), 'cambio', `plan de hoy hecho: «${antes?.texto}»`)
  m.base.estado.llamadas.length = 0
  await tic(new Date(dia('2026-11-10') + 3 * 3600000 + 5 * 60000))
  debe(!m.base.estado.llamadas.includes('avisos_viaje_para_plan'), 'cambio', 'sin cambios y con el plan reciente, no se vuelve a bajar el viaje')
  m.viaje.route.days.find((d) => d.dayNumber === 3).coche.ida.salir = '10:15'
  m.base.estado.llamadas.length = 0
  await tic(new Date(dia('2026-11-10') + 3 * 3600000 + 10 * 60000))
  const despues = [...m.base.filas.values()].find((f) => f.tipo === 'manana' && f.dia_fecha === '2026-11-10')
  debe(m.base.estado.llamadas.includes('avisos_viaje_para_plan') && /sal de casa a las 10:15/.test(despues.texto), 'cambio', `la ruta cambió (salir a las 10:15): el plan se rehace en la vuelta siguiente («${despues?.texto}»)`)
  m.base.estado.llamadas.length = 0
  await tic(new Date(dia('2026-11-10') + 10 * 3600000))
  debe(m.base.estado.llamadas.includes('avisos_viaje_para_plan'), 'cambio', 'pasadas 6 h se rehace igual (para refrescar el tiempo)')
}
{
  // Los compañeros de un viaje compartido reciben lo mismo que el dueño y el día de prueba / el pase siguen mandando (HOY3 lo prueba a fondo; aquí, con la base nueva).
  const m = mundo({ miembros: [{ trip_id: 't1', user_id: 'u2' }] })
  await m.correr(dia('2026-11-13'), dia('2026-11-14'))
  const u = (x) => [...m.base.reservados].filter((k) => k.startsWith(x + '|t1|')).length
  debe(u('u1') >= 2 && u('u1') === u('u2'), 'compañeros', `el dueño y el compañero reciben lo mismo (${u('u1')} y ${u('u2')})`)
}

/* ───────────────────────── 3. El código del cliente ───────────────────────── */
console.log('3. Sondeo por sello, sesión que no se cierra y arranque sin formulario (el código)')
{
  const directo = leer('src/lib/viajeEnDirecto.ts')
  const persist = leer('src/lib/tripPersistence.ts')
  const host = leer('src/components/compartir/CompartidoHost.tsx')
  debe(/refrescarViajeActivo\(\{ sondeo: true \}\)/.test(host) && /opciones\.sondeo/.test(directo), 'sello', 'el sondeo de cada 30 s pide el viaje con {sondeo:true}')
  debe(/selloDelViaje\(tripId\)/.test(directo) && /ahora === conocido\.sello\) return 'igual'/.test(directo), 'sello', 'si el sello no ha cambiado, no baja el viaje (devuelve «igual»)')
  debe(/from\('trips'\)\.select\('updated_at, guardado_en'\)/.test(persist), 'sello', 'el sello son dos columnas pequeñas (updated_at y guardado_en), no la ruta')
  // (V36, 21-nov) Antes cada 10 min; ahora cada 3 horas (el viaje entero pesa 49-79 KB y se bajaba 48 veces al día aunque nadie lo hubiera cambiado: la fuga de egress de Supabase).
  debe(/SELLO_CADUCA_MS = 3 \* 60 \* 60 \* 1000/.test(persist), 'sello', 'cada 3 horas se baja igual, por si algo cambió sin tocar updated_at (V36)')
  debe(/recordarSello\(row\.id/.test(persist) && /recordarSello\(tripId, fila\.updated_at/.test(persist), 'sello', 'al bajar los viajes (todos o uno) se apunta su sello')
  const cuentas = leer('src/lib/cuentas.ts')
  debe(/export async function recuperarSesionDeRespaldo/.test(cuentas) && /setSession\(\{ access_token: respaldo\.access_token/.test(cuentas), 'sesion', 'hay una copia de la sesión que se recupera si la librería la pierde')
  debe(/olvidarRespaldoDeSesion\(\) \/\/ \(V1\) a propósito/.test(cuentas) && /export function olvidarRespaldoDeSesion/.test(cuentas) && /olvidarRespaldoDeSesion\(\)/.test(leer('src/lib/empezarDeCero.ts')), 'sesion', 'la copia solo se borra al cerrar la sesión A PROPÓSITO (cerrar sesión, borrar la cuenta, empezar de cero)')
  debe(/if \(!sesion && hayRespaldoDeSesion\(\)\)/.test(cuentas), 'sesion', 'si la librería se queda sin sesión sin que nadie la cierre, no se enseña «Entrar»: se recupera')
  debe(/hayRespaldoDeSesion\(\)[^]*recuperarSesionDeRespaldo\(\)[^]*sin_servidor[^]*throw new Error\('No llegamos al servidor/.test(persist), 'sesion', 'sin servidor NO se crea una cuenta anónima nueva (se perdería lo de la cuenta)')
  const sync = leer('src/components/sync/TripSync.tsx')
  debe(/setSinServidor\(true\)[^]*setTimeout\(\(\) => void arrancar\(\), 20000\)/.test(sync) && /sinServidor && hayRespaldoDeSesion\(\)/.test(sync), 'arranque', 'con el servidor caído y una cuenta: no se enseña el formulario; se reintenta cada 20 s')
  debe(/abrirDesdeElMovil\(\)/.test(sync.split('const sinServidor = esFalloDeServidor(err)')[1] ?? ''), 'arranque', 'con el servidor caído se abre lo guardado en el móvil (HOY de hoy)')
  debe(/if \(useSyncStore\.getState\(\)\.sinServidor\) return/.test(leer('src/App.tsx')), 'arranque', 'el tope de 12 s no saca el formulario si el servidor está caído')
  debe(/No llegamos al servidor\. Reintentando…/.test(leer('src/components/layout/CargandoApp.tsx')), 'arranque', 'la pantalla de carga lo dice con palabras sencillas')
  debe(/No llegamos al servidor\. Lo de hoy está guardado en tu móvil\./.test(leer('src/components/route/hoy/SinConexionHoy.tsx')), 'arranque', 'HOY lleva la línea «No llegamos al servidor. Lo de hoy está guardado en tu móvil.»')
  debe(/'AuthRetryableFetchError'/.test(cuentas) && /upstream/.test(cuentas), 'arranque', '«upstream request timeout» cuenta como servidor caído')
}

/* ───────────────────────── 4. El navegador ───────────────────────── */
if (process.env.SIN_NAVEGADOR === '1') console.log('4. El navegador: saltado (SIN_NAVEGADOR=1)')
else {
  console.log('4. El navegador: Supabase caído (simulado), con la sesión guardada y HOY guardado en el móvil')
  const { abrirApp } = await import('./_enLaApp.mjs')
  const APP = process.env.APP_URL || 'http://localhost:5173'
  const hoyIso = (() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })()
  const mas = (iso, n) => new Date(Date.parse(`${iso}T00:00:00Z`) + n * 86400000).toISOString().slice(0, 10)
  const ruta = clonar(ERIC)
  ruta.answers.dateRange = { start: mas(hoyIso, -1), end: mas(hoyIso, 4) }
  ruta.createdAt = new Date().toISOString()
  const guardado = { id: 'v1-prueba', payload: { route: ruta, bookings: { reservations: [] }, wishlist: [], uiState: { mode: 'today', activeDayId: null }, generationState: null }, guardadoEn: new Date().toISOString(), desde: mas(hoyIso, -1), hasta: mas(hoyIso, 4) }
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url')
  const jwtCaducado = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub: '00000000-0000-4000-8000-000000000001', aud: 'authenticated', role: 'authenticated', exp: 1700000000, email: 'prueba@example.test', app_metadata: { provider: 'email' }, user_metadata: {} })}.${b64('firma-de-mentira')}`
  const respaldo = { uid: '00000000-0000-4000-8000-000000000001', access_token: jwtCaducado, refresh_token: 'refresco-de-mentira' }
  const caido = `(() => {
    const f0 = window.fetch.bind(window)
    window.__pedidosASupabase = 0
    window.fetch = (u, o) => {
      if (String(u).includes('supabase.co')) {
        window.__pedidosASupabase++
        return Promise.resolve(new Response('upstream request timeout', { status: 504, statusText: 'Gateway Timeout' }))
      }
      return f0(u, o)
    }
    window.__muestras = []
    setInterval(() => {
      const raiz = document.getElementById('root')
      if (!raiz || raiz.children.length === 0) return
      window.__muestras.push({ cargando: Boolean(document.querySelector('[data-cargando-app]')), entrar: Boolean(document.querySelector('[data-entrar], [data-entrar-email], [data-codigo-email]')), cual: (document.querySelector('[data-entrar], [data-entrar-email], [data-codigo-email]')?.outerHTML || '').slice(0, 140), formulario: /Trazar ruta|De dónde sales/.test(document.body.innerText || ''), hoy: Boolean(document.querySelector('[data-sin-conexion]')) })
    }, 100)
  })()`
  const sembrar = `(async () => {
    window.localStorage.setItem('trazo:cuenta:respaldo', ${JSON.stringify(JSON.stringify(respaldo))})
    await new Promise((ok) => { const p = indexedDB.open('trazo-hoy-offline', 1); p.onupgradeneeded = () => p.result.createObjectStore('viajes', { keyPath: 'id' }); p.onsuccess = () => { const tx = p.result.transaction('viajes', 'readwrite'); tx.objectStore('viajes').put(${JSON.stringify(guardado)}); tx.oncomplete = () => { p.result.close(); ok(true) } }; p.onerror = () => ok(false) })
    return true
  })()`
  // Supabase caído desde la PRIMERA carga (así la prueba no crea ninguna cuenta anónima de verdad en la nube ni deja una sesión suelta en el navegador de prueba).
  const a = await abrirApp(APP, { ruta: '/?cuentas=off&apertura=0', ancho: 390, alto: 844, sinEsperarRuta: true, antes: caido })
  try {
    await a.esp(2500)
    debe((await a.evaluar(sembrar)) === true, 'navegador', 'se deja en el móvil de prueba el respaldo de la sesión y el viaje de hoy guardado')
    await a.cdp('Page.navigate', { url: `${APP}/?cuentas=on&apertura=0&hoy2=on&version=completa` })
    await a.esp(25000)
    const m = JSON.parse(await a.evaluar('JSON.stringify(window.__muestras || [])'))
    const pedidos = await a.evaluar('window.__pedidosASupabase')
    debe(pedidos >= 1, 'navegador', `la app sí intentó hablar con Supabase (que estaba caído): ${pedidos} peticiones`)
    debe(m.length > 20, 'navegador', `hay muestras de la pantalla (${m.length})`)
    debe(m.every((x) => !x.entrar), 'navegador', `NUNCA sale la pantalla de «Entrar» con el servidor caído (la sesión no se cierra) (muestras con Entrar: ${m.filter((x) => x.entrar).length} de ${m.length}; elemento: ${m.find((x) => x.entrar)?.cual}; primera en la ${m.findIndex((x) => x.entrar)}; con carga: ${m.filter((x) => x.cargando).length}; con HOY: ${m.filter((x) => x.hoy).length})`)
    debe(m.every((x) => !x.formulario), 'navegador', 'NUNCA sale el formulario de origen y destino')
    const resp = await a.evaluar("window.localStorage.getItem('trazo:cuenta:respaldo') !== null")
    debe(resp === true, 'navegador', 'el respaldo de la sesión sigue en el móvil (no se ha cerrado la sesión)')
    const linea = await a.evaluar("document.querySelector('[data-sin-servidor][data-sin-conexion]')?.innerText || document.querySelector('[data-sin-conexion]')?.innerText || ''")
    debe(/No llegamos al servidor\. Lo de hoy está guardado en tu móvil\./.test(linea), 'navegador', `HOY (guardado en el móvil) dice «${String(linea).trim()}»`)
    const dia = await a.evaluar("document.body.innerText.slice(0, 600)")
    debe(/Manrique|Teguise|Timanfaya|Papagayo|HOY|Hoy/i.test(dia), 'navegador', `se ve HOY con el viaje guardado (pantalla: ${String(dia).replace(/\s+/g, ' ').slice(0, 160)})`)
    await a.captura?.('docs/dias/capturas_jutrip/v1_sin_servidor.png')
  } finally {
    await a.cerrar()
  }
}

console.log(`\nLa prueba de la tanda V1: ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
for (const x of fallos) console.log(`  FALLO [${x.regla}] ${x.texto}`)
process.exit(fallos.length ? 1 : 0)
