// V75 · «+ Añadir una reserva», ferry / tren / autobús / otra, sus bloques, los tres iconos y borrar con la hoja. PRUEBA DE LO QUE SE GUARDA Y SE BORRA.
//   APP_URL=http://localhost:5173 API_URL=http://localhost:8787 node scripts/destino/_conCola.mjs node scripts/destino/pruebaV75.mjs [pura|roma|lanza]      (sin argumento: las tres partes)
// Parte 1 (pura, SIN navegador): las funciones de `src/lib/reservasExtra.ts` y `src/lib/queEliminar.ts`, empaquetadas con esbuild.
// Parte 2 (Roma) y parte 3 (Lanzarote; exige la API normal): un Chrome de prueba cada una, por la cola. No toca el Supabase de producción (cuentas=off, sin sesión).
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
  console.log(cond ? '  ok' : '  MAL', regla, String(texto).slice(0, 170))
  if (!cond) fallos.push({ regla, texto })
}
const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b)

/* ═══ 1. La parte pura ═══ */
async function partePura() {
  console.log('1. Funciones puras (sin navegador)')
  const salida = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'v75pura-')), 'puras.mjs')
  const r = await build({
    stdin: { contents: "export * from './src/lib/reservasExtra.ts'; export * from './src/lib/queEliminar.ts'", resolveDir: process.cwd(), loader: 'ts' },
    bundle: true, write: false, format: 'esm', platform: 'node', logLevel: 'error', define: { 'import.meta.env': '{}' },
  })
  fs.writeFileSync(salida, r.outputFiles[0].text)
  const m = await import(pathToFileURL(salida).href)
  // El vuelo en un viaje de UN destino (R7a, R7b).
  debe(igual(m.accionDeVuelo({ unDestino: true, idaHecha: false, vueltaHecha: false }), { tipo: 'abrir', mitad: 'arrival' }), 'vuelo-ninguno', 'sin vuelos: se abre «Tu vuelo» de la ida')
  debe(igual(m.accionDeVuelo({ unDestino: true, idaHecha: true, vueltaHecha: false }), { tipo: 'abrir', mitad: 'departure' }), 'vuelo-ida', 'con la ida puesta: se abre directamente la vuelta')
  debe(igual(m.accionDeVuelo({ unDestino: true, idaHecha: true, vueltaHecha: true }), { tipo: 'ya-tiene-los-dos' }), 'vuelo-dos', 'con las dos: sale la hoja «Ya tienes tus vuelos»')
  debe(igual(m.accionDeVuelo({ unDestino: true, idaHecha: false, vueltaHecha: true }), { tipo: 'abrir', mitad: 'arrival' }), 'vuelo-solo-vuelta', 'solo la vuelta: se abre la ida')
  for (const [ida, vuelta] of [[false, false], [true, false], [true, true], [false, true]]) debe(igual(m.accionDeVuelo({ unDestino: false, idaHecha: ida, vueltaHecha: vuelta }), { tipo: 'multidestino' }), 'vuelo-multidestino', `multidestino (ida ${ida}, vuelta ${vuelta}): nada cambia`)
  // Las nueve casillas.
  debe(igual(m.CASILLAS_DE_ANADIR.map((c) => c.nombre), ['Vuelo', 'Tren', 'Autobús', 'Ferry', 'Coche de alquiler', 'Alojamiento', 'Entrada', 'Excursión o tour', 'Otra']), 'nueve-casillas', 'la cuadrícula de R2 tiene las nueve, en su orden')
  // Qué falta para guardar.
  const v = (tipo, c = {}) => ({ ...m.borradorVacio(tipo), ...c })
  debe(igual(m.loQueFalta(v('ferry')), ['dia', 'hora', 'origen', 'destino']), 'falta-ferry', `ferry vacío falta ${m.loQueFalta(v('ferry'))}`)
  debe(igual(m.loQueFalta(v('tren')), ['dia', 'hora', 'origen', 'destino']), 'falta-tren', 'tren vacío falta día, hora, de y a')
  debe(igual(m.loQueFalta(v('otra')), ['dia', 'hora', 'nombre']), 'falta-otra', 'otra vacía falta día, hora y nombre')
  debe(m.loQueFalta(v('ferry', { dayNumber: '2', hora: '10:00', origen: 'Órzola', destino: 'La Graciosa' })).length === 0, 'listo-ferry', 'con día, hora, de y a, el ferry se puede guardar (naviera, llegada, localizador y precio son opcionales)')
  debe(m.loQueFalta(v('otra', { dateIso: '2026-11-08', hora: '9:30', nombre: 'Tour en kayak' })).length === 0, 'listo-otra', 'otra con nombre, día y hora se puede guardar')
  debe(m.horaValida('10:00') && m.horaValida('9:05') && !m.horaValida('') && !m.horaValida('25') && !m.horaValida(null), 'hora-valida', 'horaValida')
  // Los nombres y lo que se guarda.
  debe(m.nombreDeLaReservaExtra(v('ferry', { destino: 'La Graciosa' })) === 'Ferry a La Graciosa' && m.nombreDeLaReservaExtra(v('tren', { destino: 'Florencia' })) === 'Tren a Florencia' && m.nombreDeLaReservaExtra(v('bus', { destino: 'Aeropuerto' })) === 'Autobús a Aeropuerto' && m.nombreDeLaReservaExtra(v('otra', { nombre: ' Tour en kayak ' })) === 'Tour en kayak', 'nombres', 'Ferry a…, Tren a…, Autobús a…, y en «otra» el nombre escrito')
  const f = m.construirReservaExtra(v('ferry', { dateIso: '2026-11-08', hora: '9:30', llegada: '10:15', compania: 'Fred. Olsen', origen: 'Órzola', destino: 'La Graciosa', localizador: ' K7M2QX ' }), { id: 'x1', precio: { amount: 50, currency: 'EUR' } }, true, 2)
  debe(f.kind === 'ferry' && f.id === 'x1' && f.refId === 'x1' && f.time === '09:30' && f.returnTime === '10:15' && f.dateIso === '2026-11-08' && f.dayNumber === null && f.locator === 'K7M2QX' && f.precio?.amount === 50 && f.noMueve === true && f.origen === 'Órzola' && f.destinoDeViaje === 'La Graciosa' && f.compania === 'Fred. Olsen', 'construir-ferry', `el ferry guardado: ${JSON.stringify({ k: f.kind, t: f.time, r: f.returnTime, d: f.dateIso, l: f.locator })}`)
  const sinFechas = m.construirReservaExtra(v('tren', { dayNumber: '3', hora: '8:00', origen: 'Termini', destino: 'Florencia', coche: '5', asiento: '12A' }), { id: 'x2', precio: null }, false, 3)
  debe(sinFechas.dateIso === null && sinFechas.dayNumber === 3 && sinFechas.coche === '5' && sinFechas.asiento === '12A' && sinFechas.precio === null, 'construir-tren-sin-fechas', 'sin fechas en el viaje se guarda el número de día; el tren lleva coche y asiento')
  const o = m.construirReservaExtra(v('otra', { dateIso: '2026-11-09', hora: '16:00', nombre: 'Tour en kayak', lugar: 'Playa de Famara', llegada: '18:00', coche: '9' }), { id: 'x3', precio: null }, true, 4)
  debe(o.lugar === 'Playa de Famara' && o.returnTime === null && o.coche === null && o.asiento === null && o.origen === null, 'construir-otra', '«otra» guarda el lugar y no lleva llegada, coche ni asiento')
  const ida = m.borradorDeLaReserva(f)
  debe(ida.tipo === 'ferry' && ida.origen === 'Órzola' && ida.destino === 'La Graciosa' && ida.hora === '09:30' && ida.llegada === '10:15' && ida.localizador === 'K7M2QX', 'borrador-de-vuelta', 'el lápiz: de la reserva al borrador devuelve lo escrito')
  // Los bloques.
  const reservas = [f, sinFechas, o, { id: 'e1', kind: 'entrada', refId: 'e1', name: 'Coliseo', time: '09:00', dateIso: '2026-11-08' }]
  debe(igual(m.bloquesExtra([]).map((b) => b.tipo), []) && igual(m.bloquesExtra([reservas[3]]).map((b) => b.tipo), []), 'bloques-vacios', 'sin ninguna guardada (o solo con una entrada) no sale ningún bloque')
  debe(igual(m.bloquesExtra(reservas).map((b) => b.tipo), ['ferry', 'tren', 'otra']), 'bloques-orden', 'los bloques salen en el orden Ferry, Tren, Autobús, Otras y solo los que tienen algo')
  debe(m.nombreDelBloqueExtra('ferry') === 'Ferry' && m.nombreDelBloqueExtra('tren') === 'Tren' && m.nombreDelBloqueExtra('bus') === 'Autobús' && m.nombreDelBloqueExtra('otra') === 'Otras reservas', 'bloques-nombres', 'nombres de los bloques')
  debe(m.textoGuardados(1) === '1 guardado' && m.textoGuardados(2) === '2 guardados', 'bloques-guardados', '«1 guardado» / «2 guardados»')
  debe(m.extrasDeUnTipo([...reservas, { ...f, id: 'x9', refId: 'x9', dateIso: '2026-11-07' }], 'ferry').map((r) => r.id).join() === 'x9,x1', 'bloques-orden-dias', 'dentro de un bloque, por día y hora')
  // Las frases de la hoja de borrar (D1-D2).
  debe(m.queEliminarTramo('avion', true) === 'tu vuelo de ida' && m.queEliminarTramo('avion', false) === 'tu vuelo de vuelta' && m.queEliminarTramo('tren', false) === 'tu tren de vuelta' && m.queEliminarTramo('ferry', true) === 'tu ferry de ida' && m.queEliminarTramo('bus', false) === 'tu autobús de vuelta', 'queEliminar-tramo', 'tu vuelo de ida / vuelta, tren, ferry, autobús')
  debe(m.queEliminarAlojamiento() === 'tu alojamiento' && m.queEliminarCoche() === 'tu coche de alquiler', 'queEliminar-aloj-coche', 'alojamiento y coche')
  debe(m.queEliminarEntrada('Coliseo, Foro y Palatino') === 'tu entrada del Coliseo', 'queEliminar-entrada', m.queEliminarEntrada('Coliseo, Foro y Palatino'))
  debe(m.queEliminarExcursion('La Graciosa') === 'tu excursión a La Graciosa' && m.queEliminarExcursion('Tour en kayak') === 'tu reserva de Tour en kayak', 'queEliminar-excursion', `${m.queEliminarExcursion('La Graciosa')} · ${m.queEliminarExcursion('Tour en kayak')}`)
  debe(m.queEliminarTransporteNuevo('ferry', 'La Graciosa') === 'tu ferry a La Graciosa' && m.queEliminarTransporteNuevo('tren', 'Florencia') === 'tu tren a Florencia' && m.queEliminarTransporteNuevo('otra', 'Tour en kayak') === 'tu reserva de Tour en kayak', 'queEliminar-nuevos', 'tu ferry a La Graciosa · tu tren a Florencia · tu reserva de Tour en kayak')
  debe(m.queEliminarTransporteNuevo('bus', 'el aeropuerto').startsWith('tu autobús a') && !/\ba el\b/.test(m.queEliminarTransporteNuevo('bus', 'el aeropuerto')), 'queEliminar-articulo', `sin «a el»: ${m.queEliminarTransporteNuevo('bus', 'el aeropuerto')}`)
  debe(m.queEliminarReservaExtra(f) === 'tu ferry a La Graciosa' && m.queEliminarReservaExtra(o) === 'tu reserva de Tour en kayak', 'queEliminar-reserva-extra', 'la frase sale de la reserva guardada')
}

/* ═══ 2 y 3. El navegador ═══ */
const R = "(await import('/src/store/useRouteStore.ts')).useRouteStore"
const ANTES = fs.readFileSync('scripts/destino/pruebaV43.mjs', 'utf8').match(/const ANTES = `([\s\S]*?)`/)[1]
const RUTA = '/?cuentas=off&logros=off&apertura=0&hoy2=on&version=pago'

async function parteNavegador(lanza) {
  const NOM = lanza ? 'Lanzarote' : 'Roma'
  console.log(`${lanza ? '3' : '2'}. En la app (${NOM}, iPhone 390x844)`)
  const a = await abrirApp(process.env.APP_URL ?? 'http://localhost:5173', { ruta: RUTA, antes: ANTES, ancho: 390, alto: 844 })
  const ev = (e) => a.evaluar(`(async () => (${e}))()`)
  const clic = (sel) => a.evaluar(`(() => { const b = document.querySelector(${JSON.stringify(sel)}); if (!b) return false; b.click(); return true })()`)
  const poner = (sel, valor) => a.evaluar(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return false; Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(e, ${JSON.stringify(valor)}); e.dispatchEvent(new Event('input', { bubbles: true })); return true })()`)
  const hora = async (sel) => {
    await clic(sel)
    await a.esp(700)
    await clic('[data-hoja-de-hora-guardar]')
    await a.esp(450)
  }
  const cerrarHojas = async () => {
    await a.evaluar("document.querySelectorAll('[role=dialog] button[aria-label=Cerrar]').forEach((b) => b.click()); true")
    await a.esp(500)
  }
  const contador = () => a.evaluar("(document.body.innerText.match(/(\\d+) de (\\d+) reservas listas/) || [''])[0]")
  const VUELOS = { arrivalFlightTime: '11:15', arrivalCodigo: 'VY 6102', arrivalCompania: 'Vueling', arrivalOtroPunto: 'Barcelona (El Prat)', arrivalOtraHora: '08:35', arrivalPointId: lanza ? 'ace' : 'fco', departureFlightTime: '19:40', departureCodigo: 'VY 6103', departureCompania: 'Vueling', departurePointId: lanza ? 'ace' : 'fco', departureOtroPunto: 'Barcelona (El Prat)', departureOtraHora: '21:35' }
  const SOLO_IDA = Object.fromEntries(Object.entries(VUELOS).filter(([k]) => !k.startsWith('departure')))
  const GENTE = "[{ id: 'p1', nombre: 'Eric', foto: null, esAdmin: true, esYo: true }, { id: 'p2', nombre: 'Ana', foto: null, esAdmin: false, permiso: 'recomendar' }, { id: 'p3', nombre: 'Luis', foto: null, esAdmin: false, permiso: 'recomendar' }]"
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
    // Pone el viaje (con las dos mitades del vuelo, solo la ida o ninguna), sin reservas, en RESERVAS.
    const montar = async ({ ruta = VUELOS, gente = false } = {}) => {
      await a.evaluar(`(async () => {
        const st = ${R}
        try { sessionStorage.clear() } catch {}
        const r = JSON.parse(window.__base)
        for (const k of ['arrivalFlightTime', 'arrivalCodigo', 'arrivalCompania', 'arrivalOtroPunto', 'arrivalOtraHora', 'departureFlightTime', 'departureCodigo', 'departureCompania', 'departureOtroPunto', 'departureOtraHora']) delete r[k]
        Object.assign(r, ${JSON.stringify(ruta)})
        const seg = (await import('/src/lib/tuAlojamiento.ts')).estanciasDelViaje(r)[0]
        st.setState({ route: r, reservations: [], screen: 'route', accommodationSelections: seg ? { [seg.segmentDayId]: { name: ${JSON.stringify(lanza ? 'The Colors House' : 'Hotel Quirinale')}, precio: null } } : {} })
        const V = await import('/src/store/useViajeCompartido.ts')
        V.useViajeCompartido.getState().poner({ gente: ${gente ? GENTE : '[]'} })
        st.getState().setActiveDayId(null); st.getState().setMode('bookings')
        return true })()`)
      await a.esp(2500)
    }

    /* — A. Guardar ferry, tren y otra: cada uno en SU bloque y en SU día — */
    await montar({ ruta: {} })
    const antes = await contador()
    debe(Boolean(antes), `${NOM}·contador`, `el contador sale («${antes}»)`)
    debe(await ev("document.querySelector('[data-anadir-una-reserva]') !== null"), `${NOM}·boton`, 'el botón «+ Añadir una reserva» sale')
    debe(await ev("document.querySelector('[data-otras-reservas]') === null && document.querySelectorAll('[data-blk^=\"extra-\"]').length === 0"), `${NOM}·sin-bloques`, 'sin ninguna guardada, no sale ningún bloque de ferry, tren, autobús ni otras')
    const dias = await ev(`${R}.getState().route.days.map((d) => d.id)`)
    debe(dias.length >= 3, `${NOM}·dias`, `el viaje tiene ${dias.length} días`)
    const guardar = async (tipo, campos, indiceDeDia, extra = async () => {}) => {
      await clic('[data-anadir-una-reserva]')
      await a.esp(600)
      await clic(`[data-casilla-anadir="${tipo}"]`)
      await a.esp(1100)
      for (const [campo, valor] of Object.entries(campos)) await poner(`[data-extra-campo="${campo}"]`, valor)
      debe(await ev("document.querySelector('[data-guardar-extra]')?.disabled === true"), `${NOM}·${tipo}-sin-lo-obligatorio`, `${tipo}: sin día ni hora, [Guardar] está desactivado`)
      const dia = await ev(`document.querySelectorAll('[data-dia-cuadrado]')[${indiceDeDia}]?.getAttribute('data-dia-cuadrado') ?? null`)
      await clic(`[data-dia-cuadrado="${dia}"]`)
      await a.esp(250)
      await hora(`[data-campo-de-hora="extra-${tipo}-hora"]`)
      await extra()
      debe(!(await ev("document.querySelector('[data-guardar-extra]')?.disabled ?? true")), `${NOM}·${tipo}-listo`, `${tipo}: con lo obligatorio, [Guardar] se activa`)
      await clic(`[data-guardar-extra="${tipo}"]`)
      await a.esp(1300)
      // (V76) Antes de guardar puede salir «¿Es para…?» (se contesta [No, guardarlo aparte]) y «Revisa las horas» si la hora de ejemplo (10:00) pisa una parada de ese día (se guarda igualmente): lo de V75 se comprueba igual.
      for (let i = 0; i < 3; i++) {
        if (await clic('[data-boton-hoja="unir-no"]')) await a.esp(1000)
        if (await clic('[data-enlace-hoja="guardarla-igualmente"]')) await a.esp(1100)
      }
      return dia
    }
    const diaFerry = await guardar('ferry', lanza ? { compania: 'Fred. Olsen', origen: 'Órzola', destino: 'La Graciosa' } : { compania: 'Caremar', origen: 'Nápoles', destino: 'Capri' }, 1, async () => {
      await hora('[data-campo-de-hora="extra-ferry-llegada"]')
      await poner('[data-extra-campo="localizador"]', 'K7M2QX')
      await poner('input[aria-label="Precio"], input[aria-label="¿Cuánto ha costado en total?"]', '50')
      await a.esp(300)
    })
    const diaTren = await guardar('tren', { compania: 'Italo', origen: 'Roma Termini', destino: 'Florencia', coche: '5', asiento: '12a' }, 2)
    const diaOtra = await guardar('otra', { nombre: 'Tour en kayak', lugar: 'Playa de Famara' }, 0)
    const lista = await ev(`${R}.getState().reservations.map((r) => ({ id: r.id, kind: r.kind, refId: r.refId, name: r.name, time: r.time, returnTime: r.returnTime ?? null, dateIso: r.dateIso ?? null, dayNumber: r.dayNumber ?? null, precio: r.precio ?? null, locator: r.locator ?? null, asiento: r.asiento ?? null, coche: r.coche ?? null, origen: r.origen ?? null, destinoDeViaje: r.destinoDeViaje ?? null, lugar: r.lugar ?? null }))`)
    debe(lista.length === 3 && ['ferry', 'tren', 'otra'].every((k) => lista.some((r) => r.kind === k)), `${NOM}·guardadas`, `3 reservas guardadas, una de cada tipo (${lista.map((r) => r.kind)})`)
    const ferry = lista.find((r) => r.kind === 'ferry')
    const tren = lista.find((r) => r.kind === 'tren')
    const otra = lista.find((r) => r.kind === 'otra')
    debe(ferry && ferry.time === '10:00' && ferry.returnTime === '10:45' && ferry.locator === 'K7M2QX' && ferry.precio?.amount === 50 && /^Ferry a /.test(ferry.name), `${NOM}·ferry-datos`, `ferry: salida 10:00, llegada 10:45, localizador y 50 € (${JSON.stringify({ t: ferry?.time, r: ferry?.returnTime, l: ferry?.locator, p: ferry?.precio?.amount })})`)
    debe(tren?.asiento === '12a' && tren?.coche === '5' && tren?.origen === 'Roma Termini' && tren?.destinoDeViaje === 'Florencia', `${NOM}·tren-datos`, 'tren: de, a, coche y asiento')
    debe(otra?.name === 'Tour en kayak' && otra?.lugar === 'Playa de Famara', `${NOM}·otra-datos`, 'otra: nombre y lugar')
    // En su día: la fecha guardada es la del día que se tocó.
    const fechaDe = (id) => ev(`(async () => { const B = await import('/src/lib/bookings.ts'); const r = ${R}.getState().route; const d = r.days.find((x) => x.id === ${JSON.stringify(id)}); return { iso: B.dateOfDay(r, d), n: d.dayNumber } })()`)
    for (const [r, dia, tipo] of [[ferry, diaFerry, 'ferry'], [tren, diaTren, 'tren'], [otra, diaOtra, 'otra']]) {
      const f = await fechaDe(dia)
      debe(r && (f.iso ? r.dateIso === f.iso : r.dayNumber === f.n), `${NOM}·${tipo}-dia`, `${tipo} queda en el día elegido (${f.iso ?? 'día ' + f.n}; guardado ${r?.dateIso ?? 'día ' + r?.dayNumber})`)
    }
    debe(new Set([ferry.dateIso ?? ferry.dayNumber, tren.dateIso ?? tren.dayNumber, otra.dateIso ?? otra.dayNumber]).size === 3, `${NOM}·tres-dias`, 'los tres están en tres días distintos (cada uno en el suyo)')
    // En su bloque.
    const bloques = await ev("[...document.querySelectorAll('[data-blk^=\"extra-\"]')].map((e) => e.getAttribute('data-blk'))")
    debe(igual(bloques, ['extra-ferry', 'extra-tren', 'extra-otra']), `${NOM}·bloques`, `bloques en orden Ferry, Tren, Otras (${bloques})`)
    debe(await ev("(() => { const u = [...document.querySelectorAll('*')].find((e) => e.children.length === 0 && /Útil para el viaje/i.test(e.textContent || '')); const b = document.querySelector('[data-blk=\"extra-otra\"]'); return Boolean(u && b && (b.compareDocumentPosition(u) & Node.DOCUMENT_POSITION_FOLLOWING)) })()"), `${NOM}·antes-de-util`, 'los bloques nuevos van antes de «Útil para el viaje»')
    debe(await ev(`(() => { const t = (tipo, id) => document.querySelector('[data-blk="extra-' + tipo + '"] [data-extra-id="' + id + '"]'); return Boolean(t('ferry', ${JSON.stringify(ferry.id)}) && t('tren', ${JSON.stringify(tren.id)}) && t('otra', ${JSON.stringify(otra.id)})) })()`), `${NOM}·tarjeta-en-su-bloque`, 'cada tarjeta está dentro del bloque de su tipo')
    debe(await ev("[...document.querySelectorAll('[data-blk^=\"extra-\"] [data-estado]')].every((e) => e.textContent === '1 guardado')"), `${NOM}·1-guardado`, 'cada bloque dice «1 guardado»')
    const nombres = await ev("[...document.querySelectorAll('[data-blk^=\"extra-\"]')].map((e) => e.innerText.split('\\n')[0].trim())")
    debe(nombres[0] === 'Ferry' && nombres[1] === 'Tren' && /Otras reservas/.test(nombres[2]), `${NOM}·nombres-bloques`, `nombres de los bloques (${nombres})`)
    debe(await ev(`document.querySelector('[data-extra-id="${ferry.id}"]').innerText.includes('Sube tu billete') && document.querySelector('[data-extra-id="${otra.id}"]').innerText.includes('Sube tu reserva')`), `${NOM}·sube-billete`, 'primero se guarda, después se sube: la tarjeta lleva «+ Sube tu billete» / «Sube tu reserva»')
    debe((await contador()) === antes, `${NOM}·contador-igual`, `el contador «X de N reservas listas» no cambia con las extras (${antes} → ${await contador()})`)
    // El precio entra en los gastos.
    const lineas = () => ev(`(async () => { const P = await import('/src/lib/presupuesto.ts'); const s = ${R}.getState(); const p = P.construirPresupuesto({ route: s.route, reservations: s.reservations, accommodationSelections: {}, transportBookings: {}, insuranceBooking: null, rentalVehicleBooking: null, esimPrecios: {}, moneda: 'EUR', cambio: null, pago: true }); return p.bloques.flatMap((b) => b.lineas.map((l) => l.id)) })()`)
    debe((await lineas()).includes(`reserva-${ferry.id}`), `${NOM}·gasto`, 'el ferry de 50 € entra en el presupuesto')
    // Los tres iconos, de izquierda a derecha: QR, lápiz, papelera.
    for (const tipo of ['ferry', 'tren', 'otra']) {
      const id = lista.find((r) => r.kind === tipo).id
      const p = await ev(`(() => { const t = document.querySelector('[data-extra-id="${id}"]'); const g = (s) => { const e = t.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return { l: b.left, t: b.top, w: b.width } }; return { q: g('[data-icono-documento]'), l: g('[data-lapiz]'), p: g('[data-papelera]'), tarjeta: t.getBoundingClientRect().right } })()`)
      debe(p.q && p.l && p.p && p.q.l < p.l.l && p.l.l < p.p.l && Math.abs(p.q.t - p.p.t) < 6 && Math.abs(p.l.t - p.p.t) < 6, `${NOM}·${tipo}-tres-iconos`, `${tipo}: QR, lápiz y papelera en ese orden y en la misma fila (${p.q && Math.round(p.q.l)}, ${p.l && Math.round(p.l.l)}, ${p.p && Math.round(p.p.l)})`)
      debe(p.p && p.p.l + p.p.w <= p.tarjeta + 1 && p.p.l > 200, `${NOM}·${tipo}-papelera-arriba-derecha`, `${tipo}: la papelera está arriba a la derecha de la tarjeta`)
      debe(await ev(`document.querySelector('[data-extra-id="${id}"] [data-icono-documento]')?.getAttribute('data-icono-documento') === 'falta'`), `${NOM}·${tipo}-qr-gris`, `${tipo}: sin billete, el icono del documento sale gris con «+»`)
    }
    // El billete puesto: QR dorado, y el billete se borra con la reserva.
    await a.evaluar(`(async () => { const B = (await import('/src/store/useBilleteStore.ts')).useBilleteStore; const tid = (await import('/src/store/useSyncStore.ts')).useSyncStore.getState().activeTripId ?? null; B.getState().cargar(tid); B.getState().ponerExcursion(tid, ${JSON.stringify(ferry.id)}, { personas: null, localizador: 'K7M2QX', codigo: { texto: 'X', formato: 'qr', imagen: null, dibujo: 'data:image/svg+xml;utf8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 4 4%22%3E%3Crect width=%224%22 height=%224%22 fill=%22%23000%22/%3E%3C/svg%3E' }, dueno: null }); return true })()`)
    await a.esp(900)
    debe(await ev(`document.querySelector('[data-extra-id="${ferry.id}"] [data-icono-documento="si"]') !== null && document.querySelector('[data-extra-id="${ferry.id}"] [data-extra-codigo]') !== null`), `${NOM}·qr-dorado`, 'con el billete guardado, el QR sale dorado y la tarjeta enseña el código')

    /* — B. Borrar con la hoja — */
    const borrar = async (r, tipo, frase) => {
      await clic(`[data-extra-id="${r.id}"] [data-papelera]`)
      await a.esp(700)
      const hoja = await ev("document.querySelector('[data-hoja^=\"eliminar-\"]')?.innerText ?? ''")
      const titulo = await ev("document.querySelector('[data-hoja^=\"eliminar-\"]')?.closest('[role=dialog]')?.getAttribute('aria-label') ?? document.querySelector('[role=dialog]')?.getAttribute('aria-label') ?? ''")
      debe((titulo + ' ' + hoja).includes(`¿Seguro que quieres eliminar ${frase}?`), `${NOM}·${tipo}-hoja-texto`, `la hoja pregunta «¿Seguro que quieres eliminar ${frase}?» (${(titulo || hoja).replace(/\s+/g, ' ').slice(0, 90)})`)
      debe(/Se borrará de tus reservas y no se puede deshacer\./.test(hoja), `${NOM}·${tipo}-hoja-aviso`, 'y debajo «Se borrará de tus reservas y no se puede deshacer.»')
      const par = await ev("(() => { const c = document.querySelector('[data-boton-hoja=\"eliminar-cancelar\"]'), s = document.querySelector('[data-eliminar-confirmar]'); if (!c || !s) return null; const a = c.getBoundingClientRect(), b = s.getBoundingClientRect(); return { dt: Math.abs(a.top - b.top), izq: a.left < b.left, c: c.textContent.trim(), s: s.textContent.trim() } })()")
      debe(par && par.dt < 3 && par.izq && /Cancelar/.test(par.c) && /Sí, eliminar/.test(par.s), `${NOM}·${tipo}-hoja-botones`, `[Cancelar] y [Sí, eliminar] lado a lado (${JSON.stringify(par)})`)
      const antesN = await ev(`${R}.getState().reservations.length`)
      await clic('[data-boton-hoja="eliminar-cancelar"]')
      await a.esp(600)
      debe((await ev(`${R}.getState().reservations.length`)) === antesN && (await ev(`document.querySelector('[data-hoja^="eliminar-"]') === null`)) && (await ev(`document.querySelector('[data-extra-id="${r.id}"]') !== null`)), `${NOM}·${tipo}-cancelar`, '[Cancelar] cierra la hoja y no borra nada')
      await clic(`[data-extra-id="${r.id}"] [data-papelera]`)
      await a.esp(600)
      await clic('[data-eliminar-confirmar]')
      await a.esp(1000)
      debe((await ev(`${R}.getState().reservations.length`)) === antesN - 1 && !(await ev(`${R}.getState().reservations.some((x) => x.id === ${JSON.stringify(r.id)})`)), `${NOM}·${tipo}-borrada`, '[Sí, eliminar] borra la reserva')
      debe(await ev(`document.querySelector('[data-extra-id="${r.id}"]') === null && document.querySelector('[data-blk="extra-${tipo}"]') === null`), `${NOM}·${tipo}-bloque-se-va`, `sin ${tipo} guardado, su bloque ya no sale`)
      debe(await ev(`(async () => { const B = (await import('/src/store/useBilleteStore.ts')).useBilleteStore; return !B.getState().datos.excursiones?.[${JSON.stringify(r.id)}] })()`), `${NOM}·${tipo}-billete`, 'su billete también se borra')
      debe(!(await lineas()).includes(`reserva-${r.id}`), `${NOM}·${tipo}-gasto`, 'su gasto sale del presupuesto')
    }
    await borrar(ferry, 'ferry', lanza ? 'tu ferry a La Graciosa' : 'tu ferry a Capri')
    debe((await contador()) === antes, `${NOM}·contador-tras-borrar`, 'el contador sigue igual tras borrar')
    await borrar(tren, 'tren', 'tu tren a Florencia')
    await borrar(otra, 'otra', 'tu reserva de Tour en kayak')
    debe(await ev("document.querySelector('[data-otras-reservas]') === null && document.querySelectorAll('[data-blk^=\"extra-\"]').length === 0"), `${NOM}·todo-borrado`, 'sin ninguna guardada, no queda ningún bloque nuevo')

    /* — C. Tren y autobús: también se guardan (el autobús, solo con lo obligatorio) — */
    await guardar('bus', { compania: 'Alsa', origen: 'Sur', destino: 'Aeropuerto' }, 1)
    const bus = await ev(`${R}.getState().reservations.find((r) => r.kind === 'bus')`)
    debe(bus && bus.name.startsWith('Autobús a') && bus.returnTime === null && bus.precio == null && (await ev("document.querySelector('[data-blk=\"extra-bus\"]') !== null")), `${NOM}·bus`, 'un autobús solo con lo obligatorio se guarda y saca su bloque «Autobús»')
    await clic(`[data-extra-id="${bus.id}"] [data-papelera]`)
    await a.esp(600)
    debe(/eliminar tu autobús a/.test(await ev("document.querySelector('[role=dialog]')?.getAttribute('aria-label') ?? ''")), `${NOM}·bus-hoja`, 'la hoja de borrar del autobús: «tu autobús a…»')
    await clic('[data-eliminar-confirmar]')
    await a.esp(900)

    /* — D. El vuelo en un viaje de un solo destino — */
    const abrirVuelo = async () => {
      await clic('[data-anadir-una-reserva]')
      await a.esp(700)
      await clic('[data-casilla-anadir="vuelo"]')
      await a.esp(1700)
    }
    await montar({ ruta: {} })
    await abrirVuelo()
    let t = await ev("[...document.querySelectorAll('[role=dialog]')].map((d) => d.innerText).join(' | ')")
    debe(/Tu vuelo/.test(t) && !/Día de vuelta/.test(t) && !(await ev("document.querySelector('[data-hoja=\"ya-tienes-vuelos\"]') !== null")), `${NOM}·vuelo-ninguno`, `sin vuelos, «Vuelo» abre «Tu vuelo» de la ida (${t.replace(/\s+/g, ' ').slice(0, 60)})`)
    await cerrarHojas()
    await montar({ ruta: SOLO_IDA })
    await abrirVuelo()
    t = await ev("[...document.querySelectorAll('[role=dialog]')].map((d) => d.innerText).join(' | ')")
    debe(/Tu vuelo/.test(t) && /Día de vuelta/.test(t) && !(await ev("document.querySelector('[data-hoja=\"ya-tienes-vuelos\"]') !== null")), `${NOM}·vuelo-con-ida`, `con la ida puesta, «Vuelo» abre directamente la vuelta («Día de vuelta»; ${t.replace(/\s+/g, ' ').slice(0, 60)})`)
    await cerrarHojas()
    await montar({ ruta: VUELOS })
    await abrirVuelo()
    t = await ev("document.querySelector('[data-hoja=\"ya-tienes-vuelos\"]')?.innerText ?? ''")
    debe(/Ya tienes tus vuelos/.test(t) && /¿Quieres cambiar alguno\?/.test(t), `${NOM}·vuelo-dos`, `con las dos, sale «Ya tienes tus vuelos. ¿Quieres cambiar alguno?» (${t.replace(/\s+/g, ' ').slice(0, 80)})`)
    const botones = await ev("(() => { const i = document.querySelector('[data-boton-hoja=\"cambiar-ida\"]'), v = document.querySelector('[data-boton-hoja=\"cambiar-vuelta\"]'); if (!i || !v) return null; const a = i.getBoundingClientRect(), b = v.getBoundingClientRect(); return { dt: Math.abs(a.top - b.top), izq: a.left < b.left, ti: i.textContent.trim(), tv: v.textContent.trim(), dentro: Boolean(i.closest('[data-dos-botones]')) } })()")
    debe(botones && botones.dt < 3 && botones.izq && botones.dentro && /Cambiar la ida/.test(botones.ti) && /Cambiar la vuelta/.test(botones.tv), `${NOM}·vuelo-botones`, `[Cambiar la ida] y [Cambiar la vuelta] lado a lado (${JSON.stringify(botones)})`)
    await clic('[data-boton-hoja="cambiar-vuelta"]')
    await a.esp(1700)
    t = await ev("[...document.querySelectorAll('[role=dialog]')].map((d) => d.innerText).join(' | ')")
    debe(/Día de vuelta/.test(t) && !(await ev("document.querySelector('[data-hoja=\"ya-tienes-vuelos\"]') !== null")), `${NOM}·cambiar-vuelta`, '[Cambiar la vuelta] abre «Tu vuelo» en la vuelta')
    await cerrarHojas()
    await abrirVuelo()
    await clic('[data-boton-hoja="cambiar-ida"]')
    await a.esp(1700)
    t = await ev("[...document.querySelectorAll('[role=dialog]')].map((d) => d.innerText).join(' | ')")
    debe(/Tu vuelo/.test(t) && !/Día de vuelta/.test(t), `${NOM}·cambiar-ida`, '[Cambiar la ida] abre «Tu vuelo» en la ida')
    await cerrarHojas()
    debe((await ev(`${R}.getState().reservations.length`)) === 0, `${NOM}·vuelo-no-crea-reservas`, 'el vuelo no se guarda como una reserva extra (sigue en su sitio de siempre)')

    /* — E. En grupo: dos pasos y el gasto se reparte — */
    await montar({ ruta: {}, gente: true })
    const antesG = await contador()
    await a.evaluar("window.__anadirReserva.getState().abrirFormulario('ferry'); true")
    await a.esp(1100)
    await poner('[data-extra-campo="origen"]', lanza ? 'Órzola' : 'Nápoles')
    await poner('[data-extra-campo="destino"]', lanza ? 'La Graciosa' : 'Capri')
    await clic('[data-dia-cuadrado]:not([data-elegida="1"])')
    await hora('[data-campo-de-hora="extra-ferry-hora"]')
    debe(await ev("document.querySelector('[data-siguiente-paso]') !== null && document.querySelector('[data-guardar-extra]') === null"), `${NOM}·grupo-siguiente`, 'en grupo, el botón del primer paso es [Siguiente]')
    await clic('[data-siguiente-paso]')
    await a.esp(700)
    const paso2 = await ev("document.querySelector('[data-hoja-reserva-extra]').innerText")
    debe(/Casi lista/.test(paso2) && /¿A qué cuenta lo sumamos\?/.test(paso2), `${NOM}·grupo-casi-lista`, 'el segundo paso es «Casi lista» con «¿A qué cuenta lo sumamos?»')
    await clic('[data-cuenta-opcion="comun"]')
    await a.esp(300)
    await poner('input[aria-label="Precio"], input[aria-label="¿Cuánto ha costado en total?"]', '90')
    await a.esp(300)
    const cuerpo = await ev('document.body.innerText')
    debe(/¿Para quién es el ferry\?/.test(cuerpo) && /¿Quién la ha pagado\?/.test(cuerpo), `${NOM}·grupo-para-quien`, 'salen «¿Para quién es el ferry?» y «¿Quién la ha pagado?»')
    await clic('[data-guardar-extra="ferry"]')
    await a.esp(1300)
    // (V76) Si la hora de ejemplo pisa una parada de ese día: «Revisa las horas» › «Guardarla igualmente» (y «¿Es para…?» › [No, guardarlo aparte]).
    for (let i = 0; i < 3; i++) {
      if (await clic('[data-boton-hoja="unir-no"]')) await a.esp(1000)
      if (await clic('[data-enlace-hoja="guardarla-igualmente"]')) await a.esp(1100)
    }
    const g = await ev(`${R}.getState().reservations.find((r) => r.kind === 'ferry')`)
    debe(g && g.precio?.amount === 90 && igual(g.paraQuien, ['p1', 'p2', 'p3']) && igual(g.pagadoPor, ['p1']), `${NOM}·grupo-guarda`, `el ferry de grupo guarda 90 €, para los tres y pagado por Eric (${JSON.stringify({ p: g?.precio?.amount, q: g?.paraQuien, pg: g?.pagadoPor })})`)
    const reparto = (ids, pagado) => ev(`(async () => { const P = await import('/src/lib/presupuesto.ts'); const s = ${R}.getState(); const gente = ['p1','p2','p3']; const p = P.construirPresupuesto({ route: s.route, reservations: s.reservations, accommodationSelections: {}, transportBookings: {}, insuranceBooking: null, rentalVehicleBooking: null, esimPrecios: {}, moneda: 'EUR', cambio: null, pago: true, compartido: { gastos: [], extrasDeLaRutaMios: true, reparto: { yoId: 'p1', adminId: 'p1', modo: 'conjunta', esInvitado: false, todos: gente, porDefecto: gente, entreDe: null, conVueloPropio: [], conAlojamientoPropio: [], reservasPropias: [], entradasDeInvitados: [], loSuyo: null } } }); const l = p.bloques.flatMap((b) => b.lineas).find((x) => x.id === 'reserva-' + s.reservations.find((r) => r.kind === 'ferry').id); return l ? { entre: l.entre ?? null, pago: l.precio?.amount } : null })()`)
    const rep = await reparto()
    debe(rep && rep.pago === 90 && igual(rep.entre, ['p1', 'p2', 'p3']), `${NOM}·grupo-reparto`, `el gasto del ferry va entre los tres (${JSON.stringify(rep)})`)
    // Solo dos de tres: el gasto va solo entre ellos (regla V46).
    await a.evaluar(`(async () => { const st = ${R}; st.setState({ reservations: st.getState().reservations.map((r) => r.kind === 'ferry' ? { ...r, paraQuien: ['p1', 'p3'] } : r) }); return true })()`)
    const rep2 = await reparto()
    debe(rep2 && igual(rep2.entre, ['p1', 'p3']), `${NOM}·grupo-solo-dos`, `con «¿Para quién es?» solo Eric y Luis, el gasto va solo entre ellos (${JSON.stringify(rep2)})`)
    debe((await contador()) === antesG, `${NOM}·grupo-contador`, 'el contador no cambia con el ferry de grupo')
    // Borrar en grupo: también el gasto.
    await clic(`[data-extra-id="${g.id}"] [data-papelera]`)
    await a.esp(600)
    await clic('[data-eliminar-confirmar]')
    await a.esp(900)
    debe((await ev(`${R}.getState().reservations.length`)) === 0 && (await reparto()) === null, `${NOM}·grupo-borrar`, 'borrar el ferry de grupo quita también su gasto')
  } catch (e) {
    debe(false, `${NOM}·excepcion`, e?.stack || String(e))
  } finally {
    a.cerrar()
  }
}

if (QUE === 'todo' || QUE === 'pura') await partePura()
if (QUE === 'todo' || QUE === 'roma') await parteNavegador(false)
if (QUE === 'todo' || QUE === 'lanza') await parteNavegador(true)

console.log(`\n${comprobaciones} comprobaciones · ${fallos.length} fallos`)
for (const f of fallos) console.log(`✗ [${f.regla}] ${f.texto}`)
process.exit(fallos.length === 0 ? 0 : 1)
