// Tanda 10S4 (agente H): apartados 3 y 4 (Entradas y Free Tour solo «En tu ruta» y al día; [Añadir otra reserva] con su buscador) y la utilidad de búsqueda compartida (apartado 5, parte de H).
//   1 · el buscador (`src/lib/busqueda.ts`) con los datos reales de Roma: «cupula», «capito», «cupla», «Cupola», «Musei Capitolini».
//   2 · el código (sin «Ver n más», con [Añadir otra reserva], la lista abierta a cualquier sitio con entrada).
//   3 · en la app: un sitio con entrada que se añade a la ruta (Museos Capitolinos) aparece; al quitarlo se va; con la entrada guardada se queda con «Ya no está en tu ruta»; [Añadir otra reserva]:
//       «cupula» sugiere la Cúpula; elegida y guardada, entra de primera en su día, marcada, sin quitar nada y sin mover ningún otro día; lo escrito que no tenemos va solo a RESERVAS.
//   APP_URL=http://localhost:5173 API_URL=http://localhost:8787 node scripts/destino/_conCola.mjs node scripts/destino/pruebaTanda10S4_H.mjs
// Imprime «N comprobaciones, M fallos» y sale con 1 si falla.
import fs from 'node:fs'
import { abrirApp } from './_enLaApp.mjs'

const APP = process.env.APP_URL ?? 'http://localhost:5173'
const fallos = []
let comprobaciones = 0
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) {
    fallos.push({ regla, texto })
    console.log(`  ✗ [${regla}] ${texto}`)
  }
}
const leer = (f) => fs.readFileSync(f, 'utf8')
const sinComentarios = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

console.log('1. El buscador (busqueda.ts) con los datos de Roma')
{
  const { buscar, normalizarTexto } = await import('../../src/lib/busqueda.ts')
  const roma = JSON.parse(leer('data/pipeline_v2/roma.json'))
  const entradas = JSON.parse(leer('data/dias/roma/_entradas.json')).lugares
  const sitios = roma.places.filter((p) => entradas[p.name])
  debe(sitios.length >= 15, 'bus', `hay sitios con entrada para buscar (${sitios.length})`)
  const nombres = (q) => buscar(sitios, q, (p) => [p.name, ...(p.search_aliases ?? [])]).map((p) => p.name)
  debe(normalizarTexto('Cúpula  DE San-Pedro') === 'cupula de san pedro', 'bus', 'sin acentos ni mayúsculas ni signos')
  debe(nombres('cupula')[0] === 'Cúpula de San Pedro', 'bus', `«cupula» → Cúpula (${nombres('cupula')})`)
  debe(nombres('CÚPULA')[0] === 'Cúpula de San Pedro', 'bus', '«CÚPULA» → Cúpula')
  debe(nombres('capito')[0] === 'Museos Capitolinos', 'bus', `«capito» → Museos Capitolinos (${nombres('capito')})`)
  debe(nombres('cupla')[0] === 'Cúpula de San Pedro', 'bus', `«cupla» (una letra equivocada) → Cúpula (${nombres('cupla')})`)
  debe(nombres('Cupola')[0] === 'Cúpula de San Pedro', 'bus', `«Cupola» (italiano) → Cúpula (${nombres('Cupola')})`)
  debe(nombres('Musei Capitolini')[0] === 'Museos Capitolinos', 'bus', `«Musei Capitolini» → Museos Capitolinos (${nombres('Musei Capitolini')})`)
  debe(nombres('colosseo')[0] === 'Coliseo', 'bus', '«colosseo» → Coliseo')
  debe(nombres('pantheon')[0] === 'Panteón', 'bus', '«pantheon» → Panteón')
  debe(nombres('zzzzqq').length === 0 && nombres('a').length === 0, 'bus', 'lo que no existe y una sola letra no sugieren nada')
}

console.log('2. El código')
{
  const ent = sinComentarios(leer('src/components/route/reservas/EntradasYFreeTour.tsx'))
  debe(!/Ver \$\{masEntradas|setVerMas|Ver menos/.test(ent), 'ap3', 'fuera «Ver n más»')
  debe(/data-anadir-otra-reserva/.test(ent) && /Añadir otra reserva/.test(ent), 'ap4', 'está el botón [Añadir otra reserva]')
  const bk = sinComentarios(leer('src/lib/bookings.ts'))
  debe(/sitiosConEntrada/.test(bk) && /extras/.test(bk), 'ap3', 'la lista de entradas se abre a cualquier sitio con entrada')
  const otra = sinComentarios(leer('src/lib/otraReserva.ts'))
  debe(/conPase: false/.test(otra) && /ponerParadaEnElDia/.test(otra), 'ap4', 'el sitio entra de primera (la regla de dondeQueda sin pase, también con pase de momento)')
  const buscador = sinComentarios(leer('src/components/route/reservas/OtraReservaBuscador.tsx'))
  debe(/sugerenciasPara/.test(buscador) && /data-sugerencia-otra/.test(buscador), 'ap4', 'el buscador usa la utilidad compartida y pinta sugerencias')
}

console.log('3. En la app')
let app = null
try {
  app = await abrirApp(APP, { ruta: '/?cuentas=off&logros=on&logrosDemo=1&apertura=0&version=completa' })
  for (let i = 0; i < 240 && !(await app.evaluar("typeof window.__rutaPrueba === 'function'").catch(() => false)); i++) await app.esp(500)
  for (let intento = 0; intento < 8; intento++) {
    const ok = await app.evaluar('window.__rutaPrueba().then(() => true, (e) => String(e && e.message))').catch((e) => String(e))
    if (ok === true) break
    await app.esp(1500)
  }
  for (let i = 0; i < 90 && !(await app.evaluar("import('/src/store/useRouteStore.ts').then((m) => Boolean(m.useRouteStore.getState().route))")); i++) await app.esp(1000)
  await app.esp(2500)
  const ev = (js) => app.evaluar(`(async () => { const R = await import('/src/store/useRouteStore.ts'); const B = await import('/src/lib/bookings.ts'); const route = () => R.useRouteStore.getState().route; const st = () => R.useRouteStore.getState(); ${js} })()`)
  const dias = `const r = route(); return JSON.stringify(r.days.map((x) => ({ n: x.dayNumber, stops: x.stops.map((y) => y.name) })))`
  const bloque = "return (document.querySelector('[data-blk=\"entradas\"]')?.innerText ?? '').replace(/\\s+/g, ' ')"
  const abrirBloque = async () => {
    await ev("st().setMode('bookings'); return true")
    await app.esp(1800)
    await ev(`(() => { const b = document.querySelector('[data-blk="entradas"]'); if (b && b.children.length < 2) b.firstElementChild?.click(); return true })()`)
    await app.esp(1200)
  }
  const sitioSinCapitolinos = await ev(`const r = route(); return !r.days.some((d) => d.stops.some((s) => s.name === 'Museos Capitolinos'))`)
  debe(sitioSinCapitolinos, 'ap3', 'el viaje de prueba parte sin los Museos Capitolinos en la ruta')

  // — Apartado 3: añadir a la ruta un sitio con entrada que no estaba —
  const dia1 = await ev(`const r = route(); const d = r.days.filter((x) => !x.isReturnLeg && B.dateOfDay(r, x))[1] ?? r.days.find((x) => !x.isReturnLeg); return d.id`)
  const nuevo = await ev(`
    const P = await import('/src/lib/destinationPlacesApi.ts'); const X = await import('/src/components/route/placeExplorer/PlaceExplorerScreen.tsx')
    const cat = await P.fetchDestinationPlaces(route().destination)
    const lugar = cat.places.find((p) => p.name === 'Museos Capitolinos')
    const stop = X.stopFromPlace(lugar, '')
    st().addStop(${JSON.stringify(dia1)}, stop)
    return stop.id
  `)
  await abrirBloque()
  let txt = await ev(bloque)
  debe(/Museos Capitolinos/.test(txt), 'ap3', `los Museos Capitolinos, ya en la ruta, aparecen en «Entradas y Free Tour» (${txt.slice(0, 200)})`)
  debe(!/Ver \d+ más|Ver menos/.test(txt), 'ap3', 'no sale «Ver n más»')
  debe(/Añadir otra reserva/.test(txt), 'ap4', 'sale [Añadir otra reserva]')
  debe(/En tu ruta/i.test(txt), 'ap3', 'sale «En tu ruta»')
  await app.captura('docs/dias/capturas_jutrip/10s4_entradas_1.jpg').catch(() => {})
  await ev(`st().removeStop(${JSON.stringify(dia1)}, ${JSON.stringify(nuevo)}); return true`)
  await app.esp(1500)
  txt = await ev(bloque)
  debe(!/Museos Capitolinos/.test(txt), 'ap3', 'quitada la parada, la entrada se va')
  // Con la entrada guardada: se queda con «Ya no está en tu ruta».
  await ev(`
    const P = await import('/src/lib/destinationPlacesApi.ts'); const X = await import('/src/components/route/placeExplorer/PlaceExplorerScreen.tsx')
    const cat = await P.fetchDestinationPlaces(route().destination)
    const stop = X.stopFromPlace(cat.places.find((p) => p.name === 'Museos Capitolinos'), '')
    st().addStop(${JSON.stringify(dia1)}, stop)
    window.__idCap = stop.id
    const r = route(); const d = r.days.find((x) => x.id === ${JSON.stringify(dia1)})
    st().addReservation({ id: 'res-cap-10s4', kind: 'entrada', refId: 'Museos Capitolinos', name: 'Museos Capitolinos', placeNames: ['Museos Capitolinos'], dateIso: B.dateOfDay(r, d), dayNumber: null, time: '15:00' }, null, null)
    return true
  `)
  await app.esp(1500)
  console.log('  (info: reservas tras añadir', await ev(`return JSON.stringify(st().reservations.map((x) => [x.refId, x.fueraDeRuta ?? null, x.noMueve ?? null]))`), ')')
  // (Una parada reservada se quita con «Quitar solo de la ruta»: la entrada se queda, marcada fuera de la ruta.)
  await ev(`const Q = await import('/src/lib/quitarConEntrada.ts'); const d = route().days.find((x) => x.id === ${JSON.stringify(dia1)}); const parada = d.stops.find((x) => x.id === window.__idCap); await Q.quitarParadaConEntrada(d.id, parada, st().reservations[0], 'solo'); return true`)
  await app.esp(1500)
  txt = await ev(bloque)
  debe(/Museos Capitolinos/.test(txt) && /Ya no está en tu ruta/.test(txt) && (await ev("return document.querySelectorAll('[data-fuera-de-ruta]').length")) === 1, 'ap3', `quitada la parada con la entrada guardada: se queda con «Ya no está en tu ruta» (${txt.slice(0, 900)})`)
  await app.captura('docs/dias/capturas_jutrip/10s4_entradas_2.jpg').catch(() => {})
  await ev(`st().removeReservation('res-cap-10s4'); return true`)
  await app.esp(800)

  // — Apartado 4: [Añadir otra reserva] con una sugerencia —
  const destino = await ev(`const r = route(); const d = r.days.filter((x) => !x.isReturnLeg && B.dateOfDay(r, x))[2] ?? r.days.filter((x) => !x.isReturnLeg)[1]; return { id: d.id, n: d.dayNumber, antes: d.stops.map((s) => s.name), dateIso: B.dateOfDay(r, d) }`)
  const fotoAntes = await ev(dias)
  const abrirOtra = async () => {
    await abrirBloque()
    const ok = await ev(`return (() => { const b = document.querySelector('[data-anadir-otra-reserva]'); if (!b) return false; b.click(); return true })()`)
    if (!ok) console.log('  (info: sin botón; bloque =', (await ev(bloque)).slice(0, 300), ')')
    return ok
  }
  debe(await abrirOtra(), 'ap4', 'se abre [Añadir otra reserva]')
  await app.esp(1000)
  await app.escribir('[data-otra-reserva-texto]', 'cupula')
  await app.esp(900)
  const sug = await ev(`return Array.from(document.querySelectorAll('[data-sugerencia-otra]')).map((b) => b.getAttribute('data-sugerencia-otra'))`)
  debe(sug.includes('Cúpula de San Pedro'), 'ap4', `escribir «cupula» sugiere la Cúpula (${JSON.stringify(sug)})`)
  await app.captura('docs/dias/capturas_jutrip/10s4_otra_reserva_1.jpg').catch(() => {})
  await ev(`document.querySelector('[data-sugerencia-otra="Cúpula de San Pedro"]')?.click(); return true`)
  await app.esp(1500)
  const hoja = await ev(`return (document.querySelector('#add-reservation-heading')?.innerText ?? '')`)
  debe(/Cúpula de San Pedro/.test(hoja), 'ap4', 'la hoja de siempre se abre con la Cúpula')
  await ev(`document.querySelector('[data-dia-cuadrado=${JSON.stringify(destino.id)}]')?.click(); return true`)
  await app.esp(1500)
  const marcado = await ev(`return document.querySelector('[data-dia-cuadrado=${JSON.stringify(destino.id)}]')?.getAttribute('data-elegida')`)
  debe(marcado === '1', 'ap4', 'el día elegido (en cuadrados) queda marcado')
  const hora = await ev(`const o = Array.from(document.querySelectorAll('#add-reservation-heading')).length ? Array.from(document.querySelectorAll('[role="dialog"] [role="option"]')).map((x) => x.textContent.trim()) : []; return o`)
  // (La última hora de la rueda: por la tarde, para ver que, si no cuadra con la franja de la parada, sale la línea gris del pase.)
  const horaElegida = hora.at(-1) ?? null
  if (horaElegida) {
    await ev(`Array.from(document.querySelectorAll('[role="dialog"] [role="option"]')).find((x) => x.textContent.trim() === ${JSON.stringify(horaElegida)})?.click(); return true`)
    await app.esp(900)
  }
  await app.captura('docs/dias/capturas_jutrip/10s4_otra_reserva_2.jpg').catch(() => {})
  const guardar = await ev(`const g = document.querySelector('#add-reservation-heading')?.closest('[role="dialog"]')?.querySelector('[data-guardar-reserva]'); return { hay: Boolean(g), texto: g?.textContent ?? null, off: g?.disabled ?? null }`)
  debe(guardar.hay && /Guardar la entrada/.test(guardar.texto ?? ''), 'ap4', `el botón dice «Guardar la entrada» (${guardar.texto})`)
  await ev(`document.querySelector('#add-reservation-heading')?.closest('[role="dialog"]')?.querySelector('[data-guardar-reserva]')?.click(); return true`)
  let marcadaDespues = false
  for (let i = 0; i < 12 && !marcadaDespues; i++) {
    await app.esp(250)
    marcadaDespues = await ev(`return Boolean(document.querySelector('[data-parada-marcada="1"]'))`)
  }
  await app.esp(1500)
  const despues = await ev(`
    const r = route(); const d = r.days.find((x) => x.id === ${JSON.stringify(destino.id)})
    const s = d.stops[0]
    const A = await import('/src/store/useAddFlowStore.ts')
    return { primera: s.name, reservedId: s.reservedId ?? null, time: s.time, nombres: d.stops.map((x) => x.name), enFoco: A.useAddFlowStore.getState().focusStopId === s.id, modo: st().mode, dia: st().activeDayId, reservas: st().reservations.map((x) => [x.refId, x.time]) }
  `)
  debe(despues.primera === 'Cúpula de San Pedro', 'ap4', `la Cúpula entra en la ruta de primera en su día (${JSON.stringify(despues.nombres)})`)
  debe(Boolean(despues.reservedId), 'ap4', 'la parada nueva queda marcada con su reserva')
  debe(horaElegida == null || despues.time === horaElegida, 'ap4', `lleva la hora de la reserva (${despues.time} / ${horaElegida})`)
  debe(JSON.stringify(despues.nombres.slice(1)) === JSON.stringify(destino.antes), 'ap4', 'no se quita nada del día: las paradas de antes siguen, en su orden, detrás')
  const fotoDespues = JSON.parse(await ev(dias))
  const fotoPrevia = JSON.parse(fotoAntes)
  const otrosIguales = fotoPrevia.every((d, i) => d.n === destino.n || JSON.stringify(d) === JSON.stringify(fotoDespues[i]))
  debe(otrosIguales, 'ap4', 'ningún otro día cambia (mismas paradas y orden)')
  debe(despues.modo === 'days' && despues.dia === destino.id && marcadaDespues, 'ap4', `la app lleva a la parada y la marca (modo ${despues.modo}, día ${despues.dia === destino.id}, parada marcada ${marcadaDespues})`)
  const fechaReserva = await ev(`return st().reservations.find((x) => x.refId === 'Cúpula de San Pedro')?.dateIso ?? null`)
  debe(fechaReserva === destino.dateIso, 'ap4', `el día de la reserva no cambia (${fechaReserva} / ${destino.dateIso})`)
  await app.esp(1200)
  await app.captura('docs/dias/capturas_jutrip/10s4_otra_reserva_3.jpg').catch(() => {})
  const lineas = () => ev("return document.querySelectorAll('[data-linea-pase=\"reserva-fuera-de-franja\"]').length")
  const franjaParada = await ev(`const d = route().days.find((x) => x.id === ${JSON.stringify(destino.id)}); return d.stops[0].franja ?? null`)
  console.log(`  (info: hora ${horaElegida}, franja de la parada ${franjaParada})`)
  debe((await lineas()) === 0, 'ap4', 'con pase: ninguna línea gris del pase')
  // Sin pase: si la hora no cuadra con la franja de la parada, sale la línea gris del pase (la de la 10S3).
  await ev("const P = await import('/src/lib/pago.ts'); P.fijarVersion('gratis'); return true")
  await ev("st().setMode('bookings'); return true")
  await app.esp(800)
  await ev(`st().setMode('days'); st().setActiveDayId(${JSON.stringify(destino.id)}); return true`)
  await app.esp(2500)
  let nLineas = await lineas()
  for (let i = 0; i < 6 && nLineas === 0; i++) {
    await app.esp(800)
    nLineas = await lineas()
  }
  if (horaElegida && horaElegida >= '14:00' && (franjaParada === 'manana' || franjaParada == null)) debe(nLineas >= 1, 'ap4', `sin pase, con la hora fuera de su franja sale la línea gris del pase (${nLineas})`)
  await app.captura('docs/dias/capturas_jutrip/10s4_otra_reserva_3b_sin_pase.jpg').catch(() => {})
  await ev("const P = await import('/src/lib/pago.ts'); P.fijarVersion('completa'); return true")
  await app.esp(800)

  // — Lo escrito que no tenemos: solo RESERVAS —
  const rutaAntes = await ev(dias)
  debe(await abrirOtra(), 'ap4', 'se abre [Añadir otra reserva] otra vez')
  await app.esp(900)
  await app.escribir('[data-otra-reserva-texto]', 'Cena en casa de Marco')
  await app.esp(900)
  const sug2 = await ev(`return document.querySelectorAll('[data-sugerencia-otra]').length`)
  debe(sug2 === 0, 'ap4', `lo que no tenemos no sugiere nada (${sug2})`)
  await ev(`document.querySelector('[data-otra-reserva-seguir]')?.click(); return true`)
  await app.esp(1500)
  const hoja2 = await ev(`return (document.querySelector('#add-reservation-heading')?.innerText ?? '')`)
  debe(/Cena en casa de Marco/.test(hoja2), 'ap4', 'la hoja de siempre se abre con lo escrito, tal cual')
  await ev(`document.querySelector('[data-dia-cuadrado=${JSON.stringify(destino.id)}]')?.click(); return true`)
  await app.esp(1200)
  await ev(`document.querySelector('#add-reservation-heading')?.closest('[role="dialog"]')?.querySelector('[data-guardar-reserva]')?.click(); return true`)
  await app.esp(2500)
  const rutaDespues = await ev(dias)
  debe(rutaAntes === rutaDespues, 'ap4', 'lo escrito solo vive en RESERVAS: ningún día cambia')
  const libre = await ev(`const x = st().reservations.find((r) => r.name === 'Cena en casa de Marco'); return x ? { refId: x.refId, noMueve: x.noMueve === true } : null`)
  debe(libre && libre.refId.startsWith('otra:') && libre.noMueve, 'ap4', `la reserva escrita queda guardada (${JSON.stringify(libre)})`)
  await abrirBloque()
  txt = await ev(bloque)
  debe(/Cena en casa de Marco/.test(txt), 'ap4', 'y sale en «Entradas y Free Tour», en RESERVAS')
  await app.captura('docs/dias/capturas_jutrip/10s4_otra_reserva_4.jpg').catch(() => {})
} catch (e) {
  debe(false, 'app', `la prueba falló: ${e && e.message}`)
} finally {
  try { await app?.cerrar?.() } catch {}
}
console.log(`${comprobaciones} comprobaciones, ${fallos.length} fallos`)
process.exit(fallos.length ? 1 : 0)
