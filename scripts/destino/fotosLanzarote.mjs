// Pone las fotos de Lanzarote que ha elegido Eric (6-nov): 27 paradas + 2 de reserva, del paquete FOTOS_LANZAROTE (con su _fotos_eric.json).
//   node scripts/destino/fotosLanzarote.mjs <carpeta del paquete descomprimido>
// Por cada foto: public/fotos/lanzarote/<id>.jpg (1920 px como mucho) y <id>_p.jpg (la pequeña de la tarjeta, 960 px como las de ahora), y su entrada en data/dias/lanzarote/_fotos.json
// (origen «Eric», sin crédito en la app, con su campo `derechos`). Sustituyen a las de Commons de esas paradas (se quitan de las entradas viejas; las que se quedan sin parada se borran).
// Las 4 cuadradas o alargadas se recortan a 16:9 SIN perder lo importante. Se puede repetir: rehace lo mismo.
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

const PAQUETE = path.resolve(process.argv[2] ?? '')
if (!process.argv[2] || !fs.existsSync(path.join(PAQUETE, '_fotos_eric.json'))) {
  console.error('Uso: node scripts/destino/fotosLanzarote.mjs <carpeta con _fotos_eric.json y las fotos>')
  process.exit(1)
}
const CARPETA = path.resolve('public/fotos/lanzarote')
const TABLA = path.resolve('data/dias/lanzarote/_fotos.json')
const PEQUENA = 960

/** Los nombres con los que la app puede llamar a cada parada (además del de la lista de Eric): los de nuestros datos y los de `_paradas.json`. */
const OTROS_NOMBRES = {
  '01': ['Montañas del Fuego'],
  // (La de Commons de «Haría y la Casa-Museo César Manrique» era una costa de rocas, no Haría: vale la Casa-Museo de Eric.)
  '11': ['Haría y la Casa-Museo César Manrique'],
  '13': ['Fundación César Manrique'],
  '15': ['Teguise'],
  '18': ['Casa-Museo del Campesino'],
}
/** Los ids de nuestros datos (data/pipeline_v2/lanzarote.json) cuando no son el id sugerido del paquete. */
const ID_DE_DATOS = {
  '15': 'teguise',
  '17': 'ciudad_estratificada_rofera_de_teseguite',
  '19': 'las_grietas_montana_blanca',
  '20': 'arrecife_charco_de_san_gines_y_el_paseo',
  '22': 'playa_blanca_y_el_faro_de_pechiguera',
  '23': 'playa_blanca_y_el_faro_de_pechiguera',
}
/** Fotos de Commons que se quedan SIN foto (fondo de color) porque no enseñan el sitio: se revisaron las 10 que se conservan. */
const SIN_FOTO = { 'puerto_del_carmen_puerto_viejo.jpg': 'La de Commons es un aloe en una maceta, no el Puerto Viejo: sin foto antes que una equivocada.' }
/** Recortes a 16:9 (x, y de la esquina superior izquierda, como proporción de la foto) para no perder lo importante. */
const RECORTES = {
  '11': { x: 0.185, y: 0, nota: 'el patio con la cocina de leña' },
  '14': { x: 0, y: 0.034, nota: 'el molino' },
  '20': { x: 0, y: 0.16, nota: 'el charco con las barcas y las casas' },
  '25': { x: 0, y: 0.4, nota: 'la ermita y la escalinata' },
}

const lista = JSON.parse(fs.readFileSync(path.join(PAQUETE, '_fotos_eric.json'), 'utf8'))
const tabla = JSON.parse(fs.readFileSync(TABLA, 'utf8'))
const delaPortada = new Set([tabla.portada?.archivo, tabla.portada?.ruta_tarjeta, ...(tabla.portadas_candidatas ?? []).map((c) => path.basename(c.archivo ?? ''))].filter(Boolean).flatMap((a) => [a, a.replace(/\.jpg$/, '_p.jpg')]))

async function guardar(origen, destino, recorte) {
  let img = sharp(origen).rotate()
  const meta = await img.metadata()
  let ancho = meta.width
  let alto = meta.height
  if (recorte) {
    const h = Math.round(Math.min(alto, ancho * (9 / 16)))
    const w = Math.round(Math.min(ancho, h * (16 / 9)))
    const left = Math.min(Math.round(recorte.x * ancho), ancho - w)
    const top = Math.min(Math.round(recorte.y * alto), alto - h)
    img = img.extract({ left, top, width: w, height: h })
    ancho = w
    alto = h
  }
  const principal = ancho > 1920 ? 1920 : ancho
  await img.clone().resize({ width: principal, withoutEnlargement: true }).jpeg({ quality: 84, mozjpeg: true }).toFile(destino)
  const pequena = destino.replace(/\.jpg$/, '_p.jpg')
  await img.clone().resize({ width: Math.min(PEQUENA, ancho), withoutEnlargement: true }).jpeg({ quality: 80, mozjpeg: true }).toFile(pequena)
  return { ancho: Math.min(principal, ancho), alto: Math.round((alto * Math.min(principal, ancho)) / ancho) }
}

const nuevas = []
const nombresNuevos = new Set()
for (const f of lista) {
  if (!/^\d+$/.test(f.n)) continue
  const id = f.id_sugerido
  let archivo = `${id}.jpg`
  if (delaPortada.has(archivo)) archivo = `${id}_eric.jpg`
  const medidas = await guardar(path.join(PAQUETE, f.archivo), path.join(CARPETA, archivo), RECORTES[f.n])
  const lugares = [...new Set([f.parada, ...(OTROS_NOMBRES[f.n] ?? [])])]
  lugares.forEach((n) => nombresNuevos.add(n))
  nuevas.push({
    archivo,
    lugares,
    place_id: ID_DE_DATOS[f.n] ?? id,
    cuando: 'dia',
    ancho: medidas.ancho,
    fuente: 'Eric',
    origen: 'Eric',
    derechos: f.derechos === 'libre' ? 'libre' : 'revisar antes del lanzamiento',
    ...(RECORTES[f.n] ? { recorte_16_9: RECORTES[f.n].nota } : {}),
  })
}

// Las de reserva (X1, X2): se guardan, no se usan.
const reserva = []
fs.mkdirSync(path.join(CARPETA, 'reserva'), { recursive: true })
for (const f of lista) {
  if (/^\d+$/.test(f.n)) continue
  const nombre = f.archivo.replace(/^X\d+_/, 'reserva_')
  const m = await guardar(path.join(PAQUETE, f.archivo), path.join(CARPETA, 'reserva', nombre))
  reserva.push({ archivo: `reserva/${nombre}`, parada: f.parada, ancho: m.ancho, origen: 'Eric', derechos: f.derechos === 'libre' ? 'libre' : 'revisar antes del lanzamiento', nota: 'De reserva: se guarda y NO se usa.' })
}

// Sustituyen a las de Commons: se quitan los nombres de las entradas viejas; la que se queda sin parada se borra (con sus archivos).
const viejas = []
const borradas = []
for (const foto of tabla.fotos) {
  if (nuevas.some((n) => n.archivo === foto.archivo)) continue
  if (SIN_FOTO[foto.archivo]) {
    for (const lugar of foto.lugares ?? []) if (!(tabla.sin_foto ?? []).some((s) => s.lugar === lugar)) (tabla.sin_foto ??= []).push({ lugar, motivo: SIN_FOTO[foto.archivo] })
    borradas.push(foto.archivo)
    for (const a of [foto.archivo, foto.archivo.replace(/\.jpg$/, '_p.jpg')]) fs.rmSync(path.join(CARPETA, a), { force: true })
    continue
  }
  const lugares = (foto.lugares ?? []).filter((n) => !nombresNuevos.has(n))
  if ((foto.lugares ?? []).length > 0 && lugares.length === 0 && foto.cuando !== 'portada') {
    borradas.push(foto.archivo)
    if (!delaPortada.has(foto.archivo)) for (const a of [foto.archivo, foto.archivo.replace(/\.jpg$/, '_p.jpg')]) fs.rmSync(path.join(CARPETA, a), { force: true })
    continue
  }
  viejas.push({ ...foto, lugares })
}
const portada = viejas.filter((f) => f.cuando === 'portada')
const resto = viejas.filter((f) => f.cuando !== 'portada')
tabla.fotos = [...portada, ...nuevas, ...resto]
tabla.reserva = reserva
// Dos reglas nuevas del 6-nov: el cruce por nombre normalizado (también por `place_id`) y, en Lanzarote, NUNCA la foto de Wikipedia ni de Unsplash de reserva (sin foto nuestra, el fondo de color).
tabla.cruce_normalizado = true
tabla.solo_fotos_propias = true
tabla._notas_6nov = 'Fotos de Eric (6-nov, scripts/destino/fotosLanzarote.mjs): `origen: "Eric"`, sin crédito en la app; `derechos` «libre» o «revisar antes del lanzamiento». Las pequeñas (_p) miden 960 px de ancho como las de antes. `cruce_normalizado`: el nombre de la parada se cruza con `lugares` sin mirar tildes, mayúsculas ni paréntesis. `solo_fotos_propias`: sin foto de esta tabla, la parada va con el fondo de color, nunca con Wikipedia ni Unsplash.'
fs.writeFileSync(TABLA, `${JSON.stringify(tabla, null, 2)}\n`)
console.log(`Fotos de Eric puestas: ${nuevas.length} (+${reserva.length} de reserva). Entradas viejas de Commons quitadas: ${borradas.length} (${borradas.join(', ')}).`)
