// V58 Roma: puntos 1 (alojamiento), 2 (cabecera de RESERVAS), 3 (billete duplicado), 4 (aviso «Deshacer» que no se va) y 5 («a el»). Solo observa y captura (modo iPhone 390x844). Por la cola:
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/capturasV58_roma.mjs [sufijo=despues]
import fs from 'node:fs'
import path from 'node:path'
import { abrir, ponerReservas, hoy, modo, texto, clicTexto } from './viajero_roma_comun.mjs'

const SUF = process.argv[2] ?? 'despues'
const CAP = path.resolve('docs/dias/V58_capturas')
fs.mkdirSync(CAP, { recursive: true })
const png = (n) => path.join(CAP, `${n}_${SUF}.jpg`)
const log = {}
const c = await abrir()
const { a, ev } = c
const R = "(await import('/src/store/useRouteStore.ts')).useRouteStore"
const AF = "(await import('/src/store/useAddFlowStore.ts')).useAddFlowStore"
const paso = async (n, fn) => {
  try {
    await fn()
  } catch (e) {
    console.log('!!', n, String(e?.message ?? e).slice(0, 200))
  }
}
try {
  await ponerReservas(c) // Hotel Quirinale SIN dirección, como lo guarda quien solo escribe el nombre del hotel
  await paso('1 HOY con hotel sin dirección', async () => {
    await hoy(c, '2026-10-18', 9 * 60)
    log.hoy_aloj = await texto(a, 1800)
    await a.captura(png('1-con-alojamiento'))
    // hasta abajo (la fila «Volver al alojamiento» va debajo de las paradas)
    await a.evaluar("(() => { const e = document.querySelector('[data-alojamiento-hoy]'); e?.scrollIntoView({ block: 'center' }); return !!e })()")
    await a.esp(600)
    log.fila_alojamiento = await a.evaluar("document.querySelector('[data-alojamiento-hoy]')?.innerText ?? null")
    log.fila_tipo = await a.evaluar("document.querySelector('[data-alojamiento-hoy]')?.getAttribute('data-alojamiento-hoy') ?? null")
    await a.captura(png('1-una-funcion'))
  })
  await paso('2 RESERVAS cabecera', async () => {
    await modo(c, 'bookings', 3000)
    log.reservas = await texto(a, 700)
    await a.captura(png('2-texto'))
    log.resumen = await a.evaluar("document.querySelector('[data-blk=resumen]')?.innerText ?? null")
    log.cabecera = await a.evaluar("document.querySelector('[data-titulo-reservas]')?.parentElement?.nextElementSibling?.innerText ?? null")
    await a.evaluar("document.querySelector('[data-blk=resumen]')?.scrollIntoView({ block: 'center' })")
    await a.esp(500)
    await a.captura(png('2-que-cuenta-cada-numero'))
    log.fichas = await a.evaluar("JSON.stringify(Array.from(document.querySelectorAll('[data-ficha]')).map((b) => b.innerText.trim()))")
  })
  await paso('3 billete duplicado (día de llegada 8:30)', async () => {
    await hoy(c, '2026-10-17', 8 * 60 + 30)
    log.d1_0830 = await texto(a, 1500)
    log.billetes = await a.evaluar("document.querySelectorAll('[data-billete]').length")
    log.tarjetas_vuelo = await a.evaluar("Array.from(document.querySelectorAll('[data-hoy-bienvenida-titulo]')).map((e) => e.innerText)")
    await a.captura(png('3'))
  })
  await paso('5 textos «a el»', async () => {
    await hoy(c, '2026-10-18', 9 * 60 + 40)
    log.d2_0940 = await texto(a, 1600)
    await a.captura(png('5-todos-los-textos'))
    await hoy(c, '2026-10-18', 11 * 60)
    log.d2_1100 = await texto(a, 1600)
    await a.captura(png('5-regla'))
  })
  await paso('4 aviso Deshacer', async () => {
    await modo(c, 'today', 1500)
    await a.evaluar(`(async () => { const r = ${R}.getState().route; ${AF}.setState({ toast: { message: 'Tu Coliseo, el domingo 18', previous: r, previousReservations: ${R}.getState().reservations, id: Date.now() } }); return true })()`)
    await a.esp(1200)
    log.toast_a_1s = await a.evaluar("document.querySelector('[data-aviso-sobre-barra]')?.innerText ?? null")
    await a.captura(png('4-1s'))
    await a.esp(8000)
    log.toast_a_9s = await a.evaluar("document.querySelector('[data-aviso-sobre-barra]')?.innerText ?? null")
    await a.captura(png('4'))
  })
  fs.writeFileSync(path.join(CAP, `_log_roma_${SUF}.json`), JSON.stringify(log, null, 1))
  console.log(JSON.stringify(log, null, 1))
} finally {
  a.cerrar()
}
