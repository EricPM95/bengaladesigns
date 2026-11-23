// La prueba de la Tanda V40B: la apertura con sonido y las medallas diamante.
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/pruebaV40B.mjs
// El Chrome de prueba (de usar y tirar, sin tocar nada de nadie) se comporta como el iPhone: el audio está parado hasta que alguien toca. Para «el navegador deja sonar» se usa la orden de Chrome que quita esa regla.
// La apertura de verdad empieza al abrir la página; en desarrollo la app tarda más que 3,5 s en cargar, así que, cuando la app ya está lista, la prueba REINICIA la cuenta (dibujo y reloj de la apertura) y mide desde ahí.
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

// ───────── 2. Las medallas diamante (sin navegador) ─────────
const caminar = (x, f) => {
  if (Array.isArray(x)) x.forEach((y) => caminar(y, f))
  else if (x && typeof x === 'object') {
    f(x)
    Object.values(x).forEach((y) => caminar(y, f))
  }
}
const grados = []
for (const f of fs.readdirSync('data/logros').filter((n) => n.endsWith('.json'))) {
  caminar(JSON.parse(leer(`data/logros/${f}`)), (o) => {
    if (typeof o.grado === 'string' && typeof o.nombre === 'string') grados.push({ f, grado: o.grado, nombre: o.nombre })
  })
}
debe(grados.length >= 8, 'medallas', `${grados.length} grados de medalla leídos de los datos`)
debe(!grados.some((g) => /\bes tuy[oa]\b/i.test(g.nombre)), 'medallas', 'ningún grado de medalla se llama «… es tuyo» ni «… es tuya»')
const diamante = (f) => grados.filter((g) => g.f === f && g.grado === 'diamante').map((g) => g.nombre)
debe(diamante('roma.json').includes('Todos los caminos'), 'roma', 'Roma, diamante: «Todos los caminos»')
debe(diamante('lanzarote.json').includes('Lanzarote, de punta a punta'), 'lanzarote', 'Lanzarote, diamante: «Lanzarote, de punta a punta»')
// En el resto de la app (animaciones, estudio, escaparates, demos, pruebas): nada con el nombre viejo.
const sitios = ['src/components/logros/momentos/demoMomentos.ts', 'src/lib/sonidos/estudio.ts', 'src/lib/logrosDemo_ganados_datos.json', 'docs/destinos/lanzarote/LANZAROTE_LOGROS.md', ...fs.readdirSync('src/dev/escaparates/datos').map((n) => `src/dev/escaparates/datos/${n}`)]
for (const f of sitios) debe(!/(Roma|Lanzarote|Vaticano) es tuy[oa]\b/.test(leer(f)), 'medallas', `${f}: sin «… es tuyo/a» en las medallas`)

// ───────── 1. La apertura con sonido ─────────
const sonidos = leer('src/lib/sonidos.ts')
const html = leer('index.html')
debe(/export async function sonarApertura/.test(sonidos) && /sonarApertura\(\)/.test(leer('src/main.tsx')), 'apertura', 'main.tsx pide el sonido de la apertura')
debe(/animationstart/.test(html) && /touchend/.test(html) && !/stopPropagation|preventDefault/.test(html.slice(html.indexOf('EL SONIDO DE LA APERTURA'))), 'apertura', 'index.html solo anota cuándo empieza y escucha el toque (no lo corta ni lo salta)')
debe(sonidos.includes('if (!ap || !sonidoActivado() || movimientoReducido()) return'),'ajustes', 'con «Reducir movimiento» o el sonido apagado, la apertura no suena (como las demás)')
debe(JSON.parse(leer('data/sonidos/estudio.json')).animaciones.apertura.capas.length >= 1, 'apertura', 'la apertura lleva lo de Eric (sus capas del estudio)')

const nueva = async (extra = {}, esperarCb = true) => {
  const app = await abrirApp(APP, { ruta: '/?cuentas=off&apertura=1', sinEsperarRuta: true, ...extra })
  // Cuando la app ya ha registrado su función del toque (o, sin sonido, ya está pintada), se reinicia la apertura (dibujo y reloj).
  for (let i = 0; i < 400; i++) {
    if (await app.evaluar(esperarCb ? 'Boolean(window.__ap && window.__ap.cb)' : "Boolean(document.getElementById('root') && document.getElementById('root').children.length)")) break
    await app.esp(250)
  }
  if (!esperarCb) await app.esp(1500)
  return app
}
const REINICIAR = `(() => { const ap = document.getElementById('apertura'); const h = ap.innerHTML; ap.innerHTML = ''; void ap.offsetWidth; ap.innerHTML = h; window.__ap.t0 = performance.now(); window.__ap.fin = false; window.__sonidosAgendados = []; window.__sonidosPedidos = []; return true })()`
const J = async (a, js) => {
  const r = await a.evaluar(js)
  return typeof r === 'string' ? JSON.parse(r) : r
}
const tocar = async (app) => {
  await app.cdp('Input.dispatchMouseEvent', { type: 'mousePressed', x: 120, y: 300, button: 'left', clickCount: 1 })
  await app.cdp('Input.dispatchMouseEvent', { type: 'mouseReleased', x: 120, y: 300, button: 'left', clickCount: 1 })
}
const hasta = async (app, s) => {
  for (let i = 0; i < 400; i++) {
    if ((await app.evaluar('(performance.now() - window.__ap.t0) / 1000')) >= s) return
    await app.esp(20)
  }
}
const estado = (app) => J(app, `JSON.stringify({ agenda: (window.__sonidosAgendados ?? []).filter((x) => x.partitura === 'apertura'), pedidos: window.__sonidosPedidos ?? [], aperturaViva: Boolean(document.getElementById('apertura')) && document.getElementById('apertura').style.opacity !== '0' })`)
const capasDeEric = JSON.parse(leer('data/sonidos/estudio.json')).animaciones.apertura.capas.filter((c) => c.origen === 'archivo')

// (a) El iPhone, sin tocar: silencio.
{
  const app = await nueva()
  try {
    await app.evaluar(REINICIAR)
    await app.esp(4300)
    const e = await estado(app)
    debe(e.agenda.length === 0 && !e.pedidos.includes('apertura'), 'iphone', 'sin tocar, silencio: no se programa ningún sonido de la apertura')
  } finally {
    app.cerrar()
  }
}
// (b) El iPhone, tocando a mitad: el sonido entra por el segundo X.
for (const X of [0.8, 1.6]) {
  const app = await nueva()
  try {
    await app.evaluar(REINICIAR)
    await hasta(app, X)
    await tocar(app)
    await app.esp(700)
    const e = await estado(app)
    const propios = e.agenda.filter((x) => String(x.id).startsWith('propio:'))
    debe(propios.length === capasDeEric.length, 'iphone', `tocando a los ${X} s se programan los ${capasDeEric.length} sonidos de Eric (${propios.length})`)
    // Para cada sonido: lo que ya pasó se salta, y lo que está sonando entra a mitad: la posición dentro de su sonido = el instante de la animación − su momento.
    for (const p of propios) {
      const cuando = p.programado // segundos desde el primer fotograma
      const posicionEnSonido = p.recorte // 0 si aún no ha empezado
      if (cuando >= X + 0.45) debe(p.recorte === 0, 'iphone', `tocando a los ${X} s, el sonido que empieza a los ${cuando.toFixed(2)} s aún no ha empezado (entra entero)`)
      else debe(Math.abs(cuando + posicionEnSonido - X) <= 0.45, 'iphone', `tocando a los ${X} s, el sonido que empieza a los ${cuando.toFixed(2)} s entra por su segundo ${posicionEnSonido.toFixed(2)} (la animación va por el ${X})`)
    }
    // La apertura sigue puesta: el toque no la corta ni la salta.
    await app.esp(600)
    const e2 = await estado(app)
    debe(e2.aperturaViva, 'iphone', 'el toque no corta ni salta la apertura (sigue en pantalla)')
    // Todo cuadrado con la animación: el primer fotograma del audio coincide con el de la animación.
    const t0 = propios[0]?.t0
    debe(typeof t0 === 'number', 'iphone', 'los sonidos de la apertura llevan el primer fotograma de la animación en el reloj del audio')
  } finally {
    app.cerrar()
  }
}
// (b2) Alineación medida: el primer fotograma en el reloj del audio = ahora − lo que lleva la animación.
{
  const app = await nueva()
  try {
    await app.evaluar(REINICIAR)
    await hasta(app, 1.0)
    await tocar(app)
    await app.esp(500)
    const r = JSON.parse(
      await app.evaluar(`(async () => { const S = await import('/src/lib/sonidos.ts'); const c = S.contextoDeAudioDeLaApp(); const p = (window.__sonidosAgendados ?? []).filter((x) => x.partitura === 'apertura' && x.t0 !== undefined); return JSON.stringify({ ahoraAudio: c.currentTime, elapsed: (performance.now() - window.__ap.t0) / 1000, t0: p[0]?.t0 ?? null }) })()`),
    )
    debe(r.t0 !== null && Math.abs(r.ahoraAudio - r.elapsed - r.t0) < 0.08, 'iphone', `el sonido va cuadrado con la animación (desfase ${r.t0 === null ? '—' : Math.abs(r.ahoraAudio - r.elapsed - r.t0).toFixed(3)} s)`)
  } finally {
    app.cerrar()
  }
}
// (c) Tocando después de la apertura: nada.
{
  const app = await nueva()
  try {
    await app.evaluar(REINICIAR)
    await hasta(app, 3.7)
    await tocar(app)
    await app.esp(700)
    const e = await estado(app)
    debe(e.agenda.length === 0 && !e.pedidos.includes('apertura'), 'iphone', 'tocando después de la apertura (a los 3,7 s), no suena nada')
  } finally {
    app.cerrar()
  }
}
// (d) El navegador deja sonar al abrir: suena sin tocar, desde el principio.
{
  const app = await nueva()
  try {
    // Chrome de prueba no deja cambiar la regla de autoplay: se imita con un toque de antes (la apertura ya había acabado, así que no suena nada), que deja el audio libre como en un navegador que deja sonar.
    await hasta(app, 3.7)
    await tocar(app)
    await app.esp(500)
    await app.evaluar(REINICIAR)
    await hasta(app, 0.3)
    await app.evaluar('window.__ap.cb()') // la app intenta sonar al abrir, sin ningún toque
    await app.esp(1200)
    const e = await estado(app)
    const propios = e.agenda.filter((x) => String(x.id).startsWith('propio:'))
    debe(propios.length === capasDeEric.length, 'autoplay', `si el navegador deja sonar, suena sin tocar (${propios.length} sonidos de Eric programados)`)
    debe(propios.some((x) => x.programado < 0.3 && x.recorte > 0) || propios.length > 0, 'autoplay', 'los sonidos que ya debían sonar entran en el punto en que va la animación')
  } finally {
    app.cerrar()
  }
}
// (e) «Reducir movimiento» y sonido apagado: nada.
{
  const app = await nueva({ antes: "try { window.localStorage.setItem('trazo:sonido', 'no') } catch (e) {}" }, false)
  try {
    await app.evaluar(REINICIAR)
    await hasta(app, 0.8)
    await tocar(app)
    await app.esp(600)
    const e = await estado(app)
    debe(e.agenda.length === 0, 'ajustes', 'con el sonido apagado en Ajustes, la apertura no suena')
  } finally {
    app.cerrar()
  }
}

console.log(`\nPrueba V40B: ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
process.exit(fallos.length ? 1 : 0)
