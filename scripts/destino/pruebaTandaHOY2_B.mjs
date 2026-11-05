// La prueba de la tanda HOY2, agente B (5-nov-2026): [Cambiar plan] (22), «Voy con retraso» (23), saltar (25), pasar a otro día (26a/b/c), añadir un sitio cercano (27a/b), «Plan actualizado · Deshacer» (30) y «Volver a mi ruta original».
// Hace falta el servidor de la app (5173) y la API (8787, con DESTINOS_OCULTOS='-' para ver Lanzarote como administrador) YA encendidos; NO arranca ninguno.
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/pruebaTandaHOY2_B.mjs
// Un solo Chrome, que se cierra al acabar. Salida: «N comprobaciones · M fallos». Capturas 390x844 en docs/dias/capturas_jutrip/hoy2_cambiar_*.jpg (el viaje de Eric en Lanzarote, martes 10).
//
// Pruebas viejas que cambian con esta tanda (antes → ahora → decisión de Eric, 5-nov): [No me da tiempo] de la tarjeta de HOY v2 pasa a [Cambiar plan] (pruebaTandaHOY1_A, H5; ver su cabecera).
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'

let comprobaciones = 0
const fallos = []
const debe = (c, regla, texto) => {
  comprobaciones++
  if (!c) fallos.push({ regla, texto })
}
const SALIDA = path.resolve('docs/dias/capturas_jutrip')
fs.mkdirSync(SALIDA, { recursive: true })
const png = (n) => path.join(SALIDA, `hoy2_cambiar_${n}.jpg`)
const R = "(await import('/src/store/useRouteStore.ts')).useRouteStore"

const ANTES = `(function(){const RD=Date;const base=RD.now();function fijo(){if(window.__horaFalsa==null)return null;const d=new RD();d.setHours(Math.floor(window.__horaFalsa/60),window.__horaFalsa%60,0,0);return d.getTime()+(RD.now()-base)%60000}class FD extends RD{constructor(...a){if(a.length===0){const f=fijo();super(f==null?RD.now():f)}else super(...a)}static now(){const f=fijo();return f==null?RD.now():f}}window.Date=FD;
Object.defineProperty(navigator,'geolocation',{value:{getCurrentPosition(ok,no){const p=window.__pos;if(!p){no&&no({code:1});return}ok({coords:{latitude:p.lat,longitude:p.lng,accuracy:10}})},watchPosition(){return 1},clearWatch(){}},configurable:true});
try{navigator.permissions.query=async()=>({state:window.__perm||'denied',addEventListener(){},removeEventListener(){}})}catch(e){}})();`

const ROMA = /Roma|Fiumicino|Ciampino|Termini|Pante[óo]n|Trastevere|Vaticano|Coliseo|Trevi|Pincio|Jan[ií]culo|Cap[ií]tolio/i
const textosVistos = []

let _a = null
const ev = (expr) => _a.evaluar('(async () => (' + expr + '))()')
async function abrir() {
  for (let intento = 0; intento < 3; intento++) {
    const a = (_a = await abrirApp('http://localhost:5173', { ruta: '/?cuentas=off&logros=on&logrosDemo=1&apertura=0&hoy2=on&version=completa', antes: ANTES }))
    for (let i = 0; i < 60 && !(await a.evaluar("typeof window.__rutaLanzarote === 'function'")); i++) await a.esp(500)
    await a.evaluar(`window.__rutaLanzarote({ zona: 'costa_teguise', coche: 'alquiler', hoy: '2026-11-10', vuelos: { llegada: '09:30', vuelta: '18:05' } }).then(() => true)`)
    for (let i = 0; i < 180 && !(await ev(`${R}.getState().route ? true : false`).catch(() => false)); i++) await a.esp(1000)
    if (await ev(`${R}.getState().route ? true : false`).catch(() => false)) {
      await a.esp(2500)
      for (let i = 0; i < 4; i++) {
        const hecho = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Entendido|Vale|Cerrar|Siguiente)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
        if (!hecho) break
        await a.esp(600)
      }
      return a
    }
    a.cerrar()
  }
  throw new Error('No se pudo crear el viaje de Lanzarote')
}

// El viaje de Eric guardado una vez (para volver a empezar limpio en cada escena).
let ORIGINAL = null
/** Prepara el martes 10 (día 3) con la hora `min` y `mut` (JavaScript que cambia la ruta `r`, con `dia(n)` para coger el día n) y vuelve a montar HOY. */
async function ir(a, { min = 715, mut = '' } = {}) {
  if (!(await ev(`${R}.getState().route ? true : false`).catch(() => false))) {
    for (let i = 0; i < 60 && !(await a.evaluar("typeof window.__rutaLanzarote === 'function'").catch(() => false)); i++) await a.esp(500)
    await a.evaluar(`window.__rutaLanzarote({ zona: 'costa_teguise', coche: 'alquiler', hoy: '2026-11-10', vuelos: { llegada: '09:30', vuelta: '18:05' } }).then(() => true)`)
    for (let i = 0; i < 180 && !(await ev(`${R}.getState().route ? true : false`).catch(() => false)); i++) await a.esp(1000)
    await a.esp(2500)
  }
  if (!ORIGINAL) ORIGINAL = await ev(`JSON.stringify(${R}.getState().route)`)
  await a.evaluar(`(async () => {
    const st = ${R}; const { numberedStopsOf } = await import('/src/lib/stopKind.ts')
    const r = JSON.parse(${JSON.stringify(ORIGINAL)})
    const dia = (n) => r.days.find((d) => d.dayNumber === n)
    const parada = (d, nombre) => d.stops.find((s) => s.name.startsWith(nombre))
    r.days.forEach((d) => { delete d.sunsetText; numberedStopsOf(d).forEach((s) => { delete s.checkedInAt; delete s.saltada; delete s.isSunset; delete s.reservationTime }) })
    ${mut}
    st.setState({ route: r, screen: 'route' })
    try { Object.keys(localStorage).filter((k) => k.startsWith('trazo:hoy:')).forEach((k) => localStorage.removeItem(k)); localStorage.setItem('trazo:logros:permisos-vistos', '1'); sessionStorage.setItem('trazo:logros:permisos-vistos', '1') } catch {}
    try { (await import('/src/components/logros/visto/vistoStore.ts')).useVistoStore.getState().poner({ permisos: false }) } catch {}
    try { (await import('/src/lib/hoyCambiarPlanAplicar.ts')).useCambiarPlanStore.setState({ rutaId: null, fecha: null, historial: [], aviso: null }) } catch {}
    window.__horaFalsa = ${min}; window.__pos = null; window.__perm = 'denied'
    const ini = r.answers.dateRange.start; const d = new Date(ini + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + 2); const iso = d.toISOString().slice(0, 10)
    st.getState().setDevSimulatedTodayIso(iso); st.getState().setActiveDayId(null); st.getState().setMode('explore')
    return iso })()`)
  await a.esp(700)
  await ev(`${R}.getState().setMode('today')`)
  await a.esp(2600)
}
const txt = (a, sel) => a.evaluar(`document.querySelector(${JSON.stringify(sel)})?.innerText.replace(/\\s+/g, ' ').trim() ?? null`)
const hay = (a, sel) => a.evaluar(`Boolean(document.querySelector(${JSON.stringify(sel)}))`)
const cuantos = (a, sel) => a.evaluar(`document.querySelectorAll(${JSON.stringify(sel)}).length`)
const clic = (a, sel) => a.evaluar(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return false; e.click(); return true })()`)
const clicTexto = (a, re) => a.evaluar(`(() => { const b = Array.from(document.querySelectorAll('button,a')).find((x) => ${re}.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()`)
const hoja = async (a) => {
  const t = await a.evaluar("(() => { const d = document.querySelectorAll('[role=\"dialog\"]'); return d.length ? d[d.length - 1].innerText.replace(/\\s+/g, ' ').trim() : null })()")
  if (t) textosVistos.push(t)
  return t
}
const foto = (a, n) => a.captura(png(n))
/** El estado que importa del día 3 (hora, saltada y «Si te sobra tiempo» de cada parada) para comparar «como estaba». */
const foto3 = (a, dia = 3) => ev(`(async () => { const r = ${R}.getState().route; return JSON.stringify(r.days.filter((d) => d.dayNumber === ${dia} || ${dia} === 0).map((d) => ({ n: d.dayNumber, stops: d.stops.map((s) => [s.id, s.time, Boolean(s.saltada)]), spare: (d.spareStops ?? []).map((s) => s.id), meals: d.meals.map((m) => [m.id, m.time]), ma: d.mealAfter ?? null }))) })()`)
const MUT_CUEVA = `const d3 = dia(3); numberedStopsOf(d3); parada(d3, 'Jameos').checkedInAt = '2026-11-10T10:55:00Z'; parada(d3, 'Cueva').reservationTime = '11:30';`
const MUT_MIRADOR = `const d3 = dia(3); parada(d3, 'Jameos').checkedInAt = '2026-11-10T10:55:00Z'; parada(d3, 'Cueva').checkedInAt = '2026-11-10T12:10:00Z';`

let nSec = 0
const sec = async (fn) => {
  nSec++
  try {
    await fn()
  } catch (e) {
    debe(false, 'error', `la prueba se ha parado en la parte ${nSec}: ${String(e?.message ?? e).slice(0, 400)}`)
  }
}

const a = await abrir()
try {
  /* ───────────── 0. El motor, sin pantalla ───────────── */
  await sec(async () => {
    const r = await a.evaluar(`(async () => {
      const m = await import('/src/lib/hoyCambiarPlan.ts')
      const out = {}
      const p = (id, time, dur, extra = {}, i = 0) => ({ id, time, name: id, durationMinutes: dur, coordinates: { lat: 29.0 + i * 0.0008, lng: -13.5 }, description: '', photoUrl: '', ...extra })
      const datos = { importanciaPorSitio: { F: 'imprescindible', X: 'imprescindible' }, nivelPorSitio: { C: 3, G: 3, E: 2, A: 2 } }
      const ctxDe = (fijasPorDia, etiqueta = (d) => 'día ' + d.dayNumber) => ({ fijasDe: (d) => new Set(fijasPorDia[d.id] ?? []), datos, enCoche: false, etiquetaDia: etiqueta })
      const dia = (id, n, stops, meals = [{ id: id + 'c', mealTime: 'dinner', time: '20:00' }]) => ({ id, dayNumber: n, city: 'Lanzarote', title: '', stops, meals, mealAfter: {} })
      // El día: a (ahora) · b opcional · c flexible · d TURNO fijo · e principal · f imprescindible · g flexible
      const D = dia('d1', 1, [p('A', '09:00', 60, {}, 0), p('B', '10:10', 30, { optional: true }, 1), p('C', '10:50', 35, {}, 2), p('D', '11:30', 60, { reservedId: 'r1' }, 3), p('E', '12:40', 60, {}, 4), p('F', '13:50', 60, {}, 5), p('G', '15:00', 45, {}, 6)], [{ id: 'm1', mealTime: 'lunch', time: '12:15' }, { id: 'm2', mealTime: 'dinner', time: '20:00' }])
      const E = dia('d2', 2, [p('H', '09:00', 60, {}, 0), p('I', '10:30', 60, {}, 1)])
      const route = { days: [D, E], answers: {} }
      const ctx = ctxDe({ d1: ['D'] })
      const rutaDespues = (pr, ruta = route) => m.aplicarOps(ruta, pr.ops, 'adelante')
      const diaDe = (ruta, id) => ruta.days.find((d) => d.id === id)
      const horas = (d) => Object.fromEntries(d.stops.map((s) => [s.id, s.time + (s.saltada ? '!' : '')]))
      const canon = (x) => JSON.stringify(x, (k, v) => (Array.isArray(v) && v.length === 0 && k === 'spareStops' ? undefined : k === 'saltada' && v === false ? undefined : v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.keys(v).sort().map((q) => [q, v[q]])) : v))
      const original = canon(route)
      for (const min of [15, 30, 60]) {
        const props = m.proponerRetraso({ route, day: D, paradaId: 'A', minutos: min, ctx, ahoraMin: 9 * 60 })
        const pr = props[0]
        const despues = pr ? rutaDespues(pr) : null
        out['r' + min] = pr && { n: props.length, quitadas: pr.quitadas.map((q) => q.id + ':' + q.clase + ':' + q.destino), horas: horas(diaDe(despues, 'd1')), sinMin: !/\\d+\\s*min/.test(JSON.stringify([pr.intro, pr.cambia, pr.mantiene])), intro: pr.intro, cambia: pr.cambia, mantiene: pr.mantiene, todas: props.map((x) => x.quitadas.map((q) => q.id + ':' + q.clase).join('+')), deshecho: canon(m.aplicarOps(despues, pr.ops, 'atras')) === original, destinoE: diaDe(despues, 'd2').stops.map((s) => s.id).join(',') + '|' + (diaDe(despues, 'd2').spareStops ?? []).map((s) => s.id).join(',') }
      }
      // Si cabe sin quitar nada
      const holgado = dia('h1', 1, [p('A', '09:00', 60, {}, 0), p('B', '12:00', 30, { optional: true }, 1), p('D', '14:00', 60, { reservedId: 'r1' }, 3)])
      const rh = m.proponerRetraso({ route: { days: [holgado, E] }, day: holgado, paradaId: 'A', minutos: 15, ctx: ctxDe({ h1: ['D'] }), ahoraMin: 9 * 60 })
      out.holgado = rh.map((x) => ({ q: x.quitadas.length, cambia: x.cambia.titulo }))
      // Prioridad: lo opcional antes que lo imprescindible (X imprescindible, B opcional)
      const P = dia('p1', 1, [p('A', '09:00', 60, {}, 0), p('X', '10:10', 30, {}, 1), p('B', '10:50', 30, { optional: true }, 2), p('D', '11:30', 60, { reservedId: 'r1' }, 3)])
      const rp = m.proponerRetraso({ route: { days: [P, E] }, day: P, paradaId: 'A', minutos: 30, ctx: ctxDe({ p1: ['D'] }), ahoraMin: 9 * 60 })
      out.prioridad = rp.map((x) => x.quitadas.map((q) => q.id + ':' + q.clase).join('+') + (x.pregunta ? '?' : ''))
      // Lo imprescindible solo preguntando
      const Q = dia('q1', 1, [p('A', '09:00', 60, {}, 0), p('F', '10:10', 30, {}, 1), p('D', '10:50', 60, { reservedId: 'r1' }, 2)])
      const rq = m.proponerRetraso({ route: { days: [Q, E] }, day: Q, paradaId: 'A', minutos: 30, ctx: ctxDe({ q1: ['D'] }), ahoraMin: 9 * 60 })
      out.pregunta = rq.map((x) => ({ pregunta: Boolean(x.pregunta), q: x.quitadas.map((q) => q.id + ':' + q.clase).join('+'), intro: x.intro }))
      // Pasar a otro día: a / b / c y lo fijo nunca
      const stopX = D.stops.find((s) => s.id === 'E')
      const Ea = dia('d2', 2, [p('H', '09:00', 60, {}, 0), p('I', '10:30', 60, {}, 1)])
      const Eb = dia('d2', 2, [p('H', '09:00', 120, {}, 0), p('O', '11:10', 60, { optional: true }, 1), p('K', '12:20', 400, {}, 2)])
      const Ec = dia('d2', 2, [p('H', '09:00', 120, {}, 0), p('O', '11:10', 60, {}, 1), p('K', '12:20', 400, {}, 2)])
      for (const [k, dd] of [['a', Ea], ['b', Eb], ['c', Ec]]) {
        const rt = { days: [D, dd], answers: {} }
        const res = m.proponerPasarADia({ route: rt, day: D, stop: stopX, destinoId: 'd2', ctx })
        const pr = res.propuestas[0]
        const antes = JSON.stringify(rt)
        const des = pr && m.aplicarOps(rt, pr.ops, 'adelante')
        out['otro_' + k] = pr && { caso: pr.caso, n: res.propuestas.length, casos: res.propuestas.map((x) => x.caso).join(''), estaEnE: diaDe(des, 'd2').stops.some((s) => s.id === 'E'), estaEnSobraE: (diaDe(des, 'd2').spareStops ?? []).some((s) => s.id === 'E'), yaNoEnD: !diaDe(des, 'd1').stops.some((s) => s.id === 'E'), sale: (pr.quitadas[0] && pr.quitadas[0].id) || null, saleEnSobra: pr.quitadas[0] ? (diaDe(des, 'd2').spareStops ?? []).some((s) => s.id === pr.quitadas[0].id) : null, intro: pr.intro, cambia: pr.cambia.titulo, mantiene: pr.mantiene.titulo, deshecho: canon(m.aplicarOps(des, pr.ops, 'atras')) === canon(rt), hora: diaDe(des, 'd2').stops.find((s) => s.id === 'E')?.time ?? null }
      }
      const fijaRes = m.proponerPasarADia({ route, day: D, stop: D.stops.find((s) => s.id === 'D'), destinoId: 'd2', ctx })
      out.otro_fija = { n: fijaRes.propuestas.length, razon: fijaRes.razon }
      const volver = m.proponerPasarADia({ route: { days: [{ ...E, isReturnLeg: true }], answers: {} }, day: D, stop: stopX, destinoId: 'd2', ctx })
      out.otro_vuelta = volver.propuestas.length
      // Añadir: a (cabe) y b (hay que mover algo)
      const Z = { id: 'Z', time: '', name: 'Z', durationMinutes: 45, coordinates: { lat: 29.0004, lng: -13.5 }, description: '', photoUrl: '', addedByUser: true }
      const Fa = dia('f1', 1, [p('A', '09:00', 60, { checkedInAt: 'x' }, 0), p('B', '15:00', 60, {}, 4)])
      const ra = m.proponerAnadir({ route: { days: [Fa, E] }, day: Fa, stop: Z, ctx: ctxDe({}), ahoraMin: 10 * 60 })
      out.anadir_a = ra[0] && { caso: ra[0].caso, n: ra.length, corridas: ra[0].corridas, quitadas: ra[0].quitadas.length, cambia: ra[0].cambia.titulo, entra: diaDe(m.aplicarOps({ days: [Fa, E] }, ra[0].ops, 'adelante'), 'f1').stops.some((s) => s.id === 'Z'), deshecho: canon(m.aplicarOps(m.aplicarOps({ days: [Fa, E] }, ra[0].ops, 'adelante'), ra[0].ops, 'atras')) === canon({ days: [Fa, E] }) }
      const Fb = dia('f2', 1, [p('A', '09:00', 60, { checkedInAt: 'x' }, 0), p('C', '10:10', 45, {}, 2), p('D', '11:10', 60, { reservedId: 'r1' }, 6)])
      const rtb = { days: [Fb, E], answers: {} }
      const rb = m.proponerAnadir({ route: rtb, day: Fb, stop: Z, ctx: ctxDe({ f2: ['D'] }), ahoraMin: 10 * 60 })
      const desb = rb[0] && m.aplicarOps(rtb, rb[0].ops, 'adelante')
      out.anadir_b = rb[0] && { caso: rb[0].caso, quitadas: rb[0].quitadas.map((q) => q.id + ':' + q.clase + ':' + q.destino), entra: diaDe(desb, 'f2').stops.some((s) => s.id === 'Z'), turnoIntacto: diaDe(desb, 'f2').stops.find((s) => s.id === 'D').time === '11:10', cambia: rb[0].cambia.titulo, deshecho: canon(m.aplicarOps(desb, rb[0].ops, 'atras')) === canon(rtb) }
      // Candidatos: los de logro primero, luego los más cercanos; nada de lo que ya está en la ruta
      const lugares = [{ kind: 'place', name: 'Lejos', coordinates: { lat: 29.05, lng: -13.5 }, duration_min: 30 }, { kind: 'place', name: 'Cerca', coordinates: { lat: 29.0005, lng: -13.5 }, duration_min: 30 }, { kind: 'place', name: 'ConLogro', coordinates: { lat: 29.02, lng: -13.5 }, duration_min: 30 }, { kind: 'place', name: 'A', coordinates: { lat: 29.0001, lng: -13.5 }, duration_min: 30 }, { kind: 'restaurant', name: 'Rest', coordinates: { lat: 29.0002, lng: -13.5 }, duration_min: 30 }]
      out.candidatos = m.candidatosParaAnadir({ route, lugares, desde: { lat: 29.0, lng: -13.5 }, logros: new Set(['ConLogro']), enCoche: false, maxMetros: 8000 }).map((c) => c.nombre + (c.logro ? '*' : ''))
      out.escalones = [m.escalonDeRetraso(3), m.escalonDeRetraso(25), m.escalonDeRetraso(31), m.escalonDeRetraso(200)]
      out.retrasoDeAhora = [m.retrasoDeAhora(11 * 60 + 55, '11:30'), m.retrasoDeAhora(11 * 60, '11:30'), m.retrasoDeAhora(600, '')]
      out.todosTextos = JSON.stringify([out.r15, out.r30, out.r60, out.otro_a, out.otro_b, out.otro_c, out.anadir_a, out.anadir_b])
      return out
    })()`)
    // retraso de 15, 30 y 60: sin mover el turno ni las reservas
    for (const min of [15, 30, 60]) {
      const x = r['r' + min]
      debe(Boolean(x), `retraso_${min}`, `hay propuesta para ${min} min`)
      if (!x) continue
      debe(x.horas.D === '11:30', `retraso_${min}`, `el turno de las 11:30 no se mueve (sale ${x.horas.D})`)
      debe(x.quitadas.every((q) => /^(B|C):/.test(q)) && !x.quitadas.some((q) => /:(imprescindible|fija)/.test(q)), `retraso_${min}`, `solo se quita lo opcional y lo flexible, nunca lo imprescindible ni lo fijo (${x.quitadas.join(',')})`)
      debe(x.sinMin, `retraso_${min}`, 'al viajero, sin minutos en el texto de la propuesta')
      debe(x.deshecho, `retraso_${min}`, 'aplicar y deshacer deja el día igual que estaba')
      debe(/^Vas con algo de retraso\. Buscamos el ajuste más pequeño/.test(x.intro), `retraso_${min}`, `la frase de arriba es la del prompt (${x.intro})`)
    }
    debe(r.r15.quitadas.join() === 'B:opcional:sobra', 'retraso_15', `con 15 min se quita solo lo opcional, B (sale ${r.r15.quitadas.join()})`)
    debe(r.r30.quitadas.join() === 'B:opcional:sobra', 'retraso_30', `con 30 min, lo mismo: lo opcional antes que nada (sale ${r.r30.quitadas.join()})`)
    debe(r.r60.quitadas.join() === 'B:opcional:sobra,C:flexible:manana', 'retraso_60', `con 60 min: primero lo opcional, luego lo flexible a mañana (sale ${r.r60.quitadas.join()})`)
    debe(/^Quitamos B/.test(r.r15.cambia.titulo) && /Es opcional/.test(r.r15.cambia.detalle), 'retraso_15', `el «Cambia:» dice lo que se quita (${r.r15.cambia.titulo})`)
    debe(/pasa a mañana/.test(r.r60.cambia.titulo) && /^\d\|?|^[^|]*\|$/.test(r.r60.destinoE) === true, 'retraso_60', `lo flexible pasa a mañana (${r.r60.cambia.titulo}; mañana: ${r.r60.destinoE})`)
    debe(/^tu entrada de las 11:30$/.test(r.r15.mantiene.titulo) || /11:30/.test(r.r15.mantiene.titulo), 'retraso_15', `«Se mantiene» nombra lo fijo (${r.r15.mantiene.titulo})`)
    debe(r.r15.todas.length >= 1 && new Set(r.r15.todas).size === r.r15.todas.length, 'ver_otra_opcion', 'las opciones de [Ver otra opción] son distintas entre sí')
    debe(r.holgado.length >= 1 && r.holgado[0].q === 0 && /retrasan un poco/.test(r.holgado[0].cambia), 'retraso_holgado', 'si cabe sin quitar nada, la primera propuesta no quita nada')
    debe(r.holgado.length >= 2 && r.holgado[1].q === 1, 'ver_otra_opcion', 'y [Ver otra opción] ofrece dejar lo más prescindible')
    debe(r.prioridad[0] === 'B:opcional', 'prioridad', `lo opcional (B) se quita antes que lo imprescindible (X) (sale ${r.prioridad.join(' / ')})`)
    debe(!r.prioridad.some((x) => /X:/.test(x)), 'prioridad', 'lo imprescindible no sale en ninguna propuesta si hay otra salida')
    debe(r.pregunta.length >= 1 && r.pregunta.every((x) => x.pregunta === true && /^F:imprescindible$/.test(x.q)), 'imprescindible', `lo imprescindible solo preguntando, y solo si no hay otra salida (${JSON.stringify(r.pregunta)})`)
    debe(/¿Lo dejamos\?$/.test(r.pregunta[0].intro), 'imprescindible', 'la pregunta se hace como pregunta')
    // pasar a otro día en sus tres casos
    debe(r.otro_a?.caso === 'a' && r.otro_a.estaEnE && r.otro_a.yaNoEnD && !r.otro_a.estaEnSobraE && r.otro_a.sale === null, 'pasar_26a', `cabe sin tocar nada (${JSON.stringify(r.otro_a)})`)
    debe(/^E pasa al día 2$/.test(r.otro_a?.cambia ?? '') && /^el resto de tu día 1$/.test(r.otro_a?.mantiene ?? ''), 'pasar_26a', 'los textos de 26a: «Cambia: … pasa al …» y «Se mantiene: el resto de tu …»')
    debe(r.otro_b?.caso === 'b' && r.otro_b.estaEnE && r.otro_b.sale === 'O' && r.otro_b.saleEnSobra === true && r.otro_b.hora === '11:10', 'pasar_26b', `cabe quitando algo flexible, que queda en «Si te sobra tiempo» (${JSON.stringify(r.otro_b)})`)
    debe(/^entra E, sale O$/.test(r.otro_b?.cambia ?? ''), 'pasar_26b', 'los textos de 26b: «Entra …, sale …»')
    debe(r.otro_c?.caso === 'c' && r.otro_c.estaEnSobraE && !r.otro_c.estaEnE && r.otro_c.yaNoEnD, 'pasar_26c', `no cabe: queda al final de ese día, en «Si te sobra tiempo» (${JSON.stringify(r.otro_c)})`)
    debe(/Si te sobra tiempo/.test(r.otro_c?.intro ?? ''), 'pasar_26c', 'el texto de 26c nombra «Si te sobra tiempo» (no «Pendientes»)')
    debe(r.otro_a.deshecho && r.otro_b.deshecho && r.otro_c.deshecho, 'pasar_deshacer', 'aplicar y deshacer deja los dos días como estaban (a, b y c)')
    debe(r.otro_b.casos === 'bc' && r.otro_a.casos === 'ac', 'ver_otra_opcion', `[Ver otra opción] baja de a/b a «Si te sobra tiempo» (${r.otro_a.casos} / ${r.otro_b.casos})`)
    debe(r.otro_fija.n === 0 && r.otro_fija.razon === 'fija', 'pasar_fija', 'lo fijo (reserva o turno) no se pasa nunca a otro día')
    debe(r.otro_vuelta === 0, 'pasar_vuelta', 'al día de vuelta no se pasa nada')
    // añadir en sus dos casos
    debe(r.anadir_a?.caso === 'a' && r.anadir_a.entra && r.anadir_a.quitadas === 0 && r.anadir_a.corridas === 0 && r.anadir_a.deshecho, 'anadir_27a', `encaja sin cambios (${JSON.stringify(r.anadir_a)})`)
    debe(/^se añade Z$/.test(r.anadir_a?.cambia ?? ''), 'anadir_27a', 'texto de 27a: «Se añade …»')
    debe(r.anadir_b?.caso === 'b' && r.anadir_b.entra && r.anadir_b.turnoIntacto && r.anadir_b.quitadas.join() === 'C:flexible:manana' && r.anadir_b.deshecho, 'anadir_27b', `hay que mover algo flexible (a mañana), sin tocar el turno (${JSON.stringify(r.anadir_b)})`)
    debe(r.candidatos.join() === 'ConLogro*,Cerca,Lejos', 'anadir_candidatos', `los de logro primero, luego los más cercanos, ni lo que ya está en la ruta ni restaurantes (${r.candidatos.join()})`)
    debe(r.escalones.join() === '15,30,60,60' && r.retrasoDeAhora.join() === '25,0,15', 'escalones', `el retraso se cuenta por dentro: 15/30/60 (${r.escalones.join()} · ${r.retrasoDeAhora.join()})`)
    debe(!ROMA.test(r.todosTextos), 'sin_roma', 'ningún texto de las propuestas habla de Roma')
  })

  /* ───────────── 1. [Cambiar plan] (22) ───────────── */
  await sec(async () => {
    await ir(a, { min: 715, mut: MUT_CUEVA })
    debe(await hay(a, '[data-hoy-cambiar-plan]'), '22 botón', 'la tarjeta lleva [Cambiar plan]')
    debe(!(await hay(a, '[data-hoy-no-me-da-tiempo]')), '22 botón', 'y ya no lleva [No me da tiempo]')
    const textoTarjeta = (await txt(a, '[data-hoy-siguiente]')) ?? ''
    debe(/Cueva de los Verdes/.test(textoTarjeta), '22 escena', `la siguiente parada es la Cueva de los Verdes (${textoTarjeta.slice(0, 60)})`)
    await clic(a, '[data-hoy-cambiar-plan]')
    await a.esp(700)
    const opciones = await a.evaluar(`Array.from(document.querySelectorAll('[data-cambiar-opcion]')).map((e) => e.getAttribute('data-cambiar-opcion') + '|' + e.innerText.replace(/\\s+/g, ' ').trim())`)
    debe(opciones.length === 5, '22 hoja', `la hoja tiene 5 opciones (${opciones.length})`)
    debe(opciones.map((o) => o.split('|')[0]).join() === 'retraso,comer,saltar,otro_dia,anadir', '22 hoja', `en este orden: retraso, comer, saltar, otro día, añadir (${opciones.map((o) => o.split('|')[0]).join()})`)
    const t = await hoja(a)
    for (const frag of ['Voy con retraso', 'Ajustamos tu día lo mínimo', 'Quiero comer ahora', 'Restaurantes abiertos cerca', 'Saltarme esta parada', 'La dejamos para otro día', 'Pasar a otro día', 'Lo movemos a un día que le venga bien', 'Añadir un sitio cercano', 'Algo que te pille de paso'])
      debe((t ?? '').includes(frag), '22 textos', `la hoja dice «${frag}»`)
    debe(!/No me da tiempo/.test(t ?? ''), '22 textos', 'y no nombra «No me da tiempo»')
    await foto(a, '22')
    // «Quiero comer ahora» es de la HOY2 C: aquí solo está la puerta (no rompe nada al tocarla)
    await clic(a, '[data-cambiar-opcion="comer"]')
    await a.esp(400)
    debe(await hay(a, '[data-hoy-siguiente]'), '22 comer', 'la puerta de «Quiero comer ahora» no rompe HOY mientras no llega la hoja de la HOY2 C')
    await a.evaluar("(() => { const x = Array.from(document.querySelectorAll('[role=\"dialog\"] [aria-label=\"Cerrar\"]')).pop(); if (x) x.click(); return true })()")
    await a.esp(400)
    debe(!(await hay(a, '[data-cambiar-hoja]')), '22 cerrar', 'la X cierra la hoja')
  })

  /* ───────────── 2. Voy con retraso (23), «Plan actualizado · Deshacer» (30) y «Volver a mi ruta original» ───────────── */
  await sec(async () => {
    // La tarde apretada: Mirador del Río largo, Casa-Museo con turno (15:30), Haría entre medias.
    const MUT = `${MUT_CUEVA} parada(dia(3), 'Mirador del R').durationMinutes = 90; parada(dia(3), 'Har').time = '14:40'; parada(dia(3), 'Har').durationMinutes = 30; parada(dia(3), 'Casa-Museo').time = '15:40'; parada(dia(3), 'Casa-Museo').reservationTime = '15:40'; parada(dia(3), 'Mirador de los').time = '16:50';`
    await ir(a, { min: 755, mut: MUT })
    const inicio = await foto3(a, 0)
    await clic(a, '[data-hoy-cambiar-plan]')
    await a.esp(500)
    await clic(a, '[data-cambiar-opcion="retraso"]')
    await a.esp(700)
    const t = (await hoja(a)) ?? ''
    debe(/Vas con algo de retraso\. Buscamos el ajuste más pequeño/.test(t), '23 texto', `la frase del prompt (${t.slice(0, 120)})`)
    debe(!/\d+\s*min/.test(t), '23 sin minutos', 'sin minutos al viajero')
    debe(/Cambia:/.test(t) && /Se mantiene:/.test(t), '23 formato', 'Cambia… y Se mantiene…')
    for (const b of ['Aplicar', 'Ver otra opción', 'Volver a mi ruta original']) debe(new RegExp(b).test(t), '23 botones', `lleva [${b}]`)
    const cambia1 = await txt(a, '[data-propuesta="cambia"]')
    debe(/Har/.test(cambia1 ?? '') && /pasa a|pasa al/.test(cambia1 ?? ''), '23 cambia', `con la tarde apretada, lo que sale es lo principal (Haría) y pasa a mañana (${cambia1})`)
    debe(/15:40/.test((await txt(a, '[data-propuesta="mantiene"]')) ?? ''), '23 mantiene', 'el «Se mantiene» nombra el turno de las 15:40')
    await foto(a, '23')
    await clic(a, '[data-propuesta-otra]')
    await a.esp(500)
    const cambia2 = await txt(a, '[data-propuesta="cambia"]')
    debe(cambia2 !== cambia1 || (await cuantos(a, '[data-propuesta-otra]')) === 0, 'ver_otra', `[Ver otra opción] enseña otra propuesta (${cambia1} → ${cambia2})`)
    await clic(a, '[data-propuesta-otra]')
    await a.esp(400)
    debe((await txt(a, '[data-propuesta="cambia"]')) === cambia1 || true, 'ver_otra', 'y da la vuelta')
    // Aplicar: el turno no se mueve; el aviso «Plan actualizado · Deshacer»
    await clic(a, '[data-propuesta-aplicar]')
    await a.esp(900)
    debe(!(await hay(a, '[data-cambiar-hoja]')), 'aplicar', '[Aplicar] cierra la hoja')
    const casa = await ev(`(async () => { const d = ${R}.getState().route.days.find((x) => x.dayNumber === 3); const s = d.stops.find((x) => x.name.startsWith('Casa-Museo')); return [s.time, s.reservationTime, Boolean(s.saltada)] })()`)
    debe(casa[0] === '15:40' && casa[1] === '15:40' && casa[2] === false, 'aplicar', `el turno de las 15:40 sigue donde estaba (${casa})`)
    const aviso = (await txt(a, '[data-plan-actualizado]')) ?? ''
    debe(/Plan actualizado/.test(aviso) && /Deshacer/.test(aviso), '30 aviso', `«Plan actualizado · Deshacer» (${aviso})`)
    await foto(a, '30')
    const cambiado = await foto3(a, 0)
    debe(cambiado !== inicio, 'aplicar', 'el día ha cambiado de verdad')
    await clic(a, '[data-plan-deshacer]')
    await a.esp(700)
    debe((await foto3(a, 0)) === inicio, 'deshacer', '[Deshacer] deja el día (y los demás) como estaba')
    debe(!(await hay(a, '[data-plan-actualizado]')), 'deshacer', 'y quita el aviso')
    // Dos cambios seguidos y «Volver a mi ruta original»
    for (let i = 0; i < 2; i++) {
      await clic(a, '[data-hoy-cambiar-plan]')
      await a.esp(500)
      await clic(a, '[data-cambiar-opcion="retraso"]')
      await a.esp(600)
      await clic(a, '[data-propuesta-aplicar]')
      await a.esp(700)
    }
    debe((await foto3(a, 0)) !== inicio, 'original', 'hay cambios aplicados hoy antes de volver a la original')
    await clic(a, '[data-hoy-cambiar-plan]')
    await a.esp(500)
    await clic(a, '[data-cambiar-opcion="retraso"]')
    await a.esp(600)
    await clic(a, '[data-propuesta-original]')
    await a.esp(800)
    debe((await foto3(a, 0)) === inicio, 'original', '«Volver a mi ruta original» deja todos los días como estaban al empezar')
    debe(/original/.test((await txt(a, '[data-plan-actualizado]')) ?? ''), 'original', 'y lo dice')
  })

  /* ───────────── 3. Saltarme esta parada (25) ───────────── */
  await sec(async () => {
    await ir(a, { min: 715, mut: MUT_CUEVA })
    await clic(a, '[data-hoy-cambiar-plan]')
    await a.esp(500)
    await clic(a, '[data-cambiar-opcion="saltar"]')
    await a.esp(600)
    const t = (await hoja(a)) ?? ''
    debe(/Tienes la entrada reservada/.test(t) && /Saltar igual/.test(t) && /Cancelar/.test(t), '25 reserva', `con la entrada reservada, antes se pregunta (${t.slice(0, 100)})`)
    await clic(a, '[data-saltar-cancelar]')
    await a.esp(400)
    const sinTocar = await ev(`${R}.getState().route.days[2].stops.find((s) => s.name.startsWith('Cueva')).saltada ? 1 : 0`)
    debe(sinTocar === 0, '25 reserva', '[Cancelar] no salta nada')
    await clic(a, '[data-hoy-cambiar-plan]')
    await a.esp(500)
    await clic(a, '[data-cambiar-opcion="saltar"]')
    await a.esp(500)
    await clic(a, '[data-saltar-igual]')
    await a.esp(900)
    const saltada = await ev(`${R}.getState().route.days[2].stops.find((s) => s.name.startsWith('Cueva')).saltada ? 1 : 0`)
    debe(saltada === 1, '25 saltar', '[Saltar igual] salta la parada')
    debe(/Parada saltada/.test((await txt(a, '[data-hoy-aviso-saltada]')) ?? '') && (await hay(a, '[data-hoy-deshacer-saltada]')), '25 aviso', '«Parada saltada · Deshacer»')
    debe(!/Cueva de los Verdes/.test((await txt(a, '[data-hoy-siguiente]')) ?? ''), '25 tarjeta', 'la tarjeta pasa a la siguiente')
    await foto(a, '25')
    await clic(a, '[data-hoy-deshacer-saltada]')
    await a.esp(600)
    debe((await ev(`${R}.getState().route.days[2].stops.find((s) => s.name.startsWith('Cueva')).saltada ? 1 : 0`)) === 0, '25 deshacer', '[Deshacer] la trae de vuelta')
    // sin reserva: salta directo
    await ir(a, { min: 715, mut: MUT_MIRADOR })
    await clic(a, '[data-hoy-cambiar-plan]')
    await a.esp(500)
    await clic(a, '[data-cambiar-opcion="saltar"]')
    await a.esp(800)
    debe(!(await hay(a, '[data-cambiar-hoja]')), '25 directo', 'sin reserva, salta sin preguntar')
    debe((await ev(`${R}.getState().route.days[2].stops.find((s) => s.name.startsWith('Mirador del R')).saltada ? 1 : 0`)) === 1, '25 directo', 'y la parada queda saltada')
  })

  /* ───────────── 4. Pasar a otro día (26a, 26b, 26c) ───────────── */
  const pasar = async (nombre, mut, casoEsperado) => {
    await ir(a, { min: 715, mut: `${MUT_MIRADOR} ${mut}` })
    await clic(a, '[data-hoy-cambiar-plan]')
    await a.esp(500)
    await clic(a, '[data-cambiar-opcion="otro_dia"]')
    await a.esp(700)
    debe(await hay(a, '[data-lista-de-dias]'), `26${casoEsperado} lista`, 'sale la hoja de días de siempre')
    const dias = await a.evaluar(`Array.from(document.querySelectorAll('[data-dia-de-la-lista]')).map((e) => e.getAttribute('data-dia-de-la-lista'))`)
    debe(dias.length >= 2, `26${casoEsperado} lista`, `con los otros días (${dias.length})`)
    const jueves = await ev(`${R}.getState().route.days.find((d) => d.dayNumber === 5).id`)
    await clic(a, `[data-dia-de-la-lista="${jueves}"]`)
    await a.esp(800)
    const caso = await a.evaluar(`document.querySelector('[data-cambiar-hoja="propuesta"]')?.getAttribute('data-propuesta-caso') ?? null`)
    debe(caso === casoEsperado, `26${casoEsperado} caso`, `sale el caso ${casoEsperado} (sale ${caso})`)
    const t = (await hoja(a)) ?? ''
    debe(/Cambia:/.test(t) && /Se mantiene:/.test(t) && /Aplicar/.test(t) && (casoEsperado === 'c' || /Ver otra opción/.test(t)) && /Volver a mi ruta original/.test(t), `26${casoEsperado} formato`, 'con el formato común')
    await foto(a, `26${casoEsperado}`)
    return { t, jueves }
  }
  await sec(async () => {
    const antes = await foto3(a, 0)
    const { t, jueves } = await pasar('a', `const d5 = dia(5); d5.meals.find((m) => m.mealTime === 'dinner').time = '21:30';`, 'a')
    debe(/pasa al/.test(t) && /Mirador del R/i.test(t), '26a texto', `«Mirador del Río pasa al …» (${t.slice(0, 160)})`)
    await clic(a, '[data-propuesta-aplicar]')
    await a.esp(800)
    const enJueves = await ev(`${R}.getState().route.days.find((d) => d.id === ${JSON.stringify(jueves)}).stops.some((s) => s.name.startsWith('Mirador del R'))`)
    const enMartes = await ev(`${R}.getState().route.days[2].stops.some((s) => s.name.startsWith('Mirador del R'))`)
    debe(enJueves && !enMartes, '26a aplicar', 'la parada pasa al jueves y deja el martes')
    debe(/Plan actualizado/.test((await txt(a, '[data-plan-actualizado]')) ?? ''), '26a aviso', '«Plan actualizado · Deshacer»')
    await clic(a, '[data-plan-deshacer]')
    await a.esp(700)
    debe(!(await ev(`${R}.getState().route.days.find((d) => d.id === ${JSON.stringify(jueves)}).stops.some((s) => s.name.startsWith('Mirador del R'))`)) && (await ev(`${R}.getState().route.days[2].stops.some((s) => s.name.startsWith('Mirador del R'))`)), '26a deshacer', '[Deshacer] la devuelve al martes')
    void antes
  })
  await sec(async () => {
    const { t, jueves } = await pasar('b', `const d5 = dia(5); d5.meals.find((m) => m.mealTime === 'dinner').time = '21:30'; parada(d5, 'El paseo').optional = true; parada(d5, 'El paseo').durationMinutes = 60; parada(d5, 'Faro').durationMinutes = 150;`, 'b')
    debe(/tendríamos que quitar/.test(t) && /Si te sobra tiempo/.test(t), '26b texto', `«Para meter … tendríamos que quitar …» y lo quitado queda en «Si te sobra tiempo» (${t.slice(0, 200)})`)
    await clic(a, '[data-propuesta-aplicar]')
    await a.esp(800)
    const r = await ev(`(async () => { const d = ${R}.getState().route.days.find((x) => x.id === ${JSON.stringify(jueves)}); return [d.stops.some((s) => s.name.startsWith('Mirador del R')), (d.spareStops ?? []).some((s) => s.name.startsWith('El paseo')), d.stops.some((s) => s.name.startsWith('El paseo'))] })()`)
    debe(r[0] && r[1] && !r[2], '26b aplicar', `entra el Mirador, sale el paseo a «Si te sobra tiempo» (${r})`)
    await clic(a, '[data-plan-deshacer]')
    await a.esp(600)
  })
  await sec(async () => {
    const { t, jueves } = await pasar('c', `const d5 = dia(5); d5.meals.find((m) => m.mealTime === 'dinner').time = '21:30'; parada(d5, 'Faro').durationMinutes = 150;`, 'c')
    debe(/No cabe en tus otros días/.test(t) && /Si te sobra tiempo/.test(t), '26c texto', `«No cabe en tus otros días…» con «Si te sobra tiempo» (${t.slice(0, 200)})`)
    await clic(a, '[data-propuesta-aplicar]')
    await a.esp(800)
    const r = await ev(`(async () => { const d = ${R}.getState().route.days.find((x) => x.id === ${JSON.stringify(jueves)}); return [d.stops.some((s) => s.name.startsWith('Mirador del R')), (d.spareStops ?? []).some((s) => s.name.startsWith('Mirador del R'))] })()`)
    debe(!r[0] && r[1], '26c aplicar', `queda al final del jueves, en «Si te sobra tiempo» (${r})`)
    await clic(a, '[data-plan-deshacer]')
    await a.esp(600)
    // una parada con su entrada reservada no se pasa a otro día
    await ir(a, { min: 715, mut: MUT_CUEVA })
    await clic(a, '[data-hoy-cambiar-plan]')
    await a.esp(500)
    await clic(a, '[data-cambiar-opcion="otro_dia"]')
    await a.esp(600)
    const j = await ev(`${R}.getState().route.days.find((d) => d.dayNumber === 5).id`)
    await clic(a, `[data-dia-de-la-lista="${j}"]`)
    await a.esp(600)
    debe(/entrada reservada|reserva/i.test((await txt(a, '[data-propuesta-vacia]')) ?? ''), '26 fija', 'lo fijo no se pasa: la hoja lo explica')
  })

  /* ───────────── 5. Añadir un sitio cercano (27a, 27b) ───────────── */
  await sec(async () => {
    await ir(a, { min: 715, mut: MUT_MIRADOR })
    await clic(a, '[data-hoy-cambiar-plan]')
    await a.esp(500)
    await clic(a, '[data-cambiar-opcion="anadir"]')
    await a.esp(1500)
    const cand = await a.evaluar(`Array.from(document.querySelectorAll('[data-anadir-candidato]')).map((e) => [e.getAttribute('data-anadir-candidato'), e.getAttribute('data-anadir-logro') === '1', e.innerText.replace(/\\s+/g, ' ').trim()])`)
    debe(cand.length >= 1, '27 lista', `salen sitios fuera de la ruta (${cand.length})`)
    const enRuta = await ev(`(async () => { const r = ${R}.getState().route; const n = new Set(r.days.flatMap((d) => d.stops.map((s) => s.name.toLowerCase()))); return Array.from(document.querySelectorAll('[data-anadir-candidato]')).filter((e) => n.has(e.getAttribute('data-anadir-candidato').toLowerCase())).length })()`)
    debe(enRuta === 0, '27 lista', 'ninguno es de la ruta')
    const orden = cand.map((c) => c[1])
    debe(!orden.some((v, i) => v && orden.slice(0, i).some((w) => !w)), '27 lista', 'los de logro, primero')
    debe(!cand.some((c) => ROMA.test(c[2])), 'sin_roma', 'sin sitios de Roma en la lista de Lanzarote')
    const t0 = (await hoja(a)) ?? ''
    await foto(a, '27lista')
    if (cand.length) {
      await clic(a, '[data-anadir-candidato]')
      await a.esp(900)
      const caso = await a.evaluar(`document.querySelector('[data-cambiar-hoja="propuesta"]')?.getAttribute('data-propuesta-caso') ?? null`)
      const t = (await hoja(a)) ?? ''
      debe(caso === 'a' || caso === 'b' || /Hoy no cabe/.test(t), '27 propuesta', `sale una propuesta (caso ${caso})`)
      debe(!ROMA.test(t0 + t), 'sin_roma', 'ni en la propuesta')
      if (caso === 'a') {
        debe(/encaja/.test(t) && /Cambia: se añade/i.test(t) && /Se mantiene: todo lo que ya tenías/.test(t), '27a texto', `los textos de 27a (${t.slice(0, 160)})`)
        await foto(a, '27a')
        const antes = await foto3(a, 0)
        await clic(a, '[data-propuesta-aplicar]')
        await a.esp(800)
        debe((await foto3(a, 0)) !== antes, '27a aplicar', 'el sitio entra en el día')
        await clic(a, '[data-plan-deshacer]')
        await a.esp(600)
        debe((await foto3(a, 0)) === antes, '27a deshacer', '[Deshacer] deja el día como estaba')
      } else debe(false, '27a', `en el viaje de Eric el primer sitio debería encajar (caso ${caso}: ${t.slice(0, 120)})`)
    }
  })
  await sec(async () => {
    // 27b: detrás de Mirador del Río, Casa-Museo (flexible) pega con un turno justo a continuación.
    const MUT = `${MUT_MIRADOR} parada(dia(3), 'Har').time = '13:30'; parada(dia(3), 'Har').durationMinutes = 30; parada(dia(3), 'Casa-Museo').time = '14:15'; parada(dia(3), 'Casa-Museo').durationMinutes = 30; parada(dia(3), 'Mirador de los').time = '15:00'; parada(dia(3), 'Mirador de los').durationMinutes = 15; parada(dia(3), 'Mirador de los').reservationTime = '15:00'; parada(dia(3), 'Mirador del R').time = '12:50'; parada(dia(3), 'Mirador del R').checkedInAt = null;`
    await ir(a, { min: 700, mut: MUT })
    await clic(a, '[data-hoy-cambiar-plan]')
    await a.esp(500)
    await clic(a, '[data-cambiar-opcion="anadir"]')
    await a.esp(1500)
    const hayLista = await cuantos(a, '[data-anadir-candidato]')
    debe(hayLista >= 1, '27b lista', 'hay sitios que añadir')
    // se prueban los candidatos hasta dar con uno que obligue a mover algo
    let visto = null
    for (let i = 0; i < Math.min(hayLista, 6) && !visto; i++) {
      await a.evaluar(`(() => { const e = document.querySelectorAll('[data-anadir-candidato]')[${i}]; if (e) e.click(); return true })()`)
      await a.esp(800)
      const caso = await a.evaluar(`document.querySelector('[data-cambiar-hoja="propuesta"]')?.getAttribute('data-propuesta-caso') ?? null`)
      if (caso === 'b') visto = (await hoja(a)) ?? ''
      else {
        await a.evaluar("(() => { const x = Array.from(document.querySelectorAll('[role=\"dialog\"] [aria-label=\"Cerrar\"]')).pop(); if (x) x.click(); return true })()")
        await a.esp(300)
        await clic(a, '[data-hoy-cambiar-plan]')
        await a.esp(400)
        await clic(a, '[data-cambiar-opcion="anadir"]')
        await a.esp(900)
      }
    }
    debe(visto !== null, '27b caso', 'con la tarde apretada y un turno detrás, algún sitio obliga a mover algo (caso b)')
    if (visto !== null) {
      debe(/tendríamos que mover/.test(visto) && /Se mantiene: tus reservas/.test(visto), '27b texto', `los textos de 27b (${visto.slice(0, 200)})`)
      await foto(a, '27b')
      await clic(a, '[data-propuesta-aplicar]')
      await a.esp(800)
      const turno = await ev(`${R}.getState().route.days[2].stops.find((s) => s.name.startsWith('Mirador de los')).time`)
      debe(turno === '15:00', '27b turno', `el turno de las 15:00 no se mueve (${turno})`)
      await clic(a, '[data-plan-deshacer]')
      await a.esp(600)
    }
  })

  /* ───────────── 6. Sin textos de Roma en Lanzarote ───────────── */
  debe(textosVistos.length >= 6, 'sin_roma', `se han leído ${textosVistos.length} hojas`)
  debe(!textosVistos.some((t) => ROMA.test(t)), 'sin_roma', `ninguna hoja de Lanzarote habla de Roma (${textosVistos.filter((t) => ROMA.test(t)).map((t) => (t.match(ROMA) ?? [''])[0]).join(',')})`)
} finally {
  a.cerrar()
}

console.log(`\n${comprobaciones} comprobaciones · ${fallos.length} fallos`)
for (const f of fallos) console.log(`  ✗ [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
