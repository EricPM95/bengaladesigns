// V80 (apartados 3b y 4) · SIN «¿QUÉ HAGO AHORA?» EN UN DÍA DE EXCURSIÓN, LA PIEZA «IDEAS Y PENDIENTES» Y LA EXCURSIÓN CANCELADA (Design «Día de excursión en HOY», EX7, EX8, EX8b y el «AL VOLVER» de EX4).
//   APP_URL=http://localhost:5173 API_URL=http://localhost:8787 node scripts/destino/_conCola.mjs node scripts/destino/pruebaV80_b.mjs [pura|roma|lanza]      (sin argumento: las tres partes)
// Parte 1 (pura, SIN navegador): `excursionMove.ts` (`cambioParaLaExcursionCancelada`, `intercambioDeExcursion` con el día de excursión concreto) y `excursionCancelada.ts` (la fecha guardada).
// Parte 2 (Roma, Pompeya ORGANIZADA) y parte 3 (Lanzarote, La Graciosa POR TU CUENTA; exige la API normal): un Chrome de prueba cada una, por la cola. No toca el Supabase de producción (cuentas=off, sin sesión).
//   · el día de excursión lleva el enlace «¿Se ha cancelado la excursión?» y NUNCA «¿Qué hago ahora?» (ni normal, ni cancelada, ni con sitios metidos con [+ A hoy]);
//   · al pulsarlo: tarjeta gris «EXCURSIÓN CANCELADA · Hoy no hay excursión: tienes el día libre», aviso de abajo con [Deshacer], «Tu día libre en …» (pendientes con [+ A hoy], ideas reales fuera del viaje, [Ver en Explorar]) y «Cerca de ti»;
//   · [Deshacer] vuelve a la excursión; la cancelación es de ese día (otro día, no); [+ A hoy] mete el pendiente en el día;
//   · Lanzarote (por tu cuenta): [Hacer La Graciosa otro día] justo debajo de la tarjeta, hoja con el título de cada día, [Cambiar los días] intercambia y [Deshacer] devuelve; [Dejarlo como está] no cambia nada; sin día con el que
//     cambiarla (es el último día) el botón no sale; en Roma (organizada) no sale;
//   · la pieza `IdeasYPendientesHoy` «al volver» (sin título): la frase, los pendientes sin [+ A hoy], las ideas y [Ver en Explorar].
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { build } from 'esbuild'
import { abrirApp } from './_enLaApp.mjs'

const QUE = process.argv[2] ?? 'todo'
const fallos = []
let comprobaciones = 0
const debe = (cond, regla, texto) => {
  comprobaciones++
  console.log(cond ? '  ok' : '  MAL', regla, String(texto).slice(0, 220))
  if (!cond) fallos.push({ regla, texto })
}
const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b)

/* ═══ 1. La parte pura ═══ */
async function partePura() {
  console.log('1. Funciones puras (sin navegador)')
  const salida = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'v80pura-')), 'puras.mjs')
  const r = await build({
    stdin: { contents: "export * from './src/lib/excursionMove.ts'; export * from './src/lib/excursionCancelada.ts'", resolveDir: process.cwd(), loader: 'ts' },
    bundle: true, write: false, format: 'esm', platform: 'node', logLevel: 'error', define: { 'import.meta.env': '{}' },
  })
  fs.writeFileSync(salida, r.outputFiles[0].text)
  const m = await import(pathToFileURL(salida).href)
  const dia = (id, n, c = {}) => ({ id, dayNumber: n, stops: [], meals: [], title: `Día ${n}`, ...c })
  const exc = (id, n) => dia(id, n, { dayType: 'excursion', title: 'La Graciosa (excursión)', curatedTitle: 'La Graciosa (excursión)' })
  const ruta = (dias) => ({ id: 'r', destination: 'Lanzarote', answers: { dateRange: { start: '2026-11-08', end: '2026-11-13' } }, days: dias })
  const base = ruta([dia('d1', 1), dia('d2', 2), exc('e3', 3), dia('d4', 4), dia('d5', 5), dia('ret', 6, { isReturnLeg: true })])
  const c1 = m.cambioParaLaExcursionCancelada(base, base.days[2])
  debe(c1 && c1.dia.id === 'd4', 'cambio · el día es el siguiente que se puede mover', c1?.dia?.id)
  debe(c1 && igual(c1.mov.orden, ['d1', 'd2', 'd4', 'e3', 'd5', 'ret']), 'cambio · la excursión pasa a ese día y lo suyo pasa a hoy (intercambio, el resto no se mueve)', c1?.mov?.orden)
  debe(c1 && c1.mov.filas.length === 2 && c1.mov.filas[0].principal && c1.mov.filas[0].dayNumber === 4 && c1.mov.filas[1].dayNumber === 3 && c1.mov.filas[1].antesNumero === 4, 'cambio · dos filas: la excursión al día 4 y el otro día al 3', c1?.mov?.filas)
  const c2 = m.cambioParaLaExcursionCancelada(base, base.days[2], (d) => d.id === 'd4')
  debe(c2 && c2.dia.id === 'd5', 'cambio · un día fijado por una reserva no se mueve: se salta al siguiente', c2?.dia?.id)
  debe(m.cambioParaLaExcursionCancelada(base, base.days[2], () => true) === null, 'cambio · con todos los días fijados, no hay cambio', '')
  const ultimo = ruta([dia('d1', 1), dia('d2', 2), dia('d3', 3), dia('d4', 4), exc('e5', 5), dia('ret', 6, { isReturnLeg: true })])
  debe(m.cambioParaLaExcursionCancelada(ultimo, ultimo.days[4]) === null, 'cambio · la excursión es el último día: no hay con qué cambiarla (el botón no sale)', '')
  const dos = ruta([dia('d1', 1), exc('e2', 2), dia('d3', 3), exc('e4', 4), dia('d5', 5), dia('ret', 6, { isReturnLeg: true })])
  const c3 = m.cambioParaLaExcursionCancelada(dos, dos.days[3])
  debe(c3 && c3.dia.id === 'd5' && igual(c3.mov.orden, ['d1', 'e2', 'd3', 'd5', 'e4', 'ret']) && c3.mov.diaDeExcursionId === 'e4', 'cambio · con dos excursiones se cambia la de HOY (la elegida), no la primera', c3?.mov?.orden)
  const sinDias = ruta([dia('d1', 1), dia('d2', 2), exc('e3', 3), exc('e4', 4), dia('ret', 5, { isReturnLeg: true })])
  debe(m.cambioParaLaExcursionCancelada(sinDias, sinDias.days[2]) === null, 'cambio · el único día de después es otra excursión: no hay con qué cambiarla', '')
  const llegada = ruta([dia('d1', 1), exc('e2', 2), dia('d3', 3, { arrivalDay: { x: 1 } }), dia('ret', 4, { isReturnLeg: true })])
  debe(m.cambioParaLaExcursionCancelada(llegada, llegada.days[1]) === null, 'cambio · el día de llegada nunca es el destino del cambio', '')
  const viejo = m.intercambioDeExcursion(base, 'd4')
  debe(viejo && viejo.diaDeExcursionId === 'e3' && igual(viejo.orden, ['d1', 'd2', 'd4', 'e3', 'd5', 'ret']), 'intercambio · la forma de siempre (V69) sigue igual sin el día concreto', viejo?.orden)
  // La fecha guardada: el día de excursión cancelado en una fecha; en otra fecha ya no cuenta.
  debe(m.leerExcursionCancelada('r', 'e3') === null, 'guardado · sin nada guardado no está cancelada', '')
  m.ponerExcursionCancelada('r', 'e3', '2026-11-10')
  debe(m.leerExcursionCancelada('r', 'e3') === '2026-11-10', 'guardado · guarda la fecha de la cancelación', m.leerExcursionCancelada('r', 'e3'))
  debe(m.leerExcursionCancelada('r', 'otro') === null && m.leerExcursionCancelada('otra', 'e3') === null, 'guardado · es de ese viaje y de ese día', '')
  m.ponerExcursionCancelada('r', 'e3', null)
  debe(m.leerExcursionCancelada('r', 'e3') === null, 'guardado · [Deshacer] lo borra', '')
}

/* ═══ 2 y 3. Con la app ═══ */
const R = "(await import('/src/store/useRouteStore.ts')).useRouteStore"
const ANTES = fs.readFileSync('scripts/destino/pruebaV43.mjs', 'utf8').match(/const ANTES = `([\s\S]*?)`/)[1]

async function conApp(lanza, fn) {
  const a = await abrirApp(process.env.APP_URL ?? 'http://localhost:5173', { ruta: '/?cuentas=off&logros=off&apertura=0&hoy2=on&version=pago', antes: ANTES, ancho: 390, alto: 844 })
  const ev = (e) => a.evaluar(`(async () => (${e}))()`)
  const clic = (sel) => a.evaluar(`(() => { const b = document.querySelector(${JSON.stringify(sel)}); if (!b) return false; b.click(); return true })()`)
  const hay = (sel) => a.evaluar(`Boolean(document.querySelector(${JSON.stringify(sel)}))`)
  const n = (sel) => a.evaluar(`document.querySelectorAll(${JSON.stringify(sel)}).length`)
  const txt = (sel) => a.evaluar(`document.querySelector(${JSON.stringify(sel)})?.innerText.replace(/\\s+/g, ' ').trim() ?? null`)
  const body = () => a.evaluar("document.body.innerText.replace(/\\s+/g, ' ')")
  const clicTexto = (t) => a.evaluar(`(() => { const b = [...document.querySelectorAll('button')].find((x) => (x.innerText || '').replace(/\\s+/g, ' ').trim() === ${JSON.stringify(t)}); if (!b) return false; b.click(); return true })()`)
  try {
    for (let i = 0; i < 80 && !(await a.evaluar(`typeof window.${lanza ? '__rutaLanzarote' : '__rutaPrueba'} === 'function'`).catch(() => false)); i++) await a.esp(500)
    await a.evaluar(lanza ? "window.__rutaLanzarote({ zona: 'costa_teguise', coche: 'alquiler', hoy: '2026-11-08' }).then(() => true)" : 'window.__rutaPrueba().then(() => true)')
    for (let i = 0; i < 300 && !(await ev(`${R}.getState().route ? true : false`).catch(() => false)); i++) await a.esp(1000)
    await a.esp(2500)
    for (let i = 0; i < 4; i++) {
      const h = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale|Cerrar)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
      if (!h) break
      await a.esp(600)
    }
    await a.evaluar(`(async () => { window.__base = JSON.stringify(${R}.getState().route); return true })()`)
    // El día de excursión de HOY: Lanzarote, el día 4 (La Graciosa, por tu cuenta); Roma, el día 2 convertido en Pompeya (organizada), sin paradas. En el día anterior, una parada hecha y otra saltada (los pendientes). `orden`: el id de
    // los días en otro orden (para la excursión en el último día).
    const montar = async ({ hoy, ultimoDia = false }) => {
      await a.evaluar(`(async () => {
        const st = ${R}
        const r = JSON.parse(window.__base)
        if (!${lanza}) { const d = r.days.find((x) => x.dayNumber === 2); d.dayType = 'excursion'; d.title = 'Pompeya (excursión)'; d.curatedTitle = 'Pompeya (excursión)'; d.selectedExcursionId = 'pompeya_sorrento'; d.stops = [] }
        if (${ultimoDia}) { const ciudad = r.days.filter((x) => !x.isReturnLeg); const e = ciudad.find((x) => x.dayType === 'excursion'); const resto = ciudad.filter((x) => x !== e); r.days = [...resto, e, ...r.days.filter((x) => x.isReturnLeg)]; r.days.forEach((x, i) => { x.dayNumber = i + 1 }) }
        const ayer = r.days.find((x) => x.dayNumber === ${lanza ? 3 : 1})
        const ps = ayer.stops.filter((x) => !x.isArrival); ps[0].checkedInAt = '2026-01-01T09:00:00.000Z'; ps[1].saltada = true
        const seg = (await import('/src/lib/tuAlojamiento.ts')).estanciasDelViaje(r)[0]
        st.setState({ route: r, reservations: [], screen: 'route', accommodationSelections: seg ? { [seg.segmentDayId]: { name: ${JSON.stringify(lanza ? 'The Colors House' : 'Hotel Quirinale')}, precio: null } } : {} })
        st.getState().setDevSimulatedTodayIso('${hoy}')
        try { Object.keys(localStorage).filter((k) => k.startsWith('trazo:hoy') || k.startsWith('jutrip:')).forEach((k) => localStorage.removeItem(k)) } catch {}
        window.__horaFalsa = 15 * 60; window.__pos = null; window.__perm = 'denied'
        st.getState().setActiveDayId(null); st.getState().setMode('explore')
        return true })()`)
      await a.esp(700)
      await ev(`${R}.getState().setMode('today')`)
      await a.esp(3500)
    }
    await fn({ a, ev, clic, hay, n, txt, body, clicTexto, montar })
  } finally {
    a.cerrar()
  }
}

const sinQueHago = async ({ hay, body }, donde) => {
  debe(!(await hay('[data-hoy-que-hago-ahora]')) && !/¿Qué hago ahora\?/.test(await body()), `sin «¿Qué hago ahora?» · ${donde}`, '')
}

async function pruebaCancelada({ a, ev, clic, hay, n, txt, body, montar, clicTexto }, lanza) {
  const hoy = lanza ? '2026-11-11' : '2026-10-18'
  const otroHoy = lanza ? '2026-11-12' : '2026-10-19'
  const destino = lanza ? 'Lanzarote' : 'Roma'
  const nombre = lanza ? 'La Graciosa' : 'Pompeya'
  await montar({ hoy })
  // — El día de excursión, sin cancelar —
  debe(await hay('[data-hoy-excursion-cancelar]'), 'enlace · el día de excursión lleva «¿Se ha cancelado la excursión?»', await txt('[data-hoy-excursion-cancelar]'))
  debe(!(await hay('[data-hoy-excursion-cancelada]')), 'enlace · sin pulsarlo no está cancelada', '')
  await sinQueHago({ hay, body }, 'el día de excursión')
  // — Cancelarla —
  await clic('[data-hoy-excursion-cancelar]')
  await a.esp(2000)
  const t = await body()
  debe(await hay('[data-hoy-excursion-cancelada]') && /EXCURSIÓN CANCELADA/.test(t) && /Hoy no hay excursión: tienes el día libre/.test(t), 'cancelada · la tarjeta gris «EXCURSIÓN CANCELADA · Hoy no hay excursión: tienes el día libre»', (await txt('[data-hoy-excursion-cancelada]')) ?? '')
  debe(new RegExp(nombre).test((await txt('[data-hoy-excursion-cancelada]')) ?? ''), `cancelada · la tarjeta dice el nombre real de la excursión (${nombre})`, '')
  debe(!(await hay('[data-hoy-excursion-cancelar]')), 'cancelada · el enlace ya no sale', '')
  const aviso = await a.evaluar("(() => { const b = [...document.querySelectorAll('button')].find((x) => /^Deshacer$/.test((x.innerText || '').trim())); const c = b?.parentElement; return c ? c.innerText.replace(/\\s+/g, ' ') : null })()")
  debe(aviso && /Excursión cancelada/.test(aviso), 'cancelada · el aviso de abajo «Excursión cancelada» con [Deshacer]', aviso)
  debe(/Tu día libre en/.test((await txt('[data-ideas-titulo]')) ?? '') && (await txt('[data-ideas-titulo]')) === `Tu día libre en ${destino}`, `cancelada · «Tu día libre en ${destino}»`, await txt('[data-ideas-titulo]'))
  await sinQueHago({ hay, body }, 'el día libre de la cancelada')
  debe((await n('[data-hoy-pendiente]')) >= 1 && (await n('[data-hoy-pendiente-a-hoy]')) === (await n('[data-hoy-pendiente]')) && (await n('[data-hoy-pendiente-pasar]')) >= 1, 'pendientes · el bloque de siempre, con [Otro día] y [+ A hoy] en cada fila', `${await n('[data-hoy-pendiente]')} filas · ${await n('[data-hoy-pendiente-a-hoy]')} [+ A hoy] · ${await n('[data-hoy-pendiente-pasar]')} [Otro día]`)
  debe((await txt('[data-hoy-pendientes-estado], [data-hoy-pendientes]')) !== null && (await a.evaluar("document.querySelector('[data-hoy-pendientes]')?.getAttribute('data-hoy-pendientes-estado')")) === 'abierta', 'pendientes · salen abiertos', '')
  const ideas = await a.evaluar("[...document.querySelectorAll('[data-hoy-idea]')].map((e) => e.getAttribute('data-hoy-idea'))")
  debe(ideas.length >= 1 && ideas.length <= 4, 'ideas · de 1 a 4 sitios reales cerca (a las 15:00 hay abiertos)', ideas.join(' | '))
  const repetidas = await a.evaluar(`(async () => { const m = await import('/src/lib/hoyCambiarPlan.ts'); const r = ${R}.getState().route; const nombres = r.days.flatMap((d) => [...d.stops, ...(d.spareStops ?? [])]).filter((s) => !s.isBreak && !s.isArrival && !s.passThrough).map((s) => s.name); return ${JSON.stringify(ideas)}.filter((i) => nombres.some((s) => m.mismoSitio(s, i))) })()`)
  debe(repetidas.length === 0, 'ideas · ninguna está ya en el viaje (son de EXPLORAR, no repiten la ruta ni los pendientes)', repetidas.join(' | '))
  debe(ideas.every((i) => i && i.length > 2), 'ideas · cada una con su nombre real (nada inventado)', '')
  debe(await hay('[data-hoy-ideas-explorar]'), 'ideas · [Ver en Explorar]', '')
  debe((await a.evaluar("document.querySelectorAll('[data-hoy-idea] img').length")) >= 1 || ideas.length >= 1, 'ideas · con su foto pequeña', '')
  debe((await hay('[data-cerca-de-ti]')) && (await a.evaluar("document.querySelector('[data-cerca-de-ti]')?.getAttribute('data-cerca-modo')")) === (lanza ? 'coche' : 'pie'), `«Cerca de ti» · sale como en un día normal (${lanza ? 'gasolineras, aparcar, comer' : 'baños, fuentes, comer'})`, '')
  debe(/Reorganizar/i.test(t) === false, 'cancelada · nada se reorganiza solo', '')
  // — [Deshacer] (con el aviso recién salido) y cancelar otra vez —
  const desh = await a.evaluar("(() => { const b = document.querySelector('[data-aviso-de-abajo-accion]'); if (!b) return false; b.click(); return true })()")
  await a.esp(1500)
  debe(desh && !(await hay('[data-hoy-excursion-cancelada]')) && (await hay('[data-hoy-excursion-cancelar]')), '[Deshacer] · la excursión vuelve (la tarjeta de siempre y su enlace)', '')
  await sinQueHago({ hay, body }, 'la excursión tras [Deshacer]')
  await clic('[data-hoy-excursion-cancelar]')
  await a.esp(2000)
  debe(await hay('[data-hoy-excursion-cancelada]'), 'cancelada · se puede volver a cancelar', '')
  // [Ver en Explorar] abre EXPLORAR con lo de cerca.
  await clic('[data-hoy-ideas-explorar]')
  await a.esp(900)
  debe((await ev(`${R}.getState().mode`)) === 'explore', 'ideas · [Ver en Explorar] abre EXPLORAR', await ev(`${R}.getState().mode`))
  await ev(`${R}.getState().setMode('today')`)
  await a.esp(2500)
  debe(await hay('[data-hoy-excursion-cancelada]'), 'cancelada · al volver a HOY sigue cancelada (guardado en el móvil)', '')
  // — El botón de cambiar de día: solo por tu cuenta —
  if (!lanza) debe(!(await hay('[data-hoy-excursion-otro-dia]')), 'otro día · en una excursión ORGANIZADA no sale [Hacer … otro día]', '')
  // — Meter un pendiente en el día —
  const antes = await ev(`${R}.getState().route.days.find((d) => d.dayNumber === ${lanza ? 4 : 2}).stops.length`)
  const pend0 = await n('[data-hoy-pendiente]')
  await clic('[data-hoy-pendiente-a-hoy]')
  await a.esp(1800)
  const despues = await ev(`${R}.getState().route.days.find((d) => d.dayNumber === ${lanza ? 4 : 2}).stops.length`)
  debe(despues === antes + 1, '[+ A hoy] · el pendiente entra en el día de hoy', `${antes} → ${despues}`)
  debe((await n('[data-hoy-pendiente]')) === pend0 - 1 || pend0 === 1, '[+ A hoy] · sale de la lista de pendientes', `${pend0} → ${await n('[data-hoy-pendiente]')}`)
  await sinQueHago({ hay, body }, 'el día libre con un sitio metido con [+ A hoy] (aunque ya tenga paradas)')
  debe(/Tu día/.test(await body()), '[+ A hoy] · el sitio sale en «Tu día»', '')
  // — La cancelación es de ESE día —
  await ev(`${R}.getState().setDevSimulatedTodayIso('${otroHoy}')`)
  await a.esp(2500)
  debe(!(await hay('[data-hoy-excursion-cancelada]')), 'por día · otro día no está cancelado', '')
  await ev(`${R}.getState().setDevSimulatedTodayIso('${hoy}')`)
  await a.esp(2500)
  debe(await hay('[data-hoy-excursion-cancelada]'), 'por día · el día cancelado sigue cancelado al volver a él', '')
}

async function pruebaDeLaPieza({ a, ev, hay, n, txt, body }, lanza) {
  // La pieza «al volver» (sin título) montada sola sobre HOY, con el día de excursión de hoy: la frase, los pendientes (sin [+ A hoy]), las ideas y [Ver en Explorar].
  await a.evaluar(`(async () => {
    const fuente = await (await fetch('/src/main.tsx')).text(); const dep = (n) => new RegExp('from *"([^"]*' + n + '[.]js[^"]*)"').exec(fuente)?.[1]; const rd = await import(dep('react-dom_client')); const createRoot = rd.createRoot ?? rd.default.createRoot; const rc = await import(dep('react')); const React = rc.default ?? rc
    const { IdeasYPendientesHoy } = await import('/src/components/route/hoy/v2/IdeasYPendientesHoy.tsx')
    const r = ${R}.getState().route; const dia = r.days.find((d) => d.dayNumber === ${lanza ? 4 : 2})
    const div = document.createElement('div'); div.id = 'v80-pieza'; div.style.cssText = 'position:fixed;inset:0;z-index:9999;overflow:auto;background:#F3EBDA;padding:16px'; document.body.appendChild(div)
    window.__v80raiz = createRoot(div)
    window.__v80raiz.render(React.createElement(IdeasYPendientesHoy, { route: r, day: dia, dateIso: '${lanza ? '2026-11-11' : '2026-10-18'}', desde: null, enCoche: ${lanza}, ahoraMin: 15 * 60 }))
    return true })()`)
  await a.esp(3000)
  const t = (await txt('#v80-pieza')) ?? ''
  debe(/¿Te queda tiempo y quieres seguir visitando\? Aquí tienes ideas cerca de ti\./.test(t), 'al volver · arriba la frase «¿Te queda tiempo y quieres seguir visitando? Aquí tienes ideas cerca de ti.»', t.slice(0, 120))
  debe(!(await hay('#v80-pieza [data-ideas-titulo]')), 'al volver · sin título («Tu día libre…» es solo de la cancelada)', '')
  debe((await n('#v80-pieza [data-hoy-pendiente]')) >= 1, 'al volver · tus Lugares pendientes', String(await n('#v80-pieza [data-hoy-pendiente]')))
  debe((await n('#v80-pieza [data-hoy-pendiente-a-hoy]')) === 0, 'al volver · los pendientes no llevan [+ A hoy] (el día de excursión ya se hizo)', '')
  debe((await n('#v80-pieza [data-hoy-idea]')) >= 1, 'al volver · ideas cerca', String(await n('#v80-pieza [data-hoy-idea]')))
  debe(await hay('#v80-pieza [data-hoy-ideas-explorar]'), 'al volver · [Ver en Explorar]', '')
  debe(!(await hay('#v80-pieza [data-hoy-que-hago-ahora]')) && !/¿Qué hago ahora\?/.test(t), 'al volver · en lugar de «¿Qué hago ahora?», nunca con él', '')
  await a.evaluar("(() => { window.__v80raiz.unmount(); document.getElementById('v80-pieza')?.remove(); return true })()")
}

async function parteRoma() {
  console.log('2. Roma (Pompeya, organizada)')
  await conApp(false, async (h) => {
    await pruebaCancelada(h, false)
    await h.montar({ hoy: '2026-10-18' })
    await pruebaDeLaPieza(h, false)
  })
}

async function parteLanza() {
  console.log('3. Lanzarote (La Graciosa, por tu cuenta)')
  await conApp(true, async (h) => {
    const { a, ev, clic, hay, n, txt, body, montar, clicTexto } = h
    await pruebaCancelada(h, true)
    // — [Hacer La Graciosa otro día] —
    const ordenAntes = await ev(`${R}.getState().route.days.map((d) => d.id)`)
    await montar({ hoy: '2026-11-11' })
    await clic('[data-hoy-excursion-cancelar]')
    await a.esp(2000)
    debe(await hay('[data-hoy-excursion-otro-dia]'), 'otro día · por tu cuenta sale [Hacer La Graciosa otro día]', '')
    debe((await txt('[data-hoy-excursion-otro-dia]')) === 'Hacer La Graciosa otro día', 'otro día · el botón dice «Hacer La Graciosa otro día»', await txt('[data-hoy-excursion-otro-dia]'))
    const orden = await a.evaluar("(() => { const t = document.querySelector('[data-hoy-excursion-cancelada]'), b = document.querySelector('[data-hoy-excursion-otro-dia]'), i = document.querySelector('[data-hoy-ideas-pendientes]'); const p = (x, y) => Boolean(x.compareDocumentPosition(y) & Node.DOCUMENT_POSITION_FOLLOWING); return p(t, b) && p(b, i) })()")
    debe(orden === true, 'otro día · va justo debajo de «Excursión cancelada», antes de los pendientes', '')
    await clic('[data-hoy-excursion-otro-dia]')
    await a.esp(1500)
    const hoja = (await txt('[data-hoja-mover-dias]')) ?? ''
    const sig = await ev(`(async () => { const r = ${R}.getState().route; const e = r.days.find((d) => d.dayNumber === 4); const o = r.days.find((d) => d.dayNumber === 5); const m = await import('/src/lib/tituloDelDia.ts'); return { titulo: m.nombreDelDiaYaCargado(r, o)?.titulo, paradas: o.stops.filter((s) => !s.isArrival).map((s) => s.name) } })()`)
    debe(/^Hacer La Graciosa otro día/.test(hoja), 'hoja · el título «Hacer La Graciosa otro día»', hoja.slice(0, 80))
    debe(/Te proponemos hacer La Graciosa el jueves 12 y hoy lo que tenías ese día\./.test(hoja), 'hoja · «Te proponemos hacer La Graciosa el jueves 12 y hoy lo que tenías ese día.»', hoja.slice(0, 200))
    debe(!/Hoy no hay barco/.test(hoja) && !/Recomendado/.test(hoja), 'hoja · sin «Hoy no hay barco» (no se supone el motivo) ni «Recomendado»', '')
    debe((await n('[data-propuesta-tarjetas="2"] > *')) === 2 || (await hay('[data-propuesta-tarjetas="2"]')), 'hoja · una tarjeta por día (2)', '')
    const nombres = await a.evaluar("[...document.querySelectorAll('[data-hoja-mover-dias] [data-propuesta-tarjetas] > *')].map((e) => e.innerText.replace(/\\s+/g, ' ').trim())")
    debe(nombres.length === 2 && /La Graciosa/.test(nombres[0]) && /Pasa al jueves 12/.test(nombres[0]), 'hoja · la excursión pasa al jueves 12', nombres[0])
    debe(nombres.length === 2 && /Pasa a hoy, miércoles 11/.test(nombres[1]), 'hoja · el otro día pasa a hoy, miércoles 11', nombres[1])
    debe(nombres.length === 2 && nombres[1].includes(sig.titulo) && !sig.paradas.some((p) => p.length > 8 && nombres[1].includes(p) && p !== sig.titulo), `hoja · el nombre del otro día es su título de DÍAS («${sig.titulo}», el mismo que le da la pantalla DÍAS), no la lista de sus paradas`, nombres[1])
    debe((await n('[data-hoja-mover-dias] [data-cuadrado-fecha], [data-hoja-mover-dias] [data-propuesta-cuadrado]')) >= 0 && /JUE\s*12/.test(nombres[0]) && /MIÉ\s*11/.test(nombres[1]), 'hoja · cada tarjeta con su cuadrado de fecha (JUE 12 y MIÉ 11)', `${nombres[0]} || ${nombres[1]}`)
    debe((await txt('[data-mover-dias-solo]')) === 'Dejarlo como está' && (await txt('[data-mover-dias-cambiar]')) === 'Cambiar los días', 'hoja · [Cambiar los días] y [Dejarlo como está] lado a lado', '')
    // [Dejarlo como está]: no cambia nada.
    await clic('[data-mover-dias-solo]')
    await a.esp(900)
    debe(!(await hay('[data-hoja-mover-dias]')) && igual(await ev(`${R}.getState().route.days.map((d) => d.id)`), ordenAntes), '[Dejarlo como está] · cierra la hoja y los días no cambian', '')
    // [Cambiar los días]: se intercambian y [Deshacer] los devuelve.
    const reservasAntes = await ev(`${R}.getState().reservations.length`)
    await clic('[data-hoy-excursion-otro-dia]')
    await a.esp(1200)
    await clic('[data-mover-dias-cambiar]')
    await a.esp(2500)
    const nuevo = await ev(`${R}.getState().route.days.map((d) => d.id + ':' + d.dayNumber)`)
    const esperado = ordenAntes.map((id, i) => `${id}:${i + 1}`)
    const intercambiado = [...esperado]
    ;[intercambiado[3], intercambiado[4]] = [`${ordenAntes[4]}:4`, `${ordenAntes[3]}:5`]
    debe(igual(nuevo, intercambiado), '[Cambiar los días] · la excursión pasa al día 5 y lo del día 5 pasa al 4 (hoy); el resto no se mueve', nuevo.join(' '))
    debe((await ev(`${R}.getState().reservations.length`)) === reservasAntes, 'no se borra nada · las reservas siguen como estaban', '')
    debe(!(await hay('[data-hoy-excursion-cancelada]')) && !(await hay('[data-hoy-excursion-cancelar]')), 'tras cambiar · hoy es el día normal que tocaba (ya no es de excursión ni está cancelada)', '')
    const avisoDia = await a.evaluar("(() => { const b = [...document.querySelectorAll('button')].find((x) => /^Deshacer$/.test((x.innerText || '').trim())); return b?.parentElement?.innerText.replace(/\\s+/g, ' ') ?? null })()")
    debe(avisoDia && /La Graciosa, pasada al jueves 12/.test(avisoDia), '[Deshacer] · el aviso de abajo dice lo que ha pasado', avisoDia)
    await a.evaluar("(() => { const b = document.querySelector('[data-aviso-de-abajo-accion]'); if (b) b.click(); return true })()")
    await a.esp(2500)
    debe(igual(await ev(`${R}.getState().route.days.map((d) => d.id + ':' + d.dayNumber)`), esperado), '[Deshacer] · los días vuelven a su sitio', '')
    debe(await hay('[data-hoy-excursion-cancelada]'), '[Deshacer] · y la excursión vuelve a estar cancelada hoy (es la fecha de hoy)', '')
    // — Sin día con el que cambiarla: es el último día —
    await montar({ hoy: '2026-11-12', ultimoDia: true })
    await clic('[data-hoy-excursion-cancelar]')
    await a.esp(2000)
    debe(await hay('[data-hoy-excursion-cancelada]') && !(await hay('[data-hoy-excursion-otro-dia]')), 'otro día · la excursión es el último día: el botón no sale', '')
    await sinQueHago({ hay, body }, 'el día libre (excursión en el último día)')
    // — La pieza «al volver» —
    await montar({ hoy: '2026-11-11' })
    await pruebaDeLaPieza(h, true)
  })
}

try {
  if (QUE === 'pura' || QUE === 'todo') await partePura()
  if (QUE === 'roma' || QUE === 'todo') await parteRoma()
  if (QUE === 'lanza' || QUE === 'todo') await parteLanza()
} catch (e) {
  debe(false, 'error', `la prueba se ha parado: ${String(e?.stack ?? e).slice(0, 500)}`)
}
console.log(`\n${comprobaciones} comprobaciones · ${fallos.length} fallos`)
for (const f of fallos) console.log(`✗ [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
