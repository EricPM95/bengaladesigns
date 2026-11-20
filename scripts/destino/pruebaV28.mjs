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
  // (20-nov, decisión de Eric) Sin página de Civitatis: la web OFICIAL de entradas del sitio (sin aid) o ningún botón; nunca el buscador ni una página que no es la de ese sitio.
  const OFICIAL = (u) => { try { const h = new URL(u); return h.protocol === 'https:' && !/(civitatis|getyourguide|viator|tiqets)/.test(h.hostname) } catch { return false } }
  debe(sinUrl.every((v) => v.sin_civitatis === true && (v.oficial == null || (OFICIAL(v.oficial) && !/aid=/.test(v.oficial)))), 'pendientes', `las ${sinUrl.length} sin página de Civitatis llevan sin_civitatis (nunca el buscador) y, si tienen web oficial, es de verdad oficial y sin aid`)
  const conOficial = sinUrl.filter((v) => v.oficial)
  debe(conOficial.length >= 4 && conOficial.every((v) => !/civitatis/.test(v.oficial)), 'oficial', `${conOficial.length} sitios con «Entradas en la web oficial» (${conOficial.map((v) => v.nombre).join(' · ')}); los demás, sin botón`)
  debe(['Coliseo, Foro y Palatino', 'Terraza panorámica con ascensor', 'Cripta de los Capuchinos'].every((n) => variantes.find((v) => v.nombre === n)?.url), 'decididas', 'Coliseo/Foro, Altar de la Patria y Cripta de los Capuchinos usan la candidata de Civitatis que incluye la entrada a ese sitio')
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
for (const destino of process.env.SIN_LANZAROTE ? ['Roma'] : ['Roma', 'Lanzarote']) {
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

/* ───────── 4. La colección por dentro: cada baldosa ENTERA, derecha y grande en su círculo (V28c) ───────── */
console.log('4. Las 18 insignias: cada círculo con SU baldosa, entera, derecha y grande (V28c)')
{
  const a = await abrirApp(APP, { ruta: '/?dibujos=1&baldosas=1', ancho: 900, alto: 1400, escala: 2, sinEsperarRoot: true, esperaFija: 10 })
  try {
    await a.esp(6000)
    const r = JSON.parse(await a.evaluar(`Promise.all([import('/src/components/logros/pantallas/destino/baldosa.tsx'), import('/src/components/logros/dibujos/partes.ts')]).then(([B, P]) => {
      const salida = { colecciones: 0, baldosas: 0, sinForma: [], enElCentro: [], fueraDelCirculo: [], pequenas: [], torcidas: [], sinIcono: [], circulos: document.querySelectorAll('[data-baldosa-circulo]').length, esperados: 0, conIcono: 0 }
      for (const [id, info] of Object.entries(P.COLECCIONES_POR_PARTES)) {
        const total = info.sitios.length
        salida.colecciones++
        salida.esperados += total * 2
        info.sitios.forEach((_, k) => {
          salida.baldosas++
          const g = B.geometriaDeBaldosa(id, total, k)
          if (!g || g.puntos.length < 3) { salida.sinForma.push(id + ':' + k); return }
          // ningún punto de la baldosa cae dentro de la medalla / el octógono del centro
          const [cx, cy] = [g.centro[0], g.centro[1]]
          const lado = g.familia === 'impr' || g.familia === 'joyas' ? 150 : 200
          const minimo = g.familia === 'partes' ? 29.9 : g.familia === 'impr' ? 29.9 : 0
          const cerca = Math.min(...g.puntos.map(([x, y]) => Math.hypot((x - cx) * lado, (y - cy) * lado)))
          if (cerca < minimo) salida.enElCentro.push(id + ':' + k + ':' + cerca.toFixed(1))
          const e = B.encajeDeBaldosa(g, 46)
          // todo el trozo dentro del círculo de 46 px
          const peor = Math.max(...g.girados.map(([x, y]) => Math.hypot(e.dx + x * e.lado - 23, e.dy + y * e.lado - 23)))
          if (peor > 23.05) salida.fueraDelCirculo.push(id + ':' + k + ':' + peor.toFixed(1))
          // ocupa al menos el 70 % del ancho del círculo
          if (e.ancho < 0.7 * 46 - 0.05 && !(g.familia === 'burbujas' || g.familia === 'una')) salida.pequenas.push(id + ':' + k + ':' + (e.ancho / 46).toFixed(2))
          // derecha: el lado de fuera arriba (el punto más lejano del centro de la insignia queda sobre él)
          if (g.familia === 'partes' || g.familia === 'impr') {
            const lejano = g.girados.reduce((m, p) => (Math.hypot(p[0] - cx, p[1] - cy) > Math.hypot(m[0] - cx, m[1] - cy) ? p : m))
            const medio = g.girados.reduce((s, p) => [s[0] + p[0] / g.girados.length, s[1] + p[1] / g.girados.length], [0, 0])
            if (!(medio[1] < cy - 0.05) || Math.abs(medio[0] - cx) > 0.06) salida.torcidas.push(id + ':' + k)
            void lejano
          }
        })
      }
      document.querySelectorAll('[data-baldosa-circulo]').forEach((c) => {
        const fam = c.querySelector('[data-baldosa]')?.getAttribute('data-baldosa')
        if (fam === 'impr' || fam === 'joyas') { if (c.querySelector('svg[data-baldosa-icono="1"] path[stroke-linecap]')) salida.conIcono++; else salida.sinIcono.push(c.getAttribute('data-baldosa-circulo')) }
      })
      return JSON.stringify(salida)
    })`))
    debe(r.colecciones === 18, 'insignias', `las 18 insignias (${r.colecciones})`)
    debe(r.sinForma.length === 0, 'insignias', `cada sitio tiene su baldosa (${r.baldosas}; sin forma: ${r.sinForma.join(', ') || 'ninguna'})`)
    debe(r.enElCentro.length === 0, 'insignias', `ningún punto de la baldosa cae dentro del centro (medalla u octógono de la estrella): ${r.enElCentro.join(', ') || 'ninguno'}`)
    debe(r.fueraDelCirculo.length === 0, 'insignias', `cada baldosa cabe ENTERA en su círculo de 46 px (se salen: ${r.fueraDelCirculo.join(', ') || 'ninguna'})`)
    debe(r.pequenas.length === 0, 'insignias', `cada baldosa ocupa al menos el 70 % del ancho del círculo (menos: ${r.pequenas.join(', ') || 'ninguna'})`)
    debe(r.torcidas.length === 0, 'insignias', `cada baldosa va derecha, con su lado de fuera arriba (torcidas: ${r.torcidas.join(', ') || 'ninguna'})`)
    debe(r.circulos === r.esperados && r.sinIcono.length === 0 && r.conIcono >= 24, 'insignias', `en la hoja de las 18, ${r.circulos} círculos (ganadas y sin ganar) y el icono de los Imprescindibles y las 4 joyas se ve en los ${r.conIcono} (sin icono: ${r.sinIcono.join(', ') || 'ninguno'})`)
    const botones = JSON.parse(await a.evaluar(`import('/src/lib/entradaEnlace.ts').then((m) => JSON.stringify({
      civ: m.enlaceDeCompraDeEntrada({ nombre: 'Panteón', url: 'https://www.civitatis.com/es/roma/entrada-panteon-agripa-audioguia/' }, 'Roma'),
      oficial: m.enlaceDeCompraDeEntrada({ nombre: 'Ara Pacis', url: null, sin_civitatis: true, oficial: 'https://www.arapacis.it/en/node/516' }, 'Roma'),
      ninguno: m.enlaceDeCompraDeEntrada({ nombre: 'Domus Aurea', url: null, sin_civitatis: true }, 'Roma'),
      textoOficial: m.textoDelBotonDeEntrada({ url: 'x', oficial: true }, 'Ver horas y reservar'), textoCiv: m.textoDelBotonDeEntrada({ url: 'x', oficial: false }, 'Ver horas y reservar'),
    }))`))
    debe(/civitatis\.com\/es\/roma\//.test(botones.civ?.url ?? '') && botones.civ.oficial === false, 'boton_entrada', 'con página de Civitatis: el botón lleva a esa página (con aid al abrirla)')
    debe(botones.oficial?.oficial === true && botones.textoOficial === 'Entradas en la web oficial' && botones.textoCiv === 'Ver horas y reservar', 'boton_entrada', 'sin Civitatis y con web oficial: «Entradas en la web oficial», a esa web y sin aid')
    debe(botones.ninguno === null, 'boton_entrada', 'sin Civitatis ni web oficial: ningún botón (nunca el buscador)')
    const codigo = leer('src/components/logros/pantallas/ColeccionPorDentro.tsx')
    debe(/BaldosaEnCirculo/.test(codigo) && !/encajeEnCirculo/.test(codigo), 'insignias', 'la colección por dentro dibuja la baldosa suelta (no el recorte con la medalla del centro)')
    await a.evaluar("document.querySelector('[data-baldosas-hoja]').scrollIntoView(); true")
    await a.esp(1200)
    await a.captura(`${CAP}/baldosas_18.jpg`)
  } finally {
    a.cerrar()
  }
}

console.log(`\nPrueba de la Tanda V28: ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
process.exit(fallos.length ? 1 : 0)
