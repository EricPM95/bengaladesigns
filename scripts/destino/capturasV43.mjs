// V43: las capturas del REPASO que no saca pruebaV43 (comer, pasar a otro día, pendientes, aviso con Deshacer). Un solo Chrome, que se cierra al acabar.
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/capturasV43.mjs
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'

const SALIDA = path.resolve('docs/dias/V43_capturas')
fs.mkdirSync(SALIDA, { recursive: true })
const png = (n) => path.join(SALIDA, `${n}.jpg`)
const R = "(await import('/src/store/useRouteStore.ts')).useRouteStore"
const src = fs.readFileSync('scripts/destino/pruebaV43.mjs', 'utf8')
const ANTES = src.match(/const ANTES = `([\s\S]*?)`/)[1]

const a = await abrirApp('http://localhost:5173', { ruta: '/?cuentas=off&logros=on&logrosDemo=1&apertura=0&hoy2=on&version=completa', antes: ANTES })
const ev = (e) => a.evaluar('(async () => (' + e + '))()')
const clic = (sel) => a.evaluar(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return false; e.click(); return true })()`)
try {
  for (let i = 0; i < 80 && !(await a.evaluar("typeof window.__rutaPrueba === 'function'").catch(() => false)); i++) await a.esp(500)
  await a.evaluar('window.__rutaPrueba().then(() => true)')
  for (let i = 0; i < 240 && !(await ev(`${R}.getState().route ? true : false`).catch(() => false)); i++) await a.esp(1000)
  await a.esp(2500)
  const montar = async (min, mut = '') => {
    await a.evaluar(`(async () => {
      const st = ${R}; const r = JSON.parse(JSON.stringify(st.getState().route))
      r.days.forEach((d) => { d.stops.forEach((s) => { delete s.checkedInAt; delete s.saltada }) })
      ${mut}
      st.setState({ route: r, screen: 'route' })
      try { Object.keys(localStorage).filter((k) => k.startsWith('trazo:hoy:') || k.startsWith('jutrip:avisos-dichos:')).forEach((k) => localStorage.removeItem(k)); localStorage.setItem('trazo:logros:permisos-vistos', '1'); localStorage.setItem('jutrip:avisos-dichos:' + r.id + ':2026-10-17', JSON.stringify(['ya-no-da-tiempo'])) } catch {}
      try { (await import('/src/lib/hoyCambiarPlanAplicar.ts')).useCambiarPlanStore.setState({ rutaId: null, fecha: null, historial: [], aviso: null }) } catch {}
      window.__horaFalsa = ${min}; window.__pos = null; window.__perm = 'denied'
      st.getState().setDevSimulatedTodayIso('2026-10-17'); st.getState().setActiveDayId(null); st.getState().setMode('explore')
      return true })()`)
    await a.esp(700)
    await ev(`${R}.getState().setMode('today')`)
    await a.esp(2600)
    // (el aviso «Hemos preparado tu viaje para estas fechas» se cierra para que no tape la pantalla)
    for (let i = 0; i < 4; i++) {
      const hecho = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Entendido|Vale|Siguiente|Empezar)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
      if (!hecho) break
      await a.esp(700)
    }
  }
  // Quiero comer ahora (13:00) y cenar (20:00)
  await montar(13 * 60)
  await clic('[data-hoy-cambiar-plan]')
  await a.esp(600)
  await clic('[data-cambiar-opcion="comer"]')
  await a.esp(2500)
  await a.captura(png('v43_comer'))
  // Pasar a otro día
  await montar(12 * 60)
  await clic('[data-hoy-cambiar-plan]')
  await a.esp(600)
  await clic('[data-cambiar-opcion="otro_dia"]')
  await a.esp(1200)
  await a.captura(png('v43_pasar_dia'))
  // Lugares pendientes (la 2.ª parada saltada) abiertos
  await montar(12 * 60, "const d = r.days[0]; const v = d.stops.filter((s) => !s.isBreak && !s.isArrival); if (v[1]) v[1].saltada = true; if (v[2]) v[2].saltada = true;")
  await clic('[data-hoy-pendientes-cabecera]')
  await a.esp(700)
  await a.evaluar("(() => { const e = document.querySelector('[data-hoy-pendientes]'); e?.scrollIntoView({ block: 'center' }); return true })()")
  await a.esp(600)
  await a.captura(png('v43_pendientes'))
  // Aviso con Deshacer: añadir un sitio cercano y aplicar
  await montar(15 * 60)
  await clic('[data-hoy-cambiar-plan]')
  await a.esp(600)
  await clic('[data-cambiar-opcion="anadir"]')
  await a.esp(1800)
  await clic('[data-anadir-candidato] [data-anadir-elegir]')
  await a.esp(900)
  await clic('[data-propuesta-aplicar]')
  await a.esp(1200)
  await a.captura(png('v43_aviso_deshacer'))
} finally {
  a.cerrar()
}
console.log('capturas V43 hechas')
process.exit(0)
