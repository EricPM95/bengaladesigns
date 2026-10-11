// La prueba de la Tanda 6z6f (pregunta 1): autor y licencia de las fotos de Wikipedia / Wikimedia Commons.
//   node scripts/destino/pruebaFase6z6fWikimedia.mjs                    (sin servidor: todo menos «se sirve de verdad desde Wikipedia»)
//   SERVIDOR=http://localhost:8787 node scripts/destino/pruebaFase6z6fWikimedia.mjs   (con un servidor encendido, comprueba también eso)
// Da fallo si:
//   1. data/dias/roma/_fotos_wikimedia.json no existe o no tiene la forma dicha, o una foto que no es de dominio público no trae autor y licencia;
//   2. (con servidor) un lugar del JSON ya no se sirve desde Wikipedia, o una foto de Wikipedia que se sirve no está en el JSON ni en «sin_autor»;
//   3. el servidor no pone `photo_credit` a una foto de Wikipedia con crédito completo (o se lo pone a una de dominio público / sin datos);
//   4. el cliente no construye `attribution` para Wikipedia con photo_credit, o la construye sin crédito, o una foto propia lleva crédito;
//   5. la ficha pinta una línea vacía o a medias; «Créditos» no cuenta lo de Wikipedia o habla de las fotos propias;
//   6. una foto de Wikipedia guardada en el navegador sin crédito (clave antigua) no se vuelve a pedir.
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
const carpeta = fs.mkdtempSync(path.join(os.tmpdir(), 'prueba-6z6f-'))
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

// ── 1. El JSON ──
console.log('El JSON de créditos')
const RUTA = 'data/dias/roma/_fotos_wikimedia.json'
ok(fs.existsSync(RUTA), `1a no existe ${RUTA}`)
const tabla = fs.existsSync(RUTA) ? JSON.parse(leer(RUTA)) : { fotos: [], sin_autor: [] }
ok(typeof tabla._que_es === 'string' && tabla._que_es.length > 40, '1b falta la explicación _que_es')
ok(Array.isArray(tabla.fotos) && tabla.fotos.length > 0 && Array.isArray(tabla.sin_autor), '1c fotos / sin_autor no son listas (o fotos está vacía)')
const forma = (f) => Array.isArray(f.lugares) && f.lugares.length > 0 && f.lugares.every((l) => typeof l === 'string' && l.trim()) && typeof f.archivo === 'string' && f.archivo.trim() && typeof f.dominio_publico === 'boolean' && typeof f.autor === 'string' && typeof f.licencia === 'string' && typeof f.licencia_url === 'string' && typeof f.pagina === 'string'
ok(tabla.fotos.every(forma), `1d alguna foto no tiene la forma dicha: ${tabla.fotos.filter((f) => !forma(f)).map((f) => f.archivo)}`)
ok(tabla.fotos.every((f) => /^https:\/\/commons\.wikimedia\.org\/wiki\/File:/.test(f.pagina)), '1e alguna página no es de Commons (File:)')
const conCredito = tabla.fotos.filter((f) => !f.dominio_publico)
ok(conCredito.every((f) => f.autor.trim() && f.licencia.trim()), `1f falta autor o licencia en: ${conCredito.filter((f) => !f.autor.trim() || !f.licencia.trim()).map((f) => f.archivo)}`)
ok(conCredito.every((f) => /^https?:\/\//.test(f.licencia_url)), `1g falta el enlace de la licencia en: ${conCredito.filter((f) => !/^https?:\/\//.test(f.licencia_url)).map((f) => f.archivo)}`)
ok(conCredito.every((f) => !/<[^>]+>|&[a-z]+;/i.test(f.autor)), '1h algún autor trae HTML sin limpiar')
ok(new Set(tabla.fotos.map((f) => f.archivo)).size === tabla.fotos.length, '1i un archivo está repetido')
ok(tabla.fotos.some((f) => f.dominio_publico) && conCredito.length > 0, '1j no hay de las dos clases (dominio público y con crédito): sospechoso')
ok(tabla.sin_autor.every((s) => s.lugar && s.parada && s.archivo), '1k una entrada de sin_autor no dice lugar, parada y archivo')
ok(!tabla.fotos.some((f) => tabla.sin_autor.some((s) => s.archivo === f.archivo)), '1l un archivo está a la vez en fotos y en sin_autor')

// ── 2. Lo que se sirve de verdad (con servidor) ──
console.log('Lo que sirve el servidor')
const SERVIDOR = process.env.SERVIDOR
if (!SERVIDOR) {
  console.log('  (sin SERVIDOR: no se puede comprobar sin un servidor encendido; ejecútala con SERVIDOR=http://localhost:8787)')
} else {
  const archivoDe = (url) => {
    const partes = new URL(url).pathname.split('/').filter(Boolean)
    const i = partes.indexOf('thumb')
    return decodeURIComponent(i >= 0 ? partes[i + 3] : partes[partes.length - 1])
  }
  let noWiki = []
  let sinCredito = []
  for (const f of tabla.fotos) {
    for (const lugar of f.lugares) {
      const j = await (await fetch(`${SERVIDOR}/api/place-photo`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: lugar, city: 'Roma' }) })).json()
      if (j.photo_source !== 'wikipedia' || archivoDe(j.photo_url) !== f.archivo) noWiki.push(lugar)
      else if (!f.dominio_publico && !(j.photo_credit && j.photo_credit.autor === f.autor && j.photo_credit.licencia === f.licencia && j.photo_credit.enlace === f.pagina)) sinCredito.push(lugar)
      else if (f.dominio_publico && j.photo_credit) sinCredito.push(`${lugar} (dominio público con crédito)`)
    }
  }
  ok(noWiki.length === 0, `2a lugares del JSON que ya no se sirven desde Wikipedia con ese archivo: ${noWiki.join(' | ')}`)
  ok(sinCredito.length === 0, `2b el servidor no responde con el crédito esperado en: ${sinCredito.join(' | ')}`)
}

// ── 3. El servidor, por dentro ──
console.log('El servidor')
{
  const W = await import(new URL('../../server/engine/writtenDays.js', import.meta.url).href)
  const url = (archivo) => `https://thumb.wikimedia.org/wikipedia/commons/thumb/a/ab/${encodeURIComponent(archivo)}/330px-${encodeURIComponent(archivo)}?utm_source=es.wikipedia.org`
  const todas = tabla.fotos.map((f) => ({ f, c: W.wikimediaCreditFor('roma', url(f.archivo)) }))
  ok(todas.filter((x) => !x.f.dominio_publico).every((x) => x.c && x.c.autor === x.f.autor && x.c.licencia === x.f.licencia && x.c.enlace === x.f.pagina), '3a el servidor no devuelve el crédito de alguna foto con autor y licencia')
  ok(todas.filter((x) => x.f.dominio_publico).every((x) => x.c === null), '3b el servidor da crédito a una foto de dominio público')
  ok(W.wikimediaCreditFor('roma', url('Una_foto_que_no_esta.jpg')) === null && W.wikimediaCreditFor('roma', null) === null && W.wikimediaCreditFor('', url('x.jpg')) === null && W.wikimediaCreditFor('noexiste', url('x.jpg')) === null, '3c una foto desconocida / sin URL / destino sin tabla da crédito')
  const servidor = leer('server/index.js')
  ok(/withWikimediaCredit\(foto, city\)/.test(servidor) && /withWikimediaCredit\(await resolveNightPhoto\(/.test(servidor), '3d /api/place-photo no pone el crédito en la respuesta normal y en la de noche')
  ok(/photo_source !== 'wikipedia'/.test(servidor) && /wikimediaCreditFor\(findPipelineV2Key\(city\)/.test(servidor), '3e el crédito no se busca en el JSON por el archivo de la foto')
  ok(!/place_photo_cache[\s\S]{0,300}photo_credit/.test(servidor.slice(servidor.indexOf('async function resolvePlacePhoto'), servidor.indexOf('async function resolvePlacePhoto') + 1800)), '3f el crédito se guarda en la caché de Supabase en vez de añadirse al responder')
}

// ── 4. El cliente ──
console.log('El cliente')
{
  const almacen = new Map()
  almacen.set('photo:v1:viejo|roma|', JSON.stringify({ at: Date.now(), photo: { source: 'wikipedia', thumb: 'x', small: 'x', regular: 'x', blurHash: null, attribution: null } }))
  // (Como un localStorage de verdad: Object.keys(localStorage) devuelve las claves guardadas.)
  const metodos = { getItem: (k) => almacen.get(k) ?? null, setItem: (k, v) => almacen.set(k, String(v)), removeItem: (k) => almacen.delete(k) }
  globalThis.localStorage = new Proxy({}, {
    get: (_t, p) => metodos[p],
    ownKeys: () => [...almacen.keys()],
    getOwnPropertyDescriptor: (_t, p) => (almacen.has(p) ? { enumerable: true, configurable: true, value: almacen.get(p) } : undefined),
  })
  globalThis.window = { location: { hostname: 'localhost', search: '' }, localStorage: globalThis.localStorage, sessionStorage: globalThis.localStorage }
  const respuesta = (data) => async () => ({ ok: true, json: async () => data })
  const P = await empaquetar('src/lib/placePhoto.ts', 'placePhoto')
  const credito = { autor: 'Livioandronico2013', licencia: 'CC BY-SA 3.0', licencia_url: 'https://creativecommons.org/licenses/by-sa/3.0', enlace: 'https://commons.wikimedia.org/wiki/File:Isola_Tiberina_2014.JPG' }
  globalThis.fetch = respuesta({ photo_source: 'wikipedia', photo_url: 'https://thumb.wikimedia.org/a/330px-a.jpg', photo_credit: credito })
  const conCred = await P.fetchPlacePhotoDetail('Isla Tiberina', 'Roma', null, null, false)
  const a = conCred?.attribution
  ok(conCred && conCred.source === 'wikipedia' && a && a.photographer === credito.autor && a.license === credito.licencia && a.photographerUrl === credito.enlace && a.licenseUrl === credito.licencia_url, `4a Wikipedia con photo_credit no construye attribution: ${JSON.stringify(a)}`)
  ok(conCred && conCred.regular === 'https://thumb.wikimedia.org/a/330px-a.jpg' && conCred.thumb === conCred.regular, '4b la foto de Wikipedia cambia de URL')
  globalThis.fetch = respuesta({ photo_source: 'wikipedia', photo_url: 'https://thumb.wikimedia.org/b/330px-b.jpg' })
  const sinCred = await P.fetchPlacePhotoDetail('Largo di Torre Argentina', 'Roma', null, null, false)
  ok(sinCred && sinCred.source === 'wikipedia' && sinCred.attribution === null, `4c una de Wikipedia sin photo_credit (dominio público) lleva attribution: ${JSON.stringify(sinCred?.attribution)}`)
  globalThis.fetch = respuesta({ photo_source: 'wikipedia', photo_url: 'https://thumb.wikimedia.org/c/330px-c.jpg', photo_credit: { autor: '  ', licencia: 'CC BY 4.0' } })
  const autorVacio = await P.fetchPlacePhotoDetail('Monti', 'Roma', null, null, false)
  ok(autorVacio && autorVacio.attribution === null, '4d un crédito sin autor construye attribution a medias')
  globalThis.fetch = respuesta({ photo_source: 'wikipedia', photo_url: 'https://thumb.wikimedia.org/d/330px-d.jpg', photo_credit: { autor: 'Ana', licencia: '' } })
  const licVacia = await P.fetchPlacePhotoDetail('Via del Corso', 'Roma', null, null, false)
  ok(licVacia && licVacia.attribution === null, '4e un crédito sin licencia construye attribution a medias')
  globalThis.fetch = respuesta({ photo_source: 'propia', photo_url: '/fotos/roma/a.jpg', photo_small: '/fotos/roma/a_p.jpg', photo_credit: credito })
  const propia = await P.fetchPlacePhotoDetail('Foro Romano', 'Roma', null, null, false)
  ok(propia && propia.source === 'propia' && propia.attribution === null, '4f una foto propia lleva crédito')
  globalThis.fetch = respuesta({ photo_source: 'unsplash', photo_url: 'https://images.unsplash.com/x', unsplash_thumb: 'https://images.unsplash.com/t', unsplash_photographer: 'Ana', unsplash_photographer_url: 'https://unsplash.com/@ana', unsplash_url: 'https://unsplash.com' })
  const unsplash = await P.fetchPlacePhotoDetail('Trevi', 'Roma', null, null, false)
  ok(unsplash && unsplash.attribution && unsplash.attribution.photographer === 'Ana' && unsplash.attribution.license === undefined, '4g Unsplash pierde su autor o recibe una licencia')
  // El guardado del navegador: la clave antigua (sin crédito) ya no vale y se limpia; la nueva guarda el crédito.
  ok(!almacen.has('photo:v1:viejo|roma|'), '4h la foto de Wikipedia guardada con la clave antigua sigue ahí (se quedaría sin crédito)')
  const nuevas = [...almacen.keys()].filter((k) => k.startsWith('photo:v2:'))
  ok(nuevas.length >= 4 && [...almacen.keys()].every((k) => !k.startsWith('photo:v1:')), `4i el guardado no usa la clave nueva (v2): ${[...almacen.keys()].join(', ')}`)
  const guardada = JSON.parse(almacen.get([...almacen.keys()].find((k) => k.includes('isla tiberina'))))
  ok(guardada.photo.attribution && guardada.photo.attribution.license === 'CC BY-SA 3.0', '4j lo guardado en el navegador pierde el crédito')
}

// ── 5. La ficha y «Créditos» ──
console.log('La ficha y Créditos')
{
  const ficha = leer('src/components/route/dayDetail/StopDetailSheet.tsx')
  const bloque = ficha.slice(ficha.indexOf("photo?.source === 'wikipedia' &&"), ficha.indexOf("photo?.source === 'wikipedia' &&") + 900)
  ok(/photo\?\.source === 'wikipedia' && photo\.attribution\?\.photographer && photo\.attribution\.license/.test(ficha), '5a la ficha pinta la línea de Wikipedia sin exigir autor y licencia')
  ok(/Foto:\{' '\}/.test(bloque) && /target="_blank" rel="noreferrer"/.test(bloque) && /photographerUrl/.test(bloque) && /attribution\.license/.test(bloque), '5b la línea no es «Foto: {autor enlazado} · {licencia}» con enlace seguro')
  ok(/text-caption text-text-muted/.test(bloque), '5c la línea de Wikipedia no es igual de discreta que la de Unsplash')
  ok((ficha.match(/Foto:\{' '\}/g) ?? []).length === 1 && !/photo\??\.source === 'propia'/.test(ficha), '5d la ficha tiene más de una línea «Foto:» o una para las propias')
  ok(/photo\?\.source === 'unsplash' && photo\.attribution/.test(ficha), '5e la línea de Unsplash ha cambiado')
  const { CREDITOS } = await empaquetar('src/lib/creditos.ts', 'creditos')
  const fotos = CREDITOS.find((c) => c.clave === 'fotos')
  ok(fotos && /Wikipedia/.test(fotos.texto) && /autor/.test(fotos.texto) && /licencia/.test(fotos.texto) && /dominio público/.test(fotos.texto), '5f «Créditos» no dice que las de Wikipedia llevan autor y licencia (las de dominio público no)')
  ok(fotos && /Unsplash/.test(fotos.texto) && fotos.enlaces.some((e) => /commons\.wikimedia\.org/.test(e.url)) && fotos.enlaces.some((e) => /unsplash\.com/.test(e.url)), '5g «Créditos» ha perdido el enlace a Wikimedia Commons o a Unsplash')
  ok(fotos && !/propias|nuestras|Eric/i.test(fotos.texto), '5h «Créditos» habla de las fotos propias')
  ok(['tiempo', 'mapas'].every((k) => CREDITOS.some((c) => c.clave === k)) && CREDITOS.length === 3, '5i han cambiado las otras entradas de «Créditos»')
}

console.log(`\n6z6f (Wikimedia): ${comprobaciones} comprobaciones, ${fallos} fallos.`)
process.exitCode = fallos === 0 ? 0 : 1
