// Genera la entrada de EJEMPLO de las pruebas (10S7): un PDF de una entrada al Coliseo con su código QR. TODOS LOS DATOS SON INVENTADOS (localizador falso, sin nombres de nadie).
//   node scripts/destino/_ejemplos_billete/generarEntrada.mjs
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { writeBarcode } from 'zxing-wasm/writer'
import { jsPDF } from 'jspdf'
import sharp from 'sharp'

const aqui = path.dirname(fileURLToPath(import.meta.url))
export const TEXTO_QR = 'COLOSSEUM|ABC123|2026-12-05|09:00|2PAX|EJEMPLO-INVENTADO'
const r = await writeBarcode(TEXTO_QR, { format: 'QRCode', scale: 8, withQuietZones: true })
const qr = await sharp(Buffer.from(await r.image.arrayBuffer())).png().toBuffer()
const pdf = new jsPDF({ unit: 'pt', format: 'a4' })
pdf.setFont('helvetica', 'bold'); pdf.setFontSize(22); pdf.text('COLOSEO, FORO Y PALATINO', 50, 70)
pdf.setFontSize(12); pdf.setFont('helvetica', 'normal'); pdf.text('ENTRADA / TICKET', 50, 92)
const filas = [['Fecha / Date', '05 DIC 2026'], ['Hora / Time', '09:00'], ['Personas / Visitors', '2 adultos'], ['Localizador / Booking ref.', 'ABC123']]
let y = 140
for (const [k, v] of filas) {
  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9); pdf.setTextColor(110); pdf.text(k, 50, y)
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(13); pdf.setTextColor(0); pdf.text(v, 50, y + 16)
  y += 44
}
pdf.addImage(`data:image/png;base64,${qr.toString('base64')}`, 'PNG', 330, 130, 200, 200)
pdf.setFontSize(8); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(120)
pdf.text('Documento de ejemplo con datos inventados (pruebas de la app).', 50, 800)
fs.writeFileSync(path.join(aqui, 'entrada_coliseo_ejemplo.pdf'), Buffer.from(pdf.output('arraybuffer')))
console.log('entrada_coliseo_ejemplo.pdf generada')
