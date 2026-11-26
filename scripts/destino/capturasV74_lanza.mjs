// V74 (34): Lanzarote, el ÚLTIMO día en HOY con el vuelo de vuelta puesto y SIN Reorganizar: la hora de salir al aeropuerto sale del motor de coche (se calcula una vez).
// SOLO capturas (iPhone 390x844). La API con DESTINOS_OCULTOS='-'. Por la cola:
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/capturasV74_lanza.mjs [antes|despues]
// «antes» = sin pedir el plan de la vuelta (`window.__sinPlanDeVuelta`, solo en desarrollo): HOY solo dice «Devuelve el coche en la T1». Guarda docs/dias/V74_capturas/lanza_ultimo_dia_<fase>.jpg.
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'

const FASE = process.argv[2] ?? 'despues'
const CAP = path.resolve('docs/dias/V74_capturas')
fs.mkdirSync(CAP, { recursive: true })
const R = "(await import('/src/store/useRouteStore.ts')).useRouteStore"
// (El reloj y la ubicación de prueba: el mismo guion de arranque que usan las pruebas de HOY.)
const ANTES = /const ANTES = `([\s\S]*?)`\n/.exec(fs.readFileSync(new URL('./pruebaTandaHOY1_A.mjs', import.meta.url), 'utf8'))[1]
const a = await abrirApp(process.env.APP_URL ?? 'http://localhost:5173', { ruta: '/?cuentas=off&logros=on&logrosDemo=1&apertura=0&hoy2=on&version=completa', ancho: 390, alto: 844, antes: ANTES })
const ev = (e) => a.evaluar('(async () => (' + e + '))()')
try {
  for (let i = 0; i < 80 && !(await a.evaluar("typeof window.__rutaLanzarote === 'function'").catch(() => false)); i++) await a.esp(500)
  if (FASE === 'antes') await a.evaluar('window.__sinPlanDeVuelta = true')
  const r = await a.evaluar("window.__rutaLanzarote({ zona: 'costa_teguise', coche: 'alquiler', hoy: '2026-11-08' }).then(() => 'ok').catch((e) => 'ERROR ' + String((e && e.message) || e))")
  console.log('crear:', r)
  if (r !== 'ok') throw new Error(r)
  await a.esp(2500)
  for (let i = 0; i < 4; i++) {
    const h = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Entendido|Vale|Cerrar|Siguiente)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
    if (!h) break
    await a.esp(600)
  }
  // El vuelo de vuelta (18:05) puesto SIN Reorganizar: solo la hora, ni planes ni días adaptados.
  await a.evaluar(`(async () => { const st = ${R}; const r = JSON.parse(JSON.stringify(st.getState().route)); r.departureFlightTime = '18:05'; r.departureFechaVista = '2026-11-13'; r.arrivalFlightTime = '08:25'; r.planVuelta = null; st.setState({ route: r }); st.getState().setDevSimulatedTodayIso('2026-11-13'); return true })()`)
  await a.esp(800)
  await a.evaluar(`(async () => { const st = ${R}; window.__horaFalsa = 10 * 60; window.__pos = null; window.__perm = 'denied'; st.getState().setDevSimulatedTodayIso('2026-11-13'); st.getState().setActiveDayId(null); st.getState().setMode('explore'); return true })()`)
  await a.esp(500)
  await ev(`${R}.getState().setMode('today')`)
  await a.esp(6000)
  console.log('planVuelta:', await ev(`JSON.stringify({ salir: ${R}.getState().route.planVuelta?.salir_de_la_zona ?? null, limite: ${R}.getState().route.planVuelta?.limite_t1 ?? null, hora: ${R}.getState().route.planVuelta?.hora ?? null })`))
  console.log('texto:', await a.evaluar("(document.body.innerText ?? '').replace(/\s+/g, ' ').slice(0, 900)"))
  await a.captura(path.join(CAP, `lanza_ultimo_dia_${FASE}.jpg`))
} finally {
  a.cerrar()
}
