// Capturas de la app (móvil 390) para el REPASO_V2b: A1 (Plaza de San Pedro con sus pedazos), H1, A8, H2 (aviso de arriba bueno), H3 (reto + lista), H6 y el final del día.
//   APP_URL=http://localhost:5199 node scripts/destino/_conCola.mjs node scripts/destino/_v2b_repaso_capturas.mjs
import fs from 'node:fs'
import { abrirApp } from './_enLaApp.mjs'
import { cargarDatos, cargarCatalogo } from '../../server/logros/datos.js'
import { retosDelDia, elegirRetos } from '../../server/logros/cerca.js'
import { sitioDeParada } from '../../server/logros/servicio.js'

const SAL = 'docs/dias/V2b_capturas'
fs.mkdirSync(SAL, { recursive: true })
const datos = cargarDatos()
const catalogos = Object.fromEntries(Object.keys(datos.destinos).map((c) => [c, cargarCatalogo(c)]))
const HOY = '2026-10-17'

// Un reloj de mentira: «hoy» a la hora que se pida (para ver un aviso de horario de verdad).
const relojA = (h, m) => `(() => { const R = Date; const t = new R(); t.setHours(${h}, ${m}, 0, 0); const off = t.getTime() - R.now(); class D extends R { constructor(...a) { if (a.length === 0) super(R.now() + off); else super(...a) } static now() { return R.now() + off } } window.Date = D })()`

const nueva = async (alto = 844, antes = '') => {
  const app = await abrirApp(process.env.APP_URL || 'http://localhost:5199', { ruta: '/?cuentas=on&logros=on&logrosDemo=1&apertura=0&version=completa&hoy2=on', ancho: 390, alto, antes })
  for (let i = 0; i < 360 && !(await app.evaluar("typeof window.__rutaPrueba === 'function'").catch(() => false)); i++) await app.esp(500)
  await app.evaluar('Promise.resolve(window.__rutaPrueba()).then(() => true)')
  await app.esp(3000)
  await app.evaluar(`(async () => { const R = await import('/src/store/useRouteStore.ts'); R.useRouteStore.setState({ dev_simulated_today_iso: '${HOY}' }); R.useRouteStore.getState().setMode('today'); return true })()`)
  await app.esp(2500)
  for (let i = 0; i < 6; i++) { const c = await app.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale|Ahora no)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()"); if (!c) break; await app.esp(700) }
  await app.hasta("Boolean(document.querySelector('[data-hoy-siguiente]'))", { segundos: 40 })
  return app
}
const sinPermisos = (app) => app.evaluar("(() => { document.querySelector('[data-visto=\"permisos\"]')?.remove(); return true })()")
const nombresDeHoy = (app) => app.evaluar(`(async () => { const R = await import('/src/store/useRouteStore.ts'); const T = await import('/src/lib/todayMode.ts'); const { numberedStopsOf } = await import('/src/lib/stopKind.ts'); const h = T.getTodayTripContext(R.useRouteStore.getState().route, '${HOY}'); return numberedStopsOf(h.day).map((s) => s.name) })()`)
const retosDe = (nombres) => elegirRetos(retosDelDia({ datos, catalogos, destino: 'roma', items: new Map(), sitiosHoy: new Set(nombres.map((n) => sitioDeParada({ name: n }, catalogos.roma)).filter(Boolean)) }))
const ponerCerca = (app, retos) => app.evaluar(`window.__hoy1Cerca = ${JSON.stringify({ ok: true, cerca: [], juego: null, juego_sitio: null, fuera_de_ruta: null, junto_a: null, reto: null, retos })}; window.dispatchEvent(new Event('trazo:hoy1-repreguntar')); true`)
const alFinal = (app) => app.evaluar("(() => { const e = document.querySelector('[data-hoy]'); if (e) e.scrollTop = e.scrollHeight; return true })()")
const llego = (app) => app.evaluar("(() => { const e = document.querySelector('[data-hoy]'); if (e) e.scrollTop = 0; document.querySelector('[data-hoy-ya-he-llegado]')?.click(); return true })()")

// A1 y H1: la Plaza de San Pedro, con sus 2 pedazos (alto 2000 para H1 entero).
for (const [alto, salida] of [[844, 'app_A1.jpg'], [2000, 'app_H1.jpg']]) {
  const app = await nueva(alto)
  try {
    const nombres = await nombresDeHoy(app)
    const idPlaza = sitioDeParada({ name: 'Plaza de San Pedro' }, catalogos.roma)
    const col = datos.destinos.roma.colecciones.filter((c) => c.sitios.includes(idPlaza)).map((c) => c.nombre)
    await app.evaluar(`(async () => { const R = await import('/src/store/useRouteStore.ts'); const T = await import('/src/lib/todayMode.ts'); const { numberedStopsOf } = await import('/src/lib/stopKind.ts'); const st = R.useRouteStore.getState(); const h = T.getTodayTripContext(st.route, '${HOY}'); for (const s of numberedStopsOf(h.day)) { if (s.name === 'Plaza de San Pedro') break; st.setStopVisto(h.day.id, s.id, true) } window.__pedazosDemo = { 'Plaza de San Pedro': ${JSON.stringify(col)} }; return true })()`)
    await ponerCerca(app, retosDe(nombres))
    await app.esp(2500)
    await llego(app)
    await app.esp(2500)
    await sinPermisos(app)
    await app.captura(`${SAL}/${salida}`)
  } finally { await app.cerrar() }
}

// H2: el aviso de arriba, el bueno (a las 17:52, el siguiente sitio abre hasta las 20:00 con última entrada a las 18:00).
{
  const HORA_H2 = (process.env.HORA_H2 || '17:52').split(':').map(Number)
  const app = await nueva(844, relojA(HORA_H2[0], HORA_H2[1]))
  try {
    await app.esp(2500)
    await sinPermisos(app)
    await app.captura(`${SAL}/app_H2.jpg`)
    console.log('aviso H2:', await app.evaluar("Array.from(document.querySelectorAll('[data-hoy-horario-vivo-texto]')).map((e) => e.innerText).join(' | ') || '(sin aviso a las 17:40)'"))
  } finally { await app.cerrar() }
}

// A8, H6 y el final del día: se salta la primera, se acaba el día.
{
  const app = await nueva(844)
  try {
    await llego(app)
    await app.esp(1800)
    await app.evaluar("document.querySelector('[data-hoy-saltar-parada]')?.click()")
    await app.esp(7500)
    await alFinal(app)
    await app.esp(900)
    await sinPermisos(app)
    await app.captura(`${SAL}/app_H6.jpg`)
    await app.evaluar("document.querySelector('[data-hoy-pendientes-cabecera]')?.click()")
    await app.esp(900)
    await alFinal(app)
    await app.esp(700)
    await app.captura(`${SAL}/app_A8.jpg`)
    // El día se acaba: todo hecho.
    await app.evaluar(`(async () => { const R = await import('/src/store/useRouteStore.ts'); const T = await import('/src/lib/todayMode.ts'); const { numberedStopsOf } = await import('/src/lib/stopKind.ts'); const st = R.useRouteStore.getState(); const h = T.getTodayTripContext(st.route, '${HOY}'); const ps = numberedStopsOf(h.day); ps.forEach((s, i) => { if (!s.saltada && i < ps.length) st.setStopVisto(h.day.id, s.id, true) }); return true })()`)
    await app.esp(2500)
    await app.evaluar("(() => { const e = document.querySelector('[data-hoy]'); if (e) e.scrollTop = 0; return true })()")
    await app.esp(700)
    await sinPermisos(app)
    await app.captura(`${SAL}/app_fin_del_dia.jpg`)
  } finally { await app.cerrar() }
}

// H3: el reto del día (con los datos reales de ese día de Roma) y la lista de «Y N colecciones más».
{
  const app = await nueva(844)
  try {
    const nombres = await nombresDeHoy(app)
    await ponerCerca(app, retosDe(nombres))
    await app.esp(3500)
    await app.evaluar("(() => { const e = document.querySelector('[data-hoy-retos]'); e?.scrollIntoView({ block: 'center' }); return true })()")
    await app.esp(1000)
    await sinPermisos(app)
    await app.captura(`${SAL}/app_H3.jpg`)
    await app.evaluar("(() => { const e = Array.from(document.querySelectorAll('[data-hoy-reto-mas]')).pop(); e?.click(); return true })()")
    await app.esp(1500)
    await app.captura(`${SAL}/app_H3_lista.jpg`)
  } finally { await app.cerrar() }
}
console.log('listo')
