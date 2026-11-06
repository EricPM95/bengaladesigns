// ARREGLO_FOTOS_VIAJE (6-nov): un viaje creado ANTES de las fotos nuevas las enseña; una foto cambiada cambia de dirección; el service worker no se queda con la copia vieja.
// Necesita la API en marcha (la de siempre, 8787); no usa navegador ni Vite.   node scripts/destino/pruebaArregloFotosViaje.mjs
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import crypto from 'node:crypto'
import { pathToFileURL } from 'node:url'
import { build } from 'esbuild'

const API = process.env.API ?? 'http://localhost:8787'
const fallos = []
let n = 0
const debe = (cond, regla, texto) => {
  n++
  if (!cond) fallos.push({ regla, texto })
}
const json = (r) => JSON.parse(fs.readFileSync(r, 'utf8'))

// El cliente de verdad (TypeScript) empaquetado a un archivo temporal.
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fotosviaje-'))
const salida = path.join(tmp, 'refrescar.mjs')
await build({ entryPoints: ['src/lib/refrescarFotosViaje.ts'], bundle: true, platform: 'node', format: 'esm', outfile: salida, logLevel: 'silent' })
const { fotosNuevasDelViaje, conLasFotosNuevas } = await import(pathToFileURL(salida).href)
const pedir = (u, o) => fetch(API + u, o)

try {
  // ── 1. El viaje de Eric, creado ANTES de las fotos nuevas (fotos de Wikipedia guardadas) ──
  const vieja = json('docs/dias/_hoy3_ruta_eric.json').route
  const antes = vieja.days.flatMap((d) => d.stops).filter((s) => !s.isBreak && !s.isArrival)
  debe(antes.some((s) => /wikimedia|unsplash/.test(s.photoUrl ?? '')), 'V0', 'el viaje de prueba no tiene fotos viejas: no prueba nada')
  const cambios = await fotosNuevasDelViaje(vieja, pedir)
  debe(cambios.size > 0, 'V1', 'no cambia ninguna foto de un viaje con las fotos viejas')
  const nueva = conLasFotosNuevas(vieja, cambios)
  debe(nueva !== vieja && vieja.days[0].stops[0].photoUrl === antes[0]?.photoUrl, 'V2', 'la ruta guardada no se debe mutar')
  const despues = nueva.days.flatMap((d) => d.stops).filter((s) => !s.isBreak && !s.isArrival && !s.fixedPhotoUrl && !(s.isFreeWalk && !s.photoName))
  const malas = despues.filter((s) => s.photoUrl && !/^\/fotos\/lanzarote\/[a-z0-9_]+\.jpg\?v=[0-9a-f]{8}$/.test(s.photoUrl))
  debe(malas.length === 0, 'V3', `paradas de Lanzarote que siguen con una foto que no es nuestra: ${malas.map((s) => `${s.name} → ${s.photoUrl}`).join(' · ')}`)
  const foto = (parte) => despues.find((s) => new RegExp(parte, 'i').test(s.name))?.photoUrl ?? null
  debe(/^\/fotos\/lanzarote\/montanas_del_fuego\.jpg\?v=/.test(foto('Monta.as del Fuego') ?? ''), 'V4', `Timanfaya sin su foto (${foto('Monta.as del Fuego')})`)
  debe(/^\/fotos\/lanzarote\/haria_y_el_valle_de_las_mil_palmeras\.jpg\?v=/.test(foto('Har.a y el Valle') ?? ''), 'V5', `Haría sin su foto de pueblo con palmeras (${foto('Har.a y el Valle')})`)
  debe(!despues.some((s) => /Bandera|\.svg|mapa|map/i.test(s.photoUrl ?? '')), 'V6', 'queda un mapa, una bandera o un svg')
  const nombreSinFoto = despues.filter((s) => !s.photoUrl).map((s) => s.name)
  debe(nombreSinFoto.every((nom) => !/Timanfaya|Teguise|Jameos|Papagayo/i.test(nom)), 'V7', `paradas importantes sin foto: ${nombreSinFoto.join(', ')}`)
  console.log(`  (viaje de Eric: ${cambios.size} fotos cambiadas de ${despues.length} paradas; sin foto: ${nombreSinFoto.join(' · ') || 'ninguna'})`)

  // Un viaje con photoUrl viejos A MANO (la foto de antes con la dirección de antes) también se actualiza.
  const diaT = vieja.days.find((d) => d.stops.some((s) => /Monta.as del Fuego/i.test(s.name)))
  const a_mano = { ...vieja, days: [{ ...diaT, stops: [{ ...diaT.stops.find((s) => /Monta.as del Fuego/i.test(s.name)), photoUrl: '/fotos/lanzarote/montanas_del_fuego.jpg?v=h4k2' }] }] }
  const c2 = await fotosNuevasDelViaje(a_mano, pedir)
  debe([...c2.values()].some((u) => /montanas_del_fuego\.jpg\?v=[0-9a-f]{8}$/.test(u)), 'V8', 'la foto vieja guardada con su ?v= de antes no se actualiza')

  // ── 2. Una foto cambiada con el MISMO nombre cambia de dirección: la versión es el contenido, no la fecha del archivo ──
  const tabla = json('data/dias/lanzarote/_fotos.json')
  const vistas = new Set()
  let malV = 0
  for (const f of tabla.fotos.filter((x) => x.origen === 'Eric')) {
    const r = (await (await pedir('/api/fotos-viaje', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: [{ name: f.lugares[0], city: 'Lanzarote' }] }) })).json()).resultados[0]
    const esperado = crypto.createHash('sha1').update(fs.readFileSync(`public/fotos/lanzarote/${f.archivo}`)).digest('hex').slice(0, 8)
    if (r?.photo_source !== 'propia' || !r.photo_url.endsWith(`?v=${esperado}`)) malV++
    vistas.add(esperado)
  }
  debe(malV === 0, 'V9', `${malV} fotos de Eric con una versión que no es el resumen de su contenido`)
  debe(vistas.size >= 20, 'V10', 'las versiones no distinguen unas fotos de otras')
  const codigo = fs.readFileSync('server/index.js', 'utf8')
  const f = /function versionedPhotoUrl\(url\) \{[\s\S]*?\n\}/.exec(codigo)?.[0] ?? ''
  debe(/createHash\('sha1'\)\.update\(readFileSync/.test(f) && !/mtimeMs \/ 1000\)\.toString\(36\)/.test(f), 'V11', 'versionedPhotoUrl debe usar el contenido del archivo, no la fecha')

  // ── 3. Roma: nada cambia salvo la dirección con versión ──
  const roma = json('data/pipeline_v2/roma.json')
  const restaurante = roma.restaurants?.[0]?.name
  const ruta = {
    answers: { dateRange: { start: '2026-12-01', end: '2026-12-02' } },
    days: [{ id: 'd1', dayNumber: 1, city: 'Roma', stops: [
      { id: 'a', name: 'Coliseo', photoUrl: '/fotos/roma/dia_coliseo.jpg?v=viejo' },
      { id: 'b', name: 'Un sitio que no existe en nuestros datos', photoUrl: 'https://upload.wikimedia.org/x.jpg' },
      { id: 'c', name: restaurante, photoUrl: 'https://upload.wikimedia.org/restaurante.jpg' },
      { id: 'd', name: 'Coliseo', photoUrl: '/fotos/roma/dia_coliseo.jpg?v=viejo' },
      { id: 'e', name: 'Free tour', photoUrl: '/fotos/roma/fija.jpg', fixedPhotoUrl: '/fotos/roma/fija.jpg' },
    ] }],
  }
  const cr = await fotosNuevasDelViaje(ruta, pedir)
  debe(/^\/fotos\/roma\/dia_coliseo\.jpg\?v=[0-9a-f]{8}$/.test(cr.get('a') ?? ''), 'R1', `Roma: el Coliseo debe seguir con su foto de siempre y la versión nueva (${cr.get('a')})`)
  debe(!cr.has('b'), 'R2', 'Roma: una foto de Wikipedia de un sitio sin foto propia se queda como estaba')
  debe(cr.get('c') === '', 'R3', 'Roma: un restaurante sigue sin foto (como al crear el viaje)')
  debe(!cr.has('d'), 'R4', 'Roma: la misma foto no sale dos veces el mismo día')
  debe(!cr.has('e'), 'R5', 'Roma: la foto fija (Free Tour) no se toca')

  // ── 4. El servicio worker: foto con versión → copia primero; sin versión → red primero; y la copia de antes se tira ──
  const sw = fs.readFileSync('public/sw.js', 'utf8')
  const q = new Function('self', `${sw.slice(sw.indexOf('const CACHE'), sw.indexOf("self.queHacerConUnaPeticion"))}; return queHacer`)({ location: { hostname: 'trazo.app', search: '' } })
  const hacer = (u, mode = 'no-cors') => q(new URL(u), { method: 'GET', mode }, 'https://trazo.app')
  debe(hacer('https://trazo.app/fotos/lanzarote/montanas_del_fuego.jpg?v=4b5ab760') === 'activo', 'S1', 'foto con ?v=: copia primero')
  debe(hacer('https://trazo.app/fotos/lanzarote/montanas_del_fuego.jpg') === 'foto', 'S2', 'foto sin versión: red primero')
  debe(hacer('https://trazo.app/icons/icon-192.png') === 'fuente' && hacer('https://trazo.app/api/x') === null, 'S3', 'lo demás, como antes')
  debe(/const CACHE = 'trazo-web-v2'/.test(sw), 'S4', 'el service worker debe cambiar de caché para tirar las fotos viejas guardadas')
  const pp = fs.readFileSync('src/lib/placePhoto.ts', 'utf8')
  debe(/STORE_PREFIX = 'photo:v4:'/.test(pp) && /poolphoto:v3:/.test(pp), 'S5', 'lo guardado en el navegador (24 h) de antes se descarta')
  const hid = fs.readFileSync('src/store/useRouteStore.ts', 'utf8')
  debe(/fotosNuevasDelViaje\(abierto\)/.test(hid), 'S6', 'hydrateTrip debe refrescar las fotos al abrir un viaje')
} finally {
  fs.rmSync(tmp, { recursive: true, force: true })
}

console.log(`${n} comprobaciones, ${fallos.length} fallos`)
for (const f of fallos) console.log(`  FALLO ${f.regla}: ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
