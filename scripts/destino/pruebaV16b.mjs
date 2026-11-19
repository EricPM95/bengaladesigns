// La prueba de la Tanda V16b: LAS FOTOS DE LANZAROTE Y DE ROMA (4 de Lanzarote, 8 de Roma de Eric, Ponte Sisto y Plaza del Quirinal de Commons, y la página para elegir las 4 que quedan).
//   (con la API en el puerto 8787)  node scripts/destino/pruebaV16b.mjs
import fs from 'node:fs'
import sharp from 'sharp'
import { cargarDatos } from '../../server/logros/datos.js'

let comprobaciones = 0
const fallos = []
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) {
    fallos.push({ regla, texto })
    console.log(`  FALLO [${regla}] ${texto}`)
  }
}
const leer = (f) => JSON.parse(fs.readFileSync(f, 'utf8'))
const norma = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
const API = process.env.API_URL ?? 'http://localhost:8787'
const datos = cargarDatos()

const tablas = { lanzarote: leer('data/dias/lanzarote/_fotos.json'), roma: leer('data/dias/roma/_fotos.json') }
const catalogos = { lanzarote: leer('data/pipeline_v2/lanzarote.json'), roma: leer('data/pipeline_v2/roma.json') }
const wikimedia = leer('data/dias/roma/_fotos_wikimedia.json')

const entradaDe = (destino, nombre) => tablas[destino].fotos.find((f) => (f.lugares ?? []).some((l) => norma(l) === norma(nombre)))
const pedirFoto = async (nombre, ciudad) => {
  const r = await fetch(`${API}/api/place-photo`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: nombre, city: ciudad }) })
  return r.ok ? r.json() : null
}

/* ───────── 1. Las fotos nuevas: archivo, pequeña, línea y lo que da el servidor ───────── */
console.log('1. Las fotos nuevas')
const NUEVAS = [
  ['lanzarote', 'Bodega El Grifo', 'bodega_el_grifo.jpg', { origen: 'Eric', solo: true, ancho: 800 }],
  ['lanzarote', 'Bodega La Geria', 'bodega_la_geria.jpg', { origen: 'Eric' }],
  ['lanzarote', 'Mirador del Bosquecillo (Risco de Famara)', 'mirador_del_bosquecillo.jpg', { origen: 'Eric' }],
  ['lanzarote', 'Playa de La Garita', 'playa_de_la_garita.jpg', { permiso: true, solo: true, ancho: 675 }],
  ['roma', 'Iglesia del Gesù', 'dia_iglesia_del_gesu.jpg', { origen: 'Eric', solo: true, ancho: 850 }],
  ['roma', 'Iglesia de San Ignacio de Loyola', 'dia_san_ignacio_de_loyola.jpg', { origen: 'Eric' }],
  ['roma', 'Via del Babuino', 'dia_via_del_babuino.jpg', { origen: 'Eric' }],
  ['roma', 'Via dei Coronari', 'dia_via_dei_coronari.jpg', { origen: 'Eric' }],
  ['roma', 'Testaccio', 'dia_testaccio.jpg', { origen: 'Eric' }],
  ['roma', 'Via di Ripetta', 'dia_via_di_ripetta.jpg', { origen: 'Eric' }],
  ['roma', 'Terraza de Largo Gaetana Agnesi', 'dia_terraza_largo_gaetana_agnesi.jpg', { origen: 'Eric', solo: true, ancho: 1000 }],
  ['roma', 'Cripta de los Capuchinos', 'dia_cripta_capuchinos.jpg', { origen: 'Eric' }],
  ['roma', 'Ponte Sisto', 'dia_ponte_sisto.jpg', { commons: 'CC BY-SA 4.0' }],
  ['roma', 'Plaza del Quirinal', 'dia_plaza_del_quirinal.jpg', { commons: 'CC BY 2.5', autor: 'Wolfgang Moroder' }],
]
const apiViva = await fetch(`${API}/api/place-photo`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }).then(() => true).catch(() => false)
for (const [destino, nombre, archivo, o] of NUEVAS) {
  const e = entradaDe(destino, nombre)
  const carpeta = `public/fotos/${destino}`
  debe(e?.archivo === archivo && fs.existsSync(`${carpeta}/${archivo}`) && fs.existsSync(`${carpeta}/${archivo.replace(/\.jpg$/, '_p.jpg')}`), 'archivos', `${nombre}: la foto, su _p.jpg y su línea en _fotos.json`)
  const p = await sharp(`${carpeta}/${archivo.replace(/\.jpg$/, '_p.jpg')}`).metadata()
  const g = await sharp(`${carpeta}/${archivo}`).metadata()
  debe(p.width <= 640 && g.width === e?.ancho, 'archivos', `${nombre}: la pequeña mide ${p.width} px (máx. 640) y el ancho de la línea es el de la foto (${g.width})`)
  if (o.origen) debe(e?.origen === 'Eric' && e?.derechos === 'revisar antes del lanzamiento' && !e?.credito, 'derechos', `${nombre}: origen «Eric», derechos «revisar antes del lanzamiento» y sin línea de crédito`)
  if (o.permiso) debe(e?.credito?.autor === 'Turismo de Haría' && e.credito.licencia === 'con permiso del autor' && e.derechos === 'con permiso del autor' && e.credito_texto === 'Foto: Turismo de Haría', 'credito', 'La Garita: crédito visible «Foto: Turismo de Haría», derechos «con permiso del autor»')
  if (o.commons) debe(e?.credito?.licencia === o.commons && e.credito.autor.length > 0 && e.credito.autor.length < 60 && /^https:\/\/commons\.wikimedia\.org\/wiki\/File:/.test(e.credito.enlace) && (!o.autor || e.credito.autor === o.autor), 'credito', `${nombre}: de Commons con su crédito (${e?.credito?.autor} · ${e?.credito?.licencia})`)
  debe(o.solo ? e?.solo_tarjetas === true && g.width < 1100 : !e?.solo_tarjetas, 'pequenas', `${nombre}: ${o.solo ? 'pequeña (' + g.width + ' px), marcada «solo tarjetas»' : 'sin marca de pequeña'}`)
  if (apiViva) {
    const r = await pedirFoto(nombre, destino === 'roma' ? 'Roma' : 'Lanzarote')
    const base = archivo.replace(/\.jpg$/, '')
    debe(r?.photo_source === 'propia' && String(r.photo_small).includes(`${base}_p.jpg`), 'servidor', `${nombre}: el servidor da su foto propia (${r?.photo_source}; ${String(r?.photo_small).slice(-40)})`)
    if (o.solo) debe(String(r?.photo_url).includes(`${base}_p.jpg`), 'pequenas', `${nombre}: la «grande» es la pequeña: nunca se estira a pantalla completa`)
    else debe(String(r?.photo_url).includes(`${base}.jpg`) && !String(r?.photo_url).includes('_p.jpg'), 'pequenas', `${nombre}: la grande sale en grande`)
    if (o.permiso || o.commons) debe(Boolean(r?.photo_credit?.autor), 'credito', `${nombre}: el servidor manda su crédito (${r?.photo_credit?.autor})`)
    else debe(!r?.photo_credit, 'credito', `${nombre}: sin línea de crédito (foto de Eric)`)
  }
}
debe(apiViva, 'servidor', 'la API local contesta (si no, las comprobaciones del servidor no se han podido hacer)')

/* ───────── 2. Ningún sitio de logro sin foto ni con la foto de otro (lo que da el servidor de verdad) ───────── */
console.log('2. Todos los sitios de logro, con su foto y sin repetir')
for (const destino of ['roma', 'lanzarote']) {
  const sitios = Object.keys(datos.destinos[destino].sitios)
  const lugares = catalogos[destino].places ?? []
  const sinFoto = []
  const usos = new Map()
  const fuentes = {}
  let consultados = 0
  for (const id of sitios) {
    const nombre = lugares.find((p) => p.id === id)?.name
    if (!nombre) continue // sitios que no son parada (La Graciosa)
    consultados++
    const r = apiViva ? await pedirFoto(nombre, destino === 'roma' ? 'Roma' : 'Lanzarote') : null
    const url = r?.photo_url ? String(r.photo_url).split('?')[0].replace(/\/\d+px-/, '/') : null
    if (!url) {
      sinFoto.push(nombre)
      continue
    }
    fuentes[r.photo_source] = (fuentes[r.photo_source] ?? 0) + 1
    usos.set(url, [...(usos.get(url) ?? []), nombre])
  }
  debe(consultados >= 25 && sinFoto.length === 0, 'cobertura', `${destino}: ningún sitio de logro sin foto (${sinFoto.join(', ') || 'todos tienen'}; ${consultados} sitios; fuentes ${JSON.stringify(fuentes)})`)
  const repetidas = [...usos].filter(([, n]) => n.length > 1)
  debe(repetidas.length === 0, 'repetidas', `${destino}: ningún sitio lleva la foto de otro (${repetidas.map(([a, n]) => n.join(' + ')).join('; ') || 'ninguna repetida'})`)
}

/* ───────── 3. La página para elegir las 4 que quedan ───────── */
console.log('3. La página para elegir')
{
  const html = fs.readFileSync('docs/dias/V16_fotos/elegir.html', 'utf8')
  const opciones = leer('docs/dias/V16_fotos/elegir.json')
  const ids = Object.keys(opciones)
  debe(JSON.stringify(ids) === JSON.stringify(['lungotevere', 'borgo_pio', 'mirador_san_pietro_in_montorio', 'colle_oppio']), 'elegir', 'los 4 sitios que quedan sin foto: Lungotevere, Borgo Pio, el Mirador de San Pietro in Montorio y Colle Oppio')
  debe(ids.every((id) => opciones[id].candidatas.length === 3), 'elegir', 'cada sitio con 3 candidatas')
  debe(ids.every((id) => opciones[id].candidatas.every((c) => /^(CC BY(-SA)? [0-9.]+|CC0.*|Public domain.*)$/i.test(c.licencia) && c.pagina.startsWith('https://commons.wikimedia.org/wiki/File:') && c.autor)), 'elegir', 'todas de Wikimedia Commons con licencia libre (CC BY, CC BY-SA, CC0 o dominio público), con su autor y su página')
  debe((html.match(/<img /g) ?? []).length === 12 && /name="viewport"/.test(html) && ids.every((id) => html.includes(opciones[id].sitio)), 'elegir', 'la página lleva las 12 fotos, el nombre de cada sitio y se ve en el móvil (viewport)')
  const sinFotoAun = ['Lungotevere', 'Borgo Pio', 'Mirador de San Pietro in Montorio', 'Colle Oppio']
  const lugaresRoma = (catalogos.roma.places ?? []).map((p) => p.name)
  debe(sinFotoAun.every((n) => !lugaresRoma.some((l) => norma(l) === norma(n)) || !entradaDe('roma', n)), 'elegir', 'esos 4 siguen sin foto propia (se ponen con lo que elija Eric)')
}

console.log(`\n${comprobaciones} comprobaciones · ${fallos.length} fallos`)
for (const f of fallos) console.log(` ✗ [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
