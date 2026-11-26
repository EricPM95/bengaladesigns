// V66 (parte B): SOLO capturas (no es una prueba) en modo iPhone (390x844). Un solo Chrome por vez, que se cierra al acabar. Por la cola:
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/capturasV66_b.mjs fuerzas|doc|lluvia|margen|prueba [roma|lanza]
// Guarda docs/dias/catalogo/_tmp/<id>_app.jpg y escribe docs/dias/catalogo/_tmp/log_pregunta_<caso>.json con el texto de cada pantalla.
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'

const CAP = path.resolve('docs/dias/catalogo/_tmp')
fs.mkdirSync(CAP, { recursive: true })
const CASO = process.argv[2] ?? 'fuerzas'
const LUGAR = process.argv[3] ?? 'roma'
const lanza = LUGAR === 'lanza'
const R = "(await import('/src/store/useRouteStore.ts')).useRouteStore"
const ANTES = fs.readFileSync('scripts/destino/pruebaV43.mjs', 'utf8').match(/const ANTES = `([\s\S]*?)`/)[1]
const RUTA = CASO === 'resumen' ? '/?cuentas=off&logros=on&logrosDemo=1&apertura=0&hoy2=on&version=completa' : '/?cuentas=off&logros=off&apertura=0&hoy2=on&version=completa'
const DIA = lanza ? '2026-11-09' : '2026-10-18'

const a = await abrirApp(process.env.APP_URL ?? 'http://localhost:5173', { ruta: RUTA, antes: ANTES, ancho: 390, alto: 844 })
const ev = (e) => a.evaluar('(async () => (' + e + '))()')
const log = {}
const clic = (texto) => a.evaluar(`(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => (x.textContent || '').trim().startsWith(${JSON.stringify(texto)})); if (!b) return false; b.click(); return true })()`)
const texto = (sel) => a.evaluar(`(document.querySelector(${JSON.stringify(sel)}) ?? document.body).innerText.split(String.fromCharCode(10)).join(' ').slice(0, 900)`)
const sacar = async (id, sel = '[role=dialog]') => {
  await a.esp(1200)
  await a.captura(path.join(CAP, `${id}_${lanza ? 'lanza_' : ''}app.jpg`))
  log[id] = await texto(sel)
  console.log('captura', id, '|', String(log[id]).slice(0, 300))
}
try {
  for (let i = 0; i < 80 && !(await a.evaluar(`typeof window.${lanza ? '__rutaLanzarote' : '__rutaPrueba'} === 'function'`).catch(() => false)); i++) await a.esp(500)
  await a.evaluar(lanza ? "window.__rutaLanzarote({ zona: 'costa_teguise', coche: 'alquiler', hoy: '" + DIA + "' }).then(() => true)" : 'window.__rutaPrueba().then(() => true)')
  for (let i = 0; i < 300 && !(await ev(`${R}.getState().route ? true : false`).catch(() => false)); i++) await a.esp(1000)
  await a.esp(2500)
  for (let i = 0; i < 4; i++) {
    const h = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale|Cerrar)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
    if (!h) break
    await a.esp(600)
  }
  const montar = async (min) => {
    await a.evaluar(`(async () => {
      const st = ${R}
      try { sessionStorage.clear() } catch {}
      st.getState().setDevSimulatedTodayIso('${DIA}')
      try { Object.keys(localStorage).filter((k) => k.startsWith('trazo:hoy') || k.startsWith('jutrip:avisos-dichos:')).forEach((k) => localStorage.removeItem(k)); localStorage.setItem('trazo:logros:permisos-vistos', '1'); localStorage.setItem('trazo:ajuste:sugerencias-companero', '1') } catch {}
      // Lo de la mañana, hecho (para que sea «después de comer» de verdad): las paradas con hora antes de las 13:30 llevan su Visto.
      { const r = JSON.parse(JSON.stringify(st.getState().route)); const d = r.days.find((x) => x.dayNumber === ${lanza ? 2 : 2}) ?? r.days[1]; for (const p of d.stops) { const m = /^([0-9]{1,2}):([0-9]{2})$/.exec(p.time || ''); if (m && Number(m[1]) * 60 + Number(m[2]) < 13 * 60 + 30 && !p.isBreak) p.checkedInAt = new Date().toISOString() } st.setState({ route: r }); (await import('/src/lib/avisosUnaVez.ts')).marcarDicho(r.id, '${DIA}', 'ya-no-da-tiempo') }
      window.__horaFalsa = ${min}; window.__pos = null; window.__perm = 'denied'
      st.getState().setActiveDayId(null); st.getState().setMode('explore')
      return true })()`)
    await a.esp(700)
    await ev(`${R}.getState().setMode('today')`)
    await a.esp(3500)
  }
  if (CASO === 'fuerzas') {
    await montar(16 * 60)
    await a.captura(path.join(CAP, `F0_hoy_${LUGAR}_app.jpg`))
    log.F0 = await texto('body')
    console.log('Sin fuerzas', await clic('Sin fuerzas'))
    await sacar('F1_pregunta')
    console.log('Sí', await clic('Sí, acabar el día'))
    await sacar('F2_por_hoy_ya_esta')
    console.log('cerrar', await clic('Dejarlo como está'))
  }
  if (CASO === 'resumen') {
    // El resumen del día: lo que abre `cerrarCierre` (HoyDuranteV2) al cerrar «Por hoy ya está» con una cuenta de verdad; aquí, sin cuenta, se abre con la misma llamada.
    await montar(16 * 60)
    await ev("(await import('/src/components/logros/momentos/useMomentosUI.ts')).useMomentosUI.getState().abrirResumenDia({ iso: '"+DIA+"', manana: false })")
    await a.esp(3500)
    await sacar('F3_resumen', 'body')
  }
  if (CASO === 'doc') {
    // 3.1: una entrada (Roma) o una excursión (Lanzarote) cuyo documento trae OTRO día del viaje. Se llama a la misma función que la tarjeta al leer el documento.
    await ev(`(async () => { const st = ${R}; const r = st.getState().route; const d = r.days[1]; const p = d.stops.find((s) => /Coliseo|Cueva|Jameos|Timanfaya/i.test(s.name)) ?? d.stops.find((s) => !s.isBreak && !s.isArrival); const ini = r.answers.dateRange.start; const x = new Date(ini + 'T12:00:00Z'); x.setUTCDate(x.getUTCDate() + 1); window.__docPrueba = { id: 'res-v66', kind: '${lanza ? 'excursion' : 'entrada'}', refId: p.name, name: p.name, placeNames: [p.name], dateIso: x.toISOString().slice(0, 10), dayNumber: 2, time: '10:00' }; st.setState({ reservations: [window.__docPrueba] }); return true })()`)
    await ev(`${R}.getState().setMode('bookings')`)
    await a.esp(3500)
    log.D0 = await a.evaluar('typeof window.__preguntarDia')
    await ev(`(() => { const r = window.__docPrueba; const x = new Date(r.dateIso + 'T12:00:00Z'); x.setUTCDate(x.getUTCDate() + 2); window.__preguntarDia(r, { fecha: x.toISOString().slice(0, 10), hora: '10:00' }, '${lanza ? 'reserva' : 'entrada'}', null, (e, usar) => { window.__docResultado = { dia: e.dateIso, usar } }); return true })()`)
    await sacar('D1_pregunta')
    if (process.argv[4] === 'pasar') {
      await clic('Pasarla al')
      await a.esp(1500)
      await sacar('D2_pasada', 'body')
      log.D2_resultado = await a.evaluar('JSON.stringify(window.__docResultado)')
    }
  }
  fs.writeFileSync(`docs/dias/catalogo/_tmp/log_pregunta_${CASO}_${LUGAR}.json`, JSON.stringify(log, null, 2))
} finally {
  a.cerrar()
}
process.exit(0)
