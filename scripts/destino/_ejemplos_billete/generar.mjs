// Genera los billetes de EJEMPLO de las pruebas (10S5): una tarjeta de embarque de avión en PDF (con su código Aztec en formato IATA BCBP) y una captura de un billete de tren (con su código QR).
// TODOS LOS DATOS SON INVENTADOS (nombre PRUEBA/ANA, localizadores falsos): nunca datos reales de nadie.
//   node scripts/destino/_ejemplos_billete/generar.mjs
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { writeBarcode } from 'zxing-wasm/writer'
import { jsPDF } from 'jspdf'
import sharp from 'sharp'

const aqui = path.dirname(fileURLToPath(import.meta.url))

const pad = (t, n) => t.padEnd(n, ' ').slice(0, n)
// IATA BCBP, primer tramo: M1 + nombre(20) + E + localizador(7) + origen + destino + compañía(3) + vuelo(5) + día del año(3) + clase + asiento(4) + secuencia(5) + estado + 00
export const BCBP = `M1${pad('PRUEBA/ANA', 20)}E${pad('ABC123', 7)}BCNFCO${pad('VY', 3)}${pad('6102', 5)}339Y014C${pad('0045', 5)}100`

async function png(texto, formato, escala) {
  const r = await writeBarcode(texto, { format: formato, scale: escala, withQuietZones: true })
  return Buffer.from(await r.image.arrayBuffer())
}

// ── La tarjeta de embarque en PDF ──────────────────────────────────────────────────────────────────────────────────
const aztec = await png(BCBP, 'Aztec', 6)
const aztecPng = await sharp(aztec).png().toBuffer()
const pdf = new jsPDF({ unit: 'pt', format: 'a4' })
pdf.setFont('helvetica', 'bold'); pdf.setFontSize(22); pdf.text('VUELING', 50, 70)
pdf.setFontSize(12); pdf.setFont('helvetica', 'normal')
pdf.text('TARJETA DE EMBARQUE / BOARDING PASS', 50, 92)
const filas = [
  ['Pasajero / Passenger', 'PRUEBA/ANA'],
  ['Vuelo / Flight', 'VY 6102'],
  ['Fecha / Date', '05 DIC 2026'],
  ['Origen / From', 'Barcelona-El Prat (BCN)    Terminal 1'],
  ['Salida / Departure', '08:30'],
  ['Destino / To', 'Roma-Fiumicino (FCO)    Terminal 1'],
  ['Llegada / Arrival', '10:25'],
  ['Puerta / Gate', 'B34'],
  ['Asiento / Seat', '14C'],
  ['Localizador / Booking ref.', 'ABC123'],
]
let y = 140
for (const [k, v] of filas) {
  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9); pdf.setTextColor(110); pdf.text(k, 50, y)
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(13); pdf.setTextColor(0); pdf.text(v, 50, y + 16)
  y += 44
}
pdf.addImage(`data:image/png;base64,${aztecPng.toString('base64')}`, 'PNG', 330, 130, 200, 200)
pdf.setFontSize(8); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(120)
pdf.text('Documento de ejemplo con datos inventados (pruebas de la app).', 50, 800)
fs.writeFileSync(path.join(aqui, 'tarjeta_avion_ejemplo.pdf'), Buffer.from(pdf.output('arraybuffer')))

// ── La captura del billete de tren ─────────────────────────────────────────────────────────────────────────────────
const qr = await png('RENFE|03180|BCN-MAD|0001|COCHE003|ASIENTO01D|XYZ789|EJEMPLO-INVENTADO', 'QRCode', 8)
const qr64 = (await sharp(qr).png().toBuffer()).toString('base64')
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="780" height="1500" viewBox="0 0 780 1500">
  <rect width="780" height="1500" fill="#f2f2f4"/>
  <rect x="0" y="0" width="780" height="150" fill="#8a1538"/>
  <text x="40" y="95" font-family="Arial" font-size="44" font-weight="bold" fill="#fff">Renfe  ·  Tu billete</text>
  <rect x="30" y="180" width="720" height="1260" rx="24" fill="#fff"/>
  <text x="70" y="260" font-family="Arial" font-size="30" fill="#777">Sábado 12 de diciembre de 2026</text>
  <text x="70" y="370" font-family="Arial" font-size="84" font-weight="bold" fill="#111">08:10</text>
  <text x="70" y="425" font-family="Arial" font-size="34" fill="#111">Barcelona-Sants</text>
  <text x="70" y="540" font-family="Arial" font-size="84" font-weight="bold" fill="#111">11:12</text>
  <text x="70" y="595" font-family="Arial" font-size="34" fill="#111">Madrid-Puerta de Atocha</text>
  <text x="70" y="700" font-family="Arial" font-size="28" fill="#777">Tren</text>
  <text x="70" y="740" font-family="Arial" font-size="38" font-weight="bold" fill="#111">AVE 03180</text>
  <text x="340" y="700" font-family="Arial" font-size="28" fill="#777">Coche</text>
  <text x="340" y="740" font-family="Arial" font-size="38" font-weight="bold" fill="#111">003</text>
  <text x="520" y="700" font-family="Arial" font-size="28" fill="#777">Plaza</text>
  <text x="520" y="740" font-family="Arial" font-size="38" font-weight="bold" fill="#111">01D</text>
  <text x="70" y="830" font-family="Arial" font-size="28" fill="#777">Localizador</text>
  <text x="70" y="872" font-family="Arial" font-size="38" font-weight="bold" fill="#111">XYZ789</text>
  <image x="190" y="930" width="400" height="400" href="data:image/png;base64,${qr64}"/>
  <text x="390" y="1400" font-family="Arial" font-size="24" fill="#999" text-anchor="middle">Datos inventados para pruebas</text>
</svg>`
await sharp(Buffer.from(svg)).png().toFile(path.join(aqui, 'captura_tren_ejemplo.png'))
console.log('Ejemplos generados en', aqui, '· BCBP =', JSON.stringify(BCBP))
