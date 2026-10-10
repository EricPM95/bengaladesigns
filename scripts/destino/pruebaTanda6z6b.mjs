// La prueba de la Tanda 6z6, parte B: el Perfil con el mapa de mis viajes, la lista, la ficha y el álbum; las fotos (cuántas) y la tarjeta «Guarda tus recuerdos» de RUTA.
//   node scripts/destino/pruebaTanda6z6b.mjs        (con el servidor de la app encendido en http://localhost:8787)
// Pinta con el código de verdad de la app (react-dom/server, empaquetado con esbuild; ver _ssr.mjs). Da fallo si:
//   A. CUÁNTAS FOTOS (src/lib/fotosViaje.ts, el único sitio donde se decide)
//     1. en la gratis cabe más de UNA foto por parada (o por «todo el día»); en la de pago hay un límite;
//     2. en la gratis, con la parada ya con su foto, «Añadir foto» no pasa a «Cambiar foto» (en la de pago nunca); o la nueva no sustituye a la vieja (también en el almacén);
//     3. si falla la subida de la nueva, la vieja se pierde; o se borra la vieja antes de subir la nueva;
//     4. fuera de fotosViaje.ts (y de la tarjeta de RUTA) hay otra pantalla que decida el límite por su cuenta (`pagoActivo` suelto en las pantallas de fotos);
//   B. EL PERFIL
//     5. la lista no dice «Destino · fechas · n días» (sin fechas, el mes), o no pone los que vienen antes que los hechos (y dentro, por fecha), o falta [Nuevo viaje] / [Tips del viaje];
//     6. no hay una chincheta por destino (un viaje a Roma y Florencia = dos), o el mapa no es un globo de Mapbox, o no se destruye al cerrar el Perfil;
//     7. la ficha no enseña «4 días · 23 paradas», las fechas y el álbum; o en la gratis no dice «Una foto por parada» (en la de pago sí sale el límite quitado);
//     8. el álbum no ordena por días (y dentro por parada, en el orden de la ruta);
//   C. «GUARDA TUS RECUERDOS» EN RUTA
//     9. sale en la de pago, o antes/durante el viaje, o no sale arriba del todo en la gratis después del viaje, o no lleva [Subir mis fotos] hacia el álbum; el botón de la ficha de parada no es una sola línea;
//    10. queda algún emoji en lo nuevo o en lo pintado.
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
const require = createRequire(import.meta.url)

const { M, ponerVersion } = await prepararSSR('scripts/destino/_6z6b_entrada.tsx', {
  piezasFalsas: [
    { filtro: /map\/StopsMapView$/, exporta: 'StopsMapView' },
    { filtro: /perfil\/MapaMisViajes$/, exporta: 'MapaMisViajes' },
  ],
})
const { createElement, renderToStaticMarkup, PerfilSheet, RouteOverview, TarjetaRecuerdosEnRuta, verTarjetaRecuerdosEnRuta, BotonFotoParada, etiquetaAnadirFoto, limiteDeFotos, modoDeFoto, agruparFotos, chinchetasDeViajes, resumenDeViaje, viajePorId, viajesDelPerfil, PROYECCION_MAPA_VIAJES, usePerfilUi, useRouteStore, useSyncStore } = M
const consolaError = console.error
console.error = (...a) => (/useLayoutEffect|Warning:/.test(String(a[0])) ? undefined : consolaError(...a))
const aTexto = (html) => html.replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, '\n').replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s*\n\s*/g, '\n')
const plano = (t) => t.replace(/\n/g, ' | ')

/* ---------------- Viajes de prueba (a mano, con la forma de la ruta de verdad) ---------------- */
const HOY = '2026-10-10'
const parada = (id, name, lat, lng) => ({ id, name, coordinates: { lat, lng }, time: '10:00', durationMinutes: 60, category: 'monumento', tags: [] })
const dia = (id, dayNumber, city, paradas) => ({ id, dayNumber, city, title: `Día ${dayNumber}`, stops: paradas, meals: [] })
const ruta = ({ id, destino, dias, rango, mes }) => ({
  id,
  destination: destino,
  country: 'Italia',
  origin: 'Madrid',
  days: dias,
  answers: { ...(rango ? { dateRange: { start: rango[0], end: rango[1] } } : {}), ...(mes !== undefined ? { month: mes } : {}), days: dias.length },
  transportContext: {},
  intensity: 3,
  createdAt: '2026-09-01T10:00:00Z',
})
const ROMA = [41.9, 12.49]
const FLORENCIA = [43.77, 11.25]
const R1 = ruta({
  id: 'r1',
  destino: 'Roma',
  rango: ['2026-10-13', '2026-10-16'],
  dias: [
    dia('r1d1', 1, 'Roma', [parada('a', 'Coliseo', ...ROMA), parada('b', 'Foro Romano', 41.892, 12.485), parada('c', 'Panteón', 41.899, 12.477)]),
    dia('r1d2', 2, 'Roma', [parada('d', 'Vaticano', 41.902, 12.454), parada('e', 'Castillo de Sant Angelo', 41.903, 12.466)]),
    dia('r1d3', 3, 'Roma', [parada('f', 'Fontana de Trevi', 41.901, 12.483), parada('g', 'Plaza de España', 41.906, 12.482), parada('h', 'Villa Borghese', 41.914, 12.492)]),
    dia('r1d4', 4, 'Roma', [parada('i', 'Trastevere', 41.889, 12.469), parada('j', 'Gianicolo', 41.891, 12.461), parada('k', 'Aventino', 41.883, 12.48)]),
  ],
})
const R2 = ruta({
  id: 'r2',
  destino: 'Roma y Florencia',
  rango: ['2026-12-05', '2026-12-08'],
  dias: [
    dia('r2d1', 1, 'Roma', [parada('a2', 'Coliseo', ...ROMA)]),
    dia('r2d2', 2, 'Roma', [parada('b2', 'Vaticano', 41.902, 12.454)]),
    dia('r2d3', 3, 'Florencia', [parada('c2', 'Duomo', ...FLORENCIA)]),
    dia('r2d4', 4, 'Florencia', [parada('d2', 'Uffizi', 43.768, 11.255)]),
  ],
})
const R3 = ruta({ id: 'r3', destino: 'Madrid', rango: ['2026-05-01', '2026-05-03'], dias: [dia('r3d1', 1, 'Madrid', [parada('a3', 'Museo del Prado', 40.414, -3.692)]), dia('r3d2', 2, 'Madrid', [parada('b3', 'Retiro', 40.415, -3.684)]), dia('r3d3', 3, 'Madrid', [parada('c3', 'Palacio Real', 40.418, -3.714)])] })
const R4 = ruta({ id: 'r4', destino: 'Sevilla', mes: 0, dias: [dia('r4d1', 1, 'Sevilla', [parada('a4', 'Alcázar', 37.383, -5.99)]), dia('r4d2', 2, 'Sevilla', [parada('b4', 'Catedral', 37.386, -5.993)])] })
const R5 = ruta({ id: 'r5', destino: 'Lisboa', mes: 9, dias: [dia('r5d1', 1, 'Lisboa', [parada('a5', 'Belém', 38.697, -9.206)]), dia('r5d2', 2, 'Lisboa', [parada('b5', 'Alfama', 38.711, -9.13)]), dia('r5d3', 3, 'Lisboa', [parada('c5', 'Sintra', 38.797, -9.39)])] })
const guardado = (route, n) => ({ id: `fila-${n}`, route, bookings: {}, wishlist: [], uiState: { mode: 'route', activeDayId: null }, generationState: null })
// Desordenados a propósito: el Perfil los ordena.
const GUARDADOS = [guardado(R3, 3), guardado(R2, 2), guardado(R4, 4), guardado(R1, 1), guardado(R5, 5)]

/* ---------------- A. Cuántas fotos ---------------- */
const carpeta = fs.mkdtempSync(path.join(os.tmpdir(), 'prueba-6z6b-'))
const falsos = {
  name: 'falsos',
  setup(b) {
    b.onResolve({ filter: /supabaseClient$/ }, () => ({ path: 'sb', namespace: 'falso' }))
    b.onResolve({ filter: /tripPersistence$/ }, () => ({ path: 'tp', namespace: 'falso' }))
    b.onLoad({ filter: /^sb$/, namespace: 'falso' }, () => ({ contents: 'export const supabase = new Proxy({}, { get: (_, k) => globalThis.__sb[k] })', loader: 'js' }))
    b.onLoad({ filter: /^tp$/, namespace: 'falso' }, () => ({ contents: 'export const bootstrapTraveler = async () => "u-1"', loader: 'js' }))
  },
}
const salida = path.join(carpeta, 'fotos.cjs')
await build({ entryPoints: ['src/lib/fotosViaje.ts'], outfile: salida, bundle: true, platform: 'node', format: 'cjs', logLevel: 'silent', plugins: [falsos] })
const F = require(salida)
function crearFalso({ fallaSubida = false } = {}) {
  const estado = { objetos: new Map(), filas: new Map(), llamadas: [], n: 0 }
  globalThis.__sb = {
    storage: {
      from: () => ({
        upload: async (ruta, blob) => {
          estado.llamadas.push('upload')
          if (fallaSubida) return { error: { message: 'x' } }
          estado.objetos.set(ruta, blob)
          return { error: null }
        },
        remove: async (rutas) => {
          estado.llamadas.push('remove')
          for (const r of rutas) estado.objetos.delete(r)
          return { error: null }
        },
        createSignedUrl: async (ruta) => ({ data: { signedUrl: `https://firmada/${ruta}` } }),
        createSignedUrls: async (rutas) => ({ data: rutas.map((r) => ({ path: r, signedUrl: `https://firmada/${r}` })) }),
      }),
    },
    from: () => ({
      insert: (fila) => ({
        select: () => ({
          single: async () => {
            const guardada = { id: `f${++estado.n}`, created_at: `2026-10-13T10:00:${String(estado.n).padStart(2, '0')}Z`, ...fila }
            estado.filas.set(guardada.id, guardada)
            return { data: guardada, error: null }
          },
        }),
      }),
      delete: () => ({
        eq: async (_c, id) => {
          estado.filas.delete(id)
          return { error: null }
        },
      }),
      select: () => {
        const q = { eq: () => q, order: () => q, then: (res) => res({ data: [...estado.filas.values()], error: null }) }
        return q
      },
    }),
  }
  return estado
}
const preparada = { blob: new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xd9])], { type: 'image/jpeg' }), width: 1600, height: 1200, bytes: 4 }
const args = (stopName, dayNumber = 1) => ({ tripId: 'r1', dayId: `r1d${dayNumber}`, dayNumber, stopName })
const silenciar = console.warn
console.warn = () => {}

// Gratis
ponerVersion('gratis')
debe(F.limiteDeFotos().porParada === 1, 'A1', `gratis: el límite por parada es ${F.limiteDeFotos().porParada}, no 1`)
let e = crearFalso()
const f1 = (await F.subirRespetandoLimite(args('Coliseo'), preparada)).foto
debe(!!f1 && e.filas.size === 1, 'A2', 'gratis: la primera foto de la parada no se sube')
debe(F.modoDeFoto([f1], 1, 'Coliseo') === 'cambiar', 'A2', 'gratis: con su foto, la parada no pasa a «Cambiar foto»')
debe(F.modoDeFoto([f1], 1, 'Foro Romano') === 'anadir' && F.modoDeFoto([f1], 2, 'Coliseo') === 'anadir' && F.modoDeFoto([f1], 1, null) === 'anadir', 'A2', 'gratis: otra parada, otro día o «todo el día» deberían seguir en «Añadir foto»')
const f2 = (await F.subirRespetandoLimite(args('Coliseo'), preparada)).foto
debe(e.filas.size === 1 && e.objetos.size === 1 && !e.filas.has(f1.id) && e.filas.has(f2.id), 'A2', `gratis: la segunda foto no sustituye a la primera (filas ${e.filas.size}, objetos ${e.objetos.size})`)
debe(e.llamadas.join() === 'upload,upload,remove', 'A3', `gratis: el orden no es subir la nueva y luego borrar la vieja (${e.llamadas.join()})`)
await F.subirRespetandoLimite(args('Foro Romano'), preparada)
await F.subirRespetandoLimite(args(null), preparada)
await F.subirRespetandoLimite(args(null), preparada)
debe(e.filas.size === 3, 'A1', `gratis: tras Coliseo×2, Foro y «todo el día»×2 debería haber 3 fotos y hay ${e.filas.size}`)
const porSitio = new Map()
for (const fila of e.filas.values()) porSitio.set(`${fila.day_number}|${fila.stop_name}`, (porSitio.get(`${fila.day_number}|${fila.stop_name}`) ?? 0) + 1)
debe([...porSitio.values()].every((n) => n === 1), 'A1', 'gratis: algún sitio tiene más de una foto')
// Si falla la subida de la nueva, la vieja se queda.
e = crearFalso()
const vieja = (await F.subirRespetandoLimite(args('Panteón'), preparada)).foto
const fallida = crearFalso({ fallaSubida: true })
fallida.filas.set(vieja.id, { ...e.filas.get(vieja.id) })
const r = await F.subirRespetandoLimite(args('Panteón'), preparada)
debe(!r.foto && !!r.error && fallida.filas.has(vieja.id), 'A3', 'gratis: si falla la subida de la nueva, la vieja se pierde')
// Con fotos de antes de un límite (varias en el mismo sitio), al cambiar queda una.
e = crearFalso()
ponerVersion('completa')
await F.subirRespetandoLimite(args('Panteón'), preparada)
await F.subirRespetandoLimite(args('Panteón'), preparada)
ponerVersion('gratis')
await F.subirRespetandoLimite(args('Panteón'), preparada)
debe(e.filas.size === 1, 'A2', `gratis: al cambiar la foto de una parada con varias de antes debería quedar una y hay ${e.filas.size}`)

// De pago
ponerVersion('completa')
debe(F.limiteDeFotos().porParada === null, 'A1', 'de pago: hay un límite de fotos')
e = crearFalso()
for (let i = 0; i < 5; i++) await F.subirRespetandoLimite(args('Coliseo'), preparada)
debe(e.filas.size === 5 && e.objetos.size === 5, 'A1', `de pago: 5 fotos en la misma parada deberían quedar 5 y hay ${e.filas.size}`)
debe(F.modoDeFoto([...e.filas.values()].map((x) => ({ dayNumber: x.day_number, stopName: x.stop_name })), 1, 'Coliseo') === 'anadir', 'A2', 'de pago: con fotos, la parada pasa a «Cambiar foto»')
console.warn = silenciar

// Las etiquetas
ponerVersion('gratis')
debe(etiquetaAnadirFoto('anadir') === 'Añadir foto' && etiquetaAnadirFoto('cambiar') === 'Cambiar foto', 'A2', `etiquetas de la gratis: «${etiquetaAnadirFoto('anadir')}» / «${etiquetaAnadirFoto('cambiar')}»`)
ponerVersion('completa')
debe(etiquetaAnadirFoto('anadir') === 'Añadir fotos', 'A2', `etiqueta de pago: «${etiquetaAnadirFoto('anadir')}»`)

// La regla, en un solo sitio: las pantallas de fotos no deciden por su cuenta.
const leer = (f) => fs.readFileSync(f, 'utf8')
const pantallasDeFotos = ['src/components/perfil/AlbumDeViaje.tsx', 'src/components/perfil/FichaDeViaje.tsx', 'src/components/perfil/MapaMisViajes.tsx', 'src/components/route/fotos/BotonFoto.tsx', 'src/components/route/fotos/BotonFotoParada.tsx', 'src/components/layout/PerfilSheet.tsx']
for (const f of pantallasDeFotos) debe(!/pagoActivo/.test(leer(f)), 'A4', `${f} decide por su cuenta con pagoActivo (la regla es limiteDeFotos en fotosViaje.ts)`)

/* ---------------- B. El Perfil ---------------- */
const estadoBase = useRouteStore.getState()
function pintaPerfil({ version, albumDe = null, rutaAbierta = null }) {
  ponerVersion(version)
  useSyncStore.setState({ savedTrips: GUARDADOS, activeTripId: null })
  useRouteStore.setState({ ...estadoBase, route: rutaAbierta, dev_simulated_today_iso: HOY })
  usePerfilUi.setState({ abierto: true, albumDe })
  return aTexto(renderToStaticMarkup(createElement(PerfilSheet, { open: true, onClose() {} })))
}
const hoy = HOY
const lista = viajesDelPerfil(GUARDADOS, null, hoy)
debe(lista.map((v) => v.id).join() === 'r5,r1,r2,r4,r3', 'B5', `el orden de los viajes no es primero los que vienen (por fecha; sin fechas, por su mes) y luego los hechos: ${lista.map((v) => v.id).join()} (esperado r5,r1,r2,r4,r3)`)
debe(lista.find((v) => v.id === 'r3').fase === 'hecho' && lista.filter((v) => v.fase === 'proximo').length === 4, 'B5', 'Madrid (mayo) debería ser un viaje hecho y los otros cuatro, próximos')
const rot = Object.fromEntries(lista.map((v) => [v.id, v.rotulo]))
debe(rot.r1 === 'Roma · 13 – 16 oct 2026 · 4 días', 'B5', `rótulo de Roma: «${rot.r1}»`)
debe(rot.r5 === 'Lisboa · octubre · 3 días', 'B5', `rótulo de un viaje sin fechas: «${rot.r5}» (esperado «Lisboa · octubre · 3 días»)`)
debe(rot.r3 === 'Madrid · 1 – 3 may 2026 · 3 días', 'B5', `rótulo de Madrid: «${rot.r3}»`)
const textoPerfil = pintaPerfil({ version: 'completa' })
for (const r of Object.values(rot)) debe(textoPerfil.includes(r), 'B5', `el Perfil no lista «${r}» (${plano(textoPerfil).slice(0, 400)})`)
debe(textoPerfil.indexOf(rot.r1) < textoPerfil.indexOf(rot.r2) && textoPerfil.indexOf(rot.r2) < textoPerfil.indexOf(rot.r3) && textoPerfil.indexOf(rot.r5) < textoPerfil.indexOf(rot.r1), 'B5', 'el Perfil no pinta los viajes en orden')
debe(/Nuevo viaje/.test(textoPerfil) && !/Tips del viaje/.test(textoPerfil), 'B5', 'falta [Nuevo viaje] en el Perfil, o sigue ahí [Tips del viaje] (ahora es la bombilla de RUTA)')
debe(/Próximos/.test(textoPerfil) && /Ya hechos/.test(textoPerfil) && textoPerfil.indexOf('Próximos') < textoPerfil.indexOf('Ya hechos'), 'B5', 'faltan los rótulos «Próximos» / «Ya hechos»')
debe(/Mis viajes/.test(textoPerfil), 'B5', 'falta el rótulo «Mis viajes»')

// Las chinchetas
const chinchetas = chinchetasDeViajes(lista)
debe(chinchetas.length === 1 + 1 + 2 + 1 + 1, 'B6', `chinchetas: ${chinchetas.length}, una por destino debería dar 6 (Lisboa, Roma, Roma+Florencia×2, Sevilla, Madrid)`)
const deR2 = chinchetas.filter((c) => c.viajeId === 'r2')
debe(deR2.length === 2 && deR2.map((c) => c.ciudad).join() === 'Roma,Florencia', 'B6', `un viaje a Roma y Florencia debería dar dos chinchetas (${deR2.map((c) => c.ciudad)})`)
debe(new Set(chinchetas.map((c) => c.id)).size === chinchetas.length, 'B6', 'hay chinchetas con el mismo id')
const florencia = deR2.find((c) => c.ciudad === 'Florencia')
debe(florencia && Math.abs(florencia.coordenadas.lat - 43.77) < 0.1 && Math.abs(florencia.coordenadas.lng - 11.25) < 0.1, 'B6', 'la chincheta de Florencia no está en Florencia')
debe(chinchetas.find((c) => c.viajeId === 'r3').fase === 'hecho', 'B6', 'la chincheta de un viaje hecho no lo dice')
// Un destino sin paradas con sitio real (0,0) no pone chincheta en el golfo de Guinea.
const sinSitio = ruta({ id: 'r6', destino: 'Oporto', dias: [dia('r6d1', 1, 'Oporto', [parada('z', 'Ribeira', 0, 0)])] })
debe(resumenDeViaje(sinSitio, null, hoy).destinos.length === 0, 'B6', 'una parada sin sitio real (0,0) pone una chincheta')
// El mapa: globo de Mapbox y se destruye
const codigoMapa = leer('src/components/perfil/MapaMisViajes.tsx')
debe(PROYECCION_MAPA_VIAJES === 'globe', 'B6', `la proyección del mapa de mis viajes es «${PROYECCION_MAPA_VIAJES}», no «globe»`)
debe(/new mapboxgl\.Map\(/.test(codigoMapa) && /projection:\s*PROYECCION_MAPA_VIAJES/.test(codigoMapa) && /VITE_MAPBOX_TOKEN/.test(codigoMapa), 'B6', 'MapaMisViajes no crea un mapa de Mapbox con la proyección globo y el token')
debe(/return \(\) => \{[\s\S]*mapa\.remove\(\)/.test(codigoMapa), 'B6', 'MapaMisViajes no destruye el mapa al desmontarse (mapa.remove())')
debe(/<MapaMisViajes chinchetas=\{chinchetas\} onElegir=\{abrirAlbum\}/.test(leer('src/components/layout/PerfilSheet.tsx')), 'B6', 'el Perfil no monta el mapa con las chinchetas y abre la ficha al tocar una')
debe(/ficha \? \(/.test(leer('src/components/layout/PerfilSheet.tsx')) && /MapaMisViajes/.test(leer('src/components/layout/PerfilSheet.tsx')), 'B6', 'el mapa debe desmontarse mientras se ve una ficha')

// La ficha
const FichaR1 = (version) => pintaPerfil({ version, albumDe: 'r1' })
for (const version of ['gratis', 'completa']) {
  const t = FichaR1(version)
  const htmlDelPerfil = renderToStaticMarkup(createElement(PerfilSheet, { open: true, onClose() {} }))
  debe(/Roma/.test(t) && t.includes('13 – 16 oct 2026') && t.includes('4 días · 11 paradas'), 'B7', `${version}: la ficha de Roma no enseña las fechas y «4 días · 11 paradas» (${plano(t).slice(0, 300)})`)
  debe(/Álbum/.test(t) && /Aquí irán tus fotos/.test(t), 'B7', `${version}: la ficha no tiene su álbum`)
  debe(/Abrir este viaje/.test(t), 'B7', `${version}: la ficha de un viaje guardado no lleva [Abrir este viaje]`)
  debe(/Añadir foto/.test(t) && /Parada a la que añadir/.test(htmlDelPerfil), 'B7', `${version}: el álbum no tiene [Añadir foto(s)] con sus selectores`)
}
debe(/Una foto por parada/.test(FichaR1('gratis')) && !/Añadir fotos/.test(FichaR1('gratis')), 'B7', 'gratis: el álbum no dice «Una foto por parada» (o ofrece «Añadir fotos»)')
debe(!/Una foto por parada/.test(FichaR1('completa')) && /Añadir fotos/.test(FichaR1('completa')), 'B7', 'de pago: el álbum dice «Una foto por parada» o no ofrece «Añadir fotos»')
const fichaMulti = pintaPerfil({ version: 'completa', albumDe: 'r2' })
debe(/Roma · Florencia/.test(fichaMulti) && fichaMulti.includes('4 días · 4 paradas'), 'B7', 'la ficha de Roma y Florencia no nombra sus dos destinos o su resumen')
debe(viajePorId(lista, 'fila-1')?.id === 'r1' && viajePorId(lista, 'r1')?.id === 'r1' && viajePorId(lista, 'nada') === null, 'B7', 'viajePorId no encuentra por id de ruta o de fila guardada')
// El viaje abierto y sin guardar también sale.
const conAbierta = viajesDelPerfil([], R1, hoy)
debe(conAbierta.length === 1 && conAbierta[0].id === 'r1' && conAbierta[0].guardado === null, 'B5', 'el viaje abierto y aún sin guardar no sale en el Perfil')
debe(!/Abrir este viaje/.test(pintaPerfil({ version: 'completa', albumDe: 'r1', rutaAbierta: R1 })) && /Abierto/.test(pintaPerfil({ version: 'completa', albumDe: 'r1', rutaAbierta: R1 })), 'B7', 'el viaje que ya está abierto debería decir «Abierto» y no ofrecer abrirlo')

// El álbum ordenado por días
const F_ = (id, dayNumber, stopName, t) => ({ id, tripId: 'r1', dayId: `r1d${dayNumber}`, dayNumber, stopName, storagePath: `p/${id}`, width: 1, height: 1, bytes: 1, createdAt: `2026-10-13T10:00:0${t}Z`, url: '' })
const mezcla = [F_('a', 3, 'Plaza de España', 1), F_('b', 1, 'Panteón', 2), F_('c', 1, null, 3), F_('d', 3, 'Fontana de Trevi', 4), F_('e', 2, 'Vaticano', 5), F_('f', 1, 'Coliseo', 6), F_('g', 1, 'Una que ya no está', 7)]
const grupos = agruparFotos(mezcla, R1)
debe(grupos.map((g) => g.dayNumber).join() === '1,2,3', 'B8', `el álbum no va por días: ${grupos.map((g) => g.dayNumber)}`)
debe(grupos[0].grupos.map((g) => g.parada).join('|') === 'Coliseo|Panteón|Una que ya no está|', 'B8', `día 1: no va por paradas en el orden de la ruta, luego las que ya no están y al final el día entero (${grupos[0].grupos.map((g) => g.parada).join('|')})`)
debe(grupos[2].grupos.map((g) => g.parada).join('|') === 'Fontana de Trevi|Plaza de España', 'B8', `día 3: ${grupos[2].grupos.map((g) => g.parada).join('|')}`)

/* ---------------- C. «Guarda tus recuerdos» en RUTA ---------------- */
function pintaRuta(route, version, hoySimulado) {
  ponerVersion(version)
  useRouteStore.setState({ ...estadoBase, route, dev_simulated_today_iso: hoySimulado })
  return aTexto(renderToStaticMarkup(createElement(RouteOverview, { route })))
}
const tarjeta = (t) => /Guarda tus recuerdos/.test(t)
const despues = pintaRuta(R3, 'gratis', HOY)
debe(tarjeta(despues) && /Subir mis fotos/.test(despues), 'C9', `gratis, después del viaje: falta la tarjeta con [Subir mis fotos] en RUTA (${plano(despues).slice(0, 300)})`)
debe(despues.indexOf('Guarda tus recuerdos') >= 0 && despues.indexOf('Guarda tus recuerdos') < despues.indexOf('Madrid'), 'C9', 'la tarjeta no sale ARRIBA del todo de RUTA (antes de los destinos)')
debe(/Una foto por parada/.test(despues), 'C9', 'la tarjeta de la gratis no avisa «Una foto por parada»')
debe(!tarjeta(pintaRuta(R3, 'completa', HOY)), 'C9', 'de pago: sale la tarjeta en RUTA (en la de pago está en HOY)')
debe(!tarjeta(pintaRuta(R1, 'gratis', HOY)), 'C9', 'gratis, ANTES del viaje: sale la tarjeta')
debe(!tarjeta(pintaRuta(R1, 'gratis', '2026-10-14')), 'C9', 'gratis, DURANTE el viaje: sale la tarjeta')
debe(!tarjeta(pintaRuta(R4, 'gratis', HOY)), 'C9', 'gratis, viaje sin fechas: sale la tarjeta')
debe(tarjeta(pintaRuta(R1, 'gratis', '2026-10-17')), 'C9', 'gratis, un día después del viaje: no sale la tarjeta')
ponerVersion('gratis')
debe(verTarjetaRecuerdosEnRuta(R3, HOY) === true && verTarjetaRecuerdosEnRuta(R1, HOY) === false, 'C9', 'verTarjetaRecuerdosEnRuta no decide bien')
const codigoTarjeta = leer('src/components/route/fotos/TarjetaRecuerdos.tsx')
debe(/abrirAlbum\(route\.id\)/.test(codigoTarjeta), 'C9', '[Subir mis fotos] no abre el álbum del viaje (abrirAlbum)')
// Una sola línea en RUTA y en la ficha de parada
const lineasEn = (f, re) => leer(f).split('\n').filter((l) => re.test(l))
debe(lineasEn('src/components/route/RouteOverview.tsx', /<TarjetaRecuerdosEnRuta /).length === 1, 'C9', 'RUTA no monta la tarjeta con una sola línea')
const enFicha = lineasEn('src/components/route/dayDetail/StopDetailSheet.tsx', /<BotonFotoParada /)
debe(enFicha.length === 1, 'C9', `la ficha de parada no monta el botón de foto con una sola línea (${enFicha.length})`)
// El botón de la ficha de parada: «Añadir foto» con el icono de cámara
ponerVersion('gratis')
useRouteStore.setState({ ...estadoBase, route: R1 })
const botonParada = renderToStaticMarkup(createElement(BotonFotoParada, { stopName: 'Coliseo', dayNumber: 1 }))
debe(/Añadir foto/.test(aTexto(botonParada)) && /<svg/.test(botonParada) && /M4 8h3l1\.8/.test(botonParada), 'C9', 'el botón de la ficha de parada no es «Añadir foto» con el icono de cámara')
debe(renderToStaticMarkup(createElement(BotonFotoParada, { stopName: 'Coliseo', dayNumber: 99 })) === '', 'C9', 'el botón de foto sale para un día que no existe')
debe(/'Cambiar foto'/.test(leer('src/components/route/fotos/BotonFotoParada.tsx')) && /modoDeFoto\(/.test(leer('src/components/route/fotos/BotonFotoParada.tsx')), 'C9', 'el botón de parada no cambia a «Cambiar foto» según modoDeFoto')

/* ---------------- 10. Emojis ---------------- */
const nuevos = ['src/lib/viajesPerfil.ts', 'src/store/usePerfilUi.ts', 'src/components/perfil/MapaMisViajes.tsx', 'src/components/perfil/FichaDeViaje.tsx', 'src/components/perfil/AlbumDeViaje.tsx', 'src/components/route/fotos/TarjetaRecuerdos.tsx', 'src/components/route/fotos/BotonFotoParada.tsx', 'src/components/layout/PerfilSheet.tsx']
const SIGNOS = /[✓✔✕✗★♥❤↔↕→←↑↓…©]/gu
for (const f of nuevos) {
  const sueltos = (leer(f).replace(SIGNOS, '').match(/\p{Extended_Pictographic}/gu) ?? []).length
  debe(sueltos === 0, '10', `${f} lleva ${sueltos} emoji(s)`)
}
const pintado = [textoPerfil, FichaR1('gratis'), despues, botonParada].join('\n')
debe(((pintado.replace(SIGNOS, '').match(/\p{Extended_Pictographic}/gu)) ?? []).length === 0, '10', 'lo pintado lleva algún emoji')

fs.rmSync(carpeta, { recursive: true, force: true })
console.warn = silenciar
if (fallos.length === 0) {
  console.log(`\n${comprobaciones} comprobaciones, 0 fallos.`)
  process.exit(0)
}
for (const f of fallos) console.log(`  ✗ [${f.regla}] ${f.texto}`)
console.log(`\n${fallos.length} fallos de ${comprobaciones}.`)
process.exit(1)
