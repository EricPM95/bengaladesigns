// LZ1, apartado 1 (agente A): lo atado a Roma. Comprueba que el destino sale de los datos y que Roma sigue igual.
//   node scripts/destino/pruebaTandaLZ1_A.mjs
// No usa navegador ni el servidor encendido: importa los módulos y levanta un Express propio en un puerto libre.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import http from 'node:http'
import express from 'express'
import { build } from 'esbuild'
import { leerDestinosCurados, registrarRutasDestinosCurados, DESTINOS_OCULTOS } from '../../server/destinosCurados.js'
import { findPipelineV2Key, respuestasConFreeTour } from '../../server/routeAlgorithm.js'
import { datosDelDestino } from '../../server/civitatis/servicio.js'
import { sunsetMinutesOn } from '../../shared/routeEngine/sunset.js'
import { crearGuardianDestinosOcultos } from '../../server/destinoOculto.js'
import { resumenDeVuelta } from '../../shared/routeEngine/vueltaDia.js'

const fallos = []
let comprobaciones = 0
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) fallos.push({ regla, texto })
}
const leerTexto = (ruta) => fs.readFileSync(ruta, 'utf8')

// ── El código del móvil (TypeScript) se empaqueta a una carpeta temporal ────────────────────────────────────────
const carpeta = fs.mkdtempSync(path.join(os.tmpdir(), 'lz1a-'))
const abs = (r) => path.resolve(r).replace(/\\/g, '/')
fs.writeFileSync(
  path.join(carpeta, 'entrada.ts'),
  `export { zonaDelDestino, zonaDelDestinoORoma } from '${abs('src/lib/zonaHoraria.ts')}'\nexport { hoyEnElDestino } from '${abs('src/lib/viajeEmpezado.ts')}'\nexport { ocasoDelDia } from '${abs('src/lib/avisoDeHorario.ts')}'\n`,
)
await build({ entryPoints: [path.join(carpeta, 'entrada.ts')], outfile: path.join(carpeta, 'sal.mjs'), bundle: true, format: 'esm', platform: 'node', logLevel: 'silent', define: { 'import.meta.env': '{}' } })
const movil = await import('file:///' + path.join(carpeta, 'sal.mjs').replace(/\\/g, '/'))

// ── 1. La zona horaria ────────────────────────────────────────────────────────────────────────────────────
const roma = JSON.parse(leerTexto('data/pipeline_v2/roma.json'))
debe(movil.zonaDelDestino('Roma') === 'Europe/Rome' && movil.zonaDelDestino('Roma') === roma.timezone, '1a', 'Roma: Europe/Rome, la misma que roma.json › timezone')
debe(movil.zonaDelDestino('Lanzarote') === 'Atlantic/Canary' && movil.zonaDelDestino(' lanzarote ') === 'Atlantic/Canary', '1b', 'Lanzarote: Atlantic/Canary')
debe(movil.zonaDelDestino('Narnia') === null && movil.zonaDelDestino('') === null && movil.zonaDelDestino(null) === null, '1c', 'un destino que no está en la tabla: null (no se inventa)')
debe(movil.zonaDelDestinoORoma(undefined) === 'Europe/Rome' && movil.zonaDelDestinoORoma('Narnia') === 'Europe/Rome', '1d', 'sin destino conocido, Roma como siempre')
if (fs.existsSync('data/pipeline_v2/lanzarote.json')) {
  const lz = JSON.parse(leerTexto('data/pipeline_v2/lanzarote.json'))
  debe(lz.timezone === 'Atlantic/Canary', '1e', `lanzarote.json › timezone es Atlantic/Canary (${lz.timezone})`)
}
// «Hoy» en el destino: a las 23:30 UTC del 15 de diciembre, en Canarias (UTC+0 en invierno) sigue siendo 15; en Roma ya es 16.
const ahora = new Date('2026-12-15T23:30:00Z')
debe(movil.hoyEnElDestino('Lanzarote', ahora) === '2026-12-15' && movil.hoyEnElDestino('Roma', ahora) === '2026-12-16', '1f', 'el día de hoy se mira en la zona del destino (Lanzarote 15, Roma 16)')

// ── 2. La puesta de sol con la zona del destino ───────────────────────────────────────────────────────────
const colosseo = { lat: 41.89, lng: 12.49 }
const timanfaya = { lat: 29.0, lng: -13.75 }
const viejo = sunsetMinutesOn('2026-06-15', [colosseo.lat, colosseo.lng], 'Europe/Rome')
debe(movil.ocasoDelDia('2026-06-15', null, colosseo) === viejo && movil.ocasoDelDia('2026-06-15', null, colosseo, 'Roma') === viejo, '2a', `Roma: la puesta de sol sale igual que antes (${viejo})`)
const lzOcaso = movil.ocasoDelDia('2026-06-15', null, timanfaya, 'Lanzarote')
const lzComoSiFueraRoma = sunsetMinutesOn('2026-06-15', [timanfaya.lat, timanfaya.lng], 'Europe/Rome')
debe(lzOcaso === sunsetMinutesOn('2026-06-15', [timanfaya.lat, timanfaya.lng], 'Atlantic/Canary'), '2b', 'Lanzarote: la puesta de sol con la hora de Canarias')
debe(lzOcaso != null && lzComoSiFueraRoma != null && lzComoSiFueraRoma - lzOcaso === 60, '2c', `Lanzarote con la hora de Roma saldría una hora tarde (${lzOcaso} frente a ${lzComoSiFueraRoma})`)
debe(lzOcaso > 20 * 60 && lzOcaso < 21 * 60 + 30, '2d', `a mediados de junio el sol se pone en Lanzarote entre las 20:00 y las 21:30 (${lzOcaso})`)

// ── 3. Lanzarote, oculto salvo para el administrador ───────────────────────────────────────────────────────
const falso = path.join(carpeta, 'data')
for (const clave of ['roma', 'lanzarote']) {
  fs.mkdirSync(path.join(falso, 'dias', clave), { recursive: true })
  fs.mkdirSync(path.join(falso, 'pipeline_v2'), { recursive: true })
  fs.mkdirSync(path.join(falso, 'logros'), { recursive: true })
  fs.writeFileSync(path.join(falso, 'dias', clave, 'listas.json'), '{}')
  fs.writeFileSync(path.join(falso, 'dias', clave, '_mapa.json'), JSON.stringify({ lat: clave === 'roma' ? 41.9 : 29.0, lng: clave === 'roma' ? 12.5 : -13.6, iso: clave === 'roma' ? 'it' : 'es' }))
  fs.writeFileSync(path.join(falso, 'pipeline_v2', `${clave}.json`), JSON.stringify({ destination: clave === 'roma' ? 'Roma' : 'Lanzarote', country: clave === 'roma' ? 'Italia' : 'España' }))
  fs.writeFileSync(path.join(falso, 'logros', `${clave}.json`), JSON.stringify({ ciudad: clave === 'roma' ? 'Roma' : 'Lanzarote' }))
}
const nombres = (l) => l.map((d) => d.nombre)
debe(DESTINOS_OCULTOS.has('lanzarote'), '3a', 'Lanzarote está en la lista de destinos ocultos')
debe(JSON.stringify(nombres(leerDestinosCurados(falso))) === '["Roma"]', '3b', 'sin ser administrador: solo Roma')
debe(JSON.stringify(nombres(leerDestinosCurados(falso, { esAdmin: true }))) === '["Lanzarote","Roma"]', '3c', 'el administrador ve también Lanzarote')
debe(JSON.stringify(nombres(leerDestinosCurados(falso, { ocultos: new Set() }))) === '["Lanzarote","Roma"]', '3d', 'quitándolo de la lista de ocultos, lo ve todo el mundo (el día que Eric lo diga)')
// la lista real de la app: Lanzarote no sale para quien no es administrador, esté o no escrito
debe(!nombres(leerDestinosCurados(path.resolve('data'))).includes('Lanzarote'), '3e', 'la lista real de la app, sin administrador, no lleva Lanzarote')

// la ruta de verdad, con un Express propio: la cabecera x-admin hace de «es administrador»
const app = express()
registrarRutasDestinosCurados(app, falso, { esAdminDe: async (req) => req.headers['x-admin'] === '1' })
const app2 = express()
registrarRutasDestinosCurados(app2, falso) // sin mecanismo de administrador: nadie lo es
const escuchar = (a) => new Promise((res) => { const s = http.createServer(a).listen(0, () => res(s)) })
const s1 = await escuchar(app)
const s2 = await escuchar(app2)
const pedir = async (s, cabeceras = {}) => {
  const r = await fetch(`http://127.0.0.1:${s.address().port}/api/destinos-curados`, { headers: cabeceras })
  return { cabeceras: r.headers, cuerpo: await r.json() }
}
const publica = await pedir(s1)
const admin = await pedir(s1, { 'x-admin': '1' })
const otraVez = await pedir(s1)
const sinMecanismo = await pedir(s2, { 'x-admin': '1' })
debe(JSON.stringify(nombres(publica.cuerpo.destinos)) === '["Roma"]', '3f', 'GET /api/destinos-curados sin administrador: solo Roma')
debe(JSON.stringify(nombres(admin.cuerpo.destinos)) === '["Lanzarote","Roma"]', '3g', 'GET /api/destinos-curados del administrador: con Lanzarote')
debe(JSON.stringify(nombres(otraVez.cuerpo.destinos)) === '["Roma"]', '3h', 'después de la del administrador, la pública sigue sin Lanzarote (no se mezclan las listas)')
debe(/no-store/.test(admin.cabeceras.get('cache-control') ?? '') && /private/.test(admin.cabeceras.get('cache-control') ?? ''), '3i', 'la lista del administrador no se guarda en cachés compartidas')
debe(/public/.test(publica.cabeceras.get('cache-control') ?? '') && /authorization/i.test(publica.cabeceras.get('vary') ?? ''), '3j', 'la pública se cachea y avisa de que varía con la sesión (Vary: Authorization)')
debe(JSON.stringify(nombres(sinMecanismo.cuerpo.destinos)) === '["Roma"]', '3k', 'sin el mecanismo de administrador nadie lo es, aunque mande la cabecera')
const rota = await escuchar(express().use('/', (rq, rs, next) => next()))
rota.close()
const app3 = express()
registrarRutasDestinosCurados(app3, falso, { esAdminDe: async () => { throw new Error('Supabase caído') } })
const s3 = await escuchar(app3)
debe(JSON.stringify(nombres((await pedir(s3, { 'x-admin': '1' })).cuerpo.destinos)) === '["Roma"]', '3l', 'si falla la comprobación de administrador: la lista pública, nunca Lanzarote')
for (const s of [s1, s2, s3]) s.close()

// el móvil manda la sesión al pedir la lista (para que el servidor sepa si es administrador)
const cliente = leerTexto('src/lib/destinosCurados.ts')
debe(/Authorization: `Bearer \$\{token\}`/.test(cliente) && /fetch\('\/api\/destinos-curados', \{ headers \}\)/.test(cliente), '3m', 'el móvil pide la lista de destinos con la sesión en la cabecera')
debe(!/^import \{ supabase \}/m.test(cliente) && /import\('\.\/supabaseClient'\)/.test(cliente), '3n', 'sin cargar Supabase en la primera pantalla (se importa a demanda)')

// ── 4. Los datos del destino, sin lista escrita en el código ─────────────────────────────────────────────
debe(findPipelineV2Key('Roma') === 'roma' && findPipelineV2Key('Romania') === null, '4a', 'Roma se detecta como siempre y Romania no')
if (fs.existsSync('data/pipeline_v2/lanzarote.json')) debe(findPipelineV2Key('Lanzarote') === 'lanzarote' && findPipelineV2Key('Arrecife, Lanzarote') === 'lanzarote', '4b', 'Lanzarote se detecta por su nombre (hay datos)')
else debe(findPipelineV2Key('Lanzarote') === null, '4b', 'Lanzarote sin datos todavía: no se detecta y todo sigue como antes')
debe(datosDelDestino('Roma')?.destino?.id != null || datosDelDestino('roma') != null, '4c', 'Civitatis: los números de Roma se leen como siempre')
const servicioTexto = leerTexto('server/civitatis/servicio.js')
debe(/readdirSync\(new URL\('\.\.\/\.\.\/data\/civitatis\/'/.test(servicioTexto) && !/const DESTINOS = \{ roma:/.test(servicioTexto), '4d', 'Civitatis: los destinos se leen de data/civitatis/*.json, no de una lista en el código')
if (fs.existsSync('data/civitatis/lanzarote.json')) debe(datosDelDestino('Lanzarote') != null, '4e', 'Civitatis: Lanzarote tiene su archivo y se lee')

// ── 5. El Free Tour de cualquier destino ──────────────────────────────────────────────────────────────────
const conReserva = (nombre) => respuestasConFreeTour({ experiencesPositive: ['imprescindibles'] }, [{ placeNames: [nombre], time: '10:00', dateIso: '2026-12-01', dayNumber: 1 }])
debe(conReserva('Free Tour por Roma')?.freeTourDespues?.hora === '10:00', '5a', 'Free Tour por Roma: sigue funcionando como siempre')
debe(conReserva('Free Tour por Teguise')?.freeTourDespues?.hora === '10:00', '5b', 'Free Tour por Teguise (otro destino): también cuenta')
debe(conReserva('Coliseo')?.freeTourDespues == null && conReserva('Free Tour')?.freeTourDespues == null, '5c', 'una reserva que no es un Free Tour no lo pone')

// ── 6. Los textos de la vuelta dicen el destino de los datos ──────────────────────────────────────────────
const V = { datos: { modeKey: 'avion' }, lleva: 'dia_mas', madrugada: false }
const V2 = { ...V, lleva: 'manana' }
debe(resumenDeVuelta({ V, contenido: 'x' }).plantilla === '{dia} tienes casi un día entero por Roma antes de irte.', '6a', 'Roma: la frase de la vuelta, palabra por palabra como antes')
debe(resumenDeVuelta({ V: V2, contenido: 'x' }).plantilla === '{dia} tienes una última mañana por Roma antes de irte al aeropuerto.', '6b', 'Roma: la frase de la última mañana, como antes')
debe(resumenDeVuelta({ V, contenido: 'x', ciudad: 'Lanzarote' }).plantilla.includes('Lanzarote') && !resumenDeVuelta({ V: V2, contenido: 'x', ciudad: 'Lanzarote' }).plantilla.includes('Roma'), '6c', 'Lanzarote: la frase de la vuelta dice Lanzarote, no Roma')
const vuelta = leerTexto('shared/routeEngine/vueltaDia.js')
const lineasConRoma = vuelta.split('\n').filter((l) => /Roma/.test(l) && !/^\s*(\/\/|\*|\/\*)/.test(l) && !/^\s*\*/.test(l))
debe(lineasConRoma.every((l) => /\?\? 'Roma'|ciudad = 'Roma'/.test(l) || /pasar_a_roma/.test(l) === false), '6d', `vueltaDia.js: ningún texto con Roma escrito a mano (${lineasConRoma.length} líneas con la palabra, solo los valores por defecto)`)
const vacio = leerTexto('server/routeAlgorithm.js')
debe(/destData\?\.destination \?\? 'Roma'/.test(vacio) && !/where_it_fits: 'Otro día de tu viaje a Roma'/.test(vacio), '6e', 'routeAlgorithm.js: «Otro día de tu viaje a …» con el destino de los datos')

// ── 7. Los textos del móvil que decían «Roma» a mano ───────────────────────────────────────────────────
const quita = (r, ...malos) => malos.every((m) => !leerTexto(r).includes(m))
debe(quita('src/components/route/dayDetail/DayMenu.tsx', "'Volver a Roma'"), '7a', 'DayMenu: «Volver a {destino}»')
debe(quita('src/components/route/dayDetail/excursion/DayInterruptorSwitch.tsx', "option('roma', 'Roma'"), '7b', 'Interruptor del día 4: la etiqueta es el destino')
debe(quita('src/components/route/dayDetail/excursion/SwitchToRomaWarning.tsx', 'Si cambias a Roma', 'aria-label="Cambiar a Roma"'), '7c', 'Aviso al cambiar de la excursión: el destino')
debe(quita('src/components/route/dayDetail/excursion/ExcursionCardMeta.tsx', '`vuelta a Roma'), '7d', 'Tarjeta de la excursión: «vuelta a {destino}»')
debe(quita('src/components/route/dayDetail/excursion/ExcursionDayPage.tsx', 'Vuelves a Roma a las'), '7e', 'Página de la excursión: «Vuelves a {destino}»')
debe(quita('src/components/route/hoy/v2/HoyDuranteV2.tsx', 'restaurantes de Roma'), '7f', 'HOY de llegada tarde: «restaurantes de {destino}»')
debe(quita('src/hooks/useDuracionBillete.ts', "= 'Europe/Rome'") && quita('src/lib/avisoDeHorario.ts', "'Europe/Rome')"), '7g', 'Duración del billete y puesta de sol: sin la zona de Roma escrita')
debe(/replace\(\/Pase Roma\/g/.test(leerTexto('src/lib/billeteLeer.ts')), '7h', 'El aviso de «leer documentos es parte del Pase…» lleva el nombre del pase del destino')

// ── 8. El guardián: ninguna ruta /api acepta un destino oculto sin administrador ────────────────────────────
{
  const g = express()
  g.use(express.json())
  g.use('/api', crearGuardianDestinosOcultos({ ocultos: DESTINOS_OCULTOS, esAdminDe: async (req) => req.headers['x-admin'] === '1' }))
  g.all('/api/*', (req, res) => res.json({ ok: true, llego: true }))
  const sg = await escuchar(g)
  const url = (r) => `http://127.0.0.1:${sg.address().port}${r}`
  const post = async (ruta, cuerpo, cab = {}) => { const r = await fetch(url(ruta), { method: 'POST', headers: { 'Content-Type': 'application/json', ...cab }, body: JSON.stringify(cuerpo) }); return { estado: r.status, cuerpo: await r.json() } }
  for (const ruta of ['/api/generate-skeleton', '/api/generate-day-block', '/api/regenerate-route-experiences', '/api/curated-places-pool', '/api/destination-excursions', '/api/classify-destination']) {
    const sin = await post(ruta, { destination: 'Lanzarote', days: 3 })
    debe(sin.estado === 404 && sin.cuerpo.llego !== true, '8a', `${ruta} con «Lanzarote» y sin administrador: 404, no llega a la ruta`)
  }
  debe((await post('/api/generate-skeleton', { destination: 'Arrecife, Lanzarote' })).estado === 404, '8b', 'también «Arrecife, Lanzarote» y mayúsculas/acentos distintos')
  debe((await post('/api/generate-skeleton', { destination: 'LANZAROTE' })).estado === 404 && (await post('/api/zona-turistica', { destino: 'lanzarote', zona_bruta: 'x' })).estado === 404, '8c', 'el campo «destino» y las mayúsculas también')
  debe((await post('/api/generate-skeleton', { answers: { destination: 'Lanzarote' } })).estado === 404 && (await post('/api/x', { route: { destination: 'Lanzarote' } })).estado === 404, '8d', 'el destino dentro de answers o de route también')
  const q = await fetch(url('/api/civitatis/horas?destino=Lanzarote'))
  debe(q.status === 404, '8e', 'el destino en la consulta (GET) también')
  const ad = await post('/api/generate-skeleton', { destination: 'Lanzarote' }, { 'x-admin': '1' })
  debe(ad.estado === 200 && ad.cuerpo.llego === true, '8f', 'con administrador, pasa')
  debe((await post('/api/generate-skeleton', { destination: 'Roma', days: 3 })).cuerpo.llego === true && (await post('/api/generate-skeleton', { destination: 'Romania' })).cuerpo.llego === true && (await post('/api/arrival-info', { destination: 'Roma' })).cuerpo.llego === true, '8g', 'Roma (y cualquier otro destino) pasa como siempre')
  debe((await post('/api/generate-skeleton', { destination: 'Lanzarote' })).cuerpo.error === 'Not found' && !/lanzarote|oculto/i.test(JSON.stringify((await post('/api/generate-skeleton', { destination: 'Lanzarote' })).cuerpo)), '8h', 'la respuesta no revela que el destino existe')
  const g2 = express()
  g2.use(express.json())
  g2.use('/api', crearGuardianDestinosOcultos({ ocultos: DESTINOS_OCULTOS, esAdminDe: async () => { throw new Error('caído') } }))
  g2.all('/api/*', (req, res) => res.json({ llego: true }))
  const sg2 = await escuchar(g2)
  const r2 = await fetch(`http://127.0.0.1:${sg2.address().port}/api/x`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ destination: 'Lanzarote' }) })
  debe(r2.status === 404, '8i', 'si falla la comprobación del administrador: 404')
  const g3 = express()
  g3.use(express.json())
  g3.use('/api', crearGuardianDestinosOcultos({ ocultos: new Set(), esAdminDe: async () => false }))
  g3.all('/api/*', (req, res) => res.json({ llego: true }))
  const sg3 = await escuchar(g3)
  const r3 = await fetch(`http://127.0.0.1:${sg3.address().port}/api/x`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ destination: 'Lanzarote' }) })
  debe(r3.status === 200, '8j', 'sin destinos ocultos (el día que Eric lo abra), pasa para todos')
  for (const x of [sg, sg2, sg3]) x.close()
  const idx = leerTexto('server/index.js')
  debe(idx.includes("app.use('/api', crearGuardianDestinosOcultos") && idx.indexOf('crearGuardianDestinosOcultos({') < idx.indexOf("app.post('/api/classify-destination'"), '8k', 'el guardián está montado antes de todas las rutas /api')
}

fs.rmSync(carpeta, { recursive: true, force: true })
console.log(`pruebaTandaLZ1_A: ${comprobaciones} comprobaciones, ${fallos.length} fallos`)
for (const f of fallos) console.log(`  FALLO ${f.regla}: ${f.texto}`)
process.exitCode = fallos.length ? 1 : 0
setTimeout(() => process.exit(process.exitCode), 200)
