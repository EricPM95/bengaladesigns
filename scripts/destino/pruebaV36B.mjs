// La prueba de la Tanda V36B: EDITAR CADA SONIDO en el estudio de sonidos (/admin/sonidos): recortar, fundidos, tono (velocidad), quitar graves, brillo, eco e igualar volumen; [Deshacer] y [Volver al original]; el .wav del zip suena
// igual que en el estudio; Guardar y recargar conserva los retoques; nada sale del navegador.
//   APP_URL=http://localhost:5173 node scripts/destino/pruebaV36B.mjs      (con Vite en 5173)
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
const MOCK = "const f = window.fetch.bind(window); window.__red = []; window.fetch = (u, i) => { window.__red.push({ m: (i && i.method) || 'GET', u: String(u), cuerpo: i && i.body ? Object.prototype.toString.call(i.body) : null }); return String(u).includes('/api/admin/avisos-viajeros') ? Promise.resolve(new Response(JSON.stringify({ ok: true, nuevos: 0, avisos: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } })) : f(u, i) }; const xo = XMLHttpRequest.prototype.open; XMLHttpRequest.prototype.open = function (m, u) { window.__red.push({ m, u: String(u), cuerpo: null }); return xo.apply(this, arguments) }; const sb = navigator.sendBeacon && navigator.sendBeacon.bind(navigator); if (sb) navigator.sendBeacon = function (u, d) { window.__red.push({ m: 'BEACON', u: String(u), cuerpo: String(d) }); return sb(u, d) };"

/* ───────── 1. El código ───────── */
console.log('1. El código')
const editar = leer('src/lib/sonidos/editar.ts')
const pagina = leer('src/components/logros/AdminSonidos.tsx') + leer('src/components/logros/sonidos/EditorDeSonido.tsx')
debe(/OfflineAudioContext/.test(editar) && !/fetch\(|XMLHttpRequest|sendBeacon|supabase/.test(editar + pagina + leer('src/lib/sonidos/estudioGuardado.ts')), 'privado', 'los retoques se hacen con OfflineAudioContext en el navegador, sin código de red')
debe(/data-editar-capa/.test(pagina) && /data-editar-code/.test(pagina) && /data-editor-deshacer/.test(pagina) && /data-editor-original/.test(pagina) && /data-editor-repetir/.test(pagina) && /data-atajo/.test(pagina), 'pantalla', 'cada capa y cada sonido de Code tienen [Editar], con [Deshacer], [Volver al original], «Repetir al cambiar» y atajos de un toque')

if (!(await fetch(APP).then((r) => r.ok).catch(() => false))) {
  console.log('(sin Vite: la parte de la pantalla se salta)')
  console.log(`\nPrueba de la Tanda V36B: ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
  process.exit(fallos.length ? 1 : 0)
}

const adm = await abrirApp(APP, { ruta: RUTA, ancho: 1280, alto: 1100, sinEsperarRoot: true, esperaFija: 5, antes: MOCK })
const ag = (a) => J(a, `JSON.stringify((document.querySelector('[data-visor-iframe]').contentWindow.__sonidosAgendados ?? []).map((x) => ({ id: x.id, en: x.en, p: x.programado, t0: x.t0, t: x.t })))`)
const limpiar = (a) => a.evaluar("document.querySelector('[data-visor-iframe]').contentWindow.__sonidosAgendados = []; true")
const poner = (a, sel, valor, n = 0) => a.evaluar(`(() => { const r = document.querySelectorAll('${sel}')[${n}]; const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; set.call(r, '${valor}'); r.dispatchEvent(new Event('input', { bubbles: true })); return true })()`)
const subir = (a, nombre) =>
  a.evaluar(`(() => {
    const sr = 44100, n = sr * 2, buf = new Float32Array(n)
    for (let i = 0; i < n; i++) buf[i] = Math.sin(2 * Math.PI * 440 * i / sr) * 0.5 * (i < sr * 0.25 || i > n - sr * 0.25 ? 0 : 1)
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
const listoVisor = (a) => esperar(a, "Boolean(document.querySelector('[data-visor-iframe]')?.contentWindow?.__estudioVisor?.listo)", 160)
const FILA = '[data-sonido-clave="archivo:medalla_bronce"]'

try {
  debe(await esperar(adm, "document.querySelectorAll('[data-animacion-tarjeta]').length >= 20"), 'pagina', 'la página sale con su lista')
  debe(await listoVisor(adm), 'marco', 'el marco carga y queda listo')

  /* ───────── 2. Los procesos de audio, medidos ───────── */
  console.log('2. Los procesos de audio, medidos (OfflineAudioContext en el navegador)')
  const num = await J(adm, `import('/src/lib/sonidos/editar.ts').then(async (E) => {
    const sr = 44100
    const hacer = (largoS, f) => { const b = new AudioBuffer({ numberOfChannels: 1, length: Math.round(largoS * sr), sampleRate: sr }); const d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = f(i / sr, i); return b }
    const goertzel = (d, hz) => { const w = 2 * Math.PI * hz / sr; let s1 = 0, s2 = 0; const c = 2 * Math.cos(w); for (let i = 0; i < d.length; i++) { const s = d[i] + c * s1 - s2; s2 = s1; s1 = s }; return Math.sqrt(s1 * s1 + s2 * s2 - c * s1 * s2) / d.length * 2 }
    const seno = hacer(2, (t) => 0.5 * Math.sin(2 * Math.PI * 440 * t))
    const sal = {}
    // Recortar
    const rec = await E.aplicarRetoques(seno, { ini: 0.5, fin: 1.5 })
    sal.recorte = { largo: rec.length, esperado: sr, dur: rec.duration }
    // Fundido de salida
    const fs = await E.aplicarRetoques(seno, { salida_ms: 500 })
    const dfs = fs.getChannelData(0)
    let picoFinal = 0; for (let i = dfs.length - 20; i < dfs.length; i++) picoFinal = Math.max(picoFinal, Math.abs(dfs[i]))
    let picoMitad = 0; const m = dfs.length - Math.round(0.25 * sr); for (let i = m - 200; i < m + 200; i++) picoMitad = Math.max(picoMitad, Math.abs(dfs[i]))
    sal.fundido = { ultima: dfs[dfs.length - 1], picoFinal, picoMitad }
    // Tono: +12 queda limitado a +6
    const limite = E.limitar({ semitonos: 12 }, 2)
    const t6 = await E.aplicarRetoques(seno, { semitonos: 12 })
    sal.tono = { limitado: limite.semitonos, dur: t6.duration, esperada: 2 / 2 ** 0.5 }
    // Quitar graves (60 Hz casi desaparece, 1 kHz se queda)
    const mezcla = hacer(1, (t) => 0.3 * Math.sin(2 * Math.PI * 60 * t) + 0.3 * Math.sin(2 * Math.PI * 1000 * t))
    const sg = await E.aplicarRetoques(mezcla, { sin_graves: true })
    sal.graves = { antes60: goertzel(mezcla.getChannelData(0), 60), despues60: goertzel(sg.getChannelData(0), 60), antes1k: goertzel(mezcla.getChannelData(0), 1000), despues1k: goertzel(sg.getChannelData(0), 1000) }
    // Igualar volumen: dos sonidos distintos al mismo pico
    const flojo = hacer(0.5, (t) => 0.2 * Math.sin(2 * Math.PI * 300 * t))
    let semilla = 7
    const fuerte = hacer(0.5, () => { semilla = (semilla * 1664525 + 1013904223) >>> 0; return (semilla / 4294967296 * 2 - 1) * 0.7 })
    const a1 = await E.aplicarRetoques(flojo, { igualar: true })
    const a2 = await E.aplicarRetoques(fuerte, { igualar: true })
    sal.igualar = { p1: E.picoDe(a1), p2: E.picoDe(a2), objetivo: 10 ** (-1 / 20), antes1: E.picoDe(flojo), antes2: E.picoDe(fuerte) }
    // Volver al original: sin retoques es el mismo sonido, idéntico
    const igual = await E.aplicarRetoques(seno, E.SIN_RETOQUES)
    sal.original = { mismo: igual === seno }
    // Brillo y eco no rompen nada y el eco alarga la cola
    const br = await E.aplicarRetoques(seno, { brillo_db: 6 })
    const ec = await E.aplicarRetoques(seno, { eco_pct: 30 })
    sal.brillo_eco = { brilloLargo: br.length === seno.length, ecoMasLargo: ec.length > seno.length, ecoPico: E.picoDe(ec) }
    // El wav suena igual: se codifica, se descodifica y se comparan las muestras
    const retocado = await E.aplicarRetoques(seno, { ini: 0.2, fin: 1.7, entrada_ms: 50, salida_ms: 300, semitonos: 3, sin_graves: true, brillo_db: 2, eco_pct: 10, igualar: true })
    const wav = E.codificarWav(retocado)
    const c = new AudioContext({ sampleRate: 44100 })
    const vuelta = await c.decodeAudioData(wav.buffer.slice(0))
    let peor = 0; const d1 = retocado.getChannelData(0), d2 = vuelta.getChannelData(0)
    for (let i = 0; i < d1.length; i++) peor = Math.max(peor, Math.abs(d1[i] - d2[i]))
    sal.wav = { frames1: retocado.length, frames2: vuelta.length, peorDiferencia: peor, tasa: vuelta.sampleRate }
    // Los mismos retoques dan siempre las mismas muestras (determinista)
    const otra = await E.aplicarRetoques(seno, { ini: 0.2, fin: 1.7, entrada_ms: 50, salida_ms: 300, semitonos: 3, sin_graves: true, brillo_db: 2, eco_pct: 10, igualar: true })
    let dif = 0; const d3 = otra.getChannelData(0); for (let i = 0; i < d1.length; i++) dif = Math.max(dif, Math.abs(d1[i] - d3[i]))
    sal.determinista = { dif, mismoLargo: otra.length === retocado.length }
    return JSON.stringify(sal)
  })`)
  debe(Math.abs(num.recorte.largo - num.recorte.esperado) <= 1 && Math.abs(num.recorte.dur - 1) < 0.001, 'recortar', `recortar de 0,5 s a 1,5 s deja la duración exacta (${num.recorte.largo} muestras = ${num.recorte.dur.toFixed(4)} s)`)
  debe(Math.abs(num.fundido.ultima) < 1e-6 && num.fundido.picoFinal < 0.01 && num.fundido.picoMitad > 0.15 && num.fundido.picoMitad < 0.35, 'fundido', `el fundido de salida acaba en silencio (última muestra ${num.fundido.ultima}, pico final ${num.fundido.picoFinal.toFixed(4)}) y a media bajada vale ~la mitad (${num.fundido.picoMitad.toFixed(2)})`)
  debe(num.tono.limitado === 6 && Math.abs(num.tono.dur - num.tono.esperada) < 0.02, 'tono', `+12 semitonos queda limitado a +${num.tono.limitado} y no rompe nada (dura ${num.tono.dur.toFixed(3)} s: es velocidad)`)
  debe(num.graves.despues60 < num.graves.antes60 * 0.25 && num.graves.despues1k > num.graves.antes1k * 0.9, 'graves', `quitar graves baja la energía por debajo de 150 Hz (60 Hz: ${num.graves.antes60.toFixed(3)} → ${num.graves.despues60.toFixed(3)}) y deja los 1000 Hz (${num.graves.antes1k.toFixed(3)} → ${num.graves.despues1k.toFixed(3)})`)
  debe(Math.abs(num.igualar.p1 - num.igualar.objetivo) < 0.005 && Math.abs(num.igualar.p2 - num.igualar.objetivo) < 0.005 && Math.abs(num.igualar.antes1 - num.igualar.antes2) > 0.3, 'igualar', `«Igualar volumen» deja dos sonidos distintos al mismo nivel (picos ${num.igualar.antes1.toFixed(2)} y ${num.igualar.antes2.toFixed(2)} → ${num.igualar.p1.toFixed(3)} y ${num.igualar.p2.toFixed(3)})`)
  debe(num.original.mismo === true, 'original', 'sin retoques el sonido es el original, el mismo objeto')
  debe(num.brillo_eco.brilloLargo && num.brillo_eco.ecoMasLargo && num.brillo_eco.ecoPico <= 1.5, 'brillo_eco', 'brillo y eco funcionan (el eco alarga la cola)')
  debe(num.wav.frames1 === num.wav.frames2 && num.wav.peorDiferencia < 2 / 32768 && num.wav.tasa === 44100, 'wav', `el .wav suena igual: mismas muestras (${num.wav.frames1}) con una diferencia máxima de ${num.wav.peorDiferencia.toExponential(2)}`)
  debe(num.determinista.dif === 0 && num.determinista.mismoLargo, 'determinista', 'los mismos retoques dan siempre exactamente las mismas muestras')

  /* ───────── 3. En la pantalla: editar un sonido de Eric ───────── */
  console.log('3. [Editar] un sonido de Eric: atajos, deshacer y volver al original')
  await toque(adm, '[data-animacion-tarjeta="medalla_bronce"]')
  await adm.esp(3000)
  await subir(adm, 'mi_sonido.wav')
  debe(await esperar(adm, "document.querySelectorAll('[data-propio-activo]').length === 1"), 'editar', 'se añade un sonido de Eric')
  await adm.esp(1500)
  await toque(adm, '[data-editar-capa]')
  debe(await esperar(adm, "Boolean(document.querySelector('[data-editor-de-sonido]'))", 20), 'editar', '[Editar] abre el editor debajo de la capa')
  const ed = await J(adm, `JSON.stringify({ atajos: [...document.querySelectorAll('[data-atajo]')].map((x) => x.getAttribute('data-atajo')), asas: [...document.querySelectorAll('[data-editor-asa]')].map((x) => x.getAttribute('data-editor-asa')), tiempos: document.querySelector('[data-editor-tiempos]').textContent, barras: ['entrada', 'salida', 'tono', 'brillo', 'eco'].map((b) => Boolean(document.querySelector('[data-editor-' + b + ']'))), graves: Boolean(document.querySelector('[data-editor-sin-graves]')), igualar: Boolean(document.querySelector('[data-editor-igualar]')), titulos: document.querySelector('[data-editor-de-sonido]').innerText.match(/\\d · [A-ZÁÉÍÓÚ ]+/g) })`)
  debe(ed.atajos.join() === 'silencio,suave,movil,premio' && ed.asas.join() === 'ini,fin' && /0,00 s – 2,00 s/.test(ed.tiempos) && ed.barras.every(Boolean) && ed.graves && ed.igualar, 'editar', `el editor trae atajos de un toque, dos asas con el tiempo a la vista («${ed.tiempos}»), fundidos, tono, brillo, eco, graves e igualar`)
  await adm.captura('docs/dias/V36B_capturas/editor_abierto.jpg')
  await toque(adm, '[data-atajo="silencio"]')
  await esperar(adm, "/recortado/.test(document.querySelector('[data-propio-activo] [data-retocado]')?.textContent ?? '')", 40)
  const t1 = await adm.evaluar("document.querySelector('[data-editor-tiempos]').textContent")
  debe(/^0,2[0-9] s – 1,7[0-9] s$/.test(t1), 'editar', `«Quitar el silencio» recorta el silencio de los lados (${t1})`)
  await toque(adm, '[data-atajo="suave"]')
  await esperar(adm, "/fundido de salida 300 ms/.test(document.querySelector('[data-propio-activo] [data-retocado]')?.textContent ?? '')", 40)
  debe((await adm.evaluar("document.querySelector('[data-editor-salida]').value")) === '300', 'editar', '«Suavizar el final» pone el fundido de salida en 300 ms')
  await toque(adm, '[data-atajo="movil"]')
  await esperar(adm, "/sin graves/.test(document.querySelector('[data-propio-activo] [data-retocado]')?.textContent ?? '')", 40)
  const r3 = await adm.evaluar("document.querySelector('[data-propio-activo] [data-retocado]').textContent")
  debe(/sin graves/.test(r3) && /igualado a −1 dB de pico/.test(r3), 'editar', `«Para el altavoz del móvil» quita graves e iguala (${r3})`)
  await poner(adm, '[data-editor-tono]', '3')
  await esperar(adm, "/3 semitonos/.test(document.querySelector('[data-propio-activo] [data-retocado]')?.textContent ?? '')", 40)
  const dur3 = await adm.evaluar("document.querySelector('[data-editor-duracion]').textContent")
  debe(/dura 1,2[0-9] s/.test(dur3), 'editar', `+3 semitonos acorta el sonido (es velocidad): «${dur3}»`)
  await toque(adm, '[data-editor-deshacer]')
  await esperar(adm, "!/3 semitonos/.test(document.querySelector('[data-propio-activo] [data-retocado]')?.textContent ?? '')", 40)
  debe((await adm.evaluar("document.querySelector('[data-editor-tono]').value")) === '0', 'deshacer', '[Deshacer] quita el último cambio (el tono vuelve a 0)')
  await toque(adm, '[data-editor-original]')
  await esperar(adm, "!document.querySelector('[data-propio-activo] [data-retocado]')", 40)
  const orig = await J(adm, `import('/src/lib/sonidos/editar.ts').then(() => JSON.stringify({ retocado: Boolean(document.querySelector('[data-propio-activo] [data-retocado]')), tiempos: document.querySelector('[data-editor-tiempos]').textContent, dura: document.querySelector('[data-editor-duracion]').textContent }))`)
  debe(!orig.retocado && /0,00 s – 2,00 s/.test(orig.tiempos) && /dura 2,00 s/.test(orig.dura), 'original', '[Volver al original] lo deja como el archivo de Eric (2,00 s, sin retoques)')
  // «Repetir al cambiar»
  await limpiar(adm)
  await toque(adm, '[data-editor-repetir]')
  await poner(adm, '[data-editor-brillo]', '2')
  await adm.esp(3500)
  const repetido = await ag(adm)
  debe(repetido.some((x) => String(x.id).startsWith('propio:')), 'repetir', 'con «Repetir al cambiar» marcado, la animación se repite sola con el cambio')
  await toque(adm, '[data-editor-repetir]')

  /* ───────── 4. Editar un sonido de Code ───────── */
  console.log('4. [Editar] un sonido de Code: el golpe sigue cayendo en su sitio')
  await toque(adm, `${FILA} [data-editar-code]`)
  debe(await esperar(adm, `Boolean(document.querySelector('${FILA} [data-editor-de-sonido]'))`, 40), 'code', '[Editar] abre el editor del golpe de la medalla')
  await poner(adm, `${FILA} [data-editor-ini]`, '0.3')
  await esperar(adm, `/recortado/.test(document.querySelector('${FILA} [data-retocado]')?.textContent ?? '')`, 40)
  await toque(adm, `${FILA} [data-atajo="suave"]`)
  await esperar(adm, `/fundido de salida/.test(document.querySelector('${FILA} [data-retocado]')?.textContent ?? '')`, 40)
  await limpiar(adm)
  await toque(adm, '[data-ver-con-sonido]')
  await adm.esp(3500)
  const a2 = await ag(adm)
  const golpe = a2.find((x) => x.id === 'medalla_bronce')
  debe(golpe && Math.abs(golpe.p - golpe.en) < 0.01, 'code', `el golpe retocado sigue cayendo en su instante (${golpe ? ((golpe.p - golpe.en) * 1000).toFixed(1) : '?'} ms de diferencia)`)
  let lo = await adm.evaluar("document.querySelector('[data-lo-elegido]').textContent")
  const bronce = lo.split('\n').find((l) => /^Medalla de bronce/.test(l)) ?? ''
  debe(/golpe de la medalla de bronce: candidato [A-E] · retocado: recortado 0,30 s – final · fundido de entrada 10 ms · fundido de salida 300 ms/.test(bronce) && /MÍO: mi_sonido\.wav .* retocado: brillo \+2 dB/.test(bronce), 'lo_elegido', `«Lo elegido» apunta los retoques de cada sonido («${bronce.slice(0, 300)}»)`)
  await adm.captura('docs/dias/V36B_capturas/editado.jpg')

  /* ───────── 5. Guardar y recargar ───────── */
  console.log('5. Guardar y recargar conserva los retoques')
  await toque(adm, '[data-guardar]')
  debe(await esperar(adm, "/Guardado ✓/.test(document.querySelector('[data-estado-guardado]')?.textContent ?? '')", 40), 'guardar', '[Guardar] deja «Guardado ✓»')
  await adm.evaluar('location.reload(); true')
  await adm.esp(2500)
  debe(await listoVisor(adm), 'recargar', 'la página vuelve a abrir')
  debe(await esperar(adm, "Boolean(document.querySelector('[data-estado-guardado]'))", 60), 'recargar', 'la animación sale guardada')
  const tras = await J(adm, `JSON.stringify({ eric: document.querySelector('[data-propio-activo] [data-retocado]')?.textContent ?? '', code: document.querySelector('${FILA} [data-retocado]')?.textContent ?? '' })`)
  debe(/brillo \+2 dB/.test(tras.eric) && /recortado 0,30 s/.test(tras.code) && /fundido de salida 300 ms/.test(tras.code), 'recargar', `los retoques siguen (Eric: «${tras.eric}»; golpe: «${tras.code}»)`)
  await limpiar(adm)
  await toque(adm, '[data-ver-con-sonido]')
  await adm.esp(3500)
  const a3 = await ag(adm)
  debe(a3.some((x) => String(x.id).startsWith('propio:')) && a3.some((x) => x.id === 'medalla_bronce'), 'recargar', 'y suena con los retoques')

  /* ───────── 6. El zip: sonidos ya hechos ───────── */
  console.log('6. El zip lleva cada sonido editado ya hecho (.wav final), el original y los retoques')
  await toque(adm, '[data-descargar-todo]')
  debe(await esperar(adm, 'Boolean(window.__estudioZip)', 60), 'zip', '[Descargar todo lo guardado] hace el zip')
  const zip = await J(adm, `import('/src/lib/sonidos/zip.ts').then(async (Z) => import('/src/lib/sonidos/editar.ts').then(async (E) => {
    const e = await Z.leerZip(window.__estudioZip); const d = new TextDecoder()
    const est = JSON.parse(d.decode(e.find((x) => x.nombre === 'estudio.json').datos))
    const mb = est.animaciones.medalla_bronce
    const capa = mb.capas.find((c) => c.origen === 'archivo')
    const golpe = mb.sonidos_de_code.find((c) => c.clave === 'archivo:medalla_bronce')
    const c = new AudioContext()
    const bytesDe = (n) => e.find((x) => x.nombre === n)?.datos
    const ancho = (u) => u.buffer.slice(u.byteOffset, u.byteOffset + u.byteLength)
    const comparar = async (finalWav, originalBytes, retoques) => {
      const fin = await c.decodeAudioData(ancho(finalWav))
      const ori = await c.decodeAudioData(ancho(originalBytes))
      const rehecho = await E.aplicarRetoques(ori, retoques)
      let peor = 0; const a = fin.getChannelData(0), b = rehecho.getChannelData(0)
      for (let i = 0; i < Math.min(a.length, b.length); i++) peor = Math.max(peor, Math.abs(a[i] - b[i]))
      return { frames: fin.length, rehecho: rehecho.length, peor, pico: E.picoDe(fin) }
    }
    const resultado = { nombres: e.map((x) => x.nombre), capa, golpe, tasaDelNavegador: c.sampleRate }
    resultado.capaCmp = await comparar(bytesDe(capa.archivo), bytesDe(capa.original), capa.retoques)
    return JSON.stringify(resultado)
  }))`)
  debe(zip.nombres.includes('medalla_bronce_1.wav') && zip.nombres.includes('medalla_bronce_1_original.wav') && zip.capa.archivo === 'medalla_bronce_1.wav' && zip.capa.original === 'medalla_bronce_1_original.wav', 'zip', `el sonido de Eric editado va como .wav final (${zip.capa.archivo}) con su original (${zip.capa.original})`)
  debe(zip.capa.retoques && zip.capa.retoques.brillo_db === 2 && zip.capa.muestras === zip.capaCmp.frames && zip.capa.tasa === zip.tasaDelNavegador && Math.abs(zip.capa.pico - zip.capaCmp.pico) < 0.01, 'zip', `estudio.json lleva los retoques y los datos del final (muestras ${zip.capa.muestras}, ${zip.capa.tasa} Hz, la del navegador, pico ${zip.capa.pico})`)
  debe(zip.capaCmp.frames === zip.capaCmp.rehecho && zip.capaCmp.peor < 2 / 32768, 'zip', `el .wav del zip suena igual que en el estudio: las muestras de rehacer los retoques coinciden (diferencia máxima ${zip.capaCmp.peor.toExponential(2)})`)
  const golpeZip = zip.golpe
  debe(golpeZip && golpeZip.archivo && /\.wav$/.test(golpeZip.archivo) && zip.nombres.includes(golpeZip.archivo) && golpeZip.retoques && golpeZip.retoques.ini === 0.3 && golpeZip.retoques.salida_ms === 300 && golpeZip.muestras > 0, 'zip', `el golpe de Code retocado también va ya hecho (${golpeZip?.archivo})`)
  const zipBytes = await adm.evaluar('Array.from(window.__estudioZip).join(",")')
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
      salida = execFileSync('node', ['scripts/sonidos/aplicarEstudio.mjs', archivo], { encoding: 'utf8', env: { ...process.env, JUTRIP_SIN_FFMPEG: '1' } })
    } catch (err) {
      codigo = err.status ?? 1
      salida = String(err.stdout ?? '') + String(err.stderr ?? '')
    }
    fs.rmSync(carpeta, { recursive: true, force: true })
    debe(codigo === 0 && /recortado/.test(salida) && /muestras/.test(salida), 'aplicar', `aplicarEstudio.mjs lee el zip con sonidos editados, comprueba los .wav finales y enseña lo que suena (código ${codigo}: ${salida.split('\n').find((l) => /Editado/.test(l))?.slice(0, 140) ?? salida.slice(0, 140)})`)
  }

  /* ───────── 7. Eliminar y cargar el zip: los retoques vuelven ───────── */
  console.log('7. [Eliminar lo guardado] y [Cargar un zip] conservan los retoques')
  await toque(adm, '[data-eliminar-guardado]')
  await toque(adm, '[data-borrar-si]')
  await adm.esp(1500)
  debe(!(await adm.evaluar("Boolean(document.querySelector('[data-retocado]'))")), 'cargar', 'al eliminar lo guardado, los retoques desaparecen')
  await adm.evaluar(`(() => { const bytes = new Uint8Array([${zipBytes}]); const dt = new DataTransfer(); dt.items.add(new File([bytes], 'sonidos_jutrip.zip', { type: 'application/zip' })); const i = document.querySelector('[data-cargar-zip]'); i.files = dt.files; i.dispatchEvent(new Event('change', { bubbles: true })); return true })()`)
  debe(await esperar(adm, "/Cargado: 1 animación/.test(document.querySelector('[data-aviso-guardado]')?.textContent ?? '')", 80), 'cargar', '[Cargar un zip] lo abre')
  await adm.esp(1500)
  const cargado = await J(adm, `JSON.stringify({ eric: document.querySelector('[data-propio-activo] [data-retocado]')?.textContent ?? '', code: document.querySelector('${FILA} [data-retocado]')?.textContent ?? '' })`)
  debe(/brillo \+2 dB/.test(cargado.eric) && /recortado 0,30 s/.test(cargado.code), 'cargar', `y los retoques vuelven (Eric: «${cargado.eric}»; golpe: «${cargado.code}»)`)

  /* ───────── 8. Nada sale del navegador ───────── */
  console.log('8. Nada sale del navegador')
  const red = await J(adm, 'JSON.stringify(window.__red)')
  debe(red.filter((x) => x.m !== 'GET' || /mi_sonido|blob:|sonidos_jutrip|\.zip|\.wav/.test(x.u)).length === 0, 'privado', `ninguna petición envía datos ni nombra los archivos (${red.length} peticiones, todas de lectura)`)
} finally {
  adm.cerrar()
}

console.log(`\nPrueba de la Tanda V36B: ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
process.exit(fallos.length ? 1 : 0)
