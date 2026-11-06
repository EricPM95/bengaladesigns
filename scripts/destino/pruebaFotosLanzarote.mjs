// PRUEBA DE LAS FOTOS DE LANZAROTE (6-nov). Sin navegador: lee los datos y llama a las funciones del servidor.
//   node scripts/destino/pruebaFotosLanzarote.mjs
//   (con la API en 8787 y DESTINOS_OCULTOS='-' comprueba además /api/place-photo de verdad; sin ella, se salta esa parte)
// 1. Las 27 de Eric están en su parada (por nombre y por id), sin crédito y con sus derechos; las 2 de reserva se guardan y no se usan.
// 2. Ninguna foto apunta a un archivo que no existe (la grande, la _p, la portada, las de reserva).
// 3. Toda parada de Lanzarote tiene foto NUESTRA o sale con el fondo de color: nunca la de Wikipedia ni la de Unsplash.
// 4. Los cruces que fallaban (Timanfaya, Haría, la Casa-Museo, los Helechos, el paseo de Playa Blanca y el Faro, Teguise) ya casan.
// 5. Roma no ha cambiado (sin las reglas nuevas, cruce exacto como siempre).
// 6. Las etiquetas de Lanzarote (César Manrique…) y el icono de «A pie».
import fs from 'node:fs'
import path from 'node:path'
import { photosFor, ownPhotoFile, fotoOculta, nombreNormalizado } from '../../server/engine/writtenDays.js'

let total = 0
const fallos = []
const debe = (ok, id, texto) => {
  total += 1
  if (!ok) {
    fallos.push(`[${id}] ${texto}`)
    console.log(`  FALLO [${id}] ${texto}`)
  }
}
const leer = (r) => fs.readFileSync(r, 'utf8')
const CARPETA = 'public/fotos/lanzarote'
const tabla = photosFor('lanzarote')
const paquete = JSON.parse(leer('docs/dias/_fotos_eric.json'))
const datos = JSON.parse(leer('data/pipeline_v2/lanzarote.json'))
const ruta = JSON.parse(leer('docs/dias/_hoy3_ruta_eric.json')).route

// ── 1. Las 27 de Eric ──
const deEric = tabla.fotos.filter((f) => f.origen === 'Eric')
const numeradas = paquete.filter((f) => /^\d+$/.test(f.n))
debe(numeradas.length === 27 && deEric.length === 27, '1a', `27 fotos de Eric en la tabla (hay ${deEric.length}, el paquete trae ${numeradas.length})`)
debe(new Set(deEric.map((f) => f.archivo)).size === 27, '1b', 'cada una con su archivo, sin repetir')
for (const p of numeradas) {
  const f = ownPhotoFile(tabla, p.parada, null)
  debe(f && f.origen === 'Eric', '1c', `«${p.parada}» lleva la foto de Eric (${f?.archivo ?? 'ninguna'})`)
  debe(f && (f.derechos === 'libre' || f.derechos === 'revisar antes del lanzamiento') && f.derechos === (p.derechos === 'libre' ? 'libre' : 'revisar antes del lanzamiento'), '1d', `«${p.parada}»: derechos «${f?.derechos}» como en el paquete (${p.derechos})`)
  debe(f && !f.credito && !f.autor && !f.enlace, '1e', `«${p.parada}»: sin crédito en la app`)
}
const playaBlanca = ownPhotoFile(tabla, 'El paseo marítimo de Playa Blanca', null)
const faro = ownPhotoFile(tabla, 'Faro de Pechiguera', null)
debe(playaBlanca?.archivo.startsWith('paseo_maritimo_de_playa_blanca') && faro?.archivo.startsWith('faro_de_pechiguera') && playaBlanca.archivo !== faro.archivo, '1f', `el paseo marítimo (22) y el Faro (23) son dos tarjetas con dos fotos distintas (${playaBlanca?.archivo} / ${faro?.archivo})`)
debe(Array.isArray(tabla.reserva) && tabla.reserva.length === 2 && tabla.reserva.every((r) => /^reserva\//.test(r.archivo) && fs.existsSync(path.join(CARPETA, r.archivo))), '1g', 'las 2 de reserva (X1, X2) están guardadas en reserva/')
debe(!tabla.fotos.some((f) => /reserva/.test(f.archivo) || (f.lugares ?? []).some((l) => /atardecer/i.test(l))), '1h', 'las de reserva NO se usan en ninguna parada')
debe(!tabla.fotos.some((f) => f.cuando === 'noche'), '1i', 'ninguna foto de noche en la tabla de Lanzarote')

// ── 2. Ninguna foto apunta a un archivo que no existe ──
const archivos = new Set()
for (const f of tabla.fotos) {
  archivos.add(f.archivo)
  if (f.cuando !== 'portada') archivos.add(f.archivo.replace(/\.jpg$/, '_p.jpg'))
}
for (const c of [tabla.portada?.archivo, tabla.portada?.ruta_tarjeta].filter(Boolean)) archivos.add(c)
for (const a of archivos) debe(fs.existsSync(path.join(CARPETA, a)), '2a', `el archivo ${a} existe`)
debe(deEric.every((f) => fs.existsSync(path.join(CARPETA, f.archivo.replace(/\.jpg$/, '_p.jpg')))), '2b', 'cada foto de Eric lleva su versión _p de la tarjeta')

// ── 3. Toda parada: foto nuestra o fondo de color (nunca Wikipedia ni Unsplash) ──
debe(tabla.solo_fotos_propias === true && tabla.cruce_normalizado === true, '3a', 'Lanzarote lleva las dos reglas nuevas (solo fotos propias, cruce normalizado)')
const nombres = new Set([...datos.places.map((p) => p.name), ...ruta.days.flatMap((d) => d.stops.map((s) => s.name))])
const sinFoto = []
for (const n of nombres) {
  const f = ownPhotoFile(tabla, n, null)
  if (f) continue
  sinFoto.push(n)
  debe(fotoOculta('lanzarote', n), '3b', `«${n}» no tiene foto nuestra: tiene que salir con el fondo de color (fotoOculta), nunca la de Wikipedia`)
}
debe(fotoOculta('lanzarote', 'Un sitio que no está en los datos') === true, '3c', 'un nombre cualquiera de Lanzarote, sin foto nuestra, nunca busca en Wikipedia ni en Unsplash')
debe(sinFoto.includes('Mirador del Bosquecillo (Risco de Famara)'), '3d', 'el Mirador del Bosquecillo sigue sin foto (fondo de color)')
console.log(`  (paradas de Lanzarote sin foto, con fondo de color: ${sinFoto.join(' · ')})`)

// ── 4. Los cruces que fallaban ──
for (const [nombre, archivo] of [
  ['Montañas del Fuego (Timanfaya)', 'montanas_del_fuego'],
  ['Haría y el Valle de las Mil Palmeras', 'haria_y_el_valle_de_las_mil_palmeras'],
  ['Casa-Museo César Manrique (Haría)', 'casa_museo_cesar_manrique_haria'],
  ['Mirador de los Helechos', 'mirador_de_los_helechos'],
  ['El paseo marítimo de Playa Blanca', 'paseo_maritimo_de_playa_blanca'],
  ['Faro de Pechiguera', 'faro_de_pechiguera'],
  ['Teguise (villa)', 'teguise'],
  ['Teguise', 'teguise'],
  ['Fundación César Manrique', 'fundacion_cesar_manrique'],
  ['fundacion cesar manrique (tahiche)', 'fundacion_cesar_manrique'],
]) {
  const f = ownPhotoFile(tabla, nombre, null)
  debe(f?.archivo.replace(/(_eric)?\.jpg$/, '') === archivo, '4a', `«${nombre}» casa con ${archivo} (${f?.archivo ?? 'ninguna'})`)
}
debe(nombreNormalizado('Teguise (villa)') === 'teguise' && nombreNormalizado('Haría y el Valle') === 'haria y el valle', '4b', 'el nombre normalizado quita tildes, mayúsculas y paréntesis')
// Cada lugar de nuestros datos casa con una foto por su nombre o por su id (nunca a ojo).
for (const p of datos.places) {
  const f = ownPhotoFile(tabla, p.name, null)
  if (!f) continue
  const porId = tabla.fotos.some((x) => x.place_id === p.id)
  const porNombre = tabla.fotos.some((x) => (x.lugares ?? []).includes(p.name))
  debe(porId || porNombre, '4c', `«${p.name}» casa por su id o por su nombre exacto (no solo por el normalizado)`)
}

// ── 5. Roma no ha cambiado ──
const roma = photosFor('roma')
debe(roma && roma.solo_fotos_propias === undefined && roma.cruce_normalizado === undefined, '5a', 'Roma no lleva ninguna de las dos reglas nuevas')
debe(ownPhotoFile(roma, 'Un nombre que no existe (por fuera)', null) === null && fotoOculta('roma', 'Un nombre que no existe') === false, '5b', 'en Roma, un nombre sin foto propia sigue buscándose como antes (no se oculta)')
const primeroRoma = (roma.fotos ?? []).find((f) => f.lugares?.[0])
debe(primeroRoma && ownPhotoFile(roma, primeroRoma.lugares[0], null)?.archivo === primeroRoma.archivo, '5c', 'en Roma, el cruce exacto de siempre sigue funcionando')

// ── 6. Etiquetas e icono ──
const tags = leer('src/lib/tagColors.ts')
debe(/cesar_manrique: 'César Manrique'/.test(tags), '6a', 'la etiqueta «cesar_manrique» sale como «César Manrique»')
const visibles = new Set(datos.places.flatMap((p) => p.tags ?? []))
const internas = new Set(['paseo', 'secreto', 'local', 'tranquilo', 'foto', 'optional', 'opcional', 'imprescindible', 'joya', 'si_entra', 'relleno', 'filler'])
for (const t of visibles) {
  if (internas.has(t)) continue
  const conTilde = { volcan: 'Volcán', tubo_volcanico: 'Tubo volcánico', geologia: 'Geología', fotogenico: 'Fotogénico', bano: 'Baño' }
  if (conTilde[t]) debe(tags.includes(`${t}: '${conTilde[t]}'`), '6b', `la etiqueta «${t}» sale como «${conTilde[t]}»`)
}
const coche = leer('src/components/route/dayDetail/CocheDelDia.tsx')
debe(/\^A pie/.test(coche) && /TransportModeIcon mode="walking"/.test(coche), '6c', '«A pie · 5 min» lleva el icono de andar')

// ── 7. De verdad contra la API (si está) ──
const API = process.env.API_URL ?? 'http://localhost:8787'
let api = false
try {
  const r = await fetch(`${API}/api/place-photo`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Faro de Pechiguera', city: 'Lanzarote' }), signal: AbortSignal.timeout(8000) })
  api = r.status === 200
  if (api) {
    const j = await r.json()
    debe(j.photo_source === 'propia' && /faro_de_pechiguera/.test(j.photo_url ?? ''), '7a', `/api/place-photo da la foto propia del Faro (${j.photo_source} ${j.photo_url})`)
    for (const [n, f] of [['Montañas del Fuego (Timanfaya)', 'montanas_del_fuego'], ['Casa-Museo César Manrique (Haría)', 'casa_museo_cesar_manrique_haria']]) {
      const k = await (await fetch(`${API}/api/place-photo`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: n, city: 'Lanzarote' }) })).json()
      debe(k.photo_source === 'propia' && k.photo_url?.includes(f), '7b', `/api/place-photo de «${n}» da la foto de Eric (${k.photo_source} ${k.photo_url})`)
    }
    const sin = await (await fetch(`${API}/api/place-photo`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Mirador del Bosquecillo (Risco de Famara)', city: 'Lanzarote' }) })).json()
    debe(sin.photo_source === 'none', '7c', `el Mirador del Bosquecillo sale SIN foto (${sin.photo_source})`)
    const rareza = await (await fetch(`${API}/api/place-photo`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Playa de La Garita', city: 'Lanzarote' }) })).json()
    debe(rareza.photo_source === 'none', '7d', `una parada sin foto nuestra (Playa de La Garita) sale SIN foto, no de Wikipedia (${rareza.photo_source})`)
  }
} catch {
  api = false
}
if (!api) console.log('  (la API de Lanzarote no está en marcha: se salta el apartado 7)')

console.log(`\nPrueba de las fotos de Lanzarote: ${total} comprobaciones · ${fallos.length} fallos`)
process.exit(fallos.length ? 1 : 0)
