// Genera los iconos y los sonidos PROVISIONALES de la Tanda 8A (sin dependencias: PNG y WAV a mano).
//   node scripts/generarIconosYSonidos.mjs
// Los de verdad los pondrá Eric más adelante, SIN tocar el código:
//   - los iconos: sustituir los PNG de public/icons/ (mismos nombres y tamaños);
//   - los sonidos: sustituir los archivos de public/sonidos/ o cambiar public/sonidos/sonidos.json (qué archivo suena en cada momento).
import fs from 'node:fs'
import zlib from 'node:zlib'

/* ── Iconos ── */
function crc32(buf) {
  let c
  const tabla = []
  for (let n = 0; n < 256; n++) {
    c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    tabla[n] = c >>> 0
  }
  let crc = 0xffffffff
  for (const b of buf) crc = tabla[(crc ^ b) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}
function trozo(tipo, datos) {
  const t = Buffer.from(tipo)
  const largo = Buffer.alloc(4)
  largo.writeUInt32BE(datos.length)
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([t, datos])))
  return Buffer.concat([largo, t, datos, crc])
}
function png(tam, { redondeado, margen }) {
  const rosa = [0xbd, 0x39, 0x64]
  const blanco = [255, 255, 255]
  const filas = []
  const c = (tam - 1) / 2
  for (let y = 0; y < tam; y++) {
    const fila = Buffer.alloc(1 + tam * 4)
    for (let x = 0; x < tam; x++) {
      // El fondo rosa (con esquinas redondeadas si toca), y una «ruta» blanca: un círculo hueco con un punto dentro.
      let dentro = true
      if (redondeado) {
        const r = tam * 0.22
        const dx = Math.max(Math.abs(x - c) - (c - r), 0)
        const dy = Math.max(Math.abs(y - c) - (c - r), 0)
        dentro = Math.hypot(dx, dy) <= r
      }
      const d = Math.hypot(x - c, y - c) / (tam * (0.5 - margen))
      const color = d <= 0.28 ? blanco : d >= 0.62 && d <= 0.78 ? blanco : rosa
      const i = 1 + x * 4
      fila[i] = color[0]
      fila[i + 1] = color[1]
      fila[i + 2] = color[2]
      fila[i + 3] = dentro ? 255 : 0
    }
    filas.push(fila)
  }
  const cab = Buffer.alloc(13)
  cab.writeUInt32BE(tam, 0)
  cab.writeUInt32BE(tam, 4)
  cab[8] = 8
  cab[9] = 6
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), trozo('IHDR', cab), trozo('IDAT', zlib.deflateSync(Buffer.concat(filas), { level: 9 })), trozo('IEND', Buffer.alloc(0))])
}
fs.mkdirSync('public/icons', { recursive: true })
fs.writeFileSync('public/icons/icon-192.png', png(192, { redondeado: true, margen: 0.04 }))
fs.writeFileSync('public/icons/icon-512.png', png(512, { redondeado: true, margen: 0.04 }))
fs.writeFileSync('public/icons/icon-maskable-512.png', png(512, { redondeado: false, margen: 0.16 }))
fs.writeFileSync('public/icons/apple-touch-icon.png', png(180, { redondeado: false, margen: 0.1 }))

/* ── Sonidos: tonos cortos, 8 kHz, 8 bits, mono (unos 8-16 KB cada uno) ── */
function wav(notas, duracion) {
  const hz = 8000
  const n = Math.floor(hz * duracion)
  const datos = Buffer.alloc(n)
  for (let i = 0; i < n; i++) {
    const t = i / hz
    let v = 0
    for (const { f, ini, dur } of notas) {
      if (t < ini || t > ini + dur) continue
      const u = (t - ini) / dur
      v += Math.sin(2 * Math.PI * f * t) * Math.exp(-4 * u) * Math.min(1, (t - ini) * 200)
    }
    datos[i] = Math.max(0, Math.min(255, Math.round(128 + (v / Math.max(1, notas.length * 0.6)) * 100)))
  }
  const cab = Buffer.alloc(44)
  cab.write('RIFF', 0)
  cab.writeUInt32LE(36 + n, 4)
  cab.write('WAVEfmt ', 8)
  cab.writeUInt32LE(16, 16)
  cab.writeUInt16LE(1, 20)
  cab.writeUInt16LE(1, 22)
  cab.writeUInt32LE(hz, 24)
  cab.writeUInt32LE(hz, 28)
  cab.writeUInt16LE(1, 32)
  cab.writeUInt16LE(8, 34)
  cab.write('data', 36)
  cab.writeUInt32LE(n, 40)
  return Buffer.concat([cab, datos])
}
const arpegio = (fs0, paso, dur) => fs0.map((f, i) => ({ f, ini: i * paso, dur }))
const sonidos = {
  visto: { notas: arpegio([660], 0, 0.8), duracion: 1.0 },
  pedazo: { notas: arpegio([523, 659], 0.12, 0.6), duracion: 1.0 },
  coleccion: { notas: arpegio([523, 659, 784], 0.14, 0.7), duracion: 1.4 },
  emblema: { notas: arpegio([392, 523, 659, 784, 1047], 0.16, 0.8), duracion: 2.0 },
  sello: { notas: arpegio([523, 659, 784, 1047], 0.15, 0.9), duracion: 1.8 },
  pais: { notas: arpegio([440, 554, 659], 0.13, 0.7), duracion: 1.4 },
  maravilla: { notas: arpegio([330, 440, 554, 659, 880], 0.18, 0.9), duracion: 2.4 },
  patrimonio: { notas: arpegio([392, 494, 587], 0.14, 0.8), duracion: 1.5 },
  viajero: { notas: arpegio([587, 740, 880], 0.12, 0.7), duracion: 1.3 },
  dia_completo: { notas: arpegio([523, 659, 784, 659, 784, 1047], 0.13, 0.7), duracion: 1.9 },
}
fs.mkdirSync('public/sonidos', { recursive: true })
const mapa = {}
for (const [momento, { notas, duracion }] of Object.entries(sonidos)) {
  fs.writeFileSync(`public/sonidos/${momento}.wav`, wav(notas, duracion))
  mapa[momento] = `/sonidos/${momento}.wav`
}
fs.writeFileSync(
  'public/sonidos/sonidos.json',
  JSON.stringify({ _nota: 'Qué archivo suena en cada momento (de 1 a 3 segundos, ligeros). Los de ahora son provisionales: para poner los de verdad, cambia los archivos o esta lista, sin tocar el código.', maximo_segundos: 3, sonidos: mapa }, null, 2) + '\n',
)
console.log('Iconos y sonidos provisionales generados.')
