// V63 (cosas 1, 2, 3, 6 y 10): SOLO capturas (no es una prueba), iPhone 390x844, un solo Chrome que se cierra al acabar.
//   node scripts/destino/capturasV63_a.mjs [aviso|entrada|album]
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'

const CAP = path.resolve('docs/dias/V63_capturas')
fs.mkdirSync(CAP, { recursive: true })
const SOLO = process.argv[2] ?? 'todo'
const R = "(await import('/src/store/useRouteStore.ts')).useRouteStore"
const ANTES = /const ANTES = `([\s\S]*?)`\n/.exec(fs.readFileSync(new URL('./pruebaTandaHOY1_A.mjs', import.meta.url), 'utf8'))[1]
const a = await abrirApp(process.env.APP_URL ?? 'http://localhost:5173', { ruta: '/?cuentas=off&logros=on&logrosDemo=1&apertura=0&hoy2=on&version=pago', antes: ANTES, ancho: 390, alto: 844 })
const ev = (e) => a.evaluar('(async () => (' + e + '))()')
const clicTexto = (re) => a.evaluar(`(() => { const b = Array.from(document.querySelectorAll('button,a')).find((x) => ${re}.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()`)
try {
  for (let i = 0; i < 80 && !(await a.evaluar("typeof window.__rutaPrueba === 'function'").catch(() => false)); i++) await a.esp(500)
  await a.evaluar('window.__rutaPrueba().then(() => true)')
  for (let i = 0; i < 300 && !(await ev(`${R}.getState().route ? true : false`).catch(() => false)); i++) await a.esp(1000)
  await a.esp(2500)
  await a.evaluar(`(async () => { window.__base = JSON.stringify(${R}.getState().route); return true })()`)
  const montar = async ({ min, dia = 2, setup = '', cerca = null }) => {
    await a.evaluar(`(async () => {
      const st = ${R}; const { numberedStopsOf } = await import('/src/lib/stopKind.ts')
      const r = JSON.parse(window.__base)
      r.days.forEach((d) => { numberedStopsOf(d).forEach((s) => { delete s.checkedInAt; delete s.saltada }) })
      ${setup}
      st.setState({ route: r, reservations: window.__resv ?? [], screen: 'route' })
      try { Object.keys(localStorage).filter((k) => k.startsWith('trazo:hoy') || k.startsWith('jutrip:avisos-dichos:')).forEach((k) => localStorage.removeItem(k)); localStorage.setItem('trazo:logros:permisos-vistos', '1') } catch {}
      window.__horaFalsa = ${min}; window.__pos = null; window.__perm = 'denied'; window.__hoy1Cerca = ${JSON.stringify(cerca)}
      const d = new Date(r.answers.dateRange.start + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + ${dia - 1})
      st.getState().setDevSimulatedTodayIso(d.toISOString().slice(0, 10)); st.getState().setActiveDayId(null); st.getState().setMode('explore')
      return true })()`)
    await a.esp(700)
    await ev(`${R}.getState().setMode('today')`)
    await a.esp(3500)
    for (let i = 0; i < 5; i++) {
      const h = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Continuar|Entendido|Vale)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
      if (!h) break
      await a.esp(700)
    }
    await a.esp(400)
  }
  if (SOLO === 'todo' || SOLO === 'aviso') {
    await montar({ min: 7 * 60 + 15 })
    await clicTexto(/^Ya he llegado/)
    await a.esp(1500)
    console.log('saltar', await a.evaluar("(() => { const b = document.querySelector('[data-hoy-saltar-parada]'); if (!b) return false; b.click(); return true })()"))
    await a.esp(4000)
    await a.captura(path.join(CAP, '2_despues.jpg'))
    console.log('aviso', await a.evaluar("(() => { const e = document.querySelector('[data-aviso-sobre-barra]'); const n = document.querySelector('nav[aria-label=\"Barra del viaje\"]'); return JSON.stringify({ aviso: e && e.getBoundingClientRect().toJSON(), nav: n && n.getBoundingClientRect().toJSON(), linea: Boolean(document.querySelector('[data-aviso-linea]')) }) })()"))
    // 3_despues = la misma captura con la línea a mitad; 3_antes = sin la línea.
    await a.captura(path.join(CAP, '3_despues.jpg'))
    await a.evaluar("(() => { const l = document.querySelector('[data-aviso-linea]'); if (l) l.style.display = 'none'; return true })()")
    await a.captura(path.join(CAP, '3_antes.jpg'))
    // 1: con el aviso a la vista se abre una hoja (Cambiar plan).
    console.log('cambiar plan', await clicTexto(/^Cambiar plan/))
    await a.esp(900)
    await a.captura(path.join(CAP, '1_despues.jpg'))
    console.log('hoja', await a.evaluar("(() => { const h = document.querySelector('[role=dialog][aria-modal=true]'); return h ? JSON.stringify(h.getBoundingClientRect().toJSON()) : 'sin hoja' })()"))
    // 1_antes: la regla nueva apagada (así salía: la hoja hasta abajo, tapada por el aviso).
    await a.evaluar("(() => { document.documentElement.removeAttribute('data-aviso-abajo'); return true })()")
    await a.esp(300)
    await a.captura(path.join(CAP, '1_antes.jpg'))
    await a.esp(9000)
    console.log('tras 12 s, atributo:', await a.evaluar("document.documentElement.getAttribute('data-aviso-abajo')"))
  }
  if (SOLO === 'todo' || SOLO === 'entrada') {
    const setupE = `
      const dia = r.days[1]; const p = numberedStopsOf(dia).find((s) => !s.isArrival)
      p.time = '07:00'; p.reservedId = 'res-v63'; p.durationMinutes = 30
      const ini = r.answers.dateRange.start; const dd = new Date(ini + 'T12:00:00Z'); dd.setUTCDate(dd.getUTCDate() + 1)
      window.__resv = [{ id: 'res-v63', kind: 'entrada', refId: p.name, name: p.name, placeNames: [p.name], dateIso: dd.toISOString().slice(0, 10), dayNumber: null, time: '07:00', precio: { amount: 20, currency: 'EUR' } }]`
    await montar({ min: 7 * 60 + 10, setup: setupE })
    await clicTexto(/^[+][0-9]+$/)
    await a.esp(800)
    await a.captura(path.join(CAP, '6_antes.jpg'))
    console.log('7:10', await a.evaluar("Boolean(document.querySelector('[data-hoy-entrada-aviso]'))"))
    await a.evaluar('window.__horaFalsa = 7 * 60 + 45; true')
    await a.esp(65000)
    await clicTexto(/^[+][0-9]+$/)
    await a.esp(800)
    await clicTexto(/^Dejarlo como está/)
    await a.esp(800)
    console.log('7:45', await a.evaluar("Boolean(document.querySelector('[data-hoy-entrada-aviso]'))"))
    await a.captura(path.join(CAP, '6_despues.jpg'))
  }
  if (SOLO === 'todo' || SOLO === 'album') {
    const cerca = { ok: true, cerca: [], juego: null, juego_sitio: null, fuera_de_ruta: null, junto_a: null, reto: null, retos: [{ coleccion: 'imprescindibles', nombre: 'Los imprescindibles', faltan: 5, total: 5, completable_hoy: false, faltan_fuera: [], sitios: ['Coliseo', 'Foro Romano y Palatino', 'Fontana de Trevi', 'Panteón', 'Piazza Navona'].map((n, i) => ({ sitio: 's' + i, nombre: n, ganado: false, hoy: i < 2, estado: i < 2 ? 'hoy' : 'otro_dia', fecha: null, dia_fecha: null, cerca_de_hoy: true })) }] }
    await montar({ min: 11 * 60, cerca })
    console.log('reto', await a.evaluar("Boolean(document.querySelector('[data-reto-del-dia]'))"))
    await a.evaluar("(() => { const e = document.querySelector('[data-reto-del-dia]'); e && e.scrollIntoView({ block: 'center' }); e && e.click(); return true })()")
    await a.esp(1500)
    console.log('album', await a.evaluar("Boolean(document.querySelector('[data-album-de-coleccion]'))"))
    await a.captura(path.join(CAP, '10_despues.jpg'))
    await a.evaluar("(() => { const s = [...document.querySelectorAll('[data-album-de-coleccion] span')].find((x) => /^\\d+ DE \\d+$/.test((x.textContent || '').trim())); if (s) s.style.color = 'oklch(0.48 0.17 5)'; return Boolean(s) })()")
    await a.captura(path.join(CAP, '10_antes.jpg'))
  }
} finally {
  a.cerrar()
}
