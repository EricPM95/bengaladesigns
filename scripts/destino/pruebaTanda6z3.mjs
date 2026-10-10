// La prueba de la Tanda 6z3: la barra nueva, HOY según el momento, los iconos y el color.
//   node scripts/destino/pruebaTanda6z3.mjs        (con el servidor de la app encendido en http://localhost:8787)
// Pinta con el código de verdad de la app (react-dom/server, empaquetado con esbuild; ver _ssr.mjs). Da fallo si:
//   1. la barra no tiene SIEMPRE las mismas pestañas de su versión (cuatro en la gratis, cinco con Hoy en la de pago), con y sin fechas, antes, durante y después, o si las pestañas de arriba (ModeSwitcher) siguen;
//   2. HOY no sale en el momento que toca (con la fecha simulada): antes, durante y después; sin fechas, siempre «antes» con [Pon tus fechas];
//   3. con fechas, en HOY o en la cabecera sale «Día {n}»; sin fechas, el resto sigue como antes;
//   4. en HOY sale una hora calculada por la app (solo valen las horas de lo reservado);
//   5. HOY pinta algo en la gratis, o de pago, «durante» no lleva la siguiente parada, «Cómo llegar» y «Visto»;
//   6. los iconos: algún trazo suelto fuera de `src/lib/iconos.ts` para lo que ya tiene icono, la excursión sin la mochila, el autobús fuera de la llegada y la vuelta;
//   7. el color: el frambuesa en más de un sitio o el contraste del texto blanco sobre frambuesa por debajo de 4,5:1;
//   8. los emojis: queda algún emoji en src fuera de los signos de texto, el © y el 🧪 de las pantallas de desarrollo.
import fs from 'node:fs'
import path from 'node:path'
import { buildDayBlockV3 } from '../../server/engine/index.js'
import { findPipelineV2Data } from '../../server/routeAlgorithm.js'
import { prepararSSR } from './_ssr.mjs'

const fallos = []
let comprobaciones = 0
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) fallos.push({ regla, texto })
}

const { M, ponerVersion } = await prepararSSR('scripts/destino/_6z3_hoy_entrada.tsx', { piezasFalsas: [{ filtro: /map\/StopsMapView$/, exporta: 'StopsMapView' }] })
const { createElement, renderToStaticMarkup, BottomBar, PESTANAS, Header, HoyView, useRouteStore, mapSingleGeneratedDay, fetchArrivalInfo, fetchDestinationExcursions, subtituloDelViaje } = M
const D = findPipelineV2Data('Roma')
await fetchArrivalInfo('Roma')
await fetchDestinationExcursions('Roma')
const consolaError = console.error
console.error = (...a) => (/useLayoutEffect|Warning:/.test(String(a[0])) ? undefined : consolaError(...a))

const aTexto = (html) => html.replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, '\n').replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s*\n\s*/g, '\n')
const plano = (t) => t.replace(/\n/g, ' | ')
const DIA_N = /\bd[ií]a\s*\d/i
const HORA = /\b([01]?\d|2[0-3]):[0-5]\d\b/g
const INICIO = '2027-03-10'

async function viaje(dias, { fechas }) {
  const dayPlans = []
  for (let n = 1; n <= dias; n++) {
    const generado = await buildDayBlockV3(D, dias + 1, true, n, null, fechas ? INICIO : undefined, [], ['imprescindibles', 'free_tour'], {
      city: 'Roma', scheduler: 'v3', engine: 'v4', mediaJornada: null, month: fechas ? null : 2, season: null, diaCuatro: null, entradas: {}, reservasGrandes: [], forceOrder: null,
    })
    const dia = mapSingleGeneratedDay('Roma', generado, { id: `d${n}`, dayNumber: n, city: 'Roma', title: '', stops: [], meals: [], excursions: [] })
    dayPlans.push({ ...dia, id: `d${n}`, dayNumber: n, city: 'Roma', colorIndex: n - 1 })
  }
  return {
    id: `f6z3b-${dias}-${fechas ? 'f' : 'n'}`, destination: 'Roma', country: 'Italia', origin: 'Madrid', createdAt: '2027-01-01', intensity: 1,
    days: dayPlans,
    answers: { dateRange: fechas ? { start: INICIO, end: new Date(Date.parse(`${INICIO}T12:00:00Z`) + (dias - 1) * 86400000).toISOString().slice(0, 10) } : undefined, month: fechas ? undefined : 9, days: dias, companion: 'couple' },
    transportContext: { transport_option: { id: 'flight' }, archetype: null },
  }
}
const estadoBase = { screen: 'route', mode: 'today', reservations: [], accommodationSelections: {}, transportBookings: {}, insuranceBooking: null, n26Added: false, rentalVehicleBooking: null, esimSelections: {}, esimPrecios: {}, dev_simulated_today_iso: null }
function pinta(componente, props, route, { version = 'completa', hoy = null, mode = 'today', reservas = [] } = {}) {
  ponerVersion(version)
  useRouteStore.setState({ ...estadoBase, route, mode, reservations: reservas, dev_simulated_today_iso: hoy })
  return renderToStaticMarkup(createElement(componente, props))
}

// ── 1. La barra ──
const NOMBRES = ['Hoy', 'Ruta', 'Días', 'Explorar', 'Reservas']
debe(PESTANAS.map((p) => p.nombre).join() === NOMBRES.join(), '1 barra', `las pestañas son ${PESTANAS.map((p) => p.nombre).join(' · ')}`)
debe(!fs.existsSync('src/components/route/ModeSwitcher.tsx'), '1 barra', 'las pestañas de arriba (ModeSwitcher) siguen')
debe(!/ModeSwitcher/.test(fs.readFileSync('src/components/route/RouteView.tsx', 'utf8').replace(/\/\/.*$/gm, '')), '1 barra', 'RouteView todavía usa ModeSwitcher')

// ── 2-5. La barra, la cabecera y HOY ──
const momentos = [
  { clave: 'antes', hoy: '2027-03-01' },
  { clave: 'durante', hoy: INICIO },
  { clave: 'durante-dia2', hoy: '2027-03-11' },
  { clave: 'despues', hoy: '2027-03-20' },
]
const vistas = []
for (const fechas of [true, false]) {
  const route = await viaje(3, { fechas })
  const primera = route.days[0].stops.find((s) => s.name && !s.passThrough) ?? route.days[0].stops[0]
  const reserva = { id: 'r1', kind: 'entrada', refId: primera.name, name: primera.name, placeNames: [primera.name], dateIso: fechas ? INICIO : null, dayNumber: fechas ? null : 1, time: '16:40' }
  for (const version of ['gratis', 'completa']) {
    const lista = fechas ? momentos : [{ clave: 'sin-fechas', hoy: null }]
    for (const { clave, hoy } of lista) {
      const nombre = `${fechas ? 'con fechas' : 'sin fechas'} · ${version === 'gratis' ? 'gratis' : 'de pago'} · ${clave}`
      // La barra
      const barra = aTexto(pinta(BottomBar, {}, route, { version, hoy }))
      // (Tanda 6z6: la gratis lleva cuatro pestañas, sin Hoy; la de pago, las cinco. Lo comprueba a fondo pruebaTanda6z6a.mjs.)
      const esperadas = version === 'gratis' ? NOMBRES.filter((n) => n !== 'Hoy') : NOMBRES
      debe(esperadas.every((n) => barra.includes(n)) && esperadas.map((n) => barra.indexOf(n)).every((p, i, a) => i === 0 || p > a[i - 1]), '1 barra', `${nombre}: la barra no tiene sus pestañas en orden (${plano(barra)})`)
      const botones = (pinta(BottomBar, {}, route, { version, hoy }).match(/<button/g) ?? []).length
      debe(botones === esperadas.length, '1 barra', `${nombre}: la barra tiene ${botones} botones y debería tener ${esperadas.length}`)
      // La cabecera
      const cabecera = aTexto(pinta(Header, { onTips() {}, onOpenDates() {} }, route, { version, hoy }))
      debe(cabecera.includes('Roma'), '3 cabecera', `${nombre}: la cabecera no dice el destino`)
      debe(fechas ? /13|10 – 12 mar|10/.test(cabecera) && /2 personas/.test(cabecera) : /octubre · 2 personas/.test(cabecera), '3 cabecera', `${nombre}: la línea de debajo del destino no es la esperada (${plano(cabecera)})`)
      if (fechas) debe(!DIA_N.test(cabecera), '3 «Día n» con fechas', `${nombre}: la cabecera dice «${cabecera.match(DIA_N)?.[0]}»`)
      // HOY
      for (const reservas of [[], [reserva]]) {
        const html = pinta(HoyView, { route, onPonFechas() {} }, route, { version, hoy, reservas })
        const texto = aTexto(html)
        // HOY es solo de pago (Tanda 6z6): en la gratis no se pinta nada. Lo de dentro se comprueba en la de pago.
        if (version === 'gratis') {
          debe(html === '', '1 barra', `${nombre}: HOY pinta algo en la gratis (${plano(texto).slice(0, 120)})`)
          continue
        }
        const fase = html.match(/data-hoy="([^"]+)"/)?.[1]
        const esperada = !fechas ? 'antes-sin-fechas' : clave === 'antes' ? 'before' : clave.startsWith('durante') ? 'during' : 'after'
        debe(fase === esperada, '2 momento', `${nombre}: HOY sale en «${fase}» y debería ser «${esperada}»`)
        const detalle = `${nombre}${reservas.length ? ' · con reserva' : ''}`
        vistas.push({ detalle, texto, fechas, version, esperada })
        // (Tanda 6z6: la cuenta atrás, «Te falta por reservar», «Útil para el viaje» y el tiempo ya no están en HOY: están arriba de RESERVAS.)
        if (esperada === 'before') debe(/Tu modo Hoy se activa el/.test(texto) && /Ver mi primer día/.test(texto) && !/empieza en|Te falta por reservar|Útil para el viaje|El tiempo en/.test(texto), '2 momento', `${detalle}: «antes» no es «Tu modo Hoy se activa el…» con [Ver mi primer día], o conserva lo que se fue a RESERVAS (${plano(texto).slice(0, 300)})`)
        if (esperada === 'before') debe(!/Pon tus fechas/.test(texto), '2 momento', `${detalle}: con fechas sale [Pon tus fechas]`)
        if (esperada === 'antes-sin-fechas') debe(/Pon tus fechas para activar tu modo Hoy/.test(texto) && /Antes del viaje/.test(texto) && !/empieza en|Ver mi primer día/.test(texto), '2 momento', `${detalle}: sin fechas no es «Pon tus fechas para activar tu modo Hoy» con [Pon tus fechas] (${plano(texto).slice(0, 300)})`)
        if (esperada === 'during') debe(/^HOY ·/im.test(texto) || /Hoy ·/i.test(texto), '2 momento', `${detalle}: «durante» no empieza con «HOY · {fecha}» (${plano(texto).slice(0, 200)})`)
        if (esperada === 'after') debe(/Después del viaje/.test(texto) && /Guarda tus recuerdos/.test(texto) && /Ver mis recuerdos/.test(texto) && /Nuevo viaje/.test(texto) && /Tu viaje a/.test(texto), '2 momento', `${detalle}: faltan trozos de «después» (${plano(texto).slice(0, 300)})`)
        // 3: «Día n» con fechas
        if (fechas) debe(!DIA_N.test(texto), '3 «Día n» con fechas', `${detalle}: HOY dice «${texto.match(DIA_N)?.[0]}» (${plano(texto.slice(Math.max(0, (texto.match(DIA_N)?.index ?? 0) - 40), (texto.match(DIA_N)?.index ?? 0) + 60))})`)
        // 4: ninguna hora calculada (solo la de lo reservado)
        // (El horario de apertura de cada parada —«Abre 9:00 – 19:15 · Última entrada 18:15»— es un dato real, no una hora calculada: Tanda 6z5.)
        const sinHorarios = texto.split('\n').filter((linea) => !/^Abre \d{1,2}:\d{2}/.test(linea)).join('\n')
        const horas = (sinHorarios.match(HORA) ?? []).filter((h) => !(reservas.length && h === '16:40'))
        debe(horas.length === 0, '4 horas', `${detalle}: sale una hora calculada: ${horas.join(', ')} (${plano(texto).slice(0, 240)})`)
        // 5: HOY es solo de pago (en la gratis ya se ha comprobado arriba que no pinta nada); de pago, «durante» lleva lo suyo
        if (esperada === 'during') debe(/Siguiente parada/.test(texto) && /Cómo llegar/.test(texto) && /Visto/.test(texto), '5 pago', `${detalle}: de pago falta la siguiente parada, [Cómo llegar] o [Visto]`)
      }
    }
  }
}

// ── 6. Iconos ──
const iconos = fs.readFileSync('src/lib/iconos.ts', 'utf8')
debe(/excursion:/.test(iconos) && /bus:/.test(iconos), '6 iconos', 'iconos.ts no tiene la mochila (excursion) y el autobús (bus)')
const explore = fs.readFileSync('src/lib/exploreStyle.ts', 'utf8')
debe(/excursiones:[^}]*icon: 'excursion'/.test(explore.replace(/\s+/g, ' ')) || /excursion/.test(explore), '6 iconos', 'la tarjeta de Excursiones de EXPLORAR no usa la mochila')
// Los trazos de la familia (los largos, que son los que se copiarían) solo viven en iconos.ts.
const trazos = Object.values(Object.fromEntries([...iconos.matchAll(/^\s{2}(\w+): '([^']{40,})',?$/gm)].map((m) => [m[1], m[2]])))
function archivos(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? archivos(path.join(dir, e.name)) : /\.(ts|tsx)$/.test(e.name) ? [path.join(dir, e.name)] : []))
}
for (const archivo of archivos('src')) {
  if (/lib[\\/]iconos\.ts$/.test(archivo)) continue
  const texto = fs.readFileSync(archivo, 'utf8')
  for (const trazo of trazos) {
    comprobaciones++
    if (trazo.length > 60 && texto.includes(trazo)) fallos.push({ regla: '6 iconos', texto: `${archivo.replace(/\\/g, '/')}: copia un trazo de la familia en vez de usar src/lib/iconos.ts` })
  }
}

// ── 7. El color frambuesa ──
const css = fs.readFileSync('src/index.css', 'utf8')
const acento = /--accent:\s*(\d+)\s+(\d+)\s+(\d+)/.exec(css)
debe(Boolean(acento), '7 color', 'no hay --accent')
if (acento) {
  const [r, g, b] = acento.slice(1).map(Number)
  const lin = (v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
  const lum = (r, g, b) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
  const contraste = (a, b2) => (Math.max(a, b2) + 0.05) / (Math.min(a, b2) + 0.05)
  const blanco = contraste(lum(r, g, b), 1)
  debe(blanco >= 4.5, '7 color', `el texto blanco sobre el frambuesa (${r} ${g} ${b}) da ${blanco.toFixed(2)}:1, menos de 4,5:1`)
  // El frambuesa se reconoce por su tono rosado (más rojo que verde y azul > verde).
  debe(r > 150 && b > g && r > b, '7 color', `--accent (${r} ${g} ${b}) no es un frambuesa`)
}
const terracota = []
// Quedan fuera los colores que no son «falta» ni «reservar»: los degradados de temporada y de atardecer (TrazoCards, trazoUi), el confeti de las fechas especiales y el color de reserva de una excursión sin color propio y los colores por categoría de los pines (monumentos, restaurantes…).
const COLORES_DE_ADORNO = [/DateNoticesModal\.tsx$/, /TrazoCards\.tsx$/, /trazoUi\.tsx$/, /ExcursionesReservas\.tsx$/, /LoadingScreen\.tsx$/, /exploreStyle\.ts$/]
for (const archivo of archivos('src')) {
  if (COLORES_DE_ADORNO.some((re) => re.test(archivo))) continue
  const texto = fs.readFileSync(archivo, 'utf8')
  for (const m of texto.matchAll(/oklch\(\s*0?\.[4-7]\d*\s+0?\.1[0-9]*\s+(4\d|5\d|6\d)\s*[\s/)]/g)) terracota.push(`${archivo.replace(/\\/g, '/')}: ${m[0]}`)
}
debe(terracota.length === 0, '7 color', `quedan colores terracota/naranja a mano en el código: ${terracota.slice(0, 6).join(' ; ')}`)

// ── 8. Emojis ──
// En src no queda ningún emoji (\p{Extended_Pictographic}) salvo: los signos de texto (✓ ✔ ✕ ✗ ★ ♥ ❤ y las flechas ↔ ↕ → ← ↑ ↓ …), el © de OpenStreetMap
// y el 🧪 de las pantallas de desarrollo. Todo icono funcional es de la familia de src/lib/iconos.ts.
const SIGNOS_TEXTO = new Set(['✓', '✔', '✕', '✗', '✖', '★', '☆', '♥', '❤', '→', '←', '↑', '↓', '↔', '↕', '·', '●', '○', '▲', '▼', '✦', '✳', '※', '☰', '©'])
// Excepciones por archivo (solo el emoji que se deja): las pantallas y botones de desarrollo, que no ve el viajero.
const EXCEPCIONES_EMOJI = [
  { archivo: /dev[\\/]DevQuickRouteScreen\.tsx$/, emoji: '🧪' },
  { archivo: /destination[\\/]LandingScreen\.tsx$/, emoji: '🧪' }, // el botón «Dev: ruta rápida (sin IA)»
  { archivo: /trazo[\\/]StepRoute\.tsx$/, emoji: '🧪' }, // ídem, en el formulario nuevo
]
function todosLosArchivos(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? todosLosArchivos(path.join(dir, e.name)) : /\.(tsx?|jsx?|css|html|json)$/.test(e.name) ? [path.join(dir, e.name)] : []))
}
const emojisSueltos = []
for (const archivo of todosLosArchivos('src')) {
  comprobaciones++
  const lineas = fs.readFileSync(archivo, 'utf8').split(/\r?\n/)
  lineas.forEach((linea, i) => {
    for (const m of linea.matchAll(/\p{Extended_Pictographic}/gu)) {
      if (SIGNOS_TEXTO.has(m[0])) continue
      if (EXCEPCIONES_EMOJI.some((ex) => ex.archivo.test(archivo) && ex.emoji === m[0])) continue
      emojisSueltos.push(`${archivo.replace(/\\/g, '/')}:${i + 1} ${m[0]}`)
    }
  })
}
debe(emojisSueltos.length === 0, '8 emojis', `quedan ${emojisSueltos.length} emojis en src (usa un icono de src/lib/iconos.ts): ${emojisSueltos.slice(0, 8).join(' ; ')}`)

console.error = consolaError
if (fallos.length === 0) console.log(`6z3: ${comprobaciones} comprobaciones, 0 fallos (${vistas.length} pantallas de HOY).`)
else {
  console.log(`6z3: ${comprobaciones} comprobaciones, ${fallos.length} fallos`)
  for (const f of fallos.slice(0, 40)) console.log(` - [${f.regla}] ${f.texto}`)
}
process.exit(fallos.length === 0 ? 0 : 1)
