// Tanda 10S9, agente A: apartados 0b (datos de las excursiones: manda nuestra tabla) y 6 (los botones flotantes se esconden al bajar y vuelven al subir).
//   APP_URL=http://localhost:5173 API_URL=http://localhost:8787 node scripts/destino/_conCola.mjs node scripts/destino/pruebaTanda10S9_A.mjs [sinNavegador=1]
// Necesita la API en 8787 (reiniciada tras tocar roma.json) y el Vite en 5173 con el código nuevo. Un Chrome, por la cola. Capturas: docs/dias/capturas_jutrip/10s9_flotantes_*.jpg, 10s9_excursiones_*.jpg
import fs from 'node:fs'
import path from 'node:path'

const args = Object.fromEntries(process.argv.slice(2).map((x) => x.split(/=(.*)/s).slice(0, 2)))
const API = process.env.API_URL ?? 'http://localhost:8787'
const APP = process.env.APP_URL ?? 'http://localhost:5173'
const SALIDA = path.resolve('docs/dias/capturas_jutrip')
fs.mkdirSync(SALIDA, { recursive: true })
const jpg = (n) => path.join(SALIDA, `10s9_${n}.jpg`)
const fallos = []
let n = 0
const debe = (cond, texto) => {
  n++
  if (!cond) {
    fallos.push(texto)
    console.log(`  ✗ ${texto}`)
  }
}
const leer = (f) => fs.readFileSync(f, 'utf8')
const sinComentarios = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

// ── 1. (0b) Los datos: Ostia Antica y Nápoles y Pompeya en tren ───────────────────────────────────────────────────────────────────────────────────────────────
console.log('1. Los datos de nuestra tabla')
const roma = JSON.parse(leer('data/pipeline_v2/roma.json'))
const por = Object.fromEntries(roma.excursions.options.map((o) => [o.id, o]))
{
  const o = por.ostia_antica
  debe(o.rating === 9.6 && o.rating_max === 10 && o.review_count === 294, `Ostia: nota ${o.rating}/${o.rating_max}, ${o.review_count} opiniones (9,6/10, 294)`)
  debe(o.duration_hours === 3 && o.duration_label === '3 h', `Ostia: duración ${o.duration_label} (3 h)`)
  debe(o.cancellation === 'gratuita' && o.cancellation_note === 'Gratuita hasta 3 días antes', `Ostia: cancelación ${o.cancellation} / ${o.cancellation_note}`)
  debe(o.meeting_point === 'Piazzale Ostiense (salida del metro Piramide)', `Ostia: punto de encuentro «${o.meeting_point}»`)
  debe(o.checked === '2026-11-01 (web de Civitatis)', `Ostia: comprobado «${o.checked}»`)
  debe(o.price_from_eur === 52, `Ostia: el precio se queda (${o.price_from_eur})`)
  const nap = por.napoles_pompeya_tren
  debe(nap.cancellation === 'no_reembolsable' && nap.checked === '2026-11-01 (web de Civitatis)', `Nápoles y Pompeya en tren: cancelación ${nap.cancellation}, comprobado «${nap.checked}»`)
  debe(por.florencia_tren.cancellation === 'no_reembolsable', 'Florencia en tren sigue «no reembolsable»')
  // Mismo aviso, una sola pieza para todas las superficies: se pinta por el dato, no por el id (Florencia, Nápoles y las que vengan).
  const aviso = sinComentarios(leer('src/components/route/excursions/AvisosExcursion.tsx'))
  debe(/cancellation !== 'no_reembolsable'/.test(aviso) && !/florencia/i.test(aviso), 'el aviso «No reembolsable» sale por el dato (cancellation), no por el nombre de Florencia')
  for (const f of ['src/components/route/excursions/ExcursionsPage.tsx', 'src/components/route/dayDetail/ExcursionBlocks.tsx', 'src/components/route/dayDetail/excursion/ExcursionDayPage.tsx', 'src/components/route/placeExplorer/PlaceExplorerScreen.tsx']) {
    const s = sinComentarios(leer(f))
    debe(/AvisosExcursion|AvisoNoReembolsable/.test(s) && !/florencia_tren|florencia-tren/.test(s), `${path.basename(f)}: usa el aviso compartido y no uno propio de Florencia`)
  }
}

// ── 2. (0b) El interruptor: la API de pruebas no pisa lo nuestro ──────────────────────────────────────────────────────────────────────────────────────────────
console.log('2. Mandan los nuestros (interruptor CIVITATIS_DATOS_API_MANDAN)')
{
  const { crearServicioCivitatis } = await import('../../server/civitatis/servicio.js')
  const codigo = sinComentarios(leer('server/civitatis/servicio.js'))
  debe(/CIVITATIS_DATOS_API_MANDAN/.test(codigo) && /datosApiMandan/.test(codigo), 'el interruptor existe (opción datosApiMandan / variable CIVITATIS_DATOS_API_MANDAN)')
  delete process.env.CIVITATIS_DATOS_API_MANDAN
  const bruto = { id: 2283, title: 'Ostia Antica (sandbox)', minimumPrice: 25, score: 9.64, reviews: 1234, url: 'https://sandbox.civitatis.com/es/roma/ostia/', address: { shortAddress: 'Otro sitio', latitude: 41.87, longitude: 12.48 } }
  let pedidas = 0
  const cliente = { entorno: 'sandbox', tieneClaves: true, pedir: async () => (pedidas++, { ok: true, datos: bruto }) }
  const nuestras = roma.excursions.options.filter((o) => ['ostia_antica', 'florencia_pisa', 'napoles_pompeya_tren'].includes(o.id))
  const apagado = crearServicioCivitatis({ activa: true, cliente })
  const sin = await apagado.enriquecerExcursiones('roma', nuestras)
  debe(sin.enriquecidas === 0 && JSON.stringify(sin.opciones) === JSON.stringify(nuestras), 'apagado (lo normal): las excursiones salen idénticas a nuestra tabla (precio, nota, opiniones, duración, cancelación, punto de encuentro)')
  debe(sin.opciones.every((o) => o.civitatis === undefined), 'apagado: ninguna lleva la ficha de la API')
  const ostia = sin.opciones.find((o) => o.id === 'ostia_antica')
  debe(ostia.rating === 9.6 && ostia.review_count === 294 && ostia.price_from_eur === 52 && ostia.meeting_point.includes('Piramide'), 'apagado: Ostia sale con 9,6 / 294 / 52 € / Piramide, no con 9,64 / 1234 / 25 €')
  const encendido = crearServicioCivitatis({ activa: true, datosApiMandan: true, cliente })
  const con = await encendido.enriquecerExcursiones('roma', nuestras)
  debe(con.enriquecidas >= 1 && con.opciones.find((o) => o.id === 'ostia_antica').review_count === 1234, 'encendido (con la producción): la API vuelve a mandar (el mecanismo no se ha borrado)')
  process.env.CIVITATIS_DATOS_API_MANDAN = '1'
  const porVariable = crearServicioCivitatis({ activa: true, cliente })
  debe((await porVariable.enriquecerExcursiones('roma', nuestras)).enriquecidas >= 1, 'la variable de entorno CIVITATIS_DATOS_API_MANDAN=1 lo enciende')
  delete process.env.CIVITATIS_DATOS_API_MANDAN
}

// ── 3. El servidor (lo que recibe la app), también como administrador con la API encendida ──────────────────────────────────────────────────────────────────
console.log('3. El servidor')
{
  const r = await fetch(`${API}/api/destination-excursions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ destination: 'Roma', civitatis: true }) })
  const j = await r.json()
  const lista = j.excursions ?? []
  const ostia = lista.find((e) => e.id === 'ostia_antica')
  const nap = lista.find((e) => e.id === 'napoles_pompeya_tren')
  debe(Boolean(ostia) && ostia.rating === 9.6 && ostia.rating_max === 10 && ostia.review_count === 294, `el servidor da Ostia con 9,6/10 y 294 (${ostia?.rating}/${ostia?.rating_max}, ${ostia?.review_count})`)
  debe(ostia?.cancellation === 'gratuita' && ostia?.cancellation_note === 'Gratuita hasta 3 días antes' && ostia?.duration_label === '3 h', `Ostia: cancelación y duración (${ostia?.cancellation}, ${ostia?.duration_label})`)
  debe(String(ostia?.meeting_point).includes('Piramide'), `Ostia: punto de encuentro (${ostia?.meeting_point})`)
  debe(/52/.test(String(ostia?.estimated_price)) && ostia?.price_orientativo === true && ostia?.civitatis === undefined, `Ostia: precio 52 €, «orientativo» y sin ficha de la API (${ostia?.estimated_price}, ${ostia?.price_orientativo})`)
  debe(nap?.cancellation === 'no_reembolsable', `el servidor da Nápoles y Pompeya en tren «no reembolsable» (${nap?.cancellation})`)
  const flo = lista.find((e) => e.id === 'florencia_pisa')
  debe(flo?.civitatis === undefined && flo?.review_count === 704, `con la API pedida, Florencia y Pisa sigue con nuestras 704 opiniones (${flo?.review_count})`)
  const { excursionPagePayload } = await import('../../server/engine/excursionPage.js')
  const { findPipelineV2Data } = await import('../../server/routeAlgorithm.js')
  const pagina = excursionPagePayload('roma', findPipelineV2Data('Roma'))
  const po = pagina?.options.find((x) => x.id === 'ostia_antica')
  debe(po && po.cancellation === 'gratuita' && String(po.meeting_point ?? '').includes('Piramide'), `la página del día 4 de Ostia: cancelación y punto de encuentro (${po?.cancellation}, ${po?.meeting_point})`)
}

// ── 4. (6) Los botones flotantes: el código ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────
console.log('4. Los botones flotantes: un solo mecanismo')
{
  const flot = sinComentarios(leer('src/components/flotantes/flotantes.ts'))
  // (10S9b, Eric 1-nov) antes → ahora: ya no se esconden; se mira que el mecanismo de esconder ya no existe (lo vigila pruebaTanda10S9b).
  debe(!/escondidos/.test(flot) && !/estiloEscondido/.test(flot) && !/mostrarLosFlotantes/.test(flot), 'flotantes.ts: sin esconder (10S9b)')
  for (const f of ['src/components/logros/momentos/BotonFlotanteLogros.tsx', 'src/components/propuesta/BotonDePropuesta.tsx', 'src/components/reorganizar/ReorganizarHost.tsx']) {
    const s = sinComentarios(leer(f))
    // (10S9b) antes → ahora → decisión de Eric (1-nov): ya no se esconden; se comprueba que no queda rastro y que siguen usando useFlotantes.
    debe(!/estiloEscondido|data-flotantes-escondidos/.test(s) && /useFlotantes/.test(s), `${path.basename(f)} usa useFlotantes y no se esconde`)
  }
  const reglas = leer('docs/REGLAS_DE_LA_APP.md')
  debe(/10S9b/.test(reglas) && /siempre visibles/i.test(reglas), 'la regla de los flotantes (siempre visibles) está en REGLAS_DE_LA_APP.md')
}

// ── 5. En la pantalla ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
if (args.sinNavegador !== '1') {
  const { abrirApp } = await import('./_enLaApp.mjs')
  const a = await abrirApp(APP, { ruta: '/?cuentas=off&logros=on&logrosDemo=1&apertura=0&version=pago', ancho: 390, alto: 844, antes: "sessionStorage.setItem('trazo:invitado','1');sessionStorage.setItem('trazo:permiso','recomendar');" })
  try {
    const ev = (js) => a.evaluar(js)
    const R = (js) => ev(`(async () => { const M = await import('/src/store/useRouteStore.ts'); const st = () => M.useRouteStore.getState(); ${js} })()`)
    for (let i = 0; i < 240 && !(await ev("typeof window.__rutaPrueba === 'function'").catch(() => false)); i++) await a.esp(500)
    for (let intento = 0; intento < 8; intento++) {
      const ok = await ev('window.__rutaPrueba().then(() => true, (e) => String(e && e.message))').catch((e) => String(e))
      if (ok === true) break
      await a.esp(1500)
    }
    for (let i = 0; i < 90 && !(await ev("import('/src/store/useRouteStore.ts').then((m) => Boolean(m.useRouteStore.getState().route))").catch(() => false)); i++) await a.esp(1000)
    await a.esp(2500)
    for (let i = 0; i < 6; i++) {
      const h = await ev("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale|Cerrar)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()").catch(() => false)
      if (!h) break
      await a.esp(600)
    }

    console.log('5a. Las excursiones en la pantalla')
    await R("st().setMode('days'); return true")
    await a.esp(800)
    await ev("(async () => { const S = await import('/src/store/useExcursionsStore.ts'); S.useExcursionsStore.getState().openPage(); return true })()")
    for (let i = 0; i < 40 && !(await ev("document.querySelectorAll('[role=dialog] ul > li').length >= 8").catch(() => false)); i++) await a.esp(500)
    await a.esp(1500)
    const tarjetas = await ev(`Array.from(document.querySelectorAll('[role=dialog] ul > li')).map((li) => ({ titulo: li.querySelector('h2')?.textContent ?? '', texto: li.textContent ?? '', noReemb: !!li.querySelector('[data-no-reembolsable]') }))`)
    const de = (t) => tarjetas.find((x) => x.titulo === t)
    const ost = de('Excursión a Ostia Antica')
    const nap = de('Excursión a Nápoles y Pompeya en tren de alta velocidad')
    const flo = de('Excursión a Florencia en tren de alta velocidad')
    debe(Boolean(ost) && /9,6\/10/.test(ost.texto) && /294/.test(ost.texto) && !ost.noReemb, `la tarjeta de Ostia: 9,6/10, 294 y sin «No reembolsable» (${ost?.texto.slice(0, 160)})`)
    debe(Boolean(ost) && /Gratuita hasta 3 días antes/.test(ost.texto) && /3 ?h/.test(ost.texto), 'la tarjeta de Ostia: «Gratuita hasta 3 días antes» y 3 h')
    debe(Boolean(nap) && nap.noReemb && /No reembolsable/.test(nap.texto), 'la tarjeta de Nápoles y Pompeya en tren lleva el aviso «No reembolsable»')
    debe(Boolean(flo) && flo.noReemb, 'la de Florencia en tren, igual (sin cambios)')
    if (nap) {
      await ev(`(() => { const li = Array.from(document.querySelectorAll('[role=dialog] ul > li')).find((x) => x.querySelector('h2')?.textContent === 'Excursión a Nápoles y Pompeya en tren de alta velocidad'); li?.scrollIntoView({ block: 'center' }); return true })()`)
      await a.esp(900)
      await a.captura(jpg('excursiones_napoles_no_reembolsable')).catch(() => {})
    }
    if (ost) {
      await ev(`(() => { const li = Array.from(document.querySelectorAll('[role=dialog] ul > li')).find((x) => x.querySelector('h2')?.textContent === 'Excursión a Ostia Antica'); li?.scrollIntoView({ block: 'center' }); return true })()`)
      await a.esp(900)
      await a.captura(jpg('excursiones_ostia')).catch(() => {})
    }
    await ev("(async () => { const S = await import('/src/store/useExcursionsStore.ts'); S.useExcursionsStore.getState().closePage?.(); return true })()").catch(() => {})
    await ev("Array.from(document.querySelectorAll('[role=dialog] button[aria-label=Cerrar], [role=dialog] button[aria-label=Volver]')).forEach((b) => b.click()); true").catch(() => {})
    await a.esp(800)

    // (10S9b, Eric 1-nov) antes → ahora → decisión de Eric: ya NO se esconden al bajar; siguen visibles y con toques después de bajar, subir y al final. El nombre del apartado se queda por los informes.
    console.log('5b. Los botones flotantes siguen siempre visibles (10S9b)')
    // Un invitado que solo recomienda (como en 10S5_J), para que salga también el lápiz encima del de los logros.
    await ev(`(async () => { const R = await import('/src/store/useRouteStore.ts'); const S = await import('/src/store/useSyncStore.ts'); const V = await import('/src/store/useViajeCompartido.ts'); R.useRouteStore.getState().setDevSimulatedTodayIso('2026-10-10'); S.useSyncStore.setState({ activeTripId: 'demo-viaje' }); V.useViajeCompartido.getState().poner({ tripId: 'demo-viaje', gente: [{ id: 'eric', nombre: 'Eric', foto: null, esAdmin: true, permiso: 'admin' }, { id: 'ana', nombre: 'Ana', foto: null, esAdmin: false, permiso: 'recomendar' }], yo: 'ana' }); return true })()`).catch(() => null)
    await a.esp(1000)
    await R("const d = st().route.days.find((x) => x.stops.length >= 2); st().removeStop(d.id, d.stops[d.stops.length - 1].id); return 1")
    for (const [modo, nombre] of [['bookings', 'RESERVAS'], ['days', 'DÍAS']]) {
      await R(`st().setMode('${modo}'); return true`)
      await a.esp(1800)
      if (modo === 'bookings') {
        // «Llegada y vuelta» y «Alojamiento» abiertos: son los que tenían el botón de logros encima de lo que se toca.
        await ev("(() => { for (const b of document.querySelectorAll('[data-blk=\"llegada\"] > button, [data-blk=\"alojamiento\"] > button, [data-blk=\"llegada-y-vuelta\"] > button')) b.getAttribute('aria-expanded') === 'false' && b.click(); return true })()").catch(() => {})
        await a.esp(900)
      }
      const estado = () => ev(`(() => { const q = (s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); const c = getComputedStyle(e); return { esc: e.hasAttribute('data-flotantes-escondidos'), op: Number(c.opacity), pe: c.pointerEvents, top: Math.round(r.top), bottom: Math.round(r.bottom) } }; return { logros: q('[data-boton-logros]'), lapiz: q('[data-boton-propuesta]') } })()`)
      const scroll = (js) => ev(`(() => { const sc = Array.from(document.querySelectorAll('*')).filter((e) => { const c = getComputedStyle(e); return (c.overflowY === 'auto' || c.overflowY === 'scroll') && e.scrollHeight > e.clientHeight + 200 && e.getBoundingClientRect().height > 300 }).sort((x, y) => (y.scrollHeight - y.clientHeight) - (x.scrollHeight - x.clientHeight))[0]; if (!sc) return null; ${js}; return { top: Math.round(sc.scrollTop), max: Math.round(sc.scrollHeight - sc.clientHeight) } })()`)
      const inicial = await estado()
      debe(Boolean(inicial.logros) && inicial.logros.esc === false && inicial.logros.op > 0.9, `${nombre}: arriba del todo, el botón de logros se ve (${JSON.stringify(inicial.logros)})`)
      debe(Boolean(inicial.lapiz) && inicial.lapiz.esc === false && inicial.lapiz.op > 0.9, `${nombre}: arriba del todo, el lápiz se ve (${JSON.stringify(inicial.lapiz)})`)
      if (args.capturas !== '0') await a.captura(jpg(`flotantes_${modo}_1_arriba`)).catch(() => {})
      const s1 = await scroll('sc.scrollTop = Math.min(400, sc.scrollHeight - sc.clientHeight)')
      debe(Boolean(s1) && s1.top > 100, `${nombre}: la pantalla se puede desplazar (${JSON.stringify(s1)})`)
      await a.esp(700)
      const abajo = await estado()
      debe(abajo.logros?.esc === false && abajo.logros.op > 0.9 && abajo.logros.pe !== 'none', `${nombre}: al BAJAR el botón de logros sigue visible y recibe toques (${JSON.stringify(abajo.logros)})`)
      debe(abajo.lapiz?.esc === false && abajo.lapiz.op > 0.9 && abajo.lapiz.pe !== 'none', `${nombre}: al BAJAR el lápiz sigue visible (${JSON.stringify(abajo.lapiz)})`)
      if (args.capturas !== '0') await a.captura(jpg(`flotantes_${modo}_2_bajando`)).catch(() => {})
      await scroll('sc.scrollTop = sc.scrollTop - 60')
      await a.esp(700)
      const sube = await estado()
      debe(sube.logros?.esc === false && sube.logros.op > 0.9 && sube.logros.pe !== 'none', `${nombre}: al SUBIR el botón de logros sigue visible (${JSON.stringify(sube.logros)})`)
      debe(sube.lapiz?.esc === false && sube.lapiz.op > 0.9, `${nombre}: al SUBIR el lápiz sigue visible (${JSON.stringify(sube.lapiz)})`)
      await scroll('sc.scrollTop = sc.scrollTop + 120')
      await a.esp(600)
      await scroll('sc.scrollTop = 0')
      await a.esp(700)
      const tope = await estado()
      debe(tope.logros?.esc === false && tope.logros.op > 0.9, `${nombre}: al llegar arriba del todo se ven igual (${JSON.stringify(tope.logros)})`)
      // Al final del todo siguen visibles (el hueco de abajo lo vigila 10S5_J).
      const fin = await scroll('sc.scrollTop = sc.scrollHeight')
      await a.esp(800)
      const alFinal = await estado()
      debe(Boolean(fin) && alFinal.logros?.esc === false && alFinal.logros.op > 0.9 && alFinal.lapiz?.op > 0.9, `${nombre}: al final de la pantalla los botones siguen visibles (${JSON.stringify(alFinal)})`)
      if (args.capturas !== '0') await a.captura(jpg(`flotantes_${modo}_3_final`)).catch(() => {})
    }
    // Cambiar de pestaña los trae de vuelta (la pantalla nueva empieza arriba).
    await R("st().setMode('bookings'); return true")
    await a.esp(1200)
    await ev(`(() => { const sc = Array.from(document.querySelectorAll('*')).filter((e) => { const c = getComputedStyle(e); return (c.overflowY === 'auto' || c.overflowY === 'scroll') && e.scrollHeight > e.clientHeight + 200 && e.getBoundingClientRect().height > 300 })[0]; if (sc) sc.scrollTop = sc.scrollHeight; return true })()`)
    await a.esp(700)
    const antes = await ev("document.querySelector('[data-boton-logros]')?.hasAttribute('data-flotantes-escondidos') ?? null")
    await R("st().setMode('explore'); return true")
    await a.esp(1200)
    const despues = await ev("document.querySelector('[data-boton-logros]')?.hasAttribute('data-flotantes-escondidos') ?? null")
    debe(antes === false && despues === false, `al cambiar de pestaña siguen visibles (antes ${antes}, después ${despues})`)
    // Un toque sobre el botón de logros, con la pantalla arriba, sigue abriendo la hoja de logros (el botón no se ha roto).
    await ev("document.querySelector('[data-boton-logros]')?.click(); true")
    await a.esp(1200)
    debe(await ev("Boolean(document.querySelector('[role=dialog], [data-hoja]'))"), 'el botón de logros sigue abriendo su hoja')
  } finally {
    a.cerrar()
  }
}

console.log(`pruebaTanda10S9_A: ${n} comprobaciones, ${fallos.length} fallos`)
for (const f of fallos) console.log(' ✗', f)
process.exit(fallos.length ? 1 : 0)
