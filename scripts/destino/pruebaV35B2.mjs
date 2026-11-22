// La prueba de la Tanda V35B2: EL ESTUDIO DE SONIDOS, MEJORADO (/admin/sonidos): mover los sonidos de Code (barra de ms, «Empieza…», [Volver a su sitio], arrastrar en la línea de tiempo), añadir sonidos de Code de OTRAS animaciones,
// «Lo elegido» con dónde está cada sonido, [Guardar] (IndexedDB de este navegador, con los archivos de Eric enteros), «Sin guardar», [Eliminar lo guardado], [Descargar todo lo guardado] y [Cargar un zip]. Nada sale del navegador.
//   APP_URL=http://localhost:5173 node scripts/destino/pruebaV35B2.mjs      (con Vite en 5173)
// Ninguna parte toca el Supabase de producción: el administrador es de mentira y la app usa el servidor de mentira de la demo (?logrosDemo=1).
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
const toque = async (a, sel) => {
  const r = JSON.parse(await a.evaluar(`(() => { const e = document.querySelector('${sel}'); e.scrollIntoView({ block: 'center' }); const b = e.getBoundingClientRect(); return JSON.stringify({ x: b.left + b.width / 2, y: b.top + b.height / 2 }) })()`))
  await a.cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x: r.x, y: r.y })
  await a.cdp('Input.dispatchMouseEvent', { type: 'mousePressed', x: r.x, y: r.y, button: 'left', clickCount: 1 })
  await a.cdp('Input.dispatchMouseEvent', { type: 'mouseReleased', x: r.x, y: r.y, button: 'left', clickCount: 1 })
}
const RUTA = '/?cuentas=off&logros=on&logrosDemo=1&admin=sonidos&apertura=0'
// El administrador de mentira, y un registro de TODO lo que sale por la red (método, dirección y si lleva cuerpo).
const MOCK = "const f = window.fetch.bind(window); window.__red = []; window.fetch = (u, i) => { window.__red.push({ m: (i && i.method) || 'GET', u: String(u), cuerpo: i && i.body ? Object.prototype.toString.call(i.body) : null }); return String(u).includes('/api/admin/avisos-viajeros') ? Promise.resolve(new Response(JSON.stringify({ ok: true, nuevos: 0, avisos: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } })) : f(u, i) }; const xo = XMLHttpRequest.prototype.open; XMLHttpRequest.prototype.open = function (m, u) { window.__red.push({ m, u: String(u), cuerpo: null }); return xo.apply(this, arguments) }; const sb = navigator.sendBeacon && navigator.sendBeacon.bind(navigator); if (sb) navigator.sendBeacon = function (u, d) { window.__red.push({ m: 'BEACON', u: String(u), cuerpo: String(d) }); return sb(u, d) };"

/* ───────── 1. El código ───────── */
console.log('1. El código')
const pagina = leer('src/components/logros/AdminSonidos.tsx')
debe(/indexedDB/.test(leer('src/lib/sonidos/estudioGuardado.ts')) && !/fetch\(|XMLHttpRequest|sendBeacon|supabase/.test(pagina + leer('src/lib/sonidos/estudioGuardado.ts') + leer('src/lib/sonidos/zip.ts')), 'privado', 'lo guardado va a IndexedDB y ni la página ni el zip tienen código de red')
debe(/data-guardar/.test(pagina) && /data-eliminar-guardado/.test(pagina) && /data-descargar-todo/.test(pagina) && /data-cargar-zip/.test(pagina) && /data-anadir-de-code/.test(pagina) && /beforeunload/.test(pagina), 'pantalla', 'la página tiene [Guardar], [Eliminar lo guardado], [Descargar todo lo guardado], [Cargar un zip], [+ Añadir un sonido de Code] y el aviso al salir')

if (!(await fetch(APP).then((r) => r.ok).catch(() => false))) {
  console.log('(sin Vite: la parte de la pantalla se salta)')
  console.log(`\nPrueba de la Tanda V35B2: ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
  process.exit(fallos.length ? 1 : 0)
}

const adm = await abrirApp(APP, { ruta: RUTA, ancho: 1280, alto: 1000, sinEsperarRoot: true, esperaFija: 5, antes: MOCK })
const ag = (a) => J(a, `JSON.stringify((document.querySelector('[data-visor-iframe]').contentWindow.__sonidosAgendados ?? []).map((x) => ({ id: x.id, en: x.en, p: x.programado, t0: x.t0, t: x.t, recorte: x.recorte })))`)
const limpiar = (a) => a.evaluar("document.querySelector('[data-visor-iframe]').contentWindow.__sonidosAgendados = []; true")
const poner = (a, sel, valor, n = 0) => a.evaluar(`(() => { const r = document.querySelectorAll('${sel}')[${n}]; const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; set.call(r, '${valor}'); r.dispatchEvent(new Event('input', { bubbles: true })); return true })()`)
const repetir = async (a, ms = 2800) => {
  await limpiar(a)
  await toque(a, '[data-ver-con-sonido]')
  await a.esp(ms)
  return ag(a)
}
const subir = (a, nombre) =>
  a.evaluar(`(() => {
    const sr = 44100, n = sr, buf = new Float32Array(n)
    for (let i = 0; i < n; i++) buf[i] = Math.sin(2 * Math.PI * 440 * i / sr) * 0.5 * Math.min(1, (n - i) / 4000)
    const pcm = new Int16Array(n); for (let i = 0; i < n; i++) pcm[i] = Math.max(-1, Math.min(1, buf[i])) * 32767
    const wav = new ArrayBuffer(44 + pcm.length * 2), v = new DataView(wav)
    const s = (o, t) => { for (let i = 0; i < t.length; i++) v.setUint8(o + i, t.charCodeAt(i)) }
    s(0, 'RIFF'); v.setUint32(4, 36 + pcm.length * 2, true); s(8, 'WAVE'); s(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, sr, true); v.setUint32(28, sr * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); s(36, 'data'); v.setUint32(40, pcm.length * 2, true)
    new Int16Array(wav, 44).set(pcm)
    const dt = new DataTransfer(); dt.items.add(new File([wav], '${nombre}', { type: 'audio/wav' }))
    const input = document.querySelector('[data-archivo-propio]'); input.files = dt.files
    input.dispatchEvent(new Event('change', { bubbles: true }))
    return true
  })()`)
const propios = (l) => l.filter((x) => String(x.id).startsWith('propio:'))
const delGolpe = (l) => l.find((x) => x.id === 'medalla_bronce')
const listoVisor = (a) => esperar(a, "Boolean(document.querySelector('[data-visor-iframe]')?.contentWindow?.__estudioVisor?.listo)", 160)
const FILA = '[data-sonido-clave="archivo:medalla_bronce"]'

try {
  debe(await esperar(adm, "document.querySelectorAll('[data-animacion-tarjeta]').length >= 20"), 'pagina', 'la página sale con su lista')
  debe(await listoVisor(adm), 'marco', 'el marco carga y queda listo')
  await toque(adm, '[data-animacion-tarjeta="medalla_bronce"]')
  await adm.esp(3000)

  console.log('2. Mover un sonido de Code: +500 ms, −300 ms sin recortar y [Volver a su sitio]')
  const base = delGolpe(await ag(adm))
  debe(Boolean(base) && Math.abs(base.p - base.en) < 0.005, 'mover', 'sin mover, el golpe suena en su sitio de siempre')
  const antesPos = await adm.evaluar("parseFloat(document.querySelector('[data-fila-de-tiempo=\"archivo:medalla_bronce\"] [data-trozo]').style.left)")
  await poner(adm, `${FILA} [data-code-ms]`, '500')
  await adm.esp(300)
  const a1 = delGolpe(await repetir(adm))
  debe(a1 && Math.abs(a1.p - a1.en - 0.5) < 0.02, 'mover', `+500 ms: el golpe se programa 500 ms después (${a1 ? ((a1.p - a1.en) * 1000).toFixed(0) : '?'} ms)`)
  const despuesPos = await adm.evaluar("parseFloat(document.querySelector('[data-fila-de-tiempo=\"archivo:medalla_bronce\"] [data-trozo]').style.left)")
  debe(despuesPos > antesPos, 'linea', `y en la línea de tiempo el trozo se ha movido a la derecha (${antesPos.toFixed(1)} % → ${despuesPos.toFixed(1)} %)`)
  debe((await adm.evaluar(`document.querySelector('${FILA}').getAttribute('data-movido')`)) === '1', 'mover', 'la fila queda marcada como movida')
  await poner(adm, `${FILA} [data-code-ms]`, '-5000')
  await adm.esp(300)
  const a2 = delGolpe(await repetir(adm, 4200))
  const espera = await adm.evaluar("document.querySelector('[data-visor-iframe]').contentWindow.__esperaDeLaAnimacion")
  debe(a2 && Math.abs(a2.p - a2.en + 5) < 0.02, 'mover', `−5000 ms: el golpe se programa 5 s antes (${a2 ? ((a2.p - a2.en) * 1000).toFixed(0) : '?'} ms)`)
  debe(espera > 0.3 && espera <= 5.0, 'mover', `y, como empieza antes del primer fotograma, la animación espera (${espera} s) para que no se recorte nada`)
  const barra = await J(adm, `JSON.stringify({ min: document.querySelector('${FILA} [data-code-ms]').min, max: document.querySelector('${FILA} [data-code-ms]').max, step: document.querySelector('${FILA} [data-code-ms]').step, botones: ['menos100', 'menos', 'cero', 'mas', 'mas100'].map((b) => Boolean(document.querySelector('${FILA} [data-code-ms-' + b + ']'))), opciones: [...document.querySelectorAll('${FILA} [data-code-empieza]')].map((x) => x.getAttribute('data-code-empieza')), volver: Boolean(document.querySelector('${FILA} [data-code-volver-a-su-sitio]')) })`)
  debe(Number(barra.min) === -Number(barra.max) && Number(barra.max) >= 5300 && barra.step === '10' && barra.botones.every(Boolean), 'mover', `la barra cubre toda la animación (±${barra.max} ms, de 10 en 10) con −100 / −10 / 0 / +10 / +100`)
  debe(barra.opciones.join() === 'sitio,principio,golpe' && barra.volver, 'mover', '«Empieza»: donde está ahora (por defecto), al empezar la animación o en el golpe; y [Volver a su sitio]')
  debe((await adm.evaluar(`document.querySelector('${FILA} [data-code-empieza="sitio"]').getAttribute('aria-pressed')`)) === 'true', 'mover', '«Donde está ahora» viene marcado por defecto (0 ms = su sitio de siempre)')
  let lo = await adm.evaluar("document.querySelector('[data-lo-elegido]').textContent")
  debe(/Medalla de bronce → .*golpe de la medalla de bronce: candidato [A-E] · movido −5000 ms · \d+ %/.test(lo), 'lo_elegido', '«Lo elegido» dice «golpe: candidato B · movido −5000 ms · 80 %»')
  await adm.captura('docs/dias/V35B2_capturas/despues_mover_code.jpg')
  await limpiar(adm)
  await toque(adm, `${FILA} [data-code-volver-a-su-sitio]`)
  await adm.esp(2800)
  const a3 = delGolpe(await ag(adm))
  debe(a3 && Math.abs(a3.p - a3.en) < 0.005 && (await adm.evaluar(`document.querySelector('${FILA}').getAttribute('data-movido')`)) === '0' && (await adm.evaluar(`document.querySelector('${FILA} [data-code-ms-valor]').textContent`)) === '+0 ms', 'volver', '[Volver a su sitio] lo devuelve a donde suena de siempre')

  console.log('3. Arrastrar con el ratón en la línea de tiempo')
  const redoble = '[data-fila-de-tiempo="archivo:redoble"] [data-trozo]'
  const cen = await J(adm, `JSON.stringify((() => { const e = document.querySelector('${redoble}'); e.scrollIntoView({ block: 'center' }); const b = e.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 } })())`)
  await adm.cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x: cen.x, y: cen.y })
  await adm.cdp('Input.dispatchMouseEvent', { type: 'mousePressed', x: cen.x, y: cen.y, button: 'left', clickCount: 1 })
  for (let k = 1; k <= 8; k++) await adm.cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x: cen.x + k * 12, y: cen.y, buttons: 1 })
  await adm.cdp('Input.dispatchMouseEvent', { type: 'mouseReleased', x: cen.x + 96, y: cen.y, button: 'left', clickCount: 1 })
  await adm.esp(400)
  const arr = await adm.evaluar("document.querySelector('[data-sonido-clave=\"archivo:redoble\"] [data-code-ms-valor]').textContent")
  debe(/^\+[1-9]\d*0 ms$/.test(arr), 'arrastrar', `arrastrar el trozo del redoble hacia la derecha lo mueve (${arr})`)
  await toque(adm, '[data-sonido-clave="archivo:redoble"] [data-code-volver-a-su-sitio]')

  console.log('4. Añadir un sonido de Code de otra animación')
  await toque(adm, '[data-anadir-de-code]')
  debe(await esperar(adm, "Boolean(document.querySelector('[data-selector-de-code]'))", 20), 'anadir', '[+ Añadir un sonido de Code] abre la lista')
  const total = await adm.evaluar("document.querySelectorAll('[data-candidato-de-code]').length")
  debe(total > 20, 'anadir', `la lista trae TODOS los candidatos de todas las animaciones (${total})`)
  await adm.evaluar(`(() => { const e = document.querySelector('[data-buscar-candidato]'); const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; set.call(e, 'emblema'); e.dispatchEvent(new Event('input', { bubbles: true })); return true })()`)
  await adm.esp(300)
  const filtrados = await J(adm, `JSON.stringify([...document.querySelectorAll('[data-candidato-de-code]')].map((e) => e.getAttribute('data-candidato-de-code')))`)
  debe(filtrados.length > 0 && filtrados.length < total && filtrados.includes('emblema:C'), 'anadir', `el buscador filtra («emblema»: ${filtrados.length})`)
  debe(await adm.evaluar("Boolean(document.querySelector('[data-probar-candidato=\"emblema:C\"]'))"), 'anadir', 'cada candidato lleva su ▶ para oírlo')
  await toque(adm, '[data-probar-candidato="emblema:C"]')
  await toque(adm, '[data-anadir-candidato="emblema:C"]')
  debe(await esperar(adm, "Boolean(document.querySelector('[data-capa-anadida]'))", 40), 'anadir', 'el elegido se suma como una capa más')
  const capa = await J(adm, `JSON.stringify({ nombre: document.querySelector('[data-nombre-anadida]').textContent, opciones: [...document.querySelectorAll('[data-capa-anadida] [data-anadida-empieza]')].map((x) => x.getAttribute('data-anadida-empieza')), vol: Boolean(document.querySelector('[data-anadida-vol]')), quitar: Boolean(document.querySelector('[data-quitar-anadida]')), ms: Boolean(document.querySelector('[data-anadida-ms]')) })`)
  debe(/Emblema de Roma · golpe del emblema · C/.test(capa.nombre) && capa.vol && capa.quitar && capa.ms && capa.opciones.join() === 'principio,golpe', 'anadir', `con su nombre («${capa.nombre}»), su volumen, su barra de ms, su «Empieza…» y [Quitar]`)
  await poner(adm, '[data-capa-anadida] [data-anadida-ms]', '1200')
  await adm.esp(300)
  await poner(adm, '[data-capa-anadida] [data-anadida-vol]', '0.6')
  await adm.esp(300)
  const a4 = await repetir(adm, 3000)
  const an = propios(a4)
  debe(an.length === 1 && Math.abs(an[0].t - an[0].t0 - 1.2) < 0.02, 'anadir', `suena en su sitio: 1200 ms después del primer fotograma (${an[0] ? ((an[0].t - an[0].t0) * 1000).toFixed(0) : '?'} ms)`)
  debe(a4.some((x) => x.id === 'medalla_bronce') && a4.some((x) => x.id === 'redoble'), 'anadir', 'y suena junto con los de Code de esta animación')
  const linea = await J(adm, `JSON.stringify([...document.querySelectorAll('[data-fila-de-tiempo]')].map((x) => x.getAttribute('data-fila-de-tiempo')))`)
  debe(linea.some((c) => c.startsWith('anadido:')), 'linea', `la capa añadida sale en la línea de tiempo (${linea.join(', ')})`)

  console.log('5. Un sonido de Eric y «Lo elegido» lo apunta todo')
  await subir(adm, 'mi_sonido.wav')
  debe(await esperar(adm, "document.querySelectorAll('[data-propio-activo]').length === 1"), 'eric', 'se añade un sonido de Eric')
  await adm.esp(2500)
  await poner(adm, `${FILA} [data-code-ms]`, '-300')
  await adm.esp(300)
  lo = await adm.evaluar("document.querySelector('[data-lo-elegido]').textContent")
  const bronce = lo.split('\n').find((l) => /^Medalla de bronce/.test(l)) ?? ''
  debe(/movido −300 ms/.test(bronce) && /añadido: Emblema de Roma · golpe del emblema · C · desde el principio \+1200 ms · 60 %/.test(bronce) && /MÍO: mi_sonido\.wav · desde el principio \+0 ms · 70 %/.test(bronce), 'lo_elegido', `«Lo elegido» lo apunta todo («${bronce.slice(0, 260)}»)`)
  const redBronce = await adm.evaluar("document.querySelector('[data-sonido-clave=\"archivo:redoble\"] [data-volumen-candidato-valor]').textContent")
  await adm.captura('docs/dias/V35B2_capturas/despues_capas.jpg')

  console.log('6. [Guardar], «Sin guardar» y el aviso al salir')
  debe(await adm.evaluar("Boolean(document.querySelector('[data-sin-guardar]')) && Boolean(document.querySelector('[data-animacion-tarjeta=\"medalla_bronce\"] [data-tarjeta-sin-guardar]'))"), 'guardar', 'con cambios, la tarjeta dice «Sin guardar» (la abierta y la de la lista)')
  const aviso = await adm.evaluar("(() => { const ev = new Event('beforeunload', { cancelable: true }); window.dispatchEvent(ev); return ev.defaultPrevented })()")
  debe(aviso === true, 'guardar', 'y al salir de la página el navegador avisa')
  await toque(adm, '[data-guardar]')
  debe(await esperar(adm, "/Guardado ✓ · \\d\\d:\\d\\d/.test(document.querySelector('[data-estado-guardado]')?.textContent ?? '')", 40), 'guardar', '[Guardar] deja «Guardado ✓ · 00:25» (con la hora)')
  const trasGuardar = await J(adm, `JSON.stringify({ sin: Boolean(document.querySelector('[data-sin-guardar]')), aviso: (() => { const ev = new Event('beforeunload', { cancelable: true }); window.dispatchEvent(ev); return ev.defaultPrevented })() })`)
  debe(trasGuardar.sin === false && trasGuardar.aviso === false, 'guardar', 'ya no dice «Sin guardar» y el navegador ya no avisa al salir')
  await poner(adm, '[data-propio-activo] [data-ms]', '120')
  await adm.esp(300)
  debe(await adm.evaluar("Boolean(document.querySelector('[data-sin-guardar]'))"), 'guardar', 'un cambio nuevo vuelve a decir «Sin guardar»')
  await poner(adm, '[data-propio-activo] [data-ms]', '0')
  await adm.esp(300)
  debe(!(await adm.evaluar("Boolean(document.querySelector('[data-sin-guardar]'))")), 'guardar', 'y deshacerlo a mano lo deja otra vez como lo guardado')
  await toque(adm, '[data-guardar]') // (por si acaso)
  await adm.esp(500)

  console.log('7. Recargar la página: todo sigue igual, con su archivo y sonando')
  await adm.evaluar('location.reload(); true')
  await adm.esp(2500)
  debe(await listoVisor(adm), 'recargar', 'la página vuelve a abrir')
  debe(await esperar(adm, "Boolean(document.querySelector('[data-estado-guardado]'))", 60), 'recargar', 'la animación sale «Guardada» al abrir otra vez')
  const tras = await J(adm, `JSON.stringify({ eric: [...document.querySelectorAll('[data-nombre-propio]')].map((x) => x.textContent), anadidas: document.querySelectorAll('[data-capa-anadida]').length, ms: document.querySelector('${FILA} [data-code-ms-valor]').textContent, movido: document.querySelector('${FILA}').getAttribute('data-movido'), vol: document.querySelector('[data-capa-anadida] [data-anadida-vol-valor]').textContent, ms2: document.querySelector('[data-capa-anadida] [data-anadida-ms-valor]').textContent, sin: Boolean(document.querySelector('[data-sin-guardar]')) })`)
  debe(tras.eric.length === 1 && /mi_sonido\.wav/.test(tras.eric[0]) && tras.anadidas === 1 && tras.ms === '−300 ms' && tras.movido === '1' && tras.vol === '60 %' && tras.ms2 === '+1200 ms' && tras.sin === false, 'recargar', `todo sigue como se guardó (${JSON.stringify(tras)})`)
  const a5 = await repetir(adm, 3400)
  const p5 = propios(a5)
  debe(p5.length === 2 && p5.every((x) => x.recorte < 0.02) && a5.some((x) => x.id === 'medalla_bronce'), 'recargar', `y suena con su archivo entero y los de Code (${a5.map((x) => x.id).join(', ')})`)
  await adm.captura('docs/dias/V35B2_capturas/despues_recargado.jpg')

  console.log('8. El zip: la lista, los archivos y estudio.json con los datos exactos')
  await toque(adm, '[data-descargar-todo]')
  debe(await esperar(adm, 'Boolean(window.__estudioZip)', 40), 'zip', '[Descargar todo lo guardado] hace el zip')
  const zip = await J(adm, `import('/src/lib/sonidos/zip.ts').then(async (Z) => { const e = await Z.leerZip(window.__estudioZip); const d = new TextDecoder(); const est = JSON.parse(d.decode(e.find((x) => x.nombre === 'estudio.json').datos)); return JSON.stringify({ nombres: e.map((x) => x.nombre), lista: d.decode(e.find((x) => x.nombre === 'LO_ELEGIDO.txt').datos), est, bytesArchivo: e.find((x) => /^medalla_bronce_1\\./.test(x.nombre))?.datos.length }) })`)
  debe(zip.nombres.includes('LO_ELEGIDO.txt') && zip.nombres.includes('estudio.json') && zip.nombres.includes('medalla_bronce_1.wav'), 'zip', `el zip lleva LO_ELEGIDO.txt, estudio.json y el archivo de Eric con el nombre de su animación (${zip.nombres.join(', ')})`)
  debe(zip.bytesArchivo === 44 + 44100 * 2, 'zip', `el archivo de Eric va ENTERO (${zip.bytesArchivo} bytes)`)
  debe(/Medalla de bronce → /.test(zip.lista) && /movido −300 ms/.test(zip.lista) && /añadido: /.test(zip.lista), 'zip', 'la lista para leer es la de «Lo elegido»')
  const mb = zip.est.animaciones.medalla_bronce
  const golpeJson = mb.sonidos_de_code.find((x) => x.clave === 'archivo:medalla_bronce')
  debe(zip.est.version === 1 && golpeJson && golpeJson.ms === -300 && golpeJson.empieza === 'sitio' && golpeJson.silenciado === false && /^[A-E]$/.test(golpeJson.version), 'zip', `estudio.json: el golpe con su versión, silenciado, volumen, ms y desde dónde cuenta (${JSON.stringify(golpeJson)})`)
  const capaCode = mb.capas.find((c) => c.origen === 'code')
  const capaArchivo = mb.capas.find((c) => c.origen === 'archivo')
  debe(capaCode && capaCode.sonido === 'emblema' && capaCode.version === 'C' && capaCode.ms === 1200 && capaCode.volumen === 0.6 && capaCode.empieza === 'principio' && capaArchivo && capaArchivo.archivo === 'medalla_bronce_1.wav' && capaArchivo.nombre === 'mi_sonido.wav', 'zip', 'y las capas: la de Code (id y versión) y la de Eric (su archivo)')
  const zipBytes = await adm.evaluar('Array.from(window.__estudioZip).join(",")')
  // El script de la tanda siguiente lee EXACTAMENTE este zip (en seco: no escribe nada).
  {
    const { execFileSync } = await import('node:child_process')
    const os = await import('node:os')
    const path = await import('node:path')
    const carpeta = fs.mkdtempSync(path.join(os.tmpdir(), 'estudio-'))
    const archivo = path.join(carpeta, 'sonidos_jutrip.zip')
    fs.writeFileSync(archivo, Buffer.from(zipBytes.split(',').map(Number)))
    let salida = ''
    let codigo = 0
    try {
      salida = execFileSync('node', ['scripts/sonidos/aplicarEstudio.mjs', archivo], { encoding: 'utf8' })
    } catch (e) {
      codigo = e.status ?? 1
      salida = String(e.stdout ?? '') + String(e.stderr ?? '')
    }
    fs.rmSync(carpeta, { recursive: true, force: true })
    debe(codigo === 0 && /medalla_bronce/.test(salida) && /-?300|−300/.test(salida), 'aplicar', `aplicarEstudio.mjs lee el zip del estudio sin quejarse y enseña lo que suena (código ${codigo}: ${salida.split('\n').slice(0, 2).join(' | ').slice(0, 160)})`)
  }

  console.log('9. [Eliminar lo guardado] y [Cargar un zip]')
  await toque(adm, '[data-eliminar-guardado]')
  debe(await esperar(adm, "Boolean(document.querySelector('[data-confirmar-borrar]'))", 20), 'eliminar', '[Eliminar lo guardado] pide confirmación')
  const pregunta = await adm.evaluar("document.querySelector('[data-confirmar-borrar]').textContent")
  debe(/¿Borrar lo guardado de Medalla de bronce\?/.test(pregunta), 'eliminar', `con la pregunta «¿Borrar lo guardado de Medalla de bronce?»`)
  await toque(adm, '[data-borrar-no]')
  await adm.esp(300)
  debe(await adm.evaluar("Boolean(document.querySelector('[data-estado-guardado]')) && !document.querySelector('[data-confirmar-borrar]')"), 'eliminar', 'con «No» se queda como estaba')
  await toque(adm, '[data-eliminar-guardado]')
  await toque(adm, '[data-borrar-si]')
  await adm.esp(1500)
  const vacio = await J(adm, `JSON.stringify({ capas: document.querySelectorAll('[data-propio-activo], [data-capa-anadida]').length, movido: document.querySelector('${FILA}').getAttribute('data-movido'), guardado: Boolean(document.querySelector('[data-estado-guardado]')), sin: Boolean(document.querySelector('[data-sin-guardar]')), enBd: null })`)
  debe(vacio.capas === 0 && vacio.movido === '0' && vacio.guardado === false && vacio.sin === false, 'eliminar', 'con «Sí, borrar» vuelve a lo de Code: sin capas, sin movimientos y sin «Guardado»')
  const quedan = await adm.evaluar(`new Promise((ok) => { const r = indexedDB.open('jutrip-estudio-sonidos', 1); r.onsuccess = () => { const t = r.result.transaction('animaciones').objectStore('animaciones').count(); t.onsuccess = () => ok(t.result) }; r.onerror = () => ok(-1) })`)
  debe(quedan === 0, 'eliminar', 'y en el navegador ya no queda nada guardado')
  // Cargar el zip
  await adm.evaluar(`(() => { const bytes = new Uint8Array([${zipBytes}]); const dt = new DataTransfer(); dt.items.add(new File([bytes], 'sonidos_jutrip.zip', { type: 'application/zip' })); const i = document.querySelector('[data-cargar-zip]'); i.files = dt.files; i.dispatchEvent(new Event('change', { bubbles: true })); return true })()`)
  debe(await esperar(adm, "/Cargado: 1 animación/.test(document.querySelector('[data-aviso-guardado]')?.textContent ?? '')", 60), 'cargar', '[Cargar un zip] lo abre y lo dice')
  await adm.esp(800)
  const cargado = await J(adm, `JSON.stringify({ eric: [...document.querySelectorAll('[data-nombre-propio]')].map((x) => x.textContent), anadidas: document.querySelectorAll('[data-capa-anadida]').length, ms: document.querySelector('${FILA} [data-code-ms-valor]').textContent, vol: document.querySelector('[data-capa-anadida] [data-anadida-vol-valor]').textContent, ms2: document.querySelector('[data-capa-anadida] [data-anadida-ms-valor]').textContent, guardado: Boolean(document.querySelector('[data-estado-guardado]')) })`)
  debe(cargado.eric.length === 1 && /mi_sonido\.wav/.test(cargado.eric[0]) && cargado.anadidas === 1 && cargado.ms === '−300 ms' && cargado.vol === '60 %' && cargado.ms2 === '+1200 ms' && cargado.guardado === true, 'cargar', `lo deja igual que estaba (${JSON.stringify(cargado)})`)
  const a6 = await repetir(adm, 3400)
  debe(propios(a6).length === 2 && a6.some((x) => x.id === 'medalla_bronce'), 'cargar', 'y suena con su archivo')
  // Un archivo que no es un zip
  await adm.evaluar(`(() => { const dt = new DataTransfer(); dt.items.add(new File(['no soy un zip'], 'roto.zip', { type: 'application/zip' })); const i = document.querySelector('[data-cargar-zip]'); i.files = dt.files; i.dispatchEvent(new Event('change', { bubbles: true })); return true })()`)
  debe(await esperar(adm, "/no es un zip|zip/i.test(document.querySelector('[data-aviso-guardado]')?.textContent ?? '') && !/Cargado/.test(document.querySelector('[data-aviso-guardado]')?.textContent ?? '')", 40), 'cargar', 'un archivo que no es un zip da un aviso sencillo y no rompe nada')

  console.log('10. Nada sale del navegador')
  const red = await J(adm, 'JSON.stringify(window.__red)')
  const sospechosas = red.filter((r) => r.m !== 'GET' || /mi_sonido|blob:|sonidos_jutrip|\.zip/.test(r.u))
  debe(sospechosas.length === 0, 'privado', `ninguna petición envía datos ni nombra los archivos (${red.length} peticiones, todas de lectura)`)
  const peti = adm.peticiones.filter((u) => /mi_sonido|sonidos_jutrip/.test(u))
  debe(peti.length === 0, 'privado', 'el navegador no pidió nada con el nombre de los archivos')
} finally {
  adm.cerrar()
}

console.log('11. Si el navegador no deja guardar, lo dice claro')
{
  const a = await abrirApp(APP, { ruta: RUTA, ancho: 1280, alto: 900, sinEsperarRoot: true, esperaFija: 5, antes: MOCK + "try { Object.defineProperty(window, 'indexedDB', { value: undefined, configurable: true }) } catch (e) {}" })
  try {
    debe(await esperar(a, "Boolean(document.querySelector('[data-aviso-sin-almacen]'))", 80), 'privado', 'sin IndexedDB (modo privado) sale el aviso')
    const t = await a.evaluar("document.querySelector('[data-aviso-sin-almacen]')?.textContent ?? ''")
    debe(/no deja guardar/.test(t) && /modo privado/.test(t), 'privado', `y dice qué pasa (${t.slice(0, 80)}…)`)
  } finally {
    a.cerrar()
  }
}

console.log(`\nPrueba de la Tanda V35B2: ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
process.exit(fallos.length ? 1 : 0)
