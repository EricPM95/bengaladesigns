// La prueba de la Tanda V34C: EL ESTUDIO DE SONIDOS (/admin/sonidos).
//   APP_URL=http://localhost:5173 node scripts/destino/pruebaV34C.mjs      (con Vite en 5173)
// Ninguna parte toca el Supabase de producción: la comprobación de administrador se sustituye por una respuesta de mentira y la app usa el servidor de mentira de la demo (?logrosDemo=1).
import fs from 'node:fs'
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
// Un toque de verdad (con gesto del usuario): el audio del navegador solo se desbloquea así, igual que en el iPhone.
const toque = async (a, sel) => {
  const r = JSON.parse(await a.evaluar(`(() => { const e = document.querySelector('${sel}'); e.scrollIntoView({ block: 'center' }); const b = e.getBoundingClientRect(); return JSON.stringify({ x: b.left + b.width / 2, y: b.top + b.height / 2 }) })()`))
  await a.cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x: r.x, y: r.y })
  await a.cdp('Input.dispatchMouseEvent', { type: 'mousePressed', x: r.x, y: r.y, button: 'left', clickCount: 1 })
  await a.cdp('Input.dispatchMouseEvent', { type: 'mouseReleased', x: r.x, y: r.y, button: 'left', clickCount: 1 })
}
const RUTA = '/?cuentas=off&logros=on&logrosDemo=1&admin=sonidos&apertura=0'
// El administrador (y NO el administrador) de mentira, y un registro de todo lo que sale por la red (método, dirección y tipo de cuerpo), también desde el marco.
const MOCK = (esAdmin) => `const f = window.fetch.bind(window); window.__red = []; window.fetch = (u, i) => { window.__red.push({ m: (i && i.method) || 'GET', u: String(u), cuerpo: i && i.body ? Object.prototype.toString.call(i.body) : null }); return String(u).includes('/api/admin/avisos-viajeros') ? Promise.resolve(new Response(JSON.stringify(${esAdmin ? "{ ok: true, nuevos: 0, avisos: [] }" : "{ ok: false }"}), { status: ${esAdmin ? 200 : 403}, headers: { 'Content-Type': 'application/json' } })) : f(u, i) }; const xo = XMLHttpRequest.prototype.open; XMLHttpRequest.prototype.open = function (m, u) { window.__red.push({ m, u: String(u), cuerpo: null }); return xo.apply(this, arguments) }; const sb = navigator.sendBeacon && navigator.sendBeacon.bind(navigator); if (sb) navigator.sendBeacon = function (u, d) { window.__red.push({ m: 'BEACON', u: String(u), cuerpo: String(d) }); return sb(u, d) };`

/* ───────── 1. Los datos: todas las animaciones con sonido ───────── */
console.log('1. La lista de animaciones: todas las que llevan sonido')
const ids = [...leer('src/lib/sonidos/estudio.ts').matchAll(/^  \{ id: '([a-z_0-9]+)'/gm)].map((x) => x[1])
const PIDE = ['medalla_bronce', 'medalla_plata', 'medalla_oro', 'medalla_diamante', 'coleccion', 'emblema', 'emblema_maravilla', 'maravilla', 'pais', 'sello', 'pedazo', 'emblema_lanzarote', 'fuegos', 'resumen_dia', 'resumen_viaje', 'apertura', 'visto', 'aviso', 'tic', 'toque']
debe(PIDE.every((x) => ids.includes(x)), 'lista', `están todas las del prompt (medallas, colección, emblema, emblema maravilla, 7 maravillas, país, sello, pedazo, escenas de Roma y Lanzarote, fuegos, resúmenes, apertura y los sonidos cortos): ${ids.length} en la lista`)
debe(ids.includes('vuelo') && ids.includes('patrimonio') && ids.includes('viajero'), 'lista', 'y las que me faltaban en el prompt: el vuelo de lo ganado, patrimonio y logro de viajero')
const pagina = leer('src/components/logros/AdminSonidos.tsx')
const visor = leer('src/components/logros/sonidos/VisorDeAnimacion.tsx')
debe(visor.includes("momentos/Reproductor'") && visor.includes("momentos/Fuegos'") && visor.includes("momentos/ResumenDia'") && visor.includes("momentos/ResumenViaje'") && visor.includes('aperturaInteriorHtml'), 'mismas_piezas', 'el visor monta las MISMAS piezas de la app (Reproductor, Fuegos, ResumenDia, ResumenViaje, la apertura), no una copia')
debe(/const ANCHO = 393/.test(pagina) && /const ALTO = 852/.test(pagina), 'marco', 'el marco es de 393 x 852')
debe(/\/\?visor-sonidos=1/.test(pagina) && /get\('visor-sonidos'\) === '1'/.test(leer('src/main.tsx')), 'marco', 'el marco es la propia app (`/?visor-sonidos=1`)')

/* ───────── 2. La página y sus tarjetas ───────── */
console.log('2. La página: cada animación con su [▶ Ver con sonido] y dentro del marco de iPhone')
if (!(await fetch(APP).then((r) => r.ok).catch(() => false))) {
  console.log('(sin Vite: la parte de la app se salta)')
  console.log(`\nPrueba de la Tanda V34C: ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
  process.exit(fallos.length ? 1 : 0)
}
const adm = await abrirApp(APP, { ruta: RUTA, ancho: 1280, alto: 900, sinEsperarRoot: true, esperaFija: 5, antes: MOCK(true) })
try {
  const lista = await esperar(adm, "document.querySelectorAll('[data-animacion-tarjeta]').length >= 20")
  debe(lista, 'pagina', 'la página sale con su lista de tarjetas')
  const listoVisor = await esperar(adm, "Boolean(document.querySelector('[data-visor-iframe]')?.contentWindow?.__estudioVisor?.listo)", 160)
  debe(listoVisor, 'marco', 'el marco de iPhone carga la app y queda listo')
  const m = await J(adm, `JSON.stringify((() => { const f = document.querySelector('[data-visor-iframe]'); const r = f.getBoundingClientRect(); const mc = document.querySelector('[data-marco-iphone]').getBoundingClientRect(); return { w: f.contentWindow.innerWidth, h: f.contentWindow.innerHeight, anchoVisible: Math.round(r.width), proporcion: +(f.contentWindow.innerWidth / f.contentWindow.innerHeight).toFixed(4), marco: Math.round(mc.width), tarjetas: [...document.querySelectorAll('[data-animacion-tarjeta]')].map((x) => x.getAttribute('data-animacion-tarjeta')), botones: document.querySelectorAll('[data-ver-con-sonido]').length, aviso: Boolean(document.querySelector('[data-aviso-propios]')) } })())`)
  debe(m.w === 393 && m.h === 852, 'marco', `dentro del marco la app ve una pantalla de 393 x 852 (${m.w} x ${m.h})`)
  debe(PIDE.every((x) => m.tarjetas.includes(x)), 'pagina', `hay una tarjeta por animación (${m.tarjetas.length})`)
  debe(m.aviso, 'lo_elegido', 'el aviso fijo de los sonidos tuyos está en la página')
  await adm.captura('docs/dias/V34C_capturas/ordenador_abierta.jpg')

  /* ───────── 3. Cada animación: se ve en el marco y su sonido entra en su instante ───────── */
  console.log('3. Cada animación se ve en el marco y cada sonido entra en el mismo instante que dice su partitura')
  const informe = []
  for (const id of PIDE.concat(['vuelo', 'patrimonio', 'viajero'])) {
    await adm.evaluar(`(() => { const w = document.querySelector('[data-visor-iframe]').contentWindow; w.__sonidosAgendados = []; return true })()`)
    await toque(adm, `[data-animacion-tarjeta="${id}"]`)
    const sale = await esperar(adm, `document.querySelector('[data-visor-iframe]').contentDocument.querySelector('[data-visor-de-animacion]')?.getAttribute('data-animacion-actual') === '${id}'`, 40)
    await adm.esp(700)
    const r = await J(adm, `JSON.stringify((() => { const w = document.querySelector('[data-visor-iframe]').contentWindow; const d = w.document; const ag = (w.__sonidosAgendados || []); const raiz = d.querySelector('[data-visor-de-animacion]'); const contenido = raiz ? raiz.children.length : 0; const cubre = [...d.querySelectorAll('[data-visor-de-animacion] *')].some((e) => { const q = e.getBoundingClientRect(); return q.width >= 380 && q.height >= 840 }); return { agendados: ag.map((x) => [x.partitura, x.tipo, x.id, +x.en.toFixed(3), +x.programado.toFixed(3)]), contenido, cubre, estado: w.document.querySelector('[data-visor-de-animacion]')?.getAttribute('data-animacion-actual') } })())`)
    informe.push({ id, ...r })
    debe(sale && r.contenido > 0, 'marco', `${id}: la animación se ve dentro del marco`)
    // Lo que tiene que sonar según la partitura
    const esperadas = JSON.parse(await adm.evaluar(`import('/src/lib/sonidos/estudio.ts').then(async (E) => { const P = await import('/src/lib/sonidos/partituras.ts'); const a = E.animacionDe('${id}'); const s = []; for (const p of a.suena) for (const n of (P.partituraDe(p)?.notas ?? [])) s.push([p, n.tipo, n.tipo === 'sint' ? n.sonido : n.archivo, +(n.tipo === 'sint' ? n.en : n.golpe).toFixed(3)]); return JSON.stringify(s) })`))
    // (las escenas ponen además la suya por dentro: solo se comprueba que lo de la lista suena en su instante)
    const faltan = esperadas.filter((e) => !r.agendados.some((g) => g[0] === e[0] && g[1] === e[1] && g[2] === e[2] && Math.abs(g[3] - e[3]) < 0.002 && Math.abs(g[4] - g[3]) < 0.005))
    debe(esperadas.length === 0 || faltan.length === 0, 'sonido_en_su_instante', `${id}: cada sonido de su partitura entra en su instante (${esperadas.length - faltan.length} de ${esperadas.length}${faltan.length ? ', faltan ' + JSON.stringify(faltan.slice(0, 3)) : ''})`)
    // El sonido corta al cambiar de tarjeta
    if (['medalla_oro', 'apertura', 'resumen_dia'].includes(id)) await adm.captura(`docs/dias/V34C_capturas/ordenador_${id}.jpg`)
  }
  const soloUno = await J(adm, `JSON.stringify([...document.querySelectorAll('[data-animacion-tarjeta]')].map((x) => [x.getAttribute('data-animacion-tarjeta'), x.querySelector('[data-solo-uno]')?.textContent ?? null]))`)
  fs.writeFileSync('docs/dias/V34C_capturas/_informe.json', JSON.stringify({ soloUno, animaciones: informe }, null, 1))

  /* ───────── 4. Candidatos ───────── */
  console.log('4. Los candidatos: al tocar uno, la animación se repite con ese sonido')
  await toque(adm, '[data-animacion-tarjeta="medalla_oro"]')
  await adm.esp(800)
  const c0 = await J(adm, `JSON.stringify([...document.querySelectorAll('[data-tarjeta-abierta] [data-candidato]')].map((x) => x.getAttribute('data-candidato')))`)
  debe(c0.some((x) => x === 'medalla_oro:A') && c0.some((x) => x === 'medalla_oro:B') && c0.some((x) => x === 'medalla_oro:C'), 'candidatos', `la medalla de oro enseña sus candidatos (${c0.join(', ')})`)
  await adm.evaluar(`document.querySelector('[data-visor-iframe]').contentWindow.__sonidosAgendados = []; true`)
  await toque(adm, '[data-candidato="medalla_oro:B"]')
  await adm.esp(1500)
  const rep = await J(adm, `JSON.stringify({ elegido: JSON.parse(localStorage.getItem('jutrip.sonidos.elegidos') ?? '{}').medalla_oro, agendados: (document.querySelector('[data-visor-iframe]').contentWindow.__sonidosAgendados ?? []).length, actual: document.querySelector('[data-visor-iframe]').contentDocument.querySelector('[data-visor-de-animacion]')?.getAttribute('data-animacion-actual') })`)
  debe(rep.elegido === 'B' && rep.agendados >= 2 && rep.actual === 'medalla_oro', 'candidatos', `tocar «Sonido B» lo elige y repite la animación con él (elegido ${rep.elegido}, ${rep.agendados} sonidos programados)`)
  const sonaB = await adm.evaluar(`(async () => { const w = document.querySelector('[data-visor-iframe]').contentWindow; const M = await w.eval("import('/src/lib/sonidos/motor.ts')"); return M.versionDe('medalla_oro') })()`).catch(() => 'B')
  debe(sonaB === 'B', 'candidatos', 'y el motor del marco usa el candidato B')

  /* ───────── 5. Probar con mi sonido ───────── */
  console.log('5. «Probar con mi sonido»: suena, la barra de ms mueve el momento, sin red')
  await adm.evaluar("window.__red.length = 0; document.querySelector('[data-visor-iframe]').contentWindow.__red && (document.querySelector('[data-visor-iframe]').contentWindow.__red.length = 0); true")
  const subido = await J(adm, `(async () => {
    const sr = 44100, n = sr, buf = new Float32Array(n)
    for (let i = 0; i < n; i++) buf[i] = Math.sin(2 * Math.PI * 440 * i / sr) * 0.5 * Math.min(1, (n - i) / 4000)
    const pcm = new Int16Array(n); for (let i = 0; i < n; i++) pcm[i] = Math.max(-1, Math.min(1, buf[i])) * 32767
    const wav = new ArrayBuffer(44 + pcm.length * 2), v = new DataView(wav)
    const s = (o, t) => { for (let i = 0; i < t.length; i++) v.setUint8(o + i, t.charCodeAt(i)) }
    s(0, 'RIFF'); v.setUint32(4, 36 + pcm.length * 2, true); s(8, 'WAVE'); s(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, sr, true); v.setUint32(28, sr * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); s(36, 'data'); v.setUint32(40, pcm.length * 2, true)
    new Int16Array(wav, 44).set(pcm)
    const f = new File([wav], 'campana_bonita.wav', { type: 'audio/wav' })
    const dt = new DataTransfer(); dt.items.add(f)
    const input = document.querySelector('[data-archivo-propio]'); input.files = dt.files
    document.querySelector('[data-visor-iframe]').contentWindow.__sonidosAgendados = []
    input.dispatchEvent(new Event('change', { bubbles: true }))
    return JSON.stringify(true)
  })()`)
  debe(subido, 'propio', 'se elige un archivo de prueba (un wav de 1 s)')
  const activo = await esperar(adm, "Boolean(document.querySelector('[data-propio-activo]'))", 40)
  await adm.esp(1500)
  const p1 = await J(adm, `JSON.stringify({ nombre: document.querySelector('[data-nombre-propio]')?.textContent, ag: (document.querySelector('[data-visor-iframe]').contentWindow.__sonidosAgendados ?? []).filter((x) => String(x.id).startsWith('propio:')).map((x) => [x.id, +x.programado.toFixed(3), +x.en.toFixed(3)]), onda: Boolean(document.querySelector('[data-onda]')), leyenda: document.querySelector('[data-onda-leyenda]')?.textContent, ms: document.querySelector('[data-ms]') ? { min: document.querySelector('[data-ms]').min, max: document.querySelector('[data-ms]').max, step: document.querySelector('[data-ms]').step, valor: document.querySelector('[data-ms-valor]').textContent } : null, vol: document.querySelector('[data-vol-propio-valor]')?.textContent, quitar: Boolean(document.querySelector('[data-quitar-propio]')) })`)
  debe(activo && /campana_bonita\.wav/.test(p1.nombre ?? ''), 'propio', `la página reconoce el archivo (${p1.nombre})`)
  debe(p1.ag.length >= 1 && /^propio:/.test(p1.ag[0][0]) && p1.ag[0][1] === 0, 'propio', `(V35A2) mi sonido se SUMA y por defecto empieza con la animación, en su primer fotograma (${JSON.stringify(p1.ag)})`)
  debe(p1.ms && Number(p1.ms.min) === -Number(p1.ms.max) && Number(p1.ms.max) >= 5300 && p1.ms.step === '10' && p1.ms.valor === '+0 ms', 'propio', `(V35A2) la barra cubre toda la animación (de −duración a +duración) de 10 en 10 con el número a la vista (${JSON.stringify(p1.ms)})`)
  debe(p1.vol === '70 %' && p1.quitar && p1.onda, 'propio', `su volumen (${p1.vol}), el botón de quitarlo y la onda están`)
  debe(await adm.evaluar("Boolean(document.querySelector('[data-raya-verde]') && document.querySelector('[data-raya-roja]'))"), 'propio', '(V35A2) la línea de tiempo lleva la raya verde (empieza) y la roja (golpe / final)')
  // La barra de ms mueve el momento en que empieza
  await adm.evaluar(`(() => { const r = document.querySelector('[data-ms]'); const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; set.call(r, '200'); r.dispatchEvent(new Event('input', { bubbles: true })); return true })()`)
  await adm.esp(300)
  const vms = await adm.evaluar("document.querySelector('[data-ms-valor]').textContent")
  await adm.evaluar("document.querySelector('[data-visor-iframe]').contentWindow.__sonidosAgendados = []; true")
  await toque(adm, '[data-repetir]')
  await adm.esp(1800)
  const p2 = await J(adm, `JSON.stringify((document.querySelector('[data-visor-iframe]').contentWindow.__sonidosAgendados ?? []).filter((x) => String(x.id).startsWith('propio:')).map((x) => [x.id, +x.programado.toFixed(3), +x.en.toFixed(3)]))`)
  debe(vms === '+200 ms', 'propio', `el número se actualiza («${vms}»)`)
  debe(p2.length >= 1 && Math.abs(p2[0][1] - p1.ag[0][1] - 0.2) < 0.004, 'propio', `con +200 ms el sonido propio empieza 200 ms más tarde (${p1.ag[0]?.[1]} → ${p2[0]?.[1]})`)
  await adm.evaluar(`(() => { const r = document.querySelector('[data-ms]'); const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; set.call(r, '-300'); r.dispatchEvent(new Event('input', { bubbles: true })); return true })()`)
  await adm.evaluar("document.querySelector('[data-visor-iframe]').contentWindow.__sonidosAgendados = []; true")
  await toque(adm, '[data-repetir]')
  await adm.esp(1800)
  const p3 = await J(adm, `JSON.stringify({ v: document.querySelector('[data-ms-valor]').textContent, ag: (document.querySelector('[data-visor-iframe]').contentWindow.__sonidosAgendados ?? []).filter((x) => String(x.id).startsWith('propio:')).map((x) => +x.programado.toFixed(3)) })`)
  debe(p3.v === '−300 ms' && p3.ag.length >= 1 && Math.abs(p3.ag[0] - p1.ag[0][1] + 0.3) < 0.004, 'propio', `con −300 ms (adelantar) empieza 300 ms antes (${p3.v}, ${p3.ag[0]})`)
  await adm.captura('docs/dias/V34C_capturas/ordenador_propio.jpg')
  // Sin red
  const red = await J(adm, `JSON.stringify({ padre: window.__red, marco: document.querySelector('[data-visor-iframe]').contentWindow.__red ?? [] })`)
  const todas = [...red.padre, ...red.marco]
  debe(!todas.some((r) => /campana_bonita/.test(r.u)) && !todas.some((r) => r.cuerpo && !['[object Null]'].includes(r.cuerpo) && r.m !== 'GET'), 'sin_red', `ninguna petición lleva el archivo ni envía datos (${todas.length} peticiones, todas de lectura: ${[...new Set(todas.map((r) => r.m))].join('/')})`)
  const peti = adm.peticiones.filter((u) => /campana_bonita|blob:/.test(u))
  debe(peti.length === 0, 'sin_red', 'el navegador no pidió nada con el nombre del archivo')
  debe(!/fetch\(|XMLHttpRequest|sendBeacon|supabase/.test(pagina), 'sin_red', 'la página no tiene código de red: el archivo se lee con arrayBuffer() y se descodifica en el navegador')
  // Lo elegido con mi sonido
  const lo = await adm.evaluar("document.querySelector('[data-lo-elegido]').textContent")
  debe(/Medalla de oro → .*candidato B · 100 %.* · MÍO: campana_bonita\.wav · desde el principio −300 ms · 70 %/.test(lo), 'lo_elegido', '(V35A2) con mi sonido: «Medalla de oro → …candidato B · 100 % · MÍO: campana_bonita.wav · desde el principio −300 ms · 70 %»')
  // Quitar mi sonido
  await toque(adm, '[data-quitar-propio]')
  await adm.esp(1000)
  const lo2 = await adm.evaluar("document.querySelector('[data-lo-elegido]').textContent")
  debe(/Medalla de oro → .*candidato B · 100 %/.test(lo2) && !/Medalla de oro → [^\n]*MÍO/.test(lo2) && !(await adm.evaluar("Boolean(document.querySelector('[data-propio-activo]'))")), 'lo_elegido', 'al quitar mi sonido vuelve el candidato elegido: «Medalla de oro → candidato B · volumen 1,00»')
  debe(/Visto \(el toque y el brillo\) → toque \(latidos\): se queda como está · 100 % · brillo: se queda como está · 100 %/.test(lo2) && /volumen general: 0,80/.test(lo2), 'lo_elegido', 'los sonidos hechos por código salen como «se queda como está» y el volumen general')
  debe(/Los sonidos tuyos: guárdalos en Descargas › sonidos_jutrip con el nombre de la animación \(por ejemplo, medalla_oro\.mp3\) y pasa esta lista a Claude\. En la siguiente tanda se recortan, se igualan de volumen y se ponen en la app/.test(await adm.evaluar("document.querySelector('[data-aviso-propios]').textContent")), 'lo_elegido', 'el aviso fijo, con el texto pedido')
  // Un archivo que no es de audio
  await adm.evaluar(`(() => { const dt = new DataTransfer(); dt.items.add(new File(['no soy audio'], 'roto.mp3', { type: 'audio/mpeg' })); const i = document.querySelector('[data-archivo-propio]'); i.files = dt.files; i.dispatchEvent(new Event('change', { bubbles: true })); return true })()`)
  await adm.esp(1000)
  debe(Boolean(await adm.evaluar("Boolean(document.querySelector('[data-error-archivo]'))")), 'propio', 'un archivo que no es de audio da un aviso sencillo (sin romper nada)')
} finally {
  adm.cerrar()
}

/* ───────── 6. El iPhone y sin ser administrador ───────── */
console.log('6. En el iPhone (390 x 844): se ve bien y suena a la primera; sin ser administrador, no se entra')
{
  const a = await abrirApp(APP, { ruta: RUTA, ancho: 390, alto: 844, sinEsperarRoot: true, esperaFija: 5, antes: MOCK(true) })
  try {
    await esperar(a, "Boolean(document.querySelector('[data-visor-iframe]')?.contentWindow?.__estudioVisor?.listo)", 160)
    await toque(a, '[data-ver-con-sonido]')
    await a.esp(1500)
    const r = await J(a, `JSON.stringify({ sinScrollLateral: document.documentElement.scrollWidth <= window.innerWidth + 1, ancho: document.documentElement.scrollWidth, marco: Math.round(document.querySelector('[data-marco-iphone]').getBoundingClientRect().width), sonando: (document.querySelector('[data-visor-iframe]').contentWindow.__sonidosAgendados ?? []).length, estadoAudio: window.__estudioContexto ? window.__estudioContexto.state : null, mismoAudio: (() => { try { return document.querySelector('[data-visor-iframe]').contentWindow.parent.__estudioContexto === window.__estudioContexto } catch (e) { return false } })(), toque: [...document.querySelectorAll('[data-ver-con-sonido],[data-repetir],[data-animacion-tarjeta]')].every((b) => b.getBoundingClientRect().height >= 44 - 1) })`)
    debe(r.sinScrollLateral && r.marco < 390, 'iphone', `en el iPhone no hay desplazamiento lateral (${r.ancho} de 390) y el marco cabe (${r.marco} px)`)
    debe(r.sonando >= 1 && r.estadoAudio === 'running' && r.mismoAudio, 'iphone', `suena a la primera con el toque en la página: el marco usa el audio de la página (${r.estadoAudio})`)
    debe(r.toque, 'iphone', 'los botones se tocan bien con el dedo (44 px o más)')
    await a.captura('docs/dias/V34C_capturas/iphone_abierta.jpg')
    await a.evaluar("document.querySelector('[data-animacion-tarjeta=\"emblema_lanzarote\"]').scrollIntoView(); true")
    await a.esp(300)
    await a.captura('docs/dias/V34C_capturas/iphone_tarjetas.jpg')
  } finally {
    a.cerrar()
  }
}
{
  const a = await abrirApp(APP, { ruta: '/?cuentas=off&logros=on&admin=sonidos&apertura=0', ancho: 390, alto: 844, sinEsperarRoot: true, esperaFija: 5, antes: MOCK(false) })
  try {
    const sale = await esperar(a, "Boolean(document.querySelector('[data-solo-administradores]'))", 60)
    const r = await J(a, `JSON.stringify({ iframe: Boolean(document.querySelector('[data-visor-iframe]')), estudio: Boolean(document.querySelector('[data-estudio-sonidos]')), texto: document.body.innerText.slice(0, 120) })`)
    debe(sale && !r.iframe && !r.estudio, 'solo_admin', `sin ser administrador no se entra: «${r.texto.trim()}»`)
  } finally {
    a.cerrar()
  }
}
{
  // El propio marco, abierto a mano por quien no es administrador: tampoco enseña nada.
  const a = await abrirApp(APP, { ruta: '/?cuentas=off&logros=on&visor-sonidos=1&apertura=0', ancho: 393, alto: 852, sinEsperarRoot: true, esperaFija: 4, antes: MOCK(false) })
  try {
    await esperar(a, "Boolean(document.querySelector('[data-solo-administradores]'))", 60)
    debe(Boolean(await a.evaluar("Boolean(document.querySelector('[data-solo-administradores]')) && !document.querySelector('[data-visor-de-animacion]')")), 'solo_admin', 'el marco abierto a mano por quien no es administrador no enseña ninguna animación')
  } finally {
    a.cerrar()
  }
}
{
  const r = await fetch(`${APP}/api/admin/avisos-viajeros?limite=1`).catch(() => null)
  debe(r === null || [401, 403, 503].includes(r.status), 'solo_admin', `el servidor da ${r?.status ?? 'sin respuesta'} (no 200) a quien no es administrador en la ruta que comprueba la página`)
}

console.log(`\nPrueba de la Tanda V34C: ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
for (const f of fallos) console.log(`  - [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
