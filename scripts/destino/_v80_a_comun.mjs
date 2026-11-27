// V80 (agente A): ayudante común de las capturas y de la prueba del día de excursión en HOY. Abre la app (un Chrome), crea el viaje de Lanzarote o de Roma y deja HOY en el día de excursión que se pida.
//   const v = await abrirV80('lanza' | 'roma'); await v.montar({ ... }); ... v.cerrar()
import fs from 'node:fs'
import { abrirApp } from './_enLaApp.mjs'

const ANTES = fs.readFileSync('scripts/destino/pruebaV43.mjs', 'utf8').match(/const ANTES = `([\s\S]*?)`/)[1]
export const R = "(await import('/src/store/useRouteStore.ts')).useRouteStore"

export async function abrirV80(destino) {
  const lanza = destino === 'lanza'
  const a = await abrirApp(process.env.APP_URL ?? 'http://localhost:5173', { ruta: '/?cuentas=off&logros=off&apertura=0&hoy2=on&version=pago', antes: ANTES, ancho: 390, alto: 844 })
  const ev = (e) => a.evaluar(`(async () => (${e}))()`)
  const clic = (sel) => a.evaluar(`(() => { const b = document.querySelector(${JSON.stringify(sel)}); if (!b) return false; b.click(); return true })()`)
  const hay = (sel) => a.evaluar(`Boolean(document.querySelector(${JSON.stringify(sel)}))`)
  const texto = (sel) => a.evaluar(`(document.querySelector(${JSON.stringify(sel)}) ?? { innerText: '' }).innerText.replace(/\\s+/g, ' ')`)
  for (let i = 0; i < 80 && !(await a.evaluar(`typeof window.${lanza ? '__rutaLanzarote' : '__rutaPrueba'} === 'function'`).catch(() => false)); i++) await a.esp(500)
  await a.evaluar(lanza ? "window.__rutaLanzarote({ zona: 'costa_teguise', coche: 'alquiler', hoy: '2026-11-08' }).then(() => true)" : 'window.__rutaPrueba().then(() => true)')
  for (let i = 0; i < 300 && !(await ev(`${R}.getState().route ? true : false`).catch(() => false)); i++) await a.esp(1000)
  await a.esp(2500)
  for (let i = 0; i < 4; i++) {
    const h = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale|Cerrar)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
    if (!h) break
    await a.esp(600)
  }
  const sonda = await ev(`(async () => { const r = ${R}.getState().route; return { start: r.answers.dateRange?.start, dias: r.days.map((d) => ({ n: d.dayNumber, id: d.id, tipo: d.dayType, ret: !!d.isReturnLeg, dia: d.diaEscritoId ?? null, sel: d.selectedExcursionId ?? null, ex: (d.excursions ?? []).map((e) => e.id), titulo: d.curatedTitle ?? d.title })) } })()`)
  return { a, ev, clic, hay, texto, lanza, sonda, cerrar: () => a.cerrar(), R }
}

/**
 * Deja la ruta lista y HOY en el día `dia` (número) con la hora `min` y el GPS `pos` ({lat,lng} o null).
 *  · `excursion`: { id, title, ... } la excursión que se pone en ese día (Roma, y Lanzarote si se quiere otra); se marca el día como de excursión.
 *  · `reservas`: las reservas guardadas (ya con su `dateIso`, que si falta se pone el del día).
 *  · `estado`: lo guardado hoy en el móvil (`jutrip:excursion-hoy:…`), para saltar pasos.
 */
export async function montar(v, { dia, min, pos = null, excursion = null, reservas = [], estado = null, coche = null, alojamiento = 'Hotel de prueba', cancelada = false, fecha = null }) {
  const { a, ev, R: RR } = v
  await a.evaluar(`(async () => {
    const st = ${RR}
    try { sessionStorage.clear() } catch {}
    const r = JSON.parse(JSON.stringify(st.getState().route))
    const d = r.days.find((x) => x.dayNumber === ${dia})
    ${fecha ? `{ const mover = (iso) => new Date(new Date(iso + 'T12:00:00Z').getTime() + ((new Date(${JSON.stringify(fecha)} + 'T12:00:00Z').getTime() - new Date(r.answers.dateRange.start + 'T12:00:00Z').getTime()) - (${dia} - 1) * 86400000)).toISOString().slice(0, 10); r.answers.dateRange = { ...r.answers.dateRange, start: mover(r.answers.dateRange.start), end: mover(r.answers.dateRange.end) } }` : ''}
    const ini = r.answers.dateRange.start
    const iso = new Date(new Date(ini + 'T12:00:00Z').getTime() + (${dia} - 1) * 86400000).toISOString().slice(0, 10)
    ${excursion ? `d.dayType = 'excursion'; d.excursions = [${JSON.stringify(excursion)}]; d.selectedExcursionId = ${JSON.stringify(excursion.id)}; d.curatedTitle = ${JSON.stringify(excursion.title)}; d.title = ${JSON.stringify(excursion.title)}; d.stops = []` : ''}
    ${coche ? `d.coche = ${JSON.stringify(coche)}` : ''}
    const reservas = ${JSON.stringify(reservas)}.map((x) => ({ dateIso: iso, dayNumber: null, placeNames: [], ...x }))
    const seg = (await import('/src/lib/tuAlojamiento.ts')).estanciasDelViaje(r)[0]
    st.getState().setDevSimulatedTodayIso(iso)
    window.__horaFalsa = ${min}; window.__pos = ${JSON.stringify(pos)}; window.__perm = ${pos ? "'granted'" : "'denied'"}
    st.setState({ route: r, reservations: reservas, screen: 'route', accommodationSelections: seg ? { [seg.segmentDayId]: { name: ${JSON.stringify(alojamiento)}, precio: null } } : {} })
    try {
      Object.keys(localStorage).filter((k) => k.startsWith('trazo:hoy') || k.startsWith('jutrip:avisos-dichos:') || k.startsWith('jutrip:excursion-')).forEach((k) => localStorage.removeItem(k))
      localStorage.setItem('trazo:logros:permisos-vistos', '1')
      ${estado ? `localStorage.setItem('jutrip:excursion-hoy:' + r.id + ':' + iso, JSON.stringify(${JSON.stringify(estado)}))` : ''}
      ${cancelada ? `localStorage.setItem('jutrip:excursion-cancelada:' + r.id + ':' + d.id, iso)` : ''}
    } catch {}
    const V = await import('/src/store/useViajeCompartido.ts')
    V.useViajeCompartido.getState().poner({ gente: [] })
    st.getState().setActiveDayId(null); st.getState().setMode('explore')
    return true })()`)
  await a.esp(900)
  await ev(`${RR}.getState().setMode('today')`)
  await a.esp(4500)
  for (let i = 0; i < 3; i++) {
    const h = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Continuar|Entendido)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
    if (!h) break
    await a.esp(700)
  }
}

export const sinMovimiento = async (a) => {
  await a.evaluar("(() => { document.querySelector('[data-hoy-excursion]')?.scrollIntoView({ block: 'start' }); return true })()")
  await a.esp(700)
}
