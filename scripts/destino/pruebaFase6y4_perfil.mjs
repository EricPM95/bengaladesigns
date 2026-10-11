// La prueba de la Tanda 6y4, punto 15: el Perfil con el diseño nuevo y «la foto vuela al Perfil».
//   node scripts/destino/pruebaFase6y4_perfil.mjs        (con el servidor de la app encendido; por defecto http://localhost:8787, o API_URL=...)
// Pinta con el código de verdad de la app (react-dom/server, empaquetado con esbuild; ver _ssr.mjs). Da fallo si:
//   A. el Perfil no es como el diseño: cabecera «PERFIL» y ✕, «Hola, <em>viajero</em>» con su círculo, el mapa, «Mis viajes» con su número, cada viaje con su fecha, sus fotos y «Abierto»,
//      «Créditos» y [+ Nuevo viaje] al final del todo, o todavía sale «Pronto podrás guardar tus viajes en tu cuenta» (con 0, 1 y 6 viajes);
//   B. la bandera de cada viaje no es la de la tarjeta del destino de RUTA (mismo componente, mismo dibujo) o sigue la franja cortada del diseño;
//   C. el mapa no mide 286 px (220 × 1,3), no lleva la chincheta «Roma ×N» (una por destino) o las cifras «1 país · 4 lugares · 14 días» no salen de los viajes de verdad;
//   D. el álbum de un viaje lleva filtros, selectores o títulos por día o por lugar; no junta TODAS las fotos en una cuadrícula; la gratis lleva [Añadir fotos] o la de pago no;
//   E. la foto no vuela al Perfil: no se dispara una vez por foto añadida (ni al cargar ni al borrar), con «reducir movimiento» hace algo más que el saltito, o con el botón tapado no espera.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'
import { build } from 'esbuild'
import { prepararSSR } from './_ssr.mjs'

const fallos = []
let comprobaciones = 0
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) fallos.push({ regla, texto })
}
const leer = (f) => fs.readFileSync(f, 'utf8')
const require = createRequire(import.meta.url)

const { M, ponerVersion } = await prepararSSR('scripts/destino/_6y4_perfil_entrada.tsx', {
  piezasFalsas: [
    { filtro: /map\/StopsMapView$/, exporta: 'StopsMapView' },
    { filtro: /perfil\/MapaMisViajes$/, exporta: 'MapaMisViajes' },
  ],
})
const { createElement, renderToStaticMarkup, PerfilSheet, RouteOverview, FilaDeViaje, CifrasDelMapa, CuadriculaDeFotos, ordenDelAlbum, diaParaFotoSuelta, TarjetaRecuerdos, flagStripesGradient, chinchetasDeViajes, cifrasDelPerfil, resumenDeViaje, textoDeFotos, viajesDelPerfil, CAJA_MAPA_VIAJES, fotoVuela, usePerfilUi, useRouteStore, useSyncStore } = M
const consolaError = console.error
console.error = (...a) => (/useLayoutEffect|Warning:/.test(String(a[0])) ? undefined : consolaError(...a))
const aTexto = (html) => html.replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, '\n').replace(/&amp;/g, '&').replace(/\s*\n\s*/g, '\n')

/* ---------------- Viajes de prueba (fechas lejanas para que la prueba no dependa del día en que se corre) ---------------- */
const parada = (id, name, lat, lng) => ({ id, name, coordinates: { lat, lng }, time: '10:00', durationMinutes: 60, category: 'monumento', tags: [] })
const dia = (id, n, city, pais, paradas) => ({ id, dayNumber: n, city, countryCode: pais, title: `Día ${n}`, stops: paradas, meals: [] })
const ruta = (id, destino, ciudades, rango) => ({
  id,
  destination: destino,
  country: 'X',
  origin: 'Madrid',
  days: ciudades.map(([ciudad, pais, lat, lng], i) => dia(`${id}d${i + 1}`, i + 1, ciudad, pais, [parada(`${id}s${i}`, `Sitio ${id}-${i}`, lat, lng)])),
  answers: { dateRange: { start: rango[0], end: rango[1] }, days: ciudades.length },
  transportContext: {},
  intensity: 3,
  createdAt: '2026-09-01T10:00:00Z',
})
const guardado = (route, n) => ({ id: `fila-${n}`, route, bookings: {}, wishlist: [], uiState: { mode: 'route', activeDayId: null }, generationState: null })
const TODOS = [
  guardado(ruta('v1', 'Roma', [['Roma', 'it', 41.9, 12.49], ['Roma', 'it', 41.89, 12.48]], ['2031-10-13', '2031-10-14']), 1),
  guardado(ruta('v2', 'Roma y Florencia', [['Roma', 'it', 41.9, 12.49], ['Florencia', 'it', 43.77, 11.25]], ['2031-12-05', '2031-12-06']), 2),
  guardado(ruta('v3', 'Madrid', [['Madrid', 'es', 40.41, -3.7], ['Madrid', 'es', 40.42, -3.69]], ['2031-05-01', '2031-05-02']), 3),
  guardado(ruta('v4', 'Nueva York', [['Nueva York', 'us', 40.71, -74.0], ['Nueva York', 'us', 40.75, -73.98]], ['2031-11-01', '2031-11-02']), 4),
  guardado(ruta('v5', 'Tokio', [['Tokio', 'jp', 35.68, 139.69], ['Tokio', 'jp', 35.7, 139.7]], ['2032-03-01', '2032-03-02']), 5),
  guardado(ruta('v6', 'Lisboa', [['Lisboa', 'pt', 38.72, -9.14], ['Lisboa', 'pt', 38.71, -9.13]], ['2031-09-01', '2031-09-02']), 6),
]
const estadoBase = useRouteStore.getState()
function pinta({ n, albumDe = null, version = 'gratis', open = true, guardados = TODOS }) {
  ponerVersion(version)
  useSyncStore.setState({ savedTrips: guardados.slice(0, n), activeTripId: null })
  useRouteStore.setState({ ...estadoBase, route: null })
  usePerfilUi.setState({ abierto: open, albumDe })
  return renderToStaticMarkup(createElement(PerfilSheet, { open, onClose() {} }))
}

/* ---------------- A. El Perfil como el diseño ---------------- */
const fuentePerfil = leer('src/components/layout/PerfilSheet.tsx')
for (const n of [0, 1, 6]) {
  let html = ''
  try {
    html = pinta({ n })
  } catch (error) {
    debe(false, 'A', `con ${n} viajes el Perfil falla: ${error.message}`)
    continue
  }
  const t = aTexto(html)
  debe(/<h1[^>]*>Perfil<\/h1>/.test(html) && /uppercase/.test(html.match(/<h1[^>]*>/)[0]), 'A', `con ${n} viajes: falta la cabecera «PERFIL» (en mayúsculas pequeñas, como el diseño)`)
  debe(/aria-label="Cerrar el Perfil"/.test(html), 'A', `con ${n} viajes: falta la ✕ para cerrar`)
  debe(/Hola, <em>viajero<\/em>/.test(html), 'A', `con ${n} viajes: falta «Hola, <em>viajero</em>»`)
  debe(/rounded-full[^>]*>V<\/span>/.test(html), 'A', `con ${n} viajes: falta el círculo con la V al lado del saludo`)
  debe(/Mis viajes/.test(t) && new RegExp(`data-numero-de-viajes[^>]*>${n}<`).test(html), 'A', `con ${n} viajes: «Mis viajes» no lleva su número (${n})`)
  debe(!/Pronto podrás/.test(html) && !/Pronto podrás/.test(fuentePerfil), 'A', `con ${n} viajes: sigue «Pronto podrás guardar tus viajes en tu cuenta»`)
  const filas = html.match(/data-viaje-del-perfil="/g) ?? []
  debe(filas.length === n, 'A', `con ${n} viajes se pintan ${filas.length} filas`)
  const lista = viajesDelPerfil(TODOS.slice(0, n), null, '2031-01-01')
  for (const v of lista) debe(t.includes(v.destino) && t.includes(v.cuando) && t.includes(`${v.dias} ${v.dias === 1 ? 'día' : 'días'}`), 'A', `con ${n} viajes: la fila de «${v.rotulo}» no lleva el destino, su fecha y sus días`)
  if (n === 0) debe(/Aún no tienes viajes/.test(t), 'A', 'con 0 viajes falta «Aún no tienes viajes guardados…»')
  // Al final del todo: «Créditos» tras la lista y [+ Nuevo viaje] el último.
  const iCred = html.indexOf('>Créditos<')
  const iNuevo = html.indexOf('Nuevo viaje')
  debe(iCred > html.indexOf('Mis viajes') && iNuevo > iCred && html.lastIndexOf('<button') === html.lastIndexOf('<button', iNuevo) && html.indexOf('<button', iNuevo) === -1, 'A', `con ${n} viajes: «Créditos» y [+ Nuevo viaje] no están al final del todo, en ese orden`)
  debe(/h-\[58px\][^>]*>[\s\S]*?Nuevo viaje/.test(html), 'A', `con ${n} viajes: [+ Nuevo viaje] no es el botón grande de 58 px del diseño`)
  debe(!/Próximos|Ya hechos/.test(t), 'A', `con ${n} viajes: salen los rótulos «Próximos» / «Ya hechos», que el diseño no lleva`)
}
debe(/createPortal\(/.test(fuentePerfil) && /MapaMisViajes chinchetas=\{chinchetas\} cifras=\{cifras\}/.test(fuentePerfil), 'A', 'el Perfil no monta el mapa con sus chinchetas y sus cifras')

/* ---------------- A2. La fila de cada viaje: fecha, fotos y «Abierto» ---------------- */
{
  const v1 = resumenDeViaje(TODOS[0].route, TODOS[0], '2031-01-01')
  const fila = (fotos, abierto = false) => renderToStaticMarkup(createElement(FilaDeViaje, { viaje: v1, fotos, abierto, onAbrir() {} }))
  debe(/155 fotos/.test(aTexto(fila(155))), 'A', 'la fila no dice «155 fotos»')
  debe(/Sin fotos/.test(aTexto(fila(0))) && /1 foto(?!s)/.test(aTexto(fila(1))), 'A', 'la fila no dice «Sin fotos» / «1 foto»')
  debe(!/data-fotos-del-viaje/.test(fila(null)), 'A', 'mientras se cuentan las fotos, la fila enseña un «Sin fotos» falso')
  debe(/>Abierto</.test(fila(3, true)) && !/>Abierto</.test(fila(3, false)), 'A', 'la pastilla «Abierto» no sale solo en el viaje abierto')
  debe(aTexto(fila(3)).includes('13 – 14 oct 2031') && aTexto(fila(3)).includes('2 días'), 'A', 'la fila no lleva su fecha («13 – 14 oct 2031 · 2 días»)')
  debe(textoDeFotos(0) === 'Sin fotos' && textoDeFotos(1) === '1 foto' && textoDeFotos(155) === '155 fotos', 'A', 'textoDeFotos')
}

/* ---------------- B. La bandera es la de RUTA ---------------- */
{
  const estiloBandera = (html) => [...html.matchAll(/<span[^>]*data-bandera-destino[^>]*style="([^"]*)"/g)].map((m) => m[1])
  const rutaRoma = TODOS[0].route
  useRouteStore.setState({ ...estadoBase, route: rutaRoma })
  const enRuta = estiloBandera(renderToStaticMarkup(createElement(RouteOverview, { route: rutaRoma })))
  const enPerfil = estiloBandera(pinta({ n: 1 }))
  const esperado = flagStripesGradient('it').replace(/ /g, '')
  debe(enRuta.length === 1 && enPerfil.length === 1, 'B', `las banderas pintadas: RUTA ${enRuta.length}, Perfil ${enPerfil.length}`)
  debe(enRuta[0] && enPerfil[0] && enRuta[0].replace(/ /g, '') === enPerfil[0].replace(/ /g, '') && enPerfil[0].replace(/ /g, '').includes(esperado.replace('linear-gradient', '').slice(0, 12)), 'B', `la bandera del Perfil (${enPerfil[0]}) no es igual a la de la tarjeta de RUTA (${enRuta[0]})`)
  debe(/^background:linear-gradient\(106deg/.test(enPerfil[0] ?? ''), 'B', 'la bandera del Perfil no lleva las franjas inclinadas de RUTA')
  const html = pinta({ n: 6 })
  debe(!/clip-path/.test(html) && !/calc\(100% - 14px\)/.test(html), 'B', 'sigue la franja cortada (clip-path) del diseño en lugar de la bandera de RUTA')
  debe(/BanderaDestino/.test(leer('src/components/route/RouteOverview.tsx')) && /BanderaDestino/.test(leer('src/components/perfil/FilaDeViaje.tsx')), 'B', 'RUTA y el Perfil no usan el mismo componente BanderaDestino')
  // Cada viaje con la bandera de SU país.
  const colores = estiloBandera(html)
  debe(colores.length === 6 && new Set(colores).size === 5, 'B', `6 viajes: 5 países distintos (Italia dos veces) debería dar 5 banderas distintas y hay ${new Set(colores).size} (de ${colores.length})`)
}

/* ---------------- C. El mapa: 286 px, chincheta «Roma ×N» y cifras de los viajes de verdad ---------------- */
{
  const fuenteMapa = leer('src/components/perfil/MapaMisViajes.tsx')
  debe(CAJA_MAPA_VIAJES.alto === 286 && Math.round(220 * 1.3) === 286, 'C', `el mapa debería medir 220 × 1,3 = 286 px y la caja dice ${CAJA_MAPA_VIAJES.alto}`)
  debe(/h-\[286px\]/.test(fuenteMapa) && !/h-\[220px\]/.test(fuenteMapa), 'C', 'el marco del mapa no mide 286 px')
  debe(/rounded-\[26px\]/.test(fuenteMapa), 'C', 'el marco del mapa no tiene las esquinas del diseño (26 px)')
  debe(/mapboxgl\.Map\(/.test(fuenteMapa) && /PROYECCION_MAPA_VIAJES/.test(fuenteMapa), 'C', 'el mapa ya no es nuestro globo de Mapbox')
  debe(/chincheta\.viajes > 1/.test(fuenteMapa) && /`×\$\{chincheta\.viajes\}`/.test(fuenteMapa) && /pastilla/.test(fuenteMapa), 'C', 'la chincheta no lleva la pastilla «Roma ×N» (el ×N con más de un viaje)')
  debe(/<CifrasDelMapa cifras=\{cifras\}/.test(fuenteMapa), 'C', 'el mapa no lleva sus cifras dentro del marco')

  // Cinco viajes a Roma = UNA chincheta «Roma ×5»; un viaje a Roma y Florencia aporta a Roma y a Florencia.
  const cincoRoma = [1, 2, 3, 4, 5].map((n) => guardado(ruta(`r${n}`, 'Roma', [['Roma', 'it', 41.9, 12.49], ['Roma', 'it', 41.89, 12.48]], [`2031-0${n}-10`, `2031-0${n}-11`]), n))
  const viajesRoma = viajesDelPerfil(cincoRoma, null, '2031-01-01')
  const pinesRoma = chinchetasDeViajes(viajesRoma)
  debe(pinesRoma.length === 1 && pinesRoma[0].ciudad === 'Roma' && pinesRoma[0].viajes === 5, 'C', `cinco viajes a Roma deberían ser UNA chincheta «Roma ×5» (hay ${pinesRoma.length}: ${pinesRoma.map((p) => `${p.ciudad} ×${p.viajes}`)})`)
  const pines6 = chinchetasDeViajes(viajesDelPerfil(TODOS, null, '2031-01-01'))
  debe(pines6.length === 6 && pines6.find((p) => p.ciudad === 'Roma')?.viajes === 2 && pines6.find((p) => p.ciudad === 'Florencia')?.viajes === 1, 'C', `6 viajes: Roma ×2, Florencia ×1 y 4 más: ${pines6.map((p) => `${p.ciudad} ×${p.viajes}`)}`)
  // Un viaje que pasa dos veces por la misma ciudad cuenta una vez.
  const dosVeces = guardado(ruta('z', 'Roma', [['Roma', 'it', 41.9, 12.49], ['Tívoli', 'it', 41.96, 12.8], ['Roma', 'it', 41.89, 12.48]], ['2031-01-01', '2031-01-03']), 9)
  debe(chinchetasDeViajes(viajesDelPerfil([dosVeces], null, '2031-01-01')).find((p) => p.ciudad === 'Roma')?.viajes === 1, 'C', 'un viaje que pasa dos veces por Roma cuenta como dos viajes en «Roma ×N»')

  // Las cifras: países, lugares y días de los viajes guardados.
  const c5 = cifrasDelPerfil(viajesRoma)
  debe(c5.paises === 1 && c5.lugares === 1 && c5.dias === 10, 'C', `5 viajes de 2 días a Roma: «1 país · 1 lugar · 10 días» y sale ${c5.paises} · ${c5.lugares} · ${c5.dias}`)
  const c6 = cifrasDelPerfil(viajesDelPerfil(TODOS, null, '2031-01-01'))
  debe(c6.paises === 5 && c6.lugares === 6 && c6.dias === 12, 'C', `6 viajes (IT, IT, ES, US, JP, PT; Roma, Florencia, Madrid, Nueva York, Tokio, Lisboa; 2 días cada uno): 5 · 6 · 12 y sale ${c6.paises} · ${c6.lugares} · ${c6.dias}`)
  const c0 = cifrasDelPerfil([])
  debe(c0.paises === 0 && c0.lugares === 0 && c0.dias === 0, 'C', 'sin viajes, las cifras deberían ser 0 · 0 · 0')
  // Un viaje con día de vuelta suelto no suma ese día.
  const conVuelta = ruta('w', 'Roma', [['Roma', 'it', 41.9, 12.49], ['Roma', 'it', 41.89, 12.48]], ['2031-01-01', '2031-01-02'])
  conVuelta.days.push({ ...dia('wd3', 3, 'Madrid', 'es', []), isReturnLeg: true })
  debe(cifrasDelPerfil(viajesDelPerfil([guardado(conVuelta, 8)], null, '2031-01-01')).dias === 2, 'C', 'el día suelto de la vuelta cuenta en las cifras')
  // Cómo se pintan.
  const uno = aTexto(renderToStaticMarkup(createElement(CifrasDelMapa, { cifras: { paises: 1, lugares: 1, dias: 1 } }))).replace(/\n/g, ' ')
  debe(/1 país 1 lugar 1 día/.test(uno), 'C', `las cifras en singular: «${uno}»`)
  const varias = aTexto(renderToStaticMarkup(createElement(CifrasDelMapa, { cifras: { paises: 2, lugares: 4, dias: 14 } }))).replace(/\n/g, ' ')
  debe(/2 países 4 lugares 14 días/.test(varias), 'C', `las cifras en plural: «${varias}»`)
  debe(/bg-\[#1C2230\][^>]*>[\s\S]*?país/.test(renderToStaticMarkup(createElement(CifrasDelMapa, { cifras: { paises: 1, lugares: 1, dias: 1 } }))), 'C', 'la primera cifra (países) no es la pastilla oscura del diseño')
}

/* ---------------- D. El álbum de un viaje: sin filtros ni títulos, todas las fotos juntas ---------------- */
{
  const F_ = (id, dayNumber, stopName, t) => ({ id, tripId: 'v1', dayId: `v1d${dayNumber}`, dayNumber, stopName, storagePath: `p/${id}`, width: 1, height: 1, bytes: 1, createdAt: `2031-10-13T10:00:0${t}Z`, url: 'https://x/grande', urlMin: `https://x/min-${id}` })
  const mezcla = [F_('a', 3, 'Plaza de España', 1), F_('b', 1, 'Panteón', 2), F_('c', 1, null, 3), F_('d', 3, 'Fontana de Trevi', 4), F_('e', 2, 'Vaticano', 5), F_('f', 1, 'Coliseo', 6), F_('g', 1, 'Una que ya no está', 7)]
  const html = renderToStaticMarkup(createElement(CuadriculaDeFotos, { fotos: mezcla }))
  const t = aTexto(html)
  debe((html.match(/<ul/g) ?? []).length === 1 && (html.match(/<li/g) ?? []).length === 7, 'D', 'las 7 fotos no están todas juntas en UNA cuadrícula')
  debe(!/<h[1-6]/.test(html), 'D', 'la cuadrícula lleva títulos (por día o por lugar)')
  debe(!/Coliseo|Panteón|Vaticano|Fontana|Plaza de España|Una que ya no está|Día \d|Lun |Mar |Mié /.test(t), 'D', `la cuadrícula enseña nombres de paradas o días: ${t.replace(/\n/g, ' ').slice(0, 200)}`)
  debe(/grid-cols-3/.test(html) && /src="https:\/\/x\/min-a"/.test(html) && !/src="https:\/\/x\/grande"/.test(html), 'D', 'la cuadrícula no es de 3 columnas con la copia pequeña de cada foto')
  debe(ordenDelAlbum(mezcla).map((f) => f.id).join('') === 'bcfgead', 'D', `el orden del álbum (por día y hora): ${ordenDelAlbum(mezcla).map((f) => f.id).join('')} (esperado bcfgead)`)

  for (const version of ['gratis', 'completa']) {
    const h = pinta({ n: 6, albumDe: 'v1', version })
    const x = aTexto(h)
    debe(/role="dialog"[^>]*aria-label="Viaje a Roma"/.test(h) && /class="fixed inset-0 /.test(h), 'D', `${version}: el álbum no es pantalla completa`)
    debe(/<header[\s\S]*?aria-label="Volver a mis viajes"[\s\S]*?‹[\s\S]*?Volver[\s\S]*?<\/header>/.test(h), 'D', `${version}: falta [‹ Volver]`)
    debe(/<h2[^>]*>Roma<\/h2>/.test(h) && x.includes('13 – 14 oct 2031'), 'D', `${version}: el álbum no lleva el título «Roma» y su fecha`)
    debe(!/<select/.test(h) && !/<h[3-6]/.test(h) && !/Todo el día|Parada a la que añadir|Día al que añadir|Una foto por parada/.test(h + x), 'D', `${version}: el álbum lleva selectores o títulos por día/lugar`)
    debe(!/Abrir este viaje|paradas/.test(x), 'D', `${version}: el álbum lleva más que el título, la fecha y las fotos (resumen o [Abrir este viaje])`)
    debe(!/Mis viajes/.test(x.replace('Volver a mis viajes', '')) && !/aria-label="Perfil"/.test(h), 'D', `${version}: con el álbum abierto sigue pintada la lista (y su mapa)`)
    if (version === 'gratis') debe(!/Añadir foto/.test(x) && !/aria-label="Añadir foto/.test(h) && /desde la ficha de cada parada/.test(x), 'D', 'gratis: el álbum lleva [Añadir fotos] (se añaden desde la ficha de la parada)')
    else debe(/Añadir fotos/.test(x) && /aria-label="Añadir fotos"/.test(h), 'D', 'de pago: el álbum no lleva [Añadir fotos]')
  }
  // Todas las fotos van al mismo viaje: el botón de la de pago lleva el id del viaje del álbum y NO una parada.
  const fuenteAlbum = leer('src/components/perfil/AlbumDeViaje.tsx')
  debe(/tripId=\{viaje\.id\}/.test(fuenteAlbum) && /stopName=\{null\}/.test(fuenteAlbum), 'D', 'las fotos del álbum no van al viaje del álbum, sin parada')
  // Por dentro siguen guardándose con día y parada (la gratis las cuenta por parada).
  const fuenteFotos = leer('src/lib/fotosViaje.ts')
  debe(/day_number: args\.dayNumber/.test(fuenteFotos) && /stop_name: args\.stopName/.test(fuenteFotos) && /export function modoDeFoto/.test(fuenteFotos), 'D', 'las fotos ya no se guardan con su día y su parada por dentro')
  // El día al que se apuntan las del álbum de pago.
  const hoy = new Date()
  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const ayer = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - 1)
  const manana = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1)
  const enMarcha = ruta('em', 'Roma', [['Roma', 'it', 41.9, 12.49], ['Roma', 'it', 41.89, 12.48], ['Roma', 'it', 41.88, 12.47]], [iso(ayer), iso(manana)])
  debe(diaParaFotoSuelta(enMarcha, [], true)?.dayNumber === 2, 'D', 'con el viaje en marcha, las fotos del álbum no se apuntan al día de hoy')
  debe(diaParaFotoSuelta(TODOS[0].route, [], true)?.dayNumber === 1, 'D', 'con el viaje fuera de fechas, las fotos del álbum no se apuntan al día 1')
  const suelta = (dayNumber) => ({ dayNumber, stopName: null })
  debe(diaParaFotoSuelta(TODOS[0].route, [suelta(1)], false)?.dayNumber === 2, 'D', 'gratis: la foto suelta no salta el día que ya tiene la suya (una foto sin parada por día)')
  debe(diaParaFotoSuelta(TODOS[0].route, [suelta(1), suelta(2)], false)?.dayNumber === 2, 'D', 'gratis, todos los días completos: debería cambiar la de un día (no inventar un día)')
  debe(diaParaFotoSuelta(TODOS[0].route, [{ dayNumber: 1, stopName: 'Coliseo' }], false)?.dayNumber === 1, 'D', 'gratis: la foto de una parada ocupa el sitio de la parada, no el del día')
  debe(diaParaFotoSuelta(TODOS[0].route, [suelta(1), suelta(1), suelta(1)], true)?.dayNumber === 1, 'D', 'de pago no se salta nada (sin límite)')
  // «Guarda tus recuerdos» sube las fotos desde aquí mismo, al mismo viaje (en la gratis ya no hay [Añadir fotos] en el álbum).
  for (const version of ['gratis', 'completa']) {
    ponerVersion(version)
    useRouteStore.setState({ ...estadoBase, route: TODOS[0].route })
    const th = renderToStaticMarkup(createElement(TarjetaRecuerdos, { route: TODOS[0].route }))
    debe((th.match(/<input[^>]*type="file"/g) ?? []).length === 4, 'D', `${version}: «Guarda tus recuerdos» debería tener 4 selectores de foto (3 casillas y [Subir mis fotos]) y tiene ${(th.match(/<input[^>]*type="file"/g) ?? []).length}`)
    debe((th.match(/aria-label="Subir mis fotos"/g) ?? []).length === 3 && /Subir mis fotos/.test(aTexto(th)) && /dashed/.test(th), 'D', `${version}: «Guarda tus recuerdos» perdió sus 3 casillas de rayas o [Subir mis fotos]`)
  }
}

/* ---------------- E. La foto vuela al Perfil ---------------- */
{
  const { lanzarFoto, crearCola, puntoDeSalida, botonDelPerfil, DURACION_VUELO_MS, SONDEO_TAPADO_MS, ESPERA_MAXIMA_MS, MAXIMO_VUELOS_A_LA_VEZ, DESFASE_MS, ATRIBUTO_BOTON_PERFIL } = fotoVuela
  debe(DURACION_VUELO_MS === 800 && ATRIBUTO_BOTON_PERFIL === 'data-boton-perfil', 'E', 'el vuelo debería durar unos 0,8 s y buscar el botón marcado con data-boton-perfil')

  function crearEntorno({ tapado = false, reducir = false, hayBoton = true, clic = null } = {}) {
    const estado = { tapado, ahora: 1000, timers: [], puestas: [], animaciones: [], quitadas: 0, saltos: 0, soltadas: 0 }
    const boton = {
      attrs: {},
      getBoundingClientRect: () => ({ left: 300, top: 10, width: 44, height: 44 }),
      contains: (x) => x === boton,
      setAttribute(k, v) { this.attrs[k] = v },
      removeAttribute(k) { delete this.attrs[k] },
      animate() { estado.saltos++; return {} },
    }
    const documento = {
      querySelectorAll: () => (hayBoton ? [boton] : []),
      elementFromPoint: () => (estado.tapado ? { tapa: true } : boton),
      createElement: () => ({
        style: {},
        setAttribute() {},
        remove() { estado.quitadas++ },
        animate(frames, opciones) {
          const a = { frames, opciones, onfinish: null }
          estado.animaciones.push(a)
          return a
        },
      }),
      body: { appendChild: (el) => estado.puestas.push(el) },
    }
    const entorno = {
      document: documento,
      ancho: 375,
      alto: 812,
      reducirMovimiento: reducir,
      ultimoClic: clic,
      ahora: () => estado.ahora,
      esperar: (fn, ms) => { estado.timers.push({ fn, en: estado.ahora + ms }) },
    }
    const avanzar = (ms) => {
      const fin = estado.ahora + ms
      for (;;) {
        estado.timers.sort((a, b) => a.en - b.en)
        const sig = estado.timers[0]
        if (!sig || sig.en > fin) break
        estado.timers.shift()
        estado.ahora = Math.max(estado.ahora, sig.en)
        sig.fn()
      }
      estado.ahora = fin
    }
    return { entorno, estado, boton, avanzar }
  }
  const lanzar = (e, retraso = 0) => fotoVuela.lanzarFoto('blob:foto', e.entorno, () => { e.estado.soltadas++ }, retraso)

  // 1. Libre: sale una miniatura, vuela 0,8 s encogiéndose y desvaneciéndose, y el botón da su saltito al llegar.
  {
    const e = crearEntorno({ clic: { caja: { left: 20, top: 400, width: 60, height: 60 }, momento: 1000 } })
    lanzar(e)
    debe(e.estado.puestas.length === 1 && e.estado.animaciones.length === 1, 'E', 'con el botón libre, la miniatura no sale a la vez')
    const a = e.estado.animaciones[0]
    debe(a.opciones.duration === 800, 'E', `el vuelo dura ${a.opciones.duration} ms, no 800`)
    const ultimo = a.frames[a.frames.length - 1]
    debe(ultimo.opacity === 0 && /scale\(0\.15\)/.test(ultimo.transform) && /translate\(322px, 32px\)/.test(ultimo.transform), 'E', `la miniatura no acaba pequeña, invisible y sobre el botón del Perfil: ${JSON.stringify(ultimo)}`)
    debe(/translate\(50px, 430px\)/.test(a.frames[1].transform), 'E', `la miniatura no sale de donde se pulsó: ${a.frames[1].transform}`)
    debe(e.estado.saltos === 0, 'E', 'el botón salta antes de que llegue la foto')
    a.onfinish()
    debe(e.estado.quitadas === 1 && e.estado.saltos === 1, 'E', 'al llegar la foto no se quita la miniatura y el botón no da su saltito')
    e.avanzar(1500)
    debe(e.estado.soltadas === 1, 'E', 'no se suelta la URL local de la miniatura al acabar')
  }
  // 2. «Reducir movimiento»: solo el saltito, sin miniatura ni vuelo.
  {
    const e = crearEntorno({ reducir: true })
    lanzar(e)
    debe(e.estado.puestas.length === 0 && e.estado.animaciones.length === 0, 'E', 'con «reducir movimiento» sale la miniatura o hay vuelo')
    debe(e.estado.saltos === 1, 'E', 'con «reducir movimiento» el botón no da su saltito')
    e.avanzar(1500)
    debe(e.estado.soltadas === 1, 'E', 'con «reducir movimiento» no se suelta la URL local')
  }
  // 3. Botón tapado por una hoja: espera, y cuando se cierra la hoja, vuela.
  {
    const e = crearEntorno({ tapado: true })
    lanzar(e)
    e.avanzar(5000)
    debe(e.estado.puestas.length === 0 && e.estado.saltos === 0, 'E', 'con el botón tapado por una hoja, la foto vuela igualmente (debería esperar)')
    debe(e.estado.soltadas === 0, 'E', 'con el botón tapado se suelta la miniatura antes de tiempo')
    e.estado.tapado = false
    e.avanzar(SONDEO_TAPADO_MS + 10)
    debe(e.estado.puestas.length === 1, 'E', 'al cerrarse la hoja, la foto no vuela')
    e.estado.animaciones[0].onfinish()
    debe(e.estado.saltos === 1, 'E', 'tras esperar, el botón no da su saltito')
  }
  // 3b. Tapado y «reducir movimiento»: espera también, y luego solo el saltito.
  {
    const e = crearEntorno({ tapado: true, reducir: true })
    lanzar(e)
    e.avanzar(2000)
    debe(e.estado.saltos === 0, 'E', 'tapado + reducir movimiento: el saltito sale con la hoja encima')
    e.estado.tapado = false
    e.avanzar(SONDEO_TAPADO_MS + 10)
    debe(e.estado.saltos === 1 && e.estado.puestas.length === 0, 'E', 'tapado + reducir movimiento: al cerrarse la hoja solo debería haber el saltito')
  }
  // 4. Sin botón en pantalla: espera y, pasado el máximo, se rinde y suelta la URL.
  {
    const e = crearEntorno({ hayBoton: false })
    lanzar(e)
    e.avanzar(ESPERA_MAXIMA_MS - 1000)
    debe(e.estado.soltadas === 0, 'E', 'sin botón, se rinde demasiado pronto')
    e.avanzar(3000)
    debe(e.estado.soltadas === 1 && e.estado.puestas.length === 0, 'E', 'sin botón, pasado el máximo no se rinde y suelta la URL')
  }
  // 5. Cancelar (la app se cierra): no vuela nada después.
  {
    const e = crearEntorno({ tapado: true })
    const cancelar = lanzar(e)
    cancelar()
    e.estado.tapado = false
    e.avanzar(2000)
    debe(e.estado.puestas.length === 0 && e.estado.soltadas === 1, 'E', 'una foto cancelada vuela igualmente o no suelta su URL')
  }
  // 6. Varias fotos seguidas: desfase de 120 ms entre ellas, tope de vuelos a la vez.
  {
    const cola = crearCola()
    const retrasos = Array.from({ length: MAXIMO_VUELOS_A_LA_VEZ + 2 }, () => cola.pedir())
    debe(retrasos.slice(0, MAXIMO_VUELOS_A_LA_VEZ).every((r, i) => r === i * DESFASE_MS) && retrasos.slice(MAXIMO_VUELOS_A_LA_VEZ).every((r) => r === null), 'E', `la cola no escalona de 120 en 120 ms ni respeta el tope de ${MAXIMO_VUELOS_A_LA_VEZ}: ${retrasos}`)
    cola.liberar()
    debe(cola.pedir() !== null, 'E', 'al acabar un vuelo no se libera su hueco')
    const e = crearEntorno()
    lanzar(e, 240)
    debe(e.estado.puestas.length === 0, 'E', 'la tercera foto de una tanda sale sin esperar su desfase')
    e.avanzar(250)
    debe(e.estado.puestas.length === 1, 'E', 'la tercera foto de una tanda no sale tras su desfase')
  }
  // 7. De dónde sale: del último pulsado, y si no hay (o es viejo), del centro.
  debe(puntoDeSalida(null, 0, 375, 812).x === 187.5 && puntoDeSalida({ caja: { left: 0, top: 0, width: 10, height: 10 }, momento: 0 }, 60000, 375, 812).y === 406, 'E', 'sin clic reciente la miniatura no sale del centro de la pantalla')
  {
    const e = crearEntorno()
    debe(botonDelPerfil(e.entorno.document, 375, 812)?.caja.left === 300, 'E', 'no encuentra el botón del Perfil marcado')
    debe(crearEntorno({ hayBoton: false }).entorno.document.querySelectorAll().length === 0 && botonDelPerfil(crearEntorno({ hayBoton: false }).entorno.document, 375, 812) === null, 'E', 'sin botón debería devolver null')
  }
}

/* ---------------- E2. El disparo: una vez por foto añadida, desde cualquier sitio; ni al cargar ni al borrar ---------------- */
{
  const carpeta = fs.mkdtempSync(path.join(os.tmpdir(), 'prueba-6y4-fotos-'))
  const falsos = {
    name: 'falsos',
    setup(b) {
      b.onResolve({ filter: /supabaseClient$/ }, () => ({ path: 'sb', namespace: 'falso' }))
      b.onResolve({ filter: /tripPersistence$/ }, () => ({ path: 'tp', namespace: 'falso' }))
      b.onLoad({ filter: /^sb$/, namespace: 'falso' }, () => ({ contents: 'export const supabase = new Proxy({}, { get: (_, k) => globalThis.__sb[k] }); ', loader: 'js' }))
      b.onLoad({ filter: /^tp$/, namespace: 'falso' }, () => ({ contents: 'export const bootstrapTraveler = async () => "u-1"', loader: 'js' }))
      b.onResolve({ filter: /\/pago$/ }, () => ({ path: 'pago', namespace: 'falso' }))
      b.onLoad({ filter: /^pago$/, namespace: 'falso' }, () => ({ contents: 'export const pagoActivo = () => globalThis.__pago === true', loader: 'js' }))
    },
  }
  const salida = path.join(carpeta, 'fotos.cjs')
  await build({ entryPoints: ['src/lib/fotosViaje.ts'], outfile: salida, bundle: true, platform: 'node', format: 'cjs', logLevel: 'silent', plugins: [falsos] })
  const F = require(salida)
  const silenciar = console.warn
  console.warn = () => {}
  const falso = () => {
    const estado = { objetos: new Map(), filas: new Map() }
    return {
      estado,
      cliente: {
        storage: {
          from: () => ({
            upload: async (ruta, blob) => (estado.objetos.set(ruta, blob), { error: null }),
            remove: async (rutas) => (rutas.forEach((r) => estado.objetos.delete(r)), { error: null }),
            createSignedUrl: async (ruta) => ({ data: { signedUrl: `https://firmada/${ruta}` } }),
            createSignedUrls: async (rutas) => ({ data: rutas.map((r) => (estado.objetos.has(r) ? { path: r, signedUrl: `https://firmada/${r}` } : { path: r, signedUrl: null })) }),
          }),
        },
        from: () => ({
          insert: (fila) => ({
            select: () => ({
              single: async () => {
                if (globalThis.__fallaFila) return { data: null, error: { message: 'x' } }
                const g = { id: `f${estado.filas.size + 1}`, created_at: `2031-10-13T10:00:${String(estado.filas.size).padStart(2, '0')}Z`, ...fila }
                estado.filas.set(g.id, g)
                return { data: g, error: null }
              },
            }),
          }),
          delete: () => ({ eq: async (_c, id) => (estado.filas.delete(id), { error: null }) }),
          select: () => {
            const q = { eq: () => q, in: () => q, order: () => q, then: (res) => res({ data: [...estado.filas.values()], error: null }) }
            return q
          },
        }),
      },
    }
  }
  const blob = (n) => new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xd9, n])], { type: 'image/jpeg' })
  const grande = { blob: blob(1), width: 1600, height: 1200, bytes: 5, miniatura: { blob: blob(2), bytes: 5 } }
  const args = { tripId: 'viaje-1', dayId: 'd2', dayNumber: 2, stopName: 'Coliseo' }
  let f = falso()
  globalThis.__sb = f.cliente
  globalThis.__fallaFila = false
  const eventos = []
  const quitar = F.alAnadirFoto((e) => eventos.push(e))

  const r1 = await F.subirFotoPreparada(args, grande)
  debe(eventos.length === 1 && eventos[0].foto.id === r1.foto.id, 'E', `añadir una foto no avisa exactamente una vez (avisos: ${eventos.length})`)
  debe(eventos[0].miniatura === grande.miniatura.blob, 'E', 'el aviso no lleva la miniatura (la _min) de esa foto')
  const r2 = await F.subirFotoPreparada(args, { blob: blob(3), width: 10, height: 10, bytes: 5 })
  debe(eventos.length === 2 && eventos[1].miniatura.size === 5, 'E', 'sin copia pequeña, el aviso debería llevar la foto grande')
  const antes = eventos.length
  await F.listarFotos('viaje-1')
  await F.contarFotos(['viaje-1'])
  debe(eventos.length === antes, 'E', 'cargar o contar las fotos dispara el efecto')
  await F.borrarFoto(r1.foto)
  debe(eventos.length === antes, 'E', 'borrar una foto dispara el efecto')
  globalThis.__fallaFila = true
  const r3 = await F.subirFotoPreparada(args, grande)
  globalThis.__fallaFila = false
  debe(!r3.foto && eventos.length === antes, 'E', 'una subida que falla dispara el efecto')
  // Gratis: la foto nueva sustituye a la vieja (se sube la nueva y se borra la vieja) y cuenta como UNA foto añadida.
  globalThis.__pago = false
  const antesSust = eventos.length
  await F.subirRespetandoLimite(args, grande)
  debe(eventos.length === antesSust + 1, 'E', `gratis, cambiar una foto: ${eventos.length - antesSust} avisos en vez de 1`)
  // De pago, tres fotos seguidas = tres avisos.
  globalThis.__pago = true
  const antesPago = eventos.length
  await F.subirRespetandoLimite({ ...args, stopName: null }, grande)
  await F.subirRespetandoLimite({ ...args, stopName: null }, grande)
  await F.subirRespetandoLimite({ ...args, stopName: null }, grande)
  debe(eventos.length === antesPago + 3, 'E', `de pago, tres fotos seguidas: ${eventos.length - antesPago} avisos en vez de 3`)
  // Quien se da de baja deja de enterarse; un oyente que revienta no rompe la subida.
  quitar()
  const n = eventos.length
  await F.subirFotoPreparada(args, grande)
  debe(eventos.length === n, 'E', 'el oyente dado de baja sigue avisado')
  const quitar2 = F.alAnadirFoto(() => { throw new Error('boom') })
  const ok = await F.subirFotoPreparada(args, grande)
  debe(!!ok.foto && !ok.error, 'E', 'un oyente que falla rompe la subida de la foto')
  quitar2()
  // Sin Supabase no hay foto ni aviso.
  globalThis.__sb = undefined
  console.warn = silenciar
  fs.rmSync(carpeta, { recursive: true, force: true })
}

/* ---------------- E3. Montaje: una vez en la app, el botón marcado, y el disparo sale de fotosViaje ---------------- */
{
  const app = leer('src/App.tsx')
  const header = leer('src/components/layout/Header.tsx')
  const comp = leer('src/components/perfil/FotoVuela.tsx')
  const lib = leer('src/lib/fotoVuela.ts')
  const fotos = leer('src/lib/fotosViaje.ts')
  debe((app.match(/<FotoVuela \/>/g) ?? []).length === 1 && /<PrecioVuela \/>/.test(app), 'E', 'FotoVuela no está montada UNA vez en App junto a PrecioVuela')
  debe(/data-boton-perfil="1"/.test(header) && /aria-label="Perfil y mis viajes"/.test(header), 'E', 'el botón del Perfil de la cabecera no está marcado con data-boton-perfil')
  debe(/alAnadirFoto\(/.test(comp) && /URL\.createObjectURL\(miniatura\)/.test(comp) && /URL\.revokeObjectURL/.test(comp), 'E', 'el componente no escucha alAnadirFoto, o no suelta la URL local de la miniatura')
  debe(/prefers-reduced-motion: reduce/.test(comp), 'E', 'el componente no mira «reducir movimiento»')
  debe(/estaTapado as estaTapadoElemento\s*\}\s*from '\.\/precioVuela'/.test(lib), 'E', 'la foto que vuela no usa la regla común estaTapado de precioVuela.ts')
  debe(!/elementFromPoint/.test(lib), 'E', 'fotoVuela.ts repite la regla de «tapado» en vez de usar la de precioVuela.ts')
  debe((fotos.match(/avisarAnadida\(/g) ?? []).length === 2 && /avisarAnadida\(\{ foto, miniatura/.test(fotos), 'E', 'el aviso de foto añadida no sale solo desde subirFotoPreparada (UNA vez)')
  debe(!/alAnadirFoto/.test(leer('src/lib/useFotosViaje.ts')), 'E', 'cargar las fotos escucha el aviso de «foto añadida»')
  // Todas las vías de subida pasan por subirFoto (la ficha, ✓ Visto, Tus fotos de hoy, Guarda tus recuerdos, el álbum).
  const usanBoton = ['src/components/route/fotos/BotonFotoParada.tsx', 'src/components/route/fotos/TusFotosDeHoy.tsx', 'src/components/route/fotos/TarjetaRecuerdos.tsx', 'src/components/perfil/AlbumDeViaje.tsx']
  for (const p of usanBoton) debe(/BotonFoto/.test(leer(p)), 'E', `${p} no sube las fotos con BotonFoto (que pasa por subirFoto)`)
  const subidores = fs.readdirSync('src', { recursive: true }).map(String).filter((p) => /\.tsx?$/.test(p) && /\bsubir(Foto|FotoPreparada|RespetandoLimite)\(/.test(leer(path.join('src', p))) && !/lib[\\/]fotosViaje\.ts$/.test(p))
  debe(subidores.length === 1 && /BotonFoto\.tsx$/.test(subidores[0]), 'E', `hay formas de subir fotos que no pasan por BotonFoto: ${subidores.join(', ')}`)
}

/* ---------------- Emojis ---------------- */
for (const p of ['src/components/layout/PerfilSheet.tsx', 'src/components/perfil/FilaDeViaje.tsx', 'src/components/perfil/CifrasDelMapa.tsx', 'src/components/perfil/MapaMisViajes.tsx', 'src/components/perfil/AlbumDeViaje.tsx', 'src/components/perfil/FichaDeViaje.tsx', 'src/components/perfil/FotoVuela.tsx', 'src/components/ui/BanderaDestino.tsx', 'src/lib/fotoVuela.ts']) {
  const sueltos = (leer(p).replace(/[✓✔✕✗★♥❤↔↕→←↑↓…©×‹]/gu, '').match(/\p{Extended_Pictographic}/gu) ?? []).length
  debe(sueltos === 0, 'Emojis', `${p} lleva ${sueltos} emoji(s)`)
}

console.log(`\nPerfil 6y4 (punto 15): mapa de ${CAJA_MAPA_VIAJES.alto} px, ${comprobaciones} comprobaciones`)
if (fallos.length === 0) {
  console.log(`${comprobaciones} comprobaciones, 0 fallos.`)
  process.exit(0)
} else {
  for (const f of fallos) console.log(`  ✗ [${f.regla}] ${f.texto}`)
  console.log(`\n${fallos.length} fallos de ${comprobaciones}.`)
  process.exit(1)
}
