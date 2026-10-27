// La prueba de la Tanda 7, parte «MOVER A OTRO DÍA», «CAMBIAR PARADA», «5 DÍAS · 4 NOCHES» y «CERRADO ESTE DÍA» (puntos 1, 15 y 16 de PARA_CODE_TANDA7_v3.md).
//   API_URL=http://localhost:8884 node scripts/destino/pruebaTanda7_mover.mjs     (con un servidor de la app encendido en ese puerto; por defecto http://localhost:8787)
// Pinta con el código de verdad de la app (react-dom/server, empaquetado con esbuild; ver _ssr.mjs) y llama a las funciones de verdad. Da fallo si:
//   A. «MOVER A OTRO DÍA» (la lista `ListaDeDias`, la del menú «···» de DÍAS y la hoja de HOY)
//     1. no lleva «MOVER A» y «Ahora: {día}», o un día no lleva su fecha en el cuadrado (sin fechas, el número), su nombre y su título;
//     2. el día de vuelta sale, o un día de excursión entera no sale en gris, con su icono, con «Día de excursión» y sin poder elegirse;
//     3. se ve alguna hora calculada;
//     4. el menú de DÍAS y la hoja de HOY no usan la misma lista, o la hoja no lleva el «Ahora:»;
//     5. mover la parada la quita de su día, no la pone en el nuevo, quita o repite algo, no deja [Deshacer] o «Deshacer» no devuelve el viaje IDÉNTICO (también desde HOY);
//   B. «CAMBIAR PARADA»
//     6. el menú sigue usando `PlaceFinderPanel` (o el archivo sigue ahí), o no abre EXPLORAR con «Atracciones» (los monumentos) y «Miradores» y la pregunta «¿Por cuál quieres cambiar {parada}?»;
//     7. en ese modo el botón de la esquina es un «+» (en vez del ⇄, icono fino sin relleno), un sitio que ya está en el viaje no sale con «Ya en tu viaje» y sin el icono, o salen chips que no se pueden cambiar (excursiones, restaurantes);
//     8. fuera del modo, EXPLORAR no sale como siempre (con su «+», sin pregunta ni ⇄);
//     9. el sitio nuevo no ocupa el hueco de la parada (su día, su sitio en el día y su hora), hereda lo de la vieja (su aviso de «Por fuera», su horario, sus etiquetas), toca otra parada, no deja [Deshacer] o este no devuelve el viaje IDÉNTICO;
//   C. «5 DÍAS · 4 NOCHES»
//     10. el texto no es «{n+1} días · {n} noches» (con 1 día, «1 día»; con 2, «2 días · 1 noche») para n de 0 a 20;
//     11. no sale así en el calendario (con una o varias fechas), la tarjeta del viaje, Mis viajes (el Perfil), la pantalla de RESERVAS, HOY después del viaje, el resumen del formulario, el PDF y la tarjeta de RUTA, o queda algún «{n} días» suelto;
//     12. la hoja «Aún no sé mis fechas» no pregunta «¿Cuántas noches?» (con «noche»/«noches» y «Solo un día»), o guarda otra cosa que `days` = noches + 1;
//   D. «CERRADO ESTE DÍA»
//     13. la tarjeta de una parada cerrada ese día no dice «Cerrado este día» UNA vez, o dice «Hoy cierra» o «Cerrado hoy» (en DÍAS, HOY y EXPLORAR);
//   E. UNA SOLA PIEZA
//     14. queda algún `PlaceFinderPanel` o `poolEntries`, o el código nuevo escribe emojis, colores a mano o nombres de empresas.
import fs from 'node:fs'
import path from 'node:path'
import { prepararSSR } from './_ssr.mjs'

const fallos = []
let comprobaciones = 0
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) fallos.push({ regla, texto })
}
const leer = (f) => fs.readFileSync(f, 'utf8')
const sinComentarios = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s\/\/ .*$/gm, '')

const { M, ponerVersion } = await prepararSSR('scripts/destino/_7_mover_entrada.tsx', { piezasFalsas: [{ filtro: /map\/StopsMapView$/, exporta: 'StopsMapView' }] })
const {
  createElement, renderToStaticMarkup, ListaDeDias, ETIQUETA_DIA_DE_EXCURSION, StopAccordion, HojaPasarAOtroDia, HoyDespues, FILTROS_DE_CAMBIAR_PARADA, preguntaDeCambiarParada, PlaceExplorerScreen, stopFromPlace, TrazoCalendar, TripCard,
  rangoDelViaje, resumenDeViaje, useRouteStore, useAddFlowStore, moverParadaAOtroDia, cambiarParadaPorOtra, mensajeDeCambiarParada, textoDeDuracion, textoDeDias, textoDeNoches, diasDelViaje, ICONOS, CERRADO_ESTE_DIA, shellFromStop,
  fetchDestinationPlaces, fetchDestinationExcursions, fetchArrivalInfo, cargaDatosDeHorario, horarioDeParada,
} = M
await fetchArrivalInfo('Roma')
await fetchDestinationExcursions('Roma')
const catalogoDeHorarios = await cargaDatosDeHorario('Roma')
const catalogo = (await fetchDestinationPlaces('Roma')).places
const consolaError = console.error
console.error = (...a) => (/useLayoutEffect|Warning:/.test(String(a[0])) ? undefined : consolaError(...a))
const consolaAviso = console.warn
console.warn = (...a) => (/\[place-likes\]/.test(String(a[0])) ? undefined : consolaAviso(...a))

const aTexto = (html) => html.replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, '\n').replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s*\n\s*/g, '\n')
const plano = (t) => t.replace(/\n/g, ' | ')
const veces = (texto, re) => (texto.match(re) ?? []).length
const html = (componente, props) => renderToStaticMarkup(createElement(componente, props))
const sinTildes = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
const copia = (valor) => JSON.parse(JSON.stringify(valor))
const sumaDias = (iso, n) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10)

const INICIO = '2027-03-10' // un miércoles
const estadoBase = { screen: 'route', mode: 'days', reservations: [], accommodationSelections: {}, transportBookings: {}, insuranceBooking: null, n26Added: false, rentalVehicleBooking: null, esimSelections: {}, esimPrecios: {}, dev_simulated_today_iso: null, activeDayId: null, wishlist: [], sales: [], keepBookingsOnNextRoute: false }
const parada = (id, nombre, hora = '09:00', extra = {}) => ({ id, name: nombre, time: hora, durationMinutes: 60, coordinates: { lat: 41.9, lng: 12.5 }, description: 'x', photoUrl: '', ...extra })
const lugares = catalogo.filter((p) => p.kind === 'place')
const noms = lugares.slice(0, 12).map((p) => p.name)

/**
 * Un viaje a mano: 5 días de ruta (el 4 es una excursión entera) y el día de vuelta; con fechas desde INICIO o sin ellas.
 * Los días llevan nombre propio (así el título no depende de los datos del destino).
 */
function rutaDe({ fechas = true } = {}) {
  const dias = []
  const paradasDe = [[noms[0], noms[1], noms[2]], [noms[3], noms[4]], [noms[5], noms[6]], [], [noms[7]]]
  paradasDe.forEach((lista, i) => {
    const excursion = i === 3
    dias.push({
      id: `d${i + 1}`, dayNumber: i + 1, city: 'Roma', title: `Día ${i + 1}`, curatedTitle: `Mi día ${i + 1}`, nameByUser: true, dayType: excursion ? 'excursion' : 'normal', colorIndex: i,
      ...(excursion ? { interruptor: { mode: 'excursion' } } : {}),
      stops: lista.map((n, j) => parada(`s${i + 1}-${j + 1}`, n, `${String(9 + j * 2).padStart(2, '0')}:00`)), meals: [],
    })
  })
  dias.push({ id: 'vuelta', dayNumber: 6, city: 'Roma', title: 'Vuelta', stops: [], meals: [], isReturnLeg: true })
  return {
    id: 'r7', destination: 'Roma', country: 'Italia', origin: 'Madrid', createdAt: '2027-01-01T00:00:00Z', intensity: 1, budget: { items: [], total: 0 },
    days: dias,
    answers: { days: 6, companion: 'couple', origin: 'Madrid', ...(fechas ? { dateRange: { start: INICIO, end: sumaDias(INICIO, 5) } } : { month: 2 }) },
  }
}
const estado = (route, extra = {}) => {
  ponerVersion('completa')
  useRouteStore.setState({ ...estadoBase, route, ...extra })
  useAddFlowStore.setState({ toast: null, addFlow: null })
}
const ahora = () => useRouteStore.getState().route
const toast = () => useAddFlowStore.getState().toast
const lista = (route, ahoraEn) => route.days.filter((d) => d.dayNumber !== ahoraEn).map((d) => ({ id: d.id, dayNumber: d.dayNumber, city: d.city }))
const SRC = (f) => leer(f)
const sinHoras = (t) => !/\b\d{1,2}:\d{2}\b/.test(t)

// ══════════════════════════════════════════════════════════════════════════════
// A. «MOVER A OTRO DÍA»
// ══════════════════════════════════════════════════════════════════════════════
{
  const route = rutaDe()
  estado(route)
  const dias = lista(route, 2) // se mira desde el día 2 (jueves 11): salen el 1, el 3, el 4 (excursión), el 5 y el de vuelta (que NO debe salir)
  const h = html(ListaDeDias, { dias, ahora: 2, onElegir() {} })
  const t = aTexto(h)
  debe(/MOVER A|Mover a/i.test(t) && /Ahora: jueves 11/.test(t), 'A1 cabecera', `falta «Mover a» y «Ahora: jueves 11» (${plano(t).slice(0, 200)})`)
  const fila = (id) => h.split('<button').find((b) => b.includes(`data-dia-de-la-lista="${id}"`)) ?? ''
  const d1 = aTexto(fila('d1'))
  debe(/MIÉ/.test(d1) && /\n10\n/.test(`\n${d1}\n`) && /Miércoles 10/.test(d1) && /Mi día 1/.test(d1), 'A1 fila', `el día 1 no lleva «MIÉ», «10», «Miércoles 10» y su título (${plano(d1)})`)
  const d3 = aTexto(fila('d3'))
  debe(/VIE/.test(d3) && /Viernes 12/.test(d3) && /Mi día 3/.test(d3), 'A1 fila', `el día 3 no lleva «VIE», «Viernes 12» y su título (${plano(d3)})`)
  // La excursión entera: gris, su icono, «Día de excursión», sin poder elegirse.
  const d4h = fila('d4')
  const d4 = aTexto(d4h)
  debe(d4h.includes('disabled=""') && d4h.includes('data-excursion="1"') && d4h.includes('aria-disabled="true"'), 'A2 excursión', 'el día de excursión se puede elegir (falta disabled)')
  debe(/Día de excursión/.test(d4) && d4h.includes(ICONOS.montana) && /opacity-50|opacity-60/.test(d4h) && /Sábado 13/.test(d4), 'A2 excursión', `el día de excursión no sale en gris con su icono y «Día de excursión» (${plano(d4)})`)
  debe(!fila('d3').includes('disabled=""') && !fila('d1').includes('disabled=""'), 'A2 excursión', 'un día normal sale sin poder elegirse')
  debe(veces(h, /data-excursion="1"/g) === 1, 'A2 excursión', 'sale más de una fila de excursión')
  debe(fila('vuelta') === '' && !/vuelta|Lunes 15/i.test(t), 'A2 vuelta', `el día de vuelta sale en la lista (${plano(t)})`)
  debe(fila('d2') === '', 'A2 ahora', 'el día en el que está la parada sale en la lista de dónde moverla')
  debe(sinHoras(t), 'A3 horas', `la lista enseña una hora (${plano(t)})`)
  debe(!/\bHoy cierra\b|Cerrado hoy/.test(t), 'A3 horas', 'la lista de días dice «Hoy cierra»')
  // Sin fechas: el número del día, «Día n».
  const sinFechas = rutaDe({ fechas: false })
  estado(sinFechas)
  const hs = html(ListaDeDias, { dias: lista(sinFechas, 2), ahora: 2, onElegir() {} })
  const ts = aTexto(hs)
  debe(/Ahora: día 2/.test(ts) && /Día 1/.test(ts) && /Día 3/.test(ts) && !/MIÉ|VIE|LUN/.test(ts), 'A1 sin fechas', `sin fechas la lista no usa el número y «Día n» (${plano(ts).slice(0, 220)})`)
  debe(/>1<\/span>/.test(hs) && /Mi día 3/.test(ts), 'A1 sin fechas', 'sin fechas el cuadrado no lleva el número del día')
  // La hoja de HOY: la misma lista, con su «Ahora:».
  estado(route)
  const hoja = html(HojaPasarAOtroDia, { dias, ahora: 2, onElegir() {}, onCerrar() {} })
  const th = aTexto(hoja)
  debe(hoja.includes('data-lista-de-dias="1"') && /Ahora: jueves 11/.test(th) && /Día de excursión/.test(th) && /Pasarla a otro día/.test(th), 'A4 hoja', `la hoja de HOY no lleva la misma lista con «Ahora:» (${plano(th).slice(0, 200)})`)
  const menuSrc = sinComentarios(SRC('src/components/route/dayDetail/StopMenu.tsx'))
  const saltarSrc = sinComentarios(SRC('src/components/route/hoy/saltar.tsx'))
  const hoySrc = sinComentarios(SRC('src/components/route/hoy/HoyDurante.tsx'))
  debe(/<MoverADia[^>]*ahora=/.test(menuSrc) && /<ListaDeDias[^>]*ahora=/.test(saltarSrc) && /ahora=\{day\.dayNumber\}/.test(hoySrc), 'A4 una lista', 'el menú de DÍAS y la hoja de HOY no pasan el «Ahora:» a la misma lista')
  debe(!/filaClassName|lightItemClass/.test(menuSrc + saltarSrc + sinComentarios(SRC('src/components/route/dayDetail/ListaDeDias.tsx'))), 'A4 una lista', 'quedan estilos de fila a medida del menú o de la hoja')
  debe(/moverParadaAOtroDia/.test(menuSrc) && /moverParadaAOtroDia/.test(hoySrc), 'A5 una acción', 'el menú de DÍAS y HOY no mueven con la misma función `moverParadaAOtroDia`')
}
// Mover de verdad (y Deshacer), desde DÍAS y desde HOY: la función es la misma.
{
  const route = rutaDe()
  estado(route)
  const antes = copia(ahora())
  const contar = (r) => r.days.flatMap((d) => d.stops).length
  const nombresAntes = antes.days.flatMap((d) => d.stops.map((s) => s.name)).sort()
  const ok = moverParadaAOtroDia('s2-2', 'd2', 'd3')
  const r = ahora()
  const d2 = r.days.find((d) => d.id === 'd2')
  const d3 = r.days.find((d) => d.id === 'd3')
  debe(ok === true && !d2.stops.some((s) => s.id === 's2-2') && d3.stops.some((s) => s.id === 's2-2'), 'A5 mover', 'la parada no pasó del día 2 al día 3')
  debe(contar(r) === contar(antes) && JSON.stringify(r.days.flatMap((d) => d.stops.map((s) => s.name)).sort()) === JSON.stringify(nombresAntes), 'A5 mover', 'al mover se quitó o se repitió una parada')
  debe(d2.stops.length === 1 && d3.stops.length === 3 && d3.stops[2].id === 's2-2', 'A5 mover', 'la parada no llegó al final del día nuevo (el sitio de siempre) o el día de origen perdió otra')
  const horaNueva = d3.stops.find((s) => s.id === 's2-2').time
  debe(/^\d{2}:\d{2}$/.test(horaNueva) && horaNueva !== '', 'A5 mover', `la parada movida no trae hora en su día nuevo (${horaNueva})`)
  const aviso = toast()
  debe(aviso && /^Movida al viernes 12$/.test(aviso.message) && aviso.previous, 'A5 mover', `no deja el aviso «Movida al viernes 12» con [Deshacer] (${JSON.stringify(aviso?.message)})`)
  debe(JSON.stringify(aviso?.previous) === JSON.stringify(antes), 'A5 mover', 'el «antes» del aviso no es el viaje tal cual estaba')
  useAddFlowStore.getState().undo()
  debe(JSON.stringify(ahora()) === JSON.stringify(antes) && toast() === null, 'A5 mover', 'Deshacer no devuelve el viaje IDÉNTICO')
  // Una reservada no se mueve (la entrada fija el día).
  const rr = copia(route)
  rr.days[1].stops[0].reservedId = 'res-1'
  estado(rr)
  moverParadaAOtroDia('s2-1', 'd2', 'd3')
  debe(ahora().days[1].stops[0].id === 's2-1' && ahora().days[2].stops.every((s) => s.id !== 's2-1'), 'A5 reservada', 'una parada reservada se movió de día')
  // Desde HOY: la misma función, el mismo aviso.
  estado(route)
  moverParadaAOtroDia('s1-1', 'd1', 'd5')
  debe(/^Movida al domingo 14$/.test(toast()?.message ?? '') && ahora().days[4].stops.some((s) => s.id === 's1-1'), 'A5 HOY', 'pasarla a otro día desde HOY no la mueve con su aviso')
  useAddFlowStore.getState().undo()
  debe(JSON.stringify(ahora()) === JSON.stringify(route), 'A5 HOY', 'Deshacer desde HOY no devuelve el viaje IDÉNTICO')
  estado(rutaDe({ fechas: false }))
  moverParadaAOtroDia('s1-1', 'd1', 'd3')
  debe(/^Movida al día 3$/.test(toast()?.message ?? ''), 'A5 sin fechas', `sin fechas el aviso no dice «Movida al día 3» (${toast()?.message})`)
}

// ══════════════════════════════════════════════════════════════════════════════
// B. «CAMBIAR PARADA»
// ══════════════════════════════════════════════════════════════════════════════
{
  const menuSrc = sinComentarios(SRC('src/components/route/dayDetail/StopMenu.tsx'))
  const cambiarSrc = sinComentarios(SRC('src/components/route/dayDetail/CambiarParada.tsx'))
  debe(!/PlaceFinderPanel/.test(menuSrc) && /<CambiarParada/.test(menuSrc), 'B6 menú', 'el menú «···» sigue usando PlaceFinderPanel o no abre `CambiarParada`')
  debe(!fs.existsSync('src/components/route/placeFinder/PlaceFinderPanel.tsx') && !fs.existsSync('src/lib/poolEntries.ts'), 'E14 viejo', 'PlaceFinderPanel o poolEntries siguen en el código')
  debe(/PlaceExplorerScreen/.test(cambiarSrc) && /cambiarParada=\{/.test(cambiarSrc) && /initialFilters=\{\[\.\.\.FILTROS_DE_CAMBIAR_PARADA\]\}/.test(cambiarSrc) && /cambiarParadaPorOtra/.test(cambiarSrc), 'B6 explorador', '«Cambiar parada» no abre el explorador compartido con sus filtros y el cambio compartido')
  debe(/yaCambiada\.current/.test(cambiarSrc), 'B9 un solo cambio', 'un segundo toque en el ⇄ (mientras llega la foto) puede dejar un «Deshacer» que devuelva un viaje ya cambiado')
  debe(JSON.stringify(FILTROS_DE_CAMBIAR_PARADA) === JSON.stringify(['atracciones', 'miradores']), 'B6 filtros', `los filtros no son Atracciones (monumentos) y Miradores (${JSON.stringify(FILTROS_DE_CAMBIAR_PARADA)})`)
  debe(preguntaDeCambiarParada('Coliseo') === 'Elige el sitio que cambia por el Coliseo', 'B6 pregunta', `la franja no es «Elige el sitio que cambia por el Coliseo» (${preguntaDeCambiarParada('Coliseo')}) (Tanda 10N6)`)
  // Nadie más usa el buscador viejo.
  const archivos = []
  const recorre = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) recorre(p); else if (/\.(ts|tsx)$/.test(e.name)) archivos.push(p) } }
  recorre('src')
  const usan = archivos.filter((f) => /PlaceFinderPanel|poolEntries|buildCombinedPool/.test(sinComentarios(leer(f))))
  debe(usan.length === 0, 'E14 viejo', `quedan usos del buscador viejo: ${usan.join(', ')}`)

  // El explorador en este modo (con sitios que ya están en el viaje).
  const route = rutaDe()
  estado(route)
  const enViaje = new Set([noms[0], noms[1], noms[2], noms[3], noms[4], noms[5], noms[6], noms[7]])
  const props = { open: true, destination: 'Roma', places: catalogo, title: 'Cambiar parada — jue 11', route, dayNumber: 2, dateIso: sumaDias(INICIO, 1), initialFilters: [...FILTROS_DE_CAMBIAR_PARADA], onClose() {} }
  const h = html(PlaceExplorerScreen, { ...props, cambiarParada: { pregunta: preguntaDeCambiarParada(noms[3]), onElegir() {} } })
  const t = aTexto(h)
  debe(t.includes('Elige el sitio que cambia por') && t.includes(noms[3]) && h.includes('data-pregunta-cambiar-parada="1"') && h.includes('data-cancelar-cambio="1"'), 'B6 pregunta', 'la pantalla no lleva la pregunta arriba')
  const chipsActivos = [...h.matchAll(/data-active="true"[^>]*>(?:(?!<\/button>)[\s\S])*<\/button>/g)].map((m) => aTexto(m[0]))
  debe(chipsActivos.length === 2 && chipsActivos.some((c) => /Atracciones/.test(c)) && chipsActivos.some((c) => /Miradores/.test(c)), 'B6 filtros', `los filtros activos no son «Atracciones» y «Miradores» (${JSON.stringify(chipsActivos)})`)
  debe(!/Restaurantes|Excursiones/.test(aTexto(h.slice(0, h.indexOf('Buscar') > 0 ? h.indexOf('Buscar') : h.length))), 'B7 chips', 'en «Cambiar parada» salen los chips de Restaurantes o Excursiones')
  const botones = [...h.matchAll(/data-cambiar-por="([^"]*)"/g)].map((m) => m[1].replace(/&#x27;/g, "'").replace(/&amp;/g, '&'))
  debe(botones.length >= 5, 'B7 ⇄', `salen muy pocos ⇄ (${botones.length})`)
  debe(botones.every((n) => !enViaje.has(n)), 'B7 ya en el viaje', `un sitio que ya está en el viaje lleva el ⇄: ${botones.filter((n) => enViaje.has(n)).join(', ')}`)
  const tarjetasDelViaje = [...enViaje].filter((n) => lugares.some((p) => p.name === n))
  debe(veces(t, /✓ En ruta/g) >= Math.min(tarjetasDelViaje.length, 3), 'B7 ya en el viaje', `los sitios que ya están en el viaje no dicen «✓ En ruta» (${veces(t, /✓ En ruta/g)}) (Tanda 10N6)`)
  debe(!/aria-label="Añadir /.test(h) && !/\+ Añadir/.test(t), 'B7 sin «+»', 'en «Cambiar parada» queda un «+ Añadir»')
  debe(h.includes(ICONOS.intercambiar) && !/>\+<\/span>/.test(h), 'B7 ⇄', 'el botón de la esquina no es el icono de intercambiar')
  const botonSwap = h.split('<button').find((b) => b.includes('data-cambiar-por=')) ?? ''
  debe(/<svg[^>]*fill="none"[^>]*stroke="currentColor"/.test(botonSwap) && /stroke-width="1\.7"/.test(botonSwap) && !/fill="currentColor"/.test(botonSwap), 'B7 ⇄', 'el ⇄ no es un icono fino sin relleno')
  // Fuera del modo: como siempre.
  const normal = html(PlaceExplorerScreen, { ...props, title: 'Añadir parada — jue 11', onQuickAdd() {}, initialFilters: [] })
  const tn = aTexto(normal)
  debe(/aria-label="Añadir /.test(normal) && !normal.includes('data-cambiar-por') && !normal.includes('data-pregunta-cambiar-parada') && !/Ya en tu viaje/.test(tn), 'B8 normal', 'fuera de «Cambiar parada» EXPLORAR no sale con su «+» y sin ⇄ ni pregunta')
  debe(/Restaurantes/.test(tn) && /Excursiones|Entradas/.test(tn), 'B8 normal', 'fuera de «Cambiar parada» faltan sus chips de siempre')
  debe(/\+<\/span>/.test(normal), 'B8 normal', 'fuera de «Cambiar parada» el botón de la esquina no es el «+»')
}
// Cambiar de verdad (y Deshacer).
{
  const route = rutaDe()
  // La parada que se cambia lleva avisos del motor que NO deben pasar al sitio nuevo.
  route.days[1].stops[0] = parada('s2-1', noms[3], '10:30', { visitMode: 'fuera', outsideKind: 'cerrado', outsideReason: 'Hoy cierra', hoursWarning: 'Cerrado este día', tags: ['vieja'], hours: 'Abre 9:00', insiderTip: 'viejo', walkingTimeToNextMinutes: 7, nextStopNote: 'viejo', franja: 'manana', isRevisit: true })
  route.days[1].stops[1].walkingTimeToNextMinutes = 5
  route.days[0].stops[2].walkingTimeToNextMinutes = 9
  estado(route)
  const antes = copia(ahora())
  const nuevo = lugares.find((p) => !noms.includes(p.name))
  const stopNuevo = stopFromPlace(nuevo, '')
  let sembrado = 0
  cambiarParadaPorOtra('d2', route.days[1].stops[0], stopNuevo, () => { sembrado++ })
  const r = ahora()
  const d2 = r.days.find((d) => d.id === 'd2')
  const cambiada = d2.stops[0]
  debe(sembrado === 1, 'B9 sembrar', 'no pone las paradas reales del día antes de cambiar')
  debe(cambiada.name === nuevo.name && cambiada.id === stopNuevo.id && d2.stops.length === 2 && d2.stops[1].id === 's2-2', 'B9 hueco', 'el sitio nuevo no ocupa el hueco de la parada (su sitio en el día)')
  debe(cambiada.time === '10:30' && cambiada.franja === 'manana', 'B9 hora', `el sitio nuevo no se queda a la hora de la parada (${cambiada.time})`)
  debe(cambiada.visitMode === undefined && cambiada.outsideKind === undefined && cambiada.outsideReason === undefined && cambiada.hoursWarning === undefined && cambiada.isRevisit === undefined, 'B9 herencia', 'el sitio nuevo hereda el aviso («Por fuera», «Cerrado este día», revisita) de la parada vieja')
  debe(cambiada.insiderTip === undefined && cambiada.nextStopNote === undefined && !(cambiada.tags ?? []).includes('vieja') && cambiada.hours !== 'Abre 9:00', 'B9 herencia', 'el sitio nuevo hereda el consejo, las etiquetas o el horario de la parada vieja')
  debe(cambiada.saltada === false, 'B9 saltada', 'el sitio nuevo sale como saltado')
  debe(cambiada.walkingTimeToNextMinutes === undefined && cambiada.nextLegPending === true, 'B9 paseos', 'el paseo hasta la parada siguiente no se vuelve a pedir')
  debe(d2.stops[1].walkingTimeToNextMinutes === 5 && r.days[0].stops[2].walkingTimeToNextMinutes === 9, 'B9 otras', 'se tocó el paseo de otra parada')
  debe(JSON.stringify(r.days.filter((d) => d.id !== 'd2')) === JSON.stringify(antes.days.filter((d) => d.id !== 'd2')), 'B9 otras', 'se tocó otro día')
  const aviso = toast()
  debe(aviso && aviso.message === `Cambiada por ${nuevo.name}` && mensajeDeCambiarParada(nuevo) === aviso.message && aviso.previous, 'B9 deshacer', `no deja el aviso «Cambiada por …» con [Deshacer] (${aviso?.message})`)
  useAddFlowStore.getState().undo()
  debe(JSON.stringify(ahora()) === JSON.stringify(antes) && toast() === null, 'B9 deshacer', 'Deshacer no devuelve el viaje IDÉNTICO')
  // La anterior a la cambiada también vuelve a pedir su paseo.
  const dos = copia(route)
  dos.days[1].stops[1].walkingTimeToNextMinutes = 4
  dos.days[1].stops[0].walkingTimeToNextMinutes = 8
  estado(dos)
  cambiarParadaPorOtra('d2', dos.days[1].stops[1], stopFromPlace(nuevo, ''))
  const d2b = ahora().days[1]
  debe(d2b.stops[0].walkingTimeToNextMinutes === undefined && d2b.stops[0].nextLegPending === true && d2b.stops[1].nextLegPending === undefined, 'B9 paseos', 'la parada anterior no vuelve a pedir su paseo, o la última pide uno que no existe')
}

// ══════════════════════════════════════════════════════════════════════════════
// C. «5 DÍAS · 4 NOCHES»
// ══════════════════════════════════════════════════════════════════════════════
{
  debe(textoDeDuracion(1) === '1 día' && textoDeDuracion(2) === '2 días · 1 noche' && textoDeDuracion(5) === '5 días · 4 noches', 'C10 texto', `los ejemplos no salen: ${textoDeDuracion(1)} / ${textoDeDuracion(2)} / ${textoDeDuracion(5)}`)
  for (let n = 0; n <= 20; n++) {
    const dias = n + 1
    const esperado = n === 0 ? '1 día' : `${dias} días · ${n} ${n === 1 ? 'noche' : 'noches'}`
    debe(textoDeDuracion(dias) === esperado, 'C10 texto', `con ${n} noches el texto es «${textoDeDuracion(dias)}» y debería ser «${esperado}»`)
  }
  debe(textoDeDuracion(0) === '' && textoDeDuracion(-3) === '' && textoDeDuracion(Number.NaN) === '', 'C10 texto', 'sin días el texto no es vacío')
  debe(textoDeDias(1) === '1 día' && textoDeDias(3) === '3 días' && textoDeNoches(1) === '1 noche' && textoDeNoches(4) === '4 noches', 'C10 texto', 'textoDeDias / textoDeNoches no salen')
  debe(textoDeDuracion(3, 3) === '3 días · 3 noches', 'C10 texto', 'un tramo con sus propias noches no sale')
  const r = rutaDe()
  debe(diasDelViaje(r) === 6 && diasDelViaje({ days: [], answers: { days: 4 } }) === 4 && diasDelViaje({ days: [], answers: {} }) === 0, 'C10 texto', 'diasDelViaje no cuenta el viaje entero (con el día de vuelta)')

  // El calendario (con fechas): una fecha, varias.
  const cal = (start, end) => aTexto(html(TrazoCalendar, { dateRange: { start, end }, onSelect() {} }))
  debe(/5 días · 4 noches/.test(cal('2027-03-10', '2027-03-14')), 'C11 calendario', 'el calendario del 10 al 14 no dice «5 días · 4 noches»')
  debe(/2 días · 1 noche/.test(cal('2027-03-10', '2027-03-11')) && !/2 días · 1 noches/.test(cal('2027-03-10', '2027-03-11')), 'C11 calendario', 'el calendario del 10 al 11 no dice «2 días · 1 noche»')
  debe(/1 día(?! ·)/.test(cal('2027-03-10', '2027-03-10')) && !/noche/.test(cal('2027-03-10', '2027-03-10')), 'C11 calendario', 'el calendario con una sola fecha no dice «1 día»')
  debe(!/\d+ días(?! ·)/.test(cal('2027-03-10', '2027-03-14')), 'C11 calendario', 'el calendario enseña «5 días» a secas')
  const calSrc = sinComentarios(SRC('src/components/trazo/TrazoCalendar.tsx'))
  debe(/textoDeDuracion\(nights \+ 1\)/.test(calSrc), 'C11 calendario', 'el calendario no usa la función compartida')

  // La hoja «Aún no sé mis fechas».
  const fechasSrc = sinComentarios(SRC('src/components/trazo/StepDates.tsx'))
  debe(/¿Cuántas noches\?/.test(fechasSrc) && !/¿Cuántos días\?/.test(fechasSrc), 'C12 hoja', 'la hoja de fechas flexibles no pregunta «¿Cuántas noches?»')
  debe(/'noche' : 'noches'/.test(fechasSrc) && /Solo un día/.test(fechasSrc), 'C12 hoja', 'la hoja no lleva «noche»/«noches» y «Solo un día»')
  debe(/setFlexDays\(n \+ 1\)/.test(fechasSrc) && /setFlexDays\(1\)/.test(fechasSrc) && /days: flexDays/.test(fechasSrc) && /flexNights = Math\.max\(0, flexDays - 1\)/.test(fechasSrc), 'C12 hoja', 'por dentro no se guarda `days` = noches + 1')
  debe(/length: MAX_DAYS - 1/.test(fechasSrc), 'C12 hoja', 'la rejilla de noches no llega a 20 (21 días como el calendario)')

  // Rutas: RESERVAS (sin fechas), Mis viajes, el Perfil, HOY después del viaje.
  const sin = rutaDe({ fechas: false })
  debe(rangoDelViaje(sin) === '6 días · 5 noches', 'C11 RESERVAS', `RESERVAS sin fechas no dice «6 días · 5 noches» (${rangoDelViaje(sin)})`)
  debe(!/noche/.test(rangoDelViaje(rutaDe())) && /oct|mar/.test(rangoDelViaje(rutaDe())), 'C11 RESERVAS', 'RESERVAS con fechas deja de enseñar su rango')
  const resumen = resumenDeViaje(rutaDe(), null, '2027-01-01')
  debe(resumen.duracion === '6 días · 5 noches' && /6 días · 5 noches$/.test(resumen.rotulo) && resumen.resumen.startsWith('6 días · 5 noches · '), 'C11 Perfil', `el Perfil no dice «6 días · 5 noches» (${resumen.duracion} / ${resumen.rotulo} / ${resumen.resumen})`)
  debe(resumen.dias === 5, 'C11 Perfil', `la cifra del mapa «días» debe seguir contando los días de ruta (${resumen.dias})`)
  const trip = (route) => ({ id: 't', route, bookings: {}, wishlist: [], uiState: { mode: 'days', activeDayId: null }, generationState: null })
  const tarjetaSin = aTexto(html(TripCard, { trip: trip(rutaDe({ fechas: false })), onOpen() {}, onDelete() {} }))
  debe(/6 días · 5 noches/.test(tarjetaSin), 'C11 Mis viajes', `la tarjeta de Mis viajes sin fechas no dice «6 días · 5 noches» (${plano(tarjetaSin)})`)
  const tarjetaCon = aTexto(html(TripCard, { trip: trip(rutaDe()), onOpen() {}, onDelete() {} }))
  debe(!/\d+ días(?! ·)/.test(tarjetaCon) && /mar/i.test(tarjetaCon), 'C11 Mis viajes', `la tarjeta con fechas enseña otra cosa que su rango (${plano(tarjetaCon)})`)
  estado(rutaDe())
  const despues = aTexto(html(HoyDespues, { route: rutaDe(), startIso: INICIO }))
  debe(/6 días · 5 noches · /.test(despues) && !/(^|\n)5 días/.test(despues), 'C11 HOY', `HOY después del viaje no dice «6 días · 5 noches» (${plano(despues).slice(0, 220)})`)

  // El resumen del formulario, la ventana del trayecto, el PDF, la tarjeta de RUTA y el aviso de más días que fechas: la función compartida.
  const usos = {
    'src/components/trazo/StepSummary.tsx': 2,
    'src/components/trazo/StepManualSummary.tsx': 1,
    'src/components/trazo/StepElegir.tsx': 1,
    'src/components/trazo/TrazoFlow.tsx': 1,
    'src/components/myTrips/TripCard.tsx': 1,
    'src/lib/exportPdf.ts': 1,
    'src/components/route/RouteOverview.tsx': 1,
    'src/components/route/ReservasPanel.tsx': 1,
    'src/components/route/hoy/HoyDespues.tsx': 1,
    'src/lib/viajesPerfil.ts': 1,
    'src/hooks/useAppNotices.ts': 1,
  }
  for (const [archivo, minimo] of Object.entries(usos)) {
    const codigo = sinComentarios(SRC(archivo))
    debe(veces(codigo, /textoDeDuracion\(/g) >= minimo && /duracionViaje/.test(codigo), 'C11 una función', `${archivo} no usa la función compartida textoDeDuracion (${minimo})`)
  }
  // Ningún «{n} días» suelto en el código (salvo lo que no es la duración de un viaje).
  const archivos = []
  const recorre = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) recorre(p); else if (/\.(ts|tsx)$/.test(e.name)) archivos.push(p) } }
  recorre('src')
  const PERMITIDOS = [
    'src/lib/duracionViaje.ts', // la función
    'src/components/route/reservas/TarjetaCuentaAtras.tsx', // la cuenta atrás: «faltan 12 días»
    'src/components/destination/RouteSearch.tsx', // «Se suele hacer en 3-5 días»: una sugerencia, no un viaje
    'src/components/questionnaire/DurationSelector.tsx', // el selector viejo: ninguna pantalla lo usa
    'src/components/route/dayDetail/ExcursionDayPage.tsx', // «el 25% de tus {dias} días»
    'src/components/route/freeDay/DayNameSheet.tsx', // «Máximo 14 días»
  ].map((p) => p.replace(/\//g, path.sep))
  const sueltos = []
  for (const f of archivos) {
    if (PERMITIDOS.includes(f)) continue
    const codigo = sinComentarios(leer(f))
    if (/'día'\s*:\s*'días'|`[^`]*\$\{[^}]+\}\s+d[ií]as?\b|\}\s+d[ií]as?\b(?!\s*[=a-zñ])|día\{[^}]+\? ''/.test(codigo.replace(/\$\{[^}]*días[^}]*\}/g, ''))) sueltos.push(f)
  }
  debe(sueltos.length === 0, 'C11 sueltos', `quedan textos «{n} días» sueltos en: ${sueltos.join(', ')}`)
}

// ══════════════════════════════════════════════════════════════════════════════
// D. «CERRADO ESTE DÍA»
// ══════════════════════════════════════════════════════════════════════════════
{
  debe(CERRADO_ESTE_DIA === 'Cerrado este día', 'D13 texto', 'la etiqueta no es «Cerrado este día»')
  // Un lugar de verdad que cierra un lunes (la Galería Borghese), en una fecha de lunes.
  const galeria = lugares.find((p) => /Galería Borghese/.test(p.name))
  const datos = galeria ? catalogoDeHorarios.get(sinTildes(galeria.name)) : null
  const LUNES = '2027-03-15'
  const hCerrado = datos ? horarioDeParada({ hoursData: datos }, LUNES) : null
  debe(hCerrado?.cerrado === true && hCerrado.texto === 'Cerrado este día', 'D13 horario', `la Galería Borghese un lunes no dice «Cerrado este día» (${hCerrado?.texto})`)
  const hAbierto = datos ? horarioDeParada({ hoursData: datos }, '2027-03-16') : null
  debe(hAbierto && !hAbierto.cerrado && /^Abre /.test(hAbierto.texto), 'D13 horario', `la Galería Borghese un martes no dice «Abre …» (${hAbierto?.texto})`)
  const tarjeta = (stopExtra, horario, extraProps = {}) => {
    const base = parada('c1', 'Galería Borghese', '10:00', { categoryLabel: 'Museo', ...stopExtra })
    return html(StopAccordion, { number: 1, stop: shellFromStop(base), onOpen() {}, horario, ...extraProps })
  }
  // (Tanda 11, punto 4: una parada que va por fuera porque cierra ese día lleva UN solo aviso, «Hoy está cerrado: lo ves por fuera», sin «Cerrado este día» ni «Hoy cierra».)
  const POR_FUERA_CERRADO = 'Hoy está cerrado: lo ves por fuera'
  const casos = {
    'por fuera por cierre (el motor), con horario': tarjeta({ visitMode: 'fuera', outsideKind: 'cerrado', outsideReason: POR_FUERA_CERRADO }, hCerrado),
    'por fuera por cierre (el motor), sin horario': tarjeta({ visitMode: 'fuera', outsideKind: 'cerrado', outsideReason: POR_FUERA_CERRADO }, null),
    'con el aviso de fechas y el horario': tarjeta({ hoursWarning: CERRADO_ESTE_DIA }, hCerrado),
    'con el aviso de fechas, sin horario': tarjeta({ hoursWarning: CERRADO_ESTE_DIA }, null),
    'día libre con el aviso': tarjeta({}, hCerrado, { freeDayWarning: CERRADO_ESTE_DIA }),
    'día libre con el aviso, sin horario': tarjeta({}, null, { freeDayWarning: CERRADO_ESTE_DIA }),
    'solo el horario': tarjeta({}, hCerrado),
  }
  for (const [nombre, h] of Object.entries(casos)) {
    const t = aTexto(h)
    const porFuera = /^por fuera por cierre/.test(nombre)
    if (porFuera) debe(veces(t, /Hoy está cerrado: lo ves por fuera/g) === 1 && !/Cerrado este día/.test(t), 'D13 una vez', `${nombre}: la tarjeta no dice «Hoy está cerrado: lo ves por fuera» una sola vez (${plano(t)})`)
    else debe(veces(t, /Cerrado este día/g) === 1, 'D13 una vez', `${nombre}: la tarjeta dice «Cerrado este día» ${veces(t, /Cerrado este día/g)} veces (${plano(t)})`)
    debe(!/Hoy cierra|Cerrado hoy/.test(t), 'D13 sin «Hoy cierra»', `${nombre}: la tarjeta dice «Hoy cierra» o «Cerrado hoy» (${plano(t)})`)
  }
  // Lo que cierra a una hora, o no abre todavía, sigue con su aviso (no es «Cerrado este día»).
  const tardeT = aTexto(tarjeta({ visitMode: 'fuera', outsideKind: 'ya_cerrado' }, null))
  debe(/A esta hora ya ha cerrado/.test(tardeT) && !/Cerrado este día/.test(tardeT), 'D13 otros avisos', `«ya cerrado» no conserva su aviso (${plano(tardeT)})`)
  // El código: ya no escribe «Hoy cierra» ni «Cerrado hoy» para la tarjeta (solo la constante).
  for (const f of ['src/components/route/dayDetail/StopAccordion.tsx', 'src/lib/placeHoursOnDate.ts', 'src/lib/horarioDeParada.ts', 'src/store/useRouteStore.ts', 'src/components/route/placeExplorer/PlaceExplorerScreen.tsx']) {
    const c = sinComentarios(SRC(f))
    debe(!/['"`]Hoy cierra['"`]|['"`]Cerrado hoy['"`]|>Hoy cierra</.test(c), 'D13 código', `${f} sigue escribiendo «Hoy cierra» o «Cerrado hoy»`)
  }
  // EXPLORAR: el sitio cerrado ese día lleva la misma etiqueta.
  if (galeria) {
    const route = rutaDe()
    estado(route)
    const ex = aTexto(html(PlaceExplorerScreen, { open: true, destination: 'Roma', places: catalogo, title: 'Explorar Roma', route, dateIso: LUNES, initialFilters: ['atracciones'], onClose() {} }))
    debe(/Cerrado este día/.test(ex) && !/Hoy cierra/.test(ex), 'D13 EXPLORAR', 'EXPLORAR un lunes no dice «Cerrado este día» (o dice «Hoy cierra»)')
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// E. UNA SOLA PIEZA
// ══════════════════════════════════════════════════════════════════════════════
{
  const nuevos = ['src/components/route/dayDetail/ListaDeDias.tsx', 'src/components/route/dayDetail/CambiarParada.tsx', 'src/lib/cambiarParada.ts', 'src/lib/duracionViaje.ts']
  const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B50}\u{1F000}-\u{1F2FF}]/u
  for (const f of nuevos) {
    const c = sinComentarios(SRC(f))
    debe(!EMOJI.test(c) && !/#[0-9a-fA-F]{3,8}\b|rgba?\(/.test(c), 'E14 nuevos', `${f} escribe un emoji o un color a mano`)
    debe(!/Terravision|Trenitalia|Viator|GetYourGuide|Civitatis|Booking|Stay22|Google/i.test(c), 'E14 nuevos', `${f} nombra una empresa`)
  }
  debe(!/⇄|↔/.test(sinComentarios(SRC('src/components/route/placeExplorer/PlaceExplorerScreen.tsx'))), 'E14 nuevos', 'el ⇄ está escrito como letra, no como icono fino')
  debe(/intercambiar:/.test(SRC('src/lib/iconos.ts')) && ICONOS.intercambiar.length > 10, 'E14 nuevos', 'falta el icono `intercambiar` en la familia de iconos')
}

console.log(`\nTanda 7 (mover, cambiar parada, días · noches, cerrado este día): ${comprobaciones} comprobaciones, ${fallos.length} fallos.`)
const vistos = new Set()
for (const f of fallos) {
  const clave = `${f.regla}|${f.texto}`
  if (vistos.has(clave) || vistos.size > 60) continue
  vistos.add(clave)
  console.log(`  ✗ [${f.regla}] ${f.texto}`)
}
process.exitCode = fallos.length === 0 ? 0 : 1
setTimeout(() => process.exit(process.exitCode), 300).unref()
