// (V16b) Pone las fotos nuevas de Lanzarote y de Roma: copia (o baja de Wikimedia Commons) cada foto a public/fotos/<destino>/, hace su _p.jpg de 640 px y apunta su línea en data/dias/<destino>/_fotos.json.
//   node scripts/destino/ponerFotosV16b.mjs <carpeta con FOTOS_LANZAROTE_V16> <carpeta con FOTOS_ROMA_V16>
// Una sola vez (idempotente: si la línea ya está, la sustituye). Para Wikimedia usa un cliente genérico (sin datos de nadie) y espera entre peticiones.
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

const [CARPETA_LZ, CARPETA_ROMA] = process.argv.slice(2)
if (!CARPETA_LZ || !CARPETA_ROMA) throw new Error('Uso: node scripts/destino/ponerFotosV16b.mjs <FOTOS_LANZAROTE_V16> <FOTOS_ROMA_V16>')
const UA = 'JutripFotos/1.0 (revision de fotos de destinos)'
const pausa = (ms) => new Promise((r) => setTimeout(r, ms))
const norma = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim()
const DERECHOS_ERIC = 'revisar antes del lanzamiento'

const leerJson = (f) => JSON.parse(fs.readFileSync(f, 'utf8'))
const escribirJson = (f, d) => {
  const crlf = fs.readFileSync(f, 'utf8').includes('\r\n')
  fs.writeFileSync(f, JSON.stringify(d, null, 2).replace(/\n/g, crlf ? '\r\n' : '\n') + (crlf ? '\r\n' : '\n'))
}

async function ponerArchivo(destino, origen, archivo) {
  const publico = `public/fotos/${destino}`
  fs.copyFileSync(origen, path.join(publico, archivo))
  const meta = await sharp(origen).metadata()
  // La pequeña (640 px de ancho) para tarjetas y miniaturas; nunca se agranda una foto más pequeña.
  await sharp(origen).rotate().resize({ width: Math.min(640, meta.width), withoutEnlargement: true }).jpeg({ quality: 82 }).toFile(path.join(publico, archivo.replace(/\.jpg$/, '_p.jpg')))
  return meta.width
}

function aplicarLinea(json, linea) {
  const nombres = new Set(linea.lugares.map(norma))
  // Sustituye lo que había para ese sitio (la misma foto o una de otro origen para esos lugares).
  json.fotos = json.fotos.filter((f) => f.archivo !== linea.archivo && !(f.lugares ?? []).some((l) => nombres.has(norma(l))))
  json.fotos.push(linea)
  // Ya no está sin foto ni rechazado.
  if (Array.isArray(json.fotos_rechazadas)) json.fotos_rechazadas = json.fotos_rechazadas.filter((r) => !nombres.has(norma(r.lugar)))
  if (Array.isArray(json.sin_foto)) json.sin_foto = json.sin_foto.filter((r) => !nombres.has(norma(typeof r === 'string' ? r : r.lugar)))
}

/* ───────── Lanzarote ───────── */
{
  const f = 'data/dias/lanzarote/_fotos.json'
  const json = leerJson(f)
  const catalogo = leerJson('data/pipeline_v2/lanzarote.json')
  const nombreDe = (id) => (catalogo.places ?? []).find((p) => p.id === id)?.name ?? null
  const LISTA = [
    { archivo: 'bodega_el_grifo.jpg', id: 'bodega_el_grifo', nombreSiNoHay: 'Bodega El Grifo' },
    { archivo: 'bodega_la_geria.jpg', id: 'bodega_la_geria', nombreSiNoHay: 'Bodega La Geria' },
    { archivo: 'mirador_del_bosquecillo.jpg', id: 'mirador_del_bosquecillo', nombreSiNoHay: 'Mirador del Bosquecillo (Risco de Famara)' },
    { archivo: 'playa_de_la_garita.jpg', id: 'playa_de_la_garita', nombreSiNoHay: 'Playa de la Garita', permiso: true },
  ]
  for (const x of LISTA) {
    const ancho = await ponerArchivo('lanzarote', path.join(CARPETA_LZ, x.archivo), x.archivo)
    const nombre = nombreDe(x.id) ?? x.nombreSiNoHay
    const base = { archivo: x.archivo, lugares: [nombre], place_id: x.id, cuando: 'dia', ancho }
    const linea = x.permiso
      ? { ...base, fuente: 'turismoharia.com · con permiso del autor', autor: 'Turismo de Haría', enlace: 'https://turismoharia.com', origen: 'Turismo de Haría', derechos: 'con permiso del autor', credito: { autor: 'Turismo de Haría', licencia: 'con permiso del autor', enlace: 'https://turismoharia.com' }, credito_texto: 'Foto: Turismo de Haría' }
      : { ...base, fuente: 'Eric', origen: 'Eric', derechos: DERECHOS_ERIC }
    aplicarLinea(json, linea)
    console.log('Lanzarote', x.archivo, ancho + ' px', '→', nombre)
  }
  escribirJson(f, json)
}

/* ───────── Roma: las 8 de Eric ───────── */
const roma = leerJson('data/dias/roma/_fotos.json')
{
  const LISTA = [
    ['dia_iglesia_del_gesu.jpg', ['Iglesia del Gesù', 'Iglesia del Gesù (por dentro)']],
    ['dia_san_ignacio_de_loyola.jpg', ['Iglesia de San Ignacio de Loyola']],
    ['dia_via_del_babuino.jpg', ['Via del Babuino']],
    ['dia_via_dei_coronari.jpg', ['Via dei Coronari']],
    ['dia_testaccio.jpg', ['Testaccio']],
    ['dia_via_di_ripetta.jpg', ['Via di Ripetta']],
    ['dia_terraza_largo_gaetana_agnesi.jpg', ['Terraza de Largo Gaetana Agnesi']],
    ['dia_cripta_capuchinos.jpg', ['Cripta de los Capuchinos']],
  ]
  for (const [archivo, lugares] of LISTA) {
    const ancho = await ponerArchivo('roma', path.join(CARPETA_ROMA, archivo), archivo)
    aplicarLinea(roma, { archivo, lugares, cuando: 'dia', ancho, fuente: 'Eric', origen: 'Eric', derechos: DERECHOS_ERIC })
    console.log('Roma', archivo, ancho + ' px', '→', lugares[0])
  }
}

/* ───────── Roma: Ponte Sisto y Plaza del Quirinal, de Wikimedia Commons ───────── */
async function deCommons(titulo, archivoLocal, lugares) {
  const api = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent('File:' + titulo)}&prop=imageinfo&iiprop=url|size|extmetadata&iiurlwidth=1600&format=json`
  const r = await (await fetch(api, { headers: { 'User-Agent': UA } })).json()
  const pagina = Object.values(r.query.pages)[0]
  const info = pagina.imageinfo?.[0]
  if (!info) throw new Error('Commons no tiene ' + titulo)
  const em = info.extmetadata ?? {}
  const sinHtml = (t) => String(t ?? '').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').trim()
  const credito = { autor: sinHtml(em.Artist?.value), licencia: sinHtml(em.LicenseShortName?.value), enlace: info.descriptionurl }
  await pausa(1500)
  const img = await fetch(info.thumburl, { headers: { 'User-Agent': UA } })
  if (!img.ok) throw new Error('No se pudo bajar ' + titulo + ': ' + img.status)
  const buf = Buffer.from(await img.arrayBuffer())
  const tmp = path.join(fs.mkdtempSync(path.join(process.env.TEMP ?? '.', 'v16b-')), archivoLocal)
  fs.writeFileSync(tmp, buf)
  const ancho = await ponerArchivo('roma', tmp, archivoLocal)
  aplicarLinea(roma, { archivo: archivoLocal, lugares, cuando: 'dia', ancho, fuente: `Wikimedia Commons · ${credito.licencia}`, autor: credito.autor, enlace: credito.enlace, credito, derechos: 'libre (con crédito)' })
  console.log('Commons', titulo, '→', archivoLocal, ancho + ' px', JSON.stringify(credito))
  return { credito, titulo, lugares, pagina: info.descriptionurl, dominio_publico: /public domain|cc0|pd/i.test(credito.licencia) }
}
const nuevos = []
nuevos.push(await deCommons('Ponte_Sisto_Roma.jpg', 'dia_ponte_sisto.jpg', ['Ponte Sisto']))
await pausa(1500)
nuevos.push(await deCommons('Quirinale_palazzo_e_obelisco_con_dioscuri_Roma.jpg', 'dia_plaza_del_quirinal.jpg', ['Plaza del Quirinal']))
escribirJson('data/dias/roma/_fotos.json', roma)

// Ya no se sirven de Wikipedia: fuera sus líneas de crédito dinámico (las propias llevan el suyo en _fotos.json).
{
  const f = 'data/dias/roma/_fotos_wikimedia.json'
  const w = leerJson(f)
  const propios = new Set(roma.fotos.flatMap((x) => (x.lugares ?? []).map(norma)))
  const antes = w.fotos.length
  w.fotos = w.fotos.filter((x) => !(x.lugares ?? []).some((l) => propios.has(norma(l))))
  console.log('Créditos de Wikimedia que ya no hacen falta:', antes - w.fotos.length)
  escribirJson(f, w)
}
fs.writeFileSync('docs/dias/_fotos_v16b_commons.json', JSON.stringify(nuevos, null, 2))
console.log('Hecho.')
