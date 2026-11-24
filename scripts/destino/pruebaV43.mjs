// V43 (24-nov-2026): HOY, «Cambiar plan» y los avisos. Hace falta el Vite estable (5173) y la API (8787) YA encendidos; NO arranca ninguno.
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/pruebaV43.mjs
// Un solo Chrome, que se cierra al acabar. Salida: «N comprobaciones · M fallos». Capturas 390x844 en docs/dias/V43_capturas/.
//  0. Lo escrito (sin navegador): ningún botón con `#9A7228`, ningún «Propuesta»/«Cambia:»/[Aplicar]/«Volver a mi ruta original» en los textos de HOY.
//  1. El motor, sin pantalla: a las 21:19 con una entrada de las 10:00 ya pasada no se protege la entrada y sale «Hoy ya no da tiempo a todo»; «pasarlo al mejor día» antes que quitar;
//     «añadir un sitio» nunca ofrece uno que ya está ese día y a las 23:30 solo sale lo abierto o al aire libre (o nada); un aviso, una vez por sitio y día.
//  2. En pantalla (viaje de pruebas de Roma, hora simulada): las hojas con el formato nuevo, «Hoy ya no da tiempo a todo» una vez, el aviso de «ya ha cerrado» una vez tras HOY → DÍAS → HOY → RUTA → HOY,
//     ningún botón dorado con borde.
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'

let comprobaciones = 0
const fallos = []
const debe = (c, regla, texto) => {
  comprobaciones++
  if (!c) fallos.push({ regla, texto })
}
const SALIDA = path.resolve('docs/dias/V43_capturas')
fs.mkdirSync(SALIDA, { recursive: true })
const png = (n) => path.join(SALIDA, `${n}.jpg`)
const R = "(await import('/src/store/useRouteStore.ts')).useRouteStore"

/* ───────────── 0. Lo escrito ───────────── */
function ficheros(dir, ext, salida = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) ficheros(p, ext, salida)
    else if (ext.some((x) => p.endsWith(x))) salida.push(p)
  }
  return salida
}
{
  const todos = ficheros('src', ['.ts', '.tsx'])
  const con9A = todos.filter((f) => !f.endsWith('botonesOro.ts') && fs.readFileSync(f, 'utf8').split(/\r?\n/).some((l) => !/^\s*(\/\/|\*|\/\*)/.test(l) && /#9A7228/i.test(l)))
  debe(con9A.length === 0, 'boton_dorado', `un solo botón dorado: ningún #9A7228 en el código (salen en: ${con9A.join(', ')})`)
  const botones = fs.readFileSync('src/components/ui/botonesOro.ts', 'utf8')
  debe(/135deg/.test(botones) && !/#9A7228/i.test(botones.replace(/\/\*[\s\S]*?\*\//g, '')), 'boton_dorado', 'el dorado se escribe una vez, a 135° y sin borde, en botonesOro.ts')
  const duplicados = todos.filter((f) => !f.endsWith('botonesOro.ts') && /src[\\/]components[\\/]route[\\/]hoy/.test(f) && /linear-gradient\(\s*(135|180)deg,\s*#(F3E2B0|F8EBC4)/i.test(fs.readFileSync(f, 'utf8')))
  debe(duplicados.length === 0, 'boton_dorado', `los botones de HOY no escriben su propio dorado (${duplicados.join(', ')})`)
  const hoy = todos.filter((f) => /src[\\/]components[\\/]route[\\/](hoy|today)/.test(f))
  const prohibidas = []
  for (const f of hoy) {
    for (const l of fs.readFileSync(f, 'utf8').split(/\r?\n/)) {
      if (/^\s*(\/\/|\*|\/\*)/.test(l)) continue
      if (/['"`>]\s*(Propuesta|Cambia:|Aplicar|Volver a mi ruta original)\s*[<'"`]/.test(l) || /Volver a mi ruta original/.test(l.replace(/\/\*.*?\*\//g, '').replace(/\/\/.*$/, ''))) prohibidas.push(`${path.basename(f)}: ${l.trim().slice(0, 80)}`)
    }
  }
  debe(prohibidas.length === 0, 'hojas', `ningún «Propuesta», «Cambia:», [Aplicar] ni «Volver a mi ruta original» en HOY (${prohibidas.join(' | ')})`)
  const claude = fs.readFileSync('CLAUDE.md', 'utf8')
  debe(/V43/.test(claude) && /botonesOro/.test(claude) && /avisosUnaVez/.test(claude), 'reglas', 'CLAUDE.md lleva las reglas de la V43 (hojas, avisos, botón dorado)')
}

/* ───────────── el navegador ───────────── */
const ANTES = `(function(){const RD=Date;const base=RD.now();function fijo(){if(window.__horaFalsa==null)return null;const d=new RD();d.setHours(Math.floor(window.__horaFalsa/60),window.__horaFalsa%60,0,0);return d.getTime()+(RD.now()-base)%60000}class FD extends RD{constructor(...a){if(a.length===0){const f=fijo();super(f==null?RD.now():f)}else super(...a)}static now(){const f=fijo();return f==null?RD.now():f}}window.Date=FD;
Object.defineProperty(navigator,'geolocation',{value:{getCurrentPosition(ok,no){const p=window.__pos;if(!p){no&&no({code:1});return}ok({coords:{latitude:p.lat,longitude:p.lng,accuracy:10}})},watchPosition(){return 1},clearWatch(){}},configurable:true});
try{navigator.permissions.query=async()=>({state:window.__perm||'denied',addEventListener(){},removeEventListener(){}})}catch(e){}})();`

let nSec = 0
const sec = async (fn) => {
  nSec++
  try {
    await fn()
  } catch (e) {
    debe(false, 'error', `la prueba se ha parado en la parte ${nSec}: ${String(e?.message ?? e).slice(0, 400)}`)
  }
}

const a = await abrirApp('http://localhost:5173', { ruta: '/?cuentas=off&logros=on&logrosDemo=1&apertura=0&hoy2=on&version=completa', antes: ANTES })
const ev = (expr) => a.evaluar('(async () => (' + expr + '))()')
const esp = (ms) => a.esp(ms)
const txt = (sel) => a.evaluar(`document.querySelector(${JSON.stringify(sel)})?.innerText.replace(/\\s+/g, ' ').trim() ?? null`)
const hay = (sel) => a.evaluar(`Boolean(document.querySelector(${JSON.stringify(sel)}))`)
const clic = (sel) => a.evaluar(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return false; e.click(); return true })()`)
const hoja = () => a.evaluar("(() => { const d = document.querySelectorAll('[role=\"dialog\"]'); return d.length ? d[d.length - 1].innerText.replace(/\\s+/g, ' ').trim() : null })()")

try {
  /* ───────────── 1. El motor, sin pantalla ───────────── */
  await sec(async () => {
    const r = await a.evaluar(`(async () => {
      const m = await import('/src/lib/hoyCambiarPlan.ts')
      const u = await import('/src/lib/avisosUnaVez.ts')
      const out = {}
      // mismo sitio
      out.mismo = [m.mismoSitio('Piazza Navona', 'Navona'), m.mismoSitio('Plaza Navona', 'Piazza Navona (mercadillo)'), m.mismoSitio('Panteón', 'Fontana de Trevi'), m.mismoSitio('Coliseo', 'Foro Romano')]
      // estado ahora
      const parque = { hours_data: { schedule: '08:00-19:00' } }
      out.parque2330 = m.estadoAhora(parque, 23 * 60 + 30, null, null)
      out.parque1500 = m.estadoAhora(parque, 15 * 60, null, null)
      out.parque1830 = m.estadoAhora(parque, 18 * 60 + 30, null, null)
      out.fuente2330 = m.estadoAhora({ hours_data: { abierto_24h: true } }, 23 * 60 + 30, null, null)
      out.sinHorario2330 = m.estadoAhora({ hours_data: {} }, 23 * 60 + 30, null, null)
      out.nocturna2330 = m.estadoAhora({ hours_data: {}, night_experience: true }, 23 * 60 + 30, null, null)
      // un viaje de mentira: dos días en Roma
      const p = (id, time, dur, extra = {}, i = 0) => ({ id, time, name: id, durationMinutes: dur, coordinates: { lat: 41.90 + i * 0.001, lng: 12.47 }, description: '', photoUrl: '', ...extra })
      const datos = { importanciaPorSitio: { Coliseo: 'imprescindible' }, nivelPorSitio: { Panteon: 3, Trevi: 3, Foro: 2 } }
      const dia = (id, n, stops) => ({ id, dayNumber: n, city: 'Roma', title: '', stops, meals: [{ id: id + 'c', mealTime: 'dinner', time: '20:30' }], mealAfter: {} })
      const D1 = dia('d1', 1, [p('Coliseo', '10:00', 90, { reservationTime: '10:00' }, 0), p('Panteon', '12:00', 45, {}, 1), p('Trevi', '13:00', 30, {}, 2), p('Piazza Navona', '17:00', 40, {}, 3)])
      const D2 = dia('d2', 2, [p('Foro', '09:00', 90, {}, 5), p('Castillo', '11:30', 60, {}, 6)])
      const route = { days: [D1, D2], answers: { dateRange: { start: '2026-10-17', end: '2026-10-18' } } }
      const ctx = { fijasDe: (d) => new Set(d.stops.filter((s) => s.reservationTime).map((s) => s.id)), datos, enCoche: false, etiquetaDia: (d) => (d.dayNumber === 1 ? 'sábado' : 'domingo'), fechaDe: (d) => (d.dayNumber === 1 ? '2026-10-17' : '2026-10-18'), horarioEn: () => null }
      // 21:19, entrada de las 10:00 ya pasada
      const props = m.proponerRetraso({ route, day: D1, paradaId: 'Coliseo', minutos: 60, ctx, ahoraMin: 21 * 60 + 19 })
      out.retraso = props.map((x) => ({ boton: x.boton, mantiene: x.mantiene.titulo, pasadas: x.entradasPasadas, quitadas: x.quitadas.map((q) => q.nombre + ':' + q.destino + ':' + (q.aDia ?? '')), otra: x.etiquetaOtra ?? null, resumen: (x.resumen ?? []).map((l) => l.texto) }))
      out.yaNo = m.yaNoDaTiempo({ day: D1, ahoraMin: 21 * 60 + 19, ctx, vistas: 0 })
      out.yaNoTemprano = m.yaNoDaTiempo({ day: D1, ahoraMin: 9 * 60 + 30, ctx, vistas: 0 })
      out.pasarFalta = (() => { const x = m.proponerPasarLoQueFalta({ route, day: D1, ctx, ahoraMin: 21 * 60 + 19 }); return x ? { boton: x.boton, quitadas: x.quitadas.map((q) => q.nombre + ':' + q.destino) } : null })()
      // pasar a otro día: solo la mejor forma (sin «Ver otra opción»)
      const pd = m.proponerPasarADia({ route, day: D1, stop: D1.stops[1], destinoId: 'd2', ctx })
      out.pasarADia = { n: pd.propuestas.length, boton: pd.propuestas[0]?.boton ?? null }
      // añadir un sitio: lo que ya está hoy nunca se ofrece; a las 23:30 solo lo abierto
      const lug = (name, extra = {}, i = 0) => ({ kind: 'place', name, coordinates: { lat: 41.9005 + i * 0.001, lng: 12.4705 }, duration_min: 30, photoUrl: 'https://x/' + name + '.jpg', category_label: 'x', ...extra })
      const lugares = [lug('Piazza Navona', {}, 0), lug('Navona', {}, 1), lug('Parque Borghese', { hours_data: { schedule: '08:00-19:00' } }, 2), lug('Museo Z', { hours_data: { schedule: '09:00-19:00' } }, 3), lug('Fontana nocturna', { hours_data: { abierto_24h: true } }, 4), lug('Castel de noche', { night_experience: true }, 5)]
      const base = { route, lugares, desde: { lat: 41.9005, lng: 12.4705 }, logros: new Set(['Fontana nocturna']), enCoche: false, day: D1, fechaIso: '2026-10-17', mes: 9, ctx }
      const c2330 = m.candidatosParaAnadir({ ...base, ahoraMin: 23 * 60 + 30 })
      out.c2330 = c2330.map((c) => c.nombre + '|' + (c.estado?.texto ?? 'SIN ESTADO') + '|' + (c.lugar?.photoUrl ? 'foto' : 'SIN FOTO'))
      const c1500 = m.candidatosParaAnadir({ ...base, ahoraMin: 15 * 60 })
      out.c1500 = c1500.map((c) => c.nombre)
      out.recompensaPrimero = c2330[0]?.nombre ?? null
      const sinNada = m.candidatosParaAnadir({ ...base, lugares: [lug('Parque Borghese', { hours_data: { schedule: '08:00-19:00' } }, 2)], ahoraMin: 23 * 60 + 30 })
      out.sinNada = sinNada.length
      // otro día: «Lo tienes el domingo», se añade hoy y el otro día no se toca
      const lugOtro = [lug('Foro', { hours_data: { abierto_24h: true } }, 2)]
      const cOtro = m.candidatosParaAnadir({ ...base, lugares: lugOtro, ahoraMin: 12 * 60 })
      out.otroDia = cOtro.map((c) => c.nombre + '|' + (c.deOtroDia?.etiqueta ?? ''))
      // avisos: una vez por viaje, día y sitio
      localStorage.removeItem('jutrip:avisos-dichos:rutaT:2026-10-17')
      out.unaVez = [u.primeraVez('rutaT', '2026-10-17', 'cerrada:x'), u.primeraVez('rutaT', '2026-10-17', 'cerrada:x'), u.primeraVez('rutaT', '2026-10-17', 'cerrada:y'), u.primeraVez('rutaT', '2026-10-18', 'cerrada:x')]
      localStorage.removeItem('jutrip:avisos-dichos:rutaT:2026-10-17'); localStorage.removeItem('jutrip:avisos-dichos:rutaT:2026-10-18')
      return out })()`)
    debe(r.mismo[0] && r.mismo[1] && !r.mismo[2] && !r.mismo[3], 'sitio', `«Piazza Navona» = «Navona» = «Plaza Navona (mercadillo)» y no se confunde con otros (${JSON.stringify(r.mismo)})`)
    debe(r.parque2330 == null && r.parque1500 != null && r.parque1830?.cierraPronto === true, 'abierto', 'un parque con horario no sale a las 23:30; a las 15:00 sí; a las 18:30 «Cierra pronto»')
    debe(r.fuente2330?.alAireLibre === true && r.sinHorario2330 == null && r.nocturna2330 != null, 'abierto', 'de noche: sale lo al aire libre (24 h) y lo nocturno; nunca un sitio sin horario')
    debe(r.retraso.length > 0, 'retraso', 'a las 21:19 hay propuestas')
    debe(r.retraso.every((x) => !/entrada de las 10:00/.test(x.mantiene)), 'retraso', `a las 21:19 NO se protege la entrada de las 10:00 que ya pasó (${r.retraso.map((x) => x.mantiene).join(' | ')})`)
    debe(r.retraso.every((x) => x.pasadas?.[0]?.hora === '10:00'), 'retraso', 'la hoja sabe que la entrada de las 10:00 ya pasó')
    debe(/domingo/.test(r.retraso[0]?.boton ?? '') && r.retraso[0].quitadas.some((q) => /:manana:domingo 18$/.test(q)), 'retraso', `primero, pasarlo al mejor día con su nombre (${r.retraso[0]?.boton} · ${r.retraso[0]?.quitadas})`)
    debe(r.retraso.some((x) => /^Mejor pasarlo al domingo/.test(x.otra ?? '')) , 'retraso', 'con [Ver otra opción], quitarlo, y ahí el botón de ver otra dice «Mejor pasarlo al domingo»')
    debe(r.retraso.every((x) => x.resumen.length > 0), 'hojas', 'cada propuesta trae su bloque de resumen')
    debe(r.yaNo && r.yaNo.entrada?.hora === '10:00', 'ya_no', 'a las 21:19, con una entrada de las 10:00 pasada, sale «Hoy ya no da tiempo a todo» con «Tu entrada de las 10:00…»')
    debe(r.yaNoTemprano == null, 'ya_no', 'a las 9:30 no sale')
    debe(r.pasarFalta && /Pasar lo que falta/.test(r.pasarFalta.boton) && r.pasarFalta.quitadas.length > 0, 'ya_no', '«Pasar lo que falta a otro día» hace una propuesta')
    debe(r.pasarADia.n === 1 && /^Pasarlo al domingo/.test(r.pasarADia.boton ?? ''), 'pasar_dia', `pasar a otro día: una sola forma, la mejor, con su botón (${JSON.stringify(r.pasarADia)})`)
    debe(!r.c2330.some((c) => /Navona/.test(c)) && !r.c1500.some((c) => /Navona/.test(c)), 'anadir', 'añadir un sitio nunca ofrece uno que ya está ese día (ni «Navona» ni «Piazza Navona»)')
    debe(r.c2330.every((c) => !/SIN ESTADO/.test(c) && !/SIN FOTO/.test(c)), 'anadir', `todo lo que sale a las 23:30 tiene su estado y su foto (${r.c2330.join(' · ')})`)
    debe(r.c2330.some((c) => /Fontana nocturna/.test(c)) && !r.c2330.some((c) => /Parque|Museo/.test(c)), 'anadir', `a las 23:30 solo lo abierto o al aire libre: ${r.c2330.join(' · ')}`)
    debe(r.recompensaPrimero === 'Fontana nocturna', 'anadir', 'primero el que tiene recompensa')
    debe(r.c1500.includes('Parque Borghese') && r.c1500.includes('Museo Z'), 'anadir', 'de día salen los abiertos')
    debe(r.sinNada === 0, 'anadir', 'sin nada abierto, la lista queda vacía (sale «A esta hora no queda nada abierto cerca.»)')
    debe(r.otroDia.some((c) => /Foro\|domingo/.test(c)), 'anadir', `un sitio de otro día sale con «Lo tienes el domingo» (${r.otroDia.join(' · ')})`)
    debe(r.unaVez[0] === true && r.unaVez[1] === false && r.unaVez[2] === true && r.unaVez[3] === true, 'avisos', `cada aviso, una vez por sitio y día (${JSON.stringify(r.unaVez)})`)
  })

  /* ───────────── 2. En pantalla ───────────── */
  for (let i = 0; i < 80 && !(await a.evaluar("typeof window.__rutaPrueba === 'function'").catch(() => false)); i++) await esp(500)
  await a.evaluar('window.__rutaPrueba().then(() => true)')
  for (let i = 0; i < 240 && !(await ev(`${R}.getState().route ? true : false`).catch(() => false)); i++) await esp(1000)
  await esp(2500)
  for (let i = 0; i < 4; i++) {
    const hecho = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Entendido|Vale|Cerrar|Siguiente)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
    if (!hecho) break
    await esp(600)
  }
  const montarHoy = async (min, mut = '') => {
    await a.evaluar(`(async () => {
      const st = ${R}; const r = JSON.parse(JSON.stringify(st.getState().route))
      r.days.forEach((d) => { d.stops.forEach((s) => { delete s.checkedInAt; delete s.saltada }) })
      ${mut}
      st.setState({ route: r, screen: 'route' })
      try { Object.keys(localStorage).filter((k) => k.startsWith('trazo:hoy:') || k.startsWith('jutrip:avisos-dichos:')).forEach((k) => localStorage.removeItem(k)); localStorage.setItem('trazo:logros:permisos-vistos', '1') } catch {}
      try { (await import('/src/lib/hoyCambiarPlanAplicar.ts')).useCambiarPlanStore.setState({ rutaId: null, fecha: null, historial: [], aviso: null }) } catch {}
      window.__horaFalsa = ${min}; window.__pos = null; window.__perm = 'denied'
      st.getState().setDevSimulatedTodayIso('2026-10-17'); st.getState().setActiveDayId(null); st.getState().setMode('explore')
      return true })()`)
    await esp(700)
    await ev(`${R}.getState().setMode('today')`)
    await esp(2600)
  }

  await sec(async () => {
    await montarHoy(12 * 60)
    debe(await hay('[data-hoy-cambiar-plan]'), 'pantalla', 'HOY a las 12:00 tiene [Cambiar plan]')
    await clic('[data-hoy-cambiar-plan]')
    await esp(700)
    const menu = (await hoja()) ?? ''
    debe(/Guárdala en pendientes y decide luego\./.test(menu) && /Elige otro día de tu viaje que te vaya bien\./.test(menu), 'menu', `los subtítulos del menú (${menu.slice(0, 160)})`)
    await a.captura(png('v43_menu_cambiar_plan'))
    await clic('[data-cambiar-opcion="retraso"]')
    await esp(900)
    const h = (await hoja()) ?? ''
    debe(h.length > 0 && !/Propuesta|Cambia:|Aplicar|Volver a mi ruta original/.test(h), 'hojas', `la hoja de retraso no lleva «Propuesta», «Cambia:», [Aplicar] ni «Volver a mi ruta original» (${h.slice(0, 160)})`)
    debe(await hay('[data-propuesta-resumen]') && (await hay('[data-propuesta-dejar]')) || (await hay('[data-propuesta-vacia]')), 'hojas', 'la hoja trae un bloque de resumen y [Dejarlo como está] (o dice que no hay nada)')
    await a.captura(png('v43_retraso'))
    await clic('[data-propuesta-dejar]')
    await esp(500)
  })

  await sec(async () => {
    // añadir un sitio cercano a las 19:30: cada fila con su estado
    await montarHoy(19 * 60 + 30)
    if (await hay('[data-hoy-cambiar-plan]')) {
      await clic('[data-hoy-cambiar-plan]')
      await esp(600)
      await clic('[data-cambiar-opcion="anadir"]')
      await esp(1500)
      const filas = await a.evaluar(`Array.from(document.querySelectorAll('[data-anadir-candidato]')).map((e) => ({ n: e.getAttribute('data-anadir-candidato'), estado: e.querySelector('[data-anadir-estado]')?.innerText ?? null, num: e.querySelector('[data-anadir-numero]')?.innerText ?? null }))`)
      const vacio = await hay('[data-anadir-vacio]')
      debe(filas.length > 0 || vacio, 'anadir', 'añadir un sitio: sale algo o la pantalla de «nada»')
      debe(filas.every((f) => f.estado && f.num), 'anadir', `cada fila lleva su número y su estado (${JSON.stringify(filas).slice(0, 200)})`)
      const nombresHoy = await a.evaluar(`(async () => { const r = ${R}.getState().route; return r.days[0].stops.map((s) => s.name) })()`)
      const norm = (t) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      debe(filas.every((f) => !nombresHoy.some((n) => norm(n) === norm(f.n))), 'anadir', 'ninguna fila repite un sitio de hoy')
      await a.captura(png('v43_anadir'))
      await clic('[data-propuesta-dejar]')
    } else debe(true, 'anadir', 'sin siguiente parada a esa hora: se prueba con el motor (parte 1)')
  })

  await sec(async () => {
    // «Hoy ya no da tiempo a todo»: 21:19 con la mañana pasada y nada hecho, una sola vez
    await montarHoy(21 * 60 + 19)
    const t1 = await hoja()
    debe(/Hoy ya no da tiempo a todo/.test(t1 ?? '') && /Lo que tenías por la mañana ya ha pasado\. ¿Qué hacemos\?/.test(t1 ?? ''), 'ya_no', `al abrir HOY a las 21:19 sale «Hoy ya no da tiempo a todo» (${(t1 ?? '').slice(0, 140)})`)
    debe(/Ver lo que queda hoy/.test(t1 ?? '') && /Pasar lo que falta a otro día/.test(t1 ?? '') && /Dejarlo como está/.test(t1 ?? ''), 'ya_no', 'con sus tres botones')
    await a.captura(png('v43_ya_no_da_tiempo'))
    await clic('[data-ya-no-dejar]')
    await esp(500)
    await ev(`${R}.getState().setMode('days')`)
    await esp(1200)
    await ev(`${R}.getState().setMode('today')`)
    await esp(2200)
    debe(!(await hay('[data-hoy-ya-no-da-tiempo]')), 'ya_no', 'tras HOY → DÍAS → HOY la hoja no vuelve a salir (una vez al día)')
  })

  await sec(async () => {
    // el aviso de «ya ha cerrado»: una vez tras HOY → DÍAS → HOY → RUTA → HOY
    await montarHoy(22 * 60 + 40)
    await clic('[data-ya-no-dejar]')
    const cuenta = () => a.evaluar(`Array.from(document.querySelectorAll('[data-aviso-de-abajo]')).filter((e) => /cerrado/.test(e.innerText)).length`)
    let vistos = 0
    for (let i = 0; i < 8; i++) {
      vistos = Math.max(vistos, await cuenta())
      await esp(500)
    }
    debe(vistos === 1, 'avisos', `a las 22:40 sale el aviso de «ya ha cerrado» (juntos en UNO) (${vistos})`)
    await a.captura(png('v43_aviso_cerrado'))
    debe(vistos <= 1, 'avisos', `nunca más de un aviso de «ya ha cerrado» a la vez (${vistos})`)
    await esp(6500)
    await ev(`${R}.getState().setMode('days')`)
    await esp(900)
    await ev(`${R}.getState().setMode('today')`)
    await esp(900)
    await ev(`${R}.getState().setMode('route')`)
    await esp(900)
    await ev(`${R}.getState().setMode('today')`)
    let repetido = 0
    for (let i = 0; i < 8; i++) {
      repetido = Math.max(repetido, await cuenta())
      await esp(400)
    }
    debe(repetido === 0, 'avisos', `el aviso de «ya ha cerrado» NO se repite tras HOY → DÍAS → HOY → RUTA → HOY (${repetido})`)
  })

  await sec(async () => {
    // ningún botón con el borde #9A7228 en pantalla
    await montarHoy(12 * 60)
    const con = await a.evaluar(`Array.from(document.querySelectorAll('button, a')).filter((e) => { const s = getComputedStyle(e); return [s.borderTopColor, s.borderBottomColor, s.borderLeftColor].some((c) => c === 'rgb(154, 114, 40)') && parseFloat(s.borderTopWidth) > 0 }).length`)
    debe(con === 0, 'boton_dorado', `ningún botón de HOY con el borde #9A7228 en pantalla (${con})`)
    const horaFalsa = await ev('window.__horaFalsa')
    debe(horaFalsa === 720, 'pantalla', 'la hora simulada se mantiene')
    await a.captura(png('v43_hoy_parada'))
  })
} finally {
  a.cerrar()
}

console.log(`\nPrueba de la V43 · ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
for (const f of fallos) console.log(`✗ [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
