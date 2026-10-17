// La prueba de la Tanda 6y2, punto 4 (las fotos): las fotos equivocadas de Wikipedia no salen, el crédito sobre la esquina de la foto grande de
// las excursiones, 0 líneas de crédito en las fotos pequeñas y la página de candidatas.
//   node scripts/destino/pruebaFase6y2_fotos.mjs                              (sin servidor: todo menos lo que responde el servidor de verdad)
//   SERVIDOR=http://localhost:8799 node scripts/destino/pruebaFase6y2_fotos.mjs   (con tu servidor encendido, comprueba también eso)
// Da fallo si:
//   1. `fotos_rechazadas` (data/dias/roma/_fotos.json) no tiene los 8 sitios, cada uno con su motivo, o `fotoOculta` no los oculta (también de noche);
//   2. algún camino del servidor puede buscar la foto de un sitio rechazado (/api/place-photo, /api/pool-photos, la caché, la de noche, la de su zona);
//   3. (con servidor) un sitio rechazado responde con foto (de Wikipedia, de Unsplash o de su zona), o los demás dejan de salir como siempre
//      (propias, Unsplash, Wikipedia con crédito);
//   4. el cliente pinta algo para un sitio sin foto (imagen rota o vacía) o deja guardado en el navegador lo de antes (v2);
//   5. la cabecera de las excursiones no lleva el crédito sobre la esquina (solo con crédito; las propias nunca) o lo formatea aparte de la ficha;
//   6. alguna foto pequeña (tarjetas del explorador, selector, «Añadir al día», ExplorePanel) lleva línea de crédito, o «Créditos» deja de ser cierto;
//   7. la página FOTOS_ROMA_CANDIDATAS.html no existe o algún sitio no tiene 3 candidatas (o su aviso de «sin candidatas buenas»).
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'
import { build } from 'esbuild'

const require = createRequire(import.meta.url)
let fallos = 0
let comprobaciones = 0
const ok = (cond, texto) => {
  comprobaciones++
  if (!cond) {
    fallos++
    console.log(`  ✗ ${texto}`)
  }
}
const leer = (p) => fs.readFileSync(p, 'utf8')
const carpeta = fs.mkdtempSync(path.join(os.tmpdir(), 'prueba-6y2-fotos-'))
async function empaquetar(entrada, nombre, extra = {}) {
  const salida = path.join(carpeta, `${nombre}.cjs`)
  await build({
    entryPoints: [entrada],
    outfile: salida,
    bundle: true,
    platform: 'node',
    format: 'cjs',
    logLevel: 'silent',
    define: { 'import.meta.env.DEV': 'true', 'import.meta.env.VITE_VERCEL_ENV': 'undefined', 'import.meta.env.VITE_MAPBOX_TOKEN': '""' },
    ...extra,
  })
  return require(salida)
}

const OCHO = [
  'Cripta de los Capuchinos',
  'Trastevere al atardecer',
  'Via dei Coronari',
  'Borgo Pio',
  'Excursión a Florencia y Pisa',
  'Excursión a Nápoles y Pompeya en tren',
  'Excursión a la Costa Amalfitana',
  'Excursión a Florencia en tren de alta velocidad',
]

// ── 1. La lista y la regla ──
console.log('La lista de fotos rechazadas')
const tabla = JSON.parse(leer('data/dias/roma/_fotos.json'))
{
  const lista = tabla.fotos_rechazadas
  ok(Array.isArray(lista) && lista.length >= OCHO.length, `1a fotos_rechazadas no tiene al menos los ${OCHO.length} sitios (tiene ${lista?.length})`)
  ok(OCHO.every((n) => lista?.some((r) => r.lugar === n)), `1b faltan en la lista: ${OCHO.filter((n) => !lista?.some((r) => r.lugar === n)).join(' | ')}`)
  ok((lista ?? []).every((r) => typeof r.motivo === 'string' && r.motivo.trim().length > 20), '1c algún sitio no lleva su motivo escrito')
  ok(typeof tabla._fotos_rechazadas === 'string' && /Eric/.test(tabla._fotos_rechazadas), '1d falta la explicación _fotos_rechazadas')
  ok(!OCHO.some((n) => (tabla.fotos ?? []).some((f) => (f.lugares ?? []).includes(n))), '1e un sitio rechazado tiene ya foto propia en `fotos` (entonces no hace falta rechazarlo)')
  const W = await import(new URL('../../server/engine/writtenDays.js', import.meta.url).href)
  ok(OCHO.every((n) => W.fotoOculta('roma', n)), `1f fotoOculta no oculta: ${OCHO.filter((n) => !W.fotoOculta('roma', n)).join(' | ')}`)
  ok(W.fotoOculta('roma', 'Trastevere al atardecer (noche)') && W.fotoOculta('roma', 'Borgo Pio de noche'), '1g fotoOculta no oculta la versión de noche')
  ok(!W.fotoOculta('roma', 'Plaza Colonna') && !W.fotoOculta('roma', 'Coliseo') && !W.fotoOculta('roma', 'Isla Tiberina') && !W.fotoOculta('roma', 'Excursión a Tívoli'), '1h fotoOculta oculta un sitio que no está en la lista')
  ok((tabla.sin_foto ?? []).every((n) => W.fotoOculta('roma', n)) && (tabla.sin_foto ?? []).length >= 2, '1i los de `sin_foto` han dejado de ocultarse')
  ok(!W.fotoOculta('noexiste', 'Borgo Pio') && !W.fotoOculta('roma', ''), '1j fotoOculta oculta sin destino o sin nombre')
}

// ── 2. El servidor, por dentro ──
console.log('El servidor, por dentro')
{
  const s = leer('server/index.js')
  const f = s.indexOf('async function resolvePlacePhoto')
  const cuerpo = s.slice(f, s.indexOf('const NIGHT_WORDS'))
  ok(/fotoOculta/.test(s.slice(f, f + 500)) && cuerpo.indexOf('fotoOculta') < cuerpo.indexOf('place_photo_cache') && cuerpo.indexOf('fotoOculta') < cuerpo.indexOf('searchUnsplashPhoto'), '2a resolvePlacePhoto busca en la caché o en Unsplash antes de mirar si el sitio va sin foto')
  const n = s.indexOf('async function resolveNightPhoto')
  ok(/fotoOculta/.test(s.slice(n, n + 400)), '2b la foto de noche no mira si el sitio va sin foto')
  const pool = s.slice(s.indexOf("app.post('/api/pool-photos'"), s.indexOf('function withWikimediaCredit'))
  ok(/isHidden = \(name\) => fotoOculta\(/.test(pool) && pool.indexOf('isHidden(name)') < pool.indexOf('place_photo_cache'), '2c /api/pool-photos no descarta los sitios sin foto antes de la caché')
  const ruta = s.slice(s.indexOf("app.post('/api/place-photo'"), s.indexOf('"Quiero entrar"'))
  ok(/fotoOculta\(findPipelineV2Key\(city\)/.test(ruta) && ruta.indexOf('fotoOculta') < ruta.indexOf('nightBaseOf(') && (ruta.indexOf('zonePhotoFor(') === -1 || ruta.indexOf('fotoOculta') < ruta.indexOf('zonePhotoFor(')), '2d /api/place-photo no corta antes de la foto de noche y la de la zona')
  ok(ruta.indexOf('ownPhotoFor(') < ruta.indexOf('fotoOculta('), '2e una foto propia ya no va antes que el «sin foto»')
  ok(!/\.sin_foto/.test(s.replace(/\/\/.*$/gm, '')), '2f queda una regla de sin_foto fuera de fotoOculta (dos sitios para lo mismo)')
}

// ── 3. Lo que responde el servidor de verdad ──
console.log('Lo que responde el servidor')
const SERVIDOR = process.env.SERVIDOR
if (!SERVIDOR) {
  console.log('  (sin SERVIDOR: ejecútala con SERVIDOR=http://localhost:8799 para comprobar lo que responde)')
} else {
  const pedir = async (name, extra = {}) => (await fetch(`${SERVIDOR}/api/place-photo`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name, city: 'Roma', ...extra }) })).json()
  const sinFoto = []
  for (const nombre of [...OCHO, 'Trastevere al atardecer (noche)', 'Borgo Pio de noche']) {
    const j = await pedir(nombre)
    if (j.photo_source !== 'none' || j.photo_url || j.unsplash_small || j.photo_zone) sinFoto.push(`${nombre} -> ${j.photo_source}`)
  }
  ok(sinFoto.length === 0, `3a sitios rechazados que responden con foto: ${sinFoto.join(' | ')}`)
  const lote = await (await fetch(`${SERVIDOR}/api/pool-photos`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ destination: 'Roma', names: OCHO }) })).json()
  ok(Object.keys(lote.photos ?? {}).length === 0, `3b /api/pool-photos da foto a: ${Object.keys(lote.photos ?? {}).join(' | ')}`)
  const forzada = await pedir('Borgo Pio', { force: true, wikipedia_title: 'Passetto di Borgo' })
  ok(forzada.photo_source === 'none', '3c con force y un título de Wikipedia, Borgo Pio sigue buscando')
  // Los demás siguen igual.
  const colonna = await pedir('Plaza Colonna')
  ok(colonna.photo_source === 'wikipedia' && colonna.photo_credit?.autor && colonna.photo_credit?.licencia, `3d Plaza Colonna ya no sale de Wikipedia con su crédito: ${JSON.stringify(colonna.photo_source)}`)
  const coliseo = await pedir('Coliseo')
  ok(coliseo.photo_source === 'propia' && /^\/fotos\/roma\//.test(coliseo.photo_url), '3e el Coliseo ha dejado de salir con su foto propia')
  // Una de Unsplash: la primera del pool de Roma que salga de Unsplash (si no hay ninguna, falla).
  const roma = JSON.parse(leer('data/pipeline_v2/roma.json'))
  let unsplash = null
  for (const lugar of roma.places.map((p) => p.name)) {
    const j = await pedir(lugar)
    if (j.photo_source === 'unsplash') { unsplash = { lugar, j }; break }
  }
  ok(unsplash && unsplash.j.unsplash_photographer && /utm_source=/.test(unsplash.j.unsplash_photographer_url ?? ''), '3f no se encuentra ningún lugar de Roma con foto de Unsplash y su autor enlazado')
  // Una excursión que NO está rechazada sigue su camino de siempre (no es un efecto de la regla).
  const tivoli = await pedir('Excursión a Tívoli')
  ok(tivoli.photo_source !== undefined, '3g la excursión a Tívoli no responde')
}

// ── 4. El cliente: un sitio sin foto no pinta nada ──
console.log('El cliente')
{
  const almacen = new Map()
  almacen.set('photo:v2:viejo|roma|', JSON.stringify({ at: Date.now(), photo: { source: 'wikipedia', thumb: 'https://x/mala.jpg', small: 'https://x/mala.jpg', regular: 'https://x/mala.jpg', blurHash: null, attribution: null } }))
  almacen.set('poolphoto:v1:roma|borgo pio', JSON.stringify({ at: Date.now(), url: 'https://x/mala.jpg' }))
  const metodos = { getItem: (k) => almacen.get(k) ?? null, setItem: (k, v) => almacen.set(k, String(v)), removeItem: (k) => almacen.delete(k) }
  globalThis.localStorage = new Proxy({}, {
    get: (_t, p) => metodos[p],
    ownKeys: () => [...almacen.keys()],
    getOwnPropertyDescriptor: (_t, p) => (almacen.has(p) ? { enumerable: true, configurable: true, value: almacen.get(p) } : undefined),
  })
  globalThis.window = { location: { hostname: 'localhost', search: '' }, localStorage: globalThis.localStorage, sessionStorage: globalThis.localStorage }
  const P = await empaquetar('src/lib/placePhoto.ts', 'placePhoto')
  ok(!almacen.has('photo:v2:viejo|roma|') && !almacen.has('poolphoto:v1:roma|borgo pio'), '4a lo guardado en el navegador antes (v2 / poolphoto v1) sigue ahí: las fotos equivocadas volverían a salir 24 h')
  ok(P.getPoolPhoto('Roma', 'Borgo Pio') === null, '4b el pool lee todavía la foto de Borgo Pio guardada en el navegador')
  globalThis.fetch = async () => ({ ok: true, json: async () => ({ photo_source: 'none' }) })
  const sin = await P.fetchPlacePhotoDetail('Borgo Pio', 'Roma', null, null, false)
  const url = await P.fetchPlacePhoto('Borgo Pio', 'Roma')
  ok(sin === null && url === null, '4c un sitio sin foto no devuelve null en el cliente')
  // Lo que pinta quien recibe null.
  const ex = leer('src/components/route/excursions/ExcursionsPage.tsx')
  const cab = ex.slice(ex.indexOf('function ExcursionPhoto'), ex.indexOf('function ExcursionPhoto') + 1800)
  ok(!/<img/.test(cab) && /url \? \{ backgroundImage/.test(cab) && /bg-bg-hover/.test(cab), '4d la cabecera de excursiones pinta una imagen sin foto (hueco roto) en vez del recuadro neutro')
  const ficha = leer('src/components/route/dayDetail/StopDetailSheet.tsx')
  // (Tanda 6y4: la ficha nueva pinta la imagen solo si hay foto —`(foto) && <img …>`— sobre el recuadro neutro de la foto; antes era un ternario con el recuadro en la otra rama.)
  ok(/\(photo\?\.small \?\? stop\.photoUrl\) (\? \(\s*|&&\s*)<img/.test(ficha), '4e la ficha pinta una imagen aunque no haya foto')
  const exp = leer('src/components/route/placeExplorer/PlaceExplorerScreen.tsx')
  ok(/photo \? `url\("\$\{photo\}"\) center\/cover/.test(exp) && /export function placeholderPhoto\(_name: string\): string \{\s*return ''/.test(exp), '4f el explorador pinta una foto al azar (picsum) o una imagen rota cuando un sitio no tiene foto')
  const pool = leer('src/components/trazo/StepPool.tsx')
  ok(/\{photo && <img/.test(pool) && /photos\[nameOf\(key\)\] \? `center\/cover url/.test(pool), '4g el selector de lugares pinta una imagen aunque no haya foto')
  const panel = leer('src/components/route/ExplorePanel.tsx')
  ok(/const background = photo \? `url\(/.test(panel), '4h ExplorePanel pinta una imagen aunque no haya foto')
  const sheet = leer('src/components/route/freeDay/AddToDaySheet.tsx')
  ok(/photo \?\? placeholderPhoto\(/.test(sheet), '4i AddToDaySheet no usa el recuadro neutro')
}

// ── 5. El crédito sobre la esquina de la foto grande ──
console.log('El crédito en la cabecera de las excursiones')
{
  const ex = leer('src/components/route/excursions/ExcursionsPage.tsx')
  ok(/fetchPlacePhotoDetail\(excursion\.photoName \?\? excursion\.title, destination\)/.test(ex) && !/fetchPlacePhoto\(/.test(ex), '5a la cabecera no pide la foto con su crédito (fetchPlacePhotoDetail)')
  ok(/hayCreditoDeFoto\(photo\)/.test(ex) && /<FotoCredito/.test(ex), '5b la cabecera no pone el crédito solo cuando lo hay')
  ok(/absolute bottom-1\.5 right-1\.5/.test(ex) && /className="relative"/.test(ex), '5c el crédito no está sobre una esquina de la foto')
  const comp = leer('src/components/ui/FotoCredito.tsx')
  const ficha = leer('src/components/route/dayDetail/StopDetailSheet.tsx')
  ok(/<FotoCredito photo=\{photo\}[^>]*\/>/.test(ficha) && !/Foto de\{' '\}|Foto:\{' '\}/.test(ficha) && !/Foto de\{' '\}|Foto:\{' '\}/.test(ex), '5d la ficha o la cabecera formatean el crédito por su cuenta (un solo sitio: FotoCredito)')
  ok(/target="_blank" rel="noreferrer"/.test(comp), '5e los enlaces del crédito no se abren seguros')
  // Pintado de verdad: React a texto.
  const React = require('react')
  const { renderToStaticMarkup } = require('react-dom/server')
  const C = await empaquetar('src/components/ui/FotoCredito.tsx', 'fotoCredito', { jsx: 'automatic' })
  const pinta = (photo, props = {}) => renderToStaticMarkup(React.createElement(C.FotoCredito, { photo, ...props }))
  const base = { thumb: 'x', small: 'x', regular: 'x', blurHash: null }
  const wiki = { ...base, source: 'wikipedia', attribution: { photographer: 'Diego Delso', photographerUrl: 'https://commons.wikimedia.org/wiki/File:A.jpg', unsplashUrl: '', site: 'Wikimedia Commons', license: 'CC BY-SA 4.0' } }
  const uns = { ...base, source: 'unsplash', attribution: { photographer: 'Ana', photographerUrl: 'https://unsplash.com/@ana?utm_source=viajes_bengala', unsplashUrl: 'https://unsplash.com?utm_source=viajes_bengala' } }
  const propia = { ...base, source: 'propia', attribution: { photographer: 'Eric', photographerUrl: 'https://x', unsplashUrl: '', license: 'CC BY' } }
  const aMedias = { ...base, source: 'wikipedia', attribution: { photographer: 'Ana', photographerUrl: '', unsplashUrl: '', license: '' } }
  const sinAutor = { ...base, source: 'wikipedia', attribution: { photographer: '', photographerUrl: '', unsplashUrl: '', license: 'CC BY' } }
  const dominioPublico = { ...base, source: 'wikipedia', attribution: null }
  const mw = pinta(wiki)
  ok(/Foto:/.test(mw) && /Diego Delso<\/a>/.test(mw) && /· CC BY-SA 4\.0/.test(mw) && /href="https:\/\/commons\.wikimedia\.org\/wiki\/File:A\.jpg"/.test(mw), `5f Wikipedia con crédito no pinta «Foto: autor enlazado · licencia»: ${mw}`)
  const mu = pinta(uns)
  ok(/Foto de/.test(mu) && />Ana<\/a>/.test(mu) && />Unsplash<\/a>/.test(mu) && /utm_source=viajes_bengala/.test(mu), `5g Unsplash no pinta «Foto de autor en Unsplash» con utm: ${mu}`)
  ok(pinta(propia) === '' && pinta(aMedias) === '' && pinta(sinAutor) === '' && pinta(dominioPublico) === '' && pinta(null) === '', '5h una foto propia, a medias, sin autor, de dominio público o sin foto pinta un crédito')
  const esquina = pinta(wiki, { className: 'absolute bottom-1.5 right-1.5 text-[10px]' })
  ok(/class="absolute bottom-1\.5 right-1\.5 text-\[10px\]"/.test(esquina) && /Foto:/.test(esquina), '5i la esquina no admite su propia clase')
  ok(C.hayCreditoDeFoto(wiki) && C.hayCreditoDeFoto(uns) && !C.hayCreditoDeFoto(propia) && !C.hayCreditoDeFoto(aMedias) && !C.hayCreditoDeFoto(null), '5j hayCreditoDeFoto no decide como pinta')
}

// ── 6. Las fotos pequeñas: ninguna línea de crédito ──
console.log('Las fotos pequeñas')
{
  const pequenas = [
    'src/components/route/placeExplorer/PlaceExplorerScreen.tsx',
    'src/components/trazo/StepPool.tsx',
    'src/components/route/freeDay/AddToDaySheet.tsx',
    'src/components/route/ExplorePanel.tsx',
    'src/components/questionnaire/CuratedPlacesPool.tsx',
    'src/components/route/manualRoute/ManualAddStopsScreen.tsx',
  ]
  for (const f of pequenas) {
    const t = leer(f)
    ok(!/FotoCredito|hayCreditoDeFoto|\battribution\b|photographer|Foto de\b|Foto:\{' '\}|fetchPlacePhotoDetail/.test(t.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '')), `6a ${f} tiene una línea de crédito (o pide la ficha de la foto)`)
  }
  const { CREDITOS } = await empaquetar('src/lib/creditos.ts', 'creditos')
  const fotos = CREDITOS.find((c) => c.clave === 'fotos')
  ok(fotos && /ficha de la parada|bajo la foto/.test(fotos.texto) && /Wikipedia/.test(fotos.texto) && /Unsplash/.test(fotos.texto), '6b «Créditos» ya no dice dónde se ven los créditos')
  ok(/cabecera de las excursiones|esquina/.test(fotos.texto), '6c «Créditos» no dice que en la cabecera de las excursiones el crédito va en la esquina de la foto')
  ok(!/propias|nuestras|Eric/i.test(fotos.texto), '6d «Créditos» habla de las fotos propias')
}

// ── 7. La página de candidatas ──
console.log('La página de candidatas')
{
  const RUTA = 'docs/dias/FOTOS_ROMA_CANDIDATAS.html'
  ok(fs.existsSync(RUTA), `7a no existe ${RUTA}`)
  const html = fs.existsSync(RUTA) ? leer(RUTA) : ''
  const datos = JSON.parse(leer('data/dias/roma/_fotos_candidatas_6y2.json'))
  ok(OCHO.every((n) => datos.entradas.some((e) => e.lugar === n)), '7b los datos de candidatas no cubren los 8 sitios de la 6y2')
  for (const e of datos.entradas) {
    const seccion = html.slice(html.indexOf(`<h2>${e.lugar}</h2>`))
    const hasta = seccion.indexOf('</section>')
    const bloque = seccion.slice(0, hasta)
    const imgs = (bloque.match(/<img /g) ?? []).length
    ok(bloque.length > 0 && (imgs === 3 || (imgs === 0 && /Sin candidatas buenas/.test(bloque))), `7c ${e.lugar}: ${imgs} fotos y ${/Sin candidatas buenas/.test(bloque) ? 'con' : 'sin'} aviso (tiene que haber 3, o el aviso «Sin candidatas buenas»)`)
    if (imgs > 0) {
      ok((bloque.match(/https:\/\/images\.unsplash\.com\//g) ?? []).length === imgs, `7d ${e.lugar}: alguna foto no viene de images.unsplash.com`)
      ok((bloque.match(/utm_source=viajes_bengala/g) ?? []).length >= imgs * 2, `7e ${e.lugar}: faltan los enlaces con utm_source del autor y de la foto`)
      ok(e.candidatas.every((c) => c.autor && bloque.includes(c.autor) && c.autor_url.includes('unsplash.com/@')), `7f ${e.lugar}: alguna candidata sin nombre de autor o sin su enlace`)
    }
    ok(/Pon una tuya|pon una tuya/.test(bloque) || /Ninguna te convence/.test(bloque), `7g ${e.lugar}: no dice que Eric puede poner una suya`)
  }
  ok(!/<script/i.test(html) && !/<link[^>]+stylesheet/i.test(html) && /<style>/.test(html) && /lang="es"/.test(html), '7h la página no es autocontenida (scripts o hojas de estilo fuera)')
  ok(!/UNSPLASH_ACCESS_KEY|Client-ID/i.test(html) && !/UNSPLASH_ACCESS_KEY|Client-ID/i.test(leer('data/dias/roma/_fotos_candidatas_6y2.json')) && !/Client-ID/.test(leer('scripts/destino/fotosCandidatas6y2.mjs')), '7i la página, sus datos o su script llevan una clave de Unsplash')
}

console.log(`\n6y2 (fotos): ${comprobaciones} comprobaciones, ${fallos} fallos.`)
process.exitCode = fallos === 0 ? 0 : 1
