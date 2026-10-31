// Tanda 10S7b (agente V) · apartados 4 y 6:
//   4 · «Empezar de cero»: el diálogo ya no dice «el día de prueba» y añade «Las pruebas gratis que ya has usado no vuelven.» (pruebaTanda10J comprueba el texto exacto y se pasa aparte);
//   6 · la reserva del hotel en un viaje compartido: nombre, dirección, fechas y teléfono los ve todo el viaje; el localizador solo quien lo añadió (billetes_personales de la 0070, sin migración).
// Capturas docs/dias/capturas_jutrip/10s7b_hotel_<n>.jpg (390 x 844).
//   APP_URL=http://localhost:5173 API_URL=http://localhost:8787 node scripts/destino/_conCola.mjs node scripts/destino/pruebaTanda10S7b_V.mjs
// (Con SOLO_SECO=1 se pasa solo la parte sin navegador.)
import fs from 'node:fs'
import path from 'node:path'

const APP = process.env.APP_URL ?? 'http://localhost:5173'
const fallos = []
let comprobaciones = 0
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) fallos.push({ regla, texto })
}
const leer = (f) => fs.readFileSync(f, 'utf8')

/* ───────────────────────── A. Sin navegador ───────────────────────── */
console.log('A. «Empezar de cero»')
{
  const panel = leer('src/components/logros/AdminLogros.tsx')
  const dialogo = panel.match(/<p className="font-semibold">(Se borrará[^<]*)<\/p>/)?.[1] ?? ''
  debe(dialogo === 'Se borrará todo lo de tu cuenta: viajes, reservas, fotos, logros, experiencia y los pases. La cuenta se queda. Las pruebas gratis que ya has usado no vuelven. ¿Seguro?', 'dialogo', `el diálogo dice el texto nuevo (${dialogo})`)
  debe(!/el día de prueba/.test(dialogo) && /Las pruebas gratis que ya has usado no vuelven\./.test(dialogo), 'dialogo', 'sin «el día de prueba» y con la línea nueva')
  const explicacion = panel.match(/<section data-empezar-de-cero[^>]*>\s*<p className="text-text\/60">([^<]*)<\/p>/)?.[1] ?? ''
  debe(explicacion.length > 0 && !/día de prueba/.test(explicacion), 'dialogo', 'la explicación de encima del botón tampoco promete borrar el día de prueba')
  const reinicio = panel.match(/Deja a cero lo de pruebas de TU cuenta[^<]*/)?.[0] ?? ''
  debe(/el día de prueba de HOY/.test(reinicio), 'dialogo', '«Reiniciar mis pruebas» no se toca (sigue hablando del día de prueba de HOY)')
  const j = leer('scripts/destino/pruebaTanda10J.mjs')
  debe(/Las pruebas gratis que ya has usado no vuelven/.test(j) && !/experiencia, el día de prueba y los pases\. La cuenta se queda\. ¿Seguro\?'/.test(j), 'dialogo', 'pruebaTanda10J comprueba el texto nuevo y lo dejó escrito «antes → ahora → decisión de Eric (10S7b, 31-oct)»')
  debe(/decisión de Eric \(10S7b, 31-oct\)/.test(j), 'dialogo', 'con la anotación en la prueba')
}

console.log('A. La reserva del hotel: el localizador es privado, sin migración')
{
  const fuente = leer('src/components/route/reservas/ReservaDelAlojamiento.tsx')
  const store = leer('src/store/useBilleteStore.ts')
  debe(/ponerAlojamiento/.test(fuente) && /ponerAlojamiento/.test(store) && /alojamientos\?: Record<string, BilleteDeAlojamiento>/.test(store), 'privado', 'el localizador se guarda en el documento privado del billete (alojamientos)')
  debe(/delDueno[\s\S]*datos\.alojamientos/.test(store), 'privado', 'y solo sube a la fila privada de quien lo puso (delDueno)')
  debe(/const compartida = nueva \? \{ \.\.\.nueva, localizador: null \}/.test(fuente), 'privado', 'al guardar, la reserva compartida del alojamiento NO lleva localizador')
  // antes → ahora → decisión de Eric (10S8, 31-oct): la 0073 (contador de lecturas de documentos) es de la 10S8, no de la 10S7b; la 10S7b sigue sin migración propia.
  const migs = fs.readdirSync('supabase/migrations').filter((f) => /^007[4-9]_/.test(f) || /^0073_(?!lecturas_de_documentos)/.test(f))
  debe(migs.length === 0, 'migracion', `sin migración nueva de la 10S7b (${migs.join(', ') || 'ninguna'})`)
}

if (process.env.SOLO_SECO) {
  console.log(`\n${comprobaciones} comprobaciones, ${fallos.length} fallos (solo la parte sin navegador)`)
  for (const f of fallos) console.log(`  ✗ [${f.regla}] ${f.texto}`)
  process.exit(fallos.length ? 1 : 0)
}

/* ───────────────────────── B. La pantalla (navegador) ───────────────────────── */
const { abrirApp } = await import('./_enLaApp.mjs')
const SALIDA = path.resolve('docs/dias/capturas_jutrip')
fs.mkdirSync(SALIDA, { recursive: true })
const foto = (n) => path.join(SALIDA, `10s7b_hotel_${n}.jpg`)

async function pasada(version) {
  const sin = version === 'gratis'
  const nom = sin ? 'sin pase' : 'con pase'
  console.log(`\nB. El hotel compartido ${nom}`)
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
    const estado = (js) => ev(`(() => { const st = window.__ruta.getState(); return ${js} })()`)
    const textoBloque = () => ev("(document.querySelector('[data-blk=\"aloj\"]')?.innerText || '').replace(/\\s+/g, ' ')")
    const abrirBloque = async () => {
      if (!(await ev("Boolean(document.querySelector('[data-blk=\"aloj\"] [data-alojamiento-caja]'))"))) {
        await ev("document.querySelector('[data-blk=\"aloj\"] [data-cabecera-clara]')?.click(); true")
        await a.esp(700)
      }
    }
    // Un viaje compartido: yo (invitada «yo») y otra persona («otra»); el hotel y su reserva (compartida: SIN localizador) ya puestos.
    await ev(`(() => {
      window.__viaje.getState().poner({ gente: [{ id: 'otra', nombre: 'Marta', foto: null, esAdmin: true }, { id: 'yo', nombre: 'Ana', foto: null, esAdmin: false, esYo: true }] })
      const st = window.__ruta.getState(); const r = st.route
      window.__ruta.setState({ route: { ...r, accommodationZone: ${sin ? 'null' : "'centro'"}, accommodationAddress: ${sin ? 'null' : "'Via Marsala 5, Roma'"} } })
      st.setAccommodationHotel(r.days[0].id, { name: 'Hotel Palatino', precio: { amount: 280, currency: 'EUR' }, reserva: { direccion: 'Via Cavour 12, Roma', entrada: '2026-11-26', salida: '2026-11-29', noches: 3, horaEntrada: '15:00', horaSalida: '11:00', telefono: '+39 06 1234 5678', localizador: null } })
      return true })()`)
    const segId = await estado('st.route.days[0].id')
    await ev("window.__ruta.getState().setMode('bookings'); true")
    await a.esp(1500)
    await abrirBloque()

    // 1. El localizador lo puso OTRA persona: yo veo la dirección, las fechas y el teléfono, y no el localizador.
    await ev(`window.__billete.setState({ tripId: null, datos: { alojamientos: { ${JSON.stringify(segId)}: { localizador: 'HX48K2', dueno: 'otra', actualizado: new Date().toISOString() } } } }); true`)
    await a.esp(700)
    const otro = await textoBloque()
    // antes → ahora → decisión de Eric (10S8, 31-oct): la fila «Jueves 26 → Domingo 29 · 3 noches» → las cajas de fechas y noches de Design (mismo dato, otra forma; el rótulo sale en mayúsculas); la fila del localizador se llama ahora data-fila-design.
    debe(/Via Cavour 12, Roma/.test(otro) && /jueves 26 → domingo 29/i.test(otro) && /3\s*noches/i.test(otro) && /\+39 06 1234 5678/.test(otro), 'compartido', `${nom}: el otro ve la dirección, las fechas y el teléfono (${otro.slice(0, 160)})`)
    debe(/Entrada desde las 15:00/.test(otro), 'compartido', `${nom}: y las horas`)
    debe(!/HX48K2/.test(otro) && !/Localizador/.test(otro), 'compartido', `${nom}: pero NO el localizador (lo añadió otra persona)`)
    debe((await ev("Boolean(document.querySelector('[data-blk=\"aloj\"] [data-fila-design=\"localizador\"]'))")) === false, 'compartido', `${nom}: ni la fila del localizador`)
    await ev("document.querySelector('[data-blk=\"aloj\"] [data-reserva-aloj-filas]')?.scrollIntoView({ block: 'center' }); true"); await a.esp(400)
    await a.captura(foto(`${version}_1_el_otro`))

    // 2. Lo puse yo: sí lo veo.
    await ev(`window.__billete.setState({ tripId: null, datos: { alojamientos: { ${JSON.stringify(segId)}: { localizador: 'HX48K2', dueno: 'yo', actualizado: new Date().toISOString() } } } }); true`)
    await a.esp(700)
    const mio = await textoBloque()
    debe(/Localizador HX48K2/.test(mio) && /Via Cavour 12, Roma/.test(mio), 'compartido', `${nom}: quien lo añadió ve su localizador y la dirección (${mio.slice(0, 160)})`)
    await ev("document.querySelector('[data-blk=\"aloj\"] [data-reserva-aloj-filas]')?.scrollIntoView({ block: 'center' }); true"); await a.esp(400)
    await a.captura(foto(`${version}_2_quien_lo_anadio`))

    // 3. Lo compartido nunca lleva el localizador (lo que viaja con la ruta a los demás).
    const enLaRuta = await estado('JSON.stringify(st.accommodationSelections[st.route.days[0].id] ?? null)')
    debe(!/HX48K2/.test(enLaRuta), 'compartido', `${nom}: el alojamiento de la ruta compartida no lleva el localizador`)

    // 4. Un viaje antiguo con el localizador dentro de lo compartido: el administrador lo pasa a lo privado y se quita de lo compartido.
    await ev(`(() => {
      window.__viaje.getState().poner({ gente: [{ id: 'yo', nombre: 'Ana', foto: null, esAdmin: true, esYo: true }] })
      window.__billete.setState({ tripId: null, datos: {} })
      const st = window.__ruta.getState(); const h = st.accommodationSelections[st.route.days[0].id]
      st.setAccommodationHotel(st.route.days[0].id, { ...h, reserva: { ...h.reserva, localizador: 'ANTIGUO1' } })
      return true })()`)
    await a.esp(2000)
    const trasMigrar = await estado('JSON.stringify(st.accommodationSelections[st.route.days[0].id] ?? null)')
    debe(!/ANTIGUO1/.test(trasMigrar), 'antiguo', `${nom}: un localizador que estaba en lo compartido se quita de ahí`)
    const guardado = await ev('JSON.stringify(window.__billete.getState().datos.alojamientos ?? null)')
    debe(/ANTIGUO1/.test(guardado), 'antiguo', `${nom}: y el administrador lo conserva en lo privado (${guardado})`)
  } finally {
    await a.cerrar()
  }
}

try {
  await pasada('pago')
  await pasada('gratis')
} catch (e) {
  fallos.push({ regla: 'error', texto: String(e && e.stack ? e.stack : e) })
}
console.log(`\n${comprobaciones} comprobaciones, ${fallos.length} fallos`)
for (const f of fallos) console.log(`  ✗ [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
