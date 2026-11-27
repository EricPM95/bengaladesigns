// V79 §3: capturas (no es una prueba) en modo iPhone 390x844: el resumen del día con países nuevos (el 4.º y 2 en un día), la pantalla grande del logro «Trotamundos» y «Todos mis logros».
//   APP_URL=http://localhost:5173 node scripts/destino/capturasV79_b.mjs [dia4|dia2|trota|todos]
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'

const CAP = path.resolve('docs/dias/V79_capturas')
fs.mkdirSync(CAP, { recursive: true })
const MODO = process.argv[2] ?? 'dia4'
const a = await abrirApp(process.env.APP_URL ?? 'http://localhost:5173', { ruta: '/?cuentas=off&logros=on&logrosDemo=1&apertura=0&hoy2=on&version=pago', ancho: 390, alto: 844 })
try {
  for (let i = 0; i < 80 && !(await a.evaluar("typeof window.__momentos === 'object'").catch(() => false)); i++) await a.esp(500)
  if (MODO === 'dia4') await a.evaluar("window.__estudioVisor = {}; window.__momentos.resumenDiaPaises([['Italia', 4]]); true")
  if (MODO === 'dia2') await a.evaluar("window.__estudioVisor = {}; window.__momentos.resumenDiaPaises([['Italia', 1], ['Ciudad del Vaticano', 2], ['España', 3]]); true")
  if (MODO === 'trota') await a.evaluar("window.__momentos.lanzar('viajero'); true")
  await a.esp(4500)
  console.log(MODO, (await a.evaluar("(document.querySelector('[role=\"dialog\"]')?.innerText ?? document.body.innerText).split(String.fromCharCode(10)).join(' | ').slice(0, 260)")))
  console.log('medallas:', await a.evaluar("JSON.stringify([...document.querySelectorAll('[data-bandera-redonda]')].map((e) => e.dataset.banderaRedonda))"))
  await a.captura(path.join(CAP, `v79_${MODO}.jpg`))
} finally {
  a.cerrar()
}
