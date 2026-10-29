// Tanda 10N10 (agente B): EXPLORAR + RUTA/DÍAS.
//   APP_URL=http://localhost:5173 API_URL=http://localhost:8787 node scripts/destino/_conCola.mjs node scripts/destino/pruebaTanda10N10_explorar.mjs
// Capturas (390x844) en docs/dias/capturas_jutrip/10n10_explorar_*.jpg
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'

let comprobaciones = 0
const fallos = []
const debe = (c, regla, texto) => {
  comprobaciones++
  if (!c) {
    fallos.push({ regla, texto })
    console.log(`  ✗ [${regla}] ${texto}`)
  }
}
const SALIDA = path.resolve('docs/dias/capturas_jutrip')
fs.mkdirSync(SALIDA, { recursive: true })
const jpg = (n) => path.join(SALIDA, `10n10_explorar_${n}.jpg`)
const APP = process.env.APP_URL ?? 'http://localhost:5173'
const RUTA = `/?cuentas=off&logros=on&logrosDemo=1&version=pago&apertura=0${process.env.PASE ? `&pase=${process.env.PASE}` : ''}`
const leer = (f) => fs.readFileSync(f, 'utf8')


// Muestreo cada 30 ms de la pastilla del pase; lo último que se sabía del pase de 'demo-viaje' (sin pase) ya guardado en el móvil, y el servidor del pase «tarda».
const MUESTREO = `
try { localStorage.setItem('trazo:pase:ultimo:demo-viaje', JSON.stringify({ cobro: true, conPase: false, puede: true, pruebaGastada: false })) } catch (e) {}
window.__muestras = []
window.__retrasoDemo = new Proxy({}, { get: (t, k) => (typeof k === 'string' && k.indexOf('/api/pase/estado') === 0 ? (window.__retrasoPase ?? 0) : undefined) })
setInterval(() => {
  const p = document.querySelector('[data-pastilla-pase]')
  window.__muestras.push({ t: Date.now(), p: p ? p.getAttribute('data-pastilla-pase') : null })
}, 30)
`

async function abrir({ antes = '' } = {}) {
  const app = await abrirApp(APP, { ruta: RUTA, antes })
  for (let i = 0; i < 300 && !(await app.evaluar("Boolean(document.querySelector('[data-primera-pantalla]'))").catch(() => false)); i++) await app.esp(500)
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
  const ev = (js) => app.evaluar(`(async () => { const R = await import('/src/store/useRouteStore.ts'); const S = await import('/src/store/useSyncStore.ts'); const route = () => R.useRouteStore.getState().route; const st = () => R.useRouteStore.getState(); ${js} })()`)
  await ev(`R.useRouteStore.getState().setDevSimulatedTodayIso('2026-10-10'); R.useRouteStore.getState().setMode('days'); return true`).catch(() => null)
  await app.esp(1200)
  return { app, ev }
}

const vistos = (app) => app.evaluar(`(() => {
  const mira = (sel) => { const e = document.querySelector(sel); if (!e) return null; const r = e.getBoundingClientRect(); const a = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return { encima: Boolean(a && a.closest(sel)), z: getComputedStyle(e).zIndex } }
  return { lapiz: mira('[data-boton-propuesta]'), logros: mira('[data-boton-logros]') }
})()`)

const textoBotones = (app) => app.evaluar(`Array.from(document.querySelectorAll('button')).map((b) => (b.textContent || '').trim().slice(0, 40))`)

let navegador = null
try {
  console.log('1. EXPLORAR: logros con bloque abierto, + en restaurantes, sin botón Free Tour')
  navegador = await abrir({ antes: MUESTREO })
  const { app, ev } = navegador
  await ev(`R.useRouteStore.getState().setMode('explore'); return 1`)
  await app.esp(1200)
  const bloques = await app.evaluar(`(() => {
    const res = []
    for (const b of document.querySelectorAll('button')) { const t = (b.textContent || ''); const m = t.match(/(Atracciones|Miradores|Restaurantes|Entradas|Excursiones|Baños|Fuentes)/); if (m && /\\b(lugar|lugares|sitios?|opci|con entrada|baños?|fuentes?)\\b/i.test(t)) res.push(m[1]) }
    return Array.from(new Set(res))
  })()`)
  debe(bloques.length >= 3, 'bloques', `EXPLORAR enseña bloques (${JSON.stringify(bloques)})`)
  for (const nombre of bloques) {
    await ev(`R.useRouteStore.getState().setMode('route'); return 1`)
    await app.esp(500)
    await ev(`R.useRouteStore.getState().setMode('explore'); return 1`)
    await app.esp(900)
    const abierto = await app.evaluar(`(() => { const t = Array.from(document.querySelectorAll('button')).find((b) => (b.textContent || '').includes(${JSON.stringify(nombre)}) && /\\b(lugar|lugares|sitios?|opci|con entrada|baños?|fuentes?)\\b/i.test(b.textContent || '')); if (!t) return false; t.click(); return true })()`)
    await app.esp(2500)
    const pantalla = await app.evaluar(`Boolean(document.querySelector('[data-titulo-explorador]'))`)
    debe(abierto && pantalla, 'logros', `«${nombre}» abre el mapa con el filtro`)
    const v = await vistos(app)
    const hojas = v.logros?.encima === true ? [] : await app.evaluar(`Array.from(document.querySelectorAll('[role="dialog"]:not([data-flotantes]), [role="alertdialog"], [data-hoja], .map-cover-overlay.items-end')).map((e) => e.tagName + '.' + String(e.className).slice(0, 60) + ' ' + (e.getAttribute('aria-label') ?? ''))`)
    debe(v.logros?.encima === true, 'logros', `«${nombre}»: se ve el botón de los logros (${JSON.stringify(v)}; hojas: ${JSON.stringify(hojas)})`)
    if (nombre === 'Atracciones') await app.captura(jpg('logros_atracciones'))
    if (nombre === 'Restaurantes') {
      await app.captura(jpg('restaurantes'))
      const mas = await app.evaluar(`document.querySelectorAll('button[aria-label^="Añadir "]').length`)
      debe(mas > 0, 'mas_restaurantes', `restaurantes en EXPLORAR llevan el «+» (${mas} botones)`)
    }
    const ft = await textoBotones(app)
    debe(!ft.includes('Free Tour'), 'free_tour', `sin botón «Free Tour» arriba en «${nombre}»`)
    await app.evaluar(`document.querySelector('button[aria-label="Cerrar"]')?.click()`)
    await app.esp(700)
  }

  // ---------------------------------------------------------------------------------------------------------------------------------------------------
  console.log('1b. La pastilla del pase se pinta al momento con lo último que se sabía')
  await ev(`R.useRouteStore.getState().setMode('route'); return 1`)
  await app.esp(800)
  await app.evaluar(`window.__retrasoPase = 4000; window.__muestras = []; true`)
  await ev(`S.useSyncStore.setState({ activeTripId: 'demo-viaje' }); return 1`)
  await app.esp(1500)
  {
    const m = await app.evaluar(`window.__muestras.filter((x) => x.p !== null).map((x) => x.p)`)
    const unicos = Array.from(new Set(m))
    debe(m.length > 0, 'pastilla', `la pastilla se ve en RUTA (${JSON.stringify(unicos)})`)
    debe(!unicos.includes('cargando'), 'pastilla', `nunca sale el hueco gris mientras llega la respuesta (${JSON.stringify(unicos)})`)
    debe(unicos.includes('sin'), 'pastilla', `se pinta con lo último que se sabía: «sin pase» (${JSON.stringify(unicos)})`)
    const cache = await app.evaluar(`localStorage.getItem('trazo:pase:ultimo:demo-viaje')`)
    debe(Boolean(cache), 'pastilla', 'lo último que se sabía queda guardado en el móvil')
    await app.captura(jpg('pastilla'))
  }

  // ---------------------------------------------------------------------------------------------------------------------------------------------------
  console.log('2. «+ Añadir parada» entre dos: solo sitios para visitar, vuelve a DÍAS, baja y marca, sin aviso ni Deshacer')
  await ev(`R.useRouteStore.getState().setMode('days'); return 1`)
  await app.esp(1500)
  const total = () => ev(`return route().days.reduce((n, d) => n + d.stops.length, 0)`)
  const nombres = () => ev(`return route().days.flatMap((d) => d.stops.map((s) => s.id + '|' + s.name))`)
  // El día de la ruta con más paradas: se abre su acordeón en DÍAS.
  await app.evaluar(`(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Entendido|Vale|Cerrar|Ahora no)$/.test((x.textContent || '').trim())); b?.click(); return true })()`)
  const diaId = await ev(`const d = route().days.filter((x) => !x.isReturnLeg && x.stops.length >= 3).sort((a, b) => b.stops.length - a.stops.length)[0]; return d ? d.id : null`)
  debe(Boolean(diaId), 'entre_dos', 'hay un día con tres paradas o más')
  await app.evaluar(`(() => { const e = document.querySelector('[data-day-id="' + ${JSON.stringify(diaId)} + '"] > div[role="button"]'); e?.scrollIntoView({ block: 'center' }); e?.click(); return Boolean(e) })()`)
  await app.esp(2000)
  const antes = await nombres()
  await app.captura(jpg('dia_abierto'))
  console.log('   botones con «Añadir»:', JSON.stringify(await app.evaluar(`Array.from(document.querySelectorAll('button')).filter((b) => /Añadir/.test(b.textContent || '')).map((b) => (b.textContent || '').trim().slice(0, 30))`)), 'día', diaId, 'abierto:', await app.evaluar(`document.querySelector('[data-day-id]') ? Array.from(document.querySelectorAll('[data-day-id]')).map((e) => e.getAttribute('data-day-id') + ':' + e.querySelectorAll('[data-stop-id]').length).join(',') : 'sin'`))
  const abrirMas = await app.evaluar(`(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /Añadir parada/.test(x.textContent || '')); if (!b) return false; b.scrollIntoView({ block: 'center' }); b.click(); return true })()`)
  debe(abrirMas === true, 'entre_dos', 'hay un «+ Añadir parada» entre dos paradas en DÍAS')
  await app.esp(2800)
  const titulo = await app.evaluar(`document.querySelector('[data-titulo-explorador]')?.textContent ?? ''`)
  debe(/Añadir parada/.test(titulo), 'entre_dos', `se abre la pantalla «Añadir parada» (${titulo})`)
  {
    const sinCirculo = await app.evaluar(`Array.from(document.querySelectorAll('button[aria-label^="Añadir "]')).filter((b) => (b.textContent || '').trim() !== '+').length`)
    const conCirculo = await app.evaluar(`Array.from(document.querySelectorAll('button[aria-label^="Añadir "]')).filter((b) => (b.textContent || '').trim() === '+' && !b.hasAttribute('data-mas-restaurante')).length`)
    const restau = await app.evaluar(`document.querySelectorAll('[data-mas-restaurante]').length`)
    debe(conCirculo > 0, 'visitar', `al abrir salen sitios para visitar con su «+» (${conCirculo})`)
    debe(restau === 0 && sinCirculo === 0, 'visitar', `al abrir NO salen restaurantes (${restau} con +, ${sinCirculo} otros)`)
    await app.captura(jpg('anadir_parada_lista'))
    const chip = await app.evaluar(`(() => { const c = Array.from(document.querySelectorAll('button[aria-pressed]')).find((b) => /Restaurantes/.test(b.textContent || '')); if (!c) return false; c.click(); return true })()`)
    await app.esp(1200)
    const restau2 = await app.evaluar(`document.querySelectorAll('[data-mas-restaurante]').length`)
    debe(chip === true && restau2 > 0, 'visitar', `tocando el bloque Restaurantes salen restaurantes con su «+» (${restau2})`)
    await app.evaluar(`Array.from(document.querySelectorAll('button[aria-pressed="true"]')).find((b) => /Restaurantes/.test(b.textContent || ''))?.click()`)
    await app.esp(800)
  }
  const botonFT = await textoBotones(app)
  debe(!botonFT.includes('Free Tour'), 'free_tour', 'sin botón «Free Tour» arriba en «Añadir parada»')
  const tAntes = await total()
  await app.evaluar(`(() => { const b = Array.from(document.querySelectorAll('button[aria-label^="Añadir "]')).find((x) => (x.textContent || '').trim() === '+' && !x.hasAttribute('data-mas-restaurante')); b?.click(); return Boolean(b) })()`)
  let marcada = null
  for (let i = 0; i < 24 && !marcada; i++) {
    await app.esp(150)
    marcada = await app.evaluar(`(() => { const e = document.querySelector('[data-parada-marcada="1"]'); if (!e) return null; const r = e.getBoundingClientRect(); return { id: e.getAttribute('data-stop-id'), dentro: r.top >= 0 && r.bottom <= window.innerHeight } })()`)
  }
  await app.esp(800)
  const tDespues = await total()
  const despues = await nombres()
  const nuevoId = despues.find((x) => !antes.includes(x))?.split('|')[0]
  debe(tDespues === tAntes + 1, 'entre_dos', `la parada entra en su sitio (${tAntes} → ${tDespues})`)
  debe(await app.evaluar(`!document.querySelector('[data-titulo-explorador]')`), 'entre_dos', 'EXPLORAR se cierra y se vuelve a DÍAS')
  debe(marcada && marcada.id === nuevoId, 'entre_dos', `la app marca la parada nueva (${JSON.stringify(marcada)} / ${nuevoId})`)
  const aviso = await app.evaluar(`(() => { const t = document.body.innerText; return { anadido: /Añadido al día|Añadido /.test(t), deshacer: Array.from(document.querySelectorAll('button')).some((b) => /^Deshacer$/.test((b.textContent || '').trim())) } })()`)
  debe(!aviso.anadido && !aviso.deshacer, 'entre_dos', `sin el aviso «Añadido…» ni [Deshacer] (${JSON.stringify(aviso)})`)
  await app.captura(jpg('anadir_entre_dos_marcada'))

  // ---------------------------------------------------------------------------------------------------------------------------------------------------
  console.log('3. Una entrada con hora no mueve la parada')
  const antesR = await ev(`const B = await import('/src/lib/bookings.ts'); const r = route(); const d = r.days.find((x) => !x.isReturnLeg && x.stops.filter((s) => !s.isArrival && !s.isNightExperience).length >= 3 && B.dateOfDay(r, x)); if (!d) return null; const s = d.stops.find((x) => !x.isArrival && !x.isNightExperience); return { dayId: d.id, dateIso: B.dateOfDay(r, d), stop: s.name, time: s.time, orden: d.stops.map((x) => x.name) }`)
  debe(Boolean(antesR), 'entrada', 'hay un día con paradas y fecha')
  if (antesR) {
    await ev(`st().addReservation({ id: 'res-10n10', kind: 'entrada', refId: ${JSON.stringify(antesR.stop)}, name: ${JSON.stringify(antesR.stop)}, placeNames: [${JSON.stringify(antesR.stop)}], dateIso: ${JSON.stringify(antesR.dateIso)}, dayNumber: null, time: '17:30' }); return 1`)
    await app.esp(2500)
    const despuesR = await ev(`const d = route().days.find((x) => x.id === ${JSON.stringify(antesR.dayId)}); const s = d.stops.find((x) => x.name === ${JSON.stringify(antesR.stop)}); return { orden: d.stops.map((x) => x.name), time: s?.time, reservedId: s?.reservedId }`)
    debe(JSON.stringify(despuesR.orden) === JSON.stringify(antesR.orden), 'entrada', `la parada se queda donde estaba (${antesR.orden.indexOf(antesR.stop)} → ${despuesR.orden.indexOf(antesR.stop)}; mismo día y mismo orden)`)
    debe(despuesR.reservedId === 'res-10n10' && despuesR.time === '17:30', 'entrada', `sigue diciendo la hora de su entrada (${despuesR.time}, reservedId ${despuesR.reservedId})`)
    await app.captura(jpg('entrada_no_mueve'))
  }

  // ---------------------------------------------------------------------------------------------------------------------------------------------------
  console.log("4. El Castillo de Sant'Angelo lleva foto de día, distinta de la del Puente, con fuente y licencia")
  const API = process.env.API_URL ?? 'http://localhost:8787'
  const pedir = async (name) => (await fetch(`${API}/api/place-photo`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, city: 'Roma' }) })).json()
  const castillo = await pedir("Castillo de Sant'Angelo")
  const puente = await pedir("Puente Sant'Angelo")
  debe(/dia_castillo/.test(castillo.photo_url ?? '') && castillo.photo_night !== true && !/noche/.test(castillo.photo_url ?? ''), 'castillo', `foto de día (${castillo.photo_url})`)
  debe(castillo.photo_url !== puente.photo_url, 'castillo', `distinta de la del Puente (${puente.photo_url})`)
  debe(Boolean(castillo.photo_credit?.autor && /CC|dominio/i.test(castillo.photo_credit?.licencia ?? '')), 'castillo', `con autor y licencia libre (${JSON.stringify(castillo.photo_credit)})`)
  const fotos = JSON.parse(leer('data/dias/roma/_fotos.json'))
  const f = fotos.fotos.find((x) => (x.lugares ?? []).includes("Castillo de Sant'Angelo"))
  debe(Boolean(f?.fuente && f?.credito?.licencia && f?.enlace), 'castillo', 'fuente y licencia apuntadas en _fotos.json')

  // ---------------------------------------------------------------------------------------------------------------------------------------------------
  console.log('5. Revisión del código')
  const pe = leer('src/components/route/placeExplorer/PlaceExplorerScreen.tsx')
  debe(!/>Free Tour<\/button>/.test(pe) && !/>Free Tour<\/button>/.test(leer('src/components/route/addStop/AddStopScreen.tsx')), 'free_tour', 'ya no hay botón «Free Tour» en el código de las dos pantallas')
  debe(/quickAddLabel="Elegir"/.test(leer('src/components/route/dayDetail/DayDetailPanel.tsx')), 'elegir', '«Comida — vie 30» sigue con «Elegir»')
} catch (e) {
  fallos.push({ regla: 'error', texto: String(e?.stack ?? e) })
  console.log('ERROR', e)
} finally {
  navegador?.app.cerrar()
}

console.log(`\n${comprobaciones} comprobaciones, ${fallos.length} fallos`)
for (const f of fallos) console.log(` - [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
