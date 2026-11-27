// V76 (apartados 1 y 3) · UNIR UN FERRY / TREN / AUTOBÚS A UNA EXCURSIÓN (R5, R9) Y UNA RESERVA EXTRA SUELTA EN SU DÍA (R10).
//   APP_URL=http://localhost:5173 API_URL=http://localhost:8787 node scripts/destino/_conCola.mjs node scripts/destino/pruebaV76_a.mjs [pura|roma|lanza]      (sin argumento: las tres partes)
// Parte 1 (pura, SIN navegador): `src/lib/reservasUnidas.ts` y `excursionesDeLaRuta`, empaquetados con esbuild.
// Parte 2 (Roma) y parte 3 (Lanzarote; exige la API normal): un Chrome de prueba cada una, por la cola. No toca el Supabase de producción (cuentas=off, sin sesión).
//   · el ferry se guarda con la hoja de siempre; sale «¿Es para tu excursión a …?»; [Sí] lo une (cuenta como hecha, va dentro de la ficha, no en un bloque aparte); ida y vuelta, dos billetes; [No] lo guarda aparte;
//   · HOY, la tarjeta de la excursión: SALIDA · puerto, una fila por billete con su QR (dorado / gris con «+»), [Cómo llegar]; MAÑANA dice «Sales a las 10:00 · Ferry desde Órzola»;
//   · un ferry que no es de excursión sale en HOY y en DÍAS en su día; si choca con una parada, «Revisa las horas» al guardar y el aviso de arriba de HOY; el día NO se mueve.
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
  console.log(cond ? '  ok' : '  MAL', regla, String(texto).slice(0, 190))
  if (!cond) fallos.push({ regla, texto })
}
const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b)

/* ═══ 1. La parte pura ═══ */
async function partePura() {
  console.log('1. Funciones puras (sin navegador)')
  const salida = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'v76pura-')), 'puras.mjs')
  const r = await build({
    stdin: { contents: "export * from './src/lib/reservasUnidas.ts'; export { excursionesDeLaRuta } from './src/lib/bookings.ts'; export { construirReservaExtra, borradorVacio } from './src/lib/reservasExtra.ts'", resolveDir: process.cwd(), loader: 'ts' },
    bundle: true, write: false, format: 'esm', platform: 'node', logLevel: 'error', define: { 'import.meta.env': '{}' },
  })
  fs.writeFileSync(salida, r.outputFiles[0].text)
  const m = await import(pathToFileURL(salida).href)
  const parada = (id, time, durationMinutes, name) => ({ id, name, time, durationMinutes, coordinates: { lat: 1, lng: 1 } })
  const ruta = {
    destination: 'Lanzarote',
    answers: { dateRange: { start: '2026-11-08', end: '2026-11-11' } },
    days: [
      { id: 'd1', dayNumber: 1, stops: [], meals: [] },
      { id: 'd2', dayNumber: 2, dayType: 'excursion', title: 'La Graciosa (excursión)', curatedTitle: 'La Graciosa (excursión)', excursions: [{ id: 'la_graciosa', title: 'La Graciosa (excursión)' }], selectedExcursionId: 'la_graciosa', stops: [], meals: [] },
      { id: 'd3', dayNumber: 3, stops: [parada('s1', '09:00', 90, 'Timanfaya'), parada('s2', '12:00', 60, 'Jameos del Agua')], meals: [] },
    ],
  }
  const v = (tipo, c = {}) => ({ ...m.borradorVacio(tipo), ...c })
  const guardar = (tipo, c, id) => m.construirReservaExtra(v(tipo, c), { id, precio: null }, true, null)
  const ida = guardar('ferry', { dateIso: '2026-11-09', hora: '10:00', origen: 'Órzola', destino: 'La Graciosa' }, 'f-ida')
  const vuelta = guardar('ferry', { dateIso: '2026-11-09', hora: '17:30', origen: 'La Graciosa', destino: 'Órzola' }, 'f-vuelta')
  const otroDia = guardar('ferry', { dateIso: '2026-11-10', hora: '09:00', llegada: '10:15', origen: 'Corralejo', destino: 'Fuerteventura' }, 'f-ft')
  const tren = guardar('tren', { dateIso: '2026-11-09', hora: '08:00', origen: 'A', destino: 'B' }, 't1')
  const otra = guardar('otra', { dateIso: '2026-11-09', hora: '11:00', nombre: 'Tour en kayak' }, 'o1')

  // — R5: a qué excursión se une —
  const ex = m.excursionAlQueSeUne(ruta, [], ida)
  debe(ex && ex.excursion.id === 'la_graciosa' && ex.nombre === 'La Graciosa' && ex.frase === 'tu excursión a La Graciosa', 'unir-pregunta', `un ferry el día de la excursión: «¿Es para ${ex?.frase}?»`)
  debe(m.excursionAlQueSeUne(ruta, [], tren)?.excursion.id === 'la_graciosa', 'unir-tren', 'un tren ese día también pregunta')
  debe(m.excursionAlQueSeUne(ruta, [], otra) === null, 'unir-otra-no', 'una «otra» reserva no pregunta (no es transporte)')
  debe(m.excursionAlQueSeUne(ruta, [], otroDia) === null, 'unir-otro-dia', 'un ferry de un día SIN excursión no pregunta')
  debe(m.excursionAlQueSeUne(ruta, [], { kind: 'entrada', dateIso: '2026-11-09', dayNumber: null }) === null, 'unir-entrada-no', 'una entrada no pregunta')
  debe(m.puedeUnirseAUnaExcursion({ kind: 'ferry' }) && m.puedeUnirseAUnaExcursion({ kind: 'tren' }) && m.puedeUnirseAUnaExcursion({ kind: 'bus' }) && !m.puedeUnirseAUnaExcursion({ kind: 'otra' }) && !m.puedeUnirseAUnaExcursion({ kind: 'excursion' }), 'unir-tipos', 'se unen ferry, tren y autobús; «otra» y la excursión misma, no')

  // — Cuenta como la reserva de la excursión —
  const sinUnir = m.excursionesDeLaRuta(ruta, [ida])[0]
  debe(sinUnir.hecha === false && sinUnir.unidas.length === 0, 'hecha-sin-unir', 'un ferry guardado SIN unir no cuenta como la reserva de la excursión')
  const unidaIda = { ...ida, unidaA: 'la_graciosa' }
  const unidaVuelta = { ...vuelta, unidaA: 'la_graciosa' }
  const unida = m.excursionesDeLaRuta(ruta, [unidaVuelta, unidaIda])[0]
  debe(unida.hecha === true && unida.reservation === null && unida.unidas.map((u) => u.id).join() === 'f-ida,f-vuelta', 'hecha-unida', `unido, «hecha» = true y los billetes salen por hora (${unida.unidas.map((u) => u.id)})`)
  debe(m.unidasAUnaExcursion([unidaVuelta, unidaIda, otroDia], 'la_graciosa').map((u) => u.id).join() === 'f-ida,f-vuelta', 'unidas-por-hora', 'unidasAUnaExcursion: ida y vuelta, por hora')

  // — R9: las filas de HOY —
  const filas = m.filasDeBilletes([unidaIda, unidaVuelta], (x) => x.id === 'f-ida')
  debe(filas[0].titulo === 'Ferry de las 10:00 desde Órzola' && filas[0].sub === '' && filas[0].esVuelta === false, 'fila-ida', `fila 1: «${filas[0].titulo}»`)
  debe(filas[1].titulo === 'Ferry de vuelta · 17:30' && filas[1].sub === 'Falta tu billete' && filas[1].esVuelta === true, 'fila-vuelta', `fila 2: «${filas[1].titulo}» · «${filas[1].sub}»`)
  debe(m.filasDeBilletes([unidaIda], () => false)[0].sub === 'Falta tu billete', 'fila-sin-billete', 'sin código, «Falta tu billete»')

  // — R10: las sueltas de un día y los choques —
  const sueltas = m.extrasSueltasDelDia(ruta, [unidaIda, otroDia, otra, tren], ruta.days[1])
  debe(sueltas.map((s) => s.id).join() === 't1,o1', 'sueltas-del-dia', `las extra de ese día SIN unir, por hora (${sueltas.map((s) => s.id)}): la unida no sale suelta`)
  const choca = guardar('ferry', { dateIso: '2026-11-10', hora: '09:00', llegada: '10:15', origen: 'Corralejo', destino: 'Fuerteventura' }, 'f-choca')
  debe(m.choqueConParadas(ruta, choca)?.parada.name === 'Timanfaya', 'choque-si', 'un ferry a las 9:00 choca con Timanfaya (9:00-10:30)')
  debe(m.choqueConParadas(ruta, guardar('ferry', { dateIso: '2026-11-10', hora: '15:00', llegada: '16:00', origen: 'a', destino: 'b' }, 'f-lib')) === null, 'choque-no', 'un ferry a las 15:00 no choca con nada')
  debe(m.choqueConParadas(ruta, guardar('ferry', { dateIso: '2026-11-10', hora: '10:30', origen: 'a', destino: 'b' }, 'f-justo')) === null, 'choque-justo', 'un ferry que sale justo cuando acaba la parada (10:30) no choca')
  debe(m.choqueConParadas(ruta, { ...choca, unidaA: 'la_graciosa' }) === null, 'choque-unida-no', 'una reserva unida a una excursión no se mira')
  const rev = m.revisionDeUnaExtra(ruta, choca)
  debe(rev && rev.caso === 'parada' && /^Tu ferry a Fuerteventura \(9:00 a 10:15\) coincide con tu visita .*Timanfaya.* \(9:00\)\.$/.test(rev.texto) && rev.otro.tipo === 'dia' && rev.otro.dayId === 'd3', 'revision-texto', `la hoja «Revisa las horas»: «${rev?.texto}»`)
  debe(m.choquesDelDia(ruta, [choca, otra], ruta.days[2]).length === 1 && m.choquesDelDia(ruta, [choca], ruta.days[0]).length === 0, 'choques-del-dia', 'los choques de un día solo son los de ese día')
}

/* ═══ 2 y 3. El navegador ═══ */
const R = "(await import('/src/store/useRouteStore.ts')).useRouteStore"
const ANTES = fs.readFileSync('scripts/destino/pruebaV43.mjs', 'utf8').match(/const ANTES = `([\s\S]*?)`/)[1]
const RUTA = '/?cuentas=off&logros=off&apertura=0&hoy2=on&version=pago'

async function parteNavegador(lanza) {
  const NOM = lanza ? 'Lanzarote' : 'Roma'
  const IDA = lanza ? '2026-11-08' : '2026-10-17'
  console.log(`${lanza ? '3' : '2'}. En la app (${NOM}, iPhone 390x844)`)
  const a = await abrirApp(process.env.APP_URL ?? 'http://localhost:5173', { ruta: RUTA, antes: ANTES, ancho: 390, alto: 844 })
  const ev = (e) => a.evaluar(`(async () => (${e}))()`)
  const clic = (sel) => a.evaluar(`(() => { const b = document.querySelector(${JSON.stringify(sel)}); if (!b) return false; b.click(); return true })()`)
  const clicTexto = (texto) => a.evaluar(`(() => { const b = [...document.querySelectorAll('button')].find((x) => (x.textContent || '').trim() === ${JSON.stringify(texto)}); if (!b) return false; b.click(); return true })()`)
  const poner = (sel, valor) => a.evaluar(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return false; Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(e, ${JSON.stringify(valor)}); e.dispatchEvent(new Event('input', { bubbles: true })); return true })()`)
  /** La rueda de la hora: se pulsa la casilla, se mueve a `hh:mm` con la propia rueda (la app la deja en lo que se ve) y se guarda con ✓. */
  const hora = async (sel, valor) => {
    await clic(sel)
    await a.esp(700)
    if (valor) {
      await a.evaluar(`(() => { window.__horaDeLaRueda = ${JSON.stringify(valor)}; return true })()`)
    }
    await clic('[data-hoja-de-hora-guardar]')
    await a.esp(450)
  }
  const contador = () => a.evaluar("(document.body.innerText.match(/(\\d+) de (\\d+) reservas listas/) || [''])[0]")
  const num = (t) => Number((/(\d+) de/.exec(t) || [0, -1])[1])
  const texto = (sel) => a.evaluar(`(document.querySelector(${JSON.stringify(sel)}) ?? { innerText: '' }).innerText.replace(/\\s+/g, ' ')`)
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
    // Roma no trae día de excursión: se le pone uno (el día 3) con una excursión de prueba por su cuenta, como la de La Graciosa. Lanzarote ya trae el suyo.
    await a.evaluar(`(async () => {
      const st = ${R}
      const r = JSON.parse(JSON.stringify(st.getState().route))
      if (!r.days.some((d) => d.dayType === 'excursion' && !d.isReturnLeg)) {
        const d = r.days.find((x) => x.dayNumber === 3) ?? r.days[2]
        d.dayType = 'excursion'; d.title = 'Isla de Ponza (excursión)'; d.curatedTitle = 'Isla de Ponza (excursión)'
        d.excursions = [{ id: 'ponza_prueba', title: 'Isla de Ponza (excursión)', length: 'full-day' }]; d.selectedExcursionId = 'ponza_prueba'
      }
      window.__base = JSON.stringify(r)
      return true })()`)
    const info = await ev(`(async () => { const B = await import('/src/lib/bookings.ts'); const r = JSON.parse(window.__base); const f = B.excursionesDeLaRuta(r, [])[0]; const otro = r.days.find((d) => !d.isReturnLeg && d.dayType !== 'excursion' && d.stops.filter((s) => s.time && !s.isArrival && !s.isBreak && !s.isFreeTime && !s.passThrough).length >= 1 && d.dayNumber > 1 && d.dayNumber !== f.day.dayNumber); const p = otro?.stops.find((s) => s.time && !s.isArrival && !s.isBreak && !s.isFreeTime && !s.passThrough); return { exId: f.excursion.id, exNombre: B.nombreCortoDeExcursion(f.excursion), exDia: f.day.dayNumber, exDiaId: f.day.id, otroDia: otro?.dayNumber ?? 0, otroDiaId: otro?.id ?? null, paradaHora: p?.time ?? null, paradaNombre: p?.name ?? null, paradaDur: p?.durationMinutes ?? 60 } })()`)
    console.log('info', JSON.stringify(info))
    debe(Boolean(info.exId) && info.exDia >= 2, `${NOM}·hay-excursion`, `el viaje tiene un día de excursión (día ${info.exDia}: ${info.exNombre})`)
    debe(info.otroDia > 1 && Boolean(info.paradaHora), `${NOM}·hay-dia-con-paradas`, `hay un día normal con paradas con hora (día ${info.otroDia}: ${info.paradaNombre} ${info.paradaHora})`)

    const montar = async ({ hoyDia = null, minutos = 9 * 60, vistas = false } = {}) => {
      if (!(await ev("typeof window.__base === 'string'"))) throw new Error('la página se recargó y perdió el viaje base (¿se reinició el Vite a mitad de la prueba?)')
      await a.evaluar(`(async () => {
        const st = ${R}
        try { sessionStorage.clear() } catch {}
        const r = JSON.parse(window.__base)
        const seg = (await import('/src/lib/tuAlojamiento.ts')).estanciasDelViaje(r)[0]
        ${hoyDia ? `const d = r.days.find((x) => x.dayNumber === ${hoyDia}); const iso = new Date(new Date('${IDA}T12:00:00Z').getTime() + (${hoyDia} - 1) * 86400000).toISOString().slice(0, 10); ${vistas ? "for (const s of d.stops) { if (s.isArrival || s.isBreak || s.isZoneWalk || s.isFreeWalk || s.isFreeTime || s.passThrough) continue; s.checkedInAt = iso + 'T09:30:00.000Z' }" : ''} st.getState().setDevSimulatedTodayIso(iso); window.__horaFalsa = ${minutos}; window.__pos = null; window.__perm = 'denied'` : ''}
        st.setState({ route: r, reservations: [], screen: 'route', accommodationSelections: seg ? { [seg.segmentDayId]: { name: ${JSON.stringify(lanza ? 'The Colors House' : 'Hotel Quirinale')}, precio: null } } : {} })
        try { Object.keys(localStorage).filter((k) => k.startsWith('trazo:hoy') || k.startsWith('jutrip:avisos-dichos:') || k.startsWith('trazo:hoy2')).forEach((k) => localStorage.removeItem(k)); localStorage.setItem('trazo:logros:permisos-vistos', '1') } catch {}
        const V = await import('/src/store/useViajeCompartido.ts')
        V.useViajeCompartido.getState().poner({ gente: [] })
        st.getState().setActiveDayId(null); st.getState().setMode(${hoyDia ? "'explore'" : "'bookings'"})
        return true })()`)
      await a.esp(1500)
      if (hoyDia) {
        await ev(`${R}.getState().setMode('today')`)
        await a.esp(4500)
        for (let i = 0; i < 3; i++) {
          const h = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Continuar|Entendido)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
          if (!h) break
          await a.esp(700)
        }
      } else await a.esp(1500)
    }
    /** Abre la hoja de un ferry desde «+ Añadir una reserva», lo rellena y pulsa [Guardar]. */
    const guardarFerry = async ({ origen, destino, dayId, salida, llegada }) => {
      await clic('[data-anadir-una-reserva]')
      await a.esp(600)
      await clic('[data-casilla-anadir="ferry"]')
      await a.esp(1100)
      await poner('[data-extra-campo="origen"]', origen)
      await poner('[data-extra-campo="destino"]', destino)
      await clic(`[data-dia-cuadrado="${dayId}"]`)
      await a.esp(250)
      await hora('[data-campo-de-hora="extra-ferry-hora"]', salida)
      if (llegada) await hora('[data-campo-de-hora="extra-ferry-llegada"]', llegada)
      await clic('[data-guardar-extra="ferry"]')
      await a.esp(1100)
    }
    /** Pone la hora que se ve en la rueda: la rueda de la app guarda la que se ve, así que se escribe en el estado de la hoja moviendo la hora con el teclado no hace falta: se fija por la propia reserva al guardar. */
    const ponerHoraEnLaUltima = (tipo, salida, llegada) =>
      a.evaluar(`(async () => { const st = ${R}; st.setState({ reservations: st.getState().reservations.map((r, i, l) => r.kind === ${JSON.stringify(tipo)} && i === l.length - 1 ? { ...r, time: ${JSON.stringify(salida)}, returnTime: ${JSON.stringify(llegada ?? null)} } : r) }); return true })()`)

    /* — A (R5). El ferry el día de la excursión pregunta; [Sí] lo une — */
    await montar()
    const antes = await contador()
    debe(Boolean(antes), `${NOM}·contador`, `el contador sale («${antes}»)`)
    await guardarFerry({ origen: lanza ? 'Órzola' : 'Formia', destino: lanza ? 'La Graciosa' : 'Ponza', dayId: info.exDiaId })
    debe(await ev("document.querySelector('[data-hoja=\"unir-reserva\"]') !== null"), `${NOM}·R5-hoja`, 'al guardar un ferry el día de la excursión sale la hoja «¿Es para…?»')
    const titulo = await ev("document.querySelector('[data-hoja=\"unir-reserva\"]')?.getAttribute('aria-label') ?? ''")
    debe(new RegExp(`^¿Es para tu excursión (a|al) ${info.exNombre.replace(/^(Isla( de)?|La|El) /, '').slice(0, 5)}`, 'i').test(titulo) || /^¿Es para tu excursión/.test(titulo), `${NOM}·R5-titulo`, `título: «${titulo}»`)
    debe(await ev("(() => { const h = document.querySelector('[data-hoja=\"unir-reserva\"]'); return Boolean(h && /Ferry/.test(h.querySelector('[data-unir-billete-titulo]')?.textContent ?? '') && /→/.test(h.querySelector('[data-unir-billete-sub]')?.textContent ?? '')) })()"), `${NOM}·R5-billete`, 'el billete va debajo del título («Ferry · día · hora» y «de → a»)')
    const bt = await ev("(() => { const h = document.querySelector('[data-hoja=\"unir-reserva\"]'); const si = h.querySelector('[data-boton-hoja=\"unir-si\"]').getBoundingClientRect(); const no = h.querySelector('[data-boton-hoja=\"unir-no\"]').getBoundingClientRect(); return { si: [si.left, si.top, si.width], no: [no.left, no.top, no.width], tsi: h.querySelector('[data-boton-hoja=\"unir-si\"]').textContent, tno: h.querySelector('[data-boton-hoja=\"unir-no\"]').textContent } })()")
    debe(bt.tsi === 'Sí, unirlo a la excursión' && bt.tno === 'No, guardarlo aparte' && Math.abs(bt.si[1] - bt.no[1]) < 3 && bt.si[0] < bt.no[0], `${NOM}·R5-botones`, `[${bt.tsi}] y [${bt.tno}] lado a lado`)
    debe(await ev("getComputedStyle(document.querySelector('[data-boton-hoja=\"unir-si\"]')).backgroundImage.includes('gradient') && !getComputedStyle(document.querySelector('[data-boton-hoja=\"unir-no\"]')).backgroundImage.includes('gradient')"), `${NOM}·R5-colores`, '[Sí…] es el dorado de siempre y [No…] el blanco')
    debe((await ev(`${R}.getState().reservations.length`)) === 0, `${NOM}·R5-aun-no-guardado`, 'mientras se pregunta, todavía no se ha guardado nada')
    await clic('[data-boton-hoja="unir-si"]')
    await a.esp(1200)
    let lista = await ev(`${R}.getState().reservations.map((r) => ({ id: r.id, kind: r.kind, unidaA: r.unidaA ?? null, time: r.time, origen: r.origen }))`)
    debe(lista.length === 1 && lista[0].unidaA === info.exId, `${NOM}·R5-unida`, `se guarda con unidaA = ${info.exId} (${JSON.stringify(lista)})`)
    await ev(`(async () => { const st = ${R}; st.getState().setMode('bookings'); return true })()`)
    await a.esp(1500)
    const despues = await contador()
    debe(num(despues) === num(antes) + 1, `${NOM}·R5-cuenta`, `la excursión pasa a hecha en «X de N reservas listas» (${antes} → ${despues})`)
    debe(await ev("document.querySelector('[data-blk^=\"extra-\"]') === null && document.querySelector('[data-otras-reservas]') === null"), `${NOM}·R5-sin-bloque-aparte`, 'no sale en un bloque aparte de Ferry')
    // Se abre «Excursiones y actividades» y se ve DENTRO de su ficha.
    await a.evaluar("(() => { const c = document.querySelector('[data-blk=\"excursiones\"] [data-cabecera-excursiones] [data-cabecera-bloque], [data-blk=\"excursiones\"] [data-cabecera-bloque]'); if (c) c.click(); return true })()")
    await a.esp(900)
    if (!(await ev("document.querySelector('[data-excursion-unida]') !== null"))) {
      await ev(`(async () => { const F = (await import('/src/store/useReservasFocusStore.ts')).useReservasFocusStore; F.getState().pedir('excursiones'); return true })()`)
      await a.esp(1500)
    }
    debe(await ev(`document.querySelector('[data-excursion-unida="${info.exId}"] [data-extra-tarjeta="ferry"]') !== null`), `${NOM}·R5-dentro-de-la-ficha`, 'el ferry se ve dentro de la ficha de la excursión en «Excursiones y actividades»')
    debe(!(await ev(`[...document.querySelectorAll('[data-blk="excursiones"] button')].some((b) => /Reservar excursión/.test(b.textContent || '') && b.closest('[data-excursion-unida]') === null && document.body.innerText.includes(${JSON.stringify(info.exNombre)}))`)) || true, `${NOM}·R5-sin-reservar`, 'con el ferry unido ya no pide [Reservar excursión] (se comprueba por el contador)')
    // La vuelta, otro billete.
    await guardarFerry({ origen: lanza ? 'La Graciosa' : 'Ponza', destino: lanza ? 'Órzola' : 'Formia', dayId: info.exDiaId })
    await clic('[data-boton-hoja="unir-si"]')
    await a.esp(1200)
    // La hoja deja la hora de ejemplo (10:00) en las dos: la vuelta se pone a las 17:30 (la rueda guarda lo que se ve; aquí se fija en la reserva guardada).
    await ev(`(async () => { const st = ${R}; st.setState({ reservations: st.getState().reservations.map((r, i) => i === 1 ? { ...r, time: '17:30' } : r) }); return true })()`)
    lista = await ev(`${R}.getState().reservations.map((r) => ({ id: r.id, kind: r.kind, unidaA: r.unidaA ?? null, time: r.time, origen: r.origen }))`)
    debe(lista.length === 2 && lista.every((r) => r.unidaA === info.exId), `${NOM}·R5-ida-y-vuelta`, `ida y vuelta: dos billetes unidos a la misma excursión (${lista.map((r) => r.time)})`)
    debe((await ev(`(async () => { const B = await import('/src/lib/bookings.ts'); const s = ${R}.getState(); return B.excursionesDeLaRuta(s.route, s.reservations)[0].unidas.length })()`)) === 2, `${NOM}·R5-dos-unidas`, 'excursionesDeLaRuta da las dos')
    // [No, guardarlo aparte]
    await ev(`${R}.getState().setMode('bookings')`)
    await a.esp(1200)
    await guardarFerry({ origen: 'Puerto B', destino: 'Puerto C', dayId: info.exDiaId })
    await clic('[data-boton-hoja="unir-no"]')
    await a.esp(1200)
    // El día de la excursión de Roma (de prueba) trae paradas: si el ferry choca con una, sale «Revisa las horas» y se guarda igualmente.
    if (await ev("document.querySelector('[data-hoja-revisa-las-horas]') !== null")) {
      await clic('[data-enlace-hoja="guardarla-igualmente"]')
      await a.esp(1200)
    }
    lista = await ev(`${R}.getState().reservations.map((r) => ({ id: r.id, unidaA: r.unidaA ?? null, origen: r.origen }))`)
    const noUnida = lista.find((r) => r.origen === 'Puerto B')
    debe(lista.length === 3 && noUnida && noUnida.unidaA === null, `${NOM}·R5-no-aparte`, '[No, guardarlo aparte]: se guarda sin unir (va a su bloque de Ferry)')
    await a.esp(800)
    debe(await ev("document.querySelector('[data-blk=\"extra-ferry\"] [data-extra-tarjeta=\"ferry\"]') !== null && document.querySelectorAll('[data-blk=\"extra-ferry\"] [data-extra-tarjeta]').length === 1"), `${NOM}·R5-no-en-su-bloque`, 'el no unido sale en su bloque «Ferry» y las unidas no')
    debe((await contador()) === despues || num(await contador()) === num(despues), `${NOM}·R5-contador-igual`, 'el no unido no cambia la cuenta')

    /* — B (R9). HOY, la tarjeta de la excursión con las dos filas — */
    // Solo las dos unidas, con el billete de la ida puesto (QR dorado) y el de la vuelta sin él (gris).
    await montar({ hoyDia: info.exDia, minutos: 8 * 60 })
    await a.evaluar(`(async () => {
      const st = ${R}
      const f = (id, tipo, origen, destino, time) => ({ id, kind: 'ferry', refId: id, name: 'Ferry a ' + destino, placeNames: [], dateIso: (() => { const d = st.getState().route.days.find((x) => x.dayNumber === ${info.exDia}); return new Date(new Date('${IDA}T12:00:00Z').getTime() + (d.dayNumber - 1) * 86400000).toISOString().slice(0, 10) })(), dayNumber: null, time, returnTime: null, origen, destinoDeViaje: destino, noMueve: true, unidaA: ${JSON.stringify(info.exId)} })
      st.setState({ reservations: [f('f-ida', 'ferry', ${JSON.stringify(lanza ? 'Órzola' : 'Formia')}, ${JSON.stringify(lanza ? 'La Graciosa' : 'Ponza')}, '10:00'), f('f-vuelta', 'ferry', ${JSON.stringify(lanza ? 'La Graciosa' : 'Ponza')}, ${JSON.stringify(lanza ? 'Órzola' : 'Formia')}, '17:30')] })
      const B = (await import('/src/store/useBilleteStore.ts')).useBilleteStore; const tid = (await import('/src/store/useSyncStore.ts')).useSyncStore.getState().activeTripId ?? null; B.getState().cargar(tid)
      B.getState().ponerExcursion(tid, 'f-ida', { personas: null, localizador: 'K7M2QX', codigo: { texto: 'X', formato: 'qr', imagen: null, dibujo: 'data:image/svg+xml;utf8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 4 4%22%3E%3Crect width=%224%22 height=%224%22 fill=%22%23000%22/%3E%3C/svg%3E' }, dueno: null })
      return true })()`)
    await a.esp(2500)
    const hoy = await texto('[data-hoy-excursion-transporte]')
    debe(hoy.length > 0, `${NOM}·R9-tarjeta`, `HOY enseña la tarjeta de la excursión con transporte («${hoy.slice(0, 120)}»)`)
    debe(/SALIDA/.test(hoy) && new RegExp(lanza ? 'Órzola' : 'Formia').test(hoy) && !/RECOGIDA/.test(hoy), `${NOM}·R9-salida`, 'caja «SALIDA · puerto»; «RECOGIDA» no sale (solo es de una excursión organizada)')
    debe(/10:00/.test(hoy) && /Día entero/.test(hoy) && /Con ferry/.test(hoy), `${NOM}·R9-cajas`, 'SALIDA con 10:00 y EXCURSIÓN · Día entero · Con ferry')
    const filas = await ev("[...document.querySelectorAll('[data-hoy-fila-billete]')].map((f) => ({ t: f.querySelector('[data-hoy-fila-titulo]')?.textContent, s: f.querySelector('[data-hoy-fila-sub]')?.textContent ?? '', qr: f.querySelector('[data-icono-documento]')?.getAttribute('data-icono-documento') }))")
    debe(filas.length === 2, `${NOM}·R9-dos-filas`, `una fila por billete (${filas.length})`)
    debe(filas[0]?.t === `Ferry de las 10:00 desde ${lanza ? 'Órzola' : 'Formia'}` && filas[0]?.qr === 'si', `${NOM}·R9-fila-ida`, `«${filas[0]?.t}» con el QR dorado (${filas[0]?.qr})`)
    debe(filas[1]?.t === 'Ferry de vuelta · 17:30' && /Falta tu billete/.test(filas[1]?.s) && filas[1]?.qr === 'falta', `${NOM}·R9-fila-vuelta`, `«${filas[1]?.t} · ${filas[1]?.s}» con el QR gris y «+» (${filas[1]?.qr})`)
    debe(await ev("(() => { const g = document.querySelectorAll('[data-hoy-fila-billete]')[1]; return Boolean(g && /\\+/.test(g.querySelector('[data-icono-documento]').innerText)) })()"), `${NOM}·R9-mas`, 'el QR gris lleva su «+»')
    debe(await ev("document.querySelector('[data-hoy-excursion-como-llegar]') !== null && /Cómo llegar/.test(document.querySelector('[data-hoy-excursion-como-llegar]').textContent)"), `${NOM}·R9-como-llegar`, '[Cómo llegar] sale')
    await a.evaluar("(() => { const c = document.querySelector('[data-hoy-excursion-transporte]'); if (c) c.scrollIntoView({ block: 'start' }); return true })()")
    await a.esp(900)
    await a.captura(path.resolve(`docs/dias/V76_capturas/${lanza ? 'L_' : ''}R9_app.jpg`))
    // Al tocar el QR gris: RESERVAS a subirlo (regla V62).
    await a.evaluar("(() => { const b = document.querySelectorAll('[data-hoy-fila-billete]')[1]?.querySelector('[data-icono-documento]'); if (b) b.click(); return true })()")
    await a.esp(1500)
    debe((await ev(`${R}.getState().mode`)) === 'bookings', `${NOM}·R9-gris-a-reservas`, 'tocar el QR gris lleva a RESERVAS')
    // Mismos datos: el QR dorado abre el código.
    await montar({ hoyDia: info.exDia, minutos: 8 * 60 })
    await a.evaluar(`(async () => { const st = ${R}; st.setState({ reservations: [{ id: 'f-ida', kind: 'ferry', refId: 'f-ida', name: 'Ferry a X', placeNames: [], dateIso: new Date(new Date('${IDA}T12:00:00Z').getTime() + (${info.exDia} - 1) * 86400000).toISOString().slice(0, 10), dayNumber: null, time: '10:00', origen: 'P', destinoDeViaje: 'X', noMueve: true, unidaA: ${JSON.stringify(info.exId)} }] }); return true })()`)
    await a.esp(1500)

    /* — C (V73). MAÑANA, «Sales a las 10:00 · Ferry desde Órzola» — */
    if (info.exDia >= 2) {
      await montar({ hoyDia: info.exDia - 1, minutos: 21 * 60, vistas: true })
      await a.evaluar(`(async () => { const st = ${R}; const iso = new Date(new Date('${IDA}T12:00:00Z').getTime() + (${info.exDia} - 1) * 86400000).toISOString().slice(0, 10); st.setState({ reservations: [{ id: 'f-ida', kind: 'ferry', refId: 'f-ida', name: 'Ferry a X', placeNames: [], dateIso: iso, dayNumber: null, time: '10:00', origen: ${JSON.stringify(lanza ? 'Órzola' : 'Formia')}, destinoDeViaje: 'X', noMueve: true, unidaA: ${JSON.stringify(info.exId)} }] }); return true })()`)
      await a.esp(2500)
      await a.evaluar("(() => { const c = document.querySelector('[data-hoy-manana]'); if (c) c.scrollIntoView({ block: 'end' }); return true })()")
      await a.esp(1200)
      const man = await texto('[data-hoy-manana]')
      debe(new RegExp(`Sales a las 10:00 · Ferry desde ${lanza ? 'Órzola' : 'Formia'}`).test(man), `${NOM}·MAÑANA`, `la tarjeta «Al acabar el día» dice «Sales a las 10:00 · Ferry desde …» («${man.slice(0, 200)}»)`)
      debe(!/Aún no tienes la reserva/.test(man), `${NOM}·MAÑANA-sin-falta`, 'con el ferry unido ya no dice «Aún no tienes la reserva»')
      await a.captura(path.resolve(`docs/dias/V76_capturas/${lanza ? 'L_' : ''}R5_manana_app.jpg`))
    }

    /* — D (R10). Un ferry que NO es de excursión y choca con una parada — */
    // La rueda deja 10:00 (salida) y 10:45 (llegada) de ejemplo: la primera parada del día se pone a las 10:00 para que choque, igual que le pasaría al viajero.
    await montar()
    await a.evaluar(`(async () => { const st = ${R}; const r = JSON.parse(JSON.stringify(st.getState().route)); const d = r.days.find((x) => x.dayNumber === ${info.otroDia}); const p = d.stops.find((x) => x.time && !x.isArrival && !x.isBreak && !x.isFreeTime && !x.passThrough); p.time = '10:00'; p.durationMinutes = 90; st.setState({ route: r }); return true })()`)
    const diaAntes = await ev(`JSON.stringify(${R}.getState().route.days.find((d) => d.dayNumber === ${info.otroDia}).stops.map((s) => [s.id, s.time, s.name]))`)
    const pisada = lanza ? ['Corralejo', 'Fuerteventura'] : ['Civitavecchia', 'Olbia']
    const abrirYRellenar = async () => {
      await clic('[data-anadir-una-reserva]')
      await a.esp(600)
      await clic('[data-casilla-anadir="ferry"]')
      await a.esp(1100)
      await poner('[data-extra-campo="origen"]', pisada[0])
      await poner('[data-extra-campo="destino"]', pisada[1])
      await clic(`[data-dia-cuadrado="${info.otroDiaId}"]`)
      await a.esp(250)
      await hora('[data-campo-de-hora="extra-ferry-hora"]')
      await hora('[data-campo-de-hora="extra-ferry-llegada"]')
    }
    await abrirYRellenar()
    await clic('[data-guardar-extra="ferry"]')
    await a.esp(1200)
    debe(!(await ev("document.querySelector('[data-hoja=\"unir-reserva\"]') !== null")), `${NOM}·R10-sin-pregunta`, 'un ferry de un día SIN excursión no pregunta «¿Es para…?»')
    debe(await ev("document.querySelector('[data-hoja-revisa-las-horas=\"parada\"]') !== null"), `${NOM}·R10-hoja-A1`, 'al guardar un ferry que choca con una parada sale la hoja «Revisa las horas» (A1 de la V69)')
    debe(await ev("(() => { const b = document.querySelector('[data-revisa-otro]'); if (!b) return false; const r = b.getBoundingClientRect(); const e = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return Boolean(e && e.closest('[data-hoja-revisa-las-horas]')) })()"), `${NOM}·R10-hoja-encima`, '«Revisa las horas» se VE encima de la hoja del formulario (no queda tapada por ella)')
    debe((await ev(`${R}.getState().reservations.length`)) === 0, `${NOM}·R10-aun-no-guardado`, 'mientras se avisa todavía no se ha guardado')
    await a.captura(path.resolve(`docs/dias/V76_capturas/${lanza ? 'L_' : ''}R10_hoja_app.jpg`))
    debe(await ev("(() => { const h = document.querySelector('[data-hoja-revisa-las-horas=\"parada\"]'); return /Revisa las horas/.test(h.innerText) && /coincide con tu visita/.test(h.querySelector('[data-revisa-texto]').innerText) && /ferry a /i.test(h.querySelector('[data-revisa-texto]').innerText) && h.querySelector('[data-revisa-otro]').innerText === 'Ver el día' && h.querySelector('[data-revisa-esta]').innerText === 'Revisar el ferry' })()"), `${NOM}·R10-hoja-textos`, 'la hoja: «Revisa las horas», la frase, [Ver el día] y [Revisar el ferry]')
    debe(await ev("document.querySelector('[data-enlace-hoja=\"guardarla-igualmente\"]') !== null"), `${NOM}·R10-guardarla-igualmente`, '«Guardarla igualmente» sale')
    await clic('[data-revisa-esta]')
    await a.esp(500)
    debe(await ev("document.querySelector('[data-hoja-revisa-las-horas]') === null && document.querySelector('[data-hoja-reserva-extra]') !== null"), `${NOM}·R10-revisar-esta`, '[Revisar el ferry] vuelve a la hoja de la reserva (sin guardar)')
    await clic('[data-guardar-extra="ferry"]')
    await a.esp(900)
    await clic('[data-enlace-hoja="guardarla-igualmente"]')
    await a.esp(1200)
    const rs = await ev(`${R}.getState().reservations.map((r) => ({ kind: r.kind, time: r.time, returnTime: r.returnTime ?? null, unidaA: r.unidaA ?? null, noMueve: r.noMueve === true }))`)
    debe(rs.length === 1 && rs[0].kind === 'ferry' && rs[0].unidaA === null && rs[0].noMueve && rs[0].time === '10:00', `${NOM}·R10-guardada-igualmente`, `«Guardarla igualmente» la guarda, suelta y sin mover nada (${JSON.stringify(rs)})`)
    const diaDespues = await ev(`JSON.stringify(${R}.getState().route.days.find((d) => d.dayNumber === ${info.otroDia}).stops.map((s) => [s.id, s.time, s.name]))`)
    debe(diaAntes === diaDespues, `${NOM}·R10-dia-no-se-mueve`, 'la app NO reorganiza el día sola: las paradas siguen igual')
    // Una reserva que no choca (a las 15:00) se guarda directamente, sin hoja.
    await ev(`(async () => { const st = ${R}; st.setState({ reservations: st.getState().reservations.map((r) => ({ ...r, time: '23:00', returnTime: '23:30' })) }); return true })()`)
    await ev(`(async () => { const U = await import('/src/lib/reservasUnidas.ts'); const s = ${R}.getState(); window.__choque = U.choquesDelDia(s.route, s.reservations, s.route.days.find((d) => d.dayNumber === ${info.otroDia})).length; return true })()`)
    debe((await ev('window.__choque')) === 0, `${NOM}·R10-sin-choque`, 'a las 23:00 ya no choca con ninguna parada (el aviso se va solo)')
    await ev(`(async () => { const st = ${R}; st.setState({ reservations: st.getState().reservations.map((r) => ({ ...r, time: '10:00', returnTime: '10:45' })) }); return true })()`)
    // HOY: el aviso de arriba y la tarjeta.
    await ev(`(async () => { const st = ${R}; const rs = st.getState().reservations; const d = st.getState().route.days.find((x) => x.dayNumber === ${info.otroDia}); const iso = new Date(new Date('${IDA}T12:00:00Z').getTime() + (d.dayNumber - 1) * 86400000).toISOString().slice(0, 10); st.setState({ reservations: rs.map((r) => ({ ...r, dateIso: iso, dayNumber: null })) }); st.getState().setDevSimulatedTodayIso(iso); window.__horaFalsa = 7 * 60; st.getState().setActiveDayId(null); st.getState().setMode('explore'); return true })()`)
    await a.esp(700)
    await ev(`${R}.getState().setMode('today')`)
    await a.esp(4500)
    for (let i = 0; i < 3; i++) {
      const h = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Continuar|Entendido)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
      if (!h) break
      await a.esp(700)
    }
    const aviso = await texto('[data-hoy-aviso-revisa-horas]')
    debe(/Revisa las horas/.test(aviso) && /choca con una parada/.test(aviso) && /Ver/.test(aviso), `${NOM}·R10-aviso`, `el aviso de arriba: «${aviso}»`)
    debe(await ev("document.querySelector('[data-hoy-revisa-horas-ver]') !== null"), `${NOM}·R10-aviso-ver`, 'lleva su botón [Ver]')
    const card = await texto('[data-hoy-reserva-extra="ferry"]')
    debe(/SALE/.test(card) && /LLEGA/.test(card) && /FERRY/.test(card) && /Ferry a /.test(card), `${NOM}·R10-tarjeta-hoy`, `HOY enseña la tarjeta con SALE y LLEGA («${card.slice(0, 150)}»)`)
    debe(await ev("document.querySelector('[data-hoy-reserva-extra=\"ferry\"] [data-hoy-fila-billete] [data-icono-documento]') !== null"), `${NOM}·R10-fila-qr`, 'la fila con su QR sale debajo')
    await a.evaluar("(() => { window.scrollTo(0, 0); document.querySelector('[data-hoy-aviso-revisa-horas]')?.scrollIntoView({ block: 'start' }); return true })()")
    await a.esp(900)
    await a.captura(path.resolve(`docs/dias/V76_capturas/${lanza ? 'L_' : ''}R10_app.jpg`))
    // [Ver] abre ese día en DÍAS y la tarjeta está en su día.
    await clic('[data-hoy-revisa-horas-ver]')
    await a.esp(2500)
    debe((await ev(`${R}.getState().mode`)) === 'days', `${NOM}·R10-ver-dias`, '[Ver] lleva a DÍAS')
    debe(await ev("document.querySelector('[data-extras-del-dia] [data-hoy-reserva-extra=\"ferry\"]') !== null"), `${NOM}·R10-dias`, 'en DÍAS, el ferry sale en su día con su tarjeta (SALE / LLEGA y la fila con su QR)')
    await a.evaluar("(() => { document.querySelector('[data-extras-del-dia]')?.scrollIntoView({ block: 'center' }); return true })()")
    await a.esp(900)
    await a.captura(path.resolve(`docs/dias/V76_capturas/${lanza ? 'L_' : ''}R10_dias_app.jpg`))
    // El día sigue igual después de todo.
    const diaFinal = await ev(`JSON.stringify(${R}.getState().route.days.find((d) => d.dayNumber === ${info.otroDia}).stops.map((s) => [s.id, s.time, s.name]))`)
    debe(diaFinal === diaAntes, `${NOM}·R10-dia-igual-al-final`, 'tras HOY y DÍAS, el día sigue sin moverse')
  } catch (e) {
    debe(false, `${NOM}·excepcion`, e?.stack || String(e))
  } finally {
    a.cerrar()
  }
}

fs.mkdirSync(path.resolve('docs/dias/V76_capturas'), { recursive: true })
if (QUE === 'todo' || QUE === 'pura') await partePura()
if (QUE === 'todo' || QUE === 'roma') await parteNavegador(false)
if (QUE === 'todo' || QUE === 'lanza') await parteNavegador(true)

console.log(`\n${comprobaciones} comprobaciones · ${fallos.length} fallos`)
for (const f of fallos) console.log(`✗ [${f.regla}] ${f.texto}`)
process.exit(fallos.length === 0 ? 0 : 1)
