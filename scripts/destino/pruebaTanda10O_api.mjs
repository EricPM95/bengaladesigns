// Prueba de la Tanda 10O sobre la API de consulta: caché de 4 h como mucho, encendida solo para el administrador y datos tal cual. Node puro, sin navegador y sin red.
//   node scripts/destino/pruebaTanda10O_api.mjs
import fs from 'node:fs'
import { crearCache, ttlConTope, TTL_MAXIMO_SEGUNDOS } from '../../server/civitatis/cache.js'
import { crearServicioCivitatis, AJUSTES } from '../../server/civitatis/servicio.js'
import { modoDeCivitatis } from '../../server/civitatis/cliente.js'
import { crearPermisoAdminCivitatis } from '../../server/civitatis/permiso.js'
import { registrarRutasCivitatis } from '../../server/civitatis/rutas.js'
import { valoracionSobre10, fichaDeActividad } from '../../server/civitatis/mapeo.js'
import { esAdmin } from '../../server/logros/rutas.js'

const fallos = []
let n = 0
const debe = (cond, texto) => {
  n++
  if (!cond) fallos.push(texto)
}

/* 1. La caché, 4 horas como mucho */
console.log('1. Caché ≤ 4 h')
for (const k of ['catalogo', 'actividad', 'traslados', 'cerca', 'resolver']) debe(AJUSTES.ttl_segundos[k] <= 14400, `ajustes.${k} = ${AJUSTES.ttl_segundos[k]} (debe ser ≤ 14400)`)
debe(AJUSTES.ttl_segundos.calendario === 3600, 'el calendario debe quedarse en 3600 s')
debe(TTL_MAXIMO_SEGUNDOS === 14400 && ttlConTope(86400) === 14400 && ttlConTope(604800) === 14400 && ttlConTope(3600) === 3600 && ttlConTope(-5) === 0 && ttlConTope('x') === 14400, 'ttlConTope recorta a 14400')
const codigo = fs.readFileSync(new URL('../../server/civitatis/cache.js', import.meta.url), 'utf8')
debe(/19-oct/.test(codigo) && /14400/.test(codigo), 'el código de cache.js cita el tope de 14400 y el 19-oct')
{
  // Un valor mayor en la caché se recorta de verdad: con 7 días pedidos, a las 4 h y 1 s se vuelve a pedir.
  let t = 1_000_000
  const cache = crearCache({ ahora: () => t })
  let peticiones = 0
  const cargar = async () => (peticiones++, { ok: true, datos: { v: peticiones } })
  await cache.obtener('k', 604800, cargar)
  t += 14399 * 1000
  await cache.obtener('k', 604800, cargar)
  debe(peticiones === 1, 'a las 3 h 59 min 59 s sigue en caché')
  t += 2000
  await cache.obtener('k', 604800, cargar)
  debe(peticiones === 2, 'pasadas las 4 h se vuelve a pedir aunque el ajuste diga 7 días')
}
{
  // Y el servicio recorta unos ajustes viejos (24 h) igual.
  let t = 5_000_000
  let peticiones = 0
  const cliente = { entorno: 'sandbox', tieneClaves: true, pedir: async () => (peticiones++, { ok: true, datos: { id: 1, title: 'X', minimumPrice: 10, score: 9.1, reviews: 5, url: 'https://www.civitatis.com/es/roma/x/' } }) }
  const svc = crearServicioCivitatis({ activa: true, cliente, cache: crearCache({ ahora: () => t }), ajustes: { ...AJUSTES, ttl_segundos: { ...AJUSTES.ttl_segundos, actividad: 86400 } }, ahora: () => t })
  await svc.actividad(1)
  t += 14401 * 1000
  await svc.actividad(1)
  debe(peticiones === 2, 'el servicio recorta unos ajustes de 24 h a 4 h')
}

/* 2. Encendida solo para el administrador */
console.log('2. Interruptor solo-admin')
debe(modoDeCivitatis('true') === 'todos' && modoDeCivitatis('TRUE') === 'todos' && modoDeCivitatis('admin') === 'admin' && modoDeCivitatis('') === 'nadie' && modoDeCivitatis(undefined) === 'nadie' && modoDeCivitatis('false') === 'nadie' && modoDeCivitatis('1') === 'nadie', 'modoDeCivitatis')
{
  const env = { LOGROS_ADMIN_EMAILS: 'admin@ejemplo.test, otro@ejemplo.test' }
  const usuarios = { tok_admin: { id: 'u1', email: 'Admin@Ejemplo.test', is_anonymous: false }, tok_normal: { id: 'u2', email: 'gente@ejemplo.test', is_anonymous: false }, tok_anonimo: { id: 'u3', email: null, is_anonymous: true }, tok_admin_anonimo: { id: 'u4', email: 'admin@ejemplo.test', is_anonymous: true } }
  const quienEs = async (_admin, token) => usuarios[token] ?? null
  const tokenDe = (req) => req.headers?.authorization?.replace(/^Bearer /, '') || null
  const permiso = crearPermisoAdminCivitatis({ admin: {}, quienEs, esAdmin, tokenDe, env })
  const con = (token) => ({ headers: token ? { authorization: `Bearer ${token}` } : {}, query: {}, body: {} })
  debe((await permiso(con('tok_admin'))) === true, 'un email de LOGROS_ADMIN_EMAILS (aunque con otras mayúsculas) puede')
  debe((await permiso(con('tok_normal'))) === false, 'un email que no es admin NO puede')
  debe((await permiso(con('tok_anonimo'))) === false && (await permiso(con('tok_admin_anonimo'))) === false, 'una sesión anónima NO puede')
  debe((await permiso(con(null))) === false && (await permiso(con('tok_falso'))) === false, 'sin sesión o con un token que no vale, NO')
  debe((await crearPermisoAdminCivitatis({ admin: null, quienEs, esAdmin, tokenDe, env })(con('tok_admin'))) === false, 'sin la clave de servicio de Supabase, NO (cierra)')

  const cliente = { entorno: 'sandbox', tieneClaves: true, pedir: async () => ({ ok: true, datos: { schedule: [{ date: '2026-11-01', baseRatesId: ['a'] }], baseRates: { a: { hours: [{ hour: '10:00', quota: 8 }] } } } }) }
  const hacer = (opc) => crearServicioCivitatis({ activa: true, cliente, cache: crearCache(), ...opc })
  const svcAdmin = hacer({ permitida: permiso })
  debe((await svcAdmin.permitida(con('tok_admin'))) === true && (await svcAdmin.permitida(con('tok_normal'))) === false, 'servicio: admin sí, normal no')
  debe((await hacer({ permitida: async () => { throw new Error('x') } }).permitida(con('tok_admin'))) === false, 'servicio: si la comprobación lanza, NO')
  debe((await hacer({}).permitida(con(null))) === true, 'modo «true» (para todos): permitida sin mirar al usuario')
  debe((await crearServicioCivitatis({ activa: false, cliente, cache: crearCache() }).permitida(con('tok_admin'))) === false, 'modo vacío/false (para nadie): ni el admin')
  // Las rutas, de punta a punta con un app de mentira
  const rutas = new Map()
  registrarRutasCivitatis({ get: (p, h) => rutas.set(`GET ${p}`, h), post: (p, h) => rutas.set(`POST ${p}`, h) }, svcAdmin)
  const llamar = async (clave, req) => {
    const r = { cuerpo: null, json(c) { r.cuerpo = c; return r } }
    await rutas.get(clave)(req, r)
    return r.cuerpo
  }
  const q = { lugar: 'Coliseo', fecha: '2026-11-01' }
  const normal = await llamar('GET /api/civitatis/horas', { ...con('tok_normal'), query: q })
  const admin = await llamar('GET /api/civitatis/horas', { ...con('tok_admin'), query: q })
  debe(normal.ok === false && normal.motivo === 'apagada', 'ruta de horas: para un no-admin, «apagada» (la app hace lo de hoy)')
  debe(admin.ok === true && admin.datos.horas.length === 1, 'ruta de horas: para el admin, datos de la API')
  debe((await llamar('GET /api/civitatis/estado', con('tok_normal'))).activa === false && (await llamar('GET /api/civitatis/estado', con('tok_admin'))).activa === true, 'estado: false para el normal, true para el admin')
  debe(!JSON.stringify(await llamar('GET /api/civitatis/estado', con('tok_admin'))).match(/Bearer|tok_|password|secret/i), 'el estado no enseña nada secreto')
}
{
  // El endpoint de excursiones (index.js) decide así por petición.
  const src = fs.readFileSync(new URL('../../server/index.js', import.meta.url), 'utf8')
  debe(/req\.body\?\.civitatis === true && \(await civitatis\.permitida\(req\)\)/.test(src), 'index.js: /api/destination-excursions decide por petición (permitida)')
  debe(/modoDeCivitatis\(\) === 'admin'/.test(src), 'index.js: el modo admin cablea el permiso')
}

/* 3. Descripciones y valoraciones, tal cual */
console.log('3. Datos tal cual')
debe(valoracionSobre10(9.64) === 9.64 && valoracionSobre10(8.867924528) === 8.867924528 && valoracionSobre10(10) === 10 && valoracionSobre10(0) === null && valoracionSobre10(11) === null, 'la nota pasa sin redondear (0–10)')
{
  const bruto = { id: 2283, title: 'Excursión a Ostia Antica', minimumPrice: 52, score: 9.64, reviews: 1234, url: 'https://sandbox.civitatis.com/es/roma/ostia/', included: ['Guía oficial en español', 'Entradas incluidas', 'Seguro de la empresa Civitatis'], address: { shortAddress: 'Piazzale Ostiense (metro Pirámide)', latitude: 41.87, longitude: 12.48 } }
  const f = fichaDeActividad(bruto)
  debe(f.valoracion === 9.64 && f.opiniones === 1234, 'la ficha trae la nota y el número de opiniones exactos')
  debe(!('descripcion' in f) && !('resumen' in f), 'la ficha no inventa ni resume ninguna descripción')
  debe(f.incluye.length === 2 && f.incluye[0] === 'Guía oficial en español' && f.incluye[1] === 'Entradas incluidas', 'lo que incluye pasa igual; solo se quitan las líneas que nombran a la empresa (regla de la app)')
  const cliente = { entorno: 'sandbox', tieneClaves: true, pedir: async () => ({ ok: true, datos: bruto }) }
  const svc = crearServicioCivitatis({ activa: true, cliente, cache: crearCache() })
  const { opciones, enriquecidas } = await svc.enriquecerExcursiones('roma', [{ id: 'ostia_antica', name: 'Excursión a Ostia Antica', description: 'Texto nuestro intacto', rating: 4.8, review_count: 278, provisional_pricing: false }])
  debe(enriquecidas === 1 && opciones[0].rating === 9.64 && opciones[0].rating_max === 10 && opciones[0].review_count === 1234, 'la excursión enriquecida lleva la nota y las opiniones tal cual de la API')
  debe(opciones[0].description === 'Texto nuestro intacto', 'la descripción de la excursión no se toca')
}

console.log(`\nPrueba 10O de la API de consulta: ${n} comprobaciones · ${fallos.length} fallos`)
for (const f of fallos) console.log(`  FALLO ${f}`)
if (fallos.length > 0) process.exitCode = 1
