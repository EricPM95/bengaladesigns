// La prueba de la corrección 6z6b, parte 3: el Perfil a pantalla completa (con el globo entero y el mapa que no atrapa el dedo) y los tips con la bombilla de RUTA.
//   node scripts/destino/pruebaCorr6z6_perfil.mjs        (con el servidor de la app encendido en http://localhost:8787)
// Pinta con el código de verdad de la app (react-dom/server, empaquetado con esbuild; ver _ssr.mjs). Da fallo si:
//   P1. el Perfil no es una pantalla completa (fixed inset-0, con cabecera «Perfil» y la ✕), o sube desde abajo como hoja (HojaAbajo / items-end / rounded-t), o no deja relleno de abajo para la barra;
//   P2. el mapa de mis viajes no mide ~220 px, no usa `cooperativeGestures: true` con el aviso en español («Usa dos dedos para mover el mapa»), o depende de algo solo-local (import.meta.env.DEV);
//   P3. el globo no es `globe` (también en style.load) o su zoom no deja la esfera ENTERA en la caja de 335×220 (ni centrado en la media de las chinchetas);
//   P4. con 0, 1 o 6 viajes el Perfil falla, no lista todos los viajes, o el globo con 0 chinchetas no dice «Aún no tienes viajes»;
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
    { filtro: /perfil\/MapaMisViajes$/, exporta: 'MapaMisViajes' },
  ],
})
const { createElement, renderToStaticMarkup, PerfilSheet, CAJA_MAPA_VIAJES, PROYECCION_MAPA_VIAJES, TEXTOS_MAPA_VIAJES, centroDelGlobo, chinchetasDeViajes, diametroGlobo, viajesDelPerfil, zoomGloboEntero, usePerfilUi, useRouteStore, useSyncStore } = M
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
debe(/<h1[^>]*>Perfil<\/h1>/.test(html1), 'P1', 'falta la cabecera «Perfil»')
debe(/aria-label="Cerrar el Perfil"/.test(html1), 'P1', 'falta la ✕ para cerrar el Perfil')
debe(!/HojaAbajo|items-end|rounded-t-|max-h-\[88vh\]/.test(html1) && !/HojaAbajo|AnimatePresence|rounded-t-\[/.test(fuentePerfil), 'P1', 'el Perfil sigue siendo una hoja que sube desde abajo')
const relleno = html1.match(/pb-\[calc\((\d+(?:\.\d+)?)rem\+env\(safe-area-inset-bottom\)\)\]/)
// La barra de abajo mide h-14 (3,5 rem) + su relleno de arriba y de abajo: 5 rem es el mínimo para que lo último de la lista quede por encima.
debe(relleno && Number(relleno[1]) >= 5, 'P1', `el Perfil no deja relleno de abajo suficiente para la barra (${relleno ? relleno[0] : 'sin relleno'})`)
debe(/overflow-y-auto/.test(html1), 'P1', 'el Perfil no se puede bajar (falta overflow-y-auto en su contenido)')
debe(/createPortal\(/.test(fuentePerfil), 'P1', 'el Perfil no se pinta en el body (la barra de abajo, de z-30, lo taparía desde dentro de la cabecera)')

/* ---------------- P2. El mapa bajo, de dos dedos ---------------- */
const fuenteMapa = leer('src/components/perfil/MapaMisViajes.tsx')
debe(/h-\[220px\]/.test(fuenteMapa) && !/h-\[240px\]/.test(fuenteMapa.replace(/Mapa no disponible[\s\S]*/, '')), 'P2', 'el mapa de mis viajes no mide 220 px de alto')
debe(CAJA_MAPA_VIAJES.alto === 220 && CAJA_MAPA_VIAJES.ancho === 335, 'P2', `la caja de cálculo del globo no es 335×220 (${CAJA_MAPA_VIAJES.ancho}×${CAJA_MAPA_VIAJES.alto})`)
debe(/cooperativeGestures:\s*true/.test(fuenteMapa), 'P2', 'el mapa no usa cooperativeGestures: true (con un dedo se mueve el mapa en vez de bajar la página)')
debe(/locale:\s*\{\s*\.\.\.TEXTOS_MAPA_VIAJES/.test(fuenteMapa), 'P2', 'el mapa no pasa los textos en español a Mapbox (locale)')
debe(TEXTOS_MAPA_VIAJES['TouchPanBlocker.Message'] === 'Usa dos dedos para mover el mapa', 'P2', `aviso de dos dedos: «${TEXTOS_MAPA_VIAJES['TouchPanBlocker.Message']}»`)
debe(Boolean(TEXTOS_MAPA_VIAJES['ScrollZoomBlocker.CtrlMessage']) && Boolean(TEXTOS_MAPA_VIAJES['ScrollZoomBlocker.CmdMessage']) && Object.values(TEXTOS_MAPA_VIAJES).every((t) => /^Usa /.test(t)), 'P2', 'faltan los avisos de la rueda (Ctrl y Cmd) en español')
debe(!/import\.meta\.env\.DEV|import\.meta\.env\.MODE|import\.meta\.env\.PROD/.test(fuenteMapa), 'P2', 'el mapa depende de algo solo-local (import.meta.env.DEV/MODE/PROD): en producción se vería distinto')
debe(/style:\s*ESTILO_MAPA_VIAJES/.test(fuenteMapa) && /ESTILO_MAPA_VIAJES = 'mapbox:\/\/styles\/mapbox\/streets-v12'/.test(fuenteMapa) && /VITE_MAPBOX_TOKEN/.test(fuenteMapa), 'P2', 'el mapa no usa el mismo estilo explícito y el token VITE_MAPBOX_TOKEN')
debe(/abrir este viaje/.test(fuenteMapa) && /alElegir\.current\(chincheta\.viajeId\)/.test(fuenteMapa), 'P2', 'tocar una chincheta no llama a abrir la ficha de su viaje')
debe(/mapa\.remove\(\)/.test(fuenteMapa), 'P2', 'el mapa no se destruye al cerrar')

/* ---------------- P3. El globo entero ---------------- */
debe(PROYECCION_MAPA_VIAJES === 'globe' && /projection:\s*PROYECCION_MAPA_VIAJES/.test(fuenteMapa) && /setProjection\(PROYECCION_MAPA_VIAJES\)/.test(fuenteMapa), 'P3', 'la proyección globe no está pedida al crear el mapa y otra vez en style.load')
debe(/setFog\(/.test(fuenteMapa), 'P3', 'falta la niebla suave (fog) del globo')
const z = zoomGloboEntero(CAJA_MAPA_VIAJES.ancho, CAJA_MAPA_VIAJES.alto)
const d = diametroGlobo(z)
debe(d <= CAJA_MAPA_VIAJES.alto - 2 * 10, 'P3', `a zoom ${z.toFixed(2)} la esfera mide ${d.toFixed(0)} px y no cabe en 220 con margen (la bola saldría cortada)`)
debe(d >= CAJA_MAPA_VIAJES.alto * 0.7, 'P3', `a zoom ${z.toFixed(2)} la esfera mide ${d.toFixed(0)} px: queda muy pequeña en la caja de 220`)
debe(z >= -1 && z <= 0.6, 'P3', `zoom ${z.toFixed(2)} fuera del rango razonable para ver la bola entera`)
debe(zoomGloboEntero(335, 220) <= zoomGloboEntero(335, 400) && zoomGloboEntero(200, 220) < zoomGloboEntero(335, 220), 'P3', 'el zoom no tiene en cuenta el lado corto de la caja')
debe(/zoom:\s*zoomEntero/.test(fuenteMapa) && !/fitBounds/.test(fuenteMapa), 'P3', 'el mapa no usa el zoom de la esfera entera (o se acerca con fitBounds)')
debe(/center:\s*\[centro\.lng,\s*centro\.lat\]/.test(fuenteMapa) && /centroDelGlobo\(chinchetas\)/.test(fuenteMapa), 'P3', 'el globo no se centra en la media de las chinchetas')
{
  const c0 = centroDelGlobo([])
  debe(Number.isFinite(c0.lat) && Number.isFinite(c0.lng), 'P3', 'el centro sin chinchetas no es un punto')
  const pin = (lat, lng) => ({ id: 'x', viajeId: 'x', ciudad: 'x', coordenadas: { lat, lng }, fase: 'proximo' })
  const c1 = centroDelGlobo([pin(41.9, 12.49)])
  debe(Math.abs(c1.lat - 41.9) < 0.01 && Math.abs(c1.lng - 12.49) < 0.01, 'P3', `una sola chincheta debería centrar en ella (${c1.lat}, ${c1.lng})`)
  const cm = centroDelGlobo([pin(10, 179), pin(10, -179)])
  debe(Math.abs(Math.abs(cm.lng) - 180) < 1, 'P3', `dos chinchetas a un lado y otro de la línea de fecha deberían centrar junto a ella, no en el lado contrario (${cm.lng})`)
}

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
  const pines = chinchetasDeViajes(lista)
  const c = centroDelGlobo(pines)
  debe(Number.isFinite(c.lat) && Number.isFinite(c.lng), 'P4', `con ${n} viajes el centro del globo no es un punto`)
  debe(pines.length === [0, 1, 7][[0, 1, 6].indexOf(n)], 'P4', `con ${n} viajes debería haber ${[0, 1, 7][[0, 1, 6].indexOf(n)]} chinchetas y hay ${pines.length}`)
  const t = aTexto(html)
  for (const v of lista) debe(t.includes(v.rotulo), 'P4', `con ${n} viajes, la lista no tiene «${v.rotulo}»`)
  debe(lista.length === n, 'P4', `el Perfil con ${n} viajes cuenta ${lista.length}`)
  if (n === 0) debe(/Aún no tienes viajes/.test(t), 'P4', 'con 0 viajes falta el texto «Aún no tienes viajes»')
  else debe(!/Aún no tienes viajes/.test(t), 'P4', `con ${n} viajes sale «Aún no tienes viajes»`)
  debe(/aria-label="Perfil"/.test(html) && /Nuevo viaje/.test(t), 'P4', `con ${n} viajes el Perfil no pinta su cabecera o [Nuevo viaje]`)
}
debe(/chinchetas\.length === 0 &&[\s\S]{0,300}Aún no tienes viajes/.test(fuenteMapa), 'P4', 'el mapa con 0 chinchetas no dice «Aún no tienes viajes»')
{
  const t6 = aTexto(pinta({ n: 6 }))
  debe(/Próximos/.test(t6) && /Ya hechos/.test(t6), 'P5', 'faltan «Próximos» / «Ya hechos» en la lista')
}

/* ---------------- P5. Ficha y álbum a pantalla completa ---------------- */
for (const version of ['gratis', 'completa']) {
  const html = pinta({ n: 6, albumDe: 'v1', version })
  const t = aTexto(html)
  debe(/role="dialog"[^>]*aria-label="Viaje a Roma"/.test(html) && /class="fixed inset-0 /.test(html), 'P5', `${version}: la ficha no es pantalla completa`)
  debe(/<header[\s\S]*?aria-label="Volver a mis viajes"[\s\S]*?‹[\s\S]*?Volver[\s\S]*?<\/header>/.test(html), 'P5', `${version}: la cabecera de la ficha no tiene [‹ Volver]`)
  debe(/Álbum/.test(t) && /Añadir foto/.test(t), 'P5', `${version}: la ficha no lleva su álbum con [Añadir foto]`)
  debe(!/aria-label="Perfil"/.test(html) && !/Mis viajes/.test(t.replace(/Volver a mis viajes/, '')), 'P5', `${version}: con la ficha abierta sigue pintada la lista (y su mapa)`)
  debe(/pb-\[calc\(6rem\+env\(safe-area-inset-bottom\)\)\]/.test(html), 'P5', `${version}: la ficha no deja relleno de abajo para la barra`)
  if (version === 'gratis') debe(/Una foto por parada/.test(t), 'P5', 'gratis: el álbum no dice «Una foto por parada»')
}
const fuenteFicha = leer('src/components/perfil/FichaDeViaje.tsx')
debe(/onClick=\{onVolver\}/.test(fuenteFicha) && /cerrarAlbum/.test(fuentePerfil), 'P5', '[‹ Volver] no vuelve a la lista (cerrarAlbum)')
debe(/onElegir=\{abrirAlbum\}/.test(fuentePerfil), 'P5', 'tocar una chincheta no abre la ficha (abrirAlbum)')
const fuenteAlbum = leer('src/components/perfil/AlbumDeViaje.tsx')
debe(/Eliminar/.test(fuenteAlbum) && /etiquetaAnadirFoto/.test(fuenteAlbum), 'P5', 'el álbum perdió [Añadir foto] o «Eliminar»')
// Con el Perfil cerrado no pinta nada
debe(pinta({ n: 6, open: false }) === '', 'P5', 'el Perfil cerrado pinta algo')

/* ---------------- P6. Fuera los tips del Perfil ---------------- */
for (const f of ['src/components/layout/PerfilSheet.tsx', 'src/components/layout/Header.tsx']) {
  const s = leer(f)
  debe(!/onTips/.test(s), 'P6', `${f} todavía tiene el prop onTips`)
}
debe(!/Tips del viaje/.test(fuentePerfil) && !/Tips del viaje/.test(texto1), 'P6', '«Tips del viaje» sigue en el Perfil')

/* ---------------- P7. La bombilla de RUTA ---------------- */
const rv = leer('src/components/route/RouteView.tsx')
const botones = rv.match(/aria-label="Tips del viaje"/g) ?? []
debe(botones.length === 1, 'P7', `debería haber UNA bombilla con aria-label «Tips del viaje» en RouteView y hay ${botones.length}`)
const trozo = rv.slice(rv.indexOf('aria-label="Tips del viaje"') - 260, rv.indexOf('aria-label="Tips del viaje"') + 520)
debe(/onClick=\{\(\) => setTipsOpen\(true\)\}/.test(trozo), 'P7', 'la bombilla no abre los tips (setTipsOpen(true))')
debe(/<Icono nombre="tips"/.test(trozo), 'P7', 'la bombilla no usa el icono «tips» de la familia (iconos.ts)')
// Dentro de la rama de RUTA (showRouteStyleMap): entre ese `?` y el siguiente `: mode === 'explore'`.
const iniRuta = rv.indexOf('showRouteStyleMap ? (')
const finRuta = rv.indexOf(": mode === 'explore' && exploreMarkers === null")
const iBombilla = rv.indexOf('aria-label="Tips del viaje"')
debe(iniRuta > 0 && iBombilla > iniRuta && iBombilla < finRuta, 'P7', 'la bombilla no está en la rama del mapa de RUTA')
debe(!/pagoActivo|modoVisible|hayPestanaHoy/.test(trozo), 'P7', 'la bombilla depende de la versión: debe salir en la gratis y en la de pago')
debe(/<TripTipsSheet open=\{tipsOpen\}/.test(rv), 'P7', 'RouteView no monta TripTipsSheet con tipsOpen')
for (const f of ['src/components/route/DayList.tsx', 'src/components/route/dayDetail/DayDetailPanel.tsx', 'src/components/route/RouteOverview.tsx', 'src/components/route/ExplorePanel.tsx']) {
  debe(!/aria-label="Tips del viaje"/.test(leer(f)), 'P7', `la bombilla está también en ${f}`)
}
debe(/\btips:\s*'/.test(leer('src/lib/iconos.ts')), 'P7', 'el icono «tips» (la bombilla) no está en iconos.ts')
debe(/ESCAPE|Escape/.test(leer('src/components/route/TripTipsSheet.tsx')) || /onClose/.test(leer('src/components/route/TripTipsSheet.tsx')), 'P7', 'los tips no se pueden cerrar')

/* ---------------- P8. Emojis ---------------- */
for (const f of ['src/components/layout/PerfilSheet.tsx', 'src/components/perfil/FichaDeViaje.tsx', 'src/components/perfil/MapaMisViajes.tsx', 'src/lib/viajesPerfil.ts', 'src/components/route/RouteView.tsx', 'src/components/layout/Header.tsx']) {
  const s = leer(f)
  const m = s.match(/\p{Extended_Pictographic}/gu)
  debe(!m, 'P8', `${f} tiene emojis: ${m}`)
}

console.log(`\nPerfil 6z6b-3 (zoom del globo ${z.toFixed(3)}, esfera de ${d.toFixed(0)} px en la caja de ${CAJA_MAPA_VIAJES.ancho}×${CAJA_MAPA_VIAJES.alto}):`)
if (fallos.length === 0) {
  console.log(`${comprobaciones} comprobaciones, 0 fallos.`)
  process.exit(0)
} else {
  for (const f of fallos) console.log(`  ✗ [${f.regla}] ${f.texto}`)
  console.log(`\n${fallos.length} fallos de ${comprobaciones}.`)
  process.exit(1)
}
