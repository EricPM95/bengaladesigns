// Capturas 390x844 de la LZ2b1 (agente B): la ficha de Teguise, «Cerca de ti», EXPLORAR, el coche en RESERVAS (los dos modos) y la hoja de llegada con un vuelo. Un Chrome por la cola; la API con DESTINOS_OCULTOS='-'.
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/_lz2b1_B_capturas.mjs
import fs from 'node:fs'
import path from 'node:path'
const { abrirApp } = await import('./_enLaApp.mjs')
const APP = process.env.APP_URL ?? 'http://localhost:5173'
const SALIDA = path.resolve('docs/dias/capturas_jutrip')
const a = await abrirApp(APP, { ruta: '/?cuentas=off&logros=off&apertura=0&version=completa', ancho: 390, alto: 844 })
const informe = {}
try {
  const ev = (js) => a.evaluar(js)
  const R = (js) => ev(`(async () => { const R = await import('/src/store/useRouteStore.ts'); const st = () => R.useRouteStore.getState(); const route = () => st().route; ${js} })()`)
  for (let i = 0; i < 360 && !(await ev("typeof window.__rutaLanzarote === 'function'").catch(() => false)); i++) await a.esp(500)
  await ev("window.__rutaLanzarote({ zona: 'costa_teguise', coche: 'alquiler' }).then(() => true)")
  await a.esp(3000)
  for (let i = 0; i < 6; i++) {
    const h = await ev("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale|Cerrar)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
    if (!h) break
    await a.esp(600)
  }
  const cap = async (nombre) => a.captura(path.join(SALIDA, `lz2b1_${nombre}.jpg`))

  // 1. La ficha de Teguise
  const teguise = await R("const r = route(); for (const d of r.days) { const s = d.stops.find((p) => /Teguise/.test(p.name)); if (s) return { dia: d.id, id: s.id, nombre: s.name } } return null")
  informe.teguise = teguise
  if (teguise) {
    await R(`st().setMode('days'); st().setActiveDayId(${JSON.stringify(teguise.dia)}); return true`)
    await a.esp(2500)
    await ev(`(() => { const e = document.querySelector('[data-stop-id="${teguise.id}"]'); e?.scrollIntoView({ block: 'center' }); const b = e?.querySelector('button, [role=button], a'); (b ?? e)?.click(); return true })()`)
    await a.esp(3500)
    informe.fichaTexto = await ev("(document.querySelector('[data-ficha-seccion=\"donde-aparcar\"]')?.innerText ?? 'SIN DONDE APARCAR') + ' || comoLlegar=' + Boolean(document.querySelector('[data-ficha-seccion=\"como-llegar\"]'))")
    await ev("document.querySelector('[data-ficha-seccion=\"donde-aparcar\"]')?.scrollIntoView({ block: 'center' }); true")
    await a.esp(800)
    await cap('ficha_teguise_1')
    await ev("(() => { const b = document.querySelector('[role=dialog] button[aria-label=Cerrar], button[aria-label=Cerrar]'); b?.click(); return true })()")
    await a.esp(800)
  }

  // 2. EXPLORAR
  await R("st().setMode('explore'); return true")
  await a.esp(2500)
  informe.explorar = await ev("document.querySelector('[data-explorar-categorias]')?.innerText ?? 'SIN CATEGORIAS'")
  await cap('explorar_1')
  await ev("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^Volcanes/.test((x.textContent || '').trim())); b?.click(); return true })()")
  await a.esp(2500)
  await cap('explorar_volcanes_1')
  await ev("(() => { const b = document.querySelector('button[aria-label=Cerrar], button[aria-label=Atrás], button[aria-label=Volver]'); b?.click(); return true })()")
  await a.esp(800)

  // 3. RESERVAS: el coche, los dos modos
  await R("st().setMode('bookings'); return true")
  await a.esp(2500)
  await ev("document.querySelector('[data-bloque-coche]')?.scrollIntoView({ block: 'center' }); true")
  await a.esp(800)
  informe.cocheAlquiler = await ev("document.querySelector('[data-bloque-coche]')?.innerText ?? 'SIN BLOQUE'")
  await cap('coche_reservas_alquiler_1')
  await ev("document.querySelector('[data-coche-opcion=\"propio\"]')?.click(); true")
  await a.esp(3500)
  await ev("document.querySelector('[data-bloque-coche]')?.scrollIntoView({ block: 'center' }); true")
  await a.esp(600)
  informe.cochePropio = await ev("document.querySelector('[data-bloque-coche]')?.innerText ?? 'SIN BLOQUE'")
  await cap('coche_reservas_propio_1')
  await ev("document.querySelector('[data-coche-opcion=\"alquiler\"]')?.click(); true")
  await a.esp(1500)

  // 4. «Cerca de ti»: se abre la lista de gasolineras (la tarjeta de HOY lleva el botón; aquí se pide la hoja directamente desde HOY con día simulado)
  await R("st().setMode('today'); return true")
  await a.esp(3500)
  informe.hoy = await ev("(document.querySelector('[data-cerca-coche]') ? 'lista abierta' : Array.from(document.querySelectorAll('span')).some((x) => /^Cerca de ti$/.test((x.textContent || '').trim())) ? 'Cerca de ti presente' : 'sin Cerca de ti')")
  await ev("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /Gasolineras/.test((x.textContent || '').trim())); b?.scrollIntoView({ block: 'center' }); b?.click(); return Boolean(b) })()")
  await a.esp(2500)
  await cap('cerca_de_ti_1')
  await ev("(() => { document.querySelector('[data-cerca-coche] button[aria-label=Cerrar]')?.click(); return true })()")
  await a.esp(500)

  // 5. La hoja de llegada con un vuelo puesto (ACE)
  await R("st().guardarVueloDelAdmin({ arrival: { time: '14:30' }, departure: { time: '18:10' }, medio: 'vuelo' }); const r = route(); st().setMode('days'); st().setActiveDayId(r.days[0].id); return true")
  await a.esp(3500)
  informe.llegadaBarra = await ev("(() => { const e = Array.from(document.querySelectorAll('button, [role=button]')).filter((x) => /aeropuerto|Llegada|llegas|ACE|vuelo/i.test(x.textContent || '')).map((x) => (x.textContent || '').trim().slice(0, 90)); return e.slice(0, 8) })()")
  await ev("(() => { const e = Array.from(document.querySelectorAll('button, [role=button]')).find((x) => /aeropuerto|Llegada|llegas|ACE|vuelo/i.test(x.textContent || '')); e?.click(); return Boolean(e) })()")
  await a.esp(3000)
  informe.llegadaHoja = await ev("(document.querySelector('[role=dialog]')?.innerText ?? document.body.innerText).slice(0, 3000)")
  await cap('llegada_vuelo_1')
  const tx1 = await ev('document.body.innerText')
  await ev("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^Tips$/.test((x.textContent || '').trim())); b?.click(); return Boolean(b) })()")
  await a.esp(1200)
  const tx2 = await ev('document.body.innerText')
  informe.llegadaRoma = ((tx1 || '') + ' ' + (tx2 || '')).match(/Roma|Termini|Fiumicino|Ciampino|Vaticano|Pompeya|Florencia|metro|ZTL/gi) ?? []
  informe.llegadaResumen = (tx1 || '').slice(tx1.indexOf('Llegada a Lanzarote'), tx1.indexOf('Llegada a Lanzarote') + 2500)
  informe.llegadaTips = (tx2 || '').slice(tx2.indexOf('Llegada a Lanzarote'), tx2.indexOf('Llegada a Lanzarote') + 2500)
  await cap('llegada_vuelo_tips_1')
  fs.writeFileSync(path.resolve('docs/dias/_lz2b1_B_capturas_informe.json'), JSON.stringify(informe, null, 1))
} finally {
  await a.cerrar()
}
console.log(JSON.stringify(informe, null, 1))
