// NOCHE (24-25 nov) · agente RESTO: SOLO capturas (no es una prueba) en modo iPhone de RESERVAS (vuelo, alojamiento, entrada, excursión, hojas), de DÍAS (cuadrado de la fecha) y de los dibujos de Design al lado. Por la cola:
//   APP_URL=http://localhost:5173 SUFIJO=antes node scripts/destino/_conCola.mjs node scripts/destino/noche_resto_caps.mjs
// SUFIJO = antes | despues (el nombre de las capturas: «<pantalla>_<sufijo>.jpg»); DISENO=1 hace además las del dibujo.
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'
import { capturarDesign } from './capturaDesign.mjs'

const CAP = path.resolve('docs/dias/NOCHE_RESTO_capturas')
fs.mkdirSync(CAP, { recursive: true })
const SUF = process.env.SUFIJO ?? 'despues'
const png = (n) => path.join(CAP, `${n}.jpg`)
const APP = process.env.APP_URL ?? 'http://localhost:5173'
const R = "(await import('/src/store/useRouteStore.ts')).useRouteStore"
const ANTES = fs.readFileSync('scripts/destino/pruebaV43.mjs', 'utf8').match(/const ANTES = `([\s\S]*?)`/)[1]
const LINEA_VUELO = fs.readFileSync('scripts/destino/pruebaV45.mjs', 'utf8').split(/\r?\n/).find((l) => l.includes("arrivalCodigo: 'VY 6102'")).trim()
const VUELO = JSON.parse(LINEA_VUELO.slice(LINEA_VUELO.indexOf('"'), LINEA_VUELO.lastIndexOf('"') + 1))

if (process.env.DISENO === '1') {
  const D = (pieza, salida, o = {}) => capturarDesign(pieza, png(salida), { ancho: 1300, alto: 1000, ...o }).catch((e) => console.log('dibujo falla', pieza, String(e).slice(0, 120)))
  const S = (n) => ({ despues: `window.scrollTo(0, ${n})` })
  if (process.env.SOLO_ALOJ !== '1') await D('Reservas Billete.dc.html', 'vuelo_dibujo')
  await D('Piezas/Entradas Billete.dc.html', 'aloj_A1_dibujo', S(1750))
  await D('Piezas/Entradas Billete.dc.html', 'aloj_A2_dibujo', S(2650))
  await D('Piezas/Excursion Nueva.dc.html', 'excursion_X5_dibujo', S(1750))
  await D('Alojamiento Mapa.dc.html', 'aloj_mapa_dibujo')
  await D('Entrada Cambio Dias.dc.html', 'cambio_dias_dibujo')
}

const a = await abrirApp(APP, { ruta: '/?cuentas=off&logros=on&logrosDemo=1&apertura=0&hoy2=on&version=pago', antes: ANTES, ancho: 375, alto: 812 })
const ev = (e) => a.evaluar(e)
const T = (e) => a.evaluar('(async () => (' + e + '))()')
try {
  for (let i = 0; i < 80 && !(await ev("typeof window.__rutaPrueba === 'function'").catch(() => false)); i++) await a.esp(500)
  await ev('window.__rutaPrueba().then(() => true)')
  for (let i = 0; i < 240 && !(await T(`${R}.getState().route ? true : false`).catch(() => false)); i++) await a.esp(1000)
  await a.esp(2500)
  for (let i = 0; i < 4; i++) {
    const h = await ev("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale|Cerrar)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
    if (!h) break
    await a.esp(600)
  }
  const RR = (js) => ev(`(async () => { const R = await import('/src/store/useRouteStore.ts'); const B = await import('/src/lib/bookings.ts'); const st = () => R.useRouteStore.getState(); const route = () => st().route; ${js} })()`)

  // DÍAS: el cuadrado de la fecha y el día abierto
  await T(`${R}.getState().setMode('days')`)
  await a.esp(2500)
  await ev("(() => { document.querySelectorAll('[data-day-id]')[1]?.querySelector('[role=button]')?.click(); return true })()")
  await a.esp(1500)
  await ev("(() => { document.querySelectorAll('[data-day-id]')[0]?.scrollIntoView({ block: 'start' }); return true })()")
  await a.esp(600)
  console.log('DÍAS cuadrados', await ev("JSON.stringify(Array.from(document.querySelectorAll('[data-cuadrado-fecha]')).map((e) => e.getAttribute('data-cuadrado-fecha') + ':' + e.textContent))"))
  await a.captura(png(`dias_${SUF}`))

  // RESERVAS
  await ev(VUELO)
  await RR("const r = route(); st().setAccommodationHotel(r.days[0].id, { name: 'Hotel Palatino', precio: { amount: 280, currency: 'EUR' } }); return true")
  await RR(`const r = route(); const d = r.days.filter((x) => !x.isReturnLeg && B.dateOfDay(r, x))[1] ?? r.days[0]; const s = d.stops.find((p) => !p.isFreeTour && !p.isNightExperience && !p.passThrough && !p.isBreak && p.name); st().addReservation({ id: 'res-noche-e', kind: 'entrada', refId: s.name, name: s.name, placeNames: [s.name], dateIso: B.dateOfDay(r, d), dayNumber: null, time: '09:15', precio: { amount: 50, currency: 'EUR' } }, null, null); const d0 = r.days.filter((x) => !x.isReturnLeg && B.dateOfDay(r, x))[0]; st().addReservation({ id: 'res-noche-x', kind: 'excursion', refId: 'excursion-noche', name: 'Excursión de prueba', placeNames: [], dateIso: B.dateOfDay(r, d0), dayNumber: null, time: '08:00', precio: { amount: 60, currency: 'EUR' } }, null, null); return true`)
  await T(`${R}.getState().setMode('bookings')`)
  await a.esp(2000)
  for (const [bloque, nombre] of [['llegada', 'vuelo'], ['aloj', 'alojamiento'], ['entradas', 'entrada'], ['excursiones', 'excursion']]) {
    await T(`${R}.getState().setMode('bookings')`)
    await a.esp(1200)
    await ev(`(() => { const b = document.querySelector('[data-blk="${bloque}"]'); if (b && b.querySelectorAll('[data-tarjeta-crema], [data-mitad]').length === 0) b.querySelector('[data-cabecera-clara], [data-llegada-cabecera]')?.click(); b?.scrollIntoView({ block: 'start' }); return true })()`)
    await a.esp(1200)
    await ev(`(() => { document.querySelector('[data-blk="${bloque}"]')?.scrollIntoView({ block: 'start' }); return true })()`)
    await a.esp(500)
    await a.captura(png(`${nombre}_${SUF}`))
  }
  // la hoja de una entrada
  await ev("(() => { const b = Array.from(document.querySelectorAll('[data-blk=\"entradas\"] button')).find((x) => /^Añádela$/.test((x.textContent || '').trim())); b?.click(); return Boolean(b) })()")
  await a.esp(1400)
  await a.captura(png(`hoja_entrada_${SUF}`))
  await ev("(() => { document.querySelector('[role=\"dialog\"] [aria-label=\"Cerrar\"], [data-cruz-de-hoja]')?.click(); return true })()")
  await a.esp(600)
  // la hoja del alojamiento
  await ev("(() => { const b = document.querySelector('[data-anadir-alojamiento]'); b?.click(); return Boolean(b) })()")
  await a.esp(1400)
  await a.captura(png(`hoja_aloj_${SUF}`))
} finally {
  a.cerrar()
}
