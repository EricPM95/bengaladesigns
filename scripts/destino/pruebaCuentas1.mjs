// La prueba de las cuentas, parte 1 (docs/dias/PLAN_CUENTAS.md). No toca el motor de rutas.
//   node scripts/destino/pruebaCuentas1.mjs
//
// Ejecuta DE VERDAD la migración 0020 (y las que ya había) sobre un Postgres de prueba que corre dentro de Node (PGlite), con `auth.uid()` simulado y las reglas
// de seguridad activas, y comprueba: entrar (la sesión anónima pasa a cuenta y se guarda la fecha de alta), un viaje del móvil que pasa a la cuenta (Caso B),
// una foto (con la fecha y el sitio leídos antes de quitarle los datos), un invitado que NO puede cambiar la ruta, cada persona con sus vistos, y borrar la
// cuenta sin que quede nada suyo en ninguna tabla ni en las fotos. Lo que PGlite no es (Supabase, Google, el envío de correos) se prueba a mano: ver el informe.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'
import { build } from 'esbuild'
import { PGlite } from '@electric-sql/pglite'
import { borrarCuenta, reclamarCuenta, archivosDe, registrarRutasCuentas, BUCKET_FOTOS } from '../../server/cuentas.js'

const fallos = []
let comprobaciones = 0
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) fallos.push({ regla, texto })
}
const lanza = async (fn) => {
  try {
    await fn()
    return null
  } catch (error) {
    return String(error?.message ?? error)
  }
}

/* ─────────────────────────── 1. Lo del navegador, empaquetado ─────────────────────────── */
const carpeta = fs.mkdtempSync(path.join(os.tmpdir(), 'prueba-cuentas-'))
const realReactDom = path.resolve('node_modules/react-dom/index.js')
async function empaquetar(nombre, entorno) {
  const salida = path.join(carpeta, `${nombre}.cjs`)
  await build({
    entryPoints: ['scripts/destino/_cuentas1_entrada.tsx'],
    outfile: salida,
    bundle: true,
    platform: 'node',
    format: 'cjs',
    jsx: 'automatic',
    logLevel: 'error',
    define: { 'import.meta.env': JSON.stringify({ DEV: false, MODE: 'test', VITE_CUENTAS_ACTIVAS: entorno }) },
    plugins: [
      {
        name: 'portales-en-su-sitio',
        setup(b) {
          b.onResolve({ filter: /^react-dom$/ }, () => ({ path: 'react-dom', namespace: 'portales' }))
          b.onLoad({ filter: /.*/, namespace: 'portales' }, () => ({ contents: `const real = require(${JSON.stringify(realReactDom)}); module.exports = { ...real, createPortal: (children) => children }`, loader: 'js', resolveDir: process.cwd() }))
        },
      },
    ],
  })
  return createRequire(import.meta.url)(salida).M
}

const almacen = () => {
  const mapa = new Map()
  return { getItem: (k) => mapa.get(k) ?? null, setItem: (k, v) => mapa.set(k, String(v)), removeItem: (k) => mapa.delete(k), key: (i) => [...mapa.keys()][i] ?? null, get length() { return mapa.size } }
}
globalThis.window = { location: { search: '', hash: '', pathname: '/', origin: 'http://localhost', href: 'http://localhost/' }, sessionStorage: almacen(), localStorage: almacen(), addEventListener() {}, removeEventListener() {} }
globalThis.document = { body: {}, createElement: () => ({}), documentElement: { style: {}, classList: { toggle() {}, add() {}, remove() {} } }, addEventListener() {}, removeEventListener() {} }
globalThis.localStorage = globalThis.window.localStorage
globalThis.sessionStorage = globalThis.window.sessionStorage

const apagado = await empaquetar('apagado', undefined)
const encendido = await empaquetar('encendido', 'true')

console.log('1. El interruptor y las pantallas')
{
  const c = apagado.calcularCuentasActivas
  debe(c({ desarrollo: false, entorno: undefined }) === false, 'interruptor', 'sin variable, las cuentas están apagadas')
  debe(c({ desarrollo: false, entorno: 'false' }) === false, 'interruptor', 'con la variable en false, apagadas')
  debe(c({ desarrollo: false, entorno: 'true' }) === true, 'interruptor', 'con la variable en true, encendidas')
  debe(c({ desarrollo: false, entorno: undefined, parametro: 'on', guardado: 'on' }) === false, 'interruptor', 'en producción, ?cuentas=on NO enciende nada')
  debe(c({ desarrollo: true, entorno: undefined, parametro: 'on' }) === true, 'interruptor', 'en desarrollo, ?cuentas=on enciende')
  debe(c({ desarrollo: true, entorno: 'true', parametro: 'off' }) === false, 'interruptor', 'en desarrollo, ?cuentas=off apaga')
  debe(c({ desarrollo: true, entorno: undefined, guardado: 'on' }) === true, 'interruptor', 'en desarrollo se recuerda lo elegido mientras la pestaña esté abierta')
  debe(apagado.pintaPuerta() === '', 'apagado', 'con el interruptor apagado, la puerta no pinta nada')
  debe(apagado.pintaCuentaEnPerfil() === '', 'apagado', 'con el interruptor apagado, el Perfil no lleva la cuenta')
  debe(encendido.pintaPuerta() === '', 'encendido', 'encendido y aún cargando, la puerta no pinta nada (no tapa la app sin saber quién eres)')
  const perfil = encendido.pintaCuentaEnPerfil()
  debe(/Mi cuenta/.test(perfil) && /Privacidad/.test(perfil) && /Todavía no has entrado/.test(perfil), 'encendido', 'encendido, el Perfil enseña «Mi cuenta» y «Privacidad»')
  debe(!/Borrar mi cuenta/.test(perfil) && !/Cerrar sesión/.test(perfil), 'encendido', 'sin cuenta, el Perfil no ofrece borrar ni cerrar sesión')
  const entrar = encendido.pintaEntrar()
  debe(/Entra en tu cuenta/.test(entrar) && /Enviarme un enlace/.test(entrar) && /Entrar con Google/.test(entrar) && !/Apple/.test(entrar), 'entrar', 'la pantalla de entrar ofrece email y Google, y Apple no')
  const e = encendido.estadoDeSesion
  debe(e(null).tipo === 'sin_sesion', 'sesion', 'sin sesión')
  debe(e({ user: { id: 'u1', is_anonymous: true } }).tipo === 'anonima', 'sesion', 'sesión anónima')
  debe(e({ user: { id: 'u2', is_anonymous: false, email: 'a@b.es' } }).email === 'a@b.es', 'sesion', 'cuenta con email')
}

console.log('2. La página de privacidad')
{
  const M = encendido
  const pagina = M.pintaPrivacidad()
  const ids = M.APARTADOS_DE_PRIVACIDAD.map((a) => a.id)
  for (const id of ['quien', 'que-guardamos', 'para-que', 'cuanto-tiempo', 'con-quien', 'como-borrarlo', 'tus-derechos', 'a-quien-escribir']) debe(ids.includes(id), 'privacidad', `falta el apartado ${id}`)
  debe((pagina.match(/Texto pendiente/g) ?? []).length === M.APARTADOS_DE_PRIVACIDAD.length, 'privacidad', 'cada apartado dice «Texto pendiente» (ni más ni menos): los textos legales los escribe Eric')
  for (const servicio of ['Supabase', 'Google', 'Anthropic', 'Mapbox', 'Vercel']) debe(pagina.includes(servicio), 'privacidad', `la página no nombra a ${servicio}`)
  debe(!/recoge|conservaremos|base legal|RGPD/i.test(pagina.replace(/<h2[^>]*>.*?<\/h2>/g, '').replace(/<p class="m-0 text-\[13px\][^>]*>.*?<\/p>/g, '')), 'privacidad', 'la página no lleva textos legales inventados')
}

/* ─────────────────────────── 3. Las fotos: lo que se lee y lo que se quita ─────────────────────────── */
console.log('3. Las fotos')
function crearJpegConExif({ little = true, make = 'Apple', model = 'iPhone 15', fecha = '2026:10:11 10:30:15', zona = '+02:00', lat = [41, 53, 25.2], latRef = 'N', lng = [12, 29, 32], lngRef = 'E' } = {}) {
  const u16 = (n) => (little ? [n & 255, n >> 8] : [n >> 8, n & 255])
  const u32 = (n) => (little ? [n & 255, (n >> 8) & 255, (n >> 16) & 255, (n >>> 24) & 255] : [(n >>> 24) & 255, (n >> 16) & 255, (n >> 8) & 255, n & 255])
  const ascii = (t) => [...Buffer.from(`${t}\0`, 'latin1')]
  // Cada entrada: { tag, tipo, cuenta, valor: bytes (ya completos) }. Los valores de más de 4 bytes van a la zona de datos.
  const bloque = (entradas, desde) => {
    const tabla = 2 + entradas.length * 12 + 4
    let datos = []
    const filas = []
    for (const e of entradas) {
      let valor
      if (e.valor.length <= 4) valor = [...e.valor, ...Array(4 - e.valor.length).fill(0)]
      else {
        valor = u32(desde + tabla + datos.length)
        datos = [...datos, ...e.valor]
        if (datos.length % 2) datos.push(0)
      }
      filas.push([...u16(e.tag), ...u16(e.tipo), ...u32(e.cuenta), ...valor])
    }
    return [...u16(entradas.length), ...filas.flat(), ...u32(0), ...datos]
  }
  const racional = (v, den) => [...u32(Math.round(v * den)), ...u32(den)]
  const gradosBytes = ([g, m, s]) => [...racional(g, 1), ...racional(m, 1), ...racional(s, 100)]
  const a = (tag, texto) => ({ tag, tipo: 2, cuenta: ascii(texto).length, valor: ascii(texto) })
  // Tamaños fijos para saber dónde cae cada bloque (la tabla de cada IFD y su zona de datos).
  const tamano = (entradas) => bloque(entradas, 0).length
  const exifEntradas = [a(0x9003, fecha), ...(zona ? [a(0x9011, zona)] : [])]
  const gpsEntradas = [a(0x0001, latRef), { tag: 0x0002, tipo: 5, cuenta: 3, valor: gradosBytes(lat) }, a(0x0003, lngRef), { tag: 0x0004, tipo: 5, cuenta: 3, valor: gradosBytes(lng) }]
  const ifd0Plantilla = (exif, gps) => [a(0x010f, make), a(0x0110, model), { tag: 0x8769, tipo: 4, cuenta: 1, valor: u32(exif) }, { tag: 0x8825, tipo: 4, cuenta: 1, valor: u32(gps) }]
  const tam0 = tamano(ifd0Plantilla(0, 0))
  const posExif = 8 + tam0
  const tamExif = tamano(exifEntradas)
  const posGps = posExif + tamExif
  const tiff = [...(little ? [0x49, 0x49] : [0x4d, 0x4d]), ...u16(42), ...u32(8), ...bloque(ifd0Plantilla(posExif, posGps), 8), ...bloque(exifEntradas, posExif), ...bloque(gpsEntradas, posGps)]
  const app1 = [0x45, 0x78, 0x69, 0x66, 0, 0, ...tiff]
  const len = app1.length + 2
  return new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 4, 0x4a, 0x46, 0xff, 0xe1, len >> 8, len & 255, ...app1, 0xff, 0xda, 0, 2, 0xaa, 0xbb, 0xff, 0xd9])
}
{
  const M = apagado
  for (const little of [true, false]) {
    const d = M.leerDatosDeFoto(crearJpegConExif({ little }))
    const t = little ? 'little-endian' : 'big-endian'
    debe(d.tomadaEn === '2026-10-11T10:30:15+02:00', 'fotos_datos', `${t}: la fecha de la toma sale mal: ${d.tomadaEn}`)
    debe(d.conCamara === true, 'fotos_datos', `${t}: no detecta la cámara`)
    debe(Math.abs(d.lat - 41.890333) < 1e-4 && Math.abs(d.lng - 12.492222) < 1e-4, 'fotos_datos', `${t}: la ubicación sale mal: ${d.lat}, ${d.lng}`)
  }
  const sur = M.leerDatosDeFoto(crearJpegConExif({ latRef: 'S', lngRef: 'W' }))
  debe(sur.lat < 0 && sur.lng < 0, 'fotos_datos', 'el sur y el oeste salen con signo negativo')
  const sinGps = M.leerDatosDeFoto(crearJpegConExif({ zona: null }))
  debe(sinGps.tomadaEn === '2026-10-11T10:30:15', 'fotos_datos', 'sin zona horaria, la hora sale sin zona')
  const sinNada = M.leerDatosDeFoto(new Uint8Array([0xff, 0xd8, 0xff, 0xd9, 0, 0, 0, 0, 0, 0, 0, 0]))
  debe(sinNada.tomadaEn === null && sinNada.lat === null && sinNada.conCamara === false, 'fotos_datos', 'una foto sin datos sale vacía')
  debe(M.leerDatosDeFoto(new Uint8Array([1, 2, 3])).conCamara === false, 'fotos_datos', 'lo que no es un JPEG sale vacío y no lanza')
  const original = crearJpegConExif()
  const limpia = M.quitarMetadatosJpeg(original)
  const despues = M.leerDatosDeFoto(limpia)
  debe(despues.tomadaEn === null && despues.lat === null && despues.lng === null && despues.conCamara === false, 'fotos_sin_datos', 'la foto que se sube NO lleva fecha, ubicación ni cámara')
  debe(limpia.length < original.length && !Buffer.from(limpia).includes(Buffer.from('iPhone')), 'fotos_sin_datos', 'la foto limpia no lleva ni el modelo del móvil')
  const pasos = M.pasosDeCompresion(4032)
  debe(pasos[0].lado === M.LADO_MAXIMO_PX && pasos[0].calidad === M.CALIDAD_JPEG, 'fotos_300kb', 'el primer intento es el de siempre (1.600 px, calidad 0,82)')
  debe(pasos.every((p) => p.lado >= M.LADO_MINIMO_PX && p.calidad >= M.CALIDAD_MINIMA), 'fotos_300kb', 'ningún intento baja del mínimo (1.000 px, calidad 0,55)')
  debe(pasos.every((p, i) => i === 0 || p.lado < pasos[i - 1].lado || p.calidad < pasos[i - 1].calidad || p.lado === pasos[i - 1].lado), 'fotos_300kb', 'los intentos solo van a menos')
  debe(pasos.length > 5 && pasos.at(-1).lado < pasos[0].lado, 'fotos_300kb', 'si la calidad no basta, baja el lado')
  debe(M.OBJETIVO_BYTES === 300 * 1024, 'fotos_300kb', 'el objetivo son 300 KB')
  const pequena = M.pasosDeCompresion(800)
  debe(pequena.every((p) => p.lado === 800), 'fotos_300kb', 'una foto pequeña no se agranda ni se reduce de lado')
  const nombre = M.nombreDeArchivo({ dayNumber: 3, stopName: 'Foro Romano y Palatino', id: 'abcdef12-0000' })
  debe(nombre === 'routy-dia-3-foro-romano-y-palatino-abcdef.jpg', 'fotos_galeria', `el nombre del archivo es ${nombre}`)
  debe(M.nombreDeArchivo({ dayNumber: 1, stopName: null, id: '123456789' }) === 'routy-dia-1-123456.jpg', 'fotos_galeria', 'sin parada, el nombre no lleva sitio')
  const route = { days: [{ id: 'd1', stops: [{ id: 's1', checkedInAt: '2026-10-11T09:00:00Z' }, { id: 's2', checkedInAt: null }] }, { id: 'd2', stops: [{ id: 's3', checkedInAt: '2026-10-12T09:00:00Z' }] }] }
  const vistos = M.vistosDeLaRuta('t1', route)
  debe(vistos.length === 2 && vistos[0].stopId === 's1' && vistos[1].dayId === 'd2', 'vistos', 'los vistos que lleva la ruta dentro se leen bien')
}

/* ─────────────────────────── 4. El Postgres de prueba ─────────────────────────── */
/* ─────────────────────────── 3b. Vistos de cada persona, invitaciones y recomendaciones aplicadas (parte 2) ─────────────────────────── */
console.log('3b. Vistos de cada persona, invitaciones y recomendaciones aplicadas')
{
  const M = encendido
  const stop = (id, name, time, lat, lng, extra = {}) => ({ id, name, time, description: '', durationMinutes: 45, coordinates: { lat, lng }, photoUrl: '', ...extra })
  const dia = (id, n, stops, extra = {}) => ({ id, dayNumber: n, city: 'Roma', title: `Día ${n}`, stops, meals: [], dayType: 'normal', ...extra })
  const nuevaRuta = () => ({
    id: 'ruta-1',
    destination: 'Roma',
    country: 'Italia',
    origin: 'Madrid',
    days: [
      dia('d1', 1, [stop('s1', 'Coliseo', '09:00', 41.89, 12.492), stop('s2', 'Arco de Constantino', '10:00', 41.8898, 12.4906), stop('s3', 'Foro Romano', '10:45', 41.8925, 12.4853)]),
      dia('d2', 2, [stop('s4', 'Plaza de San Pedro', '09:00', 41.9022, 12.4539), stop('s5', 'Basílica de San Pedro', '10:00', 41.9022, 12.4534)]),
    ],
    answers: {},
    transportContext: {},
    intensity: 50,
    createdAt: '2026-10-01T10:00:00Z',
  })
  const nombres = (route, dayId) => route.days.find((d) => d.id === dayId)?.stops.map((s) => s.name)

  // Los vistos de cada persona sobre la ruta
  {
    const ruta = nuevaRuta()
    ruta.days[0].stops[0].checkedInAt = '2026-10-11T09:00:00Z' // (el del administrador, dentro de la ruta)
    const deEllos = M.conVistosDe(ruta, [{ stopId: 's2', vistoEn: '2026-10-11T10:00:00Z' }])
    debe(deEllos.days[0].stops[0].checkedInAt === null && deEllos.days[0].stops[1].checkedInAt === '2026-10-11T10:00:00Z', 'vistos2', 'se pintan los vistos de ESTA persona (los del administrador, que van en la ruta, no)')
    debe(M.conVistosDe(deEllos, [{ stopId: 's2', vistoEn: '2026-10-11T10:00:00Z' }]) === deEllos, 'vistos2', 'si no cambia nada, devuelve la misma ruta (no repinta)')
    debe(ruta.days[0].stops[0].checkedInAt === '2026-10-11T09:00:00Z', 'vistos2', 'no cambia la ruta original')
    const cambios = M.cambiosDeVistos(ruta, deEllos)
    debe(cambios.length === 2 && cambios.some((c) => c.stopId === 's1' && c.visto === false) && cambios.some((c) => c.stopId === 's2' && c.visto === true), 'vistos2', 'se detecta qué vistos se han puesto y quitar entre dos rutas')
    debe(M.cambiosDeVistos(ruta, { ...ruta, id: 'otra' }).length === 0, 'vistos2', 'entre viajes distintos no se compara nada')
    debe(M.pintaVistos() === '', 'vistos2', 'el enganche de los vistos no pinta nada')
  }

  // Los códigos y los enlaces
  {
    debe(M.normalizarCodigo(' ab-cd 23 45 ') === 'ABCD2345', 'invitar_texto', 'el código se escribe como sea y se normaliza')
    debe(M.enlaceDeInvitacion('https://bengaladesigns.vercel.app/', 'abcd2345') === 'https://bengaladesigns.vercel.app/?invitacion=ABCD2345', 'invitar_texto', 'el enlace lleva el código')
    debe(M.codigoDeLaDireccion('?invitacion=abcd2345&x=1') === 'ABCD2345' && M.codigoDeLaDireccion('?otra=1') === null && M.codigoDeLaDireccion('?invitacion=ab') === null, 'invitar_texto', 'el código sale de la dirección y un código absurdo no vale')
    debe(/anulado/.test(M.textoDeInvitacionNoValida('anulada')) && /plazas/.test(M.textoDeInvitacionNoValida('sin_usos')) && /Revisa/.test(M.textoDeInvitacionNoValida('no_existe')), 'invitar_texto', 'cada motivo se explica en palabras sencillas')
  }

  // Siempre se puede aceptar (Tanda 8A2: fuera «ya no encaja»): sustituye a lo que hay ahora; si el día ya no existe, hay que elegir otro
  {
    const ruta = nuevaRuta()
    const res = (tipo, payload, dia2 = null, r = ruta) => M.resolverRecomendacion(r, { tipo, payload }, dia2)
    debe(res('cambio', { dayId: 'd1', accion: 'quitar', stopId: 's2' }).accion?.kind === 'quitar', 'aceptar', 'quitar una parada que está: se quita')
    debe(res('cambio', { dayId: 'd1', accion: 'quitar', stopId: 'sXX' }).accion?.kind === 'nada' && res('cambio', { dayId: 'd1', accion: 'quitar', stopId: 'sXX' }).ok === true, 'aceptar', 'quitar una parada que ya no está: se acepta y no hace nada, sin «ya no encaja»')
    debe(res('cambio', { dayId: 'd9', accion: 'quitar', stopId: 's2' }).accion?.dayId === 'd1', 'aceptar', 'quitar una parada cuyo día ya no existe: se quita de donde esté ahora')
    debe(res('cambio', { dayId: 'd1', accion: 'mover', stopId: 's1', haciaIndice: 2 }).accion?.kind === 'mover' && res('cambio', { dayId: 'd1', accion: 'mover', stopId: 's1', haciaIndice: 7 }).accion?.haciaIndice === 2, 'aceptar', 'mover: si el sitio ya no existe, se pone al final del día')
    debe(res('cambio', { dayId: 'd1', accion: 'anadir', stop: stop('n1', 'Panteón', '', 41.89, 12.47), despuesDe: 's1' }).accion?.kind === 'anadir', 'aceptar', 'añadir una parada nueva')
    debe(res('cambio', { dayId: 'd1', accion: 'anadir', stop: stop('n1', 'Coliseo', '', 41.89, 12.47) }).accion?.kind === 'nada', 'aceptar', 'añadir una parada que ya está: se acepta y no hace nada')
    const sinDespues = res('cambio', { dayId: 'd1', accion: 'anadir', stop: stop('n1', 'Panteón', '', 41.89, 12.47), despuesDe: 'sXX' })
    debe(sinDespues.ok === true && sinDespues.accion.despuesDe === 's3', 'aceptar', 'si la parada de «después de» ya no está, la nueva va al final del día')
    const cambiar = res('cambio', { dayId: 'd1', accion: 'cambiar', stopId: 's2', stop: stop('n2', 'Panteón', '', 41.89, 12.47) })
    debe(cambiar.accion?.kind === 'cambiar' && cambiar.accion.stopId === 's2', 'aceptar', 'cambiar una parada por otra')
    debe(res('cambio', { dayId: 'd1', accion: 'cambiar', stopId: 'sXX', stop: stop('n2', 'Panteón', '', 41.89, 12.47) }).accion?.kind === 'anadir', 'aceptar', 'cambiar una parada que ya no está: la nueva entra al final del día')
    // El día de la recomendación ya no existe: hay que elegir en qué día se pone
    const sinDia = res('cambio', { dayId: 'd9', accion: 'anadir', stop: stop('n1', 'Panteón', '', 41.89, 12.47) })
    debe(sinDia.ok === false && sinDia.necesitaDia === true && sinDia.diasPosibles.length === ruta.days.length, 'aceptar', 'si el día ya no existe, pide elegir día y dice entre cuáles')
    debe(res('cambio', { dayId: 'd9', accion: 'anadir', stop: stop('n1', 'Panteón', '', 41.89, 12.47) }, 'd2').accion?.dayId === 'd2', 'aceptar', 'con el día elegido, se pone ahí')
    debe(res('cambio', { dayId: 'd9', accion: 'anadir', stop: stop('n1', 'Panteón', '', 41.89, 12.47) }, 'dXX').ok === false, 'aceptar', 'un día elegido que no es de su viaje no vale')
    debe(res('dia', { accion: 'sustituir', dayId: 'd2', day: dia('d2', 2, []) }).accion?.kind === 'sustituir_dia', 'aceptar', 'sustituir un día existente')
    const sinDia2 = res('dia', { accion: 'sustituir', dayId: 'd9', day: dia('d9', 2, []) })
    debe(sinDia2.necesitaDia === true && res('dia', { accion: 'sustituir', dayId: 'd9', day: dia('d9', 2, []) }, 'd1').accion?.dayId === 'd1', 'aceptar', 'sustituir un día que ya no existe: elige qué día sustituye')
    debe(res('dia', { accion: 'anadir', despuesDeDayId: 'd9', day: dia('dN', 3, []) }).accion?.despuesDeDayId === null, 'aceptar', 'añadir un día cuyo «después de» ya no existe: al final')
    debe(res('ruta', { days: [dia('a', 1, []), dia('b', 2, [])] }).accion?.kind === 'ruta' && res('ruta', { days: [] }).ok === false, 'aceptar', 'la ruta entera necesita días')
    debe(res('ruta', { days: [dia('a', 1, [])], baseRouteId: 'otra' }).accion?.kind === 'ruta', 'aceptar', 'la ruta entera sobre otra base también se acepta: sustituye a la de ahora')
    debe(res('inventada', {}).ok === false && M.resolverRecomendacion(null, { tipo: 'cambio', payload: {} }).ok === false, 'aceptar', 'un tipo raro o sin ruta no se puede')
    debe(M.ordenTrasMover([{ id: 'a' }, { id: 'b' }, { id: 'c' }], 'a', 2).join() === 'b,c,a' && M.indiceTrasParada([{ id: 'a' }, { id: 'b' }], 'a') === 1 && M.indiceTrasParada([{ id: 'a' }], null) === 0, 'aceptar', 'el orden tras mover y el sitio donde se añade salen bien')
    debe(/Quitar Arco de Constantino en «Día 1»/.test(M.textoDeRecomendacion({ tipo: 'cambio', payload: { dayId: 'd1', accion: 'quitar', stopId: 's2' } }, ruta)) && /Cambiar Arco de Constantino por Panteón/.test(M.textoDeRecomendacion({ tipo: 'cambio', payload: { dayId: 'd1', accion: 'cambiar', stopId: 's2', stop: stop('n2', 'Panteón', '', 41.89, 12.47) } }, ruta)), 'aceptar', 'el texto de la lista dice qué recomienda')
    debe(!/ya_no_encaja|ya no encaja/i.test(fs.readFileSync('src/lib/aplicarRecomendacion.ts', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')) && !/ya_no_encaja/.test(fs.readFileSync('src/lib/recomendacionesViaje.ts', 'utf8')), 'aceptar', 'ya no existe el estado «ya no encaja» en el código')
    // El antes y el después: con la ruta de AHORA, por días, solo los que cambian
    const rutaDeAhora = nuevaRuta()
    const vp = M.vistaPrevia(rutaDeAhora, res('cambio', { dayId: 'd1', accion: 'quitar', stopId: 's2' }, null, rutaDeAhora).accion)
    debe(vp.length === 1 && vp[0].dayId === 'd1' && vp[0].sale.join() === 'Arco de Constantino' && vp[0].entra.length === 0 && vp[0].antes.length === 3, 'antes_despues', 'el antes y el después de quitar una parada: solo ese día, con lo que sale')
    const vp2 = M.vistaPrevia(rutaDeAhora, res('dia', { accion: 'sustituir', dayId: 'd2', day: dia('d2', 2, [stop('v1', 'Museos Vaticanos', '09:00', 41.9065, 12.4536)]) }).accion)
    debe(vp2.length === 1 && vp2[0].entra.join() === 'Museos Vaticanos' && vp2[0].sale.length === 2, 'antes_despues', 'un día entero: lo que sale y lo que entra')
    const vp3 = M.vistaPrevia(rutaDeAhora, res('ruta', { days: [dia('d1', 1, rutaDeAhora.days[0].stops), dia('d7', 2, [stop('z1', 'Villa Borghese', '10:00', 41.9142, 12.4923)])] }).accion)
    debe(vp3.some((c) => c.dayId === 'd7' && c.nuevo) && vp3.some((c) => c.dayId === 'd2' && c.sale.length > 0) && !vp3.some((c) => c.dayId === 'd1'), 'antes_despues', 'la ruta entera: solo los días que cambian (el día igual no sale, el nuevo sí, el que desaparece sale entero)')
    const r2 = nuevaRuta()
    r2.days[0].stops = r2.days[0].stops.filter((s) => s.id !== 's2')
    const vp4 = M.vistaPrevia(r2, res('cambio', { dayId: 'd1', accion: 'quitar', stopId: 's3' }, null, r2).accion)
    debe(vp4[0].antes.join() === 'Coliseo,Foro Romano', 'antes_despues', 'el «antes» es cómo está la ruta ahora, no cuando se mandó la recomendación')
  }

  // Aceptar una recomendación cambia la ruta de verdad, y la varita lo deja como estaba
  {
    const almacen = M.useRouteStore
    const abrir = () => {
      almacen.getState().setRoute(nuevaRuta())
      return almacen.getState().route
    }
    const ruta0 = abrir()
    debe(Boolean(ruta0) && ruta0.originalRoute != null, 'aplicar', 'al abrir una ruta se guarda la original (la que recupera la varita)')

    let r = almacen.getState().aplicarRecomendacion({ tipo: 'cambio', payload: { dayId: 'd1', accion: 'quitar', stopId: 's2' } })
    debe(r.ok === true && nombres(almacen.getState().route, 'd1').join() === 'Coliseo,Foro Romano', 'aplicar', `quitar una parada: ${JSON.stringify(nombres(almacen.getState().route, 'd1'))}`)
    debe(almacen.getState().route.days[0].originalSnapshot != null, 'aplicar', 'antes de cambiar el día se guardó cómo estaba (copia del día)')
    almacen.getState().restoreOriginalDay('d1')
    debe(nombres(almacen.getState().route, 'd1').join() === 'Coliseo,Arco de Constantino,Foro Romano', 'aplicar', '«Recuperar este día» deja el día como estaba antes de la recomendación')

    abrir()
    r = almacen.getState().aplicarRecomendacion({ tipo: 'cambio', payload: { dayId: 'd1', accion: 'mover', stopId: 's1', haciaIndice: 2 } })
    debe(r.ok === true && nombres(almacen.getState().route, 'd1').join() === 'Arco de Constantino,Foro Romano,Coliseo', 'aplicar', `mover una parada: ${JSON.stringify(nombres(almacen.getState().route, 'd1'))}`)

    abrir()
    r = almacen.getState().aplicarRecomendacion({ tipo: 'cambio', payload: { dayId: 'd1', accion: 'anadir', stop: stop('n1', 'Panteón', '', 41.8986, 12.4769), despuesDe: 's1' } })
    debe(r.ok === true && nombres(almacen.getState().route, 'd1').join() === 'Coliseo,Panteón,Arco de Constantino,Foro Romano', 'aplicar', `añadir una parada: ${JSON.stringify(nombres(almacen.getState().route, 'd1'))}`)
    debe(almacen.getState().route.days[0].stops[1].addedByUser === true, 'aplicar', 'lo añadido queda como del viajero')

    abrir()
    r = almacen.getState().aplicarRecomendacion({ tipo: 'dia', payload: { accion: 'sustituir', dayId: 'd2', day: dia('otro', 2, [stop('v1', 'Museos Vaticanos', '09:00', 41.9065, 12.4536)]) } })
    debe(r.ok === true && nombres(almacen.getState().route, 'd2').join() === 'Museos Vaticanos' && almacen.getState().route.days[1].id === 'd2', 'aplicar', 'sustituir un día entero (el día conserva su sitio)')
    almacen.getState().restoreOriginalDay('d2')
    debe(nombres(almacen.getState().route, 'd2').join() === 'Plaza de San Pedro,Basílica de San Pedro', 'aplicar', '«Recuperar este día» también recupera un día sustituido')

    abrir()
    const antesDias = almacen.getState().route.days.length
    r = almacen.getState().aplicarRecomendacion({ tipo: 'dia', payload: { accion: 'anadir', despuesDeDayId: 'd1', day: dia('nuevo', 3, [stop('t1', 'Trastevere', '10:00', 41.8893, 12.4698)], { title: 'Trastevere' }) } })
    const rutaMas = almacen.getState().route
    debe(r.ok === true && rutaMas.days.length === antesDias + 1, 'aplicar', `añadir un día: ${JSON.stringify(r)} · días ${rutaMas.days.length}`)
    debe(rutaMas.days.some((d) => d.stops.some((s) => s.name === 'Trastevere') && d.userAdded === true), 'aplicar', 'el día nuevo lleva sus paradas y es del viajero')
    almacen.getState().restoreOriginalRoute()
    debe(almacen.getState().route.days.length === antesDias && !almacen.getState().route.days.some((d) => d.stops.some((s) => s.name === 'Trastevere')), 'aplicar', '«Recuperar mi ruta» quita el día que se añadió y deja la ruta original')

    abrir()
    r = almacen.getState().aplicarRecomendacion({ tipo: 'ruta', payload: { baseRouteId: 'ruta-1', days: [dia('d1', 1, [stop('s1', 'Coliseo', '09:00', 41.89, 12.492)]), dia('d7', 2, [stop('z1', 'Villa Borghese', '10:00', 41.9142, 12.4923)])] } })
    const nueva = almacen.getState().route
    debe(r.ok === true && nueva.days.length === 2 && nombres(nueva, 'd7').join() === 'Villa Borghese' && nueva.days[1].userAdded === true, 'aplicar', 'la ruta entera cambia (los días nuevos son del viajero)')
    debe(nueva.days[0].originalSnapshot != null && nombres(nueva, 'd1').join() === 'Coliseo', 'aplicar', 'el día que ya existía guarda su copia de antes')
    almacen.getState().restoreOriginalRoute()
    const recuperada = almacen.getState().route
    debe(recuperada.days.map((d) => d.id).join() === 'd1,d2' && nombres(recuperada, 'd1').join() === 'Coliseo,Arco de Constantino,Foro Romano', 'aplicar', '«Recuperar mi ruta» deja la ruta como la prepararon, no la recomendada')

    // Aunque la ruta haya cambiado después, el administrador siempre puede aceptar: sustituye a lo que tiene ahora
    abrir()
    almacen.getState().removeStop('d1', 's2')
    r = almacen.getState().aplicarRecomendacion({ tipo: 'cambio', payload: { dayId: 'd1', accion: 'quitar', stopId: 's2' } })
    debe(r.ok === true && /ya no está/.test(r.nota ?? ''), 'aplicar', `quitar algo que ya no está: se acepta y lo dice (${r.nota})`)
    const antes = JSON.stringify(almacen.getState().route.days)
    r = almacen.getState().aplicarRecomendacion({ tipo: 'cambio', payload: { dayId: 'd9', accion: 'anadir', stop: stop('n9', 'Panteón', '', 41.8986, 12.4769) } })
    debe(r.ok === false && r.necesitaDia === true && r.diasPosibles.length === 2 && JSON.stringify(almacen.getState().route.days) === antes, 'aplicar', 'el día ya no existe: pide elegir día y no cambia nada hasta que lo elija')
    r = almacen.getState().aplicarRecomendacion({ tipo: 'cambio', payload: { dayId: 'd9', accion: 'anadir', stop: stop('n9', 'Panteón', '', 41.8986, 12.4769) } }, 'd2')
    debe(r.ok === true && nombres(almacen.getState().route, 'd2').includes('Panteón'), 'aplicar', 'con el día elegido, la parada entra en ese día')
    almacen.getState().restoreOriginalDay('d2')
    debe(!nombres(almacen.getState().route, 'd2').includes('Panteón'), 'aplicar', 'y la varita lo deja como estaba')

    abrir()
    r = almacen.getState().aplicarRecomendacion({ tipo: 'cambio', payload: { dayId: 'd1', accion: 'cambiar', stopId: 's2', stop: stop('n2', 'Panteón', '', 41.8986, 12.4769) } })
    debe(r.ok === true && nombres(almacen.getState().route, 'd1').join() === 'Coliseo,Panteón,Foro Romano', 'aplicar', `cambiar una parada por otra en su mismo sitio: ${JSON.stringify(nombres(almacen.getState().route, 'd1'))}`)
    almacen.getState().restoreOriginalDay('d1')
    debe(nombres(almacen.getState().route, 'd1').join() === 'Coliseo,Arco de Constantino,Foro Romano', 'aplicar', '«Recuperar este día» deshace el cambio de parada')

    abrir()
    r = almacen.getState().aplicarRecomendacion({ tipo: 'dia', payload: { accion: 'sustituir', dayId: 'd9', day: dia('otro', 2, [stop('v1', 'Museos Vaticanos', '09:00', 41.9065, 12.4536)]) } })
    debe(r.ok === false && r.necesitaDia === true, 'aplicar', 'sustituir un día que ya no existe: hay que elegir cuál')
    r = almacen.getState().aplicarRecomendacion({ tipo: 'dia', payload: { accion: 'sustituir', dayId: 'd9', day: dia('otro', 2, [stop('v1', 'Museos Vaticanos', '09:00', 41.9065, 12.4536)]) } }, 'd1')
    debe(r.ok === true && nombres(almacen.getState().route, 'd1').join() === 'Museos Vaticanos' && almacen.getState().route.days[0].id === 'd1', 'aplicar', 'con el día elegido lo sustituye (el día conserva su sitio)')
    almacen.getState().restoreOriginalDay('d1')
    debe(nombres(almacen.getState().route, 'd1').join() === 'Coliseo,Arco de Constantino,Foro Romano', 'aplicar', 'y la varita lo recupera')

    abrir()
    r = almacen.getState().aplicarRecomendacion({ tipo: 'ruta', payload: { baseRouteId: 'otra', days: [dia('x', 1, [stop('z1', 'Villa Borghese', '10:00', 41.9142, 12.4923)])] } })
    debe(r.ok === true && almacen.getState().route.days.length === 1, 'aplicar', 'una ruta entera sobre otra base también se acepta: sustituye a la de ahora')
    almacen.getState().restoreOriginalRoute()
    debe(almacen.getState().route.days.map((d) => d.id).join() === 'd1,d2', 'aplicar', 'y «Recuperar mi ruta» vuelve a la que prepararon')
  }
}

// (PGlite se cree en un navegador si ve una ventana: se quita la de mentira, que ya no hace falta.)
delete globalThis.window
delete globalThis.document
console.log('4. La migración y las reglas de seguridad (Postgres de verdad, PGlite)')
const db = new PGlite()
await db.exec(`
  create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
  create schema auth;
  create table auth.users (id uuid primary key default gen_random_uuid(), email text, is_anonymous boolean not null default false, created_at timestamptz default now());
  create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
  create function auth.uid() returns uuid language sql stable as $$ select nullif(auth.jwt() ->> 'sub', '')::uuid $$;
  create schema storage;
  create table storage.buckets (id text primary key, name text, public boolean default false);
  create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text references storage.buckets (id), name text, owner uuid, created_at timestamptz default now(), unique (bucket_id, name));
  alter table storage.objects enable row level security;
  create function storage.foldername(name text) returns text[] language sql immutable as $$ select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1] $$;
`)
const migraciones = fs.readdirSync('supabase/migrations').filter((f) => /^(0001|0002|0003|0012|0018|0020|0021|0023|0024)_/.test(f)).sort()
for (const archivo of migraciones) {
  try {
    await db.exec(fs.readFileSync(path.join('supabase/migrations', archivo), 'utf8'))
  } catch (error) {
    debe(false, 'migracion', `${archivo} no se aplica: ${error.message}`)
  }
}
debe(migraciones.includes('0020_cuentas.sql'), 'migracion', 'falta la migración 0020')
await db.exec(`
  grant usage on schema public, auth, storage to anon, authenticated, service_role;
  grant all on all tables in schema public to authenticated, service_role;
  grant select on all tables in schema public to anon;
  grant all on all tables in schema storage to authenticated, service_role;
  grant select on auth.users to authenticated, service_role;
  grant execute on all functions in schema public to authenticated, service_role;
  grant execute on all functions in schema auth to anon, authenticated, service_role;
  grant execute on all functions in schema storage to anon, authenticated, service_role;
`)
// (las funciones que la migración reservó al servidor)
await db.exec('revoke execute on function public.reclamar_anonimo(uuid, uuid) from authenticated')
await db.exec('revoke execute on function public.preparar_borrado(uuid) from authenticated')

const claims = (uid, anonimo = false) => JSON.stringify({ sub: uid, role: 'authenticated', is_anonymous: anonimo })
async function como(uid, fn, { anonimo = false, rol = 'authenticated' } = {}) {
  await db.exec('reset role')
  await db.query("select set_config('request.jwt.claims', $1, false)", [uid ? claims(uid, anonimo) : ''])
  await db.exec(`set role ${rol}`)
  try {
    return await fn()
  } finally {
    await db.exec('reset role')
    await db.query("select set_config('request.jwt.claims', '', false)")
  }
}
const q = async (sql, params = []) => (await db.query(sql, params)).rows
const servidor = async (fn) => {
  await db.exec('reset role')
  await db.exec('set role service_role')
  try {
    return await fn()
  } finally {
    await db.exec('reset role')
  }
}
const nuevoUsuario = async (email, anonimo) => (await q('insert into auth.users (email, is_anonymous) values ($1, $2) returning id', [email, anonimo]))[0].id

const rutaConVisto = JSON.stringify({ id: 'ruta-roma', days: [{ id: 'd1', stops: [{ id: 's1', checkedInAt: '2026-10-11T09:00:00Z' }, { id: 's2', checkedInAt: null }] }] })
const insertaViaje = (uid, ruta = rutaConVisto) => como(uid, async () => (await q('insert into public.trips (traveler_id, route) values ($1, $2::jsonb) returning id', [uid, ruta]))[0].id)
const subeFoto = (uid, viaje, nombre = 'a') =>
  como(uid, async () => {
    const ruta = `${uid}/${viaje}/${nombre}.jpg`
    await db.query("insert into storage.buckets (id, name) values ('fotos-viaje', 'fotos-viaje') on conflict do nothing")
    await q("insert into storage.objects (bucket_id, name, owner) values ('fotos-viaje', $1, $2), ('fotos-viaje', $3, $2)", [ruta, uid, ruta.replace('.jpg', '_min.jpg')])
    const fila = (await q('insert into public.trip_photos (user_id, trip_id, day_id, day_number, stop_name, storage_path, width, height, bytes) values ($1, $2, $3, 1, $4, $5, 1000, 700, 280000) returning id', [uid, viaje, 'd1', 'Foro Romano', ruta]))[0]
    await q("insert into public.trip_photo_meta (photo_id, taken_at, lat, lng, con_camara) values ($1, '2026-10-11T10:30:15', 41.89, 12.49, true)", [fila.id])
    return fila.id
  })

// 4.1 Esquema
{
  const tablas = ['app_config', 'trip_members', 'trip_recommendations', 'stop_visits', 'trip_photo_meta', 'achievements', 'passes', 'pass_members', 'trips', 'travelers', 'trip_photos']
  const rls = new Map((await q("select c.relname, c.relrowsecurity from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relkind = 'r'")).map((r) => [r.relname, r.relrowsecurity]))
  for (const t of tablas) debe(rls.get(t) === true, 'esquema', `la tabla ${t} no existe o no tiene las reglas de seguridad activas`)
  const cols = (await q("select column_name from information_schema.columns where table_schema = 'public' and table_name = 'travelers'")).map((r) => r.column_name)
  debe(['alta_cuenta', 'email', 'nombre'].every((c) => cols.includes(c)), 'esquema', 'travelers no lleva alta_cuenta, email y nombre')
  const sinLogros = await q('select count(*)::int as n from public.achievements')
  const sinPases = await q('select count(*)::int as n from public.passes')
  debe(sinLogros[0].n === 0 && sinPases[0].n === 0, 'esquema', 'logros y pases nacen vacías')
  const salida = (await q("select value #>> '{}' as v from public.app_config where key = 'salida_app'"))[0]?.v
  debe(salida === '2026-11-04', 'esquema', `la salida de la app guardada como dato es ${salida}`)
}

// 4.2 Entrar: de sesión anónima a cuenta (Caso A, mismo uid) y viajero fundador
const ana = await nuevoUsuario(null, true)
const viajeAna = await como(ana, async () => {
  await q('insert into public.travelers (id, is_anonymous) values ($1, true)', [ana])
  return (await q('insert into public.trips (traveler_id, route) values ($1, $2::jsonb) returning id', [ana, rutaConVisto]))[0].id
}, { anonimo: true })
{
  const antes = await como(ana, () => q('select public.marcar_alta() as alta'), { anonimo: true })
  debe(antes[0].alta === null, 'entrar', 'una sesión anónima no recibe fecha de alta')
  await db.query('update auth.users set email = $1, is_anonymous = false where id = $2', ['ana@correo.es', ana])
  const alta = (await como(ana, () => q('select public.marcar_alta() as alta')))[0].alta
  debe(alta !== null, 'entrar', 'al pasar a cuenta de verdad se guarda la fecha de alta')
  const otra = (await como(ana, () => q('select public.marcar_alta() as alta')))[0].alta
  debe(String(otra) === String(alta), 'entrar', 'la fecha de alta no cambia al repetir')
  const fila = (await q('select is_anonymous, alta_cuenta from public.travelers where id = $1', [ana]))[0]
  debe(fila.is_anonymous === false && fila.alta_cuenta !== null, 'entrar', 'travelers queda como cuenta de verdad')
  const viajes = await como(ana, () => q('select id from public.trips'))
  debe(viajes.length === 1 && viajes[0].id === viajeAna, 'entrar', 'el viaje que tenía el móvil sigue siendo suyo al hacer la cuenta (mismo uid)')
  const f = (d) => q("select public.es_fundador($1::timestamptz) as f", [d])
  debe((await f('2027-11-03T00:00:00Z'))[0].f === true, 'fundador', 'alta antes de salida + 1 año: fundador')
  debe((await f('2027-11-05T00:00:00Z'))[0].f === false, 'fundador', 'alta después de salida + 1 año: no es fundador')
  debe((await f(null))[0].f === false, 'fundador', 'sin alta no es fundador')
  const vista = await como(ana, () => q('select fundador from public.viajero_fundador where id = $1', [ana]))
  debe(vista[0]?.fundador === true, 'fundador', 'la vista dice que Ana (alta hoy) es fundadora')
  await db.exec(`update public.app_config set value = '"2025-01-01"' where key = 'salida_app'`)
  const movida = await como(ana, () => q('select fundador from public.viajero_fundador where id = $1', [ana]))
  debe(movida[0]?.fundador === false, 'fundador', 'si cambia la salida (dato), cambia la fecha límite sin tocar código')
  await db.exec(`update public.app_config set value = '"2026-11-04"' where key = 'salida_app'`)
  const escribirConfig = await lanza(() => como(ana, () => q(`update public.app_config set value = '"2020-01-01"' where key = 'salida_app'`)))
  const sigue = (await q("select value #>> '{}' as v from public.app_config where key = 'salida_app'"))[0].v
  debe(sigue === '2026-11-04', 'fundador', 'un viajero no puede cambiar la fecha de salida')
  void escribirConfig
  const sinSesion = await lanza(() => como(null, () => q('select public.marcar_alta()')))
  debe(sinSesion !== null, 'entrar', 'sin sesión no se puede marcar el alta')
}

// 4.3 Vistos de cada persona
const beto = await nuevoUsuario('beto@correo.es', false)
const carla = await nuevoUsuario('carla@correo.es', false)
await como(beto, () => q('insert into public.travelers (id, is_anonymous) values ($1, false)', [beto]))
await como(carla, () => q('insert into public.travelers (id, is_anonymous) values ($1, false)', [carla]))
{
  // Al entrar se copian los vistos de la ruta (idempotente).
  const copiar = () => como(ana, () => q("insert into public.stop_visits (trip_id, day_id, stop_id, visto_en) values ($1, 'd1', 's1', '2026-10-11T09:00:00Z') on conflict (user_id, trip_id, stop_id) do nothing returning id", [viajeAna]))
  debe((await copiar()).length === 1, 'vistos', 'el visto de la ruta se copia a la tabla de la persona')
  debe((await copiar()).length === 0, 'vistos', 'copiarlo otra vez no duplica nada')
  // Un invitado: el dueño lo invita.
  const invitar = await lanza(() => como(ana, () => q('insert into public.trip_members (trip_id, user_id) values ($1, $2)', [viajeAna, beto])))
  debe(invitar === null, 'invitados', `el dueño no puede invitar: ${invitar}`)
  const aSiMisma = await lanza(() => como(ana, () => q('insert into public.trip_members (trip_id, user_id) values ($1, $2)', [viajeAna, ana])))
  debe(aSiMisma !== null, 'invitados', 'el dueño no se invita a sí mismo')
  const seMeteSolo = await lanza(() => como(carla, () => q('insert into public.trip_members (trip_id, user_id) values ($1, $2)', [viajeAna, carla])))
  debe(seMeteSolo !== null, 'invitados', 'Carla no puede meterse sola en el viaje de Ana')
  const rolAdmin = await lanza(() => como(ana, () => q("insert into public.trip_members (trip_id, user_id, rol) values ($1, $2, 'admin')", [viajeAna, carla])))
  debe(rolAdmin !== null, 'invitados', 'no existe el rol administrador para un invitado (el único administrador es el dueño)')

  // Cada uno sus vistos
  const bVisto = await como(beto, () => q("insert into public.stop_visits (trip_id, day_id, stop_id) values ($1, 'd1', 's1') returning user_id", [viajeAna]))
  debe(bVisto[0].user_id === beto, 'vistos', 'el visto del invitado queda a su nombre')
  const veAna = await como(ana, () => q('select user_id from public.stop_visits where trip_id = $1', [viajeAna]))
  const veBeto = await como(beto, () => q('select user_id from public.stop_visits where trip_id = $1', [viajeAna]))
  debe(veAna.length === 1 && veAna[0].user_id === ana, 'vistos', 'Ana solo ve sus vistos, no los de Beto')
  debe(veBeto.length === 1 && veBeto[0].user_id === beto, 'vistos', 'Beto solo ve los suyos, no los de Ana')
  const aNombreDeOtro = await lanza(() => como(beto, () => q("insert into public.stop_visits (user_id, trip_id, day_id, stop_id) values ($1, $2, 'd1', 's9')", [ana, viajeAna])))
  debe(aNombreDeOtro !== null, 'vistos', 'nadie puede marcar un visto a nombre de otro')
  const ajeno = await lanza(() => como(carla, () => q("insert into public.stop_visits (trip_id, day_id, stop_id) values ($1, 'd1', 's1')", [viajeAna])))
  debe(ajeno !== null, 'vistos', 'quien no está invitado no puede marcar vistos en un viaje ajeno')
  const noVe = await como(carla, () => q('select id from public.stop_visits'))
  debe(noVe.length === 0, 'vistos', 'quien no está invitado no ve vistos de nadie')

  // El invitado NO cambia la ruta
  const verViaje = await como(beto, () => q('select id, route from public.trips'))
  debe(verViaje.length === 1 && verViaje[0].id === viajeAna, 'invitados', 'el invitado ve el viaje de Ana')
  await como(beto, () => q(`update public.trips set route = '{"id":"hackeada"}'::jsonb where id = $1`, [viajeAna]))
  const intacta = (await q('select route from public.trips where id = $1', [viajeAna]))[0].route
  debe(intacta.id === 'ruta-roma', 'invitados', 'el invitado NO puede cambiar la ruta (el cambio no hace nada)')
  await como(beto, () => q('delete from public.trips where id = $1', [viajeAna]))
  debe((await q('select 1 from public.trips where id = $1', [viajeAna])).length === 1, 'invitados', 'el invitado NO puede borrar el viaje')
  const robar = await lanza(() => como(beto, () => q('update public.trips set traveler_id = $1 where id = $2', [beto, viajeAna])))
  debe((await q('select traveler_id from public.trips where id = $1', [viajeAna]))[0].traveler_id === ana, 'invitados', `el invitado no puede quedarse con el viaje ${robar ?? ''}`)
  const extraño = await como(carla, () => q('select id from public.trips'))
  debe(extraño.length === 0, 'invitados', 'quien no está invitado no ve el viaje de Ana')
  const meVeo = await como(beto, () => q('select * from public.trip_members'))
  debe(meVeo.length === 1 && meVeo[0].user_id === beto, 'invitados', 'el invitado ve que está invitado')
  debe((await como(carla, () => q('select * from public.trip_members'))).length === 0, 'invitados', 'un extraño no ve las invitaciones')
  const nuevoViajePropio = await lanza(() => como(beto, () => q("insert into public.trips (traveler_id, route) values ($1, '{}'::jsonb)", [ana])))
  debe(nuevoViajePropio !== null, 'invitados', 'nadie crea un viaje a nombre de otro')

  // Las recomendaciones
  const rec = await como(beto, async () => (await q(`insert into public.trip_recommendations (trip_id, tipo, payload) values ($1, 'cambio', '{"quitar":"s2"}'::jsonb) returning id, estado, author_id`, [viajeAna]))[0])
  debe(rec.estado === 'pendiente' && rec.author_id === beto, 'recomendaciones', 'el invitado puede recomendar un cambio, queda pendiente y a su nombre')
  for (const tipo of ['dia', 'ruta']) debe((await lanza(() => como(beto, () => q(`insert into public.trip_recommendations (trip_id, tipo, payload) values ($1, '${tipo}', '{}'::jsonb)`, [viajeAna])))) === null, 'recomendaciones', `el invitado puede recomendar ${tipo}`)
  debe((await lanza(() => como(beto, () => q(`insert into public.trip_recommendations (trip_id, tipo, payload) values ($1, 'otra', '{}'::jsonb)`, [viajeAna])))) !== null, 'recomendaciones', 'solo hay tres tipos: cambio, dia y ruta')
  debe((await lanza(() => como(beto, () => q(`insert into public.trip_recommendations (trip_id, tipo, payload, estado) values ($1, 'cambio', '{}'::jsonb, 'aceptada')`, [viajeAna])))) !== null, 'recomendaciones', 'el invitado no puede mandar una recomendación ya aceptada')
  debe((await lanza(() => como(ana, () => q(`insert into public.trip_recommendations (trip_id, tipo, payload) values ($1, 'cambio', '{}'::jsonb)`, [viajeAna])))) !== null, 'recomendaciones', 'el administrador no se recomienda cosas a sí mismo')
  debe((await lanza(() => como(carla, () => q(`insert into public.trip_recommendations (trip_id, tipo, payload) values ($1, 'cambio', '{}'::jsonb)`, [viajeAna])))) !== null, 'recomendaciones', 'quien no está invitado no puede recomendar')
  const veAnaRec = await como(ana, () => q('select id from public.trip_recommendations'))
  debe(veAnaRec.length === 3, 'recomendaciones', 'el administrador ve las recomendaciones de su viaje')
  debe((await como(carla, () => q('select id from public.trip_recommendations'))).length === 0, 'recomendaciones', 'un extraño no ve las recomendaciones')
  await como(beto, () => q("update public.trip_recommendations set estado = 'aceptada' where id = $1", [rec.id]))
  debe((await q('select estado from public.trip_recommendations where id = $1', [rec.id]))[0].estado === 'pendiente', 'recomendaciones', 'el invitado no puede aceptar su propia recomendación')
  const cambiarPayload = await lanza(() => como(ana, () => q(`update public.trip_recommendations set payload = '{"otra":"cosa"}'::jsonb where id = $1`, [rec.id])))
  debe(cambiarPayload !== null, 'recomendaciones', 'el administrador solo acepta o rechaza: no reescribe lo que se recomendó')
  await como(ana, () => q("update public.trip_recommendations set estado = 'aceptada' where id = $1", [rec.id]))
  const decidida = (await q('select estado, decidida_por, decidida_en from public.trip_recommendations where id = $1', [rec.id]))[0]
  debe(decidida.estado === 'aceptada' && decidida.decidida_por === ana && decidida.decidida_en !== null, 'recomendaciones', 'el administrador acepta y queda apuntado quién y cuándo')
  debe((await q('select route from public.trips where id = $1', [viajeAna]))[0].route.id === 'ruta-roma', 'recomendaciones', 'aceptar una recomendación no cambia la ruta por sí solo (eso lo hace la app, con las pantallas)')
  await como(ana, () => q("update public.trip_recommendations set estado = 'rechazada' where tipo = 'dia'"))
  debe((await q("select estado from public.trip_recommendations where tipo = 'dia'"))[0].estado === 'rechazada', 'recomendaciones', 'el administrador puede rechazar')
  // El invitado sale solo
  const otroInv = await nuevoUsuario('dani@correo.es', false)
  await como(otroInv, () => q('insert into public.travelers (id, is_anonymous) values ($1, false)', [otroInv]))
  await como(ana, () => q('insert into public.trip_members (trip_id, user_id) values ($1, $2)', [viajeAna, otroInv]))
  await como(otroInv, () => q('delete from public.trip_members where user_id = $1', [otroInv]))
  debe((await q('select 1 from public.trip_members where user_id = $1', [otroInv])).length === 0, 'invitados', 'un invitado puede salirse del viaje')
  await como(carla, () => q('delete from public.trip_members where trip_id = $1', [viajeAna]))
  debe((await q('select 1 from public.trip_members where trip_id = $1', [viajeAna])).length === 1, 'invitados', 'un extraño no puede echar a nadie')
}

// 4.4 Fotos
const fotoAna = await subeFoto(ana, viajeAna, 'foro')
{
  debe((await como(ana, () => q('select id from public.trip_photos'))).length === 1, 'fotos', 'Ana ve su foto')
  debe((await como(beto, () => q('select id from public.trip_photos'))).length === 0, 'fotos', 'Beto, invitado al mismo viaje, NO ve las fotos de Ana (son privadas)')
  debe((await como(beto, () => q('select photo_id from public.trip_photo_meta'))).length === 0, 'fotos', 'Beto no ve la fecha ni el sitio de la foto de Ana')
  const meta = (await como(ana, () => q('select taken_at, con_camara, lat from public.trip_photo_meta where photo_id = $1', [fotoAna])))[0]
  debe(meta && meta.con_camara === true && Math.abs(meta.lat - 41.89) < 1e-6 && meta.taken_at !== null, 'fotos', 'la fecha y el sitio de la foto se guardan aparte, en nuestra tabla')
  const cols = (await q("select column_name from information_schema.columns where table_schema = 'public' and table_name = 'trip_photos'")).map((r) => r.column_name)
  debe(!cols.some((c) => /lat|lng|exif|gps/i.test(c)), 'fotos', 'la tabla de fotos no lleva ubicación: va en la tabla aparte')
  debe((await lanza(() => como(beto, () => q("insert into public.trip_photo_meta (photo_id) values ($1)", [fotoAna])))) !== null, 'fotos', 'nadie puede poner datos a la foto de otro')
  const archivos = await como(ana, () => q("select name from storage.objects where bucket_id = 'fotos-viaje'"))
  debe(archivos.length === 2, 'fotos', 'Ana ve los archivos de su foto (grande y pequeña)')
  debe((await como(beto, () => q("select name from storage.objects where bucket_id = 'fotos-viaje'"))).length === 0, 'fotos', 'Beto no ve los archivos de Ana')
  debe((await lanza(() => como(beto, () => q("insert into storage.objects (bucket_id, name, owner) values ('fotos-viaje', $1, $2)", [`${ana}/x/robada.jpg`, beto])))) !== null, 'fotos', 'nadie sube archivos a la carpeta de otro')
  debe((await lanza(() => como(ana, () => q("insert into public.trip_photos (user_id, trip_id, day_id, day_number, storage_path, width, height, bytes) values ($1, 'x', 'd', 1, 'p', 1, 1, 1)", [beto])))) !== null, 'fotos', 'nadie guarda una foto a nombre de otro')
}

// 4.5 Logros y pases: solo el servidor
{
  debe((await lanza(() => como(ana, () => q("insert into public.achievements (user_id, logro, destino) values ($1, 'primera', 'Roma')", [ana])))) !== null, 'logros', 'nadie se da un logro a sí mismo desde el móvil')
  await servidor(() => q("insert into public.achievements (user_id, logro, escalon, destino, trip_id) values ($1, 'Roma antigua', 'oro', 'Roma', $2), ($1, 'Vaticano', 'plata', 'Roma', null)", [ana, viajeAna]))
  debe((await como(ana, () => q('select id from public.achievements'))).length === 2, 'logros', 'Ana ve sus logros')
  debe((await como(beto, () => q('select id from public.achievements'))).length === 0, 'logros', 'Beto no ve los logros de Ana')
  debe((await lanza(() => servidor(() => q("insert into public.achievements (user_id, logro, escalon, destino) values ($1, 'Roma antigua', 'oro', 'Roma')", [ana])))) !== null, 'logros', 'el mismo logro y escalón no se repite en un destino')
  const pase = (await servidor(() => q("insert into public.passes (destino, comprador_id, tipo, para_id, usos_max, codigo) values ('Roma', $1, 'duo', null, 2, 'ROMA-DUO-1') returning id", [ana])))[0].id
  debe((await lanza(() => como(ana, () => q("insert into public.passes (destino, comprador_id, tipo, usos_max, codigo) values ('Roma', $1, 'uno', 1, 'X')", [ana])))) !== null, 'pases', 'nadie se regala un pase desde el móvil (no hay cobro: todo sigue abierto)')
  debe((await como(ana, () => q('select id from public.passes'))).length === 1, 'pases', 'el comprador ve su pase')
  debe((await como(beto, () => q('select id from public.passes'))).length === 0, 'pases', 'quien no lo usa no ve el pase')
  await servidor(() => q('insert into public.pass_members (pass_id, user_id) values ($1, $2)', [pase, beto]))
  debe((await como(beto, () => q('select id from public.passes'))).length === 1, 'pases', 'quien usa el pase (Dúo) lo ve')
  debe((await como(carla, () => q('select pass_id from public.pass_members'))).length === 0, 'pases', 'un extraño no ve quién usa el pase')
  debe((await lanza(() => servidor(() => q("insert into public.passes (destino, comprador_id, tipo, usos_max, usos_usados, codigo) values ('Roma', $1, 'uno', 1, 2, 'MAL')", [ana])))) !== null, 'pases', 'los usos usados no superan los usos del pase')
  debe((await lanza(() => servidor(() => q("insert into public.passes (destino, comprador_id, tipo, usos_max, codigo) values ('Roma', $1, 'vip', 1, 'MAL2')", [ana])))) !== null, 'pases', 'solo hay pase de uno, Dúo o grupo')
  debe((await lanza(() => como(ana, () => q('select public.reclamar_anonimo($1, $2)', [ana, beto])))) !== null, 'pases', 'desde el móvil nadie puede llamar a reclamar_anonimo (solo el servidor)')
}

/* ─────────────────────────── 5. El servidor: pasar lo del móvil y borrar la cuenta ─────────────────────────── */
console.log('5. Pasar lo del móvil a la cuenta (Caso B) y borrar la cuenta')
const fichas = new Map() // token → uid
const adminDe = () => ({
  auth: {
    getUser: async (token) => {
      const uid = fichas.get(token)
      if (!uid) return { data: { user: null }, error: { message: 'token no válido' } }
      const u = (await q('select id, is_anonymous, email from auth.users where id = $1', [uid]))[0]
      return u ? { data: { user: { id: u.id, is_anonymous: u.is_anonymous, email: u.email } }, error: null } : { data: { user: null }, error: { message: 'no existe' } }
    },
    admin: {
      deleteUser: async (id) => {
        try {
          await db.query('delete from auth.users where id = $1', [id])
          return { error: null }
        } catch (error) {
          return { error: { message: error.message } }
        }
      },
    },
  },
  storage: {
    from: (bucket) => ({
      list: async (prefijo) => {
        const filas = await q('select id, name from storage.objects where bucket_id = $1 and name like $2', [bucket, `${prefijo}/%`])
        const vistos = new Set()
        const entradas = []
        for (const f of filas) {
          const resto = f.name.slice(prefijo.length + 1)
          const [primero, ...mas] = resto.split('/')
          if (mas.length === 0) entradas.push({ id: f.id, name: primero })
          else if (!vistos.has(primero)) {
            vistos.add(primero)
            entradas.push({ id: null, name: primero })
          }
        }
        return { data: entradas, error: null }
      },
      move: async (de, a) => {
        try {
          await db.query('update storage.objects set name = $1 where bucket_id = $2 and name = $3', [a, bucket, de])
          return { error: null }
        } catch (error) {
          return { error: { message: error.message } }
        }
      },
      remove: async (rutas) => {
        await db.query('delete from storage.objects where bucket_id = $1 and name = any($2::text[])', [bucket, rutas])
        return { data: rutas, error: null }
      },
    }),
  },
  rpc: async (nombre, args) => {
    try {
      const filas = await servidor(() => q(`select public.${nombre}(${Object.keys(args).map((_, i) => `$${i + 1}`).join(', ')}) as r`, Object.values(args)))
      return { data: filas[0].r, error: null }
    } catch (error) {
      return { data: null, error: { message: error.message } }
    }
  },
})
const admin = adminDe()

// Un móvil con sesión anónima (Xavi), con su viaje, su foto, un visto y un «me gusta»; y su cuenta de verdad (Yara) que ya existía con otras cosas.
const xavi = await nuevoUsuario(null, true)
await como(xavi, () => q('insert into public.travelers (id, is_anonymous) values ($1, true)', [xavi]), { anonimo: true })
const viajeXavi = await insertaViaje(xavi)
const fotoXavi = await subeFoto(xavi, viajeXavi, 'trevi')
await como(xavi, () => q("insert into public.stop_visits (trip_id, day_id, stop_id) values ($1, 'd1', 's1')", [viajeXavi]))
await como(xavi, () => q("insert into public.place_likes (place_name, destination) values ('Fontana de Trevi', 'roma'), ('Panteón', 'roma')"))
const yara = await nuevoUsuario('yara@correo.es', false)
await como(yara, () => q('insert into public.travelers (id, is_anonymous) values ($1, false)', [yara]))
const viajeYara = await insertaViaje(yara, JSON.stringify({ id: 'ruta-yara', days: [] }))
await como(yara, () => q("insert into public.place_likes (place_name, destination) values ('Fontana de Trevi', 'roma')"))
fichas.set('tok-xavi', xavi)
fichas.set('tok-yara', yara)
fichas.set('tok-ana', ana)
fichas.set('tok-beto', beto)
{
  const sinToken = await reclamarCuenta(admin, null, 'tok-xavi')
  debe(sinToken.estado === 401, 'reclamar', 'sin token de la cuenta, 401')
  const alReves = await reclamarCuenta(admin, 'tok-xavi', 'tok-yara')
  debe(alReves.estado === 400, 'reclamar', 'si la cuenta "nueva" es anónima, no se pasa nada')
  const noAnonimo = await reclamarCuenta(admin, 'tok-yara', 'tok-ana')
  debe(noAnonimo.estado === 400, 'reclamar', 'si la sesión de origen no es anónima, no se pasa nada (nadie se lleva lo de otra cuenta)')
  const viejaMala = await reclamarCuenta(admin, 'tok-yara', 'tok-inventado')
  debe(viejaMala.estado === 400, 'reclamar', 'si la sesión anterior ya no vale, no se pasa nada')
  debe((await q('select 1 from public.trips where traveler_id = $1', [xavi])).length === 1, 'reclamar', 'los intentos malos no tocan nada')

  const r = await reclamarCuenta(admin, 'tok-yara', 'tok-xavi')
  debe(r.estado === 200 && r.cuerpo.ok === true, 'reclamar', `pasar lo del móvil falla: ${JSON.stringify(r)}`)
  const viajes = (await q('select id from public.trips where traveler_id = $1 order by id', [yara])).map((x) => x.id).sort()
  debe(viajes.length === 2 && viajes.includes(viajeXavi) && viajes.includes(viajeYara), 'reclamar', 'Yara tiene ahora su viaje y el del móvil')
  const foto = (await q('select user_id, storage_path from public.trip_photos where id = $1', [fotoXavi]))[0]
  debe(foto.user_id === yara && foto.storage_path.startsWith(`${yara}/`), 'reclamar', 'la foto pasó a la cuenta, con su ruta nueva')
  const objetos = (await q("select name from storage.objects where bucket_id = 'fotos-viaje' and name like $1", [`${yara}/%`])).map((x) => x.name)
  debe(objetos.length === 2 && objetos.includes(foto.storage_path) && objetos.some((n) => n.endsWith('_min.jpg')), 'reclamar', 'los archivos de la foto (grande y pequeña) se movieron a la carpeta de la cuenta')
  debe((await q("select 1 from storage.objects where name like $1", [`${xavi}/%`])).length === 0, 'reclamar', 'no queda nada en la carpeta de la sesión anónima')
  const likes = await q("select place_name from public.place_likes where user_id = $1 order by place_name", [yara])
  debe(likes.length === 2, 'reclamar', `los «me gusta» no se duplican (Trevi estaba en las dos): ${likes.length}`)
  debe((await q('select 1 from public.stop_visits where user_id = $1 and trip_id = $2', [yara, viajeXavi])).length === 1, 'reclamar', 'el visto pasó a la cuenta')
  debe((await q('select 1 from auth.users where id = $1', [xavi])).length === 0 && (await q('select 1 from public.travelers where id = $1', [xavi])).length === 0, 'reclamar', 'la sesión anónima, ya vacía, desaparece')
  const dosVeces = await reclamarCuenta(admin, 'tok-yara', 'tok-xavi')
  debe(dosVeces.estado === 400, 'reclamar', 'repetirlo no hace nada raro (la sesión anónima ya no existe)')
  debe((await como(yara, () => q('select id from public.trips'))).length === 2, 'reclamar', 'Yara ve sus dos viajes con sus reglas normales')
}

// Borrar la cuenta de Ana (dueña de un viaje con invitado, recomendaciones, foto, visto, logros, pase y «me gusta»).
{
  await como(ana, () => q("insert into public.place_likes (place_name, destination) values ('Panteón', 'roma')"))
  await subeFoto(ana, viajeAna, 'segunda')
  debe((await archivosDe(admin, ana)).length === 4, 'borrar', 'antes de borrar, Ana tiene 4 archivos (2 fotos, grande y pequeña)')
  const fotoBeto = await subeFoto(beto, 'viaje-de-beto', 'suya')
  await como(beto, () => q("insert into public.place_likes (place_name, destination) values ('Panteón', 'roma')"))
  await servidor(() => q("insert into public.achievements (user_id, logro, escalon, destino) values ($1, 'Vaticano', 'plata', 'Roma')", [beto]))
  const sinToken = await borrarCuenta(admin, null)
  debe(sinToken.estado === 401, 'borrar', 'sin token no se borra nada')
  const mala = await borrarCuenta(admin, 'tok-inventado')
  debe(mala.estado === 401 && (await q('select 1 from auth.users where id = $1', [ana])).length === 1, 'borrar', 'con un token falso no se borra nada')
  const r = await borrarCuenta(admin, 'tok-ana')
  debe(r.estado === 200 && r.cuerpo.ok === true && r.cuerpo.archivosBorrados === 4, 'borrar', `borrar la cuenta: ${JSON.stringify(r)}`)
  // Nada de Ana en NINGUNA tabla (se mira cada tabla de public, auth y storage, entera, como texto).
  const tablas = await q("select table_schema, table_name from information_schema.tables where table_type = 'BASE TABLE' and table_schema in ('public', 'auth', 'storage')")
  const restos = []
  for (const { table_schema: esquema, table_name: tabla } of tablas) {
    const n = (await q(`select count(*)::int as n from ${esquema}.${tabla} t where t::text like $1`, [`%${ana}%`]))[0].n
    if (n > 0) restos.push(`${esquema}.${tabla} (${n})`)
  }
  debe(restos.length === 0, 'borrar', `quedan cosas de Ana en: ${restos.join(', ')}`)
  // (Parte 2) El viaje tenía un invitado: NO se borra, pasa a administrarlo ese invitado.
  const viajeSigue = await q('select traveler_id from public.trips where id = $1', [viajeAna])
  debe(viajeSigue.length === 1 && viajeSigue[0].traveler_id === beto, 'borrar', 'el viaje compartido no se borra: pasa a administrarlo el invitado (Beto)')
  debe(r.cuerpo.traspasado?.viajes_traspasados === 1, 'borrar', `el servidor cuenta el viaje traspasado: ${JSON.stringify(r.cuerpo.traspasado)}`)
  // Lo de Beto (invitado) sigue, salvo lo que colgaba del viaje de Ana.
  debe((await q('select 1 from auth.users where id = $1', [beto])).length === 1, 'borrar', 'Beto sigue existiendo')
  debe((await q('select 1 from public.trip_photos where id = $1', [fotoBeto])).length === 1 && (await archivosDe(admin, beto)).length === 2, 'borrar', 'las fotos de Beto siguen (eran suyas)')
  debe((await q('select 1 from public.place_likes where user_id = $1', [beto])).length === 1, 'borrar', 'el «me gusta» de Beto sigue')
  debe((await q('select 1 from public.achievements where user_id = $1', [beto])).length === 1, 'borrar', 'los logros de Beto siguen (son de su cuenta, no del viaje de Ana)')
  debe((await q('select 1 from public.trip_members where user_id = $1', [beto])).length === 0 && (await q('select 1 from public.trip_recommendations where author_id = $1', [beto])).length === 0, 'borrar', 'las invitaciones y recomendaciones de ese viaje se fueron con él')
  // (Parte 2) El pase Dúo que compró Ana lo usaba Beto: se queda con Beto.
  const pase = await q('select comprador_id, usos_max, usos_usados from public.passes where codigo = $1', ['ROMA-DUO-1'])
  debe(pase.length === 1 && pase[0].comprador_id === beto && pase[0].usos_max === 2, 'borrar', 'el pase Dúo de Ana no se borra: se queda con Beto')
  debe((await q('select 1 from public.pass_members where user_id = $1', [beto])).length === 1, 'borrar', 'Beto sigue figurando en su pase')
}
// Borrar a un invitado: solo sale él.
{
  const zoe = await nuevoUsuario('zoe@correo.es', false)
  await como(zoe, () => q('insert into public.travelers (id, is_anonymous) values ($1, false)', [zoe]))
  const viajeZoe = await insertaViaje(zoe)
  await como(zoe, () => q('insert into public.trip_members (trip_id, user_id) values ($1, $2)', [viajeZoe, yara]))
  await como(yara, () => q("insert into public.stop_visits (trip_id, day_id, stop_id) values ($1, 'd1', 's1')", [viajeZoe]))
  await subeFoto(yara, viajeZoe, 'invitada')
  fichas.set('tok-zoe', zoe)
  const yaraViajes = (await q('select count(*)::int as n from public.trips where traveler_id = $1', [yara]))[0].n
  const r = await borrarCuenta(admin, 'tok-yara')
  debe(r.estado === 200, 'borrar_invitado', 'borrar la cuenta de la invitada funciona')
  debe((await q('select 1 from public.trips where id = $1', [viajeZoe])).length === 1, 'borrar_invitado', 'el viaje de Zoe sigue: al borrarse una invitada, solo sale ella')
  debe((await q('select 1 from public.trip_members where trip_id = $1', [viajeZoe])).length === 0, 'borrar_invitado', 'su invitación se fue')
  debe((await q('select 1 from public.stop_visits where trip_id = $1', [viajeZoe])).length === 0, 'borrar_invitado', 'sus vistos en el viaje de Zoe se fueron')
  const restos = []
  for (const { table_schema: esquema, table_name: tabla } of await q("select table_schema, table_name from information_schema.tables where table_type = 'BASE TABLE' and table_schema in ('public', 'auth', 'storage')")) {
    const n = (await q(`select count(*)::int as n from ${esquema}.${tabla} t where t::text like $1`, [`%${yara}%`]))[0].n
    if (n > 0) restos.push(`${esquema}.${tabla} (${n})`)
  }
  debe(restos.length === 0 && yaraViajes === 2, 'borrar_invitado', `quedan cosas de Yara en: ${restos.join(', ')}`)
}

/* ─────────────────────────── 5b. Invitar a alguien (parte 2) ─────────────────────────── */
console.log('5b. Invitar a alguien')
const rutaDe = (destino) => JSON.stringify({ id: `ruta-${destino}`, destination: destino, days: [] })
const cuenta = async (nombre) => {
  const id = await nuevoUsuario(`${nombre}@correo.es`, false)
  await como(id, () => q('insert into public.travelers (id, is_anonymous) values ($1, false)', [id]))
  fichas.set(`tok-${nombre}`, id)
  return id
}
const ALFABETO = /^[2-9A-DFWY]{8}$/
{
  const olga = await cuenta('olga')
  const pablo = await cuenta('pablo')
  const quique = await cuenta('quique')
  const rita = await nuevoUsuario(null, true)
  const viajeOlga = await insertaViaje(olga, rutaDe('Roma'))

  const inv = await como(olga, async () => (await q('select public.crear_invitacion($1) as r', [viajeOlga]))[0].r)
  debe(typeof inv.codigo === 'string' && /^[2-9A-Z]{8}$/.test(inv.codigo) && !/[01OIL]/.test(inv.codigo), 'invitar', `el código es corto y sin letras confusas: ${inv.codigo}`)
  debe(inv.usos_max === 1 && inv.trip_id === viajeOlga, 'invitar', 'una invitación sin pase vale para 1 persona por defecto')
  debe((await lanza(() => como(pablo, () => q('select public.crear_invitacion($1)', [viajeOlga])))) !== null, 'invitar', 'solo el administrador crea invitaciones (Pablo no puede)')
  debe((await lanza(() => como(rita, () => q('select public.crear_invitacion($1)', [viajeOlga]), { anonimo: true }))) !== null, 'invitar', 'con la sesión anónima no se crean invitaciones')
  debe((await lanza(() => como(null, () => q('select public.crear_invitacion($1)', [viajeOlga]), { rol: 'anon' }))) !== null, 'invitar', 'sin sesión no se puede llamar a crear_invitacion')
  debe((await lanza(() => como(olga, () => q("insert into public.trip_invitations (trip_id, codigo) values ($1, 'FALSA123')", [viajeOlga])))) !== null, 'invitar', 'nadie escribe una invitación a mano: solo las funciones')
  const dosUsos = await como(olga, async () => (await q('select public.crear_invitacion($1, null, 3) as r', [viajeOlga]))[0].r)
  debe(dosUsos.usos_max === 3 && dosUsos.codigo !== inv.codigo, 'invitar', 'se puede invitar a varias personas con una sola invitación y cada código es distinto')
  debe((await lanza(() => como(olga, () => q('select public.crear_invitacion($1, null, 51)', [viajeOlga])))) !== null, 'invitar', 'no se invita a más de 50 personas a la vez')

  // Ver, antes de entrar (también con la sesión anónima)
  const ver = await como(rita, async () => (await q('select public.ver_invitacion($1) as r', [inv.codigo.toLowerCase()]))[0].r, { anonimo: true })
  debe(ver.valida === true && ver.destino === 'Roma' && !('trip_id' in ver), 'invitar_ver', 'se puede ver a qué destino te invitan (con el código en minúsculas también) y no sale nada más del viaje')
  const verMal = await como(pablo, async () => (await q("select public.ver_invitacion('NOEXISTE') as r"))[0].r)
  debe(verMal.valida === false && verMal.motivo === 'no_existe', 'invitar_ver', 'un código que no existe no vale')

  // Canjear
  debe((await lanza(() => como(rita, () => q('select public.canjear_invitacion($1)', [inv.codigo]), { anonimo: true }))) !== null, 'invitar_canjear', 'con la sesión anónima no se canjea: primero hay que crear la cuenta')
  const entra = await como(pablo, async () => (await q('select public.canjear_invitacion($1) as r', [inv.codigo]))[0].r)
  debe(entra.trip_id === viajeOlga && entra.ya_estaba === false, 'invitar_canjear', 'Pablo entra en el viaje')
  debe((await como(pablo, () => q('select id from public.trips'))).length === 1, 'invitar_canjear', 'Pablo ve el viaje de Olga')
  debe((await q('select user_id, rol, invited_by from public.trip_members where trip_id = $1', [viajeOlga]))[0].rol === 'invitado', 'invitar_canjear', 'entra como invitado')
  await como(pablo, () => q(`update public.trips set route = '{"id":"cambiada"}'::jsonb where id = $1`, [viajeOlga]))
  debe((await q('select route from public.trips where id = $1', [viajeOlga]))[0].route.id === 'ruta-Roma', 'invitar_canjear', 'el invitado no puede cambiar la ruta')
  const otraVez = await como(pablo, async () => (await q('select public.canjear_invitacion($1) as r', [inv.codigo]))[0].r)
  debe(otraVez.ya_estaba === true, 'invitar_canjear', 'canjear dos veces no gasta otro uso')
  const suya = await como(olga, async () => (await q('select public.canjear_invitacion($1) as r', [inv.codigo]))[0].r)
  debe(suya.ya_estaba === true, 'invitar_canjear', 'el administrador abriendo su propia invitación no gasta ningún uso')
  debe((await q('select usos_usados from public.trip_invitations where id = $1', [inv.id]))[0].usos_usados === 1, 'invitar_canjear', 'solo se ha gastado 1 uso')
  const sinUsos = await lanza(() => como(quique, () => q('select public.canjear_invitacion($1)', [inv.codigo])))
  debe(sinUsos !== null && /Ya no quedan/.test(sinUsos), 'invitar_canjear', `con 1 plaza ya usada, nadie más entra: ${sinUsos}`)
  const verAgotada = await como(quique, async () => (await q('select public.ver_invitacion($1) as r', [inv.codigo]))[0].r)
  debe(verAgotada.valida === false && verAgotada.motivo === 'sin_usos', 'invitar_canjear', 'cuando ya no quedan usos, deja de valer')
  debe((await como(quique, () => q('select id from public.trips'))).length === 0, 'invitar_canjear', 'el que no entró no ve el viaje')

  // Varias plazas
  await como(quique, () => q('select public.canjear_invitacion($1)', [dosUsos.codigo]))
  const otro = await cuenta('otro')
  await como(otro, () => q('select public.canjear_invitacion($1)', [dosUsos.codigo]))
  debe((await q('select count(*)::int as n from public.trip_members where trip_id = $1', [viajeOlga]))[0].n === 3, 'invitar_canjear', 'una invitación de 3 plazas deja entrar a 3 personas distintas (Pablo ya estaba por la otra)')

  // Anular
  const paraAnular = await como(olga, async () => (await q('select public.crear_invitacion($1, null, 2) as r', [viajeOlga]))[0].r)
  debe((await lanza(() => como(pablo, () => q('select public.anular_invitacion($1)', [paraAnular.id])))) !== null, 'invitar_anular', 'solo el administrador anula')
  await como(olga, () => q('select public.anular_invitacion($1)', [paraAnular.id]))
  const nuevoMas = await cuenta('nuevo')
  const anulada = await lanza(() => como(nuevoMas, () => q('select public.canjear_invitacion($1)', [paraAnular.codigo])))
  debe(anulada !== null && /anulado/.test(anulada), 'invitar_anular', `una invitación anulada no se puede canjear: ${anulada}`)
  const verAnulada = await como(nuevoMas, async () => (await q('select public.ver_invitacion($1) as r', [paraAnular.codigo]))[0].r)
  debe(verAnulada.valida === false && verAnulada.motivo === 'anulada', 'invitar_anular', 'ver dice que está anulada')

  // Quién ve las invitaciones
  debe((await como(olga, () => q('select id from public.trip_invitations'))).length === 3, 'invitar_ver', 'el administrador ve todas sus invitaciones')
  debe((await como(pablo, () => q('select id from public.trip_invitations'))).length === 0, 'invitar_ver', 'un invitado no ve las invitaciones')

  // Con un Pase Dúo
  const duo = (await servidor(() => q("insert into public.passes (destino, comprador_id, tipo, usos_max, usos_usados, codigo) values ('Roma', $1, 'duo', 2, 1, 'DUO-OLGA') returning id", [olga])))[0].id
  await servidor(() => q('insert into public.pass_members (pass_id, user_id) values ($1, $2)', [duo, olga]))
  const viajeOlga2 = await insertaViaje(olga, rutaDe('Roma'))
  debe((await lanza(() => como(pablo, () => q('select public.crear_invitacion($1, $2)', [viajeOlga2, duo])))) !== null, 'invitar_pase', 'solo el administrador crea invitaciones')
  const ajeno = (await servidor(() => q("insert into public.passes (destino, comprador_id, tipo, usos_max, codigo) values ('Roma', $1, 'uno', 1, 'AJENO') returning id", [pablo])))[0].id
  debe((await lanza(() => como(olga, () => q('select public.crear_invitacion($1, $2)', [viajeOlga2, ajeno])))) !== null, 'invitar_pase', 'no se invita con el pase de otra persona')
  const invDuo = await como(olga, async () => (await q('select public.crear_invitacion($1, $2) as r', [viajeOlga2, duo]))[0].r)
  debe(invDuo.usos_max === 1 && invDuo.pass_id === duo, 'invitar_pase', 'un Dúo con su dueña dentro deja 1 plaza para invitar')
  const q1 = await como(quique, async () => (await q('select public.canjear_invitacion($1) as r', [invDuo.codigo]))[0].r)
  debe(q1.trip_id === viajeOlga2 && q1.con_pase === true, 'invitar_pase', 'Quique entra con el pase')
  const pDuo = (await q('select usos_usados, usos_max from public.passes where id = $1', [duo]))[0]
  debe(pDuo.usos_usados === 2 && pDuo.usos_max === 2, 'invitar_pase', 'al entrar recibe su uso del pase (2 de 2)')
  debe((await q('select 1 from public.pass_members where pass_id = $1 and user_id = $2', [duo, quique])).length === 1, 'invitar_pase', 'Quique figura como usuario del pase')
  debe((await como(quique, () => q('select id from public.passes'))).length === 1, 'invitar_pase', 'Quique ve su pase')
  const terceroDuo = await lanza(() => como(pablo, () => q('select public.canjear_invitacion($1)', [invDuo.codigo])))
  debe(terceroDuo !== null && /Ya no quedan/.test(terceroDuo), 'invitar_pase', 'un Dúo es 1 invitado: el segundo ya no entra')
  const verDuo = await como(pablo, async () => (await q('select public.ver_invitacion($1) as r', [invDuo.codigo]))[0].r)
  debe(verDuo.valida === false && verDuo.motivo === 'sin_usos', 'invitar_pase', 'con el pase sin usos, la invitación deja de valer')

  // Con un pase de grupo
  const grupo = (await servidor(() => q("insert into public.passes (destino, comprador_id, tipo, usos_max, usos_usados, codigo) values ('Roma', $1, 'grupo', 4, 1, 'GRUPO-OLGA') returning id", [olga])))[0].id
  await servidor(() => q('insert into public.pass_members (pass_id, user_id) values ($1, $2)', [grupo, olga]))
  const invGrupo = await como(olga, async () => (await q('select public.crear_invitacion($1, $2) as r', [viajeOlga2, grupo]))[0].r)
  debe(invGrupo.usos_max === 3, 'invitar_pase', 'un grupo de 4 usos con su dueña dentro deja 3 plazas')
  const invitados = []
  for (const n of ['g1', 'g2', 'g3']) {
    const id = await cuenta(n)
    invitados.push(id)
    await como(id, () => q('select public.canjear_invitacion($1)', [invGrupo.codigo]))
  }
  debe((await q('select usos_usados from public.passes where id = $1', [grupo]))[0].usos_usados === 4, 'invitar_pase', 'tantos invitados como usos: 3 entran y el pase queda en 4 de 4')
  const g4 = await cuenta('g4')
  debe((await lanza(() => como(g4, () => q('select public.canjear_invitacion($1)', [invGrupo.codigo])))) !== null, 'invitar_pase', 'el cuarto invitado del grupo ya no entra')
  const alMismoViaje = await q('select count(*)::int as n from public.trip_members where trip_id = $1', [viajeOlga2])
  debe(alMismoViaje[0].n === 4, 'invitar_pase', 'en el viaje hay 4 invitados (1 del Dúo y 3 del grupo)')
  void invitados
}

/* ─────────────────────────── 5c. Borrar la cuenta: que no pierdan nada los demás (parte 2) ─────────────────────────── */
console.log('5c. Borrar la cuenta sin perjudicar a los demás')
const restosDe = async (uid) => {
  const restos = []
  for (const { table_schema: esquema, table_name: tabla } of await q("select table_schema, table_name from information_schema.tables where table_type = 'BASE TABLE' and table_schema in ('public', 'auth', 'storage')")) {
    const n = (await q(`select count(*)::int as n from ${esquema}.${tabla} t where t::text like $1`, [`%${uid}%`]))[0].n
    if (n > 0) restos.push(`${esquema}.${tabla} (${n})`)
  }
  return restos
}
{
  const ada = await cuenta('ada')
  const m1 = await cuenta('m1')
  const m2 = await cuenta('m2')
  const bob = await cuenta('bob')
  const cris = await cuenta('cris')
  const dora = await cuenta('dora')
  const viajeAda = await insertaViaje(ada, rutaDe('Roma'))
  const viajeSolo = await insertaViaje(ada, rutaDe('Lisboa'))
  // M2 entró DESPUÉS de M1 (se fija la hora para que no dependa del reloj).
  await servidor(() => q("insert into public.trip_members (trip_id, user_id, invited_by, created_at) values ($1, $2, $3, '2026-10-10T10:00:00Z'), ($1, $4, $3, '2026-10-12T10:00:00Z')", [viajeAda, m1, ada, m2]))
  await como(m1, () => q("insert into public.stop_visits (trip_id, day_id, stop_id) values ($1, 'd1', 's1')", [viajeAda]))
  await como(m2, () => q("insert into public.stop_visits (trip_id, day_id, stop_id) values ($1, 'd1', 's1')", [viajeAda]))
  await como(ada, () => q("insert into public.stop_visits (trip_id, day_id, stop_id) values ($1, 'd1', 's1'), ($2, 'd1', 's1')", [viajeAda, viajeSolo]))
  await como(m1, () => q(`insert into public.trip_recommendations (trip_id, tipo, payload) values ($1, 'cambio', '{"x":1}'::jsonb)`, [viajeAda]))
  await como(m2, () => q(`insert into public.trip_recommendations (trip_id, tipo, payload) values ($1, 'cambio', '{"x":2}'::jsonb)`, [viajeAda]))
  await como(ada, () => q('select public.crear_invitacion($1)', [viajeAda]))
  await servidor(() => q("insert into public.achievements (user_id, logro, escalon, destino) values ($1, 'X', 'oro', 'Roma')", [ada]))
  await subeFoto(ada, viajeAda, 'ada1')
  await subeFoto(m1, viajeAda, 'm1foto')
  // Pases: un Dúo de Ada con Bob dentro; uno de grupo que Ada compró PARA otros (ella no lo usa); uno de Bob que Ada usaba; uno solo suyo; uno que le regaló Bob.
  const pDuo = (await servidor(() => q("insert into public.passes (destino, comprador_id, tipo, usos_max, usos_usados, codigo) values ('Roma', $1, 'duo', 2, 2, 'ADA-DUO') returning id", [ada])))[0].id
  await servidor(() => q('insert into public.pass_members (pass_id, user_id, unido_en) values ($1, $2, now()), ($1, $3, now() + interval \'1 minute\')', [pDuo, ada, bob]))
  const pGrupo = (await servidor(() => q("insert into public.passes (destino, comprador_id, tipo, usos_max, usos_usados, codigo) values ('Roma', $1, 'grupo', 3, 2, 'ADA-GRUPO') returning id", [ada])))[0].id
  await servidor(() => q("insert into public.pass_members (pass_id, user_id, unido_en) values ($1, $2, '2026-10-01T10:00:00Z'), ($1, $3, '2026-10-02T10:00:00Z')", [pGrupo, cris, dora]))
  const pDeBob = (await servidor(() => q("insert into public.passes (destino, comprador_id, tipo, usos_max, usos_usados, codigo) values ('Roma', $1, 'duo', 2, 2, 'BOB-DUO') returning id", [bob])))[0].id
  await servidor(() => q('insert into public.pass_members (pass_id, user_id) values ($1, $2), ($1, $3)', [pDeBob, bob, ada]))
  const pSolo = (await servidor(() => q("insert into public.passes (destino, comprador_id, tipo, usos_max, usos_usados, codigo) values ('Roma', $1, 'uno', 1, 1, 'ADA-SOLA') returning id", [ada])))[0].id
  await servidor(() => q('insert into public.pass_members (pass_id, user_id) values ($1, $2)', [pSolo, ada]))
  const pRegalo = (await servidor(() => q("insert into public.passes (destino, comprador_id, tipo, para_id, usos_max, usos_usados, codigo) values ('Roma', $1, 'uno', $2, 1, 0, 'REGALO-ADA') returning id", [bob, ada])))[0].id

  const r = await borrarCuenta(admin, 'tok-ada')
  debe(r.estado === 200 && r.cuerpo.ok === true, 'borrar2', `borrar a Ada: ${JSON.stringify(r)}`)
  debe((await restosDe(ada)).length === 0, 'borrar2', `quedan cosas de Ada en: ${(await restosDe(ada)).join(', ')}`)
  debe((await archivosDe(admin, ada)).length === 0, 'borrar2', 'las fotos de Ada se borraron del almacenamiento')

  // El viaje compartido
  const t = await q('select traveler_id from public.trips where id = $1', [viajeAda])
  debe(t.length === 1 && t[0].traveler_id === m1, 'borrar2_viaje', 'el viaje con invitados pasa al que entró primero (M1), no al segundo')
  debe((await q('select 1 from public.trip_members where trip_id = $1 and user_id = $2', [viajeAda, m1])).length === 0, 'borrar2_viaje', 'M1 deja de ser invitado: ahora administra')
  debe((await q('select 1 from public.trip_members where trip_id = $1 and user_id = $2', [viajeAda, m2])).length === 1, 'borrar2_viaje', 'M2 sigue siendo invitado')
  debe((await q('select 1 from public.stop_visits where trip_id = $1 and user_id = $2', [viajeAda, m1])).length === 1 && (await q('select 1 from public.stop_visits where trip_id = $1 and user_id = $2', [viajeAda, m2])).length === 1, 'borrar2_viaje', 'los vistos de M1 y M2 siguen')
  debe((await q('select 1 from public.trip_recommendations where author_id = $1', [m1])).length === 0 && (await q('select 1 from public.trip_recommendations where author_id = $1', [m2])).length === 1, 'borrar2_viaje', 'la recomendación de M1 (ahora administrador) se fue; la de M2 sigue')
  debe((await q('select 1 from public.trip_invitations where trip_id = $1', [viajeAda])).length === 0, 'borrar2_viaje', 'las invitaciones que mandó Ada dejan de valer')
  debe((await como(m1, () => q('update public.trips set route = route where id = $1 returning id', [viajeAda]))).length === 1, 'borrar2_viaje', 'M1 ya es administrador: puede cambiar la ruta')
  debe((await como(m2, () => q('update public.trips set route = route where id = $1 returning id', [viajeAda]))).length === 0, 'borrar2_viaje', 'M2 sigue sin poder cambiarla')
  debe((await q('select 1 from public.trip_photos where user_id = $1', [m1])).length === 1, 'borrar2_viaje', 'la foto de M1 sigue (era suya)')
  debe((await q('select 1 from public.trips where id = $1', [viajeSolo])).length === 0, 'borrar2_viaje', 'el viaje de Ada SIN invitados se borró con ella')
  debe((await q('select 1 from public.achievements where user_id = $1', [ada])).length === 0, 'borrar2_viaje', 'sus logros se borraron')

  // Los pases
  const duo = (await q('select comprador_id, usos_max, usos_usados from public.passes where id = $1', [pDuo]))[0]
  debe(duo && duo.comprador_id === bob && duo.usos_max === 1 && duo.usos_usados === 1, 'borrar2_pases', 'el Dúo de Ada se queda con Bob; se va solo el uso de Ada (1 de 1)')
  debe((await q('select 1 from public.pass_members where pass_id = $1 and user_id = $2', [pDuo, bob])).length === 1, 'borrar2_pases', 'Bob sigue usando su pase')
  const grupo = (await q('select comprador_id, usos_max, usos_usados from public.passes where id = $1', [pGrupo]))[0]
  debe(grupo && grupo.comprador_id === cris && grupo.usos_max === 3 && grupo.usos_usados === 2, 'borrar2_pases', 'el grupo que Ada compró para otros se queda con ellos, sin tocar los usos (3, 2 usados); lo lleva la primera que lo usó (Cris)')
  debe((await q('select count(*)::int as n from public.pass_members where pass_id = $1', [pGrupo]))[0].n === 2, 'borrar2_pases', 'Cris y Dora siguen en el grupo')
  const deBob = (await q('select comprador_id, usos_max, usos_usados from public.passes where id = $1', [pDeBob]))[0]
  debe(deBob && deBob.comprador_id === bob && deBob.usos_max === 1 && deBob.usos_usados === 1, 'borrar2_pases', 'en el pase de Bob que Ada usaba se va solo el uso de Ada')
  debe((await q('select 1 from public.pass_members where pass_id = $1 and user_id = $2', [pDeBob, bob])).length === 1, 'borrar2_pases', 'Bob sigue en su pase')
  debe((await q('select 1 from public.passes where id = $1', [pSolo])).length === 0, 'borrar2_pases', 'el pase que solo usaba Ada se borró')
  const regalo = (await q('select comprador_id, para_id from public.passes where id = $1', [pRegalo]))[0]
  debe(regalo && regalo.comprador_id === bob && regalo.para_id === null, 'borrar2_pases', 'el pase que Bob le regaló a Ada sigue siendo de Bob, ya sin destinataria')
  debe((await q('select 1 from public.passes where destino = $1', ['Roma'])).length >= 4, 'borrar2_pases', 'no se perdió ningún pase de los demás')
}
{
  // Un administrador sin invitados que SÍ tiene un pase que otros usan.
  const eva = await cuenta('eva')
  const fran = await cuenta('fran')
  const viajeEva = await insertaViaje(eva, rutaDe('Roma'))
  const pase = (await servidor(() => q("insert into public.passes (destino, comprador_id, tipo, usos_max, usos_usados, codigo) values ('Roma', $1, 'duo', 2, 1, 'EVA-DUO') returning id", [eva])))[0].id
  await servidor(() => q('insert into public.pass_members (pass_id, user_id) values ($1, $2)', [pase, fran]))
  const r = await borrarCuenta(admin, 'tok-eva')
  debe(r.estado === 200, 'borrar2', 'borrar a Eva')
  debe((await q('select 1 from public.trips where id = $1', [viajeEva])).length === 0, 'borrar2', 'su viaje sin invitados se borra')
  const p = (await q('select comprador_id, usos_max, usos_usados from public.passes where id = $1', [pase]))[0]
  debe(p && p.comprador_id === fran && p.usos_max === 2 && p.usos_usados === 1, 'borrar2', 'el pase que compró para Fran (que no usaba) se queda con él, sin tocar los usos')
  debe((await restosDe(eva)).length === 0, 'borrar2', `quedan cosas de Eva en: ${(await restosDe(eva)).join(', ')}`)
}
{
  // Si preparar_borrado falla, no se borra nada (ni archivos ni usuario).
  const gus = await cuenta('gus')
  const viajeGus = await insertaViaje(gus, rutaDe('Roma'))
  await subeFoto(gus, viajeGus, 'gus1')
  const adminRoto = { ...admin, rpc: async () => ({ data: null, error: { message: 'boom' } }) }
  const r = await borrarCuenta(adminRoto, 'tok-gus')
  debe(r.estado === 500 && (await q('select 1 from auth.users where id = $1', [gus])).length === 1 && (await archivosDe(admin, gus)).length === 2, 'borrar2', 'si falla la preparación del borrado no se borra nada (ni el usuario ni las fotos)')
  debe((await lanza(() => como(gus, () => q('select public.preparar_borrado($1)', [gus])))) !== null, 'borrar2', 'desde el móvil nadie puede llamar a preparar_borrado')
}

/* ─────────────────────────── 5d. Recomendaciones: estados y reglas (parte 2) ─────────────────────────── */
console.log('5d. Recomendaciones')
{
  const hugo = await cuenta('hugo')
  const ines = await cuenta('ines')
  const viajeHugo = await insertaViaje(hugo, rutaDe('Roma'))
  await como(hugo, () => q('insert into public.trip_members (trip_id, user_id) values ($1, $2)', [viajeHugo, ines]))
  const rec = await como(ines, async () => (await q(`insert into public.trip_recommendations (trip_id, tipo, payload) values ($1, 'cambio', '{"dayId":"d1","accion":"quitar","stopId":"s2"}'::jsonb) returning id`, [viajeHugo]))[0])
  debe((await lanza(() => como(hugo, () => q("update public.trip_recommendations set estado = 'ya_no_encaja' where id = $1", [rec.id])))) !== null, 'recomendaciones2', 'el estado «ya no encaja» ya no existe en la base de datos')
  await como(hugo, () => q("update public.trip_recommendations set estado = 'aceptada' where id = $1", [rec.id]))
  const f = (await q('select estado, decidida_por, decidida_en from public.trip_recommendations where id = $1', [rec.id]))[0]
  debe(f.estado === 'aceptada' && f.decidida_por === hugo && f.decidida_en !== null, 'recomendaciones2', 'el administrador siempre puede aceptar una recomendación, y queda apuntado')
  const rec2 = await como(ines, async () => (await q(`insert into public.trip_recommendations (trip_id, tipo, payload) values ($1, 'dia', '{}'::jsonb) returning id`, [viajeHugo]))[0])
  await como(ines, () => q("update public.trip_recommendations set estado = 'aceptada' where id = $1", [rec2.id]))
  debe((await q('select estado from public.trip_recommendations where id = $1', [rec2.id]))[0].estado === 'pendiente', 'recomendaciones2', 'la invitada no puede aceptar la suya')
  debe((await lanza(() => como(hugo, () => q("update public.trip_recommendations set estado = 'inventado' where id = $1", [rec2.id])))) !== null, 'recomendaciones2', 'no existen más estados que los tres')
}

/* ─────────────────────────── 6. Las rutas del servidor ─────────────────────────── */
console.log('6. Las rutas del servidor')
{
  const rutas = new Map()
  const app = { post: (p, h) => rutas.set(`POST ${p}`, h), delete: (p, h) => rutas.set(`DELETE ${p}`, h) }
  registrarRutasCuentas(app, null)
  debe(rutas.has('POST /api/cuenta/reclamar') && rutas.has('DELETE /api/cuenta'), 'rutas', 'las dos rutas se registran')
  const respuesta = () => {
    const r = { estado: 0, cuerpo: null, status(n) { r.estado = n; return r }, json(c) { r.cuerpo = c; return r } }
    return r
  }
  for (const clave of ['POST /api/cuenta/reclamar', 'DELETE /api/cuenta']) {
    const r = respuesta()
    await rutas.get(clave)({ headers: {}, get: () => '', body: {} }, r)
    debe(r.estado === 503 && /clave de servicio/.test(r.cuerpo?.error ?? ''), 'rutas', `${clave} sin clave de servicio responde 503 con aviso claro`)
  }
  const servida = new Map()
  registrarRutasCuentas({ post: (p, h) => servida.set(p, h), delete: (p, h) => servida.set(p, h) }, adminDe())
  const r = respuesta()
  await servida.get('/api/cuenta')({ headers: { authorization: 'Bearer tok-zoe' }, get: (n) => (n.toLowerCase() === 'authorization' ? 'Bearer tok-zoe' : ''), body: {} }, r)
  debe(r.estado === 200 && (await q('select 1 from auth.users where id = $1', [fichas.get('tok-zoe')])).length === 0, 'rutas', 'DELETE /api/cuenta con token válido borra la cuenta')
  // Con el servidor real encendido (si está): sin clave de servicio responde 503; con ella, 401 sin token.
  const API = process.env.API_URL ?? 'http://localhost:8787'
  try {
    const x = await fetch(`${API}/api/cuenta`, { method: 'DELETE' })
    debe([503, 401].includes(x.status), 'servidor_real', `DELETE /api/cuenta sin token en el servidor real responde ${x.status} (se esperaba 503 o 401)`)
    const y = await fetch(`${API}/api/cuenta/reclamar`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
    debe([503, 401].includes(y.status), 'servidor_real', `POST /api/cuenta/reclamar sin token en el servidor real responde ${y.status}`)
  } catch {
    console.log(`   (el servidor ${API} no está encendido: no se comprueban las rutas reales)`)
  }
}

/* ─────────────────────────── 7. Que la app sea la de hoy con el interruptor apagado ─────────────────────────── */
console.log('7. Con el interruptor apagado, todo igual')
{
  const app = fs.readFileSync('src/App.tsx', 'utf8')
  debe(/<PuertaDeCuenta \/>/.test(app) && !/cuentasActivas/.test(app), 'apagado', 'App.tsx solo monta la puerta, que decide sola')
  const fotos = fs.readFileSync('src/lib/fotosViaje.ts', 'utf8')
  debe(/conCuentas \? pasosDeCompresion\(.*\) : \[\{ lado: LADO_MAXIMO_PX, calidad: CALIDAD_JPEG \}\]/.test(fotos), 'apagado', 'sin cuentas, la foto se prepara con el único intento de siempre (1.600 px, 0,82)')
  debe(/if \(preparada\.datos && cuentasActivas\(\)\)/.test(fotos), 'apagado', 'sin cuentas no se escribe en trip_photo_meta')
  const trip = fs.readFileSync('src/lib/tripPersistence.ts', 'utf8')
  debe(trip.includes("if (!conInvitados) consulta = consulta.eq('traveler_id', travelerId)") && trip.includes('if (cuentasActivas()) {'), 'apagado', 'tripPersistence.ts: con las cuentas apagadas se piden solo los viajes propios y se guarda como siempre')
  const motor = ['shared/routeEngine', 'server/engine']
  const tocadosMotor = []
  for (const carpetaMotor of motor) for (const f of fs.readdirSync(carpetaMotor)) if (/cuenta/i.test(f)) tocadosMotor.push(f)
  debe(tocadosMotor.length === 0, 'motor', 'no hay nada de cuentas dentro del motor de rutas')
}

fs.rmSync(carpeta, { recursive: true, force: true })
console.log(`\nPrueba de las cuentas (partes 1 y 2): ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
if (fallos.length > 0) {
  for (const f of fallos.slice(0, 60)) console.log(`  FALLO [${f.regla}] ${f.texto}`)
  process.exitCode = 1
}
