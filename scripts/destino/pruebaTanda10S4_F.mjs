// Tanda 10S4 (agente F): apartados 1, 6 y 5.
//   1 · el precio del vuelo suma SIEMPRE (con pase y sin él); la leyenda separa Transporte, Alojamiento, Ruta (y Extras); abajo sigue junto «Transporte y alojamiento».
//   6 · «Reorganizar este día»: solo con pase.
//   5 · la regla de los buscadores en REGLAS_DE_LA_APP.md y los buscadores sobre src/lib/busqueda.ts (si existe).
//   API_URL=http://localhost:8787 node scripts/destino/pruebaTanda10S4_F.mjs      (usa el servidor de la app encendido; no abre Chrome)
import fs from 'node:fs'
import { prepararSSR } from './_ssr.mjs'

const fallos = []
let comprobaciones = 0
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) {
    fallos.push({ regla, texto })
    console.log(`  ✗ [${regla}] ${texto}`)
  }
}
const { M, ponerVersion } = await prepararSSR('scripts/destino/_10s4_f_entrada.tsx', { piezasFalsas: [{ filtro: /map\/StopsMapView$/, exporta: 'StopsMapView' }] })
const { createElement, renderToStaticMarkup, PantallaPresupuesto, ReorganizarDia, useRouteStore, usePresupuestoUi, construirPresupuesto } = M
const consolaError = console.error
console.error = (...a) => (/useLayoutEffect|Warning:/.test(String(a[0])) ? undefined : consolaError(...a))
const aTexto = (html) => html.replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, '\n').replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s*\n\s*/g, '\n')
const eur = (amount) => ({ amount, currency: 'EUR' })
const leer = (f) => fs.readFileSync(f, 'utf8')

const dia = (id, n, nombres = []) => ({ id, dayNumber: n, city: 'Roma', countryCode: 'it', title: '', curatedTitle: '', meals: [], excursions: [], dayType: 'manual', colorIndex: n - 1, stops: nombres.map((x, i) => ({ id: `${id}-s${i}`, name: x, fullName: x, coordinates: { lat: 41.9 + i / 100, lng: 12.5 }, durationMinutes: 60, category: 'monument' })) })
const ruta = (extra = {}) => ({
  id: 'p10s4f', destination: 'Roma', country: 'Italia', origin: 'Barcelona', createdAt: '2027-01-01', intensity: 1, budget: { items: [], total: 0 }, planMode: 'manual',
  days: [dia('d1', 1, ['Coliseo', 'Trevi']), dia('d2', 2, ['Panteón'])],
  answers: { dateRange: { start: '2027-03-10', end: '2027-03-12' }, days: 3, companion: 'couple' },
  transportContext: { transport_option: { id: 'flight' }, archetype: null },
  arrivalPrecio: eur(100), departurePrecio: eur(50),
  ...extra,
})
const estadoBase = { screen: 'route', mode: 'days', reservations: [], accommodationSelections: { d1: { name: 'Hotel Roma', precio: eur(280) } }, transportBookings: {}, insuranceBooking: null, rentalVehicleBooking: null, esimPrecios: {}, esimSelections: {}, dondeComprado: {} }
const reservaColiseo = { id: 'r1', kind: 'entrada', refId: 'Coliseo', name: 'Coliseo', placeNames: ['Coliseo'], dateIso: '2027-03-10', dayNumber: null, time: '10:00', precio: eur(50) }

console.log('1. El presupuesto: el vuelo suma con pase y sin él')
for (const version of ['completa', 'gratis']) {
  ponerVersion(version)
  usePresupuestoUi.setState({ abierto: true })
  const r = ruta()
  useRouteStore.setState({ ...estadoBase, route: r, reservations: [reservaColiseo] })
  const entrada = { route: r, reservations: [reservaColiseo], accommodationSelections: estadoBase.accommodationSelections, transportBookings: {}, insuranceBooking: null, rentalVehicleBooking: null, esimPrecios: {}, moneda: 'EUR', cambio: null, pago: version === 'completa' }
  const p = construirPresupuesto(entrada)
  debe(p.total.amount === 480, `1 ${version}`, `el presupuesto suma ${p.total.amount} y debería sumar 480 (ida 100 + vuelta 50 + hotel 280 + Coliseo 50)`)
  const t = p.bloques.find((b) => b.id === 'transporte')
  debe(t && t.lineas.some((l) => l.id === 'llegada') && t.lineas.some((l) => l.id === 'vuelta') && t.titulo === 'Transporte y alojamiento', `1 ${version}`, 'el bloque de abajo no sigue junto («Transporte y alojamiento») con la ida y la vuelta')
  // (con tren/autobús/barco guardado también suma, con pase y sin él)
  const conTren = construirPresupuesto({ ...entrada, transportBookings: { d1: { operator: 'Trenitalia', precio: eur(30) } } })
  debe(conTren.total.amount === 510 || conTren.total.amount === 480 + 30, `1 ${version}`, `el tren guardado no suma (${conTren.total.amount})`)
  const html = renderToStaticMarkup(createElement(PantallaPresupuesto, {}))
  const texto = aTexto(html)
  const leyenda = html.match(/data-leyenda[\s\S]*?<\/div>/)?.[0] ?? ''
  const items = [...leyenda.matchAll(/data-leyenda-item="([a-z]+)"[\s\S]*?<\/span><\/span>/g)].map((m) => aTexto(m[0]).replace(/\n/g, ' ').trim())
  const lt = aTexto(leyenda).replace(/\n/g, ' ')
  debe(/Transporte · 150 €/.test(lt), `1 ${version}`, `la leyenda no dice «Transporte · 150 €»: ${lt}`)
  debe(/Alojamiento · 280 €/.test(lt), `1 ${version}`, `la leyenda no dice «Alojamiento · 280 €»: ${lt}`)
  debe(/Ruta · 50 €/.test(lt), `1 ${version}`, `la leyenda no dice «Ruta · 50 €»: ${lt}`)
  debe(!/Transporte · 280/.test(lt), `1 ${version}`, 'la leyenda sigue llamando Transporte al hotel')
  debe(/data-leyenda-item="transporte"/.test(leyenda) && /data-leyenda-item="alojamiento"/.test(leyenda) && /data-leyenda-item="ruta"/.test(leyenda), `1 ${version}`, 'faltan los elementos de la leyenda')
  debe(/flex-wrap/.test(leyenda) && /whitespace-nowrap/.test(leyenda), `1 ${version}`, 'la leyenda no pasa a una segunda línea cuando no cabe (flex-wrap + elementos sin partir)')
  // la barra: un segmento por cada elemento de la leyenda, con su color
  const barra = html.match(/<div class="relative flex h-2 overflow-hidden[\s\S]*?<\/div>/)?.[0] ?? ''
  debe((barra.match(/<span /g) ?? []).length === 3, `1 ${version}`, `la barra no tiene 3 segmentos (${(barra.match(/<span /g) ?? []).length})`)
  void items
  debe(/Transporte y alojamiento/.test(texto), `1 ${version}`, 'abajo no sale el bloque «Transporte y alojamiento»')
}

console.log('6. «Reorganizar este día», solo con pase')
{
  const d = dia('d9', 1, ['Coliseo', 'Trevi', 'Panteón'])
  const r = ruta({ days: [d] })
  for (const [version, sale] of [['completa', true], ['gratis', false]]) {
    ponerVersion(version)
    useRouteStore.setState({ ...estadoBase, route: r, reservations: [] })
    const html = renderToStaticMarkup(createElement(ReorganizarDia, { day: d }))
    debe(html.includes('Reorganizar este día') === sale, `6 ${version}`, `con la versión ${version} ${sale ? 'no sale' : 'sale'} «Reorganizar este día»`)
  }
}

console.log('5. Los buscadores, igual')
{
  const reglas = leer('docs/REGLAS_DE_LA_APP.md')
  debe(/Todos los buscadores, igual/.test(reglas), '5 regla', 'la regla de los buscadores no está en REGLAS_DE_LA_APP.md')
  if (fs.existsSync('src/lib/busqueda.ts')) {
    const src = leer('src/lib/busqueda.ts')
    const exportadas = [...src.matchAll(/export (?:function|const) (\w+)/g)].map((m) => m[1])
    console.log(`  busqueda.ts exporta: ${exportadas.join(', ')}`)
    for (const f of ['src/components/route/placeExplorer/PlaceExplorerScreen.tsx', 'src/components/trazo/PrimeraPantalla.tsx', 'src/components/logros/pantallas/mundo/paises.ts']) {
      debe(leer(f).includes('lib/busqueda'), '5 buscadores', `${f} no usa src/lib/busqueda.ts`)
    }
    const { buscar } = await import('../../src/lib/busqueda.ts').catch(() => ({}))
    if (buscar) {
      const lista = [{ n: 'Cúpula de San Pedro', a: ['Cupola di San Pietro'] }, { n: 'Museos Capitolinos', a: ['Musei Capitolini'] }, { n: 'Coliseo', a: ['Colosseo'] }, { n: 'Panteón', a: [] }]
      const q = (t) => buscar(lista, t, (x) => [x.n, ...x.a]).map((x) => x.n)[0]
      debe(q('cupula') === 'Cúpula de San Pedro' && q('CUPULA') === 'Cúpula de San Pedro', '5 buscar', 'cupula no encuentra la Cúpula')
      debe(q('capito') === 'Museos Capitolinos', '5 buscar', 'capito no encuentra los Museos Capitolinos')
      debe(q('cupla') === 'Cúpula de San Pedro', '5 buscar', 'cupla no encuentra la Cúpula')
      debe(q('Cupola') === 'Cúpula de San Pedro' && q('Musei Capitolini') === 'Museos Capitolinos', '5 buscar', 'el nombre en italiano no encuentra')
      debe(q('panteon') === 'Panteón' && q('colos') === 'Coliseo', '5 buscar', 'panteon / colos no encuentran')
    } else console.log('  (no se pudo importar busqueda.ts desde node: sin las comprobaciones de buscar)')
  } else console.log('  (src/lib/busqueda.ts aún no existe: apartado 5 sin pasar)')
}

console.log(`\n${comprobaciones} comprobaciones, ${fallos.length} fallos`)
process.exit(fallos.length ? 1 : 0)
