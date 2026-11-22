// La prueba de la Tanda V38E (22-nov): EL ESTUDIO CON LA ANIMACIÓN ENTERA EN LA LÍNEA DE TIEMPO (solo el estudio de sonidos; la app no cambia).
//   1. Cada tarjeta dura lo que dura la animación ENTERA que se ve (de principio a [Seguir]); sus números salen de los de la propia animación (se comparan con el código de las pantallas).
//   2. La línea de tiempo enseña esa duración, con regla de segundos, marcas con rótulo y zoom; las barras de ms de todos los sonidos llegan de −duración a +duración.
//   3. Un sonido puesto a los 18 s se programa a los 18 s (los de Code y los de Eric); el campo de segundos y el arrastre dan el mismo resultado.
//   4. [▶ desde aquí] empieza en el punto elegido, con los sonidos que caen después.
//   5. Lo guardado antes sigue en su sitio; el zip y su lector hablan en segundos de la animación entera.
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/pruebaV38E.mjs
// Ninguna parte toca el Supabase de producción ni lo guardado de nadie (el navegador de pruebas es de usar y tirar).
import fs from 'node:fs'
import { build } from 'esbuild'
import { abrirApp } from './_enLaApp.mjs'

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
const sinComentarios = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s\/\/ .*$/gm, '')
const APP = process.env.APP_URL ?? 'http://localhost:5173'
const cargar = async (entrada) => {
  const b = await build({ entryPoints: [entrada], bundle: true, format: 'esm', platform: 'node', write: false, define: { 'import.meta.env': '{}' } })
  return import('data:text/javascript;base64,' + Buffer.from(b.outputFiles[0].text).toString('base64'))
}
const J = async (a, js) => {
  const r = await a.evaluar(js)
  return typeof r === 'string' ? JSON.parse(r) : r
}
const esperar = async (a, js, n = 80) => {
  for (let i = 0; i < n; i++) {
    if (await a.evaluar(js).catch(() => false)) return true
    await a.esp(250)
  }
  return false
}
const ratonEn = async (a, x, y, tipo, extra = {}) => a.cdp('Input.dispatchMouseEvent', { type: tipo, x, y, button: 'left', clickCount: 1, ...extra })
const centroDe = async (a, sel) => JSON.parse(await a.evaluar(`(() => { const e = document.querySelector('${sel}'); e.scrollIntoView({ block: 'center' }); const b = e.getBoundingClientRect(); return JSON.stringify({ x: b.left + b.width / 2, y: b.top + b.height / 2, w: b.width, l: b.left, t: b.top, h: b.height }) })()`))
const toque = async (a, sel) => {
  const r = await centroDe(a, sel)
  for (const tipo of ['mouseMoved', 'mousePressed', 'mouseReleased']) await ratonEn(a, r.x, r.y, tipo)
}
const coma = (v, d = 1) => Number(v.toFixed(d)).toString().replace('.', ',')

/* ───────── 1. La duración de cada tarjeta, de la animación entera ───────── */
console.log('1. La duración de cada tarjeta es la de la animación ENTERA')
const E = await cargar('src/lib/sonidos/estudio.ts')
const T = await cargar('src/lib/sonidos/tiempos.ts')
const manifiesto = JSON.parse(leer('public/sonidos/v30/manifiesto.json'))
const A = E.ANIMACIONES
const lin = (id) => E.lineaDeTiempo(E.animacionDe(id))
{
  debe(A.length === 27, 'tarjetas', `se revisan las 27 tarjetas (${A.length})`)
  for (const a of A) {
    const l = E.lineaDeTiempo(a)
    debe(l.dura > 0 && l.tramos.length > 0 && l.marcas.every((m) => m.t >= 0 && m.t <= l.dura + 0.01), 'tarjetas', `${a.id}: dura ${l.dura.toFixed(2)} s, con sus partes y sus marcas dentro de la duración`)
    debe(E.duracionDe(a) === l.dura, 'tarjetas', `${a.id}: «dura X s» es la de la línea de tiempo`)
    if (l.seguir !== null) debe(l.dura >= l.seguir - 1e-9, 'tarjetas', `${a.id}: la duración llega hasta [Seguir] (${l.seguir.toFixed(2)} s)`)
  }
  // El Coliseo y los emblemas: la animación entera, no la partitura del suspense.
  const col = lin('emblema_maravilla')
  debe(col.dura > 20 && Math.abs(col.dura - 25.6) < 1e-9, 'coliseo', `el Coliseo dura ${col.dura} s (más de 20; antes decía 4,2)`)
  debe(['estalla el destello', 'los textos', '[Seguir]', '«Casi 2.000 años esperándote…»', 'se dibuja el Coliseo'].every((r) => col.marcas.some((m) => m.rotulo === r)), 'coliseo', 'con sus momentos propios marcados')
  const roma = lin('emblema')
  const e = T.tiemposDeEscena()
  debe(Math.abs(roma.dura - (T.TIEMPOS_DE_EMBLEMA.estalla + e.x[3])) < 1e-9 && roma.tramos.find((x) => x.partitura === 'escena').empieza === T.TIEMPOS_DE_EMBLEMA.estalla, 'emblema', `el emblema de Roma dura ${roma.dura.toFixed(1)} s: el suspense (${T.TIEMPOS_DE_EMBLEMA.estalla} s) y su escena entera; la escena empieza a los ${T.TIEMPOS_DE_EMBLEMA.estalla} s`)
  for (const r of ['latidos', 'estalla la luz · empieza la escena', 'estalla la luz del emblema', 'aparece el emblema', 'el nombre', '[Seguir]']) debe(roma.marcas.some((m) => m.rotulo === r), 'emblema', `marca «${r}» en el emblema de Roma`)
  const lz = lin('emblema_lanzarote')
  debe(Math.abs(lz.dura - 13.4) < 1e-9 && lz.marcas.some((m) => m.rotulo === 'aparece el emblema' && m.t === 10.7), 'emblema', `el emblema de Lanzarote dura ${lz.dura} s, con su escena entera`)
  const m7 = lin('maravilla')
  debe(m7.dura >= 10 && m7.marcas.some((m) => m.rotulo === 'la medalla para' && Math.abs(m.t - T.paraFinalSiete()) < 1e-9), 'maravilla', `el final de las 7 maravillas dura ${m7.dura} s, entero, con la medalla que para a los ${T.paraFinalSiete()} s`)
  debe(!lin('pedazo_tres').dura || lin('pedazo_tres').dura > lin('pedazo').dura, 'pedazos', 'tres pedazos duran más que uno')
}
// Los números de la animación (los de su pantalla) son los de la tarjeta.
{
  const pant = sinComentarios(leer('src/components/logros/momentos/pantallas.tsx'))
  debe(/ctaEn="4\.2s"/.test(pant) && lin('coleccion').seguir === 4.2, 'cta', 'colección: [Seguir] a los 4,2 s, como su pantalla')
  debe(/ctaEn="3s"/.test(pant) && lin('pais').seguir === 3, 'cta', 'país: 3 s, como su pantalla')
  debe(/ctaEn="2\.6s"/.test(pant) && lin('patrimonio').seguir === 2.6 && lin('viajero').seguir === 2.6, 'cta', 'patrimonio y viajero: 2,6 s')
  debe(/const t = antes \? 3\.5 : 1\.5/.test(pant) && /ctaEn=\{`\$\{t \+ 0\.9\}s`\}/.test(pant) && lin('medalla_bronce').seguir === 2.4 && lin('medalla_oro').seguir === 4.4, 'cta', 'medallas: 2,4 s la primera y 4,4 s las que suben de grado')
  debe(/ctaEn="9s"/.test(pant) && lin('maravilla').seguir === 9, 'cta', 'final de las 7 maravillas: [Seguir] a los 9 s')
  const cine = sinComentarios(leer('src/components/logros/momentos/escenas/cineLanza.tsx'))
  debe(/x: \[10\.7 - t0, 11\.6 - t0, 12\.5 - t0, 13\.4 - t0\]/.test(cine), 'cta', 'Lanzarote: la escena enseña [Seguir] a los 13,4 s')
  const col = sinComentarios(leer('src/components/logros/momentos/escenas/coliseo.tsx'))
  debe(/const tEmb = 23\.6/.test(col) && /const tBoton = 25\.6/.test(col) && /x: \[24 - off, 24\.3 - off, 24\.6 - off, 25\.6 - off\]/.test(col), 'cta', 'Coliseo: destello a los 23,6 s, textos a los 24 s y [Seguir] a los 25,6 s')
  const emb = sinComentarios(leer('src/components/logros/momentos/EscenaDeEmblema.tsx'))
  debe(/setTimeout\(alTerminar, TIEMPOS_DE_EMBLEMA\.estalla \* 1000\)/.test(emb), 'cta', 'el suspense de Roma acaba a los 3,6 s y entonces entra la escena')
}

/* ───────── 2. El zip y su lector, en segundos de la animación entera ───────── */
console.log('2. El zip y su lector: segundos de la animación entera')
{
  const AP = await import('../sonidos/aplicarEstudio.mjs')
  const json = {
    version: 1,
    generado: '2026-11-22T10:00:00.000Z',
    volumen_general: 0.8,
    animaciones: {
      emblema_maravilla: {
        nombre: 'Coliseo',
        duracion: 25.6,
        golpe: 3.6,
        tramos: [{ partitura: 'emblema', empieza: 0 }, { partitura: 'escena', empieza: 0 }],
        sonidos_de_code: [{ clave: 'archivo:redoble', tipo: 'archivo', sonido: 'redoble', version: 'A', silenciado: false, volumen: 1, ms: 18000, empieza: 'principio' }],
        capas: [],
      },
    },
  }
  const { animaciones } = AP.leerAnimacionesYManifiesto()
  const errores = AP.validarEstudio(json, { animaciones, manifiesto, archivos: new Map() })
  debe(errores.length === 0, 'zip', `el lector da por buenos los 18 s en una animación de 25,6 s y sus partes (${errores.join(' | ') || 'sin errores'})`)
  const texto = AP.describir(json).join('\n')
  debe(/empieza en el segundo 18,00 de la animacion/.test(texto) && /dura 25\.6 s · golpe a los 3\.6 s/.test(texto) && /«escena» empieza en el segundo 0,00/.test(texto), 'zip', 'el lector dice «empieza en el segundo 18,00 de la animación» y las partes de la animación')
  debe(AP.segundoExacto(18000, 'principio', 3.6) === 18 && Math.abs(AP.segundoExacto(500, 'golpe', 3.6) - 4.1) < 1e-9 && AP.segundoExacto(0, 'sitio', 3.6) === null, 'zip', 'el segundo exacto: desde el principio = ms; desde el golpe = golpe + ms')
  const roma = lin('emblema')
  debe(roma.tramos.find((x) => x.partitura === 'escena').empieza === 3.6, 'zip', 'la escena de Roma empieza a los 3,6 s: lo que se cuenta «desde el principio» cae en el segundo de la animación entera, no de la escena')
}

/* ───────── 3. El estudio de verdad ───────── */
if (!(await fetch(APP).then((r) => r.ok).catch(() => false))) {
  console.log('3. (SIN VITE: la parte del estudio NO SE HA VERIFICADO)')
  console.log(`\nPrueba de la Tanda V38E: ${comprobaciones} comprobaciones · ${fallos.length} fallos · ESTUDIO SIN VERIFICAR`)
  process.exit(fallos.length ? 1 : 0)
}
console.log('3. En el estudio (1280 x 1000)')
const RUTA = '/?cuentas=off&logros=on&logrosDemo=1&admin=sonidos&apertura=0'
const MOCK = "const f = window.fetch.bind(window); window.fetch = (u, i) => String(u).includes('/api/admin/avisos-viajeros') ? Promise.resolve(new Response(JSON.stringify({ ok: true, nuevos: 0, avisos: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } })) : f(u, i);"
const IFR = "document.querySelector('[data-visor-iframe]')"
const CAPTURAS = 'docs/dias/V38E_capturas'
fs.mkdirSync(CAPTURAS, { recursive: true })
const a = await abrirApp(APP, { ruta: RUTA, ancho: 1280, alto: 1000, sinEsperarRoot: true, esperaFija: 5, antes: MOCK })
const informe = {}
try {
  debe(await esperar(a, "document.querySelectorAll('[data-animacion-tarjeta]').length >= 20"), 'pagina', 'la página sale con su lista')
  debe(await esperar(a, `Boolean(${IFR}?.contentWindow?.__estudioVisor?.listo)`, 160), 'marco', 'el marco carga y queda listo')

  // Lo guardado ANTES (con lo de ahora): un sonido de Code movido +300 ms y su candidato C en el Coliseo.
  await a.evaluar(`import('/src/lib/sonidos/estudioGuardado.ts').then((m) => m.guardarEnElNavegador({ animacion: 'emblema_maravilla', guardado_en: new Date().toISOString(), silenciados: [], ajustes: { 'archivo:redoble': { ms: 300, empieza: 'sitio' } }, letras: { redoble: 'C' }, volumenes: {}, capas: [], ediciones: {} })).then(() => true)`)
  await a.evaluar('location.reload()')
  await a.esp(4000)
  debe(await esperar(a, `Boolean(${IFR}?.contentWindow?.__estudioVisor?.listo)`, 200), 'marco', 'tras recargar, el marco queda listo')

  // Cada tarjeta dice su duración real (la de arriba y la de su botón).
  const durasDeLaPagina = await J(a, `JSON.stringify([...document.querySelectorAll('[data-animacion-tarjeta]')].map((e) => [e.getAttribute('data-animacion-tarjeta'), (e.textContent.match(/(\\d+,\\d) s/) ?? [])[1] ?? '']))`)
  const malas = []
  for (const [id, txt] of durasDeLaPagina) if (txt !== E.duracionDe(E.animacionDe(id)).toFixed(1).replace('.', ',')) malas.push(`${id}: ${txt}`)
  debe(durasDeLaPagina.length === 27 && malas.length === 0, 'duraciones', `las 27 tarjetas dicen su duración real en su botón (${malas.join(' | ') || 'todas'})`)

  /* ── El Coliseo ── */
  await toque(a, '[data-animacion-tarjeta="emblema_maravilla"]')
  await a.esp(1500)
  const dura = await a.evaluar("document.querySelector('[data-dura]')?.textContent ?? ''")
  debe(/dura 25,6 s \(hasta \[Seguir\]\)/.test(dura), 'coliseo', `la tarjeta abierta dice «${dura}»`)
  const linea = await J(a, `JSON.stringify((() => { const l = document.querySelector('[data-linea-de-tiempo]'); return { lo: Number(l.dataset.lo), hi: Number(l.dataset.hi), dura: Number(l.dataset.dura), marcas: [...l.querySelectorAll('[data-marca]')].map((m) => m.dataset.marca), ticks: [...l.querySelectorAll('[data-tick]')].map((t) => Number(t.dataset.tick)), regla: Boolean(l.querySelector('[data-regla]')), filas: [...l.querySelectorAll('[data-fila-de-tiempo]')].map((f) => f.dataset.filaDeTiempo) } })())`)
  debe(linea.dura > 25.5 && linea.hi >= 25.6, 'linea', `la línea de tiempo llega hasta ${linea.hi.toFixed(1)} s (la animación entera)`)
  debe(linea.regla && Math.max(...linea.ticks) >= 24 && linea.ticks.includes(0), 'linea', `la regla de segundos va de 0 a ${Math.max(...linea.ticks)} s`)
  debe(['estalla el destello', 'los textos', '[Seguir]', 'se dibuja el Coliseo', 'latidos'].every((r) => linea.marcas.includes(r)), 'linea', `con las marcas de sus momentos (${linea.marcas.join(' · ')})`)
  debe(linea.filas.includes('archivo:redoble') && linea.filas.includes('archivo:emblema'), 'linea', `y sus sonidos, cada uno en su fila (${linea.filas.join(', ')})`)
  const limites = await J(a, `JSON.stringify([...document.querySelectorAll('input[type=range][aria-label^="Adelantar o atrasar"]')].map((i) => [Number(i.min), Number(i.max)]))`)
  debe(limites.length >= 3 && limites.every(([lo, hi]) => lo <= -25600 && hi >= 25600), 'barras', `las barras de ms de TODOS los sonidos (${limites.length}) van de −25.600 a +25.600 ms (antes llegaban a ±4.200)`)
  await a.evaluar("document.querySelector('[data-linea-de-tiempo]').scrollIntoView({ block: 'start' }); window.scrollBy(0, -80); true")
  await a.captura(`${CAPTURAS}/coliseo_linea_de_tiempo.jpg`)

  // Lo guardado antes sigue en su sitio: el redoble en su candidato C y movido +300 ms.
  const natural = 23.6 - manifiesto.redoble.C.golpe
  const deRedoble = async () => Number(await a.evaluar("document.querySelector('[data-fila-de-tiempo=\"archivo:redoble\"] [data-trozo]')?.dataset.de ?? 'NaN'"))
  debe(Math.abs((await deRedoble()) - (natural + 0.3)) < 0.01, 'guardado', `lo guardado antes sigue donde estaba: el redoble (candidato C, +300 ms) empieza a los ${natural + 0.3 > 0 ? (natural + 0.3).toFixed(2) : ''} s (${(await deRedoble()).toFixed(2)})`)
  debe((await a.evaluar("document.querySelector('[data-candidato=\"redoble:C\"]')?.getAttribute('aria-pressed')")) === 'true', 'guardado', 'y el candidato C sigue elegido')

  // El arrastre y el campo de segundos dan el mismo resultado.
  const antesDeArrastrar = await deRedoble()
  const franja = await centroDe(a, '[data-franja]')
  const tr = await centroDe(a, '[data-fila-de-tiempo="archivo:redoble"] [data-trozo]')
  const lineaInfo = await J(a, "JSON.stringify({ lo: Number(document.querySelector('[data-linea-de-tiempo]').dataset.lo), hi: Number(document.querySelector('[data-linea-de-tiempo]').dataset.hi) })")
  const pxPorS = franja.w / (lineaInfo.hi - lineaInfo.lo)
  const dx = Math.round(-3 * pxPorS)
  await ratonEn(a, tr.x, tr.y, 'mouseMoved')
  await ratonEn(a, tr.x, tr.y, 'mousePressed')
  for (let i = 1; i <= 6; i++) await ratonEn(a, tr.x + (dx * i) / 6, tr.y, 'mouseMoved', { buttons: 1 })
  await ratonEn(a, tr.x + dx, tr.y, 'mouseReleased')
  await a.esp(500)
  const trasArrastrar = await deRedoble()
  debe(Math.abs(trasArrastrar - (antesDeArrastrar - 3)) < 0.06, 'arrastre', `arrastrar el sonido 3 s hacia atrás funciona en toda la longitud (de ${antesDeArrastrar.toFixed(2)} a ${trasArrastrar.toFixed(2)} s)`)
  // El campo: se escribe el mismo segundo y sale lo mismo.
  const escribir = async (clave, texto) => {
    await a.evaluar(`(() => { const el = document.querySelector('[data-empieza-en="${clave}"]'); el.focus(); const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; set.call(el, '${texto}'); el.dispatchEvent(new Event('input', { bubbles: true })); el.blur(); return true })()`)
    await a.esp(500)
  }
  const campoTrasArrastrar = await a.evaluar("document.querySelector('[data-empieza-en=\"archivo:redoble\"]').value")
  debe(campoTrasArrastrar === coma(trasArrastrar, 2).replace(/^(\d+)$/, '$1').replace(/,(\d)$/, ',$10').replace(/^(\d+)$/, '$1,00') || Math.abs(Number(campoTrasArrastrar.replace(',', '.')) - trasArrastrar) < 0.006, 'campo', `el campo muestra el segundo en que empieza (${campoTrasArrastrar})`)
  await escribir('archivo:redoble', '12,40')
  debe(Math.abs((await deRedoble()) - 12.4) < 0.006, 'campo', `escribir «12,40» lo pone a los 12,40 s (${(await deRedoble()).toFixed(2)})`)
  await escribir('archivo:redoble', coma(trasArrastrar, 2))
  debe(Math.abs((await deRedoble()) - trasArrastrar) < 0.011, 'campo', `escribir el segundo del arrastre da lo mismo que el arrastre (${(await deRedoble()).toFixed(2)} y ${trasArrastrar.toFixed(2)})`)

  // Un sonido de Code puesto a los 18 s se programa a los 18 s.
  await escribir('archivo:redoble', '18,00')
  const parar = async () => {
    await a.evaluar(`${IFR}.contentWindow.__estudioVisor.parar(); true`)
    await a.esp(400)
  }
  const agendados = async (espera = 2500, desde = null) => {
    await parar()
    await a.evaluar(`(() => { ${IFR}.contentWindow.__sonidosAgendados = []; return true })()`)
    if (desde === null) await toque(a, '[data-ver-con-sonido]')
    else await toque(a, '[data-desde-aqui]')
    await a.esp(espera)
    return J(a, `JSON.stringify((${IFR}.contentWindow.__sonidosAgendados ?? []).map((x) => ({ p: x.partitura, id: x.id, en: x.en, prog: x.programado })))`)
  }
  const letraRedoble = await a.evaluar(`${IFR}.contentWindow.Function("return import('/src/lib/sonidos/motor.ts')")().then((m) => m.versionDe('redoble'))`)
  const golpeArchivo = manifiesto.redoble[letraRedoble].golpe
  let ag = await agendados()
  const red = ag.filter((x) => x.p === 'escena' && x.id === 'redoble')
  debe(red.length >= 1 && red.every((x) => Math.abs(x.prog - golpeArchivo - 18) < 0.01), 'programado', `el redoble puesto a los 18 s se programa a los 18 s (empieza a los ${red[0] ? (red[0].prog - golpeArchivo).toFixed(2) : '?'} s)`)
  informe.redoble18 = red

  // Un sonido de Eric puesto a los 18 s también.
  await a.evaluar(`(async () => { const w = ${IFR}.contentWindow; const ctx = new w.AudioContext(); const b = ctx.createBuffer(1, 22050, 22050); const v = w.__estudioVisor; window.__propio = { id: 'prueba', nombre: 'prueba.wav', buffer: b, ms: 18000, vol: 1, empieza: 'principio' }; return true })()`)
  await a.evaluar(`(async () => { const w = ${IFR}.contentWindow; w.__sonidosAgendados = []; await w.__estudioVisor.ver({ animacion: 'emblema_maravilla', propios: [window.__propio], silenciados: [], ajustes: {}, letras: {}, volumenes: {}, editados: {} }); return true })()`)
  await a.esp(1500)
  const prop = await J(a, `JSON.stringify((${IFR}.contentWindow.__sonidosAgendados ?? []).filter((x) => x.id === 'propio:prueba').map((x) => x.en))`)
  debe(prop.length === 1 && Math.abs(prop[0] - 18) < 1e-9, 'programado', `un sonido de Eric puesto a los 18 s se programa a los 18 s (${prop.join(',')})`)

  /* ── Roma: la escena empieza a los 3,6 s; un sonido «desde el principio» cae en el segundo de la animación entera ── */
  await toque(a, '[data-animacion-tarjeta="emblema"]')
  await a.esp(1500)
  await escribir('archivo:redoble', '9,00')
  await a.esp(300)
  await parar()
  await a.evaluar(`(() => { ${IFR}.contentWindow.__sonidosAgendados = []; return true })()`)
  await toque(a, '[data-ver-con-sonido]')
  await esperar(a, `(${IFR}.contentWindow.__sonidosAgendados ?? []).some((x) => x.partitura === 'escena')`, 60)
  const romaAg = await J(a, `JSON.stringify((${IFR}.contentWindow.__sonidosAgendados ?? []).filter((x) => x.partitura === 'escena' && x.id === 'redoble').map((x) => x.programado))`)
  const letraRoma = await a.evaluar(`${IFR}.contentWindow.Function("return import('/src/lib/sonidos/motor.ts')")().then((m) => m.versionDe('redoble'))`)
  const gl = manifiesto.redoble[letraRoma].golpe
  debe(romaAg.length >= 1 && Math.abs(romaAg[0] - gl - (9 - 3.6)) < 0.01, 'programado', `en Roma (la escena empieza a los 3,6 s) un redoble a los 9 s de la animación entera empieza a los ${(9 - 3.6).toFixed(1)} s de la escena (${romaAg[0] !== undefined ? (romaAg[0] - gl).toFixed(2) : '?'})`)

  /* ── ▶ desde aquí ── */
  console.log('   · [▶ desde aquí]')
  await toque(a, '[data-animacion-tarjeta="emblema_maravilla"]')
  await a.esp(1500)
  // (El redoble vuelve a su sitio para que el punto elegido no dependa de lo de antes.)
  await escribir('archivo:redoble', '12,40')
  debe(await a.evaluar("document.querySelector('[data-desde-aqui]')?.disabled === true"), 'desde', 'sin punto elegido, [▶ desde aquí] no se puede pulsar')
  // Tocar la franja a los 18 s: el punto sale en la línea (raya azul) y en el botón.
  const fr = await centroDe(a, '[data-franja]')
  const li = await J(a, "JSON.stringify({ lo: Number(document.querySelector('[data-linea-de-tiempo]').dataset.lo), hi: Number(document.querySelector('[data-linea-de-tiempo]').dataset.hi) })")
  const xDe = (s) => fr.l + ((s - li.lo) / (li.hi - li.lo)) * fr.w
  const yFilaVacia = fr.t + fr.h - 3
  for (const tipo of ['mouseMoved', 'mousePressed', 'mouseReleased']) await ratonEn(a, xDe(18), yFilaVacia, tipo)
  await a.esp(300)
  const boton = await a.evaluar("document.querySelector('[data-desde-aqui]')?.textContent ?? ''")
  debe(/desde aquí · 1[78],/.test(boton) && (await a.evaluar("Boolean(document.querySelector('[data-raya-azul]'))")), 'desde', `tocar la línea de tiempo elige el punto: «${boton.trim()}» y la raya azul`)
  ag = await agendados(2500, 18)
  const salto = await a.evaluar(`${IFR}.contentWindow.__saltoDesde ?? null`)
  debe(salto !== null && Math.abs(salto - 18) < 0.06, 'desde', `la animación empieza en el segundo 18 (salto a ${salto})`)
  const sonaron = ag.map((x) => `${x.p}:${x.id}`)
  debe(!ag.some((x) => x.p === 'emblema' && x.id === 'toque') && !ag.some((x) => x.p === 'emblema' && x.id === 'estallido'), 'desde', `los sonidos que ya habían pasado (los latidos y el estallido del suspense) no suenan (${sonaron.join(', ')})`)
  debe(ag.some((x) => x.p === 'escena' && x.id === 'emblema') && ag.some((x) => x.p === 'escena' && x.id === 'clic'), 'desde', 'y los que caen después (el golpe del emblema, el clic, el brillo) suenan en su sitio')
  const redoblePost = ag.find((x) => x.p === 'escena' && x.id === 'redoble')
  debe(!redoblePost || redoblePost.prog - golpeArchivo >= -0.001, 'desde', 'el redoble movido a los 12,4 s, que acaba antes del punto, no suena otra vez')
  informe.desde18 = ag
  // Roma: el punto cae después del suspense: se salta la espera y la escena entra ya.
  await toque(a, '[data-animacion-tarjeta="emblema"]')
  await a.esp(1500)
  await escribir('archivo:redoble', '11,60')
  const fr2 = await centroDe(a, '[data-franja]')
  const li2 = await J(a, "JSON.stringify({ lo: Number(document.querySelector('[data-linea-de-tiempo]').dataset.lo), hi: Number(document.querySelector('[data-linea-de-tiempo]').dataset.hi) })")
  const x8 = fr2.l + ((8 - li2.lo) / (li2.hi - li2.lo)) * fr2.w
  for (const tipo of ['mouseMoved', 'mousePressed', 'mouseReleased']) await ratonEn(a, x8, fr2.t + fr2.h - 3, tipo)
  await a.esp(300)
  ag = await agendados(3000, 8)
  const salto2 = await a.evaluar(`${IFR}.contentWindow.__saltoDesde ?? null`)
  debe(salto2 !== null && Math.abs(salto2 - (8 - 3.6)) < 0.06, 'desde', `Roma, desde el segundo 8: se salta el suspense y la escena entra a los ${(8 - 3.6).toFixed(1)} s de la suya (${salto2})`)
  debe(!ag.some((x) => x.p === 'emblema'), 'desde', 'y el suspense (latidos y estallido) no suena')
  await a.captura(`${CAPTURAS}/emblema_desde_8.jpg`)

  /* ── El zoom ── */
  await toque(a, '[data-zoom-mas]')
  await toque(a, '[data-zoom-mas]')
  await a.esp(400)
  const z = await J(a, "JSON.stringify({ zoom: Number(document.querySelector('[data-linea-de-tiempo]').dataset.zoom), desliza: document.querySelector('[data-scroll-de-la-linea]').scrollWidth > document.querySelector('[data-scroll-de-la-linea]').clientWidth + 10, ticks: document.querySelectorAll('[data-tick]').length })")
  debe(z.zoom === 4 && z.desliza, 'zoom', `el zoom (+) amplía la línea de tiempo ×${z.zoom} y se desliza de lado`)
  await toque(a, '[data-zoom-menos]')
  await toque(a, '[data-zoom-menos]')
  debe((await a.evaluar("document.querySelector('[data-linea-de-tiempo]').dataset.zoom")) === '1', 'zoom', 'y el zoom (−) la vuelve a su tamaño')

  /* ── Las 7 maravillas, entera ── */
  await toque(a, '[data-animacion-tarjeta="maravilla"]')
  await a.esp(1500)
  const m7 = await J(a, "JSON.stringify({ dura: document.querySelector('[data-dura]')?.textContent ?? '', hi: Number(document.querySelector('[data-linea-de-tiempo]').dataset.hi), marcas: [...document.querySelectorAll('[data-marca]')].map((m) => m.dataset.marca) })")
  debe(/dura 10,4 s/.test(m7.dura) && m7.hi >= 10.4 && ['las 7 monedas quietas', 'el choque', 'la medalla para', '[Seguir]'].every((r) => m7.marcas.includes(r)), 'maravilla', `las 7 maravillas: «${m7.dura.trim()}», con sus momentos (${m7.marcas.join(' · ')})`)
  await a.evaluar("document.querySelector('[data-linea-de-tiempo]').scrollIntoView({ block: 'start' }); window.scrollBy(0, -80); true")
  await a.captura(`${CAPTURAS}/maravillas_linea_de_tiempo.jpg`)

  /* ── Las duraciones, contra el [Seguir] de la pantalla ── */
  console.log('   · Cada tarjeta con [Seguir]: su duración contra el [Seguir] real')
  const cuando = []
  for (const id of ['medalla_bronce', 'medalla_plata', 'medalla_oro', 'medalla_diamante', 'coleccion', 'coleccion_imprescindibles', 'pais', 'patrimonio', 'viajero', 'pedazo', 'pedazo_dos', 'pedazo_tres', 'maravilla']) {
    await toque(a, `[data-animacion-tarjeta="${id}"]`)
    await esperar(a, `${IFR}.contentDocument.querySelector('[data-visor-de-animacion]')?.getAttribute('data-animacion-actual') === '${id}'`, 60)
    await a.esp(1800)
    const d = await a.evaluar(`(() => { const b = [...${IFR}.contentDocument.querySelectorAll('button')].find((x) => (x.textContent || '').trim() === 'Seguir'); return b ? parseFloat(${IFR}.contentWindow.getComputedStyle(b).animationDelay) : null })()`)
    const esperado = E.lineaDeTiempo(E.animacionDe(id)).seguir
    cuando.push(`${id} ${d}/${esperado}`)
    debe(d !== null && Math.abs(d - esperado) < 0.06, 'seguir', `${id}: [Seguir] sale a los ${d} s y la tarjeta dice ${esperado.toFixed(2)} s`)
  }
  informe.seguir = cuando
} finally {
  a.cerrar()
}

fs.writeFileSync(`${CAPTURAS}/informe.json`, JSON.stringify(informe, null, 1))
console.log(`\nPrueba de la Tanda V38E: ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
process.exit(fallos.length ? 1 : 0)
