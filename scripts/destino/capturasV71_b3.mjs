// V71 §3: capturas (no es una prueba) en modo iPhone 390x844 de cada logro de viajero en SU pantalla, sin «Y además…». Un Chrome, se cierra al acabar.
//   APP_URL=http://localhost:5173 node scripts/destino/capturasV71_b3.mjs [viajero|dos]
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'

const CAP = path.resolve('docs/dias/V71_capturas')
fs.mkdirSync(CAP, { recursive: true })
const MODO = process.argv[2] ?? 'viajero'
const a = await abrirApp(process.env.APP_URL ?? 'http://localhost:5173', { ruta: '/?cuentas=off&logros=on&logrosDemo=1&apertura=0&hoy2=on&version=pago', ancho: 390, alto: 844 })
try {
  for (let i = 0; i < 80 && !(await a.evaluar("typeof window.__momentos === 'object'").catch(() => false)); i++) await a.esp(500)
  await a.evaluar(MODO === 'dos' ? "window.__momentos.serieViajeros(); true" : "window.__momentos.lanzar('viajero'); true")
  const texto = () => a.evaluar("(document.querySelector('[role=\"dialog\"]')?.innerText ?? document.body.innerText).split(String.fromCharCode(10)).join(' | ').slice(0, 220)")
  for (let n = 1; n <= (MODO === 'dos' ? 3 : 1); n++) {
    await a.esp(4500)
    console.log(`pantalla ${n}:`, await texto())
    await a.captura(path.join(CAP, `app_${MODO}_${n}.jpg`))
    await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Seguir|Siguiente|Continuar)$/.test((x.textContent || '').trim())); b?.click(); return Boolean(b) })()")
  }
} finally {
  a.cerrar()
}
