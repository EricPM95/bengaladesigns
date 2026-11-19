// (V16b) Busca en Wikimedia Commons (licencia libre: CC BY, CC BY-SA, CC0 o dominio público) candidatas para los 4 sitios de Roma sin foto y saca, por sitio, una hoja de contacto numerada para mirarlas.
//   node scripts/destino/candidatasV16b.mjs <carpeta de salida>
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

const SALIDA = process.argv[2] ?? '.'
fs.mkdirSync(SALIDA, { recursive: true })
const UA = 'JutripFotos/1.0 (revision de fotos de destinos)'
const pausa = (ms) => new Promise((r) => setTimeout(r, ms))
const LIBRE = /^(CC BY(-SA)? [0-9.]+|CC BY(-SA)?|CC0.*|Public domain.*|PD.*)$/i

const SITIOS = {
  lungotevere: { nombre: 'Lungotevere', busquedas: ['Lungotevere Roma Tevere banchina', 'Lungotevere dei Mellini', 'Lungotevere Tiber embankment Rome plane trees', 'Lungotevere Roma muraglioni'] },
  borgo_pio: { nombre: 'Borgo Pio', busquedas: ['Borgo Pio Roma via', 'Borgo Pio street Rome Vatican', 'Via di Borgo Pio'] },
  mirador_san_pietro_in_montorio: { nombre: 'Mirador de San Pietro in Montorio', busquedas: ['San Pietro in Montorio terrace view Rome', 'Terrazza San Pietro in Montorio panorama', 'Roma panorama dal Gianicolo San Pietro in Montorio', 'Piazza San Pietro in Montorio'] },
  colle_oppio: { nombre: 'Colle Oppio', busquedas: ['Colle Oppio Roma parco', 'Parco del Colle Oppio Rome', 'Colle Oppio Domus Aurea park'] },
}

const sinHtml = (t) => String(t ?? '').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim()
async function buscar(q) {
  const api = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrlimit=20&gsrsearch=${encodeURIComponent(q + ' filetype:bitmap')}&prop=imageinfo&iiprop=url|size|mime|extmetadata&iiurlwidth=800&format=json`
  const r = await (await fetch(api, { headers: { 'User-Agent': UA } })).json()
  return Object.values(r.query?.pages ?? {})
}

const salida = {}
for (const [id, s] of Object.entries(SITIOS)) {
  const vistas = new Map()
  for (const q of s.busquedas) {
    for (const p of await buscar(q)) {
      const i = p.imageinfo?.[0]
      if (!i || !/jpeg/.test(i.mime) || i.width < 1200 || vistas.has(p.title)) continue
      const em = i.extmetadata ?? {}
      const licencia = sinHtml(em.LicenseShortName?.value)
      if (!LIBRE.test(licencia)) continue
      vistas.set(p.title, { titulo: p.title.replace(/^File:/, ''), licencia, autor: sinHtml(em.Artist?.value).slice(0, 120), pagina: i.descriptionurl, miniatura: i.thumburl, ancho: i.width, alto: i.height, descripcion: sinHtml(em.ImageDescription?.value).slice(0, 140) })
    }
    await pausa(1200)
  }
  const lista = [...vistas.values()].slice(0, 10)
  salida[id] = { nombre: s.nombre, candidatas: lista }
  // Hoja de contacto numerada.
  const celdas = []
  for (const [k, c] of lista.entries()) {
    try {
      const buf = Buffer.from(await (await fetch(c.miniatura, { headers: { 'User-Agent': UA } })).arrayBuffer())
      const mini = await sharp(buf).resize(300, 220, { fit: 'cover' }).jpeg().toBuffer()
      celdas.push({ k, mini })
    } catch {
      celdas.push({ k, mini: null })
    }
    await pausa(700)
  }
  const cols = 5
  const filas = Math.ceil(celdas.length / cols)
  const hoja = sharp({ create: { width: cols * 300, height: Math.max(1, filas) * 220, channels: 3, background: '#fff' } })
  const capas = []
  for (const { k, mini } of celdas) {
    if (!mini) continue
    capas.push({ input: mini, left: (k % cols) * 300, top: Math.floor(k / cols) * 220 })
    const etiqueta = Buffer.from(`<svg width="60" height="40"><rect width="60" height="40" fill="#000" opacity=".75"/><text x="10" y="30" font-size="28" fill="#fff" font-family="Arial">${k + 1}</text></svg>`)
    capas.push({ input: etiqueta, left: (k % cols) * 300, top: Math.floor(k / cols) * 220 })
  }
  await hoja.composite(capas).jpeg({ quality: 80 }).toFile(path.join(SALIDA, `hoja_${id}.jpg`))
  console.log(id, lista.length, 'candidatas')
}
fs.writeFileSync(path.join(SALIDA, 'candidatas.json'), JSON.stringify(salida, null, 2))
