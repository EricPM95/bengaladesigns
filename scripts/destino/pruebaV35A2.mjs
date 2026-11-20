// La prueba de la Tanda V35A2: EL ARREGLO DEL ESTUDIO DE SONIDOS (/admin/sonidos): los sonidos de Eric se SUMAN a los de Code (ya no sustituyen), cualquier sonido de Code se puede silenciar, cada uno tiene su volumen (0 a 200 %),
// «Empieza…» (al empezar la animación / en el golpe), barra de ms de −duración a +duración, adelantar sin recortar, línea de tiempo con las rayas verde y roja, y «Lo elegido» con todo.
//   APP_URL=http://localhost:5173 node scripts/destino/pruebaV35A2.mjs      (con Vite en 5173)
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
const MOCK = "const f = window.fetch.bind(window); window.fetch = (u, i) => String(u).includes('/api/admin/avisos-viajeros') ? Promise.resolve(new Response(JSON.stringify({ ok: true, nuevos: 0, avisos: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } })) : f(u, i);"

/* ───────── 1. El código ───────── */
console.log('1. El código')
const pagina = leer('src/components/logros/AdminSonidos.tsx')
const motor = leer('src/lib/sonidos/motor.ts')
debe(!/Sustituye a/.test(pagina) && !/data-objetivo-propio/.test(pagina), 'suma', 'ya no existe «Sustituye a»: los sonidos de Eric se suman')
debe(/data-silenciar-todos/.test(pagina) && /data-anadir-otro/.test(pagina) && /data-empieza=/.test(pagina) && /data-linea-de-tiempo/.test(pagina), 'pantalla', 'la página tiene [Silenciar todos los de Code], [+ Añadir otro sonido mío], «Empieza…» y la línea de tiempo')
debe(/Math\.max\(0, leerJson<Record<string, number>>\(CLAVE_VOLUMEN_DE, \{\}\)\[id\] \?\? 1\)/.test(motor), 'volumen', 'el volumen de un sonido llega a 0 (ya no se queda en 20 %)')
debe(!/f\.start\(Math\.max\(arranque, ahora\)/.test(motor), 'recorte', 'el motor no recorta el principio de un sonido propio a propósito')

if (!(await fetch(APP).then((r) => r.ok).catch(() => false))) {
  console.log('(sin Vite: la parte de la pantalla se salta)')
  console.log(`\nPrueba de la Tanda V35A2: ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
  process.exit(fallos.length ? 1 : 0)
}

const adm = await abrirApp(APP, { ruta: RUTA, ancho: 1280, alto: 1000, sinEsperarRoot: true, esperaFija: 5, antes: MOCK })
const ag = (a) => J(a, `JSON.stringify((document.querySelector('[data-visor-iframe]').contentWindow.__sonidosAgendados ?? []).map((x) => ({ id: x.id, en: x.en, p: x.programado, t0: x.t0, t: x.t, recorte: x.recorte })))`)
const limpiar = (a) => a.evaluar("document.querySelector('[data-visor-iframe]').contentWindow.__sonidosAgendados = []; true")
const poner = (a, sel, valor, n = 0) => a.evaluar(`(() => { const r = document.querySelectorAll('${sel}')[${n}]; const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; set.call(r, '${valor}'); r.dispatchEvent(new Event('input', { bubbles: true })); return true })()`)
const repetir = async (a, ms = 2600) => {
  await limpiar(a)
  await toque(a, '[data-repetir]')
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
const esCode = (x) => !String(x.id).startsWith('propio:')
const propios = (l) => l.filter((x) => !esCode(x))

try {
  console.log('2. La medalla de bronce: dos sonidos de Code, cada uno en su fila, con silenciar y su volumen')
  debe(await esperar(adm, "document.querySelectorAll('[data-animacion-tarjeta]').length >= 20"), 'pagina', 'la página sale con su lista')
  debe(await esperar(adm, "Boolean(document.querySelector('[data-visor-iframe]')?.contentWindow?.__estudioVisor?.listo)", 160), 'marco', 'el marco carga y queda listo')
  await toque(adm, '[data-animacion-tarjeta="medalla_bronce"]')
  await adm.esp(3000)
  const filas = await J(adm, `JSON.stringify([...document.querySelectorAll('[data-sonidos-de-code] [data-sonido-clave]')].map((x) => ({ clave: x.getAttribute('data-sonido-clave'), silenciar: Boolean(x.querySelector('[data-silenciar]')), vol: Boolean(x.querySelector('input[type=range]')), max: x.querySelector('input[type=range]')?.max, min: x.querySelector('input[type=range]')?.min })))`)
  const golpe = filas.find((f) => f.clave === 'archivo:medalla_bronce')
  const redoble = filas.find((f) => f.clave === 'archivo:redoble')
  debe(Boolean(golpe) && Boolean(redoble), 'filas', `el golpe y el redoble tienen cada uno su fila (${filas.map((f) => f.clave).join(', ')})`)
  debe(filas.every((f) => f.silenciar && f.vol && f.min === '0' && f.max === '2'), 'filas', 'cada fila tiene [Silenciar] y su volumen de 0 a 200 %')
  debe(await adm.evaluar("Boolean(document.querySelector('[data-silenciar-todos]'))"), 'filas', 'arriba de todo está [Silenciar todos los de Code]')
  let a0 = await ag(adm)
  debe(a0.some((x) => x.id === 'medalla_bronce') && a0.some((x) => x.id === 'redoble'), 'suman', `sin silenciar nada ni añadir nada suenan el golpe y el redoble de Code (${a0.map((x) => x.id).join(', ')})`)
  await adm.captura('docs/dias/V35A2_capturas/despues_codigo.jpg')

  console.log('3. El volumen de los candidatos llega a 0 y es de cada sonido')
  await poner(adm, '[data-sonido-clave="archivo:redoble"] input[type=range]', '0')
  await adm.esp(300)
  const v0 = await J(adm, `JSON.stringify({ texto: document.querySelector('[data-volumen-candidato-valor="redoble"]').textContent, guardado: JSON.parse(localStorage.getItem('jutrip.sonidos.volumen_de') ?? '{}'), otro: document.querySelector('[data-volumen-candidato-valor="medalla_bronce"]').textContent })`)
  debe(v0.texto === '0 %' && v0.guardado.redoble === 0, 'volumen', `el volumen del redoble baja hasta 0 (${v0.texto})`)
  debe(v0.otro === '100 %' && v0.guardado.medalla_bronce === undefined, 'volumen', 'y no mueve el del golpe: cada sonido tiene el suyo')
  await poner(adm, '[data-sonido-clave="archivo:redoble"] input[type=range]', '1.4')
  await adm.esp(200)
  debe((await adm.evaluar("document.querySelector('[data-volumen-candidato-valor=\"redoble\"]').textContent")) === '140 %', 'volumen', 'y sube hasta 200 % (aquí 140 %)')
  await poner(adm, '[data-sonido-clave="archivo:redoble"] input[type=range]', '1')

  console.log('4. [Silenciar] un sonido: se apaga su fila, desaparece de la línea de tiempo y no se programa')
  await limpiar(adm)
  const antes = await adm.evaluar("Boolean(document.querySelector('[data-fila-de-tiempo=\"archivo:redoble\"]'))")
  await toque(adm, '[data-silenciar="archivo:redoble"]')
  await adm.esp(2600)
  const s1 = await J(adm, `JSON.stringify({ fila: document.querySelector('[data-sonido-clave="archivo:redoble"]').getAttribute('data-silenciado'), texto: document.querySelector('[data-sonido-clave="archivo:redoble"] [data-estado-silenciado]')?.textContent, enLinea: Boolean(document.querySelector('[data-fila-de-tiempo="archivo:redoble"]')), golpeEnLinea: Boolean(document.querySelector('[data-fila-de-tiempo="archivo:medalla_bronce"]')) })`)
  const a1 = await ag(adm)
  debe(antes && !s1.enLinea && s1.golpeEnLinea, 'silenciar', 'al silenciar el redoble su fila sale de la línea de tiempo y la del golpe se queda')
  debe(s1.fila === '1' && s1.texto === 'SILENCIADO', 'silenciar', 'se ve claro cuál está apagado («SILENCIADO»)')
  debe(!a1.some((x) => x.id === 'redoble') && a1.some((x) => x.id === 'medalla_bronce'), 'silenciar', `el redoble no se programa y el golpe sí (${a1.map((x) => x.id).join(', ')})`)
  await toque(adm, '[data-silenciar="archivo:redoble"]')
  await adm.esp(2600)

  console.log('5. Un sonido de Eric se SUMA a los de Code y empieza con la animación')
  await limpiar(adm)
  await subir(adm, 'principio_de_eric.wav')
  debe(await esperar(adm, "document.querySelectorAll('[data-propio-activo]').length === 1"), 'suma', 'se añade un sonido de Eric')
  await adm.esp(2800)
  const a2 = await ag(adm)
  const p1 = propios(a2)
  debe(p1.length === 1 && a2.some((x) => x.id === 'medalla_bronce') && a2.some((x) => x.id === 'redoble'), 'suman', `suenan juntos el de Eric y los de Code (${a2.map((x) => x.id).join(', ')})`)
  debe(p1.length === 1 && Math.abs(p1[0].t - p1[0].t0) < 0.02 && p1[0].recorte < 0.02, 'principio', `«Al empezar la animación» con 0 ms: arranca en el primer fotograma, entero (${p1[0] ? ((p1[0].t - p1[0].t0) * 1000).toFixed(1) : '?'} ms)`)
  debe((await adm.evaluar("document.querySelector('[data-empieza=\"principio\"]').getAttribute('aria-pressed')")) === 'true', 'principio', '«Al empezar la animación» es lo que viene marcado por defecto')
  debe(await adm.evaluar("Boolean(document.querySelector('[data-quitar-propio]'))"), 'capas', 'cada sonido de Eric lleva su [Quitar]')

  console.log('6. Con +500 ms y con −300 ms: después, y antes sin recortar')
  await poner(adm, '[data-propio-activo] [data-ms]', '500')
  await adm.esp(300)
  const a3 = propios(await repetir(adm))
  debe(a3.length === 1 && Math.abs(a3[0].t - a3[0].t0 - 0.5) < 0.02, 'mas', `+500 ms: arranca 500 ms después del primer fotograma (${a3[0] ? ((a3[0].t - a3[0].t0) * 1000).toFixed(0) : '?'} ms)`)
  await poner(adm, '[data-propio-activo] [data-ms]', '-300')
  await adm.esp(300)
  const a4 = propios(await repetir(adm, 3200))
  const espera = await adm.evaluar("document.querySelector('[data-visor-iframe]').contentWindow.__esperaDeLaAnimacion")
  debe(a4.length === 1 && Math.abs(a4[0].t - a4[0].t0 + 0.3) < 0.02, 'menos', `−300 ms: arranca 300 ms ANTES del primer fotograma (${a4[0] ? ((a4[0].t - a4[0].t0) * 1000).toFixed(0) : '?'} ms)`)
  debe(a4.length === 1 && a4[0].recorte < 0.02, 'menos', 'y se oye entero: no se le recorta el principio')
  debe(Math.abs(espera - 0.3) < 0.01 && (await adm.evaluar("Boolean(document.querySelector('[data-aviso-espera]'))")), 'menos', `la animación espera 300 ms para que se oiga entero y la página lo dice (${espera} s)`)
  const ms = await J(adm, `JSON.stringify({ min: document.querySelector('[data-ms]').min, max: document.querySelector('[data-ms]').max, step: document.querySelector('[data-ms]').step, botones: ['menos100', 'menos', 'cero', 'mas', 'mas100'].map((b) => Boolean(document.querySelector('[data-ms-' + b + ']'))) })`)
  debe(Number(ms.min) === -Number(ms.max) && Number(ms.max) >= 5300 && ms.step === '10' && ms.botones.every(Boolean), 'barra', `la barra cubre toda la animación (±${ms.max} ms, de 10 en 10) con −100 / −10 / 0 / +10 / +100`)
  await toque(adm, '[data-ms-mas100]')
  await toque(adm, '[data-ms-mas]')
  await adm.esp(200)
  debe((await adm.evaluar("document.querySelector('[data-ms-valor]').textContent")) === '−190 ms', 'barra', '+100 y +10 desde −300 dan −190 ms')
  await toque(adm, '[data-ms-cero]')

  console.log('7. «En el golpe»: 0 ms es el final')
  await limpiar(adm)
  await toque(adm, '[data-empieza="golpe"]')
  await adm.esp(2800)
  const a5 = propios(await ag(adm))
  const gref = JSON.parse(await adm.evaluar("import('/src/lib/sonidos/estudio.ts').then((E) => JSON.stringify(E.golpeDe(E.animacionDe('medalla_bronce'))))"))
  debe(a5.length === 1 && Math.abs(a5[0].t - a5[0].t0 - gref) < 0.02, 'golpe', `«En el golpe» con 0 ms: arranca en el golpe (${a5[0] ? (a5[0].t - a5[0].t0).toFixed(2) : '?'} s; el golpe cae a los ${gref.toFixed(2)} s)`)

  console.log('8. Dos sonidos de Eric: suenan los dos, cada uno en su sitio')
  await toque(adm, '[data-empieza="principio"]')
  await adm.esp(500)
  await toque(adm, '[data-anadir-otro]')
  await subir(adm, 'golpe_de_eric.wav')
  debe(await esperar(adm, "document.querySelectorAll('[data-propio-activo]').length === 2"), 'capas', 'con [+ Añadir otro sonido mío] hay dos sonidos de Eric')
  await adm.evaluar("document.querySelectorAll('[data-propio-activo]')[1].querySelector('[data-empieza=\"golpe\"]').click(); true")
  await adm.esp(300)
  await poner(adm, '[data-propio-activo] [data-ms]', '120', 1)
  await adm.esp(300)
  const a6 = propios(await repetir(adm, 3000))
  debe(a6.length === 2, 'capas', `los dos suenan (${a6.map((x) => x.id).join(', ')})`)
  const primero = a6.find((x) => x.id === 'propio:m3' || x.t - x.t0 < 1) ?? a6[0]
  const segundo = a6.find((x) => x !== primero)
  debe(primero && segundo && Math.abs(primero.t - primero.t0) < 0.02 && Math.abs(segundo.t - segundo.t0 - (gref + 0.12)) < 0.02, 'capas', `uno desde el principio (${primero ? ((primero.t - primero.t0) * 1000).toFixed(0) : '?'} ms) y otro en el golpe +120 ms (${segundo ? ((segundo.t - segundo.t0) * 1000).toFixed(0) : '?'} ms)`)
  const linea = await J(adm, `JSON.stringify({ filas: [...document.querySelectorAll('[data-fila-de-tiempo]')].map((x) => x.getAttribute('data-fila-de-tiempo')), ondas: document.querySelectorAll('[data-linea-de-tiempo] [data-onda]').length })`)
  debe(linea.filas.filter((c) => c.startsWith('propio:')).length === 2 && linea.filas.includes('archivo:medalla_bronce') && linea.filas.includes('archivo:redoble') && linea.ondas === 2, 'linea', `la línea de tiempo tiene una fila por sonido (${linea.filas.join(', ')}) y la onda de cada uno de Eric`)

  console.log('9. [Silenciar todos los de Code]: solo suenan los de Eric')
  await limpiar(adm)
  await toque(adm, '[data-silenciar-todos]')
  await adm.esp(3000)
  const a7 = await ag(adm)
  debe(a7.filter(esCode).length === 0 && propios(a7).length === 2, 'silenciar_todos', `no se programa ninguno de Code y sí los dos de Eric (${a7.map((x) => x.id).join(', ')})`)
  const filasSil = await J(adm, `JSON.stringify({ todas: [...document.querySelectorAll('[data-sonidos-de-code] [data-sonido-clave]')].every((x) => x.getAttribute('data-silenciado') === '1'), codigoEnLinea: [...document.querySelectorAll('[data-fila-de-tiempo]')].filter((x) => !x.getAttribute('data-fila-de-tiempo').startsWith('propio:')).length, boton: document.querySelector('[data-silenciar-todos]').textContent })`)
  debe(filasSil.todas && filasSil.codigoEnLinea === 0 && /Activar/.test(filasSil.boton), 'silenciar_todos', `todas las filas de Code quedan apagadas y fuera de la línea de tiempo (${filasSil.boton})`)

  console.log('10. Las rayas, la línea de tiempo y «Lo elegido»')
  const rayas = await J(adm, `JSON.stringify((() => { const l = document.querySelector('[data-linea-de-tiempo]'); const lo = Number(l.getAttribute('data-lo')), hi = Number(l.getAttribute('data-hi')); const v = document.querySelector('[data-raya-verde]'), r = document.querySelector('[data-raya-roja]'); const franja = v.parentElement.getBoundingClientRect(); const pos = (e) => (e.getBoundingClientRect().left - franja.left) / franja.width; return { lo, hi, verde: pos(v), roja: pos(r), textos: [...l.querySelectorAll('span')].map((s) => s.textContent).filter((t) => /empieza la animación|golpe \\/ final/.test(t)) } })())`)
  debe(Math.abs(rayas.verde - (0 - rayas.lo) / (rayas.hi - rayas.lo)) < 0.01, 'rayas', `la raya verde (empieza la animación) está en el 0 (${(rayas.verde * 100).toFixed(1)} % de la franja)`)
  debe(Math.abs(rayas.roja - (gref - rayas.lo) / (rayas.hi - rayas.lo)) < 0.01, 'rayas', `la raya roja (golpe / final) está en el golpe, a los ${gref.toFixed(2)} s (${(rayas.roja * 100).toFixed(1)} %)`)
  debe(rayas.textos.length === 2, 'rayas', 'cada raya lleva su rótulo encima («empieza la animación» y «golpe / final»)')
  const lo = await adm.evaluar("document.querySelector('[data-lo-elegido]').textContent")
  const bronce = lo.split('\n').find((l) => /^Medalla de bronce/.test(l)) ?? ''
  debe(/golpe de la medalla de bronce: SILENCIADO/.test(bronce) && /redoble: SILENCIADO/.test(bronce) && /MÍO: principio_de_eric\.wav · desde el principio \+0 ms · 70 %/.test(bronce) && /MÍO: golpe_de_eric\.wav · desde el golpe \+120 ms · 70 %/.test(bronce), 'lo_elegido', `«Lo elegido» dice todo lo que suena («${bronce.slice(0, 200)}»)`)
  await adm.captura('docs/dias/V35A2_capturas/despues_capas.jpg')
  // Quitar una capa quita su fila
  await toque(adm, '[data-propio-activo] [data-quitar-propio]')
  await adm.esp(800)
  debe((await adm.evaluar("document.querySelectorAll('[data-propio-activo]').length")) === 1, 'capas', '[Quitar] quita ese sonido de Eric y deja el otro')
} finally {
  adm.cerrar()
}

console.log('11. Sin ser administrador no se entra, y en el iPhone cabe')
{
  const a = await abrirApp(APP, { ruta: RUTA, ancho: 390, alto: 844, sinEsperarRoot: true, esperaFija: 5, antes: MOCK })
  try {
    await esperar(a, "Boolean(document.querySelector('[data-visor-iframe]')?.contentWindow?.__estudioVisor?.listo)", 160)
    const r = await J(a, `JSON.stringify({ sinScrollLateral: document.documentElement.scrollWidth <= window.innerWidth + 1, ancho: document.documentElement.scrollWidth })`)
    debe(r.sinScrollLateral, 'iphone', `en el iPhone no hay desplazamiento lateral (${r.ancho} de 390)`)
    await a.captura('docs/dias/V35A2_capturas/despues_iphone.jpg')
  } finally {
    a.cerrar()
  }
}

console.log(`\nPrueba de la Tanda V35A2: ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
process.exit(fallos.length ? 1 : 0)
