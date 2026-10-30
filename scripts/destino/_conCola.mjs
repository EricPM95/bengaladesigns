// Cola para que, aunque haya varios agentes a la vez, SOLO corra una prueba con navegador (un Chrome) al mismo tiempo, y a prioridad baja (Eric, 28-oct: CPU y memoria estables).
//   node scripts/destino/_conCola.mjs node scripts/destino/pruebaTanda10N8_xxx.mjs
// Coge el candado (una carpeta en %TEMP%), corre el comando con prioridad BelowNormal (los hijos, incluido Chrome, la heredan), y suelta el candado al acabar.
// Si el candado lleva más de 25 minutos sin soltarse (alguien murió), lo rompe. Espera como mucho 40 minutos.
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const candado = path.join(os.tmpdir(), 'trazo_chrome_prueba.lock')
const esperar = (ms) => new Promise((r) => setTimeout(r, ms))
const comando = process.argv.slice(2)
if (comando.length === 0) {
  console.error('Uso: node scripts/destino/_conCola.mjs <comando...>')
  process.exit(2)
}

async function cogerCandado() {
  const limite = Date.now() + 40 * 60 * 1000
  while (Date.now() < limite) {
    try {
      fs.mkdirSync(candado)
      fs.writeFileSync(path.join(candado, 'quien'), `${process.pid} ${new Date().toISOString()} ${comando.join(' ').slice(0, 120)}`)
      return true
    } catch {
      try {
        if (Date.now() - fs.statSync(candado).mtimeMs > 25 * 60 * 1000) fs.rmSync(candado, { recursive: true, force: true })
      } catch {
        /* otro lo ha soltado */
      }
      await esperar(3000)
    }
  }
  return false
}

const soltar = () => {
  try {
    fs.rmSync(candado, { recursive: true, force: true })
  } catch {
    /* ya suelto */
  }
}

if (!(await cogerCandado())) {
  console.error('No he podido coger la cola de Chrome en 40 minutos.')
  process.exit(3)
}
const hijo = spawn(comando[0], comando.slice(1), { stdio: 'inherit', env: { ...process.env, TRAZO_EN_COLA: '1' } })
try {
  os.setPriority(hijo.pid, os.constants.priority.PRIORITY_BELOW_NORMAL)
} catch {
  /* sin permiso: sigue a prioridad normal */
}
const parar = () => {
  try {
    hijo.kill()
  } catch {
    /* ya parado */
  }
  soltar()
}
process.on('SIGINT', () => {
  parar()
  process.exit(130)
})
process.on('exit', soltar)
hijo.on('exit', (codigo) => {
  soltar()
  process.exit(codigo ?? 1)
})
