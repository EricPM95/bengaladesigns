// Prueba de la Tanda 6z2: el dinero del viaje. El total del presupuesto es SIEMPRE la suma exacta de lo que el viajero puso con su precio; lo que no tiene precio no suma; el Free Tour no suma nunca;
// en otra moneda se convierte con el cambio guardado (y sin cambio sale aparte, sin sumar); el formato es el de siempre («54 €», «1.200 Kč», «800 MXN»); 0 «€» escritos a mano en el código de lo que ve el viajero;
// y el cambio del Banco Central Europeo se lee y se guarda una vez al día.
//   node scripts/destino/pruebaTanda6z2.mjs
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

const carpeta = fs.mkdtempSync(path.join(os.tmpdir(), 'prueba-6z2-'))
async function cargar(entrada, nombre) {
  const salida = path.join(carpeta, `${nombre}.cjs`)
  await build({ entryPoints: [entrada], outfile: salida, bundle: true, platform: 'node', format: 'cjs', logLevel: 'silent', define: { 'import.meta.env.DEV': 'false' } })
  return require(salida)
}
const D = await cargar('src/lib/dinero.ts', 'dinero')
const P = await cargar('src/lib/presupuesto.ts', 'presupuesto')
const M = await cargar('src/components/route/alojamiento/mapaAlojamientoUrl.ts', 'mapa')
const { leerXmlBce, cambioDelDia } = await import('../../server/cambio.js')

console.log('Formato')
ok(D.formatoImporte({ amount: 54, currency: 'EUR' }) === '54 €', '54 €')
ok(D.formatoImporte({ amount: 54, currency: 'GBP' }) === '54 £', '54 £')
ok(D.formatoImporte({ amount: 1200, currency: 'CZK' }) === '1.200 Kč', '1.200 Kč')
ok(D.formatoImporte({ amount: 800, currency: 'MXN' }) === '800 MXN', '800 MXN')
ok(D.formatoImporte({ amount: 54.5, currency: 'EUR' }) === '54,50 €', '54,50 € (con decimales solo si hacen falta)')
ok(D.formatoImporte({ amount: 1240, currency: 'EUR' }) === '1.240 €', 'punto de millar también en cuatro cifras')
ok(D.importeDeTexto('54', 'EUR')?.amount === 54 && D.importeDeTexto('54,5', 'EUR')?.amount === 54.5 && D.importeDeTexto('1.200,50', 'EUR')?.amount === 1200.5 && D.importeDeTexto('1.200', 'EUR')?.amount === 1200, 'el campo de precio entiende coma, punto y miles')
ok(D.importeDeTexto('', 'EUR') === null && D.importeDeTexto('abc', 'EUR') === null && D.importeDeTexto('0', 'EUR') === null, 'sin número no hay precio')
ok(D.leerImporte(12)?.currency === 'EUR' && D.leerImporte({ amount: 5, currency: 'MXN' })?.currency === 'MXN' && D.leerImporte(0) === null && D.leerImporte(null) === null, 'precios guardados antes (un número) y de ahora')
ok(D.monedaDePais('es') === 'EUR' && D.monedaDePais('mx') === 'MXN' && D.monedaDePais('GB') === 'GBP' && D.monedaDePais('zz') === null && D.monedaDePais(null) === null, 'moneda del viajero por su país de origen')

console.log('Conversión')
const cambio = { fecha: '2026-10-09', tasas: { MXN: 20, USD: 1.25, GBP: 0.8 } }
ok(D.convertir({ amount: 800, currency: 'MXN' }, 'EUR', cambio)?.amount === 40, '800 MXN → 40 € con el cambio guardado')
ok(D.convertir({ amount: 100, currency: 'EUR' }, 'MXN', cambio)?.amount === 2000, '100 € → 2.000 MXN')
ok(Math.abs(D.convertir({ amount: 100, currency: 'GBP' }, 'USD', cambio).amount - 156.25) < 1e-9, 'entre dos monedas, por el euro')
ok(D.convertir({ amount: 5, currency: 'XYZ' }, 'EUR', cambio) === null && D.convertir({ amount: 5, currency: 'EUR' }, 'XYZ', cambio) === null, 'sin cambio de una moneda: null (no se inventa)')
ok(D.convertir({ amount: 5, currency: 'MXN' }, 'EUR', null) === null, 'sin cambio guardado: null')
ok(D.convertir({ amount: 5, currency: 'EUR' }, 'EUR', null)?.amount === 5, 'la misma moneda no necesita cambio')

console.log('Presupuesto')
const dia = (n, extra = {}) => ({ id: `d${n}`, dayNumber: n, city: 'Roma', countryCode: 'it', stops: [], ...extra })
const route = { id: 'r', destination: 'Roma', origin: 'Madrid', days: [dia(1), dia(2), dia(3), dia(4)], answers: { dateRange: { start: '2026-10-13', end: '2026-10-16' }, companion: 'couple' } }
const reserva = (id, refId, name, dateIso, time, precio) => ({ id, kind: 'entrada', refId, name, placeNames: [name], dateIso, dayNumber: null, time, precio })
const base = {
  route: {
    ...route,
    arrivalPrecio: { amount: 180, currency: 'EUR' },
    departurePrecio: null,
    gastosExtras: [
      { id: 'e1', nombre: 'Taxi', precio: { amount: 800, currency: 'MXN' } },
      { id: 'e2', nombre: 'Cena', precio: { amount: 38.5, currency: 'EUR' } },
      { id: 'e3', nombre: 'Rara', precio: { amount: 10, currency: 'XYZ' } },
    ],
  },
  reservations: [
    reserva('a', 'Coliseo', 'Coliseo, Foro y Palatino', '2026-10-14', '10:00', { amount: 54, currency: 'EUR' }),
    reserva('b', 'Museos', 'Museos Vaticanos', '2026-10-15', '09:30', null),
    reserva('c', 'Free Tour', 'Free Tour por Roma', '2026-10-13', '10:00', { amount: 25, currency: 'EUR' }),
    reserva('d', 'Panteon', 'Panteón', '2026-10-13', '12:00', { amount: 12, currency: 'EUR' }),
  ],
  accommodationSelections: { d1: { name: 'Hotel Artemide', precio: { amount: 420, currency: 'EUR' } } },
  transportBookings: {},
  insuranceBooking: { provider: 'Seguro', startDate: '', endDate: '', precio: { amount: 30, currency: 'EUR' } },
  rentalVehicleBooking: null,
  esimPrecios: { it: { amount: 9.99, currency: 'EUR' } },
  moneda: 'EUR',
  cambio: { fecha: '2026-10-09', tasas: { MXN: 20 } },
  pago: true,
}
const r = P.construirPresupuesto(base)
const lineas = r.bloques.flatMap((b) => b.lineas)
// La suma que debe salir, hecha aparte y a mano: 180 + 420 + 54 + 12 + 30 + 9,99 + 40 (800 MXN) + 38,50
const esperado = Math.round((180 + 420 + 54 + 12 + 30 + 9.99 + 40 + 38.5) * 100) / 100
ok(r.total.amount === esperado && r.total.currency === 'EUR', `total = ${esperado} (sale ${r.total.amount})`)
ok(r.bloques.map((b) => b.id).join() === 'transporte,ruta,util,extras', 'los cuatro bloques, en su orden')
ok(!lineas.some((l) => /Free Tour/.test(l.nombre)) && !lineas.some((l) => l.id === 'reserva-c'), 'el Free Tour no suma nunca (aunque tuviera un precio guardado)')
ok(!lineas.some((l) => l.id === 'reserva-b'), 'lo reservado sin precio no sale (no es un gasto de 0)')
ok(r.bloques.find((b) => b.id === 'ruta').lineas.map((l) => l.id).join() === 'reserva-d,reserva-a', 'la ruta, por fecha y con su día debajo')
ok(r.bloques.find((b) => b.id === 'ruta').lineas[0].sub === 'Mar 13', 'el día de la línea, «Mar 13»')
ok(r.bloques.every((b) => b.suma.amount === Math.round(b.lineas.reduce((s, l) => s + (l.enMonedaViajero?.amount ?? 0), 0) * 100) / 100), 'cada bloque suma exactamente sus líneas')
ok(Math.abs(r.total.amount - r.bloques.reduce((s, b) => s + b.suma.amount, 0)) < 0.005, 'el total es la suma de los bloques')
const taxi = lineas.find((l) => l.id === 'extra-e1')
ok(taxi.precio.currency === 'MXN' && taxi.enMonedaViajero?.amount === 40, 'el extra en MXN se guarda en MXN y se convierte con el cambio guardado (800 MXN · ≈ 40 €)')
ok(r.sinCambio.length === 1 && r.sinCambio[0].id === 'extra-e3', 'una moneda sin cambio sale aparte')
ok(r.bloques.find((b) => b.id === 'extras').suma.amount === Math.round((40 + 38.5) * 100) / 100, 'lo que no tiene cambio no se suma (los extras suman 40 + 38,50, sin los 10 XYZ)')
ok(r.hayConversion === true, 'hay conversión (sale la línea «Cambio aproximado del …»)')
const gratis = P.construirPresupuesto({ ...base, pago: false })
ok(!gratis.bloques.flatMap((b) => b.lineas).some((l) => l.id === 'llegada'), 'sin lo de pago, el billete de llegada no cuenta')
ok(gratis.total.amount === Math.round((esperado - 180) * 100) / 100, 'sin lo de pago, el total baja exactamente lo del billete')
const vacio = P.construirPresupuesto({ ...base, route: { ...route }, reservations: [], accommodationSelections: {}, insuranceBooking: null, esimPrecios: {}, pago: true })
ok(vacio.bloques.length === 0 && vacio.total.amount === 0 && vacio.sinCambio.length === 0, 'todo vacío: sin bloques y total 0')
const mx = P.construirPresupuesto({ ...base, moneda: 'MXN', cambio: { fecha: '2026-10-09', tasas: { MXN: 20 } } })
ok(mx.total.currency === 'MXN' && Math.abs(mx.total.amount - esperado * 20) < 0.01, 'con el viajero en MXN, el total sale en MXN (el mismo total por 20)')
ok(mx.bloques.find((b) => b.id === 'transporte').lineas.find((l) => l.id === 'llegada').enMonedaViajero?.amount === 3600, 'un billete en EUR se pasa a la moneda del viajero (180 € → 3.600 MXN)')
// legado: precios guardados como número antes de la 6z2
const viejo = P.construirPresupuesto({ ...base, insuranceBooking: { provider: 'Seguro', startDate: '', endDate: '', price: 22 } })
ok(viejo.bloques.find((b) => b.id === 'util').lineas.find((l) => l.id === 'seguro').precio.amount === 22, 'un seguro guardado antes (price: 22) se lee como 22 €')

console.log('Cambio del BCE')
{
  const xml = `<gesmes:Envelope><Cube><Cube time='2026-10-09'><Cube currency='USD' rate='1.1206'/><Cube currency='MXN' rate='21.5'/></Cube></Cube></gesmes:Envelope>`
  const leido = leerXmlBce(xml)
  ok(leido?.fecha === '2026-10-09' && leido.tasas.USD === 1.1206 && leido.tasas.MXN === 21.5, 'el XML del BCE se lee (fecha y tasas)')
  ok(leerXmlBce('<xml/>') === null, 'un XML sin tasas no se guarda')
  let llamadas = 0
  const pedir = async () => {
    llamadas++
    return { ok: true, text: async () => xml }
  }
  const primero = await cambioDelDia(pedir)
  const segundo = await cambioDelDia(pedir)
  ok(llamadas <= 1 && primero.tasas.MXN !== undefined && segundo.tasas.MXN !== undefined, 'el servidor pide el cambio como mucho una vez y lo guarda')
}

console.log('Stay22 y código')
{
  const url = M.mapaAlojamientoUrl({ embed: 'https://www.stay22.com/embed/abc' }, { answers: { dateRange: { start: '2026-10-13', end: '2026-10-17' } } }, 'app-1', 'MXN')
  ok(new URL(url).searchParams.get('currency') === 'MXN', 'el mapa de Stay22 lleva currency= con la moneda del viajero')
  const recorrer = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? recorrer(path.join(dir, e.name)) : [path.join(dir, e.name)]))
  for (const archivo of recorrer('src').filter((f) => /\.(ts|tsx)$/.test(f))) {
    const lineasCodigo = fs.readFileSync(archivo, 'utf8').split(/\r?\n/)
    lineasCodigo.forEach((linea, i) => {
      if (!linea.includes('€')) return
      if (/^\s*(\/\/|\*|\/\*)/.test(linea)) return
      const sinSimbolosDeNivel = linea.replace(/['"]€{1,3}['"]/g, '').replace(/'€{1,3}'\s*\|/g, '')
      // los comentarios al final de la línea no cuentan
      const codigo = sinSimbolosDeNivel.replace(/\{\/\*.*?\*\/\}/g, '').replace(/\s\/\/.*$/, '')
      ok(!codigo.includes('€'), `${archivo}:${i + 1}: «€» escrito a mano en el código`)
    })
  }
  const almacen = fs.readFileSync('src/store/useRouteStore.ts', 'utf8')
  ok(!/addBudgetItem|removeBudgetItem|linkBudgetItem|triggerBudgetFly/.test(almacen), 'el presupuesto viejo ya no está en el almacén')
  ok(!fs.existsSync('src/components/budget') || fs.readdirSync('src/components/budget').length === 0, 'el BudgetPanel viejo ya no existe')
}

console.log(fallos === 0 ? `\n6z2: ${comprobaciones} comprobaciones, 0 fallos` : `\n6z2: ${comprobaciones} comprobaciones, ${fallos} fallos`)
process.exit(fallos === 0 ? 0 : 1)
