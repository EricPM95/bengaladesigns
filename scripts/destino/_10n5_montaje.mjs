// Une varias capturas en una hoja de contactos (para mirarlas de un vistazo): node _10n5_montaje.mjs salida.jpg columnas ancho_celda archivo1 archivo2 ...
import sharp from 'sharp'
const [salida, cols, w, ...ficheros] = process.argv.slice(2)
const ancho = Number(w)
const celdas = []
for (const f of ficheros) {
  const b = await sharp(f).resize({ width: ancho }).toBuffer()
  celdas.push({ b, m: await sharp(b).metadata() })
}
const alto = Math.max(...celdas.map((c) => c.m.height))
const filas = Math.ceil(celdas.length / Number(cols))
const lienzo = sharp({ create: { width: ancho * Number(cols) + 4 * (Number(cols) - 1), height: alto * filas + 4 * (filas - 1), channels: 3, background: '#ffffff' } })
await lienzo.composite(celdas.map((c, i) => ({ input: c.b, left: (i % Number(cols)) * (ancho + 4), top: Math.floor(i / Number(cols)) * (alto + 4) }))).jpeg({ quality: 80 }).toFile(salida)
