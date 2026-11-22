// La prueba de la Tanda V39, parte BOLA DEL MUNDO PARA TODOS: «¿A dónde te apetece ir?» sale en el Perfil de todos (debajo del pasaporte), con «Ya has estado», «Tu viaje» y «Lo que llevas».
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/pruebaV39_bola.mjs
// La parte del servidor y de los datos no necesita servidores; la de la pantalla necesita Vite. Ninguna parte toca el Supabase de producción (la app usa la demo de logros, ?logrosDemo=1).
import fs from 'node:fs'
import { build } from 'esbuild'
import { abrirApp } from './_enLaApp.mjs'
import { escenario } from './generarDemoGanados.mjs'
import { destinosDeLaPersona } from '../../server/logros/pantallas/perfil.js'

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
const CAP = 'docs/dias/V39_capturas'
fs.mkdirSync(CAP, { recursive: true })
const cargar = async (entrada) => {
  const b = await build({ entryPoints: [entrada], bundle: true, format: 'esm', platform: 'node', write: false, define: { 'import.meta.env': '{}' } })
  return import('data:text/javascript;base64,' + Buffer.from(b.outputFiles[0].text).toString('base64'))
}

/* ───────── 1. El servidor: lo que lleva en cada destino, dentro de la respuesta del Perfil ───────── */
console.log('1. El Perfil manda lo que lleva en cada destino donde ya ha estado')
{
  const lleno = escenario({ completo: true })
  const r = destinosDeLaPersona({ datos: lleno.datos, items: lleno.items })
  debe(r.length === 1 && r[0].clave === 'roma', 'servidor', `quien ha estado en Roma lleva su Roma (${JSON.stringify(r.map((x) => x.clave))})`)
  const roma = r[0]
  debe(roma.medallas.total >= roma.medallas.n && roma.medallas.n > 0 && roma.colecciones.total > 0 && roma.secretos.total > 0, 'servidor', `con sus tres números «n de total»: ${roma.medallas.n} de ${roma.medallas.total} medallas, ${roma.colecciones.n} de ${roma.colecciones.total} colecciones, ${roma.secretos.n} de ${roma.secretos.total} secretos`)
  const vacio = escenario({ completo: false })
  debe(destinosDeLaPersona({ datos: vacio.datos, items: vacio.items }).length === 0, 'servidor', 'quien no ha ganado nada no lleva ningún destino')
  const src = sinComentarios(leer('server/logros/pantallas/perfil.js'))
  debe(/destinos: destinosDeLaPersona\(\{ datos, items \}\)/.test(src), 'servidor', 'va dentro de la respuesta del Perfil (una sola petición, sin preguntar nada más)')
  const fn = /export function destinosDeLaPersona[\s\S]*?\n}\n/.exec(src)?.[0] ?? ''
  debe(!/supabase|await |fetch\(|repo\./.test(fn), 'servidor', 'y se calcula de lo ya cargado: ni una consulta nueva')
}

/* ───────── 2. Lo que dice cada destino (puro) ───────── */
console.log('2. Cada destino dice lo suyo')
const B = await cargar('src/lib/bolaDelMundo.ts')
{
  const destinos = [
    { clave: 'roma', nombre: 'Roma', pais: 'Italia', iso: 'it', continente: 'Europa', lat: 41.9, lng: 12.5, listo: true, linea: null, portada: null },
    { clave: 'lanzarote', nombre: 'Lanzarote', pais: 'España', iso: 'es', continente: 'Europa', lat: 29, lng: -13.6, listo: true, linea: null, portada: null },
    { clave: 'cancun', nombre: 'Cancún', pais: 'México', iso: 'mx', continente: 'América', lat: 21.1, lng: -86.8, listo: true, linea: null, portada: null },
    { clave: 'tokio', nombre: 'Tokio', pais: 'Japón', iso: 'jp', continente: 'Asia', lat: 35.7, lng: 139.7, listo: false, linea: null, portada: null },
  ]
  const viaje = (o) => ({ id: 'v', destino: 'Roma', ciudades: ['Roma'], fase: 'proximo', inicioIso: '2026-11-26', cuando: '26 – 29 nov 2026', ...o })
  const llevas = { clave: 'roma', medallas: { n: 2, total: 4 }, colecciones: { n: 3, total: 11 }, secretos: { n: 4, total: 12 } }
  let e = B.estadosDeLaBola(destinos, [], [llevas])
  debe(e.roma?.estuvo === true && e.roma.llevas?.medallas.n === 2 && !e.roma.viaje && !e.lanzarote && !e.cancun, 'estados', 'donde ya ha estado: «ya has estado», con lo que lleva; los demás, nada')
  e = B.estadosDeLaBola(destinos, [viaje({})], null)
  debe(e.roma?.viaje?.cuando === '26–29 nov' && e.roma.viaje.id === 'v' && !e.roma.estuvo, 'estados', `con un viaje próximo: «Tu viaje · 26–29 nov» (${e.roma?.viaje?.cuando}) sin «ya has estado»`)
  e = B.estadosDeLaBola(destinos, [viaje({ fase: 'hecho' })], null)
  debe(e.roma?.estuvo === true && !e.roma.viaje && e.roma.llevas === null, 'estados', 'un viaje ya hecho cuenta como «ya has estado» aunque no haya logros (los logros apagados)')
  e = B.estadosDeLaBola(destinos, [viaje({})], [llevas])
  debe(e.roma?.estuvo === true && e.roma.viaje && e.roma.llevas, 'estados', 'ha estado Y tiene otro viaje: las dos cosas')
  e = B.estadosDeLaBola(destinos, [viaje({ destino: 'Cancún', ciudades: ['Cancun'] })], null)
  debe(e.cancun?.viaje && !e.roma, 'estados', 'el viaje se casa con su destino sin tildes ni mayúsculas (Cancún / Cancun)')
  e = B.estadosDeLaBola(destinos, [viaje({ destino: 'Tokio', ciudades: ['Tokio'] })], [{ ...llevas, clave: 'tokio' }])
  debe(Object.keys(e).length === 0, 'estados', 'un destino «Próximamente» no dice nada (sigue en gris con su [Avísame])')
  debe(B.nDeTotal({ n: 2, total: 4 }) === '2 de 4' && B.cuandoCorto('26 – 29 nov 2026') === '26–29 nov', 'estados', 'los formatos: «2 de 4» y «26–29 nov»')
}

/* ───────── 3. El código ───────── */
console.log('3. El código')
{
  const mapa = sinComentarios(leer('src/components/primeraVez/MapaDeDestinos.tsx'))
  debe(/if \(paraTodos\) return\s*\n\s*precargarDestinos/.test(mapa), 'peticiones', 'en el Perfil de quien ya viaja no se piden por adelantado los números de cada destino (una petición por destino): solo al tocar uno')
  debe(!/mapbox/i.test(mapa) && !/fetch\(|supabase/i.test(sinComentarios(leer('src/lib/bolaDelMundo.ts'))), 'peticiones', 'la bola no usa Mapbox ni hace ninguna consulta propia')
  const cuerpo = sinComentarios(leer('src/components/logros/pantallas/perfil/CuerpoConLogros.tsx'))
  debe(/<MapaDeDestinos paraTodos viajes=\{viajes\} destinosDelPerfil=\{perfil\?\.destinos \?\? null\} onAbrirViaje=\{onAbrirViaje\} \/>/.test(cuerpo) && /const nuevoViajero = cuenta\.tipo === 'cuenta' && viajes\.length === 0/.test(cuerpo), 'perfil', 'el nuevo, igual que antes (arriba); quien ya viaja, la bola con sus viajes y lo que lleva')
  const iPasaporte = cuerpo.indexOf('<TarjetaPasaporte pasaporte={perfil.pasaporte}')
  const iBola = cuerpo.indexOf('data-bola-del-perfil', iPasaporte)
  debe(iPasaporte > 0 && iBola > iPasaporte, 'perfil', 'la bola va DEBAJO del pasaporte')
  const tarjeta = sinComentarios(leer('src/components/primeraVez/TarjetaDeDestino.tsx'))
  debe(/LO QUE LLEVAS/.test(tarjeta) && /Ver mis logros de \{destino\.nombre\}/.test(tarjeta) && /Crear otro viaje/.test(tarjeta) && /Abrir mi viaje/.test(tarjeta), 'tarjeta', 'la tarjeta: «Lo que llevas», [Ver mis logros de Roma], [Crear otro viaje] y [Abrir mi viaje]')
  debe(/empezarViajeNuevo\(curado\)/.test(tarjeta), 'tarjeta', '[Crear viaje] / [Crear otro viaje] abren ORIGEN/DESTINO con el destino ya puesto (como en la V31)')
}

/* ───────── 4. La pantalla ───────── */
if (!(await fetch(APP).then((r) => r.ok).catch(() => false))) {
  console.log('4. (SIN VITE: la parte de la pantalla NO SE HA VERIFICADO)')
  console.log(`\nPrueba de la Tanda V39 (bola): ${comprobaciones} comprobaciones · ${fallos.length} fallos · PANTALLA SIN VERIFICAR`)
  process.exit(fallos.length ? 1 : 0)
}
console.log('4. En la app (390 x 844)')
const RUTA = '/?cuentas=off&logros=on&logrosDemo=1&apertura=0&version=completa'
const a = await abrirApp(APP, { ruta: RUTA, ancho: 390, alto: 844 })
const esperar = async (js, n = 80) => {
  for (let i = 0; i < n; i++) {
    if (await a.evaluar(js).catch(() => false)) return true
    await a.esp(250)
  }
  return false
}
const toque = async (sel) => {
  const r = JSON.parse(await a.evaluar(`(() => { const e = document.querySelector('${sel}'); e.scrollIntoView({ block: 'center' }); const b = e.getBoundingClientRect(); return JSON.stringify({ x: b.left + b.width / 2, y: b.top + b.height / 2 }) })()`))
  for (const type of ['mouseMoved', 'mousePressed', 'mouseReleased']) await a.cdp('Input.dispatchMouseEvent', { type, x: r.x, y: r.y, button: 'left', clickCount: 1 })
}
try {
  await esperar("typeof window.__rutaPrueba === 'function'", 240)
  await a.evaluar('window.__rutaPrueba().then(() => true)')
  await a.esp(3000)
  for (let i = 0; i < 6; i++) {
    const h = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale|Cerrar)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
    if (!h) break
    await a.esp(600)
  }
  const avisos = async () => {
    for (let i = 0; i < 6; i++) {
      const h = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale)$/.test((x.textContent || '').trim()) || x.getAttribute('aria-label') === 'Cerrar'); if (!b) return false; b.click(); return true })()")
      if (!h) break
      await a.esp(700)
    }
  }
  // (El viaje de la prueba pasa a ser un viaje PRÓXIMO: dentro de 20 días.)
  await a.evaluar("import('/src/store/useRouteStore.ts').then((m) => { const r = m.useRouteStore.getState().route; const f = (n) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10); m.useRouteStore.setState({ route: { ...r, answers: { ...r.answers, dateRange: { start: f(20), end: f(23) } } } }); return true })")
  await a.evaluar("import('/src/store/usePerfilUi.ts').then((m) => m.usePerfilUi.getState().abrir()); true")
  await esperar("Boolean(document.querySelector('[data-bola-del-perfil]'))", 80)
  await a.esp(1500)
  await avisos()
  await esperar("Boolean(document.querySelector('[data-bola-del-perfil]'))", 40)
  const p = JSON.parse(await a.evaluar(`JSON.stringify((() => { const b = document.querySelector('[data-bola-del-perfil]'); const pas = document.querySelector('[data-tarjeta-pasaporte]') ?? [...document.querySelectorAll('section,div')].find((x) => /Mi pasaporte/i.test(x.textContent || '') && x.querySelector('svg')); return { bola: Boolean(b), paraTodos: Boolean(b?.querySelector('[data-mapa-primera-vez][data-para-todos]')), titulo: /A dónde te\\s*apetece ir/i.test(b?.textContent ?? ''), pines: [...document.querySelectorAll('[data-pin]')].map((x) => ({ id: x.getAttribute('data-pin'), estuvo: x.hasAttribute('data-estuvo'), viaje: x.hasAttribute('data-con-viaje') })), etiquetas: [...document.querySelectorAll('[data-etiqueta-destino]')].map((x) => [x.closest('[data-destino-lista]')?.getAttribute('data-destino-lista'), x.getAttribute('data-etiqueta-destino'), x.textContent.trim()]), pasaporteAntes: pas && b ? Boolean(pas.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) : null, misViajes: Boolean(document.querySelector('[data-mis-viajes]')) } })())`))
  debe(p.bola && p.paraTodos && p.titulo, 'perfil', 'el Perfil de quien ya viaja lleva «¿A dónde te apetece ir?»')
  debe(p.misViajes, 'perfil', 'y sigue siendo su Perfil de siempre (con «Mis viajes»)')
  debe(p.pasaporteAntes === true || p.pasaporteAntes === null, 'perfil', 'la bola está debajo del pasaporte')
  const roma = p.pines.find((x) => x.id === 'roma')
  debe(roma?.estuvo === true && roma.viaje === true, 'pin', 'Roma, donde ya ha estado y con un viaje próximo: el pin con su ✓ dorado y destacado')
  debe(p.etiquetas.some(([d, k, t]) => d === 'roma' && /^Tu viaje · \d+–\d+ [a-z]{3}/.test(t)), 'lista', `y en la lista dice lo suyo (${p.etiquetas.map((x) => `${x[0]}: ${x[2]}`).join(' | ')})`)
  // Los textos de cada recuadro de la lista quedan DENTRO de su recuadro y con margen (Eric: «que se entiendan bien»): nada se sale ni toca el borde.
  const fuera = JSON.parse(await a.evaluar(`JSON.stringify([...document.querySelectorAll('[data-destino-lista]')].flatMap((b) => { const r = b.getBoundingClientRect(); return [...b.querySelectorAll('span')].filter((s) => s.children.length === 0 && (s.textContent || '').trim()).filter((s) => { const q = s.getBoundingClientRect(); return q.left < r.left + 5 || q.right > r.right - 5 || q.top < r.top + 3 || q.bottom > r.bottom - 3 || s.scrollWidth > s.clientWidth + 1 }).map((s) => b.getAttribute('data-destino-lista') + ': ' + s.textContent.trim()) }))`))
  debe(fuera.length === 0, 'margen', `todos los textos de la lista quedan dentro de su recuadro, con margen (${fuera.join(' | ') || 'todos dentro'})`)
  await a.evaluar("document.querySelector('[data-bola-del-perfil]').scrollIntoView({ block: 'start' }); true")
  await a.esp(500)
  await a.captura(`${CAP}/bola_en_el_perfil_con_viajes.jpg`)
  // Tocar Roma: «Lo que llevas».
  await toque('[data-destino-lista="roma"]')
  await esperar("Boolean(document.querySelector('[data-tarjeta-destino=\"roma\"]'))", 40)
  await a.esp(800)
  const t = JSON.parse(await a.evaluar(`JSON.stringify((() => { const c = document.querySelector('[data-tarjeta-destino="roma"]'); return { titulo: c?.querySelector('[data-titulo-llevas]')?.textContent ?? '', numeros: [...(c?.querySelectorAll('[data-llevas-numero]') ?? [])].map((x) => x.textContent + ' ' + x.getAttribute('data-llevas-numero')), verLogros: c?.querySelector('[data-ver-mis-logros]')?.textContent?.trim() ?? null, abrirViaje: Boolean(c?.querySelector('[data-abrir-mi-viaje]')), crear: c?.querySelector('[data-crear-viaje-destino]')?.textContent?.trim() ?? null, tuViaje: c?.querySelector('[data-tu-viaje]')?.textContent ?? null } })())`))
  debe(t.titulo === 'LO QUE LLEVAS' && t.numeros.length === 3 && t.numeros.every((x) => /^\d+ de \d+ (medallas|colecciones|secretos)$/.test(x)), 'tarjeta', `«Lo que llevas» con «n de total» (${t.numeros.join(' · ')})`)
  debe(/^Ver mis logros de Roma$/.test(t.verLogros ?? ''), 'tarjeta', `y [${t.verLogros}]`)
  debe(t.abrirViaje && t.crear === null && /Tu viaje ·/.test(t.tuViaje ?? ''), 'tarjeta', 'con un viaje próximo: [Abrir mi viaje] en vez de [Crear viaje] (y «Tu viaje · fechas»)')
  await a.captura(`${CAP}/bola_tarjeta_lo_que_llevas.jpg`)
  // Un «Próximamente»: gris y con [Avísame].
  await a.evaluar("document.querySelector('[data-tarjeta-destino] > div')?.click(); true")
  await a.esp(400)
  const pronto = await a.evaluar("document.querySelector('[data-destino-lista][data-listo=\"0\"]')?.getAttribute('data-destino-lista') ?? null")
  if (pronto) {
    await toque(`[data-destino-lista="${pronto}"]`)
    await esperar(`Boolean(document.querySelector('[data-tarjeta-destino="${pronto}"] [data-avisame]'))`, 40)
    debe(await a.evaluar(`Boolean(document.querySelector('[data-tarjeta-destino="${pronto}"] [data-avisame]'))`), 'pronto', `un «Próximamente» (${pronto}) sigue con su [Avísame]`)
  } else debe(false, 'pronto', 'no hay ningún «Próximamente» en la lista')
} finally {
  a.cerrar()
}

console.log(`\nPrueba de la Tanda V39 (bola): ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
process.exit(fallos.length ? 1 : 0)
