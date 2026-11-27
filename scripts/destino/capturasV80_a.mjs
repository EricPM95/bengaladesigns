// V80 (agente A): capturas en modo iPhone (390 de ancho, alta para ver el día entero) de EX1-EX6 con datos reales. Un Chrome, cerrado al acabar.
//   node scripts/destino/_conCola.mjs node scripts/destino/capturasV80_a.mjs ex1,ex2,ex3,ex4,ex5,ex6
import path from 'node:path'
import fs from 'node:fs'
import { abrirV80, montar } from './_v80_a_comun.mjs'

const CAP = path.resolve('docs/dias/V80_capturas')
fs.mkdirSync(CAP, { recursive: true })
const quiero = (process.argv[2] ?? 'ex1,ex2,ex3,ex4,ex5,ex6').split(',')
const ISLA = { lat: 29.2316, lng: -13.5036 }
const ORZOLA = { lat: 29.22344, lng: -13.452461 }
const ferry = (id, time, origen, destino, extra = {}) => ({ id, kind: 'ferry', refId: id, name: `Ferry a ${destino}`, time, origen, destinoDeViaje: destino, compania: 'Líneas Romero', noMueve: true, unidaA: 'la_graciosa', ...extra })
const tren = (id, time, returnTime, origen, destino) => ({ id, kind: 'tren', refId: id, name: `Tren a ${destino}`, time, returnTime, origen, destinoDeViaje: destino, compania: 'Italo', noMueve: true, unidaA: 'florencia_tren' })
const POMPEYA = { id: 'pompeya_sorrento', title: 'Excursión a Pompeya y Sorrento', length: 'full-day', durationLabel: '13 h', price: 98.26, description: 'Descubre las ruinas de Pompeya con guía y pasea por Sorrento, la joya de la costa napolitana. Incluye transporte en autobús, entrada a Pompeya y tiempo libre en Sorrento.', durationText: '12-13 h', destinationCoords: { lat: 40.7497, lng: 14.4869 }, page: { nameBefore: 'Excursión a', nameDestination: 'Pompeya', nameAfter: ' y Sorrento', shortName: 'Pompeya', halfDay: false } }
const FLORENCIA = { id: 'florencia_tren', title: 'Excursión a Florencia en tren de alta velocidad', length: 'full-day', durationLabel: '13 h', price: 149, destinationCoords: { lat: 43.7696, lng: 11.2558 }, page: { nameBefore: 'Excursión a', nameDestination: 'Florencia', nameAfter: ' en tren de alta velocidad', shortName: 'Florencia', halfDay: false } }

const lz = await abrirV80('lanza')
const ids = lz.sonda.dias.find((d) => d.tipo === 'excursion')
const DIA_LZ = ids.n
const alta = async (v, alto = 1900) => {
  await v.a.cdp('Emulation.setDeviceMetricsOverride', { width: 390, height: alto, deviceScaleFactor: 1, mobile: true })
  await v.a.esp(900)
}
const baja = (v) => v.a.cdp('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true })
try {
  if (quiero.includes('ex1')) {
    await montar(lz, { dia: DIA_LZ, min: 8 * 60, fecha: '2026-11-27' })
    await alta(lz)
    await lz.a.captura(path.join(CAP, 'ex1_app.jpg'))
    await baja(lz)
  }
  if (quiero.includes('ex2')) {
    await montar(lz, { dia: DIA_LZ, min: 12 * 60 + 30, pos: ISLA, fecha: '2026-11-27', reservas: [ferry('f-ida', '10:00', 'Órzola', 'La Graciosa'), ferry('f-vuelta', '17:00', 'La Graciosa', 'Órzola')] })
    await alta(lz)
    await lz.a.captura(path.join(CAP, 'ex2_app.jpg'))
    await baja(lz)
  }
  if (quiero.includes('ex3')) {
    await montar(lz, { dia: DIA_LZ, min: 16 * 60 + 15, pos: ISLA, fecha: '2026-11-27' })
    await alta(lz)
    await lz.a.captura(path.join(CAP, 'ex3_app.jpg'))
    await baja(lz)
  }
  if (quiero.includes('ex5')) {
    await montar(lz, { dia: DIA_LZ, min: 9 * 60 + 30, pos: ORZOLA, fecha: '2026-11-27', estado: { llegado: true } })
    await alta(lz)
    await lz.a.captura(path.join(CAP, 'ex5_app.jpg'))
    await baja(lz)
  }
} finally {
  lz.cerrar()
}
if (quiero.some((q) => ['ex4', 'ex6'].includes(q))) {
  const rm = await abrirV80('roma')
  try {
    if (quiero.includes('ex4')) {
      await montar(rm, { dia: 3, min: 9 * 60, fecha: '2026-11-26', excursion: POMPEYA, reservas: [{ id: 'r-pompeya', kind: 'excursion', refId: 'pompeya_sorrento', name: 'Pompeya y Sorrento', time: '07:30', excursionId: 'pompeya_sorrento', locator: 'CIV123' }] })
      await alta(rm)
      await rm.a.captura(path.join(CAP, 'ex4_app.jpg'))
      await baja(rm)
    }
    if (quiero.includes('ex6')) {
      await montar(rm, { dia: 3, min: 7 * 60 + 30, fecha: '2026-11-28', excursion: FLORENCIA, reservas: [tren('t-ida', '08:15', '09:50', 'Roma Termini', 'Santa Maria Novella')] })
      await alta(rm)
      await rm.a.captura(path.join(CAP, 'ex6_app.jpg'))
      await baja(rm)
    }
  } finally {
    rm.cerrar()
  }
}
process.exit(0)
