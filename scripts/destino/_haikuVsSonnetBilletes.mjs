// 10S8 §1 (agente A): ¿lee claude-haiku-4-5 igual de bien que claude-sonnet-4-6 los documentos? 3 ejemplos (tarjeta de embarque, entrada, reserva de hotel) × 2 modelos = 6 llamadas REALES.
//   node scripts/destino/_haikuVsSonnetBilletes.mjs            (necesita ANTHROPIC_API_KEY en .env.local; no escribe nada, solo imprime)
// Compara cada campo con lo que dice el documento de ejemplo (datos inventados) y calcula el coste de cada lectura.
import fs from 'node:fs'
import path from 'node:path'
import Anthropic from '@anthropic-ai/sdk'
import { LEER_BILLETE_SISTEMA, LEER_ENTRADA_SISTEMA, limpiarLecturaBillete, limpiarLecturaEntrada } from '../../server/billete/lectura.js'
import { LEER_ALOJAMIENTO_SISTEMA, limpiarLecturaAlojamiento } from '../../server/billete/lecturaAlojamiento.js'

for (const l of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const m = l.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2]
}
const cliente = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const carpeta = 'scripts/destino/_ejemplos_billete'
const PRECIO = { 'claude-haiku-4-5': [1, 5], 'claude-sonnet-4-6': [3, 15] }

const casos = [
  { nombre: 'tarjeta de embarque (PDF)', archivo: 'tarjeta_avion_ejemplo.pdf', sistema: LEER_BILLETE_SISTEMA, limpiar: limpiarLecturaBillete, intro: 'Año por defecto: 2026. Es un billete de avión.',
    esperado: { modo: 'avion', numero: 'VY 6102', fecha: '2026-12-05', hora_salida: '08:30', hora_llegada: '10:25', asiento: '14C', localizador: 'ABC123', 'origen.codigo': 'BCN', 'destino.codigo': 'FCO', 'origen.terminal': '1', 'destino.terminal': '1', 'origen.puerta': 'B34' } },
  { nombre: 'entrada (PDF)', archivo: 'entrada_coliseo_ejemplo.pdf', sistema: LEER_ENTRADA_SISTEMA, limpiar: limpiarLecturaEntrada, intro: 'Año por defecto: 2026.',
    esperado: { fecha: '2026-12-05', hora: '09:00', personas: 2, localizador: 'ABC123' } },
  { nombre: 'reserva de hotel (PDF)', archivo: 'reserva_hotel_ejemplo.pdf', sistema: LEER_ALOJAMIENTO_SISTEMA, limpiar: limpiarLecturaAlojamiento, intro: 'Año por defecto: 2026.',
    esperado: { nombre: 'Hotel Ejemplo Monti', entrada: '2026-11-26', salida: '2026-11-29', noches: 3, hora_entrada: '15:00', hora_salida: '11:00', localizador: '4821937560' } },
]
const dame = (o, ruta) => ruta.split('.').reduce((a, k) => a?.[k], o)

const resumen = []
for (const c of casos) {
  const data = fs.readFileSync(path.join(carpeta, c.archivo)).toString('base64')
  for (const modelo of ['claude-haiku-4-5', 'claude-sonnet-4-6']) {
    const t0 = Date.now()
    const r = await cliente.messages.create({ model: modelo, max_tokens: 700, system: c.sistema, messages: [{ role: 'user', content: [{ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data } }, { type: 'text', text: c.intro }] }] })
    const texto = r.content.find((b) => b.type === 'text')?.text ?? ''
    let limpio = null
    try { limpio = c.limpiar(JSON.parse(texto.slice(texto.indexOf('{'), texto.lastIndexOf('}') + 1))) } catch { /* sin JSON */ }
    const campos = Object.entries(c.esperado)
    const bien = campos.filter(([k, v]) => limpio && dame(limpio, k) === v)
    const mal = campos.filter(([k, v]) => !limpio || dame(limpio, k) !== v).map(([k, v]) => `${k}: esperado ${JSON.stringify(v)}, leyó ${JSON.stringify(limpio ? dame(limpio, k) : null)}`)
    const [pi, po] = PRECIO[modelo]
    const coste = (r.usage.input_tokens / 1e6) * pi + (r.usage.output_tokens / 1e6) * po
    resumen.push({ caso: c.nombre, modelo, bien: `${bien.length}/${campos.length}`, mal, in: r.usage.input_tokens, out: r.usage.output_tokens, coste: coste.toFixed(5), ms: Date.now() - t0, caja: limpio?.codigo_caja ? 'sí' : 'no' })
  }
}
for (const r of resumen) console.log(`${r.caso.padEnd(28)} ${r.modelo.padEnd(18)} campos ${r.bien}  in=${r.in} out=${r.out}  $${r.coste}  ${r.ms} ms  caja=${r.caja}${r.mal.length ? '\n    FALLOS: ' + r.mal.join(' | ') : ''}`)
