// (20-nov, elegidas por Eric 19-nov) Las 4 fotos de Roma que faltaban, de Wikimedia Commons, con su autor y licencia: se bajan, se dejan a 1600 px (ficha) y 640 px (_p, tarjeta) y se apuntan en data/dias/roma/_fotos.json.
// Commons limita la velocidad de descarga (429): se reintenta con esperas y, si la foto ya está bajada, solo se apunta.
//   node scripts/destino/ponerFotosRoma4.mjs
import fs from 'node:fs'
import sharp from 'sharp'

const FOTOS = [
  { id: 'dia_lungotevere', lugares: ['Lungotevere'], archivo: 'Prati - palazzaccio dal tevere 1170069.JPG', autor: 'Lalupa', licencia: 'CC BY-SA 3.0' },
  { id: 'dia_borgo_pio', lugares: ['Borgo Pio'], archivo: 'Borgo 2947.JPG', autor: 'Carlomorino', licencia: 'CC BY-SA 3.0' },
  { id: 'dia_mirador_san_pietro_in_montorio', lugares: ['Mirador de San Pietro in Montorio', 'El mirador de San Pietro in Montorio'], archivo: 'View of Rome from Piazza San Pietro in Montorio (2).jpg', autor: 'Krzysztof Golik', licencia: 'CC BY-SA 4.0' },
  { id: 'dia_colle_oppio', lugares: ['Colle Oppio'], archivo: 'Il Colosseo dal parco di Colle Oppio.JPG', autor: 'Shardan', licencia: 'CC BY-SA 3.0' },
]
const UA = { 'user-agent': 'JutripFotos/1.0 (fotos con licencia libre; contacto en el repositorio)' }
const dormir = (ms) => new Promise((res) => setTimeout(res, ms))
const pedir = async (u) => {
  for (let intento = 0; intento < 10; intento++) {
    const x = await fetch(u, { redirect: 'follow', headers: UA })
    if (x.status !== 429) return x
    console.log('  429, espero', 30 * (intento + 1), 's')
    await dormir(30000 * (intento + 1))
  }
  return null
}
const arch = JSON.parse(fs.readFileSync('data/dias/roma/_fotos.json', 'utf8'))
const guardar = () => fs.writeFileSync('data/dias/roma/_fotos.json', JSON.stringify(arch, null, 2) + '\n')

for (const f of FOTOS) {
  const grandeRuta = `public/fotos/roma/${f.id}.jpg`
  const pequenaRuta = `public/fotos/roma/${f.id}_p.jpg`
  const enlace = `https://commons.wikimedia.org/wiki/File:${f.archivo.replace(/ /g, '_')}`
  if (!(fs.existsSync(grandeRuta) && fs.existsSync(pequenaRuta))) {
    const info = await pedir('https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url&iiurlwidth=1920&titles=' + encodeURIComponent('File:' + f.archivo))
    const datos = info && info.ok ? await info.json() : null
    const pagina = datos ? Object.values(datos.query.pages)[0] : null
    const miniatura = pagina?.imageinfo?.[0]?.thumburl
    if (!miniatura) {
      console.log('SIN MINIATURA', f.archivo, info?.status ?? 'sin respuesta')
      continue
    }
    await dormir(3000)
    const r = await pedir(miniatura)
    if (!r || !r.ok) {
      console.log('NO SE PUDO BAJAR', f.archivo, r?.status ?? 'sin respuesta')
      continue
    }
    const buf = Buffer.from(await r.arrayBuffer())
    fs.writeFileSync(grandeRuta, await sharp(buf).rotate().resize({ width: 1600, withoutEnlargement: true }).jpeg({ quality: 80, mozjpeg: true }).toBuffer())
    fs.writeFileSync(pequenaRuta, await sharp(buf).rotate().resize({ width: 640, withoutEnlargement: true }).jpeg({ quality: 78, mozjpeg: true }).toBuffer())
    await dormir(15000)
  }
  const m = await sharp(grandeRuta).metadata()
  arch.fotos = arch.fotos.filter((x) => x.archivo !== `${f.id}.jpg`)
  arch.fotos.push({ archivo: `${f.id}.jpg`, lugares: f.lugares, cuando: 'dia', ancho: m.width, fuente: `Wikimedia Commons · ${f.licencia}`, autor: f.autor, enlace, credito: { autor: f.autor, licencia: f.licencia, enlace }, derechos: 'libre (con crédito)' })
  arch.sin_foto = arch.sin_foto.filter((n) => !f.lugares.includes(n))
  guardar()
  console.log('OK', f.id, `${Math.round(fs.statSync(grandeRuta).size / 1024)} KB · ${Math.round(fs.statSync(pequenaRuta).size / 1024)} KB`, `${m.width}x${m.height}`)
}
