// La prueba de la Tanda V38B (22-nov): PEDAZOS UNO DETRÁS DE OTRO, EMBLEMAS IGUALES POR DESTINO Y DOS DETALLES.
//   1. Pedazos: cada insignia empieza cuando la anterior ha acabado del todo (su animación Y su sonido) más una pausa; cada una hace sonar su pedazo (+1 semitono por repetición); [Seguir] sale al acabar la última.
//   2. Emblemas: dentro de un destino, todas las escenas (menos el Coliseo) tienen los mismos momentos clave (`fl`, `dim`, `x`); la Fontana de Trevi igual que el resto de Roma; el estudio tiene UNA tarjeta por destino.
//   3. El Coliseo «por fuera» en un día propio dice en qué día se ve por dentro; DÍAS → Explorar en Roma enseña los pines.
// La parte de código y del motor no necesita servidores. La pantalla necesita Vite (5173) y, para DÍAS → Explorar, la API (8787).
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/pruebaV38B.mjs
// Ninguna parte toca el Supabase de producción: el administrador es de mentira (?logrosDemo=1) y _enLaApp.mjs bloquea *.supabase.co.
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
  await a.cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x: r.x, y: r.y })
  await a.cdp('Input.dispatchMouseEvent', { type: 'mousePressed', x: r.x, y: r.y, button: 'left', clickCount: 1 })
  await a.cdp('Input.dispatchMouseEvent', { type: 'mouseReleased', x: r.x, y: r.y, button: 'left', clickCount: 1 })
}
const cargar = async (entrada) => {
  const b = await build({ entryPoints: [entrada], bundle: true, format: 'esm', platform: 'node', write: false, define: { 'import.meta.env': '{}' } })
  return import('data:text/javascript;base64,' + Buffer.from(b.outputFiles[0].text).toString('base64'))
}
const RUTA = '/?cuentas=off&logros=on&logrosDemo=1&admin=sonidos&apertura=0'
const MOCK = "const f = window.fetch.bind(window); window.fetch = (u, i) => String(u).includes('/api/admin/avisos-viajeros') ? Promise.resolve(new Response(JSON.stringify({ ok: true, nuevos: 0, avisos: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } })) : f(u, i);"
const IFR = "document.querySelector('[data-visor-iframe]')"
const CAPTURAS = 'docs/dias/V38B_capturas'
fs.mkdirSync(CAPTURAS, { recursive: true })

/* ───────── 1. Los tiempos de los pedazos (código) ───────── */
console.log('1. Pedazos uno detrás de otro: los números')
const T = await cargar('src/lib/sonidos/tiempos.ts')
{
  const fin = T.TIEMPOS_DE_PEDAZO.fin
  const h0 = T.huecoEntrePedazos(T.RETRASO_DEL_PEDAZO + fin - 0.5)
  debe(Math.abs(h0 - (fin + T.PAUSA_ENTRE_PEDAZOS)) < 1e-9, 'hueco', `si el sonido acaba antes que la animación, el hueco es la animación (${fin} s) más la pausa (${T.PAUSA_ENTRE_PEDAZOS} s): ${h0.toFixed(2)} s`)
  const h1 = T.huecoEntrePedazos(T.RETRASO_DEL_PEDAZO + 3.5)
  debe(Math.abs(h1 - (3.5 + T.PAUSA_ENTRE_PEDAZOS)) < 1e-9, 'hueco', `si el sonido dura más que la animación, manda el sonido: un sonido de 3,5 s da un hueco de ${h1.toFixed(2)} s`)
  debe(T.huecoEntrePedazos(5) > T.huecoEntrePedazos(3), 'hueco', 'cuanto más dura el sonido, más grande el hueco (sale de los números, no de un 1,6 fijo)')
  debe(T.PAUSA_ENTRE_PEDAZOS >= 0.1 && T.PAUSA_ENTRE_PEDAZOS <= 0.3, 'hueco', `la pausa es corta (~0,2 s): ${T.PAUSA_ENTRE_PEDAZOS} s`)
  debe(T.retrasoDelPedazoN(0, h0) === T.RETRASO_DEL_PEDAZO && Math.abs(T.retrasoDelPedazoN(2, h0) - (T.RETRASO_DEL_PEDAZO + 2 * h0)) < 1e-9, 'hueco', 'la insignia i empieza a RETRASO + i × hueco')
  for (const n of [1, 2, 3, 4]) {
    const cta = T.ctaDeLosPedazos(n, 2.4)
    const ultimaAcaba = T.retrasoDelPedazoN(n - 1, T.huecoEntrePedazos(2.4)) + Math.max(fin, 2.4 - T.RETRASO_DEL_PEDAZO)
    debe(cta >= ultimaAcaba, 'cta', `${n} pedazo(s): [Seguir] sale a los ${cta.toFixed(2)} s, después de que acabe la última (${ultimaAcaba.toFixed(2)} s)`)
  }
  debe(T.ctaDeLosPedazos(1, 2.4) <= T.ctaDeLosPedazos(2, 2.4) && T.ctaDeLosPedazos(2, 2.4) <= T.ctaDeLosPedazos(3, 2.4), 'cta', 'con más pedazos, [Seguir] sale más tarde')
  const st = [0, 1, 2, 3, 4, 5, 9].map((i) => T.semitonosDelPedazo(i))
  debe(st[0] === 0 && st[1] === 1 && st[2] === 2 && st[3] === 3 && st[4] === T.MAX_SEMITONOS_DE_PEDAZO && st[6] === T.MAX_SEMITONOS_DE_PEDAZO, 'semitonos', `el 1.º tal cual, +1 semitono por repetición y un tope (${st.join(',')})`)
}
{
  const pant = sinComentarios(leer('src/components/logros/momentos/pantallas.tsx'))
  debe(!/\*\s*1\.6/.test(pant), 'sin_1_6', 'PantallaPedazos ya no usa un 1,6 s fijo entre insignias')
  debe(/huecoEntrePedazos\(finSonoro, reducido\)/.test(pant) && /retrasoDelPedazoN\(i, hueco\)/.test(pant) && /ctaDeLosPedazos\(filas\.length, finSonoro, reducido\)/.test(pant), 'pantalla', 'las insignias y [Seguir] salen de las funciones de tiempos.ts')
  debe(/sonar\('pedazo', \{ semitonos: semitonosDelPedazo\(k\), repeticion: true \}\)/.test(pant), 'pantalla', 'cada insignia a partir de la 2.ª hace sonar su pedazo, con su semitono')
  const motor = sinComentarios(leer('src/lib/sonidos/motor.ts'))
  debe(/export function finSonoroDe/.test(motor) && /playbackRate\.value = velocidad/.test(motor) && /if \(o\.repeticion\) programarPropios/.test(motor), 'motor', 'el motor da cuándo acaba de sonar de verdad, transpone y repite los sonidos de Eric del estudio')
}

/* ───────── 2. Emblemas: los mismos tiempos dentro de cada destino (código) ───────── */
console.log('2. Emblemas: mismos momentos clave dentro de cada destino')
const defecto = T.tiemposDeEscena()
debe(defecto.fl === 8 && defecto.dim === 7.6 && defecto.x.length === 4, 'defecto', `Roma por defecto: fl ${defecto.fl}, dim ${defecto.dim}, x ${defecto.x.join(', ')}`)
const dirEscenas = 'src/components/logros/momentos/escenas'
const indice = leer(`${dirEscenas}/index.ts`)
const idsRoma = [...indice.matchAll(/^\s+([a-z_]+): \(\) => import\('\.\/([a-z_]+)'\)/gm)].map((m) => m[1])
const idsLz = [...indice.matchAll(/^\s+([a-z_]+): \(\) => import\('\.\/lanza\/([a-z_]+)'\)/gm)].map((m) => m[1])
debe(idsRoma.length === 13 && idsLz.length === 11, 'escenas', `hay 13 escenas de Roma (sin el Coliseo) y 11 de Lanzarote (${idsRoma.length} y ${idsLz.length})`)
const sueltas = []
for (const id of idsRoma) {
  const src = sinComentarios(leer(`${dirEscenas}/${id}.tsx`))
  // Los momentos clave que una escena de Roma podría cambiar a su gusto (`dim`, `fl`, `x` al nivel de su configuración): cualquiera que no sea el de por defecto rompe la regla.
  const propios = [...src.matchAll(/\n  (dim|fl|x): ([^\n]+),?\n/g)].map((m) => `${m[1]}:${m[2]}`)
  if (propios.length > 0) sueltas.push(`${id} (${propios.join(' ')})`)
}
debe(sueltas.length === 0, 'mismos_tiempos', `ninguna escena de Roma cambia dim, fl ni x: todas usan los de por defecto (${sueltas.join('; ') || 'ninguna'})`)
const fontana = sinComentarios(leer(`${dirEscenas}/fontana_de_trevi.tsx`))
debe(!/\n  (dim|fl|x):/.test(fontana), 'fontana', 'la Fontana de Trevi ya no tiene dim 8.1, fl 8.45 ni sus x propios: sigue los de Roma')
debe(/ecOut \.5s 8s /.test(fontana) && /ecGlowUp 1\.5s 6\.55s/.test(fontana) && /ecSink 3\.15s 3\.4s/.test(fontana), 'fontana', 'y el dibujo de la moneda sigue a esos tiempos: se apaga a los 8 s (la luz estalla a los 8) y acaba de bajar medio segundo antes')
const lzSueltas = []
for (const id of idsLz) {
  const src = sinComentarios(leer(`${dirEscenas}/lanza/${id}.ts`))
  const propios = [...src.matchAll(/\n\s*(dim|fl|x|t0)\s*:/g)].map((m) => m[1])
  if (propios.length > 0) lzSueltas.push(`${id} (${propios.join(',')})`)
}
debe(lzSueltas.length === 0, 'mismos_tiempos', `ninguna escena de Lanzarote lleva tiempos propios (${lzSueltas.join('; ') || 'ninguna'})`)
const lanza = sinComentarios(leer(`${dirEscenas}/cineLanza.tsx`))
const configLz = /interface ConfigLanza \{([\s\S]*?)\n\}/.exec(lanza)?.[1] ?? ''
debe(!/\b(fl|dim|x)\??:/.test(configLz) && /fl: 9\.9 - t0, dim: 9\.5 - t0/.test(lanza), 'mismos_tiempos', 'las 11 escenas de Lanzarote comparten los suyos (la luz estalla a los 9,9 s): salen de cineLanza.tsx, no de cada escena')
// El Coliseo es la excepción: su escena tiene sus propios tiempos.
debe(/tEmb - off/.test(leer(`${dirEscenas}/coliseo.tsx`)), 'coliseo', 'el Coliseo conserva sus propios momentos clave (es la excepción)')

const claude = leer('CLAUDE.md')
debe(/todos los emblemas de un destino usan los mismos momentos clave \(`dim`, `fl`, `x`\); nunca uno distinto/i.test(claude), 'claude_md', 'CLAUDE.md lleva la regla para los destinos nuevos')

/* ───────── 3. El estudio: una tarjeta de emblema por destino y los pedazos con 1, 2 y 3 ───────── */
console.log('3. El estudio (código)')
const E = await cargar('src/lib/sonidos/estudio.ts')
const A = E.ANIMACIONES
const porId = (id) => A.find((x) => x.id === id)
debe(porId('emblema')?.nombre === 'Emblema de Roma' && porId('emblema_lanzarote')?.nombre === 'Emblema de Lanzarote' && porId('emblema_maravilla')?.nombre === 'Coliseo', 'tarjetas', 'tarjetas «Emblema de Roma», «Emblema de Lanzarote» y «Coliseo»')
debe(!porId('escena_roma') && !porId('escena_lanzarote'), 'tarjetas', 'ya no hay tarjetas sueltas «Escena de Roma» ni «Escena de Lanzarote»')
debe(A.filter((x) => /emblema|escena|coliseo/i.test(x.nombre)).length === 3, 'tarjetas', `tres tarjetas de emblema en total, una por destino y el Coliseo (${A.filter((x) => /emblema|escena|coliseo/i.test(x.nombre)).map((x) => x.nombre).join(' · ')})`)
const idsDeRoma = (porId('emblema')?.otrasEscenas ?? []).map((x) => x.id)
const idsDeLz = (porId('emblema_lanzarote')?.otrasEscenas ?? []).map((x) => x.id)
debe(JSON.stringify([...idsDeRoma].sort()) === JSON.stringify([...idsRoma].sort()), 'tarjetas', 'la tarjeta de Roma deja ver las 13 escenas de Roma (las mismas que tiene la app)')
debe(JSON.stringify([...idsDeLz].sort()) === JSON.stringify([...idsLz].sort()), 'tarjetas', 'la tarjeta de Lanzarote deja ver las 11 escenas de Lanzarote')
debe(!porId('emblema_maravilla')?.otrasEscenas, 'tarjetas', 'el Coliseo no tiene otras escenas: es una sola')
debe(porId('emblema')?.destinoDeEscenas === 'roma' && porId('emblema_lanzarote')?.destinoDeEscenas === 'lanzarote', 'tarjetas', 'cada tarjeta sabe de qué destino es')
const nPedazos = (id) => (E.MOMENTOS_DEL_ESTUDIO[id]?.() ?? []).length
debe(nPedazos('pedazo') === 1 && nPedazos('pedazo_dos') === 2 && nPedazos('pedazo_tres') === 3, 'tarjetas', `tarjetas de pedazo con 1, 2 y 3 colecciones (${nPedazos('pedazo')}, ${nPedazos('pedazo_dos')}, ${nPedazos('pedazo_tres')})`)
debe(A.length === 27, 'tarjetas', `el estudio tiene sus 27 tarjetas (${A.length})`)
debe(sinComentarios(leer('src/components/logros/sonidos/VisorDeAnimacion.tsx')).includes('momentoDeEscena(a.destinoDeEscenas, escena)'), 'tarjetas', 'el visor sabe ver otra escena del destino')

/* ───────── 4. El Coliseo por fuera en un día propio (motor, sin servidores) ───────── */
console.log('4. El Coliseo «por fuera» en un día propio dice en qué día se ve por dentro')
const { buildDayBlockV3 } = await import('../../server/engine/index.js')
const { findPipelineV2Data } = await import('../../server/routeAlgorithm.js')
const D = findPipelineV2Data('Roma')
const sumar = (iso, n) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10)
const paradasColiseo = (day) => (day?.stops ?? []).filter((s) => s.name === 'Coliseo')
{
  const TOTAL = 6
  let conPropio = 0
  let porFuera = 0
  let sinNota = 0
  let malDia = 0
  let sinDentro = 0
  let variosDentro = 0
  for (const inicio of ['2027-03-09', '2027-05-17', '2027-09-21', '2027-11-02']) {
    for (const propio of [1, 2, 3, 4, 5]) {
      const dias = []
      for (let n = 1; n <= TOTAL - 1; n++) {
        dias.push(await buildDayBlockV3(D, TOTAL, false, n, null, inicio, [], ['imprescindibles'], { city: 'Roma', scheduler: 'v3', engine: 'v4', diaCuatro: 'roma', ...(n === propio ? { sitiosPropios: ['Coliseo', 'Panteón', 'Piazza Navona'], nombreDiaPropio: 'Mi día en Roma' } : {}) }))
      }
      const dentro = []
      dias.forEach((d, i) => {
        for (const s of paradasColiseo(d)) if (s.visit_mode === 'dentro' && !String(s.name).includes('noche')) dentro.push(i + 1)
      })
      const dePropio = paradasColiseo(dias[propio - 1])
      if (dePropio.length === 0) continue
      conPropio++
      if (dentro.length === 0) sinDentro++
      if (dentro.length > 1) variosDentro++
      for (const s of dePropio) {
        if (s.visit_mode !== 'fuera') continue
        porFuera++
        const m = /^ya lo ves por dentro el día (\d+)$/.exec(String(s.outside_reason ?? ''))
        if (!m) sinNota++
        else if (!dentro.includes(Number(m[1]))) malDia++
      }
    }
  }
  debe(conPropio >= 15, 'coliseo', `el barrido mira de verdad (${conPropio} días propios con el Coliseo)`)
  debe(porFuera > 0, 'coliseo', `hay días propios con el Coliseo por fuera (${porFuera})`)
  debe(sinNota === 0, 'coliseo', `todo Coliseo «por fuera» del día propio dice «ya lo ves por dentro el día N» (${sinNota} sin nota)`)
  debe(malDia === 0, 'coliseo', `y el día que dice es de verdad un día en que el Coliseo va por dentro (${malDia} equivocados)`)
  debe(sinDentro === 0, 'coliseo', `si el día propio lleva el Coliseo, el viaje lo ve por dentro algún día (nunca solo por fuera): ${sinDentro} viajes sin dentro`)
  debe(variosDentro === 0, 'coliseo', `y por dentro una sola vez en el viaje (${variosDentro} viajes con más de un día por dentro)`)
  const acc = sinComentarios(leer('src/components/route/dayDetail/StopAccordion.tsx'))
  debe(/Por fuera · \$\{stop\.outsideReason\}/.test(acc), 'coliseo', 'la tarjeta de la parada enseña «Por fuera · ya lo ves por dentro el día N»')
}

/* ───────── 5. Pantalla ───────── */
if (!(await fetch(APP).then((r) => r.ok).catch(() => false))) {
  console.log('5. (SIN VITE: la parte de la pantalla NO SE HA VERIFICADO)')
  console.log(`\nPrueba de la Tanda V38B: ${comprobaciones} comprobaciones · ${fallos.length} fallos · PANTALLA SIN VERIFICAR`)
  process.exit(fallos.length ? 1 : 0)
}
console.log('5. En el estudio de sonidos (1280 x 1000)')
const adm = await abrirApp(APP, { ruta: RUTA, ancho: 1280, alto: 1000, sinEsperarRoot: true, esperaFija: 5, antes: MOCK })
const informe = {}
try {
  debe(await esperar(adm, "document.querySelectorAll('[data-animacion-tarjeta]').length >= 20"), 'pagina', 'la página sale con su lista')
  debe(await esperar(adm, `Boolean(${IFR}?.contentWindow?.__estudioVisor?.listo)`, 160), 'marco', 'el marco carga y queda listo')
  const ids = await J(adm, `JSON.stringify([...document.querySelectorAll('[data-animacion-tarjeta]')].map((e) => e.getAttribute('data-animacion-tarjeta')))`)
  debe(ids.length === 27 && ids.includes('emblema') && ids.includes('emblema_lanzarote') && ids.includes('emblema_maravilla') && ids.includes('pedazo_tres') && !ids.includes('escena_roma') && !ids.includes('escena_lanzarote'), 'tarjetas', `la página lista las 27 tarjetas con una de emblema por destino (${ids.length})`)

  // El registro de los fotogramas y de CUÁNDO se pide cada sonido, dentro del marco.
  const INSTALAR = `(() => { const w = ${IFR}.contentWindow; w.__reg = []; w.__t0 = null; w.__ped = []; if (w.__regVivo) return true; w.__regVivo = true; let ult = '';
    const paso = () => { const d = w.document; const raiz = d.querySelector('[data-visor-de-animacion]'); const act = raiz?.getAttribute('data-animacion-actual') || '';
      const fases = [...d.querySelectorAll('[data-pedazo-fase]')].map((e) => e.getAttribute('data-pedazo-fase'));
      const k = act + '|' + fases.join(',');
      if (k !== ult) { ult = k; if (act && w.__t0 === null) w.__t0 = w.performance.now(); w.__reg.push({ t: w.performance.now(), act, fases }) }
      w.requestAnimationFrame(paso) }
    w.requestAnimationFrame(paso); return true })()`
  await adm.evaluar(INSTALAR)
  const jugar = async (id, ms) => {
    // (Cada vez, un registro limpio de lo pedido: la lista y su método push se rehacen dentro del marco.)
    await adm.evaluar(`(() => { const w = ${IFR}.contentWindow; w.__reg.length = 0; w.__t0 = null; w.__ped = []; const lista = []; const push = lista.push.bind(lista); lista.push = (x) => { w.__ped.push([x, w.performance.now()]); return push(x) }; w.__sonidosPedidos = lista; w.__sonidosAgendados = []; return true })()`)
    await toque(adm, `[data-animacion-tarjeta="${id}"]`)
    await esperar(adm, `${IFR}.contentDocument.querySelector('[data-visor-de-animacion]')?.getAttribute('data-animacion-actual') === '${id}'`, 60)
    await adm.esp(ms)
    return J(adm, `JSON.stringify((() => { const w = ${IFR}.contentWindow; return { reg: w.__reg.map((r) => ({ t: +(r.t / 1000).toFixed(3), act: r.act, fases: r.fases })), ped: w.__ped.map(([n, t]) => [n, +(t / 1000).toFixed(3)]), agend: (w.__sonidosAgendados ?? []).map((x) => ({ p: x.partitura, id: x.id, en: x.en, prog: x.programado, st: x.semitonos ?? 0 })), cta: [...w.document.querySelectorAll('button')].filter((b) => (b.textContent || '').trim() === 'Seguir').map((b) => parseFloat(getComputedStyle(b).animationDelay)), fin: w.__finSonoro ?? null } })())`)
  }
  const fasesDe = (r, i, f) => r.reg.find((x) => x.fases[i] === String(f))?.t
  const sacar = async (archivo) => {
    await adm.evaluar("document.querySelector('[data-marco-iphone]').scrollIntoView({ block: 'center' }); true")
    await adm.esp(250)
    await adm.captura(`${CAPTURAS}/${archivo}.jpg`)
  }
  const finSonoro = await J(adm, `${IFR}.contentWindow.Function("return import('/src/lib/sonidos.ts')")().then((m) => JSON.stringify(m.finSonoroDelPedazo()))`)
  const hueco = T.huecoEntrePedazos(finSonoro)
  console.log(`   (el pedazo suena ${finSonoro.toFixed(2)} s: hueco entre insignias ${hueco.toFixed(2)} s)`)
  await jugar('pedazo', 600) // calentamiento

  for (const [id, n] of [['pedazo', 1], ['pedazo_dos', 2], ['pedazo_tres', 3]]) {
    const espera = (T.ctaDeLosPedazos(n, finSonoro) + 1.2) * 1000
    const r = await jugar(id, espera)
    informe[id] = r
    // (En desarrollo, React lo monta dos veces seguidas (StrictMode): el primer sonido de la tarjeta se pide dos veces a la vez. Se cuenta una.)
    const pedidosTodos = r.ped.filter(([nombre]) => nombre === 'pedazo')
    const dup = pedidosTodos.length >= 2 && pedidosTodos[1][1] - pedidosTodos[0][1] < 0.1 ? 1 : 0
    const pedidos = pedidosTodos.slice(dup)
    debe(pedidos.length === n, `pedazos_${n}`, `${id}: se piden ${n} sonido(s) de pedazo, uno por insignia (${pedidos.length})`)
    const clics = r.agend.filter((x) => x.p === 'pedazo' && x.id === 'clic').slice(dup)
    debe(clics.length === n, `pedazos_${n}`, `${id}: ${n} clic(s) programados, uno por insignia que encaja (${clics.length})`)
    const sts = clics.map((x) => x.st)
    debe(JSON.stringify(sts) === JSON.stringify(Array.from({ length: n }, (_, i) => Math.min(T.MAX_SEMITONOS_DE_PEDAZO, i))), `pedazos_${n}`, `${id}: cada repetición un semitono más agudo (${sts.join(',')})`)
    // Las insignias: fase 1 = empieza (a los 0,3 s de su inicio), fase 4 = acabada.
    for (let i = 0; i < n; i++) {
      const f1 = fasesDe(r, i, 1)
      const f4 = fasesDe(r, i, 4)
      debe(f1 !== undefined && f4 !== undefined, `pedazos_${n}`, `${id}: la insignia ${i + 1} pasa por todas sus fases`)
      if (i > 0 && f1 !== undefined) {
        const ant4 = fasesDe(r, i - 1, 4)
        const pedido = pedidos[i - 1]?.[1]
        const finSonidoAnterior = pedido + finSonoro
        const inicio = f1 - T.TIEMPOS_DE_PEDAZO.llega
        debe(ant4 !== undefined && inicio >= ant4 - 0.12, `pedazos_${n}`, `${id}: la insignia ${i + 1} no empieza (${inicio.toFixed(2)} s) antes de que acabe la animación de la anterior (${ant4?.toFixed(2)} s)`)
        debe(inicio >= finSonidoAnterior - 0.15, `pedazos_${n}`, `${id}: ni antes de que acabe el sonido de la anterior (${inicio.toFixed(2)} s frente a ${finSonidoAnterior.toFixed(2)} s)`)
        debe(inicio - Math.max(ant4 ?? 0, finSonidoAnterior) < 0.7, `pedazos_${n}`, `${id}: y solo con una pausa corta entre una y otra (${(inicio - Math.max(ant4 ?? 0, finSonidoAnterior)).toFixed(2)} s)`)
        // El sonido de esta insignia se pide justo para que su clic caiga cuando encaja (a los 1,2 s de su inicio).
        const clicEn = pedidos[i][1] + T.RETRASO_DEL_PEDAZO + T.TIEMPOS_DE_PEDAZO.encaja
        const encaja = fasesDe(r, i, 2)
        debe(encaja !== undefined && Math.abs(clicEn - encaja) < 0.3, `pedazos_${n}`, `${id}: el clic de la insignia ${i + 1} cae cuando encaja (${clicEn.toFixed(2)} s el sonido, ${encaja?.toFixed(2)} s el dibujo)`)
      }
    }
    // [Seguir]: sale cuando acaba la última (la animación y el sonido).
    const ultimaAcaba = fasesDe(r, n - 1, 4)
    const cta = r.cta[0]
    debe(cta !== undefined && Math.abs(cta - T.ctaDeLosPedazos(n, finSonoro)) < 0.06, `pedazos_${n}`, `${id}: [Seguir] sale a los ${cta?.toFixed(2)} s (los que pide la cuenta: ${T.ctaDeLosPedazos(n, finSonoro).toFixed(2)} s)`)
    const t0 = r.reg[0]?.t ?? 0
    debe(ultimaAcaba !== undefined && cta >= ultimaAcaba - t0 - 0.1, `pedazos_${n}`, `${id}: [Seguir] (${cta?.toFixed(2)} s) no sale antes de que acabe la última insignia (${ultimaAcaba === undefined ? '?' : (ultimaAcaba - t0).toFixed(2)} s)`)
    const sonidoUlt = (pedidos[n - 1]?.[1] ?? 0) + finSonoro - t0
    debe(cta >= sonidoUlt - T.PAUSA_ENTRE_PEDAZOS - 0.1, `pedazos_${n}`, `${id}: ni antes de que acabe el sonido de la última (${sonidoUlt.toFixed(2)} s)`)
    await sacar(`${id}_despues`)
  }

  console.log('6. El estudio: una tarjeta de emblema por destino, con «Ver otra escena»')
  await toque(adm, '[data-animacion-tarjeta="emblema"]')
  await adm.esp(1500)
  const titulo = await adm.evaluar("document.querySelector('[data-nombre-abierta]')?.textContent ?? ''")
  debe(titulo === 'Emblema de Roma', 'emblemas', `la tarjeta abierta se llama «Emblema de Roma» (${titulo})`)
  debe(await adm.evaluar("Boolean(document.querySelector('[data-otras-escenas=\"roma\"] [data-ver-escena=\"fontana_de_trevi\"]'))"), 'emblemas', 'dentro de la tarjeta hay «Ver otra escena» con la Fontana de Trevi')
  await toque(adm, '[data-ver-escena="fontana_de_trevi"]')
  const verFontana = await esperar(adm, `/Fontana/i.test(${IFR}.contentDocument.body.innerText) || /Fontana/i.test(${IFR}.contentDocument.querySelector('[role=dialog]')?.getAttribute('aria-label') ?? '')`, 80)
  debe(verFontana, 'emblemas', 'el marco enseña la escena de la Fontana de Trevi')
  debe((await adm.evaluar("document.querySelector('[data-tarjeta-abierta]')?.getAttribute('data-tarjeta-abierta')")) === 'emblema', 'emblemas', 'y sigue siendo la misma tarjeta (lo que se guarde vale para todo el destino, sin guardar aparte)')
  await adm.esp(9500)
  await sacar('fontana_emblema_roma')
  await toque(adm, '[data-animacion-tarjeta="emblema_lanzarote"]')
  await adm.esp(1500)
  debe((await adm.evaluar("document.querySelector('[data-nombre-abierta]')?.textContent ?? ''")) === 'Emblema de Lanzarote' && (await adm.evaluar("Boolean(document.querySelector('[data-otras-escenas=\"lanzarote\"] [data-ver-escena=\"jameos\"]'))")), 'emblemas', 'la tarjeta «Emblema de Lanzarote» deja ver otra escena (los Jameos)')
  await toque(adm, '[data-animacion-tarjeta="emblema_maravilla"]')
  await adm.esp(1000)
  debe((await adm.evaluar("document.querySelector('[data-nombre-abierta]')?.textContent ?? ''")) === 'Coliseo' && !(await adm.evaluar("Boolean(document.querySelector('[data-otras-escenas]'))")), 'emblemas', 'la tarjeta «Coliseo» es solo el Coliseo')
} finally {
  adm.cerrar()
}

/* ───────── 7. DÍAS → Explorar en Roma enseña los pines ───────── */
const apiViva = await fetch(`${APP}/api/destination-places`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ destination: 'Roma' }) }).then((r) => r.ok).catch(() => false)
if (!apiViva) {
  console.log('7. (SIN LA API en 8787: DÍAS → Explorar NO SE HA VERIFICADO)')
} else {
  console.log('7. DÍAS → Explorar en Roma (390 x 844)')
  const a = await abrirApp(APP, { ruta: '/?cuentas=off&logros=off&apertura=0&version=completa', ancho: 390, alto: 844 })
  const R = (js) => a.evaluar(`(async () => { const imp = (p) => { const e = performance.getEntriesByType('resource').map((r) => r.name).find((n) => n.includes(p)); return import(e ?? p) }; const R = await imp('/src/store/useRouteStore.ts'); const st = () => R.useRouteStore.getState(); ${js} })()`)
  const pines = () => a.evaluar("JSON.stringify((() => { const r = Array.from(document.querySelectorAll('[data-pin-id]')).filter((r) => !/#entrada$|^excursion-/.test(r.getAttribute('data-pin-id'))); const ids = r.map((x) => x.getAttribute('data-pin-id')); return { total: r.length, visibles: r.filter((x) => x.firstElementChild.style.opacity !== '0').length, repetidos: ids.length - new Set(ids).size } })())").then(JSON.parse)
  const soloTema = async (tema) => {
    await a.evaluar(`(() => { const b = document.querySelector('[data-tema="${tema}"]'); if (b && b.getAttribute('aria-pressed') !== 'true') b.click(); return true })()`)
    await a.esp(400)
    await a.evaluar(`(() => { for (const b of document.querySelectorAll('[data-tema]')) { if (b.getAttribute('data-tema') !== '${tema}' && b.getAttribute('aria-pressed') === 'true') b.click() } return true })()`)
  }
  try {
    await a.evaluar('window.__rutaPrueba().then(() => true)')
    await a.esp(3000)
    for (let i = 0; i < 6; i++) {
      const h = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale|Cerrar)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
      if (!h) break
      await a.esp(600)
    }
    for (const vuelta of [1, 2]) {
      await R("st().setMode('days'); return true")
      await esperar(a, "document.querySelectorAll('[data-day-id]').length > 0", 40)
      await a.esp(vuelta === 1 ? 2500 : 600)
      await R("st().setMode('explore'); return true")
      await esperar(a, "Array.from(document.querySelectorAll('button')).some((x) => /^Atracciones/.test((x.textContent || '').trim()))", 40)
      await a.evaluar("Array.from(document.querySelectorAll('button')).find((x) => /^Atracciones/.test((x.textContent || '').trim()))?.click(); true")
      await esperar(a, "document.querySelectorAll('[data-pin-id]').length > 5", 120)
      await a.esp(2500)
      let p = await pines()
      debe(p.visibles > 5, 'explorar', `vuelta ${vuelta}: DÍAS → Explorar (Atracciones) enseña los pines (${p.visibles} a la vista de ${p.total})`)
      debe(p.repetidos === 0, 'explorar', `vuelta ${vuelta}: ningún pin repetido en el mapa (${p.repetidos})`)
      await soloTema('miradores')
      await a.esp(2500)
      p = await pines()
      debe(p.visibles > 0 && p.visibles < 40, 'explorar', `vuelta ${vuelta}: con solo Miradores se ven los de Miradores (${p.visibles})`)
      if (vuelta === 1) await a.captura(`${CAPTURAS}/dias_explorar_despues.jpg`)
      await soloTema('atracciones')
      await a.esp(800)
    }
  } finally {
    a.cerrar()
  }
}

fs.writeFileSync(`${CAPTURAS}/informe.json`, JSON.stringify(informe, null, 1))
console.log(`\nPrueba de la Tanda V38B: ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
process.exit(fallos.length ? 1 : 0)
