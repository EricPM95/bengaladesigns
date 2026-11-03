// Tanda 10S11 (agente C) · apartado 4: el día de vuelta, «Hoy vuelves a casa» (Eric, 1-nov).
//   Sin pase con vuelo a las 18:05: fuera la franja oscura «Tu día de vuelta · Con el Pase Roma…», la tarjeta con «hasta las HH:MM», [+ Añadir lugares], [Explorar] y la línea del pase con candado.
//   Sin hora: «Aún no sabemos…», [Añadir tu vuelo] → RESERVAS › Llegada y vuelta. Vuelo muy pronto: sin [+ Añadir lugares]. Tren: «tu tren» con su estación. Coche: sin la parte del vuelo.
//   APP_URL=http://localhost:5173 API_URL=http://localhost:8787 node scripts/destino/_conCola.mjs node scripts/destino/pruebaTanda10S11_C.mjs
//   SOLO_SECO=1: solo el cálculo y el código (sin Chrome). Capturas en docs/dias/capturas_jutrip/10s11_<tema>_<n>.jpg (390 x 844).
import fs from 'node:fs'
import path from 'node:path'

const fallos = []
let comprobaciones = 0
let pasadaActual = 'código'
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) {
    fallos.push({ regla, texto: `(${pasadaActual}) ${texto}` })
    console.log(`  ✗ [${regla}] (${pasadaActual}) ${texto}`)
  }
}
const leer = (f) => fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n')

/* ───────────────────────── A. El código y el cálculo ───────────────────────── */
console.log('A. El código y el cálculo')
{
  const dia = leer('src/components/route/dayDetail/DayDetailPanel.tsx')
  debe(!/titulo="Tu día de vuelta"/.test(dia) && !/dia-ajuste-vuelta/.test(dia), 'apartado 4', 'fuera la franja oscura «Tu día de vuelta»')
  debe(/textosDelDiaDeVuelta\(datosDeVuelta, pago\)/.test(dia) && /onAnadirVuelo=\{\(\) => goToBooking\('vuelta'\)\}/.test(dia), 'apartado 4', 'el panel pinta «Hoy vuelves a casa» y [Añadir tu vuelo] va a RESERVAS › Llegada y vuelta')
  debe(/onAnadirLugares=\{\(\) => openAddFlow\(day\.id\)\}/.test(dia) && /abrirExplorar\(\{ categoria: 'atracciones'/.test(dia), 'apartado 4', '[+ Añadir lugares] añade al día de vuelta; [Explorar] abre EXPLORAR')
  const lib = leer('src/lib/diaDeVuelta.ts')
  debe(/Math\.floor\(limite \/ 15\) \* 15/.test(lib), 'apartado 4', 'la hora se redondea hacia abajo al cuarto de hora')
  debe(/Hoy vuelves a casa/.test(lib) && /Aún no sabemos a qué hora sale/.test(lib) && /Añádelo y te diremos hasta qué hora tienes el día libre\./.test(lib) && /Mientras tanto, añade lo que te quedó por ver\./.test(lib), 'apartado 4', 'los textos del prompt, tal cual')
}

/* ───────────────────────── B. La pantalla ───────────────────────── */
if (process.env.SOLO_SECO) {
  console.log(`\n${comprobaciones} comprobaciones, ${fallos.length} fallos`)
  process.exit(fallos.length ? 1 : 0)
}
const { abrirApp } = await import('./_enLaApp.mjs')
const APP = process.env.APP_URL ?? 'http://localhost:5173'
const SALIDA = path.resolve('docs/dias/capturas_jutrip')
fs.mkdirSync(SALIDA, { recursive: true })
const foto = (tema, n) => path.join(SALIDA, `10s11_${tema}_${n}.jpg`)

async function pasada(version) {
  const sin = version === 'gratis'
  pasadaActual = sin ? 'sin pase' : 'con pase'
  console.log(`\n== ${pasadaActual} ==`)
  const a = await abrirApp(APP, { ruta: `/?cuentas=off&logros=on&logrosDemo=1&apertura=0&version=${version}`, ancho: 390, alto: 844 })
  try {
    const ev = (js) => a.evaluar(js)
    for (let intento = 0; intento < 3; intento++) {
      for (let i = 0; i < 360 && !(await ev("typeof window.__rutaPrueba === 'function'").catch(() => false)); i++) await a.esp(500)
      try {
        await ev('window.__rutaPrueba().then(() => true)')
        break
      } catch (e) {
        if (intento === 2) throw e
        await ev('location.reload()').catch(() => undefined)
        await a.esp(5000)
      }
    }
    for (let i = 0; i < 90 && !(await ev('window.__ruta?.getState().route != null').catch(() => false)); i++) await a.esp(1000)
    await a.esp(2500)
    for (let i = 0; i < 6; i++) {
      const h = await ev("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale|Cerrar)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
      if (!h) break
      await a.esp(600)
    }
    const click = (sel) => ev(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return false; e.click(); return true })()`)
    // Pone el viaje: cómo vuelve, la hora, el punto y la zona; y se va al día de vuelta.
    const poner = async ({ medio, hora, punto, zona }) => {
      await ev(`(() => { const r = window.__ruta.getState().route; window.__ruta.setState({ route: { ...r, planVuelta: null, returnTransportOptionId: ${JSON.stringify(medio)}, departureFlightTime: ${JSON.stringify(hora)}, departurePointId: ${JSON.stringify(punto)}, accommodationZone: ${JSON.stringify(zona)} } }); const dv = r.days.find((d) => d.isReturnLeg) ?? r.days[r.days.length - 1]; window.__ruta.getState().setMode('days'); window.__ruta.getState().setActiveDayId(dv.id); return true })()`)
      await a.esp(2500)
    }
    const leer = () =>
      ev(`(() => { const t = document.querySelector('[data-tarjeta-ultimo-dia]'); const q = (s) => (t && t.querySelector(s) ? t.querySelector(s).textContent.trim() : null); const tx = document.body.innerText; return JSON.stringify({ hay: Boolean(t), version: t ? t.getAttribute('data-tarjeta-ultimo-dia') : null, titulo: q('[data-ultimo-dia-titulo]'), texto: q('[data-ultimo-dia-texto]'), invitacion: q('[data-ultimo-dia-invitacion]'), lugares: q('[data-ultimo-dia="lugares"]'), explorar: q('[data-ultimo-dia="explorar"]'), anadirVuelo: q('[data-ultimo-dia="anadir-vuelo"]'), paseSin: q('[data-ultimo-dia-pase="sin-pase"]'), paseCon: q('[data-ultimo-dia-pase="con-pase"]'), candado: Boolean(t && t.querySelector('[data-ultimo-dia-pase="sin-pase"] svg')), franja: /Tu día de vuelta/.test(tx), viejoBarra: /Añade tu vuelo de vuelta y ajustamos tu día/.test(tx), viejaTarjeta: /a la medida de tu/.test(tx) }) })()`).then((x) => JSON.parse(x))
    if (!(await ev('window.__ruta.getState().route.days.some((d) => d.isReturnLeg)'))) console.log('  (aviso) el viaje de prueba no trae día de vuelta propio: se usa el último día')

    // 1. Con vuelo a las 18:05 desde Ciampino (sin zona): 18:05 − 2 h − 50 min = 15:15.
    await poner({ medio: 'flight', hora: '18:05', punto: 'cia', zona: null })
    let d = await leer()
    debe(d.hay && d.titulo === 'Hoy vuelves a casa', 'apartado 4', `con vuelo a las 18:05 sale la tarjeta «Hoy vuelves a casa» (${JSON.stringify(d)})`)
    debe(d.texto === 'Tu vuelo sale de Ciampino a las 18:05. Te recomendamos estar en el aeropuerto 2 horas antes: hasta las 15:15, más o menos, el día es tuyo.', 'apartado 4', `el texto con la hora del vuelo y «hasta las 15:15» (${d.texto})`)
    debe(d.invitacion === '¿Quieres aprovecharlo? Añade lo que te quedó por ver.' && d.lugares === '+ Añadir lugares' && d.explorar === 'Explorar', 'apartado 4', `la invitación y los dos botones (${d.invitacion} | ${d.lugares} | ${d.explorar})`)
    debe(!d.franja && !d.viejoBarra && !d.viejaTarjeta, 'apartado 4', `ni franja oscura «Tu día de vuelta», ni «Añade tu vuelo de vuelta y ajustamos tu día», ni la tarjeta vieja (${d.franja}, ${d.viejoBarra}, ${d.viejaTarjeta})`)
    if (sin) debe(d.version === 'sin-pase' && /Con el Pase Roma, te preparamos este día con lo que te queda por ver, a tiempo para tu vuelo\./.test(d.paseSin ?? '') && d.candado, 'apartado 4', `sin pase, la línea del pase con su candado (${d.paseSin}, candado ${d.candado})`)
    else debe(d.version === 'con-pase' && !d.paseSin && !d.candado, 'apartado 4', `con pase, sin candado (${d.version}, ${d.paseSin})`)
    await a.captura(foto(`vuelta_con_hora_${version}`, '01'))

    // 1b. Con Fiumicino (sin zona: 60 min desde el centro): 18:05 − 2 h − 60 = 15:05 → 15:00.
    await poner({ medio: 'flight', hora: '18:05', punto: 'fco', zona: null })
    d = await leer()
    debe(/Tu vuelo sale de Fiumicino a las 18:05\..*hasta las 15:00, más o menos/.test(d.texto ?? ''), 'apartado 4', `Fiumicino sin zona: «hasta las 15:00» (${d.texto})`)

    // 2. Los botones.
    await click('[data-ultimo-dia="explorar"]')
    await a.esp(1500)
    debe((await ev('window.__ruta.getState().mode')) === 'explore', 'apartado 4', '[Explorar] abre EXPLORAR')
    await ev("window.__ruta.getState().setMode('days'); true")
    await a.esp(1500)
    const antes = await ev('window.__ruta.getState().route.days.find((d) => d.isReturnLeg)?.stops.length ?? 0')
    await click('[data-ultimo-dia="lugares"]')
    await a.esp(1800)
    debe(await ev("/Añadiendo al/.test(document.body.innerText)"), 'apartado 4', `[+ Añadir lugares] abre «Añadiendo al día…» (paradas del día antes: ${antes})`)
    // Se cierra con la X de arriba a la izquierda.
    await ev("(() => { const h = Array.from(document.querySelectorAll('*')).find((x) => x.children.length === 0 && /^Añadiendo al/.test((x.textContent || '').trim())); let c = h; for (let i = 0; i < 6 && c && !c.querySelector('button'); i++) c = c.parentElement; c?.querySelector('button')?.click(); return true })()")
    await a.esp(800)
    debe(!(await ev("/Añadiendo al/.test(document.body.innerText)")), 'apartado 4', 'y se cierra con su X')
    await ev("window.__ruta.getState().setMode('days'); true")

    // 3. Sin la hora del vuelo.
    await poner({ medio: 'flight', hora: null, punto: null, zona: null })
    d = await leer()
    debe(d.texto === 'Aún no sabemos a qué hora sale tu vuelo. Añádelo y te diremos hasta qué hora tienes el día libre.' && d.anadirVuelo === 'Añadir tu vuelo', 'apartado 4', `sin hora: «Aún no sabemos…» y [Añadir tu vuelo] (${d.texto} | ${d.anadirVuelo})`)
    debe(d.invitacion === 'Mientras tanto, añade lo que te quedó por ver.' && d.lugares === '+ Añadir lugares' && d.explorar === 'Explorar', 'apartado 4', `«Mientras tanto…» con los dos botones (${d.invitacion})`)
    if (sin) debe(/Con el Pase Roma, al poner tu vuelo te preparamos este día con lo que te queda por ver\./.test(d.paseSin ?? '') && d.candado, 'apartado 4', `sin pase y sin hora, la línea con candado (${d.paseSin})`)
    else debe(d.paseCon === 'Pon tu vuelo y te preparamos este día con lo que te queda por ver.' && !d.candado, 'apartado 4', `con pase y sin hora, la línea sin candado (${d.paseCon})`)
    debe(!d.viejoBarra && !d.franja, 'apartado 4', 'sin hora tampoco sale «Añade tu vuelo de vuelta y ajustamos tu día»')
    await a.captura(foto(`vuelta_sin_hora_${version}`, '02'))
    await click('[data-ultimo-dia="anadir-vuelo"]')
    await a.esp(2000)
    const llevaA = await ev(`JSON.stringify({ modo: window.__ruta.getState().mode, abierta: document.querySelector('[data-blk="llegada"] [data-flecha-bloque]')?.getAttribute('data-flecha-bloque') ?? null, hojaDelVuelo: Boolean(document.querySelector('[role=dialog]')), bloque: Boolean(document.querySelector('[data-blk="llegada"]')) })`).then((x) => JSON.parse(x))
    debe(llevaA.modo === 'bookings' && llevaA.bloque && (llevaA.abierta === 'abierta' || llevaA.hojaDelVuelo), 'apartado 4', `[Añadir tu vuelo] lleva a RESERVAS › Llegada y vuelta, con la hoja del vuelo de la vuelta lista para poner la hora (${JSON.stringify(llevaA)})`)
    await a.captura(foto(`vuelta_anadir_vuelo_${version}`, '03'))

    // 4. Vuelo muy pronto: 07:10 → no queda tiempo → sin [+ Añadir lugares] ni [Explorar].
    await poner({ medio: 'flight', hora: '07:10', punto: 'fco', zona: null })
    d = await leer()
    debe(d.hay && d.titulo === 'Hoy vuelves a casa' && /Hoy es día de irse con calma/.test(d.texto ?? '') && !/hasta las/.test(d.texto ?? ''), 'apartado 4', `vuelo muy pronto: día de irse con calma, sin «hasta las» (${d.texto})`)
    debe(d.lugares === null && d.explorar === null, 'apartado 4', `vuelo muy pronto: sin [+ Añadir lugares] (${d.lugares}, ${d.explorar})`)
    await a.captura(foto(`vuelta_muy_pronto_${version}`, '04'))

    // 5. En tren (Termini, 30 min antes, 15 min desde el centro): 18:05 − 30 − 15 = 17:20 → 17:15.
    await poner({ medio: 'train', hora: '18:05', punto: 'termini', zona: null })
    d = await leer()
    debe(/^Tu tren sale de Termini a las 18:05\. Te recomendamos estar en la estación 30 minutos antes: hasta las 17:15, más o menos, el día es tuyo\.$/.test(d.texto ?? ''), 'apartado 4', `en tren: «tu tren», su estación (${d.texto})`)
    debe(!/vuelo|aeropuerto/.test(`${d.texto} ${d.paseSin ?? ''} ${d.paseCon ?? ''}`), 'apartado 4', 'en tren, ni «vuelo» ni «aeropuerto»')
    await a.captura(foto(`vuelta_tren_${version}`, '05'))
    await poner({ medio: 'train', hora: null, punto: null, zona: null })
    d = await leer()
    debe(/sale tu tren\./.test(d.texto ?? '') && d.anadirVuelo === 'Añadir tu tren', 'apartado 4', `en tren y sin hora: [Añadir tu tren] (${d.texto} | ${d.anadirVuelo})`)

    // 6. En coche: sin la parte del vuelo.
    await poner({ medio: 'car', hora: null, punto: null, zona: null })
    d = await leer()
    debe(d.hay && d.titulo === 'Hoy vuelves a casa' && !/vuelo|aeropuerto|tren/.test(d.texto ?? '') && d.anadirVuelo === null && d.lugares === '+ Añadir lugares', 'apartado 4', `en coche: sin la parte del vuelo (${d.texto})`)
  } finally {
    await a.cerrar()
  }
}

await pasada('gratis')
await pasada('completa')

console.log(`\nPrueba 10S11 C: ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
if (fallos.length) for (const f of fallos) console.log(` ✗ [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
