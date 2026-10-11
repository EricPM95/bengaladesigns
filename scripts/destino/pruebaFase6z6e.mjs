// La prueba de la Tanda 6z6e: las fotos propias sin crédito y la lluvia en la campana.
//   node scripts/destino/pruebaFase6z6e.mjs
// Da fallo si:
//   1. una foto propia (aunque los datos traigan autor) lleva crédito en la ficha o en «Créditos», o la ficha pinta un «Foto:» a medias; o una foto de Unsplash pierde su autor;
//   2. la campana no avisa de lluvia el día antes («Mañana llueve en Roma por la tarde») y el mismo día («Hoy llueve en Roma por la tarde»), una sola vez por día, en las dos versiones;
//   3. sin previsión (el servidor no responde o no llueve) sale algún aviso de lluvia.
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
const carpeta = fs.mkdtempSync(path.join(os.tmpdir(), 'prueba-6z6e-'))
async function empaquetar(entrada, nombre) {
  const salida = path.join(carpeta, `${nombre}.cjs`)
  await build({
    entryPoints: [entrada],
    outfile: salida,
    bundle: true,
    platform: 'node',
    format: 'cjs',
    logLevel: 'silent',
    define: { 'import.meta.env.DEV': 'true', 'import.meta.env.VITE_VERCEL_ENV': 'undefined', 'import.meta.env.VITE_MAPBOX_TOKEN': '""' },
  })
  return require(salida)
}

// ── 1. Fotos propias sin crédito ──
console.log('Fotos propias')
{
  const almacen = new Map()
  globalThis.localStorage = { getItem: (k) => almacen.get(k) ?? null, setItem: (k, v) => almacen.set(k, String(v)), removeItem: (k) => almacen.delete(k) }
  globalThis.window = { location: { hostname: 'localhost', search: '' }, localStorage: globalThis.localStorage, sessionStorage: globalThis.localStorage }
  const respuesta = (data) => async () => ({ ok: true, json: async () => data })
  const P = await empaquetar('src/lib/placePhoto.ts', 'placePhoto')
  // Una foto propia CON autor en los datos: sin crédito igual.
  globalThis.fetch = respuesta({ photo_source: 'propia', photo_url: '/fotos/roma/a.jpg', photo_small: '/fotos/roma/a_p.jpg', photo_credit: { autor: 'Alguien', enlace: 'https://ejemplo.org', licencia: 'CC BY' } })
  const propia = await P.fetchPlacePhotoDetail('Foro Romano', 'Roma', null, null, false)
  ok(propia && propia.source === 'propia' && propia.attribution === null, `1a una foto propia con autor en los datos lleva crédito: ${JSON.stringify(propia?.attribution)}`)
  // Una foto propia sin autor: sin crédito.
  globalThis.fetch = respuesta({ photo_source: 'propia', photo_url: '/fotos/roma/b.jpg', photo_small: '/fotos/roma/b_p.jpg', photo_credit: null })
  const sinAutor = await P.fetchPlacePhotoDetail('Panteón', 'Roma', null, null, false)
  ok(sinAutor && sinAutor.attribution === null, '1b una foto propia sin autor lleva crédito')
  // Unsplash conserva su autor.
  globalThis.fetch = respuesta({ photo_source: 'unsplash', photo_url: 'https://images.unsplash.com/x', unsplash_thumb: 'https://images.unsplash.com/t', unsplash_photographer: 'Ana', unsplash_photographer_url: 'https://unsplash.com/@ana', unsplash_url: 'https://unsplash.com' })
  const unsplash = await P.fetchPlacePhotoDetail('Trevi', 'Roma', null, null, false)
  ok(unsplash && unsplash.attribution && unsplash.attribution.photographer === 'Ana', '1c una foto de Unsplash pierde su autor')
  // La ficha: solo pinta crédito de Unsplash; ni «Foto:» ni nada de las propias.
  const ficha = leer('src/components/route/dayDetail/StopDetailSheet.tsx')
  // (6y2: la línea de crédito vive en src/components/ui/FotoCredito.tsx, que usa la ficha.)
  const credito = leer('src/components/ui/FotoCredito.tsx')
  ok(/<FotoCredito photo=\{photo\} \/>/.test(ficha) && /photo\.source === 'unsplash'/.test(credito) && !/'propia'/.test(credito.replace(/\/\*[\s\S]*?\*\//g, '')), '1d la ficha no limita el crédito a Unsplash y Wikipedia')
  // (6z6f: la ficha pinta «Foto:» para Wikipedia, así que aquí solo se vigila que las propias no tengan línea.)
  ok(!/photo\??\.source === 'propia'/.test(ficha), '1e la ficha todavía tiene el crédito «Foto:» de las propias')
  // «Créditos»: nada de fotos propias.
  const { CREDITOS } = await empaquetar('src/lib/creditos.ts', 'creditos')
  const fotos = CREDITOS.find((c) => c.clave === 'fotos')
  ok(fotos && !/propias|nuestras|Eric/i.test(fotos.texto.replace(/que no son nuestras/i, '')) && fotos.enlaces.every((e) => !/trazo|propia/i.test(e.texto + e.url)), '1f «Créditos» habla de las fotos propias')
  ok(fotos && /Unsplash/.test(fotos.texto) && /Wikimedia|Wikipedia/.test(fotos.texto), '1g «Créditos» ha perdido Wikimedia o Unsplash')
  ok(CREDITOS.every((c) => c.titulo.trim() && c.texto.trim() && c.enlaces.every((e) => e.texto.trim() && e.url.trim())), '1h «Créditos» tiene algún texto o enlace vacío')
}

// ── 2 y 3. La lluvia en la campana ──
console.log('Lluvia en la campana')
{
  const L = await empaquetar('src/lib/avisosDeLluvia.ts', 'avisos')
  const horas = (franjas) => {
    const probability = new Array(24).fill(0)
    for (const h of franjas) probability[h] = 90
    return { probability, precipitation: new Array(24).fill(0) }
  }
  const tarde = horas([15, 16, 17])
  const ruta = (inicio, extra = {}) => ({
    id: 'r1',
    destination: 'Roma',
    origin: 'Madrid',
    answers: { dateRange: { start: inicio, end: '2026-10-13' } },
    days: [1, 2, 3].map((n) => ({ id: `d${n}`, dayNumber: n, city: 'Roma', countryCode: 'it', stops: [{ id: `s${n}`, name: 'Foro', time: '10:00', coordinates: { lat: 41.89, lng: 12.48 } }] })),
    ...extra,
  })
  const r = ruta('2026-10-11')
  // El día antes (hoy 10 oct; el viaje empieza el 11).
  let dias = L.diasAMirar(r, '2026-10-10')
  let avisos = L.avisosDeLluvia(dias, { '2026-10-11': tarde })
  ok(dias.length === 1 && dias[0].cuando === 'manana', `2a el día antes no mira solo mañana: ${JSON.stringify(dias.map((d) => d.cuando))}`)
  ok(avisos.length === 1 && avisos[0].texto === 'Mañana llueve en Roma por la tarde', `2b texto del día antes: ${avisos[0]?.texto}`)
  // El mismo día (hoy 11 oct): hoy y mañana son días del viaje; un aviso por día.
  dias = L.diasAMirar(r, '2026-10-11')
  avisos = L.avisosDeLluvia(dias, { '2026-10-11': tarde, '2026-10-12': tarde })
  ok(avisos.length === 2 && avisos[0].texto === 'Hoy llueve en Roma por la tarde' && avisos[1].texto === 'Mañana llueve en Roma por la tarde', `2c el mismo día: ${avisos.map((a) => a.texto).join(' | ')}`)
  ok(new Set(avisos.map((a) => a.id)).size === avisos.length, '2d dos avisos con el mismo id')
  // Sin repetirse: el mismo día dos veces en la lista de días da un solo aviso.
  const repetido = L.avisosDeLluvia([...dias, ...dias], { '2026-10-11': tarde, '2026-10-12': tarde })
  ok(repetido.length === 2, `2e un día se repite en la campana: ${repetido.length}`)
  // Franjas.
  const texto = (hs) => L.avisosDeLluvia(L.diasAMirar(r, '2026-10-11').slice(0, 1), { '2026-10-11': horas(hs) })[0]?.texto
  ok(texto([9, 10]) === 'Hoy llueve en Roma por la mañana', `2f por la mañana: ${texto([9, 10])}`)
  ok(texto([22]) === 'Hoy llueve en Roma por la noche', `2g por la noche: ${texto([22])}`)
  ok(texto([10, 16]) === 'Hoy llueve en Roma todo el día', `2h todo el día: ${texto([10, 16])}`)
  ok(texto([16, 22]) === 'Hoy llueve en Roma por la tarde y por la noche', `2i tarde y noche: ${texto([16, 22])}`)
  // Sin previsión: nada.
  ok(L.avisosDeLluvia(L.diasAMirar(r, '2026-10-11'), {}).length === 0, '3a sin previsión sale algún aviso')
  ok(L.avisosDeLluvia(L.diasAMirar(r, '2026-10-11'), { '2026-10-11': null, '2026-10-12': null }).length === 0, '3b con el servidor caído sale algún aviso')
  ok(L.avisosDeLluvia(L.diasAMirar(r, '2026-10-11'), { '2026-10-11': horas([]), '2026-10-12': horas([]) }).length === 0, '3c con previsión seca sale algún aviso')
  // Días que no cuentan: fuera del viaje, lejos o sin fechas / sin coordenadas.
  ok(L.diasAMirar(r, '2026-10-01').length === 0, '3d un día lejano del viaje se mira')
  ok(L.diasAMirar(ruta('2026-10-11', { answers: {} }), '2026-10-11').length === 0, '3e un viaje sin fechas se mira')
  const sinCoords = ruta('2026-10-11')
  sinCoords.days.forEach((d) => d.stops.forEach((s) => (s.coordinates = { lat: 0, lng: 0 })))
  ok(L.diasAMirar(sinCoords, '2026-10-11').length === 0, '3f un día sin coordenadas de verdad se mira')
  // En las dos versiones: el hook no depende de la versión de pago y usa nuestro módulo.
  const hook = leer('src/hooks/useAppNotices.ts')
  ok(!/pagoActivo|lib\/pago/.test(hook), '2j la campana de la lluvia depende de la versión de pago')
  ok(/avisosDeLluvia\(aMirar, lluvias\)/.test(hook) && /fetchHourlyRain/.test(hook), '2k la campana no usa avisosDeLluvia con la previsión de nuestro servidor')
  ok(/lluviaDePruebaActiva\(\)/.test(hook), '2l la campana no cambia con la lluvia de prueba del panel')
  ok(/api\/tiempo\/horas/.test(leer('src/lib/rainForecast.ts')), '2m la previsión no sale de nuestro servidor')
}

console.log(`\n6z6e: ${comprobaciones} comprobaciones, ${fallos} fallos.`)
process.exitCode = fallos === 0 ? 0 : 1
