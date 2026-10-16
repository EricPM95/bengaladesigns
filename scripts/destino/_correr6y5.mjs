// Lanza pruebaFase6y5_motor partida en trozos, todos a la vez, y suma los resultados (Cuentas, parte 2, punto 6).
//   API_URL=http://localhost:8787 node scripts/destino/_correr6y5.mjs [procesos=12] [salida=ruta/carpeta]
// No cambia lo que se comprueba, solo cómo se reparte. Los trozos:
//   · `procesos` tramos de fechas (`parte=p2,p4 tramo=i/n`): una de cada n fechas del año para p2 y p4, que son lo que más pesa.
//   · p1 en un proceso por fecha (las 3 de siempre y «sin fechas»): `parte=p1 inicio1=…`.
//   · p18 y tope juntos.
// El total de comprobaciones tiene que ser el de la prueba entera (143.647) y los fallos, los mismos. Sale con código 1 si algún trozo falla o no da resultado.
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const args = Object.fromEntries(process.argv.slice(2).map((x) => x.split(/=(.*)/s).slice(0, 2)))
const procesos = Number(args.procesos ?? 12)
const salida = args.salida ?? null
if (salida) fs.mkdirSync(salida, { recursive: true })
const FECHAS_P1 = ['2026-10-20', '2027-03-10', '2027-06-15', 'sin']
const trozos = [
  ...Array.from({ length: procesos }, (_, i) => ({ nombre: `fechas ${i}/${procesos}`, args: ['parte=p2,p4', `tramo=${i}/${procesos}`] })),
  ...FECHAS_P1.map((fecha) => ({ nombre: `p1 ${fecha}`, args: ['parte=p1', `inicio1=${fecha}`] })),
  { nombre: 'p18+tope', args: ['parte=p18,tope'] },
]
const t0 = Date.now()
const resultados = []

const lanza = (trozo, indice) =>
  new Promise((resolve) => {
    const inicio = Date.now()
    const hijo = spawn(process.execPath, ['scripts/destino/pruebaFase6y5_motor.mjs', ...trozo.args], { env: process.env, stdio: ['ignore', 'pipe', 'pipe'] })
    let texto = ''
    hijo.stdout.on('data', (d) => (texto += d))
    hijo.stderr.on('data', (d) => (texto += d))
    hijo.on('close', (codigo) => {
      const m = /\{"comprobaciones":(\d+),"fallos":(\d+)\}/.exec(texto)
      const r = { ...trozo, comprobaciones: m ? Number(m[1]) : 0, fallos: m ? Number(m[2]) : -1, segundos: Math.round((Date.now() - inicio) / 1000), codigo, texto }
      if (salida) fs.writeFileSync(path.join(salida, `trozo${String(indice).padStart(2, '0')}.txt`), texto)
      resultados.push(r)
      console.log(`${trozo.nombre}: ${r.comprobaciones} comprobaciones · ${r.fallos < 0 ? 'SIN RESULTADO' : `${r.fallos} fallos`} · ${r.segundos} s`)
      resolve()
    })
  })

await Promise.all(trozos.map(lanza))
const comprobaciones = resultados.reduce((suma, r) => suma + r.comprobaciones, 0)
const fallos = resultados.reduce((suma, r) => suma + Math.max(r.fallos, 0), 0)
const sinResultado = resultados.filter((r) => r.fallos < 0).length
console.log(`\nTotal: ${comprobaciones} comprobaciones · ${fallos} fallos · ${sinResultado} trozos sin resultado · ${Math.round((Date.now() - t0) / 1000)} s en total (${trozos.length} a la vez)`)
for (const r of resultados.filter((x) => x.fallos !== 0)) console.log(`\n--- ${r.nombre} ---\n${r.texto.split('\n').filter((l) => /^\[|FALLO|Error/.test(l)).slice(0, 12).join('\n')}`)
process.exitCode = fallos > 0 || sinResultado > 0 ? 1 : 0
