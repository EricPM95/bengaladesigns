// La prueba de la corrección 6z6b, parte 3: el Perfil a pantalla completa (con el globo entero y el mapa que no atrapa el dedo) y los tips con la bombilla de RUTA.
//   node scripts/destino/pruebaCorr6z6_perfil.mjs        (con el servidor de la app encendido en http://localhost:8787)
// Pinta con el código de verdad de la app (react-dom/server, empaquetado con esbuild; ver _ssr.mjs). Da fallo si:
//   P1. el Perfil no es una pantalla completa (fixed inset-0, con cabecera «Perfil» y la ✕), o sube desde abajo como hoja (HojaAbajo / items-end / rounded-t), o no deja relleno de abajo para la barra;
//   (P2 y P3, el mapa de mis viajes y su globo, se quitaron en la 10N4: el mapa suelto ya no existe)
//   P4. con 0, 1 o 6 viajes el Perfil falla o no lista todos los viajes;
//   P5. tocar una chincheta no abre la ficha; la ficha y el álbum no son pantalla completa con [‹ Volver] en la cabecera; falta lo de antes ([Nuevo viaje], Próximos/Ya hechos, [Añadir foto], «Una foto por parada»);
//   P6. «Tips del viaje» sigue en el Perfil (o `onTips` en Header/PerfilSheet);
//   P7. no hay UNA bombilla en RUTA (gratis y de pago, no duplicada en DÍAS) con aria-label «Tips del viaje» que abra los tips;
//   P8. queda algún emoji en lo nuevo.
import fs from 'node:fs'
import { prepararSSR } from './_ssr.mjs'

const fallos = []
let comprobaciones = 0
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) fallos.push({ regla, texto })
}
const leer = (f) => fs.readFileSync(f, 'utf8')

const { M, ponerVersion } = await prepararSSR('scripts/destino/_corr6z6_perfil_entrada.tsx', {
  piezasFalsas: [
    { filtro: /map\/StopsMapView$/, exporta: 'StopsMapView' },
  ],
})
const { createElement, renderToStaticMarkup, PerfilSheet, CuerpoConLogros, viajesDelPerfil, usePerfilUi, useRouteStore, useSyncStore } = M
const consolaError = console.error
console.error = (...a) => (/useLayoutEffect|Warning:/.test(String(a[0])) ? undefined : consolaError(...a))
const aTexto = (html) => html.replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, '\n').replace(/&amp;/g, '&').replace(/\s*\n\s*/g, '\n')

/* ---------------- Viajes de prueba ---------------- */
const parada = (id, name, lat, lng) => ({ id, name, coordinates: { lat, lng }, time: '10:00', durationMinutes: 60, category: 'monumento', tags: [] })
const dia = (id, n, city, paradas) => ({ id, dayNumber: n, city, title: `Día ${n}`, stops: paradas, meals: [] })
const ruta = (id, destino, ciudades, rango) => ({
  id,
  destination: destino,
  country: 'X',
  origin: 'Madrid',
  days: ciudades.map(([ciudad, lat, lng], i) => dia(`${id}d${i + 1}`, i + 1, ciudad, [parada(`${id}s${i}`, `Sitio ${i}`, lat, lng)])),
  answers: { dateRange: { start: rango[0], end: rango[1] }, days: ciudades.length },
  transportContext: {},
  intensity: 3,
  createdAt: '2026-09-01T10:00:00Z',
})
const guardado = (route, n) => ({ id: `fila-${n}`, route, bookings: {}, wishlist: [], uiState: { mode: 'route', activeDayId: null }, generationState: null })
const TODOS = [
  guardado(ruta('v1', 'Roma', [['Roma', 41.9, 12.49], ['Roma', 41.89, 12.48]], ['2026-10-13', '2026-10-14']), 1),
  guardado(ruta('v2', 'Roma y Florencia', [['Roma', 41.9, 12.49], ['Florencia', 43.77, 11.25]], ['2026-12-05', '2026-12-06']), 2),
  guardado(ruta('v3', 'Madrid', [['Madrid', 40.41, -3.7], ['Madrid', 40.42, -3.69]], ['2026-05-01', '2026-05-02']), 3),
  guardado(ruta('v4', 'Nueva York', [['Nueva York', 40.71, -74.0], ['Nueva York', 40.75, -73.98]], ['2026-11-01', '2026-11-02']), 4),
  guardado(ruta('v5', 'Tokio', [['Tokio', 35.68, 139.69], ['Tokio', 35.7, 139.7]], ['2027-03-01', '2027-03-02']), 5),
  guardado(ruta('v6', 'Lisboa', [['Lisboa', 38.72, -9.14], ['Lisboa', 38.71, -9.13]], ['2026-09-01', '2026-09-02']), 6),
]
const estadoBase = useRouteStore.getState()
function pinta({ n, albumDe = null, version = 'gratis', open = true }) {
  ponerVersion(version)
  useSyncStore.setState({ savedTrips: TODOS.slice(0, n), activeTripId: null })
  useRouteStore.setState({ ...estadoBase, route: null, dev_simulated_today_iso: '2026-10-10' })
  usePerfilUi.setState({ abierto: open, albumDe })
  return renderToStaticMarkup(createElement(PerfilSheet, { open, onClose() {} }))
}

/* ---------------- P1. Pantalla completa ---------------- */
const fuentePerfil = leer('src/components/layout/PerfilSheet.tsx')
const html1 = pinta({ n: 6 })
const texto1 = aTexto(html1)
debe(/role="dialog"[^>]*aria-label="Perfil"/.test(html1) && /class="fixed inset-0 /.test(html1), 'P1', 'el Perfil no es una pantalla completa (role="dialog" aria-label="Perfil" con fixed inset-0)')
// 10N5: la cabecera ya no lleva un «Perfil» escrito: lleva los ajustes y la ✕ (el diálogo se llama «Perfil» por aria-label).
debe(/<header/.test(html1) && /aria-label="Cerrar el Perfil"/.test(html1), 'P1', 'falta la cabecera del Perfil (con la ✕)')
debe(/aria-label="Cerrar el Perfil"/.test(html1), 'P1', 'falta la ✕ para cerrar el Perfil')
debe(!/HojaAbajo|items-end|rounded-t-|max-h-\[88vh\]/.test(html1) && !/HojaAbajo|AnimatePresence|rounded-t-\[/.test(fuentePerfil), 'P1', 'el Perfil sigue siendo una hoja que sube desde abajo')
// 10N5: el relleno de abajo es fijo (pb-[150px]) para que el [+] flotante no tape lo último.
const relleno = html1.match(/pb-\[(\d+)px\]/)
// La barra de abajo mide h-14 (3,5 rem) + su relleno de arriba y de abajo: 5 rem es el mínimo para que lo último de la lista quede por encima.
debe(relleno && Number(relleno[1]) >= 100, 'P1', `10N5: el pie del Perfil ([+] flotante) no deja relleno de abajo (${relleno ? relleno[0] : 'sin relleno'})`)
debe(/overflow-y-auto/.test(html1), 'P1', 'el Perfil no se puede bajar (falta overflow-y-auto en su contenido)')
debe(/createPortal\(/.test(fuentePerfil), 'P1', 'el Perfil no se pinta en el body (la barra de abajo, de z-30, lo taparía desde dentro de la cabecera)')

/* P2 y P3 (el mapa de mis viajes y su globo): quitados en la 10N4, el mapa suelto ya no existe (manda el pasaporte). */

/* ---------------- P4. Con 0, 1 y 6 viajes ---------------- */
for (const n of [0, 1, 6]) {
  let html = ''
  try {
    html = pinta({ n })
  } catch (error) {
    debe(false, 'P4', `con ${n} viajes el Perfil falla: ${error.message}`)
    continue
  }
  const lista = viajesDelPerfil(TODOS.slice(0, n), null, '2026-10-10')
  // El cuerpo del Perfil (único desde la 10N4) llega por un `lazy`: la cáscara del servidor solo enseña el esqueleto, así que la lista se mira pintando el cuerpo.
  const t = aTexto(renderToStaticMarkup(createElement(CuerpoConLogros, { viajes: lista, fotos: null, rutaAbiertaId: null, onAbrirAlbum() {}, onAbrirViaje() {} })))
  for (const v of lista) debe(t.includes(v.destino) && t.includes(v.cuando), 'P4', `con ${n} viajes, la lista no tiene «${v.rotulo}»`)
  debe(lista.length === n, 'P4', `el Perfil con ${n} viajes cuenta ${lista.length}`)
  if (n === 0) debe(/Aún no tienes viajes/.test(t), 'P4', 'con 0 viajes falta el texto «Aún no tienes viajes»')
  else debe(!/Aún no tienes viajes/.test(t), 'P4', `con ${n} viajes sale «Aún no tienes viajes»`)
  debe(/aria-label="Perfil"/.test(html) && /aria-label="Añadir un viaje"/.test(html), 'P4', `con ${n} viajes el Perfil no pinta su diálogo o el [+] Añadir un viaje (10N5)`)
}
{
  const t6 = aTexto(renderToStaticMarkup(createElement(CuerpoConLogros, { viajes: viajesDelPerfil(TODOS, null, '2026-10-10'), fotos: null, rutaAbiertaId: null, onAbrirAlbum() {}, onAbrirViaje() {} })).replace(/data-grupo-de-viajes[^>]*>[\s\S]*?<\/span>/g, ''))
  debe(!/Próximos/.test(t6) && !/Ya hechos/.test(t6), 'P5', '6y4: el diseño no lleva «Próximos» / «Ya hechos» en la lista')
}

/* ---------------- P5. Ficha y álbum a pantalla completa ---------------- */
for (const version of ['gratis', 'completa']) {
  const html = pinta({ n: 6, albumDe: 'v1', version })
  const t = aTexto(html)
  debe(/role="dialog"[^>]*aria-label="Viaje a Roma"/.test(html) && /class="fixed inset-0 /.test(html), 'P5', `${version}: la ficha no es pantalla completa`)
  debe(/<header[\s\S]*?aria-label="Volver a mis viajes"[\s\S]*?‹[\s\S]*?Volver[\s\S]*?<\/header>/.test(html), 'P5', `${version}: la cabecera de la ficha no tiene [‹ Volver]`)
  debe(/Álbum del viaje/.test(html) && (version === 'completa' ? /Añadir fotos/.test(t) : !/Añadir foto/.test(t)), 'P5', `${version}: 6y4: el álbum debe llevar [Añadir fotos] solo en la de pago`)
  debe(!/aria-label="Perfil"/.test(html) && !/Mis viajes/.test(t.replace(/Volver a mis viajes/, '')), 'P5', `${version}: con la ficha abierta sigue pintada la lista (y su mapa)`)
  debe(/pb-\[calc\(6rem\+env\(safe-area-inset-bottom\)\)\]/.test(html), 'P5', `${version}: la ficha no deja relleno de abajo para la barra`)
  if (version === 'gratis') debe(!/Una foto por parada/.test(t), 'P5', '6y4: gratis: el álbum ya no dice «Una foto por parada» (no hay títulos ni notas por parada)')
}
const fuenteFicha = leer('src/components/perfil/FichaDeViaje.tsx')
debe(/onClick=\{onVolver\}/.test(fuenteFicha) && /cerrarAlbum/.test(fuentePerfil), 'P5', '[‹ Volver] no vuelve a la lista (cerrarAlbum)')
debe(/onAbrirAlbum=\{abrirAlbum\}/.test(fuentePerfil), 'P5', 'tocar un viaje no abre la ficha (abrirAlbum)')
const fuenteAlbum = leer('src/components/perfil/AlbumDeViaje.tsx')
debe(/Eliminar/.test(fuenteAlbum) && /etiquetaAnadirFoto/.test(fuenteAlbum), 'P5', 'el álbum perdió [Añadir fotos] o «Eliminar»')
// Con el Perfil cerrado no pinta nada
debe(pinta({ n: 6, open: false }) === '', 'P5', 'el Perfil cerrado pinta algo')

/* ---------------- P6. Fuera los tips del Perfil ---------------- */
for (const f of ['src/components/layout/PerfilSheet.tsx', 'src/components/layout/Header.tsx']) {
  const s = leer(f)
  debe(!/onTips/.test(s), 'P6', `${f} todavía tiene el prop onTips`)
}
debe(!/Tips del viaje/.test(fuentePerfil) && !/Tips del viaje/.test(texto1), 'P6', '«Tips del viaje» sigue en el Perfil')

/* ---------------- P7. La bombilla de RUTA ---------------- */
// 6z6c: la bombilla ya no flota en el mapa de RUTA: está en la tarjeta de cada destino (RouteOverview), a la izquierda de la varita.
const rv = leer('src/components/route/RouteView.tsx')
debe(!/Tips del viaje|TripTipsSheet|setTipsOpen/.test(rv), 'P7', 'RouteView todavía tiene la bombilla flotante / los tips')
const ro = leer('src/components/route/RouteOverview.tsx')
debe(/aria-label=\{`Tips de \$\{city\}`\}/.test(ro) && /<Icono nombre="tips"/.test(ro), 'P7', 'la tarjeta de destino no tiene su bombilla «Tips de {destino}» con el icono «tips»')
debe(/<TipsButton city=\{segment\.city\}/.test(ro) && ro.indexOf('<TipsButton city') < ro.indexOf('aria-label="Recuperar mi ruta"'), 'P7', 'la bombilla no está en la tarjeta, a la izquierda de la varita')
// (Tanda 10C: la bombilla sale siempre; sin tips de ese destino, apagada.)
debe(/useDestinationTips\(city, true\)/.test(ro) && /disabled=\{!data\}/.test(ro), 'P7', 'la bombilla debe salir siempre, apagada si el destino no tiene tips')
debe(/<TripTipsSheet open=\{tipsCity !== null\} destination=\{tipsCity \?\? ''\}/.test(ro), 'P7', 'RouteOverview no abre TripTipsSheet con los tips del destino de la tarjeta')
debe(!/canRestoreRoute/.test(ro.slice(ro.indexOf('<TipsButton city={segment.city}') - 40, ro.indexOf('<TipsButton city={segment.city}') + 60)), 'P7', 'la bombilla depende de la varita (canRestoreRoute)')
for (const f of ['src/components/route/DayList.tsx', 'src/components/route/dayDetail/DayDetailPanel.tsx', 'src/components/route/ExplorePanel.tsx']) {
  debe(!/Tips del viaje|Tips de \$\{/.test(leer(f)), 'P7', `la bombilla está también en ${f}`)
}
debe(/\btips:\s*'/.test(leer('src/lib/iconos.ts')), 'P7', 'el icono «tips» (la bombilla) no está en iconos.ts')
debe(/ESCAPE|Escape/.test(leer('src/components/route/TripTipsSheet.tsx')) || /onClose/.test(leer('src/components/route/TripTipsSheet.tsx')), 'P7', 'los tips no se pueden cerrar')

/* ---------------- P8. Emojis ---------------- */
for (const f of ['src/components/layout/PerfilSheet.tsx', 'src/components/perfil/FichaDeViaje.tsx', 'src/lib/viajesPerfil.ts', 'src/components/route/RouteView.tsx', 'src/components/layout/Header.tsx']) {
  const s = leer(f)
  const m = s.match(/\p{Extended_Pictographic}/gu)
  debe(!m, 'P8', `${f} tiene emojis: ${m}`)
}

console.log(`\nPerfil 6z6b-3 (al día con la 10N4: sin mapa suelto):`)
if (fallos.length === 0) {
  console.log(`${comprobaciones} comprobaciones, 0 fallos.`)
  process.exit(0)
} else {
  for (const f of fallos) console.log(`  ✗ [${f.regla}] ${f.texto}`)
  console.log(`\n${fallos.length} fallos de ${comprobaciones}.`)
  process.exit(1)
}
