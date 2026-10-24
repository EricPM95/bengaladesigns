// La prueba de la Tanda 10G: la apertura, la sesión abierta, el primer paso de crear el viaje y la versión gratis (lo de pago, cerrado y a la vista).
// Hace falta `npm run server` y `npm run dev` (la parte de la app abre un Chrome sin ventana: scripts/destino/_enLaApp.mjs).
//   API_URL=http://localhost:8787 node scripts/destino/pruebaTanda10G.mjs
import fs from 'node:fs'
import vm from 'node:vm'
import { abrirApp } from './_enLaApp.mjs'

const leer = (f) => fs.readFileSync(f, 'utf8')
let comprobaciones = 0
const fallos = []
const debe = (c, regla, texto) => {
  comprobaciones++
  if (!c) fallos.push({ regla, texto })
}

/* ───────────────────────── 1. La apertura ───────────────────────── */
{
  const html = leer('index.html')
  const guion = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]).find((s) => s.includes('sessionStorage'))
  debe(Boolean(guion), 'apertura', 'index.html lleva el guion que decide si sale la apertura')
  /** Corre el guion de index.html con una pestaña falsa (`almacen`) y dice si la apertura sigue puesta. */
  const abrirConAlmacen = (almacen) => {
    let puesta = true
    const documento = { getElementById: () => ({ remove: () => { puesta = false } }) }
    const ventana = { sessionStorage: { getItem: (k) => (k in almacen ? almacen[k] : null), setItem: (k, v) => { almacen[k] = String(v) }, removeItem: (k) => { delete almacen[k] } } }
    vm.runInNewContext(guion, { window: ventana, document: documento })
    return puesta
  }
  const pestana = {}
  debe(abrirConAlmacen(pestana) === true, 'apertura', 'en una pestaña nueva sale la apertura')
  debe(abrirConAlmacen(pestana) === true, 'apertura', 'y sale OTRA VEZ al volver a abrir la app en la misma pestaña (ya no hay «solo la primera vez»)')
  const trasEntrar = { 'jutrip:sin-apertura': '1' }
  debe(abrirConAlmacen(trasEntrar) === false, 'apertura', 'la recarga que hace la app justo después de entrar o de unirse a un viaje NO la vuelve a sacar')
  debe(!('jutrip:sin-apertura' in trasEntrar), 'apertura', 'y esa excepción se gasta: la apertura siguiente sale otra vez')
  debe(abrirConAlmacen(trasEntrar) === true, 'apertura', 'la siguiente apertura sale')
  const recarga = leer('src/lib/recargarSinApertura.ts')
  debe(/jutrip:sin-apertura/.test(recarga) && /location\.reload/.test(recarga), 'apertura', 'recargarSinApertura deja la marca y recarga')
  for (const f of ['src/lib/cuentas.ts', 'src/components/cuenta/PuertaDeCuenta.tsx', 'src/components/ajustes/AjustesScreen.tsx']) {
    debe(!/window\.location\.reload\(\)/.test(leer(f)) && /recargarSinApertura\(\)/.test(leer(f)), 'apertura', `${f}: la recarga de después de entrar o unirse usa recargarSinApertura`)
  }

  const { aperturaInteriorHtml, DURACION, ETIQUETA } = await import('../../shared/marca/aperturaJutrip.js')
  const interior = aperturaInteriorHtml({ lema: 'De viajeros, para viajeros' })
  debe(DURACION === 3.5, 'apertura', 'dura 3,5 segundos')
  debe(/TU APP DE VIAJES/i.test(ETIQUETA) && interior.includes(ETIQUETA) && /text-transform:uppercase/.test(interior.split(ETIQUETA)[0].split('<span data-fin').pop()), 'apertura', 'lleva la línea nueva «TU APP DE VIAJES», en mayúsculas espaciadas')
  debe(/data-fin[^>]*color:#A67C52/.test(interior), 'apertura', 'la línea nueva va en el oro profundo')
  const duraciones = [...interior.matchAll(/animation:[^;"]*? (\d+(?:\.\d+)?)s /g)].map((m) => Number(m[1]))
  debe(duraciones.length > 20 && duraciones.every((d) => d === 3.5), 'apertura', `todas las animaciones duran 3,5 s (${[...new Set(duraciones)].join(' ')}): la última en acabar es la línea nueva`)
  // La línea nueva entra DESPUÉS de que el lema se haya escrito entero.
  const finLema = Math.max(...[...interior.matchAll(/@keyframes apL\d+\{0%,([\d.]+)%\{[^}]*\}([\d.]+)%,100%/g)].map((m) => Number(m[2])))
  const inicioEtiqueta = Number(interior.match(/@keyframes apTag\{0%,([\d.]+)%/)[1])
  debe(finLema > 0 && inicioEtiqueta >= finLema, 'apertura', `la línea nueva entra después del lema (el lema acaba al ${finLema} %, la línea empieza al ${inicioEtiqueta} %)`)
  const finEtiqueta = Number(interior.match(/@keyframes apTag\{[^}]*\}([\d.]+)%,100%/)[1])
  debe(finEtiqueta <= 100 && finEtiqueta > inicioEtiqueta, 'apertura', 'y se ve entera antes de que acabe')
  debe(/prefers-reduced-motion: reduce\)\{#apertura \*\{animation:none!important\}\}/.test(interior), 'apertura', 'con las animaciones reducidas queda quieta, con el logo, el lema y la línea nueva')
  const principal = leer('src/main.tsx')
  debe(!/pointerdown/.test(principal) && !/performance\.now\(\)/.test(principal), 'apertura', 'nada la corta: ni un toque ni el reloj de la página (se quitaba a los 3 s desde que se abría)')
  debe(/animationend/.test(principal) && /\[data-fin\]/.test(principal), 'apertura', 'se quita cuando acaba la animación de la línea nueva (contando desde que empieza de verdad)')
  debe(/reducir\) window\.setTimeout\(quitar, 1500\)/.test(principal), 'apertura', 'con las animaciones reducidas, 1,5 segundos')
}

/* ───────────────────────── 2. La sesión abierta ───────────────────────── */
{
  const cliente = leer('src/lib/supabaseClient.ts')
  debe(/persistSession: true/.test(cliente) && /autoRefreshToken: true/.test(cliente) && /detectSessionInUrl: true/.test(cliente), 'sesion', 'el cliente guarda la sesión, la renueva solo y lee el enlace de entrada (dicho explícito)')
  debe(/storage\.persist/.test(cliente), 'sesion', 'se pide al navegador que no borre lo guardado')
  const cuentas = leer('src/lib/cuentas.ts')
  debe(/export async function entrarConCodigo/.test(cuentas) && /verifyOtp/.test(cuentas), 'sesion', 'se puede entrar con el código del email (cuando el enlace se abre en otro navegador)')
  debe(/refreshSession\(\)/.test(cuentas) && /visibilitychange/.test(cuentas), 'sesion', 'al volver a la app con la sesión anónima se renueva (el enlace pudo confirmarse en otro navegador)')
  const { codigoValido } = await import('../../src/lib/entrarCuenta.ts')
  {
    debe(codigoValido('123456') && codigoValido('12345678') && !codigoValido('12345') && !codigoValido('abcdef') && !codigoValido(''), 'sesion', 'el código son de 6 a 8 números')
  }
  const { dondeAbrir } = await import('../../src/lib/dondeAbrir.ts')
  const viajes = [{ id: 'reciente' }, { id: 'hoy' }, { id: 'viejo' }]
  debe(dondeAbrir(viajes, () => false).tipo === 'ultimo' && dondeAbrir(viajes, () => false).viaje.id === 'reciente' && dondeAbrir(viajes, () => false).modo === 'route', 'sesion', 'con la sesión abierta, al abrir sale tu ÚLTIMO viaje, en RUTA')
  const hoy = dondeAbrir(viajes, (v) => v.id === 'hoy')
  debe(hoy.tipo === 'hoy' && hoy.viaje.id === 'hoy' && hoy.modo === 'today', 'sesion', 'si hoy es un día del viaje, sale ese viaje en HOY')
  debe(dondeAbrir([{ id: 'a', generationState: { x: 1 } }, { id: 'b' }], () => true).tipo === 'reanudar', 'sesion', 'un viaje a medias se retoma')
  debe(dondeAbrir([], () => true).tipo === 'nada', 'sesion', 'sin viajes, la pantalla de destino de siempre')
  const sync = leer('src/components/sync/TripSync.tsx')
  debe(/dondeAbrir\(/.test(sync) && /setMode\(donde\.modo\)/.test(sync) && /setMode\('today'\)/.test(sync) && !/setScreen\('myTrips'\)/.test(sync), 'sesion', 'TripSync abre el último viaje en RUTA (o HOY) y ya no «Mis viajes»')
  const puerta = leer('src/components/cuenta/PuertaDeCuenta.tsx')
  debe(/estado\.tipo === 'anonima' \|\| estado\.tipo === 'sin_sesion'\) return <EntrarCuenta/.test(puerta), 'sesion', 'la pantalla de entrar sale solo sin sesión de verdad (anónima o ninguna)')
  debe(/data-codigo-email/.test(leer('src/components/cuenta/EntrarCuenta.tsx')), 'sesion', 'la pantalla de entrar deja escribir el código del email')
}

/* ───────────────────────── 3, 4. La app ───────────────────────── */
const app = await abrirApp('http://localhost:5173', { ruta: '/?cuentas=off&apertura=0' })
const esperar = async (cond, veces = 120) => { for (let i = 0; i < veces; i++) { if (await app.evaluar(cond).catch(() => false)) return true; await app.esp(500) } return false }
debe(await esperar("Boolean(document.querySelector('[data-primera-pantalla]') && document.querySelector('[data-mapa-primera] svg path'))"), 'app', 'la app abre')
await app.esp(1500)

// El primer paso: la tarjeta de Roma lleva su foto (de los datos del destino) y [Trazar ruta] no cambia de pantalla.
{
  const destinos = await app.evaluar("fetch('/api/destinos-curados').then((r) => r.json())")
  const roma = destinos.destinos.find((d) => d.nombre === 'Roma')
  debe(Boolean(roma?.portada) && /coliseo/i.test(roma.portada), 'paso1', `los datos del destino traen la foto de portada de Roma (el Coliseo): ${roma?.portada}`)
  await app.evaluar("document.querySelector('[data-campo-destino]').focus()")
  await app.esp(1200)
  const foto = await app.evaluar("document.querySelector('[data-destino-card=\"Roma\"] [data-destino-foto]')?.getAttribute('data-destino-foto') ?? null")
  debe(Boolean(foto) && foto === roma?.portada_pequena, 'paso1', `la tarjeta de Roma lleva su foto (${foto})`)
  const fondo = await app.evaluar("getComputedStyle(document.querySelector('[data-destino-card=\"Roma\"] [data-destino-foto]')).backgroundImage")
  debe(/coliseo/.test(fondo) && !/repeating-linear-gradient/.test(fondo), 'paso1', 'y la pinta de fondo (no las rayas)')
  const tarjeta = await app.evaluar("(() => { const e = document.querySelector('[data-destino-card=\"Roma\"]'); e.dispatchEvent(new MouseEvent('click', { bubbles: true })); return true })()")
  await app.esp(1200)
  await app.escribir('[data-campo-origen]', 'Barcelona')
  for (let i = 0; i < 40 && !(await app.evaluar("Boolean(document.querySelector('[data-origen-opcion]'))")); i++) await app.esp(300)
  await app.evaluar("(() => { const e = document.querySelector('[data-origen-opcion]'); e.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true })); return true })()")
  await app.esp(1500)
  debe(Boolean(tarjeta), 'paso1', 'se pudo elegir Roma')
  debe((await app.evaluar("document.querySelector('[data-titulo-paso]').innerText")).includes('De dónde sales'), 'paso1', 'antes de trazar, el título es «¿De dónde sales y a dónde vas?»')
  await app.evaluar("document.querySelector('[data-trazar-ruta]').dispatchEvent(new MouseEvent('click', { bubbles: true }))")
  await app.esp(800)
  debe(await app.evaluar("Boolean(document.querySelector('[data-primera-pantalla]')) && !document.querySelector('[data-trazar-ruta]')"), 'paso1', '[Trazar ruta] no cambia de pantalla: el mapa se queda y la tarjeta de Origen/Destino desaparece')
  debe(await app.evaluar("Boolean(document.querySelector('[data-linea-trazada]'))"), 'paso1', 'el mapa dibuja la línea de origen a destino')
  const titulo = await app.evaluar("document.querySelector('[data-titulo-paso]').innerText")
  debe(/Conectando\s+Barcelona\s+con\s+Roma/.test(titulo.replace(/\s+/g, ' ')), 'paso1', `arriba dice «Conectando Barcelona con Roma» (${titulo.replace(/\s+/g, ' ')})`)
  const oro = await app.evaluar("Array.from(document.querySelectorAll('[data-titulo-paso] em')).map((e) => getComputedStyle(e).color)")
  debe(oro.length === 2 && oro.every((c) => c === 'rgb(111, 78, 55)'), 'paso1', 'los dos nombres van en oro')
  await app.esp(5500)
  debe(await app.evaluar("Boolean(document.querySelector('[data-transportes]'))"), 'paso1', 'la tarjeta de abajo pasa a ser la distancia y los transportes')
  const textos = await app.evaluar("document.querySelector('[data-transportes]').innerText")
  debe(/DISTANCIA/i.test(textos) && /Avión/.test(textos) && /Tren/.test(textos) && /Autobús/.test(textos) && /Ferry/.test(textos) && /En tu coche/.test(textos), 'paso1', 'con la distancia y los cinco transportes')
  debe(/≈\s*\d/.test(textos), 'paso1', 'cada uno con su tiempo')
  debe((await app.evaluar("document.querySelector('[data-titulo-paso]').innerText")).replace(/\s+/g, ' ').includes('Cómo quieres llegar a Roma'), 'paso1', 'al acabar el cálculo, el título pasa a «¿Cómo quieres llegar a Roma?»')
  debe(await app.evaluar("Boolean(document.querySelector('[data-cambiar-ruta]'))"), 'paso1', 'y se puede volver a elegir la ruta ([Cambiar ruta])')
}
app.cerrar()

// La versión gratis: se ve TODO lo de pago, cerrado, con su invitación; y con el pase, todo abierto como siempre.
async function conViaje(version) {
  const a = await abrirApp('http://localhost:5173', { ruta: `/?cuentas=off&logros=on&logrosDemo=1&version=${version}` })
  for (let i = 0; i < 120 && !(await a.evaluar("Boolean(document.querySelector('[data-primera-pantalla]'))").catch(() => false)); i++) await a.esp(500)
  for (let i = 0; i < 60 && !(await a.evaluar("typeof window.__rutaPrueba === 'function'")); i++) await a.esp(500)
  await a.evaluar('window.__rutaPrueba().then(() => true)')
  for (let i = 0; i < 60 && !(await a.evaluar("import('/src/store/useRouteStore.ts').then((m) => Boolean(m.useRouteStore.getState().route))")); i++) await a.esp(1000)
  await a.esp(5000)
  for (let i = 0; i < 4; i++) {
    const hecho = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Entendido|Vale|Cerrar)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
    if (!hecho) break
    await a.esp(600)
  }
  return a
}
const store = "import('/src/store/useRouteStore.ts').then((m) => m.useRouteStore.getState())"
const modo = async (a, m) => {
  await a.evaluar(`${store}.then((s) => { s.setActiveDayId(null); s.setMode('${m}'); return true })`)
  await a.esp(2500)
}
const hayPago = (a) => a.evaluar("import('/src/store/usePagoStore.ts').then((m) => m.usePagoStore.getState().hoja != null)")

{
  const g = await conViaje('gratis')
  // RUTA: la pastilla del pase, con el candado.
  await modo(g, 'route')
  debe((await g.evaluar("document.querySelector('[data-pastilla-pase]')?.getAttribute('data-pastilla-pase')")) === 'sin', 'gratis', 'RUTA: la tarjeta del destino lleva la pastilla «Pase de Roma» con el candado')
  debe(/Pase de Roma/.test(await g.evaluar("document.querySelector('[data-pastilla-pase]')?.innerText ?? ''")), 'gratis', 'y dice «Pase de Roma» (el nombre sale de los datos del destino)')
  await g.evaluar("document.querySelector('[data-pastilla-pase]').click()")
  await g.esp(1500)
  debe(await hayPago(g), 'gratis', 'al tocar la pastilla se abre el pase (la hoja de compra)')
  await g.evaluar("import('/src/store/usePagoStore.ts').then((m) => { m.usePagoStore.getState().cerrar(); return true })")
  // RESERVAS: «Llegada y vuelta» abierto y gratis, «0 de 3».
  await modo(g, 'bookings')
  const reservas = await g.evaluar('document.body.innerText')
  debe(/Llegada y vuelta/.test(reservas), 'gratis', 'RESERVAS: «Llegada y vuelta» sale sin pase (para apuntar el vuelo o el tren)')
  debe(/0 de 3/.test(reservas), 'gratis', `RESERVAS: el resumen dice «0 de 3 listo» (${(reservas.match(/\d de \d\s*listo/i) ?? [''])[0]})`)
  // Se guarda el vuelo de llegada (gratis) y debajo sale el candado del ajuste.
  const diasAntes = await g.evaluar(`${store}.then((s) => JSON.stringify(s.route.days.map((d) => d.stops.map((p) => p.name + '@' + p.time))))`)
  await g.evaluar(`${store}.then((s) => { s.setArrivalFlightTime('15:40'); return true })`)
  await g.esp(1500)
  await g.evaluar("(() => { const b = Array.from(document.querySelectorAll('[data-blk=\"llegada\"], [data-blk=\"llegada\"] *')).find((x) => /Llegada y vuelta/.test(x.textContent || '') && x.tagName === 'SPAN'); if (b) b.click(); return true })()")
  await g.esp(1500)
  debe(await g.evaluar("Boolean(document.querySelector('[data-candado=\"llegada-ajuste\"]'))"), 'gratis', 'RESERVAS: con el vuelo guardado, debajo sale el candado «Con el pase, ajustamos tu primer y tu último día a tu vuelo»')
  const hora = await g.evaluar(`${store}.then((s) => s.route.arrivalFlightTime)`)
  debe(hora === '15:40', 'gratis', 'el vuelo queda guardado gratis')
  await g.esp(4000)
  const diasDespues = await g.evaluar(`${store}.then((s) => JSON.stringify(s.route.days.map((d) => d.stops.map((p) => p.name + '@' + p.time))))`)
  debe(diasAntes === diasDespues && !(await g.evaluar(`${store}.then((s) => s.rehaciendoRuta)`)), 'gratis', 'el día no se ajusta solo al vuelo (con el vuelo guardado las paradas y las horas siguen igual y la ruta no se rehace)')
  // El alojamiento: la zona, cerrada y a la vista.
  await g.evaluar("(() => { const b = document.querySelector('[data-blk=\"aloj\"] div'); if (b) b.click(); return true })()")
  await g.esp(1200)
  debe(await g.evaluar("Boolean(document.querySelector('[data-blk=\"aloj\"] [data-candado=\"alojamiento-zona\"]'))"), 'gratis', 'RESERVAS: la zona del alojamiento sale cerrada, con «Con el pase, cada día empieza cerca de donde duermes»')
  await g.evaluar("(() => { const c = document.querySelector('[data-candado=\"llegada-ajuste\"]'); if (c) c.click(); return true })()")
  await g.esp(1200)
  debe(await hayPago(g), 'gratis', 'al tocar un candado se abre el pase')
  await g.evaluar("import('/src/store/usePagoStore.ts').then((m) => { m.usePagoStore.getState().cerrar(); return true })")
  // DÍAS: la barra de llegada con [+ Vuelo] abierto y el ajuste cerrado.
  await g.evaluar(`${store}.then((s) => { s.setActiveDayId(s.route.days[0].id); s.setMode('days'); return true })`)
  await g.esp(4000)
  const dias = await g.evaluar('document.body.innerText')
  debe(/LLEGADA/.test(dias), 'gratis', 'DÍAS: la barra de llegada sale')
  debe(await g.evaluar("Boolean(document.querySelector('[data-candado=\"dia-ajuste-llegada\"]'))"), 'gratis', 'DÍAS: con el vuelo guardado, el ajuste del día sale cerrado («Con el pase, tu día se ajusta a la hora de tu vuelo»)')
  debe(await g.evaluar("Boolean(document.querySelector('[data-candado=\"alojamiento-zona\"]'))"), 'gratis', 'DÍAS: la zona del alojamiento sale cerrada («cada día empieza cerca de donde duermes»)')
  // Logros: la vitrina y las colecciones se ven, cerradas, con «Con el Pase de Roma, cada sitio que ves suma».
  await g.evaluar('window.__momentos.hoja()')
  await g.esp(3000)
  debe(await g.evaluar("Boolean(document.querySelector('[data-logros-cerrados]')) && Boolean(document.querySelector('[data-candado=\"logros-sin-pase\"]'))"), 'gratis', 'Logros: sin pase, la vitrina y las colecciones salen cerradas, con su candado')
  debe(/Con el Pase de Roma, cada sitio que ves suma/.test(await g.evaluar('document.body.innerText')), 'gratis', 'y dicen «Con el Pase de Roma, cada sitio que ves suma»')
  await g.evaluar('window.__momentos.cerrar()')
  await g.esp(800)
  // EXPLORAR: Baños y Fuentes, en gris con su candado.
  await modo(g, 'explore')
  await g.esp(3500)
  const cerradas = await g.evaluar("Array.from(document.querySelectorAll('[data-candado^=\"explorar-\"]')).map((e) => e.getAttribute('data-candado')).sort()")
  debe(cerradas.join() === 'explorar-banos,explorar-fuentes', 'gratis', `EXPLORAR: Baños y Fuentes salen cerrados, no escondidos (${cerradas.join()})`)
  await g.evaluar("document.querySelector('[data-candado=\"explorar-banos\"]').click()")
  await g.esp(1200)
  debe(await hayPago(g), 'gratis', 'y al tocarlos se abre el pase')
  g.cerrar()
}
{
  const c = await conViaje('completa')
  await modo(c, 'route')
  debe((await c.evaluar("document.querySelector('[data-pastilla-pase]')?.getAttribute('data-pastilla-pase')")) === 'con', 'completa', 'RUTA con el pase: la pastilla «Pase de Roma» lleva el ✓ sobre oro')
  await modo(c, 'bookings')
  const reservas = await c.evaluar('document.body.innerText')
  debe(/Llegada y vuelta/.test(reservas), 'completa', 'RESERVAS con el pase: «Llegada y vuelta» sigue')
  debe(await c.evaluar("!document.querySelector('[data-candado]')"), 'completa', 'con el pase no queda ningún candado en RESERVAS')
  await modo(c, 'explore')
  await c.esp(3000)
  debe(await c.evaluar("!document.querySelector('[data-candado]')"), 'completa', 'ni en EXPLORAR: Baños y Fuentes abiertos como siempre')
  await c.evaluar('window.__momentos.hoja()')
  await c.esp(3000)
  debe(await c.evaluar("!document.querySelector('[data-logros-cerrados]') && !document.querySelector('[data-candado=\"logros-sin-pase\"]')"), 'completa', 'ni en Logros: con el pase, la vitrina y las colecciones abiertas')
  c.cerrar()
}

// Una sola función para abrir el pase.
{
  const pago = leer('src/lib/pago.ts')
  debe(/export function abrirPase\(\)/.test(pago) && /export const pedirPago = abrirPase/.test(pago), 'pase', 'hay UNA función para abrir el pase (abrirPase) y pedirPago es la misma')
  for (const f of ['src/components/pase/Candado.tsx', 'src/components/pase/PastillaPase.tsx']) debe(/abrirPase/.test(leer(f)) && !/usePagoStore/.test(leer(f)), 'pase', `${f} abre el pase con abrirPase`)
  debe(/abrirPase/.test(leer('src/components/route/ExplorePanel.tsx')), 'pase', 'las tarjetas cerradas de EXPLORAR también')
  debe(/data-hoy-ver-pase/.test(leer('src/components/route/hoy/HoySinPase.tsx')) && /\{!antes && \(/.test(leer('src/components/route/hoy/HoySinPase.tsx')), 'pase', 'HOY antes del viaje: el [Ver el Pase de Roma] de la tarjeta del día de prueba ya no se repite')
}

console.log(`${comprobaciones} comprobaciones · ${fallos.length} fallos`)
for (const f of fallos) console.log(` · ${f.regla}: ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
