// Tanda 10S9b (agente A) · apartado 1: «o escribe los datos a mano», con el pase.
//   · junto a [Añadir tarjeta de embarque] / [Añadir tu reserva] / [Añadir tu entrada] / [Añadir tu excursión], un enlace pequeño «o escribe los datos a mano» SOLO con pase;
//   · abre la hoja de datos de siempre («Datos del vuelo», «Datos de la reserva», «Datos de la entrada», «Datos de la excursión») vacía, con sus ejemplos en gris;
//   · al guardar a mano sale el bloque de datos con su lápiz, como si viniera del documento (sin código).
//   APP_URL=http://localhost:5173 API_URL=http://localhost:8787 node scripts/destino/_conCola.mjs node scripts/destino/pruebaTanda10S9b_A.mjs
//   SOLO_SECO=1: solo lo que se ve en el código (sin Chrome).
// Un solo Chrome de prueba a la vez; se cierra al acabar cada pasada. Capturas 390 x 844 en docs/dias/capturas_jutrip/10s9b_a_<tema>_<n>.jpg.
import fs from 'node:fs'
import path from 'node:path'

const fallos = []
let comprobaciones = 0
let pasadaActual = ''
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) {
    fallos.push({ regla, texto: `(${pasadaActual}) ${texto}` })
    console.log(`  ✗ [${regla}] (${pasadaActual}) ${texto}`)
  }
}
const leer = (f) => fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n')

/* ───────────────────────── A. El código ───────────────────────── */
console.log('A. El código')
{
  const botones = leer('src/components/route/reservas/BotonesDeReserva.tsx')
  debe(/o escribe los datos a mano/.test(botones) && /data-datos-a-mano/.test(botones), 'enlace', 'el enlace «o escribe los datos a mano» está en la pieza compartida del botón del documento')
  debe(/aMano && estado === 'con'/.test(botones), 'enlace', 'solo sale con pase (estado «con»); sin pase y mientras no se sabe, no')
  const aloj = leer('src/components/route/reservas/ReservaDelAlojamiento.tsx')
  debe(/onAMano=\{\(\) => setHoja\(\{ leidos: null, modo: 'datos' \}\)\}/.test(aloj), 'alojamiento', '[Añadir tu reserva] abre «Datos de la reserva» vacía')
  debe(/onLapizDatos\}?/.test(leer('src/components/route/reservas/EntradaConBillete.tsx')) && /onAMano=\{onLapizDatos\}/.test(leer('src/components/route/reservas/EntradaConBillete.tsx')), 'entrada', '[Añadir tu entrada] abre «Datos de la entrada»')
  debe(/onAMano=\{onLapizDatos\}/.test(leer('src/components/route/reservas/ExcursionConBillete.tsx')), 'excursion', '[Añadir tu excursión] abre «Datos de la excursión»')
  debe(/aMano=\{onDatos\}/.test(leer('src/components/route/reservas/TarjetaBillete.tsx')), 'vuelo', '[Añadir tarjeta de embarque] abre «Datos del vuelo»')
  debe(/soloDatos\) && \(/.test(leer('src/components/route/reservas/AddReservationSheet.tsx')), 'entrada', '«Datos de la entrada» enseña el localizador aunque no haya billete (para escribirlo a mano)')
}
if (process.env.SOLO_SECO) {
  console.log(`\n${comprobaciones} comprobaciones, ${fallos.length} fallos`)
  process.exit(fallos.length ? 1 : 0)
}

/* ───────────────────────── B. La pantalla ───────────────────────── */
const { abrirApp } = await import('./_enLaApp.mjs')
const APP = process.env.APP_URL ?? 'http://localhost:5173'
const SALIDA = path.resolve('docs/dias/capturas_jutrip')
fs.mkdirSync(SALIDA, { recursive: true })
const antes = "try{localStorage.setItem('trazo:moneda-pase','EUR')}catch(x){}; try{sessionStorage.removeItem('trazo:version')}catch(x){}"

async function pasada(version) {
  const sin = version === 'gratis'
  pasadaActual = sin ? 'sin pase' : 'con pase'
  console.log(`\n== ${pasadaActual} ==`)
  const a = await abrirApp(APP, { ruta: `/?cuentas=off&logros=on&logrosDemo=1&apertura=0&version=${version}`, antes, ancho: 390, alto: 844 })
  try {
    const ev = (js) => a.evaluar(js)
    const foto = (tema, n) => path.join(SALIDA, `10s9b_a_${tema}_${version}_${n}.jpg`)
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
    const ruta = (js) => ev(`(() => { const st = window.__ruta.getState(); ${js}; return true })()`)
    const R = (js) => ev(`(async () => { const R = await import('/src/store/useRouteStore.ts'); const B = await import('/src/lib/bookings.ts'); const st = () => R.useRouteStore.getState(); const route = () => st().route; ${js} })()`)
    const click = (sel) => ev(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return false; e.click(); return true })()`)
    const dialogo = () => ev("(() => { const d = document.querySelector('[role=dialog]'); return d ? d.innerText.replace(/\\s+/g, ' ') : null })()")
    const escribir = (sel, texto) => ev(`(() => { const i = document.querySelector(${JSON.stringify(sel)}); if (!i) return false; const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; set.call(i, ${JSON.stringify(texto)}); i.dispatchEvent(new Event('input', { bubbles: true })); return true })()`)
    const cerrarHojas = async () => {
      for (let i = 0; i < 6 && (await ev("Boolean(document.querySelector('[role=dialog]'))")); i++) {
        await ev("(() => { const d = document.querySelector('[role=dialog]'); const b = d.querySelector('button[aria-label=Cerrar]') ?? Array.from(d.querySelectorAll('button')).find((x) => /Entendido|Vale|Cerrar|Listo/.test(x.textContent || '')); b?.click(); return true })()")
        await a.esp(500)
      }
    }
    const abre = async (bloque) => {
      await R("st().setMode('bookings'); return true")
      await a.esp(1500)
      await ev(`(() => { const b = document.querySelector('[data-blk="${bloque}"]'); if (b && b.querySelectorAll('[data-tarjeta-crema], [data-mitad]').length === 0) b.querySelector('[data-cabecera-clara], [data-llegada-cabecera]')?.click(); return true })()`)
      await a.esp(1000)
    }
    const enlace = (clave) => ev(`(() => { const e = document.querySelector('[data-datos-a-mano="${clave}"]'); if (!e) return null; const r = e.getBoundingClientRect(); return { texto: e.textContent.trim(), zonaToque: e.classList.contains('zona-toque'), w: Math.round(r.width), h: Math.round(r.height) } })()`)
    const lapices = (selector) => ev(`Array.from(document.querySelectorAll(${JSON.stringify(selector + ' [data-lapiz]')})).map((x) => x.getAttribute('data-lapiz')).sort().join(',')`)
    const guardarHoja = (textoBoton) => ev(`(() => { const b = Array.from(document.querySelectorAll('[role=dialog] button')).find((x) => ${textoBoton}.test(x.textContent.trim())); b?.click(); return Boolean(b) })()`)

    /* ── 1. Vuelo: «o escribe los datos a mano» → «Datos del vuelo» ── */
    await ruta(`const r = st.route; window.__ruta.setState({ route: { ...r, origin: 'Barcelona', originPlace: undefined, answers: { ...r.answers, origin: 'Barcelona', originPlace: undefined, dateRange: { start: '2027-03-04', end: '2027-03-08' } }, transportContext: { ...r.transportContext, transport_option: { ...(r.transportContext.transport_option ?? {}), id: 'plane' } }, arrivalFlightTime: '11:25', departureFlightTime: '18:05', arrivalPointId: 'fco', departurePointId: 'cia', arrivalOtroPunto: 'El Prat', departureOtroPunto: 'El Prat', arrivalOtraHora: '08:30', departureOtraHora: '20:35', arrivalCodigo: 'VY 6102', departureCodigo: 'VY 6105', arrivalCompania: 'Vueling', departureCompania: null } })`)
    await abre('llegada')
    const eIda = await enlace('vuelo-arrival')
    const eVuelta = await enlace('vuelo-departure')
    if (sin) {
      debe(eIda == null && eVuelta == null, 'enlace', 'sin pase no sale «o escribe los datos a mano» en la ida ni en la vuelta')
      debe(await ev("document.querySelector('[data-blk=\"llegada\"] [data-anadir-doc=\"vuelo-arrival\"]')?.getAttribute('data-con-candado') === '1'"), 'enlace', 'sin pase el botón del documento sigue con su candado')
    } else {
      debe(eIda && eIda.texto === 'o escribe los datos a mano' && eVuelta && eVuelta.texto === 'o escribe los datos a mano', 'enlace', `con pase sale en la ida y en la vuelta (${JSON.stringify(eIda)})`)
      debe(eIda && eIda.zonaToque && eIda.h <= 30, 'enlace', `pequeño (${eIda?.h} px de alto) y con zona de toque de 44 (clase zona-toque)`)
      // antes → ahora → decisión de Eric (10S10, 1-nov): sin datos, sin bloque → el vuelo escrito a mano (aquí «VY 6102») ya abre el bloque de datos con su lápiz; sin terminal, asiento ni localizador todavía.
      debe((await lapices('[data-blk="llegada"] [data-mitad="arrival"]')).includes('datos-billete'), 'vuelo', 'antes de escribir los datos, la ida con el número del vuelo ya tiene su bloque de datos y su lápiz')
      debe(!(await ev("/Terminal|Asiento|Localizador/.test(document.querySelector('[data-blk=\"llegada\"] [data-mitad=\"arrival\"] [data-billete-datos]')?.textContent ?? '')")), 'vuelo', 'y sin terminal, asiento ni localizador todavía')
      await ev("document.querySelector('[data-blk=\"llegada\"] [data-mitad=\"arrival\"]')?.scrollIntoView({ block: 'center' }); true")
      await a.esp(300)
      await a.captura(foto('vuelo_enlace', 1))
      await click('[data-datos-a-mano="vuelo-arrival"]')
      await a.esp(800)
      const d = await dialogo()
      debe(d && /^Datos del vuelo/.test(d) && /Horario/.test(d) && /Terminal/.test(d) && /Asiento/.test(d) && /Localizador/.test(d), 'vuelo', `el enlace abre «Datos del vuelo» (${d?.slice(0, 80)})`)
      const vacios = await ev("['terminal','asiento','localizador'].map((k) => { const i = document.querySelector('[role=dialog] [data-datos-billete=\"' + k + '\"]'); return i ? [i.value, i.placeholder] : null })")
      debe(vacios.every((v) => v && v[0] === '' && v[1] !== ''), 'vuelo', `terminal, asiento y localizador vacíos con su ejemplo en gris (${JSON.stringify(vacios)})`)
      await a.captura(foto('vuelo_hoja', 2))
      await escribir('[role=dialog] [data-datos-billete="terminal"]', '1')
      await escribir('[role=dialog] [data-datos-billete="asiento"]', '14C')
      await escribir('[role=dialog] [data-datos-billete="localizador"]', 'zxc987')
      await guardarHoja('/^Guardar los datos$/')
      await a.esp(900)
      await cerrarHojas()
      const m = await ev("(() => { const m = document.querySelector('[data-blk=\"llegada\"] [data-mitad=\"arrival\"]'); return m ? { lapiz: Boolean(m.querySelector('[data-lapiz=\"datos-billete\"]')), filas: Array.from(m.querySelectorAll('[data-billete-fila]')).map((f) => f.textContent.trim()), codigo: Boolean(m.querySelector('[data-billete-codigo-pequeno]')) } : null })()")
      debe(m && m.lapiz, 'vuelo', 'al guardar a mano sale el bloque de datos con su lápiz «Cambiar los datos del vuelo»')
      debe(m && m.filas.includes('Localizador ZXC987') && m.filas.includes('Terminal 1') && m.filas.includes('Asiento 14C'), 'vuelo', `con sus filas (${JSON.stringify(m?.filas)})`)
      debe(m && !m.codigo, 'vuelo', 'y sin código (no hay documento)')
      await ev("document.querySelector('[data-blk=\"llegada\"] [data-mitad=\"arrival\"]')?.scrollIntoView({ block: 'center' }); true")
      await a.esp(300)
      await a.captura(foto('vuelo_guardado', 3))
    }

    /* ── 2. Alojamiento: «Datos de la reserva» ── */
    await R(`const r = route(); st().setAccommodationHotel(r.days[0].id, { name: 'Hotel Palatino', precio: { amount: 280, currency: 'EUR' } }); return true`)
    await a.esp(1200)
    await abre('aloj')
    const eAloj = await enlace('reserva-aloj-anadir')
    if (sin) {
      debe(eAloj == null, 'enlace', 'sin pase no sale «o escribe los datos a mano» en el alojamiento')
    } else {
      debe(eAloj && eAloj.texto === 'o escribe los datos a mano', 'enlace', `con pase sale bajo [Añadir tu reserva] (${JSON.stringify(eAloj)})`)
      debe((await lapices('[data-blk="aloj"]')) === 'aloj-arriba', 'alojamiento', 'antes de escribir, solo el lápiz de arriba')
      await ev("document.querySelector('[data-blk=\"aloj\"]')?.scrollIntoView({ block: 'start' }); true")
      await a.esp(300)
      await a.captura(foto('aloj_enlace', 1))
      await click('[data-datos-a-mano="reserva-aloj-anadir"]')
      await a.esp(800)
      const d = await dialogo()
      debe(d && /^Datos de la reserva/.test(d) && /Dirección/i.test(d) && /Teléfono/i.test(d) && /Localizador/i.test(d), 'alojamiento', `abre «Datos de la reserva» (${d?.slice(0, 90)})`)
      const vacios = await ev("['telefono','localizador','direccion'].map((k) => { const i = document.querySelector('[role=dialog] [data-reserva-aloj-campo=\"' + k + '\"]'); return i ? [i.value, i.placeholder] : null })")
      debe(vacios.every((v) => v && v[0] === '' && v[1] !== ''), 'alojamiento', `dirección, teléfono y localizador vacíos con su ejemplo en gris (${JSON.stringify(vacios)})`)
      const horas = await ev("Array.from(document.querySelectorAll('[role=dialog] [data-campo-de-hora-texto]')).map((e) => e.textContent.trim())")
      debe(horas.length === 2 && horas.every((h) => /^1[15]:00$/.test(h)), 'alojamiento', `las horas de entrada y de salida con los ejemplos 15:00 y 11:00 (${JSON.stringify(horas)})`)
      await a.captura(foto('aloj_hoja', 2))
      await escribir('[role=dialog] [data-reserva-aloj-campo="telefono"]', '+39 06 1234 5678')
      await escribir('[role=dialog] [data-reserva-aloj-campo="localizador"]', 'hx48k2')
      await guardarHoja('/^Guardar los datos$/')
      await a.esp(900)
      await cerrarHojas()
      await abre('aloj')
      const l = await lapices('[data-blk="aloj"]')
      debe(l === 'aloj-arriba,aloj-datos', 'alojamiento', `al guardar a mano salen los dos lápices, arriba y «Datos de la reserva» (${l})`)
      const t = await ev("document.querySelector('[data-blk=\"aloj\"]')?.innerText.replace(/\\s+/g, ' ')")
      debe(/\+39 06 1234 5678/.test(t) && /Localizador HX48K2/.test(t), 'alojamiento', `con su teléfono y su localizador en el bloque (${t?.slice(0, 160)})`)
      await ev("document.querySelector('[data-blk=\"aloj\"]')?.scrollIntoView({ block: 'start' }); true")
      await a.esp(300)
      await a.captura(foto('aloj_guardado', 3))
    }

    /* ── 3. Entrada: «Datos de la entrada» ── */
    const base = await R(`const r = route(); const d = r.days.filter((x) => !x.isReturnLeg && B.dateOfDay(r, x))[1] ?? r.days[0]; const s = d.stops.find((p) => !p.isFreeTour && !p.isNightExperience && !p.passThrough && !p.isBreak && p.name); return { dateIso: B.dateOfDay(r, d), nombre: s.name }`)
    await R(`st().addReservation({ id: 'res-10s9b-a', kind: 'entrada', refId: ${JSON.stringify(base.nombre)}, name: ${JSON.stringify(base.nombre)}, placeNames: [${JSON.stringify(base.nombre)}], dateIso: ${JSON.stringify(base.dateIso)}, dayNumber: null, time: '09:15', precio: { amount: 50, currency: 'EUR' } }, null, null); return true`)
    await a.esp(1500)
    await abre('entradas')
    const fila = `[data-entrada-fila="${base.nombre.replace(/"/g, '\\"')}"]`
    const eEntrada = await enlace('entrada-sin-codigo')
    if (sin) {
      debe(eEntrada == null, 'enlace', 'sin pase no sale «o escribe los datos a mano» en la entrada')
    } else {
      debe(eEntrada && eEntrada.texto === 'o escribe los datos a mano', 'enlace', `con pase sale bajo [Añadir tu entrada] (${JSON.stringify(eEntrada)})`)
      debe((await lapices(fila)) === 'entrada-arriba', 'entrada', 'antes de escribir, solo el lápiz de arriba')
      await ev(`document.querySelector(${JSON.stringify(fila)})?.scrollIntoView({ block: 'start' }); true`)
      await a.esp(300)
      await a.captura(foto('entrada_enlace', 1))
      await click('[data-datos-a-mano="entrada-sin-codigo"]')
      await a.esp(900)
      const d = await dialogo()
      debe(d && /^Datos de la entrada/.test(d) && /Localizador/i.test(d), 'entrada', `abre «Datos de la entrada» con el localizador (${d?.slice(0, 90)})`)
      const vacio = await ev("(() => { const i = document.querySelector('[role=dialog] [data-entrada-dato=\"localizador\"]'); return i ? [i.value, i.placeholder] : null })()")
      debe(vacio && vacio[0] === '' && vacio[1] === 'ABC123', 'entrada', `localizador vacío con su ejemplo en gris (${JSON.stringify(vacio)})`)
      await a.captura(foto('entrada_hoja', 2))
      await escribir('[role=dialog] [data-entrada-dato="localizador"]', 'qwe456')
      await guardarHoja('/^Guardar los datos$/')
      await a.esp(1000)
      await cerrarHojas()
      const l = await lapices(fila)
      debe(l === 'entrada-arriba,entrada-datos', 'entrada', `al guardar a mano salen los dos lápices (${l})`)
      const t = await ev(`document.querySelector(${JSON.stringify(fila)})?.innerText.replace(/\\s+/g, ' ')`)
      debe(/Localizador QWE456/.test(t ?? ''), 'entrada', `con su localizador en el bloque de datos (${t?.slice(0, 160)})`)
      await ev(`document.querySelector(${JSON.stringify(fila)})?.scrollIntoView({ block: 'start' }); true`)
      await a.esp(300)
      await a.captura(foto('entrada_guardado', 3))
    }

    /* ── 4. Excursión: «Datos de la excursión» ── */
    // El viaje de pruebas tiene 3 días y las excursiones de Roma salen desde 4: se añade un día libre.
    await R("if (route().days.filter((x) => !x.isReturnLeg).length < 4) st().addFreeDay('Día libre'); return true")
    await a.esp(1500)
    await R(`st().addReservation({ id: 'res-10s9b-a-exc', kind: 'excursion', refId: 'pompeya_sorrento', name: 'Excursión a Pompeya y Sorrento', placeNames: [], dateIso: ${JSON.stringify(base.dateIso)}, dayNumber: null, time: '07:30', excursionId: 'pompeya_sorrento', excursionData: null, precio: { amount: 98.26, currency: 'EUR' } }, null, null); return true`)
    await a.esp(1500)
    await R("st().setMode('bookings'); return true")
    await a.esp(1200)
    // El bloque de excursiones puede estar plegado dentro de su sitio: se busca su fila y, si no sale, se abre lo que la guarda.
    let hayExc = await ev("Boolean(document.querySelector('[data-excursion-fila]'))")
    if (!hayExc) {
      await ev("(() => { for (const c of document.querySelectorAll('[data-cabecera-clara]')) { if (/Excursion/i.test(c.textContent || '')) c.click() } return true })()")
      await a.esp(900)
      hayExc = await ev("Boolean(document.querySelector('[data-excursion-fila]'))")
    }
    const eExc = await enlace('excursion-sin-codigo')
    if (!hayExc) {
      debe(false, 'excursion', 'la excursión reservada no sale en RESERVAS (no se ha podido probar)')
    } else if (sin) {
      debe(eExc == null, 'enlace', 'sin pase no sale «o escribe los datos a mano» en la excursión')
    } else {
      debe(eExc && eExc.texto === 'o escribe los datos a mano', 'enlace', `con pase sale bajo [Añadir tu excursión] (${JSON.stringify(eExc)})`)
      const filaE = '[data-excursion-fila]'
      debe((await lapices(filaE)) === 'excursion-arriba', 'excursion', 'antes de escribir, solo el lápiz de arriba')
      await ev("document.querySelector('[data-excursion-fila]')?.scrollIntoView({ block: 'start' }); true")
      await a.esp(300)
      await a.captura(foto('excursion_enlace', 1))
      await click('[data-datos-a-mano="excursion-sin-codigo"]')
      await a.esp(900)
      const d = await dialogo()
      debe(d && /^Datos de la excursión/.test(d) && /Punto de encuentro/i.test(d) && /Localizador/i.test(d) && /Personas/i.test(d), 'excursion', `abre «Datos de la excursión» (${d?.slice(0, 100)})`)
      const vacios = await ev("['localizador','personas'].map((k) => { const i = document.querySelector('[role=dialog] [data-excursion-campo=\"' + k + '\"]'); return i ? [i.value, i.placeholder] : null })")
      debe(vacios.every((v) => v && v[0] === '' && v[1] !== ''), 'excursion', `localizador y personas vacíos con su ejemplo en gris (${JSON.stringify(vacios)})`)
      await a.captura(foto('excursion_hoja', 2))
      await escribir('[role=dialog] [data-excursion-campo="localizador"]', 'civ789')
      await escribir('[role=dialog] [data-excursion-campo="personas"]', '2')
      await guardarHoja('/^Guardar los datos$/')
      await a.esp(1000)
      await cerrarHojas()
      const l = await lapices(filaE)
      debe(l === 'excursion-arriba,excursion-datos', 'excursion', `al guardar a mano salen los dos lápices (${l})`)
      const t = await ev("document.querySelector('[data-excursion-fila]')?.innerText.replace(/\\s+/g, ' ')")
      debe(/Localizador CIV789/.test(t ?? '') && /2 personas/.test(t ?? ''), 'excursion', `con su localizador y sus personas (${t?.slice(0, 200)})`)
      await ev("document.querySelector('[data-excursion-fila]')?.scrollIntoView({ block: 'start' }); true")
      await a.esp(300)
      await a.captura(foto('excursion_guardado', 3))
    }
  } finally {
    a.cerrar()
  }
}

await pasada('gratis')
await pasada('completa')

console.log(`\nPrueba 10S9b A: ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
for (const f of fallos) console.log(` ✗ [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
