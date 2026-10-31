// Tanda 10S3 (agente D): apartados 5, 6 y 7.
//   5 · reservar el Free Tour (o cambiarle la hora) funciona como una entrada: la parada se queda donde está con su hora nueva, ningún día se mueve, ningún mensaje de mover días, la franja no cambia;
//       la hoja del Free Tour lleva la rueda de la hora de las entradas (no las seis horas fijas).
//   6 · sin pase, la reserva que no cuadra con la franja (Mañana hasta 14:00, Tarde hasta 20:00, Noche después) lleva debajo la línea gris del pase; con pase, nada.
//   7 · elegir día, en cuadrados (el elegido azul oscuro con ✓ dorado), no en pastillas redondas.
//   APP_URL=http://localhost:5173 API_URL=http://localhost:8787 node scripts/destino/_conCola.mjs node scripts/destino/pruebaTanda10S3_D.mjs
// Capturas (390x844) en docs/dias/capturas_jutrip/10s3_d_*.jpg. Imprime «N comprobaciones, M fallos» y sale con 1 si falla.
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'

const APP = process.env.APP_URL ?? 'http://localhost:5173'
const API = process.env.API_URL ?? 'http://localhost:8787'
const SALIDA = path.resolve('docs/dias/capturas_jutrip')
fs.mkdirSync(SALIDA, { recursive: true })
const jpg = (n) => path.join(SALIDA, `10s3_d_${n}.jpg`)
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

/* ───────────── 1. El código ───────────── */
console.log('1. El código')
{
  const hoja = leer('src/components/route/reservas/AddReservationSheet.tsx')
  const h = sinComentarios(hoja)
  debe(!/FREE_TOUR_HOURS|horasDelFreeTour/.test(h), 'ap5', 'la hoja ya no usa las seis horas fijas del Free Tour')
  debe(/FREE_TOUR_RUEDA/.test(h) && !/grid grid-cols-3 gap-2/.test(h), 'ap5', 'el Free Tour usa la rueda de la hora (TimeListWheel) y no la rejilla de seis botones')
  debe(/!isFreeTour && !yaEnSuDia/.test(h), 'ap5', 'el plan de reservas no se pide para el Free Tour ni para una entrada cuyo sitio ya está en ese día')
  debe(/data-dia-cuadrado/.test(h) && !/gap-\[7px\] rounded-full px-3\.5/.test(h), 'ap7', 'los días de la hoja de reservas son cuadrados (no pastillas redondas)')
  const plan = sinComentarios(leer('server/engine/reservationPlan.js'))
  debe(/grande === destData\.default_free_tour\?\.name\) return base/.test(plan), 'ap5', 'el plan de reservas del servidor devuelve «sin cambios» para el Free Tour')
  const store = sinComentarios(leer('src/store/useRouteStore.ts'))
  debe(/reservation\.refId === FREE_TOUR_REF\) \{\s*set\(\{ route: placeReservedEntrance/.test(store), 'ap5', 'el almacén no rehace días con la reserva del Free Tour')
  const dp = sinComentarios(leer('src/components/route/dayDetail/DayDetailPanel.tsx'))
  debe(/<LineaReservaFueraDeFranja reservedId=\{realStop\.reservedId\} periodo=\{period\}/.test(dp), 'ap6', 'DÍAS pinta la línea del pase bajo la parada reservada')
  const lin = sinComentarios(leer('src/components/route/reservas/LineaReservaFueraDeFranja.tsx'))
  debe(/Con el \{pase\}, tus reservas se colocan solas a su hora\./.test(lin) && /clave="reservas"/.test(lin), 'ap6', 'la línea dice «Con el Pase Roma, tus reservas se colocan solas a su hora.» y abre el aviso pequeño `reservas`')
  const avi = sinComentarios(leer('src/lib/avisoPaseTextos.ts'))
  debe(/reservas: \{\s*linea1: '',\s*linea2: 'Con el \{pase\}, tus reservas se colocan solas a su hora\.'/.test(avi), 'ap6', 'el aviso pequeño del pase trae el mismo texto')
  const reglas = leer('docs/REGLAS_DE_LA_APP.md')
  debe(/Elegir un día, en cuadrados/.test(reglas), 'ap7', 'la regla de elegir día en cuadrados está en REGLAS_DE_LA_APP.md')
}

/* ───────────── 2. Las franjas (puro) ───────────── */
console.log('2. Los cortes de franja')
{
  const mod = await import('../../src/lib/reservaFueraDeFranja.ts').catch(() => null)
  if (mod) {
    const { franjaDeLaHoraDeReserva: f, reservaNoCuadraConSuFranja: n } = mod
    debe(f('09:00') === 'manana' && f('13:59') === 'manana' && f('14:00') === 'tarde' && f('19:59') === 'tarde' && f('20:00') === 'noche' && f('21:00') === 'noche', 'ap6', 'Mañana hasta las 14:00, Tarde hasta las 20:00, Noche después')
    debe(n('manana', '21:00') === true && n('manana', '10:00') === false && n('tarde', '15:00') === false && n('tarde', '21:00') === true && n('noche', '21:00') === false && n('comida', '21:00') === false, 'ap6', 'no cuadra solo si la hora cae en otra franja (la comida y la cena no cuentan)')
  } else {
    console.log('  (no se puede importar el .ts desde node: se prueba en el navegador)')
  }
}

/* ───────────── 3. El servidor ───────────── */
console.log('3. El plan de reservas del servidor, con el Free Tour')
{
  const body = {
    destination: 'Roma',
    answers: { dateRange: { start: '2026-11-26', end: '2026-11-29' }, month: 11, experiencesPositive: ['imprescindibles', 'free_tour'] },
    all_days: [1, 2, 3, 4].map((n) => ({ day_number: n, city: 'Roma' })),
    must_include_places: [],
    inside_names: [],
    reserva: { placeNames: ['Free Tour por Roma'], dateIso: '2026-11-26', dayNumber: null, time: '21:00' },
    reservas: [{ placeNames: ['Free Tour por Roma'], dateIso: '2026-11-26', dayNumber: null, time: '21:00' }],
    reservas_antes: [],
  }
  const r = await fetch(`${API}/api/reservation-plan`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then((x) => x.json()).catch((e) => ({ error: String(e) }))
  debe(r.cambia === false && !r.mensaje && (r.motivos ?? []).length === 0 && !(r.cambios ?? []).length, 'ap5', `reservar el Free Tour a las 21:00 en su día: sin cambios ni mensaje (${JSON.stringify(r).slice(0, 200)})`)
  const r2 = await fetch(`${API}/api/reservation-plan`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...body, reserva: { ...body.reserva, dateIso: '2026-11-27', time: '10:00' }, reservas: [{ ...body.reservas[0], dateIso: '2026-11-27', time: '10:00' }] }) }).then((x) => x.json()).catch((e) => ({ error: String(e) }))
  debe(r2.cambia === false && !r2.mensaje, 'ap5', `y en otro día: tampoco mueve días (${JSON.stringify(r2).slice(0, 160)})`)
}

/* ───────────── 4. En la app ───────────── */
let app = null
try {
  console.log('4. En la app (con pase)')
  app = await abrirApp(APP, { ruta: '/?cuentas=off&logros=on&logrosDemo=1&apertura=0&version=completa' })
  for (let i = 0; i < 240 && !(await app.evaluar("typeof window.__rutaPrueba === 'function'").catch(() => false)); i++) await app.esp(500)
  for (let intento = 0; intento < 8; intento++) {
    const ok = await app.evaluar('window.__rutaPrueba().then(() => true, (e) => String(e && e.message))').catch((e) => String(e))
    if (ok === true) break
    await app.esp(1500)
  }
  for (let i = 0; i < 90 && !(await app.evaluar("import('/src/store/useRouteStore.ts').then((m) => Boolean(m.useRouteStore.getState().route))")); i++) await app.esp(1000)
  await app.esp(2500)
  for (let i = 0; i < 6; i++) {
    const h = await app.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale|Cerrar)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()").catch(() => false)
    if (!h) break
    await app.esp(600)
  }
  const ev = (js) => app.evaluar(`(async () => { const R = await import('/src/store/useRouteStore.ts'); const B = await import('/src/lib/bookings.ts'); const route = () => R.useRouteStore.getState().route; const st = () => R.useRouteStore.getState(); ${js} })()`)

  // El Free Tour, en un día con fecha (el segundo día de ciudad), por la mañana como siempre.
  const montado = await ev(`
    const F = await import('/src/lib/freeTourEnDia.ts')
    const r = route()
    const dia = r.days.filter((d) => !d.isReturnLeg && B.dateOfDay(r, d))[1] ?? r.days.find((d) => !d.isReturnLeg)
    const res = await F.anadirFreeTourEnDia(dia.id, { llevar: false })
    return { ok: res.ok, texto: res.texto ?? null, dayId: dia.id }
  `)
  debe(montado.ok === true, 'ap5', `el viaje lleva el Free Tour (${montado.texto})`)
  await app.esp(1500)
  const antes = await ev(`
    const r = route(); const d = r.days.find((x) => x.id === ${JSON.stringify(montado.dayId)})
    const s = d.stops.find((x) => x.isFreeTour)
    return { dateIso: B.dateOfDay(r, d), orden: d.stops.map((x) => x.name), idx: d.stops.indexOf(s), franja: s.franja ?? null, time: s.time, dias: JSON.stringify(r.days.map((x) => ({ id: x.id, n: x.dayNumber, c: x.curatedId ?? null, stops: x.stops.map((y) => y.name) }))) }
  `)
  debe(Boolean(antes.dateIso) && antes.idx >= 0, 'ap5', 'el Free Tour está en un día con fecha')

  // Abrir RESERVAS y la hoja del Free Tour.
  await ev("st().setMode('bookings'); return true")
  await app.esp(1800)
  await ev(`(() => { const b = document.querySelector('[data-blk="entradas"]'); const cab = b?.firstElementChild; if (cab && b.children.length < 2) cab.click(); return true })()`)
  await app.esp(1500)
  const abrirFT = `(() => { const bloque = document.querySelector('[data-blk="entradas"]'); const b = Array.from(bloque.querySelectorAll('button')).filter((x) => /Añádela/.test(x.textContent || '')).find((x) => /Free Tour/.test(x.closest('[data-tarjeta-por-reservar],[data-tarjeta-reservada],[class*="min-h-"]')?.textContent || '')); if (!b) return false; b.click(); return true })()`
  let abierta = false
  for (let i = 0; i < 20 && !abierta; i++) {
    abierta = await ev(`return ${abrirFT}`)
    if (!abierta) await app.esp(500)
  }
  if (!abierta) {
    // (Plan B: la fila del Free Tour reservable de otra forma.)
    abierta = await ev(`return (() => { const bloque = document.querySelector('[data-blk="entradas"]'); const b = Array.from(bloque.querySelectorAll('button')).find((x) => /Reservar Free Tour|Añádela|Cambiar/.test(x.textContent || '') && /Free Tour/.test(x.closest('[data-tarjeta-por-reservar],[data-tarjeta-reservada],[class*="min-h-"]')?.textContent || '')); if (!b) return false; b.click(); return true })()`)
  }
  debe(abierta, 'ap5', 'se abre la hoja del Free Tour desde RESERVAS')
  await app.esp(1800)
  const hoja = await ev(`
    const d = document.querySelector('#add-reservation-heading')?.closest('[role="dialog"]')
    if (!d) return null
    const dias = Array.from(d.querySelectorAll('[data-dia-cuadrado]'))
    const radios = dias.map((b) => ({ rad: parseFloat(getComputedStyle(b).borderRadius), w: b.getBoundingClientRect().width, h: b.getBoundingClientRect().height, elegida: b.getAttribute('data-elegida'), marca: Boolean(b.querySelector('[data-dia-marca]')), texto: b.textContent.trim() }))
    const rueda = d.querySelector('[role="listbox"]')
    const opciones = Array.from(d.querySelectorAll('[role="option"]')).map((o) => o.textContent.trim())
    const seis = Array.from(d.querySelectorAll('button')).filter((b) => /^(10:00|12:00|15:00|17:00|19:00|21:00)$/.test((b.textContent || '').trim()) && b.className.includes('h-12')).length
    return { titulo: d.querySelector('#add-reservation-heading').textContent, n: dias.length, radios, rueda: Boolean(rueda), opciones, seis, texto: d.innerText.replace(/\\s+/g, ' ') }
  `)
  debe(Boolean(hoja), 'ap5', 'la hoja está abierta')
  if (hoja) {
    debe(hoja.n >= 2, 'ap7', `los días van en cuadrados (${hoja.n} en la hoja)`)
    debe(hoja.radios.every((c) => c.rad > 0 && c.rad <= 18 && c.h >= 56 && c.w >= 70), 'ap7', `cada día es un cuadrado de esquinas suaves, no una pastilla (${JSON.stringify(hoja.radios[0])})`)
    debe(hoja.radios.filter((c) => c.elegida === '1').length === 1 && hoja.radios.filter((c) => c.marca).length === 1, 'ap7', 'un solo día elegido, con su ✓ dorado')
    debe(hoja.rueda && hoja.opciones.includes('21:00') && hoja.opciones.includes('20:15') && hoja.opciones.length > 20, 'ap5', `la hora del Free Tour es la rueda de las entradas (${hoja.opciones.length} horas, con 20:15 y 21:00)`)
    debe(hoja.seis === 0, 'ap5', 'ya no están los seis botones fijos de horas')
    await app.captura(jpg('01_free_tour_hoja'))
  }
  // El día elegido, el mismo donde está el Free Tour; la hora, 21:00.
  await ev(`(() => { const d = document.querySelector('#add-reservation-heading')?.closest('[role="dialog"]'); const o = Array.from(d.querySelectorAll('[role="option"]')).find((x) => x.textContent.trim() === '21:00'); o?.click(); return true })()`)
  await app.esp(1500)
  const llamadasAntes = await ev("return performance.getEntriesByType('resource').filter((e) => e.name.includes('/api/reservation-plan')).length")
  const listo = await ev(`return (() => { const d = document.querySelector('#add-reservation-heading')?.closest('[role="dialog"]'); const g = d?.querySelector('[data-guardar-reserva]'); return { activo: Boolean(g) && !g.disabled, dia: Array.from(d.querySelectorAll('[data-dia-cuadrado][data-elegida="1"]')).map((b) => b.textContent.trim()) } })()`)
  debe(listo.activo, 'ap5', `el botón de guardar está activo con 21:00 (día ${listo.dia.join(',')})`)
  await app.captura(jpg('02_free_tour_21'))
  await ev(`(async () => { const g = document.querySelector('#add-reservation-heading')?.closest('[role="dialog"]')?.querySelector('[data-guardar-reserva]'); g?.click(); await new Promise((r) => setTimeout(r, 1500)); return true })()`)
  await app.esp(2000)
  const mensaje = await ev("return { dialogo: Boolean(document.querySelector('#move-day-heading')), texto: /vamos a mover el día|Hemos puesto el día/.test(document.body.innerText), hojaAbierta: Boolean(document.querySelector('#add-reservation-heading')) }")
  debe(!mensaje.dialogo && !mensaje.texto, 'ap5', `no sale el mensaje de «mover el día» (${JSON.stringify(mensaje)})`)
  debe(!mensaje.hojaAbierta, 'ap5', 'la hoja se cierra al guardar (sin pasos intermedios)')
  const llamadasDespues = await ev("return performance.getEntriesByType('resource').filter((e) => e.name.includes('/api/reservation-plan')).length")
  debe(llamadasDespues === llamadasAntes && llamadasAntes === 0, 'ap5', `con el Free Tour ni se pide el plan de reservas al servidor (${llamadasAntes} → ${llamadasDespues})`)
  const despues = await ev(`
    const r = route(); const d = r.days.find((x) => x.id === ${JSON.stringify(montado.dayId)})
    const s = d.stops.find((x) => x.isFreeTour)
    const res = st().reservations.find((x) => x.refId === 'Free Tour')
    return { orden: d.stops.map((x) => x.name), idx: d.stops.indexOf(s), franja: s.franja ?? null, time: s.time, reservedId: s.reservedId ?? null, res: res ? { time: res.time, dateIso: res.dateIso } : null, dias: JSON.stringify(r.days.map((x) => ({ id: x.id, n: x.dayNumber, c: x.curatedId ?? null, stops: x.stops.map((y) => y.name) }))) }
  `)
  debe(despues.res?.time === '21:00' && despues.time === '21:00' && despues.reservedId, 'ap5', `la parada lleva la hora nueva y la marca de la reserva (${JSON.stringify(despues.res)}, ${despues.time})`)
  debe(JSON.stringify(despues.orden) === JSON.stringify(antes.orden) && despues.idx === antes.idx, 'ap5', `la parada se queda donde está (${antes.idx} → ${despues.idx}; mismo orden de paradas)`)
  debe(despues.franja === antes.franja, 'ap5', `la franja no se mueve (${antes.franja} → ${despues.franja})`)
  debe(despues.dias === antes.dias, 'ap5', 'ningún día cambia de sitio ni de paradas')

  // Cambiar la hora (la hoja sale con la reserva puesta): 15:00, misma regla.
  await ev("st().setMode('bookings'); return true")
  await app.esp(1500)
  const abrirCambiar = `(() => { const bloque = document.querySelector('[data-blk="entradas"]'); if (bloque && bloque.children.length < 2) bloque.firstElementChild?.click(); const b = Array.from(document.querySelectorAll('[data-blk="entradas"] button')).find((x) => /^Cambiar$/.test((x.textContent || '').trim()) && /Free Tour/.test(x.closest('[data-tarjeta-por-reservar],[data-tarjeta-reservada],[class*="min-h-"]')?.textContent || '')); if (!b) return false; b.click(); return true })()`
  let cambiar = false
  for (let i = 0; i < 20 && !cambiar; i++) {
    cambiar = await ev(`return ${abrirCambiar}`)
    if (!cambiar) await app.esp(500)
  }
  debe(cambiar, 'ap5', 'con la reserva puesta, «Cambiar» abre la hoja del Free Tour')
  if (cambiar) {
    await app.esp(1500)
    await ev(`(() => { const d = document.querySelector('#add-reservation-heading')?.closest('[role="dialog"]'); const o = Array.from(d.querySelectorAll('[role="option"]')).find((x) => x.textContent.trim() === '15:00'); o?.click(); return true })()`)
    await app.esp(1200)
    await ev(`(async () => { const g = document.querySelector('#add-reservation-heading')?.closest('[role="dialog"]')?.querySelector('[data-guardar-reserva]'); g?.click(); await new Promise((r) => setTimeout(r, 1500)); return true })()`)
    await app.esp(2000)
    const m2 = await ev("return { dialogo: Boolean(document.querySelector('#move-day-heading')), texto: /vamos a mover el día|Hemos puesto el día/.test(document.body.innerText) }")
    debe(!m2.dialogo && !m2.texto, 'ap5', 'cambiar la hora tampoco saca el mensaje de mover días')
    const d2 = await ev(`
      const r = route(); const d = r.days.find((x) => x.id === ${JSON.stringify(montado.dayId)}); const s = d.stops.find((x) => x.isFreeTour)
      return { orden: d.stops.map((x) => x.name), time: s.time, franja: s.franja ?? null, dias: JSON.stringify(r.days.map((x) => ({ id: x.id, n: x.dayNumber, c: x.curatedId ?? null, stops: x.stops.map((y) => y.name) }))) }
    `)
    debe(d2.time === '15:00' && JSON.stringify(d2.orden) === JSON.stringify(antes.orden) && d2.franja === antes.franja && d2.dias === antes.dias, 'ap5', `cambiar la hora a las 15:00: la parada sigue en su sitio y ningún día cambia (${d2.time})`)
  }

  // Una entrada reservada a las 21:00 en su mismo día: igual (la regla de la 10N10 no se rompe).
  const ent = await ev(`
    const r = route(); const d = r.days.find((x) => !x.isReturnLeg && x.stops.filter((s) => !s.isArrival && !s.isFreeTour && !s.isNightExperience && !s.passThrough).length >= 3 && B.dateOfDay(r, x) && x.id !== ${JSON.stringify(montado.dayId)})
    if (!d) return null
    const s = d.stops.find((x) => !x.isArrival && !x.isFreeTour && !x.isNightExperience && !x.passThrough)
    const orden = d.stops.map((x) => x.name)
    const diasAntes = JSON.stringify(r.days.map((x) => ({ id: x.id, c: x.curatedId ?? null, stops: x.stops.map((y) => y.name) })))
    st().addReservation({ id: 'res-10s3-entrada', kind: 'entrada', refId: s.name, name: s.name, placeNames: [s.name], dateIso: B.dateOfDay(r, d), dayNumber: null, time: '21:00' })
    await new Promise((x) => setTimeout(x, 2500))
    const r2 = route(); const d2 = r2.days.find((x) => x.id === d.id); const s2 = d2.stops.find((x) => x.name === s.name)
    return { dayId: d.id, stop: s.name, stopId: s.id, igualOrden: JSON.stringify(d2.stops.map((x) => x.name)) === JSON.stringify(orden), time: s2.time, franjaAntes: s.franja ?? null, franja: s2.franja ?? null, diasIgual: JSON.stringify(r2.days.map((x) => ({ id: x.id, c: x.curatedId ?? null, stops: x.stops.map((y) => y.name) }))) === diasAntes }
  `)
  debe(Boolean(ent), 'ap5', 'hay un día con paradas para probar una entrada')
  if (ent) {
    debe(ent.igualOrden && ent.diasIgual && ent.time === '21:00' && ent.franja === ent.franjaAntes, 'ap5', `una entrada a las 21:00 en su día: igual que el Free Tour, la parada no se mueve (${JSON.stringify(ent)})`)
  }

  /* ───── 6 · con pase: nada nuevo ───── */
  console.log('5. La línea del pase (con y sin pase)')
  const verDia = async (dayId) => {
    await ev(`st().setMode('days'); st().setActiveDayId(${JSON.stringify(dayId)}); return true`)
    await app.esp(2500)
  }
  const linea = () => ev("return Array.from(document.querySelectorAll('[data-linea-pase=\"reserva-fuera-de-franja\"]')).map((e) => e.innerText.replace(/\\s+/g, ' ').trim())")
  await verDia(montado.dayId)
  debe((await linea()).length === 0, 'ap6', 'con pase: ninguna línea del pase bajo las paradas reservadas')
  await app.captura(jpg('03_con_pase_sin_linea'))

  // Sin pase.
  await ev("const P = await import('/src/lib/pago.ts'); P.fijarVersion('gratis'); return true")
  await ev("st().setMode('bookings'); return true")
  await app.esp(800)
  await verDia(montado.dayId)
  let lineas = await linea()
  for (let i = 0; i < 6 && lineas.length === 0; i++) {
    await app.esp(800)
    lineas = await linea()
  }
  debe(lineas.length >= 1 && lineas.every((t) => t === 'Con el Pase Roma, tus reservas se colocan solas a su hora.'), 'ap6', `sin pase: la línea gris bajo el Free Tour de las 15:00 que cae en la mañana… (${JSON.stringify(lineas)})`)
  // (Los avisos de cierre de otras pruebas de arriba, fuera de la captura.)
  for (let i = 0; i < 4 && (await ev("return Boolean(document.querySelector('[role=dialog] button[aria-label=Cerrar], [role=dialog] [aria-label=Cerrar]'))")); i++) {
    await ev("document.querySelector('[role=dialog] button[aria-label=Cerrar], [role=dialog] [aria-label=Cerrar]')?.click(); return true")
    await app.esp(600)
  }
  await ev("document.querySelector('[data-linea-pase=\"reserva-fuera-de-franja\"]')?.scrollIntoView({ block: 'center' }); return true")
  await app.esp(500)
  await app.captura(jpg('04_sin_pase_linea'))
  // Se pone a las 21:00 (no cuadra con Mañana) y a las 10:00 (sí cuadra): la línea sale y se va.
  const fija = (hora) => ev(`const s = route().days.flatMap((d) => d.stops).find((x) => x.isFreeTour); st().addReservation({ ...st().reservations.find((x) => x.refId === 'Free Tour'), time: ${JSON.stringify(hora)} }); await new Promise((x) => setTimeout(x, 1800)); return true`)
  await fija('10:00')
  await verDia(montado.dayId)
  await app.esp(1200)
  debe((await linea()).length === 0, 'ap6', 'sin pase, una reserva a las 10:00 en la mañana: sin línea (cuadra)')
  await fija('21:00')
  await verDia(montado.dayId)
  await app.esp(1200)
  const l21 = await linea()
  debe(l21.length === 1, 'ap6', `sin pase, a las 21:00 en la mañana: línea (${l21.length})`)
  // Tocarla: el aviso pequeño del pase con el mismo texto.
  await ev("document.querySelector('[data-linea-pase=\"reserva-fuera-de-franja\"]')?.click(); return true")
  await app.esp(1200)
  const aviso = await ev("return (document.querySelector('[data-aviso-pase=\"reservas\"]')?.innerText ?? '').replace(/\\s+/g, ' ')")
  debe(/Con el Pase Roma, tus reservas se colocan solas a su hora\./.test(aviso), 'ap6', `al tocarla sale el aviso pequeño con ese texto (${aviso.slice(0, 160)})`)
  await app.captura(jpg('05_aviso_pequeno'))
} catch (e) {
  fallos.push({ regla: 'error', texto: String(e?.stack ?? e) })
  console.log('ERROR', e)
} finally {
  try {
    app?.cerrar()
  } catch {
    /* ya cerrada */
  }
}

console.log(`\n${comprobaciones} comprobaciones, ${fallos.length} fallos`)
for (const f of fallos) console.log(` - [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
