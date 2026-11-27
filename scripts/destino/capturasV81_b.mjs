// V81 §3: SOLO capturas (390x844) con el teclado del iPhone simulado (ver _tecladoV81.mjs): moneda, país y «+ Añadir una reserva» (ferry).
//   APP_URL=http://localhost:5173 node scripts/destino/capturasV81_b.mjs antes|despues
import fs from 'node:fs'
import path from 'node:path'
import { abrir } from './_tecladoV81.mjs'

const modo = process.argv[2] === 'antes' ? 'antes' : 'despues'
const CAP = path.resolve('docs/dias/V81_capturas')
fs.mkdirSync(CAP, { recursive: true })
const t = await abrir(modo)
try {
  await t.ajustes()
  console.log('moneda', await t.clic('Moneda'))
  await t.a.esp(1500)
  await t.sacarTeclado('[data-hoja-opciones] input')
  await t.teclear('c')
  await t.a.captura(path.join(CAP, `moneda_teclado_${modo}.jpg`))
  console.log(modo, 'moneda', JSON.stringify(await t.medidas()))
  await t.quitarTeclado()
  await t.a.evaluar("(() => { const b = document.querySelector('[data-hoja-cerrar]'); if (b) b.click(); return true })()")
  await t.a.esp(800)
  console.log('pais', await t.a.evaluar("(() => { const b = document.querySelector('[data-pais-vive]') ?? [...document.querySelectorAll('button')].find((x) => /País donde vives/.test(x.textContent || '')); if (!b) return false; b.click(); return true })()"))
  await t.a.esp(1500)
  await t.sacarTeclado('[data-hoja-opciones] input')
  await t.teclear('m')
  await t.a.captura(path.join(CAP, `pais_teclado_${modo}.jpg`))
  console.log(modo, 'pais', JSON.stringify(await t.medidas()))
  await t.quitarTeclado()
  await t.a.evaluar("(() => { const b = document.querySelector('[data-hoja-cerrar]'); if (b) b.click(); return true })()")
  await t.a.esp(500)
  await t.reserva()
  await t.sacarTeclado('[data-extra-campo="compania"]')
  await t.teclear('Car')
  await t.a.captura(path.join(CAP, `reserva_teclado_${modo}.jpg`))
  console.log(modo, 'reserva', JSON.stringify(await t.medidas()))
} finally {
  t.a.cerrar()
}
process.exit(0)
