// RETOQUES_TARJETAS 5c y 5e (6-nov): RESERVAS. El bloque del coche como los demás (mismo color, cerrado al entrar, «SÚPER RECOMENDADO») y todo lo que se reserva cuenta en «x de N listo»
// (la ficha del coche y una ficha por cada excursión de la ruta, con el bloque «Excursiones»). Vale para todos los destinos: lo mismo en Lanzarote y en Roma.
//   Necesita Vite 5173 y la API 8787 con DESTINOS_OCULTOS='-' (Lanzarote visible). Un solo Chrome, que se cierra al acabar:
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/pruebaRetoquesReservas.mjs
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { build } from 'esbuild'
import { abrirApp } from './_enLaApp.mjs'
import { conViaje } from './_10n5_comun.mjs'

let total = 0
const fallos = []
const debe = (ok, id, texto) => {
  total += 1
  if (!ok) fallos.push(`[${id}] ${texto}`)
}
const leer = (f) => fs.readFileSync(f, 'utf8')
const sinComentarios = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')

// ── 1. La regla pura (sin navegador): qué excursión tiene un día y cómo se llama su ficha ──
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'retoquesres-'))
let B
try {
  const salida = path.join(tmp, 'bookings.mjs')
  await build({ entryPoints: ['src/lib/bookings.ts'], bundle: true, platform: 'node', format: 'esm', outfile: salida, logLevel: 'silent', define: { 'import.meta.env': '{}' } })
  B = await import(pathToFileURL(salida).href)
} finally {
  fs.rmSync(tmp, { recursive: true, force: true })
}
const eric = JSON.parse(leer('docs/dias/_hoy3_ruta_eric.json')).route
const dia4 = eric.days[3]
debe(dia4.dayType === 'excursion' && !dia4.selectedExcursionId, '1a', 'el viaje de Eric: el día 4 es de excursión y no trae ninguna elegida (el caso que antes no contaba)')
debe(B.excursionDeUnDia(dia4)?.id === 'la_graciosa', '1b', 'el día «La Graciosa (excursión)» tiene la excursión La Graciosa')
debe(B.excursionDeUnDia(eric.days[0]) === null && B.excursionDeUnDia(eric.days[4]) === null, '1c', 'los días normales no tienen excursión')
const filas = B.excursionesDeLaRuta(eric, [])
debe(filas.length === 1 && filas[0].excursion.id === 'la_graciosa' && filas[0].reservation === null, '1d', 'una excursión en la ruta de Eric, sin reservar')
debe(B.nombreCortoDeExcursion({ id: 'la_graciosa', title: 'La Graciosa' }) === 'Isla La Graciosa', '1e', 'la ficha de La Graciosa se llama «Isla La Graciosa»')
debe(B.nombreCortoDeExcursion({ id: 'x', title: 'Florencia y Pisa (en tren)' }) === 'Florencia y Pisa', '1f', 'una excursión sin nombre corto propio: su título sin lo de entre paréntesis')
const reservada = B.excursionesDeLaRuta(eric, [{ id: 'r1', kind: 'excursion', refId: 'la_graciosa' }])
debe(reservada[0].reservation?.id === 'r1', '1g', 'con la reserva puesta, la excursión sale reservada')
const conElegida = { ...dia4, selectedExcursionId: 'fuerteventura' }
debe(B.excursionDeUnDia(conElegida)?.id === 'fuerteventura', '1h', 'una excursión elegida manda sobre el nombre del día (como en Roma)')
debe(B.buildExcursionRow(eric, []).excursion?.id === 'la_graciosa', '1i', 'buildExcursionRow (la fila del bloque y del % de listo) también ve la de Eric')

// ── 2. El código ──
const panel = sinComentarios(leer('src/components/route/ReservasPanel.tsx'))
debe(/bloque: 'coche' as const/.test(panel) && /llevaCoche/.test(panel) && /esDestinoDeCoche\(route\.destination\) && unDestino/.test(panel), '2a', 'el resumen lleva la ficha del coche solo en los destinos de coche')
debe(/cocheElegido === 'propio' \|\| Boolean\(rentalVehicleBooking\)/.test(panel), '2b', 'con «Mi coche» la ficha del coche ya está hecha')
debe(/excursionesDeRuta\.map\(/.test(panel) && /nombreCortoDeExcursion/.test(panel), '2c', 'una ficha por cada excursión de la ruta, con su nombre corto')
debe(/<CocheDeViaje abierto=\{Boolean\(abiertos\.coche\)\}/.test(panel), '2d', 'el bloque del coche se abre con su ficha')
const coche = leer('src/components/route/reservas/CocheDeViaje.tsx')
const cocheSin = sinComentarios(coche)
debe(/<BloqueClaro bloque="coche">/.test(cocheSin) && /<CabeceraBloque/.test(cocheSin) && !/TARJETA/.test(cocheSin) && !/rgba\(181,138,46,\.45\)'?,\s*\n?\s*boxShadow/.test(cocheSin), '2e', 'el coche usa el bloque claro y la cabecera de los demás; sin el borde dorado propio')
debe(/desplegado = desplegadoUsuario \?\? abierto/.test(cocheSin) && /\{desplegado && \(/.test(cocheSin), '2f', 'el coche entra cerrado y se abre al tocarlo')
debe(/coche === 'alquiler' && !rentalBooking && \(\s*<span\s+data-coche-super-recomendado/.test(cocheSin) && /Súper recomendado/.test(cocheSin), '2g', '«SÚPER RECOMENDADO» solo con «Coche de alquiler» y sin reserva')
const store = leer('src/store/useReservasFocusStore.ts')
debe(/'excursiones' \| 'coche'/.test(store), '2h', 'la ficha puede pedir el bloque del coche')
const exc = leer('src/components/route/reservas/ExcursionesReservas.tsx')
debe(/excursionesDeLaRuta\(route, reservations\)/.test(exc) && /hasEnoughDaysForExcursions\(route, info\.fromDays\) \|\| hayDiaDeExcursion/.test(exc), '2i', 'el bloque «Excursiones» sale con un día de excursión aunque el destino no marque `excursiones_desde_dias` (Lanzarote)')
const ready = leer('src/hooks/useTripReadiness.ts')
debe(/filaExcursion\.excursion/.test(ready), '2j', 'el % de viaje listo también cuenta la excursión de Lanzarote')

// ── 3. En la pantalla: Lanzarote (el viaje de Eric) ──
const ev = (a, js) => a.evaluar(js)
const fichas = (a) => ev(a, "Array.from(document.querySelectorAll('[data-clave-resumen]')).map((b) => ({ id: b.getAttribute('data-clave-resumen'), nombre: (b.innerText || '').trim(), hecha: /✓/.test(b.innerText || '') }))")
const cuenta = (a) => ev(a, "(() => { const e = document.querySelector('[data-blk=\"resumen\"] em'); return e ? e.innerText.trim() : null })()")
const cierraAvisos = async (a) => {
  for (let i = 0; i < 5; i++) {
    const h = await ev(a, "(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale|Cerrar|Ahora no)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
    if (!h) break
    await a.esp(500)
  }
}
const irAReservas = async (a) => {
  await ev(a, "window.__ruta.getState().setMode('bookings'); true")
  await a.esp(2200)
  await cierraAvisos(a)
}
const a = await abrirApp('http://localhost:5173', { ruta: '/?cuentas=off&logros=on&logrosDemo=1&apertura=0&hoy2=on&version=completa', ancho: 390, alto: 844 })
try {
  for (let i = 0; i < 60 && !(await ev(a, "typeof window.__rutaLanzarote === 'function'").catch(() => false)); i++) await a.esp(500)
  await ev(a, "window.__rutaLanzarote({ coche: 'alquiler', hoy: '2026-11-08' }).then(() => true)")
  await cierraAvisos(a)
  await irAReservas(a)
  const f1 = await fichas(a)
  console.log('  Lanzarote (Eric):', (await cuenta(a)) + ' ·', f1.map((f) => f.nombre.replace(/\s+/g, ' ')).join(' | '))
  debe((await cuenta(a)) === '0 de 5 listo', '3a', `el viaje de Eric dice «0 de 5 listo» (dice ${await cuenta(a)})`)
  debe(f1.length === 5 && f1.some((f) => f.id === 'coche' && /Alquiler coche/.test(f.nombre)) && f1.some((f) => f.id === 'excursion-la_graciosa' && /Isla La Graciosa/.test(f.nombre)), '3b', `las fichas: Llegada y vuelta, Alojamiento, Alquiler coche, Entradas e Isla La Graciosa (salen: ${f1.map((f) => f.nombre).join(' | ')})`)
  debe(f1.every((f) => !f.hecha), '3c', 'ninguna ficha hecha todavía')
  // El coche: cerrado al entrar, con su etiqueta y de los mismos colores que los demás bloques
  const estadoCoche = await ev(a, "(() => { const b = document.querySelector('[data-blk=\"coche\"]'); const e = document.querySelector('[data-blk=\"excursiones\"]'); if (!b || !e) return null; const s = (x) => { const c = getComputedStyle(x); return { fondo: c.backgroundColor, borde: c.borderTopColor, radio: c.borderTopLeftRadius } }; return { coche: s(b), excursiones: s(e), cerrado: !document.querySelector('[data-coche-reservar]'), pastilla: Boolean(document.querySelector('[data-coche-super-recomendado]')), cabecera: Boolean(document.querySelector('[data-cabecera-coche]')), titulo: (document.querySelector('[data-cabecera-coche]')?.innerText || '').replace(/\\s+/g, ' ').trim() } })()")
  debe(estadoCoche && JSON.stringify(estadoCoche.coche) === JSON.stringify(estadoCoche.excursiones), '3d', `el coche y «Excursiones» tienen el mismo fondo, borde y esquinas (${JSON.stringify(estadoCoche)})`)
  debe(estadoCoche?.cerrado === true && estadoCoche.cabecera, '3e', 'el coche entra cerrado (sin [Reservar coche] a la vista)')
  debe(/Coche/.test(estadoCoche?.titulo ?? '') && /Lanzarote/.test(estadoCoche?.titulo ?? '') && /Falta/.test(estadoCoche?.titulo ?? ''), '3f', `cerrado dice «Coche», «Lanzarote» y «Falta» (dice «${estadoCoche?.titulo}»)`)
  debe(estadoCoche?.pastilla === true, '3g', '«SÚPER RECOMENDADO» con «Coche de alquiler» y sin reserva')
  // La ficha abre el bloque
  await ev(a, "document.querySelector('[data-clave-resumen=\"coche\"]')?.click(); true")
  await a.esp(1200)
  debe(await ev(a, "Boolean(document.querySelector('[data-coche-reservar]'))"), '3h', 'tocar la ficha «Alquiler coche» abre el bloque del coche')
  // Con «Mi coche»: la ficha en verde, sin etiqueta
  await ev(a, "window.__ruta.getState().setCocheDeViaje('propio'); true")
  await a.esp(900)
  const propio = await fichas(a)
  const fCoche = propio.find((f) => f.id === 'coche')
  debe(fCoche?.hecha === true && (await ev(a, "!document.querySelector('[data-coche-super-recomendado]')")), '3i', `con «Mi coche» la ficha del coche sale hecha y sin etiqueta (${JSON.stringify(fCoche)})`)
  debe((await cuenta(a)) === '1 de 5 listo', '3j', `con «Mi coche» pasa a «1 de 5 listo» (dice ${await cuenta(a)})`)
  // De vuelta a alquiler y con la reserva puesta: «Listo», sin etiqueta
  await ev(a, "window.__ruta.getState().setCocheDeViaje('alquiler'); window.__ruta.getState().setRentalVehicleBooking({ provider: 'Cicar', startDate: '2026-11-08', endDate: '2026-11-13', precio: null, coche: 'Fiat 500' }); true")
  await a.esp(900)
  debe((await ev(a, "!document.querySelector('[data-coche-super-recomendado]')")) && (await fichas(a)).find((f) => f.id === 'coche')?.hecha === true, '3k', 'con el alquiler reservado: ficha hecha y sin «SÚPER RECOMENDADO»')
  await ev(a, "window.__ruta.getState().setRentalVehicleBooking(null); true")
  await a.esp(600)
  // Excursiones: el bloque con La Graciosa y su ficha
  await ev(a, "document.querySelector('[data-clave-resumen=\"excursion-la_graciosa\"]')?.click(); true")
  await a.esp(1200)
  const bloqueExc = await ev(a, "(document.querySelector('[data-blk=\"excursiones\"]')?.innerText || '').replace(/\\s+/g, ' ')")
  debe(/Excursiones/.test(bloqueExc) && /La Graciosa/.test(bloqueExc) && /Reservar excursión/.test(bloqueExc) && /0 de 1 reservada/.test(bloqueExc), '3l', `el bloque «Excursiones» trae La Graciosa con [Reservar excursión] (dice «${bloqueExc.slice(0, 160)}»)`)
  const enlace = await ev(a, "(() => { const b = Array.from(document.querySelectorAll('[data-blk=\"excursiones\"] a, [data-blk=\"excursiones\"] button')).find((x) => /Reservar excursión/.test(x.innerText || '')); return b ? { href: b.getAttribute('href') || null, texto: (b.innerText || '').trim() } : null })()")
  debe(enlace && !/civitatis|getyourguide|viator/i.test(enlace.texto), '3m', 'el botón no lleva el nombre de ninguna web')
  // La reserva puesta: «Listo» y la ficha en verde
  await ev(a, "(() => { const s = window.__ruta; const r = s.getState().route; const d = r.days.find((x) => x.dayType === 'excursion'); s.setState({ reservations: [...s.getState().reservations, { id: 'res-lg', kind: 'excursion', refId: 'la_graciosa', name: 'La Graciosa', placeNames: [], dateIso: '2026-11-11', dayNumber: d.dayNumber, time: '09:00' }] }); return true })()")
  await a.esp(1200)
  const tras = await fichas(a)
  debe(tras.find((f) => f.id === 'excursion-la_graciosa')?.hecha === true, '3n', 'con la excursión reservada, su ficha sale hecha')
  debe(/Listo/.test(await ev(a, "(document.querySelector('[data-blk=\"excursiones\"]')?.innerText || '')")), '3o', 'y el bloque «Excursiones» dice «Listo»')
  debe(/de 5 listo/.test((await cuenta(a)) ?? ''), '3p', 'el total sigue en N = 5')
  await ev(a, "window.__ruta.setState({ reservations: window.__ruta.getState().reservations.filter((x) => x.id !== 'res-lg') }); true")
} finally {
  a.cerrar()
}

// ── 4. En la pantalla: Roma (lo mismo, sin coche) con un día de excursión ──
const r = await conViaje({ version: 'gratis' })
try {
  // Un día de excursión de Roma, como lo deja la app al elegir una: con su `selectedExcursionId`.
  await ev(r, `(() => { const s = window.__ruta; const ruta = structuredClone(s.getState().route); const d = ruta.days[1]; d.dayType = 'excursion'; d.excursions = [{ id: 'tivoli_villas', title: 'Tívoli y sus villas', length: 'full-day', durationLabel: 'Día completo', price: 0, priceLabel: null, description: '', emoji: null, photoName: null, durationHours: null, ratingMax: 5, destinationCoords: null, meetingPoint: null, priceOrientativo: true, cancellation: null, cancellationNote: null, durationText: null, photoUrl: null, photoUrlBig: null, bestSeller: false }]; d.selectedExcursionId = 'tivoli_villas'; s.setState({ route: ruta }); return true })()`)
  await ev(r, "window.__ruta.getState().setMode('bookings'); true")
  await r.esp(2500)
  await cierraAvisos(r)
  const fr = await fichas(r)
  console.log('  Roma:', (await cuenta(r)) + ' ·', fr.map((f) => f.nombre.replace(/\s+/g, ' ')).join(' | '))
  debe(fr.some((f) => f.id === 'excursion-tivoli_villas' && /Tívoli y sus villas/.test(f.nombre)), '4a', `Roma: una ficha por la excursión de la ruta (salen: ${fr.map((f) => f.nombre).join(' | ')})`)
  debe(!fr.some((f) => f.id === 'coche') && !(await ev(r, "Boolean(document.querySelector('[data-bloque-coche]'))")), '4b', 'Roma no lleva el bloque ni la ficha del coche')
  debe(fr.some((f) => f.id === 'llegada') && fr.some((f) => f.id === 'aloj'), '4c', 'Roma conserva las fichas de siempre (Llegada y vuelta, Alojamiento)')
  debe(await ev(r, "Boolean(document.querySelector('[data-blk=\"excursiones\"]'))"), '4d', 'Roma: el bloque «Excursiones» está')
} finally {
  r.cerrar()
}

console.log(`\n${total} comprobaciones, ${fallos.length} fallos`)
for (const f of fallos) console.log('  FALLO ' + f)
process.exit(fallos.length ? 1 : 0)
