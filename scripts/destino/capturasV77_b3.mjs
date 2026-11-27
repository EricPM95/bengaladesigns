// V77 (38): SOLO capturas (no es una prueba) en modo iPhone (390x844) de la escala con su dato «Escala de 1 h 15 min en Madrid», entre los dos tramos del vuelo de ida (Roma). Un Chrome, cerrado al acabar.
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/capturasV77_b3.mjs
import fs from 'node:fs'
import { abrir, R } from './_montajeV76_b.mjs'

const CAP = 'docs/dias/V77_capturas'
fs.mkdirSync(CAP, { recursive: true })
const { a, ev, montar, abrirLlegadaYVuelta } = await abrir(false)
try {
  const ESC = { compania: 'Iberia', codigo: 'IB 3921', salida: '08:30', llegada: '09:45', de: 'Barcelona (El Prat)', a: 'Madrid (MAD)' }
  await montar({ modo: 'bookings', ruta: { arrivalOtroPunto: 'Madrid (MAD)', arrivalOtraHora: '11:00', arrivalFlightTime: '13:15', arrivalEscalas: [ESC] } })
  await abrirLlegadaYVuelta()
  await a.esp(1200)
  await ev("(() => { document.querySelector('[data-escala-dato]')?.scrollIntoView({ block: 'center' }); return true })()")
  await a.esp(1200)
  await a.captura(`${CAP}/roma_escala_app.jpg`)
  console.log('dato', await ev("(document.querySelector('[data-escala-dato]')?.innerText ?? 'NO HAY')"))
  void R
} finally {
  a.cerrar()
}
process.exit(0)
