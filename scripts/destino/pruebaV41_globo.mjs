// La prueba de la Tanda V41, parte GLOBO: «¿A dónde te apetece ir?» a pantalla completa (Mapbox GL en modo globo), con los nombres que NUNCA se pisan.
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/pruebaV41_globo.mjs
// Las partes 1 y 2 (la función pura de los nombres y el código) no necesitan servidores; la 3 (la pantalla, en un Chrome con swiftshader para pintar WebGL) necesita Vite. No toca el Supabase de producción (?logrosDemo=1).
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
const CAP = 'docs/dias/V41_capturas'
fs.mkdirSync(CAP, { recursive: true })
const cargar = async (entrada) => {
  const b = await build({ entryPoints: [entrada], bundle: true, format: 'esm', platform: 'node', write: false, define: { 'import.meta.env': '{}' } })
  return import('data:text/javascript;base64,' + Buffer.from(b.outputFiles[0].text).toString('base64'))
}
const datos = JSON.parse(leer('data/primera_vez/destinos.json'))
const todos = [...datos.salida, ...datos.proximamente]
const de = (clave) => todos.find((d) => d.clave === clave)

/* ───────── 1. La función pura: qué nombres se ven a cada zoom ───────── */
console.log('1. La función pura de los nombres (sin navegador)')
const E = await cargar('src/lib/etiquetasDelGlobo.ts')
{
  const pr = E.prioridadDeDestino
  debe(pr({ listo: true, conViaje: true }) < pr({ listo: true }) && pr({ listo: true }) < pr({ listo: true, estuvo: true }) && pr({ listo: true, estuvo: true }) < pr({ listo: false }), 'prioridad', 'prioridad: tu viaje > listo > ya has estado > próximamente (la de Design)')
  // Proyección ortográfica de verdad: esfera de radio R (px) centrada en (cx, cy) y mirando a (lng0, lat0). R = 70 · 2^zoom aproxima el globo de Mapbox a ese zoom.
  const proyectar = (lng, lat, c, R, cx, cy) => {
    const f = (g) => (g * Math.PI) / 180
    const x = R * Math.cos(f(lat)) * Math.sin(f(lng - c.lng))
    const y = R * (Math.cos(f(c.lat)) * Math.sin(f(lat)) - Math.sin(f(c.lat)) * Math.cos(f(lat)) * Math.cos(f(lng - c.lng)))
    return { x: cx + x, y: cy - y }
  }
  const puntos = (c, zoom, estados = {}) => {
    const R = 70 * 2 ** zoom
    return todos.map((d) => {
      const p = proyectar(d.lng, d.lat, c, R, 195, 280)
      const e = estados[d.clave] ?? {}
      return { clave: d.clave, nombre: d.nombre, x: p.x, y: p.y, visible: E.enLaCara(c, d.lng, d.lat), prioridad: pr({ listo: datos.salida.some((s) => s.clave === d.clave), ...e }) }
    })
  }
  const vista = { ancho: 390, alto: 844, abajo: 290, arriba: 56 }
  // La regla que no se puede romper: ningún nombre pisa a otro, ni a un pin, ni se sale de la pantalla ni se mete debajo de la hoja.
  const limpio = (ps, et, v = vista) => {
    const malos = []
    for (let i = 0; i < et.length; i++) {
      const a = et[i].caja
      if (a[0] < 6 || a[2] > v.ancho - 6 || a[1] < (v.arriba ?? 0) || a[3] > v.alto - v.abajo) malos.push(`${et[i].clave} se sale`)
      for (let j = i + 1; j < et.length; j++) {
        const b = et[j].caja
        if (!(a[2] <= b[0] || a[0] >= b[2] || a[3] <= b[1] || a[1] >= b[3])) malos.push(`${et[i].clave} pisa a ${et[j].clave}`)
      }
      for (const p of ps.filter((q) => q.visible && q.clave !== et[i].clave)) if (!(a[2] <= p.x - 8 || a[0] >= p.x + 8 || a[3] <= p.y - 8 || a[1] >= p.y + 8)) malos.push(`${et[i].clave} tapa el pin de ${p.clave}`)
    }
    return malos
  }
  // Los tres de la queja: Roma, Florencia y Cartagena de Indias.
  const sinZoom = puntos({ lng: 4, lat: 43 }, 1.6, { roma: { estuvo: true } })
  const alejado = E.etiquetasVisibles(sinZoom, vista)
  const claves = alejado.map((e) => e.clave)
  const roma = sinZoom.find((p) => p.clave === 'roma')
  const flo = sinZoom.find((p) => p.clave === 'florencia')
  debe(Math.hypot(roma.x - flo.x, roma.y - flo.y) < 40, 'roma-florencia', `a zoom 1,6 Roma y Florencia están muy juntas en pantalla (${Math.round(Math.hypot(roma.x - flo.x, roma.y - flo.y))} px)`)
  debe(claves.includes('roma') && !claves.includes('florencia'), 'roma-florencia', `alejado, se ve Roma (la lista y con más prioridad) y Florencia no la tapa ni se pisan (${claves.join(', ')})`)
  debe(limpio(sinZoom, alejado).length === 0, 'no-se-pisan', `alejado: ningún nombre pisa nada (${limpio(sinZoom, alejado).join('; ') || 'limpio'})`)
  const cerca = puntos({ lng: 12, lat: 42.8 }, 4.4, { roma: { estuvo: true } })
  const etCerca = E.etiquetasVisibles(cerca, vista)
  debe(etCerca.some((e) => e.clave === 'roma') && etCerca.some((e) => e.clave === 'florencia'), 'roma-florencia', 'al acercar, salen Roma y Florencia las dos')
  debe(limpio(cerca, etCerca).length === 0, 'no-se-pisan', `acercado a Italia: ningún nombre pisa nada (${limpio(cerca, etCerca).join('; ') || 'limpio'})`)
  // Cartagena de Indias (el nombre más largo) pegada al borde derecho: no sale cortada; va a la izquierda de su pin o no sale, pero nunca cortada.
  for (const c of [{ lng: -40, lat: 20 }, { lng: -60, lat: 15 }, { lng: -75, lat: 10 }, { lng: -90, lat: 12 }, { lng: -100, lat: 20 }]) {
    for (const z of [1.2, 1.8, 2.6, 3.6]) {
      const ps = puntos(c, z)
      const et = E.etiquetasVisibles(ps, vista)
      const m = limpio(ps, et)
      debe(m.length === 0, 'cartagena', `centro ${c.lng},${c.lat} zoom ${z}: nada pisado ni cortado (${m.join('; ') || 'limpio'})`)
    }
  }
  const borde = puntos({ lng: -75.5 - 28, lat: 10.4 }, 2.2)
  const cart = borde.find((p) => p.clave === 'cartagena_de_indias')
  const etB = E.etiquetasVisibles(borde, vista).find((e) => e.clave === 'cartagena_de_indias')
  debe(!etB || (etB.caja[0] >= 6 && etB.caja[2] <= 384), 'cartagena', `Cartagena de Indias a ${Math.round(cart.x)} px del borde izquierdo de la pantalla: su nombre ${etB ? `va a la ${etB.lado === 'izq' ? 'izquierda' : 'derecha'} y cabe` : 'se esconde hasta acercar'}, nunca cortado`)
  const casi = puntos({ lng: -75.5 - 17, lat: 12 }, 2.4)
  const cp = casi.find((p) => p.clave === 'cartagena_de_indias')
  const etC = E.etiquetasVisibles(casi, vista).find((e) => e.clave === 'cartagena_de_indias')
  debe(cp.x > 250 && etC?.lado === 'izq' && etC.caja[0] >= 6, 'cartagena', `Cartagena de Indias cerca del borde derecho (x=${Math.round(cp.x)}): su nombre se pone a la izquierda y cabe entero`)
  // Barrido: miles de combinaciones de centro y zoom, y la regla se cumple en todas.
  let malas = 0
  let combos = 0
  for (let lng = -180; lng < 180; lng += 20) {
    for (let lat = -60; lat <= 70; lat += 20) {
      for (const z of [0.9, 1.4, 2, 2.8, 3.8, 5, 6.5]) {
        const ps = puntos({ lng, lat }, z)
        const et = E.etiquetasVisibles(ps, vista, { medir: (n) => n.length * 6.8 + 8 })
        combos++
        if (limpio(ps, et).length) malas++
      }
    }
  }
  debe(malas === 0, 'barrido', `en ${combos} combinaciones de centro y zoom, ningún nombre pisa a otro, a un pin ni se corta (${malas} malas)`)
  // Prioridad: entre dos que se pisan gana el de más prioridad, aunque llegue después.
  const dos = [
    { clave: 'a', nombre: 'Aaaaaa', x: 20, y: 200, visible: true, prioridad: 3 },
    { clave: 'b', nombre: 'Bbbbbb', x: 30, y: 204, visible: true, prioridad: 0 },
  ]
  const et2 = E.etiquetasVisibles(dos, vista)
  debe(et2.length === 1 && et2[0].clave === 'b', 'prioridad', 'dos nombres que se pisarían: se ve el de más prioridad')
  debe(E.etiquetasVisibles([{ ...dos[1], visible: false }], vista).length === 0, 'cara', 'un destino al otro lado del globo no tiene nombre')
  debe(E.enLaCara({ lng: 0, lat: 0 }, 10, 5) && !E.enLaCara({ lng: 0, lat: 0 }, 170, 5), 'cara', 'enLaCara: lo cercano sí, lo del otro lado no')
  debe(E.pinMasCercano(dos, 31, 203, 24) === 'b' && E.pinMasCercano(dos, 18, 199, 24) === 'a', 'toque', 'pinMasCercano encuentra el pin tocado')
  debe(E.pinMasCercano(dos, 10, 10, 24) === null && E.pinMasCercano(dos.map((p) => ({ ...p, visible: false })), 150, 200, 24) === null, 'toque', 'sin pin cerca (o al otro lado) no hay toque')
}

/* ───────── 2. El código ───────── */
console.log('2. El código')
{
  const mapa = sinComentarios(leer('src/components/primeraVez/MapaDeDestinos.tsx'))
  const globo = sinComentarios(leer('src/components/primeraVez/GloboDeDestinos.tsx'))
  debe(/lazy\(\(\) => import\('\.\/GloboDeDestinos'\)\)/.test(mapa) && !/from '\.\/GloboDeDestinos'/.test(mapa) && !/mapbox/i.test(mapa), 'mapbox', 'el globo grande se baja con un import() perezoso: la vista pequeña no trae ni usa Mapbox')
  debe(/\{globo && \(/.test(mapa), 'mapbox', 'y solo se monta (se crea su mapa) cuando está abierto: nunca escondido')
  debe(/projection: 'globe'/.test(globo) && /new mapboxgl\.Map\(/.test(globo) && (globo.match(/new mapboxgl\.Map\(/g) ?? []).length === 1, 'globo', 'un solo mapa de Mapbox, en proyección «globe»')
  debe(/creado\.remove\(\)/.test(globo) && /clearTimeout\(espera\)/.test(globo), 'mapbox', 'al cerrar, el mapa se destruye con map.remove() (y el primer montaje de StrictMode no llega a crear nada)')
  debe(/__cargasDeMapa/.test(globo) && /import\.meta\.env\.DEV/.test(globo), 'mapbox', 'en desarrollo cuenta las cargas de mapa (window.__cargasDeMapa)')
  debe(!/supabase|\.from\(|\brpc\(|fetch\(|llamar\(/.test(globo), 'consultas', 'el globo no hace NINGUNA consulta a Supabase ni a la API: usa lo que el Perfil ya tiene (useBola)')
  debe(!/Pisa|Marrakech|Cancún|Cancun|FLG|'it','|bandera:/i.test(globo), 'datos', 'ningún destino, estado ni bandera escritos a mano (nada del ejemplo de Design)')
  debe(/porContinente\(destinos\)/.test(globo) && /FlagIcon countryCode=\{d\.iso\}/.test(globo) && /estados\[d\.clave\]/.test(globo), 'datos', 'la lista sale de los destinos de la app, con la bandera de su país y su estado')
  debe(/prefers-reduced-motion/.test(globo) && /reducirMovimiento\(\) \? 0 :/.test(globo), 'movimiento', 'con «Reducir movimiento»: el vuelo, el ajuste y la hoja sin animación')
  debe(/data-globo-lista/.test(globo) && /140px \+ env\(safe-area-inset-bottom/.test(globo), 'zona-segura', 'la lista acaba por encima del «+» y de la zona segura')
  debe(!/\b(sello)\b/i.test(globo.replace(/\/\/.*$/gm, '')), 'textos', 'ni «sello» en lo que se ve')
  const cuerpo = sinComentarios(leer('src/components/logros/pantallas/perfil/CuerpoConLogros.tsx'))
  debe(/<MapaDeDestinos\b/.test(cuerpo) && !/GloboDeDestinos/.test(cuerpo), 'perfil', 'el Perfil sigue con su bloque «¿A dónde te apetece ir?» (la vista pequeña) y no carga el globo por su cuenta')
}

/* ───────── 3. La pantalla ───────── */
if (!(await fetch(APP).then((r) => r.ok).catch(() => false))) {
  console.log('3. (SIN VITE: la parte de la pantalla NO SE HA VERIFICADO)')
  console.log(`\nPrueba de la Tanda V41 (globo): ${comprobaciones} comprobaciones · ${fallos.length} fallos · PANTALLA SIN VERIFICAR`)
  process.exit(fallos.length ? 1 : 0)
}
console.log('3. En la app (390 x 844, Chrome con swiftshader)')
const RUTA = '/?cuentas=off&logros=on&logrosDemo=1&apertura=0&version=completa'
const a = await abrirApp(APP, { ruta: RUTA, ancho: 390, alto: 844 })
const esperar = async (js, n = 80) => {
  for (let i = 0; i < n; i++) {
    if (await a.evaluar(js).catch(() => false)) return true
    await a.esp(250)
  }
  return false
}
const J = async (js) => JSON.parse(await a.evaluar(`JSON.stringify(${js})`))
const raton = async (type, x, y, extra = {}) => a.cdp('Input.dispatchMouseEvent', { type, x, y, button: type === 'mouseMoved' ? 'none' : 'left', clickCount: 1, ...extra })
const toqueEn = async (x, y) => {
  await raton('mouseMoved', x, y)
  await raton('mousePressed', x, y)
  await raton('mouseReleased', x, y)
}
const arrastrar = async (x0, y0, x1, y1) => {
  await raton('mouseMoved', x0, y0)
  await raton('mousePressed', x0, y0)
  for (let i = 1; i <= 10; i++) {
    await raton('mouseMoved', x0 + ((x1 - x0) * i) / 10, y0 + ((y1 - y0) * i) / 10, { buttons: 1 })
    await a.esp(30)
  }
  await raton('mouseReleased', x1, y1)
}
const centro = () => J("(() => { const c = window.__globoMapa.getCenter(); return { lng: c.lng, lat: c.lat, zoom: window.__globoMapa.getZoom(), bearing: window.__globoMapa.getBearing() } })()")
const quieto = async () => {
  await a.evaluar("new Promise((r) => { const m = window.__globoMapa; if (!m.isMoving()) return r(true); m.once('moveend', () => r(true)); setTimeout(() => r(true), 8000) })")
  await a.esp(250)
}
const cajas = () =>
  J(`(() => { const R = (e) => { const b = e.getBoundingClientRect(); return [b.left, b.top, b.right, b.bottom] }; return { et: [...document.querySelectorAll('[data-globo-etiqueta]')].map((e) => ({ clave: e.getAttribute('data-globo-etiqueta'), caja: R(e) })), pines: [...document.querySelectorAll('[data-globo-pin]')].map((e) => { const b = e.getBoundingClientRect(); return { clave: e.getAttribute('data-globo-pin'), x: b.left, y: b.top } }) } })()`)
/** Mide los rectángulos de verdad en pantalla: ningún nombre pisa a otro ni a un pin ni se sale (el texto es lo que se pinta, sin el relleno de 4 px de cada lado). */
const midiendoPantalla = async (cuando) => {
  const { et, pines } = await cajas()
  const dentro = et.filter((e) => e.caja[0] >= 0 && e.caja[2] <= 390)
  const malos = []
  const recorte = (b) => [b[0] + 4, b[1] + 2, b[2] - 4, b[3] - 2]
  for (let i = 0; i < et.length; i++) {
    const A = recorte(et[i].caja)
    if (A[0] < 4 || A[2] > 386) malos.push(`${et[i].clave} cortado`)
    for (let j = i + 1; j < et.length; j++) {
      const B = recorte(et[j].caja)
      if (!(A[2] <= B[0] || A[0] >= B[2] || A[3] <= B[1] || A[1] >= B[3])) malos.push(`${et[i].clave} pisa a ${et[j].clave}`)
    }
    for (const p of pines.filter((q) => q.clave !== et[i].clave)) if (!(A[2] <= p.x - 2 || A[0] >= p.x + 2 || A[3] <= p.y - 2 || A[1] >= p.y + 2)) malos.push(`${et[i].clave} tapa el pin de ${p.clave}`)
  }
  debe(malos.length === 0, 'no-se-pisan-pantalla', `${cuando}: ${et.length} nombres (${et.map((e) => e.clave).join(', ')}), ninguno pisa a otro ni a un pin ni se corta (${malos.join('; ') || 'limpio'})`)
  return { et: dentro, pines }
}
const png = async (archivo) => {
  const r = await a.cdp('Page.captureScreenshot', { format: 'png' })
  fs.writeFileSync(archivo, Buffer.from(r.result.data, 'base64'))
}
try {
  await esperar("typeof window.__rutaPrueba === 'function'", 240)
  await a.evaluar('window.__rutaPrueba().then(() => true)')
  await a.esp(3000)
  for (let i = 0; i < 6; i++) {
    const h = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale)$/.test((x.textContent || '').trim()) || x.getAttribute('aria-label') === 'Cerrar'); if (!b) return false; b.click(); return true })()")
    if (!h) break
    await a.esp(700)
  }
  // Un viaje PRÓXIMO (dentro de 20 días) para que Roma salga con «Tu viaje».
  await a.evaluar("import('/src/store/useRouteStore.ts').then((m) => { const r = m.useRouteStore.getState().route; const f = (n) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10); m.useRouteStore.setState({ route: { ...r, answers: { ...r.answers, dateRange: { start: f(20), end: f(23) } } } }); return true })")
  await a.evaluar("import('/src/store/usePerfilUi.ts').then((m) => m.usePerfilUi.getState().abrir()); true")
  await esperar("Boolean(document.querySelector('[data-abrir-globo]'))", 80)
  await a.esp(1500)
  for (let i = 0; i < 6; i++) {
    const h = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale)$/.test((x.textContent || '').trim()) || x.getAttribute('aria-label') === 'Cerrar'); if (!b) return false; b.click(); return true })()")
    if (!h) break
    await a.esp(700)
  }

  // ---- El Perfil: la vista pequeña, sin ningún mapa de Mapbox ----
  const antes = await J("({ hay: Boolean(document.querySelector('[data-abrir-globo]')), svg: Boolean(document.querySelector('svg[data-mapa-destinos]')), lienzos: document.querySelectorAll('.mapboxgl-canvas').length, cargas: window.__cargasDeMapa ?? 0, titulo: /A dónde te\\s*apetece ir/i.test(document.querySelector('[data-mapa-primera-vez]')?.textContent ?? '') })")
  debe(antes.hay && antes.svg && antes.titulo, 'perfil', 'el Perfil lleva el bloque «¿A dónde te apetece ir?» con su vista pequeña (SVG) y el botón de abrirlo')
  debe(antes.lienzos === 0 && antes.cargas === 0, 'cargas', `con el Perfil abierto y el globo sin abrir: 0 mapas de Mapbox (lienzos ${antes.lienzos}, cargas ${antes.cargas})`)
  await a.evaluar("document.querySelector('[data-mapa-primera-vez]').scrollIntoView({ block: 'start' }); true")
  await a.esp(600)
  await png(`${CAP}/perfil_bloque_pequeno.png`)
  // La vista pequeña usa la misma regla: ningún nombre pisa a otro ni a un pin ni se corta por el borde del dibujo.
  const peq = await J("(() => { const sv = document.querySelector('svg[data-mapa-destinos]').getBoundingClientRect(); const R = (e) => { const b = e.getBoundingClientRect(); return [b.left, b.top, b.right, b.bottom] }; return { sv: [sv.left, sv.top, sv.right, sv.bottom], et: [...document.querySelectorAll('[data-etiqueta-pin]')].map((e) => ({ clave: e.getAttribute('data-etiqueta-pin'), caja: R(e) })), pines: [...document.querySelectorAll('[data-pin]')].map((e) => { const c = e.querySelector('circle:not([fill=transparent])') ?? e; const b = c.getBoundingClientRect(); return { clave: e.getAttribute('data-pin'), x: b.left + b.width / 2, y: b.top + b.height / 2 } }) } })()")
  const malosP = []
  for (let i = 0; i < peq.et.length; i++) {
    const A = peq.et[i].caja
    if (A[0] < peq.sv[0] + 1 || A[2] > peq.sv[2] - 1) malosP.push(peq.et[i].clave + ' cortado')
    for (let j = i + 1; j < peq.et.length; j++) {
      const B = peq.et[j].caja
      if (!(A[2] <= B[0] || A[0] >= B[2] || A[3] <= B[1] || A[1] >= B[3])) malosP.push(peq.et[i].clave + ' pisa a ' + peq.et[j].clave)
    }
    for (const q of peq.pines.filter((o) => o.clave !== peq.et[i].clave)) if (!(A[2] <= q.x - 5 || A[0] >= q.x + 5 || A[3] <= q.y - 5 || A[1] >= q.y + 5)) malosP.push(peq.et[i].clave + ' tapa el pin de ' + q.clave)
  }
  debe(peq.et.length > 0 && malosP.length === 0, 'no-se-pisan-pequena', `vista pequeña del Perfil: ${peq.et.length} nombres (${peq.et.map((e) => e.clave).join(', ')}), ninguno pisa a otro, a un pin ni se corta (${malosP.join('; ') || 'limpio'})`)
  const smallPins = await J("[...document.querySelectorAll('[data-pin]')].map((x) => ({ id: x.getAttribute('data-pin'), listo: x.getAttribute('data-listo'), estuvo: x.hasAttribute('data-estuvo'), viaje: x.hasAttribute('data-con-viaje') }))")
  const smallLista = await J("[...document.querySelectorAll('[data-destino-lista]')].map((x) => x.getAttribute('data-destino-lista'))")

  // ---- Abrirlo: tocar la vista pequeña ----
  await toqueEn(...Object.values(await J("(() => { const b = document.querySelector('svg[data-mapa-destinos] circle[fill=\"url(#mdMar)\"]').getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height * 0.1 } })()")))
  const abrio = await esperar("Boolean(document.querySelector('[data-globo-destinos]')) && window.__globoMapa && window.__globoMapa.loaded()", 160)
  debe(abrio, 'abrir', 'tocar la vista pequeña abre el globo a pantalla completa y el mapa carga')
  await a.esp(2500)
  const pant = await J("(() => { const b = document.querySelector('[data-globo-destinos]').getBoundingClientRect(); return { w: b.width, h: b.height, x: b.left, y: b.top, x: !!document.querySelector('[data-globo-cerrar]'), proy: window.__globoMapa.getProjection().name, lienzos: document.querySelectorAll('.mapboxgl-canvas').length, cargas: window.__cargasDeMapa, vivos: window.__mapasDelGlobo, estilos: performance.getEntriesByType('resource').filter((e) => /api\\.mapbox\\.com\\/styles\\/v1\\//.test(e.name)).length }})()")
  debe(pant.w === 390 && pant.h === 844 && pant.x === true, 'abrir', `a pantalla completa (${pant.w} x ${pant.h}) y con su X`)
  debe(pant.proy === 'globe', 'globo', `el mapa está en proyección «${pant.proy}»`)
  debe(pant.cargas === 1 && pant.vivos === 1 && pant.lienzos === 1, 'cargas', `abrirlo = 1 carga de mapa (cargas ${pant.cargas}, vivos ${pant.vivos}, lienzos ${pant.lienzos}; peticiones del estilo ${pant.estilos})`)
  debe(pant.estilos <= 1, 'cargas', `el estilo de Mapbox se pide una sola vez (${pant.estilos})`)
  await png(`${CAP}/globo_hoja_bajada.png`)
  const inicial = await midiendoPantalla('globo alejado')
  debe(inicial.et.some((e) => e.clave === 'roma'), 'nombres', 'Roma tiene su nombre a la vista al abrir')

  // ---- Estados y banderas: de los DATOS de la app ----
  const g = await J("(() => ({ tarjetas: [...document.querySelectorAll('[data-globo-tarjeta]')].map((x) => ({ clave: x.getAttribute('data-globo-tarjeta'), listo: x.getAttribute('data-listo'), nombre: x.querySelector('span:nth-of-type(2)')?.textContent, estado: x.querySelector('[data-globo-estado]')?.textContent, bandera: (x.querySelector('.fi')?.className.match(/fi-([a-z]{2})/) ?? [])[1] })), pines: [...document.querySelectorAll('[data-globo-pin]')].map((x) => ({ id: x.getAttribute('data-globo-pin'), listo: x.getAttribute('data-listo'), estuvo: x.hasAttribute('data-estuvo'), viaje: x.hasAttribute('data-con-viaje') })) }))()")
  debe(smallLista.length === 0 && g.tarjetas.length > 0 && smallPins.every((p) => g.tarjetas.some((t) => t.clave === p.id)), 'datos', `(V42) el Perfil ya no lleva la lista de destinos; el globo grande tiene sus ${g.tarjetas.length} tarjetas (${g.tarjetas.map((t) => t.clave).join(', ')}) y todos los pines pequeños están en ellas`)
  debe(!g.tarjetas.some((t) => /Pisa|Marrakech|Cancún/.test(t.nombre ?? '') && !todos.some((d) => d.clave === t.clave)), 'datos', 'ni Pisa, ni Marrakech, ni Cancún del ejemplo de Design (salvo que sea un destino real de la app)')
  debe(!g.tarjetas.some((t) => t.clave === 'pisa' || t.clave === 'marrakech'), 'datos', 'Pisa y Marrakech (solo del ejemplo) no están')
  debe(g.tarjetas.every((t) => t.bandera === de(t.clave)?.iso), 'banderas', `cada bandera es la de su país en los datos (${g.tarjetas.map((t) => `${t.clave}:${t.bandera}`).join(' ')})`)
  debe(g.tarjetas.filter((t) => de(t.clave) && t.listo === '1').every((t) => datos.salida.some((s) => s.clave === t.clave)) && g.tarjetas.filter((t) => t.listo === '0').every((t) => datos.proximamente.some((s) => s.clave === t.clave)), 'datos', 'los listos son de salida y los grises son los «Próximamente» de los datos')
  const roma = g.tarjetas.find((t) => t.clave === 'roma')
  const romaPequena = smallPins.find((p) => p.id === 'roma')
  const romaGrande = g.pines.find((p) => p.id === 'roma')
  debe(Boolean(romaGrande) && romaGrande.estuvo === romaPequena.estuvo && romaGrande.viaje === romaPequena.viaje, 'estados', `Roma, en el globo, tiene el mismo estado que en la vista pequeña (ya has estado ${romaGrande?.estuvo}, tu viaje ${romaGrande?.viaje})`)
  debe(/Tu viaje · \d+–\d+ [a-z]{3}/.test(roma.estado) === romaPequena.viaje && (romaPequena.viaje || /Ya has estado|Listo para crear/.test(roma.estado)), 'estados', `y su tarjeta dice lo mismo («${roma.estado}»)`)
  debe(g.tarjetas.filter((t) => t.listo === '0').every((t) => t.estado === 'Próximamente'), 'estados', 'los grises dicen «Próximamente»')
  const grises = g.pines.filter((p) => p.listo === '0')
  debe(grises.every((p) => !p.estuvo && !p.viaje), 'estados', 'un «Próximamente» no lleva ni aro ni ✓')
  debe(await J("(() => { const r = document.querySelector('[data-globo-pin=\"roma\"]'); return Boolean(r && ((r.hasAttribute('data-con-viaje') && r.querySelector('[data-pin-destacado]')) || (r.hasAttribute('data-estuvo') && r.querySelector('[data-pin-visto]')) || (!r.hasAttribute('data-estuvo') && !r.hasAttribute('data-con-viaje')))) })()"), 'estados', 'el pin lleva lo suyo: aro dorado con «Tu viaje», ✓ dorado con «Ya has estado»')

  // ---- Gira al arrastrar y se acerca ----
  const c0 = await centro()
  await arrastrar(250, 250, 90, 260)
  await quieto()
  const c1 = await centro()
  debe(Math.abs(c1.lng - c0.lng) > 8, 'gira', `al arrastrar con el dedo el globo gira (longitud del centro ${c0.lng.toFixed(1)} → ${c1.lng.toFixed(1)})`)
  debe(Math.abs(c1.bearing) < 1, 'gira', 'sin rotar la brújula (el norte sigue arriba)')
  await arrastrar(200, 250, 200, 140)
  await quieto()
  const c2 = await centro()
  debe(Math.abs(c2.lat - c1.lat) > 3, 'gira', `y también hacia arriba y abajo (latitud ${c1.lat.toFixed(1)} → ${c2.lat.toFixed(1)})`)
  await a.cdp('Input.dispatchMouseEvent', { type: 'mouseWheel', x: 195, y: 250, deltaX: 0, deltaY: -400 })
  await a.esp(900)
  await quieto()
  const c3 = await centro()
  debe(c3.zoom > c2.zoom + 0.3, 'zoom', `se acerca (zoom ${c2.zoom.toFixed(2)} → ${c3.zoom.toFixed(2)})`)
  // Dos dedos (pellizco) de verdad, con eventos táctiles.
  await a.cdp('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 })
  const z4 = (await centro()).zoom
  const toques = (type, p1, p2) => a.cdp('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [p1, p2] })
  await toques('touchStart', { x: 170, y: 250, id: 1 }, { x: 220, y: 250, id: 2 })
  for (let i = 1; i <= 8; i++) {
    await toques('touchMove', { x: 170 - i * 12, y: 250, id: 1 }, { x: 220 + i * 12, y: 250, id: 2 })
    await a.esp(40)
  }
  await toques('touchEnd')
  await a.esp(900)
  await quieto()
  const z5 = (await centro()).zoom
  debe(z5 > z4 + 0.2, 'zoom', `con dos dedos (pellizco) también se acerca (zoom ${z4.toFixed(2)} → ${z5.toFixed(2)})`)
  await a.cdp('Emulation.setTouchEmulationEnabled', { enabled: false })

  // ---- Roma, Florencia y Cartagena de Indias: los nombres no se pisan, medidos en pantalla ----
  await a.evaluar("window.__globoMapa.jumpTo({ center: [4, 43], zoom: 1.6 }); true")
  await a.esp(900)
  const alej = await midiendoPantalla('Europa alejada')
  const verRoma = alej.et.some((e) => e.clave === 'roma')
  const verFlo = alej.et.some((e) => e.clave === 'florencia')
  debe(verRoma && !(verRoma && verFlo && false), 'roma-florencia', `alejado, Roma se lee (Florencia ${verFlo ? 'también, separadas' : 'espera a que se acerque'})`)
  await a.evaluar("window.__globoMapa.jumpTo({ center: [12, 42.8], zoom: 5 }); true")
  await a.esp(900)
  const itA = await midiendoPantalla('Italia acercada')
  debe(itA.et.some((e) => e.clave === 'roma') && itA.et.some((e) => e.clave === 'florencia'), 'roma-florencia', 'acercando a Italia salen Roma y Florencia, cada una con su nombre')
  for (const z of [1.2, 2.2, 3.2]) {
    await a.evaluar(`window.__globoMapa.jumpTo({ center: [-75.5, 10.4], zoom: ${z} }); true`)
    await a.esp(900)
    const cc = await midiendoPantalla(`Cartagena de Indias a zoom ${z}`)
    const e = cc.et.find((q) => q.clave === 'cartagena_de_indias')
    debe(!e || (e.caja[0] >= 4 && e.caja[2] <= 386), 'cartagena', `zoom ${z}: Cartagena de Indias ${e ? 'se lee entera' : 'espera a que se acerque'}, nunca cortada`)
  }
  for (const lng of [-110, -95, -60, -35]) {
    await a.evaluar(`window.__globoMapa.jumpTo({ center: [${lng}, 12], zoom: 2.4 }); true`)
    await a.esp(700)
    await midiendoPantalla(`América desde ${lng}°`)
  }
  await a.evaluar("window.__globoMapa.jumpTo({ center: [4, 43], zoom: 1.6 }); true")
  await a.esp(700)

  // ---- La hoja baja y sube ----
  const hoja0 = await J("(() => { const h = document.querySelector('[data-globo-hoja]').getBoundingClientRect(); return { top: h.top, estado: document.querySelector('[data-globo-destinos]').getAttribute('data-hoja') } })()")
  debe(hoja0.estado === 'baja' && Math.abs(hoja0.top - 844 * 0.66) < 4, 'hoja', `al abrir la hoja está bajada (arriba en ${Math.round(hoja0.top)} de 844): se ve casi todo el globo`)
  const asa = await J("(() => { const b = document.querySelector('[data-globo-asa]').getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 } })()")
  await toqueEn(asa.x, asa.y)
  await a.esp(900)
  const hoja1 = await J("(() => { const h = document.querySelector('[data-globo-hoja]').getBoundingClientRect(); return { top: h.top, estado: document.querySelector('[data-globo-destinos]').getAttribute('data-hoja') } })()")
  debe(hoja1.estado === 'sube' && Math.abs(hoja1.top - 844 * 0.18) < 4, 'hoja', `tocando el asa sube (arriba en ${Math.round(hoja1.top)}): la lista por continentes`)
  const continentes = await J("[...document.querySelectorAll('[data-globo-continente]')].map((x) => x.getAttribute('data-globo-continente'))")
  debe(continentes.length >= 2 && continentes[0] === 'Europa', 'hoja', `la lista va por continentes (${continentes.join(', ')})`)
  await png(`${CAP}/globo_hoja_subida.png`)
  const asa2 = await J("(() => { const b = document.querySelector('[data-globo-asa]').getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 } })()")
  await arrastrar(asa2.x, asa2.y, asa2.x, asa2.y + 120)
  await a.esp(900)
  debe((await a.evaluar("document.querySelector('[data-globo-destinos]').getAttribute('data-hoja')")) === 'baja', 'hoja', 'arrastrando el asa hacia abajo, la hoja baja')
  const asa3 = await J("(() => { const b = document.querySelector('[data-globo-asa]').getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 } })()")
  await arrastrar(asa3.x, asa3.y, asa3.x, asa3.y - 120)
  await a.esp(900)
  debe((await a.evaluar("document.querySelector('[data-globo-destinos]').getAttribute('data-hoja')")) === 'sube', 'hoja', 'y hacia arriba, sube')
  // Ninguna tarjeta queda tapada por el «+»: con la lista hasta el final, la última acaba por encima del botón.
  await a.evaluar("(() => { const l = document.querySelector('[data-globo-lista]'); l.scrollTop = l.scrollHeight; return true })()")
  await a.esp(500)
  const zs = await J("(() => { const m = document.querySelector('[data-globo-mas]').getBoundingClientRect(); const ts = [...document.querySelectorAll('[data-globo-tarjeta]')].map((t) => { const b = t.getBoundingClientRect(); return { c: t.getAttribute('data-globo-tarjeta'), b: b.bottom, l: b.left, r: b.right } }); const ultimas = ts.filter((t) => t.b > 700); return { mas: m.top, masL: m.left, hasta: Math.max(...ts.map((t) => t.b)), ultimas, alto: innerHeight, lista: document.querySelector('[data-globo-lista]').getBoundingClientRect().bottom } })()")
  debe(zs.hasta <= zs.mas - 4, 'zona-segura', `con la lista hasta el final, la última tarjeta acaba en ${Math.round(zs.hasta)} y el «+» empieza en ${Math.round(zs.mas)}: ninguna queda tapada`)
  debe(zs.hasta <= zs.alto - 90, 'zona-segura', `y deja ${Math.round(zs.alto - zs.hasta)} px libres abajo`)
  await a.evaluar("(() => { document.querySelector('[data-globo-lista]').scrollTop = 0; return true })()")
  await toqueEn(asa.x, (await J("(() => { const b = document.querySelector('[data-globo-asa]').getBoundingClientRect(); return b.top + b.height / 2 })()")))
  await a.esp(800)

  // ---- Tocar una tarjeta: el globo gira hasta el destino y sale su hoja de siempre ----
  await a.evaluar("window.__globoMapa.jumpTo({ center: [-60, 20], zoom: 1.4 }); true")
  await a.esp(600)
  await a.evaluar("document.querySelector('[data-globo-destinos]').getAttribute('data-hoja') === 'baja' || document.querySelector('[data-globo-asa]').click(); true")
  await a.esp(600)
  if ((await a.evaluar("document.querySelector('[data-globo-destinos]').getAttribute('data-hoja')")) === 'baja') {
    const asaB = await J("(() => { const b = document.querySelector('[data-globo-asa]').getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 } })()")
    await toqueEn(asaB.x, asaB.y)
    await a.esp(700)
  }
  const tc = await J("(() => { const t = document.querySelector('[data-globo-tarjeta=\"roma\"]'); t.scrollIntoView({ block: 'center' }); const b = t.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 } })()")
  await toqueEn(tc.x, tc.y)
  await esperar("Boolean(document.querySelector('[data-tarjeta-destino=\"roma\"]'))", 40)
  await quieto()
  await a.esp(600)
  const ct = await centro()
  const hojaRoma = await J("(() => { const c = document.querySelector('[data-tarjeta-destino=\"roma\"]'); return { hay: Boolean(c), crear: c?.querySelector('[data-crear-viaje-destino]')?.textContent?.trim() ?? null, abrir: Boolean(c?.querySelector('[data-abrir-mi-viaje]')), verLogros: Boolean(c?.querySelector('[data-ver-mis-logros]')), verDestino: Boolean(c?.querySelector('[data-ver-destino]')), titulo: c?.getAttribute('aria-label') } })()")
  debe(Math.abs(ct.lng - 12.5) < 1.5 && Math.abs(ct.lat - 41.9) < 1.5, 'tarjeta', `al tocar la tarjeta de Roma el globo gira hasta Roma (centro ${ct.lng.toFixed(1)}, ${ct.lat.toFixed(1)})`)
  debe(hojaRoma.hay && (hojaRoma.abrir || hojaRoma.crear), 'tarjeta', `y sale la hoja de siempre de Roma (${hojaRoma.abrir ? '[Abrir mi viaje]' : hojaRoma.crear}${hojaRoma.verLogros ? ', [Ver mis logros]' : ''})`)
  const posRoma = await J("(() => { const p = document.querySelector('[data-globo-pin=\"roma\"]').getBoundingClientRect(); const c = document.querySelector('[data-tarjeta-destino=\"roma\"] > div:last-child').getBoundingClientRect(); return { y: p.top, tarjetaArriba: c.top } })()")
  debe(posRoma.y < posRoma.tarjetaArriba - 20, 'tarjeta', `Roma queda a la vista, por encima de la hoja (pin en ${Math.round(posRoma.y)}, la hoja empieza en ${Math.round(posRoma.tarjetaArriba)})`)
  await png(`${CAP}/globo_tarjeta_roma.png`)
  // Cerrar la hoja y tocar un PIN de otro destino (Florencia, un «Próximamente»): el globo vuela y sale su [Avísame].
  await a.evaluar("document.querySelector('[data-tarjeta-destino] > div')?.click(); true")
  await a.esp(900)
  await quieto()
  debe(!(await a.evaluar("Boolean(document.querySelector('[data-tarjeta-destino]'))")), 'tarjeta', 'cerrando la hoja, vuelve el globo')
  await a.evaluar("window.__globoMapa.jumpTo({ center: [11.25, 43.7], zoom: 6 }); true")
  await a.esp(1000)
  const pinF = await J("(() => { const p = document.querySelector('[data-globo-pin=\"florencia\"]'); const b = p.getBoundingClientRect(); return { x: b.left, y: b.top } })()")
  await toqueEn(pinF.x, pinF.y)
  const sale = await esperar("Boolean(document.querySelector('[data-tarjeta-destino=\"florencia\"] [data-avisame]'))", 40)
  debe(sale, 'pin', 'tocar el pin de Florencia (Próximamente) abre su hoja con [Avísame]')
  await quieto()
  await a.evaluar("document.querySelector('[data-tarjeta-destino] > div')?.click(); true")
  await a.esp(700)
  // Tocar el pin de Roma muy cerca del de Florencia: toca el que está debajo del dedo.
  await a.evaluar("window.__globoMapa.jumpTo({ center: [12.5, 42], zoom: 6 }); true")
  await a.esp(1000)
  const pinR = await J("(() => { const b = document.querySelector('[data-globo-pin=\"roma\"]').getBoundingClientRect(); return { x: b.left, y: b.top } })()")
  await toqueEn(pinR.x, pinR.y)
  debe(await esperar("Boolean(document.querySelector('[data-tarjeta-destino=\"roma\"]'))", 40), 'pin', 'tocar el pin de Roma abre la hoja de Roma')
  await quieto()
  await a.evaluar("document.querySelector('[data-tarjeta-destino] > div')?.click(); true")
  await a.esp(700)

  // ---- Reducir movimiento: el vuelo no dura ----
  await a.cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] })
  await a.evaluar("window.__globoMapa.jumpTo({ center: [-60, 20], zoom: 1.5 }); true")
  await a.esp(600)
  await a.evaluar("(() => { if (document.querySelector('[data-globo-destinos]').getAttribute('data-hoja') === 'baja') document.querySelector('[data-globo-asa]').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientY: 600 })), window.dispatchEvent(new PointerEvent('pointerup', { clientY: 600 })); return true })()")
  await a.esp(700)
  const tb = await J("(() => { const t = document.querySelector('[data-globo-tarjeta=\"berlin\"]'); t.scrollIntoView({ block: 'center' }); const b = t.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 } })()")
  await toqueEn(tb.x, tb.y)
  await esperar("Boolean(document.querySelector('[data-tarjeta-destino=\"berlin\"]'))", 40)
  await a.esp(450)
  const rm = await centro()
  debe(Math.abs(rm.lng - 13.4) < 2 && Math.abs(rm.lat - 52.5) < 2, 'reducir-movimiento', `con «Reducir movimiento» el globo llega a Berlín sin animación larga (a los 450 ms está en ${rm.lng.toFixed(1)}, ${rm.lat.toFixed(1)})`)
  await a.evaluar("document.querySelector('[data-tarjeta-destino] > div')?.click(); true")
  await a.cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] })
  await a.esp(500)

  // ---- Cerrar con la X: el mapa se destruye ----
  await a.evaluar("window.__globoMapa.jumpTo({ center: [4, 43], zoom: 1.6 }); true")
  const x = await J("(() => { const b = document.querySelector('[data-globo-cerrar]').getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2, w: b.width, h: b.height } })()")
  debe(x.w >= 44 && x.h >= 44, 'zona-toque', `la X se toca bien (${x.w} x ${x.h})`)
  await toqueEn(x.x, x.y)
  await a.esp(900)
  const cerrado = await J("({ pantalla: Boolean(document.querySelector('[data-globo-destinos]')), lienzos: document.querySelectorAll('.mapboxgl-canvas').length, mapas: document.querySelectorAll('.mapboxgl-map').length, vivos: window.__mapasDelGlobo, cargas: window.__cargasDeMapa, perfil: Boolean(document.querySelector('[data-mapa-primera-vez]')) })")
  debe(!cerrado.pantalla && cerrado.perfil, 'cerrar', 'la X cierra el globo y se vuelve al Perfil')
  debe(cerrado.vivos === 0 && cerrado.lienzos === 0 && cerrado.mapas === 0, 'cerrar', `y el mapa se destruye (map.remove): vivos ${cerrado.vivos}, lienzos ${cerrado.lienzos}`)
  debe(cerrado.cargas === 1, 'cargas', `abrir y cerrar = 1 carga de mapa en total (cerrar no carga ninguna: ${cerrado.cargas})`)
  // Abrirlo otra vez es otra carga (y solo una); nunca dos a la vez.
  await a.evaluar("document.querySelector('[data-abrir-globo]').click(); true")
  await esperar("Boolean(document.querySelector('[data-globo-destinos]')) && window.__globoMapa && window.__globoMapa.loaded()", 160)
  await a.esp(1200)
  const otra = await J("({ cargas: window.__cargasDeMapa, vivos: window.__mapasDelGlobo, lienzos: document.querySelectorAll('.mapboxgl-canvas').length })")
  debe(otra.cargas === 2 && otra.vivos === 1 && otra.lienzos === 1, 'cargas', `abrirlo otra vez = una carga más (${otra.cargas} en total) y nunca dos mapas vivos (${otra.vivos})`)
  // El «+» del globo abre «¿Qué quieres hacer?» y cierra el globo.
  const mas = await J("(() => { const b = document.querySelector('[data-globo-mas]').getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 } })()")
  await toqueEn(mas.x, mas.y)
  await a.esp(1200)
  const trasMas = await J("({ globo: Boolean(document.querySelector('[data-globo-destinos]')), vivos: window.__mapasDelGlobo, hoja: /Qué quieres hacer/i.test(document.body.innerText) })")
  debe(!trasMas.globo && trasMas.vivos === 0, 'mas', 'el «+» del globo lo cierra (y destruye su mapa)')
  debe(trasMas.hoja, 'mas', 'y abre «¿Qué quieres hacer?»')
} finally {
  a.cerrar()
}

console.log(`\nPrueba de la Tanda V41 (globo): ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
process.exit(fallos.length ? 1 : 0)
