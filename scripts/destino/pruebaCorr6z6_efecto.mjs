// Prueba de la Tanda 6z6b, parte 2: el efecto «el precio vuela a la cartera». Con funciones puras y piezas falsas del navegador.
//   node scripts/destino/pruebaCorr6z6_efecto.mjs
// Da fallo si:
//   1. una suma nueva no sale como «+103,13 €» en SU moneda (EUR, CZK, MXN) y con el formato de siempre;
//   2. un cambio de 103,13 a 123,13 no da «+20,00 €», o de 123,13 a 103,13 no da «−20,00 €» (signo menos tipográfico);
//   3. eliminar un precio no da «−103,13 €», o un precio sin cambio da algo;
//   4. la carga inicial (abrir/restaurar/otro viaje/cambio de versión) o un cambio con el presupuesto abierto dispara algo (y luego, al cerrarlo, no sale lo hecho dentro);
//   5. dos monedas distintas se suman entre sí;
//   6. con «reducir movimiento» vuela una pastilla (debe haber solo el saltito);
//   7. el vuelo no dura ≈ 800 ms, o no termina en la cartera que se ve (`data-cartera` visible), o la cartera no salta al llegar;
//   8. la pastilla no sale junto al último elemento pulsado (o en el centro si no hay);
//   9. el código del efecto escribe un «€» a mano.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'
import { build } from 'esbuild'

const require = createRequire(import.meta.url)
let fallos = 0
let comprobaciones = 0
const ok = (cond, texto) => {
  comprobaciones++
  if (!cond) {
    fallos++
    console.log(`  ✗ ${texto}`)
  }
}

const carpeta = fs.mkdtempSync(path.join(os.tmpdir(), 'prueba-6z6-efecto-'))
const salida = path.join(carpeta, 'precioVuela.cjs')
await build({ entryPoints: ['src/lib/precioVuela.ts'], outfile: salida, bundle: true, platform: 'node', format: 'cjs', logLevel: 'silent', define: { 'import.meta.env.DEV': 'false' } })
const V = require(salida)

const eur = (amount) => ({ amount, currency: 'EUR' })
const dia = (n) => ({ id: `d${n}`, dayNumber: n, city: 'Roma', countryCode: 'it', stops: [] })
const ruta = (id = 'r1', extra = {}) => ({ id, destination: 'Roma', origin: 'Madrid', days: [dia(1), dia(2)], answers: { dateRange: { start: '2026-10-13', end: '2026-10-15' }, companion: 'couple' }, ...extra })
const entrada = (cambios = {}) => ({
  route: ruta(),
  reservations: [],
  accommodationSelections: {},
  transportBookings: {},
  insuranceBooking: null,
  rentalVehicleBooking: null,
  esimPrecios: {},
  moneda: 'EUR',
  cambio: null,
  pago: true,
  ...cambios,
})
const reserva = (id, precio) => ({ id, kind: 'entrada', refId: 'Panteon', name: 'Panteón', placeNames: ['Panteón'], dateIso: '2026-10-13', dayNumber: null, time: '12:00', precio })
const textos = (difs) => difs.map((d) => V.textoDeDiferencia(d))

// ── 1-3. Qué texto sale ──
console.log('Qué sale')
{
  const s = V.crearSeguidor()
  s.procesar(entrada(), false)
  let d = s.procesar(entrada({ reservations: [reserva('a', eur(103.13))] }), false)
  ok(textos(d).join() === '+103,13 €', `suma nueva en euros: ${textos(d)}`)
  d = s.procesar(entrada({ reservations: [reserva('a', eur(123.13))] }), false)
  ok(textos(d).join() === '+20,00 €', `103,13 → 123,13: ${textos(d)}`)
  d = s.procesar(entrada({ reservations: [reserva('a', eur(103.13))] }), false)
  ok(textos(d).join() === '−20,00 €' && textos(d)[0][0] === '−', `123,13 → 103,13: ${textos(d)} (signo menos tipográfico)`)
  d = s.procesar(entrada({ reservations: [reserva('a', eur(103.13))] }), false)
  ok(d.length === 0, 'sin cambio: nada')
  d = s.procesar(entrada({ reservations: [reserva('a', eur(103.13)), reserva('b', null)] }), false)
  ok(d.length === 0, 'una reserva sin precio no es un gasto: nada')
  d = s.procesar(entrada(), false)
  ok(textos(d).join() === '−103,13 €', `eliminar: ${textos(d)}`)
}
{
  // La diferencia con decimales sale con dos cifras («+20,50 €») y el cambio redondo a 20 exacto
  ok(V.textoDeDiferencia({ clave: 'x', importe: eur(20.5) }) === '+20,50 €', '+20,50 €')
  ok(V.textoDeDiferencia({ clave: 'x', importe: eur(-20.5) }) === '−20,50 €', '−20,50 €')
  const s = V.crearSeguidor()
  s.procesar(entrada({ reservations: [reserva('a', eur(103.13))] }), false)
  const d = s.procesar(entrada({ reservations: [reserva('a', eur(123.63))] }), false)
  ok(textos(d).join() === '+20,50 €', `103,13 → 123,63: ${textos(d)}`)
}
{
  // Cada moneda con su formato
  const s = V.crearSeguidor()
  s.procesar(entrada(), false)
  const d = s.procesar(entrada({ reservations: [reserva('a', { amount: 103.13, currency: 'CZK' })], accommodationSelections: { d1: { name: 'Hotel', precio: { amount: 1200, currency: 'CZK' } } } }), false)
  ok(textos(d).includes('+103,13 Kč') && textos(d).includes('+1.200,00 Kč'), `en coronas: ${textos(d)}`)
  const s2 = V.crearSeguidor()
  s2.procesar(entrada(), false)
  const d2 = s2.procesar(entrada({ reservations: [reserva('a', { amount: 103.13, currency: 'MXN' })] }), false)
  ok(textos(d2).join() === '+103,13 MXN', `en pesos: ${textos(d2)}`)
  const s3 = V.crearSeguidor()
  s3.procesar(entrada(), false)
  const d3 = s3.procesar(entrada({ reservations: [reserva('a', { amount: 103.13, currency: 'GBP' })] }), false)
  ok(textos(d3).join() === '+103,13 £', `en libras: ${textos(d3)}`)
}

// ── De dónde sale cada tipo de precio ──
console.log('Todos los sitios que guardan precios')
{
  const casos = {
    'alojamiento': { accommodationSelections: { d1: { name: 'Hotel Artemide', precio: eur(420) } } },
    'entrada o excursión': { reservations: [reserva('a', eur(54))] },
    'transporte': { transportBookings: { d1: { operator: 'Tren', precio: eur(30) } } },
    'seguro': { insuranceBooking: { provider: 'Seguro', startDate: '', endDate: '', precio: eur(30) } },
    'coche de alquiler': { rentalVehicleBooking: { provider: 'Hertz', startDate: '', endDate: '', precio: eur(200) } },
    'eSIM': { esimPrecios: { it: eur(9.99) } },
    'llegada': { route: ruta('r1', { arrivalPrecio: eur(180) }) },
    'vuelta': { route: ruta('r1', { departurePrecio: eur(150) }) },
    'extra': { route: ruta('r1', { gastosExtras: [{ id: 'e1', nombre: 'Taxi', precio: eur(25) }] }) },
  }
  for (const [nombre, cambios] of Object.entries(casos)) {
    const s = V.crearSeguidor()
    s.procesar(entrada(), false)
    const d = s.procesar(entrada(cambios), false)
    ok(d.length === 1 && d[0].importe.amount > 0, `${nombre}: sale un efecto (${textos(d)})`)
    const q = s.procesar(entrada(), false)
    ok(q.length === 1 && q[0].importe.amount < 0, `${nombre}: quitarlo sale en negativo (${textos(q)})`)
  }
  // El precio de los billetes de llegada y vuelta solo cuenta con la versión de pago, igual que el presupuesto
  const s = V.crearSeguidor()
  s.procesar(entrada({ pago: false }), false)
  ok(s.procesar(entrada({ pago: false, route: ruta('r1', { arrivalPrecio: eur(180) }) }), false).length === 0, 'sin pago, la llegada no está en el presupuesto: nada')
  // Free Tour: no suma nunca
  const f = V.crearSeguidor()
  f.procesar(entrada(), false)
  ok(f.procesar(entrada({ reservations: [{ ...reserva('c', eur(25)), refId: 'Free Tour' }] }), false).length === 0, 'el Free Tour no suma: nada')
}

// ── 4. Carga inicial y presupuesto abierto ──
console.log('Carga inicial y presupuesto abierto')
{
  const s = V.crearSeguidor()
  ok(s.procesar(null, false).length === 0, 'sin viaje: nada')
  ok(s.procesar(entrada({ reservations: [reserva('a', eur(103.13))] }), false).length === 0, 'la primera lectura del viaje (con precios ya guardados) no da efecto')
  ok(s.procesar(entrada({ route: ruta('otro'), reservations: [reserva('a', eur(300))] }), false).length === 0, 'abrir otro viaje (otro id) no da efecto')
  ok(s.procesar(entrada({ route: ruta('otro'), reservations: [reserva('a', eur(300))], pago: false }), false).length === 0, 'cambiar de versión gratis/pago no da efecto')
  const q = V.crearSeguidor()
  q.procesar(entrada(), false)
  ok(q.procesar(entrada({ route: ruta('r1', { gastosExtras: [{ id: 'e1', nombre: 'Taxi', precio: eur(25) }] }) }), true).length === 0, 'con el presupuesto abierto (los Extras): nada')
  ok(q.procesar(entrada({ route: ruta('r1', { gastosExtras: [{ id: 'e1', nombre: 'Taxi', precio: eur(25) }] }), reservations: [reserva('a', eur(10))] }), false).map((d) => d.importe.amount).join() === '10', 'al cerrarlo, solo cuenta lo que se guarda después (no se repite lo de dentro)')
}

// ── 5. Monedas distintas ──
console.log('Monedas')
{
  const s = V.crearSeguidor()
  s.procesar(entrada(), false)
  const d = s.procesar(entrada({ reservations: [reserva('a', eur(10)), reserva('b', { amount: 200, currency: 'CZK' })] }), false)
  ok(d.length === 2 && textos(d).includes('+10,00 €') && textos(d).includes('+200,00 Kč'), `no se suman: ${textos(d)}`)
  const cambia = s.procesar(entrada({ reservations: [reserva('a', { amount: 10, currency: 'USD' }), reserva('b', { amount: 200, currency: 'CZK' })] }), false)
  ok(cambia.length === 2 && textos(cambia).includes('−10,00 €') && textos(cambia).includes('+10,00 US$'), `cambiar la moneda de un precio: se quita el viejo y se añade el nuevo, sin restar monedas distintas (${textos(cambia)})`)
  ok(V.textoParaLector([{ clave: 'a', importe: eur(103.13) }]) === 'Añadidos 103,13 € al presupuesto', 'texto para lectores de pantalla')
}

// ── 6-8. El dibujo, con piezas falsas ──
console.log('El dibujo')
function entornoFalso({ reduce = false, clic = null, carteras = [{ left: 300, top: 8, width: 36, height: 36 }], ancho = 390, alto = 800 } = {}) {
  const log = { pastillas: [], carteras: [], tareas: [] }
  const cartera = (caja) => {
    const c = { caja, atributos: {}, saltos: 0, getBoundingClientRect: () => caja, setAttribute(k, v) { this.atributos[k] = v }, removeAttribute(k) { delete this.atributos[k] }, animate(frames, opciones) { this.saltos++; const a = { frames, opciones }; this.ultima = a; return a } }
    log.carteras.push(c)
    return c
  }
  const elementos = carteras.map(cartera)
  const documento = {
    body: { appendChild: (el) => log.pastillas.push(el) },
    querySelectorAll: (selector) => (selector === '[data-cartera]' ? elementos : []),
    createElement: () => ({ atributos: {}, style: {}, setAttribute(k, v) { this.atributos[k] = v }, remove() { this.quitada = true }, animate(frames, opciones) { const a = { frames, opciones }; this.animacion = a; return a } }),
  }
  const entorno = { document: documento, ancho, alto, reducirMovimiento: reduce, ultimoClic: clic, ahora: () => 1000, esperar: (fn, ms) => log.tareas.push({ fn, ms }) }
  return { entorno, log, elementos }
}
const dif = (n, moneda = 'EUR') => ({ clave: 'k', importe: { amount: n, currency: moneda } })
{
  const { entorno, log } = entornoFalso({ clic: { caja: { left: 100, top: 400, width: 80, height: 40 }, momento: 900 } })
  V.lanzarEfecto(dif(103.13), entorno)
  const p = log.pastillas[0]
  ok(log.pastillas.length === 1 && p.textContent === '+103,13 €', `la pastilla lleva el texto: ${p?.textContent}`)
  ok(p && p.animacion.opciones.duration >= 700 && p.animacion.opciones.duration <= 900, `el vuelo dura ≈ 800 ms (${p?.animacion.opciones.duration})`)
  ok(p.atributos['aria-hidden'] === 'true' && p.style.cssText.includes('pointer-events:none') && p.style.cssText.includes('position:fixed'), 'pastilla accesible: aria-hidden, sin eventos, fija')
  const frames = p.animacion.frames
  const primero = frames[0].transform
  const ultimo = frames[frames.length - 1]
  ok(primero.includes('translate(140px, 378px)'), `sale junto al último pulsado (centro del botón, encima): ${primero}`)
  ok(ultimo.transform.includes('translate(318px, 26px)'), `termina en el centro de la cartera visible: ${ultimo.transform}`)
  ok(ultimo.opacity === 0 && /scale\(0\.\d+\)/.test(ultimo.transform), 'al llegar está encogida y desvanecida')
  ok(frames.some((f) => f.opacity === 1), 'se ve al salir')
  ok(p.animacion.opciones.fill === 'forwards', 'no parpadea al terminar')
  ok(!p.quitada, 'sigue en el aire durante el vuelo')
  p.animacion.onfinish()
  ok(p.quitada === true, 'al llegar la pastilla se quita')
  const c = log.carteras[0]
  ok(c.saltos === 1 && 'data-cartera-salto' in c.atributos, 'al llegar la cartera da su saltito')
  c.ultima.onfinish()
  ok(!('data-cartera-salto' in c.atributos), 'el atributo temporal del saltito se quita al acabar')
  ok(c.ultima.frames.some((f) => f.transform.includes('scale(1.2)')), 'el saltito crece y vuelve')
}
{
  const { entorno, log } = entornoFalso({})
  V.lanzarEfecto(dif(5), entorno)
  ok(log.pastillas[0].animacion.frames[0].transform.includes('translate(195px, 400px)'), 'sin clic: sale del centro de la pantalla')
  const viejo = entornoFalso({ clic: { caja: { left: 0, top: 0, width: 10, height: 10 }, momento: 1000 - V.EDAD_MAXIMA_CLIC_MS - 1 } })
  V.lanzarEfecto(dif(5), viejo.entorno)
  ok(viejo.log.pastillas[0].animacion.frames[0].transform.includes('translate(195px, 400px)'), 'un clic muy viejo no cuenta: centro')
  const arriba = entornoFalso({ clic: { caja: { left: 150, top: 10, width: 90, height: 30 }, momento: 990 } })
  V.lanzarEfecto(dif(5), arriba.entorno)
  ok(arriba.log.pastillas[0].animacion.frames[0].transform.includes('translate(195px, 62px)'), 'pegado al borde de arriba: la pastilla sale por debajo')
}
{
  const { entorno, log } = entornoFalso({ reduce: true, clic: { caja: { left: 1, top: 1, width: 5, height: 5 }, momento: 999 } })
  V.lanzarEfecto(dif(103.13), entorno)
  V.lanzarEfectos([dif(1), dif(2)], entorno)
  log.tareas.forEach((t) => t.fn())
  ok(log.pastillas.length === 0, 'con «reducir movimiento»: ninguna pastilla vuela')
  ok(log.carteras[0].saltos === 3 && log.carteras[0].animate !== undefined, 'con «reducir movimiento»: solo el saltito de la cartera')
}
{
  // Dos carteras: la de la cabecera visible y la de RESERVAS fuera de la pantalla o sin tamaño
  const { entorno, log } = entornoFalso({ carteras: [{ left: 0, top: 0, width: 0, height: 0 }, { left: 20, top: -200, width: 36, height: 36 }, { left: 320, top: 10, width: 36, height: 36 }] })
  V.lanzarEfecto(dif(5), entorno)
  ok(log.pastillas[0].animacion.frames.at(-1).transform.includes('translate(338px, 28px)'), 'entre varias carteras elige la que se ve (no la de tamaño 0 ni la de fuera de pantalla)')
  const sin = entornoFalso({ carteras: [] })
  V.lanzarEfecto(dif(5), sin.entorno)
  ok(sin.log.pastillas.length === 0, 'sin cartera a la vista: no hay nada que animar')
}
{
  const { entorno, log } = entornoFalso({})
  V.lanzarEfectos([dif(1), dif(2), dif(3)], entorno)
  ok(log.pastillas.length === 1 && log.tareas.map((t) => t.ms).join() === '120,240', 'varias a la vez: una detrás de otra con 120 ms de desfase')
  log.tareas.forEach((t) => t.fn())
  ok(log.pastillas.length === 3, 'salen las tres')
}
{
  // cajaDelObjetivo: el botón pulsado (o el elemento más cercano pulsable)
  const boton = { getBoundingClientRect: () => ({ left: 10, top: 20, width: 100, height: 40 }), closest: () => null }
  const dentro = { getBoundingClientRect: () => ({ left: 12, top: 22, width: 10, height: 10 }), closest: () => boton }
  ok(JSON.stringify(V.cajaDelObjetivo(dentro)) === JSON.stringify({ left: 10, top: 20, width: 100, height: 40 }), 'el clic en un icono dentro de un botón recuerda el botón')
  ok(V.cajaDelObjetivo(null) === null, 'sin objetivo: nada')
}

// ── 9. Nada de «€» a mano ──
console.log('Sin euros a mano')
for (const archivo of ['src/lib/precioVuela.ts', 'src/components/route/presupuesto/PrecioVuela.tsx']) {
  const codigo = fs.readFileSync(archivo, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
  ok(!/[€£$]|\bEUR\b/.test(codigo.replace(/\$\{/g, '')), `${archivo}: ni «€» ni símbolos de moneda ni «EUR» escritos a mano`)
  ok(!/\p{Extended_Pictographic}/u.test(codigo), `${archivo}: ni un emoji`)
}
const usaFormato = fs.readFileSync('src/lib/precioVuela.ts', 'utf8')
ok(/conMiles/.test(usaFormato) && /simboloDe/.test(usaFormato), 'usa el formato de siempre (conMiles y simboloDe de shared/dinero/formato.js)')

console.log(fallos === 0 ? `\nTODO BIEN: ${comprobaciones} comprobaciones, 0 fallos` : `\n${fallos} FALLOS de ${comprobaciones}`)
process.exit(fallos === 0 ? 0 : 1)
