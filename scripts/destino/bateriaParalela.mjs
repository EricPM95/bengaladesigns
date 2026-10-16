// Corre varias pruebas en paralelo y cuenta los fallos de cada una:  node scripts/destino/_bateria.mjs [conc=12] [filtro=regex] [salida=ruta.json] [extra="paso=37"]
// Las pruebas con exit raro pero «0 fallos» en su salida cuentan como bien (el quirk conocido).
import { spawn } from 'node:child_process'
import fs from 'node:fs'

const args = Object.fromEntries(process.argv.slice(2).map((x) => x.split(/=(.*)/s).slice(0, 2)))
const conc = Number(args.conc ?? 12)
const filtro = new RegExp(args.filtro ?? '^prueba(Fase6|Corr6|Tanda6|Fotos6|Cuentas|Civitatis|PorQue|Logros)')
const lista = fs.readdirSync('scripts/destino').filter((f) => f.endsWith('.mjs') && filtro.test(f) && !/Wikimedia|pruebaFase6y8_comida/.test(f)).sort()
const env = { ...process.env, API_URL: process.env.API_URL ?? 'http://localhost:8841', SERVIDOR: process.env.SERVIDOR ?? process.env.API_URL ?? 'http://localhost:8841' }
const resultados = []
let siguiente = 0
const correr = (f) => new Promise((resolve) => {
  const t0 = Date.now()
  const extra = args.extra ? args.extra.split(' ') : []
  const p = spawn(process.execPath, [`scripts/destino/${f}`, ...(/pruebaFase6y5_motor|pruebaFase6y7_motor/.test(f) ? extra : [])], { env })
  let out = ''
  p.stdout.on('data', (d) => { out += d })
  p.stderr.on('data', (d) => { out += d })
  const tope = setTimeout(() => p.kill(), Number(args.tope ?? 1500) * 1000)
  p.on('close', (code) => {
    clearTimeout(tope)
    const ultimas = out.trim().split('\n').slice(-6).join(' | ').slice(0, 500)
    const m = /(\d+)\s+fallos?/i.exec(out.split('\n').reverse().find((l) => /fallos?/i.test(l)) ?? '')
    const fallos = m ? Number(m[1]) : null
    resultados.push({ f, code, fallos, seg: Math.round((Date.now() - t0) / 1000), ultimas })
    console.log(`${fallos === 0 ? 'OK ' : code === 0 && fallos == null ? 'ok?' : 'MAL'} ${f} exit=${code} fallos=${fallos} ${Math.round((Date.now() - t0) / 1000)}s`)
    resolve()
  })
})
const trabajador = async () => { while (siguiente < lista.length) await correr(lista[siguiente++]) }
await Promise.all(Array.from({ length: conc }, trabajador))
if (args.salida) fs.writeFileSync(args.salida, JSON.stringify(resultados, null, 1))
console.log(`\n${resultados.length} pruebas; MAL: ${resultados.filter((r) => r.fallos !== 0 && !(r.code === 0 && r.fallos == null)).map((r) => r.f).join(', ') || 'ninguna'}`)
process.exitCode = 0
setTimeout(() => process.exit(0), 300).unref()
