// V68 (apartado 4, Reorganizar): SOLO capturas (no es una prueba) en modo iPhone (390x844). Un solo Chrome por vez, que se cierra al acabar. Por la cola:
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/capturasV68_b.mjs <hoja|dias> <antes|despues> [Roma|Lanzarote] vuelo=15:30
// Guarda docs/dias/V68_capturas/b_<vuelo sin «:»>[_lanzarote]_<antes|despues>[_dias].jpg y escribe en la consola el texto de la hoja.
//   «antes» = lo que proponía el motor día por día (`propuestaDeVuelos(…, { sinMinimo: true })`: el cambio en cadena de la V61); «después» = el cambio mínimo (`diasQueCambian`, lo que hace el botón).
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'

const CAP = path.resolve(process.env.CAP_DIR ?? 'docs/dias/V68_capturas')
fs.mkdirSync(CAP, { recursive: true })
const QUE = process.argv[2] ?? 'hoja'
const FASE = process.argv[3] ?? 'despues'
const DESTINO = process.argv[4] && !process.argv[4].startsWith('vuelo=') ? process.argv[4] : 'Roma'
const VUELO = (process.argv.find((x) => x.startsWith('vuelo=')) ?? 'vuelo=15:30').slice(6)
const lanza = DESTINO === 'Lanzarote'
const nombre = `b_${VUELO.replace(':', '')}${lanza ? '_lanzarote' : ''}_${FASE}${QUE === 'dias' ? '_dias' : ''}`

const R = "(await import('/src/store/useRouteStore.ts')).useRouteStore"
const RUTA = '/?cuentas=off&logros=off&apertura=0&hoy2=on&version=pago'
const a = await abrirApp(process.env.APP_URL ?? 'http://localhost:5173', { ruta: RUTA, ancho: 390, alto: 844 })
const ev = (e) => a.evaluar('(async () => (' + e + '))()')
try {
  for (let i = 0; i < 80 && !(await a.evaluar(`typeof window.${lanza ? '__rutaLanzarote' : '__rutaPrueba'} === 'function'`).catch(() => false)); i++) await a.esp(500)
  await a.evaluar(lanza ? "window.__rutaLanzarote({ zona: 'costa_teguise', coche: 'alquiler', hoy: '2026-11-27' }).then(() => true)" : 'window.__rutaPrueba().then(() => true)')
  for (let i = 0; i < 300 && !(await ev(`${R}.getState().route ? true : false`).catch(() => false)); i++) await a.esp(1000)
  await a.esp(2500)
  for (let i = 0; i < 4; i++) {
    const h = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale|Cerrar)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
    if (!h) break
    await a.esp(600)
  }
  // (V74) TRIP=probador: el viaje es el que monta el probador de Reorganizar del panel (el mismo motor y los mismos datos que el viaje de la pantalla «Probar Reorganizar»), no el viaje de pruebas de la app.
  if (process.env.TRIP === 'probador') {
    await a.evaluar(`(async () => {
      const m = await import('/src/components/panel/reorganizar/motorDelProbador.ts')
      const caso = { ...m.casoPorDefecto('${lanza ? 'Lanzarote' : 'Roma'}'), inicio: '${lanza ? '2027-03-07' : '2026-11-27'}', dias: ${lanza ? 6 : 4}, llegada: '', salida: '', punto: '', freeTour: 'sin_hora' }
      const r = await m.probar(caso);
      ${R}.setState({ route: r.antes, reservations: [] })
      return true
    })()`)
    await a.esp(1500)
  }
  // El viaje sale el viernes 27 de noviembre, con el vuelo de ida a la hora pedida (Roma: Ciampino).
  await a.evaluar(`(async () => {
    const st = ${R}
    const r = JSON.parse(JSON.stringify(st.getState().route))
    r.answers = { ...r.answers, dateRange: { start: '2026-11-27', end: '2026-11-30' } }
    r.arrivalFlightTime = '${VUELO}'
    ${lanza ? '' : "r.arrivalPointId = 'cia'"}
    st.setState({ route: r, reservations: [], screen: 'route' })
    st.getState().setActiveDayId(null); st.getState().setMode('explore')
    return true
  })()`)
  await a.esp(1500)
  console.log('viaje', await ev(`JSON.stringify(${R}.getState().route.days.map((d) => ({ n: d.dayNumber, ret: !!d.isReturnLeg, stops: d.stops.filter((s) => !s.isArrival).length })))`))
  const cuantos = await a.evaluar(`(async () => {
    const st = ${R}
    const r = st.getState().route
    const ids = r.days.map((d) => d.id)
    const sr = (await import('/src/store/useReorganizarStore.ts')).useReorganizarStore.getState()
    let c
    if ('${FASE}' === 'antes') {
      const p = await (await import('/src/lib/adaptarVuelos.ts')).propuestaDeVuelos(r, [], { pase: true, coche: null, sinMinimo: true })
      c = p.dias.map((d) => ({ dayId: d.dayId, dayNumber: d.dayNumber, order: [], mealAfter: {}, movidas: d.movidas, reconstruido: d.next, noCaben: d.noCaben, detalle: [] }))
    } else {
      c = await (await import('/src/lib/reorganizarDia.ts')).diasQueCambian(ids)
    }
    sr.reiniciar()
    sr.poner(c.map((x) => x.dayId), ids, c)
    ${QUE === 'hoja' ? 'sr.abrirAlerta()' : ''}
    window.__v68 = c
    return c.length
  })()`)
  console.log('días que cambian:', cuantos)
  if (QUE === 'hoja') {
    for (let i = 0; i < 40 && !(await a.evaluar("!!document.querySelector('[data-hoja=\"reorganizar\"]')").catch(() => false)); i++) await a.esp(1000)
    await a.esp(2000)
    console.log('texto:', await a.evaluar("(document.querySelector('[data-hoja=\"reorganizar\"]')?.innerText ?? 'SIN HOJA').replace(/\\s+/g, ' ')"))
    await a.captura(path.join(CAP, `${nombre}.jpg`))
  } else {
    // El día 1 como queda en DÍAS (las cabeceras MAÑANA / TARDE / NOCHE): se pone el cambio y se abre la pestaña Días.
    await a.evaluar(`(async () => {
      const c = window.__v68
      const st = ${R}
      for (const x of c) st.getState().replaceDayRebuilt(x.dayId, x.reconstruido)
      st.setState({ screen: 'route' })
      const b = Array.from(document.querySelectorAll('nav button, button')).find((x) => /^Días$/i.test((x.textContent || '').trim()))
      if (b) b.click()
      return !!b
    })()`)
    await a.esp(2500)
    // Se abre el día 1 (la tarjeta «Día de viaje», la del primer día) y se baja hasta las paradas.
    await a.evaluar("(() => { const t = Array.from(document.querySelectorAll('button, [role=button], div')).filter((x) => /Día de viaje|VIE\\s*27/.test(x.textContent || '') && (x.textContent || '').length < 120).sort((p, q) => (p.textContent || '').length - (q.textContent || '').length)[0]; if (t) t.click(); return !!t })()")
    await a.esp(3000)
    await a.evaluar("(() => { const e = Array.from(document.querySelectorAll('*')).find((x) => x.children.length === 0 && /^(MAÑANA|TARDE|NOCHE)$/i.test((x.textContent || '').trim())); if (e) e.scrollIntoView({ block: 'start' }); return !!e })()")
    await a.esp(1000)
    console.log('franjas visibles:', await a.evaluar("Array.from(document.querySelectorAll('*')).filter((e) => e.children.length === 0 && /^(MAÑANA|TARDE|NOCHE)$/i.test((e.textContent || '').trim())).map((e) => e.textContent.trim()).join(' · ')"))
    await a.captura(path.join(CAP, `${nombre}.jpg`))
  }
} finally {
  a.cerrar()
}
