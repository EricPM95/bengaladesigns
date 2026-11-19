// La prueba de la Tanda V28: la página del destino (5 hoteles de Lanzarote, sin etiquetas, fotos de los 12, actividades en carrusel con su foto pequeña), los enlaces exactos de las entradas y el trozo ENTERO en la colección por dentro.
//   node scripts/destino/pruebaV28.mjs                                      (datos y reglas, sin servidores; con Vite en 5173 y la API en 8787 SIN destinos ocultos: también la app)
// (Lanzarote está oculto en la API normal: para la parte de la app, la API con DESTINOS_OCULTOS= vacío.) Ninguna parte toca el Supabase de producción.
import fs from 'node:fs'
import { paginaDelDestino } from '../../server/paginaDestino.js'
import { stampCivitatis } from '../../shared/affiliate/civitatis.js'

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
const json = (f) => JSON.parse(leer(f))
const APP = process.env.APP_URL ?? 'http://localhost:5173'
const CAP = 'docs/dias/V28_capturas'
fs.mkdirSync(CAP, { recursive: true })

/* ───────── 1. Los hoteles ───────── */
console.log('1. Los hoteles: los 5 de Lanzarote, sin etiqueta, los 12 con foto')
{
  const raiz = process.cwd()
  const roma = paginaDelDestino({ raiz, destination: 'Roma', datosDestino: json('data/pipeline_v2/roma.json') })
  const lz = paginaDelDestino({ raiz, destination: 'Lanzarote', datosDestino: json('data/pipeline_v2/lanzarote.json') })
  debe(lz.hoteles.length === 5, 'lanzarote', `la página de Lanzarote enseña sus 5 hoteles (${lz.hoteles.map((h) => h.nombre).join(' · ')})`)
  debe(roma.hoteles.length === 7, 'roma', 'la de Roma, sus 7')
  for (const [d, p] of [['Roma', roma], ['Lanzarote', lz]]) {
    debe(p.hoteles.every((h) => !('etiqueta' in h) && h.zona && typeof h.nota === 'number' && h.opiniones > 0), 'etiqueta', `${d}: ningún hotel con etiqueta («Mejor nota de …» ni otra): foto, nombre, zona, nota y opiniones`)
    debe(p.hoteles.every((h) => h.foto && h.foto_pequena), 'fotos', `${d}: cada hotel con su foto y su foto pequeña`)
  }
  const modal = leer('src/components/route/DestinationDetailModal.tsx')
  const servidor = leer('server/paginaDestino.js')
  debe(!/Mejor nota de|\{h\.etiqueta\}/.test(modal) && !/Mejor nota de \$\{/.test(servidor.replace(/\/\*\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')), 'etiqueta', 'ni el código de la tarjeta ni el del servidor ponen ya ninguna etiqueta sobre la foto')
  let con = 0
  for (const destino of ['roma', 'lanzarote']) {
    const arch = json(`data/dias/${destino}/_hoteles.json`)
    for (const h of arch.hoteles) {
      const ok = h.foto && fs.existsSync(`public${h.foto}`) && h.foto_pequena && fs.existsSync(`public${h.foto_pequena}`) && fs.statSync(`public${h.foto}`).size > 8000
      if (ok) con++
      debe(ok && h.foto_origen && h.permiso === 'pendiente', 'fotos', `${h.nombre}: foto y foto pequeña en public/fotos/${destino}/hoteles/, de dónde sale y «permiso: pendiente»`)
    }
  }
  debe(con === 12, 'fotos', `los 12 hoteles con foto (${con})`)
  debe(fs.existsSync('docs/dias/V28_hoteles_web.md') && leer('docs/dias/V28_hoteles_web.md').split('\n').filter((l) => /^\|/.test(l)).length >= 14, 'web', 'la lista de los 12 con su web oficial y su correo está en docs/dias/V28_hoteles_web.md')
  // Las actividades: la foto PEQUEÑA de Civitatis (la -list de ~7 KB, no la de ~730 KB)
  const grandes = roma.actividades.filter((a) => !/-list\.jpg$/.test(a.foto ?? ''))
  debe(roma.actividades.length >= 5 && grandes.length === 0, 'fotos_actividades', `Roma: ${roma.actividades.length} actividades, todas con la foto pequeña (-list.jpg)`)
  debe(lz.actividades.length >= 5 && lz.actividades.every((a) => /\/[^/]*-m\.jpg$|\/galeria\//.test(a.foto ?? '')), 'fotos_actividades', `Lanzarote: ${lz.actividades.length} actividades, todas con la foto pequeña de Civitatis`)
  debe(!lz.actividades.some((a) => /free-tour-arrecife-m\.jpg/.test(a.foto ?? '')), 'free_tour', 'el Free tour por Arrecife ya no lleva la foto parecida a la iglesia de Teguise (lleva la del Charco de San Ginés, de la propia ficha de Civitatis)')
}

/* ───────── 2. Los enlaces de las entradas, excursiones y free tours ───────── */
console.log('2. Los enlaces: cada uno a su página de Civitatis, con nuestro aid')
{
  const ent = json('data/dias/roma/_entradas.json').lugares
  const enl = json('data/dias/roma/_enlaces_civitatis.json')
  const variantes = Object.entries(ent).flatMap(([lugar, vs]) => vs.map((v) => ({ lugar, ...v })))
  const conUrl = variantes.filter((v) => v.url)
  debe(variantes.length >= 22 && conUrl.length >= 9, 'entradas', `de ${variantes.length} entradas de Roma, ${conUrl.length} abren su página propia (antes solo el Free Tour)`)
  const URL_ACTIVIDAD = /^https:\/\/www\.civitatis\.com\/es\/[a-z-]+\/[a-z0-9-]+\/(\?|$)/
  debe(conUrl.every((v) => URL_ACTIVIDAD.test(v.url) && !/buscar|search/.test(v.url)), 'entradas', 'cada enlace es una página de actividad (…/es/roma/<actividad>/), nunca el buscador')
  debe(conUrl.every((v) => /[?&]aid=5206(&|$)/.test(stampCivitatis(v.url, { campaignParam: 'cmp', campaignCode: 'app-8F3K2' })) && /cmp=app-8F3K2/.test(stampCivitatis(v.url, { campaignParam: 'cmp', campaignCode: 'app-8F3K2' }))), 'aid', 'y al abrirlo lleva nuestro aid=5206 y la campaña del viaje')
  const sinUrl = variantes.filter((v) => !v.url)
  const dudosas = new Set(enl.entradas.filter((e) => e.confianza !== 'alta').map((e) => e.variante))
  debe(sinUrl.every((v) => dudosas.has(v.nombre)), 'pendientes', `las ${sinUrl.length} sin página propia son SOLO las que no se encontraron con seguridad (están en «PARA ERIC» con sus candidatas): ${sinUrl.map((v) => v.nombre).join(' · ')}`)
  debe(enl.entradas.filter((e) => e.confianza !== 'alta').every((e) => (e.candidatas ?? []).length >= 1 || e.comentario), 'pendientes', 'cada dudosa lleva sus candidatas o el motivo')
  // Excursiones y free tours
  const lzc = json('data/dias/lanzarote/_civitatis.json')
  const lista = [...lzc.excursiones, ...(lzc.free_tours ?? [])]
  debe(lista.length >= 20 && lista.every((e) => URL_ACTIVIDAD.test(e.url ?? '')), 'excursiones', `Lanzarote: ${lista.length} excursiones y free tours, cada una con su página (${lista.filter((e) => !URL_ACTIVIDAD.test(e.url ?? '')).length} sin)`)
  const opc = json('data/pipeline_v2/roma.json').excursions.options
  debe(opc.every((o) => o.civitatis_slug), 'excursiones', `Roma: las ${opc.length} excursiones traen su página (slug de Civitatis)`)
  debe(enl.excursiones_roma.every((e) => e.ok) && enl.lanzarote.every((e) => e.ok), 'excursiones', 'comprobadas una a una el 19-nov: todas llegan a su página')
  // Abrir de verdad los enlaces de Roma (red; si no hay, se salta)
  let abiertos = 0
  let malos = []
  const sondear = async (url) => {
    const r = await fetch(stampCivitatis(url, { campaignParam: 'cmp', campaignCode: null }), { redirect: 'follow', signal: AbortSignal.timeout(20000), headers: { 'user-agent': 'Mozilla/5.0' } })
    const html = await r.text()
    return { ok: r.ok, final: r.url, esActividad: !/\/buscar/.test(r.url) && /og:title|<h1/.test(html) }
  }
  try {
    for (const v of conUrl) {
      const r = await sondear(v.url)
      abiertos++
      if (!r.ok || !r.esActividad) malos.push(`${v.nombre}: ${r.final}`)
    }
    debe(malos.length === 0, 'abrir', `abiertos ${abiertos} enlaces de Roma: cada uno llega a una página de actividad, no al buscador${malos.length ? ' · MAL: ' + malos.join(' | ') : ''}`)
  } catch (e) {
    console.log(`  (sin red para abrir los enlaces: ${String(e.message).slice(0, 60)}; esa comprobación se salta)`)
  }
}

if (!(await fetch(APP).then((r) => r.ok).catch(() => false))) {
  console.log('(sin Vite en 5173: la parte de la app se salta)')
  console.log(`\nPrueba de la Tanda V28: ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
  process.exit(fallos.length ? 1 : 0)
}

/* ───────── 3. En la app ───────── */
const { abrirApp } = await import('./_enLaApp.mjs')
const prepara = async (a, destino) => {
  for (let i = 0; i < 120 && !(await a.evaluar("Boolean(document.querySelector('[data-primera-pantalla]'))").catch(() => false)); i++) await a.esp(500)
  for (let i = 0; i < 60 && !(await a.evaluar("typeof window.__rutaPrueba === 'function'").catch(() => false)); i++) await a.esp(500)
  await a.evaluar(destino === 'Lanzarote' ? 'window.__rutaLanzarote({ hoy: "2026-12-01" }).then(() => true)' : 'window.__rutaPrueba().then(() => true)')
  for (let i = 0; i < 90 && !(await a.evaluar("import('/src/store/useRouteStore.ts').then((m) => Boolean(m.useRouteStore.getState().route))")); i++) await a.esp(1000)
  await a.esp(4000)
  for (let i = 0; i < 4; i++) {
    const h = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Entendido|Vale|Cerrar)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
    if (!h) break
    await a.esp(600)
  }
  await a.evaluar("import('/src/store/useRouteStore.ts').then((m) => { m.useRouteStore.setState({ dev_simulated_today_iso: '2026-12-01' }); m.useRouteStore.getState().setMode('route'); return true })")
  await a.esp(2000)
}
const abrirPagina = async (a) => {
  await a.evaluar("(() => { const b = document.querySelector('[data-duracion-del-viaje]')?.closest('button'); if (b) b.click(); return !!b })()")
  const t0 = Date.now()
  for (let i = 0; i < 40 && !(await a.evaluar("Boolean(document.querySelector('[data-hotel]'))")); i++) await a.esp(250)
  return t0
}
const cerrarPagina = async (a) => {
  await a.evaluar("(() => { const b = document.querySelector('[data-pagina-destino] button[aria-label=Cerrar]'); if (b) b.click(); return !!b })()")
  await a.esp(700)
}
const medidas = `(() => {
  const c = document.querySelector('[data-carrusel-actividades]')
  const t = Array.from(document.querySelectorAll('[data-actividad]'))
  const h = Array.from(document.querySelectorAll('[data-hotel]'))
  const imgs = Array.from(document.querySelectorAll('[data-actividad] img, [data-hotel] img'))
  return {
    carrusel: Boolean(c) && getComputedStyle(c).flexDirection === 'row' && c.scrollWidth > c.clientWidth + 10 && t.length >= 2 && Math.abs(t[0].getBoundingClientRect().top - t[1].getBoundingClientRect().top) < 4,
    acts: t.length, hoteles: h.length,
    hotelesTexto: h.map((e) => e.innerText.replace(/\\s+/g, ' ')),
    conImg: imgs.filter((i) => i.getAttribute('src')).length, total: imgs.length,
    huecosVacios: h.filter((e) => !e.querySelector('img')).length,
    tuAloj: document.querySelector('[data-foto-tu-alojamiento]')?.getAttribute('data-foto-tu-alojamiento') ?? null,
    etiquetas: /Mejor nota/.test(document.body.innerText),
    tamPeque: Array.from(document.querySelectorAll('[data-actividad] img')).map((i) => i.currentSrc || i.src),
  }
})()`
for (const destino of ['Roma', 'Lanzarote']) {
  console.log(`3. En la app (iPhone 390 px): la página de ${destino}`)
  const a = await abrirApp(APP, { ruta: '/?cuentas=off&logros=off&apertura=0&version=completa', ancho: 390, alto: 844 })
  try {
    await prepara(a, destino)
    const abre = await abrirPagina(a)
    await a.esp(2500)
    const m = await a.evaluar(medidas)
    debe(m.hoteles === (destino === 'Roma' ? 7 : 5), 'pagina', `la página de ${destino} enseña ${m.hoteles} hoteles (${destino === 'Roma' ? 7 : 5} esperados)`)
    debe(m.carrusel, 'carrusel', `${destino}: las actividades en CARRUSEL (de lado, una al lado de otra: ${m.acts} tarjetas)`)
    debe(!m.etiquetas && m.hotelesTexto.every((t) => /[0-9],[0-9]/.test(t) && /opiniones/.test(t)), 'etiqueta', `${destino}: ningún hotel con etiqueta; cada uno con zona, nota y opiniones`)
    debe(m.huecosVacios === 0 && m.conImg === m.total && m.total >= m.acts + m.hoteles, 'fotos', `${destino}: todas las tarjetas con su foto (${m.conImg} de ${m.total}), ninguna con el degradado vacío`)
    await a.captura(`${CAP}/pagina_${destino.toLowerCase()}_arriba.jpg`)
    await a.evaluar("document.querySelector('[data-donde-dormir]').scrollIntoView(); true")
    await a.esp(900)
    await a.captura(`${CAP}/pagina_${destino.toLowerCase()}_hoteles.jpg`)
    // Tu alojamiento: foto de nuestro hotel, o la cama grande
    await a.evaluar("import('/src/store/useRouteStore.ts').then((m) => { const s = m.useRouteStore.getState(); const dia = s.route.days[0]; m.useRouteStore.setState({ accommodationSelections: { ...s.accommodationSelections, [dia.id]: { name: 'The colors house', precio: null } } }); return true })")
    await a.esp(1500)
    const aloj = await a.evaluar("document.querySelector('[data-foto-tu-alojamiento]')?.getAttribute('data-foto-tu-alojamiento') ?? null")
    debe(aloj === 'cama', 'alojamiento', `${destino}: «Tu alojamiento · The colors house» sale con el icono de la cama en grande (no un cuadrado de color vacío): ${aloj}`)
    await a.captura(`${CAP}/pagina_${destino.toLowerCase()}_tu_alojamiento.jpg`)
    // Más rápido la segunda vez (red lenta)
    await cerrarPagina(a)
    await a.cdp('Network.emulateNetworkConditions', { offline: false, latency: 300, downloadThroughput: 80 * 1024, uploadThroughput: 80 * 1024 })
    const t1 = Date.now()
    await abrirPagina(a)
    for (let i = 0; i < 80 && !(await a.evaluar("Array.from(document.querySelectorAll('[data-actividad] img')).slice(0, 3).every((i) => i.complete && i.naturalWidth > 0)")); i++) await a.esp(100)
    const segunda = Date.now() - t1
    console.log(`   segunda vez, red lenta (80 KB/s, 300 ms): las 3 primeras fotos listas en ${segunda} ms`)
    debe(segunda < 1000, 'rapida', `${destino}: la segunda vez, con red lenta, las primeras fotos están en menos de 1 segundo (${segunda} ms)`)
    await a.cdp('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 })
  } finally {
    a.cerrar()
  }
}

/* ───────── 4. La colección por dentro: cada trozo, ENTERO en su círculo ───────── */
console.log('4. Las 18 insignias: cada círculo con SU trozo entero')
{
  const a = await abrirApp(APP, { ruta: '/?cuentas=off&logros=on&logrosDemo=1&apertura=0', ancho: 390, alto: 844 })
  try {
    for (let i = 0; i < 120 && !(await a.evaluar("Boolean(document.querySelector('[data-primera-pantalla]'))").catch(() => false)); i++) await a.esp(500)
    const r = JSON.parse(await a.evaluar(`Promise.all([import('/src/components/logros/pantallas/destino/trozo.ts'), import('/src/components/logros/dibujos/partes.ts')]).then(([T, P]) => {
      const dentro = (p, poli) => { let c = false; for (let i = 0, j = poli.length - 1; i < poli.length; j = i++) { const [xi, yi] = poli[i], [xj, yj] = poli[j]; if ((yi > p[1]) !== (yj > p[1]) && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) c = !c } return c }
      const salida = { colecciones: 0, trozos: 0, fueraDelCirculo: [], restos: [], sinForma: [] }
      for (const [id, info] of Object.entries(P.COLECCIONES_POR_PARTES)) {
        const total = info.sitios.length
        salida.colecciones++
        const polis = info.sitios.map((_, k) => T.trozoEntero(id, total, k))
        polis.forEach((t, k) => {
          salida.trozos++
          if (!t || t.puntos.length < 3) { salida.sinForma.push(id + ':' + k); return }
          const e = T.encajeEnCirculo(t, 46)
          // todos los puntos del trozo, ya escalados y puestos, dentro del círculo de 46 px
          const peor = Math.max(...t.puntos.map(([x, y]) => Math.hypot(e.left + x * e.lado - 23, e.top + y * e.lado - 23)))
          if (peor > 23.01) salida.fueraDelCirculo.push(id + ':' + k + ':' + peor.toFixed(1))
          // ningún punto del trozo cae dentro de otro trozo de la misma insignia
          const muestra = []
          for (let i = 0; i <= 12; i++) for (let j = 0; j <= 12; j++) { const p = [t.caja.x0 + ((t.caja.x1 - t.caja.x0) * i) / 12, t.caja.y0 + ((t.caja.y1 - t.caja.y0) * j) / 12]; if (dentro(p, t.puntos)) muestra.push(p) }
          polis.forEach((o, j) => { if (j !== k && o && muestra.some((p) => dentro(p, o.puntos))) salida.restos.push(id + ':' + k + ' pisa a ' + j) })
        })
      }
      return JSON.stringify(salida)
    })`))
    debe(r.colecciones === 18, 'insignias', `las 18 insignias (${r.colecciones})`)
    debe(r.sinForma.length === 0, 'insignias', `cada sitio tiene su trozo con forma propia (${r.trozos} trozos; sin forma: ${r.sinForma.join(', ') || 'ninguno'})`)
    debe(r.fueraDelCirculo.length === 0, 'insignias', `cada trozo cabe ENTERO en su círculo de 46 px, centrado y a escala (se salen: ${r.fueraDelCirculo.join(', ') || 'ninguno'})`)
    debe(r.restos.length === 0, 'insignias', `ningún trozo lleva restos de los de al lado (${r.restos.join(', ') || 'ninguno'})`)
    const codigo = leer('src/components/logros/pantallas/ColeccionPorDentro.tsx')
    debe(/encajeEnCirculo/.test(codigo) && !/recorteDeTrozo\(trozo,/.test(codigo), 'insignias', 'la colección por dentro usa el trozo exacto, no el recorte con el casco convexo')
  } finally {
    a.cerrar()
  }
}

console.log(`\nPrueba de la Tanda V28: ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
process.exit(fallos.length ? 1 : 0)
