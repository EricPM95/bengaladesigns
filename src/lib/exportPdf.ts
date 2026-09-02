import { jsPDF } from 'jspdf'
import type { Route } from './types'

const MARGIN = 15
const PAGE_WIDTH = 210
const PAGE_HEIGHT = 297
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2

interface LineOptions {
  size?: number
  bold?: boolean
  color?: [number, number, number]
  gap?: number
}

export function exportRouteToPdf(route: Route) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  let y = MARGIN

  const ensureSpace = (needed: number) => {
    if (y + needed > PAGE_HEIGHT - MARGIN) {
      doc.addPage()
      y = MARGIN
    }
  }

  const writeLine = (text: string, options: LineOptions = {}) => {
    const { size = 10, bold = false, color = [30, 30, 30], gap = 4 } = options
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    doc.setFontSize(size)
    doc.setTextColor(color[0], color[1], color[2])
    const lines = doc.splitTextToSize(text, CONTENT_WIDTH) as string[]
    const lineHeight = size * 0.42
    ensureSpace(lines.length * lineHeight + gap)
    doc.text(lines, MARGIN, y)
    y += lines.length * lineHeight + gap
  }

  writeLine(`Ruta: ${route.destination}`, { size: 22, bold: true, gap: 2 })
  writeLine(`${route.days.length} días · desde ${route.origin}`, { size: 11, color: [110, 110, 110], gap: 8 })

  route.days.forEach((day) => {
    ensureSpace(16)
    writeLine(`Día ${day.dayNumber} — ${day.title}`, { size: 15, bold: true, color: [13, 148, 136], gap: 4 })

    if (day.transport) {
      writeLine(`✈ ${day.transport.fromCity} → ${day.transport.toCity} (${day.transport.durationLabel})`, { gap: 3 })
    }
    if (day.hotel) {
      writeLine(`🏨 ${day.hotel.recommendedArea}, ${day.hotel.city} · ${day.hotel.nights} noches`, { gap: 3 })
    }

    day.stops.forEach((stop) => {
      writeLine(`${stop.time} — ${stop.name}`, { size: 11.5, bold: true, gap: 1 })
      writeLine(stop.description, { size: 9.5, color: [90, 90, 90], gap: 1 })
      if (stop.priceInfo) writeLine(`Precio: ${stop.priceInfo}`, { size: 9, color: [110, 110, 110], gap: 1 })
      if (stop.insiderTip) writeLine(`Truco: ${stop.insiderTip}`, { size: 9, color: [15, 118, 110], gap: 1 })
      y += 3
    })

    day.meals.forEach((meal) => {
      writeLine(`${meal.time} — ${meal.label}`, { size: 10.5, bold: true, gap: 1 })
      meal.restaurants.forEach((restaurant) => {
        writeLine(
          `  ${restaurant.priceTier} ${restaurant.name} (${restaurant.cuisine}) — ${restaurant.priceRange}`,
          { size: 9, color: [110, 110, 110], gap: 0.5 },
        )
      })
      y += 3
    })

    if (day.excursions && day.excursions.length > 0) {
      writeLine('Opciones de excursión:', { size: 10.5, bold: true, gap: 1 })
      day.excursions.forEach((excursion) => {
        writeLine(`  ${excursion.title} — ${excursion.durationLabel} — €${excursion.price}`, { size: 9, color: [110, 110, 110], gap: 0.5 })
      })
      y += 3
    }

    y += 4
  })

  ensureSpace(12)
  writeLine(`Presupuesto estimado: €${route.budget.total}`, { size: 13, bold: true, gap: 2 })

  doc.save(`${route.destination.toLowerCase().replace(/\s+/g, '-')}-route-planner.pdf`)
}
