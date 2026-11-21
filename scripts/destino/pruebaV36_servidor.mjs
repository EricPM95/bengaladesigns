// La prueba de la Tanda V36 (EL SERVIDOR Y LA FUGA DE DATOS DE SUPABASE). Ninguna llamada a producción ni claves: un cliente de Supabase de MENTIRA que mide cuántas consultas se hacen y cuántos bytes bajan.
//   node scripts/destino/pruebaV36_servidor.mjs
//  1. El día de HOY (la ruta «cerca de aquí», una vuelta cada 45 s durante 8 h): pocas lecturas y pocos KB     2. El panel abierto (Inicio, Ventas, Usuarios y Logros) con cientos de filas: antes y después
//  3. Ninguna tarea programada arranca en desarrollo (ni hay temporizadores en el servidor)                    4. El contador de peticiones: solo en desarrollo y nada en producción
//  5. Los avisos del viaje (la causa de la fuga del 7 al 12 de noviembre) no bajan la ruta entera en cada vuelta  6. Sin la migración 0092 (no hace falta ninguna) todo funciona
import fs from 'node:fs'
import path from 'node:path'
import express from 'express'
import { cargarDatos, cargarCatalogo, datosVisiblesPara } from '../../server/logros/datos.js'
import { crearServicioLogros } from '../../server/logros/servicio.js'
import { repoSupabase, olvidarViajesEnMemoria } from '../../server/logros/repo.js'
import { registrarRutasPanel } from '../../server/panel/index.js'
import { crearCorreo } from '../../server/correo.js'
import { crearMedidor, destinoDe, esDesarrollo, medirSupabase } from '../../server/medidorSupabase.js'
import { crearServicioAvisosViaje } from '../../server/avisosViaje.js'

let comprobaciones = 0
const fallos = []
const debe = (cond, texto) => {
  comprobaciones++
  if (!cond) {
    fallos.push(texto)
    console.log(`  FALLO ${texto}`)
  }
}
const kb = (b) => Math.round((b / 1024) * 10) / 10

/* ───────── El cliente de Supabase de mentira que MIDE ───────── */
function crearBaseDeMentira(tablas, { rpcs = {}, usuarios = [] } = {}) {
  const medida = { consultas: 0, bytes: 0, filas: 0, porTabla: new Map() }
  const sumar = (nombre, data) => {
    const filas = Array.isArray(data) ? data.length : data ? 1 : 0
    const bytes = JSON.stringify(data ?? null).length
    medida.consultas++
    medida.bytes += bytes
    medida.filas += filas
    const x = medida.porTabla.get(nombre) ?? { consultas: 0, bytes: 0 }
    x.consultas++
    x.bytes += bytes
    medida.porTabla.set(nombre, x)
  }
  const proyectar = (fila, columnas) => {
    if (!columnas || columnas === '*') return fila
    const salida = {}
    for (const c of String(columnas).split(',').map((x) => x.trim()).filter(Boolean)) {
      const nombre = c.includes(':') ? c.split(':')[0] : c
      salida[nombre] = fila[nombre]
    }
    return salida
  }
  const from = (tabla) => {
    let filas = tablas[tabla]
    const filtros = []
    let columnas = '*'
    let tope = null
    let desde = 0
    let cuenta = false
    let orden = null
    let accion = 'select'
    let carga = null
    const q = {
      select(c, o) {
        columnas = c ?? '*'
        if (o?.head) cuenta = true
        return q
      },
      eq: (k, v) => (filtros.push((f) => f[k] === v), q),
      neq: (k, v) => (filtros.push((f) => f[k] !== v), q),
      in: (k, vs) => (filtros.push((f) => vs.includes(f[k])), q),
      is: (k, v) => (filtros.push((f) => (v === null ? f[k] == null : f[k] === v)), q),
      not: (k, op, v) => (filtros.push((f) => !(op === 'is' && v === null ? f[k] == null : f[k] === v)), q),
      lte: (k, v) => (filtros.push((f) => f[k] <= v), q),
      or: () => q,
      order: (k, o) => ((orden = [k, o?.ascending !== false]), q),
      limit: (n) => ((tope = n), q),
      range: (d, h) => ((desde = d), (tope = h - d + 1), q),
      insert: (f) => ((accion = 'insert'), (carga = f), q),
      upsert: (f) => ((accion = 'insert'), (carga = f), q),
      update: () => ((accion = 'update'), q),
      delete: () => ((accion = 'delete'), q),
      single: () => q.maybeSingle(),
      async maybeSingle() {
        const r = await q.then((x) => x)
        return { data: Array.isArray(r.data) ? (r.data[0] ?? null) : r.data, error: null }
      },
      then(ok, no) {
        try {
          if (filas === undefined) return ok({ data: null, error: { message: `relation "${tabla}" does not exist` } })
          if (accion !== 'select') {
            if (accion === 'insert') for (const f of [].concat(carga)) filas.push({ id: `n${filas.length}`, ...f })
            sumar(tabla, null)
            return ok({ data: null, error: null })
          }
          let r = filas.filter((f) => filtros.every((x) => x(f)))
          if (orden) r = [...r].sort((a, b) => (a[orden[0]] < b[orden[0]] ? -1 : a[orden[0]] > b[orden[0]] ? 1 : 0) * (orden[1] ? 1 : -1))
          r = r.slice(desde, tope === null ? undefined : desde + tope)
          if (cuenta) {
            sumar(tabla, null)
            return ok({ count: r.length, data: null, error: null })
          }
          const data = r.map((f) => proyectar(f, columnas))
          sumar(tabla, data)
          return ok({ data, error: null })
        } catch (e) {
          return no ? no(e) : ok({ data: null, error: { message: e.message } })
        }
      },
    }
    return q
  }
  const admin = {
    from,
    rpc: async (nombre, args) => {
      if (!(nombre in rpcs)) return { data: null, error: { message: `function public.${nombre} does not exist` } }
      const data = await rpcs[nombre](args)
      sumar(`rpc:${nombre}`, data)
      return { data, error: null }
    },
    auth: {
      getUser: async (token) => (token === 'T-admin' ? { data: { user: { id: 'ADMIN', is_anonymous: false, email: 'admin@x.es' } }, error: null } : { data: { user: null }, error: { message: 'no' } }),
      admin: {
        listUsers: async ({ page = 1 } = {}) => {
          const lista = page === 1 ? usuarios : []
          sumar('auth.users', lista)
          return { data: { users: lista }, error: null }
        },
      },
    },
    storage: { from: () => ({ createSignedUrls: async () => ({ data: [] }) }) },
  }
  return { admin, medida, reiniciar: () => ((medida.consultas = 0), (medida.bytes = 0), (medida.filas = 0), medida.porTabla.clear()) }
}

/* ───────── 1. El día de HOY: «cerca de aquí» cada 45 s durante 8 h ───────── */
console.log('1. HOY: la ruta «cerca de aquí» durante 8 horas de viaje (una petición cada 45 s)')
const datos = datosVisiblesPara(cargarDatos(), new Set(['lanzarote']), false)
const catalogos = Object.fromEntries(Object.keys(datos.destinos).map((k) => [k, cargarCatalogo(k)]))
const nombreDe = (id) => catalogos.roma.places.find((p) => p.id === id)?.name ?? id
const ID_VIAJE = 'trip-1'
const UID = 'user-1'
const rutaRoma = {
  destination: 'Roma',
  answers: { dateRange: { start: '2026-11-08', end: '2026-11-13' }, companion: 'couple' },
  days: [1, 2, 3, 4, 5, 6].map((n) => ({ id: `d${n}`, dayNumber: n, stops: ['coliseo', 'foro_romano_y_palatino', 'fontana_de_trevi', 'panteon'].map((id, j) => ({ id: `d${n}s${j}`, name: nombreDe(id) })) })),
  relleno: 'x'.repeat(79 * 1024), // el peso de una ruta de verdad (medido en la V26: 79 KB)
}
const ganados = Array.from({ length: 90 }, (_, i) => ({ user_id: UID, destino: 'roma', logro: `pedazo:c${i % 9}:s${i}`, escalon: '', trip_id: ID_VIAJE, ganado_en: '2026-11-08T10:00:00Z', frase: 'Una frase de ejemplo de unos cien caracteres para que la fila pese lo que pesa de verdad en la base.', animacion_vista: true }))
const hechos = Array.from({ length: 300 }, (_, i) => ({ id: `h${i}`, user_id: UID, trip_id: ID_VIAJE, destino: 'roma', tipo: 'visto', sitio: `s${i}`, stop_id: `d1s${i}`, instante: '2026-11-08T10:00:00Z', recibido_en: '2026-11-08T10:00:01Z', ubic: 'cerca', valido: true, motivo: null, origen: 'app', foto_id: null, inicio: '2026-11-08', fin: '2026-11-13', deshecho_en: null, created_at: '2026-11-08T10:00:01Z' }))
const tablasHoy = () => ({
  trips: [{ id: ID_VIAJE, traveler_id: UID, route: rutaRoma, updated_at: '2026-11-08T08:00:00Z' }],
  trip_members: [],
  trip_invitations: [],
  passes: [],
  pass_members: [],
  logro_hechos: hechos,
  achievements: ganados,
  travelers: [{ id: UID, nombre: 'Eric', alta_cuenta: '2026-10-01T10:00:00Z' }],
  app_config: [],
  logro_perfil: [{ user_id: UID, previos: { paises: [], dias: 0 }, vitrina: { baldas: {}, titulo: null }, exp_max: 0 }],
  logro_referidos: [],
  hoy_prueba: [],
})
const VUELTAS = 8 * 60 * 60 / 45 // 640
const reloj = new Date('2026-11-09T10:00:00Z')

// ANTES: cada vuelta hacía la carga completa (hechos, viajes, logros, cuenta, pioneros, probador, perfil, referidos, invitador).
{
  const b = crearBaseDeMentira(tablasHoy(), { rpcs: { logro_orden_pionero: async () => null } })
  const repo = repoSupabase(b.admin, { destinosConPionero: ['roma'] })
  olvidarViajesEnMemoria()
  for (let i = 0; i < VUELTAS; i++) await Promise.all([repo.hechosDe(UID), repo.viajesDe(UID), repo.logrosDe(UID), repo.cuentaDe(UID), repo.ordenPionero(UID), repo.probadorDe(UID), repo.perfilDe(UID), repo.referidosDe(UID), repo.invitadorDe(UID)])
  var antesHoy = { consultas: b.medida.consultas, bytes: b.medida.bytes }
}
// AHORA: el servicio de verdad (`cerca` lee lo ligero y lo guarda 30 s).
const b = crearBaseDeMentira(tablasHoy(), { rpcs: { logro_orden_pionero: async () => null } })
olvidarViajesEnMemoria()
const repoLogros = repoSupabase(b.admin, { destinosConPionero: ['roma'] })
const servicio = crearServicioLogros({ repo: repoLogros, datos, catalogos, ahora: () => reloj, cobro: false, azar: () => 0 })
const primera = await servicio.cerca(UID, { trip_id: ID_VIAJE, ubicacion: { lat: 41.89, lng: 12.4922 }, sitios_hoy: ['Coliseo'] })
debe(primera.ok === true && Array.isArray(primera.cerca), '«cerca de aquí» sigue contestando con su lista')
const consultasPrimera = b.medida.consultas
debe(consultasPrimera <= 6, `la primera vuelta hace pocas consultas (${consultasPrimera}; antes ~${Math.round(antesHoy.consultas / VUELTAS)})`)
for (let i = 1; i < VUELTAS; i++) await servicio.cerca(UID, { trip_id: ID_VIAJE, ubicacion: { lat: 41.89, lng: 12.4922 }, sitios_hoy: ['Coliseo'] })
console.log(`   «cerca de aquí» ${VUELTAS} veces: antes ${antesHoy.consultas} consultas y ${kb(antesHoy.bytes)} KB · ahora ${b.medida.consultas} consultas y ${kb(b.medida.bytes)} KB`)
debe(b.medida.bytes < 5 * 1024 * 1024, `un viajero con HOY 8 h baja menos de 5 MB (${kb(b.medida.bytes)} KB)`)
debe(b.medida.consultas < antesHoy.consultas / 20, `y hace al menos 20 veces menos consultas (${b.medida.consultas} frente a ${antesHoy.consultas})`)
debe(!b.medida.porTabla.has('logro_hechos'), 'la ruta «cerca» ya no lee los hechos (no los usa)')
// Con una vuelta de la lectura guardada pasada, vuelve a leer (30 s): un cambio de otra instancia se ve como mucho en 30 s.
{
  let ahora = Date.now()
  const real = Date.now
  Date.now = () => ahora
  const b2 = crearBaseDeMentira(tablasHoy(), { rpcs: { logro_orden_pionero: async () => null } })
  const repo2 = repoSupabase(b2.admin)
  const s2 = crearServicioLogros({ repo: repo2, datos, catalogos, ahora: () => reloj, cobro: false, azar: () => 0 })
  await s2.cerca(UID, { trip_id: ID_VIAJE })
  const c1 = b2.medida.consultas
  await s2.cerca(UID, { trip_id: ID_VIAJE })
  debe(b2.medida.consultas === c1, 'dentro de los 30 s la segunda vuelta no toca la base')
  ahora += 31000
  await s2.cerca(UID, { trip_id: ID_VIAJE })
  debe(b2.medida.consultas > c1, 'pasados los 30 s vuelve a leer (nunca se queda viejo)')
  // Una escritura del servicio (aquí, guardar la EXP máxima al pedir la EXP) olvida la lectura guardada.
  await s2.cerca(UID, { trip_id: ID_VIAJE })
  await s2.expDe(UID)
  const c2 = b2.medida.consultas
  await s2.cerca(UID, { trip_id: ID_VIAJE })
  debe(b2.medida.consultas > c2, 'una escritura del servicio olvida lo guardado: la vuelta siguiente vuelve a leer')
  Date.now = real
}

/* ───────── 2. El panel abierto ───────── */
console.log('2. El panel abierto (Inicio, Ventas, Usuarios y Logros) con cientos de filas')
const N = 400
const usuariosAuth = Array.from({ length: N }, (_, i) => ({ id: `u${i}`, email: `persona${i}@correo.es`, is_anonymous: false, created_at: '2026-10-01T10:00:00Z', last_sign_in_at: '2026-11-10T10:00:00Z', app_metadata: { providers: ['email'] } }))
const tablasPanel = () => ({
  travelers: Array.from({ length: N }, (_, i) => ({ id: `u${i}`, nombre: `Persona ${i}`, alta_cuenta: '2026-10-01T10:00:00Z', zona: 'Europe/Madrid' })),
  trips: Array.from({ length: 500 }, (_, i) => ({ id: `t${i}`, traveler_id: `u${i % N}`, destino: 'Roma', origen: 'Madrid', lugar: null, inicio: '2026-11-08', fin: '2026-11-13', route: rutaRoma })),
  trip_members: [],
  passes: Array.from({ length: 200 }, (_, i) => ({ id: `p${i}`, comprador_id: `u${i}`, para_id: `u${i}`, destino: 'roma', tipo: 'solo', estado: 'activo', pago_ref: `cs_${i}`, created_at: '2026-11-05T10:00:00Z', trip_id: `t${i}` })),
  pass_members: [],
  pagos_registro: Array.from({ length: 200 }, (_, i) => ({ pago_ref: `cs_${i}`, destino: 'roma', plan: 'solo', personas: 1, importe_cent: 1900, moneda: 'eur', estado: 'pagado', proveedor: 'stripe', creado_en: '2026-11-05T10:00:00Z', devuelto_en: null, user_id: `u${i}`, comision_cent: 60, devuelto_cent: 0 })),
  achievements: Array.from({ length: 1500 }, (_, i) => ({ user_id: `u${i % N}`, logro: `pedazo:c${i % 9}:s${i}`, escalon: '', destino: 'roma', ganado_en: `2026-11-${String(8 + (i % 5)).padStart(2, '0')}T10:00:00Z`, frase: 'una frase larga '.repeat(8) })),
  logro_perfil: Array.from({ length: N }, (_, i) => ({ user_id: `u${i}`, exp_max: 100, previos: {}, vitrina: {} })),
  viajero_primera_vez: Array.from({ length: N }, (_, i) => ({ user_id: `u${i}`, frecuencia: 'poco', compania: 'pareja', anio_nacimiento: 1990, hecho_en: '2026-10-02T10:00:00Z', pais_vive: 'ES' })),
  avisos_destino: Array.from({ length: 100 }, (_, i) => ({ destino: 'Tokio', destino_norm: 'tokio', creado_en: '2026-11-01T10:00:00Z', avisado_campana_en: null, avisado_correo_en: null, id: i })),
  avisos_de_viajeros: [],
})
const ENV = { LOGROS_ADMIN_EMAILS: 'admin@x.es', APP_URL: 'https://app.test' }
const correo = crearCorreo({ apiKey: undefined, fetchFn: async () => { throw new Error('sin clave no se llama a nadie') } })
const callado = { error() {}, warn() {}, log() {} }
async function levantarPanel(tablas) {
  const m = crearBaseDeMentira(tablas, { usuarios: usuariosAuth }) // sin ninguna función panel_* ni de la 0092: todo por el camino de siempre
  const app = express()
  app.use(express.json())
  registrarRutasPanel(app, { admin: m.admin, env: ENV, correo, ahora: () => new Date('2026-11-21T10:00:00Z'), consola: callado, datos: cargarDatos(), proximamente: () => [] })
  const srv = await new Promise((ok) => {
    const s = app.listen(0, '127.0.0.1', () => ok({ s, base: `http://127.0.0.1:${s.address().port}` }))
  })
  const pedir = async (ruta) => {
    const r = await fetch(`${srv.base}${ruta}`, { headers: { authorization: 'Bearer T-admin' } })
    const t = await r.text()
    return { estado: r.status, texto: t }
  }
  return { m, pedir, cerrar: () => srv.s.close() }
}
// «Abrir el panel y moverse»: el menú, cada pestaña, cambiar de periodo y escribir en el buscador de usuarios.
const RECORRIDO = [
  '/api/admin/inicio?resumen=1', '/api/admin/inicio?periodo=30d', '/api/admin/ventas?periodo=30d', '/api/admin/usuarios/totales?periodo=30d', '/api/admin/usuarios?q=pe', '/api/admin/usuarios?q=per', '/api/admin/usuarios?q=pers',
  '/api/admin/logros-panel/resumen', '/api/admin/inicio?periodo=7d', '/api/admin/ventas?periodo=7d', '/api/admin/logros-panel/resumen?destino=roma', '/api/admin/usuarios?q=persona1',
]
async function recorrer(ttl) {
  process.env.PANEL_BASE_TTL_MS = String(ttl)
  const P = await levantarPanel(tablasPanel())
  const respuestas = []
  for (const ruta of RECORRIDO) respuestas.push(await P.pedir(ruta))
  const salida = { consultas: P.m.medida.consultas, bytes: P.m.medida.bytes, respuestas, porTabla: [...P.m.medida.porTabla.entries()] }
  P.cerrar()
  return salida
}
const sinGuardar = await recorrer(0) // como era: cada petición lee la base entera
const guardada = await recorrer(60000)
console.log(`   ${RECORRIDO.length} peticiones del panel: antes ${sinGuardar.consultas} consultas y ${kb(sinGuardar.bytes)} KB · ahora ${guardada.consultas} consultas y ${kb(guardada.bytes)} KB`)
debe(guardada.respuestas.every((r) => r.estado === 200), `todas las pestañas del panel contestan 200 sin la 0092 (${guardada.respuestas.map((r) => r.estado).join(',')})`)
debe(guardada.respuestas.map((r) => r.texto.length > 2).every(Boolean), 'y con datos')
debe(guardada.bytes < sinGuardar.bytes / 5, `el panel baja al menos 5 veces menos (${kb(guardada.bytes)} KB frente a ${kb(sinGuardar.bytes)} KB)`)
debe(guardada.consultas < sinGuardar.consultas / 4, `y hace al menos 4 veces menos consultas (${guardada.consultas} frente a ${sinGuardar.consultas})`)
// Lo mismo que antes: las respuestas con la lectura guardada son IGUALES a las de sin guardar (el panel no cambia de contenido).
debe(guardada.respuestas.every((r, i) => r.texto === sinGuardar.respuestas[i].texto), 'las respuestas del panel con la lectura guardada son idénticas a las de siempre')
// Lo escrito en el panel se ve al momento: un POST olvida lo guardado.
{
  process.env.PANEL_BASE_TTL_MS = '60000'
  const P = await levantarPanel(tablasPanel())
  await P.pedir('/api/admin/ventas?periodo=30d')
  const c = P.m.medida.consultas
  await P.pedir('/api/admin/ventas?periodo=7d')
  debe(P.m.medida.consultas === c, 'dos pestañas seguidas comparten la misma lectura (0 consultas nuevas)')
  P.cerrar()
  delete process.env.PANEL_BASE_TTL_MS
}
// Lo que baja cada pestaña por separado, para el informe.
for (const [t, x] of guardada.porTabla.sort((a, b) => b[1].bytes - a[1].bytes).slice(0, 4)) console.log(`   (ahora) ${t}: ${x.consultas} consultas, ${kb(x.bytes)} KB`)

/* ───────── 3. Ninguna tarea programada en desarrollo ───────── */
console.log('3. Ninguna tarea programada arranca en desarrollo')
const archivos = []
const recorrerCarpeta = (d) => {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name)
    if (e.isDirectory()) recorrerCarpeta(p)
    else if (/\.(js|mjs)$/.test(e.name)) archivos.push(p)
  }
}
for (const d of ['server', 'api', 'shared']) recorrerCarpeta(d)
const conTemporizador = archivos.filter((f) => /\bsetInterval\s*\(|node-cron|cron\.schedule\(|\bagenda\.|node-schedule/.test(fs.readFileSync(f, 'utf8'))).map((f) => f.replaceAll('\\', '/'))
debe(conTemporizador.length === 1 && conTemporizador[0] === 'server/medidorSupabase.js', `el único temporizador del servidor es el del contador de desarrollo (${conTemporizador.join(', ') || 'ninguno'})`)
const vercel = JSON.parse(fs.readFileSync('vercel.json', 'utf8'))
debe(vercel.crons.length === 1 && vercel.crons[0].path === '/api/cron/avisos', 'vercel.json solo tiene el cron de una vez al día (los de pg_cron los dispara Supabase contra la dirección de PRODUCCIÓN, no contra un servidor local)')
const sinSecreto = express()
sinSecreto.use(express.json())
const { registrarRutasAvisosViaje } = await import('../../server/avisosViaje.js')
registrarRutasAvisosViaje(sinSecreto, { admin: null, servicio: { tick: async () => { throw new Error('no debe correr') } }, esAdmin: () => false, env: {} })
const srvA = await new Promise((ok) => {
  const s = sinSecreto.listen(0, '127.0.0.1', () => ok(s))
})
const rCron = await fetch(`http://127.0.0.1:${srvA.address().port}/api/cron/avisos-viaje`)
debe(rCron.status === 404, 'la tarea de los avisos sin CRON_SECRET no existe (404): un servidor local no puede dispararla')
srvA.close()
const fuenteIndex = fs.readFileSync('server/index.js', 'utf8')
debe(/if \(!process\.env\.VERCEL\)/.test(fuenteIndex) || /listen\(PORT/.test(fuenteIndex), 'el servidor local solo escucha peticiones: no arranca nada por su cuenta')

/* ───────── 4. El contador de peticiones ───────── */
console.log('4. El contador de peticiones a Supabase (solo desarrollo)')
debe(esDesarrollo({}) === true && esDesarrollo({ NODE_ENV: 'production' }) === false && esDesarrollo({ VERCEL: '1' }) === false && esDesarrollo({ SUPABASE_MEDIDOR: '0' }) === false, 'solo mide con NODE_ENV distinto de production, fuera de Vercel y sin SUPABASE_MEDIDOR=0')
debe(Object.keys(medirSupabase('x', { NODE_ENV: 'production' })).length === 0 && Object.keys(medirSupabase('y', { VERCEL: '1' })).length === 0, 'en producción no devuelve nada: el cliente se crea exactamente igual que antes')
debe(destinoDe('https://x.supabase.co/rest/v1/trips?select=id') === 'tabla:trips' && destinoDe('https://x.supabase.co/rest/v1/rpc/pases_de') === 'rpc:pases_de' && destinoDe('https://x.supabase.co/auth/v1/user') === 'auth', 'distingue tabla, función (rpc) y auth')
{
  const lineas = []
  let t = 0
  const falso = async (url) => ({ headers: { get: (k) => (k === 'content-length' ? '1048576' : null) }, clone: () => ({ arrayBuffer: async () => new ArrayBuffer(10) }), url })
  const m = crearMedidor({ fetchBase: falso, escribir: (l) => lineas.push(l), limiteKb: 2048, limitePeticiones: 120, ahora: () => t, temporizador: false })
  await m.fetch('https://x.supabase.co/rest/v1/trips?select=route')
  t += 60000
  m.informar()
  debe(/^Supabase \(servidor\): 1 peticiones, 1024 KB/.test(lineas[0]) && /tabla:trips/.test(lineas[0]) && !lineas[0].includes('\x1b[31m'), `escribe «Supabase (servidor): X peticiones, Y KB» (${lineas[0]})`)
  for (let i = 0; i < 4; i++) await m.fetch('https://x.supabase.co/rest/v1/rpc/avisos_viaje_para_plan')
  t += 60000
  m.informar()
  debe(lineas[1].includes('\x1b[31m'), 'y en rojo si pasa del límite (4 MB en un minuto)')
  debe(m.foto().peticiones === 0, 'después de informar empieza de cero')
}

/* ───────── 5. Los avisos del viaje: la causa de la fuga ───────── */
console.log('5. Los avisos del viaje (la tarea de cada 5 minutos) no bajan la ruta entera en cada vuelta')
{
  const llamadasRpc = []
  let planes = 0
  const adminAvisos = {
    rpc: async (nombre) => {
      llamadasRpc.push(nombre)
      if (nombre === 'avisos_viajes_por_planificar') return { data: [], error: null }
      if (nombre === 'avisos_programados_debidos') return { data: [], error: null }
      if (nombre === 'avisos_viaje_para_plan') planes++
      return { data: null, error: null }
    },
    from: () => { throw new Error('no debe leer tablas cuando no toca ningún aviso') },
  }
  const svc = crearServicioAvisosViaje({ admin: adminAvisos, env: { PUSH_ACTIVO: 'true', VAPID_PUBLIC_KEY: 'a', VAPID_PRIVATE_KEY: 'b', VAPID_CONTACTO: 'mailto:a@b.es' }, cargarWebPush: async () => ({ setVapidDetails() {}, sendNotification: async () => {} }), datos: { tiempo: {}, atardecer: {} }, log: callado })
  for (let i = 0; i < 288; i++) await svc.tick(new Date('2026-11-09T10:00:00Z')) // un día entero de vueltas
  debe(planes === 0 && llamadasRpc.every((n) => ['avisos_viajes_por_planificar', 'avisos_programados_debidos'].includes(n)), `con el plan al día, 288 vueltas solo piden ids y avisos que tocan (${[...new Set(llamadasRpc)].join(', ')}); ninguna baja la ruta`)
  const fuente = fs.readFileSync('server/avisosViaje.js', 'utf8')
  debe(!/viajes_en_curso_para_avisos/.test(fuente), 'el código ya no usa la función vieja que bajaba la ruta entera (viajes_en_curso_para_avisos)')
  const m77 = fs.readFileSync('supabase/migrations/0077_avisos_programados.sql', 'utf8')
  debe(/'\*\/5 \* \* \* \*'/.test(m77), 'la migración 0077 pasa la tarea de cada minuto a cada 5 minutos')
}

/* ───────── 6. Sin la 0092 ───────── */
console.log('6. No hace falta ninguna migración nueva')
// (V37b) antes: «0092 libre». Ahora la 0092 existe (columna trips.route_original, otra tanda): lo que importa es que NINGUNA migración posterior a la 0091 rehaga las funciones que usa la V36 (panel, logros, empezar_de_cero).
debe(!fs.readdirSync('supabase/migrations').filter((f) => /^009[2-9]|^01\d\d/.test(f)).some((f) => /function public\.(empezar_de_cero|panel_|logro_)/.test(fs.readFileSync(`supabase/migrations/${f}`, 'utf8'))), 'esta tanda no añade migración: ninguna posterior a la 0091 rehace las funciones del panel, los logros ni empezar_de_cero')

console.log(`\nLa prueba de la V36 (servidor): ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
process.exit(fallos.length ? 1 : 0)
