// La prueba de la Tanda V39B, parte EL COLISEO CON SU SUSPENSE: la primera vez empieza, como los demás emblemas, con la frase de espera, los latidos y el estallido, y DESPUÉS la película; al verlo otra vez, directo a la película.
// Lo guardado del Coliseo en el estudio se mueve lo mismo que la película (+3,6 s) para que cada sonido caiga en el mismo fotograma; antes se guarda una copia.
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/pruebaV39B_coliseo.mjs
// La parte de código y datos no necesita servidores; la de pantalla, Vite. Ninguna parte toca el Supabase de producción ni lo guardado de nadie (el navegador de pruebas es de usar y tirar).
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
const toque = async (a, sel) => {
  const r = JSON.parse(await a.evaluar(`(() => { const e = document.querySelector('${sel}'); e.scrollIntoView({ block: 'center' }); const b = e.getBoundingClientRect(); return JSON.stringify({ x: b.left + b.width / 2, y: b.top + b.height / 2 }) })()`))
  for (const type of ['mouseMoved', 'mousePressed', 'mouseReleased']) await a.cdp('Input.dispatchMouseEvent', { type, x: r.x, y: r.y, button: 'left', clickCount: 1 })
}

/* ───────── 1. El código y la línea de tiempo ───────── */
console.log('1. El Coliseo empieza con su suspense; el estudio lo cuenta')
const E = await cargar('src/lib/sonidos/estudio.ts')
const G = await cargar('src/lib/sonidos/estudioGuardado.ts')
const T = await cargar('src/lib/sonidos/tiempos.ts')
{
  const esc = sinComentarios(leer('src/components/logros/momentos/EscenaDeEmblema.tsx'))
  debe(/const conSuspense = primeraVez && Boolean\(frase\) && !sinMov && !ESCENAS_LANZAROTE\.includes\(id\)/.test(esc) && !/id !== 'coliseo'/.test(esc), 'suspense', 'la espera de los emblemas ya no deja fuera al Coliseo: primera vez, con frase y sin «reducir movimiento»')
  debe(/id === 'coliseo' \? <Pelicula/.test(esc), 'suspense', 'y después de la espera entra su película')
  const col = sinComentarios(leer('src/components/logros/momentos/escenas/coliseo.tsx'))
  debe(!/ecIRing|ecIPhrase|ecICore|Suspense3|data-suspense/.test(col), 'dos_suspenses', 'la película del Coliseo no lleva dentro ningún suspense propio (sus frases «Casi 2.000 años esperándote…» son su guion): no hay dos esperas seguidas')
  const l = E.lineaDeTiempo(E.animacionDe('emblema_maravilla'))
  const s0 = T.TIEMPOS_DE_EMBLEMA.estalla
  debe(l.tramos.find((x) => x.partitura === 'emblema')?.empieza === 0 && l.tramos.find((x) => x.partitura === 'escena')?.empieza === s0, 'linea', `la línea de tiempo del Coliseo: la espera a los 0 s y la película a los ${s0} s`)
  debe(Math.abs(l.dura - (s0 + 25.6)) < 1e-9 && l.seguir === l.dura, 'linea', `y dura ${l.dura.toFixed(1)} s (la espera y la película entera, hasta [Seguir])`)
  const marca = (r) => l.marcas.find((m) => m.rotulo === r)?.t
  debe(marca('latidos') === T.TIEMPOS_DE_EMBLEMA.aros[0] && Math.abs(marca('estalla el destello') - (s0 + 23.6)) < 1e-9 && Math.abs(marca('los textos') - (s0 + 24)) < 1e-9 && Math.abs(marca('«Casi 2.000 años esperándote…»') - (s0 + 0.3)) < 1e-9, 'linea', 'con los latidos a los suyos y los momentos de la película contados desde que empieza (el destello a los 3,6 + 23,6 s)')
  const filas = E.archivosDeLaAnimacion(E.animacionDe('emblema_maravilla'))
  const sint = E.sintesDeLaAnimacion(E.animacionDe('emblema_maravilla'))
  debe(filas.includes('estallido') && sint.includes('toque'), 'filas', `las filas «toque (latidos)» y «Estallido del suspense», como las de Roma (${[...sint, ...filas].join(', ')})`)
  debe(/toque: 'toque \(latidos\)'/.test(leer('src/components/logros/AdminSonidos.tsx')), 'filas', 'y la fila del toque se llama «toque (latidos)»')
  const roma = E.lineaDeTiempo(E.animacionDe('emblema'))
  debe(roma.tramos.find((x) => x.partitura === 'escena').empieza === s0, 'linea', 'igual que la de Roma')
}

/* ───────── 2. Lo guardado se mueve lo mismo que la película ───────── */
console.log('2. Lo guardado del Coliseo sigue cayendo en el mismo fotograma de la película')
{
  const vacio = G.ESTADO_VACIO()
  const antes = {
    ...vacio,
    silenciados: ['archivo:clic'],
    letras: { redoble: 'C' },
    volumenes: { redoble: 0.7 },
    ajustes: {
      'archivo:redoble': { ms: 12000, empieza: 'principio' },
      'archivo:emblema': { ms: 500, empieza: 'golpe' },
      'archivo:brillo': { ms: 300, empieza: 'sitio' },
      'archivo:estallido': { ms: 200, empieza: 'principio' },
      'sint:toque': { ms: -100, empieza: 'principio' },
    },
    capas: [
      { id: 'a', origen: 'archivo', nombre: 'mio.wav', ms: 18000, vol: 1, empieza: 'principio' },
      { id: 'b', origen: 'code', nombre: 'Añadido', sonido: 'brillo', letra: 'A', ms: 400, vol: 0.5, empieza: 'golpe' },
    ],
  }
  const copiaJson = JSON.stringify(antes)
  const despues = G.migrarColiseoV39B(antes)
  debe(JSON.stringify(antes) === copiaJson, 'copia', 'la migración no toca el original (la copia de lo de antes queda intacta)')
  const S = G.SEGUNDOS_DE_SUSPENSE_DEL_COLISEO
  // «el mismo fotograma»: el instante de la PELÍCULA en que cae cada sonido = su segundo en la animación entera − lo que tarda en empezar la película.
  const fotogramaAntes = (ms) => ms / 1000
  const fotogramaDespues = (ms) => ms / 1000 - S
  debe(despues.ajustes['archivo:redoble'].ms === 15600 && Math.abs(fotogramaDespues(15600) - fotogramaAntes(12000)) < 1e-9, 'fotograma', 'el redoble de los 12 s «desde el principio» pasa a los 15,6 s de la animación: cae en el fotograma 12,0 s de la película, como antes')
  debe(despues.ajustes['archivo:emblema'].ms === 4100 && despues.ajustes['archivo:emblema'].empieza === 'golpe', 'fotograma', 'lo «En el golpe» de la película suma lo mismo (la referencia del golpe es el estallido y no se mueve)')
  debe(despues.ajustes['archivo:brillo'].ms === 300, 'fotograma', 'lo «donde suena de siempre» no se toca (va con la película solo)')
  debe(despues.ajustes['archivo:estallido'].ms === 200 && despues.ajustes['sint:toque'].ms === -100, 'fotograma', 'lo de la espera (el estallido y el toque de los latidos) se queda donde estaba')
  debe(despues.capas[0].ms === 21600 && despues.capas[1].ms === 4000 && despues.capas[0].nombre === 'mio.wav', 'fotograma', 'los sonidos de Eric y los añadidos suben lo mismo, sin tocar nada más')
  debe(despues.letras.redoble === 'C' && despues.volumenes.redoble === 0.7 && despues.silenciados[0] === 'archivo:clic', 'fotograma', 'letras, volúmenes y silencios no cambian')
  debe(G.ID_DE_LA_COPIA_DEL_COLISEO === 'copia_antes_de_v39b:emblema_maravilla' && !E.animacionDe(G.ID_DE_LA_COPIA_DEL_COLISEO), 'copia', 'la copia de seguridad se guarda bajo un id que no es una tarjeta (la página ni la enseña ni la borra)')
  const adm = sinComentarios(leer('src/components/logros/AdminSonidos.tsx'))
  debe(/guardarEnElNavegador\(\{ \.\.\.g, animacion: ID_DE_LA_COPIA_DEL_COLISEO \}\)[\s\S]{0,200}migrarColiseoV39B\(g\)/.test(adm) && /version_linea \?\? 1\) < 2/.test(adm), 'copia', 'al abrir el estudio: primero la copia, luego el movimiento, una sola vez (version_linea)')
  const AP = await import('../sonidos/aplicarEstudio.mjs')
  const { animaciones, manifiesto } = AP.leerAnimacionesYManifiesto()
  const base = (tramos) => ({ version: 1, generado: '2026-11-22T10:00:00.000Z', volumen_general: 0.8, animaciones: { emblema_maravilla: { nombre: 'Coliseo', duracion: 29.2, golpe: 3.6, ...(tramos ? { tramos } : {}), sonidos_de_code: [], capas: [] } } })
  const viejo = AP.validarEstudio(base(null), { animaciones, manifiesto, archivos: new Map() })
  debe(viejo.some((e) => /antes de que el Coliseo empezara con su suspense/.test(e)), 'zip', 'un zip de antes de la V39B (sin las partes) no se aplica: dice que se baje otra vez del estudio')
  const nuevo = AP.validarEstudio(base([{ partitura: 'emblema', empieza: 0 }, { partitura: 'escena', empieza: 3.6 }]), { animaciones, manifiesto, archivos: new Map() })
  debe(nuevo.length === 0, 'zip', `y uno de ahora, con la película a los 3,6 s, sí (${nuevo.join(' | ') || 'sin errores'})`)
}

/* ───────── 3. La pantalla ───────── */
if (!(await fetch(APP).then((r) => r.ok).catch(() => false))) {
  console.log('3. (SIN VITE: la parte de la pantalla NO SE HA VERIFICADO)')
  console.log(`\nPrueba de la Tanda V39B (Coliseo): ${comprobaciones} comprobaciones · ${fallos.length} fallos · PANTALLA SIN VERIFICAR`)
  process.exit(fallos.length ? 1 : 0)
}
console.log('3. En el estudio y en la app (1280 x 1000)')
const MOCK = "const f = window.fetch.bind(window); window.fetch = (u, i) => String(u).includes('/api/admin/avisos-viajeros') ? Promise.resolve(new Response(JSON.stringify({ ok: true, nuevos: 0, avisos: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } })) : f(u, i);"
const IFR = "document.querySelector('[data-visor-iframe]')"
const CAP = 'docs/dias/V39B_capturas'
fs.mkdirSync(CAP, { recursive: true })
const a = await abrirApp(APP, { ruta: '/?cuentas=off&logros=on&logrosDemo=1&admin=sonidos&apertura=0', ancho: 1280, alto: 1000, sinEsperarRoot: true, esperaFija: 5, antes: MOCK })
try {
  debe(await esperar(a, "document.querySelectorAll('[data-animacion-tarjeta]').length >= 20"), 'pagina', 'la página sale con su lista')
  debe(await esperar(a, `Boolean(${IFR}?.contentWindow?.__estudioVisor?.listo)`, 160), 'marco', 'el marco carga y queda listo')

  // Lo guardado de antes (sin version_linea): un redoble a los 12 s «desde el principio», el candidato C y un sonido añadido a los 18 s.
  await a.evaluar(`import('/src/lib/sonidos/estudioGuardado.ts').then((m) => m.guardarEnElNavegador({ animacion: 'emblema_maravilla', guardado_en: '2026-11-20T10:00:00.000Z', silenciados: [], ajustes: { 'archivo:redoble': { ms: 12000, empieza: 'principio' } }, letras: { redoble: 'C' }, volumenes: {}, capas: [{ id: 'a1', origen: 'code', nombre: 'Añadido', sonido: 'brillo', letra: 'A', ms: 18000, vol: 1, empieza: 'principio' }], ediciones: {} })).then(() => true)`)
  await a.evaluar('location.reload()')
  await a.esp(4000)
  debe(await esperar(a, `Boolean(${IFR}?.contentWindow?.__estudioVisor?.listo)`, 200), 'marco', 'tras recargar, el marco queda listo')
  await toque(a, '[data-animacion-tarjeta="emblema_maravilla"]')
  await a.esp(1500)
  const guardados = await J(a, `import('/src/lib/sonidos/estudioGuardado.ts').then((m) => m.leerGuardados()).then((l) => JSON.stringify(l.map((g) => ({ id: g.animacion, v: g.version_linea ?? 1, ms: g.ajustes?.['archivo:redoble']?.ms ?? null, capa: g.capas?.[0]?.ms ?? null }))))`)
  const prin = guardados.find((g) => g.id === 'emblema_maravilla')
  const copia = guardados.find((g) => g.id === 'copia_antes_de_v39b:emblema_maravilla')
  debe(copia && copia.ms === 12000 && copia.capa === 18000 && copia.v === 1, 'copia', `se guardó una copia de lo de antes, intacta (redoble ${copia?.ms}, añadido ${copia?.capa})`)
  debe(prin && prin.v === 2 && prin.ms === 15600 && prin.capa === 21600, 'migracion', `lo guardado se movió +3,6 s: redoble ${prin?.ms} ms, añadido ${prin?.capa} ms`)
  const deRedoble = Number(await a.evaluar("document.querySelector('[data-fila-de-tiempo=\"archivo:redoble\"] [data-trozo]')?.dataset.de ?? 'NaN'"))
  debe(Math.abs(deRedoble - 15.6) < 0.01, 'migracion', `y en la línea de tiempo el redoble empieza a los 15,6 s (la película, a los 3,6 s: el fotograma 12,0 de la película, como antes): ${deRedoble.toFixed(2)}`)
  debe((await a.evaluar("document.querySelector('[data-candidato=\"redoble:C\"]')?.getAttribute('aria-pressed')")) === 'true', 'migracion', 'el candidato C sigue elegido')
  // Recargar otra vez: no se mueve dos veces.
  await a.evaluar('location.reload()')
  await a.esp(4000)
  await esperar(a, `Boolean(${IFR}?.contentWindow?.__estudioVisor?.listo)`, 200)
  const otra = await J(a, `import('/src/lib/sonidos/estudioGuardado.ts').then((m) => m.leerGuardados()).then((l) => JSON.stringify(l.map((g) => ({ id: g.animacion, ms: g.ajustes?.['archivo:redoble']?.ms ?? null }))))`)
  debe(otra.find((g) => g.id === 'emblema_maravilla')?.ms === 15600 && otra.find((g) => g.id === 'copia_antes_de_v39b:emblema_maravilla')?.ms === 12000, 'migracion', 'al volver a abrir el estudio no se mueve otra vez y la copia sigue intacta')

  // La tarjeta: primero el suspense, luego la película.
  await toque(a, '[data-animacion-tarjeta="emblema_maravilla"]')
  await a.evaluar(`(() => { const w = ${IFR}.contentWindow; w.__sonidosAgendados = []; return true })()`)
  await a.evaluar(`${IFR}.contentWindow.__estudioVisor.parar(); true`)
  await a.esp(400)
  await a.evaluar(`(() => { ${IFR}.contentWindow.__sonidosAgendados = []; return true })()`)
  await toque(a, '[data-ver-con-sonido]')
  const susp = await esperar(a, `Boolean(${IFR}.contentDocument.querySelector('[data-suspense]'))`, 20)
  debe(susp, 'suspense', 'la tarjeta del Coliseo enseña primero la espera (la frase de suspense, los aros que laten)')
  const fraseVista = await a.evaluar(`(${IFR}.contentDocument.querySelector('[data-suspense]')?.innerText ?? '').trim()`)
  debe(fraseVista.length > 3, 'suspense', `con su frase («${fraseVista}»)`)
  await a.esp(1200)
  const antesDePelicula = await J(a, `JSON.stringify({ pelicula: /Casi\s*2\.000/.test(${IFR}.contentDocument.body.innerText), escena: (${IFR}.contentWindow.__sonidosAgendados ?? []).filter((x) => x.partitura === 'escena').length })`)
  debe(!antesDePelicula.pelicula && antesDePelicula.escena === 0, 'suspense', 'y la película todavía no ha empezado (ni su sonido)')
  await a.captura(`${CAP}/coliseo_suspense.jpg`)
  await esperar(a, `/Casi\s*2\.000/.test(${IFR}.contentDocument.body.innerText)`, 30)
  await a.esp(600)
  const desp = await J(a, `JSON.stringify({ suspense: Boolean(${IFR}.contentDocument.querySelector('[data-suspense]')), ag: (${IFR}.contentWindow.__sonidosAgendados ?? []).map((x) => ({ p: x.partitura, id: x.id })) })`)
  debe(!desp.suspense, 'suspense', 'a los 3,6 s la espera acaba y entra la película (sin una segunda espera)')
  const latidos = desp.ag.filter((x) => x.p === 'emblema' && x.id === 'toque').length
  const estallido = desp.ag.filter((x) => x.p === 'emblema' && x.id === 'estallido').length
  debe(latidos >= 5 && estallido >= 1, 'sonidos', `suenan los latidos (${latidos} toques) y el estallido del suspense (${estallido})`)
  debe(desp.ag.some((x) => x.p === 'escena'), 'sonidos', 'y el sonido de la película entra cuando empieza la película')
  await a.captura(`${CAP}/coliseo_pelicula.jpg`)
  await a.evaluar(`${IFR}.contentWindow.__estudioVisor.parar(); true`)
} finally {
  a.cerrar()
}

/* ───── La app: la primera vez / al verlo otra vez ───── */
console.log('4. En la app (390 x 844): la primera vez con suspense; al verlo otra vez, directo a la película')
const b = await abrirApp(APP, { ruta: '/?cuentas=off&logros=on&logrosDemo=1&apertura=0&version=completa', ancho: 390, alto: 844 })
try {
  await esperar(b, 'Boolean(window.__momentos)', 240)
  const vista = () => J(b, `JSON.stringify({ suspense: Boolean(document.querySelector('[data-suspense]')), pelicula: /Casi\s*2\.000/.test(document.body.innerText), emblema: Boolean(document.querySelector('[role=dialog][aria-label^="Emblema"]')) })`)
  await b.evaluar("window.__momentos.lanzar('coliseo'); true")
  await b.esp(1500)
  let v = await vista()
  debe(v.suspense && !v.pelicula, 'app_primera', `el Coliseo, la primera vez, enseña la espera antes de la película (${JSON.stringify(v)})`)
  await esperar(b, "/Casi\s*2\.000/.test(document.body.innerText)", 40)
  v = await vista()
  debe(!v.suspense && v.pelicula, 'app_primera', 'y después, la película')
  await b.evaluar("window.__momentos.cerrar(); true")
  await b.esp(800)
  await b.evaluar("window.__momentos.repetir('coliseo'); true")
  await b.esp(1500)
  v = await vista()
  debe(!v.suspense, 'app_otra_vez', 'al verlo otra vez, sin espera')
  await esperar(b, "/Casi\s*2\.000/.test(document.body.innerText)", 20)
  debe((await vista()).pelicula, 'app_otra_vez', 'directo a la película')
} finally {
  b.cerrar()
}

console.log(`\nPrueba de la Tanda V39B (Coliseo): ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
process.exit(fallos.length ? 1 : 0)
