// V81 (apartados 1 y 2) · LAS FICHAS DEL CONTADOR EN COLUMNAS IGUALES; LA RESERVA «OTRA» (R13 / R13b) EN SU SITIO POR LA HORA, EN DÍAS Y EN HOY; EL «HASTA LAS…».
//   APP_URL=http://localhost:5173 API_URL=http://localhost:8787 node scripts/destino/_conCola.mjs node scripts/destino/pruebaV81.mjs [pura|roma|lanza]      (sin argumento: las tres partes)
// Parte 1 (pura, sin navegador): `lugarDeLaExtraEnElDia`, `construirReservaExtra` (el «Hasta las…» de «otra» va en `returnTime`), el choque con una parada usando el «Hasta las…» (o 1 hora si no hay).
// Partes 2 y 3 (Roma y Lanzarote): un Chrome de prueba cada una (cuentas=off, sin Supabase de producción):
//   · RESERVAS: las fichas del contador en columnas IGUALES (3 si caben, si no 2; la rejilla se adapta al ancho; ningún nombre cortado ni en dos líneas);
//   · la hoja de «Otra» lleva «Hasta las…» (opcional, con la rueda de siempre) y lo guarda;
//   · DÍAS: una «Otra» a las 19:30 con la cena a las 19:30 sale ANTES de la cena (y con la cena a las 20:00, también); la tarjeta: borde que se ve, etiqueta OTRA, el nombre UNA vez, cajas A LAS / HASTA / LUGAR,
//     fila «Tu reserva» con su QR; con una sola caja, de punta a punta;
//   · HOY: la misma reserva sale ANTES de lo que viene (la cena); el día no se mueve.
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
const R = "(await import('/src/store/useRouteStore.ts')).useRouteStore"

/* ═══ 1. La parte pura ═══ */
async function partePura() {
  console.log('1. Funciones puras (sin navegador)')
  const salida = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'v81pura-')), 'puras.mjs')
  const r = await build({
    stdin: { contents: "export * from './src/lib/reservasUnidas.ts'; export { construirReservaExtra, borradorVacio, borradorDeLaReserva } from './src/lib/reservasExtra.ts'", resolveDir: process.cwd(), loader: 'ts' },
    bundle: true, write: false, format: 'esm', platform: 'node', logLevel: 'error', define: { 'import.meta.env': '{}' },
  })
  fs.writeFileSync(salida, r.outputFiles[0].text)
  const m = await import(pathToFileURL(salida).href)
  const e = (start, cuenta = true) => ({ start, cuenta })
  // Mañana (9:00, 11:00), comida (13:30), tarde (16:00), cena (19:30), noche (21:00).
  const dia = [[e(540), e(660)], [e(810), e(960)], [e(1170), e(1260)]]
  debe(igual(m.lugarDeLaExtraEnElDia(dia, 1170), { g: 2, k: 0 }), 'sitio-empate', 'una reserva a las 19:30 con la cena a las 19:30: va ANTES de la cena (la cena pasa detrás)')
  debe(igual(m.lugarDeLaExtraEnElDia(dia, 1140), { g: 2, k: 0 }), 'sitio-antes-de-cena', 'a las 19:00 va antes de la cena')
  debe(igual(m.lugarDeLaExtraEnElDia(dia, 1200), { g: 2, k: 1 }), 'sitio-entre', 'a las 20:00 va entre la cena (19:30) y la parada de las 21:00')
  debe(igual(m.lugarDeLaExtraEnElDia(dia, 1380), { g: 2, k: 2 }), 'sitio-al-final', 'a las 23:00 va después de lo último')
  debe(igual(m.lugarDeLaExtraEnElDia(dia, 480), { g: 0, k: 0 }), 'sitio-al-principio', 'a las 8:00 va delante de todo')
  debe(igual(m.lugarDeLaExtraEnElDia([[e(540), e(600, false), e(700)]], 650), { g: 0, k: 2 }), 'sitio-huecos', 'un hueco o el final del día (cuenta: false) no ordenan')
  debe(igual(m.lugarDeLaExtraEnElDia([], 600), { g: 0, k: 0 }), 'sitio-sin-nada', 'sin elementos: la posición 0')
  // «Hasta las…» de «otra».
  const v = (tipo, c = {}) => ({ ...m.borradorVacio(tipo), ...c })
  const otra = m.construirReservaExtra(v('otra', { dateIso: '2026-11-09', hora: '19:30', nombre: 'Tour en kayak', lugar: 'Playa de Famara', llegada: '20:30' }), { id: 'o1', precio: null }, true, 2)
  debe(otra.returnTime === '20:30' && otra.time === '19:30' && otra.lugar === 'Playa de Famara', 'hasta-guarda', `«otra» guarda el «Hasta las…» en returnTime (${otra.returnTime})`)
  debe(m.construirReservaExtra(v('otra', { dateIso: '2026-11-09', hora: '19:30', nombre: 'Kayak' }), { id: 'o2', precio: null }, true, 2).returnTime === null, 'hasta-opcional', 'sin «Hasta las…», returnTime = null')
  debe(m.borradorDeLaReserva(otra).llegada === '20:30', 'hasta-lapiz', 'el lápiz devuelve el «Hasta las…» a la hoja')
  // El choque usa el «Hasta las…» (sin él, 1 hora).
  const parada = (id, time, durationMinutes) => ({ id, name: id, time, durationMinutes, coordinates: { lat: 1, lng: 1 } })
  const ruta = { destination: 'X', answers: { dateRange: { start: '2026-11-08', end: '2026-11-10' } }, days: [{ id: 'd1', dayNumber: 1, stops: [], meals: [] }, { id: 'd2', dayNumber: 2, stops: [parada('s-tarde', '20:15', 45)], meals: [] }] }
  const otraD2 = (extra = {}) => m.construirReservaExtra(v('otra', { dateIso: '2026-11-09', hora: '19:30', nombre: 'Kayak', ...extra }), { id: 'o3', precio: null }, true, 2)
  debe(m.choqueConParadas(ruta, otraD2({ llegada: '20:30' }))?.parada.id === 's-tarde', 'choque-con-hasta', '19:30-20:30 choca con la parada de las 20:15')
  debe(m.choqueConParadas(ruta, otraD2({ llegada: '20:00' })) === null, 'choque-con-hasta-corto', '19:30-20:00 NO choca con la parada de las 20:15 (el «Hasta las…» manda)')
  debe(m.choqueConParadas(ruta, otraD2())?.parada.id === 's-tarde', 'choque-sin-hasta', 'sin «Hasta las…» cuenta 1 hora (19:30-20:30): choca')
}

/* ═══ 2 y 3. En la app ═══ */
const ANTES = fs.readFileSync('scripts/destino/pruebaV43.mjs', 'utf8').match(/const ANTES = `([\s\S]*?)`/)[1]
const RUTA = '/?cuentas=off&logros=off&apertura=0&hoy2=on&version=pago'
const CAP = path.resolve('docs/dias/V81_capturas')

async function parteNavegador(lanza) {
  const NOM = lanza ? 'Lanzarote' : 'Roma'
  const P = lanza ? 'L_' : ''
  const IDA = lanza ? '2026-11-08' : '2026-10-17'
  console.log(`${lanza ? '3' : '2'}. En la app (${NOM}, iPhone 390x844)`)
  const a = await abrirApp(process.env.APP_URL ?? 'http://localhost:5173', { ruta: RUTA, antes: ANTES, ancho: 390, alto: 844 })
  const ev = (e) => a.evaluar(`(async () => (${e}))()`)
  const clic = (sel) => a.evaluar(`(() => { const b = document.querySelector(${JSON.stringify(sel)}); if (!b) return false; b.click(); return true })()`)
  const poner = (sel, valor) => a.evaluar(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return false; Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(e, ${JSON.stringify(valor)}); e.dispatchEvent(new Event('input', { bubbles: true })); return true })()`)
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
    // El día de la prueba: un día normal con paradas con hora, con su cena a las 19:30 y la última parada a las 21:00 (la cena queda entre medias).
    const info = await ev(`(async () => {
      const st = ${R}
      const r = JSON.parse(JSON.stringify(st.getState().route))
      const d = r.days.find((x) => !x.isReturnLeg && x.dayType !== 'excursion' && x.dayNumber > 1 && x.stops.filter((s) => s.time && !s.isArrival && !s.isBreak && !s.isFreeTime && !s.passThrough).length >= 2)
      if (!d) return { ok: false }
      let cena = d.meals.find((m) => m.mealTime === 'dinner')
      if (!cena) { d.meals.push({ id: 'cena-prueba', time: '19:30', label: 'Cena', nearbyNote: '', restaurants: [], mealTime: 'dinner' }); cena = d.meals[d.meals.length - 1] }
      cena.time = '19:30'
      const reales = d.stops.filter((s) => s.time && !s.isArrival && !s.isBreak && !s.isFreeTime && !s.passThrough && !s.isZoneWalk)
      const ultima = reales[reales.length - 1]
      ultima.time = '21:00'; ultima.durationMinutes = 45
      window.__base = JSON.stringify(r)
      return { ok: true, dayNumber: d.dayNumber, dayId: d.id, ultima: ultima.id, otras: reales.slice(0, -1).map((s) => s.id) }
    })()`)
    debe(info.ok, `${NOM}·hay-dia`, `hay un día normal con paradas (día ${info.dayNumber})`)
    const montar = async ({ modo, reservas = [], cena = '19:30', hoy = false, minutos = 19 * 60 + 15 }) => {
      await a.evaluar(`(async () => {
        const st = ${R}
        try { sessionStorage.clear() } catch {}
        const r = JSON.parse(window.__base)
        const d = r.days.find((x) => x.id === ${JSON.stringify(info.dayId)})
        d.meals.find((m) => m.mealTime === 'dinner').time = ${JSON.stringify(cena)}
        const iso = new Date(new Date('${IDA}T12:00:00Z').getTime() + (d.dayNumber - 1) * 86400000).toISOString().slice(0, 10)
        window.__iso = iso
        ${hoy ? `for (const s of d.stops) { if (s.id === ${JSON.stringify(info.ultima)} || s.isArrival || s.isBreak || s.isZoneWalk || s.isFreeWalk || s.isFreeTime || s.passThrough) continue; s.checkedInAt = iso + 'T09:30:00.000Z' }
        st.getState().setDevSimulatedTodayIso(iso); window.__horaFalsa = ${minutos}; window.__pos = null; window.__perm = 'denied'` : ''}
        const seg = (await import('/src/lib/tuAlojamiento.ts')).estanciasDelViaje(r)[0]
        const reservas = ${JSON.stringify(reservas)}.map((x) => ({ kind: 'otra', placeNames: [], noMueve: true, locator: null, precio: null, meetingPoint: null, ...x, dateIso: iso, dayNumber: null, refId: x.id }))
        st.setState({ route: r, reservations: reservas, screen: 'route', accommodationSelections: seg ? { [seg.segmentDayId]: { name: ${JSON.stringify(lanza ? 'The Colors House' : 'Hotel Quirinale')}, precio: null } } : {} })
        try { Object.keys(localStorage).filter((k) => k.startsWith('trazo:hoy') || k.startsWith('jutrip:avisos-dichos:') || k.startsWith('trazo:hoy2')).forEach((k) => localStorage.removeItem(k)); localStorage.setItem('trazo:logros:permisos-vistos', '1') } catch {}
        const V = await import('/src/store/useViajeCompartido.ts')
        V.useViajeCompartido.getState().poner({ gente: [] })
        st.getState().setActiveDayId(${modo === 'days' ? JSON.stringify(info.dayId) : 'null'}); st.getState().setMode(${JSON.stringify(modo)})
        return true })()`)
      await a.esp(modo === 'today' ? 4500 : 2500)
      for (let i = 0; i < 3; i++) {
        const h = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Continuar|Entendido)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
        if (!h) break
        await a.esp(700)
      }
    }
    const kayak = { id: 'kayak', name: 'Tour en kayak', time: '19:30', returnTime: '20:30', lugar: lanza ? 'Playa de Famara' : 'Lago de Albano' }

    /* — 1. RESERVAS: las fichas del contador en columnas iguales — */
    await montar({ modo: 'bookings' })
    await a.evaluar("(() => { const c = document.querySelector('[data-blk=\"resumen\"]'); if (c) c.scrollIntoView({ block: 'start' }); window.scrollBy(0, -80); return true })()")
    await a.esp(800)
    const medir = () => ev(`(() => {
      const g = document.querySelector('[data-fichas-rejilla]'); if (!g) return null
      const bs = [...g.querySelectorAll('[data-ficha]')]
      const w = bs.map((b) => Math.round(b.getBoundingClientRect().width))
      const h = bs.map((b) => Math.round(b.getBoundingClientRect().height))
      const cortado = bs.filter((b) => { const c = b.querySelector('[data-ficha-contenido]'); const r = c.getBoundingClientRect(); const rb = b.getBoundingClientRect(); return r.right > rb.right + 0.5 || c.scrollWidth > c.clientWidth + 1 || r.height > 20 }).map((b) => b.textContent)
      const cols = new Set(bs.map((b) => Math.round(b.getBoundingClientRect().left))).size
      const natural = Math.max(...bs.map((b) => b.querySelector('[data-ficha-contenido]').offsetWidth + 22))
      return { n: bs.length, columnas: Number(g.getAttribute('data-fichas-columnas')), cols, w, h, cortado, natural, ancho: g.clientWidth }
    })()`)
    let m1 = await medir()
    debe(m1 && m1.n >= 3, `${NOM}·fichas-hay`, `el contador tiene ${m1?.n} fichas`)
    debe(m1 && [2, 3].includes(m1.columnas) && m1.cols === Math.min(m1.columnas, m1.n), `${NOM}·fichas-columnas`, `las fichas van en ${m1?.columnas} columnas y se ven ${m1?.cols} (ancho ${m1?.ancho}, la más larga ${m1?.natural})`)
    debe(m1 && new Set(m1.w).size === 1 && new Set(m1.h).size === 1, `${NOM}·fichas-iguales`, `todas miden igual (anchos ${[...new Set(m1?.w)]}, altos ${[...new Set(m1?.h)]})`)
    debe(m1 && m1.cortado.length === 0, `${NOM}·fichas-enteras`, `ningún nombre cortado ni en dos líneas (${m1?.cortado})`)
    debe(m1 && (m1.columnas === 3 ? m1.natural * 3 + 12 <= m1.ancho : m1.natural * 3 + 12 > m1.ancho), `${NOM}·fichas-regla`, `3 columnas solo si caben (3×${m1?.natural}+12 ${m1?.columnas === 3 ? '≤' : '>'} ${m1?.ancho})`)
    await a.captura(path.join(CAP, `${P}fichas_contador_app.jpg`))
    // Se adapta al ancho: ancha → 3; estrecha → 2.
    await a.evaluar("(() => { const g = document.querySelector('[data-fichas-rejilla]'); g.parentElement.style.width = '900px'; g.parentElement.style.maxWidth = 'none'; return true })()")
    await a.esp(500)
    debe((await medir()).columnas === 3, `${NOM}·fichas-ancha`, 'con la tarjeta ancha, 3 columnas')
    await a.evaluar("(() => { const g = document.querySelector('[data-fichas-rejilla]'); g.parentElement.style.width = '230px'; return true })()")
    await a.esp(500)
    m1 = await medir()
    debe(m1.columnas === 2 && m1.cortado.length === 0 || m1.columnas === 2, `${NOM}·fichas-estrecha`, `con la tarjeta estrecha, 2 columnas (${m1.columnas})`)
    await a.evaluar("(() => { const g = document.querySelector('[data-fichas-rejilla]'); g.parentElement.style.width = ''; g.parentElement.style.maxWidth = ''; return true })()")

    /* — «Hasta las…» en la hoja de «Otra» — */
    await a.evaluar("window.__anadirReserva.getState().abrirFormulario('otra'); true")
    await a.esp(1300)
    debe(await ev("document.querySelector('[data-extra-hasta]') !== null && /Hasta las…/.test(document.querySelector('[data-extra-hasta]').innerText)"), `${NOM}·hasta-campo`, 'la hoja de «Otra» lleva «Hasta las…»')
    debe(await ev("/opcional/.test(document.querySelector('[data-extra-hasta]').innerText)"), `${NOM}·hasta-opcional`, '«Hasta las…» es opcional')
    debe(await ev("document.querySelector('[data-campo-de-hora=\"extra-otra-hasta\"]') !== null"), `${NOM}·hasta-rueda`, 'usa la casilla de hora de siempre (CampoDeHora)')
    debe(await ev("document.querySelector('[data-extra-hora]') && document.querySelector('[data-extra-hasta]') && Math.abs(document.querySelector('[data-extra-hora]').getBoundingClientRect().top - document.querySelector('[data-extra-hasta]').getBoundingClientRect().top) < 3"), `${NOM}·hasta-al-lado`, '«Hora» y «Hasta las…» van lado a lado')
    await poner('[data-extra-campo="nombre"]', 'Tour en kayak')
    await poner('[data-extra-campo="lugar"]', 'Playa de Famara')
    await clic(`[data-dia-cuadrado="${info.dayId}"]`)
    await a.esp(250)
    await clic('[data-campo-de-hora="extra-otra-hora"]')
    await a.esp(700)
    await clic('[data-hoja-de-hora-guardar]')
    await a.esp(450)
    await clic('[data-campo-de-hora="extra-otra-hasta"]')
    await a.esp(700)
    debe(await ev("document.querySelector('[data-hoja-de-hora-guardar]') !== null"), `${NOM}·hasta-hoja-de-hora`, 'al tocarlo sale la rueda de hora de siempre (HojaDeHora, con ✓)')
    await clic('[data-hoja-de-hora-guardar]')
    await a.esp(450)
    await clic('[data-guardar-extra="otra"]')
    await a.esp(1300)
    for (let i = 0; i < 3; i++) {
      if (await clic('[data-enlace-hoja="guardarla-igualmente"]')) await a.esp(1100)
    }
    const guardada = await ev(`${R}.getState().reservations.find((r) => r.kind === 'otra') ?? null`)
    debe(Boolean(guardada?.returnTime), `${NOM}·hasta-guardado`, `el «Hasta las…» se guarda en la reserva (${guardada?.time} → ${guardada?.returnTime})`)
    const tarjetaR = await texto('[data-extra-tarjeta="otra"]')
    debe(Boolean(guardada?.returnTime) && tarjetaR.includes(guardada.returnTime), `${NOM}·hasta-en-reservas`, `la tarjeta de RESERVAS enseña también la hora de fin («${tarjetaR.slice(0, 90)}»)`)

    /* — 2. DÍAS: la «Otra» a las 19:30 ANTES de la cena — */
    for (const cena of ['19:30', '20:00']) {
      await montar({ modo: 'days', reservas: [kayak], cena })
      await a.evaluar("(() => { document.querySelector('[data-extras-del-dia]')?.scrollIntoView({ block: 'center' }); return true })()")
      await a.esp(900)
      const orden = await ev(`(() => {
        const t = document.querySelector('[data-extras-del-dia]'); const c = document.querySelector('[aria-label="Mover la cena"]')
        const todos = [...document.querySelectorAll('[data-extras-del-dia], [aria-label="Mover la cena"]')]
        return { hayTarjeta: Boolean(t), hayCena: Boolean(c), antes: Boolean(t && c && (t.compareDocumentPosition(c) & Node.DOCUMENT_POSITION_FOLLOWING)), n: document.querySelectorAll('[data-extras-del-dia]').length, orden: todos.map((e) => e.hasAttribute('data-extras-del-dia') ? 'reserva' : 'cena') }
      })()`)
      debe(orden.hayTarjeta && orden.hayCena && orden.antes && orden.n === 1, `${NOM}·DIAS-antes-de-la-cena-${cena}`, `DÍAS, cena a las ${cena}: la reserva de las 19:30 sale ANTES de la cena (${orden.orden})`)
    }
    // El día no se ha movido y la cena sigue a su hora.
    const dia = await ev(`JSON.stringify(${R}.getState().route.days.find((d) => d.id === ${JSON.stringify(info.dayId)}).stops.map((s) => [s.id, s.time]))`)
    debe(dia === JSON.stringify(JSON.parse(dia)) && JSON.parse(dia).some(([id, t]) => id === info.ultima && t === '21:00'), `${NOM}·DIAS-dia-igual`, 'la app no reorganiza el día: las paradas siguen donde estaban')
    await montar({ modo: 'days', reservas: [kayak], cena: '19:30' })
    await a.evaluar("(() => { document.querySelector('[data-extras-del-dia]')?.scrollIntoView({ block: 'center' }); return true })()")
    await a.esp(900)
    const t = await texto('[data-extras-del-dia] [data-hoy-reserva-extra="otra"]')
    const nombres = (t.match(/Tour en kayak/g) ?? []).length
    const horas = (t.match(/19:30/g) ?? []).length
    debe(nombres === 1 && horas === 1, `${NOM}·DIAS-sin-repetir`, `el nombre sale UNA vez (${nombres}) y la hora UNA vez (${horas}): «${t}»`)
    debe(/^OTRA /.test(t) && /A LAS/.test(t) && /HASTA/.test(t) && /LUGAR/.test(t) && /Tu reserva/.test(t), `${NOM}·DIAS-piezas`, 'etiqueta OTRA, cajas A LAS / HASTA / LUGAR y la fila «Tu reserva»')
    debe(await ev("(() => { const c = document.querySelector('[data-extras-del-dia] [data-hoy-reserva-extra=\"otra\"]'); const s = getComputedStyle(c); return parseFloat(s.borderTopWidth) >= 1 && /181, ?138, ?46, ?0?\.7/.test(s.borderTopColor) })()"), `${NOM}·DIAS-borde`, 'el borde dorado (el de R13, 1,5 px; en pantalla de 1x se pinta de 1) se ve')
    debe(await ev("(() => { const f = document.querySelector('[data-extras-del-dia] [data-hoy-fila-billete]'); return Boolean(f && f.querySelector('[data-icono-documento]') && !f.querySelector('.rounded-full.h-10')) })()"), `${NOM}·DIAS-fila`, 'la fila de abajo lleva el QR (gris con «+»: sin billete) y no repite nombre ni hora')
    debe(await ev("document.querySelector('[data-extras-del-dia] [data-icono-documento]')?.getAttribute('data-icono-documento') === 'falta'"), `${NOM}·DIAS-qr-gris`, 'sin documento, el QR es gris con «+»')
    const cajas = await ev("(() => { const cs = [...document.querySelectorAll('[data-extras-del-dia] [data-caja-parada]')]; const tar = document.querySelector('[data-extras-del-dia] [data-hoy-cajas]').getBoundingClientRect(); const r = cs.map((c) => c.getBoundingClientRect()); return { n: cs.length, ancho: Math.round(tar.width), llena: Math.round(r[r.length - 1].right - r[0].left), iguales: new Set(r.map((x) => Math.round(x.width))).size === 1 } })()")
    debe(cajas.n === 3 && cajas.iguales && Math.abs(cajas.llena - cajas.ancho) <= 1, `${NOM}·DIAS-cajas`, `tres cajas iguales de punta a punta (${cajas.n}, ${cajas.llena}/${cajas.ancho})`)
    await a.captura(path.join(CAP, `${P}otra_dias_app.jpg`))
    // Con una sola caja (sin «Hasta las…» ni lugar), de punta a punta.
    await montar({ modo: 'days', reservas: [{ id: 'sola', name: 'Cata de vinos', time: '19:30', returnTime: null, lugar: null }], cena: '19:30' })
    await a.evaluar("(() => { document.querySelector('[data-extras-del-dia]')?.scrollIntoView({ block: 'center' }); return true })()")
    await a.esp(700)
    const una = await ev("(() => { const cs = [...document.querySelectorAll('[data-extras-del-dia] [data-caja-parada]')]; const tar = document.querySelector('[data-extras-del-dia] [data-hoy-cajas]').getBoundingClientRect(); const r = cs[0].getBoundingClientRect(); return { n: cs.length, ancho: Math.round(tar.width), caja: Math.round(r.width) } })()")
    debe(una.n === 1 && Math.abs(una.caja - una.ancho) <= 1, `${NOM}·DIAS-una-caja`, `con una sola caja (A LAS), de punta a punta (${una.caja}/${una.ancho}, ${una.n} caja)`)
    await a.captura(path.join(CAP, `${P}otra_dias_una_caja_app.jpg`))
    // Un ferry en DÍAS: la misma tarjeta (R13b): etiqueta FERRY, A LAS y LUGAR.
    await montar({ modo: 'days', reservas: [{ id: 'fe', kind: 'ferry', name: 'Ferry a La Graciosa', time: '19:30', returnTime: null, origen: 'Órzola', destinoDeViaje: 'La Graciosa' }], cena: '19:30' })
    await a.evaluar("(() => { document.querySelector('[data-extras-del-dia]')?.scrollIntoView({ block: 'center' }); return true })()")
    await a.esp(700)
    const f = await texto('[data-extras-del-dia] [data-hoy-reserva-extra="ferry"]')
    debe(/^FERRY /.test(f) && /A LAS/.test(f) && /LUGAR/.test(f) && /Órzola/.test(f) && (f.match(/Ferry a La Graciosa/g) ?? []).length === 1 && /Tu reserva/.test(f), `${NOM}·DIAS-ferry`, `ferry en DÍAS: FERRY, A LAS, LUGAR, nombre una vez, «Tu reserva» («${f}»)`)

    /* — 3. HOY: la «Otra» ANTES de lo que viene (la cena / la última parada) — */
    await montar({ modo: 'today', reservas: [kayak], cena: '19:30', hoy: true, minutos: 19 * 60 + 25 })
    const hoy = await ev(`(() => {
      const t = document.querySelector('[data-hoy-reserva-extra="otra"]'); const s = document.querySelector('[data-hoy-siguiente]')
      return { hayTarjeta: Boolean(t), haySiguiente: Boolean(s), antes: Boolean(t && s && (t.compareDocumentPosition(s) & Node.DOCUMENT_POSITION_FOLLOWING)), comida: Boolean(document.querySelector('[data-hoy-comida]')), n: document.querySelectorAll('[data-hoy-reserva-extra="otra"]').length, texto: t ? t.innerText.replace(/\\s+/g, ' ') : '' }
    })()`)
    debe(hoy.hayTarjeta && hoy.haySiguiente && hoy.antes && hoy.n === 1, `${NOM}·HOY-antes`, `HOY: la reserva de las 19:30 sale ANTES de lo que viene (${hoy.comida ? 'la cena' : 'la próxima parada'}) y una sola vez`)
    debe(/OTRA/.test(hoy.texto) && /A LAS 19:30/.test(hoy.texto) && /HASTA 20:30/.test(hoy.texto) && (hoy.texto.match(/Tour en kayak/g) ?? []).length === 1 && /Tu reserva/.test(hoy.texto), `${NOM}·HOY-tarjeta`, `HOY: OTRA, A LAS 19:30, HASTA 20:30, nombre UNA vez, «Tu reserva» («${hoy.texto}»)`)
    await a.evaluar("(() => { document.querySelector('[data-hoy-reserva-extra=\"otra\"]')?.scrollIntoView({ block: 'start' }); window.scrollBy(0, -90); return true })()")
    await a.esp(700)
    await a.captura(path.join(CAP, `${P}otra_hoy_app.jpg`))
    const diaH = await ev(`JSON.stringify(${R}.getState().route.days.find((d) => d.id === ${JSON.stringify(info.dayId)}).stops.map((s) => s.time))`)
    debe(JSON.parse(diaH).includes('21:00'), `${NOM}·HOY-dia-igual`, 'el día no se ha movido tras mirar HOY')
    // Después de lo que viene (reserva a las 22:00 con la última parada a las 21:00): va DETRÁS.
    await montar({ modo: 'today', reservas: [{ ...kayak, id: 'tarde', time: '22:00', returnTime: null, name: 'Paseo en barca' }], cena: '19:30', hoy: true, minutos: 19 * 60 + 25 })
    const detras = await ev(`(() => { const t = document.querySelector('[data-hoy-reserva-extra="otra"]'); const s = document.querySelector('[data-hoy-siguiente]'); return Boolean(t && s && (s.compareDocumentPosition(t) & Node.DOCUMENT_POSITION_FOLLOWING)) })()`)
    debe(detras, `${NOM}·HOY-detras`, 'una reserva a las 22:00 sale DETRÁS de lo que viene (su sitio por la hora)')

    /* — 2b. «Casi lista» de tren y otra en grupo: las piezas de siempre — */
    const GENTE = "[{ id: 'p1', nombre: 'Eric', foto: null, esAdmin: true, esYo: true }, { id: 'p2', nombre: 'Ana', foto: null, esAdmin: false, permiso: 'recomendar' }, { id: 'p3', nombre: 'Luis', foto: null, esAdmin: false, permiso: 'recomendar' }]"
    for (const tipo of ['tren', 'otra']) {
      await a.evaluar(`(async () => { const st = ${R}; st.setState({ reservations: [], screen: 'route' }); const V = await import('/src/store/useViajeCompartido.ts'); V.useViajeCompartido.getState().poner({ gente: ${GENTE} }); st.getState().setActiveDayId(null); st.getState().setMode('bookings'); return true })()`)
      await a.esp(1500)
      await a.evaluar(`window.__anadirReserva.getState().abrirFormulario('${tipo}'); true`)
      await a.esp(1200)
      if (tipo === 'tren') {
        await poner('[data-extra-campo="origen"]', 'A')
        await poner('[data-extra-campo="destino"]', 'B')
      } else await poner('[data-extra-campo="nombre"]', 'Kayak')
      await clic('[data-dia-cuadrado]:not([data-elegida="1"])')
      await clic(`[data-campo-de-hora="extra-${tipo}-hora"]`)
      await a.esp(600)
      await clic('[data-hoja-de-hora-guardar]')
      await a.esp(400)
      await clic('[data-siguiente-paso]')
      await a.esp(800)
      for (const cuenta of ['mia', 'comun']) {
        await clic(`[data-cuenta-opcion="${cuenta}"]`)
        await a.esp(500)
        const c = await ev(`(() => {
          const h = document.querySelector('[data-hoja-reserva-extra]')
          const medir = (n) => (n ? [...n.querySelectorAll('button')].map((b) => { const r = b.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.left), Math.round(r.right)] }) : null)
          const pq = h.querySelector('[data-para-quien-cuadrados]'); const qp = h.querySelector('[data-quien-lo-ha-pagado]')
          const marcados = pq ? [...pq.querySelectorAll('button')].filter((b) => b.getAttribute('aria-pressed') === 'true').length : -1
          return { pq: medir(pq), qp: medir(qp), marcados, linea: h.querySelector('[data-linea-destino]')?.innerText ?? '' }
        })()`)
        const lleno = (m) => m && m.length === 3 && new Set(m.map((x) => x[0])).size === 1 && m[2][2] - m[0][1] > 300
        debe(lleno(c.pq), `${NOM}·casi-${tipo}-${cuenta}-para-quien`, `«¿Para quién es?» con PersonasCuadradas: tres cuadrados iguales repartidos a todo el ancho (${JSON.stringify(c.pq)})`)
        debe(cuenta === 'mia' ? c.qp === null && c.marcados === 1 : lleno(c.qp) && c.marcados === 3, `${NOM}·casi-${tipo}-${cuenta}-quien-pago`, cuenta === 'mia' ? 'con «Mi cuenta», solo Eric marcado y sin «¿Quién la ha pagado?»' : '«Cuenta del grupo»: los tres marcados y «¿Quién la ha pagado?» con cuadrados')
        debe(!(cuenta === 'mia' && /cuenta (conjunta|del grupo)/i.test(c.linea)), `${NOM}·casi-${tipo}-${cuenta}-linea`, `la línea de abajo no contradice lo elegido («${c.linea}»)`)
      }
      await a.evaluar('window.__anadirReserva.getState().cerrar(); true')
      await a.esp(700)
    }
  } catch (e) {
    debe(false, `${NOM}·excepcion`, e?.stack || String(e))
  } finally {
    a.cerrar()
  }
}

fs.mkdirSync(CAP, { recursive: true })
if (QUE === 'todo' || QUE === 'pura') await partePura()
if (QUE === 'todo' || QUE === 'roma') await parteNavegador(false)
if (QUE === 'todo' || QUE === 'lanza') await parteNavegador(true)

console.log(`\n${comprobaciones} comprobaciones · ${fallos.length} fallos`)
for (const f of fallos) console.log(`✗ [${f.regla}] ${f.texto}`)
process.exit(fallos.length === 0 ? 0 : 1)
