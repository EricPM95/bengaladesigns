// V73 (apartados 4, 5 y 5b): SOLO capturas (no es una prueba) en modo iPhone (390x844) de MAÑANA, el botón del alojamiento y el bloque «Coche» de RESERVAS. Un solo Chrome por vez, que se cierra al acabar. Por la cola:
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/capturasV73_b.mjs lanza|roma <caso>
// Casos de Lanzarote (la API normal): sinreserva, conreserva, porlibre, normal, viento, lluvia, reservas. De Roma: normal, alojamiento.
// Guarda docs/dias/V73_capturas/<modo>_<caso>_app.jpg y escribe docs/dias/V73_log_b_<modo>_<caso>.json con el texto de la pantalla.
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'

const CAP = path.resolve('docs/dias/V73_capturas')
fs.mkdirSync(CAP, { recursive: true })
const MODO = process.argv[2] ?? 'lanza'
const CASO = process.argv[3] ?? 'sinreserva'
const lanza = MODO === 'lanza'

const R = "(await import('/src/store/useRouteStore.ts')).useRouteStore"
const ANTES = fs.readFileSync('scripts/destino/pruebaV43.mjs', 'utf8').match(/const ANTES = `([\s\S]*?)`/)[1]
const RUTA = '/?cuentas=off&logros=off&apertura=0&hoy2=on&version=pago'
const IDA = lanza ? '2026-11-08' : '2026-10-17'

const a = await abrirApp(process.env.APP_URL ?? 'http://localhost:5173', { ruta: RUTA, antes: ANTES, ancho: 390, alto: 844 })
const ev = (e) => a.evaluar('(async () => (' + e + '))()')
const log = {}
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
  console.log('viaje', await ev(`JSON.stringify(${R}.getState().route.days.map((d) => ({ n: d.dayNumber, id: d.id.slice(0, 6), ret: !!d.isReturnLeg, tipo: d.dayType ?? null, esc: d.diaEscritoId ?? null, exc: (d.excursions ?? []).map((x) => x.id), sel: d.selectedExcursionId ?? null, stops: d.stops.filter((s) => !s.isArrival).map((s) => (s.time || '?') + ' ' + s.name.slice(0, 22)) })))`))

  // El tiempo de mañana: una previsión de mentira (la de nuestro servidor, que aquí no se usa) para provocar el aviso.
  const tiempo = CASO === 'lluvia' ? { p: 90, m: 2, c: 0, g: 10 } : (CASO === 'viento' || CASO === 'normal_viento') ? { p: 0, m: 0, c: 0, g: 80 } : { p: 0, m: 0, c: 0, g: 10 }
  await a.evaluar(`(() => { const of = window.fetch.bind(window); window.fetch = (u, o) => String(u).includes('/api/tiempo/horas') ? Promise.resolve(new Response(JSON.stringify(String(u).includes('fecha=' + window.__manana) ? { ok: true, probability: Array(24).fill(${tiempo.p}), precipitation: Array(24).fill(${tiempo.m}), cloud: Array(24).fill(${tiempo.c}), gust: Array(24).fill(${tiempo.g}) } : { ok: true, probability: Array(24).fill(0), precipitation: Array(24).fill(0), cloud: Array(24).fill(0), gust: Array(24).fill(5) }), { status: 200, headers: { 'content-type': 'application/json' } })) : of(u, o); return true })()`)

  /** Pone el viaje base con el día `hoyN` terminado (todas sus paradas vistas), el día simulado y la hora; `mañana` se arregla con `setup` (reservas, alojamiento…). */
  const montar = async ({ hoyN, min = 21 * 60, setup = '', aloj = false }) => {
    await a.evaluar(`(async () => {
      const st = ${R}
      try { sessionStorage.clear() } catch {}
      const r = JSON.parse(window.__base)
      const d = r.days.find((x) => x.dayNumber === ${hoyN})
      const iso = new Date(new Date('${IDA}T12:00:00Z').getTime() + (${hoyN} - 1) * 86400000).toISOString().slice(0, 10)
      for (const s of d.stops) { if (s.isArrival || s.isBreak || s.isZoneWalk || s.isFreeWalk || s.isFreeTime || s.passThrough) continue; s.checkedInAt = iso + 'T09:30:00.000Z' }
      window.__manana = new Date(new Date(iso + 'T12:00:00Z').getTime() + 86400000).toISOString().slice(0, 10); st.getState().setDevSimulatedTodayIso(iso)
      const seg = (await import('/src/lib/tuAlojamiento.ts')).estanciasDelViaje(r)[0]
      st.setState({ route: r, reservations: [], screen: 'route', accommodationSelections: ${aloj ? "seg ? { [seg.segmentDayId]: { name: 'Hotel de prueba', precio: null } } : {}" : '{}'} })
      ${setup}
      window.__pruebaDelPase = undefined
      try { Object.keys(localStorage).filter((k) => k.startsWith('trazo:hoy') || k.startsWith('jutrip:avisos-dichos:') || k.startsWith('trazo:hoy2')).forEach((k) => localStorage.removeItem(k)); localStorage.setItem('trazo:logros:permisos-vistos', '1') } catch {}
      window.__horaFalsa = ${min}; window.__pos = null; window.__perm = 'denied'
      st.getState().setActiveDayId(null); st.getState().setMode('explore')
      return true })()`)
    await a.esp(700)
    await ev(`${R}.getState().setMode('today')`)
    await a.esp(4500)
    for (let i = 0; i < 3; i++) {
      const h = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Continuar|Entendido)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
      if (!h) break
      await a.esp(700)
    }
  }
  const sacar = async (id, sel = '[data-hoy-manana]', bloque = 'end') => {
    await a.evaluar(`(() => { const c = document.querySelector('${sel}'); if (c) c.scrollIntoView({ block: '${bloque}' }); return true })()`)
    await a.esp(1500)
    await a.captura(path.join(CAP, `${MODO}_${id}_app.jpg`))
    log[id] = await a.evaluar(`(document.querySelector('${sel}') ?? document.body).innerText.replace(/\\s+/g, ' ').slice(0, 900)`)
    console.log('captura', id, '|', String(log[id]).slice(0, 500))
  }
  // El día de excursión (el de La Graciosa) y el día anterior (hoy).
  const diaExc = Number(await ev(`${R}.getState().route.days.find((d) => d.dayType === 'excursion' && !d.isReturnLeg)?.dayNumber ?? 0`))
  const RESERVA = (hora) => `{ const rr = st.getState().route; const dx = rr.days.find((x) => x.dayNumber === ${diaExc}); const ex = (dx.excursions ?? []).find((x) => x.id === dx.selectedExcursionId) ?? dx.excursions?.[0]; st.setState({ reservations: [{ id: 'r-exc', kind: 'excursion', refId: ex.id, name: ex.title, placeNames: [], dateIso: dx.dateIso ?? null, dayNumber: ${diaExc}, time: '${hora}', excursionId: ex.id, excursionData: ex }] }) }`
  const PORLIBRE = "{ const rr = JSON.parse(JSON.stringify(st.getState().route)); const dx = rr.days.find((x) => x.dayType === 'excursion'); dx.excursions = []; dx.selectedExcursionId = null; st.setState({ route: rr }) }"
  const hoy = diaExc > 1 ? diaExc - 1 : 1
  console.log('dia de excursion', diaExc, 'hoy', hoy, 'coords', await ev(`JSON.stringify([${R}.getState().route.destinationCoordinates ?? null, ${R}.getState().route.days.find((d) => d.dayNumber === ${diaExc})?.stops.length])`))

  if (lanza) {
    if (CASO === 'sinreserva') await montar({ hoyN: hoy })
    if (CASO === 'sinreserva_aloj') await montar({ hoyN: hoy, aloj: true })
    if (CASO === 'conreserva') await montar({ hoyN: hoy, setup: RESERVA('08:10'), aloj: true })
    if (CASO === 'porlibre') await montar({ hoyN: hoy, setup: PORLIBRE })
    if (CASO === 'viento' || CASO === 'lluvia') await montar({ hoyN: hoy })
    if (CASO === 'normal' || CASO === 'normal_viento') await montar({ hoyN: 2 })
    if (['sinreserva', 'sinreserva_aloj', 'conreserva', 'porlibre', 'viento', 'lluvia', 'normal', 'normal_viento'].includes(CASO)) {
      await sacar(CASO)
      // Lo de más arriba: la tarjeta de cierre y el alojamiento.
      await sacar(CASO + '_arriba', '[data-hoy-parada-cabecera],[data-hoy-cabecera]', 'start')
      if (CASO === 'sinreserva') {
        console.log('anadir reserva', await a.evaluar("(() => { const b = document.querySelector('[data-hoy-manana-anadir-reserva]'); if (!b) return false; b.click(); return true })()"))
        await a.esp(2500)
        await a.captura(path.join(CAP, `${MODO}_sinreserva_tras_anadir_app.jpg`))
        log.tras_anadir = await a.evaluar('document.body.innerText.replace(/\\s+/g, " ").slice(0, 600)')
        console.log('tras anadir', String(log.tras_anadir).slice(0, 300))
      }
    }
    if (CASO === 'tocar') {
      await montar({ hoyN: hoy })
      await a.evaluar("(() => { document.querySelector('[data-hoy-manana]')?.click(); return true })()")
      await a.esp(2500)
      await a.captura(path.join(CAP, `${MODO}_tocar_manana_app.jpg`))
      console.log('modo', await ev(`${R}.getState().mode + ' ' + ${R}.getState().activeDayId?.slice(0, 6)`), 'dia esperado', await ev(`${R}.getState().route.days.find((x) => x.dayNumber === ${diaExc}).id.slice(0, 6)`))
    }
    if (CASO === 'reservas') {
      await montar({ hoyN: hoy })
      await ev(`${R}.getState().setMode('bookings')`)
      await a.esp(3500)
      await a.evaluar("(() => { const c = document.querySelector('[data-coche-viaje],[data-coche]') ?? [...document.querySelectorAll('*')].find((x) => /Coche de alquiler/.test(x.textContent || '') && x.children.length < 8); if (c) c.scrollIntoView({ block: 'center' }); return true })()")
      await a.esp(1500)
      await a.captura(path.join(CAP, `${MODO}_reservas_coche_app.jpg`))
      log.orden = await a.evaluar("(() => { const t = document.body.innerText; return ['Entradas y Free Tour', 'Coche', 'Excursiones y actividades', 'Útil para el viaje'].map((k) => k + ':' + t.indexOf(k)).join(' | ') })()")
      console.log('orden', log.orden)
    }
  } else {
    if (CASO === 'normal') await montar({ hoyN: 2, aloj: true })
    if (CASO === 'alojamiento') await montar({ hoyN: 2, aloj: false })
    await sacar(CASO)
    await sacar(CASO + '_arriba', '[data-hoy-parada-cabecera],[data-hoy-cabecera]', 'start')
  }
  fs.writeFileSync(`docs/dias/V73_log_b_${MODO}_${CASO}.json`, JSON.stringify(log, null, 2))
} finally {
  a.cerrar()
}
process.exit(0)
