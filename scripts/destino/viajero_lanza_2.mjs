// Viajero Lanzarote 2: interacciones en HOY (llegar, marcar, saltar, Cambiar plan, llegar tarde) y las pestañas DIAS, RESERVAS, EXPLORAR y Perfil. Solo observa.
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'
const SAL = path.resolve('docs/dias/VIAJEROS_capturas')
const OUT = path.resolve('docs/dias/_viajero_lanza_2.json')
const R = "(await import('/src/store/useRouteStore.ts')).useRouteStore"
const ANTES = /const ANTES = `([\s\S]*?)`\n/.exec(fs.readFileSync(new URL('./pruebaTandaHOY1_A.mjs', import.meta.url), 'utf8'))[1]
const log = []
let a
const ev = (e) => a.evaluar('(async () => (' + e + '))()')
const LIMPIA = "(x) => x.replace(/\\s+/g, ' ').trim()"
async function abrir() {
  a = await abrirApp('http://localhost:5173', { ruta: '/?cuentas=off&logros=on&logrosDemo=1&apertura=0&hoy2=on&version=completa', antes: ANTES })
  for (let i = 0; i < 60 && !(await a.evaluar("typeof window.__rutaLanzarote === 'function'")); i++) await a.esp(500)
  const r = await a.evaluar(`window.__rutaLanzarote({ zona: 'costa_teguise', coche: 'alquiler', hoy: '2026-11-08', vuelos: { llegada: '09:30', vuelta: '18:05' } }).then(() => 'ok').catch((e) => 'ERROR ' + String((e && e.message) || e))`)
  console.log('crear:', r)
  if (r !== 'ok') throw new Error(r)
  await a.esp(2500)
  for (let i = 0; i < 4; i++) {
    const h = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Entendido|Vale|Cerrar|Siguiente)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
    if (!h) break
    await a.esp(600)
  }
}
const POS = { jameos: { lat: 29.1566, lng: -13.4318 }, hotel: { lat: 28.9996, lng: -13.4850 }, aeropuerto: { lat: 28.9455, lng: -13.6052 }, lejos: { lat: 40.4168, lng: -3.7038 } }
async function ir(dia, min, pos = null, modo = 'today', limpiar = true) {
  await a.evaluar(`(async () => {
    const st = ${R}
    ${limpiar ? "try { Object.keys(localStorage).filter((k) => k.startsWith('trazo:hoy')).forEach((k) => localStorage.removeItem(k)) } catch {}" : ''}
    window.__horaFalsa = ${min}; window.__pos = ${JSON.stringify(pos)}; window.__perm = ${pos ? "'granted'" : "'denied'"}
    const r = st.getState().route
    const d = new Date(r.answers.dateRange.start + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + ${dia})
    st.getState().setDevSimulatedTodayIso(d.toISOString().slice(0, 10)); st.getState().setActiveDayId(null); st.getState().setMode('explore')
    return true })()`)
  await a.esp(600)
  await ev(`${R}.getState().setMode('${modo}')`)
  await a.esp(2800)
}
const botones = () => a.evaluar(`Array.from(document.querySelectorAll('button, [role=button], a')).filter((b) => b.offsetParent !== null || getComputedStyle(b).position === 'fixed').map((b) => (b.innerText || b.getAttribute('aria-label') || '').replace(/\\s+/g, ' ').trim()).filter(Boolean).slice(0, 60)`)
const texto = () => a.evaluar("(document.querySelector('[data-hoy]')?.innerText ?? document.body.innerText).replace(/\\s+/g, ' ')")
const textoTodo = () => a.evaluar("document.body.innerText.replace(/\\s+/g, ' ')")
async function snap(nombre, { scroll = 0, sel = '[data-hoy]' } = {}) {
  const f = `lanza_${nombre}.jpg`
  await a.captura(path.join(SAL, f))
  const t = await textoTodo()
  const b = await botones()
  log.push({ nombre, f, t, b })
  console.log(nombre, '|', t.slice(0, 140))
  for (let i = 1; i <= scroll; i++) {
    await a.evaluar(`(() => { const c = document.querySelector(${JSON.stringify(sel)}); if (c) c.scrollTop = ${i * 650}; return true })()`)
    await a.esp(500)
    await a.captura(path.join(SAL, `lanza_${nombre}_s${i}.jpg`))
  }
  if (scroll) await a.evaluar(`(() => { const c = document.querySelector(${JSON.stringify(sel)}); if (c) c.scrollTop = 0; return true })()`)
  fs.writeFileSync(OUT, JSON.stringify(log, null, 1))
}
async function clic(re, flags = 'i') {
  const r = await a.evaluar(`(() => { const re = new RegExp(${JSON.stringify(re)}, ${JSON.stringify(flags)}); const b = Array.from(document.querySelectorAll('button, [role=button], a, [data-hoy-fila]')).find((x) => re.test((x.innerText || x.getAttribute('aria-label') || '').replace(/\\s+/g, ' ').trim()) && (x.offsetParent !== null || getComputedStyle(x).position === 'fixed')); if (!b) return false; b.click(); return true })()`)
  console.log('  clic', re, r)
  await a.esp(1500)
  return r
}
const paso = async (n, fn) => { console.log('##', n); try { await fn() } catch (e) { console.log('ERR', n, String(e.message || e).slice(0, 200)); log.push({ nombre: n, err: String(e.message || e) }) } }

try {
  await abrir()
  // ---------- DIA 3 (martes 10, indice 2): Jameos 10:00, Cueva 11:30, Mirador del Rio 12:44, Haria 15:09, Casa Museo 16:14, Helechos 17:30
  await paso('martes llegar', async () => {
    await ir(2, 9 * 60 + 40)
    await snap('d3_0940_antes', { scroll: 3 })
    await ir(2, 10 * 60 + 5, POS.jameos)
    await snap('d3_1005_en_jameos', { scroll: 2 })
    await clic('Ya he llegado')
    await snap('d3_1005_llegado', { scroll: 2 })
  })
  await paso('martes marcar', async () => {
    await clic('(Ya he terminado|He terminado|Siguiente parada|Hecho|Ya he visitado|Terminar)')
    await snap('d3_1105_tras_marcar', { scroll: 1 })
  })
  await paso('martes cambiar plan', async () => {
    await ir(2, 11 * 60 + 10, POS.jameos)
    await clic('Cambiar plan')
    await snap('d3_1110_cambiar_plan')
    await clic('Saltarme esta parada')
    await snap('d3_1110_saltada', { scroll: 2 })
    await clic('Deshacer')
    await snap('d3_1110_deshecho')
  })
  await paso('martes tarde', async () => {
    await ir(2, 15 * 60 + 30, POS.jameos, 'today')
    await snap('d3_1530_tarde_sin_hacer', { scroll: 2 })
    await clic('Pasar lo que falta|Ver lo que queda')
    await snap('d3_1530_tras_hoja', { scroll: 1 })
  })
  await paso('martes comida', async () => {
    await ir(2, 13 * 60 + 50, POS.jameos)
    await snap('d3_1350_comida', { scroll: 2 })
    await clic('Cambiar')
    await snap('d3_1350_comida_cambiar')
  })
  await paso('martes que hago ahora', async () => {
    await ir(2, 12 * 60, POS.jameos)
    await clic('Qué hago ahora')
    await snap('d3_1200_que_hago_ahora')
  })
  await paso('martes atardecer y noche', async () => {
    await ir(2, 18 * 60 + 30, POS.hotel)
    await snap('d3_1830_atardecer', { scroll: 3 })
    await ir(2, 20 * 60 + 30, POS.hotel)
    await snap('d3_2030_noche', { scroll: 3 })
    await clic('He terminado|Terminar el día|Hasta aquí')
    await snap('d3_2030_terminar')
  })
  // ---------- DIA 2 (lunes 9)
  await paso('lunes', async () => {
    await ir(1, 8 * 60 + 40, POS.hotel)
    await snap('d2_0840_con_ubicacion', { scroll: 3 })
    await ir(1, 9 * 60 + 20, POS.lejos)
    await snap('d2_0920_ubicacion_lejos', { scroll: 1 })
    await ir(1, 12 * 60 + 40, POS.hotel)
    await snap('d2_1240_comida', { scroll: 2 })
    await ir(1, 14 * 60, POS.hotel)
    await snap('d2_1400', { scroll: 2 })
    await ir(1, 18 * 60 + 45, POS.hotel)
    await snap('d2_1845_atardecer', { scroll: 3 })
  })
  // ---------- DIA 4 La Graciosa
  await paso('graciosa', async () => {
    await ir(3, 7 * 60 + 30)
    await snap('d4_0730', { scroll: 3 })
    await ir(3, 13 * 60)
    await snap('d4_1300', { scroll: 2 })
    await ir(3, 19 * 60 + 30, POS.hotel)
    await snap('d4_1930', { scroll: 2 })
  })
  // ---------- DIA 5 Papagayo
  await paso('papagayo', async () => {
    await ir(4, 9 * 60)
    await snap('d5_0900', { scroll: 3 })
    await ir(4, 14 * 60 + 40)
    await snap('d5_1440_comida', { scroll: 2 })
    await ir(4, 17 * 60 + 30)
    await snap('d5_1730', { scroll: 2 })
  })
  // ---------- DIA 6 vuelta (vuelo 18:05)
  await paso('vuelta', async () => {
    await ir(5, 8 * 60)
    await snap('d6_0800', { scroll: 3 })
    await ir(5, 12 * 60, POS.hotel)
    await snap('d6_1200', { scroll: 3 })
    await ir(5, 15 * 60 + 30, POS.aeropuerto)
    await snap('d6_1530_aeropuerto', { scroll: 2 })
    await ir(5, 17 * 60 + 40, POS.aeropuerto)
    await snap('d6_1740', { scroll: 2 })
    await ir(5, 19 * 60, POS.aeropuerto)
    await snap('d6_1900_ya_despego', { scroll: 1 })
  })
  // ---------- Pestanas (dia simulado: martes 10, 11:00)
  for (const [modo, n] of [['days', 'dias'], ['bookings', 'reservas'], ['explore', 'explorar'], ['route', 'ruta']]) {
    await paso('pestana ' + n, async () => {
      await ir(2, 11 * 60, POS.jameos, modo)
      await a.esp(1500)
      const sc = await a.evaluar("(() => { const c = Array.from(document.querySelectorAll('main, [class*=overflow-y]')).sort((x, y) => (y.scrollHeight - y.clientHeight) - (x.scrollHeight - x.clientHeight))[0]; return c ? c.scrollHeight - c.clientHeight : 0 })()")
      await snap('tab_' + n, { scroll: Math.min(3, Math.ceil(sc / 650)), sel: 'main' })
    })
  }
  await paso('perfil', async () => {
    await ir(2, 11 * 60, POS.jameos, 'today')
    await a.evaluar("document.querySelector('[data-boton-perfil]')?.click()")
    await a.esp(2000)
    await snap('perfil', { scroll: 3, sel: '[role=dialog]' })
  })
} finally { try { a?.cerrar() } catch {} }
