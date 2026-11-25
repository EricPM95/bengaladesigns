// Viajero Roma 1: recorre los 4 días de HOY a varias horas y captura + vuelca el texto.
import { abrir, ponerReservas, hoy, texto, png } from './viajero_roma_comun.mjs'
const c = await abrir()
const { a } = c
try {
  console.log('RESERVAS', await ponerReservas(c))
  const FECHAS = [['2026-10-17', 'd1'], ['2026-10-18', 'd2'], ['2026-10-19', 'd3'], ['2026-10-20', 'd4']]
  const HORAS = [[8 * 60 + 30, '0830'], [13 * 60, '1300'], [19 * 60, '1900'], [22 * 60 + 40, '2240']]
  for (const [iso, d] of FECHAS) {
    for (const [min, h] of HORAS) {
      await hoy(c, iso, min)
      console.log(`### ${d} ${h}`, await texto(a, 900))
      await a.captura(png(`hoy_${d}_${h}`))
    }
  }
} finally {
  a.cerrar()
}
console.log('listo')
