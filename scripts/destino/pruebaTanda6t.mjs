// La prueba de la Tanda 6t (PROMPT_TANDA6T_PARA_PEGAR.md): la barra y la ventana de llegada y de vuelta, nuevas.
//   node scripts/destino/pruebaTanda6t.mjs [out=docs/dias/PRUEBA_TANDA6T.md]
// Hace falta el servidor de la app encendido (http://localhost:8787). Pinta la barra, la ventana (con los datos de `_llegada.json` que da el servidor) y RESERVAS con el código de verdad de la app
// (react-dom/server, empaquetado con esbuild), en los cinco medios, a la llegada y a la vuelta, con y sin hora, con y sin punto elegido, en la versión gratis y en la de pago. Da fallo si:
//   1. sale «Fuente» en la ventana (ni en las formas de llegar, ni en los bloques, ni en los Tips) o «Tu primera parada»;
//   2. sale una hora que calcula la app («En el centro», «libre hacia», «Sal a las», «Libre hasta», «Maleta a las») en la barra, en la ventana o en RESERVAS;
//   3. la pestaña «Traslados» sale fuera de Fiumicino, Ciampino y Civitavecchia (o no sale en ellos, con enlace en los datos), o sale en tren, autobús o coche;
//   4. en la versión gratis sale «Añadir» o «+ Vuelo» (la fila de la ventana, el botón de la barra);
//   5. con hora, la barra dice «Añade tu …» o lleva el botón «+ Vuelo»;
//   6. los textos de la barra no son los del encargo (de pago sin hora, con hora, gratis y coche, a la llegada y a la vuelta), o sale «null», «undefined», «NaN» o una llave sin rellenar;
//   7. los datos: ningún `privado`, el traslado solo en Fiumicino, Ciampino y Civitavecchia y sin «#»; la ventana lleva el texto del traslado de los datos (destino y punto, nada de Roma en el código);
//   8. sale el nombre de un proveedor en un texto del viajero.
import fs from 'node:fs'
import { prepararSSR } from './_ssr.mjs'

const args = Object.fromEntries(process.argv.slice(2).map((x) => x.split(/=(.*)/s).slice(0, 2)))
const out = args.out ?? 'docs/dias/PRUEBA_TANDA6T.md'
const fallos = []
const porRegla = new Map()
let comprobaciones = 0
const falla = (regla, texto) => {
  porRegla.set(regla, (porRegla.get(regla) ?? 0) + 1)
  if (fallos.length < 300) fallos.push({ regla, texto })
}
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) falla(regla, texto)
}

const { M, ponerVersion, limpiar } = await prepararSSR('scripts/destino/_6t_entrada.tsx', { piezasFalsas: [{ filtro: /map\/StopsMapView$/, exporta: 'StopsMapView' }] })
const { createElement, renderToStaticMarkup, ArrivalReturnBar, ArrivalReturnSheet, ReservasPanel, useRouteStore, fetchDestinationExcursions, fetchArrivalInfo, barTextOf, medioOf, tripModes } = M
useRouteStore.setState({ screen: 'route' })

await fetchDestinationExcursions('Roma')
const info = await fetchArrivalInfo('Roma')
const aTexto = (html) =>
  html
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<[^>]+>/g, '\n')
    .replace(/&amp;/g, '&')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s*\n\s*/g, '\n')

const HORAS_DE_LA_APP = /En el centro \d|EN EL CENTRO \d|libre hacia|Sal a las|SAL A LAS|Libre hasta|Maleta a las/i
const PROVEEDORES = /Civitatis|Stay22|Booking\.com|GetYourGuide|Viator|Skyscanner|Rentalcars|Holafly|Airalo|Heymondo|Iati|Mapfre/i
const LLAVES = /null|undefined|NaN|\{destino\}|\{punto\}|\{origen\}/
const ORIGEN = 'Barcelona'
const OPCION = { avion: 'flight', tren: 'train', bus: 'bus', ferry: 'ferry', coche: 'own_vehicle' }
const MODOS = ['avion', 'tren', 'bus', 'ferry', 'coche']
const PALABRA = { avion: 'vuelo', tren: 'tren', bus: 'autobús', ferry: 'barco' }
const BOTON = { avion: '+ Vuelo', tren: '+ Tren', bus: '+ Autobús', ferry: '+ Barco' }
const VOLVER = { avion: 'Cómo volver al aeropuerto', tren: 'Cómo volver a la estación', bus: 'Cómo volver a la estación', ferry: 'Cómo volver al puerto' }

// Un viaje de 3 días a Roma, con lo mínimo que mira la ventana (días con sus paradas para el mapa, que aquí es un hueco).
const route = (mode, extra = {}) => ({
  id: 'v6t', destination: 'Roma', country: 'Italia', origin: ORIGEN, createdAt: '2027-01-01', intensity: 1, budget: {},
  days: [1, 2, 3].map((n) => ({ id: `d${n}`, dayNumber: n, city: 'Roma', title: `Día ${n}`, dayType: 'normal', colorIndex: n - 1, meals: [], excursions: [], stops: [] })),
  answers: { dateRange: { start: '2027-03-10', end: '2027-03-12' }, days: 3 },
  transportContext: { transport_option: { id: OPCION[mode] }, archetype: null },
  ...extra,
})

const hoja = (r, kind, version, time, pointId) => {
  ponerVersion(version)
  const mode = kind === 'llegada' ? tripModes(r).arrival : tripModes(r).departure
  const medio = medioOf(info, mode)
  const props = { open: true, kind, route: r, mode, info, medio, origin: ORIGEN, dateIso: '2027-03-10', time, pointId, onEditBooking() {}, onClose() {} }
  return aTexto(renderToStaticMarkup(createElement(ArrivalReturnSheet, props)))
}
const barra = (kind, mode, version, time, point) => {
  const pago = version === 'completa'
  const text = barTextOf({ kind, mode, point, origin: ORIGEN, destino: info.ciudad, time, pago })
  const html = renderToStaticMarkup(createElement(ArrivalReturnBar, { mode, text, onOpen() {}, onAdd: pago ? () => {} : undefined }))
  return { text, plano: aTexto(html).replace(/\n/g, ' | ') }
}

// ── 7. Los datos ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// Por ahora ningún punto lleva traslado (las búsquedas daban resultados malos): sin traslado no hay pestaña «Traslados»; en cuanto un punto lleve `traslado: { url }` sale sola (se prueba más abajo con un punto de prueba).
const TRASLADO_EN = new Set([])
for (const [medioNombre, medio] of Object.entries(info.medios)) {
  for (const point of medio.puntos) {
    debe(!('privado' in point), '7 datos', `${point.id}: sigue teniendo «privado»`)
    debe(Boolean(point.traslado?.url) === TRASLADO_EN.has(point.id), '7 datos', `${point.id} (${medioNombre}): traslado ${point.traslado ? 'sí' : 'no'} y debería ser ${TRASLADO_EN.has(point.id) ? 'sí' : 'no'}`)
    if (point.traslado) {
      debe(!point.traslado.url.endsWith('#') && /^https:\/\//.test(point.traslado.url), '7 datos', `${point.id}: el enlace del traslado no vale (${point.traslado.url})`)
      debe(Object.keys(point.traslado).join() === 'url', '7 datos', `${point.id}: el traslado lleva algo más que el enlace (${Object.keys(point.traslado)})`)
    }
  }
}
const codigo = fs.readFileSync('src/components/route/dayDetail/ArrivalReturnSheet.tsx', 'utf8')
debe(!/Fuente/.test(codigo), '1 fuentes', 'ArrivalReturnSheet.tsx todavía habla de «Fuente»')
debe(!/Tu primera parada/.test(codigo), '1 fuentes', 'ArrivalReturnSheet.tsx todavía tiene «Tu primera parada»')
debe(!/Roma/.test(codigo.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')), '7 datos', 'ArrivalReturnSheet.tsx lleva «Roma» escrito en el código')
const reglas = fs.readFileSync('shared/arrival/arrivalRules.js', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
debe(!/Roma/.test(reglas), '7 datos', 'arrivalRules.js lleva «Roma» escrito en el código')

// ── La barra: los textos del encargo, en cada medio, a la llegada y a la vuelta ───────────────────────────────────────────────────────────────
const fco = medioOf(info, 'avion').puntos.find((p) => p.id === 'fco')
const cia = medioOf(info, 'avion').puntos.find((p) => p.id === 'cia')
for (const mode of MODOS) {
  for (const kind of ['llegada', 'vuelta']) {
    const llegada = kind === 'llegada'
    const cabeza = llegada ? 'LLEGADA' : 'VUELTA'
    const punto = mode === 'avion' ? (llegada ? fco : cia) : (medioOf(info, mode)?.puntos[0] ?? null)
    const corto = punto ? (punto.corto ?? punto.nombre) : null
    const et = `${mode} · ${kind}`
    // Coche (en las dos versiones): sin botón ni hora.
    if (mode === 'coche') {
      for (const version of ['gratis', 'completa']) {
        for (const time of [null, '11:20']) {
          const b = barra(kind, mode, version, time, null)
          debe(b.text.eyebrow === `${cabeza} · EN COCHE` && b.text.main === 'La ZTL y dónde aparcar' && !b.text.add && !b.text.pill, '6 textos', `${et} · ${version} · ${time ?? 'sin hora'}: ${b.plano}`)
        }
      }
      continue
    }
    // Gratis: sin botón ni pastilla, solo la flecha.
    for (const time of [null, '11:20']) {
      const b = barra(kind, mode, 'gratis', time, punto)
      const esperado = { eyebrow: `${cabeza} · ${llegada ? 'DESDE' : 'A'} ${ORIGEN.toUpperCase()}`, main: llegada ? `Cómo llegar a ${info.ciudad}` : VOLVER[mode] }
      debe(b.text.eyebrow === esperado.eyebrow && b.text.main === esperado.main && !b.text.add && !b.text.pill, '6 textos', `${et} · gratis: ${b.plano}`)
      debe(!/\+ (Vuelo|Tren|Autobús|Barco)|Añade|Añadir|✓/.test(b.plano), '4 gratis', `${et} · gratis: sale botón o «Añad…» (${b.plano})`)
      debe(/›/.test(b.plano), '4 gratis', `${et} · gratis: falta la flecha «›»`)
    }
    // De pago, sin hora.
    {
      const b = barra(kind, mode, 'completa', null, null)
      const esperado = {
        eyebrow: `${cabeza} · ${llegada ? 'DESDE' : 'A'} ${ORIGEN.toUpperCase()}`,
        main: llegada ? `Añade tu ${PALABRA[mode]} y ajustamos tu día` : `Añade tu ${PALABRA[mode]} de vuelta y ajustamos tu día`,
        add: BOTON[mode],
      }
      debe(b.text.eyebrow === esperado.eyebrow && b.text.main === esperado.main && b.text.add === esperado.add && !b.text.pill, '6 textos', `${et} · de pago sin hora: ${b.plano}`)
      debe(b.plano.includes(esperado.add), '6 textos', `${et} · de pago sin hora: falta el botón ${esperado.add}`)
    }
    // De pago, con hora (la que pone el viajero): sin «Añade tu…», sin botón, con la pastilla verde y nada de «libre…».
    {
      const b = barra(kind, mode, 'completa', '11:20', punto)
      const esperado = {
        eyebrow: `${cabeza} · ${corto.toUpperCase()}`,
        main: llegada ? `Cómo llegar desde ${corto}` : `Cómo llegar a ${corto}`,
        pill: '✓ 11:20',
      }
      debe(b.text.eyebrow === esperado.eyebrow && b.text.main === esperado.main && b.text.pill === esperado.pill && !b.text.add, '6 textos', `${et} · de pago con hora: ${b.plano}`)
      debe(!/Añade tu|\+ (Vuelo|Tren|Autobús|Barco)/.test(b.plano), '5 con hora', `${et} · con hora: sale «Añade tu…» o el botón (${b.plano})`)
      debe(!HORAS_DE_LA_APP.test(b.plano), '2 horas de la app', `${et} · con hora: sale una hora de la app (${b.plano})`)
    }
    // Todo: ni «null» ni llaves sin rellenar ni proveedores.
    for (const version of ['gratis', 'completa']) {
      for (const time of [null, '11:20']) {
        const b = barra(kind, mode, version, time, punto)
        debe(!LLAVES.test(b.plano) && !PROVEEDORES.test(b.plano), '6 textos', `${et} · ${version}: ${b.plano}`)
      }
    }
  }
}

// ── La ventana: cada medio, a la llegada y a la vuelta, con y sin hora, con y sin punto, gratis y de pago ───────────────────────────────────
const puntosDe = (mode) => medioOf(info, mode)?.puntos ?? []
let ventanas = 0
for (const mode of MODOS) {
  for (const kind of ['llegada', 'vuelta']) {
    const r = route(kind === 'llegada' ? mode : 'avion', kind === 'vuelta' ? { returnTransportOptionId: OPCION[mode] } : {})
    const elegibles = [null, ...puntosDe(mode).map((p) => p.id)]
    for (const version of ['gratis', 'completa']) {
      for (const time of [null, '11:20']) {
        for (const pointId of elegibles) {
          const et = `ventana ${mode} · ${kind} · ${version} · ${time ?? 'sin hora'} · punto ${pointId ?? 'sin elegir'}`
          let t
          try {
            t = hoja(r, kind, version, time, pointId)
          } catch (error) {
            falla('1 pinta', `${et}: no se pinta (${error.message})`)
            continue
          }
          ventanas++
          debe(t.includes(kind === 'llegada' ? 'LLEGADA' : 'VUELTA'), '1 pinta', `${et}: no sale la ventana`)
          debe(!/\bFuente\b/.test(t), '1 fuentes', `${et}: sale «Fuente»`)
          debe(!/primera parada/i.test(t), '1 fuentes', `${et}: sale «Tu primera parada»`)
          debe(!HORAS_DE_LA_APP.test(t), '2 horas de la app', `${et}: sale una hora de la app («${t.match(HORAS_DE_LA_APP)?.[0]}»)`)
          debe(!LLAVES.test(t), '6 textos', `${et}: sale «${t.match(LLAVES)?.[0]}»`)
          debe(!PROVEEDORES.test(t), '8 proveedor', `${et}: sale un proveedor («${t.match(PROVEEDORES)?.[0]}»)`)
          // Traslados: solo en aeropuerto y puerto, y solo si el punto a la vista tiene enlace en los datos.
          const aLaVista = version === 'completa' && pointId ? puntosDe(mode).filter((p) => p.id === pointId) : puntosDe(mode)
          const debeSalir = (mode === 'avion' || mode === 'ferry') && aLaVista.some((p) => p.traslado?.url)
          const sale = /\nTraslados\n/.test(t)
          debe(sale === debeSalir, '3 traslados', `${et}: la pestaña «Traslados» ${sale ? 'sale' : 'no sale'} y ${debeSalir ? 'debería' : 'no debería'}`)
          // La fila «Sin vuelo añadido · + Añadir vuelo».
          const fila = /Añadir (vuelo|tren|autobús|ferry)/.test(t)
          if (version === 'gratis') debe(!/Añadir|Editar|Sin (vuelo|tren|autobús|ferry) añadido/.test(t), '4 gratis', `${et}: sale «Añadir» o la fila de la reserva en la versión gratis`)
          else if (mode !== 'coche') {
            debe(fila === (time === null), '4 fila', `${et}: la fila «+ Añadir …» ${fila ? 'sale' : 'no sale'} y ${time === null ? 'debería' : 'no debería'}`)
            debe(/Editar/.test(t) === (time !== null), '4 fila', `${et}: «Editar» ${/Editar/.test(t) ? 'sale' : 'no sale'} y ${time !== null ? 'debería' : 'no debería'}`)
          }
          // El punto elegido: solo ese y «¿Llegas por otro sitio? Ver …» (de pago); sin elegir, todos.
          if (version === 'completa' && pointId && puntosDe(mode).length > 1 && mode !== 'coche') {
            debe(/¿Llegas por otro sitio\?|¿Prefieres el tuyo\?/.test(t), '4 punto', `${et}: falta «¿Llegas por otro sitio? Ver …»`)
          }
        }
      }
    }
  }
}

// ── Un punto de prueba CON traslado: la pestaña «Traslados» sale sola; al quitarlo, se va ───────────────────────────────────────────────────
{
  const r = route('avion')
  const puntoPrueba = puntosDe('avion').find((p) => p.id === 'fco')
  debe(Boolean(puntoPrueba), '3 traslados', 'no hay punto fco para la prueba con traslado')
  if (puntoPrueba) {
    debe(!/\nTraslados\n/.test(hoja(r, 'llegada', 'completa', null, null)), '3 traslados', 'sin traslado en los datos sale la pestaña «Traslados»')
    puntoPrueba.traslado = { url: 'https://example.com/traslado-de-prueba' }
    try {
      debe(/\nTraslados\n/.test(hoja(r, 'llegada', 'completa', null, null)), '3 traslados', 'con `traslado: { url }` en un punto no sale la pestaña «Traslados»')
    } finally {
      delete puntoPrueba.traslado
    }
    debe(!/\nTraslados\n/.test(hoja(r, 'llegada', 'completa', null, null)), '3 traslados', 'al quitar el traslado de prueba sigue saliendo la pestaña «Traslados»')
  }
}

// ── La última tarde: solo su texto, sin tabla de horas ────────────────────────────────────────────────────────────────────────────────────────
{
  const r = route('avion', { departureFlightTime: '18:05', departurePointId: 'cia' })
  const t = hoja(r, 'vuelta', 'completa', '18:05', 'cia')
  debe(!/Libre hasta|Maleta a las|Sal a las/.test(t), '2 horas de la app', 'la vuelta con hora enseña la tabla «Libre hasta / Maleta a las / Sal a las»')
  if (info.ultima_tarde?.texto) debe(t.includes('Tu última tarde, sin prisas') && t.includes(info.ultima_tarde.texto.slice(0, 40)), '2 horas de la app', 'la vuelta no enseña el texto general de la última tarde')
}

// ── RESERVAS: la línea cerrada de llegada y vuelta, sin «libre hacia las …» ─────────────────────────────────────────────────────────────────────
for (const mode of MODOS) {
  const r = route(mode, { arrivalFlightTime: '11:15', departureFlightTime: '18:05', arrivalPointId: medioOf(info, mode)?.puntos[0]?.id ?? null, departurePointId: medioOf(info, mode)?.puntos[0]?.id ?? null, accommodationZone: 'prati' })
  useRouteStore.setState({ route: r, screen: 'route', mode: 'bookings', reservations: [], accommodationSelections: {}, transportBookings: {}, insuranceBooking: null, n26Added: false, rentalVehicleBooking: null, esimSelections: {} })
  ponerVersion('completa')
  const t = aTexto(renderToStaticMarkup(createElement(ReservasPanel, { route: r, onClose() {} })))
  debe(!HORAS_DE_LA_APP.test(t), '2 horas de la app', `RESERVAS · ${mode}: sale una hora de la app («${t.match(HORAS_DE_LA_APP)?.[0]}»)`)
  debe(/Ida ·/.test(t.replace(/\n/g, ' ')), '2 horas de la app', `RESERVAS · ${mode}: falta la línea de la ida`)
}

const resumen = [...porRegla.entries()].map(([r, n]) => `${r}: ${n}`).join(' · ')
const md = [
  '# Prueba de la Tanda 6t',
  '',
  `Comprobaciones: ${comprobaciones} (${ventanas} ventanas) · fallos: ${fallos.length}${resumen ? ` (${resumen})` : ''}`,
  '',
  ...(fallos.length ? ['## Fallos', ...fallos.slice(0, 200).map((f) => `- [${f.regla}] ${f.texto}`)] : ['Sin fallos.']),
  '',
].join('\n')
fs.writeFileSync(out, md)
console.log(`6t: ${comprobaciones} comprobaciones (${ventanas} ventanas), ${fallos.length} fallos${resumen ? ` (${resumen})` : ''}`)
for (const f of fallos.slice(0, 20)) console.log(` - [${f.regla}] ${f.texto}`)
limpiar()
process.exit(fallos.length ? 1 : 0)
