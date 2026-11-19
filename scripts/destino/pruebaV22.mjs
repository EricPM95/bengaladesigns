// La prueba de la Tanda V22: EL SEGURO DE VIAJE Y LA eSIM EN «X DE Y LISTO» DE RESERVAS (docs/dias/PROMPT_V22_SEGURO_ESIM.md).
//   node scripts/destino/_conCola.mjs node scripts/destino/pruebaV22.mjs     (Vite en 5173 y la API en 8787; la parte 1 no necesita nada)
//  1. La regla de la eSIM (pura) y los datos   2. En un Chrome: el seguro cuenta, «Ya tengo seguro», los cuatro casos de origen y destino, «Ya la tengo», sin origen
import fs from 'node:fs'
import { abrirApp } from './_enLaApp.mjs'
import { idDeTarjetaEsim, paisDeSalida, reglaDeEsim } from '../../src/lib/esimRegla.ts'

let comprobaciones = 0
const fallos = []
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) {
    fallos.push({ regla, texto })
    console.log(`  FALLO [${regla}] ${texto}`)
  }
}
const leer = (f) => fs.readFileSync(f, 'utf8')
const APP = process.env.APP_URL ?? 'http://localhost:5173'
const CAP = 'docs/dias/V22_capturas'
fs.mkdirSync(CAP, { recursive: true })

/* ───────── 1. La regla ───────── */
console.log('1. La regla de la eSIM')
{
  const datos = JSON.parse(leer('data/esim/roaming.json'))
  const lista = new Set(datos.roaming_como_en_casa)
  const esimNecesaria = (o, d) => reglaDeEsim(o, d, lista)
  debe(Array.isArray(datos.roaming_como_en_casa) && datos.roaming_como_en_casa.includes('es') && datos.roaming_como_en_casa.includes('it') && !datos.roaming_como_en_casa.includes('gb') && datos.roaming_como_en_casa.length >= 27, 'datos', 'la lista de países (UE y EEE, sin el Reino Unido) está en data/esim/roaming.json')
  debe(esimNecesaria('es', 'es') === 'no', 'regla', 'el mismo país (Madrid → Lanzarote): no hace falta')
  debe(esimNecesaria('es', 'it') === 'no' && esimNecesaria('de', 'es') === 'no' && esimNecesaria('no', 'pt') === 'no', 'regla', 'dos países de la UE o el EEE (España → Italia, Alemania → Lanzarote): no hace falta')
  debe(esimNecesaria('mx', 'it') === 'si' && esimNecesaria('ar', 'es') === 'si' && esimNecesaria('us', 'it') === 'si', 'regla', 'México → Roma, Argentina → Lanzarote, Estados Unidos → Roma: sí hace falta')
  debe(esimNecesaria('gb', 'it') === 'si' && esimNecesaria('gb', 'es') === 'si', 'regla', 'Reino Unido → UE: sí hace falta (muchas compañías cobran el roaming)')
  debe(esimNecesaria('it', 'gb') === 'si', 'regla', 'y UE → Reino Unido también')
  debe(esimNecesaria(null, 'it') === 'desconocido' && esimNecesaria('', 'it') === 'desconocido' && esimNecesaria('es', null) === 'desconocido', 'regla', 'sin origen no se sabe: ni sí ni no')
  debe(paisDeSalida({ originPlace: { countryCode: 'MX' } }) === 'mx' && paisDeSalida({}) === null && paisDeSalida(null) === null, 'origen', 'el origen es el país de la ciudad de salida del formulario (sin ella, null)')
  debe(idDeTarjetaEsim(0, 'it') === 'esim' && idDeTarjetaEsim(1, 'fr') === 'esim-fr', 'ids', 'la primera tarjeta de eSIM es «esim» (como siempre) y las demás «esim-<país>»')
}

/* ───────── 2. En un Chrome ───────── */
console.log('2. En la app')
async function viaje(version) {
  const a = await abrirApp(APP, { ruta: `/?cuentas=off&logros=off&apertura=0&version=${version}`, ancho: 390, alto: 844 })
  for (let i = 0; i < 120 && !(await a.evaluar("Boolean(document.querySelector('[data-primera-pantalla]'))").catch(() => false)); i++) await a.esp(500)
  for (let i = 0; i < 60 && !(await a.evaluar("typeof window.__rutaPrueba === 'function'").catch(() => false)); i++) await a.esp(500)
  await a.evaluar('window.__rutaPrueba().then(() => true)')
  for (let i = 0; i < 60 && !(await a.evaluar("import('/src/store/useRouteStore.ts').then((m) => Boolean(m.useRouteStore.getState().route))")); i++) await a.esp(1000)
  await a.esp(4000)
  for (let i = 0; i < 4; i++) {
    const h = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Entendido|Vale|Cerrar)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
    if (!h) break
    await a.esp(600)
  }
  return a
}
const poner = (a, origen) =>
  a.evaluar(`import('/src/store/useRouteStore.ts').then((m) => { const s = m.useRouteStore.getState(); const r = s.route; const answers = { ...r.answers }; ${origen ? `answers.originPlace = ${JSON.stringify(origen)}` : 'delete answers.originPlace'}; m.useRouteStore.setState({ route: { ...r, answers }, insuranceBooking: null, esimSelections: {}, esimPrecios: {}, dondeComprado: {} }); s.setMode('bookings'); return true })`)
const fichas = (a) => a.evaluar("Array.from(document.querySelectorAll('[data-blk=\"resumen\"] [data-ficha]')).map((b) => ({ clave: b.dataset.claveResumen, nombre: b.innerText.trim(), verde: b.innerText.includes('✓') || b.querySelector('span')?.innerText.trim() === '✓' }))")
const titulo = (a) => a.evaluar("(document.querySelector('[data-blk=\"resumen\"] em')?.innerText ?? '').replace(/\\s+/g, ' ')")

for (const version of ['completa', 'gratis']) {
  const a = await viaje(version)
  try {
    const ev = (js) => a.evaluar(js)
    // Madrid → Roma: sin ficha de eSIM y con «No la necesitas»
    await poner(a, { name: 'Madrid', fullName: 'Madrid, España', coordinates: { lat: 40.4, lng: -3.7 }, countryCode: 'es' })
    await a.esp(2000)
    let f = await fichas(a)
    debe(f.some((x) => x.clave === 'util-seguro' && /Seguro de viaje/.test(x.nombre)), `seguro ${version}`, `con ${version === 'completa' ? 'pase' : 'el viaje gratis'}, el seguro sale entre las fichas de «X de Y listo»`)
    debe(f[f.length - 1].clave === 'util-seguro', `orden ${version}`, 'y va al final (después de las de siempre)')
    debe(!f.some((x) => /esim/.test(x.clave ?? '')), `esim ${version}`, 'Madrid → Roma (UE): no hay ficha de eSIM')
    const total = Number((await titulo(a)).match(/de (\d+)/)?.[1])
    debe(total === f.length, `seguro ${version}`, `«X de Y»: Y = ${total} = las fichas que hay (${f.length})`)
    if (version === 'completa') {
      await ev("document.querySelector('[data-util-tarjeta=\"esim\"]').scrollIntoView({ block: 'center' }); true")
      await a.esp(600)
      const no = await ev("document.querySelector('[data-util-tarjeta=\"esim\"]')?.innerText.replace(/\\s+/g, ' ')")
      debe(/No la necesitas: tu tarifa vale en Italia/.test(no ?? '') && !/Comprar|Añadir/.test(no ?? ''), 'esim_no', `la tarjeta de «Útil para el viaje» dice «No la necesitas: tu tarifa vale en Italia», sin botones (${no})`)
      await a.captura(`${CAP}/ue_madrid_roma.jpg`)
      await ev("document.querySelector('[data-blk=\"resumen\"]').scrollIntoView(); true")
      // Tocar la ficha del seguro: baja a su tarjeta y la abre
      await ev("document.querySelector('[data-clave-resumen=\"util-seguro\"]').click(); true")
      await a.esp(1500)
      debe(/Seguro de viaje/.test(await ev("(document.querySelector('[role=dialog]')?.innerText ?? document.body.innerText)")) && (await ev("Boolean(document.querySelector('[data-util-tarjeta=\"seguro\"]'))")), 'ficha', 'tocar la ficha «Seguro de viaje» baja a su tarjeta y la abre')
      await ev("Array.from(document.querySelectorAll('button[aria-label=Cerrar]')).pop()?.click(); true")
      await a.esp(600)
    }
    // «Ya tengo seguro» lo pone en verde
    await ev("document.querySelector('[data-util-tarjeta=\"seguro\"]').scrollIntoView({ block: 'center' }); true")
    const hay = await ev("Boolean(document.querySelector('[data-ya-lo-tengo=\"seguro\"]'))")
    debe(hay, `ya_tengo ${version}`, '«Ya tengo seguro» sale en la tarjeta del seguro')
    await ev("document.querySelector('[data-ya-lo-tengo=\"seguro\"]').click(); true")
    await a.esp(600)
    const hoja = await ev("(document.querySelector('[data-hoja-ya-lo-tengo]')?.innerText ?? '').replace(/\\s+/g, ' ')")
    debe(/Ya tengo seguro/.test(hoja) && /¿Cuál\?/.test(hoja) && /opcional/.test(hoja) && !/€|precio/i.test(hoja), `ya_tengo ${version}`, `solo pregunta «¿Cuál?», opcional y sin precio (${hoja})`)
    await ev("(() => { const e = document.querySelector('[data-campo-cual]'); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(e, 'El de mi tarjeta'); e.dispatchEvent(new Event('input', { bubbles: true })); document.querySelector('[data-guardar-ya-lo-tengo]').click(); return true })()")
    await a.esp(900)
    f = await fichas(a)
    const seguro = f.find((x) => x.clave === 'util-seguro')
    debe(seguro?.verde, `ya_tengo ${version}`, '«Ya tengo seguro» deja la ficha en verde con ✓')
    const t2 = await titulo(a)
    debe(/^1 de \d+ listo$/.test(t2) || /^\d+ de \d+ listo$/.test(t2), `seguro ${version}`, `y suma en «X de Y listo» (${t2})`)
    debe(/Lo tienes · El de mi tarjeta/.test(await ev("document.querySelector('[data-util-tarjeta=\"seguro\"]')?.innerText.replace(/\\s+/g, ' ')")), `ya_tengo ${version}`, 'y su tarjeta dice «Lo tienes · El de mi tarjeta»')
    if (version === 'completa') await a.captura(`${CAP}/seguro_ya_tengo.jpg`)

    if (version === 'completa') {
      // Ciudad de México → Roma y Londres → Roma: con ficha de eSIM
      for (const [nombre, cc, captura] of [['Ciudad de México', 'mx', 'fuera_ue_mexico_roma'], ['Londres', 'gb', null]]) {
        await poner(a, { name: nombre, fullName: nombre, coordinates: { lat: 10, lng: 10 }, countryCode: cc })
        await a.esp(1800)
        f = await fichas(a)
        debe(f.some((x) => x.clave === 'util-esim' && /eSIM/.test(x.nombre) && !x.verde), 'esim_si', `${nombre} → Roma: hay ficha de eSIM (sin hacer)`)
        const totalEs = Number((await titulo(a)).match(/de (\d+)/)?.[1])
        debe(totalEs === f.length, 'esim_si', `y cuenta en «X de Y» (Y = ${totalEs})`)
        const tarjetaEs = await ev("document.querySelector('[data-util-tarjeta=\"esim\"]')?.innerText.replace(/\\s+/g, ' ')")
        debe(/Comprar/.test(tarjetaEs ?? '') && /Ya la tengo/.test(tarjetaEs ?? '') && !/No la necesitas/.test(tarjetaEs ?? ''), 'esim_si', `su tarjeta sale con [Comprar] y «Ya la tengo» (${tarjetaEs})`)
        if (captura) await a.captura(`${CAP}/${captura}.jpg`)
      }
      // «Ya la tengo» la pone en verde
      await ev("document.querySelector('[data-util-tarjeta=\"esim\"]').scrollIntoView({ block: 'center' }); document.querySelector('[data-ya-lo-tengo=\"esim\"]').click(); true")
      await a.esp(600)
      await ev("document.querySelector('[data-guardar-ya-lo-tengo]').click(); true")
      await a.esp(900)
      f = await fichas(a)
      debe(f.find((x) => x.clave === 'util-esim')?.verde === true, 'ya_la_tengo', '«Ya la tengo» deja la ficha de la eSIM en verde con ✓')
      // Sin origen: la eSIM no cuenta y sale como hoy
      await poner(a, null)
      await a.esp(1800)
      f = await fichas(a)
      debe(!f.some((x) => /esim/.test(x.clave ?? '')), 'sin_origen', 'sin origen, la eSIM no cuenta en «X de Y»')
      const sin = await ev("document.querySelector('[data-util-tarjeta=\"esim\"]')?.innerText.replace(/\\s+/g, ' ')")
      debe(/Comprar/.test(sin ?? '') && !/No la necesitas/.test(sin ?? ''), 'sin_origen', 'y su tarjeta sale como hoy (con [Comprar]), sin dar nada por hecho')
      await ev("document.querySelector('[data-util-tarjeta=\"esim\"]').scrollIntoView({ block: 'center' }); true")
      await a.captura(`${CAP}/sin_origen.jpg`)
    }
  } finally {
    await a.cerrar()
  }
}

// Madrid → Lanzarote (mismo país): sin ficha de eSIM y con «No la necesitas: tu tarifa vale en España»
{
  const a = await abrirApp(APP, { ruta: '/?cuentas=off&logros=off&apertura=0&version=completa', ancho: 390, alto: 844 })
  try {
    const ev = (js) => a.evaluar(js)
    for (let i = 0; i < 360 && !(await ev("typeof window.__rutaLanzarote === 'function'").catch(() => false)); i++) await a.esp(500)
    await ev("window.__rutaLanzarote({ zona: 'costa_teguise', coche: 'alquiler' }).then(() => true)")
    for (let i = 0; i < 60 && !(await ev("import('/src/store/useRouteStore.ts').then((m) => Boolean(m.useRouteStore.getState().route))")); i++) await a.esp(1000)
    await a.esp(3500)
    for (let i = 0; i < 6; i++) {
      const h = await ev("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale|Cerrar)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
      if (!h) break
      await a.esp(600)
    }
    await ev("import('/src/store/useRouteStore.ts').then((m) => { const s = m.useRouteStore.getState(); const r = s.route; m.useRouteStore.setState({ route: { ...r, answers: { ...r.answers, originPlace: { name: 'Madrid', fullName: 'Madrid, España', coordinates: { lat: 40.4, lng: -3.7 }, countryCode: 'es' } } } }); s.setMode('bookings'); return true })")
    await a.esp(2500)
    const f = await fichas(a)
    debe(f.some((x) => x.clave === 'util-seguro') && !f.some((x) => /esim/.test(x.clave ?? '')), 'esim_no', 'Madrid → Lanzarote: el seguro cuenta y no hay ficha de eSIM')
    const no = await ev("document.querySelector('[data-util-tarjeta=\"esim\"]')?.innerText.replace(/\\s+/g, ' ')")
    debe(/No la necesitas: tu tarifa vale en España/.test(no ?? ''), 'esim_no', `y la tarjeta dice «No la necesitas: tu tarifa vale en España» (${no})`)
  } finally {
    await a.cerrar()
  }
}

console.log(`\n${comprobaciones} comprobaciones · ${fallos.length} fallos`)
for (const f of fallos) console.log(` ✗ [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
