// Genera la reserva de hotel de EJEMPLO de las pruebas (10S8): un PDF con la confirmación de un hotel de Roma. TODOS LOS DATOS SON INVENTADOS (hotel, teléfono y localizador falsos, sin nombres de huéspedes).
//   node scripts/destino/_ejemplos_billete/generarAlojamiento.mjs
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { jsPDF } from 'jspdf'

const aqui = path.dirname(fileURLToPath(import.meta.url))
const pdf = new jsPDF({ unit: 'pt', format: 'a4' })
pdf.setFont('helvetica', 'bold'); pdf.setFontSize(20); pdf.text('Booking confirmation / Confirmacion de reserva', 50, 70)
pdf.setFontSize(16); pdf.text('Hotel Ejemplo Monti', 50, 110)
pdf.setFont('helvetica', 'normal'); pdf.setFontSize(11)
pdf.text('Via Cavour 12, 00184 Roma, Italia', 50, 130)
pdf.text('Tel. +39 06 1234 5678', 50, 146)
const filas = [['Check-in', 'jueves 26 de noviembre de 2026 (desde las 15:00)'], ['Check-out', 'domingo 29 de noviembre de 2026 (hasta las 11:00)'], ['Noches / Nights', '3'], ['Habitacion / Room', 'Doble estandar, 2 adultos'], ['Numero de reserva / Confirmation number', '4821937560'], ['PIN', '0457'], ['Precio total', '420,00 EUR (pagado en el hotel)']]
let y = 200
for (const [k, v] of filas) {
  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9); pdf.setTextColor(110); pdf.text(k, 50, y)
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(12); pdf.setTextColor(0); pdf.text(v, 50, y + 16)
  y += 44
}
pdf.setFontSize(8); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(120)
pdf.text('Documento de ejemplo con datos inventados (pruebas de la app).', 50, 800)
fs.writeFileSync(path.join(aqui, 'reserva_hotel_ejemplo.pdf'), Buffer.from(pdf.output('arraybuffer')))
console.log('reserva_hotel_ejemplo.pdf generada')
