// Casos APARTADOS «PENDIENTE DEL MOTOR» (Eric, 30-oct, tanda 10S). Un caso concreto, no una prueba entera, que hoy no encaja con lo que el motor hace a propósito (o que el motor
// aún no resuelve) y que se mirará en la próxima tanda del motor. NO cuenta como fallo, pero cada pasada lo IMPRIME en amarillo (ANSI \x1b[33m, nunca en verde) con su motivo,
// y la última línea de la salida es siempre:
//     pendientes_motor: N
// (la recoge el runner de la batería). Lista y evidencia: docs/dias/PENDIENTES_MOTOR.md.
// Uso:  import { pendienteDelMotor } from './_pendientesMotor.mjs';  pendienteDelMotor('catacumbas_mes_sin_fechas', 'etiqueta del caso', 'motivo corto')
// Con importar este archivo basta: al acabar el proceso (process.exit o final normal) imprime el resumen, sin tocar el final de cada prueba.
import fs from 'node:fs'

const AMARILLO = '\x1b[33m'
const RESET = '\x1b[0m'
const casos = []
let impreso = false

export function pendienteDelMotor(clave, caso, motivo) {
  casos.push({ clave, caso, motivo })
}

export const totalPendientesDelMotor = () => casos.length

function imprimirResumen() {
  if (impreso) return
  impreso = true
  const lineas = []
  const porClave = new Map()
  for (const c of casos) porClave.set(c.clave, [...(porClave.get(c.clave) ?? []), c])
  for (const [clave, lista] of porClave) {
    lineas.push(`${AMARILLO}PENDIENTE DEL MOTOR [${clave}] ${lista.length} caso${lista.length === 1 ? '' : 's'}: ${lista[0].motivo}${RESET}`)
    for (const c of lista.slice(0, 8)) lineas.push(`${AMARILLO}   · ${c.caso}${RESET}`)
    if (lista.length > 8) lineas.push(`${AMARILLO}   · … y ${lista.length - 8} más${RESET}`)
  }
  lineas.push(`pendientes_motor: ${casos.length}`)
  try {
    fs.writeSync(1, `\n${lineas.join('\n')}\n`)
  } catch {
    /* salida cerrada */
  }
}
process.on('exit', imprimirResumen)
